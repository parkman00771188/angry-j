$ErrorActionPreference = "Stop"

Set-Location -LiteralPath $PSScriptRoot

function Assert-LastExitCode {
  param([string]$StepName)

  if ($LASTEXITCODE -ne 0) {
    throw "$StepName 실패: 종료 코드 $LASTEXITCODE"
  }
}

Write-Host "1/3 React 앱 빌드 중..."
npm install
Assert-LastExitCode "npm install"
npm run build
Assert-LastExitCode "npm run build"

Write-Host "2/3 PyInstaller 준비 중..."
python -m pip install --upgrade pip
Assert-LastExitCode "pip upgrade"
python -m pip install -r requirements-exe.txt
Assert-LastExitCode "pip install"

$webDistPath = (Resolve-Path -LiteralPath "dist").Path
$launcherPath = (Resolve-Path -LiteralPath "desktop\angerj_launcher.py").Path
$addData = "$webDistPath;dist"

Write-Host "3/3 Windows 실행 파일 생성 중..."
python -m PyInstaller `
  --noconfirm `
  --clean `
  --onefile `
  --windowed `
  --name "AngryJ" `
  --distpath "release" `
  --workpath "build\pyinstaller" `
  --specpath "build" `
  --add-data $addData `
  --collect-submodules "webview" `
  --collect-data "webview" `
  $launcherPath
Assert-LastExitCode "PyInstaller"

Write-Host ""
Write-Host "완료: release\AngryJ.exe"
Write-Host "실행 후 같은 네트워크에서는 앱 상단의 LAN 주소로 접속할 수 있습니다."
