import { defineAuth } from '@aws-amplify/backend';

export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  userAttributes: {
    preferredUsername: { required: true },
    'custom:role': { dataType: 'String', mutable: true },
    'custom:department': { dataType: 'String', mutable: true },
  },
  // passwordPolicy は Amplify Gen2 コンソール / CDK override で設定
  multifactor: {
    mode: 'OPTIONAL',
    totp: true,
  },
  accountRecovery: 'EMAIL_ONLY',
});
