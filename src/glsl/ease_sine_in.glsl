float easeSineIn(float t, float b, float c, float d) {
  return -c * cos(t/d * 1.57079632679) + c + b;
}

float easeSineIn(float t) {
  return sin((t - 1.0) * 1.57079632679) + 1.0;
}
