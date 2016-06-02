float easeCubicIn(float t, float b, float c, float d) {
  return c*(t/=d)*t*t + b;
}

float easeCubicIn(float t) {
  return t * t * t;
}
