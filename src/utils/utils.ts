import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Sanitizes data for PocketBase by removing cyclic references and undefined values
 */
export function sanitizeForPocketBase(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data !== "object") {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeForPocketBase(item));
  }

  const sanitized: any = {};
  for (const [key, value] of Object.entries(data)) {
    // Skip undefined values and functions
    if (value === undefined || typeof value === "function") {
      continue;
    }

    // Skip expand objects to prevent cyclic references
    if (key === "expand") {
      continue;
    }

    sanitized[key] = sanitizeForPocketBase(value);
  }

  return sanitized;
}
