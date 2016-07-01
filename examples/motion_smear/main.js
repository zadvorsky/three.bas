window.onload = init;

function init() {
  var root = new THREERoot();
  root.renderer.setClearColor(0xffffff);
  root.camera.position.set(0, 0, 80);
  root.controls.autoRotate = false;

  var light = new THREE.DirectionalLight();
  light.position.set(0, 0, 1);
  root.scene.add(light);

  light = new THREE.DirectionalLight();
  light.position.set(0, 0, -1);
  root.scene.add(light);

  var animation = new Animation();
  root.add(animation);

  animation.moveTo(new THREE.Vector3(50, 0, 0));


  root.add(new THREE.AxisHelper(50))
}

////////////////////
// CLASSES
////////////////////

function Animation() {
  var model = new THREE.SphereGeometry(10, 32, 32);

  //THREE.BAS.Utils.separateFaces(model);

  var geometry = new THREE.BAS.ModelBufferGeometry(model, {
    localizeFaces: false,
    computeCentroids: false
  });

  // ANIMATION

  // POSITION

  //var aPosition = geometry.createAttribute('aPosition', 3, function(data, i) {
  //  geometry.centroids[i].toArray(data);
  //});

  geometry.createAttribute('aSmearFactor', 1, function(data) {
    data[0] = Math.random() * 0.25;
  });

  var material = new THREE.BAS.BasicAnimationMaterial({
    shading: THREE.FlatShading,
    side: THREE.DoubleSide,
    wireframe: true,
    uniforms: {
      uTime: {value: 0},
      uDelta: {value: new THREE.Vector3()}
    },
    uniformValues: {
      diffuse: new THREE.Color(0x000000)
    },
    vertexFunctions: [
      THREE.BAS.ShaderChunk['ease_cubic_in_out'],
      THREE.BAS.ShaderChunk['quaternion_rotation']
    ],
    vertexParameters: [
      'uniform float uTime;',
      'uniform vec3 uDelta;',

      'attribute float aSmearFactor;'
    ],
    vertexInit: [
    ],
    vertexPosition: [

      'if (transformed.x < 0.0) {',
        'transformed -= uDelta * aSmearFactor;',
      '}'

      //'transformed += aPosition;'
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

Animation.prototype.moveTo = function(target) {
  this.material.uniforms['uDelta'].value.subVectors(target, this.position);

  //this.positition.copy(target);
  TweenMax.to(this.position, 10, {x:target.x, y:target.y, z:target.z, ease:Power0.easeIn});
};


Animation.prototype.animate = function(duration, options) {
  options = options || {};
  options.time = this.totalDuration;

  return TweenMax.fromTo(this, duration, {time: 0.0}, options);
};
