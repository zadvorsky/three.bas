THREE.BAS.Timeline = function() {
  this.duration = 0;
  this.segments = {};
  this.timeKey = 'tTime';

  this.__key = 0;
};

Object.assign(THREE.BAS.Timeline, {
  segmentDefinitions: {},
  register: function(key, definition) {
    THREE.BAS.Timeline.segmentDefinitions[key] = definition;
  }
});

THREE.BAS.Timeline.prototype.add = function(duration, transitions, positionOffset) {
  var start = this.duration;

  if (positionOffset !== undefined) {
    if (typeof positionOffset === 'number') {
      start = positionOffset;
    }
    else if (typeof positionOffset === 'string') {
      eval('start' + positionOffset);
    }

    this.duration = Math.max(this.duration, start + duration);
  }
  else {
    this.duration += duration;
  }

  var keys = Object.keys(transitions), key;

  for (var i = 0; i < keys.length; i++) {
    key = keys[i];

    this._processTransition(key, transitions[key], start, duration);
  }
};

THREE.BAS.Timeline.prototype._processTransition = function(key, transition, start, duration) {
  var definition = THREE.BAS.Timeline.segmentDefinitions[key];

  var segments = this.segments[key];
  if (!segments) segments = this.segments[key] = [];

  if (!transition.from) {
    if (segments.length === 0) {
      transition.from = definition.defaultFrom;
    }
    else {
      transition.from = segments[segments.length - 1].transition.to;
    }
  }

  segments.push(new THREE.BAS.TimelineSegment((this.__key++).toString(), start, duration, transition, definition.compiler));
};

THREE.BAS.Timeline.prototype.compile = function() {
  var c = [];

  var keys = Object.keys(this.segments);
  var segments;

  for (var i = 0; i < keys.length; i++) {
    segments = this.segments[keys[i]];

    this._pad(segments);

    segments.forEach(function(s) {
      c.push(s.compile());
    });
  }

  return c;
};
THREE.BAS.Timeline.prototype._pad = function(segments) {
  if (segments.length === 0) return;

  var s0, s1;

  for (var i = 0; i < segments.length - 1; i++) {
    s0 = segments[i];
    s1 = segments[i + 1];

    s0.trail = s1.start - s0.end;
  }

  // pad last segment until end of timeline
  s0 = segments[segments.length - 1];
  s0.trail = this.duration - s0.end;
};

THREE.BAS.Timeline.prototype.getTransformCalls = function(key) {
  var t = this.timeKey;

  return this.segments[key].map(function(s) {
    return 'applyTransform' + s.key + '(' + t + ', transformed);';
  }).join('\n');
};
