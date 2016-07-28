THREE.BAS = {};

THREE.BAS.BaseAnimationMaterial = function (parameters, uniforms) {
  THREE.ShaderMaterial.call(this);

  var uniformValues = parameters.uniformValues;

  delete parameters.uniformValues;

  this.setValues(parameters);

  this.uniforms = THREE.UniformsUtils.merge([uniforms, this.uniforms]);

  this.setUniformValues(uniformValues);

  if (uniformValues) {
    uniformValues.map && (this.defines['USE_MAP'] = '');
    uniformValues.normalMap && (this.defines['USE_NORMALMAP'] = '');
    uniformValues.envMap && (this.defines['USE_ENVMAP'] = '');
    uniformValues.aoMap && (this.defines['USE_AOMAP'] = '');
    uniformValues.specularMap && (this.defines['USE_SPECULARMAP'] = '');
    uniformValues.alphaMap && (this.defines['USE_ALPHAMAP'] = '');
    uniformValues.lightMap && (this.defines['USE_LIGHTMAP'] = '');
    uniformValues.emissiveMap && (this.defines['USE_EMISSIVEMAP'] = '');
    uniformValues.bumpMap && (this.defines['USE_BUMPMAP'] = '');
    uniformValues.displacementMap && (this.defines['USE_DISPLACEMENTMAP'] = '');
    uniformValues.roughnessMap && (this.defines['USE_DISPLACEMENTMAP'] = '');
    uniformValues.roughnessMap && (this.defines['USE_ROUGHNESSMAP'] = '');
    uniformValues.metalnessMap && (this.defines['USE_METALNESSMAP'] = '');

    if (uniformValues.envMap) {
      this.defines['USE_ENVMAP'] = '';

      var envMapTypeDefine = 'ENVMAP_TYPE_CUBE';
      var envMapModeDefine = 'ENVMAP_MODE_REFLECTION';
      var envMapBlendingDefine = 'ENVMAP_BLENDING_MULTIPLY';

      switch (uniformValues.envMap.mapping) {
        case THREE.CubeReflectionMapping:
        case THREE.CubeRefractionMapping:
          envMapTypeDefine = 'ENVMAP_TYPE_CUBE';
          break;
        case THREE.CubeUVReflectionMapping:
        case THREE.CubeUVRefractionMapping:
          envMapTypeDefine = 'ENVMAP_TYPE_CUBE_UV';
          break;
        case THREE.EquirectangularReflectionMapping:
        case THREE.EquirectangularRefractionMapping:
          envMapTypeDefine = 'ENVMAP_TYPE_EQUIREC';
          break;
        case THREE.SphericalReflectionMapping:
          envMapTypeDefine = 'ENVMAP_TYPE_SPHERE';
          break;
      }

      switch (uniformValues.envMap.mapping) {
        case THREE.CubeRefractionMapping:
        case THREE.EquirectangularRefractionMapping:
          envMapModeDefine = 'ENVMAP_MODE_REFRACTION';
          break;
      }

      switch (uniformValues.combine) {
        case THREE.MixOperation:
          envMapBlendingDefine = 'ENVMAP_BLENDING_MIX';
          break;
        case THREE.AddOperation:
          envMapBlendingDefine = 'ENVMAP_BLENDING_ADD';
          break;
        case THREE.MultiplyOperation:
        default:
          envMapBlendingDefine = 'ENVMAP_BLENDING_MULTIPLY';
          break;
      }

      this.defines[envMapTypeDefine] = '';
      this.defines[envMapBlendingDefine] = '';
      this.defines[envMapModeDefine] = '';
    }
  }
};
THREE.BAS.BaseAnimationMaterial.prototype = Object.create(THREE.ShaderMaterial.prototype);
THREE.BAS.BaseAnimationMaterial.prototype.constructor = THREE.BAS.BaseAnimationMaterial;

THREE.BAS.BaseAnimationMaterial.prototype.setUniformValues = function (values) {
  for (var key in values) {
    if (key in this.uniforms) {
      var uniform = this.uniforms[key];
      var value = values[key];

      uniform.value = value;
    }
  }
};

THREE.BAS.BaseAnimationMaterial.prototype._stringifyChunk = function(name) {
  return this[name] ? (this[name].join('\n')) : '';
};

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

THREE.BAS.ShaderChunk = {};

THREE.BAS.ShaderChunk["catmull_rom_spline"] = "vec4 catmullRomSpline(vec4 p0, vec4 p1, vec4 p2, vec4 p3, float t, vec2 c) {\n    vec4 v0 = (p2 - p0) * c.x;\n    vec4 v1 = (p3 - p1) * c.y;\n    float t2 = t * t;\n    float t3 = t * t * t;\n\n    return vec4((2.0 * p1 - 2.0 * p2 + v0 + v1) * t3 + (-3.0 * p1 + 3.0 * p2 - 2.0 * v0 - v1) * t2 + v0 * t + p1);\n}\nvec4 catmullRomSpline(vec4 p0, vec4 p1, vec4 p2, vec4 p3, float t) {\n    return catmullRomSpline(p0, p1, p2, p3, t, vec2(0.5, 0.5));\n}\n\nvec3 catmullRomSpline(vec3 p0, vec3 p1, vec3 p2, vec3 p3, float t, vec2 c) {\n    vec3 v0 = (p2 - p0) * c.x;\n    vec3 v1 = (p3 - p1) * c.y;\n    float t2 = t * t;\n    float t3 = t * t * t;\n\n    return vec3((2.0 * p1 - 2.0 * p2 + v0 + v1) * t3 + (-3.0 * p1 + 3.0 * p2 - 2.0 * v0 - v1) * t2 + v0 * t + p1);\n}\nvec3 catmullRomSpline(vec3 p0, vec3 p1, vec3 p2, vec3 p3, float t) {\n    return catmullRomSpline(p0, p1, p2, p3, t, vec2(0.5, 0.5));\n}\n\nvec2 catmullRomSpline(vec2 p0, vec2 p1, vec2 p2, vec2 p3, float t, vec2 c) {\n    vec2 v0 = (p2 - p0) * c.x;\n    vec2 v1 = (p3 - p1) * c.y;\n    float t2 = t * t;\n    float t3 = t * t * t;\n\n    return vec2((2.0 * p1 - 2.0 * p2 + v0 + v1) * t3 + (-3.0 * p1 + 3.0 * p2 - 2.0 * v0 - v1) * t2 + v0 * t + p1);\n}\nvec2 catmullRomSpline(vec2 p0, vec2 p1, vec2 p2, vec2 p3, float t) {\n    return catmullRomSpline(p0, p1, p2, p3, t, vec2(0.5, 0.5));\n}\n\nfloat catmullRomSpline(float p0, float p1, float p2, float p3, float t, vec2 c) {\n    float v0 = (p2 - p0) * c.x;\n    float v1 = (p3 - p1) * c.y;\n    float t2 = t * t;\n    float t3 = t * t * t;\n\n    return float((2.0 * p1 - 2.0 * p2 + v0 + v1) * t3 + (-3.0 * p1 + 3.0 * p2 - 2.0 * v0 - v1) * t2 + v0 * t + p1);\n}\nfloat catmullRomSpline(float p0, float p1, float p2, float p3, float t) {\n    return catmullRomSpline(p0, p1, p2, p3, t, vec2(0.5, 0.5));\n}\n\nivec4 getCatmullRomSplineIndices(float l, float p) {\n    float index = floor(p);\n    int i0 = int(max(0.0, index - 1.0));\n    int i1 = int(index);\n    int i2 = int(min(index + 1.0, l));\n    int i3 = int(min(index + 2.0, l));\n\n    return ivec4(i0, i1, i2, i3);\n}\n\nivec4 getCatmullRomSplineIndicesClosed(float l, float p) {\n    float index = floor(p);\n    int i0 = int(index == 0.0 ? l : index - 1.0);\n    int i1 = int(index);\n    int i2 = int(mod(index + 1.0, l));\n    int i3 = int(mod(index + 2.0, l));\n\n    return ivec4(i0, i1, i2, i3);\n}\n";

THREE.BAS.ShaderChunk["cubic_bezier"] = "vec3 cubicBezier(vec3 p0, vec3 c0, vec3 c1, vec3 p1, float t) {\n    float tn = 1.0 - t;\n\n    return tn * tn * tn * p0 + 3.0 * tn * tn * t * c0 + 3.0 * tn * t * t * c1 + t * t * t * p1;\n}\n\nvec2 cubicBezier(vec2 p0, vec2 c0, vec2 c1, vec2 p1, float t) {\n    float tn = 1.0 - t;\n\n    return tn * tn * tn * p0 + 3.0 * tn * tn * t * c0 + 3.0 * tn * t * t * c1 + t * t * t * p1;\n}\n";

THREE.BAS.ShaderChunk["ease_back_in"] = "float easeBackIn(float p, float amplitude) {\n    return p * p * ((amplitude + 1.0) * p - amplitude);\n}\n\nfloat easeBackIn(float p) {\n    return easeBackIn(p, 1.70158);\n}\n\nfloat easeBackIn(float t, float b, float c, float d, float amplitude) {\n    return b + easeBackIn(t / d, amplitude) * c;\n}\n\nfloat easeBackIn(float t, float b, float c, float d) {\n    return b + easeBackIn(t / d) * c;\n}\n";

THREE.BAS.ShaderChunk["ease_back_in_out"] = "float easeBackInOut(float p, float amplitude) {\n    amplitude *= 1.525;\n\n    return ((p *= 2.0) < 1.0) ? 0.5 * p * p * ((amplitude + 1.0) * p - amplitude) : 0.5 * ((p -= 2.0) * p * ((amplitude + 1.0) * p + amplitude) + 2.0);\n}\n\nfloat easeBackInOut(float p) {\n    return easeBackInOut(p, 1.70158);\n}\n\nfloat easeBackInOut(float t, float b, float c, float d, float amplitude) {\n    return b + easeBackInOut(t / d, amplitude) * c;\n}\n\nfloat easeBackInOut(float t, float b, float c, float d) {\n    return b + easeBackInOut(t / d) * c;\n}\n";

THREE.BAS.ShaderChunk["ease_back_out"] = "float easeBackOut(float p, float amplitude) {\n    return ((p = p - 1.0) * p * ((amplitude + 1.0) * p + amplitude) + 1.0);\n}\n\nfloat easeBackOut(float p) {\n    return easeBackOut(p, 1.70158);\n}\n\nfloat easeBackOut(float t, float b, float c, float d, float amplitude) {\n    return b + easeBackOut(t / d, amplitude) * c;\n}\n\nfloat easeBackOut(float t, float b, float c, float d) {\n    return b + easeBackOut(t / d) * c;\n}\n";

THREE.BAS.ShaderChunk["ease_bezier"] = "float easeBezier(float p, vec4 curve) {\n    float ip = 1.0 - p;\n    return (3.0 * ip * ip * p * curve.xy + 3.0 * ip * p * p * curve.zw + p * p * p).y;\n}\n\nfloat easeBezier(float t, float b, float c, float d, vec4 curve) {\n    return b + easeBezier(t / d, curve) * c;\n}\n";

THREE.BAS.ShaderChunk["ease_bounce_in"] = "float easeBounceIn(float p) {\n    if ((p = 1.0 - p) < 1.0 / 2.75) {\n        return 1.0 - (7.5625 * p * p);\n    } else if (p < 2.0 / 2.75) {\n        return 1.0 - (7.5625 * (p -= 1.5 / 2.75) * p + 0.75);\n    } else if (p < 2.5 / 2.75) {\n        return 1.0 - (7.5625 * (p -= 2.25 / 2.75) * p + 0.9375);\n    }\n    return 1.0 - (7.5625 * (p -= 2.625 / 2.75) * p + 0.984375);\n}\n\nfloat easeBounceIn(float t, float b, float c, float d) {\n    return b + easeBounceIn(t / d) * c;\n}\n";

THREE.BAS.ShaderChunk["ease_bounce_in_out"] = "float easeBounceInOut(float p) {\n    bool invert = (p < 0.5);\n\n    p = invert ? (1.0 - (p * 2.0)) : ((p * 2.0) - 1.0);\n\n    if (p < 1.0 / 2.75) {\n        p = 7.5625 * p * p;\n    } else if (p < 2.0 / 2.75) {\n        p = 7.5625 * (p -= 1.5 / 2.75) * p + 0.75;\n    } else if (p < 2.5 / 2.75) {\n        p = 7.5625 * (p -= 2.25 / 2.75) * p + 0.9375;\n    } else {\n        p = 7.5625 * (p -= 2.625 / 2.75) * p + 0.984375;\n    }\n\n    return invert ? (1.0 - p) * 0.5 : p * 0.5 + 0.5;\n}\n\nfloat easeBounceInOut(float t, float b, float c, float d) {\n    return b + easeBounceInOut(t / d) * c;\n}\n";

THREE.BAS.ShaderChunk["ease_bounce_out"] = "float easeBounceOut(float p) {\n    if (p < 1.0 / 2.75) {\n        return 7.5625 * p * p;\n    } else if (p < 2.0 / 2.75) {\n        return 7.5625 * (p -= 1.5 / 2.75) * p + 0.75;\n    } else if (p < 2.5 / 2.75) {\n        return 7.5625 * (p -= 2.25 / 2.75) * p + 0.9375;\n    }\n    return 7.5625 * (p -= 2.625 / 2.75) * p + 0.984375;\n}\n\nfloat easeBounceOut(float t, float b, float c, float d) {\n    return b + easeBounceOut(t / d) * c;\n}\n";

THREE.BAS.ShaderChunk["ease_circ_in"] = "float easeCircIn(float p) {\n    return -(sqrt(1.0 - p * p) - 1.0);\n}\n\nfloat easeCircIn(float t, float b, float c, float d) {\n    return b + easeCircIn(t / d) * c;\n}\n";

THREE.BAS.ShaderChunk["ease_circ_in_out"] = "float easeCircInOut(float p) {\n    return ((p *= 2.0) < 1.0) ? -0.5 * (sqrt(1.0 - p * p) - 1.0) : 0.5 * (sqrt(1.0 - (p -= 2.0) * p) + 1.0);\n}\n\nfloat easeCircInOut(float t, float b, float c, float d) {\n    return b + easeCircInOut(t / d) * c;\n}\n";

THREE.BAS.ShaderChunk["ease_circ_out"] = "float easeCircOut(float p) {\n  return sqrt(1.0 - (p = p - 1.0) * p);\n}\n\nfloat easeCircOut(float t, float b, float c, float d) {\n  return b + easeCircOut(t / d) * c;\n}\n";

THREE.BAS.ShaderChunk["ease_cubic_in"] = "float easeCubicIn(float t) {\n  return t * t * t;\n}\n\nfloat easeCubicIn(float t, float b, float c, float d) {\n  return b + easeCubicIn(t / d) * c;\n}\n";

THREE.BAS.ShaderChunk["ease_cubic_in_out"] = "float easeCubicInOut(float t) {\n  return (t /= 0.5) < 1.0 ? 0.5 * t * t * t : 0.5 * ((t-=2.0) * t * t + 2.0);\n}\n\nfloat easeCubicInOut(float t, float b, float c, float d) {\n  return b + easeCubicInOut(t / d) * c;\n}\n";

THREE.BAS.ShaderChunk["ease_cubic_out"] = "float easeCubicOut(float t) {\n  float f = t - 1.0;\n  return f * f * f + 1.0;\n}\n\nfloat easeCubicOut(float t, float b, float c, float d) {\n  return b + easeCubicOut(t / d) * c;\n}\n";

THREE.BAS.ShaderChunk["ease_elastic_in"] = "float easeElasticIn(float p, float amplitude, float period) {\n    float p1 = max(amplitude, 1.0);\n    float p2 = period / min(amplitude, 1.0);\n    float p3 = p2 / PI2 * (asin(1.0 / p1));\n\n    return -(p1 * pow(2.0, 10.0 * (p -= 1.0)) * sin((p - p3) * PI2 / p2));\n}\n\nfloat easeElasticIn(float p) {\n    return easeElasticIn(p, 1.0, 0.3);\n}\n\nfloat easeElasticIn(float t, float b, float c, float d, float amplitude, float period) {\n    return b + easeElasticIn(t / d, amplitude, period) * c;\n}\n\nfloat easeElasticIn(float t, float b, float c, float d) {\n    return b + easeElasticIn(t / d) * c;\n}\n";

THREE.BAS.ShaderChunk["ease_elastic_in_out"] = "float easeElasticInOut(float p, float amplitude, float period) {\n    float p1 = max(amplitude, 1.0);\n    float p2 = period / min(amplitude, 1.0);\n    float p3 = p2 / PI2 * (asin(1.0 / p1));\n\n    return ((p *= 2.0) < 1.0) ? -0.5 * (p1 * pow(2.0, 10.0 * (p -= 1.0)) * sin((p - p3) * PI2 / p2)) : p1 * pow(2.0, -10.0 * (p -= 1.0)) * sin((p - p3) * PI2 / p2) * 0.5 + 1.0;\n}\n\nfloat easeElasticInOut(float p) {\n    return easeElasticInOut(p, 1.0, 0.3);\n}\n\nfloat easeElasticInOut(float t, float b, float c, float d, float amplitude, float period) {\n    return b + easeElasticInOut(t / d, amplitude, period) * c;\n}\n\nfloat easeElasticInOut(float t, float b, float c, float d) {\n    return b + easeElasticInOut(t / d) * c;\n}\n";

THREE.BAS.ShaderChunk["ease_elastic_out"] = "float easeElasticOut(float p, float amplitude, float period) {\n    float p1 = max(amplitude, 1.0);\n    float p2 = period / min(amplitude, 1.0);\n    float p3 = p2 / PI2 * (asin(1.0 / p1));\n\n    return p1 * pow(2.0, -10.0 * p) * sin((p - p3) * PI2 / p2) + 1.0;\n}\n\nfloat easeElasticOut(float p) {\n    return easeElasticOut(p, 1.0, 0.3);\n}\n\nfloat easeElasticOut(float t, float b, float c, float d, float amplitude, float period) {\n    return b + easeElasticOut(t / d, amplitude, period) * c;\n}\n\nfloat easeElasticOut(float t, float b, float c, float d) {\n    return b + easeElasticOut(t / d) * c;\n}\n";

THREE.BAS.ShaderChunk["ease_expo_in"] = "float easeExpoIn(float p) {\n    return pow(2.0, 10.0 * (p - 1.0));\n}\n\nfloat easeExpoIn(float t, float b, float c, float d) {\n    return b + easeExpoIn(t / d) * c;\n}\n";

THREE.BAS.ShaderChunk["ease_expo_in_out"] = "float easeExpoInOut(float p) {\n    return ((p *= 2.0) < 1.0) ? 0.5 * pow(2.0, 10.0 * (p - 1.0)) : 0.5 * (2.0 - pow(2.0, -10.0 * (p - 1.0)));\n}\n\nfloat easeExpoInOut(float t, float b, float c, float d) {\n    return b + easeExpoInOut(t / d) * c;\n}\n";

THREE.BAS.ShaderChunk["ease_expo_out"] = "float easeExpoOut(float p) {\n  return 1.0 - pow(2.0, -10.0 * p);\n}\n\nfloat easeExpoOut(float t, float b, float c, float d) {\n  return b + easeExpoOut(t / d) * c;\n}\n";

THREE.BAS.ShaderChunk["ease_quad_in"] = "float easeQuadIn(float t) {\n    return t * t;\n}\n\nfloat easeQuadIn(float t, float b, float c, float d) {\n  return b + easeQuadIn(t / d) * c;\n}\n";

THREE.BAS.ShaderChunk["ease_quad_in_out"] = "float easeQuadInOut(float t) {\n    float p = 2.0 * t * t;\n    return t < 0.5 ? p : -p + (4.0 * t) - 1.0;\n}\n\nfloat easeQuadInOut(float t, float b, float c, float d) {\n    return b + easeQuadInOut(t / d) * c;\n}\n";

THREE.BAS.ShaderChunk["ease_quad_out"] = "float easeQuadOut(float t) {\n  return -t * (t - 2.0);\n}\n\nfloat easeQuadOut(float t, float b, float c, float d) {\n  return b + easeQuadOut(t / d) * c;\n}\n";

THREE.BAS.ShaderChunk["ease_quart_in"] = "float easeQuartIn(float t) {\n  return t * t * t * t;\n}\n\nfloat easeQuartIn(float t, float b, float c, float d) {\n  return b + easeQuartIn(t / d) * c;\n}\n";

THREE.BAS.ShaderChunk["ease_quart_in_out"] = "float easeQuartInOut(float t) {\n    return t < 0.5 ? 8.0 * pow(t, 4.0) : -8.0 * pow(t - 1.0, 4.0) + 1.0;\n}\n\nfloat easeQuartInOut(float t, float b, float c, float d) {\n    return b + easeQuartInOut(t / d) * c;\n}\n";

THREE.BAS.ShaderChunk["ease_quart_out"] = "float easeQuartOut(float t) {\n  return 1.0 - pow(1.0 - t, 4.0);\n}\n\nfloat easeQuartOut(float t, float b, float c, float d) {\n  return b + easeQuartOut(t / d) * c;\n}\n";

THREE.BAS.ShaderChunk["ease_quint_in"] = "float easeQuintIn(float t) {\n    return pow(t, 5.0);\n}\n\nfloat easeQuintIn(float t, float b, float c, float d) {\n    return b + easeQuintIn(t / d) * c;\n}\n";

THREE.BAS.ShaderChunk["ease_quint_in_out"] = "float easeQuintInOut(float t) {\n    return (t /= 0.5) < 1.0 ? 0.5 * t * t * t * t * t : 0.5 * ((t -= 2.0) * t * t * t * t + 2.0);\n}\n\nfloat easeQuintInOut(float t, float b, float c, float d) {\n    return b + easeQuintInOut(t / d) * c;\n}\n";

THREE.BAS.ShaderChunk["ease_quint_out"] = "float easeQuintOut(float t) {\n    return (t -= 1.0) * t * t * t * t + 1.0;\n}\n\nfloat easeQuintOut(float t, float b, float c, float d) {\n    return b + easeQuintOut(t / d) * c;\n}\n";

THREE.BAS.ShaderChunk["ease_sine_in"] = "float easeSineIn(float p) {\n  return -cos(p * 1.57079632679) + 1.0;\n}\n\nfloat easeSineIn(float t, float b, float c, float d) {\n  return b + easeSineIn(t / d) * c;\n}\n";

THREE.BAS.ShaderChunk["ease_sine_in_out"] = "float easeSineInOut(float p) {\n  return -0.5 * (cos(PI * p) - 1.0);\n}\n\nfloat easeSineInOut(float t, float b, float c, float d) {\n  return b + easeSineInOut(t / d) * c;\n}\n";

THREE.BAS.ShaderChunk["ease_sine_out"] = "float easeSineOut(float p) {\n  return sin(p * 1.57079632679);\n}\n\nfloat easeSineOut(float t, float b, float c, float d) {\n  return b + easeSineOut(t / d) * c;\n}\n";

THREE.BAS.ShaderChunk["quaternion_rotation"] = "vec3 rotateVector(vec4 q, vec3 v) {\n    return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v);\n}\n\nvec4 quatFromAxisAngle(vec3 axis, float angle) {\n    float halfAngle = angle * 0.5;\n    return vec4(axis.xyz * sin(halfAngle), cos(halfAngle));\n}\n";

THREE.BAS.ShaderChunk["quaternion_slerp"] = "vec4 quatSlerp(vec4 q0, vec4 q1, float t) {\n    float s = 1.0 - t;\n    float c = dot(q0, q1);\n    float dir = -1.0; //c >= 0.0 ? 1.0 : -1.0;\n    float sqrSn = 1.0 - c * c;\n\n    if (sqrSn > 2.220446049250313e-16) {\n        float sn = sqrt(sqrSn);\n        float len = atan(sn, c * dir);\n\n        s = sin(s * len) / sn;\n        t = sin(t * len) / sn;\n    }\n\n    float tDir = t * dir;\n\n    return normalize(q0 * s + q1 * tDir);\n}\n";


/**
 * Collection of utility functions.
 * @namespace
 */
THREE.BAS.Utils = {
  /**
   * Duplicates vertices so each face becomes separate.
   * Same as THREE.ExplodeModifier.
   *
   * @param {THREE.Geometry} geometry Geometry instance to modify.
   */
  separateFaces: function (geometry) {
    var vertices = [];

    for (var i = 0, il = geometry.faces.length; i < il; i++) {
      var n = vertices.length;
      var face = geometry.faces[i];

      var a = face.a;
      var b = face.b;
      var c = face.c;

      var va = geometry.vertices[a];
      var vb = geometry.vertices[b];
      var vc = geometry.vertices[c];

      vertices.push(va.clone());
      vertices.push(vb.clone());
      vertices.push(vc.clone());

      face.a = n;
      face.b = n + 1;
      face.c = n + 2;
    }

    geometry.vertices = vertices;
  },

  /**
   * Compute the centroid (center) of a THREE.Face3.
   *
   * @param {THREE.Geometry} geometry Geometry instance the face is in.
   * @param {THREE.Face3} face Face object from the THREE.Geometry.faces array
   * @param {THREE.Vector3=} v Optional vector to store result in.
   * @returns {THREE.Vector3}
   */
  computeCentroid: function(geometry, face, v) {
    var a = geometry.vertices[face.a];
    var b = geometry.vertices[face.b];
    var c = geometry.vertices[face.c];

    v = v || new THREE.Vector3();

    v.x = (a.x + b.x + c.x) / 3;
    v.y = (a.y + b.y + c.y) / 3;
    v.z = (a.z + b.z + c.z) / 3;

    return v;
  },

  /**
   * Get a random vector between box.min and box.max.
   *
   * @param {THREE.Box3} box THREE.Box3 instance.
   * @param {THREE.Vector3=} v Optional vector to store result in.
   * @returns {THREE.Vector3}
   */
  randomInBox: function(box, v) {
    v = v || new THREE.Vector3();

    v.x = THREE.Math.randFloat(box.min.x, box.max.x);
    v.y = THREE.Math.randFloat(box.min.y, box.max.y);
    v.z = THREE.Math.randFloat(box.min.z, box.max.z);

    return v;
  },

  /**
   * Get a random axis for quaternion rotation.
   *
   * @param {THREE.Vector3=} v Option vector to store result in.
   * @returns {THREE.Vector3}
   */
  randomAxis: function(v) {
    v = v || new THREE.Vector3();

    v.x = THREE.Math.randFloatSpread(2.0);
    v.y = THREE.Math.randFloatSpread(2.0);
    v.z = THREE.Math.randFloatSpread(2.0);
    v.normalize();

    return v;
  },

  /**
   * Create a THREE.BAS.DepthAnimationMaterial for shadows from a THREE.SpotLight or THREE.DirectionalLight by copying relevant shader chunks.
   * Uniform values must be manually synced between the source material and the depth material.
   *
   * @see {@link http://three-bas-examples.surge.sh/examples/shadows/}
   *
   * @param {THREE.BAS.BaseAnimationMaterial} sourceMaterial Instance to get the shader chunks from.
   * @returns {THREE.BAS.DepthAnimationMaterial}
   */
  createDepthAnimationMaterial: function(sourceMaterial) {
    return new THREE.BAS.DepthAnimationMaterial({
      uniforms: sourceMaterial.uniforms,
      vertexFunctions: sourceMaterial.vertexFunctions,
      vertexParameters: sourceMaterial.vertexParameters,
      vertexInit: sourceMaterial.vertexInit,
      vertexPosition: sourceMaterial.vertexPosition
    });
  },

  /**
   * Create a THREE.BAS.DistanceAnimationMaterial for shadows from a THREE.PointLight by copying relevant shader chunks.
   * Uniform values must be manually synced between the source material and the distance material.
   *
   * @see {@link http://three-bas-examples.surge.sh/examples/shadows/}
   *
   * @param {THREE.BAS.BaseAnimationMaterial} sourceMaterial Instance to get the shader chunks from.
   * @returns {THREE.BAS.DistanceAnimationMaterial}
   */
  createDistanceAnimationMaterial: function(sourceMaterial) {
    return new THREE.BAS.DistanceAnimationMaterial({
      uniforms: sourceMaterial.uniforms,
      vertexFunctions: sourceMaterial.vertexFunctions,
      vertexParameters: sourceMaterial.vertexParameters,
      vertexInit: sourceMaterial.vertexInit,
      vertexPosition: sourceMaterial.vertexPosition
    });
  }
};

/**
 * A THREE.BufferGeometry for animating individual faces of a THREE.Geometry.
 *
 * @param {THREE.Geometry} model The THREE.Geometry to base this geometry on.
 * @param {Object=} options
 * @param {Boolean=} options.computeCentroids If true, a centroids will be computed for each face and stored in THREE.BAS.ModelBufferGeometry.centroids.
 * @param {Boolean=} options.localizeFaces If true, the positions for each face will be stored relative to the centroid. This is useful if you want to rotate or scale faces around their center.
 * @constructor
 */
THREE.BAS.ModelBufferGeometry = function(model, options) {
  THREE.BufferGeometry.call(this);

  /**
   * A reference to the geometry used to create this instance.
   * @type {THREE.Geometry}
   */
  this.modelGeometry = model;

  /**
   * Number of faces of the model.
   * @type {Number}
   */
  this.faceCount = this.modelGeometry.faces.length;

  /**
   * Number of vertices of the model.
   * @type {Number}
   */
  this.vertexCount = this.modelGeometry.vertices.length;

  options = options || {};
  options.computeCentroids && this.computeCentroids();

  this.bufferIndices();
  this.bufferPositions(options.localizeFaces);
};
THREE.BAS.ModelBufferGeometry.prototype = Object.create(THREE.BufferGeometry.prototype);
THREE.BAS.ModelBufferGeometry.prototype.constructor = THREE.BAS.ModelBufferGeometry;

/**
 * Computes a centroid for each face and stores it in THREE.BAS.ModelBufferGeometry.centroids.
 */
THREE.BAS.ModelBufferGeometry.prototype.computeCentroids = function() {
  /**
   * An array of centroids corresponding to the faces of the model.
   *
   * @type {Array}
   */
  this.centroids = [];

  for (var i = 0; i < this.faceCount; i++) {
    this.centroids[i] = THREE.BAS.Utils.computeCentroid(this.modelGeometry, this.modelGeometry.faces[i]);
  }
};

THREE.BAS.ModelBufferGeometry.prototype.bufferIndices = function() {
  var indexBuffer = new Uint32Array(this.faceCount * 3);

  this.setIndex(new THREE.BufferAttribute(indexBuffer, 1));

  for (var i = 0, offset = 0; i < this.faceCount; i++, offset += 3) {
    var face = this.modelGeometry.faces[i];

    indexBuffer[offset    ] = face.a;
    indexBuffer[offset + 1] = face.b;
    indexBuffer[offset + 2] = face.c;
  }
};

THREE.BAS.ModelBufferGeometry.prototype.bufferPositions = function(localizeFaces) {
  var positionBuffer = this.createAttribute('position', 3).array;
  var i, offset;

  if (localizeFaces === true) {
    for (i = 0; i < this.faceCount; i++) {
      var face = this.modelGeometry.faces[i];
      var centroid = this.centroids ? this.centroids[i] : THREE.BAS.Utils.computeCentroid(this.modelGeometry, face);

      var a = this.modelGeometry.vertices[face.a];
      var b = this.modelGeometry.vertices[face.b];
      var c = this.modelGeometry.vertices[face.c];

      positionBuffer[face.a * 3]     = a.x - centroid.x;
      positionBuffer[face.a * 3 + 1] = a.y - centroid.y;
      positionBuffer[face.a * 3 + 2] = a.z - centroid.z;

      positionBuffer[face.b * 3]     = b.x - centroid.x;
      positionBuffer[face.b * 3 + 1] = b.y - centroid.y;
      positionBuffer[face.b * 3 + 2] = b.z - centroid.z;

      positionBuffer[face.c * 3]     = c.x - centroid.x;
      positionBuffer[face.c * 3 + 1] = c.y - centroid.y;
      positionBuffer[face.c * 3 + 2] = c.z - centroid.z;
    }
  }
  else {
    for (i = 0, offset = 0; i < this.vertexCount; i++, offset += 3) {
      var vertex = this.modelGeometry.vertices[i];

      positionBuffer[offset    ] = vertex.x;
      positionBuffer[offset + 1] = vertex.y;
      positionBuffer[offset + 2] = vertex.z;
    }
  }
};

/**
 * Creates a THREE.BufferAttribute with UV coordinates.
 */
THREE.BAS.ModelBufferGeometry.prototype.bufferUVs = function() {
  var uvBuffer = this.createAttribute('uv', 2).array;

  for (var i = 0; i < this.faceCount; i++) {

    var face = this.modelGeometry.faces[i];
    var uv;

    uv = this.modelGeometry.faceVertexUvs[0][i][0];
    uvBuffer[face.a * 2]     = uv.x;
    uvBuffer[face.a * 2 + 1] = uv.y;

    uv = this.modelGeometry.faceVertexUvs[0][i][1];
    uvBuffer[face.b * 2]     = uv.x;
    uvBuffer[face.b * 2 + 1] = uv.y;

    uv = this.modelGeometry.faceVertexUvs[0][i][2];
    uvBuffer[face.c * 2]     = uv.x;
    uvBuffer[face.c * 2 + 1] = uv.y;
  }
};

/**
 * Creates a THREE.BufferAttribute on this geometry instance.
 *
 * @param {String} name Name of the attribute.
 * @param {int} itemSize Number of floats per vertex (typically 1, 2, 3 or 4).
 * @param {function=} factory Function that will be called for each face upon creation. Accepts 3 arguments: data[], index and faceCount. Calls setFaceData.
 *
 * @returns {THREE.BufferAttribute}
 */
THREE.BAS.ModelBufferGeometry.prototype.createAttribute = function(name, itemSize, factory) {
  var buffer = new Float32Array(this.vertexCount * itemSize);
  var attribute = new THREE.BufferAttribute(buffer, itemSize);

  this.addAttribute(name, attribute);

  if (factory) {
    var data = [];

    for (var i = 0; i < this.faceCount; i++) {
      factory(data, i, this.faceCount);
      this.setFaceData(attribute, i, data);
    }
  }

  return attribute;
};

/**
 * Sets data for all vertices of a face at a given index.
 * Usually called in a loop.
 *
 * @param {String|THREE.BufferAttribute} attribute The attribute or attribute name where the data is to be stored.
 * @param {int} faceIndex Index of the face in the buffer geometry.
 * @param {Array} data Array of data. Length should be equal to item size of the attribute.
 */
THREE.BAS.ModelBufferGeometry.prototype.setFaceData = function(attribute, faceIndex, data) {
  attribute = (typeof attribute === 'string') ? this.attributes[attribute] : attribute;

  var offset = faceIndex * 3 * attribute.itemSize;

  for (var i = 0; i < 3; i++) {
    for (var j = 0; j < attribute.itemSize; j++) {
      attribute.array[offset++] = data[j];
    }
  }
};

/**
 * A THREE.BufferGeometry where a 'prefab' geometry is repeated a number of times.
 *
 * @param {THREE.Geometry} prefab The THREE.Geometry instance to repeat.
 * @param {Number} count The number of times to repeat the geometry.
 * @constructor
 */
THREE.BAS.PrefabBufferGeometry = function(prefab, count) {
  THREE.BufferGeometry.call(this);

  /**
   * A reference to the prefab geometry used to create this instance.
   * @type {THREE.Geometry}
   */
  this.prefabGeometry = prefab;

  /**
   * Number of prefabs.
   * @type {Number}
   */
  this.prefabCount = count;

  /**
   * Number of vertices of the prefab.
   * @type {Number}
   */
  this.prefabVertexCount = prefab.vertices.length;

  this.bufferIndices();
  this.bufferPositions();
};
THREE.BAS.PrefabBufferGeometry.prototype = Object.create(THREE.BufferGeometry.prototype);
THREE.BAS.PrefabBufferGeometry.prototype.constructor = THREE.BAS.PrefabBufferGeometry;

THREE.BAS.PrefabBufferGeometry.prototype.bufferIndices = function() {
  var prefabFaceCount = this.prefabGeometry.faces.length;
  var prefabIndexCount = this.prefabGeometry.faces.length * 3;
  var prefabIndices = [];

  for (var h = 0; h < prefabFaceCount; h++) {
    var face = this.prefabGeometry.faces[h];
    prefabIndices.push(face.a, face.b, face.c);
  }

  var indexBuffer = new Uint32Array(this.prefabCount * prefabIndexCount);

  this.setIndex(new THREE.BufferAttribute(indexBuffer, 1));

  for (var i = 0; i < this.prefabCount; i++) {
    for (var k = 0; k < prefabIndexCount; k++) {
      indexBuffer[i * prefabIndexCount + k] = prefabIndices[k] + i * this.prefabVertexCount;
    }
  }
};

THREE.BAS.PrefabBufferGeometry.prototype.bufferPositions = function() {
  var positionBuffer = this.createAttribute('position', 3).array;

  for (var i = 0, offset = 0; i < this.prefabCount; i++) {
    for (var j = 0; j < this.prefabVertexCount; j++, offset += 3) {
      var prefabVertex = this.prefabGeometry.vertices[j];

      positionBuffer[offset    ] = prefabVertex.x;
      positionBuffer[offset + 1] = prefabVertex.y;
      positionBuffer[offset + 2] = prefabVertex.z;
    }
  }
};

/**
 * Creates a THREE.BufferAttribute with UV coordinates.
 */
THREE.BAS.PrefabBufferGeometry.prototype.bufferUvs = function() {
  var prefabFaceCount = this.prefabGeometry.faces.length;
  var prefabVertexCount = this.prefabVertexCount = this.prefabGeometry.vertices.length;
  var prefabUvs = [];

  for (var h = 0; h < prefabFaceCount; h++) {
    var face = this.prefabGeometry.faces[h];
    var uv = this.prefabGeometry.faceVertexUvs[0][h];

    prefabUvs[face.a] = uv[0];
    prefabUvs[face.b] = uv[1];
    prefabUvs[face.c] = uv[2];
  }

  var uvBuffer = this.createAttribute('uv', 2);

  for (var i = 0, offset = 0; i < this.prefabCount; i++) {
    for (var j = 0; j < prefabVertexCount; j++, offset += 2) {
      var prefabUv = prefabUvs[j];

      uvBuffer.array[offset] = prefabUv.x;
      uvBuffer.array[offset + 1] = prefabUv.y;
    }
  }
};

/**
 * Creates a THREE.BufferAttribute on this geometry instance.
 *
 * @param {String} name Name of the attribute.
 * @param {Number} itemSize Number of floats per vertex (typically 1, 2, 3 or 4).
 * @param {function=} factory Function that will be called for each prefab upon creation. Accepts 3 arguments: data[], index and prefabCount. Calls setPrefabData.
 *
 * @returns {THREE.BufferAttribute}
 */
THREE.BAS.PrefabBufferGeometry.prototype.createAttribute = function(name, itemSize, factory) {
  var buffer = new Float32Array(this.prefabCount * this.prefabVertexCount * itemSize);
  var attribute = new THREE.BufferAttribute(buffer, itemSize);

  this.addAttribute(name, attribute);

  if (factory) {
    var data = [];

    for (var i = 0; i < this.prefabCount; i++) {
      factory(data, i, this.prefabCount);
      this.setPrefabData(attribute, i, data);
    }
  }

  return attribute;
};

/**
 * Sets data for all vertices of a prefab at a given index.
 * Usually called in a loop.
 *
 * @param {String|THREE.BufferAttribute} attribute The attribute or attribute name where the data is to be stored.
 * @param {Number} prefabIndex Index of the prefab in the buffer geometry.
 * @param {Array} data Array of data. Length should be equal to item size of the attribute.
 */
THREE.BAS.PrefabBufferGeometry.prototype.setPrefabData = function(attribute, prefabIndex, data) {
  attribute = (typeof attribute === 'string') ? this.attributes[attribute] : attribute;

  var offset = prefabIndex * this.prefabVertexCount * attribute.itemSize;

  for (var i = 0; i < this.prefabVertexCount; i++) {
    for (var j = 0; j < attribute.itemSize; j++) {
      attribute.array[offset++] = data[j];
    }
  }
};

/**
 * Extends THREE.MeshBasicMaterial with custom shader chunks.
 *
 * @see http://three-bas-examples.surge.sh/examples/materials_basic/
 *
 * @param {Object} parameters Object containing material properties and custom shader chunks.
 * @constructor
 */
THREE.BAS.BasicAnimationMaterial = function(parameters) {
  this.varyingParameters = [];

  this.vertexFunctions = [];
  this.vertexParameters = [];
  this.vertexInit = [];
  this.vertexNormal = [];
  this.vertexPosition = [];
  this.vertexColor = [];

  this.fragmentFunctions = [];
  this.fragmentParameters = [];
  this.fragmentInit = [];
  this.fragmentMap = [];
  this.fragmentDiffuse = [];

  var basicShader = THREE.ShaderLib['basic'];

  THREE.BAS.BaseAnimationMaterial.call(this, parameters, basicShader.uniforms);

  this.lights = false;
  this.vertexShader = this._concatVertexShader();
  this.fragmentShader = this._concatFragmentShader();
};
THREE.BAS.BasicAnimationMaterial.prototype = Object.create(THREE.BAS.BaseAnimationMaterial.prototype);
THREE.BAS.BasicAnimationMaterial.prototype.constructor = THREE.BAS.BasicAnimationMaterial;

THREE.BAS.BasicAnimationMaterial.prototype._concatVertexShader = function() {
  // based on THREE.ShaderLib.basic
  return [

    '#include <common>',
    '#include <uv_pars_vertex>',
    '#include <uv2_pars_vertex>',
    '#include <envmap_pars_vertex>',
    '#include <color_pars_vertex>',
    '#include <morphtarget_pars_vertex>',
    '#include <skinning_pars_vertex>',
    '#include <logdepthbuf_pars_vertex>',
    '#include <clipping_planes_pars_vertex>',

    this._stringifyChunk('vertexFunctions'),
    this._stringifyChunk('vertexParameters'),
    this._stringifyChunk('varyingParameters'),

    "void main() {",

    this._stringifyChunk('vertexInit'),

    '#include <uv_vertex>',
    '#include <uv2_vertex>',
    '#include <color_vertex>',
    '#include <skinbase_vertex>',

    "	#ifdef USE_ENVMAP",

    '#include <beginnormal_vertex>',

    this._stringifyChunk('vertexNormal'),

    '#include <morphnormal_vertex>',
    '#include <skinnormal_vertex>',
    '#include <defaultnormal_vertex>',

    "	#endif",

    '#include <begin_vertex>',

    this._stringifyChunk('vertexPosition'),
    this._stringifyChunk('vertexColor'),

    '#include <morphtarget_vertex>',
    '#include <skinning_vertex>',
    '#include <project_vertex>',
    '#include <logdepthbuf_vertex>',

    '#include <worldpos_vertex>',
    '#include <clipping_planes_vertex>',
    '#include <envmap_vertex>',

    "}"

  ].join( "\n" );
};

THREE.BAS.BasicAnimationMaterial.prototype._concatFragmentShader = function() {
  return [
    "uniform vec3 diffuse;",
    "uniform float opacity;",

    this._stringifyChunk('fragmentFunctions'),
    this._stringifyChunk('fragmentParameters'),
    this._stringifyChunk('varyingParameters'),

    "#ifndef FLAT_SHADED",

    "	varying vec3 vNormal;",

    "#endif",

    '#include <common>',
    '#include <color_pars_fragment>',
    '#include <uv_pars_fragment>',
    '#include <uv2_pars_fragment>',
    '#include <map_pars_fragment>',
    '#include <alphamap_pars_fragment>',
    '#include <aomap_pars_fragment>',
    '#include <envmap_pars_fragment>',
    '#include <fog_pars_fragment>',
    '#include <specularmap_pars_fragment>',
    '#include <logdepthbuf_pars_fragment>',
    '#include <clipping_planes_pars_fragment>',

    "void main() {",

    '#include <clipping_planes_fragment>',

    this._stringifyChunk('fragmentInit'),

    "	vec4 diffuseColor = vec4( diffuse, opacity );",

    this._stringifyChunk('fragmentDiffuse'),

    '#include <logdepthbuf_fragment>',

    (this._stringifyChunk('fragmentMap') || '#include <map_fragment>'),

    '#include <color_fragment>',

    '#include <alphamap_fragment>',
    '#include <alphatest_fragment>',
    '#include <specularmap_fragment>',

    "	ReflectedLight reflectedLight;",
    "	reflectedLight.directDiffuse = vec3( 0.0 );",
    "	reflectedLight.directSpecular = vec3( 0.0 );",
    "	reflectedLight.indirectDiffuse = diffuseColor.rgb;",
    "	reflectedLight.indirectSpecular = vec3( 0.0 );",

    '#include <aomap_fragment>',

    "	vec3 outgoingLight = reflectedLight.indirectDiffuse;",

    '#include <normal_flip>',
    '#include <envmap_fragment>',

    "	gl_FragColor = vec4( outgoingLight, diffuseColor.a );",

    '#include <premultiplied_alpha_fragment>',
    '#include <tonemapping_fragment>',
    '#include <encodings_fragment>',
    '#include <fog_fragment>',

    "}"
  ].join('\n');
};

THREE.BAS.DepthAnimationMaterial = function (parameters) {
  this.depthPacking = THREE.RGBADepthPacking;
  this.clipping = true;

  this.vertexFunctions = [];
  this.vertexParameters = [];
  this.vertexInit = [];
  this.vertexPosition = [];

  THREE.BAS.BaseAnimationMaterial.call(this, parameters);

  var depthShader = THREE.ShaderLib['depth'];

  this.uniforms = THREE.UniformsUtils.merge([depthShader.uniforms, this.uniforms]);
  this.vertexShader = this._concatVertexShader();
  this.fragmentShader = depthShader.fragmentShader;
};
THREE.BAS.DepthAnimationMaterial.prototype = Object.create(THREE.BAS.BaseAnimationMaterial.prototype);
THREE.BAS.DepthAnimationMaterial.prototype.constructor = THREE.BAS.DepthAnimationMaterial;

THREE.BAS.DepthAnimationMaterial.prototype._concatVertexShader = function () {
  return [
    THREE.ShaderChunk["common"],
    THREE.ShaderChunk["uv_pars_vertex"],
    THREE.ShaderChunk["displacementmap_pars_vertex"],
    THREE.ShaderChunk["morphtarget_pars_vertex"],
    THREE.ShaderChunk["skinning_pars_vertex"],
    THREE.ShaderChunk["logdepthbuf_pars_vertex"],
    THREE.ShaderChunk["clipping_planes_pars_vertex"],

    this._stringifyChunk('vertexFunctions'),
    this._stringifyChunk('vertexParameters'),

    'void main() {',

    this._stringifyChunk('vertexInit'),

    THREE.ShaderChunk["uv_vertex"],
    THREE.ShaderChunk["skinbase_vertex"],

    THREE.ShaderChunk["begin_vertex"],

    this._stringifyChunk('vertexPosition'),


    THREE.ShaderChunk["displacementmap_vertex"],
    THREE.ShaderChunk["morphtarget_vertex"],
    THREE.ShaderChunk["skinning_vertex"],
    THREE.ShaderChunk["project_vertex"],
    THREE.ShaderChunk["logdepthbuf_vertex"],
    THREE.ShaderChunk["clipping_planes_vertex"],

    '}'

  ].join('\n');
};

THREE.BAS.DistanceAnimationMaterial = function (parameters) {
  this.depthPacking = THREE.RGBADepthPacking;
  this.clipping = true;

  this.vertexFunctions = [];
  this.vertexParameters = [];
  this.vertexInit = [];
  this.vertexPosition = [];

  THREE.BAS.BaseAnimationMaterial.call(this, parameters);

  var distanceShader = THREE.ShaderLib['distanceRGBA'];

  this.uniforms = THREE.UniformsUtils.merge([distanceShader.uniforms, this.uniforms]);
  this.vertexShader = this._concatVertexShader();
  this.fragmentShader = distanceShader.fragmentShader;
};
THREE.BAS.DistanceAnimationMaterial.prototype = Object.create(THREE.BAS.BaseAnimationMaterial.prototype);
THREE.BAS.DistanceAnimationMaterial.prototype.constructor = THREE.BAS.DistanceAnimationMaterial;

THREE.BAS.DistanceAnimationMaterial.prototype._concatVertexShader = function () {
  return [
    'varying vec4 vWorldPosition;',

    THREE.ShaderChunk["common"],
    THREE.ShaderChunk["morphtarget_pars_vertex"],
    THREE.ShaderChunk["skinning_pars_vertex"],
    THREE.ShaderChunk["clipping_planes_pars_vertex"],

    this._stringifyChunk('vertexFunctions'),
    this._stringifyChunk('vertexParameters'),

    'void main() {',

    this._stringifyChunk('vertexInit'),

    THREE.ShaderChunk["skinbase_vertex"],
    THREE.ShaderChunk["begin_vertex"],

    this._stringifyChunk('vertexPosition'),

    THREE.ShaderChunk["morphtarget_vertex"],
    THREE.ShaderChunk["skinning_vertex"],
    THREE.ShaderChunk["project_vertex"],
    THREE.ShaderChunk["worldpos_vertex"],
    THREE.ShaderChunk["clipping_planes_vertex"],

    'vWorldPosition = worldPosition;',

    '}'

  ].join('\n');
};

/**
 * Extends THREE.MeshPhongMaterial with custom shader chunks.
 *
 * @see http://three-bas-examples.surge.sh/examples/materials_phong/
 *
 * @param {Object} parameters Object containing material properties and custom shader chunks.
 * @constructor
 */
THREE.BAS.PhongAnimationMaterial = function (parameters) {
  this.varyingParameters = [];

  this.vertexFunctions = [];
  this.vertexParameters = [];
  this.vertexInit = [];
  this.vertexNormal = [];
  this.vertexPosition = [];
  this.vertexColor = [];

  this.fragmentFunctions = [];
  this.fragmentParameters = [];
  this.fragmentInit = [];
  this.fragmentMap = [];
  this.fragmentDiffuse = [];
  this.fragmentEmissive = [];
  this.fragmentSpecular = [];

  var phongShader = THREE.ShaderLib['phong'];

  THREE.BAS.BaseAnimationMaterial.call(this, parameters, phongShader.uniforms);

  this.lights = true;
  this.vertexShader = this._concatVertexShader();
  this.fragmentShader = this._concatFragmentShader();
};
THREE.BAS.PhongAnimationMaterial.prototype = Object.create(THREE.BAS.BaseAnimationMaterial.prototype);
THREE.BAS.PhongAnimationMaterial.prototype.constructor = THREE.BAS.PhongAnimationMaterial;

THREE.BAS.PhongAnimationMaterial.prototype._concatVertexShader = function () {
  // based on THREE.ShaderLib.phong
  return [
    "#define PHONG",

    "varying vec3 vViewPosition;",

    "#ifndef FLAT_SHADED",

    "	varying vec3 vNormal;",

    "#endif",

    '#include <common>',
    '#include <uv_pars_vertex>',
    '#include <uv2_pars_vertex>',
    '#include <displacementmap_pars_vertex>',
    '#include <envmap_pars_vertex>',
    '#include <color_pars_vertex>',
    '#include <morphtarget_pars_vertex>',
    '#include <skinning_pars_vertex>',
    '#include <shadowmap_pars_vertex>',
    '#include <logdepthbuf_pars_vertex>',
    '#include <clipping_planes_pars_vertex>',

    this._stringifyChunk('vertexFunctions'),
    this._stringifyChunk('vertexParameters'),
    this._stringifyChunk('varyingParameters'),

    "void main() {",

    this._stringifyChunk('vertexInit'),

    '#include <uv_vertex>',
    '#include <uv2_vertex>',
    '#include <color_vertex>',
    '#include <beginnormal_vertex>',

    this._stringifyChunk('vertexNormal'),

    '#include <morphnormal_vertex>',
    '#include <skinbase_vertex>',
    '#include <skinnormal_vertex>',
    '#include <defaultnormal_vertex>',

    "#ifndef FLAT_SHADED", // Normal computed with derivatives when FLAT_SHADED

    "	vNormal = normalize( transformedNormal );",

    "#endif",

    '#include <begin_vertex>',

    this._stringifyChunk('vertexPosition'),
    this._stringifyChunk('vertexColor'),

    '#include <displacementmap_vertex>',
    '#include <morphtarget_vertex>',
    '#include <skinning_vertex>',
    '#include <project_vertex>',
    '#include <logdepthbuf_vertex>',
    '#include <clipping_planes_vertex>',

    "	vViewPosition = - mvPosition.xyz;",

    '#include <worldpos_vertex>',
    '#include <envmap_vertex>',
    '#include <shadowmap_vertex>',

    "}"

  ].join("\n");
};

THREE.BAS.PhongAnimationMaterial.prototype._concatFragmentShader = function () {
  return [
    "#define PHONG",

    "uniform vec3 diffuse;",
    "uniform vec3 emissive;",
    "uniform vec3 specular;",
    "uniform float shininess;",
    "uniform float opacity;",

    this._stringifyChunk('fragmentFunctions'),
    this._stringifyChunk('fragmentParameters'),
    this._stringifyChunk('varyingParameters'),

    '#include <common>',
    '#include <packing>',
    '#include <color_pars_fragment>',
    '#include <uv_pars_fragment>',
    '#include <uv2_pars_fragment>',
    '#include <map_pars_fragment>',
    '#include <alphamap_pars_fragment>',
    '#include <aomap_pars_fragment>',
    '#include <lightmap_pars_fragment>',
    '#include <emissivemap_pars_fragment>',
    '#include <envmap_pars_fragment>',
    '#include <fog_pars_fragment>',
    '#include <bsdfs>',
    '#include <lights_pars>',
    '#include <lights_phong_pars_fragment>',
    '#include <shadowmap_pars_fragment>',
    '#include <bumpmap_pars_fragment>',
    '#include <normalmap_pars_fragment>',
    '#include <specularmap_pars_fragment>',
    '#include <logdepthbuf_pars_fragment>',
    '#include <clipping_planes_pars_fragment>',

    "void main() {",

    '#include <clipping_planes_fragment>',

    this._stringifyChunk('fragmentInit'),

    "	vec4 diffuseColor = vec4( diffuse, opacity );",
    "	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );",
    "	vec3 totalEmissiveRadiance = emissive;",

    this._stringifyChunk('fragmentDiffuse'),

    '#include <logdepthbuf_fragment>',
    (this._stringifyChunk('fragmentMap') || '#include <map_fragment>'),
    '#include <color_fragment>',

    '#include <alphamap_fragment>',
    '#include <alphatest_fragment>',
    '#include <specularmap_fragment>',
    '#include <normal_flip>',
    '#include <normal_fragment>',

    this._stringifyChunk('fragmentEmissive'),

    '#include <emissivemap_fragment>',

    // accumulation
    '#include <lights_phong_fragment>',

    this._stringifyChunk('fragmentSpecular'),

    '#include <lights_template>',

    // modulation
    '#include <aomap_fragment>',

    "vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;",

    '#include <envmap_fragment>',

    "	gl_FragColor = vec4( outgoingLight, diffuseColor.a );",

    '#include <premultiplied_alpha_fragment>',
    '#include <tonemapping_fragment>',
    '#include <encodings_fragment>',
    '#include <fog_fragment>',

    "}"

  ].join("\n")
};

/**
 * Extends THREE.MeshStandardMaterial with custom shader chunks.
 *
 * @see http://three-bas-examples.surge.sh/examples/materials_standard/
 *
 * @param {Object} parameters Object containing material properties and custom shader chunks.
 * @constructor
 */
THREE.BAS.StandardAnimationMaterial = function (parameters) {
  this.varyingParameters = [];

  this.vertexFunctions = [];
  this.vertexParameters = [];
  this.vertexInit = [];
  this.vertexNormal = [];
  this.vertexPosition = [];
  this.vertexColor = [];

  this.fragmentFunctions = [];
  this.fragmentParameters = [];
  this.fragmentInit = [];
  this.fragmentMap = [];
  this.fragmentDiffuse = [];
  this.fragmentRoughness = [];
  this.fragmentMetalness = [];
  this.fragmentEmissive = [];

  var standardShader = THREE.ShaderLib['standard'];

  THREE.BAS.BaseAnimationMaterial.call(this, parameters, standardShader.uniforms);

  this.lights = true;
  this.vertexShader = this._concatVertexShader();
  this.fragmentShader = this._concatFragmentShader();
};
THREE.BAS.StandardAnimationMaterial.prototype = Object.create(THREE.BAS.BaseAnimationMaterial.prototype);
THREE.BAS.StandardAnimationMaterial.prototype.constructor = THREE.BAS.StandardAnimationMaterial;

THREE.BAS.StandardAnimationMaterial.prototype._concatVertexShader = function () {
  // based on THREE.ShaderLib.physical
  return [
    "#define PHYSICAL",

    "varying vec3 vViewPosition;",

    "#ifndef FLAT_SHADED",

    "	varying vec3 vNormal;",

    "#endif",

    '#include <common>',
    '#include <uv_pars_vertex>',
    '#include <uv2_pars_vertex>',
    '#include <displacementmap_pars_vertex>',
    '#include <color_pars_vertex>',
    '#include <morphtarget_pars_vertex>',
    '#include <skinning_pars_vertex>',
    '#include <shadowmap_pars_vertex>',
    '#include <specularmap_pars_fragment>',
    '#include <logdepthbuf_pars_vertex>',
    '#include <clipping_planes_pars_vertex>',

    this._stringifyChunk('vertexFunctions'),
    this._stringifyChunk('vertexParameters'),
    this._stringifyChunk('varyingParameters'),

    "void main() {",

    this._stringifyChunk('vertexInit'),

    '#include <uv_vertex>',
    '#include <uv2_vertex>',
    '#include <color_vertex>',
    '#include <beginnormal_vertex>',

    this._stringifyChunk('vertexNormal'),

    '#include <morphnormal_vertex>',
    '#include <skinbase_vertex>',
    '#include <skinnormal_vertex>',
    '#include <defaultnormal_vertex>',

    "#ifndef FLAT_SHADED", // Normal computed with derivatives when FLAT_SHADED

    "	vNormal = normalize( transformedNormal );",

    "#endif",

    '#include <begin_vertex>',

    this._stringifyChunk('vertexPosition'),
    this._stringifyChunk('vertexColor'),

    '#include <displacementmap_vertex>',
    '#include <morphtarget_vertex>',
    '#include <skinning_vertex>',
    '#include <project_vertex>',
    '#include <logdepthbuf_vertex>',
    '#include <clipping_planes_vertex>',

    "	vViewPosition = - mvPosition.xyz;",

    '#include <worldpos_vertex>',
    '#include <shadowmap_vertex>',

    "}"

  ].join("\n");
};

THREE.BAS.StandardAnimationMaterial.prototype._concatFragmentShader = function () {
  return [
    "#define PHYSICAL",

    "uniform vec3 diffuse;",
    "uniform vec3 emissive;",
    "uniform float roughness;",
    "uniform float metalness;",
    "uniform float opacity;",

    '#ifndef STANDARD',
      'uniform float clearCoat;',
      'uniform float clearCoatRoughness;',
    '#endif',

    "uniform float envMapIntensity;",

    'varying vec3 vViewPosition;',

    '#ifndef FLAT_SHADED',
    'varying vec3 vNormal;',
    '#endif',

    this._stringifyChunk('fragmentFunctions'),
    this._stringifyChunk('fragmentParameters'),
    this._stringifyChunk('varyingParameters'),

    '#include <common>',
    '#include <packing>',
    '#include <color_pars_fragment>',
    '#include <uv_pars_fragment>',
    '#include <uv2_pars_fragment>',
    '#include <map_pars_fragment>',
    '#include <alphamap_pars_fragment>',
    '#include <aomap_pars_fragment>',
    '#include <lightmap_pars_fragment>',
    '#include <emissivemap_pars_fragment>',
    '#include <envmap_pars_fragment>',
    '#include <fog_pars_fragment>',
    '#include <bsdfs>',
    '#include <cube_uv_reflection_fragment>',
    '#include <lights_pars>',
    '#include <lights_physical_pars_fragment>',
    '#include <shadowmap_pars_fragment>',
    '#include <bumpmap_pars_fragment>',
    '#include <normalmap_pars_fragment>',
    '#include <roughnessmap_pars_fragment>',
    '#include <metalnessmap_pars_fragment>',
    '#include <logdepthbuf_pars_fragment>',
    '#include <clipping_planes_pars_fragment>',

    "void main() {",

    '#include <clipping_planes_fragment>',

    this._stringifyChunk('fragmentInit'),

    "	vec4 diffuseColor = vec4( diffuse, opacity );",
    "	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );",
    "	vec3 totalEmissiveRadiance = emissive;",

    this._stringifyChunk('fragmentDiffuse'),

    '#include <logdepthbuf_fragment>',
    (this._stringifyChunk('fragmentMap') || '#include <map_fragment>'),
    '#include <color_fragment>',

    '#include <alphamap_fragment>',
    '#include <alphatest_fragment>',
    '#include <specularmap_fragment>',

    //'#include <roughnessmap_fragment>',
    'float roughnessFactor = roughness;',
    this._stringifyChunk('fragmentRoughness'),
    '#ifdef USE_ROUGHNESSMAP',
    ' roughnessFactor *= texture2D( roughnessMap, vUv ).r;',
    '#endif',

    //'#include <metalnessmap_fragment>',
    'float metalnessFactor = metalness;',
    this._stringifyChunk('fragmentMetalness'),
    '#ifdef USE_METALNESSMAP',
    ' metalnessFactor *= texture2D( metalnessMap, vUv ).r;',
    '#endif',

    '#include <normal_flip>',
    '#include <normal_fragment>',

    this._stringifyChunk('fragmentEmissive'),

    '#include <emissivemap_fragment>',

    // accumulation
    '#include <lights_physical_fragment>',
    '#include <lights_template>',

    // modulation
    '#include <aomap_fragment>',

    "vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;",

    "	gl_FragColor = vec4( outgoingLight, diffuseColor.a );",

    '#include <premultiplied_alpha_fragment>',
    '#include <tonemapping_fragment>',
    '#include <encodings_fragment>',
    '#include <fog_fragment>',

    "}"

  ].join( "\n" )
};

THREE.BAS.Timeline.register('rotate', {
  compiler: function(segment) {
    var fromAxisAngle = new THREE.Vector4(
      segment.transition.from.axis.x,
      segment.transition.from.axis.y,
      segment.transition.from.axis.z,
      segment.transition.from.angle
    );

    var toAxis = segment.transition.to.axis || segment.transition.from.axis;
    var toAxisAngle = new THREE.Vector4(
      toAxis.x,
      toAxis.y,
      toAxis.z,
      segment.transition.to.angle
    );

    var origin = segment.transition.origin;

    return [
      THREE.BAS.TimelineChunks.delayDuration(segment),
      THREE.BAS.TimelineChunks.vec4('cRotationFrom' + segment.key, fromAxisAngle, 8),
      THREE.BAS.TimelineChunks.vec4('cRotationTo' + segment.key, toAxisAngle, 8),
      (origin && THREE.BAS.TimelineChunks.vec3('cOrigin' + segment.key, origin, 2)),

      'void applyTransform' + segment.key + '(float time, inout vec3 v) {',

      THREE.BAS.TimelineChunks.renderCheck(segment),
      THREE.BAS.TimelineChunks.progress(segment),

      (origin && 'v -= cOrigin' + segment.key + ';'),

      'vec3 axis = normalize(mix(cRotationFrom' + segment.key + '.xyz, cRotationTo' + segment.key + '.xyz, progress));',
      'float angle = mix(cRotationFrom' + segment.key + '.w, cRotationTo' + segment.key + '.w, progress);',
      'vec4 q = quatFromAxisAngle(axis, angle);',
      'v = rotateVector(q, v);',

      (origin && 'v += cOrigin' + segment.key + ';'),

      '}'
    ].join('\n');
  },
  defaultFrom: {axis: new THREE.Vector3(), angle: 0}
});

THREE.BAS.Timeline.register('scale', {
  compiler: function(segment) {
    var origin = segment.transition.origin;
    
    return [
      THREE.BAS.TimelineChunks.delayDuration(segment),
      THREE.BAS.TimelineChunks.vec3('cScaleFrom' + segment.key, segment.transition.from, 2),
      THREE.BAS.TimelineChunks.vec3('cScaleTo' + segment.key, segment.transition.to, 2),
      (origin && THREE.BAS.TimelineChunks.vec3('cOrigin' + segment.key, origin, 2)),

      'void applyTransform' + segment.key + '(float time, inout vec3 v) {',

      THREE.BAS.TimelineChunks.renderCheck(segment),
      THREE.BAS.TimelineChunks.progress(segment),
      
      (origin && 'v -= cOrigin' + segment.key + ';'),
      'v *= mix(cScaleFrom' + segment.key + ', cScaleTo' + segment.key + ', progress);',
      (origin && 'v += cOrigin' + segment.key + ';'),
      '}'
    ].join('\n');
  },
  defaultFrom: new THREE.Vector3(1, 1, 1)
});

THREE.BAS.TimelineChunks = {
  vec3: function(n, v, p) {
    var x = (v.x || 0).toPrecision(p);
    var y = (v.y || 0).toPrecision(p);
    var z = (v.z || 0).toPrecision(p);

    return 'vec3 ' + n + ' = vec3(' + x + ',' + y + ',' + z + ');';
  },
  vec4: function(n, v, p) {
    var x = (v.x || 0).toPrecision(p);
    var y = (v.y || 0).toPrecision(p);
    var z = (v.z || 0).toPrecision(p);
    var w = (v.w || 0).toPrecision(p);

    return 'vec4 ' + n + ' = vec4(' + x + ',' + y + ',' + z + ',' + w + ');';
  },
  delayDuration: function(segment) {
    return [
      'float cDelay' + segment.key + ' = ' + segment.start.toPrecision(4) + ';',
      'float cDuration' + segment.key + ' = ' + segment.duration.toPrecision(4) + ';'
    ].join('\n');
  },
  progress: function(segment) {
    // zero duration segments should always render complete
    if (segment.duration === 0) {
      return 'float progress = 1.0;'
    }
    else {
      return [
        'float progress = clamp(time - cDelay' + segment.key + ', 0.0, cDuration' + segment.key + ') / cDuration' + segment.key + ';',
        segment.transition.ease ? 'progress = ' + segment.transition.ease + '(progress' + (segment.transition.easeParams ? ',' + segment.transition.easeParams.map(function(v){return v.toPrecision(4)}).join(',') : '') + ');' : ''
      ].join('\n');
    }
  },
  renderCheck: function(segment) {
    var startTime = segment.start.toPrecision(4);
    var endTime = (segment.end + segment.trail).toPrecision(4);

    return 'if (time < ' + startTime + ' || time > ' + endTime + ') return;';
  }
};

/**
 * A timeline transition segment. An instance of this class is created internally when calling {@link THREE.BAS.Timeline.add}, so you should not use this class directly.
 * The instance is also passed the the compiler function if you register a transition through {@link THREE.BAS.Timeline.register}. There you can use the public properties of the segment to compile the glsl string.
 * @param {string} key A string key generated by the timeline to which this segment belongs. Keys are unique.
 * @param {number} start Start time of this segment in a timeline in seconds.
 * @param {number} duration Duration of this segment in seconds.
 * @param {object} transition Object describing the transition.
 * @param {function} compiler A reference to the compiler function from a transition definition.
 * @constructor
 */
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

THREE.BAS.Timeline.register('translate', {
  compiler: function(segment) {
    return [
      THREE.BAS.TimelineChunks.delayDuration(segment),
      THREE.BAS.TimelineChunks.vec3('cTranslateFrom' + segment.key, segment.transition.from, 2),
      THREE.BAS.TimelineChunks.vec3('cTranslateTo' + segment.key, segment.transition.to, 2),

      'void applyTransform' + segment.key + '(float time, inout vec3 v) {',

      THREE.BAS.TimelineChunks.renderCheck(segment),
      THREE.BAS.TimelineChunks.progress(segment),

      'v += mix(cTranslateFrom' + segment.key + ', cTranslateTo' + segment.key + ', progress);',
      '}'
    ].join('\n');
  },
  defaultFrom: new THREE.Vector3(0, 0, 0)
});
