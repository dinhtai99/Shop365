#!/bin/bash

echo "🔧 Fixing CSS issues..."

# Remove .next cache
echo "🗑️  Removing .next cache..."
rm -rf .next

# Remove node_modules/.cache if exists
echo "🗑️  Removing node_modules cache..."
rm -rf node_modules/.cache

echo "✅ Cache cleared!"
echo ""
echo "📝 Next steps:"
echo "1. Stop your dev server (Ctrl+C)"
echo "2. Run: npm run dev"
echo "3. Refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)"
