import React, { useEffect, useRef, useState } from "react";
import Two from "two.js";
import "./main.css";

var radius = 25;

var references = {
  triangle: new Two.Polygon(0, 0, radius, 3),
  circle: new Two.Circle(0, 0, radius),
  square: new Two.Rectangle(0, 0, radius * 2, radius * 2),
  pentagon: new Two.Polygon(0, 0, radius, 5),
  star: new Two.Star(0, 0, radius * 0.5, radius, 6)
};

function mod(v, l) {
  while (v < 0) {
    v += l;
  }
  return v % l;
}

export default function App() {
  var refs = useRef({
    type: Two.Types.svg,
    increment: false,
    decrement: false,
    active: null,
    count: 0,
    velocity: new Two.Vector(2, 0),
    spin: Math.PI / 30
  });
  var domElement = useRef();

  var [type, setType] = useState(Two.Types.svg);
  var [active, setActive] = useState({
    shapes: {
      triangle: true,
      circle: false,
      square: false,
      pentagon: false,
      star: false
    },
    operations: {
      position: false,
      rotation: false,
      scale: false,
      vertices: false
    }
  });
  var [count, setCount] = useState(0);

  useEffect(setup, []);
  useEffect(() => {
    // Keep a reference to our state object
    refs.current.type = type;
    refs.current.active = active;
    refs.current.count = count;
  }, [type, active, count]);

  function setup() {
    var frameCount = 0;
    var playing = true;
    var two = new Two({
      fullscreen: true
    }).appendTo(domElement.current);

    window.addEventListener("pointerup", ignore, false);

    requestAnimationFrame(animate);

    return unmount;

    function unmount() {
      playing = false;
      window.removeEventListener("pointerup", ignore, false);
      var parent = two.renderer.domElement.parentElement;
      if (parent) {
        parent.removeChild(two.renderer.domElement);
      }
    }

    function animate() {
      update(frameCount++);
      two.render();
      if (playing) {
        requestAnimationFrame(animate);
      }
    }

    function update(frameCount) {
      if (refs.current.type !== two.type) {
        change(refs.current.type);
      }

      if (refs.current.increment) {
        setCount(increment);
      }
      if (refs.current.decrement) {
        setCount(decrement);
      }

      var { count, active, velocity, spin } = refs.current;

      if (count > two.scene.children.length) {
        add();
      } else if (count < two.scene.children.length) {
        remove();
      }

      var needsUpdate = false;
      for (var operation in active.operations) {
        if (active.operations[operation]) {
          needsUpdate = true;
        }
      }

      if (!needsUpdate) {
        return;
      }

      var theta = frameCount / 30;

      for (var i = 0; i < two.scene.children.length; i++) {
        var child = two.scene.children[i];
        var direction = i % 2 ? 1 : -1;

        if (active.operations.position) {
          if (direction > 0) {
            child.position.add(velocity);
          } else {
            child.position.sub(velocity);
          }
          child.position.x = mod(child.position.x, two.width);
          child.position.y = mod(child.position.y, two.height);
        }
        if (active.operations.rotation) {
          child.rotation += spin * direction;
        }
        if (active.operations.scale) {
          child.scale = 0.25 * Math.sin(theta * direction) + 1;
        }
        if (active.operations.vertices) {
          modify(child);
        }
      }
    }

    function change(type) {
      var parent = two.renderer.domElement.parentElement;
      if (parent) {
        parent.removeChild(two.renderer.domElement);
      }

      var index = Two.Instances.indexOf(two);
      if (index >= 0) {
        Two.Instances.splice(index, 1);
      }

      two = new Two({
        type,
        fullscreen: true
      }).appendTo(domElement.current);
    }

    function modify(child) {
      for (var i = 0; i < child.vertices.length; i++) {
        var v = child.vertices[i];
        v.x = v.origin.x + Math.random() * 5;
        v.y = v.origin.y + Math.random() * 5;
      }
    }

    function increment(count) {
      return count + 1;
    }

    function decrement(count) {
      count = Math.max(count - 1, 0);
      return count;
    }

    function add() {
      var shapes = filter(refs.current.active.shapes);
      var index = Math.floor(Math.random() * shapes.length);
      var shape = shapes[index];
      two.add(generate(shape));
    }

    function remove() {
      var child = two.scene.children[0];
      if (child) {
        child.remove();
        two.release(child); // Dispose of any references
      }
    }

    function generate(name) {
      var { vertices } = references[name];
      var points = [];
      for (var i = 0; i < vertices.length; i++) {
        var v = vertices[i];
        var p = new Two.Anchor().copy(v);
        p.origin = v;
        points.push(p);
      }
      var path = new Two.Path(points, true);
      path.position.x = two.width * Math.random();
      path.position.y = two.height * Math.random();
      path.rotation = Math.random() * Math.PI * 2;
      path.fill = getRandomColor();
      path.stroke = "white";
      return path;
    }

    function getRandomColor() {
      var red = Math.floor(Math.random() * 255);
      var green = Math.floor(Math.random() * 255);
      var blue = Math.floor(Math.random() * 255);
      return `rgb(${red}, ${green}, ${blue})`;
    }

    function filter(obj) {
      var result = [];
      for (var k in obj) {
        if (!!obj[k]) {
          result.push(k);
        }
      }
      return result;
    }
  }

  //

  function onTypeChange(e) {
    setType(e.target.value);
  }

  function toggleShape(e) {
    var id = e.target.id;
    setActive((active) => {
      var result = { ...active };
      result.shapes[id] = !!e.target.checked;
      return result;
    });
  }

  function toggleOperation(e) {
    var id = e.target.id;
    setActive((active) => {
      var result = { ...active };
      result.operations[id] = !!e.target.checked;
      return result;
    });
  }

  function listen(e) {
    var id = e.target.id;
    refs.current[id] = true;
  }

  function ignore() {
    refs.current.increment = false;
    refs.current.decrement = false;
  }

  function onCountChange(e) {
    var value = e.target.value;
    value = Math.max(value, 0);
    setCount(value);
  }

  return (
    <div>
      <div className="stage" ref={domElement} />
      <ul className="actions">
        <li>
          <label htmlFor="two-type">Renderer:</label>
          <select id="two-type" value={type} onChange={onTypeChange}>
            <option value={Two.Types.svg}>SVG</option>
            <option value={Two.Types.canvas}>Canvas 2D</option>
            <option value={Two.Types.webgl}>WebGL</option>
          </select>
        </li>
        <li>
          <p>Shapes:</p>
          {Object.keys(active.shapes).map((shape, i) => (
            <p key={i}>
              <input
                id={shape}
                type="checkbox"
                checked={active.shapes[shape]}
                onChange={toggleShape}
              />
              <label htmlFor={shape}>{shape}s</label>
            </p>
          ))}
        </li>
        <li>
          <p>Operations:</p>
          {Object.keys(active.operations).map((operation, i) => (
            <p key={i}>
              <input
                id={operation}
                type="checkbox"
                checked={active.operations[operation]}
                onChange={toggleOperation}
              />
              <label htmlFor={operation}>{operation}</label>
            </p>
          ))}
        </li>
        <li>
          <p>
            Object Count:{" "}
            <input
              type="number"
              value={count}
              onChange={onCountChange}
              style={{ width: `${count.toString().length + 2}ch` }}
            />
          </p>
          <p className="note">Press and hold to:</p>
          <p>
            <button id="increment" onPointerDown={listen}>
              + Add
            </button>
            <button id="decrement" onPointerDown={listen}>
              - Remove
            </button>
          </p>
        </li>
      </ul>
    </div>
  );
}
