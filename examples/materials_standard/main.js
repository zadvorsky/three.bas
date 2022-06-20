window.onload = init;

function init() {
  var root = new THREERoot({
    createCameraControls: true,
    antialias: (window.devicePixelRatio === 1),
    fov: 60
  });
  root.renderer.setClearColor(0x222222);
  root.camera.position.set(0, 0, 175);

  var light = new THREE.DirectionalLight();
  root.add(light);

  light = new THREE.DirectionalLight();
  light.position.y = -1;
  root.add(light);

  var backgroundBox = new THREE.Mesh(
    new THREE.BoxGeometry(400, 400, 400, 10, 10, 10),
    new THREE.MeshBasicMaterial({
      color: 0xff00ff,
      wireframe: true
    })
  );
  root.add(backgroundBox);

  var orientationBox = new THREE.Mesh(
    new THREE.BoxGeometry(50, 50, 10),
    new THREE.MeshBasicMaterial({
      color: 0x00ffff
    })
  );
  orientationBox.position.z = -100;
  root.scene.add(orientationBox);

  const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(1024, {
    format: THREE.RGBFormat,
    generateMipmaps: true,
    minFilter: THREE.LinearMipmapLinearFilter
  });

  var envCubeCamera = new THREE.CubeCamera(1, 1000, cubeRenderTarget);
  envCubeCamera.renderTarget.texture.mapping = THREE.CubeRefractionMapping;
  //envCubeCamera.renderTarget.texture.mapping = THREE.CubeReflectionMapping;

  root.addUpdateCallback(function() {
    envCubeCamera.update(root.renderer, root.scene);
  });

  var animation = new Animation(envCubeCamera.renderTarget.texture);
  animation.animate(4.0, {ease: Power0.easeIn, repeat:-1, repeatDelay:0.25, yoyo: true});
  root.add(animation.mesh);
}

////////////////////
// CLASSES
////////////////////

function Animation(envMap) {
  var rangeX = 300;
  var rangeY = 200;
  var prefabCount = 6;
  var size = rangeY / prefabCount;

  //var prefabGeometry = new THREE.TorusKnotGeometry(size * 0.25, 2.0);
  var prefabGeometry = new THREE.TorusBufferGeometry(size * 0.25, 4.0, 32, 16);
  var geometry = new BAS.PrefabBufferGeometry(prefabGeometry, prefabCount);

  var i;
  var prefabDataArray = [];

  var aDelayDuration = geometry.createAttribute('aDelayDuration', 2);
  var duration = 1.0;
  var maxPrefabDelay = 0.5;

  this.totalDuration = duration + maxPrefabDelay;

  for (i = 0; i < prefabCount; i++) {
    var delay = THREE.MathUtils.mapLinear(i, 0, prefabCount, 0.0, maxPrefabDelay);

    geometry.setPrefabData(aDelayDuration, i, [delay, duration]);
  }

  var aStartPosition = geometry.createAttribute('aStartPosition', 3);
  var aEndPosition = geometry.createAttribute('aEndPosition', 3);
  var startPosition = new THREE.Vector3();
  var endPosition = new THREE.Vector3();

  for (i = 0; i < prefabCount; i++) {
    startPosition.x = -rangeX * 0.5;
    startPosition.y = THREE.MathUtils.mapLinear(i, 0, prefabCount, -rangeY * 0.5, rangeY * 0.5) + size * 0.5;
    startPosition.z = 0;

    endPosition.x = rangeX * 0.5;
    endPosition.y = startPosition.y;
    endPosition.z = 0;

    geometry.setPrefabData(aStartPosition, i, startPosition.toArray(prefabDataArray));
    geometry.setPrefabData(aEndPosition, i, endPosition.toArray(prefabDataArray));
  }

  var aAxisAngle = geometry.createAttribute('aAxisAngle', 4);
  var axis = new THREE.Vector3();
  var angle;

  for (i = 0; i < prefabCount; i++) {
    axis.x = THREE.MathUtils.randFloatSpread(2);
    axis.y = THREE.MathUtils.randFloatSpread(2);
    axis.z = THREE.MathUtils.randFloatSpread(2);
    axis.normalize();
    angle = Math.PI * 2;

    axis.toArray(prefabDataArray);
    prefabDataArray[3] = angle;

    geometry.setPrefabData(aAxisAngle, i, axis.toArray(prefabDataArray));
  }

  var material = new BAS.StandardAnimationMaterial({
    transparent: true,
    uniforms: {
      uTime: {value: 0},
      uBezierCurve: {value: new THREE.Vector4(.42,0,.58,1)},
      uMap2: {value: null}
    },
    uniformValues: {
      map: new THREE.TextureLoader().load('../_tex/UV_Grid.jpg'),
      envMap: envMap,
      reflectivity: 0.75,
      refractionRatio: 0.98
    },
    // functions for the vertex shader (cannot be used in the fragment shader)
    vertexFunctions: [
      BAS.ShaderChunk['ease_bezier'],
      BAS.ShaderChunk['quaternion_rotation']
    ],
    // parameters for the vertex shader
    vertexParameters: [
      'uniform float uTime;',
      'uniform vec4 uBezierCurve;',
      'attribute vec2 aDelayDuration;',
      'attribute vec3 aStartPosition;',
      'attribute vec3 aEndPosition;',
      'attribute vec4 aAxisAngle;'
    ],
    // varying parameters get injected into both the vertex and the fragment shader
    varyingParameters: [
      'varying float vAlpha;',
      'varying vec3 vEmissive;',
      'varying float vRoughness;',
      'varying float vMetalness;',
      'varying float vProgress;'
    ],
    // this chunk gets injected at the top of main() of the vertex shader
    vertexInit: [
      'float tProgress = clamp(uTime - aDelayDuration.x, 0.0, aDelayDuration.y) / aDelayDuration.y;',
      'tProgress = easeBezier(tProgress, uBezierCurve);',
      'vProgress = tProgress;',

      'vec4 tQuat = quatFromAxisAngle(aAxisAngle.xyz, aAxisAngle.w * tProgress);'
    ],
    // this chunk gets injected after <beginnormal_vertex> (before any other normal calculations)
    // objectNormal (transformed normal) is used throughout the vertex shader
    vertexNormal: [
      'objectNormal = rotateVector(tQuat, objectNormal);'
    ],
    // this chunk gets injected after <begin_vertex> (before any other normal calculations)
    // transformed (transformed position) is used throughout the vertex shader
    vertexPosition: [
      'transformed = rotateVector(tQuat, transformed);',
      'transformed += mix(aStartPosition, aEndPosition, tProgress);'
    ],
    // this chunk gets injected after vertexPosition
    vertexColor: [
      // these don't make any sense - it's just to test if it works
      'vAlpha = abs(transformed.x) / 150.0 * 0.9 + 0.1;', // based on rangeX = 300
      'vEmissive = abs(normalize(transformed)) * 0.25;',
      'vRoughness = (transformed.x + 150.0) * 0.5 / 150.0;',
      'vMetalness = (transformed.y + 100.0) * 0.5 / 100.0;'
    ],
    // functions for the fragment shader (cannot be used in vertex shader)
    fragmentFunctions: [

    ],
    // parameters for the fragment shader
    fragmentParameters: [
      'uniform sampler2D uMap2;'
    ],
    // this chunk overrides <map_fragment>
    // see https://github.com/mrdoob/three.js/blob/master/src/renderers/shaders/ShaderChunk/map_fragment.glsl
    fragmentMap: [
      'vec4 texelColor1 = texture2D(map, vUv);',
      'vec4 texelColor2 = texture2D(uMap2, vUv);',
      'vec4 texelColor = mix(texelColor1, texelColor2, vProgress);',
      'diffuseColor *= texelColor;'
    ],
    // this chunk gets injected after 'diffuseColor' is defined
    // changes to diffuse color (outside of vertex colors) and alpha should go here
    // diffuseColor is used throughout the fragment shader
    fragmentDiffuse: [
      'diffuseColor.a *= vAlpha;'
    ],
    // this chunk is injected after roughnessFactor is initialized (before roughnessMap sampling)
    // roughnessFactor is used in subsequent calculations
    fragmentRoughness: [
      'roughnessFactor = vRoughness;'
    ],
    // this chunk is injected after metalnessFactor is initialized (before metalnessMap sampling)
    // metalnessFactor is used in subsequent calculations
    fragmentMetalness: [
      'metalnessFactor = vMetalness;'
    ],
    // this chunk gets injected before <emissivemap_fragment>
    // totalEmissiveRadiance is modulated by the emissive map color
    fragmentEmissive: [
      'totalEmissiveRadiance = vEmissive;' // default emissive = (0, 0, 0)
    ]
  });

  // for some reason setting the value inside the constructor does not work :'(
  material.uniforms.uMap2.value = new THREE.TextureLoader().load('../_tex/brick_diffuse.jpg');

  geometry.computeVertexNormals();
  geometry.bufferUvs();

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
