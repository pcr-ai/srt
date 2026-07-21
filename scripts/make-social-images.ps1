# Generates social-media-optimized copies of the Ratha Yatra flyer.
# Uses built-in .NET System.Drawing (no external tools required).
Add-Type -AssemblyName System.Drawing

$src = "d:\pcr\srt\assets\img\events\ratha-yatra-2026.jpg"
$flyer = [System.Drawing.Image]::FromFile($src)

# Colors sampled from the flyer edges
$top    = [System.Drawing.Color]::FromArgb(250, 241, 226)  # cream (flyer top)
$bottom = [System.Drawing.Color]::FromArgb(190, 48, 0)     # maroon (flyer bottom)

# JPEG encoder at high quality
$jpg = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$qParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$qParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, 92L)

$gold = [System.Drawing.Color]::FromArgb(245, 197, 66)   # banner fill
$maroonText = [System.Drawing.Color]::FromArgb(140, 26, 0) # banner text

function New-SocialImage($outPath, $W, $H, [bool]$banner = $false) {
    $bmp = New-Object System.Drawing.Bitmap($W, $H)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode     = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode   = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAlias

    # Vertical gradient background (cream -> maroon)
    $rect = New-Object System.Drawing.Rectangle(0, 0, $W, $H)
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $top, $bottom, 90)
    $g.FillRectangle($brush, $rect)

    # Scale flyer to fit within the canvas (contain), centered
    $scale = [Math]::Min($W / $flyer.Width, $H / $flyer.Height)
    $fw = [int]($flyer.Width * $scale)
    $fh = [int]($flyer.Height * $scale)
    $x = [int](($W - $fw) / 2)
    $y = [int](($H - $fh) / 2)
    $g.DrawImage($flyer, $x, $y, $fw, $fh)

    if ($banner) {
        # Ribbon centered in the lower gradient gap below the flyer
        $flyerBottom = $y + $fh
        $gap = $H - $flyerBottom
        if ($gap -lt 110) { $flyerBottom = $H - 130; $gap = 130 }   # ensure room
        $bh = [Math]::Min(96, [int]($gap * 0.62))
        $bw = [int]($W * 0.72)
        $bx = [int](($W - $bw) / 2)
        $by = [int]($flyerBottom + ($gap - $bh) / 2)

        $path = New-Object System.Drawing.Drawing2D.GraphicsPath
        $r = [int]($bh / 2)
        $path.AddArc($bx, $by, $r*2, $bh, 90, 180)
        $path.AddArc($bx + $bw - $r*2, $by, $r*2, $bh, 270, 180)
        $path.CloseFigure()
        $gb = New-Object System.Drawing.SolidBrush($gold)
        $g.FillPath($gb, $path)

        $dot = [char]0x2022   # bullet, built from code point to avoid source-encoding issues
        $text = "FREE   $dot   ALL WELCOME"
        $font = New-Object System.Drawing.Font("Arial", ($bh * 0.34), [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
        $sf = New-Object System.Drawing.StringFormat
        $sf.Alignment = [System.Drawing.StringAlignment]::Center
        $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
        $tb = New-Object System.Drawing.SolidBrush($maroonText)
        $g.DrawString($text, $font, $tb, (New-Object System.Drawing.RectangleF($bx, $by, $bw, $bh)), $sf)
        $gb.Dispose(); $tb.Dispose(); $font.Dispose(); $path.Dispose()
    }

    $bmp.Save($outPath, $jpg, $qParams)
    $g.Dispose(); $brush.Dispose(); $bmp.Dispose()
    Write-Host "Created $outPath ($W x $H)"
}

$dir = "d:\pcr\srt\assets\img\events"
# Plain versions (flyer on gradient)
New-SocialImage "$dir\ratha-yatra-2026-square.jpg"   1080 1080  # Facebook / Instagram feed 1:1
New-SocialImage "$dir\ratha-yatra-2026-portrait.jpg" 1080 1350  # Feed 4:5 (max mobile space)
New-SocialImage "$dir\ratha-yatra-2026-story.jpg"    1080 1920  # Stories / Reels 9:16
New-SocialImage "$dir\ratha-yatra-2026-link.jpg"     1200 630   # Link-share preview 1.91:1
# Banner versions ("FREE · ALL WELCOME" ribbon)
New-SocialImage "$dir\ratha-yatra-2026-square-banner.jpg"   1080 1080 $true
New-SocialImage "$dir\ratha-yatra-2026-portrait-banner.jpg" 1080 1350 $true
New-SocialImage "$dir\ratha-yatra-2026-story-banner.jpg"    1080 1920 $true

$flyer.Dispose()
Write-Host "Done."
