float easeElasticInOut(float t, float b, float c, float d, float s, float p) {
    float a=c;

    if (t==0.0) return b;  if ((t/=d/2.0)==2.0) return b+c;  if (p == 0.0) p=d*(0.449);
    if (a < abs(c)) { a=c; s=p/4.0; }
    else s = p/(2.0*PI) * asin(c/a);
    if (t < 1.0) return -.5*(a*pow(2.0,10.0*(t-=1.0)) * sin( (t*d-s)*(2.0*PI)/p )) + b;
    return a*pow(2.0,-10.0*(t-=1.0)) * sin( (t*d-s)*(2.0*PI)/p )*.5 + c + b;
}

float easeElasticInOut(float t, float b, float c, float d) {
    float s=1.0;
    float p=0.3;

    return easeElasticInOut(t, b, c, d, s, p);
}
