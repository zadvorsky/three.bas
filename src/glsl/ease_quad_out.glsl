float easeQuadOut(float t, float b, float c, float d) {
  return -c *(t/=d)*(t-2.0) + b;
}

float easeQuadOut(float t) {
  return -t * (t - 2.0);
}
