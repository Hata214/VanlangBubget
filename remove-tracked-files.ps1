# PowerShell script to remove tracked .md and .cursorrules files from Git
Write-Host "Removing tracked .md and .cursorrules files from Git..." -ForegroundColor Yellow

# Function to safely remove files from Git tracking
function Remove-GitTracked {
    param($Pattern)
    try {
        $files = git ls-files $Pattern 2>$null
        if ($files) {
            Write-Host "Removing from Git tracking: $Pattern" -ForegroundColor Green
            git rm --cached $Pattern 2>$null
        }
    }
    catch {
        Write-Host "No files found for pattern: $Pattern" -ForegroundColor Gray
    }
}

# Remove .md files
Write-Host "`nRemoving .md files..." -ForegroundColor Cyan
Remove-GitTracked "*.md"
Remove-GitTracked "**/*.md"
Remove-GitTracked "vanlang-budget-BE/*.md"
Remove-GitTracked "vanlang-budget-FE/*.md"
Remove-GitTracked "stock-api/*.md"

# Remove .cursorrules files
Write-Host "`nRemoving .cursorrules files..." -ForegroundColor Cyan
Remove-GitTracked "*.cursorrules"
Remove-GitTracked "**/*.cursorrules"
Remove-GitTracked ".cursor/rules/*.cursorrules"
Remove-GitTracked "vanlang-budget-BE/.cursorrules"
Remove-GitTracked "vanlang-budget-FE/.cursorrules"

# Remove .cursor directory
Write-Host "`nRemoving .cursor directory..." -ForegroundColor Cyan
try {
    git rm --cached -r .cursor/ 2>$null
    Write-Host ".cursor directory removed from tracking" -ForegroundColor Green
}
catch {
    Write-Host ".cursor directory not tracked" -ForegroundColor Gray
}

Write-Host "`nDone! Files removed from Git tracking." -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. git add .gitignore" -ForegroundColor White
Write-Host "2. git commit -m 'Update .gitignore to exclude .md and .cursorrules files'" -ForegroundColor White
Write-Host "3. git push" -ForegroundColor White

Read-Host "`nPress Enter to continue..."
