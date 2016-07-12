THREE.BAS.TranslationSegment = function(key, start, duration, transition) {
  this.key = key;
  this.start = start;
  this.duration = duration;
  this.transition = transition;
  this.trail = 0;
};
THREE.BAS.TranslationSegment.prototype.compile = function() {
  return [
    THREE.BAS.TimelineChunks.delayDuration(this),
    THREE.BAS.TimelineChunks.vec3('cTranslateFrom' + this.key, this.transition.from, 2),
    THREE.BAS.TimelineChunks.vec3('cTranslateTo' + this.key, this.transition.to, 2),

    'void applyTransform' + this.key + '(float time, inout vec3 v) {',

    THREE.BAS.TimelineChunks.renderCheck(this),
    THREE.BAS.TimelineChunks.progress(this),

    'v += mix(cTranslateFrom' + this.key + ', cTranslateTo' + this.key + ', progress);',
    '}'
  ].join('\n');
};
Object.defineProperty(THREE.BAS.TranslationSegment.prototype, 'end', {
  get: function() {
    return this.start + this.duration;
  }
});