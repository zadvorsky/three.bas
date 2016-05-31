float easeQuartOut(float t, float b, float c, float d) {
  return -c * ((t=t/d-1.0)*t*t*t - 1.0) + b;
}
