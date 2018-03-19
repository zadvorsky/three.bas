window.onload = init;

function init() {
  // THREERoot is a simple THREE.js wrapper with a renderer, scene and camera
  // it handles an RAF loop and resizing
  var root = new THREERoot({
    createCameraControls: true,
    antialias: (window.devicePixelRatio === 1),
    fov: 60,
  });
  root.renderer.setClearColor(0x222222);
  root.camera.position.set(0, 0, 1500);

  var animation = new Animation();
  root.add(animation);

  animation.animate(1.0, {ease: Power0.easeIn, repeat:-1, repeatDelay: 1.5, yoyo: true, onRepeat: function() {
    // change all points's aEndPos and aEndColor, when transform from ball state to picture state, not reverse
    animation.reverse = !animation.reverse;
    if (animation.reverse) {
      return;
    }

    // randomly pick one picture info
    var curPicPoints = animation.endPointsCollections[THREE.Math.randInt(0, 2)];
    var aEndPos = animation.aEndPos;
    var aEndColor = animation.aEndColor;
    for (var i = 0; i < aEndPos.array.length; i++) {
      // use current picture info to set aEndPos and aEndColor of buffer geometry,
      // if picture info length is less than geometry points length, set default value
      if (i < curPicPoints.length) {
        aEndPos.array[i * 3 + 0] = curPicPoints[i].x;
        aEndPos.array[i * 3 + 1] = curPicPoints[i].y;
        aEndPos.array[i * 3 + 2] = curPicPoints[i].z;
        aEndColor.array[i * 3 + 0] = curPicPoints[i].r;
        aEndColor.array[i * 3 + 1] = curPicPoints[i].g;
        aEndColor.array[i * 3 + 2] = curPicPoints[i].b;
      } else {
        aEndPos.array[i * 3 + 0] = 0;
        aEndPos.array[i * 3 + 1] = 0;
        aEndPos.array[i * 3 + 2] = 0;
        aEndColor.array[i * 3 + 0] = 0;
        aEndColor.array[i * 3 + 1] = 0;
        aEndColor.array[i * 3 + 2] = 0;
      }
    }
    aEndPos.needsUpdate = true;
    aEndColor.needsUpdate = true;
  }});
}

/**
 * Get a random point on a sphere
 *
 * @param {Float} r Shpere radius
 * @returns {Object} return the point's position 
 */
function getRandomPointOnSphere(r) {
  var u = THREE.Math.randFloat(0, 1);
  var v = THREE.Math.randFloat(0, 1);
  var theta = 2 * Math.PI * u;
  var phi = Math.acos(2 * v - 1);
  var x = r * Math.sin(theta) * Math.sin(phi);
  var y = r * Math.cos(theta) * Math.sin(phi);
  var z = r * Math.cos(phi);
  return {
    x,
    y,
    z,
  };
}

/**
 * Translate a picture to a set of points
 *
 * @param {String} selector The DOM selector of image
 * @returns {Array} return the set of points 
 */
function getPointsOnPicture(selector) {
  var img = document.querySelector(selector);
  var width = img.width;
  var height = img.height;

  var canvas = document.createElement('canvas');
  document.body.appendChild(canvas);
  canvas.width = width;
  canvas.height = height;
  var ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, width, height);
  var imgData = ctx.getImageData(0, 0, width, height);

  var points = [];
  var xStep = 8;
  var yStep = 8;
  for (var x = 0; x < width; x += xStep) {
    for (var y = 0; y < height; y += yStep) {
      var i = (y * width + x) * 4;

      // not collect the points for alpha is zero
      if (imgData.data[i + 4] <= 0) {
        continue;
      }

      points.push({
        x: x - width / 2,
        y: -(y - height / 2),
        z: 0,
        r: imgData.data[i] / 255,
        g: imgData.data[i + 1] / 255,
        b: imgData.data[i + 2] / 255,
        a: imgData.data[i + 3] / 255,
      });
    }
  }

  return points;
}

////////////////////
// CLASSES
////////////////////

function Animation() {
  var count = 15000;
  var radius = 680;
  var offset = radius;
  var geometry = new BAS.PointBufferGeometry(count);

  // in start state, all points form a ball 
  geometry.createAttribute('aStartPos', 3, (data, index, num) => {
    var startVec3 = new THREE.Vector3();
    var randSphere = getRandomPointOnSphere(radius);
    startVec3.x = randSphere.x;
    startVec3.y = randSphere.y;
    startVec3.z = randSphere.z;
    startVec3.toArray(data);
  });

  // in start state, all points have a random color
  var color = new THREE.Color();
  geometry.createAttribute('aStartColor', 3, function(data, index, count) {
    // modulate the hue
    h = index / count;
    s = THREE.Math.randFloat(0.4, 0.6);
    l = THREE.Math.randFloat(0.4, 0.6);

    color.setHSL(h, s, l);
    color.toArray(data);
  });


  // in end state, all points form a picture,
  // and the colors and positions of the picture will assign to all the points
  this.aEndPos = geometry.createAttribute('aEndPos', 3);
  this.aEndColor = geometry.createAttribute('aEndColor', 3);

  // collect the picture's info
  var endPointsCollections = [];
  var imgs = ['.img-heisen', '.img-minion', '.img-murakami'];
  for (var i = 0; i < imgs.length; i++) {
    var points = getPointsOnPicture(imgs[i]);
    endPointsCollections.push(points);
  }

  // svae the info, for animation
  this.endPointsCollections = endPointsCollections;
  
  // use one picture info as default value
  var curPicPoints = this.endPointsCollections[0];
  for (var i = 0; i < count; i++) {
    if (i < curPicPoints.length) {
      this.aEndPos.array[i * 3 + 0] = curPicPoints[i].x;
      this.aEndPos.array[i * 3 + 1] = curPicPoints[i].y;
      this.aEndPos.array[i * 3 + 2] = curPicPoints[i].z;
      this.aEndColor.array[i * 3 + 0] = curPicPoints[i].r;
      this.aEndColor.array[i * 3 + 1] = curPicPoints[i].g;
      this.aEndColor.array[i * 3 + 2] = curPicPoints[i].b;
    } else {
      this.aEndPos.array[i * 3 + 0] = 0;
      this.aEndPos.array[i * 3 + 1] = 0;
      this.aEndPos.array[i * 3 + 2] = 0;
      this.aEndColor.array[i * 3 + 0] = 0;
      this.aEndColor.array[i * 3 + 1] = 0;
      this.aEndColor.array[i * 3 + 2] = 0;
    }
  }

  var duration = 1;
  var maxPointDelay = 0.3;
  this.totalDuration = duration + maxPointDelay;

  geometry.createAttribute('aDelayDuration', 3, (data, index, num) => {
    for (var i = 0; i < num; i++) {
      data[0] = Math.random() * maxPointDelay;
      data[1] = duration;
    }
  });

  var material = new BAS.PointsAnimationMaterial({
    transparent: true,
    blending: THREE.AdditiveBlending,
    vertexColors: THREE.VertexColors,
    depthWrite: false,
    uniforms: {
      uTime: { type: 'f', value: 0 },
    },
    uniformValues: {
      size: 10.0,
      sizeAttenuation: true,
      // all points will have the same color
      // diffuse: new THREE.Vector3(0xffffff),
    },
    vertexFunctions: [
      BAS.ShaderChunk['ease_expo_in_out'],
    ],
    vertexParameters: [
      'uniform float uTime;',
      'attribute vec2 aDelayDuration;',
      'attribute vec3 aStartPos;',
      'attribute vec3 aEndPos;',
      'attribute vec3 aStartColor;',
      'attribute vec3 aEndColor;',
      'attribute float aStartOpacity;',
      'attribute float aEndOpacity;',
    ],
    // this chunk is injected 1st thing in the vertex shader main() function
    // variables declared here are available in all subsequent chunks
    vertexInit: [
      // calculate a progress value between 0.0 and 1.0 based on the vertex delay and duration, and the uniform time
      'float tProgress = clamp(uTime - aDelayDuration.x, 0.0, aDelayDuration.y) / aDelayDuration.y;',
      // ease the progress using one of the available easing functions
      'tProgress = easeExpoInOut(tProgress);',
    ],
    // this chunk is injected before all default position calculations (including the model matrix multiplication)
    vertexPosition: [
      // linearly interpolate between the start and end position based on tProgress
      // and add the value as a delta
      'transformed += mix(aStartPos, aEndPos, tProgress);'
    ],
    // this chunk is injected before all default color calculations
    vertexColor: [
      // linearly interpolate between the start and end position based on tProgress
      // and add the value as a delta
      'vColor = mix(aStartColor, aEndColor, tProgress);',
    ],

    // convert the point (default is square) to circle shape, make sure transparent of material is true
    // you can create more shapes: https://thebookofshaders.com/07/
    fragmentShape: [
      `
        float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
        float pct = 1.0 - smoothstep(0.0, 0.5, distanceToCenter);
        gl_FragColor = vec4(gl_FragColor.rgb, pct * gl_FragColor.a);
      `
    ]
  });
  
  // use THREE.Points to create Particles
  THREE.Points.call(this, geometry, material);

  this.frustumCulled = false;
}
Animation.prototype = Object.create(THREE.Points.prototype);
Animation.prototype.constructor = Animation;
// helper method for changing the uTime uniform
Object.defineProperty(Animation.prototype, 'time', {
  get: function () {
    return this.material.uniforms['uTime'].value;
  },
  set: function (v) {
    this.material.uniforms['uTime'].value = v;
  }
});
// helper method to animate the time between 0.0 and the totalDuration calculated in the constructor
Animation.prototype.animate = function (duration, options) {
  options = options || {};
  options.time = this.totalDuration;

  return TweenMax.fromTo(this, duration, {time: 0.0}, options);
};
