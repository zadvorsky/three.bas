float easeQuintOut(float t) {
    return 1.0 - (pow(t - 1.0, 5.0));
}

float easeQuintOut(float t, float b, float c, float d) {
    return b + easeQuintOut(t / d) * c;
}
