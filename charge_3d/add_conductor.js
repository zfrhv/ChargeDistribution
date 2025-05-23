const conductors_el = document.getElementById("conductors")

document.getElementById("add-conductor-btn").onclick = async function(e) {

  // The details container elements for a new conductor
  const details = document.createElement('details');
  conductors_el.appendChild(details);
  const summary = document.createElement('summary');
  details.appendChild(summary);
  summary.innerHTML = "Conductor";
  const controller = document.createElement('div');
  controller.className = "conductor-controller";
  details.appendChild(controller);

  // Promise when conductor is chosen
  let chose_conductor_r;
  let chose_conductor_p = new Promise(r => {
    chose_conductor_r = r;
  });

  // Conductor type selection
  const type_select = document.createElement("select");
  controller.appendChild(type_select);
  const placeholder = document.createElement("option");
  placeholder.hidden = true;
  type_select.appendChild(placeholder);
  Conductor.types.forEach(type => {
    const option = document.createElement("option");
    option.textContent = type;
    type_select.appendChild(option);
  });
  type_select.addEventListener("change", e => {
    e.target.disabled = true;
    const selected_type = e.target.value;
    let new_conductor;
    if (selected_type == "sphere") {
      new_conductor = new Conductor(selected_type, {radius: 5}, false, {positive_charges: 200});
    } else if (selected_type == "box") {
      new_conductor = new Conductor(selected_type, {width: 8, height: 8, depth: 8}, false, {positive_charges: 200});
    }
    details.dataset.conductor_index = conductors.length;
    conductors.push(new_conductor);
    chose_conductor_r();
    summary.innerHTML = details.dataset.conductor_index + "." + selected_type;
  });

  await chose_conductor_p;

  const c_i = details.dataset.conductor_index;
  const conductor = conductors[c_i];
  const position = conductor.mesh.position;

  // Add properties configurations
  ['x', 'y', 'z'].forEach(axis => {
    controller.appendChild(create_conductor_slider(conductor.mesh.position, axis, c_i));
  });

  // Add personal configurations
  if (conductor.type == "sphere") {
    controller.appendChild(create_conductor_slider(conductor, "radius", c_i, 0.1, 5, 5));
  } else if (conductor.type == "box") {
    ['width', 'height', 'depth'].forEach(property => {
      controller.appendChild(create_conductor_slider(conductor, property, c_i, 0.1, 10, 8));
    });
  }

  // Add charges control
  controller.appendChild(create_conductor_slider(conductor, "positive_charges_num", c_i, 0, 500, 200, 1));
  controller.appendChild(create_conductor_slider(conductor, "negative_charges_num", c_i, 0, 500, 0, 1));

  // TODO add potential
  // TODO add negative + positive collosions inside potential conductors
};


function create_conductor_slider(obj, name, id, min=-5, max=5, def=0, step=0.01) {
  const slider_container = document.createElement('div');
  slider_container.className = "slider-container";
  slider_container.innerHTML = `
    <div class="controller-left">
        <span class="slider-label">`+name+`: </span><span id="`+name+id+`d">`+def+`</span>
    </div>
    <div class="controller-right">
        <input id="`+name+id+`" class="slider" type="range" min="`+min+`" max="`+max+`" value="`+def+`" step="`+step+`" oninput="`+name+id+`d.textContent = `+name+id+`.value">
    </div>
  `;
  slider_container.querySelector('#'+name+id).addEventListener("input", e => {
    obj[name] = Number(e.target.value);
  });
  return slider_container;
}