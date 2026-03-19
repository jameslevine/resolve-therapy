const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({ region: process.env.AWS_REGION || "eu-west-2" });
const ddb = DynamoDBDocumentClient.from(client);
const TABLE = process.env.TABLE_NAME || "resolve-therapy";

// Single-table design:
// Session: PK=SESSION#<id> SK=META
// Transcript: PK=SESSION#<id> SK=TRANSCRIPT#<timestamp>
// Memory: PK=SESSION#<id> SK=MEMORY#<key>
// Speaker: PK=SESSION#<id> SK=SPEAKER#<speakerNum>
// Payment: PK=SESSION#<id> SK=PAYMENT

module.exports = { ddb, TABLE, PutCommand, GetCommand, QueryCommand, UpdateCommand };
