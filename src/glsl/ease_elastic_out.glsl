float easeElasticOut(float t, float b, float c, float d, float s, float p) {
    float a=c;

    if (t==0.0) return b;  if ((t/=d)==1.0) return b+c;  if (p == 0.0) p=d*.3;
    if (a < abs(c)) { a=c; s=p/4.0; }
    else s = p/PI2 * asin(c/a);
    return a*pow(2.0,-10.0*t) * sin( (t*d-s)*(PI2)/p ) + c + b;
}

float easeElasticOut(float t, float b, float c, float d) {
    float s=1.0;
    float p=0.3;

    return easeElasticOut(t, b, c, d, s, p);
}
