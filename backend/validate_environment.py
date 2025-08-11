#!/usr/bin/env python3
"""
Environment validation script with debug-heavy methodology
Validates all dependencies and configurations before startup
"""

import sys
import importlib
from pathlib import Path
from datetime import datetime

def debug(category: str, description: str, **kwargs):
    """Debug logging for environment validation"""
    timestamp = datetime.now().strftime("%H:%M:%S.%f")[:-3]
    metrics = ", ".join([f"{k}: {v}" for k, v in kwargs.items()])
    print(f"DEBUG {category}: {description} - {metrics} [{timestamp}]")

def validate_package(package_name: str, import_name: str = None) -> bool:
    """Validate a package is properly installed and importable"""
    try:
        if import_name is None:
            import_name = package_name.replace('-', '_')
        
        module = importlib.import_module(import_name)
        version = getattr(module, '__version__', 'unknown')
        
        debug("VALIDATION", f"Package {package_name} validated", 
             import_name=import_name, version=version)
        return True
        
    except ImportError as e:
        debug("ERROR", f"Package {package_name} validation failed", 
             import_name=import_name, error=str(e))
        return False

def validate_environment():
    """Comprehensive environment validation"""
    debug("VALIDATION", "Starting Sunny environment validation")
    
    # Critical packages for Sunny
    critical_packages = [
        ('fastapi', 'fastapi'),
        ('uvicorn', 'uvicorn'),
        ('pydantic', 'pydantic'),
        ('passlib', 'passlib'),
        ('python-jose', 'jose'),
        ('anthropic', 'anthropic'),
        ('python-socketio', 'socketio'),
        ('email-validator', 'email_validator'),
        ('bcrypt', 'bcrypt'),
        ('psutil', 'psutil'),
        ('aiofiles', 'aiofiles'),
        ('websockets', 'websockets'),
        ('rich', 'rich')
    ]
    
    validation_results = []
    
    for package_name, import_name in critical_packages:
        result = validate_package(package_name, import_name)
        validation_results.append((package_name, result))
    
    # Summary
    successful = sum(1 for _, result in validation_results if result)
    total = len(validation_results)
    
    debug("VALIDATION", "Environment validation completed", 
         successful=successful, total=total, success_rate=f"{successful/total*100:.1f}%")
    
    if successful == total:
        debug("SUCCESS", "All critical packages validated successfully")
        return True
    else:
        failed_packages = [name for name, result in validation_results if not result]
        debug("ERROR", "Environment validation failed", failed_packages=", ".join(failed_packages))
        return False

def validate_configuration():
    """Validate Sunny configuration files"""
    debug("VALIDATION", "Validating Sunny configuration")
    
    config_checks = []
    
    # Check for .env file
    env_file = Path(__file__).parent / ".env"
    if env_file.exists():
        debug("VALIDATION", "Environment file found", file=str(env_file))
        config_checks.append(True)
    else:
        debug("INFO", "Environment file not found (optional)", file=str(env_file))
        config_checks.append(True)  # Optional, so still pass
    
    # Check for main app file
    main_app = Path(__file__).parent / "app" / "main.py"
    if main_app.exists():
        debug("VALIDATION", "Main application file found", file=str(main_app))
        config_checks.append(True)
    else:
        debug("ERROR", "Main application file missing", file=str(main_app))
        config_checks.append(False)
    
    # Check for critical directories
    critical_dirs = [
        Path(__file__).parent / "app",
        Path(__file__).parent / "app" / "routes",
        Path(__file__).parent / "app" / "services",
        Path(__file__).parent / "app" / "utils"
    ]
    
    for dir_path in critical_dirs:
        if dir_path.exists():
            debug("VALIDATION", f"Directory found", directory=str(dir_path))
            config_checks.append(True)
        else:
            debug("ERROR", f"Directory missing", directory=str(dir_path))
            config_checks.append(False)
    
    all_valid = all(config_checks)
    debug("VALIDATION", "Configuration validation completed", 
         checks_passed=sum(config_checks), 
         total_checks=len(config_checks),
         status="PASSED" if all_valid else "FAILED")
    
    return all_valid

def validate_python_version():
    """Validate Python version compatibility"""
    import sys
    python_version = sys.version_info
    
    debug("VALIDATION", "Python version check", 
         version=f"{python_version.major}.{python_version.minor}.{python_version.micro}")
    
    if python_version.major >= 3 and python_version.minor >= 8:
        debug("SUCCESS", "Python version compatible", 
             required="3.8+", current=f"{python_version.major}.{python_version.minor}")
        return True
    else:
        debug("ERROR", "Python version incompatible", 
             required="3.8+", current=f"{python_version.major}.{python_version.minor}")
        return False

def generate_report():
    """Generate comprehensive validation report"""
    debug("REPORT", "Generating Sunny environment report")
    
    print("\n" + "="*60)
    print("SUNNY ENVIRONMENT VALIDATION REPORT")
    print("="*60)
    
    # Python version
    python_valid = validate_python_version()
    print(f"[OK] Python Version: {'PASSED' if python_valid else 'FAILED'}")
    
    # Environment packages
    env_valid = validate_environment()
    print(f"[OK] Package Dependencies: {'PASSED' if env_valid else 'FAILED'}")
    
    # Configuration
    config_valid = validate_configuration()
    print(f"[OK] Configuration Files: {'PASSED' if config_valid else 'FAILED'}")
    
    print("="*60)
    
    overall_valid = python_valid and env_valid and config_valid
    
    if overall_valid:
        print("[SUCCESS] SUNNY ENVIRONMENT: READY FOR LAUNCH")
    else:
        print("[ERROR] SUNNY ENVIRONMENT: ISSUES DETECTED")
        print("\nRun 'python install_dependencies.py' to fix package issues")
    
    print("="*60 + "\n")
    
    return overall_valid

if __name__ == "__main__":
    overall_valid = generate_report()
    
    if overall_valid:
        debug("SUCCESS", "Sunny environment fully validated and ready")
        sys.exit(0)
    else:
        debug("ERROR", "Sunny environment validation failed - run install_dependencies.py")
        sys.exit(1)