@echo off
echo ==============================================
echo       UPDATING DOCKER APP - SWD FE
echo ==============================================

echo.
echo [1/3] Building new image...
docker build -t swd-fe-app .
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Build failed! Please check your code.
    pause
    exit /b %errorlevel%
)

echo.
echo [2/3] Removing old container...
:: 2>nul hides the error if the container doesn't exist
docker rm -f swd-fe-container 2>nul

echo.
echo [3/3] Starting new container...
docker run -d -p 80:80 --name swd-fe-container swd-fe-app

echo.
echo ==============================================
echo [SUCCESS] App Updated! Visit: http://localhost
echo ==============================================
echo.
pause
