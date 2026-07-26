import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { getUserImages, type FileItem } from '@/api/client/assets';
import {
  buildAnimaSelectionValue,
  deleteAnimaTemplateImage,
  getAnimaDisplayName,
  getAnimaCustomItems,
  getAnimaItemKey,
  getAnimaSelectorConfigs,
  getInitiallySelectedAnimaItems,
  isAnimaItemFavorite,
  loadAnimaFavoritesSection,
  loadAnimaSelectorData,
  matchesAnimaItemSearch,
  paginateAnimaItems,
  saveAnimaFavoritesSection,
  saveAnimaTemplateImage,
  setAnimaItemFavorite,
  type AnimaSelectorConfig,
  type AnimaSelectorItem,
  type AnimaFavoriteItem,
  type AnimaFavoritesSection,
} from '@/integrations/animaTools';

interface AnimaWidgetDescriptor {
  widgetIndex: number;
  name: string;
  value: unknown;
}

interface AnimaToolsMobileSelectorProps {
  nodeType: string;
  widgets: AnimaWidgetDescriptor[];
  disabled?: boolean;
  onUpdateNodeWidget: (widgetIndex: number, value: unknown, widgetName?: string) => void;
}

const ITEMS_PER_PAGE = 80;
const CUSTOM_IMAGE_LIMIT = 120;

interface CustomTemplateDraft {
  title: string;
  content: string;
  selectedImage: FileItem | null;
  removeImage: boolean;
}

function displayCategory(category: string): string {
  return category.match(/^(.+?)\s*\(/)?.[1]?.trim() || category;
}

function PaginationControls({
  page,
  totalPages,
  totalItems,
  onChange,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  onChange: (page: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-700 bg-slate-900 px-2 py-2">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className="rounded-lg border border-slate-600 px-3 py-2 text-sm disabled:opacity-35"
      >
        上一页
      </button>
      <div className="flex min-w-0 items-center gap-1 text-xs text-slate-300">
        <span className="hidden min-[390px]:inline">共 {totalItems} 项</span>
        <span>第</span>
        <select
          aria-label="选择页码"
          value={page}
          onChange={(event) => onChange(Number(event.target.value))}
          className="rounded-md border border-slate-600 bg-slate-950 px-2 py-1.5 text-sm text-slate-100"
        >
          {Array.from({ length: totalPages }, (_, index) => index + 1).map(
            (pageNumber) => (
              <option key={pageNumber} value={pageNumber}>
                {pageNumber}
              </option>
            ),
          )}
        </select>
        <span>/ {totalPages} 页</span>
      </div>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        className="rounded-lg border border-slate-600 px-3 py-2 text-sm disabled:opacity-35"
      >
        下一页
      </button>
    </div>
  );
}

function CustomTemplateEditor({
  config,
  existing,
  onClose,
  onSave,
}: {
  config: AnimaSelectorConfig;
  existing: AnimaFavoriteItem | null;
  onClose: () => void;
  onSave: (draft: CustomTemplateDraft) => Promise<void>;
}) {
  const [title, setTitle] = useState(existing?.nickname?.trim() || '');
  const [content, setContent] = useState(existing?.customContent?.trim() || '');
  const [selectedImage, setSelectedImage] = useState<FileItem | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [images, setImages] = useState<FileItem[]>([]);
  const [imageQuery, setImageQuery] = useState('');
  const [loadingImages, setLoadingImages] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const openImagePicker = async () => {
    setShowImagePicker(true);
    if (images.length > 0 || loadingImages) return;
    setLoadingImages(true);
    try {
      const loaded = await getUserImages('output', 1000, 0, 'modified', true);
      setImages(
        loaded
          .filter((item) => item.type === 'image')
          .sort((a, b) => (b.date ?? 0) - (a.date ?? 0))
          .slice(0, CUSTOM_IMAGE_LIMIT),
      );
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '生成图片加载失败');
    } finally {
      setLoadingImages(false);
    }
  };

  const filteredImages = useMemo(() => {
    const normalized = imageQuery.trim().toLocaleLowerCase();
    if (!normalized) return images;
    return images.filter((item) => item.name.toLocaleLowerCase().includes(normalized));
  }, [imageQuery, images]);

  const previewUrl = selectedImage?.previewUrl || (!removeImage ? existing?.preview : '');

  const handleSave = async () => {
    if (!title.trim()) {
      setError('请填写模板名称');
      return;
    }
    if (!content.trim()) {
      setError('请填写提示词内容');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave({
        title: title.trim(),
        content: content.trim(),
        selectedImage,
        removeImage,
      });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '模板保存失败');
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[3200] flex flex-col bg-slate-950 text-slate-100"
      role="dialog"
      aria-modal="true"
      aria-label={`${existing ? '编辑' : '新建'}个人${config.label}模板`}
    >
      <div className="flex items-center gap-3 border-b border-slate-700 bg-slate-900 px-4 py-3">
        <button
          type="button"
          className="rounded-lg border border-slate-600 px-3 py-2 text-sm"
          onClick={onClose}
        >
          返回
        </button>
        <div className="min-w-0 flex-1">
          <div className="font-semibold">
            {existing ? '编辑' : '新建'}个人{config.label}模板
          </div>
          <div className="text-xs text-slate-400">图片会复制保存，原输出图删除后封面仍可用</div>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
            {error}
          </div>
        )}
        <label className="block">
          <span className="mb-1.5 block text-sm text-slate-300">模板名称</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={`例如：我的${config.label}模板`}
            className="w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-3 text-base outline-none focus:border-cyan-400"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm text-slate-300">提示词内容</span>
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="输入要插入工作流的英文提示词，用逗号分隔"
            rows={7}
            className="w-full resize-y rounded-xl border border-slate-600 bg-slate-900 px-3 py-3 text-base outline-none focus:border-cyan-400"
          />
        </label>

        <div>
          <div className="mb-1.5 text-sm text-slate-300">模板封面（可选）</div>
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="模板封面预览"
              className="mx-auto max-h-72 w-full rounded-xl border border-slate-700 bg-slate-900 object-contain"
            />
          ) : (
            <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-slate-600 bg-slate-900 text-sm text-slate-500">
              尚未选择图片
            </div>
          )}
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => void openImagePicker()}
              className="rounded-xl border border-cyan-500/60 bg-cyan-500/10 px-3 py-3 text-sm text-cyan-100"
            >
              从生成图片选择
            </button>
            <button
              type="button"
              disabled={!previewUrl}
              onClick={() => {
                setSelectedImage(null);
                setRemoveImage(true);
              }}
              className="rounded-xl border border-slate-600 px-3 py-3 text-sm disabled:opacity-40"
            >
              移除封面
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 border-t border-slate-700 bg-slate-900 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          className="rounded-xl border border-slate-600 py-3 font-semibold"
          onClick={onClose}
        >
          取消
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => void handleSave()}
          className="rounded-xl bg-cyan-400 py-3 font-semibold text-slate-950 disabled:opacity-50"
        >
          {saving ? '正在保存……' : '保存模板'}
        </button>
      </div>

      {showImagePicker && (
        <div className="fixed inset-0 z-[3300] flex flex-col bg-slate-950">
          <div className="flex items-center gap-3 border-b border-slate-700 bg-slate-900 px-4 py-3">
            <button
              type="button"
              className="rounded-lg border border-slate-600 px-3 py-2 text-sm"
              onClick={() => setShowImagePicker(false)}
            >
              返回
            </button>
            <div className="font-semibold">选择最近生成的图片</div>
          </div>
          <div className="border-b border-slate-800 p-3">
            <input
              value={imageQuery}
              onChange={(event) => setImageQuery(event.target.value)}
              placeholder="按文件名搜索"
              className="w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-3 text-base outline-none focus:border-cyan-400"
            />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {loadingImages && (
              <div className="py-12 text-center text-slate-400">正在加载生成图片……</div>
            )}
            {!loadingImages && filteredImages.length === 0 && (
              <div className="py-12 text-center text-slate-400">没有找到可用图片</div>
            )}
            <div className="grid grid-cols-2 gap-3">
              {filteredImages.map((image) => (
                <button
                  type="button"
                  key={image.id}
                  onClick={() => {
                    setSelectedImage(image);
                    setRemoveImage(false);
                    setShowImagePicker(false);
                  }}
                  className="overflow-hidden rounded-xl border border-slate-700 bg-slate-900 text-left active:border-cyan-400"
                >
                  <img
                    src={image.previewUrl}
                    alt=""
                    loading="lazy"
                    className="aspect-square w-full object-cover"
                  />
                  <span className="block truncate p-2 text-xs text-slate-300">
                    {image.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
}

function SelectorModal({
  config,
  widget,
  onClose,
  onApply,
}: {
  config: AnimaSelectorConfig;
  widget: AnimaWidgetDescriptor;
  onClose: () => void;
  onApply: (value: string) => void;
}) {
  const [items, setItems] = useState<AnimaSelectorItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [requestedPage, setRequestedPage] = useState(1);
  const [includeCharacterTags, setIncludeCharacterTags] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingFavorites, setLoadingFavorites] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingFavoriteKeys, setSavingFavoriteKeys] = useState<Set<string>>(new Set());
  const [editingCustom, setEditingCustom] = useState<AnimaFavoriteItem | 'new' | null>(
    null,
  );
  const [favoritesSection, setFavoritesSection] = useState<AnimaFavoritesSection>({
    groups: [{ id: 'default', name: 'Default Favorites', isSystem: true }],
    items: [],
  });
  const [error, setError] = useState('');
  const [favoriteError, setFavoriteError] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    loadAnimaSelectorData(config)
      .then((loaded) => {
        if (cancelled) return;
        setItems(loaded);
        const officialSelected = getInitiallySelectedAnimaItems(
          config.kind,
          loaded,
          widget.value,
        );
        setSelected((previous) => new Set([...previous, ...officialSelected]));
      })
      .catch((reason: unknown) => {
        if (!cancelled) {
          setError(reason instanceof Error ? reason.message : '选择器数据加载失败');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    loadAnimaFavoritesSection(config.kind)
      .then((section) => {
        if (!cancelled) {
          setFavoritesSection(section);
          const customSelected = getInitiallySelectedAnimaItems(
            config.kind,
            getAnimaCustomItems(section),
            widget.value,
          );
          setSelected((previous) => new Set([...previous, ...customSelected]));
        }
      })
      .catch((reason: unknown) => {
        if (!cancelled) {
          setFavoriteError(
            reason instanceof Error ? reason.message : '收藏加载失败',
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingFavorites(false);
      });
    return () => {
      cancelled = true;
    };
  }, [config, widget.value]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const categories = useMemo(
    () =>
      Array.from(new Set(items.flatMap((item) => item.categories ?? []))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [items],
  );

  const customItems = useMemo(
    () => getAnimaCustomItems(favoritesSection),
    [favoritesSection],
  );
  const allItems = useMemo(() => [...customItems, ...items], [customItems, items]);

  const favoriteKeys = useMemo(
    () =>
      new Set(
        items
          .filter((item) => isAnimaItemFavorite(config.kind, item, favoritesSection))
          .map(getAnimaItemKey),
      ),
    [config.kind, favoritesSection, items],
  );

  const matchingItems = useMemo(() => {
    return allItems
      .filter(
        (item) =>
          item.isCustom || category === 'all' || item.categories?.includes(category),
      )
      .filter(
        (item) =>
          !favoritesOnly || item.isCustom || favoriteKeys.has(getAnimaItemKey(item)),
      )
      .filter((item) => matchesAnimaItemSearch(item, query))
      .sort((a, b) => {
        if (selected.has(getAnimaItemKey(a)) !== selected.has(getAnimaItemKey(b))) {
          return selected.has(getAnimaItemKey(a)) ? -1 : 1;
        }
        if (Boolean(a.isCustom) !== Boolean(b.isCustom)) return a.isCustom ? -1 : 1;
        if (favoriteKeys.has(getAnimaItemKey(a)) !== favoriteKeys.has(getAnimaItemKey(b))) {
          return favoriteKeys.has(getAnimaItemKey(a)) ? -1 : 1;
        }
        return (b.post_count ?? 0) - (a.post_count ?? 0);
      });
  }, [allItems, category, favoriteKeys, favoritesOnly, query, selected]);

  const pageData = useMemo(
    () => paginateAnimaItems(matchingItems, requestedPage, ITEMS_PER_PAGE),
    [matchingItems, requestedPage],
  );

  const changePage = (page: number) => {
    setRequestedPage(page);
    listRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleItem = (item: AnimaSelectorItem) => {
    const key = getAnimaItemKey(item);
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleToggleFavorite = async (item: AnimaSelectorItem) => {
    const itemKey = getAnimaItemKey(item);
    if (savingFavoriteKeys.has(itemKey)) return;
    setSavingFavoriteKeys((previous) => new Set(previous).add(itemKey));
    setFavoriteError('');
    try {
      const nextSection = await setAnimaItemFavorite(
        config.kind,
        item,
        favoritesSection,
        !favoriteKeys.has(itemKey),
      );
      setFavoritesSection(nextSection);
    } catch (reason) {
      setFavoriteError(reason instanceof Error ? reason.message : '收藏保存失败');
    } finally {
      setSavingFavoriteKeys((previous) => {
        const next = new Set(previous);
        next.delete(itemKey);
        return next;
      });
    }
  };

  const handleSaveCustom = async (
    existing: AnimaFavoriteItem | null,
    draft: CustomTemplateDraft,
  ) => {
    let uploadedImage: { preview: string; filename: string } | null = null;
    const previousPreviewFile =
      typeof existing?.previewFile === 'string' ? existing.previewFile : '';
    try {
      if (draft.selectedImage) {
        const prefix = 'output/';
        const path = draft.selectedImage.id.startsWith(prefix)
          ? draft.selectedImage.id.slice(prefix.length)
          : draft.selectedImage.id;
        uploadedImage = await saveAnimaTemplateImage(path, 'output');
      }

      const name =
        existing?.name ||
        `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      const item: AnimaFavoriteItem = {
        ...existing,
        name,
        nickname: draft.title,
        customContent: draft.content,
        groupIds: existing?.groupIds?.length ? existing.groupIds : ['default'],
        isCustom: true,
      };
      if (uploadedImage) {
        item.preview = uploadedImage.preview;
        item.previewFile = uploadedImage.filename;
      } else if (draft.removeImage) {
        delete item.preview;
        delete item.previewFile;
      }

      const itemsWithoutCurrent = favoritesSection.items.filter(
        (entry) => entry.name !== name,
      );
      const nextSection = await saveAnimaFavoritesSection(config.kind, {
        groups: favoritesSection.groups,
        items: [...itemsWithoutCurrent, item],
      });
      setFavoritesSection(nextSection);
      setEditingCustom(null);

      if (
        previousPreviewFile &&
        (uploadedImage || draft.removeImage) &&
        previousPreviewFile !== uploadedImage?.filename
      ) {
        void deleteAnimaTemplateImage(previousPreviewFile).catch(() => undefined);
      }
    } catch (reason) {
      if (uploadedImage) {
        void deleteAnimaTemplateImage(uploadedImage.filename).catch(() => undefined);
      }
      throw reason;
    }
  };

  const handleDeleteCustom = async (item: AnimaSelectorItem) => {
    const favorite = favoritesSection.items.find(
      (entry) => entry.isCustom && entry.name === String(item.id),
    );
    if (!favorite) return;
    if (!window.confirm(`确定删除个人模板“${favorite.nickname || favorite.name}”吗？`)) {
      return;
    }
    setFavoriteError('');
    try {
      const nextSection = await saveAnimaFavoritesSection(config.kind, {
        groups: favoritesSection.groups,
        items: favoritesSection.items.filter((entry) => entry !== favorite),
      });
      setFavoritesSection(nextSection);
      setSelected((previous) => {
        const next = new Set(previous);
        next.delete(getAnimaItemKey(item));
        return next;
      });
      if (typeof favorite.previewFile === 'string') {
        void deleteAnimaTemplateImage(favorite.previewFile).catch(() => undefined);
      }
    } catch (reason) {
      setFavoriteError(reason instanceof Error ? reason.message : '模板删除失败');
    }
  };

  const handleApply = async () => {
    setSaving(true);
    setError('');
    try {
      const selectedItems = allItems.filter((item) =>
        selected.has(getAnimaItemKey(item)),
      );
      const value = await buildAnimaSelectionValue(
        config.kind,
        selectedItems,
        includeCharacterTags,
      );
      onApply(value);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '应用选择失败');
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[3100] flex flex-col bg-slate-950 text-slate-100"
      role="dialog"
      aria-modal="true"
      aria-label={`Anima ${config.label}选择器`}
    >
      <div className="flex items-center gap-3 border-b border-slate-700 bg-slate-900 px-4 py-3">
        <button
          type="button"
          className="rounded-lg border border-slate-600 px-3 py-2 text-sm"
          onClick={onClose}
        >
          返回
        </button>
        <div className="min-w-0 flex-1">
          <div className="font-semibold">Anima {config.label}选择器</div>
          <div className="text-xs text-slate-400">已选 {selected.size} 项</div>
        </div>
        <button
          type="button"
          className="rounded-lg border border-red-500/50 px-3 py-2 text-sm text-red-300"
          onClick={() => setSelected(new Set())}
        >
          清空
        </button>
      </div>

      <div className="grid gap-2 border-b border-slate-800 bg-slate-900/95 p-3">
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setRequestedPage(1);
          }}
          placeholder={`搜索${config.label}名称或标签`}
          autoFocus
          className="w-full rounded-xl border border-slate-600 bg-slate-950 px-3 py-3 text-base text-slate-100 outline-none focus:border-cyan-400"
        />
        {categories.length > 0 && (
          <select
            value={category}
            onChange={(event) => {
              setCategory(event.target.value);
              setRequestedPage(1);
            }}
            className="w-full rounded-xl border border-slate-600 bg-slate-950 px-3 py-3 text-slate-100"
          >
            <option value="all">全部分类</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {displayCategory(item)}
              </option>
            ))}
          </select>
        )}
        <button
          type="button"
          aria-pressed={favoritesOnly}
          disabled={loadingFavorites}
          onClick={() => {
            setFavoritesOnly((value) => !value);
            setRequestedPage(1);
          }}
          className={`rounded-xl border px-3 py-3 text-left text-sm font-semibold disabled:opacity-50 ${
            favoritesOnly
              ? 'border-rose-400 bg-rose-500/20 text-rose-100'
              : 'border-slate-600 bg-slate-950 text-slate-200'
          }`}
        >
          {favoritesOnly
            ? '♥ 正在查看我的收藏和个人模板'
            : `♡ 我的收藏（${favoriteKeys.size + customItems.length}）`}
        </button>
        {config.kind !== 'artist' && (
          <button
            type="button"
            disabled={loadingFavorites}
            onClick={() => setEditingCustom('new')}
            className="rounded-xl border border-cyan-500/60 bg-cyan-500/10 px-3 py-3 text-left text-sm font-semibold text-cyan-100 disabled:opacity-50"
          >
            ＋ 新建个人{config.label}模板
          </button>
        )}
        {config.kind === 'character' && (
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={includeCharacterTags}
              onChange={(event) => setIncludeCharacterTags(event.target.checked)}
            />
            同时加入角色外观标签
          </label>
        )}
        {!loading && !error && matchingItems.length > 0 && (
          <PaginationControls
            page={pageData.page}
            totalPages={pageData.totalPages}
            totalItems={pageData.totalItems}
            onChange={changePage}
          />
        )}
      </div>

      <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto p-3">
        {loading && <div className="py-12 text-center text-slate-400">正在加载数据……</div>}
        {error && (
          <div className="mb-3 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
            {error}
          </div>
        )}
        {favoriteError && (
          <div className="mb-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-100">
            {favoriteError}
          </div>
        )}
        {!loading && pageData.items.length === 0 && !error && (
          <div className="py-12 text-center text-slate-400">
            {favoritesOnly
              ? '收藏栏还是空的，可以添加收藏或新建个人模板'
              : '没有找到匹配内容'}
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          {pageData.items.map((item) => {
            const key = getAnimaItemKey(item);
            const isSelected = selected.has(key);
            const isFavorite = favoriteKeys.has(key);
            const isSavingFavorite = savingFavoriteKeys.has(key);
            const displayName = getAnimaDisplayName(item);
            const customFavorite = item.isCustom
              ? favoritesSection.items.find(
                  (entry) => entry.isCustom && entry.name === String(item.id),
                )
              : undefined;
            return (
              <div
                key={key}
                className={`relative overflow-hidden rounded-xl border text-left transition ${
                  isSelected
                    ? 'border-cyan-400 bg-cyan-500/15 ring-1 ring-cyan-400'
                    : 'border-slate-700 bg-slate-900'
                }`}
              >
                <button
                  type="button"
                  aria-pressed={isSelected}
                  aria-label={`选择 ${displayName}`}
                  onClick={() => toggleItem(item)}
                  className="block w-full text-left"
                >
                  {item.preview ? (
                    <img
                      src={item.preview}
                      alt=""
                      loading="lazy"
                      className="aspect-[3/4] w-full bg-slate-800 object-cover"
                    />
                  ) : item.isCustom ? (
                    <span className="flex aspect-[3/4] w-full items-center justify-center bg-slate-800 text-4xl text-slate-500">
                      自定义
                    </span>
                  ) : null}
                  <span className="block p-2">
                    <span className="block line-clamp-2 text-sm font-medium">
                      {displayName}
                    </span>
                    {item.isCustom && (
                      <span className="mt-1 block line-clamp-2 text-xs text-cyan-300">
                        个人模板
                      </span>
                    )}
                    {item.name_zh && (
                      <span className="mt-1 block line-clamp-1 text-xs text-slate-400">
                        {item.name}
                      </span>
                    )}
                    {item.copyright && (
                      <span className="mt-1 block line-clamp-1 text-xs text-slate-500">
                        {item.copyright_zh
                          ? `${item.copyright_zh}（${item.copyright}）`
                          : item.copyright}
                      </span>
                    )}
                  </span>
                </button>
                {item.isCustom ? (
                  <div className="grid grid-cols-2 border-t border-slate-700">
                    <button
                      type="button"
                      onClick={() => customFavorite && setEditingCustom(customFavorite)}
                      className="border-r border-slate-700 py-2 text-sm text-cyan-200"
                    >
                      编辑
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDeleteCustom(item)}
                      className="py-2 text-sm text-red-300"
                    >
                      删除
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    aria-label={`${isFavorite ? '取消收藏' : '添加收藏'} ${displayName}`}
                    aria-pressed={isFavorite}
                    disabled={isSavingFavorite}
                    onClick={() => void handleToggleFavorite(item)}
                    className={`absolute right-2 top-2 z-10 flex h-10 w-10 items-center justify-center rounded-full border text-xl shadow-lg backdrop-blur disabled:opacity-50 ${
                      isFavorite
                        ? 'border-rose-300 bg-rose-500 text-white'
                        : 'border-slate-400/70 bg-slate-950/80 text-slate-100'
                    }`}
                  >
                    {isSavingFavorite ? '…' : isFavorite ? '♥' : '♡'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
        {!loading && !error && matchingItems.length > 0 && (
          <div className="mt-4">
            <PaginationControls
              page={pageData.page}
              totalPages={pageData.totalPages}
              totalItems={pageData.totalItems}
              onChange={changePage}
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 border-t border-slate-700 bg-slate-900 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          className="rounded-xl border border-slate-600 py-3 font-semibold"
          onClick={onClose}
        >
          取消
        </button>
        <button
          type="button"
          className="rounded-xl bg-cyan-400 py-3 font-semibold text-slate-950 disabled:opacity-50"
          onClick={handleApply}
          disabled={saving}
        >
          {saving ? '正在应用……' : `应用（${selected.size}）`}
        </button>
      </div>
      {editingCustom && (
        <CustomTemplateEditor
          config={config}
          existing={editingCustom === 'new' ? null : editingCustom}
          onClose={() => setEditingCustom(null)}
          onSave={(draft) =>
            handleSaveCustom(editingCustom === 'new' ? null : editingCustom, draft)
          }
        />
      )}
    </div>,
    document.body,
  );
}

export function AnimaToolsMobileSelector({
  nodeType,
  widgets,
  disabled,
  onUpdateNodeWidget,
}: AnimaToolsMobileSelectorProps) {
  const configs = useMemo(
    () => getAnimaSelectorConfigs(nodeType, widgets.map((widget) => widget.name)),
    [nodeType, widgets],
  );
  const [activeConfig, setActiveConfig] = useState<AnimaSelectorConfig | null>(null);
  const activeWidget = activeConfig
    ? widgets.find((widget) => widget.name === activeConfig.widgetName)
    : undefined;

  if (configs.length === 0) return null;

  return (
    <>
      <div className="mb-3 grid grid-cols-2 gap-2">
        {configs.map((config) => (
          <button
            type="button"
            key={config.kind}
            disabled={disabled}
            onClick={() => setActiveConfig(config)}
            className={`rounded-xl border px-3 py-3 text-sm font-semibold disabled:opacity-50 ${config.accentClassName}`}
          >
            打开{config.label}选择器
          </button>
        ))}
      </div>
      {activeConfig && activeWidget && (
        <SelectorModal
          config={activeConfig}
          widget={activeWidget}
          onClose={() => setActiveConfig(null)}
          onApply={(value) => {
            onUpdateNodeWidget(activeWidget.widgetIndex, value, activeWidget.name);
            setActiveConfig(null);
          }}
        />
      )}
    </>
  );
}
