window.onload = init;

/**
 * This is a proof-of-concept for 'embedding' an animation timeline inside the vertex shader.
 * Implementation is very rough. Only translation and scale are supported.
 * This may or may not end up being useful.
 */

function init() {
  var root = new THREERoot();
  root.renderer.setClearColor(0x000000);
  root.camera.position.set(0, 0, 36);

  var light = new THREE.DirectionalLight(0xFF6138, 1.0);
  light.position.set(0, 1, 0);
  root.add(light);

  light = new THREE.DirectionalLight(0x00A388, 1.0);
  light.position.set(0, -1, 0);
  root.add(light);

  var pointLight = new THREE.PointLight();
  pointLight.position.set(0, 10, 0);
  root.add(pointLight);

  var animation, tween;
  var settings = {
    maxDelay: 0.0,
    timeScale: 1.0,
    backAmplitude: 2.0,
    elasticAmplitude: 1.0,
    elasticPeriod: 0.125,
    apply: function() {
      createAnimation(index);
    }
  };

  // html stuff
  var elCount = document.querySelector('.count');
  var elBtnLeft = document.querySelector('.btn.left');
  var elBtnRight = document.querySelector('.btn.right');

  var sizes = [100, 1000, 10000, 50000, 100000, 500000, 1000000];
  var index = 0;

  function createAnimation(i) {
    var count = sizes[i];

    elCount.innerHTML = count;
    elBtnRight.classList.toggle('disabled', i === sizes.length - 1);
    elBtnLeft.classList.toggle('disabled', index === 0);

    if (animation) {
      root.remove(animation.mesh);
      animation.mesh.material.dispose();
      animation.mesh.geometry.dispose();
      tween.kill();
    }

    animation = new Animation(count, settings);
    root.add(animation.mesh);

    tween = animation.animate({repeat:-1, repeatDelay: 0.0, ease:Power0.easeNone}).timeScale(settings.timeScale);
  }

  elBtnLeft.addEventListener('click', function(e) {
    e.preventDefault();
    index = Math.max(0, index - 1);
    createAnimation(index);
  });
  elBtnRight.addEventListener('click', function(e) {
    e.preventDefault();
    index = Math.min(index + 1, sizes.length - 1);
    createAnimation(index);
  });

  createAnimation(index);

  // giu
  var gui = new dat.GUI();
  gui.add(settings, 'maxDelay', 0.0, 10.0).step(0.01);
  gui.add(settings, 'timeScale', 0.0, 10.0).step(0.01).onChange(function(v) {
    tween.timeScale(v);
  });
  gui.add(settings, 'backAmplitude', 0.0, 10.0).step(0.01);
  gui.add(settings, 'elasticAmplitude', 0.0, 10.0).step(0.01);
  gui.add(settings, 'elasticPeriod', 0.0, 10.0).step(0.01);
  gui.add(settings, 'apply').name('> apply');
  gui.width = 300;
}

////////////////////
// CLASSES
////////////////////

function Animation(prefabCount, settings) {
  // setup timeline

  // the timeline generates shader chunks where an animation step is baked into.
  // each prefab will execute the same animation, with in offset position and time (delay).
  var timeline = new BAS.Timeline();

  timeline.add(4.0, {
    rotate: {
      from: {
        axis: new THREE.Vector3(0, 1, 0),
        angle: 0
      },
      to: {
        angle: Math.PI * 4
      },
      ease: 'easeBackIn',
      // easeParams is an optional argument for easeBack and easeElastic
      // adding them to other eases will result in an error
      // easeBack receives one argument (amplitude)
      easeParams: [settings.backAmplitude]
    },
    scale: {
      to: {x:0.2, y:2.0, z:0.2},
      ease: 'easeBackIn',
      easeParams: [settings.backAmplitude]
    },
    translate: {
      to: {x: 0, y: 4.0, z: 0},
      ease: 'easeBackIn',
      easeParams: [settings.backAmplitude]
    }
  });
  timeline.add(2.0, {
    scale: {
      to: {x:1.0, y:1.0, z:1.0},
      ease: 'easeElasticOut',
      // easeElastic receives two arguments (amplitude and period)
      easeParams: [settings.elasticAmplitude, settings.elasticPeriod]
    },
    translate: {
      to: {x: 0, y: 0, z: 0},
      ease: 'easeElasticOut',
      easeParams: [settings.elasticAmplitude, settings.elasticPeriod]
    }
  });

  // setup prefabs

  var sphereRadius = 10;
  // calculate prefab size based on the number of prefabs to spread over the surface
  var sphereSurface = 4 * Math.PI * sphereRadius * sphereRadius;
  var prefabSize = Math.sqrt(sphereSurface / prefabCount) * 0.4;
  var prefab = new THREE.ConeGeometry(prefabSize, prefabSize * 2, 4, 1, false);
  prefab.translate(0, prefabSize * 0.5, 0);

  // setup prefab geometry
  var geometry = new BAS.PrefabBufferGeometry(prefab, prefabCount);

  var aPosition = geometry.createAttribute('aPosition', 3);
  var aDelayDuration = geometry.createAttribute('aDelayDuration', 3);
  var aQuaternion = geometry.createAttribute('aQuaternion', 4);

  var dataArray = [];

  var up = new THREE.Vector3(0, 1, 0);
  var normal = new THREE.Vector3();
  var quaternion = new THREE.Quaternion();

  this.totalDuration = timeline.duration + settings.maxDelay;

  for (var i = 0; i < prefabCount; i++) {

    // animation
    dataArray[0] = settings.maxDelay * (i / prefabCount);
    dataArray[1] = timeline.duration;
    geometry.setPrefabData(aDelayDuration, i, dataArray);

    // position
    var position = utils.fibSpherePoint(i, prefabCount, sphereRadius);

    position.toArray(dataArray);
    geometry.setPrefabData(aPosition, i, dataArray);

    // rotation
    normal.copy(position);
    normal.normalize();

    quaternion.setFromUnitVectors(up, normal);
    quaternion.toArray(dataArray);
    geometry.setPrefabData(aQuaternion, i, dataArray);
  }

  var material = new BAS.PhongAnimationMaterial({
    flatShading: true,
    side: THREE.DoubleSide,
    color: new THREE.Color(0xffffff),
    uniforms: {
      uTime: {value: 0}
    },
    vertexFunctions: [
      // the eases used by the timeline defined above
      BAS.ShaderChunk['ease_back_in'],
      BAS.ShaderChunk['ease_elastic_out'],
      BAS.ShaderChunk['quaternion_rotation']
      // getChunks outputs the shader chunks where the animation is baked into
    ].concat(timeline.compile()),
    vertexParameters: [
      'uniform float uTime;',

      'attribute vec3 aPosition;',
      'attribute vec4 aQuaternion;',
      'attribute vec2 aDelayDuration;'
    ],
    vertexPosition: [
      // calculate animation time for the prefab
      'float tTime = clamp(uTime - aDelayDuration.x, 0.0, aDelayDuration.y);',

      // apply timeline transformations based on 'tTime'
      timeline.getTransformCalls('scale'),
      timeline.getTransformCalls('rotate'),
      timeline.getTransformCalls('translate'),

      // rotate the vertex by quaternion
      'transformed = rotateVector(aQuaternion, transformed);',

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

var utils = {
  fibSpherePoint: (function() {
    var v = new THREE.Vector3();
    var G = Math.PI * (3 - Math.sqrt(5));

    return function(i, n, radius) {
      var step = 2.0 / n;
      var r, phi;

      v.y = i * step - 1 + (step * 0.5);
      r = Math.sqrt(1 - v.y * v.y);
      phi = i * G;
      v.x = Math.cos(phi) * r;
      v.z = Math.sin(phi) * r;

      radius = radius || 1;

      v.x *= radius;
      v.y *= radius;
      v.z *= radius;

      return v;
    }
  })()
};
