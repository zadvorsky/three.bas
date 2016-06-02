float easeCircOut(float t, float b, float c, float d) {
  return c * sqrt(1.0 - (t=t/d-1.0)*t) + b;
}

float easeCircOut(float t) {
  return sqrt((2.0 - t) * t);
}
