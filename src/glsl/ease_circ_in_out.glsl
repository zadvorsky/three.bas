float easeCircInOut(float t, float b, float c, float d) {
  if ((t/=d/2.0) < 1.0) return -c/2.0 * (sqrt(1.0 - t*t) - 1.0) + b;
  return c/2.0 * (sqrt(1.0 - (t-=2.0)*t) + 1.0) + b;
}
