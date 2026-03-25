import type { APIGatewayProxyResult } from "aws-lambda";

function getAllowedOrigin(): string {
  const frontendUrl = process.env.FRONTEND_URL;
  if (frontendUrl) return frontendUrl.replace(/\/$/, "");
  return "*";
}

function getHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": getAllowedOrigin(),
    "Access-Control-Allow-Headers":
      "Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,Stripe-Signature",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  };
}

export function ok(body: Record<string, unknown>): APIGatewayProxyResult {
  return { statusCode: 200, headers: getHeaders(), body: JSON.stringify(body) };
}

export function error(statusCode: number, message: string): APIGatewayProxyResult {
  return { statusCode, headers: getHeaders(), body: JSON.stringify({ error: message }) };
}

export function options(): APIGatewayProxyResult {
  return { statusCode: 200, headers: getHeaders(), body: "" };
}
