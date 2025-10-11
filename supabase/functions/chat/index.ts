import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.20.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    const { message } = await req.json()
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

    const systemPrompt = `You are ATMO, an AI productivity mentor helping ${userName}.

USER CONTEXT:
Name: ${userName}
Onboarding Data: ${JSON.stringify(onboardingData, null, 2)}

CURRENT PROJECTS:
${projects && projects.length > 0 ? JSON.stringify(projects, null, 2) : 'No active projects yet'}

YOUR ROLE:
- Help the user organize their work and life
- Extract actionable items from conversation
- Provide thoughtful, personalized guidance

IMPORTANT - RESPONSE FORMAT:
When users mention projects, tasks, goals, or milestones, YOU MUST respond with BOTH:
1. A natural, conversational response
2. Structured JSON for entities to extract

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
  ]
}

ENTITY TYPES & FIELDS:
- project: name (required), description, priority (high/medium/low), status
- task: name (required), description, project (name of related project), priority, dueDate (ISO date)
- goal: name (required), description, project (name), targetDate
- milestone: name (required), description, project (name), dueDate
- knowledge: name (required), content, type (summary|note|idea), tags (array)
- insight: title (required), summary, category (personal|project), relevance (1-100)

EXAMPLES:
User: "I'm working on building ATMO"
You: {
  "conversationalResponse": "That's exciting! ATMO sounds like an ambitious project. What's the main goal you're working toward with it?",
  "entities": [{
    "type": "project",
    "data": {
      "name": "ATMO Platform",
      "description": "Building ATMO",
      "priority": "high",
      "status": "active"
    }
  }]
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
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [
        ...conversationHistory,
        { role: 'user', content: message }
      ]
    })

    const assistantMessage = response.content[0].type === 'text'
      ? response.content[0].text
      : ''

    // Parse Claude's response for structured data
    let parsed: { conversationalResponse: string; entities: any[] } = {
      conversationalResponse: assistantMessage,
      entities: []
    }

    try {
      // Try to find JSON block in response
      const jsonMatch = assistantMessage.match(/\{[\s\S]*"conversationalResponse"[\s\S]*"entities"[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0])
      } else {
        // If no structured response, use entire message as conversational
        console.log('No structured JSON found in Claude response')
      }
    } catch (parseError) {
      console.error('Failed to parse Claude JSON:', parseError)
      // Continue with fallback (entire message as conversational)
    }

    // Store user message
    await supabaseClient.from('chat_messages').insert({
      owner_id: user.id,
      role: 'user',
      content: message
    })

    // Store assistant response
    const { data: assistantMsg } = await supabaseClient
      .from('chat_messages')
      .insert({
        owner_id: user.id,
        role: 'assistant',
        content: parsed.conversationalResponse || assistantMessage
      })
      .select()
      .single()

    // Store parsed entities for background processing
    if (parsed.entities && parsed.entities.length > 0) {
      const entitiesToInsert = parsed.entities.map((entity: any) => ({
        owner_id: user.id,
        entity_type: entity.type,
        entity_data: entity.data,
        source_message_id: assistantMsg?.id || null
      }))

      await supabaseClient.from('claude_parsed_entities').insert(entitiesToInsert)
    }

    // Return response to frontend
    return new Response(
      JSON.stringify({
        response: parsed.conversationalResponse || assistantMessage,
        entitiesExtracted: parsed.entities?.length || 0
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
