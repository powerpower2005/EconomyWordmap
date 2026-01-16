# Node.js PATH 추가 스크립트
# 이 파일을 우클릭 -> "PowerShell로 실행"

$nodePath = "C:\Program Files\nodejs"
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")

if ($userPath -notlike "*$nodePath*") {
    $newPath = $userPath + ";" + $nodePath
    [Environment]::SetEnvironmentVariable("Path", $newPath, "User")
    Write-Host "✅ Node.js 경로가 사용자 PATH에 추가되었습니다!" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  터미널을 완전히 종료하고 새로 열어주세요." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "새 터미널에서 다음 명령어로 확인:" -ForegroundColor Cyan
    Write-Host "  node --version" -ForegroundColor White
    Write-Host "  npm --version" -ForegroundColor White
} else {
    Write-Host "ℹ️  Node.js 경로가 이미 사용자 PATH에 있습니다." -ForegroundColor Cyan
}

Write-Host ""
Write-Host "아무 키나 누르면 종료됩니다..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
