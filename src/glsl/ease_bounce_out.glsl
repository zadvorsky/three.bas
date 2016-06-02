float easeBounceOut(float p) {
    if (p < 1.0 / 2.75) {
        return 7.5625 * p * p;
    } else if (p < 2.0 / 2.75) {
        return 7.5625 * (p -= 1.5 / 2.75) * p + 0.75;
    } else if (p < 2.5 / 2.75) {
        return 7.5625 * (p -= 2.25 / 2.75) * p + 0.9375;
    }
    return 7.5625 * (p -= 2.625 / 2.75) * p + 0.984375;
}

float easeBounceOut(float t, float b, float c, float d) {
    return b + easeBounceOut(t / d) * c;
}
