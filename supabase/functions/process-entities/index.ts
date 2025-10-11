import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Use service role key for batch processing (bypasses RLS)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const dryRun = Deno.env.get('CLAUDE_DRY_RUN') === 'true'

    // Get unprocessed entities (max 100 per run)
    const { data: entities, error: fetchError } = await supabaseClient
      .from('claude_parsed_entities')
      .select('*')
      .eq('processed', false)
      .order('created_at', { ascending: true })
      .limit(100)

    if (fetchError) {
      throw fetchError
    }

    if (!entities || entities.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0, message: 'No entities to process' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Processing ${entities.length} entities (dry run: ${dryRun})`)

    let processed = 0
    const errors: string[] = []

    for (const entity of entities) {
      try {
        if (dryRun) {
          console.log('DRY RUN - Would create:', entity.entity_type, entity.entity_data)
        } else {
          // Process based on entity type
          if (entity.entity_type === 'project') {
            // Check if project with similar name already exists
            const { data: existing } = await supabaseClient
              .from('projects')
              .select('id')
              .eq('owner_id', entity.owner_id)
              .ilike('name', entity.entity_data.name)
              .single()

            if (existing) {
              // Update existing project
              await supabaseClient
                .from('projects')
                .update({
                  description: entity.entity_data.description || '',
                  priority: entity.entity_data.priority || 'medium',
                  status: entity.entity_data.status || 'active',
                  updated_at: new Date().toISOString()
                })
                .eq('id', existing.id)
            } else {
              // Create new project
              await supabaseClient.from('projects').insert({
                owner_id: entity.owner_id,
                name: entity.entity_data.name,
                description: entity.entity_data.description || '',
                priority: entity.entity_data.priority || 'medium',
                status: entity.entity_data.status || 'active',
                active: true
              })
            }
          }

          else if (entity.entity_type === 'task') {
            // Find project by name if specified
            let projectId = null
            if (entity.entity_data.project) {
              const { data: project } = await supabaseClient
                .from('projects')
                .select('id')
                .eq('owner_id', entity.owner_id)
                .ilike('name', `%${entity.entity_data.project}%`)
                .limit(1)
                .single()
              projectId = project?.id
            }

            // Check for duplicate task
            const { data: existingTask } = await supabaseClient
              .from('project_tasks')
              .select('id')
              .eq('owner_id', entity.owner_id)
              .ilike('name', entity.entity_data.name)
              .single()

            if (!existingTask) {
              await supabaseClient.from('project_tasks').insert({
                owner_id: entity.owner_id,
                project_id: projectId,
                name: entity.entity_data.name,
                description: entity.entity_data.description || '',
                priority: entity.entity_data.priority || 'medium',
                due_date: entity.entity_data.dueDate || null,
                completed: false
              })
            }
          }

          else if (entity.entity_type === 'goal') {
            // Find project
            let projectId = null
            if (entity.entity_data.project) {
              const { data: project } = await supabaseClient
                .from('projects')
                .select('id')
                .eq('owner_id', entity.owner_id)
                .ilike('name', `%${entity.entity_data.project}%`)
                .limit(1)
                .single()
              projectId = project?.id
            }

            if (projectId) {
              const { data: existingGoal } = await supabaseClient
                .from('project_goals')
                .select('id')
                .eq('owner_id', entity.owner_id)
                .eq('project_id', projectId)
                .ilike('name', entity.entity_data.name)
                .single()

              if (!existingGoal) {
                await supabaseClient.from('project_goals').insert({
                  owner_id: entity.owner_id,
                  project_id: projectId,
                  name: entity.entity_data.name,
                  description: entity.entity_data.description || '',
                  priority: 'medium',
                  status: 'active',
                  target_date: entity.entity_data.targetDate || null
                })
              }
            }
          }

          else if (entity.entity_type === 'milestone') {
            // Find project
            let projectId = null
            if (entity.entity_data.project) {
              const { data: project } = await supabaseClient
                .from('projects')
                .select('id')
                .eq('owner_id', entity.owner_id)
                .ilike('name', `%${entity.entity_data.project}%`)
                .limit(1)
                .single()
              projectId = project?.id
            }

            if (projectId) {
              const { data: existingMilestone } = await supabaseClient
                .from('project_milestones')
                .select('id')
                .eq('owner_id', entity.owner_id)
                .eq('project_id', projectId)
                .ilike('name', entity.entity_data.name)
                .single()

              if (!existingMilestone) {
                await supabaseClient.from('project_milestones').insert({
                  owner_id: entity.owner_id,
                  project_id: projectId,
                  name: entity.entity_data.name,
                  description: entity.entity_data.description || '',
                  status: 'pending',
                  due_date: entity.entity_data.dueDate || null
                })
              }
            }
          }

          else if (entity.entity_type === 'knowledge') {
            const { data: existingKnowledge } = await supabaseClient
              .from('knowledge_items')
              .select('id')
              .eq('owner_id', entity.owner_id)
              .ilike('name', entity.entity_data.name)
              .single()

            if (!existingKnowledge) {
              await supabaseClient.from('knowledge_items').insert({
                owner_id: entity.owner_id,
                name: entity.entity_data.name,
                type: entity.entity_data.type || 'note',
                content: entity.entity_data.content || '',
                tags: entity.entity_data.tags || [],
                starred: false
              })
            }
          }

          else if (entity.entity_type === 'insight') {
            await supabaseClient.from('user_insights').insert({
              owner_id: entity.owner_id,
              title: entity.entity_data.title,
              summary: entity.entity_data.summary || '',
              category: entity.entity_data.category || 'personal',
              insight_type: 'chat_generated',
              relevance: entity.entity_data.relevance || 50,
              metadata: { source: 'claude_chat' }
            })
          }
        }

        // Mark entity as processed
        await supabaseClient
          .from('claude_parsed_entities')
          .update({ processed: true })
          .eq('id', entity.id)

        processed++
      } catch (err) {
        console.error(`Failed to process entity ${entity.id}:`, err)
        errors.push(`Entity ${entity.id}: ${err.message}`)
      }
    }

    return new Response(
      JSON.stringify({
        processed,
        total: entities.length,
        dryRun,
        errors: errors.length > 0 ? errors : undefined
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Process entities error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
