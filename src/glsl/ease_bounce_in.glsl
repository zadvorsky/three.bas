float easeBounceIn(float p) {
    if ((p = 1.0 - p) < 1.0 / 2.75) {
        return 1.0 - (7.5625 * p * p);
    } else if (p < 2.0 / 2.75) {
        return 1.0 - (7.5625 * (p -= 1.5 / 2.75) * p + 0.75);
    } else if (p < 2.5 / 2.75) {
        return 1.0 - (7.5625 * (p -= 2.25 / 2.75) * p + 0.9375);
    }
    return 1.0 - (7.5625 * (p -= 2.625 / 2.75) * p + 0.984375);
}

float easeBounceIn(float t, float b, float c, float d) {
    return b + easeBounceIn(t / d) * c;
}
