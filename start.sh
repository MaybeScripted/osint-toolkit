#!/bin/bash

echo "🚀 Starting OSINT Intelligence Platform..."

# Function to kill any existing processes on our ports
cleanup_ports() {
    echo "🧹 Cleaning up any existing processes..."
    pkill -f "node.*server.js" 2>/dev/null || true
    pkill -f "vite.*--port 3000" 2>/dev/null || true
    pkill -f "concurrently.*osint" 2>/dev/null || true
    sleep 1
}

# Clean up any existing processes first
cleanup_ports

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

# Install Python dependencies if missing
echo "📦 Checking Python dependencies..."
pip install -r requirements.txt

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
echo "   • Frontend: http://localhost:3000"
echo "   • Backend API: http://localhost:3001" 
echo "   • Sherlock: Available as Python module"
echo ""
echo "Press Ctrl+C to stop all services"
echo "=================================================="

# Trap Ctrl+C to cleanup processes
trap cleanup_ports EXIT

npm run dev
