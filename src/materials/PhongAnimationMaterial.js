import { ShaderLib } from 'three';
import BaseAnimationMaterial from './BaseAnimationMaterial';

/**
 * Extends THREE.MeshPhongMaterial with custom shader chunks.
 *
 * @see http://three-bas-examples.surge.sh/examples/materials_phong/
 *
 * @param {Object} parameters Object containing material properties and custom shader chunks.
 * @constructor
 */
function PhongAnimationMaterial(parameters) {
  this.varyingParameters = [];

  this.vertexFunctions = [];
  this.vertexParameters = [];
  this.vertexInit = [];
  this.vertexNormal = [];
  this.vertexPosition = [];
  this.vertexColor = [];

  this.fragmentFunctions = [];
  this.fragmentParameters = [];
  this.fragmentInit = [];
  this.fragmentMap = [];
  this.fragmentDiffuse = [];
  this.fragmentEmissive = [];
  this.fragmentSpecular = [];

  BaseAnimationMaterial.call(this, parameters, ShaderLib['phong'].uniforms);

  this.lights = true;
  this.vertexShader = this.concatVertexShader();
  this.fragmentShader = this.concatFragmentShader();
}
PhongAnimationMaterial.prototype = Object.create(BaseAnimationMaterial.prototype);
PhongAnimationMaterial.prototype.constructor = PhongAnimationMaterial;

PhongAnimationMaterial.prototype.concatVertexShader = function () {
  return ShaderLib.phong.vertexShader
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
};

PhongAnimationMaterial.prototype.concatFragmentShader = function () {
  return ShaderLib.phong.fragmentShader
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
      '#include <lights_phong_fragment>',
      `
      #include <lights_phong_fragment>
      ${this.stringifyChunk('fragmentSpecular')}
      `
    )
};

export { PhongAnimationMaterial };
