@echo off
title JOULET - Starting All Services
color 0A

echo.
echo  ============================================================
echo   JOULET BETA - Full Stack Launcher
echo  ============================================================
echo.

REM ── Kill any leftover node / python processes ──────────────────────────────
echo [1/7] Cleaning up old processes...
taskkill /F /IM node.exe    >nul 2>&1
taskkill /F /IM python.exe  >nul 2>&1
taskkill /F /IM python3.exe >nul 2>&1
timeout /t 2 /nobreak >nul
echo       Done.
echo.

REM ── Window 1: Hardhat Node ────────────────────────────────────────────────
echo [2/7] Starting Hardhat Blockchain Node (window 1)...
start "[ 1 ] HARDHAT - Blockchain Node" cmd /K "color 0B && title [ 1 ] HARDHAT - Blockchain Node && cd /d %~dp0blockchain && echo. && echo  ======================================================== && echo   HARDHAT LOCAL BLOCKCHAIN - PORT 8545 && echo  ======================================================== && echo. && npx hardhat node"
echo       Waiting 6s for node to be ready...
timeout /t 6 /nobreak >nul

REM ── Deploy Contract ───────────────────────────────────────────────────────
echo [3/7] Deploying Smart Contract...
cd /d %~dp0blockchain
call npx hardhat run scripts/deploy.js --network localhost
echo       Contract deployed successfully (Windows UV handle warning is harmless).
echo.

REM ── Window 2: API Bridge ──────────────────────────────────────────────────
echo [4/7] Starting API Bridge  IoT to Blockchain (window 2)...
start "[ 2 ] API BRIDGE - IoT Oracle + ZK Proofs (port 5004)" cmd /K "color 0E && title [ 2 ] API BRIDGE - IoT Oracle + ZK Proofs (port 5004) && cd /d %~dp0iot-simulation && echo. && echo  ======================================================== && echo   API BRIDGE - IoT ^<-^> Blockchain (port 5004) && echo   Watch for: SHA-256 hashes, ZK Batch Proofs, ECDSA sigs && echo  ======================================================== && echo. && python api_bridge.py"
timeout /t 3 /nobreak >nul

REM ── Window 3: Oracle Node (Attack Panel target) ───────────────────────────
echo [5/7] Starting Oracle Node  Attack Validation Target (window 3)...
start "[ 3 ] ORACLE NODE - Validation Node (port 5001)" cmd /K "color 06 && title [ 3 ] ORACLE NODE - Validation Node (port 5001) && cd /d %~dp0iot-simulation && echo. && echo  ======================================================== && echo   ORACLE NODE - 5-Check Validator (port 5001) && echo   Attack Panel submits here: /api/oracle/submit && echo  ======================================================== && echo. && python oracle_node.py --port 5001 --id oracle_1"
timeout /t 2 /nobreak >nul

REM ── Window 4: Consensus Engine ────────────────────────────────────────────
echo [6/7] Starting Consensus Engine  Oracle Validator (window 4)...
start "[ 4 ] CONSENSUS ENGINE - Oracle Network + DDA (port 5010)" cmd /K "color 0D && title [ 4 ] CONSENSUS ENGINE - Oracle Network + DDA (port 5010) && cd /d %~dp0iot-simulation && echo. && echo  ======================================================== && echo   CONSENSUS ENGINE - Reputation-Weighted Voting (port 5010) && echo   Watch for: Oracle votes, Merkle roots, DDA adjustments && echo  ======================================================== && echo. && python consensus_engine.py"
timeout /t 2 /nobreak >nul

REM ── Window 5: Joulet Wallet ───────────────────────────────────────────────
echo [7/7] Starting Joulet Wallet (window 5)...
start "[ 5 ] JOULET WALLET - Frontend (port 5174)" cmd /K "color 03 && title [ 5 ] JOULET WALLET - Frontend (port 5174) && cd /d %~dp0joulet-wallet && echo. && echo  ======================================================== && echo   JOULET WALLET - Vite Dev Server (port 5174) && echo   Open: http://localhost:5174 && echo  ======================================================== && echo. && npm run dev"
timeout /t 2 /nobreak >nul

REM ── Window 6: Landing Page ────────────────────────────────────────────────
start "[ 6 ] LANDING PAGE - Frontend (port 3000)" cmd /K "color 05 && title [ 6 ] LANDING PAGE - Frontend (port 3000) && cd /d %~dp0landing && echo. && echo  ======================================================== && echo   LANDING PAGE - Vite Dev Server (port 3000) && echo   Open: http://localhost:3000 && echo  ======================================================== && echo. && npm run dev"

REM ── Summary ───────────────────────────────────────────────────────────────
echo.
echo  ============================================================
echo   ALL SERVICES LAUNCHED
echo  ============================================================
echo.
echo   [ 1 ] Hardhat Node      ^>  http://localhost:8545
echo   [ 2 ] API Bridge        ^>  http://localhost:5004
echo   [ 3 ] Oracle Node       ^>  http://localhost:5001
echo   [ 4 ] Consensus Engine  ^>  http://localhost:5010
echo   [ 5 ] Joulet Wallet     ^>  http://localhost:5174
echo   [ 6 ] Landing Page      ^>  http://localhost:3000
echo.
echo   Window colours:
echo     Cyan   = Hardhat blockchain
echo     Yellow = API Bridge (IoT + ZK proofs + ECDSA sigs)
echo     Orange = Oracle Node (Attack Panel target)
echo     Magenta= Consensus Engine (Oracle voting + Merkle)
echo     Teal   = Joulet Wallet
echo     Purple = Landing Page
echo.
echo   Press any key to close THIS launcher window.
echo   The 6 service windows will keep running.
echo  ============================================================
pause >nul
