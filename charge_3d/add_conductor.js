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
  let [chose_conductor_p, chose_conductor_r] = create_promise();

  // Conductor type selection
  const type_select = create_select(Conductor.types, "", true, selected_type => {
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
  controller.appendChild(type_select);

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

  // Add charges/potential control
  const charge_control = document.createElement('div');
  const charge_select = create_select(["charges", "voltage"], "charges", false, charge_chose => {
    charge_control.replaceChildren();
    if (charge_chose == "charges") {
      conductor.connected = false;
      conductor.connected_p = { positive_charges: 200, negative_charges: 0 };
      charge_control.appendChild(create_conductor_slider(conductor, "positive_charges_num", c_i, 0, 500, 200, 1));
      charge_control.appendChild(create_conductor_slider(conductor, "negative_charges_num", c_i, 0, 500, 0, 1));
    } else if (charge_chose == "voltage") {
      conductor.connected = true;
      conductor.connected_p = { voltage: 0 };
      charge_control.appendChild(create_conductor_slider(conductor, "voltage", c_i, -100, 100, 0));
    }
  });
  controller.appendChild(charge_select);
  controller.appendChild(charge_control);
  charge_select.dispatchEvent(new Event("change"));
};

function create_promise() {
  let chose_conductor_r;
  let chose_conductor_p = new Promise(r => {
    chose_conductor_r = r;
  });
  return [chose_conductor_p, chose_conductor_r];
}

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

function create_select(slect_options, default_value, one_usage, execute_when_done) {
  const select = document.createElement("select");
  if (default_value == "") {
    const placeholder = document.createElement("option");
    placeholder.hidden = true;
    select.appendChild(placeholder);
  } else {
    select.value = default_value;
  }
  slect_options.forEach(option => {
    const option_el = document.createElement("option");
    option_el.textContent = option;
    select.appendChild(option_el);
  });
  select.addEventListener("change", e => {
    if (one_usage) {
      e.target.disabled = true;
    }
    execute_when_done(e.target.value);
  });
  return select;
}