import { apiFetch } from "../api";

jest.mock("../config", () => ({
  API_BASE_URL: "https://api.example.com",
}));

jest.mock("../cognito", () => ({
  getIdToken: jest.fn(),
}));

const { getIdToken } = jest.requireMock("../cognito");

const mockFetch = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = mockFetch.mockResolvedValue({ ok: true, json: () => ({}) });
});

describe("apiFetch", () => {
  it("sends request with auth token when available", async () => {
    getIdToken.mockResolvedValue("test-token-123");

    await apiFetch("/sessions");

    expect(mockFetch).toHaveBeenCalledWith("https://api.example.com/sessions", {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test-token-123",
      },
    });
  });

  it("sends request without auth header when no token", async () => {
    getIdToken.mockResolvedValue(null);

    await apiFetch("/sessions");

    expect(mockFetch).toHaveBeenCalledWith("https://api.example.com/sessions", {
      headers: {
        "Content-Type": "application/json",
      },
    });
  });

  it("merges custom options and headers", async () => {
    getIdToken.mockResolvedValue("token");

    await apiFetch("/sessions", {
      method: "POST",
      body: JSON.stringify({ text: "hello" }),
      headers: { "X-Custom": "value" },
    });

    expect(mockFetch).toHaveBeenCalledWith("https://api.example.com/sessions", {
      method: "POST",
      body: JSON.stringify({ text: "hello" }),
      headers: {
        "Content-Type": "application/json",
        "X-Custom": "value",
        Authorization: "Bearer token",
      },
    });
  });

  it("returns the fetch response", async () => {
    getIdToken.mockResolvedValue(null);
    const mockResponse = { ok: true, status: 200 };
    mockFetch.mockResolvedValue(mockResponse);

    const result = await apiFetch("/test");

    expect(result).toBe(mockResponse);
  });
});
