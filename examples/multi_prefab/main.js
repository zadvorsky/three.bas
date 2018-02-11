window.onload = init;

function init() {
  // THREERoot is a simple THREE.js wrapper with a renderer, scene and camera
  // it handles an RAF loop and resizing
  const root = new THREERoot({
    createCameraControls: true,
    antialias: (window.devicePixelRatio === 1),
    fov: 60
  });
  root.renderer.setClearColor(0x222222);
  root.camera.position.set(0, 0, 400);

  // add lights
  let light = new THREE.DirectionalLight(0xff00ff);
  root.add(light);

  light = new THREE.DirectionalLight(0x00ffff);
  light.position.y = -1;
  root.add(light);

  // Animation extends THREE.Mesh
  const animation = new Animation();
  animation.animate(8.0, {ease: Power0.easeIn, repeat:-1, repeatDelay:0.25, yoyo: true});
  root.add(animation);
}

////////////////////
// CLASSES
////////////////////

function Animation() {
  // the number of times the prefabGeometry will be repeated
  const prefabs = [
    new THREE.TorusBufferGeometry(4, 1),
    new THREE.TetrahedronGeometry(4),
    new THREE.IcosahedronGeometry(4),
  ];
  const repeatCount = 20000;

  const geometry = new BAS.MultiPrefabBufferGeometry(prefabs, repeatCount);

  const duration = 1.0;
  const maxPrefabDelay = 0.5;

  // used in the Animation.animate function below
  this.totalDuration = duration + maxPrefabDelay;

  geometry.createAttribute('aDelayDuration', 2, function(data) {
    data[0] = Math.random() * maxPrefabDelay;
    data[1] = duration;
  });

  const aStartPosition = geometry.createAttribute('aStartPosition', 3);
  const aEndPosition = geometry.createAttribute('aEndPosition', 3);

  const startPosition = new THREE.Vector3();
  const endPosition = new THREE.Vector3();
  const range = 100;
  const prefabData = [];

  for (let i = 0; i < repeatCount * prefabs.length; i++) {
    startPosition.x = THREE.Math.randFloatSpread(range) - range * 0.5;
    startPosition.y = THREE.Math.randFloatSpread(range);
    startPosition.z = THREE.Math.randFloatSpread(range);

    endPosition.x = THREE.Math.randFloatSpread(range) + range * 0.5;
    endPosition.y = THREE.Math.randFloatSpread(range);
    endPosition.z = THREE.Math.randFloatSpread(range);

    geometry.setPrefabData(aStartPosition, i, startPosition.toArray(prefabData));
    geometry.setPrefabData(aEndPosition, i, endPosition.toArray(prefabData));
  }

  const axis = new THREE.Vector3();

  geometry.createAttribute('aAxisAngle', 4, function(data) {
    axis.x = THREE.Math.randFloatSpread(2);
    axis.y = THREE.Math.randFloatSpread(2);
    axis.z = THREE.Math.randFloatSpread(2);
    axis.normalize();
    axis.toArray(data);

    data[3] = Math.PI * THREE.Math.randFloat(4.0, 8.0);
  });

  const material = new BAS.StandardAnimationMaterial({
    flatShading: true,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: {value: 0}
    },
    uniformValues: {
      metalness: 0.5,
      roughness: 0.5,
      map: new THREE.TextureLoader().load('../_tex/UV_Grid.jpg')
    },
    vertexFunctions: [
      BAS.ShaderChunk['ease_cubic_in_out'],
      BAS.ShaderChunk['ease_quad_out'],
      BAS.ShaderChunk['quaternion_rotation']
    ],
    vertexParameters: [
      'uniform float uTime;',
      'attribute vec2 aDelayDuration;',
      'attribute vec3 aStartPosition;',
      'attribute vec3 aEndPosition;',
      'attribute vec4 aAxisAngle;'
    ],
    vertexInit: [
      'float tProgress = clamp(uTime - aDelayDuration.x, 0.0, aDelayDuration.y) / aDelayDuration.y;',
      'tProgress = easeCubicInOut(tProgress);',
      'vec4 tQuat = quatFromAxisAngle(aAxisAngle.xyz, aAxisAngle.w * tProgress);'
    ],
    vertexNormal: [
      //'objectNormal = rotateVector(tQuat, objectNormal);'
    ],
    vertexPosition: [
      'transformed = rotateVector(tQuat, transformed);',
      'transformed += mix(aStartPosition, aEndPosition, tProgress);',
    ]
  });

  //geometry.computeVertexNormals();

  geometry.bufferUvs();

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
