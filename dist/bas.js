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
  this.vertexPostMorph = [];
  this.vertexPostSkinning = [];

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
  return '\n  #include <common>\n  #include <uv_pars_vertex>\n  #include <uv2_pars_vertex>\n  #include <envmap_pars_vertex>\n  #include <color_pars_vertex>\n  #include <fog_pars_vertex>\n  #include <morphtarget_pars_vertex>\n  #include <skinning_pars_vertex>\n  #include <logdepthbuf_pars_vertex>\n  #include <clipping_planes_pars_vertex>\n  \n  ' + this.stringifyChunk('vertexParameters') + '\n  ' + this.stringifyChunk('varyingParameters') + '\n  ' + this.stringifyChunk('vertexFunctions') + '\n  \n  void main() {\n\n    ' + this.stringifyChunk('vertexInit') + '\n  \n    #include <uv_vertex>\n    #include <uv2_vertex>\n    #include <color_vertex>\n    #include <skinbase_vertex>\n  \n    #ifdef USE_ENVMAP\n  \n    #include <beginnormal_vertex>\n    \n    ' + this.stringifyChunk('vertexNormal') + '\n    \n    #include <morphnormal_vertex>\n    #include <skinnormal_vertex>\n    #include <defaultnormal_vertex>\n  \n    #endif\n  \n    #include <begin_vertex>\n    \n    ' + this.stringifyChunk('vertexPosition') + '\n    ' + this.stringifyChunk('vertexColor') + '\n    \n    #include <morphtarget_vertex>\n    \n    ' + this.stringifyChunk('vertexPostMorph') + '\n    \n    #include <skinning_vertex>\n\n    ' + this.stringifyChunk('vertexPostSkinning') + '\n\n    #include <project_vertex>\n    #include <logdepthbuf_vertex>\n  \n    #include <worldpos_vertex>\n    #include <clipping_planes_vertex>\n    #include <envmap_vertex>\n    #include <fog_vertex>\n  }';
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
  this.vertexPostMorph = [];
  this.vertexPostSkinning = [];

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
  return '\n  #define LAMBERT\n\n  varying vec3 vLightFront;\n  \n  #ifdef DOUBLE_SIDED\n  \n    varying vec3 vLightBack;\n  \n  #endif\n  \n  #include <common>\n  #include <uv_pars_vertex>\n  #include <uv2_pars_vertex>\n  #include <envmap_pars_vertex>\n  #include <bsdfs>\n  #include <lights_pars_begin>\n  #include <lights_pars_maps>\n  #include <color_pars_vertex>\n  #include <fog_pars_vertex>\n  #include <morphtarget_pars_vertex>\n  #include <skinning_pars_vertex>\n  #include <shadowmap_pars_vertex>\n  #include <logdepthbuf_pars_vertex>\n  #include <clipping_planes_pars_vertex>\n  \n  ' + this.stringifyChunk('vertexParameters') + '\n  ' + this.stringifyChunk('varyingParameters') + '\n  ' + this.stringifyChunk('vertexFunctions') + '\n  \n  void main() {\n  \n    ' + this.stringifyChunk('vertexInit') + '\n  \n    #include <uv_vertex>\n    #include <uv2_vertex>\n    #include <color_vertex>\n  \n    #include <beginnormal_vertex>\n    \n    ' + this.stringifyChunk('vertexNormal') + '\n    \n    #include <morphnormal_vertex>\n    #include <skinbase_vertex>\n    #include <skinnormal_vertex>\n    #include <defaultnormal_vertex>\n  \n    #include <begin_vertex>\n    \n    ' + this.stringifyChunk('vertexPosition') + '\n    ' + this.stringifyChunk('vertexColor') + '\n    \n    #include <morphtarget_vertex>\n    \n    ' + this.stringifyChunk('vertexPostMorph') + '\n    \n    #include <skinning_vertex>\n\n    ' + this.stringifyChunk('vertexPostSkinning') + '\n    \n    #include <project_vertex>\n    #include <logdepthbuf_vertex>\n    #include <clipping_planes_vertex>\n  \n    #include <worldpos_vertex>\n    #include <envmap_vertex>\n    #include <lights_lambert_vertex>\n    #include <shadowmap_vertex>\n    #include <fog_vertex>\n  }';
};

LambertAnimationMaterial.prototype.concatFragmentShader = function () {
  return '\n  uniform vec3 diffuse;\n  uniform vec3 emissive;\n  uniform float opacity;\n  \n  varying vec3 vLightFront;\n  \n  #ifdef DOUBLE_SIDED\n  \n    varying vec3 vLightBack;\n  \n  #endif\n  \n  #include <common>\n  #include <packing>\n  #include <dithering_pars_fragment>\n  #include <color_pars_fragment>\n  #include <uv_pars_fragment>\n  #include <uv2_pars_fragment>\n  #include <map_pars_fragment>\n  #include <alphamap_pars_fragment>\n  #include <aomap_pars_fragment>\n  #include <lightmap_pars_fragment>\n  #include <emissivemap_pars_fragment>\n  #include <envmap_pars_fragment>\n  #include <bsdfs>\n  #include <lights_pars_begin>\n  #include <lights_pars_maps>\n  #include <fog_pars_fragment>\n  #include <shadowmap_pars_fragment>\n  #include <shadowmask_pars_fragment>\n  #include <specularmap_pars_fragment>\n  #include <logdepthbuf_pars_fragment>\n  #include <clipping_planes_pars_fragment>\n  \n  ' + this.stringifyChunk('fragmentParameters') + '\n  ' + this.stringifyChunk('varyingParameters') + '\n  ' + this.stringifyChunk('fragmentFunctions') + '\n  \n  void main() {\n  \n    ' + this.stringifyChunk('fragmentInit') + '\n  \n    #include <clipping_planes_fragment>\n\n    vec4 diffuseColor = vec4( diffuse, opacity );\n    ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );\n    vec3 totalEmissiveRadiance = emissive;\n\t\n    ' + this.stringifyChunk('fragmentDiffuse') + '\n  \n    #include <logdepthbuf_fragment>\n\n    ' + (this.stringifyChunk('fragmentMap') || '#include <map_fragment>') + '\n\n    #include <color_fragment>\n    #include <alphamap_fragment>\n    #include <alphatest_fragment>\n    #include <specularmap_fragment>\n\n    ' + this.stringifyChunk('fragmentEmissive') + '\n\n    #include <emissivemap_fragment>\n  \n    // accumulation\n    reflectedLight.indirectDiffuse = getAmbientLightIrradiance( ambientLightColor );\n  \n    #include <lightmap_fragment>\n  \n    reflectedLight.indirectDiffuse *= BRDF_Diffuse_Lambert( diffuseColor.rgb );\n  \n    #ifdef DOUBLE_SIDED\n  \n      reflectedLight.directDiffuse = ( gl_FrontFacing ) ? vLightFront : vLightBack;\n  \n    #else\n  \n      reflectedLight.directDiffuse = vLightFront;\n  \n    #endif\n  \n    reflectedLight.directDiffuse *= BRDF_Diffuse_Lambert( diffuseColor.rgb ) * getShadowMask();\n  \n    // modulation\n    #include <aomap_fragment>\n  \n    vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;\n  \n    #include <envmap_fragment>\n  \n    gl_FragColor = vec4( outgoingLight, diffuseColor.a );\n  \n    #include <tonemapping_fragment>\n    #include <encodings_fragment>\n    #include <fog_fragment>\n    #include <premultiplied_alpha_fragment>\n    #include <dithering_fragment>\n  }';
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
  return '\n  #define PHONG\n\n  uniform vec3 diffuse;\n  uniform vec3 emissive;\n  uniform vec3 specular;\n  uniform float shininess;\n  uniform float opacity;\n  \n  #include <common>\n  #include <packing>\n  #include <dithering_pars_fragment>\n  #include <color_pars_fragment>\n  #include <uv_pars_fragment>\n  #include <uv2_pars_fragment>\n  #include <map_pars_fragment>\n  #include <alphamap_pars_fragment>\n  #include <aomap_pars_fragment>\n  #include <lightmap_pars_fragment>\n  #include <emissivemap_pars_fragment>\n  #include <envmap_pars_fragment>\n  #include <gradientmap_pars_fragment>\n  #include <fog_pars_fragment>\n  #include <bsdfs>\n  #include <lights_pars_begin>\n  #include <lights_pars_maps>\n  #include <lights_phong_pars_fragment>\n  #include <shadowmap_pars_fragment>\n  #include <bumpmap_pars_fragment>\n  #include <normalmap_pars_fragment>\n  #include <specularmap_pars_fragment>\n  #include <logdepthbuf_pars_fragment>\n  #include <clipping_planes_pars_fragment>\n  \n  ' + this.stringifyChunk('fragmentParameters') + '\n  ' + this.stringifyChunk('varyingParameters') + '\n  ' + this.stringifyChunk('fragmentFunctions') + '\n  \n  void main() {\n  \n    ' + this.stringifyChunk('fragmentInit') + '\n  \n    #include <clipping_planes_fragment>\n  \n    vec4 diffuseColor = vec4( diffuse, opacity );\n    ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );\n    vec3 totalEmissiveRadiance = emissive;\n  \n    ' + this.stringifyChunk('fragmentDiffuse') + '\n  \n    #include <logdepthbuf_fragment>\n\n    ' + (this.stringifyChunk('fragmentMap') || '#include <map_fragment>') + '\n\n    #include <color_fragment>\n    #include <alphamap_fragment>\n    #include <alphatest_fragment>\n    #include <specularmap_fragment>\n    #include <normal_fragment_begin>\n    #include <normal_fragment_maps>\n    \n    ' + this.stringifyChunk('fragmentEmissive') + '\n    \n    #include <emissivemap_fragment>\n  \n    // accumulation\n    #include <lights_phong_fragment>\n    #include <lights_fragment_begin>\n    #include <lights_fragment_maps>\n    #include <lights_fragment_end>\n    \n    ' + this.stringifyChunk('fragmentSpecular') + '\n    \n    // modulation\n    #include <aomap_fragment>\n  \n    vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;\n  \n    #include <envmap_fragment>\n  \n    gl_FragColor = vec4( outgoingLight, diffuseColor.a );\n  \n    #include <tonemapping_fragment>\n    #include <encodings_fragment>\n    #include <fog_fragment>\n    #include <premultiplied_alpha_fragment>\n    #include <dithering_fragment>\n  \n  }';
};

function StandardAnimationMaterial(parameters) {
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
  return '\n  #define PHYSICAL\n\n  varying vec3 vViewPosition;\n  \n  #ifndef FLAT_SHADED\n  \n    varying vec3 vNormal;\n  \n  #endif\n  \n  #include <common>\n  #include <uv_pars_vertex>\n  #include <uv2_pars_vertex>\n  #include <displacementmap_pars_vertex>\n  #include <color_pars_vertex>\n  #include <fog_pars_vertex>\n  #include <morphtarget_pars_vertex>\n  #include <skinning_pars_vertex>\n  #include <shadowmap_pars_vertex>\n  #include <logdepthbuf_pars_vertex>\n  #include <clipping_planes_pars_vertex>\n  \n  ' + this.stringifyChunk('vertexParameters') + '\n  ' + this.stringifyChunk('varyingParameters') + '\n  ' + this.stringifyChunk('vertexFunctions') + '\n  \n  void main() {\n\n    ' + this.stringifyChunk('vertexInit') + '\n\n    #include <uv_vertex>\n    #include <uv2_vertex>\n    #include <color_vertex>\n  \n    #include <beginnormal_vertex>\n    \n    ' + this.stringifyChunk('vertexNormal') + '\n    \n    #include <morphnormal_vertex>\n    #include <skinbase_vertex>\n    #include <skinnormal_vertex>\n    #include <defaultnormal_vertex>\n  \n  #ifndef FLAT_SHADED // Normal computed with derivatives when FLAT_SHADED\n  \n    vNormal = normalize( transformedNormal );\n  \n  #endif\n  \n    #include <begin_vertex>\n    \n    ' + this.stringifyChunk('vertexPosition') + '\n    ' + this.stringifyChunk('vertexColor') + '\n    \n    #include <morphtarget_vertex>\n    \n    ' + this.stringifyChunk('vertexPostMorph') + '\n    \n    #include <skinning_vertex>\n\n    ' + this.stringifyChunk('vertexPostSkinning') + '\n    \n    #include <displacementmap_vertex>\n    #include <project_vertex>\n    #include <logdepthbuf_vertex>\n    #include <clipping_planes_vertex>\n  \n    vViewPosition = - mvPosition.xyz;\n  \n    #include <worldpos_vertex>\n    #include <shadowmap_vertex>\n    #include <fog_vertex>\n  }';
};

StandardAnimationMaterial.prototype.concatFragmentShader = function () {
  return '\n  #define PHYSICAL\n  \n  uniform vec3 diffuse;\n  uniform vec3 emissive;\n  uniform float roughness;\n  uniform float metalness;\n  uniform float opacity;\n  \n  #ifndef STANDARD\n    uniform float clearCoat;\n    uniform float clearCoatRoughness;\n  #endif\n  \n  varying vec3 vViewPosition;\n  \n  #ifndef FLAT_SHADED\n  \n    varying vec3 vNormal;\n  \n  #endif\n  \n  #include <common>\n  #include <packing>\n  #include <dithering_pars_fragment>\n  #include <color_pars_fragment>\n  #include <uv_pars_fragment>\n  #include <uv2_pars_fragment>\n  #include <map_pars_fragment>\n  #include <alphamap_pars_fragment>\n  #include <aomap_pars_fragment>\n  #include <lightmap_pars_fragment>\n  #include <emissivemap_pars_fragment>\n  #include <envmap_pars_fragment>\n  #include <fog_pars_fragment>\n  #include <bsdfs>\n  #include <cube_uv_reflection_fragment>\n  #include <lights_pars_begin>\n  #include <lights_pars_maps>\n  #include <lights_physical_pars_fragment>\n  #include <shadowmap_pars_fragment>\n  #include <bumpmap_pars_fragment>\n  #include <normalmap_pars_fragment>\n  #include <roughnessmap_pars_fragment>\n  #include <metalnessmap_pars_fragment>\n  #include <logdepthbuf_pars_fragment>\n  #include <clipping_planes_pars_fragment>\n  \n  ' + this.stringifyChunk('fragmentParameters') + '\n  ' + this.stringifyChunk('varyingParameters') + '\n  ' + this.stringifyChunk('fragmentFunctions') + '\n  \n  void main() {\n  \n    ' + this.stringifyChunk('fragmentInit') + '\n  \n    #include <clipping_planes_fragment>\n  \n    vec4 diffuseColor = vec4( diffuse, opacity );\n    ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );\n    vec3 totalEmissiveRadiance = emissive;\n  \n    ' + this.stringifyChunk('fragmentDiffuse') + '\n  \n    #include <logdepthbuf_fragment>\n\n    ' + (this.stringifyChunk('fragmentMap') || '#include <map_fragment>') + '\n\n    #include <color_fragment>\n    #include <alphamap_fragment>\n    #include <alphatest_fragment>\n    \n    float roughnessFactor = roughness;\n    ' + this.stringifyChunk('fragmentRoughness') + '\n    #ifdef USE_ROUGHNESSMAP\n    \n      vec4 texelRoughness = texture2D( roughnessMap, vUv );\n    \n      // reads channel G, compatible with a combined OcclusionRoughnessMetallic (RGB) texture\n      roughnessFactor *= texelRoughness.g;\n    \n    #endif\n    \n    float metalnessFactor = metalness;\n    ' + this.stringifyChunk('fragmentMetalness') + '\n    #ifdef USE_METALNESSMAP\n    \n      vec4 texelMetalness = texture2D( metalnessMap, vUv );\n      metalnessFactor *= texelMetalness.b;\n    \n    #endif\n    \n    #include <normal_fragment_begin>\n    #include <normal_fragment_maps>\n    \n    ' + this.stringifyChunk('fragmentEmissive') + '\n    \n    #include <emissivemap_fragment>\n  \n    // accumulation\n    #include <lights_physical_fragment>\n    #include <lights_fragment_begin>\n    #include <lights_fragment_maps>\n    #include <lights_fragment_end>\n  \n    // modulation\n    #include <aomap_fragment>\n  \n    vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;\n  \n    gl_FragColor = vec4( outgoingLight, diffuseColor.a );\n  \n    #include <tonemapping_fragment>\n    #include <encodings_fragment>\n    #include <fog_fragment>\n    #include <premultiplied_alpha_fragment>\n    #include <dithering_fragment>\n  \n  }';
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
  this.vertexPostMorph = [];
  this.vertexPostSkinning = [];

  BaseAnimationMaterial.call(this, parameters);

  this.uniforms = three.UniformsUtils.merge([three.ShaderLib['depth'].uniforms, this.uniforms]);
  this.vertexShader = this.concatVertexShader();
  this.fragmentShader = three.ShaderLib['depth'].fragmentShader;
}
DepthAnimationMaterial.prototype = Object.create(BaseAnimationMaterial.prototype);
DepthAnimationMaterial.prototype.constructor = DepthAnimationMaterial;

DepthAnimationMaterial.prototype.concatVertexShader = function () {

  return '\n  #include <common>\n  #include <uv_pars_vertex>\n  #include <displacementmap_pars_vertex>\n  #include <morphtarget_pars_vertex>\n  #include <skinning_pars_vertex>\n  #include <logdepthbuf_pars_vertex>\n  #include <clipping_planes_pars_vertex>\n  \n  ' + this.stringifyChunk('vertexParameters') + '\n  ' + this.stringifyChunk('vertexFunctions') + '\n  \n  void main() {\n  \n    ' + this.stringifyChunk('vertexInit') + '\n  \n    #include <uv_vertex>\n  \n    #include <skinbase_vertex>\n  \n    #ifdef USE_DISPLACEMENTMAP\n  \n      #include <beginnormal_vertex>\n      #include <morphnormal_vertex>\n      #include <skinnormal_vertex>\n  \n    #endif\n  \n    #include <begin_vertex>\n    \n    ' + this.stringifyChunk('vertexPosition') + '\n\n    #include <morphtarget_vertex>\n    \n    ' + this.stringifyChunk('vertexPostMorph') + '\n    \n    #include <skinning_vertex>\n\n    ' + this.stringifyChunk('vertexPostSkinning') + '\n    \n    #include <displacementmap_vertex>\n    #include <project_vertex>\n    #include <logdepthbuf_vertex>\n    #include <clipping_planes_vertex>\n  }';
};

function DistanceAnimationMaterial(parameters) {
  this.depthPacking = three.RGBADepthPacking;
  this.clipping = true;

  this.vertexFunctions = [];
  this.vertexParameters = [];
  this.vertexInit = [];
  this.vertexPosition = [];
  this.vertexPostMorph = [];
  this.vertexPostSkinning = [];

  BaseAnimationMaterial.call(this, parameters);

  this.uniforms = three.UniformsUtils.merge([three.ShaderLib['distanceRGBA'].uniforms, this.uniforms]);
  this.vertexShader = this.concatVertexShader();
  this.fragmentShader = three.ShaderLib['distanceRGBA'].fragmentShader;
}
DistanceAnimationMaterial.prototype = Object.create(BaseAnimationMaterial.prototype);
DistanceAnimationMaterial.prototype.constructor = DistanceAnimationMaterial;

DistanceAnimationMaterial.prototype.concatVertexShader = function () {
  return '\n  #define DISTANCE\n\n  varying vec3 vWorldPosition;\n  \n  #include <common>\n  #include <uv_pars_vertex>\n  #include <displacementmap_pars_vertex>\n  #include <morphtarget_pars_vertex>\n  #include <skinning_pars_vertex>\n  #include <clipping_planes_pars_vertex>\n  \n  ' + this.stringifyChunk('vertexParameters') + '\n  ' + this.stringifyChunk('vertexFunctions') + '\n  \n  void main() {\n\n    ' + this.stringifyChunk('vertexInit') + '\n  \n    #include <uv_vertex>\n  \n    #include <skinbase_vertex>\n  \n    #ifdef USE_DISPLACEMENTMAP\n  \n      #include <beginnormal_vertex>\n      #include <morphnormal_vertex>\n      #include <skinnormal_vertex>\n  \n    #endif\n  \n    #include <begin_vertex>\n    \n    ' + this.stringifyChunk('vertexPosition') + '\n\n    #include <morphtarget_vertex>\n    \n    ' + this.stringifyChunk('vertexPostMorph') + '\n    \n    #include <skinning_vertex>\n\n    ' + this.stringifyChunk('vertexPostSkinning') + '\n    \n    #include <displacementmap_vertex>\n    #include <project_vertex>\n    #include <worldpos_vertex>\n    #include <clipping_planes_vertex>\n  \n    vWorldPosition = worldPosition.xyz;\n  \n  }';
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
  /**
   * How often the prefab array is repeated.
   * @type {Number}
   */
  this.repeatCount = repeatCount;

  /**
   * Array of vertex counts per prefab.
   * @type {Array}
   */
  this.prefabVertexCounts = this.prefabGeometries.map(function (p) {
    return p.isBufferGeometry ? p.attributes.position.count : p.vertices.length;
  });
  /**
   * Total number of vertices for one repetition of the prefabs
   * @type {number}
   */
  this.repeatVertexCount = this.prefabVertexCounts.reduce(function (r, v) {
    return r + v;
  }, 0);

  this.bufferIndices();
  this.bufferPositions();
}
MultiPrefabBufferGeometry.prototype = Object.create(three.BufferGeometry.prototype);
MultiPrefabBufferGeometry.prototype.constructor = MultiPrefabBufferGeometry;

MultiPrefabBufferGeometry.prototype.bufferIndices = function () {
  var repeatIndexCount = 0;

  this.prefabIndices = this.prefabGeometries.map(function (geometry) {
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

    repeatIndexCount += indices.length;

    return indices;
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
  var _this = this;

  var positionBuffer = this.createAttribute('position', 3).array;

  var prefabPositions = this.prefabGeometries.map(function (geometry, i) {
    var positions = void 0;

    if (geometry.isBufferGeometry) {
      positions = geometry.attributes.position.array;
    } else {

      var vertexCount = _this.prefabVertexCounts[i];

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
  var _this2 = this;

  var uvBuffer = this.createAttribute('uv', 2).array;

  var prefabUvs = this.prefabGeometries.map(function (geometry, i) {
    var uvs = void 0;

    if (geometry.isBufferGeometry) {
      if (!geometry.attributes.uv) {
        console.error('No UV found in prefab geometry', geometry);
      }

      uvs = geometry.attributes.uv.array;
    } else {
      var prefabFaceCount = _this2.prefabIndices[i].length / 3;
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

    v = v || new three.Vector3();

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
      var centroid = this.centroids ? this.centroids[i] : Utils.computeCentroid(this.modelGeometry, face);

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
 * Creates two THREE.BufferAttributes: skinIndex and skinWeight. Both are required for skinning.
 */
ModelBufferGeometry.prototype.bufferSkinning = function () {
  var skinIndexBuffer = this.createAttribute('skinIndex', 4).array;
  var skinWeightBuffer = this.createAttribute('skinWeight', 4).array;

  for (var i = 0; i < this.vertexCount; i++) {
    var skinIndex = this.modelGeometry.skinIndices[i];
    var skinWeight = this.modelGeometry.skinWeights[i];

    skinIndexBuffer[i * 4] = skinIndex.x;
    skinIndexBuffer[i * 4 + 1] = skinIndex.y;
    skinIndexBuffer[i * 4 + 2] = skinIndex.z;
    skinIndexBuffer[i * 4 + 3] = skinIndex.w;

    skinWeightBuffer[i * 4] = skinWeight.x;
    skinWeightBuffer[i * 4 + 1] = skinWeight.y;
    skinWeightBuffer[i * 4 + 2] = skinWeight.z;
    skinWeightBuffer[i * 4 + 3] = skinWeight.w;
  }
};

/**
 * Creates a THREE.BufferAttribute on this geometry instance.
 *
 * @param {String} name Name of the attribute.
 * @param {int} itemSize Number of floats per vertex (typically 1, 2, 3 or 4).
 * @param {function=} factory Function that will be called for each face upon creation. Accepts 3 arguments: data[], index and faceCount. Calls setFaceData.
 *
 * @returns {BufferAttribute}
 */
ModelBufferGeometry.prototype.createAttribute = function (name, itemSize, factory) {
  var buffer = new Float32Array(this.vertexCount * itemSize);
  var attribute = new three.BufferAttribute(buffer, itemSize);

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

var catmull_rom_spline = "vec4 catmullRomSpline(vec4 p0, vec4 p1, vec4 p2, vec4 p3, float t, vec2 c) {\r\n    vec4 v0 = (p2 - p0) * c.x;\r\n    vec4 v1 = (p3 - p1) * c.y;\r\n    float t2 = t * t;\r\n    float t3 = t * t * t;\r\n\r\n    return vec4((2.0 * p1 - 2.0 * p2 + v0 + v1) * t3 + (-3.0 * p1 + 3.0 * p2 - 2.0 * v0 - v1) * t2 + v0 * t + p1);\r\n}\r\nvec4 catmullRomSpline(vec4 p0, vec4 p1, vec4 p2, vec4 p3, float t) {\r\n    return catmullRomSpline(p0, p1, p2, p3, t, vec2(0.5, 0.5));\r\n}\r\n\r\nvec3 catmullRomSpline(vec3 p0, vec3 p1, vec3 p2, vec3 p3, float t, vec2 c) {\r\n    vec3 v0 = (p2 - p0) * c.x;\r\n    vec3 v1 = (p3 - p1) * c.y;\r\n    float t2 = t * t;\r\n    float t3 = t * t * t;\r\n\r\n    return vec3((2.0 * p1 - 2.0 * p2 + v0 + v1) * t3 + (-3.0 * p1 + 3.0 * p2 - 2.0 * v0 - v1) * t2 + v0 * t + p1);\r\n}\r\nvec3 catmullRomSpline(vec3 p0, vec3 p1, vec3 p2, vec3 p3, float t) {\r\n    return catmullRomSpline(p0, p1, p2, p3, t, vec2(0.5, 0.5));\r\n}\r\n\r\nvec2 catmullRomSpline(vec2 p0, vec2 p1, vec2 p2, vec2 p3, float t, vec2 c) {\r\n    vec2 v0 = (p2 - p0) * c.x;\r\n    vec2 v1 = (p3 - p1) * c.y;\r\n    float t2 = t * t;\r\n    float t3 = t * t * t;\r\n\r\n    return vec2((2.0 * p1 - 2.0 * p2 + v0 + v1) * t3 + (-3.0 * p1 + 3.0 * p2 - 2.0 * v0 - v1) * t2 + v0 * t + p1);\r\n}\r\nvec2 catmullRomSpline(vec2 p0, vec2 p1, vec2 p2, vec2 p3, float t) {\r\n    return catmullRomSpline(p0, p1, p2, p3, t, vec2(0.5, 0.5));\r\n}\r\n\r\nfloat catmullRomSpline(float p0, float p1, float p2, float p3, float t, vec2 c) {\r\n    float v0 = (p2 - p0) * c.x;\r\n    float v1 = (p3 - p1) * c.y;\r\n    float t2 = t * t;\r\n    float t3 = t * t * t;\r\n\r\n    return float((2.0 * p1 - 2.0 * p2 + v0 + v1) * t3 + (-3.0 * p1 + 3.0 * p2 - 2.0 * v0 - v1) * t2 + v0 * t + p1);\r\n}\r\nfloat catmullRomSpline(float p0, float p1, float p2, float p3, float t) {\r\n    return catmullRomSpline(p0, p1, p2, p3, t, vec2(0.5, 0.5));\r\n}\r\n\r\nivec4 getCatmullRomSplineIndices(float l, float p) {\r\n    float index = floor(p);\r\n    int i0 = int(max(0.0, index - 1.0));\r\n    int i1 = int(index);\r\n    int i2 = int(min(index + 1.0, l));\r\n    int i3 = int(min(index + 2.0, l));\r\n\r\n    return ivec4(i0, i1, i2, i3);\r\n}\r\n\r\nivec4 getCatmullRomSplineIndicesClosed(float l, float p) {\r\n    float index = floor(p);\r\n    int i0 = int(index == 0.0 ? l : index - 1.0);\r\n    int i1 = int(index);\r\n    int i2 = int(mod(index + 1.0, l));\r\n    int i3 = int(mod(index + 2.0, l));\r\n\r\n    return ivec4(i0, i1, i2, i3);\r\n}\r\n";

var cubic_bezier = "vec3 cubicBezier(vec3 p0, vec3 c0, vec3 c1, vec3 p1, float t) {\r\n    float tn = 1.0 - t;\r\n\r\n    return tn * tn * tn * p0 + 3.0 * tn * tn * t * c0 + 3.0 * tn * t * t * c1 + t * t * t * p1;\r\n}\r\n\r\nvec2 cubicBezier(vec2 p0, vec2 c0, vec2 c1, vec2 p1, float t) {\r\n    float tn = 1.0 - t;\r\n\r\n    return tn * tn * tn * p0 + 3.0 * tn * tn * t * c0 + 3.0 * tn * t * t * c1 + t * t * t * p1;\r\n}\r\n";

var ease_back_in = "float easeBackIn(float p, float amplitude) {\r\n    return p * p * ((amplitude + 1.0) * p - amplitude);\r\n}\r\n\r\nfloat easeBackIn(float p) {\r\n    return easeBackIn(p, 1.70158);\r\n}\r\n\r\nfloat easeBackIn(float t, float b, float c, float d, float amplitude) {\r\n    return b + easeBackIn(t / d, amplitude) * c;\r\n}\r\n\r\nfloat easeBackIn(float t, float b, float c, float d) {\r\n    return b + easeBackIn(t / d) * c;\r\n}\r\n";

var ease_back_in_out = "float easeBackInOut(float p, float amplitude) {\r\n    amplitude *= 1.525;\r\n\r\n    return ((p *= 2.0) < 1.0) ? 0.5 * p * p * ((amplitude + 1.0) * p - amplitude) : 0.5 * ((p -= 2.0) * p * ((amplitude + 1.0) * p + amplitude) + 2.0);\r\n}\r\n\r\nfloat easeBackInOut(float p) {\r\n    return easeBackInOut(p, 1.70158);\r\n}\r\n\r\nfloat easeBackInOut(float t, float b, float c, float d, float amplitude) {\r\n    return b + easeBackInOut(t / d, amplitude) * c;\r\n}\r\n\r\nfloat easeBackInOut(float t, float b, float c, float d) {\r\n    return b + easeBackInOut(t / d) * c;\r\n}\r\n";

var ease_back_out = "float easeBackOut(float p, float amplitude) {\r\n    return ((p = p - 1.0) * p * ((amplitude + 1.0) * p + amplitude) + 1.0);\r\n}\r\n\r\nfloat easeBackOut(float p) {\r\n    return easeBackOut(p, 1.70158);\r\n}\r\n\r\nfloat easeBackOut(float t, float b, float c, float d, float amplitude) {\r\n    return b + easeBackOut(t / d, amplitude) * c;\r\n}\r\n\r\nfloat easeBackOut(float t, float b, float c, float d) {\r\n    return b + easeBackOut(t / d) * c;\r\n}\r\n";

var ease_bezier = "float easeBezier(float p, vec4 curve) {\r\n    float ip = 1.0 - p;\r\n    return (3.0 * ip * ip * p * curve.xy + 3.0 * ip * p * p * curve.zw + p * p * p).y;\r\n}\r\n\r\nfloat easeBezier(float t, float b, float c, float d, vec4 curve) {\r\n    return b + easeBezier(t / d, curve) * c;\r\n}\r\n";

var ease_bounce_in = "float easeBounceIn(float p) {\r\n    if ((p = 1.0 - p) < 1.0 / 2.75) {\r\n        return 1.0 - (7.5625 * p * p);\r\n    } else if (p < 2.0 / 2.75) {\r\n        return 1.0 - (7.5625 * (p -= 1.5 / 2.75) * p + 0.75);\r\n    } else if (p < 2.5 / 2.75) {\r\n        return 1.0 - (7.5625 * (p -= 2.25 / 2.75) * p + 0.9375);\r\n    }\r\n    return 1.0 - (7.5625 * (p -= 2.625 / 2.75) * p + 0.984375);\r\n}\r\n\r\nfloat easeBounceIn(float t, float b, float c, float d) {\r\n    return b + easeBounceIn(t / d) * c;\r\n}\r\n";

var ease_bounce_in_out = "float easeBounceInOut(float p) {\r\n    bool invert = (p < 0.5);\r\n\r\n    p = invert ? (1.0 - (p * 2.0)) : ((p * 2.0) - 1.0);\r\n\r\n    if (p < 1.0 / 2.75) {\r\n        p = 7.5625 * p * p;\r\n    } else if (p < 2.0 / 2.75) {\r\n        p = 7.5625 * (p -= 1.5 / 2.75) * p + 0.75;\r\n    } else if (p < 2.5 / 2.75) {\r\n        p = 7.5625 * (p -= 2.25 / 2.75) * p + 0.9375;\r\n    } else {\r\n        p = 7.5625 * (p -= 2.625 / 2.75) * p + 0.984375;\r\n    }\r\n\r\n    return invert ? (1.0 - p) * 0.5 : p * 0.5 + 0.5;\r\n}\r\n\r\nfloat easeBounceInOut(float t, float b, float c, float d) {\r\n    return b + easeBounceInOut(t / d) * c;\r\n}\r\n";

var ease_bounce_out = "float easeBounceOut(float p) {\r\n    if (p < 1.0 / 2.75) {\r\n        return 7.5625 * p * p;\r\n    } else if (p < 2.0 / 2.75) {\r\n        return 7.5625 * (p -= 1.5 / 2.75) * p + 0.75;\r\n    } else if (p < 2.5 / 2.75) {\r\n        return 7.5625 * (p -= 2.25 / 2.75) * p + 0.9375;\r\n    }\r\n    return 7.5625 * (p -= 2.625 / 2.75) * p + 0.984375;\r\n}\r\n\r\nfloat easeBounceOut(float t, float b, float c, float d) {\r\n    return b + easeBounceOut(t / d) * c;\r\n}\r\n";

var ease_circ_in = "float easeCircIn(float p) {\r\n    return -(sqrt(1.0 - p * p) - 1.0);\r\n}\r\n\r\nfloat easeCircIn(float t, float b, float c, float d) {\r\n    return b + easeCircIn(t / d) * c;\r\n}\r\n";

var ease_circ_in_out = "float easeCircInOut(float p) {\r\n    return ((p *= 2.0) < 1.0) ? -0.5 * (sqrt(1.0 - p * p) - 1.0) : 0.5 * (sqrt(1.0 - (p -= 2.0) * p) + 1.0);\r\n}\r\n\r\nfloat easeCircInOut(float t, float b, float c, float d) {\r\n    return b + easeCircInOut(t / d) * c;\r\n}\r\n";

var ease_circ_out = "float easeCircOut(float p) {\r\n  return sqrt(1.0 - (p = p - 1.0) * p);\r\n}\r\n\r\nfloat easeCircOut(float t, float b, float c, float d) {\r\n  return b + easeCircOut(t / d) * c;\r\n}\r\n";

var ease_cubic_in = "float easeCubicIn(float t) {\r\n  return t * t * t;\r\n}\r\n\r\nfloat easeCubicIn(float t, float b, float c, float d) {\r\n  return b + easeCubicIn(t / d) * c;\r\n}\r\n";

var ease_cubic_in_out = "float easeCubicInOut(float t) {\r\n  return (t /= 0.5) < 1.0 ? 0.5 * t * t * t : 0.5 * ((t-=2.0) * t * t + 2.0);\r\n}\r\n\r\nfloat easeCubicInOut(float t, float b, float c, float d) {\r\n  return b + easeCubicInOut(t / d) * c;\r\n}\r\n";

var ease_cubic_out = "float easeCubicOut(float t) {\r\n  float f = t - 1.0;\r\n  return f * f * f + 1.0;\r\n}\r\n\r\nfloat easeCubicOut(float t, float b, float c, float d) {\r\n  return b + easeCubicOut(t / d) * c;\r\n}\r\n";

var ease_elastic_in = "float easeElasticIn(float p, float amplitude, float period) {\r\n    float p1 = max(amplitude, 1.0);\r\n    float p2 = period / min(amplitude, 1.0);\r\n    float p3 = p2 / PI2 * (asin(1.0 / p1));\r\n\r\n    return -(p1 * pow(2.0, 10.0 * (p -= 1.0)) * sin((p - p3) * PI2 / p2));\r\n}\r\n\r\nfloat easeElasticIn(float p) {\r\n    return easeElasticIn(p, 1.0, 0.3);\r\n}\r\n\r\nfloat easeElasticIn(float t, float b, float c, float d, float amplitude, float period) {\r\n    return b + easeElasticIn(t / d, amplitude, period) * c;\r\n}\r\n\r\nfloat easeElasticIn(float t, float b, float c, float d) {\r\n    return b + easeElasticIn(t / d) * c;\r\n}\r\n";

var ease_elastic_in_out = "float easeElasticInOut(float p, float amplitude, float period) {\r\n    float p1 = max(amplitude, 1.0);\r\n    float p2 = period / min(amplitude, 1.0);\r\n    float p3 = p2 / PI2 * (asin(1.0 / p1));\r\n\r\n    return ((p *= 2.0) < 1.0) ? -0.5 * (p1 * pow(2.0, 10.0 * (p -= 1.0)) * sin((p - p3) * PI2 / p2)) : p1 * pow(2.0, -10.0 * (p -= 1.0)) * sin((p - p3) * PI2 / p2) * 0.5 + 1.0;\r\n}\r\n\r\nfloat easeElasticInOut(float p) {\r\n    return easeElasticInOut(p, 1.0, 0.3);\r\n}\r\n\r\nfloat easeElasticInOut(float t, float b, float c, float d, float amplitude, float period) {\r\n    return b + easeElasticInOut(t / d, amplitude, period) * c;\r\n}\r\n\r\nfloat easeElasticInOut(float t, float b, float c, float d) {\r\n    return b + easeElasticInOut(t / d) * c;\r\n}\r\n";

var ease_elastic_out = "float easeElasticOut(float p, float amplitude, float period) {\r\n    float p1 = max(amplitude, 1.0);\r\n    float p2 = period / min(amplitude, 1.0);\r\n    float p3 = p2 / PI2 * (asin(1.0 / p1));\r\n\r\n    return p1 * pow(2.0, -10.0 * p) * sin((p - p3) * PI2 / p2) + 1.0;\r\n}\r\n\r\nfloat easeElasticOut(float p) {\r\n    return easeElasticOut(p, 1.0, 0.3);\r\n}\r\n\r\nfloat easeElasticOut(float t, float b, float c, float d, float amplitude, float period) {\r\n    return b + easeElasticOut(t / d, amplitude, period) * c;\r\n}\r\n\r\nfloat easeElasticOut(float t, float b, float c, float d) {\r\n    return b + easeElasticOut(t / d) * c;\r\n}\r\n";

var ease_expo_in = "float easeExpoIn(float p) {\r\n    return pow(2.0, 10.0 * (p - 1.0));\r\n}\r\n\r\nfloat easeExpoIn(float t, float b, float c, float d) {\r\n    return b + easeExpoIn(t / d) * c;\r\n}\r\n";

var ease_expo_in_out = "float easeExpoInOut(float p) {\r\n    return ((p *= 2.0) < 1.0) ? 0.5 * pow(2.0, 10.0 * (p - 1.0)) : 0.5 * (2.0 - pow(2.0, -10.0 * (p - 1.0)));\r\n}\r\n\r\nfloat easeExpoInOut(float t, float b, float c, float d) {\r\n    return b + easeExpoInOut(t / d) * c;\r\n}\r\n";

var ease_expo_out = "float easeExpoOut(float p) {\r\n  return 1.0 - pow(2.0, -10.0 * p);\r\n}\r\n\r\nfloat easeExpoOut(float t, float b, float c, float d) {\r\n  return b + easeExpoOut(t / d) * c;\r\n}\r\n";

var ease_quad_in = "float easeQuadIn(float t) {\r\n    return t * t;\r\n}\r\n\r\nfloat easeQuadIn(float t, float b, float c, float d) {\r\n  return b + easeQuadIn(t / d) * c;\r\n}\r\n";

var ease_quad_in_out = "float easeQuadInOut(float t) {\r\n    float p = 2.0 * t * t;\r\n    return t < 0.5 ? p : -p + (4.0 * t) - 1.0;\r\n}\r\n\r\nfloat easeQuadInOut(float t, float b, float c, float d) {\r\n    return b + easeQuadInOut(t / d) * c;\r\n}\r\n";

var ease_quad_out = "float easeQuadOut(float t) {\r\n  return -t * (t - 2.0);\r\n}\r\n\r\nfloat easeQuadOut(float t, float b, float c, float d) {\r\n  return b + easeQuadOut(t / d) * c;\r\n}\r\n";

var ease_quart_in = "float easeQuartIn(float t) {\r\n  return t * t * t * t;\r\n}\r\n\r\nfloat easeQuartIn(float t, float b, float c, float d) {\r\n  return b + easeQuartIn(t / d) * c;\r\n}\r\n";

var ease_quart_in_out = "float easeQuartInOut(float t) {\r\n    return t < 0.5 ? 8.0 * pow(t, 4.0) : -8.0 * pow(t - 1.0, 4.0) + 1.0;\r\n}\r\n\r\nfloat easeQuartInOut(float t, float b, float c, float d) {\r\n    return b + easeQuartInOut(t / d) * c;\r\n}\r\n";

var ease_quart_out = "float easeQuartOut(float t) {\r\n  return 1.0 - pow(1.0 - t, 4.0);\r\n}\r\n\r\nfloat easeQuartOut(float t, float b, float c, float d) {\r\n  return b + easeQuartOut(t / d) * c;\r\n}\r\n";

var ease_quint_in = "float easeQuintIn(float t) {\r\n    return pow(t, 5.0);\r\n}\r\n\r\nfloat easeQuintIn(float t, float b, float c, float d) {\r\n    return b + easeQuintIn(t / d) * c;\r\n}\r\n";

var ease_quint_in_out = "float easeQuintInOut(float t) {\r\n    return (t /= 0.5) < 1.0 ? 0.5 * t * t * t * t * t : 0.5 * ((t -= 2.0) * t * t * t * t + 2.0);\r\n}\r\n\r\nfloat easeQuintInOut(float t, float b, float c, float d) {\r\n    return b + easeQuintInOut(t / d) * c;\r\n}\r\n";

var ease_quint_out = "float easeQuintOut(float t) {\r\n    return (t -= 1.0) * t * t * t * t + 1.0;\r\n}\r\n\r\nfloat easeQuintOut(float t, float b, float c, float d) {\r\n    return b + easeQuintOut(t / d) * c;\r\n}\r\n";

var ease_sine_in = "float easeSineIn(float p) {\r\n  return -cos(p * 1.57079632679) + 1.0;\r\n}\r\n\r\nfloat easeSineIn(float t, float b, float c, float d) {\r\n  return b + easeSineIn(t / d) * c;\r\n}\r\n";

var ease_sine_in_out = "float easeSineInOut(float p) {\r\n  return -0.5 * (cos(PI * p) - 1.0);\r\n}\r\n\r\nfloat easeSineInOut(float t, float b, float c, float d) {\r\n  return b + easeSineInOut(t / d) * c;\r\n}\r\n";

var ease_sine_out = "float easeSineOut(float p) {\r\n  return sin(p * 1.57079632679);\r\n}\r\n\r\nfloat easeSineOut(float t, float b, float c, float d) {\r\n  return b + easeSineOut(t / d) * c;\r\n}\r\n";

var quadratic_bezier = "vec3 quadraticBezier(vec3 p0, vec3 c0, vec3 p1, float t) {\r\n    float tn = 1.0 - t;\r\n\r\n    return tn * tn * p0 + 2.0 * tn * t * c0 + t * t * p1;\r\n}\r\n\r\nvec2 quadraticBezier(vec2 p0, vec2 c0, vec2 p1, float t) {\r\n    float tn = 1.0 - t;\r\n\r\n    return tn * tn * p0 + 2.0 * tn * t * c0 + t * t * p1;\r\n}";

var quaternion_rotation = "vec3 rotateVector(vec4 q, vec3 v) {\r\n    return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v);\r\n}\r\n\r\nvec4 quatFromAxisAngle(vec3 axis, float angle) {\r\n    float halfAngle = angle * 0.5;\r\n    return vec4(axis.xyz * sin(halfAngle), cos(halfAngle));\r\n}\r\n";

var quaternion_slerp = "vec4 quatSlerp(vec4 q0, vec4 q1, float t) {\r\n    float s = 1.0 - t;\r\n    float c = dot(q0, q1);\r\n    float dir = -1.0; //c >= 0.0 ? 1.0 : -1.0;\r\n    float sqrSn = 1.0 - c * c;\r\n\r\n    if (sqrSn > 2.220446049250313e-16) {\r\n        float sn = sqrt(sqrSn);\r\n        float len = atan(sn, c * dir);\r\n\r\n        s = sin(s * len) / sn;\r\n        t = sin(t * len) / sn;\r\n    }\r\n\r\n    float tDir = t * dir;\r\n\r\n    return normalize(q0 * s + q1 * tDir);\r\n}\r\n";

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
  quadratic_bezier: quadratic_bezier,
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzLmpzIiwic291cmNlcyI6WyIuLi9zcmMvbWF0ZXJpYWxzL0Jhc2VBbmltYXRpb25NYXRlcmlhbC5qcyIsIi4uL3NyYy9tYXRlcmlhbHMvQmFzaWNBbmltYXRpb25NYXRlcmlhbC5qcyIsIi4uL3NyYy9tYXRlcmlhbHMvTGFtYmVydEFuaW1hdGlvbk1hdGVyaWFsLmpzIiwiLi4vc3JjL21hdGVyaWFscy9QaG9uZ0FuaW1hdGlvbk1hdGVyaWFsLmpzIiwiLi4vc3JjL21hdGVyaWFscy9TdGFuZGFyZEFuaW1hdGlvbk1hdGVyaWFsLmpzIiwiLi4vc3JjL21hdGVyaWFscy9Qb2ludHNBbmltYXRpb25NYXRlcmlhbC5qcyIsIi4uL3NyYy9tYXRlcmlhbHMvRGVwdGhBbmltYXRpb25NYXRlcmlhbC5qcyIsIi4uL3NyYy9tYXRlcmlhbHMvRGlzdGFuY2VBbmltYXRpb25NYXRlcmlhbC5qcyIsIi4uL3NyYy9nZW9tZXRyeS9QcmVmYWJCdWZmZXJHZW9tZXRyeS5qcyIsIi4uL3NyYy9nZW9tZXRyeS9NdWx0aVByZWZhYkJ1ZmZlckdlb21ldHJ5LmpzIiwiLi4vc3JjL1V0aWxzLmpzIiwiLi4vc3JjL2dlb21ldHJ5L01vZGVsQnVmZmVyR2VvbWV0cnkuanMiLCIuLi9zcmMvZ2VvbWV0cnkvUG9pbnRCdWZmZXJHZW9tZXRyeS5qcyIsIi4uL3NyYy9TaGFkZXJDaHVuay5qcyIsIi4uL3NyYy90aW1lbGluZS9UaW1lbGluZVNlZ21lbnQuanMiLCIuLi9zcmMvdGltZWxpbmUvVGltZWxpbmUuanMiLCIuLi9zcmMvdGltZWxpbmUvVGltZWxpbmVDaHVua3MuanMiLCIuLi9zcmMvdGltZWxpbmUvVHJhbnNsYXRpb25TZWdtZW50LmpzIiwiLi4vc3JjL3RpbWVsaW5lL1NjYWxlU2VnbWVudC5qcyIsIi4uL3NyYy90aW1lbGluZS9Sb3RhdGlvblNlZ21lbnQuanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcclxuICBTaGFkZXJNYXRlcmlhbCxcclxuICBVbmlmb3Jtc1V0aWxzLFxyXG4gIEN1YmVSZWZsZWN0aW9uTWFwcGluZyxcclxuICBDdWJlUmVmcmFjdGlvbk1hcHBpbmcsXHJcbiAgQ3ViZVVWUmVmbGVjdGlvbk1hcHBpbmcsXHJcbiAgQ3ViZVVWUmVmcmFjdGlvbk1hcHBpbmcsXHJcbiAgRXF1aXJlY3Rhbmd1bGFyUmVmbGVjdGlvbk1hcHBpbmcsXHJcbiAgRXF1aXJlY3Rhbmd1bGFyUmVmcmFjdGlvbk1hcHBpbmcsXHJcbiAgU3BoZXJpY2FsUmVmbGVjdGlvbk1hcHBpbmcsXHJcbiAgTWl4T3BlcmF0aW9uLFxyXG4gIEFkZE9wZXJhdGlvbixcclxuICBNdWx0aXBseU9wZXJhdGlvblxyXG59IGZyb20gJ3RocmVlJztcclxuXHJcbmZ1bmN0aW9uIEJhc2VBbmltYXRpb25NYXRlcmlhbChwYXJhbWV0ZXJzLCB1bmlmb3Jtcykge1xyXG4gIFNoYWRlck1hdGVyaWFsLmNhbGwodGhpcyk7XHJcbiAgXHJcbiAgY29uc3QgdW5pZm9ybVZhbHVlcyA9IHBhcmFtZXRlcnMudW5pZm9ybVZhbHVlcztcclxuICBkZWxldGUgcGFyYW1ldGVycy51bmlmb3JtVmFsdWVzO1xyXG4gIFxyXG4gIHRoaXMuc2V0VmFsdWVzKHBhcmFtZXRlcnMpO1xyXG4gIFxyXG4gIHRoaXMudW5pZm9ybXMgPSBVbmlmb3Jtc1V0aWxzLm1lcmdlKFt1bmlmb3JtcywgdGhpcy51bmlmb3Jtc10pO1xyXG4gIFxyXG4gIHRoaXMuc2V0VW5pZm9ybVZhbHVlcyh1bmlmb3JtVmFsdWVzKTtcclxuICBcclxuICBpZiAodW5pZm9ybVZhbHVlcykge1xyXG4gICAgdW5pZm9ybVZhbHVlcy5tYXAgJiYgKHRoaXMuZGVmaW5lc1snVVNFX01BUCddID0gJycpO1xyXG4gICAgdW5pZm9ybVZhbHVlcy5ub3JtYWxNYXAgJiYgKHRoaXMuZGVmaW5lc1snVVNFX05PUk1BTE1BUCddID0gJycpO1xyXG4gICAgdW5pZm9ybVZhbHVlcy5lbnZNYXAgJiYgKHRoaXMuZGVmaW5lc1snVVNFX0VOVk1BUCddID0gJycpO1xyXG4gICAgdW5pZm9ybVZhbHVlcy5hb01hcCAmJiAodGhpcy5kZWZpbmVzWydVU0VfQU9NQVAnXSA9ICcnKTtcclxuICAgIHVuaWZvcm1WYWx1ZXMuc3BlY3VsYXJNYXAgJiYgKHRoaXMuZGVmaW5lc1snVVNFX1NQRUNVTEFSTUFQJ10gPSAnJyk7XHJcbiAgICB1bmlmb3JtVmFsdWVzLmFscGhhTWFwICYmICh0aGlzLmRlZmluZXNbJ1VTRV9BTFBIQU1BUCddID0gJycpO1xyXG4gICAgdW5pZm9ybVZhbHVlcy5saWdodE1hcCAmJiAodGhpcy5kZWZpbmVzWydVU0VfTElHSFRNQVAnXSA9ICcnKTtcclxuICAgIHVuaWZvcm1WYWx1ZXMuZW1pc3NpdmVNYXAgJiYgKHRoaXMuZGVmaW5lc1snVVNFX0VNSVNTSVZFTUFQJ10gPSAnJyk7XHJcbiAgICB1bmlmb3JtVmFsdWVzLmJ1bXBNYXAgJiYgKHRoaXMuZGVmaW5lc1snVVNFX0JVTVBNQVAnXSA9ICcnKTtcclxuICAgIHVuaWZvcm1WYWx1ZXMuZGlzcGxhY2VtZW50TWFwICYmICh0aGlzLmRlZmluZXNbJ1VTRV9ESVNQTEFDRU1FTlRNQVAnXSA9ICcnKTtcclxuICAgIHVuaWZvcm1WYWx1ZXMucm91Z2huZXNzTWFwICYmICh0aGlzLmRlZmluZXNbJ1VTRV9ESVNQTEFDRU1FTlRNQVAnXSA9ICcnKTtcclxuICAgIHVuaWZvcm1WYWx1ZXMucm91Z2huZXNzTWFwICYmICh0aGlzLmRlZmluZXNbJ1VTRV9ST1VHSE5FU1NNQVAnXSA9ICcnKTtcclxuICAgIHVuaWZvcm1WYWx1ZXMubWV0YWxuZXNzTWFwICYmICh0aGlzLmRlZmluZXNbJ1VTRV9NRVRBTE5FU1NNQVAnXSA9ICcnKTtcclxuICBcclxuICAgIGlmICh1bmlmb3JtVmFsdWVzLmVudk1hcCkge1xyXG4gICAgICB0aGlzLmRlZmluZXNbJ1VTRV9FTlZNQVAnXSA9ICcnO1xyXG4gICAgXHJcbiAgICAgIGxldCBlbnZNYXBUeXBlRGVmaW5lID0gJ0VOVk1BUF9UWVBFX0NVQkUnO1xyXG4gICAgICBsZXQgZW52TWFwTW9kZURlZmluZSA9ICdFTlZNQVBfTU9ERV9SRUZMRUNUSU9OJztcclxuICAgICAgbGV0IGVudk1hcEJsZW5kaW5nRGVmaW5lID0gJ0VOVk1BUF9CTEVORElOR19NVUxUSVBMWSc7XHJcbiAgICBcclxuICAgICAgc3dpdGNoICh1bmlmb3JtVmFsdWVzLmVudk1hcC5tYXBwaW5nKSB7XHJcbiAgICAgICAgY2FzZSBDdWJlUmVmbGVjdGlvbk1hcHBpbmc6XHJcbiAgICAgICAgY2FzZSBDdWJlUmVmcmFjdGlvbk1hcHBpbmc6XHJcbiAgICAgICAgICBlbnZNYXBUeXBlRGVmaW5lID0gJ0VOVk1BUF9UWVBFX0NVQkUnO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSBDdWJlVVZSZWZsZWN0aW9uTWFwcGluZzpcclxuICAgICAgICBjYXNlIEN1YmVVVlJlZnJhY3Rpb25NYXBwaW5nOlxyXG4gICAgICAgICAgZW52TWFwVHlwZURlZmluZSA9ICdFTlZNQVBfVFlQRV9DVUJFX1VWJztcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgRXF1aXJlY3Rhbmd1bGFyUmVmbGVjdGlvbk1hcHBpbmc6XHJcbiAgICAgICAgY2FzZSBFcXVpcmVjdGFuZ3VsYXJSZWZyYWN0aW9uTWFwcGluZzpcclxuICAgICAgICAgIGVudk1hcFR5cGVEZWZpbmUgPSAnRU5WTUFQX1RZUEVfRVFVSVJFQyc7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIFNwaGVyaWNhbFJlZmxlY3Rpb25NYXBwaW5nOlxyXG4gICAgICAgICAgZW52TWFwVHlwZURlZmluZSA9ICdFTlZNQVBfVFlQRV9TUEhFUkUnO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgIH1cclxuICAgIFxyXG4gICAgICBzd2l0Y2ggKHVuaWZvcm1WYWx1ZXMuZW52TWFwLm1hcHBpbmcpIHtcclxuICAgICAgICBjYXNlIEN1YmVSZWZyYWN0aW9uTWFwcGluZzpcclxuICAgICAgICBjYXNlIEVxdWlyZWN0YW5ndWxhclJlZnJhY3Rpb25NYXBwaW5nOlxyXG4gICAgICAgICAgZW52TWFwTW9kZURlZmluZSA9ICdFTlZNQVBfTU9ERV9SRUZSQUNUSU9OJztcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICB9XHJcbiAgICBcclxuICAgICAgc3dpdGNoICh1bmlmb3JtVmFsdWVzLmNvbWJpbmUpIHtcclxuICAgICAgICBjYXNlIE1peE9wZXJhdGlvbjpcclxuICAgICAgICAgIGVudk1hcEJsZW5kaW5nRGVmaW5lID0gJ0VOVk1BUF9CTEVORElOR19NSVgnO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSBBZGRPcGVyYXRpb246XHJcbiAgICAgICAgICBlbnZNYXBCbGVuZGluZ0RlZmluZSA9ICdFTlZNQVBfQkxFTkRJTkdfQUREJztcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgTXVsdGlwbHlPcGVyYXRpb246XHJcbiAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgIGVudk1hcEJsZW5kaW5nRGVmaW5lID0gJ0VOVk1BUF9CTEVORElOR19NVUxUSVBMWSc7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgfVxyXG4gICAgXHJcbiAgICAgIHRoaXMuZGVmaW5lc1tlbnZNYXBUeXBlRGVmaW5lXSA9ICcnO1xyXG4gICAgICB0aGlzLmRlZmluZXNbZW52TWFwQmxlbmRpbmdEZWZpbmVdID0gJyc7XHJcbiAgICAgIHRoaXMuZGVmaW5lc1tlbnZNYXBNb2RlRGVmaW5lXSA9ICcnO1xyXG4gICAgfVxyXG4gIH1cclxufVxyXG5cclxuQmFzZUFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZSA9IE9iamVjdC5hc3NpZ24oT2JqZWN0LmNyZWF0ZShTaGFkZXJNYXRlcmlhbC5wcm90b3R5cGUpLCB7XHJcbiAgY29uc3RydWN0b3I6IEJhc2VBbmltYXRpb25NYXRlcmlhbCxcclxuICBcclxuICBzZXRVbmlmb3JtVmFsdWVzKHZhbHVlcykge1xyXG4gICAgaWYgKCF2YWx1ZXMpIHJldHVybjtcclxuICAgIFxyXG4gICAgY29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKHZhbHVlcyk7XHJcbiAgICBcclxuICAgIGtleXMuZm9yRWFjaCgoa2V5KSA9PiB7XHJcbiAgICAgIGtleSBpbiB0aGlzLnVuaWZvcm1zICYmICh0aGlzLnVuaWZvcm1zW2tleV0udmFsdWUgPSB2YWx1ZXNba2V5XSk7XHJcbiAgICB9KTtcclxuICB9LFxyXG4gIFxyXG4gIHN0cmluZ2lmeUNodW5rKG5hbWUpIHtcclxuICAgIGxldCB2YWx1ZTtcclxuICAgIFxyXG4gICAgaWYgKCF0aGlzW25hbWVdKSB7XHJcbiAgICAgIHZhbHVlID0gJyc7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICh0eXBlb2YgdGhpc1tuYW1lXSA9PT0gICdzdHJpbmcnKSB7XHJcbiAgICAgIHZhbHVlID0gdGhpc1tuYW1lXTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICB2YWx1ZSA9IHRoaXNbbmFtZV0uam9pbignXFxuJyk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHJldHVybiB2YWx1ZTtcclxuICB9XHJcbn0pO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgQmFzZUFuaW1hdGlvbk1hdGVyaWFsO1xyXG4iLCJpbXBvcnQgeyBTaGFkZXJMaWIgfSBmcm9tICd0aHJlZSc7XHJcbmltcG9ydCBCYXNlQW5pbWF0aW9uTWF0ZXJpYWwgZnJvbSAnLi9CYXNlQW5pbWF0aW9uTWF0ZXJpYWwnO1xyXG5cclxuLyoqXHJcbiAqIEV4dGVuZHMgVEhSRUUuTWVzaEJhc2ljTWF0ZXJpYWwgd2l0aCBjdXN0b20gc2hhZGVyIGNodW5rcy5cclxuICpcclxuICogQHNlZSBodHRwOi8vdGhyZWUtYmFzLWV4YW1wbGVzLnN1cmdlLnNoL2V4YW1wbGVzL21hdGVyaWFsc19iYXNpYy9cclxuICpcclxuICogQHBhcmFtIHtPYmplY3R9IHBhcmFtZXRlcnMgT2JqZWN0IGNvbnRhaW5pbmcgbWF0ZXJpYWwgcHJvcGVydGllcyBhbmQgY3VzdG9tIHNoYWRlciBjaHVua3MuXHJcbiAqIEBjb25zdHJ1Y3RvclxyXG4gKi9cclxuZnVuY3Rpb24gQmFzaWNBbmltYXRpb25NYXRlcmlhbChwYXJhbWV0ZXJzKSB7XHJcbiAgdGhpcy52YXJ5aW5nUGFyYW1ldGVycyA9IFtdO1xyXG4gIFxyXG4gIHRoaXMudmVydGV4UGFyYW1ldGVycyA9IFtdO1xyXG4gIHRoaXMudmVydGV4RnVuY3Rpb25zID0gW107XHJcbiAgdGhpcy52ZXJ0ZXhJbml0ID0gW107XHJcbiAgdGhpcy52ZXJ0ZXhOb3JtYWwgPSBbXTtcclxuICB0aGlzLnZlcnRleFBvc2l0aW9uID0gW107XHJcbiAgdGhpcy52ZXJ0ZXhDb2xvciA9IFtdO1xyXG4gIHRoaXMudmVydGV4UG9zdE1vcnBoID0gW107XHJcbiAgdGhpcy52ZXJ0ZXhQb3N0U2tpbm5pbmcgPSBbXTtcclxuXHJcbiAgdGhpcy5mcmFnbWVudEZ1bmN0aW9ucyA9IFtdO1xyXG4gIHRoaXMuZnJhZ21lbnRQYXJhbWV0ZXJzID0gW107XHJcbiAgdGhpcy5mcmFnbWVudEluaXQgPSBbXTtcclxuICB0aGlzLmZyYWdtZW50TWFwID0gW107XHJcbiAgdGhpcy5mcmFnbWVudERpZmZ1c2UgPSBbXTtcclxuICBcclxuICBCYXNlQW5pbWF0aW9uTWF0ZXJpYWwuY2FsbCh0aGlzLCBwYXJhbWV0ZXJzLCBTaGFkZXJMaWJbJ2Jhc2ljJ10udW5pZm9ybXMpO1xyXG4gIFxyXG4gIHRoaXMubGlnaHRzID0gZmFsc2U7XHJcbiAgdGhpcy52ZXJ0ZXhTaGFkZXIgPSB0aGlzLmNvbmNhdFZlcnRleFNoYWRlcigpO1xyXG4gIHRoaXMuZnJhZ21lbnRTaGFkZXIgPSB0aGlzLmNvbmNhdEZyYWdtZW50U2hhZGVyKCk7XHJcbn1cclxuQmFzaWNBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEJhc2VBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUpO1xyXG5CYXNpY0FuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IEJhc2ljQW5pbWF0aW9uTWF0ZXJpYWw7XHJcblxyXG5CYXNpY0FuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZS5jb25jYXRWZXJ0ZXhTaGFkZXIgPSBmdW5jdGlvbigpIHtcclxuICByZXR1cm4gYFxyXG4gICNpbmNsdWRlIDxjb21tb24+XHJcbiAgI2luY2x1ZGUgPHV2X3BhcnNfdmVydGV4PlxyXG4gICNpbmNsdWRlIDx1djJfcGFyc192ZXJ0ZXg+XHJcbiAgI2luY2x1ZGUgPGVudm1hcF9wYXJzX3ZlcnRleD5cclxuICAjaW5jbHVkZSA8Y29sb3JfcGFyc192ZXJ0ZXg+XHJcbiAgI2luY2x1ZGUgPGZvZ19wYXJzX3ZlcnRleD5cclxuICAjaW5jbHVkZSA8bW9ycGh0YXJnZXRfcGFyc192ZXJ0ZXg+XHJcbiAgI2luY2x1ZGUgPHNraW5uaW5nX3BhcnNfdmVydGV4PlxyXG4gICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl9wYXJzX3ZlcnRleD5cclxuICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX3BhcnNfdmVydGV4PlxyXG4gIFxyXG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UGFyYW1ldGVycycpfVxyXG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmFyeWluZ1BhcmFtZXRlcnMnKX1cclxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleEZ1bmN0aW9ucycpfVxyXG4gIFxyXG4gIHZvaWQgbWFpbigpIHtcclxuXHJcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleEluaXQnKX1cclxuICBcclxuICAgICNpbmNsdWRlIDx1dl92ZXJ0ZXg+XHJcbiAgICAjaW5jbHVkZSA8dXYyX3ZlcnRleD5cclxuICAgICNpbmNsdWRlIDxjb2xvcl92ZXJ0ZXg+XHJcbiAgICAjaW5jbHVkZSA8c2tpbmJhc2VfdmVydGV4PlxyXG4gIFxyXG4gICAgI2lmZGVmIFVTRV9FTlZNQVBcclxuICBcclxuICAgICNpbmNsdWRlIDxiZWdpbm5vcm1hbF92ZXJ0ZXg+XHJcbiAgICBcclxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4Tm9ybWFsJyl9XHJcbiAgICBcclxuICAgICNpbmNsdWRlIDxtb3JwaG5vcm1hbF92ZXJ0ZXg+XHJcbiAgICAjaW5jbHVkZSA8c2tpbm5vcm1hbF92ZXJ0ZXg+XHJcbiAgICAjaW5jbHVkZSA8ZGVmYXVsdG5vcm1hbF92ZXJ0ZXg+XHJcbiAgXHJcbiAgICAjZW5kaWZcclxuICBcclxuICAgICNpbmNsdWRlIDxiZWdpbl92ZXJ0ZXg+XHJcbiAgICBcclxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UG9zaXRpb24nKX1cclxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4Q29sb3InKX1cclxuICAgIFxyXG4gICAgI2luY2x1ZGUgPG1vcnBodGFyZ2V0X3ZlcnRleD5cclxuICAgIFxyXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQb3N0TW9ycGgnKX1cclxuICAgIFxyXG4gICAgI2luY2x1ZGUgPHNraW5uaW5nX3ZlcnRleD5cclxuXHJcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBvc3RTa2lubmluZycpfVxyXG5cclxuICAgICNpbmNsdWRlIDxwcm9qZWN0X3ZlcnRleD5cclxuICAgICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl92ZXJ0ZXg+XHJcbiAgXHJcbiAgICAjaW5jbHVkZSA8d29ybGRwb3NfdmVydGV4PlxyXG4gICAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc192ZXJ0ZXg+XHJcbiAgICAjaW5jbHVkZSA8ZW52bWFwX3ZlcnRleD5cclxuICAgICNpbmNsdWRlIDxmb2dfdmVydGV4PlxyXG4gIH1gO1xyXG59O1xyXG5cclxuQmFzaWNBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uY2F0RnJhZ21lbnRTaGFkZXIgPSBmdW5jdGlvbigpIHtcclxuICByZXR1cm4gYFxyXG4gIHVuaWZvcm0gdmVjMyBkaWZmdXNlO1xyXG4gIHVuaWZvcm0gZmxvYXQgb3BhY2l0eTtcclxuICBcclxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50UGFyYW1ldGVycycpfVxyXG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmFyeWluZ1BhcmFtZXRlcnMnKX1cclxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50RnVuY3Rpb25zJyl9XHJcbiAgXHJcbiAgI2lmbmRlZiBGTEFUX1NIQURFRFxyXG4gIFxyXG4gICAgdmFyeWluZyB2ZWMzIHZOb3JtYWw7XHJcbiAgXHJcbiAgI2VuZGlmXHJcbiAgXHJcbiAgI2luY2x1ZGUgPGNvbW1vbj5cclxuICAjaW5jbHVkZSA8Y29sb3JfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8dXZfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8dXYyX3BhcnNfZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPG1hcF9wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxhbHBoYW1hcF9wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxhb21hcF9wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxsaWdodG1hcF9wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxlbnZtYXBfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8Zm9nX3BhcnNfZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPHNwZWN1bGFybWFwX3BhcnNfZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPGxvZ2RlcHRoYnVmX3BhcnNfZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc19wYXJzX2ZyYWdtZW50PlxyXG4gIFxyXG4gIHZvaWQgbWFpbigpIHtcclxuICBcclxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRJbml0Jyl9XHJcbiAgXHJcbiAgICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX2ZyYWdtZW50PlxyXG5cclxuICAgIHZlYzQgZGlmZnVzZUNvbG9yID0gdmVjNCggZGlmZnVzZSwgb3BhY2l0eSApO1xyXG5cclxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnREaWZmdXNlJyl9XHJcbiAgXHJcbiAgICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfZnJhZ21lbnQ+XHJcbiAgICBcclxuICAgICR7KHRoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50TWFwJykgfHwgJyNpbmNsdWRlIDxtYXBfZnJhZ21lbnQ+Jyl9XHJcbiAgICBcclxuICAgICNpbmNsdWRlIDxjb2xvcl9mcmFnbWVudD5cclxuICAgICNpbmNsdWRlIDxhbHBoYW1hcF9mcmFnbWVudD5cclxuICAgICNpbmNsdWRlIDxhbHBoYXRlc3RfZnJhZ21lbnQ+XHJcbiAgICAjaW5jbHVkZSA8c3BlY3VsYXJtYXBfZnJhZ21lbnQ+XHJcbiAgXHJcbiAgICBSZWZsZWN0ZWRMaWdodCByZWZsZWN0ZWRMaWdodCA9IFJlZmxlY3RlZExpZ2h0KCB2ZWMzKCAwLjAgKSwgdmVjMyggMC4wICksIHZlYzMoIDAuMCApLCB2ZWMzKCAwLjAgKSApO1xyXG4gIFxyXG4gICAgLy8gYWNjdW11bGF0aW9uIChiYWtlZCBpbmRpcmVjdCBsaWdodGluZyBvbmx5KVxyXG4gICAgI2lmZGVmIFVTRV9MSUdIVE1BUFxyXG4gIFxyXG4gICAgICByZWZsZWN0ZWRMaWdodC5pbmRpcmVjdERpZmZ1c2UgKz0gdGV4dHVyZTJEKCBsaWdodE1hcCwgdlV2MiApLnh5eiAqIGxpZ2h0TWFwSW50ZW5zaXR5O1xyXG4gIFxyXG4gICAgI2Vsc2VcclxuICBcclxuICAgICAgcmVmbGVjdGVkTGlnaHQuaW5kaXJlY3REaWZmdXNlICs9IHZlYzMoIDEuMCApO1xyXG4gIFxyXG4gICAgI2VuZGlmXHJcbiAgXHJcbiAgICAvLyBtb2R1bGF0aW9uXHJcbiAgICAjaW5jbHVkZSA8YW9tYXBfZnJhZ21lbnQ+XHJcbiAgXHJcbiAgICByZWZsZWN0ZWRMaWdodC5pbmRpcmVjdERpZmZ1c2UgKj0gZGlmZnVzZUNvbG9yLnJnYjtcclxuICBcclxuICAgIHZlYzMgb3V0Z29pbmdMaWdodCA9IHJlZmxlY3RlZExpZ2h0LmluZGlyZWN0RGlmZnVzZTtcclxuICBcclxuICAgICNpbmNsdWRlIDxlbnZtYXBfZnJhZ21lbnQ+XHJcbiAgXHJcbiAgICBnbF9GcmFnQ29sb3IgPSB2ZWM0KCBvdXRnb2luZ0xpZ2h0LCBkaWZmdXNlQ29sb3IuYSApO1xyXG4gIFxyXG4gICAgI2luY2x1ZGUgPHByZW11bHRpcGxpZWRfYWxwaGFfZnJhZ21lbnQ+XHJcbiAgICAjaW5jbHVkZSA8dG9uZW1hcHBpbmdfZnJhZ21lbnQ+XHJcbiAgICAjaW5jbHVkZSA8ZW5jb2RpbmdzX2ZyYWdtZW50PlxyXG4gICAgI2luY2x1ZGUgPGZvZ19mcmFnbWVudD5cclxuICB9YDtcclxufTtcclxuXHJcbmV4cG9ydCB7IEJhc2ljQW5pbWF0aW9uTWF0ZXJpYWwgfTtcclxuIiwiaW1wb3J0IHsgU2hhZGVyTGliIH0gZnJvbSAndGhyZWUnO1xyXG5pbXBvcnQgQmFzZUFuaW1hdGlvbk1hdGVyaWFsIGZyb20gJy4vQmFzZUFuaW1hdGlvbk1hdGVyaWFsJztcclxuXHJcbi8qKlxyXG4gKiBFeHRlbmRzIFRIUkVFLk1lc2hMYW1iZXJ0TWF0ZXJpYWwgd2l0aCBjdXN0b20gc2hhZGVyIGNodW5rcy5cclxuICpcclxuICogQHNlZSBodHRwOi8vdGhyZWUtYmFzLWV4YW1wbGVzLnN1cmdlLnNoL2V4YW1wbGVzL21hdGVyaWFsc19sYW1iZXJ0L1xyXG4gKlxyXG4gKiBAcGFyYW0ge09iamVjdH0gcGFyYW1ldGVycyBPYmplY3QgY29udGFpbmluZyBtYXRlcmlhbCBwcm9wZXJ0aWVzIGFuZCBjdXN0b20gc2hhZGVyIGNodW5rcy5cclxuICogQGNvbnN0cnVjdG9yXHJcbiAqL1xyXG5mdW5jdGlvbiBMYW1iZXJ0QW5pbWF0aW9uTWF0ZXJpYWwocGFyYW1ldGVycykge1xyXG4gIHRoaXMudmFyeWluZ1BhcmFtZXRlcnMgPSBbXTtcclxuICBcclxuICB0aGlzLnZlcnRleEZ1bmN0aW9ucyA9IFtdO1xyXG4gIHRoaXMudmVydGV4UGFyYW1ldGVycyA9IFtdO1xyXG4gIHRoaXMudmVydGV4SW5pdCA9IFtdO1xyXG4gIHRoaXMudmVydGV4Tm9ybWFsID0gW107XHJcbiAgdGhpcy52ZXJ0ZXhQb3NpdGlvbiA9IFtdO1xyXG4gIHRoaXMudmVydGV4Q29sb3IgPSBbXTtcclxuICB0aGlzLnZlcnRleFBvc3RNb3JwaCA9IFtdO1xyXG4gIHRoaXMudmVydGV4UG9zdFNraW5uaW5nID0gW107XHJcbiAgXHJcbiAgdGhpcy5mcmFnbWVudEZ1bmN0aW9ucyA9IFtdO1xyXG4gIHRoaXMuZnJhZ21lbnRQYXJhbWV0ZXJzID0gW107XHJcbiAgdGhpcy5mcmFnbWVudEluaXQgPSBbXTtcclxuICB0aGlzLmZyYWdtZW50TWFwID0gW107XHJcbiAgdGhpcy5mcmFnbWVudERpZmZ1c2UgPSBbXTtcclxuICB0aGlzLmZyYWdtZW50RW1pc3NpdmUgPSBbXTtcclxuICB0aGlzLmZyYWdtZW50U3BlY3VsYXIgPSBbXTtcclxuICBcclxuICBCYXNlQW5pbWF0aW9uTWF0ZXJpYWwuY2FsbCh0aGlzLCBwYXJhbWV0ZXJzLCBTaGFkZXJMaWJbJ2xhbWJlcnQnXS51bmlmb3Jtcyk7XHJcbiAgXHJcbiAgdGhpcy5saWdodHMgPSB0cnVlO1xyXG4gIHRoaXMudmVydGV4U2hhZGVyID0gdGhpcy5jb25jYXRWZXJ0ZXhTaGFkZXIoKTtcclxuICB0aGlzLmZyYWdtZW50U2hhZGVyID0gdGhpcy5jb25jYXRGcmFnbWVudFNoYWRlcigpO1xyXG59XHJcbkxhbWJlcnRBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEJhc2VBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUpO1xyXG5MYW1iZXJ0QW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gTGFtYmVydEFuaW1hdGlvbk1hdGVyaWFsO1xyXG5cclxuTGFtYmVydEFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZS5jb25jYXRWZXJ0ZXhTaGFkZXIgPSBmdW5jdGlvbiAoKSB7XHJcbiAgcmV0dXJuIGBcclxuICAjZGVmaW5lIExBTUJFUlRcclxuXHJcbiAgdmFyeWluZyB2ZWMzIHZMaWdodEZyb250O1xyXG4gIFxyXG4gICNpZmRlZiBET1VCTEVfU0lERURcclxuICBcclxuICAgIHZhcnlpbmcgdmVjMyB2TGlnaHRCYWNrO1xyXG4gIFxyXG4gICNlbmRpZlxyXG4gIFxyXG4gICNpbmNsdWRlIDxjb21tb24+XHJcbiAgI2luY2x1ZGUgPHV2X3BhcnNfdmVydGV4PlxyXG4gICNpbmNsdWRlIDx1djJfcGFyc192ZXJ0ZXg+XHJcbiAgI2luY2x1ZGUgPGVudm1hcF9wYXJzX3ZlcnRleD5cclxuICAjaW5jbHVkZSA8YnNkZnM+XHJcbiAgI2luY2x1ZGUgPGxpZ2h0c19wYXJzX2JlZ2luPlxyXG4gICNpbmNsdWRlIDxsaWdodHNfcGFyc19tYXBzPlxyXG4gICNpbmNsdWRlIDxjb2xvcl9wYXJzX3ZlcnRleD5cclxuICAjaW5jbHVkZSA8Zm9nX3BhcnNfdmVydGV4PlxyXG4gICNpbmNsdWRlIDxtb3JwaHRhcmdldF9wYXJzX3ZlcnRleD5cclxuICAjaW5jbHVkZSA8c2tpbm5pbmdfcGFyc192ZXJ0ZXg+XHJcbiAgI2luY2x1ZGUgPHNoYWRvd21hcF9wYXJzX3ZlcnRleD5cclxuICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfcGFyc192ZXJ0ZXg+XHJcbiAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc19wYXJzX3ZlcnRleD5cclxuICBcclxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBhcmFtZXRlcnMnKX1cclxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZhcnlpbmdQYXJhbWV0ZXJzJyl9XHJcbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhGdW5jdGlvbnMnKX1cclxuICBcclxuICB2b2lkIG1haW4oKSB7XHJcbiAgXHJcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleEluaXQnKX1cclxuICBcclxuICAgICNpbmNsdWRlIDx1dl92ZXJ0ZXg+XHJcbiAgICAjaW5jbHVkZSA8dXYyX3ZlcnRleD5cclxuICAgICNpbmNsdWRlIDxjb2xvcl92ZXJ0ZXg+XHJcbiAgXHJcbiAgICAjaW5jbHVkZSA8YmVnaW5ub3JtYWxfdmVydGV4PlxyXG4gICAgXHJcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleE5vcm1hbCcpfVxyXG4gICAgXHJcbiAgICAjaW5jbHVkZSA8bW9ycGhub3JtYWxfdmVydGV4PlxyXG4gICAgI2luY2x1ZGUgPHNraW5iYXNlX3ZlcnRleD5cclxuICAgICNpbmNsdWRlIDxza2lubm9ybWFsX3ZlcnRleD5cclxuICAgICNpbmNsdWRlIDxkZWZhdWx0bm9ybWFsX3ZlcnRleD5cclxuICBcclxuICAgICNpbmNsdWRlIDxiZWdpbl92ZXJ0ZXg+XHJcbiAgICBcclxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UG9zaXRpb24nKX1cclxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4Q29sb3InKX1cclxuICAgIFxyXG4gICAgI2luY2x1ZGUgPG1vcnBodGFyZ2V0X3ZlcnRleD5cclxuICAgIFxyXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQb3N0TW9ycGgnKX1cclxuICAgIFxyXG4gICAgI2luY2x1ZGUgPHNraW5uaW5nX3ZlcnRleD5cclxuXHJcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBvc3RTa2lubmluZycpfVxyXG4gICAgXHJcbiAgICAjaW5jbHVkZSA8cHJvamVjdF92ZXJ0ZXg+XHJcbiAgICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfdmVydGV4PlxyXG4gICAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc192ZXJ0ZXg+XHJcbiAgXHJcbiAgICAjaW5jbHVkZSA8d29ybGRwb3NfdmVydGV4PlxyXG4gICAgI2luY2x1ZGUgPGVudm1hcF92ZXJ0ZXg+XHJcbiAgICAjaW5jbHVkZSA8bGlnaHRzX2xhbWJlcnRfdmVydGV4PlxyXG4gICAgI2luY2x1ZGUgPHNoYWRvd21hcF92ZXJ0ZXg+XHJcbiAgICAjaW5jbHVkZSA8Zm9nX3ZlcnRleD5cclxuICB9YDtcclxufTtcclxuXHJcbkxhbWJlcnRBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uY2F0RnJhZ21lbnRTaGFkZXIgPSBmdW5jdGlvbiAoKSB7XHJcbiAgcmV0dXJuIGBcclxuICB1bmlmb3JtIHZlYzMgZGlmZnVzZTtcclxuICB1bmlmb3JtIHZlYzMgZW1pc3NpdmU7XHJcbiAgdW5pZm9ybSBmbG9hdCBvcGFjaXR5O1xyXG4gIFxyXG4gIHZhcnlpbmcgdmVjMyB2TGlnaHRGcm9udDtcclxuICBcclxuICAjaWZkZWYgRE9VQkxFX1NJREVEXHJcbiAgXHJcbiAgICB2YXJ5aW5nIHZlYzMgdkxpZ2h0QmFjaztcclxuICBcclxuICAjZW5kaWZcclxuICBcclxuICAjaW5jbHVkZSA8Y29tbW9uPlxyXG4gICNpbmNsdWRlIDxwYWNraW5nPlxyXG4gICNpbmNsdWRlIDxkaXRoZXJpbmdfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8Y29sb3JfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8dXZfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8dXYyX3BhcnNfZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPG1hcF9wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxhbHBoYW1hcF9wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxhb21hcF9wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxsaWdodG1hcF9wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxlbWlzc2l2ZW1hcF9wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxlbnZtYXBfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8YnNkZnM+XHJcbiAgI2luY2x1ZGUgPGxpZ2h0c19wYXJzX2JlZ2luPlxyXG4gICNpbmNsdWRlIDxsaWdodHNfcGFyc19tYXBzPlxyXG4gICNpbmNsdWRlIDxmb2dfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8c2hhZG93bWFwX3BhcnNfZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPHNoYWRvd21hc2tfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8c3BlY3VsYXJtYXBfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX3BhcnNfZnJhZ21lbnQ+XHJcbiAgXHJcbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudFBhcmFtZXRlcnMnKX1cclxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZhcnlpbmdQYXJhbWV0ZXJzJyl9XHJcbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudEZ1bmN0aW9ucycpfVxyXG4gIFxyXG4gIHZvaWQgbWFpbigpIHtcclxuICBcclxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRJbml0Jyl9XHJcbiAgXHJcbiAgICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX2ZyYWdtZW50PlxyXG5cclxuICAgIHZlYzQgZGlmZnVzZUNvbG9yID0gdmVjNCggZGlmZnVzZSwgb3BhY2l0eSApO1xyXG4gICAgUmVmbGVjdGVkTGlnaHQgcmVmbGVjdGVkTGlnaHQgPSBSZWZsZWN0ZWRMaWdodCggdmVjMyggMC4wICksIHZlYzMoIDAuMCApLCB2ZWMzKCAwLjAgKSwgdmVjMyggMC4wICkgKTtcclxuICAgIHZlYzMgdG90YWxFbWlzc2l2ZVJhZGlhbmNlID0gZW1pc3NpdmU7XHJcblx0XHJcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50RGlmZnVzZScpfVxyXG4gIFxyXG4gICAgI2luY2x1ZGUgPGxvZ2RlcHRoYnVmX2ZyYWdtZW50PlxyXG5cclxuICAgICR7KHRoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50TWFwJykgfHwgJyNpbmNsdWRlIDxtYXBfZnJhZ21lbnQ+Jyl9XHJcblxyXG4gICAgI2luY2x1ZGUgPGNvbG9yX2ZyYWdtZW50PlxyXG4gICAgI2luY2x1ZGUgPGFscGhhbWFwX2ZyYWdtZW50PlxyXG4gICAgI2luY2x1ZGUgPGFscGhhdGVzdF9mcmFnbWVudD5cclxuICAgICNpbmNsdWRlIDxzcGVjdWxhcm1hcF9mcmFnbWVudD5cclxuXHJcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50RW1pc3NpdmUnKX1cclxuXHJcbiAgICAjaW5jbHVkZSA8ZW1pc3NpdmVtYXBfZnJhZ21lbnQ+XHJcbiAgXHJcbiAgICAvLyBhY2N1bXVsYXRpb25cclxuICAgIHJlZmxlY3RlZExpZ2h0LmluZGlyZWN0RGlmZnVzZSA9IGdldEFtYmllbnRMaWdodElycmFkaWFuY2UoIGFtYmllbnRMaWdodENvbG9yICk7XHJcbiAgXHJcbiAgICAjaW5jbHVkZSA8bGlnaHRtYXBfZnJhZ21lbnQ+XHJcbiAgXHJcbiAgICByZWZsZWN0ZWRMaWdodC5pbmRpcmVjdERpZmZ1c2UgKj0gQlJERl9EaWZmdXNlX0xhbWJlcnQoIGRpZmZ1c2VDb2xvci5yZ2IgKTtcclxuICBcclxuICAgICNpZmRlZiBET1VCTEVfU0lERURcclxuICBcclxuICAgICAgcmVmbGVjdGVkTGlnaHQuZGlyZWN0RGlmZnVzZSA9ICggZ2xfRnJvbnRGYWNpbmcgKSA/IHZMaWdodEZyb250IDogdkxpZ2h0QmFjaztcclxuICBcclxuICAgICNlbHNlXHJcbiAgXHJcbiAgICAgIHJlZmxlY3RlZExpZ2h0LmRpcmVjdERpZmZ1c2UgPSB2TGlnaHRGcm9udDtcclxuICBcclxuICAgICNlbmRpZlxyXG4gIFxyXG4gICAgcmVmbGVjdGVkTGlnaHQuZGlyZWN0RGlmZnVzZSAqPSBCUkRGX0RpZmZ1c2VfTGFtYmVydCggZGlmZnVzZUNvbG9yLnJnYiApICogZ2V0U2hhZG93TWFzaygpO1xyXG4gIFxyXG4gICAgLy8gbW9kdWxhdGlvblxyXG4gICAgI2luY2x1ZGUgPGFvbWFwX2ZyYWdtZW50PlxyXG4gIFxyXG4gICAgdmVjMyBvdXRnb2luZ0xpZ2h0ID0gcmVmbGVjdGVkTGlnaHQuZGlyZWN0RGlmZnVzZSArIHJlZmxlY3RlZExpZ2h0LmluZGlyZWN0RGlmZnVzZSArIHRvdGFsRW1pc3NpdmVSYWRpYW5jZTtcclxuICBcclxuICAgICNpbmNsdWRlIDxlbnZtYXBfZnJhZ21lbnQ+XHJcbiAgXHJcbiAgICBnbF9GcmFnQ29sb3IgPSB2ZWM0KCBvdXRnb2luZ0xpZ2h0LCBkaWZmdXNlQ29sb3IuYSApO1xyXG4gIFxyXG4gICAgI2luY2x1ZGUgPHRvbmVtYXBwaW5nX2ZyYWdtZW50PlxyXG4gICAgI2luY2x1ZGUgPGVuY29kaW5nc19mcmFnbWVudD5cclxuICAgICNpbmNsdWRlIDxmb2dfZnJhZ21lbnQ+XHJcbiAgICAjaW5jbHVkZSA8cHJlbXVsdGlwbGllZF9hbHBoYV9mcmFnbWVudD5cclxuICAgICNpbmNsdWRlIDxkaXRoZXJpbmdfZnJhZ21lbnQ+XHJcbiAgfWA7XHJcbn07XHJcblxyXG5leHBvcnQgeyBMYW1iZXJ0QW5pbWF0aW9uTWF0ZXJpYWwgfTtcclxuIiwiaW1wb3J0IHsgU2hhZGVyTGliIH0gZnJvbSAndGhyZWUnO1xyXG5pbXBvcnQgQmFzZUFuaW1hdGlvbk1hdGVyaWFsIGZyb20gJy4vQmFzZUFuaW1hdGlvbk1hdGVyaWFsJztcclxuXHJcbi8qKlxyXG4gKiBFeHRlbmRzIFRIUkVFLk1lc2hQaG9uZ01hdGVyaWFsIHdpdGggY3VzdG9tIHNoYWRlciBjaHVua3MuXHJcbiAqXHJcbiAqIEBzZWUgaHR0cDovL3RocmVlLWJhcy1leGFtcGxlcy5zdXJnZS5zaC9leGFtcGxlcy9tYXRlcmlhbHNfcGhvbmcvXHJcbiAqXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBwYXJhbWV0ZXJzIE9iamVjdCBjb250YWluaW5nIG1hdGVyaWFsIHByb3BlcnRpZXMgYW5kIGN1c3RvbSBzaGFkZXIgY2h1bmtzLlxyXG4gKiBAY29uc3RydWN0b3JcclxuICovXHJcbmZ1bmN0aW9uIFBob25nQW5pbWF0aW9uTWF0ZXJpYWwocGFyYW1ldGVycykge1xyXG4gIHRoaXMudmFyeWluZ1BhcmFtZXRlcnMgPSBbXTtcclxuXHJcbiAgdGhpcy52ZXJ0ZXhGdW5jdGlvbnMgPSBbXTtcclxuICB0aGlzLnZlcnRleFBhcmFtZXRlcnMgPSBbXTtcclxuICB0aGlzLnZlcnRleEluaXQgPSBbXTtcclxuICB0aGlzLnZlcnRleE5vcm1hbCA9IFtdO1xyXG4gIHRoaXMudmVydGV4UG9zaXRpb24gPSBbXTtcclxuICB0aGlzLnZlcnRleENvbG9yID0gW107XHJcblxyXG4gIHRoaXMuZnJhZ21lbnRGdW5jdGlvbnMgPSBbXTtcclxuICB0aGlzLmZyYWdtZW50UGFyYW1ldGVycyA9IFtdO1xyXG4gIHRoaXMuZnJhZ21lbnRJbml0ID0gW107XHJcbiAgdGhpcy5mcmFnbWVudE1hcCA9IFtdO1xyXG4gIHRoaXMuZnJhZ21lbnREaWZmdXNlID0gW107XHJcbiAgdGhpcy5mcmFnbWVudEVtaXNzaXZlID0gW107XHJcbiAgdGhpcy5mcmFnbWVudFNwZWN1bGFyID0gW107XHJcblxyXG4gIEJhc2VBbmltYXRpb25NYXRlcmlhbC5jYWxsKHRoaXMsIHBhcmFtZXRlcnMsIFNoYWRlckxpYlsncGhvbmcnXS51bmlmb3Jtcyk7XHJcblxyXG4gIHRoaXMubGlnaHRzID0gdHJ1ZTtcclxuICB0aGlzLnZlcnRleFNoYWRlciA9IHRoaXMuY29uY2F0VmVydGV4U2hhZGVyKCk7XHJcbiAgdGhpcy5mcmFnbWVudFNoYWRlciA9IHRoaXMuY29uY2F0RnJhZ21lbnRTaGFkZXIoKTtcclxufVxyXG5QaG9uZ0FuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoQmFzZUFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZSk7XHJcblBob25nQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gUGhvbmdBbmltYXRpb25NYXRlcmlhbDtcclxuXHJcblBob25nQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlLmNvbmNhdFZlcnRleFNoYWRlciA9IGZ1bmN0aW9uICgpIHtcclxuICByZXR1cm4gYFxyXG4gICNkZWZpbmUgUEhPTkdcclxuXHJcbiAgdmFyeWluZyB2ZWMzIHZWaWV3UG9zaXRpb247XHJcbiAgXHJcbiAgI2lmbmRlZiBGTEFUX1NIQURFRFxyXG4gIFxyXG4gICAgdmFyeWluZyB2ZWMzIHZOb3JtYWw7XHJcbiAgXHJcbiAgI2VuZGlmXHJcbiAgXHJcbiAgI2luY2x1ZGUgPGNvbW1vbj5cclxuICAjaW5jbHVkZSA8dXZfcGFyc192ZXJ0ZXg+XHJcbiAgI2luY2x1ZGUgPHV2Ml9wYXJzX3ZlcnRleD5cclxuICAjaW5jbHVkZSA8ZGlzcGxhY2VtZW50bWFwX3BhcnNfdmVydGV4PlxyXG4gICNpbmNsdWRlIDxlbnZtYXBfcGFyc192ZXJ0ZXg+XHJcbiAgI2luY2x1ZGUgPGNvbG9yX3BhcnNfdmVydGV4PlxyXG4gICNpbmNsdWRlIDxmb2dfcGFyc192ZXJ0ZXg+XHJcbiAgI2luY2x1ZGUgPG1vcnBodGFyZ2V0X3BhcnNfdmVydGV4PlxyXG4gICNpbmNsdWRlIDxza2lubmluZ19wYXJzX3ZlcnRleD5cclxuICAjaW5jbHVkZSA8c2hhZG93bWFwX3BhcnNfdmVydGV4PlxyXG4gICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl9wYXJzX3ZlcnRleD5cclxuICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX3BhcnNfdmVydGV4PlxyXG4gIFxyXG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UGFyYW1ldGVycycpfVxyXG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmFyeWluZ1BhcmFtZXRlcnMnKX1cclxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleEZ1bmN0aW9ucycpfVxyXG4gIFxyXG4gIHZvaWQgbWFpbigpIHtcclxuICBcclxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4SW5pdCcpfVxyXG4gIFxyXG4gICAgI2luY2x1ZGUgPHV2X3ZlcnRleD5cclxuICAgICNpbmNsdWRlIDx1djJfdmVydGV4PlxyXG4gICAgI2luY2x1ZGUgPGNvbG9yX3ZlcnRleD5cclxuICBcclxuICAgICNpbmNsdWRlIDxiZWdpbm5vcm1hbF92ZXJ0ZXg+XHJcbiAgICBcclxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4Tm9ybWFsJyl9XHJcbiAgICBcclxuICAgICNpbmNsdWRlIDxtb3JwaG5vcm1hbF92ZXJ0ZXg+XHJcbiAgICAjaW5jbHVkZSA8c2tpbmJhc2VfdmVydGV4PlxyXG4gICAgI2luY2x1ZGUgPHNraW5ub3JtYWxfdmVydGV4PlxyXG4gICAgI2luY2x1ZGUgPGRlZmF1bHRub3JtYWxfdmVydGV4PlxyXG4gIFxyXG4gICNpZm5kZWYgRkxBVF9TSEFERUQgLy8gTm9ybWFsIGNvbXB1dGVkIHdpdGggZGVyaXZhdGl2ZXMgd2hlbiBGTEFUX1NIQURFRFxyXG4gIFxyXG4gICAgdk5vcm1hbCA9IG5vcm1hbGl6ZSggdHJhbnNmb3JtZWROb3JtYWwgKTtcclxuICBcclxuICAjZW5kaWZcclxuICBcclxuICAgICNpbmNsdWRlIDxiZWdpbl92ZXJ0ZXg+XHJcbiAgICBcclxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UG9zaXRpb24nKX1cclxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4Q29sb3InKX1cclxuICAgIFxyXG4gICAgI2luY2x1ZGUgPG1vcnBodGFyZ2V0X3ZlcnRleD5cclxuICAgICNpbmNsdWRlIDxza2lubmluZ192ZXJ0ZXg+XHJcbiAgICAjaW5jbHVkZSA8ZGlzcGxhY2VtZW50bWFwX3ZlcnRleD5cclxuICAgICNpbmNsdWRlIDxwcm9qZWN0X3ZlcnRleD5cclxuICAgICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl92ZXJ0ZXg+XHJcbiAgICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX3ZlcnRleD5cclxuICBcclxuICAgIHZWaWV3UG9zaXRpb24gPSAtIG12UG9zaXRpb24ueHl6O1xyXG4gIFxyXG4gICAgI2luY2x1ZGUgPHdvcmxkcG9zX3ZlcnRleD5cclxuICAgICNpbmNsdWRlIDxlbnZtYXBfdmVydGV4PlxyXG4gICAgI2luY2x1ZGUgPHNoYWRvd21hcF92ZXJ0ZXg+XHJcbiAgICAjaW5jbHVkZSA8Zm9nX3ZlcnRleD5cclxuICB9YDtcclxufTtcclxuXHJcblBob25nQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlLmNvbmNhdEZyYWdtZW50U2hhZGVyID0gZnVuY3Rpb24gKCkge1xyXG4gIHJldHVybiBgXHJcbiAgI2RlZmluZSBQSE9OR1xyXG5cclxuICB1bmlmb3JtIHZlYzMgZGlmZnVzZTtcclxuICB1bmlmb3JtIHZlYzMgZW1pc3NpdmU7XHJcbiAgdW5pZm9ybSB2ZWMzIHNwZWN1bGFyO1xyXG4gIHVuaWZvcm0gZmxvYXQgc2hpbmluZXNzO1xyXG4gIHVuaWZvcm0gZmxvYXQgb3BhY2l0eTtcclxuICBcclxuICAjaW5jbHVkZSA8Y29tbW9uPlxyXG4gICNpbmNsdWRlIDxwYWNraW5nPlxyXG4gICNpbmNsdWRlIDxkaXRoZXJpbmdfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8Y29sb3JfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8dXZfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8dXYyX3BhcnNfZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPG1hcF9wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxhbHBoYW1hcF9wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxhb21hcF9wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxsaWdodG1hcF9wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxlbWlzc2l2ZW1hcF9wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxlbnZtYXBfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8Z3JhZGllbnRtYXBfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8Zm9nX3BhcnNfZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPGJzZGZzPlxyXG4gICNpbmNsdWRlIDxsaWdodHNfcGFyc19iZWdpbj5cclxuICAjaW5jbHVkZSA8bGlnaHRzX3BhcnNfbWFwcz5cclxuICAjaW5jbHVkZSA8bGlnaHRzX3Bob25nX3BhcnNfZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPHNoYWRvd21hcF9wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxidW1wbWFwX3BhcnNfZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPG5vcm1hbG1hcF9wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxzcGVjdWxhcm1hcF9wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl9wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfcGFyc19mcmFnbWVudD5cclxuICBcclxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50UGFyYW1ldGVycycpfVxyXG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmFyeWluZ1BhcmFtZXRlcnMnKX1cclxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50RnVuY3Rpb25zJyl9XHJcbiAgXHJcbiAgdm9pZCBtYWluKCkge1xyXG4gIFxyXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudEluaXQnKX1cclxuICBcclxuICAgICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfZnJhZ21lbnQ+XHJcbiAgXHJcbiAgICB2ZWM0IGRpZmZ1c2VDb2xvciA9IHZlYzQoIGRpZmZ1c2UsIG9wYWNpdHkgKTtcclxuICAgIFJlZmxlY3RlZExpZ2h0IHJlZmxlY3RlZExpZ2h0ID0gUmVmbGVjdGVkTGlnaHQoIHZlYzMoIDAuMCApLCB2ZWMzKCAwLjAgKSwgdmVjMyggMC4wICksIHZlYzMoIDAuMCApICk7XHJcbiAgICB2ZWMzIHRvdGFsRW1pc3NpdmVSYWRpYW5jZSA9IGVtaXNzaXZlO1xyXG4gIFxyXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudERpZmZ1c2UnKX1cclxuICBcclxuICAgICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl9mcmFnbWVudD5cclxuXHJcbiAgICAkeyh0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudE1hcCcpIHx8ICcjaW5jbHVkZSA8bWFwX2ZyYWdtZW50PicpfVxyXG5cclxuICAgICNpbmNsdWRlIDxjb2xvcl9mcmFnbWVudD5cclxuICAgICNpbmNsdWRlIDxhbHBoYW1hcF9mcmFnbWVudD5cclxuICAgICNpbmNsdWRlIDxhbHBoYXRlc3RfZnJhZ21lbnQ+XHJcbiAgICAjaW5jbHVkZSA8c3BlY3VsYXJtYXBfZnJhZ21lbnQ+XHJcbiAgICAjaW5jbHVkZSA8bm9ybWFsX2ZyYWdtZW50X2JlZ2luPlxyXG4gICAgI2luY2x1ZGUgPG5vcm1hbF9mcmFnbWVudF9tYXBzPlxyXG4gICAgXHJcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50RW1pc3NpdmUnKX1cclxuICAgIFxyXG4gICAgI2luY2x1ZGUgPGVtaXNzaXZlbWFwX2ZyYWdtZW50PlxyXG4gIFxyXG4gICAgLy8gYWNjdW11bGF0aW9uXHJcbiAgICAjaW5jbHVkZSA8bGlnaHRzX3Bob25nX2ZyYWdtZW50PlxyXG4gICAgI2luY2x1ZGUgPGxpZ2h0c19mcmFnbWVudF9iZWdpbj5cclxuICAgICNpbmNsdWRlIDxsaWdodHNfZnJhZ21lbnRfbWFwcz5cclxuICAgICNpbmNsdWRlIDxsaWdodHNfZnJhZ21lbnRfZW5kPlxyXG4gICAgXHJcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50U3BlY3VsYXInKX1cclxuICAgIFxyXG4gICAgLy8gbW9kdWxhdGlvblxyXG4gICAgI2luY2x1ZGUgPGFvbWFwX2ZyYWdtZW50PlxyXG4gIFxyXG4gICAgdmVjMyBvdXRnb2luZ0xpZ2h0ID0gcmVmbGVjdGVkTGlnaHQuZGlyZWN0RGlmZnVzZSArIHJlZmxlY3RlZExpZ2h0LmluZGlyZWN0RGlmZnVzZSArIHJlZmxlY3RlZExpZ2h0LmRpcmVjdFNwZWN1bGFyICsgcmVmbGVjdGVkTGlnaHQuaW5kaXJlY3RTcGVjdWxhciArIHRvdGFsRW1pc3NpdmVSYWRpYW5jZTtcclxuICBcclxuICAgICNpbmNsdWRlIDxlbnZtYXBfZnJhZ21lbnQ+XHJcbiAgXHJcbiAgICBnbF9GcmFnQ29sb3IgPSB2ZWM0KCBvdXRnb2luZ0xpZ2h0LCBkaWZmdXNlQ29sb3IuYSApO1xyXG4gIFxyXG4gICAgI2luY2x1ZGUgPHRvbmVtYXBwaW5nX2ZyYWdtZW50PlxyXG4gICAgI2luY2x1ZGUgPGVuY29kaW5nc19mcmFnbWVudD5cclxuICAgICNpbmNsdWRlIDxmb2dfZnJhZ21lbnQ+XHJcbiAgICAjaW5jbHVkZSA8cHJlbXVsdGlwbGllZF9hbHBoYV9mcmFnbWVudD5cclxuICAgICNpbmNsdWRlIDxkaXRoZXJpbmdfZnJhZ21lbnQ+XHJcbiAgXHJcbiAgfWA7XHJcbn07XHJcblxyXG5leHBvcnQgeyBQaG9uZ0FuaW1hdGlvbk1hdGVyaWFsIH07XHJcbiIsImltcG9ydCB7IFNoYWRlckxpYiB9IGZyb20gJ3RocmVlJztcclxuaW1wb3J0IEJhc2VBbmltYXRpb25NYXRlcmlhbCBmcm9tICcuL0Jhc2VBbmltYXRpb25NYXRlcmlhbCc7XHJcblxyXG4vKipcclxuICogRXh0ZW5kcyBUSFJFRS5NZXNoU3RhbmRhcmRNYXRlcmlhbCB3aXRoIGN1c3RvbSBzaGFkZXIgY2h1bmtzLlxyXG4gKlxyXG4gKiBAc2VlIGh0dHA6Ly90aHJlZS1iYXMtZXhhbXBsZXMuc3VyZ2Uuc2gvZXhhbXBsZXMvbWF0ZXJpYWxzX3N0YW5kYXJkL1xyXG4gKlxyXG4gKiBAcGFyYW0ge09iamVjdH0gcGFyYW1ldGVycyBPYmplY3QgY29udGFpbmluZyBtYXRlcmlhbCBwcm9wZXJ0aWVzIGFuZCBjdXN0b20gc2hhZGVyIGNodW5rcy5cclxuICogQGNvbnN0cnVjdG9yXHJcbiAqL1xyXG5mdW5jdGlvbiBTdGFuZGFyZEFuaW1hdGlvbk1hdGVyaWFsKHBhcmFtZXRlcnMpIHtcclxuICB0aGlzLnZhcnlpbmdQYXJhbWV0ZXJzID0gW107XHJcblxyXG4gIHRoaXMudmVydGV4RnVuY3Rpb25zID0gW107XHJcbiAgdGhpcy52ZXJ0ZXhQYXJhbWV0ZXJzID0gW107XHJcbiAgdGhpcy52ZXJ0ZXhJbml0ID0gW107XHJcbiAgdGhpcy52ZXJ0ZXhOb3JtYWwgPSBbXTtcclxuICB0aGlzLnZlcnRleFBvc2l0aW9uID0gW107XHJcbiAgdGhpcy52ZXJ0ZXhDb2xvciA9IFtdO1xyXG4gIHRoaXMudmVydGV4UG9zdE1vcnBoID0gW107XHJcbiAgdGhpcy52ZXJ0ZXhQb3N0U2tpbm5pbmcgPSBbXTtcclxuXHJcbiAgdGhpcy5mcmFnbWVudEZ1bmN0aW9ucyA9IFtdO1xyXG4gIHRoaXMuZnJhZ21lbnRQYXJhbWV0ZXJzID0gW107XHJcbiAgdGhpcy5mcmFnbWVudEluaXQgPSBbXTtcclxuICB0aGlzLmZyYWdtZW50TWFwID0gW107XHJcbiAgdGhpcy5mcmFnbWVudERpZmZ1c2UgPSBbXTtcclxuICB0aGlzLmZyYWdtZW50Um91Z2huZXNzID0gW107XHJcbiAgdGhpcy5mcmFnbWVudE1ldGFsbmVzcyA9IFtdO1xyXG4gIHRoaXMuZnJhZ21lbnRFbWlzc2l2ZSA9IFtdO1xyXG5cclxuICBCYXNlQW5pbWF0aW9uTWF0ZXJpYWwuY2FsbCh0aGlzLCBwYXJhbWV0ZXJzLCBTaGFkZXJMaWJbJ3N0YW5kYXJkJ10udW5pZm9ybXMpO1xyXG5cclxuICB0aGlzLmxpZ2h0cyA9IHRydWU7XHJcbiAgdGhpcy52ZXJ0ZXhTaGFkZXIgPSB0aGlzLmNvbmNhdFZlcnRleFNoYWRlcigpO1xyXG4gIHRoaXMuZnJhZ21lbnRTaGFkZXIgPSB0aGlzLmNvbmNhdEZyYWdtZW50U2hhZGVyKCk7XHJcbn1cclxuU3RhbmRhcmRBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEJhc2VBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUpO1xyXG5TdGFuZGFyZEFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFN0YW5kYXJkQW5pbWF0aW9uTWF0ZXJpYWw7XHJcblxyXG5TdGFuZGFyZEFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZS5jb25jYXRWZXJ0ZXhTaGFkZXIgPSBmdW5jdGlvbiAoKSB7XHJcbiAgcmV0dXJuIGBcclxuICAjZGVmaW5lIFBIWVNJQ0FMXHJcblxyXG4gIHZhcnlpbmcgdmVjMyB2Vmlld1Bvc2l0aW9uO1xyXG4gIFxyXG4gICNpZm5kZWYgRkxBVF9TSEFERURcclxuICBcclxuICAgIHZhcnlpbmcgdmVjMyB2Tm9ybWFsO1xyXG4gIFxyXG4gICNlbmRpZlxyXG4gIFxyXG4gICNpbmNsdWRlIDxjb21tb24+XHJcbiAgI2luY2x1ZGUgPHV2X3BhcnNfdmVydGV4PlxyXG4gICNpbmNsdWRlIDx1djJfcGFyc192ZXJ0ZXg+XHJcbiAgI2luY2x1ZGUgPGRpc3BsYWNlbWVudG1hcF9wYXJzX3ZlcnRleD5cclxuICAjaW5jbHVkZSA8Y29sb3JfcGFyc192ZXJ0ZXg+XHJcbiAgI2luY2x1ZGUgPGZvZ19wYXJzX3ZlcnRleD5cclxuICAjaW5jbHVkZSA8bW9ycGh0YXJnZXRfcGFyc192ZXJ0ZXg+XHJcbiAgI2luY2x1ZGUgPHNraW5uaW5nX3BhcnNfdmVydGV4PlxyXG4gICNpbmNsdWRlIDxzaGFkb3dtYXBfcGFyc192ZXJ0ZXg+XHJcbiAgI2luY2x1ZGUgPGxvZ2RlcHRoYnVmX3BhcnNfdmVydGV4PlxyXG4gICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfcGFyc192ZXJ0ZXg+XHJcbiAgXHJcbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQYXJhbWV0ZXJzJyl9XHJcbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2YXJ5aW5nUGFyYW1ldGVycycpfVxyXG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4RnVuY3Rpb25zJyl9XHJcbiAgXHJcbiAgdm9pZCBtYWluKCkge1xyXG5cclxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4SW5pdCcpfVxyXG5cclxuICAgICNpbmNsdWRlIDx1dl92ZXJ0ZXg+XHJcbiAgICAjaW5jbHVkZSA8dXYyX3ZlcnRleD5cclxuICAgICNpbmNsdWRlIDxjb2xvcl92ZXJ0ZXg+XHJcbiAgXHJcbiAgICAjaW5jbHVkZSA8YmVnaW5ub3JtYWxfdmVydGV4PlxyXG4gICAgXHJcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleE5vcm1hbCcpfVxyXG4gICAgXHJcbiAgICAjaW5jbHVkZSA8bW9ycGhub3JtYWxfdmVydGV4PlxyXG4gICAgI2luY2x1ZGUgPHNraW5iYXNlX3ZlcnRleD5cclxuICAgICNpbmNsdWRlIDxza2lubm9ybWFsX3ZlcnRleD5cclxuICAgICNpbmNsdWRlIDxkZWZhdWx0bm9ybWFsX3ZlcnRleD5cclxuICBcclxuICAjaWZuZGVmIEZMQVRfU0hBREVEIC8vIE5vcm1hbCBjb21wdXRlZCB3aXRoIGRlcml2YXRpdmVzIHdoZW4gRkxBVF9TSEFERURcclxuICBcclxuICAgIHZOb3JtYWwgPSBub3JtYWxpemUoIHRyYW5zZm9ybWVkTm9ybWFsICk7XHJcbiAgXHJcbiAgI2VuZGlmXHJcbiAgXHJcbiAgICAjaW5jbHVkZSA8YmVnaW5fdmVydGV4PlxyXG4gICAgXHJcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBvc2l0aW9uJyl9XHJcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleENvbG9yJyl9XHJcbiAgICBcclxuICAgICNpbmNsdWRlIDxtb3JwaHRhcmdldF92ZXJ0ZXg+XHJcbiAgICBcclxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UG9zdE1vcnBoJyl9XHJcbiAgICBcclxuICAgICNpbmNsdWRlIDxza2lubmluZ192ZXJ0ZXg+XHJcblxyXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQb3N0U2tpbm5pbmcnKX1cclxuICAgIFxyXG4gICAgI2luY2x1ZGUgPGRpc3BsYWNlbWVudG1hcF92ZXJ0ZXg+XHJcbiAgICAjaW5jbHVkZSA8cHJvamVjdF92ZXJ0ZXg+XHJcbiAgICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfdmVydGV4PlxyXG4gICAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc192ZXJ0ZXg+XHJcbiAgXHJcbiAgICB2Vmlld1Bvc2l0aW9uID0gLSBtdlBvc2l0aW9uLnh5ejtcclxuICBcclxuICAgICNpbmNsdWRlIDx3b3JsZHBvc192ZXJ0ZXg+XHJcbiAgICAjaW5jbHVkZSA8c2hhZG93bWFwX3ZlcnRleD5cclxuICAgICNpbmNsdWRlIDxmb2dfdmVydGV4PlxyXG4gIH1gO1xyXG59O1xyXG5cclxuU3RhbmRhcmRBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uY2F0RnJhZ21lbnRTaGFkZXIgPSBmdW5jdGlvbiAoKSB7XHJcbiAgcmV0dXJuIGBcclxuICAjZGVmaW5lIFBIWVNJQ0FMXHJcbiAgXHJcbiAgdW5pZm9ybSB2ZWMzIGRpZmZ1c2U7XHJcbiAgdW5pZm9ybSB2ZWMzIGVtaXNzaXZlO1xyXG4gIHVuaWZvcm0gZmxvYXQgcm91Z2huZXNzO1xyXG4gIHVuaWZvcm0gZmxvYXQgbWV0YWxuZXNzO1xyXG4gIHVuaWZvcm0gZmxvYXQgb3BhY2l0eTtcclxuICBcclxuICAjaWZuZGVmIFNUQU5EQVJEXHJcbiAgICB1bmlmb3JtIGZsb2F0IGNsZWFyQ29hdDtcclxuICAgIHVuaWZvcm0gZmxvYXQgY2xlYXJDb2F0Um91Z2huZXNzO1xyXG4gICNlbmRpZlxyXG4gIFxyXG4gIHZhcnlpbmcgdmVjMyB2Vmlld1Bvc2l0aW9uO1xyXG4gIFxyXG4gICNpZm5kZWYgRkxBVF9TSEFERURcclxuICBcclxuICAgIHZhcnlpbmcgdmVjMyB2Tm9ybWFsO1xyXG4gIFxyXG4gICNlbmRpZlxyXG4gIFxyXG4gICNpbmNsdWRlIDxjb21tb24+XHJcbiAgI2luY2x1ZGUgPHBhY2tpbmc+XHJcbiAgI2luY2x1ZGUgPGRpdGhlcmluZ19wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxjb2xvcl9wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDx1dl9wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDx1djJfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8bWFwX3BhcnNfZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPGFscGhhbWFwX3BhcnNfZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPGFvbWFwX3BhcnNfZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPGxpZ2h0bWFwX3BhcnNfZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPGVtaXNzaXZlbWFwX3BhcnNfZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPGVudm1hcF9wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxmb2dfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8YnNkZnM+XHJcbiAgI2luY2x1ZGUgPGN1YmVfdXZfcmVmbGVjdGlvbl9mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8bGlnaHRzX3BhcnNfYmVnaW4+XHJcbiAgI2luY2x1ZGUgPGxpZ2h0c19wYXJzX21hcHM+XHJcbiAgI2luY2x1ZGUgPGxpZ2h0c19waHlzaWNhbF9wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxzaGFkb3dtYXBfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8YnVtcG1hcF9wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxub3JtYWxtYXBfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8cm91Z2huZXNzbWFwX3BhcnNfZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPG1ldGFsbmVzc21hcF9wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl9wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfcGFyc19mcmFnbWVudD5cclxuICBcclxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50UGFyYW1ldGVycycpfVxyXG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmFyeWluZ1BhcmFtZXRlcnMnKX1cclxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50RnVuY3Rpb25zJyl9XHJcbiAgXHJcbiAgdm9pZCBtYWluKCkge1xyXG4gIFxyXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudEluaXQnKX1cclxuICBcclxuICAgICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfZnJhZ21lbnQ+XHJcbiAgXHJcbiAgICB2ZWM0IGRpZmZ1c2VDb2xvciA9IHZlYzQoIGRpZmZ1c2UsIG9wYWNpdHkgKTtcclxuICAgIFJlZmxlY3RlZExpZ2h0IHJlZmxlY3RlZExpZ2h0ID0gUmVmbGVjdGVkTGlnaHQoIHZlYzMoIDAuMCApLCB2ZWMzKCAwLjAgKSwgdmVjMyggMC4wICksIHZlYzMoIDAuMCApICk7XHJcbiAgICB2ZWMzIHRvdGFsRW1pc3NpdmVSYWRpYW5jZSA9IGVtaXNzaXZlO1xyXG4gIFxyXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudERpZmZ1c2UnKX1cclxuICBcclxuICAgICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl9mcmFnbWVudD5cclxuXHJcbiAgICAkeyh0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudE1hcCcpIHx8ICcjaW5jbHVkZSA8bWFwX2ZyYWdtZW50PicpfVxyXG5cclxuICAgICNpbmNsdWRlIDxjb2xvcl9mcmFnbWVudD5cclxuICAgICNpbmNsdWRlIDxhbHBoYW1hcF9mcmFnbWVudD5cclxuICAgICNpbmNsdWRlIDxhbHBoYXRlc3RfZnJhZ21lbnQ+XHJcbiAgICBcclxuICAgIGZsb2F0IHJvdWdobmVzc0ZhY3RvciA9IHJvdWdobmVzcztcclxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRSb3VnaG5lc3MnKX1cclxuICAgICNpZmRlZiBVU0VfUk9VR0hORVNTTUFQXHJcbiAgICBcclxuICAgICAgdmVjNCB0ZXhlbFJvdWdobmVzcyA9IHRleHR1cmUyRCggcm91Z2huZXNzTWFwLCB2VXYgKTtcclxuICAgIFxyXG4gICAgICAvLyByZWFkcyBjaGFubmVsIEcsIGNvbXBhdGlibGUgd2l0aCBhIGNvbWJpbmVkIE9jY2x1c2lvblJvdWdobmVzc01ldGFsbGljIChSR0IpIHRleHR1cmVcclxuICAgICAgcm91Z2huZXNzRmFjdG9yICo9IHRleGVsUm91Z2huZXNzLmc7XHJcbiAgICBcclxuICAgICNlbmRpZlxyXG4gICAgXHJcbiAgICBmbG9hdCBtZXRhbG5lc3NGYWN0b3IgPSBtZXRhbG5lc3M7XHJcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50TWV0YWxuZXNzJyl9XHJcbiAgICAjaWZkZWYgVVNFX01FVEFMTkVTU01BUFxyXG4gICAgXHJcbiAgICAgIHZlYzQgdGV4ZWxNZXRhbG5lc3MgPSB0ZXh0dXJlMkQoIG1ldGFsbmVzc01hcCwgdlV2ICk7XHJcbiAgICAgIG1ldGFsbmVzc0ZhY3RvciAqPSB0ZXhlbE1ldGFsbmVzcy5iO1xyXG4gICAgXHJcbiAgICAjZW5kaWZcclxuICAgIFxyXG4gICAgI2luY2x1ZGUgPG5vcm1hbF9mcmFnbWVudF9iZWdpbj5cclxuICAgICNpbmNsdWRlIDxub3JtYWxfZnJhZ21lbnRfbWFwcz5cclxuICAgIFxyXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudEVtaXNzaXZlJyl9XHJcbiAgICBcclxuICAgICNpbmNsdWRlIDxlbWlzc2l2ZW1hcF9mcmFnbWVudD5cclxuICBcclxuICAgIC8vIGFjY3VtdWxhdGlvblxyXG4gICAgI2luY2x1ZGUgPGxpZ2h0c19waHlzaWNhbF9mcmFnbWVudD5cclxuICAgICNpbmNsdWRlIDxsaWdodHNfZnJhZ21lbnRfYmVnaW4+XHJcbiAgICAjaW5jbHVkZSA8bGlnaHRzX2ZyYWdtZW50X21hcHM+XHJcbiAgICAjaW5jbHVkZSA8bGlnaHRzX2ZyYWdtZW50X2VuZD5cclxuICBcclxuICAgIC8vIG1vZHVsYXRpb25cclxuICAgICNpbmNsdWRlIDxhb21hcF9mcmFnbWVudD5cclxuICBcclxuICAgIHZlYzMgb3V0Z29pbmdMaWdodCA9IHJlZmxlY3RlZExpZ2h0LmRpcmVjdERpZmZ1c2UgKyByZWZsZWN0ZWRMaWdodC5pbmRpcmVjdERpZmZ1c2UgKyByZWZsZWN0ZWRMaWdodC5kaXJlY3RTcGVjdWxhciArIHJlZmxlY3RlZExpZ2h0LmluZGlyZWN0U3BlY3VsYXIgKyB0b3RhbEVtaXNzaXZlUmFkaWFuY2U7XHJcbiAgXHJcbiAgICBnbF9GcmFnQ29sb3IgPSB2ZWM0KCBvdXRnb2luZ0xpZ2h0LCBkaWZmdXNlQ29sb3IuYSApO1xyXG4gIFxyXG4gICAgI2luY2x1ZGUgPHRvbmVtYXBwaW5nX2ZyYWdtZW50PlxyXG4gICAgI2luY2x1ZGUgPGVuY29kaW5nc19mcmFnbWVudD5cclxuICAgICNpbmNsdWRlIDxmb2dfZnJhZ21lbnQ+XHJcbiAgICAjaW5jbHVkZSA8cHJlbXVsdGlwbGllZF9hbHBoYV9mcmFnbWVudD5cclxuICAgICNpbmNsdWRlIDxkaXRoZXJpbmdfZnJhZ21lbnQ+XHJcbiAgXHJcbiAgfWA7XHJcbn07XHJcblxyXG5leHBvcnQgeyBTdGFuZGFyZEFuaW1hdGlvbk1hdGVyaWFsIH07XHJcbiIsImltcG9ydCB7IFNoYWRlckxpYiB9IGZyb20gJ3RocmVlJztcclxuaW1wb3J0IEJhc2VBbmltYXRpb25NYXRlcmlhbCBmcm9tICcuL0Jhc2VBbmltYXRpb25NYXRlcmlhbCc7XHJcblxyXG4vKipcclxuICogRXh0ZW5kcyBUSFJFRS5Qb2ludHNNYXRlcmlhbCB3aXRoIGN1c3RvbSBzaGFkZXIgY2h1bmtzLlxyXG4gKlxyXG4gKiBAcGFyYW0ge09iamVjdH0gcGFyYW1ldGVycyBPYmplY3QgY29udGFpbmluZyBtYXRlcmlhbCBwcm9wZXJ0aWVzIGFuZCBjdXN0b20gc2hhZGVyIGNodW5rcy5cclxuICogQGNvbnN0cnVjdG9yXHJcbiAqL1xyXG5mdW5jdGlvbiBQb2ludHNBbmltYXRpb25NYXRlcmlhbChwYXJhbWV0ZXJzKSB7XHJcbiAgdGhpcy52YXJ5aW5nUGFyYW1ldGVycyA9IFtdO1xyXG4gIFxyXG4gIHRoaXMudmVydGV4RnVuY3Rpb25zID0gW107XHJcbiAgdGhpcy52ZXJ0ZXhQYXJhbWV0ZXJzID0gW107XHJcbiAgdGhpcy52ZXJ0ZXhJbml0ID0gW107XHJcbiAgdGhpcy52ZXJ0ZXhQb3NpdGlvbiA9IFtdO1xyXG4gIHRoaXMudmVydGV4Q29sb3IgPSBbXTtcclxuICBcclxuICB0aGlzLmZyYWdtZW50RnVuY3Rpb25zID0gW107XHJcbiAgdGhpcy5mcmFnbWVudFBhcmFtZXRlcnMgPSBbXTtcclxuICB0aGlzLmZyYWdtZW50SW5pdCA9IFtdO1xyXG4gIHRoaXMuZnJhZ21lbnRNYXAgPSBbXTtcclxuICB0aGlzLmZyYWdtZW50RGlmZnVzZSA9IFtdO1xyXG4gIC8vIHVzZSBmcmFnbWVudCBzaGFkZXIgdG8gc2hhcGUgdG8gcG9pbnQsIHJlZmVyZW5jZTogaHR0cHM6Ly90aGVib29rb2ZzaGFkZXJzLmNvbS8wNy9cclxuICB0aGlzLmZyYWdtZW50U2hhcGUgPSBbXTtcclxuICBcclxuICBCYXNlQW5pbWF0aW9uTWF0ZXJpYWwuY2FsbCh0aGlzLCBwYXJhbWV0ZXJzLCBTaGFkZXJMaWJbJ3BvaW50cyddLnVuaWZvcm1zKTtcclxuICBcclxuICB0aGlzLnZlcnRleFNoYWRlciA9IHRoaXMuY29uY2F0VmVydGV4U2hhZGVyKCk7XHJcbiAgdGhpcy5mcmFnbWVudFNoYWRlciA9IHRoaXMuY29uY2F0RnJhZ21lbnRTaGFkZXIoKTtcclxufVxyXG5cclxuUG9pbnRzQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShCYXNlQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlKTtcclxuUG9pbnRzQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gUG9pbnRzQW5pbWF0aW9uTWF0ZXJpYWw7XHJcblxyXG5Qb2ludHNBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uY2F0VmVydGV4U2hhZGVyID0gZnVuY3Rpb24gKCkge1xyXG4gIHJldHVybiBgXHJcbiAgdW5pZm9ybSBmbG9hdCBzaXplO1xyXG4gIHVuaWZvcm0gZmxvYXQgc2NhbGU7XHJcbiAgXHJcbiAgI2luY2x1ZGUgPGNvbW1vbj5cclxuICAjaW5jbHVkZSA8Y29sb3JfcGFyc192ZXJ0ZXg+XHJcbiAgI2luY2x1ZGUgPGZvZ19wYXJzX3ZlcnRleD5cclxuICAjaW5jbHVkZSA8c2hhZG93bWFwX3BhcnNfdmVydGV4PlxyXG4gICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl9wYXJzX3ZlcnRleD5cclxuICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX3BhcnNfdmVydGV4PlxyXG4gIFxyXG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UGFyYW1ldGVycycpfVxyXG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmFyeWluZ1BhcmFtZXRlcnMnKX1cclxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleEZ1bmN0aW9ucycpfVxyXG4gIFxyXG4gIHZvaWQgbWFpbigpIHtcclxuICBcclxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4SW5pdCcpfVxyXG4gIFxyXG4gICAgI2luY2x1ZGUgPGNvbG9yX3ZlcnRleD5cclxuICAgICNpbmNsdWRlIDxiZWdpbl92ZXJ0ZXg+XHJcbiAgICBcclxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UG9zaXRpb24nKX1cclxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4Q29sb3InKX1cclxuICAgIFxyXG4gICAgI2luY2x1ZGUgPHByb2plY3RfdmVydGV4PlxyXG4gIFxyXG4gICAgI2lmZGVmIFVTRV9TSVpFQVRURU5VQVRJT05cclxuICAgICAgZ2xfUG9pbnRTaXplID0gc2l6ZSAqICggc2NhbGUgLyAtIG12UG9zaXRpb24ueiApO1xyXG4gICAgI2Vsc2VcclxuICAgICAgZ2xfUG9pbnRTaXplID0gc2l6ZTtcclxuICAgICNlbmRpZlxyXG4gIFxyXG4gICAgI2luY2x1ZGUgPGxvZ2RlcHRoYnVmX3ZlcnRleD5cclxuICAgICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfdmVydGV4PlxyXG4gICAgI2luY2x1ZGUgPHdvcmxkcG9zX3ZlcnRleD5cclxuICAgICNpbmNsdWRlIDxzaGFkb3dtYXBfdmVydGV4PlxyXG4gICAgI2luY2x1ZGUgPGZvZ192ZXJ0ZXg+XHJcbiAgfWA7XHJcbn07XHJcblxyXG5Qb2ludHNBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uY2F0RnJhZ21lbnRTaGFkZXIgPSBmdW5jdGlvbiAoKSB7XHJcbiAgcmV0dXJuIGBcclxuICB1bmlmb3JtIHZlYzMgZGlmZnVzZTtcclxuICB1bmlmb3JtIGZsb2F0IG9wYWNpdHk7XHJcbiAgXHJcbiAgI2luY2x1ZGUgPGNvbW1vbj5cclxuICAjaW5jbHVkZSA8cGFja2luZz5cclxuICAjaW5jbHVkZSA8Y29sb3JfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8bWFwX3BhcnRpY2xlX3BhcnNfZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPGZvZ19wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxzaGFkb3dtYXBfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX3BhcnNfZnJhZ21lbnQ+XHJcbiAgXHJcbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudFBhcmFtZXRlcnMnKX1cclxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZhcnlpbmdQYXJhbWV0ZXJzJyl9XHJcbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudEZ1bmN0aW9ucycpfVxyXG4gIFxyXG4gIHZvaWQgbWFpbigpIHtcclxuICBcclxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRJbml0Jyl9XHJcbiAgXHJcbiAgICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX2ZyYWdtZW50PlxyXG4gIFxyXG4gICAgdmVjMyBvdXRnb2luZ0xpZ2h0ID0gdmVjMyggMC4wICk7XHJcbiAgICB2ZWM0IGRpZmZ1c2VDb2xvciA9IHZlYzQoIGRpZmZ1c2UsIG9wYWNpdHkgKTtcclxuICBcclxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnREaWZmdXNlJyl9XHJcbiAgXHJcbiAgICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfZnJhZ21lbnQ+XHJcblxyXG4gICAgJHsodGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRNYXAnKSB8fCAnI2luY2x1ZGUgPG1hcF9wYXJ0aWNsZV9mcmFnbWVudD4nKX1cclxuXHJcbiAgICAjaW5jbHVkZSA8Y29sb3JfZnJhZ21lbnQ+XHJcbiAgICAjaW5jbHVkZSA8YWxwaGF0ZXN0X2ZyYWdtZW50PlxyXG4gIFxyXG4gICAgb3V0Z29pbmdMaWdodCA9IGRpZmZ1c2VDb2xvci5yZ2I7XHJcbiAgXHJcbiAgICBnbF9GcmFnQ29sb3IgPSB2ZWM0KCBvdXRnb2luZ0xpZ2h0LCBkaWZmdXNlQ29sb3IuYSApO1xyXG4gICAgXHJcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50U2hhcGUnKX1cclxuICBcclxuICAgICNpbmNsdWRlIDxwcmVtdWx0aXBsaWVkX2FscGhhX2ZyYWdtZW50PlxyXG4gICAgI2luY2x1ZGUgPHRvbmVtYXBwaW5nX2ZyYWdtZW50PlxyXG4gICAgI2luY2x1ZGUgPGVuY29kaW5nc19mcmFnbWVudD5cclxuICAgICNpbmNsdWRlIDxmb2dfZnJhZ21lbnQ+XHJcbiAgfWA7XHJcbn07XHJcblxyXG5leHBvcnQgeyBQb2ludHNBbmltYXRpb25NYXRlcmlhbCB9O1xyXG4iLCJpbXBvcnQgeyBTaGFkZXJMaWIsIFVuaWZvcm1zVXRpbHMsIFJHQkFEZXB0aFBhY2tpbmcgfSBmcm9tICd0aHJlZSc7XHJcbmltcG9ydCBCYXNlQW5pbWF0aW9uTWF0ZXJpYWwgZnJvbSAnLi9CYXNlQW5pbWF0aW9uTWF0ZXJpYWwnO1xyXG5cclxuZnVuY3Rpb24gRGVwdGhBbmltYXRpb25NYXRlcmlhbChwYXJhbWV0ZXJzKSB7XHJcbiAgdGhpcy5kZXB0aFBhY2tpbmcgPSBSR0JBRGVwdGhQYWNraW5nO1xyXG4gIHRoaXMuY2xpcHBpbmcgPSB0cnVlO1xyXG5cclxuICB0aGlzLnZlcnRleEZ1bmN0aW9ucyA9IFtdO1xyXG4gIHRoaXMudmVydGV4UGFyYW1ldGVycyA9IFtdO1xyXG4gIHRoaXMudmVydGV4SW5pdCA9IFtdO1xyXG4gIHRoaXMudmVydGV4UG9zaXRpb24gPSBbXTtcclxuICB0aGlzLnZlcnRleFBvc3RNb3JwaCA9IFtdO1xyXG4gIHRoaXMudmVydGV4UG9zdFNraW5uaW5nID0gW107XHJcblxyXG4gIEJhc2VBbmltYXRpb25NYXRlcmlhbC5jYWxsKHRoaXMsIHBhcmFtZXRlcnMpO1xyXG4gIFxyXG4gIHRoaXMudW5pZm9ybXMgPSBVbmlmb3Jtc1V0aWxzLm1lcmdlKFtTaGFkZXJMaWJbJ2RlcHRoJ10udW5pZm9ybXMsIHRoaXMudW5pZm9ybXNdKTtcclxuICB0aGlzLnZlcnRleFNoYWRlciA9IHRoaXMuY29uY2F0VmVydGV4U2hhZGVyKCk7XHJcbiAgdGhpcy5mcmFnbWVudFNoYWRlciA9IFNoYWRlckxpYlsnZGVwdGgnXS5mcmFnbWVudFNoYWRlcjtcclxufVxyXG5EZXB0aEFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoQmFzZUFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZSk7XHJcbkRlcHRoQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gRGVwdGhBbmltYXRpb25NYXRlcmlhbDtcclxuXHJcbkRlcHRoQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlLmNvbmNhdFZlcnRleFNoYWRlciA9IGZ1bmN0aW9uICgpIHtcclxuICBcclxuICByZXR1cm4gYFxyXG4gICNpbmNsdWRlIDxjb21tb24+XHJcbiAgI2luY2x1ZGUgPHV2X3BhcnNfdmVydGV4PlxyXG4gICNpbmNsdWRlIDxkaXNwbGFjZW1lbnRtYXBfcGFyc192ZXJ0ZXg+XHJcbiAgI2luY2x1ZGUgPG1vcnBodGFyZ2V0X3BhcnNfdmVydGV4PlxyXG4gICNpbmNsdWRlIDxza2lubmluZ19wYXJzX3ZlcnRleD5cclxuICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfcGFyc192ZXJ0ZXg+XHJcbiAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc19wYXJzX3ZlcnRleD5cclxuICBcclxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBhcmFtZXRlcnMnKX1cclxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleEZ1bmN0aW9ucycpfVxyXG4gIFxyXG4gIHZvaWQgbWFpbigpIHtcclxuICBcclxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4SW5pdCcpfVxyXG4gIFxyXG4gICAgI2luY2x1ZGUgPHV2X3ZlcnRleD5cclxuICBcclxuICAgICNpbmNsdWRlIDxza2luYmFzZV92ZXJ0ZXg+XHJcbiAgXHJcbiAgICAjaWZkZWYgVVNFX0RJU1BMQUNFTUVOVE1BUFxyXG4gIFxyXG4gICAgICAjaW5jbHVkZSA8YmVnaW5ub3JtYWxfdmVydGV4PlxyXG4gICAgICAjaW5jbHVkZSA8bW9ycGhub3JtYWxfdmVydGV4PlxyXG4gICAgICAjaW5jbHVkZSA8c2tpbm5vcm1hbF92ZXJ0ZXg+XHJcbiAgXHJcbiAgICAjZW5kaWZcclxuICBcclxuICAgICNpbmNsdWRlIDxiZWdpbl92ZXJ0ZXg+XHJcbiAgICBcclxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UG9zaXRpb24nKX1cclxuXHJcbiAgICAjaW5jbHVkZSA8bW9ycGh0YXJnZXRfdmVydGV4PlxyXG4gICAgXHJcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBvc3RNb3JwaCcpfVxyXG4gICAgXHJcbiAgICAjaW5jbHVkZSA8c2tpbm5pbmdfdmVydGV4PlxyXG5cclxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UG9zdFNraW5uaW5nJyl9XHJcbiAgICBcclxuICAgICNpbmNsdWRlIDxkaXNwbGFjZW1lbnRtYXBfdmVydGV4PlxyXG4gICAgI2luY2x1ZGUgPHByb2plY3RfdmVydGV4PlxyXG4gICAgI2luY2x1ZGUgPGxvZ2RlcHRoYnVmX3ZlcnRleD5cclxuICAgICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfdmVydGV4PlxyXG4gIH1gO1xyXG59O1xyXG5cclxuZXhwb3J0IHsgRGVwdGhBbmltYXRpb25NYXRlcmlhbCB9O1xyXG4iLCJpbXBvcnQgeyBTaGFkZXJMaWIsIFVuaWZvcm1zVXRpbHMsIFJHQkFEZXB0aFBhY2tpbmcgfSBmcm9tICd0aHJlZSc7XHJcbmltcG9ydCBCYXNlQW5pbWF0aW9uTWF0ZXJpYWwgZnJvbSAnLi9CYXNlQW5pbWF0aW9uTWF0ZXJpYWwnO1xyXG5cclxuZnVuY3Rpb24gRGlzdGFuY2VBbmltYXRpb25NYXRlcmlhbChwYXJhbWV0ZXJzKSB7XHJcbiAgdGhpcy5kZXB0aFBhY2tpbmcgPSBSR0JBRGVwdGhQYWNraW5nO1xyXG4gIHRoaXMuY2xpcHBpbmcgPSB0cnVlO1xyXG5cclxuICB0aGlzLnZlcnRleEZ1bmN0aW9ucyA9IFtdO1xyXG4gIHRoaXMudmVydGV4UGFyYW1ldGVycyA9IFtdO1xyXG4gIHRoaXMudmVydGV4SW5pdCA9IFtdO1xyXG4gIHRoaXMudmVydGV4UG9zaXRpb24gPSBbXTtcclxuICB0aGlzLnZlcnRleFBvc3RNb3JwaCA9IFtdO1xyXG4gIHRoaXMudmVydGV4UG9zdFNraW5uaW5nID0gW107XHJcblxyXG4gIEJhc2VBbmltYXRpb25NYXRlcmlhbC5jYWxsKHRoaXMsIHBhcmFtZXRlcnMpO1xyXG4gIFxyXG4gIHRoaXMudW5pZm9ybXMgPSBVbmlmb3Jtc1V0aWxzLm1lcmdlKFtTaGFkZXJMaWJbJ2Rpc3RhbmNlUkdCQSddLnVuaWZvcm1zLCB0aGlzLnVuaWZvcm1zXSk7XHJcbiAgdGhpcy52ZXJ0ZXhTaGFkZXIgPSB0aGlzLmNvbmNhdFZlcnRleFNoYWRlcigpO1xyXG4gIHRoaXMuZnJhZ21lbnRTaGFkZXIgPSBTaGFkZXJMaWJbJ2Rpc3RhbmNlUkdCQSddLmZyYWdtZW50U2hhZGVyO1xyXG59XHJcbkRpc3RhbmNlQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShCYXNlQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlKTtcclxuRGlzdGFuY2VBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBEaXN0YW5jZUFuaW1hdGlvbk1hdGVyaWFsO1xyXG5cclxuRGlzdGFuY2VBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uY2F0VmVydGV4U2hhZGVyID0gZnVuY3Rpb24gKCkge1xyXG4gIHJldHVybiBgXHJcbiAgI2RlZmluZSBESVNUQU5DRVxyXG5cclxuICB2YXJ5aW5nIHZlYzMgdldvcmxkUG9zaXRpb247XHJcbiAgXHJcbiAgI2luY2x1ZGUgPGNvbW1vbj5cclxuICAjaW5jbHVkZSA8dXZfcGFyc192ZXJ0ZXg+XHJcbiAgI2luY2x1ZGUgPGRpc3BsYWNlbWVudG1hcF9wYXJzX3ZlcnRleD5cclxuICAjaW5jbHVkZSA8bW9ycGh0YXJnZXRfcGFyc192ZXJ0ZXg+XHJcbiAgI2luY2x1ZGUgPHNraW5uaW5nX3BhcnNfdmVydGV4PlxyXG4gICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfcGFyc192ZXJ0ZXg+XHJcbiAgXHJcbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQYXJhbWV0ZXJzJyl9XHJcbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhGdW5jdGlvbnMnKX1cclxuICBcclxuICB2b2lkIG1haW4oKSB7XHJcblxyXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhJbml0Jyl9XHJcbiAgXHJcbiAgICAjaW5jbHVkZSA8dXZfdmVydGV4PlxyXG4gIFxyXG4gICAgI2luY2x1ZGUgPHNraW5iYXNlX3ZlcnRleD5cclxuICBcclxuICAgICNpZmRlZiBVU0VfRElTUExBQ0VNRU5UTUFQXHJcbiAgXHJcbiAgICAgICNpbmNsdWRlIDxiZWdpbm5vcm1hbF92ZXJ0ZXg+XHJcbiAgICAgICNpbmNsdWRlIDxtb3JwaG5vcm1hbF92ZXJ0ZXg+XHJcbiAgICAgICNpbmNsdWRlIDxza2lubm9ybWFsX3ZlcnRleD5cclxuICBcclxuICAgICNlbmRpZlxyXG4gIFxyXG4gICAgI2luY2x1ZGUgPGJlZ2luX3ZlcnRleD5cclxuICAgIFxyXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQb3NpdGlvbicpfVxyXG5cclxuICAgICNpbmNsdWRlIDxtb3JwaHRhcmdldF92ZXJ0ZXg+XHJcbiAgICBcclxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UG9zdE1vcnBoJyl9XHJcbiAgICBcclxuICAgICNpbmNsdWRlIDxza2lubmluZ192ZXJ0ZXg+XHJcblxyXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQb3N0U2tpbm5pbmcnKX1cclxuICAgIFxyXG4gICAgI2luY2x1ZGUgPGRpc3BsYWNlbWVudG1hcF92ZXJ0ZXg+XHJcbiAgICAjaW5jbHVkZSA8cHJvamVjdF92ZXJ0ZXg+XHJcbiAgICAjaW5jbHVkZSA8d29ybGRwb3NfdmVydGV4PlxyXG4gICAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc192ZXJ0ZXg+XHJcbiAgXHJcbiAgICB2V29ybGRQb3NpdGlvbiA9IHdvcmxkUG9zaXRpb24ueHl6O1xyXG4gIFxyXG4gIH1gO1xyXG59O1xyXG5cclxuZXhwb3J0IHsgRGlzdGFuY2VBbmltYXRpb25NYXRlcmlhbCB9O1xyXG4iLCJpbXBvcnQgeyBCdWZmZXJHZW9tZXRyeSwgQnVmZmVyQXR0cmlidXRlLCBWZWN0b3IyIH0gZnJvbSAndGhyZWUnO1xyXG4vKipcclxuICogQSBCdWZmZXJHZW9tZXRyeSB3aGVyZSBhICdwcmVmYWInIGdlb21ldHJ5IGlzIHJlcGVhdGVkIGEgbnVtYmVyIG9mIHRpbWVzLlxyXG4gKlxyXG4gKiBAcGFyYW0ge0dlb21ldHJ5fEJ1ZmZlckdlb21ldHJ5fSBwcmVmYWIgVGhlIEdlb21ldHJ5IGluc3RhbmNlIHRvIHJlcGVhdC5cclxuICogQHBhcmFtIHtOdW1iZXJ9IGNvdW50IFRoZSBudW1iZXIgb2YgdGltZXMgdG8gcmVwZWF0IHRoZSBnZW9tZXRyeS5cclxuICogQGNvbnN0cnVjdG9yXHJcbiAqL1xyXG5mdW5jdGlvbiBQcmVmYWJCdWZmZXJHZW9tZXRyeShwcmVmYWIsIGNvdW50KSB7XHJcbiAgQnVmZmVyR2VvbWV0cnkuY2FsbCh0aGlzKTtcclxuICBcclxuICAvKipcclxuICAgKiBBIHJlZmVyZW5jZSB0byB0aGUgcHJlZmFiIGdlb21ldHJ5IHVzZWQgdG8gY3JlYXRlIHRoaXMgaW5zdGFuY2UuXHJcbiAgICogQHR5cGUge0dlb21ldHJ5fEJ1ZmZlckdlb21ldHJ5fVxyXG4gICAqL1xyXG4gIHRoaXMucHJlZmFiR2VvbWV0cnkgPSBwcmVmYWI7XHJcbiAgdGhpcy5pc1ByZWZhYkJ1ZmZlckdlb21ldHJ5ID0gcHJlZmFiLmlzQnVmZmVyR2VvbWV0cnk7XHJcbiAgXHJcbiAgLyoqXHJcbiAgICogTnVtYmVyIG9mIHByZWZhYnMuXHJcbiAgICogQHR5cGUge051bWJlcn1cclxuICAgKi9cclxuICB0aGlzLnByZWZhYkNvdW50ID0gY291bnQ7XHJcbiAgXHJcbiAgLyoqXHJcbiAgICogTnVtYmVyIG9mIHZlcnRpY2VzIG9mIHRoZSBwcmVmYWIuXHJcbiAgICogQHR5cGUge051bWJlcn1cclxuICAgKi9cclxuICBpZiAodGhpcy5pc1ByZWZhYkJ1ZmZlckdlb21ldHJ5KSB7XHJcbiAgICB0aGlzLnByZWZhYlZlcnRleENvdW50ID0gcHJlZmFiLmF0dHJpYnV0ZXMucG9zaXRpb24uY291bnQ7XHJcbiAgfVxyXG4gIGVsc2Uge1xyXG4gICAgdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudCA9IHByZWZhYi52ZXJ0aWNlcy5sZW5ndGg7XHJcbiAgfVxyXG5cclxuICB0aGlzLmJ1ZmZlckluZGljZXMoKTtcclxuICB0aGlzLmJ1ZmZlclBvc2l0aW9ucygpO1xyXG59XHJcblByZWZhYkJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlKTtcclxuUHJlZmFiQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gUHJlZmFiQnVmZmVyR2VvbWV0cnk7XHJcblxyXG5QcmVmYWJCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuYnVmZmVySW5kaWNlcyA9IGZ1bmN0aW9uKCkge1xyXG4gIGxldCBwcmVmYWJJbmRpY2VzID0gW107XHJcbiAgbGV0IHByZWZhYkluZGV4Q291bnQ7XHJcblxyXG4gIGlmICh0aGlzLmlzUHJlZmFiQnVmZmVyR2VvbWV0cnkpIHtcclxuICAgIGlmICh0aGlzLnByZWZhYkdlb21ldHJ5LmluZGV4KSB7XHJcbiAgICAgIHByZWZhYkluZGV4Q291bnQgPSB0aGlzLnByZWZhYkdlb21ldHJ5LmluZGV4LmNvdW50O1xyXG4gICAgICBwcmVmYWJJbmRpY2VzID0gdGhpcy5wcmVmYWJHZW9tZXRyeS5pbmRleC5hcnJheTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICBwcmVmYWJJbmRleENvdW50ID0gdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudDtcclxuXHJcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHJlZmFiSW5kZXhDb3VudDsgaSsrKSB7XHJcbiAgICAgICAgcHJlZmFiSW5kaWNlcy5wdXNoKGkpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG4gIGVsc2Uge1xyXG4gICAgY29uc3QgcHJlZmFiRmFjZUNvdW50ID0gdGhpcy5wcmVmYWJHZW9tZXRyeS5mYWNlcy5sZW5ndGg7XHJcbiAgICBwcmVmYWJJbmRleENvdW50ID0gcHJlZmFiRmFjZUNvdW50ICogMztcclxuXHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHByZWZhYkZhY2VDb3VudDsgaSsrKSB7XHJcbiAgICAgIGNvbnN0IGZhY2UgPSB0aGlzLnByZWZhYkdlb21ldHJ5LmZhY2VzW2ldO1xyXG4gICAgICBwcmVmYWJJbmRpY2VzLnB1c2goZmFjZS5hLCBmYWNlLmIsIGZhY2UuYyk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBjb25zdCBpbmRleEJ1ZmZlciA9IG5ldyBVaW50MzJBcnJheSh0aGlzLnByZWZhYkNvdW50ICogcHJlZmFiSW5kZXhDb3VudCk7XHJcblxyXG4gIHRoaXMuc2V0SW5kZXgobmV3IEJ1ZmZlckF0dHJpYnV0ZShpbmRleEJ1ZmZlciwgMSkpO1xyXG4gIFxyXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5wcmVmYWJDb3VudDsgaSsrKSB7XHJcbiAgICBmb3IgKGxldCBrID0gMDsgayA8IHByZWZhYkluZGV4Q291bnQ7IGsrKykge1xyXG4gICAgICBpbmRleEJ1ZmZlcltpICogcHJlZmFiSW5kZXhDb3VudCArIGtdID0gcHJlZmFiSW5kaWNlc1trXSArIGkgKiB0aGlzLnByZWZhYlZlcnRleENvdW50O1xyXG4gICAgfVxyXG4gIH1cclxufTtcclxuXHJcblByZWZhYkJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5idWZmZXJQb3NpdGlvbnMgPSBmdW5jdGlvbigpIHtcclxuICBjb25zdCBwb3NpdGlvbkJ1ZmZlciA9IHRoaXMuY3JlYXRlQXR0cmlidXRlKCdwb3NpdGlvbicsIDMpLmFycmF5O1xyXG5cclxuICBpZiAodGhpcy5pc1ByZWZhYkJ1ZmZlckdlb21ldHJ5KSB7XHJcbiAgICBjb25zdCBwb3NpdGlvbnMgPSB0aGlzLnByZWZhYkdlb21ldHJ5LmF0dHJpYnV0ZXMucG9zaXRpb24uYXJyYXk7XHJcblxyXG4gICAgZm9yIChsZXQgaSA9IDAsIG9mZnNldCA9IDA7IGkgPCB0aGlzLnByZWZhYkNvdW50OyBpKyspIHtcclxuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCB0aGlzLnByZWZhYlZlcnRleENvdW50OyBqKyssIG9mZnNldCArPSAzKSB7XHJcbiAgICAgICAgcG9zaXRpb25CdWZmZXJbb2Zmc2V0ICAgIF0gPSBwb3NpdGlvbnNbaiAqIDNdO1xyXG4gICAgICAgIHBvc2l0aW9uQnVmZmVyW29mZnNldCArIDFdID0gcG9zaXRpb25zW2ogKiAzICsgMV07XHJcbiAgICAgICAgcG9zaXRpb25CdWZmZXJbb2Zmc2V0ICsgMl0gPSBwb3NpdGlvbnNbaiAqIDMgKyAyXTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuICBlbHNlIHtcclxuICAgIGZvciAobGV0IGkgPSAwLCBvZmZzZXQgPSAwOyBpIDwgdGhpcy5wcmVmYWJDb3VudDsgaSsrKSB7XHJcbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudDsgaisrLCBvZmZzZXQgKz0gMykge1xyXG4gICAgICAgIGNvbnN0IHByZWZhYlZlcnRleCA9IHRoaXMucHJlZmFiR2VvbWV0cnkudmVydGljZXNbal07XHJcblxyXG4gICAgICAgIHBvc2l0aW9uQnVmZmVyW29mZnNldCAgICBdID0gcHJlZmFiVmVydGV4Lng7XHJcbiAgICAgICAgcG9zaXRpb25CdWZmZXJbb2Zmc2V0ICsgMV0gPSBwcmVmYWJWZXJ0ZXgueTtcclxuICAgICAgICBwb3NpdGlvbkJ1ZmZlcltvZmZzZXQgKyAyXSA9IHByZWZhYlZlcnRleC56O1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgYSBCdWZmZXJBdHRyaWJ1dGUgd2l0aCBVViBjb29yZGluYXRlcy5cclxuICovXHJcblByZWZhYkJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5idWZmZXJVdnMgPSBmdW5jdGlvbigpIHtcclxuICBjb25zdCBwcmVmYWJVdnMgPSBbXTtcclxuXHJcbiAgaWYgKHRoaXMuaXNQcmVmYWJCdWZmZXJHZW9tZXRyeSkge1xyXG4gICAgY29uc3QgdXYgPSB0aGlzLnByZWZhYkdlb21ldHJ5LmF0dHJpYnV0ZXMudXYuYXJyYXk7XHJcblxyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnByZWZhYlZlcnRleENvdW50OyBpKyspIHtcclxuICAgICAgcHJlZmFiVXZzLnB1c2gobmV3IFZlY3RvcjIodXZbaSAqIDJdLCB1dltpICogMiArIDFdKSk7XHJcbiAgICB9XHJcbiAgfVxyXG4gIGVsc2Uge1xyXG4gICAgY29uc3QgcHJlZmFiRmFjZUNvdW50ID0gdGhpcy5wcmVmYWJHZW9tZXRyeS5mYWNlcy5sZW5ndGg7XHJcblxyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcmVmYWJGYWNlQ291bnQ7IGkrKykge1xyXG4gICAgICBjb25zdCBmYWNlID0gdGhpcy5wcmVmYWJHZW9tZXRyeS5mYWNlc1tpXTtcclxuICAgICAgY29uc3QgdXYgPSB0aGlzLnByZWZhYkdlb21ldHJ5LmZhY2VWZXJ0ZXhVdnNbMF1baV07XHJcblxyXG4gICAgICBwcmVmYWJVdnNbZmFjZS5hXSA9IHV2WzBdO1xyXG4gICAgICBwcmVmYWJVdnNbZmFjZS5iXSA9IHV2WzFdO1xyXG4gICAgICBwcmVmYWJVdnNbZmFjZS5jXSA9IHV2WzJdO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgY29uc3QgdXZCdWZmZXIgPSB0aGlzLmNyZWF0ZUF0dHJpYnV0ZSgndXYnLCAyKTtcclxuICBcclxuICBmb3IgKGxldCBpID0gMCwgb2Zmc2V0ID0gMDsgaSA8IHRoaXMucHJlZmFiQ291bnQ7IGkrKykge1xyXG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCB0aGlzLnByZWZhYlZlcnRleENvdW50OyBqKyssIG9mZnNldCArPSAyKSB7XHJcbiAgICAgIGxldCBwcmVmYWJVdiA9IHByZWZhYlV2c1tqXTtcclxuICAgICAgXHJcbiAgICAgIHV2QnVmZmVyLmFycmF5W29mZnNldF0gPSBwcmVmYWJVdi54O1xyXG4gICAgICB1dkJ1ZmZlci5hcnJheVtvZmZzZXQgKyAxXSA9IHByZWZhYlV2Lnk7XHJcbiAgICB9XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgYSBCdWZmZXJBdHRyaWJ1dGUgb24gdGhpcyBnZW9tZXRyeSBpbnN0YW5jZS5cclxuICpcclxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgTmFtZSBvZiB0aGUgYXR0cmlidXRlLlxyXG4gKiBAcGFyYW0ge051bWJlcn0gaXRlbVNpemUgTnVtYmVyIG9mIGZsb2F0cyBwZXIgdmVydGV4ICh0eXBpY2FsbHkgMSwgMiwgMyBvciA0KS5cclxuICogQHBhcmFtIHtmdW5jdGlvbj19IGZhY3RvcnkgRnVuY3Rpb24gdGhhdCB3aWxsIGJlIGNhbGxlZCBmb3IgZWFjaCBwcmVmYWIgdXBvbiBjcmVhdGlvbi4gQWNjZXB0cyAzIGFyZ3VtZW50czogZGF0YVtdLCBpbmRleCBhbmQgcHJlZmFiQ291bnQuIENhbGxzIHNldFByZWZhYkRhdGEuXHJcbiAqXHJcbiAqIEByZXR1cm5zIHtCdWZmZXJBdHRyaWJ1dGV9XHJcbiAqL1xyXG5QcmVmYWJCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuY3JlYXRlQXR0cmlidXRlID0gZnVuY3Rpb24obmFtZSwgaXRlbVNpemUsIGZhY3RvcnkpIHtcclxuICBjb25zdCBidWZmZXIgPSBuZXcgRmxvYXQzMkFycmF5KHRoaXMucHJlZmFiQ291bnQgKiB0aGlzLnByZWZhYlZlcnRleENvdW50ICogaXRlbVNpemUpO1xyXG4gIGNvbnN0IGF0dHJpYnV0ZSA9IG5ldyBCdWZmZXJBdHRyaWJ1dGUoYnVmZmVyLCBpdGVtU2l6ZSk7XHJcbiAgXHJcbiAgdGhpcy5hZGRBdHRyaWJ1dGUobmFtZSwgYXR0cmlidXRlKTtcclxuICBcclxuICBpZiAoZmFjdG9yeSkge1xyXG4gICAgY29uc3QgZGF0YSA9IFtdO1xyXG4gICAgXHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucHJlZmFiQ291bnQ7IGkrKykge1xyXG4gICAgICBmYWN0b3J5KGRhdGEsIGksIHRoaXMucHJlZmFiQ291bnQpO1xyXG4gICAgICB0aGlzLnNldFByZWZhYkRhdGEoYXR0cmlidXRlLCBpLCBkYXRhKTtcclxuICAgIH1cclxuICB9XHJcbiAgXHJcbiAgcmV0dXJuIGF0dHJpYnV0ZTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBTZXRzIGRhdGEgZm9yIGFsbCB2ZXJ0aWNlcyBvZiBhIHByZWZhYiBhdCBhIGdpdmVuIGluZGV4LlxyXG4gKiBVc3VhbGx5IGNhbGxlZCBpbiBhIGxvb3AuXHJcbiAqXHJcbiAqIEBwYXJhbSB7U3RyaW5nfEJ1ZmZlckF0dHJpYnV0ZX0gYXR0cmlidXRlIFRoZSBhdHRyaWJ1dGUgb3IgYXR0cmlidXRlIG5hbWUgd2hlcmUgdGhlIGRhdGEgaXMgdG8gYmUgc3RvcmVkLlxyXG4gKiBAcGFyYW0ge051bWJlcn0gcHJlZmFiSW5kZXggSW5kZXggb2YgdGhlIHByZWZhYiBpbiB0aGUgYnVmZmVyIGdlb21ldHJ5LlxyXG4gKiBAcGFyYW0ge0FycmF5fSBkYXRhIEFycmF5IG9mIGRhdGEuIExlbmd0aCBzaG91bGQgYmUgZXF1YWwgdG8gaXRlbSBzaXplIG9mIHRoZSBhdHRyaWJ1dGUuXHJcbiAqL1xyXG5QcmVmYWJCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuc2V0UHJlZmFiRGF0YSA9IGZ1bmN0aW9uKGF0dHJpYnV0ZSwgcHJlZmFiSW5kZXgsIGRhdGEpIHtcclxuICBhdHRyaWJ1dGUgPSAodHlwZW9mIGF0dHJpYnV0ZSA9PT0gJ3N0cmluZycpID8gdGhpcy5hdHRyaWJ1dGVzW2F0dHJpYnV0ZV0gOiBhdHRyaWJ1dGU7XHJcbiAgXHJcbiAgbGV0IG9mZnNldCA9IHByZWZhYkluZGV4ICogdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudCAqIGF0dHJpYnV0ZS5pdGVtU2l6ZTtcclxuICBcclxuICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucHJlZmFiVmVydGV4Q291bnQ7IGkrKykge1xyXG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCBhdHRyaWJ1dGUuaXRlbVNpemU7IGorKykge1xyXG4gICAgICBhdHRyaWJ1dGUuYXJyYXlbb2Zmc2V0KytdID0gZGF0YVtqXTtcclxuICAgIH1cclxuICB9XHJcbn07XHJcblxyXG5leHBvcnQgeyBQcmVmYWJCdWZmZXJHZW9tZXRyeSB9O1xyXG4iLCJpbXBvcnQgeyBCdWZmZXJHZW9tZXRyeSwgQnVmZmVyQXR0cmlidXRlIH0gZnJvbSAndGhyZWUnO1xyXG4vKipcclxuICogQSBCdWZmZXJHZW9tZXRyeSB3aGVyZSBhICdwcmVmYWInIGdlb21ldHJ5IGFycmF5IGlzIHJlcGVhdGVkIGEgbnVtYmVyIG9mIHRpbWVzLlxyXG4gKlxyXG4gKiBAcGFyYW0ge0FycmF5fSBwcmVmYWJzIEFuIGFycmF5IHdpdGggR2VvbWV0cnkgaW5zdGFuY2VzIHRvIHJlcGVhdC5cclxuICogQHBhcmFtIHtOdW1iZXJ9IHJlcGVhdENvdW50IFRoZSBudW1iZXIgb2YgdGltZXMgdG8gcmVwZWF0IHRoZSBhcnJheSBvZiBHZW9tZXRyaWVzLlxyXG4gKiBAY29uc3RydWN0b3JcclxuICovXHJcbmZ1bmN0aW9uIE11bHRpUHJlZmFiQnVmZmVyR2VvbWV0cnkocHJlZmFicywgcmVwZWF0Q291bnQpIHtcclxuICBCdWZmZXJHZW9tZXRyeS5jYWxsKHRoaXMpO1xyXG5cclxuICBpZiAoQXJyYXkuaXNBcnJheShwcmVmYWJzKSkge1xyXG4gICAgdGhpcy5wcmVmYWJHZW9tZXRyaWVzID0gcHJlZmFicztcclxuICB9IGVsc2Uge1xyXG4gICAgdGhpcy5wcmVmYWJHZW9tZXRyaWVzID0gW3ByZWZhYnNdO1xyXG4gIH1cclxuXHJcbiAgdGhpcy5wcmVmYWJHZW9tZXRyaWVzQ291bnQgPSB0aGlzLnByZWZhYkdlb21ldHJpZXMubGVuZ3RoO1xyXG5cclxuICAvKipcclxuICAgKiBOdW1iZXIgb2YgcHJlZmFicy5cclxuICAgKiBAdHlwZSB7TnVtYmVyfVxyXG4gICAqL1xyXG4gIHRoaXMucHJlZmFiQ291bnQgPSByZXBlYXRDb3VudCAqIHRoaXMucHJlZmFiR2VvbWV0cmllc0NvdW50O1xyXG4gIC8qKlxyXG4gICAqIEhvdyBvZnRlbiB0aGUgcHJlZmFiIGFycmF5IGlzIHJlcGVhdGVkLlxyXG4gICAqIEB0eXBlIHtOdW1iZXJ9XHJcbiAgICovXHJcbiAgdGhpcy5yZXBlYXRDb3VudCA9IHJlcGVhdENvdW50O1xyXG4gIFxyXG4gIC8qKlxyXG4gICAqIEFycmF5IG9mIHZlcnRleCBjb3VudHMgcGVyIHByZWZhYi5cclxuICAgKiBAdHlwZSB7QXJyYXl9XHJcbiAgICovXHJcbiAgdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudHMgPSB0aGlzLnByZWZhYkdlb21ldHJpZXMubWFwKHAgPT4gcC5pc0J1ZmZlckdlb21ldHJ5ID8gcC5hdHRyaWJ1dGVzLnBvc2l0aW9uLmNvdW50IDogcC52ZXJ0aWNlcy5sZW5ndGgpO1xyXG4gIC8qKlxyXG4gICAqIFRvdGFsIG51bWJlciBvZiB2ZXJ0aWNlcyBmb3Igb25lIHJlcGV0aXRpb24gb2YgdGhlIHByZWZhYnNcclxuICAgKiBAdHlwZSB7bnVtYmVyfVxyXG4gICAqL1xyXG4gIHRoaXMucmVwZWF0VmVydGV4Q291bnQgPSB0aGlzLnByZWZhYlZlcnRleENvdW50cy5yZWR1Y2UoKHIsIHYpID0+IHIgKyB2LCAwKTtcclxuXHJcbiAgdGhpcy5idWZmZXJJbmRpY2VzKCk7XHJcbiAgdGhpcy5idWZmZXJQb3NpdGlvbnMoKTtcclxufVxyXG5NdWx0aVByZWZhYkJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlKTtcclxuTXVsdGlQcmVmYWJCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBNdWx0aVByZWZhYkJ1ZmZlckdlb21ldHJ5O1xyXG5cclxuTXVsdGlQcmVmYWJCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuYnVmZmVySW5kaWNlcyA9IGZ1bmN0aW9uKCkge1xyXG4gIGxldCByZXBlYXRJbmRleENvdW50ID0gMDtcclxuXHJcbiAgdGhpcy5wcmVmYWJJbmRpY2VzID0gdGhpcy5wcmVmYWJHZW9tZXRyaWVzLm1hcChnZW9tZXRyeSA9PiB7XHJcbiAgICBsZXQgaW5kaWNlcyA9IFtdO1xyXG5cclxuICAgIGlmIChnZW9tZXRyeS5pc0J1ZmZlckdlb21ldHJ5KSB7XHJcbiAgICAgIGlmIChnZW9tZXRyeS5pbmRleCkge1xyXG4gICAgICAgIGluZGljZXMgPSBnZW9tZXRyeS5pbmRleC5hcnJheTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGdlb21ldHJ5LmF0dHJpYnV0ZXMucG9zaXRpb24uY291bnQ7IGkrKykge1xyXG4gICAgICAgICAgaW5kaWNlcy5wdXNoKGkpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBnZW9tZXRyeS5mYWNlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIGNvbnN0IGZhY2UgPSBnZW9tZXRyeS5mYWNlc1tpXTtcclxuICAgICAgICBpbmRpY2VzLnB1c2goZmFjZS5hLCBmYWNlLmIsIGZhY2UuYyk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXBlYXRJbmRleENvdW50ICs9IGluZGljZXMubGVuZ3RoO1xyXG5cclxuICAgIHJldHVybiBpbmRpY2VzO1xyXG4gIH0pO1xyXG5cclxuICBjb25zdCBpbmRleEJ1ZmZlciA9IG5ldyBVaW50MzJBcnJheShyZXBlYXRJbmRleENvdW50ICogdGhpcy5yZXBlYXRDb3VudCk7XHJcbiAgbGV0IGluZGV4T2Zmc2V0ID0gMDtcclxuICBsZXQgcHJlZmFiT2Zmc2V0ID0gMDtcclxuXHJcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnByZWZhYkNvdW50OyBpKyspIHtcclxuICAgIGNvbnN0IGluZGV4ID0gaSAlIHRoaXMucHJlZmFiR2VvbWV0cmllc0NvdW50O1xyXG4gICAgY29uc3QgaW5kaWNlcyA9IHRoaXMucHJlZmFiSW5kaWNlc1tpbmRleF07XHJcbiAgICBjb25zdCB2ZXJ0ZXhDb3VudCA9IHRoaXMucHJlZmFiVmVydGV4Q291bnRzW2luZGV4XTtcclxuXHJcbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IGluZGljZXMubGVuZ3RoOyBqKyspIHtcclxuICAgICAgaW5kZXhCdWZmZXJbaW5kZXhPZmZzZXQrK10gPSBpbmRpY2VzW2pdICsgcHJlZmFiT2Zmc2V0O1xyXG4gICAgfVxyXG5cclxuICAgIHByZWZhYk9mZnNldCArPSB2ZXJ0ZXhDb3VudDtcclxuICB9XHJcblxyXG4gIHRoaXMuc2V0SW5kZXgobmV3IEJ1ZmZlckF0dHJpYnV0ZShpbmRleEJ1ZmZlciwgMSkpO1xyXG59O1xyXG5cclxuTXVsdGlQcmVmYWJCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuYnVmZmVyUG9zaXRpb25zID0gZnVuY3Rpb24oKSB7XHJcbiAgY29uc3QgcG9zaXRpb25CdWZmZXIgPSB0aGlzLmNyZWF0ZUF0dHJpYnV0ZSgncG9zaXRpb24nLCAzKS5hcnJheTtcclxuXHJcbiAgY29uc3QgcHJlZmFiUG9zaXRpb25zID0gdGhpcy5wcmVmYWJHZW9tZXRyaWVzLm1hcCgoZ2VvbWV0cnksIGkpID0+IHtcclxuICAgIGxldCBwb3NpdGlvbnM7XHJcblxyXG4gICAgaWYgKGdlb21ldHJ5LmlzQnVmZmVyR2VvbWV0cnkpIHtcclxuICAgICAgcG9zaXRpb25zID0gZ2VvbWV0cnkuYXR0cmlidXRlcy5wb3NpdGlvbi5hcnJheTtcclxuICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICBjb25zdCB2ZXJ0ZXhDb3VudCA9IHRoaXMucHJlZmFiVmVydGV4Q291bnRzW2ldO1xyXG5cclxuICAgICAgcG9zaXRpb25zID0gW107XHJcblxyXG4gICAgICBmb3IgKGxldCBqID0gMCwgb2Zmc2V0ID0gMDsgaiA8IHZlcnRleENvdW50OyBqKyspIHtcclxuICAgICAgICBjb25zdCBwcmVmYWJWZXJ0ZXggPSBnZW9tZXRyeS52ZXJ0aWNlc1tqXTtcclxuXHJcbiAgICAgICAgcG9zaXRpb25zW29mZnNldCsrXSA9IHByZWZhYlZlcnRleC54O1xyXG4gICAgICAgIHBvc2l0aW9uc1tvZmZzZXQrK10gPSBwcmVmYWJWZXJ0ZXgueTtcclxuICAgICAgICBwb3NpdGlvbnNbb2Zmc2V0KytdID0gcHJlZmFiVmVydGV4Lno7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcG9zaXRpb25zO1xyXG4gIH0pO1xyXG5cclxuICBmb3IgKGxldCBpID0gMCwgb2Zmc2V0ID0gMDsgaSA8IHRoaXMucHJlZmFiQ291bnQ7IGkrKykge1xyXG4gICAgY29uc3QgaW5kZXggPSBpICUgdGhpcy5wcmVmYWJHZW9tZXRyaWVzLmxlbmd0aDtcclxuICAgIGNvbnN0IHZlcnRleENvdW50ID0gdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudHNbaW5kZXhdO1xyXG4gICAgY29uc3QgcG9zaXRpb25zID0gcHJlZmFiUG9zaXRpb25zW2luZGV4XTtcclxuXHJcbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IHZlcnRleENvdW50OyBqKyspIHtcclxuICAgICAgcG9zaXRpb25CdWZmZXJbb2Zmc2V0KytdID0gcG9zaXRpb25zW2ogKiAzXTtcclxuICAgICAgcG9zaXRpb25CdWZmZXJbb2Zmc2V0KytdID0gcG9zaXRpb25zW2ogKiAzICsgMV07XHJcbiAgICAgIHBvc2l0aW9uQnVmZmVyW29mZnNldCsrXSA9IHBvc2l0aW9uc1tqICogMyArIDJdO1xyXG4gICAgfVxyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIGEgQnVmZmVyQXR0cmlidXRlIHdpdGggVVYgY29vcmRpbmF0ZXMuXHJcbiAqL1xyXG5NdWx0aVByZWZhYkJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5idWZmZXJVdnMgPSBmdW5jdGlvbigpIHtcclxuICBjb25zdCB1dkJ1ZmZlciA9IHRoaXMuY3JlYXRlQXR0cmlidXRlKCd1dicsIDIpLmFycmF5O1xyXG5cclxuICBjb25zdCBwcmVmYWJVdnMgPSB0aGlzLnByZWZhYkdlb21ldHJpZXMubWFwKChnZW9tZXRyeSwgaSkgPT4ge1xyXG4gICAgbGV0IHV2cztcclxuXHJcbiAgICBpZiAoZ2VvbWV0cnkuaXNCdWZmZXJHZW9tZXRyeSkge1xyXG4gICAgICBpZiAoIWdlb21ldHJ5LmF0dHJpYnV0ZXMudXYpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKCdObyBVViBmb3VuZCBpbiBwcmVmYWIgZ2VvbWV0cnknLCBnZW9tZXRyeSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHV2cyA9IGdlb21ldHJ5LmF0dHJpYnV0ZXMudXYuYXJyYXk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBjb25zdCBwcmVmYWJGYWNlQ291bnQgPSB0aGlzLnByZWZhYkluZGljZXNbaV0ubGVuZ3RoIC8gMztcclxuICAgICAgY29uc3QgdXZPYmplY3RzID0gW107XHJcblxyXG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHByZWZhYkZhY2VDb3VudDsgaisrKSB7XHJcbiAgICAgICAgY29uc3QgZmFjZSA9IGdlb21ldHJ5LmZhY2VzW2pdO1xyXG4gICAgICAgIGNvbnN0IHV2ID0gZ2VvbWV0cnkuZmFjZVZlcnRleFV2c1swXVtqXTtcclxuXHJcbiAgICAgICAgdXZPYmplY3RzW2ZhY2UuYV0gPSB1dlswXTtcclxuICAgICAgICB1dk9iamVjdHNbZmFjZS5iXSA9IHV2WzFdO1xyXG4gICAgICAgIHV2T2JqZWN0c1tmYWNlLmNdID0gdXZbMl07XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHV2cyA9IFtdO1xyXG5cclxuICAgICAgZm9yIChsZXQgayA9IDA7IGsgPCB1dk9iamVjdHMubGVuZ3RoOyBrKyspIHtcclxuICAgICAgICB1dnNbayAqIDJdID0gdXZPYmplY3RzW2tdLng7XHJcbiAgICAgICAgdXZzW2sgKiAyICsgMV0gPSB1dk9iamVjdHNba10ueTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB1dnM7XHJcbiAgfSk7XHJcblxyXG4gIGZvciAobGV0IGkgPSAwLCBvZmZzZXQgPSAwOyBpIDwgdGhpcy5wcmVmYWJDb3VudDsgaSsrKSB7XHJcblxyXG4gICAgY29uc3QgaW5kZXggPSBpICUgdGhpcy5wcmVmYWJHZW9tZXRyaWVzLmxlbmd0aDtcclxuICAgIGNvbnN0IHZlcnRleENvdW50ID0gdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudHNbaW5kZXhdO1xyXG4gICAgY29uc3QgdXZzID0gcHJlZmFiVXZzW2luZGV4XTtcclxuXHJcbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IHZlcnRleENvdW50OyBqKyspIHtcclxuICAgICAgdXZCdWZmZXJbb2Zmc2V0KytdID0gdXZzW2ogKiAyXTtcclxuICAgICAgdXZCdWZmZXJbb2Zmc2V0KytdID0gdXZzW2ogKiAyICsgMV07XHJcbiAgICB9XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgYSBCdWZmZXJBdHRyaWJ1dGUgb24gdGhpcyBnZW9tZXRyeSBpbnN0YW5jZS5cclxuICpcclxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgTmFtZSBvZiB0aGUgYXR0cmlidXRlLlxyXG4gKiBAcGFyYW0ge051bWJlcn0gaXRlbVNpemUgTnVtYmVyIG9mIGZsb2F0cyBwZXIgdmVydGV4ICh0eXBpY2FsbHkgMSwgMiwgMyBvciA0KS5cclxuICogQHBhcmFtIHtmdW5jdGlvbj19IGZhY3RvcnkgRnVuY3Rpb24gdGhhdCB3aWxsIGJlIGNhbGxlZCBmb3IgZWFjaCBwcmVmYWIgdXBvbiBjcmVhdGlvbi4gQWNjZXB0cyAzIGFyZ3VtZW50czogZGF0YVtdLCBpbmRleCBhbmQgcHJlZmFiQ291bnQuIENhbGxzIHNldFByZWZhYkRhdGEuXHJcbiAqXHJcbiAqIEByZXR1cm5zIHtCdWZmZXJBdHRyaWJ1dGV9XHJcbiAqL1xyXG5NdWx0aVByZWZhYkJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5jcmVhdGVBdHRyaWJ1dGUgPSBmdW5jdGlvbihuYW1lLCBpdGVtU2l6ZSwgZmFjdG9yeSkge1xyXG4gIGNvbnN0IGJ1ZmZlciA9IG5ldyBGbG9hdDMyQXJyYXkodGhpcy5yZXBlYXRDb3VudCAqIHRoaXMucmVwZWF0VmVydGV4Q291bnQgKiBpdGVtU2l6ZSk7XHJcbiAgY29uc3QgYXR0cmlidXRlID0gbmV3IEJ1ZmZlckF0dHJpYnV0ZShidWZmZXIsIGl0ZW1TaXplKTtcclxuICBcclxuICB0aGlzLmFkZEF0dHJpYnV0ZShuYW1lLCBhdHRyaWJ1dGUpO1xyXG4gIFxyXG4gIGlmIChmYWN0b3J5KSB7XHJcbiAgICBjb25zdCBkYXRhID0gW107XHJcbiAgICBcclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5wcmVmYWJDb3VudDsgaSsrKSB7XHJcbiAgICAgIGZhY3RvcnkoZGF0YSwgaSwgdGhpcy5wcmVmYWJDb3VudCk7XHJcbiAgICAgIHRoaXMuc2V0UHJlZmFiRGF0YShhdHRyaWJ1dGUsIGksIGRhdGEpO1xyXG4gICAgfVxyXG4gIH1cclxuICBcclxuICByZXR1cm4gYXR0cmlidXRlO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFNldHMgZGF0YSBmb3IgYWxsIHZlcnRpY2VzIG9mIGEgcHJlZmFiIGF0IGEgZ2l2ZW4gaW5kZXguXHJcbiAqIFVzdWFsbHkgY2FsbGVkIGluIGEgbG9vcC5cclxuICpcclxuICogQHBhcmFtIHtTdHJpbmd8QnVmZmVyQXR0cmlidXRlfSBhdHRyaWJ1dGUgVGhlIGF0dHJpYnV0ZSBvciBhdHRyaWJ1dGUgbmFtZSB3aGVyZSB0aGUgZGF0YSBpcyB0byBiZSBzdG9yZWQuXHJcbiAqIEBwYXJhbSB7TnVtYmVyfSBwcmVmYWJJbmRleCBJbmRleCBvZiB0aGUgcHJlZmFiIGluIHRoZSBidWZmZXIgZ2VvbWV0cnkuXHJcbiAqIEBwYXJhbSB7QXJyYXl9IGRhdGEgQXJyYXkgb2YgZGF0YS4gTGVuZ3RoIHNob3VsZCBiZSBlcXVhbCB0byBpdGVtIHNpemUgb2YgdGhlIGF0dHJpYnV0ZS5cclxuICovXHJcbk11bHRpUHJlZmFiQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLnNldFByZWZhYkRhdGEgPSBmdW5jdGlvbihhdHRyaWJ1dGUsIHByZWZhYkluZGV4LCBkYXRhKSB7XHJcbiAgYXR0cmlidXRlID0gKHR5cGVvZiBhdHRyaWJ1dGUgPT09ICdzdHJpbmcnKSA/IHRoaXMuYXR0cmlidXRlc1thdHRyaWJ1dGVdIDogYXR0cmlidXRlO1xyXG5cclxuICBjb25zdCBwcmVmYWJHZW9tZXRyeUluZGV4ID0gcHJlZmFiSW5kZXggJSB0aGlzLnByZWZhYkdlb21ldHJpZXNDb3VudDtcclxuICBjb25zdCBwcmVmYWJHZW9tZXRyeVZlcnRleENvdW50ID0gdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudHNbcHJlZmFiR2VvbWV0cnlJbmRleF07XHJcbiAgY29uc3Qgd2hvbGUgPSAocHJlZmFiSW5kZXggLyB0aGlzLnByZWZhYkdlb21ldHJpZXNDb3VudCB8IDApICogdGhpcy5wcmVmYWJHZW9tZXRyaWVzQ291bnQ7XHJcbiAgY29uc3Qgd2hvbGVPZmZzZXQgPSB3aG9sZSAqIHRoaXMucmVwZWF0VmVydGV4Q291bnQ7XHJcbiAgY29uc3QgcGFydCA9IHByZWZhYkluZGV4IC0gd2hvbGU7XHJcbiAgbGV0IHBhcnRPZmZzZXQgPSAwO1xyXG4gIGxldCBpID0gMDtcclxuXHJcbiAgd2hpbGUoaSA8IHBhcnQpIHtcclxuICAgIHBhcnRPZmZzZXQgKz0gdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudHNbaSsrXTtcclxuICB9XHJcblxyXG4gIGxldCBvZmZzZXQgPSAod2hvbGVPZmZzZXQgKyBwYXJ0T2Zmc2V0KSAqIGF0dHJpYnV0ZS5pdGVtU2l6ZTtcclxuXHJcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcmVmYWJHZW9tZXRyeVZlcnRleENvdW50OyBpKyspIHtcclxuICAgIGZvciAobGV0IGogPSAwOyBqIDwgYXR0cmlidXRlLml0ZW1TaXplOyBqKyspIHtcclxuICAgICAgYXR0cmlidXRlLmFycmF5W29mZnNldCsrXSA9IGRhdGFbal07XHJcbiAgICB9XHJcbiAgfVxyXG59O1xyXG5cclxuZXhwb3J0IHsgTXVsdGlQcmVmYWJCdWZmZXJHZW9tZXRyeSB9O1xyXG4iLCJpbXBvcnQgeyBNYXRoIGFzIHRNYXRoLCBWZWN0b3IzIH0gZnJvbSAndGhyZWUnO1xyXG5pbXBvcnQgeyBEZXB0aEFuaW1hdGlvbk1hdGVyaWFsIH0gZnJvbSAnLi9tYXRlcmlhbHMvRGVwdGhBbmltYXRpb25NYXRlcmlhbCc7XHJcbmltcG9ydCB7IERpc3RhbmNlQW5pbWF0aW9uTWF0ZXJpYWwgfSBmcm9tICcuL21hdGVyaWFscy9EaXN0YW5jZUFuaW1hdGlvbk1hdGVyaWFsJztcclxuXHJcbi8qKlxyXG4gKiBDb2xsZWN0aW9uIG9mIHV0aWxpdHkgZnVuY3Rpb25zLlxyXG4gKiBAbmFtZXNwYWNlXHJcbiAqL1xyXG5jb25zdCBVdGlscyA9IHtcclxuICAvKipcclxuICAgKiBEdXBsaWNhdGVzIHZlcnRpY2VzIHNvIGVhY2ggZmFjZSBiZWNvbWVzIHNlcGFyYXRlLlxyXG4gICAqIFNhbWUgYXMgVEhSRUUuRXhwbG9kZU1vZGlmaWVyLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtUSFJFRS5HZW9tZXRyeX0gZ2VvbWV0cnkgR2VvbWV0cnkgaW5zdGFuY2UgdG8gbW9kaWZ5LlxyXG4gICAqL1xyXG4gIHNlcGFyYXRlRmFjZXM6IGZ1bmN0aW9uIChnZW9tZXRyeSkge1xyXG4gICAgbGV0IHZlcnRpY2VzID0gW107XHJcblxyXG4gICAgZm9yIChsZXQgaSA9IDAsIGlsID0gZ2VvbWV0cnkuZmFjZXMubGVuZ3RoOyBpIDwgaWw7IGkrKykge1xyXG4gICAgICBsZXQgbiA9IHZlcnRpY2VzLmxlbmd0aDtcclxuICAgICAgbGV0IGZhY2UgPSBnZW9tZXRyeS5mYWNlc1tpXTtcclxuXHJcbiAgICAgIGxldCBhID0gZmFjZS5hO1xyXG4gICAgICBsZXQgYiA9IGZhY2UuYjtcclxuICAgICAgbGV0IGMgPSBmYWNlLmM7XHJcblxyXG4gICAgICBsZXQgdmEgPSBnZW9tZXRyeS52ZXJ0aWNlc1thXTtcclxuICAgICAgbGV0IHZiID0gZ2VvbWV0cnkudmVydGljZXNbYl07XHJcbiAgICAgIGxldCB2YyA9IGdlb21ldHJ5LnZlcnRpY2VzW2NdO1xyXG5cclxuICAgICAgdmVydGljZXMucHVzaCh2YS5jbG9uZSgpKTtcclxuICAgICAgdmVydGljZXMucHVzaCh2Yi5jbG9uZSgpKTtcclxuICAgICAgdmVydGljZXMucHVzaCh2Yy5jbG9uZSgpKTtcclxuXHJcbiAgICAgIGZhY2UuYSA9IG47XHJcbiAgICAgIGZhY2UuYiA9IG4gKyAxO1xyXG4gICAgICBmYWNlLmMgPSBuICsgMjtcclxuICAgIH1cclxuXHJcbiAgICBnZW9tZXRyeS52ZXJ0aWNlcyA9IHZlcnRpY2VzO1xyXG4gIH0sXHJcblxyXG4gIC8qKlxyXG4gICAqIENvbXB1dGUgdGhlIGNlbnRyb2lkIChjZW50ZXIpIG9mIGEgVEhSRUUuRmFjZTMuXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge1RIUkVFLkdlb21ldHJ5fSBnZW9tZXRyeSBHZW9tZXRyeSBpbnN0YW5jZSB0aGUgZmFjZSBpcyBpbi5cclxuICAgKiBAcGFyYW0ge1RIUkVFLkZhY2UzfSBmYWNlIEZhY2Ugb2JqZWN0IGZyb20gdGhlIFRIUkVFLkdlb21ldHJ5LmZhY2VzIGFycmF5XHJcbiAgICogQHBhcmFtIHtUSFJFRS5WZWN0b3IzPX0gdiBPcHRpb25hbCB2ZWN0b3IgdG8gc3RvcmUgcmVzdWx0IGluLlxyXG4gICAqIEByZXR1cm5zIHtUSFJFRS5WZWN0b3IzfVxyXG4gICAqL1xyXG4gIGNvbXB1dGVDZW50cm9pZDogZnVuY3Rpb24oZ2VvbWV0cnksIGZhY2UsIHYpIHtcclxuICAgIGxldCBhID0gZ2VvbWV0cnkudmVydGljZXNbZmFjZS5hXTtcclxuICAgIGxldCBiID0gZ2VvbWV0cnkudmVydGljZXNbZmFjZS5iXTtcclxuICAgIGxldCBjID0gZ2VvbWV0cnkudmVydGljZXNbZmFjZS5jXTtcclxuXHJcbiAgICB2ID0gdiB8fCBuZXcgVmVjdG9yMygpO1xyXG5cclxuICAgIHYueCA9IChhLnggKyBiLnggKyBjLngpIC8gMztcclxuICAgIHYueSA9IChhLnkgKyBiLnkgKyBjLnkpIC8gMztcclxuICAgIHYueiA9IChhLnogKyBiLnogKyBjLnopIC8gMztcclxuXHJcbiAgICByZXR1cm4gdjtcclxuICB9LFxyXG5cclxuICAvKipcclxuICAgKiBHZXQgYSByYW5kb20gdmVjdG9yIGJldHdlZW4gYm94Lm1pbiBhbmQgYm94Lm1heC5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7VEhSRUUuQm94M30gYm94IFRIUkVFLkJveDMgaW5zdGFuY2UuXHJcbiAgICogQHBhcmFtIHtUSFJFRS5WZWN0b3IzPX0gdiBPcHRpb25hbCB2ZWN0b3IgdG8gc3RvcmUgcmVzdWx0IGluLlxyXG4gICAqIEByZXR1cm5zIHtUSFJFRS5WZWN0b3IzfVxyXG4gICAqL1xyXG4gIHJhbmRvbUluQm94OiBmdW5jdGlvbihib3gsIHYpIHtcclxuICAgIHYgPSB2IHx8IG5ldyBWZWN0b3IzKCk7XHJcblxyXG4gICAgdi54ID0gdE1hdGgucmFuZEZsb2F0KGJveC5taW4ueCwgYm94Lm1heC54KTtcclxuICAgIHYueSA9IHRNYXRoLnJhbmRGbG9hdChib3gubWluLnksIGJveC5tYXgueSk7XHJcbiAgICB2LnogPSB0TWF0aC5yYW5kRmxvYXQoYm94Lm1pbi56LCBib3gubWF4LnopO1xyXG5cclxuICAgIHJldHVybiB2O1xyXG4gIH0sXHJcblxyXG4gIC8qKlxyXG4gICAqIEdldCBhIHJhbmRvbSBheGlzIGZvciBxdWF0ZXJuaW9uIHJvdGF0aW9uLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtUSFJFRS5WZWN0b3IzPX0gdiBPcHRpb24gdmVjdG9yIHRvIHN0b3JlIHJlc3VsdCBpbi5cclxuICAgKiBAcmV0dXJucyB7VEhSRUUuVmVjdG9yM31cclxuICAgKi9cclxuICByYW5kb21BeGlzOiBmdW5jdGlvbih2KSB7XHJcbiAgICB2ID0gdiB8fCBuZXcgVmVjdG9yMygpO1xyXG5cclxuICAgIHYueCA9IHRNYXRoLnJhbmRGbG9hdFNwcmVhZCgyLjApO1xyXG4gICAgdi55ID0gdE1hdGgucmFuZEZsb2F0U3ByZWFkKDIuMCk7XHJcbiAgICB2LnogPSB0TWF0aC5yYW5kRmxvYXRTcHJlYWQoMi4wKTtcclxuICAgIHYubm9ybWFsaXplKCk7XHJcblxyXG4gICAgcmV0dXJuIHY7XHJcbiAgfSxcclxuXHJcbiAgLyoqXHJcbiAgICogQ3JlYXRlIGEgVEhSRUUuQkFTLkRlcHRoQW5pbWF0aW9uTWF0ZXJpYWwgZm9yIHNoYWRvd3MgZnJvbSBhIFRIUkVFLlNwb3RMaWdodCBvciBUSFJFRS5EaXJlY3Rpb25hbExpZ2h0IGJ5IGNvcHlpbmcgcmVsZXZhbnQgc2hhZGVyIGNodW5rcy5cclxuICAgKiBVbmlmb3JtIHZhbHVlcyBtdXN0IGJlIG1hbnVhbGx5IHN5bmNlZCBiZXR3ZWVuIHRoZSBzb3VyY2UgbWF0ZXJpYWwgYW5kIHRoZSBkZXB0aCBtYXRlcmlhbC5cclxuICAgKlxyXG4gICAqIEBzZWUge0BsaW5rIGh0dHA6Ly90aHJlZS1iYXMtZXhhbXBsZXMuc3VyZ2Uuc2gvZXhhbXBsZXMvc2hhZG93cy99XHJcbiAgICpcclxuICAgKiBAcGFyYW0ge1RIUkVFLkJBUy5CYXNlQW5pbWF0aW9uTWF0ZXJpYWx9IHNvdXJjZU1hdGVyaWFsIEluc3RhbmNlIHRvIGdldCB0aGUgc2hhZGVyIGNodW5rcyBmcm9tLlxyXG4gICAqIEByZXR1cm5zIHtUSFJFRS5CQVMuRGVwdGhBbmltYXRpb25NYXRlcmlhbH1cclxuICAgKi9cclxuICBjcmVhdGVEZXB0aEFuaW1hdGlvbk1hdGVyaWFsOiBmdW5jdGlvbihzb3VyY2VNYXRlcmlhbCkge1xyXG4gICAgcmV0dXJuIG5ldyBEZXB0aEFuaW1hdGlvbk1hdGVyaWFsKHtcclxuICAgICAgdW5pZm9ybXM6IHNvdXJjZU1hdGVyaWFsLnVuaWZvcm1zLFxyXG4gICAgICBkZWZpbmVzOiBzb3VyY2VNYXRlcmlhbC5kZWZpbmVzLFxyXG4gICAgICB2ZXJ0ZXhGdW5jdGlvbnM6IHNvdXJjZU1hdGVyaWFsLnZlcnRleEZ1bmN0aW9ucyxcclxuICAgICAgdmVydGV4UGFyYW1ldGVyczogc291cmNlTWF0ZXJpYWwudmVydGV4UGFyYW1ldGVycyxcclxuICAgICAgdmVydGV4SW5pdDogc291cmNlTWF0ZXJpYWwudmVydGV4SW5pdCxcclxuICAgICAgdmVydGV4UG9zaXRpb246IHNvdXJjZU1hdGVyaWFsLnZlcnRleFBvc2l0aW9uXHJcbiAgICB9KTtcclxuICB9LFxyXG5cclxuICAvKipcclxuICAgKiBDcmVhdGUgYSBUSFJFRS5CQVMuRGlzdGFuY2VBbmltYXRpb25NYXRlcmlhbCBmb3Igc2hhZG93cyBmcm9tIGEgVEhSRUUuUG9pbnRMaWdodCBieSBjb3B5aW5nIHJlbGV2YW50IHNoYWRlciBjaHVua3MuXHJcbiAgICogVW5pZm9ybSB2YWx1ZXMgbXVzdCBiZSBtYW51YWxseSBzeW5jZWQgYmV0d2VlbiB0aGUgc291cmNlIG1hdGVyaWFsIGFuZCB0aGUgZGlzdGFuY2UgbWF0ZXJpYWwuXHJcbiAgICpcclxuICAgKiBAc2VlIHtAbGluayBodHRwOi8vdGhyZWUtYmFzLWV4YW1wbGVzLnN1cmdlLnNoL2V4YW1wbGVzL3NoYWRvd3MvfVxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtUSFJFRS5CQVMuQmFzZUFuaW1hdGlvbk1hdGVyaWFsfSBzb3VyY2VNYXRlcmlhbCBJbnN0YW5jZSB0byBnZXQgdGhlIHNoYWRlciBjaHVua3MgZnJvbS5cclxuICAgKiBAcmV0dXJucyB7VEhSRUUuQkFTLkRpc3RhbmNlQW5pbWF0aW9uTWF0ZXJpYWx9XHJcbiAgICovXHJcbiAgY3JlYXRlRGlzdGFuY2VBbmltYXRpb25NYXRlcmlhbDogZnVuY3Rpb24oc291cmNlTWF0ZXJpYWwpIHtcclxuICAgIHJldHVybiBuZXcgRGlzdGFuY2VBbmltYXRpb25NYXRlcmlhbCh7XHJcbiAgICAgIHVuaWZvcm1zOiBzb3VyY2VNYXRlcmlhbC51bmlmb3JtcyxcclxuICAgICAgZGVmaW5lczogc291cmNlTWF0ZXJpYWwuZGVmaW5lcyxcclxuICAgICAgdmVydGV4RnVuY3Rpb25zOiBzb3VyY2VNYXRlcmlhbC52ZXJ0ZXhGdW5jdGlvbnMsXHJcbiAgICAgIHZlcnRleFBhcmFtZXRlcnM6IHNvdXJjZU1hdGVyaWFsLnZlcnRleFBhcmFtZXRlcnMsXHJcbiAgICAgIHZlcnRleEluaXQ6IHNvdXJjZU1hdGVyaWFsLnZlcnRleEluaXQsXHJcbiAgICAgIHZlcnRleFBvc2l0aW9uOiBzb3VyY2VNYXRlcmlhbC52ZXJ0ZXhQb3NpdGlvblxyXG4gICAgfSk7XHJcbiAgfVxyXG59O1xyXG5cclxuZXhwb3J0IHsgVXRpbHMgfTtcclxuIiwiaW1wb3J0IHsgQnVmZmVyR2VvbWV0cnksIEJ1ZmZlckF0dHJpYnV0ZSB9IGZyb20gJ3RocmVlJztcclxuaW1wb3J0IHsgVXRpbHMgfSBmcm9tICcuLi9VdGlscyc7XHJcblxyXG4vKipcclxuICogQSBUSFJFRS5CdWZmZXJHZW9tZXRyeSBmb3IgYW5pbWF0aW5nIGluZGl2aWR1YWwgZmFjZXMgb2YgYSBUSFJFRS5HZW9tZXRyeS5cclxuICpcclxuICogQHBhcmFtIHtUSFJFRS5HZW9tZXRyeX0gbW9kZWwgVGhlIFRIUkVFLkdlb21ldHJ5IHRvIGJhc2UgdGhpcyBnZW9tZXRyeSBvbi5cclxuICogQHBhcmFtIHtPYmplY3Q9fSBvcHRpb25zXHJcbiAqIEBwYXJhbSB7Qm9vbGVhbj19IG9wdGlvbnMuY29tcHV0ZUNlbnRyb2lkcyBJZiB0cnVlLCBhIGNlbnRyb2lkcyB3aWxsIGJlIGNvbXB1dGVkIGZvciBlYWNoIGZhY2UgYW5kIHN0b3JlZCBpbiBUSFJFRS5CQVMuTW9kZWxCdWZmZXJHZW9tZXRyeS5jZW50cm9pZHMuXHJcbiAqIEBwYXJhbSB7Qm9vbGVhbj19IG9wdGlvbnMubG9jYWxpemVGYWNlcyBJZiB0cnVlLCB0aGUgcG9zaXRpb25zIGZvciBlYWNoIGZhY2Ugd2lsbCBiZSBzdG9yZWQgcmVsYXRpdmUgdG8gdGhlIGNlbnRyb2lkLiBUaGlzIGlzIHVzZWZ1bCBpZiB5b3Ugd2FudCB0byByb3RhdGUgb3Igc2NhbGUgZmFjZXMgYXJvdW5kIHRoZWlyIGNlbnRlci5cclxuICogQGNvbnN0cnVjdG9yXHJcbiAqL1xyXG5mdW5jdGlvbiBNb2RlbEJ1ZmZlckdlb21ldHJ5KG1vZGVsLCBvcHRpb25zKSB7XHJcbiAgQnVmZmVyR2VvbWV0cnkuY2FsbCh0aGlzKTtcclxuXHJcbiAgLyoqXHJcbiAgICogQSByZWZlcmVuY2UgdG8gdGhlIGdlb21ldHJ5IHVzZWQgdG8gY3JlYXRlIHRoaXMgaW5zdGFuY2UuXHJcbiAgICogQHR5cGUge1RIUkVFLkdlb21ldHJ5fVxyXG4gICAqL1xyXG4gIHRoaXMubW9kZWxHZW9tZXRyeSA9IG1vZGVsO1xyXG5cclxuICAvKipcclxuICAgKiBOdW1iZXIgb2YgZmFjZXMgb2YgdGhlIG1vZGVsLlxyXG4gICAqIEB0eXBlIHtOdW1iZXJ9XHJcbiAgICovXHJcbiAgdGhpcy5mYWNlQ291bnQgPSB0aGlzLm1vZGVsR2VvbWV0cnkuZmFjZXMubGVuZ3RoO1xyXG5cclxuICAvKipcclxuICAgKiBOdW1iZXIgb2YgdmVydGljZXMgb2YgdGhlIG1vZGVsLlxyXG4gICAqIEB0eXBlIHtOdW1iZXJ9XHJcbiAgICovXHJcbiAgdGhpcy52ZXJ0ZXhDb3VudCA9IHRoaXMubW9kZWxHZW9tZXRyeS52ZXJ0aWNlcy5sZW5ndGg7XHJcblxyXG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xyXG4gIG9wdGlvbnMuY29tcHV0ZUNlbnRyb2lkcyAmJiB0aGlzLmNvbXB1dGVDZW50cm9pZHMoKTtcclxuXHJcbiAgdGhpcy5idWZmZXJJbmRpY2VzKCk7XHJcbiAgdGhpcy5idWZmZXJQb3NpdGlvbnMob3B0aW9ucy5sb2NhbGl6ZUZhY2VzKTtcclxufVxyXG5Nb2RlbEJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlKTtcclxuTW9kZWxCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBNb2RlbEJ1ZmZlckdlb21ldHJ5O1xyXG5cclxuLyoqXHJcbiAqIENvbXB1dGVzIGEgY2VudHJvaWQgZm9yIGVhY2ggZmFjZSBhbmQgc3RvcmVzIGl0IGluIFRIUkVFLkJBUy5Nb2RlbEJ1ZmZlckdlb21ldHJ5LmNlbnRyb2lkcy5cclxuICovXHJcbk1vZGVsQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmNvbXB1dGVDZW50cm9pZHMgPSBmdW5jdGlvbigpIHtcclxuICAvKipcclxuICAgKiBBbiBhcnJheSBvZiBjZW50cm9pZHMgY29ycmVzcG9uZGluZyB0byB0aGUgZmFjZXMgb2YgdGhlIG1vZGVsLlxyXG4gICAqXHJcbiAgICogQHR5cGUge0FycmF5fVxyXG4gICAqL1xyXG4gIHRoaXMuY2VudHJvaWRzID0gW107XHJcblxyXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5mYWNlQ291bnQ7IGkrKykge1xyXG4gICAgdGhpcy5jZW50cm9pZHNbaV0gPSBVdGlscy5jb21wdXRlQ2VudHJvaWQodGhpcy5tb2RlbEdlb21ldHJ5LCB0aGlzLm1vZGVsR2VvbWV0cnkuZmFjZXNbaV0pO1xyXG4gIH1cclxufTtcclxuXHJcbk1vZGVsQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmJ1ZmZlckluZGljZXMgPSBmdW5jdGlvbigpIHtcclxuICBjb25zdCBpbmRleEJ1ZmZlciA9IG5ldyBVaW50MzJBcnJheSh0aGlzLmZhY2VDb3VudCAqIDMpO1xyXG5cclxuICB0aGlzLnNldEluZGV4KG5ldyBCdWZmZXJBdHRyaWJ1dGUoaW5kZXhCdWZmZXIsIDEpKTtcclxuXHJcbiAgZm9yIChsZXQgaSA9IDAsIG9mZnNldCA9IDA7IGkgPCB0aGlzLmZhY2VDb3VudDsgaSsrLCBvZmZzZXQgKz0gMykge1xyXG4gICAgY29uc3QgZmFjZSA9IHRoaXMubW9kZWxHZW9tZXRyeS5mYWNlc1tpXTtcclxuXHJcbiAgICBpbmRleEJ1ZmZlcltvZmZzZXQgICAgXSA9IGZhY2UuYTtcclxuICAgIGluZGV4QnVmZmVyW29mZnNldCArIDFdID0gZmFjZS5iO1xyXG4gICAgaW5kZXhCdWZmZXJbb2Zmc2V0ICsgMl0gPSBmYWNlLmM7XHJcbiAgfVxyXG59O1xyXG5cclxuTW9kZWxCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuYnVmZmVyUG9zaXRpb25zID0gZnVuY3Rpb24obG9jYWxpemVGYWNlcykge1xyXG4gIGNvbnN0IHBvc2l0aW9uQnVmZmVyID0gdGhpcy5jcmVhdGVBdHRyaWJ1dGUoJ3Bvc2l0aW9uJywgMykuYXJyYXk7XHJcbiAgbGV0IGksIG9mZnNldDtcclxuXHJcbiAgaWYgKGxvY2FsaXplRmFjZXMgPT09IHRydWUpIHtcclxuICAgIGZvciAoaSA9IDA7IGkgPCB0aGlzLmZhY2VDb3VudDsgaSsrKSB7XHJcbiAgICAgIGNvbnN0IGZhY2UgPSB0aGlzLm1vZGVsR2VvbWV0cnkuZmFjZXNbaV07XHJcbiAgICAgIGNvbnN0IGNlbnRyb2lkID0gdGhpcy5jZW50cm9pZHMgPyB0aGlzLmNlbnRyb2lkc1tpXSA6IFV0aWxzLmNvbXB1dGVDZW50cm9pZCh0aGlzLm1vZGVsR2VvbWV0cnksIGZhY2UpO1xyXG5cclxuICAgICAgY29uc3QgYSA9IHRoaXMubW9kZWxHZW9tZXRyeS52ZXJ0aWNlc1tmYWNlLmFdO1xyXG4gICAgICBjb25zdCBiID0gdGhpcy5tb2RlbEdlb21ldHJ5LnZlcnRpY2VzW2ZhY2UuYl07XHJcbiAgICAgIGNvbnN0IGMgPSB0aGlzLm1vZGVsR2VvbWV0cnkudmVydGljZXNbZmFjZS5jXTtcclxuXHJcbiAgICAgIHBvc2l0aW9uQnVmZmVyW2ZhY2UuYSAqIDNdICAgICA9IGEueCAtIGNlbnRyb2lkLng7XHJcbiAgICAgIHBvc2l0aW9uQnVmZmVyW2ZhY2UuYSAqIDMgKyAxXSA9IGEueSAtIGNlbnRyb2lkLnk7XHJcbiAgICAgIHBvc2l0aW9uQnVmZmVyW2ZhY2UuYSAqIDMgKyAyXSA9IGEueiAtIGNlbnRyb2lkLno7XHJcblxyXG4gICAgICBwb3NpdGlvbkJ1ZmZlcltmYWNlLmIgKiAzXSAgICAgPSBiLnggLSBjZW50cm9pZC54O1xyXG4gICAgICBwb3NpdGlvbkJ1ZmZlcltmYWNlLmIgKiAzICsgMV0gPSBiLnkgLSBjZW50cm9pZC55O1xyXG4gICAgICBwb3NpdGlvbkJ1ZmZlcltmYWNlLmIgKiAzICsgMl0gPSBiLnogLSBjZW50cm9pZC56O1xyXG5cclxuICAgICAgcG9zaXRpb25CdWZmZXJbZmFjZS5jICogM10gICAgID0gYy54IC0gY2VudHJvaWQueDtcclxuICAgICAgcG9zaXRpb25CdWZmZXJbZmFjZS5jICogMyArIDFdID0gYy55IC0gY2VudHJvaWQueTtcclxuICAgICAgcG9zaXRpb25CdWZmZXJbZmFjZS5jICogMyArIDJdID0gYy56IC0gY2VudHJvaWQuejtcclxuICAgIH1cclxuICB9XHJcbiAgZWxzZSB7XHJcbiAgICBmb3IgKGkgPSAwLCBvZmZzZXQgPSAwOyBpIDwgdGhpcy52ZXJ0ZXhDb3VudDsgaSsrLCBvZmZzZXQgKz0gMykge1xyXG4gICAgICBjb25zdCB2ZXJ0ZXggPSB0aGlzLm1vZGVsR2VvbWV0cnkudmVydGljZXNbaV07XHJcblxyXG4gICAgICBwb3NpdGlvbkJ1ZmZlcltvZmZzZXQgICAgXSA9IHZlcnRleC54O1xyXG4gICAgICBwb3NpdGlvbkJ1ZmZlcltvZmZzZXQgKyAxXSA9IHZlcnRleC55O1xyXG4gICAgICBwb3NpdGlvbkJ1ZmZlcltvZmZzZXQgKyAyXSA9IHZlcnRleC56O1xyXG4gICAgfVxyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIGEgVEhSRUUuQnVmZmVyQXR0cmlidXRlIHdpdGggVVYgY29vcmRpbmF0ZXMuXHJcbiAqL1xyXG5Nb2RlbEJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5idWZmZXJVVnMgPSBmdW5jdGlvbigpIHtcclxuICBjb25zdCB1dkJ1ZmZlciA9IHRoaXMuY3JlYXRlQXR0cmlidXRlKCd1dicsIDIpLmFycmF5O1xyXG5cclxuICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuZmFjZUNvdW50OyBpKyspIHtcclxuXHJcbiAgICBjb25zdCBmYWNlID0gdGhpcy5tb2RlbEdlb21ldHJ5LmZhY2VzW2ldO1xyXG4gICAgbGV0IHV2O1xyXG5cclxuICAgIHV2ID0gdGhpcy5tb2RlbEdlb21ldHJ5LmZhY2VWZXJ0ZXhVdnNbMF1baV1bMF07XHJcbiAgICB1dkJ1ZmZlcltmYWNlLmEgKiAyXSAgICAgPSB1di54O1xyXG4gICAgdXZCdWZmZXJbZmFjZS5hICogMiArIDFdID0gdXYueTtcclxuXHJcbiAgICB1diA9IHRoaXMubW9kZWxHZW9tZXRyeS5mYWNlVmVydGV4VXZzWzBdW2ldWzFdO1xyXG4gICAgdXZCdWZmZXJbZmFjZS5iICogMl0gICAgID0gdXYueDtcclxuICAgIHV2QnVmZmVyW2ZhY2UuYiAqIDIgKyAxXSA9IHV2Lnk7XHJcblxyXG4gICAgdXYgPSB0aGlzLm1vZGVsR2VvbWV0cnkuZmFjZVZlcnRleFV2c1swXVtpXVsyXTtcclxuICAgIHV2QnVmZmVyW2ZhY2UuYyAqIDJdICAgICA9IHV2Lng7XHJcbiAgICB1dkJ1ZmZlcltmYWNlLmMgKiAyICsgMV0gPSB1di55O1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIHR3byBUSFJFRS5CdWZmZXJBdHRyaWJ1dGVzOiBza2luSW5kZXggYW5kIHNraW5XZWlnaHQuIEJvdGggYXJlIHJlcXVpcmVkIGZvciBza2lubmluZy5cclxuICovXHJcbk1vZGVsQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmJ1ZmZlclNraW5uaW5nID0gZnVuY3Rpb24oKSB7XHJcbiAgY29uc3Qgc2tpbkluZGV4QnVmZmVyID0gdGhpcy5jcmVhdGVBdHRyaWJ1dGUoJ3NraW5JbmRleCcsIDQpLmFycmF5O1xyXG4gIGNvbnN0IHNraW5XZWlnaHRCdWZmZXIgPSB0aGlzLmNyZWF0ZUF0dHJpYnV0ZSgnc2tpbldlaWdodCcsIDQpLmFycmF5O1xyXG5cclxuICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMudmVydGV4Q291bnQ7IGkrKykge1xyXG4gICAgY29uc3Qgc2tpbkluZGV4ID0gdGhpcy5tb2RlbEdlb21ldHJ5LnNraW5JbmRpY2VzW2ldO1xyXG4gICAgY29uc3Qgc2tpbldlaWdodCA9IHRoaXMubW9kZWxHZW9tZXRyeS5za2luV2VpZ2h0c1tpXTtcclxuXHJcbiAgICBza2luSW5kZXhCdWZmZXJbaSAqIDQgICAgXSA9IHNraW5JbmRleC54O1xyXG4gICAgc2tpbkluZGV4QnVmZmVyW2kgKiA0ICsgMV0gPSBza2luSW5kZXgueTtcclxuICAgIHNraW5JbmRleEJ1ZmZlcltpICogNCArIDJdID0gc2tpbkluZGV4Lno7XHJcbiAgICBza2luSW5kZXhCdWZmZXJbaSAqIDQgKyAzXSA9IHNraW5JbmRleC53O1xyXG5cclxuICAgIHNraW5XZWlnaHRCdWZmZXJbaSAqIDQgICAgXSA9IHNraW5XZWlnaHQueDtcclxuICAgIHNraW5XZWlnaHRCdWZmZXJbaSAqIDQgKyAxXSA9IHNraW5XZWlnaHQueTtcclxuICAgIHNraW5XZWlnaHRCdWZmZXJbaSAqIDQgKyAyXSA9IHNraW5XZWlnaHQuejtcclxuICAgIHNraW5XZWlnaHRCdWZmZXJbaSAqIDQgKyAzXSA9IHNraW5XZWlnaHQudztcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogQ3JlYXRlcyBhIFRIUkVFLkJ1ZmZlckF0dHJpYnV0ZSBvbiB0aGlzIGdlb21ldHJ5IGluc3RhbmNlLlxyXG4gKlxyXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZSBOYW1lIG9mIHRoZSBhdHRyaWJ1dGUuXHJcbiAqIEBwYXJhbSB7aW50fSBpdGVtU2l6ZSBOdW1iZXIgb2YgZmxvYXRzIHBlciB2ZXJ0ZXggKHR5cGljYWxseSAxLCAyLCAzIG9yIDQpLlxyXG4gKiBAcGFyYW0ge2Z1bmN0aW9uPX0gZmFjdG9yeSBGdW5jdGlvbiB0aGF0IHdpbGwgYmUgY2FsbGVkIGZvciBlYWNoIGZhY2UgdXBvbiBjcmVhdGlvbi4gQWNjZXB0cyAzIGFyZ3VtZW50czogZGF0YVtdLCBpbmRleCBhbmQgZmFjZUNvdW50LiBDYWxscyBzZXRGYWNlRGF0YS5cclxuICpcclxuICogQHJldHVybnMge0J1ZmZlckF0dHJpYnV0ZX1cclxuICovXHJcbk1vZGVsQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmNyZWF0ZUF0dHJpYnV0ZSA9IGZ1bmN0aW9uKG5hbWUsIGl0ZW1TaXplLCBmYWN0b3J5KSB7XHJcbiAgY29uc3QgYnVmZmVyID0gbmV3IEZsb2F0MzJBcnJheSh0aGlzLnZlcnRleENvdW50ICogaXRlbVNpemUpO1xyXG4gIGNvbnN0IGF0dHJpYnV0ZSA9IG5ldyBCdWZmZXJBdHRyaWJ1dGUoYnVmZmVyLCBpdGVtU2l6ZSk7XHJcblxyXG4gIHRoaXMuYWRkQXR0cmlidXRlKG5hbWUsIGF0dHJpYnV0ZSk7XHJcblxyXG4gIGlmIChmYWN0b3J5KSB7XHJcbiAgICBjb25zdCBkYXRhID0gW107XHJcblxyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmZhY2VDb3VudDsgaSsrKSB7XHJcbiAgICAgIGZhY3RvcnkoZGF0YSwgaSwgdGhpcy5mYWNlQ291bnQpO1xyXG4gICAgICB0aGlzLnNldEZhY2VEYXRhKGF0dHJpYnV0ZSwgaSwgZGF0YSk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICByZXR1cm4gYXR0cmlidXRlO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFNldHMgZGF0YSBmb3IgYWxsIHZlcnRpY2VzIG9mIGEgZmFjZSBhdCBhIGdpdmVuIGluZGV4LlxyXG4gKiBVc3VhbGx5IGNhbGxlZCBpbiBhIGxvb3AuXHJcbiAqXHJcbiAqIEBwYXJhbSB7U3RyaW5nfFRIUkVFLkJ1ZmZlckF0dHJpYnV0ZX0gYXR0cmlidXRlIFRoZSBhdHRyaWJ1dGUgb3IgYXR0cmlidXRlIG5hbWUgd2hlcmUgdGhlIGRhdGEgaXMgdG8gYmUgc3RvcmVkLlxyXG4gKiBAcGFyYW0ge2ludH0gZmFjZUluZGV4IEluZGV4IG9mIHRoZSBmYWNlIGluIHRoZSBidWZmZXIgZ2VvbWV0cnkuXHJcbiAqIEBwYXJhbSB7QXJyYXl9IGRhdGEgQXJyYXkgb2YgZGF0YS4gTGVuZ3RoIHNob3VsZCBiZSBlcXVhbCB0byBpdGVtIHNpemUgb2YgdGhlIGF0dHJpYnV0ZS5cclxuICovXHJcbk1vZGVsQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLnNldEZhY2VEYXRhID0gZnVuY3Rpb24oYXR0cmlidXRlLCBmYWNlSW5kZXgsIGRhdGEpIHtcclxuICBhdHRyaWJ1dGUgPSAodHlwZW9mIGF0dHJpYnV0ZSA9PT0gJ3N0cmluZycpID8gdGhpcy5hdHRyaWJ1dGVzW2F0dHJpYnV0ZV0gOiBhdHRyaWJ1dGU7XHJcblxyXG4gIGxldCBvZmZzZXQgPSBmYWNlSW5kZXggKiAzICogYXR0cmlidXRlLml0ZW1TaXplO1xyXG5cclxuICBmb3IgKGxldCBpID0gMDsgaSA8IDM7IGkrKykge1xyXG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCBhdHRyaWJ1dGUuaXRlbVNpemU7IGorKykge1xyXG4gICAgICBhdHRyaWJ1dGUuYXJyYXlbb2Zmc2V0KytdID0gZGF0YVtqXTtcclxuICAgIH1cclxuICB9XHJcbn07XHJcblxyXG5leHBvcnQgeyBNb2RlbEJ1ZmZlckdlb21ldHJ5IH07XHJcbiIsImltcG9ydCB7IEJ1ZmZlckdlb21ldHJ5LCBCdWZmZXJBdHRyaWJ1dGUgfSBmcm9tICd0aHJlZSc7XHJcblxyXG4vKipcclxuICogQSBUSFJFRS5CdWZmZXJHZW9tZXRyeSBjb25zaXN0cyBvZiBwb2ludHMuXHJcbiAqIEBwYXJhbSB7TnVtYmVyfSBjb3VudCBUaGUgbnVtYmVyIG9mIHBvaW50cy5cclxuICogQGNvbnN0cnVjdG9yXHJcbiAqL1xyXG5mdW5jdGlvbiBQb2ludEJ1ZmZlckdlb21ldHJ5KGNvdW50KSB7XHJcbiAgQnVmZmVyR2VvbWV0cnkuY2FsbCh0aGlzKTtcclxuXHJcbiAgLyoqXHJcbiAgICogTnVtYmVyIG9mIHBvaW50cy5cclxuICAgKiBAdHlwZSB7TnVtYmVyfVxyXG4gICAqL1xyXG4gIHRoaXMucG9pbnRDb3VudCA9IGNvdW50O1xyXG5cclxuICB0aGlzLmJ1ZmZlclBvc2l0aW9ucygpO1xyXG59XHJcblBvaW50QnVmZmVyR2VvbWV0cnkucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUpO1xyXG5Qb2ludEJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFBvaW50QnVmZmVyR2VvbWV0cnk7XHJcblxyXG5Qb2ludEJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5idWZmZXJQb3NpdGlvbnMgPSBmdW5jdGlvbigpIHtcclxuICB0aGlzLmNyZWF0ZUF0dHJpYnV0ZSgncG9zaXRpb24nLCAzKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIGEgVEhSRUUuQnVmZmVyQXR0cmlidXRlIG9uIHRoaXMgZ2VvbWV0cnkgaW5zdGFuY2UuXHJcbiAqXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIE5hbWUgb2YgdGhlIGF0dHJpYnV0ZS5cclxuICogQHBhcmFtIHtOdW1iZXJ9IGl0ZW1TaXplIE51bWJlciBvZiBmbG9hdHMgcGVyIHZlcnRleCAodHlwaWNhbGx5IDEsIDIsIDMgb3IgNCkuXHJcbiAqIEBwYXJhbSB7ZnVuY3Rpb249fSBmYWN0b3J5IEZ1bmN0aW9uIHRoYXQgd2lsbCBiZSBjYWxsZWQgZm9yIGVhY2ggcG9pbnQgdXBvbiBjcmVhdGlvbi4gQWNjZXB0cyAzIGFyZ3VtZW50czogZGF0YVtdLCBpbmRleCBhbmQgcHJlZmFiQ291bnQuIENhbGxzIHNldFBvaW50RGF0YS5cclxuICpcclxuICogQHJldHVybnMge1RIUkVFLkJ1ZmZlckF0dHJpYnV0ZX1cclxuICovXHJcblBvaW50QnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmNyZWF0ZUF0dHJpYnV0ZSA9IGZ1bmN0aW9uKG5hbWUsIGl0ZW1TaXplLCBmYWN0b3J5KSB7XHJcbiAgY29uc3QgYnVmZmVyID0gbmV3IEZsb2F0MzJBcnJheSh0aGlzLnBvaW50Q291bnQgKiBpdGVtU2l6ZSk7XHJcbiAgY29uc3QgYXR0cmlidXRlID0gbmV3IEJ1ZmZlckF0dHJpYnV0ZShidWZmZXIsIGl0ZW1TaXplKTtcclxuXHJcbiAgdGhpcy5hZGRBdHRyaWJ1dGUobmFtZSwgYXR0cmlidXRlKTtcclxuXHJcbiAgaWYgKGZhY3RvcnkpIHtcclxuICAgIGNvbnN0IGRhdGEgPSBbXTtcclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5wb2ludENvdW50OyBpKyspIHtcclxuICAgICAgZmFjdG9yeShkYXRhLCBpLCB0aGlzLnBvaW50Q291bnQpO1xyXG4gICAgICB0aGlzLnNldFBvaW50RGF0YShhdHRyaWJ1dGUsIGksIGRhdGEpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcmV0dXJuIGF0dHJpYnV0ZTtcclxufTtcclxuXHJcblBvaW50QnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLnNldFBvaW50RGF0YSA9IGZ1bmN0aW9uKGF0dHJpYnV0ZSwgcG9pbnRJbmRleCwgZGF0YSkge1xyXG4gIGF0dHJpYnV0ZSA9ICh0eXBlb2YgYXR0cmlidXRlID09PSAnc3RyaW5nJykgPyB0aGlzLmF0dHJpYnV0ZXNbYXR0cmlidXRlXSA6IGF0dHJpYnV0ZTtcclxuXHJcbiAgbGV0IG9mZnNldCA9IHBvaW50SW5kZXggKiBhdHRyaWJ1dGUuaXRlbVNpemU7XHJcblxyXG4gIGZvciAobGV0IGogPSAwOyBqIDwgYXR0cmlidXRlLml0ZW1TaXplOyBqKyspIHtcclxuICAgIGF0dHJpYnV0ZS5hcnJheVtvZmZzZXQrK10gPSBkYXRhW2pdO1xyXG4gIH1cclxufTtcclxuXHJcbmV4cG9ydCB7IFBvaW50QnVmZmVyR2VvbWV0cnkgfTtcclxuIiwiLy8gZ2VuZXJhdGVkIGJ5IHNjcmlwdHMvYnVpbGRfc2hhZGVyX2NodW5rcy5qc1xuXG5pbXBvcnQgY2F0bXVsbF9yb21fc3BsaW5lIGZyb20gJy4vZ2xzbC9jYXRtdWxsX3JvbV9zcGxpbmUuZ2xzbCc7XG5pbXBvcnQgY3ViaWNfYmV6aWVyIGZyb20gJy4vZ2xzbC9jdWJpY19iZXppZXIuZ2xzbCc7XG5pbXBvcnQgZWFzZV9iYWNrX2luIGZyb20gJy4vZ2xzbC9lYXNlX2JhY2tfaW4uZ2xzbCc7XG5pbXBvcnQgZWFzZV9iYWNrX2luX291dCBmcm9tICcuL2dsc2wvZWFzZV9iYWNrX2luX291dC5nbHNsJztcbmltcG9ydCBlYXNlX2JhY2tfb3V0IGZyb20gJy4vZ2xzbC9lYXNlX2JhY2tfb3V0Lmdsc2wnO1xuaW1wb3J0IGVhc2VfYmV6aWVyIGZyb20gJy4vZ2xzbC9lYXNlX2Jlemllci5nbHNsJztcbmltcG9ydCBlYXNlX2JvdW5jZV9pbiBmcm9tICcuL2dsc2wvZWFzZV9ib3VuY2VfaW4uZ2xzbCc7XG5pbXBvcnQgZWFzZV9ib3VuY2VfaW5fb3V0IGZyb20gJy4vZ2xzbC9lYXNlX2JvdW5jZV9pbl9vdXQuZ2xzbCc7XG5pbXBvcnQgZWFzZV9ib3VuY2Vfb3V0IGZyb20gJy4vZ2xzbC9lYXNlX2JvdW5jZV9vdXQuZ2xzbCc7XG5pbXBvcnQgZWFzZV9jaXJjX2luIGZyb20gJy4vZ2xzbC9lYXNlX2NpcmNfaW4uZ2xzbCc7XG5pbXBvcnQgZWFzZV9jaXJjX2luX291dCBmcm9tICcuL2dsc2wvZWFzZV9jaXJjX2luX291dC5nbHNsJztcbmltcG9ydCBlYXNlX2NpcmNfb3V0IGZyb20gJy4vZ2xzbC9lYXNlX2NpcmNfb3V0Lmdsc2wnO1xuaW1wb3J0IGVhc2VfY3ViaWNfaW4gZnJvbSAnLi9nbHNsL2Vhc2VfY3ViaWNfaW4uZ2xzbCc7XG5pbXBvcnQgZWFzZV9jdWJpY19pbl9vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfY3ViaWNfaW5fb3V0Lmdsc2wnO1xuaW1wb3J0IGVhc2VfY3ViaWNfb3V0IGZyb20gJy4vZ2xzbC9lYXNlX2N1YmljX291dC5nbHNsJztcbmltcG9ydCBlYXNlX2VsYXN0aWNfaW4gZnJvbSAnLi9nbHNsL2Vhc2VfZWxhc3RpY19pbi5nbHNsJztcbmltcG9ydCBlYXNlX2VsYXN0aWNfaW5fb3V0IGZyb20gJy4vZ2xzbC9lYXNlX2VsYXN0aWNfaW5fb3V0Lmdsc2wnO1xuaW1wb3J0IGVhc2VfZWxhc3RpY19vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfZWxhc3RpY19vdXQuZ2xzbCc7XG5pbXBvcnQgZWFzZV9leHBvX2luIGZyb20gJy4vZ2xzbC9lYXNlX2V4cG9faW4uZ2xzbCc7XG5pbXBvcnQgZWFzZV9leHBvX2luX291dCBmcm9tICcuL2dsc2wvZWFzZV9leHBvX2luX291dC5nbHNsJztcbmltcG9ydCBlYXNlX2V4cG9fb3V0IGZyb20gJy4vZ2xzbC9lYXNlX2V4cG9fb3V0Lmdsc2wnO1xuaW1wb3J0IGVhc2VfcXVhZF9pbiBmcm9tICcuL2dsc2wvZWFzZV9xdWFkX2luLmdsc2wnO1xuaW1wb3J0IGVhc2VfcXVhZF9pbl9vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfcXVhZF9pbl9vdXQuZ2xzbCc7XG5pbXBvcnQgZWFzZV9xdWFkX291dCBmcm9tICcuL2dsc2wvZWFzZV9xdWFkX291dC5nbHNsJztcbmltcG9ydCBlYXNlX3F1YXJ0X2luIGZyb20gJy4vZ2xzbC9lYXNlX3F1YXJ0X2luLmdsc2wnO1xuaW1wb3J0IGVhc2VfcXVhcnRfaW5fb3V0IGZyb20gJy4vZ2xzbC9lYXNlX3F1YXJ0X2luX291dC5nbHNsJztcbmltcG9ydCBlYXNlX3F1YXJ0X291dCBmcm9tICcuL2dsc2wvZWFzZV9xdWFydF9vdXQuZ2xzbCc7XG5pbXBvcnQgZWFzZV9xdWludF9pbiBmcm9tICcuL2dsc2wvZWFzZV9xdWludF9pbi5nbHNsJztcbmltcG9ydCBlYXNlX3F1aW50X2luX291dCBmcm9tICcuL2dsc2wvZWFzZV9xdWludF9pbl9vdXQuZ2xzbCc7XG5pbXBvcnQgZWFzZV9xdWludF9vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfcXVpbnRfb3V0Lmdsc2wnO1xuaW1wb3J0IGVhc2Vfc2luZV9pbiBmcm9tICcuL2dsc2wvZWFzZV9zaW5lX2luLmdsc2wnO1xuaW1wb3J0IGVhc2Vfc2luZV9pbl9vdXQgZnJvbSAnLi9nbHNsL2Vhc2Vfc2luZV9pbl9vdXQuZ2xzbCc7XG5pbXBvcnQgZWFzZV9zaW5lX291dCBmcm9tICcuL2dsc2wvZWFzZV9zaW5lX291dC5nbHNsJztcbmltcG9ydCBxdWFkcmF0aWNfYmV6aWVyIGZyb20gJy4vZ2xzbC9xdWFkcmF0aWNfYmV6aWVyLmdsc2wnO1xuaW1wb3J0IHF1YXRlcm5pb25fcm90YXRpb24gZnJvbSAnLi9nbHNsL3F1YXRlcm5pb25fcm90YXRpb24uZ2xzbCc7XG5pbXBvcnQgcXVhdGVybmlvbl9zbGVycCBmcm9tICcuL2dsc2wvcXVhdGVybmlvbl9zbGVycC5nbHNsJztcblxuXG5leHBvcnQgY29uc3QgU2hhZGVyQ2h1bmsgPSB7XG4gIGNhdG11bGxfcm9tX3NwbGluZTogY2F0bXVsbF9yb21fc3BsaW5lLFxuICBjdWJpY19iZXppZXI6IGN1YmljX2JlemllcixcbiAgZWFzZV9iYWNrX2luOiBlYXNlX2JhY2tfaW4sXG4gIGVhc2VfYmFja19pbl9vdXQ6IGVhc2VfYmFja19pbl9vdXQsXG4gIGVhc2VfYmFja19vdXQ6IGVhc2VfYmFja19vdXQsXG4gIGVhc2VfYmV6aWVyOiBlYXNlX2JlemllcixcbiAgZWFzZV9ib3VuY2VfaW46IGVhc2VfYm91bmNlX2luLFxuICBlYXNlX2JvdW5jZV9pbl9vdXQ6IGVhc2VfYm91bmNlX2luX291dCxcbiAgZWFzZV9ib3VuY2Vfb3V0OiBlYXNlX2JvdW5jZV9vdXQsXG4gIGVhc2VfY2lyY19pbjogZWFzZV9jaXJjX2luLFxuICBlYXNlX2NpcmNfaW5fb3V0OiBlYXNlX2NpcmNfaW5fb3V0LFxuICBlYXNlX2NpcmNfb3V0OiBlYXNlX2NpcmNfb3V0LFxuICBlYXNlX2N1YmljX2luOiBlYXNlX2N1YmljX2luLFxuICBlYXNlX2N1YmljX2luX291dDogZWFzZV9jdWJpY19pbl9vdXQsXG4gIGVhc2VfY3ViaWNfb3V0OiBlYXNlX2N1YmljX291dCxcbiAgZWFzZV9lbGFzdGljX2luOiBlYXNlX2VsYXN0aWNfaW4sXG4gIGVhc2VfZWxhc3RpY19pbl9vdXQ6IGVhc2VfZWxhc3RpY19pbl9vdXQsXG4gIGVhc2VfZWxhc3RpY19vdXQ6IGVhc2VfZWxhc3RpY19vdXQsXG4gIGVhc2VfZXhwb19pbjogZWFzZV9leHBvX2luLFxuICBlYXNlX2V4cG9faW5fb3V0OiBlYXNlX2V4cG9faW5fb3V0LFxuICBlYXNlX2V4cG9fb3V0OiBlYXNlX2V4cG9fb3V0LFxuICBlYXNlX3F1YWRfaW46IGVhc2VfcXVhZF9pbixcbiAgZWFzZV9xdWFkX2luX291dDogZWFzZV9xdWFkX2luX291dCxcbiAgZWFzZV9xdWFkX291dDogZWFzZV9xdWFkX291dCxcbiAgZWFzZV9xdWFydF9pbjogZWFzZV9xdWFydF9pbixcbiAgZWFzZV9xdWFydF9pbl9vdXQ6IGVhc2VfcXVhcnRfaW5fb3V0LFxuICBlYXNlX3F1YXJ0X291dDogZWFzZV9xdWFydF9vdXQsXG4gIGVhc2VfcXVpbnRfaW46IGVhc2VfcXVpbnRfaW4sXG4gIGVhc2VfcXVpbnRfaW5fb3V0OiBlYXNlX3F1aW50X2luX291dCxcbiAgZWFzZV9xdWludF9vdXQ6IGVhc2VfcXVpbnRfb3V0LFxuICBlYXNlX3NpbmVfaW46IGVhc2Vfc2luZV9pbixcbiAgZWFzZV9zaW5lX2luX291dDogZWFzZV9zaW5lX2luX291dCxcbiAgZWFzZV9zaW5lX291dDogZWFzZV9zaW5lX291dCxcbiAgcXVhZHJhdGljX2JlemllcjogcXVhZHJhdGljX2JlemllcixcbiAgcXVhdGVybmlvbl9yb3RhdGlvbjogcXVhdGVybmlvbl9yb3RhdGlvbixcbiAgcXVhdGVybmlvbl9zbGVycDogcXVhdGVybmlvbl9zbGVycCxcblxufTtcblxuIiwiLyoqXHJcbiAqIEEgdGltZWxpbmUgdHJhbnNpdGlvbiBzZWdtZW50LiBBbiBpbnN0YW5jZSBvZiB0aGlzIGNsYXNzIGlzIGNyZWF0ZWQgaW50ZXJuYWxseSB3aGVuIGNhbGxpbmcge0BsaW5rIFRIUkVFLkJBUy5UaW1lbGluZS5hZGR9LCBzbyB5b3Ugc2hvdWxkIG5vdCB1c2UgdGhpcyBjbGFzcyBkaXJlY3RseS5cclxuICogVGhlIGluc3RhbmNlIGlzIGFsc28gcGFzc2VkIHRoZSB0aGUgY29tcGlsZXIgZnVuY3Rpb24gaWYgeW91IHJlZ2lzdGVyIGEgdHJhbnNpdGlvbiB0aHJvdWdoIHtAbGluayBUSFJFRS5CQVMuVGltZWxpbmUucmVnaXN0ZXJ9LiBUaGVyZSB5b3UgY2FuIHVzZSB0aGUgcHVibGljIHByb3BlcnRpZXMgb2YgdGhlIHNlZ21lbnQgdG8gY29tcGlsZSB0aGUgZ2xzbCBzdHJpbmcuXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgQSBzdHJpbmcga2V5IGdlbmVyYXRlZCBieSB0aGUgdGltZWxpbmUgdG8gd2hpY2ggdGhpcyBzZWdtZW50IGJlbG9uZ3MuIEtleXMgYXJlIHVuaXF1ZS5cclxuICogQHBhcmFtIHtudW1iZXJ9IHN0YXJ0IFN0YXJ0IHRpbWUgb2YgdGhpcyBzZWdtZW50IGluIGEgdGltZWxpbmUgaW4gc2Vjb25kcy5cclxuICogQHBhcmFtIHtudW1iZXJ9IGR1cmF0aW9uIER1cmF0aW9uIG9mIHRoaXMgc2VnbWVudCBpbiBzZWNvbmRzLlxyXG4gKiBAcGFyYW0ge29iamVjdH0gdHJhbnNpdGlvbiBPYmplY3QgZGVzY3JpYmluZyB0aGUgdHJhbnNpdGlvbi5cclxuICogQHBhcmFtIHtmdW5jdGlvbn0gY29tcGlsZXIgQSByZWZlcmVuY2UgdG8gdGhlIGNvbXBpbGVyIGZ1bmN0aW9uIGZyb20gYSB0cmFuc2l0aW9uIGRlZmluaXRpb24uXHJcbiAqIEBjb25zdHJ1Y3RvclxyXG4gKi9cclxuZnVuY3Rpb24gVGltZWxpbmVTZWdtZW50KGtleSwgc3RhcnQsIGR1cmF0aW9uLCB0cmFuc2l0aW9uLCBjb21waWxlcikge1xyXG4gIHRoaXMua2V5ID0ga2V5O1xyXG4gIHRoaXMuc3RhcnQgPSBzdGFydDtcclxuICB0aGlzLmR1cmF0aW9uID0gZHVyYXRpb247XHJcbiAgdGhpcy50cmFuc2l0aW9uID0gdHJhbnNpdGlvbjtcclxuICB0aGlzLmNvbXBpbGVyID0gY29tcGlsZXI7XHJcblxyXG4gIHRoaXMudHJhaWwgPSAwO1xyXG59XHJcblxyXG5UaW1lbGluZVNlZ21lbnQucHJvdG90eXBlLmNvbXBpbGUgPSBmdW5jdGlvbigpIHtcclxuICByZXR1cm4gdGhpcy5jb21waWxlcih0aGlzKTtcclxufTtcclxuXHJcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShUaW1lbGluZVNlZ21lbnQucHJvdG90eXBlLCAnZW5kJywge1xyXG4gIGdldDogZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gdGhpcy5zdGFydCArIHRoaXMuZHVyYXRpb247XHJcbiAgfVxyXG59KTtcclxuXHJcbmV4cG9ydCB7IFRpbWVsaW5lU2VnbWVudCB9O1xyXG4iLCJpbXBvcnQgeyBUaW1lbGluZVNlZ21lbnQgfSBmcm9tICcuL1RpbWVsaW5lU2VnbWVudCc7XHJcblxyXG4vKipcclxuICogQSB1dGlsaXR5IGNsYXNzIHRvIGNyZWF0ZSBhbiBhbmltYXRpb24gdGltZWxpbmUgd2hpY2ggY2FuIGJlIGJha2VkIGludG8gYSAodmVydGV4KSBzaGFkZXIuXHJcbiAqIEJ5IGRlZmF1bHQgdGhlIHRpbWVsaW5lIHN1cHBvcnRzIHRyYW5zbGF0aW9uLCBzY2FsZSBhbmQgcm90YXRpb24uIFRoaXMgY2FuIGJlIGV4dGVuZGVkIG9yIG92ZXJyaWRkZW4uXHJcbiAqIEBjb25zdHJ1Y3RvclxyXG4gKi9cclxuZnVuY3Rpb24gVGltZWxpbmUoKSB7XHJcbiAgLyoqXHJcbiAgICogVGhlIHRvdGFsIGR1cmF0aW9uIG9mIHRoZSB0aW1lbGluZSBpbiBzZWNvbmRzLlxyXG4gICAqIEB0eXBlIHtudW1iZXJ9XHJcbiAgICovXHJcbiAgdGhpcy5kdXJhdGlvbiA9IDA7XHJcblxyXG4gIC8qKlxyXG4gICAqIFRoZSBuYW1lIG9mIHRoZSB2YWx1ZSB0aGF0IHNlZ21lbnRzIHdpbGwgdXNlIHRvIHJlYWQgdGhlIHRpbWUuIERlZmF1bHRzIHRvICd0VGltZScuXHJcbiAgICogQHR5cGUge3N0cmluZ31cclxuICAgKi9cclxuICB0aGlzLnRpbWVLZXkgPSAndFRpbWUnO1xyXG5cclxuICB0aGlzLnNlZ21lbnRzID0ge307XHJcbiAgdGhpcy5fX2tleSA9IDA7XHJcbn1cclxuXHJcbi8vIHN0YXRpYyBkZWZpbml0aW9ucyBtYXBcclxuVGltZWxpbmUuc2VnbWVudERlZmluaXRpb25zID0ge307XHJcblxyXG4vKipcclxuICogUmVnaXN0ZXJzIGEgdHJhbnNpdGlvbiBkZWZpbml0aW9uIGZvciB1c2Ugd2l0aCB7QGxpbmsgVEhSRUUuQkFTLlRpbWVsaW5lLmFkZH0uXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBrZXkgTmFtZSBvZiB0aGUgdHJhbnNpdGlvbi4gRGVmYXVsdHMgaW5jbHVkZSAnc2NhbGUnLCAncm90YXRlJyBhbmQgJ3RyYW5zbGF0ZScuXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBkZWZpbml0aW9uXHJcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGRlZmluaXRpb24uY29tcGlsZXIgQSBmdW5jdGlvbiB0aGF0IGdlbmVyYXRlcyBhIGdsc2wgc3RyaW5nIGZvciBhIHRyYW5zaXRpb24gc2VnbWVudC4gQWNjZXB0cyBhIFRIUkVFLkJBUy5UaW1lbGluZVNlZ21lbnQgYXMgdGhlIHNvbGUgYXJndW1lbnQuXHJcbiAqIEBwYXJhbSB7Kn0gZGVmaW5pdGlvbi5kZWZhdWx0RnJvbSBUaGUgaW5pdGlhbCB2YWx1ZSBmb3IgYSB0cmFuc2Zvcm0uZnJvbS4gRm9yIGV4YW1wbGUsIHRoZSBkZWZhdWx0RnJvbSBmb3IgYSB0cmFuc2xhdGlvbiBpcyBUSFJFRS5WZWN0b3IzKDAsIDAsIDApLlxyXG4gKiBAc3RhdGljXHJcbiAqL1xyXG5UaW1lbGluZS5yZWdpc3RlciA9IGZ1bmN0aW9uKGtleSwgZGVmaW5pdGlvbikge1xyXG4gIFRpbWVsaW5lLnNlZ21lbnREZWZpbml0aW9uc1trZXldID0gZGVmaW5pdGlvbjtcclxuICBcclxuICByZXR1cm4gZGVmaW5pdGlvbjtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBBZGQgYSB0cmFuc2l0aW9uIHRvIHRoZSB0aW1lbGluZS5cclxuICogQHBhcmFtIHtudW1iZXJ9IGR1cmF0aW9uIER1cmF0aW9uIGluIHNlY29uZHNcclxuICogQHBhcmFtIHtvYmplY3R9IHRyYW5zaXRpb25zIEFuIG9iamVjdCBjb250YWluaW5nIG9uZSBvciBzZXZlcmFsIHRyYW5zaXRpb25zLiBUaGUga2V5cyBzaG91bGQgbWF0Y2ggdHJhbnNmb3JtIGRlZmluaXRpb25zLlxyXG4gKiBUaGUgdHJhbnNpdGlvbiBvYmplY3QgZm9yIGVhY2gga2V5IHdpbGwgYmUgcGFzc2VkIHRvIHRoZSBtYXRjaGluZyBkZWZpbml0aW9uJ3MgY29tcGlsZXIuIEl0IGNhbiBoYXZlIGFyYml0cmFyeSBwcm9wZXJ0aWVzLCBidXQgdGhlIFRpbWVsaW5lIGV4cGVjdHMgYXQgbGVhc3QgYSAndG8nLCAnZnJvbScgYW5kIGFuIG9wdGlvbmFsICdlYXNlJy5cclxuICogQHBhcmFtIHtudW1iZXJ8c3RyaW5nfSBbcG9zaXRpb25PZmZzZXRdIFBvc2l0aW9uIGluIHRoZSB0aW1lbGluZS4gRGVmYXVsdHMgdG8gdGhlIGVuZCBvZiB0aGUgdGltZWxpbmUuIElmIGEgbnVtYmVyIGlzIHByb3ZpZGVkLCB0aGUgdHJhbnNpdGlvbiB3aWxsIGJlIGluc2VydGVkIGF0IHRoYXQgdGltZSBpbiBzZWNvbmRzLiBTdHJpbmdzICgnKz14JyBvciAnLT14JykgY2FuIGJlIHVzZWQgZm9yIGEgdmFsdWUgcmVsYXRpdmUgdG8gdGhlIGVuZCBvZiB0aW1lbGluZS5cclxuICovXHJcblRpbWVsaW5lLnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbihkdXJhdGlvbiwgdHJhbnNpdGlvbnMsIHBvc2l0aW9uT2Zmc2V0KSB7XHJcbiAgLy8gc3RvcCByb2xsdXAgZnJvbSBjb21wbGFpbmluZyBhYm91dCBldmFsXHJcbiAgY29uc3QgX2V2YWwgPSBldmFsO1xyXG4gIFxyXG4gIGxldCBzdGFydCA9IHRoaXMuZHVyYXRpb247XHJcblxyXG4gIGlmIChwb3NpdGlvbk9mZnNldCAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICBpZiAodHlwZW9mIHBvc2l0aW9uT2Zmc2V0ID09PSAnbnVtYmVyJykge1xyXG4gICAgICBzdGFydCA9IHBvc2l0aW9uT2Zmc2V0O1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAodHlwZW9mIHBvc2l0aW9uT2Zmc2V0ID09PSAnc3RyaW5nJykge1xyXG4gICAgICBfZXZhbCgnc3RhcnQnICsgcG9zaXRpb25PZmZzZXQpO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuZHVyYXRpb24gPSBNYXRoLm1heCh0aGlzLmR1cmF0aW9uLCBzdGFydCArIGR1cmF0aW9uKTtcclxuICB9XHJcbiAgZWxzZSB7XHJcbiAgICB0aGlzLmR1cmF0aW9uICs9IGR1cmF0aW9uO1xyXG4gIH1cclxuXHJcbiAgbGV0IGtleXMgPSBPYmplY3Qua2V5cyh0cmFuc2l0aW9ucyksIGtleTtcclxuXHJcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICBrZXkgPSBrZXlzW2ldO1xyXG5cclxuICAgIHRoaXMucHJvY2Vzc1RyYW5zaXRpb24oa2V5LCB0cmFuc2l0aW9uc1trZXldLCBzdGFydCwgZHVyYXRpb24pO1xyXG4gIH1cclxufTtcclxuXHJcblRpbWVsaW5lLnByb3RvdHlwZS5wcm9jZXNzVHJhbnNpdGlvbiA9IGZ1bmN0aW9uKGtleSwgdHJhbnNpdGlvbiwgc3RhcnQsIGR1cmF0aW9uKSB7XHJcbiAgY29uc3QgZGVmaW5pdGlvbiA9IFRpbWVsaW5lLnNlZ21lbnREZWZpbml0aW9uc1trZXldO1xyXG5cclxuICBsZXQgc2VnbWVudHMgPSB0aGlzLnNlZ21lbnRzW2tleV07XHJcbiAgaWYgKCFzZWdtZW50cykgc2VnbWVudHMgPSB0aGlzLnNlZ21lbnRzW2tleV0gPSBbXTtcclxuXHJcbiAgaWYgKHRyYW5zaXRpb24uZnJvbSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICBpZiAoc2VnbWVudHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgIHRyYW5zaXRpb24uZnJvbSA9IGRlZmluaXRpb24uZGVmYXVsdEZyb207XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgdHJhbnNpdGlvbi5mcm9tID0gc2VnbWVudHNbc2VnbWVudHMubGVuZ3RoIC0gMV0udHJhbnNpdGlvbi50bztcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHNlZ21lbnRzLnB1c2gobmV3IFRpbWVsaW5lU2VnbWVudCgodGhpcy5fX2tleSsrKS50b1N0cmluZygpLCBzdGFydCwgZHVyYXRpb24sIHRyYW5zaXRpb24sIGRlZmluaXRpb24uY29tcGlsZXIpKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBDb21waWxlcyB0aGUgdGltZWxpbmUgaW50byBhIGdsc2wgc3RyaW5nIGFycmF5IHRoYXQgY2FuIGJlIGluamVjdGVkIGludG8gYSAodmVydGV4KSBzaGFkZXIuXHJcbiAqIEByZXR1cm5zIHtBcnJheX1cclxuICovXHJcblRpbWVsaW5lLnByb3RvdHlwZS5jb21waWxlID0gZnVuY3Rpb24oKSB7XHJcbiAgY29uc3QgYyA9IFtdO1xyXG5cclxuICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXModGhpcy5zZWdtZW50cyk7XHJcbiAgbGV0IHNlZ21lbnRzO1xyXG5cclxuICBmb3IgKGxldCBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyBpKyspIHtcclxuICAgIHNlZ21lbnRzID0gdGhpcy5zZWdtZW50c1trZXlzW2ldXTtcclxuXHJcbiAgICB0aGlzLmZpbGxHYXBzKHNlZ21lbnRzKTtcclxuXHJcbiAgICBzZWdtZW50cy5mb3JFYWNoKGZ1bmN0aW9uKHMpIHtcclxuICAgICAgYy5wdXNoKHMuY29tcGlsZSgpKTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIGM7XHJcbn07XHJcblRpbWVsaW5lLnByb3RvdHlwZS5maWxsR2FwcyA9IGZ1bmN0aW9uKHNlZ21lbnRzKSB7XHJcbiAgaWYgKHNlZ21lbnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuO1xyXG5cclxuICBsZXQgczAsIHMxO1xyXG5cclxuICBmb3IgKGxldCBpID0gMDsgaSA8IHNlZ21lbnRzLmxlbmd0aCAtIDE7IGkrKykge1xyXG4gICAgczAgPSBzZWdtZW50c1tpXTtcclxuICAgIHMxID0gc2VnbWVudHNbaSArIDFdO1xyXG5cclxuICAgIHMwLnRyYWlsID0gczEuc3RhcnQgLSBzMC5lbmQ7XHJcbiAgfVxyXG5cclxuICAvLyBwYWQgbGFzdCBzZWdtZW50IHVudGlsIGVuZCBvZiB0aW1lbGluZVxyXG4gIHMwID0gc2VnbWVudHNbc2VnbWVudHMubGVuZ3RoIC0gMV07XHJcbiAgczAudHJhaWwgPSB0aGlzLmR1cmF0aW9uIC0gczAuZW5kO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEdldCBhIGNvbXBpbGVkIGdsc2wgc3RyaW5nIHdpdGggY2FsbHMgdG8gdHJhbnNmb3JtIGZ1bmN0aW9ucyBmb3IgYSBnaXZlbiBrZXkuXHJcbiAqIFRoZSBvcmRlciBpbiB3aGljaCB0aGVzZSB0cmFuc2l0aW9ucyBhcmUgYXBwbGllZCBtYXR0ZXJzIGJlY2F1c2UgdGhleSBhbGwgb3BlcmF0ZSBvbiB0aGUgc2FtZSB2YWx1ZS5cclxuICogQHBhcmFtIHtzdHJpbmd9IGtleSBBIGtleSBtYXRjaGluZyBhIHRyYW5zZm9ybSBkZWZpbml0aW9uLlxyXG4gKiBAcmV0dXJucyB7c3RyaW5nfVxyXG4gKi9cclxuVGltZWxpbmUucHJvdG90eXBlLmdldFRyYW5zZm9ybUNhbGxzID0gZnVuY3Rpb24oa2V5KSB7XHJcbiAgbGV0IHQgPSB0aGlzLnRpbWVLZXk7XHJcblxyXG4gIHJldHVybiB0aGlzLnNlZ21lbnRzW2tleV0gPyAgdGhpcy5zZWdtZW50c1trZXldLm1hcChmdW5jdGlvbihzKSB7XHJcbiAgICByZXR1cm4gYGFwcGx5VHJhbnNmb3JtJHtzLmtleX0oJHt0fSwgdHJhbnNmb3JtZWQpO2A7XHJcbiAgfSkuam9pbignXFxuJykgOiAnJztcclxufTtcclxuXHJcbmV4cG9ydCB7IFRpbWVsaW5lIH1cclxuIiwiY29uc3QgVGltZWxpbmVDaHVua3MgPSB7XHJcbiAgdmVjMzogZnVuY3Rpb24obiwgdiwgcCkge1xyXG4gICAgY29uc3QgeCA9ICh2LnggfHwgMCkudG9QcmVjaXNpb24ocCk7XHJcbiAgICBjb25zdCB5ID0gKHYueSB8fCAwKS50b1ByZWNpc2lvbihwKTtcclxuICAgIGNvbnN0IHogPSAodi56IHx8IDApLnRvUHJlY2lzaW9uKHApO1xyXG5cclxuICAgIHJldHVybiBgdmVjMyAke259ID0gdmVjMygke3h9LCAke3l9LCAke3p9KTtgO1xyXG4gIH0sXHJcbiAgdmVjNDogZnVuY3Rpb24obiwgdiwgcCkge1xyXG4gICAgY29uc3QgeCA9ICh2LnggfHwgMCkudG9QcmVjaXNpb24ocCk7XHJcbiAgICBjb25zdCB5ID0gKHYueSB8fCAwKS50b1ByZWNpc2lvbihwKTtcclxuICAgIGNvbnN0IHogPSAodi56IHx8IDApLnRvUHJlY2lzaW9uKHApO1xyXG4gICAgY29uc3QgdyA9ICh2LncgfHwgMCkudG9QcmVjaXNpb24ocCk7XHJcbiAgXHJcbiAgICByZXR1cm4gYHZlYzQgJHtufSA9IHZlYzQoJHt4fSwgJHt5fSwgJHt6fSwgJHt3fSk7YDtcclxuICB9LFxyXG4gIGRlbGF5RHVyYXRpb246IGZ1bmN0aW9uKHNlZ21lbnQpIHtcclxuICAgIHJldHVybiBgXHJcbiAgICBmbG9hdCBjRGVsYXkke3NlZ21lbnQua2V5fSA9ICR7c2VnbWVudC5zdGFydC50b1ByZWNpc2lvbig0KX07XHJcbiAgICBmbG9hdCBjRHVyYXRpb24ke3NlZ21lbnQua2V5fSA9ICR7c2VnbWVudC5kdXJhdGlvbi50b1ByZWNpc2lvbig0KX07XHJcbiAgICBgO1xyXG4gIH0sXHJcbiAgcHJvZ3Jlc3M6IGZ1bmN0aW9uKHNlZ21lbnQpIHtcclxuICAgIC8vIHplcm8gZHVyYXRpb24gc2VnbWVudHMgc2hvdWxkIGFsd2F5cyByZW5kZXIgY29tcGxldGVcclxuICAgIGlmIChzZWdtZW50LmR1cmF0aW9uID09PSAwKSB7XHJcbiAgICAgIHJldHVybiBgZmxvYXQgcHJvZ3Jlc3MgPSAxLjA7YFxyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIHJldHVybiBgXHJcbiAgICAgIGZsb2F0IHByb2dyZXNzID0gY2xhbXAodGltZSAtIGNEZWxheSR7c2VnbWVudC5rZXl9LCAwLjAsIGNEdXJhdGlvbiR7c2VnbWVudC5rZXl9KSAvIGNEdXJhdGlvbiR7c2VnbWVudC5rZXl9O1xyXG4gICAgICAke3NlZ21lbnQudHJhbnNpdGlvbi5lYXNlID8gYHByb2dyZXNzID0gJHtzZWdtZW50LnRyYW5zaXRpb24uZWFzZX0ocHJvZ3Jlc3MkeyhzZWdtZW50LnRyYW5zaXRpb24uZWFzZVBhcmFtcyA/IGAsICR7c2VnbWVudC50cmFuc2l0aW9uLmVhc2VQYXJhbXMubWFwKCh2KSA9PiB2LnRvUHJlY2lzaW9uKDQpKS5qb2luKGAsIGApfWAgOiBgYCl9KTtgIDogYGB9XHJcbiAgICAgIGA7XHJcbiAgICB9XHJcbiAgfSxcclxuICByZW5kZXJDaGVjazogZnVuY3Rpb24oc2VnbWVudCkge1xyXG4gICAgY29uc3Qgc3RhcnRUaW1lID0gc2VnbWVudC5zdGFydC50b1ByZWNpc2lvbig0KTtcclxuICAgIGNvbnN0IGVuZFRpbWUgPSAoc2VnbWVudC5lbmQgKyBzZWdtZW50LnRyYWlsKS50b1ByZWNpc2lvbig0KTtcclxuXHJcbiAgICByZXR1cm4gYGlmICh0aW1lIDwgJHtzdGFydFRpbWV9IHx8IHRpbWUgPiAke2VuZFRpbWV9KSByZXR1cm47YDtcclxuICB9XHJcbn07XHJcblxyXG5leHBvcnQgeyBUaW1lbGluZUNodW5rcyB9O1xyXG4iLCJpbXBvcnQgeyBUaW1lbGluZSB9IGZyb20gJy4vVGltZWxpbmUnO1xyXG5pbXBvcnQgeyBUaW1lbGluZUNodW5rcyB9IGZyb20gJy4vVGltZWxpbmVDaHVua3MnO1xyXG5pbXBvcnQgeyBWZWN0b3IzIH0gZnJvbSAndGhyZWUnO1xyXG5cclxuY29uc3QgVHJhbnNsYXRpb25TZWdtZW50ID0ge1xyXG4gIGNvbXBpbGVyOiBmdW5jdGlvbihzZWdtZW50KSB7XHJcbiAgICByZXR1cm4gYFxyXG4gICAgJHtUaW1lbGluZUNodW5rcy5kZWxheUR1cmF0aW9uKHNlZ21lbnQpfVxyXG4gICAgJHtUaW1lbGluZUNodW5rcy52ZWMzKGBjVHJhbnNsYXRlRnJvbSR7c2VnbWVudC5rZXl9YCwgc2VnbWVudC50cmFuc2l0aW9uLmZyb20sIDIpfVxyXG4gICAgJHtUaW1lbGluZUNodW5rcy52ZWMzKGBjVHJhbnNsYXRlVG8ke3NlZ21lbnQua2V5fWAsIHNlZ21lbnQudHJhbnNpdGlvbi50bywgMil9XHJcbiAgICBcclxuICAgIHZvaWQgYXBwbHlUcmFuc2Zvcm0ke3NlZ21lbnQua2V5fShmbG9hdCB0aW1lLCBpbm91dCB2ZWMzIHYpIHtcclxuICAgIFxyXG4gICAgICAke1RpbWVsaW5lQ2h1bmtzLnJlbmRlckNoZWNrKHNlZ21lbnQpfVxyXG4gICAgICAke1RpbWVsaW5lQ2h1bmtzLnByb2dyZXNzKHNlZ21lbnQpfVxyXG4gICAgXHJcbiAgICAgIHYgKz0gbWl4KGNUcmFuc2xhdGVGcm9tJHtzZWdtZW50LmtleX0sIGNUcmFuc2xhdGVUbyR7c2VnbWVudC5rZXl9LCBwcm9ncmVzcyk7XHJcbiAgICB9XHJcbiAgICBgO1xyXG4gIH0sXHJcbiAgZGVmYXVsdEZyb206IG5ldyBWZWN0b3IzKDAsIDAsIDApXHJcbn07XHJcblxyXG5UaW1lbGluZS5yZWdpc3RlcigndHJhbnNsYXRlJywgVHJhbnNsYXRpb25TZWdtZW50KTtcclxuXHJcbmV4cG9ydCB7IFRyYW5zbGF0aW9uU2VnbWVudCB9O1xyXG4iLCJpbXBvcnQgeyBUaW1lbGluZSB9IGZyb20gJy4vVGltZWxpbmUnO1xyXG5pbXBvcnQgeyBUaW1lbGluZUNodW5rcyB9IGZyb20gJy4vVGltZWxpbmVDaHVua3MnO1xyXG5pbXBvcnQgeyBWZWN0b3IzIH0gZnJvbSAndGhyZWUnO1xyXG5cclxuY29uc3QgU2NhbGVTZWdtZW50ID0ge1xyXG4gIGNvbXBpbGVyOiBmdW5jdGlvbihzZWdtZW50KSB7XHJcbiAgICBjb25zdCBvcmlnaW4gPSBzZWdtZW50LnRyYW5zaXRpb24ub3JpZ2luO1xyXG4gICAgXHJcbiAgICByZXR1cm4gYFxyXG4gICAgJHtUaW1lbGluZUNodW5rcy5kZWxheUR1cmF0aW9uKHNlZ21lbnQpfVxyXG4gICAgJHtUaW1lbGluZUNodW5rcy52ZWMzKGBjU2NhbGVGcm9tJHtzZWdtZW50LmtleX1gLCBzZWdtZW50LnRyYW5zaXRpb24uZnJvbSwgMil9XHJcbiAgICAke1RpbWVsaW5lQ2h1bmtzLnZlYzMoYGNTY2FsZVRvJHtzZWdtZW50LmtleX1gLCBzZWdtZW50LnRyYW5zaXRpb24udG8sIDIpfVxyXG4gICAgJHtvcmlnaW4gPyBUaW1lbGluZUNodW5rcy52ZWMzKGBjT3JpZ2luJHtzZWdtZW50LmtleX1gLCBvcmlnaW4sIDIpIDogJyd9XHJcbiAgICBcclxuICAgIHZvaWQgYXBwbHlUcmFuc2Zvcm0ke3NlZ21lbnQua2V5fShmbG9hdCB0aW1lLCBpbm91dCB2ZWMzIHYpIHtcclxuICAgIFxyXG4gICAgICAke1RpbWVsaW5lQ2h1bmtzLnJlbmRlckNoZWNrKHNlZ21lbnQpfVxyXG4gICAgICAke1RpbWVsaW5lQ2h1bmtzLnByb2dyZXNzKHNlZ21lbnQpfVxyXG4gICAgXHJcbiAgICAgICR7b3JpZ2luID8gYHYgLT0gY09yaWdpbiR7c2VnbWVudC5rZXl9O2AgOiAnJ31cclxuICAgICAgdiAqPSBtaXgoY1NjYWxlRnJvbSR7c2VnbWVudC5rZXl9LCBjU2NhbGVUbyR7c2VnbWVudC5rZXl9LCBwcm9ncmVzcyk7XHJcbiAgICAgICR7b3JpZ2luID8gYHYgKz0gY09yaWdpbiR7c2VnbWVudC5rZXl9O2AgOiAnJ31cclxuICAgIH1cclxuICAgIGA7XHJcbiAgfSxcclxuICBkZWZhdWx0RnJvbTogbmV3IFZlY3RvcjMoMSwgMSwgMSlcclxufTtcclxuXHJcblRpbWVsaW5lLnJlZ2lzdGVyKCdzY2FsZScsIFNjYWxlU2VnbWVudCk7XHJcblxyXG5leHBvcnQgeyBTY2FsZVNlZ21lbnQgfTtcclxuIiwiaW1wb3J0IHsgVGltZWxpbmUgfSBmcm9tICcuL1RpbWVsaW5lJztcclxuaW1wb3J0IHsgVGltZWxpbmVDaHVua3MgfSBmcm9tICcuL1RpbWVsaW5lQ2h1bmtzJztcclxuaW1wb3J0IHsgVmVjdG9yMywgVmVjdG9yNCB9IGZyb20gJ3RocmVlJztcclxuXHJcbmNvbnN0IFJvdGF0aW9uU2VnbWVudCA9IHtcclxuICBjb21waWxlcihzZWdtZW50KSB7XHJcbiAgICBjb25zdCBmcm9tQXhpc0FuZ2xlID0gbmV3IFZlY3RvcjQoXHJcbiAgICAgIHNlZ21lbnQudHJhbnNpdGlvbi5mcm9tLmF4aXMueCxcclxuICAgICAgc2VnbWVudC50cmFuc2l0aW9uLmZyb20uYXhpcy55LFxyXG4gICAgICBzZWdtZW50LnRyYW5zaXRpb24uZnJvbS5heGlzLnosXHJcbiAgICAgIHNlZ21lbnQudHJhbnNpdGlvbi5mcm9tLmFuZ2xlXHJcbiAgICApO1xyXG4gIFxyXG4gICAgY29uc3QgdG9BeGlzID0gc2VnbWVudC50cmFuc2l0aW9uLnRvLmF4aXMgfHwgc2VnbWVudC50cmFuc2l0aW9uLmZyb20uYXhpcztcclxuICAgIGNvbnN0IHRvQXhpc0FuZ2xlID0gbmV3IFZlY3RvcjQoXHJcbiAgICAgIHRvQXhpcy54LFxyXG4gICAgICB0b0F4aXMueSxcclxuICAgICAgdG9BeGlzLnosXHJcbiAgICAgIHNlZ21lbnQudHJhbnNpdGlvbi50by5hbmdsZVxyXG4gICAgKTtcclxuICBcclxuICAgIGNvbnN0IG9yaWdpbiA9IHNlZ21lbnQudHJhbnNpdGlvbi5vcmlnaW47XHJcbiAgICBcclxuICAgIHJldHVybiBgXHJcbiAgICAke1RpbWVsaW5lQ2h1bmtzLmRlbGF5RHVyYXRpb24oc2VnbWVudCl9XHJcbiAgICAke1RpbWVsaW5lQ2h1bmtzLnZlYzQoYGNSb3RhdGlvbkZyb20ke3NlZ21lbnQua2V5fWAsIGZyb21BeGlzQW5nbGUsIDgpfVxyXG4gICAgJHtUaW1lbGluZUNodW5rcy52ZWM0KGBjUm90YXRpb25UbyR7c2VnbWVudC5rZXl9YCwgdG9BeGlzQW5nbGUsIDgpfVxyXG4gICAgJHtvcmlnaW4gPyBUaW1lbGluZUNodW5rcy52ZWMzKGBjT3JpZ2luJHtzZWdtZW50LmtleX1gLCBvcmlnaW4sIDIpIDogJyd9XHJcbiAgICBcclxuICAgIHZvaWQgYXBwbHlUcmFuc2Zvcm0ke3NlZ21lbnQua2V5fShmbG9hdCB0aW1lLCBpbm91dCB2ZWMzIHYpIHtcclxuICAgICAgJHtUaW1lbGluZUNodW5rcy5yZW5kZXJDaGVjayhzZWdtZW50KX1cclxuICAgICAgJHtUaW1lbGluZUNodW5rcy5wcm9ncmVzcyhzZWdtZW50KX1cclxuXHJcbiAgICAgICR7b3JpZ2luID8gYHYgLT0gY09yaWdpbiR7c2VnbWVudC5rZXl9O2AgOiAnJ31cclxuICAgICAgdmVjMyBheGlzID0gbm9ybWFsaXplKG1peChjUm90YXRpb25Gcm9tJHtzZWdtZW50LmtleX0ueHl6LCBjUm90YXRpb25UbyR7c2VnbWVudC5rZXl9Lnh5eiwgcHJvZ3Jlc3MpKTtcclxuICAgICAgZmxvYXQgYW5nbGUgPSBtaXgoY1JvdGF0aW9uRnJvbSR7c2VnbWVudC5rZXl9LncsIGNSb3RhdGlvblRvJHtzZWdtZW50LmtleX0udywgcHJvZ3Jlc3MpO1xyXG4gICAgICB2ZWM0IHEgPSBxdWF0RnJvbUF4aXNBbmdsZShheGlzLCBhbmdsZSk7XHJcbiAgICAgIHYgPSByb3RhdGVWZWN0b3IocSwgdik7XHJcbiAgICAgICR7b3JpZ2luID8gYHYgKz0gY09yaWdpbiR7c2VnbWVudC5rZXl9O2AgOiAnJ31cclxuICAgIH1cclxuICAgIGA7XHJcbiAgfSxcclxuICBkZWZhdWx0RnJvbToge2F4aXM6IG5ldyBWZWN0b3IzKCksIGFuZ2xlOiAwfVxyXG59O1xyXG5cclxuVGltZWxpbmUucmVnaXN0ZXIoJ3JvdGF0ZScsIFJvdGF0aW9uU2VnbWVudCk7XHJcblxyXG5leHBvcnQgeyBSb3RhdGlvblNlZ21lbnQgfTtcclxuIl0sIm5hbWVzIjpbIkJhc2VBbmltYXRpb25NYXRlcmlhbCIsInBhcmFtZXRlcnMiLCJ1bmlmb3JtcyIsImNhbGwiLCJ1bmlmb3JtVmFsdWVzIiwic2V0VmFsdWVzIiwiVW5pZm9ybXNVdGlscyIsIm1lcmdlIiwic2V0VW5pZm9ybVZhbHVlcyIsIm1hcCIsImRlZmluZXMiLCJub3JtYWxNYXAiLCJlbnZNYXAiLCJhb01hcCIsInNwZWN1bGFyTWFwIiwiYWxwaGFNYXAiLCJsaWdodE1hcCIsImVtaXNzaXZlTWFwIiwiYnVtcE1hcCIsImRpc3BsYWNlbWVudE1hcCIsInJvdWdobmVzc01hcCIsIm1ldGFsbmVzc01hcCIsImVudk1hcFR5cGVEZWZpbmUiLCJlbnZNYXBNb2RlRGVmaW5lIiwiZW52TWFwQmxlbmRpbmdEZWZpbmUiLCJtYXBwaW5nIiwiQ3ViZVJlZmxlY3Rpb25NYXBwaW5nIiwiQ3ViZVJlZnJhY3Rpb25NYXBwaW5nIiwiQ3ViZVVWUmVmbGVjdGlvbk1hcHBpbmciLCJDdWJlVVZSZWZyYWN0aW9uTWFwcGluZyIsIkVxdWlyZWN0YW5ndWxhclJlZmxlY3Rpb25NYXBwaW5nIiwiRXF1aXJlY3Rhbmd1bGFyUmVmcmFjdGlvbk1hcHBpbmciLCJTcGhlcmljYWxSZWZsZWN0aW9uTWFwcGluZyIsImNvbWJpbmUiLCJNaXhPcGVyYXRpb24iLCJBZGRPcGVyYXRpb24iLCJNdWx0aXBseU9wZXJhdGlvbiIsInByb3RvdHlwZSIsIk9iamVjdCIsImFzc2lnbiIsImNyZWF0ZSIsIlNoYWRlck1hdGVyaWFsIiwidmFsdWVzIiwia2V5cyIsImZvckVhY2giLCJrZXkiLCJ2YWx1ZSIsIm5hbWUiLCJqb2luIiwiQmFzaWNBbmltYXRpb25NYXRlcmlhbCIsInZhcnlpbmdQYXJhbWV0ZXJzIiwidmVydGV4UGFyYW1ldGVycyIsInZlcnRleEZ1bmN0aW9ucyIsInZlcnRleEluaXQiLCJ2ZXJ0ZXhOb3JtYWwiLCJ2ZXJ0ZXhQb3NpdGlvbiIsInZlcnRleENvbG9yIiwidmVydGV4UG9zdE1vcnBoIiwidmVydGV4UG9zdFNraW5uaW5nIiwiZnJhZ21lbnRGdW5jdGlvbnMiLCJmcmFnbWVudFBhcmFtZXRlcnMiLCJmcmFnbWVudEluaXQiLCJmcmFnbWVudE1hcCIsImZyYWdtZW50RGlmZnVzZSIsIlNoYWRlckxpYiIsImxpZ2h0cyIsInZlcnRleFNoYWRlciIsImNvbmNhdFZlcnRleFNoYWRlciIsImZyYWdtZW50U2hhZGVyIiwiY29uY2F0RnJhZ21lbnRTaGFkZXIiLCJjb25zdHJ1Y3RvciIsInN0cmluZ2lmeUNodW5rIiwiTGFtYmVydEFuaW1hdGlvbk1hdGVyaWFsIiwiZnJhZ21lbnRFbWlzc2l2ZSIsImZyYWdtZW50U3BlY3VsYXIiLCJQaG9uZ0FuaW1hdGlvbk1hdGVyaWFsIiwiU3RhbmRhcmRBbmltYXRpb25NYXRlcmlhbCIsImZyYWdtZW50Um91Z2huZXNzIiwiZnJhZ21lbnRNZXRhbG5lc3MiLCJQb2ludHNBbmltYXRpb25NYXRlcmlhbCIsImZyYWdtZW50U2hhcGUiLCJEZXB0aEFuaW1hdGlvbk1hdGVyaWFsIiwiZGVwdGhQYWNraW5nIiwiUkdCQURlcHRoUGFja2luZyIsImNsaXBwaW5nIiwiRGlzdGFuY2VBbmltYXRpb25NYXRlcmlhbCIsIlByZWZhYkJ1ZmZlckdlb21ldHJ5IiwicHJlZmFiIiwiY291bnQiLCJwcmVmYWJHZW9tZXRyeSIsImlzUHJlZmFiQnVmZmVyR2VvbWV0cnkiLCJpc0J1ZmZlckdlb21ldHJ5IiwicHJlZmFiQ291bnQiLCJwcmVmYWJWZXJ0ZXhDb3VudCIsImF0dHJpYnV0ZXMiLCJwb3NpdGlvbiIsInZlcnRpY2VzIiwibGVuZ3RoIiwiYnVmZmVySW5kaWNlcyIsImJ1ZmZlclBvc2l0aW9ucyIsIkJ1ZmZlckdlb21ldHJ5IiwicHJlZmFiSW5kaWNlcyIsInByZWZhYkluZGV4Q291bnQiLCJpbmRleCIsImFycmF5IiwiaSIsInB1c2giLCJwcmVmYWJGYWNlQ291bnQiLCJmYWNlcyIsImZhY2UiLCJhIiwiYiIsImMiLCJpbmRleEJ1ZmZlciIsIlVpbnQzMkFycmF5Iiwic2V0SW5kZXgiLCJCdWZmZXJBdHRyaWJ1dGUiLCJrIiwicG9zaXRpb25CdWZmZXIiLCJjcmVhdGVBdHRyaWJ1dGUiLCJwb3NpdGlvbnMiLCJvZmZzZXQiLCJqIiwicHJlZmFiVmVydGV4IiwieCIsInkiLCJ6IiwiYnVmZmVyVXZzIiwicHJlZmFiVXZzIiwidXYiLCJWZWN0b3IyIiwiZmFjZVZlcnRleFV2cyIsInV2QnVmZmVyIiwicHJlZmFiVXYiLCJpdGVtU2l6ZSIsImZhY3RvcnkiLCJidWZmZXIiLCJGbG9hdDMyQXJyYXkiLCJhdHRyaWJ1dGUiLCJhZGRBdHRyaWJ1dGUiLCJkYXRhIiwic2V0UHJlZmFiRGF0YSIsInByZWZhYkluZGV4IiwiTXVsdGlQcmVmYWJCdWZmZXJHZW9tZXRyeSIsInByZWZhYnMiLCJyZXBlYXRDb3VudCIsIkFycmF5IiwiaXNBcnJheSIsInByZWZhYkdlb21ldHJpZXMiLCJwcmVmYWJHZW9tZXRyaWVzQ291bnQiLCJwcmVmYWJWZXJ0ZXhDb3VudHMiLCJwIiwicmVwZWF0VmVydGV4Q291bnQiLCJyZWR1Y2UiLCJyIiwidiIsInJlcGVhdEluZGV4Q291bnQiLCJpbmRpY2VzIiwiZ2VvbWV0cnkiLCJpbmRleE9mZnNldCIsInByZWZhYk9mZnNldCIsInZlcnRleENvdW50IiwicHJlZmFiUG9zaXRpb25zIiwidXZzIiwiZXJyb3IiLCJ1dk9iamVjdHMiLCJwcmVmYWJHZW9tZXRyeUluZGV4IiwicHJlZmFiR2VvbWV0cnlWZXJ0ZXhDb3VudCIsIndob2xlIiwid2hvbGVPZmZzZXQiLCJwYXJ0IiwicGFydE9mZnNldCIsIlV0aWxzIiwiaWwiLCJuIiwidmEiLCJ2YiIsInZjIiwiY2xvbmUiLCJWZWN0b3IzIiwiYm94IiwidE1hdGgiLCJyYW5kRmxvYXQiLCJtaW4iLCJtYXgiLCJyYW5kRmxvYXRTcHJlYWQiLCJub3JtYWxpemUiLCJzb3VyY2VNYXRlcmlhbCIsIk1vZGVsQnVmZmVyR2VvbWV0cnkiLCJtb2RlbCIsIm9wdGlvbnMiLCJtb2RlbEdlb21ldHJ5IiwiZmFjZUNvdW50IiwiY29tcHV0ZUNlbnRyb2lkcyIsImxvY2FsaXplRmFjZXMiLCJjZW50cm9pZHMiLCJjb21wdXRlQ2VudHJvaWQiLCJjZW50cm9pZCIsInZlcnRleCIsImJ1ZmZlclVWcyIsImJ1ZmZlclNraW5uaW5nIiwic2tpbkluZGV4QnVmZmVyIiwic2tpbldlaWdodEJ1ZmZlciIsInNraW5JbmRleCIsInNraW5JbmRpY2VzIiwic2tpbldlaWdodCIsInNraW5XZWlnaHRzIiwidyIsInNldEZhY2VEYXRhIiwiZmFjZUluZGV4IiwiUG9pbnRCdWZmZXJHZW9tZXRyeSIsInBvaW50Q291bnQiLCJzZXRQb2ludERhdGEiLCJwb2ludEluZGV4IiwiU2hhZGVyQ2h1bmsiLCJjYXRtdWxsX3JvbV9zcGxpbmUiLCJjdWJpY19iZXppZXIiLCJlYXNlX2JhY2tfaW4iLCJlYXNlX2JhY2tfaW5fb3V0IiwiZWFzZV9iYWNrX291dCIsImVhc2VfYmV6aWVyIiwiZWFzZV9ib3VuY2VfaW4iLCJlYXNlX2JvdW5jZV9pbl9vdXQiLCJlYXNlX2JvdW5jZV9vdXQiLCJlYXNlX2NpcmNfaW4iLCJlYXNlX2NpcmNfaW5fb3V0IiwiZWFzZV9jaXJjX291dCIsImVhc2VfY3ViaWNfaW4iLCJlYXNlX2N1YmljX2luX291dCIsImVhc2VfY3ViaWNfb3V0IiwiZWFzZV9lbGFzdGljX2luIiwiZWFzZV9lbGFzdGljX2luX291dCIsImVhc2VfZWxhc3RpY19vdXQiLCJlYXNlX2V4cG9faW4iLCJlYXNlX2V4cG9faW5fb3V0IiwiZWFzZV9leHBvX291dCIsImVhc2VfcXVhZF9pbiIsImVhc2VfcXVhZF9pbl9vdXQiLCJlYXNlX3F1YWRfb3V0IiwiZWFzZV9xdWFydF9pbiIsImVhc2VfcXVhcnRfaW5fb3V0IiwiZWFzZV9xdWFydF9vdXQiLCJlYXNlX3F1aW50X2luIiwiZWFzZV9xdWludF9pbl9vdXQiLCJlYXNlX3F1aW50X291dCIsImVhc2Vfc2luZV9pbiIsImVhc2Vfc2luZV9pbl9vdXQiLCJlYXNlX3NpbmVfb3V0IiwicXVhZHJhdGljX2JlemllciIsInF1YXRlcm5pb25fcm90YXRpb24iLCJxdWF0ZXJuaW9uX3NsZXJwIiwiVGltZWxpbmVTZWdtZW50Iiwic3RhcnQiLCJkdXJhdGlvbiIsInRyYW5zaXRpb24iLCJjb21waWxlciIsInRyYWlsIiwiY29tcGlsZSIsImRlZmluZVByb3BlcnR5IiwiVGltZWxpbmUiLCJ0aW1lS2V5Iiwic2VnbWVudHMiLCJfX2tleSIsInNlZ21lbnREZWZpbml0aW9ucyIsInJlZ2lzdGVyIiwiZGVmaW5pdGlvbiIsImFkZCIsInRyYW5zaXRpb25zIiwicG9zaXRpb25PZmZzZXQiLCJfZXZhbCIsImV2YWwiLCJ1bmRlZmluZWQiLCJNYXRoIiwicHJvY2Vzc1RyYW5zaXRpb24iLCJmcm9tIiwiZGVmYXVsdEZyb20iLCJ0byIsInRvU3RyaW5nIiwiZmlsbEdhcHMiLCJzIiwiczAiLCJzMSIsImVuZCIsImdldFRyYW5zZm9ybUNhbGxzIiwidCIsIlRpbWVsaW5lQ2h1bmtzIiwidG9QcmVjaXNpb24iLCJzZWdtZW50IiwiZWFzZSIsImVhc2VQYXJhbXMiLCJzdGFydFRpbWUiLCJlbmRUaW1lIiwiVHJhbnNsYXRpb25TZWdtZW50IiwiZGVsYXlEdXJhdGlvbiIsInZlYzMiLCJyZW5kZXJDaGVjayIsInByb2dyZXNzIiwiU2NhbGVTZWdtZW50Iiwib3JpZ2luIiwiUm90YXRpb25TZWdtZW50IiwiZnJvbUF4aXNBbmds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
