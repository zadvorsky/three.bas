import { ShaderLib } from 'three';
import BaseAnimationMaterial from './BaseAnimationMaterial';

class PointsAnimationMaterial extends BaseAnimationMaterial {
  /**
   * Extends THREE.PointsMaterial with custom shader chunks.
   *
   * @param {Object} parameters Object containing material properties and custom shader chunks.
   * @constructor
   */
  constructor (parameters) {
    super(parameters, ShaderLib['points'].uniforms);

    this.vertexShader = this.concatVertexShader();
    this.fragmentShader = this.concatFragmentShader();
  }

  concatVertexShader () {
    return ShaderLib.points.vertexShader
      .replace(
        'void main() {',
        `
        ${this.stringifyChunk('vertexParameters')}
        ${this.stringifyChunk('varyingParameters')}
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
        ${this.stringifyChunk('vertexColor')}
        `
      )
      .replace(
        '#include <morphtarget_vertex>',
        `
        #include <morphtarget_vertex>

        ${this.stringifyChunk('vertexPostMorph')}
        `
      )
  }

  concatFragmentShader () {
    return ShaderLib.points.fragmentShader
      .replace(
        'void main() {',
        `
        ${this.stringifyChunk('fragmentParameters')}
        ${this.stringifyChunk('varyingParameters')}
        ${this.stringifyChunk('fragmentFunctions')}

        void main() {
          ${this.stringifyChunk('fragmentInit')}
        `
      )
      .replace(
        '#include <map_fragment>',
        `
        ${this.stringifyChunk('fragmentDiffuse')}
        ${(this.stringifyChunk('fragmentMap') || '#include <map_fragment>')}

        `
      )
      .replace(
        '#include <premultiplied_alpha_fragment>',
        `
        ${this.stringifyChunk('fragmentShape')}

        #include <premultiplied_alpha_fragment>
        `
      )
  }
}

export { PointsAnimationMaterial };
