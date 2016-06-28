window.onload = init;

function init() {
  var root = new THREERoot({
    fov: 80
  });
  root.renderer.setClearColor(0xffffff, 1);
  root.camera.position.set(0, 0, 60);

  var light = new THREE.DirectionalLight();
  light.position.set(0, 0, 1);
  root.scene.add(light);

  var width = 100;
  var height = 60;

  // slide 1
  var slide = new Slide(width, height, 'out');
  root.scene.add(slide);
  new THREE.ImageLoader().load('winter.jpg', function(image) {
    slide.setImage(image);
  });

  // slide 2
  var slide2 = new Slide(width, height, 'in');
  root.scene.add(slide2);
  new THREE.ImageLoader().load('spring.jpg', function(image) {
    slide2.setImage(image);
  });

  var tl = new TimelineMax({repeat:-1, repeatDelay:1.0, yoyo: true});

  tl.add(slide.transition(), 0);
  tl.add(slide2.transition(), 0);

  //createTweenScrubber(tl);

  window.addEventListener('keyup', function(e) {
    if (e.keyCode === 80) {
      tl.paused(!tl.paused());
    }
  });
}

////////////////////
// CLASSES
////////////////////

function Slide(width, height, animationPhase) {
  var plane = new THREE.PlaneGeometry(width, height, width * 2, height * 2);

  THREE.BAS.Utils.separateFaces(plane);

  var geometry = new THREE.BAS.ModelBufferGeometry(plane, {
    localizeFaces: true,
    computeCentroids: true
  });

  geometry.bufferUVs();

  var i, j, offset, centroid;

  // ANIMATION

  var aAnimation = geometry.createAttribute('aAnimation', 2);
  var minDuration = 0.8;
  var maxDuration = 1.2;
  var maxDelayX = 0.9;
  var maxDelayY = 0.125;
  var stretch = 0.11;

  this.totalDuration = maxDuration + maxDelayX + maxDelayY + stretch;

  for (i = 0, offset = 0; i < geometry.faceCount; i++) {
    centroid = geometry.centroids[i];

    // animation
    var duration = THREE.Math.randFloat(minDuration, maxDuration);
    var delayX = THREE.Math.mapLinear(centroid.x, -width * 0.5, width * 0.5, 0.0, maxDelayX);
    var delayY;

    if (animationPhase === 'in') {
      delayY = THREE.Math.mapLinear(Math.abs(centroid.y), 0, height * 0.5, 0.0, maxDelayY)
    }
    else {
      delayY = THREE.Math.mapLinear(Math.abs(centroid.y), 0, height * 0.5, maxDelayY, 0.0)
    }

    for (j = 0; j < 3; j++) {
      aAnimation.array[offset]     = delayX + delayY + (Math.random() * stretch * duration);
      aAnimation.array[offset + 1] = duration;

      offset += 2;
    }
  }

  // POSITIONS

  var aStartPosition = geometry.createAttribute('aStartPosition', 3, function(data, i) {
    geometry.centroids[i].toArray(data);
  });
  var aEndPosition = geometry.createAttribute('aEndPosition', 3, function(data, i) {
    geometry.centroids[i].toArray(data);
  });

  // CONTROL POINTS

  var aControl0 = geometry.createAttribute('aControl0', 3);
  var aControl1 = geometry.createAttribute('aControl1', 3);

  var control0 = new THREE.Vector3();
  var control1 = new THREE.Vector3();
  var data = [];

  for (i = 0, offset = 0; i < geometry.faceCount; i++) {
    centroid = geometry.centroids[i];

    var signY = Math.sign(centroid.y);

    control0.x = THREE.Math.randFloat(0.1, 0.3) * 50;
    control0.y = signY * THREE.Math.randFloat(0.1, 0.3) * 50;
    control0.z = THREE.Math.randFloatSpread(20);

    control1.x = THREE.Math.randFloat(0.3, 0.6) * 50;
    control1.y = -signY * THREE.Math.randFloat(0.3, 0.6) * 70;
    control1.z = THREE.Math.randFloatSpread(20);

    if (animationPhase === 'in') {
      control0.subVectors(centroid, control0);
      control1.subVectors(centroid, control1);
    }
    else { // out
      control0.addVectors(centroid, control0);
      control1.addVectors(centroid, control1);
    }

    geometry.setFaceData(aControl0, i, control0.toArray(data));
    geometry.setFaceData(aControl1, i, control1.toArray(data));
  }

  var texture = new THREE.Texture();
  texture.minFilter = THREE.NearestFilter;

  var material = new THREE.BAS.BasicAnimationMaterial({
    shading: THREE.FlatShading,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: {value: 0}
    },
    uniformValues: {
      map: texture
    },
    vertexFunctions: [
      THREE.BAS.ShaderChunk['cubic_bezier'],
      THREE.BAS.ShaderChunk['ease_cubic_in_out'],
      THREE.BAS.ShaderChunk['quaternion_rotation']
    ],
    vertexParameters: [
      'uniform float uTime;',
      'attribute vec2 aAnimation;',
      'attribute vec3 aStartPosition;',
      'attribute vec3 aControl0;',
      'attribute vec3 aControl1;',
      'attribute vec3 aEndPosition;'
    ],
    vertexInit: [
      'float tDelay = aAnimation.x;',
      'float tDuration = aAnimation.y;',
      'float tTime = clamp(uTime - tDelay, 0.0, tDuration);',
      'float tProgress = easeCubicInOut(tTime, 0.0, 1.0, tDuration);'
    ],
    vertexPosition: [
      (animationPhase === 'in' ? 'transformed *= tProgress;' : 'transformed *= 1.0 - tProgress;'),
      'transformed += cubicBezier(aStartPosition, aControl0, aControl1, aEndPosition, tProgress);'
    ]
  });

  THREE.Mesh.call(this, geometry, material);

  this.frustumCulled = false;
}
Slide.prototype = Object.create(THREE.Mesh.prototype);
Slide.prototype.constructor = Slide;
Object.defineProperty(Slide.prototype, 'time', {
  get: function () {
    return this.material.uniforms['uTime'].value;
  },
  set: function (v) {
    this.material.uniforms['uTime'].value = v;
  }
});

Slide.prototype.setImage = function(image) {
  this.material.uniforms.map.value.image = image;
  this.material.uniforms.map.value.needsUpdate = true;
};

Slide.prototype.transition = function() {
  return TweenMax.fromTo(this, 5.0, {time:0.0}, {time:this.totalDuration, ease:Power0.easeInOut});
};
