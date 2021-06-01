import { BufferGeometry, BufferAttribute } from 'three';

class PointBufferGeometry extends BufferGeometry {
  /**
   * A THREE.BufferGeometry consists of points.
   * @param {Number} count The number of points.
   * @constructor
   */
  constructor (count) {
    super();

    /**
     * Number of points.
     * @type {Number}
     */
    this.pointCount = count;

    this.bufferPositions();
  }

  bufferPositions () {
    this.createAttribute('position', 3);
  }

  /**
   * Creates a THREE.BufferAttribute on this geometry instance.
   *
   * @param {String} name Name of the attribute.
   * @param {Number} itemSize Number of floats per vertex (typically 1, 2, 3 or 4).
   * @param {function=} factory Function that will be called for each point upon creation. Accepts 3 arguments: data[], index and prefabCount. Calls setPointData.
   *
   * @returns {THREE.BufferAttribute}
   */
  createAttribute (name, itemSize, factory) {
    const buffer = new Float32Array(this.pointCount * itemSize);
    const attribute = new BufferAttribute(buffer, itemSize);

    this.setAttribute(name, attribute);

    if (factory) {
      const data = [];
      for (let i = 0; i < this.pointCount; i++) {
        factory(data, i, this.pointCount);
        this.setPointData(attribute, i, data);
      }
    }

    return attribute;
  }

  setPointData (attribute, pointIndex, data) {
    attribute = (typeof attribute === 'string') ? this.attributes[attribute] : attribute;

    let offset = pointIndex * attribute.itemSize;

    for (let j = 0; j < attribute.itemSize; j++) {
      attribute.array[offset++] = data[j];
    }
  }
}

export { PointBufferGeometry };
