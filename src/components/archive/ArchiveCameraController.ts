import { gsap } from 'gsap';
import * as THREE from 'three';

export type CameraState = { position: THREE.Vector3; target: THREE.Vector3; zoom: number; projectedWidth: number };

function projectedDimensions(camera: THREE.OrthographicCamera, bounds: THREE.Box3) {
  camera.updateMatrixWorld();
  const projected = new THREE.Box3();
  for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) projected.expandByPoint(new THREE.Vector3(x, y, z).applyMatrix4(camera.matrixWorldInverse));
  return projected.getSize(new THREE.Vector3());
}
export function configureOverviewCamera(camera: THREE.OrthographicCamera, bounds: THREE.Box3, width: number, height: number): CameraState {
  const target = bounds.getCenter(new THREE.Vector3());
  const position = target.clone().add(new THREE.Vector3(4.8, 3.4, 6.5));
  camera.position.copy(position); camera.lookAt(target);
  camera.left = -width / 2; camera.right = width / 2; camera.top = height / 2; camera.bottom = -height / 2; camera.near = .1; camera.far = 50;
  const dimensions = projectedDimensions(camera, bounds);
  const targetWidth = Math.min(width * .82, 480);
  camera.zoom = Math.min(targetWidth / dimensions.x, height * .92 / dimensions.y);
  camera.updateProjectionMatrix();
  return { position, target, zoom: camera.zoom, projectedWidth: dimensions.x * camera.zoom };
}
export function addCameraTween(timeline: gsap.core.Timeline, camera: THREE.OrthographicCamera, currentTarget: THREE.Vector3, destination: CameraState, invalidate: () => void) {
  timeline.to(camera.position, { x: destination.position.x, y: destination.position.y, z: destination.position.z, duration: .42, ease: 'power2.inOut' }, 0);
  timeline.to(currentTarget, { x: destination.target.x, y: destination.target.y, z: destination.target.z, duration: .42, ease: 'power2.inOut', onUpdate: () => { camera.lookAt(currentTarget); camera.updateProjectionMatrix(); invalidate(); } }, 0);
  timeline.to(camera, { zoom: destination.zoom, duration: .42, ease: 'power2.inOut' }, 0);
}
export function getDrawerFocusState(drawer: THREE.Object3D, overview: CameraState): CameraState {
  const target = new THREE.Box3().setFromObject(drawer).getCenter(new THREE.Vector3());
  const offset = overview.position.clone().sub(overview.target);
  return { position: target.clone().add(offset), target, zoom: overview.zoom * 1.48, projectedWidth: overview.projectedWidth };
}
