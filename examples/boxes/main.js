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

    tween = animation.animate({repeat:-1, repeatDelay: 0.0, ease:Power0.easeNone}).timeScale(2);
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
    //translate: {
    //  to: new THREE.Vector3(1, 0, 0)
    //},
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

  this.scaleSegments = [];
  this.translationSegments = [];
}

Timeline.prototype.append = function(duration, params) {
  var delay = this.totalDuration;

  if (params.scale) {
    this._processScale(delay, duration, params);
  }

  if (params.translate) {
    this._processTranslation(delay, duration, params);
  }

  this.totalDuration += duration;
};

Timeline.prototype._processScale = function(delay, duration, params) {
  if (!params.scale.from) {
    if (this.scaleSegments.length === 0) {
      params.scale.from = new THREE.Vector3(1.0, 1.0, 1.0);
    }
    else {
      params.scale.from = this.scaleSegments[this.scaleSegments.length - 1].scale.to;
    }
  }

  this._pad(this.scaleSegments);

  this.scaleSegments.push(new ScaleSegment(
    this._getKey(),
    delay,
    duration,
    params.ease,
    params.scale
  ));
};

Timeline.prototype._processTranslation = function(delay, duration, params) {
  if (!params.translate.from) {
    if (this.translationSegments.length === 0) {
      params.translate.from = new THREE.Vector3(0.0, 0.0, 0.0);
    }
    else {
      params.translate.from = this.translationSegments[this.translationSegments.length - 1].translation.to;
    }
  }

  this._pad(this.translationSegments);

  this.translationSegments.push(new TranslationSegment(
    this._getKey(),
    delay,
    duration,
    params.ease,
    params.translate
  ));
};

Timeline.prototype.compile = function() {
  var c = [];

  this._pad(this.scaleSegments);
  this._pad(this.translationSegments);

  this.scaleSegments.forEach(function(s) {
    c.push(s.compile());
  });

  this.translationSegments.forEach(function(s) {
    c.push(s.compile());
  });

  return c;
};
Timeline.prototype._pad = function(segments) {
  if (segments.length === 0) return;

  var last = segments[segments.length - 1];

  if (last.end < this.totalDuration) {
    last.trail = this.totalDuration - last.end;
  }
};
Timeline.prototype._getKey = function() {
  return (this.__key++).toString();
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
  vec3: function(n, v, p) {
    return 'vec3 ' + n + ' = vec3(' + v.x.toPrecision(p) + ',' + v.y.toPrecision(p) + ',' + v.z.toPrecision(p) + ');';
  },
  delayDuration: function(key, delay, duration) {
    return [
      'float cDelay' + key + ' = ' + delay.toPrecision(4) + ';',
      'float cDuration' + key + ' = ' + duration.toPrecision(4) + ';'
    ].join('\n');
  },
  progress: function(key, ease) {
    return [
      'float progress = clamp(time - cDelay' + key + ', 0.0, cDuration' + key + ') / cDuration' + key + ';',
      'progress = ' + ease + '(progress);'
    ].join('\n');
  },
  renderCheck: function(segment) {
    var startTime = segment.delay.toPrecision(4);
    var endTime = (segment.end + segment.trail).toPrecision(4);

    return 'if (time < ' + startTime + ' || time > ' + endTime + ') return;';
  }
};

function ScaleSegment(key, delay, duration, ease, scale) {
  this.key = key;
  this.delay = delay;
  this.duration = duration;
  this.ease = ease;
  this.scale = scale;
  this.trail = 0;
}
ScaleSegment.prototype.compile = function() {
  return [
    TimelineUtils.delayDuration(this.key, this.delay, this.duration),
    TimelineUtils.vec3('cScaleFrom' + this.key, this.scale.from, 2),
    TimelineUtils.vec3('cScaleTo' + this.key, this.scale.to, 2),

    'void applyScale' + this.key + '(float time, inout vec3 v) {',

    TimelineUtils.renderCheck(this),
    TimelineUtils.progress(this.key, this.ease),

    'v *= mix(cScaleFrom' + this.key + ', cScaleTo' + this.key + ', progress);',
    '}'
  ].join('\n');
};
Object.defineProperty(ScaleSegment.prototype, 'end', {
  get: function() {
    return this.delay + this.duration;
  }
});

function TranslationSegment(key, delay, duration, ease, translation) {
  this.key = key;
  this.delay = delay;
  this.duration = duration;
  this.ease = ease;
  this.translation = translation;
  this.trail = 0;
}
TranslationSegment.prototype.compile = function() {
  return [
    TimelineUtils.delayDuration(this.key, this.delay, this.duration),
    TimelineUtils.vec3('cTranslateFrom' + this.key, this.translation.from, 2),
    TimelineUtils.vec3('cTranslateTo' + this.key, this.translation.to, 2),

    'void applyTranslation' + this.key + '(float time, inout vec3 v) {',

    TimelineUtils.renderCheck(this),
    TimelineUtils.progress(this.key, this.ease),

    'v += mix(cTranslateFrom' + this.key + ', cTranslateTo' + this.key + ', progress);',
    '}'
  ].join('\n');
};
Object.defineProperty(TranslationSegment.prototype, 'end', {
  get: function() {
    return this.delay + this.duration;
  }
});
