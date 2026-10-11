# Architecture rules

- Fetch full export datasets using a shared paginated reader with deterministic ordering; never rely on the Data API's default row limit.