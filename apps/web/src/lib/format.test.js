import { describe, expect, it } from 'vitest';
import { date, dateTime, initials, parseAmount } from './format';

describe('exact purchase amount input', () => {
  it('converts decimal input to exact minor units', () => {
    expect(parseAmount('4999.99')).toBe(499999);
    expect(parseAmount('5000')).toBe(500000);
    expect(parseAmount('5000.01')).toBe(500001);
    expect(parseAmount('0.01')).toBe(1);
    expect(parseAmount('12.1')).toBe(1210);
  });
  it('rejects ambiguous, nonpositive, and overprecision inputs', () => {
    for (const input of ['', '0', '-1', '1e5', '5,000', '12.345', 'Infinity', '9999999999', '.5'])
      expect(parseAmount(input)).toBeNull();
  });
  it('handles empty and multi-part display names', () => {
    expect(initials('')).toBe('');
    expect(initials('Alex Morgan')).toBe('AM');
    expect(initials('Alex Michael Morgan')).toBe('AM');
  });
});

describe('workspace time display', () => {
  it('displays UTC timestamps in Asia/Singapore, including date boundaries', () => {
    expect(dateTime('2026-10-27T00:30:00Z')).toContain('08:30');
    expect(date('2026-10-26T18:00:00Z')).toBe('27 Oct 2026');
  });
});
