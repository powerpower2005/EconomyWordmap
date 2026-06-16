import { useCallback, useEffect, useState } from 'react';
import { loadLearned, subscribeLearned, toggleLearned as toggleLearnedStore } from '../utils/learnedItems';

export function useLearnedItems() {
  const [learned, setLearned] = useState<Set<string>>(() => loadLearned());

  useEffect(() => subscribeLearned(() => setLearned(loadLearned())), []);

  const toggleLearned = useCallback((id: string) => {
    setLearned(prev => toggleLearnedStore(id, prev));
  }, []);

  const isLearned = useCallback((id: string) => learned.has(id), [learned]);

  return { learned, toggleLearned, isLearned };
}
