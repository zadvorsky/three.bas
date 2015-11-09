THREE.BAS.ModelBufferGeometry = function (model) {
  THREE.BufferGeometry.call(this);

  this.modelGeometry = model;

  this.bufferDefaults();
};
THREE.BAS.ModelBufferGeometry.prototype = Object.create(THREE.BufferGeometry.prototype);
THREE.BAS.ModelBufferGeometry.prototype.constructor = THREE.BAS.ModelBufferGeometry;

THREE.BAS.ModelBufferGeometry.prototype.bufferDefaults = function () {
  var modelFaceCount = this.faceCount = this.modelGeometry.faces.length;
  var modelVertexCount = this.vertexCount = this.modelGeometry.vertices.length;

  var indexBuffer = new Uint32Array(modelFaceCount * 3);
  var positionBuffer = new Float32Array(modelVertexCount * 3);

  this.setIndex(new THREE.BufferAttribute(indexBuffer, 1));
  this.addAttribute('position', new THREE.BufferAttribute(positionBuffer, 3));

  var i, offset;

  for (i = 0, offset = 0; i < modelVertexCount; i++, offset += 3) {
    var prefabVertex = this.modelGeometry.vertices[i];

    positionBuffer[offset    ] = prefabVertex.x;
    positionBuffer[offset + 1] = prefabVertex.y;
    positionBuffer[offset + 2] = prefabVertex.z;
  }

  for (i = 0, offset = 0; i < modelFaceCount; i++, offset += 3) {
    var face = this.modelGeometry.faces[i];

    indexBuffer[offset    ] = face.a;
    indexBuffer[offset + 1] = face.b;
    indexBuffer[offset + 2] = face.c;
  }
};






THREE.BAS.ModelBufferGeometry.prototype.createAttribute = function (name, itemSize) {
  var buffer = new Float32Array(this.vertexCount * itemSize);
  var attribute = new THREE.BufferAttribute(buffer, itemSize);

  this.addAttribute(name, attribute);

  return attribute;
};


