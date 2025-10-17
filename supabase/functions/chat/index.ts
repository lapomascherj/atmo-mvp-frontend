import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.20.0'

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
- NEVER auto-create goals, projects, or placeholder entities
- If project doesn't exist, ask user to specify which project

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

    const extractJson = (input: string): string | null => {
      if (!input) return null;
      const start = input.indexOf('{');
      if (start === -1) return null;
      let depth = 0;
      for (let i = start; i < input.length; i++) {
        const char = input[i];
        if (char === '{') depth++;
        else if (char === '}') {
          depth--;
          if (depth === 0) return input.slice(start, i + 1);
        }
      }
      return null;
    };

    const jsonPayload = extractJson(responseText);

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

    // Execute and store parsed entities
    const executedEntities: any[] = []
    const automationMessages: string[] = []
    if (parsed.entities && parsed.entities.length > 0) {
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
                  const { data: newProject, error } = await supabaseClient
                    .from('projects')
                    .insert({
                      owner_id: user.id,
                      name: entity.data.name,
                      description: entity.data.description || null,
                      priority: entity.data.priority || null,
                      status: entity.data.status || 'active',
                      active: true,
                      color: '#3b82f6', // Default blue
                      progress: 0
                    })
                    .select()
                    .single()

                  if (!error && newProject) {
                    createdItem = { type: 'project', name: newProject.name, id: newProject.id }
                    console.log('Created project:', newProject.name)
                  }
                }
              }
              break

            case 'task':
              if (entity.data.name) {
                console.log(`🔍 Processing task: "${entity.data.name}"`)

                // Find project ID if project name is mentioned
                let projectId = null
                if (entity.data.project) {
                  console.log(`🔍 Looking for project: "${entity.data.project}"`)
                  const { data: foundProject, error: projectError } = await supabaseClient
                    .from('projects')
                    .select('id')
                    .eq('owner_id', user.id)
                    .ilike('name', `%${entity.data.project}%`)
                    .limit(1)
                    .single()

                  if (projectError) {
                    console.log(`⚠️ Project lookup error:`, projectError)
                  } else if (foundProject) {
                    projectId = foundProject.id
                    console.log(`✅ Found project ID: ${projectId}`)
                  } else {
                    console.log(`⚠️ No project found matching "${entity.data.project}"`)
                  }
                }

                // CRITICAL: If no project specified, find the first active project or prompt user
                if (!projectId) {
                  console.log(`⚠️ No project specified, looking for first active project`)
                  const { data: firstProject } = await supabaseClient
                    .from('projects')
                    .select('id, name')
                    .eq('owner_id', user.id)
                    .eq('active', true)
                    .order('created_at', { ascending: true })
                    .limit(1)
                    .maybeSingle()

                  if (firstProject) {
                    projectId = firstProject.id
                    console.log(`✅ Using first active project: ${firstProject.name} (${projectId})`)
                  } else {
                    console.error(`❌ No active projects found for user`)
                    automationMessages.push(`I need to know which project this task belongs to. Could you specify a project name?`)
                    break
                  }
                }

                console.log(`📝 Inserting task with data:`, {
                  owner_id: user.id,
                  project_id: projectId,
                  name: entity.data.name,
                  description: entity.data.description || null,
                  priority: entity.data.priority || 'medium',
                })

                // IDEMPOTENCY CHECK: Prevent duplicate tasks within 5 minutes
                // Check by name + project_id for precise deduplication
                const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
                let duplicateQuery = supabaseClient
                  .from('project_tasks')
                  .select('id, name')
                  .eq('owner_id', user.id)
                  .eq('name', entity.data.name)
                  .gte('created_at', fiveMinutesAgo)

                // If project specified, check for duplicate in same project
                if (projectId) {
                  duplicateQuery = duplicateQuery.eq('project_id', projectId)
                }

                const { data: existingTasks, error: checkError } = await duplicateQuery.limit(1)

                if (!checkError && existingTasks && existingTasks.length > 0) {
                  const existingTask = existingTasks[0]
                  console.log(`⚠️ Duplicate task detected (created within last 5 min), returning existing:`, entity.data.name)
                  createdItem = { type: 'task', name: existingTask.name, id: existingTask.id }
                  console.log('✅ Returning existing task:', existingTask.name, 'with ID:', existingTask.id)
                  continue  // Skip to next entity
                }

                // Calculate priority based on deadline rules
                // First, try to find goal_id if not explicitly provided
                let goalId = entity.data.goalId || entity.data.goal_id || null

                if (!goalId && entity.data.goal) {
                  // Try to resolve goal by name within the project
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

                // CRITICAL: If no goal specified/found, find first active goal in project
                // Tasks MUST have a goal_id to appear in Priority Stream
                if (!goalId) {
                  console.log(`⚠️ No goal specified, looking for first active goal in project`)
                  const { data: firstGoal } = await supabaseClient
                    .from('project_goals')
                    .select('id, name')
                    .eq('owner_id', user.id)
                    .eq('project_id', projectId)
                    .neq('status', 'deleted')
                    .neq('status', 'Completed')
                    .order('created_at', { ascending: true })
                    .limit(1)
                    .maybeSingle()

                  if (firstGoal) {
                    goalId = firstGoal.id
                    console.log(`✅ Using first active goal: ${firstGoal.name} (${goalId})`)
                  } else {
                    // No goals in project - ask user to create a goal first
                    console.error(`❌ No active goals in project ${projectId}`)
                    automationMessages.push(`This project needs at least one goal. Could you create a goal first, like "add goal 'Launch MVP' to this project"?`)
                    break
                  }
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
      const entitiesToInsert = parsed.entities.map((entity: any) => ({
        owner_id: user.id,
        entity_type: entity.type,
        entity_data: entity.data,
        source_message_id: assistantMsg?.id || null,
        message_id: messageId || null
      }))

      await supabaseClient.from('claude_parsed_entities').insert(entitiesToInsert)
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
        entitiesCreated: executedEntities
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
