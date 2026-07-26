import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  isAutocompletePlusAvailable,
  isCustomScriptsAvailable,
} from '@/api/autocompletePlusClient';
import { getAppPreferences } from '@/api/client/preferences';
import { useAutocompleteStore } from '../useAutocompleteStore';

vi.mock('@/api/autocompletePlusClient', () => ({
  fetchDanbooruTags: vi.fn(async () => []),
  fetchEmbeddingNames: vi.fn(async () => []),
  fetchLoraNames: vi.fn(async () => []),
  isAutocompletePlusAvailable: vi.fn(async () => true),
  isCustomScriptsAvailable: vi.fn(async () => false),
}));

vi.mock('@/api/client/preferences', () => ({
  getAppPreferences: vi.fn(async () => ({ autocompleteEnabled: false })),
  setAppPreferences: vi.fn(async (prefs: { autocompleteEnabled?: boolean }) => prefs),
}));

const isAutocompletePlusAvailableMock = vi.mocked(isAutocompletePlusAvailable);
const isCustomScriptsAvailableMock = vi.mocked(isCustomScriptsAvailable);
const getAppPreferencesMock = vi.mocked(getAppPreferences);

beforeEach(() => {
  vi.clearAllMocks();
  useAutocompleteStore.setState({
    available: false,
    provider: null,
    enabled: false,
    initStatus: 'idle',
    dataStatus: 'idle',
    tags: [],
    loras: [],
    embeddings: [],
  });
  isAutocompletePlusAvailableMock.mockResolvedValue(true);
  isCustomScriptsAvailableMock.mockResolvedValue(false);
});

describe('useAutocompleteStore', () => {
  it('retries initialization after a transient error', async () => {
    isAutocompletePlusAvailableMock
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(true);
    getAppPreferencesMock.mockResolvedValue({ autocompleteEnabled: false });

    await useAutocompleteStore.getState().ensureInitialized();
    expect(useAutocompleteStore.getState().initStatus).toBe('error');

    await useAutocompleteStore.getState().ensureInitialized();
    expect(useAutocompleteStore.getState()).toMatchObject({
      available: true,
      enabled: false,
      initStatus: 'ready',
    });
    expect(isAutocompletePlusAvailableMock).toHaveBeenCalledTimes(2);
  });

  it('falls back to ComfyUI-Custom-Scripts when Autocomplete-Plus is unavailable', async () => {
    isAutocompletePlusAvailableMock.mockResolvedValue(false);
    isCustomScriptsAvailableMock.mockResolvedValue(true);

    await useAutocompleteStore.getState().ensureInitialized();

    expect(useAutocompleteStore.getState()).toMatchObject({
      available: true,
      provider: 'custom-scripts',
      initStatus: 'ready',
    });
  });
});
