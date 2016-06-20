window.onload = init;

function init() {
  var root = new THREERoot();
  root.renderer.setClearColor(0x222222);
  root.camera.position.set(0, 600, 600);

  var animation = new Animation();
  animation.animate(2.0, {ease: Power0.easeIn, repeat:-1, repeatDelay:0.25, yoyo: true});
  root.add(animation);
}

////////////////////
// CLASSES
////////////////////

function Animation() {
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
    data[0] = -1000;
    data[1] = 0;
    data[2] = 0;
  });

  geometry.createAttribute('aEndPosition', 3, function(data) {
    data[0] = 1000;
    data[1] = 0;
    data[2] = 0;

  });

  geometry.createAttribute('aControl0', 3, function(data) {
    data[0] = THREE.Math.randFloat(-400, 400);
    data[1] = THREE.Math.randFloat(400, 600);
    data[2] = THREE.Math.randFloat(-1200, -800);
  });

  geometry.createAttribute('aControl1', 3, function(data) {
    data[0] = THREE.Math.randFloat(-400, 400);
    data[1] = THREE.Math.randFloat(-600, -400);
    data[2] = THREE.Math.randFloat(800, 1200);
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
