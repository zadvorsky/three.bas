import { BufferGeometry, BufferAttribute } from 'three';
/**
 * A BufferGeometry where a 'prefab' geometry array is repeated a number of times.
 *
 * @param {Array} prefabs An array with Geometry instances to repeat.
 * @param {Number} repeatCount The number of times to repeat the array of Geometries.
 * @constructor
 */
function MultiPrefabBufferGeometry(prefabs, repeatCount) {
  BufferGeometry.call(this);

  if (Array.isArray(prefabs)) {
    this.prefabGeometries = prefabs;
  } else {
    this.prefabGeometries = [prefabs];
  }

  this.prefabGeometriesCount = this.prefabGeometries.length;

  /**
   * Number of prefabs.
   * @type {Number}
   */
  this.prefabCount = repeatCount * this.prefabGeometriesCount;
  /**
   * How often the prefab array is repeated.
   * @type {Number}
   */
  this.repeatCount = repeatCount;
  
  /**
   * Array of vertex counts per prefab.
   * @type {Array}
   */
  this.prefabVertexCounts = this.prefabGeometries.map(p => p.isBufferGeometry ? p.attributes.position.count : p.vertices.length);
  /**
   * Total number of vertices for one repetition of the prefabs
   * @type {number}
   */
  this.repeatVertexCount = this.prefabVertexCounts.reduce((r, v) => r + v, 0);

  this.bufferIndices();
  this.bufferPositions();
}
MultiPrefabBufferGeometry.prototype = Object.create(BufferGeometry.prototype);
MultiPrefabBufferGeometry.prototype.constructor = MultiPrefabBufferGeometry;

MultiPrefabBufferGeometry.prototype.bufferIndices = function() {
  let repeatIndexCount = 0;

  this.prefabIndices = this.prefabGeometries.map(geometry => {
    let indices = [];

    if (geometry.isBufferGeometry) {
      if (geometry.index) {
        indices = geometry.index.array;
      } else {
        for (let i = 0; i < geometry.attributes.position.count; i++) {
          indices.push(i);
        }
      }
    } else {
      for (let i = 0; i < geometry.faces.length; i++) {
        const face = geometry.faces[i];
        indices.push(face.a, face.b, face.c);
      }
    }

    repeatIndexCount += indices.length;

    return indices;
  });

  const indexBuffer = new Uint32Array(repeatIndexCount * this.repeatCount);
  let indexOffset = 0;
  let prefabOffset = 0;

  for (let i = 0; i < this.prefabCount; i++) {
    const index = i % this.prefabGeometriesCount;
    const indices = this.prefabIndices[index];
    const vertexCount = this.prefabVertexCounts[index];

    for (let j = 0; j < indices.length; j++) {
      indexBuffer[indexOffset++] = indices[j] + prefabOffset;
    }

    prefabOffset += vertexCount;
  }

  this.setIndex(new BufferAttribute(indexBuffer, 1));
};

MultiPrefabBufferGeometry.prototype.bufferPositions = function() {
  const positionBuffer = this.createAttribute('position', 3).array;

  const prefabPositions = this.prefabGeometries.map((geometry, i) => {
    let positions;

    if (geometry.isBufferGeometry) {
      positions = geometry.attributes.position.array;
    } else {

      const vertexCount = this.prefabVertexCounts[i];

      positions = [];

      for (let j = 0, offset = 0; j < vertexCount; j++) {
        const prefabVertex = geometry.vertices[j];

        positions[offset++] = prefabVertex.x;
        positions[offset++] = prefabVertex.y;
        positions[offset++] = prefabVertex.z;
      }
    }

    return positions;
  });

  for (let i = 0, offset = 0; i < this.prefabCount; i++) {
    const index = i % this.prefabGeometries.length;
    const vertexCount = this.prefabVertexCounts[index];
    const positions = prefabPositions[index];

    for (let j = 0; j < vertexCount; j++) {
      positionBuffer[offset++] = positions[j * 3];
      positionBuffer[offset++] = positions[j * 3 + 1];
      positionBuffer[offset++] = positions[j * 3 + 2];
    }
  }
};

/**
 * Creates a BufferAttribute with UV coordinates.
 */
MultiPrefabBufferGeometry.prototype.bufferUvs = function() {
  const uvBuffer = this.createAttribute('uv', 2).array;

  const prefabUvs = this.prefabGeometries.map((geometry, i) => {
    let uvs;

    if (geometry.isBufferGeometry) {
      if (!geometry.attributes.uv) {
        console.error('No UV found in prefab geometry', geometry);
      }

      uvs = geometry.attributes.uv.array;
    } else {
      const prefabFaceCount = this.prefabIndices[i].length / 3;
      const uvObjects = [];

      for (let j = 0; j < prefabFaceCount; j++) {
        const face = geometry.faces[j];
        const uv = geometry.faceVertexUvs[0][j];

        uvObjects[face.a] = uv[0];
        uvObjects[face.b] = uv[1];
        uvObjects[face.c] = uv[2];
      }

      uvs = [];

      for (let k = 0; k < uvObjects.length; k++) {
        uvs[k * 2] = uvObjects[k].x;
        uvs[k * 2 + 1] = uvObjects[k].y;
      }
    }

    return uvs;
  });

  for (let i = 0, offset = 0; i < this.prefabCount; i++) {

    const index = i % this.prefabGeometries.length;
    const vertexCount = this.prefabVertexCounts[index];
    const uvs = prefabUvs[index];

    for (let j = 0; j < vertexCount; j++) {
      uvBuffer[offset++] = uvs[j * 2];
      uvBuffer[offset++] = uvs[j * 2 + 1];
    }
  }
};

/**
 * Creates a BufferAttribute on this geometry instance.
 *
 * @param {String} name Name of the attribute.
 * @param {Number} itemSize Number of floats per vertex (typically 1, 2, 3 or 4).
 * @param {function=} factory Function that will be called for each prefab upon creation. Accepts 3 arguments: data[], index and prefabCount. Calls setPrefabData.
 *
 * @returns {BufferAttribute}
 */
MultiPrefabBufferGeometry.prototype.createAttribute = function(name, itemSize, factory) {
  const buffer = new Float32Array(this.repeatCount * this.repeatVertexCount * itemSize);
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
 * @param {String|BufferAttribute} attribute The attribute or attribute name where the data is to be stored.
 * @param {Number} prefabIndex Index of the prefab in the buffer geometry.
 * @param {Array} data Array of data. Length should be equal to item size of the attribute.
 */
MultiPrefabBufferGeometry.prototype.setPrefabData = function(attribute, prefabIndex, data) {
  attribute = (typeof attribute === 'string') ? this.attributes[attribute] : attribute;

  const prefabGeometryIndex = prefabIndex % this.prefabGeometriesCount;
  const prefabGeometryVertexCount = this.prefabVertexCounts[prefabGeometryIndex];
  const whole = (prefabIndex / this.prefabGeometriesCount | 0) * this.prefabGeometriesCount;
  const wholeOffset = whole * this.repeatVertexCount;
  const part = prefabIndex - whole;
  let partOffset = 0;
  let i = 0;

  while(i < part) {
    partOffset += this.prefabVertexCounts[i++];
  }

  let offset = (wholeOffset + partOffset) * attribute.itemSize;

  for (let i = 0; i < prefabGeometryVertexCount; i++) {
    for (let j = 0; j < attribute.itemSize; j++) {
      attribute.array[offset++] = data[j];
    }
  }
};

export { MultiPrefabBufferGeometry };
