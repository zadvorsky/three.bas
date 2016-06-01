float easeSineIn(float t, float b, float c, float d) {
  return -c * cos(t/d * 1.57079632679) + c + b;
}
