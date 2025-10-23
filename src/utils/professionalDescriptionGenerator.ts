/**
 * Professional Description Generator
 * Creates compelling 2-3 line professional descriptions from onboarding data
 */

interface OnboardingData {
  warmup?: {
    mentalWeight?: string;
    successIndicator?: string;
  };
  identity?: {
    role?: string;
    company?: string;
    mainProject?: string;
    secondaryProjects?: string;
    dueDate?: string;
    purpose?: string;
  };
  personal?: {
    bio?: string;
    headline?: string;
  };
  work?: {
    role?: string;
    company?: string;
    mainProject?: string;
    supportNeeds?: string;
  };
  performance?: {
    northStar?: string;
    weeklyCommitment?: string;
  };
  metrics?: {
    kpis?: string[];
  };
}

/**
 * Extract years of experience from text (heuristic)
 */
const extractYearsOfExperience = (text: string): number | null => {
  const patterns = [
    /(\d+)\+?\s*years?/i,
    /(\d+)\s*yrs?/i,
    /over\s*(\d+)\s*years?/i,
    /more\s*than\s*(\d+)\s*years?/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return parseInt(match[1], 10);
    }
  }

  return null;
};

/**
 * Infer seniority level from role title and context
 */
const inferSeniority = (role: string, context: string): 'junior' | 'mid' | 'senior' | 'lead' | 'founder' => {
  const roleLower = role.toLowerCase();
  const contextLower = context.toLowerCase();
  const combined = `${roleLower} ${contextLower}`;

  if (/founder|co-founder|ceo|cto|cpo|chief/i.test(combined)) return 'founder';
  if (/lead|principal|staff|vp|head of|director/i.test(combined)) return 'lead';
  if (/senior|sr\.|experienced|expert/i.test(combined)) return 'senior';
  if (/junior|jr\.|entry|associate/i.test(combined)) return 'junior';

  // Check for experience indicators in context
  const years = extractYearsOfExperience(combined);
  if (years) {
    if (years >= 7) return 'senior';
    if (years >= 4) return 'mid';
    return 'junior';
  }

  return 'mid';
};

/**
 * Extract domain expertise from project and purpose
 */
const extractDomain = (mainProject: string, purpose: string, role: string): string => {
  const combined = `${mainProject} ${purpose} ${role}`.toLowerCase();

  const domainMap: Record<string, string> = {
    'ai|artificial intelligence|machine learning|ml|llm|gpt': 'AI-powered solutions',
    'saas|software as a service|platform': 'SaaS platforms',
    'product|pm|product management': 'product development',
    'fintech|financial|banking|payments': 'FinTech',
    'healthtech|health|medical|healthcare': 'HealthTech',
    'edtech|education|learning': 'EdTech',
    'e-commerce|ecommerce|marketplace|retail': 'e-commerce',
    'b2b|enterprise': 'B2B solutions',
    'mobile|ios|android': 'mobile applications',
    'data|analytics|business intelligence': 'data analytics',
    'marketing|growth|acquisition': 'growth marketing',
    'design|ux|ui': 'user experience design',
  };

  for (const [pattern, domain] of Object.entries(domainMap)) {
    if (new RegExp(pattern, 'i').test(combined)) {
      return domain;
    }
  }

  return 'digital solutions';
};

/**
 * Build professional headline (Line 1)
 */
const buildHeadline = (data: OnboardingData): string => {
  const role = data.work?.role || data.identity?.role || '';
  const company = data.work?.company || data.identity?.company || '';
  const mainProject = data.work?.mainProject || data.identity?.mainProject || '';
  const purpose = data.identity?.purpose || data.performance?.northStar || '';
  const bio = data.personal?.bio || '';

  if (!role && !company && !mainProject) {
    return 'Professional building innovative solutions';
  }

  const context = `${bio} ${purpose} ${data.warmup?.mentalWeight || ''}`;
  const seniority = inferSeniority(role, context);
  const domain = extractDomain(mainProject, purpose, role);
  const years = extractYearsOfExperience(context);

  // Template variations by seniority
  if (seniority === 'founder') {
    if (company) {
      return `${role} at ${company} ${domain ? `specializing in ${domain}` : ''}`.trim();
    }
    return `${role} building ${mainProject || 'innovative products'} ${domain ? `in ${domain}` : ''}`.trim();
  }

  if (seniority === 'lead' || seniority === 'senior') {
    const experienceClause = years ? `with ${years}+ years` : '';
    if (company) {
      return `${role} at ${company} ${experienceClause} ${domain ? `specializing in ${domain}` : ''}`.trim();
    }
    return `Experienced ${role} ${experienceClause} ${domain ? `specializing in ${domain}` : ''}`.trim();
  }

  // Mid/Junior level
  if (company) {
    return `${role} at ${company}${domain ? ` focused on ${domain}` : ''}`;
  }

  return `${role}${domain ? ` working in ${domain}` : ''}`;
};

/**
 * Build current focus line (Line 2)
 */
const buildFocusLine = (data: OnboardingData): string | null => {
  const mainProject = data.work?.mainProject || data.identity?.mainProject || '';
  const purpose = data.identity?.purpose || '';
  const successIndicator = data.warmup?.successIndicator || data.performance?.northStar || '';
  const mentalWeight = data.warmup?.mentalWeight || data.work?.supportNeeds || '';

  if (!mainProject && !purpose && !successIndicator) {
    return null;
  }

  // Build narrative
  const parts: string[] = [];

  if (mainProject && purpose) {
    parts.push(`Currently building ${mainProject} to ${purpose.toLowerCase()}`);
  } else if (mainProject) {
    parts.push(`Currently working on ${mainProject}`);
  }

  // Add context from mental weight (challenge being solved)
  if (mentalWeight && mentalWeight.length < 80) {
    const challenge = mentalWeight.toLowerCase();
    if (!challenge.includes(mainProject.toLowerCase())) {
      parts.push(`addressing ${challenge}`);
    }
  }

  return parts.join(' while ') || null;
};

/**
 * Build growth/achievement line (Line 3)
 */
const buildGrowthLine = (data: OnboardingData): string | null => {
  const successIndicator = data.warmup?.successIndicator || data.performance?.northStar || '';
  const weeklyCommitment = data.performance?.weeklyCommitment || '';
  const kpis = data.metrics?.kpis || [];

  if (!successIndicator && !weeklyCommitment && kpis.length === 0) {
    return null;
  }

  // Prefer success indicator (30-day goal from onboarding)
  if (successIndicator && successIndicator.length < 120) {
    // Check if it starts with a verb (likely well-formed goal)
    const startsWithVerb = /^(launch|build|grow|achieve|reach|ship|deliver|create|scale)/i.test(successIndicator);
    if (startsWithVerb) {
      return `Targeting to ${successIndicator.toLowerCase()}`;
    }
    return successIndicator;
  }

  // Use weekly commitment if available
  if (weeklyCommitment && weeklyCommitment.length < 100) {
    return `Committed to ${weeklyCommitment.toLowerCase()} weekly`;
  }

  // Use KPIs as fallback
  if (kpis.length > 0) {
    const topKpis = kpis.slice(0, 2).join(' and ');
    return `Tracking ${topKpis} as key success metrics`;
  }

  return null;
};

/**
 * Generate professional description from onboarding data
 *
 * @param onboardingData - User's onboarding responses
 * @returns 2-3 line professional description
 */
export const generateProfessionalDescription = (onboardingData: any): string => {
  if (!onboardingData || typeof onboardingData !== 'object') {
    return 'Professional building innovative solutions. Complete onboarding to build your profile.';
  }

  const data = onboardingData as OnboardingData;

  // Build each line
  const headline = buildHeadline(data);
  const focusLine = buildFocusLine(data);
  const growthLine = buildGrowthLine(data);

  // Combine lines
  const lines = [headline, focusLine, growthLine].filter(Boolean);

  if (lines.length === 0) {
    return 'Professional building innovative solutions. Complete onboarding to build your profile.';
  }

  // Join with proper punctuation
  return lines
    .map((line, index) => {
      // Ensure proper capitalization
      const capitalized = line!.charAt(0).toUpperCase() + line!.slice(1);

      // Add period if not present
      if (index === lines.length - 1 && !capitalized.match(/[.!?]$/)) {
        return capitalized + '.';
      }

      return capitalized;
    })
    .join('. ');
};
