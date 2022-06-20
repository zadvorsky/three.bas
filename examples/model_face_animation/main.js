window.onload = init;

console.log(THREE.Geometry, THREE.Face3)

function init() {
  var root = new THREERoot();
  root.renderer.setClearColor(0x000000);
  root.camera.position.set(0, 0, 30);
  root.controls.autoRotate = true;

  var light = new THREE.DirectionalLight();
  light.position.set(0, 0, 1);
  root.scene.add(light);

  light = new THREE.DirectionalLight();
  light.position.set(0, 0, -1);
  root.scene.add(light);

  var animation = new Animation();
  root.add(animation.mesh);

  // set a new random back-face color each time the animation repeats
  animation.animate(4.0, {ease: Power0.easeIn, repeat:-1, onRepeat: function() {
    animation.backFaceColor.setHSL(Math.random(), 1.0, 0.5);
  }});
}

////////////////////
// CLASSES
////////////////////

function Animation() {
  // create a geometry that will be used by BAS.ModelBufferGeometry
  var modelRadius = 10;
  var modelTube = 4;
  var model = new THREE.TorusGeometry(modelRadius, modelTube, 256, 256);
  model = new Geometry().fromBufferGeometry(model);

  // duplicate some vertices so that each face becomes a separate triangle.
  // this is the same as the THREE.ExplodeModifier
  BAS.Utils.separateFaces(model);

  // create a ModelBufferGeometry based on the geometry created above
  // ModelBufferGeometry makes it easier to create animations based on faces of a geometry
  // it is similar to the PrefabBufferGeometry where the prefab is a face (triangle)
  var geometry = new BAS.ModelBufferGeometry(model, {
    // setting this to true will store the vertex positions relative to the face they are in
    // this way it's easier to rotate and scale faces around their own center
    localizeFaces: true,
    // setting this to true will store a centroid for each face in an array
    computeCentroids: true
  });

  // ANIMATION

  // create a BufferAttribute with an item size of 2, so each face has an animation duration and a delay
  var aDelayDuration = geometry.createAttribute('aDelayDuration', 2);
  var minDuration = 1.0;
  var maxDuration = 1.0;
  var centroidDelayFactor = 0.1;

  // animation delay is calculated based on position
  // the max position is equal to the radius + tube of the torus
  this.totalDuration = maxDuration + centroidDelayFactor * (modelRadius + modelTube);

  // calculate a delay and duration FOR EACH FACE
  for (var i = 0, offset = 0; i < geometry.faceCount; i++) {
    var duration = THREE.MathUtils.randFloat(minDuration, maxDuration);
    var centroidLength = geometry.centroids[i].length();
    var delay = centroidLength * centroidDelayFactor;

    // store the delay and duration FOR EACH VERTEX of the face
    // the loop is repeated 3 times because each face has 3 vertices
    for (var j = 0; j < 3; j++) {
      aDelayDuration.array[offset]     = delay;
      aDelayDuration.array[offset + 1] = duration;

      offset += 2;
    }
  }

  // POSITION

  // simply copy the centroid of the face as the position
  // adding the position in the vertex shader will 'reset' the face to its original position in the geometry
  // the function passed as the 3rd argument will be executed for each face
  var aPosition = geometry.createAttribute('aPosition', 3, function(data, i) {
    geometry.centroids[i].toArray(data);
  });

  // ROTATION

  var axis = new THREE.Vector3();

  // give each face a rotation axis and an angle to rotate around that axis
  var aAxisAngle = geometry.createAttribute('aAxisAngle', 4, function(data, i) {
    // base the axis on the position within the geometry
    // this creates a smooth curve/wave effect
    axis.copy(geometry.centroids[i]).normalize();
    axis.toArray(data);
    // two full rotations around the axis
    data[3] = Math.PI * 4;
  });

  var material = new BAS.StandardAnimationMaterial({
    flatShading: true,
    side: THREE.DoubleSide,
    diffuse: new THREE.Color(0x222222),
    uniforms: {
      uTime: {value: 0},
      // this color will be used for back-facing fragments in fragmentDiffuse
      uBackColor: {value: new THREE.Color().setHSL(0, 1.0, 0.5)}
    },
    vertexFunctions: [
      BAS.ShaderChunk['ease_cubic_in_out'],
      BAS.ShaderChunk['quaternion_rotation']
    ],
    vertexParameters: [
      'uniform float uTime;',
      'attribute vec2 aDelayDuration;',
      'attribute vec3 aPosition;',
      'attribute vec4 aAxisAngle;'
    ],
    vertexInit: [
      'float tProgress = clamp(uTime - aDelayDuration.x, 0.0, aDelayDuration.y) / aDelayDuration.y;',
      'tProgress = easeCubicInOut(tProgress);'
    ],
    vertexPosition: [
      'vec4 tQuat = quatFromAxisAngle(aAxisAngle.xyz, aAxisAngle.w * tProgress);',

      // rotate the vertex around (0, 0, 0)
      'transformed = rotateVector(tQuat, transformed);',
      // restore the position
      'transformed += aPosition;'
    ],
    fragmentParameters: [
      'uniform vec3 uBackColor;'
    ],
    fragmentDiffuse: [
      // gl_FrontFacing is a built-in glsl variable that indicates if the current fragment is front-facing
      // if its not front facing, set diffuse color to uBackColor
      'if (gl_FrontFacing == false) {',
      ' diffuseColor.rgb = uBackColor.xyz;',
      '}'
    ]
  });

  this.mesh = new THREE.Mesh(geometry, material);
  this.mesh.frustumCulled = false;
}

Object.defineProperty(Animation.prototype, 'time', {
  get: function () {
    return this.mesh.material.uniforms['uTime'].value;
  },
  set: function (v) {
    this.mesh.material.uniforms['uTime'].value = v;
  }
});

Object.defineProperty(Animation.prototype, 'backFaceColor', {
  get: function () {
    return this.mesh.material.uniforms['uBackColor'].value;
  },
  set: function (v) {
    this.mesh.material.uniforms['uBackColor'].value = v;
  }
});

Animation.prototype.animate = function (duration, options) {
  options = options || {};
  options.time = this.totalDuration;

  return TweenMax.fromTo(this, duration, {time: 0.0}, options);
};
