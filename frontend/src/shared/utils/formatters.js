import { format, formatDistanceToNow, parseISO } from 'date-fns';

/**
 * Format ISO date string to human-readable date.
 * e.g. "Feb 21, 2026"
 */
export const formatDate = (iso) => {
  if (!iso) return '—';
  return format(parseISO(iso), 'MMM dd, yyyy');
};

/**
 * Format ISO date string to relative time.
 * e.g. "3 hours ago"
 */
export const timeAgo = (iso) => {
  if (!iso) return '';
  return formatDistanceToNow(parseISO(iso), { addSuffix: true });
};

/**
 * Format ISO date to full datetime.
 * e.g. "Feb 21, 2026 · 14:30"
 */
export const formatDateTime = (iso) => {
  if (!iso) return '—';
  return format(parseISO(iso), "MMM dd, yyyy · HH:mm");
};

/**
 * Format milliseconds to readable execution time.
 * e.g. 1500 → "1500 ms"  or  500 → "500 ms"
 */
export const formatExecTime = (ms) => {
  if (ms == null) return '—';
  return `${ms} ms`;
};

/**
 * Format KB to readable memory.
 * e.g. 1024 → "1.0 MB"  or  512 → "512 KB"
 */
export const formatMemory = (kb) => {
  if (kb == null) return '—';
  if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB`;
  return `${kb} KB`;
};

/**
 * Format a number with commas.
 * e.g. 12402 → "12,402"
 */
export const formatNumber = (n) => {
  if (n == null) return '0';
  return n.toLocaleString();
};

/**
 * Format acceptance rate percentage.
 * e.g. 65.5 → "65.5%"
 */
export const formatRate = (rate) => {
  if (rate == null) return '0%';
  return `${rate.toFixed(1)}%`;
};

/**
 * Format contest duration in minutes to "Xh Ym" format.
 */
export const formatDuration = (minutes) => {
  if (!minutes) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

/**
 * Returns ordinal suffix for a rank number.
 * e.g. 1 → "1st", 2 → "2nd"
 */
export const ordinal = (n) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

/**
 * Truncate a string to maxLen characters.
 */
export const truncate = (str, maxLen = 60) => {
  if (!str) return '';
  return str.length > maxLen ? str.slice(0, maxLen) + '…' : str;
};
