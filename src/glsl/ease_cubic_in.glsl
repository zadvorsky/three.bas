float easeCubicIn(float t) {
  return t * t * t;
}

float easeCubicIn(float t, float b, float c, float d) {
  return b + easeCubicIn(t / d) * c;
}
