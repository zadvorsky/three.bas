float easeBezier(float t, float b, float c, float d, vec2 c0, vec2 c1) {
    vec2 p0 = vec2(0.0, 0.0);
    vec2 p1 = vec2(1.0, 1.0);
    float f = t / d;
    float nf = 1.0 - f;
    vec2 p = nf * nf * nf * p0 + 3.0 * nf * nf * f * c0 + 3.0 * nf * f * f * c1 + f * f * f * p1;

    return b + c * p.y;
}

//float easeCircOut(vec2 c0, vec2 c1, float f) {
//    vec2 p0 = vec2(0.0, 0.0);
//    vec2 p1 = vec2(1.0, 1.0);
//    float nf = 1.0 - f;
//    vec2 p = nf * nf * nf * p0 + 3.0 * nf * nf * f * c0 + 3.0 * nf * f * f * c1 + f * f * f * p1;
//
//    return p.y;
//}
