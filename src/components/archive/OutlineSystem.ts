import * as THREE from 'three';

type OutlineConfig = {
  pattern: RegExp;
  threshold: number;
  role: 'cabinet' | 'drawer' | 'folder' | 'rail' | 'personnel' | 'slot' | 'work-card';
};

const STRUCTURAL_CONFIGS: OutlineConfig[] = [
  { pattern: /^Cabinet_Body_Mesh(?:_\d+)?$/, threshold: 50, role: 'cabinet' },
  { pattern: /^Drawer_(Brand|Packaging|IP)_Mesh(?:_\d+)?$/, threshold: 45, role: 'drawer' },
  { pattern: /^Folder_.*_(Front|Back)$/, threshold: 45, role: 'folder' },
  { pattern: /^Rail_(Brand|Packaging|IP)_(Left|Right)$/, threshold: 45, role: 'rail' },
  { pattern: /^PersonnelModule_Body_Rounded_Mesh(?:_\d+)?$/, threshold: 45, role: 'personnel' },
  { pattern: /^(CardSlot|CardSlot_Accent|PaperExit)$/, threshold: 45, role: 'slot' },
  { pattern: /^WorkCard_(Body|Clip)$/, threshold: 45, role: 'work-card' },
];

const SILHOUETTE_SKIP = [
  /^Module_.*Label$/,
  /^LED_/,
  /^Rail_/,
  /^Label_Plate_/,
  /_RuntimeSurface$/,
];

function collectMeshes(scene: THREE.Object3D) {
  const meshes: THREE.Mesh[] = [];
  scene.traverse(node => { if (node instanceof THREE.Mesh) meshes.push(node); });
  return meshes;
}

function addSilhouetteOutlines(meshes: THREE.Mesh[]) {
  const material = new THREE.ShaderMaterial({
    uniforms: { resolution: { value: new THREE.Vector2(390, 440) }, thickness: { value: 1.25 } },
    side: THREE.BackSide,
    depthTest: true,
    depthWrite: false,
    toneMapped: false,
    vertexShader: `uniform vec2 resolution; uniform float thickness;
      void main() {
        vec4 p = modelViewMatrix * vec4(position, 1.0);
        vec3 n = normalize(normalMatrix * normal);
        vec4 clip = projectionMatrix * p;
        vec2 direction = (projectionMatrix * vec4(n, 0.0)).xy;
        float len = length(direction);
        if (len > 0.0001) clip.xy += direction / len * thickness * 2.0 / resolution * clip.w;
        clip.z += 0.00035 * clip.w;
        gl_Position = clip;
      }`,
    fragmentShader: `void main() { gl_FragColor = vec4(0.055, 0.065, 0.045, 1.0); }`,
  });

  let count = 0;
  for (const mesh of meshes) {
    if (SILHOUETTE_SKIP.some(pattern => pattern.test(mesh.name))) continue;
    const hull = new THREE.Mesh(mesh.geometry, material);
    hull.name = `${mesh.name}_RuntimeSilhouette`;
    hull.renderOrder = 1;
    hull.raycast = () => {};
    hull.userData.outlineLevel = 'silhouette';
    hull.userData.raycastDisabled = true;
    mesh.add(hull);
    count += 1;
  }
  return { material, count };
}

function addStructuralEdges(meshes: THREE.Mesh[]) {
  const material = new THREE.LineBasicMaterial({
    color: '#35392e',
    transparent: true,
    opacity: .82,
    depthTest: true,
    depthWrite: false,
    toneMapped: false,
  });
  let objectCount = 0;
  let segmentCount = 0;

  for (const mesh of meshes) {
    const config = STRUCTURAL_CONFIGS.find(candidate => candidate.pattern.test(mesh.name));
    if (!config) continue;
    const geometry = new THREE.EdgesGeometry(mesh.geometry, config.threshold);
    const edges = new THREE.LineSegments(geometry, material);
    edges.name = `${mesh.name}_RuntimeStructuralEdges`;
    edges.renderOrder = 2;
    edges.raycast = () => {};
    edges.userData.outlineLevel = 'structural';
    edges.userData.outlineRole = config.role;
    edges.userData.thresholdAngle = config.threshold;
    edges.userData.raycastDisabled = true;
    mesh.add(edges);
    objectCount += 1;
    segmentCount += geometry.getAttribute('position').count / 2;
  }
  return { material, objectCount, segmentCount };
}

function addSpecialProxies() {
  // Reserved for genuinely non-derivable structural lines. The refined
  // EdgesGeometry pass covers the current GLB, so no proxy is required.
  return { objectCount: 0 };
}

export function addOutlineSystem(scene: THREE.Object3D) {
  const meshes = collectMeshes(scene);
  const silhouette = addSilhouetteOutlines(meshes);
  const structural = addStructuralEdges(meshes);
  const special = addSpecialProxies();

  // EdgesGeometry recovers the cabinet's important face transitions, so the
  // previous bounds-derived world-space seam proxy is intentionally removed.
  return {
    silhouetteMaterial: silhouette.material,
    structuralMaterial: structural.material,
    silhouetteCount: silhouette.count,
    structuralObjectCount: structural.objectCount,
    structuralSegmentCount: structural.segmentCount,
    specialProxyCount: special.objectCount,
  };
}
