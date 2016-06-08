window.onload = init;

function init() {
  var root = new THREERoot({
    createCameraControls: true,
    antialias: (window.devicePixelRatio === 1),
    fov: 60
  });
  root.renderer.setClearColor(0x222222);
  root.camera.position.set(0, 0, 150);

  var light = new THREE.DirectionalLight(0xffffff);
  root.add(light);
  root.addUpdateCallback(function() {
    light.position.copy(root.camera.position);
  });

  // delaunay
  var i;
  var vertices = [], indices;

  // 1. generate random points in rect
  var planeRangeX = 100;
  var planeRangeY = 100;
  var pointCount = 100;

  for (i = 0; i < pointCount; i++) {
    vertices[i] = [
      THREE.Math.randFloatSpread(planeRangeX),
      THREE.Math.randFloatSpread(planeRangeY)
    ]
  }
  // 2. generate indices
  indices = Delaunay.triangulate(vertices);

  console.log('TRIANGLES', indices.length / 3);

  // 3. generate geometry
  var geometry = new THREE.Geometry();
  var shapeScale = 0.98;

  for (i = 0; i < indices.length; i += 3) {
    var v0 = vertices[indices[i]];
    var v1 = vertices[indices[i + 1]];
    var v2 = vertices[indices[i + 2]];

    var cx = (v0[0] + v1[0] + v2[0]) / 3;
    var cy = (v0[1] + v1[1] + v2[1]) / 3;

    v0 = scaleFromCenter(v0, cx, cy, shapeScale);
    v1 = scaleFromCenter(v1, cx, cy, shapeScale);
    v2 = scaleFromCenter(v2, cx, cy, shapeScale);

    var shape = new THREE.Shape();
    shape.moveTo(v0[0], v0[1]);
    shape.lineTo(v1[0], v1[1]);
    shape.lineTo(v2[0], v2[1]);

    var g = new THREE.ExtrudeGeometry(shape, {
      amount: 10,
      bevelEnabled: false
    });

    geometry.merge(g);
  }

  var animation = new Animation(geometry);
  root.add(animation);
  root.addUpdateCallback(function() {
    animation.time += (1/60);
  })
}

function scaleFromCenter(v, cx, cy, p) {
  return [(v[0] - cx) * p + cx, (v[1] - cy) * p + cy];
}

////////////////////
// CLASSES
////////////////////

function Animation(modelGeometry) {
  var geometry = new THREE.BAS.ModelBufferGeometry(modelGeometry);

  var i;

  var aDelta = geometry.createAttribute('aDelta', 3);

  for (i = 0; i < aDelta.array.length; i+=3) {
    aDelta.array[i]     = 0;
    aDelta.array[i + 1] = 0;
    aDelta.array[i + 2] = 4.0;
  }

  var aOffsetAmplitude = geometry.createAttribute('aOffsetAmplitude', 2);

  for (i = 0; i < aOffsetAmplitude.array.length; i+=2) {
    aOffsetAmplitude.array[i]     = Math.random();
    aOffsetAmplitude.array[i + 1] = Math.random();
  }

  var material = new THREE.BAS.StandardAnimationMaterial({
    shading: THREE.FlatShading,
    uniforms: {
      uTime: {type: 'f', value: 0},
    },
  //  vertexFunctions: [
  //    THREE.BAS.ShaderChunk['ease_bezier']
  //  ],
    vertexParameters: [
      'uniform float uTime;',
      //'uniform vec4 uBezierCurve;',
      'attribute vec2 aOffsetAmplitude;',
      //'attribute vec3 aStartPosition;',
      'attribute vec3 aDelta;'
    ],
    vertexInit: [
      'float tProgress = sin(uTime + aOffsetAmplitude.x) * aOffsetAmplitude.y;'
    ],
    vertexPosition: [
      //'transformed += mix(aStartPosition, aDelta, tProgress);'
      'transformed += aDelta * tProgress;'
    ]
  }, {
    diffuse: 0x333333,
    roughness: 0.0,
    //metalness: 1.0
  });

  geometry.computeVertexNormals();

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
