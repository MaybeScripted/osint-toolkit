# 🛠️ OSINT Toolkit

a Website/Project that allows you to use multiple free APIs and tools into one place.

> **🚀 Quick Start**: Just run `./start.sh` (Linux/macOS) or `start.bat` (Windows) to get everything running automatically!

### btw, heads-up
this project is severely early stage and not actively being worked on as i am working on a ton of other private projects. dont expect it to work flawlessly

## Setup

### Quick Start (Recommended)

**The easiest way to get started - just run one command:**

**Linux/macOS:**
```bash
git clone <your-repo>
cd osint-toolkit
chmod +x start.sh
./start.sh
```

**Windows:**
```cmd
git clone <your-repo>
cd osint-toolkit
start.bat
```

**What the startup scripts do automatically:**
- ✅ Sets up Python virtual environment
- ✅ Installs all Python dependencies (including Sherlock as Python module)
- ✅ Installs Node.js dependencies
- ✅ Creates backend configuration file
- ✅ Starts all services automatically:
  - Frontend: http://localhost:3000
  - Backend API: http://localhost:3001  
  - Sherlock: Available as Python module (integrated)
- ✅ Cleans up any existing processes to avoid conflicts

**That's it!** Just run the script and everything starts up. Press `Ctrl+C` to stop all services.

### Alternative: Manual Setup

If you prefer to set up manually or the start scripts don't work:

```bash
# 1. Clone the repository
git clone <your-repo>
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

## Features

### 🔍 Core Lookup Tools
- **Email Lookup** - Verify emails, Gravatar profiles & social intelligence
- **Username Search** - Find profiles across 400+ platforms using Sherlock
- **IP Lookup** - Get IP geolocation, ISP & reputation data  
- **Domain Lookup** - DNS records, WHOIS data & SSL certificates

### 🛠️ Utilities
- **Easy-ID Generator** - Generate realistic fake data for testing (names, addresses, credit cards, etc.)

### Screenshots
Note, some screenshots might be outdated. just because i suck at updating the readme actively.
<img src="readme-assets/domain-lookup.png" alt="Domain Lookup" width="450" />
<img src="readme-assets/Email-Lookup.png" alt="Email Lookup" width="450" />
<img src="readme-assets/Name-Lookup.png" alt="Name Lookup" width="450" />
<img src="readme-assets/ip-info.png" alt="IP Info" width="450" />

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
- ✅ **macOS** (Intel & Apple Silicon), ew..

## Recent Updates

### 🎯 UI/UX Improvements
- **Streamlined Interface** - Removed redundant features section, now using tool categories as direct action buttons
- **Better Organization** - Reorganized tools by OSINT workflow (Core Lookups → People & Social → Network → Forensics → Utilities)
- **Cleaner Results** - Improved modal displays with card-based layouts for better readability

### 🔧 Technical Improvements
- **Sherlock Integration** - Now runs as integrated Python module instead of separate API service
- **Easy-ID Generator** - Fixed credit card generation and locale support (EN, PT, ZH)
- **Code Cleanup** - Removed unused components and streamlined the codebase

### 🐛 Bug Fixes
- Fixed credit card generation returning 500 errors
- Fixed locale support for fake data generation
- Improved error handling and user feedback

---


