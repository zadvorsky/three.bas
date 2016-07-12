THREE.BAS.Timeline.register('rotate', {
  compiler: function(segment) {
    var fromAxisAngle = new THREE.Vector4(
      segment.transition.axis.x,
      segment.transition.axis.y,
      segment.transition.axis.z,
      segment.transition.from
    );

    var toAxisAngle = new THREE.Vector4(
      segment.transition.axis.x,
      segment.transition.axis.y,
      segment.transition.axis.z,
      segment.transition.to
    );

    return [
      THREE.BAS.TimelineChunks.delayDuration(segment),
      THREE.BAS.TimelineChunks.vec4('cRotationFrom' + segment.key, fromAxisAngle, 8),
      THREE.BAS.TimelineChunks.vec4('cRotationTo' + segment.key, toAxisAngle, 8),

      'void applyTransform' + segment.key + '(float time, inout vec3 v) {',

      THREE.BAS.TimelineChunks.renderCheck(segment),
      THREE.BAS.TimelineChunks.progress(segment),

      'vec4 q = quatFromAxisAngle(cRotationFrom' + segment.key + '.xyz' + ', mix(cRotationFrom' + segment.key + '.w, cRotationTo' + segment.key + '.w, progress));',
      'v = rotateVector(q, v);',
      '}'
    ].join('\n');
  },
  defaultFrom: 0
});
