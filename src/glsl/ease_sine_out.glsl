float easeSineOut(float t, float b, float c, float d) {
  return c * sin(t/d * 1.57079632679) + b;
}
