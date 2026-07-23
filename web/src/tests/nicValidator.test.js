import { describe, it, expect } from 'vitest';
import { validateNic } from '../utils/nicValidator';

describe('Sri Lankan NIC Validator Unit Tests', () => {
  it('should validate legacy 9-digit + V format', () => {
    const res = validateNic('941234567V');
    expect(res.isValid).toBe(true);
    expect(res.format).toBe('legacy');
    expect(res.nic).toBe('941234567V');
  });

  it('should validate legacy 9-digit + X format (case-insensitive)', () => {
    const res = validateNic('941234567x');
    expect(res.isValid).toBe(true);
    expect(res.format).toBe('legacy');
    expect(res.nic).toBe('941234567X');
  });

  it('should validate modern 12-digit format', () => {
    const res = validateNic('199412345678');
    expect(res.isValid).toBe(true);
    expect(res.format).toBe('modern');
    expect(res.nic).toBe('199412345678');
  });

  it('should reject invalid NIC lengths and formats', () => {
    expect(validateNic('12345').isValid).toBe(false);
    expect(validateNic('9412345678V').isValid).toBe(false);
    expect(validateNic('ABC123456V').isValid).toBe(false);
    expect(validateNic('').isValid).toBe(false);
  });
});
