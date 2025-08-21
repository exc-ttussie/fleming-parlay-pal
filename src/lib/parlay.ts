// Parlay calculation utilities based on the specifications

export function americanToDecimal(american: number): number {
  return american > 0 ? (american / 100) + 1 : (100 / Math.abs(american)) + 1;
}

export function decimalToAmerican(decimal: number): number {
  if (decimal >= 2) return Math.round((decimal - 1) * 100);
  return Math.round(-100 / (decimal - 1));
}

export function parlayDecimal(decimalOdds: number[]): number {
  return decimalOdds.reduce((acc, odds) => acc * odds, 1);
}

export function parlayPayout(stakeCents: number, decimal: number): number {
  const profit = (decimal - 1) * (stakeCents / 100);
  return Math.round((profit + stakeCents / 100) * 100); // return total return in cents
}

export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(cents / 100);
}