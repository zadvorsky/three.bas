float easeBounceInOut(float p) {
    bool invert = (p < 0.5);

    p = invert ? (1.0 - (p * 2.0)) : ((p * 2.0) - 1.0);

    if (p < 1.0 / 2.75) {
        p = 7.5625 * p * p;
    } else if (p < 2.0 / 2.75) {
        p = 7.5625 * (p -= 1.5 / 2.75) * p + 0.75;
    } else if (p < 2.5 / 2.75) {
        p = 7.5625 * (p -= 2.25 / 2.75) * p + 0.9375;
    } else {
        p = 7.5625 * (p -= 2.625 / 2.75) * p + 0.984375;
    }

    return invert ? (1.0 - p) * 0.5 : p * 0.5 + 0.5;
}

float easeBounceInOut(float t, float b, float c, float d) {
    return b + easeBounceInOut(t / d) * c;
}
