import { Component, Suspense, useRef, type PointerEvent, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { DRAWER_ORDER, useArchiveInteraction } from '../../hooks/useArchiveInteraction';
import { CabinetModel } from './CabinetModel';

class SceneBoundary extends Component<{children: ReactNode}, {failed: boolean}> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? null : this.props.children; }
}

export function ArchiveScene() {
  const interaction = useArchiveInteraction();
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const suppressClickUntil = useRef(0);
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (interaction.mode === 'DRAWER_FOCUS' && !interaction.isTransitioning) pointerStart.current = { x: event.clientX, y: event.clientY };
  };
  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (!pointerStart.current || interaction.mode !== 'DRAWER_FOCUS' || !interaction.activeDrawer) return;
    const deltaX = event.clientX - pointerStart.current.x;
    const deltaY = event.clientY - pointerStart.current.y;
    pointerStart.current = null;
    if (Math.abs(deltaY) < 45 || Math.abs(deltaY) <= Math.abs(deltaX) * 1.25) return;
    const current = DRAWER_ORDER.indexOf(interaction.activeDrawer);
    const next = current + (deltaY < 0 ? 1 : -1);
    if (next < 0 || next >= DRAWER_ORDER.length) return;
    suppressClickUntil.current = Date.now() + 350;
    interaction.switchDrawer(DRAWER_ORDER[next]);
  };
  const focused = interaction.mode !== 'CABINET_OVERVIEW' || interaction.isTransitioning;
  return <div className={`scene-shell${focused ? ' is-focused' : ''}`} data-state={interaction.mode} data-active-drawer={interaction.activeDrawer ?? ''} onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerCancel={() => { pointerStart.current = null; }}>
    <SceneBoundary><Suspense fallback={null}>
      <Canvas orthographic frameloop="demand" dpr={[1, 2]} gl={{ antialias: true, alpha: true, toneMapping: THREE.NoToneMapping }} fallback={null} onPointerMissed={interaction.returnToOverview}>
        <CabinetModel interaction={interaction} suppressClickUntil={suppressClickUntil}/>
      </Canvas>
    </Suspense></SceneBoundary>
  </div>;
}
