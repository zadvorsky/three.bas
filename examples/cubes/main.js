var mContainer;
var mCamera, mRenderer;
var mControls;

var mScene;

var mGridSize = 32;
var mCubeCount = mGridSize * mGridSize * mGridSize;
var mCubeSystem;

var mTime = 0.0;
var mDuration;

window.onload = function () {
  init();
};

function init() {
  initTHREE();
  initControls();
  initParticleSystem();

  TweenMax.to(window, mDuration, {
    mTime:mDuration,
    ease:Power0.easeIn,
    repeat:-1,
    repeatDelay:0.25,
    yoyo:true
  });

  requestAnimationFrame(tick);
  window.addEventListener('resize', resize, false);
}

function initTHREE() {
  mRenderer = new THREE.WebGLRenderer({antialias: true});
  mRenderer.setSize(window.innerWidth, window.innerHeight);

  mContainer = document.getElementById('three-container');
  mContainer.appendChild(mRenderer.domElement);

  mCamera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 5000);
  mCamera.position.set(0, 0, 128);

  mScene = new THREE.Scene();

  var light;

  light = new THREE.PointLight(0xffffff, 1, 64, 2);
  light.position.set(0, 24, 0);
  mScene.add(light);

  light = new THREE.DirectionalLight(0xffffff, 0.5);
  light.position.set(-1, -0.75, -0.5);
  mScene.add(light);

  light = new THREE.DirectionalLight(0xffffff, 0.5);
  light.position.set(0.75, 0.5, 1);
  mScene.add(light);
}

function initControls() {
  mControls = new THREE.OrbitControls(mCamera, mRenderer.domElement);
}

function initParticleSystem() {
  var prefabGeometry = new THREE.BoxGeometry(1,1,1);
  var bufferGeometry = new THREE.BAS.PrefabBufferGeometry(prefabGeometry, mCubeCount);

  bufferGeometry.computeVertexNormals();

  // generate additional geometry data
  var aDelayDuration = bufferGeometry.createAttribute('aDelayDuration', 2);
  var aStartPosition = bufferGeometry.createAttribute('aStartPosition', 3);
  var aEndPosition = bufferGeometry.createAttribute('aEndPosition', 3);

  var i, j, offset;

  // buffer time offset
  var delay;
  var duration;
  var prefabDelay = 0.00025;
  var vertexDelay = 0.025;
  var minDuration = 1.0;
  var maxDuration = 1.1;

  mDuration = maxDuration + prefabDelay * mCubeCount + vertexDelay * prefabGeometry.vertices.length;

  for (i = 0, offset = 0; i < mCubeCount; i++) {
    delay = (mCubeCount - i) * prefabDelay;
    duration = THREE.Math.randFloat(minDuration, maxDuration);

    for (j = 0; j < prefabGeometry.vertices.length; j++) {
      aDelayDuration.array[offset++] = delay + j * vertexDelay;
      aDelayDuration.array[offset++] = duration;
    }
  }

  // buffer positions
  var x, y, z;
  var halfGridSize = mGridSize * 0.5;

  for (x = -halfGridSize, offset = 0; x < halfGridSize; x++) {
    for (y = -halfGridSize; y < halfGridSize; y++) {
      for(z = -halfGridSize; z < halfGridSize; z++) {
        for (j = 0; j < prefabGeometry.vertices.length; j++, offset += 3) {
          aStartPosition.array[offset  ] = x - 64;
          aStartPosition.array[offset+1] = y;
          aStartPosition.array[offset+2] = z;

          aEndPosition.array[offset  ] = x + 64;
          aEndPosition.array[offset+1] = y;
          aEndPosition.array[offset+2] = z;
        }
      }
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
        THREE.BAS.ShaderChunk['cubic_bezier'],
        THREE.BAS.ShaderChunk['ease_in_out_cubic']
      ],
      shaderParameters: [
        'uniform float uTime;',
        'attribute vec2 aDelayDuration;',
        'attribute vec3 aStartPosition;',
        'attribute vec3 aEndPosition;'
      ],
      shaderVertexInit: [
        'float tDelay = aDelayDuration.x;',
        'float tDuration = aDelayDuration.y;',
        'float tTime = clamp(uTime - tDelay, 0.0, tDuration);',
        'float tProgress = ease(tTime, 0.0, 1.0, tDuration);'
      ],
      shaderTransformPosition: [
        'transformed += mix(aStartPosition, aEndPosition, tProgress);'
      ]
    },
    // THREE.MeshPhongMaterial uniforms
    {
      diffuse:0x333333,
      shininess: 4
    }
  );

  mCubeSystem = new THREE.Mesh(bufferGeometry, material);
  // because the bounding box of the particle system does not reflect its on-screen size
  // set this to false to prevent the whole thing from disappearing on certain angles
  mCubeSystem.frustumCulled = false;

  mScene.add(mCubeSystem);
}

function tick() {
  update();
  render();

  requestAnimationFrame(tick);
}

function update() {
  mControls.update();

  mCubeSystem.material.uniforms['uTime'].value = mTime;
}

function render() {
  mRenderer.render(mScene, mCamera);
}

function resize() {
  mCamera.aspect = window.innerWidth / window.innerHeight;
  mCamera.updateProjectionMatrix();

  mRenderer.setSize(window.innerWidth, window.innerHeight);
}
