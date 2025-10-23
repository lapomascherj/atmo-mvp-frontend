import type { ChatSessionMessage } from '@/services/chatSessionService';

/**
 * Common skill/domain keywords to detect in chat messages
 * Organized by category for better matching
 */
const FOCUS_AREA_KEYWORDS = {
  // Technology & Development
  tech: [
    'AI', 'Machine Learning', 'ML', 'Deep Learning', 'NLP', 'LLM', 'GPT',
    'React', 'TypeScript', 'JavaScript', 'Node.js', 'Python', 'Java', 'C++',
    'Frontend', 'Backend', 'Full Stack', 'DevOps', 'Cloud', 'AWS', 'Azure', 'GCP',
    'Docker', 'Kubernetes', 'Microservices', 'API', 'REST', 'GraphQL',
    'Database', 'SQL', 'NoSQL', 'PostgreSQL', 'MongoDB', 'Redis',
    'Mobile', 'iOS', 'Android', 'Flutter', 'React Native',
    'Web3', 'Blockchain', 'Crypto', 'DeFi', 'NFT', 'Smart Contracts',
  ],

  // Business & Product
  business: [
    'Product Management', 'Product Strategy', 'Product-Market Fit', 'PMF',
    'Business Development', 'BD', 'Sales', 'Revenue', 'GTM', 'Go-to-Market',
    'Marketing', 'Growth', 'Growth Hacking', 'SEO', 'SEM', 'Content Marketing',
    'Funnel Optimization', 'Conversion', 'CRO', 'A/B Testing',
    'Customer Success', 'Customer Support', 'CX', 'UX', 'User Experience',
    'SaaS', 'B2B', 'B2C', 'Enterprise', 'SMB', 'Startup',
    'Fundraising', 'VC', 'Venture Capital', 'Angel Investing', 'Pitch Deck',
    'Operations', 'Strategy', 'OKRs', 'KPIs', 'Metrics', 'Analytics',
  ],

  // Design & Creative
  design: [
    'UI Design', 'UX Design', 'Product Design', 'Graphic Design', 'Branding',
    'Figma', 'Sketch', 'Adobe', 'Photoshop', 'Illustrator',
    'Design Systems', 'Prototyping', 'Wireframing', 'User Research',
  ],

  // Data & Analytics
  data: [
    'Data Science', 'Data Analysis', 'Data Engineering', 'Big Data',
    'Analytics', 'Business Intelligence', 'BI', 'Tableau', 'Power BI',
    'Statistics', 'Predictive Modeling', 'Data Visualization',
  ],

  // Management & Leadership
  leadership: [
    'Leadership', 'Management', 'Team Building', 'Hiring', 'Recruitment',
    'Performance Management', 'Coaching', 'Mentoring', 'Strategy',
    'Change Management', 'Agile', 'Scrum', 'Project Management', 'PM',
  ],

  // Industry-specific
  industry: [
    'FinTech', 'HealthTech', 'EdTech', 'E-commerce', 'Marketplace',
    'Enterprise Software', 'Consumer Apps', 'Gaming', 'Media',
    'Supply Chain', 'Logistics', 'Real Estate', 'PropTech',
  ],
};

/**
 * Normalize and clean text for analysis
 */
const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ') // Remove punctuation except hyphens
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
};

/**
 * Extract focus areas from a single message
 */
const extractFromMessage = (message: ChatSessionMessage): string[] => {
  const normalized = normalizeText(message.content);
  const detected: string[] = [];

  // Check all keyword categories
  Object.values(FOCUS_AREA_KEYWORDS).forEach(keywords => {
    keywords.forEach(keyword => {
      const keywordLower = keyword.toLowerCase();
      const pattern = new RegExp(`\\b${keywordLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');

      if (pattern.test(normalized)) {
        // Use the original casing from the keyword list
        detected.push(keyword);
      }
    });
  });

  return detected;
};

/**
 * Merge and deduplicate focus areas (case-insensitive)
 */
const deduplicateAreas = (areas: string[]): string[] => {
  const seen = new Map<string, string>(); // lowercase -> original casing

  areas.forEach(area => {
    const lower = area.toLowerCase();
    if (!seen.has(lower)) {
      seen.set(lower, area);
    }
  });

  return Array.from(seen.values());
};

/**
 * Score focus areas by frequency
 */
const scoreByFrequency = (areas: string[]): Array<{ area: string; count: number }> => {
  const frequency = new Map<string, number>();

  areas.forEach(area => {
    const lower = area.toLowerCase();
    frequency.set(lower, (frequency.get(lower) || 0) + 1);
  });

  return Array.from(frequency.entries())
    .map(([areaLower, count]) => ({
      area: areas.find(a => a.toLowerCase() === areaLower) || areaLower,
      count,
    }))
    .sort((a, b) => b.count - a.count);
};

/**
 * Main function: Extract focus areas from recent chat messages
 *
 * @param messages - Array of chat messages to analyze
 * @param existingAreas - Current focus areas to exclude from suggestions
 * @param limit - Maximum number of suggestions to return (default: 5)
 * @returns Array of suggested focus areas, sorted by relevance
 */
export const extractFocusAreasFromChats = (
  messages: ChatSessionMessage[],
  existingAreas: string[] = [],
  limit: number = 5
): string[] => {
  if (!messages || messages.length === 0) {
    return [];
  }

  // Extract from all messages
  const allDetected = messages.flatMap(extractFromMessage);

  if (allDetected.length === 0) {
    return [];
  }

  // Score by frequency
  const scored = scoreByFrequency(allDetected);

  // Filter out existing areas (case-insensitive)
  const existingLower = new Set(existingAreas.map(a => a.toLowerCase()));
  const suggestions = scored
    .filter(({ area }) => !existingLower.has(area.toLowerCase()))
    .map(({ area }) => area)
    .slice(0, limit);

  return deduplicateAreas(suggestions);
};

/**
 * Extract focus areas from a single text block (e.g., bio, project description)
 */
export const extractFocusAreasFromText = (
  text: string,
  existingAreas: string[] = [],
  limit: number = 3
): string[] => {
  const normalized = normalizeText(text);
  const detected: string[] = [];

  // Check all keyword categories
  Object.values(FOCUS_AREA_KEYWORDS).forEach(keywords => {
    keywords.forEach(keyword => {
      const keywordLower = keyword.toLowerCase();
      const pattern = new RegExp(`\\b${keywordLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');

      if (pattern.test(normalized)) {
        detected.push(keyword);
      }
    });
  });

  // Dedupe and filter against existing
  const unique = deduplicateAreas(detected);
  const existingLower = new Set(existingAreas.map(a => a.toLowerCase()));

  return unique
    .filter(area => !existingLower.has(area.toLowerCase()))
    .slice(0, limit);
};
