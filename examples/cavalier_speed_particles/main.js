window.onload = init;

function init() {
  var root = new THREERoot();
  root.renderer.setClearColor(0x000000);
  root.camera.position.set(0, 2, 8);
  
  var width = 20;
  var height = 10;
  var depth = 20;
  
  var grid = new THREE.GridHelper(width * 0.5, 1);
  root.add(grid);
  
  var animation = new Animation(width, height, depth, 10000, 0.01);
  root.add(animation);
  root.addUpdateCallback(function() {
    animation.update(1/60);
  })
}

////////////////////
// CLASSES
////////////////////

function Animation(width, height, depth, prefabCount, prefabSize) {
  var prefab = new THREE.TetrahedronGeometry(prefabSize);
  var geometry = new SpeedParticleGeometry(prefab, prefabCount);
  
  geometry.createAttribute('aOffset', 1, function(data, i, count) {
    data[0] = i / count;
  });
  
  var aStartPosition = geometry.createAttribute('aStartPosition', 3);
  var aEndPosition = geometry.createAttribute('aEndPosition', 3);
  var x, y, data = [];
  
  for (var i = 0; i < prefabCount; i++) {
    x = THREE.Math.randFloatSpread(width);
    y = THREE.Math.randFloat(0, height);
    
    data[0] = x;
    data[1] = y;
    data[2] = depth  * -0.5;
    geometry.setPrefabData(aStartPosition, i, data);
    
    data[0] = x;
    data[1] = y;
    data[2] = depth * 0.5;
    geometry.setPrefabData(aEndPosition, i, data);
  }
  
  var axis = new THREE.Vector3();
  
  geometry.createAttribute('aAxisAngle', 4, function(data) {
    THREE.BAS.Utils.randomAxis(axis);
    
    axis.toArray(data);
    data[3] = Math.PI * THREE.Math.randInt(8, 16);
  });
  
  var material = new THREE.BAS.BasicAnimationMaterial({
    shading: THREE.FlatShading,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: {value: 0.0},
      uDuration: {value: 1.0},
      uScale: {value: 80.0}
    },
    uniformValues: {
      diffuse: new THREE.Color(0xf1f1f1)
    },
    vertexFunctions: [
      THREE.BAS.ShaderChunk['quaternion_rotation'],
      THREE.BAS.ShaderChunk['cubic_bezier']
    ],
    vertexParameters: [
      'uniform float uTime;',
      'uniform float uDuration;',
      'uniform float uScale;',
  
      'attribute float aOffset;',
      'attribute vec3 aStartPosition;',
      'attribute vec3 aEndPosition;',
      'attribute vec4 aAxisAngle;'
    ],
    vertexPosition: [
      'float tProgress = mod((uTime + aOffset), uDuration) / uDuration;',
  
      'float angle = aAxisAngle.w * tProgress;',
      'vec4 tQuat = quatFromAxisAngle(aAxisAngle.xyz, angle);',
      
      'transformed = rotateVector(tQuat, transformed);',
      'transformed.z *= uScale;',
      'transformed += mix(aStartPosition, aEndPosition, tProgress);'
    ]
  });

  THREE.Mesh.call(this, geometry, material);
  this.frustumCulled = false;
}
Animation.prototype = Object.create(THREE.Mesh.prototype);
Animation.prototype.constructor = Animation;

Animation.prototype.update = function(delta) {
  this.material.uniforms['uTime'].value += delta;
};
Animation.prototype.setScaleStep = function(scale) {
  scale = Math.max(1.0, scale * 128);
  TweenMax.to(this.material.uniforms['uScale'], 1.0, {value:scale, ease:Power0.easeIn});
};

function SpeedParticleGeometry(prefab, count) {
  THREE.BAS.PrefabBufferGeometry.call(this, prefab, count);
}
SpeedParticleGeometry.prototype = Object.create(THREE.BAS.PrefabBufferGeometry.prototype);
SpeedParticleGeometry.prototype.constructor = SpeedParticleGeometry;
SpeedParticleGeometry.prototype.bufferPositions = function() {
  var positionBuffer = this.createAttribute('position', 3).array;
  
  var axis = new THREE.Vector3();
  var scaleMatrix = new THREE.Matrix4();
  var rotationMatrix = new THREE.Matrix4();
  var transformMatrix = new THREE.Matrix4();
  var p = new THREE.Vector3();
  
  for (var i = 0, offset = 0; i < this.prefabCount; i++) {
    scaleMatrix.identity().makeScale(Math.random(), Math.random(), Math.random());
    
    axis.set(Math.random(), Math.random(), Math.random());
    axis.normalize();
    
    rotationMatrix.identity().makeRotationAxis(axis, Math.random() * Math.PI * 2);
    
    transformMatrix.multiplyMatrices(scaleMatrix, rotationMatrix);
    
    for (var j = 0; j < this.prefabVertexCount; j++, offset += 3) {
      var prefabVertex = this.prefabGeometry.vertices[j];
      
      p.copy(prefabVertex);
      p.applyMatrix4(transformMatrix);
      
      positionBuffer[offset    ] = p.x;
      positionBuffer[offset + 1] = p.y;
      positionBuffer[offset + 2] = p.z;
    }
  }
};
