const TimelineChunks = {
  vec3: function(n, v, p) {
    const x = (v.x || 0).toPrecision(p);
    const y = (v.y || 0).toPrecision(p);
    const z = (v.z || 0).toPrecision(p);

    return `vec3 ${n} = vec3(${x}, ${y}, ${z});`;
  },
  vec4: function(n, v, p) {
    const x = (v.x || 0).toPrecision(p);
    const y = (v.y || 0).toPrecision(p);
    const z = (v.z || 0).toPrecision(p);
    const w = (v.w || 0).toPrecision(p);
  
    return `vec4 ${n} = vec4(${x}, ${y}, ${z}, ${w});`;
  },
  delayDuration: function(segment) {
    return `
    float cDelay${segment.key} = ${segment.start.toPrecision(4)};
    float cDuration${segment.key} = ${segment.duration.toPrecision(4)};
    `;
  },
  progress: function(segment) {
    // zero duration segments should always render complete
    if (segment.duration === 0) {
      return `float progress = 1.0;`
    }
    else {
      return `
      float progress = clamp(time - cDelay${segment.key}, 0.0, cDuration${segment.key}) / cDuration${segment.key};
      ${segment.transition.ease ? `progress = ${segment.transition.ease}(progress${(segment.transition.easeParams ? `, ${segment.transition.easeParams.map((v) => v.toPrecision(4)).join(`, `)}` : ``)});` : ``}
      `;
    }
  },
  renderCheck: function(segment) {
    const startTime = segment.start.toPrecision(4);
    const endTime = (segment.end + segment.trail).toPrecision(4);

    return `if (time < ${startTime} || time > ${endTime}) return;`;
  }
};

export { TimelineChunks };
