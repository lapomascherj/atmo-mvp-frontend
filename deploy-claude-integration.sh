#!/bin/bash

# ATMO Claude AI Integration - Deployment Script
# This script deploys the Claude AI integration to Supabase

set -e  # Exit on error

PROJECT_REF="cfdoxxegobtgptqjutil"
CLAUDE_API_KEY="YOUR_CLAUDE_API_KEY_HERE"

echo "🚀 ATMO Claude AI Integration Deployment"
echo "========================================="
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Installing..."
    brew install supabase/tap/supabase
    echo "✅ Supabase CLI installed"
fi

echo "📋 Step 1: Login to Supabase"
echo "You'll be redirected to your browser to login..."
supabase login

echo ""
echo "📋 Step 2: Link to project"
echo "When prompted for database password, use: TheAtmosphereAdmin!"
supabase link --project-ref $PROJECT_REF

echo ""
echo "📋 Step 3: Deploy chat edge function"
supabase functions deploy chat --project-ref $PROJECT_REF

echo ""
echo "📋 Step 4: Deploy process-entities edge function"
supabase functions deploy process-entities --project-ref $PROJECT_REF

echo ""
echo "📋 Step 5: Set Claude API key (secret)"
supabase secrets set CLAUDE_API_KEY="$CLAUDE_API_KEY" --project-ref $PROJECT_REF

echo ""
echo "📋 Step 6: Set dry run mode (safe testing)"
supabase secrets set CLAUDE_DRY_RUN="true" --project-ref $PROJECT_REF

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 NEXT STEPS:"
echo "1. Run database migration SQL in Supabase Dashboard"
echo "   - Go to: https://$PROJECT_REF.supabase.co"
echo "   - Navigate to SQL Editor"
echo "   - Run the contents of: supabase-chat-migration.sql"
echo ""
echo "2. Set up cron job in Supabase Dashboard"
echo "   - Go to Settings → API → Copy 'service_role' key"
echo "   - In SQL Editor, run the cron SQL from DEPLOYMENT_COMMANDS.md"
echo "   - Replace YOUR_SERVICE_ROLE_KEY with the actual key"
echo ""
echo "3. Test the integration"
echo "   - Update .env.local: VITE_ENABLE_CLAUDE_CHAT=true"
echo "   - Restart: npm run dev"
echo "   - Send a test message in the chat"
echo ""
echo "🎉 All done! Check IMPLEMENTATION_COMPLETE.md for full docs."
