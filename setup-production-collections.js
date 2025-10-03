#!/usr/bin/env node

/**
 * Production PocketBase Collections Setup Script
 * Run this AFTER creating your admin account at: https://atmo-backend-31f7193d582c.herokuapp.com/_/
 *
 * Usage: node setup-production-collections.js
 */

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
    console.error('❌ Failed to authenticate as admin');
    console.error('Please make sure you have created an admin account at:');
    console.error(`${PB_URL}/_/`);
    process.exit(1);
  }

  const { token } = await authResponse.json();
  console.log('✅ Authenticated successfully\n');

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': token
  };

  // Define all collections
  const collections = [
    {
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
    },
    {
      name: 'projects',
      type: 'base',
      schema: [
        { name: 'persona', type: 'relation', required: true, options: { collectionId: '', cascadeDelete: true, maxSelect: 1 } },
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
    },
    {
      name: 'goals',
      type: 'base',
      schema: [
        { name: 'persona', type: 'relation', required: true, options: { collectionId: '', cascadeDelete: true, maxSelect: 1 } },
        { name: 'project', type: 'relation', required: false, options: { collectionId: '', cascadeDelete: false, maxSelect: 1 } },
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
    },
    {
      name: 'tasks',
      type: 'base',
      schema: [
        { name: 'persona', type: 'relation', required: true, options: { collectionId: '', cascadeDelete: true, maxSelect: 1 } },
        { name: 'project', type: 'relation', required: false, options: { collectionId: '', cascadeDelete: false, maxSelect: 1 } },
        { name: 'goal', type: 'relation', required: false, options: { collectionId: '', cascadeDelete: false, maxSelect: 1 } },
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
    },
    {
      name: 'knowledge_items',
      type: 'base',
      schema: [
        { name: 'persona', type: 'relation', required: true, options: { collectionId: '', cascadeDelete: true, maxSelect: 1 } },
        { name: 'project', type: 'relation', required: false, options: { collectionId: '', cascadeDelete: false, maxSelect: 1 } },
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
    },
    {
      name: 'milestones',
      type: 'base',
      schema: [
        { name: 'persona', type: 'relation', required: true, options: { collectionId: '', cascadeDelete: true, maxSelect: 1 } },
        { name: 'project', type: 'relation', required: false, options: { collectionId: '', cascadeDelete: false, maxSelect: 1 } },
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
    },
    {
      name: 'calendar_events',
      type: 'base',
      schema: [
        { name: 'persona', type: 'relation', required: true, options: { collectionId: '', cascadeDelete: true, maxSelect: 1 } },
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
    },
    {
      name: 'integrations',
      type: 'base',
      schema: [
        { name: 'persona', type: 'relation', required: true, options: { collectionId: '', cascadeDelete: true, maxSelect: 1 } },
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
    }
  ];

  // Create collections
  console.log('📊 Creating collections...\n');
  for (const collection of collections) {
    try {
      const response = await fetch(`${PB_URL}/api/collections`, {
        method: 'POST',
        headers,
        body: JSON.stringify(collection)
      });

      if (response.ok) {
        const created = await response.json();
        console.log(`✅ Created collection: ${collection.name} (${created.id})`);
      } else {
        const error = await response.text();
        if (error.includes('already exists')) {
          console.log(`ℹ️  Collection already exists: ${collection.name}`);
        } else {
          console.error(`❌ Failed to create ${collection.name}:`, error);
        }
      }
    } catch (error) {
      console.error(`❌ Error creating ${collection.name}:`, error.message);
    }
  }

  console.log('\n✅ Production PocketBase setup complete!');
  console.log('\n📊 Collections created:');
  collections.forEach(c => console.log(`   - ${c.name}`));
  console.log('\n🎯 Admin panel:', `${PB_URL}/_/`);
  console.log('🌐 Frontend URL: https://atmo-6efbcf1c7cbe.herokuapp.com/');
  console.log('\n🎉 Your ATMO app is ready to use!');
}

setupCollections().catch(console.error);
