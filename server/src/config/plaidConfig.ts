import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
import { env } from './env.js';

const configuration = new Configuration({
  basePath: PlaidEnvironments[env.PLAID_ENV]!,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': env.PLAID_CLIENT_ID,
      'PLAID-SECRET': env.PLAID_SECRET,
    },
  },
});

export const plaidClient = new PlaidApi(configuration);

export const SandboxInstitutions = {
  FIRST_PLATYPUS_BANK: 'ins_109508',
  TARTAN_BANK: 'ins_109511',
  PLATYPUS_OAUTH_BANK: 'ins_127287',
  UNHEALTHY_PLATYPUS_BANK_DOWN: 'ins_132361'
}
