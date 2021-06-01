import { BufferGeometry, BufferAttribute } from 'three';
import { Utils } from '../Utils';

class ModelBufferGeometry extends BufferGeometry {
  /**
   * A THREE.BufferGeometry for animating individual faces of a THREE.Geometry.
   *
   * @param {THREE.Geometry} model The THREE.Geometry to base this geometry on.
   * @param {Object=} options
   * @param {Boolean=} options.computeCentroids If true, a centroids will be computed for each face and stored in THREE.BAS.ModelBufferGeometry.centroids.
   * @param {Boolean=} options.localizeFaces If true, the positions for each face will be stored relative to the centroid. This is useful if you want to rotate or scale faces around their center.
   */
  constructor (model, options) {
    super();

    /**
     * A reference to the geometry used to create this instance.
     * @type {THREE.Geometry}
     */
    this.modelGeometry = model;

    /**
     * Number of faces of the model.
     * @type {Number}
     */
    this.faceCount = this.modelGeometry.faces.length;

    /**
     * Number of vertices of the model.
     * @type {Number}
     */
    this.vertexCount = this.modelGeometry.vertices.length;

    options = options || {};
    options.computeCentroids && this.computeCentroids();

    this.bufferIndices();
    this.bufferPositions(options.localizeFaces);
  }

  /**
   * Computes a centroid for each face and stores it in THREE.BAS.ModelBufferGeometry.centroids.
   */
  computeCentroids () {
    /**
     * An array of centroids corresponding to the faces of the model.
     *
     * @type {Array}
     */
    this.centroids = [];

    for (let i = 0; i < this.faceCount; i++) {
      this.centroids[i] = Utils.computeCentroid(this.modelGeometry, this.modelGeometry.faces[i]);
    }
  }

  bufferIndices () {
    const indexBuffer = new Uint32Array(this.faceCount * 3);

    this.setIndex(new BufferAttribute(indexBuffer, 1));

    for (let i = 0, offset = 0; i < this.faceCount; i++, offset += 3) {
      const face = this.modelGeometry.faces[i];

      indexBuffer[offset    ] = face.a;
      indexBuffer[offset + 1] = face.b;
      indexBuffer[offset + 2] = face.c;
    }
  }

  bufferPositions (localizeFaces) {
    const positionBuffer = this.createAttribute('position', 3).array;
    let i, offset;

    if (localizeFaces === true) {
      for (i = 0; i < this.faceCount; i++) {
        const face = this.modelGeometry.faces[i];
        const centroid = this.centroids ? this.centroids[i] : Utils.computeCentroid(this.modelGeometry, face);

        const a = this.modelGeometry.vertices[face.a];
        const b = this.modelGeometry.vertices[face.b];
        const c = this.modelGeometry.vertices[face.c];

        positionBuffer[face.a * 3]     = a.x - centroid.x;
        positionBuffer[face.a * 3 + 1] = a.y - centroid.y;
        positionBuffer[face.a * 3 + 2] = a.z - centroid.z;

        positionBuffer[face.b * 3]     = b.x - centroid.x;
        positionBuffer[face.b * 3 + 1] = b.y - centroid.y;
        positionBuffer[face.b * 3 + 2] = b.z - centroid.z;

        positionBuffer[face.c * 3]     = c.x - centroid.x;
        positionBuffer[face.c * 3 + 1] = c.y - centroid.y;
        positionBuffer[face.c * 3 + 2] = c.z - centroid.z;
      }
    }
    else {
      for (i = 0, offset = 0; i < this.vertexCount; i++, offset += 3) {
        const vertex = this.modelGeometry.vertices[i];

        positionBuffer[offset    ] = vertex.x;
        positionBuffer[offset + 1] = vertex.y;
        positionBuffer[offset + 2] = vertex.z;
      }
    }
  }

  /**
   * Creates a THREE.BufferAttribute with UV coordinates.
   */
  bufferUvs () {
    const uvBuffer = this.createAttribute('uv', 2).array;

    for (let i = 0; i < this.faceCount; i++) {

      const face = this.modelGeometry.faces[i];
      let uv;

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
  }

  /**
   * Creates two THREE.BufferAttributes: skinIndex and skinWeight. Both are required for skinning.
   */
  bufferSkinning () {
    const skinIndexBuffer = this.createAttribute('skinIndex', 4).array;
    const skinWeightBuffer = this.createAttribute('skinWeight', 4).array;

    for (let i = 0; i < this.vertexCount; i++) {
      const skinIndex = this.modelGeometry.skinIndices[i];
      const skinWeight = this.modelGeometry.skinWeights[i];

      skinIndexBuffer[i * 4    ] = skinIndex.x;
      skinIndexBuffer[i * 4 + 1] = skinIndex.y;
      skinIndexBuffer[i * 4 + 2] = skinIndex.z;
      skinIndexBuffer[i * 4 + 3] = skinIndex.w;

      skinWeightBuffer[i * 4    ] = skinWeight.x;
      skinWeightBuffer[i * 4 + 1] = skinWeight.y;
      skinWeightBuffer[i * 4 + 2] = skinWeight.z;
      skinWeightBuffer[i * 4 + 3] = skinWeight.w;
    }
  }

  /**
   * Creates a THREE.BufferAttribute on this geometry instance.
   *
   * @param {String} name Name of the attribute.
   * @param {int} itemSize Number of floats per vertex (typically 1, 2, 3 or 4).
   * @param {function=} factory Function that will be called for each face upon creation. Accepts 3 arguments: data[], index and faceCount. Calls setFaceData.
   *
   * @returns {BufferAttribute}
   */
  createAttribute (name, itemSize, factory) {
    const buffer = new Float32Array(this.vertexCount * itemSize);
    const attribute = new BufferAttribute(buffer, itemSize);

    this.setAttribute(name, attribute);

    if (factory) {
      const data = [];

      for (let i = 0; i < this.faceCount; i++) {
        factory(data, i, this.faceCount);
        this.setFaceData(attribute, i, data);
      }
    }

    return attribute;
  }

  /**
   * Sets data for all vertices of a face at a given index.
   * Usually called in a loop.
   *
   * @param {String|THREE.BufferAttribute} attribute The attribute or attribute name where the data is to be stored.
   * @param {int} faceIndex Index of the face in the buffer geometry.
   * @param {Array} data Array of data. Length should be equal to item size of the attribute.
   */
  setFaceData (attribute, faceIndex, data) {
    attribute = (typeof attribute === 'string') ? this.attributes[attribute] : attribute;

    let offset = faceIndex * 3 * attribute.itemSize;

    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < attribute.itemSize; j++) {
        attribute.array[offset++] = data[j];
      }
    }
  }
}

export { ModelBufferGeometry };
