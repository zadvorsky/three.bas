window.onload = init;

function init() {
  var root = new THREERoot({
    createCameraControls: true,
    antialias: (window.devicePixelRatio === 1),
    fov: 60
  });
  root.renderer.setClearColor(0x222222);
  root.camera.position.set(0, 0, 150);

  var grid = new THREE.GridHelper(100, 10, 0x333333, 0x333333);
  grid.material.depthWrite = false;
  grid.rotation.x = Math.PI * 0.5;
  root.scene.add(grid);

  var eases = [
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
    'ease_quint_in_out',

    'ease_sine_in',
    'ease_sine_out',
    'ease_sine_in_out',

    'ease_circ_in',
    'ease_circ_out',
    'ease_circ_in_out',

    'ease_expo_in',
    'ease_expo_out',
    'ease_expo_in_out',

    'ease_back_in',
    'ease_back_out',
    'ease_back_in_out',

    'ease_elastic_in',
    'ease_elastic_out',
    'ease_elastic_in_out',

    'ease_bounce_in',
    'ease_bounce_out',
    'ease_bounce_in_out'
  ];
  var systems = {};

  // cycle through the eases above

  var elNext = document.querySelector('.button.next');
  var elPrev = document.querySelector('.button.prev');
  var elEaseName = document.querySelector('.ease_name');

  var index = 0;
  var currentSystem;

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
      system = systems[ease] = new EaseSystem(ease);
    }

    currentSystem && root.remove(currentSystem.mesh);
    currentSystem = system;
    currentSystem.animate(2.0, {ease: Power0.easeIn, repeat:-1, repeatDelay:0.25, yoyo: true});

    elEaseName.innerHTML = currentSystem.ease;

    root.add(currentSystem.mesh);
  }

  setCurrentSystem(index);
}

////////////////////
// CLASSES
////////////////////

function EaseSystem(ease) {
  this.ease = ease;

  var rangeX = 100;
  var rangeY = 100;
  var prefabCount = 1000;
  var size = rangeY / prefabCount;

  var prefabGeometry = new THREE.PlaneGeometry(size * 2, size);
  var geometry = new BAS.PrefabBufferGeometry(prefabGeometry, prefabCount);

  var i, j, offset;

  // Animation

  // x = animation delay, y = animation duration
  var aDelayDuration = geometry.createAttribute('aDelayDuration', 3);

  var duration = 2.0;
  var maxPrefabDelay = 1.0;
  var maxVertexDelay = 0.2;

  this.totalDuration = duration + maxPrefabDelay + maxVertexDelay * 2;

  for (i = 0, offset = 0; i < prefabCount; i++) {
    var prefabDelay = THREE.MathUtils.mapLinear(i, 0, prefabCount, 0.0, maxPrefabDelay);

    for (j = 0; j < prefabGeometry.attributes.position.count; j++) {
      // give top right and bottom right corner of the plane a longer delay
      // this causes the plane to stretch
      aDelayDuration.array[offset    ] = prefabDelay + (2 - j % 2) * maxVertexDelay;
      aDelayDuration.array[offset + 1] = duration;

      offset += 3;
    }
  }

  // Position

  // planes will move from aStartPosition to aEndPosition
  var aStartPosition = geometry.createAttribute('aStartPosition', 3);
  var aEndPosition = geometry.createAttribute('aEndPosition', 3);

  // temp vars so we don't create redundant objects
  var startPosition = new THREE.Vector3();
  var endPosition = new THREE.Vector3();

  for (i = 0, offset = 0; i < prefabCount; i++) {
    // movement over the x axis, y and z are the same
    startPosition.x = -rangeX * 0.5;
    startPosition.y = THREE.MathUtils.mapLinear(i, 0, prefabCount, -rangeY * 0.5, rangeY * 0.5);
    startPosition.z = 0;

    endPosition.x = rangeX * 0.5;
    endPosition.y = startPosition.y;
    endPosition.z = 0;

    // store the same values per prefab
    for (j = 0; j < prefabGeometry.attributes.position.count; j++) {
      aStartPosition.array[offset    ] = startPosition.x;
      aStartPosition.array[offset + 1] = startPosition.y;
      aStartPosition.array[offset + 2] = startPosition.z;

      aEndPosition.array[offset    ] = endPosition.x;
      aEndPosition.array[offset + 1] = endPosition.y;
      aEndPosition.array[offset + 2] = endPosition.z;

      offset += 3;
    }
  }

  // from names to to camel case (i.e. ease_back_in -> easeBackIn)
  function underscoreToCamelCase(str) {
    return str.replace(/_([a-z])/g, function (g) {return g[1].toUpperCase();});
  }

  var material = new BAS.BasicAnimationMaterial({
    side: THREE.DoubleSide,
    // uniforms for the material
    uniforms: {
      uTime: {type: 'f', value: 0}
    },
    // functions for the vertex shader
    vertexFunctions: [
      // get the easing function definition
      BAS.ShaderChunk[ease]
    ],
    // uniform names must correspond to material.uniforms keys
    // attribute names must correspond to geometry.attribute names
    vertexParameters: [
      'uniform float uTime;',
      'attribute vec2 aDelayDuration;',
      'attribute vec3 aStartPosition;',
      'attribute vec3 aEndPosition;'
    ],
    vertexInit: [
      // all ease functions have two signatures

      // one in the form of easeFunctionName(t, b, c, d)
      // t: time
      // b: begin value
      // c: change in value
      // d: duration
      // which looks like this:
      //'float tTime = clamp(uTime - aDelayDuration.x, 0.0, aDelayDuration.y);',
      //'float tProgress = ' + easeFunctionName + '(tTime, 0.0, 1.0, aDelayDuration.y);',

      // and another in the form of easeFunctionName(p);
      // here p is expected to be in range 0.0 to 1.0
      // which looks like this:
      'float tProgress = clamp(uTime - aDelayDuration.x, 0.0, aDelayDuration.y) / aDelayDuration.y;',
      'tProgress = ' + underscoreToCamelCase(ease) + '(tProgress);'

      // linear progress looks like this:
      //'float tProgress = tTime / aDelayDuration.y;'
    ],
    vertexPosition: [
      // simple linear interpolation between start and end positions
      'transformed += mix(aStartPosition, aEndPosition, tProgress);'
    ]
  });

  this.mesh = new THREE.Mesh(geometry, material);
  this.mesh.frustumCulled = false;
}

// helper method to set the uTime uniform value
Object.defineProperty(EaseSystem.prototype, 'time', {
  get: function () {
    return this.mesh.material.uniforms['uTime'].value;
  },
  set: function (v) {
    this.mesh.material.uniforms['uTime'].value = v;
  }
});

// helper method to animate uTime uniform based on totalDuration (which is calculated in the constructor)
EaseSystem.prototype.animate = function (duration, options) {
  options = options || {};
  options.time = this.totalDuration;

  return TweenMax.fromTo(this, duration, {time: 0.0}, options);
};
