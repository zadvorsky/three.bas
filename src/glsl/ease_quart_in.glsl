float easeQuartIn(float t) {
  return t * t * t * t;
}

float easeQuartIn(float t, float b, float c, float d) {
  return b + easeQuartIn(t / d) * c;
}
