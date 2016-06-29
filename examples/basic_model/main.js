window.onload = init;

function init() {
  var root = new THREERoot({
    fov: 60,
    createCameraControls: true
  });
  root.renderer.setClearColor(0x000000);
  root.camera.position.set(0, 0, 30);
  root.controls.autoRotate = true;

  var light = new THREE.DirectionalLight();
  light.position.set(0, 0, 1);
  root.scene.add(light);

  light = new THREE.DirectionalLight();
  light.position.set(0, 0, -1);
  root.scene.add(light);

  var animation = new Animation();
  root.add(animation);

  animation.animate(4.0, {ease: Power0.easeIn, repeat:-1, repeatDelay:0.0, yoyo: false, onRepeat: function() {
    animation.backFaceColor.setHSL(Math.random(), 1.0, 0.5);
  }});
}

////////////////////
// CLASSES
////////////////////

function Animation() {
  var modelRadius = 10;
  var modelTube = 4;
  var model = new THREE.TorusGeometry(modelRadius, modelTube, 256, 256);

  THREE.BAS.Utils.separateFaces(model);

  var geometry = new THREE.BAS.ModelBufferGeometry(model, {
    localizeFaces: true,
    computeCentroids: true
  });

  // ANIMATION

  var aDelayDuration = geometry.createAttribute('aDelayDuration', 2);
  var minDuration = 1.0;
  var maxDuration = 1.0;
  var centroidDelayFactor = 0.1;

  this.totalDuration = maxDuration + centroidDelayFactor * (modelRadius + modelTube);

  for (var i = 0, offset = 0; i < geometry.faceCount; i++) {

    // animation
    var duration = THREE.Math.randFloat(minDuration, maxDuration);
    var centroidLength = geometry.centroids[i].length();
    var delay = centroidLength * centroidDelayFactor;

    for (var j = 0; j < 3; j++) {
      aDelayDuration.array[offset]     = delay;
      aDelayDuration.array[offset + 1] = duration;

      offset += 2;
    }
  }

  // POSITION

  var aPosition = geometry.createAttribute('aPosition', 3, function(data, i) {
    geometry.centroids[i].toArray(data);
  });

  // ROTATION

  var axis = new THREE.Vector3();

  var aAxisAngle = geometry.createAttribute('aAxisAngle', 4, function(data, i) {
    axis.copy(geometry.centroids[i]).normalize();
    axis.toArray(data);
    data[3] = Math.PI * 4;
  });

  var material = new THREE.BAS.StandardAnimationMaterial({
    shading: THREE.FlatShading,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: {value: 0},
      uBackColor: {value: new THREE.Color().setHSL(0, 1.0, 0.5)}
    },
    uniformValues: {
      diffuse: new THREE.Color(0x000000)
    },
    vertexFunctions: [
      THREE.BAS.ShaderChunk['ease_cubic_in_out'],
      THREE.BAS.ShaderChunk['quaternion_rotation']
    ],
    vertexParameters: [
      'uniform float uTime;',
      'attribute vec2 aDelayDuration;',
      'attribute vec3 aPosition;',
      'attribute vec4 aAxisAngle;'
    ],
    vertexInit: [
      'float tProgress = clamp(uTime - aDelayDuration.x, 0.0, aDelayDuration.y) / aDelayDuration.y;',
      'tProgress = easeCubicInOut(tProgress);'
    ],
    vertexPosition: [
      'vec3 axis = aAxisAngle.xyz;',
      'vec4 tQuat = quatFromAxisAngle(axis, aAxisAngle.w * tProgress);',

      'transformed = rotateVector(tQuat, transformed);',
      'transformed += aPosition;'
    ],
    fragmentParameters: [
      'uniform vec3 uBackColor;'
    ],
    fragmentAlpha: [
      'if (!gl_FrontFacing) {',
      ' diffuseColor.rgb = uBackColor.xyz;',
      '}'
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

Object.defineProperty(Animation.prototype, 'backFaceColor', {
  get: function () {
    return this.material.uniforms['uBackColor'].value;
  },
  set: function (v) {
    this.material.uniforms['uBackColor'].value = v;
  }
});


Animation.prototype.animate = function (duration, options) {
  options = options || {};
  options.time = this.totalDuration;

  return TweenMax.fromTo(this, duration, {time: 0.0}, options);
};
