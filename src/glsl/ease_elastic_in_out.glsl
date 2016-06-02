float easeElasticInOut(float p, float amplitude, float period) {
    float p1 = max(amplitude, 1.0);
    float p2 = period / min(amplitude, 1.0);
    float p3 = p2 / PI2 * (asin(1.0 / p1));

    return ((p *= 2.0) < 1.0) ? -0.5 * (p1 * pow(2.0, 10.0 * (p -= 1.0)) * sin((p - p3) * PI2 / p2)) : p1 * pow(2.0, -10.0 * (p -= 1.0)) * sin((p - p3) * PI2 / p2) * 0.5 + 1.0;
}

float easeElasticInOut(float p) {
    return easeElasticInOut(p, 1.0, 0.3);
}

float easeElasticInOut(float t, float b, float c, float d, float amplitude, float period) {
    return b + easeElasticInOut(t / d, amplitude, period) * c;
}

float easeElasticInOut(float t, float b, float c, float d) {
    return b + easeElasticInOut(t / d) * c;
}
