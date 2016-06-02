float easeSineInOut(float p) {
  return -0.5 * (cos(PI * p) - 1.0);
}

float easeSineInOut(float t, float b, float c, float d) {
  return b + easeSineInOut(t / d) * c;
}
