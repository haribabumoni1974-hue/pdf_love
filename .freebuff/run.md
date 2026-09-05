# Run doc — pdf_love (Next.js app)

## Reproduce the artifacts (fresh checkout)

- There is **no `.env.local`** (or any `.env*`) file in this project — nothing to copy.
  All configuration lives in `next.config.ts`, `tsconfig.json`, and `vitest.config.ts`.
- Install dependencies with npm:

  ```bash
  npm install
  ```

- The pdf.js worker is vendored as a static asset in `public/vendor/` and is kept
  in sync with the `pdfjs-dist` version in `package.json` — it is committed, so no
  extra step is needed.

## Run the server (dev, for preview)

- **Port:** the shell environment exports `PORT=0`, which makes `next dev` bind a
  random free port (it prints the real URL, e.g. `http://localhost:54629`). Do not
  assume 3000 — read the port from the startup log. To force a specific port, run
  `npm run dev -- -p <port>`.
- Start it detached (Windows, PowerShell) with logs in `.freebuff/` (stdout and
  stderr MUST go to different files):

  ```powershell
  powershell -NoProfile -Command "(Start-Process -FilePath 'npm.cmd' -ArgumentList 'run','dev' -RedirectStandardOutput '<worktree>\.freebuff\preview.log' -RedirectStandardError '<worktree>\.freebuff\preview.log.err' -WindowStyle Hidden -PassThru).Id"
  ```

  Note: if `-PassThru` makes the wrapper hang the caller, the server still starts —
  find its pid with `netstat -ano | findstr LISTENING | findstr :<port>`.

- Verify it answers:

  ```bash
  curl -s -o /dev/null -w "%{http_code}" http://localhost:<port>/
  ```