/**
 * Extends THREE.MeshBasicMaterial with custom shader chunks.
 *
 * @see http://three-bas-examples.surge.sh/examples/materials_basic/
 *
 * @param {Object} parameters Object containing material properties and custom shader chunks.
 * @constructor
 */
THREE.BAS.BasicAnimationMaterial = function(parameters) {
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

  var basicShader = THREE.ShaderLib['basic'];

  THREE.BAS.BaseAnimationMaterial.call(this, parameters, basicShader.uniforms);

  this.lights = false;
  this.vertexShader = this._concatVertexShader();
  this.fragmentShader = this._concatFragmentShader();
};
THREE.BAS.BasicAnimationMaterial.prototype = Object.create(THREE.BAS.BaseAnimationMaterial.prototype);
THREE.BAS.BasicAnimationMaterial.prototype.constructor = THREE.BAS.BasicAnimationMaterial;

THREE.BAS.BasicAnimationMaterial.prototype._concatVertexShader = function() {
  // based on THREE.ShaderLib.basic
  return [

    '#include <common>',
    '#include <uv_pars_vertex>',
    '#include <uv2_pars_vertex>',
    '#include <envmap_pars_vertex>',
    '#include <color_pars_vertex>',
    '#include <morphtarget_pars_vertex>',
    '#include <skinning_pars_vertex>',
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
    '#include <skinbase_vertex>',

    "	#ifdef USE_ENVMAP",

    '#include <beginnormal_vertex>',

    this._stringifyChunk('vertexNormal'),

    '#include <morphnormal_vertex>',
    '#include <skinnormal_vertex>',
    '#include <defaultnormal_vertex>',

    "	#endif",

    '#include <begin_vertex>',

    this._stringifyChunk('vertexPosition'),
    this._stringifyChunk('vertexColor'),

    '#include <morphtarget_vertex>',
    '#include <skinning_vertex>',
    '#include <project_vertex>',
    '#include <logdepthbuf_vertex>',

    '#include <worldpos_vertex>',
    '#include <clipping_planes_vertex>',
    '#include <envmap_vertex>',

    "}"

  ].join( "\n" );
};

THREE.BAS.BasicAnimationMaterial.prototype._concatFragmentShader = function() {
  return [
    "uniform vec3 diffuse;",
    "uniform float opacity;",

    this._stringifyChunk('fragmentFunctions'),
    this._stringifyChunk('fragmentParameters'),
    this._stringifyChunk('varyingParameters'),

    "#ifndef FLAT_SHADED",

    "	varying vec3 vNormal;",

    "#endif",

    '#include <common>',
    '#include <color_pars_fragment>',
    '#include <uv_pars_fragment>',
    '#include <uv2_pars_fragment>',
    '#include <map_pars_fragment>',
    '#include <alphamap_pars_fragment>',
    '#include <aomap_pars_fragment>',
    '#include <envmap_pars_fragment>',
    '#include <fog_pars_fragment>',
    '#include <specularmap_pars_fragment>',
    '#include <logdepthbuf_pars_fragment>',
    '#include <clipping_planes_pars_fragment>',

    "void main() {",

    '#include <clipping_planes_fragment>',

    this._stringifyChunk('fragmentInit'),

    "	vec4 diffuseColor = vec4( diffuse, opacity );",

    this._stringifyChunk('fragmentDiffuse'),

    '#include <logdepthbuf_fragment>',

    (this._stringifyChunk('fragmentMap') || '#include <map_fragment>'),

    '#include <color_fragment>',

    '#include <alphamap_fragment>',
    '#include <alphatest_fragment>',
    '#include <specularmap_fragment>',

    "	ReflectedLight reflectedLight;",
    "	reflectedLight.directDiffuse = vec3( 0.0 );",
    "	reflectedLight.directSpecular = vec3( 0.0 );",
    "	reflectedLight.indirectDiffuse = diffuseColor.rgb;",
    "	reflectedLight.indirectSpecular = vec3( 0.0 );",

    '#include <aomap_fragment>',

    "	vec3 outgoingLight = reflectedLight.indirectDiffuse;",

    '#include <normal_flip>',
    '#include <envmap_fragment>',

    "	gl_FragColor = vec4( outgoingLight, diffuseColor.a );",

    '#include <premultiplied_alpha_fragment>',
    '#include <tonemapping_fragment>',
    '#include <encodings_fragment>',
    '#include <fog_fragment>',

    "}"
  ].join('\n');
};
