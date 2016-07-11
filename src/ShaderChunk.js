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

