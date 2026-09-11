/**
 * Time formatting helpers.
 *
 * Kept free of database imports so client components can use them. Living in
 * lib/activity.ts previously dragged Prisma — and with it the pg driver's
 * Node built-ins — into any client bundle that formatted a timestamp.
 */

/**
 * Formats a timestamp as a short relative string ("2 minutes ago").
 *
 * Rendered on the server, so it reflects the moment the page was built rather
 * than a live-ticking clock; that trade keeps activity feeds out of the client
 * bundle entirely.
 */
export function relativeTime(date: Date, now: Date = new Date()): string {
  const seconds = Math.round((now.getTime() - date.getTime()) / 1000);

  if (seconds < 45) return "just now";
  if (seconds < 90) return "1 minute ago";

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} minutes ago`;

  const hours = Math.round(minutes / 60);
  if (hours === 1) return "1 hour ago";
  if (hours < 24) return `${hours} hours ago`;

  const days = Math.round(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;

  const weeks = Math.round(days / 7);
  if (weeks === 1) return "1 week ago";
  if (weeks < 5) return `${weeks} weeks ago`;

  const months = Math.round(days / 30);
  if (months === 1) return "1 month ago";
  if (months < 12) return `${months} months ago`;

  const years = Math.round(days / 365);
  return years === 1 ? "1 year ago" : `${years} years ago`;
}
