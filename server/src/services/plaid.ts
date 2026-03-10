import { ValidationError, AlreadyExistsError, AuthenticationError, NotFoundError } from "../utils/errors.js";
import { UserModel } from "../models/user.js";
import { env } from "../config/env.js";
import type { LinkTokenCreateRequest, ItemPublicTokenExchangeRequest, SandboxPublicTokenCreateRequest } from 'plaid';
import { CountryCode, Products } from 'plaid';
import { plaidClient } from "../config/plaidConfig.js";
import { SandboxInstitutions } from "../config/plaidConfig.js";
import { PlaidItemModel } from "../models/plaidItem.js";
import { encrypt } from "../utils/encryption.js";
import { access } from "node:fs";

interface CreateLinkTokenParams {
  userId: string;
}

interface ExchangePublicTokenParams {
  userId: string;
  publicToken: string;
}

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
      
      const { accessToken, itemId } = await PlaidService.exchangePublicToken({ userId, publicToken });

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
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const plaidError = (error as { response: { data: unknown } }).response.data;
        console.error('Plaid sandbox error:', plaidError);
      }
      throw error;
    }
  },

  createLinkToken: async({ userId }: CreateLinkTokenParams) => {
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
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const plaidError = (error as { response: { data: unknown } }).response.data;
        console.error('Plaid error:', plaidError);
      }
      throw error;
    }
  },

  exchangePublicToken: async ({ userId, publicToken }: ExchangePublicTokenParams) => {
    try {
      const request: ItemPublicTokenExchangeRequest = { public_token: publicToken };
      const response = await plaidClient.itemPublicTokenExchange(request);
      return {
        accessToken: response.data.access_token,
        itemId: response.data.item_id
      }
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const plaidError = (error as { response: { data: unknown } }).response.data;
        console.error('Plaid error:', plaidError);
      }
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
  
  getPlaidItems: async ({ userId }: { userId: string }) => {
    if (!userId || userId.trim() === "") {
      throw new ValidationError("Invalid user ID", { userId });
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      throw new NotFoundError("User", userId);
    }

    return await PlaidItemModel.findAllByUserId(userId);
  }

};
