THREE.BAS.ShaderChunk = {};

THREE.BAS.ShaderChunk["catmull-rom"] = "vec3 catmullRom(vec3 p0, vec3 p1, vec3 p2, vec3 p3, float t)\n{\n    vec3 v0 = (p2 - p0) * 0.5;\n    vec3 v1 = (p3 - p1) * 0.5;\n    float t2 = t * t;\n    float t3 = t * t * t;\n\n    return vec3((2.0 * p1 - 2.0 * p2 + v0 + v1) * t3 + (-3.0 * p1 + 3.0 * p2 - 2.0 * v0 - v1) * t2 + v0 * t + p1);\n}\n\nvec3 catmullRom(vec3 p0, vec3 p1, vec3 p2, vec3 p3, vec2 c, float t)\n{\n    vec3 v0 = (p2 - p0) * c.x;\n    vec3 v1 = (p3 - p1) * c.y;\n    float t2 = t * t;\n    float t3 = t * t * t;\n\n    return vec3((2.0 * p1 - 2.0 * p2 + v0 + v1) * t3 + (-3.0 * p1 + 3.0 * p2 - 2.0 * v0 - v1) * t2 + v0 * t + p1);\n}\n\nfloat catmullRom(float p0, float p1, float p2, float p3, float t)\n{\n    float v0 = (p2 - p0) * 0.5;\n    float v1 = (p3 - p1) * 0.5;\n    float t2 = t * t;\n    float t3 = t * t * t;\n\n    return float((2.0 * p1 - 2.0 * p2 + v0 + v1) * t3 + (-3.0 * p1 + 3.0 * p2 - 2.0 * v0 - v1) * t2 + v0 * t + p1);\n}\n\nfloat catmullRom(float p0, float p1, float p2, float p3, vec2 c, float t)\n{\n    float v0 = (p2 - p0) * c.x;\n    float v1 = (p3 - p1) * c.y;\n    float t2 = t * t;\n    float t3 = t * t * t;\n\n    return float((2.0 * p1 - 2.0 * p2 + v0 + v1) * t3 + (-3.0 * p1 + 3.0 * p2 - 2.0 * v0 - v1) * t2 + v0 * t + p1);\n}\n";

THREE.BAS.ShaderChunk["cubic_bezier"] = "vec3 cubicBezier(vec3 p0, vec3 c0, vec3 c1, vec3 p1, float t)\n{\n    vec3 tp;\n    float tn = 1.0 - t;\n\n    tp.xyz = tn * tn * tn * p0.xyz + 3.0 * tn * tn * t * c0.xyz + 3.0 * tn * t * t * c1.xyz + t * t * t * p1.xyz;\n\n    return tp;\n}\n";

THREE.BAS.ShaderChunk["ease_back_in"] = "float easeBackIn(float t, float b, float c, float d, float s) {\n  return c*(t/=d)*t*((s+1.0)*t - s) + b;\n}\n\nfloat easeBackIn(float t, float b, float c, float d) {\n  return easeBackIn(t, b, c, d, 1.70158);\n}\n";

THREE.BAS.ShaderChunk["ease_back_in_out"] = "float easeBackInOut(float t, float b, float c, float d, float s) {\n  if ((t/=d/2.0) < 1.0) return c/2.0*(t*t*(((s*=(1.525))+1.0)*t - s)) + b;\n  return c/2.0*((t-=2.0)*t*(((s*=(1.525))+1.0)*t + s) + 2.0) + b;\n}\n\nfloat easeBackInOut(float t, float b, float c, float d) {\n  return easeBackInOut(t, b, c, d, 1.70158);\n}\n";

THREE.BAS.ShaderChunk["ease_back_out"] = "float easeBackOut(float t, float b, float c, float d, float s) {\n  return c*((t=t/d-1.0)*t*((s+1.0)*t + s) + 1.0) + b;\n}\n\nfloat easeBackOut(float t, float b, float c, float d) {\n  return easeBackOut(t, b, c, d, 1.70158);\n}\n";

THREE.BAS.ShaderChunk["ease_bounce"] = "float easeBounceOut(float t, float b, float c, float d) {\n    if ((t/=d) < (1.0/2.75)) {\n        return c*(7.5625*t*t) + b;\n    } else if (t < (2.0/2.75)) {\n        return c*(7.5625*(t-=(1.5/2.75))*t + .75) + b;\n    } else if (t < (2.5/2.75)) {\n        return c*(7.5625*(t-=(2.25/2.75))*t + .9375) + b;\n    } else {\n        return c*(7.5625*(t-=(2.625/2.75))*t + .984375) + b;\n    }\n}\n\nfloat easeBounceIn(float t, float b, float c, float d) {\n    return c - easeBounceOut(d-t, 0.0, c, d) + b;\n}\n\nfloat easeBounceInOut(float t, float b, float c, float d) {\n    if (t < d/2.0) return easeBounceIn(t * 2.0, 0.0, c, d) * .5 + b;\n    return easeBounceOut(t * 2.0 - d, 0.0, c, d) * .5 + c * .5 + b;\n}\n";

THREE.BAS.ShaderChunk["ease_circ_in"] = "float easeCircIn(float t, float b, float c, float d) {\n  return -c * (sqrt(1.0 - (t/=d)*t) - 1.0) + b;\n}\n";

THREE.BAS.ShaderChunk["ease_circ_in_out"] = "float easeCircInOut(float t, float b, float c, float d) {\n  if ((t/=d/2.0) < 1.0) return -c/2.0 * (sqrt(1.0 - t*t) - 1.0) + b;\n  return c/2.0 * (sqrt(1.0 - (t-=2.0)*t) + 1.0) + b;\n}\n";

THREE.BAS.ShaderChunk["ease_circ_out"] = "float easeCircOut(float t, float b, float c, float d) {\n  return c * sqrt(1.0 - (t=t/d-1.0)*t) + b;\n}\n";

THREE.BAS.ShaderChunk["ease_cubic_in"] = "float easeCubicIn(float t, float b, float c, float d) {\n  return c*(t/=d)*t*t + b;\n}\n";

THREE.BAS.ShaderChunk["ease_cubic_in_out"] = "float easeCubicInOut(float t, float b, float c, float d) {\n  if ((t/=d/2.0) < 1.0) return c/2.0*t*t*t + b;\n  return c/2.0*((t-=2.0)*t*t + 2.0) + b;\n}\n";

THREE.BAS.ShaderChunk["ease_cubic_out"] = "float easeCubicOut(float t, float b, float c, float d) {\n  return c*((t=t/d - 1.0)*t*t + 1.0) + b;\n}\n";

THREE.BAS.ShaderChunk["ease_elastic_in"] = "float easeElasticIn(float t, float b, float c, float d, float s, float p) {\n    float a=c;\n\n    if (t==0.0) return b;  if ((t/=d)==1.0) return b+c;  if (p == 0.0) p=d*.3;\n    if (a < abs(c)) { a=c; s=p/4.0; }\n    else s = p/PI2 * asin (c/a);\n    return -(a*pow(2.0,10.0*(t-=1.0)) * sin( (t*d-s)*PI2/p )) + b;\n}\n\nfloat easeElasticIn(float t, float b, float c, float d) {\n    float s=1.0;\n    float p=0.3;\n\n    return easeElasticIn(t, b, c, d, s, p);\n}\n";

THREE.BAS.ShaderChunk["ease_elastic_in_out"] = "float easeElasticInOut(float t, float b, float c, float d, float s, float p) {\n    float a=c;\n\n    if (t==0.0) return b;  if ((t/=d/2.0)==2.0) return b+c;  if (p == 0.0) p=d*(0.449);\n    if (a < abs(c)) { a=c; s=p/4.0; }\n    else s = p/(2.0*PI) * asin(c/a);\n    if (t < 1.0) return -.5*(a*pow(2.0,10.0*(t-=1.0)) * sin( (t*d-s)*(2.0*PI)/p )) + b;\n    return a*pow(2.0,-10.0*(t-=1.0)) * sin( (t*d-s)*(2.0*PI)/p )*.5 + c + b;\n}\n\nfloat easeElasticInOut(float t, float b, float c, float d) {\n    float s=1.0;\n    float p=0.3;\n\n    return easeElasticInOut(t, b, c, d, s, p);\n}\n";

THREE.BAS.ShaderChunk["ease_elastic_out"] = "float easeElasticOut(float t, float b, float c, float d, float s, float p) {\n    float a=c;\n\n    if (t==0.0) return b;  if ((t/=d)==1.0) return b+c;  if (p == 0.0) p=d*.3;\n    if (a < abs(c)) { a=c; s=p/4.0; }\n    else s = p/PI2 * asin(c/a);\n    return a*pow(2.0,-10.0*t) * sin( (t*d-s)*(PI2)/p ) + c + b;\n}\n\nfloat easeElasticOut(float t, float b, float c, float d) {\n    float s=1.0;\n    float p=0.3;\n\n    return easeElasticOut(t, b, c, d, s, p);\n}\n";

THREE.BAS.ShaderChunk["ease_expo_in"] = "float easeExpoIn(float t, float b, float c, float d) {\n  return (t==0.0) ? b : c * pow(2.0, 10.0 * (t/d - 1.0)) + b;\n}\n";

THREE.BAS.ShaderChunk["ease_expo_in_out"] = "float easeExpoInOut(float t, float b, float c, float d) {\n    if (t==0.0) return b;\n    if (t==d) return b+c;\n    if ((t/=d/2.0) < 1.0) return c/2.0 * pow(2.0, 10.0 * (t - 1.0)) + b;\n    return c/2.0 * (-pow(2.0, -10.0 * --t) + 2.0) + b;\n}\n";

THREE.BAS.ShaderChunk["ease_expo_out"] = "float easeExpoOut(float t, float b, float c, float d) {\n  return (t==d) ? b+c : c * (-pow(2.0, -10.0 * t/d) + 1.0) + b;\n}\n";

THREE.BAS.ShaderChunk["ease_quad_in"] = "float easeQuadIn(float t, float b, float c, float d) {\n  return c*(t/=d)*t + b;\n}\n";

THREE.BAS.ShaderChunk["ease_quad_in_out"] = "float easeQuadInOut(float t, float b, float c, float d) {\n  if ((t/=d/2.0) < 1.0) return c/2.0*t*t + b;\n  return -c/2.0 * ((--t)*(t-2.0) - 1.0) + b;\n}\n";

THREE.BAS.ShaderChunk["ease_quad_out"] = "float easeQuadOut(float t, float b, float c, float d) {\n  return -c *(t/=d)*(t-2.0) + b;\n}\n";

THREE.BAS.ShaderChunk["ease_quart_in"] = "float easeQuartIn(float t, float b, float c, float d) {\n  return c*(t/=d)*t*t*t + b;\n}\n";

THREE.BAS.ShaderChunk["ease_quart_in_out"] = "float easeQuartInOut(float t, float b, float c, float d) {\n    if ((t/=d/2.0) < 1.0) return c/2.0*t*t*t*t + b;\n    return -c/2.0 * ((t-=2.0)*t*t*t - 2.0) + b;\n}\n";

THREE.BAS.ShaderChunk["ease_quart_out"] = "float easeQuartOut(float t, float b, float c, float d) {\n  return -c * ((t=t/d-1.0)*t*t*t - 1.0) + b;\n}\n";

THREE.BAS.ShaderChunk["ease_quint_in"] = "float easeQuintIn(float t, float b, float c, float d) {\n    return c*(t/=d)*t*t*t*t + b;\n}\n";

THREE.BAS.ShaderChunk["ease_quint_in_out"] = "float easeQuintInOut(float t, float b, float c, float d) {\n    if ((t/=d/2.0) < 1.0) return c/2.0*t*t*t*t*t + b;\n    return c/2.0*((t-=2.0)*t*t*t*t + 2.0) + b;\n}\n";

THREE.BAS.ShaderChunk["ease_quint_out"] = "float easeQuintOut(float t, float b, float c, float d) {\n  return c*((t=t/d-1.0)*t*t*t*t + 1.0) + b;\n}\n";

THREE.BAS.ShaderChunk["ease_sine_in"] = "float easeSineIn(float t, float b, float c, float d) {\n  return -c * cos(t/d * 1.57079632679) + c + b;\n}\n";

THREE.BAS.ShaderChunk["ease_sine_in_out"] = "float easeSineInOut(float t, float b, float c, float d) {\n  return -c/2.0 * (cos(PI*t/d) - 1.0) + b;\n}\n";

THREE.BAS.ShaderChunk["ease_sine_out"] = "float easeSineOut(float t, float b, float c, float d) {\n  return c * sin(t/d * 1.57079632679) + b;\n}\n";

THREE.BAS.ShaderChunk["quaternion_rotation"] = "vec3 rotateVector(vec4 q, vec3 v)\n{\n    return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v);\n}\n\nvec4 quatFromAxisAngle(vec3 axis, float angle)\n{\n    float halfAngle = angle * 0.5;\n    return vec4(axis.xyz * sin(halfAngle), cos(halfAngle));\n}\n";

