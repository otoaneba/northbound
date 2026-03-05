import { ValidationError, AlreadyExistsError, AuthenticationError } from "../utils/errors.js";
import { env } from "../config/env.js";
import type { LinkTokenCreateRequest, ItemPublicTokenExchangeRequest, SandboxPublicTokenCreateRequest } from 'plaid';
import { CountryCode, Products } from 'plaid';
import { plaidClient } from "../config/plaidConfig.js";
import { SandboxInstitutions } from "../config/plaidConfig.js";

interface CreateLinkTokenParams {
  userId: string;
}

interface ExchangePublicTokenParams {
  userId: string;
  publicToken: string;
}


export const PlaidService = {
  sandboxGetAccessToken: async ({ userId }: { userId: string}) => {
    try {
      const publicTokenRequest: SandboxPublicTokenCreateRequest = {
        institution_id: SandboxInstitutions.FIRST_PLATYPUS_BANK, // Plaid sandbox institution (First Platypus Bank)
        initial_products: [Products.Transactions, Products.Auth, Products.Assets],
      };
      const publicTokenResponse = await plaidClient.sandboxPublicTokenCreate(publicTokenRequest);
      const publicToken = publicTokenResponse.data.public_token;
      
      return await PlaidService.exchangePublicToken({ userId, publicToken });

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


};
