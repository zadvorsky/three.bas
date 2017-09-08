import { Timeline } from './Timeline';
import { TimelineChunks } from './TimelineChunks';
import { Vector3 } from 'three';

const ScaleSegment = {
  compiler: function(segment) {
    const origin = segment.transition.origin;
    
    return `
    ${TimelineChunks.delayDuration(segment)}
    ${TimelineChunks.vec3(`cScaleFrom${segment.key}`, segment.transition.from, 2)}
    ${TimelineChunks.vec3(`cScaleTo${segment.key}`, segment.transition.to, 2)}
    ${origin ? TimelineChunks.vec3(`cOrigin${segment.key}`, origin, 2) : ''}
    
    void applyTransform${segment.key}(float time, inout vec3 v) {
    
      ${TimelineChunks.renderCheck(segment)}
      ${TimelineChunks.progress(segment)}
    
      ${origin ? `v -= cOrigin${segment.key};` : ''}
      v *= mix(cScaleFrom${segment.key}, cScaleTo${segment.key}, progress);
      ${origin ? `v += cOrigin${segment.key};` : ''}
    }
    `;
  },
  defaultFrom: new Vector3(1, 1, 1)
};

Timeline.register('scale', ScaleSegment);

export { ScaleSegment };
