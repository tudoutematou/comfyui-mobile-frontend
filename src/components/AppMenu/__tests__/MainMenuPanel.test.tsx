import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MainMenuPanel } from '../MainMenuPanel';

describe('MainMenuPanel media assets entry', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it('opens the full media browser from an explicit menu button', async () => {
    const onOpenMediaAssets = vi.fn();

    await act(async () => {
      root.render(
        <MainMenuPanel
          error={null}
          workflow={null}
          currentFilename={null}
          isDirty={false}
          loading={false}
          restartingServer={false}
          systemStats={null}
          cpuPercent={null}
          menuSectionsOpen={{ load: false, save: false, server: false, info: false }}
          fileInputRef={{ current: null }}
          loadSectionRef={{ current: null }}
          saveSectionRef={{ current: null }}
          serverSectionRef={{ current: null }}
          infoSectionRef={{ current: null }}
          onDismissError={vi.fn()}
          onFileChange={vi.fn()}
          onLoadFromFile={vi.fn()}
          onToggleSection={vi.fn()}
          onOpenRecent={vi.fn()}
          onOpenUserWorkflows={vi.fn()}
          onOpenTemplates={vi.fn()}
          onOpenPasteJson={vi.fn()}
          onSave={vi.fn()}
          onOpenSaveAs={vi.fn()}
          onOpenLegend={vi.fn()}
          onRestartServer={vi.fn()}
          onOpenGenerationSettings={vi.fn()}
          onOpenCustomNodes={vi.fn()}
          onOpenMediaAssets={onOpenMediaAssets}
        />,
      );
    });

    const button = Array.from(container.querySelectorAll('button')).find(
      (candidate) => candidate.textContent?.includes('Media assets'),
    );
    expect(button).toBeTruthy();

    await act(async () => {
      button?.click();
    });
    expect(onOpenMediaAssets).toHaveBeenCalledTimes(1);
  });
});
