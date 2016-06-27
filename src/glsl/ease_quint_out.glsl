float easeQuintOut(float t) {
    return (t -= 1.0) * t * t * t * t + 1.0;
}

float easeQuintOut(float t, float b, float c, float d) {
    return b + easeQuintOut(t / d) * c;
}
