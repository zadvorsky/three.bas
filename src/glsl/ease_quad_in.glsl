float easeQuadIn(float t) {
    return t * t;
}

float easeQuadIn(float t, float b, float c, float d) {
  return b + easeQuadIn(t / d) * c;
}
