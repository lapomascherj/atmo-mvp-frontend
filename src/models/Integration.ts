import { z } from "zod";
import { IntegrationProvider } from "./IntegrationProvider";
import { IntegrationType } from "./IntegrationType";

/**
 * Represents the data associated with an external integration.
 * Enhanced to support OAuth credentials and service-specific grants.
 * Used to store the credentials used for document retrieval and
 * external API calls to the enhancer services.
 *
 * This interface defines the core structure for all integrations
 * in the ATMO platform, ensuring consistent credential management
 * across different service providers.
 *
 * For more information about the supported providers, see the
 * IntegrationProvider enum and the user guide.
 *
 * Integrations can be based on OAuth2 or API key/Token authentication.
 *
 * @export
 * @interface Integration
 */
export interface Integration {
  /**
   * Unique identifier for the integration record
   */
  id: string;

  /**
   * The provider of the integration service.
   * Identifies which external service this integration connects to.
   */
  provider: IntegrationProvider;

  /**
   * The type/category of integration functionality.
   * Determines how the integration is used within the ATMO platform.
   *
   * - KnowledgeBase: For data storage and retrieval (Notion, GitHub, Google Drive)
   * - Enhancer: For AI processing and content generation (OpenAI, Claude)
   */
  type: IntegrationType;

  /**
   * The API key or access token provided by the integration provider.
   * For OAuth integrations, this stores the access_token.
   * For API key integrations (OpenAI, Claude), this stores the API key.
   * For Notion, this stores the Internal Integration Secret (ntn_xxx).
   *
   * @example "sk-1234567890abcdef" (OpenAI), "sk-ant-1234567890abcdef" (Claude), "ntn_1234567890abcdef" (Notion)
   */
  api_key: string;

  /**
   * The client ID provided by the integration provider for OAuth flows.
   * Used for OAuth-based integrations like GitHub, Google services.
   * For API key integrations, this field is typically empty.
   *
   * @example "Iv1.a629723000000000" (GitHub), "123456789.apps.googleusercontent.com" (Google)
   */
  client: string;

  /**
   * The client secret or integration token provided by the provider.
   * For OAuth integrations, this stores the client_secret.
   * For API key integrations, this field may be empty or store additional secrets.
   * For Notion, this field is typically empty as the api_key field is used.
   *
   * @example "ntn_1234567890abcdef" (Notion), "ghs_1234567890abcdef" (GitHub)
   */
  secret: string;

  /**
   * Whether this integration uses OAuth authentication
   */
  is_oauth: boolean;

  /**
   * OAuth tokens relation - stores the OAuthTokens record ID for DB relation
   * Only populated for OAuth-based integrations
   */
  oauth_tokens?: string;

  // PocketBase auto-generated fields
  created?: string;
  updated?: string;
}

export const IntegrationSchema = z.object({
  id: z.string().optional(),
  provider: z.nativeEnum(IntegrationProvider),
  type: z.nativeEnum(IntegrationType),
  api_key: z.string(),
  client: z.string(),
  secret: z.string(),
  is_oauth: z.boolean().default(false),
  oauth_tokens: z.string().optional(), // Relation field - ID of OAuthTokens record
  created: z.string().optional(),
  updated: z.string().optional(),
});
