window.onload = init;

// animation
var animation;

function init() {
  var root = new THREERoot();
  root.renderer.setClearColor(0x000000);
  root.camera.position.set(0, 0.25, -1).multiplyScalar(4);

  // create a ground for reference
  var ground = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(10, 10, 9, 9),
    new THREE.MeshBasicMaterial({
      wireframe: true,
      color: 0x222222
    })
  );
  ground.rotateX(-Math.PI * 0.5);
  root.add(ground);

  // the particles in the animation will each for a bezier curve
  // running from start (always 0, 0, 0) through cp0 and cp2, to end
  // the points will be randomly selected inside the bounds below
  var bounds = {
    cp0: new THREE.Box3(
      new THREE.Vector3(-1, 0, 0),
      new THREE.Vector3(1, 2, 2)
    ),
    cp1: new THREE.Box3(
      new THREE.Vector3(-8, 0, 0),
      new THREE.Vector3(8, 4, 4)
    ),
    end: new THREE.Box3(
      new THREE.Vector3(-6, 2, -2),
      new THREE.Vector3(6, 8, 6)
    )
  };

  // gui
  var gui = new dat.GUI();
  var controller = {
    timeScale: 0.5,
    count: 1000,
    size: 0.05,
    create: function() {
      if (animation) {
        root.remove(animation.mesh);
        animation.mesh.geometry.dispose();
        animation.mesh.material.dispose();
        animation.tween.kill();
      }

      animation = new Animation(controller.count, controller.size, bounds);
      animation.tween.timeScale(controller.timeScale);
      animation.mesh.addEventListener('tween_complete', function() {
        animation.play();
      });
      root.add(animation.mesh);

      animation.play();
    },
    replay: function() {
      animation.play();
    }
  };

  gui.add(controller, 'timeScale', 0.01, 1.0).step(0.01).onChange(function(v) {
    animation.tween.timeScale(v);
  });
  gui.add(controller, 'replay').name('> replay');
  gui.add(controller, 'count', 100, 50000).step(100);
  gui.add(controller, 'size', 0.001, 0.1).step(0.001);
  gui.add(controller, 'create').name('> update');
  gui.close();

  controller.create();
}

////////////////////
// CLASSES
////////////////////

function Animation(prefabCount, prefabSize, bounds) {
  this.bounds = bounds;

  // create a prefab
  var prefab = new THREE.PlaneGeometry(prefabSize, prefabSize, 1, 8);
  prefab = new Geometry().fromBufferGeometry(prefab);

  // create a geometry where the prefab is repeated 'prefabCount' times
  var geometry = new NuggetCollisionGeometry(prefab, prefabCount);

  // animation timing

  // each prefab has a start time (delay) and duration
  var aDelayDuration = geometry.createAttribute('aDelayDuration', 2);
  var delay;
  var duration;
  var minDuration = 0.25;
  var maxDuration = 1.0;
  var prefabDelay = 0.0;
  var vertexDelay = 0.01;

  for (var i = 0, offset = 0; i < prefabCount; i++) {
    delay = prefabDelay * i;
    duration = THREE.MathUtils.randFloat(minDuration, maxDuration);

    for (var j = 0; j < geometry.prefabVertexCount; j++) {
      // by giving EACH VERTEX in a prefab its own delay (based on index) the prefabs are stretched out
      // as the animation plays
      aDelayDuration.array[offset++] = delay + vertexDelay * duration * j;
      aDelayDuration.array[offset++] = duration;
    }
  }

  this.totalDuration = maxDuration + prefabDelay * prefabCount + vertexDelay * geometry.prefabVertexCount;

  // position

  // start position is always (0, 0, 0)
  // this attribute could be removed, but I've kept it around for consistency
  geometry.createAttribute('aStartPosition', 3);
  // control positions and end position are filled inside the 'bufferPoints' method below
  geometry.createAttribute('aControlPosition0', 3);
  geometry.createAttribute('aControlPosition1', 3);
  geometry.createAttribute('aEndPosition', 3);

  // color

  // each prefab will have a tint of the gold-ish color #d7d2bf
  var colorObj = new THREE.Color('#d7d2bf');
  var colorHSL = colorObj.getHSL(colorObj);
  var h, s, l;

  geometry.createAttribute('color', 3, function(data) {
    h = colorHSL.h;
    s = colorHSL.s;
    l = THREE.MathUtils.randFloat(0.25, 1.00);
    colorObj.setHSL(h, s, l);

    colorObj.toArray(data);
  });

  // rotation

  var axis = new THREE.Vector3();

  geometry.createAttribute('aAxisAngle', 4, function(data) {
    BAS.Utils.randomAxis(axis).toArray(data);
    data[3] = Math.PI * THREE.MathUtils.randFloat(8, 16);
  });

  var material = new BAS.BasicAnimationMaterial({
    side: THREE.DoubleSide,
    vertexColors: true,
    transparent: true,
    uniforms: {
      uTime: {value: 0.0}
    },
    vertexFunctions: [
      BAS.ShaderChunk['quaternion_rotation'],
      BAS.ShaderChunk['cubic_bezier'],
      BAS.ShaderChunk['ease_cubic_out']
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
      'float tProgress = clamp(uTime - aDelayDuration.x, 0.0, aDelayDuration.y) / aDelayDuration.y;',
      'tProgress = easeCubicOut(tProgress);',

      // rotate
      'vec4 tQuat = quatFromAxisAngle(aAxisAngle.xyz, aAxisAngle.w * tProgress);',
      'transformed = rotateVector(tQuat, transformed);',

      // scale (0.0 at start, 1.0 halfway, 0.0 at end of progress)
      'float scl = tProgress * 2.0 - 1.0;',
      'transformed *= (1.0 - scl * scl);',

      // translate
      'transformed += cubicBezier(aStartPosition, aControlPosition0, aControlPosition1, aEndPosition, tProgress);'
    ]
  });

  this.mesh = new THREE.Mesh(geometry, material);
  this.mesh.frustumCulled = false;

  this.tween = TweenMax.fromTo(this.mesh.material.uniforms['uTime'], 1.0, {value: 0}, {
    value:this.totalDuration,
    ease:Power0.easeOut,
    onCompleteScope: this,
    onComplete: function() {
      this.mesh.dispatchEvent({type: 'tween_complete'});
    }
  });
  this.tween.pause();
}

Animation.prototype.play = function() {
  this.bufferPoints();
  this.tween.play(0);
};
Animation.prototype.bufferPoints = function() {
  var aControlPosition0 = this.mesh.geometry.attributes['aControlPosition0'];
  var aControlPosition1 = this.mesh.geometry.attributes['aControlPosition1'];
  var aEndPosition = this.mesh.geometry.attributes['aEndPosition'];
  var data = [];
  var v = new THREE.Vector3();

  for (var i = 0; i < this.mesh.geometry.prefabCount; i++) {
    BAS.Utils.randomInBox(this.bounds.cp0, v).toArray(data);
    this.mesh.geometry.setPrefabData(aControlPosition0, i, data);

    BAS.Utils.randomInBox(this.bounds.cp1, v).toArray(data);
    this.mesh.geometry.setPrefabData(aControlPosition1, i, data);

    BAS.Utils.randomInBox(this.bounds.end, v).toArray(data);
    this.mesh.geometry.setPrefabData(aEndPosition, i, data);
  }

  aControlPosition0.needsUpdate = true;
  aControlPosition1.needsUpdate = true;
};

class NuggetCollisionGeometry extends BAS.PrefabBufferGeometry {
  constructor (prefab, count) {
    super(prefab, count);
  }

  bufferPositions () {
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
  }
}
