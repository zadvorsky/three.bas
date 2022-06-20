window.onload = init;

function init() {
  var root = new THREERoot({
    fov: 80,
    createCameraControls: false
  });
  root.renderer.setClearColor(0x666666);
  root.camera.position.set(0, 0, 60);

  var light = new THREE.DirectionalLight();
  light.position.set(0, 0, 1);
  root.scene.add(light);

  // width and height for the THREE.PlaneGeometry that will be used for the two slides
  var width = 100;
  var height = 60;

  // create 2 slides. One will transition in, the other will transition out. This will occur simultaneously.

  // slide 1 will be the transition out slide
  var slide = new Slide(width, height, 'out');
  root.scene.add(slide.mesh);
  new THREE.ImageLoader().load('winter.jpg', function(image) {
    slide.setImage(image);
  });

  // slide 2 will be the transition in slide
  var slide2 = new Slide(width, height, 'in');
  root.scene.add(slide2.mesh);
  new THREE.ImageLoader().load('spring.jpg', function(image) {
    slide2.setImage(image);
  });

  // create a timeline for the two transitions
  var tl = new TimelineMax({repeat:-1, repeatDelay:1.0, yoyo: true});

  tl.add(slide.transition(), 0);
  tl.add(slide2.transition(), 0);

  // scrub the timeline by moving the mouse or your finger
  new TweenScrubber(tl);
}

////////////////////
// CLASSES
////////////////////

function Slide(width, height, animationPhase) {
  // create a geometry that will be used by BAS.ModelBufferGeometry
  // its a plane with a bunch of segments
  var plane = new THREE.PlaneGeometry(width, height, width * 2, height * 2);
  plane = new THREE.Geometry().fromBufferGeometry(plane);
  // duplicate some vertices so that each face becomes a separate triangle.
  // this is the same as the THREE.ExplodeModifier
  BAS.Utils.separateFaces(plane);

  // create a ModelBufferGeometry based on the geometry created above
  // ModelBufferGeometry makes it easier to create animations based on faces of a geometry
  // it is similar to the PrefabBufferGeometry where the prefab is a face (triangle)
  var geometry = new BAS.ModelBufferGeometry(plane, {
    // setting this to true will store the vertex positions relative to the face they are in
    // this way it's easier to rotate and scale faces around their own center
    localizeFaces: true,
    // setting this to true will store a centroid for each face in an array
    computeCentroids: true
  });

  // buffer UVs so the textures are mapped correctly
  geometry.bufferUvs();

  var i, j, offset, centroid;

  // ANIMATION

  var aDelayDuration = geometry.createAttribute('aDelayDuration', 2);
  // these will be used to calculate the animation delay and duration for each face
  var minDuration = 0.8;
  var maxDuration = 1.2;
  var maxDelayX = 0.9;
  var maxDelayY = 0.125;
  var stretch = 0.11;

  this.totalDuration = maxDuration + maxDelayX + maxDelayY + stretch;

  for (i = 0, offset = 0; i < geometry.faceCount; i++) {
    centroid = geometry.centroids[i];

    var duration = THREE.MathUtils.randFloat(minDuration, maxDuration);
    // delay is based on the position of each face within the original plane geometry
    // because the faces are localized, this position is available in the centroids array
    var delayX = THREE.MathUtils.mapLinear(centroid.x, -width * 0.5, width * 0.5, 0.0, maxDelayX);
    var delayY;

    // create a different delayY mapping based on the animation phase (in or out)
    if (animationPhase === 'in') {
      delayY = THREE.MathUtils.mapLinear(Math.abs(centroid.y), 0, height * 0.5, 0.0, maxDelayY)
    }
    else {
      delayY = THREE.MathUtils.mapLinear(Math.abs(centroid.y), 0, height * 0.5, maxDelayY, 0.0)
    }

    // store the delay and duration FOR EACH VERTEX of the face
    for (j = 0; j < 3; j++) {
      // by giving each VERTEX a different delay value the face will be 'stretched' in time
      aDelayDuration.array[offset]     = delayX + delayY + (Math.random() * stretch * duration);
      aDelayDuration.array[offset + 1] = duration;

      offset += 2;
    }
  }

  // POSITIONS

  // the transitions will begin and end on the same position
  var aStartPosition = geometry.createAttribute('aStartPosition', 3, function(data, i) {
    geometry.centroids[i].toArray(data);
  });
  var aEndPosition = geometry.createAttribute('aEndPosition', 3, function(data, i) {
    geometry.centroids[i].toArray(data);
  });

  // CONTROL POINTS

  // each face will follow a bezier path
  // since all paths begin and end on the position (the centroid), the control points will determine how the animation looks
  var aControl0 = geometry.createAttribute('aControl0', 3);
  var aControl1 = geometry.createAttribute('aControl1', 3);

  var control0 = new THREE.Vector3();
  var control1 = new THREE.Vector3();
  var data = [];

  for (i = 0, offset = 0; i < geometry.faceCount; i++) {
    centroid = geometry.centroids[i];

    // the logic to determine the control points is completely arbitrary
    var signY = Math.sign(centroid.y);

    control0.x = THREE.MathUtils.randFloat(0.1, 0.3) * 50;
    control0.y = signY * THREE.MathUtils.randFloat(0.1, 0.3) * 70;
    control0.z = THREE.MathUtils.randFloatSpread(20);

    control1.x = THREE.MathUtils.randFloat(0.3, 0.6) * 50;
    control1.y = -signY * THREE.MathUtils.randFloat(0.3, 0.6) * 70;
    control1.z = THREE.MathUtils.randFloatSpread(20);

    if (animationPhase === 'in') {
      control0.subVectors(centroid, control0);
      control1.subVectors(centroid, control1);
    }
    else { // out
      control0.addVectors(centroid, control0);
      control1.addVectors(centroid, control1);
    }

    // store the control points per face
    // this is similar to THREE.PrefabBufferGeometry.setPrefabData
    geometry.setFaceData(aControl0, i, control0.toArray(data));
    geometry.setFaceData(aControl1, i, control1.toArray(data));
  }

  var texture = new THREE.Texture();
  texture.minFilter = THREE.NearestFilter;

  var material = new BAS.BasicAnimationMaterial({
    flatShading: true,
    side: THREE.DoubleSide,
    map: texture,
    uniforms: {
      uTime: {value: 0}
    },
    vertexFunctions: [
      BAS.ShaderChunk['cubic_bezier'],
      BAS.ShaderChunk['ease_cubic_in_out'],
      BAS.ShaderChunk['quaternion_rotation']
    ],
    vertexParameters: [
      'uniform float uTime;',
      'attribute vec2 aDelayDuration;',
      'attribute vec3 aStartPosition;',
      'attribute vec3 aControl0;',
      'attribute vec3 aControl1;',
      'attribute vec3 aEndPosition;'
    ],
    vertexInit: [
      'float tProgress = clamp(uTime - aDelayDuration.x, 0.0, aDelayDuration.y) / aDelayDuration.y;'
    ],
    vertexPosition: [
      // this scales each face
      // for the in animation, we want to go from 0.0 to 1.0
      // for the out animation, we want to go from 1.0 to 0.0
      (animationPhase === 'in' ? 'transformed *= tProgress;' : 'transformed *= 1.0 - tProgress;'),
      // translation based on the bezier curve defined by the attributes
      'transformed += cubicBezier(aStartPosition, aControl0, aControl1, aEndPosition, tProgress);'
    ]
  });

  this.mesh = new THREE.Mesh(geometry, material);
  this.mesh.frustumCulled = false;
}
Object.defineProperty(Slide.prototype, 'time', {
  get: function () {
    return this.mesh.material.uniforms['uTime'].value;
  },
  set: function (v) {
    this.mesh.material.uniforms['uTime'].value = v;
  }
});

Slide.prototype.setImage = function(image) {
  this.mesh.material.uniforms.map.value.image = image;
  this.mesh.material.uniforms.map.value.needsUpdate = true;
};

Slide.prototype.transition = function() {
  return TweenMax.fromTo(this, 3.0, {time:0.0}, {time:this.totalDuration, ease:Power0.easeInOut});
};
