float easeSineIn(float p) {
  return -cos(p * 1.57079632679) + 1.0;
}

float easeSineIn(float t, float b, float c, float d) {
  return b + easeSineIn(t / d) * c;
}
