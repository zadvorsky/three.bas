float easeExpoInOut(float p) {
    return ((p *= 2.0) < 1.0) ? 0.5 * pow(2.0, 10.0 * (p - 1.0)) : 0.5 * (2.0 - pow(2.0, -10.0 * (p - 1.0)));
}

float easeExpoInOut(float t, float b, float c, float d) {
    return b + easeExpoInOut(t / d) * c;
}
