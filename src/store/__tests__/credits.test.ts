import { useCreditsStore } from "../credits";

jest.mock("@/lib/api", () => ({
  apiFetch: jest.fn(),
}));

const { apiFetch } = jest.requireMock("@/lib/api");

beforeEach(() => {
  jest.clearAllMocks();
  useCreditsStore.setState({ balance: 0, loading: false });
});

describe("credits store", () => {
  it("fetches and sets balance", async () => {
    apiFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ balance: 120 }),
    });

    await useCreditsStore.getState().fetchBalance();

    expect(useCreditsStore.getState().balance).toBe(120);
    expect(useCreditsStore.getState().loading).toBe(false);
    expect(apiFetch).toHaveBeenCalledWith("/checkout/balance");
  });

  it("handles zero balance", async () => {
    apiFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ balance: 0 }),
    });

    await useCreditsStore.getState().fetchBalance();

    expect(useCreditsStore.getState().balance).toBe(0);
  });

  it("handles API error response", async () => {
    apiFetch.mockResolvedValue({ ok: false });

    await useCreditsStore.getState().fetchBalance();

    expect(useCreditsStore.getState().balance).toBe(0);
    expect(useCreditsStore.getState().loading).toBe(false);
  });

  it("handles network error", async () => {
    apiFetch.mockRejectedValue(new Error("Network error"));

    await useCreditsStore.getState().fetchBalance();

    expect(useCreditsStore.getState().balance).toBe(0);
    expect(useCreditsStore.getState().loading).toBe(false);
  });
});
