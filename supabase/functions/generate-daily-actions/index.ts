import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.20.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ActionItem {
  type: 'morning' | 'evening'
  text: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get user ID from request
    const { userId } = await req.json()
    if (!userId) {
      throw new Error('userId is required')
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Fetch user context
    console.log('Fetching user context for:', userId)

    // 1. Get profile and onboarding data
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('onboarding_data, timezone')
      .eq('id', userId)
      .single()

    if (profileError) {
      console.error('Failed to fetch profile:', profileError)
      throw profileError
    }

    const onboardingData = profile.onboarding_data || {}
    const work = onboardingData.work || {}
    const performance = onboardingData.performance || {}

    // 2. Get active projects
    const { data: projects, error: projectsError } = await supabaseClient
      .from('projects')
      .select('id, name, description')
      .eq('owner_id', userId)
      .eq('active', true)
      .limit(5)

    if (projectsError) {
      console.error('Failed to fetch projects:', projectsError)
    }

    // 3. Get urgent goals (due within 7 days)
    const sevenDaysFromNow = new Date()
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

    const { data: urgentGoals, error: goalsError } = await supabaseClient
      .from('project_goals')
      .select('name, description, target_date, project_id')
      .eq('owner_id', userId)
      .not('status', 'in', '(completed,deleted)')
      .lte('target_date', sevenDaysFromNow.toISOString())
      .order('target_date', { ascending: true })
      .limit(10)

    if (goalsError) {
      console.error('Failed to fetch goals:', goalsError)
    }

    // 4. Get recent chat patterns (last 14 days)
    const fourteenDaysAgo = new Date()
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

    const { data: recentMessages, error: messagesError } = await supabaseClient
      .from('chat_messages')
      .select('content, role')
      .eq('owner_id', userId)
      .gte('created_at', fourteenDaysAgo.toISOString())
      .eq('role', 'user')
      .order('created_at', { ascending: false })
      .limit(20)

    if (messagesError) {
      console.error('Failed to fetch messages:', messagesError)
    }

    // Extract chat topics from messages
    const chatTopics = extractTopicsFromMessages(recentMessages || [])

    // Build context for Claude
    const role = work.role || 'Professional'
    const company = work.company || 'your work'
    const northStar = performance.northStar || work.mainProject || 'achieving your goals'
    const projectsList = (projects || []).map(p => p.name).join(', ') || 'No active projects'
    const goalsList = (urgentGoals || []).map(g => `${g.name} (due ${g.target_date})`).join(', ') || 'No urgent goals'
    const topicsList = chatTopics.join(', ') || 'general productivity'

    // Generate actions using Claude
    console.log('Generating actions with Claude...')

    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY') ?? '',
    })

    const prompt = `You are a productivity coach. Generate 6 personalized daily actions for this user.

USER CONTEXT:
- Role: ${role} at ${company}
- Top priority: ${northStar}
- Active projects: ${projectsList}
- Urgent goals (due within 7 days): ${goalsList}
- Recent focus areas from conversations: ${topicsList}

REQUIREMENTS:
1. Generate exactly 3 MORNING actions (strategic, high-energy, advance key projects)
2. Generate exactly 3 EVENING actions (reflective, planning, consolidation)
3. Each action must be 5-10 words maximum
4. Actions must be specific, actionable, and personalized to this user's context
5. Reference actual projects/goals when possible
6. Return ONLY a valid JSON array with this exact structure:
[{"type": "morning", "text": "action text"}, {"type": "evening", "text": "action text"}, ...]

Generate the 6 actions now:`

    const message = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: prompt
      }]
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''
    console.log('Claude response:', responseText)

    // Parse actions from response
    let actions: ActionItem[] = []
    try {
      // Extract JSON from response (Claude might wrap it in markdown code blocks)
      const jsonMatch = responseText.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        actions = JSON.parse(jsonMatch[0])
      } else {
        actions = JSON.parse(responseText)
      }
    } catch (parseError) {
      console.error('Failed to parse actions:', parseError)
      // Fallback to default actions
      actions = getFallbackActions(role)
    }

    // Validate and filter actions
    const morningActions = actions.filter(a => a.type === 'morning').slice(0, 3)
    const eveningActions = actions.filter(a => a.type === 'evening').slice(0, 3)

    // Ensure we have exactly 3 of each type
    while (morningActions.length < 3) {
      morningActions.push({ type: 'morning', text: 'Review progress on key project goals' })
    }
    while (eveningActions.length < 3) {
      eveningActions.push({ type: 'evening', text: 'Reflect on today\'s accomplishments' })
    }

    const finalActions = [...morningActions, ...eveningActions]

    // Save actions to database
    console.log('Saving actions to database...')

    const actionsToInsert = finalActions.map(action => ({
      persona_id: userId,
      action_text: action.text,
      action_type: action.type,
      completed: false,
      date_created: new Date().toISOString().split('T')[0]
    }))

    const { data: savedActions, error: insertError } = await supabaseClient
      .from('daily_actions')
      .insert(actionsToInsert)
      .select()

    if (insertError) {
      console.error('Failed to save actions:', insertError)
      throw insertError
    }

    console.log('Actions generated and saved successfully')

    return new Response(
      JSON.stringify({
        success: true,
        actions: savedActions,
        count: savedActions.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in generate-daily-actions:', error)

    return new Response(
      JSON.stringify({
        error: error.message,
        success: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

/**
 * Extract topics from chat messages
 */
function extractTopicsFromMessages(messages: any[]): string[] {
  const topics = new Set<string>()

  for (const msg of messages) {
    const content = msg.content.toLowerCase()

    // Extract key topics (simple keyword matching)
    if (content.includes('project') || content.includes('build')) topics.add('project work')
    if (content.includes('goal') || content.includes('objective')) topics.add('goal setting')
    if (content.includes('team') || content.includes('meeting')) topics.add('collaboration')
    if (content.includes('code') || content.includes('develop')) topics.add('development')
    if (content.includes('design')) topics.add('design')
    if (content.includes('strategy') || content.includes('plan')) topics.add('strategic planning')
    if (content.includes('customer') || content.includes('user')) topics.add('customer focus')
  }

  return Array.from(topics).slice(0, 5)
}

/**
 * Get fallback actions if Claude API fails
 */
function getFallbackActions(role: string): ActionItem[] {
  return [
    { type: 'morning', text: 'Review top 3 priorities for today' },
    { type: 'morning', text: 'Focus on most important project task' },
    { type: 'morning', text: 'Clear inbox and respond to urgent items' },
    { type: 'evening', text: 'Document progress on key objectives' },
    { type: 'evening', text: 'Prepare tomorrow\'s action plan' },
    { type: 'evening', text: 'Reflect on lessons learned today' },
  ]
}
