$ErrorActionPreference = "Stop"

Set-Location -LiteralPath $PSScriptRoot
$env:ELECTRON_RUN_AS_NODE = $null

function Assert-LastExitCode {
  param([string]$StepName)

  if ($LASTEXITCODE -ne 0) {
    throw "$StepName 실패: 종료 코드 $LASTEXITCODE"
  }
}

function New-IcoFromPng {
  param(
    [Parameter(Mandatory = $true)][string]$PngPath,
    [Parameter(Mandatory = $true)][string]$IcoPath
  )

  Add-Type -AssemblyName System.Drawing

  $sizes = @(256, 128, 64, 48, 32, 16)
  $source = [System.Drawing.Bitmap]::new($PngPath)
  $entries = New-Object System.Collections.Generic.List[object]

  try {
    foreach ($size in $sizes) {
      $canvas = [System.Drawing.Bitmap]::new($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
      $graphics = [System.Drawing.Graphics]::FromImage($canvas)

      try {
        $graphics.Clear([System.Drawing.Color]::Transparent)
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

        $scale = [Math]::Min($size / $source.Width, $size / $source.Height)
        $drawWidth = [Math]::Round($source.Width * $scale)
        $drawHeight = [Math]::Round($source.Height * $scale)
        $drawX = [Math]::Round(($size - $drawWidth) / 2)
        $drawY = [Math]::Round(($size - $drawHeight) / 2)

        $graphics.DrawImage($source, $drawX, $drawY, $drawWidth, $drawHeight)

        $stream = [System.IO.MemoryStream]::new()
        $canvas.Save($stream, [System.Drawing.Imaging.ImageFormat]::Png)
        $entries.Add([PSCustomObject]@{
          Size = $size
          Bytes = $stream.ToArray()
        })
        $stream.Dispose()
      }
      finally {
        $graphics.Dispose()
        $canvas.Dispose()
      }
    }
  }
  finally {
    $source.Dispose()
  }

  $file = [System.IO.File]::Create($IcoPath)
  $writer = [System.IO.BinaryWriter]::new($file)

  try {
    $writer.Write([UInt16]0)
    $writer.Write([UInt16]1)
    $writer.Write([UInt16]$entries.Count)

    $offset = 6 + (16 * $entries.Count)

    foreach ($entry in $entries) {
      $writer.Write([Byte]($(if ($entry.Size -eq 256) { 0 } else { $entry.Size })))
      $writer.Write([Byte]($(if ($entry.Size -eq 256) { 0 } else { $entry.Size })))
      $writer.Write([Byte]0)
      $writer.Write([Byte]0)
      $writer.Write([UInt16]1)
      $writer.Write([UInt16]32)
      $writer.Write([UInt32]$entry.Bytes.Length)
      $writer.Write([UInt32]$offset)
      $offset += $entry.Bytes.Length
    }

    foreach ($entry in $entries) {
      $writer.Write([Byte[]]$entry.Bytes)
    }
  }
  finally {
    $writer.Dispose()
    $file.Dispose()
  }
}

Write-Host "1/3 React 앱 빌드 중..."
npm run build
Assert-LastExitCode "npm run build"

$stagePath = Join-Path $PSScriptRoot "build\electron-app"
$stageDesktopPath = Join-Path $stagePath "desktop"
$stageAssetsPath = Join-Path $stagePath "assets"
$outputPath = Join-Path $PSScriptRoot "release"
$packagedPath = Join-Path $outputPath "AngryJ-win32-x64"
$logoSourcePath = Join-Path $PSScriptRoot "src\assets\angryJ logo.png"
$stageLogoPath = Join-Path $stageAssetsPath "angryJ-logo.png"
$stageIconPath = Join-Path $stageAssetsPath "angryJ-logo.ico"

Write-Host "2/3 Electron 앱 스테이징 중..."
Remove-Item -LiteralPath $stagePath -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path $stageDesktopPath | Out-Null
New-Item -ItemType Directory -Force -Path $stageAssetsPath | Out-Null
Copy-Item -LiteralPath "dist" -Destination (Join-Path $stagePath "dist") -Recurse -Force
Copy-Item -LiteralPath "desktop\electron-main.cjs" -Destination (Join-Path $stageDesktopPath "electron-main.cjs") -Force
Copy-Item -LiteralPath $logoSourcePath -Destination $stageLogoPath -Force
New-IcoFromPng -PngPath $logoSourcePath -IcoPath $stageIconPath

$stagePackageJson = @'
{
  "name": "angry-j-desktop",
  "version": "0.1.0",
  "main": "desktop/electron-main.cjs"
}
'@
[System.IO.File]::WriteAllText(
  (Join-Path $stagePath "package.json"),
  $stagePackageJson,
  [System.Text.UTF8Encoding]::new($false)
)

Write-Host "3/3 Windows 실행 폴더 생성 중..."
Remove-Item -LiteralPath $packagedPath -Recurse -Force -ErrorAction SilentlyContinue
$electronVersion = node -p "require('electron/package.json').version"
npx @electron/packager $stagePath AngryJ `
  --platform=win32 `
  --arch=x64 `
  --out=$outputPath `
  --overwrite `
  --asar `
  --icon="$stageIconPath" `
  --electron-version=$electronVersion
Assert-LastExitCode "Electron Packager"

Write-Host ""
Write-Host "완료: release\AngryJ-win32-x64\AngryJ.exe"
Write-Host "이 폴더 전체를 유지한 상태로 AngryJ.exe를 실행하세요."
