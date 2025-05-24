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
    this.connected_p = connected_p ?? { voltage: 0 };

    this.positive_charges = [];
    this.negative_charges = [];

    this.voltage_timer = 0;

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

  set voltage(amount) {
    this.connected_p.voltage = amount;
  }

  set_charges_num(charges_arr, amount, q) {
    const current_amount = charges_arr.length;
    if (current_amount > amount) {
      // Remove random charges
      for (let i = 0; i < current_amount - amount; i++) {
        const index = Math.floor(Math.random() * charges_arr.length);
        scene.remove(charges_arr[index].mesh);
        charges_arr.splice(index, 1);
      }
    } else if (current_amount < amount) {
      // Add new charges around the center
      for (let i = 0; i < amount - current_amount; i++) {
        const pos = random_vec(0.5).add(this.mesh.position);
        charges_arr.push(new Charge(this, pos, q));
      }
    }
  }

  update_voltage(all_charges) {
    if (this.connected) { // if voltage-controlled
      let pos = this.mesh.position;
      let voltage = 0;
      let min_r = 100000;

      // calculate the voltage in the center of the conductor
      all_charges.forEach(charge => {
        const r_val = pos.clone().sub(charge.mesh.position).length();
        voltage += charge.charge / Math.max(r_val, 0.01);
        if (r_val < min_r) {
          min_r = r_val;
        }
      });

      const voltage_radius = 0.5
      if (min_r < voltage_radius) {
        const deltas = [-voltage_radius, voltage_radius];
        let best_pos = pos;

        for (let dx of deltas) {
          for (let dy of deltas) {
            for (let dz of deltas) {
              const nearby = new THREE.Vector3( pos.x + dx, pos.y + dy, pos.z + dz );
              let new_voltage = 0;
              all_charges.forEach(charge => {
                new_voltage += charge.charge / Math.max(nearby.clone().sub(charge.mesh.position).length(), 0.01);
              });
              if (Math.abs(new_voltage) < Math.abs(voltage)) {
                voltage = new_voltage;
                best_pos = nearby;
              }
            }
          }
        }

        pos = best_pos;
      }

      // balance the charges +-1 voltage
      const dv = 1;
      const switch_cooldown = 50;

      if (voltage < this.connected_p.voltage - dv) {
        if (this.voltage_timer < 0) {
          this.voltage_timer++;
        } else {
          this.voltage_timer = switch_cooldown;
          const new_pos = random_vec(0.1).add(pos);
          const new_charge = new Charge(this, new_pos, 1);
          new_charge.velocity = random_vec(5);
          this.positive_charges.push(new_charge);
        }
      } else if (voltage > this.connected_p.voltage + dv) {
        if (this.voltage_timer > 0) {
          this.voltage_timer--;
        } else {
          this.voltage_timer = -switch_cooldown;
          const new_pos = random_vec(0.1).add(pos);
          const new_charge = new Charge(this, new_pos, -1);
          new_charge.velocity = random_vec(5);
          this.negative_charges.push(new_charge);
        }
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

function random_vec(cap=1) {
  return new THREE.Vector3(
    (Math.random() - 0.5),
    (Math.random() - 0.5),
    (Math.random() - 0.5)
  ).multiplyScalar(2*cap);
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
    const r_val_2 = r.lengthSq();
    const q_result = this.charge * other.charge

    // if + and - collide and both property of a conductor then cancel them out
    if (r_val_2 < 0.01 && q_result == -1 && this.conductor.connected && other.conductor.connected) {
      return false
    } else { // if not then just add their forces
      const forceMag = q_result / Math.max(r_val_2, 0.01);
      this.force.add(r.normalize().multiplyScalar(forceMag));
      return true
    }
  }
}


// Animate
function animate() {
  requestAnimationFrame(animate);

  let all_charges = conductors.flatMap(conductor => [conductor.positive_charges, conductor.negative_charges].flat());

  conductors.forEach(conductor => {
    conductor.update_voltage(all_charges);
  });

  // calculate forces
  const to_delete = {};
  for (let i = 0; i < all_charges.length; i++) {
    all_charges[i].force.set(0, 0, 0);
    for (let j = 0; j < all_charges.length; j++) {
      if (i != j) {
        const applied_false = all_charges[i].applyForceFrom(all_charges[j]);
        if (!applied_false) {
          // i know its enough to mark only i, and then can use array instead of objec, but im not taking my chance with bugs.
          to_delete[i] = true;
          to_delete[j] = true;
        }
      }
    }
  }

  // delete cancelled charges
  const deleted_charges = Object.keys(to_delete).length > 0;
  for (const index in to_delete) {
    const charge = all_charges[index];
    const charges_arr = charge.charge >= 0 ? charge.conductor.positive_charges : charge.conductor.negative_charges;
    charges_arr.splice(charges_arr.indexOf(charge), 1);
    scene.remove(charge.mesh);
  }
  // updated charges array
  if (deleted_charges) {
    all_charges = conductors.flatMap(conductor => [conductor.positive_charges, conductor.negative_charges].flat());
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