var mContainer;
var mCamera, mRenderer;
var mControls;

var mTime = 0.0;

var mScene;

var mTextGeometry;
var mTextBoundingBox;
var mTextWidth, mTextHeight, mTextDepth;
var mParticleSystem;

var mTotalDuration = 9.25;
var mTween;

window.onload = function () {
  init();
};

function init() {
  initTHREE();
  // initControls();
  initTweenControls();
  initText();
  initBufferGeometry();

  mTween = TweenMax.fromTo(window, mTotalDuration * 0.5, {mTime:0},
    {mTime:mTotalDuration, ease:Power1.easeInOut, repeat:-1, yoyo:true});

  requestAnimationFrame(tick);
  window.addEventListener('resize', resize, false);
}

function initTHREE() {
  mRenderer = new THREE.WebGLRenderer({antialias: true});
  mRenderer.setSize(window.innerWidth, window.innerHeight);
  mRenderer.setClearColor(0xffffff);

  mContainer = document.getElementById('three-container');
  mContainer.appendChild(mRenderer.domElement);

  mCamera = new THREE.PerspectiveCamera(10, window.innerWidth / window.innerHeight, 0.1, 5000);
  mCamera.position.set(0, 0, 1400);

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

function initTweenControls() {
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
}

function initText() {
  var text = 'PIECE BY PIECE';
  var size = 14;
  var height = 0;
  var curveSegments = 10;
  var font = 'droid sans';
  var weight = 'bold';
  var style = 'normal';
  var bevelSize = 0.75;
  var bevelThickness = 0.50;

  mTextGeometry = new THREE.TextGeometry(text, {
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

  //console.log('txt size', mTextWidth, mTextHeight, mTextDepth);

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
  // var aCentroid = bufferGeometry.createAttribute('aCentroid', 3);
  // var aRotation = bufferGeometry.createAttribute('aRotation', 4);
  var aControl0 = bufferGeometry.createAttribute('aControl0', 3);
  var aControl1 = bufferGeometry.createAttribute('aControl1', 3);
  var aEndPosition = bufferGeometry.createAttribute('aEndPosition', 3);

  var faceCount = bufferGeometry.faceCount;
  var vertexCount = bufferGeometry.vertexCount;
  var i, i2, i3, i4, v;

  // var axis = new THREE.Vector3();

  for (i = 0, i2 = 0, i3 = 0, i4 = 0; i < faceCount; i++, i2 += 6, i3 += 9, i4 += 12) {
    var face = mTextGeometry.faces[i];
    var centroid = THREE.BAS.Utils.computeCentroid(mTextGeometry, face);
    var dirX = centroid.x > 0 ? 1 : -1;
    var dirY = centroid.y > 0 ? 1 : -1;
    var dirZ = centroid.z > 0 ? 1 : -1;

    // animation
    // var xDelay = THREE.Math.mapLinear(centroid.x, -halfWidth, halfWidth, 0, 0.25);
    // var yDelay = THREE.Math.mapLinear(centroid.y, -halfHeight, halfHeight, 0, 4.0);
    var delay = centroid.length() * THREE.Math.randFloat(0.03, 0.06);
    var duration = THREE.Math.randFloat(2, 4);

    for (v = 0; v < 6; v += 2) {
      aAnimation.array[i2 + v + 0] = delay + Math.random() * 1.0;
      aAnimation.array[i2 + v + 1] = duration;
    }

    // centroid
    // for (v = 0; v < 9; v += 3) {
    //   aCentroid.array[i3 + v + 0] = centroid.x;
    //   aCentroid.array[i3 + v + 1] = centroid.y;
    //   aCentroid.array[i3 + v + 2] = centroid.z;
    // }

    // rotation
    // axis.x = THREE.Math.randFloatSpread(2);
    // axis.y = dirY;
    // axis.z = dirZ;
    // axis.normalize();
    //
    // for (v = 0; v < 12; v += 4) {
    //   aRotation.array[i4 + v + 0] = axis.x;
    //   aRotation.array[i4 + v + 1] = axis.y;
    //   aRotation.array[i4 + v + 2] = axis.z;
    //   aRotation.array[i4 + v + 3] = Math.PI * THREE.Math.randFloat(4, 8);
    // }

    // ctrl
    var c0x = THREE.Math.randFloat(0, 30) * dirX;
    var c0y = THREE.Math.randFloat(60, 120) * dirY;
    var c0z = THREE.Math.randFloat(-20, 20);

    var c1x = THREE.Math.randFloat(30, 60) * dirX;
    var c1y = THREE.Math.randFloat(0, 60) * dirY;
    var c1z = THREE.Math.randFloat(-20, 20);

    for (v = 0; v < 9; v += 3) {
      aControl0.array[i3 + v + 0] = c0x;
      aControl0.array[i3 + v + 1] = c0y;
      aControl0.array[i3 + v + 2] = c0z;

      aControl1.array[i3 + v + 0] = c1x;
      aControl1.array[i3 + v + 1] = c1y;
      aControl1.array[i3 + v + 2] = c1z;
    }

    // end position (just leave at 0)
    // var x = THREE.Math.randFloatSpread(120);
    // var y = THREE.Math.randFloatSpread(120);
    // var z = THREE.Math.randFloatSpread(120);
    // var x = THREE.Math.randFloat(20, 60) * dirX;
    // var y = THREE.Math.randFloat(20, 60) * dirY;
    // var z = THREE.Math.randFloat(0, 10) * dirZ;
    //
    // for (v = 0; v < 9; v += 3) {
    //   aEndPosition.array[i3 + v + 0] = 0;
    //   aEndPosition.array[i3 + v + 1] = 0;
    //   aEndPosition.array[i3 + v + 2] = 0;
    // }
  }

  var material = new THREE.BAS.BasicAnimationMaterial({
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
        // 'attribute vec3 aCentroid;',
        // 'attribute vec4 aRotation;',
        'attribute vec3 aControl0;',
        'attribute vec3 aControl1;',
        'attribute vec3 aEndPosition;'
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
        // 'vec3 tPosition = transformed - aCentroid;',

        // 'vec4 tQuat = quatFromAxisAngle(aRotation.xyz, aRotation.w * tProgress);',
        // 'tPosition = rotateVector(tQuat, tPosition);',
        // 'tPosition += aCentroid;',

        'vec3 tPosition = transformed;',

        'tPosition *= 1.0 - tProgress;',

        'tPosition += cubicBezier(transformed, aControl0, aControl1, aEndPosition, tProgress);',

        'transformed = tPosition;'
      ]
    },
    {
      // shininess: 120,
      diffuse: 0x000000
      // specular: 0xffd700
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
