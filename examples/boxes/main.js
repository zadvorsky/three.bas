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
  var index = 3;

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
      root.remove(animation);
      animation.material.dispose();
      animation.geometry.dispose();
    }

    gridHelper = new THREE.GridHelper(gridSize * 0.5, 1, 0x222222, 0x444444);
    root.add(gridHelper);

    animation = new Animation(gridSize);
    root.add(animation);

    tween = animation.animate({repeat:-1, repeatDelay: 0.0, ease:Power0.easeNone}).timeScale(1);
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
  var timeline = new Timeline();

  // scale down
  timeline.append(1.0, {
    scale: {
      to: new THREE.Vector3(1.4, 0.4, 1.4)
    },
    ease: 'easeCubicOut'
  });
  // scale up
  timeline.append(0.5, {
    scale: {
      to: new THREE.Vector3(0.4, 3.0, 0.4)
    },
    ease: 'easeCubicIn'
  });
  // move up
  timeline.append(1.0, {
    translate: {
      to: new THREE.Vector3(0.0, 6.0, 0.0)
    },
    ease: 'easeCubicOut'
  });
  // move down
  timeline.append(0.5, {
    translate: {
      to: new THREE.Vector3(0.0, 0.0, 0.0)
    },
    ease: 'easeCubicIn'
  });
  // land + squish
  timeline.append(0.5, {
    scale: {
      to: new THREE.Vector3(1.4, 0.4, 1.4)
    },
    ease: 'easeCubicOut'
  });
  // un-squish
  timeline.append(1.5, {
    scale: {
      to: new THREE.Vector3(1.0, 1.0, 1.0)
    },
    ease: 'easeBackOut'
  });

  // setup prefab
  var prefabSize = 0.5;
  var prefab = new THREE.BoxGeometry(prefabSize, prefabSize, prefabSize);
  prefab.translate(0, prefabSize * 0.5, 0);

  // setup prefab geometry
  var prefabCount = gridSize * gridSize;
  var geometry = new THREE.BAS.PrefabBufferGeometry(prefab, prefabCount);

  var aPosition = geometry.createAttribute('aPosition', 3);
  var aDelayDuration = geometry.createAttribute('aDelayDuration', 2);
  var index = 0;
  var dataArray = [];
  var maxDelay = 4.0;

  this.totalDuration = timeline.totalDuration + maxDelay;

  for (var i = 0; i < gridSize; i++) {
    for (var j = 0; j < gridSize; j++) {
      var x = THREE.Math.mapLinear(i, 0, gridSize, -gridSize * 0.5, gridSize * 0.5) + 0.5;
      var y = THREE.Math.mapLinear(j, 0, gridSize, -gridSize * 0.5, gridSize * 0.5) + 0.5;

      // position
      dataArray[0] = x;
      dataArray[1] = 0;
      dataArray[2] = y;
      geometry.setPrefabData(aPosition, index, dataArray);

      // animation
      dataArray[0] = maxDelay * Math.sqrt(x * x + y * y) / gridSize;
      dataArray[1] = timeline.totalDuration;
      geometry.setPrefabData(aDelayDuration, index, dataArray);

      index++;
    }
  }

  var material = new THREE.BAS.StandardAnimationMaterial({
    shading: THREE.FlatShading,
    uniforms: {
      uTime: {value: 0}
    },
    uniformValues: {
      diffuse: new THREE.Color(0x888888),
      metalness: 1.0,
      roughness: 1.0
    },
    vertexFunctions: [
      // the eases used by the timeline defined above
      THREE.BAS.ShaderChunk['ease_cubic_in'],
      THREE.BAS.ShaderChunk['ease_cubic_out'],
      THREE.BAS.ShaderChunk['ease_cubic_in_out'],
      THREE.BAS.ShaderChunk['ease_back_out'],
      // getChunks outputs the shader chunks where the animation is baked into
    ].concat(timeline.getChunks()),
    vertexParameters: [
      'uniform float uTime;',

      'attribute vec3 aPosition;',
      'attribute vec2 aDelayDuration;'
    ],
    vertexPosition: [
      // calculate animation time for the prefab
      'float tTime = clamp(uTime - aDelayDuration.x, 0.0, aDelayDuration.y);',

      // apply timeline transformations based on 'tTime'
      timeline.getScaleCalls(),
      timeline.getTranslateCalls(),

      // translate the vertex by prefab position
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

Animation.prototype.animate = function (options) {
  options = options || {};
  options.time = this.totalDuration;

  return TweenMax.fromTo(this, this.totalDuration, {time: 0.0}, options);
};

function Timeline() {
  this.totalDuration = 0;
  this.__key = 0;
  //this.segments = [];

  this.scaleSegments = [];
  //this.rotationSegments = [];
  this.translationSegments = [];
}

Timeline.prototype.append = function(duration, params) {
  //var key = this.segments.length.toString();
  var delay = this.totalDuration;

  this.totalDuration += duration;

  // scale

  if (params.scale) {
    if (!params.scale.from) {
      if (this.scaleSegments.length === 0) {
        params.scale.from = new THREE.Vector3(1.0, 1.0, 1.0);
      }
      else {
        params.scale.from = this.scaleSegments[this.scaleSegments.length - 1].scale.to;
      }
      // maybe?
      //if (!params.scale.to) {
      //  if (this.segments.length === 0) {
      //    params.scale.to = new THREE.Vector3(1.0, 1.0, 1.0);
      //  }
      //  else {
      //    params.scale.to = this.segments[this.segments.length - 1].scale.to;
      //  }
      //}
    }

    this.scaleSegments.push(new ScaleSegment(
      (this.__key++).toString(),
      delay,
      duration,
      params.ease,
      params.scale
    ));
  }

  //params.scale = params.scale || {};
  //
  //if (!params.scale.from) {
  //  if (this.segments.length === 0) {
  //    params.scale.from = new THREE.Vector3(1.0, 1.0, 1.0);
  //  }
  //  else {
  //    params.scale.from = this.segments[this.segments.length - 1].scale.to;
  //  }
  //}
  //
  //if (!params.scale.to) {
  //  if (this.segments.length === 0) {
  //    params.scale.to = new THREE.Vector3(1.0, 1.0, 1.0);
  //  }
  //  else {
  //    params.scale.to = this.segments[this.segments.length - 1].scale.to;
  //  }
  //}

  // translation

  if (params.translate) {
    if (!params.translate.from) {
      if (this.translationSegments.length === 0) {
        params.translate.from = new THREE.Vector3(0.0, 0.0, 0.0);
      }
      else {
        params.translate.from = this.translationSegments[this.translationSegments.length - 1].translation.to;
      }
    }

    this.translationSegments.push(new TranslationSegment(
      (this.__key++).toString(),
      delay,
      duration,
      params.ease,
      params.translate
    ));
  }

  //params.translate = params.translate || {};
  //
  //if (!params.translate.from) {
  //  if (this.segments.length === 0) {
  //    params.translate.from = new THREE.Vector3(0.0, 0.0, 0.0);
  //  }
  //  else {
  //    params.translate.from = this.segments[this.segments.length - 1].translate.to;
  //  }
  //}
  //
  //if (!params.translate.to) {
  //  if (this.segments.length === 0) {
  //    params.translate.to = new THREE.Vector3(0.0, 0.0, 0.0);
  //  }
  //  else {
  //    params.translate.to = this.segments[this.segments.length - 1].translate.to;
  //  }
  //}
  //
  //var segment = new Segment(
  //  key,
  //  delay,
  //  duration,
  //  params.ease,
  //  params.translate,
  //  params.scale
  //);
  //
  //this.segments.push(segment);
};
Timeline.prototype.getChunks = function() {
  var c = [];

  this.scaleSegments.forEach(function(s) {
    c.push(s.chunk);
  });

  this.translationSegments.forEach(function(s) {
    c.push(s.chunk);
  });

  return c;
};
Timeline.prototype.getScaleCalls = function() {
  return this.scaleSegments.map(function(s) {
    return 'applyScale' + s.key + '(tTime, transformed);';
  }).join('\n');
};
Timeline.prototype.getTranslateCalls = function() {
  return this.translationSegments.map(function(s) {
    return 'applyTranslation' + s.key + '(tTime, transformed);';
  }).join('\n');
};


var TimelineUtils = {
  vec3ToConst: function(n, v, p) {
    return 'vec3 ' + n + ' = vec3(' + v.x.toPrecision(p) + ',' + v.y.toPrecision(p) + ',' + v.z.toPrecision(p) + ');';
  },
  delayDuration: function(key, delay, duration) {
    return [
      'float cDelay' + key + ' = ' + delay.toPrecision(2) + ';',
      'float cDuration' + key + ' = ' + duration.toPrecision(2) + ';'
    ].join('\n');
  }
};


function ScaleSegment(key, delay, duration, ease, scale) {
  this.key = key;
  this.delay = delay;
  this.duration = duration;
  this.ease = ease;
  this.scale = scale;

  this.chunk = [
    TimelineUtils.delayDuration(key, delay, duration),
    TimelineUtils.vec3ToConst('cScaleFrom' + key, scale.from, 2),
    TimelineUtils.vec3ToConst('cScaleTo' + key, scale.to, 2),

    'void applyScale' + key + '(float time, inout vec3 v) {',
    ' if (time < cDelay' + key + ' || time > (cDelay' + key + ' + cDuration' + key + ')) return;',
    //' if (time < cDelay' + key + ') return;',

    ' float progress = clamp(time - cDelay' + key + ', 0.0, cDuration' + key + ') / cDuration' + key + ';',
    ' progress = ' + ease + '(progress);',

    ' v *= mix(cScaleFrom' + key + ', cScaleTo' + key + ', progress);',
    '}'
  ].join('\n');
}

function TranslationSegment(key, delay, duration, ease, translation) {
  this.key = key;
  this.delay = delay;
  this.duration = duration;
  this.ease = ease;
  this.translation = translation;

  this.chunk = [
    TimelineUtils.delayDuration(key, delay, duration),
    TimelineUtils.vec3ToConst('cTranslateFrom' + key, translation.from, 2),
    TimelineUtils.vec3ToConst('cTranslateTo' + key, translation.to, 2),

    'void applyTranslation' + key + '(float time, inout vec3 v) {',
    ' if (time < cDelay' + key + ' || time > (cDelay' + key + ' + cDuration' + key + ')) return;',
    //' if (time < cDelay' + key + ') return;',

    ' float progress = clamp(time - cDelay' + key + ', 0.0, cDuration' + key + ') / cDuration' + key + ';',
    ' progress = ' + ease + '(progress);',

    ' v += mix(cTranslateFrom' + key + ', cTranslateTo' + key + ', progress);',
    '}'
  ].join('\n');
}





function Segment(key, delay, duration, ease, translate, scale) {
  this.key = key;
  this.delay = delay;
  this.duration = duration;
  this.ease = ease;
  this.translate = translate;
  this.scale = scale;

  function vecToString(v, p) {
    return v.x.toPrecision(p) + ',' + v.y.toPrecision(p) + ',' + v.z.toPrecision(p);
  }

  var tf = 'vec3(' + vecToString(translate.from, 2) + ')';
  var tt = 'vec3(' + vecToString(translate.to, 2) + ')';
  var sf = 'vec3(' + vecToString(scale.from, 2) + ')';
  var st = 'vec3(' + vecToString(scale.to, 2) + ')';

  // this is where the magic happens, but the magic still needs a lot of work
  this.chunk = [
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
