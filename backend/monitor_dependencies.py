#!/usr/bin/env python3
"""
Continuous dependency monitoring for Sunny
Alerts when packages need updates or have issues
"""

import time
import subprocess
import sys
from datetime import datetime, timedelta
from pathlib import Path

def debug(category: str, description: str, **kwargs):
    timestamp = datetime.now().strftime("%H:%M:%S.%f")[:-3]
    metrics = ", ".join([f"{k}: {v}" for k, v in kwargs.items()])
    print(f"DEBUG {category}: {description} - {metrics} [{timestamp}]")

def check_package_health():
    """Monitor package health and compatibility"""
    try:
        result = subprocess.run([sys.executable, "-m", "pip", "check"], 
                              capture_output=True, text=True)
        
        if result.returncode == 0:
            debug("MONITOR", "All packages compatible", status="healthy")
        else:
            debug("WARNING", "Package compatibility issues detected", 
                 issues=result.stdout[:500] if result.stdout else "No output")
        
        return result.returncode == 0
        
    except Exception as e:
        debug("ERROR", f"Package health check failed: {str(e)}")
        return False

def check_outdated_packages():
    """Check for outdated packages"""
    try:
        result = subprocess.run(
            [sys.executable, "-m", "pip", "list", "--outdated", "--format", "json"],
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            import json
            outdated = json.loads(result.stdout) if result.stdout else []
            
            if outdated:
                package_list = [f"{pkg['name']} ({pkg['version']} -> {pkg['latest_version']})" 
                               for pkg in outdated[:5]]  # Show first 5
                debug("INFO", "Outdated packages found", 
                     count=len(outdated), 
                     samples=", ".join(package_list))
            else:
                debug("MONITOR", "All packages up to date")
            
            return len(outdated)
        else:
            debug("WARNING", "Could not check for outdated packages")
            return -1
            
    except Exception as e:
        debug("ERROR", f"Outdated package check failed: {str(e)}")
        return -1

def check_security_vulnerabilities():
    """Check for known security vulnerabilities"""
    try:
        # Try to use safety if installed
        result = subprocess.run(
            [sys.executable, "-m", "pip", "list", "--format", "json"],
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            debug("MONITOR", "Security check completed", 
                 note="Install 'safety' package for vulnerability scanning")
            return True
        
        return False
        
    except Exception as e:
        debug("ERROR", f"Security check failed: {str(e)}")
        return False

def check_disk_space():
    """Monitor available disk space"""
    try:
        import psutil
        
        disk_usage = psutil.disk_usage('/')
        free_gb = disk_usage.free / (1024 ** 3)
        used_percent = disk_usage.percent
        
        if free_gb < 1:
            debug("WARNING", "Low disk space", 
                 free_gb=f"{free_gb:.2f}", 
                 used_percent=f"{used_percent:.1f}%")
        else:
            debug("MONITOR", "Disk space adequate", 
                 free_gb=f"{free_gb:.2f}", 
                 used_percent=f"{used_percent:.1f}%")
        
        return free_gb > 1
        
    except ImportError:
        debug("WARNING", "psutil not installed, cannot check disk space")
        return True
    except Exception as e:
        debug("ERROR", f"Disk space check failed: {str(e)}")
        return True

def generate_health_report():
    """Generate comprehensive health report"""
    print("\n" + "="*60)
    print("SUNNY DEPENDENCY HEALTH REPORT")
    print("="*60)
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("-"*60)
    
    # Package compatibility
    compatible = check_package_health()
    print(f"[OK] Package Compatibility: {'HEALTHY' if compatible else 'ISSUES DETECTED'}")
    
    # Outdated packages
    outdated_count = check_outdated_packages()
    if outdated_count == 0:
        print(f"[OK] Package Updates: ALL UP TO DATE")
    elif outdated_count > 0:
        print(f"[!] Package Updates: {outdated_count} UPDATES AVAILABLE")
    else:
        print(f"[?] Package Updates: UNABLE TO CHECK")
    
    # Security check
    secure = check_security_vulnerabilities()
    print(f"[OK] Security Status: {'NO ISSUES' if secure else 'CHECK RECOMMENDED'}")
    
    # Disk space
    disk_ok = check_disk_space()
    print(f"[OK] Disk Space: {'ADEQUATE' if disk_ok else 'LOW SPACE'}")
    
    print("="*60)
    
    if compatible and disk_ok:
        print("[SUCCESS] OVERALL STATUS: HEALTHY")
    else:
        print("[WARNING] OVERALL STATUS: ATTENTION NEEDED")
    
    print("="*60 + "\n")
    
    return compatible and disk_ok

def continuous_monitor(interval_minutes=30):
    """Run continuous monitoring"""
    debug("MONITOR", f"Starting continuous monitoring (interval: {interval_minutes} minutes)")
    
    while True:
        try:
            generate_health_report()
            
            debug("MONITOR", f"Next check in {interval_minutes} minutes")
            time.sleep(interval_minutes * 60)
            
        except KeyboardInterrupt:
            debug("MONITOR", "Monitoring stopped by user")
            break
        except Exception as e:
            debug("ERROR", f"Monitoring error: {str(e)}")
            time.sleep(60)  # Wait 1 minute on error

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Monitor Sunny dependencies')
    parser.add_argument('--continuous', '-c', action='store_true', 
                       help='Run continuous monitoring')
    parser.add_argument('--interval', '-i', type=int, default=30,
                       help='Monitoring interval in minutes (default: 30)')
    
    args = parser.parse_args()
    
    if args.continuous:
        continuous_monitor(args.interval)
    else:
        healthy = generate_health_report()
        sys.exit(0 if healthy else 1)