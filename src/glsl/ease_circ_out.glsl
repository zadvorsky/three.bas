float easeCircOut(float t, float b, float c, float d) {
  return c * sqrt(1.0 - (t=t/d-1.0)*t) + b;
}
