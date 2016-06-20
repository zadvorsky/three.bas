function THREERoot(params) {
  // defaults
  params = utils.extend({
    container:'#three-container',
    fov:60,
    zNear:1,
    zFar:10000,
    createCameraControls: true,
    autoStart: true,
    pixelRatio: window.devicePixelRatio
  }, params);

  // maps and arrays
  this.updateCallbacks = [];
  this.resizeCallbacks = [];
  this.objects = {};

  // renderer
  this.renderer = new THREE.WebGLRenderer({
    antialias: params.antialias
  });
  this.renderer.setPixelRatio(params.pixelRatio);

  // container
  this.container = (typeof params.container === 'string') ? document.querySelector(params.container) : params.container;
  this.container.appendChild(this.renderer.domElement);

  // camera
  this.camera = new THREE.PerspectiveCamera(
    params.fov,
    window.innerWidth / window.innerHeight,
    params.zNear,
    params.zFar
  );

  // scene
  this.scene = new THREE.Scene();

  // resize handling
  this.resize = this.resize.bind(this);
  this.resize();
  window.addEventListener('resize', this.resize, false);

  // tick / update / render
  this.tick = this.tick.bind(this);
  params.autoStart && this.tick();

  // optional camera controls
  params.createCameraControls && this.createOrbitControls();
}
THREERoot.prototype = {
  createOrbitControls: function() {
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.addUpdateCallback(this.controls.update.bind(this.controls));
  },
  start: function() {
    this.tick();
  },
  addUpdateCallback: function(callback) {
    this.updateCallbacks.push(callback);
  },
  addResizeCallback: function(callback) {
    this.resizeCallbacks.push(callback);
  },
  add: function(object, key) {
    key && (this.objects[key] = object);
    this.scene.add(object);
  },
  addTo: function(object, parentKey, key) {
    key && (this.objects[key] = object);
    this.get(parentKey).add(object);
  },
  get: function(key) {
    return this.objects[key];
  },
  remove: function(o) {
    var object;

    if (typeof o === 'string') {
      object = this.objects[o];
    }
    else {
      object = o;
    }

    if (object) {
      object.parent.remove(object);
      delete this.objects[o];
    }
  },
  tick: function() {
    this.update();
    this.render();
    requestAnimationFrame(this.tick);
  },
  update: function() {
    this.updateCallbacks.forEach(function(callback) {callback()});
  },
  render: function() {
    this.renderer.render(this.scene, this.camera);
  },
  resize: function() {
    var width = window.innerWidth;
    var height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.resizeCallbacks.forEach(function(callback) {callback()});
  },
  initPostProcessing:function(passes) {
    var size = this.renderer.getSize();
    var pixelRatio = this.renderer.getPixelRatio();
    size.width *= pixelRatio;
    size.height *= pixelRatio;

    var composer = this.composer = new THREE.EffectComposer(this.renderer, new THREE.WebGLRenderTarget(size.width, size.height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      stencilBuffer: false
    }));

    var renderPass = new THREE.RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    for (var i = 0; i < passes.length; i++) {
      var pass = passes[i];
      pass.renderToScreen = (i === passes.length - 1);
      this.composer.addPass(pass);
    }

    this.renderer.autoClear = false;
    this.render = function() {
      this.renderer.clear();
      this.composer.render();
    }.bind(this);

    this.addResizeCallback(function() {
      var width = window.innerWidth;
      var height = window.innerHeight;

      composer.setSize(width * pixelRatio, height * pixelRatio);
    }.bind(this));
  }
};
