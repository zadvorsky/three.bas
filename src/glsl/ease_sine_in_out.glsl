float easeSineInOut(float t, float b, float c, float d) {
  return -c/2.0 * (cos(PI*t/d) - 1.0) + b;
}

float easeSineInOut(float t) {
  return -0.5 * (cos(PI * t) - 1.0);
}
