#!/bin/bash

# Start backend in background
cd /app/backend
PORT=3001 npm run start:prod &
BACKEND_PID=$!

# Wait a bit for backend to start
sleep 5

# Start frontend (Next.js) on port 3002
cd /app/frontend
PORT=3002 npm run start &
FRONTEND_PID=$!

# Wait a bit for frontend to start
sleep 5

# Start nginx
nginx

# Keep container running
wait
