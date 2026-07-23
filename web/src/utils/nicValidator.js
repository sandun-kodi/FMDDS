/**
 * Utility functions for Sri Lankan National Identity Card (NIC) validation.
 * Supports legacy 9-digit + V/X format and modern 12-digit format.
 * Tags: #frontend #validation #nic
 */

export function validateNic(nic) {
  if (!nic || typeof nic !== 'string') {
    return { isValid: false, message: 'NIC is required.' };
  }

  const trimmed = nic.trim().toUpperCase();

  // Legacy format: 9 digits followed by 'V' or 'X'
  const legacyRegex = /^[0-9]{9}[VX]$/;
  // Modern format: 12 digits
  const modernRegex = /^[0-9]{12}$/;

  if (legacyRegex.test(trimmed)) {
    return { isValid: true, format: 'legacy', nic: trimmed };
  }

  if (modernRegex.test(trimmed)) {
    return { isValid: true, format: 'modern', nic: trimmed };
  }

  return {
    isValid: false,
    message: 'Invalid Sri Lankan NIC format. Must be 9 digits ending with V/X or 12 digits.'
  };
}

export function formatNic(nic) {
  if (!nic) return '';
  return nic.trim().toUpperCase();
}
