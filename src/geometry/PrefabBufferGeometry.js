/**
 * A THREE.BufferGeometry where a 'prefab' geometry is repeated a number of times.
 *
 * @param {THREE.Geometry} prefab The THREE.Geometry instance to repeat.
 * @param {Number} count The number of times to repeat the geometry.
 * @constructor
 */
THREE.BAS.PrefabBufferGeometry = function(prefab, count, isBufferGeometry) {
  THREE.BufferGeometry.call(this);

	this._isBufferGeometry = isBufferGeometry;

  /**
   * A reference to the prefab geometry used to create this instance.
   * @type {THREE.Geometry}
   */
  this.prefabGeometry = prefab;

  /**
   * Number of prefabs.
   * @type {Number}
   */
  this.prefabCount = count;

  /**
   * Number of vertices of the prefab.
   * @type {Number}
   */
	if (this._isBufferGeometry) {
		this.prefabVertexCount = prefab.attributes.position.count;
	} else {
		this.prefabVertexCount = prefab.vertices.length;
	}

  this.bufferIndices();
  this.bufferPositions();
};
THREE.BAS.PrefabBufferGeometry.prototype = Object.create(THREE.BufferGeometry.prototype);
THREE.BAS.PrefabBufferGeometry.prototype.constructor = THREE.BAS.PrefabBufferGeometry;

THREE.BAS.PrefabBufferGeometry.prototype.bufferIndices = function() {
  var prefabIndices = [];

	if (this._isBufferGeometry) {
		var prefabIndexCount = this.prefabVertexCount;

		for (var h = 0; h < prefabIndexCount; h++) {
			prefabIndices.push(h);
		}
	} else {
		var prefabFaceCount = this.prefabGeometry.faces.length;
		var prefabIndexCount = this.prefabGeometry.faces.length * 3;

		for (var h = 0; h < prefabFaceCount; h++) {
			var face = this.prefabGeometry.faces[h];
			prefabIndices.push(face.a, face.b, face.c);
		}
	}

  var indexBuffer = new Uint32Array(this.prefabCount * prefabIndexCount);

  this.setIndex(new THREE.BufferAttribute(indexBuffer, 1));

  for (var i = 0; i < this.prefabCount; i++) {
    for (var k = 0; k < prefabIndexCount; k++) {
      indexBuffer[i * prefabIndexCount + k] = prefabIndices[k] + i * this.prefabVertexCount;
    }
  }
};

THREE.BAS.PrefabBufferGeometry.prototype.bufferPositions = function() {
  var positionBuffer = this.createAttribute('position', 3).array;

	if (this._isBufferGeometry) {
		var positions = this.prefabGeometry.attributes.position.array;

		for (var i = 0, offset = 0; i < this.prefabCount; i++) {
			for (var j = 0; j < this.prefabVertexCount; j++, offset += 3) {
				positionBuffer[offset    ] = positions[j * 3];
				positionBuffer[offset + 1] = positions[j * 3 + 1];
				positionBuffer[offset + 2] = positions[j * 3 + 2];
			}
		}
	} else {
		for (var i = 0, offset = 0; i < this.prefabCount; i++) {
			for (var j = 0; j < this.prefabVertexCount; j++, offset += 3) {
				var prefabVertex = this.prefabGeometry.vertices[j];

				positionBuffer[offset    ] = prefabVertex.x;
				positionBuffer[offset + 1] = prefabVertex.y;
				positionBuffer[offset + 2] = prefabVertex.z;
			}
		}
	}

};

/**
 * Creates a THREE.BufferAttribute with UV coordinates.
 */
THREE.BAS.PrefabBufferGeometry.prototype.bufferUvs = function() {
	var prefabUvs = [];

	var prefabVertexCount;

	if (this._isBufferGeometry) {
		prefabVertexCount = this.prefabGeometry.attributes.position.count;
		var uv = this.prefabGeometry.attributes.uv.array;
		
		for (var h = 0; h < prefabVertexCount; h++) {
			prefabUvs.push(new THREE.Vector2(uv[h * 2], uv[h * 2 + 1]));
		}
	} else {
		prefabVertexCount = this.prefabGeometry.vertices.length;

		var prefabFaceCount = this.prefabGeometry.faces.length;

		for (var h = 0; h < prefabFaceCount; h++) {
			var face = this.prefabGeometry.faces[h];
			var uv = this.prefabGeometry.faceVertexUvs[0][h];

			prefabUvs[face.a] = uv[0];
			prefabUvs[face.b] = uv[1];
			prefabUvs[face.c] = uv[2];
		}
	}

	this.prefabVertexCount = prefabVertexCount;

  var uvBuffer = this.createAttribute('uv', 2);

  for (var i = 0, offset = 0; i < this.prefabCount; i++) {
    for (var j = 0; j < prefabVertexCount; j++, offset += 2) {
      var prefabUv = prefabUvs[j];

      uvBuffer.array[offset] = prefabUv.x;
      uvBuffer.array[offset + 1] = prefabUv.y;
    }
  }
};

/**
 * Creates a THREE.BufferAttribute on this geometry instance.
 *
 * @param {String} name Name of the attribute.
 * @param {Number} itemSize Number of floats per vertex (typically 1, 2, 3 or 4).
 * @param {function=} factory Function that will be called for each prefab upon creation. Accepts 3 arguments: data[], index and prefabCount. Calls setPrefabData.
 *
 * @returns {THREE.BufferAttribute}
 */
THREE.BAS.PrefabBufferGeometry.prototype.createAttribute = function(name, itemSize, factory) {
  var buffer = new Float32Array(this.prefabCount * this.prefabVertexCount * itemSize);
  var attribute = new THREE.BufferAttribute(buffer, itemSize);

  this.addAttribute(name, attribute);

  if (factory) {
    var data = [];

    for (var i = 0; i < this.prefabCount; i++) {
      factory(data, i, this.prefabCount);
      this.setPrefabData(attribute, i, data);
    }
  }

  return attribute;
};

/**
 * Sets data for all vertices of a prefab at a given index.
 * Usually called in a loop.
 *
 * @param {String|THREE.BufferAttribute} attribute The attribute or attribute name where the data is to be stored.
 * @param {Number} prefabIndex Index of the prefab in the buffer geometry.
 * @param {Array} data Array of data. Length should be equal to item size of the attribute.
 */
THREE.BAS.PrefabBufferGeometry.prototype.setPrefabData = function(attribute, prefabIndex, data) {
  attribute = (typeof attribute === 'string') ? this.attributes[attribute] : attribute;

  var offset = prefabIndex * this.prefabVertexCount * attribute.itemSize;

  for (var i = 0; i < this.prefabVertexCount; i++) {
    for (var j = 0; j < attribute.itemSize; j++) {
      attribute.array[offset++] = data[j];
    }
  }
};
