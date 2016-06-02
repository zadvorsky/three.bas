float easeQuartInOut(float t) {
    return t < 0.5 ? 8.0 * pow(t, 4.0) : -8.0 * pow(t - 1.0, 4.0) + 1.0;
}

float easeQuartInOut(float t, float b, float c, float d) {
    return b + easeQuartInOut(t / d) * c;
}
