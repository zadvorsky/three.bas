var mContainer;
var mCamera, mRenderer;
var mControls;

var mTime = 0.0;

var mScene;

var mTextGeometry;
var mTextBoundingBox;
var mTextWidth, mTextHeight, mTextDepth;
var mParticleSystem;

var mTotalDuration = 0;
var mTween;

window.onload = function () {
  init();
};

function init() {
  initTHREE();
  //initControls();
  initText();
  initBufferGeometry();

  mTween = TweenMax.fromTo(window, 24, {mTime:0}, {mTime:mTotalDuration, ease:Power0.easeIn, repeat:-1});

  var mouseDown = false;
  var _cx = 0;
  var step = 0.001;

  document.body.style.cursor = 'pointer';

  window.addEventListener('mousedown', function(e) {
    mouseDown = true;
    _cx = e.clientX;

    TweenMax.to(mTween, 2, {timeScale:0});

    document.body.style.cursor = 'ew-resize';
  });
  window.addEventListener('mouseup', function(e) {
    mouseDown = false;
    TweenMax.to(mTween, 2, {timeScale:1});

    document.body.style.cursor = 'pointer';
  });
  window.addEventListener('mousemove', function(e) {
    if (mouseDown === true) {
      var cx = e.clientX;
      var dx = cx - _cx;
      var progress = mTween.progress();
      var p = THREE.Math.clamp((progress + (dx * step)), 0, 1);

      mTween.progress(p);

      _cx = cx;
    }
  });

  requestAnimationFrame(tick);
  window.addEventListener('resize', resize, false);
}

function initTHREE() {
  mRenderer = new THREE.WebGLRenderer({antialias: true});
  mRenderer.setSize(window.innerWidth, window.innerHeight);
  mRenderer.setClearColor(0x000000);

  mContainer = document.getElementById('three-container');
  mContainer.appendChild(mRenderer.domElement);

  mCamera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 5000);
  mCamera.position.set(0, 0, 60);

  mScene = new THREE.Scene();
  //mScene.add(new THREE.GridHelper(200, 10));
  //mScene.add(new THREE.AxisHelper(20));

  var light;

  light = new THREE.DirectionalLight(0x00ffff);
  light.position.set(0, 1, 0);
  mScene.add(light);

  light = new THREE.DirectionalLight(0xff00ff);
  light.position.set(0, -1, 0);
  mScene.add(light);
}

function initControls() {
  mControls = new THREE.OrbitControls(mCamera, mRenderer.domElement);
}

function initText() {
  var text = 'POLYGON';
  var size = 14;
  var height = 4;
  var curveSegments = 10;
  var font = 'droid sans';
  var weight = 'bold';
  var style = 'normal';
  var bevelSize = 0.75;
  var bevelThickness = 0.50;

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

  console.log(mTextWidth, mTextHeight, mTextDepth);

  var xOffset = -0.5 * mTextWidth;
  var yOffset = -0.5 * mTextHeight;
  var zOffset = -0.5 * mTextDepth;
  var matrix = new THREE.Matrix4().makeTranslation(xOffset, yOffset, zOffset);

  mTextGeometry.applyMatrix(matrix);

  //var noise = 0.25;
  //
  //mTextGeometry.vertices.forEach(function(v) {
  //  v.x += THREE.Math.randFloatSpread(noise);
  //  v.y += THREE.Math.randFloatSpread(noise);
  //  v.z += THREE.Math.randFloatSpread(noise);
  //});

  THREE.BAS.Utils.separateFaces(mTextGeometry);

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

  var aAnimation = bufferGeometry.createAttribute('aAnimation', 2);
  var aCentroid = bufferGeometry.createAttribute('aCentroid', 3);
  var aRotation = bufferGeometry.createAttribute('aRotation', 4);
  var aTranslation = bufferGeometry.createAttribute('aTranslation', 3);

  var faceCount = bufferGeometry.faceCount;
  var vertexCount = bufferGeometry.vertexCount;
  var i, i2, i3, i4, v;

  var axis = new THREE.Vector3();

  mTotalDuration = 5.3;

  for (i = 0, i2 = 0, i3 = 0, i4 = 0; i < faceCount; i++, i2 += 6, i3 += 9, i4 += 12) {
    var face = mTextGeometry.faces[i];
    var centroid = THREE.BAS.Utils.computeCentroid(mTextGeometry, face);
    var dirX = centroid.x > 0 ? 1 : -1;
    var dirY = centroid.y > 0 ? 1 : -1;
    var dirZ = centroid.z > 0 ? 1 : -1;

    // animation

    var xDelay = THREE.Math.mapLinear(centroid.x, -halfWidth, halfWidth, 0, 0.5);
    //var yDelay = THREE.Math.mapLinear(centroid.y, -halfHeight, halfHeight, 0, 0.05);
    var yDelay = 0;
    var duration = THREE.Math.randFloat(1.2, 2.8);

    for (v = 0; v < 6; v += 2) {
      aAnimation.array[i2 + v + 0] = xDelay + yDelay;
      aAnimation.array[i2 + v + 1] = duration;
    }

    // centroid

    for (v = 0; v < 9; v += 3) {
      aCentroid.array[i3 + v + 0] = centroid.x;
      aCentroid.array[i3 + v + 1] = centroid.y;
      aCentroid.array[i3 + v + 2] = centroid.z;
    }

    // rotation

    axis.x = THREE.Math.randFloatSpread(2);
    axis.y = dirY;
    axis.z = dirZ;
    axis.normalize();

    for (v = 0; v < 12; v += 4) {
      aRotation.array[i4 + v + 0] = axis.x;
      aRotation.array[i4 + v + 1] = axis.y;
      aRotation.array[i4 + v + 2] = axis.z;
      aRotation.array[i4 + v + 3] = Math.PI * THREE.Math.randFloat(4, 8);
    }

    // translation

    var x = THREE.Math.randFloat(20, 60) * dirX;
    var y = THREE.Math.randFloat(120, 140) * dirY;
    var z = THREE.Math.randFloat(20, 60) * dirZ;

    for (v = 0; v < 9; v += 3) {
      aTranslation.array[i3 + v + 0] = x;
      aTranslation.array[i3 + v + 1] = y;
      aTranslation.array[i3 + v + 2] = z;
    }
  }

  var material = new THREE.BAS.PhongAnimationMaterial({
      //vertexColors: THREE.VertexColors,
      shading: THREE.FlatShading,
      side: THREE.DoubleSide,
      //wireframe: true,
      defines: {
      },
      uniforms: {
        uTime: {type: 'f', value: 0}
      },
      shaderFunctions: [
        //THREE.BAS.ShaderChunk['ease_out_cubic'],
        THREE.BAS.ShaderChunk['quaternion_rotation'],
        THREE.BAS.ShaderChunk['cubic_bezier']
      ],
      shaderParameters: [
        'uniform float uTime;',
        'attribute vec2 aAnimation;',
        'attribute vec3 aCentroid;',
        'attribute vec4 aRotation;',
        'attribute vec3 aTranslation;'
      ],
      shaderVertexInit: [
        'float tDelay = aAnimation.x;',
        'float tDuration = aAnimation.y;',
        'float tTime = clamp(uTime - tDelay, 0.0, tDuration);',
        'float tProgress = tTime / tDuration;'
      ],
      shaderTransformNormal: [
      ],
      shaderTransformPosition: [
        'vec3 tPosition = transformed - aCentroid;',
        'vec4 tQuat = quatFromAxisAngle(aRotation.xyz, aRotation.w * tProgress);',
        'tPosition = rotateVector(tQuat, tPosition);',
        'tPosition += aCentroid;',
        'tPosition += aTranslation * tProgress;',
        'transformed = tPosition;'
      ]
    },
    {
      shininess: 120,
      //diffuse:0xff00ff
      specular: 0xffd700
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
  //mControls.update();

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
