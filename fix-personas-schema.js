#!/usr/bin/env node

/**
 * Fix Personas Collection Schema
 * Adds missing fields needed for onboarding
 */

const POCKETBASE_URL = 'https://atmo-backend-31f7193d582c.herokuapp.com';
const ADMIN_EMAIL = 'tobia@donadon.com';
const ADMIN_PASSWORD = 'Poorbaboon50!';

async function fixPersonasSchema() {
  console.log('🔧 Fixing personas collection schema...\n');

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

    // Step 2: Get personas collection
    console.log('2️⃣ Getting personas collection...');
    const collectionsResponse = await fetch(`${POCKETBASE_URL}/api/collections`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    const collections = await collectionsResponse.json();
    const personasCollection = collections.items?.find(c => c.name === 'personas');

    if (!personasCollection) {
      throw new Error('Personas collection not found!');
    }

    console.log('✅ Found personas collection\n');

    // Step 3: Update schema with required fields
    console.log('3️⃣ Adding onboarding fields to schema...');

    const updatedSchema = [
      // Existing fields
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
      // NEW: Onboarding fields
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
        options: { min: null, max: null, pattern: '' }
      },
      {
        name: 'biggest_challenge',
        type: 'text',
        required: false,
        options: { min: null, max: null, pattern: '' }
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
    ];

    const updateResponse = await fetch(`${POCKETBASE_URL}/api/collections/${personasCollection.id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        schema: updatedSchema
      })
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      throw new Error(`Failed to update schema: ${updateResponse.status} ${errorText}`);
    }

    console.log('✅ Personas schema updated successfully\n');

    console.log('🎉 SUCCESS! Personas collection now has all required fields:\n');
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

fixPersonasSchema();
