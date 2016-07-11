THREE.BAS.Timeline = function() {
  this.totalDuration = 0;
  this.__key = 0;

  this.scaleSegments = [];
  this.rotationSegments = [];
  this.translationSegments = [];
};

THREE.BAS.Timeline.prototype.add = function(duration, params, positionOffset) {
  var start = this.totalDuration;

  if (positionOffset !== undefined) {
    if (typeof positionOffset === 'number') {
      start = positionOffset;
    }
    else if (typeof positionOffset === 'string') {
      eval('start' + positionOffset);
    }

    this.totalDuration = Math.max(this.totalDuration, start + duration);
  }
  else {
    this.totalDuration += duration;
  }

  if (params.scale) {
    this._processScale(start, duration, params);
  }

  if (params.rotate) {
    this._processRotation(start, duration, params);
  }

  if (params.translate) {
    this._processTranslation(start, duration, params);
  }
};
THREE.BAS.Timeline.prototype._processScale = function(start, duration, params) {
  if (!params.scale.from) {
    if (this.scaleSegments.length === 0) {
      params.scale.from = new THREE.Vector3(1.0, 1.0, 1.0);
    }
    else {
      params.scale.from = this.scaleSegments[this.scaleSegments.length - 1].scale.to;
    }
  }

  this.scaleSegments.push(new THREE.BAS.ScaleSegment(
    this._getKey(),
    start,
    duration,
    params.ease,
    params.scale
  ));
};
THREE.BAS.Timeline.prototype._processRotation = function(start, duration, params) {
  if (!params.rotate.from) {
    if (this.rotationSegments.length === 0) {
      params.rotate.from = 0;
    }
    else {
      params.rotate.from = this.rotationSegments[this.rotationSegments.length - 1].rotate.to;
    }
  }

  this.rotationSegments.push(new THREE.BAS.RotationSegment(
    this._getKey(),
    start,
    duration,
    params.ease,
    params.rotate
  ));
};
THREE.BAS.Timeline.prototype._processTranslation = function(start, duration, params) {
  if (!params.translate.from) {
    if (this.translationSegments.length === 0) {
      params.translate.from = new THREE.Vector3(0.0, 0.0, 0.0);
    }
    else {
      params.translate.from = this.translationSegments[this.translationSegments.length - 1].translation.to;
    }
  }

  this.translationSegments.push(new THREE.BAS.TranslationSegment(
    this._getKey(),
    start,
    duration,
    params.ease,
    params.translate
  ));
};
THREE.BAS.Timeline.prototype._getKey = function() {
  return (this.__key++).toString();
};

THREE.BAS.Timeline.prototype.compile = function() {
  var c = [];

  this._pad(this.scaleSegments);
  this._pad(this.rotationSegments);
  this._pad(this.translationSegments);

  this.scaleSegments.forEach(function(s) {
    c.push(s.compile());
  });

  this.rotationSegments.forEach(function(s) {
    c.push(s.compile());
  });

  this.translationSegments.forEach(function(s) {
    c.push(s.compile());
  });

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
  s0.trail = this.totalDuration - s0.end;
};

THREE.BAS.Timeline.prototype.getScaleCalls = function() {
  return this.scaleSegments.map(function(s) {
    return 'applyScale' + s.key + '(tTime, transformed);';
  }).join('\n');
};
THREE.BAS.Timeline.prototype.getRotateCalls = function() {
  return this.rotationSegments.map(function(s) {
    return 'applyRotation' + s.key + '(tTime, transformed);';
  }).join('\n');
};
THREE.BAS.Timeline.prototype.getTranslateCalls = function() {
  return this.translationSegments.map(function(s) {
    return 'applyTranslation' + s.key + '(tTime, transformed);';
  }).join('\n');
};
