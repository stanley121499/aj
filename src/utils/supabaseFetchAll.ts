import type { SupabaseClient } from "@supabase/supabase-js";

/** Default PostgREST page size (Supabase truncates `.select()` at 1000 rows). */
const PAGE_SIZE = 1000;

/**
 * Fetches every row from a table by paging with `.range()`, bypassing the
 * default 1000-row PostgREST limit that silently truncates admin aggregates.
 * @param client - Supabase client
 * @param table - Public table name
 * @returns All rows as objects, or throws on query error
 */
export async function fetchAllRows<T extends Record<string, unknown>>(
  client: SupabaseClient,
  table: string
): Promise<T[]> {
  const all: T[] = [];
  let from = 0;

  for (;;) {
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await client.from(table).select("*").range(from, to);

    if (error) {
      throw error;
    }

    const chunk = (data ?? []) as T[];
    all.push(...chunk);

    if (chunk.length < PAGE_SIZE) {
      break;
    }

    from += PAGE_SIZE;
  }

  return all;
}
