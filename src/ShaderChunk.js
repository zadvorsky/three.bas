THREE.BAS.ShaderChunk = {};

THREE.BAS.ShaderChunk["animation_time"] = "float tDelay = aAnimation.x;\nfloat tDuration = aAnimation.y;\nfloat tTime = clamp(uTime - tDelay, 0.0, tDuration);\nfloat tProgress = ease(tTime, 0.0, 1.0, tDuration);\n";

THREE.BAS.ShaderChunk["catmull-rom"] = "vec3 catmullRom(vec3 p0, vec3 p1, vec3 p2, vec3 p3, float t)\n{\n    vec3 v0 = (p2 - p0) * 0.5;\n    vec3 v1 = (p3 - p1) * 0.5;\n    float t2 = t * t;\n    float t3 = t * t * t;\n\n    return vec3((2.0 * p1 - 2.0 * p2 + v0 + v1) * t3 + (-3.0 * p1 + 3.0 * p2 - 2.0 * v0 - v1) * t2 + v0 * t + p1);\n}\n\nvec3 catmullRom(vec3 p0, vec3 p1, vec3 p2, vec3 p3, vec2 c, float t)\n{\n    vec3 v0 = (p2 - p0) * c.x;\n    vec3 v1 = (p3 - p1) * c.y;\n    float t2 = t * t;\n    float t3 = t * t * t;\n\n    return vec3((2.0 * p1 - 2.0 * p2 + v0 + v1) * t3 + (-3.0 * p1 + 3.0 * p2 - 2.0 * v0 - v1) * t2 + v0 * t + p1);\n}\n\nfloat catmullRom(float p0, float p1, float p2, float p3, float t)\n{\n    float v0 = (p2 - p0) * 0.5;\n    float v1 = (p3 - p1) * 0.5;\n    float t2 = t * t;\n    float t3 = t * t * t;\n\n    return float((2.0 * p1 - 2.0 * p2 + v0 + v1) * t3 + (-3.0 * p1 + 3.0 * p2 - 2.0 * v0 - v1) * t2 + v0 * t + p1);\n}\n\nfloat catmullRom(float p0, float p1, float p2, float p3, vec2 c, float t)\n{\n    float v0 = (p2 - p0) * c.x;\n    float v1 = (p3 - p1) * c.y;\n    float t2 = t * t;\n    float t3 = t * t * t;\n\n    return float((2.0 * p1 - 2.0 * p2 + v0 + v1) * t3 + (-3.0 * p1 + 3.0 * p2 - 2.0 * v0 - v1) * t2 + v0 * t + p1);\n}\n";

THREE.BAS.ShaderChunk["cubic_bezier"] = "vec3 cubicBezier(vec3 p0, vec3 c0, vec3 c1, vec3 p1, float t)\n{\n    vec3 tp;\n    float tn = 1.0 - t;\n\n    tp.xyz = tn * tn * tn * p0.xyz + 3.0 * tn * tn * t * c0.xyz + 3.0 * tn * t * t * c1.xyz + t * t * t * p1.xyz;\n\n    return tp;\n}\n";

THREE.BAS.ShaderChunk["ease_back_in"] = "float easeBackIn(float t, float b, float c, float d, float s) {\n  return c*(t/=d)*t*((s+1.0)*t - s) + b;\n}\n\nfloat easeBackIn(float t, float b, float c, float d) {\n  return easeBackIn(t, b, c, d, 1.70158);\n}\n";

THREE.BAS.ShaderChunk["ease_back_in_out"] = "float easeBackInOut(float t, float b, float c, float d, float s) {\n  if ((t/=d/2.0) < 1.0) return c/2.0*(t*t*(((s*=(1.525))+1.0)*t - s)) + b;\n  return c/2.0*((t-=2.0)*t*(((s*=(1.525))+1.0)*t + s) + 2.0) + b;\n}\n\nfloat easeBackInOut(float t, float b, float c, float d) {\n  return easeBackInOut(t, b, c, d, 1.70158);\n}\n";

THREE.BAS.ShaderChunk["ease_back_out"] = "float easeBackOut(float t, float b, float c, float d, float s) {\n  return c*((t=t/d-1.0)*t*((s+1.0)*t + s) + 1.0) + b;\n}\n\nfloat easeBackOut(float t, float b, float c, float d) {\n  return easeBackOut(t, b, c, d, 1.70158);\n}\n";

THREE.BAS.ShaderChunk["ease_cubic_in"] = "float easeCubicIn(float t, float b, float c, float d) {\n  return c*(t/=d)*t*t + b;\n}\n";

THREE.BAS.ShaderChunk["ease_cubic_in_out"] = "float easeCubicInOut(float t, float b, float c, float d) {\n  if ((t/=d/2.0) < 1.0) return c/2.0*t*t*t + b;\n  return c/2.0*((t-=2.0)*t*t + 2.0) + b;\n}\n";

THREE.BAS.ShaderChunk["ease_cubic_out"] = "float easeCubicOut(float t, float b, float c, float d) {\n  return c*((t=t/d - 1.0)*t*t + 1.0) + b;\n}\n";

THREE.BAS.ShaderChunk["ease_quad_in"] = "float easeQuadIn(float t, float b, float c, float d) {\n  return c*(t/=d)*t + b;\n}\n";

THREE.BAS.ShaderChunk["ease_quad_in_out"] = "float easeQuadInOut(float t, float b, float c, float d) {\n  if ((t/=d/2.0) < 1.0) return c/2.0*t*t + b;\n  return -c/2.0 * ((--t)*(t-2.0) - 1.0) + b;\n}\n";

THREE.BAS.ShaderChunk["ease_quad_out"] = "float easeQuadOut(float t, float b, float c, float d) {\n  return -c *(t/=d)*(t-2.0) + b;\n}\n";

THREE.BAS.ShaderChunk["ease_quart_in"] = "float easeQuartIn(float t, float b, float c, float d) {\n  return c*(t/=d)*t*t*t + b;\n}\n";

THREE.BAS.ShaderChunk["ease_quart_in_out"] = "float easeQuartInOut(float t, float b, float c, float d) {\n    if ((t/=d/2.0) < 1.0) return c/2.0*t*t*t*t + b;\n    return -c/2.0 * ((t-=2.0)*t*t*t - 2.0) + b;\n}\n";

THREE.BAS.ShaderChunk["ease_quart_out"] = "float easeQuartOut(float t, float b, float c, float d) {\n  return -c * ((t=t/d-1.0)*t*t*t - 1.0) + b;\n}\n";

THREE.BAS.ShaderChunk["ease_quint_in"] = "float easeQuintIn(float t, float b, float c, float d) {\n    return c*(t/=d)*t*t*t*t + b;\n}\n";

THREE.BAS.ShaderChunk["ease_quint_in_out"] = "float easeQuintInOut(float t, float b, float c, float d) {\n    if ((t/=d/2.0) < 1.0) return c/2.0*t*t*t*t*t + b;\n    return c/2.0*((t-=2.0)*t*t*t*t + 2.0) + b;\n}\n";

THREE.BAS.ShaderChunk["ease_quint_out"] = "float easeQuintOut(float t, float b, float c, float d) {\n  return c*((t=t/d-1.0)*t*t*t*t + 1.0) + b;\n}\n";

THREE.BAS.ShaderChunk["quaternion_rotation"] = "vec3 rotateVector(vec4 q, vec3 v)\n{\n    return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v);\n}\n\nvec4 quatFromAxisAngle(vec3 axis, float angle)\n{\n    float halfAngle = angle * 0.5;\n    return vec4(axis.xyz * sin(halfAngle), cos(halfAngle));\n}\n";

