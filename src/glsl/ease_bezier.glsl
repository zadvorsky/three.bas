float easeBezier(float t, float b, float c, float d, vec4 control) {
    float f = t / d;
    float nf = 1.0 - f;
    vec2 p = 3.0 * nf * nf * f * control.xy + 3.0 * nf * f * f * control.zw + f * f * f;

    return b + c * p.y;
}

float easeBezier(float currentTime, vec2 delayDuration, vec4 control) {
    float f = clamp(currentTime - delayDuration.x, 0.0, delayDuration.y) / delayDuration.y;
    float nf = 1.0 - f;
    vec2 p = 3.0 * nf * nf * f * control.xy + 3.0 * nf * f * f * control.zw + f * f * f;

    return p.y;
}
