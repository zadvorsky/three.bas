float easeBezier(float p, vec4 curve) {
    float ip = 1.0 - p;
    return (3.0 * ip * ip * p * curve.xy + 3.0 * ip * p * p * curve.zw + p * p * p).y;
}

float easeBezier(float t, float b, float c, float d, vec4 curve) {
    return b + easeBezier(t / d, curve) * c;
}
