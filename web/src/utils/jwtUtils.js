/**
 * Utility functions for client-side JWT decoding and permissions extraction.
 * Tags: #frontend #auth #jwt
 */

export function parseJwt(token) {
  if (!token || typeof token !== 'string') return null;

  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;

    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export function extractJwtUserData(token) {
  const payload = parseJwt(token);
  if (!payload) return null;

  // Extract standard JWT and ASP.NET Core Identity claims
  const userID =
    payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ||
    payload.sub ||
    payload.userID ||
    null;

  const username = payload.username || payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || '';

  const fullName =
    payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ||
    payload.fullName ||
    username;

  const role =
    payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
    payload.role ||
    'Guest';

  // Repeated claims with key "permissions" are serialized by ASP.NET Core as an array or single string
  let permissions = [];
  const rawPerms = payload.permissions;
  if (Array.isArray(rawPerms)) {
    permissions = rawPerms;
  } else if (typeof rawPerms === 'string') {
    permissions = [rawPerms];
  }

  const exp = payload.exp || 0;

  return {
    userID: userID ? parseInt(userID, 10) : null,
    username,
    fullName,
    role,
    permissions,
    exp
  };
}

export function isTokenExpired(token) {
  const userData = extractJwtUserData(token);
  if (!userData || !userData.exp) return true;
  const currentTimeInSeconds = Math.floor(Date.now() / 1000);
  return userData.exp < currentTimeInSeconds;
}
