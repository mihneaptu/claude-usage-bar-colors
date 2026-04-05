Add-Type -AssemblyName System.Drawing

$repoRoot = Split-Path -Parent $PSScriptRoot
$storeAssetsDir = Join-Path $repoRoot 'store-assets'
$screenshotsDir = Join-Path $repoRoot 'screenshots'
$iconsDir = Join-Path $repoRoot 'icons'

New-Item -ItemType Directory -Force -Path $storeAssetsDir | Out-Null

function Set-GraphicsQuality {
  param([System.Drawing.Graphics]$Graphics)

  $Graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $Graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $Graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $Graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $Graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
}

function New-Canvas {
  param(
    [int]$Width,
    [int]$Height,
    [string]$BackgroundHex
  )

  $bitmap = New-Object System.Drawing.Bitmap $Width, $Height
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  Set-GraphicsQuality -Graphics $graphics
  $graphics.Clear([System.Drawing.ColorTranslator]::FromHtml($BackgroundHex))

  [pscustomobject]@{
    Bitmap = $bitmap
    Graphics = $graphics
  }
}

function Draw-ImageContain {
  param(
    [System.Drawing.Graphics]$Graphics,
    [System.Drawing.Image]$Image,
    [int]$X,
    [int]$Y,
    [int]$Width,
    [int]$Height
  )

  $scale = [Math]::Min($Width / $Image.Width, $Height / $Image.Height)
  $drawWidth = [int][Math]::Round($Image.Width * $scale)
  $drawHeight = [int][Math]::Round($Image.Height * $scale)
  $drawX = $X + [int](($Width - $drawWidth) / 2)
  $drawY = $Y + [int](($Height - $drawHeight) / 2)

  $Graphics.DrawImage($Image, $drawX, $drawY, $drawWidth, $drawHeight)
}

function Draw-ImageCover {
  param(
    [System.Drawing.Graphics]$Graphics,
    [System.Drawing.Image]$Image,
    [int]$X,
    [int]$Y,
    [int]$Width,
    [int]$Height
  )

  $scale = [Math]::Max($Width / $Image.Width, $Height / $Image.Height)
  $sourceWidth = [int][Math]::Round($Width / $scale)
  $sourceHeight = [int][Math]::Round($Height / $scale)
  $sourceX = [int](($Image.Width - $sourceWidth) / 2)
  $sourceY = [int](($Image.Height - $sourceHeight) / 2)

  $destRect = New-Object System.Drawing.Rectangle $X, $Y, $Width, $Height
  $sourceRect = New-Object System.Drawing.Rectangle $sourceX, $sourceY, $sourceWidth, $sourceHeight

  $Graphics.DrawImage($Image, $destRect, $sourceRect, [System.Drawing.GraphicsUnit]::Pixel)
}

function Fill-Rect {
  param(
    [System.Drawing.Graphics]$Graphics,
    [string]$ColorHex,
    [int]$X,
    [int]$Y,
    [int]$Width,
    [int]$Height
  )

  $brush = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml($ColorHex))
  $Graphics.FillRectangle($brush, $X, $Y, $Width, $Height)
  $brush.Dispose()
}

function Draw-Text {
  param(
    [System.Drawing.Graphics]$Graphics,
    [string]$Text,
    [string]$FontFamily,
    [float]$FontSize,
    [System.Drawing.FontStyle]$FontStyle,
    [string]$ColorHex,
    [float]$X,
    [float]$Y
  )

  $font = New-Object System.Drawing.Font($FontFamily, $FontSize, $FontStyle, [System.Drawing.GraphicsUnit]::Pixel)
  $brush = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml($ColorHex))
  $Graphics.DrawString($Text, $font, $brush, $X, $Y)
  $brush.Dispose()
  $font.Dispose()
}

function Save-Png {
  param(
    [System.Drawing.Bitmap]$Bitmap,
    [string]$Path
  )

  $Bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
}

$icon = [System.Drawing.Image]::FromFile((Join-Path $iconsDir 'icon128.png'))
$popup = [System.Drawing.Image]::FromFile((Join-Path $screenshotsDir 'preview.png'))
$page = [System.Drawing.Image]::FromFile((Join-Path $screenshotsDir 'calude-usage-page.png'))

try {
  $logoCanvas = New-Canvas -Width 300 -Height 300 -BackgroundHex '#262624'
  Draw-ImageContain -Graphics $logoCanvas.Graphics -Image $icon -X 36 -Y 36 -Width 228 -Height 228
  Save-Png -Bitmap $logoCanvas.Bitmap -Path (Join-Path $storeAssetsDir 'edge-logo-300.png')
  $logoCanvas.Graphics.Dispose()
  $logoCanvas.Bitmap.Dispose()

  $smallTile = New-Canvas -Width 440 -Height 280 -BackgroundHex '#262624'
  Fill-Rect -Graphics $smallTile.Graphics -ColorHex '#30302e' -X 0 -Y 204 -Width 440 -Height 76
  Draw-ImageContain -Graphics $smallTile.Graphics -Image $icon -X 32 -Y 36 -Width 78 -Height 78
  Draw-Text -Graphics $smallTile.Graphics -Text 'Claude Usage' -FontFamily 'Segoe UI' -FontSize 30 -FontStyle ([System.Drawing.FontStyle]::Bold) -ColorHex '#faf9f5' -X 132 -Y 44
  Draw-Text -Graphics $smallTile.Graphics -Text 'Bar Colors' -FontFamily 'Segoe UI' -FontSize 30 -FontStyle ([System.Drawing.FontStyle]::Bold) -ColorHex '#faf9f5' -X 132 -Y 82
  Draw-Text -Graphics $smallTile.Graphics -Text 'See Claude limits faster' -FontFamily 'Segoe UI' -FontSize 18 -FontStyle ([System.Drawing.FontStyle]::Regular) -ColorHex '#dedcd1' -X 32 -Y 224
  Save-Png -Bitmap $smallTile.Bitmap -Path (Join-Path $storeAssetsDir 'edge-small-tile-440x280.png')
  $smallTile.Graphics.Dispose()
  $smallTile.Bitmap.Dispose()

  $largeTile = New-Canvas -Width 1400 -Height 560 -BackgroundHex '#262624'
  Fill-Rect -Graphics $largeTile.Graphics -ColorHex '#30302e' -X 760 -Y 48 -Width 580 -Height 464
  Draw-Text -Graphics $largeTile.Graphics -Text 'Claude Usage Bar Colors' -FontFamily 'Segoe UI' -FontSize 52 -FontStyle ([System.Drawing.FontStyle]::Bold) -ColorHex '#faf9f5' -X 74 -Y 96
  Draw-Text -Graphics $largeTile.Graphics -Text 'See Claude usage limits at a glance.' -FontFamily 'Segoe UI' -FontSize 26 -FontStyle ([System.Drawing.FontStyle]::Regular) -ColorHex '#dedcd1' -X 74 -Y 176
  Draw-Text -Graphics $largeTile.Graphics -Text 'Custom thresholds' -FontFamily 'Segoe UI' -FontSize 24 -FontStyle ([System.Drawing.FontStyle]::Bold) -ColorHex '#faf9f5' -X 106 -Y 272
  Draw-Text -Graphics $largeTile.Graphics -Text 'Live popup view' -FontFamily 'Segoe UI' -FontSize 24 -FontStyle ([System.Drawing.FontStyle]::Bold) -ColorHex '#faf9f5' -X 106 -Y 322
  Draw-Text -Graphics $largeTile.Graphics -Text 'Runs only on the Claude usage page' -FontFamily 'Segoe UI' -FontSize 24 -FontStyle ([System.Drawing.FontStyle]::Bold) -ColorHex '#faf9f5' -X 106 -Y 372
  Fill-Rect -Graphics $largeTile.Graphics -ColorHex '#22c55e' -X 74 -Y 282 -Width 16 -Height 16
  Fill-Rect -Graphics $largeTile.Graphics -ColorHex '#eab308' -X 74 -Y 332 -Width 16 -Height 16
  Fill-Rect -Graphics $largeTile.Graphics -ColorHex '#ef4444' -X 74 -Y 382 -Width 16 -Height 16
  Draw-ImageContain -Graphics $largeTile.Graphics -Image $page -X 782 -Y 74 -Width 536 -Height 412
  Save-Png -Bitmap $largeTile.Bitmap -Path (Join-Path $storeAssetsDir 'edge-large-tile-1400x560.png')
  $largeTile.Graphics.Dispose()
  $largeTile.Bitmap.Dispose()

  $usageScreenshot = New-Canvas -Width 1280 -Height 800 -BackgroundHex '#262624'
  Draw-ImageContain -Graphics $usageScreenshot.Graphics -Image $page -X 0 -Y 0 -Width 1280 -Height 800
  Save-Png -Bitmap $usageScreenshot.Bitmap -Path (Join-Path $storeAssetsDir 'edge-screenshot-usage-1280x800.png')
  $usageScreenshot.Graphics.Dispose()
  $usageScreenshot.Bitmap.Dispose()

  $popupScreenshot = New-Canvas -Width 1280 -Height 800 -BackgroundHex '#1f1f1d'
  Fill-Rect -Graphics $popupScreenshot.Graphics -ColorHex '#262624' -X 0 -Y 0 -Width 1280 -Height 800
  Draw-Text -Graphics $popupScreenshot.Graphics -Text 'Live popup with custom colors and thresholds' -FontFamily 'Segoe UI' -FontSize 42 -FontStyle ([System.Drawing.FontStyle]::Bold) -ColorHex '#faf9f5' -X 88 -Y 68
  Draw-Text -Graphics $popupScreenshot.Graphics -Text 'Check Claude usage quickly and adjust the warning colors.' -FontFamily 'Segoe UI' -FontSize 24 -FontStyle ([System.Drawing.FontStyle]::Regular) -ColorHex '#dedcd1' -X 88 -Y 130
  Draw-ImageContain -Graphics $popupScreenshot.Graphics -Image $popup -X 330 -Y 180 -Width 620 -Height 560
  Save-Png -Bitmap $popupScreenshot.Bitmap -Path (Join-Path $storeAssetsDir 'edge-screenshot-popup-1280x800.png')
  $popupScreenshot.Graphics.Dispose()
  $popupScreenshot.Bitmap.Dispose()
}
finally {
  $icon.Dispose()
  $popup.Dispose()
  $page.Dispose()
}
