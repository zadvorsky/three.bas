import { Timeline } from './Timeline';
import { TimelineChunks } from './TimelineChunks';
import { Vector3 } from 'three';

const TranslationSegment = {
  compiler: function(segment) {
    return `
    ${TimelineChunks.delayDuration(segment)}
    ${TimelineChunks.vec3(`cTranslateFrom${segment.key}`, segment.transition.from, 2)}
    ${TimelineChunks.vec3(`cTranslateTo${segment.key}`, segment.transition.to, 2)}
    
    void applyTransform${segment.key}(float time, inout vec3 v) {
    
      ${TimelineChunks.renderCheck(segment)}
      ${TimelineChunks.progress(segment)}
    
      v += mix(cTranslateFrom${segment.key}, cTranslateTo${segment.key}, progress);
    }
    `;
  },
  defaultFrom: new Vector3(0, 0, 0)
};

Timeline.register('translate', TranslationSegment);

export { TranslationSegment };
