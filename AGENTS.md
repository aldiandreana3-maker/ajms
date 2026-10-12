# Architecture rules

- Fetch full export datasets using a shared paginated reader with deterministic ordering; never rely on the Data API's default row limit.
- Mount service-specific unit print archives through MainLayout and a shared route registry; store admin-edited print snapshots separately from original service records so printing never alters operational history.
- Render editable archive text through a shared structured A4 renderer with the original letterhead asset; interpret legacy snapshots at print time without overwriting admin edits.
- Store NPP imports as versioned admin-only source snapshots with separate owner aliases; derive grouping and election selections without modifying original unit values.
- Preserve NPP cell values and Excel display formats separately and sum with decimal arithmetic; display formatting must never overwrite source precision.