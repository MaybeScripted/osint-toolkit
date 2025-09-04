@echo off
echo 🚀 Starting OSINT Intelligence Platform...

REM Checkin if Python virtual environment exists, because if it doesnt exist, we need to set it up
if not exist "venv" (
    echo 🐍 Setting up Python environment...
    python setup.py
    if errorlevel 1 (
        echo ❌ Python setup failed!
        pause
        exit /b 1
    )
)

REM Activate virtual environment, (lowkey) (pretty important) (most likely) (obviously)
echo 🔧 Activating virtual environment...
call venv\Scripts\activate.bat

REM Check if node_modules exist. also pretty important.
if not exist "node_modules" (
    echo 📦 Installing Node.js dependencies...
    call npm run install:all
)

REM Check if backend .env exists  
if not exist "backend\.env" (
    echo ⚙️ Creating backend .env file...
    copy "backend\env.example" "backend\.env"
    echo ❗ Please edit backend\.env with your API keys before running again!
    pause
    exit /b 1
)

REM Start the application. if you couldnt tell, i'd be surprised.
echo 🔥 Starting all services...
call npm run dev
