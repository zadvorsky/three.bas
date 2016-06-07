window.onload = init;

function init() {
  var root = new THREERoot({
    createCameraControls: true,
    antialias: (window.devicePixelRatio === 1),
    fov: 60
  });
  root.renderer.setClearColor(0x222222);
  root.camera.position.set(0, 0, 150);

  // add lights
  var light = new THREE.DirectionalLight();
  root.add(light);

  light = new THREE.DirectionalLight();
  light.position.y = -1;
  root.add(light);

  // add the pink wireframe box for reflection
  var backgroundBox = new THREE.Mesh(
    new THREE.BoxGeometry(400, 400, 400, 10, 10, 10),
    new THREE.MeshBasicMaterial({
      color: 0xff00ff,
      wireframe: true
    })
  );
  root.add(backgroundBox);

  // add the teal box so we know what's actually reflecting
  var orientationBox = new THREE.Mesh(
    new THREE.BoxGeometry(50, 50, 10),
    new THREE.MeshBasicMaterial({
      color: 0x00ffff
    })
  );
  orientationBox.position.z = -100;
  root.scene.add(orientationBox);

  // this camera is used for the environment map
  var envCubeCamera = new THREE.CubeCamera(1, 1000, 1024);
  envCubeCamera.renderTarget.texture.mapping = THREE.CubeRefractionMapping;
  //envCubeCamera.renderTarget.texture.mapping = THREE.CubeReflectionMapping;
  root.addUpdateCallback(function() {
    envCubeCamera.updateCubeMap(root.renderer, root.scene);
  });

  // passing the env map to the material will set the correct defines
  var system = new Animation({
    envMap: envCubeCamera.renderTarget.texture,
    roughness: 0.0,
    metalness: 1.0,
    //combine: THREE.MultiplyOperation,
    //reflectivity: 1.0,
    //refractionRatio: 0.98
  });
  system.animate(8.0, {ease: Power0.easeIn, repeat:-1, repeatDelay:0.25, yoyo: true});
  root.add(system);
}

////////////////////
// CLASSES
////////////////////

function Animation(params) {
  var rangeX = 300;
  var rangeY = 200;
  var prefabCount = 6;
  var size = rangeY / prefabCount;

  //var prefabGeometry = new THREE.TorusKnotGeometry(size * 0.25, 2.0);
  var prefabGeometry = new THREE.TorusGeometry(size * 0.25, 4.0, 32, 16);
  var geometry = new THREE.BAS.PrefabBufferGeometry(prefabGeometry, prefabCount);

  var i, j, offset;

  var aDelayDuration = geometry.createAttribute('aDelayDuration', 3);
  var duration = 1.0;
  var maxPrefabDelay = 0.5;
  var maxVertexDelay = 0.0;

  this.totalDuration = duration + maxPrefabDelay + maxVertexDelay * 2;

  for (i = 0, offset = 0; i < prefabCount; i++) {
    var delay = THREE.Math.mapLinear(i, 0, prefabCount, 0.0, maxPrefabDelay);

    for (j = 0; j < prefabGeometry.vertices.length; j++) {
      aDelayDuration.array[offset] = delay + (2 - j % 2) * maxVertexDelay;
      aDelayDuration.array[offset + 1] = duration;

      offset += 3;
    }
  }

  var aStartPosition = geometry.createAttribute('aStartPosition', 3);
  var aEndPosition = geometry.createAttribute('aEndPosition', 3);
  var startPosition = new THREE.Vector3();
  var endPosition = new THREE.Vector3();

  for (i = 0, offset = 0; i < prefabCount; i++) {
    startPosition.x = -rangeX * 0.5;
    startPosition.y = THREE.Math.mapLinear(i, 0, prefabCount, -rangeY * 0.5, rangeY * 0.5) + size * 0.5;
    startPosition.z = 0;

    endPosition.x = rangeX * 0.5;
    endPosition.y = startPosition.y;
    endPosition.z = 0;

    for (j = 0; j < prefabGeometry.vertices.length; j++) {
      aStartPosition.array[offset] = startPosition.x;
      aStartPosition.array[offset + 1] = startPosition.y;
      aStartPosition.array[offset + 2] = startPosition.z;

      aEndPosition.array[offset] = endPosition.x;
      aEndPosition.array[offset + 1] = endPosition.y;
      aEndPosition.array[offset + 2] = endPosition.z;

      offset += 3;
    }
  }

  var aAxisAngle = geometry.createAttribute('aAxisAngle', 4);
  var axis = new THREE.Vector3();
  var angle;

  for (i = 0, offset = 0; i < prefabCount; i++) {
    axis.x = THREE.Math.randFloatSpread(2);
    axis.y = THREE.Math.randFloatSpread(2);
    axis.z = THREE.Math.randFloatSpread(2);
    axis.normalize();
    angle = Math.PI * 2;

    for (j = 0; j < prefabGeometry.vertices.length; j++) {
      aAxisAngle.array[offset] = axis.x;
      aAxisAngle.array[offset + 1] = axis.y;
      aAxisAngle.array[offset + 2] = axis.z;
      aAxisAngle.array[offset + 3] = angle;

      offset += 4;
    }
  }

  var material = new THREE.BAS.StandardAnimationMaterial({
    //shading: THREE.FlatShading,
    uniforms: {
      uTime: {value: 0},
      uBezierCurve: {value: new THREE.Vector4(.42,0,.58,1)}
    },
    vertexFunctions: [
      THREE.BAS.ShaderChunk['ease_bezier'],
      THREE.BAS.ShaderChunk['quaternion_rotation']
    ],
    vertexParameters: [
      'uniform float uTime;',
      'uniform vec4 uBezierCurve;',
      'attribute vec2 aDelayDuration;',
      'attribute vec3 aStartPosition;',
      'attribute vec3 aEndPosition;',
      'attribute vec4 aAxisAngle;'
    ],
    vertexInit: [
      'float tProgress = clamp(uTime - aDelayDuration.x, 0.0, aDelayDuration.y) / aDelayDuration.y;',
      'tProgress = easeBezier(tProgress, uBezierCurve);',

      'vec4 tQuat = quatFromAxisAngle(aAxisAngle.xyz, aAxisAngle.w * tProgress);'
    ],
    vertexNormal: [
      // need to transform the objectNormal for correct env map calculations
      'objectNormal = rotateVector(tQuat, objectNormal);'
    ],
    vertexPosition: [
      'transformed = rotateVector(tQuat, transformed);',

      'transformed += mix(aStartPosition, aEndPosition, tProgress);'
    ]
  }, params);

  geometry.computeVertexNormals();

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
