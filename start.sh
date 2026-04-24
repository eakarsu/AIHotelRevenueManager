#!/bin/bash

# ============================================================
# AI Hotel Revenue Manager - Start Script
# ============================================================
# This script:
#   1. Kills any processes on ports 3000 and 4000
#   2. Checks/creates PostgreSQL database
#   3. Installs dependencies
#   4. Seeds the database with sample data
#   5. Starts backend (with nodemon for auto-reload) and frontend
# ============================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_PORT=4000
FRONTEND_PORT=3000

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║       🏨 AI Hotel Revenue Manager                   ║${NC}"
echo -e "${CYAN}║       Starting Application...                       ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""

# ============================================================
# Step 1: Clean up used ports
# ============================================================
echo -e "${YELLOW}[1/6] Cleaning up ports ${BACKEND_PORT} and ${FRONTEND_PORT}...${NC}"

cleanup_port() {
  local port=$1
  local pids=$(lsof -ti :$port 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo -e "  ${RED}Killing processes on port $port: $pids${NC}"
    echo "$pids" | xargs kill -9 2>/dev/null || true
    sleep 1
  else
    echo -e "  ${GREEN}Port $port is free${NC}"
  fi
}

cleanup_port $BACKEND_PORT
cleanup_port $FRONTEND_PORT
echo ""

# ============================================================
# Step 2: Check for .env file
# ============================================================
echo -e "${YELLOW}[2/6] Checking environment configuration...${NC}"

if [ ! -f "$PROJECT_DIR/.env" ]; then
  echo -e "  ${RED}ERROR: .env file not found!${NC}"
  echo -e "  ${RED}Please create a .env file in the project root.${NC}"
  exit 1
fi

echo -e "  ${GREEN}.env file found${NC}"
echo ""

# ============================================================
# Step 3: Check PostgreSQL and create database
# ============================================================
echo -e "${YELLOW}[3/6] Setting up PostgreSQL database...${NC}"

# Extract database name from DATABASE_URL
DB_URL=$(grep DATABASE_URL "$PROJECT_DIR/.env" | cut -d '=' -f2-)
DB_NAME=$(echo "$DB_URL" | sed 's/.*\///')

# Check if PostgreSQL is running
if command -v pg_isready &> /dev/null; then
  if pg_isready -q 2>/dev/null; then
    echo -e "  ${GREEN}PostgreSQL is running${NC}"
  else
    echo -e "  ${YELLOW}Starting PostgreSQL...${NC}"
    if command -v brew &> /dev/null; then
      brew services start postgresql@14 2>/dev/null || brew services start postgresql 2>/dev/null || true
    fi
    sleep 2
  fi
fi

# Create database if it doesn't exist
if command -v createdb &> /dev/null; then
  createdb "$DB_NAME" 2>/dev/null && echo -e "  ${GREEN}Database '$DB_NAME' created${NC}" || echo -e "  ${GREEN}Database '$DB_NAME' already exists${NC}"
else
  echo -e "  ${YELLOW}createdb not found - assuming database exists${NC}"
fi
echo ""

# ============================================================
# Step 4: Install dependencies
# ============================================================
echo -e "${YELLOW}[4/6] Installing dependencies...${NC}"

echo -e "  ${BLUE}Installing server dependencies...${NC}"
cd "$PROJECT_DIR/server"
npm install --silent 2>&1 | tail -1
echo -e "  ${GREEN}Server dependencies installed${NC}"

echo -e "  ${BLUE}Installing client dependencies...${NC}"
cd "$PROJECT_DIR/client"
npm install --silent 2>&1 | tail -1
echo -e "  ${GREEN}Client dependencies installed${NC}"
echo ""

# ============================================================
# Step 5: Seed database
# ============================================================
echo -e "${YELLOW}[5/6] Seeding database with sample data...${NC}"

cd "$PROJECT_DIR/server"
node seed.js
echo -e "  ${GREEN}Database seeded successfully${NC}"
echo ""

# ============================================================
# Step 6: Start servers with hot reload
# ============================================================
echo -e "${YELLOW}[6/6] Starting servers...${NC}"
echo ""

# Trap to cleanup background processes on exit
cleanup() {
  echo ""
  echo -e "${YELLOW}Shutting down servers...${NC}"
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
  wait $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
  echo -e "${GREEN}Servers stopped.${NC}"
  exit 0
}
trap cleanup SIGINT SIGTERM

# Start backend with nodemon (auto-reload on code changes)
cd "$PROJECT_DIR/server"
echo -e "  ${BLUE}Starting backend on port ${BACKEND_PORT} (with nodemon hot-reload)...${NC}"
npx nodemon index.js &
BACKEND_PID=$!

# Wait for backend to be ready
sleep 2

# Start frontend with Vite (built-in hot reload / HMR)
cd "$PROJECT_DIR/client"
echo -e "  ${BLUE}Starting frontend on port ${FRONTEND_PORT} (with Vite HMR)...${NC}"
npx vite --port $FRONTEND_PORT &
FRONTEND_PID=$!

sleep 3

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  🏨 AI Hotel Revenue Manager is running!            ║${NC}"
echo -e "${CYAN}║                                                      ║${NC}"
echo -e "${CYAN}║  Frontend:  http://localhost:${FRONTEND_PORT}                    ║${NC}"
echo -e "${CYAN}║  Backend:   http://localhost:${BACKEND_PORT}                    ║${NC}"
echo -e "${CYAN}║                                                      ║${NC}"
echo -e "${CYAN}║  Login: admin@hotel.com / password123                ║${NC}"
echo -e "${CYAN}║                                                      ║${NC}"
echo -e "${CYAN}║  Both servers auto-reload on code changes            ║${NC}"
echo -e "${CYAN}║  Press Ctrl+C to stop                                ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""

# Wait for background processes
wait
