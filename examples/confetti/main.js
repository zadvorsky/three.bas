var mContainer;
var mCamera, mRenderer;
var mControls;

var mScene;

var mParticleCount = 1000000;
var mParticleSystem;

var mTime = 0.0;

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
  mRenderer = new THREE.WebGLRenderer({antialias: false});
  mRenderer.setSize(window.innerWidth, window.innerHeight);

  mContainer = document.getElementById('three-container');
  mContainer.appendChild(mRenderer.domElement);

  mCamera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 10000);
  mCamera.position.z = 800;

  mScene = new THREE.Scene();

  var light;

  light = new THREE.DirectionalLight(0xAD2959, 1);
  light.position.set(0, 1, 0);
  mScene.add(light);

  light = new THREE.DirectionalLight(0x095062, 1);
  light.position.set(0, -1, 0);
  mScene.add(light);
}

function initControls() {
  mControls = new THREE.OrbitControls(mCamera, mRenderer.domElement);
}

function initParticleSystem() {
  var prefabGeometry = new THREE.TetrahedronGeometry(1);
  var bufferGeometry = new THREE.BAS.PrefabBufferGeometry(prefabGeometry, mParticleCount);

  // generate additional geometry data

  var i, j, offset;

  var aPosition = bufferGeometry.createAttribute('aPosition', 3);
  var spread = 400;

  offset = 0;

  for (i = 0; i < mParticleCount; i++) {
    var x = THREE.Math.randFloatSpread(spread);
    var y = THREE.Math.randFloatSpread(spread);
    var z = THREE.Math.randFloatSpread(spread);

    for (j = 0; j < prefabGeometry.vertices.length; j++) {
      aPosition.array[offset++] = x;
      aPosition.array[offset++] = y;
      aPosition.array[offset++] = z;
    }
  }

  var aAxis = bufferGeometry.createAttribute('aAxis', 3);
  var axis = new THREE.Vector3();

  offset = 0;

  for (i = 0; i < mParticleCount; i++) {
    axis.x = THREE.Math.randFloatSpread(2);
    axis.y = THREE.Math.randFloatSpread(2);
    axis.z = THREE.Math.randFloatSpread(2);
    axis.normalize();

    for (j = 0; j < prefabGeometry.vertices.length; j++) {
      aAxis.array[offset++] = axis.x;
      aAxis.array[offset++] = axis.y;
      aAxis.array[offset++] = axis.z;
    }
  }

  var material = new THREE.BAS.PhongAnimationMaterial(
    // custom parameters & THREE.MeshPhongMaterial parameters
    {
      shading: THREE.FlatShading,
      uniforms: {
        uTime: {type: 'f', value: 0}
      },
      shaderFunctions: [
        THREE.BAS.ShaderChunk['quaternion_rotation'],
        THREE.BAS.ShaderChunk['cubic_bezier']
      ],
      shaderParameters: [
        'uniform float uTime;',
        'attribute vec2 aDelayDuration',
        'attribute vec3 aStartPosition;',
        'attribute vec3 aControlPoint1;',
        'attribute vec3 aControlPoint2;',
        'attribute vec3 aEndPosition;',
        'attribute vec4 aAxisAngle;'
      ],
      shaderVertexInit: [
        'float angle = uTime;',
        'vec4 tQuat = quatFromAxisAngle(aAxis, angle);'
      ],
      shaderTransformNormal: [
        'objectNormal = rotateVector(tQuat, objectNormal);'
      ],
      shaderTransformPosition: [
        'transformed = rotateVector(tQuat, transformed);',
        'transformed += aPosition;'
      ]
    },
    // THREE.MeshPhongMaterial uniforms
    {
      diffuse: 0xffffff, // color
      specular: 0xFBE087,
      shininess: 80
    }
  );

  mParticleSystem = new THREE.Mesh(bufferGeometry, material);

  mScene.add(mParticleSystem);
}

function tick() {
  update();
  render();

  mTime += (1 / 60);

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
