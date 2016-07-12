THREE.BAS.TimelineSegment = function(key, start, duration, transition, compiler) {
  this.key = key;
  this.start = start;
  this.duration = duration;
  this.transition = transition;
  this.compiler = compiler;

  this.trail = 0;
};

THREE.BAS.TimelineSegment.prototype.compile = function() {
  return this.compiler(this);
};

Object.defineProperty(THREE.BAS.TimelineSegment.prototype, 'end', {
  get: function() {
    return this.start + this.duration;
  }
});
