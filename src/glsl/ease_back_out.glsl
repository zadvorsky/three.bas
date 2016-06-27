float easeBackOut(float p, float amplitude) {
    return ((p = p - 1.0) * p * ((amplitude + 1.0) * p + amplitude) + 1.0);
}

float easeBackOut(float p) {
    return easeBackOut(p, 1.70158);
}

float easeBackOut(float t, float b, float c, float d, float amplitude) {
    return b + easeBackOut(t / d, amplitude) * c;
}

float easeBackOut(float t, float b, float c, float d) {
    return b + easeBackOut(t / d) * c;
}
