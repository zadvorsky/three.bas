import { ShaderLib } from 'three';
import BaseAnimationMaterial from './BaseAnimationMaterial';

/**
 * Extends THREE.PointsMaterial with custom shader chunks.
 *
 * @param {Object} parameters Object containing material properties and custom shader chunks.
 * @constructor
 */
function PointsAnimationMaterial(parameters) {
  this.varyingParameters = [];
  
  this.vertexFunctions = [];
  this.vertexParameters = [];
  this.vertexInit = [];
  this.vertexPosition = [];
  this.vertexColor = [];
  
  this.fragmentFunctions = [];
  this.fragmentParameters = [];
  this.fragmentInit = [];
  this.fragmentMap = [];
  this.fragmentDiffuse = [];
  // use fragment shader to shape to point, reference: https://thebookofshaders.com/07/
  this.fragmentShape = [];
  
  BaseAnimationMaterial.call(this, parameters, ShaderLib['points'].uniforms);
  
  this.vertexShader = this.concatVertexShader();
  this.fragmentShader = this.concatFragmentShader();
}

PointsAnimationMaterial.prototype = Object.create(BaseAnimationMaterial.prototype);
PointsAnimationMaterial.prototype.constructor = PointsAnimationMaterial;

PointsAnimationMaterial.prototype.concatVertexShader = function () {
  return `
  uniform float size;
  uniform float scale;
  
  #include <common>
  #include <color_pars_vertex>
  #include <fog_pars_vertex>
  #include <shadowmap_pars_vertex>
  #include <logdepthbuf_pars_vertex>
  #include <clipping_planes_pars_vertex>
  
  ${this.stringifyChunk('vertexParameters')}
  ${this.stringifyChunk('varyingParameters')}
  ${this.stringifyChunk('vertexFunctions')}
  
  void main() {
  
    ${this.stringifyChunk('vertexInit')}
  
    #include <color_vertex>
    #include <begin_vertex>
    
    ${this.stringifyChunk('vertexPosition')}
    ${this.stringifyChunk('vertexColor')}
    
    #include <project_vertex>
  
    #ifdef USE_SIZEATTENUATION
      gl_PointSize = size * ( scale / - mvPosition.z );
    #else
      gl_PointSize = size;
    #endif
  
    #include <logdepthbuf_vertex>
    #include <clipping_planes_vertex>
    #include <worldpos_vertex>
    #include <shadowmap_vertex>
    #include <fog_vertex>
  }`;
};

PointsAnimationMaterial.prototype.concatFragmentShader = function () {
  return `
  uniform vec3 diffuse;
  uniform float opacity;
  
  #include <common>
  #include <packing>
  #include <color_pars_fragment>
  #include <map_particle_pars_fragment>
  #include <fog_pars_fragment>
  #include <shadowmap_pars_fragment>
  #include <logdepthbuf_pars_fragment>
  #include <clipping_planes_pars_fragment>
  
  ${this.stringifyChunk('fragmentParameters')}
  ${this.stringifyChunk('varyingParameters')}
  ${this.stringifyChunk('fragmentFunctions')}
  
  void main() {
  
    ${this.stringifyChunk('fragmentInit')}
  
    #include <clipping_planes_fragment>
  
    vec3 outgoingLight = vec3( 0.0 );
    vec4 diffuseColor = vec4( diffuse, opacity );
  
    ${this.stringifyChunk('fragmentDiffuse')}
  
    #include <logdepthbuf_fragment>

    ${(this.stringifyChunk('fragmentMap') || '#include <map_particle_fragment>')}

    #include <color_fragment>
    #include <alphatest_fragment>
  
    outgoingLight = diffuseColor.rgb;
  
    gl_FragColor = vec4( outgoingLight, diffuseColor.a );
    
    ${this.stringifyChunk('fragmentShape')}
  
    #include <premultiplied_alpha_fragment>
    #include <tonemapping_fragment>
    #include <encodings_fragment>
    #include <fog_fragment>
  }`;
};

export { PointsAnimationMaterial };
