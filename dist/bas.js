(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('three')) :
	typeof define === 'function' && define.amd ? define(['exports', 'three'], factory) :
	(factory((global.BAS = {}),global.THREE));
}(this, (function (exports,three) { 'use strict';

function BaseAnimationMaterial(parameters, uniforms) {
  three.ShaderMaterial.call(this);

  var uniformValues = parameters.uniformValues;
  delete parameters.uniformValues;

  this.setValues(parameters);

  this.uniforms = three.UniformsUtils.merge([uniforms, this.uniforms]);

  this.setUniformValues(uniformValues);

  if (uniformValues) {
    uniformValues.map && (this.defines['USE_MAP'] = '');
    uniformValues.normalMap && (this.defines['USE_NORMALMAP'] = '');
    uniformValues.envMap && (this.defines['USE_ENVMAP'] = '');
    uniformValues.aoMap && (this.defines['USE_AOMAP'] = '');
    uniformValues.specularMap && (this.defines['USE_SPECULARMAP'] = '');
    uniformValues.alphaMap && (this.defines['USE_ALPHAMAP'] = '');
    uniformValues.lightMap && (this.defines['USE_LIGHTMAP'] = '');
    uniformValues.emissiveMap && (this.defines['USE_EMISSIVEMAP'] = '');
    uniformValues.bumpMap && (this.defines['USE_BUMPMAP'] = '');
    uniformValues.displacementMap && (this.defines['USE_DISPLACEMENTMAP'] = '');
    uniformValues.roughnessMap && (this.defines['USE_DISPLACEMENTMAP'] = '');
    uniformValues.roughnessMap && (this.defines['USE_ROUGHNESSMAP'] = '');
    uniformValues.metalnessMap && (this.defines['USE_METALNESSMAP'] = '');

    if (uniformValues.envMap) {
      this.defines['USE_ENVMAP'] = '';

      var envMapTypeDefine = 'ENVMAP_TYPE_CUBE';
      var envMapModeDefine = 'ENVMAP_MODE_REFLECTION';
      var envMapBlendingDefine = 'ENVMAP_BLENDING_MULTIPLY';

      switch (uniformValues.envMap.mapping) {
        case three.CubeReflectionMapping:
        case three.CubeRefractionMapping:
          envMapTypeDefine = 'ENVMAP_TYPE_CUBE';
          break;
        case three.CubeUVReflectionMapping:
        case three.CubeUVRefractionMapping:
          envMapTypeDefine = 'ENVMAP_TYPE_CUBE_UV';
          break;
        case three.EquirectangularReflectionMapping:
        case three.EquirectangularRefractionMapping:
          envMapTypeDefine = 'ENVMAP_TYPE_EQUIREC';
          break;
        case three.SphericalReflectionMapping:
          envMapTypeDefine = 'ENVMAP_TYPE_SPHERE';
          break;
      }

      switch (uniformValues.envMap.mapping) {
        case three.CubeRefractionMapping:
        case three.EquirectangularRefractionMapping:
          envMapModeDefine = 'ENVMAP_MODE_REFRACTION';
          break;
      }

      switch (uniformValues.combine) {
        case three.MixOperation:
          envMapBlendingDefine = 'ENVMAP_BLENDING_MIX';
          break;
        case three.AddOperation:
          envMapBlendingDefine = 'ENVMAP_BLENDING_ADD';
          break;
        case three.MultiplyOperation:
        default:
          envMapBlendingDefine = 'ENVMAP_BLENDING_MULTIPLY';
          break;
      }

      this.defines[envMapTypeDefine] = '';
      this.defines[envMapBlendingDefine] = '';
      this.defines[envMapModeDefine] = '';
    }
  }
}

BaseAnimationMaterial.prototype = Object.assign(Object.create(three.ShaderMaterial.prototype), {
  constructor: BaseAnimationMaterial,

  setUniformValues: function setUniformValues(values) {
    var _this = this;

    if (!values) return;

    var keys = Object.keys(values);

    keys.forEach(function (key) {
      key in _this.uniforms && (_this.uniforms[key].value = values[key]);
    });
  },
  stringifyChunk: function stringifyChunk(name) {
    var value = void 0;

    if (!this[name]) {
      value = '';
    } else if (typeof this[name] === 'string') {
      value = this[name];
    } else {
      value = this[name].join('\n');
    }

    return value;
  }
});

function BasicAnimationMaterial(parameters) {
  this.varyingParameters = [];

  this.vertexParameters = [];
  this.vertexFunctions = [];
  this.vertexInit = [];
  this.vertexNormal = [];
  this.vertexPosition = [];
  this.vertexColor = [];

  this.fragmentFunctions = [];
  this.fragmentParameters = [];
  this.fragmentInit = [];
  this.fragmentMap = [];
  this.fragmentDiffuse = [];

  BaseAnimationMaterial.call(this, parameters, three.ShaderLib['basic'].uniforms);

  this.lights = false;
  this.vertexShader = this.concatVertexShader();
  this.fragmentShader = this.concatFragmentShader();
}
BasicAnimationMaterial.prototype = Object.create(BaseAnimationMaterial.prototype);
BasicAnimationMaterial.prototype.constructor = BasicAnimationMaterial;

BasicAnimationMaterial.prototype.concatVertexShader = function () {
  return '\n  #include <common>\n  #include <uv_pars_vertex>\n  #include <uv2_pars_vertex>\n  #include <envmap_pars_vertex>\n  #include <color_pars_vertex>\n  #include <fog_pars_vertex>\n  #include <morphtarget_pars_vertex>\n  #include <skinning_pars_vertex>\n  #include <logdepthbuf_pars_vertex>\n  #include <clipping_planes_pars_vertex>\n  \n  ' + this.stringifyChunk('vertexParameters') + '\n  ' + this.stringifyChunk('varyingParameters') + '\n  ' + this.stringifyChunk('vertexFunctions') + '\n  \n  void main() {\n\n    ' + this.stringifyChunk('vertexInit') + '\n  \n    #include <uv_vertex>\n    #include <uv2_vertex>\n    #include <color_vertex>\n    #include <skinbase_vertex>\n  \n    #ifdef USE_ENVMAP\n  \n    #include <beginnormal_vertex>\n    \n    ' + this.stringifyChunk('vertexNormal') + '\n    \n    #include <morphnormal_vertex>\n    #include <skinnormal_vertex>\n    #include <defaultnormal_vertex>\n  \n    #endif\n  \n    #include <begin_vertex>\n    \n    ' + this.stringifyChunk('vertexPosition') + '\n    ' + this.stringifyChunk('vertexColor') + '\n    \n    #include <morphtarget_vertex>\n    #include <skinning_vertex>\n    #include <project_vertex>\n    #include <logdepthbuf_vertex>\n  \n    #include <worldpos_vertex>\n    #include <clipping_planes_vertex>\n    #include <envmap_vertex>\n    #include <fog_vertex>\n  }';
};

BasicAnimationMaterial.prototype.concatFragmentShader = function () {
  return '\n  uniform vec3 diffuse;\n  uniform float opacity;\n  \n  ' + this.stringifyChunk('fragmentParameters') + '\n  ' + this.stringifyChunk('varyingParameters') + '\n  ' + this.stringifyChunk('fragmentFunctions') + '\n  \n  #ifndef FLAT_SHADED\n  \n    varying vec3 vNormal;\n  \n  #endif\n  \n  #include <common>\n  #include <color_pars_fragment>\n  #include <uv_pars_fragment>\n  #include <uv2_pars_fragment>\n  #include <map_pars_fragment>\n  #include <alphamap_pars_fragment>\n  #include <aomap_pars_fragment>\n  #include <lightmap_pars_fragment>\n  #include <envmap_pars_fragment>\n  #include <fog_pars_fragment>\n  #include <specularmap_pars_fragment>\n  #include <logdepthbuf_pars_fragment>\n  #include <clipping_planes_pars_fragment>\n  \n  void main() {\n  \n    ' + this.stringifyChunk('fragmentInit') + '\n  \n    #include <clipping_planes_fragment>\n\n    vec4 diffuseColor = vec4( diffuse, opacity );\n\n    ' + this.stringifyChunk('fragmentDiffuse') + '\n  \n    #include <logdepthbuf_fragment>\n    \n    ' + (this.stringifyChunk('fragmentMap') || '#include <map_fragment>') + '\n    \n    #include <color_fragment>\n    #include <alphamap_fragment>\n    #include <alphatest_fragment>\n    #include <specularmap_fragment>\n  \n    ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );\n  \n    // accumulation (baked indirect lighting only)\n    #ifdef USE_LIGHTMAP\n  \n      reflectedLight.indirectDiffuse += texture2D( lightMap, vUv2 ).xyz * lightMapIntensity;\n  \n    #else\n  \n      reflectedLight.indirectDiffuse += vec3( 1.0 );\n  \n    #endif\n  \n    // modulation\n    #include <aomap_fragment>\n  \n    reflectedLight.indirectDiffuse *= diffuseColor.rgb;\n  \n    vec3 outgoingLight = reflectedLight.indirectDiffuse;\n  \n    #include <envmap_fragment>\n  \n    gl_FragColor = vec4( outgoingLight, diffuseColor.a );\n  \n    #include <premultiplied_alpha_fragment>\n    #include <tonemapping_fragment>\n    #include <encodings_fragment>\n    #include <fog_fragment>\n  }';
};

function LambertAnimationMaterial(parameters) {
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
  this.fragmentEmissive = [];
  this.fragmentSpecular = [];

  BaseAnimationMaterial.call(this, parameters, three.ShaderLib['lambert'].uniforms);

  this.lights = true;
  this.vertexShader = this.concatVertexShader();
  this.fragmentShader = this.concatFragmentShader();
}
LambertAnimationMaterial.prototype = Object.create(BaseAnimationMaterial.prototype);
LambertAnimationMaterial.prototype.constructor = LambertAnimationMaterial;

LambertAnimationMaterial.prototype.concatVertexShader = function () {
  return '\n  #define LAMBERT\n\n  varying vec3 vLightFront;\n  \n  #ifdef DOUBLE_SIDED\n  \n    varying vec3 vLightBack;\n  \n  #endif\n  \n  #include <common>\n  #include <uv_pars_vertex>\n  #include <uv2_pars_vertex>\n  #include <envmap_pars_vertex>\n  #include <bsdfs>\n  #include <lights_pars>\n  #include <color_pars_vertex>\n  #include <fog_pars_vertex>\n  #include <morphtarget_pars_vertex>\n  #include <skinning_pars_vertex>\n  #include <shadowmap_pars_vertex>\n  #include <logdepthbuf_pars_vertex>\n  #include <clipping_planes_pars_vertex>\n  \n  ' + this.stringifyChunk('vertexParameters') + '\n  ' + this.stringifyChunk('varyingParameters') + '\n  ' + this.stringifyChunk('vertexFunctions') + '\n  \n  void main() {\n  \n    ' + this.stringifyChunk('vertexInit') + '\n  \n    #include <uv_vertex>\n    #include <uv2_vertex>\n    #include <color_vertex>\n  \n    #include <beginnormal_vertex>\n    \n    ' + this.stringifyChunk('vertexNormal') + '\n    \n    #include <morphnormal_vertex>\n    #include <skinbase_vertex>\n    #include <skinnormal_vertex>\n    #include <defaultnormal_vertex>\n  \n    #include <begin_vertex>\n    \n    ' + this.stringifyChunk('vertexPosition') + '\n    ' + this.stringifyChunk('vertexColor') + '\n    \n    #include <morphtarget_vertex>\n    #include <skinning_vertex>\n    #include <project_vertex>\n    #include <logdepthbuf_vertex>\n    #include <clipping_planes_vertex>\n  \n    #include <worldpos_vertex>\n    #include <envmap_vertex>\n    #include <lights_lambert_vertex>\n    #include <shadowmap_vertex>\n    #include <fog_vertex>\n  }';
};

LambertAnimationMaterial.prototype.concatFragmentShader = function () {
  return '\n  uniform vec3 diffuse;\n  uniform vec3 emissive;\n  uniform float opacity;\n  \n  varying vec3 vLightFront;\n  \n  #ifdef DOUBLE_SIDED\n  \n    varying vec3 vLightBack;\n  \n  #endif\n  \n  #include <common>\n  #include <packing>\n  #include <dithering_pars_fragment>\n  #include <color_pars_fragment>\n  #include <uv_pars_fragment>\n  #include <uv2_pars_fragment>\n  #include <map_pars_fragment>\n  #include <alphamap_pars_fragment>\n  #include <aomap_pars_fragment>\n  #include <lightmap_pars_fragment>\n  #include <emissivemap_pars_fragment>\n  #include <envmap_pars_fragment>\n  #include <bsdfs>\n  #include <lights_pars>\n  #include <fog_pars_fragment>\n  #include <shadowmap_pars_fragment>\n  #include <shadowmask_pars_fragment>\n  #include <specularmap_pars_fragment>\n  #include <logdepthbuf_pars_fragment>\n  #include <clipping_planes_pars_fragment>\n  \n  ' + this.stringifyChunk('fragmentParameters') + '\n  ' + this.stringifyChunk('varyingParameters') + '\n  ' + this.stringifyChunk('fragmentFunctions') + '\n  \n  void main() {\n  \n    ' + this.stringifyChunk('fragmentInit') + '\n  \n    #include <clipping_planes_fragment>\n\n    vec4 diffuseColor = vec4( diffuse, opacity );\n    ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );\n    vec3 totalEmissiveRadiance = emissive;\n\t\n    ' + this.stringifyChunk('fragmentDiffuse') + '\n  \n    #include <logdepthbuf_fragment>\n\n    ' + (this.stringifyChunk('fragmentMap') || '#include <map_fragment>') + '\n\n    #include <color_fragment>\n    #include <alphamap_fragment>\n    #include <alphatest_fragment>\n    #include <specularmap_fragment>\n\n    ' + this.stringifyChunk('fragmentEmissive') + '\n\n    #include <emissivemap_fragment>\n  \n    // accumulation\n    reflectedLight.indirectDiffuse = getAmbientLightIrradiance( ambientLightColor );\n  \n    #include <lightmap_fragment>\n  \n    reflectedLight.indirectDiffuse *= BRDF_Diffuse_Lambert( diffuseColor.rgb );\n  \n    #ifdef DOUBLE_SIDED\n  \n      reflectedLight.directDiffuse = ( gl_FrontFacing ) ? vLightFront : vLightBack;\n  \n    #else\n  \n      reflectedLight.directDiffuse = vLightFront;\n  \n    #endif\n  \n    reflectedLight.directDiffuse *= BRDF_Diffuse_Lambert( diffuseColor.rgb ) * getShadowMask();\n  \n    // modulation\n    #include <aomap_fragment>\n  \n    vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;\n  \n    #include <envmap_fragment>\n  \n    gl_FragColor = vec4( outgoingLight, diffuseColor.a );\n  \n    #include <tonemapping_fragment>\n    #include <encodings_fragment>\n    #include <fog_fragment>\n    #include <premultiplied_alpha_fragment>\n    #include <dithering_fragment>\n  }';
};

function PhongAnimationMaterial(parameters) {
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
  this.fragmentEmissive = [];
  this.fragmentSpecular = [];

  BaseAnimationMaterial.call(this, parameters, three.ShaderLib['phong'].uniforms);

  this.lights = true;
  this.vertexShader = this.concatVertexShader();
  this.fragmentShader = this.concatFragmentShader();
}
PhongAnimationMaterial.prototype = Object.create(BaseAnimationMaterial.prototype);
PhongAnimationMaterial.prototype.constructor = PhongAnimationMaterial;

PhongAnimationMaterial.prototype.concatVertexShader = function () {
  return '\n  #define PHONG\n\n  varying vec3 vViewPosition;\n  \n  #ifndef FLAT_SHADED\n  \n    varying vec3 vNormal;\n  \n  #endif\n  \n  #include <common>\n  #include <uv_pars_vertex>\n  #include <uv2_pars_vertex>\n  #include <displacementmap_pars_vertex>\n  #include <envmap_pars_vertex>\n  #include <color_pars_vertex>\n  #include <fog_pars_vertex>\n  #include <morphtarget_pars_vertex>\n  #include <skinning_pars_vertex>\n  #include <shadowmap_pars_vertex>\n  #include <logdepthbuf_pars_vertex>\n  #include <clipping_planes_pars_vertex>\n  \n  ' + this.stringifyChunk('vertexParameters') + '\n  ' + this.stringifyChunk('varyingParameters') + '\n  ' + this.stringifyChunk('vertexFunctions') + '\n  \n  void main() {\n  \n    ' + this.stringifyChunk('vertexInit') + '\n  \n    #include <uv_vertex>\n    #include <uv2_vertex>\n    #include <color_vertex>\n  \n    #include <beginnormal_vertex>\n    \n    ' + this.stringifyChunk('vertexNormal') + '\n    \n    #include <morphnormal_vertex>\n    #include <skinbase_vertex>\n    #include <skinnormal_vertex>\n    #include <defaultnormal_vertex>\n  \n  #ifndef FLAT_SHADED // Normal computed with derivatives when FLAT_SHADED\n  \n    vNormal = normalize( transformedNormal );\n  \n  #endif\n  \n    #include <begin_vertex>\n    \n    ' + this.stringifyChunk('vertexPosition') + '\n    ' + this.stringifyChunk('vertexColor') + '\n    \n    #include <morphtarget_vertex>\n    #include <skinning_vertex>\n    #include <displacementmap_vertex>\n    #include <project_vertex>\n    #include <logdepthbuf_vertex>\n    #include <clipping_planes_vertex>\n  \n    vViewPosition = - mvPosition.xyz;\n  \n    #include <worldpos_vertex>\n    #include <envmap_vertex>\n    #include <shadowmap_vertex>\n    #include <fog_vertex>\n  }';
};

PhongAnimationMaterial.prototype.concatFragmentShader = function () {
  return '\n  #define PHONG\n\n  uniform vec3 diffuse;\n  uniform vec3 emissive;\n  uniform vec3 specular;\n  uniform float shininess;\n  uniform float opacity;\n  \n  #include <common>\n  #include <packing>\n  #include <dithering_pars_fragment>\n  #include <color_pars_fragment>\n  #include <uv_pars_fragment>\n  #include <uv2_pars_fragment>\n  #include <map_pars_fragment>\n  #include <alphamap_pars_fragment>\n  #include <aomap_pars_fragment>\n  #include <lightmap_pars_fragment>\n  #include <emissivemap_pars_fragment>\n  #include <envmap_pars_fragment>\n  #include <gradientmap_pars_fragment>\n  #include <fog_pars_fragment>\n  #include <bsdfs>\n  #include <lights_pars>\n  #include <lights_phong_pars_fragment>\n  #include <shadowmap_pars_fragment>\n  #include <bumpmap_pars_fragment>\n  #include <normalmap_pars_fragment>\n  #include <specularmap_pars_fragment>\n  #include <logdepthbuf_pars_fragment>\n  #include <clipping_planes_pars_fragment>\n  \n  ' + this.stringifyChunk('fragmentParameters') + '\n  ' + this.stringifyChunk('varyingParameters') + '\n  ' + this.stringifyChunk('fragmentFunctions') + '\n  \n  void main() {\n  \n    ' + this.stringifyChunk('fragmentInit') + '\n  \n    #include <clipping_planes_fragment>\n  \n    vec4 diffuseColor = vec4( diffuse, opacity );\n    ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );\n    vec3 totalEmissiveRadiance = emissive;\n  \n    ' + this.stringifyChunk('fragmentDiffuse') + '\n  \n    #include <logdepthbuf_fragment>\n\n    ' + (this.stringifyChunk('fragmentMap') || '#include <map_fragment>') + '\n\n    #include <color_fragment>\n    #include <alphamap_fragment>\n    #include <alphatest_fragment>\n    #include <specularmap_fragment>\n    #include <normal_fragment>\n    \n    ' + this.stringifyChunk('fragmentEmissive') + '\n    \n    #include <emissivemap_fragment>\n  \n    // accumulation\n    #include <lights_phong_fragment>\n    \n    ' + this.stringifyChunk('fragmentSpecular') + '\n    \n    #include <lights_template>\n  \n    // modulation\n    #include <aomap_fragment>\n  \n    vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;\n  \n    #include <envmap_fragment>\n  \n    gl_FragColor = vec4( outgoingLight, diffuseColor.a );\n  \n    #include <tonemapping_fragment>\n    #include <encodings_fragment>\n    #include <fog_fragment>\n    #include <premultiplied_alpha_fragment>\n    #include <dithering_fragment>\n  \n  }';
};

function StandardAnimationMaterial(parameters) {
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

  BaseAnimationMaterial.call(this, parameters, three.ShaderLib['standard'].uniforms);

  this.lights = true;
  this.vertexShader = this.concatVertexShader();
  this.fragmentShader = this.concatFragmentShader();
}
StandardAnimationMaterial.prototype = Object.create(BaseAnimationMaterial.prototype);
StandardAnimationMaterial.prototype.constructor = StandardAnimationMaterial;

StandardAnimationMaterial.prototype.concatVertexShader = function () {
  return '\n  #define PHYSICAL\n\n  varying vec3 vViewPosition;\n  \n  #ifndef FLAT_SHADED\n  \n    varying vec3 vNormal;\n  \n  #endif\n  \n  #include <common>\n  #include <uv_pars_vertex>\n  #include <uv2_pars_vertex>\n  #include <displacementmap_pars_vertex>\n  #include <color_pars_vertex>\n  #include <fog_pars_vertex>\n  #include <morphtarget_pars_vertex>\n  #include <skinning_pars_vertex>\n  #include <shadowmap_pars_vertex>\n  #include <logdepthbuf_pars_vertex>\n  #include <clipping_planes_pars_vertex>\n  \n  ' + this.stringifyChunk('vertexParameters') + '\n  ' + this.stringifyChunk('varyingParameters') + '\n  ' + this.stringifyChunk('vertexFunctions') + '\n  \n  void main() {\n\n    ' + this.stringifyChunk('vertexInit') + '\n\n    #include <uv_vertex>\n    #include <uv2_vertex>\n    #include <color_vertex>\n  \n    #include <beginnormal_vertex>\n    \n    ' + this.stringifyChunk('vertexNormal') + '\n    \n    #include <morphnormal_vertex>\n    #include <skinbase_vertex>\n    #include <skinnormal_vertex>\n    #include <defaultnormal_vertex>\n  \n  #ifndef FLAT_SHADED // Normal computed with derivatives when FLAT_SHADED\n  \n    vNormal = normalize( transformedNormal );\n  \n  #endif\n  \n    #include <begin_vertex>\n    \n    ' + this.stringifyChunk('vertexPosition') + '\n    ' + this.stringifyChunk('vertexColor') + '\n    \n    #include <morphtarget_vertex>\n    #include <skinning_vertex>\n    #include <displacementmap_vertex>\n    #include <project_vertex>\n    #include <logdepthbuf_vertex>\n    #include <clipping_planes_vertex>\n  \n    vViewPosition = - mvPosition.xyz;\n  \n    #include <worldpos_vertex>\n    #include <shadowmap_vertex>\n    #include <fog_vertex>\n  }';
};

StandardAnimationMaterial.prototype.concatFragmentShader = function () {
  return '\n  #define PHYSICAL\n  \n  uniform vec3 diffuse;\n  uniform vec3 emissive;\n  uniform float roughness;\n  uniform float metalness;\n  uniform float opacity;\n  \n  #ifndef STANDARD\n    uniform float clearCoat;\n    uniform float clearCoatRoughness;\n  #endif\n  \n  varying vec3 vViewPosition;\n  \n  #ifndef FLAT_SHADED\n  \n    varying vec3 vNormal;\n  \n  #endif\n  \n  #include <common>\n  #include <packing>\n  #include <dithering_pars_fragment>\n  #include <color_pars_fragment>\n  #include <uv_pars_fragment>\n  #include <uv2_pars_fragment>\n  #include <map_pars_fragment>\n  #include <alphamap_pars_fragment>\n  #include <aomap_pars_fragment>\n  #include <lightmap_pars_fragment>\n  #include <emissivemap_pars_fragment>\n  #include <envmap_pars_fragment>\n  #include <fog_pars_fragment>\n  #include <bsdfs>\n  #include <cube_uv_reflection_fragment>\n  #include <lights_pars>\n  #include <lights_physical_pars_fragment>\n  #include <shadowmap_pars_fragment>\n  #include <bumpmap_pars_fragment>\n  #include <normalmap_pars_fragment>\n  #include <roughnessmap_pars_fragment>\n  #include <metalnessmap_pars_fragment>\n  #include <logdepthbuf_pars_fragment>\n  #include <clipping_planes_pars_fragment>\n  \n  ' + this.stringifyChunk('fragmentParameters') + '\n  ' + this.stringifyChunk('varyingParameters') + '\n  ' + this.stringifyChunk('fragmentFunctions') + '\n  \n  void main() {\n  \n    ' + this.stringifyChunk('fragmentInit') + '\n  \n    #include <clipping_planes_fragment>\n  \n    vec4 diffuseColor = vec4( diffuse, opacity );\n    ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );\n    vec3 totalEmissiveRadiance = emissive;\n  \n    ' + this.stringifyChunk('fragmentDiffuse') + '\n  \n    #include <logdepthbuf_fragment>\n\n    ' + (this.stringifyChunk('fragmentMap') || '#include <map_fragment>') + '\n\n    #include <color_fragment>\n    #include <alphamap_fragment>\n    #include <alphatest_fragment>\n    \n    float roughnessFactor = roughness;\n    ' + this.stringifyChunk('fragmentRoughness') + '\n    #ifdef USE_ROUGHNESSMAP\n    \n      vec4 texelRoughness = texture2D( roughnessMap, vUv );\n    \n      // reads channel G, compatible with a combined OcclusionRoughnessMetallic (RGB) texture\n      roughnessFactor *= texelRoughness.g;\n    \n    #endif\n    \n    float metalnessFactor = metalness;\n    ' + this.stringifyChunk('fragmentMetalness') + '\n    #ifdef USE_METALNESSMAP\n    \n      vec4 texelMetalness = texture2D( metalnessMap, vUv );\n      metalnessFactor *= texelMetalness.b;\n    \n    #endif\n    \n    #include <normal_fragment>\n    \n    ' + this.stringifyChunk('fragmentEmissive') + '\n    \n    #include <emissivemap_fragment>\n  \n    // accumulation\n    #include <lights_physical_fragment>\n    #include <lights_template>\n  \n    // modulation\n    #include <aomap_fragment>\n  \n    vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;\n  \n    gl_FragColor = vec4( outgoingLight, diffuseColor.a );\n  \n    #include <tonemapping_fragment>\n    #include <encodings_fragment>\n    #include <fog_fragment>\n    #include <premultiplied_alpha_fragment>\n    #include <dithering_fragment>\n  \n  }';
};

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

  BaseAnimationMaterial.call(this, parameters, three.ShaderLib['points'].uniforms);

  this.vertexShader = this.concatVertexShader();
  this.fragmentShader = this.concatFragmentShader();
}

PointsAnimationMaterial.prototype = Object.create(BaseAnimationMaterial.prototype);
PointsAnimationMaterial.prototype.constructor = PointsAnimationMaterial;

PointsAnimationMaterial.prototype.concatVertexShader = function () {
  return '\n  uniform float size;\n  uniform float scale;\n  \n  #include <common>\n  #include <color_pars_vertex>\n  #include <fog_pars_vertex>\n  #include <shadowmap_pars_vertex>\n  #include <logdepthbuf_pars_vertex>\n  #include <clipping_planes_pars_vertex>\n  \n  ' + this.stringifyChunk('vertexParameters') + '\n  ' + this.stringifyChunk('varyingParameters') + '\n  ' + this.stringifyChunk('vertexFunctions') + '\n  \n  void main() {\n  \n    ' + this.stringifyChunk('vertexInit') + '\n  \n    #include <color_vertex>\n    #include <begin_vertex>\n    \n    ' + this.stringifyChunk('vertexPosition') + '\n    ' + this.stringifyChunk('vertexColor') + '\n    \n    #include <project_vertex>\n  \n    #ifdef USE_SIZEATTENUATION\n      gl_PointSize = size * ( scale / - mvPosition.z );\n    #else\n      gl_PointSize = size;\n    #endif\n  \n    #include <logdepthbuf_vertex>\n    #include <clipping_planes_vertex>\n    #include <worldpos_vertex>\n    #include <shadowmap_vertex>\n    #include <fog_vertex>\n  }';
};

PointsAnimationMaterial.prototype.concatFragmentShader = function () {
  return '\n  uniform vec3 diffuse;\n  uniform float opacity;\n  \n  #include <common>\n  #include <packing>\n  #include <color_pars_fragment>\n  #include <map_particle_pars_fragment>\n  #include <fog_pars_fragment>\n  #include <shadowmap_pars_fragment>\n  #include <logdepthbuf_pars_fragment>\n  #include <clipping_planes_pars_fragment>\n  \n  ' + this.stringifyChunk('fragmentParameters') + '\n  ' + this.stringifyChunk('varyingParameters') + '\n  ' + this.stringifyChunk('fragmentFunctions') + '\n  \n  void main() {\n  \n    ' + this.stringifyChunk('fragmentInit') + '\n  \n    #include <clipping_planes_fragment>\n  \n    vec3 outgoingLight = vec3( 0.0 );\n    vec4 diffuseColor = vec4( diffuse, opacity );\n  \n    ' + this.stringifyChunk('fragmentDiffuse') + '\n  \n    #include <logdepthbuf_fragment>\n\n    ' + (this.stringifyChunk('fragmentMap') || '#include <map_particle_fragment>') + '\n\n    #include <color_fragment>\n    #include <alphatest_fragment>\n  \n    outgoingLight = diffuseColor.rgb;\n  \n    gl_FragColor = vec4( outgoingLight, diffuseColor.a );\n    \n    ' + this.stringifyChunk('fragmentShape') + '\n  \n    #include <premultiplied_alpha_fragment>\n    #include <tonemapping_fragment>\n    #include <encodings_fragment>\n    #include <fog_fragment>\n  }';
};

function DepthAnimationMaterial(parameters) {
  this.depthPacking = three.RGBADepthPacking;
  this.clipping = true;

  this.vertexFunctions = [];
  this.vertexParameters = [];
  this.vertexInit = [];
  this.vertexPosition = [];

  BaseAnimationMaterial.call(this, parameters);

  this.uniforms = three.UniformsUtils.merge([three.ShaderLib['depth'].uniforms, this.uniforms]);
  this.vertexShader = this.concatVertexShader();
  this.fragmentShader = three.ShaderLib['depth'].fragmentShader;
}
DepthAnimationMaterial.prototype = Object.create(BaseAnimationMaterial.prototype);
DepthAnimationMaterial.prototype.constructor = DepthAnimationMaterial;

DepthAnimationMaterial.prototype.concatVertexShader = function () {

  return '\n  #include <common>\n  #include <uv_pars_vertex>\n  #include <displacementmap_pars_vertex>\n  #include <morphtarget_pars_vertex>\n  #include <skinning_pars_vertex>\n  #include <logdepthbuf_pars_vertex>\n  #include <clipping_planes_pars_vertex>\n  \n  ' + this.stringifyChunk('vertexParameters') + '\n  ' + this.stringifyChunk('vertexFunctions') + '\n  \n  void main() {\n  \n    ' + this.stringifyChunk('vertexInit') + '\n  \n    #include <uv_vertex>\n  \n    #include <skinbase_vertex>\n  \n    #ifdef USE_DISPLACEMENTMAP\n  \n      #include <beginnormal_vertex>\n      #include <morphnormal_vertex>\n      #include <skinnormal_vertex>\n  \n    #endif\n  \n    #include <begin_vertex>\n    \n    ' + this.stringifyChunk('vertexPosition') + '\n\n    #include <morphtarget_vertex>\n    #include <skinning_vertex>\n    #include <displacementmap_vertex>\n    #include <project_vertex>\n    #include <logdepthbuf_vertex>\n    #include <clipping_planes_vertex>\n  }';
};

function DistanceAnimationMaterial(parameters) {
  this.depthPacking = three.RGBADepthPacking;
  this.clipping = true;

  this.vertexFunctions = [];
  this.vertexParameters = [];
  this.vertexInit = [];
  this.vertexPosition = [];

  BaseAnimationMaterial.call(this, parameters);

  this.uniforms = three.UniformsUtils.merge([three.ShaderLib['distanceRGBA'].uniforms, this.uniforms]);
  this.vertexShader = this.concatVertexShader();
  this.fragmentShader = three.ShaderLib['distanceRGBA'].fragmentShader;
}
DistanceAnimationMaterial.prototype = Object.create(BaseAnimationMaterial.prototype);
DistanceAnimationMaterial.prototype.constructor = DistanceAnimationMaterial;

DistanceAnimationMaterial.prototype.concatVertexShader = function () {
  return '\n  #define DISTANCE\n\n  varying vec3 vWorldPosition;\n  \n  #include <common>\n  #include <uv_pars_vertex>\n  #include <displacementmap_pars_vertex>\n  #include <morphtarget_pars_vertex>\n  #include <skinning_pars_vertex>\n  #include <clipping_planes_pars_vertex>\n  \n  ' + this.stringifyChunk('vertexParameters') + '\n  ' + this.stringifyChunk('vertexFunctions') + '\n  \n  void main() {\n\n    ' + this.stringifyChunk('vertexInit') + '\n  \n    #include <uv_vertex>\n  \n    #include <skinbase_vertex>\n  \n    #ifdef USE_DISPLACEMENTMAP\n  \n      #include <beginnormal_vertex>\n      #include <morphnormal_vertex>\n      #include <skinnormal_vertex>\n  \n    #endif\n  \n    #include <begin_vertex>\n    \n    ' + this.stringifyChunk('vertexPosition') + '\n\n    #include <morphtarget_vertex>\n    #include <skinning_vertex>\n    #include <displacementmap_vertex>\n    #include <project_vertex>\n    #include <worldpos_vertex>\n    #include <clipping_planes_vertex>\n  \n    vWorldPosition = worldPosition.xyz;\n  \n  }';
};

function PrefabBufferGeometry(prefab, count) {
  three.BufferGeometry.call(this);

  /**
   * A reference to the prefab geometry used to create this instance.
   * @type {Geometry|BufferGeometry}
   */
  this.prefabGeometry = prefab;
  this.isPrefabBufferGeometry = prefab.isBufferGeometry;

  /**
   * Number of prefabs.
   * @type {Number}
   */
  this.prefabCount = count;

  /**
   * Number of vertices of the prefab.
   * @type {Number}
   */
  if (this.isPrefabBufferGeometry) {
    this.prefabVertexCount = prefab.attributes.position.count;
  } else {
    this.prefabVertexCount = prefab.vertices.length;
  }

  this.bufferIndices();
  this.bufferPositions();
}
PrefabBufferGeometry.prototype = Object.create(three.BufferGeometry.prototype);
PrefabBufferGeometry.prototype.constructor = PrefabBufferGeometry;

PrefabBufferGeometry.prototype.bufferIndices = function () {
  var prefabIndices = [];
  var prefabIndexCount = void 0;

  if (this.isPrefabBufferGeometry) {
    if (this.prefabGeometry.index) {
      prefabIndexCount = this.prefabGeometry.index.count;
      prefabIndices = this.prefabGeometry.index.array;
    } else {
      prefabIndexCount = this.prefabVertexCount;

      for (var i = 0; i < prefabIndexCount; i++) {
        prefabIndices.push(i);
      }
    }
  } else {
    var prefabFaceCount = this.prefabGeometry.faces.length;
    prefabIndexCount = prefabFaceCount * 3;

    for (var _i = 0; _i < prefabFaceCount; _i++) {
      var face = this.prefabGeometry.faces[_i];
      prefabIndices.push(face.a, face.b, face.c);
    }
  }

  var indexBuffer = new Uint32Array(this.prefabCount * prefabIndexCount);

  this.setIndex(new three.BufferAttribute(indexBuffer, 1));

  for (var _i2 = 0; _i2 < this.prefabCount; _i2++) {
    for (var k = 0; k < prefabIndexCount; k++) {
      indexBuffer[_i2 * prefabIndexCount + k] = prefabIndices[k] + _i2 * this.prefabVertexCount;
    }
  }
};

PrefabBufferGeometry.prototype.bufferPositions = function () {
  var positionBuffer = this.createAttribute('position', 3).array;

  if (this.isPrefabBufferGeometry) {
    var positions = this.prefabGeometry.attributes.position.array;

    for (var i = 0, offset = 0; i < this.prefabCount; i++) {
      for (var j = 0; j < this.prefabVertexCount; j++, offset += 3) {
        positionBuffer[offset] = positions[j * 3];
        positionBuffer[offset + 1] = positions[j * 3 + 1];
        positionBuffer[offset + 2] = positions[j * 3 + 2];
      }
    }
  } else {
    for (var _i3 = 0, _offset = 0; _i3 < this.prefabCount; _i3++) {
      for (var _j = 0; _j < this.prefabVertexCount; _j++, _offset += 3) {
        var prefabVertex = this.prefabGeometry.vertices[_j];

        positionBuffer[_offset] = prefabVertex.x;
        positionBuffer[_offset + 1] = prefabVertex.y;
        positionBuffer[_offset + 2] = prefabVertex.z;
      }
    }
  }
};

/**
 * Creates a BufferAttribute with UV coordinates.
 */
PrefabBufferGeometry.prototype.bufferUvs = function () {
  var prefabUvs = [];

  if (this.isPrefabBufferGeometry) {
    var uv = this.prefabGeometry.attributes.uv.array;

    for (var i = 0; i < this.prefabVertexCount; i++) {
      prefabUvs.push(new three.Vector2(uv[i * 2], uv[i * 2 + 1]));
    }
  } else {
    var prefabFaceCount = this.prefabGeometry.faces.length;

    for (var _i4 = 0; _i4 < prefabFaceCount; _i4++) {
      var face = this.prefabGeometry.faces[_i4];
      var _uv = this.prefabGeometry.faceVertexUvs[0][_i4];

      prefabUvs[face.a] = _uv[0];
      prefabUvs[face.b] = _uv[1];
      prefabUvs[face.c] = _uv[2];
    }
  }

  var uvBuffer = this.createAttribute('uv', 2);

  for (var _i5 = 0, offset = 0; _i5 < this.prefabCount; _i5++) {
    for (var j = 0; j < this.prefabVertexCount; j++, offset += 2) {
      var prefabUv = prefabUvs[j];

      uvBuffer.array[offset] = prefabUv.x;
      uvBuffer.array[offset + 1] = prefabUv.y;
    }
  }
};

/**
 * Creates a BufferAttribute on this geometry instance.
 *
 * @param {String} name Name of the attribute.
 * @param {Number} itemSize Number of floats per vertex (typically 1, 2, 3 or 4).
 * @param {function=} factory Function that will be called for each prefab upon creation. Accepts 3 arguments: data[], index and prefabCount. Calls setPrefabData.
 *
 * @returns {BufferAttribute}
 */
PrefabBufferGeometry.prototype.createAttribute = function (name, itemSize, factory) {
  var buffer = new Float32Array(this.prefabCount * this.prefabVertexCount * itemSize);
  var attribute = new three.BufferAttribute(buffer, itemSize);

  this.addAttribute(name, attribute);

  if (factory) {
    var data = [];

    for (var i = 0; i < this.prefabCount; i++) {
      factory(data, i, this.prefabCount);
      this.setPrefabData(attribute, i, data);
    }
  }

  return attribute;
};

/**
 * Sets data for all vertices of a prefab at a given index.
 * Usually called in a loop.
 *
 * @param {String|BufferAttribute} attribute The attribute or attribute name where the data is to be stored.
 * @param {Number} prefabIndex Index of the prefab in the buffer geometry.
 * @param {Array} data Array of data. Length should be equal to item size of the attribute.
 */
PrefabBufferGeometry.prototype.setPrefabData = function (attribute, prefabIndex, data) {
  attribute = typeof attribute === 'string' ? this.attributes[attribute] : attribute;

  var offset = prefabIndex * this.prefabVertexCount * attribute.itemSize;

  for (var i = 0; i < this.prefabVertexCount; i++) {
    for (var j = 0; j < attribute.itemSize; j++) {
      attribute.array[offset++] = data[j];
    }
  }
};

function MultiPrefabBufferGeometry(prefabs, repeatCount) {
  three.BufferGeometry.call(this);

  if (Array.isArray(prefabs)) {
    this.prefabGeometries = prefabs;
  } else {
    this.prefabGeometries = [prefabs];
  }

  this.prefabGeometriesCount = this.prefabGeometries.length;

  /**
   * Number of prefabs.
   * @type {Number}
   */
  this.prefabCount = repeatCount * this.prefabGeometriesCount;
  this.repeatCount = repeatCount;

  /**
   * Array of vertex counts per prefab.
   * @type {Array}
   */
  this.prefabVertexCounts = this.prefabGeometries.map(function (p) {
    return p.isBufferGeometry ? p.attributes.position.count : p.vertices.length;
  });
  this.repeatVertexCount = this.prefabVertexCounts.reduce(function (r, v) {
    return r + v;
  }, 0);

  this.bufferIndices();
  this.bufferPositions();
}
MultiPrefabBufferGeometry.prototype = Object.create(three.BufferGeometry.prototype);
MultiPrefabBufferGeometry.prototype.constructor = MultiPrefabBufferGeometry;

MultiPrefabBufferGeometry.prototype.bufferIndices = function () {
  var _this = this;

  this.prefabIndices = [];
  var repeatIndexCount = 0;

  this.prefabGeometries.forEach(function (geometry) {
    var indices = [];

    if (geometry.isBufferGeometry) {
      if (geometry.index) {
        indices = geometry.index.array;
      } else {
        for (var i = 0; i < geometry.attributes.position.count; i++) {
          indices.push(i);
        }
      }
    } else {
      for (var _i = 0; _i < geometry.faces.length; _i++) {
        var face = geometry.faces[_i];
        indices.push(face.a, face.b, face.c);
      }
    }

    _this.prefabIndices.push(indices);

    repeatIndexCount += indices.length;
  });

  var indexBuffer = new Uint32Array(repeatIndexCount * this.repeatCount);
  var indexOffset = 0;
  var prefabOffset = 0;

  for (var i = 0; i < this.prefabCount; i++) {
    var index = i % this.prefabGeometriesCount;
    var indices = this.prefabIndices[index];
    var vertexCount = this.prefabVertexCounts[index];

    for (var j = 0; j < indices.length; j++) {
      indexBuffer[indexOffset++] = indices[j] + prefabOffset;
    }

    prefabOffset += vertexCount;
  }

  this.setIndex(new three.BufferAttribute(indexBuffer, 1));
};

MultiPrefabBufferGeometry.prototype.bufferPositions = function () {
  var _this2 = this;

  var positionBuffer = this.createAttribute('position', 3).array;

  var prefabPositions = this.prefabGeometries.map(function (geometry, i) {
    var positions = void 0;

    if (geometry.isBufferGeometry) {
      positions = geometry.attributes.position.array;
    } else {

      var vertexCount = _this2.prefabVertexCounts[i];

      positions = [];

      for (var j = 0, offset = 0; j < vertexCount; j++) {
        var prefabVertex = geometry.vertices[j];

        positions[offset++] = prefabVertex.x;
        positions[offset++] = prefabVertex.y;
        positions[offset++] = prefabVertex.z;
      }
    }

    return positions;
  });

  for (var i = 0, offset = 0; i < this.prefabCount; i++) {
    var index = i % this.prefabGeometries.length;
    var vertexCount = this.prefabVertexCounts[index];
    var positions = prefabPositions[index];

    for (var j = 0; j < vertexCount; j++) {
      positionBuffer[offset++] = positions[j * 3];
      positionBuffer[offset++] = positions[j * 3 + 1];
      positionBuffer[offset++] = positions[j * 3 + 2];
    }
  }
};

/**
 * Creates a BufferAttribute with UV coordinates.
 */
MultiPrefabBufferGeometry.prototype.bufferUvs = function () {
  var _this3 = this;

  var uvBuffer = this.createAttribute('uv', 2).array;

  var prefabUvs = this.prefabGeometries.map(function (geometry, i) {
    var uvs = void 0;

    if (geometry.isBufferGeometry) {
      if (!geometry.attributes.uv) {
        console.error('No UV found in prefab geometry', geometry);
      }

      uvs = geometry.attributes.uv.array;
    } else {
      var prefabFaceCount = _this3.prefabIndices[i].length / 3;
      var uvObjects = [];

      for (var j = 0; j < prefabFaceCount; j++) {
        var face = geometry.faces[j];
        var uv = geometry.faceVertexUvs[0][j];

        uvObjects[face.a] = uv[0];
        uvObjects[face.b] = uv[1];
        uvObjects[face.c] = uv[2];
      }

      uvs = [];

      for (var k = 0; k < uvObjects.length; k++) {
        uvs[k * 2] = uvObjects[k].x;
        uvs[k * 2 + 1] = uvObjects[k].y;
      }
    }

    return uvs;
  });

  for (var i = 0, offset = 0; i < this.prefabCount; i++) {

    var index = i % this.prefabGeometries.length;
    var vertexCount = this.prefabVertexCounts[index];
    var uvs = prefabUvs[index];

    for (var j = 0; j < vertexCount; j++) {
      uvBuffer[offset++] = uvs[j * 2];
      uvBuffer[offset++] = uvs[j * 2 + 1];
    }
  }
};

/**
 * Creates a BufferAttribute on this geometry instance.
 *
 * @param {String} name Name of the attribute.
 * @param {Number} itemSize Number of floats per vertex (typically 1, 2, 3 or 4).
 * @param {function=} factory Function that will be called for each prefab upon creation. Accepts 3 arguments: data[], index and prefabCount. Calls setPrefabData.
 *
 * @returns {BufferAttribute}
 */
MultiPrefabBufferGeometry.prototype.createAttribute = function (name, itemSize, factory) {
  var buffer = new Float32Array(this.repeatCount * this.repeatVertexCount * itemSize);
  var attribute = new three.BufferAttribute(buffer, itemSize);

  this.addAttribute(name, attribute);

  if (factory) {
    var data = [];

    for (var i = 0; i < this.prefabCount; i++) {
      factory(data, i, this.prefabCount);
      this.setPrefabData(attribute, i, data);
    }
  }

  return attribute;
};

/**
 * Sets data for all vertices of a prefab at a given index.
 * Usually called in a loop.
 *
 * @param {String|BufferAttribute} attribute The attribute or attribute name where the data is to be stored.
 * @param {Number} prefabIndex Index of the prefab in the buffer geometry.
 * @param {Array} data Array of data. Length should be equal to item size of the attribute.
 */
MultiPrefabBufferGeometry.prototype.setPrefabData = function (attribute, prefabIndex, data) {
  attribute = typeof attribute === 'string' ? this.attributes[attribute] : attribute;

  var prefabGeometryIndex = prefabIndex % this.prefabGeometriesCount;
  var prefabGeometryVertexCount = this.prefabVertexCounts[prefabGeometryIndex];
  var whole = (prefabIndex / this.prefabGeometriesCount | 0) * this.prefabGeometriesCount;
  var wholeOffset = whole * this.repeatVertexCount;
  var part = prefabIndex - whole;
  var partOffset = 0;
  var i = 0;

  while (i < part) {
    partOffset += this.prefabVertexCounts[i++];
  }

  var offset = (wholeOffset + partOffset) * attribute.itemSize;

  for (var _i2 = 0; _i2 < prefabGeometryVertexCount; _i2++) {
    for (var j = 0; j < attribute.itemSize; j++) {
      attribute.array[offset++] = data[j];
    }
  }
};

var Utils = {
  /**
   * Duplicates vertices so each face becomes separate.
   * Same as THREE.ExplodeModifier.
   *
   * @param {THREE.Geometry} geometry Geometry instance to modify.
   */
  separateFaces: function separateFaces(geometry) {
    var vertices = [];

    for (var i = 0, il = geometry.faces.length; i < il; i++) {
      var n = vertices.length;
      var face = geometry.faces[i];

      var a = face.a;
      var b = face.b;
      var c = face.c;

      var va = geometry.vertices[a];
      var vb = geometry.vertices[b];
      var vc = geometry.vertices[c];

      vertices.push(va.clone());
      vertices.push(vb.clone());
      vertices.push(vc.clone());

      face.a = n;
      face.b = n + 1;
      face.c = n + 2;
    }

    geometry.vertices = vertices;
  },

  /**
   * Compute the centroid (center) of a THREE.Face3.
   *
   * @param {THREE.Geometry} geometry Geometry instance the face is in.
   * @param {THREE.Face3} face Face object from the THREE.Geometry.faces array
   * @param {THREE.Vector3=} v Optional vector to store result in.
   * @returns {THREE.Vector3}
   */
  computeCentroid: function computeCentroid(geometry, face, v) {
    var a = geometry.vertices[face.a];
    var b = geometry.vertices[face.b];
    var c = geometry.vertices[face.c];

    v = v || new THREE.Vector3();

    v.x = (a.x + b.x + c.x) / 3;
    v.y = (a.y + b.y + c.y) / 3;
    v.z = (a.z + b.z + c.z) / 3;

    return v;
  },

  /**
   * Get a random vector between box.min and box.max.
   *
   * @param {THREE.Box3} box THREE.Box3 instance.
   * @param {THREE.Vector3=} v Optional vector to store result in.
   * @returns {THREE.Vector3}
   */
  randomInBox: function randomInBox(box, v) {
    v = v || new three.Vector3();

    v.x = three.Math.randFloat(box.min.x, box.max.x);
    v.y = three.Math.randFloat(box.min.y, box.max.y);
    v.z = three.Math.randFloat(box.min.z, box.max.z);

    return v;
  },

  /**
   * Get a random axis for quaternion rotation.
   *
   * @param {THREE.Vector3=} v Option vector to store result in.
   * @returns {THREE.Vector3}
   */
  randomAxis: function randomAxis(v) {
    v = v || new three.Vector3();

    v.x = three.Math.randFloatSpread(2.0);
    v.y = three.Math.randFloatSpread(2.0);
    v.z = three.Math.randFloatSpread(2.0);
    v.normalize();

    return v;
  },

  /**
   * Create a THREE.BAS.DepthAnimationMaterial for shadows from a THREE.SpotLight or THREE.DirectionalLight by copying relevant shader chunks.
   * Uniform values must be manually synced between the source material and the depth material.
   *
   * @see {@link http://three-bas-examples.surge.sh/examples/shadows/}
   *
   * @param {THREE.BAS.BaseAnimationMaterial} sourceMaterial Instance to get the shader chunks from.
   * @returns {THREE.BAS.DepthAnimationMaterial}
   */
  createDepthAnimationMaterial: function createDepthAnimationMaterial(sourceMaterial) {
    return new DepthAnimationMaterial({
      uniforms: sourceMaterial.uniforms,
      defines: sourceMaterial.defines,
      vertexFunctions: sourceMaterial.vertexFunctions,
      vertexParameters: sourceMaterial.vertexParameters,
      vertexInit: sourceMaterial.vertexInit,
      vertexPosition: sourceMaterial.vertexPosition
    });
  },

  /**
   * Create a THREE.BAS.DistanceAnimationMaterial for shadows from a THREE.PointLight by copying relevant shader chunks.
   * Uniform values must be manually synced between the source material and the distance material.
   *
   * @see {@link http://three-bas-examples.surge.sh/examples/shadows/}
   *
   * @param {THREE.BAS.BaseAnimationMaterial} sourceMaterial Instance to get the shader chunks from.
   * @returns {THREE.BAS.DistanceAnimationMaterial}
   */
  createDistanceAnimationMaterial: function createDistanceAnimationMaterial(sourceMaterial) {
    return new DistanceAnimationMaterial({
      uniforms: sourceMaterial.uniforms,
      defines: sourceMaterial.defines,
      vertexFunctions: sourceMaterial.vertexFunctions,
      vertexParameters: sourceMaterial.vertexParameters,
      vertexInit: sourceMaterial.vertexInit,
      vertexPosition: sourceMaterial.vertexPosition
    });
  }
};

function ModelBufferGeometry(model, options) {
  three.BufferGeometry.call(this);

  /**
   * A reference to the geometry used to create this instance.
   * @type {THREE.Geometry}
   */
  this.modelGeometry = model;

  /**
   * Number of faces of the model.
   * @type {Number}
   */
  this.faceCount = this.modelGeometry.faces.length;

  /**
   * Number of vertices of the model.
   * @type {Number}
   */
  this.vertexCount = this.modelGeometry.vertices.length;

  options = options || {};
  options.computeCentroids && this.computeCentroids();

  this.bufferIndices();
  this.bufferPositions(options.localizeFaces);
}
ModelBufferGeometry.prototype = Object.create(three.BufferGeometry.prototype);
ModelBufferGeometry.prototype.constructor = ModelBufferGeometry;

/**
 * Computes a centroid for each face and stores it in THREE.BAS.ModelBufferGeometry.centroids.
 */
ModelBufferGeometry.prototype.computeCentroids = function () {
  /**
   * An array of centroids corresponding to the faces of the model.
   *
   * @type {Array}
   */
  this.centroids = [];

  for (var i = 0; i < this.faceCount; i++) {
    this.centroids[i] = Utils.computeCentroid(this.modelGeometry, this.modelGeometry.faces[i]);
  }
};

ModelBufferGeometry.prototype.bufferIndices = function () {
  var indexBuffer = new Uint32Array(this.faceCount * 3);

  this.setIndex(new three.BufferAttribute(indexBuffer, 1));

  for (var i = 0, offset = 0; i < this.faceCount; i++, offset += 3) {
    var face = this.modelGeometry.faces[i];

    indexBuffer[offset] = face.a;
    indexBuffer[offset + 1] = face.b;
    indexBuffer[offset + 2] = face.c;
  }
};

ModelBufferGeometry.prototype.bufferPositions = function (localizeFaces) {
  var positionBuffer = this.createAttribute('position', 3).array;
  var i = void 0,
      offset = void 0;

  if (localizeFaces === true) {
    for (i = 0; i < this.faceCount; i++) {
      var face = this.modelGeometry.faces[i];
      var centroid = this.centroids ? this.centroids[i] : THREE.BAS.Utils.computeCentroid(this.modelGeometry, face);

      var a = this.modelGeometry.vertices[face.a];
      var b = this.modelGeometry.vertices[face.b];
      var c = this.modelGeometry.vertices[face.c];

      positionBuffer[face.a * 3] = a.x - centroid.x;
      positionBuffer[face.a * 3 + 1] = a.y - centroid.y;
      positionBuffer[face.a * 3 + 2] = a.z - centroid.z;

      positionBuffer[face.b * 3] = b.x - centroid.x;
      positionBuffer[face.b * 3 + 1] = b.y - centroid.y;
      positionBuffer[face.b * 3 + 2] = b.z - centroid.z;

      positionBuffer[face.c * 3] = c.x - centroid.x;
      positionBuffer[face.c * 3 + 1] = c.y - centroid.y;
      positionBuffer[face.c * 3 + 2] = c.z - centroid.z;
    }
  } else {
    for (i = 0, offset = 0; i < this.vertexCount; i++, offset += 3) {
      var vertex = this.modelGeometry.vertices[i];

      positionBuffer[offset] = vertex.x;
      positionBuffer[offset + 1] = vertex.y;
      positionBuffer[offset + 2] = vertex.z;
    }
  }
};

/**
 * Creates a THREE.BufferAttribute with UV coordinates.
 */
ModelBufferGeometry.prototype.bufferUVs = function () {
  var uvBuffer = this.createAttribute('uv', 2).array;

  for (var i = 0; i < this.faceCount; i++) {

    var face = this.modelGeometry.faces[i];
    var uv = void 0;

    uv = this.modelGeometry.faceVertexUvs[0][i][0];
    uvBuffer[face.a * 2] = uv.x;
    uvBuffer[face.a * 2 + 1] = uv.y;

    uv = this.modelGeometry.faceVertexUvs[0][i][1];
    uvBuffer[face.b * 2] = uv.x;
    uvBuffer[face.b * 2 + 1] = uv.y;

    uv = this.modelGeometry.faceVertexUvs[0][i][2];
    uvBuffer[face.c * 2] = uv.x;
    uvBuffer[face.c * 2 + 1] = uv.y;
  }
};

/**
 * Creates a THREE.BufferAttribute on this geometry instance.
 *
 * @param {String} name Name of the attribute.
 * @param {int} itemSize Number of floats per vertex (typically 1, 2, 3 or 4).
 * @param {function=} factory Function that will be called for each face upon creation. Accepts 3 arguments: data[], index and faceCount. Calls setFaceData.
 *
 * @returns {THREE.BufferAttribute}
 */
ModelBufferGeometry.prototype.createAttribute = function (name, itemSize, factory) {
  var buffer = new Float32Array(this.vertexCount * itemSize);
  var attribute = new THREE.BufferAttribute(buffer, itemSize);

  this.addAttribute(name, attribute);

  if (factory) {
    var data = [];

    for (var i = 0; i < this.faceCount; i++) {
      factory(data, i, this.faceCount);
      this.setFaceData(attribute, i, data);
    }
  }

  return attribute;
};

/**
 * Sets data for all vertices of a face at a given index.
 * Usually called in a loop.
 *
 * @param {String|THREE.BufferAttribute} attribute The attribute or attribute name where the data is to be stored.
 * @param {int} faceIndex Index of the face in the buffer geometry.
 * @param {Array} data Array of data. Length should be equal to item size of the attribute.
 */
ModelBufferGeometry.prototype.setFaceData = function (attribute, faceIndex, data) {
  attribute = typeof attribute === 'string' ? this.attributes[attribute] : attribute;

  var offset = faceIndex * 3 * attribute.itemSize;

  for (var i = 0; i < 3; i++) {
    for (var j = 0; j < attribute.itemSize; j++) {
      attribute.array[offset++] = data[j];
    }
  }
};

function PointBufferGeometry(count) {
  three.BufferGeometry.call(this);

  /**
   * Number of points.
   * @type {Number}
   */
  this.pointCount = count;

  this.bufferPositions();
}
PointBufferGeometry.prototype = Object.create(three.BufferGeometry.prototype);
PointBufferGeometry.prototype.constructor = PointBufferGeometry;

PointBufferGeometry.prototype.bufferPositions = function () {
  this.createAttribute('position', 3);
};

/**
 * Creates a THREE.BufferAttribute on this geometry instance.
 *
 * @param {String} name Name of the attribute.
 * @param {Number} itemSize Number of floats per vertex (typically 1, 2, 3 or 4).
 * @param {function=} factory Function that will be called for each point upon creation. Accepts 3 arguments: data[], index and prefabCount. Calls setPointData.
 *
 * @returns {THREE.BufferAttribute}
 */
PointBufferGeometry.prototype.createAttribute = function (name, itemSize, factory) {
  var buffer = new Float32Array(this.pointCount * itemSize);
  var attribute = new three.BufferAttribute(buffer, itemSize);

  this.addAttribute(name, attribute);

  if (factory) {
    var data = [];
    for (var i = 0; i < this.pointCount; i++) {
      factory(data, i, this.pointCount);
      this.setPointData(attribute, i, data);
    }
  }

  return attribute;
};

PointBufferGeometry.prototype.setPointData = function (attribute, pointIndex, data) {
  attribute = typeof attribute === 'string' ? this.attributes[attribute] : attribute;

  var offset = pointIndex * attribute.itemSize;

  for (var j = 0; j < attribute.itemSize; j++) {
    attribute.array[offset++] = data[j];
  }
};

var catmull_rom_spline = "vec4 catmullRomSpline(vec4 p0, vec4 p1, vec4 p2, vec4 p3, float t, vec2 c) {\n    vec4 v0 = (p2 - p0) * c.x;\n    vec4 v1 = (p3 - p1) * c.y;\n    float t2 = t * t;\n    float t3 = t * t * t;\n    return vec4((2.0 * p1 - 2.0 * p2 + v0 + v1) * t3 + (-3.0 * p1 + 3.0 * p2 - 2.0 * v0 - v1) * t2 + v0 * t + p1);\n}\nvec4 catmullRomSpline(vec4 p0, vec4 p1, vec4 p2, vec4 p3, float t) {\n    return catmullRomSpline(p0, p1, p2, p3, t, vec2(0.5, 0.5));\n}\nvec3 catmullRomSpline(vec3 p0, vec3 p1, vec3 p2, vec3 p3, float t, vec2 c) {\n    vec3 v0 = (p2 - p0) * c.x;\n    vec3 v1 = (p3 - p1) * c.y;\n    float t2 = t * t;\n    float t3 = t * t * t;\n    return vec3((2.0 * p1 - 2.0 * p2 + v0 + v1) * t3 + (-3.0 * p1 + 3.0 * p2 - 2.0 * v0 - v1) * t2 + v0 * t + p1);\n}\nvec3 catmullRomSpline(vec3 p0, vec3 p1, vec3 p2, vec3 p3, float t) {\n    return catmullRomSpline(p0, p1, p2, p3, t, vec2(0.5, 0.5));\n}\nvec2 catmullRomSpline(vec2 p0, vec2 p1, vec2 p2, vec2 p3, float t, vec2 c) {\n    vec2 v0 = (p2 - p0) * c.x;\n    vec2 v1 = (p3 - p1) * c.y;\n    float t2 = t * t;\n    float t3 = t * t * t;\n    return vec2((2.0 * p1 - 2.0 * p2 + v0 + v1) * t3 + (-3.0 * p1 + 3.0 * p2 - 2.0 * v0 - v1) * t2 + v0 * t + p1);\n}\nvec2 catmullRomSpline(vec2 p0, vec2 p1, vec2 p2, vec2 p3, float t) {\n    return catmullRomSpline(p0, p1, p2, p3, t, vec2(0.5, 0.5));\n}\nfloat catmullRomSpline(float p0, float p1, float p2, float p3, float t, vec2 c) {\n    float v0 = (p2 - p0) * c.x;\n    float v1 = (p3 - p1) * c.y;\n    float t2 = t * t;\n    float t3 = t * t * t;\n    return float((2.0 * p1 - 2.0 * p2 + v0 + v1) * t3 + (-3.0 * p1 + 3.0 * p2 - 2.0 * v0 - v1) * t2 + v0 * t + p1);\n}\nfloat catmullRomSpline(float p0, float p1, float p2, float p3, float t) {\n    return catmullRomSpline(p0, p1, p2, p3, t, vec2(0.5, 0.5));\n}\nivec4 getCatmullRomSplineIndices(float l, float p) {\n    float index = floor(p);\n    int i0 = int(max(0.0, index - 1.0));\n    int i1 = int(index);\n    int i2 = int(min(index + 1.0, l));\n    int i3 = int(min(index + 2.0, l));\n    return ivec4(i0, i1, i2, i3);\n}\nivec4 getCatmullRomSplineIndicesClosed(float l, float p) {\n    float index = floor(p);\n    int i0 = int(index == 0.0 ? l : index - 1.0);\n    int i1 = int(index);\n    int i2 = int(mod(index + 1.0, l));\n    int i3 = int(mod(index + 2.0, l));\n    return ivec4(i0, i1, i2, i3);\n}\n";

var cubic_bezier = "vec3 cubicBezier(vec3 p0, vec3 c0, vec3 c1, vec3 p1, float t) {\n    float tn = 1.0 - t;\n    return tn * tn * tn * p0 + 3.0 * tn * tn * t * c0 + 3.0 * tn * t * t * c1 + t * t * t * p1;\n}\nvec2 cubicBezier(vec2 p0, vec2 c0, vec2 c1, vec2 p1, float t) {\n    float tn = 1.0 - t;\n    return tn * tn * tn * p0 + 3.0 * tn * tn * t * c0 + 3.0 * tn * t * t * c1 + t * t * t * p1;\n}\n";

var ease_back_in = "float easeBackIn(float p, float amplitude) {\n    return p * p * ((amplitude + 1.0) * p - amplitude);\n}\nfloat easeBackIn(float p) {\n    return easeBackIn(p, 1.70158);\n}\nfloat easeBackIn(float t, float b, float c, float d, float amplitude) {\n    return b + easeBackIn(t / d, amplitude) * c;\n}\nfloat easeBackIn(float t, float b, float c, float d) {\n    return b + easeBackIn(t / d) * c;\n}\n";

var ease_back_in_out = "float easeBackInOut(float p, float amplitude) {\n    amplitude *= 1.525;\n    return ((p *= 2.0) < 1.0) ? 0.5 * p * p * ((amplitude + 1.0) * p - amplitude) : 0.5 * ((p -= 2.0) * p * ((amplitude + 1.0) * p + amplitude) + 2.0);\n}\nfloat easeBackInOut(float p) {\n    return easeBackInOut(p, 1.70158);\n}\nfloat easeBackInOut(float t, float b, float c, float d, float amplitude) {\n    return b + easeBackInOut(t / d, amplitude) * c;\n}\nfloat easeBackInOut(float t, float b, float c, float d) {\n    return b + easeBackInOut(t / d) * c;\n}\n";

var ease_back_out = "float easeBackOut(float p, float amplitude) {\n    return ((p = p - 1.0) * p * ((amplitude + 1.0) * p + amplitude) + 1.0);\n}\nfloat easeBackOut(float p) {\n    return easeBackOut(p, 1.70158);\n}\nfloat easeBackOut(float t, float b, float c, float d, float amplitude) {\n    return b + easeBackOut(t / d, amplitude) * c;\n}\nfloat easeBackOut(float t, float b, float c, float d) {\n    return b + easeBackOut(t / d) * c;\n}\n";

var ease_bezier = "float easeBezier(float p, vec4 curve) {\n    float ip = 1.0 - p;\n    return (3.0 * ip * ip * p * curve.xy + 3.0 * ip * p * p * curve.zw + p * p * p).y;\n}\nfloat easeBezier(float t, float b, float c, float d, vec4 curve) {\n    return b + easeBezier(t / d, curve) * c;\n}\n";

var ease_bounce_in = "float easeBounceIn(float p) {\n    if ((p = 1.0 - p) < 1.0 / 2.75) {\n        return 1.0 - (7.5625 * p * p);\n    } else if (p < 2.0 / 2.75) {\n        return 1.0 - (7.5625 * (p -= 1.5 / 2.75) * p + 0.75);\n    } else if (p < 2.5 / 2.75) {\n        return 1.0 - (7.5625 * (p -= 2.25 / 2.75) * p + 0.9375);\n    }\n    return 1.0 - (7.5625 * (p -= 2.625 / 2.75) * p + 0.984375);\n}\nfloat easeBounceIn(float t, float b, float c, float d) {\n    return b + easeBounceIn(t / d) * c;\n}\n";

var ease_bounce_in_out = "float easeBounceInOut(float p) {\n    bool invert = (p < 0.5);\n    p = invert ? (1.0 - (p * 2.0)) : ((p * 2.0) - 1.0);\n    if (p < 1.0 / 2.75) {\n        p = 7.5625 * p * p;\n    } else if (p < 2.0 / 2.75) {\n        p = 7.5625 * (p -= 1.5 / 2.75) * p + 0.75;\n    } else if (p < 2.5 / 2.75) {\n        p = 7.5625 * (p -= 2.25 / 2.75) * p + 0.9375;\n    } else {\n        p = 7.5625 * (p -= 2.625 / 2.75) * p + 0.984375;\n    }\n    return invert ? (1.0 - p) * 0.5 : p * 0.5 + 0.5;\n}\nfloat easeBounceInOut(float t, float b, float c, float d) {\n    return b + easeBounceInOut(t / d) * c;\n}\n";

var ease_bounce_out = "float easeBounceOut(float p) {\n    if (p < 1.0 / 2.75) {\n        return 7.5625 * p * p;\n    } else if (p < 2.0 / 2.75) {\n        return 7.5625 * (p -= 1.5 / 2.75) * p + 0.75;\n    } else if (p < 2.5 / 2.75) {\n        return 7.5625 * (p -= 2.25 / 2.75) * p + 0.9375;\n    }\n    return 7.5625 * (p -= 2.625 / 2.75) * p + 0.984375;\n}\nfloat easeBounceOut(float t, float b, float c, float d) {\n    return b + easeBounceOut(t / d) * c;\n}\n";

var ease_circ_in = "float easeCircIn(float p) {\n    return -(sqrt(1.0 - p * p) - 1.0);\n}\nfloat easeCircIn(float t, float b, float c, float d) {\n    return b + easeCircIn(t / d) * c;\n}\n";

var ease_circ_in_out = "float easeCircInOut(float p) {\n    return ((p *= 2.0) < 1.0) ? -0.5 * (sqrt(1.0 - p * p) - 1.0) : 0.5 * (sqrt(1.0 - (p -= 2.0) * p) + 1.0);\n}\nfloat easeCircInOut(float t, float b, float c, float d) {\n    return b + easeCircInOut(t / d) * c;\n}\n";

var ease_circ_out = "float easeCircOut(float p) {\n  return sqrt(1.0 - (p = p - 1.0) * p);\n}\nfloat easeCircOut(float t, float b, float c, float d) {\n  return b + easeCircOut(t / d) * c;\n}\n";

var ease_cubic_in = "float easeCubicIn(float t) {\n  return t * t * t;\n}\nfloat easeCubicIn(float t, float b, float c, float d) {\n  return b + easeCubicIn(t / d) * c;\n}\n";

var ease_cubic_in_out = "float easeCubicInOut(float t) {\n  return (t /= 0.5) < 1.0 ? 0.5 * t * t * t : 0.5 * ((t-=2.0) * t * t + 2.0);\n}\nfloat easeCubicInOut(float t, float b, float c, float d) {\n  return b + easeCubicInOut(t / d) * c;\n}\n";

var ease_cubic_out = "float easeCubicOut(float t) {\n  float f = t - 1.0;\n  return f * f * f + 1.0;\n}\nfloat easeCubicOut(float t, float b, float c, float d) {\n  return b + easeCubicOut(t / d) * c;\n}\n";

var ease_elastic_in = "float easeElasticIn(float p, float amplitude, float period) {\n    float p1 = max(amplitude, 1.0);\n    float p2 = period / min(amplitude, 1.0);\n    float p3 = p2 / PI2 * (asin(1.0 / p1));\n    return -(p1 * pow(2.0, 10.0 * (p -= 1.0)) * sin((p - p3) * PI2 / p2));\n}\nfloat easeElasticIn(float p) {\n    return easeElasticIn(p, 1.0, 0.3);\n}\nfloat easeElasticIn(float t, float b, float c, float d, float amplitude, float period) {\n    return b + easeElasticIn(t / d, amplitude, period) * c;\n}\nfloat easeElasticIn(float t, float b, float c, float d) {\n    return b + easeElasticIn(t / d) * c;\n}\n";

var ease_elastic_in_out = "float easeElasticInOut(float p, float amplitude, float period) {\n    float p1 = max(amplitude, 1.0);\n    float p2 = period / min(amplitude, 1.0);\n    float p3 = p2 / PI2 * (asin(1.0 / p1));\n    return ((p *= 2.0) < 1.0) ? -0.5 * (p1 * pow(2.0, 10.0 * (p -= 1.0)) * sin((p - p3) * PI2 / p2)) : p1 * pow(2.0, -10.0 * (p -= 1.0)) * sin((p - p3) * PI2 / p2) * 0.5 + 1.0;\n}\nfloat easeElasticInOut(float p) {\n    return easeElasticInOut(p, 1.0, 0.3);\n}\nfloat easeElasticInOut(float t, float b, float c, float d, float amplitude, float period) {\n    return b + easeElasticInOut(t / d, amplitude, period) * c;\n}\nfloat easeElasticInOut(float t, float b, float c, float d) {\n    return b + easeElasticInOut(t / d) * c;\n}\n";

var ease_elastic_out = "float easeElasticOut(float p, float amplitude, float period) {\n    float p1 = max(amplitude, 1.0);\n    float p2 = period / min(amplitude, 1.0);\n    float p3 = p2 / PI2 * (asin(1.0 / p1));\n    return p1 * pow(2.0, -10.0 * p) * sin((p - p3) * PI2 / p2) + 1.0;\n}\nfloat easeElasticOut(float p) {\n    return easeElasticOut(p, 1.0, 0.3);\n}\nfloat easeElasticOut(float t, float b, float c, float d, float amplitude, float period) {\n    return b + easeElasticOut(t / d, amplitude, period) * c;\n}\nfloat easeElasticOut(float t, float b, float c, float d) {\n    return b + easeElasticOut(t / d) * c;\n}\n";

var ease_expo_in = "float easeExpoIn(float p) {\n    return pow(2.0, 10.0 * (p - 1.0));\n}\nfloat easeExpoIn(float t, float b, float c, float d) {\n    return b + easeExpoIn(t / d) * c;\n}\n";

var ease_expo_in_out = "float easeExpoInOut(float p) {\n    return ((p *= 2.0) < 1.0) ? 0.5 * pow(2.0, 10.0 * (p - 1.0)) : 0.5 * (2.0 - pow(2.0, -10.0 * (p - 1.0)));\n}\nfloat easeExpoInOut(float t, float b, float c, float d) {\n    return b + easeExpoInOut(t / d) * c;\n}\n";

var ease_expo_out = "float easeExpoOut(float p) {\n  return 1.0 - pow(2.0, -10.0 * p);\n}\nfloat easeExpoOut(float t, float b, float c, float d) {\n  return b + easeExpoOut(t / d) * c;\n}\n";

var ease_quad_in = "float easeQuadIn(float t) {\n    return t * t;\n}\nfloat easeQuadIn(float t, float b, float c, float d) {\n  return b + easeQuadIn(t / d) * c;\n}\n";

var ease_quad_in_out = "float easeQuadInOut(float t) {\n    float p = 2.0 * t * t;\n    return t < 0.5 ? p : -p + (4.0 * t) - 1.0;\n}\nfloat easeQuadInOut(float t, float b, float c, float d) {\n    return b + easeQuadInOut(t / d) * c;\n}\n";

var ease_quad_out = "float easeQuadOut(float t) {\n  return -t * (t - 2.0);\n}\nfloat easeQuadOut(float t, float b, float c, float d) {\n  return b + easeQuadOut(t / d) * c;\n}\n";

var ease_quart_in = "float easeQuartIn(float t) {\n  return t * t * t * t;\n}\nfloat easeQuartIn(float t, float b, float c, float d) {\n  return b + easeQuartIn(t / d) * c;\n}\n";

var ease_quart_in_out = "float easeQuartInOut(float t) {\n    return t < 0.5 ? 8.0 * pow(t, 4.0) : -8.0 * pow(t - 1.0, 4.0) + 1.0;\n}\nfloat easeQuartInOut(float t, float b, float c, float d) {\n    return b + easeQuartInOut(t / d) * c;\n}\n";

var ease_quart_out = "float easeQuartOut(float t) {\n  return 1.0 - pow(1.0 - t, 4.0);\n}\nfloat easeQuartOut(float t, float b, float c, float d) {\n  return b + easeQuartOut(t / d) * c;\n}\n";

var ease_quint_in = "float easeQuintIn(float t) {\n    return pow(t, 5.0);\n}\nfloat easeQuintIn(float t, float b, float c, float d) {\n    return b + easeQuintIn(t / d) * c;\n}\n";

var ease_quint_in_out = "float easeQuintInOut(float t) {\n    return (t /= 0.5) < 1.0 ? 0.5 * t * t * t * t * t : 0.5 * ((t -= 2.0) * t * t * t * t + 2.0);\n}\nfloat easeQuintInOut(float t, float b, float c, float d) {\n    return b + easeQuintInOut(t / d) * c;\n}\n";

var ease_quint_out = "float easeQuintOut(float t) {\n    return (t -= 1.0) * t * t * t * t + 1.0;\n}\nfloat easeQuintOut(float t, float b, float c, float d) {\n    return b + easeQuintOut(t / d) * c;\n}\n";

var ease_sine_in = "float easeSineIn(float p) {\n  return -cos(p * 1.57079632679) + 1.0;\n}\nfloat easeSineIn(float t, float b, float c, float d) {\n  return b + easeSineIn(t / d) * c;\n}\n";

var ease_sine_in_out = "float easeSineInOut(float p) {\n  return -0.5 * (cos(PI * p) - 1.0);\n}\nfloat easeSineInOut(float t, float b, float c, float d) {\n  return b + easeSineInOut(t / d) * c;\n}\n";

var ease_sine_out = "float easeSineOut(float p) {\n  return sin(p * 1.57079632679);\n}\nfloat easeSineOut(float t, float b, float c, float d) {\n  return b + easeSineOut(t / d) * c;\n}\n";

var quaternion_rotation = "vec3 rotateVector(vec4 q, vec3 v) {\n    return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v);\n}\nvec4 quatFromAxisAngle(vec3 axis, float angle) {\n    float halfAngle = angle * 0.5;\n    return vec4(axis.xyz * sin(halfAngle), cos(halfAngle));\n}\n";

var quaternion_slerp = "vec4 quatSlerp(vec4 q0, vec4 q1, float t) {\n    float s = 1.0 - t;\n    float c = dot(q0, q1);\n    float dir = -1.0;    float sqrSn = 1.0 - c * c;\n    if (sqrSn > 2.220446049250313e-16) {\n        float sn = sqrt(sqrSn);\n        float len = atan(sn, c * dir);\n        s = sin(s * len) / sn;\n        t = sin(t * len) / sn;\n    }\n    float tDir = t * dir;\n    return normalize(q0 * s + q1 * tDir);\n}\n";

// generated by scripts/build_shader_chunks.js

var ShaderChunk = {
  catmull_rom_spline: catmull_rom_spline,
  cubic_bezier: cubic_bezier,
  ease_back_in: ease_back_in,
  ease_back_in_out: ease_back_in_out,
  ease_back_out: ease_back_out,
  ease_bezier: ease_bezier,
  ease_bounce_in: ease_bounce_in,
  ease_bounce_in_out: ease_bounce_in_out,
  ease_bounce_out: ease_bounce_out,
  ease_circ_in: ease_circ_in,
  ease_circ_in_out: ease_circ_in_out,
  ease_circ_out: ease_circ_out,
  ease_cubic_in: ease_cubic_in,
  ease_cubic_in_out: ease_cubic_in_out,
  ease_cubic_out: ease_cubic_out,
  ease_elastic_in: ease_elastic_in,
  ease_elastic_in_out: ease_elastic_in_out,
  ease_elastic_out: ease_elastic_out,
  ease_expo_in: ease_expo_in,
  ease_expo_in_out: ease_expo_in_out,
  ease_expo_out: ease_expo_out,
  ease_quad_in: ease_quad_in,
  ease_quad_in_out: ease_quad_in_out,
  ease_quad_out: ease_quad_out,
  ease_quart_in: ease_quart_in,
  ease_quart_in_out: ease_quart_in_out,
  ease_quart_out: ease_quart_out,
  ease_quint_in: ease_quint_in,
  ease_quint_in_out: ease_quint_in_out,
  ease_quint_out: ease_quint_out,
  ease_sine_in: ease_sine_in,
  ease_sine_in_out: ease_sine_in_out,
  ease_sine_out: ease_sine_out,
  quaternion_rotation: quaternion_rotation,
  quaternion_slerp: quaternion_slerp

};

/**
 * A timeline transition segment. An instance of this class is created internally when calling {@link THREE.BAS.Timeline.add}, so you should not use this class directly.
 * The instance is also passed the the compiler function if you register a transition through {@link THREE.BAS.Timeline.register}. There you can use the public properties of the segment to compile the glsl string.
 * @param {string} key A string key generated by the timeline to which this segment belongs. Keys are unique.
 * @param {number} start Start time of this segment in a timeline in seconds.
 * @param {number} duration Duration of this segment in seconds.
 * @param {object} transition Object describing the transition.
 * @param {function} compiler A reference to the compiler function from a transition definition.
 * @constructor
 */
function TimelineSegment(key, start, duration, transition, compiler) {
  this.key = key;
  this.start = start;
  this.duration = duration;
  this.transition = transition;
  this.compiler = compiler;

  this.trail = 0;
}

TimelineSegment.prototype.compile = function () {
  return this.compiler(this);
};

Object.defineProperty(TimelineSegment.prototype, 'end', {
  get: function get() {
    return this.start + this.duration;
  }
});

function Timeline() {
  /**
   * The total duration of the timeline in seconds.
   * @type {number}
   */
  this.duration = 0;

  /**
   * The name of the value that segments will use to read the time. Defaults to 'tTime'.
   * @type {string}
   */
  this.timeKey = 'tTime';

  this.segments = {};
  this.__key = 0;
}

// static definitions map
Timeline.segmentDefinitions = {};

/**
 * Registers a transition definition for use with {@link THREE.BAS.Timeline.add}.
 * @param {String} key Name of the transition. Defaults include 'scale', 'rotate' and 'translate'.
 * @param {Object} definition
 * @param {Function} definition.compiler A function that generates a glsl string for a transition segment. Accepts a THREE.BAS.TimelineSegment as the sole argument.
 * @param {*} definition.defaultFrom The initial value for a transform.from. For example, the defaultFrom for a translation is THREE.Vector3(0, 0, 0).
 * @static
 */
Timeline.register = function (key, definition) {
  Timeline.segmentDefinitions[key] = definition;

  return definition;
};

/**
 * Add a transition to the timeline.
 * @param {number} duration Duration in seconds
 * @param {object} transitions An object containing one or several transitions. The keys should match transform definitions.
 * The transition object for each key will be passed to the matching definition's compiler. It can have arbitrary properties, but the Timeline expects at least a 'to', 'from' and an optional 'ease'.
 * @param {number|string} [positionOffset] Position in the timeline. Defaults to the end of the timeline. If a number is provided, the transition will be inserted at that time in seconds. Strings ('+=x' or '-=x') can be used for a value relative to the end of timeline.
 */
Timeline.prototype.add = function (duration, transitions, positionOffset) {
  // stop rollup from complaining about eval
  var _eval = eval;

  var start = this.duration;

  if (positionOffset !== undefined) {
    if (typeof positionOffset === 'number') {
      start = positionOffset;
    } else if (typeof positionOffset === 'string') {
      _eval('start' + positionOffset);
    }

    this.duration = Math.max(this.duration, start + duration);
  } else {
    this.duration += duration;
  }

  var keys = Object.keys(transitions),
      key = void 0;

  for (var i = 0; i < keys.length; i++) {
    key = keys[i];

    this.processTransition(key, transitions[key], start, duration);
  }
};

Timeline.prototype.processTransition = function (key, transition, start, duration) {
  var definition = Timeline.segmentDefinitions[key];

  var segments = this.segments[key];
  if (!segments) segments = this.segments[key] = [];

  if (transition.from === undefined) {
    if (segments.length === 0) {
      transition.from = definition.defaultFrom;
    } else {
      transition.from = segments[segments.length - 1].transition.to;
    }
  }

  segments.push(new TimelineSegment((this.__key++).toString(), start, duration, transition, definition.compiler));
};

/**
 * Compiles the timeline into a glsl string array that can be injected into a (vertex) shader.
 * @returns {Array}
 */
Timeline.prototype.compile = function () {
  var c = [];

  var keys = Object.keys(this.segments);
  var segments = void 0;

  for (var i = 0; i < keys.length; i++) {
    segments = this.segments[keys[i]];

    this.fillGaps(segments);

    segments.forEach(function (s) {
      c.push(s.compile());
    });
  }

  return c;
};
Timeline.prototype.fillGaps = function (segments) {
  if (segments.length === 0) return;

  var s0 = void 0,
      s1 = void 0;

  for (var i = 0; i < segments.length - 1; i++) {
    s0 = segments[i];
    s1 = segments[i + 1];

    s0.trail = s1.start - s0.end;
  }

  // pad last segment until end of timeline
  s0 = segments[segments.length - 1];
  s0.trail = this.duration - s0.end;
};

/**
 * Get a compiled glsl string with calls to transform functions for a given key.
 * The order in which these transitions are applied matters because they all operate on the same value.
 * @param {string} key A key matching a transform definition.
 * @returns {string}
 */
Timeline.prototype.getTransformCalls = function (key) {
  var t = this.timeKey;

  return this.segments[key] ? this.segments[key].map(function (s) {
    return 'applyTransform' + s.key + '(' + t + ', transformed);';
  }).join('\n') : '';
};

var TimelineChunks = {
  vec3: function vec3(n, v, p) {
    var x = (v.x || 0).toPrecision(p);
    var y = (v.y || 0).toPrecision(p);
    var z = (v.z || 0).toPrecision(p);

    return "vec3 " + n + " = vec3(" + x + ", " + y + ", " + z + ");";
  },
  vec4: function vec4(n, v, p) {
    var x = (v.x || 0).toPrecision(p);
    var y = (v.y || 0).toPrecision(p);
    var z = (v.z || 0).toPrecision(p);
    var w = (v.w || 0).toPrecision(p);

    return "vec4 " + n + " = vec4(" + x + ", " + y + ", " + z + ", " + w + ");";
  },
  delayDuration: function delayDuration(segment) {
    return "\n    float cDelay" + segment.key + " = " + segment.start.toPrecision(4) + ";\n    float cDuration" + segment.key + " = " + segment.duration.toPrecision(4) + ";\n    ";
  },
  progress: function progress(segment) {
    // zero duration segments should always render complete
    if (segment.duration === 0) {
      return "float progress = 1.0;";
    } else {
      return "\n      float progress = clamp(time - cDelay" + segment.key + ", 0.0, cDuration" + segment.key + ") / cDuration" + segment.key + ";\n      " + (segment.transition.ease ? "progress = " + segment.transition.ease + "(progress" + (segment.transition.easeParams ? ", " + segment.transition.easeParams.map(function (v) {
        return v.toPrecision(4);
      }).join(", ") : "") + ");" : "") + "\n      ";
    }
  },
  renderCheck: function renderCheck(segment) {
    var startTime = segment.start.toPrecision(4);
    var endTime = (segment.end + segment.trail).toPrecision(4);

    return "if (time < " + startTime + " || time > " + endTime + ") return;";
  }
};

var TranslationSegment = {
  compiler: function compiler(segment) {
    return '\n    ' + TimelineChunks.delayDuration(segment) + '\n    ' + TimelineChunks.vec3('cTranslateFrom' + segment.key, segment.transition.from, 2) + '\n    ' + TimelineChunks.vec3('cTranslateTo' + segment.key, segment.transition.to, 2) + '\n    \n    void applyTransform' + segment.key + '(float time, inout vec3 v) {\n    \n      ' + TimelineChunks.renderCheck(segment) + '\n      ' + TimelineChunks.progress(segment) + '\n    \n      v += mix(cTranslateFrom' + segment.key + ', cTranslateTo' + segment.key + ', progress);\n    }\n    ';
  },
  defaultFrom: new three.Vector3(0, 0, 0)
};

Timeline.register('translate', TranslationSegment);

var ScaleSegment = {
  compiler: function compiler(segment) {
    var origin = segment.transition.origin;

    return '\n    ' + TimelineChunks.delayDuration(segment) + '\n    ' + TimelineChunks.vec3('cScaleFrom' + segment.key, segment.transition.from, 2) + '\n    ' + TimelineChunks.vec3('cScaleTo' + segment.key, segment.transition.to, 2) + '\n    ' + (origin ? TimelineChunks.vec3('cOrigin' + segment.key, origin, 2) : '') + '\n    \n    void applyTransform' + segment.key + '(float time, inout vec3 v) {\n    \n      ' + TimelineChunks.renderCheck(segment) + '\n      ' + TimelineChunks.progress(segment) + '\n    \n      ' + (origin ? 'v -= cOrigin' + segment.key + ';' : '') + '\n      v *= mix(cScaleFrom' + segment.key + ', cScaleTo' + segment.key + ', progress);\n      ' + (origin ? 'v += cOrigin' + segment.key + ';' : '') + '\n    }\n    ';
  },
  defaultFrom: new three.Vector3(1, 1, 1)
};

Timeline.register('scale', ScaleSegment);

var RotationSegment = {
  compiler: function compiler(segment) {
    var fromAxisAngle = new three.Vector4(segment.transition.from.axis.x, segment.transition.from.axis.y, segment.transition.from.axis.z, segment.transition.from.angle);

    var toAxis = segment.transition.to.axis || segment.transition.from.axis;
    var toAxisAngle = new three.Vector4(toAxis.x, toAxis.y, toAxis.z, segment.transition.to.angle);

    var origin = segment.transition.origin;

    return '\n    ' + TimelineChunks.delayDuration(segment) + '\n    ' + TimelineChunks.vec4('cRotationFrom' + segment.key, fromAxisAngle, 8) + '\n    ' + TimelineChunks.vec4('cRotationTo' + segment.key, toAxisAngle, 8) + '\n    ' + (origin ? TimelineChunks.vec3('cOrigin' + segment.key, origin, 2) : '') + '\n    \n    void applyTransform' + segment.key + '(float time, inout vec3 v) {\n      ' + TimelineChunks.renderCheck(segment) + '\n      ' + TimelineChunks.progress(segment) + '\n\n      ' + (origin ? 'v -= cOrigin' + segment.key + ';' : '') + '\n      vec3 axis = normalize(mix(cRotationFrom' + segment.key + '.xyz, cRotationTo' + segment.key + '.xyz, progress));\n      float angle = mix(cRotationFrom' + segment.key + '.w, cRotationTo' + segment.key + '.w, progress);\n      vec4 q = quatFromAxisAngle(axis, angle);\n      v = rotateVector(q, v);\n      ' + (origin ? 'v += cOrigin' + segment.key + ';' : '') + '\n    }\n    ';
  },

  defaultFrom: { axis: new three.Vector3(), angle: 0 }
};

Timeline.register('rotate', RotationSegment);

exports.BasicAnimationMaterial = BasicAnimationMaterial;
exports.LambertAnimationMaterial = LambertAnimationMaterial;
exports.PhongAnimationMaterial = PhongAnimationMaterial;
exports.StandardAnimationMaterial = StandardAnimationMaterial;
exports.PointsAnimationMaterial = PointsAnimationMaterial;
exports.DepthAnimationMaterial = DepthAnimationMaterial;
exports.DistanceAnimationMaterial = DistanceAnimationMaterial;
exports.PrefabBufferGeometry = PrefabBufferGeometry;
exports.MultiPrefabBufferGeometry = MultiPrefabBufferGeometry;
exports.ModelBufferGeometry = ModelBufferGeometry;
exports.PointBufferGeometry = PointBufferGeometry;
exports.ShaderChunk = ShaderChunk;
exports.Timeline = Timeline;
exports.TimelineSegment = TimelineSegment;
exports.TimelineChunks = TimelineChunks;
exports.TranslationSegment = TranslationSegment;
exports.ScaleSegment = ScaleSegment;
exports.RotationSegment = RotationSegment;
exports.Utils = Utils;

Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzLmpzIiwic291cmNlcyI6WyIuLi9zcmMvbWF0ZXJpYWxzL0Jhc2VBbmltYXRpb25NYXRlcmlhbC5qcyIsIi4uL3NyYy9tYXRlcmlhbHMvQmFzaWNBbmltYXRpb25NYXRlcmlhbC5qcyIsIi4uL3NyYy9tYXRlcmlhbHMvTGFtYmVydEFuaW1hdGlvbk1hdGVyaWFsLmpzIiwiLi4vc3JjL21hdGVyaWFscy9QaG9uZ0FuaW1hdGlvbk1hdGVyaWFsLmpzIiwiLi4vc3JjL21hdGVyaWFscy9TdGFuZGFyZEFuaW1hdGlvbk1hdGVyaWFsLmpzIiwiLi4vc3JjL21hdGVyaWFscy9Qb2ludHNBbmltYXRpb25NYXRlcmlhbC5qcyIsIi4uL3NyYy9tYXRlcmlhbHMvRGVwdGhBbmltYXRpb25NYXRlcmlhbC5qcyIsIi4uL3NyYy9tYXRlcmlhbHMvRGlzdGFuY2VBbmltYXRpb25NYXRlcmlhbC5qcyIsIi4uL3NyYy9nZW9tZXRyeS9QcmVmYWJCdWZmZXJHZW9tZXRyeS5qcyIsIi4uL3NyYy9nZW9tZXRyeS9NdWx0aVByZWZhYkJ1ZmZlckdlb21ldHJ5LmpzIiwiLi4vc3JjL1V0aWxzLmpzIiwiLi4vc3JjL2dlb21ldHJ5L01vZGVsQnVmZmVyR2VvbWV0cnkuanMiLCIuLi9zcmMvZ2VvbWV0cnkvUG9pbnRCdWZmZXJHZW9tZXRyeS5qcyIsIi4uL3NyYy9TaGFkZXJDaHVuay5qcyIsIi4uL3NyYy90aW1lbGluZS9UaW1lbGluZVNlZ21lbnQuanMiLCIuLi9zcmMvdGltZWxpbmUvVGltZWxpbmUuanMiLCIuLi9zcmMvdGltZWxpbmUvVGltZWxpbmVDaHVua3MuanMiLCIuLi9zcmMvdGltZWxpbmUvVHJhbnNsYXRpb25TZWdtZW50LmpzIiwiLi4vc3JjL3RpbWVsaW5lL1NjYWxlU2VnbWVudC5qcyIsIi4uL3NyYy90aW1lbGluZS9Sb3RhdGlvblNlZ21lbnQuanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgU2hhZGVyTWF0ZXJpYWwsXG4gIFVuaWZvcm1zVXRpbHMsXG4gIEN1YmVSZWZsZWN0aW9uTWFwcGluZyxcbiAgQ3ViZVJlZnJhY3Rpb25NYXBwaW5nLFxuICBDdWJlVVZSZWZsZWN0aW9uTWFwcGluZyxcbiAgQ3ViZVVWUmVmcmFjdGlvbk1hcHBpbmcsXG4gIEVxdWlyZWN0YW5ndWxhclJlZmxlY3Rpb25NYXBwaW5nLFxuICBFcXVpcmVjdGFuZ3VsYXJSZWZyYWN0aW9uTWFwcGluZyxcbiAgU3BoZXJpY2FsUmVmbGVjdGlvbk1hcHBpbmcsXG4gIE1peE9wZXJhdGlvbixcbiAgQWRkT3BlcmF0aW9uLFxuICBNdWx0aXBseU9wZXJhdGlvblxufSBmcm9tICd0aHJlZSc7XG5cbmZ1bmN0aW9uIEJhc2VBbmltYXRpb25NYXRlcmlhbChwYXJhbWV0ZXJzLCB1bmlmb3Jtcykge1xuICBTaGFkZXJNYXRlcmlhbC5jYWxsKHRoaXMpO1xuICBcbiAgY29uc3QgdW5pZm9ybVZhbHVlcyA9IHBhcmFtZXRlcnMudW5pZm9ybVZhbHVlcztcbiAgZGVsZXRlIHBhcmFtZXRlcnMudW5pZm9ybVZhbHVlcztcbiAgXG4gIHRoaXMuc2V0VmFsdWVzKHBhcmFtZXRlcnMpO1xuICBcbiAgdGhpcy51bmlmb3JtcyA9IFVuaWZvcm1zVXRpbHMubWVyZ2UoW3VuaWZvcm1zLCB0aGlzLnVuaWZvcm1zXSk7XG4gIFxuICB0aGlzLnNldFVuaWZvcm1WYWx1ZXModW5pZm9ybVZhbHVlcyk7XG4gIFxuICBpZiAodW5pZm9ybVZhbHVlcykge1xuICAgIHVuaWZvcm1WYWx1ZXMubWFwICYmICh0aGlzLmRlZmluZXNbJ1VTRV9NQVAnXSA9ICcnKTtcbiAgICB1bmlmb3JtVmFsdWVzLm5vcm1hbE1hcCAmJiAodGhpcy5kZWZpbmVzWydVU0VfTk9STUFMTUFQJ10gPSAnJyk7XG4gICAgdW5pZm9ybVZhbHVlcy5lbnZNYXAgJiYgKHRoaXMuZGVmaW5lc1snVVNFX0VOVk1BUCddID0gJycpO1xuICAgIHVuaWZvcm1WYWx1ZXMuYW9NYXAgJiYgKHRoaXMuZGVmaW5lc1snVVNFX0FPTUFQJ10gPSAnJyk7XG4gICAgdW5pZm9ybVZhbHVlcy5zcGVjdWxhck1hcCAmJiAodGhpcy5kZWZpbmVzWydVU0VfU1BFQ1VMQVJNQVAnXSA9ICcnKTtcbiAgICB1bmlmb3JtVmFsdWVzLmFscGhhTWFwICYmICh0aGlzLmRlZmluZXNbJ1VTRV9BTFBIQU1BUCddID0gJycpO1xuICAgIHVuaWZvcm1WYWx1ZXMubGlnaHRNYXAgJiYgKHRoaXMuZGVmaW5lc1snVVNFX0xJR0hUTUFQJ10gPSAnJyk7XG4gICAgdW5pZm9ybVZhbHVlcy5lbWlzc2l2ZU1hcCAmJiAodGhpcy5kZWZpbmVzWydVU0VfRU1JU1NJVkVNQVAnXSA9ICcnKTtcbiAgICB1bmlmb3JtVmFsdWVzLmJ1bXBNYXAgJiYgKHRoaXMuZGVmaW5lc1snVVNFX0JVTVBNQVAnXSA9ICcnKTtcbiAgICB1bmlmb3JtVmFsdWVzLmRpc3BsYWNlbWVudE1hcCAmJiAodGhpcy5kZWZpbmVzWydVU0VfRElTUExBQ0VNRU5UTUFQJ10gPSAnJyk7XG4gICAgdW5pZm9ybVZhbHVlcy5yb3VnaG5lc3NNYXAgJiYgKHRoaXMuZGVmaW5lc1snVVNFX0RJU1BMQUNFTUVOVE1BUCddID0gJycpO1xuICAgIHVuaWZvcm1WYWx1ZXMucm91Z2huZXNzTWFwICYmICh0aGlzLmRlZmluZXNbJ1VTRV9ST1VHSE5FU1NNQVAnXSA9ICcnKTtcbiAgICB1bmlmb3JtVmFsdWVzLm1ldGFsbmVzc01hcCAmJiAodGhpcy5kZWZpbmVzWydVU0VfTUVUQUxORVNTTUFQJ10gPSAnJyk7XG4gIFxuICAgIGlmICh1bmlmb3JtVmFsdWVzLmVudk1hcCkge1xuICAgICAgdGhpcy5kZWZpbmVzWydVU0VfRU5WTUFQJ10gPSAnJztcbiAgICBcbiAgICAgIGxldCBlbnZNYXBUeXBlRGVmaW5lID0gJ0VOVk1BUF9UWVBFX0NVQkUnO1xuICAgICAgbGV0IGVudk1hcE1vZGVEZWZpbmUgPSAnRU5WTUFQX01PREVfUkVGTEVDVElPTic7XG4gICAgICBsZXQgZW52TWFwQmxlbmRpbmdEZWZpbmUgPSAnRU5WTUFQX0JMRU5ESU5HX01VTFRJUExZJztcbiAgICBcbiAgICAgIHN3aXRjaCAodW5pZm9ybVZhbHVlcy5lbnZNYXAubWFwcGluZykge1xuICAgICAgICBjYXNlIEN1YmVSZWZsZWN0aW9uTWFwcGluZzpcbiAgICAgICAgY2FzZSBDdWJlUmVmcmFjdGlvbk1hcHBpbmc6XG4gICAgICAgICAgZW52TWFwVHlwZURlZmluZSA9ICdFTlZNQVBfVFlQRV9DVUJFJztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDdWJlVVZSZWZsZWN0aW9uTWFwcGluZzpcbiAgICAgICAgY2FzZSBDdWJlVVZSZWZyYWN0aW9uTWFwcGluZzpcbiAgICAgICAgICBlbnZNYXBUeXBlRGVmaW5lID0gJ0VOVk1BUF9UWVBFX0NVQkVfVVYnO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIEVxdWlyZWN0YW5ndWxhclJlZmxlY3Rpb25NYXBwaW5nOlxuICAgICAgICBjYXNlIEVxdWlyZWN0YW5ndWxhclJlZnJhY3Rpb25NYXBwaW5nOlxuICAgICAgICAgIGVudk1hcFR5cGVEZWZpbmUgPSAnRU5WTUFQX1RZUEVfRVFVSVJFQyc7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgU3BoZXJpY2FsUmVmbGVjdGlvbk1hcHBpbmc6XG4gICAgICAgICAgZW52TWFwVHlwZURlZmluZSA9ICdFTlZNQVBfVFlQRV9TUEhFUkUnO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIFxuICAgICAgc3dpdGNoICh1bmlmb3JtVmFsdWVzLmVudk1hcC5tYXBwaW5nKSB7XG4gICAgICAgIGNhc2UgQ3ViZVJlZnJhY3Rpb25NYXBwaW5nOlxuICAgICAgICBjYXNlIEVxdWlyZWN0YW5ndWxhclJlZnJhY3Rpb25NYXBwaW5nOlxuICAgICAgICAgIGVudk1hcE1vZGVEZWZpbmUgPSAnRU5WTUFQX01PREVfUkVGUkFDVElPTic7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgXG4gICAgICBzd2l0Y2ggKHVuaWZvcm1WYWx1ZXMuY29tYmluZSkge1xuICAgICAgICBjYXNlIE1peE9wZXJhdGlvbjpcbiAgICAgICAgICBlbnZNYXBCbGVuZGluZ0RlZmluZSA9ICdFTlZNQVBfQkxFTkRJTkdfTUlYJztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBBZGRPcGVyYXRpb246XG4gICAgICAgICAgZW52TWFwQmxlbmRpbmdEZWZpbmUgPSAnRU5WTUFQX0JMRU5ESU5HX0FERCc7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgTXVsdGlwbHlPcGVyYXRpb246XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgZW52TWFwQmxlbmRpbmdEZWZpbmUgPSAnRU5WTUFQX0JMRU5ESU5HX01VTFRJUExZJztcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICBcbiAgICAgIHRoaXMuZGVmaW5lc1tlbnZNYXBUeXBlRGVmaW5lXSA9ICcnO1xuICAgICAgdGhpcy5kZWZpbmVzW2Vudk1hcEJsZW5kaW5nRGVmaW5lXSA9ICcnO1xuICAgICAgdGhpcy5kZWZpbmVzW2Vudk1hcE1vZGVEZWZpbmVdID0gJyc7XG4gICAgfVxuICB9XG59XG5cbkJhc2VBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUgPSBPYmplY3QuYXNzaWduKE9iamVjdC5jcmVhdGUoU2hhZGVyTWF0ZXJpYWwucHJvdG90eXBlKSwge1xuICBjb25zdHJ1Y3RvcjogQmFzZUFuaW1hdGlvbk1hdGVyaWFsLFxuICBcbiAgc2V0VW5pZm9ybVZhbHVlcyh2YWx1ZXMpIHtcbiAgICBpZiAoIXZhbHVlcykgcmV0dXJuO1xuICAgIFxuICAgIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyh2YWx1ZXMpO1xuICAgIFxuICAgIGtleXMuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgICBrZXkgaW4gdGhpcy51bmlmb3JtcyAmJiAodGhpcy51bmlmb3Jtc1trZXldLnZhbHVlID0gdmFsdWVzW2tleV0pO1xuICAgIH0pO1xuICB9LFxuICBcbiAgc3RyaW5naWZ5Q2h1bmsobmFtZSkge1xuICAgIGxldCB2YWx1ZTtcbiAgICBcbiAgICBpZiAoIXRoaXNbbmFtZV0pIHtcbiAgICAgIHZhbHVlID0gJyc7XG4gICAgfVxuICAgIGVsc2UgaWYgKHR5cGVvZiB0aGlzW25hbWVdID09PSAgJ3N0cmluZycpIHtcbiAgICAgIHZhbHVlID0gdGhpc1tuYW1lXTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICB2YWx1ZSA9IHRoaXNbbmFtZV0uam9pbignXFxuJyk7XG4gICAgfVxuICAgIFxuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxufSk7XG5cbmV4cG9ydCBkZWZhdWx0IEJhc2VBbmltYXRpb25NYXRlcmlhbDtcbiIsImltcG9ydCB7IFNoYWRlckxpYiB9IGZyb20gJ3RocmVlJztcbmltcG9ydCBCYXNlQW5pbWF0aW9uTWF0ZXJpYWwgZnJvbSAnLi9CYXNlQW5pbWF0aW9uTWF0ZXJpYWwnO1xuXG4vKipcbiAqIEV4dGVuZHMgVEhSRUUuTWVzaEJhc2ljTWF0ZXJpYWwgd2l0aCBjdXN0b20gc2hhZGVyIGNodW5rcy5cbiAqXG4gKiBAc2VlIGh0dHA6Ly90aHJlZS1iYXMtZXhhbXBsZXMuc3VyZ2Uuc2gvZXhhbXBsZXMvbWF0ZXJpYWxzX2Jhc2ljL1xuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBwYXJhbWV0ZXJzIE9iamVjdCBjb250YWluaW5nIG1hdGVyaWFsIHByb3BlcnRpZXMgYW5kIGN1c3RvbSBzaGFkZXIgY2h1bmtzLlxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIEJhc2ljQW5pbWF0aW9uTWF0ZXJpYWwocGFyYW1ldGVycykge1xuICB0aGlzLnZhcnlpbmdQYXJhbWV0ZXJzID0gW107XG4gIFxuICB0aGlzLnZlcnRleFBhcmFtZXRlcnMgPSBbXTtcbiAgdGhpcy52ZXJ0ZXhGdW5jdGlvbnMgPSBbXTtcbiAgdGhpcy52ZXJ0ZXhJbml0ID0gW107XG4gIHRoaXMudmVydGV4Tm9ybWFsID0gW107XG4gIHRoaXMudmVydGV4UG9zaXRpb24gPSBbXTtcbiAgdGhpcy52ZXJ0ZXhDb2xvciA9IFtdO1xuICBcbiAgdGhpcy5mcmFnbWVudEZ1bmN0aW9ucyA9IFtdO1xuICB0aGlzLmZyYWdtZW50UGFyYW1ldGVycyA9IFtdO1xuICB0aGlzLmZyYWdtZW50SW5pdCA9IFtdO1xuICB0aGlzLmZyYWdtZW50TWFwID0gW107XG4gIHRoaXMuZnJhZ21lbnREaWZmdXNlID0gW107XG4gIFxuICBCYXNlQW5pbWF0aW9uTWF0ZXJpYWwuY2FsbCh0aGlzLCBwYXJhbWV0ZXJzLCBTaGFkZXJMaWJbJ2Jhc2ljJ10udW5pZm9ybXMpO1xuICBcbiAgdGhpcy5saWdodHMgPSBmYWxzZTtcbiAgdGhpcy52ZXJ0ZXhTaGFkZXIgPSB0aGlzLmNvbmNhdFZlcnRleFNoYWRlcigpO1xuICB0aGlzLmZyYWdtZW50U2hhZGVyID0gdGhpcy5jb25jYXRGcmFnbWVudFNoYWRlcigpO1xufVxuQmFzaWNBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEJhc2VBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUpO1xuQmFzaWNBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBCYXNpY0FuaW1hdGlvbk1hdGVyaWFsO1xuXG5CYXNpY0FuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZS5jb25jYXRWZXJ0ZXhTaGFkZXIgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIGBcbiAgI2luY2x1ZGUgPGNvbW1vbj5cbiAgI2luY2x1ZGUgPHV2X3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8dXYyX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8ZW52bWFwX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8Y29sb3JfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxmb2dfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxtb3JwaHRhcmdldF9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPHNraW5uaW5nX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfcGFyc192ZXJ0ZXg+XG4gIFxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBhcmFtZXRlcnMnKX1cbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2YXJ5aW5nUGFyYW1ldGVycycpfVxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleEZ1bmN0aW9ucycpfVxuICBcbiAgdm9pZCBtYWluKCkge1xuXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhJbml0Jyl9XG4gIFxuICAgICNpbmNsdWRlIDx1dl92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPHV2Ml92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPGNvbG9yX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8c2tpbmJhc2VfdmVydGV4PlxuICBcbiAgICAjaWZkZWYgVVNFX0VOVk1BUFxuICBcbiAgICAjaW5jbHVkZSA8YmVnaW5ub3JtYWxfdmVydGV4PlxuICAgIFxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4Tm9ybWFsJyl9XG4gICAgXG4gICAgI2luY2x1ZGUgPG1vcnBobm9ybWFsX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8c2tpbm5vcm1hbF92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPGRlZmF1bHRub3JtYWxfdmVydGV4PlxuICBcbiAgICAjZW5kaWZcbiAgXG4gICAgI2luY2x1ZGUgPGJlZ2luX3ZlcnRleD5cbiAgICBcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBvc2l0aW9uJyl9XG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhDb2xvcicpfVxuICAgIFxuICAgICNpbmNsdWRlIDxtb3JwaHRhcmdldF92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPHNraW5uaW5nX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8cHJvamVjdF92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPGxvZ2RlcHRoYnVmX3ZlcnRleD5cbiAgXG4gICAgI2luY2x1ZGUgPHdvcmxkcG9zX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8ZW52bWFwX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8Zm9nX3ZlcnRleD5cbiAgfWA7XG59O1xuXG5CYXNpY0FuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZS5jb25jYXRGcmFnbWVudFNoYWRlciA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gYFxuICB1bmlmb3JtIHZlYzMgZGlmZnVzZTtcbiAgdW5pZm9ybSBmbG9hdCBvcGFjaXR5O1xuICBcbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudFBhcmFtZXRlcnMnKX1cbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2YXJ5aW5nUGFyYW1ldGVycycpfVxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50RnVuY3Rpb25zJyl9XG4gIFxuICAjaWZuZGVmIEZMQVRfU0hBREVEXG4gIFxuICAgIHZhcnlpbmcgdmVjMyB2Tm9ybWFsO1xuICBcbiAgI2VuZGlmXG4gIFxuICAjaW5jbHVkZSA8Y29tbW9uPlxuICAjaW5jbHVkZSA8Y29sb3JfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPHV2X3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDx1djJfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPG1hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8YWxwaGFtYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGFvbWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxsaWdodG1hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8ZW52bWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxmb2dfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPHNwZWN1bGFybWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX3BhcnNfZnJhZ21lbnQ+XG4gIFxuICB2b2lkIG1haW4oKSB7XG4gIFxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRJbml0Jyl9XG4gIFxuICAgICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfZnJhZ21lbnQ+XG5cbiAgICB2ZWM0IGRpZmZ1c2VDb2xvciA9IHZlYzQoIGRpZmZ1c2UsIG9wYWNpdHkgKTtcblxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnREaWZmdXNlJyl9XG4gIFxuICAgICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl9mcmFnbWVudD5cbiAgICBcbiAgICAkeyh0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudE1hcCcpIHx8ICcjaW5jbHVkZSA8bWFwX2ZyYWdtZW50PicpfVxuICAgIFxuICAgICNpbmNsdWRlIDxjb2xvcl9mcmFnbWVudD5cbiAgICAjaW5jbHVkZSA8YWxwaGFtYXBfZnJhZ21lbnQ+XG4gICAgI2luY2x1ZGUgPGFscGhhdGVzdF9mcmFnbWVudD5cbiAgICAjaW5jbHVkZSA8c3BlY3VsYXJtYXBfZnJhZ21lbnQ+XG4gIFxuICAgIFJlZmxlY3RlZExpZ2h0IHJlZmxlY3RlZExpZ2h0ID0gUmVmbGVjdGVkTGlnaHQoIHZlYzMoIDAuMCApLCB2ZWMzKCAwLjAgKSwgdmVjMyggMC4wICksIHZlYzMoIDAuMCApICk7XG4gIFxuICAgIC8vIGFjY3VtdWxhdGlvbiAoYmFrZWQgaW5kaXJlY3QgbGlnaHRpbmcgb25seSlcbiAgICAjaWZkZWYgVVNFX0xJR0hUTUFQXG4gIFxuICAgICAgcmVmbGVjdGVkTGlnaHQuaW5kaXJlY3REaWZmdXNlICs9IHRleHR1cmUyRCggbGlnaHRNYXAsIHZVdjIgKS54eXogKiBsaWdodE1hcEludGVuc2l0eTtcbiAgXG4gICAgI2Vsc2VcbiAgXG4gICAgICByZWZsZWN0ZWRMaWdodC5pbmRpcmVjdERpZmZ1c2UgKz0gdmVjMyggMS4wICk7XG4gIFxuICAgICNlbmRpZlxuICBcbiAgICAvLyBtb2R1bGF0aW9uXG4gICAgI2luY2x1ZGUgPGFvbWFwX2ZyYWdtZW50PlxuICBcbiAgICByZWZsZWN0ZWRMaWdodC5pbmRpcmVjdERpZmZ1c2UgKj0gZGlmZnVzZUNvbG9yLnJnYjtcbiAgXG4gICAgdmVjMyBvdXRnb2luZ0xpZ2h0ID0gcmVmbGVjdGVkTGlnaHQuaW5kaXJlY3REaWZmdXNlO1xuICBcbiAgICAjaW5jbHVkZSA8ZW52bWFwX2ZyYWdtZW50PlxuICBcbiAgICBnbF9GcmFnQ29sb3IgPSB2ZWM0KCBvdXRnb2luZ0xpZ2h0LCBkaWZmdXNlQ29sb3IuYSApO1xuICBcbiAgICAjaW5jbHVkZSA8cHJlbXVsdGlwbGllZF9hbHBoYV9mcmFnbWVudD5cbiAgICAjaW5jbHVkZSA8dG9uZW1hcHBpbmdfZnJhZ21lbnQ+XG4gICAgI2luY2x1ZGUgPGVuY29kaW5nc19mcmFnbWVudD5cbiAgICAjaW5jbHVkZSA8Zm9nX2ZyYWdtZW50PlxuICB9YDtcbn07XG5cbmV4cG9ydCB7IEJhc2ljQW5pbWF0aW9uTWF0ZXJpYWwgfTtcbiIsImltcG9ydCB7IFNoYWRlckxpYiB9IGZyb20gJ3RocmVlJztcbmltcG9ydCBCYXNlQW5pbWF0aW9uTWF0ZXJpYWwgZnJvbSAnLi9CYXNlQW5pbWF0aW9uTWF0ZXJpYWwnO1xuXG4vKipcbiAqIEV4dGVuZHMgVEhSRUUuTWVzaExhbWJlcnRNYXRlcmlhbCB3aXRoIGN1c3RvbSBzaGFkZXIgY2h1bmtzLlxuICpcbiAqIEBzZWUgaHR0cDovL3RocmVlLWJhcy1leGFtcGxlcy5zdXJnZS5zaC9leGFtcGxlcy9tYXRlcmlhbHNfbGFtYmVydC9cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gcGFyYW1ldGVycyBPYmplY3QgY29udGFpbmluZyBtYXRlcmlhbCBwcm9wZXJ0aWVzIGFuZCBjdXN0b20gc2hhZGVyIGNodW5rcy5cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBMYW1iZXJ0QW5pbWF0aW9uTWF0ZXJpYWwocGFyYW1ldGVycykge1xuICB0aGlzLnZhcnlpbmdQYXJhbWV0ZXJzID0gW107XG4gIFxuICB0aGlzLnZlcnRleEZ1bmN0aW9ucyA9IFtdO1xuICB0aGlzLnZlcnRleFBhcmFtZXRlcnMgPSBbXTtcbiAgdGhpcy52ZXJ0ZXhJbml0ID0gW107XG4gIHRoaXMudmVydGV4Tm9ybWFsID0gW107XG4gIHRoaXMudmVydGV4UG9zaXRpb24gPSBbXTtcbiAgdGhpcy52ZXJ0ZXhDb2xvciA9IFtdO1xuICBcbiAgdGhpcy5mcmFnbWVudEZ1bmN0aW9ucyA9IFtdO1xuICB0aGlzLmZyYWdtZW50UGFyYW1ldGVycyA9IFtdO1xuICB0aGlzLmZyYWdtZW50SW5pdCA9IFtdO1xuICB0aGlzLmZyYWdtZW50TWFwID0gW107XG4gIHRoaXMuZnJhZ21lbnREaWZmdXNlID0gW107XG4gIHRoaXMuZnJhZ21lbnRFbWlzc2l2ZSA9IFtdO1xuICB0aGlzLmZyYWdtZW50U3BlY3VsYXIgPSBbXTtcbiAgXG4gIEJhc2VBbmltYXRpb25NYXRlcmlhbC5jYWxsKHRoaXMsIHBhcmFtZXRlcnMsIFNoYWRlckxpYlsnbGFtYmVydCddLnVuaWZvcm1zKTtcbiAgXG4gIHRoaXMubGlnaHRzID0gdHJ1ZTtcbiAgdGhpcy52ZXJ0ZXhTaGFkZXIgPSB0aGlzLmNvbmNhdFZlcnRleFNoYWRlcigpO1xuICB0aGlzLmZyYWdtZW50U2hhZGVyID0gdGhpcy5jb25jYXRGcmFnbWVudFNoYWRlcigpO1xufVxuTGFtYmVydEFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoQmFzZUFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZSk7XG5MYW1iZXJ0QW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gTGFtYmVydEFuaW1hdGlvbk1hdGVyaWFsO1xuXG5MYW1iZXJ0QW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlLmNvbmNhdFZlcnRleFNoYWRlciA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIGBcbiAgI2RlZmluZSBMQU1CRVJUXG5cbiAgdmFyeWluZyB2ZWMzIHZMaWdodEZyb250O1xuICBcbiAgI2lmZGVmIERPVUJMRV9TSURFRFxuICBcbiAgICB2YXJ5aW5nIHZlYzMgdkxpZ2h0QmFjaztcbiAgXG4gICNlbmRpZlxuICBcbiAgI2luY2x1ZGUgPGNvbW1vbj5cbiAgI2luY2x1ZGUgPHV2X3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8dXYyX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8ZW52bWFwX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8YnNkZnM+XG4gICNpbmNsdWRlIDxsaWdodHNfcGFycz5cbiAgI2luY2x1ZGUgPGNvbG9yX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8Zm9nX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8bW9ycGh0YXJnZXRfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxza2lubmluZ19wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPHNoYWRvd21hcF9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPGxvZ2RlcHRoYnVmX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX3BhcnNfdmVydGV4PlxuICBcbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQYXJhbWV0ZXJzJyl9XG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmFyeWluZ1BhcmFtZXRlcnMnKX1cbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhGdW5jdGlvbnMnKX1cbiAgXG4gIHZvaWQgbWFpbigpIHtcbiAgXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhJbml0Jyl9XG4gIFxuICAgICNpbmNsdWRlIDx1dl92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPHV2Ml92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPGNvbG9yX3ZlcnRleD5cbiAgXG4gICAgI2luY2x1ZGUgPGJlZ2lubm9ybWFsX3ZlcnRleD5cbiAgICBcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleE5vcm1hbCcpfVxuICAgIFxuICAgICNpbmNsdWRlIDxtb3JwaG5vcm1hbF92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPHNraW5iYXNlX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8c2tpbm5vcm1hbF92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPGRlZmF1bHRub3JtYWxfdmVydGV4PlxuICBcbiAgICAjaW5jbHVkZSA8YmVnaW5fdmVydGV4PlxuICAgIFxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UG9zaXRpb24nKX1cbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleENvbG9yJyl9XG4gICAgXG4gICAgI2luY2x1ZGUgPG1vcnBodGFyZ2V0X3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8c2tpbm5pbmdfdmVydGV4PlxuICAgICNpbmNsdWRlIDxwcm9qZWN0X3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfdmVydGV4PlxuICAgICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfdmVydGV4PlxuICBcbiAgICAjaW5jbHVkZSA8d29ybGRwb3NfdmVydGV4PlxuICAgICNpbmNsdWRlIDxlbnZtYXBfdmVydGV4PlxuICAgICNpbmNsdWRlIDxsaWdodHNfbGFtYmVydF92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPHNoYWRvd21hcF92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPGZvZ192ZXJ0ZXg+XG4gIH1gO1xufTtcblxuTGFtYmVydEFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZS5jb25jYXRGcmFnbWVudFNoYWRlciA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIGBcbiAgdW5pZm9ybSB2ZWMzIGRpZmZ1c2U7XG4gIHVuaWZvcm0gdmVjMyBlbWlzc2l2ZTtcbiAgdW5pZm9ybSBmbG9hdCBvcGFjaXR5O1xuICBcbiAgdmFyeWluZyB2ZWMzIHZMaWdodEZyb250O1xuICBcbiAgI2lmZGVmIERPVUJMRV9TSURFRFxuICBcbiAgICB2YXJ5aW5nIHZlYzMgdkxpZ2h0QmFjaztcbiAgXG4gICNlbmRpZlxuICBcbiAgI2luY2x1ZGUgPGNvbW1vbj5cbiAgI2luY2x1ZGUgPHBhY2tpbmc+XG4gICNpbmNsdWRlIDxkaXRoZXJpbmdfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGNvbG9yX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDx1dl9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8dXYyX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxtYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGFscGhhbWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxhb21hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8bGlnaHRtYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGVtaXNzaXZlbWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxlbnZtYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGJzZGZzPlxuICAjaW5jbHVkZSA8bGlnaHRzX3BhcnM+XG4gICNpbmNsdWRlIDxmb2dfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPHNoYWRvd21hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8c2hhZG93bWFza19wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8c3BlY3VsYXJtYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGxvZ2RlcHRoYnVmX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfcGFyc19mcmFnbWVudD5cbiAgXG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRQYXJhbWV0ZXJzJyl9XG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmFyeWluZ1BhcmFtZXRlcnMnKX1cbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudEZ1bmN0aW9ucycpfVxuICBcbiAgdm9pZCBtYWluKCkge1xuICBcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50SW5pdCcpfVxuICBcbiAgICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX2ZyYWdtZW50PlxuXG4gICAgdmVjNCBkaWZmdXNlQ29sb3IgPSB2ZWM0KCBkaWZmdXNlLCBvcGFjaXR5ICk7XG4gICAgUmVmbGVjdGVkTGlnaHQgcmVmbGVjdGVkTGlnaHQgPSBSZWZsZWN0ZWRMaWdodCggdmVjMyggMC4wICksIHZlYzMoIDAuMCApLCB2ZWMzKCAwLjAgKSwgdmVjMyggMC4wICkgKTtcbiAgICB2ZWMzIHRvdGFsRW1pc3NpdmVSYWRpYW5jZSA9IGVtaXNzaXZlO1xuXHRcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50RGlmZnVzZScpfVxuICBcbiAgICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfZnJhZ21lbnQ+XG5cbiAgICAkeyh0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudE1hcCcpIHx8ICcjaW5jbHVkZSA8bWFwX2ZyYWdtZW50PicpfVxuXG4gICAgI2luY2x1ZGUgPGNvbG9yX2ZyYWdtZW50PlxuICAgICNpbmNsdWRlIDxhbHBoYW1hcF9mcmFnbWVudD5cbiAgICAjaW5jbHVkZSA8YWxwaGF0ZXN0X2ZyYWdtZW50PlxuICAgICNpbmNsdWRlIDxzcGVjdWxhcm1hcF9mcmFnbWVudD5cblxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRFbWlzc2l2ZScpfVxuXG4gICAgI2luY2x1ZGUgPGVtaXNzaXZlbWFwX2ZyYWdtZW50PlxuICBcbiAgICAvLyBhY2N1bXVsYXRpb25cbiAgICByZWZsZWN0ZWRMaWdodC5pbmRpcmVjdERpZmZ1c2UgPSBnZXRBbWJpZW50TGlnaHRJcnJhZGlhbmNlKCBhbWJpZW50TGlnaHRDb2xvciApO1xuICBcbiAgICAjaW5jbHVkZSA8bGlnaHRtYXBfZnJhZ21lbnQ+XG4gIFxuICAgIHJlZmxlY3RlZExpZ2h0LmluZGlyZWN0RGlmZnVzZSAqPSBCUkRGX0RpZmZ1c2VfTGFtYmVydCggZGlmZnVzZUNvbG9yLnJnYiApO1xuICBcbiAgICAjaWZkZWYgRE9VQkxFX1NJREVEXG4gIFxuICAgICAgcmVmbGVjdGVkTGlnaHQuZGlyZWN0RGlmZnVzZSA9ICggZ2xfRnJvbnRGYWNpbmcgKSA/IHZMaWdodEZyb250IDogdkxpZ2h0QmFjaztcbiAgXG4gICAgI2Vsc2VcbiAgXG4gICAgICByZWZsZWN0ZWRMaWdodC5kaXJlY3REaWZmdXNlID0gdkxpZ2h0RnJvbnQ7XG4gIFxuICAgICNlbmRpZlxuICBcbiAgICByZWZsZWN0ZWRMaWdodC5kaXJlY3REaWZmdXNlICo9IEJSREZfRGlmZnVzZV9MYW1iZXJ0KCBkaWZmdXNlQ29sb3IucmdiICkgKiBnZXRTaGFkb3dNYXNrKCk7XG4gIFxuICAgIC8vIG1vZHVsYXRpb25cbiAgICAjaW5jbHVkZSA8YW9tYXBfZnJhZ21lbnQ+XG4gIFxuICAgIHZlYzMgb3V0Z29pbmdMaWdodCA9IHJlZmxlY3RlZExpZ2h0LmRpcmVjdERpZmZ1c2UgKyByZWZsZWN0ZWRMaWdodC5pbmRpcmVjdERpZmZ1c2UgKyB0b3RhbEVtaXNzaXZlUmFkaWFuY2U7XG4gIFxuICAgICNpbmNsdWRlIDxlbnZtYXBfZnJhZ21lbnQ+XG4gIFxuICAgIGdsX0ZyYWdDb2xvciA9IHZlYzQoIG91dGdvaW5nTGlnaHQsIGRpZmZ1c2VDb2xvci5hICk7XG4gIFxuICAgICNpbmNsdWRlIDx0b25lbWFwcGluZ19mcmFnbWVudD5cbiAgICAjaW5jbHVkZSA8ZW5jb2RpbmdzX2ZyYWdtZW50PlxuICAgICNpbmNsdWRlIDxmb2dfZnJhZ21lbnQ+XG4gICAgI2luY2x1ZGUgPHByZW11bHRpcGxpZWRfYWxwaGFfZnJhZ21lbnQ+XG4gICAgI2luY2x1ZGUgPGRpdGhlcmluZ19mcmFnbWVudD5cbiAgfWA7XG59O1xuXG5leHBvcnQgeyBMYW1iZXJ0QW5pbWF0aW9uTWF0ZXJpYWwgfTtcbiIsImltcG9ydCB7IFNoYWRlckxpYiB9IGZyb20gJ3RocmVlJztcbmltcG9ydCBCYXNlQW5pbWF0aW9uTWF0ZXJpYWwgZnJvbSAnLi9CYXNlQW5pbWF0aW9uTWF0ZXJpYWwnO1xuXG4vKipcbiAqIEV4dGVuZHMgVEhSRUUuTWVzaFBob25nTWF0ZXJpYWwgd2l0aCBjdXN0b20gc2hhZGVyIGNodW5rcy5cbiAqXG4gKiBAc2VlIGh0dHA6Ly90aHJlZS1iYXMtZXhhbXBsZXMuc3VyZ2Uuc2gvZXhhbXBsZXMvbWF0ZXJpYWxzX3Bob25nL1xuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBwYXJhbWV0ZXJzIE9iamVjdCBjb250YWluaW5nIG1hdGVyaWFsIHByb3BlcnRpZXMgYW5kIGN1c3RvbSBzaGFkZXIgY2h1bmtzLlxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIFBob25nQW5pbWF0aW9uTWF0ZXJpYWwocGFyYW1ldGVycykge1xuICB0aGlzLnZhcnlpbmdQYXJhbWV0ZXJzID0gW107XG5cbiAgdGhpcy52ZXJ0ZXhGdW5jdGlvbnMgPSBbXTtcbiAgdGhpcy52ZXJ0ZXhQYXJhbWV0ZXJzID0gW107XG4gIHRoaXMudmVydGV4SW5pdCA9IFtdO1xuICB0aGlzLnZlcnRleE5vcm1hbCA9IFtdO1xuICB0aGlzLnZlcnRleFBvc2l0aW9uID0gW107XG4gIHRoaXMudmVydGV4Q29sb3IgPSBbXTtcblxuICB0aGlzLmZyYWdtZW50RnVuY3Rpb25zID0gW107XG4gIHRoaXMuZnJhZ21lbnRQYXJhbWV0ZXJzID0gW107XG4gIHRoaXMuZnJhZ21lbnRJbml0ID0gW107XG4gIHRoaXMuZnJhZ21lbnRNYXAgPSBbXTtcbiAgdGhpcy5mcmFnbWVudERpZmZ1c2UgPSBbXTtcbiAgdGhpcy5mcmFnbWVudEVtaXNzaXZlID0gW107XG4gIHRoaXMuZnJhZ21lbnRTcGVjdWxhciA9IFtdO1xuXG4gIEJhc2VBbmltYXRpb25NYXRlcmlhbC5jYWxsKHRoaXMsIHBhcmFtZXRlcnMsIFNoYWRlckxpYlsncGhvbmcnXS51bmlmb3Jtcyk7XG5cbiAgdGhpcy5saWdodHMgPSB0cnVlO1xuICB0aGlzLnZlcnRleFNoYWRlciA9IHRoaXMuY29uY2F0VmVydGV4U2hhZGVyKCk7XG4gIHRoaXMuZnJhZ21lbnRTaGFkZXIgPSB0aGlzLmNvbmNhdEZyYWdtZW50U2hhZGVyKCk7XG59XG5QaG9uZ0FuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoQmFzZUFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZSk7XG5QaG9uZ0FuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFBob25nQW5pbWF0aW9uTWF0ZXJpYWw7XG5cblBob25nQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlLmNvbmNhdFZlcnRleFNoYWRlciA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIGBcbiAgI2RlZmluZSBQSE9OR1xuXG4gIHZhcnlpbmcgdmVjMyB2Vmlld1Bvc2l0aW9uO1xuICBcbiAgI2lmbmRlZiBGTEFUX1NIQURFRFxuICBcbiAgICB2YXJ5aW5nIHZlYzMgdk5vcm1hbDtcbiAgXG4gICNlbmRpZlxuICBcbiAgI2luY2x1ZGUgPGNvbW1vbj5cbiAgI2luY2x1ZGUgPHV2X3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8dXYyX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8ZGlzcGxhY2VtZW50bWFwX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8ZW52bWFwX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8Y29sb3JfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxmb2dfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxtb3JwaHRhcmdldF9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPHNraW5uaW5nX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8c2hhZG93bWFwX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfcGFyc192ZXJ0ZXg+XG4gIFxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBhcmFtZXRlcnMnKX1cbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2YXJ5aW5nUGFyYW1ldGVycycpfVxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleEZ1bmN0aW9ucycpfVxuICBcbiAgdm9pZCBtYWluKCkge1xuICBcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleEluaXQnKX1cbiAgXG4gICAgI2luY2x1ZGUgPHV2X3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8dXYyX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8Y29sb3JfdmVydGV4PlxuICBcbiAgICAjaW5jbHVkZSA8YmVnaW5ub3JtYWxfdmVydGV4PlxuICAgIFxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4Tm9ybWFsJyl9XG4gICAgXG4gICAgI2luY2x1ZGUgPG1vcnBobm9ybWFsX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8c2tpbmJhc2VfdmVydGV4PlxuICAgICNpbmNsdWRlIDxza2lubm9ybWFsX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8ZGVmYXVsdG5vcm1hbF92ZXJ0ZXg+XG4gIFxuICAjaWZuZGVmIEZMQVRfU0hBREVEIC8vIE5vcm1hbCBjb21wdXRlZCB3aXRoIGRlcml2YXRpdmVzIHdoZW4gRkxBVF9TSEFERURcbiAgXG4gICAgdk5vcm1hbCA9IG5vcm1hbGl6ZSggdHJhbnNmb3JtZWROb3JtYWwgKTtcbiAgXG4gICNlbmRpZlxuICBcbiAgICAjaW5jbHVkZSA8YmVnaW5fdmVydGV4PlxuICAgIFxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UG9zaXRpb24nKX1cbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleENvbG9yJyl9XG4gICAgXG4gICAgI2luY2x1ZGUgPG1vcnBodGFyZ2V0X3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8c2tpbm5pbmdfdmVydGV4PlxuICAgICNpbmNsdWRlIDxkaXNwbGFjZW1lbnRtYXBfdmVydGV4PlxuICAgICNpbmNsdWRlIDxwcm9qZWN0X3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfdmVydGV4PlxuICAgICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfdmVydGV4PlxuICBcbiAgICB2Vmlld1Bvc2l0aW9uID0gLSBtdlBvc2l0aW9uLnh5ejtcbiAgXG4gICAgI2luY2x1ZGUgPHdvcmxkcG9zX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8ZW52bWFwX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8c2hhZG93bWFwX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8Zm9nX3ZlcnRleD5cbiAgfWA7XG59O1xuXG5QaG9uZ0FuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZS5jb25jYXRGcmFnbWVudFNoYWRlciA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIGBcbiAgI2RlZmluZSBQSE9OR1xuXG4gIHVuaWZvcm0gdmVjMyBkaWZmdXNlO1xuICB1bmlmb3JtIHZlYzMgZW1pc3NpdmU7XG4gIHVuaWZvcm0gdmVjMyBzcGVjdWxhcjtcbiAgdW5pZm9ybSBmbG9hdCBzaGluaW5lc3M7XG4gIHVuaWZvcm0gZmxvYXQgb3BhY2l0eTtcbiAgXG4gICNpbmNsdWRlIDxjb21tb24+XG4gICNpbmNsdWRlIDxwYWNraW5nPlxuICAjaW5jbHVkZSA8ZGl0aGVyaW5nX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxjb2xvcl9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8dXZfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPHV2Ml9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8bWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxhbHBoYW1hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8YW9tYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGxpZ2h0bWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxlbWlzc2l2ZW1hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8ZW52bWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxncmFkaWVudG1hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8Zm9nX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxic2Rmcz5cbiAgI2luY2x1ZGUgPGxpZ2h0c19wYXJzPlxuICAjaW5jbHVkZSA8bGlnaHRzX3Bob25nX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxzaGFkb3dtYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGJ1bXBtYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPG5vcm1hbG1hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8c3BlY3VsYXJtYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGxvZ2RlcHRoYnVmX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfcGFyc19mcmFnbWVudD5cbiAgXG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRQYXJhbWV0ZXJzJyl9XG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmFyeWluZ1BhcmFtZXRlcnMnKX1cbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudEZ1bmN0aW9ucycpfVxuICBcbiAgdm9pZCBtYWluKCkge1xuICBcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50SW5pdCcpfVxuICBcbiAgICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX2ZyYWdtZW50PlxuICBcbiAgICB2ZWM0IGRpZmZ1c2VDb2xvciA9IHZlYzQoIGRpZmZ1c2UsIG9wYWNpdHkgKTtcbiAgICBSZWZsZWN0ZWRMaWdodCByZWZsZWN0ZWRMaWdodCA9IFJlZmxlY3RlZExpZ2h0KCB2ZWMzKCAwLjAgKSwgdmVjMyggMC4wICksIHZlYzMoIDAuMCApLCB2ZWMzKCAwLjAgKSApO1xuICAgIHZlYzMgdG90YWxFbWlzc2l2ZVJhZGlhbmNlID0gZW1pc3NpdmU7XG4gIFxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnREaWZmdXNlJyl9XG4gIFxuICAgICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl9mcmFnbWVudD5cblxuICAgICR7KHRoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50TWFwJykgfHwgJyNpbmNsdWRlIDxtYXBfZnJhZ21lbnQ+Jyl9XG5cbiAgICAjaW5jbHVkZSA8Y29sb3JfZnJhZ21lbnQ+XG4gICAgI2luY2x1ZGUgPGFscGhhbWFwX2ZyYWdtZW50PlxuICAgICNpbmNsdWRlIDxhbHBoYXRlc3RfZnJhZ21lbnQ+XG4gICAgI2luY2x1ZGUgPHNwZWN1bGFybWFwX2ZyYWdtZW50PlxuICAgICNpbmNsdWRlIDxub3JtYWxfZnJhZ21lbnQ+XG4gICAgXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudEVtaXNzaXZlJyl9XG4gICAgXG4gICAgI2luY2x1ZGUgPGVtaXNzaXZlbWFwX2ZyYWdtZW50PlxuICBcbiAgICAvLyBhY2N1bXVsYXRpb25cbiAgICAjaW5jbHVkZSA8bGlnaHRzX3Bob25nX2ZyYWdtZW50PlxuICAgIFxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRTcGVjdWxhcicpfVxuICAgIFxuICAgICNpbmNsdWRlIDxsaWdodHNfdGVtcGxhdGU+XG4gIFxuICAgIC8vIG1vZHVsYXRpb25cbiAgICAjaW5jbHVkZSA8YW9tYXBfZnJhZ21lbnQ+XG4gIFxuICAgIHZlYzMgb3V0Z29pbmdMaWdodCA9IHJlZmxlY3RlZExpZ2h0LmRpcmVjdERpZmZ1c2UgKyByZWZsZWN0ZWRMaWdodC5pbmRpcmVjdERpZmZ1c2UgKyByZWZsZWN0ZWRMaWdodC5kaXJlY3RTcGVjdWxhciArIHJlZmxlY3RlZExpZ2h0LmluZGlyZWN0U3BlY3VsYXIgKyB0b3RhbEVtaXNzaXZlUmFkaWFuY2U7XG4gIFxuICAgICNpbmNsdWRlIDxlbnZtYXBfZnJhZ21lbnQ+XG4gIFxuICAgIGdsX0ZyYWdDb2xvciA9IHZlYzQoIG91dGdvaW5nTGlnaHQsIGRpZmZ1c2VDb2xvci5hICk7XG4gIFxuICAgICNpbmNsdWRlIDx0b25lbWFwcGluZ19mcmFnbWVudD5cbiAgICAjaW5jbHVkZSA8ZW5jb2RpbmdzX2ZyYWdtZW50PlxuICAgICNpbmNsdWRlIDxmb2dfZnJhZ21lbnQ+XG4gICAgI2luY2x1ZGUgPHByZW11bHRpcGxpZWRfYWxwaGFfZnJhZ21lbnQ+XG4gICAgI2luY2x1ZGUgPGRpdGhlcmluZ19mcmFnbWVudD5cbiAgXG4gIH1gO1xufTtcblxuZXhwb3J0IHsgUGhvbmdBbmltYXRpb25NYXRlcmlhbCB9O1xuIiwiaW1wb3J0IHsgU2hhZGVyTGliIH0gZnJvbSAndGhyZWUnO1xuaW1wb3J0IEJhc2VBbmltYXRpb25NYXRlcmlhbCBmcm9tICcuL0Jhc2VBbmltYXRpb25NYXRlcmlhbCc7XG5cbi8qKlxuICogRXh0ZW5kcyBUSFJFRS5NZXNoU3RhbmRhcmRNYXRlcmlhbCB3aXRoIGN1c3RvbSBzaGFkZXIgY2h1bmtzLlxuICpcbiAqIEBzZWUgaHR0cDovL3RocmVlLWJhcy1leGFtcGxlcy5zdXJnZS5zaC9leGFtcGxlcy9tYXRlcmlhbHNfc3RhbmRhcmQvXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IHBhcmFtZXRlcnMgT2JqZWN0IGNvbnRhaW5pbmcgbWF0ZXJpYWwgcHJvcGVydGllcyBhbmQgY3VzdG9tIHNoYWRlciBjaHVua3MuXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gU3RhbmRhcmRBbmltYXRpb25NYXRlcmlhbChwYXJhbWV0ZXJzKSB7XG4gIHRoaXMudmFyeWluZ1BhcmFtZXRlcnMgPSBbXTtcblxuICB0aGlzLnZlcnRleEZ1bmN0aW9ucyA9IFtdO1xuICB0aGlzLnZlcnRleFBhcmFtZXRlcnMgPSBbXTtcbiAgdGhpcy52ZXJ0ZXhJbml0ID0gW107XG4gIHRoaXMudmVydGV4Tm9ybWFsID0gW107XG4gIHRoaXMudmVydGV4UG9zaXRpb24gPSBbXTtcbiAgdGhpcy52ZXJ0ZXhDb2xvciA9IFtdO1xuXG4gIHRoaXMuZnJhZ21lbnRGdW5jdGlvbnMgPSBbXTtcbiAgdGhpcy5mcmFnbWVudFBhcmFtZXRlcnMgPSBbXTtcbiAgdGhpcy5mcmFnbWVudEluaXQgPSBbXTtcbiAgdGhpcy5mcmFnbWVudE1hcCA9IFtdO1xuICB0aGlzLmZyYWdtZW50RGlmZnVzZSA9IFtdO1xuICB0aGlzLmZyYWdtZW50Um91Z2huZXNzID0gW107XG4gIHRoaXMuZnJhZ21lbnRNZXRhbG5lc3MgPSBbXTtcbiAgdGhpcy5mcmFnbWVudEVtaXNzaXZlID0gW107XG5cbiAgQmFzZUFuaW1hdGlvbk1hdGVyaWFsLmNhbGwodGhpcywgcGFyYW1ldGVycywgU2hhZGVyTGliWydzdGFuZGFyZCddLnVuaWZvcm1zKTtcblxuICB0aGlzLmxpZ2h0cyA9IHRydWU7XG4gIHRoaXMudmVydGV4U2hhZGVyID0gdGhpcy5jb25jYXRWZXJ0ZXhTaGFkZXIoKTtcbiAgdGhpcy5mcmFnbWVudFNoYWRlciA9IHRoaXMuY29uY2F0RnJhZ21lbnRTaGFkZXIoKTtcbn1cblN0YW5kYXJkQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShCYXNlQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlKTtcblN0YW5kYXJkQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gU3RhbmRhcmRBbmltYXRpb25NYXRlcmlhbDtcblxuU3RhbmRhcmRBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uY2F0VmVydGV4U2hhZGVyID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gYFxuICAjZGVmaW5lIFBIWVNJQ0FMXG5cbiAgdmFyeWluZyB2ZWMzIHZWaWV3UG9zaXRpb247XG4gIFxuICAjaWZuZGVmIEZMQVRfU0hBREVEXG4gIFxuICAgIHZhcnlpbmcgdmVjMyB2Tm9ybWFsO1xuICBcbiAgI2VuZGlmXG4gIFxuICAjaW5jbHVkZSA8Y29tbW9uPlxuICAjaW5jbHVkZSA8dXZfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDx1djJfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxkaXNwbGFjZW1lbnRtYXBfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxjb2xvcl9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPGZvZ19wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPG1vcnBodGFyZ2V0X3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8c2tpbm5pbmdfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxzaGFkb3dtYXBfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc19wYXJzX3ZlcnRleD5cbiAgXG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UGFyYW1ldGVycycpfVxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZhcnlpbmdQYXJhbWV0ZXJzJyl9XG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4RnVuY3Rpb25zJyl9XG4gIFxuICB2b2lkIG1haW4oKSB7XG5cbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleEluaXQnKX1cblxuICAgICNpbmNsdWRlIDx1dl92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPHV2Ml92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPGNvbG9yX3ZlcnRleD5cbiAgXG4gICAgI2luY2x1ZGUgPGJlZ2lubm9ybWFsX3ZlcnRleD5cbiAgICBcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleE5vcm1hbCcpfVxuICAgIFxuICAgICNpbmNsdWRlIDxtb3JwaG5vcm1hbF92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPHNraW5iYXNlX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8c2tpbm5vcm1hbF92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPGRlZmF1bHRub3JtYWxfdmVydGV4PlxuICBcbiAgI2lmbmRlZiBGTEFUX1NIQURFRCAvLyBOb3JtYWwgY29tcHV0ZWQgd2l0aCBkZXJpdmF0aXZlcyB3aGVuIEZMQVRfU0hBREVEXG4gIFxuICAgIHZOb3JtYWwgPSBub3JtYWxpemUoIHRyYW5zZm9ybWVkTm9ybWFsICk7XG4gIFxuICAjZW5kaWZcbiAgXG4gICAgI2luY2x1ZGUgPGJlZ2luX3ZlcnRleD5cbiAgICBcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBvc2l0aW9uJyl9XG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhDb2xvcicpfVxuICAgIFxuICAgICNpbmNsdWRlIDxtb3JwaHRhcmdldF92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPHNraW5uaW5nX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8ZGlzcGxhY2VtZW50bWFwX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8cHJvamVjdF92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPGxvZ2RlcHRoYnVmX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX3ZlcnRleD5cbiAgXG4gICAgdlZpZXdQb3NpdGlvbiA9IC0gbXZQb3NpdGlvbi54eXo7XG4gIFxuICAgICNpbmNsdWRlIDx3b3JsZHBvc192ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPHNoYWRvd21hcF92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPGZvZ192ZXJ0ZXg+XG4gIH1gO1xufTtcblxuU3RhbmRhcmRBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uY2F0RnJhZ21lbnRTaGFkZXIgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiBgXG4gICNkZWZpbmUgUEhZU0lDQUxcbiAgXG4gIHVuaWZvcm0gdmVjMyBkaWZmdXNlO1xuICB1bmlmb3JtIHZlYzMgZW1pc3NpdmU7XG4gIHVuaWZvcm0gZmxvYXQgcm91Z2huZXNzO1xuICB1bmlmb3JtIGZsb2F0IG1ldGFsbmVzcztcbiAgdW5pZm9ybSBmbG9hdCBvcGFjaXR5O1xuICBcbiAgI2lmbmRlZiBTVEFOREFSRFxuICAgIHVuaWZvcm0gZmxvYXQgY2xlYXJDb2F0O1xuICAgIHVuaWZvcm0gZmxvYXQgY2xlYXJDb2F0Um91Z2huZXNzO1xuICAjZW5kaWZcbiAgXG4gIHZhcnlpbmcgdmVjMyB2Vmlld1Bvc2l0aW9uO1xuICBcbiAgI2lmbmRlZiBGTEFUX1NIQURFRFxuICBcbiAgICB2YXJ5aW5nIHZlYzMgdk5vcm1hbDtcbiAgXG4gICNlbmRpZlxuICBcbiAgI2luY2x1ZGUgPGNvbW1vbj5cbiAgI2luY2x1ZGUgPHBhY2tpbmc+XG4gICNpbmNsdWRlIDxkaXRoZXJpbmdfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGNvbG9yX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDx1dl9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8dXYyX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxtYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGFscGhhbWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxhb21hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8bGlnaHRtYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGVtaXNzaXZlbWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxlbnZtYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGZvZ19wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8YnNkZnM+XG4gICNpbmNsdWRlIDxjdWJlX3V2X3JlZmxlY3Rpb25fZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxsaWdodHNfcGFycz5cbiAgI2luY2x1ZGUgPGxpZ2h0c19waHlzaWNhbF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8c2hhZG93bWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxidW1wbWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxub3JtYWxtYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPHJvdWdobmVzc21hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8bWV0YWxuZXNzbWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX3BhcnNfZnJhZ21lbnQ+XG4gIFxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50UGFyYW1ldGVycycpfVxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZhcnlpbmdQYXJhbWV0ZXJzJyl9XG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRGdW5jdGlvbnMnKX1cbiAgXG4gIHZvaWQgbWFpbigpIHtcbiAgXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudEluaXQnKX1cbiAgXG4gICAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc19mcmFnbWVudD5cbiAgXG4gICAgdmVjNCBkaWZmdXNlQ29sb3IgPSB2ZWM0KCBkaWZmdXNlLCBvcGFjaXR5ICk7XG4gICAgUmVmbGVjdGVkTGlnaHQgcmVmbGVjdGVkTGlnaHQgPSBSZWZsZWN0ZWRMaWdodCggdmVjMyggMC4wICksIHZlYzMoIDAuMCApLCB2ZWMzKCAwLjAgKSwgdmVjMyggMC4wICkgKTtcbiAgICB2ZWMzIHRvdGFsRW1pc3NpdmVSYWRpYW5jZSA9IGVtaXNzaXZlO1xuICBcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50RGlmZnVzZScpfVxuICBcbiAgICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfZnJhZ21lbnQ+XG5cbiAgICAkeyh0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudE1hcCcpIHx8ICcjaW5jbHVkZSA8bWFwX2ZyYWdtZW50PicpfVxuXG4gICAgI2luY2x1ZGUgPGNvbG9yX2ZyYWdtZW50PlxuICAgICNpbmNsdWRlIDxhbHBoYW1hcF9mcmFnbWVudD5cbiAgICAjaW5jbHVkZSA8YWxwaGF0ZXN0X2ZyYWdtZW50PlxuICAgIFxuICAgIGZsb2F0IHJvdWdobmVzc0ZhY3RvciA9IHJvdWdobmVzcztcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50Um91Z2huZXNzJyl9XG4gICAgI2lmZGVmIFVTRV9ST1VHSE5FU1NNQVBcbiAgICBcbiAgICAgIHZlYzQgdGV4ZWxSb3VnaG5lc3MgPSB0ZXh0dXJlMkQoIHJvdWdobmVzc01hcCwgdlV2ICk7XG4gICAgXG4gICAgICAvLyByZWFkcyBjaGFubmVsIEcsIGNvbXBhdGlibGUgd2l0aCBhIGNvbWJpbmVkIE9jY2x1c2lvblJvdWdobmVzc01ldGFsbGljIChSR0IpIHRleHR1cmVcbiAgICAgIHJvdWdobmVzc0ZhY3RvciAqPSB0ZXhlbFJvdWdobmVzcy5nO1xuICAgIFxuICAgICNlbmRpZlxuICAgIFxuICAgIGZsb2F0IG1ldGFsbmVzc0ZhY3RvciA9IG1ldGFsbmVzcztcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50TWV0YWxuZXNzJyl9XG4gICAgI2lmZGVmIFVTRV9NRVRBTE5FU1NNQVBcbiAgICBcbiAgICAgIHZlYzQgdGV4ZWxNZXRhbG5lc3MgPSB0ZXh0dXJlMkQoIG1ldGFsbmVzc01hcCwgdlV2ICk7XG4gICAgICBtZXRhbG5lc3NGYWN0b3IgKj0gdGV4ZWxNZXRhbG5lc3MuYjtcbiAgICBcbiAgICAjZW5kaWZcbiAgICBcbiAgICAjaW5jbHVkZSA8bm9ybWFsX2ZyYWdtZW50PlxuICAgIFxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRFbWlzc2l2ZScpfVxuICAgIFxuICAgICNpbmNsdWRlIDxlbWlzc2l2ZW1hcF9mcmFnbWVudD5cbiAgXG4gICAgLy8gYWNjdW11bGF0aW9uXG4gICAgI2luY2x1ZGUgPGxpZ2h0c19waHlzaWNhbF9mcmFnbWVudD5cbiAgICAjaW5jbHVkZSA8bGlnaHRzX3RlbXBsYXRlPlxuICBcbiAgICAvLyBtb2R1bGF0aW9uXG4gICAgI2luY2x1ZGUgPGFvbWFwX2ZyYWdtZW50PlxuICBcbiAgICB2ZWMzIG91dGdvaW5nTGlnaHQgPSByZWZsZWN0ZWRMaWdodC5kaXJlY3REaWZmdXNlICsgcmVmbGVjdGVkTGlnaHQuaW5kaXJlY3REaWZmdXNlICsgcmVmbGVjdGVkTGlnaHQuZGlyZWN0U3BlY3VsYXIgKyByZWZsZWN0ZWRMaWdodC5pbmRpcmVjdFNwZWN1bGFyICsgdG90YWxFbWlzc2l2ZVJhZGlhbmNlO1xuICBcbiAgICBnbF9GcmFnQ29sb3IgPSB2ZWM0KCBvdXRnb2luZ0xpZ2h0LCBkaWZmdXNlQ29sb3IuYSApO1xuICBcbiAgICAjaW5jbHVkZSA8dG9uZW1hcHBpbmdfZnJhZ21lbnQ+XG4gICAgI2luY2x1ZGUgPGVuY29kaW5nc19mcmFnbWVudD5cbiAgICAjaW5jbHVkZSA8Zm9nX2ZyYWdtZW50PlxuICAgICNpbmNsdWRlIDxwcmVtdWx0aXBsaWVkX2FscGhhX2ZyYWdtZW50PlxuICAgICNpbmNsdWRlIDxkaXRoZXJpbmdfZnJhZ21lbnQ+XG4gIFxuICB9YDtcbn07XG5cbmV4cG9ydCB7IFN0YW5kYXJkQW5pbWF0aW9uTWF0ZXJpYWwgfTtcbiIsImltcG9ydCB7IFNoYWRlckxpYiB9IGZyb20gJ3RocmVlJztcbmltcG9ydCBCYXNlQW5pbWF0aW9uTWF0ZXJpYWwgZnJvbSAnLi9CYXNlQW5pbWF0aW9uTWF0ZXJpYWwnO1xuXG4vKipcbiAqIEV4dGVuZHMgVEhSRUUuUG9pbnRzTWF0ZXJpYWwgd2l0aCBjdXN0b20gc2hhZGVyIGNodW5rcy5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gcGFyYW1ldGVycyBPYmplY3QgY29udGFpbmluZyBtYXRlcmlhbCBwcm9wZXJ0aWVzIGFuZCBjdXN0b20gc2hhZGVyIGNodW5rcy5cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBQb2ludHNBbmltYXRpb25NYXRlcmlhbChwYXJhbWV0ZXJzKSB7XG4gIHRoaXMudmFyeWluZ1BhcmFtZXRlcnMgPSBbXTtcbiAgXG4gIHRoaXMudmVydGV4RnVuY3Rpb25zID0gW107XG4gIHRoaXMudmVydGV4UGFyYW1ldGVycyA9IFtdO1xuICB0aGlzLnZlcnRleEluaXQgPSBbXTtcbiAgdGhpcy52ZXJ0ZXhQb3NpdGlvbiA9IFtdO1xuICB0aGlzLnZlcnRleENvbG9yID0gW107XG4gIFxuICB0aGlzLmZyYWdtZW50RnVuY3Rpb25zID0gW107XG4gIHRoaXMuZnJhZ21lbnRQYXJhbWV0ZXJzID0gW107XG4gIHRoaXMuZnJhZ21lbnRJbml0ID0gW107XG4gIHRoaXMuZnJhZ21lbnRNYXAgPSBbXTtcbiAgdGhpcy5mcmFnbWVudERpZmZ1c2UgPSBbXTtcbiAgLy8gdXNlIGZyYWdtZW50IHNoYWRlciB0byBzaGFwZSB0byBwb2ludCwgcmVmZXJlbmNlOiBodHRwczovL3RoZWJvb2tvZnNoYWRlcnMuY29tLzA3L1xuICB0aGlzLmZyYWdtZW50U2hhcGUgPSBbXTtcbiAgXG4gIEJhc2VBbmltYXRpb25NYXRlcmlhbC5jYWxsKHRoaXMsIHBhcmFtZXRlcnMsIFNoYWRlckxpYlsncG9pbnRzJ10udW5pZm9ybXMpO1xuICBcbiAgdGhpcy52ZXJ0ZXhTaGFkZXIgPSB0aGlzLmNvbmNhdFZlcnRleFNoYWRlcigpO1xuICB0aGlzLmZyYWdtZW50U2hhZGVyID0gdGhpcy5jb25jYXRGcmFnbWVudFNoYWRlcigpO1xufVxuXG5Qb2ludHNBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEJhc2VBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUpO1xuUG9pbnRzQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gUG9pbnRzQW5pbWF0aW9uTWF0ZXJpYWw7XG5cblBvaW50c0FuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZS5jb25jYXRWZXJ0ZXhTaGFkZXIgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiBgXG4gIHVuaWZvcm0gZmxvYXQgc2l6ZTtcbiAgdW5pZm9ybSBmbG9hdCBzY2FsZTtcbiAgXG4gICNpbmNsdWRlIDxjb21tb24+XG4gICNpbmNsdWRlIDxjb2xvcl9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPGZvZ19wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPHNoYWRvd21hcF9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPGxvZ2RlcHRoYnVmX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX3BhcnNfdmVydGV4PlxuICBcbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQYXJhbWV0ZXJzJyl9XG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmFyeWluZ1BhcmFtZXRlcnMnKX1cbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhGdW5jdGlvbnMnKX1cbiAgXG4gIHZvaWQgbWFpbigpIHtcbiAgXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhJbml0Jyl9XG4gIFxuICAgICNpbmNsdWRlIDxjb2xvcl92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPGJlZ2luX3ZlcnRleD5cbiAgICBcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBvc2l0aW9uJyl9XG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhDb2xvcicpfVxuICAgIFxuICAgICNpbmNsdWRlIDxwcm9qZWN0X3ZlcnRleD5cbiAgXG4gICAgI2lmZGVmIFVTRV9TSVpFQVRURU5VQVRJT05cbiAgICAgIGdsX1BvaW50U2l6ZSA9IHNpemUgKiAoIHNjYWxlIC8gLSBtdlBvc2l0aW9uLnogKTtcbiAgICAjZWxzZVxuICAgICAgZ2xfUG9pbnRTaXplID0gc2l6ZTtcbiAgICAjZW5kaWZcbiAgXG4gICAgI2luY2x1ZGUgPGxvZ2RlcHRoYnVmX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8d29ybGRwb3NfdmVydGV4PlxuICAgICNpbmNsdWRlIDxzaGFkb3dtYXBfdmVydGV4PlxuICAgICNpbmNsdWRlIDxmb2dfdmVydGV4PlxuICB9YDtcbn07XG5cblBvaW50c0FuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZS5jb25jYXRGcmFnbWVudFNoYWRlciA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIGBcbiAgdW5pZm9ybSB2ZWMzIGRpZmZ1c2U7XG4gIHVuaWZvcm0gZmxvYXQgb3BhY2l0eTtcbiAgXG4gICNpbmNsdWRlIDxjb21tb24+XG4gICNpbmNsdWRlIDxwYWNraW5nPlxuICAjaW5jbHVkZSA8Y29sb3JfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPG1hcF9wYXJ0aWNsZV9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8Zm9nX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxzaGFkb3dtYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGxvZ2RlcHRoYnVmX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfcGFyc19mcmFnbWVudD5cbiAgXG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRQYXJhbWV0ZXJzJyl9XG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmFyeWluZ1BhcmFtZXRlcnMnKX1cbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudEZ1bmN0aW9ucycpfVxuICBcbiAgdm9pZCBtYWluKCkge1xuICBcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50SW5pdCcpfVxuICBcbiAgICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX2ZyYWdtZW50PlxuICBcbiAgICB2ZWMzIG91dGdvaW5nTGlnaHQgPSB2ZWMzKCAwLjAgKTtcbiAgICB2ZWM0IGRpZmZ1c2VDb2xvciA9IHZlYzQoIGRpZmZ1c2UsIG9wYWNpdHkgKTtcbiAgXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudERpZmZ1c2UnKX1cbiAgXG4gICAgI2luY2x1ZGUgPGxvZ2RlcHRoYnVmX2ZyYWdtZW50PlxuXG4gICAgJHsodGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRNYXAnKSB8fCAnI2luY2x1ZGUgPG1hcF9wYXJ0aWNsZV9mcmFnbWVudD4nKX1cblxuICAgICNpbmNsdWRlIDxjb2xvcl9mcmFnbWVudD5cbiAgICAjaW5jbHVkZSA8YWxwaGF0ZXN0X2ZyYWdtZW50PlxuICBcbiAgICBvdXRnb2luZ0xpZ2h0ID0gZGlmZnVzZUNvbG9yLnJnYjtcbiAgXG4gICAgZ2xfRnJhZ0NvbG9yID0gdmVjNCggb3V0Z29pbmdMaWdodCwgZGlmZnVzZUNvbG9yLmEgKTtcbiAgICBcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50U2hhcGUnKX1cbiAgXG4gICAgI2luY2x1ZGUgPHByZW11bHRpcGxpZWRfYWxwaGFfZnJhZ21lbnQ+XG4gICAgI2luY2x1ZGUgPHRvbmVtYXBwaW5nX2ZyYWdtZW50PlxuICAgICNpbmNsdWRlIDxlbmNvZGluZ3NfZnJhZ21lbnQ+XG4gICAgI2luY2x1ZGUgPGZvZ19mcmFnbWVudD5cbiAgfWA7XG59O1xuXG5leHBvcnQgeyBQb2ludHNBbmltYXRpb25NYXRlcmlhbCB9O1xuIiwiaW1wb3J0IHsgU2hhZGVyTGliLCBVbmlmb3Jtc1V0aWxzLCBSR0JBRGVwdGhQYWNraW5nIH0gZnJvbSAndGhyZWUnO1xuaW1wb3J0IEJhc2VBbmltYXRpb25NYXRlcmlhbCBmcm9tICcuL0Jhc2VBbmltYXRpb25NYXRlcmlhbCc7XG5cbmZ1bmN0aW9uIERlcHRoQW5pbWF0aW9uTWF0ZXJpYWwocGFyYW1ldGVycykge1xuICB0aGlzLmRlcHRoUGFja2luZyA9IFJHQkFEZXB0aFBhY2tpbmc7XG4gIHRoaXMuY2xpcHBpbmcgPSB0cnVlO1xuXG4gIHRoaXMudmVydGV4RnVuY3Rpb25zID0gW107XG4gIHRoaXMudmVydGV4UGFyYW1ldGVycyA9IFtdO1xuICB0aGlzLnZlcnRleEluaXQgPSBbXTtcbiAgdGhpcy52ZXJ0ZXhQb3NpdGlvbiA9IFtdO1xuXG4gIEJhc2VBbmltYXRpb25NYXRlcmlhbC5jYWxsKHRoaXMsIHBhcmFtZXRlcnMpO1xuICBcbiAgdGhpcy51bmlmb3JtcyA9IFVuaWZvcm1zVXRpbHMubWVyZ2UoW1NoYWRlckxpYlsnZGVwdGgnXS51bmlmb3JtcywgdGhpcy51bmlmb3Jtc10pO1xuICB0aGlzLnZlcnRleFNoYWRlciA9IHRoaXMuY29uY2F0VmVydGV4U2hhZGVyKCk7XG4gIHRoaXMuZnJhZ21lbnRTaGFkZXIgPSBTaGFkZXJMaWJbJ2RlcHRoJ10uZnJhZ21lbnRTaGFkZXI7XG59XG5EZXB0aEFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoQmFzZUFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZSk7XG5EZXB0aEFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IERlcHRoQW5pbWF0aW9uTWF0ZXJpYWw7XG5cbkRlcHRoQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlLmNvbmNhdFZlcnRleFNoYWRlciA9IGZ1bmN0aW9uICgpIHtcbiAgXG4gIHJldHVybiBgXG4gICNpbmNsdWRlIDxjb21tb24+XG4gICNpbmNsdWRlIDx1dl9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPGRpc3BsYWNlbWVudG1hcF9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPG1vcnBodGFyZ2V0X3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8c2tpbm5pbmdfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc19wYXJzX3ZlcnRleD5cbiAgXG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UGFyYW1ldGVycycpfVxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleEZ1bmN0aW9ucycpfVxuICBcbiAgdm9pZCBtYWluKCkge1xuICBcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleEluaXQnKX1cbiAgXG4gICAgI2luY2x1ZGUgPHV2X3ZlcnRleD5cbiAgXG4gICAgI2luY2x1ZGUgPHNraW5iYXNlX3ZlcnRleD5cbiAgXG4gICAgI2lmZGVmIFVTRV9ESVNQTEFDRU1FTlRNQVBcbiAgXG4gICAgICAjaW5jbHVkZSA8YmVnaW5ub3JtYWxfdmVydGV4PlxuICAgICAgI2luY2x1ZGUgPG1vcnBobm9ybWFsX3ZlcnRleD5cbiAgICAgICNpbmNsdWRlIDxza2lubm9ybWFsX3ZlcnRleD5cbiAgXG4gICAgI2VuZGlmXG4gIFxuICAgICNpbmNsdWRlIDxiZWdpbl92ZXJ0ZXg+XG4gICAgXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQb3NpdGlvbicpfVxuXG4gICAgI2luY2x1ZGUgPG1vcnBodGFyZ2V0X3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8c2tpbm5pbmdfdmVydGV4PlxuICAgICNpbmNsdWRlIDxkaXNwbGFjZW1lbnRtYXBfdmVydGV4PlxuICAgICNpbmNsdWRlIDxwcm9qZWN0X3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfdmVydGV4PlxuICAgICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfdmVydGV4PlxuICB9YDtcbn07XG5cbmV4cG9ydCB7IERlcHRoQW5pbWF0aW9uTWF0ZXJpYWwgfTtcbiIsImltcG9ydCB7IFNoYWRlckxpYiwgVW5pZm9ybXNVdGlscywgUkdCQURlcHRoUGFja2luZyB9IGZyb20gJ3RocmVlJztcbmltcG9ydCBCYXNlQW5pbWF0aW9uTWF0ZXJpYWwgZnJvbSAnLi9CYXNlQW5pbWF0aW9uTWF0ZXJpYWwnO1xuXG5mdW5jdGlvbiBEaXN0YW5jZUFuaW1hdGlvbk1hdGVyaWFsKHBhcmFtZXRlcnMpIHtcbiAgdGhpcy5kZXB0aFBhY2tpbmcgPSBSR0JBRGVwdGhQYWNraW5nO1xuICB0aGlzLmNsaXBwaW5nID0gdHJ1ZTtcblxuICB0aGlzLnZlcnRleEZ1bmN0aW9ucyA9IFtdO1xuICB0aGlzLnZlcnRleFBhcmFtZXRlcnMgPSBbXTtcbiAgdGhpcy52ZXJ0ZXhJbml0ID0gW107XG4gIHRoaXMudmVydGV4UG9zaXRpb24gPSBbXTtcblxuICBCYXNlQW5pbWF0aW9uTWF0ZXJpYWwuY2FsbCh0aGlzLCBwYXJhbWV0ZXJzKTtcbiAgXG4gIHRoaXMudW5pZm9ybXMgPSBVbmlmb3Jtc1V0aWxzLm1lcmdlKFtTaGFkZXJMaWJbJ2Rpc3RhbmNlUkdCQSddLnVuaWZvcm1zLCB0aGlzLnVuaWZvcm1zXSk7XG4gIHRoaXMudmVydGV4U2hhZGVyID0gdGhpcy5jb25jYXRWZXJ0ZXhTaGFkZXIoKTtcbiAgdGhpcy5mcmFnbWVudFNoYWRlciA9IFNoYWRlckxpYlsnZGlzdGFuY2VSR0JBJ10uZnJhZ21lbnRTaGFkZXI7XG59XG5EaXN0YW5jZUFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoQmFzZUFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZSk7XG5EaXN0YW5jZUFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IERpc3RhbmNlQW5pbWF0aW9uTWF0ZXJpYWw7XG5cbkRpc3RhbmNlQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlLmNvbmNhdFZlcnRleFNoYWRlciA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIGBcbiAgI2RlZmluZSBESVNUQU5DRVxuXG4gIHZhcnlpbmcgdmVjMyB2V29ybGRQb3NpdGlvbjtcbiAgXG4gICNpbmNsdWRlIDxjb21tb24+XG4gICNpbmNsdWRlIDx1dl9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPGRpc3BsYWNlbWVudG1hcF9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPG1vcnBodGFyZ2V0X3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8c2tpbm5pbmdfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfcGFyc192ZXJ0ZXg+XG4gIFxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBhcmFtZXRlcnMnKX1cbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhGdW5jdGlvbnMnKX1cbiAgXG4gIHZvaWQgbWFpbigpIHtcblxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4SW5pdCcpfVxuICBcbiAgICAjaW5jbHVkZSA8dXZfdmVydGV4PlxuICBcbiAgICAjaW5jbHVkZSA8c2tpbmJhc2VfdmVydGV4PlxuICBcbiAgICAjaWZkZWYgVVNFX0RJU1BMQUNFTUVOVE1BUFxuICBcbiAgICAgICNpbmNsdWRlIDxiZWdpbm5vcm1hbF92ZXJ0ZXg+XG4gICAgICAjaW5jbHVkZSA8bW9ycGhub3JtYWxfdmVydGV4PlxuICAgICAgI2luY2x1ZGUgPHNraW5ub3JtYWxfdmVydGV4PlxuICBcbiAgICAjZW5kaWZcbiAgXG4gICAgI2luY2x1ZGUgPGJlZ2luX3ZlcnRleD5cbiAgICBcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBvc2l0aW9uJyl9XG5cbiAgICAjaW5jbHVkZSA8bW9ycGh0YXJnZXRfdmVydGV4PlxuICAgICNpbmNsdWRlIDxza2lubmluZ192ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPGRpc3BsYWNlbWVudG1hcF92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPHByb2plY3RfdmVydGV4PlxuICAgICNpbmNsdWRlIDx3b3JsZHBvc192ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc192ZXJ0ZXg+XG4gIFxuICAgIHZXb3JsZFBvc2l0aW9uID0gd29ybGRQb3NpdGlvbi54eXo7XG4gIFxuICB9YDtcbn07XG5cbmV4cG9ydCB7IERpc3RhbmNlQW5pbWF0aW9uTWF0ZXJpYWwgfTtcbiIsImltcG9ydCB7IEJ1ZmZlckdlb21ldHJ5LCBCdWZmZXJBdHRyaWJ1dGUsIFZlY3RvcjIgfSBmcm9tICd0aHJlZSc7XG4vKipcbiAqIEEgQnVmZmVyR2VvbWV0cnkgd2hlcmUgYSAncHJlZmFiJyBnZW9tZXRyeSBpcyByZXBlYXRlZCBhIG51bWJlciBvZiB0aW1lcy5cbiAqXG4gKiBAcGFyYW0ge0dlb21ldHJ5fEJ1ZmZlckdlb21ldHJ5fSBwcmVmYWIgVGhlIEdlb21ldHJ5IGluc3RhbmNlIHRvIHJlcGVhdC5cbiAqIEBwYXJhbSB7TnVtYmVyfSBjb3VudCBUaGUgbnVtYmVyIG9mIHRpbWVzIHRvIHJlcGVhdCB0aGUgZ2VvbWV0cnkuXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gUHJlZmFiQnVmZmVyR2VvbWV0cnkocHJlZmFiLCBjb3VudCkge1xuICBCdWZmZXJHZW9tZXRyeS5jYWxsKHRoaXMpO1xuICBcbiAgLyoqXG4gICAqIEEgcmVmZXJlbmNlIHRvIHRoZSBwcmVmYWIgZ2VvbWV0cnkgdXNlZCB0byBjcmVhdGUgdGhpcyBpbnN0YW5jZS5cbiAgICogQHR5cGUge0dlb21ldHJ5fEJ1ZmZlckdlb21ldHJ5fVxuICAgKi9cbiAgdGhpcy5wcmVmYWJHZW9tZXRyeSA9IHByZWZhYjtcbiAgdGhpcy5pc1ByZWZhYkJ1ZmZlckdlb21ldHJ5ID0gcHJlZmFiLmlzQnVmZmVyR2VvbWV0cnk7XG4gIFxuICAvKipcbiAgICogTnVtYmVyIG9mIHByZWZhYnMuXG4gICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAqL1xuICB0aGlzLnByZWZhYkNvdW50ID0gY291bnQ7XG4gIFxuICAvKipcbiAgICogTnVtYmVyIG9mIHZlcnRpY2VzIG9mIHRoZSBwcmVmYWIuXG4gICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAqL1xuICBpZiAodGhpcy5pc1ByZWZhYkJ1ZmZlckdlb21ldHJ5KSB7XG4gICAgdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudCA9IHByZWZhYi5hdHRyaWJ1dGVzLnBvc2l0aW9uLmNvdW50O1xuICB9XG4gIGVsc2Uge1xuICAgIHRoaXMucHJlZmFiVmVydGV4Q291bnQgPSBwcmVmYWIudmVydGljZXMubGVuZ3RoO1xuICB9XG5cbiAgdGhpcy5idWZmZXJJbmRpY2VzKCk7XG4gIHRoaXMuYnVmZmVyUG9zaXRpb25zKCk7XG59XG5QcmVmYWJCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZSk7XG5QcmVmYWJCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBQcmVmYWJCdWZmZXJHZW9tZXRyeTtcblxuUHJlZmFiQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmJ1ZmZlckluZGljZXMgPSBmdW5jdGlvbigpIHtcbiAgbGV0IHByZWZhYkluZGljZXMgPSBbXTtcbiAgbGV0IHByZWZhYkluZGV4Q291bnQ7XG5cbiAgaWYgKHRoaXMuaXNQcmVmYWJCdWZmZXJHZW9tZXRyeSkge1xuICAgIGlmICh0aGlzLnByZWZhYkdlb21ldHJ5LmluZGV4KSB7XG4gICAgICBwcmVmYWJJbmRleENvdW50ID0gdGhpcy5wcmVmYWJHZW9tZXRyeS5pbmRleC5jb3VudDtcbiAgICAgIHByZWZhYkluZGljZXMgPSB0aGlzLnByZWZhYkdlb21ldHJ5LmluZGV4LmFycmF5O1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHByZWZhYkluZGV4Q291bnQgPSB0aGlzLnByZWZhYlZlcnRleENvdW50O1xuXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHByZWZhYkluZGV4Q291bnQ7IGkrKykge1xuICAgICAgICBwcmVmYWJJbmRpY2VzLnB1c2goaSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGVsc2Uge1xuICAgIGNvbnN0IHByZWZhYkZhY2VDb3VudCA9IHRoaXMucHJlZmFiR2VvbWV0cnkuZmFjZXMubGVuZ3RoO1xuICAgIHByZWZhYkluZGV4Q291bnQgPSBwcmVmYWJGYWNlQ291bnQgKiAzO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcmVmYWJGYWNlQ291bnQ7IGkrKykge1xuICAgICAgY29uc3QgZmFjZSA9IHRoaXMucHJlZmFiR2VvbWV0cnkuZmFjZXNbaV07XG4gICAgICBwcmVmYWJJbmRpY2VzLnB1c2goZmFjZS5hLCBmYWNlLmIsIGZhY2UuYyk7XG4gICAgfVxuICB9XG5cbiAgY29uc3QgaW5kZXhCdWZmZXIgPSBuZXcgVWludDMyQXJyYXkodGhpcy5wcmVmYWJDb3VudCAqIHByZWZhYkluZGV4Q291bnQpO1xuXG4gIHRoaXMuc2V0SW5kZXgobmV3IEJ1ZmZlckF0dHJpYnV0ZShpbmRleEJ1ZmZlciwgMSkpO1xuICBcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnByZWZhYkNvdW50OyBpKyspIHtcbiAgICBmb3IgKGxldCBrID0gMDsgayA8IHByZWZhYkluZGV4Q291bnQ7IGsrKykge1xuICAgICAgaW5kZXhCdWZmZXJbaSAqIHByZWZhYkluZGV4Q291bnQgKyBrXSA9IHByZWZhYkluZGljZXNba10gKyBpICogdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudDtcbiAgICB9XG4gIH1cbn07XG5cblByZWZhYkJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5idWZmZXJQb3NpdGlvbnMgPSBmdW5jdGlvbigpIHtcbiAgY29uc3QgcG9zaXRpb25CdWZmZXIgPSB0aGlzLmNyZWF0ZUF0dHJpYnV0ZSgncG9zaXRpb24nLCAzKS5hcnJheTtcblxuICBpZiAodGhpcy5pc1ByZWZhYkJ1ZmZlckdlb21ldHJ5KSB7XG4gICAgY29uc3QgcG9zaXRpb25zID0gdGhpcy5wcmVmYWJHZW9tZXRyeS5hdHRyaWJ1dGVzLnBvc2l0aW9uLmFycmF5O1xuXG4gICAgZm9yIChsZXQgaSA9IDAsIG9mZnNldCA9IDA7IGkgPCB0aGlzLnByZWZhYkNvdW50OyBpKyspIHtcbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudDsgaisrLCBvZmZzZXQgKz0gMykge1xuICAgICAgICBwb3NpdGlvbkJ1ZmZlcltvZmZzZXQgICAgXSA9IHBvc2l0aW9uc1tqICogM107XG4gICAgICAgIHBvc2l0aW9uQnVmZmVyW29mZnNldCArIDFdID0gcG9zaXRpb25zW2ogKiAzICsgMV07XG4gICAgICAgIHBvc2l0aW9uQnVmZmVyW29mZnNldCArIDJdID0gcG9zaXRpb25zW2ogKiAzICsgMl07XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGVsc2Uge1xuICAgIGZvciAobGV0IGkgPSAwLCBvZmZzZXQgPSAwOyBpIDwgdGhpcy5wcmVmYWJDb3VudDsgaSsrKSB7XG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHRoaXMucHJlZmFiVmVydGV4Q291bnQ7IGorKywgb2Zmc2V0ICs9IDMpIHtcbiAgICAgICAgY29uc3QgcHJlZmFiVmVydGV4ID0gdGhpcy5wcmVmYWJHZW9tZXRyeS52ZXJ0aWNlc1tqXTtcblxuICAgICAgICBwb3NpdGlvbkJ1ZmZlcltvZmZzZXQgICAgXSA9IHByZWZhYlZlcnRleC54O1xuICAgICAgICBwb3NpdGlvbkJ1ZmZlcltvZmZzZXQgKyAxXSA9IHByZWZhYlZlcnRleC55O1xuICAgICAgICBwb3NpdGlvbkJ1ZmZlcltvZmZzZXQgKyAyXSA9IHByZWZhYlZlcnRleC56O1xuICAgICAgfVxuICAgIH1cbiAgfVxufTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgQnVmZmVyQXR0cmlidXRlIHdpdGggVVYgY29vcmRpbmF0ZXMuXG4gKi9cblByZWZhYkJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5idWZmZXJVdnMgPSBmdW5jdGlvbigpIHtcbiAgY29uc3QgcHJlZmFiVXZzID0gW107XG5cbiAgaWYgKHRoaXMuaXNQcmVmYWJCdWZmZXJHZW9tZXRyeSkge1xuICAgIGNvbnN0IHV2ID0gdGhpcy5wcmVmYWJHZW9tZXRyeS5hdHRyaWJ1dGVzLnV2LmFycmF5O1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnByZWZhYlZlcnRleENvdW50OyBpKyspIHtcbiAgICAgIHByZWZhYlV2cy5wdXNoKG5ldyBWZWN0b3IyKHV2W2kgKiAyXSwgdXZbaSAqIDIgKyAxXSkpO1xuICAgIH1cbiAgfVxuICBlbHNlIHtcbiAgICBjb25zdCBwcmVmYWJGYWNlQ291bnQgPSB0aGlzLnByZWZhYkdlb21ldHJ5LmZhY2VzLmxlbmd0aDtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHJlZmFiRmFjZUNvdW50OyBpKyspIHtcbiAgICAgIGNvbnN0IGZhY2UgPSB0aGlzLnByZWZhYkdlb21ldHJ5LmZhY2VzW2ldO1xuICAgICAgY29uc3QgdXYgPSB0aGlzLnByZWZhYkdlb21ldHJ5LmZhY2VWZXJ0ZXhVdnNbMF1baV07XG5cbiAgICAgIHByZWZhYlV2c1tmYWNlLmFdID0gdXZbMF07XG4gICAgICBwcmVmYWJVdnNbZmFjZS5iXSA9IHV2WzFdO1xuICAgICAgcHJlZmFiVXZzW2ZhY2UuY10gPSB1dlsyXTtcbiAgICB9XG4gIH1cblxuICBjb25zdCB1dkJ1ZmZlciA9IHRoaXMuY3JlYXRlQXR0cmlidXRlKCd1dicsIDIpO1xuICBcbiAgZm9yIChsZXQgaSA9IDAsIG9mZnNldCA9IDA7IGkgPCB0aGlzLnByZWZhYkNvdW50OyBpKyspIHtcbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IHRoaXMucHJlZmFiVmVydGV4Q291bnQ7IGorKywgb2Zmc2V0ICs9IDIpIHtcbiAgICAgIGxldCBwcmVmYWJVdiA9IHByZWZhYlV2c1tqXTtcbiAgICAgIFxuICAgICAgdXZCdWZmZXIuYXJyYXlbb2Zmc2V0XSA9IHByZWZhYlV2Lng7XG4gICAgICB1dkJ1ZmZlci5hcnJheVtvZmZzZXQgKyAxXSA9IHByZWZhYlV2Lnk7XG4gICAgfVxuICB9XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBCdWZmZXJBdHRyaWJ1dGUgb24gdGhpcyBnZW9tZXRyeSBpbnN0YW5jZS5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZSBOYW1lIG9mIHRoZSBhdHRyaWJ1dGUuXG4gKiBAcGFyYW0ge051bWJlcn0gaXRlbVNpemUgTnVtYmVyIG9mIGZsb2F0cyBwZXIgdmVydGV4ICh0eXBpY2FsbHkgMSwgMiwgMyBvciA0KS5cbiAqIEBwYXJhbSB7ZnVuY3Rpb249fSBmYWN0b3J5IEZ1bmN0aW9uIHRoYXQgd2lsbCBiZSBjYWxsZWQgZm9yIGVhY2ggcHJlZmFiIHVwb24gY3JlYXRpb24uIEFjY2VwdHMgMyBhcmd1bWVudHM6IGRhdGFbXSwgaW5kZXggYW5kIHByZWZhYkNvdW50LiBDYWxscyBzZXRQcmVmYWJEYXRhLlxuICpcbiAqIEByZXR1cm5zIHtCdWZmZXJBdHRyaWJ1dGV9XG4gKi9cblByZWZhYkJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5jcmVhdGVBdHRyaWJ1dGUgPSBmdW5jdGlvbihuYW1lLCBpdGVtU2l6ZSwgZmFjdG9yeSkge1xuICBjb25zdCBidWZmZXIgPSBuZXcgRmxvYXQzMkFycmF5KHRoaXMucHJlZmFiQ291bnQgKiB0aGlzLnByZWZhYlZlcnRleENvdW50ICogaXRlbVNpemUpO1xuICBjb25zdCBhdHRyaWJ1dGUgPSBuZXcgQnVmZmVyQXR0cmlidXRlKGJ1ZmZlciwgaXRlbVNpemUpO1xuICBcbiAgdGhpcy5hZGRBdHRyaWJ1dGUobmFtZSwgYXR0cmlidXRlKTtcbiAgXG4gIGlmIChmYWN0b3J5KSB7XG4gICAgY29uc3QgZGF0YSA9IFtdO1xuICAgIFxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5wcmVmYWJDb3VudDsgaSsrKSB7XG4gICAgICBmYWN0b3J5KGRhdGEsIGksIHRoaXMucHJlZmFiQ291bnQpO1xuICAgICAgdGhpcy5zZXRQcmVmYWJEYXRhKGF0dHJpYnV0ZSwgaSwgZGF0YSk7XG4gICAgfVxuICB9XG4gIFxuICByZXR1cm4gYXR0cmlidXRlO1xufTtcblxuLyoqXG4gKiBTZXRzIGRhdGEgZm9yIGFsbCB2ZXJ0aWNlcyBvZiBhIHByZWZhYiBhdCBhIGdpdmVuIGluZGV4LlxuICogVXN1YWxseSBjYWxsZWQgaW4gYSBsb29wLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfEJ1ZmZlckF0dHJpYnV0ZX0gYXR0cmlidXRlIFRoZSBhdHRyaWJ1dGUgb3IgYXR0cmlidXRlIG5hbWUgd2hlcmUgdGhlIGRhdGEgaXMgdG8gYmUgc3RvcmVkLlxuICogQHBhcmFtIHtOdW1iZXJ9IHByZWZhYkluZGV4IEluZGV4IG9mIHRoZSBwcmVmYWIgaW4gdGhlIGJ1ZmZlciBnZW9tZXRyeS5cbiAqIEBwYXJhbSB7QXJyYXl9IGRhdGEgQXJyYXkgb2YgZGF0YS4gTGVuZ3RoIHNob3VsZCBiZSBlcXVhbCB0byBpdGVtIHNpemUgb2YgdGhlIGF0dHJpYnV0ZS5cbiAqL1xuUHJlZmFiQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLnNldFByZWZhYkRhdGEgPSBmdW5jdGlvbihhdHRyaWJ1dGUsIHByZWZhYkluZGV4LCBkYXRhKSB7XG4gIGF0dHJpYnV0ZSA9ICh0eXBlb2YgYXR0cmlidXRlID09PSAnc3RyaW5nJykgPyB0aGlzLmF0dHJpYnV0ZXNbYXR0cmlidXRlXSA6IGF0dHJpYnV0ZTtcbiAgXG4gIGxldCBvZmZzZXQgPSBwcmVmYWJJbmRleCAqIHRoaXMucHJlZmFiVmVydGV4Q291bnQgKiBhdHRyaWJ1dGUuaXRlbVNpemU7XG4gIFxuICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucHJlZmFiVmVydGV4Q291bnQ7IGkrKykge1xuICAgIGZvciAobGV0IGogPSAwOyBqIDwgYXR0cmlidXRlLml0ZW1TaXplOyBqKyspIHtcbiAgICAgIGF0dHJpYnV0ZS5hcnJheVtvZmZzZXQrK10gPSBkYXRhW2pdO1xuICAgIH1cbiAgfVxufTtcblxuZXhwb3J0IHsgUHJlZmFiQnVmZmVyR2VvbWV0cnkgfTtcbiIsImltcG9ydCB7IEJ1ZmZlckdlb21ldHJ5LCBCdWZmZXJBdHRyaWJ1dGUgfSBmcm9tICd0aHJlZSc7XG4vKipcbiAqIEEgQnVmZmVyR2VvbWV0cnkgd2hlcmUgYSAncHJlZmFiJyBnZW9tZXRyeSBhcnJheSBpcyByZXBlYXRlZCBhIG51bWJlciBvZiB0aW1lcy5cbiAqXG4gKiBAcGFyYW0ge0FycmF5fSBwcmVmYWJzIEFuIGFycmF5IHdpdGggR2VvbWV0cnkgaW5zdGFuY2VzIHRvIHJlcGVhdC5cbiAqIEBwYXJhbSB7TnVtYmVyfSByZXBlYXRDb3VudCBUaGUgbnVtYmVyIG9mIHRpbWVzIHRvIHJlcGVhdCB0aGUgYXJyYXkgb2YgR2VvbWV0cmllcy5cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBNdWx0aVByZWZhYkJ1ZmZlckdlb21ldHJ5KHByZWZhYnMsIHJlcGVhdENvdW50KSB7XG4gIEJ1ZmZlckdlb21ldHJ5LmNhbGwodGhpcyk7XG5cbiAgaWYgKEFycmF5LmlzQXJyYXkocHJlZmFicykpIHtcbiAgICB0aGlzLnByZWZhYkdlb21ldHJpZXMgPSBwcmVmYWJzO1xuICB9IGVsc2Uge1xuICAgIHRoaXMucHJlZmFiR2VvbWV0cmllcyA9IFtwcmVmYWJzXTtcbiAgfVxuXG4gIHRoaXMucHJlZmFiR2VvbWV0cmllc0NvdW50ID0gdGhpcy5wcmVmYWJHZW9tZXRyaWVzLmxlbmd0aDtcblxuICAvKipcbiAgICogTnVtYmVyIG9mIHByZWZhYnMuXG4gICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAqL1xuICB0aGlzLnByZWZhYkNvdW50ID0gcmVwZWF0Q291bnQgKiB0aGlzLnByZWZhYkdlb21ldHJpZXNDb3VudDtcbiAgdGhpcy5yZXBlYXRDb3VudCA9IHJlcGVhdENvdW50O1xuICBcbiAgLyoqXG4gICAqIEFycmF5IG9mIHZlcnRleCBjb3VudHMgcGVyIHByZWZhYi5cbiAgICogQHR5cGUge0FycmF5fVxuICAgKi9cbiAgdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudHMgPSB0aGlzLnByZWZhYkdlb21ldHJpZXMubWFwKHAgPT4gcC5pc0J1ZmZlckdlb21ldHJ5ID8gcC5hdHRyaWJ1dGVzLnBvc2l0aW9uLmNvdW50IDogcC52ZXJ0aWNlcy5sZW5ndGgpO1xuICB0aGlzLnJlcGVhdFZlcnRleENvdW50ID0gdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudHMucmVkdWNlKChyLCB2KSA9PiByICsgdiwgMCk7XG5cbiAgdGhpcy5idWZmZXJJbmRpY2VzKCk7XG4gIHRoaXMuYnVmZmVyUG9zaXRpb25zKCk7XG59XG5NdWx0aVByZWZhYkJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlKTtcbk11bHRpUHJlZmFiQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gTXVsdGlQcmVmYWJCdWZmZXJHZW9tZXRyeTtcblxuTXVsdGlQcmVmYWJCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuYnVmZmVySW5kaWNlcyA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLnByZWZhYkluZGljZXMgPSBbXTtcbiAgbGV0IHJlcGVhdEluZGV4Q291bnQgPSAwO1xuXG4gIHRoaXMucHJlZmFiR2VvbWV0cmllcy5mb3JFYWNoKGdlb21ldHJ5ID0+IHtcbiAgICBsZXQgaW5kaWNlcyA9IFtdO1xuXG4gICAgaWYgKGdlb21ldHJ5LmlzQnVmZmVyR2VvbWV0cnkpIHtcbiAgICAgIGlmIChnZW9tZXRyeS5pbmRleCkge1xuICAgICAgICBpbmRpY2VzID0gZ2VvbWV0cnkuaW5kZXguYXJyYXk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGdlb21ldHJ5LmF0dHJpYnV0ZXMucG9zaXRpb24uY291bnQ7IGkrKykge1xuICAgICAgICAgIGluZGljZXMucHVzaChpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGdlb21ldHJ5LmZhY2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGZhY2UgPSBnZW9tZXRyeS5mYWNlc1tpXTtcbiAgICAgICAgaW5kaWNlcy5wdXNoKGZhY2UuYSwgZmFjZS5iLCBmYWNlLmMpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMucHJlZmFiSW5kaWNlcy5wdXNoKGluZGljZXMpO1xuXG4gICAgcmVwZWF0SW5kZXhDb3VudCArPSBpbmRpY2VzLmxlbmd0aDtcbiAgfSk7XG5cbiAgY29uc3QgaW5kZXhCdWZmZXIgPSBuZXcgVWludDMyQXJyYXkocmVwZWF0SW5kZXhDb3VudCAqIHRoaXMucmVwZWF0Q291bnQpO1xuICBsZXQgaW5kZXhPZmZzZXQgPSAwO1xuICBsZXQgcHJlZmFiT2Zmc2V0ID0gMDtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucHJlZmFiQ291bnQ7IGkrKykge1xuICAgIGNvbnN0IGluZGV4ID0gaSAlIHRoaXMucHJlZmFiR2VvbWV0cmllc0NvdW50O1xuICAgIGNvbnN0IGluZGljZXMgPSB0aGlzLnByZWZhYkluZGljZXNbaW5kZXhdO1xuICAgIGNvbnN0IHZlcnRleENvdW50ID0gdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudHNbaW5kZXhdO1xuXG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCBpbmRpY2VzLmxlbmd0aDsgaisrKSB7XG4gICAgICBpbmRleEJ1ZmZlcltpbmRleE9mZnNldCsrXSA9IGluZGljZXNbal0gKyBwcmVmYWJPZmZzZXQ7XG4gICAgfVxuXG4gICAgcHJlZmFiT2Zmc2V0ICs9IHZlcnRleENvdW50O1xuICB9XG5cbiAgdGhpcy5zZXRJbmRleChuZXcgQnVmZmVyQXR0cmlidXRlKGluZGV4QnVmZmVyLCAxKSk7XG59O1xuXG5NdWx0aVByZWZhYkJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5idWZmZXJQb3NpdGlvbnMgPSBmdW5jdGlvbigpIHtcbiAgY29uc3QgcG9zaXRpb25CdWZmZXIgPSB0aGlzLmNyZWF0ZUF0dHJpYnV0ZSgncG9zaXRpb24nLCAzKS5hcnJheTtcblxuICBjb25zdCBwcmVmYWJQb3NpdGlvbnMgPSB0aGlzLnByZWZhYkdlb21ldHJpZXMubWFwKChnZW9tZXRyeSwgaSkgPT4ge1xuICAgIGxldCBwb3NpdGlvbnM7XG5cbiAgICBpZiAoZ2VvbWV0cnkuaXNCdWZmZXJHZW9tZXRyeSkge1xuICAgICAgcG9zaXRpb25zID0gZ2VvbWV0cnkuYXR0cmlidXRlcy5wb3NpdGlvbi5hcnJheTtcbiAgICB9IGVsc2Uge1xuXG4gICAgICBjb25zdCB2ZXJ0ZXhDb3VudCA9IHRoaXMucHJlZmFiVmVydGV4Q291bnRzW2ldO1xuXG4gICAgICBwb3NpdGlvbnMgPSBbXTtcblxuICAgICAgZm9yIChsZXQgaiA9IDAsIG9mZnNldCA9IDA7IGogPCB2ZXJ0ZXhDb3VudDsgaisrKSB7XG4gICAgICAgIGNvbnN0IHByZWZhYlZlcnRleCA9IGdlb21ldHJ5LnZlcnRpY2VzW2pdO1xuXG4gICAgICAgIHBvc2l0aW9uc1tvZmZzZXQrK10gPSBwcmVmYWJWZXJ0ZXgueDtcbiAgICAgICAgcG9zaXRpb25zW29mZnNldCsrXSA9IHByZWZhYlZlcnRleC55O1xuICAgICAgICBwb3NpdGlvbnNbb2Zmc2V0KytdID0gcHJlZmFiVmVydGV4Lno7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHBvc2l0aW9ucztcbiAgfSk7XG5cbiAgZm9yIChsZXQgaSA9IDAsIG9mZnNldCA9IDA7IGkgPCB0aGlzLnByZWZhYkNvdW50OyBpKyspIHtcbiAgICBjb25zdCBpbmRleCA9IGkgJSB0aGlzLnByZWZhYkdlb21ldHJpZXMubGVuZ3RoO1xuICAgIGNvbnN0IHZlcnRleENvdW50ID0gdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudHNbaW5kZXhdO1xuICAgIGNvbnN0IHBvc2l0aW9ucyA9IHByZWZhYlBvc2l0aW9uc1tpbmRleF07XG5cbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IHZlcnRleENvdW50OyBqKyspIHtcbiAgICAgIHBvc2l0aW9uQnVmZmVyW29mZnNldCsrXSA9IHBvc2l0aW9uc1tqICogM107XG4gICAgICBwb3NpdGlvbkJ1ZmZlcltvZmZzZXQrK10gPSBwb3NpdGlvbnNbaiAqIDMgKyAxXTtcbiAgICAgIHBvc2l0aW9uQnVmZmVyW29mZnNldCsrXSA9IHBvc2l0aW9uc1tqICogMyArIDJdO1xuICAgIH1cbiAgfVxufTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgQnVmZmVyQXR0cmlidXRlIHdpdGggVVYgY29vcmRpbmF0ZXMuXG4gKi9cbk11bHRpUHJlZmFiQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmJ1ZmZlclV2cyA9IGZ1bmN0aW9uKCkge1xuICBjb25zdCB1dkJ1ZmZlciA9IHRoaXMuY3JlYXRlQXR0cmlidXRlKCd1dicsIDIpLmFycmF5O1xuXG4gIGNvbnN0IHByZWZhYlV2cyA9IHRoaXMucHJlZmFiR2VvbWV0cmllcy5tYXAoKGdlb21ldHJ5LCBpKSA9PiB7XG4gICAgbGV0IHV2cztcblxuICAgIGlmIChnZW9tZXRyeS5pc0J1ZmZlckdlb21ldHJ5KSB7XG4gICAgICBpZiAoIWdlb21ldHJ5LmF0dHJpYnV0ZXMudXYpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignTm8gVVYgZm91bmQgaW4gcHJlZmFiIGdlb21ldHJ5JywgZ2VvbWV0cnkpO1xuICAgICAgfVxuXG4gICAgICB1dnMgPSBnZW9tZXRyeS5hdHRyaWJ1dGVzLnV2LmFycmF5O1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBwcmVmYWJGYWNlQ291bnQgPSB0aGlzLnByZWZhYkluZGljZXNbaV0ubGVuZ3RoIC8gMztcbiAgICAgIGNvbnN0IHV2T2JqZWN0cyA9IFtdO1xuXG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHByZWZhYkZhY2VDb3VudDsgaisrKSB7XG4gICAgICAgIGNvbnN0IGZhY2UgPSBnZW9tZXRyeS5mYWNlc1tqXTtcbiAgICAgICAgY29uc3QgdXYgPSBnZW9tZXRyeS5mYWNlVmVydGV4VXZzWzBdW2pdO1xuXG4gICAgICAgIHV2T2JqZWN0c1tmYWNlLmFdID0gdXZbMF07XG4gICAgICAgIHV2T2JqZWN0c1tmYWNlLmJdID0gdXZbMV07XG4gICAgICAgIHV2T2JqZWN0c1tmYWNlLmNdID0gdXZbMl07XG4gICAgICB9XG5cbiAgICAgIHV2cyA9IFtdO1xuXG4gICAgICBmb3IgKGxldCBrID0gMDsgayA8IHV2T2JqZWN0cy5sZW5ndGg7IGsrKykge1xuICAgICAgICB1dnNbayAqIDJdID0gdXZPYmplY3RzW2tdLng7XG4gICAgICAgIHV2c1trICogMiArIDFdID0gdXZPYmplY3RzW2tdLnk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHV2cztcbiAgfSk7XG5cbiAgZm9yIChsZXQgaSA9IDAsIG9mZnNldCA9IDA7IGkgPCB0aGlzLnByZWZhYkNvdW50OyBpKyspIHtcblxuICAgIGNvbnN0IGluZGV4ID0gaSAlIHRoaXMucHJlZmFiR2VvbWV0cmllcy5sZW5ndGg7XG4gICAgY29uc3QgdmVydGV4Q291bnQgPSB0aGlzLnByZWZhYlZlcnRleENvdW50c1tpbmRleF07XG4gICAgY29uc3QgdXZzID0gcHJlZmFiVXZzW2luZGV4XTtcblxuICAgIGZvciAobGV0IGogPSAwOyBqIDwgdmVydGV4Q291bnQ7IGorKykge1xuICAgICAgdXZCdWZmZXJbb2Zmc2V0KytdID0gdXZzW2ogKiAyXTtcbiAgICAgIHV2QnVmZmVyW29mZnNldCsrXSA9IHV2c1tqICogMiArIDFdO1xuICAgIH1cbiAgfVxufTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgQnVmZmVyQXR0cmlidXRlIG9uIHRoaXMgZ2VvbWV0cnkgaW5zdGFuY2UuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgTmFtZSBvZiB0aGUgYXR0cmlidXRlLlxuICogQHBhcmFtIHtOdW1iZXJ9IGl0ZW1TaXplIE51bWJlciBvZiBmbG9hdHMgcGVyIHZlcnRleCAodHlwaWNhbGx5IDEsIDIsIDMgb3IgNCkuXG4gKiBAcGFyYW0ge2Z1bmN0aW9uPX0gZmFjdG9yeSBGdW5jdGlvbiB0aGF0IHdpbGwgYmUgY2FsbGVkIGZvciBlYWNoIHByZWZhYiB1cG9uIGNyZWF0aW9uLiBBY2NlcHRzIDMgYXJndW1lbnRzOiBkYXRhW10sIGluZGV4IGFuZCBwcmVmYWJDb3VudC4gQ2FsbHMgc2V0UHJlZmFiRGF0YS5cbiAqXG4gKiBAcmV0dXJucyB7QnVmZmVyQXR0cmlidXRlfVxuICovXG5NdWx0aVByZWZhYkJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5jcmVhdGVBdHRyaWJ1dGUgPSBmdW5jdGlvbihuYW1lLCBpdGVtU2l6ZSwgZmFjdG9yeSkge1xuICBjb25zdCBidWZmZXIgPSBuZXcgRmxvYXQzMkFycmF5KHRoaXMucmVwZWF0Q291bnQgKiB0aGlzLnJlcGVhdFZlcnRleENvdW50ICogaXRlbVNpemUpO1xuICBjb25zdCBhdHRyaWJ1dGUgPSBuZXcgQnVmZmVyQXR0cmlidXRlKGJ1ZmZlciwgaXRlbVNpemUpO1xuICBcbiAgdGhpcy5hZGRBdHRyaWJ1dGUobmFtZSwgYXR0cmlidXRlKTtcbiAgXG4gIGlmIChmYWN0b3J5KSB7XG4gICAgY29uc3QgZGF0YSA9IFtdO1xuICAgIFxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5wcmVmYWJDb3VudDsgaSsrKSB7XG4gICAgICBmYWN0b3J5KGRhdGEsIGksIHRoaXMucHJlZmFiQ291bnQpO1xuICAgICAgdGhpcy5zZXRQcmVmYWJEYXRhKGF0dHJpYnV0ZSwgaSwgZGF0YSk7XG4gICAgfVxuICB9XG4gIFxuICByZXR1cm4gYXR0cmlidXRlO1xufTtcblxuLyoqXG4gKiBTZXRzIGRhdGEgZm9yIGFsbCB2ZXJ0aWNlcyBvZiBhIHByZWZhYiBhdCBhIGdpdmVuIGluZGV4LlxuICogVXN1YWxseSBjYWxsZWQgaW4gYSBsb29wLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfEJ1ZmZlckF0dHJpYnV0ZX0gYXR0cmlidXRlIFRoZSBhdHRyaWJ1dGUgb3IgYXR0cmlidXRlIG5hbWUgd2hlcmUgdGhlIGRhdGEgaXMgdG8gYmUgc3RvcmVkLlxuICogQHBhcmFtIHtOdW1iZXJ9IHByZWZhYkluZGV4IEluZGV4IG9mIHRoZSBwcmVmYWIgaW4gdGhlIGJ1ZmZlciBnZW9tZXRyeS5cbiAqIEBwYXJhbSB7QXJyYXl9IGRhdGEgQXJyYXkgb2YgZGF0YS4gTGVuZ3RoIHNob3VsZCBiZSBlcXVhbCB0byBpdGVtIHNpemUgb2YgdGhlIGF0dHJpYnV0ZS5cbiAqL1xuTXVsdGlQcmVmYWJCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuc2V0UHJlZmFiRGF0YSA9IGZ1bmN0aW9uKGF0dHJpYnV0ZSwgcHJlZmFiSW5kZXgsIGRhdGEpIHtcbiAgYXR0cmlidXRlID0gKHR5cGVvZiBhdHRyaWJ1dGUgPT09ICdzdHJpbmcnKSA/IHRoaXMuYXR0cmlidXRlc1thdHRyaWJ1dGVdIDogYXR0cmlidXRlO1xuXG4gIGNvbnN0IHByZWZhYkdlb21ldHJ5SW5kZXggPSBwcmVmYWJJbmRleCAlIHRoaXMucHJlZmFiR2VvbWV0cmllc0NvdW50O1xuICBjb25zdCBwcmVmYWJHZW9tZXRyeVZlcnRleENvdW50ID0gdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudHNbcHJlZmFiR2VvbWV0cnlJbmRleF07XG4gIGNvbnN0IHdob2xlID0gKHByZWZhYkluZGV4IC8gdGhpcy5wcmVmYWJHZW9tZXRyaWVzQ291bnQgfCAwKSAqIHRoaXMucHJlZmFiR2VvbWV0cmllc0NvdW50O1xuICBjb25zdCB3aG9sZU9mZnNldCA9IHdob2xlICogdGhpcy5yZXBlYXRWZXJ0ZXhDb3VudDtcbiAgY29uc3QgcGFydCA9IHByZWZhYkluZGV4IC0gd2hvbGU7XG4gIGxldCBwYXJ0T2Zmc2V0ID0gMDtcbiAgbGV0IGkgPSAwO1xuXG4gIHdoaWxlKGkgPCBwYXJ0KSB7XG4gICAgcGFydE9mZnNldCArPSB0aGlzLnByZWZhYlZlcnRleENvdW50c1tpKytdO1xuICB9XG5cbiAgbGV0IG9mZnNldCA9ICh3aG9sZU9mZnNldCArIHBhcnRPZmZzZXQpICogYXR0cmlidXRlLml0ZW1TaXplO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgcHJlZmFiR2VvbWV0cnlWZXJ0ZXhDb3VudDsgaSsrKSB7XG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCBhdHRyaWJ1dGUuaXRlbVNpemU7IGorKykge1xuICAgICAgYXR0cmlidXRlLmFycmF5W29mZnNldCsrXSA9IGRhdGFbal07XG4gICAgfVxuICB9XG59O1xuXG5leHBvcnQgeyBNdWx0aVByZWZhYkJ1ZmZlckdlb21ldHJ5IH07XG4iLCJpbXBvcnQgeyBNYXRoIGFzIHRNYXRoLCBWZWN0b3IzIH0gZnJvbSAndGhyZWUnO1xuaW1wb3J0IHsgRGVwdGhBbmltYXRpb25NYXRlcmlhbCB9IGZyb20gJy4vbWF0ZXJpYWxzL0RlcHRoQW5pbWF0aW9uTWF0ZXJpYWwnO1xuaW1wb3J0IHsgRGlzdGFuY2VBbmltYXRpb25NYXRlcmlhbCB9IGZyb20gJy4vbWF0ZXJpYWxzL0Rpc3RhbmNlQW5pbWF0aW9uTWF0ZXJpYWwnO1xuXG4vKipcbiAqIENvbGxlY3Rpb24gb2YgdXRpbGl0eSBmdW5jdGlvbnMuXG4gKiBAbmFtZXNwYWNlXG4gKi9cbmNvbnN0IFV0aWxzID0ge1xuICAvKipcbiAgICogRHVwbGljYXRlcyB2ZXJ0aWNlcyBzbyBlYWNoIGZhY2UgYmVjb21lcyBzZXBhcmF0ZS5cbiAgICogU2FtZSBhcyBUSFJFRS5FeHBsb2RlTW9kaWZpZXIuXG4gICAqXG4gICAqIEBwYXJhbSB7VEhSRUUuR2VvbWV0cnl9IGdlb21ldHJ5IEdlb21ldHJ5IGluc3RhbmNlIHRvIG1vZGlmeS5cbiAgICovXG4gIHNlcGFyYXRlRmFjZXM6IGZ1bmN0aW9uIChnZW9tZXRyeSkge1xuICAgIGxldCB2ZXJ0aWNlcyA9IFtdO1xuXG4gICAgZm9yIChsZXQgaSA9IDAsIGlsID0gZ2VvbWV0cnkuZmFjZXMubGVuZ3RoOyBpIDwgaWw7IGkrKykge1xuICAgICAgbGV0IG4gPSB2ZXJ0aWNlcy5sZW5ndGg7XG4gICAgICBsZXQgZmFjZSA9IGdlb21ldHJ5LmZhY2VzW2ldO1xuXG4gICAgICBsZXQgYSA9IGZhY2UuYTtcbiAgICAgIGxldCBiID0gZmFjZS5iO1xuICAgICAgbGV0IGMgPSBmYWNlLmM7XG5cbiAgICAgIGxldCB2YSA9IGdlb21ldHJ5LnZlcnRpY2VzW2FdO1xuICAgICAgbGV0IHZiID0gZ2VvbWV0cnkudmVydGljZXNbYl07XG4gICAgICBsZXQgdmMgPSBnZW9tZXRyeS52ZXJ0aWNlc1tjXTtcblxuICAgICAgdmVydGljZXMucHVzaCh2YS5jbG9uZSgpKTtcbiAgICAgIHZlcnRpY2VzLnB1c2godmIuY2xvbmUoKSk7XG4gICAgICB2ZXJ0aWNlcy5wdXNoKHZjLmNsb25lKCkpO1xuXG4gICAgICBmYWNlLmEgPSBuO1xuICAgICAgZmFjZS5iID0gbiArIDE7XG4gICAgICBmYWNlLmMgPSBuICsgMjtcbiAgICB9XG5cbiAgICBnZW9tZXRyeS52ZXJ0aWNlcyA9IHZlcnRpY2VzO1xuICB9LFxuXG4gIC8qKlxuICAgKiBDb21wdXRlIHRoZSBjZW50cm9pZCAoY2VudGVyKSBvZiBhIFRIUkVFLkZhY2UzLlxuICAgKlxuICAgKiBAcGFyYW0ge1RIUkVFLkdlb21ldHJ5fSBnZW9tZXRyeSBHZW9tZXRyeSBpbnN0YW5jZSB0aGUgZmFjZSBpcyBpbi5cbiAgICogQHBhcmFtIHtUSFJFRS5GYWNlM30gZmFjZSBGYWNlIG9iamVjdCBmcm9tIHRoZSBUSFJFRS5HZW9tZXRyeS5mYWNlcyBhcnJheVxuICAgKiBAcGFyYW0ge1RIUkVFLlZlY3RvcjM9fSB2IE9wdGlvbmFsIHZlY3RvciB0byBzdG9yZSByZXN1bHQgaW4uXG4gICAqIEByZXR1cm5zIHtUSFJFRS5WZWN0b3IzfVxuICAgKi9cbiAgY29tcHV0ZUNlbnRyb2lkOiBmdW5jdGlvbihnZW9tZXRyeSwgZmFjZSwgdikge1xuICAgIGxldCBhID0gZ2VvbWV0cnkudmVydGljZXNbZmFjZS5hXTtcbiAgICBsZXQgYiA9IGdlb21ldHJ5LnZlcnRpY2VzW2ZhY2UuYl07XG4gICAgbGV0IGMgPSBnZW9tZXRyeS52ZXJ0aWNlc1tmYWNlLmNdO1xuXG4gICAgdiA9IHYgfHwgbmV3IFRIUkVFLlZlY3RvcjMoKTtcblxuICAgIHYueCA9IChhLnggKyBiLnggKyBjLngpIC8gMztcbiAgICB2LnkgPSAoYS55ICsgYi55ICsgYy55KSAvIDM7XG4gICAgdi56ID0gKGEueiArIGIueiArIGMueikgLyAzO1xuXG4gICAgcmV0dXJuIHY7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEdldCBhIHJhbmRvbSB2ZWN0b3IgYmV0d2VlbiBib3gubWluIGFuZCBib3gubWF4LlxuICAgKlxuICAgKiBAcGFyYW0ge1RIUkVFLkJveDN9IGJveCBUSFJFRS5Cb3gzIGluc3RhbmNlLlxuICAgKiBAcGFyYW0ge1RIUkVFLlZlY3RvcjM9fSB2IE9wdGlvbmFsIHZlY3RvciB0byBzdG9yZSByZXN1bHQgaW4uXG4gICAqIEByZXR1cm5zIHtUSFJFRS5WZWN0b3IzfVxuICAgKi9cbiAgcmFuZG9tSW5Cb3g6IGZ1bmN0aW9uKGJveCwgdikge1xuICAgIHYgPSB2IHx8IG5ldyBWZWN0b3IzKCk7XG5cbiAgICB2LnggPSB0TWF0aC5yYW5kRmxvYXQoYm94Lm1pbi54LCBib3gubWF4LngpO1xuICAgIHYueSA9IHRNYXRoLnJhbmRGbG9hdChib3gubWluLnksIGJveC5tYXgueSk7XG4gICAgdi56ID0gdE1hdGgucmFuZEZsb2F0KGJveC5taW4ueiwgYm94Lm1heC56KTtcblxuICAgIHJldHVybiB2O1xuICB9LFxuXG4gIC8qKlxuICAgKiBHZXQgYSByYW5kb20gYXhpcyBmb3IgcXVhdGVybmlvbiByb3RhdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIHtUSFJFRS5WZWN0b3IzPX0gdiBPcHRpb24gdmVjdG9yIHRvIHN0b3JlIHJlc3VsdCBpbi5cbiAgICogQHJldHVybnMge1RIUkVFLlZlY3RvcjN9XG4gICAqL1xuICByYW5kb21BeGlzOiBmdW5jdGlvbih2KSB7XG4gICAgdiA9IHYgfHwgbmV3IFZlY3RvcjMoKTtcblxuICAgIHYueCA9IHRNYXRoLnJhbmRGbG9hdFNwcmVhZCgyLjApO1xuICAgIHYueSA9IHRNYXRoLnJhbmRGbG9hdFNwcmVhZCgyLjApO1xuICAgIHYueiA9IHRNYXRoLnJhbmRGbG9hdFNwcmVhZCgyLjApO1xuICAgIHYubm9ybWFsaXplKCk7XG5cbiAgICByZXR1cm4gdjtcbiAgfSxcblxuICAvKipcbiAgICogQ3JlYXRlIGEgVEhSRUUuQkFTLkRlcHRoQW5pbWF0aW9uTWF0ZXJpYWwgZm9yIHNoYWRvd3MgZnJvbSBhIFRIUkVFLlNwb3RMaWdodCBvciBUSFJFRS5EaXJlY3Rpb25hbExpZ2h0IGJ5IGNvcHlpbmcgcmVsZXZhbnQgc2hhZGVyIGNodW5rcy5cbiAgICogVW5pZm9ybSB2YWx1ZXMgbXVzdCBiZSBtYW51YWxseSBzeW5jZWQgYmV0d2VlbiB0aGUgc291cmNlIG1hdGVyaWFsIGFuZCB0aGUgZGVwdGggbWF0ZXJpYWwuXG4gICAqXG4gICAqIEBzZWUge0BsaW5rIGh0dHA6Ly90aHJlZS1iYXMtZXhhbXBsZXMuc3VyZ2Uuc2gvZXhhbXBsZXMvc2hhZG93cy99XG4gICAqXG4gICAqIEBwYXJhbSB7VEhSRUUuQkFTLkJhc2VBbmltYXRpb25NYXRlcmlhbH0gc291cmNlTWF0ZXJpYWwgSW5zdGFuY2UgdG8gZ2V0IHRoZSBzaGFkZXIgY2h1bmtzIGZyb20uXG4gICAqIEByZXR1cm5zIHtUSFJFRS5CQVMuRGVwdGhBbmltYXRpb25NYXRlcmlhbH1cbiAgICovXG4gIGNyZWF0ZURlcHRoQW5pbWF0aW9uTWF0ZXJpYWw6IGZ1bmN0aW9uKHNvdXJjZU1hdGVyaWFsKSB7XG4gICAgcmV0dXJuIG5ldyBEZXB0aEFuaW1hdGlvbk1hdGVyaWFsKHtcbiAgICAgIHVuaWZvcm1zOiBzb3VyY2VNYXRlcmlhbC51bmlmb3JtcyxcbiAgICAgIGRlZmluZXM6IHNvdXJjZU1hdGVyaWFsLmRlZmluZXMsXG4gICAgICB2ZXJ0ZXhGdW5jdGlvbnM6IHNvdXJjZU1hdGVyaWFsLnZlcnRleEZ1bmN0aW9ucyxcbiAgICAgIHZlcnRleFBhcmFtZXRlcnM6IHNvdXJjZU1hdGVyaWFsLnZlcnRleFBhcmFtZXRlcnMsXG4gICAgICB2ZXJ0ZXhJbml0OiBzb3VyY2VNYXRlcmlhbC52ZXJ0ZXhJbml0LFxuICAgICAgdmVydGV4UG9zaXRpb246IHNvdXJjZU1hdGVyaWFsLnZlcnRleFBvc2l0aW9uXG4gICAgfSk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIFRIUkVFLkJBUy5EaXN0YW5jZUFuaW1hdGlvbk1hdGVyaWFsIGZvciBzaGFkb3dzIGZyb20gYSBUSFJFRS5Qb2ludExpZ2h0IGJ5IGNvcHlpbmcgcmVsZXZhbnQgc2hhZGVyIGNodW5rcy5cbiAgICogVW5pZm9ybSB2YWx1ZXMgbXVzdCBiZSBtYW51YWxseSBzeW5jZWQgYmV0d2VlbiB0aGUgc291cmNlIG1hdGVyaWFsIGFuZCB0aGUgZGlzdGFuY2UgbWF0ZXJpYWwuXG4gICAqXG4gICAqIEBzZWUge0BsaW5rIGh0dHA6Ly90aHJlZS1iYXMtZXhhbXBsZXMuc3VyZ2Uuc2gvZXhhbXBsZXMvc2hhZG93cy99XG4gICAqXG4gICAqIEBwYXJhbSB7VEhSRUUuQkFTLkJhc2VBbmltYXRpb25NYXRlcmlhbH0gc291cmNlTWF0ZXJpYWwgSW5zdGFuY2UgdG8gZ2V0IHRoZSBzaGFkZXIgY2h1bmtzIGZyb20uXG4gICAqIEByZXR1cm5zIHtUSFJFRS5CQVMuRGlzdGFuY2VBbmltYXRpb25NYXRlcmlhbH1cbiAgICovXG4gIGNyZWF0ZURpc3RhbmNlQW5pbWF0aW9uTWF0ZXJpYWw6IGZ1bmN0aW9uKHNvdXJjZU1hdGVyaWFsKSB7XG4gICAgcmV0dXJuIG5ldyBEaXN0YW5jZUFuaW1hdGlvbk1hdGVyaWFsKHtcbiAgICAgIHVuaWZvcm1zOiBzb3VyY2VNYXRlcmlhbC51bmlmb3JtcyxcbiAgICAgIGRlZmluZXM6IHNvdXJjZU1hdGVyaWFsLmRlZmluZXMsXG4gICAgICB2ZXJ0ZXhGdW5jdGlvbnM6IHNvdXJjZU1hdGVyaWFsLnZlcnRleEZ1bmN0aW9ucyxcbiAgICAgIHZlcnRleFBhcmFtZXRlcnM6IHNvdXJjZU1hdGVyaWFsLnZlcnRleFBhcmFtZXRlcnMsXG4gICAgICB2ZXJ0ZXhJbml0OiBzb3VyY2VNYXRlcmlhbC52ZXJ0ZXhJbml0LFxuICAgICAgdmVydGV4UG9zaXRpb246IHNvdXJjZU1hdGVyaWFsLnZlcnRleFBvc2l0aW9uXG4gICAgfSk7XG4gIH1cbn07XG5cbmV4cG9ydCB7IFV0aWxzIH07XG4iLCJpbXBvcnQgeyBCdWZmZXJHZW9tZXRyeSwgQnVmZmVyQXR0cmlidXRlIH0gZnJvbSAndGhyZWUnO1xuaW1wb3J0IHsgVXRpbHMgfSBmcm9tICcuLi9VdGlscyc7XG5cbi8qKlxuICogQSBUSFJFRS5CdWZmZXJHZW9tZXRyeSBmb3IgYW5pbWF0aW5nIGluZGl2aWR1YWwgZmFjZXMgb2YgYSBUSFJFRS5HZW9tZXRyeS5cbiAqXG4gKiBAcGFyYW0ge1RIUkVFLkdlb21ldHJ5fSBtb2RlbCBUaGUgVEhSRUUuR2VvbWV0cnkgdG8gYmFzZSB0aGlzIGdlb21ldHJ5IG9uLlxuICogQHBhcmFtIHtPYmplY3Q9fSBvcHRpb25zXG4gKiBAcGFyYW0ge0Jvb2xlYW49fSBvcHRpb25zLmNvbXB1dGVDZW50cm9pZHMgSWYgdHJ1ZSwgYSBjZW50cm9pZHMgd2lsbCBiZSBjb21wdXRlZCBmb3IgZWFjaCBmYWNlIGFuZCBzdG9yZWQgaW4gVEhSRUUuQkFTLk1vZGVsQnVmZmVyR2VvbWV0cnkuY2VudHJvaWRzLlxuICogQHBhcmFtIHtCb29sZWFuPX0gb3B0aW9ucy5sb2NhbGl6ZUZhY2VzIElmIHRydWUsIHRoZSBwb3NpdGlvbnMgZm9yIGVhY2ggZmFjZSB3aWxsIGJlIHN0b3JlZCByZWxhdGl2ZSB0byB0aGUgY2VudHJvaWQuIFRoaXMgaXMgdXNlZnVsIGlmIHlvdSB3YW50IHRvIHJvdGF0ZSBvciBzY2FsZSBmYWNlcyBhcm91bmQgdGhlaXIgY2VudGVyLlxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIE1vZGVsQnVmZmVyR2VvbWV0cnkobW9kZWwsIG9wdGlvbnMpIHtcbiAgQnVmZmVyR2VvbWV0cnkuY2FsbCh0aGlzKTtcblxuICAvKipcbiAgICogQSByZWZlcmVuY2UgdG8gdGhlIGdlb21ldHJ5IHVzZWQgdG8gY3JlYXRlIHRoaXMgaW5zdGFuY2UuXG4gICAqIEB0eXBlIHtUSFJFRS5HZW9tZXRyeX1cbiAgICovXG4gIHRoaXMubW9kZWxHZW9tZXRyeSA9IG1vZGVsO1xuXG4gIC8qKlxuICAgKiBOdW1iZXIgb2YgZmFjZXMgb2YgdGhlIG1vZGVsLlxuICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgKi9cbiAgdGhpcy5mYWNlQ291bnQgPSB0aGlzLm1vZGVsR2VvbWV0cnkuZmFjZXMubGVuZ3RoO1xuXG4gIC8qKlxuICAgKiBOdW1iZXIgb2YgdmVydGljZXMgb2YgdGhlIG1vZGVsLlxuICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgKi9cbiAgdGhpcy52ZXJ0ZXhDb3VudCA9IHRoaXMubW9kZWxHZW9tZXRyeS52ZXJ0aWNlcy5sZW5ndGg7XG5cbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gIG9wdGlvbnMuY29tcHV0ZUNlbnRyb2lkcyAmJiB0aGlzLmNvbXB1dGVDZW50cm9pZHMoKTtcblxuICB0aGlzLmJ1ZmZlckluZGljZXMoKTtcbiAgdGhpcy5idWZmZXJQb3NpdGlvbnMob3B0aW9ucy5sb2NhbGl6ZUZhY2VzKTtcbn1cbk1vZGVsQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUpO1xuTW9kZWxCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBNb2RlbEJ1ZmZlckdlb21ldHJ5O1xuXG4vKipcbiAqIENvbXB1dGVzIGEgY2VudHJvaWQgZm9yIGVhY2ggZmFjZSBhbmQgc3RvcmVzIGl0IGluIFRIUkVFLkJBUy5Nb2RlbEJ1ZmZlckdlb21ldHJ5LmNlbnRyb2lkcy5cbiAqL1xuTW9kZWxCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuY29tcHV0ZUNlbnRyb2lkcyA9IGZ1bmN0aW9uKCkge1xuICAvKipcbiAgICogQW4gYXJyYXkgb2YgY2VudHJvaWRzIGNvcnJlc3BvbmRpbmcgdG8gdGhlIGZhY2VzIG9mIHRoZSBtb2RlbC5cbiAgICpcbiAgICogQHR5cGUge0FycmF5fVxuICAgKi9cbiAgdGhpcy5jZW50cm9pZHMgPSBbXTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuZmFjZUNvdW50OyBpKyspIHtcbiAgICB0aGlzLmNlbnRyb2lkc1tpXSA9IFV0aWxzLmNvbXB1dGVDZW50cm9pZCh0aGlzLm1vZGVsR2VvbWV0cnksIHRoaXMubW9kZWxHZW9tZXRyeS5mYWNlc1tpXSk7XG4gIH1cbn07XG5cbk1vZGVsQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmJ1ZmZlckluZGljZXMgPSBmdW5jdGlvbigpIHtcbiAgY29uc3QgaW5kZXhCdWZmZXIgPSBuZXcgVWludDMyQXJyYXkodGhpcy5mYWNlQ291bnQgKiAzKTtcblxuICB0aGlzLnNldEluZGV4KG5ldyBCdWZmZXJBdHRyaWJ1dGUoaW5kZXhCdWZmZXIsIDEpKTtcblxuICBmb3IgKGxldCBpID0gMCwgb2Zmc2V0ID0gMDsgaSA8IHRoaXMuZmFjZUNvdW50OyBpKyssIG9mZnNldCArPSAzKSB7XG4gICAgY29uc3QgZmFjZSA9IHRoaXMubW9kZWxHZW9tZXRyeS5mYWNlc1tpXTtcblxuICAgIGluZGV4QnVmZmVyW29mZnNldCAgICBdID0gZmFjZS5hO1xuICAgIGluZGV4QnVmZmVyW29mZnNldCArIDFdID0gZmFjZS5iO1xuICAgIGluZGV4QnVmZmVyW29mZnNldCArIDJdID0gZmFjZS5jO1xuICB9XG59O1xuXG5Nb2RlbEJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5idWZmZXJQb3NpdGlvbnMgPSBmdW5jdGlvbihsb2NhbGl6ZUZhY2VzKSB7XG4gIGNvbnN0IHBvc2l0aW9uQnVmZmVyID0gdGhpcy5jcmVhdGVBdHRyaWJ1dGUoJ3Bvc2l0aW9uJywgMykuYXJyYXk7XG4gIGxldCBpLCBvZmZzZXQ7XG5cbiAgaWYgKGxvY2FsaXplRmFjZXMgPT09IHRydWUpIHtcbiAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5mYWNlQ291bnQ7IGkrKykge1xuICAgICAgY29uc3QgZmFjZSA9IHRoaXMubW9kZWxHZW9tZXRyeS5mYWNlc1tpXTtcbiAgICAgIGNvbnN0IGNlbnRyb2lkID0gdGhpcy5jZW50cm9pZHMgPyB0aGlzLmNlbnRyb2lkc1tpXSA6IFRIUkVFLkJBUy5VdGlscy5jb21wdXRlQ2VudHJvaWQodGhpcy5tb2RlbEdlb21ldHJ5LCBmYWNlKTtcblxuICAgICAgY29uc3QgYSA9IHRoaXMubW9kZWxHZW9tZXRyeS52ZXJ0aWNlc1tmYWNlLmFdO1xuICAgICAgY29uc3QgYiA9IHRoaXMubW9kZWxHZW9tZXRyeS52ZXJ0aWNlc1tmYWNlLmJdO1xuICAgICAgY29uc3QgYyA9IHRoaXMubW9kZWxHZW9tZXRyeS52ZXJ0aWNlc1tmYWNlLmNdO1xuXG4gICAgICBwb3NpdGlvbkJ1ZmZlcltmYWNlLmEgKiAzXSAgICAgPSBhLnggLSBjZW50cm9pZC54O1xuICAgICAgcG9zaXRpb25CdWZmZXJbZmFjZS5hICogMyArIDFdID0gYS55IC0gY2VudHJvaWQueTtcbiAgICAgIHBvc2l0aW9uQnVmZmVyW2ZhY2UuYSAqIDMgKyAyXSA9IGEueiAtIGNlbnRyb2lkLno7XG5cbiAgICAgIHBvc2l0aW9uQnVmZmVyW2ZhY2UuYiAqIDNdICAgICA9IGIueCAtIGNlbnRyb2lkLng7XG4gICAgICBwb3NpdGlvbkJ1ZmZlcltmYWNlLmIgKiAzICsgMV0gPSBiLnkgLSBjZW50cm9pZC55O1xuICAgICAgcG9zaXRpb25CdWZmZXJbZmFjZS5iICogMyArIDJdID0gYi56IC0gY2VudHJvaWQuejtcblxuICAgICAgcG9zaXRpb25CdWZmZXJbZmFjZS5jICogM10gICAgID0gYy54IC0gY2VudHJvaWQueDtcbiAgICAgIHBvc2l0aW9uQnVmZmVyW2ZhY2UuYyAqIDMgKyAxXSA9IGMueSAtIGNlbnRyb2lkLnk7XG4gICAgICBwb3NpdGlvbkJ1ZmZlcltmYWNlLmMgKiAzICsgMl0gPSBjLnogLSBjZW50cm9pZC56O1xuICAgIH1cbiAgfVxuICBlbHNlIHtcbiAgICBmb3IgKGkgPSAwLCBvZmZzZXQgPSAwOyBpIDwgdGhpcy52ZXJ0ZXhDb3VudDsgaSsrLCBvZmZzZXQgKz0gMykge1xuICAgICAgY29uc3QgdmVydGV4ID0gdGhpcy5tb2RlbEdlb21ldHJ5LnZlcnRpY2VzW2ldO1xuXG4gICAgICBwb3NpdGlvbkJ1ZmZlcltvZmZzZXQgICAgXSA9IHZlcnRleC54O1xuICAgICAgcG9zaXRpb25CdWZmZXJbb2Zmc2V0ICsgMV0gPSB2ZXJ0ZXgueTtcbiAgICAgIHBvc2l0aW9uQnVmZmVyW29mZnNldCArIDJdID0gdmVydGV4Lno7XG4gICAgfVxuICB9XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBUSFJFRS5CdWZmZXJBdHRyaWJ1dGUgd2l0aCBVViBjb29yZGluYXRlcy5cbiAqL1xuTW9kZWxCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuYnVmZmVyVVZzID0gZnVuY3Rpb24oKSB7XG4gIGNvbnN0IHV2QnVmZmVyID0gdGhpcy5jcmVhdGVBdHRyaWJ1dGUoJ3V2JywgMikuYXJyYXk7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmZhY2VDb3VudDsgaSsrKSB7XG5cbiAgICBjb25zdCBmYWNlID0gdGhpcy5tb2RlbEdlb21ldHJ5LmZhY2VzW2ldO1xuICAgIGxldCB1djtcblxuICAgIHV2ID0gdGhpcy5tb2RlbEdlb21ldHJ5LmZhY2VWZXJ0ZXhVdnNbMF1baV1bMF07XG4gICAgdXZCdWZmZXJbZmFjZS5hICogMl0gICAgID0gdXYueDtcbiAgICB1dkJ1ZmZlcltmYWNlLmEgKiAyICsgMV0gPSB1di55O1xuXG4gICAgdXYgPSB0aGlzLm1vZGVsR2VvbWV0cnkuZmFjZVZlcnRleFV2c1swXVtpXVsxXTtcbiAgICB1dkJ1ZmZlcltmYWNlLmIgKiAyXSAgICAgPSB1di54O1xuICAgIHV2QnVmZmVyW2ZhY2UuYiAqIDIgKyAxXSA9IHV2Lnk7XG5cbiAgICB1diA9IHRoaXMubW9kZWxHZW9tZXRyeS5mYWNlVmVydGV4VXZzWzBdW2ldWzJdO1xuICAgIHV2QnVmZmVyW2ZhY2UuYyAqIDJdICAgICA9IHV2Lng7XG4gICAgdXZCdWZmZXJbZmFjZS5jICogMiArIDFdID0gdXYueTtcbiAgfVxufTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgVEhSRUUuQnVmZmVyQXR0cmlidXRlIG9uIHRoaXMgZ2VvbWV0cnkgaW5zdGFuY2UuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgTmFtZSBvZiB0aGUgYXR0cmlidXRlLlxuICogQHBhcmFtIHtpbnR9IGl0ZW1TaXplIE51bWJlciBvZiBmbG9hdHMgcGVyIHZlcnRleCAodHlwaWNhbGx5IDEsIDIsIDMgb3IgNCkuXG4gKiBAcGFyYW0ge2Z1bmN0aW9uPX0gZmFjdG9yeSBGdW5jdGlvbiB0aGF0IHdpbGwgYmUgY2FsbGVkIGZvciBlYWNoIGZhY2UgdXBvbiBjcmVhdGlvbi4gQWNjZXB0cyAzIGFyZ3VtZW50czogZGF0YVtdLCBpbmRleCBhbmQgZmFjZUNvdW50LiBDYWxscyBzZXRGYWNlRGF0YS5cbiAqXG4gKiBAcmV0dXJucyB7VEhSRUUuQnVmZmVyQXR0cmlidXRlfVxuICovXG5Nb2RlbEJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5jcmVhdGVBdHRyaWJ1dGUgPSBmdW5jdGlvbihuYW1lLCBpdGVtU2l6ZSwgZmFjdG9yeSkge1xuICBjb25zdCBidWZmZXIgPSBuZXcgRmxvYXQzMkFycmF5KHRoaXMudmVydGV4Q291bnQgKiBpdGVtU2l6ZSk7XG4gIGNvbnN0IGF0dHJpYnV0ZSA9IG5ldyBUSFJFRS5CdWZmZXJBdHRyaWJ1dGUoYnVmZmVyLCBpdGVtU2l6ZSk7XG5cbiAgdGhpcy5hZGRBdHRyaWJ1dGUobmFtZSwgYXR0cmlidXRlKTtcblxuICBpZiAoZmFjdG9yeSkge1xuICAgIGNvbnN0IGRhdGEgPSBbXTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5mYWNlQ291bnQ7IGkrKykge1xuICAgICAgZmFjdG9yeShkYXRhLCBpLCB0aGlzLmZhY2VDb3VudCk7XG4gICAgICB0aGlzLnNldEZhY2VEYXRhKGF0dHJpYnV0ZSwgaSwgZGF0YSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGF0dHJpYnV0ZTtcbn07XG5cbi8qKlxuICogU2V0cyBkYXRhIGZvciBhbGwgdmVydGljZXMgb2YgYSBmYWNlIGF0IGEgZ2l2ZW4gaW5kZXguXG4gKiBVc3VhbGx5IGNhbGxlZCBpbiBhIGxvb3AuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd8VEhSRUUuQnVmZmVyQXR0cmlidXRlfSBhdHRyaWJ1dGUgVGhlIGF0dHJpYnV0ZSBvciBhdHRyaWJ1dGUgbmFtZSB3aGVyZSB0aGUgZGF0YSBpcyB0byBiZSBzdG9yZWQuXG4gKiBAcGFyYW0ge2ludH0gZmFjZUluZGV4IEluZGV4IG9mIHRoZSBmYWNlIGluIHRoZSBidWZmZXIgZ2VvbWV0cnkuXG4gKiBAcGFyYW0ge0FycmF5fSBkYXRhIEFycmF5IG9mIGRhdGEuIExlbmd0aCBzaG91bGQgYmUgZXF1YWwgdG8gaXRlbSBzaXplIG9mIHRoZSBhdHRyaWJ1dGUuXG4gKi9cbk1vZGVsQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLnNldEZhY2VEYXRhID0gZnVuY3Rpb24oYXR0cmlidXRlLCBmYWNlSW5kZXgsIGRhdGEpIHtcbiAgYXR0cmlidXRlID0gKHR5cGVvZiBhdHRyaWJ1dGUgPT09ICdzdHJpbmcnKSA/IHRoaXMuYXR0cmlidXRlc1thdHRyaWJ1dGVdIDogYXR0cmlidXRlO1xuXG4gIGxldCBvZmZzZXQgPSBmYWNlSW5kZXggKiAzICogYXR0cmlidXRlLml0ZW1TaXplO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgMzsgaSsrKSB7XG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCBhdHRyaWJ1dGUuaXRlbVNpemU7IGorKykge1xuICAgICAgYXR0cmlidXRlLmFycmF5W29mZnNldCsrXSA9IGRhdGFbal07XG4gICAgfVxuICB9XG59O1xuXG5leHBvcnQgeyBNb2RlbEJ1ZmZlckdlb21ldHJ5IH07XG4iLCJpbXBvcnQgeyBCdWZmZXJHZW9tZXRyeSwgQnVmZmVyQXR0cmlidXRlIH0gZnJvbSAndGhyZWUnO1xuXG4vKipcbiAqIEEgVEhSRUUuQnVmZmVyR2VvbWV0cnkgY29uc2lzdHMgb2YgcG9pbnRzLlxuICogQHBhcmFtIHtOdW1iZXJ9IGNvdW50IFRoZSBudW1iZXIgb2YgcG9pbnRzLlxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIFBvaW50QnVmZmVyR2VvbWV0cnkoY291bnQpIHtcbiAgQnVmZmVyR2VvbWV0cnkuY2FsbCh0aGlzKTtcblxuICAvKipcbiAgICogTnVtYmVyIG9mIHBvaW50cy5cbiAgICogQHR5cGUge051bWJlcn1cbiAgICovXG4gIHRoaXMucG9pbnRDb3VudCA9IGNvdW50O1xuXG4gIHRoaXMuYnVmZmVyUG9zaXRpb25zKCk7XG59XG5Qb2ludEJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlKTtcblBvaW50QnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gUG9pbnRCdWZmZXJHZW9tZXRyeTtcblxuUG9pbnRCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuYnVmZmVyUG9zaXRpb25zID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuY3JlYXRlQXR0cmlidXRlKCdwb3NpdGlvbicsIDMpO1xufTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgVEhSRUUuQnVmZmVyQXR0cmlidXRlIG9uIHRoaXMgZ2VvbWV0cnkgaW5zdGFuY2UuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgTmFtZSBvZiB0aGUgYXR0cmlidXRlLlxuICogQHBhcmFtIHtOdW1iZXJ9IGl0ZW1TaXplIE51bWJlciBvZiBmbG9hdHMgcGVyIHZlcnRleCAodHlwaWNhbGx5IDEsIDIsIDMgb3IgNCkuXG4gKiBAcGFyYW0ge2Z1bmN0aW9uPX0gZmFjdG9yeSBGdW5jdGlvbiB0aGF0IHdpbGwgYmUgY2FsbGVkIGZvciBlYWNoIHBvaW50IHVwb24gY3JlYXRpb24uIEFjY2VwdHMgMyBhcmd1bWVudHM6IGRhdGFbXSwgaW5kZXggYW5kIHByZWZhYkNvdW50LiBDYWxscyBzZXRQb2ludERhdGEuXG4gKlxuICogQHJldHVybnMge1RIUkVFLkJ1ZmZlckF0dHJpYnV0ZX1cbiAqL1xuUG9pbnRCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuY3JlYXRlQXR0cmlidXRlID0gZnVuY3Rpb24obmFtZSwgaXRlbVNpemUsIGZhY3RvcnkpIHtcbiAgY29uc3QgYnVmZmVyID0gbmV3IEZsb2F0MzJBcnJheSh0aGlzLnBvaW50Q291bnQgKiBpdGVtU2l6ZSk7XG4gIGNvbnN0IGF0dHJpYnV0ZSA9IG5ldyBCdWZmZXJBdHRyaWJ1dGUoYnVmZmVyLCBpdGVtU2l6ZSk7XG5cbiAgdGhpcy5hZGRBdHRyaWJ1dGUobmFtZSwgYXR0cmlidXRlKTtcblxuICBpZiAoZmFjdG9yeSkge1xuICAgIGNvbnN0IGRhdGEgPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucG9pbnRDb3VudDsgaSsrKSB7XG4gICAgICBmYWN0b3J5KGRhdGEsIGksIHRoaXMucG9pbnRDb3VudCk7XG4gICAgICB0aGlzLnNldFBvaW50RGF0YShhdHRyaWJ1dGUsIGksIGRhdGEpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBhdHRyaWJ1dGU7XG59O1xuXG5Qb2ludEJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5zZXRQb2ludERhdGEgPSBmdW5jdGlvbihhdHRyaWJ1dGUsIHBvaW50SW5kZXgsIGRhdGEpIHtcbiAgYXR0cmlidXRlID0gKHR5cGVvZiBhdHRyaWJ1dGUgPT09ICdzdHJpbmcnKSA/IHRoaXMuYXR0cmlidXRlc1thdHRyaWJ1dGVdIDogYXR0cmlidXRlO1xuXG4gIGxldCBvZmZzZXQgPSBwb2ludEluZGV4ICogYXR0cmlidXRlLml0ZW1TaXplO1xuXG4gIGZvciAobGV0IGogPSAwOyBqIDwgYXR0cmlidXRlLml0ZW1TaXplOyBqKyspIHtcbiAgICBhdHRyaWJ1dGUuYXJyYXlbb2Zmc2V0KytdID0gZGF0YVtqXTtcbiAgfVxufTtcblxuZXhwb3J0IHsgUG9pbnRCdWZmZXJHZW9tZXRyeSB9O1xuIiwiLy8gZ2VuZXJhdGVkIGJ5IHNjcmlwdHMvYnVpbGRfc2hhZGVyX2NodW5rcy5qc1xuXG5pbXBvcnQgY2F0bXVsbF9yb21fc3BsaW5lIGZyb20gJy4vZ2xzbC9jYXRtdWxsX3JvbV9zcGxpbmUuZ2xzbCc7XG5pbXBvcnQgY3ViaWNfYmV6aWVyIGZyb20gJy4vZ2xzbC9jdWJpY19iZXppZXIuZ2xzbCc7XG5pbXBvcnQgZWFzZV9iYWNrX2luIGZyb20gJy4vZ2xzbC9lYXNlX2JhY2tfaW4uZ2xzbCc7XG5pbXBvcnQgZWFzZV9iYWNrX2luX291dCBmcm9tICcuL2dsc2wvZWFzZV9iYWNrX2luX291dC5nbHNsJztcbmltcG9ydCBlYXNlX2JhY2tfb3V0IGZyb20gJy4vZ2xzbC9lYXNlX2JhY2tfb3V0Lmdsc2wnO1xuaW1wb3J0IGVhc2VfYmV6aWVyIGZyb20gJy4vZ2xzbC9lYXNlX2Jlemllci5nbHNsJztcbmltcG9ydCBlYXNlX2JvdW5jZV9pbiBmcm9tICcuL2dsc2wvZWFzZV9ib3VuY2VfaW4uZ2xzbCc7XG5pbXBvcnQgZWFzZV9ib3VuY2VfaW5fb3V0IGZyb20gJy4vZ2xzbC9lYXNlX2JvdW5jZV9pbl9vdXQuZ2xzbCc7XG5pbXBvcnQgZWFzZV9ib3VuY2Vfb3V0IGZyb20gJy4vZ2xzbC9lYXNlX2JvdW5jZV9vdXQuZ2xzbCc7XG5pbXBvcnQgZWFzZV9jaXJjX2luIGZyb20gJy4vZ2xzbC9lYXNlX2NpcmNfaW4uZ2xzbCc7XG5pbXBvcnQgZWFzZV9jaXJjX2luX291dCBmcm9tICcuL2dsc2wvZWFzZV9jaXJjX2luX291dC5nbHNsJztcbmltcG9ydCBlYXNlX2NpcmNfb3V0IGZyb20gJy4vZ2xzbC9lYXNlX2NpcmNfb3V0Lmdsc2wnO1xuaW1wb3J0IGVhc2VfY3ViaWNfaW4gZnJvbSAnLi9nbHNsL2Vhc2VfY3ViaWNfaW4uZ2xzbCc7XG5pbXBvcnQgZWFzZV9jdWJpY19pbl9vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfY3ViaWNfaW5fb3V0Lmdsc2wnO1xuaW1wb3J0IGVhc2VfY3ViaWNfb3V0IGZyb20gJy4vZ2xzbC9lYXNlX2N1YmljX291dC5nbHNsJztcbmltcG9ydCBlYXNlX2VsYXN0aWNfaW4gZnJvbSAnLi9nbHNsL2Vhc2VfZWxhc3RpY19pbi5nbHNsJztcbmltcG9ydCBlYXNlX2VsYXN0aWNfaW5fb3V0IGZyb20gJy4vZ2xzbC9lYXNlX2VsYXN0aWNfaW5fb3V0Lmdsc2wnO1xuaW1wb3J0IGVhc2VfZWxhc3RpY19vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfZWxhc3RpY19vdXQuZ2xzbCc7XG5pbXBvcnQgZWFzZV9leHBvX2luIGZyb20gJy4vZ2xzbC9lYXNlX2V4cG9faW4uZ2xzbCc7XG5pbXBvcnQgZWFzZV9leHBvX2luX291dCBmcm9tICcuL2dsc2wvZWFzZV9leHBvX2luX291dC5nbHNsJztcbmltcG9ydCBlYXNlX2V4cG9fb3V0IGZyb20gJy4vZ2xzbC9lYXNlX2V4cG9fb3V0Lmdsc2wnO1xuaW1wb3J0IGVhc2VfcXVhZF9pbiBmcm9tICcuL2dsc2wvZWFzZV9xdWFkX2luLmdsc2wnO1xuaW1wb3J0IGVhc2VfcXVhZF9pbl9vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfcXVhZF9pbl9vdXQuZ2xzbCc7XG5pbXBvcnQgZWFzZV9xdWFkX291dCBmcm9tICcuL2dsc2wvZWFzZV9xdWFkX291dC5nbHNsJztcbmltcG9ydCBlYXNlX3F1YXJ0X2luIGZyb20gJy4vZ2xzbC9lYXNlX3F1YXJ0X2luLmdsc2wnO1xuaW1wb3J0IGVhc2VfcXVhcnRfaW5fb3V0IGZyb20gJy4vZ2xzbC9lYXNlX3F1YXJ0X2luX291dC5nbHNsJztcbmltcG9ydCBlYXNlX3F1YXJ0X291dCBmcm9tICcuL2dsc2wvZWFzZV9xdWFydF9vdXQuZ2xzbCc7XG5pbXBvcnQgZWFzZV9xdWludF9pbiBmcm9tICcuL2dsc2wvZWFzZV9xdWludF9pbi5nbHNsJztcbmltcG9ydCBlYXNlX3F1aW50X2luX291dCBmcm9tICcuL2dsc2wvZWFzZV9xdWludF9pbl9vdXQuZ2xzbCc7XG5pbXBvcnQgZWFzZV9xdWludF9vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfcXVpbnRfb3V0Lmdsc2wnO1xuaW1wb3J0IGVhc2Vfc2luZV9pbiBmcm9tICcuL2dsc2wvZWFzZV9zaW5lX2luLmdsc2wnO1xuaW1wb3J0IGVhc2Vfc2luZV9pbl9vdXQgZnJvbSAnLi9nbHNsL2Vhc2Vfc2luZV9pbl9vdXQuZ2xzbCc7XG5pbXBvcnQgZWFzZV9zaW5lX291dCBmcm9tICcuL2dsc2wvZWFzZV9zaW5lX291dC5nbHNsJztcbmltcG9ydCBxdWF0ZXJuaW9uX3JvdGF0aW9uIGZyb20gJy4vZ2xzbC9xdWF0ZXJuaW9uX3JvdGF0aW9uLmdsc2wnO1xuaW1wb3J0IHF1YXRlcm5pb25fc2xlcnAgZnJvbSAnLi9nbHNsL3F1YXRlcm5pb25fc2xlcnAuZ2xzbCc7XG5cblxuZXhwb3J0IGNvbnN0IFNoYWRlckNodW5rID0ge1xuICBjYXRtdWxsX3JvbV9zcGxpbmU6IGNhdG11bGxfcm9tX3NwbGluZSxcbiAgY3ViaWNfYmV6aWVyOiBjdWJpY19iZXppZXIsXG4gIGVhc2VfYmFja19pbjogZWFzZV9iYWNrX2luLFxuICBlYXNlX2JhY2tfaW5fb3V0OiBlYXNlX2JhY2tfaW5fb3V0LFxuICBlYXNlX2JhY2tfb3V0OiBlYXNlX2JhY2tfb3V0LFxuICBlYXNlX2JlemllcjogZWFzZV9iZXppZXIsXG4gIGVhc2VfYm91bmNlX2luOiBlYXNlX2JvdW5jZV9pbixcbiAgZWFzZV9ib3VuY2VfaW5fb3V0OiBlYXNlX2JvdW5jZV9pbl9vdXQsXG4gIGVhc2VfYm91bmNlX291dDogZWFzZV9ib3VuY2Vfb3V0LFxuICBlYXNlX2NpcmNfaW46IGVhc2VfY2lyY19pbixcbiAgZWFzZV9jaXJjX2luX291dDogZWFzZV9jaXJjX2luX291dCxcbiAgZWFzZV9jaXJjX291dDogZWFzZV9jaXJjX291dCxcbiAgZWFzZV9jdWJpY19pbjogZWFzZV9jdWJpY19pbixcbiAgZWFzZV9jdWJpY19pbl9vdXQ6IGVhc2VfY3ViaWNfaW5fb3V0LFxuICBlYXNlX2N1YmljX291dDogZWFzZV9jdWJpY19vdXQsXG4gIGVhc2VfZWxhc3RpY19pbjogZWFzZV9lbGFzdGljX2luLFxuICBlYXNlX2VsYXN0aWNfaW5fb3V0OiBlYXNlX2VsYXN0aWNfaW5fb3V0LFxuICBlYXNlX2VsYXN0aWNfb3V0OiBlYXNlX2VsYXN0aWNfb3V0LFxuICBlYXNlX2V4cG9faW46IGVhc2VfZXhwb19pbixcbiAgZWFzZV9leHBvX2luX291dDogZWFzZV9leHBvX2luX291dCxcbiAgZWFzZV9leHBvX291dDogZWFzZV9leHBvX291dCxcbiAgZWFzZV9xdWFkX2luOiBlYXNlX3F1YWRfaW4sXG4gIGVhc2VfcXVhZF9pbl9vdXQ6IGVhc2VfcXVhZF9pbl9vdXQsXG4gIGVhc2VfcXVhZF9vdXQ6IGVhc2VfcXVhZF9vdXQsXG4gIGVhc2VfcXVhcnRfaW46IGVhc2VfcXVhcnRfaW4sXG4gIGVhc2VfcXVhcnRfaW5fb3V0OiBlYXNlX3F1YXJ0X2luX291dCxcbiAgZWFzZV9xdWFydF9vdXQ6IGVhc2VfcXVhcnRfb3V0LFxuICBlYXNlX3F1aW50X2luOiBlYXNlX3F1aW50X2luLFxuICBlYXNlX3F1aW50X2luX291dDogZWFzZV9xdWludF9pbl9vdXQsXG4gIGVhc2VfcXVpbnRfb3V0OiBlYXNlX3F1aW50X291dCxcbiAgZWFzZV9zaW5lX2luOiBlYXNlX3NpbmVfaW4sXG4gIGVhc2Vfc2luZV9pbl9vdXQ6IGVhc2Vfc2luZV9pbl9vdXQsXG4gIGVhc2Vfc2luZV9vdXQ6IGVhc2Vfc2luZV9vdXQsXG4gIHF1YXRlcm5pb25fcm90YXRpb246IHF1YXRlcm5pb25fcm90YXRpb24sXG4gIHF1YXRlcm5pb25fc2xlcnA6IHF1YXRlcm5pb25fc2xlcnAsXG5cbn07XG5cbiIsIi8qKlxuICogQSB0aW1lbGluZSB0cmFuc2l0aW9uIHNlZ21lbnQuIEFuIGluc3RhbmNlIG9mIHRoaXMgY2xhc3MgaXMgY3JlYXRlZCBpbnRlcm5hbGx5IHdoZW4gY2FsbGluZyB7QGxpbmsgVEhSRUUuQkFTLlRpbWVsaW5lLmFkZH0sIHNvIHlvdSBzaG91bGQgbm90IHVzZSB0aGlzIGNsYXNzIGRpcmVjdGx5LlxuICogVGhlIGluc3RhbmNlIGlzIGFsc28gcGFzc2VkIHRoZSB0aGUgY29tcGlsZXIgZnVuY3Rpb24gaWYgeW91IHJlZ2lzdGVyIGEgdHJhbnNpdGlvbiB0aHJvdWdoIHtAbGluayBUSFJFRS5CQVMuVGltZWxpbmUucmVnaXN0ZXJ9LiBUaGVyZSB5b3UgY2FuIHVzZSB0aGUgcHVibGljIHByb3BlcnRpZXMgb2YgdGhlIHNlZ21lbnQgdG8gY29tcGlsZSB0aGUgZ2xzbCBzdHJpbmcuXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IEEgc3RyaW5nIGtleSBnZW5lcmF0ZWQgYnkgdGhlIHRpbWVsaW5lIHRvIHdoaWNoIHRoaXMgc2VnbWVudCBiZWxvbmdzLiBLZXlzIGFyZSB1bmlxdWUuXG4gKiBAcGFyYW0ge251bWJlcn0gc3RhcnQgU3RhcnQgdGltZSBvZiB0aGlzIHNlZ21lbnQgaW4gYSB0aW1lbGluZSBpbiBzZWNvbmRzLlxuICogQHBhcmFtIHtudW1iZXJ9IGR1cmF0aW9uIER1cmF0aW9uIG9mIHRoaXMgc2VnbWVudCBpbiBzZWNvbmRzLlxuICogQHBhcmFtIHtvYmplY3R9IHRyYW5zaXRpb24gT2JqZWN0IGRlc2NyaWJpbmcgdGhlIHRyYW5zaXRpb24uXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBjb21waWxlciBBIHJlZmVyZW5jZSB0byB0aGUgY29tcGlsZXIgZnVuY3Rpb24gZnJvbSBhIHRyYW5zaXRpb24gZGVmaW5pdGlvbi5cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBUaW1lbGluZVNlZ21lbnQoa2V5LCBzdGFydCwgZHVyYXRpb24sIHRyYW5zaXRpb24sIGNvbXBpbGVyKSB7XG4gIHRoaXMua2V5ID0ga2V5O1xuICB0aGlzLnN0YXJ0ID0gc3RhcnQ7XG4gIHRoaXMuZHVyYXRpb24gPSBkdXJhdGlvbjtcbiAgdGhpcy50cmFuc2l0aW9uID0gdHJhbnNpdGlvbjtcbiAgdGhpcy5jb21waWxlciA9IGNvbXBpbGVyO1xuXG4gIHRoaXMudHJhaWwgPSAwO1xufVxuXG5UaW1lbGluZVNlZ21lbnQucHJvdG90eXBlLmNvbXBpbGUgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMuY29tcGlsZXIodGhpcyk7XG59O1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoVGltZWxpbmVTZWdtZW50LnByb3RvdHlwZSwgJ2VuZCcsIHtcbiAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5zdGFydCArIHRoaXMuZHVyYXRpb247XG4gIH1cbn0pO1xuXG5leHBvcnQgeyBUaW1lbGluZVNlZ21lbnQgfTtcbiIsImltcG9ydCB7IFRpbWVsaW5lU2VnbWVudCB9IGZyb20gJy4vVGltZWxpbmVTZWdtZW50JztcblxuLyoqXG4gKiBBIHV0aWxpdHkgY2xhc3MgdG8gY3JlYXRlIGFuIGFuaW1hdGlvbiB0aW1lbGluZSB3aGljaCBjYW4gYmUgYmFrZWQgaW50byBhICh2ZXJ0ZXgpIHNoYWRlci5cbiAqIEJ5IGRlZmF1bHQgdGhlIHRpbWVsaW5lIHN1cHBvcnRzIHRyYW5zbGF0aW9uLCBzY2FsZSBhbmQgcm90YXRpb24uIFRoaXMgY2FuIGJlIGV4dGVuZGVkIG9yIG92ZXJyaWRkZW4uXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gVGltZWxpbmUoKSB7XG4gIC8qKlxuICAgKiBUaGUgdG90YWwgZHVyYXRpb24gb2YgdGhlIHRpbWVsaW5lIGluIHNlY29uZHMuXG4gICAqIEB0eXBlIHtudW1iZXJ9XG4gICAqL1xuICB0aGlzLmR1cmF0aW9uID0gMDtcblxuICAvKipcbiAgICogVGhlIG5hbWUgb2YgdGhlIHZhbHVlIHRoYXQgc2VnbWVudHMgd2lsbCB1c2UgdG8gcmVhZCB0aGUgdGltZS4gRGVmYXVsdHMgdG8gJ3RUaW1lJy5cbiAgICogQHR5cGUge3N0cmluZ31cbiAgICovXG4gIHRoaXMudGltZUtleSA9ICd0VGltZSc7XG5cbiAgdGhpcy5zZWdtZW50cyA9IHt9O1xuICB0aGlzLl9fa2V5ID0gMDtcbn1cblxuLy8gc3RhdGljIGRlZmluaXRpb25zIG1hcFxuVGltZWxpbmUuc2VnbWVudERlZmluaXRpb25zID0ge307XG5cbi8qKlxuICogUmVnaXN0ZXJzIGEgdHJhbnNpdGlvbiBkZWZpbml0aW9uIGZvciB1c2Ugd2l0aCB7QGxpbmsgVEhSRUUuQkFTLlRpbWVsaW5lLmFkZH0uXG4gKiBAcGFyYW0ge1N0cmluZ30ga2V5IE5hbWUgb2YgdGhlIHRyYW5zaXRpb24uIERlZmF1bHRzIGluY2x1ZGUgJ3NjYWxlJywgJ3JvdGF0ZScgYW5kICd0cmFuc2xhdGUnLlxuICogQHBhcmFtIHtPYmplY3R9IGRlZmluaXRpb25cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGRlZmluaXRpb24uY29tcGlsZXIgQSBmdW5jdGlvbiB0aGF0IGdlbmVyYXRlcyBhIGdsc2wgc3RyaW5nIGZvciBhIHRyYW5zaXRpb24gc2VnbWVudC4gQWNjZXB0cyBhIFRIUkVFLkJBUy5UaW1lbGluZVNlZ21lbnQgYXMgdGhlIHNvbGUgYXJndW1lbnQuXG4gKiBAcGFyYW0geyp9IGRlZmluaXRpb24uZGVmYXVsdEZyb20gVGhlIGluaXRpYWwgdmFsdWUgZm9yIGEgdHJhbnNmb3JtLmZyb20uIEZvciBleGFtcGxlLCB0aGUgZGVmYXVsdEZyb20gZm9yIGEgdHJhbnNsYXRpb24gaXMgVEhSRUUuVmVjdG9yMygwLCAwLCAwKS5cbiAqIEBzdGF0aWNcbiAqL1xuVGltZWxpbmUucmVnaXN0ZXIgPSBmdW5jdGlvbihrZXksIGRlZmluaXRpb24pIHtcbiAgVGltZWxpbmUuc2VnbWVudERlZmluaXRpb25zW2tleV0gPSBkZWZpbml0aW9uO1xuICBcbiAgcmV0dXJuIGRlZmluaXRpb247XG59O1xuXG4vKipcbiAqIEFkZCBhIHRyYW5zaXRpb24gdG8gdGhlIHRpbWVsaW5lLlxuICogQHBhcmFtIHtudW1iZXJ9IGR1cmF0aW9uIER1cmF0aW9uIGluIHNlY29uZHNcbiAqIEBwYXJhbSB7b2JqZWN0fSB0cmFuc2l0aW9ucyBBbiBvYmplY3QgY29udGFpbmluZyBvbmUgb3Igc2V2ZXJhbCB0cmFuc2l0aW9ucy4gVGhlIGtleXMgc2hvdWxkIG1hdGNoIHRyYW5zZm9ybSBkZWZpbml0aW9ucy5cbiAqIFRoZSB0cmFuc2l0aW9uIG9iamVjdCBmb3IgZWFjaCBrZXkgd2lsbCBiZSBwYXNzZWQgdG8gdGhlIG1hdGNoaW5nIGRlZmluaXRpb24ncyBjb21waWxlci4gSXQgY2FuIGhhdmUgYXJiaXRyYXJ5IHByb3BlcnRpZXMsIGJ1dCB0aGUgVGltZWxpbmUgZXhwZWN0cyBhdCBsZWFzdCBhICd0bycsICdmcm9tJyBhbmQgYW4gb3B0aW9uYWwgJ2Vhc2UnLlxuICogQHBhcmFtIHtudW1iZXJ8c3RyaW5nfSBbcG9zaXRpb25PZmZzZXRdIFBvc2l0aW9uIGluIHRoZSB0aW1lbGluZS4gRGVmYXVsdHMgdG8gdGhlIGVuZCBvZiB0aGUgdGltZWxpbmUuIElmIGEgbnVtYmVyIGlzIHByb3ZpZGVkLCB0aGUgdHJhbnNpdGlvbiB3aWxsIGJlIGluc2VydGVkIGF0IHRoYXQgdGltZSBpbiBzZWNvbmRzLiBTdHJpbmdzICgnKz14JyBvciAnLT14JykgY2FuIGJlIHVzZWQgZm9yIGEgdmFsdWUgcmVsYXRpdmUgdG8gdGhlIGVuZCBvZiB0aW1lbGluZS5cbiAqL1xuVGltZWxpbmUucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uKGR1cmF0aW9uLCB0cmFuc2l0aW9ucywgcG9zaXRpb25PZmZzZXQpIHtcbiAgLy8gc3RvcCByb2xsdXAgZnJvbSBjb21wbGFpbmluZyBhYm91dCBldmFsXG4gIGNvbnN0IF9ldmFsID0gZXZhbDtcbiAgXG4gIGxldCBzdGFydCA9IHRoaXMuZHVyYXRpb247XG5cbiAgaWYgKHBvc2l0aW9uT2Zmc2V0ICE9PSB1bmRlZmluZWQpIHtcbiAgICBpZiAodHlwZW9mIHBvc2l0aW9uT2Zmc2V0ID09PSAnbnVtYmVyJykge1xuICAgICAgc3RhcnQgPSBwb3NpdGlvbk9mZnNldDtcbiAgICB9XG4gICAgZWxzZSBpZiAodHlwZW9mIHBvc2l0aW9uT2Zmc2V0ID09PSAnc3RyaW5nJykge1xuICAgICAgX2V2YWwoJ3N0YXJ0JyArIHBvc2l0aW9uT2Zmc2V0KTtcbiAgICB9XG5cbiAgICB0aGlzLmR1cmF0aW9uID0gTWF0aC5tYXgodGhpcy5kdXJhdGlvbiwgc3RhcnQgKyBkdXJhdGlvbik7XG4gIH1cbiAgZWxzZSB7XG4gICAgdGhpcy5kdXJhdGlvbiArPSBkdXJhdGlvbjtcbiAgfVxuXG4gIGxldCBrZXlzID0gT2JqZWN0LmtleXModHJhbnNpdGlvbnMpLCBrZXk7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgaSsrKSB7XG4gICAga2V5ID0ga2V5c1tpXTtcblxuICAgIHRoaXMucHJvY2Vzc1RyYW5zaXRpb24oa2V5LCB0cmFuc2l0aW9uc1trZXldLCBzdGFydCwgZHVyYXRpb24pO1xuICB9XG59O1xuXG5UaW1lbGluZS5wcm90b3R5cGUucHJvY2Vzc1RyYW5zaXRpb24gPSBmdW5jdGlvbihrZXksIHRyYW5zaXRpb24sIHN0YXJ0LCBkdXJhdGlvbikge1xuICBjb25zdCBkZWZpbml0aW9uID0gVGltZWxpbmUuc2VnbWVudERlZmluaXRpb25zW2tleV07XG5cbiAgbGV0IHNlZ21lbnRzID0gdGhpcy5zZWdtZW50c1trZXldO1xuICBpZiAoIXNlZ21lbnRzKSBzZWdtZW50cyA9IHRoaXMuc2VnbWVudHNba2V5XSA9IFtdO1xuXG4gIGlmICh0cmFuc2l0aW9uLmZyb20gPT09IHVuZGVmaW5lZCkge1xuICAgIGlmIChzZWdtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHRyYW5zaXRpb24uZnJvbSA9IGRlZmluaXRpb24uZGVmYXVsdEZyb207XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgdHJhbnNpdGlvbi5mcm9tID0gc2VnbWVudHNbc2VnbWVudHMubGVuZ3RoIC0gMV0udHJhbnNpdGlvbi50bztcbiAgICB9XG4gIH1cblxuICBzZWdtZW50cy5wdXNoKG5ldyBUaW1lbGluZVNlZ21lbnQoKHRoaXMuX19rZXkrKykudG9TdHJpbmcoKSwgc3RhcnQsIGR1cmF0aW9uLCB0cmFuc2l0aW9uLCBkZWZpbml0aW9uLmNvbXBpbGVyKSk7XG59O1xuXG4vKipcbiAqIENvbXBpbGVzIHRoZSB0aW1lbGluZSBpbnRvIGEgZ2xzbCBzdHJpbmcgYXJyYXkgdGhhdCBjYW4gYmUgaW5qZWN0ZWQgaW50byBhICh2ZXJ0ZXgpIHNoYWRlci5cbiAqIEByZXR1cm5zIHtBcnJheX1cbiAqL1xuVGltZWxpbmUucHJvdG90eXBlLmNvbXBpbGUgPSBmdW5jdGlvbigpIHtcbiAgY29uc3QgYyA9IFtdO1xuXG4gIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyh0aGlzLnNlZ21lbnRzKTtcbiAgbGV0IHNlZ21lbnRzO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7IGkrKykge1xuICAgIHNlZ21lbnRzID0gdGhpcy5zZWdtZW50c1trZXlzW2ldXTtcblxuICAgIHRoaXMuZmlsbEdhcHMoc2VnbWVudHMpO1xuXG4gICAgc2VnbWVudHMuZm9yRWFjaChmdW5jdGlvbihzKSB7XG4gICAgICBjLnB1c2gocy5jb21waWxlKCkpO1xuICAgIH0pO1xuICB9XG5cbiAgcmV0dXJuIGM7XG59O1xuVGltZWxpbmUucHJvdG90eXBlLmZpbGxHYXBzID0gZnVuY3Rpb24oc2VnbWVudHMpIHtcbiAgaWYgKHNlZ21lbnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuO1xuXG4gIGxldCBzMCwgczE7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBzZWdtZW50cy5sZW5ndGggLSAxOyBpKyspIHtcbiAgICBzMCA9IHNlZ21lbnRzW2ldO1xuICAgIHMxID0gc2VnbWVudHNbaSArIDFdO1xuXG4gICAgczAudHJhaWwgPSBzMS5zdGFydCAtIHMwLmVuZDtcbiAgfVxuXG4gIC8vIHBhZCBsYXN0IHNlZ21lbnQgdW50aWwgZW5kIG9mIHRpbWVsaW5lXG4gIHMwID0gc2VnbWVudHNbc2VnbWVudHMubGVuZ3RoIC0gMV07XG4gIHMwLnRyYWlsID0gdGhpcy5kdXJhdGlvbiAtIHMwLmVuZDtcbn07XG5cbi8qKlxuICogR2V0IGEgY29tcGlsZWQgZ2xzbCBzdHJpbmcgd2l0aCBjYWxscyB0byB0cmFuc2Zvcm0gZnVuY3Rpb25zIGZvciBhIGdpdmVuIGtleS5cbiAqIFRoZSBvcmRlciBpbiB3aGljaCB0aGVzZSB0cmFuc2l0aW9ucyBhcmUgYXBwbGllZCBtYXR0ZXJzIGJlY2F1c2UgdGhleSBhbGwgb3BlcmF0ZSBvbiB0aGUgc2FtZSB2YWx1ZS5cbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgQSBrZXkgbWF0Y2hpbmcgYSB0cmFuc2Zvcm0gZGVmaW5pdGlvbi5cbiAqIEByZXR1cm5zIHtzdHJpbmd9XG4gKi9cblRpbWVsaW5lLnByb3RvdHlwZS5nZXRUcmFuc2Zvcm1DYWxscyA9IGZ1bmN0aW9uKGtleSkge1xuICBsZXQgdCA9IHRoaXMudGltZUtleTtcblxuICByZXR1cm4gdGhpcy5zZWdtZW50c1trZXldID8gIHRoaXMuc2VnbWVudHNba2V5XS5tYXAoZnVuY3Rpb24ocykge1xuICAgIHJldHVybiBgYXBwbHlUcmFuc2Zvcm0ke3Mua2V5fSgke3R9LCB0cmFuc2Zvcm1lZCk7YDtcbiAgfSkuam9pbignXFxuJykgOiAnJztcbn07XG5cbmV4cG9ydCB7IFRpbWVsaW5lIH1cbiIsImNvbnN0IFRpbWVsaW5lQ2h1bmtzID0ge1xuICB2ZWMzOiBmdW5jdGlvbihuLCB2LCBwKSB7XG4gICAgY29uc3QgeCA9ICh2LnggfHwgMCkudG9QcmVjaXNpb24ocCk7XG4gICAgY29uc3QgeSA9ICh2LnkgfHwgMCkudG9QcmVjaXNpb24ocCk7XG4gICAgY29uc3QgeiA9ICh2LnogfHwgMCkudG9QcmVjaXNpb24ocCk7XG5cbiAgICByZXR1cm4gYHZlYzMgJHtufSA9IHZlYzMoJHt4fSwgJHt5fSwgJHt6fSk7YDtcbiAgfSxcbiAgdmVjNDogZnVuY3Rpb24obiwgdiwgcCkge1xuICAgIGNvbnN0IHggPSAodi54IHx8IDApLnRvUHJlY2lzaW9uKHApO1xuICAgIGNvbnN0IHkgPSAodi55IHx8IDApLnRvUHJlY2lzaW9uKHApO1xuICAgIGNvbnN0IHogPSAodi56IHx8IDApLnRvUHJlY2lzaW9uKHApO1xuICAgIGNvbnN0IHcgPSAodi53IHx8IDApLnRvUHJlY2lzaW9uKHApO1xuICBcbiAgICByZXR1cm4gYHZlYzQgJHtufSA9IHZlYzQoJHt4fSwgJHt5fSwgJHt6fSwgJHt3fSk7YDtcbiAgfSxcbiAgZGVsYXlEdXJhdGlvbjogZnVuY3Rpb24oc2VnbWVudCkge1xuICAgIHJldHVybiBgXG4gICAgZmxvYXQgY0RlbGF5JHtzZWdtZW50LmtleX0gPSAke3NlZ21lbnQuc3RhcnQudG9QcmVjaXNpb24oNCl9O1xuICAgIGZsb2F0IGNEdXJhdGlvbiR7c2VnbWVudC5rZXl9ID0gJHtzZWdtZW50LmR1cmF0aW9uLnRvUHJlY2lzaW9uKDQpfTtcbiAgICBgO1xuICB9LFxuICBwcm9ncmVzczogZnVuY3Rpb24oc2VnbWVudCkge1xuICAgIC8vIHplcm8gZHVyYXRpb24gc2VnbWVudHMgc2hvdWxkIGFsd2F5cyByZW5kZXIgY29tcGxldGVcbiAgICBpZiAoc2VnbWVudC5kdXJhdGlvbiA9PT0gMCkge1xuICAgICAgcmV0dXJuIGBmbG9hdCBwcm9ncmVzcyA9IDEuMDtgXG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgcmV0dXJuIGBcbiAgICAgIGZsb2F0IHByb2dyZXNzID0gY2xhbXAodGltZSAtIGNEZWxheSR7c2VnbWVudC5rZXl9LCAwLjAsIGNEdXJhdGlvbiR7c2VnbWVudC5rZXl9KSAvIGNEdXJhdGlvbiR7c2VnbWVudC5rZXl9O1xuICAgICAgJHtzZWdtZW50LnRyYW5zaXRpb24uZWFzZSA/IGBwcm9ncmVzcyA9ICR7c2VnbWVudC50cmFuc2l0aW9uLmVhc2V9KHByb2dyZXNzJHsoc2VnbWVudC50cmFuc2l0aW9uLmVhc2VQYXJhbXMgPyBgLCAke3NlZ21lbnQudHJhbnNpdGlvbi5lYXNlUGFyYW1zLm1hcCgodikgPT4gdi50b1ByZWNpc2lvbig0KSkuam9pbihgLCBgKX1gIDogYGApfSk7YCA6IGBgfVxuICAgICAgYDtcbiAgICB9XG4gIH0sXG4gIHJlbmRlckNoZWNrOiBmdW5jdGlvbihzZWdtZW50KSB7XG4gICAgY29uc3Qgc3RhcnRUaW1lID0gc2VnbWVudC5zdGFydC50b1ByZWNpc2lvbig0KTtcbiAgICBjb25zdCBlbmRUaW1lID0gKHNlZ21lbnQuZW5kICsgc2VnbWVudC50cmFpbCkudG9QcmVjaXNpb24oNCk7XG5cbiAgICByZXR1cm4gYGlmICh0aW1lIDwgJHtzdGFydFRpbWV9IHx8IHRpbWUgPiAke2VuZFRpbWV9KSByZXR1cm47YDtcbiAgfVxufTtcblxuZXhwb3J0IHsgVGltZWxpbmVDaHVua3MgfTtcbiIsImltcG9ydCB7IFRpbWVsaW5lIH0gZnJvbSAnLi9UaW1lbGluZSc7XG5pbXBvcnQgeyBUaW1lbGluZUNodW5rcyB9IGZyb20gJy4vVGltZWxpbmVDaHVua3MnO1xuaW1wb3J0IHsgVmVjdG9yMyB9IGZyb20gJ3RocmVlJztcblxuY29uc3QgVHJhbnNsYXRpb25TZWdtZW50ID0ge1xuICBjb21waWxlcjogZnVuY3Rpb24oc2VnbWVudCkge1xuICAgIHJldHVybiBgXG4gICAgJHtUaW1lbGluZUNodW5rcy5kZWxheUR1cmF0aW9uKHNlZ21lbnQpfVxuICAgICR7VGltZWxpbmVDaHVua3MudmVjMyhgY1RyYW5zbGF0ZUZyb20ke3NlZ21lbnQua2V5fWAsIHNlZ21lbnQudHJhbnNpdGlvbi5mcm9tLCAyKX1cbiAgICAke1RpbWVsaW5lQ2h1bmtzLnZlYzMoYGNUcmFuc2xhdGVUbyR7c2VnbWVudC5rZXl9YCwgc2VnbWVudC50cmFuc2l0aW9uLnRvLCAyKX1cbiAgICBcbiAgICB2b2lkIGFwcGx5VHJhbnNmb3JtJHtzZWdtZW50LmtleX0oZmxvYXQgdGltZSwgaW5vdXQgdmVjMyB2KSB7XG4gICAgXG4gICAgICAke1RpbWVsaW5lQ2h1bmtzLnJlbmRlckNoZWNrKHNlZ21lbnQpfVxuICAgICAgJHtUaW1lbGluZUNodW5rcy5wcm9ncmVzcyhzZWdtZW50KX1cbiAgICBcbiAgICAgIHYgKz0gbWl4KGNUcmFuc2xhdGVGcm9tJHtzZWdtZW50LmtleX0sIGNUcmFuc2xhdGVUbyR7c2VnbWVudC5rZXl9LCBwcm9ncmVzcyk7XG4gICAgfVxuICAgIGA7XG4gIH0sXG4gIGRlZmF1bHRGcm9tOiBuZXcgVmVjdG9yMygwLCAwLCAwKVxufTtcblxuVGltZWxpbmUucmVnaXN0ZXIoJ3RyYW5zbGF0ZScsIFRyYW5zbGF0aW9uU2VnbWVudCk7XG5cbmV4cG9ydCB7IFRyYW5zbGF0aW9uU2VnbWVudCB9O1xuIiwiaW1wb3J0IHsgVGltZWxpbmUgfSBmcm9tICcuL1RpbWVsaW5lJztcbmltcG9ydCB7IFRpbWVsaW5lQ2h1bmtzIH0gZnJvbSAnLi9UaW1lbGluZUNodW5rcyc7XG5pbXBvcnQgeyBWZWN0b3IzIH0gZnJvbSAndGhyZWUnO1xuXG5jb25zdCBTY2FsZVNlZ21lbnQgPSB7XG4gIGNvbXBpbGVyOiBmdW5jdGlvbihzZWdtZW50KSB7XG4gICAgY29uc3Qgb3JpZ2luID0gc2VnbWVudC50cmFuc2l0aW9uLm9yaWdpbjtcbiAgICBcbiAgICByZXR1cm4gYFxuICAgICR7VGltZWxpbmVDaHVua3MuZGVsYXlEdXJhdGlvbihzZWdtZW50KX1cbiAgICAke1RpbWVsaW5lQ2h1bmtzLnZlYzMoYGNTY2FsZUZyb20ke3NlZ21lbnQua2V5fWAsIHNlZ21lbnQudHJhbnNpdGlvbi5mcm9tLCAyKX1cbiAgICAke1RpbWVsaW5lQ2h1bmtzLnZlYzMoYGNTY2FsZVRvJHtzZWdtZW50LmtleX1gLCBzZWdtZW50LnRyYW5zaXRpb24udG8sIDIpfVxuICAgICR7b3JpZ2luID8gVGltZWxpbmVDaHVua3MudmVjMyhgY09yaWdpbiR7c2VnbWVudC5rZXl9YCwgb3JpZ2luLCAyKSA6ICcnfVxuICAgIFxuICAgIHZvaWQgYXBwbHlUcmFuc2Zvcm0ke3NlZ21lbnQua2V5fShmbG9hdCB0aW1lLCBpbm91dCB2ZWMzIHYpIHtcbiAgICBcbiAgICAgICR7VGltZWxpbmVDaHVua3MucmVuZGVyQ2hlY2soc2VnbWVudCl9XG4gICAgICAke1RpbWVsaW5lQ2h1bmtzLnByb2dyZXNzKHNlZ21lbnQpfVxuICAgIFxuICAgICAgJHtvcmlnaW4gPyBgdiAtPSBjT3JpZ2luJHtzZWdtZW50LmtleX07YCA6ICcnfVxuICAgICAgdiAqPSBtaXgoY1NjYWxlRnJvbSR7c2VnbWVudC5rZXl9LCBjU2NhbGVUbyR7c2VnbWVudC5rZXl9LCBwcm9ncmVzcyk7XG4gICAgICAke29yaWdpbiA/IGB2ICs9IGNPcmlnaW4ke3NlZ21lbnQua2V5fTtgIDogJyd9XG4gICAgfVxuICAgIGA7XG4gIH0sXG4gIGRlZmF1bHRGcm9tOiBuZXcgVmVjdG9yMygxLCAxLCAxKVxufTtcblxuVGltZWxpbmUucmVnaXN0ZXIoJ3NjYWxlJywgU2NhbGVTZWdtZW50KTtcblxuZXhwb3J0IHsgU2NhbGVTZWdtZW50IH07XG4iLCJpbXBvcnQgeyBUaW1lbGluZSB9IGZyb20gJy4vVGltZWxpbmUnO1xuaW1wb3J0IHsgVGltZWxpbmVDaHVua3MgfSBmcm9tICcuL1RpbWVsaW5lQ2h1bmtzJztcbmltcG9ydCB7IFZlY3RvcjMsIFZlY3RvcjQgfSBmcm9tICd0aHJlZSc7XG5cbmNvbnN0IFJvdGF0aW9uU2VnbWVudCA9IHtcbiAgY29tcGlsZXIoc2VnbWVudCkge1xuICAgIGNvbnN0IGZyb21BeGlzQW5nbGUgPSBuZXcgVmVjdG9yNChcbiAgICAgIHNlZ21lbnQudHJhbnNpdGlvbi5mcm9tLmF4aXMueCxcbiAgICAgIHNlZ21lbnQudHJhbnNpdGlvbi5mcm9tLmF4aXMueSxcbiAgICAgIHNlZ21lbnQudHJhbnNpdGlvbi5mcm9tLmF4aXMueixcbiAgICAgIHNlZ21lbnQudHJhbnNpdGlvbi5mcm9tLmFuZ2xlXG4gICAgKTtcbiAgXG4gICAgY29uc3QgdG9BeGlzID0gc2VnbWVudC50cmFuc2l0aW9uLnRvLmF4aXMgfHwgc2VnbWVudC50cmFuc2l0aW9uLmZyb20uYXhpcztcbiAgICBjb25zdCB0b0F4aXNBbmdsZSA9IG5ldyBWZWN0b3I0KFxuICAgICAgdG9BeGlzLngsXG4gICAgICB0b0F4aXMueSxcbiAgICAgIHRvQXhpcy56LFxuICAgICAgc2VnbWVudC50cmFuc2l0aW9uLnRvLmFuZ2xlXG4gICAgKTtcbiAgXG4gICAgY29uc3Qgb3JpZ2luID0gc2VnbWVudC50cmFuc2l0aW9uLm9yaWdpbjtcbiAgICBcbiAgICByZXR1cm4gYFxuICAgICR7VGltZWxpbmVDaHVua3MuZGVsYXlEdXJhdGlvbihzZWdtZW50KX1cbiAgICAke1RpbWVsaW5lQ2h1bmtzLnZlYzQoYGNSb3RhdGlvbkZyb20ke3NlZ21lbnQua2V5fWAsIGZyb21BeGlzQW5nbGUsIDgpfVxuICAgICR7VGltZWxpbmVDaHVua3MudmVjNChgY1JvdGF0aW9uVG8ke3NlZ21lbnQua2V5fWAsIHRvQXhpc0FuZ2xlLCA4KX1cbiAgICAke29yaWdpbiA/IFRpbWVsaW5lQ2h1bmtzLnZlYzMoYGNPcmlnaW4ke3NlZ21lbnQua2V5fWAsIG9yaWdpbiwgMikgOiAnJ31cbiAgICBcbiAgICB2b2lkIGFwcGx5VHJhbnNmb3JtJHtzZWdtZW50LmtleX0oZmxvYXQgdGltZSwgaW5vdXQgdmVjMyB2KSB7XG4gICAgICAke1RpbWVsaW5lQ2h1bmtzLnJlbmRlckNoZWNrKHNlZ21lbnQpfVxuICAgICAgJHtUaW1lbGluZUNodW5rcy5wcm9ncmVzcyhzZWdtZW50KX1cblxuICAgICAgJHtvcmlnaW4gPyBgdiAtPSBjT3JpZ2luJHtzZWdtZW50LmtleX07YCA6ICcnfVxuICAgICAgdmVjMyBheGlzID0gbm9ybWFsaXplKG1peChjUm90YXRpb25Gcm9tJHtzZWdtZW50LmtleX0ueHl6LCBjUm90YXRpb25UbyR7c2VnbWVudC5rZXl9Lnh5eiwgcHJvZ3Jlc3MpKTtcbiAgICAgIGZsb2F0IGFuZ2xlID0gbWl4KGNSb3RhdGlvbkZyb20ke3NlZ21lbnQua2V5fS53LCBjUm90YXRpb25UbyR7c2VnbWVudC5rZXl9LncsIHByb2dyZXNzKTtcbiAgICAgIHZlYzQgcSA9IHF1YXRGcm9tQXhpc0FuZ2xlKGF4aXMsIGFuZ2xlKTtcbiAgICAgIHYgPSByb3RhdGVWZWN0b3IocSwgdik7XG4gICAgICAke29yaWdpbiA/IGB2ICs9IGNPcmlnaW4ke3NlZ21lbnQua2V5fTtgIDogJyd9XG4gICAgfVxuICAgIGA7XG4gIH0sXG4gIGRlZmF1bHRGcm9tOiB7YXhpczogbmV3IFZlY3RvcjMoKSwgYW5nbGU6IDB9XG59O1xuXG5UaW1lbGluZS5yZWdpc3Rlcigncm90YXRlJywgUm90YXRpb25TZWdtZW50KTtcblxuZXhwb3J0IHsgUm90YXRpb25TZWdtZW50IH07XG4iXSwibmFtZXMiOlsiQmFzZUFuaW1hdGlvbk1hdGVyaWFsIiwicGFyYW1ldGVycyIsInVuaWZvcm1zIiwiY2FsbCIsInVuaWZvcm1WYWx1ZXMiLCJzZXRWYWx1ZXMiLCJVbmlmb3Jtc1V0aWxzIiwibWVyZ2UiLCJzZXRVbmlmb3JtVmFsdWVzIiwibWFwIiwiZGVmaW5lcyIsIm5vcm1hbE1hcCIsImVudk1hcCIsImFvTWFwIiwic3BlY3VsYXJNYXAiLCJhbHBoYU1hcCIsImxpZ2h0TWFwIiwiZW1pc3NpdmVNYXAiLCJidW1wTWFwIiwiZGlzcGxhY2VtZW50TWFwIiwicm91Z2huZXNzTWFwIiwibWV0YWxuZXNzTWFwIiwiZW52TWFwVHlwZURlZmluZSIsImVudk1hcE1vZGVEZWZpbmUiLCJlbnZNYXBCbGVuZGluZ0RlZmluZSIsIm1hcHBpbmciLCJDdWJlUmVmbGVjdGlvbk1hcHBpbmciLCJDdWJlUmVmcmFjdGlvbk1hcHBpbmciLCJDdWJlVVZSZWZsZWN0aW9uTWFwcGluZyIsIkN1YmVVVlJlZnJhY3Rpb25NYXBwaW5nIiwiRXF1aXJlY3Rhbmd1bGFyUmVmbGVjdGlvbk1hcHBpbmciLCJFcXVpcmVjdGFuZ3VsYXJSZWZyYWN0aW9uTWFwcGluZyIsIlNwaGVyaWNhbFJlZmxlY3Rpb25NYXBwaW5nIiwiY29tYmluZSIsIk1peE9wZXJhdGlvbiIsIkFkZE9wZXJhdGlvbiIsIk11bHRpcGx5T3BlcmF0aW9uIiwicHJvdG90eXBlIiwiT2JqZWN0IiwiYXNzaWduIiwiY3JlYXRlIiwiU2hhZGVyTWF0ZXJpYWwiLCJ2YWx1ZXMiLCJrZXlzIiwiZm9yRWFjaCIsImtleSIsInZhbHVlIiwibmFtZSIsImpvaW4iLCJCYXNpY0FuaW1hdGlvbk1hdGVyaWFsIiwidmFyeWluZ1BhcmFtZXRlcnMiLCJ2ZXJ0ZXhQYXJhbWV0ZXJzIiwidmVydGV4RnVuY3Rpb25zIiwidmVydGV4SW5pdCIsInZlcnRleE5vcm1hbCIsInZlcnRleFBvc2l0aW9uIiwidmVydGV4Q29sb3IiLCJmcmFnbWVudEZ1bmN0aW9ucyIsImZyYWdtZW50UGFyYW1ldGVycyIsImZyYWdtZW50SW5pdCIsImZyYWdtZW50TWFwIiwiZnJhZ21lbnREaWZmdXNlIiwiU2hhZGVyTGliIiwibGlnaHRzIiwidmVydGV4U2hhZGVyIiwiY29uY2F0VmVydGV4U2hhZGVyIiwiZnJhZ21lbnRTaGFkZXIiLCJjb25jYXRGcmFnbWVudFNoYWRlciIsImNvbnN0cnVjdG9yIiwic3RyaW5naWZ5Q2h1bmsiLCJMYW1iZXJ0QW5pbWF0aW9uTWF0ZXJpYWwiLCJmcmFnbWVudEVtaXNzaXZlIiwiZnJhZ21lbnRTcGVjdWxhciIsIlBob25nQW5pbWF0aW9uTWF0ZXJpYWwiLCJTdGFuZGFyZEFuaW1hdGlvbk1hdGVyaWFsIiwiZnJhZ21lbnRSb3VnaG5lc3MiLCJmcmFnbWVudE1ldGFsbmVzcyIsIlBvaW50c0FuaW1hdGlvbk1hdGVyaWFsIiwiZnJhZ21lbnRTaGFwZSIsIkRlcHRoQW5pbWF0aW9uTWF0ZXJpYWwiLCJkZXB0aFBhY2tpbmciLCJSR0JBRGVwdGhQYWNraW5nIiwiY2xpcHBpbmciLCJEaXN0YW5jZUFuaW1hdGlvbk1hdGVyaWFsIiwiUHJlZmFiQnVmZmVyR2VvbWV0cnkiLCJwcmVmYWIiLCJjb3VudCIsInByZWZhYkdlb21ldHJ5IiwiaXNQcmVmYWJCdWZmZXJHZW9tZXRyeSIsImlzQnVmZmVyR2VvbWV0cnkiLCJwcmVmYWJDb3VudCIsInByZWZhYlZlcnRleENvdW50IiwiYXR0cmlidXRlcyIsInBvc2l0aW9uIiwidmVydGljZXMiLCJsZW5ndGgiLCJidWZmZXJJbmRpY2VzIiwiYnVmZmVyUG9zaXRpb25zIiwiQnVmZmVyR2VvbWV0cnkiLCJwcmVmYWJJbmRpY2VzIiwicHJlZmFiSW5kZXhDb3VudCIsImluZGV4IiwiYXJyYXkiLCJpIiwicHVzaCIsInByZWZhYkZhY2VDb3VudCIsImZhY2VzIiwiZmFjZSIsImEiLCJiIiwiYyIsImluZGV4QnVmZmVyIiwiVWludDMyQXJyYXkiLCJzZXRJbmRleCIsIkJ1ZmZlckF0dHJpYnV0ZSIsImsiLCJwb3NpdGlvbkJ1ZmZlciIsImNyZWF0ZUF0dHJpYnV0ZSIsInBvc2l0aW9ucyIsIm9mZnNldCIsImoiLCJwcmVmYWJWZXJ0ZXgiLCJ4IiwieSIsInoiLCJidWZmZXJVdnMiLCJwcmVmYWJVdnMiLCJ1diIsIlZlY3RvcjIiLCJmYWNlVmVydGV4VXZzIiwidXZCdWZmZXIiLCJwcmVmYWJVdiIsIml0ZW1TaXplIiwiZmFjdG9yeSIsImJ1ZmZlciIsIkZsb2F0MzJBcnJheSIsImF0dHJpYnV0ZSIsImFkZEF0dHJpYnV0ZSIsImRhdGEiLCJzZXRQcmVmYWJEYXRhIiwicHJlZmFiSW5kZXgiLCJNdWx0aVByZWZhYkJ1ZmZlckdlb21ldHJ5IiwicHJlZmFicyIsInJlcGVhdENvdW50IiwiQXJyYXkiLCJpc0FycmF5IiwicHJlZmFiR2VvbWV0cmllcyIsInByZWZhYkdlb21ldHJpZXNDb3VudCIsInByZWZhYlZlcnRleENvdW50cyIsInAiLCJyZXBlYXRWZXJ0ZXhDb3VudCIsInJlZHVjZSIsInIiLCJ2IiwicmVwZWF0SW5kZXhDb3VudCIsImluZGljZXMiLCJnZW9tZXRyeSIsImluZGV4T2Zmc2V0IiwicHJlZmFiT2Zmc2V0IiwidmVydGV4Q291bnQiLCJwcmVmYWJQb3NpdGlvbnMiLCJ1dnMiLCJlcnJvciIsInV2T2JqZWN0cyIsInByZWZhYkdlb21ldHJ5SW5kZXgiLCJwcmVmYWJHZW9tZXRyeVZlcnRleENvdW50Iiwid2hvbGUiLCJ3aG9sZU9mZnNldCIsInBhcnQiLCJwYXJ0T2Zmc2V0IiwiVXRpbHMiLCJpbCIsIm4iLCJ2YSIsInZiIiwidmMiLCJjbG9uZSIsIlRIUkVFIiwiVmVjdG9yMyIsImJveCIsInRNYXRoIiwicmFuZEZsb2F0IiwibWluIiwibWF4IiwicmFuZEZsb2F0U3ByZWFkIiwibm9ybWFsaXplIiwic291cmNlTWF0ZXJpYWwiLCJNb2RlbEJ1ZmZlckdlb21ldHJ5IiwibW9kZWwiLCJvcHRpb25zIiwibW9kZWxHZW9tZXRyeSIsImZhY2VDb3VudCIsImNvbXB1dGVDZW50cm9pZHMiLCJsb2NhbGl6ZUZhY2VzIiwiY2VudHJvaWRzIiwiY29tcHV0ZUNlbnRyb2lkIiwiY2VudHJvaWQiLCJCQVMiLCJ2ZXJ0ZXgiLCJidWZmZXJVVnMiLCJzZXRGYWNlRGF0YSIsImZhY2VJbmRleCIsIlBvaW50QnVmZmVyR2VvbWV0cnkiLCJwb2ludENvdW50Iiwic2V0UG9pbnREYXRhIiwicG9pbnRJbmRleCIsIlNoYWRlckNodW5rIiwiY2F0bXVsbF9yb21fc3BsaW5lIiwiY3ViaWNfYmV6aWVyIiwiZWFzZV9iYWNrX2luIiwiZWFzZV9iYWNrX2luX291dCIsImVhc2VfYmFja19vdXQiLCJlYXNlX2JlemllciIsImVhc2VfYm91bmNlX2luIiwiZWFzZV9ib3VuY2VfaW5fb3V0IiwiZWFzZV9ib3VuY2Vfb3V0IiwiZWFzZV9jaXJjX2luIiwiZWFzZV9jaXJjX2luX291dCIsImVhc2VfY2lyY19vdXQiLCJlYXNlX2N1YmljX2luIiwiZWFzZV9jdWJpY19pbl9vdXQiLCJlYXNlX2N1YmljX291dCIsImVhc2VfZWxhc3RpY19pbiIsImVhc2VfZWxhc3RpY19pbl9vdXQiLCJlYXNlX2VsYXN0aWNfb3V0IiwiZWFzZV9leHBvX2luIiwiZWFzZV9leHBvX2luX291dCIsImVhc2VfZXhwb19vdXQiLCJlYXNlX3F1YWRfaW4iLCJlYXNlX3F1YWRfaW5fb3V0IiwiZWFzZV9xdWFkX291dCIsImVhc2VfcXVhcnRfaW4iLCJlYXNlX3F1YXJ0X2luX291dCIsImVhc2VfcXVhcnRfb3V0IiwiZWFzZV9xdWludF9pbiIsImVhc2VfcXVpbnRfaW5fb3V0IiwiZWFzZV9xdWludF9vdXQiLCJlYXNlX3NpbmVfaW4iLCJlYXNlX3NpbmVfaW5fb3V0IiwiZWFzZV9zaW5lX291dCIsInF1YXRlcm5pb25fcm90YXRpb24iLCJxdWF0ZXJuaW9uX3NsZXJwIiwiVGltZWxpbmVTZWdtZW50Iiwic3RhcnQiLCJkdXJhdGlvbiIsInRyYW5zaXRpb24iLCJjb21waWxlciIsInRyYWlsIiwiY29tcGlsZSIsImRlZmluZVByb3BlcnR5IiwiVGltZWxpbmUiLCJ0aW1lS2V5Iiwic2VnbWVudHMiLCJfX2tleSIsInNlZ21lbnREZWZpbml0aW9ucyIsInJlZ2lzdGVyIiwiZGVmaW5pdGlvbiIsImFkZCIsInRyYW5zaXRpb25zIiwicG9zaXRpb25PZmZzZXQiLCJfZXZhbCIsImV2YWwiLCJ1bmRlZmluZWQiLCJNYXRoIiwicHJvY2Vzc1RyYW5zaXRpb24iLCJmcm9tIiwiZGVmYXVsdEZyb20iLCJ0byIsInRvU3RyaW5nIiwiZmlsbEdhcHMiLCJzIiwiczAiLCJzMSIsImVuZCIsImdldFRyYW5zZm9ybUNhbGxzIiwidCIsIlRpbWVsaW5lQ2h1bmtzIiwidG9QcmVjaXNpb24iLCJ3Iiwic2VnbWVudCIsImVhc2UiLCJlYXNlUGFyYW1zIiwic3RhcnRUaW1lIiwiZW5kVGltZSIsIlRyYW5zbGF0aW9uU2VnbWVudCIsImRlbGF5RHVyYXRpb24iLCJ2ZWMzIiwicmVuZGVyQ2hlY2siLCJwcm9ncmVzcyIsIlNjYWxlU2VnbWVudCIsIm9yaWdpbiIsIlJvdGF0aW9uU2VnbWVudCIsImZyb21BeGlzQW5nbGUiLCJWZWN0b3I0IiwiYXhpcyIsImFuZ2xlIiwidG9BeGlzIiwidG9BeGlzQW5nbGUiLCJ2ZWM0Il0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFlQSxTQUFTQSxxQkFBVCxDQUErQkMsVUFBL0IsRUFBMkNDLFFBQTNDLEVBQXFEO3VCQUNwQ0MsSUFBZixDQUFvQixJQUFwQjs7TUFFTUMsZ0JB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
