@echo off
echo 🚀 Starting osint Intelligence   Platform...

REM Check if node_modules exist
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    call npm run install:all
)

REM Check if backend .env exists  
if not exist "backend\.env" (
    echo ⚙️ Creating backend .env file...
    copy "backend\env.example" "backend\.env"
    echo ❗ Please edit backend\.env with your osint API key before running again!
    pause
    exit /b 1
)

REM Start the application
echo 🔥 Starting both backend and frontend...
call npm run dev
