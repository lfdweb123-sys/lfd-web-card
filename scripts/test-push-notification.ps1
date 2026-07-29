# test-push-notification.ps1
# Simule une notification push pour vérifier que toute la chaîne fonctionne :
# connexion -> token Firebase -> appel de l'API -> envoi FCM.
#
# PRÉREQUIS avant de lancer ce script :
#   1. Être connecté sur card.lfdweb.com avec ce même compte, dans un navigateur
#   2. Avoir cliqué "Activer" sur la bannière de notifications du dashboard
#      et accepté la permission du navigateur
#   (sans ça, aucun token FCM n'est enregistré et la notification ne peut pas arriver)
#
# UTILISATION :
#   .\test-push-notification.ps1 -Email "vous@example.com" -Password "votre_mot_de_passe"

param(
    [Parameter(Mandatory = $true)]
    [string]$Email,

    [Parameter(Mandatory = $true)]
    [string]$Password,

    [string]$ApiKey = "your_firebase_api_key",      # NEXT_PUBLIC_FIREBASE_API_KEY
    [string]$BaseUrl = "https://card.lfdweb.com"
)

Write-Host "1. Connexion Firebase..." -ForegroundColor Cyan

$authBody = @{
    email             = $Email
    password          = $Password
    returnSecureToken = $true
} | ConvertTo-Json

try {
    $authResponse = Invoke-RestMethod `
        -Uri "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=$ApiKey" `
        -Method Post `
        -ContentType "application/json" `
        -Body $authBody
} catch {
    Write-Host "Échec de connexion : $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

$idToken = $authResponse.idToken
Write-Host "   Connecté avec succès." -ForegroundColor Green

Write-Host "2. Envoi de la notification de test..." -ForegroundColor Cyan

try {
    $pushResponse = Invoke-RestMethod `
        -Uri "$BaseUrl/api/notifications/test" `
        -Method Post `
        -Headers @{ Authorization = "Bearer $idToken" } `
        -ContentType "application/json"
} catch {
    Write-Host "Échec de l'envoi : $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

if ($pushResponse.success) {
    Write-Host "   $($pushResponse.message)" -ForegroundColor Green
    Write-Host "`nRegardez votre navigateur / téléphone — la notification devrait apparaître dans quelques secondes." -ForegroundColor Yellow
} else {
    Write-Host "   Erreur : $($pushResponse.error)" -ForegroundColor Red
}
