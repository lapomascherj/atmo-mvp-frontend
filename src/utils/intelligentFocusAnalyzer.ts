import type { Project } from '@/models/Project';
import type { ChatSessionMessage } from '@/services/chatSessionService';

/**
 * Professional skill domain mappings
 * Maps raw keywords to professional focus area categories
 */
const SKILL_DOMAIN_MAP: Record<string, string[]> = {
  'AI/ML Products': [
    'ai', 'artificial intelligence', 'machine learning', 'ml', 'deep learning',
    'llm', 'gpt', 'neural', 'nlp', 'computer vision', 'ai platform', 'ai product'
  ],
  'SaaS Development': [
    'saas', 'software as a service', 'cloud platform', 'web app', 'platform',
    'subscription', 'multi-tenant', 'api platform'
  ],
  'Product Strategy': [
    'product strategy', 'product management', 'product roadmap', 'product vision',
    'product launch', 'product-market fit', 'pmf', 'product development'
  ],
  'Growth Marketing': [
    'growth', 'growth hacking', 'marketing', 'funnel', 'conversion',
    'acquisition', 'retention', 'viral', 'seo', 'sem', 'content marketing'
  ],
  'Team Leadership': [
    'leadership', 'team management', 'team building', 'hiring', 'people management',
    'coaching', 'mentoring', 'org design', 'culture'
  ],
  'Business Development': [
    'business development', 'bd', 'partnerships', 'sales', 'enterprise sales',
    'b2b sales', 'revenue', 'go-to-market', 'gtm'
  ],
  'Investor Relations': [
    'investor', 'fundraising', 'venture capital', 'vc', 'pitch', 'investment',
    'series a', 'series b', 'angel', 'investor relations'
  ],
  'Frontend Development': [
    'frontend', 'react', 'typescript', 'javascript', 'ui', 'web development',
    'css', 'html', 'responsive', 'mobile-first'
  ],
  'Backend Development': [
    'backend', 'api', 'database', 'server', 'node', 'python', 'java',
    'microservices', 'infrastructure', 'devops'
  ],
  'Data Analytics': [
    'analytics', 'data analysis', 'metrics', 'kpis', 'dashboards', 'reporting',
    'data-driven', 'business intelligence', 'bi'
  ],
  'UX/UI Design': [
    'ux', 'ui', 'user experience', 'user interface', 'design', 'figma',
    'prototyping', 'wireframes', 'user research', 'usability'
  ],
  'Customer Success': [
    'customer success', 'customer support', 'customer experience', 'cx',
    'onboarding', 'retention', 'churn', 'customer satisfaction'
  ],
  'Funnel Optimization': [
    'funnel optimization', 'conversion optimization', 'cro', 'a/b testing',
    'landing pages', 'user flow', 'conversion funnel'
  ],
  'Enterprise Sales': [
    'enterprise', 'enterprise sales', 'b2b', 'account management',
    'contract negotiation', 'deal closing'
  ],
  'Content Creation': [
    'content', 'writing', 'copywriting', 'blogging', 'documentation',
    'technical writing', 'content strategy'
  ],
};

/**
 * Role-based default focus areas
 * Provides intelligent defaults based on job title
 */
const ROLE_DEFAULTS: Record<string, string[]> = {
  'founder': ['Product Strategy', 'Team Leadership', 'Investor Relations', 'Business Development'],
  'ceo': ['Team Leadership', 'Business Development', 'Investor Relations', 'Product Strategy'],
  'cto': ['Backend Development', 'Frontend Development', 'Team Leadership', 'Product Strategy'],
  'product manager': ['Product Strategy', 'Data Analytics', 'UX/UI Design', 'Customer Success'],
  'product lead': ['Product Strategy', 'Team Leadership', 'Data Analytics', 'UX/UI Design'],
  'engineer': ['Frontend Development', 'Backend Development', 'SaaS Development'],
  'designer': ['UX/UI Design', 'Frontend Development', 'Product Strategy'],
  'marketer': ['Growth Marketing', 'Content Creation', 'Funnel Optimization', 'Data Analytics'],
  'sales': ['Business Development', 'Enterprise Sales', 'Customer Success'],
  'developer': ['Frontend Development', 'Backend Development', 'SaaS Development'],
};

interface FocusAreaScore {
  area: string;
  score: number;
  sources: string[];
}

/**
 * Extract professional domains from text
 */
const extractDomainsFromText = (text: string): Map<string, number> => {
  const normalized = text.toLowerCase();
  const scores = new Map<string, number>();

  Object.entries(SKILL_DOMAIN_MAP).forEach(([domain, keywords]) => {
    let matches = 0;
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      const found = normalized.match(regex);
      if (found) {
        matches += found.length;
      }
    });

    if (matches > 0) {
      scores.set(domain, matches);
    }
  });

  return scores;
};

/**
 * Analyze projects to extract professional focus areas
 */
const analyzeProjects = (projects: Project[]): Map<string, number> => {
  const domainScores = new Map<string, number>();

  projects.forEach(project => {
    // Weight recent projects higher (last 30 days)
    const projectAge = project.created_at
      ? Date.now() - new Date(project.created_at).getTime()
      : Infinity;
    const daysOld = projectAge / (1000 * 60 * 60 * 24);
    const ageWeight = daysOld < 30 ? 3 : daysOld < 90 ? 2 : 1;

    // Analyze project name and description
    const projectText = `${project.name} ${project.description || ''}`;
    const projectDomains = extractDomainsFromText(projectText);

    projectDomains.forEach((score, domain) => {
      const current = domainScores.get(domain) || 0;
      domainScores.set(domain, current + (score * ageWeight));
    });

    // Analyze tasks and goals
    const tasks = project.goals?.flatMap(g => g.tasks || []) || [];
    tasks.forEach(task => {
      const taskDomains = extractDomainsFromText(task.name);
      taskDomains.forEach((score, domain) => {
        const current = domainScores.get(domain) || 0;
        domainScores.set(domain, current + (score * ageWeight * 0.5));
      });
    });
  });

  return domainScores;
};

/**
 * Analyze chat messages to extract professional topics
 */
const analyzeChats = (messages: ChatSessionMessage[]): Map<string, number> => {
  const domainScores = new Map<string, number>();

  // Weight recent messages higher
  const recentMessages = messages.slice(0, 30); // Last 30 messages

  recentMessages.forEach((message, index) => {
    // More recent messages get higher weight
    const recencyWeight = 1 + ((30 - index) / 30);

    const domains = extractDomainsFromText(message.content);
    domains.forEach((score, domain) => {
      const current = domainScores.get(domain) || 0;
      domainScores.set(domain, current + (score * recencyWeight * 0.3));
    });
  });

  return domainScores;
};

/**
 * Get default focus areas based on role
 */
const getDefaultsFromRole = (role: string): string[] => {
  const normalized = role.toLowerCase();

  for (const [roleKey, defaults] of Object.entries(ROLE_DEFAULTS)) {
    if (normalized.includes(roleKey)) {
      return defaults;
    }
  }

  return [];
};

/**
 * Merge domain scores from multiple sources
 */
const mergeDomainScores = (...scoreMaps: Map<string, number>[]): FocusAreaScore[] => {
  const combined = new Map<string, number>();

  scoreMaps.forEach(scoreMap => {
    scoreMap.forEach((score, domain) => {
      const current = combined.get(domain) || 0;
      combined.set(domain, current + score);
    });
  });

  return Array.from(combined.entries())
    .map(([area, score]) => ({ area, score, sources: [] }))
    .sort((a, b) => b.score - a.score);
};

/**
 * Main intelligent focus area analyzer
 * Automatically determines professional focus areas from user's actual work
 *
 * @param projects - User's active projects
 * @param chatMessages - Recent chat messages
 * @param role - User's job title/role
 * @param limit - Maximum number of focus areas to return (default: 5)
 * @returns Array of professional focus areas, automatically determined
 */
export const analyzeIntelligentFocusAreas = (
  projects: Project[],
  chatMessages: ChatSessionMessage[],
  role: string,
  limit: number = 5
): string[] => {
  // 1. Analyze projects (highest weight)
  const projectScores = analyzeProjects(projects);

  // 2. Analyze chat messages (medium weight)
  const chatScores = analyzeChats(chatMessages);

  // 3. Get role-based defaults (fallback weight)
  const roleDefaults = getDefaultsFromRole(role);
  const roleScores = new Map<string, number>();
  roleDefaults.forEach(area => {
    roleScores.set(area, 2); // Low baseline score
  });

  // 4. Merge all sources
  const allScores = mergeDomainScores(projectScores, chatScores, roleScores);

  // 5. Return top N focus areas
  const topAreas = allScores.slice(0, limit).map(item => item.area);

  // 6. Ensure minimum of 3 areas (use role defaults if needed)
  if (topAreas.length < 3 && roleDefaults.length > 0) {
    const missing = 3 - topAreas.length;
    const additionalFromRole = roleDefaults
      .filter(area => !topAreas.includes(area))
      .slice(0, missing);
    // Explicit safeguard: never return more than limit
    return [...topAreas, ...additionalFromRole].slice(0, limit);
  }

  // Final safeguard: always respect the limit (max 5)
  const finalAreas = topAreas.length > 0 ? topAreas : roleDefaults;
  return finalAreas.slice(0, Math.min(limit, 5));
};

/**
 * Check if focus areas need recalculation
 * @param lastUpdated - Timestamp of last focus area update
 * @returns true if 7+ days have passed
 */
export const shouldRecalculateFocusAreas = (lastUpdated: string | null): boolean => {
  if (!lastUpdated) return true;

  const daysSinceUpdate = (Date.now() - new Date(lastUpdated).getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceUpdate >= 7;
};
