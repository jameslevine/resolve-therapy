import i18n from "@/i18n";

export function formatPrice(amount?: number): string {
  const symbol = i18n.t("currency.symbol");
  const price = amount ?? Number(i18n.t("currency.sessionPrice"));
  return `${symbol}${price}`;
}

export function getCurrencyCode(): string {
  return i18n.t("currency.code");
}
