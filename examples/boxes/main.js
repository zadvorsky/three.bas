window.onload = init;

function init() {
  var root = new THREERoot();
  root.renderer.setClearColor(0xffffff);
  root.camera.position.set(10, 10, 10);

  var light = new THREE.DirectionalLight(0xffffff, 1.0);
  light.position.set(0, 1, 0);
  root.add(light);

  var gridHelper = new THREE.GridHelper(10, 1);
  root.add(gridHelper);

  var animation = new Animation();
  animation.animate(10.0, {repeat:-1, repeatDelay: 0.0, ease:Power0.easeNone});
  root.add(animation);
}

////////////////////
// CLASSES
////////////////////

function Animation() {
  var prefabSize = 0.5;
  var prefab = new THREE.BoxGeometry(prefabSize, prefabSize, prefabSize);

  prefab.translate(0, prefabSize * 0.5, 0);

  var gridSize = 2;
  var prefabCount = gridSize * gridSize;

  var geometry = new THREE.BAS.PrefabBufferGeometry(prefab, prefabCount);

  var aPosition = geometry.createAttribute('aPosition', 3);
  var aDelayDuration = geometry.createAttribute('aDelayDuration', 2);
  var index = 0;

  var maxDelay = 1.0;
  var maxDuration = 1.0;

  this.totalDuration = maxDelay + maxDuration;


  for (var i = 0; i < gridSize; i++) {
    for (var j = 0; j < gridSize; j++) {
      var x = THREE.Math.mapLinear(i, 0, gridSize, -gridSize * 0.5, gridSize * 0.5) + 0.5;
      var y = THREE.Math.mapLinear(j, 0, gridSize, -gridSize * 0.5, gridSize * 0.5) + 0.5;

      geometry.setPrefabData(aPosition, index, [x, 0, y]);

      //var delay = maxDelay * index / prefabCount;
      var delay = maxDelay * Math.sqrt(x * x + y * y) / gridSize * 0.5;
      //var delay = maxDelay * Math.random();

      var duration = maxDuration;

      geometry.setPrefabData(aDelayDuration, index, [delay, duration]);

      index++;
    }
  }




  // ANIMATION FRAME DATA -> [scl.x, scl.y, scl.z, pos.y]

  var animationFrames = [];

  animationFrames.push(new THREE.Vector4(1.0, 1.0, 1.0, 0.0));
  animationFrames.push(new THREE.Vector4(1.5, 0.5, 1.5, 0.0));
  animationFrames.push(new THREE.Vector4(0.5, 2.0, 0.5, 6.0));
  animationFrames.push(new THREE.Vector4(1.0, 1.0, 1.0, 0.0));
  animationFrames.push(new THREE.Vector4(1.5, 0.2, 1.5, 0.0));
  animationFrames.push(new THREE.Vector4(1.0, 1.0, 1.0, 0.0));




  //animationFrames.push(new THREE.Vector4(1.0, 1.0, 1.0, 0.0));
  //animationFrames.push(new THREE.Vector4(1.125, 0.75, 1.125, 0.0));
  //animationFrames.push(new THREE.Vector4(0.5, 2.0, 0.5, 4.0));
  //animationFrames.push(new THREE.Vector4(0.5, 2.0, 0.5, 0.0));
  //animationFrames.push(new THREE.Vector4(1.5, 0.5, 1.5, 0.0));
  //animationFrames.push(new THREE.Vector4(1.0, 1.0, 1.0, 0.0));


  var material = new THREE.BAS.StandardAnimationMaterial({
    shading: THREE.FlatShading,
    uniforms: {
      uTime: {value: 0},
      uFrames: {value: animationFrames},
    },
    defines: {
      FRAME_COUNT: animationFrames.length,
      FRAME_MAX: (animationFrames.length - 1).toFixed(1)
    },
    uniformValues: {
    },
    vertexFunctions: [
      THREE.BAS.ShaderChunk['catmull_rom_spline'],
      THREE.BAS.ShaderChunk['ease_bezier']
    ],
    vertexParameters: [
      'uniform vec4 uFrames[FRAME_COUNT];',
      'uniform float uTime;',

      'attribute vec3 aPosition;',
      'attribute vec2 aDelayDuration;'
    ],
    vertexPosition: [
      'float tProgress = clamp(uTime - aDelayDuration.x, 0.0, aDelayDuration.y) / aDelayDuration.y;',
      'tProgress = easeBezier(tProgress, vec4(.5,.12,.87,.49));',

      'float animationProgress = tProgress * FRAME_MAX;',
      'ivec4 indices = getCatmullRomSplineIndices(FRAME_MAX, animationProgress);',

      'vec4 p0 = uFrames[indices[0]];',
      'vec4 p1 = uFrames[indices[1]];',
      'vec4 p2 = uFrames[indices[2]];',
      'vec4 p3 = uFrames[indices[3]];',

      'float animationProgressFract = fract(animationProgress);',

      'transformed *= catmullRomSpline(p0.xyz, p1.xyz, p2.xyz, p3.xyz, animationProgressFract, vec2(0));',

      'transformed += aPosition;',
      'transformed.y += catmullRomSpline(p0.w, p1.w, p2.w, p3.w, animationProgressFract, vec2(0));',

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
