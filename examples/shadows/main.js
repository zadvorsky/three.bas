window.onload = init;

function init() {
  var root = new THREERoot({
    createCameraControls: true,
    antialias: (window.devicePixelRatio === 1),
    fov: 60
  });

  root.renderer.setClearColor(0x222222);
  // setup renderer for shadows
  root.renderer.shadowMap.enabled = true;
  root.renderer.shadowMap.type = THREE.BasicShadowMap;
  // other possible shadow map types
  //root.renderer.shadowMap.type = THREE.PCFShadowMap;
  //root.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  root.camera.position.set(0, 40, 40);

  var dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.name = 'Dir. Light';
  dirLight.position.set(0, 20, 0);
  dirLight.castShadow = true;
  dirLight.shadow.camera.near = 0;
  dirLight.shadow.camera.far = 40;
  dirLight.shadow.camera.right = 20;
  dirLight.shadow.camera.left = -20;
  dirLight.shadow.camera.top = 20;
  dirLight.shadow.camera.bottom = -20;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  root.scene.add(dirLight);
  root.scene.add(new THREE.CameraHelper(dirLight.shadow.camera));

  var spotLight = new THREE.SpotLight( 0xffffff );
  spotLight.name = 'Spot Light';
  spotLight.angle = Math.PI / 5;
  spotLight.penumbra = 0.3;
  spotLight.position.set( 10, 10, 5 );
  spotLight.castShadow = true;
  spotLight.shadow.camera.near = 1;
  spotLight.shadow.camera.far = 30;
  spotLight.shadow.mapSize.width = 2048;
  spotLight.shadow.mapSize.height = 2048;
  root.scene.add( spotLight );
  root.scene.add( new THREE.CameraHelper( spotLight.shadow.camera ) );

  var pointLight = new THREE.PointLight();
  pointLight.castShadow = true;
  pointLight.shadow.camera.near = 1;
  pointLight.shadow.camera.far = 30;
  pointLight.shadow.bias = 0.01;
  root.scene.add( pointLight );
  root.scene.add( new THREE.CameraHelper( pointLight.shadow.camera ) );

  var geometry = new THREE.BoxGeometry(40, 40, 40);
  var material = new THREE.MeshPhongMaterial({
    color: 0xa0adaf,
    side: THREE.BackSide
  });
  var box = new THREE.Mesh(geometry, material);
  box.castShadow = false;
  box.receiveShadow = true;
  root.scene.add(box);

  var particleSystem = new ParticleSystem();
  particleSystem.animate();
  root.scene.add(particleSystem.mesh);
}

////////////////////
// CLASSES
////////////////////

function ParticleSystem() {
  var prefabGeometry = new THREE.TetrahedronGeometry(0.5);
  var prefabCount = 2000;
  var geometry = new BAS.PrefabBufferGeometry(prefabGeometry, prefabCount);

  var i, j, offset;

  // animation
  var aAnimation = geometry.createAttribute('aAnimation', 3);

  var minDuration = 1.0;
  var maxDuration = 1.0;
  var maxDelay = 0;

  this.totalDuration = maxDuration + maxDelay;

  for (i = 0, offset = 0; i < prefabCount; i++) {
    var delay = 0;
    var duration = THREE.MathUtils.randFloat(minDuration, maxDuration);

    for (j = 0; j < prefabGeometry.attributes.position.count; j++) {
      aAnimation.array[offset] = delay;
      aAnimation.array[offset + 1] = duration;

      offset += 3;
    }
  }

  // position
  var aPosition = geometry.createAttribute('aPosition', 3);
  var position = new THREE.Vector3();

  for (i = 0, offset = 0; i < prefabCount; i++) {
    position.x = THREE.MathUtils.randFloatSpread(40);
    position.y = THREE.MathUtils.randFloatSpread(40);
    position.z = THREE.MathUtils.randFloatSpread(40);

    for (j = 0; j < prefabGeometry.attributes.position.count; j++) {
      aPosition.array[offset] = position.x;
      aPosition.array[offset + 1] = position.y;
      aPosition.array[offset + 2] = position.z;

      offset += 3;
    }
  }

  // axis angle
  var aAxisAngle = geometry.createAttribute('aAxisAngle', 4);
  var axis = new THREE.Vector3();
  var angle;

  for (i = 0, offset = 0; i < prefabCount; i++) {
    axis.x = THREE.MathUtils.randFloatSpread(2);
    axis.y = THREE.MathUtils.randFloatSpread(2);
    axis.z = THREE.MathUtils.randFloatSpread(2);
    axis.normalize();
    angle = Math.PI * 2;

    for (j = 0; j < prefabGeometry.attributes.position.count; j++) {
      aAxisAngle.array[offset] = axis.x;
      aAxisAngle.array[offset + 1] = axis.y;
      aAxisAngle.array[offset + 2] = axis.z;
      aAxisAngle.array[offset + 3] = angle;

      offset += 4;
    }
  }

  var material = new BAS.PhongAnimationMaterial(
    {
      flatShading: true,
      transparent: true,
      uniforms: {
        uTime: {value: 0}
      },
      vertexFunctions: [
        BAS.ShaderChunk['quaternion_rotation']
      ],
      vertexParameters: [
        'uniform float uTime;',
        'attribute vec2 aAnimation;',
        'attribute vec3 aPosition;',
        'attribute vec4 aAxisAngle;'
      ],
      vertexInit: [
        'float tProgress = clamp(uTime - aAnimation.x, 0.0, aAnimation.y) / aAnimation.y;'
      ],
      vertexPosition: [
        'vec4 tQuat = quatFromAxisAngle(aAxisAngle.xyz, aAxisAngle.w * tProgress);',
        'transformed = rotateVector(tQuat, transformed);',

        'transformed += aPosition;'
      ],
    }
  );

  this.mesh = new THREE.Mesh(geometry, material);
  this.mesh.frustumCulled = false;
  this.mesh.castShadow = true;
  this.mesh.receiveShadow = true;

  // depth material is used for directional & spot light shadows
  this.mesh.customDepthMaterial = BAS.Utils.createDepthAnimationMaterial(material);
  // distance material is used for point light shadows
  this.mesh.customDistanceMaterial = BAS.Utils.createDistanceAnimationMaterial(material);
}
ParticleSystem.prototype = Object.create(THREE.Mesh.prototype);
ParticleSystem.prototype.constructor = ParticleSystem;
Object.defineProperty(ParticleSystem.prototype, 'time', {
  get: function () {
    return this.mesh.material.uniforms['uTime'].value;
  },
  set: function (v) {
    // sync animation time between the materials so the animation state is the same
    // could experiment with offsetting these values..
    this.mesh.material.uniforms['uTime'].value = v;
    this.mesh.customDepthMaterial.uniforms['uTime'].value = v;
    this.mesh.customDistanceMaterial.uniforms['uTime'].value = v;
  }
});

ParticleSystem.prototype.animate = function () {
  return TweenMax.fromTo(this, 2.0, {time: 0.0}, {time: this.totalDuration, ease: Power0.easeInOut, repeat:-1});
};
