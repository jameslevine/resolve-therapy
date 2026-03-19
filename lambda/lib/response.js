const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
};

function ok(body) {
  return { statusCode: 200, headers, body: JSON.stringify(body) };
}

function error(statusCode, message) {
  return { statusCode, headers, body: JSON.stringify({ error: message }) };
}

function options() {
  return { statusCode: 200, headers, body: "" };
}

module.exports = { ok, error, options };
