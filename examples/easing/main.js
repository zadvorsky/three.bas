window.onload = init;

function init() {
  var root = new THREERoot({
    createCameraControls: true,
    antialias: (window.devicePixelRatio === 1),
    fov: 60
  });
  root.renderer.setClearColor(0x222222);
  root.camera.position.set(0, 0, 150);

  var grid = new THREE.GridHelper(50, 10);
  grid.material.depthWrite = false;
  grid.setColors(0x333333, 0x333333);
  grid.rotation.x = Math.PI * 0.5;
  root.scene.add(grid);

  var eases = [
    'ease_bounce_in',
    'ease_bounce_out',
    'ease_bounce_in_out',

    'ease_elastic_in',
    'ease_elastic_out',
    'ease_elastic_in_out',

    'ease_expo_in',
    'ease_expo_out',
    'ease_expo_in_out',

    'ease_sine_in',
    'ease_sine_out',
    'ease_sine_in_out',

    'ease_circ_in',
    'ease_circ_out',
    'ease_circ_in_out',

    'ease_back_in',
    'ease_back_out',
    'ease_back_in_out',

    'ease_quad_in',
    'ease_quad_out',
    'ease_quad_in_out',
    'ease_cubic_in',
    'ease_cubic_out',
    'ease_cubic_in_out',
    'ease_quart_in',
    'ease_quart_out',
    'ease_quart_in_out',
    'ease_quint_in',
    'ease_quint_out',
    'ease_quint_in_out'
  ];
  var systems = {};

  var index = 0;
  var currentSystem;

  // dom stuff
  var elNext = document.querySelector('.button.next');
  var elPrev = document.querySelector('.button.prev');
  var elEaseName = document.querySelector('.ease_name');

  elNext.addEventListener('click', function() {
    if (++index === eases.length) index = 0;
    setCurrentSystem(index);
  });
  elPrev.addEventListener('click', function() {
    if (--index === -1) index = eases.length - 1;
    setCurrentSystem(index);
  });

  function setCurrentSystem(i) {
    var ease = eases[i];
    var system = systems[ease];

    // lazy init so we don't blow up computers
    if (!system) {
      system = systems[ease] = new ParticleSystem(ease);
    }

    currentSystem && root.remove(currentSystem);
    currentSystem = system;
    currentSystem.animate(2.0, {ease: Power0.easeIn, repeat:-1, repeatDelay:0.25, yoyo: true});

    elEaseName.innerHTML = currentSystem.ease;

    root.add(currentSystem);
  }

  setCurrentSystem(index);
}

////////////////////
// CLASSES
////////////////////

function ParticleSystem(easeName) {
  this.ease = easeName;

  var rangeX = 100;
  var rangeY = 100;
  var prefabCount = 1000;
  var size = rangeY / prefabCount;

  var prefabGeometry = new THREE.PlaneGeometry(size * 2, size);
  var geometry = new THREE.BAS.PrefabBufferGeometry(prefabGeometry, prefabCount);

  var i, j, offset;

  // animation
  var aAnimation = geometry.createAttribute('aAnimation', 3);

  var duration = 1.0;
  var maxPrefabDelay = 0.5;
  var maxVertexDelay = 0.1;

  this.totalDuration = duration + maxPrefabDelay + maxVertexDelay * 2;

  for (i = 0, offset = 0; i < prefabCount; i++) {
    var delay = THREE.Math.mapLinear(i, 0, prefabCount, 0.0, maxPrefabDelay);

    for (j = 0; j < prefabGeometry.vertices.length; j++) {
      aAnimation.array[offset] = delay + (2 - j % 2) * maxVertexDelay;
      aAnimation.array[offset + 1] = duration;

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
    startPosition.y = THREE.Math.mapLinear(i, 0, prefabCount, -rangeY * 0.5, rangeY * 0.5);
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

  // from names to to camel case (i.e. ease_back_in -> easeBackIn)
  function underscoreToCamelCase(str) {
    return str.replace(/_([a-z])/g, function (g) {return g[1].toUpperCase();});
  }

  var easeChunk;

  // workaround of all bounce eases being defined in the same file
  if (easeName.indexOf('bounce')) {
    easeChunk = 'ease_bounce';
  }
  else {
    easeChunk = easeName;
  }

  var material = new THREE.BAS.BasicAnimationMaterial({
    shading: THREE.FlatShading,
    transparent: true,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: {type: 'f', value: 0}
    },
    vertexFunctions: [
      THREE.BAS.ShaderChunk['quaternion_rotation'],
      THREE.BAS.ShaderChunk[easeChunk]
    ],
    vertexParameters: [
      'uniform float uTime;',
      'attribute vec2 aAnimation;',
      'attribute vec3 aStartPosition;',
      'attribute vec3 aEndPosition;'
    ],
    vertexInit: [
      'float tDelay = aAnimation.x;',
      'float tDuration = aAnimation.y;',
      'float tTime = clamp(uTime - tDelay, 0.0, tDuration);',
      'float tProgress = ' + underscoreToCamelCase(easeName) + '(tTime, 0.0, 1.0, tDuration);',
      // linear
      //'float tProgress = tTime / tDuration;'
    ],
    vertexPosition: [
      'transformed += mix(aStartPosition, aEndPosition, tProgress);'
    ]
  });

  THREE.Mesh.call(this, geometry, material);

  this.frustumCulled = false;
}
ParticleSystem.prototype = Object.create(THREE.Mesh.prototype);
ParticleSystem.prototype.constructor = ParticleSystem;
Object.defineProperty(ParticleSystem.prototype, 'time', {
  get: function () {
    return this.material.uniforms['uTime'].value;
  },
  set: function (v) {
    this.material.uniforms['uTime'].value = v;
  }
});

ParticleSystem.prototype.animate = function (duration, options) {
  options = options || {};
  options.time = this.totalDuration;

  return TweenMax.fromTo(this, duration, {time: 0.0}, options);
};
