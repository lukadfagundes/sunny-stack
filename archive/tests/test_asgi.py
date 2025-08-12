import sys
sys.path.insert(0, 'backend')

from app.main import asgi_app

print(f"ASGI app type: {type(asgi_app)}")
print(f"ASGI app: {asgi_app}")

# Check if it's a SocketIO ASGI app
import socketio
if isinstance(asgi_app, socketio.ASGIApp):
    print("✅ Socket.IO ASGI app detected")
    print(f"Socket.IO server: {asgi_app.socketio_server}")
else:
    print("❌ Not a Socket.IO ASGI app")