float easeQuartOut(float t, float b, float c, float d) {
  return -c * ((t=t/d-1.0)*t*t*t - 1.0) + b;
}

float easeQuartOut(float t) {
  return 1.0 - pow(1.0 - t, 4.0);
}
