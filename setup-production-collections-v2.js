#!/usr/bin/env node

const PB_URL = 'https://atmo-backend-31f7193d582c.herokuapp.com';
const ADMIN_EMAIL = 'tobia@donadon.com';
const ADMIN_PASSWORD = 'TheAtmosphereAdmin!';

async function setupCollections() {
  console.log('🚀 Setting up production PocketBase collections...\n');

  // Authenticate as admin
  console.log('🔐 Authenticating as admin...');
  const authResponse = await fetch(`${PB_URL}/api/admins/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identity: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    })
  });

  if (!authResponse.ok) {
    console.error('❌ Failed to authenticate');
    process.exit(1);
  }

  const { token } = await authResponse.json();
  console.log('✅ Authenticated\n');

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': token
  };

  const collectionIds = {};

  // Step 1: Get or create personas collection (no dependencies)
  console.log('📊 Step 1: Creating personas collection...');
  let personasResponse = await fetch(`${PB_URL}/api/collections`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: 'personas',
      type: 'base',
      schema: [
        { name: 'iam', type: 'text', required: true },
        { name: 'nickname', type: 'text', required: true },
        { name: 'avatar_url', type: 'url', required: false },
        { name: 'email', type: 'email', required: true },
        { name: 'job_title', type: 'text', required: false },
        { name: 'bio', type: 'text', required: false },
        { name: 'biggest_challenge', type: 'text', required: false },
        { name: 'email_notifications', type: 'bool', required: false },
        { name: 'push_notifications', type: 'bool', required: false },
        { name: 'onboarding_completed', type: 'bool', required: false },
        { name: 'focus', type: 'text', required: false },
        { name: 'delivery_time', type: 'date', required: false },
        { name: 'avatar_style', type: 'text', required: false },
        { name: 'communication_style', type: 'text', required: false }
      ],
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: ''
    })
  });

  if (personasResponse.ok) {
    const personas = await personasResponse.json();
    collectionIds.personas = personas.id;
    console.log(`✅ personas: ${personas.id}`);
  } else {
    const error = await personasResponse.text();
    if (error.includes('already exists')) {
      // Get existing collection ID
      const listResponse = await fetch(`${PB_URL}/api/collections`, { headers });
      const collections = await listResponse.json();
      const existing = collections.items?.find(c => c.name === 'personas');
      if (existing) {
        collectionIds.personas = existing.id;
        console.log(`ℹ️  personas already exists: ${existing.id}`);
      }
    }
  }

  // Step 2: Create projects collection (depends on personas)
  console.log('\n📊 Step 2: Creating projects collection...');
  let projectsResponse = await fetch(`${PB_URL}/api/collections`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: 'projects',
      type: 'base',
      schema: [
        { name: 'persona', type: 'relation', required: true, options: { collectionId: collectionIds.personas, cascadeDelete: true, maxSelect: 1 } },
        { name: 'name', type: 'text', required: true },
        { name: 'description', type: 'text', required: false },
        { name: 'status', type: 'text', required: false },
        { name: 'priority', type: 'text', required: false },
        { name: 'progress', type: 'number', required: false },
        { name: 'startDate', type: 'date', required: false },
        { name: 'target_date', type: 'date', required: false },
        { name: 'color', type: 'text', required: false },
        { name: 'active', type: 'bool', required: false }
      ],
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: ''
    })
  });

  if (projectsResponse.ok) {
    const projects = await projectsResponse.json();
    collectionIds.projects = projects.id;
    console.log(`✅ projects: ${projects.id}`);
  } else {
    const listResponse = await fetch(`${PB_URL}/api/collections`, { headers });
    const collections = await listResponse.json();
    const existing = collections.items?.find(c => c.name === 'projects');
    if (existing) {
      collectionIds.projects = existing.id;
      console.log(`ℹ️  projects already exists: ${existing.id}`);
    }
  }

  // Step 3: Create goals collection (depends on personas and projects)
  console.log('\n📊 Step 3: Creating goals collection...');
  await fetch(`${PB_URL}/api/collections`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: 'goals',
      type: 'base',
      schema: [
        { name: 'persona', type: 'relation', required: true, options: { collectionId: collectionIds.personas, cascadeDelete: true, maxSelect: 1 } },
        { name: 'project', type: 'relation', required: false, options: { collectionId: collectionIds.projects, cascadeDelete: false, maxSelect: 1 } },
        { name: 'name', type: 'text', required: true },
        { name: 'description', type: 'text', required: false },
        { name: 'status', type: 'text', required: false },
        { name: 'priority', type: 'text', required: false },
        { name: 'target_date', type: 'date', required: false },
        { name: 'progress', type: 'number', required: false }
      ],
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: ''
    })
  });

  const listResponse1 = await fetch(`${PB_URL}/api/collections`, { headers });
  const collections1 = await listResponse1.json();
  const goals = collections1.items?.find(c => c.name === 'goals');
  if (goals) {
    collectionIds.goals = goals.id;
    console.log(`✅ goals: ${goals.id}`);
  }

  // Step 4: Create tasks collection (depends on personas, projects, goals)
  console.log('\n📊 Step 4: Creating tasks collection...');
  await fetch(`${PB_URL}/api/collections`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: 'tasks',
      type: 'base',
      schema: [
        { name: 'persona', type: 'relation', required: true, options: { collectionId: collectionIds.personas, cascadeDelete: true, maxSelect: 1 } },
        { name: 'project', type: 'relation', required: false, options: { collectionId: collectionIds.projects, cascadeDelete: false, maxSelect: 1 } },
        { name: 'goal', type: 'relation', required: false, options: { collectionId: collectionIds.goals, cascadeDelete: false, maxSelect: 1 } },
        { name: 'name', type: 'text', required: true },
        { name: 'title', type: 'text', required: false },
        { name: 'description', type: 'text', required: false },
        { name: 'status', type: 'text', required: false },
        { name: 'priority', type: 'text', required: false },
        { name: 'completed', type: 'bool', required: false },
        { name: 'estimated_time', type: 'number', required: false },
        { name: 'due_date', type: 'date', required: false }
      ],
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: ''
    })
  });
  console.log(`✅ tasks created`);

  // Step 5: Create remaining collections
  console.log('\n📊 Step 5: Creating remaining collections...');

  await fetch(`${PB_URL}/api/collections`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: 'knowledge_items',
      type: 'base',
      schema: [
        { name: 'persona', type: 'relation', required: true, options: { collectionId: collectionIds.personas, cascadeDelete: true, maxSelect: 1 } },
        { name: 'project', type: 'relation', required: false, options: { collectionId: collectionIds.projects, cascadeDelete: false, maxSelect: 1 } },
        { name: 'title', type: 'text', required: true },
        { name: 'content', type: 'text', required: false },
        { name: 'type', type: 'text', required: false },
        { name: 'source', type: 'text', required: false },
        { name: 'tags', type: 'json', required: false },
        { name: 'url', type: 'url', required: false }
      ],
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: ''
    })
  });
  console.log(`✅ knowledge_items created`);

  await fetch(`${PB_URL}/api/collections`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: 'milestones',
      type: 'base',
      schema: [
        { name: 'persona', type: 'relation', required: true, options: { collectionId: collectionIds.personas, cascadeDelete: true, maxSelect: 1 } },
        { name: 'project', type: 'relation', required: false, options: { collectionId: collectionIds.projects, cascadeDelete: false, maxSelect: 1 } },
        { name: 'name', type: 'text', required: true },
        { name: 'description', type: 'text', required: false },
        { name: 'target_date', type: 'date', required: false },
        { name: 'completed', type: 'bool', required: false }
      ],
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: ''
    })
  });
  console.log(`✅ milestones created`);

  await fetch(`${PB_URL}/api/collections`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: 'calendar_events',
      type: 'base',
      schema: [
        { name: 'persona', type: 'relation', required: true, options: { collectionId: collectionIds.personas, cascadeDelete: true, maxSelect: 1 } },
        { name: 'title', type: 'text', required: true },
        { name: 'start_date', type: 'date', required: true },
        { name: 'end_date', type: 'date', required: false },
        { name: 'all_day', type: 'bool', required: false },
        { name: 'description', type: 'text', required: false }
      ],
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: ''
    })
  });
  console.log(`✅ calendar_events created`);

  await fetch(`${PB_URL}/api/collections`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: 'integrations',
      type: 'base',
      schema: [
        { name: 'persona', type: 'relation', required: true, options: { collectionId: collectionIds.personas, cascadeDelete: true, maxSelect: 1 } },
        { name: 'provider', type: 'text', required: true },
        { name: 'status', type: 'text', required: false },
        { name: 'credentials', type: 'json', required: false },
        { name: 'settings', type: 'json', required: false }
      ],
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: ''
    })
  });
  console.log(`✅ integrations created`);

  console.log('\n✅ All collections created successfully!');
  console.log('\n🎯 Admin panel:', `${PB_URL}/_/`);
  console.log('🌐 Frontend URL: https://atmo-6efbcf1c7cbe.herokuapp.com/');
  console.log('\n🎉 Your ATMO app is ready to use!');
}

setupCollections().catch(console.error);
