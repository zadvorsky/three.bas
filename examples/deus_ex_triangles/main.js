window.onload = init;

function init() {
  var root = new THREERoot({
    createCameraControls: true,
    antialias: (window.devicePixelRatio === 1),
    fov: 60
  });
  root.renderer.setClearColor(0x222222);
  root.camera.position.set(0, -36, 90);

  var light = new THREE.DirectionalLight(0xffffff);
  light.position.set(0, 0, 1);
  root.add(light);

  var vertices = [], indices, i, j;

  // 1. generate random points in grid formation with some noise
  var noise = 6;
  var rangeX = 200;
  var rangeY = 120;
  var totalRangeX = rangeX + noise * 2;
  var totalRangeY = rangeY + noise * 2;
  var stepsX = 20;
  var stepsY = 12;

  for (i = 0; i <= stepsX; i++) {
    for (j = 0; j <= stepsY; j++) {
      var x = THREE.Math.mapLinear(i, 0, stepsX, -rangeX * 0.5, rangeX * 0.5) + (THREE.Math.randFloatSpread(noise));
      var y = THREE.Math.mapLinear(j, 0, stepsY, -rangeY * 0.5, rangeY * 0.5) + (THREE.Math.randFloatSpread(noise));

      vertices.push([x, y]);
    }
  }

  // 2. generate indices
  indices = Delaunay.triangulate(vertices);

  // 3. create displacement splines
  var pointsX = [];
  var pointsY = [];
  var spreadZX = 16;
  var spreadZY = 8;
  var segments = 12;

  for (i = 0; i <= segments; i++) {
    pointsX.push(new THREE.Vector3(
      THREE.Math.mapLinear(i, 0, segments, -totalRangeX * 0.5, totalRangeX * 0.5),
      0,
      THREE.Math.randFloatSpread(spreadZX)
    ));

    pointsY.push(new THREE.Vector3(
      0,
      THREE.Math.mapLinear(i, 0, segments, -totalRangeY * 0.5, totalRangeY * 0.5),
      THREE.Math.randFloatSpread(spreadZY)
    ));
  }

  var splineX = new THREE.CatmullRomCurve3(pointsX);
  var splineY = new THREE.CatmullRomCurve3(pointsY);

  // line geometries for testing
  //var g, m;
  //g = new THREE.Geometry();
  //g.vertices = splineX.getPoints(50);
  //m = new THREE.LineBasicMaterial({color: 0xff0000});
  //root.add(new THREE.Line(g, m));
  //g = new THREE.Geometry();
  //g.vertices = splineY.getPoints(50);
  //m = new THREE.LineBasicMaterial({color: 0x00ff00});
  //root.add(new THREE.Line(g, m));

  // 4. generate geometry (maybe find a cheaper way to do this)
  var geometry = new THREE.Geometry();
  var shapeScale = 0.98;

  for (i = 0; i < indices.length; i += 3) {
    // build the face
    var v0 = vertices[indices[i]];
    var v1 = vertices[indices[i + 1]];
    var v2 = vertices[indices[i + 2]];

    // calculate centroid
    var cx = (v0[0] + v1[0] + v2[0]) / 3;
    var cy = (v0[1] + v1[1] + v2[1]) / 3;

    // translate, scale, un-translate
    v0 = [(v0[0] - cx) * shapeScale + cx, (v0[1] - cy) * shapeScale + cy];
    v1 = [(v1[0] - cx) * shapeScale + cx, (v1[1] - cy) * shapeScale + cy];
    v2 = [(v2[0] - cx) * shapeScale + cx, (v2[1] - cy) * shapeScale + cy];

    // draw the face to a shape
    var shape = new THREE.Shape();
    shape.moveTo(v0[0], v0[1]);
    shape.lineTo(v1[0], v1[1]);
    shape.lineTo(v2[0], v2[1]);

    // use the shape to create a geometry
    var shapeGeometry = new THREE.ExtrudeGeometry(shape, {
      amount: 20,
      bevelEnabled: false
    });

    // offset z vector components based on the two splines
    for (j = 0; j < shapeGeometry.vertices.length; j++) {
      var v = shapeGeometry.vertices[j];
      v.z += splineX.getPointAt(THREE.Math.mapLinear(v.x, -totalRangeX * 0.5, totalRangeX * 0.5, 0.0, 1.0)).z;
      v.z += splineY.getPointAt(THREE.Math.mapLinear(v.y, -totalRangeY * 0.5, totalRangeY * 0.5, 0.0, 1.0)).z;
    }

    // merge into the whole
    geometry.merge(shapeGeometry);
  }

  // 5. feed the geometry to the animation
  var animation = new Animation(geometry);
  root.add(animation);
  root.addUpdateCallback(function() {
    animation.time += (1/240);
  });

  // init post processing
  var filmPass = new THREE.ShaderPass(THREE.FilmNoiseShader);

  filmPass.uniforms.intensity.value = 0.5;

  root.initPostProcessing([
    filmPass
  ]);
  root.addUpdateCallback(function() {
    filmPass.uniforms.time.value += (1/60);
  });
}

////////////////////
// CLASSES
////////////////////

function Animation(modelGeometry) {
  var geometry = new THREE.BAS.ModelBufferGeometry(modelGeometry);

  var aOffsetAmplitude = geometry.createAttribute('aOffsetAmplitude', 2);
  var positionBuffer = geometry.getAttribute('position').array;
  var x, y;

  for (var i = 0; i < aOffsetAmplitude.array.length; i+=2) {
    // x/y position of the corresponding vertex from the position buffer
    x = positionBuffer[i / 2 * 3];
    y = positionBuffer[i / 2 * 3 + 1];

    var offsetX = x * 0.5;
    var offsetY = y * 0.25;

    aOffsetAmplitude.array[i]     = offsetX + offsetY;
    aOffsetAmplitude.array[i + 1] = THREE.Math.randFloat(1.0, 2.0);
  }

  var material = new THREE.BAS.StandardAnimationMaterial({
    shading: THREE.FlatShading,
    uniforms: {
      uTime: {type: 'f', value: 0},
    },
    vertexFunctions: [
      THREE.BAS.ShaderChunk['ease_cubic_in_out']
    ],
    vertexParameters: [
      'uniform float uTime;',
      'attribute vec2 aOffsetAmplitude;',
    ],
    vertexPosition: [
      //'transformed += mix(aStartPosition, aDelta, tProgress);'
      'float tProgress = sin(uTime + aOffsetAmplitude.x);',
      'tProgress = easeCubicInOut(tProgress);',

      'transformed.z += aOffsetAmplitude.y * tProgress;'
    ]
  }, {
    diffuse: 0x101010,
    roughness: 0.55,
    metalness: 0.4
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
