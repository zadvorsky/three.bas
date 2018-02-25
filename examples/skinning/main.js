window.onload = () => {
  const root = new THREERoot({
    fov: 60
  });
  root.renderer.setClearColor(0x222222);
  root.camera.position.set(0, 0, 100);

  let light = new THREE.DirectionalLight(0xffffff);
  root.add(light);

  light = new THREE.DirectionalLight(0xffffff);
  light.position.y = -1;
  root.add(light);

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

  BAS.Utils.separateFaces(baseGeometry);

  for (let i = 0; i < baseGeometry.vertices.length; i++) {
    const vertex = baseGeometry.vertices[i];
    const y = (vertex.y + sizing.halfHeight);
    const skinIndex = Math.floor(y / sizing.segmentHeight);
    const skinWeight = (y % sizing.segmentHeight) / sizing.segmentHeight;

    baseGeometry.skinIndices.push(new THREE.Vector4(skinIndex, skinIndex + 1, 0, 0));
    baseGeometry.skinWeights.push(new THREE.Vector4(1 - skinWeight, skinWeight, 0, 0));
  }

  const geometry = new BAS.ModelBufferGeometry(baseGeometry, {
    computeCentroids: true,
    localizeFaces: true
  });

  // this needs to be called to create attributes used for skinning
  geometry.bufferSkinning();

  // position (copy centroid position)

  geometry.createAttribute('aPosition', 3, function(data, i) {
    geometry.centroids[i].toArray(data);
  });

  // rotation (this is completely arbitrary)

  const axis = new THREE.Vector3();

  geometry.createAttribute('aAxisAngle', 4, function(data, i) {
    axis.copy(geometry.centroids[i]).normalize();
    axis.toArray(data);
    data[3] = Math.PI * 2;
  });

  console.log('g', geometry);

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

////////////////////
// CLASSES
////////////////////
