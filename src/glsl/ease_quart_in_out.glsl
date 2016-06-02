float easeQuartInOut(float t, float b, float c, float d) {
    if ((t/=d/2.0) < 1.0) return c/2.0*t*t*t*t + b;
    return -c/2.0 * ((t-=2.0)*t*t*t - 2.0) + b;
}

float easeQuartInOut(float t) {
  return t < 0.5
    ? +8.0 * pow(t, 4.0)
    : -8.0 * pow(t - 1.0, 4.0) + 1.0;
}
