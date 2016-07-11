THREE.BAS.ScaleSegment = function(key, start, duration, ease, scale) {
  this.key = key;
  this.start = start;
  this.duration = duration;
  this.ease = ease;
  this.scale = scale;
  this.trail = 0;
};
THREE.BAS.ScaleSegment.prototype.compile = function() {
  return [
    THREE.BAS.TimelineChunks.delayDuration(this.key, this.start, this.duration),
    THREE.BAS.TimelineChunks.vec3('cScaleFrom' + this.key, this.scale.from, 2),
    THREE.BAS.TimelineChunks.vec3('cScaleTo' + this.key, this.scale.to, 2),

    'void applyScale' + this.key + '(float time, inout vec3 v) {',

    THREE.BAS.TimelineChunks.renderCheck(this),
    THREE.BAS.TimelineChunks.progress(this.key, this.ease),

    'v *= mix(cScaleFrom' + this.key + ', cScaleTo' + this.key + ', progress);',
    '}'
  ].join('\n');
};
Object.defineProperty(THREE.BAS.ScaleSegment.prototype, 'end', {
  get: function() {
    return this.start + this.duration;
  }
});