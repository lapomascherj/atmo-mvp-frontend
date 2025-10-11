import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { ProfileDraft } from '@/types/profile';

const cloneDraft = (draft: ProfileDraft): ProfileDraft => JSON.parse(JSON.stringify(draft)) as ProfileDraft;

export type ProfileTabId =
  | 'overview'
  | 'personal'
  | 'work'
  | 'performance'
  | 'rituals'
  | 'wellness'
  | 'connections'
  | 'documents';

interface ProfileStoreState {
  draft: ProfileDraft | null;
  initialSnapshot: string | null;
  currentTab: ProfileTabId;
  saving: boolean;
  error?: string;
  initialize: (draft: ProfileDraft) => void;
  setDraft: (draft: ProfileDraft) => void;
  updateDraft: (updater: (draft: ProfileDraft) => ProfileDraft) => void;
  setTab: (tab: ProfileTabId) => void;
  setSaving: (saving: boolean) => void;
  setError: (error?: string) => void;
  commitDraft: () => void;
  reset: () => void;
}

const computeSnapshot = (draft: ProfileDraft | null): string | null => {
  if (!draft) return null;
  return JSON.stringify(draft);
};

export const useProfileStore = create<ProfileStoreState>()(
  devtools(
    (set, get) => ({
      draft: null,
      initialSnapshot: null,
      currentTab: 'overview',
      saving: false,
      error: undefined,
      initialize: (draft) =>
        set({
          draft: cloneDraft(draft),
          initialSnapshot: computeSnapshot(draft),
          currentTab: 'overview',
          saving: false,
          error: undefined,
        }),
      setDraft: (draft) =>
        set({
          draft: cloneDraft(draft),
        }),
      updateDraft: (updater) =>
        set((state) => {
          if (!state.draft) return state;
          const next = updater(cloneDraft(state.draft));
          return {
            draft: cloneDraft(next),
          };
        }),
      setTab: (tab) => set({ currentTab: tab }),
      setSaving: (saving) => set({ saving }),
      setError: (error) => set({ error }),
      commitDraft: () => {
        const { draft } = get();
        set({ initialSnapshot: computeSnapshot(draft) });
      },
      reset: () =>
        set({
          draft: null,
          initialSnapshot: null,
          currentTab: 'overview',
          saving: false,
          error: undefined,
        }),
    }),
    { name: 'profile-store' }
  )
);

export const selectProfileDraft = (state: ProfileStoreState) => state.draft;
export const selectProfileTab = (state: ProfileStoreState) => state.currentTab;
export const selectProfileSaving = (state: ProfileStoreState) => state.saving;
export const selectProfileError = (state: ProfileStoreState) => state.error;
export const selectProfileDirty = (state: ProfileStoreState) => {
  if (!state.draft || !state.initialSnapshot) return false;
  return JSON.stringify(state.draft) !== state.initialSnapshot;
};
