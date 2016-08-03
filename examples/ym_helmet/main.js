window.onload = init;

function init() {
  var root = new THREERoot({
    zNear: 0.01,
    zFar: 10000
  });
  root.renderer.setClearColor(0xffffff);
  root.camera.position.z = 10.0;
  root.add(new THREE.AxisHelper(10));

  var light = new THREE.DirectionalLight();
  light.position.set(0, 0, 1);
  root.add(light);

  var loader = new THREE.JSONLoader();

  loader.load('ym_helmet_merged.json', function(g) {
    g.center();
    g.computeVertexNormals();

    var animation = new Animation(g);
    root.add(animation);

    animation.animate(8.0, {repeat: -1, ease:Power0.easeNone});
  });
}

////////////////////
// CLASSES
////////////////////

function Animation(model) {
  model.computeBoundingBox();

  THREE.BAS.Utils.separateFaces(model);

  var bounds = model.boundingBox;
  var size = bounds.size();

  var geometry = new THREE.BAS.ModelBufferGeometry(model, {
    localizeFaces: true,
    computeCentroids: true
  });


  console.log(bounds, size);

  var aDelayDuration = geometry.createAttribute('aDelayDuration', 3, function(data, i) {
    var c = geometry.centroids[i];

    var delayX = THREE.Math.mapLinear(Math.abs(c.x), 0, bounds.max.x, 0.0, 1.0);
    var delayY = THREE.Math.mapLinear(c.y, bounds.max.y, bounds.min.y, 0.0, 2.0);

    data[0] = delayX + delayY - THREE.Math.randFloat(0, 1.0);
    data[1] = 1.0;
  });

  this.totalDuration = 4;

  var aStartPosition = geometry.createAttribute('aStartPosition', 3, function(data, i) {
    data[0] = THREE.Math.randFloatSpread(8);
    data[1] = THREE.Math.randFloat(-12, -10);
    data[2] = THREE.Math.randFloatSpread(8);
  });
  var aControl0 = geometry.createAttribute('aControl0', 3, function(data, i) {
    data[0] = THREE.Math.randFloatSpread(6);
    data[1] = THREE.Math.randFloat(-8, -6);
    data[2] = THREE.Math.randFloatSpread(6);
  });
  var aControl1 = geometry.createAttribute('aControl1', 3, function(data, i) {
    data[0] = THREE.Math.randFloatSpread(4);
    data[1] = THREE.Math.randFloat(-6, -4);
    data[2] = THREE.Math.randFloatSpread(4);
  });
  var aEndPosition = geometry.createAttribute('aEndPosition', 3, function(data, i) {
    geometry.centroids[i].toArray(data);
  });

  var material = new THREE.BAS.PhongAnimationMaterial({
    shading: THREE.FlatShading,
    side: THREE.DoubleSide,
    wireframe: true,
    uniforms: {
      uTime: {value: 0}
    },
    uniformValues: {
      diffuse: new THREE.Color(0xffffff)
    },
    vertexFunctions: [
      THREE.BAS.ShaderChunk.cubic_bezier,
      THREE.BAS.ShaderChunk.quaternion_rotation
    ],
    vertexParameters: [
      'uniform float uTime;',

      'attribute vec2 aDelayDuration;',

      'attribute vec3 aStartPosition;',
      'attribute vec3 aControl0;',
      'attribute vec3 aControl1;',
      'attribute vec3 aEndPosition;'
    ],
    varyingParameters: [
      'varying float vProgress;'
    ],
    vertexPosition: [
      'float tProgress = clamp(uTime - aDelayDuration.x, 0.0, aDelayDuration.y) / aDelayDuration.y;',
      'vProgress = tProgress;',

      'transformed += cubicBezier(aStartPosition, aControl0, aControl1, aEndPosition, tProgress);'
    ],
    fragmentInit: [
      'if (vProgress == 0.0) discard;'
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
