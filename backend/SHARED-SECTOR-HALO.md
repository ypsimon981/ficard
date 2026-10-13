# Search border prefetch

Each user sector request records its 3x3 neighbourhood, including diagonals. Overlapping targets share one (y,x) primary key: a contiguous 2x2 search needs 16 sectors, a rectangular m by n search needs (m+2)*(n+2), clipped at the Italy grid boundary.

The public response still contains only requested sectors. Missing neighbours are imported in background on the server, ready for later map searches. User sectors retain priority. Prefetch insertions do not register another halo. Existing user searches are seeded once at rollout.

Targets survive quota exhaustion and are admitted by the existing 30-second worker. Admission is capped at 8 per tick, 40 prefetch sectors/day, 48 total new sectors/day for prefetch admission, and 48 pending/loading sectors, preserving room for user requests. Source calls retain the existing 80 prefetch / 120 total per-day thresholds, with allowance accounting for a possible fallback. No quota or warmup deadline was increased. Prefetch is allowed during the temporary week or 01:00–05:59 Europe/Rome afterwards.

The separate exploratory hourly/nightly scans remain enabled. All new state is in the private schema, with RLS and no anonymous grants. No device cards, favourites or caches are uploaded.

Validation: backend/shared-halo-verify.sql runs rollback-only checks for 3x3, repeated requests, 2x2 union, no recursive expansion, user priority, grid edges, quota deferral, disabled switch and anonymous denial.

Rollback: restore ficard_shared_tick from migration 20261013070257_shared_week_warmup.sql and drop trigger shared_register_halo on ficard_private.shared_cells. Retain imported cells and target table; do not delete stores. The shared_config.enabled switch stops all imports immediately.

## Temporary bootstrap increase

The subsequent shared_warmup_capacity migration raises capacity only while the existing warmup deadline is active: 500 source calls/day, 200 automatic new sectors/day, 256 total new sectors/day, hourly exploration up to 32. Queue bounds and single-flight worker stay unchanged. The halo admission reserve becomes 56 sectors for users. Source transfer accounting starts at this migration; new requests stop at a 50,000,000-byte response threshold (one in-flight response can cross it). HTTP 429/406 stops fallback, pauses the source for one minute and defers the affected sector for 15 minutes. After expiry, request/sector caps revert automatically. The 50 MB transfer threshold and error pause remain in force. Imported data is preserved. The hourly automation prompt has been updated to match.

Capacity verification: backend/shared-capacity-verify.sql confirms rejected 501st request inside a rolled-back transaction, download threshold, and restoration of 120 total requests after expiry.
