THREE.BAS.TranslationSegment = function(key, start, duration, ease, translation) {
  this.key = key;
  this.start = start;
  this.duration = duration;
  this.ease = ease;
  this.translation = translation;
  this.trail = 0;
};
THREE.BAS.TranslationSegment.prototype.compile = function() {
  return [
    THREE.BAS.TimelineChunks.delayDuration(this.key, this.start, this.duration),
    THREE.BAS.TimelineChunks.vec3('cTranslateFrom' + this.key, this.translation.from, 2),
    THREE.BAS.TimelineChunks.vec3('cTranslateTo' + this.key, this.translation.to, 2),

    'void applyTranslation' + this.key + '(float time, inout vec3 v) {',

    THREE.BAS.TimelineChunks.renderCheck(this),
    THREE.BAS.TimelineChunks.progress(this.key, this.ease),

    'v += mix(cTranslateFrom' + this.key + ', cTranslateTo' + this.key + ', progress);',
    '}'
  ].join('\n');
};
Object.defineProperty(THREE.BAS.TranslationSegment.prototype, 'end', {
  get: function() {
    return this.start + this.duration;
  }
});