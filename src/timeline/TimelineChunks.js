THREE.BAS.TimelineChunks = {
  vec3: function(n, v, p) {
    var x = (v.x || 0).toPrecision(p);
    var y = (v.y || 0).toPrecision(p);
    var z = (v.z || 0).toPrecision(p);

    return 'vec3 ' + n + ' = vec3(' + x + ',' + y + ',' + z + ');';
  },
  vec4: function(n, v, p) {
    var x = (v.x || 0).toPrecision(p);
    var y = (v.y || 0).toPrecision(p);
    var z = (v.z || 0).toPrecision(p);
    var w = (v.w || 0).toPrecision(p);

    return 'vec4 ' + n + ' = vec4(' + x + ',' + y + ',' + z + ',' + w + ');';
  },
  delayDuration: function(segment) {
    return [
      'float cDelay' + segment.key + ' = ' + segment.start.toPrecision(4) + ';',
      'float cDuration' + segment.key + ' = ' + segment.duration.toPrecision(4) + ';'
    ].join('\n');
  },
  progress: function(segment) {
    // zero duration segments should always render complete
    if (segment.duration === 0) {
      return 'float progress = 1.0;'
    }
    else {
      return [
        'float progress = clamp(time - cDelay' + segment.key + ', 0.0, cDuration' + segment.key + ') / cDuration' + segment.key + ';',
        segment.transition.ease ? ('progress = ' + segment.transition.ease + '(progress);') : ''
      ].join('\n');
    }
  },
  renderCheck: function(segment) {
    var startTime = segment.start.toPrecision(4);
    var endTime = (segment.end + segment.trail).toPrecision(4);

    return 'if (time < ' + startTime + ' || time > ' + endTime + ') return;';
  }
};
