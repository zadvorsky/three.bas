THREE.BAS.RotationSegment = function(key, start, duration, ease, rotation) {
  this.key = key;
  this.start = start;
  this.duration = duration;
  this.ease = ease;
  this.rotation = rotation;
  this.trail = 0;
};
THREE.BAS.RotationSegment.prototype.compile = function() {
  var fromAxisAngle = new THREE.Vector4(
    this.rotation.axis.x,
    this.rotation.axis.y,
    this.rotation.axis.z,
    this.rotation.from
  );

  var toAxisAngle = new THREE.Vector4(
    this.rotation.axis.x,
    this.rotation.axis.y,
    this.rotation.axis.z,
    this.rotation.to
  );

  return [
    THREE.BAS.TimelineChunks.delayDuration(this.key, this.start, this.duration),
    THREE.BAS.TimelineChunks.vec4('cRotationFrom' + this.key, fromAxisAngle, 8),
    THREE.BAS.TimelineChunks.vec4('cRotationTo' + this.key, toAxisAngle, 8),

    'void applyRotation' + this.key + '(float time, inout vec3 v) {',

    THREE.BAS.TimelineChunks.renderCheck(this),
    THREE.BAS.TimelineChunks.progress(this.key, this.ease),

    'vec4 q = quatFromAxisAngle(cRotationFrom' + this.key + '.xyz' + ', mix(cRotationFrom' + this.key + '.w, cRotationTo' + this.key + '.w, progress));',
    'v = rotateVector(q, v);',
    '}'
  ].join('\n');
};
Object.defineProperty(THREE.BAS.RotationSegment.prototype, 'end', {
  get: function() {
    return this.start + this.duration;
  }
});