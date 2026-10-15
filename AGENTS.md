# Architecture rules
- Keep correspondence templates separate from operational records; use one shared editable A4 document renderer and letterhead, with each template preserving its source orientation and signature layout. This prevents letter editing from changing service history.
- Prefill individual service print forms through the shared correspondence templates and print renderer using only the selected authorized record; blank unavailable fields and keep print-only edits separate from persisted operational data to prevent invented values and history changes.

- Fetch full export datasets using a shared paginated reader with deterministic ordering; never rely on the Data API's default row limit.
- Mount service-specific unit print archives through MainLayout and a shared route registry; store admin-edited print snapshots separately from original service records so printing never alters operational history.
- Render editable archive text through a shared structured A4 renderer with the original letterhead asset; interpret legacy snapshots at print time without overwriting admin edits.
- Store NPP imports and manual unit changes as versioned snapshots with separate owner aliases; serialize manual mutations in a role-validated database function and reject stale versions to preserve source history and concurrent edits.
- Preserve NPP cell values and Excel display formats separately and sum with decimal arithmetic; display formatting must never overwrite source precision.
- Restore legacy complaint media only through an admin-validated function using stored Drive IDs, verified private storage uploads and keyset pagination; inaccessible originals remain unchanged.