const background_color = 0x080d19;
const positive_charges_color = 0xff0000;
const negative_charges_color = 0x0000ff;
const borders_color = 0xC832C8;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
scene.background = new THREE.Color(background_color);
document.getElementById("plot").appendChild(renderer.domElement);

// Orbit controls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.1;
controls.enablePan = false;
controls.minDistance = 7;
controls.maxDistance = 20;

class Conductor {
  constructor(type, type_p, position, connected, connected_p) {
    /**
      type: "sphere", "box"
      type_p for sphere: { radius }
      type_p for box: { width, height, depth }
      position: Vector3()
      connected: true
      connected_p if connected: { voltage }
      connected_p if not connected: { positive_charges, negative_charges }
    **/

    this.type = type;
    this.type_p = type_p;
    this.position = position ?? new THREE.Vector3();
    this.connected = connected ?? true;
    this.connected_p = connected_p ?? 0;

    this.charges = [];

    if (this.type == "sphere") {
      this.object = create_sphere(this.type_p.radius);
    } else if (this.type == "box") {
      this.object = create_box(this.type_p.width, this.type_p.height, this.type_p.depth);
    }
    

    if (!this.connected) {
      this.distribute_charges();
    }
  }

  bounce_off_boundary(charge) {
    if (this.type == "sphere") {
      bounce_off_sphere_boundary(this, charge);
    } else if (this.type == "box") {
      bounce_off_box_boundary(this, charge);
    }
  }

  distribute_charges() {
    if (this.type == "sphere") {
      distribute_charges_in_sphere(this);
    } else if (this.type == "box") {
      distribute_charges_in_box(this);
    }
  }
}


// Charge object
class Charge {
  constructor(conductor, position, charge) {
    this.conductor = conductor;
    this.charge = charge;
    this.velocity = new THREE.Vector3();
    this.force = new THREE.Vector3();
    this.mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 8, 8),
      new THREE.MeshBasicMaterial({ color: charge > 0 ? positive_charges_color : negative_charges_color })
    );
    this.mesh.position.copy(position);
    scene.add(this.mesh);
  }

  updatePosition(dt) {
    this.velocity.addScaledVector(this.force, dt);
  
    // Apply damping
    this.velocity.multiplyScalar(0.99);
  
    this.mesh.position.addScaledVector(this.velocity, dt);
  
    this.conductor.bounce_off_boundary(this);
  }

  applyForceFrom(other) {
    const r = this.mesh.position.clone().sub(other.mesh.position);
    const forceMag = (this.charge * other.charge) / Math.max(r.lengthSq(), 0.01);
    this.force.add(r.normalize().multiplyScalar(forceMag));
  }
}


// Animate
function animate() {
  requestAnimationFrame(animate);

  const all_charges = conductors.flatMap(conductor => conductor.charges);

  // calculate forces
  for (let i = 0; i < all_charges.length; i++) {
    all_charges[i].force.set(0, 0, 0);
    for (let j = 0; j < all_charges.length; j++) {
      if (i != j) {
        all_charges[i].applyForceFrom(all_charges[j]);
      }
    }
  }

  // update locations
  for (const c of all_charges) c.updatePosition(0.01);

  controls.update(); // update camera orbit
  renderer.render(scene, camera);
}


const conductors = [];

camera.position.z = 12;
animate();


// controller

document.getElementById("sphere-btn").onclick = function(e) {
  const sphere = new Conductor("sphere", {radius: 5}, new THREE.Vector3(), false, {positive_charges: 500});
  scene.add(sphere.object);
  conductors.push(sphere);
};

document.getElementById("box-btn").onclick = function(e) {
  const box = new Conductor("box", {width: 8, height: 8, depth: 8}, new THREE.Vector3(), false, {positive_charges: 500});
  scene.add(box.object);
  conductors.push(box);
};