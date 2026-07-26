import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ANIMA_SELECTOR_CONFIGS,
  applyAnimaCharacterLocalization,
  buildAnimaSelectionValue,
  deleteAnimaTemplateImage,
  getAnimaDisplayName,
  getAnimaCustomItems,
  getAnimaFavoriteKey,
  getAnimaSelectorConfigs,
  getInitiallySelectedAnimaItems,
  isAnimaItemFavorite,
  matchesAnimaItemSearch,
  paginateAnimaItems,
  saveAnimaFavoritesSection,
  saveAnimaTemplateImage,
  setAnimaItemFavorite,
} from '../animaTools';

describe('Anima-Tools mobile adapter', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('exposes the matching selector for a standalone clothing node', () => {
    expect(
      getAnimaSelectorConfigs('AnimaClothingTagSelectorPlus', [
        'clothing_tags',
        'extra_text',
      ]),
    ).toEqual([ANIMA_SELECTOR_CONFIGS.clothing]);
  });

  it('only exposes selectors whose widgets exist on Anima Prompt Plus', () => {
    expect(
      getAnimaSelectorConfigs('AnimaPromptPlus', ['character_tags', 'pose_tags']).map(
        (config) => config.kind,
      ),
    ).toEqual(['character', 'pose']);
  });

  it('restores selected clothing from existing prompt tokens', () => {
    const items = [
      { id: 'a', name: 'White Dress', tags: 'white dress, long sleeves,' },
      { id: 'b', name: 'Black Dress', tags: 'black dress, short sleeves,' },
    ];
    expect(
      Array.from(
        getInitiallySelectedAnimaItems(
          'clothing',
          items,
          'solo, white dress, long sleeves, outdoors',
        ),
      ),
    ).toEqual(['a']);
  });

  it('formats artist and clothing values like the desktop selectors', async () => {
    await expect(
      buildAnimaSelectionValue('artist', [{ name: 'dairi' }, { name: 'jima' }]),
    ).resolves.toBe('@dairi, @jima, ');
    await expect(
      buildAnimaSelectionValue('clothing', [
        { name: 'A', tags: 'white dress, long sleeves,' },
        { name: 'B', tags: 'long sleeves, black shoes,' },
      ]),
    ).resolves.toBe('white dress, long sleeves, black shoes, ');
  });

  it('uses the character trigger without requiring network access', async () => {
    await expect(
      buildAnimaSelectionValue('character', [
        { name: 'cartethyia (wuthering waves)', copyright: 'wuthering waves' },
      ]),
    ).resolves.toBe('cartethyia (wuthering waves), wuthering waves, ');
  });

  it('uses the same favorite keys as the desktop selectors', () => {
    expect(getAnimaFavoriteKey('artist', { id: 12, name: 'dairi' })).toBe('dairi');
    expect(getAnimaFavoriteKey('character', { id: 13, name: 'cartethyia' })).toBe(
      'cartethyia',
    );
    expect(getAnimaFavoriteKey('clothing', { id: 14, name: 'Evening Gown' })).toBe(
      '14',
    );
  });

  it('paginates the complete result set and clamps invalid pages', () => {
    const items = Array.from({ length: 205 }, (_, index) => index + 1);

    expect(paginateAnimaItems(items, 2, 80)).toEqual({
      items: items.slice(80, 160),
      page: 2,
      totalPages: 3,
      totalItems: 205,
    });
    expect(paginateAnimaItems(items, 99, 80)).toEqual({
      items: items.slice(160),
      page: 3,
      totalPages: 3,
      totalItems: 205,
    });
  });

  it('replaces mixed English clothing names with readable Chinese', () => {
    expect(
      getAnimaDisplayName({
        id: 1,
        name: 'Evening Gown & Halterneck',
        name_zh: '晚礼服和Halterneck',
        tags_zh: '晚礼服, 吊颈式设计 (挂颈式/肩带绕过颈部后方支撑衣物)',
      }),
    ).toBe('晚礼服和挂颈式');
    expect(
      getAnimaDisplayName({
        id: 2,
        name: 'Ascot & Detached Sleeves',
        name_zh: 'Ascot&独立式衣袖',
        tags_zh: '领巾, 可拆卸袖套',
      }),
    ).toBe('领巾、独立式衣袖');
  });

  it('matches Chinese synonyms and multi-word Chinese searches', () => {
    const eveningGown = {
      id: 1,
      name: 'Evening Gown & Halterneck',
      name_zh: '晚礼服和Halterneck',
      tags: 'evening gown, halterneck, white dress',
      tags_zh: '晚礼服, 吊颈式设计, 白色连衣裙',
    };

    expect(matchesAnimaItemSearch(eveningGown, '挂脖')).toBe(true);
    expect(matchesAnimaItemSearch(eveningGown, '白色 裙子')).toBe(true);
    expect(matchesAnimaItemSearch(eveningGown, '黑色 裙子')).toBe(false);
  });

  it('adds Chinese character and copyright aliases without changing prompt tags', () => {
    const [localized] = applyAnimaCharacterLocalization(
      [
        {
          name: 'nahida (genshin impact)',
          copyright: 'genshin impact',
          post_count: 6828,
        },
      ],
      {
        characters: {
          'nahida (genshin impact)|genshin impact': {
            name_zh: '纳西妲',
            aliases: ['纳西妲', '小吉祥草王', '草神'],
          },
        },
        copyrights: {
          'genshin impact': {
            name_zh: '原神',
            aliases: ['原神'],
          },
        },
      },
    );

    expect(localized).toMatchObject({
      name: 'nahida (genshin impact)',
      name_zh: '纳西妲',
      copyright: 'genshin impact',
      copyright_zh: '原神',
    });
    expect(matchesAnimaItemSearch(localized!, '小吉祥草王')).toBe(true);
    expect(matchesAnimaItemSearch(localized!, '原神')).toBe(true);
  });

  it('keeps artist names in their original form', () => {
    expect(getAnimaDisplayName({ name: 'miko artist' })).toBe('miko artist');
  });

  it('adds a shared server favorite without losing groups or custom items', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);
    const section = {
      groups: [
        { id: 'default', name: 'Default Favorites', isSystem: true },
        { id: 'formal', name: 'Formal' },
      ],
      items: [
        {
          name: 'custom-1',
          nickname: 'My custom outfit',
          customContent: 'blue dress',
          groupIds: ['formal'],
          isCustom: true,
        },
      ],
    };
    const item = { id: 14, name: 'Evening Gown', tags: 'evening gown' };

    const next = await setAnimaItemFavorite('clothing', item, section, true);

    expect(isAnimaItemFavorite('clothing', item, next)).toBe(true);
    expect(next.groups).toEqual(section.groups);
    expect(next.items[0]).toEqual(section.items[0]);
    expect(next.items[1]).toMatchObject({
      id: 14,
      name: 'Evening Gown',
      groupIds: ['default'],
      isCustom: false,
    });
    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(JSON.parse(String(request.body))).toEqual({ clothing: next });
  });

  it('removes a favorite while preserving custom items', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
    const item = { id: 14, name: 'Evening Gown' };
    const next = await setAnimaItemFavorite(
      'clothing',
      item,
      {
        groups: [{ id: 'default', name: 'Default Favorites', isSystem: true }],
        items: [
          { id: 14, name: 'Evening Gown', groupIds: ['default'], isCustom: false },
          {
            name: 'custom-1',
            customContent: 'blue dress',
            groupIds: ['default'],
            isCustom: true,
          },
        ],
      },
      false,
    );

    expect(isAnimaItemFavorite('clothing', item, next)).toBe(false);
    expect(next.items).toHaveLength(1);
    expect(next.items[0]?.isCustom).toBe(true);
  });

  it('turns saved custom templates into selectable cards', () => {
    const items = getAnimaCustomItems({
      groups: [{ id: 'default', name: 'Default Favorites', isSystem: true }],
      items: [
        {
          name: 'custom-blue-dress',
          nickname: '蓝色礼服',
          customContent: 'blue evening gown, long gloves',
          preview: '/anima-tools/template-images/blue.png',
          previewFile: 'blue.png',
          groupIds: ['default'],
          isCustom: true,
        },
        { name: 'official', groupIds: ['default'], isCustom: false },
      ],
    });

    expect(items).toEqual([
      {
        id: 'custom-blue-dress',
        name: '蓝色礼服',
        tags: 'blue evening gown, long gloves',
        preview: '/anima-tools/template-images/blue.png',
        isCustom: true,
        customContent: 'blue evening gown, long gloves',
        groupIds: ['default'],
      },
    ]);
    expect(matchesAnimaItemSearch(items[0]!, 'long gloves')).toBe(true);
  });

  it('restores and applies a custom template without changing its prompt', async () => {
    const custom = {
      id: 'custom-pose',
      name: '自定义动作',
      isCustom: true,
      customContent: 'looking back, hand on hip',
    };

    expect(
      Array.from(
        getInitiallySelectedAnimaItems(
          'pose',
          [custom],
          'solo, looking back, hand on hip, outdoors',
        ),
      ),
    ).toEqual(['custom:custom-pose']);
    await expect(buildAnimaSelectionValue('pose', [custom])).resolves.toBe(
      'looking back, hand on hip, ',
    );
    await expect(buildAnimaSelectionValue('character', [custom])).resolves.toBe(
      'looking back, hand on hip, ',
    );
  });

  it('saves a complete custom favorites section', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);
    const section = {
      groups: [{ id: 'default', name: 'Default Favorites', isSystem: true }],
      items: [
        {
          name: 'custom-scene',
          nickname: '雨夜街道',
          customContent: 'rainy street, night',
          groupIds: ['default'],
          isCustom: true,
        },
      ],
    };

    await expect(saveAnimaFavoritesSection('background', section)).resolves.toEqual(
      section,
    );
    expect(fetchMock).toHaveBeenCalledWith(
      '/anima-tools/favorites',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ background: section }),
      }),
    );
  });

  it('uploads and deletes durable custom template images', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          preview: '/anima-tools/template-images/cover.png',
          filename: 'cover.png',
        }),
      })
      .mockResolvedValueOnce({ ok: true });
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      saveAnimaTemplateImage('2026-07-26/result.png', 'output'),
    ).resolves.toEqual({
      preview: '/anima-tools/template-images/cover.png',
      filename: 'cover.png',
    });
    await expect(deleteAnimaTemplateImage('cover.png')).resolves.toBeUndefined();
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/anima-tools/template-images');
    expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({ method: 'DELETE' });
  });
});
