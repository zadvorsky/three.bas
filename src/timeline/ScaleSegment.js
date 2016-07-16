THREE.BAS.Timeline.register('scale', {
  compiler: function(segment) {
    var origin = segment.transition.origin;
    
    return [
      THREE.BAS.TimelineChunks.delayDuration(segment),
      THREE.BAS.TimelineChunks.vec3('cScaleFrom' + segment.key, segment.transition.from, 2),
      THREE.BAS.TimelineChunks.vec3('cScaleTo' + segment.key, segment.transition.to, 2),
      (origin && THREE.BAS.TimelineChunks.vec3('cOrigin' + segment.key, origin, 2)),

      'void applyTransform' + segment.key + '(float time, inout vec3 v) {',

      THREE.BAS.TimelineChunks.renderCheck(segment),
      THREE.BAS.TimelineChunks.progress(segment),
      
      (origin && 'v -= cOrigin' + segment.key + ';'),
      'v *= mix(cScaleFrom' + segment.key + ', cScaleTo' + segment.key + ', progress);',
      (origin && 'v += cOrigin' + segment.key + ';'),
      '}'
    ].join('\n');
  },
  defaultFrom: new THREE.Vector3(1, 1, 1)
});
