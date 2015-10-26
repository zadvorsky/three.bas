float ease(float t, float b, float c, float d, float s) {
#if EASE_FUNCTION == 0
    return c * ((t = t / d - 1.0) * t * t + 1.0) + b;
#endif
#if EASE_FUNCTION == 1
    return -c * ((t = t / d - 1.0) * t * t * t - 1.0) + b;
#endif

#if EASE_FUNCTION == 2
    return c * ((t = t / d - 1.0) * t * t * t * t + 1.0) + b;
#endif
}
