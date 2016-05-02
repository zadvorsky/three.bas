THREE.BAS.ModelBufferGeometry = function (model) {
  THREE.BufferGeometry.call(this);

  this.modelGeometry = model;
  this.faceCount = this.modelGeometry.faces.length;
  this.vertexCount = this.modelGeometry.vertices.length;

  this.bufferIndices();
  this.bufferPositions();
};
THREE.BAS.ModelBufferGeometry.prototype = Object.create(THREE.BufferGeometry.prototype);
THREE.BAS.ModelBufferGeometry.prototype.constructor = THREE.BAS.ModelBufferGeometry;

THREE.BAS.ModelBufferGeometry.prototype.bufferIndices = function () {
  var indexBuffer = new Uint32Array(this.faceCount * 3);

  this.setIndex(new THREE.BufferAttribute(indexBuffer, 1));

  for (var i = 0, offset = 0; i < this.faceCount; i++, offset += 3) {
    var face = this.modelGeometry.faces[i];

    indexBuffer[offset    ] = face.a;
    indexBuffer[offset + 1] = face.b;
    indexBuffer[offset + 2] = face.c;
  }
};

THREE.BAS.ModelBufferGeometry.prototype.bufferPositions = function() {
  var positionBuffer = this.createAttribute('position', 3).array;

  for (var i = 0, offset = 0; i < this.vertexCount; i++, offset += 3) {
    var vertex = this.modelGeometry.vertices[i];

    positionBuffer[offset    ] = vertex.x;
    positionBuffer[offset + 1] = vertex.y;
    positionBuffer[offset + 2] = vertex.z;
  }
};

THREE.BAS.ModelBufferGeometry.prototype.bufferUVs = function() {
  var uvBuffer = this.createAttribute('uv', 2).array;

  for (var i = 0; i < this.faceCount; i++) {

    var face = this.modelGeometry.faces[i];
    var uv;

    uv = this.modelGeometry.faceVertexUvs[0][i][0];
    uvBuffer[face.a * 2]     = uv.x;
    uvBuffer[face.a * 2 + 1] = uv.y;

    uv = this.modelGeometry.faceVertexUvs[0][i][1];
    uvBuffer[face.b * 2]     = uv.x;
    uvBuffer[face.b * 2 + 1] = uv.y;

    uv = this.modelGeometry.faceVertexUvs[0][i][2];
    uvBuffer[face.c * 2]     = uv.x;
    uvBuffer[face.c * 2 + 1] = uv.y;
  }
};

THREE.BAS.ModelBufferGeometry.prototype.createAttribute = function (name, itemSize) {
  var buffer = new Float32Array(this.vertexCount * itemSize);
  var attribute = new THREE.BufferAttribute(buffer, itemSize);

  this.addAttribute(name, attribute);

  return attribute;
};
