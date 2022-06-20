window.onload = init;

function init() {
  var root = new THREERoot({
    fov: 40
  });
  root.renderer.setClearColor(0xffffff);
  root.camera.position.set(0, 100, 250);

  // shadow things
  root.renderer.shadowMap.enabled = true;
  root.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  var PLANE_SIZE = 250;
  var PLANE_OFFSET = -40;

  // create lights
  var light = new THREE.DirectionalLight();
  light.position.set(0, 100, 0);
  light.castShadow = true;
  light.shadow.camera.near = 2;
  light.shadow.camera.far = 102 - PLANE_OFFSET;
  light.shadow.camera.right = PLANE_SIZE * 0.5;
  light.shadow.camera.left = -PLANE_SIZE * 0.5;
  light.shadow.camera.top = PLANE_SIZE * 0.5;
  light.shadow.camera.bottom = -PLANE_SIZE * 0.5;
  light.shadow.mapSize.width = 2048;
  light.shadow.mapSize.height = 2048;
  root.scene.add(light);
  // root.scene.add(new THREE.CameraHelper(light.shadow.camera));

  // ground
  var plane = new THREE.Mesh(
    new THREE.PlaneGeometry(PLANE_SIZE, PLANE_SIZE),
    new THREE.MeshPhongMaterial({
      color: 0xaaaaaa,
      side: THREE.DoubleSide
    })
  );
  plane.receiveShadow = true;
  plane.rotation.x = Math.PI * -0.5;
  plane.position.set(0, PLANE_OFFSET, 0);
  root.add(plane);

  // create a geometry for the smear mesh
  var geometry = new THREE.OctahedronGeometry(10, 4);
  geometry = new THREE.Geometry().fromBufferGeometry(geometry);

  // create the smear mesh
  var smearMesh = new SmearMesh(geometry, {
    smearFactor: 2.0,
    smearFactorVariance: 0.5,
    smearDecayFactor: 0.5,
    createDepthMaterial: true
  });
  smearMesh.mesh.castShadow = true;

  root.add(smearMesh.mesh);
  // smearMesh.update must be called each frame
  root.addUpdateCallback(function() {
    smearMesh.update();
  });

  // ANIMATION

  // proxy for position animation
  var autoPosition = new THREE.Vector3();
  // this function will be called every time one of the tweens below renders
  var updateMeshPosition = function() {
    smearMesh.moveTo(autoPosition);
  };

  var autoTween = new TimelineMax({repeat: -1, repeatDelay: 0.5, yoyo: true, onUpdate: updateMeshPosition});
  // set the initial position to prevent jumping
  smearMesh.mesh.position.set(-100, 0, 0);
  // setup the animation
  autoTween.fromTo(autoPosition, 1, {x: -100}, {x: 100, ease: Power4.easeInOut});

  // DRAG INTERACTIVITY

  // create a drag controller for mouse interactivity
  var dragController = new DragController(root.camera, root.renderer.domElement, root.controls);
  // register the mesh with the dragController so it will dispatch 'dragStart', 'drag' and 'dragEnd' events
  dragController.register(smearMesh.mesh);
  // pause the tween on drag start
  smearMesh.mesh.addEventListener('dragStart', function() {
    autoTween.pause();
  });
  // resume the tween on drag end after the position is reset
  smearMesh.mesh.addEventListener('dragEnd', function() {
    autoPosition.copy(smearMesh.mesh.position);
    TweenMax.to(autoPosition, 0.5, {x:-100, y: 0, z: 0, ease: Power2.easeInOut,
      onUpdate: updateMeshPosition,
      onComplete: function() {
        autoTween.play(0);
      }
    })
  });
  // update position on drag
  smearMesh.mesh.addEventListener('drag', function(e) {
    // call the moveTo function instead of setting the position directly
    // moveTo is where the smear effect is calculated
    smearMesh.moveTo(e.position);
  });
}

////////////////////
// CLASSES
////////////////////

function DragController(camera, element, controls) {
  this.camera = camera;
  this.element = element || window;
  this.controls = controls;

  this.pointerUDC = new THREE.Vector2();
  this.plane = new THREE.Plane();
  this.intersection = new THREE.Vector3();
  this.offset = new THREE.Vector3();
  this.raycaster = new THREE.Raycaster();
  this.objects = [];

  this.dragObject = null;
  this.hoverObject = null;

  // MOUSE
  console.log(this.element)
  this.element.addEventListener('mousedown', function(e) {
    e.preventDefault();
    this.updatePointerUDC(e.clientX, e.clientY);
    this.handlePointerDown();
  }.bind(this));

  this.element.addEventListener('mousemove', function(e) {
    e.preventDefault();
    this.updatePointerUDC(e.clientX, e.clientY);
    this.handlePointerMove();
  }.bind(this));

  this.element.addEventListener('mouseup', function(e) {
    e.preventDefault();
    this.handlePointerUp();
  }.bind(this));

  // FINGER todo touchmove doesn't want to work :(
  // this.element.addEventListener('touchstart', function(e) {
  //   e.preventDefault();
  //   this.updatePointerUDC(e.touches[0].clientX, e.touches[0].clientY);
  //   this.handlePointerDown();
  // }.bind(this));
  //
  // this.element.addEventListener('touchmove', function(e) {
  //   e.preventDefault();
  //   this.updatePointerUDC(e.touches[0].clientX, e.touches[0].clientY);
  //   this.handlePointerMove();
  // }.bind(this));
  //
  // this.element.addEventListener('touchend', function(e) {
  //   e.preventDefault();
  //   this.handlePointerUp();
  // }.bind(this));
}
DragController.prototype = {
  updatePointerUDC: function(x, y) {
    this.pointerUDC.x = (x / window.innerWidth) * 2 - 1;
    this.pointerUDC.y = -(y / window.innerHeight) * 2 + 1;
  },

  handlePointerDown: function() {
    this.raycaster.setFromCamera(this.pointerUDC, this.camera);

    var intersects = this.raycaster.intersectObjects(this.objects);
    console.log(intersects)
    if (intersects.length > 0) {
      this.controls && (this.controls.enabled = false);

      this.dragObject = intersects[0].object;
      this.dragObject.dispatchEvent({
        type: 'dragStart'
      });

      if (this.raycaster.ray.intersectPlane(this.plane, this.intersection)) {
        this.offset.copy(this.intersection).sub(this.dragObject.position);
      }
    }
  },
  handlePointerMove: function() {
    this.raycaster.setFromCamera(this.pointerUDC, this.camera);

    if (!this.dragObject) {
      var intersects = this.raycaster.intersectObjects(this.objects);

      if (intersects.length > 0) {
        if (this.hoverObject != intersects[0].object) {
          this.hoverObject = intersects[0].object;

          this.plane.setFromNormalAndCoplanarPoint(
            this.camera.getWorldDirection(this.plane.normal),
            this.hoverObject.position
          );
        }

        this.element.style.cursor = 'pointer';
      }
      else {
        this.hoverObject = null;
        this.element.style.cursor = 'default';
      }
    }
    else {
      if (this.raycaster.ray.intersectPlane(this.plane, this.intersection)) {
        var position = this.intersection.sub(this.offset);

        this.dragObject.dispatchEvent({
          type: 'drag',
          position: position
        });
      }
    }
  },
  handlePointerUp: function() {
    this.controls && (this.controls.enabled = true);

    if (this.hoverObject && this.dragObject) {
      this.dragObject.dispatchEvent({
        type: 'dragEnd'
      });

      this.dragObject = null;
    }
  },
  register: function(object) {
    this.objects.push(object);
  }
};

function SmearMesh(geometry, settings) {
  // defaults
  settings = Object.assign({
    smearFactor: 1.0,
    smearFactorVariance: 0.0,
    smearDecayFactor: 0.8,
    smearVelocityThreshold: 0,
    createDepthMaterial: false,
    createDistanceMaterial: false,
    Material: BAS.PhongAnimationMaterial,
    materialParams: {}
  }, settings);

  this.smearDecayFactor = settings.smearDecayFactor;
  this.smearVelocityThreshold = settings.smearVelocityThreshold;

  // GEOMETRY

  var bufferGeometry = new BAS.ModelBufferGeometry(geometry);
  // store smear factor per vertex to create a per vertex offset / smear
  bufferGeometry.createAttribute('aSmearFactor', 1, function(data) {
    data[0] = settings.smearFactor + THREE.MathUtils.randFloatSpread(settings.smearFactorVariance);
  });

  // MATERIAL

  // extend the defaults below with any arguments passed in the constructor
  // todo vertexParameters & vertexPosition are overridden
  var material = new settings.Material(Object.assign({
    uniforms: {
      uDelta: {value: new THREE.Vector3()}
    },
    vertexParameters: [
      'uniform vec3 uDelta;',
      'attribute float aSmearFactor;'
    ],
    vertexPosition: [
      'if (length(uDelta) != 0.0) {',
        'vec3 nt = normalize(transformed);',
        'vec3 nd = normalize(uDelta);',
        'float dp = dot(nt, nd);',

        'transformed -= uDelta * (1.0 - dp) * aSmearFactor;',
      '}'
    ]
  }, settings.materialParams));

  // normals for smooth shading
  bufferGeometry.computeVertexNormals();

  this.mesh = new THREE.Mesh(bufferGeometry, material);
  this.mesh.frustumCulled = false;

  // for point light shadows
  if (settings.createDistanceMaterial) {
    this.mesh.customDistanceMaterial = BAS.Utils.createDistanceAnimationMaterial(material);
  }

  // for dir & spot light shadows
  if (settings.createDepthMaterial) {
    this.mesh.customDepthMaterial = BAS.Utils.createDepthAnimationMaterial(material);
  }
}

SmearMesh.prototype.moveTo = function(target) {
  var v = this.mesh.material.uniforms['uDelta'].value;

  v.subVectors(target, this.mesh.position);
  this.mesh.position.copy(target);

  if (v.length() < this.smearVelocityThreshold) {
    v.setScalar(0.0);
  }
};

SmearMesh.prototype.update = function() {
  this.mesh.material.uniforms['uDelta'].value.multiplyScalar(this.smearDecayFactor);

  if (this.mesh.customDepthMaterial) {
    this.mesh.customDepthMaterial.uniforms['uDelta'].value.copy(this.mesh.material.uniforms['uDelta'].value);
  }

  if (this.mesh.customDistanceMaterial) {
    this.mesh.customDistanceMaterial.uniforms['uDelta'].value.copy(this.mesh.material.uniforms['uDelta'].value);
  }
};
