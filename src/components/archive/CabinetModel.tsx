import { useLayoutEffect, useMemo, useRef, type MutableRefObject } from 'react';
import { type ThreeEvent, useLoader, useThree } from '@react-three/fiber';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { gsap } from 'gsap';
import * as THREE from 'three';
import type { ArchiveInteraction } from '../../hooks/useArchiveInteraction';
import { addGraphicSurfaces } from './GraphicSurfaces';
import { addOutlines } from './OutlineSystem';
import { addCameraTween, configureOverviewCamera, getDrawerFocusState, type CameraState } from './ArchiveCameraController';
import { addDrawerTweens, findDrawerId, findFolderRoot, readDrawerSetup } from './DrawerController';

const modelUrl = '/archive-cabinet-v7.glb';
type Props = { interaction: ArchiveInteraction; suppressClickUntil: MutableRefObject<number> };

export function CabinetModel({ interaction, suppressClickUntil }: Props) {
  const gltf = useLoader(GLTFLoader, modelUrl);
  const { size, camera, invalidate, gl } = useThree();
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const overview = useRef<CameraState | null>(null);
  const cameraTarget = useRef(new THREE.Vector3());
  const initialized = useRef(false);
  const interactionRef = useRef(interaction);
  interactionRef.current = interaction;

  const prepared = useMemo(() => {
    const scene = gltf.scene.clone(true);
    scene.traverse(node => {
      if (!(node instanceof THREE.Mesh)) return;
      const flatten = (material: THREE.Material) => {
        const source = material as THREE.MeshStandardMaterial;
        return new THREE.MeshBasicMaterial({ color: source.color, map: source.map, side: THREE.FrontSide, transparent: source.transparent, opacity: source.opacity, toneMapped: false });
      };
      node.material = Array.isArray(node.material) ? node.material.map(flatten) : flatten(node.material);
    });
    const bounds = new THREE.Box3().setFromObject(scene);
    const outline = addOutlines(scene);
    addGraphicSurfaces(scene);
    return { scene, bounds, outline, drawers: readDrawerSetup(scene) };
  }, [gltf]);

  const updateDiagnostics = () => {
    const canvas = gl.domElement;
    canvas.dataset.ready = 'true';
    canvas.dataset.mode = interactionRef.current.mode;
    canvas.dataset.activeDrawer = interactionRef.current.activeDrawer ?? '';
    canvas.dataset.transitioning = String(interactionRef.current.isTransitioning);
    canvas.dataset.cameraZoom = camera.zoom.toFixed(4);
    canvas.dataset.overviewZoom = overview.current?.zoom.toFixed(4) ?? '';
    canvas.dataset.modelWidth = overview.current?.projectedWidth.toFixed(2) ?? '';
    canvas.dataset.folderCount = String(gltf.scene.getObjectsByProperty('type', 'Object3D').filter(n => /^Folder_.*_ROOT$/.test(n.name)).length);
    for (const [id, drawer] of Object.entries(prepared.drawers)) {
      canvas.dataset[`drawer${id[0].toUpperCase()}${id.slice(1)}Offset`] = (drawer.root.position.z - drawer.initial.z).toFixed(4);
    }
  };

  useLayoutEffect(() => {
    const ortho = camera as THREE.OrthographicCamera;
    if (!initialized.current || (!interaction.activeDrawer && !interaction.isTransitioning)) {
      overview.current = configureOverviewCamera(ortho, prepared.bounds, size.width, size.height);
      cameraTarget.current.copy(overview.current.target);
      prepared.outline.uniforms.resolution.value.set(size.width, size.height);
      initialized.current = true;
      updateDiagnostics();
      invalidate();
    }
  }, [camera, invalidate, interaction.activeDrawer, interaction.isTransitioning, prepared, size]);

  useLayoutEffect(() => {
    if (!initialized.current || !overview.current || !interaction.isTransitioning) { updateDiagnostics(); return; }
    timeline.current?.kill();
    const ortho = camera as THREE.OrthographicCamera;
    const destination = interaction.activeDrawer ? getDrawerFocusState(prepared.drawers[interaction.activeDrawer].root, overview.current) : overview.current;
    const next = gsap.timeline({
      onUpdate: () => { updateDiagnostics(); invalidate(); },
      onComplete: () => { interactionRef.current.finishTransition(); updateDiagnostics(); invalidate(); },
    });
    timeline.current = next;
    addDrawerTweens(next, prepared.drawers, interaction.activeDrawer);
    addCameraTween(next, ortho, cameraTarget.current, destination, invalidate);
    return () => { next.kill(); };
  }, [camera, interaction.activeDrawer, interaction.isTransitioning, invalidate, prepared]);

  const onClick = (event: ThreeEvent<MouseEvent>) => {
    if (Date.now() < suppressClickUntil.current || interaction.isTransitioning) return;
    const folder = findFolderRoot(event.object);
    if (folder && interaction.mode === 'DRAWER_FOCUS') {
      event.stopPropagation();
      gl.domElement.dataset.lastFolder = folder.name;
      console.debug(`[P2 hit target] ${folder.name}`);
      return;
    }
    const drawer = findDrawerId(event.object);
    if (drawer) { event.stopPropagation(); interaction.selectDrawer(drawer); return; }
  };

  return <primitive object={prepared.scene} dispose={null} onClick={onClick}/>;
}
