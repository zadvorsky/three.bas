import { InstancedBufferGeometry, InstancedBufferAttribute } from 'three';

class InstancedPrefabBufferGeometry extends InstancedBufferGeometry {
  /**
   * A wrapper around THREE.InstancedBufferGeometry, which is more memory efficient than PrefabBufferGeometry, but requires the ANGLE_instanced_arrays extension.
   *
   * @param {BufferGeometry} prefab The Geometry instance to repeat.
   * @param {Number} count The number of times to repeat the geometry.
   */
  constructor (prefab, count) {
    super();

    this.prefabGeometry = prefab;
    this.copy(prefab);

    this.instanceCount = count
    this.prefabCount = count;
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
    const buffer = new Float32Array(this.prefabCount * itemSize);
    const attribute = new InstancedBufferAttribute(buffer, itemSize);

    this.setAttribute(name, attribute);

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
   * Sets data for a prefab at a given index.
   * Usually called in a loop.
   *
   * @param {String|BufferAttribute} attribute The attribute or attribute name where the data is to be stored.
   * @param {Number} prefabIndex Index of the prefab in the buffer geometry.
   * @param {Array} data Array of data. Length should be equal to item size of the attribute.
   */
  setPrefabData (attribute, prefabIndex, data) {
    attribute = (typeof attribute === 'string') ? this.attributes[attribute] : attribute;

    let offset = prefabIndex * attribute.itemSize;

    for (let j = 0; j < attribute.itemSize; j++) {
      attribute.array[offset++] = data[j];
    }
  };
};

export { InstancedPrefabBufferGeometry };
