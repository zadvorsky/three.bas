float easeCubicOut(float t, float b, float c, float d) {
  return c*((t=t/d - 1.0)*t*t + 1.0) + b;
}

float easeCubicOut(float t) {
  float f = t - 1.0;
  return f * f * f + 1.0;
}
