import { Component, Suspense, useRef, type PointerEvent, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { DRAWER_ORDER, useArchiveInteraction, type DrawerId } from '../../hooks/useArchiveInteraction';
import { CabinetModel } from './CabinetModel';

class SceneBoundary extends Component<{children: ReactNode}, {failed: boolean}> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <div className="scene-message" role="alert">模型暂时无法显示。<small>请刷新页面，或使用支持 WebGL 的浏览器。</small></div> : this.props.children; }
}

const labels: Record<DrawerId, string> = { brand: 'BRAND DESIGN', packaging: 'PACKAGING DESIGN', ip: 'IP / ILLUSTRATION' };

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
    <SceneBoundary><Suspense fallback={<div className="scene-message" role="status">正在整理档案…<small>LOADING THE ARCHIVE</small></div>}>
      <Canvas orthographic frameloop="demand" dpr={[1, 2]} gl={{ antialias: true, alpha: true, toneMapping: THREE.NoToneMapping }} fallback={<div className="scene-message">请使用支持 WebGL 的浏览器查看档案柜。</div>}>
        <CabinetModel interaction={interaction} suppressClickUntil={suppressClickUntil}/>
      </Canvas>
    </Suspense></SceneBoundary>
    {focused && <div className="drawer-navigation" aria-label="档案分类导航">
      <button className="archive-return" type="button" onClick={interaction.returnToOverview} disabled={interaction.isTransitioning}>← ARCHIVE</button>
      <div className="drawer-indicator">
        {DRAWER_ORDER.map((drawer, index) => <button key={drawer} type="button" className={interaction.activeDrawer === drawer ? 'is-active' : ''} aria-label={`查看 ${labels[drawer]}`} aria-current={interaction.activeDrawer === drawer ? 'true' : undefined} disabled={interaction.isTransitioning} onClick={() => interaction.switchDrawer(drawer)}>
          <span>{String(index + 1).padStart(2, '0')}</span><i aria-hidden="true"/>
        </button>)}
      </div>
      <div className="active-drawer-label" aria-live="polite">{interaction.activeDrawer ? labels[interaction.activeDrawer] : ''}</div>
    </div>}
  </div>;
}
