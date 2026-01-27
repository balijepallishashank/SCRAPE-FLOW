# Refresh TypeScript Language Server
# Run this script if you see type errors that don't exist

Write-Host "`n🔄 Refreshing TypeScript Language Server...`n" -ForegroundColor Cyan

# Clear caches
Write-Host "1. Clearing caches..." -ForegroundColor Yellow
Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "*.tsbuildinfo" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "node_modules/.cache" -Recurse -Force -ErrorAction SilentlyContinue

# Verify TypeScript compilation
Write-Host "`n2. Verifying TypeScript compilation..." -ForegroundColor Yellow
$tscOutput = & npx tsc --noEmit --skipLibCheck 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ TypeScript compilation: NO ERRORS" -ForegroundColor Green
} else {
    Write-Host "   ❌ TypeScript compilation failed:" -ForegroundColor Red
    Write-Host $tscOutput
    exit 1
}

# Configure VS Code
Write-Host "`n3. Configuring VS Code TypeScript..." -ForegroundColor Yellow
$vscodePath = ".vscode"
if (-not (Test-Path $vscodePath)) {
    New-Item -ItemType Directory -Path $vscodePath -Force | Out-Null
}
$settingsPath = "$vscodePath/settings.json"
$settings = @{
    "typescript.tsdk" = "node_modules/typescript/lib"
    "typescript.enablePromptUseWorkspaceTsdk" = $true
} | ConvertTo-Json
Set-Content -Path $settingsPath -Value $settings -Force

Write-Host "`n✅ All caches cleared and TypeScript configured!`n" -ForegroundColor Green
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Press: Ctrl+Shift+P" -ForegroundColor White
Write-Host "   2. Type: TypeScript: Restart TS Server" -ForegroundColor White
Write-Host "   3. Press: Enter" -ForegroundColor White
Write-Host "`n   All type errors will disappear after restart! ✨`n" -ForegroundColor Green
