@echo off
REM Joulet Multi-Component Startup Script for Windows

setlocal enabledelayedexpansion

set SCRIPT_DIR=%~dp0
set PROJECT_ROOT=%SCRIPT_DIR%

cls
echo ================================
echo   JOULET STARTUP SCRIPT
echo ================================
echo.

REM Check prerequisites
echo Checking prerequisites...

where node >nul 2>nul
if errorlevel 1 (
    echo WARNING: Node.js not found. Please install Node.js 18+
    exit /b 1
)

where python >nul 2>nul
if errorlevel 1 (
    echo WARNING: Python not found. Please install Python 3.9+
    exit /b 1
)

echo Prerequisites found
echo.

echo What would you like to start?
echo 1) All components (blockchain + API + frontend)
echo 2) Only blockchain (Hardhat node)
echo 3) Only API bridge
echo 4) Only frontend
echo.

set /p choice="Enter choice (1-4): "

if "%choice%"=="1" (
    echo.
    echo Starting all components...
    echo.
    
    echo Starting Hardhat blockchain node...
    cd "%PROJECT_ROOT%blockchain"
    start "Hardhat Node" npx hardhat node
    timeout /t 3
    
    echo Deploying smart contract...
    call npm run deploy
    
    echo Starting API bridge...
    cd "%PROJECT_ROOT%iot-simulation"
    
    if not exist "venv" (
        echo Creating Python virtual environment...
        python -m venv venv
    )
    
    call venv\Scripts\activate.bat
    pip install -q -r requirements.txt
    start "API Bridge" python api_bridge.py
    timeout /t 2
    
    echo Starting frontend dashboard...
    cd "%PROJECT_ROOT%client"
    call npm install
    start "Frontend" npm run dev
    
    echo.
    echo ================================
    echo   ALL COMPONENTS RUNNING
    echo ================================
    echo.
    echo Blockchain:  http://127.0.0.1:8545
    echo API Bridge:  http://localhost:5000
    echo Dashboard:   http://localhost:5173
    echo.
    echo Close any terminal window to stop services
    echo.
    
) else if "%choice%"=="2" (
    echo.
    echo Starting Hardhat blockchain node...
    cd "%PROJECT_ROOT%blockchain"
    call npm install
    echo.
    npx hardhat node
    
) else if "%choice%"=="3" (
    echo.
    echo Starting API bridge...
    cd "%PROJECT_ROOT%iot-simulation"
    
    if not exist "venv" (
        echo Creating Python virtual environment...
        python -m venv venv
    )
    
    call venv\Scripts\activate.bat
    pip install -q -r requirements.txt
    
    echo.
    echo Make sure blockchain and contract are deployed first!
    echo Update .env with correct CONTRACT_ADDRESS
    echo.
    python api_bridge.py
    
) else if "%choice%"=="4" (
    echo.
    echo Starting frontend dashboard...
    cd "%PROJECT_ROOT%client"
    call npm install
    
    echo.
    echo Make sure blockchain and API are running first!
    echo Update .env with correct VITE_CONTRACT_ADDRESS and VITE_API_URL
    echo.
    call npm run dev
    
) else (
    echo Invalid choice. Exiting.
    exit /b 1
)
