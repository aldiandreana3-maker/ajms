interface PageResult<T> {
  data: T[] | null;
  error: { message: string } | null;
}

interface PaginatedQuery<T> {
  order(column: string, options: { ascending: boolean }): PaginatedQuery<T>;
  range(from: number, to: number): PaginatedQuery<T>;
  abortSignal(signal: AbortSignal): PromiseLike<PageResult<T>>;
}

/** Read every accessible row; a failed page never produces a partial export. */
export async function fetchAllRows<T>(query: PaginatedQuery<T>): Promise<{ data: T[]; error: null }> {
  const rows: T[] = [];
  const pageSize = 500;
  // A unique tie-breaker prevents equal dates/names from shifting between pages.
  const ordered = query.order("id", { ascending: true });
  let offset = 0;

  while (true) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);
    let result: PageResult<T>;
    try {
      result = await ordered.range(offset, offset + pageSize - 1).abortSignal(controller.signal);
    } finally {
      clearTimeout(timeout);
    }
    if (result.error) throw result.error;
    const batch = result.data ?? [];
    if (batch.length === 0) break;
    rows.push(...batch);
    // Continue even after a short page in case the server imposes a smaller cap.
    offset += batch.length;
  }
  return { data: rows, error: null };
}