float easeCircIn(float t, float b, float c, float d) {
  return -c * (sqrt(1.0 - (t/=d)*t) - 1.0) + b;
}

float easeCircIn(float t) {
  return 1.0 - sqrt(1.0 - t * t);
}
