import * as THREE from 'three';

function texture(width: number, height: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d')!; draw(ctx);
  const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 4;
  return map;
}
function attachSurface(anchor: THREE.Object3D, map: THREE.Texture, width: number, height: number) {
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({ map, side: THREE.DoubleSide, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  // Blender anchor surfaces use their local XZ plane, with +Y as the normal.
  plane.rotation.x = -Math.PI / 2;
  plane.position.y = .0005;
  plane.name = `${anchor.name}_RuntimeSurface`;
  anchor.add(plane);
}
export function addGraphicSurfaces(scene: THREE.Object3D) {
  const labels = [['Brand', '01', 'BRAND DESIGN'], ['Packaging', '02', 'PACKAGING DESIGN'], ['IP', '03', 'IP / ILLUSTRATION']];
  for (const [key, number, label] of labels) {
    const anchor = scene.getObjectByName(`Label_${key}_Anchor`);
    if (!anchor) throw new Error(`Missing label anchor: ${key}`);
    const map = texture(1536, 256, ctx => {
      ctx.fillStyle = '#edf0e6'; ctx.fillRect(0, 0, 1536, 256);
      ctx.fillStyle = '#252922'; ctx.font = 'bold 88px Arial'; ctx.textBaseline = 'middle';
      ctx.fillText(number, 49, 135);
      ctx.fillRect(212, 52, 3, 152);
      ctx.font = 'bold 80px Arial'; ctx.fillText(label, 254, 135, 1225);
    });
    attachSurface(anchor, map, .66, .111);
  }
  const cardAnchor = scene.getObjectByName('WorkCard_Front_Anchor');
  if (!cardAnchor) throw new Error('Missing work card anchor');
  attachSurface(cardAnchor, texture(540, 840, ctx => {
    ctx.fillStyle = '#f7f6ed'; ctx.fillRect(0, 0, 540, 840);
    ctx.fillStyle = '#d7f54a'; ctx.fillRect(0, 85, 540, 95);
    ctx.fillStyle = '#252922'; ctx.font = 'bold 53px Arial'; ctx.fillText('WORK ID', 40, 152);
    ctx.fillStyle = '#e0e3d7'; ctx.fillRect(40, 210, 460, 340);
    ctx.fillStyle = '#7a8270'; ctx.beginPath(); ctx.arc(270, 337, 74, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(270, 541, 143, 116, 0, Math.PI, 2 * Math.PI); ctx.fill();
    ctx.fillStyle = '#252922'; ctx.font = 'bold 64px Arial'; ctx.fillText('WANG QI', 40, 645);
    ctx.font = '25px monospace'; ctx.fillText('DESIGNER / 001', 42, 690);
    for(let i=0; i<65; i++) ctx.fillRect(42+i*7, 738, i%3===0?4:2, 39);
    ctx.font = '18px monospace'; ctx.fillText('ARCHIVE PERSONNEL', 42, 812);
  }), .173, .269);
}
