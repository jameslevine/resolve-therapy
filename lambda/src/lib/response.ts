import type { APIGatewayProxyResult } from "aws-lambda";

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
};

export function ok(body: Record<string, unknown>): APIGatewayProxyResult {
  return { statusCode: 200, headers, body: JSON.stringify(body) };
}

export function error(statusCode: number, message: string): APIGatewayProxyResult {
  return { statusCode, headers, body: JSON.stringify({ error: message }) };
}

export function options(): APIGatewayProxyResult {
  return { statusCode: 200, headers, body: "" };
}
