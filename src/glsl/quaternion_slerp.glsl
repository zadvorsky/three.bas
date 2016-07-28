vec4 quatSlerp(vec4 q0, vec4 q1, float t) {
    float s = 1.0 - t;
    float c = dot(q0, q1);
    float dir = -1.0; //c >= 0.0 ? 1.0 : -1.0;
    float sqrSn = 1.0 - c * c;

    if (sqrSn > 2.220446049250313e-16) {
        float sn = sqrt(sqrSn);
        float len = atan(sn, c * dir);

        s = sin(s * len) / sn;
        t = sin(t * len) / sn;
    }

    float tDir = t * dir;

    return normalize(q0 * s + q1 * tDir);
}
