float easeCubicOut(float t) {
  float f = t - 1.0;
  return f * f * f + 1.0;
}

float easeCubicOut(float t, float b, float c, float d) {
  return b + easeCubicOut(t / d) * c;
}
