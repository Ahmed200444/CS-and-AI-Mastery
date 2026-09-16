# Launcher Recovery QA — v5.37

- Exact observed failure addressed: launcher says `The local server could not start` while `csai-server.log` contains only its header/start time.
- Root reliability change: the detached Windows server no longer inherits an open log-file descriptor from the launcher. `server-bootstrap.js` owns logging inside the detached process instead.
- Spawn failures, early exits, uncaught exceptions, and unhandled rejections are now written into `csai-server.log`.
- Startup wait increased from 10 seconds to 30 seconds for slower Windows/antivirus systems.
- `/__health` now reports release `5.37`, so a newly installed launcher will not silently reuse an older preloaded local server.
- If an old CS & AI Mastery Node process owns port 5711, the launcher identifies and stops only that CS & AI process before starting the current release. It does not intentionally kill unrelated processes.
- `local-server.js` skips transient log/PID/ZIP files and tolerates unreadable folders/files instead of aborting startup.
- `START_CSAI.bat` still preserves the same launcher appearance and GitHub CLI verification flow.
- Server log: `csai-server.log`.
- Stop control: `STOP_CSAI.bat`.
- GitHub has no hard-coded repository target; each learner chooses their own repository on the GitHub page.
