/**
 * Data generator — create random test data without external dependencies.
 */

export function randomString(length: number = 8): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function randomEmail(): string {
  return `test-${randomString(6)}@samurai-qa.com`;
}

export function randomInt(min: number = 1, max: number = 1000): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomName(): string {
  const firstNames = ["Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Quinn", "Avery"];
  const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis"];
  return `${firstNames[randomInt(0, firstNames.length - 1)]} ${lastNames[randomInt(0, lastNames.length - 1)]}`;
}

export function randomPhone(): string {
  return `+1${randomInt(2000000000, 9999999999)}`;
}

export function randomUrl(): string {
  return `https://${randomString(8)}.example.com`;
}

export function timestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, "-");
}
