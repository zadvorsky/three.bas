import { ShaderLib, RGBADepthPacking } from 'three';
import BaseAnimationMaterial from './BaseAnimationMaterial';

class DistanceAnimationMaterial extends BaseAnimationMaterial {
  constructor (parameters) {
    super(parameters, ShaderLib['distanceRGBA'].uniforms);

    this.depthPacking = RGBADepthPacking;
    this.clipping = true;
    this.vertexShader = this.concatVertexShader();
    this.fragmentShader = ShaderLib['distanceRGBA'].fragmentShader;
  }

  concatVertexShader () {
    return ShaderLib.distanceRGBA.vertexShader
      .replace(
        'void main() {',
        `
        ${this.stringifyChunk('vertexParameters')}
        ${this.stringifyChunk('vertexFunctions')}

        void main() {
          ${this.stringifyChunk('vertexInit')}
        `
      )
      .replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>

        ${this.stringifyChunk('vertexPosition')}
        `
      )
      .replace(
        '#include <morphtarget_vertex>',
        `
        #include <morphtarget_vertex>

        ${this.stringifyChunk('vertexPostMorph')}
        `
      )
      .replace(
        '#include <skinning_vertex>',
        `
        #include <skinning_vertex>

        ${this.stringifyChunk('vertexPostSkinning')}
        `
      )
  }
}

export { DistanceAnimationMaterial };
