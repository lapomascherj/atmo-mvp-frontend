#!/usr/bin/env node

/**
 * PocketBase Users Collection Setup Script
 * This script configures the users collection with proper auth settings
 */

const POCKETBASE_URL = 'https://atmo-backend-31f7193d582c.herokuapp.com';
const ADMIN_EMAIL = 'tobia@donadon.com';
const ADMIN_PASSWORD = 'Poorbaboon50!';

async function setupUsersCollection() {
  console.log('🔧 Setting up PocketBase users collection...\n');

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
      throw new Error(`Admin auth failed: ${authResponse.status} ${await authResponse.text()}`);
    }

    const authData = await authResponse.json();
    const adminToken = authData.token;
    console.log('✅ Admin authenticated successfully\n');

    // Step 2: Check if users collection exists
    console.log('2️⃣ Checking for existing users collection...');
    const collectionsResponse = await fetch(`${POCKETBASE_URL}/api/collections`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    const collections = await collectionsResponse.json();
    const usersCollection = collections.items?.find(c => c.name === 'users');

    if (usersCollection) {
      console.log('✅ Users collection already exists\n');

      // Update existing collection
      console.log('3️⃣ Updating users collection settings...');
      const updateResponse = await fetch(`${POCKETBASE_URL}/api/collections/${usersCollection.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: 'users',
          type: 'auth',
          listRule: 'id = @request.auth.id',
          viewRule: 'id = @request.auth.id',
          createRule: '',
          updateRule: 'id = @request.auth.id',
          deleteRule: 'id = @request.auth.id',
          options: {
            allowEmailAuth: true,
            allowOAuth2Auth: false,
            allowUsernameAuth: false,
            requireEmail: true,
            exceptEmailDomains: [],
            onlyEmailDomains: [],
            minPasswordLength: 8
          }
        })
      });

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        throw new Error(`Failed to update collection: ${updateResponse.status} ${errorText}`);
      }

      console.log('✅ Users collection updated successfully\n');
    } else {
      console.log('❌ Users collection does not exist\n');

      // Create new auth collection
      console.log('3️⃣ Creating users auth collection...');
      const createResponse = await fetch(`${POCKETBASE_URL}/api/collections`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: 'users',
          type: 'auth',
          schema: [
            {
              name: 'name',
              type: 'text',
              required: false,
              options: { min: null, max: null, pattern: '' }
            },
            {
              name: 'avatar',
              type: 'file',
              required: false,
              options: { maxSelect: 1, maxSize: 5242880, mimeTypes: ['image/jpeg', 'image/png', 'image/gif'] }
            }
          ],
          listRule: 'id = @request.auth.id',
          viewRule: 'id = @request.auth.id',
          createRule: '',
          updateRule: 'id = @request.auth.id',
          deleteRule: 'id = @request.auth.id',
          options: {
            allowEmailAuth: true,
            allowOAuth2Auth: false,
            allowUsernameAuth: false,
            requireEmail: true,
            exceptEmailDomains: [],
            onlyEmailDomains: [],
            minPasswordLength: 8
          }
        })
      });

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        throw new Error(`Failed to create collection: ${createResponse.status} ${errorText}`);
      }

      console.log('✅ Users collection created successfully\n');
    }

    // Step 4: Create test user
    console.log('4️⃣ Creating test user...');
    const testUserResponse = await fetch(`${POCKETBASE_URL}/api/collections/users/records`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@test.com',
        password: 'test1234test',
        passwordConfirm: 'test1234test',
        name: 'Test User',
        emailVisibility: true
      })
    });

    if (testUserResponse.ok) {
      console.log('✅ Test user created: test@test.com / test1234test\n');
    } else {
      const errorText = await testUserResponse.text();
      if (errorText.includes('already exists')) {
        console.log('ℹ️ Test user already exists\n');
      } else {
        console.log(`⚠️ Could not create test user: ${errorText}\n`);
      }
    }

    // Success summary
    console.log('🎉 SUCCESS! Users collection is properly configured.\n');
    console.log('📋 Summary:');
    console.log('  - Collection: users (auth type)');
    console.log('  - Email auth: ENABLED');
    console.log('  - Public signup: ENABLED');
    console.log('  - Test account: test@test.com / test1234test');
    console.log('\n✅ Ready to re-enable authentication in your app!\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nPlease check:');
    console.error('  - PocketBase backend is running');
    console.error('  - Admin credentials are correct');
    console.error('  - Network connection is stable\n');
    process.exit(1);
  }
}

// Run the setup
setupUsersCollection();
