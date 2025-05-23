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

let updating_pixels = false;
let update_pixels = true;
let update_pixels_resolve;
let update_pixels_promise = new Promise(r => {
    update_pixels_resolve = r;
});

let moving_charge = false;
let current_drawing_shape = undefined;

let shapes = [];
shapes.push(buckets.LinkedList());

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
let inside_shape_color;

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
    inside_shape_color = color(42, 58, 95, 255);
    background(inside_color);
    strokeWeight(2);
    fill(255, 0);
    pixelDensity(1);
    presets_setup();
}

function draw() {
    reset_screen();
    begin_updating_pixels_if_needed();
    update_shapes();
    draw_preset_shapes();
    finish_updating_pixels_if_needed();
    move_charges();
    update_graph();
}

function begin_updating_pixels_if_needed() {
    if (update_pixels) {
        updating_pixels = true;
        updatePixels();
    }
}

function finish_updating_pixels_if_needed() {
    if (updating_pixels) {
        loadPixels();
        update_pixels = false;
        updating_pixels = false;
        update_pixels_resolve();
        // reset the promise
        update_pixels_promise = new Promise(r => {
            update_pixels_resolve = r;
        });
    }
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
            c.velocity.add(c.force.div(C.M)).mult(C.FRICTION);
            c.pos.add(c.velocity);
            if (pixel_is_background_color(Math.floor(c.pos.x), Math.floor(c.pos.y)) || !on_canvas(c.pos.x, c.pos.y)) {
                c.pos.sub(c.velocity);
                c.velocity.rotate(Math.random() * Math.PI * 2).div(1.5); // cant know the dorder direction, so just repel randomly.
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

function update_shapes() {
    noFill();
    stroke(bound_color);
    shapes.forEach(points => {
        beginShape();
        points.forEach(p => {
            vertex(p.x, p.y);
        });
        endShape();
    });
    if (current_drawing_shape != undefined && mouseIsPressed && on_canvas(mouseX, mouseY)) {
        shapes[current_drawing_shape].add(new Point(mouseX, mouseY));
    }
}

function clear_all() {
    shapes.forEach(shape => {
        shape.clear();
    });
    shapes = [];
    charges.clear();
    current_drawing_shape = undefined;
    moving_charge = false;
    clrear_preset();
    reset_screen();
    loadPixels();
}

function keyPressed() {
    if (key === 'c') {
        clear_all();
    } else if (key === 'd' && current_drawing_shape != undefined && !shapes[current_drawing_shape].isEmpty()) {
        const points = shapes[current_drawing_shape];
        points.add(new Point(points.first().x, points.first().y));
        current_drawing_shape = undefined;
    } else if (key === 'q' && current_drawing_shape == undefined) {
        distribute_charge(Math.floor(mouseX), Math.floor(mouseY)).then(() => {
            moving_charge = true;
        });
    }
}

document.getElementById('clear-btn').onclick = e => {
    clear_all();
};
document.getElementById('finish-drawing-btn').onclick = e => {
    const points = shapes[current_drawing_shape];
    points.add(new Point(points.first().x, points.first().y));
    current_drawing_shape = undefined;
};
document.getElementById('fill-charges-btn').onclick = e => {
    distribute_charge(width/2, height/2).then(() => {
        moving_charge = true;
    });
};

async function distribute_charge(center_x, center_y) {
    update_pixels = true;
    await update_pixels_promise;

    let bfsq = new buckets.Queue();
    bfsq.add(new Point(center_x, center_y));
    while (!bfsq.isEmpty()) {
        let cur = bfsq.dequeue();
        if (pixel_is_background_color(cur.x, cur.y)) {
            set_color(cur.x, cur.y, inside_shape_color);
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

function pixel_is_background_color(x, y) {
    const off = 4 * (y * width + x);
    return pixels[off] === red(inside_color) && pixels[off + 1] === green(inside_color) && pixels[off + 2] === blue(inside_color) && pixels[off + 3] === alpha(inside_color);
}

function set_color(x, y, c) {
    const off = 4 * (y * width + x);
    pixels[off] = red(c);
    pixels[off + 1] = green(c);
    pixels[off + 2] = blue(c);
    pixels[off + 3] = alpha(c);
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
    current_drawing_shape = shapes.length;
    shapes.push(buckets.LinkedList());
    noFill();
    stroke(bound_color);
};