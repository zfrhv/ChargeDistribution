let preset_shapes = [];

function presets_setup() {
    circle_button.onclick = e => {
        add_preset_drawing("circle");
    };
    dogbone_button.onclick = e => {
        add_preset_drawing("dogbone");
    };
    cctri_button.onclick = e => {
        add_preset_drawing("cctri");
    };
}

function add_preset_drawing(name) {
    preset_shapes.push(name);
}

function clrear_preset() {
  preset_shapes = [];
}

function draw_preset_shapes() {
    noFill();
    stroke(bound_color);
    if (preset_shapes.includes("circle")) {
        circle(width / 2, height / 2, min(width, height) / 1.5);

    }
    if (preset_shapes.includes("dogbone")) {
        const y = height / 2, d = min(width, height) / 4, r = d / 2;
        const cxr = width / 2 + width / 4, cxl = width / 2 - width / 4, theta = PI / 1.2;
        arc(cxr, height / 2, d, d, -theta, theta);
        arc(cxl, height / 2, d, d, PI - theta, PI + theta);
        line(cxr + r * Math.cos(-theta), y + r * Math.sin(-theta), cxl + r * Math.cos(PI + theta), y + r * Math.sin(PI + theta));
        line(cxr + r * Math.cos(theta), y + r * Math.sin(theta), cxl + r * Math.cos(PI - theta), y + r * Math.sin(PI - theta));

    }
    if (preset_shapes.includes("cctri")) {
        const r = min(width, height) / 1.2;
        const cx = width / 2, cy = height / 2;
        const theta = 2 * PI / 3;
        const cx0 = cx + r * Math.cos(PI / 2), cy0 = cy + r * Math.sin(PI / 2),
            cx1 = cx + r * Math.cos(PI / 2 + theta), cy1 = cy + r * Math.sin(PI / 2 + theta),
            cx2 = cx + r * Math.cos(PI / 2 + 2 * theta), cy2 = cy + r * Math.sin(PI / 2 + 2 * theta);
        arc(cx0, cy0, r * Math.sqrt(3), r * Math.sqrt(3), 4 * PI / 3, 5 * PI / 3);
        arc(cx1, cy1, r * Math.sqrt(3), r * Math.sqrt(3), 0, PI / 3);
        arc(cx2, cy2, r * Math.sqrt(3), r * Math.sqrt(3), 2 * PI / 3, PI);
    }
}

const circle_button = document.getElementById('circle-btn');
const dogbone_button = document.getElementById('dogbone-btn');
const cctri_button = document.getElementById('cctri-btn');