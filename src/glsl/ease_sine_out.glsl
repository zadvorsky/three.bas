float easeSineOut(float t, float b, float c, float d) {
  return c * sin(t/d * 1.57079632679) + b;
}

float easeSineOut(float t) {
  return sin(t * 1.57079632679);
}
