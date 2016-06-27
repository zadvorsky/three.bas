float easeExpoIn(float p) {
    return pow(2.0, 10.0 * (p - 1.0));
}

float easeExpoIn(float t, float b, float c, float d) {
    return b + easeExpoIn(t / d) * c;
}
