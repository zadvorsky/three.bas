float easeQuadOut(float t, float b, float c, float d) {
  return -c *(t/=d)*(t-2.0) + b;
}
