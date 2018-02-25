window.onload = init;

function init () {
  var root = new THREERoot({
    createCameraControls: true,
    antialias: (window.devicePixelRatio === 1),
    fov: 60
  });
  root.renderer.setClearColor(0xffffff);
  root.camera.position.set(1, 1, 1).multiplyScalar(20);

  root.add(new THREE.PointLight());
  root.add(new THREE.AxisHelper(10));

  var sizeX = 8;
  var sizeY = 8;
  var gpuCompute = new GPUComputationRenderer(sizeX, sizeY, root.renderer);
  var ctVelocity = gpuCompute.createTexture();
  var ctPosition = gpuCompute.createTexture();

  for (var k = 0, kl = ctPosition.image.data.length; k < kl; k += 4) {
    var x = THREE.Math.randFloatSpread(10);
    var y = THREE.Math.randFloatSpread(10);
    var z = THREE.Math.randFloatSpread(10);
    ctPosition.image.data[k + 0] = x;
    ctPosition.image.data[k + 1] = y;
    ctPosition.image.data[k + 2] = z;
    ctPosition.image.data[k + 3] = 1;
  }
  for (var k = 0, kl = ctVelocity.image.data.length; k < kl; k += 4) {
    var x = THREE.Math.randFloatSpread(1);
    var y = THREE.Math.randFloatSpread(1);
    var z = THREE.Math.randFloatSpread(1);
    ctVelocity.image.data[k + 0] = x;
    ctVelocity.image.data[k + 1] = y;
    ctVelocity.image.data[k + 2] = z;
    ctVelocity.image.data[k + 3] = 1;
  }

  var varVelocity = gpuCompute.addVariable('ctVelocity', document.getElementById('ctVelocity').textContent, ctVelocity);
  var varPosition = gpuCompute.addVariable('ctPosition', document.getElementById('ctPosition').textContent, ctPosition);

  gpuCompute.setVariableDependencies(varVelocity, [varPosition, varVelocity]);
  gpuCompute.setVariableDependencies(varPosition, [varPosition, varVelocity]);

  varVelocity.material.uniforms.bounds = {value: 10};

  gpuCompute.init();

  var animation = new Animation(sizeX, sizeY);
  root.add(animation);

  root.addUpdateCallback(function() {
    gpuCompute.compute();
    animation.setPositionTexture(gpuCompute.getCurrentRenderTarget(varPosition).texture);
  })
}

function Animation (sizeX, sizeY) {
  var prefab = new THREE.BoxGeometry(1.0, 1.0, 1.0);
  var prefabCount = sizeX * sizeY;
  var geometry = new BAS.PrefabBufferGeometry(prefab, prefabCount);

  var aRef = geometry.createAttribute('aRef', 2);
  var index = 0;

  for (var i = 0; i < sizeX; i++) {
    for (var j = 0; j < sizeY; j++) {
      geometry.setPrefabData(aRef, index++, [i / sizeX, j / sizeY]);
    }
  }

  var material = new BAS.PhongAnimationMaterial({
    shading: THREE.FlatShading,
    side: THREE.FrontSize,
    uniforms: {
      ctPosition: {value: null}
    },
    uniformValues: {
      diffuse: new THREE.Color(0xffffff)
    },
    vertexParameters: [
      'uniform sampler2D ctPosition;',
      'attribute vec2 aRef;'
    ],
    vertexPosition: [
      'transformed += texture2D(ctPosition, aRef).xyz;'
    ]
  });

  THREE.Mesh.call(this, geometry, material);
  this.frustumCulled = false;
}
Animation.prototype = Object.create(THREE.Mesh.prototype);
Animation.prototype.constructor = Animation;

Animation.prototype.setPositionTexture = function (t) {
  this.material.uniforms.ctPosition.value = t;
};
