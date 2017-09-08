import { Timeline } from './Timeline';
import { TimelineChunks } from './TimelineChunks';
import { Vector3, Vector4 } from 'three';

const RotationSegment = {
  compiler(segment) {
    const fromAxisAngle = new Vector4(
      segment.transition.from.axis.x,
      segment.transition.from.axis.y,
      segment.transition.from.axis.z,
      segment.transition.from.angle
    );
  
    const toAxis = segment.transition.to.axis || segment.transition.from.axis;
    const toAxisAngle = new Vector4(
      toAxis.x,
      toAxis.y,
      toAxis.z,
      segment.transition.to.angle
    );
  
    const origin = segment.transition.origin;
    
    return `
    ${TimelineChunks.delayDuration(segment)}
    ${TimelineChunks.vec4(`cRotationFrom${segment.key}`, fromAxisAngle, 8)}
    ${TimelineChunks.vec4(`cRotationTo${segment.key}`, toAxisAngle, 8)}
    ${origin ? TimelineChunks.vec3(`cOrigin${segment.key}`, origin, 2) : ''}
    
    void applyTransform${segment.key}(float time, inout vec3 v) {
      ${TimelineChunks.renderCheck(segment)}
      ${TimelineChunks.progress(segment)}

      ${origin ? `v -= cOrigin${segment.key};` : ''}
      vec3 axis = normalize(mix(cRotationFrom${segment.key}.xyz, cRotationTo${segment.key}.xyz, progress));
      float angle = mix(cRotationFrom${segment.key}.w, cRotationTo${segment.key}.w, progress);
      vec4 q = quatFromAxisAngle(axis, angle);
      v = rotateVector(q, v);
      ${origin ? `v += cOrigin${segment.key};` : ''}
    }
    `;
  },
  defaultFrom: {axis: new Vector3(), angle: 0}
};

Timeline.register('rotate', RotationSegment);

export { RotationSegment };
