float easeCircIn(float p) {
    return -(sqrt(1.0 - p * p) - 1.0);
}

float easeCircIn(float t, float b, float c, float d) {
    return b + easeCircIn(t / d) * c;
}
