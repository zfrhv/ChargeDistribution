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

// Cube boundary
const cubeSize = 8;
const halfSize = cubeSize / 2;
const boundary = new THREE.Mesh(
  new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize),
  new THREE.MeshBasicMaterial({ color: 0x00ffff, wireframe: true })
);
scene.add(boundary);

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
    this.velocity.multiplyScalar(0.99); // Damping
    this.mesh.position.addScaledVector(this.velocity, dt);

    // Bounce off cube boundary
    const pos = this.mesh.position;
    const v = this.velocity;
    const margin = 0.1;

    ['x', 'y', 'z'].forEach(axis => {
      if (Math.abs(pos[axis]) > halfSize - margin) {
        pos[axis] = Math.sign(pos[axis]) * (halfSize - margin);
        v[axis] *= -1;
      }
    });
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

// Create random charges inside the cube
const charges = [];
const charges_amount = 500;
for (let i = 0; i < charges_amount; i++) {
  const pos = new THREE.Vector3(
    (Math.random() - 0.5) * cubeSize * 0.9,
    (Math.random() - 0.5) * cubeSize * 0.9,
    (Math.random() - 0.5) * cubeSize * 0.9
  );
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

  controls.update();
  renderer.render(scene, camera);
}

animate();
