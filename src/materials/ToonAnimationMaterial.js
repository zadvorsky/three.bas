import { ShaderLib } from 'three'
import BaseAnimationMaterial from './BaseAnimationMaterial';

class ToonAnimationMaterial extends BaseAnimationMaterial {
  /**
   * Extends THREE.MeshToonMaterial with custom shader chunks.
   *
   * @param {Object} parameters Object containing material properties and custom shader chunks.
   */
  constructor (parameters) {
    super(parameters, ShaderLib['toon'].uniforms);

    this.lights = true;
    this.vertexShader = this.concatVertexShader();
    this.fragmentShader = this.concatFragmentShader();
  }

  concatVertexShader () {
    return ShaderLib.toon.vertexShader
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
        '#include <beginnormal_vertex>',
        `
        #include <beginnormal_vertex>

        ${this.stringifyChunk('vertexNormal')}
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
      .replace(
        '#include <skinning_vertex>',
        `
        #include <skinning_vertex>

        ${this.stringifyChunk('vertexPostSkinning')}
        `
      )
  }

  concatFragmentShader () {
    return ShaderLib.toon.fragmentShader
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
        '#include <emissivemap_fragment>',
        `
        ${this.stringifyChunk('fragmentEmissive')}

        #include <emissivemap_fragment>
        `
      )
  }
}

export { ToonAnimationMaterial };
