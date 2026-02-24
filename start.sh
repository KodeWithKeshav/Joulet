#!/bin/bash

# Joulet Multi-Component Startup Script
# This script starts all components of the Joulet system automatically

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$SCRIPT_DIR"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_step() {
    echo -e "${BLUE}▶${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# cleanup function to kill background processes on exit
cleanup() {
    echo ""
    print_warning "Stopping all services..."
    # Kill the specific PIDs if they exist
    if [ ! -z "$BLOCKCHAIN_PID" ]; then kill $BLOCKCHAIN_PID 2>/dev/null || true; fi
    if [ ! -z "$API_PID" ]; then kill $API_PID 2>/dev/null || true; fi
    if [ ! -z "$FRONTEND_PID" ]; then kill $FRONTEND_PID 2>/dev/null || true; fi
    if [ ! -z "$WALLET_PID" ]; then kill $WALLET_PID 2>/dev/null || true; fi
    
    # Also generic cleanup just in case
    pkill -f "hardhat node" || true
    pkill -f "api_bridge.py" || true
    pkill -f "vite" || true
    exit 0
}

# Trap SIGINT (Ctrl+C) and call cleanup
trap cleanup SIGINT

echo "================================"
echo "  JOULET STARTUP SCRIPT"
echo "================================"
echo ""

# Kill any old processes
print_step "Cleaning up old processes..."
pkill -f "hardhat node" || true
pkill -f "api_bridge.py" || true
pkill -f "vite" || true
sleep 1
print_success "Old processes cleaned up"
echo ""

# Check prerequisites
print_step "Checking prerequisites..."

if ! command -v node &> /dev/null; then
    print_warning "Node.js not found. Please install Node.js 18+"
    exit 1
fi

if ! command -v python3 &> /dev/null; then
    print_warning "Python3 not found. Please install Python 3.9+"
    exit 1
fi

print_success "Prerequisites found"
echo ""

print_step "Starting all components..."
echo ""

# Start blockchain
print_step "Starting Hardhat blockchain node..."
cd "$PROJECT_ROOT/blockchain"
npx hardhat node > /dev/null 2>&1 &
BLOCKCHAIN_PID=$!
sleep 5 # Give it a bit more time to fully start

# Deploy contract
print_step "Deploying smart contract..."
# We wait for the deploy to finish before moving on, as API/Frontend might need the address
# Assuming deploy updates some shared config or user updates it manually.
# The original script piped to log.
npm run deploy > /tmp/deploy.log 2>&1 &
DEPLOY_PID=$!
wait $DEPLOY_PID
print_success "Smart contract deployed"

# Start API
print_step "Starting API bridge..."
cd "$PROJECT_ROOT/iot-simulation"

if [ ! -d "venv" ]; then
    print_step "Creating Python virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate
pip install -q -r requirements.txt 2>/dev/null || true

python api_bridge.py &
API_PID=$!
sleep 2
print_success "API bridge started on http://localhost:5000"

# Start frontend
print_step "Starting frontend dashboard..."
cd "$PROJECT_ROOT/client"
npm install > /dev/null 2>&1 || true
npm run dev &
FRONTEND_PID=$!
print_success "Frontend starting on http://localhost:5173"

# Start Wallet
print_step "Starting Joulet Wallet..."
cd "$PROJECT_ROOT/joulet-wallet"
npm install > /dev/null 2>&1 || true
npm run dev -- --port 5174 &
WALLET_PID=$!
print_success "Wallet starting on http://localhost:5174"

echo ""
echo "================================"
echo "  ALL COMPONENTS RUNNING"
echo "================================"
echo ""
echo "Blockchain:  http://127.0.0.1:8545"
echo "API Bridge:  http://localhost:5000"
echo "Dashboard:   http://localhost:5173"
echo "Wallet:      http://localhost:5174"
echo ""
print_warning "Press Ctrl+C to stop all services"
echo ""

# Wait for background processes
wait
