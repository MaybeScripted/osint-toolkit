#!/usr/bin/env python3
"""
Simple Flask API wrapper for Sherlock
Provides REST endpoints for the OSINT   platform
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import subprocess
import json
import os
import time
import threading
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend access

# Store for tracking requests
active_requests = {}
request_counter = 0

def run_sherlock_search(username, timeout=30):
    """Run Sherlock search and parse results"""
    try:
        # Starting Sherlock search
        
        # Run sherlock command with JSON output
        cmd = [
            'python', '-m', 'sherlock_project', username,
            '--timeout', str(timeout),
            '--print-found',
            '--no-color'
        ]
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout + 10  # Extra buffer for subprocess timeout
        )
        
        profiles = []
        
        if result.returncode == 0:
            # Parse sherlock output
            lines = result.stdout.strip().split('\n')
            
            for line in lines:
                line = line.strip()
                
                # Look for lines that contain URLs (found profiles)
                if 'http' in line and ':' in line:
                    # Parse format: "[+] Platform: https://platform.com/username"
                    if '[+]' in line and ': http' in line:
                        # Split on the first occurrence of ': http'
                        platform_part, url_part = line.split(': http', 1)
                        
                        # Extract platform name by removing "[+] " prefix
                        platform = platform_part.replace('[+]', '').strip()
                        url = 'http' + url_part.strip()
                        
                        profiles.append({
                            'site': platform,
                            'url': url,
                            'exists': True,
                            'response_time': None
                        })
                    
                    # Also catch simple "Platform: URL" format without [+]
                    elif ': http' in line and '[+]' not in line:
                        parts = line.split(': http', 1)
                        if len(parts) == 2:
                            platform = parts[0].strip()
                            url = 'http' + parts[1].strip()
                            
                            profiles.append({
                                'site': platform,
                                'url': url,
                                'exists': True,
                                'response_time': None
                            })
        
        # Sherlock search completed
        return profiles
        
    except subprocess.TimeoutExpired:
        print(f"Sherlock search timed out for {username}")
        return []
    except Exception as e:
        print(f"Sherlock error for {username}: {str(e)}")
        print(f"Error type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        return []

@app.route('/lookup/<username>')
def lookup_username(username):
    """Lookup username across social media platforms"""
    global request_counter
    request_counter += 1
    
    start_time = time.time()
    
    try:
        # Validate username
        if not username or len(username) < 2 or len(username) > 30:
            return jsonify({
                'success': False,
                'error': 'Invalid username format',
                'username': username
            }), 400
        
        # Clean username (remove special chars that might break things)
        clean_username = ''.join(c for c in username if c.isalnum() or c in '_-.')
        
        if not clean_username:
            return jsonify({
                'success': False,
                'error': 'Username contains only invalid characters',
                'username': username
            }), 400
        
        # Processing username lookup
        
        # Run Sherlock search
        profiles = run_sherlock_search(clean_username)
        
        end_time = time.time()
        search_duration = round(end_time - start_time, 2)
        
        return jsonify({
            'username': clean_username,
            'results': profiles,
            'checked_sites': len(profiles),
            'found_sites': len([p for p in profiles if p['exists']]),
            'search_duration': search_duration,
            'timestamp': datetime.now().isoformat(),
            'success': True
        })
        
    except Exception as e:
        print(f"ERROR in Sherlock lookup for {username}: {str(e)}")
        print(f"Error type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e),
            'username': username,
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/status')
def status():
    """API health check"""
    uptime = time.time() - start_time
    
    return jsonify({
        'status': 'ok',
        'service': 'Sherlock API',
        'uptime_seconds': round(uptime, 2),
        'uptime': f"{int(uptime//60)}m {int(uptime%60)}s",
        'total_requests': request_counter,
        'active_requests': len(active_requests),
        'timestamp': datetime.now().isoformat()
    })

@app.route('/platforms')
def platforms():
    """Get list of supported platforms (if available)"""
    try:
        # Try to get platform list from Sherlock
        result = subprocess.run(
            ['python', '-m', 'sherlock_project', '--help'],
            capture_output=True,
            text=True,
            timeout=5
        )
        
        # This is a basic implementation - Sherlock doesn't easily expose platform list
        return jsonify({
            'platforms': [
                'Twitter', 'Instagram', 'GitHub', 'LinkedIn', 'Facebook',
                'YouTube', 'TikTok', 'Reddit', 'Discord', 'Telegram',
                'And 390+ more...'
            ],
            'total_platforms': '400+',
            'note': 'Sherlock checks 400+ platforms automatically'
        })
        
    except Exception as e:
        return jsonify({
            'error': str(e),
            'platforms': [],
            'total_platforms': 'unknown'
        }), 500

@app.route('/health')
def health():
    """Detailed health check"""
    try:
        # Test if sherlock module exists and is runnable
        result = subprocess.run(
            ['python', '-m', 'sherlock_project', '--version'],
            capture_output=True,
            text=True,
            timeout=5
        )
        
        sherlock_working = result.returncode == 0
        
        return jsonify({
            'status': 'healthy' if sherlock_working else 'degraded',
            'sherlock_available': sherlock_working,
            'python_working': True,
            'flask_working': True,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'error': str(e),
            'sherlock_available': False,
            'timestamp': datetime.now().isoformat()
        }), 503

# CORS headers for all responses
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

if __name__ == '__main__':
    start_time = time.time()
    
    print("Starting Sherlock API Service...")
    print("Username lookups available at: http://localhost:3002/lookup/{username}")
    print("Status endpoint: http://localhost:3002/status")
    print("Health check: http://localhost:3002/health")
    print("=" * 50)
    
    app.run(
        host='0.0.0.0',  # Allow external connections
        port=3002,       # Port 3002 (avoid conflict with frontend)
        debug=False,     # Disable debug in production
        threaded=True    # Handle multiple requests
    )
