THREE.BAS.RotationSegment = function(key, start, duration, transition) {
  this.key = key;
  this.start = start;
  this.duration = duration;
  this.transition = transition;
  this.trail = 0;
};
THREE.BAS.RotationSegment.prototype.compile = function() {
  var fromAxisAngle = new THREE.Vector4(
    this.transition.axis.x,
    this.transition.axis.y,
    this.transition.axis.z,
    this.transition.from
  );

  var toAxisAngle = new THREE.Vector4(
    this.transition.axis.x,
    this.transition.axis.y,
    this.transition.axis.z,
    this.transition.to
  );

  return [
    THREE.BAS.TimelineChunks.delayDuration(this),
    THREE.BAS.TimelineChunks.vec4('cRotationFrom' + this.key, fromAxisAngle, 8),
    THREE.BAS.TimelineChunks.vec4('cRotationTo' + this.key, toAxisAngle, 8),

    'void applyTransform' + this.key + '(float time, inout vec3 v) {',

    THREE.BAS.TimelineChunks.renderCheck(this),
    THREE.BAS.TimelineChunks.progress(this),

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