#!/bin/bash

echo "🚀 Starting osint Intelligence   Platform..."

# Check if node_modules exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm run install:all
fi

# Check if backend .env exists
if [ ! -f "backend/.env" ]; then
    echo "⚙️ Creating backend .env file..."
    cp backend/env.example backend/.env
    echo "❗ Please edit backend/.env with your osint API key before running again!"
    exit 1
fi

# Start the application
echo "🔥 Starting both backend and frontend..."
npm run dev
