window.onload = init;

function init() {
  var root = new THREERoot();
  root.renderer.setClearColor(0x000000);
  root.camera.position.set(8, 6, 4);

  var light = new THREE.DirectionalLight(0xffffff, 1.0);
  light.position.set(0, 1, 0);
  root.add(light);
  root.addUpdateCallback(function() {
    light.position.copy(root.camera.position).normalize();
  });

  var gridSize = 10;

  var gridHelper = new THREE.GridHelper(gridSize * 0.5, 1, 0x222222, 0x444444);
  root.add(gridHelper);

  var animation = new Animation(gridSize);
  animation.animate(animation.totalDuration, {repeat:-1, repeatDelay: 0.0, ease:Power0.easeNone}).timeScale(2.0);
  root.add(animation);
}

////////////////////
// CLASSES
////////////////////

function Animation(gridSize) {
  var prefabSize = 0.5;
  var prefab = new THREE.BoxGeometry(prefabSize, prefabSize, prefabSize);

  prefab.translate(0, prefabSize * 0.5, 0);

  var prefabCount = gridSize * gridSize;

  var geometry = new THREE.BAS.PrefabBufferGeometry(prefab, prefabCount);

  var aPosition = geometry.createAttribute('aPosition', 3);
  var aDelayDuration = geometry.createAttribute('aDelayDuration', 2);
  var index = 0;

  var maxDelay = 4.0;
  var maxDuration = 5.5;

  this.totalDuration = maxDuration + maxDelay;

  for (var i = 0; i < gridSize; i++) {
    for (var j = 0; j < gridSize; j++) {
      var x = THREE.Math.mapLinear(i, 0, gridSize, -gridSize * 0.5, gridSize * 0.5) + 0.5;
      var y = THREE.Math.mapLinear(j, 0, gridSize, -gridSize * 0.5, gridSize * 0.5) + 0.5;

      geometry.setPrefabData(aPosition, index, [x, 0, y]);

      //var delay = maxDelay * index / prefabCount;
      var delay = maxDelay * Math.sqrt(x * x + y * y) / gridSize;
      //var delay = maxDelay * Math.random();
      var duration = maxDuration;

      geometry.setPrefabData(aDelayDuration, index, [delay, duration]);

      index++;
    }
  }

  function vecToString(v, p) {
    return v.x.toPrecision(p) + ',' + v.y.toPrecision(p) + ',' + v.z.toPrecision(p);
  }

  function makeShaderChunk(key, delay, duration, ease, translateFrom, translateTo, scaleFrom, scaleTo) {
    var tf = 'vec3(' + vecToString(translateFrom, 2) + ')';
    var tt = 'vec3(' + vecToString(translateTo, 2) + ')';
    var sf = 'vec3(' + vecToString(scaleFrom, 2) + ')';
    var st = 'vec3(' + vecToString(scaleTo, 2) + ')';

    return [
      'float cDelay' + key + ' = ' + delay.toPrecision(2) + ';',
      'float cDuration' + key + ' = ' + duration.toPrecision(2) + ';',
      'vec3 cTranslateFrom' + key + ' = ' + tf + ';',
      'vec3 cTranslateTo' + key + ' = ' + tt + ';',
      'vec3 cScaleFrom' + key + ' = ' + sf + ';',
      'vec3 cScaleTo' + key + ' = ' + st + ';',

      'void applyScale' + key + '(float time, inout vec3 v) {',
        'if (time < cDelay' + key + ' || time > (cDelay' + key + ' + cDuration' + key + ')) return;',

        'float progress = clamp(time - cDelay' + key + ', 0.0, cDuration' + key + ') / cDuration' + key + ';',
        'progress = ' + ease + '(progress);',

        'v *= mix(cScaleFrom' + key + ', cScaleTo' + key + ', progress);',
      '}',

      'void applyTranslation' + key + '(float time, inout vec3 v) {',
        'if (time < cDelay' + key + ' || time > (cDelay' + key + ' + cDuration' + key + ')) return;',

        'float progress = clamp(time - cDelay' + key + ', 0.0, cDuration' + key + ') / cDuration' + key + ';',
        'progress = ' + ease + '(progress);',

        'v += mix(cTranslateFrom' + key + ', cTranslateTo' + key + ', progress);',
      '}'
    ].join('\n');
  }

  var animationSteps = [];

  // scale down
  animationSteps.push(makeShaderChunk('0', 0.0, 1.0, 'easeCubicOut',
    new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(1.0, 1.0, 1.0), new THREE.Vector3(1.4, 0.4, 1.4)
  ));

  // scale up
  animationSteps.push(makeShaderChunk('1', 1.0, 0.5, 'easeCubicIn',
    new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(1.4, 0.4, 1.4), new THREE.Vector3(0.8, 2.0, 0.8)
  ));

  // move up
  animationSteps.push(makeShaderChunk('2', 1.5, 1.0, 'easeCubicOut',
    new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 4, 0),
    new THREE.Vector3(0.8, 2.0, 0.8), new THREE.Vector3(0.8, 2.0, 0.8)
  ));

  // move down
  animationSteps.push(makeShaderChunk('3', 2.5, 1.0, 'easeCubicIn',
    new THREE.Vector3(0, 4, 0), new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.8, 2.0, 0.8), new THREE.Vector3(0.8, 2.0, 0.8)
  ));

  // land + squish
  animationSteps.push(makeShaderChunk('4', 3.5, 1.0, 'easeCubicOut',
    new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.8, 2.0, 0.8), new THREE.Vector3(1.4, 0.4, 1.4)
  ));

  // un-squish
  animationSteps.push(makeShaderChunk('5', 4.5, 1.0, 'easeBackOut',
    new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(1.4, 0.4, 1.4), new THREE.Vector3(1.0, 1.0, 1.0)
  ));

  var vertexFunctions = [
    THREE.BAS.ShaderChunk['ease_cubic_in'],
    THREE.BAS.ShaderChunk['ease_cubic_out'],
    THREE.BAS.ShaderChunk['ease_cubic_in_out'],
    THREE.BAS.ShaderChunk['ease_back_out'],
  ].concat(animationSteps);

  var scaleCalls = animationSteps.map(function(v, i) {
    return 'applyScale' + i + '(tTime, transformed);';
  }).join('\n');

  var translateCalls = animationSteps.map(function(v, i) {
    return 'applyTranslation' + i + '(tTime, transformed);';
  }).join('\n');

  var material = new THREE.BAS.StandardAnimationMaterial({
    shading: THREE.FlatShading,
    uniforms: {
      uTime: {value: 0}
    },
    uniformValues: {
      diffuse: new THREE.Color(0x888888)
    },
    vertexFunctions: vertexFunctions,
    vertexParameters: [
      'uniform float uTime;',

      'attribute vec3 aPosition;',
      'attribute vec2 aDelayDuration;'
    ],
    vertexPosition: [
      'float tTime = clamp(uTime - aDelayDuration.x, 0.0, aDelayDuration.y);',

      scaleCalls,
      translateCalls,

      'transformed += aPosition;'
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
