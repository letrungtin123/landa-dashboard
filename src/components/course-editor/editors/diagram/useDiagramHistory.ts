import { useCallback, useState } from 'react';
import { DiagramXBlockData } from '../DiagramEditor';


export function useDiagramHistory(
  initialData: DiagramXBlockData,
  onRestore: (data: DiagramXBlockData) => void
) {
  const [history, setHistory] = useState<DiagramXBlockData[]>([initialData]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const takeSnapshot = useCallback((newData: DiagramXBlockData) => {
    setHistory((prev) => {
      const nextHistory = prev.slice(0, historyIndex + 1);
      nextHistory.push(newData);
      // Keep only last 50 states to save memory
      if (nextHistory.length > 50) {
        nextHistory.shift();
      }
      return nextHistory;
    });
    setHistoryIndex((prev) => Math.min(prev + 1, 50));
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      onRestore(history[prevIndex]);
    }
  }, [historyIndex, history, onRestore]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      onRestore(history[nextIndex]);
    }
  }, [historyIndex, history, onRestore]);

  return {
    undo,
    redo,
    takeSnapshot,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
  };
}
