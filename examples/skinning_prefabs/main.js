window.onload = () => {
  const root = new THREERoot({
    fov: 60
  });
  root.renderer.setClearColor(0x222222);
  root.camera.position.set(0, 0, 100);

  let light = new THREE.DirectionalLight(0xffffff);
  root.add(light);

  light = new THREE.DirectionalLight(0xffffff);
  light.position.z = 1;
  root.add(light);

  // mesh / skeleton based on https://threejs.org/docs/scenes/bones-browser.html

  const segmentHeight = 8;
  const segmentCount = 4;
  const height = segmentHeight * segmentCount;
  const halfHeight = height * 0.5;
  const sizing = {
    segmentHeight,
    segmentCount,
    height,
    halfHeight
  };

  const bones = createBones(sizing);
  const geometry = createGeometry(sizing);
  const mesh = createMesh(geometry, bones);
  const skeletonHelper = new THREE.SkeletonHelper(mesh);

  root.add(skeletonHelper);
  root.add(mesh);

  let time = 0;

  root.addUpdateCallback(() => {
    time += (1/60);

    mesh.material.uniforms.time.value = time % 1;

    bones.forEach(bone => {
      bone.rotation.z = Math.sin(time) * 0.25;
    })
  });
};

function createBones(sizing) {
  const bones = [];
  let prevBone = new THREE.Bone();

  bones.push(prevBone);
  prevBone.position.y = -sizing.halfHeight;

  for (let i = 0; i < sizing.segmentCount; i++) {
    const bone = new THREE.Bone();
    bone.position.y = sizing.segmentHeight;
    bones.push(bone);
    prevBone.add(bone);
    prevBone = bone;
  }

  return bones;
}

function createGeometry(sizing) {
  const baseGeometry = new THREE.CylinderGeometry(
    5,                       // radiusTop
    5,                       // radiusBottom
    sizing.height,           // height
    8,                       // radiusSegments
    sizing.segmentCount * 4, // heightSegments
    true                     // openEnded
  );

  for (let i = 0; i < baseGeometry.vertices.length; i++) {
    const vertex = baseGeometry.vertices[i];
    const y = (vertex.y + sizing.halfHeight);
    const skinIndex = Math.floor(y / sizing.segmentHeight);
    const skinWeight = (y % sizing.segmentHeight) / sizing.segmentHeight;

    // skinIndices = indices of up to 4 bones for the vertex to be influenced by
    baseGeometry.skinIndices.push(new THREE.Vector4(skinIndex, skinIndex + 1, 0, 0));
    // skinWeights = weights for each of the bones referenced by index above (between 0 and 1)
    baseGeometry.skinWeights.push(new THREE.Vector4(1 - skinWeight, skinWeight, 0, 0));
  }

  // create a prefab for each vertex

  const prefab = new THREE.TetrahedronGeometry(1);
  const prefabCount = baseGeometry.vertices.length;
  const geometry = new BAS.PrefabBufferGeometry(prefab, prefabCount);

  // position (copy vertex position)

  geometry.createAttribute('aPosition', 3, function(data, i) {
    baseGeometry.vertices[i].toArray(data);
  });

  // skin indices, copy from geometry, based on vertex

  geometry.createAttribute('skinIndex', 4, (data, i) => {
    baseGeometry.skinIndices[i].toArray(data);
  });

  // skin weights, copy from geometry, based on vertex

  geometry.createAttribute('skinWeight', 4, (data, i) => {
    baseGeometry.skinWeights[i].toArray(data);
  });

  // rotation (this is completely arbitrary)

  const axis = new THREE.Vector3();

  geometry.createAttribute('aAxisAngle', 4, function(data, i) {
    BAS.Utils.randomAxis(axis);
    axis.toArray(data);
    data[3] = Math.PI * 2;
  });

  return geometry;
}

function createMesh(geometry, bones) {
  const material = new BAS.StandardAnimationMaterial({
    skinning: true,
    side: THREE.DoubleSide,
    flatShading: true,
    uniforms: {
      time: {value: 0},
    },
    vertexParameters: `
      uniform float time;
      
      attribute vec3 aPosition;
      attribute vec4 aAxisAngle;
    `,
    vertexFunctions: [
      BAS.ShaderChunk.quaternion_rotation
    ],
    vertexPosition: `
      vec4 q = quatFromAxisAngle(aAxisAngle.xyz, aAxisAngle.w * time);
      
      transformed = rotateVector(q, transformed);
      
      transformed += aPosition;
    `
  });

  const mesh = new THREE.SkinnedMesh(geometry, material);
  const skeleton = new THREE.Skeleton(bones);

  mesh.add(bones[0]);
  mesh.bind(skeleton);

  return mesh;
}
