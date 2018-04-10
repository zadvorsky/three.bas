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

  BaseAnimationMaterial.call(this, parameters);
  
  this.uniforms = UniformsUtils.merge([ShaderLib['distanceRGBA'].uniforms, this.uniforms]);
  this.vertexShader = this.concatVertexShader();
  this.fragmentShader = ShaderLib['distanceRGBA'].fragmentShader;
}
DistanceAnimationMaterial.prototype = Object.create(BaseAnimationMaterial.prototype);
DistanceAnimationMaterial.prototype.constructor = DistanceAnimationMaterial;

DistanceAnimationMaterial.prototype.concatVertexShader = function () {
  return `
  #define DISTANCE

  varying vec3 vWorldPosition;
  
  #include <common>
  #include <uv_pars_vertex>
  #include <displacementmap_pars_vertex>
  #include <morphtarget_pars_vertex>
  #include <skinning_pars_vertex>
  #include <clipping_planes_pars_vertex>
  
  ${this.stringifyChunk('vertexParameters')}
  ${this.stringifyChunk('vertexFunctions')}
  
  void main() {

    ${this.stringifyChunk('vertexInit')}
  
    #include <uv_vertex>
  
    #include <skinbase_vertex>
  
    #ifdef USE_DISPLACEMENTMAP
  
      #include <beginnormal_vertex>
      #include <morphnormal_vertex>
      #include <skinnormal_vertex>
  
    #endif
  
    #include <begin_vertex>
    
    ${this.stringifyChunk('vertexPosition')}

    #include <morphtarget_vertex>
    
    ${this.stringifyChunk('vertexPostMorph')}
    
    #include <skinning_vertex>

    ${this.stringifyChunk('vertexPostSkinning')}
    
    #include <displacementmap_vertex>
    #include <project_vertex>
    #include <worldpos_vertex>
    #include <clipping_planes_vertex>
  
    vWorldPosition = worldPosition.xyz;
  
  }`;
};

export { DistanceAnimationMaterial };
