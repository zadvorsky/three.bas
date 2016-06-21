window.onload = init;

function init() {
  var root = new THREERoot();
  root.renderer.setClearColor(0x222222);
  root.camera.position.set(0, 600, 600);

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

  // root.add(new THREE.Point)
  root.add(new THREE.BoxHelper(control0Range, 0xff0000));
  root.add(new THREE.BoxHelper(control1Range, 0x00ff00));

  var animation = new Animation(startPosition, control0Range, control1Range, endPosition);
  animation.animate(4.0, {ease: Power0.easeIn, repeat:-1});
  root.add(animation);
}

////////////////////
// CLASSES
////////////////////

function Animation(startPosition, control0Range, control1Range, endPosition) {
  var prefabGeometry = new THREE.SphereGeometry(1.0);
  var prefabCount = 1000;

  var geometry = new THREE.BAS.PrefabBufferGeometry(prefabGeometry, prefabCount);

  // animation

  var totalDuration = this.totalDuration = 12;

  geometry.createAttribute('aDelayDuration', 2, function(data, i, l) {
    data[0] = i / l * totalDuration;
    data[1] = totalDuration;
  });

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

  var material = new THREE.BAS.BasicAnimationMaterial({
    shading: THREE.FlatShading,
    uniforms: {
      uTime: {type: 'f', value: 0}
    },
    vertexFunctions: [
      THREE.BAS.ShaderChunk['cubic_bezier']
    ],
    vertexParameters: [
      'uniform float uTime;',
      'attribute vec2 aDelayDuration;',
      'attribute vec3 aStartPosition;',
      'attribute vec3 aEndPosition;',
      'attribute vec3 aControl0;',
      'attribute vec3 aControl1;'
    ],
    vertexInit: [
      'float tProgress = mod((uTime + aDelayDuration.x), aDelayDuration.y) / aDelayDuration.y;',
    ],
    vertexPosition: [
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
