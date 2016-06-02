float easeCubicInOut(float t, float b, float c, float d) {
  if ((t/=d/2.0) < 1.0) return c/2.0*t*t*t + b;
  return c/2.0*((t-=2.0)*t*t + 2.0) + b;
}


float easeCubicInOut(float t) {
  return t < 0.5
    ? 4.0 * t * t * t
    : -0.5 * pow(2.0 * t - 2.0, 3.0) + 1.0;
}
