window.onload = init;

function init() {
  var root = new THREERoot();
  root.renderer.setClearColor(0x000000);
  root.camera.position.set(0, 2, 8);
  
  root.add(new THREE.AxisHelper(10));
  
  var animation = new Animation(1000, 0.01);
  root.add(animation);
  
  setInterval(function() {
    animation.play();
  }, 2000);
  
  animation.play();
}

////////////////////
// CLASSES
////////////////////

function Animation(prefabCount, prefabSize) {
  var prefab = new THREE.TetrahedronGeometry(prefabSize);
  var geometry = new NuggetCollisionGeometry(prefab, prefabCount);
  
  // animation timing
  
  var aDelayDuration = geometry.createAttribute('aDelayDuration', 2);
  var delay;
  var duration;
  var minDuration = 0.25;
  var maxDuration = 1.0;
  var prefabDelay = 0.0;
  var vertexDelay = 0.025;
  
  for (var i = 0, offset = 0; i < prefabCount; i++) {
    
    delay = prefabDelay * i;
    duration = THREE.Math.randFloat(minDuration, maxDuration);
    
    for (var j = 0; j < geometry.prefabVertexCount; j++) {
      
      aDelayDuration.array[offset++] = delay + vertexDelay * j;
      aDelayDuration.array[offset++] = duration;
    }
  }
  
  this.totalDuration = maxDuration + prefabDelay * prefabCount + vertexDelay * geometry.prefabVertexCount;
  
  // position
  
  geometry.createAttribute('aStartPosition', 3);
  geometry.createAttribute('aControlPosition0', 3);
  geometry.createAttribute('aControlPosition1', 3);
  geometry.createAttribute('aEndPosition', 3, function(data) {
    data[0] = THREE.Math.randFloat(-6, 6);
    data[1] = THREE.Math.randFloat(2, 8);
    data[2] = THREE.Math.randFloat(-2, 6);
  });
  // color
  
  var colorObj = new THREE.Color('#d7d2bf');
  var colorHSL = colorObj.getHSL();
  var h, s, l;
  
  geometry.createAttribute('color', 3, function(data) {
    h = colorHSL.h;
    s = colorHSL.s;
    l = THREE.Math.randFloat(0.25, 1.00);
    colorObj.setHSL(h, s, l);
    
    colorObj.toArray(data);
  });
  
  // rotation
  
  var axis = new THREE.Vector3();
  
  geometry.createAttribute('aAxisAngle', 4, function(data) {
    THREE.BAS.Utils.randomAxis(axis);
    
    axis.toArray(data);
    data[3] = Math.PI * THREE.Math.randInt(8, 16);
  });
  
  var material = new THREE.BAS.BasicAnimationMaterial({
    shading: THREE.FlatShading,
    side: THREE.DoubleSide,
    vertexColors: THREE.VertexColors,
    uniforms: {
      uTime: {value: 0.0}
    },
    uniformValues: {
      diffuse: new THREE.Color(0xf1f1f1)
    },
    vertexFunctions: [
      THREE.BAS.ShaderChunk['quaternion_rotation'],
      THREE.BAS.ShaderChunk['cubic_bezier'],
      THREE.BAS.ShaderChunk['ease_cubic_out']
    ],
    vertexParameters: [
      'uniform float uTime;',
  
      'attribute vec2 aDelayDuration;',
      'attribute vec3 aStartPosition;',
      'attribute vec3 aControlPosition0;',
      'attribute vec3 aControlPosition1;',
      'attribute vec3 aEndPosition;',
      'attribute vec4 aAxisAngle;'
    ],
    vertexPosition: [
      'float tDelay = aDelayDuration.x;',
      'float tDuration = aDelayDuration.y;',
      'float tTime = clamp(uTime - tDelay, 0.0, tDuration);',
      'float tProgress = easeCubicOut(tTime, 0.0, 1.0, tDuration);',
  
      'float angle = aAxisAngle.w * tProgress;',
      'vec4 tQuat = quatFromAxisAngle(aAxisAngle.xyz, angle);',
  
      'transformed = rotateVector(tQuat, transformed);',
      'float scl = tProgress * 2.0 - 1.0;',
      'transformed *= (1.0 - scl * scl);',
      'transformed += cubicBezier(aStartPosition, aControlPosition0, aControlPosition1, aEndPosition, tProgress);'
    ]
  });

  THREE.Mesh.call(this, geometry, material);
  this.frustumCulled = false;
  
  this.animation = TweenMax.fromTo(this.material.uniforms['uTime'], 1.0,
    {value:0},
    {value:this.totalDuration, ease:Power0.easeOut}
  );
  this.animation.pause();
}
Animation.prototype = Object.create(THREE.Mesh.prototype);
Animation.prototype.constructor = Animation;

Animation.prototype.play = function() {
  this.bufferControlPoints();
  this.animation.play(0);
};
Animation.prototype.bufferControlPoints = function() {
  var aControlPosition0 = this.geometry.attributes['aControlPosition0'];
  var aControlPosition1 = this.geometry.attributes['aControlPosition1'];
  var data = [];
  
  for (var i = 0; i < this.geometry.prefabCount; i++) {
    data[0] = THREE.Math.randFloat(-1, 1);
    data[1] = THREE.Math.randFloat(0, 4);
    data[2] = THREE.Math.randFloat(0, 4);
    this.geometry.setPrefabData(aControlPosition0, i, data);
  
    data[0] = THREE.Math.randFloat(-8, 8);
    data[1] = THREE.Math.randFloat(0, 4);
    data[2] = THREE.Math.randFloat(0, 4);
    this.geometry.setPrefabData(aControlPosition0, i, data);
  }
  
  aControlPosition0.needsUpdate = true;
  aControlPosition1.needsUpdate = true;
};

function NuggetCollisionGeometry(prefab, count) {
  THREE.BAS.PrefabBufferGeometry.call(this, prefab, count);
}
NuggetCollisionGeometry.prototype = Object.create(THREE.BAS.PrefabBufferGeometry.prototype);
NuggetCollisionGeometry.prototype.constructor = NuggetCollisionGeometry;
NuggetCollisionGeometry.prototype.bufferPositions = function() {
  var positionBuffer = this.createAttribute('position', 3).array;
  
  var scaleMatrix = new THREE.Matrix4();
  var scale;
  var p = new THREE.Vector3();
  
  for (var i = 0, offset = 0; i < this.prefabCount; i++) {
    for (var j = 0; j < this.prefabVertexCount; j++, offset += 3) {
      var prefabVertex = this.prefabGeometry.vertices[j];
      
      scale = Math.random();
      scaleMatrix.identity().makeScale(scale, scale, scale);
      
      p.copy(prefabVertex);
      p.applyMatrix4(scaleMatrix);
      
      positionBuffer[offset    ] = p.x;
      positionBuffer[offset + 1] = p.y;
      positionBuffer[offset + 2] = p.z;
    }
  }
};
