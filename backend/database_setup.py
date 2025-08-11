#!/usr/bin/env python
"""
Database Setup Script for Sunny Platform
DEBUG DB: PostgreSQL and Redis configuration
"""

import os
import sys
from datetime import datetime

def debug_log(category, message, **kwargs):
    """Security-safe debug logging"""
    timestamp = datetime.now().strftime("%H:%M:%S")
    metrics = ", ".join([f"{k}: {v}" for k, v in kwargs.items()])
    print(f"DEBUG {category}: {message} - {metrics} [{timestamp}]")

def check_postgresql():
    """Check if PostgreSQL is available"""
    debug_log("DB", "Checking PostgreSQL availability", status="CHECKING")
    
    try:
        import psycopg2
        debug_log("DB", "psycopg2 module available", status="SUCCESS")
        return True
    except ImportError:
        debug_log("DB", "psycopg2 not installed", status="WARNING")
        print("\n⚠️  PostgreSQL driver not installed.")
        print("   Run: pip install psycopg2-binary")
        return False

def check_redis():
    """Check if Redis is available"""
    debug_log("DB", "Checking Redis availability", status="CHECKING")
    
    try:
        import redis
        debug_log("DB", "Redis module available", status="SUCCESS")
        return True
    except ImportError:
        debug_log("DB", "Redis not installed", status="WARNING")
        print("\n⚠️  Redis driver not installed.")
        print("   Run: pip install redis")
        return False

def create_database_init_sql():
    """Create SQL initialization script"""
    debug_log("DB", "Creating database initialization script", file="init_db.sql")
    
    sql_content = """-- Sunny Platform Database Initialization
-- DEBUG DB: PostgreSQL setup script

-- Create database if not exists
-- Run as postgres superuser:
-- CREATE DATABASE sunny_db;
-- CREATE USER sunny WITH PASSWORD 'sunny123';
-- GRANT ALL PRIVILEGES ON DATABASE sunny_db TO sunny;

-- Connect to sunny_db before running the rest

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    client VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    progress INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    commits INTEGER DEFAULT 0,
    files INTEGER DEFAULT 0,
    duration VARCHAR(50) DEFAULT '0h'
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    duration VARCHAR(50),
    metrics JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Claude interactions table
CREATE TABLE IF NOT EXISTS claude_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id),
    type VARCHAR(50) NOT NULL, -- 'chat' or 'code'
    prompt TEXT,
    response TEXT,
    artifacts JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Proposals table
CREATE TABLE IF NOT EXISTS proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client VARCHAR(255) NOT NULL,
    project_name VARCHAR(255) NOT NULL,
    content JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP
);

-- Analytics table
CREATE TABLE IF NOT EXISTS analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_type VARCHAR(100) NOT NULL,
    metric_value JSONB NOT NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_sessions_project ON sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_claude_session ON claude_interactions(session_id);
CREATE INDEX IF NOT EXISTS idx_proposals_client ON proposals(client);

-- Sample data (optional)
-- INSERT INTO projects (name, client, description, status) 
-- VALUES ('NavigatorCore Migration', 'Internal - First Client', 'Migrating NavigatorCore to modern stack', 'active');

COMMENT ON TABLE projects IS 'DEBUG DB: Main projects tracking table';
COMMENT ON TABLE sessions IS 'DEBUG DB: Development session tracking';
COMMENT ON TABLE claude_interactions IS 'DEBUG DB: Claude API interaction history';
"""
    
    with open("backend/init_db.sql", "w") as f:
        f.write(sql_content)
    
    debug_log("DB", "SQL script created", lines=sql_content.count('\n'), tables=5)
    return True

def create_test_connection_script():
    """Create database connection test script"""
    debug_log("DB", "Creating connection test script", file="test_db_connection.py")
    
    test_script = '''#!/usr/bin/env python
"""Test database connections for Sunny Platform"""

import os
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

def debug_log(category, message, **kwargs):
    timestamp = datetime.now().strftime("%H:%M:%S")
    metrics = ", ".join([f"{k}: {v}" for k, v in kwargs.items()])
    print(f"DEBUG {category}: {message} - {metrics} [{timestamp}]")

def test_postgresql():
    """Test PostgreSQL connection"""
    debug_log("TEST", "Testing PostgreSQL connection", status="STARTING")
    
    try:
        import psycopg2
        from psycopg2 import sql
        
        # Get connection string from environment
        db_url = os.getenv("DATABASE_URL", "postgresql://sunny:sunny123@localhost:5432/sunny_db")
        
        # Parse connection string (security-safe logging)
        parts = db_url.split("@")
        if len(parts) > 1:
            host_part = parts[1]
            debug_log("DB", "Connecting to PostgreSQL", host=host_part.split("/")[0], database=host_part.split("/")[-1])
        
        conn = psycopg2.connect(db_url)
        cursor = conn.cursor()
        
        # Test query
        cursor.execute("SELECT version();")
        version = cursor.fetchone()
        debug_log("DB", "PostgreSQL connected", status="SUCCESS", version_info="AVAILABLE")
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        debug_log("ERROR", f"PostgreSQL connection failed", error_type=type(e).__name__)
        return False

def test_redis():
    """Test Redis connection"""
    debug_log("TEST", "Testing Redis connection", status="STARTING")
    
    try:
        import redis
        
        # Get connection string from environment
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        
        # Parse for logging (security-safe)
        parts = redis_url.replace("redis://", "").split(":")
        host = parts[0] if parts else "unknown"
        debug_log("DB", "Connecting to Redis", host=host)
        
        r = redis.from_url(redis_url)
        
        # Test connection
        r.ping()
        debug_log("DB", "Redis connected", status="SUCCESS")
        
        # Test set/get
        r.set("sunny_test", "working")
        value = r.get("sunny_test")
        r.delete("sunny_test")
        
        debug_log("DB", "Redis operations tested", status="SUCCESS", test_result="PASSED")
        return True
        
    except Exception as e:
        debug_log("ERROR", f"Redis connection failed", error_type=type(e).__name__)
        return False

if __name__ == "__main__":
    print("\\n🔍 Sunny Platform - Database Connection Test\\n")
    
    postgresql_ok = test_postgresql()
    redis_ok = test_redis()
    
    print("\\n📊 Results:")
    print(f"   PostgreSQL: {'✅ Connected' if postgresql_ok else '❌ Failed'}")
    print(f"   Redis:      {'✅ Connected' if redis_ok else '❌ Failed'}")
    
    if postgresql_ok and redis_ok:
        print("\\n✅ All database connections successful!")
    else:
        print("\\n⚠️  Some connections failed. Check your configuration.")
'''
    
    with open("backend/test_db_connection.py", "w") as f:
        f.write(test_script)
    
    debug_log("DB", "Test script created", file="test_db_connection.py", lines=test_script.count('\n'))
    return True

def main():
    print("\n🚀 Sunny Platform - Database Setup\n")
    print("DEBUG SETUP: Starting database configuration\n")
    
    # Check dependencies
    postgresql_available = check_postgresql()
    redis_available = check_redis()
    
    # Create initialization scripts
    create_database_init_sql()
    create_test_connection_script()
    
    print("\n📁 Created files:")
    print("   - backend/init_db.sql (PostgreSQL initialization)")
    print("   - backend/test_db_connection.py (Connection tester)")
    
    print("\n📋 Next steps:")
    
    if not postgresql_available:
        print("\n1. Install PostgreSQL:")
        print("   - Download from: https://www.postgresql.org/download/windows/")
        print("   - Or use Docker: docker run -p 5432:5432 -e POSTGRES_PASSWORD=sunny123 postgres")
        
    if not redis_available:
        print("\n2. Install Redis:")
        print("   - Download from: https://github.com/microsoftarchive/redis/releases")
        print("   - Or use Docker: docker run -p 6379:6379 redis")
    
    print("\n3. Create database and user:")
    print("   psql -U postgres")
    print("   CREATE DATABASE sunny_db;")
    print("   CREATE USER sunny WITH PASSWORD 'sunny123';")
    print("   GRANT ALL PRIVILEGES ON DATABASE sunny_db TO sunny;")
    
    print("\n4. Run initialization script:")
    print("   psql -U sunny -d sunny_db -f backend/init_db.sql")
    
    print("\n5. Test connections:")
    print("   python backend/test_db_connection.py")
    
    debug_log("SETUP", "Database setup script completed", status="SUCCESS")

if __name__ == "__main__":
    main()