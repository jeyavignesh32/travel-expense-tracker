@echo off
setlocal
cd /d "%~dp0"
echo Installing TravelSense backend dependencies...
call npm install --prefix server
if errorlevel 1 goto failed
echo Installing TravelSense frontend dependencies...
call npm install --prefix client
if errorlevel 1 goto failed
if not exist server\.env copy server\.env.example server\.env
if not exist client\.env copy client\.env.example client\.env
echo.
echo Dependencies installed. Edit server\.env and set MYSQL_PASSWORD and JWT_SECRET.
echo Run database\schema.sql in MySQL, then start backend and frontend in separate CMD windows.
pause
exit /b 0
:failed
echo Installation failed. Check the npm error above and your internet connection.
pause
exit /b 1
