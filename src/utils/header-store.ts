import { create } from 'zustand';
import { useLayoutEffect } from 'react';

interface HeaderState {
  title: React.ReactNode;
  description?: React.ReactNode;
  setHeaderInfo: (title: React.ReactNode, description?: React.ReactNode) => void;
}

export const useHeaderStore = create<HeaderState>((set) => ({
  title: '',
  description: undefined,
  setHeaderInfo: (title, description) => set({ title, description }),
}));

export function useHeaderInfo(title: React.ReactNode, description?: React.ReactNode) {
  useLayoutEffect(() => {
    useHeaderStore.getState().setHeaderInfo(title, description);
  }, [title, description]);
}
