THREE.BAS.TimelineChunks = {
  vec3: function(n, v, p) {
    return 'vec3 ' + n + ' = vec3(' + v.x.toPrecision(p) + ',' + v.y.toPrecision(p) + ',' + v.z.toPrecision(p) + ');';
  },
  vec4: function(n, v, p) {
    return 'vec4 ' + n + ' = vec4(' + v.x.toPrecision(p) + ',' + v.y.toPrecision(p) + ',' + v.z.toPrecision(p) + ',' + v.w.toPrecision(p) + ');';
  },
  delayDuration: function(key, delay, duration) {
    return [
      'float cDelay' + key + ' = ' + delay.toPrecision(4) + ';',
      'float cDuration' + key + ' = ' + duration.toPrecision(4) + ';'
    ].join('\n');
  },
  progress: function(key, ease) {
    return [
      'float progress = clamp(time - cDelay' + key + ', 0.0, cDuration' + key + ') / cDuration' + key + ';',
      'progress = ' + ease + '(progress);'
    ].join('\n');
  },
  renderCheck: function(segment) {
    var startTime = segment.start.toPrecision(4);
    var endTime = (segment.end + segment.trail).toPrecision(4);

    return 'if (time < ' + startTime + ' || time > ' + endTime + ') return;';
  }
};
