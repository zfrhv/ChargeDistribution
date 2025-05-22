"use strict";

class Charge {
    constructor(x, y) {
        this.pos = createVector(x, y);
        this.velocity = createVector(0, 0);
        this.force = createVector(0, 0);
    }
}

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

let finished_drawing = true, moving_charge = false, start = 0;

let points = buckets.LinkedList();
let charges = buckets.LinkedList();

const C = {
    M: 7.5, // for greater accuracy reduce mass and
    Q: 0.5, // increase charge and
    K: 8.99 * 2, // reduce exponent
    RAND: 800,
    FRICTION: 0.98
};

let bound_color;
let inside_color;
let particle_color;

function setup() {
    const canvas = createCanvas(500, 500);
    canvas.parent('plot');
    canvas.style('border', '1px solid black');
    canvas.style('width', '100%');
    canvas.style('height', '100%');
    canvas.elt.addEventListener('contextmenu', function(e) {
        e.preventDefault();
    });
    // canvas.resizeCanvas();
    bound_color = color(200, 50, 200, 255);
    inside_color = color(40, 56, 93, 255);
    particle_color = color(255, 40, 50, 255);
    background(inside_color);
    strokeWeight(2);
    fill(255, 0);
    pixelDensity(1);
    presets_setup();
}

function draw() {
    reset_screen();
    update_shape();
    draw_preset_shape();
    move_charges();
    update_graph();
}


function on_canvas(x, y) {
    return x >= 0 && y >= 0 && x < width && y < height;
}

function move_charges() {
    if (moving_charge) {
        fill(particle_color);
        noStroke();
        let f = createVector(0, 0, 0);
        charges.forEach(c => {
            charges.forEach(o => {
                if (c !== o) {
                    f.set(p5.Vector.sub(c.pos, o.pos));
                    f.setMag(C.K * C.Q * C.Q / dist(c.pos.x, c.pos.y, o.pos.x, o.pos.y)**2);
                    c.force.add(f);
                }
            });
        });
        charges.forEach(c => {
            if (!on_canvas(c.pos.x, c.pos.y)) { // its ok thats its unefficient cuz particles shouldnt normally escape
                if (c.pos.x < 0) { c.pos.x = 0; }
                if (c.pos.y < 0) { c.pos.y = 0; }
                if (c.pos.x >= width) { c.pos.x = width-1; }
                if (c.pos.y >= height) { c.pos.y = height-1; }
            }
            c.velocity.add(c.force.div(C.M)).mult(C.FRICTION);
            c.pos.add(c.velocity);
            if (pixel_is_inside_color(Math.floor(c.pos.x), Math.floor(c.pos.y))) {
                c.pos.sub(c.velocity);
                c.velocity.rotate(Math.random() * Math.PI * 2).div(1.25); // magic :)
            }
            circle(c.pos.x, c.pos.y, 5);
        });
    }
}

function update_graph() {
    if (moving_charge) {
        let potentialEnergy = 0;
        let i = 0;
        charges.forEach(c => {
            let j = 0;
            charges.forEach(o => {
                if (j > i) {
                    potentialEnergy -= C.K * C.Q * C.Q * dist(c.pos.x, c.pos.y, o.pos.x, o.pos.y);
                }
                j++;
            });
            i++;
        });
    }
}

function update_shape() {
    noFill();
    stroke(bound_color);
    beginShape();
    points.forEach((p) => {
        vertex(p.x, p.y)
    });
    endShape();
    if (!finished_drawing && mouseIsPressed && on_canvas(mouseX, mouseY)) {
        points.add(new Point(mouseX, mouseY));
    }
}

function clear_all() {
    points.clear();
    charges.clear();
    finished_drawing = true;
    moving_charge = false;
    clrear_preset();
}

function keyPressed() {
    if (key === 'c') {
        clear_all();
    } else if (key === 'd' && !points.isEmpty() && !finished_drawing) {
        finished_drawing = true;
        loadPixels();
        points.add(new Point(points.first().x, points.first().y));
    } else if (key === 'q' && finished_drawing && !moving_charge) {
        distribute_charge(Math.floor(mouseX), Math.floor(mouseY));
        moving_charge = true;
        start = frameCount;
    }
}

document.getElementById('clear-btn').onclick = e => {
    clear_all();
};
document.getElementById('finish-drawing-btn').onclick = e => {
    finished_drawing = true;
    loadPixels();
    points.add(new Point(points.first().x, points.first().y));
};
document.getElementById('fill-charges-btn').onclick = e => {
    distribute_charge(width/2, height/2);
    moving_charge = true;
    start = frameCount;
};

function distribute_charge(center_x, center_y) {
    let bfsq = new buckets.Queue();
    bfsq.add(new Point(center_x, center_y));
    while (!bfsq.isEmpty()) {
        let cur = bfsq.dequeue();
        if (pixel_is_inside_color(cur.x, cur.y)) {
            set(cur.x, cur.y, bound_color);
            if (Math.floor(Math.random() * C.RAND) === 0) {
                charges.add(new Charge(cur.x, cur.y));
            }
            bfsq.add(new Point(cur.x + 1, cur.y));
            bfsq.add(new Point(cur.x - 1, cur.y));
            bfsq.add(new Point(cur.x, cur.y + 1));
            bfsq.add(new Point(cur.x, cur.y - 1));
        }
    }
}

function reset_screen() {
    background(inside_color);
}

function pixel_is_inside_color(x, y) {
    const off = 4 * (y * width + x);
    return pixels[off] === red(inside_color) && pixels[off + 1] === green(inside_color) && pixels[off + 2] === blue(inside_color) && pixels[off + 3] === alpha(inside_color);
}


// sliders

let sliders = [
    ["mass", "M"],
    ["charge", "Q", v => {
        return v / 10
    }],
    ["density", "RAND", v => {
        return 1000 / v
    }],
    ["friction", "FRICTION"]
];

sliders.forEach(sp => {
    if (sp.length < 3)
        sp[2] = v => {
            return v
        };
    let sname = sp[0];
    let slider = document.getElementById(sname);
    let sliderOut = document.getElementById(sname[0] + "v");
    slider.oninput = () => {
        let v = parseFloat(slider.value);
        sliderOut.textContent = v;
        C[sp[1]] = sp[2](v);
    };
    slider.dispatchEvent(new Event('input', { bubbles: true }));
});


// draw button

document.getElementById('draw-btn').onclick = e => {
    clear_all();
    loadPixels();
    finished_drawing = false;
    noFill();
    stroke(bound_color);
};


// preset shapes

let preset_shape = "";

function presets_setup() {
    circle_button.onclick = e => {
        set_preset_drawing("circle");
    };
    dogbone_button.onclick = e => {
        set_preset_drawing("dogbone");
    };
    cctri_button.onclick = e => {
        set_preset_drawing("cctri");
    };
}

function set_preset_drawing(name) {
    clear_all();
    preset_shape = name;
    loadPixels();
}

function clrear_preset() {
  preset_shape = "";
}

function draw_preset_shape() {
    noFill();
    stroke(bound_color);
    if (preset_shape === "circle") {
        circle(width / 2, height / 2, min(width, height) / 1.5);

    } else if (preset_shape === "dogbone") {
        const y = height / 2, d = min(width, height) / 4, r = d / 2;
        const cxr = width / 2 + width / 4, cxl = width / 2 - width / 4, theta = PI / 1.2;
        arc(cxr, height / 2, d, d, -theta, theta);
        arc(cxl, height / 2, d, d, PI - theta, PI + theta);
        line(cxr + r * Math.cos(-theta), y + r * Math.sin(-theta), cxl + r * Math.cos(PI + theta), y + r * Math.sin(PI + theta));
        line(cxr + r * Math.cos(theta), y + r * Math.sin(theta), cxl + r * Math.cos(PI - theta), y + r * Math.sin(PI - theta));

    } else if (preset_shape === "cctri") {
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