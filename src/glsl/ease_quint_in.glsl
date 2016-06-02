float easeQuintIn(float t, float b, float c, float d) {
    return c*(t/=d)*t*t*t*t + b;
}

float easeQuintIn(float t) {
  return pow(t, 5.0);
}
