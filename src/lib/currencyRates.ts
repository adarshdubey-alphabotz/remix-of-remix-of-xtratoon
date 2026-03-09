// Currency conversion rates (USD base) — update monthly
// Last updated: March 2026
export const CURRENCY_RATES: Record<string, { rate: number; symbol: string; name: string }> = {
  USD: { rate: 1, symbol: '$', name: 'US Dollar' },
  EUR: { rate: 0.92, symbol: '€', name: 'Euro' },
  GBP: { rate: 0.79, symbol: '£', name: 'British Pound' },
  INR: { rate: 88, symbol: '₹', name: 'Indian Rupee' },
  BDT: { rate: 120, symbol: '৳', name: 'Bangladeshi Taka' },
  JPY: { rate: 155, symbol: '¥', name: 'Japanese Yen' },
  KRW: { rate: 1380, symbol: '₩', name: 'South Korean Won' },
  CNY: { rate: 7.3, symbol: '¥', name: 'Chinese Yuan' },
  BRL: { rate: 5.1, symbol: 'R$', name: 'Brazilian Real' },
  CAD: { rate: 1.38, symbol: 'C$', name: 'Canadian Dollar' },
  AUD: { rate: 1.55, symbol: 'A$', name: 'Australian Dollar' },
  NGN: { rate: 1600, symbol: '₦', name: 'Nigerian Naira' },
  PHP: { rate: 58, symbol: '₱', name: 'Philippine Peso' },
  IDR: { rate: 16000, symbol: 'Rp', name: 'Indonesian Rupiah' },
  MYR: { rate: 4.7, symbol: 'RM', name: 'Malaysian Ringgit' },
  THB: { rate: 36, symbol: '฿', name: 'Thai Baht' },
  VND: { rate: 25500, symbol: '₫', name: 'Vietnamese Dong' },
  PKR: { rate: 280, symbol: '₨', name: 'Pakistani Rupee' },
  EGP: { rate: 50, symbol: 'E£', name: 'Egyptian Pound' },
  ZAR: { rate: 18.5, symbol: 'R', name: 'South African Rand' },
  AED: { rate: 3.67, symbol: 'د.إ', name: 'UAE Dirham' },
  SAR: { rate: 3.75, symbol: '﷼', name: 'Saudi Riyal' },
  TRY: { rate: 36, symbol: '₺', name: 'Turkish Lira' },
  SGD: { rate: 1.35, symbol: 'S$', name: 'Singapore Dollar' },
};

export const convertUSD = (usdAmount: number, currency: string): number => {
  const rate = CURRENCY_RATES[currency]?.rate || 1;
  return usdAmount * rate;
};

export const formatCurrency = (usdAmount: number, currency: string): string => {
  const info = CURRENCY_RATES[currency] || CURRENCY_RATES.USD;
  const converted = usdAmount * info.rate;
  // For large numbers like VND, IDR, NGN — no decimals
  const decimals = info.rate >= 100 ? 0 : info.rate >= 10 ? 1 : 2;
  return `${info.symbol}${converted.toFixed(decimals)}`;
};

export const formatCurrencyFull = (usdAmount: number, currency: string): string => {
  const info = CURRENCY_RATES[currency] || CURRENCY_RATES.USD;
  const converted = usdAmount * info.rate;
  const decimals = info.rate >= 100 ? 0 : info.rate >= 10 ? 1 : 4;
  return `${info.symbol}${converted.toFixed(decimals)}`;
};
