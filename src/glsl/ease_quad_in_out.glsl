float easeQuadInOut(float t) {
    float p = 2.0 * t * t;
    return t < 0.5 ? p : -p + (4.0 * t) - 1.0;
}

float easeQuadInOut(float t, float b, float c, float d) {
    return b + easeQuadInOut(t / d) * c;
}
