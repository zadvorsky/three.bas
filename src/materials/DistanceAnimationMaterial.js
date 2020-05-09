import { ShaderLib, UniformsUtils, RGBADepthPacking } from 'three';
import BaseAnimationMaterial from './BaseAnimationMaterial';

function DistanceAnimationMaterial(parameters) {
  this.depthPacking = RGBADepthPacking;
  this.clipping = true;

  this.vertexFunctions = [];
  this.vertexParameters = [];
  this.vertexInit = [];
  this.vertexPosition = [];
  this.vertexPostMorph = [];
  this.vertexPostSkinning = [];

  BaseAnimationMaterial.call(this, parameters, ShaderLib['distanceRGBA'].uniforms);

  // this.uniforms = UniformsUtils.merge([ShaderLib['distanceRGBA'].uniforms, parameters.uniforms]);
  this.vertexShader = this.concatVertexShader();
  this.fragmentShader = ShaderLib['distanceRGBA'].fragmentShader;
}
DistanceAnimationMaterial.prototype = Object.create(BaseAnimationMaterial.prototype);
DistanceAnimationMaterial.prototype.constructor = DistanceAnimationMaterial;

DistanceAnimationMaterial.prototype.concatVertexShader = function () {
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
};

export { DistanceAnimationMaterial };
