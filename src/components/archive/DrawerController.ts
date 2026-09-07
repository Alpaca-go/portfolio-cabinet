import { gsap } from 'gsap';
import * as THREE from 'three';
import type { DrawerId } from '../../hooks/useArchiveInteraction';

export const DRAWER_NODES: Record<DrawerId, string> = { brand: 'Drawer_Brand_ROOT', packaging: 'Drawer_Packaging_ROOT', ip: 'Drawer_IP_ROOT' };
export type DrawerSetup = Record<DrawerId, { root: THREE.Object3D; initial: THREE.Vector3 }>;
export function readDrawerSetup(scene: THREE.Object3D): DrawerSetup {
  return Object.fromEntries(Object.entries(DRAWER_NODES).map(([id, nodeName]) => { const root = scene.getObjectByName(nodeName); if (!root) throw new Error(`Missing drawer root: ${nodeName}`); return [id, { root, initial: root.position.clone() }]; })) as DrawerSetup;
}
export function addDrawerTweens(timeline: gsap.core.Timeline, drawers: DrawerSetup, activeDrawer: DrawerId | null) {
  for (const [id, drawer] of Object.entries(drawers) as [DrawerId, DrawerSetup[DrawerId]][]) {
    // The authored drawer front is on local +Z; 0.14 is about 14% of its depth.
    timeline.to(drawer.root.position, { x: drawer.initial.x, y: drawer.initial.y, z: drawer.initial.z + (id === activeDrawer ? .14 : 0), duration: .42, ease: 'power2.inOut' }, 0);
  }
}
export function findDrawerId(object: THREE.Object3D): DrawerId | null {
  let node: THREE.Object3D | null = object;
  while (node) { const match = (Object.entries(DRAWER_NODES) as [DrawerId, string][]).find(([, name]) => name === node!.name); if (match) return match[0]; node = node.parent; }
  return null;
}
export function findFolderRoot(object: THREE.Object3D) {
  let node: THREE.Object3D | null = object;
  while (node) { if (/^Folder_(Brand|Packaging|IP)_\d{2}_ROOT$/.test(node.name)) return node; node = node.parent; }
  return null;
}
