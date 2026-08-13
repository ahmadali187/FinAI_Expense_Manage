// src/utils/googleAuth.js

/**
 * Decodes and validates a Google OpenID Connect ID Token (JWT credential)
 * @param {string} credential - Google JWT token string
 * @returns {object} Google profile data (sub, email, email_verified, name, picture, etc.)
 */
export const decodeGoogleCredential = (credential) => {
  if (!credential) {
    throw new Error('No Google credential provided.');
  }

  try {
    const parts = credential.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format.');
    }

    // Base64URL decode the payload
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    const payload = JSON.parse(jsonPayload);

    // Validate Issuer
    const validIssuers = ['https://accounts.google.com', 'accounts.google.com'];
    if (!validIssuers.includes(payload.iss)) {
      throw new Error(`Invalid token issuer: ${payload.iss}`);
    }

    // Validate Expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      throw new Error('Google credential has expired.');
    }

    // Validate Sub (Unique Google ID)
    if (!payload.sub) {
      throw new Error('Google token missing sub identifier.');
    }

    return {
      sub: payload.sub,
      email: payload.email ? payload.email.toLowerCase() : '',
      emailVerified: Boolean(payload.email_verified),
      name: payload.name || payload.email || 'Google User',
      givenName: payload.given_name || '',
      familyName: payload.family_name || '',
      picture: payload.picture || '',
      aud: payload.aud || '',
      iss: payload.iss || '',
      exp: payload.exp || 0
    };
  } catch (err) {
    console.error('Failed to parse Google credential:', err);
    throw new Error('Invalid Google credential token.');
  }
};
