import type { Workflow } from '@/api/types';
import type { SystemStats } from '@/api/client';
import { MenuErrorNotice } from './MenuErrorNotice';
import { MenuServerSection } from './MenuServerSection';
import { MenuLoadSection } from './MenuLoadSection';
import { MenuSaveSection } from './MenuSaveSection';
import { MenuAboutSection } from './MenuAboutSection';
import { InboxIcon } from '@/components/icons';
import {
  menuArrowClassName,
  menuIconClassName,
  menuMutedTextClassName,
  menuSurfaceButtonClassName,
  menuTextClassName,
} from './menuStyles';

interface MenuSectionsOpen {
  load: boolean;
  save: boolean;
  server: boolean;
  info: boolean;
}

interface MainMenuPanelProps {
  error: string | null;
  workflow: Workflow | null;
  currentFilename: string | null;
  isDirty: boolean;
  loading: boolean;
  restartingServer: boolean;
  systemStats: SystemStats | null;
  cpuPercent: number | null;
  menuSectionsOpen: MenuSectionsOpen;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  loadSectionRef: React.RefObject<HTMLElement | null>;
  saveSectionRef: React.RefObject<HTMLElement | null>;
  serverSectionRef: React.RefObject<HTMLElement | null>;
  infoSectionRef: React.RefObject<HTMLElement | null>;
  onDismissError: () => void;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onLoadFromFile: () => void;
  onToggleSection: (section: keyof MenuSectionsOpen) => void;
  onOpenRecent: () => void;
  onOpenUserWorkflows: () => void;
  onOpenTemplates: () => void;
  onOpenPasteJson: () => void;
  onSave: () => void;
  onOpenSaveAs: () => void;
  onOpenLegend: () => void;
  onRestartServer: () => void;
  onOpenGenerationSettings: () => void;
  onOpenCustomNodes: () => void;
  onOpenMediaAssets: () => void;
}

export function MainMenuPanel({
  error,
  workflow,
  currentFilename,
  isDirty,
  loading,
  restartingServer,
  systemStats,
  cpuPercent,
  menuSectionsOpen,
  fileInputRef,
  loadSectionRef,
  saveSectionRef,
  serverSectionRef,
  infoSectionRef,
  onDismissError,
  onFileChange,
  onLoadFromFile,
  onToggleSection,
  onOpenRecent,
  onOpenUserWorkflows,
  onOpenTemplates,
  onOpenPasteJson,
  onSave,
  onOpenSaveAs,
  onOpenLegend,
  onRestartServer,
  onOpenGenerationSettings,
  onOpenCustomNodes,
  onOpenMediaAssets,
}: MainMenuPanelProps) {
  return (
    <>
      <MenuErrorNotice error={error} onDismiss={onDismissError} />

      <section className="mb-6" aria-label="Media">
        <button
          type="button"
          onClick={onOpenMediaAssets}
          className={menuSurfaceButtonClassName}
        >
          <InboxIcon className={menuIconClassName} />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className={menuTextClassName}>Media assets</span>
            <span className={`text-xs ${menuMutedTextClassName}`}>
              Browse all generated and imported files
            </span>
          </span>
          <span className={menuArrowClassName}>&rarr;</span>
        </button>
      </section>

      <MenuServerSection
        open={menuSectionsOpen.server}
        systemStats={systemStats}
        cpuPercent={cpuPercent}
        restartingServer={restartingServer}
        sectionRef={serverSectionRef}
        onToggle={() => onToggleSection('server')}
        onRestartServer={onRestartServer}
        onOpenGenerationSettings={onOpenGenerationSettings}
        onOpenCustomNodes={onOpenCustomNodes}
      />

      <MenuLoadSection
        open={menuSectionsOpen.load}
        sectionRef={loadSectionRef}
        fileInputRef={fileInputRef}
        onToggle={() => onToggleSection('load')}
        onFileChange={onFileChange}
        onLoadFromFile={onLoadFromFile}
        onOpenRecent={onOpenRecent}
        onOpenUserWorkflows={onOpenUserWorkflows}
        onOpenTemplates={onOpenTemplates}
        onOpenPasteJson={onOpenPasteJson}
      />

      <MenuSaveSection
        open={menuSectionsOpen.save}
        workflow={workflow}
        currentFilename={currentFilename}
        isDirty={isDirty}
        loading={loading}
        sectionRef={saveSectionRef}
        onToggle={() => onToggleSection('save')}
        onSave={onSave}
        onOpenSaveAs={onOpenSaveAs}
      />

      <MenuAboutSection
        open={menuSectionsOpen.info}
        sectionRef={infoSectionRef}
        systemStats={systemStats}
        workflow={workflow}
        onToggle={() => onToggleSection('info')}
        onOpenLegend={onOpenLegend}
      />
    </>
  );
}
