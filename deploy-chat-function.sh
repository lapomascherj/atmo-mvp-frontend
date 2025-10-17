#!/bin/bash

# Deploy the chat edge function to enable ATMO to create tasks, projects, etc.
# Run this script after logging in to Supabase CLI

echo "🚀 Deploying chat edge function..."
echo ""
echo "This will enable ATMO to:"
echo "  ✓ Create tasks, projects, goals, milestones"
echo "  ✓ Add knowledge items and insights"
echo "  ✓ Actually execute actions you request"
echo ""

# Check if logged in
if ! supabase projects list &>/dev/null; then
    echo "❌ Not logged in to Supabase CLI"
    echo ""
    echo "Please run: supabase login"
    echo "Then run this script again"
    exit 1
fi

# Deploy the function
echo "Deploying function..."
supabase functions deploy chat --project-ref cfdoxxegobtgptqjutil

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully deployed! ATMO can now:"
    echo "   • Create tasks when you ask"
    echo "   • Add projects to your workspace"
    echo "   • Save knowledge items"
    echo "   • Create goals and milestones"
    echo ""
    echo "Try it: 'Add a task to test the new functionality'"
else
    echo ""
    echo "❌ Deployment failed. Check the error above."
    exit 1
fi
