window.onload = init;

function init() {
  var root = new THREERoot({
    createCameraControls:true,
    fov:60
  });
  root.renderer.setClearColor(0x000000);
  root.renderer.setPixelRatio(window.devicePixelRatio || 1);
  root.camera.position.set(0, 0, 400);

  var light = new THREE.DirectionalLight(0xffffff, 1.0);
  light.position.set(0, 0, 1);
  root.scene.add(light);


  var textAnimation = createTextAnimation();
  root.scene.add(textAnimation);

  textAnimation.bufferAnimation(new THREE.Vector3());

  var tl = new TimelineMax({
    repeat:-1,
    repeatDelay:0.0,
    yoyo:false
  });
  tl.fromTo(textAnimation, 10,
    {animationProgress:0.0},
    {animationProgress:1.0, ease:Power1.easeIn},
    0
  );
  //createTweenScrubber(tl);
}

function createTextAnimation() {
  var geometry = generateTextGeometry('EVERY WHICH WAY', {
    size:14,
    height:0,
    font:'droid sans',
    weight:'bold',
    style:'normal',
    bevelSize:0.5,
    bevelThickness:2.0,
    bevelEnabled:true,
    anchor:{x:0.5, y:0.5, z:0.0}
  });

  THREE.BAS.Utils.separateFaces(geometry);

  return new TextAnimation(geometry);
}

function generateTextGeometry(text, params) {
  var geometry = new THREE.TextGeometry(text, params);

  geometry.computeBoundingBox();

  geometry.userData = {};
  geometry.userData.size = {
    width: geometry.boundingBox.max.x - geometry.boundingBox.min.x,
    height: geometry.boundingBox.max.y - geometry.boundingBox.min.y,
    depth: geometry.boundingBox.max.z - geometry.boundingBox.min.z
  };

  var anchorX = geometry.userData.size.width * -params.anchor.x;
  var anchorY = geometry.userData.size.height * -params.anchor.y;
  var anchorZ = geometry.userData.size.depth * -params.anchor.z;
  var matrix = new THREE.Matrix4().makeTranslation(anchorX, anchorY, anchorZ);

  geometry.applyMatrix(matrix);

  return geometry;
}

////////////////////
// CLASSES
////////////////////

function TextAnimation(textGeometry) {
  var bufferGeometry = new THREE.BAS.ModelBufferGeometry(textGeometry);

  var aAnimation = bufferGeometry.createAttribute('aAnimation', 2);
  //var aCentroid = bufferGeometry.createAttribute('aCentroid', 3);
  var aControl0 = bufferGeometry.createAttribute('aControl0', 3);
  var aControl1 = bufferGeometry.createAttribute('aControl1', 3);

  var material = new THREE.BAS.PhongAnimationMaterial({
      shading: THREE.FlatShading,
      side: THREE.DoubleSide,
      uniforms: {
        uTime: {type: 'f', value: 0}
      },
      shaderFunctions: [
        THREE.BAS.ShaderChunk['cubic_bezier'],
        THREE.BAS.ShaderChunk['ease_out_back']
      ],
      shaderParameters: [
        'const float EASE_S = 1.25;',
        'uniform float uTime;',
        'attribute vec2 aAnimation;',
        //'attribute vec3 aCentroid;',
        'attribute vec3 aControl0;',
        'attribute vec3 aControl1;',
        //'attribute vec3 aEndPosition;'
      ],
      shaderVertexInit: [
        'float tDelay = aAnimation.x;',
        'float tDuration = aAnimation.y;',
        'float tTime = clamp(uTime - tDelay, 0.0, tDuration);',
        'float tProgress = ease(tTime, 0.0, 1.0, tDuration, EASE_S);'
         //'float tProgress = tTime / tDuration;'
      ],
      shaderTransformPosition: [
        //'vec3 tPosition = transformed - aCentroid;',
        //'tPosition *= 1.0 - tProgress;',
        //'tPosition += aCentroid;',

        'vec3 tPosition = transformed;',
        'tPosition += cubicBezier(tPosition, aControl0, aControl1, tPosition, tProgress);',
        'transformed = tPosition;'

        // 'vec3 tPosition = transformed;',
        // 'tPosition *= 1.0 - tProgress;',
        // 'tPosition += cubicBezier(transformed, aControl0, aControl1, aEndPosition, tProgress);',
        // 'tPosition += mix(transformed, aEndPosition, tProgress);',
        // 'transformed = tPosition;'
      ]
    },
    {
      //diffuse: 0xf7f7f7
    }
  );

  THREE.Mesh.call(this, bufferGeometry, material);

  this.frustumCulled = false;
  this.sourceGeometry = textGeometry;
}
TextAnimation.prototype = Object.create(THREE.Mesh.prototype);
TextAnimation.prototype.constructor = TextAnimation;

Object.defineProperty(TextAnimation.prototype, 'animationProgress', {
  get: function() {
    return this._animationProgress;
  },
  set: function(v) {
    this._animationProgress = v;
    this.material.uniforms['uTime'].value = this.animationDuration * v;
  }
});

TextAnimation.prototype.bufferAnimation = function(origin) {
  var faceCount = this.sourceGeometry.faces.length;
  var i, i2, i3, i4, v;

  var aAnimation = this.geometry.attributes['aAnimation'];
  //var aCentroid = this.geometry.attributes['aCentroid'];
  var aControl0 = this.geometry.attributes['aControl0'];
  var aControl1 = this.geometry.attributes['aControl1'];

  //var size = textGeometry.userData.size;

  var minDuration = 4;
  var maxDuration = 4;
  var stretch = 0.5;

  this.animationDuration = 10;
  this._animationProgress = 0;

  for (i = 0, i2 = 0, i3 = 0, i4 = 0; i < faceCount; i++, i2 += 6, i3 += 9, i4 += 12) {
    var face = this.sourceGeometry.faces[i];
    var centroid = THREE.BAS.Utils.computeCentroid(this.sourceGeometry, face);

    // animation
    var delta = new THREE.Vector3().subVectors(centroid, origin);
    var length = delta.length();
    var delay = length * 0.01;

    delta.normalize();

    var duration = THREE.Math.randFloat(minDuration, maxDuration);

    for (v = 0; v < 6; v += 2) {
      aAnimation.array[i2 + v    ] = delay + Math.random() * stretch;
      aAnimation.array[i2 + v + 1] = duration;
    }

    // centroid
    //for (v = 0; v < 9; v += 3) {
    //  aCentroid.array[i3 + v    ] = centroid.x;
    //  aCentroid.array[i3 + v + 1] = centroid.y;
    //  aCentroid.array[i3 + v + 2] = centroid.z;
    //}

    // ctrl

    var c0 = new THREE.Vector3().copy(delta).multiplyScalar(100.0);
    c0.x += THREE.Math.randFloatSpread(50.0);
    c0.y += THREE.Math.randFloatSpread(50.0);
    c0.z += THREE.Math.randFloatSpread(50.0);

    var c1 = new THREE.Vector3().copy(delta).multiplyScalar(100.0);
    c1.x += THREE.Math.randFloatSpread(50.0);
    c1.y += THREE.Math.randFloatSpread(50.0);
    c1.z += THREE.Math.randFloatSpread(50.0);

    for (v = 0; v < 9; v += 3) {
      aControl0.array[i3 + v    ] = c0.x;
      aControl0.array[i3 + v + 1] = c0.y;
      aControl0.array[i3 + v + 2] = c0.z;

      aControl1.array[i3 + v    ] = c1.x;
      aControl1.array[i3 + v + 1] = c1.y;
      aControl1.array[i3 + v + 2] = c1.z;
    }
  }

  aAnimation.needsUpdate = true;
  aControl1.needsUpdate = true;
  aControl1.needsUpdate = true;
};



function THREERoot(params) {
  params = utils.extend({
    antialias:true,

    fov:60,
    zNear:1,
    zFar:10000,

    createCameraControls:true
  }, params);

  this.renderer = new THREE.WebGLRenderer({
    antialias:params.antialias
  });
  document.getElementById('three-container').appendChild(this.renderer.domElement);

  this.camera = new THREE.PerspectiveCamera(
    params.fov,
    window.innerWidth / window.innerHeight,
    params.zNear,
    params.zfar
  );

  this.scene = new THREE.Scene();

  if (params.createCameraControls) {
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
  }

  this.resize = this.resize.bind(this);
  this.tick = this.tick.bind(this);

  this.resize();
  this.tick();

  window.addEventListener('resize', this.resize, false);
}
THREERoot.prototype = {
  tick: function() {
    this.update();
    this.render();
    requestAnimationFrame(this.tick);
  },
  update: function() {
    this.controls && this.controls.update();
  },
  render: function() {
    this.renderer.render(this.scene, this.camera);
  },
  resize: function() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
};

////////////////////
// UTILS
////////////////////

var utils = {
  extend:function(dst, src) {
    for (var key in src) {
      dst[key] = src[key];
    }

    return dst;
  },
  randSign: function() {
    return Math.random() > 0.5 ? 1 : -1;
  }
};

function createTweenScrubber(tween, seekSpeed) {
  seekSpeed = seekSpeed || 0.001;

  function stop() {
    TweenMax.to(tween, 2, {timeScale:0});
  }

  function resume() {
    TweenMax.to(tween, 2, {timeScale:1});
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
