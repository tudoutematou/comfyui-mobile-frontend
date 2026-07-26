export type AnimaSelectorKind =
  | 'artist'
  | 'character'
  | 'clothing'
  | 'background'
  | 'pose';

export interface AnimaSelectorItem {
  id?: string | number;
  name: string;
  name_zh?: string;
  tags?: string | string[];
  tags_zh?: string | string[];
  preview?: string;
  categories?: string[];
  traits?: string[];
  copyright?: string;
  copyright_zh?: string;
  copyright_aliases?: string | string[];
  post_count?: number;
  gender?: string;
  hair?: string;
  eye?: string;
  aliases?: string | string[];
  isCustom?: boolean;
  customContent?: string;
}

export interface AnimaSelectorConfig {
  kind: AnimaSelectorKind;
  label: string;
  widgetName: string;
  moduleFile: string;
  globalKey: string;
  accentClassName: string;
}

export interface AnimaFavoriteGroup {
  id: string;
  name: string;
  isSystem?: boolean;
}

export interface AnimaFavoriteItem {
  id?: string | number;
  name: string;
  nickname?: string;
  groupIds?: string[];
  isCustom?: boolean;
  customContent?: string;
  preview?: string;
  previewFile?: string;
  [key: string]: unknown;
}

export interface AnimaFavoritesSection {
  groups: AnimaFavoriteGroup[];
  items: AnimaFavoriteItem[];
}

export interface AnimaPage<T> {
  items: T[];
  page: number;
  totalPages: number;
  totalItems: number;
}

const EXTENSION_JS_BASE = '/extensions/Comfyui-Anima-Tools';
const FAVORITES_API = '/anima-tools/favorites';
const TEMPLATE_IMAGES_API = '/mobile/api/anima-template-images';

const CHINESE_NAME_GLOSSARY: Array<[string, string]> = [
  ['Criss-Cross Halter', '交叉吊带'],
  ['Virgin Destroyer', '童贞杀手'],
  ['Slingshot Swimsuit', '吊带泳衣'],
  ['Detached Sleeves', '可拆卸袖套'],
  ['Mash Kyrielight', '玛修·基列莱特'],
  ['Terminator Armor', '终结者装甲'],
  ['Halterneck', '挂颈式'],
  ['Randoseru', '日式书包'],
  ['Serafuku', '水手服'],
  ['Bodystocking', '连身袜'],
  ['Langerie', '内衣'],
  ['Lingerie', '内衣'],
  ['Onmyoji', '阴阳师'],
  ['Laurel Toga', '月桂托加袍'],
  ['Cyborg', '赛博格'],
  ['Polearm', '长柄武器'],
  ['Valkyrie', '女武神'],
  ['Babydoll', '娃娃装'],
  ['Leotard', '紧身衣'],
  ['Taimanin', '对魔忍'],
  ['Sideless', '侧面镂空'],
  ['Sideboob', '侧乳'],
  ['Hitodama', '人魂'],
  ['Fedora', '软呢帽'],
  ['Choker', '项圈'],
  ['Midriff', '腹部'],
  ['Navel', '肚脐'],
  ['Tiara', '头冠'],
  ['Tabard', '罩袍'],
  ['Miko', '巫女'],
  ['Maebari', '前贴'],
  ['Pasties', '乳贴'],
  ['Ofuda', '御札'],
  ['Cosplay', '角色扮演'],
  ['Groin', '腹股沟'],
  ['Pom Pom', '绒球'],
  ['Ascot', '领巾'],
];

const CHINESE_SEARCH_ALIAS_GROUPS = [
  ['挂颈', '挂脖', '吊颈', '绕颈'],
  ['裙子', '裙装', '连衣裙'],
  ['晚礼服', '礼服'],
  ['女仆', '女仆装', '女仆服'],
  ['泳衣', '泳装', '游泳衣'],
  ['内衣', '胸罩', '文胸'],
  ['项圈', '颈圈', '脖圈'],
  ['大腿袜', '过膝袜', '长筒袜'],
  ['连裤袜', '丝袜'],
  ['夹克', '外套'],
  ['兜帽', '连帽'],
  ['短裤', '热裤'],
  ['长靴', '靴子'],
  ['露肩', '一字肩'],
  ['透视', '透明'],
  ['水手服', '海军服', '校服'],
  ['高跟鞋', '高跟'],
  ['发饰', '头饰'],
  ['蝴蝶结', '领结'],
  ['吊带', '肩带'],
];

export const ANIMA_SELECTOR_CONFIGS: Record<AnimaSelectorKind, AnimaSelectorConfig> = {
  artist: {
    kind: 'artist',
    label: '画师',
    widgetName: 'artist_tags',
    moduleFile: 'data.js',
    globalKey: 'galleryData',
    accentClassName: 'border-sky-500/50 bg-sky-500/10 text-sky-200',
  },
  character: {
    kind: 'character',
    label: '角色',
    widgetName: 'character_tags',
    moduleFile: 'character_data.js',
    globalKey: 'characterData',
    accentClassName: 'border-fuchsia-500/50 bg-fuchsia-500/10 text-fuchsia-200',
  },
  clothing: {
    kind: 'clothing',
    label: '服装',
    widgetName: 'clothing_tags',
    moduleFile: 'clothing_data.js',
    globalKey: 'clothingData',
    accentClassName: 'border-pink-500/50 bg-pink-500/10 text-pink-200',
  },
  background: {
    kind: 'background',
    label: '场景',
    widgetName: 'background_tags',
    moduleFile: 'background_data.js',
    globalKey: 'backgroundData',
    accentClassName: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-200',
  },
  pose: {
    kind: 'pose',
    label: '姿势',
    widgetName: 'pose_tags',
    moduleFile: 'pose_data.js',
    globalKey: 'poseData',
    accentClassName: 'border-amber-500/50 bg-amber-500/10 text-amber-200',
  },
};

const NODE_SELECTOR_KINDS: Record<string, AnimaSelectorKind[]> = {
  AnimaArtistTagSelector: ['artist'],
  AnimaArtistTagSelectorPlus: ['artist'],
  AnimaCharacterTagSelector: ['character'],
  AnimaCharacterTagSelectorPlus: ['character'],
  AnimaClothingTagSelector: ['clothing'],
  AnimaClothingTagSelectorPlus: ['clothing'],
  AnimaBackgroundTagSelector: ['background'],
  AnimaBackgroundTagSelectorPlus: ['background'],
  AnimaPoseTagSelector: ['pose'],
  AnimaPoseTagSelectorPlus: ['pose'],
  AnimaPromptPlus: ['artist', 'character', 'clothing', 'background', 'pose'],
  AnimaPromptPlusClipEncode: ['artist', 'character', 'clothing', 'background', 'pose'],
};

const dataCache = new Map<AnimaSelectorKind, AnimaSelectorItem[]>();
let officialCharacterDataPromise: Promise<Record<string, unknown>> | null = null;
let characterLocalizationPromise: Promise<AnimaZhAliasData> | null = null;

type AnimaDataWindow = Window & Record<string, unknown>;

interface AnimaZhAlias {
  name_zh: string;
  aliases?: string[];
}

interface AnimaZhAliasData {
  characters: Record<string, AnimaZhAlias>;
  copyrights: Record<string, AnimaZhAlias>;
}

function normalizeLocalizationKey(value: unknown): string {
  return String(value ?? '')
    .replace(/\\([()])/g, '$1')
    .normalize('NFKC')
    .toLocaleLowerCase()
    .replace(/[_:]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function loadCharacterLocalization(): Promise<AnimaZhAliasData> {
  characterLocalizationPromise ??= import('../data/animaZhAliases.json').then(
    (module) => module.default as AnimaZhAliasData,
  );
  return characterLocalizationPromise;
}

export function applyAnimaCharacterLocalization(
  items: AnimaSelectorItem[],
  localization: AnimaZhAliasData,
): AnimaSelectorItem[] {
  return items.map((item) => {
    const nameKey = normalizeLocalizationKey(item.name);
    const copyrightKey = normalizeLocalizationKey(item.copyright);
    const character = localization.characters[`${nameKey}|${copyrightKey}`];
    const copyright = localization.copyrights[copyrightKey];
    if (!character && !copyright) return item;

    return {
      ...item,
      name_zh: character?.name_zh ?? item.name_zh,
      aliases: uniqueTokens([item.aliases, character?.aliases]),
      copyright_zh: copyright?.name_zh,
      copyright_aliases: copyright?.aliases,
    };
  });
}

export function getAnimaSelectorConfigs(
  nodeType: string,
  availableWidgetNames: Iterable<string>,
): AnimaSelectorConfig[] {
  const available = new Set(availableWidgetNames);
  return (NODE_SELECTOR_KINDS[nodeType] ?? [])
    .map((kind) => ANIMA_SELECTOR_CONFIGS[kind])
    .filter((config) => available.has(config.widgetName));
}

export async function loadAnimaSelectorData(
  config: AnimaSelectorConfig,
): Promise<AnimaSelectorItem[]> {
  const cached = dataCache.get(config.kind);
  if (cached) return cached;

  const moduleUrl = `${EXTENSION_JS_BASE}/${config.moduleFile}`;
  await import(/* @vite-ignore */ moduleUrl);
  const raw = (window as unknown as AnimaDataWindow)[config.globalKey];
  if (!Array.isArray(raw)) {
    throw new Error(`Anima-Tools 数据未加载：${config.globalKey}`);
  }

  const loadedItems = raw.filter(
    (item): item is AnimaSelectorItem =>
      Boolean(item) && typeof item === 'object' && typeof item.name === 'string',
  );
  const items =
    config.kind === 'character'
      ? applyAnimaCharacterLocalization(
          loadedItems,
          await loadCharacterLocalization(),
        )
      : loadedItems;
  dataCache.set(config.kind, items);
  return items;
}

export function splitPromptTokens(value: unknown): string[] {
  const values = Array.isArray(value) ? value : [value];
  return values.flatMap((entry) =>
    String(entry ?? '')
      .split(',')
      .map((token) => token.replace(/^_raw_:/, '').trim())
      .filter(Boolean),
  );
}

function cleanLocalizedText(value: unknown): string {
  return String(value ?? '')
    .replace(/\\([()（）])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function simplifyChineseTag(value: string): string {
  return cleanLocalizedText(value)
    .replace(/^[(（](.+?)(?::\d+(?:\.\d+)?)?[)）]$/, '$1')
    .replace(/\s+[(（][^)）]+[)）]\s*$/, '')
    .trim();
}

function replaceGlossaryTerms(value: string): string {
  let translated = value;
  for (const [english, chinese] of CHINESE_NAME_GLOSSARY) {
    const escaped = english.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    translated = translated.replace(new RegExp(escaped, 'gi'), chinese);
  }
  return translated
    .replace(/\s*&\s*/g, '、')
    .replace(/\s+和\s+/g, '、')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getAnimaDisplayName(item: AnimaSelectorItem): string {
  const localized = replaceGlossaryTerms(cleanLocalizedText(item.name_zh));
  if (localized && !/[A-Za-z]/.test(localized)) return localized;

  const expectedParts = Math.max(1, item.name.split(/\s*&\s*/).length);
  const translatedTags = splitPromptTokens(item.tags_zh)
    .map(simplifyChineseTag)
    .filter((tag) => /[\u3400-\u9fff]/.test(tag) && !/[A-Za-z]/.test(tag))
    .slice(0, expectedParts);
  if (translatedTags.length > 0) return translatedTags.join('、');

  return localized || cleanLocalizedText(item.name);
}

function normalizeSearchText(value: unknown): string {
  return cleanLocalizedText(value)
    .normalize('NFKC')
    .toLocaleLowerCase()
    .replace(/[_/\\|，、；;：:（）()[\]{}]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function expandChineseSearchTerm(term: string): string[] {
  const normalized = normalizeSearchText(term);
  const aliases = CHINESE_SEARCH_ALIAS_GROUPS.find((group) =>
    group.some((alias) => normalized.includes(normalizeSearchText(alias))),
  );
  return aliases ? [normalized, ...aliases.map(normalizeSearchText)] : [normalized];
}

export function matchesAnimaItemSearch(
  item: AnimaSelectorItem,
  query: string,
): boolean {
  const queryTerms = normalizeSearchText(query).split(/\s+/).filter(Boolean);
  if (queryTerms.length === 0) return true;

  const searchable = normalizeSearchText(
    [
      getAnimaDisplayName(item),
      item.name,
      item.name_zh,
      item.tags,
      item.tags_zh,
      item.copyright,
      item.copyright_zh,
      item.copyright_aliases,
      item.categories,
      item.traits,
      item.aliases,
      item.customContent,
    ]
      .flat()
      .filter(Boolean)
      .join(' '),
  );
  return queryTerms.every((term) =>
    expandChineseSearchTerm(term).some((candidate) => searchable.includes(candidate)),
  );
}

function uniqueTokens(values: unknown[]): string[] {
  const result: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    for (const token of splitPromptTokens(value)) {
      const key = token.toLocaleLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        result.push(token);
      }
    }
  }
  return result;
}

export function getAnimaItemKey(item: AnimaSelectorItem): string {
  if (item.isCustom) return `custom:${String(item.id ?? item.name)}`;
  return String(item.id ?? `${item.name}||${item.copyright ?? ''}`);
}

export function getAnimaFavoriteKey(
  kind: AnimaSelectorKind,
  item: Pick<AnimaSelectorItem, 'id' | 'name'> | AnimaFavoriteItem,
): string {
  if (kind === 'artist' || kind === 'character') return item.name;
  return String(item.id ?? item.name);
}

export function paginateAnimaItems<T>(
  items: T[],
  requestedPage: number,
  requestedPageSize: number,
): AnimaPage<T> {
  const pageSize = Math.max(1, Math.floor(requestedPageSize));
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const page = Math.min(Math.max(1, Math.floor(requestedPage)), totalPages);
  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    page,
    totalPages,
    totalItems: items.length,
  };
}

function normalizeFavoritesSection(value: unknown): AnimaFavoritesSection {
  const section =
    value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Partial<AnimaFavoritesSection>)
      : {};
  const groups = Array.isArray(section.groups)
    ? section.groups.filter(
        (group): group is AnimaFavoriteGroup =>
          Boolean(group) &&
          typeof group === 'object' &&
          typeof group.id === 'string' &&
          typeof group.name === 'string',
      )
    : [];
  if (!groups.some((group) => group.id === 'default')) {
    groups.unshift({ id: 'default', name: 'Default Favorites', isSystem: true });
  }

  const items = Array.isArray(section.items)
    ? section.items.filter(
        (item): item is AnimaFavoriteItem =>
          Boolean(item) && typeof item === 'object' && typeof item.name === 'string',
      )
    : [];

  return { groups, items };
}

export async function loadAnimaFavoritesSection(
  kind: AnimaSelectorKind,
): Promise<AnimaFavoritesSection> {
  const response = await fetch(FAVORITES_API);
  if (!response.ok) {
    throw new Error(`收藏加载失败（${response.status}）`);
  }
  const payload: unknown = await response.json();
  const record =
    payload && typeof payload === 'object' && !Array.isArray(payload)
      ? (payload as Record<string, unknown>)
      : {};
  return normalizeFavoritesSection(record[kind]);
}

export function getAnimaCustomItems(
  section: AnimaFavoritesSection,
): AnimaSelectorItem[] {
  return section.items
    .filter(
      (item) =>
        item.isCustom &&
        typeof item.customContent === 'string' &&
        item.customContent.trim().length > 0,
    )
    .map((item) => ({
      id: item.name,
      name: item.nickname?.trim() || item.name,
      tags: item.customContent,
      preview: item.preview,
      isCustom: true,
      customContent: item.customContent,
    }));
}

export async function saveAnimaFavoritesSection(
  kind: AnimaSelectorKind,
  section: AnimaFavoritesSection,
): Promise<AnimaFavoritesSection> {
  const nextSection = normalizeFavoritesSection(section);
  const response = await fetch(FAVORITES_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ [kind]: nextSection }),
  });
  if (!response.ok) {
    throw new Error(`收藏保存失败（${response.status}）`);
  }
  return nextSection;
}

export async function saveAnimaTemplateImage(
  path: string,
  source: 'output' | 'input' | 'temp' = 'output',
): Promise<{ preview: string; filename: string }> {
  const response = await fetch(TEMPLATE_IMAGES_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, source }),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(payload.error || `模板图片保存失败（${response.status}）`);
  }
  return response.json() as Promise<{ preview: string; filename: string }>;
}

export async function deleteAnimaTemplateImage(filename: string): Promise<void> {
  if (!filename) return;
  const response = await fetch(TEMPLATE_IMAGES_API, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename }),
  });
  if (!response.ok && response.status !== 404) {
    throw new Error(`模板图片删除失败（${response.status}）`);
  }
}

export function isAnimaItemFavorite(
  kind: AnimaSelectorKind,
  item: AnimaSelectorItem,
  section: AnimaFavoritesSection,
): boolean {
  const key = getAnimaFavoriteKey(kind, item);
  return section.items.some(
    (favorite) =>
      !favorite.isCustom &&
      getAnimaFavoriteKey(kind, favorite) === key &&
      (kind === 'artist' ||
        kind === 'character' ||
        !Array.isArray(favorite.groupIds) ||
        favorite.groupIds.length > 0),
  );
}

export async function setAnimaItemFavorite(
  kind: AnimaSelectorKind,
  item: AnimaSelectorItem,
  section: AnimaFavoritesSection,
  favorite: boolean,
): Promise<AnimaFavoritesSection> {
  const key = getAnimaFavoriteKey(kind, item);
  const existing = section.items.find(
    (entry) => !entry.isCustom && getAnimaFavoriteKey(kind, entry) === key,
  );
  let items = section.items.filter(
    (entry) => entry.isCustom || getAnimaFavoriteKey(kind, entry) !== key,
  );

  if (favorite) {
    const groupIds =
      existing?.groupIds?.length ? [...existing.groupIds] : ['default'];
    items = [
      ...items,
      {
        ...existing,
        ...(kind === 'artist' || kind === 'character' ? {} : { id: item.id }),
        name: item.name,
        nickname: existing?.nickname ?? '',
        groupIds,
        isCustom: false,
      },
    ];
  }

  const nextSection = {
    groups: section.groups.map((group) => ({ ...group })),
    items,
  };
  return saveAnimaFavoritesSection(kind, nextSection);
}

export function getInitiallySelectedAnimaItems(
  kind: AnimaSelectorKind,
  items: AnimaSelectorItem[],
  currentValue: unknown,
): Set<string> {
  const currentTokens = new Set(
    splitPromptTokens(currentValue).map((token) =>
      token.replace(/^@/, '').trim().toLocaleLowerCase(),
    ),
  );
  const selected = new Set<string>();

  for (const item of items) {
    if (item.isCustom) {
      const itemTokens = splitPromptTokens(item.customContent).map((token) =>
        token.toLocaleLowerCase(),
      );
      if (itemTokens.length > 0 && itemTokens.every((token) => currentTokens.has(token))) {
        selected.add(getAnimaItemKey(item));
      }
      continue;
    }
    if (kind === 'artist') {
      if (currentTokens.has(item.name.toLocaleLowerCase())) {
        selected.add(getAnimaItemKey(item));
      }
      continue;
    }
    if (kind === 'character') {
      const name = item.name.toLocaleLowerCase();
      const trigger = item.copyright
        ? `${item.name}, ${item.copyright}`.toLocaleLowerCase()
        : name;
      if (
        currentTokens.has(name) ||
        splitPromptTokens(trigger).every((token) => currentTokens.has(token))
      ) {
        selected.add(getAnimaItemKey(item));
      }
      continue;
    }
    const itemTokens = splitPromptTokens(item.tags).map((token) => token.toLocaleLowerCase());
    if (itemTokens.length > 0 && itemTokens.every((token) => currentTokens.has(token))) {
      selected.add(getAnimaItemKey(item));
    }
  }

  return selected;
}

async function loadOfficialCharacterData(): Promise<Record<string, unknown>> {
  if (!officialCharacterDataPromise) {
    officialCharacterDataPromise = fetch(
      `${EXTENSION_JS_BASE}/character_official_data.json`,
    ).then(async (response) => {
      if (!response.ok) {
        throw new Error(`角色标签库加载失败（${response.status}）`);
      }
      const value: unknown = await response.json();
      return value && typeof value === 'object' && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : {};
    });
  }
  return officialCharacterDataPromise;
}

function getLocalOfficialCharacter(
  officialData: Record<string, unknown>,
  item: AnimaSelectorItem,
): Record<string, unknown> | null {
  const key = `${item.name.trim().toLocaleLowerCase()}||${String(item.copyright ?? '')
    .trim()
    .toLocaleLowerCase()}`;
  const value = officialData[key];
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export async function buildAnimaSelectionValue(
  kind: AnimaSelectorKind,
  items: AnimaSelectorItem[],
  includeCharacterTags = false,
): Promise<string> {
  if (items.length === 0) return '';

  if (kind === 'artist') {
    return `${
      uniqueTokens(
        items.map((item) =>
          item.isCustom ? item.customContent : `@${item.name}`,
        ),
      ).join(', ')
    }, `;
  }

  if (kind === 'character') {
    const officialData = includeCharacterTags ? await loadOfficialCharacterData() : {};
    const values: unknown[] = [];
    for (const item of items) {
      if (item.isCustom) {
        values.push(item.customContent);
        continue;
      }
      const official = getLocalOfficialCharacter(officialData, item);
      const trigger =
        (typeof official?.trigger === 'string' && official.trigger) ||
        (item.copyright ? `${item.name}, ${item.copyright}` : item.name);
      values.push(trigger);
      if (includeCharacterTags) {
        const officialTags = official?.tags;
        if (Array.isArray(officialTags) || typeof officialTags === 'string') {
          values.push(officialTags);
        } else {
          values.push(item.gender);
          if (item.hair) values.push(`${item.hair} hair`);
          if (item.eye) values.push(`${item.eye} eyes`);
        }
      }
    }
    const tokens = uniqueTokens(values);
    return tokens.length ? `${tokens.join(', ')}, ` : '';
  }

  const tokens = uniqueTokens(
    items.map((item) => (item.isCustom ? item.customContent : item.tags)),
  );
  return tokens.length ? `${tokens.join(', ')}, ` : '';
}
