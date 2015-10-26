float tDelay = aAnimation.x;
float tDuration = aAnimation.y;
float tTime = clamp(uTime - tDelay, 0.0, tDuration);
float tProgress = ease(tTime, 0.0, 1.0, tDuration);
