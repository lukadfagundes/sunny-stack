#!/usr/bin/env python3
"""
Dependency installation script with debug-heavy methodology
Ensures all required packages are installed with proper error handling
"""

import subprocess
import sys
import os
from pathlib import Path
from datetime import datetime

def debug(category: str, description: str, **kwargs):
    """Debug logging for dependency installation"""
    timestamp = datetime.now().strftime("%H:%M:%S.%f")[:-3]
    metrics = ", ".join([f"{k}: {v}" for k, v in kwargs.items()])
    print(f"DEBUG {category}: {description} - {metrics} [{timestamp}]")

def install_package(package: str) -> bool:
    """Install a single package with debug logging"""
    try:
        debug("INSTALL", f"Installing package: {package}")
        
        result = subprocess.run(
            [sys.executable, "-m", "pip", "install", package],
            capture_output=True,
            text=True,
            timeout=300  # 5 minute timeout
        )
        
        if result.returncode == 0:
            debug("INSTALL", f"Successfully installed {package}", 
                 exit_code=result.returncode)
            return True
        else:
            debug("ERROR", f"Failed to install {package}", 
                 exit_code=result.returncode, 
                 stderr=result.stderr[:200] if result.stderr else "No error output")
            return False
            
    except subprocess.TimeoutExpired:
        debug("ERROR", f"Installation timeout for {package}", timeout_seconds=300)
        return False
    except Exception as e:
        debug("ERROR", f"Installation exception for {package}", error=str(e))
        return False

def check_package(package: str) -> bool:
    """Check if a package is already installed"""
    try:
        package_name = package.split('==')[0].split('>=')[0].split('[')[0].replace('-', '_')
        
        # Special cases for package names
        import_mapping = {
            'python_jose': 'jose',
            'python_socketio': 'socketio',
            'email_validator': 'email_validator',
            'python_multipart': 'multipart',
            'python_dotenv': 'dotenv'
        }
        
        import_name = import_mapping.get(package_name, package_name)
        
        __import__(import_name)
        debug("CHECK", f"Package {package} already installed")
        return True
    except ImportError:
        debug("CHECK", f"Package {package} not found, needs installation")
        return False

def main():
    """Main dependency installation with comprehensive error handling"""
    debug("STARTUP", "Starting Sunny dependency installation")
    
    # Read requirements
    requirements_file = Path(__file__).parent / "requirements.txt"
    
    if not requirements_file.exists():
        debug("ERROR", "requirements.txt not found", path=str(requirements_file))
        return False
    
    with open(requirements_file, 'r') as f:
        packages = [
            line.strip() 
            for line in f.readlines() 
            if line.strip() and not line.startswith('#')
        ]
    
    debug("INSTALL", "Found packages in requirements.txt", count=len(packages))
    
    # Upgrade pip first
    debug("INSTALL", "Upgrading pip to latest version")
    subprocess.run([sys.executable, "-m", "pip", "install", "--upgrade", "pip"], 
                   capture_output=True, text=True)
    
    # Install packages
    failed_packages = []
    success_count = 0
    skipped_count = 0
    
    for package in packages:
        package_name = package.split('==')[0].split('>=')[0].split('[')[0]
        
        if check_package(package_name):
            debug("SKIP", f"Package {package_name} already installed, skipping")
            skipped_count += 1
            success_count += 1
        else:
            if install_package(package):
                success_count += 1
            else:
                failed_packages.append(package)
    
    # Report results
    debug("INSTALL", "Dependency installation completed", 
         total_packages=len(packages),
         successful=success_count,
         skipped=skipped_count,
         failed=len(failed_packages))
    
    if failed_packages:
        debug("ERROR", "Some packages failed to install", 
             failed_packages=", ".join(failed_packages))
        
        # Try alternative installation for failed packages
        debug("INSTALL", "Attempting alternative installation for failed packages")
        for package in failed_packages[:]:
            # Try without version specifier
            package_base = package.split('==')[0].split('>=')[0]
            if install_package(package_base):
                failed_packages.remove(package)
                debug("SUCCESS", f"Installed {package_base} without version constraint")
    
    if failed_packages:
        debug("WARNING", "Some packages could not be installed", 
             remaining_failures=", ".join(failed_packages))
        return False
    
    debug("SUCCESS", "All dependencies installed successfully")
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)