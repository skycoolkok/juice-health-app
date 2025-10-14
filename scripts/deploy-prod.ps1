# scripts/deploy-prod.ps1
# ASCII-only, no emoji/colored output

Param(
  [switch]$DryRun
)

function Fail($msg) {
  Write-Error $msg
  exit 1
}

# Must be at repo root
if (-not (Test-Path ".git")) { Fail "Not a git repository root (missing .git)." }

# Ensure clean working tree
$changes = git status --porcelain
if ($changes) {
  Write-Error "Working tree is dirty. Commit or stash first."
  git status
  exit 1
}

# Ensure remote exists
git remote get-url origin | Out-Null
if (-not $?) { Fail "Missing 'origin' remote. Configure it first." }

Write-Host "Step 1: Fetch all remotes"
git fetch --all --prune
if (-not $?) { Fail "git fetch failed" }

Write-Host "Step 2: Update main"
git checkout main
if (-not $?) { Fail "checkout main failed" }
git pull origin main --ff-only
if (-not $?) { Fail "pull origin main failed" }

Write-Host "Step 3: Switch to prod/main and merge main"
git checkout prod/main
if (-not $?) { Fail "checkout prod/main failed" }
git pull origin prod/main --ff-only
if (-not $?) { Fail "pull origin prod/main failed" }

# Try fast-forward first; if not possible, do a merge commit
git merge --no-edit --ff-only main 2>$null
if (-not $?) {
  Write-Host "Fast-forward not possible. Doing a regular merge..."
  git merge --no-ff main
  if (-not $?) { Fail "merge main into prod/main failed" }
}

Write-Host "Commits to push (prod/main vs origin/prod/main):"
git log --oneline origin/prod/main..prod/main

if ($DryRun) {
  Write-Host "DryRun enabled: not pushing."
  exit 0
}

Write-Host "Step 4: Push prod/main (will trigger Vercel Production deploy)"
git push origin prod/main
if (-not $?) { Fail "push origin prod/main failed" }

Write-Host "Done. Check Vercel Production deployment status."
