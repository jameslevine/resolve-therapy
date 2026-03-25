import { formatPrice, getCurrencyCode } from "../currency";

const translations: Record<string, string> = {
  "currency.symbol": "$",
  "currency.sessionPrice": "29",
  "currency.code": "USD",
};

jest.mock("@/i18n", () => ({
  __esModule: true,
  default: {
    t: (key: string) => translations[key] || key,
  },
}));

describe("formatPrice", () => {
  it("formats a given amount with currency symbol", () => {
    expect(formatPrice(69)).toBe("$69");
  });

  it("uses default session price when no amount provided", () => {
    expect(formatPrice()).toBe("$29");
  });

  it("handles zero amount", () => {
    expect(formatPrice(0)).toBe("$0");
  });
});

describe("getCurrencyCode", () => {
  it("returns the currency code from i18n", () => {
    expect(getCurrencyCode()).toBe("USD");
  });
});
