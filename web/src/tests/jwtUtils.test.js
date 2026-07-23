import { describe, it, expect } from 'vitest';
import { parseJwt, extractJwtUserData, isTokenExpired } from '../utils/jwtUtils';

describe('JWT Utilities & Permissions Extraction', () => {
  // Helper to create valid base64url test JWT tokens
  function createTestJwt(payloadObj) {
    const header = { alg: 'HS256', typ: 'JWT' };
    const encode = (obj) =>
      btoa(JSON.stringify(obj))
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
    return `${encode(header)}.${encode(payloadObj)}.signature`;
  }

  it('should parse valid JWT token payload', () => {
    const token = createTestJwt({ username: 'jmo_perera', role: 'Judicial Medical Officer' });
    const parsed = parseJwt(token);
    expect(parsed).not.toBeNull();
    expect(parsed.username).toBe('jmo_perera');
    expect(parsed.role).toBe('Judicial Medical Officer');
  });

  it('should extract permissions array from repeated JWT claims', () => {
    const token = createTestJwt({
      'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier': '2',
      'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name': 'Dr. Perera',
      username: 'jmo_perera',
      'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': 'Judicial Medical Officer',
      permissions: ['case:create', 'case:view_all', 'exam:record_clinical', 'report:approve']
    });

    const data = extractJwtUserData(token);
    expect(data.userID).toBe(2);
    expect(data.username).toBe('jmo_perera');
    expect(data.fullName).toBe('Dr. Perera');
    expect(data.role).toBe('Judicial Medical Officer');
    expect(data.permissions).toEqual(['case:create', 'case:view_all', 'exam:record_clinical', 'report:approve']);
  });

  it('should detect token expiration', () => {
    const expiredToken = createTestJwt({ exp: Math.floor(Date.now() / 1000) - 3600 });
    const validToken = createTestJwt({ exp: Math.floor(Date.now() / 1000) + 3600 });

    expect(isTokenExpired(expiredToken)).toBe(true);
    expect(isTokenExpired(validToken)).toBe(false);
  });
});
