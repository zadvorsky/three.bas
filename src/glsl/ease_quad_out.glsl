float easeQuadOut(float t) {
  return -t * (t - 2.0);
}

float easeQuadOut(float t, float b, float c, float d) {
  return b + easeQuadOut(t / d) * c;
}
