var mContainer;
var mCamera, mRenderer;
var mControls;

var mScene;

var mParticleSystem;

var mTime = 0.0;
var mTimeStep = (1/30);

window.onload = function () {
  init();
};

function init() {
  initTHREE();
  initControls();
  initRainbow();

  requestAnimationFrame(tick);
  window.addEventListener('resize', resize, false);
}

function initTHREE() {
  mRenderer = new THREE.WebGLRenderer({antialias: true});
  mRenderer.setSize(window.innerWidth, window.innerHeight);
  mRenderer.setClearColor(0xffffff);

  mContainer = document.getElementById('three-container');
  mContainer.appendChild(mRenderer.domElement);

  mCamera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 5000);
  mCamera.position.set(20, 20, 20);

  mScene = new THREE.Scene();
  //mScene.add(new THREE.GridHelper(200, 10));
  mScene.add(new THREE.AxisHelper(20));

  var light;

  light = new THREE.DirectionalLight(0xffffff);
  light.position.set(1, 1, 1);
  mScene.add(light);
}

function initControls() {
  mControls = new THREE.OrbitControls(mCamera, mRenderer.domElement);
}

function initRainbow() {
  var width = 4, halfWidth = width * 0.5;
  var height = 0.25, halfHeight = height * 0.5;
  var depth = 40, halfDepth = depth * 0.5;

  var modelGeometry = new THREE.BoxGeometry(width, height, depth, width, 1, depth);

  //THREE.BAS.Utils.separateFaces(modelGeometry);

  var bufferGeometry = new THREE.BAS.ModelBufferGeometry(modelGeometry);

  var aWave = bufferGeometry.createAttribute('aWave', 2);
  var aColor = bufferGeometry.createAttribute('color', 3);

  var faceCount = bufferGeometry.faceCount;
  var vertexCount = bufferGeometry.vertexCount;
  var i, j, offset;

  var amplitude, periodOffsetX, periodOffsetZ;

  for (i = 0, offset = 0; i < vertexCount; i++) {
    var v = modelGeometry.vertices[i];

    amplitude = THREE.Math.mapLinear(v.z, -halfDepth, halfDepth, 0, 1);

    periodOffsetX = THREE.Math.mapLinear(v.x, -halfWidth, halfWidth, 0, Math.PI * 0.25);
    periodOffsetZ = THREE.Math.mapLinear(v.z, -halfDepth, halfWidth, 0, Math.PI * 2);

    aWave.array[offset++] = amplitude;
    aWave.array[offset++] = periodOffsetZ + periodOffsetX;
  }


  var color = new THREE.Color();
  var h, s, l;

  for (i = 0, offset = 0; i < vertexCount; i++) {
    var v = modelGeometry.vertices[i];

    h = THREE.Math.mapLinear(v.x, -halfWidth, halfWidth, 0.0, 1.0);
    s = 1.0;
    l = 0.5;

    color.setHSL(h, s, l);

    aColor.array[offset++] = color.r;
    aColor.array[offset++] = color.g;
    aColor.array[offset++] = color.b;
  }

  var material = new THREE.BAS.PhongAnimationMaterial({
      vertexColors: THREE.VertexColors,
      shading: THREE.FlatShading,
      //wireframe: true,
      defines: {
      },
      uniforms: {
        uTime: {type: 'f', value: 0}
      },
      shaderFunctions: [
      ],
      shaderParameters: [
        'uniform float uTime;',
        'attribute vec2 aWave;'
      ],
      shaderVertexInit: [
      ],
      shaderTransformNormal: [
      ],
      shaderTransformPosition: [
        'float tPeriod = sin(uTime + aWave.y);',
        'transformed.y += tPeriod * aWave.x;'
      ]
    },
    {
      shininess: 40,
      //diffuse:0xff00ff
      //specular: 0xffd700
    }
  );


  mParticleSystem = new THREE.Mesh(bufferGeometry, material);
  mParticleSystem.frustumCulled = false;
  mScene.add(mParticleSystem);

  //var prefabGeometry = new THREE.PlaneGeometry(4, 1);
  //
  //prefabGeometry.applyMatrix(new THREE.Matrix4().makeRotationX(Math.PI * 0.5));
  //
  //var bufferGeometry = new THREE.BAS.PrefabBufferGeometry(prefabGeometry, mParticleCount);
  //
  //bufferGeometry.computeVertexNormals();
  //
  //// generate additional geometry data
  //var aOffset = bufferGeometry.createAttribute('aOffset', 1);
  //var aPivot = bufferGeometry.createAttribute('aPivot', 3);
  //var aAxisAngle = bufferGeometry.createAttribute('aAxisAngle', 4);
  //var aColor = bufferGeometry.createAttribute('color', 3);
  //
  //var i, j, offset;
  //
  //// buffer time offset
  //var delay;
  //
  //for (i = 0, offset = 0; i < mParticleCount; i++) {
  //  delay = i / mParticleCount * mDuration;
  //
  //  for (j = 0; j < prefabGeometry.vertices.length; j++) {
  //    aOffset.array[offset++] = delay;
  //  }
  //}
  //
  //// buffer pivot
  //var pivot = new THREE.Vector3();
  //
  //for (i = 0, offset = 0; i < mParticleCount; i++) {
  //  pivot.x = THREE.Math.randFloat(-1, 1);
  //  pivot.y = THREE.Math.randFloat(-1, 1);
  //  pivot.z = THREE.Math.randFloat(-8, 8);
  //
  //  for (j = 0; j < prefabGeometry.vertices.length; j++) {
  //    aPivot.array[offset++] = pivot.x;
  //    aPivot.array[offset++] = pivot.y;
  //    aPivot.array[offset++] = pivot.z;
  //  }
  //}
  //
  //// buffer axis angle
  //var axis = new THREE.Vector3();
  //var angle = 0;
  //
  //for (i = 0, offset = 0; i < mParticleCount; i++) {
  //  axis.x = THREE.Math.randFloatSpread(2);
  //  axis.y = THREE.Math.randFloatSpread(2);
  //  axis.z = THREE.Math.randFloatSpread(2);
  //  axis.normalize();
  //
  //  angle = Math.PI * THREE.Math.randInt(24, 32);
  //
  //  for (j = 0; j < prefabGeometry.vertices.length; j++) {
  //    aAxisAngle.array[offset++] = axis.x;
  //    aAxisAngle.array[offset++] = axis.y;
  //    aAxisAngle.array[offset++] = axis.z;
  //    aAxisAngle.array[offset++] = angle;
  //  }
  //}
  //
  //// buffer color
  //var color = new THREE.Color();
  //var h, s, l;
  //
  //for (i = 0, offset = 0; i < mParticleCount; i++) {
  //  h = i / mParticleCount;
  //  s = THREE.Math.randFloat(0.5, 0.75);
  //  l = THREE.Math.randFloat(0.25, 0.5);
  //
  //  color.setHSL(h, s, l);
  //
  //  for (j = 0; j < prefabGeometry.vertices.length; j++) {
  //    aColor.array[offset++] = color.r;
  //    aColor.array[offset++] = color.g;
  //    aColor.array[offset++] = color.b;
  //  }
  //}
  //
  //// buffer spline (uniform)
  //var pathArray = [];
  //var radiusArray = [];
  //var pathSegmentCount = 8;
  //var pathLength = 200;
  //var pathWave = 5;
  //var step = pathLength / pathSegmentCount;
  //var x, y, z;
  ////var
  //
  //for (i = 0; i < pathSegmentCount; i++) {
  //
  //  x = -step * i + pathLength * 0.5;
  //  y = pathWave * (i / pathSegmentCount) * (i % 2 ? 1 : -1);
  //  z = 0;
  //
  //  pathArray.push(x, y, z);
  //  radiusArray.push(1);
  //}
  //
  ////// first point
  ////pathArray.push(-1000, 0, 0);
  ////radiusArray.push(2);
  ////
  ////for (i = 1; i < length - 1; i++) {
  ////  pathArray.push(
  ////    THREE.Math.randFloatSpread(500),
  ////    THREE.Math.randFloatSpread(500),
  ////    THREE.Math.randFloatSpread(500)
  ////  );
  ////
  ////  radiusArray.push(
  ////    THREE.Math.randFloat(1, 24)
  ////  );
  ////}
  ////
  ////// last point
  ////pathArray.push(1000, 0, 0);
  ////radiusArray.push(2);
  //
  //var material = new THREE.BAS.PhongAnimationMaterial(
  //  // custom parameters & THREE.MeshPhongMaterial parameters
  //  {
  //    vertexColors: THREE.VertexColors,
  //    shading: THREE.FlatShading,
  //    side: THREE.DoubleSide,
  //    defines: {
  //      PATH_LENGTH:pathArray.length / 3
  //    },
  //    uniforms: {
  //      uTime: {type: 'f', value: 0},
  //      uDuration: {type: 'f', value: mDuration},
  //      uPath: {type: 'fv', value: pathArray},
  //      uRadius: {type: 'fv1', value: radiusArray}
  //    },
  //    shaderFunctions: [
  //      THREE.BAS.ShaderChunk['quaternion_rotation'],
  //      THREE.BAS.ShaderChunk['catmull-rom']
  //    ],
  //    shaderParameters: [
  //      'uniform float uTime;',
  //      'uniform float uDuration;',
  //      'uniform vec3 uPath[PATH_LENGTH];',
  //      'uniform float uRadius[PATH_LENGTH];',
  //      'attribute float aOffset;',
  //      'attribute vec3 aPivot;',
  //      'attribute vec4 aAxisAngle;'
  //    ],
  //    shaderVertexInit: [
  //      'float tProgress = mod((uTime + aOffset), uDuration) / uDuration;',
  //
  //      //'float angle = aAxisAngle.w * tProgress;',
  //      //'vec4 tQuat = quatFromAxisAngle(aAxisAngle.xyz, angle);'
  //    ],
  //    shaderTransformNormal: [
  //      //'objectNormal = rotateVector(tQuat, objectNormal);'
  //    ],
  //    shaderTransformPosition: [
  //      'float tMax = float(PATH_LENGTH - 1);',
  //      'float tPoint = tMax * tProgress;',
  //      'float tIndex = floor(tPoint);',
  //      'float tWeight = tPoint - tIndex;',
  //
  //      'int i1 = int(tIndex);',
  //      'int i2 = int(min(tIndex + 1.0, tMax));',
  //      'vec3 p0 = uPath[int(max(0.0, tIndex - 1.0))];',
  //      'vec3 p1 = uPath[i1];',
  //      'vec3 p2 = uPath[i2];',
  //      'vec3 p3 = uPath[int(min(tIndex + 2.0, tMax))];',
  //
  //
  //
  //      //'vec3 d0 = catmullRom(p0, p1, p2, p3, max(tWeight - 0.0001, 0.0));',
  //      //'vec3 d1 = catmullRom(p0, p1, p2, p3, min(tWeight + 0.0001, 1.0));',
  //      //
  //      //'float d = dot(d0, d1);',
  //      //
  //      //'vec3 axis = cross(d0, d1);',
  //      //
  //      //'float l0 = length(d0);',
  //      //'float l1 = length(d1);',
  //      //
  //      //'float qw = sqrt(l0 * l0 * l1 * l1) + d;',
  //      //
  //      //'vec4 tQuat = normalize(quatFromAxisAngle(axis, radians(qw)));',
  //      //
  //      //'transformed = rotateVector(tQuat, transformed);',
  //
  //      'float radius = mix(uRadius[i1], uRadius[i2], tWeight);',
  //      'transformed += aPivot * radius;',
  //
  //
  //      'transformed += catmullRom(p0, p1, p2, p3, tWeight);'
  //    ]
  //  },
  //  // THREE.MeshPhongMaterial uniforms
  //  {
  //    shininess: 4
  //    //specular: 0xffd700
  //  }
  //);
  //
  //mParticleSystem = new THREE.Mesh(bufferGeometry, material);
  //// because the bounding box of the particle system does not reflect its on-screen size
  //// set this to false to prevent the whole thing from disappearing on certain angles
  //mParticleSystem.frustumCulled = false;
  //
  //mScene.add(mParticleSystem);
}

function tick() {
  update();
  render();

  mTime += mTimeStep;

  requestAnimationFrame(tick);
}

function update() {
  mControls.update();

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
