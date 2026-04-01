import { useState, useCallback, useEffect } from 'react';
import { StarforceSession, StarforceSessionLog, ActiveSessionData, SessionQueueItem, SessionItemState } from '@/types';
import { sessionApiService as apiService } from '@/services/api';

function queueToItemState(item: SessionQueueItem): SessionItemState {
  return { ...item, currentStar: item.startStar, completed: false };
}

export function useStarforceSession(characterId: string | undefined) {
  const [sessions, setSessions] = useState<StarforceSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeSession, setActiveSession] = useState<ActiveSessionData | null>(null);

  // Reset active session when character changes
  useEffect(() => {
    setActiveSession(null);
  }, [characterId]);

  const loadSessions = useCallback(async () => {
    if (!characterId) return;
    setIsLoading(true);
    try {
      const data = await apiService.getCharacterSessions(characterId);
      setSessions(data);
    } catch {
      // non-critical
    } finally {
      setIsLoading(false);
    }
  }, [characterId]);

  const startSession = useCallback(async (
    name: string | undefined,
    startingMeso: number,
    items: SessionQueueItem[]
  ): Promise<null> => {
    if (!characterId) return null;
    const firstItem = items[0];
    setActiveSession({
      sessionId: null, // created lazily on first log
      characterId,
      sessionName: name,
      startingMeso,
      currentMesoBalance: startingMeso,
      activeItemEquipmentId: firstItem?.equipmentId ?? null,
      items: items.map(queueToItemState),
      logs: [],
    });
    return null;
  }, [characterId]);

  const ensureSession = useCallback(async (name: string | undefined, startingMeso?: number): Promise<string | null> => {
    if (!characterId) return null;
    const session = await apiService.createSession({ characterId, name: name || undefined, startingMeso });
    setActiveSession(prev => prev ? { ...prev, sessionId: session.id } : prev);
    return session.id;
  }, [characterId]);

  const updateItemStar = useCallback((equipmentId: number, newStar: number) => {
    setActiveSession(prev => {
      if (!prev) return prev;
      const items = prev.items.map(item =>
        item.equipmentId === equipmentId
          ? { ...item, currentStar: newStar, completed: newStar >= item.targetStar }
          : item
      );
      const updatedItem = items.find(i => i.equipmentId === equipmentId);
      let nextActiveId = prev.activeItemEquipmentId;
      if (updatedItem?.completed && prev.activeItemEquipmentId === equipmentId) {
        const incomplete = items.filter(i => !i.completed);
        nextActiveId = incomplete[0]?.equipmentId ?? null;
      }
      return { ...prev, items, activeItemEquipmentId: nextActiveId };
    });
  }, []);

  const updateMesoBalance = useCallback((newBalance: number) => {
    setActiveSession(prev => prev ? { ...prev, currentMesoBalance: newBalance } : prev);
  }, []);

  const setActiveItem = useCallback((equipmentId: number) => {
    setActiveSession(prev => prev ? { ...prev, activeItemEquipmentId: equipmentId } : prev);
  }, []);

  const reorderItems = useCallback((newItems: SessionItemState[]) => {
    setActiveSession(prev => prev ? { ...prev, items: newItems } : prev);
  }, []);

  const advanceActiveItem = useCallback(() => {
    setActiveSession(prev => {
      if (!prev) return prev;
      const incomplete = prev.items.filter(i => !i.completed);
      if (incomplete.length === 0) return prev;
      const currentIdx = incomplete.findIndex(i => i.equipmentId === prev.activeItemEquipmentId);
      const nextIdx = (currentIdx + 1) % incomplete.length;
      return { ...prev, activeItemEquipmentId: incomplete[nextIdx].equipmentId };
    });
  }, []);

  const addItemsToSession = useCallback((items: SessionQueueItem[]) => {
    setActiveSession(prev => {
      if (!prev) return prev;
      const newItems = items
        .filter(item => !prev.items.some(e => e.equipmentId === item.equipmentId))
        .map(queueToItemState);
      if (newItems.length === 0) return prev;
      return { ...prev, items: [...prev.items, ...newItems] };
    });
  }, []);

  const addLog = useCallback((log: StarforceSessionLog) => {
    setActiveSession(prev => prev ? { ...prev, logs: [...prev.logs, log] } : prev);
  }, []);

  const deleteLog = useCallback(async (logId: string) => {
    await apiService.deleteSessionLog(logId);
    setActiveSession(prev => {
      if (!prev) return prev;
      const log = prev.logs.find(l => l.id === logId);
      if (!log) return { ...prev, logs: prev.logs.filter(l => l.id !== logId) };

      const newLogs = prev.logs.filter(l => l.id !== logId);

      // If this was the latest log for the item, revert its star and restore meso
      const itemLogs = prev.logs.filter(l => l.equipmentId === log.equipmentId);
      const isLatest = itemLogs[itemLogs.length - 1]?.id === logId;

      const newItems = isLatest
        ? prev.items.map(item =>
            item.equipmentId === log.equipmentId
              ? { ...item, currentStar: log.startStar, completed: log.startStar >= item.targetStar }
              : item
          )
        : prev.items;

      const newBalance = prev.currentMesoBalance + log.totalMesoCost;

      return { ...prev, logs: newLogs, items: newItems, currentMesoBalance: newBalance };
    });
  }, []);

  const endSession = useCallback((endingMeso?: number) => {
    const sessionId = activeSession?.sessionId;
    if (endingMeso !== undefined && sessionId) {
      apiService.updateSession(sessionId, { endingMeso }).catch(() => {});
    }
    setActiveSession(null);
  }, [activeSession]);

  const deleteSession = useCallback(async (sessionId: string) => {
    await apiService.deleteSession(sessionId);
    setSessions(prev => prev.filter(s => s.id !== sessionId));
  }, []);

  return {
    sessions,
    isLoading,
    activeSession,
    loadSessions,
    startSession,
    ensureSession,
    updateItemStar,
    updateMesoBalance,
    setActiveItem,
    reorderItems,
    advanceActiveItem,
    addItemsToSession,
    addLog,
    deleteLog,
    endSession,
    deleteSession,
  };
}
