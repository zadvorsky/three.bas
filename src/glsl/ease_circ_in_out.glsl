float easeCircInOut(float p) {
    return ((p *= 2.0) < 1.0) ? -0.5 * (sqrt(1.0 - p * p) - 1.0) : 0.5 * (sqrt(1.0 - (p -= 2.0) * p) + 1.0);
}

float easeCircInOut(float t, float b, float c, float d) {
    return b + easeCircInOut(t / d) * c;
}
