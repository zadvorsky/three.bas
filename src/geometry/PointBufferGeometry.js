import { BufferGeometry, BufferAttribute } from 'three';

/**
 * A THREE.BufferGeometry consists of points.
 * @param {Number} count The number of points.
 * @constructor
 */
function PointBufferGeometry(count) {
  BufferGeometry.call(this);

  /**
   * Number of points.
   * @type {Number}
   */
  this.pointCount = count;

  this.bufferPositions();
}
PointBufferGeometry.prototype = Object.create(BufferGeometry.prototype);
PointBufferGeometry.prototype.constructor = PointBufferGeometry;

PointBufferGeometry.prototype.bufferPositions = function() {
  this.createAttribute('position', 3);
};

/**
 * Creates a THREE.BufferAttribute on this geometry instance.
 *
 * @param {String} name Name of the attribute.
 * @param {Number} itemSize Number of floats per vertex (typically 1, 2, 3 or 4).
 * @param {function=} factory Function that will be called for each point upon creation. Accepts 3 arguments: data[], index and prefabCount. Calls setPointData.
 *
 * @returns {THREE.BufferAttribute}
 */
PointBufferGeometry.prototype.createAttribute = function(name, itemSize, factory) {
  const buffer = new Float32Array(this.pointCount * itemSize);
  const attribute = new BufferAttribute(buffer, itemSize);

  this.addAttribute(name, attribute);

  if (factory) {
    const data = [];
    for (let i = 0; i < this.pointCount; i++) {
      factory(data, i, this.pointCount);
      this.setPointData(attribute, i, data);
    }
  }

  return attribute;
};

PointBufferGeometry.prototype.setPointData = function(attribute, pointIndex, data) {
  attribute = (typeof attribute === 'string') ? this.attributes[attribute] : attribute;

  let offset = pointIndex * attribute.itemSize;

  for (let j = 0; j < attribute.itemSize; j++) {
    attribute.array[offset++] = data[j];
  }
};

export { PointBufferGeometry };
