# 🛠️ OSINT Toolkit

a Website/Project that allows you to use multiple free APIs and tools into one place.

<img src="readme-assets/ui-preview.png" alt="OSINT Toolkit UI Preview" width="600" />

### btw, heads-up
this project is severely early stage and not actively being worked on as i am working on a ton of other private projects. dont expect it to work flawlessly

## Setup

### Quick Start (Recommended) 🚀

**One-command startup that handles everything automatically:**

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

**What the startup scripts do:**
- ✅ Sets up Python virtual environment
- ✅ Installs all Python dependencies (including Flask for Sherlock)
- ✅ Installs Node.js dependencies
- ✅ Creates backend configuration file
- ✅ Starts all 3 services automatically:
  - Frontend: http://localhost:3000
  - Backend API: http://localhost:3001  
  - Sherlock API: http://localhost:3002
- ✅ Cleans up any existing processes to avoid conflicts

**That's it!** Just run the script and everything starts up. Press `Ctrl+C` to stop all services.

### Manual Setup

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

### 🔍 Domain Lookup
Get comprehensive domain information including DNS records, WHOIS data, and SSL certificates.

<img src="readme-assets/domain-lookup.png" alt="Domain Lookup" width="450" />

### 📧 Email Analysis
Verify email addresses and easily get person/company information.

<img src="readme-assets/Email-Lookup.png" alt="Email Lookup" width="450" />

### 👤 Name Lookup
Search for people across various platforms and find out where they have an account.

<img src="readme-assets/Name-Lookup.png" alt="Name Lookup" width="450" />

### 🌐 IP Intelligence
Get IP and geolocation data. (feel like this one was obvious)

<img src="readme-assets/ip-info.png" alt="IP Info" width="450" />

## APIs Used

- **Hunter.io**        - Email verification, person/company stuff
- **RapidAPI WHOIS**   - Domain DNS records, WHOIS data, and SSL certificates
- **Gravatar**         - Profiles and social profiles
- **ipapi.co**         - IP geolocation (free, 1000/day)
- **VirusTotal**       - IP reputation stuff (free, 500/day)  
- **Sherlock**         - Username social media discovery (self-hosted)

## Development

```bash
# Start all services
npm run dev

# Or start individual services
npm run dev:frontend     # Frontend only
npm run dev:backend      # Backend only  
npm run dev:sherlock     # Sherlock API only

# Setup commands
npm run setup           # Linux/macOS Python setup
npm run setup:win       # Windows Python setup
```

**Services:**
- **Frontend**: http://localhost:3000  
- **Backend**: http://localhost:3001  
- **Sherlock**: http://localhost:3002

### Platform Support
- ✅ **Linux** (Arch, Ubuntu, Debian, etc.)
- ✅ **Windows** (10/11)
- ✅ **macOS** (Intel & Apple Silicon), ew..

---


