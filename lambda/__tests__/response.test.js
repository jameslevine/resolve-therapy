const { ok, error, options } = require("../dist/lib/response");

describe("response helpers", () => {
  describe("ok", () => {
    it("returns 200 with JSON body", () => {
      const result = ok({ message: "hello" });
      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual({ message: "hello" });
    });

    it("includes CORS headers", () => {
      const result = ok({});
      expect(result.headers["Access-Control-Allow-Origin"]).toBe("*");
      expect(result.headers["Content-Type"]).toBe("application/json");
      expect(result.headers["Access-Control-Allow-Methods"]).toContain("GET");
    });
  });

  describe("error", () => {
    it("returns specified status code with error message", () => {
      const result = error(400, "Bad request");
      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toEqual({ error: "Bad request" });
    });

    it("returns 500 for server errors", () => {
      const result = error(500, "Internal server error");
      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body)).toEqual({ error: "Internal server error" });
    });

    it("includes CORS headers", () => {
      const result = error(404, "Not found");
      expect(result.headers["Access-Control-Allow-Origin"]).toBe("*");
    });
  });

  describe("options", () => {
    it("returns 200 with empty body", () => {
      const result = options();
      expect(result.statusCode).toBe(200);
      expect(result.body).toBe("");
    });

    it("includes CORS headers", () => {
      const result = options();
      expect(result.headers["Access-Control-Allow-Origin"]).toBe("*");
      expect(result.headers["Access-Control-Allow-Methods"]).toContain("OPTIONS");
    });
  });
});
