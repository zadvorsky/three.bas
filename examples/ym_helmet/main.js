window.onload = init;

function init() {
  var root = new THREERoot({
    fov: 80,
    zNear: 0.01,
    zFar: 10000,
    createCameraControls: false
  });
  root.renderer.setClearColor(0x444444);
  root.camera.position.z = 10.0;

  var dolly = new THREE.Object3D();
  dolly.add(root.camera);
  root.add(dolly);

  var light = new THREE.DirectionalLight(0xffffff, 0.5);
  light.position.set(0.5, 0, 1);
  root.camera.add(light);

  light = new THREE.PointLight(0x6600ff, 1.0, 6);
  root.add(light);

  // post processing
  var bloomPass = new THREE.BloomPass(2.0, 25, 4, 512);
  var copyPass = new THREE.ShaderPass(THREE.CopyShader);

  root.initPostProcessing([
    bloomPass,
    copyPass
  ]);

  new THREE.JSONLoader().load('ym_helmet_v1.json', function(g) {
    g.center();

    var animation = new Animation(g);
    root.add(animation);

    var tl = new TimelineMax({repeat: -1, repeatDelay: 1});

    tl.add(animation.animate(16.0, {ease: Power1.easeOut}));
    tl.fromTo(root.camera.position, 8.0, {z: 16.0}, {z: 6.0, ease: Power2.easeInOut}, 0);
    tl.fromTo(dolly.rotation, 16.0, {y:-Math.PI}, {y: 0, ease: Power2.easeOut}, 0);

    tl.timeScale(2);

    createTweenScrubber(tl);
  });
}

////////////////////
// CLASSES
////////////////////

function Animation(model) {
  model.computeBoundingBox();
  model.computeVertexNormals();

  THREE.BAS.Utils.separateFaces(model);

  var geometry = new THREE.BAS.ModelBufferGeometry(model, {
    localizeFaces: true,
    computeCentroids: true
  });

  var normal = geometry.createAttribute('normal', 3);

  for (var i = 0; i < model.faces.length; i++) {
    var face = model.faces[i];

    var ia = face.a * 3;
    normal.array[ia    ] = face.vertexNormals[0].x;
    normal.array[ia + 1] = face.vertexNormals[0].y;
    normal.array[ia + 2] = face.vertexNormals[0].z;

    var ib = face.b * 3;
    normal.array[ib    ] = face.vertexNormals[1].x;
    normal.array[ib + 1] = face.vertexNormals[1].y;
    normal.array[ib + 2] = face.vertexNormals[1].z;

    var ic = face.c * 3;
    normal.array[ic    ] = face.vertexNormals[2].x;
    normal.array[ic + 1] = face.vertexNormals[2].y;
    normal.array[ic + 2] = face.vertexNormals[2].z;
  }

  var maxDelayX = 0.5;
  var maxDelayY = 2.0;
  var minDuration = 0.5;
  var maxDuration = 1.0;
  var bounds = model.boundingBox;

  this.totalDuration = maxDelayX + maxDelayY + maxDuration;

  var aDelayDuration = geometry.createAttribute('aDelayDuration', 2);
  var offset = 0;

  for (i = 0; i < geometry.faceCount; i++) {
    var c = geometry.centroids[i];
    var delayX = mapEase(Power4.easeOut, Math.abs(c.x), 0, bounds.max.x, 0.0, maxDelayX);
    var delayY = mapEase(Power4.easeOut, c.y, bounds.max.y, bounds.min.y, 0.0, maxDelayY);

    var delay = (delayX + delayY) * THREE.Math.randFloat(0.9, 1.0);
    var duration = THREE.Math.randFloat(minDuration, maxDuration);

    for (var j = 0; j < 3; j++) {
      aDelayDuration.array[offset++] = delay + j * 0.015;
      aDelayDuration.array[offset++] = duration;
    }
  }

  var aStartPosition = geometry.createAttribute('aStartPosition', 3, function(data, i) {
    var c = geometry.centroids[i];

    data[0] = 0;
    data[1] = c.y - THREE.Math.randFloat(2, 4);
    data[2] = 0;
  });

  var aEndPosition = geometry.createAttribute('aEndPosition', 3, function(data, i) {
    geometry.centroids[i].toArray(data);
  });

  var aPivot = geometry.createAttribute('aPivot', 3, function(data, i) {
    var c = geometry.centroids[i];
    var l = THREE.Math.randFloat(0.5, 4.0);

    data[0] = c.x * l;
    data[1] = 0;
    data[2] = c.z * l;
  });

  var axis = new THREE.Vector3();
  var aAxisAngle = geometry.createAttribute('aAxisAngle', 4, function(data, i) {
    axis.copy(geometry.centroids[i]).normalize().toArray(data);
    data[3] = Math.PI;
  });

  var material = new THREE.BAS.StandardAnimationMaterial({
    shading: THREE.SmoothShading,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: {value: 0}
    },
    uniformValues: {
      diffuse: new THREE.Color(0x555555),
      metalness: 1.0,
      roughness: 0.5
    },
    vertexFunctions: [
      THREE.BAS.ShaderChunk.cubic_bezier,
      THREE.BAS.ShaderChunk.quaternion_rotation,
      THREE.BAS.ShaderChunk.ease_back_out,
      THREE.BAS.ShaderChunk.ease_circ_in_out
    ],
    vertexParameters: [
      'uniform float uTime;',

      'attribute vec2 aDelayDuration;',

      'attribute vec3 aStartPosition;',
      'attribute vec3 aEndPosition;',

      'attribute vec4 aAxisAngle;',
      'attribute vec3 aPivot;'
    ],
    varyingParameters: [
      'varying float vProgress;'
    ],
    vertexInit: [
      'float progress = clamp(uTime - aDelayDuration.x, 0.0, aDelayDuration.y) / aDelayDuration.y;',
      'float eased = easeCircInOut(progress);',

      'vec4 quat = quatFromAxisAngle(aAxisAngle.xyz, aAxisAngle.w * (1.0 - eased));',

      'vProgress = eased;'
    ],
    vertexNormal: [
      'objectNormal = rotateVector(quat, objectNormal);'
    ],
    vertexPosition: [
      'transformed *= progress;',

      'transformed += aPivot;',
      'transformed = rotateVector(quat, transformed);',
      'transformed -= aPivot;',

      'transformed += mix(aStartPosition, aEndPosition, easeBackOut(progress, 4.0));'
    ],
    fragmentInit: [
      'if (vProgress == 0.0) discard;'
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

// utils

function ease(e, t, b, c, d) {
  return b + e.getRatio(t / d) * c;
}

function mapEase(e, v, a1, a2, b1, b2) {
  var t = v - a1;
  var b = b1;
  var c = b2 - b1;
  var d = a2 - a1;

  return ease(e, t, b, c, d);
}

function createTweenScrubber(tween, seekSpeed) {
  seekSpeed = seekSpeed || 0.001;

  function stop() {
    TweenMax.to(tween, 1, {
      timeScale: 0
    });
  }

  function resume() {
    TweenMax.to(tween, 1, {
      timeScale: 1
    });
  }

  function seek(dx) {
    var progress = tween.progress();
    var p = THREE.Math.clamp((progress + (dx * seekSpeed)), 0, 1);

    tween.progress(p);
  }

  var _cx = 0;

  // desktop
  var mouseDown = false;
  document.body.style.cursor = 'pointer';

  window.addEventListener('mousedown', function(e) {
    mouseDown = true;
    document.body.style.cursor = 'ew-resize';
    _cx = e.clientX;
    stop();
  });
  window.addEventListener('mouseup', function(e) {
    mouseDown = false;
    document.body.style.cursor = 'pointer';
    resume();
  });
  window.addEventListener('mousemove', function(e) {
    if (mouseDown === true) {
      var cx = e.clientX;
      var dx = cx - _cx;
      _cx = cx;

      seek(dx);
    }
  });
  // mobile
  window.addEventListener('touchstart', function(e) {
    _cx = e.touches[0].clientX;
    stop();
    e.preventDefault();
  });
  window.addEventListener('touchend', function(e) {
    resume();
    e.preventDefault();
  });
  window.addEventListener('touchmove', function(e) {
    var cx = e.touches[0].clientX;
    var dx = cx - _cx;
    _cx = cx;

    seek(dx);
    e.preventDefault();
  });
}