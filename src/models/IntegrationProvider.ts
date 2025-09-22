/**
 * Represent the supported providers used for integrations
 * with external services. This enum does not make assumptions
 * about the type of integration, it is only used to identify
 * the provider of the integration. Each member of the enum
 * is associated with a specific provider, that can have multiple
 * integrations, as long as they do not share the same credentials.
 *
 * @export
 * @enum {number}
 */
export enum IntegrationProvider {
  Google = "Google",
  Notion = "Notion",
  Github = "GitHub",
  OpenAI = "OpenAI",
  Anthropic = "Anthropic",
}
