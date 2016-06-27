float easeCubicInOut(float t) {
  return (t /= 0.5) < 1.0 ? 0.5 * t * t * t : 0.5 * ((t-=2.0) * t * t + 2.0);
}

float easeCubicInOut(float t, float b, float c, float d) {
  return b + easeCubicInOut(t / d) * c;
}
