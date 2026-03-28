import { defineData } from '@aws-amplify/backend';

// DynamoDB Single Table Design
// テーブルは Amplify Gen2 の defineData で定義
// GSI は別途 CDK カスタマイズで追加（Phase 1A-02, 1A-03）

const schema = /* GraphQL */ `
  # Note: This is a placeholder schema for Amplify Gen2 initialization.
  # Actual data access uses DynamoDB SDK directly with Single Table Design.
  # See 設計書 3.1 for table structure details.

  type Placeholder @model @auth(rules: [{ allow: private }]) {
    id: ID!
    createdAt: AWSDateTime
  }
`;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
