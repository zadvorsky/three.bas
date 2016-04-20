window.onload = init;

var settings = {
  letterTimeOffset:0.0
};

function init() {
  var root = new THREERoot({
    createCameraControls:true,
    antialias:(window.devicePixelRatio === 1),
    fov:80
  });

  root.renderer.setClearColor(0x000000);
  root.renderer.setPixelRatio(window.devicePixelRatio || 1);
  root.camera.position.set(0, 0, 250);

  new THREE.FontLoader().load('droid_sans_bold.typeface.js', function(font) {

    var textAnimationData = createTextAnimation(font);

    var group = new THREE.Group();
    root.scene.add(group);

    var textAnimation = new TextAnimation(textAnimationData);
    group.add(textAnimation);

    var box = textAnimationData.geometry.boundingBox;
    group.position.copy(box.size()).multiplyScalar(-0.5);

    var light = new THREE.DirectionalLight(0xffffff, 1.0);
    light.position.set(0, 0, 1);
    root.scene.add(light);

    var maxTime = 9.0;//textAnimation.animationDuration;
    var duration = 2.0;

    var tl = new TimelineMax({
      repeat:-1,
      repeatDelay:0.5,
      yoyo:true
    });
    tl.to(textAnimation, duration, {time:maxTime, ease:Power0.easeIn}, 0);

    //createTweenScrubber(tl);
  });
}

function createTextAnimation(font) {
  var text = 'BEAM ME UP';
  var params = {
    size:36,
    height:0,
    font:font,
    curveSegments:12,
    bevelEnabled:true,
    bevelSize:1,
    bevelThickness:1,
    anchor:{x:0.5, y:0.5, z:0.5}
  };

  return generateSplitTextGeometry(text, params);
}

function generateSplitTextGeometry(text, params) {
  var matrix = new THREE.Matrix4();

  var scale = params.size / params.font.data.resolution;
  var offset = 0;

  var data = {
    geometry:new THREE.Geometry(),
    info:[]
  };
  var faceOffset = 0;

  for (var i = 0; i < text.length; i++) {
    var char = text[i];
    var glyph = params.font.data.glyphs[char];
    var charGeometry = new THREE.TextGeometry(char, params);

    data.info[i] = {};

    // compute and store char bounding box
    charGeometry.computeBoundingBox();
    data.info[i].boundingBox = charGeometry.boundingBox.clone();

    // translate char based on font data
    matrix.identity().makeTranslation(offset, 0, 0);
    charGeometry.applyMatrix(matrix);

    data.info[i].glyphOffset = offset;
    offset += glyph.ha * scale;

    // store face index offsets
    THREE.BAS.Utils.tessellate(charGeometry, 1.0);
    THREE.BAS.Utils.separateFaces(charGeometry);

    data.info[i].faceCount = charGeometry.faces.length;
    data.info[i].faceOffset = faceOffset;

    faceOffset += charGeometry.faces.length;

    // colors!
    data.info[i].color = new THREE.Color();
    data.info[i].color.setHSL(i / (text.length - 1), 1.0, 0.5);

    // merge char geometry into text geometry
    data.geometry.merge(charGeometry);
  }

  data.geometry.computeBoundingBox();

  return data;
}

////////////////////
// CLASSES
////////////////////

function TextAnimation(data) {
  var textGeometry = data.geometry;

  var bufferGeometry = new TextAnimationGeometry(textGeometry);

  var aAnimation = bufferGeometry.createAttribute('aAnimation', 2);
  var aStartPosition = bufferGeometry.createAttribute('aStartPosition', 3);
  var aEndPosition = bufferGeometry.createAttribute('aEndPosition', 3);

  var minDuration = 1.0;
  var maxDuration = 2.0;

  this.animationDuration = maxDuration + data.info.length * settings.letterTimeOffset;

  var glyphSize = new THREE.Vector3();
  var glyphCenter = new THREE.Vector3();
  var delta = new THREE.Vector3();

  for (var f = 0; f < data.info.length; f++) {
    bufferChar(data.info[f], f);
  }

  function bufferChar(info, index) {
    var s = info.faceOffset;
    var l = info.faceOffset + info.faceCount;
    var box = info.boundingBox;
    var glyphOffset = info.glyphOffset;

    box.size(glyphSize);
    box.center(glyphCenter);
    glyphCenter.x += glyphOffset;

    var i, i2, i3, i4, v;

    for (i = s, i2 = s * 6, i3 = s * 9, i4 = s * 12; i < l; i++, i2 += 6, i3 += 9, i4 += 12) {
      var face = textGeometry.faces[i];
      var centroid = THREE.BAS.Utils.computeCentroid(textGeometry, face);

      // animation
      var duration = THREE.Math.randFloat(minDuration, maxDuration);

      delta.subVectors(centroid, glyphCenter);

      var delay = (glyphSize.y - delta.y) * 0.1;

      for (v = 0; v < 6; v += 2) {
        aAnimation.array[i2 + v    ] = delay + Math.random() * 0.5 * duration;
        aAnimation.array[i2 + v + 1] = duration;
      }

      // start position (centroid)
      for (v = 0; v < 9; v+= 3) {
        aStartPosition.array[i3 + v    ] = centroid.x;
        aStartPosition.array[i3 + v + 1] = centroid.y;
        aStartPosition.array[i3 + v + 2] = centroid.z;
      }
      // end position
      var dy = THREE.Math.randFloat(5, 10);

      for (v = 0; v < 9; v += 3) {
        aEndPosition.array[i3 + v    ] = centroid.x;
        aEndPosition.array[i3 + v + 1] = centroid.y + dy;
        aEndPosition.array[i3 + v + 2] = centroid.z;
      }
    }
  }

  var material = new THREE.BAS.PhongAnimationMaterial({
      shading: THREE.FlatShading,
      side: THREE.DoubleSide,
      vertexColors: THREE.VertexColors,
      transparent: true,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: {type: 'f', value: 0},
        uStartColor: {type: 'c', value: new THREE.Color(0xffffff)},
        uEndColor: {type: 'c', value: new THREE.Color(0x0000ff)}
      },
      shaderFunctions: [
        THREE.BAS.ShaderChunk['cubic_bezier'],
        THREE.BAS.ShaderChunk['ease_in_cubic'],
        THREE.BAS.ShaderChunk['quaternion_rotation']
      ],
      shaderParameters: [
        'uniform float uTime;',
        'uniform vec3 uAxis;',
        'uniform float uAngle;',
        'attribute vec2 aAnimation;',
        'attribute vec3 aStartPosition;',
        'attribute vec3 aEndPosition;',
        'attribute vec3 aPivot;',
        'attribute vec4 aAxisAngle;',

        'uniform vec3 uStartColor;',
        'uniform vec3 uEndColor;'
      ],
      shaderVertexInit: [
        'float tDelay = aAnimation.x;',
        'float tDuration = aAnimation.y;',
        'float tTime = clamp(uTime - tDelay, 0.0, tDuration);',
        'float tProgress = ease(tTime, 0.0, 1.0, tDuration);',
        // 'float tProgress = tTime / tDuration;',
        'float tnProgress = 1.0 - tProgress;'
      ],
      shaderTransformPosition: [
        'transformed.xz *= tnProgress;',

        'transformed += mix(aStartPosition, aEndPosition, tProgress);',

        'vColor.xyz = mix(uStartColor.rgb, uEndColor.rgb, min(tProgress * 10.0, 1.0));'
      ]
    },
    {
      //diffuse: 0x444444,
      //specular: 0xcccccc,
      //shininess: 4,
      emissive: 0x444444
    }
  );

  THREE.Mesh.call(this, bufferGeometry, material);

  this.frustumCulled = false;
}
TextAnimation.prototype = Object.create(THREE.Mesh.prototype);
TextAnimation.prototype.constructor = TextAnimation;
Object.defineProperty(TextAnimation.prototype, 'time', {
  get: function() {
    return this.material.uniforms['uTime'].value;
  },
  set: function(v) {
    this.material.uniforms['uTime'].value = v;
  }
});

function TextAnimationGeometry(model) {
  THREE.BAS.ModelBufferGeometry.call(this, model);
}
TextAnimationGeometry.prototype = Object.create(THREE.BAS.ModelBufferGeometry.prototype);
TextAnimationGeometry.prototype.constructor = TextAnimationGeometry;
TextAnimationGeometry.prototype.bufferPositions = function() {
  var positionBuffer = this.createAttribute('position', 3).array;

  for (var i = 0; i < this.faceCount; i++) {
    var face = this.modelGeometry.faces[i];
    var centroid = THREE.BAS.Utils.computeCentroid(this.modelGeometry, face);

    var a = this.modelGeometry.vertices[face.a];
    var b = this.modelGeometry.vertices[face.b];
    var c = this.modelGeometry.vertices[face.c];

    positionBuffer[face.a * 3    ] = a.x - centroid.x;
    positionBuffer[face.a * 3 + 1] = a.y - centroid.y;
    positionBuffer[face.a * 3 + 2] = a.z - centroid.z;

    positionBuffer[face.b * 3    ] = b.x - centroid.x;
    positionBuffer[face.b * 3 + 1] = b.y - centroid.y;
    positionBuffer[face.b * 3 + 2] = b.z - centroid.z;

    positionBuffer[face.c * 3    ] = c.x - centroid.x;
    positionBuffer[face.c * 3 + 1] = c.y - centroid.y;
    positionBuffer[face.c * 3 + 2] = c.z - centroid.z;
  }
};


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
  },
  ease:function(ease, t, b, c, d) {
    return b + ease.getRatio(t / d) * c;
  },
  fibSpherePoint: (function() {
    var vec = {x:0, y:0, z:0};
    var G = Math.PI * (3 - Math.sqrt(5));

    return function(i, n, radius) {
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
  spherePoint: (function() {
    return function(u, v) {
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
