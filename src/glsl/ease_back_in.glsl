float easeBackIn(float t, float b, float c, float d, float s) {
  return c*(t/=d)*t*((s+1.0)*t - s) + b;
}

float easeBackIn(float t, float b, float c, float d) {
  return easeBackIn(t, b, c, d, 1.70158);
}

float easeBackIn(float t, float s) {
  return t*t*((s+1.0)*t - s);
}

float easeBackIn(float t) {
  return easeBackIn(t, 1.70158);
}
