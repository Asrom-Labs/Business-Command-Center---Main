import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

/**
 * Merges Tailwind CSS class names safely.
 * Required by shadcn/ui. Used everywhere in the app.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Converts a UTC ISO date string to Jordan local time (Asia/Amman, UTC+3)
 * and returns a formatted string.
 *
 * @param {string} utcString - ISO 8601 date string from API
 * @param {boolean} includeTime - Whether to include hours and minutes
 * @returns {string} Formatted date string, or '—' if input is falsy
 *
 * Example: formatDate('2026-03-07T10:00:00Z') → 'Mar 7, 2026'
 * Example: formatDate('2026-03-07T10:00:00Z', true) → 'Mar 7, 2026, 01:00 PM'
 */
export function formatDate(utcString, includeTime = false) {
  if (!utcString) return '—';
  try {
    const date = typeof utcString === 'string' ? parseISO(utcString) : utcString;
    const jordanTime = toZonedTime(date, 'Asia/Amman');
    const fmt = includeTime ? 'MMM d, yyyy, hh:mm a' : 'MMM d, yyyy';
    return format(jordanTime, fmt);
  } catch {
    return '—';
  }
}

/**
 * Formats a monetary value returned from the API.
 * API returns NUMERIC(12,2) as strings — always parse before display.
 *
 * @param {string|number} value - The monetary value
 * @param {string} currency - ISO 4217 currency code (e.g. 'JOD', 'USD', 'SAR')
 * @returns {string} Formatted currency string, or '—' if value is null/undefined
 *
 * Example: formatCurrency('1500.00', 'JOD') → 'JOD 1,500.00'
 */
export function formatCurrency(value, currency = 'USD') {
  if (value === null || value === undefined || value === '') return '—';
  const num = parseFloat(value);
  if (isNaN(num)) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Formats a number with thousands separators.
 * Use for quantities (stock counts, order quantities, etc.)
 */
export function formatNumber(value) {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('en-US').format(Number(value));
}

/**
 * Truncates a string to a given length, appending '...'
 */
export function truncate(str, length = 40) {
  if (!str) return '';
  return str.length > length ? str.slice(0, length) + '...' : str;
}

/**
 * Returns initials from a full name (for avatar fallbacks)
 * Example: 'Ahmed Al-Khalidi' → 'AK'
 */
export function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

/**
 * Extracts a human-readable error message from an API error response.
 * Works with both axios errors and the raw API error shape.
 */
export function getErrorMessage(error) {
  if (error?.message) return error.message;
  if (error?.response?.data?.message) return error.response.data.message;
  if (typeof error === 'string') return error;
  return 'An unexpected error occurred. Please try again.';
}
