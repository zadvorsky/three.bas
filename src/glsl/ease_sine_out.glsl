float easeSineOut(float p) {
  return sin(p * 1.57079632679);
}

float easeSineOut(float t, float b, float c, float d) {
  return b + easeSineOut(t / d) * c;
}
