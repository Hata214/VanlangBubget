@echo off
echo Removing tracked .md and .cursorrules files from Git...

REM List files that will be removed first
echo.
echo Files to be removed from Git tracking:
git ls-files "*.md" 2>nul
git ls-files "*.cursorrules" 2>nul
git ls-files ".cursor/*" 2>nul

echo.
echo Removing files...

REM Remove specific .md files one by one
for /f "delims=" %%i in ('git ls-files "*.md" 2^>nul') do (
    echo Removing: %%i
    git rm --cached "%%i" 2>nul
)

REM Remove specific .cursorrules files one by one
for /f "delims=" %%i in ('git ls-files "*.cursorrules" 2^>nul') do (
    echo Removing: %%i
    git rm --cached "%%i" 2>nul
)

REM Remove .cursor directory if exists
git rm --cached -r .cursor/ 2>nul

echo.
echo Done! Files removed from Git tracking.
echo.
echo Next steps:
echo 1. git add .gitignore
echo 2. git commit -m "Update .gitignore to exclude .md and .cursorrules files"
echo 3. git push
echo.
pause
