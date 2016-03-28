float ease(float t, float b, float c, float d) {
  float s = 1.70158;
  return c*((t=t/d-1.0)*t*((s+1.0)*t + s) + 1.0) + b;
}

float ease(float t, float b, float c, float d, float s) {
  return c*((t=t/d-1.0)*t*((s+1.0)*t + s) + 1.0) + b;
}
