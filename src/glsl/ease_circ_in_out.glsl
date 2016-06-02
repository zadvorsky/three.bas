float easeCircInOut(float t, float b, float c, float d) {
  if ((t/=d/2.0) < 1.0) return -c/2.0 * (sqrt(1.0 - t*t) - 1.0) + b;
  return c/2.0 * (sqrt(1.0 - (t-=2.0)*t) + 1.0) + b;
}

float easeCircInOut(float t) {
  return t < 0.5
    ? 0.5 * (1.0 - sqrt(1.0 - 4.0 * t * t))
    : 0.5 * (sqrt((3.0 - 2.0 * t) * (2.0 * t - 1.0)) + 1.0);
}
