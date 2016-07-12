THREE.BAS.ScaleSegment = function(key, start, duration, transition) {
  this.key = key;
  this.start = start;
  this.duration = duration;
  this.transition = transition;
  this.trail = 0;
};
THREE.BAS.ScaleSegment.prototype.compile = function() {
  return [
    THREE.BAS.TimelineChunks.delayDuration(this),
    THREE.BAS.TimelineChunks.vec3('cScaleFrom' + this.key, this.transition.from, 2),
    THREE.BAS.TimelineChunks.vec3('cScaleTo' + this.key, this.transition.to, 2),

    'void applyTransform' + this.key + '(float time, inout vec3 v) {',

    THREE.BAS.TimelineChunks.renderCheck(this),
    THREE.BAS.TimelineChunks.progress(this),

    'v *= mix(cScaleFrom' + this.key + ', cScaleTo' + this.key + ', progress);',
    '}'
  ].join('\n');
};
Object.defineProperty(THREE.BAS.ScaleSegment.prototype, 'end', {
  get: function() {
    return this.start + this.duration;
  }
});