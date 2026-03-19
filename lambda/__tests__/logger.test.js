const { createLogger, loggerFromEvent } = require("../lib/logger");

describe("logger", () => {
  let consoleSpy;

  beforeEach(() => {
    consoleSpy = {
      log: jest.spyOn(console, "log").mockImplementation(),
      error: jest.spyOn(console, "error").mockImplementation(),
      warn: jest.spyOn(console, "warn").mockImplementation(),
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("createLogger", () => {
    it("outputs structured JSON with timestamp and level", () => {
      const log = createLogger({ service: "test" });
      log.info("Hello");

      expect(consoleSpy.log).toHaveBeenCalledTimes(1);
      const output = JSON.parse(consoleSpy.log.mock.calls[0][0]);
      expect(output.level).toBe("INFO");
      expect(output.message).toBe("Hello");
      expect(output.service).toBe("test");
      expect(output.timestamp).toBeDefined();
    });

    it("includes additional data in log entry", () => {
      const log = createLogger();
      log.error("Failed", { userId: "123", error: "timeout" });

      const output = JSON.parse(consoleSpy.error.mock.calls[0][0]);
      expect(output.level).toBe("ERROR");
      expect(output.userId).toBe("123");
      expect(output.error).toBe("timeout");
    });

    it("uses console.error for ERROR level", () => {
      const log = createLogger();
      log.error("Bad thing");
      expect(consoleSpy.error).toHaveBeenCalledTimes(1);
      expect(consoleSpy.log).not.toHaveBeenCalled();
    });

    it("uses console.warn for WARN level", () => {
      const log = createLogger();
      log.warn("Watch out");
      expect(consoleSpy.warn).toHaveBeenCalledTimes(1);
    });
  });

  describe("loggerFromEvent", () => {
    it("extracts request context from API Gateway event", () => {
      const event = {
        httpMethod: "POST",
        path: "/sessions/respond",
        requestContext: { requestId: "abc-123" },
      };

      const log = loggerFromEvent(event, "sessions");
      log.info("Processing request");

      const output = JSON.parse(consoleSpy.log.mock.calls[0][0]);
      expect(output.service).toBe("sessions");
      expect(output.requestId).toBe("abc-123");
      expect(output.path).toBe("/sessions/respond");
      expect(output.method).toBe("POST");
    });
  });
});
