window.onload = init;

/**
 * This is a proof-of-concept for 'embedding' an animation timeline inside the vertex shader.
 * Implementation is very rough. Only translation and scale are supported.
 * This may or may not end up being useful.
 */

function init() {
  var root = new THREERoot();
  root.renderer.setClearColor(0x000000);
  root.camera.position.set(12, 12, 0);

  var light = new THREE.DirectionalLight(0xffffff, 1.0);
  light.position.set(0, 1, 0);
  root.add(light);
  root.addUpdateCallback(function() {
    light.position.copy(root.camera.position).normalize();
  });

  var pointLight = new THREE.PointLight();
  pointLight.position.set(0, 10, 0);
  root.add(pointLight);

  var gridHelper, animation, tween;

  // html stuff
  var elCount = document.querySelector('.count');
  var elBtnLeft = document.querySelector('.btn.left');
  var elBtnRight = document.querySelector('.btn.right');

  var sizes = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000];
  var index = 0;

  function createAnimation(i) {
    var gridSize = sizes[i];

    elCount.innerHTML = gridSize;
    elBtnRight.classList.toggle('disabled', i === sizes.length - 1);
    elBtnLeft.classList.toggle('disabled', index === 0);

    if (gridHelper) {
      root.remove(gridHelper);
      gridHelper.material.dispose();
      gridHelper.geometry.dispose();
    }

    if (animation) {
      root.remove(animation.mesh);
      animation.mesh.material.dispose();
      animation.mesh.geometry.dispose();
    }

    gridHelper = new THREE.GridHelper(gridSize * 0.5, 1, 0x222222, 0x444444);
    root.add(gridHelper);

    animation = new Animation(gridSize);
    root.add(animation.mesh);

    tween = animation.animate({repeat:-1, repeatDelay: 0.0, ease:Power0.easeNone}).timeScale(2.0);
  }

  elBtnLeft.addEventListener('click', function() {
    index = Math.max(0, index - 1);
    createAnimation(index);
  });
  elBtnRight.addEventListener('click', function() {
    index = Math.min(index + 1, sizes.length - 1);
    createAnimation(index);
  });

  createAnimation(index);
}

////////////////////
// CLASSES
////////////////////

function Animation(gridSize) {
  // setup timeline

  // the timeline generates shader chunks where an animation step is baked into.
  // each prefab will execute the same animation, with in offset position and time (delay).
  var timeline = new BAS.Timeline();

  //// scale down
  timeline.add(1.0, {
    scale: {
      to: new THREE.Vector3(1.4, 0.4, 1.4),
      ease: 'easeCubicOut'
    }
  });
  // scale up
  timeline.add(0.5, {
    scale: {
      to: new THREE.Vector3(0.4, 3.0, 0.4),
      ease: 'easeCubicIn'
    }
  });
  // move up + rotate
  timeline.add(1.0, {
    translate: {
      to: new THREE.Vector3(0.0, 6.0, 0.0),
      ease: 'easeCubicOut'
    },
    rotate: {
      from: {
        axis: new THREE.Vector3(0, 1, 0),
        angle: 0,
      },
      to: {
        angle: Math.PI
      },
      ease: 'easeCubicIn'
    }
  });
  // move down
  timeline.add(0.5, {
    translate: {
      to: new THREE.Vector3(0.0, 0.0, 0.0),
      ease: 'easeCubicIn'
    }
  });
  // land + squish
  timeline.add(0.5, {
    scale: {
      to: new THREE.Vector3(1.4, 0.4, 1.4),
      ease: 'easeCubicOut'
    }
  });
  // un-squish
  timeline.add(1.5, {
    scale: {
      to: new THREE.Vector3(1.0, 1.0, 1.0),
      ease: 'easeBackOut'
    }
  });

  // setup prefab
  var prefabSize = 0.5;
  var prefab = new THREE.BoxGeometry(prefabSize, prefabSize, prefabSize);
  prefab.translate(0, prefabSize * 0.5, 0);

  // setup prefab geometry
  var prefabCount = gridSize * gridSize;
  var geometry = new BAS.PrefabBufferGeometry(prefab, prefabCount);

  var aPosition = geometry.createAttribute('aPosition', 3);
  var aDelayDuration = geometry.createAttribute('aDelayDuration', 2);
  var index = 0;
  var dataArray = [];
  var maxDelay = gridSize === 1 ? 0 : 4.0;

  this.totalDuration = timeline.duration + maxDelay;

  for (var i = 0; i < gridSize; i++) {
    for (var j = 0; j < gridSize; j++) {
      var x = THREE.MathUtils.mapLinear(i, 0, gridSize, -gridSize * 0.5, gridSize * 0.5) + 0.5;
      var z = THREE.MathUtils.mapLinear(j, 0, gridSize, -gridSize * 0.5, gridSize * 0.5) + 0.5;

      // position
      dataArray[0] = x;
      dataArray[1] = 0;
      dataArray[2] = z;
      geometry.setPrefabData(aPosition, index, dataArray);

      // animation
      dataArray[0] = maxDelay * Math.sqrt(x * x + z * z) / gridSize;
      dataArray[1] = timeline.duration;
      geometry.setPrefabData(aDelayDuration, index, dataArray);

      index++;
    }
  }

  var material = new BAS.StandardAnimationMaterial({
    flatShading: true,
    diffuse: new THREE.Color(0x888888),
    metalness: 1.0,
    roughness: 1.0,
    uniforms: {
      uTime: {value: 0}
    },
    vertexFunctions: [
      // the eases used by the timeline defined above
      BAS.ShaderChunk['ease_cubic_in'],
      BAS.ShaderChunk['ease_cubic_out'],
      BAS.ShaderChunk['ease_cubic_in_out'],
      BAS.ShaderChunk['ease_back_out'],
      BAS.ShaderChunk['quaternion_rotation'],
      // getChunks outputs the shader chunks where the animation is baked into
    ].concat(timeline.compile()),
    vertexParameters: [
      'uniform float uTime;',

      'attribute vec3 aPosition;',
      'attribute vec2 aDelayDuration;'
    ],
    vertexPosition: [
      // calculate animation time for the prefab
      'float tTime = clamp(uTime - aDelayDuration.x, 0.0, aDelayDuration.y);',

      // apply timeline transformations based on 'tTime'
      timeline.getTransformCalls('scale'),
      timeline.getTransformCalls('rotate'),
      timeline.getTransformCalls('translate'),

      // translate the vertex by prefab position
      'transformed += aPosition;'
    ]
  });

  this.mesh = new THREE.Mesh(geometry, material);
  this.mesh.frustumCulled = false;
}

Object.defineProperty(Animation.prototype, 'time', {
  get: function () {
    return this.mesh.material.uniforms['uTime'].value;
  },
  set: function (v) {
    this.mesh.material.uniforms['uTime'].value = v;
  }
});

Animation.prototype.animate = function (options) {
  options = options || {};
  options.time = this.totalDuration;

  return TweenMax.fromTo(this, this.totalDuration, {time: 0.0}, options);
};
