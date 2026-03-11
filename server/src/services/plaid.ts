import { ValidationError, AlreadyExistsError, AuthenticationError, NotFoundError } from "../utils/errors.js";
import { UserModel } from "../models/user.js";
import { env } from "../config/env.js";
import type { LinkTokenCreateRequest, ItemPublicTokenExchangeRequest, SandboxPublicTokenCreateRequest, Transaction, RemovedTransaction, TransactionsSyncRequest, AccountBase } from 'plaid';
import { CountryCode, Products } from 'plaid';
import { plaidClient } from "../config/plaidConfig.js";
import { SandboxInstitutions } from "../config/plaidConfig.js";
import { PlaidItemModel } from "../models/plaidItem.js";
import { encrypt, decrypt } from "../utils/encryption.js";
import { BankAccountModel } from "../models/bankAccount.js";

interface SavePlaidItemParams {
  userId: string; // FK taken from the current user's ID (user.id)
  plaidItemId: string; // get it from the response from sandbox
  encryptedAccessToken: string; 
  institutionId: string; 
  institutionName: string; 
  status: string; 
  cursor: string | null;
}

export const PlaidService = {
  sandboxGetAccessToken: async ({ userId }: { userId: string}) => {
    try {
      const instId = SandboxInstitutions.FIRST_PLATYPUS_BANK; // Plaid sandbox institution (First Platypus Bank)

      const publicTokenRequest: SandboxPublicTokenCreateRequest = {
        institution_id: instId, 
        initial_products: [Products.Transactions, Products.Auth, Products.Assets],
      };
      const publicTokenResponse = await plaidClient.sandboxPublicTokenCreate(publicTokenRequest);
      const publicToken = publicTokenResponse.data.public_token;
      
      const { accessToken, itemId } = await PlaidService.exchangePublicToken(userId, publicToken);

      const savedItem = await PlaidService.savePlaidItem({
        userId,
        plaidItemId: itemId,
        encryptedAccessToken: encrypt(accessToken),
        institutionId: instId,
        institutionName: SandboxInstitutions.FIRST_PLATYPUS_BANK_NAME,
        status: 'active',
        cursor: null,
      });

      return savedItem;

    } catch (error) {
      logPlaidError(error)
      throw error;
    }
  },

  createLinkToken: async(userId: string) => {
    try {
      const request: LinkTokenCreateRequest = {
        user: { client_user_id: userId },
        client_name: 'Northbound',
        products: [Products.Transactions],
        country_codes: [CountryCode.Us],
        language: 'en',
      };
      const response = await plaidClient.linkTokenCreate(request);
      return response.data.link_token;
    } catch (error) {
      logPlaidError(error)
      throw error;
    }
  },

  exchangePublicToken: async (userId: string, publicToken: string) => {
    try {
      const request: ItemPublicTokenExchangeRequest = { public_token: publicToken };
      const response = await plaidClient.itemPublicTokenExchange(request);
      return {
        accessToken: response.data.access_token,
        itemId: response.data.item_id
      }
    } catch (error) {
      logPlaidError(error)
      throw error;
    }
  },

  savePlaidItem: async ({ userId, plaidItemId, encryptedAccessToken, institutionId, institutionName, status, cursor }: SavePlaidItemParams) => {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new NotFoundError("User", userId);
    }

    if (!plaidItemId || plaidItemId.trim() === "") {
      throw new ValidationError("Invalid plaid item id", { plaidItemId });
    }

    if (!encryptedAccessToken || encryptedAccessToken.trim() === "") {
      throw new ValidationError("Invalid access token");
    }

    const result =  await PlaidItemModel.create({
      userId,
      plaidItemId,
      encryptedAccessToken,
      institutionId: institutionId ?? null,
      institutionName: institutionName ?? null,
      status,
      cursor: cursor ?? null,
      environment: env.PLAID_ENV,
    });

    return {
      id: result.id,
      institutionName: result.institution_name
    }
  },

  getPlaidItem: async ({ plaidId }: { plaidId: string }) => {
    if (!plaidId || plaidId.trim() === "") {
      throw new ValidationError("Invalid Plaid ID", { plaidId });
    }

    const plaidItem = await PlaidItemModel.findById(plaidId);
    if (!plaidItem) {
      throw new NotFoundError("PlaidItem", plaidId);
    }

    return plaidItem;
  },

  getAllPlaidItems: async ({ userId }: { userId: string }) => {
    if (!userId || userId.trim() === "") {
      throw new ValidationError("Invalid user ID", { userId });
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      throw new NotFoundError("User", userId);
    }

    return await PlaidItemModel.findAllByUserId(userId);
  },

  fetchPlaidItemAccounts: async (plaidId: string) => {
    if (!plaidId || plaidId.trim() == "") {
      throw new ValidationError("Invalid plaid ID", plaidId)
    }

    const plaidItem = await PlaidItemModel.findById(plaidId);
    if (!plaidItem) {
      throw new NotFoundError("PlaidItem", plaidId);
    }

    const accessToken = decrypt(plaidItem.encrypted_access_token);

    try {
      const response = await plaidClient.accountsGet({ access_token: accessToken });
      return response.data.accounts;
    } catch (error) {
      logPlaidError(error)
      throw error;
    }
  },

  syncAccounts: async (plaidId: string) => {
    const accounts = await PlaidService.fetchPlaidItemAccounts(plaidId)

    const accountsForUpsert = accounts.map(account => ({
      plaidAccountId: account.account_id,
      plaidItemId: plaidId,
      mask: account.mask ?? null,
      name: account.name,
      officialName: account.official_name ?? null,
      type: account.type,
      subtype: account.subtype ?? null,
      currentBalance: account.balances?.current ?? null,
      availableBalance: account.balances?.available ?? null
    }))

    await BankAccountModel.bulkUpsertPlaidAccounts(accountsForUpsert)

    return accounts
  },

  getPlaidItemCursor: async (plaidId: string) => {
    if (!plaidId || plaidId.trim() == "") {
      throw new ValidationError("Invalid plaid ID", { plaidId })
    }

    return await PlaidItemModel.getPlaidItemCursor(plaidId);
  },

  syncPlaidTransactions: async (plaidId: string) => {
    if (!plaidId || plaidId.trim() == "") {
      throw new ValidationError("Invalid plaid ID", plaidId)
    }

    const plaidItem = await PlaidItemModel.findById(plaidId);
    if (!plaidItem) {
      throw new NotFoundError("PlaidItem", plaidId);
    }

    const accessToken = decrypt(plaidItem.encrypted_access_token);
    // Provide a cursor from your database if you've previously
    // received one for the Item. Leave null if this is your
    // first sync call for this Item. The first request will
    // return a cursor.
    let cursor = await PlaidService.getPlaidItemCursor(plaidId);

    try {
      // New transaction updates since "cursor"
      let added: Array<Transaction> = [];
      let modified: Array<Transaction> = [];
      // Removed transaction ids
      let removed: Array<RemovedTransaction> = [];
      let accounts: Array<AccountBase> = [];  
      let hasMore = true;
      // Iterate through each page of new transaction updates for item
      while (hasMore) {
        const request: TransactionsSyncRequest = {
          access_token: accessToken,
          cursor: cursor,
        };
        const response = await plaidClient.transactionsSync(request);
        const data = response.data;

        // Add this page of results
        added = added.concat(data.added);
        modified = modified.concat(data.modified);
        removed = removed.concat(data.removed);
        accounts = data.accounts; 

        hasMore = data.has_more;

        // Update cursor to the next cursor
        cursor = data.next_cursor;
      }
      // Persist cursor and updated data
      // database.applyUpdates(itemId, added, modified, removed, cursor);

      return { added, modified, removed, cursor, accounts };
    } catch (error) {
      logPlaidError(error)
      throw error;
    }
  }

};

function logPlaidError(error: unknown) {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const plaidError = (error as any).response.data;
    console.error("Plaid error:", plaidError);
  }
}
