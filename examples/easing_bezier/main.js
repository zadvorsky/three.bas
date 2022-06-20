window.onload = init;

function init() {
  var root = new THREERoot({
    createCameraControls: true,
    antialias: (window.devicePixelRatio === 1),
    fov: 60
  });
  root.renderer.setClearColor(0x222222);
  root.camera.position.set(0, 0, 150);

  var grid = new THREE.GridHelper(100, 10,0x333333, 0x333333);
  grid.material.depthWrite = false;
  grid.rotation.x = Math.PI * 0.5;
  root.scene.add(grid);

  var system = new EaseSystem();
  system.animate(2.0, {ease: Power0.easeIn, repeat:-1, repeatDelay:0.25, yoyo: true});
  root.add(system.mesh);
}

////////////////////
// CLASSES
////////////////////

function EaseSystem() {
  var rangeX = 100;
  var rangeY = 100;
  var prefabCount = 1000;
  var size = rangeY / prefabCount;

  var prefabGeometry = new THREE.PlaneGeometry(size * 2, size);
  var geometry = new BAS.PrefabBufferGeometry(prefabGeometry, prefabCount);

  var i, j, offset;

  // animation
  var aDelayDuration = geometry.createAttribute('aDelayDuration', 3);

  var duration = 1.0;
  var maxPrefabDelay = 0.5;
  var maxVertexDelay = 0.1;

  this.totalDuration = duration + maxPrefabDelay + maxVertexDelay * 2;

  for (i = 0, offset = 0; i < prefabCount; i++) {
    var delay = THREE.MathUtils.mapLinear(i, 0, prefabCount, 0.0, maxPrefabDelay);

    for (j = 0; j < prefabGeometry.attributes.position.count; j++) {
      aDelayDuration.array[offset] = delay + (2 - j % 2) * maxVertexDelay;
      aDelayDuration.array[offset + 1] = duration;

      offset += 3;
    }
  }

  // startPosition
  var aStartPosition = geometry.createAttribute('aStartPosition', 3);
  var aEndPosition = geometry.createAttribute('aEndPosition', 3);
  var startPosition = new THREE.Vector3();
  var endPosition = new THREE.Vector3();

  for (i = 0, offset = 0; i < prefabCount; i++) {
    startPosition.x = -rangeX * 0.5;
    startPosition.y = THREE.MathUtils.mapLinear(i, 0, prefabCount, -rangeY * 0.5, rangeY * 0.5);
    startPosition.z = 0;

    endPosition.x = rangeX * 0.5;
    endPosition.y = startPosition.y;
    endPosition.z = 0;

    for (j = 0; j < prefabGeometry.attributes.position.count; j++) {
      aStartPosition.array[offset] = startPosition.x;
      aStartPosition.array[offset + 1] = startPosition.y;
      aStartPosition.array[offset + 2] = startPosition.z;

      aEndPosition.array[offset] = endPosition.x;
      aEndPosition.array[offset + 1] = endPosition.y;
      aEndPosition.array[offset + 2] = endPosition.z;

      offset += 3;
    }
  }

  var material = new BAS.BasicAnimationMaterial({
    flatShading: true,
    transparent: true,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: {type: 'f', value: 0},
      // bezier ease definition same as css, see http://cubic-bezier.com/
      uBezierCurve: {type: 'v4', value: new THREE.Vector4(0.0, 1.5, 1.0, -1.5)}
    },
    vertexFunctions: [
      BAS.ShaderChunk['ease_bezier']
    ],
    vertexParameters: [
      'uniform float uTime;',
      'uniform vec4 uBezierCurve;',
      'attribute vec2 aDelayDuration;',
      'attribute vec3 aStartPosition;',
      'attribute vec3 aEndPosition;'
    ],
    vertexInit: [
      'float tProgress = clamp(uTime - aDelayDuration.x, 0.0, aDelayDuration.y) / aDelayDuration.y;',
      'tProgress = easeBezier(tProgress, uBezierCurve);'
    ],
    vertexPosition: [
      'transformed += mix(aStartPosition, aEndPosition, tProgress);'
    ]
  });

  this.mesh = new THREE.Mesh(geometry, material);
  this.mesh.frustumCulled = false;
}
Object.defineProperty(EaseSystem.prototype, 'time', {
  get: function () {
    return this.mesh.material.uniforms['uTime'].value;
  },
  set: function (v) {
    this.mesh.material.uniforms['uTime'].value = v;
  }
});

EaseSystem.prototype.animate = function (duration, options) {
  options = options || {};
  options.time = this.totalDuration;

  return TweenMax.fromTo(this, duration, {time: 0.0}, options);
};
