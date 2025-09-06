// Odds validation utilities

export function isValidOdds(odds: number | null | undefined): odds is number {
  if (odds === null || odds === undefined) return false;
  if (typeof odds !== 'number') return false;
  if (isNaN(odds)) return false;
  if (!isFinite(odds)) return false;
  
  // Reasonable American odds range check
  if (odds < -10000 || odds > 10000) return false;
  
  return true;
}

export function isValidLine(line: number | null | undefined): line is number {
  if (line === null || line === undefined) return false;
  if (typeof line !== 'number') return false;
  if (isNaN(line)) return false;
  if (!isFinite(line)) return false;
  
  return true;
}

export function formatOdds(odds: number | null | undefined): string {
  if (!isValidOdds(odds)) return "N/A";
  
  if (odds > 0) {
    return `+${odds}`;
  }
  return `${odds}`;
}

export function isValidPlayerPropPrice(price: number | null | undefined): price is number {
  return isValidOdds(price);
}

export function isValidYesPrice(price: number | null | undefined): price is number {
  return isValidOdds(price);
}