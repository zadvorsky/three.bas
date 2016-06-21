window.onload = init;

function init() {
  var root = new THREERoot();
  root.renderer.setClearColor(0x222222);
  root.camera.position.set(0, 600, 600);

  var light = new THREE.PointLight(0xffffff, 4, 1000, 2);
  light.position.set(0, 400, 0);
  root.add(light);

  var startPosition = new THREE.Vector3(-1000, 0, 0);
  var control0Range = new THREE.Box3(
    new THREE.Vector3(-400, 400, -1200),
    new THREE.Vector3(400, 600, -800)
  );
  var control1Range = new THREE.Box3(
    new THREE.Vector3(-400, -600, 800),
    new THREE.Vector3(400, -400, 1200)
  );
  var endPosition = new THREE.Vector3(1000, 0, 0);

  var animation = new Animation(startPosition, control0Range, control1Range, endPosition);
  animation.animate(8.0, {ease: Power0.easeIn, repeat:-1});
  root.add(animation);

  // debug helpers
  var debug = new THREE.Group();

  debug.add(new PointHelper(0xff0000, 4.0, startPosition));
  debug.add(new THREE.BoxHelper(control0Range, 0xff0000));
  debug.add(new THREE.BoxHelper(control1Range, 0x00ff00));
  debug.add(new PointHelper(0x00ff00, 4.0, endPosition));
  debug.add(new THREE.AxisHelper(1000));
  debug.add(new THREE.PointLightHelper(light));

  root.add(debug);

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

function Animation(startPosition, control0Range, control1Range, endPosition) {
  var prefabGeometry = new THREE.PlaneGeometry(4.0, 4.0);
  var prefabCount = 100000;

  var geometry = new THREE.BAS.PrefabBufferGeometry(prefabGeometry, prefabCount);

  // animation
  var totalDuration = this.totalDuration = 1.0;

  geometry.createAttribute('aDelayDuration', 2, function(data, i, count) {
    data[0] = i / count * totalDuration;
    data[1] = totalDuration;
  });

  // start & end positions
  geometry.createAttribute('aStartPosition', 3, function(data) {
    data[0] = startPosition.x;
    data[1] = startPosition.y;
    data[2] = startPosition.z;
  });

  geometry.createAttribute('aEndPosition', 3, function(data) {
    data[0] = endPosition.x;
    data[1] = endPosition.y;
    data[2] = endPosition.z;
  });

  // control points
  var point = new THREE.Vector3();

  geometry.createAttribute('aControl0', 3, function(data) {
    THREE.BAS.Utils.randomInBox(control0Range, point);

    data[0] = point.x;
    data[1] = point.y;
    data[2] = point.z;
  });

  geometry.createAttribute('aControl1', 3, function(data) {
    THREE.BAS.Utils.randomInBox(control1Range, point);

    data[0] = point.x;
    data[1] = point.y;
    data[2] = point.z;
  });

  // rotation
  var axis = new THREE.Vector3();
  var angle = 0;

  geometry.createAttribute('aAxisAngle', 4, function(data) {
    axis.x = THREE.Math.randFloatSpread(2);
    axis.y = THREE.Math.randFloatSpread(2);
    axis.z = THREE.Math.randFloatSpread(2);
    axis.normalize();

    angle = Math.PI * THREE.Math.randInt(16, 32);

    data[0] = axis.x;
    data[1] = axis.y;
    data[2] = axis.z;
    data[3] = angle;
  });

  // color
  var color = new THREE.Color();
  var h, s, l;

  geometry.createAttribute('color', 3, function(data, i, count) {
    h = i / count;
    s = THREE.Math.randFloat(0.4, 0.6);
    l = THREE.Math.randFloat(0.4, 0.6);

    color.setHSL(h, s, l);

    data[0] = color.r;
    data[1] = color.g;
    data[2] = color.b;
  });

  var material = new THREE.BAS.PhongAnimationMaterial({
    shading: THREE.FlatShading,
    vertexColors: THREE.VertexColors,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: {type: 'f', value: 0}
    },
    uniformValues: {
      specular: new THREE.Color(0xff0000),
      shininess: 20
    },
    vertexFunctions: [
      THREE.BAS.ShaderChunk['quaternion_rotation'],
      THREE.BAS.ShaderChunk['cubic_bezier']
    ],
    vertexParameters: [
      'uniform float uTime;',
      'attribute vec2 aDelayDuration;',
      'attribute vec3 aStartPosition;',
      'attribute vec3 aEndPosition;',
      'attribute vec3 aControl0;',
      'attribute vec3 aControl1;',
      'attribute vec4 aAxisAngle;'
    ],
    vertexInit: [
      'float tProgress = mod((uTime + aDelayDuration.x), aDelayDuration.y) / aDelayDuration.y;',

      'vec4 tQuat = quatFromAxisAngle(aAxisAngle.xyz, aAxisAngle.w * tProgress);'
    ],
    vertexPosition: [
      'transformed = rotateVector(tQuat, transformed);',
      'transformed += cubicBezier(aStartPosition, aControl0, aControl1, aEndPosition, tProgress);'
    ]
  });

  THREE.Mesh.call(this, geometry, material);

  this.frustumCulled = false;
}
Animation.prototype = Object.create(THREE.Mesh.prototype);
Animation.prototype.constructor = Animation;
Object.defineProperty(Animation.prototype, 'time', {
  get: function () {
    return this.material.uniforms['uTime'].value;
  },
  set: function (v) {
    this.material.uniforms['uTime'].value = v;
  }
});

Animation.prototype.animate = function (duration, options) {
  options = options || {};
  options.time = this.totalDuration;

  return TweenMax.fromTo(this, duration, {time: 0.0}, options);
};

function PointHelper(color, size, position) {
  THREE.Mesh.call(this,
    new THREE.SphereGeometry(size || 1.0, 16, 16),
    new THREE.MeshBasicMaterial({
      color: color || 0xff0000,
      wireframe: true
    })
  );

  position && this.position.copy(position);
}
PointHelper.prototype = Object.create(THREE.Mesh.prototype);
PointHelper.prototype.constructor = PointHelper;
