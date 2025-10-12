/**
 * Utility functions for date formatting
 * Exports wrapped date-fns functions for consistency
 */
import {
  formatDistanceToNow as fnsFormatDistanceToNow,
  format,
} from "date-fns";

/**
 * Formats a date to show how much time has passed in a human-readable format
 * e.g. "5 minutes ago", "2 days ago", etc.
 */
export function formatDistanceToNow(date: Date): string {
  return fnsFormatDistanceToNow(date, { addSuffix: true });
}

/**
 * Formats a date to a standard format (e.g. "Jan 1, 2023")
 */
export function formatDate(date: Date): string {
  return format(date, "MMM d, yyyy");
}

/**
 * Formats a date to include time (e.g. "Jan 1, 2023, 12:00 PM")
 */
export function formatDateTime(date: Date): string {
  return format(date, "MMM d, yyyy, h:mm a");
}
