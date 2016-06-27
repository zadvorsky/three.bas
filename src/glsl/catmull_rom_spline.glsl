vec4 catmullRomSpline(vec4 p0, vec4 p1, vec4 p2, vec4 p3, float t, vec2 c) {
    vec4 v0 = (p2 - p0) * c.x;
    vec4 v1 = (p3 - p1) * c.y;
    float t2 = t * t;
    float t3 = t * t * t;

    return vec4((2.0 * p1 - 2.0 * p2 + v0 + v1) * t3 + (-3.0 * p1 + 3.0 * p2 - 2.0 * v0 - v1) * t2 + v0 * t + p1);
}
vec4 catmullRomSpline(vec4 p0, vec4 p1, vec4 p2, vec4 p3, float t) {
    return catmullRomSpline(p0, p1, p2, p3, t, vec2(0.5, 0.5));
}

vec3 catmullRomSpline(vec3 p0, vec3 p1, vec3 p2, vec3 p3, float t, vec2 c) {
    vec3 v0 = (p2 - p0) * c.x;
    vec3 v1 = (p3 - p1) * c.y;
    float t2 = t * t;
    float t3 = t * t * t;

    return vec3((2.0 * p1 - 2.0 * p2 + v0 + v1) * t3 + (-3.0 * p1 + 3.0 * p2 - 2.0 * v0 - v1) * t2 + v0 * t + p1);
}
vec3 catmullRomSpline(vec3 p0, vec3 p1, vec3 p2, vec3 p3, float t) {
    return catmullRomSpline(p0, p1, p2, p3, t, vec2(0.5, 0.5));
}

vec2 catmullRomSpline(vec2 p0, vec2 p1, vec2 p2, vec2 p3, float t, vec2 c) {
    vec2 v0 = (p2 - p0) * c.x;
    vec2 v1 = (p3 - p1) * c.y;
    float t2 = t * t;
    float t3 = t * t * t;

    return vec2((2.0 * p1 - 2.0 * p2 + v0 + v1) * t3 + (-3.0 * p1 + 3.0 * p2 - 2.0 * v0 - v1) * t2 + v0 * t + p1);
}
vec2 catmullRomSpline(vec2 p0, vec2 p1, vec2 p2, vec2 p3, float t) {
    return catmullRomSpline(p0, p1, p2, p3, t, vec2(0.5, 0.5));
}

float catmullRomSpline(float p0, float p1, float p2, float p3, float t, vec2 c) {
    float v0 = (p2 - p0) * c.x;
    float v1 = (p3 - p1) * c.y;
    float t2 = t * t;
    float t3 = t * t * t;

    return float((2.0 * p1 - 2.0 * p2 + v0 + v1) * t3 + (-3.0 * p1 + 3.0 * p2 - 2.0 * v0 - v1) * t2 + v0 * t + p1);
}
float catmullRomSpline(float p0, float p1, float p2, float p3, float t) {
    return catmullRomSpline(p0, p1, p2, p3, t, vec2(0.5, 0.5));
}

ivec4 getCatmullRomSplineIndices(float l, float p) {
    float index = floor(p);
    int i0 = int(max(0.0, index - 1.0));
    int i1 = int(index);
    int i2 = int(min(index + 1.0, l));
    int i3 = int(min(index + 2.0, l));

    return ivec4(i0, i1, i2, i3);
}

ivec4 getCatmullRomSplineIndicesClosed(float l, float p) {
    float index = floor(p);
    int i0 = int(index == 0.0 ? l : index - 1.0);
    int i1 = int(index);
    int i2 = int(mod(index + 1.0, l));
    int i3 = int(mod(index + 2.0, l));

    return ivec4(i0, i1, i2, i3);
}
