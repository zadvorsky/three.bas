vec3 catmullRom(vec3 p0, vec3 p1, vec3 p2, vec3 p3, float t)
{
    vec3 v0 = (p2 - p0) * 0.5;
    vec3 v1 = (p3 - p1) * 0.5;
    float t2 = t * t;
    float t3 = t * t * t;

    return vec3((2.0 * p1 - 2.0 * p2 + v0 + v1) * t3 + (-3.0 * p1 + 3.0 * p2 - 2.0 * v0 - v1) * t2 + v0 * t + p1);
}
