THREE.BAS.TimelineChunks = {
  vec3: function(n, v, p) {
    return 'vec3 ' + n + ' = vec3(' + v.x.toPrecision(p) + ',' + v.y.toPrecision(p) + ',' + v.z.toPrecision(p) + ');';
  },
  vec4: function(n, v, p) {
    return 'vec4 ' + n + ' = vec4(' + v.x.toPrecision(p) + ',' + v.y.toPrecision(p) + ',' + v.z.toPrecision(p) + ',' + v.w.toPrecision(p) + ');';
  },
  delayDuration: function(segment) {
    return [
      'float cDelay' + segment.key + ' = ' + segment.start.toPrecision(4) + ';',
      'float cDuration' + segment.key + ' = ' + segment.duration.toPrecision(4) + ';'
    ].join('\n');
  },
  progress: function(segment) {
    return [
      'float progress = clamp(time - cDelay' + segment.key + ', 0.0, cDuration' + segment.key + ') / cDuration' + segment.key + ';',
      segment.transition.ease ? ('progress = ' + segment.transition.ease + '(progress);') : ''
    ].join('\n');
  },
  renderCheck: function(segment) {
    var startTime = segment.start.toPrecision(4);
    var endTime = (segment.end + segment.trail).toPrecision(4);

    return 'if (time < ' + startTime + ' || time > ' + endTime + ') return;';
  }
};
