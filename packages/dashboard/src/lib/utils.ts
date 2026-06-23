import { type ClassValue, clsx } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/**
 * SWR fetcher that throws on non-OK responses so SWR's error state works.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetcher(url: string): Promise<any> {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatRelativeTime(date: string | Date): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diff = now - then;

  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "passed":
    case "completed":
      return "text-green-600 bg-green-50 border-green-200";
    case "failed":
      return "text-red-600 bg-red-50 border-red-200";
    case "running":
      return "text-blue-600 bg-blue-50 border-blue-200";
    case "skipped":
      return "text-yellow-600 bg-yellow-50 border-yellow-200";
    case "timedOut":
      return "text-orange-600 bg-orange-50 border-orange-200";
    default:
      return "text-gray-600 bg-gray-50 border-gray-200";
  }
}

export function getStatusIcon(status: string): string {
  switch (status) {
    case "passed":
    case "completed":
      return "✓";
    case "failed":
      return "✗";
    case "running":
      return "⟳";
    case "skipped":
      return "⊘";
    case "timedOut":
      return "⏱";
    default:
      return "•";
  }
}
