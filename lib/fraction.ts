/**
 * Fraction utilities for parsing, normalizing, and comparing fraction answers.
 */

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b > 0) {
    [a, b] = [b, a % b];
  }
  return a;
}

export interface ParsedFraction {
  numerator: number;
  denominator: number;
}

/**
 * Parse a fraction string like "3/4", "1 2/3", "-5/8", "75%", "0.75"
 * Returns numerator/denominator in reduced form.
 */
export function parseFraction(input: string): ParsedFraction | null {
  if (!input || typeof input !== 'string') return null;

  const s = input.trim().toLowerCase().replace(',', '.');

  // Percentage: "75%"
  if (s.endsWith('%')) {
    const num = parseFloat(s.slice(0, -1));
    if (isNaN(num)) return null;
    // Convert percentage to fraction over 100, then reduce
    const numerator = num * 100;
    const denominator = 10000;
    const g = gcd(Math.round(numerator), denominator);
    return { numerator: Math.round(numerator) / g, denominator: denominator / g };
  }

  // Mixed number: "1 2/3"
  const mixedMatch = s.match(/^(-?\d+)\s+(\d+)\/(\d+)$/);
  if (mixedMatch) {
    const whole = parseInt(mixedMatch[1]);
    const num = parseInt(mixedMatch[2]);
    const den = parseInt(mixedMatch[3]);
    if (den === 0) return null;
    const numerator = whole * den + (whole < 0 ? -num : num);
    const g = gcd(Math.abs(numerator), den);
    return { numerator: numerator / g, denominator: den / g };
  }

  // Simple fraction: "3/4"
  const fracMatch = s.match(/^(-?\d+)\/(-?\d+)$/);
  if (fracMatch) {
    const num = parseInt(fracMatch[1]);
    const den = parseInt(fracMatch[2]);
    if (den === 0) return null;
    const sign = den < 0 ? -1 : 1;
    const g = gcd(Math.abs(num), Math.abs(den));
    return { numerator: (sign * num) / g, denominator: (sign * den) / g };
  }

  // Integer or decimal: "2", "0.5", "300 000" (French thousands separator with space)
  const decimal = parseFloat(s.replace(/\s+/g, ''));
  if (!isNaN(decimal)) {
    // Convert to fraction: multiply by power of 10 to eliminate decimal
    const decStr = decimal.toString();
    const dotIdx = decStr.indexOf('.');
    if (dotIdx === -1) {
      return { numerator: decimal, denominator: 1 };
    }
    const decimalPlaces = decStr.length - dotIdx - 1;
    const multiplier = Math.pow(10, decimalPlaces);
    const num = Math.round(decimal * multiplier);
    const g = gcd(Math.abs(num), multiplier);
    return { numerator: num / g, denominator: multiplier / g };
  }

  return null;
}

/**
 * Check if two fraction/answer strings are equivalent.
 * Handles fractions, decimals, percentages.
 */
export function fractionEquals(userAnswer: string, correctAnswer: string): boolean {
  const ua = parseFraction(userAnswer);
  const ca = parseFraction(correctAnswer);

  if (!ua || !ca) {
    // Fall back to string comparison (case-insensitive, trimmed)
    return userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
  }

  // Cross multiply to compare: a/b == c/d iff a*d == b*c
  return ua.numerator * ca.denominator === ca.numerator * ua.denominator;
}

/**
 * Check if user answer matches any of the accepted answers.
 */
export function checkAnswer(userAnswer: string, accepted: string | string[]): boolean {
  const answers = Array.isArray(accepted) ? accepted : [accepted];
  return answers.some((correct) => fractionEquals(userAnswer, correct));
}

/**
 * Format a fraction nicely as a string.
 */
export function formatFraction(num: number, den: number): string {
  if (den === 1) return num.toString();
  const whole = Math.trunc(num / den);
  const remainder = Math.abs(num % den);
  if (whole !== 0 && remainder !== 0) {
    return `${whole} ${remainder}/${Math.abs(den)}`;
  }
  return `${num}/${den}`;
}

/**
 * Normalize a fraction answer string to its reduced form.
 */
export function normalizeFraction(input: string): string {
  const parsed = parseFraction(input);
  if (!parsed) return input;
  return formatFraction(parsed.numerator, parsed.denominator);
}
