@echo off
REM Script to kill all running NestJS backend services on Windows
REM This script will terminate all Node.js processes related to the backend

echo 🔍 Searching for running NestJS backend services...

REM Find and kill Node.js processes that are running NestJS
for /f "tokens=2" %%i in ('tasklist /fi "imagename eq node.exe" /fo csv ^| findstr /i "nest"') do (
    echo 📋 Found NestJS process: %%i
    echo 🛑 Terminating process %%i...
    taskkill /pid %%i /f
)

REM Also check for processes on common backend ports
echo.
echo 🔍 Checking for processes on backend ports (3000, 3001, 3002)...

for %%p in (3000 3001 3002) do (
    for /f "tokens=5" %%i in ('netstat -ano ^| findstr :%%p') do (
        if not "%%i"=="0" (
            echo 📋 Found process %%i on port %%p, terminating...
            taskkill /pid %%i /f
        )
    )
)

echo ✅ Backend cleanup complete!
pause
