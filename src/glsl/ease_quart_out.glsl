float easeQuartOut(float t) {
  return 1.0 - pow(1.0 - t, 4.0);
}

float easeQuartOut(float t, float b, float c, float d) {
  return b + easeQuartOut(t / d) * c;
}
