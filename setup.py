#!/usr/bin/env python3
"""
Cross-platform setup script for OSINT Toolkit
Handles Python virtual environment creation and dependency installation
"""

import os
import sys
import subprocess
import platform
from pathlib import Path

def run_command(cmd, shell=False):
    """Run a command and return success status"""
    try:
        if shell:
            result = subprocess.run(cmd, shell=True, check=True, capture_output=True, text=True)
        else:
            result = subprocess.run(cmd, check=True, capture_output=True, text=True)
        print(f"✅ {cmd}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed: {cmd}")
        print(f"Error: {e.stderr}")
        return False

def get_python_cmd():
    """Get the appropriate Python command for the platform"""
    if platform.system() == "Windows":
        return "python"
    else:
        return "python3"

def setup_virtual_environment():
    """Create and setup Python virtual environment"""
    python_cmd = get_python_cmd()
    venv_path = Path("venv")
    
    print("Setting up Python virtual environment...")
    
    # Check if venv already exists
    if venv_path.exists():
        print("Virtual environment already exists")
    else:
        # Create virtual environment
        if not run_command([python_cmd, "-m", "venv", "venv"]):
            print("❌ Failed to create virtual environment")
            return False
    
    # Determine activation script path and pip command
    if platform.system() == "Windows":
        activate_script = venv_path / "Scripts" / "activate.bat"
        pip_cmd = venv_path / "Scripts" / "pip"
    else:
        activate_script = venv_path / "bin" / "activate"
        pip_cmd = venv_path / "bin" / "pip"
    
    # Check if requirements.txt exists
    if not Path("requirements.txt").exists():
        print("❌ requirements.txt not found")
        return False
    
    # Install Python dependencies
    print("Installing Python dependencies...")
    if not run_command([str(pip_cmd), "install", "-r", "requirements.txt"]):
        print("❌ Failed to install requirements")
        return False
    
    # Install Sherlock in development mode
    print("Installing Sherlock...")
    sherlock_path = Path("sherlock")
    if sherlock_path.exists():
        if not run_command([str(pip_cmd), "install", "-e", str(sherlock_path)]):
            print("⚠️  Sherlock installation failed, continuing without it...")
    else:
        print("⚠️  Sherlock directory not found, skipping...")
    
    print("Python environment setup complete!")
    print(f"To activate: {'venv\\Scripts\\activate' if platform.system() == 'Windows' else 'source venv/bin/activate'}")
    return True

def main():
    """Main setup function"""
    print("OSINT Toolkit Setup")
    print("=" * 50)
    
    # Check Python version
    python_cmd = get_python_cmd()
    try:
        result = subprocess.run([python_cmd, "--version"], capture_output=True, text=True)
        if result.returncode != 0:
            print(f"❌ Python command '{python_cmd}' not found")
            return False
            
        version = result.stdout.strip()
        print(f"🐍 Found {version}")
        
        # Check if version is 3.7+ (more reasonable minimum)
        version_num = version.split()[1]
        major, minor = map(int, version_num.split('.')[:2])
        if major < 3 or (major == 3 and minor < 7):
            print("❌ Python 3.7+ required")
            return False
            
    except Exception as e:
        print(f"❌ Python not found: {e}")
        return False
    
    # Set up virtual environment
    if not setup_virtual_environment():
        return False
    
    print("\n🎉 Setup complete!")
    print("\nNext steps:")
    print("1. Run: npm run install:all")
    print("2. Copy backend/env.example to backend/.env")
    print("3. Edit backend/.env with your API keys (optional)")
    print("4. Run: ./start.sh (Linux/macOS) or start.bat (Windows)")
    print("   OR: npm run dev (if you prefer manual control)")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)

# yes, i be using emojis in my code. sue me loser. it looks nicer than just regular text.