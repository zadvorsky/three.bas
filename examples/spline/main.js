var mContainer;
var mCamera, mRenderer;
var mControls;

var mScene;

var mParticleCount = 1; // <-- change this number!
var mParticleSystem;

var mTime = 0.0;
var mTimeStep = (1/60);
var mDuration = 8;


var mPathPoints = [];

window.onload = function () {
  init();
};

function init() {
  initTHREE();
  initControls();
  initParticleSystem();

  requestAnimationFrame(tick);
  window.addEventListener('resize', resize, false);
}

function initTHREE() {
  mRenderer = new THREE.WebGLRenderer({antialias: true});
  mRenderer.setSize(window.innerWidth, window.innerHeight);

  mContainer = document.getElementById('three-container');
  mContainer.appendChild(mRenderer.domElement);

  mCamera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 5000);
  mCamera.position.set(0, 0, 200);

  mScene = new THREE.Scene();

  var light;

  light = new THREE.PointLight(0xffffff, 4, 1000, 2);
  light.position.set(0, 0, 0);
  mScene.add(light);


  for (var i = 0; i < 8; i++) {
    mPathPoints.push(new THREE.Vector3(
      THREE.Math.randFloatSpread(100),
      THREE.Math.randFloatSpread(100),
      THREE.Math.randFloatSpread(100)
    ));
  }

  var path = new THREE.CatmullRomCurve3(mPathPoints);
  var geom = new THREE.Geometry();
  geom.vertices = path.getPoints(100);
  var mat = new THREE.LineBasicMaterial(0xff0000);
  var line = new THREE.Line(geom, mat);
  mScene.add(line);
}

function initControls() {
  mControls = new THREE.OrbitControls(mCamera, mRenderer.domElement);
}

function initParticleSystem() {
  var prefabGeometry = new THREE.DodecahedronGeometry(4);
  var bufferGeometry = new THREE.BAS.PrefabBufferGeometry(prefabGeometry, mParticleCount);

  bufferGeometry.computeVertexNormals();

  // generate additional geometry data
  var aOffset = bufferGeometry.createAttribute('aOffset', 1);
  var aStartPosition = bufferGeometry.createAttribute('aStartPosition', 3);
  var aControlPoint1 = bufferGeometry.createAttribute('aControlPoint1', 3);
  var aControlPoint2 = bufferGeometry.createAttribute('aControlPoint2', 3);
  var aEndPosition = bufferGeometry.createAttribute('aEndPosition', 3);
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

  //// buffer start positions
  //var x, y, z;
  //
  //for (i = 0, offset = 0; i < mParticleCount; i++) {
  //  x = -1000;
  //  y = 0;
  //  z = 0;
  //
  //  for (j = 0; j < prefabGeometry.vertices.length; j++) {
  //    aStartPosition.array[offset++] = x;
  //    aStartPosition.array[offset++] = y;
  //    aStartPosition.array[offset++] = z;
  //  }
  //}
  //
  //// buffer control points
  //
  //for (i = 0, offset = 0; i < mParticleCount; i++) {
  //  x = THREE.Math.randFloat(-400, 400);
  //  y = THREE.Math.randFloat(400, 600);
  //  z = THREE.Math.randFloat(-1200, -800);
  //
  //  for (j = 0; j < prefabGeometry.vertices.length; j++) {
  //    aControlPoint1.array[offset++] = x;
  //    aControlPoint1.array[offset++] = y;
  //    aControlPoint1.array[offset++] = z;
  //  }
  //}
  //
  //for (i = 0, offset = 0; i < mParticleCount; i++) {
  //  x = THREE.Math.randFloat(-400, 400);
  //  y = THREE.Math.randFloat(-600, -400);
  //  z = THREE.Math.randFloat(800, 1200);
  //
  //  for (j = 0; j < prefabGeometry.vertices.length; j++) {
  //    aControlPoint2.array[offset++] = x;
  //    aControlPoint2.array[offset++] = y;
  //    aControlPoint2.array[offset++] = z;
  //  }
  //}
  //
  //// buffer end positions
  //
  //for (i = 0, offset = 0; i < mParticleCount; i++) {
  //  x = 1000;
  //  y = 0;
  //  z = 0;
  //
  //  for (j = 0; j < prefabGeometry.vertices.length; j++) {
  //    aEndPosition.array[offset++] = x;
  //    aEndPosition.array[offset++] = y;
  //    aEndPosition.array[offset++] = z;
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
  //  angle = Math.PI * THREE.Math.randInt(16, 32);
  //
  //  for (j = 0; j < prefabGeometry.vertices.length; j++) {
  //    aAxisAngle.array[offset++] = axis.x;
  //    aAxisAngle.array[offset++] = axis.y;
  //    aAxisAngle.array[offset++] = axis.z;
  //    aAxisAngle.array[offset++] = angle;
  //  }
  //}

  // buffer color
  var color = new THREE.Color();
  var h, s, l;

  for (i = 0, offset = 0; i < mParticleCount; i++) {
    h = i / mParticleCount;
    s = THREE.Math.randFloat(0.4, 0.6);
    l = THREE.Math.randFloat(0.4, 0.6);

    color.setHSL(h, s, l);

    for (j = 0; j < prefabGeometry.vertices.length; j++) {
      aColor.array[offset++] = color.r;
      aColor.array[offset++] = color.g;
      aColor.array[offset++] = color.b;
    }
  }

  var pathArray = [];
  var point;

  for (i = 0; i < mPathPoints.length; i++) {
    point = mPathPoints[i];
    pathArray.push(point.x, point.y, point.z);
  }

  var material = new THREE.BAS.PhongAnimationMaterial(
    // custom parameters & THREE.MeshPhongMaterial parameters
    {
      vertexColors: THREE.VertexColors,
      shading: THREE.FlatShading,
      side: THREE.DoubleSide,
      uniforms: {
        uTime: {type: 'f', value: 0},
        uDuration: {type: 'f', value: mDuration},
        uPath: {type: 'fv', value: pathArray}
      },
      shaderFunctions: [
        THREE.BAS.ShaderChunk['quaternion_rotation'],
        THREE.BAS.ShaderChunk['catmull-rom']
      ],
      shaderParameters: [
        'uniform float uTime;',
        'uniform float uDuration;',
        'uniform vec3 uPath[8];',
        'attribute float aOffset;',
        'attribute vec3 aStartPosition;',
        'attribute vec3 aControlPoint1;',
        'attribute vec3 aControlPoint2;',
        'attribute vec3 aEndPosition;',
        'attribute vec4 aAxisAngle;'
      ],
      shaderVertexInit: [
        'float tProgress = mod((uTime + aOffset), uDuration) / uDuration;',
        'float tPoint = 7.0 * tProgress;',
        'float tIndex = floor(tPoint);',
        'float tWeight = tPoint - tIndex;'
        //'int tIndex = int(tPointBase);'
      ],
      shaderTransformNormal: [
      ],
      shaderTransformPosition: [
        'vec3 p0 = uPath[int(max(0.0, tIndex - 1.0))];',
        'vec3 p1 = uPath[int(tIndex)];',
        'vec3 p2 = uPath[int(min(tIndex + 1.0, 7.0))];',
        'vec3 p3 = uPath[int(min(tIndex + 2.0, 7.0))];',
        'transformed += catmullRom(p0, p1, p2, p3, tWeight);'

        //'transformed = rotateVector(tQuat, transformed);',
        //'transformed += cubicBezier(aStartPosition, aControlPoint1, aControlPoint2, aEndPosition, tProgress);'
      ]
    },
    // THREE.MeshPhongMaterial uniforms
    {
      shininess: 20
    }
  );

  mParticleSystem = new THREE.Mesh(bufferGeometry, material);
  // because the bounding box of the particle system does not reflect its on-screen size
  // set this to false to prevent the whole thing from disappearing on certain angles
  mParticleSystem.frustumCulled = false;

  mScene.add(mParticleSystem);
}

function tick() {
  update();
  render();

  mTime += mTimeStep;
  mTime %= mDuration;

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
