float easeBackOut(float t, float b, float c, float d, float s) {
  return c*((t=t/d-1.0)*t*((s+1.0)*t + s) + 1.0) + b;
}

float easeBackOut(float t, float b, float c, float d) {
  return easeBackOut(t, b, c, d, 1.70158);
}

float easeBackOut(float t, float s) {
  return ((t=t-1.0)*t*((s+1.0)*t + s) + 1.0);
}

float easeBackOut(float t) {
  return easeBackOut(t, 1.70158);
}
