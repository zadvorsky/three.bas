float easeExpoOut(float t, float b, float c, float d) {
  return (t==d) ? b+c : c * (-pow(2.0, -10.0 * t/d) + 1.0) + b;
}

float easeExpoOut(float t) {
  return t == 1.0 ? t : 1.0 - pow(2.0, -10.0 * t);
}
