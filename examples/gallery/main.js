window.onload = init;

function init() {
  var root = new THREERoot({
    createCameraControls: !true,
    antialias: (window.devicePixelRatio === 1),
    fov: 80
  });

  root.renderer.setClearColor(0x000000);
  root.renderer.setPixelRatio(window.devicePixelRatio || 1);
  root.camera.position.set(0, 0, 100);

  var light = new THREE.DirectionalLight();
  light.position.set(0, 0, 1);
  root.scene.add(light);

  var width = 100;
  var height = 60;

  var slide = new Slide(width, height, 'out');
  slide.setImage(new THREE.ImageLoader().load('image.jpg'));
  root.scene.add(slide);

  var slide2 = new Slide(width, height, 'in');
  slide2.setImage(new THREE.ImageLoader().load('image2.jpg'));
  root.scene.add(slide2);

  var tl = new TimelineMax({repeat:-1, repeatDelay:1.0, yoyo: true});

  tl.add(slide.transition(), 0);
  tl.add(slide2.transition(), 0);

  createTweenScrubber(tl);

  //window.addEventListener('keyup', function(e) {
  //  if (e.keyCode === 80) {
  //    tl.paused(!tl.paused());
  //  }
  //});
}

////////////////////
// CLASSES
////////////////////

function Slide(width, height, animationPhase) {
  var plane = new THREE.PlaneGeometry(width, height, width * 2, height * 2);

  THREE.BAS.Utils.separateFaces(plane);

  var geometry = new SlideGeometry(plane);

  geometry.bufferUVs();

  var aAnimation = geometry.createAttribute('aAnimation', 2);
  var aStartPosition = geometry.createAttribute('aStartPosition', 3);
  var aControl0 = geometry.createAttribute('aControl0', 3);
  var aControl1 = geometry.createAttribute('aControl1', 3);
  var aEndPosition = geometry.createAttribute('aEndPosition', 3);

  var i, i2, i3, i4, v;

  var minDuration = 0.8;
  var maxDuration = 1.0;
  var maxDelayX = 1.0;
  var maxDelayY = 0.25;
  var stretch = 0.18;

  this.totalDuration = maxDuration + maxDelayX + maxDelayY + stretch;

  var startPosition = new THREE.Vector3();
  var control0 = new THREE.Vector3();
  var control1 = new THREE.Vector3();
  var endPosition = new THREE.Vector3();

  var tempPoint = new THREE.Vector3();

  function getControlPoint0(centroid) {
    var signY = Math.sign(centroid.y);

    tempPoint.x = THREE.Math.randFloat(0.1, 0.2) * 200;
    tempPoint.y = signY * THREE.Math.randFloat(0.1, 0.9) * 50;
    tempPoint.z = 0;//THREE.Math.randFloatSpread(16);

    return tempPoint;
  }

  function getControlPoint1(centroid) {
    var signY = Math.sign(centroid.y);

    tempPoint.x = THREE.Math.randFloat(0.1, 0.2) * 200;
    tempPoint.y = -signY * THREE.Math.randFloat(0.1, 0.9) * 50;
    tempPoint.z = 0;//THREE.Math.randFloatSpread(16);

    return tempPoint;
  }

  for (i = 0, i2 = 0, i3 = 0, i4 = 0; i < geometry.faceCount; i++, i2 += 6, i3 += 9, i4 += 12) {
    var face = plane.faces[i];
    var centroid = THREE.BAS.Utils.computeCentroid(plane, face);

    // animation
    var duration = THREE.Math.randFloat(minDuration, maxDuration);
    var delayX = THREE.Math.mapLinear(centroid.x, -width * 0.5, width * 0.5, 0.0, maxDelayX);
    var delayY;

    if (animationPhase === 'in') {
      delayY = THREE.Math.mapLinear(Math.abs(centroid.y), 0, height * 0.5, 0.0, maxDelayY)
    }
    else {
      delayY = THREE.Math.mapLinear(Math.abs(centroid.y), 0, height * 0.5, maxDelayY, 0.0)
    }

    for (v = 0; v < 6; v += 2) {
      aAnimation.array[i2 + v]     = delayX + delayY + (Math.random() * stretch * duration);
      aAnimation.array[i2 + v + 1] = duration;
    }

    // positions

    endPosition.copy(centroid);
    startPosition.copy(centroid);

    if (animationPhase === 'in') {
      control0.copy(centroid).sub(getControlPoint0(centroid));
      control1.copy(centroid).sub(getControlPoint1(centroid));
    }
    else { // out
      control0.copy(centroid).add(getControlPoint0(centroid));
      control1.copy(centroid).add(getControlPoint1(centroid));
    }

    for (v = 0; v < 9; v += 3) {
      aStartPosition.array[i3 + v]     = startPosition.x;
      aStartPosition.array[i3 + v + 1] = startPosition.y;
      aStartPosition.array[i3 + v + 2] = startPosition.z;

      aControl0.array[i3 + v]     = control0.x;
      aControl0.array[i3 + v + 1] = control0.y;
      aControl0.array[i3 + v + 2] = control0.z;

      aControl1.array[i3 + v]     = control1.x;
      aControl1.array[i3 + v + 1] = control1.y;
      aControl1.array[i3 + v + 2] = control1.z;

      aEndPosition.array[i3 + v]     = endPosition.x;
      aEndPosition.array[i3 + v + 1] = endPosition.y;
      aEndPosition.array[i3 + v + 2] = endPosition.z;
    }
  }

  var material = new THREE.BAS.PhongAnimationMaterial(
    {
      shading: THREE.FlatShading,
      side: THREE.DoubleSide,
      uniforms: {
        uTime: {type: 'f', value: 0}
      },
      shaderFunctions: [
        THREE.BAS.ShaderChunk['cubic_bezier'],
        //THREE.BAS.ShaderChunk[(animationPhase === 'in' ? 'ease_out_cubic' : 'ease_in_cubic')],
        THREE.BAS.ShaderChunk['ease_in_out_cubic'],
        THREE.BAS.ShaderChunk['quaternion_rotation']
      ],
      shaderParameters: [
        'uniform float uTime;',
        'attribute vec2 aAnimation;',
        'attribute vec3 aStartPosition;',
        'attribute vec3 aControl0;',
        'attribute vec3 aControl1;',
        'attribute vec3 aEndPosition;',
      ],
      shaderVertexInit: [
        'float tDelay = aAnimation.x;',
        'float tDuration = aAnimation.y;',
        'float tTime = clamp(uTime - tDelay, 0.0, tDuration);',
        'float tProgress = ease(tTime, 0.0, 1.0, tDuration);'
        //'float tProgress = tTime / tDuration;'
      ],
      shaderTransformPosition: [
        (animationPhase === 'in' ? 'transformed *= tProgress;' : 'transformed *= 1.0 - tProgress;'),
        'transformed += cubicBezier(aStartPosition, aControl0, aControl1, aEndPosition, tProgress);'
      ]
    },
    {
      map: new THREE.Texture(),
    }
  );

  THREE.Mesh.call(this, geometry, material);

  this.frustumCulled = false;
}
Slide.prototype = Object.create(THREE.Mesh.prototype);
Slide.prototype.constructor = Slide;
Object.defineProperty(Slide.prototype, 'time', {
  get: function () {
    return this.material.uniforms['uTime'].value;
  },
  set: function (v) {
    this.material.uniforms['uTime'].value = v;
  }
});

Slide.prototype.setImage = function(image) {
  this.material.uniforms.map.value.image = image;
  this.material.uniforms.map.value.needsUpdate = true;
};

Slide.prototype.transition = function() {
  return TweenMax.fromTo(this, 2.0, {time:0.0}, {time:this.totalDuration, ease:Power0.easeInOut});
};


function SlideGeometry(model) {
  THREE.BAS.ModelBufferGeometry.call(this, model);
}
SlideGeometry.prototype = Object.create(THREE.BAS.ModelBufferGeometry.prototype);
SlideGeometry.prototype.constructor = SlideGeometry;
SlideGeometry.prototype.bufferPositions = function () {
  var positionBuffer = this.createAttribute('position', 3).array;

  for (var i = 0; i < this.faceCount; i++) {
    var face = this.modelGeometry.faces[i];
    var centroid = THREE.BAS.Utils.computeCentroid(this.modelGeometry, face);

    var a = this.modelGeometry.vertices[face.a];
    var b = this.modelGeometry.vertices[face.b];
    var c = this.modelGeometry.vertices[face.c];

    positionBuffer[face.a * 3]     = a.x - centroid.x;
    positionBuffer[face.a * 3 + 1] = a.y - centroid.y;
    positionBuffer[face.a * 3 + 2] = a.z - centroid.z;

    positionBuffer[face.b * 3]     = b.x - centroid.x;
    positionBuffer[face.b * 3 + 1] = b.y - centroid.y;
    positionBuffer[face.b * 3 + 2] = b.z - centroid.z;

    positionBuffer[face.c * 3]     = c.x - centroid.x;
    positionBuffer[face.c * 3 + 1] = c.y - centroid.y;
    positionBuffer[face.c * 3 + 2] = c.z - centroid.z;
  }
};


function THREERoot(params) {
  params = utils.extend({
    fov: 60,
    zNear: 10,
    zFar: 100000,

    createCameraControls: true
  }, params);

  this.renderer = new THREE.WebGLRenderer({
    antialias: params.antialias
  });
  this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
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
  tick: function () {
    this.update();
    this.render();
    requestAnimationFrame(this.tick);
  },
  update: function () {
    this.controls && this.controls.update();
  },
  render: function () {
    this.renderer.render(this.scene, this.camera);
  },
  resize: function () {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
};

////////////////////
// UTILS
////////////////////

var utils = {
  extend: function (dst, src) {
    for (var key in src) {
      dst[key] = src[key];
    }

    return dst;
  },
  randSign: function () {
    return Math.random() > 0.5 ? 1 : -1;
  },
  ease: function (ease, t, b, c, d) {
    return b + ease.getRatio(t / d) * c;
  },
  fibSpherePoint: (function () {
    var vec = {x: 0, y: 0, z: 0};
    var G = Math.PI * (3 - Math.sqrt(5));

    return function (i, n, radius) {
      var step = 2.0 / n;
      var r, phi;

      vec.y = i * step - 1 + (step * 0.5);
      r = Math.sqrt(1 - vec.y * vec.y);
      phi = i * G;
      vec.x = Math.cos(phi) * r;
      vec.z = Math.sin(phi) * r;

      radius = radius || 1;

      vec.x *= radius;
      vec.y *= radius;
      vec.z *= radius;

      return vec;
    }
  })(),
  spherePoint: (function () {
    return function (u, v) {
      u === undefined && (u = Math.random());
      v === undefined && (v = Math.random());

      var theta = 2 * Math.PI * u;
      var phi = Math.acos(2 * v - 1);

      var vec = {};
      vec.x = (Math.sin(phi) * Math.cos(theta));
      vec.y = (Math.sin(phi) * Math.sin(theta));
      vec.z = (Math.cos(phi));

      return vec;
    }
  })()
};

function createTweenScrubber(tween, seekSpeed) {
  seekSpeed = seekSpeed || 0.001;

  function stop() {
    TweenMax.to(tween, 1, {timeScale:0});
  }

  function resume() {
    TweenMax.to(tween, 1, {timeScale:1});
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
