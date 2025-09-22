/**
 * Represent the type of integration supported by the system.
 * Each integration type represents semantically the type of
 * action the external service is used for.
 *
 * @export
 * @enum {number}
 */
export enum IntegrationType {
  // External AI services used to enhance the response given to the user.
  // Supported enhancers are:
  // - OpenAI
  // - Anthropic
  Enhancer = "enhancer",
  // External services used to retrieve information from the user's knowledge base.
  // Supported knowledge bases are:
  // - Notion
  // - Google Drive
  // - Google Calendar
  // - Google Docs
  KnowledgeBase = "knowledge_base",
}
