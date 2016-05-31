window.onload = init;

function init() {
  var root = new THREERoot({
    createCameraControls: true,
    antialias: (window.devicePixelRatio === 1),
    fov: 60
  });
  root.renderer.setClearColor(0x222222);

  root.camera.position.set(0, 0, 200);

  var particleSystem = new ParticleSystem();
  particleSystem.animate();
  root.scene.add(particleSystem);
}

////////////////////
// CLASSES
////////////////////

function ParticleSystem() {
  var prefabGeometry = new THREE.CubeGeometry(1.0, 1.0, 1.0);
  var prefabCount = 2000;
  var geometry = new THREE.BAS.PrefabBufferGeometry(prefabGeometry, prefabCount);

  var i, j, offset;

  // animation
  var aAnimation = geometry.createAttribute('aAnimation', 3);

  var minDuration = 1.0;
  var maxDuration = 1.0;
  var maxDelay = 0;

  this.totalDuration = maxDuration + maxDelay;

  for (i = 0, offset = 0; i < prefabCount; i++) {
    var delay = 0;
    var duration = THREE.Math.randFloat(minDuration, maxDuration);

    for (j = 0; j < prefabGeometry.vertices.length; j++) {
      aAnimation.array[offset] = delay;
      aAnimation.array[offset + 1] = duration;

      offset += 3;
    }
  }

  // startPosition
  var aStartPosition = geometry.createAttribute('aStartPosition', 3);
  var aEndPosition = geometry.createAttribute('aEndPosition', 3);
  var startPosition = new THREE.Vector3();
  var endPosition = new THREE.Vector3();
  var range = 100;

  for (i = 0, offset = 0; i < prefabCount; i++) {
    startPosition.x = THREE.Math.randFloatSpread(range);
    startPosition.y = THREE.Math.randFloatSpread(range);
    startPosition.z = THREE.Math.randFloatSpread(range);

    endPosition.x = THREE.Math.randFloatSpread(range);
    endPosition.y = THREE.Math.randFloatSpread(range);
    endPosition.z = THREE.Math.randFloatSpread(range);

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

  //var ease = 'ease_back_in';
  //var ease = 'ease_back_out';
  //var ease = 'ease_back_in_out';
  //var ease = 'ease_cubic_in';
  //var ease = 'ease_cubic_out';
  //var ease = 'ease_cubic_in_out';
  //var ease = 'ease_quad_in';
  //var ease = 'ease_quad_out';
  //var ease = 'ease_quad_in_out';
  //var ease = 'ease_quart_in';
  //var ease = 'ease_quart_out';
  //var ease = 'ease_quart_in_out';
  //var ease = 'ease_quint_in';
  //var ease = 'ease_quint_out';
  var ease = 'ease_quint_in_out';

  var material = new THREE.BAS.BasicAnimationMaterial(
    {
      shading: THREE.FlatShading,
      transparent: true,
      uniforms: {
        uTime: {type: 'f', value: 0}
      },
      vertexFunctions: [
        THREE.BAS.ShaderChunk['quaternion_rotation'],
        THREE.BAS.ShaderChunk[ease],
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
        'float tProgress = ' + underscoreToCamelCase(ease) + '(tTime, 0.0, 1.0, tDuration);',
        // linear
        //'float tProgress = tTime / tDuration;'
      ],
      vertexPosition: [
        'transformed += mix(aStartPosition, aEndPosition, tProgress);'
      ]
    }
  );

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

ParticleSystem.prototype.animate = function () {
  return TweenMax.fromTo(this, 2.0, {time: 0.0}, {time: this.totalDuration, ease: Power0.easeInOut, repeat:-1, yoyo: true});
};

// utils

function underscoreToCamelCase(str) {
  return str.replace(/_([a-z])/g, function (g) {return g[1].toUpperCase();});
}
