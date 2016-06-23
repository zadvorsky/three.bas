// soundcloud api
var SC_ID = 'ba47209edc0a4c129a460a936fb4e9f2';
var TRACK_URL = 'https://soundcloud.com/longarms/starpower?in=longarms/sets/starpower';

SC.initialize({
  client_id: SC_ID
});

window.onload = init;

function init() {
  var root = new THREERoot({
    fov: 120,
    alpha: true
  });
  root.renderer.setClearColor(0x542437, 0);
  root.camera.position.set(0, 600, 0);

  //root.controls.autoRotate = true;

  var centerLight = new THREE.PointLight(0xffffff, 0, 600, 2);//0xECD078
  centerLight.position.set(0, 0, 0);
  root.add(centerLight);

  var light = new THREE.DirectionalLight(0xD95B43, 0.5);
  light.position.set(0, 1, 0);
  root.add(light);

  light = new THREE.DirectionalLight(0xC02942, 0.5);
  light.position.set(0, -1, 0);
  root.add(light);

  var pointCount = 32;
  var points = [];
  var radius = 300;
  var x, y, z, pivotDistance;

  for (var i = 0; i < pointCount; i++) {
    var angle = Math.PI * 2 * i / pointCount;
    var r = radius * THREE.Math.randFloat(0.5, 1.0);

    x = Math.cos(angle) * r;
    y = THREE.Math.randFloat(-64, 64);// * (i % 2 ? 1 : -1)
    z = Math.sin(angle) * r;

    pivotDistance = 1;

    points.push(new THREE.Vector4(x, y, z, pivotDistance));
  }

  var animation = new Animation(points);
  root.add(animation);

  var tween = animation.animate(12.0, {ease: Power0.easeInOut, repeat:-1});

  // audio

  var audioElement = document.getElementById('player');
  audioElement.crossOrigin = 'Anonymous';
  audioElement.loop = true;

  var analyzer = new SpectrumAnalyzer(pointCount, 0.75);
  analyzer.setSource(audioElement);

  SC.get('/resolve', {url: TRACK_URL}).then(function(data) {
    console.log('success?', data);

    if (typeof data.errors === 'undefined') {
      if (data.streamable) {
        audioElement.src = data.stream_url + '?client_id=' + SC_ID;
      }
      else {
        alert('This SoundCloud URL is not allowed to be streamed.');
      }
    }
    else {
      alert('SoundCloud error :(');
    }
  });

  root.addUpdateCallback(function() {
    analyzer.updateSample();

    var spline = animation.material.uniforms['uPath'].value;
    var data = analyzer.frequencyByteData;

    //var avg = analyzer.getAverageFloat();
    var avgLL = analyzer.getAverageFloat(0, 8);
    var avgML = analyzer.getAverageFloat(8, 16);
    var avgMH = analyzer.getAverageFloat(16, 24);
    var avgHH = analyzer.getAverageFloat(24, 32);

    console.log(avgLL, avgML, avgMH, avgHH);

    var maxY = 512 * avgLL * avgLL * avgLL;
    var maxW = 128 * avgML * avgML;

    centerLight.intensity = avgLL * avgLL * 2;

    tween.timeScale(avgLL);

    for (var i = 0; i < spline.length; i++) {
      var p = spline[i];

      p.y = data[i] / 255 * maxY * (i % 2 ? 1 : -1);
      p.w = data[i] / 255 * maxW + 100;
    }
  });
}

////////////////////
// CLASSES
////////////////////

function Animation(path) {
  var prefabGeometry = new THREE.PlaneGeometry(4, 1.0, 1, 8);
  var prefabCount = 10000;
  var geometry = new THREE.BAS.PrefabBufferGeometry(prefabGeometry, prefabCount);

  // ANIMATION

  var totalDuration = this.totalDuration = 1.0;

  var aDelayDuration = geometry.createAttribute('aDelayDuration', 2);
  var offset = 0;

  for (var i = 0; i < prefabCount; i++) {
    //var pDelay = i / prefabCount;
    //var pDelay = ease(Circ.easeInOut, i, 0, totalDuration, prefabCount);
    var pDelay = mapEase(Circ.easeOut, i, 0, prefabCount, 0, totalDuration * 0.9);

    for (var j = 0; j < geometry.prefabVertexCount; j++) {
      var vDelay = j * 0.00025;

      aDelayDuration.array[offset++] =  (pDelay + vDelay);
      aDelayDuration.array[offset++] =  totalDuration;
    }
  }

  // PIVOT

  geometry.createAttribute('aPivotRotation', 2, function(data) {
    data[0] = Math.random() * 0.4 + 0.6;
    data[1] = Math.PI * 2 * THREE.Math.randInt(8, 16);
  });

  // COLOR

  var color = new THREE.Color();
  var colors = [
    '#ECD078',
    '#D95B43',
    '#C02942',
    '#27111a',
    '#53777A'
  ];

  geometry.createAttribute('color', 3, function(data, i, count) {
    color.set(colors[i % colors.length]);
    color.toArray(data);
  });

  // STANDARD PROPS

  geometry.createAttribute('aRM', 2, function(data, i, count) {
    data[0] = Math.random(); // roughness
    data[1] = Math.random(); // metalness
  });

  var material = new THREE.BAS.StandardAnimationMaterial({
    shading: THREE.FlatShading,
    vertexColors: THREE.VertexColors,
    side: THREE.DoubleSide,
    //transparent: true,
    defines: {
      PATH_LENGTH: path.length,
      PATH_MAX: (path.length).toFixed(1)
    },
    uniforms: {
      uTime: {value: 0},
      uPath: {value: path},
      uSmoothness: {value: new THREE.Vector2().setScalar(0.5)}
    },
    uniformValues: {
      emissive: new THREE.Color(0x0e0609)//0x542437
    },
    vertexFunctions: [
      THREE.BAS.ShaderChunk['catmull_rom_spline'],
      THREE.BAS.ShaderChunk['quaternion_rotation']
    ],
    vertexParameters: [
      'uniform float uTime;',
      'uniform vec4 uPath[PATH_LENGTH];',
      'uniform vec2 uSmoothness;',

      'attribute vec2 aDelayDuration;',
      'attribute vec2 aPivotRotation;',
      'attribute vec2 aRM;'
    ],
    varyingParameters: [
      'varying vec2 vRM;'
    ],
    vertexInit: [
      'float tProgress = mod((uTime + aDelayDuration.x), aDelayDuration.y) / aDelayDuration.y;',

      'vRM = aRM;'
    ],
    vertexPosition: [
      'float pathProgress = tProgress * PATH_MAX;',
      'float pathProgressFract = fract(pathProgress);',

      'ivec4 indices = getCatmullRomSplineIndicesClosed(PATH_MAX, pathProgress);',
      'vec4 p0 = uPath[indices[0]];',
      'vec4 p1 = uPath[indices[1]];',
      'vec4 p2 = uPath[indices[2]];',
      'vec4 p3 = uPath[indices[3]];',

      'vec3 tDelta = catmullRomSpline(p0.xyz, p1.xyz, p2.xyz, p3.xyz, pathProgressFract, uSmoothness);',
      'vec4 tQuat = quatFromAxisAngle(normalize(tDelta), aPivotRotation.y * tProgress);',

      'transformed += catmullRomSpline(p0.w, p1.w, p2.w, p3.w, pathProgressFract) * aPivotRotation.x;',
      'transformed = rotateVector(tQuat, transformed);',
      'transformed += tDelta;'
    ],
    fragmentRoughness: [
      'roughnessFactor = vRM.x;'
    ],
    fragmentMetalness: [
      'metalnessFactor = vRM.y;'
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

function SpectrumAnalyzer(binCount, smoothingTimeConstant) {
  var Context = window["AudioContext"] || window["webkitAudioContext"];

  this.context = new Context();
  this.analyzerNode = this.context.createAnalyser();

  this.setBinCount(binCount);
  this.setSmoothingTimeConstant(smoothingTimeConstant);
}

SpectrumAnalyzer.prototype = {
  setSource: function (source) {
    this.source = this.context.createMediaElementSource(source);
    this.source.connect(this.analyzerNode);
    this.analyzerNode.connect(this.context.destination);
  },

  setBinCount: function (binCount) {
    this.binCount = binCount;
    this.analyzerNode.fftSize = binCount * 2;

    this.frequencyByteData = new Uint8Array(binCount); 	// frequency
    this.timeByteData = new Uint8Array(binCount);		// waveform
  },
  setSmoothingTimeConstant: function (smoothingTimeConstant) {
    this.analyzerNode.smoothingTimeConstant = smoothingTimeConstant;
  },
  // not save if out of bounds
  getAverage: function (start, end) {
    var total = 0;

    start = start || 0;
    end = end || this.binCount;

    for (var i = start; i < end; i++) {
      total += this.frequencyByteData[i];
    }

    return total / (end - start);
  },
  getAverageFloat:function(start, end) {
    return this.getAverage(start, end) / 255;
  },

  updateSample: function () {
    this.analyzerNode.getByteFrequencyData(this.frequencyByteData);
    this.analyzerNode.getByteTimeDomainData(this.timeByteData);
  }
};

// utils
function ease(e, t, b, c, d) {
  return b + e.getRatio(t / d) * c;
}

function mapEase(e, v, x1, y1, x2, y2) {
  var t = v;
  var b = x2;
  var c = y2 - x2;
  var d = y1 - x1;

  return ease(e, t, b, c, d);
}
