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
  return ShaderLib.lambert.vertexShader
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

LambertAnimationMaterial.prototype.concatFragmentShader = function () {
  return ShaderLib.lambert.fragmentShader
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
  return `
  uniform vec3 diffuse;
  uniform vec3 emissive;
  uniform float opacity;

  varying vec3 vLightFront;
  varying vec3 vIndirectFront;

  #ifdef DOUBLE_SIDED
    varying vec3 vLightBack;
    varying vec3 vIndirectBack;
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
  #include <envmap_common_pars_fragment>
  #include <envmap_pars_fragment>
  #include <cube_uv_reflection_fragment>
  #include <bsdfs>
  #include <lights_pars_begin>
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

    #include <logdepthbuf_fragment>

    ${this.stringifyChunk('fragmentDiffuse')}
    ${(this.stringifyChunk('fragmentMap') || '#include <map_fragment>')}

    #include <color_fragment>
    #include <alphamap_fragment>
    #include <alphatest_fragment>
    #include <specularmap_fragment>

    ${this.stringifyChunk('fragmentEmissive')}

    #include <emissivemap_fragment>

    // accumulation
    reflectedLight.indirectDiffuse = getAmbientLightIrradiance( ambientLightColor );

    #ifdef DOUBLE_SIDED
      reflectedLight.indirectDiffuse += ( gl_FrontFacing ) ? vIndirectFront : vIndirectBack;
    #else
      reflectedLight.indirectDiffuse += vIndirectFront;
    #endif

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
