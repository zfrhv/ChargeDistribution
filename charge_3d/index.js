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
controls.minDistance = 3;
controls.maxDistance = 20;

class Conductor {
  static types = ["sphere", "box"];

  constructor(type, type_p, connected, connected_p) {
    /**
      type: "sphere", "box"
      type_p for sphere: { radius }
      type_p for box: { width, height, depth }
      connected: true
      connected_p if connected: { voltage }
      connected_p if not connected: { positive_charges, negative_charges }
    **/

    this.type = type;
    this.type_p = type_p;
    this.original_type_p = Object.assign({}, type_p);
    this.connected = connected ?? true;
    this.connected_p = connected_p ?? 0;

    this.positive_charges = [];
    this.negative_charges = [];

    if (this.type == "sphere") {
      this.mesh = create_sphere(this.type_p.radius);
    } else if (this.type == "box") {
      this.mesh = create_box(this.type_p.width, this.type_p.height, this.type_p.depth);
    }
    

    if (!this.connected) {
      this.distribute_charges();
    }

    scene.add(this.mesh);
  }

  set radius(r) {
    this.type_p.radius = r;
    this.scale_mesh();
  }
  set width(val) {
    this.type_p.width = val;
    this.scale_mesh();
  }
  set height(val) {
    this.type_p.height = val;
    this.scale_mesh();
  }
  set depth(val) {
    this.type_p.depth = val;
    this.scale_mesh();
  }

  set positive_charges_num(amount) {
    this.set_charges_num(this.positive_charges, amount, 1)
  }

  set negative_charges_num(amount) {
    this.set_charges_num(this.negative_charges, amount, -1)
  }

  set_charges_num(charges, amount, q) {
    const current_amount = charges.length;
    if (current_amount > amount) {
      // Remove random charges
      for (let i = 0; i < current_amount - amount; i++) {
        const index = Math.floor(Math.random() * charges.length);
        scene.remove(charges[index].mesh);
        charges.splice(index, 1);
      }
    } else if (current_amount < amount) {
      // Add new charges around the center
      for (let i = 0; i < amount - current_amount; i++) {
        const pos = new THREE.Vector3(
          (Math.random() - 0.5) + this.mesh.position.x,
          (Math.random() - 0.5) + this.mesh.position.y,
          (Math.random() - 0.5) + this.mesh.position.z
        );
        charges.push(new Charge(this, pos, q));
      }
    }
  }

  scale_mesh() {
    if (this.type == "sphere") {
      this.mesh.scale.setScalar(this.type_p.radius/this.original_type_p.radius);
    } else if (this.type == "box") {
      const n = this.type_p;
      const o = this.original_type_p;
      this.mesh.scale.set(n.width/o.width, n.height/o.height, n.depth/o.depth);
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

  delete() {
    this.positive_charges.forEach(charge => {
      scene.remove(charge.mesh);
    });
    this.negative_charges.forEach(charge => {
      scene.remove(charge.mesh);
    });
    scene.remove(this.mesh);
    this.charge = undefined;
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

  const all_charges = conductors.flatMap(conductor => [conductor.positive_charges, conductor.negative_charges].flat());
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


document.getElementById("clear-btn").onclick = function(e) {
  document.getElementById("conductors").innerHTML = "";
  conductors.forEach(conductor => {
    conductor.delete();
  });
  conductors.length = 0;
}