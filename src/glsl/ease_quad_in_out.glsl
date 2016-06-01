float easeQuadInOut(float t, float b, float c, float d) {
  if ((t/=d/2.0) < 1.0) return c/2.0*t*t + b;
  return -c/2.0 * ((--t)*(t-2.0) - 1.0) + b;
}

float easeQuadInOut(float t) {
  float p = 2.0 * t * t;
  return t < 0.5 ? p : -p + (4.0 * t) - 1.0;
}
