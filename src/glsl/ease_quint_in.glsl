float easeQuintIn(float t) {
    return pow(t, 5.0);
}

float easeQuintIn(float t, float b, float c, float d) {
    return b + easeQuintIn(t / d) * c;
}
