float easeCircOut(float p) {
  return sqrt(1.0 - (p = p - 1.0) * p);
}

float easeCircOut(float t, float b, float c, float d) {
  return b + easeCircOut(t / d) * c;
}
