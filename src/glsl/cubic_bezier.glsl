vec3 cubicBezier(vec3 p0, vec3 c0, vec3 c1, vec3 p1, float t)
{
    vec3 tp;
    float tn = 1.0 - t;

    tp.xyz = tn * tn * tn * p0.xyz + 3.0 * tn * tn * t * c0.xyz + 3.0 * tn * t * t * c1.xyz + t * t * t * p1.xyz;

    return tp;
}
