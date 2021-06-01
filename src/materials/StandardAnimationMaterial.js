import { ShaderLib } from 'three';
import BaseAnimationMaterial from './BaseAnimationMaterial';

class StandardAnimationMaterial extends BaseAnimationMaterial {
  /**
   * Extends THREE.MeshStandardMaterial with custom shader chunks.
   *
   * @see http://three-bas-examples.surge.sh/examples/materials_standard/
   *
   * @param {Object} parameters Object containing material properties and custom shader chunks.
   */
  constructor (parameters) {
    super(parameters, ShaderLib['physical'].uniforms);

    this.lights = true;
    this.extensions = (this.extensions || {});
    this.extensions.derivatives = true;
    this.vertexShader = this.concatVertexShader();
    this.fragmentShader = this.concatFragmentShader();
  }

  concatVertexShader () {
    return ShaderLib.standard.vertexShader
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
    return ShaderLib.standard.fragmentShader
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
      .replace(
        '#include <roughnessmap_fragment>',
        `
        float roughnessFactor = roughness;
        ${this.stringifyChunk('fragmentRoughness')}
        #ifdef USE_ROUGHNESSMAP

        vec4 texelRoughness = texture2D( roughnessMap, vUv );
          roughnessFactor *= texelRoughness.g;
        #endif
        `
      )
      .replace(
        '#include <metalnessmap_fragment>',
        `
        float metalnessFactor = metalness;
        ${this.stringifyChunk('fragmentMetalness')}

        #ifdef USE_METALNESSMAP
          vec4 texelMetalness = texture2D( metalnessMap, vUv );
          metalnessFactor *= texelMetalness.b;
        #endif
        `
      )
  }
}

export { StandardAnimationMaterial };
