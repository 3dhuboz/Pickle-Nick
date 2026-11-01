# Pickle-Nick backup routing

The GitHub identity is `3dhuboz/Pickle-Nick`. Keep active work in the canonical Lexar owner lane.

Steve approved the cold-backup container `\\Sentinel\d\GitHubBackup\Pickle-Nick-3dhuboz` on 1 November 2026. The similarly named `\\Sentinel\d\GitHubBackup\Pickle-Nick` is a frozen legacy checkout; do not write, build, test, deploy, or discover application source there.

For each fresh hot clone, configure the supported per-repository backup name before running the standard global save command:

```powershell
git config --local codex.backupProjectName Pickle-Nick-3dhuboz
powershell -NoProfile -ExecutionPolicy Bypass -File C:\Users\Steve\.codex\scripts\codex-save-repo.ps1
```

Keep the standard Sentinel backup root and storage identity checks. Do not add a marker to the frozen legacy checkout or bypass the backup ownership checks.
