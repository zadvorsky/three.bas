float easeQuintInOut(float t, float b, float c, float d) {
    if ((t/=d/2.0) < 1.0) return c/2.0*t*t*t*t*t + b;
    return c/2.0*((t-=2.0)*t*t*t*t + 2.0) + b;
}

float easeQuintInOut(float t) {
  return t < 0.5
    ? +16.0 * pow(t, 5.0)
    : -0.5 * pow(2.0 * t - 2.0, 5.0) + 1.0;
}
