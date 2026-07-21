param(
  [switch]$Apply,
  [string]$ExpectedProjectRef = "tjnqqsbwgjcdzcxykyif",
  [ValidateSet("REPAIR_HISTORY_ONLY")]
  [string]$Confirmation
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

$families = [ordered]@{
  "commerce-checkout" = @(
    "20260716000001",
    "20260716000002",
    "20260716000003",
    "20260716000004",
    "20260716000005",
    "20260716000006",
    "20260716000007",
    "20260716000008",
    "20260716000009",
    "20260716000010",
    "20260716000011",
    "20260716000012",
    "20260716000013",
    "20260716000014",
    "20260716000015",
    "20260716000016",
    "20260716000017"
  )
  "faq" = @(
    "20260716000100",
    "20260716000101",
    "20260716000102",
    "20260716000103"
  )
  "operations" = @(
    "20260719000001",
    "20260719000002",
    "20260719000003",
    "20260719000004",
    "20260719000005",
    "20260719000006",
    "20260719000007",
    "20260719000008",
    "20260719000009",
    "20260719000010",
    "20260719000011",
    "20260719000012",
    "20260719000013",
    "20260719000014",
    "20260719000015",
    "20260719000016",
    "20260719000017",
    "20260719000018"
  )
}

$targetVersions = @($families.Values | ForEach-Object { $_ })
$linkedRefPath = Join-Path $repoRoot "supabase/.temp/project-ref"

Write-Host "Supabase migration history repair" -ForegroundColor Cyan
Write-Host "Project esperado: $ExpectedProjectRef"
Write-Host "Versões planejadas: $($targetVersions.Count)"
Write-Host ""

foreach ($family in $families.GetEnumerator()) {
  Write-Host "[$($family.Key)]" -ForegroundColor Yellow
  $family.Value | ForEach-Object { Write-Host "  $_" }
}

if (-not $Apply) {
  Write-Host ""
  Write-Host "Modo de planejamento: nenhuma alteração foi executada." -ForegroundColor Green
  Write-Host "Para aplicar, execute:" -ForegroundColor Green
  Write-Host ".\scripts\repair-supabase-migration-history.ps1 -Apply -Confirmation REPAIR_HISTORY_ONLY"
  exit 0
}

if ($Confirmation -ne "REPAIR_HISTORY_ONLY") {
  throw "Confirmação obrigatória ausente. Use -Confirmation REPAIR_HISTORY_ONLY."
}

if (-not (Test-Path $linkedRefPath)) {
  throw "Projeto Supabase não está vinculado localmente. Execute 'npx supabase link --project-ref $ExpectedProjectRef' antes de continuar."
}

$linkedRef = (Get-Content -Raw $linkedRefPath).Trim()
if ($linkedRef -ne $ExpectedProjectRef) {
  throw "Projeto vinculado incorreto. Esperado '$ExpectedProjectRef', encontrado '$linkedRef'."
}

$branch = (git branch --show-current).Trim()
if ($LASTEXITCODE -ne 0) {
  throw "Não foi possível identificar a branch Git atual."
}

if ($branch -ne "chore/supabase-migration-reconciliation") {
  throw "Execute este reparo somente na branch chore/supabase-migration-reconciliation. Branch atual: $branch"
}

$beforePath = Join-Path $repoRoot "supabase-migration-list-before-repair.txt"
$afterPath = Join-Path $repoRoot "supabase-migration-list-after-repair.txt"
$dryRunPath = Join-Path $repoRoot "supabase-db-push-dry-run-after-repair.txt"

Write-Host ""
Write-Host "Registrando histórico anterior em $beforePath" -ForegroundColor Cyan
npx supabase migration list --linked 2>&1 | Tee-Object -FilePath $beforePath
if ($LASTEXITCODE -ne 0) {
  throw "Falha ao consultar o histórico remoto antes do reparo."
}

foreach ($family in $families.GetEnumerator()) {
  Write-Host ""
  Write-Host "Reparando família: $($family.Key)" -ForegroundColor Cyan

  foreach ($version in $family.Value) {
    Write-Host "  Marcando $version como aplicada..."
    npx supabase migration repair $version --status applied --linked
    if ($LASTEXITCODE -ne 0) {
      throw "Falha ao reparar a versão $version. Interrompendo sem avançar para as versões seguintes."
    }
  }
}

Write-Host ""
Write-Host "Registrando histórico posterior em $afterPath" -ForegroundColor Cyan
npx supabase migration list --linked 2>&1 | Tee-Object -FilePath $afterPath
if ($LASTEXITCODE -ne 0) {
  throw "Falha ao consultar o histórico remoto depois do reparo."
}

Write-Host ""
Write-Host "Executando somente o dry-run do db push..." -ForegroundColor Cyan
npx supabase db push --dry-run 2>&1 | Tee-Object -FilePath $dryRunPath
if ($LASTEXITCODE -ne 0) {
  throw "O reparo foi aplicado, mas o db push --dry-run retornou erro. Revise $dryRunPath antes de qualquer outra ação."
}

Write-Host ""
Write-Host "Reparo de histórico concluído." -ForegroundColor Green
Write-Host "Nenhuma migration SQL foi executada por este script." -ForegroundColor Green
Write-Host "Arquivos de evidência:" -ForegroundColor Green
Write-Host "  $beforePath"
Write-Host "  $afterPath"
Write-Host "  $dryRunPath"
