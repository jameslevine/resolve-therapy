import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: process.env.AWS_REGION || "eu-west-2" });
export const ddb = DynamoDBDocumentClient.from(client);
export const TABLE = process.env.TABLE_NAME || "resolve-therapy";

export { PutCommand, GetCommand, QueryCommand, UpdateCommand };
