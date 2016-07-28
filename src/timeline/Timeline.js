/**
 * A utility class to create an animation timeline which can be baked into a (vertex) shader.
 * By default the timeline supports translation, scale and rotation. This can be extended or overridden.
 * @constructor
 */
THREE.BAS.Timeline = function() {
  /**
   * The total duration of the timeline in seconds.
   * @type {number}
   */
  this.duration = 0;

  /**
   * The name of the value that segments will use to read the time. Defaults to 'tTime'.
   * @type {string}
   */
  this.timeKey = 'tTime';

  this.segments = {};
  this.__key = 0;
};

// static definitions map
THREE.BAS.Timeline.segmentDefinitions = {};

/**
 * Registers a transition definition for use with {@link THREE.BAS.Timeline.add}.
 * @param {String} key Name of the transition. Defaults include 'scale', 'rotate' and 'translate'.
 * @param {Object} definition
 * @param {Function} definition.compiler A function that generates a glsl string for a transition segment. Accepts a THREE.BAS.TimelineSegment as the sole argument.
 * @param {*} definition.defaultFrom The initial value for a transform.from. For example, the defaultFrom for a translation is THREE.Vector3(0, 0, 0).
 * @static
 */
THREE.BAS.Timeline.register = function(key, definition) {
  THREE.BAS.Timeline.segmentDefinitions[key] = definition;
};

/**
 * Add a transition to the timeline.
 * @param {number} duration Duration in seconds
 * @param {object} transitions An object containing one or several transitions. The keys should match transform definitions.
 * The transition object for each key will be passed to the matching definition's compiler. It can have arbitrary properties, but the Timeline expects at least a 'to', 'from' and an optional 'ease'.
 * @param {number|string} [positionOffset] Position in the timeline. Defaults to the end of the timeline. If a number is provided, the transition will be inserted at that time in seconds. Strings ('+=x' or '-=x') can be used for a value relative to the end of timeline.
 */
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

    this.processTransition(key, transitions[key], start, duration);
  }
};

THREE.BAS.Timeline.prototype.processTransition = function(key, transition, start, duration) {
  var definition = THREE.BAS.Timeline.segmentDefinitions[key];

  var segments = this.segments[key];
  if (!segments) segments = this.segments[key] = [];

  if (transition.from === undefined) {
    if (segments.length === 0) {
      transition.from = definition.defaultFrom;
    }
    else {
      transition.from = segments[segments.length - 1].transition.to;
    }
  }

  segments.push(new THREE.BAS.TimelineSegment((this.__key++).toString(), start, duration, transition, definition.compiler));
};

/**
 * Compiles the timeline into a glsl string array that can be injected into a (vertex) shader.
 * @returns {Array}
 */
THREE.BAS.Timeline.prototype.compile = function() {
  var c = [];

  var keys = Object.keys(this.segments);
  var segments;

  for (var i = 0; i < keys.length; i++) {
    segments = this.segments[keys[i]];

    this.fillGaps(segments);

    segments.forEach(function(s) {
      c.push(s.compile());
    });
  }

  return c;
};
THREE.BAS.Timeline.prototype.fillGaps = function(segments) {
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

/**
 * Get a compiled glsl string with calls to transform functions for a given key.
 * The order in which these transitions are applied matters because they all operate on the same value.
 * @param {string} key A key matching a transform definition.
 * @returns {string}
 */
THREE.BAS.Timeline.prototype.getTransformCalls = function(key) {
  var t = this.timeKey;

  return this.segments[key] ?  this.segments[key].map(function(s) {
    return 'applyTransform' + s.key + '(' + t + ', transformed);';
  }).join('\n') : '';
};
