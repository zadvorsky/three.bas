var mContainer;
var mCamera, mRenderer;
var mControls;

var mTime = 0.0;
var mTimeStep = (1/30);

var mScene;

var mTextGeometry;
var mTextBoundingBox;
var mTextWidth, mTextHeight, mTextDepth;
var mParticleSystem;

window.onload = function () {
  init();
};

function init() {
  initTHREE();
  initControls();
  initText();
  initBufferGeometry();

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
  mCamera.position.set(0, 20, 100);

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

function initText() {
  var text = '3D TEXT';
  var size = 14;
  var height = 1;
  var curveSegments = 10;
  var font = 'droid sans';
  var weight = 'bold';
  var style = 'normal';
  var bevelSize = 0.5;
  var bevelThickness = 0.25;

  mTextGeometry = new THREE.TextGeometry( text, {

    size: size,
    height: height,
    curveSegments: curveSegments,

    font: font,
    weight: weight,
    style: style,

    bevelThickness: bevelThickness,
    bevelSize: bevelSize,
    bevelEnabled: true
  });

  mTextGeometry.computeBoundingBox();
  mTextBoundingBox = mTextGeometry.boundingBox;
  mTextWidth = mTextGeometry.boundingBox.max.x - mTextGeometry.boundingBox.min.x;
  mTextHeight = mTextGeometry.boundingBox.max.y - mTextGeometry.boundingBox.min.y;
  mTextDepth = mTextGeometry.boundingBox.max.z - mTextGeometry.boundingBox.min.z;

  var xOffset = -0.5 * mTextWidth;
  var matrix = new THREE.Matrix4().makeTranslation(xOffset, 0, 0);

  mTextGeometry.applyMatrix(matrix);

  // test mesh
  //var material = new THREE.MeshPhongMaterial({color:0xff00ff});
  //var mesh = new THREE.Mesh(mTextGeometry, material);
  //
  //mScene.add(mesh);
}

function initBufferGeometry() {
  var bufferGeometry = new THREE.BAS.ModelBufferGeometry(mTextGeometry);

  var halfWidth = mTextWidth * 0.5;
  var halfHeight = mTextHeight * 0.5;
  var halfDepth = mTextDepth * 0.5;

  var aWave = bufferGeometry.createAttribute('aWave', 2);
  var aColor = bufferGeometry.createAttribute('color', 3);

  var faceCount = bufferGeometry.faceCount;
  var vertexCount = bufferGeometry.vertexCount;
  var i, j, offset;

  var amplitude, periodOffsetX, periodOffsetZ;

  for (i = 0, offset = 0; i < vertexCount; i++) {
    var v = mTextGeometry.vertices[i];

    amplitude = THREE.Math.mapLinear(v.z, -halfDepth, halfDepth, 0, 1);

    periodOffsetX = THREE.Math.mapLinear(v.x, -halfWidth, halfWidth, 0, Math.PI * 0.25);
    periodOffsetZ = THREE.Math.mapLinear(v.z, -halfDepth, halfWidth, 0, Math.PI * 2);

    aWave.array[offset++] = amplitude;
    aWave.array[offset++] = periodOffsetZ + periodOffsetX;
  }

  var material = new THREE.BAS.PhongAnimationMaterial({
        //vertexColors: THREE.VertexColors,
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
