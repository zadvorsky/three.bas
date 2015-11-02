var mContainer;
var mCamera, mRenderer;
var mControls;

var mScene;

var mGridWidth = 256;
var mGridDepth = 256;
var mPillarCount = mGridWidth * mGridDepth;
var mPillarSystem;

var mTime = 0.0;
var mTimeStep = (1/60);
var mDuration = 2;

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
  mRenderer.setClearColor(0xffffff);

  mContainer = document.getElementById('three-container');
  mContainer.appendChild(mRenderer.domElement);

  mCamera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 5000);
  mCamera.position.set(0, 10, 0);

  mScene = new THREE.Scene();
  //mScene.add(new THREE.GridHelper(10, 1));

  var light;

  light = new THREE.DirectionalLight(0xffffff);//0xFDB813
  light.position.set(0, 0.25, -1);
  mScene.add(light);

  light = new THREE.DirectionalLight(0xffffff, 0.5);
  light.position.set(0, 0.25, 1);
  mScene.add(light);
}

function initControls() {
  mControls = new THREE.OrbitControls(mCamera, mRenderer.domElement);
}

function initParticleSystem() {
  var prefabGeometry = new THREE.BoxGeometry(1, 2, 1);
  var bufferGeometry = new THREE.BAS.PrefabBufferGeometry(prefabGeometry, mPillarCount);

  bufferGeometry.computeVertexNormals();

  // generate additional geometry data
  var aOffset = bufferGeometry.createAttribute('aOffset', 1);
  var aStartPosition = bufferGeometry.createAttribute('aStartPosition', 3);
  var aEndPosition = bufferGeometry.createAttribute('aEndPosition', 3);
  //var aAxisAngle = bufferGeometry.createAttribute('aAxisAngle', 4);
  var aColor = bufferGeometry.createAttribute('color', 3);

  var i, j, offset;

  // buffer time offset
  var delay;

  for (i = 0, offset = 0; i < mPillarCount; i++) {
    //delay = i * 0.1;
    delay = THREE.Math.randFloat(0, 10);

    for (j = 0; j < prefabGeometry.vertices.length; j++) {
      aOffset.array[offset++] = delay;
    }
  }

  // buffer positions
  var x, y, z;

  for (i = 0, offset = 0; i < mPillarCount; i++) {
    x = mGridWidth * -0.5 + (i % mGridWidth) + 0.5;
    y = 0;
    z = mGridDepth * -0.5 + ((i / mGridDepth) | 0) + 0.5;

    for (j = 0; j < prefabGeometry.vertices.length; j++, offset += 3) {
      aStartPosition.array[offset] = x;
      aStartPosition.array[offset+1] = 0;
      aStartPosition.array[offset+2] = z;

      aEndPosition.array[offset] = x;
      aEndPosition.array[offset+1] = 1;
      aEndPosition.array[offset+2] = z;
    }
  }

  //// buffer axis angle
  //var axis = new THREE.Vector3();
  //var angle = 0;
  //
  //for (i = 0, offset = 0; i < mPillarCount; i++) {
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

  for (i = 0, offset = 0; i < mPillarCount; i++) {
    h = THREE.Math.randFloat(0.55, 0.625);
    s = 0.5;
    l = 0.5;

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
      shading: THREE.FlatShading,
      side: THREE.DoubleSide,
      uniforms: {
        uTime: {type: 'f', value: 0}
        //uDuration: {type: 'f', value: mDuration}
      },
      shaderFunctions: [
        THREE.BAS.ShaderChunk['quaternion_rotation'],
        THREE.BAS.ShaderChunk['cubic_bezier']
      ],
      shaderParameters: [
        'uniform float uTime;',
        //'uniform float uDuration;',
        'attribute float aOffset;',
        'attribute vec3 aStartPosition;',
        //'attribute vec3 aControlPoint1;',
        //'attribute vec3 aControlPoint2;',
        'attribute vec3 aEndPosition;'
        //'attribute vec4 aAxisAngle;'
      ],
      shaderVertexInit: [
        //'float tProgress = mod((uTime + aOffset), uDuration) / uDuration;',
        'float tProgress = sin((uTime + aOffset));'

        //'float angle = aAxisAngle.w * tProgress;',
        //'vec4 tQuat = quatFromAxisAngle(aAxisAngle.xyz, angle);'
      ],
      shaderTransformNormal: [
        //'objectNormal = rotateVector(tQuat, objectNormal);'
      ],
      shaderTransformPosition: [
        //'transformed = rotateVector(tQuat, transformed);',
        'transformed += mix(aStartPosition, aEndPosition, tProgress);'
      ]
    },
    // THREE.MeshPhongMaterial uniforms
    {
      //specular: 0xFDB813,
      shininess: 10
    }
  );

  mPillarSystem = new THREE.Mesh(bufferGeometry, material);
  // because the bounding box of the particle system does not reflect its on-screen size
  // set this to false to prevent the whole thing from disappearing on certain angles
  mPillarSystem.frustumCulled = false;

  mScene.add(mPillarSystem);
}

function tick() {
  update();
  render();

  mTime += mTimeStep;
  //mTime %= mDuration;

  requestAnimationFrame(tick);
}

function update() {
  mControls.update();

  mPillarSystem.material.uniforms['uTime'].value = mTime;
}

function render() {
  mRenderer.render(mScene, mCamera);
}

function resize() {
  mCamera.aspect = window.innerWidth / window.innerHeight;
  mCamera.updateProjectionMatrix();

  mRenderer.setSize(window.innerWidth, window.innerHeight);
}
