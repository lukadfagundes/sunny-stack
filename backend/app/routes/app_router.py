"""
Application Router
Role-based routing to different Sunny applications
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import HTMLResponse, RedirectResponse
from typing import Dict

from ..auth.auth_system import auth_system, UserRole
from .auth_routes import get_current_user
from ..utils.debug_helper import debug

router = APIRouter()

# Application entry points HTML templates
SUNNY_APP_HTML = """
<!DOCTYPE html>
<html>
<head>
    <title>Sunny Platform</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <script>
        window.__SUNNY_USER__ = {user_data};
        window.__SUNNY_APP__ = 'main';
        window.location.href = '/dashboard';
    </script>
</head>
<body>
    <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif;">
        <div>
            <h2>Loading Sunny Platform...</h2>
            <p>Redirecting to dashboard...</p>
        </div>
    </div>
</body>
</html>
"""

NAVIGATOR_CORE_HTML = """
<!DOCTYPE html>
<html>
<head>
    <title>NavigatorCore - AI Development Platform</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <script>
        window.__SUNNY_USER__ = {user_data};
        window.__SUNNY_APP__ = 'navigatorcore';
        window.location.href = '/navigatorcore';
    </script>
</head>
<body>
    <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif;">
        <div>
            <h2>Loading NavigatorCore...</h2>
            <p>AI Development Platform</p>
        </div>
    </div>
</body>
</html>
"""

CLIENT_DEMO_HTML = """
<!DOCTYPE html>
<html>
<head>
    <title>Sunny Client Demo</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <script>
        window.__SUNNY_USER__ = {user_data};
        window.__SUNNY_APP__ = 'client_demo';
        window.location.href = '/demo/{client_id}';
    </script>
</head>
<body>
    <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif;">
        <div>
            <h2>Welcome to Sunny Demo</h2>
            <p>Loading your personalized demo environment...</p>
        </div>
    </div>
</body>
</html>
"""

TEST_ENVIRONMENT_HTML = """
<!DOCTYPE html>
<html>
<head>
    <title>Sunny Test Environment</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <script>
        window.__SUNNY_USER__ = {user_data};
        window.__SUNNY_APP__ = 'test_env';
        window.__DEBUG_MODE__ = true;
        window.location.href = '/test-environment';
    </script>
</head>
<body>
    <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif;">
        <div>
            <h2>Test Environment</h2>
            <p>Loading debug tools...</p>
        </div>
    </div>
</body>
</html>
"""

ADMIN_PANEL_HTML = """
<!DOCTYPE html>
<html>
<head>
    <title>Sunny Admin Panel</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <script>
        window.__SUNNY_USER__ = {user_data};
        window.__SUNNY_APP__ = 'admin';
        window.location.href = '/admin';
    </script>
</head>
<body>
    <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif;">
        <div>
            <h2>Admin Panel</h2>
            <p>Loading administrative tools...</p>
        </div>
    </div>
</body>
</html>
"""

ACCESS_DENIED_HTML = """
<!DOCTYPE html>
<html>
<head>
    <title>Access Denied - Sunny</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
    <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
        <div style="background: white; padding: 40px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center;">
            <h1 style="color: #e53e3e; margin: 0 0 20px 0;">Access Denied</h1>
            <p style="color: #4a5568; margin: 0 0 20px 0;">You don't have permission to access this application.</p>
            <p style="color: #718096; margin: 0;">Contact your administrator for access.</p>
            <a href="/login" style="display: inline-block; margin-top: 20px; padding: 10px 20px; background: #667eea; color: white; text-decoration: none; border-radius: 5px;">Back to Login</a>
        </div>
    </div>
</body>
</html>
"""

@router.get("/app/{app_name}", response_class=HTMLResponse)
async def route_to_application(
    app_name: str,
    current_user: Dict = Depends(get_current_user)
):
    """Route user to specific application based on permissions"""
    
    # Get user permissions
    permissions = await auth_system.get_user_permissions(current_user["email"])
    
    await debug("APP_ROUTER", f"Routing {current_user['email']} to {app_name}")
    
    # Check if user has access to all apps (master admin)
    if "*" in permissions["apps"]:
        app_access = True
    else:
        app_access = app_name in permissions["apps"]
    
    if not app_access:
        await debug("APP_ROUTER", f"Access denied for {current_user['email']} to {app_name}")
        return HTMLResponse(content=ACCESS_DENIED_HTML, status_code=403)
    
    # Prepare user data for frontend
    user_data = {
        "email": current_user["email"],
        "name": current_user.get("name"),
        "role": current_user.get("role"),
        "permissions": permissions
    }
    
    # Route to appropriate application
    if app_name == "sunny":
        html_content = SUNNY_APP_HTML.replace("{user_data}", str(user_data))
    elif app_name == "navigatorcore":
        html_content = NAVIGATOR_CORE_HTML.replace("{user_data}", str(user_data))
    elif app_name == "client_demo":
        # Extract client ID from user metadata or use default
        client_id = current_user.get("metadata", {}).get("client_id", "default")
        html_content = CLIENT_DEMO_HTML.replace("{user_data}", str(user_data)).replace("{client_id}", client_id)
    elif app_name == "test_environment":
        html_content = TEST_ENVIRONMENT_HTML.replace("{user_data}", str(user_data))
    elif app_name == "admin_panel":
        if current_user.get("role") not in [UserRole.ADMIN, UserRole.MASTER_ADMIN]:
            return HTMLResponse(content=ACCESS_DENIED_HTML, status_code=403)
        html_content = ADMIN_PANEL_HTML.replace("{user_data}", str(user_data))
    else:
        # Default app routing
        html_content = SUNNY_APP_HTML.replace("{user_data}", str(user_data))
    
    await debug("APP_ROUTER", f"Successfully routed {current_user['email']} to {app_name}")
    
    return HTMLResponse(content=html_content)

@router.get("/dashboard")
async def route_to_dashboard(current_user: Dict = Depends(get_current_user)):
    """Route user to their default dashboard based on role"""
    
    role = current_user.get("role")
    
    # Route based on role
    if role == UserRole.MASTER_ADMIN:
        return RedirectResponse(url="/app/admin_panel")
    elif role == UserRole.ADMIN:
        return RedirectResponse(url="/app/sunny")
    elif role == UserRole.CLIENT_DEMO:
        return RedirectResponse(url="/app/client_demo")
    elif role == UserRole.TESTER:
        return RedirectResponse(url="/app/test_environment")
    else:
        # Default to Sunny main app
        return RedirectResponse(url="/app/sunny")

@router.get("/available-apps")
async def get_available_apps(current_user: Dict = Depends(get_current_user)):
    """Get list of applications available to current user"""
    
    permissions = await auth_system.get_user_permissions(current_user["email"])
    
    # Define all available apps
    all_apps = {
        "sunny": {
            "name": "Sunny Platform",
            "description": "Main AI consulting platform",
            "url": "/app/sunny",
            "icon": "🌟"
        },
        "navigatorcore": {
            "name": "NavigatorCore",
            "description": "AI development platform",
            "url": "/app/navigatorcore",
            "icon": "🚀"
        },
        "client_demo": {
            "name": "Client Demo",
            "description": "Interactive demo environment",
            "url": "/app/client_demo",
            "icon": "🎯"
        },
        "test_environment": {
            "name": "Test Environment",
            "description": "Testing and debugging tools",
            "url": "/app/test_environment",
            "icon": "🧪"
        },
        "admin_panel": {
            "name": "Admin Panel",
            "description": "System administration",
            "url": "/app/admin_panel",
            "icon": "⚙️"
        }
    }
    
    # Filter apps based on user permissions
    if "*" in permissions["apps"]:
        available_apps = all_apps
    else:
        available_apps = {
            app_id: app_info 
            for app_id, app_info in all_apps.items() 
            if app_id in permissions["apps"]
        }
    
    return {
        "apps": available_apps,
        "default_app": "/dashboard"
    }