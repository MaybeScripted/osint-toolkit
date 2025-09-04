#!/bin/bash

echo "🚀 Starting OSINT Intelligence Platform..."

# Check if python virtual environment exists, because if it doesnt exist, we need to setup the environment (duh)
if [ ! -d "venv" ]; then
    echo "🐍 Setting up Python environment..."
    python3 setup.py
    if [ $? -ne 0 ]; then
        echo "❌ Python setup failed!"
        exit 1
    fi
fi

# if the environment exists, we need to activate it. because thats lowkey important
echo "🔧 Activating virtual environment..."
source ./venv/bin/activate

# Check if node_modules exist. (they probably do but just in case)
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Node.js dependencies..."
    npm run install:all
fi

# Checking if  the backend .env exists also pretty important.
if [ ! -f "backend/.env" ]; then
    echo "⚙️ Creating backend .env file..."
    cp backend/env.example backend/.env
    echo "❗ Please edit backend/.env with your API keys before running again!"
    exit 1
fi

# Start the application, incase you couldnt tell.
echo "🔥 Starting all services..."
npm run dev
