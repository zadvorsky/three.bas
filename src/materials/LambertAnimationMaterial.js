import { ShaderLib } from 'three';
import BaseAnimationMaterial from './BaseAnimationMaterial';

/**
 * Extends THREE.MeshLambertMaterial with custom shader chunks.
 *
 * @see http://three-bas-examples.surge.sh/examples/materials_lambert/
 *
 * @param {Object} parameters Object containing material properties and custom shader chunks.
 * @constructor
 */
function LambertAnimationMaterial(parameters) {
  this.varyingParameters = [];
  
  this.vertexFunctions = [];
  this.vertexParameters = [];
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
  this.fragmentEmissive = [];
  this.fragmentSpecular = [];
  
  BaseAnimationMaterial.call(this, parameters, ShaderLib['lambert'].uniforms);
  
  this.lights = true;
  this.vertexShader = this.concatVertexShader();
  this.fragmentShader = this.concatFragmentShader();
}
LambertAnimationMaterial.prototype = Object.create(BaseAnimationMaterial.prototype);
LambertAnimationMaterial.prototype.constructor = LambertAnimationMaterial;

LambertAnimationMaterial.prototype.concatVertexShader = function () {
  return `
  #define LAMBERT

  varying vec3 vLightFront;
  
  #ifdef DOUBLE_SIDED
  
    varying vec3 vLightBack;
  
  #endif
  
  #include <common>
  #include <uv_pars_vertex>
  #include <uv2_pars_vertex>
  #include <envmap_pars_vertex>
  #include <bsdfs>
  #include <lights_pars_begin>
  #include <lights_pars_maps>
  #include <color_pars_vertex>
  #include <fog_pars_vertex>
  #include <morphtarget_pars_vertex>
  #include <skinning_pars_vertex>
  #include <shadowmap_pars_vertex>
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
  
    #include <beginnormal_vertex>
    
    ${this.stringifyChunk('vertexNormal')}
    
    #include <morphnormal_vertex>
    #include <skinbase_vertex>
    #include <skinnormal_vertex>
    #include <defaultnormal_vertex>
  
    #include <begin_vertex>
    
    ${this.stringifyChunk('vertexPosition')}
    ${this.stringifyChunk('vertexColor')}
    
    #include <morphtarget_vertex>
    
    ${this.stringifyChunk('vertexPostMorph')}
    
    #include <skinning_vertex>

    ${this.stringifyChunk('vertexPostSkinning')}
    
    #include <project_vertex>
    #include <logdepthbuf_vertex>
    #include <clipping_planes_vertex>
  
    #include <worldpos_vertex>
    #include <envmap_vertex>
    #include <lights_lambert_vertex>
    #include <shadowmap_vertex>
    #include <fog_vertex>
  }`;
};

LambertAnimationMaterial.prototype.concatFragmentShader = function () {
  return `
  uniform vec3 diffuse;
  uniform vec3 emissive;
  uniform float opacity;
  
  varying vec3 vLightFront;
  
  #ifdef DOUBLE_SIDED
  
    varying vec3 vLightBack;
  
  #endif
  
  #include <common>
  #include <packing>
  #include <dithering_pars_fragment>
  #include <color_pars_fragment>
  #include <uv_pars_fragment>
  #include <uv2_pars_fragment>
  #include <map_pars_fragment>
  #include <alphamap_pars_fragment>
  #include <aomap_pars_fragment>
  #include <lightmap_pars_fragment>
  #include <emissivemap_pars_fragment>
  #include <envmap_pars_fragment>
  #include <bsdfs>
  #include <lights_pars_begin>
  #include <lights_pars_maps>
  #include <fog_pars_fragment>
  #include <shadowmap_pars_fragment>
  #include <shadowmask_pars_fragment>
  #include <specularmap_pars_fragment>
  #include <logdepthbuf_pars_fragment>
  #include <clipping_planes_pars_fragment>
  
  ${this.stringifyChunk('fragmentParameters')}
  ${this.stringifyChunk('varyingParameters')}
  ${this.stringifyChunk('fragmentFunctions')}
  
  void main() {
  
    ${this.stringifyChunk('fragmentInit')}
  
    #include <clipping_planes_fragment>

    vec4 diffuseColor = vec4( diffuse, opacity );
    ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
    vec3 totalEmissiveRadiance = emissive;
	
    ${this.stringifyChunk('fragmentDiffuse')}
  
    #include <logdepthbuf_fragment>

    ${(this.stringifyChunk('fragmentMap') || '#include <map_fragment>')}

    #include <color_fragment>
    #include <alphamap_fragment>
    #include <alphatest_fragment>
    #include <specularmap_fragment>

    ${this.stringifyChunk('fragmentEmissive')}

    #include <emissivemap_fragment>
  
    // accumulation
    reflectedLight.indirectDiffuse = getAmbientLightIrradiance( ambientLightColor );
  
    #include <lightmap_fragment>
  
    reflectedLight.indirectDiffuse *= BRDF_Diffuse_Lambert( diffuseColor.rgb );
  
    #ifdef DOUBLE_SIDED
  
      reflectedLight.directDiffuse = ( gl_FrontFacing ) ? vLightFront : vLightBack;
  
    #else
  
      reflectedLight.directDiffuse = vLightFront;
  
    #endif
  
    reflectedLight.directDiffuse *= BRDF_Diffuse_Lambert( diffuseColor.rgb ) * getShadowMask();
  
    // modulation
    #include <aomap_fragment>
  
    vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
  
    #include <envmap_fragment>
  
    gl_FragColor = vec4( outgoingLight, diffuseColor.a );
  
    #include <tonemapping_fragment>
    #include <encodings_fragment>
    #include <fog_fragment>
    #include <premultiplied_alpha_fragment>
    #include <dithering_fragment>
  }`;
};

export { LambertAnimationMaterial };
