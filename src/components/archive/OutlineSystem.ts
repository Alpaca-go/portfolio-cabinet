import * as THREE from 'three';

// Screen-space inverted hulls outline silhouettes without exposing bevel topology.
export function addOutlines(scene: THREE.Object3D) {
  const hullMaterial = new THREE.ShaderMaterial({
    uniforms: { resolution: { value: new THREE.Vector2(390, 440) }, thickness: { value: 1.0 } },
    side: THREE.BackSide, depthWrite: false,
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
  const meshes: THREE.Mesh[] = [];
  scene.traverse(node => { if (node instanceof THREE.Mesh) meshes.push(node); });
  for (const mesh of meshes) {
    if (/Module_.*Label|LED_|Rail_|Label_Plate/.test(mesh.name)) continue;
    const hull = new THREE.Mesh(mesh.geometry, hullMaterial);
    hull.name = `${mesh.name}_RuntimeOutline`; hull.raycast = () => {};
    mesh.add(hull);
  }
  // The cabinet shell has subdivided bevels. A bounds-derived outline-only proxy
  // supplies three structural seams without replacing or changing its geometry.
  const body = scene.getObjectByName('Cabinet_Body');
  if (body) {
    const box = new THREE.Box3().setFromObject(body);
    const a=box.min, b=box.max, e=.001;
    const vertices = [
      a.x,b.y+e,b.z+e, b.x+e,b.y+e,b.z+e,
      b.x+e,b.y+e,b.z+e, b.x+e,a.y,b.z+e,
      b.x+e,b.y+e,b.z+e, b.x+e,b.y+e,a.z,
    ];
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
    const seams = new THREE.LineSegments(geometry,new THREE.LineBasicMaterial({color:'#35392e'}));
    // Convert world coordinates to the original body hierarchy so seams follow it.
    const positions = geometry.getAttribute('position');
    for(let i=0;i<positions.count;i++) { const p=body.worldToLocal(new THREE.Vector3().fromBufferAttribute(positions,i)); positions.setXYZ(i,p.x,p.y,p.z); }
    seams.name='Cabinet_RuntimeStructuralSeams'; seams.raycast=()=>{}; body.add(seams);
  }
  return hullMaterial;
}
