#!/bin/bash
# Quick fix for 429 rate limit errors during development

echo "🚦 Fixing rate limit issues..."
echo ""

# Check if .env exists and update it, or create it
if [ -f ".env" ]; then
    # Remove existing NODE_ENV line if it exists
    grep -v "^NODE_ENV=" .env > .env.tmp && mv .env.tmp .env
    # Add development NODE_ENV
    echo "NODE_ENV=development" >> .env
    echo "✅ Updated .env file with NODE_ENV=development"
else
    echo "NODE_ENV=development" > .env
    echo "✅ Created .env file with NODE_ENV=development"
fi

echo ""
echo "🔄 Now restart your dev server:"
echo "   bun run dev"
echo ""
echo "📈 Rate limits are now:"
echo "   • API endpoints: 1000 requests per 15 minutes"
echo "   • Auth endpoints: 200 requests per 15 minutes"
echo ""
echo "💡 For more options, run: bun run rate-limit"