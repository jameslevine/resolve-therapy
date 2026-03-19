const LOG_LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
const MIN_LEVEL = LOG_LEVELS[process.env.LOG_LEVEL] || LOG_LEVELS.INFO;

function createLogger(context = {}) {
  function log(level, message, data = {}) {
    if (LOG_LEVELS[level] < MIN_LEVEL) return;

    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...context,
      ...data,
    };

    // Remove undefined values
    Object.keys(entry).forEach((key) => {
      if (entry[key] === undefined) delete entry[key];
    });

    const output = JSON.stringify(entry);

    if (level === "ERROR") {
      console.error(output);
    } else if (level === "WARN") {
      console.warn(output);
    } else {
      console.log(output);
    }
  }

  return {
    debug: (message, data) => log("DEBUG", message, data),
    info: (message, data) => log("INFO", message, data),
    warn: (message, data) => log("WARN", message, data),
    error: (message, data) => log("ERROR", message, data),
  };
}

function loggerFromEvent(event, service) {
  return createLogger({
    service,
    requestId: event.requestContext?.requestId,
    path: event.path,
    method: event.httpMethod,
  });
}

module.exports = { createLogger, loggerFromEvent };
