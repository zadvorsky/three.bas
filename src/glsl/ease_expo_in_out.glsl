float easeExpoInOut(float t, float b, float c, float d) {
    if (t==0.0) return b;
    if (t==d) return b+c;
    if ((t/=d/2.0) < 1.0) return c/2.0 * pow(2.0, 10.0 * (t - 1.0)) + b;
    return c/2.0 * (-pow(2.0, -10.0 * --t) + 2.0) + b;
}


float easeExpoInOut(float t) {
  return t == 0.0 || t == 1.0
    ? t
    : t < 0.5
      ? +0.5 * pow(2.0, (20.0 * t) - 10.0)
      : -0.5 * pow(2.0, 10.0 - (t * 20.0)) + 1.0;
}
