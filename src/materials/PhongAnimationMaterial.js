THREE.BAS.PhongAnimationMaterial = function (parameters) {
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
  this.fragmentEmissive = [];
  this.fragmentSpecular = [];

  var phongShader = THREE.ShaderLib['phong'];

  THREE.BAS.BaseAnimationMaterial.call(this, parameters, phongShader.uniforms);

  this.lights = true;
  this.vertexShader = this._concatVertexShader();
  this.fragmentShader = this._concatFragmentShader();
};
THREE.BAS.PhongAnimationMaterial.prototype = Object.create(THREE.BAS.BaseAnimationMaterial.prototype);
THREE.BAS.PhongAnimationMaterial.prototype.constructor = THREE.BAS.PhongAnimationMaterial;

THREE.BAS.PhongAnimationMaterial.prototype._concatVertexShader = function () {
  // based on THREE.ShaderLib.phong
  return [
    "#define PHONG",

    "varying vec3 vViewPosition;",

    "#ifndef FLAT_SHADED",

    "	varying vec3 vNormal;",

    "#endif",

    THREE.ShaderChunk["common"],
    THREE.ShaderChunk["uv_pars_vertex"],
    THREE.ShaderChunk["uv2_pars_vertex"],
    THREE.ShaderChunk["displacementmap_pars_vertex"],
    THREE.ShaderChunk["envmap_pars_vertex"],
    THREE.ShaderChunk["lights_phong_pars_vertex"],
    THREE.ShaderChunk["color_pars_vertex"],
    THREE.ShaderChunk["morphtarget_pars_vertex"],
    THREE.ShaderChunk["skinning_pars_vertex"],
    THREE.ShaderChunk["shadowmap_pars_vertex"],
    THREE.ShaderChunk["logdepthbuf_pars_vertex"],

    this._stringifyChunk('vertexFunctions'),
    this._stringifyChunk('vertexParameters'),
    this._stringifyChunk('varyingParameters'),

    "void main() {",

    this._stringifyChunk('vertexInit'),

    THREE.ShaderChunk["uv_vertex"],
    THREE.ShaderChunk["uv2_vertex"],
    THREE.ShaderChunk["color_vertex"],
    THREE.ShaderChunk["beginnormal_vertex"],

    this._stringifyChunk('vertexNormal'),

    THREE.ShaderChunk["morphnormal_vertex"],
    THREE.ShaderChunk["skinbase_vertex"],
    THREE.ShaderChunk["skinnormal_vertex"],
    THREE.ShaderChunk["defaultnormal_vertex"],

    "#ifndef FLAT_SHADED", // Normal computed with derivatives when FLAT_SHADED

    "	vNormal = normalize( transformedNormal );",

    "#endif",

    THREE.ShaderChunk["begin_vertex"],

    this._stringifyChunk('vertexPosition'),
    this._stringifyChunk('vertexColor'),

    THREE.ShaderChunk["displacementmap_vertex"],
    THREE.ShaderChunk["morphtarget_vertex"],
    THREE.ShaderChunk["skinning_vertex"],
    THREE.ShaderChunk["project_vertex"],
    THREE.ShaderChunk["logdepthbuf_vertex"],

    "	vViewPosition = - mvPosition.xyz;",

    THREE.ShaderChunk["worldpos_vertex"],
    THREE.ShaderChunk["envmap_vertex"],
    THREE.ShaderChunk["lights_phong_vertex"],
    THREE.ShaderChunk["shadowmap_vertex"],

    "}"

  ].join("\n");
};

THREE.BAS.PhongAnimationMaterial.prototype._concatFragmentShader = function () {
  return [
    "#define PHONG",

    "uniform vec3 diffuse;",
    "uniform vec3 emissive;",
    "uniform vec3 specular;",
    "uniform float shininess;",
    "uniform float opacity;",

    this._stringifyChunk('fragmentFunctions'),
    this._stringifyChunk('fragmentParameters'),
    this._stringifyChunk('varyingParameters'),

    THREE.ShaderChunk[ "common" ],
    THREE.ShaderChunk[ "packing" ],
    THREE.ShaderChunk[ "color_pars_fragment" ],
    THREE.ShaderChunk[ "uv_pars_fragment" ],
    THREE.ShaderChunk[ "uv2_pars_fragment" ],
    THREE.ShaderChunk[ "map_pars_fragment" ],
    THREE.ShaderChunk[ "alphamap_pars_fragment" ],
    THREE.ShaderChunk[ "aomap_pars_fragment" ],
    THREE.ShaderChunk[ "lightmap_pars_fragment" ],
    THREE.ShaderChunk[ "emissivemap_pars_fragment" ],
    THREE.ShaderChunk[ "envmap_pars_fragment" ],
    THREE.ShaderChunk[ "fog_pars_fragment" ],
    THREE.ShaderChunk[ "bsdfs" ],
    THREE.ShaderChunk[ "ambient_pars" ],
    THREE.ShaderChunk[ "lights_pars" ],
    THREE.ShaderChunk[ "lights_phong_pars_fragment" ],
    THREE.ShaderChunk[ "shadowmap_pars_fragment" ],
    THREE.ShaderChunk[ "bumpmap_pars_fragment" ],
    THREE.ShaderChunk[ "normalmap_pars_fragment" ],
    THREE.ShaderChunk[ "specularmap_pars_fragment" ],
    THREE.ShaderChunk[ "logdepthbuf_pars_fragment" ],

    "void main() {",

    this._stringifyChunk('fragmentInit'),

    "	vec4 diffuseColor = vec4( diffuse, opacity );",
    "	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );",
    "	vec3 totalEmissiveLight = emissive;",

    THREE.ShaderChunk[ "logdepthbuf_fragment" ],
    THREE.ShaderChunk[ "map_fragment" ],
    THREE.ShaderChunk[ "color_fragment" ],

    this._stringifyChunk('fragmentAlpha'),

    THREE.ShaderChunk[ "alphamap_fragment" ],
    THREE.ShaderChunk[ "alphatest_fragment" ],
    THREE.ShaderChunk[ "specularmap_fragment" ],
    THREE.ShaderChunk[ "normal_fragment" ],

    this._stringifyChunk('fragmentEmissive'),

    THREE.ShaderChunk[ "emissivemap_fragment" ],

    // accumulation
    THREE.ShaderChunk[ "lights_phong_fragment" ],

    this._stringifyChunk('fragmentSpecular'),

    THREE.ShaderChunk[ "lights_template" ],

    // modulation
    THREE.ShaderChunk[ "aomap_fragment" ],

    "vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveLight;",

    THREE.ShaderChunk[ "envmap_fragment" ],
    THREE.ShaderChunk[ "linear_to_gamma_fragment" ],

    THREE.ShaderChunk[ "fog_fragment" ],

    "	gl_FragColor = vec4( outgoingLight, diffuseColor.a );",

    "}"

  ].join( "\n" )
};
