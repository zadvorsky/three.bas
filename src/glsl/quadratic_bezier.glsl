vec3 quadraticBezier(vec3 p0, vec3 c0, vec3 p1, float t) {
    float tn = 1.0 - t;

    return tn * tn * p0 + 2.0 * tn * t * c0 + t * t * p1;
}

vec2 quadraticBezier(vec2 p0, vec2 c0, vec2 p1, float t) {
    float tn = 1.0 - t;

    return tn * tn * p0 + 2.0 * tn * t * c0 + t * t * p1;
}