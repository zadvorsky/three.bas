window.onload = init;

function init() {
  var root = new THREERoot();
  root.renderer.setClearColor(0x542437);
  root.camera.position.set(0, 600, -6000);

  root.controls.autoRotate = true;

  //root.add(new THREE.AxisHelper(1000));

  var centerLight = new THREE.PointLight(0xECD078);
  centerLight.position.set(0, 0, 0);
  root.add(centerLight);

  var light = new THREE.DirectionalLight(0xD95B43, 1);
  light.position.set(0, 1, 0);
  root.add(light);

  light = new THREE.DirectionalLight(0xC02942, 1);
  light.position.set(0, -1, 0);
  root.add(light);

  var pointCount = 16;
  var points = [];
  var radius = 800;
  var x, y, z, pivotDistance;

  for (var i = 0; i < pointCount; i++) {
    var angle = Math.PI * 2 * i / pointCount;
    var r = radius * THREE.Math.randFloat(0.1, 1.0);

    x = Math.cos(angle) * r;
    y = THREE.Math.randFloat(32, 64) * (i % 2 ? 1 : -1);
    z = Math.sin(angle) * r;

    pivotDistance = 1;

    points.push(new THREE.Vector4(x, y, z, pivotDistance));
  }

  var animation = new Animation(points);
  animation.animate(24.0, {ease: Power0.easeInOut, repeat:-1});
  root.add(animation);

  // audio
  var audio = document.createElement('audio');
  audio.src = 'song.mp3';
  audio.loop = true;
  audio.play();

  var analyzer = new SpectrumAnalyzer(pointCount, 0.94);
  analyzer.setSource(audio);

  var frameArray = [];

  root.addUpdateCallback(function() {
    analyzer.updateSample();

    var spline = animation.material.uniforms['uPath'].value;
    var data = analyzer.frequencyByteData;
    var i;

    frameArray.length = 0;

    for (i = 0; i < data.length; i++) {
      frameArray.push(data[i]);
    }
    //for (i = data.length - 1; i >= 0; i--) {
    //  frameArray.push(data[i]);
    //}

    var avg = analyzer.getAverageFloat() * 4.0;
    var maxY = 400 * avg * avg;
    var maxW = 800 * avg * avg;

    centerLight.intensity = avg;

    for (i = 0; i < spline.length; i++) {
      var p = spline[i];

      //var angle = Math.PI * 2 * i / pointCount;
      //var r = 400 + frameArray[i] / 255 * 400;
      //p.x = Math.cos(angle) * r;
      //p.z = Math.sin(angle) * r;

      p.y = frameArray[i] / 255 * maxY * (i % 2 ? 1 : -1);
      p.w = frameArray[i] / 255 * maxW;
    }
  });

  // debug helpers / visuals
  //var debug = new THREE.Group();
  //
  //var curve = new THREE.CatmullRomCurve3(points.map(function(p) {
  //  return new THREE.Vector3(p.x, p.y, p.z);
  //}));
  //curve.type = 'catmullrom';
  //curve.closed = true;
  //curve.tension = 1.0;
  //
  //debug.add(new LineHelper(curve.getPoints(400), {
  //  color: 0xff0000,
  //  depthTest: false,
  //  depthWrite: false
  //}));
  //
  //points.forEach(function(p) {
  //  debug.add(new PointHelper(0xff0000, p.w, new THREE.Vector3(p.x, p.y, p.z)));
  //});
  //
  //root.add(debug);
  //debug.visible = false;
  //
  //window.addEventListener('keyup', function(e) {
  //  if (e.keyCode === 68) {
  //    debug.visible = !debug.visible;
  //    root.renderer.setClearColor(debug.visible ? 0x222222 : 0x00000);
  //  }
  //});
}

////////////////////
// CLASSES
////////////////////

function Animation(path) {
  var prefabGeometry = new THREE.PlaneGeometry(32.0, 1.0, 1, 8);
  //var prefabGeometry = new THREE.SphereGeometry(8.0, 4, 4);
  var prefabCount = 10000;
  var geometry = new THREE.BAS.PrefabBufferGeometry(prefabGeometry, prefabCount);

  // ANIMATION

  var totalDuration = this.totalDuration = 1.0;

  var aDelayDuration = geometry.createAttribute('aDelayDuration', 2);
  var offset = 0;

  for (var i = 0; i < prefabCount; i++) {
    var pDelay = i / prefabCount;

    for (var j = 0; j < geometry.prefabVertexCount; j++) {
      var vDelay = j * 0.00025;

      aDelayDuration.array[offset++] =  (pDelay * totalDuration + vDelay);
      aDelayDuration.array[offset++] =  totalDuration;
    }
  }

  // PIVOT SCALE

  geometry.createAttribute('aPivotScale', 1, function(data) {
    data[0] = Math.random() * 0.4 + 0.6;
    //data[0] = 1;
  });

  // ROTATION

  var axis = new THREE.Vector3();
  var angle = 0;

  geometry.createAttribute('aAxisAngle', 4, function(data, i, count) {
    axis.x = THREE.Math.randFloatSpread(2);
    axis.y = THREE.Math.randFloatSpread(2);
    axis.z = THREE.Math.randFloatSpread(2);
    axis.normalize();

    angle = Math.PI * 2 * THREE.Math.randInt(4, 8);

    data[0] = axis.x;
    data[1] = axis.y;
    data[2] = axis.z;
    data[3] = angle;
  });

  // COLOR

  //var color = new THREE.Color();
  //var h, s, l;
  //
  //geometry.createAttribute('color', 3, function(data, i, count) {
  //  h = i / count;
  //  s = THREE.Math.randFloat(0.8, 1.0);
  //  l = THREE.Math.randFloat(0.4, 0.6);
  //
  //  color.setHSL(h, s, l);
  //  color.toArray(data);
  //});

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
      //metalness: 1.0,
      //roughness: 0.0,
      //opacity: 0.8,
      emissive: new THREE.Color(0x542437)
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
      'attribute float aPivotScale;',
      'attribute vec4 aAxisAngle;',
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
      'ivec4 indices = getCatmullRomSplineIndicesClosed(PATH_MAX, pathProgress);',
      'vec4 p0 = uPath[indices[0]];',
      'vec4 p1 = uPath[indices[1]];',
      'vec4 p2 = uPath[indices[2]];',
      'vec4 p3 = uPath[indices[3]];',

      'float pathProgressFract = fract(pathProgress);',

      'vec3 tDelta = catmullRomSpline(p0.xyz, p1.xyz, p2.xyz, p3.xyz, pathProgressFract, uSmoothness);',
      //'vec4 tQuat = quatFromAxisAngle(aAxisAngle.xyz, aAxisAngle.w * tProgress);',
      'vec4 tQuat = quatFromAxisAngle(normalize(tDelta), aAxisAngle.w * tProgress);',

      'transformed += catmullRomSpline(p0.w, p1.w, p2.w, p3.w, pathProgressFract) * aPivotScale;',
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

function PointHelper(color, size, position) {
  THREE.Mesh.call(this,
    new THREE.SphereGeometry(size || 1.0, 8, 8),
    new THREE.MeshBasicMaterial({
      color: color || 0xff0000,
      wireframe: true,
      depthWrite: false,
      depthTest: false
    })
  );

  position && this.position.copy(position);
}
PointHelper.prototype = Object.create(THREE.Mesh.prototype);
PointHelper.prototype.constructor = PointHelper;

function LineHelper(points, params) {
  var g = new THREE.Geometry();
  var m = new THREE.LineBasicMaterial(params);

  g.vertices = points;

  THREE.Line.call(this, g, m);
}
LineHelper.prototype = Object.create(THREE.Line.prototype);
LineHelper.prototype.constructor = LineHelper;

function SpectrumAnalyzer(binCount, smoothingTimeConstant) {
  var Context = window["AudioContext"] || window["webkitAudioContext"];

  this.context = new Context();
  this.analyzerNode = this.context.createAnalyser();

  this.setBinCount(binCount);
  this.setSmoothingTimeConstant(smoothingTimeConstant);
}

SpectrumAnalyzer.prototype = {
  setSource: function (source) {
    //this.source = source;
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
  getAverage: function (index, count) {
    var total = 0;
    var start = index || 0;
    var end = start + (count || this.binCount);

    for (var i = start; i < end; i++) {
      total += this.frequencyByteData[i];
    }

    return total / (end - start);
  },
  getAverageFloat:function(index, count) {
    return this.getAverage(index, count) / 255;
  },

  updateSample: function () {
    this.analyzerNode.getByteFrequencyData(this.frequencyByteData);
    this.analyzerNode.getByteTimeDomainData(this.timeByteData);
  }
};
