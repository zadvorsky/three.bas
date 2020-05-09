import { ShaderLib, UniformsUtils, RGBADepthPacking } from 'three';
import BaseAnimationMaterial from './BaseAnimationMaterial';

function DepthAnimationMaterial(parameters) {
  this.depthPacking = RGBADepthPacking;
  this.clipping = true;

  this.vertexFunctions = [];
  this.vertexParameters = [];
  this.vertexInit = [];
  this.vertexPosition = [];
  this.vertexPostMorph = [];
  this.vertexPostSkinning = [];

  BaseAnimationMaterial.call(this, parameters, ShaderLib['depth'].uniforms);

  // this.uniforms = UniformsUtils.merge([ShaderLib['depth'].uniforms, parameters.uniforms]);
  this.vertexShader = this.concatVertexShader();
  this.fragmentShader = ShaderLib['depth'].fragmentShader;
}
DepthAnimationMaterial.prototype = Object.create(BaseAnimationMaterial.prototype);
DepthAnimationMaterial.prototype.constructor = DepthAnimationMaterial;

DepthAnimationMaterial.prototype.concatVertexShader = function () {
  return ShaderLib.depth.vertexShader
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
};

export { DepthAnimationMaterial };
