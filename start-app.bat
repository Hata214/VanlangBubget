@echo off
echo Starting VanLang Budget Application...
echo.

echo Starting Backend on port 4000...
start cmd /k "cd vanlang-budget-BE && npm run dev"

echo.
echo Waiting for backend to start...
timeout /t 5 /nobreak > nul

echo.
echo Starting Frontend on port 3000...
start cmd /k "cd vanlang-budget-FE && npm run dev:with-api"

echo.
echo Application started!
echo - Backend: http://localhost:4000
echo - Frontend: http://localhost:3000
echo - Admin Login: http://localhost:3000/admin/login
echo.
echo Press any key to exit this window...
pause > nul
