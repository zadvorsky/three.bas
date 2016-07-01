window.onload = init;

function init() {
  var root = new THREERoot();
  root.renderer.setClearColor(0xffffff);
  root.camera.position.set(0, 0, 120);
  root.controls.autoRotate = false;

  root.renderer.domElement.addEventListener( 'mousemove', onDocumentMouseMove, false );
  root.renderer.domElement.addEventListener( 'mousedown', onDocumentMouseDown, false );
  root.renderer.domElement.addEventListener( 'mouseup', onDocumentMouseUp, false );

  window.controls = root.controls;
  window.camera = root.camera;
  window.container = root.container;

  window.mouse = new THREE.Vector2();
  window.raycaster = new THREE.Raycaster();
  window.plane = new THREE.Plane();
  window.offset = new THREE.Vector3();
  window.intersection = new THREE.Vector3();
  window.INTERSECTED = false;
  window.SELECTED = false;

  var light = new THREE.DirectionalLight();
  light.position.set(0, 0, 1);
  root.scene.add(light);

  light = new THREE.DirectionalLight();
  light.position.set(0, 0, -1);
  root.scene.add(light);

  var animation = new Animation();
  root.add(animation);

  window.objects = [animation];

  // var p = new THREE.Vector3();
  // var tl = new TimelineMax({repeat: -1, onUpdate:function() {
  //   animation.moveTo(p);
  // }});
  // var e = Power2.easeIn;
  //
  //
  // tl.to(p, 1, {x: 50, y: 0, z: 0, ease: e});
  // tl.to(p, 1, {x: 50, y: 50, z: 0, ease: e});
  // tl.to(p,1, {x: 0, y: 50, z: 0, ease: e});
  // tl.to(p,1, {x: 0, y: 0, z: 0, ease: e});
  //
  // tl.timeScale(2);
}




function onDocumentMouseMove( event ) {

  event.preventDefault();

  mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
  mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

  raycaster.setFromCamera( mouse, camera );

  if ( SELECTED ) {

    if ( raycaster.ray.intersectPlane( plane, intersection ) ) {

      // TODO
      // SELECTED.position.copy( intersection.sub( offset ) );

      SELECTED.moveTo(intersection.sub( offset ));

    }

    return;

  }

  var intersects = raycaster.intersectObjects( objects );

  if ( intersects.length > 0 ) {

    if ( INTERSECTED != intersects[ 0 ].object ) {

      // if ( INTERSECTED ) INTERSECTED.material.color.setHex( INTERSECTED.currentHex );

      INTERSECTED = intersects[ 0 ].object;
      // INTERSECTED.currentHex = INTERSECTED.material.color.getHex();

      plane.setFromNormalAndCoplanarPoint(
        camera.getWorldDirection( plane.normal ),
        INTERSECTED.position );

    }

    container.style.cursor = 'pointer';

  } else {

    // if ( INTERSECTED ) INTERSECTED.material.color.setHex( INTERSECTED.currentHex );

    INTERSECTED = null;

    container.style.cursor = 'auto';

  }

}

function onDocumentMouseDown( event ) {

  event.preventDefault();

  raycaster.setFromCamera( mouse, camera );

  var intersects = raycaster.intersectObjects( objects );

  if ( intersects.length > 0 ) {

    controls.enabled = false;

    SELECTED = intersects[ 0 ].object;

    if ( raycaster.ray.intersectPlane( plane, intersection ) ) {

      offset.copy( intersection ).sub( SELECTED.position );

    }

    container.style.cursor = 'move';

  }

}

function onDocumentMouseUp( event ) {

  event.preventDefault();

  controls.enabled = true;

  if ( INTERSECTED ) {

    SELECTED = null;

  }

  container.style.cursor = 'auto';

}




////////////////////
// CLASSES
////////////////////

function Animation() {
  var model = new THREE.SphereGeometry(10, 24, 24);

  //THREE.BAS.Utils.separateFaces(model);

  var geometry = new THREE.BAS.ModelBufferGeometry(model);

  geometry.createAttribute('aSmearFactor', 1, function(data) {
    data[0] = 1.0 + THREE.Math.randFloatSpread(0);
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
  this.position.copy(target);
  // TweenMax.to(this.position, 10, {x:target.x, y:target.y, z:target.z, ease:Power0.easeIn});
};
