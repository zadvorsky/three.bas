var mContainer;
var mCamera, mRenderer;
var mControls;

var mScene;

var mParticleCount = 50000;
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
  //mRenderer.setClearColor(0xffffff);

  mContainer = document.getElementById('three-container');
  mContainer.appendChild(mRenderer.domElement);

  mCamera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 10000);
  mCamera.position.set(0, 600, 800);

  mScene = new THREE.Scene();
  //mScene.add(new THREE.GridHelper(1000, 100));

  var ground = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(1200, 1200),
    new THREE.MeshPhongMaterial({
      color:0x888888
    })
  );
  ground.rotation.x = Math.PI * 1.5;
  mScene.add(ground);

  var light;

  light = new THREE.SpotLight(0xffffff, 4, 1600, Math.PI * 0.15, 12, 2);
  light.position.set(0, 1000, 0);

  //mScene.add(new THREE.SpotLightHelper(light));
  mScene.add(light);
}

function initControls() {
  mControls = new THREE.OrbitControls(mCamera, mRenderer.domElement);
}

function initParticleSystem() {
  var prefabGeometry = new THREE.SphereGeometry(5, 4, 4, 0, 1, 1, 0.5);
  var bufferGeometry = new THREE.BAS.PrefabBufferGeometry(prefabGeometry, mParticleCount);

  bufferGeometry.computeVertexNormals();

  // generate additional geometry data

  var i, j, offset;

  var aDelayDuration = bufferGeometry.createAttribute('aDelayDuration', 2);
  // all start positions are (0,0,0), no need to fill that buffer, maybe remove it?
  var aStartPosition = bufferGeometry.createAttribute('aStartPosition', 3);
  var aControlPoint1 = bufferGeometry.createAttribute('aControlPoint1', 3);
  var aControlPoint2 = bufferGeometry.createAttribute('aControlPoint2', 3);
  var aEndPosition = bufferGeometry.createAttribute('aEndPosition', 3);
  var aAxisAngle = bufferGeometry.createAttribute('aAxisAngle', 4);
  var aColor = bufferGeometry.createAttribute('color', 3);

  // buffer delay duration
  var delay;
  var duration;
  offset = 0;

  for (i = 0; i < mParticleCount; i++) {
    delay = THREE.Math.randFloat(0, 4);
    duration = THREE.Math.randFloat(4, 8);

    for (j = 0; j < prefabGeometry.vertices.length; j++) {
      aDelayDuration.array[offset++] = delay;
      aDelayDuration.array[offset++] = duration;
    }
  }

  // buffer control points
  var x, y, z;

  offset = 0;

  for (i = 0; i < mParticleCount; i++) {
    x = THREE.Math.randFloat(-100, 100);
    y = THREE.Math.randFloat(600, 1000);
    z = THREE.Math.randFloat(-100, 100);

    for (j = 0; j < prefabGeometry.vertices.length; j++) {
      aControlPoint1.array[offset++] = x;
      aControlPoint1.array[offset++] = y;
      aControlPoint1.array[offset++] = z;
    }
  }

  offset = 0;

  for (i = 0; i < mParticleCount; i++) {
    x = THREE.Math.randFloat(-800, 800);
    y = THREE.Math.randFloat(200, 1000);
    z = THREE.Math.randFloat(-800, 800);

    for (j = 0; j < prefabGeometry.vertices.length; j++) {
      aControlPoint2.array[offset++] = x;
      aControlPoint2.array[offset++] = y;
      aControlPoint2.array[offset++] = z;
    }
  }

  // buffer end positions
  offset = 0;

  for (i = 0; i < mParticleCount; i++) {
    x = THREE.Math.randFloatSpread(1000);
    y = 0;
    z = THREE.Math.randFloatSpread(1000);

    for (j = 0; j < prefabGeometry.vertices.length; j++) {
      aEndPosition.array[offset++] = x;
      aEndPosition.array[offset++] = y;
      aEndPosition.array[offset++] = z;
    }
  }

  // buffer axis angle
  var axis = new THREE.Vector3();
  var angle = 0;

  offset = 0;

  for (i = 0; i < mParticleCount; i++) {
    axis.x = THREE.Math.randFloatSpread(2);
    axis.y = THREE.Math.randFloatSpread(2);
    axis.z = THREE.Math.randFloatSpread(2);
    axis.normalize();

    angle = Math.PI * THREE.Math.randInt(8, 16) + Math.PI * 0.5;

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

  offset = 0;

  for (i = 0; i < mParticleCount; i++) {
    h = THREE.Math.randFloat(0.0, 1.0);
    s = THREE.Math.randFloat(0.75, 1.0);
    l = THREE.Math.randFloat(0.5, 0.6);

    color.setHSL(h, s, l);

    for (j = 0; j < prefabGeometry.vertices.length; j++) {
      aColor.array[offset++] = color.r;
      aColor.array[offset++] = color.g;
      aColor.array[offset++] = color.b;
    }
  }

  var material = new THREE.BAS.PhongAnimationMaterial(
    // custom parameters & THREE.MeshPhongMaterial parameters
    {
      vertexColors: THREE.VertexColors,
      shading: THREE.SmoothShading,
      side: THREE.DoubleSide,
      uniforms: {
        uTime: {type: 'f', value: 0}
      },
      shaderFunctions: [
        THREE.BAS.ShaderChunk['quaternion_rotation'],
        THREE.BAS.ShaderChunk['cubic_bezier']
      ],
      shaderParameters: [
        'uniform float uTime;',
        'attribute vec2 aDelayDuration;',
        'attribute vec3 aStartPosition;',
        'attribute vec3 aControlPoint1;',
        'attribute vec3 aControlPoint2;',
        'attribute vec3 aEndPosition;',
        'attribute vec4 aAxisAngle;'
      ],
      shaderVertexInit: [
        'float tDelay = aDelayDuration.x;',
        'float tDuration = aDelayDuration.y;',
        'float tTime = clamp(uTime - tDelay, 0.0, tDuration);',
        //'float tProgress = ease(tTime, 0.0, 1.0, tDuration);',
        'float tProgress = tTime / tDuration;',

        'float angle = aAxisAngle.w * tProgress;',
        'vec4 tQuat = quatFromAxisAngle(aAxisAngle.xyz, angle);'
      ],
      shaderTransformNormal: [
        'objectNormal = rotateVector(tQuat, objectNormal);'
      ],
      shaderTransformPosition: [
        'transformed = rotateVector(tQuat, transformed);',
        'transformed += cubicBezier(aStartPosition, aControlPoint1, aControlPoint2, aEndPosition, tProgress);'
      ]
    },
    // THREE.MeshPhongMaterial uniforms
    {
      diffuse: 0xffffff, // color
      specular: 0xFBE087,
      shininess: 4
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
