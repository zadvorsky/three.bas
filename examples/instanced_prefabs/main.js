window.onload = init;

function init() {
  const root = new THREERoot({
    createCameraControls: true,
    antialias: (window.devicePixelRatio === 1),
    fov: 60
  });
  root.renderer.setClearColor(0xffffff);
  root.camera.position.set(0, 0, 400);

  // const effect = new THREE.OutlineEffect(root.renderer);

  // root.render = function () {
  //   effect.render(root.scene, root.camera);
  // }

  let light = new THREE.DirectionalLight(0xffffff);
  root.add(light);

  const animation = new Animation();
  animation.animate(4.0, {ease: Power0.easeIn, repeat:-1, repeatDelay:0.25, yoyo: true});
  root.add(animation.mesh);
}

////////////////////
// CLASSES
////////////////////

function Animation() {
  const startPositionGeometry = new THREE.TorusKnotGeometry(100, 50, 128, 32, 1, 2)
  const endPositionGeometry = new THREE.TorusKnotGeometry(100, 50, 128, 32, 1, 8)

  const prefab = new THREE.TorusKnotGeometry(4, 0.5);
  const prefabCount = startPositionGeometry.attributes.position.count;
  const geometry = new BAS.InstancedPrefabBufferGeometry(prefab, prefabCount);

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
  const prefabData = [];

  const start = startPositionGeometry.attributes.position;
  const end = endPositionGeometry.attributes.position;
  const v = new THREE.Vector3();

  for (let i = 0; i < prefabCount; i++) {
    geometry.setPrefabData(aStartPosition, i, v.fromBufferAttribute(start, i).toArray(prefabData));
    geometry.setPrefabData(aEndPosition, i, v.fromBufferAttribute(end, i).toArray(prefabData));
  }

  const axis = new THREE.Vector3();

  geometry.createAttribute('aAxisAngle', 4, function(data) {
    axis.x = THREE.MathUtils.randFloatSpread(2);
    axis.y = THREE.MathUtils.randFloatSpread(2);
    axis.z = THREE.MathUtils.randFloatSpread(2);
    axis.normalize();
    axis.toArray(data);

    data[3] = Math.PI * 4;
  });

  const material = new BAS.ToonAnimationMaterial({
    uniforms: {
      uTime: {value: 0}
    },
    gradientMap: new THREE.TextureLoader().load('../_tex/fox_gradient_map.png'),
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
      'objectNormal = rotateVector(tQuat, objectNormal);'
    ],
    vertexPosition: [
      'transformed = rotateVector(tQuat, transformed);',
      'transformed += mix(aStartPosition, aEndPosition, tProgress);',
    ]
  });

  geometry.computeVertexNormals();

  this.mesh = new THREE.Mesh(geometry, material);
  this.mesh.frustumCulled = false;
}
Animation.prototype = Object.create(THREE.Mesh.prototype);
Animation.prototype.constructor = Animation;

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
