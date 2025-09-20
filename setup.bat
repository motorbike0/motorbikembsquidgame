@echo off
echo ========================================
echo Squid Game Registration System Setup
echo ========================================
echo.

echo Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed!
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo Recommended version: LTS (18.x or higher)
    echo.
    echo After installation, run this setup again.
    pause
    exit /b 1
)

echo ✅ Node.js is installed: %node --version%
echo.

echo Checking npm installation...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not available!
    echo Please ensure Node.js was installed correctly.
    pause
    exit /b 1
)

echo ✅ npm is available: %npm --version%
echo.

echo Installing dependencies...
npm install

if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies!
    echo Please check your internet connection and try again.
    pause
    exit /b 1
)

echo ✅ Dependencies installed successfully!
echo.

echo Setting up environment...
if not exist .env (
    echo Creating .env file from template...
    copy .env .env.local
    echo.
    echo ⚠️  Please edit the .env file with your configuration:
    echo    - Set your ADMIN_TOKEN (change from default)
    echo    - Add your DISCORD_WEBHOOK_URL if you want notifications
    echo.
)

echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo To start the server:
echo   npm start          (production mode)
echo   npm run dev        (development mode with auto-reload)
echo.
echo Server will run on: http://localhost:3000
echo.
echo API Endpoints:
echo   GET  /api/health                    - Health check
echo   POST /api/register                  - Registration
echo   GET  /api/admin/registrations       - Admin panel (requires token)
echo.
pause
