import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  fetchDanbooruTags,
  isAutocompletePlusAvailable,
  isCustomScriptsAvailable,
} from '@/api/autocompletePlusClient';

describe('autocompletePlusClient', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('only reports available when Danbooru base tags are present', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({
        danbooru: { base_tags: false },
        e621: { base_tags: true },
      }),
    })));

    await expect(isAutocompletePlusAvailable()).resolves.toBe(false);
  });

  it('precomputes immutable tag search keys when loading tags', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      text: async () => [
        'tag,category,count,alias',
        'blue_eyes,0,1000,"blue eyes,青い目"',
      ].join('\n'),
    })));

    await expect(fetchDanbooruTags()).resolves.toEqual([
      {
        tag: 'blue_eyes',
        category: 0,
        count: 1000,
        aliases: ['blue eyes', '青い目'],
        searchKey: 'blue_eyes',
        aliasKeys: ['blue_eyes', '青い目'],
      },
    ]);
  });

  it('detects and parses a Custom-Scripts two-column word list', async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      if (init?.method === 'HEAD') return { ok: true };
      return {
        ok: true,
        text: async () => ['1girl,4114588', 'solo,3426446'].join('\n'),
      };
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(isCustomScriptsAvailable()).resolves.toBe(true);
    await expect(fetchDanbooruTags('custom-scripts')).resolves.toEqual([
      {
        tag: '1girl',
        category: 0,
        count: 4114588,
        aliases: [],
        searchKey: '1girl',
        aliasKeys: [],
      },
      {
        tag: 'solo',
        category: 0,
        count: 3426446,
        aliases: [],
        searchKey: 'solo',
        aliasKeys: [],
      },
    ]);
    expect(fetchMock).toHaveBeenCalledWith('/pysssss/autocomplete', {
      cache: 'no-store',
      method: 'HEAD',
    });
  });
});
