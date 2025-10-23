import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.20.0'
import { jsPDF } from 'https://esm.sh/jspdf@2.5.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Update active streak for user
 * Tracks consecutive days of activity
 */
async function updateActiveStreak(userId: string, supabaseClient: any): Promise<void> {
  const { data: profile, error: fetchError } = await supabaseClient
    .from('profiles')
    .select('last_activity_date, active_streak_days')
    .eq('id', userId)
    .single()

  if (fetchError) {
    console.error('Failed to fetch streak data:', fetchError)
    return
  }

  const today = new Date().toISOString().split('T')[0]
  const lastActivityDate = profile?.last_activity_date
  const currentStreak = profile?.active_streak_days ?? 0

  let newStreak = currentStreak

  if (!lastActivityDate) {
    // First activity ever
    newStreak = 1
  } else {
    const lastDate = new Date(lastActivityDate).toISOString().split('T')[0]
    if (lastDate === today) {
      // Already counted today, no update needed
      return
    }

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    if (lastDate === yesterdayStr) {
      // Consecutive day
      newStreak = currentStreak + 1
    } else {
      // Streak broken, restart
      newStreak = 1
    }
  }

  const { error: updateError } = await supabaseClient
    .from('profiles')
    .update({
      last_activity_date: today,
      active_streak_days: newStreak
    })
    .eq('id', userId)

  if (updateError) {
    console.error('Failed to update streak:', updateError)
  }
}

const normaliseGoalStatus = (status?: string | null): string => {
  if (!status) return 'in-progress'
  const normalized = status.toString().toLowerCase().trim()
  if (['planned', 'not started', 'todo', 'to-do'].includes(normalized)) return 'planned'
  if (['in-progress', 'in progress', 'progress', 'active', 'ongoing', 'working'].includes(normalized)) return 'in-progress'
  if (['complete', 'completed', 'done', 'finished'].includes(normalized)) return 'completed'
  return 'in-progress'
}

const normaliseGoalPriority = (priority?: string | null): string => {
  if (!priority) return 'medium'
  const normalized = priority.toString().toLowerCase().trim()
  if (['high', 'highest', 'urgent'].includes(normalized)) return 'high'
  if (['low', 'lowest', 'minor'].includes(normalized)) return 'low'
  return 'medium'
}

const extractJsonBlock = (input: string): string | null => {
  if (!input) return null
  const start = input.indexOf('{')
  if (start === -1) return null
  let depth = 0
  for (let i = start; i < input.length; i++) {
    const char = input[i]
    if (char === '{') depth++
    else if (char === '}') {
      depth--
      if (depth === 0) return input.slice(start, i + 1)
    }
  }
  return null
}

type StrategicDocumentActionItem = {
  step: string
  owner: string
  deadline: string
  resources: string
  successMetric: string
}

type StrategicDocumentTimelineItem = {
  milestone: string
  startDate: string
  endDate: string
  dependencies: string
}

type StrategicDocumentKPI = {
  metric: string
  baseline: string
  target: string
  cadence: string
}

type StrategicDocumentResource = {
  category: string
  details: string
  cost: string
  owners: string
}

type StrategicDocument = {
  title: string
  executiveSummary: string
  strategicAnalysis: {
    marketPositioning: string
    competitiveAdvantages: string
    riskAssessment: string
  }
  detailedActionPlan: StrategicDocumentActionItem[]
  implementationTimeline: StrategicDocumentTimelineItem[]
  keyPerformanceIndicators: StrategicDocumentKPI[]
  resourceRequirements: StrategicDocumentResource[]
  methodologies?: string[]
  notes?: string
}

type StrategicContext = {
  profile: any
  projects: any[]
  goals: any[]
  tasks: any[]
  chatMessages: any[]
  knowledgeItems: any[]
  milestones: any[]
}

const fetchStrategicContext = async (supabaseClient: any, userId: string): Promise<StrategicContext> => {
  const [
    { data: profile },
    { data: projects },
    { data: goals },
    { data: tasks },
    { data: chatMessages },
    { data: knowledgeItems },
    { data: milestones }
  ] = await Promise.all([
    supabaseClient.from('profiles').select('display_name, email, onboarding_data').eq('id', userId).maybeSingle(),
    supabaseClient
      .from('projects')
      .select('id, name, description, status, priority, target_date, updated_at, color')
      .eq('owner_id', userId)
      .neq('status', 'deleted')
      .order('updated_at', { ascending: false })
      .limit(8),
    supabaseClient
      .from('project_goals')
      .select('id, name, description, status, priority, target_date, project_id, updated_at')
      .eq('owner_id', userId)
      .neq('status', 'deleted')
      .order('updated_at', { ascending: false })
      .limit(12),
    supabaseClient
      .from('project_tasks')
      .select('id, name, description, priority, due_date, project_id, completed, updated_at')
      .eq('owner_id', userId)
      .is('archived_at', null)
      .order('updated_at', { ascending: false })
      .limit(12),
    supabaseClient
      .from('chat_messages')
      .select('role, content, created_at')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false })
      .limit(12),
    // CRITICAL: Fetch knowledge items - the research, notes, links that make documents rich
    supabaseClient
      .from('knowledge_items')
      .select('id, name, content, type, tags, project_id, occurred_at, source_url')
      .eq('owner_id', userId)
      .order('occurred_at', { ascending: false })
      .limit(50),
    // CRITICAL: Fetch milestones - important deadlines for timeline alignment
    supabaseClient
      .from('project_milestones')
      .select('id, name, description, due_date, status, project_id, updated_at')
      .eq('owner_id', userId)
      .neq('status', 'deleted')
      .order('due_date', { ascending: true })
      .limit(20)
  ])

  return {
    profile: profile ?? null,
    projects: projects ?? [],
    goals: goals ?? [],
    tasks: tasks ?? [],
    chatMessages: chatMessages ?? [],
    knowledgeItems: knowledgeItems ?? [],
    milestones: milestones ?? []
  }
}

const buildContextSummary = (context: StrategicContext): string => {
  const projectLines = context.projects.slice(0, 6).map((project: any) => {
    const status = project.status || 'active'
    const priority = project.priority || 'medium'
    const target = project.target_date ? new Date(project.target_date).toISOString().split('T')[0] : 'not set'
    return `• ${project.name} — status: ${status}, priority: ${priority}, target: ${target}`
  })

  const projectMap = new Map(context.projects.map((project: any) => [project.id, project.name]))

  const goalLines = context.goals.slice(0, 8).map((goal: any) => {
    const projectName = projectMap.get(goal.project_id) || 'Unassigned'
    const status = goal.status || 'in-progress'
    const target = goal.target_date ? new Date(goal.target_date).toISOString().split('T')[0] : 'not set'
    return `• ${goal.name} (${projectName}) — status: ${status}, target: ${target}`
  })

  const activeTasks = context.tasks.filter((task: any) => !task.completed).slice(0, 8)
  const taskLines = activeTasks.map((task: any) => {
    const projectName = projectMap.get(task.project_id) || 'General'
    const due = task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : 'unscheduled'
    const priority = task.priority || 'medium'
    return `• ${task.name} (${projectName}) — due: ${due}, priority: ${priority}`
  })

  const chatHighlights = context.chatMessages
    .filter((msg: any) => msg.role === 'user')
    .slice(0, 5)
    .map((msg: any) => `• ${new Date(msg.created_at).toLocaleDateString()} — ${msg.content.slice(0, 160)}`)

  const onboarding = context.profile?.onboarding_data || {}
  const focusAreas = onboarding?.work?.focusAreas || []

  // CRITICAL: Build knowledge items section - this is the GOLD for rich documents
  const knowledgeLines = context.knowledgeItems.slice(0, 30).map((item: any) => {
    const projectName = projectMap.get(item.project_id) || 'General'
    const contentPreview = item.content ? item.content.slice(0, 200).replace(/\n/g, ' ') : ''
    const sourceInfo = item.source_url ? ` [Source: ${item.source_url}]` : ''
    const date = item.occurred_at ? new Date(item.occurred_at).toLocaleDateString() : 'recent'
    return `• [${date}] ${item.name} (${projectName}) — ${contentPreview}${sourceInfo}`
  })

  // CRITICAL: Build milestones section - for timeline alignment
  const milestoneLines = context.milestones.slice(0, 15).map((milestone: any) => {
    const projectName = projectMap.get(milestone.project_id) || 'Unknown Project'
    const dueDate = milestone.due_date ? new Date(milestone.due_date).toISOString().split('T')[0] : 'no date'
    const status = milestone.status || 'active'
    const description = milestone.description ? ` — ${milestone.description.slice(0, 100)}` : ''
    return `• ${milestone.name} (${projectName}) — due: ${dueDate}, status: ${status}${description}`
  })

  return `USER PROFILE:
Name: ${context.profile?.display_name || context.profile?.email || 'Unknown User'}
Focus Areas: ${focusAreas.length > 0 ? focusAreas.join(', ') : 'Not specified'}

ACTIVE PROJECTS:
${projectLines.length > 0 ? projectLines.join('\n') : '• No active projects recorded'}

ACTIVE GOALS:
${goalLines.length > 0 ? goalLines.join('\n') : '• No goals on record'}

ACTIVE TASKS:
${taskLines.length > 0 ? taskLines.join('\n') : '• No active tasks on record'}

PROJECT KNOWLEDGE ITEMS (CRITICAL - USE THESE FOR RICH, SPECIFIC DOCUMENTS):
${knowledgeLines.length > 0 ? knowledgeLines.join('\n') : '• No knowledge items captured yet'}

UPCOMING MILESTONES (USE THESE TO ALIGN DOCUMENT TIMELINES):
${milestoneLines.length > 0 ? milestoneLines.join('\n') : '• No milestones set'}

RECENT USER INPUTS:
${chatHighlights.length > 0 ? chatHighlights.join('\n') : '• Limited recent chat history'}
`
}

const validateStrategicDocument = (doc: StrategicDocument, context?: StrategicContext): string[] => {
  const issues: string[] = []

  const summaryLength = doc.executiveSummary?.replace(/\s+/g, ' ').trim().length || 0
  if (summaryLength < 220) {
    issues.push('Executive summary must include 3-5 substantive sentences (~220+ characters).')
  }

  const analysis = doc.strategicAnalysis || {} as StrategicDocument['strategicAnalysis']
  if (!analysis.marketPositioning || analysis.marketPositioning.replace(/\s+/g, ' ').length < 200) {
    issues.push('Market positioning section needs at least 3 specific paragraphs with positioning, segments, and differentiators.')
  }
  if (!analysis.competitiveAdvantages || analysis.competitiveAdvantages.replace(/\s+/g, ' ').length < 180) {
    issues.push('Competitive advantages section must describe specific strengths with evidence.')
  }
  if (!analysis.riskAssessment || analysis.riskAssessment.replace(/\s+/g, ' ').length < 180) {
    issues.push('Risk assessment requires enumerated risks with mitigations.')
  }

  if (!Array.isArray(doc.detailedActionPlan) || doc.detailedActionPlan.length < 4) {
    issues.push('Action plan needs at least four concrete steps.')
  }

  const hasWeakAction = (doc.detailedActionPlan || []).some(item => {
    const fields = [item.step, item.owner, item.deadline, item.resources, item.successMetric]
    return fields.some(value => !value || /tbd|placeholder|define|n\/a|specify|needed|assign|owner tbd|provide detail/i.test(value))
  })
  if (hasWeakAction) {
    issues.push('Each action step must include owner, deadline, resources and success metric without TBD/placeholders.')
  }

  // Check for too many generic placeholders across all action items
  const placeholderCount = (doc.detailedActionPlan || []).reduce((count, item) => {
    const fields = [item.step, item.owner, item.deadline, item.resources, item.successMetric]
    return count + fields.filter(value => /tbd|placeholder|define|n\/a|specify|needed|assign/i.test(value || '')).length
  }, 0)
  if (placeholderCount > 2) {
    issues.push('Too many placeholder values in action plan - provide specific, concrete details.')
  }

  if (!Array.isArray(doc.implementationTimeline) || doc.implementationTimeline.length < 4) {
    issues.push('Implementation timeline needs at least four milestones across the horizon.')
  }

  const timelineHasPlaceholders = (doc.implementationTimeline || []).some(item => {
    const fields = [item.milestone, item.startDate, item.endDate]
    return fields.some(value => !value || /tbd|placeholder|n\/a/i.test(value))
  })
  if (timelineHasPlaceholders) {
    issues.push('Timeline milestones must include concrete start/end dates.')
  }

  if (!Array.isArray(doc.keyPerformanceIndicators) || doc.keyPerformanceIndicators.length < 4) {
    issues.push('Include at least four KPIs covering acquisition, activation, retention and financial metrics.')
  }

  const kpiHasNumbers = (doc.keyPerformanceIndicators || []).some(kpi => /\d/.test(kpi.baseline || '') && /\d/.test(kpi.target || ''))
  if (!kpiHasNumbers) {
    issues.push('KPIs must contain numeric baselines and targets (e.g., CAC $120 → $90).')
  }

  if (!Array.isArray(doc.resourceRequirements) || doc.resourceRequirements.length < 3) {
    issues.push('List at least three resource categories with cost/owners (budget, people, tooling).')
  }

  const resourceHasPlaceholders = (doc.resourceRequirements || []).some(resource => /tbd|placeholder|estimate cost|n\/a|provide detail|specify|needed/i.test(resource.details || '') || /tbd|placeholder|estimate cost/i.test(resource.cost || ''))
  if (resourceHasPlaceholders) {
    issues.push('Resource requirements need concrete descriptions and cost ranges - no "estimate cost" or "TBD".')
  }

  // Check for documents that are too generic overall - require user context
  const userContext = context?.profile?.display_name || context?.profile?.email || ''
  const projectNames = (context?.projects || []).map(p => p.name).join(' ')
  const hasUserContext = doc.executiveSummary?.includes(userContext) ||
                        (doc.executiveSummary || '').split(' ').some(word =>
                          projectNames.toLowerCase().includes(word.toLowerCase()) && word.length > 3
                        )
  if (!hasUserContext && userContext) {
    issues.push('Document must reference user\'s actual context, projects, or goals by name - avoid generic templates.')
  }

  const metaPhrases = [/this document/i, /this plan/i, /the above/i]
  if (metaPhrases.some((regex) => regex.test(doc.executiveSummary))) {
    issues.push('Remove meta commentary (e.g., "this document").')
  }

  // Detect generic phrases without quantification
  const genericPhrases = ['multi-channel', 'build awareness', 'drive growth', 'comprehensive strategy', 'various channels', 'increase engagement', 'establish presence']
  if (genericPhrases.some(phrase => doc.executiveSummary?.toLowerCase().includes(phrase) && !/\d/.test(doc.executiveSummary || ''))) {
    issues.push('Executive summary contains generic phrases without quantification.')
  }

  // CRITICAL VALIDATION: Check if knowledge items are actually being used
  if (context && context.knowledgeItems && context.knowledgeItems.length >= 3) {
    const fullDocText = JSON.stringify(doc).toLowerCase()
    const knowledgeItemsReferenced = context.knowledgeItems.filter((item: any) => {
      const itemName = (item.name || '').toLowerCase()
      const itemContent = (item.content || '').toLowerCase()
      // Check if knowledge item name or significant content snippets appear in document
      return fullDocText.includes(itemName.slice(0, 30)) ||
             (itemContent.length > 50 && fullDocText.includes(itemContent.slice(0, 50)))
    })

    const usagePercentage = (knowledgeItemsReferenced.length / context.knowledgeItems.length) * 100
    if (usagePercentage < 30) {
      issues.push(`Document must reference user's actual knowledge items. Found ${context.knowledgeItems.length} knowledge items but only ${knowledgeItemsReferenced.length} are referenced. Include specific data, quotes, URLs, and findings from knowledge items.`)
    }
  }

  // CRITICAL VALIDATION: Check if milestones are aligned with timeline
  if (context && context.milestones && context.milestones.length >= 2) {
    const timelineText = JSON.stringify(doc.implementationTimeline).toLowerCase()
    const milestonesReferenced = context.milestones.filter((milestone: any) => {
      const milestoneName = (milestone.name || '').toLowerCase()
      return timelineText.includes(milestoneName.slice(0, 20))
    })

    if (milestonesReferenced.length === 0 && context.milestones.length > 0) {
      issues.push(`Document timeline must align with user's milestones. Reference milestone names and dates in implementation timeline.`)
    }
  }

  return issues
}

const buildStrategicPrompt = (params: {
  documentType: string
  userMessage: string
  assistantResponse: string
  contextSummary: string
  remediationNotes?: string[]
  context?: StrategicContext
}) => {
  const { documentType, userMessage, assistantResponse, contextSummary, remediationNotes, context } = params

  const remediationBlock = remediationNotes && remediationNotes.length > 0
    ? `\nPREVIOUS ATTEMPT ISSUES (RESOLVE ALL):\n- ${remediationNotes.join('\n- ')}\n`
    : ''

  // Check if context is limited (no projects, goals, or tasks)
  const hasLimitedContext = !context || (
    (!context.projects || context.projects.length === 0) &&
    (!context.goals || context.goals.length === 0) &&
    (!context.tasks || context.tasks.length === 0)
  )

  const exampleScenarioBlock = hasLimitedContext
    ? `\nUSER CONTEXT IS LIMITED. Generate realistic example scenarios with fictional but plausible company names, metrics, and timelines to demonstrate the strategy. Mark these as [Example] but make them detailed enough to be adapted. For instance, if discussing a marketing strategy, use: "[Example: TechFlow AI, a Series A SaaS startup with 200 users at $40K MRR, targeting 500 users and $100K MRR in 90 days...]"\n`
    : ''

  return `Create a ${documentType} that the founder can execute immediately.

ORIGINAL USER REQUEST:
${userMessage}

INITIAL ASSISTANT NOTES (CRITICAL: Transform any meta-commentary into concrete strategy):
${assistantResponse}

TRANSFORMATION REQUIRED: If the assistant response above contains phrases like "I'll create", "I've developed", "This plan includes", "I recommend", transform those into direct strategic content with specific tactics, numbers, and deadlines. DO NOT reference what the assistant said - provide the actual strategy they described.

CONTEXT:
${contextSummary}
${exampleScenarioBlock}${remediationBlock}
REQUIRED STRUCTURE & DEPTH:
- Executive summary: 3-5 dense sentences referencing the company, target market, and primary strategic bets.
- Strategic analysis: include quantified market positioning, a SWOT breakdown, competitor analysis, and top risks with mitigations.
- Detailed action plan: at least 4 concrete steps. Each needs owner (role/team), deadline (ISO date), resources (budget, people, tools), and success metric (numeric).
- Implementation timeline: milestone schedule (weekly/monthly) with dependencies and critical path notes.
- KPIs: minimum 4 metrics spanning acquisition, activation, retention, and financial efficiency with explicit baselines & targets.
- Resource requirements: minimum 3 categories (budget, team, tooling) with cost ranges and accountable owners.
- Methodologies: list frameworks applied (SWOT, OKR, AARRR, growth loops, CAC/LTV, etc.).

STRICT RULES:
- No placeholders (TBD, XX, "to be defined"), no meta statements ("this document"), no empty sections.
- Quantify assumptions (budgets, conversion rates, CAC, timelines) with realistic numbers.
- Reference the user's company, projects, and goals by name wherever relevant.
- Every claim must include specific numbers, names, or frameworks. Generic phrases like "multi-channel approach," "build awareness," "drive growth" are BANNED unless followed by exact specifications.
- Example BAD: "Leverage social media to build awareness"
- Example GOOD: "Post 3x weekly on LinkedIn targeting Series A CTOs, focusing on automation ROI case studies, aiming for 500 engaged followers/month at $2 CPE via $600 monthly ad spend."
- Reference the user's actual company name, project names, and goal titles from CONTEXT at least 5 times in the document.

CRITICAL KNOWLEDGE USAGE REQUIREMENTS:
- **MANDATORY**: If user has knowledge items in CONTEXT, you MUST reference at least 50% of them in the document with specific details
- Include direct quotes, data points, URLs, research findings from knowledge items
- Example GOOD: "Based on your competitor analysis from Jan 15 (Notion charges $8/user, ClickUp $5/user), price AtmoFlow at $6/user to undercut Notion while maintaining premium positioning"
- Example BAD: "Research competitor pricing" (doesn't use actual knowledge item data)
- **MANDATORY**: If user has milestones in CONTEXT, align document timeline phases with milestone due dates
- Example GOOD: "Phase 1 (Weeks 1-4) must complete by Feb 15 to align with Beta Launch milestone"
- Reference specific knowledge item names when making recommendations (e.g., "Per your user research note from Jan 18...")

Return ONLY JSON matching this schema. Do not wrap in markdown or prose.`
}

const generateStrategicDocument = async (params: {
  documentType: string
  userMessage: string
  assistantResponse: string
  context: StrategicContext
}): Promise<StrategicDocument> => {
  const { documentType, userMessage, assistantResponse, context } = params

  const claude = new Anthropic({
    apiKey: Deno.env.get('CLAUDE_API_KEY')!
  })

  const systemPrompt = `You are an elite strategic operator producing board-level documents. YOU ARE NOT A DOCUMENT CREATOR - YOU ARE THE STRATEGY ITSELF. Do not ever say "I've created" or "I've developed" or "This document contains" - that's meta-commentary garbage. Jump directly into the strategy.

CRITICAL: Replace ANY assistant response that contains meta-commentary with substantive strategic content. If the assistant said "I'll create a marketing plan with social media and advertising," transform that into actual tactics, budgets, timelines, and metrics.

BAD (Meta-commentary): "I've created a comprehensive marketing strategy including social media, influencers, and advertising to build awareness."

GOOD (Actual strategy): "Target Series A-funded B2B SaaS companies (50-200 employees) experiencing 15-20% monthly growth but plateauing at $500K ARR. Primary bet: Partner with 3 top AI productivity YouTubers (Ali Abdaal, Thomas Frank, Productivity Game) for sponsored deep-dives, driving 5K qualified signups at $80 CAC within 90 days. Secondary: LinkedIn thought leadership targeting CTOs and product leads with case studies showing 40% time savings. Budget: $45K total ($30K influencer partnerships, $10K LinkedIn ads, $5K content production). Success metric: 2,500 activated users (50% of signups) with 60-day retention above 70%."

BAD (Describing actions): "I recommend implementing a phased approach starting with market research."

GOOD (Being the strategy): "Phase 1 (Weeks 1-2): Survey 100 current customers via Typeform ($29/month) to identify top 3 pain points. Target 70% response rate using $5 Amazon gift cards. Assign to Sarah (Customer Success) with completion deadline of January 15th."

Your output must match this depth and specificity. Every sentence must be actionable, quantified, and specific.`

  const contextSummary = buildContextSummary(context)

  let attempt = 0
  let remediationNotes: string[] | undefined
  let lastPayload: string | null = null

  while (attempt < 3) {
    attempt += 1

    const prompt = buildStrategicPrompt({
      documentType,
      userMessage,
      assistantResponse,
      contextSummary,
      remediationNotes,
      context
    })

    const response = await claude.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }]
    })

    const responseText = response.content
      .filter((block) => block.type === 'text')
      .map((block: any) => block.text)
      .join('\n')

    const jsonPayload = extractJsonBlock(responseText)

    if (!jsonPayload) {
      console.error('Strategic doc generation returned no JSON. Raw:', responseText)
      lastPayload = responseText
      remediationNotes = ['Return valid JSON payload conforming to the schema. No surrounding prose.']
      continue
    }

    lastPayload = jsonPayload

    let parsed: StrategicDocument
    try {
      parsed = JSON.parse(jsonPayload) as StrategicDocument
    } catch (error) {
      console.error('Failed to parse strategic document JSON:', error, '\nPayload:', jsonPayload)
      remediationNotes = ['Previous JSON was invalid. Ensure response is valid JSON without comments or trailing text.']
      continue
    }

    const validationIssues = validateStrategicDocument(parsed, context)
    if (validationIssues.length > 0) {
      console.warn('Strategic document validation issues:', validationIssues)
      remediationNotes = validationIssues
      continue
    }

    if (!parsed.title || parsed.title.length < 5) {
      parsed.title = `${documentType} for ${context.profile?.display_name || 'ATMO User'}`
    }

    parsed.detailedActionPlan = parsed.detailedActionPlan.map((item) => ({
      step: String(item.step || '').trim(),
      owner: String(item.owner || 'Owner TBD').trim(),
      deadline: String(item.deadline || 'TBD').trim(),
      resources: String(item.resources || 'Specify required resources').trim(),
      successMetric: String(item.successMetric || 'Define success metric').trim()
    }))

    parsed.implementationTimeline = parsed.implementationTimeline.map((item) => ({
      milestone: String(item.milestone || 'Milestone').trim(),
      startDate: String(item.startDate || 'TBD').trim(),
      endDate: String(item.endDate || 'TBD').trim(),
      dependencies: String(item.dependencies || 'None specified').trim()
    }))

    parsed.keyPerformanceIndicators = parsed.keyPerformanceIndicators.map((item) => ({
      metric: String(item.metric || 'Metric').trim(),
      baseline: String(item.baseline || 'Baseline needed').trim(),
      target: String(item.target || 'Target needed').trim(),
      cadence: String(item.cadence || 'Monthly').trim()
    }))

    parsed.resourceRequirements = parsed.resourceRequirements.map((item) => ({
      category: String(item.category || 'Resource').trim(),
      details: String(item.details || 'Provide detail').trim(),
      cost: String(item.cost || 'Estimate cost').trim(),
      owners: String(item.owners || 'Assign owner').trim()
    }))

    if (parsed.methodologies) {
      parsed.methodologies = parsed.methodologies.map((m) => String(m || '').trim()).filter(Boolean)
    }

    return parsed
  }

  throw new Error(`Strategic document generation failed after multiple attempts. Last payload: ${lastPayload}`)
}

/**
 * Extract a meaningful title from user message or content
 */
const extractTitle = (userMessage: string, content: string): string => {
  // Try to extract from user message first (e.g., "create a strategy for...")
  const userMatch = userMessage.match(/(?:create|write|make|generate)\s+(?:a|an)?\s*(.*?)(?:\s+for|\s+about|\s+on)?/i)
  if (userMatch && userMatch[1] && userMatch[1].length > 5 && userMatch[1].length < 60) {
    return userMatch[1].trim()
  }

  // Look for titles in markdown (# Title or ## Title)
  const titleMatch = content.match(/^#{1,2}\s+(.+)$/m)
  if (titleMatch && titleMatch[1]) {
    return titleMatch[1].trim()
  }

  // Use first sentence if it's reasonable length
  const firstSentence = content.split(/[.!?]\s+/)[0]
  if (firstSentence && firstSentence.length > 10 && firstSentence.length < 100) {
    return firstSentence.trim()
  }

  // Default fallback
  return 'ATMO Document'
}

/**
 * Generate a professional, comprehensive PDF document with ATMO branding
 * Creates 3-4 page business-ready documents with rich content
 */
const generateStrategicPDF = (params: {
  title: string
  documentType: string
  summary: string
  document: StrategicDocument
  metadata?: { userName?: string }
}): string => {
  const { title, documentType, summary, document, metadata } = params
  const docInstance = new jsPDF()

  const atmoOrange = [255, 95, 31]
  const atmoPurple = [147, 51, 234]
  const darkGray = [51, 51, 51]
  const lightGray = [160, 160, 160]

  let y = 20
  const pageWidth = docInstance.internal.pageSize.getWidth()
  const pageHeight = docInstance.internal.pageSize.getHeight()
  const margin = 20
  const contentWidth = pageWidth - margin * 2

  const renderHeader = () => {
    docInstance.setFillColor(atmoOrange[0], atmoOrange[1], atmoOrange[2])
    docInstance.rect(0, 0, pageWidth, 15, 'F')
    docInstance.setTextColor(255, 255, 255)
    docInstance.setFontSize(10)
    docInstance.text('ATMO AI', margin, 10)
    y = 30
  }

  const renderFooter = () => {
    const footerY = pageHeight - 15
    docInstance.setDrawColor(atmoOrange[0], atmoOrange[1], atmoOrange[2])
    docInstance.setLineWidth(0.3)
    docInstance.line(margin, footerY - 4, pageWidth - margin, footerY - 4)
    docInstance.setFontSize(8)
    docInstance.setFont('helvetica', 'italic')
    docInstance.setTextColor(lightGray[0], lightGray[1], lightGray[2])
    docInstance.text('Generated by ATMO Strategic Copilot', margin, footerY)
    docInstance.text(new Date().toLocaleString(), pageWidth - margin - 40, footerY)
  }

  const ensureSpace = (required: number) => {
    if (y + required > pageHeight - 25) {
      renderFooter()
      docInstance.addPage()
      renderHeader()
    }
  }

  const addHeading = (text: string) => {
    ensureSpace(12)
    docInstance.setFontSize(12)
    docInstance.setFont('helvetica', 'bold')
    docInstance.setTextColor(darkGray[0], darkGray[1], darkGray[2])
    docInstance.text(text.toUpperCase(), margin, y)
    y += 8
  }

  const addSubheading = (text: string) => {
    ensureSpace(10)
    docInstance.setFontSize(11)
    docInstance.setFont('helvetica', 'bold')
    docInstance.setTextColor(atmoPurple[0], atmoPurple[1], atmoPurple[2])
    docInstance.text(text, margin, y)
    y += 6
  }

  const addParagraph = (text: string) => {
    if (!text) return
    const clean = text.replace(/\s+/g, ' ').trim()
    if (!clean) return
    const lines = docInstance.splitTextToSize(clean, contentWidth)
    ensureSpace(lines.length * 5 + 5)
    docInstance.setFontSize(10)
    docInstance.setFont('helvetica', 'normal')
    docInstance.setTextColor(darkGray[0], darkGray[1], darkGray[2])
    docInstance.text(lines, margin, y)
    y += lines.length * 5 + 6
  }

  const addKeyValueLine = (pairs: Array<[string, string]>) => {
    const parts = pairs
      .filter(([, value]) => value && value.trim())
      .map(([key, value]) => `${key}: ${value.trim()}`)
    if (parts.length === 0) return
    addParagraph(parts.join(' | '))
  }

  renderHeader()

  // Title
  docInstance.setFontSize(20)
  docInstance.setFont('helvetica', 'bold')
  docInstance.setTextColor(darkGray[0], darkGray[1], darkGray[2])
  const titleLines = docInstance.splitTextToSize(title, contentWidth)
  docInstance.text(titleLines, margin, y)
  y += titleLines.length * 8 + 4

  docInstance.setFontSize(10)
  docInstance.setFont('helvetica', 'normal')
  docInstance.setTextColor(lightGray[0], lightGray[1], lightGray[2])
  const ownerText = metadata?.userName ? `Prepared for ${metadata.userName}` : 'ATMO Strategic Output'
  docInstance.text(`${documentType} • ${new Date().toLocaleDateString()} • ${ownerText}`, margin, y)
  y += 10

  docInstance.setDrawColor(atmoOrange[0], atmoOrange[1], atmoOrange[2])
  docInstance.setLineWidth(0.5)
  docInstance.line(margin, y, pageWidth - margin, y)
  y += 8

  // Executive Summary
  addHeading('Executive Summary')
  addParagraph(summary)

  // Strategic Analysis
  addHeading('Strategic Analysis')
  addSubheading('Market Positioning')
  addParagraph(document.strategicAnalysis.marketPositioning)
  addSubheading('Competitive Advantages')
  addParagraph(document.strategicAnalysis.competitiveAdvantages)
  addSubheading('Risk Assessment')
  addParagraph(document.strategicAnalysis.riskAssessment)

  // Detailed Action Plan
  ensureSpace(12)
  addHeading('Detailed Action Plan')
  document.detailedActionPlan.slice(0, 12).forEach((item, index) => {
    ensureSpace(20)
    addSubheading(`Step ${index + 1}: ${item.step}`)
    addKeyValueLine([
      ['Owner', item.owner],
      ['Deadline', item.deadline],
      ['Resources', item.resources],
      ['Success Metric', item.successMetric]
    ])
  })

  // Implementation Timeline
  ensureSpace(12)
  addHeading('Implementation Timeline')
  document.implementationTimeline.slice(0, 12).forEach((milestone, index) => {
    ensureSpace(18)
    addSubheading(`Phase ${index + 1}: ${milestone.milestone}`)
    addKeyValueLine([
      ['Start', milestone.startDate],
      ['End', milestone.endDate],
      ['Dependencies', milestone.dependencies]
    ])
  })

  // KPIs
  ensureSpace(12)
  addHeading('Key Performance Indicators')
  document.keyPerformanceIndicators.slice(0, 12).forEach((kpi) => {
    ensureSpace(14)
    docInstance.setFontSize(10)
    docInstance.setFont('helvetica', 'bold')
    docInstance.setTextColor(atmoOrange[0], atmoOrange[1], atmoOrange[2])
    docInstance.text('•', margin, y)
    docInstance.setTextColor(darkGray[0], darkGray[1], darkGray[2])
    const headline = `${kpi.metric} — Baseline: ${kpi.baseline} → Target: ${kpi.target} (${kpi.cadence})`
    const kpiLines = docInstance.splitTextToSize(headline, contentWidth - 6)
    docInstance.text(kpiLines, margin + 6, y)
    y += kpiLines.length * 5 + 4
  })

  // Resource Requirements
  ensureSpace(12)
  addHeading('Resource Requirements')
  document.resourceRequirements.slice(0, 12).forEach((resource) => {
    ensureSpace(16)
    docInstance.setFontSize(10)
    docInstance.setFont('helvetica', 'bold')
    docInstance.setTextColor(atmoPurple[0], atmoPurple[1], atmoPurple[2])
    docInstance.text(resource.category, margin, y)
    y += 6
    addKeyValueLine([
      ['Details', resource.details],
      ['Cost', resource.cost],
      ['Owners', resource.owners]
    ])
  })

  if (document.methodologies && document.methodologies.length > 0) {
    ensureSpace(12)
    addHeading('Strategic Frameworks Applied')
    document.methodologies.forEach((method) => addParagraph(method))
  }

  if (document.notes) {
    ensureSpace(12)
    addHeading('Additional Notes')
    addParagraph(document.notes)
  }

  renderFooter()

  const pdfOutput = docInstance.output('datauristring')
  return pdfOutput.split(',')[1]
}

/**
 * Normalize task name for duplicate detection
 * Removes articles, extra spaces, converts to lowercase
 */
const normalizeTaskName = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/\b(the|a|an)\b/g, '') // Remove articles
    .replace(/[^\w\s]/g, ' ') // Remove punctuation
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim()
}

/**
 * Extract keywords from task name
 */
const extractKeywords = (name: string): string[] => {
  const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as']
  return normalizeTaskName(name)
    .split(' ')
    .filter(word => word.length > 2 && !stopWords.includes(word))
}

/**
 * Calculate keyword similarity between two task names
 * Returns percentage of overlapping keywords (0-100)
 */
const calculateTaskSimilarity = (name1: string, name2: string): number => {
  const keywords1 = extractKeywords(name1)
  const keywords2 = extractKeywords(name2)

  if (keywords1.length === 0 || keywords2.length === 0) {
    return 0
  }

  const commonKeywords = keywords1.filter(k1 =>
    keywords2.some(k2 => k2.includes(k1) || k1.includes(k2))
  )

  const similarity = (commonKeywords.length / Math.max(keywords1.length, keywords2.length)) * 100
  return Math.round(similarity)
}

/**
 * Check if task is a semantic duplicate of existing tasks
 * Returns the duplicate task if found, null otherwise
 */
const findDuplicateTask = (newTaskName: string, existingTasks: Array<{ name: string }>, similarityThreshold: number = 70): { name: string, similarity: number } | null => {
  for (const task of existingTasks) {
    const similarity = calculateTaskSimilarity(newTaskName, task.name)

    if (similarity >= similarityThreshold) {
      console.log(`🔍 Found potential duplicate: "${newTaskName}" vs "${task.name}" (${similarity}% similar)`)
      return { name: task.name, similarity }
    }
  }

  return null
}

const DOCUMENT_FORCE_SAVE_REGEX = /\b(save this|add to outputs|add it to outputs|create document|save conversation|export this|save as document)/i
const DOCUMENT_EXPLICIT_REGEX = /\b(create|make|generate|give me|write|draft|build me)\s+(a|an|me)?\s*(document|plan|strategy document|strategic plan|marketing plan|business plan|guide|framework|outline|report|analysis|roadmap|pdf|document for)\b/i
const NON_DOCUMENT_CREATION_REGEX = /\b(create|make|add|start|build|setup)\s+(a|an|me|my)?\s*(new\s+)?(project|task|goal|event|meeting|album|folder|workspace|account|profile)(\s+for|\s+called|\s+named|\s+with|\s+that)?/i

type DocumentIntent = {
  forceSave: boolean
  isExplicitRequest: boolean
  isNonDocumentCreation: boolean
  shouldGenerate: boolean
}

const analyzeDocumentIntent = (userMessage: string): DocumentIntent => {
  const forceSave = DOCUMENT_FORCE_SAVE_REGEX.test(userMessage)
  const isExplicitRequest = DOCUMENT_EXPLICIT_REGEX.test(userMessage)
  const isNonDocumentCreation = NON_DOCUMENT_CREATION_REGEX.test(userMessage)
  const shouldGenerate = forceSave || (isExplicitRequest && !isNonDocumentCreation)

  return {
    forceSave,
    isExplicitRequest,
    isNonDocumentCreation,
    shouldGenerate,
  }
}

/**
 * Detect and save documents from chat responses
 */
const detectAndSaveDocument = async (params: {
  supabaseClient: any
  userId: string
  sessionId: string
  userMessage: string
  assistantResponse: string
  documentIntent?: DocumentIntent
}): Promise<{ generated: boolean; intent: DocumentIntent }> => {
  const { supabaseClient, userId, sessionId, userMessage, assistantResponse, documentIntent } = params

  console.log('🔍 Document detection called')
  console.log('📝 User message:', userMessage.substring(0, 100))
  console.log('📝 Response length:', assistantResponse.length)

  // STRICT EXPLICIT-ONLY DOCUMENT GENERATION
  // Only create documents when user EXPLICITLY requests them

  // Force save triggers - user explicitly asks to save conversation
  const intent = documentIntent ?? analyzeDocumentIntent(userMessage)

  console.log('🔍 Document detection details:', {
    forceSave: intent.forceSave,
    isExplicitRequest: intent.isExplicitRequest,
    isNonDocumentCreation: intent.isNonDocumentCreation,
    userMessageSample: userMessage.substring(0, 100)
  })

  // STRICT: Only proceed if user explicitly requested a document AND not creating other entities
  if (!intent.shouldGenerate) {
    console.log('✅ DOCUMENT CREATION CORRECTLY BLOCKED')
    console.log('  → Force save:', intent.forceSave)
    console.log('  → Explicit request:', intent.isExplicitRequest)
    console.log('  → Non-document creation detected:', intent.isNonDocumentCreation)
    if (intent.isNonDocumentCreation) {
      console.log('  ✅ USER IS CREATING A PROJECT/TASK/GOAL - NOT A DOCUMENT')
    }
    console.log('  → Skipping document creation (this is correct behavior)')
    return { generated: false, intent }
  }

  console.log('⚠️ PROCEEDING WITH DOCUMENT CREATION')
  console.log('  → This should only happen for explicit document requests!')

  // Require substantial response - minimum 500 characters for quality documents
  if (assistantResponse.length < 500) {
    console.log('❌ Response too short (< 500 chars), skipping document creation')
    return { generated: false, intent }
  }

  // Document type detection - ONLY for explicit requests
  const documentPatterns: Record<string, RegExp> = {
    'Strategic Plan': /\b(strategic plan|business plan|roadmap)\b/i,
    'Marketing Strategy': /\b(marketing strategy|marketing plan|go-to-market)\b/i,
    'Action Plan': /\b(action plan|implementation plan|execution plan)\b/i,
    'Framework': /\b(framework|structure|system)\b/i,
    'Guide': /\b(guide|handbook|manual)\b/i,
    'Analysis': /\b(analysis|report|research)\b/i,
  }

  // Match document type from user request
  let matchedType = Object.entries(documentPatterns).find(([type, pattern]) =>
    pattern.test(userMessage)
  )

  // Default to generic document if no specific type matched
  if (!matchedType) {
    matchedType = ['Strategic Document', /./]
    console.log('📄 Using default document type')
  }

  console.log('✅ Creating document:', matchedType[0])

  const [documentType] = matchedType

  try {
    console.log(`📄 Creating ${documentType} PDF for you...`)

    // Build strategic document content with rich personalization
    const context = await fetchStrategicContext(supabaseClient, userId)
    const strategicDocument = await generateStrategicDocument({
      documentType,
      userMessage,
      assistantResponse,
      context
    })

    const baseTitle = extractTitle(userMessage, strategicDocument.executiveSummary || assistantResponse)
    const docTitle = strategicDocument.title?.trim() || baseTitle
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `${docTitle} - ${timestamp}.pdf`
    console.log(`📝 Filename: ${filename}`)

    const summary = strategicDocument.executiveSummary
    console.log(`📝 Summary length: ${summary.length}`)

    // Generate PDF with structured sections
    console.log(`🔨 Calling generateStrategicPDF...`)
    let pdfBase64
    try {
      pdfBase64 = generateStrategicPDF({
        title: docTitle,
        documentType,
        summary,
        document: strategicDocument,
        metadata: { userName: context.profile?.display_name || context.profile?.email }
      })
      console.log(`✅ PDF generated, base64 length: ${pdfBase64?.length || 0}`)
    } catch (pdfError) {
      console.error('❌ PDF generation failed:', pdfError)
      throw pdfError
    }

    // Estimate file size from base64 length
    const fileSize = Math.ceil((pdfBase64.length * 3) / 4)
    console.log(`📊 Estimated file size: ${fileSize} bytes`)

    // Prepare insert data
    const insertData = {
      persona_id: userId,
      session_id: sessionId,
      filename,
      file_type: 'pdf',
      content_data: {
        structuredDocument: strategicDocument,
        executiveSummary: summary,
        pdfBase64,
        source: {
          userMessage,
          assistantResponse
        }
      },
      file_size: fileSize
    }
    console.log(`💾 Inserting to atmo_outputs table...`, {
      persona_id: userId,
      filename,
      file_type: 'pdf',
      file_size: fileSize
    })

    // Save to atmo_outputs table
    const { data, error } = await supabaseClient
      .from('atmo_outputs')
      .insert(insertData)
      .select()

    if (error) {
      console.error('❌ Database insert failed:', error)
      console.error('❌ Error details:', JSON.stringify(error, null, 2))
      throw new Error(`Database insert failed: ${error.message}`)
    } else {
      console.log(`✅ Saved document: ${filename} (${documentType})`)
      console.log(`✅ Database response:`, data)
      return { generated: true, intent }
    }
  } catch (err) {
    console.error('❌ ERROR in document generation:', err)
    console.error('❌ Error stack:', err instanceof Error ? err.stack : 'No stack trace')
    console.error('❌ Error type:', typeof err)
    console.error('❌ Error message:', err instanceof Error ? err.message : String(err))
    // Fallback: save as markdown if PDF generation fails
    try {
      const baseTitle = extractTitle(userMessage, assistantResponse)
      const timestamp = new Date().toISOString().split('T')[0]
      const filename = `${baseTitle} - ${timestamp}.md`
      const markdownContent = `# ${baseTitle}\n\n**Type:** ${documentType}\n**Generated:** ${new Date().toLocaleString()}\n\n---\n\n${assistantResponse}`

      await supabaseClient
        .from('atmo_outputs')
        .insert({
          persona_id: userId,
          session_id: sessionId,
          filename: filename,
          file_type: 'markdown',
          content_data: { content: markdownContent },
          file_size: new Blob([markdownContent]).size
        })

      console.log(`⚠️ Fallback: Saved as markdown instead of PDF`)
    } catch (fallbackErr) {
      console.error('Fallback markdown save also failed:', fallbackErr)
    }

    return { generated: false, intent }
  }
}

type ProjectLookupResult = {
  project: { id: string; name: string; updated_at: string | null; active: boolean | null } | null
  error?: string
}

const resolveProjectForGoal = async (
  supabaseClient: any,
  userId: string,
  identifiers: { projectId?: string | null; projectName?: string | null }
): Promise<ProjectLookupResult> => {
  const trimmedId = identifiers.projectId?.toString().trim()
  const trimmedName = identifiers.projectName?.toString().trim()

  if (trimmedId) {
    const { data, error } = await supabaseClient
      .from('projects')
      .select('id, name, updated_at, active')
      .eq('owner_id', userId)
      .eq('id', trimmedId)
      .maybeSingle()

    if (error) {
      console.error('Failed to resolve project by id:', error)
      return { project: null, error: 'I had trouble looking up that project. Could you try again?' }
    }

    if (!data) {
      return { project: null, error: `I couldn't find a project for that id. Which project should I use?` }
    }

    return { project: data }
  }

  if (trimmedName) {
    const { data, error } = await supabaseClient
      .from('projects')
      .select('id, name, updated_at, active')
      .eq('owner_id', userId)
      .eq('name', trimmedName)

    if (error) {
      console.error('Failed to resolve project by name:', error)
      return { project: null, error: 'I had trouble checking that project name. Can you confirm it?' }
    }

    if (!data || data.length === 0) {
      return { project: null, error: `I couldn't find a project called "${trimmedName}". Which project should I update?` }
    }

    const activeProjects = data.filter((project) => project.active !== false)
    const candidates = activeProjects.length > 0 ? activeProjects : data

    const sorted = candidates
      .map((project) => ({
        ...project,
        __ts: project.updated_at ? new Date(project.updated_at).getTime() : 0
      }))
      .sort((a, b) => b.__ts - a.__ts)

    return { project: sorted[0] }
  }

  return { project: null, error: 'Which project should I use for that goal?' }
}

/**
 * Calculate task priority based on deadline proximity rules:
 * - High: Goal/milestone due within 3 days OR project priority is High
 * - Medium: Default for all other cases
 */
async function calculateTaskPriority(
  supabaseClient: ReturnType<typeof createClient>,
  userId: string,
  projectId: string | null,
  goalId: string | null
): Promise<string> {
  if (!projectId) {
    return 'medium'
  }

  // Fetch project with priority
  const { data: project } = await supabaseClient
    .from('projects')
    .select('priority')
    .eq('owner_id', userId)
    .eq('id', projectId)
    .maybeSingle()

  // Rule 1: Check if goal has a target date within 3 days
  if (goalId) {
    const { data: goal } = await supabaseClient
      .from('project_goals')
      .select('target_date')
      .eq('owner_id', userId)
      .eq('id', goalId)
      .maybeSingle()

    if (goal?.target_date) {
      const goalDate = new Date(goal.target_date)
      const now = new Date()
      const daysUntil = Math.ceil((goalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      if (daysUntil <= 3 && daysUntil >= 0) {
        return 'high'
      }
    }
  }

  // Rule 2: Check if project has milestones due within 3 days
  const { data: upcomingMilestones } = await supabaseClient
    .from('project_milestones')
    .select('due_date, status')
    .eq('owner_id', userId)
    .eq('project_id', projectId)
    .neq('status', 'Completed')

  if (upcomingMilestones && upcomingMilestones.length > 0) {
    const now = new Date()
    const hasUrgentMilestone = upcomingMilestones.some((m) => {
      if (!m.due_date) return false
      const milestoneDate = new Date(m.due_date)
      const daysUntil = Math.ceil((milestoneDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      return daysUntil <= 3 && daysUntil >= 0
    })

    if (hasUrgentMilestone) {
      return 'high'
    }
  }

  // Rule 3: Check if project priority is High
  if (project?.priority?.toLowerCase() === 'high') {
    return 'high'
  }

  return 'medium'
}

// Test jsPDF import at startup
console.log('🔧 Edge function loaded, jsPDF available:', typeof jsPDF)

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with user's auth token
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Verify user authentication
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      console.error('Authentication error:', authError)
      return new Response(
        JSON.stringify({ error: 'You must be logged in to use chat. Please sign in or create an account.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const { message, messageId } = await req.json()
    if (!message || typeof message !== 'string') {
      throw new Error('Message is required')
    }
    const documentIntent = analyzeDocumentIntent(message)

    // Get user profile for context
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('onboarding_data, display_name, email')
      .eq('id', user.id)
      .single()

    // Get recent chat history (last 10 messages)
    const { data: chatHistory } = await supabaseClient
      .from('chat_messages')
      .select('role, content')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    // Get current projects for context
    const { data: projects } = await supabaseClient
      .from('projects')
      .select('name, description, status, priority')
      .eq('owner_id', user.id)
      .eq('active', true)

    // Get recent tasks for duplicate prevention
    const { data: recentTasks } = await supabaseClient
      .from('project_tasks')
      .select('name, created_at')
      .eq('owner_id', user.id)
      .eq('completed', false)
      .order('created_at', { ascending: false })
      .limit(20)

    // Build Claude system prompt with user context
    const onboardingData = profile?.onboarding_data || {}
    const userName = profile?.display_name || profile?.email?.split('@')[0] || 'User'

    const systemPrompt = `You are ATMO, a proactive AI co-pilot helping ${userName} achieve their goals.

USER CONTEXT:
Name: ${userName}
Onboarding Data: ${JSON.stringify(onboardingData, null, 2)}
Focus Areas: ${onboardingData?.work?.focusAreas?.join(', ') || 'Not set'}

CURRENT PROJECTS:
${projects && projects.length > 0 ? JSON.stringify(projects, null, 2) : 'No active projects yet'}

RECENT ACTIVE TASKS (for duplicate prevention):
${recentTasks && recentTasks.length > 0 ? recentTasks.map(t => `- ${t.name}`).join('\n') : 'No active tasks yet'}

RESPONSE BEHAVIOR - CRITICAL RULES:
1. BE DECISIVE: When user requests something, DO IT FIRST, then ask clarifying questions if needed
2. MAX 3 QUESTIONS: If you need clarification, ask maximum 3 questions in bullet format (• Question?)
3. CONCISE RESPONSES: Keep responses under 100 words unless generating detailed documents/strategies
4. ACTION FIRST: Create entities/documents immediately, don't ask permission first
5. BULLET FORMAT: All follow-up questions must use bullet points (• Question here?)
6. NO OVER-EXPLAINING: State what you did, then move forward

EXAMPLE TRANSFORMATIONS:
❌ BAD: "I'd be happy to help! Before I proceed, I need to understand: What's your target audience? What's your budget? Which channels have you tried? What are your competitors doing?"
✅ GOOD: "I've created a marketing strategy document for you.
• Which digital channels should I prioritize: paid social, SEO, or content?
• What's your launch timeline?
• Do you prefer community-building or direct acquisition?"

❌ BAD: "That sounds great! Before we create this, can you tell me more about the project scope and timeline?"
✅ GOOD: "Created! Should I add initial milestones for Q1?"

YOUR ROLE:
- Proactively anticipate user needs and suggest next steps
- Extract actionable items from conversation
- Use onboarding data + profile + chat history as single source of truth
- Automatically suggest updates when user intent shifts
- Help organize projects, goals, milestones, and tasks with proper hierarchical links

PROACTIVE INTELLIGENCE:
After creating entities, ALWAYS suggest logical next steps:
- After creating project → "I created '{projectName}'—shall I add initial milestones based on your timeline?"
- After creating goal → "Goal '{goalName}' added. Want me to break it into specific tasks?"
- After creating task → "Task ready. Should I prioritize it based on your Focus Areas?"

DAILY FOCUS LOGIC:
- Analyze due dates from tasks/goals/milestones
- Assign priority: < 3 days = High, < 7 days = Medium, else Low
- Suggest today's specific actions based on deadlines + Focus Areas
- Example: "Based on your deadlines, I recommend focusing on {task1}, {task2} today."

FOCUS AREAS AUTO-UPDATE:
- Monitor recent messages for intent shifts
- If user focus changes, suggest: "I noticed you're focusing on {newArea}—should I update your Focus Areas to include this?"

IMPORTANT - RESPONSE FORMAT:
When users mention projects, tasks, goals, or milestones, YOU MUST respond with BOTH:
1. A natural, conversational response
2. Structured JSON for entities to extract

CRITICAL - DISTINGUISH REQUEST TYPES:

1. ENTITY CREATION REQUESTS (create entities in database):
   - Explicit commands: "add goal X", "create task Y", "add project Z", "I'm working on X"
   - Action verbs: add, create, start, make, build, working on
   - Specific entity names provided by user
   - User wants to track/organize something new

2. INFORMATION/SUGGESTION REQUESTS (NO entities, only conversational response):
   - Question patterns: "what tasks should I...", "which goals...", "best tasks to...", "what should I..."
   - Recommendation requests: "suggest tasks", "recommend priorities", "help me prioritize"
   - Analysis requests: "analyze my goals", "review my tasks", "what to focus on"
   - NEVER create entities like "imbox", "inbox", or nonsensical names
   - Return EMPTY entities array [] but provide helpful suggestions in conversationalResponse

CRITICAL - TASK CREATION RULES:
When user says "add task" or "create task":
- ONLY create entity type: "task" - NEVER create "goal" entities
- Tasks can exist independently without goals
- Extract project name from context if mentioned
- When the user explicitly confirms the project (e.g. "add it to Project Phoenix"), include "projectConfirmed": true on the task entity (snake_case also accepted) so I know it came directly from the user.
- NEVER auto-create goals, projects, or placeholder entities
- If project doesn't exist, ask user to specify which project

CRITICAL - TASK QUALITY STANDARDS:
PRIORITY STREAM must contain ONLY high-quality, specific, actionable tasks:
- Each task must be SPECIFIC and CONCRETE (not vague like "work on project")
- Task names must be ACTION-ORIENTED with clear deliverables
- NEVER create generic tasks like "review", "update", "check", "work on"
- Each task needs a detailed description explaining WHAT and WHY
- Tasks should be completable in a single work session (1-4 hours)

GOOD TASK EXAMPLES:
✅ "Design mobile-responsive navigation component for dashboard"
✅ "Write API endpoint for user authentication with JWT tokens"
✅ "Create marketing copy for landing page hero section"
✅ "Research competitor pricing models for SaaS tier structure"

BAD TASK EXAMPLES (NEVER CREATE THESE):
❌ "Work on website" (too vague)
❌ "Update project" (no specific deliverable)
❌ "Review code" (missing context - which code?)
❌ "Fix bugs" (which bugs? where?)
❌ "Marketing" (not an actionable task)

CRITICAL - DUPLICATE PREVENTION:
Before creating ANY task, check RECENT ACTIVE TASKS list above:
1. If task name matches existing task (exact or similar), DO NOT CREATE
2. If similar task exists (e.g., "review code" vs "code review"), DO NOT CREATE
3. If user repeats same request, acknowledge existing task: "I already added 'Review code' - would you like to add something else?"
4. Check for semantic duplicates (different words, same meaning)
5. If creating multiple tasks in one response, ensure they're distinct from each other
6. Priority Stream is not a TODO dump - quality over quantity ALWAYS

Format your response EXACTLY like this:
{
  "conversationalResponse": "Your natural response here...",
  "entities": [
    {
      "type": "project|task|goal|milestone|knowledge|insight",
      "data": {
        "name": "...",
        "description": "...",
        // Additional fields based on type
      }
    }
  ],
  "nextSteps": [
    {
      "action": "create_milestone|create_task|set_priority|update_focus",
      "description": "What this action will do",
      "command": "Exact command user can say to execute this"
    }
  ]
}

ENTITY TYPES & FIELDS:
- project: name (required), description, priority (high/medium/low), status, action (create|update|delete)
- task: name (required), description, project (name of related project), priority, dueDate (ISO date), action (create|update|delete)
- goal: name (required), description, project (name required), targetDate, status, action (create|update|delete)
- milestone: name (required), description, project (name required), dueDate, status, action (create|update|delete)
- knowledge: name (required), content, type (summary|note|idea), tags (array)
- insight: title (required), type (article|opportunity|trend|note required), summary, category (personal|project), project (name), source_url, relevance (1-100)

EXAMPLES:
User: "I'm working on building ATMO"
You: {
  "conversationalResponse": "That's exciting! ATMO sounds like an ambitious project. I've created it—shall I add initial milestones based on your timeline?",
  "entities": [{
    "type": "project",
    "data": {
      "name": "ATMO Platform",
      "description": "Building ATMO",
      "priority": "high",
      "status": "active"
    }
  }],
  "nextSteps": [
    {
      "action": "create_milestone",
      "description": "Add key milestones for ATMO Platform",
      "command": "add milestone 'Launch MVP' to ATMO Platform due next month"
    },
    {
      "action": "create_goal",
      "description": "Define primary goals for this project",
      "command": "add a goal 'Complete core features' to ATMO Platform"
    }
  ]
}

User: "I need to design the landing page and write docs"
You: {
  "conversationalResponse": "Got it! I've noted those tasks. When would you like to have the landing page and docs completed?",
  "entities": [
    {
      "type": "task",
      "data": {
        "name": "Design landing page",
        "description": "Create landing page design for ATMO",
        "project": "ATMO Platform",
        "priority": "high"
      }
    },
    {
      "type": "task",
      "data": {
        "name": "Write documentation",
        "description": "Write docs for ATMO",
        "project": "ATMO Platform",
        "priority": "medium"
      }
    }
  ]
}

User: "I found an article about productivity at example.com"
You: {
  "conversationalResponse": "Great find! I've saved that article to your insights.",
  "entities": [{
    "type": "insight",
    "data": {
      "title": "Productivity techniques article",
      "type": "article",
      "summary": "Article about productivity techniques",
      "category": "personal",
      "source_url": "example.com",
      "relevance": 70
    }
  }]
}

User: "Delete the ATMO Platform project"
You: {
  "conversationalResponse": "I've deleted the ATMO Platform project for you.",
  "entities": [{
    "type": "project",
    "data": {
      "name": "ATMO Platform",
      "action": "delete"
    }
  }]
}

User: "Remove the landing page goal"
You: {
  "conversationalResponse": "I've removed the landing page goal.",
  "entities": [{
    "type": "goal",
    "data": {
      "name": "Design landing page",
      "action": "delete"
    }
  }]
}

EXAMPLES OF SUGGESTION REQUESTS (NO entity creation):
User: "What are the best tasks to perform to reach my goals?"
You: {
  "conversationalResponse": "Based on your current goals, I recommend prioritizing:\n\n1. **Launch MVP** - Focus on completing core features and testing\n2. **Marketing Campaign** - Start with audience research and content planning\n3. **Team Hiring** - Quick win: post job descriptions today\n\nWant me to create any of these as actual tasks?",
  "entities": [],
  "nextSteps": []
}

User: "Suggest tasks for my current projects"
You: {
  "conversationalResponse": "Here are suggested tasks for your active projects:\n\n**ATMO Platform:**\n• Complete API integration\n• Write user documentation\n• Set up analytics\n\n**Marketing Campaign:**\n• Design social media graphics\n• Draft email sequences\n\nShall I create any of these tasks for you?",
  "entities": [],
  "nextSteps": []
}

User: "What should I focus on today?"
You: {
  "conversationalResponse": "Based on your deadlines and priorities, focus on:\n\n1. High priority: Complete design mockups (due in 2 days)\n2. Quick win: Review and approve marketing copy\n3. Important: Schedule team meeting for next sprint\n\nWant to prioritize any of these tasks?",
  "entities": [],
  "nextSteps": []
}

INSIGHT GENERATION RULES:
- Generate insights ONLY from: user onboarding data, current active projects/goals, and recent chat context
- Types: article (external link), opportunity (action item), trend (pattern observed), note (observation)
- NEVER invent URLs or external sources - only use user-provided links
- Base relevance on user's current focus areas and active work
- Goals and milestones MUST have a project specified

If user is just chatting with no actionable items, return empty entities array but still provide conversational response.

Remember: ALWAYS return valid JSON with conversationalResponse and entities fields.`

    // Initialize Claude client
    const claude = new Anthropic({
      apiKey: Deno.env.get('CLAUDE_API_KEY')!
    })

    // Build conversation history
    const conversationHistory = (chatHistory || [])
      .reverse()
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }))

    // Send request to Claude
    const response = await claude.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [
        ...conversationHistory,
        { role: 'user', content: message }
      ]
    })

    const responseText = response.content
      .filter((block) => block.type === 'text')
      .map((block: any) => block.text)
      .join('\n');

    const jsonPayload = extractJsonBlock(responseText);

    if (!jsonPayload) {
      console.error('Claude response missing JSON payload. Raw response:', responseText);
      throw new Error('Claude response missing JSON payload');
    }

    let parsed: { conversationalResponse: string; entities: any[] };
    try {
      parsed = JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Failed to parse Claude JSON response:', error, '\nExtracted payload:', jsonPayload);
      throw new Error('Claude returned an unexpected response format');
    }

    if (!parsed || typeof parsed.conversationalResponse !== 'string' || !Array.isArray(parsed.entities)) {
      console.error('Parsed Claude response missing required fields:', parsed);
      throw new Error('Claude response missing required fields');
    }

    // Get or create active session
    const { data: sessionId, error: sessionError } = await supabaseClient
      .rpc('get_or_create_active_session', { user_id: user.id })

    if (sessionError) {
      console.error('Failed to get/create session:', sessionError)
      throw new Error('Failed to create chat session')
    }

    // Store user message with session
    await supabaseClient.from('chat_messages').insert({
      owner_id: user.id,
      session_id: sessionId,
      role: 'user',
      content: message
    })

    // Store assistant response with session
    const { data: assistantMsg } = await supabaseClient
      .from('chat_messages')
      .insert({
        owner_id: user.id,
        session_id: sessionId,
        role: 'assistant',
        content: parsed.conversationalResponse
      })
      .select()
      .single()

    // Autonomous document detection
    let documentResult: { generated: boolean; intent: DocumentIntent } = {
      generated: false,
      intent: documentIntent,
    }
    console.log('🚀 About to call detectAndSaveDocument...')
    try {
      documentResult = await detectAndSaveDocument({
        supabaseClient,
        userId: user.id,
        sessionId,
        userMessage: message,
        assistantResponse: parsed.conversationalResponse,
        documentIntent,
      })
      console.log('✅ detectAndSaveDocument completed', {
        generated: documentResult.generated,
        intent: documentResult.intent,
      })
    } catch (docError) {
      console.error('❌ detectAndSaveDocument FAILED:', docError)
      console.error('❌ Stack:', docError instanceof Error ? docError.stack : 'No stack')
    }

    // Execute and store parsed entities
    const executedEntities: any[] = []
    const automationMessages: string[] = []
    const shouldSkipEntityAutomation = documentResult.intent.shouldGenerate

    if (shouldSkipEntityAutomation) {
      if (parsed.entities && parsed.entities.length > 0) {
        console.log('🛑 Document intent detected - skipping entity automation and clearing parsed entities')
        parsed.entities = []
      } else {
        console.log('🛑 Document intent detected - no entities to clear')
      }
    } else if (parsed.entities && parsed.entities.length > 0) {
      console.log('🎯 Entities to create:', JSON.stringify(parsed.entities, null, 2))

      for (const entity of parsed.entities) {
        try {
          let createdItem = null
          console.log(`📝 Processing entity: ${entity.type} - ${entity.data.name}`)

          switch (entity.type) {
            case 'project':
              if (entity.data.name) {
                // Handle DELETE action
                if (entity.data.action === 'delete') {
                  const { data: projectToDelete } = await supabaseClient
                    .from('projects')
                    .select('id, name')
                    .eq('owner_id', user.id)
                    .ilike('name', entity.data.name)
                    .limit(1)
                    .single()

                  if (projectToDelete) {
                    const { error: deleteError } = await supabaseClient
                      .from('projects')
                      .update({ status: 'deleted', active: false })
                      .eq('id', projectToDelete.id)

                    if (!deleteError) {
                      createdItem = { type: 'project', name: projectToDelete.name, id: projectToDelete.id, action: 'deleted' }
                      console.log('Deleted project:', projectToDelete.name)
                    }
                  } else {
                    console.warn('⚠️ Project not found for deletion:', entity.data.name)
                  }
                  break
                }

                // IDEMPOTENCY CHECK: Check for existing project within 5 minutes
                const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
                const { data: existingProjects } = await supabaseClient
                  .from('projects')
                  .select('id, name, status')
                  .eq('owner_id', user.id)
                  .ilike('name', entity.data.name)
                  .gte('created_at', fiveMinutesAgo)
                  .limit(1)

                if (existingProjects && existingProjects.length > 0) {
                  const existingProject = existingProjects[0]
                  // UPDATE mode: update existing project
                  const { data: updatedProject, error: updateError } = await supabaseClient
                    .from('projects')
                    .update({
                      description: entity.data.description || null,
                      priority: entity.data.priority || null,
                      status: entity.data.status || existingProject.status
                    })
                    .eq('id', existingProject.id)
                    .select()
                    .single()

                  if (!updateError && updatedProject) {
                    createdItem = { type: 'project', name: updatedProject.name, id: updatedProject.id }
                    console.log('Updated project:', updatedProject.name)
                  }
                } else {
                  // INSERT mode: create new project
                  // FIX: Use "Planned" as default status for consistency with UI filters
                  const projectStatus = entity.data.status || 'Planned';
                  console.log(`📋 Creating project "${entity.data.name}" with status: "${projectStatus}"`);

                  const { data: newProject, error } = await supabaseClient
                    .from('projects')
                    .insert({
                      owner_id: user.id,
                      name: entity.data.name,
                      description: entity.data.description || null,
                      priority: entity.data.priority || null,
                      status: projectStatus,
                      active: true,
                      color: '#3b82f6', // Default blue
                      progress: 0
                    })
                    .select()
                    .single()

                  if (error) {
                    console.error('❌ FAILED TO CREATE PROJECT:', error)
                    console.error('Project data:', entity.data)
                  } else if (newProject) {
                    createdItem = { type: 'project', name: newProject.name, id: newProject.id }
                    console.log(`✅ Successfully created project: "${newProject.name}" (ID: ${newProject.id}, Status: "${newProject.status}", Active: ${newProject.active})`)
                  } else {
                    console.error('❌ No project returned from insert (no error but no data)')
                  }
                }
              }
              break

            case 'task':
              if (entity.data.name) {
                console.log(`🔍 Processing task: "${entity.data.name}"`)

                const projectConfirmed = entity.data.projectConfirmed === true || entity.data.project_confirmed === true

                // Find project ID if project name or ID is mentioned
                let projectId = entity.data.projectId ?? entity.data.project_id ?? null
                if (entity.data.project && typeof entity.data.project === 'string') {
                  const rawProjectName = entity.data.project.trim()
                  console.log(`🔍 Looking for project: "${rawProjectName}"`)

                  const { data: matchingProjects, error: projectError } = await supabaseClient
                    .from('projects')
                    .select('id, name')
                    .eq('owner_id', user.id)
                    .eq('active', true)
                    .neq('status', 'deleted')
                    .ilike('name', `%${rawProjectName}%`)
                    .order('updated_at', { ascending: false })
                    .limit(5)

                  if (projectError) {
                    console.log(`⚠️ Project lookup error:`, projectError)
                  } else if (matchingProjects && matchingProjects.length > 0) {
                    const normalizedTarget = rawProjectName.toLowerCase()
                    const exactMatches = matchingProjects.filter((project) =>
                      project.name.trim().toLowerCase() === normalizedTarget
                    )

                    if (projectConfirmed && exactMatches.length === 1) {
                      projectId = exactMatches[0].id
                      console.log(`✅ User confirmed project match: ${projectId}`)
                    } else if (projectConfirmed && exactMatches.length === 0) {
                      automationMessages.push(
                        `I couldn't find a project named **${rawProjectName}**. Could you double-check the name or let me know if I should create it first?`
                      )
                      continue
                    } else if (projectConfirmed && exactMatches.length > 1) {
                      const options = exactMatches.map((project, index) => `${index + 1}. ${project.name}`).join('\n')
                      automationMessages.push(
                        `There are multiple projects called **${rawProjectName}**:\n${options}\nWhich one should own **"${entity.data.name}"**?`
                      )
                      continue
                    } else if (!projectConfirmed) {
                      // User mentioned project but didn't explicitly confirm - be smart about it
                      if (exactMatches.length === 1 && matchingProjects.length === 1) {
                        // Perfect match - use it without asking
                        projectId = exactMatches[0].id
                        console.log(`✅ Exact project match found, using: ${exactMatches[0].name}`)
                      } else {
                        // Ambiguous - ask user
                        const options = matchingProjects.map((project, index) => `${index + 1}. ${project.name}`).join('\n')
                        automationMessages.push(
                          `Multiple projects match **"${rawProjectName}"**:\n${options}\nWhich project should I add **"${entity.data.name}"** to?`
                        )
                        continue
                      }
                    }
                  } else {
                    console.log(`⚠️ No project found matching "${rawProjectName}"`)
                    if (projectConfirmed) {
                      automationMessages.push(
                        `I couldn't find a project named **${rawProjectName}**. Please create it first or tell me which existing project should own **"${entity.data.name}"**.`
                      )
                    } else {
                      automationMessages.push(
                        `I couldn't match **"${entity.data.project}"** to a specific project yet. Which project should own **"${entity.data.name}"**?`
                      )
                    }
                    continue
                  }
                }

                // CRITICAL: If no project specified, prompt user instead of guessing
                // NEVER fallback to "first active project" - always ask explicitly
                if (!projectId) {
                  console.log(`⛔️ No project context for "${entity.data.name}", prompting user`)

                  // Fetch user's projects to present options
                  const { data: userProjects } = await supabaseClient
                    .from('projects')
                    .select('name, color')
                    .eq('owner_id', user.id)
                    .eq('active', true)
                    .neq('status', 'deleted')
                    .order('updated_at', { ascending: false })
                    .limit(5)

                  if (userProjects && userProjects.length > 0) {
                    const projectList = userProjects.map((p, i) => `${i + 1}. ${p.name}`).join('\n')
                    automationMessages.push(
                      entity.data.project
                        ? `I couldn't match **"${entity.data.project}"** to a specific project.\n\nYour active projects:\n${projectList}\n\nWhich one should own **"${entity.data.name}"**?`
                        : `I couldn't tell which project **"${entity.data.name}"** belongs to.\n\nYour active projects:\n${projectList}\n\nWhich project should I add this task to?`
                    )
                  } else {
                    automationMessages.push(
                      `I couldn't tell which project **"${entity.data.name}"** belongs to. Please create a project first, or specify which project this task belongs to.`
                    )
                  }
                  continue
                }

                // Enhanced validation: Check for meaningful description (minimum 50 chars)
                const descriptionText = typeof entity.data.description === 'string'
                  ? entity.data.description.trim()
                  : ''
                const wordCount = descriptionText ? descriptionText.split(/\s+/).filter(Boolean).length : 0
                const sentenceCount = descriptionText
                  ? descriptionText.split(/[.!?]\s+/).filter(Boolean).length
                  : 0
                const normalizedDescription = descriptionText.toLowerCase()
                const vaguePatterns = [
                  'tbd',
                  'n/a',
                  'not sure',
                  'figure out',
                  'need details',
                  'add description',
                  'todo',
                  'placeholder',
                  'work on it',
                  'look into',
                  'something',
                  '???',
                  'later',
                  'someday'
                ]
                const containsVagueLanguage = vaguePatterns.some((pattern) =>
                  normalizedDescription.includes(pattern)
                )
                const containsActionVerb = /\b(design|draft|write|build|implement|deploy|configure|prepare|schedule|book|publish|launch|research|analyze|review|document|compile|organize|coordinate|plan|prototype|ship|submit|deliver|present|record|investigate|produce|finalize)\b/i.test(descriptionText)
                const hasConcreteSignal =
                  /\d/.test(descriptionText) ||
                  /\b(success|deliverable|handoff|draft|mock(up)?|asset|campaign|deck|document|prototype|spec|version|milestone|launch|brief)\b/i.test(descriptionText) ||
                  /[-•]/.test(descriptionText)
                const hasMeaningfulDescription =
                  descriptionText.length >= 80 &&
                  wordCount >= 12 &&
                  sentenceCount >= 2 &&
                  containsActionVerb &&
                  hasConcreteSignal &&
                  !containsVagueLanguage

                if (!hasMeaningfulDescription) {
                  console.log(`ℹ️ Insufficient detail for "${entity.data.name}", requesting clarification`)
                  automationMessages.push(
                    `I want to track **"${entity.data.name}"** accurately. Can you help me by providing:\n\n1. **What specifically needs to happen?** (the concrete actions)\n2. **What does success look like?** (definition of done)\n3. **Rough time estimate?** (optional but helpful)\n\nShare those details and I'll fill them in so you can review before it gets added to your list.`
                  )
                  continue
                }

                console.log(`📝 Inserting task with data:`, {
                  owner_id: user.id,
                  project_id: projectId,
                  name: entity.data.name,
                  description: descriptionText || null,
                  priority: entity.data.priority || 'medium',
                })

                // ENHANCED DUPLICATE CHECK: Prevent exact AND semantic duplicates
                // Step 1: Check for exact name matches within 5 minutes
                const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
                let exactDuplicateQuery = supabaseClient
                  .from('project_tasks')
                  .select('id, name')
                  .eq('owner_id', user.id)
                  .eq('name', entity.data.name)
                  .gte('created_at', fiveMinutesAgo)

                if (projectId) {
                  exactDuplicateQuery = exactDuplicateQuery.eq('project_id', projectId)
                }

                const { data: exactDuplicates, error: exactCheckError } = await exactDuplicateQuery.limit(1)

                if (!exactCheckError && exactDuplicates && exactDuplicates.length > 0) {
                  const existingTask = exactDuplicates[0]
                  console.log(`⚠️ Exact duplicate detected (within 5 min): "${entity.data.name}"`)
                  createdItem = { type: 'task', name: existingTask.name, id: existingTask.id }
                  continue  // Skip to next entity
                }

                // Step 2: Check for semantic duplicates ONLY against VISIBLE tasks in Priority Stream
                // CRITICAL: Only check active, non-completed, non-archived tasks (what user sees in UI)
                let semanticDuplicateQuery = supabaseClient
                  .from('project_tasks')
                  .select('id, name')
                  .eq('owner_id', user.id)
                  .eq('completed', false)
                  .is('archived_at', null)

                if (projectId) {
                  semanticDuplicateQuery = semanticDuplicateQuery.eq('project_id', projectId)
                }

                const { data: activeTasks, error: semanticCheckError } = await semanticDuplicateQuery

                if (!semanticCheckError && activeTasks && activeTasks.length > 0) {
                  const semanticDuplicate = findDuplicateTask(entity.data.name, activeTasks, 70)

                  if (semanticDuplicate) {
                    console.log(`⚠️ Semantic duplicate detected: "${entity.data.name}" is ${semanticDuplicate.similarity}% similar to "${semanticDuplicate.name}"`)
                    automationMessages.push(`I found a similar task "${semanticDuplicate.name}" already in your list. Should I create a new one or use the existing one?`)
                    continue  // Skip to next entity
                  }
                }

                // Optional: Try to find goal_id ONLY if explicitly mentioned by user
                let goalId = entity.data.goalId || entity.data.goal_id || null

                if (!goalId && entity.data.goal) {
                  // User explicitly mentioned a goal - try to find it
                  const { data: foundGoal } = await supabaseClient
                    .from('project_goals')
                    .select('id')
                    .eq('owner_id', user.id)
                    .eq('project_id', projectId)
                    .ilike('name', `%${entity.data.goal}%`)
                    .limit(1)
                    .maybeSingle()

                  if (foundGoal) {
                    goalId = foundGoal.id
                    console.log(`✅ Found goal by name: ${foundGoal.id}`)
                  }
                }

                // If no goal specified, that's fine - create standalone task
                // DO NOT automatically search for goals
                if (!goalId) {
                  console.log(`ℹ️ Creating standalone task (no goal specified)`)
                }

                const calculatedPriority = await calculateTaskPriority(
                  supabaseClient,
                  user.id,
                  projectId,
                  goalId
                )

                const { data: newTask, error } = await supabaseClient
                  .from('project_tasks')
                  .insert({
                    owner_id: user.id,
                    project_id: projectId,
                    goal_id: goalId,
                    name: entity.data.name,
                    description: entity.data.description || null,
                    priority: calculatedPriority,
                    completed: false,
                    agency: 'human',
                    color: '#10b981', // Default green
                    estimated_time: null,
                    due_date: entity.data.dueDate || null
                  })
                  .select()
                  .single()

                if (error) {
                  console.error('❌ Failed to create task:', JSON.stringify(error, null, 2))
                  console.error('❌ Error details:', {
                    message: error.message,
                    details: error.details,
                    hint: error.hint,
                    code: error.code
                  })
                } else if (newTask) {
                  createdItem = { type: 'task', name: newTask.name, id: newTask.id }
                  console.log('✅ Created task:', newTask.name, 'with ID:', newTask.id)
                } else {
                  console.warn('⚠️ Task insert returned no data and no error')
                }
              } else {
                console.warn('⚠️ Task entity missing name field')
              }
              break

            case 'goal':
              if (!entity.data?.name) {
                automationMessages.push('I need the goal title to continue. What should I call it?')
                break
              }

              // Determine target project
              if (entity.data.action === 'delete') {
                const { data: goalToDelete } = await supabaseClient
                  .from('project_goals')
                  .select('id, name, project_id')
                  .eq('owner_id', user.id)
                  .eq('name', entity.data.name)
                  .maybeSingle()

                if (!goalToDelete) {
                  automationMessages.push(`I couldn't find a goal called "${entity.data.name}". Which one should I remove?`)
                  break
                }

                const { error: deleteError } = await supabaseClient
                  .from('project_goals')
                  .update({ status: 'deleted' })
                  .eq('id', goalToDelete.id)

                if (deleteError) {
                  console.error('Failed to delete goal:', deleteError)
                  automationMessages.push("I couldn't remove that goal. Could you try again?")
                  break
                }

                let deletedProjectName: string | undefined
                if (goalToDelete.project_id) {
                  const { data: goalProject } = await supabaseClient
                    .from('projects')
                    .select('name')
                    .eq('owner_id', user.id)
                    .eq('id', goalToDelete.project_id)
                    .maybeSingle()
                  deletedProjectName = goalProject?.name ?? undefined
                }

                createdItem = {
                  type: 'goal',
                  name: goalToDelete.name,
                  id: goalToDelete.id,
                  projectId: goalToDelete.project_id,
                  projectName: deletedProjectName,
                  status: 'deleted',
                  mode: 'deleted'
                }
                automationMessages.push(
                  deletedProjectName
                    ? `Removed "${goalToDelete.name}" from ${deletedProjectName}.`
                    : `Removed "${goalToDelete.name}".`
                )
                break
              }

              const projectLookup = await resolveProjectForGoal(supabaseClient, user.id, {
                projectId: entity.data.projectId ?? entity.data.project_id ?? null,
                projectName: entity.data.projectName ?? entity.data.project ?? null
              })

              if (!projectLookup.project) {
                automationMessages.push(projectLookup.error ?? 'Which project should I use for that goal?')
                break
              }

              const goalName = entity.data.name.toString().trim()
              if (!goalName) {
                automationMessages.push('I need the goal title to continue. What should I call it?')
                break
              }

              const goalStatus = normaliseGoalStatus(entity.data.status)
              const goalPriority = normaliseGoalPriority(entity.data.priority)
              const targetDateValue = entity.data.targetDate ?? entity.data.dueDate ?? null
              const goalDescription = entity.data.description ?? null

              const goalIdFromEntity = entity.data.goalId ?? entity.data.goal_id ?? null

              let existingGoal = null

              if (goalIdFromEntity) {
                const { data } = await supabaseClient
                  .from('project_goals')
                  .select('id, name, description, status, priority, target_date, order_index')
                  .eq('owner_id', user.id)
                  .eq('id', goalIdFromEntity)
                  .maybeSingle()
                existingGoal = data
              }

              if (!existingGoal) {
                const { data } = await supabaseClient
                  .from('project_goals')
                  .select('id, name, description, status, priority, target_date, order_index')
                  .eq('owner_id', user.id)
                  .eq('project_id', projectLookup.project.id)
                  .eq('name', goalName)
                  .maybeSingle()
                existingGoal = data
              }

              const mutationPayload: Record<string, unknown> = {
                owner_id: user.id,
                project_id: projectLookup.project.id,
                name: goalName,
                status: goalStatus,
                priority: goalPriority
              }

              if (goalDescription !== undefined) {
                mutationPayload.description = goalDescription
              }

              if (targetDateValue !== undefined) {
                mutationPayload.target_date = targetDateValue
              }

              let goalResult = null
              let goalMutationType: 'created' | 'updated' = 'created'

              if (existingGoal) {
                const updatePayload: Record<string, unknown> = {
                  status: goalStatus,
                  priority: goalPriority,
                  project_id: projectLookup.project.id,
                  name: goalName
                }

                if (goalDescription !== undefined) {
                  updatePayload.description = goalDescription
                }

                if (targetDateValue !== undefined) {
                  updatePayload.target_date = targetDateValue
                }

                const updateWithPersona = { ...updatePayload, persona_id: user.id }
                let updatedGoalResponse = await supabaseClient
                  .from('project_goals')
                  .update(updateWithPersona)
                  .eq('id', existingGoal.id)
                  .select('id, name, description, status, priority, target_date, project_id')
                  .single()

                if (updatedGoalResponse.error && updatedGoalResponse.error.code === '42703') {
                  console.warn('persona_id column missing on project_goals, retrying update without it')
                  updatedGoalResponse = await supabaseClient
                    .from('project_goals')
                    .update(updatePayload)
                    .eq('id', existingGoal.id)
                    .select('id, name, description, status, priority, target_date, project_id')
                    .single()
                }

                if (updatedGoalResponse.error) {
                  console.error('Failed to update goal:', updatedGoalResponse.error)
                  automationMessages.push("I couldn't update that goal. Could you try again?")
                  break
                }

                goalResult = updatedGoalResponse.data
                goalMutationType = 'updated'
              } else {
                const insertWithPersona = { ...mutationPayload, persona_id: user.id }
                let insertedGoalResponse = await supabaseClient
                  .from('project_goals')
                  .insert(insertWithPersona)
                  .select('id, name, description, status, priority, target_date, project_id')
                  .single()

                if (insertedGoalResponse.error && insertedGoalResponse.error.code === '42703') {
                  console.warn('persona_id column missing on project_goals, retrying insert without it')
                  insertedGoalResponse = await supabaseClient
                    .from('project_goals')
                    .insert(mutationPayload)
                    .select('id, name, description, status, priority, target_date, project_id')
                    .single()
                }

                if (insertedGoalResponse.error) {
                  console.error('Failed to create goal:', insertedGoalResponse.error)
                  automationMessages.push("I couldn't add that goal. Could you double-check the details?")
                  break
                }

                goalResult = insertedGoalResponse.data
                goalMutationType = 'created'
              }

              if (goalResult) {
                createdItem = {
                  type: 'goal',
                  name: goalResult.name,
                  id: goalResult.id,
                  projectId: goalResult.project_id,
                  projectName: projectLookup.project.name,
                  status: goalResult.status,
                  targetDate: goalResult.target_date,
                  description: goalResult.description,
                  priority: goalResult.priority,
                  mode: goalMutationType
                }

                const confirmation = goalMutationType === 'updated'
                  ? `Updated goal "${goalResult.name}" in ${projectLookup.project.name}.`
                  : `Added "${goalResult.name}" to ${projectLookup.project.name}.`

                automationMessages.push(confirmation)
                console.log(`Goal ${goalMutationType}:`, goalResult.name)
              }

              break

            case 'milestone':
              if (entity.data.name) {
                // Handle DELETE action
                if (entity.data.action === 'delete') {
                  const { data: milestoneToDelete } = await supabaseClient
                    .from('project_milestones')
                    .select('id, name')
                    .eq('owner_id', user.id)
                    .ilike('name', entity.data.name)
                    .limit(1)
                    .single()

                  if (milestoneToDelete) {
                    const { error: deleteError } = await supabaseClient
                      .from('project_milestones')
                      .update({ status: 'deleted' })
                      .eq('id', milestoneToDelete.id)

                    if (!deleteError) {
                      createdItem = { type: 'milestone', name: milestoneToDelete.name, id: milestoneToDelete.id, action: 'deleted' }
                      console.log('Deleted milestone:', milestoneToDelete.name)
                    }
                  } else {
                    console.warn('⚠️ Milestone not found for deletion:', entity.data.name)
                  }
                  break
                }

                // Find project ID if project name is mentioned
                let projectId = null
                if (entity.data.project) {
                  const { data: foundProject } = await supabaseClient
                    .from('projects')
                    .select('id')
                    .eq('owner_id', user.id)
                    .ilike('name', `%${entity.data.project}%`)
                    .limit(1)
                    .single()
                  projectId = foundProject?.id
                }

                if (projectId) {
                  // IDEMPOTENCY CHECK: Check for existing milestone within 5 minutes
                  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
                  const { data: existingMilestones } = await supabaseClient
                    .from('project_milestones')
                    .select('id, name, status')
                    .eq('owner_id', user.id)
                    .eq('project_id', projectId)
                    .ilike('name', entity.data.name)
                    .gte('created_at', fiveMinutesAgo)
                    .limit(1)

                  if (existingMilestones && existingMilestones.length > 0) {
                    const existingMilestone = existingMilestones[0]
                    // UPDATE mode: update existing milestone
                    const { data: updatedMilestone, error: updateError } = await supabaseClient
                      .from('project_milestones')
                      .update({
                        description: entity.data.description || null,
                        status: entity.data.status || existingMilestone.status,
                        due_date: entity.data.dueDate || null
                      })
                      .eq('id', existingMilestone.id)
                      .select()
                      .single()

                    if (!updateError && updatedMilestone) {
                      createdItem = { type: 'milestone', name: updatedMilestone.name, id: updatedMilestone.id }
                      console.log('Updated milestone:', updatedMilestone.name)
                    }
                  } else {
                    // INSERT mode: create new milestone
                    const { data: newMilestone, error } = await supabaseClient
                      .from('project_milestones')
                      .insert({
                        owner_id: user.id,
                        project_id: projectId,
                        name: entity.data.name,
                        description: entity.data.description || null,
                        status: entity.data.status || 'active',
                        due_date: entity.data.dueDate || null
                      })
                      .select()
                      .single()

                    if (!error && newMilestone) {
                      createdItem = { type: 'milestone', name: newMilestone.name, id: newMilestone.id }
                      console.log('Created milestone:', newMilestone.name)
                    }
                  }
                } else {
                  console.warn('⚠️ Milestone requires valid project_id, skipping')
                }
              }
              break

            case 'knowledge':
              if (entity.data.name) {
                const { data: newKnowledge, error } = await supabaseClient
                  .from('knowledge_items')
                  .insert({
                    owner_id: user.id,
                    name: entity.data.name,
                    content: entity.data.content || null,
                    type: entity.data.type || 'summary',
                    occurred_at: new Date().toISOString(),
                    tags: entity.data.tags || null
                  })
                  .select()
                  .single()

                if (!error && newKnowledge) {
                  createdItem = { type: 'knowledge', name: newKnowledge.name, id: newKnowledge.id }
                  console.log('Created knowledge item:', newKnowledge.name)
                }
              }
              break

            case 'insight':
              if (entity.data.title) {
                // Validate insight type
                const validTypes = ['article', 'opportunity', 'trend', 'note']
                const insightType = entity.data.type && validTypes.includes(entity.data.type)
                  ? entity.data.type
                  : 'note'

                // Find project ID if project name is mentioned
                let projectId = null
                if (entity.data.project) {
                  const { data: foundProject } = await supabaseClient
                    .from('projects')
                    .select('id')
                    .eq('owner_id', user.id)
                    .ilike('name', `%${entity.data.project}%`)
                    .limit(1)
                    .single()
                  projectId = foundProject?.id
                }

                // IDEMPOTENCY CHECK: Check for existing insight within 5 minutes
                const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
                const { data: existingInsights } = await supabaseClient
                  .from('user_insights')
                  .select('id, title')
                  .eq('owner_id', user.id)
                  .ilike('title', entity.data.title)
                  .eq('category', entity.data.category || 'personal')
                  .gte('created_at', fiveMinutesAgo)
                  .limit(1)

                if (existingInsights && existingInsights.length > 0) {
                  console.log('⚠️ Duplicate insight detected, skipping:', entity.data.title)
                  createdItem = { type: 'insight', name: existingInsights[0].title, id: existingInsights[0].id }
                } else {
                  // INSERT mode: create new insight
                  const { data: newInsight, error } = await supabaseClient
                    .from('user_insights')
                    .insert({
                      owner_id: user.id,
                      title: entity.data.title,
                      summary: entity.data.summary || null,
                      insight_type: insightType,
                      category: entity.data.category || 'personal',
                      source_url: entity.data.source_url || null,
                      project_id: projectId,
                      relevance: entity.data.relevance || 50
                    })
                    .select()
                    .single()

                  if (!error && newInsight) {
                    createdItem = { type: 'insight', name: newInsight.title, id: newInsight.id }
                    console.log('Created insight:', newInsight.title, 'type:', insightType)
                  }
                }
              }
              break
          }

          if (createdItem) {
            executedEntities.push(createdItem)

            // Update active streak when entity is created/updated
            if (createdItem.action !== 'deleted') {
              await updateActiveStreak(user.id, supabaseClient)
            }
          }
        } catch (entityError) {
          console.error(`Failed to create ${entity.type}:`, entityError)
        }
      }

      // Also store in parsed entities table for reference
      if (parsed.entities.length > 0) {
        const entitiesToInsert = parsed.entities.map((entity: any) => ({
          owner_id: user.id,
          entity_type: entity.type,
          entity_data: entity.data,
          source_message_id: assistantMsg?.id || null,
          message_id: messageId || null
        }))

        await supabaseClient.from('claude_parsed_entities').insert(entitiesToInsert)
      }
    }

    const finalResponseText = automationMessages.length > 0
      ? automationMessages.join('\n')
      : (parsed.conversationalResponse || assistantMsg?.content || 'All set.')

    if (assistantMsg && finalResponseText !== assistantMsg.content) {
      await supabaseClient
        .from('chat_messages')
        .update({ content: finalResponseText })
        .eq('id', assistantMsg.id)
    }

    // Return response to frontend
    return new Response(
      JSON.stringify({
        response: finalResponseText,
        entitiesExtracted: parsed.entities?.length || 0,
        entitiesCreated: executedEntities,
        documentGenerated: documentResult.generated  // CRITICAL: Tell frontend a document was created
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Chat function error:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'An error occurred',
        details: error.toString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
