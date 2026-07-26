// Client for supported autocomplete providers' HTTP APIs.
//
// Prefer ComfyUI-Autocomplete-Plus when installed, and fall back to the local
// word list exposed by pysssss/ComfyUI-Custom-Scripts. Both providers are read
// only and served from the same ComfyUI origin as this app.

import type { TagEntry } from '@/utils/autocompleteSearch';

const AUTOCOMPLETE_PLUS_BASE = '/autocomplete-plus';
const CUSTOM_SCRIPTS_BASE = '/pysssss';

export type AutocompleteProvider = 'autocomplete-plus' | 'custom-scripts';

interface CsvStatus {
  base_tags: boolean;
  extra_tags: string[];
  base_cooccurrence: boolean;
  extra_cooccurrence: string[];
}

interface CsvListResponse {
  danbooru?: CsvStatus;
}

/**
 * Detect whether Autocomplete-Plus is installed and has usable tag data.
 * Resolves false on any error (route absent → node not installed).
 */
export async function isAutocompletePlusAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${AUTOCOMPLETE_PLUS_BASE}/csv`);
    if (!response.ok) return false;
    const data = (await response.json()) as CsvListResponse;
    return Boolean(data?.danbooru?.base_tags);
  } catch {
    return false;
  }
}

/** Detect the pysssss/ComfyUI-Custom-Scripts word-list endpoint. */
export async function isCustomScriptsAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${CUSTOM_SCRIPTS_BASE}/autocomplete`, {
      cache: 'no-store',
      method: 'HEAD',
    });
    return response.ok;
  } catch {
    return false;
  }
}

// Mirrors Autocomplete-Plus's own CSV parsing: quoted fields may contain commas
// (the alias column is a quoted comma-separated list).
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

/**
 * Fetch and parse the base danbooru tag table, sorted by post count descending
 * (so search can collect best-first). Header row: `tag,category,count,alias`.
 */
export async function fetchDanbooruTags(
  provider: AutocompleteProvider = 'autocomplete-plus',
): Promise<TagEntry[]> {
  const url = provider === 'custom-scripts'
    ? `${CUSTOM_SCRIPTS_BASE}/autocomplete`
    : `${AUTOCOMPLETE_PLUS_BASE}/csv/danbooru/tags/base`;
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Failed to fetch tags: ${response.status}`);
  const text = await response.text();
  const lines = text.split('\n');

  const entries: TagEntry[] = [];
  const hasHeader = lines[0]?.toLowerCase().startsWith('tag,category,count');
  const start = hasHeader ? 1 : 0;
  for (let i = start; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const cols = parseCsvLine(line);
    const tag = cols[0].trim();
    if (!tag) continue;

    const isFourColumn = cols.length >= 4;
    const countColumn = isFourColumn ? cols[2] : cols[1];
    const count = parseInt(countColumn?.trim() ?? '0', 10);
    if (!tag || Number.isNaN(count)) continue;
    const aliasStr = isFourColumn ? cols[3].trim() : '';
    entries.push({
      tag,
      category: isFourColumn ? parseInt(cols[1].trim(), 10) || 0 : 0,
      count,
      aliases: aliasStr ? aliasStr.split(',').map((a) => a.trim()).filter(Boolean) : [],
    });
  }

  for (const entry of entries) {
    entry.searchKey = entry.tag.toLowerCase();
    entry.aliasKeys = entry.aliases.map((alias) => alias.toLowerCase().replace(/ /g, '_'));
  }
  entries.sort((a, b) => b.count - a.count);
  return entries;
}

async function fetchNameList(url: string): Promise<string[]> {
  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data.filter((n): n is string => typeof n === 'string') : [];
  } catch {
    return [];
  }
}

export function fetchLoraNames(
  provider: AutocompleteProvider = 'autocomplete-plus',
): Promise<string[]> {
  return fetchNameList(
    provider === 'custom-scripts'
      ? `${CUSTOM_SCRIPTS_BASE}/loras`
      : `${AUTOCOMPLETE_PLUS_BASE}/loras`,
  );
}

export function fetchEmbeddingNames(
  provider: AutocompleteProvider = 'autocomplete-plus',
): Promise<string[]> {
  return fetchNameList(
    provider === 'custom-scripts'
      ? '/embeddings'
      : `${AUTOCOMPLETE_PLUS_BASE}/embeddings`,
  );
}
