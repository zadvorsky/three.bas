THREE.BAS.Timeline.register('translate', {
  compiler: function(segment) {
    return [
      THREE.BAS.TimelineChunks.delayDuration(segment),
      THREE.BAS.TimelineChunks.vec3('cTranslateFrom' + segment.key, segment.transition.from, 2),
      THREE.BAS.TimelineChunks.vec3('cTranslateTo' + segment.key, segment.transition.to, 2),

      'void applyTransform' + segment.key + '(float time, inout vec3 v) {',

      THREE.BAS.TimelineChunks.renderCheck(segment),
      THREE.BAS.TimelineChunks.progress(segment),

      'v += mix(cTranslateFrom' + segment.key + ', cTranslateTo' + segment.key + ', progress);',
      '}'
    ].join('\n');
  },
  defaultFrom: new THREE.Vector3(0, 0, 0)
});
