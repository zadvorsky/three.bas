import { BufferGeometry, BufferAttribute } from 'three';

class PrefabBufferGeometry extends BufferGeometry {
  /**
   * A BufferGeometry where a 'prefab' geometry is repeated a number of times.
   *
   * @param {Geometry|BufferGeometry} prefab The Geometry instance to repeat.
   * @param {Number} count The number of times to repeat the geometry.
   */
  constructor (prefab, count) {
    super();

    /**
     * A reference to the prefab geometry used to create this instance.
     * @type {Geometry|BufferGeometry}
     */
    this.prefabGeometry = prefab;
    this.isPrefabBufferGeometry = prefab.isBufferGeometry;

    /**
     * Number of prefabs.
     * @type {Number}
     */
    this.prefabCount = count;

    /**
     * Number of vertices of the prefab.
     * @type {Number}
     */
    if (this.isPrefabBufferGeometry) {
      this.prefabVertexCount = prefab.attributes.position.count;
    }
    else {
      this.prefabVertexCount = prefab.vertices.length;
    }

    this.bufferIndices();
    this.bufferPositions();
  }

  bufferIndices () {
    let prefabIndices = [];
    let prefabIndexCount;

    if (this.isPrefabBufferGeometry) {
      if (this.prefabGeometry.index) {
        prefabIndexCount = this.prefabGeometry.index.count;
        prefabIndices = this.prefabGeometry.index.array;
      }
      else {
        prefabIndexCount = this.prefabVertexCount;

        for (let i = 0; i < prefabIndexCount; i++) {
          prefabIndices.push(i);
        }
      }
    }
    else {
      const prefabFaceCount = this.prefabGeometry.faces.length;
      prefabIndexCount = prefabFaceCount * 3;

      for (let i = 0; i < prefabFaceCount; i++) {
        const face = this.prefabGeometry.faces[i];
        prefabIndices.push(face.a, face.b, face.c);
      }
    }

    const indexBuffer = new Uint32Array(this.prefabCount * prefabIndexCount);

    this.setIndex(new BufferAttribute(indexBuffer, 1));

    for (let i = 0; i < this.prefabCount; i++) {
      for (let k = 0; k < prefabIndexCount; k++) {
        indexBuffer[i * prefabIndexCount + k] = prefabIndices[k] + i * this.prefabVertexCount;
      }
    }
  }

  bufferPositions () {
    const positionBuffer = this.createAttribute('position', 3).array;

    if (this.isPrefabBufferGeometry) {
      const positions = this.prefabGeometry.attributes.position.array;

      for (let i = 0, offset = 0; i < this.prefabCount; i++) {
        for (let j = 0; j < this.prefabVertexCount; j++, offset += 3) {
          positionBuffer[offset    ] = positions[j * 3];
          positionBuffer[offset + 1] = positions[j * 3 + 1];
          positionBuffer[offset + 2] = positions[j * 3 + 2];
        }
      }
    }
    else {
      for (let i = 0, offset = 0; i < this.prefabCount; i++) {
        for (let j = 0; j < this.prefabVertexCount; j++, offset += 3) {
          const prefabVertex = this.prefabGeometry.vertices[j];

          positionBuffer[offset    ] = prefabVertex.x;
          positionBuffer[offset + 1] = prefabVertex.y;
          positionBuffer[offset + 2] = prefabVertex.z;
        }
      }
    }
  }

  bufferUvs () {
    const uvBuffer = this.createAttribute('uv', 2).array;

    if (this.isPrefabBufferGeometry) {
      const uvs = this.prefabGeometry.attributes.uv.array

      for (let i = 0, offset = 0; i < this.prefabCount; i++) {
        for (let j = 0; j < this.prefabVertexCount; j++, offset += 2) {
          uvBuffer[offset    ] = uvs[j * 2];
          uvBuffer[offset + 1] = uvs[j * 2 + 1];
        }
      }
    } else {
      const prefabFaceCount = this.prefabGeometry.faces.length;
      const uvs = []

      for (let i = 0; i < prefabFaceCount; i++) {
        const face = this.prefabGeometry.faces[i];
        const uv = this.prefabGeometry.faceVertexUvs[0][i];

        uvs[face.a] = uv[0];
        uvs[face.b] = uv[1];
        uvs[face.c] = uv[2];
      }

      for (let i = 0, offset = 0; i < this.prefabCount; i++) {
        for (let j = 0; j < this.prefabVertexCount; j++, offset += 2) {
          const uv = uvs[j];

          uvBuffer[offset] = uv.x;
          uvBuffer[offset + 1] = uv.y;
        }
      }
    }
  }

  /**
   * Creates a BufferAttribute on this geometry instance.
   *
   * @param {String} name Name of the attribute.
   * @param {Number} itemSize Number of floats per vertex (typically 1, 2, 3 or 4).
   * @param {function=} factory Function that will be called for each prefab upon creation. Accepts 3 arguments: data[], index and prefabCount. Calls setPrefabData.
   *
   * @returns {BufferAttribute}
   */
  createAttribute (name, itemSize, factory) {
    const buffer = new Float32Array(this.prefabCount * this.prefabVertexCount * itemSize);
    const attribute = new BufferAttribute(buffer, itemSize);

    this.setAttribute(name, attribute);

    if (factory) {
      const data = [];

      for (let i = 0; i < this.prefabCount; i++) {
        factory(data, i, this.prefabCount);
        this.setPrefabData(attribute, i, data);
      }
    }

    return attribute;
  }

  /**
   * Sets data for all vertices of a prefab at a given index.
   * Usually called in a loop.
   *
   * @param {String|BufferAttribute} attribute The attribute or attribute name where the data is to be stored.
   * @param {Number} prefabIndex Index of the prefab in the buffer geometry.
   * @param {Array} data Array of data. Length should be equal to item size of the attribute.
   */
  setPrefabData (attribute, prefabIndex, data) {
    attribute = (typeof attribute === 'string') ? this.attributes[attribute] : attribute;

    let offset = prefabIndex * this.prefabVertexCount * attribute.itemSize;

    for (let i = 0; i < this.prefabVertexCount; i++) {
      for (let j = 0; j < attribute.itemSize; j++) {
        attribute.array[offset++] = data[j];
      }
    }
  }
}

export { PrefabBufferGeometry };
