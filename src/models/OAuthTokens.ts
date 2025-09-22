import { z } from "zod";

/**
 * OAuth Token Information stored as a separate entity in PocketBase
 * for proper relational DB persistence following README.md guidelines
 */
export interface OAuthTokens {
  id: string;
  access_token: string;
  refresh_token?: string;
  token_type: string; // Usually "Bearer"
  expires_in?: number; // Seconds until expiration
  expires_at?: string; // ISO string of expiration time
  scope?: string; // Granted scopes

  // PocketBase auto-generated fields
  created?: string;
  updated?: string;
}

export const OAuthTokensSchema = z.object({
  id: z.string().optional(),
  access_token: z.string().min(1, "Access token is required"),
  refresh_token: z.string().optional(),
  token_type: z.string().default("Bearer"),
  expires_in: z.number().optional(),
  expires_at: z.string().optional(),
  scope: z.string().optional(),
  created: z.string().optional(),
  updated: z.string().optional(),
});
