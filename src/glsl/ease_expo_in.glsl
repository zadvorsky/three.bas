float easeExpoIn(float t, float b, float c, float d) {
  return (t==0.0) ? b : c * pow(2.0, 10.0 * (t/d - 1.0)) + b;
}

float easeExpoIn(float t) {
  return t == 0.0 ? t : pow(2.0, 10.0 * (t - 1.0));
}
