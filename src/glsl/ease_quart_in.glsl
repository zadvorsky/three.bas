float easeQuartIn(float t, float b, float c, float d) {
  return c*(t/=d)*t*t*t + b;
}

float easeQuartIn(float t) {
  return pow(t, 4.0);
}
