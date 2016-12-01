/**
 * A THREE.BufferGeometry consists of points.
 * @param {Number} count The number of points.
 * @constructor
 */
THREE.BAS.PointBufferGeometry = function(count) {
  THREE.BufferGeometry.call(this);

  /**
   * Number of points.
   * @type {Number}
   */
  this.pointCount = count;

  this.bufferIndices();
  this.bufferPositions();
};
THREE.BAS.PointBufferGeometry.prototype = Object.create(THREE.BufferGeometry.prototype);
THREE.BAS.PointBufferGeometry.prototype.constructor = THREE.BAS.PointBufferGeometry;

THREE.BAS.PointBufferGeometry.prototype.bufferIndices = function() {
  var pointCount = this.pointCount;
  var indexBuffer = new Uint32Array(pointCount);

  this.setIndex(new THREE.BufferAttribute(indexBuffer, 1));

  for (var i = 0; i < pointCount; i++) {
    indexBuffer[i] = i;
  }
};

THREE.BAS.PointBufferGeometry.prototype.bufferPositions = function() {
  var positionBuffer = this.createAttribute('position', 3);
};

/**
 * Creates a THREE.BufferAttribute on this geometry instance.
 *
 * @param {String} name Name of the attribute.
 * @param {Number} itemSize Number of floats per vertex (typically 1, 2, 3 or 4).
 * @param {function=} factory Function that will be called for each point upon creation. Accepts 3 arguments: data[], index and prefabCount. Calls setPrefabData.
 *
 * @returns {THREE.BufferAttribute}
 */
THREE.BAS.PointBufferGeometry.prototype.createAttribute = function(name, itemSize, factory) {
  var buffer = new Float32Array(this.pointCount * itemSize);
  var attribute = new THREE.BufferAttribute(buffer, itemSize);

  this.addAttribute(name, attribute);

  if (factory) {
    var data = [];
    for (var i = 0; i < this.pointCount; i++) {
      factory(data, i, this.pointCount);
      this.setPointData(attribute, i, data);
    }
  }

  return attribute;
};

THREE.BAS.PointBufferGeometry.prototype.setPointData = function(attribute, pointIndex, data) {
  attribute = (typeof attribute === 'string') ? this.attributes[attribute] : attribute;

  var offset = pointIndex * attribute.itemSize;

  for (var j = 0; j < attribute.itemSize; j++) {
    attribute.array[offset++] = data[j];
  }
};