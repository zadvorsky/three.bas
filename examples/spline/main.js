window.onload = init;

function init() {
  var root = new THREERoot();
  root.renderer.setClearColor(0x000000);
  root.camera.position.set(0, 0, 1000);

  var light = new THREE.PointLight(0xffffff, 4, 1000, 2);
  light.position.set(0, 400, 0);
  root.add(light);

  // A Catmull-Rom Spline defines a smooth line that goes through at least 4 points
  // this is different than a Bezier curve where the line never goes through the control points

  // the spline will have {{length}} points, each represented by a Vector4
  // we will use the x, y and z components for the position of the point
  // we will the w component for a 'pivot' distance from that point (translation applied before rotation)
  // the pivot distance will be interpolated the same way as the position
  var length = 8;
  var points = [];

  var x, y, z, pivotDistance;

  for (var i = 0; i < length; i++) {
    // spread x linearly from -1000 to 1000
    x = THREE.MathUtils.mapLinear(i, 0, length - 1, -1000, 1000);
    // alternate y so the spline becomes wavy
    y = THREE.MathUtils.randFloat(50, 150) * (i % 2 ? 1 : -1);
    z = 0;
    // the first and last point will have a pivot distance of 0, the others will be randomized
    pivotDistance = (i === 0 || i === length - 1) ? 0 : THREE.MathUtils.randFloat(0, 80.0);

    points.push(new THREE.Vector4(x, y, z, pivotDistance));
  }

  // pass the path definition to the animation
  var animation = new Animation(points);
  animation.animate(24.0, {ease: Power0.easeIn, repeat:-1});
  root.add(animation.mesh);

  // debug helpers / visuals
  var debug = new THREE.Group();

  var curve = new THREE.CatmullRomCurve3(points.map(function(p) {
    return new THREE.Vector3(p.x, p.y, p.z);
  }));
  curve.type = 'catmullrom';

  debug.add(new LineHelper(curve.getPoints(400), {
    color: 0xff0000,
    depthTest: false,
    depthWrite: false
  }));

  points.forEach(function(p) {
    debug.add(new PointHelper(0xff0000, p.w, new THREE.Vector3(p.x, p.y, p.z)));
  });

  root.add(debug);
  debug.visible = false;

  window.addEventListener('keyup', function(e) {
    if (e.keyCode === 68) {
      debug.visible = !debug.visible;
      root.renderer.setClearColor(debug.visible ? 0x222222 : 0x00000);
    }
  });
}

////////////////////
// CLASSES
////////////////////

function Animation(path) {
  // each prefab is a tetrahedron
  var prefabGeometry = new THREE.TetrahedronBufferGeometry(2.0);
  var prefabCount = 100000;

  // create the buffer geometry with all the prefabs
  var geometry = new BAS.PrefabBufferGeometry(prefabGeometry, prefabCount);

  // ANIMATION

  // the actual duration of the animation is controlled by Animation.animate
  // this duration can be set to any value
  // let's set it to 1.0 to keep it simple
  var totalDuration = this.totalDuration = 1.0;

  geometry.createAttribute('aDelayDuration', 2, function(data, i, count) {
    // calculating the delay based on index will spread the prefabs over the 'timeline'
    data[0] = i / count * totalDuration;
    // all prefabs have the same animation duration, so we could store it as a uniform instead
    // storing it as an attribute takes more memory,
    // but for the sake of this demo it's easier in case we want to give each prefab a different duration
    data[1] = totalDuration;
  });

  // PIVOT SCALE

  // give each prefab a random pivot scale, which will effect how far the prefab will pivot
  // relative to the pivot distance for each of the points in the path
  geometry.createAttribute('aPivotScale', 1, function(data) {
    data[0] = Math.random();
  });

  // ROTATION

  // each prefab will get a random axis and an angle around that axis
  var axis = new THREE.Vector3();
  var angle = 0;

  geometry.createAttribute('aAxisAngle', 4, function(data) {
    axis.x = THREE.MathUtils.randFloatSpread(2);
    axis.y = THREE.MathUtils.randFloatSpread(2);
    axis.z = THREE.MathUtils.randFloatSpread(2);
    axis.normalize();

    angle = Math.PI * THREE.MathUtils.randFloat(4, 8);

    data[0] = axis.x;
    data[1] = axis.y;
    data[2] = axis.z;
    data[3] = angle;
  });

  // COLOR

  // each prefab will get a psudo-random vertex color
  var color = new THREE.Color();
  var h, s, l;

  // we will use the built in VertexColors to give each prefab its own color
  // note you have to set Material.vertexColors to THREE.VertexColors for this to work
  geometry.createAttribute('color', 3, function(data, i, count) {
    // modulate the hue
    h = i / count;
    s = THREE.MathUtils.randFloat(0.4, 0.6);
    l = THREE.MathUtils.randFloat(0.4, 0.6);

    color.setHSL(h, s, l);
    color.toArray(data);
  });

  var material = new BAS.PhongAnimationMaterial({
    flatShading: true,
    vertexColors: true,
    side: THREE.DoubleSide,
    specular: new THREE.Color(0xff0000),
    shininess: 20,
    // defines act as static, immutable values
    defines: {
      // we need integer representation of path length
      PATH_LENGTH: path.length,
      // we also need a max index float for the catmull-rom interpolation
      // adding .toFixed(1) will set value as {{length}}.0, which will identify it as a float
      PATH_MAX: (path.length - 1).toFixed(1)
    },
    uniforms: {
      uTime: {value: 0},
      // the path from the constructor (array of Vector4's)
      uPath: {value: path},
      // this is an optional argument for the spline interpolation function
      // 0.5, 0.5 is the default, 0.0, 0.0 will create a jagged spline, other values can make it go c r a z y
      uSmoothness: {value: new THREE.Vector2(0.5, 0.5)}
    },
    vertexFunctions: [
      // catmull_rom_spline defines the catmullRomSpline and getCatmullRomSplineIndices functions used in the vertexPosition chunk
      // it also defines getCatmullRomSplineIndicesClosed, which is not used in this example
      BAS.ShaderChunk['catmull_rom_spline'],
      BAS.ShaderChunk['quaternion_rotation']
    ],
    // note we do not have to define 'color' as a uniform because THREE.js will do this for us
    // trying to define it here will throw a duplicate declaration error
    vertexParameters: [
      'uniform float uTime;',
      // this is how you define an array in glsl
      // you need both a type and a length
      // the length cannot be dynamic, and must be set at compile time
      // here the length will be replaced by the define above
      'uniform vec4 uPath[PATH_LENGTH];',
      'uniform vec2 uSmoothness;',

      'attribute vec2 aDelayDuration;',
      'attribute float aPivotScale;',
      'attribute vec4 aAxisAngle;'
    ],
    vertexInit: [
      // tProgress is in range 0.0 to 1.0
      // we want each prefab to restart at 0.0 if the progress is < 1.0, creating a continuous motion
      // the delay is added to the time uniform to spread the prefabs over the path
      'float tProgress = mod((uTime + aDelayDuration.x), aDelayDuration.y) / aDelayDuration.y;',

      'vec4 tQuat = quatFromAxisAngle(aAxisAngle.xyz, aAxisAngle.w * tProgress);'
    ],
    vertexPosition: [
      // getting the progress along the spline is more involved than a bezier curve

      // first we need get the progress relative to the path length
      'float pathProgress = tProgress * PATH_MAX;',
      // getCatmullRomSplineIndices returns an integer vector with 4 indices based on pathProgress
      'ivec4 indices = getCatmullRomSplineIndices(PATH_MAX, pathProgress);',
      // use these indices to get the four points that will influence the position
      'vec4 p0 = uPath[indices[0]];', // max(0, floor(pathProgress) - 1)
      'vec4 p1 = uPath[indices[1]];', // floor(pathProgress)
      'vec4 p2 = uPath[indices[2]];', // min(length, floor(pathProgress) + 1)
      'vec4 p3 = uPath[indices[3]];', // min(length, floor(pathProgress) + 2)

      // we only care about the fractal part of the pathProgress float (what comes after the .)
      'float pathProgressFract = fract(pathProgress);',

      // get the pivot distance by using catmull-rom interpolation on the fourth component of the vector (w)
      // each prefab has its own pivotScale, which we use to spread them out
      // this translation is performed BEFORE the rotation
      'transformed += catmullRomSpline(p0.w, p1.w, p2.w, p3.w, pathProgressFract) * aPivotScale;',

      // rotate the vertex
      'transformed = rotateVector(tQuat, transformed);',

      // finally add the actual spline position
      // uSmoothness is an optional argument that controls how the spline looks.
      'transformed += catmullRomSpline(p0.xyz, p1.xyz, p2.xyz, p3.xyz, pathProgressFract, uSmoothness);'
    ]
  });

  this.mesh = new THREE.Mesh(geometry, material);
  this.mesh.frustumCulled = false;
}

Object.defineProperty(Animation.prototype, 'time', {
  get: function () {
    return this.mesh.material.uniforms['uTime'].value;
  },
  set: function (v) {
    this.mesh.material.uniforms['uTime'].value = v;
  }
});

Animation.prototype.animate = function (duration, options) {
  options = options || {};
  options.time = this.totalDuration;

  return TweenMax.fromTo(this, duration, {time: 0.0}, options);
};

class PointHelper extends THREE.Mesh {
  constructor (color, size, position) {
    super(
      new THREE.SphereGeometry(size || 1.0, 16, 16),
      new THREE.MeshBasicMaterial({
        color: color || 0xff0000,
        wireframe: true
      })
    );

    position && this.position.copy(position);
  }
}

class LineHelper extends THREE.Line {
  constructor (points, params) {
    super(
      new THREE.BufferGeometry().setFromPoints(points),
      new THREE.LineBasicMaterial(params)
    );
  }
}

