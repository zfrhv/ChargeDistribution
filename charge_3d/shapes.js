// Sphere

function sphere_to_horizonts(g) {
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

function create_sphere(radius) {
  const g = new THREE.SphereGeometry(radius, 64, 20)
  sphere_to_horizonts(g)
  let m = new THREE.LineBasicMaterial({color: borders_color});
  return new THREE.LineSegments(g, m);
}

function bounce_off_sphere_boundary(sphere, charge) {
  const relative_position = charge.mesh.position.clone().sub(sphere.mesh.position);
  if (relative_position.length() > sphere.type_p.radius) {
    charge.mesh.position.copy(relative_position.clone().setLength(sphere.type_p.radius).add(sphere.mesh.position));
    const diraction = relative_position.normalize();
    const dot = charge.velocity.dot(diraction);
    charge.velocity.sub(diraction.multiplyScalar(2 * dot));
  }
}

function distribute_charges_in_sphere(sphere) {
  psoitive_charges = sphere.connected_p.positive_charges;
  negative_charges = sphere.connected_p.negative_charges;

  [psoitive_charges, negative_charges].forEach((charges_amount, index) => {
    const q = index == 0 ? 1 : -1;
    for (let i = 0; i < charges_amount; i++) {
      const pos = new THREE.Vector3(
        (Math.random() - 0.5) * sphere.type_p.radius * 2,
        (Math.random() - 0.5) * sphere.type_p.radius * 2,
        (Math.random() - 0.5) * sphere.type_p.radius * 2
      );
      if (pos.length() > sphere.type_p.radius - 0.2) pos.setLength(sphere.type_p.radius - 0.2);

      if (q >= 0) {
        sphere.positive_charges.push(new Charge(sphere, pos, q));
      } else {
        sphere.negative_charges.push(new Charge(sphere, pos, q));
      }
    }
  });
}


// Box

function create_box(width, height, depth) {
  return new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    new THREE.MeshBasicMaterial({ color: borders_color, wireframe: true })
  );
}

function bounce_off_box_boundary(box, charge) {
  const relative_position = charge.mesh.position.clone().sub(box.mesh.position);
  if (Math.abs(relative_position.x) > box.type_p.width/2) {
    charge.mesh.position.x = Math.sign(relative_position.x) * box.type_p.width/2 + box.mesh.position.x;
    charge.velocity.x *= -1;
  }
  if (Math.abs(relative_position.y) > box.type_p.height/2) {
    charge.mesh.position.y = Math.sign(relative_position.y) * box.type_p.height/2 + box.mesh.position.y;
    charge.velocity.y *= -1;
  }
  if (Math.abs(relative_position.z) > box.type_p.depth/2) {
    charge.mesh.position.z = Math.sign(relative_position.z) * box.type_p.depth/2 + box.mesh.position.z;
    charge.velocity.z *= -1;
  }
}

function distribute_charges_in_box(box) {
  psoitive_charges = box.connected_p.positive_charges;
  negative_charges = box.connected_p.negative_charges;

  [psoitive_charges, negative_charges].forEach((charges_amount, index) => {
    const q = index == 0 ? 1 : -1;
    for (let i = 0; i < charges_amount; i++) {
      const pos = new THREE.Vector3(
        (Math.random() - 0.5) * box.type_p.width * 0.9,
        (Math.random() - 0.5) * box.type_p.height * 0.9,
        (Math.random() - 0.5) * box.type_p.depth * 0.9
      );

      if (q >= 0) {
        box.positive_charges.push(new Charge(box, pos, q));
      } else {
        box.negative_charges.push(new Charge(box, pos, q));
      }
    }
  });
}