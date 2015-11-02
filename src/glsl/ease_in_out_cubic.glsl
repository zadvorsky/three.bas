float ease(float t, float b, float c, float d) {
  if ((t/=d/2.0) < 1.0) return c/2.0*t*t*t + b;
  return c/2.0*((t-=2.0)*t*t + 2.0) + b;
}
