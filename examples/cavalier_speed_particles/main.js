window.onload = init;

function init() {
  var root = new THREERoot({
    zNear: 0.1,
    zFar: 20000
  });
  root.renderer.setClearColor(0x000000);
  root.camera.position.set(0, 0.1, 1.0).multiplyScalar(20);

  // settings for the size of the animation / speed particle system
  var width = 20;
  var height = 10;
  var depth = 40;

  // create a ground for reference
  var ground = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(width, depth, width - 1, depth - 1),
    new THREE.MeshBasicMaterial({
      wireframe: true,
      color: 0x222222
    })
  );
  ground.rotateX(-Math.PI * 0.5);
  root.add(ground);

  // animation
  var animation;

  // gui
  var gui = new dat.GUI();
  var controller = {
    speedScale: 100.0,
    timeStep: (1/60),
    count: 10000,
    size: 0.01,
    create: function() {
      if (animation) {
        root.remove(animation.mesh);
        animation.mesh.geometry.dispose();
        animation.mesh.material.dispose();
      }

      animation = new Animation(width, height, depth, controller.count, controller.size);
      animation.setScale(controller.speedScale);
      root.add(animation.mesh);
    }
  };

  gui.add(controller, 'timeStep', (1/300), (1/60));
  gui.add(controller, 'speedScale', 1.0, 300.0).onChange(function(v) {
    animation.setScale(v);
    root.camera.fov = 60 + v * 0.20;
    root.camera.updateProjectionMatrix();
  });
  gui.add(controller, 'count', 100, 500000).step(100);
  gui.add(controller, 'size', 0.001, 0.1).step(0.001);
  gui.add(controller, 'create').name('> update');
  gui.close();

  controller.create();

  root.addUpdateCallback(function() {
    animation && animation.update(controller.timeStep);
  });
}

////////////////////
// CLASSES
////////////////////

function Animation(width, height, depth, prefabCount, prefabSize) {
  // create a prefab
  var prefab = new THREE.TetrahedronGeometry(prefabSize);
  prefab = new Geometry().fromBufferGeometry(prefab);

  // create a geometry where the prefab is repeated 'prefabCount' times
  var geometry = new SpeedParticleGeometry(prefab, prefabCount);

  // add a time offset for each prefab, spreading them out along the Z axis
  geometry.createAttribute('aOffset', 1, function(data, i, count) {
    data[0] = i / count;
  });

  // create a start position for each prefab
  var aStartPosition = geometry.createAttribute('aStartPosition', 3);
  // create an end position for each prefab
  var aEndPosition = geometry.createAttribute('aEndPosition', 3);
  var x, y, data = [];

  // for each prefab
  for (var i = 0; i < prefabCount; i++) {
    // get a random x coordinate between -width/2 and width/2
    x = THREE.MathUtils.randFloatSpread(width);
    // get a random y coordinate between 0 and height
    y = THREE.MathUtils.randFloat(0, height);

    // store the coordinates in the buffer attribute
    // x and y are the same for start and end position, causing each prefab to move in a straight line
    data[0] = x;
    data[1] = y;
    // all prefabs start at depth * -0.5
    data[2] = depth  * -0.5;
    geometry.setPrefabData(aStartPosition, i, data);

    data[0] = x;
    data[1] = y;
    // all prefabs end at depth * 0.5
    data[2] = depth * 0.5;
    geometry.setPrefabData(aEndPosition, i, data);
  }

  var material = new BAS.BasicAnimationMaterial({
    side: THREE.DoubleSide,
    diffuse: new THREE.Color(0xf1f1f1),
    uniforms: {
      uTime: {value: 0.0},
      uDuration: {value: 1.0},
      uScale: {value: 1.0}
    },
    vertexParameters: [
      'uniform float uTime;',
      'uniform float uDuration;',
      'uniform float uScale;',

      'attribute float aOffset;',
      'attribute vec3 aStartPosition;',
      'attribute vec3 aEndPosition;'
    ],
    vertexPosition: [
      // calculate a time based on the uniform time and the offset of each prefab
      'float tProgress = mod((uTime + aOffset), uDuration) / uDuration;',
      // scale the z axis based on the uniform speed scale
      'transformed.z *= uScale;',
      // translate between start and end position based on progress
      'transformed += mix(aStartPosition, aEndPosition, tProgress);'
    ]
  });

  this.mesh = new THREE.Mesh(geometry, material);
  this.mesh.frustumCulled = false;
}

Animation.prototype.update = function(delta) {
  this.mesh.material.uniforms['uTime'].value += delta;
};
Animation.prototype.setScale = function(scale) {
  this.mesh.material.uniforms['uScale'].value = scale;
};

class SpeedParticleGeometry extends BAS.PrefabBufferGeometry {
  constructor (prefab, count) {
    super (prefab, count);
  }

  bufferPositions () {
    var positionBuffer = this.createAttribute('position', 3).array;

    var axis = new THREE.Vector3();
    var scaleMatrix = new THREE.Matrix4();
    var rotationMatrix = new THREE.Matrix4();
    var transformMatrix = new THREE.Matrix4();
    var p = new THREE.Vector3();

    // for each prefab, compute a random transformation
    for (var i = 0, offset = 0; i < this.prefabCount; i++) {
      // random scale
      scaleMatrix.identity().makeScale(Math.random(), Math.random(), Math.random());

      // random axis rotation
      BAS.Utils.randomAxis(axis);
      rotationMatrix.identity().makeRotationAxis(axis, Math.random() * Math.PI * 2);

      // mush the two matrices together
      transformMatrix.multiplyMatrices(scaleMatrix, rotationMatrix);

      // for each prefab vertex, apply the transformation matrix
      for (var j = 0; j < this.prefabVertexCount; j++, offset += 3) {
        var prefabVertex = this.prefabGeometry.vertices[j];

        p.copy(prefabVertex);
        p.applyMatrix4(transformMatrix);

        positionBuffer[offset    ] = p.x;
        positionBuffer[offset + 1] = p.y;
        positionBuffer[offset + 2] = p.z;
      }
    }
  }
}
