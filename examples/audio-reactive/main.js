var mContainer;
var mCamera, mRenderer;
var mControls;

var mScene;
var mLight;

var mParticleCount = 500000; // <-- change this number!
var mParticleSystem;

var mTime = 0.0;
var mTimeStep = (1/60);
var mDuration = 120;

var mPathLength = 32;

var mAudioElement;
var mAnalyser;

window.onload = function () {
  init();
};

function init() {
  initAudio();
  initTHREE();
  initControls();
  initParticleSystem();

  requestAnimationFrame(tick);
  window.addEventListener('resize', resize, false);
}

function initAudio() {
  mAudioElement = document.getElementById('song');
  mAudioElement.play();

  mAnalyser = new SpectrumAnalyzer(mPathLength * 0.5, 0.75);
  mAnalyser.setSource(mAudioElement);
}

function initTHREE() {
  mRenderer = new THREE.WebGLRenderer({antialias: false});
  mRenderer.setSize(window.innerWidth, window.innerHeight);
  //mRenderer.setClearColor(0xffffff);
  mRenderer.setClearColor(0x1B0914);

  mContainer = document.getElementById('three-container');
  mContainer.appendChild(mRenderer.domElement);

  mCamera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 5000);
  mCamera.position.set(0, 0, 1000);

  mScene = new THREE.Scene();

  mLight = new THREE.PointLight(0xffffff, 1, 1200, 2);
  mLight.position.set(0, 100, 0);
  mScene.add(mLight);
}

function initControls() {
  mControls = new THREE.OrbitControls(mCamera, mRenderer.domElement);
  mControls.autoRotate = true;
}

function initParticleSystem() {
  var prefabGeometry = new THREE.PlaneGeometry(4, 4);
  var bufferGeometry = new THREE.BAS.PrefabBufferGeometry(prefabGeometry, mParticleCount);

  //bufferGeometry.computeVertexNormals();

  // generate additional geometry data
  var aOffset = bufferGeometry.createAttribute('aOffset', 1);
  var aPivot = bufferGeometry.createAttribute('aPivot', 3);
  var aAxisAngle = bufferGeometry.createAttribute('aAxisAngle', 4);
  var aColor = bufferGeometry.createAttribute('color', 3);

  var i, j, offset;

  // buffer time offset
  var delay;

  for (i = 0, offset = 0; i < mParticleCount; i++) {
    delay = i / mParticleCount * mDuration;

    for (j = 0; j < prefabGeometry.vertices.length; j++) {
      aOffset.array[offset++] = delay;
    }
  }

  // buffer pivot
  var pivot = new THREE.Vector3();

  for (i = 0, offset = 0; i < mParticleCount; i++) {
    pivot.x = THREE.Math.randFloat(0, 2);
    pivot.y = THREE.Math.randFloat(0, 2);
    pivot.z = THREE.Math.randFloat(0, 2);

    for (j = 0; j < prefabGeometry.vertices.length; j++) {
      aPivot.array[offset++] = pivot.x;
      aPivot.array[offset++] = pivot.y;
      aPivot.array[offset++] = pivot.z;
    }
  }

  // buffer axis angle
  var axis = new THREE.Vector3();
  var angle = 0;

  for (i = 0, offset = 0; i < mParticleCount; i++) {
    axis.x = THREE.Math.randFloatSpread(2);
    axis.y = THREE.Math.randFloatSpread(2);
    axis.z = THREE.Math.randFloatSpread(2);
    axis.normalize();

    angle = Math.PI * THREE.Math.randInt(48, 64);

    for (j = 0; j < prefabGeometry.vertices.length; j++) {
      aAxisAngle.array[offset++] = axis.x;
      aAxisAngle.array[offset++] = axis.y;
      aAxisAngle.array[offset++] = axis.z;
      aAxisAngle.array[offset++] = angle;
    }
  }

  // buffer color
  var color = new THREE.Color();
  var h, s, l;

  for (i = 0, offset = 0; i < mParticleCount; i++) {
    h = i / mParticleCount;
    s = THREE.Math.randFloat(0.5, 0.75);
    l = THREE.Math.randFloat(0.25, 0.5);

    color.setHSL(h, s, l);

    for (j = 0; j < prefabGeometry.vertices.length; j++) {
      aColor.array[offset++] = color.r;
      aColor.array[offset++] = color.g;
      aColor.array[offset++] = color.b;
    }
  }

  // buffer spline (uniform)
  var pathArray = [];
  var radiusArray = [];
  var length = mPathLength;
  var x, y, z;

  for (i = 0; i < length; i++) {
    if (!i) {
      x = 0;
      y = -1000;
      z = 0;
    }
    else if (!(i - length + 1)) {
      x = 0;
      y = 1000;
      z = 0;
    }
    else {
      x = THREE.Math.randFloatSpread(800);
      y = THREE.Math.randFloatSpread(400);
      z = THREE.Math.randFloatSpread(800);
    }

    pathArray.push(x, y, z);
    radiusArray.push(0);
  }

  var material = new THREE.BAS.PhongAnimationMaterial(
    // custom parameters & THREE.MeshPhongMaterial parameters
    {
      vertexColors: THREE.VertexColors,
      shading: THREE.FlatShading,
      side: THREE.FrontSide,
      fog: true,
      defines: {
        PATH_LENGTH:pathArray.length / 3
      },
      uniforms: {
        uTime: {type: 'f', value: 0},
        uDuration: {type: 'f', value: mDuration},
        uPath: {type: 'fv', value: pathArray},
        uRadius: {type: 'fv1', value: radiusArray},
        uRoundness: {type: 'v2', value: new THREE.Vector2(2, 2)}
      },
      shaderFunctions: [
        THREE.BAS.ShaderChunk['quaternion_rotation'],
        THREE.BAS.ShaderChunk['catmull-rom']
      ],
      shaderParameters: [
        'uniform float uTime;',
        'uniform float uDuration;',
        'uniform vec3 uPath[PATH_LENGTH];',
        'uniform float uRadius[PATH_LENGTH];',
        'uniform vec2 uRoundness;',
        'attribute float aOffset;',
        'attribute vec3 aPivot;',
        'attribute vec4 aAxisAngle;'
      ],
      shaderVertexInit: [
        'float tProgress = mod((uTime + aOffset), uDuration) / uDuration;',

        'float angle = aAxisAngle.w * tProgress;',
        'vec4 tQuat = quatFromAxisAngle(aAxisAngle.xyz, angle);'
      ],
      shaderTransformNormal: [
        'objectNormal = rotateVector(tQuat, objectNormal);'
      ],
      shaderTransformPosition: [
        'float tMax = float(PATH_LENGTH - 1);',
        'float tPoint = tMax * tProgress;',
        'float tIndex = floor(tPoint);',
        'float tWeight = tPoint - tIndex;',

        'int i0 = int(max(0.0, tIndex - 1.0));',
        'int i1 = int(tIndex);',
        'int i2 = int(min(tIndex + 1.0, tMax));',
        'int i3 = int(min(tIndex + 2.0, tMax));',
        'vec3 p0 = uPath[i0];',
        'vec3 p1 = uPath[i1];',
        'vec3 p2 = uPath[i2];',
        'vec3 p3 = uPath[i3];',

        'float radius = catmullRom(uRadius[i0], uRadius[i1], uRadius[i2], uRadius[i3], tWeight);',
        'transformed += aPivot * radius;',

        'transformed = rotateVector(tQuat, transformed);',

        'transformed += catmullRom(p0, p1, p2, p3, uRoundness, tWeight);'
      ]
    },
    // THREE.MeshPhongMaterial uniforms
    {
      shininess: 32,
      specular: 0xffd700,
      emissive: 0x1B0914
    }
  );

  mParticleSystem = new THREE.Mesh(bufferGeometry, material);
  mParticleSystem.frustumCulled = false;

  mScene.add(mParticleSystem);
}

function tick() {
  update();
  render();

  requestAnimationFrame(tick);
}

function update() {
  mControls.update();
  mAnalyser.updateSample();

  var uniform = mParticleSystem.material.uniforms['uRadius'].value;
  var data = mAnalyser.frequencyByteData;

  var i;

  var dataArray = [];

  for (i = data.length - 1; i >= 0; i--) {
    dataArray.push(data[i]);
  }

  for (i = 0; i < data.length; i++) {
    dataArray.push(data[i]);
  }

  for (i = 0; i < dataArray.length; i++) {
    if (i && dataArray.length - i > 1) {
      uniform[i] = Math.max(8, dataArray[i] / 255 * 48);
    }
    else {
      uniform[i] = 128;
    }
  }

  var a0 = mAnalyser.getAverageFloat() * 2 + 2;
  var a1 = mAnalyser.getAverageFloat() * 2;

  mParticleSystem.material.uniforms['uRoundness'].value.set(a0, a0);

  mLight.intensity = a1 * a1;

  mTime += mTimeStep;
  mTime %= mDuration;

  mParticleSystem.material.uniforms['uTime'].value = mTime;
}

function render() {
  mRenderer.render(mScene, mCamera);
}

function resize() {
  mCamera.aspect = window.innerWidth / window.innerHeight;
  mCamera.updateProjectionMatrix();

  mRenderer.setSize(window.innerWidth, window.innerHeight);
}

/////////////////////////////////
// Spectrum Analyser
/////////////////////////////////

// https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode
function SpectrumAnalyzer(binCount, smoothingTimeConstant) {
  var Context = window["AudioContext"] || window["webkitAudioContext"];

  this.context = new Context();
  this.analyzerNode = this.context.createAnalyser();

  this.setBinCount(binCount);
  this.setSmoothingTimeConstant(smoothingTimeConstant);
}

SpectrumAnalyzer.prototype = {
  setSource: function (source) {
    //this.source = source;
    this.source = this.context.createMediaElementSource(source);
    this.source.connect(this.analyzerNode);
    this.analyzerNode.connect(this.context.destination);
  },

  setBinCount: function (binCount) {
    this.binCount = binCount;
    this.analyzerNode.fftSize = binCount * 2;

    this.frequencyByteData = new Uint8Array(binCount); 	// frequency
    this.timeByteData = new Uint8Array(binCount);		// waveform
  },

  setSmoothingTimeConstant: function (smoothingTimeConstant) {
    this.analyzerNode.smoothingTimeConstant = smoothingTimeConstant;
  },

  getFrequencyData: function () {
    return this.frequencyByteData;
  },

  getTimeData: function () {
    return this.timeByteData;
  },
  // not save if out of bounds
  getAverage: function (index, count) {
    var total = 0;
    var start = index || 0;
    var end = start + (count || this.binCount);

    for (var i = start; i < end; i++) {
      total += this.frequencyByteData[i];
    }

    return total / (end - start);
  },
  getAverageFloat:function(index, count) {
    return this.getAverage(index, count) / 255;
  },

  updateSample: function () {
    this.analyzerNode.getByteFrequencyData(this.frequencyByteData);
    this.analyzerNode.getByteTimeDomainData(this.timeByteData);
  }
};
