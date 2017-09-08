import { BufferGeometry, BufferAttribute } from 'three';
/**
 * A THREE.BufferGeometry where a 'prefab' geometry is repeated a number of times.
 *
 * @param {THREE.Geometry} prefab The THREE.Geometry instance to repeat.
 * @param {Number} count The number of times to repeat the geometry.
 * @constructor
 */
function PrefabBufferGeometry(prefab, count) {
  BufferGeometry.call(this);
  
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
  this.prefabVertexCount = prefab.vertices.length;
  
  this.bufferIndices();
  this.bufferPositions();
}
PrefabBufferGeometry.prototype = Object.create(BufferGeometry.prototype);
PrefabBufferGeometry.prototype.constructor = PrefabBufferGeometry;

PrefabBufferGeometry.prototype.bufferIndices = function() {
  const prefabFaceCount = this.prefabGeometry.faces.length;
  const prefabIndexCount = this.prefabGeometry.faces.length * 3;
  const prefabIndices = [];
  
  for (let h = 0; h < prefabFaceCount; h++) {
    const face = this.prefabGeometry.faces[h];
    prefabIndices.push(face.a, face.b, face.c);
  }
  
  const indexBuffer = new Uint32Array(this.prefabCount * prefabIndexCount);
  
  this.setIndex(new BufferAttribute(indexBuffer, 1));
  
  for (let i = 0; i < this.prefabCount; i++) {
    for (let k = 0; k < prefabIndexCount; k++) {
      indexBuffer[i * prefabIndexCount + k] = prefabIndices[k] + i * this.prefabVertexCount;
    }
  }
};

PrefabBufferGeometry.prototype.bufferPositions = function() {
  const positionBuffer = this.createAttribute('position', 3).array;
  
  for (let i = 0, offset = 0; i < this.prefabCount; i++) {
    for (let j = 0; j < this.prefabVertexCount; j++, offset += 3) {
      const prefabVertex = this.prefabGeometry.vertices[j];
      
      positionBuffer[offset    ] = prefabVertex.x;
      positionBuffer[offset + 1] = prefabVertex.y;
      positionBuffer[offset + 2] = prefabVertex.z;
    }
  }
};

/**
 * Creates a THREE.BufferAttribute with UV coordinates.
 */
PrefabBufferGeometry.prototype.bufferUvs = function() {
  const prefabFaceCount = this.prefabGeometry.faces.length;
  const prefabVertexCount = this.prefabVertexCount = this.prefabGeometry.vertices.length;
  const prefabUvs = [];
  
  for (let h = 0; h < prefabFaceCount; h++) {
    const face = this.prefabGeometry.faces[h];
    const uv = this.prefabGeometry.faceVertexUvs[0][h];
    
    prefabUvs[face.a] = uv[0];
    prefabUvs[face.b] = uv[1];
    prefabUvs[face.c] = uv[2];
  }
  
  const uvBuffer = this.createAttribute('uv', 2);
  
  for (let i = 0, offset = 0; i < this.prefabCount; i++) {
    for (let j = 0; j < prefabVertexCount; j++, offset += 2) {
      let prefabUv = prefabUvs[j];
      
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
PrefabBufferGeometry.prototype.createAttribute = function(name, itemSize, factory) {
  const buffer = new Float32Array(this.prefabCount * this.prefabVertexCount * itemSize);
  const attribute = new BufferAttribute(buffer, itemSize);
  
  this.addAttribute(name, attribute);
  
  if (factory) {
    const data = [];
    
    for (let i = 0; i < this.prefabCount; i++) {
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
PrefabBufferGeometry.prototype.setPrefabData = function(attribute, prefabIndex, data) {
  attribute = (typeof attribute === 'string') ? this.attributes[attribute] : attribute;
  
  let offset = prefabIndex * this.prefabVertexCount * attribute.itemSize;
  
  for (let i = 0; i < this.prefabVertexCount; i++) {
    for (let j = 0; j < attribute.itemSize; j++) {
      attribute.array[offset++] = data[j];
    }
  }
};

export { PrefabBufferGeometry };
