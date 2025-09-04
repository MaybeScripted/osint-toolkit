# 🔧 Troubleshooting Guide

## Common Issues & Solutions

### Python Issues

#### "python3: command not found" (Linux/macOS)
```bash
# Install Python 3.9+
# Arch Linux
sudo pacman -S python python-pip

# Ubuntu/Debian
sudo apt update && sudo apt install python3 python3-pip python3-venv

# macOS (with Homebrew)
brew install python@3.11
```

#### "python: command not found" (Windows)
- Download Python from [python.org](https://python.org)
- Make sure to check "Add Python to PATH" during installation
- Restart your terminal/command prompt

#### Virtual Environment Issues
```bash
# If venv creation fails
rm -rf venv  # Linux/macOS
rmdir /s venv  # Windows

# Recreate virtual environment
python3 setup.py  # Linux/macOS
python setup.py   # Windows
```

### Node.js Issues

#### "npm: command not found"
- Install Node.js from [nodejs.org](https://nodejs.org)
- Choose LTS version (16+)
- Restart terminal after installation

#### Permission Issues (Linux/macOS)
```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules
```

### Sherlock/Python Module Issues

#### "ModuleNotFoundError: No module named 'sherlock_project'"
```bash
# Activate virtual environment first
source venv/bin/activate  # Linux/macOS
venv\Scripts\activate     # Windows

# Install sherlock in development mode
pip install -e ./sherlock
```

#### Sherlock API not starting
```bash
# Check if Python can find sherlock
cd sherlock
python3 -m sherlock_project --version  # Linux/macOS
python -m sherlock_project --version   # Windows

# If that works, try running the API directly
python3 sherlock_api.py  # Linux/macOS
python sherlock_api.py   # Windows
```

### Port Issues

#### "Port 3000/3001/3002 already in use"
```bash
# Find what's using the port
lsof -i :3000  # Linux/macOS
netstat -ano | findstr :3000  # Windows

# Kill the process
kill -9 <PID>  # Linux/macOS
taskkill /PID <PID> /F  # Windows
```

### API Key Issues

#### "API key not working"
1. Check `backend/.env` exists
2. Verify API keys are correct (no extra spaces)
3. Check API key limits/quotas
4. Test API keys individually

### Platform-Specific Issues

#### Arch Linux
```bash
# Install required packages
sudo pacman -S python python-pip nodejs npm

# If you get SSL errors
sudo pacman -S ca-certificates
```

#### Windows
- Use PowerShell or Command Prompt as Administrator
- Make sure Windows Defender isn't blocking the app
- Check if antivirus is interfering

#### macOS
```bash
# If you get permission errors
sudo chown -R $(whoami) /usr/local

# If Python issues persist
brew install python@3.11
brew link python@3.11
```

## Getting Help

1. **Check the logs** - Look for error messages in terminal output. could be helpful
2. **Verify requirements** - Make sure Python 3.9+ and Node.js 16+ are installed
3. **Try manual setup** - Use the manual setup steps instead of quick start
4. **Check API keys** - Verify all API keys in `backend/.env` are valid
5. **Restart everything** - Sometimes a fresh start helps

## Debug Mode

Run individual services to isolate issues:

```bash
# Test frontend only
cd frontend && npm run dev

# Test backend only  
cd backend && npm run dev

# Test sherlock only
cd sherlock && python3 sherlock_api.py
```

## Still Stuck? (oof)

- Check the [Issues](https://github.com/your-repo/issues) page
- Create a new issue with:
  - Your OS and version
  - Python version (`python3 --version`)
  - Node.js version (`node --version`)
  - Full error message
  - Steps you've already tried
