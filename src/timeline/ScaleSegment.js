THREE.BAS.Timeline.register('scale', {
  compiler: function(segment) {
    return [
      THREE.BAS.TimelineChunks.delayDuration(segment),
      THREE.BAS.TimelineChunks.vec3('cScaleFrom' + segment.key, segment.transition.from, 2),
      THREE.BAS.TimelineChunks.vec3('cScaleTo' + segment.key, segment.transition.to, 2),

      'void applyTransform' + segment.key + '(float time, inout vec3 v) {',

      THREE.BAS.TimelineChunks.renderCheck(segment),
      THREE.BAS.TimelineChunks.progress(segment),

      'v *= mix(cScaleFrom' + segment.key + ', cScaleTo' + segment.key + ', progress);',
      '}'
    ].join('\n');
  },
  defaultFrom: new THREE.Vector3(1, 1, 1)
});
