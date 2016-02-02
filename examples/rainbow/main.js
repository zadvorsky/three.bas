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

  var modelGeometry = new THREE.BoxGeometry(width, height, depth, width, 1, 20);

  THREE.BAS.Utils.separateFaces(modelGeometry);

  var bufferGeometry = new RainbowGeometry(modelGeometry);

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
      side: THREE.DoubleSide,
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


function RainbowGeometry(model) {
  THREE.BAS.ModelBufferGeometry.call(this, model);
}
RainbowGeometry.prototype = Object.create(THREE.BAS.ModelBufferGeometry.prototype);
RainbowGeometry.prototype.constructor = RainbowGeometry;

RainbowGeometry.prototype.bufferPositions = function() {
  var positionBuffer = this.createAttribute('position', 3).array;
  var faces = this.modelGeometry.faces;
  var verts = this.modelGeometry.vertices;

  for (var i = 0; i < faces.length; i++) {
    var face = faces[i];
    var va = verts[face.a];
    var vb = verts[face.b];
    var vc = verts[face.c];

    var c = THREE.BAS.Utils.computeCentroid(this.modelGeometry, face);
    var scale = THREE.Math.mapLinear(c.z, 20, -20, 0.5, 1.0);

    va.sub(c).multiplyScalar(scale).add(c);
    vb.sub(c).multiplyScalar(scale).add(c);
    vc.sub(c).multiplyScalar(scale).add(c);

    //var y = Math.random() * 10;

    positionBuffer[face.a * 3 + 0] = va.x + THREE.Math.randFloatSpread(0.1);
    positionBuffer[face.a * 3 + 1] = va.y;
    positionBuffer[face.a * 3 + 2] = va.z + THREE.Math.randFloatSpread(0.1);

    positionBuffer[face.b * 3 + 0] = vb.x + THREE.Math.randFloatSpread(0.1);
    positionBuffer[face.b * 3 + 1] = vb.y;
    positionBuffer[face.b * 3 + 2] = vb.z + THREE.Math.randFloatSpread(0.1);

    positionBuffer[face.c * 3 + 0] = vc.x + THREE.Math.randFloatSpread(0.1);
    positionBuffer[face.c * 3 + 1] = vc.y;
    positionBuffer[face.c * 3 + 2] = vc.z + THREE.Math.randFloatSpread(0.1);



  }

  //for (var i = 0, offset = 0; i < this.vertexCount; i++, offset += 3) {
  //  var prefabVertex = this.modelGeometry.vertices[i];
  //
  //  positionBuffer[offset    ] = prefabVertex.x;
  //  positionBuffer[offset + 1] = prefabVertex.y * Math.random();
  //  positionBuffer[offset + 2] = prefabVertex.z;
  //}
};
