window.onload = init;

function init() {
  var root = new THREERoot({
    createCameraControls: true
  });
  root.renderer.setClearColor(0xffffff);
  root.camera.position.set(0, 0, 120);

  root.add(new THREE.AxisHelper(100));

  // todo
  window.controls = root.controls;

  var light = new THREE.DirectionalLight();
  light.position.set(0, 0, 1);
  root.scene.add(light);

  light = new THREE.DirectionalLight();
  light.position.set(0, 0, -1);
  root.scene.add(light);

  var smearMesh = new SmearMesh();
  root.add(smearMesh);

  smearMesh.addEventListener('drag', function(e) {
    this.moveTo(e.point);
  });
  smearMesh.addEventListener('dragEnd', function(e) {
    this.reset();
  });

  var dragController = new DragController(root.camera, root.renderer.domElement);

  dragController.register(smearMesh);
}

////////////////////
// CLASSES
////////////////////

function DragController(camera, element) {
  this.camera = camera;
  this.element = element || window;

  this.pointerUDC = new THREE.Vector2();
  this.plane = new THREE.Plane();
  this.intersection = new THREE.Vector3();
  this.offset = new THREE.Vector3();
  this.raycaster = new THREE.Raycaster();
  this.objects = [];

  this.SELECTED = null;
  this.INTERSECTED = null;

  // MOUSE
  this.element.addEventListener('mousedown', function(e) {
    e.preventDefault();
    // this.updatePointerUDC(e.clientX, e.clientY);
    this.handlePointerDown();
  }.bind(this));
  this.element.addEventListener('mousemove', function(e) {
    e.preventDefault();
    this.updatePointerUDC(e.clientX, e.clientY);
    this.handlePointerMove();
  }.bind(this));
  this.element.addEventListener('mouseup', function(e) {
    e.preventDefault();
    // this.updatePointerUDC(e.clientX, e.clientY);
    this.handlePointerUp();
  }.bind(this));

  // FINGER todo
}
DragController.prototype = {
  updatePointerUDC: function(x, y) {
    this.pointerUDC.x = (x / window.innerWidth) * 2 - 1;
    this.pointerUDC.y = -(y / window.innerHeight) * 2 + 1;
  },

  handlePointerDown: function() {
    this.raycaster.setFromCamera(this.pointerUDC, this.camera);

    var intersects = this.raycaster.intersectObjects(this.objects);

    if (intersects.length > 0) {
      // todo
      controls.enabled = false;

      this.SELECTED = intersects[0].object;

      if (this.raycaster.ray.intersectPlane(this.plane, this.intersection)) {
        this.offset.copy(this.intersection).sub(this.SELECTED.position);
      }
    }
  },
  handlePointerMove: function() {
    this.raycaster.setFromCamera(this.pointerUDC, this.camera);

    if (this.SELECTED) {
      if (this.raycaster.ray.intersectPlane(this.plane, this.intersection)) {
        var point = this.intersection.sub(this.offset);

        this.SELECTED.dispatchEvent({
          type: 'drag',
          point: point
        });
      }

      return;
    }

    var intersects = this.raycaster.intersectObjects(this.objects);

    if (intersects.length > 0) {

      if (this.INTERSECTED != intersects[0].object) {
        this.INTERSECTED = intersects[0].object;

        this.plane.setFromNormalAndCoplanarPoint(
          this.camera.getWorldDirection(this.plane.normal),
          this.INTERSECTED.position
        );
      }
    }
    else {
      this.INTERSECTED = null;
    }
  },
  handlePointerUp: function() {
    // todo
    controls.enabled = true;

    if (this.INTERSECTED && this.SELECTED) {
      this.SELECTED.dispatchEvent({
        type: 'dragEnd'
      });

      this.SELECTED = null;
    }
  },
  register: function(object) {
    this.objects.push(object);
  }
};

function SmearMesh() {
  var model = new THREE.SphereGeometry(10, 24, 24);
  // var model = new THREE.TorusGeometry(10, 6, 32, 32);
  var geometry = new THREE.BAS.ModelBufferGeometry(model);

  geometry.createAttribute('aSmearFactor', 1, function(data) {
    data[0] = 1.0 + THREE.Math.randFloatSpread(0.0);
  });

  var material = new THREE.BAS.PhongAnimationMaterial({
    shading: THREE.FlatShading,
    side: THREE.DoubleSide,
    // wireframe: true,
    uniforms: {
      uTime: {value: 0},
      uDelta: {value: new THREE.Vector3()}
    },
    uniformValues: {
      diffuse: new THREE.Color(0xffffff)
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
      'vec3 nt = normalize(transformed);',
      'vec3 nd = normalize(uDelta);',
      'float dp = dot(nt, nd);',

      'if (dp < 0.0) {',
        'transformed -= uDelta * (1.0 - dp) * aSmearFactor;',
      '}'
    ]
  });

  THREE.Mesh.call(this, geometry, material);

  this.frustumCulled = false;
}
SmearMesh.prototype = Object.create(THREE.Mesh.prototype);
SmearMesh.prototype.constructor = SmearMesh;

Object.defineProperty(SmearMesh.prototype, 'time', {
  get: function () {
    return this.material.uniforms['uTime'].value;
  },
  set: function (v) {
    this.material.uniforms['uTime'].value = v;
  }
});

SmearMesh.prototype.moveTo = function(target) {
  this.material.uniforms['uDelta'].value.subVectors(target, this.position);
  this.position.copy(target);
};
SmearMesh.prototype.reset = function() {
  this.material.uniforms['uDelta'].value.set(0, 0, 0);
};
