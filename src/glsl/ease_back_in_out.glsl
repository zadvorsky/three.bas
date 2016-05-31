float easeBackInOut(float t, float b, float c, float d, float s) {
  if ((t/=d/2.0) < 1.0) return c/2.0*(t*t*(((s*=(1.525))+1.0)*t - s)) + b;
  return c/2.0*((t-=2.0)*t*(((s*=(1.525))+1.0)*t + s) + 2.0) + b;
}

float easeBackInOut(float t, float b, float c, float d) {
  return easeBackInOut(t, b, c, d, 1.70158);
}
