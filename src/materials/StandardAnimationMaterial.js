/**
 * Extends THREE.MeshStandardMaterial with custom shader chunks.
 *
 * @see http://three-bas-examples.surge.sh/examples/materials_standard/
 *
 * @param {Object} parameters Object containing material properties and custom shader chunks.
 * @constructor
 */
THREE.BAS.StandardAnimationMaterial = function (parameters) {
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
  this.fragmentRoughness = [];
  this.fragmentMetalness = [];
  this.fragmentEmissive = [];

  var standardShader = THREE.ShaderLib['standard'];

  THREE.BAS.BaseAnimationMaterial.call(this, parameters, standardShader.uniforms);

  this.lights = true;
  this.vertexShader = this._concatVertexShader();
  this.fragmentShader = this._concatFragmentShader();
};
THREE.BAS.StandardAnimationMaterial.prototype = Object.create(THREE.BAS.BaseAnimationMaterial.prototype);
THREE.BAS.StandardAnimationMaterial.prototype.constructor = THREE.BAS.StandardAnimationMaterial;

THREE.BAS.StandardAnimationMaterial.prototype._concatVertexShader = function () {
  // based on THREE.ShaderLib.physical
  return [
    "#define PHYSICAL",

    "varying vec3 vViewPosition;",

    "#ifndef FLAT_SHADED",

    "	varying vec3 vNormal;",

    "#endif",

    '#include <common>',
    '#include <uv_pars_vertex>',
    '#include <uv2_pars_vertex>',
    '#include <displacementmap_pars_vertex>',
    '#include <color_pars_vertex>',
    '#include <morphtarget_pars_vertex>',
    '#include <skinning_pars_vertex>',
    '#include <shadowmap_pars_vertex>',
    '#include <specularmap_pars_fragment>',
    '#include <logdepthbuf_pars_vertex>',
    '#include <clipping_planes_pars_vertex>',

    this._stringifyChunk('vertexFunctions'),
    this._stringifyChunk('vertexParameters'),
    this._stringifyChunk('varyingParameters'),

    "void main() {",

    this._stringifyChunk('vertexInit'),

    '#include <uv_vertex>',
    '#include <uv2_vertex>',
    '#include <color_vertex>',
    '#include <beginnormal_vertex>',

    this._stringifyChunk('vertexNormal'),

    '#include <morphnormal_vertex>',
    '#include <skinbase_vertex>',
    '#include <skinnormal_vertex>',
    '#include <defaultnormal_vertex>',

    "#ifndef FLAT_SHADED", // Normal computed with derivatives when FLAT_SHADED

    "	vNormal = normalize( transformedNormal );",

    "#endif",

    '#include <begin_vertex>',

    this._stringifyChunk('vertexPosition'),
    this._stringifyChunk('vertexColor'),

    '#include <displacementmap_vertex>',
    '#include <morphtarget_vertex>',
    '#include <skinning_vertex>',
    '#include <project_vertex>',
    '#include <logdepthbuf_vertex>',
    '#include <clipping_planes_vertex>',

    "	vViewPosition = - mvPosition.xyz;",

    '#include <worldpos_vertex>',
    '#include <shadowmap_vertex>',

    "}"

  ].join("\n");
};

THREE.BAS.StandardAnimationMaterial.prototype._concatFragmentShader = function () {
  return [
    "#define PHYSICAL",

    "uniform vec3 diffuse;",
    "uniform vec3 emissive;",
    "uniform float roughness;",
    "uniform float metalness;",
    "uniform float opacity;",

    '#ifndef STANDARD',
      'uniform float clearCoat;',
      'uniform float clearCoatRoughness;',
    '#endif',

    "uniform float envMapIntensity;",

    'varying vec3 vViewPosition;',

    '#ifndef FLAT_SHADED',
    'varying vec3 vNormal;',
    '#endif',

    this._stringifyChunk('fragmentFunctions'),
    this._stringifyChunk('fragmentParameters'),
    this._stringifyChunk('varyingParameters'),

    '#include <common>',
    '#include <packing>',
    '#include <color_pars_fragment>',
    '#include <uv_pars_fragment>',
    '#include <uv2_pars_fragment>',
    '#include <map_pars_fragment>',
    '#include <alphamap_pars_fragment>',
    '#include <aomap_pars_fragment>',
    '#include <lightmap_pars_fragment>',
    '#include <emissivemap_pars_fragment>',
    '#include <envmap_pars_fragment>',
    '#include <fog_pars_fragment>',
    '#include <bsdfs>',
    '#include <cube_uv_reflection_fragment>',
    '#include <lights_pars>',
    '#include <lights_physical_pars_fragment>',
    '#include <shadowmap_pars_fragment>',
    '#include <bumpmap_pars_fragment>',
    '#include <normalmap_pars_fragment>',
    '#include <roughnessmap_pars_fragment>',
    '#include <metalnessmap_pars_fragment>',
    '#include <logdepthbuf_pars_fragment>',
    '#include <clipping_planes_pars_fragment>',

    "void main() {",

    '#include <clipping_planes_fragment>',

    this._stringifyChunk('fragmentInit'),

    "	vec4 diffuseColor = vec4( diffuse, opacity );",
    "	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );",
    "	vec3 totalEmissiveRadiance = emissive;",

    this._stringifyChunk('fragmentDiffuse'),

    '#include <logdepthbuf_fragment>',
    (this._stringifyChunk('fragmentMap') || '#include <map_fragment>'),
    '#include <color_fragment>',

    '#include <alphamap_fragment>',
    '#include <alphatest_fragment>',
    '#include <specularmap_fragment>',

    //'#include <roughnessmap_fragment>',
    'float roughnessFactor = roughness;',
    this._stringifyChunk('fragmentRoughness'),
    '#ifdef USE_ROUGHNESSMAP',
    ' roughnessFactor *= texture2D( roughnessMap, vUv ).r;',
    '#endif',

    //'#include <metalnessmap_fragment>',
    'float metalnessFactor = roughness;',
    this._stringifyChunk('fragmentMetalness'),
    '#ifdef USE_METALNESSMAP',
    ' metalnessFactor *= texture2D( metalnessMap, vUv ).r;',
    '#endif',

    '#include <normal_flip>',
    '#include <normal_fragment>',

    this._stringifyChunk('fragmentEmissive'),

    '#include <emissivemap_fragment>',

    // accumulation
    '#include <lights_physical_fragment>',
    '#include <lights_template>',

    // modulation
    '#include <aomap_fragment>',

    "vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;",

    "	gl_FragColor = vec4( outgoingLight, diffuseColor.a );",

    '#include <premultiplied_alpha_fragment>',
    '#include <tonemapping_fragment>',
    '#include <encodings_fragment>',
    '#include <fog_fragment>',

    "}"

  ].join( "\n" )
};
