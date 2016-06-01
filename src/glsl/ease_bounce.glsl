float easeBounceOut(float t, float b, float c, float d) {
    if ((t/=d) < (1.0/2.75)) {
        return c*(7.5625*t*t) + b;
    } else if (t < (2.0/2.75)) {
        return c*(7.5625*(t-=(1.5/2.75))*t + .75) + b;
    } else if (t < (2.5/2.75)) {
        return c*(7.5625*(t-=(2.25/2.75))*t + .9375) + b;
    } else {
        return c*(7.5625*(t-=(2.625/2.75))*t + .984375) + b;
    }
}

float easeBounceIn(float t, float b, float c, float d) {
    return c - easeBounceOut(d-t, 0.0, c, d) + b;
}

float easeBounceInOut(float t, float b, float c, float d) {
    if (t < d/2.0) return easeBounceIn(t * 2.0, 0.0, c, d) * .5 + b;
    return easeBounceOut(t * 2.0 - d, 0.0, c, d) * .5 + c * .5 + b;
}
