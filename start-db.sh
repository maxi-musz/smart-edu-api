#!/bin/bash
# $ chmod +x start-db.sh
echo "🔄 Starting PostgreSQL 17..."

# Try to start PostgreSQL
brew services restart postgresql@17

# Wait a moment
sleep 2

# Test connection
echo "🧪 Testing connection..."
if /usr/local/opt/postgresql@17/bin/psql -h localhost -p 5432 -U macbook -d latest_smart_edu -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ PostgreSQL 17 is running successfully!"
    echo "✅ Database 'latest_smart_edu' is accessible"
else
    echo "❌ Connection failed. Trying to fix..."
    
    # Kill any stale processes
    echo "🔧 Cleaning up stale processes..."
    killall postgres 2>/dev/null || true
    
    # Remove lock file
    rm -f /usr/local/var/postgresql@17/postmaster.pid
    
    # Start again
    brew services start postgresql@17
    sleep 3
    
    # Test again
    if /usr/local/opt/postgresql@17/bin/psql -h localhost -p 5432 -U macbook -d latest_smart_edu -c "SELECT 1;" > /dev/null 2>&1; then
        echo "✅ Fixed! PostgreSQL 17 is now running!"
    else
        echo "❌ Still having issues. Check logs: tail /usr/local/var/log/postgresql@17.log"
    fi
fi
