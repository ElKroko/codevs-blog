# Unused or Redundant Files

This report lists files and directories that appear unused based on a quick search through the project.

## Potentially unused source files

- `src/lib/wp-knowledge-backup.ts`
- `src/lib/wp-knowledge-corrupted-backup.ts`
- `src/lib/wp-knowledge-new.ts`

These files are not imported anywhere in the `src` directory.

## Empty file

- `config/server.js` – empty file.

## Deployment archives

The following zip files in `deploy-archives/` appear to be old artifacts of previous deployments:

```
 deploy-archives/dist-2025-05-28T09-02-04-584Z.zip
 deploy-archives/quick-deploy-2025-05-28-09-01.zip
 deploy-archives/quick-deploy-2025-05-28-09-28.zip
 deploy-archives/dist.zip
```

These could be removed to reduce repository size.

## Notes

This analysis is based purely on a search for references within the repository. If any of these files are used by external tools or processes, you should keep them.
