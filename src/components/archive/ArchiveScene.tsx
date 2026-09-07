import { Component, Suspense, useLayoutEffect, useMemo, type ReactNode } from 'react';
import { Canvas, useLoader, useThree } from '@react-three/fiber';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as THREE from 'three';
import { addGraphicSurfaces } from './GraphicSurfaces';
import { addOutlines } from './OutlineSystem';

const modelUrl = '/archive-cabinet-v7.glb';
function Cabinet() {
  const gltf = useLoader(GLTFLoader, modelUrl);
  const { size, camera, invalidate, gl } = useThree();
  const { scene, outline, bounds } = useMemo(() => {
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
    return { scene, outline, bounds };
  }, [gltf]);
  useLayoutEffect(() => {
    const ortho = camera as THREE.OrthographicCamera;
    const center = bounds.getCenter(new THREE.Vector3());
    ortho.position.copy(center).add(new THREE.Vector3(4.8, 3.4, 6.5));
    ortho.lookAt(center); ortho.updateMatrixWorld();
    // Fit the actual projected bounds, including the side module, for every viewport.
    const projected = new THREE.Box3();
    for (const x of [bounds.min.x,bounds.max.x]) for (const y of [bounds.min.y,bounds.max.y]) for (const z of [bounds.min.z,bounds.max.z]) projected.expandByPoint(new THREE.Vector3(x,y,z).applyMatrix4(ortho.matrixWorldInverse));
    const dimensions = projected.getSize(new THREE.Vector3());
    const targetWidth = Math.min(size.width * .70, 390);
    ortho.zoom = Math.min(targetWidth / dimensions.x, size.height * .77 / dimensions.y);
    ortho.left = -size.width / 2; ortho.right = size.width / 2;
    ortho.top = size.height / 2; ortho.bottom = -size.height / 2;
    ortho.near = .1; ortho.far = 50; ortho.updateProjectionMatrix();
    outline.uniforms.resolution.value.set(size.width, size.height);
    invalidate();
    // Read-only diagnostics for visual acceptance and subsequent controller development.
    scene.userData.anchors = ['CardSlot_APPROACH','CardSlot_ENTRY','CardSlot_INSERTED','PaperExit_Anchor'].map(name => ({ name, position: scene.getObjectByName(name)!.getWorldPosition(new THREE.Vector3()).toArray() }));
    gl.domElement.dataset.ready = 'true';
    gl.domElement.dataset.modelWidth = String(dimensions.x * ortho.zoom);
    gl.domElement.dataset.folderCount = String(gltf.scene.getObjectsByProperty('type','Object3D').filter(n => /^Folder_.*_ROOT$/.test(n.name)).length);
  }, [scene, bounds, outline, size, camera, invalidate, gl, gltf]);
  return <primitive object={scene} dispose={null}/>;
}
class SceneBoundary extends Component<{children: ReactNode}, {failed: boolean}> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <div className="scene-message" role="alert">模型暂时无法显示。<small>请刷新页面，或使用支持 WebGL 的浏览器。</small></div> : this.props.children; }
}
export function ArchiveScene() {
  return <div className="scene-shell"><SceneBoundary><Suspense fallback={<div className="scene-message" role="status">正在整理档案…<small>LOADING THE ARCHIVE</small></div>}><Canvas orthographic frameloop="demand" dpr={[1, 1.5]} gl={{ antialias: true, alpha: true, toneMapping: THREE.NoToneMapping }} fallback={<div className="scene-message">请使用支持 WebGL 的浏览器查看档案柜。</div>}><Cabinet/></Canvas></Suspense></SceneBoundary></div>;
}
