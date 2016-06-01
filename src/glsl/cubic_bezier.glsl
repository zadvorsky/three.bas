vec3 cubicBezier(vec3 p0, vec3 c0, vec3 c1, vec3 p1, float t) {
    float tn = 1.0 - t;

    return tn * tn * tn * p0 + 3.0 * tn * tn * t * c0 + 3.0 * tn * t * t * c1 + t * t * t * p1;
}

vec2 cubicBezier(vec2 p0, vec2 c0, vec2 c1, vec2 p1, float t) {
    float tn = 1.0 - t;

    return tn * tn * tn * p0 + 3.0 * tn * tn * t * c0 + 3.0 * tn * t * t * c1 + t * t * t * p1;
}
