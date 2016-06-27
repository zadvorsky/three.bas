float easeBackIn(float p, float amplitude) {
    return p * p * ((amplitude + 1.0) * p - amplitude);
}

float easeBackIn(float p) {
    return easeBackIn(p, 1.70158);
}

float easeBackIn(float t, float b, float c, float d, float amplitude) {
    return b + easeBackIn(t / d, amplitude) * c;
}

float easeBackIn(float t, float b, float c, float d) {
    return b + easeBackIn(t / d) * c;
}
