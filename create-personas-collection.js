#!/usr/bin/env node

/**
 * Create Personas Collection
 * Creates the personas collection with all required fields
 */

const POCKETBASE_URL = 'https://atmo-backend-31f7193d582c.herokuapp.com';
const ADMIN_EMAIL = 'tobia@donadon.com';
const ADMIN_PASSWORD = 'Poorbaboon50!';

async function createPersonasCollection() {
  console.log('🔧 Creating personas collection...\n');

  try {
    // Step 1: Authenticate as admin
    console.log('1️⃣ Authenticating as admin...');
    const authResponse = await fetch(`${POCKETBASE_URL}/api/admins/auth-with-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identity: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
      })
    });

    if (!authResponse.ok) {
      throw new Error(`Admin auth failed: ${authResponse.status}`);
    }

    const authData = await authResponse.json();
    const adminToken = authData.token;
    console.log('✅ Admin authenticated\n');

    // Step 2: Check if personas collection already exists
    console.log('2️⃣ Checking for existing personas collection...');
    const collectionsResponse = await fetch(`${POCKETBASE_URL}/api/collections`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    const collections = await collectionsResponse.json();
    const personasCollection = collections.items?.find(c => c.name === 'personas');

    if (personasCollection) {
      console.log('⚠️  Personas collection already exists, updating schema...\n');
      collectionId = personasCollection.id;
      method = 'PATCH';
      url = `${POCKETBASE_URL}/api/collections/${collectionId}`;
    } else {
      console.log('✅ Personas collection does not exist, creating new one...\n');
      method = 'POST';
      url = `${POCKETBASE_URL}/api/collections`;
    }

    // Step 3: Create/Update personas collection
    console.log('3️⃣ Setting up personas collection...');

    const collectionData = {
      name: 'personas',
      type: 'base',
      schema: [
        {
          name: 'iam',
          type: 'relation',
          required: true,
          options: {
            collectionId: '_pb_users_auth_',
            cascadeDelete: true,
            minSelect: null,
            maxSelect: 1,
            displayFields: []
          }
        },
        {
          name: 'nickname',
          type: 'text',
          required: false,
          options: { min: null, max: null, pattern: '' }
        },
        {
          name: 'email',
          type: 'email',
          required: false,
          options: { exceptDomains: [], onlyDomains: [] }
        },
        {
          name: 'job_title',
          type: 'text',
          required: false,
          options: { min: null, max: null, pattern: '' }
        },
        {
          name: 'bio',
          type: 'text',
          required: false,
          options: { min: null, max: 500, pattern: '' }
        },
        {
          name: 'biggest_challenge',
          type: 'text',
          required: false,
          options: { min: null, max: 500, pattern: '' }
        },
        {
          name: 'focus',
          type: 'text',
          required: false,
          options: { min: null, max: null, pattern: '' }
        },
        {
          name: 'onboarding_completed',
          type: 'bool',
          required: false,
          options: {}
        },
        {
          name: 'email_notifications',
          type: 'bool',
          required: false,
          options: {}
        },
        {
          name: 'push_notifications',
          type: 'bool',
          required: false,
          options: {}
        }
      ],
      listRule: 'iam = @request.auth.id',
      viewRule: 'iam = @request.auth.id',
      createRule: '@request.auth.id != ""',
      updateRule: 'iam = @request.auth.id',
      deleteRule: 'iam = @request.auth.id'
    };

    const createResponse = await fetch(url, {
      method: method,
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(collectionData)
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(`Failed to setup collection: ${createResponse.status} ${errorText}`);
    }

    console.log('✅ Personas collection configured successfully\n');

    console.log('🎉 SUCCESS! Personas collection has all required fields:\n');
    console.log('  ✅ iam (relation to users)');
    console.log('  ✅ nickname');
    console.log('  ✅ email');
    console.log('  ✅ job_title');
    console.log('  ✅ bio');
    console.log('  ✅ biggest_challenge');
    console.log('  ✅ focus');
    console.log('  ✅ onboarding_completed');
    console.log('  ✅ email_notifications');
    console.log('  ✅ push_notifications\n');
    console.log('✅ Onboarding will now work correctly!\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    process.exit(1);
  }
}

// Define these at the top scope
let collectionId = null;
let method = 'POST';
let url = '';

createPersonasCollection();
