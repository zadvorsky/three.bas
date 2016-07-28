THREE.BAS.Timeline.register('rotate', {
  compiler: function(segment) {
    var fromAxisAngle = new THREE.Vector4(
      segment.transition.from.axis.x,
      segment.transition.from.axis.y,
      segment.transition.from.axis.z,
      segment.transition.from.angle
    );

    var toAxis = segment.transition.to.axis || segment.transition.from.axis;
    var toAxisAngle = new THREE.Vector4(
      toAxis.x,
      toAxis.y,
      toAxis.z,
      segment.transition.to.angle
    );

    var origin = segment.transition.origin;

    return [
      THREE.BAS.TimelineChunks.delayDuration(segment),
      THREE.BAS.TimelineChunks.vec4('cRotationFrom' + segment.key, fromAxisAngle, 8),
      THREE.BAS.TimelineChunks.vec4('cRotationTo' + segment.key, toAxisAngle, 8),
      (origin && THREE.BAS.TimelineChunks.vec3('cOrigin' + segment.key, origin, 2)),

      'void applyTransform' + segment.key + '(float time, inout vec3 v) {',

      THREE.BAS.TimelineChunks.renderCheck(segment),
      THREE.BAS.TimelineChunks.progress(segment),

      (origin && 'v -= cOrigin' + segment.key + ';'),

      'vec3 axis = normalize(mix(cRotationFrom' + segment.key + '.xyz, cRotationTo' + segment.key + '.xyz, progress));',
      'float angle = mix(cRotationFrom' + segment.key + '.w, cRotationTo' + segment.key + '.w, progress);',
      'vec4 q = quatFromAxisAngle(axis, angle);',
      'v = rotateVector(q, v);',

      (origin && 'v += cOrigin' + segment.key + ';'),

      '}'
    ].join('\n');
  },
  defaultFrom: {axis: new THREE.Vector3(), angle: 0}
});
