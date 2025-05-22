const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Orbit controls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.1;
controls.enablePan = false;
controls.minDistance = 7;
controls.maxDistance = 20;

// Sphere boundary radius
const sphereRadius = 5;

function SphereToQuads(g) {
  let p = g.parameters;
  let segmentsX = p.widthSegments;
  let segmentsY = p.heightSegments-2;
  let mainShift = segmentsX + 1;
  let indices = [];
  for (let i = 0; i < segmentsY + 1; i++) {
    let index11 = 0;
    let index12 = 0;
    for (let j = 0; j < segmentsX; j++) {
      index11 = (segmentsX + 1) * i + j;
      index12 = index11 + 1;
      indices.push(index11 + mainShift, index12 + mainShift);
    }
  }
  g.setIndex(indices);
}

// Draw the sphere as wireframe
const g = new THREE.SphereGeometry(sphereRadius, 64, 20)
SphereToQuads(g)
let m = new THREE.LineBasicMaterial({color: "magenta"});
let o = new THREE.LineSegments(g, m);

scene.add(o);





// Charge object
class Charge {
  constructor(position, charge) {
    this.charge = charge;
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.force = new THREE.Vector3(0, 0, 0);
    this.mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 8, 8),
      new THREE.MeshBasicMaterial({ color: charge > 0 ? 0xff0000 : 0x0000ff })
    );
    this.mesh.position.copy(position);
    scene.add(this.mesh);
  }

  updatePosition(dt) {
    this.velocity.addScaledVector(this.force, dt);
  
    // Apply damping
    this.velocity.multiplyScalar(0.99); // Damping factor (adjust as needed)
  
    this.mesh.position.addScaledVector(this.velocity, dt);
  
    // Bounce off spherical boundary
    const dist = this.mesh.position.length();
    if (dist >= sphereRadius - 0.1) {
      const normal = this.mesh.position.clone().normalize();
      const dot = this.velocity.dot(normal);
      this.velocity.sub(normal.multiplyScalar(2 * dot));
      this.mesh.position.setLength(sphereRadius - 0.1);
    }
  }

  resetForce() {
    this.force.set(0, 0, 0);
  }

  applyForceFrom(other) {
    const dir = this.mesh.position.clone().sub(other.mesh.position);
    const distSq = Math.max(dir.lengthSq(), 0.01);
    const forceMag = (this.charge * other.charge) / distSq;
    this.force.add(dir.normalize().multiplyScalar(forceMag));
  }
}

// Create random charges
const charges = [];
const charges_amount = 500;
for (let i = 0; i < 500; i++) {
  const pos = new THREE.Vector3(
    (Math.random() - 0.5) * sphereRadius * 2,
    (Math.random() - 0.5) * sphereRadius * 2,
    (Math.random() - 0.5) * sphereRadius * 2
  );
  if (pos.length() > sphereRadius - 0.2) pos.setLength(sphereRadius - 0.2);

//   const q = Math.random() > 0.5 ? 1 : -1;
//   const q = i < charges_amount/2 ? 1 : -1;
  const q = 1;
  charges.push(new Charge(pos, q));
}

camera.position.z = 12;

// Animate
function animate() {
  requestAnimationFrame(animate);

  for (const c of charges) c.resetForce();
  for (let i = 0; i < charges.length; i++) {
    for (let j = i + 1; j < charges.length; j++) {
      charges[i].applyForceFrom(charges[j]);
      charges[j].applyForceFrom(charges[i]);
    }
  }

  for (const c of charges) c.updatePosition(0.01);

  controls.update(); // update camera orbit
  renderer.render(scene, camera);
}

animate();
