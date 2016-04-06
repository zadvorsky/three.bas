window.onload = init;

function init() {
  var root = new THREERoot({
    createCameraControls:!true,
    antialias:true,
    fov:60
  });
  root.renderer.setClearColor(0x000000);
  root.renderer.setPixelRatio(window.devicePixelRatio || 1);
  root.camera.position.set(0, 0, 600);

  var textAnimation = createTextAnimation();
  root.scene.add(textAnimation);

  var light = new THREE.DirectionalLight();
  light.position.set(0, 0, 1);
  root.scene.add(light);

  var tl = new TimelineMax({
    repeat:-1,
    repeatDelay:0.25,
    yoyo:true
  });
  tl.fromTo(textAnimation, 8,
    {animationProgress:0.0},
    {animationProgress:0.8, ease:Power1.easeInOut},
    0
  );
  tl.fromTo(textAnimation.rotation, 8, {y:0}, {y:Math.PI * 2, ease:Power1.easeInOut}, 0);

  createTweenScrubber(tl);
}

function createTextAnimation() {
  var geometry = generateTextGeometry('AS THE WORLD TURNS', {
    size:40,
    height:12,
    font:'droid sans',
    weight:'bold',
    style:'normal',
    curveSegments:24,
    bevelSize:1,
    bevelThickness:1,
    bevelEnabled:true,
    anchor:{x:0.5, y:0.5, z:0.0}
  });

  THREE.BAS.Utils.tessellateRepeat(geometry, 0.5, 2);

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

  console.log('size', geometry.userData.size);

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
  var aCentroid = bufferGeometry.createAttribute('aCentroid', 3);
  var aControl0 = bufferGeometry.createAttribute('aControl0', 3);
  var aControl1 = bufferGeometry.createAttribute('aControl1', 3);
  var aEndPosition = bufferGeometry.createAttribute('aEndPosition', 3);
  var aAxisAngle = bufferGeometry.createAttribute('aAxisAngle', 4);

  var faceCount = bufferGeometry.faceCount;
  var i, i2, i3, i4, v;

  var maxDelay = 0.0;
  var minDuration = 1.0;
  var maxDuration = 1.0;
  var stretch = 0.05;
  var lengthFactor = 0.001;
  var maxLength = textGeometry.boundingBox.max.length();

  this.animationDuration = maxDuration + maxDelay + stretch + lengthFactor * maxLength;
  this._animationProgress = 0;

  var axis = new THREE.Vector3();
  var angle;

  var radius = 200;
  var PHI = Math.PI * (3 - Math.sqrt(5));
  var offset = 2.0 / faceCount;

  //var vertexCount = textGeometry.vertices.length;
  //var radius = 200;
  //var PHI = Math.PI * (3 - Math.sqrt(5));
  //var offset = 2.0 / vertexCount;
  //for (i = 0, i2 = 0, i3 = 0, i4 = 0; i < vertexCount; i++, i2 += 2, i3 += 3, i4 += 4) {
  //  var vertex = textGeometry.vertices[i];
  //
  //  aAnimation.array[i2] = vertex.length() * lengthFactor + Math.random() * maxDelay;
  //  aAnimation.array[i2 + 1] = THREE.Math.randFloat(minDuration, maxDuration);
  //
  //  // end position
  //  var x, y, z, r, phi;
  //
  //  y = i * offset - 1 + (offset * 0.5);
  //  r = Math.sqrt(1 - y * y);
  //  phi = i * PHI;
  //  x = Math.cos(phi) * r;
  //  z = Math.sin(phi) * r;
  //
  //  aEndPosition.array[i3] = x * radius;
  //  aEndPosition.array[i3+1] = y * radius;
  //  aEndPosition.array[i3+2] = z * radius;
  //}

  for (i = 0, i2 = 0, i3 = 0, i4 = 0; i < faceCount; i++, i2 += 6, i3 += 9, i4 += 12) {
    var face = textGeometry.faces[i];
    var centroid = THREE.BAS.Utils.computeCentroid(textGeometry, face);
    var centroidN = new THREE.Vector3().copy(centroid).normalize();

    // animation
    var delay = (maxLength - centroid.length()) * lengthFactor;
    var duration = THREE.Math.randFloat(minDuration, maxDuration);

    for (v = 0; v < 6; v += 2) {

      aAnimation.array[i2 + v    ] = delay + stretch * Math.random();
      aAnimation.array[i2 + v + 1] = duration;
    }

    // centroid
    for (v = 0; v < 9; v += 3) {
      aCentroid.array[i3 + v    ] = centroid.x;
      aCentroid.array[i3 + v + 1] = centroid.y;
      aCentroid.array[i3 + v + 2] = centroid.z;
    }

    // ctrl
    var c0x = Math.random() * radius;
    var c0y = Math.random() * radius;
    var c0z = Math.random() * radius;

    var c1x = Math.random() * radius;
    var c1y = Math.random() * radius;
    var c1z = Math.random() * radius;

    for (v = 0; v < 9; v += 3) {
      aControl0.array[i3 + v    ] = c0x;
      aControl0.array[i3 + v + 1] = c0y;
      aControl0.array[i3 + v + 2] = c0z;

      aControl1.array[i3 + v    ] = c1x;
      aControl1.array[i3 + v + 1] = c1y;
      aControl1.array[i3 + v + 2] = c1z;
    }

    // end position
    var x, y, z, r, phi;

    y = i * offset - 1 + (offset * 0.5);
    r = Math.sqrt(1 - y * y);
    phi = i * PHI;
    x = Math.cos(phi) * r;
    z = Math.sin(phi) * r;

    for (v = 0; v < 9; v += 3) {
      aEndPosition.array[i3 + v    ] = x * radius;
      aEndPosition.array[i3 + v + 1] = y * radius;
      aEndPosition.array[i3 + v + 2] = z * radius;
    }

    // axis angle
    axis.x = centroidN.x;
    axis.y = centroidN.y;
    axis.z = -centroidN.z;

    axis.normalize();

    angle = Math.PI * THREE.Math.randFloat(0.5, 2.0);
     //angle = Math.PI * 2;

    for (v = 0; v < 12; v += 4) {
      aAxisAngle.array[i4 + v    ] = axis.x;
      aAxisAngle.array[i4 + v + 1] = axis.y;
      aAxisAngle.array[i4 + v + 2] = axis.z;
      aAxisAngle.array[i4 + v + 3] = angle;
    }
  }

  var material = new THREE.BAS.PhongAnimationMaterial({
      shading: THREE.FlatShading,
      side: THREE.DoubleSide,
      transparent: true,
      uniforms: {
        uTime: {type: 'f', value: 0}
      },
      shaderFunctions: [
        THREE.BAS.ShaderChunk['cubic_bezier'],
        THREE.BAS.ShaderChunk['ease_out_cubic'],
        THREE.BAS.ShaderChunk['quaternion_rotation']
      ],
      shaderParameters: [
        'uniform float uTime;',
        'uniform vec3 uAxis;',
        'uniform float uAngle;',
        'attribute vec2 aAnimation;',
        'attribute vec3 aCentroid;',
        'attribute vec3 aControl0;',
        'attribute vec3 aControl1;',
        'attribute vec3 aEndPosition;',
        'attribute vec4 aAxisAngle;'
      ],
      shaderVertexInit: [
        'float tDelay = aAnimation.x;',
        'float tDuration = aAnimation.y;',
        'float tTime = clamp(uTime - tDelay, 0.0, tDuration);',
        'float tProgress =  ease(tTime, 0.0, 1.0, tDuration);'
        //'float tProgress = tTime / tDuration;'
      ],
      shaderTransformPosition: [

        'vec3 faceLocal = transformed - aCentroid;',
        //'transformed = cubicBezier(transformed, aControl0, aControl1, aEndPosition, tProgress);',
        'transformed = mix(transformed, aEndPosition, tProgress);',
        //'transformed += faceLocal * tProgress;',

        'float angle = aAxisAngle.w * tProgress;',
        'vec4 tQuat = quatFromAxisAngle(aAxisAngle.xyz, angle);',
        'transformed = rotateVector(tQuat, transformed);',
      ]
    },
    {
      diffuse: 0xffffff,
      //emissive:0xffffff
    }
  );

  THREE.Mesh.call(this, bufferGeometry, material);

  this.frustumCulled = false;
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

function THREERoot(params) {
  params = utils.extend({
    fov:60,
    zNear:10,
    zFar:100000,

    createCameraControls:true
  }, params);

  this.renderer = new THREE.WebGLRenderer({
    antialias:params.antialias
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
