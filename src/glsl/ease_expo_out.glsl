float easeExpoOut(float p) {
  return 1.0 - pow(2.0, -10.0 * p);
}

float easeExpoOut(float t, float b, float c, float d) {
  return b + easeExpoOut(t / d) * c;
}
