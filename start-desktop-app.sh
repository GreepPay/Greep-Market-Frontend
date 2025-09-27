#!/bin/bash

# Greep Market Desktop App Launcher
echo "🚀 Starting Greep Market Desktop App..."

# Check if build exists
if [ ! -d "build" ]; then
    echo "📦 Building the app first..."
    npm run build
fi

# Install serve if not already installed
if ! command -v serve &> /dev/null; then
    echo "📥 Installing serve package..."
    npm install -g serve
fi

echo "🌐 Starting local server..."
echo "📱 Open http://localhost:3000 in your browser"
echo "💡 Look for the 'Install' button in your browser's address bar"
echo "🖥️  Your app will be installable as a desktop application!"
echo ""
echo "Press Ctrl+C to stop the server"

# Start the server
serve -s build -l 3000
