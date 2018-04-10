import { ShaderLib } from 'three';
import BaseAnimationMaterial from './BaseAnimationMaterial';

/**
 * Extends THREE.MeshBasicMaterial with custom shader chunks.
 *
 * @see http://three-bas-examples.surge.sh/examples/materials_basic/
 *
 * @param {Object} parameters Object containing material properties and custom shader chunks.
 * @constructor
 */
function BasicAnimationMaterial(parameters) {
  this.varyingParameters = [];
  
  this.vertexParameters = [];
  this.vertexFunctions = [];
  this.vertexInit = [];
  this.vertexNormal = [];
  this.vertexPosition = [];
  this.vertexColor = [];
  this.vertexPostMorph = [];
  this.vertexPostSkinning = [];

  this.fragmentFunctions = [];
  this.fragmentParameters = [];
  this.fragmentInit = [];
  this.fragmentMap = [];
  this.fragmentDiffuse = [];
  
  BaseAnimationMaterial.call(this, parameters, ShaderLib['basic'].uniforms);
  
  this.lights = false;
  this.vertexShader = this.concatVertexShader();
  this.fragmentShader = this.concatFragmentShader();
}
BasicAnimationMaterial.prototype = Object.create(BaseAnimationMaterial.prototype);
BasicAnimationMaterial.prototype.constructor = BasicAnimationMaterial;

BasicAnimationMaterial.prototype.concatVertexShader = function() {
  return `
  #include <common>
  #include <uv_pars_vertex>
  #include <uv2_pars_vertex>
  #include <envmap_pars_vertex>
  #include <color_pars_vertex>
  #include <fog_pars_vertex>
  #include <morphtarget_pars_vertex>
  #include <skinning_pars_vertex>
  #include <logdepthbuf_pars_vertex>
  #include <clipping_planes_pars_vertex>
  
  ${this.stringifyChunk('vertexParameters')}
  ${this.stringifyChunk('varyingParameters')}
  ${this.stringifyChunk('vertexFunctions')}
  
  void main() {

    ${this.stringifyChunk('vertexInit')}
  
    #include <uv_vertex>
    #include <uv2_vertex>
    #include <color_vertex>
    #include <skinbase_vertex>
  
    #ifdef USE_ENVMAP
  
    #include <beginnormal_vertex>
    
    ${this.stringifyChunk('vertexNormal')}
    
    #include <morphnormal_vertex>
    #include <skinnormal_vertex>
    #include <defaultnormal_vertex>
  
    #endif
  
    #include <begin_vertex>
    
    ${this.stringifyChunk('vertexPosition')}
    ${this.stringifyChunk('vertexColor')}
    
    #include <morphtarget_vertex>
    
    ${this.stringifyChunk('vertexPostMorph')}
    
    #include <skinning_vertex>

    ${this.stringifyChunk('vertexPostSkinning')}

    #include <project_vertex>
    #include <logdepthbuf_vertex>
  
    #include <worldpos_vertex>
    #include <clipping_planes_vertex>
    #include <envmap_vertex>
    #include <fog_vertex>
  }`;
};

BasicAnimationMaterial.prototype.concatFragmentShader = function() {
  return `
  uniform vec3 diffuse;
  uniform float opacity;
  
  ${this.stringifyChunk('fragmentParameters')}
  ${this.stringifyChunk('varyingParameters')}
  ${this.stringifyChunk('fragmentFunctions')}
  
  #ifndef FLAT_SHADED
  
    varying vec3 vNormal;
  
  #endif
  
  #include <common>
  #include <color_pars_fragment>
  #include <uv_pars_fragment>
  #include <uv2_pars_fragment>
  #include <map_pars_fragment>
  #include <alphamap_pars_fragment>
  #include <aomap_pars_fragment>
  #include <lightmap_pars_fragment>
  #include <envmap_pars_fragment>
  #include <fog_pars_fragment>
  #include <specularmap_pars_fragment>
  #include <logdepthbuf_pars_fragment>
  #include <clipping_planes_pars_fragment>
  
  void main() {
  
    ${this.stringifyChunk('fragmentInit')}
  
    #include <clipping_planes_fragment>

    vec4 diffuseColor = vec4( diffuse, opacity );

    ${this.stringifyChunk('fragmentDiffuse')}
  
    #include <logdepthbuf_fragment>
    
    ${(this.stringifyChunk('fragmentMap') || '#include <map_fragment>')}
    
    #include <color_fragment>
    #include <alphamap_fragment>
    #include <alphatest_fragment>
    #include <specularmap_fragment>
  
    ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
  
    // accumulation (baked indirect lighting only)
    #ifdef USE_LIGHTMAP
  
      reflectedLight.indirectDiffuse += texture2D( lightMap, vUv2 ).xyz * lightMapIntensity;
  
    #else
  
      reflectedLight.indirectDiffuse += vec3( 1.0 );
  
    #endif
  
    // modulation
    #include <aomap_fragment>
  
    reflectedLight.indirectDiffuse *= diffuseColor.rgb;
  
    vec3 outgoingLight = reflectedLight.indirectDiffuse;
  
    #include <envmap_fragment>
  
    gl_FragColor = vec4( outgoingLight, diffuseColor.a );
  
    #include <premultiplied_alpha_fragment>
    #include <tonemapping_fragment>
    #include <encodings_fragment>
    #include <fog_fragment>
  }`;
};

export { BasicAnimationMaterial };
