float easeElasticOut(float p, float amplitude, float period) {
    float p1 = max(amplitude, 1.0);
    float p2 = period / min(amplitude, 1.0);
    float p3 = p2 / PI2 * (asin(1.0 / p1));

    return p1 * pow(2.0, -10.0 * p) * sin((p - p3) * PI2 / p2) + 1.0;
}

float easeElasticOut(float p) {
    return easeElasticOut(p, 1.0, 0.3);
}

float easeElasticOut(float t, float b, float c, float d, float amplitude, float period) {
    return b + easeElasticOut(t / d, amplitude, period) * c;
}

float easeElasticOut(float t, float b, float c, float d) {
    return b + easeElasticOut(t / d) * c;
}
