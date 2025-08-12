import socketio
import asyncio

# Create a Socket.IO client
sio = socketio.Client()

@sio.event
def connect():
    print('✅ Connected to server')

@sio.event
def disconnect():
    print('❌ Disconnected from server')

@sio.event
def connection_status(data):
    print(f'📡 Connection status: {data}')

def test_connection():
    try:
        print('Attempting to connect to http://localhost:8000...')
        sio.connect('http://localhost:8000', transports=['polling', 'websocket'])
        print('Connection attempt made')
        # Wait a bit
        sio.sleep(2)
        # Send a ping
        sio.emit('ping', {'test': 'data'})
        sio.sleep(1)
        sio.disconnect()
    except Exception as e:
        print(f'Error: {e}')

if __name__ == '__main__':
    test_connection()