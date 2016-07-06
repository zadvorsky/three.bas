window.onload = init;

function init() {
  var root = new THREERoot();
  root.renderer.setClearColor(0xffffff);
  root.camera.position.set(10, 10, 10);

  var light = new THREE.DirectionalLight(0xffffff, 1.0);
  light.position.set(0, 1, 0);
  root.add(light);

  var gridHelper = new THREE.GridHelper(10, 1);
  root.add(gridHelper);

  var axisHelper = new THREE.AxisHelper(10);
  root.add(axisHelper);

  var animation = new Animation();
  animation.animate(10.0, {repeat:-1, repeatDelay: 0.0, ease:Power0.easeNone});
  root.add(animation);
}

////////////////////
// CLASSES
////////////////////

function Animation() {
  var prefabSize = 0.5;
  var prefab = new THREE.BoxGeometry(prefabSize, prefabSize, prefabSize);

  prefab.translate(0, prefabSize * 0.5, 0);

  var gridSize = 1;
  var prefabCount = gridSize * gridSize;

  var geometry = new THREE.BAS.PrefabBufferGeometry(prefab, prefabCount);

  //var aPosition = geometry.createAttribute('aPosition', 3);
  var aDelayDuration = geometry.createAttribute('aDelayDuration', 2);
  var index = 0;

  var maxDelay = 1.0;
  var maxDuration = 1.0;

  this.totalDuration = maxDelay + maxDuration;

  for (var i = 0; i < gridSize; i++) {
    for (var j = 0; j < gridSize; j++) {
      var x = THREE.Math.mapLinear(i, 0, gridSize, -gridSize * 0.5, gridSize * 0.5) + 0.5;
      var y = THREE.Math.mapLinear(j, 0, gridSize, -gridSize * 0.5, gridSize * 0.5) + 0.5;

      //geometry.setPrefabData(aPosition, index, [x, 0, y]);

      //var delay = maxDelay * index / prefabCount;
      var delay = maxDelay * Math.sqrt(x * x + y * y) / gridSize * 0.5;
      //var delay = maxDelay * Math.random();

      var duration = maxDuration;

      geometry.setPrefabData(aDelayDuration, index, [0, 2]);

      index++;
    }
  }

  /**
   float cDelay{{step}} = x;
   float cDuration{{step}} = x;
   vec3 cTranslate{{step}} = vec(x, x, x);
   vec3 cScale{{step}} = vec(x, x, x);
   void applyTransform{{step}}(inout vec3 v) {
     if (uTime < cDelay{{step}}) return;

     float progress = {{ease}}((uTime - cDelay{{step}}) / cDuration{{step}});

     v *= cScale{{step}} * progress;
     v += cTranslate{{step}} * progress;
    }
   */

  function vecToString(v, p) {
    return v.x.toPrecision(p) + ',' + v.y.toPrecision(p) + ',' + v.z.toPrecision(p);
  }

  function makeShaderChunk(key, delay, duration, ease, translate, scale) {
    var t = 'vec3(' + vecToString(translate, 2) + ')';
    var s = 'vec3(' + vecToString(scale, 2) + ')';

    return [
      'float cDelay' + key + ' = ' + delay.toPrecision(2) + ';',
      'float cDuration' + key + ' = ' + duration.toPrecision(2) + ';',
      'vec3 cTranslate' + key + ' = ' + t + ';',
      'vec3 cScale' + key + ' = ' + s + ';',

      'vec3 applyTransform' + key + '(float time, vec3 v) {',

        //'if (time < cDelay' + key + ') return;',

        'float progress = clamp(time - cDelay' + key + ', 0.0, cDuration' + key + ') / cDuration' + key + ';',
        'progress = ' + ease + '(progress);',

        'v *= cScale' + key + ' * progress;',
        'v += cTranslate' + key + ' * progress;',

        'return v;',
      '}'
    ].join('\n');
  }


  var animationStep01 = makeShaderChunk('01', 0.0, 1.0, 'easeCubicInOut', new THREE.Vector3(0, 10, 0), new THREE.Vector3(0, 2, 0));
  var animationStep02 = makeShaderChunk('02', 1.0, 1.0, 'easeCubicInOut', new THREE.Vector3(0, -10, 0), new THREE.Vector3(0, -2, 0));


  var material = new THREE.BAS.StandardAnimationMaterial({
    shading: THREE.FlatShading,
    uniforms: {
      uTime: {value: 0}
    },
    uniformValues: {
    },
    vertexFunctions: [
      THREE.BAS.ShaderChunk['ease_cubic_in_out'],

      animationStep01,
      animationStep02
    ],
    vertexParameters: [
      'uniform float uTime;',

      //'attribute vec3 aPosition;',
      'attribute vec2 aDelayDuration;'
    ],
    vertexPosition: [
      'float tTime = clamp(uTime - aDelayDuration.x, 0.0, aDelayDuration.y);',

      'transformed += applyTransform01(tTime, position);',
      'transformed += applyTransform02(tTime, position);'

    ]
  });

  THREE.Mesh.call(this, geometry, material);

  this.frustumCulled = false;
}
Animation.prototype = Object.create(THREE.Mesh.prototype);
Animation.prototype.constructor = Animation;

Object.defineProperty(Animation.prototype, 'time', {
  get: function () {
    return this.material.uniforms['uTime'].value;
  },
  set: function (v) {
    this.material.uniforms['uTime'].value = v;
  }
});

Animation.prototype.animate = function (duration, options) {
  options = options || {};
  options.time = this.totalDuration;

  return TweenMax.fromTo(this, duration, {time: 0.0}, options);
};
