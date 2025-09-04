const { spawn } = require('child_process');
const path = require('path');

class SherlockService {
  constructor() {
    this.isConfiguredFlag = true; // Sherlock is always available as a Python module
  }

  static isValidUsername(username) {
    // Basic username validation - alphanumeric, underscores, dots, hyphens
    // Length between 1-30 characters
    if (!username || typeof username !== 'string') {
      return false;
    }
    
    const usernameRegex = /^[a-zA-Z0-9._-]{1,30}$/;
    return usernameRegex.test(username);
  }

  static async lookupUsername(username) {
    return new Promise((resolve, reject) => {
      if (!this.isValidUsername(username)) {
        reject(new Error('Invalid username format'));
        return;
      }

      // Get the path to the sherlock executable in the virtual environment
      const sherlockPath = path.join(process.cwd(), '..', 'venv', 'bin', 'sherlock');
      
      // Run sherlock directly with --no-txt to prevent file creation
      const sherlockProcess = spawn(sherlockPath, [username, '--print-found', '--no-txt'], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      sherlockProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      sherlockProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      sherlockProcess.on('close', (code) => {
        // Parse the text output from Sherlock
        const platforms = this.parseSherlockOutput(stdout);
        
        resolve({
          success: true,
          data: {
            username: username,
            platforms: platforms,
            raw_output: stdout
          },
          username: username,
          platforms: platforms
        });
      });

      sherlockProcess.on('error', (error) => {
        reject(new Error(`Failed to start Sherlock: ${error.message}`));
      });
    });
  }

  static parseSherlockOutput(output) {
    const platforms = [];
    const lines = output.split('\n');
    
    for (const line of lines) {
      // Look for lines that contain URLs (found profiles)
      const urlMatch = line.match(/\[([+\*])\]\s+(.+?):\s+(https?:\/\/[^\s]+)/);
      if (urlMatch) {
        const status = urlMatch[1];
        const platformName = urlMatch[2].trim();
        const url = urlMatch[3];
        
        platforms.push({
          name: platformName,
          url: url,
          valid: status === '+',
          status: status === '+' ? 'found' : 'not_found'
        });
      }
    }
    
    return platforms;
  }

  static extractEntities(result) {
    if (!result.success || !result.data) {
      return [];
    }

    const entities = [];
    
    // If result.data is an array of platforms
    if (Array.isArray(result.data)) {
      result.data.forEach(platform => {
        if (platform.url) {
          entities.push({
            type: 'social_profile_url',
            value: platform.url,
            platform: platform.name || 'unknown',
            confidence: platform.valid ? 'high' : 'low'
          });
        }
      });
    }
    // If result.data is an object with platforms
    else if (result.data.platforms) {
      result.data.platforms.forEach(platform => {
        if (platform.url) {
          entities.push({
            type: 'social_profile_url',
            value: platform.url,
            platform: platform.name || 'unknown',
            confidence: platform.valid ? 'high' : 'low'
          });
        }
      });
    }

    return entities;
  }

  static async checkSherlockStatus() {
    return new Promise((resolve, reject) => {
      const sherlockPath = path.join(process.cwd(), '..', 'venv', 'bin', 'sherlock');
      
      // Test if sherlock command works
      const testProcess = spawn(sherlockPath, ['--help'], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      testProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      testProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      testProcess.on('close', (code) => {
        if (code === 0 && stdout.includes('OK')) {
          resolve({ status: 'healthy' });
        } else {
          reject(new Error(`Sherlock module test failed: ${stderr || 'Unknown error'}`));
        }
      });

      testProcess.on('error', (error) => {
        reject(new Error(`Failed to test Sherlock: ${error.message}`));
      });
    });
  }

  static isConfigured() {
    return true; // Sherlock is always available as a Python module
  }
}

module.exports = SherlockService;
