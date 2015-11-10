var mContainer;
var mCamera, mRenderer;
var mControls;

var mShadowColor = 0x13091B; //0x1B0914

var mScene;
var mLight;
var mLight2;
var mLight3;

var mParticleCount = 250000;
var mParticleSystem;

var mDuration;
var mTime = 0.01;
var mPathLength = 16;

// debug things
var mPlaying = false;
var mDebugPath;
var mDebugPoints = [];
var mRoundness = new THREE.Vector2(0.5, 0.5);
var mRadii = [];

var mPrefabDelay = 0.000125;
var mVertexDelay = 0.0125;
var mMinDuration = 32.0;
var mMaxDuration = 56.0;

var mAA = false;

window.onload = function () {
  init();
};

function init() {
  initTHREE();
  initControls();
  initParticleSystem();

  initGUI();

  requestAnimationFrame(tick);
  window.addEventListener('resize', resize, false);
}

// debug things

function initGUI() {
  var gui = new dat.GUI();
  gui.width = 300;

  gui.add(mDebugPath, 'visible').name('show path');
  gui.add(window, 'mPlaying').name('play slowly');
  gui.add(window, 'mTime', 0.0, mDuration).name('time').step(0.01).listen();
  gui.add(mRoundness, 'x', 0.0, 10.0).name('r.x').step(0.01).onChange(updatePath);
  gui.add(mRoundness, 'y', 0.0, 10.0).name('r.y').step(0.01).onChange(updatePath);

  var rf = gui.addFolder('radii');

  for (var i = 0; i < mRadii.length; i++) {
    (function(i) {
      var proxy = {value:mRadii[i]};

      rf.add(proxy, 'value', 0, 100).name('radius').step(0.01).onChange(function() {
        mRadii[i] = proxy.value;
      });
    })(i);
  }
}

function createDebugShapes() {
  var geom = new THREE.Geometry();
  var mat = new THREE.LineBasicMaterial({color:0xffffff});

  mDebugPath = new THREE.Line(geom, mat);
  mScene.add(mDebugPath);

  updatePath();
}

function updatePath() {
  mDebugPath.geometry && mDebugPath.geometry.dispose();
  mDebugPath.geometry.vertices = generateVertices();
  mDebugPath.geometry.verticesNeedUpdate = true;
}

function generateVertices() {
  var step = 0.001;
  var vertices = [];
  var points = mDebugPoints;

  for (var t = 0; t < 1.0; t += step) {
    var point = ( points.length - 1 ) * t;

    var intPoint = Math.floor( point );
    var weight = point - intPoint;

    var point0 = points[ intPoint == 0 ? intPoint : intPoint - 1 ];
    var point1 = points[ intPoint ];
    var point2 = points[ intPoint > points.length - 2 ? points.length - 1 : intPoint + 1 ];
    var point3 = points[ intPoint > points.length - 3 ? points.length - 1 : intPoint + 2 ];

    var vertex = new THREE.Vector3(
      catmullRom( point0.x, point1.x, point2.x, point3.x, weight ),
      catmullRom( point0.y, point1.y, point2.y, point3.y, weight ),
      catmullRom( point0.z, point1.z, point2.z, point3.z, weight )
    );

    vertices.push(vertex);
  }

  return vertices;
}

function catmullRom(p0, p1, p2, p3, t) {
  var v0 = ( p2 - p0 ) * mRoundness.x;
  var v1 = ( p3 - p1 ) * mRoundness.y;
  var t2 = t * t;
  var t3 = t * t2;

  return ( 2 * p1 - 2 * p2 + v0 + v1 ) * t3 + ( - 3 * p1 + 3 * p2 - 2 * v0 - v1 ) * t2 + v0 * t + p1;
}

// end of debug things

function initTHREE() {
  mRenderer = new THREE.WebGLRenderer({antialias: mAA});
  mRenderer.setSize(window.innerWidth, window.innerHeight);
  //mRenderer.setClearColor(0xffffff);
  mRenderer.setClearColor(mShadowColor);

  mContainer = document.getElementById('three-container');
  mContainer.appendChild(mRenderer.domElement);

  mCamera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 100000);
  mCamera.position.set(0, 0, 1200);

  mScene = new THREE.Scene();

  mLight = new THREE.PointLight(0xffffff, 1, 1200, 2);
  mLight.position.set(0, 0, 0);
  mScene.add(mLight);

  mLight2 = new THREE.DirectionalLight(0xFF311F, 0.25);
  mLight2.position.set(0, 1, 1);
  mScene.add(mLight2);

  mLight3 = new THREE.DirectionalLight(0x007A99, 0.25);
  mLight3.position.set(0, 1, -1);
  mScene.add(mLight3);
}

function initControls() {
  mControls = new THREE.OrbitControls(mCamera, mRenderer.domElement);
}

function initParticleSystem() {
  var prefabGeometry = new THREE.BoxGeometry(4, 4, 4);
  var bufferGeometry = new THREE.BAS.PrefabBufferGeometry(prefabGeometry, mParticleCount);

  // generate additional geometry data
  var aDelayDuration = bufferGeometry.createAttribute('aDelayDuration', 2);
  var aPivot = bufferGeometry.createAttribute('aPivot', 3);
  var aAxisAngle = bufferGeometry.createAttribute('aAxisAngle', 4);
  var aColor = bufferGeometry.createAttribute('color', 3);

  var i, j, offset;

  // buffer time offset
  var delay;
  var duration;

  mDuration = mMaxDuration + mPrefabDelay * mParticleCount + mVertexDelay * prefabGeometry.vertices.length;

  for (i = 0, offset = 0; i < mParticleCount; i++) {
    delay = i * mPrefabDelay;
    duration = THREE.Math.randFloat(mMinDuration, mMaxDuration);

    for (j = 0; j < prefabGeometry.vertices.length; j++) {
      aDelayDuration.array[offset++] = delay + j * mVertexDelay;
      aDelayDuration.array[offset++] = duration;
    }
  }

  // buffer pivot
  var pivot = new THREE.Vector3();

  for (i = 0, offset = 0; i < mParticleCount; i++) {
    pivot.x = THREE.Math.randFloat(0, 2);
    pivot.y = THREE.Math.randFloat(0, 2);
    pivot.z = THREE.Math.randFloat(0, 2);
    pivot.normalize();

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
    //h = i / mParticleCount;
    h = THREE.Math.randFloat(0.5, 1.00);
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
  var length = mPathLength;
  var x, y, z;

  for (i = 0; i < length; i++) {
    if (!i) {
      x = 0;
      y = -1400;
      z = 0;
    }
    else if (!(i - length + 1)) {
      x = 0;
      y = 1200;
      z = 0;
    }
    else {
      x = THREE.Math.randFloatSpread(600);
      y = (-400 + (800 / length) * i) + THREE.Math.randFloatSpread(200);
      z = THREE.Math.randFloatSpread(600);
    }

    pathArray.push(x, y, z);

    mRadii.push(THREE.Math.randFloat(0, 50));

    mDebugPoints.push(new THREE.Vector3(x, y, z));
  }

  createDebugShapes();

  var material = new THREE.BAS.PhongAnimationMaterial(
    // custom parameters & THREE.MeshPhongMaterial parameters
    {
      vertexColors: THREE.VertexColors,
      shading: THREE.FlatShading,
      side: THREE.DoubleSide,
      fog: true,
      defines: {
        PATH_LENGTH:pathArray.length / 3
      },
      uniforms: {
        uTime: {type: 'f', value: 0},
        uPath: {type: 'fv', value: pathArray},
        uRadius: {type: 'fv1', value: mRadii},
        uRoundness: {type: 'v2', value: mRoundness}
      },
      shaderFunctions: [
        THREE.BAS.ShaderChunk['quaternion_rotation'],
        THREE.BAS.ShaderChunk['catmull-rom'],
        THREE.BAS.ShaderChunk['ease_in_out_cubic']
      ],
      shaderParameters: [
        'uniform float uTime;',
        'uniform vec3 uPath[PATH_LENGTH];',
        'uniform float uRadius[PATH_LENGTH];',
        'uniform vec2 uRoundness;',
        'attribute vec2 aDelayDuration;',
        'attribute vec3 aPivot;',
        'attribute vec4 aAxisAngle;'
      ],
      shaderVertexInit: [
        'float tDelay = aDelayDuration.x;',
        'float tDuration = aDelayDuration.y;',
        'float tTime = clamp(uTime - tDelay, 0.0, tDuration);',
        'float tProgress = tTime / tDuration;',

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
      shininess: 16,
      specular: 0xffd700,
      emissive: mShadowColor
    }
  );

  mParticleSystem = new THREE.Mesh(bufferGeometry, material);
  mParticleSystem.frustumCulled = false;

  mScene.add(mParticleSystem);
}

function tick() {
  update();
  render();

  if (mPlaying) {
    mTime += (1/120);
    mTime %= mDuration;
  }

  requestAnimationFrame(tick);
}

function update() {
  mControls.update();

  mParticleSystem.material.uniforms['uTime'].value = mTime;
  mParticleSystem.material.uniforms['uRoundness'].value = mRoundness;
  mParticleSystem.material.uniforms['uRadius'].value = mRadii;
}

function render() {
  mRenderer.render(mScene, mCamera);
}

function resize() {
  mCamera.aspect = window.innerWidth / window.innerHeight;
  mCamera.updateProjectionMatrix();

  mRenderer.setSize(window.innerWidth, window.innerHeight);
}
