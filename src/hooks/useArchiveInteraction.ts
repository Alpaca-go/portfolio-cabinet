import { useCallback, useState } from 'react';

export type ArchiveMode = 'CABINET_OVERVIEW' | 'DRAWER_FOCUS' | 'DRAWER_SWITCHING';
export type DrawerId = 'brand' | 'packaging' | 'ip';
export const DRAWER_ORDER: DrawerId[] = ['brand', 'packaging', 'ip'];

export function useArchiveInteraction() {
  const [mode, setMode] = useState<ArchiveMode>('CABINET_OVERVIEW');
  const [activeDrawer, setActiveDrawer] = useState<DrawerId | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const focusDrawer = useCallback((drawer: DrawerId) => { if (!isTransitioning) { setActiveDrawer(drawer); setMode('DRAWER_FOCUS'); setIsTransitioning(true); } }, [isTransitioning]);
  const switchDrawer = useCallback((drawer: DrawerId) => { if (!isTransitioning && drawer !== activeDrawer) { setActiveDrawer(drawer); setMode('DRAWER_SWITCHING'); setIsTransitioning(true); } }, [activeDrawer, isTransitioning]);
  const returnToOverview = useCallback(() => { if (!isTransitioning && activeDrawer) { setActiveDrawer(null); setMode('CABINET_OVERVIEW'); setIsTransitioning(true); } }, [activeDrawer, isTransitioning]);
  const finishTransition = useCallback(() => { setMode(activeDrawer ? 'DRAWER_FOCUS' : 'CABINET_OVERVIEW'); setIsTransitioning(false); }, [activeDrawer]);
  const selectDrawer = useCallback((drawer: DrawerId) => { if (mode === 'CABINET_OVERVIEW') focusDrawer(drawer); else switchDrawer(drawer); }, [focusDrawer, mode, switchDrawer]);
  return { mode, activeDrawer, isTransitioning, focusDrawer, switchDrawer, selectDrawer, returnToOverview, finishTransition };
}
export type ArchiveInteraction = ReturnType<typeof useArchiveInteraction>;
