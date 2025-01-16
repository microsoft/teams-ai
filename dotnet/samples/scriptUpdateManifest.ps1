

function Update-TeamsManifest {
    param (
        [string]$ManifestPath,
        [string]$AppId,
        [string]$DomainName,
        [string]$OutputZipPath
    )
    $ManifestPathNew = "C:\tmp\teamsManifest"
    Remove-Item -Path "$ManifestPathNew\*.*" -Force
    New-Item -Path $ManifestPathNew -Type Directory -Force | out-null
    Copy-Item -Path "$ManifestPath\*.*" -Destination $ManifestPathNew
    $ManifestPath = $ManifestPathNew

    $manifestText = Get-Content -Raw -Path "$ManifestPath\manifest.json"
    $manifestText = $manifestText -replace '\${{TEAMS_APP_ID}}|\${{BOT_ID}}', $AppId
    $manifestText = $manifestText -replace '\${{DOMAIN}}', $DomainName
    $manifestText = $manifestText -replace '\${{BOT_DOMAIN}}', $DomainName
    $manifestText = $manifestText -replace '\${{APP_NAME_SUFFIX}}', '_local'
    $manifestText | Set-Content -Path "$ManifestPath\manifest.json"
    $zipFile = Join-Path -Path $OutputZipPath -ChildPath "manifest.zip"
    Compress-Archive -Path "$ManifestPath\*" -DestinationPath $zipFile -Force
    Write-Host "Manifest updated and zipped successfully. $zipFile"
}

# Update-TeamsManifest -ManifestPath "C:\src\others\teams-ai\dotnet\samples\01.messaging.echoBot\appPackage\" -AppId "ff2b976f-4828-46d0-a66c-c321ea4b343c" -DomainName "2ed7-4-155-24-74.ngrok-free.app" -OutputZipPath "C:\tmp\"


