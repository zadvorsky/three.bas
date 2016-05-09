THREE.BAS.BasicAnimationMaterial = function(parameters, uniformValues) {
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
  this.fragmentAlpha = [];

  THREE.BAS.BaseAnimationMaterial.call(this, parameters);

  var basicShader = THREE.ShaderLib['basic'];

  this.uniforms = THREE.UniformsUtils.merge([basicShader.uniforms, this.uniforms]);
  this.lights = false;
  this.vertexShader = this._concatVertexShader();
  this.fragmentShader = this._concatFragmentShader();

  // todo add missing default defines
  uniformValues.map && (this.defines['USE_MAP'] = '');
  uniformValues.normalMap && (this.defines['USE_NORMALMAP'] = '');

  this.setUniformValues(uniformValues);
};
THREE.BAS.BasicAnimationMaterial.prototype = Object.create(THREE.BAS.BaseAnimationMaterial.prototype);
THREE.BAS.BasicAnimationMaterial.prototype.constructor = THREE.BAS.BasicAnimationMaterial;

THREE.BAS.BasicAnimationMaterial.prototype._concatVertexShader = function() {
  // based on THREE.ShaderLib.basic
  return [

    THREE.ShaderChunk[ "common" ],
    THREE.ShaderChunk[ "uv_pars_vertex" ],
    THREE.ShaderChunk[ "uv2_pars_vertex" ],
    THREE.ShaderChunk[ "envmap_pars_vertex" ],
    THREE.ShaderChunk[ "color_pars_vertex" ],
    THREE.ShaderChunk[ "morphtarget_pars_vertex" ],
    THREE.ShaderChunk[ "skinning_pars_vertex" ],
    THREE.ShaderChunk[ "logdepthbuf_pars_vertex" ],

    this._stringifyChunk('vertexFunctions'),
    this._stringifyChunk('vertexParameters'),
    this._stringifyChunk('varyingParameters'),

    "void main() {",

    this._stringifyChunk('vertexInit'),

    THREE.ShaderChunk[ "uv_vertex" ],
    THREE.ShaderChunk[ "uv2_vertex" ],
    THREE.ShaderChunk[ "color_vertex" ],
    THREE.ShaderChunk[ "skinbase_vertex" ],

    "	#ifdef USE_ENVMAP",

    THREE.ShaderChunk[ "beginnormal_vertex" ],

    this._stringifyChunk('vertexNormal'),

    THREE.ShaderChunk[ "morphnormal_vertex" ],
    THREE.ShaderChunk[ "skinnormal_vertex" ],
    THREE.ShaderChunk[ "defaultnormal_vertex" ],

    "	#endif",

    THREE.ShaderChunk[ "begin_vertex" ],

    this._stringifyChunk('vertexPosition'),
    this._stringifyChunk('vertexColor'),

    THREE.ShaderChunk[ "morphtarget_vertex" ],
    THREE.ShaderChunk[ "skinning_vertex" ],
    THREE.ShaderChunk[ "project_vertex" ],
    THREE.ShaderChunk[ "logdepthbuf_vertex" ],

    THREE.ShaderChunk[ "worldpos_vertex" ],
    THREE.ShaderChunk[ "envmap_vertex" ],

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

    THREE.ShaderChunk[ "common" ],
    THREE.ShaderChunk[ "color_pars_fragment" ],
    THREE.ShaderChunk[ "uv_pars_fragment" ],
    THREE.ShaderChunk[ "uv2_pars_fragment" ],
    THREE.ShaderChunk[ "map_pars_fragment" ],
    THREE.ShaderChunk[ "alphamap_pars_fragment" ],
    THREE.ShaderChunk[ "aomap_pars_fragment" ],
    THREE.ShaderChunk[ "envmap_pars_fragment" ],
    THREE.ShaderChunk[ "fog_pars_fragment" ],
    THREE.ShaderChunk[ "specularmap_pars_fragment" ],
    THREE.ShaderChunk[ "logdepthbuf_pars_fragment" ],

    "void main() {",

    this._stringifyChunk('fragmentInit'),

    "	vec4 diffuseColor = vec4( diffuse, opacity );",

    THREE.ShaderChunk[ "logdepthbuf_fragment" ],
    THREE.ShaderChunk[ "map_fragment" ],
    THREE.ShaderChunk[ "color_fragment" ],

    this._stringifyChunk('fragmentAlpha'),

    THREE.ShaderChunk[ "alphamap_fragment" ],
    THREE.ShaderChunk[ "alphatest_fragment" ],
    THREE.ShaderChunk[ "specularmap_fragment" ],

    "	ReflectedLight reflectedLight;",
    "	reflectedLight.directDiffuse = vec3( 0.0 );",
    "	reflectedLight.directSpecular = vec3( 0.0 );",
    "	reflectedLight.indirectDiffuse = diffuseColor.rgb;",
    "	reflectedLight.indirectSpecular = vec3( 0.0 );",

    THREE.ShaderChunk[ "aomap_fragment" ],

    "	vec3 outgoingLight = reflectedLight.indirectDiffuse;",

    THREE.ShaderChunk[ "envmap_fragment" ],
    THREE.ShaderChunk[ "linear_to_gamma_fragment" ],
    THREE.ShaderChunk[ "fog_fragment" ],

    "	gl_FragColor = vec4( outgoingLight, diffuseColor.a );",

    "}"
  ].join('\n');
};
