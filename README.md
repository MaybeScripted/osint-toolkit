# 🛠️ OSINT Toolkit

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

a Website/Project that allows you to use multiple free APIs and tools in one place.

> **🚀 Quick Start**: Just run `./start.sh` (Linux/macOS) or `start.bat` (Windows) to get everything running automatically!

### ⚠️ Heads-up
This project is in active development. While i've made significant improvements in V2, some features may still have edge cases. and i am still working to improve stability and functionality overal.

## Setup

### Quick Start (Recommended)

**The easiest way to get started - just run one command:**

**Linux/macOS:**
```bash
git clone https://github.com/MaybeScripted/osint-toolkit.git
cd osint-toolkit
chmod +x start.sh
./start.sh
```

**Windows:**
```cmd
git clone https://github.com/MaybeScripted/osint-toolkit.git
cd osint-toolkit
start.bat
```

**What the startup scripts do automatically:**
- Sets up Python virtual environment
- Installs all Python dependencies (including Sherlock as Python module)
- Installs Node.js dependencies
- Creates backend configuration file
- Starts all services automatically:
  - Frontend: http://localhost:3000
  - Backend API: http://localhost:3001  
  - Sherlock: Available as Python module (integrated)
- Cleans up any existing processes to avoid conflicts

**Thats literally it.** Just run the script and everything starts up. Press `Ctrl+C` to stop all services.

### Alternative: Manual Setup

If you prefer to set up manually or the start scripts don't work:

```bash
# 1. Clone the repository
git clone https://github.com/MaybeScripted/osint-toolkit.git
cd osint-toolkit

# 2. Setup Python environment (Linux/macOS)
python3 setup.py

# 2. Setup Python environment (Windows)
python setup.py

# 3. Install Node.js dependencies
npm run install:all

# 4. Configure API keys (optional)
cp backend/env.example backend/.env
# Edit backend/.env with your API keys

# 5. Start the application
npm run dev
```

### Requirements
- **Node.js** 16+ 
- **Python** 3.9+
- **npm** (comes with Node.js)

Open http://localhost:3000

## APIs & Tools Used

- **Hunter.io**        - Email verification, person/company stuff
- **RapidAPI WHOIS**   - Domain DNS records, WHOIS data, and SSL certificates
- **Gravatar**         - Profiles and social profiles
- **ipapi.co**         - IP geolocation (free, 1000/day)
- **VirusTotal**       - IP reputation stuff (free, 500/day)  
- **Sherlock**         - Username social media discovery (400+ platforms, self-hosted)
- **Faker.js**         - Fake data generation for testing (Easy-ID Generator)

## Development

### 🚀 Quick Start (Recommended)
```bash
# Linux/macOS
./start.sh

# Windows
start.bat
```

### Manual Development Commands
```bash
# Start all services
npm run dev

# Or start individual services
npm run dev:frontend     # Frontend only
npm run dev:backend      # Backend only  

# Setup commands (alternative to start scripts)
npm run setup           # Linux/macOS Python setup
npm run setup:win       # Windows Python setup
```

**Services:**
- **Frontend**: http://localhost:3000  
- **Backend**: http://localhost:3001  
- **Sherlock**: Integrated as Python module (no separate service)

### Platform Support
- ✅ **Linux** (Arch, Ubuntu, Debian, etc.)
- ✅ **Windows** (10/11)
- ✅ **macOS** (Intel & Apple Silicon)

## Recent Updates

### 🎉 Version 2.0.0 - Major Release

### 🎯 UI/UX Improvements
- **Improved Error Handling** - Added error boundaries and better user feedback throughout the application
- **Input Validation** - Real-time validation for all input fields (email, IP, domain, URL, username)
- **Loading States** - Added skeleton loaders and loading spinners for better UX
- **Responsive Design** - Improved mobile layout and sidebar sizing

### 🔧 Technical Improvements
- **Code Quality** - Added ESLint configuration and cleaned up unused imports
- **Performance** - Implemented manual chunking and bundle optimization
- **Validation Middleware** - Added RFC 5322 compliant input validation on backend
- **Domain Lookup Fixes** - Fixed MX record rendering and removed problematic crt.sh integration
- **Version Consistency** - All components now properly aligned to version 2.0.0

### 🐛 Bug Fixes
- Fixed MX records causing React rendering errors
- Removed crt.sh subdomain discovery (was causing "Bad Gateway" warnings)
- Fixed input validation edge cases across all tools

---


