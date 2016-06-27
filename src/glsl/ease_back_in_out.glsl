float easeBackInOut(float p, float amplitude) {
    amplitude *= 1.525;

    return ((p *= 2.0) < 1.0) ? 0.5 * p * p * ((amplitude + 1.0) * p - amplitude) : 0.5 * ((p -= 2.0) * p * ((amplitude + 1.0) * p + amplitude) + 2.0);
}

float easeBackInOut(float p) {
    return easeBackInOut(p, 1.70158);
}

float easeBackInOut(float t, float b, float c, float d, float amplitude) {
    return b + easeBackInOut(t / d, amplitude) * c;
}

float easeBackInOut(float t, float b, float c, float d) {
    return b + easeBackInOut(t / d) * c;
}
