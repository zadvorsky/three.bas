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
   * @type {THREE.Geometry}
   */
  this.prefabGeometry = prefab;

  /**
   * Number of prefabs.
   * @type {Number}
   */
  this.prefabCount = count;

  /**
   * Number of vertices of the prefab.
   * @type {Number}
   */
  this.prefabVertexCount = prefab.vertices.length;

  this.bufferIndices();
  this.bufferPositions();
}
PrefabBufferGeometry.prototype = Object.create(three.BufferGeometry.prototype);
PrefabBufferGeometry.prototype.constructor = PrefabBufferGeometry;

PrefabBufferGeometry.prototype.bufferIndices = function () {
  var prefabFaceCount = this.prefabGeometry.faces.length;
  var prefabIndexCount = this.prefabGeometry.faces.length * 3;
  var prefabIndices = [];

  for (var h = 0; h < prefabFaceCount; h++) {
    var face = this.prefabGeometry.faces[h];
    prefabIndices.push(face.a, face.b, face.c);
  }

  var indexBuffer = new Uint32Array(this.prefabCount * prefabIndexCount);

  this.setIndex(new three.BufferAttribute(indexBuffer, 1));

  for (var i = 0; i < this.prefabCount; i++) {
    for (var k = 0; k < prefabIndexCount; k++) {
      indexBuffer[i * prefabIndexCount + k] = prefabIndices[k] + i * this.prefabVertexCount;
    }
  }
};

PrefabBufferGeometry.prototype.bufferPositions = function () {
  var positionBuffer = this.createAttribute('position', 3).array;

  for (var i = 0, offset = 0; i < this.prefabCount; i++) {
    for (var j = 0; j < this.prefabVertexCount; j++, offset += 3) {
      var prefabVertex = this.prefabGeometry.vertices[j];

      positionBuffer[offset] = prefabVertex.x;
      positionBuffer[offset + 1] = prefabVertex.y;
      positionBuffer[offset + 2] = prefabVertex.z;
    }
  }
};

/**
 * Creates a THREE.BufferAttribute with UV coordinates.
 */
PrefabBufferGeometry.prototype.bufferUvs = function () {
  var prefabFaceCount = this.prefabGeometry.faces.length;
  var prefabVertexCount = this.prefabVertexCount = this.prefabGeometry.vertices.length;
  var prefabUvs = [];

  for (var h = 0; h < prefabFaceCount; h++) {
    var face = this.prefabGeometry.faces[h];
    var uv = this.prefabGeometry.faceVertexUvs[0][h];

    prefabUvs[face.a] = uv[0];
    prefabUvs[face.b] = uv[1];
    prefabUvs[face.c] = uv[2];
  }

  var uvBuffer = this.createAttribute('uv', 2);

  for (var i = 0, offset = 0; i < this.prefabCount; i++) {
    for (var j = 0; j < prefabVertexCount; j++, offset += 2) {
      var prefabUv = prefabUvs[j];

      uvBuffer.array[offset] = prefabUv.x;
      uvBuffer.array[offset + 1] = prefabUv.y;
    }
  }
};

/**
 * Creates a THREE.BufferAttribute on this geometry instance.
 *
 * @param {String} name Name of the attribute.
 * @param {Number} itemSize Number of floats per vertex (typically 1, 2, 3 or 4).
 * @param {function=} factory Function that will be called for each prefab upon creation. Accepts 3 arguments: data[], index and prefabCount. Calls setPrefabData.
 *
 * @returns {THREE.BufferAttribute}
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
 * @param {String|THREE.BufferAttribute} attribute The attribute or attribute name where the data is to be stored.
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
 * @param {function=} factory Function that will be called for each point upon creation. Accepts 3 arguments: data[], index and prefabCount. Calls setPrefabData.
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzLmpzIiwic291cmNlcyI6WyIuLi9zcmMvbWF0ZXJpYWxzL0Jhc2VBbmltYXRpb25NYXRlcmlhbC5qcyIsIi4uL3NyYy9tYXRlcmlhbHMvQmFzaWNBbmltYXRpb25NYXRlcmlhbC5qcyIsIi4uL3NyYy9tYXRlcmlhbHMvTGFtYmVydEFuaW1hdGlvbk1hdGVyaWFsLmpzIiwiLi4vc3JjL21hdGVyaWFscy9QaG9uZ0FuaW1hdGlvbk1hdGVyaWFsLmpzIiwiLi4vc3JjL21hdGVyaWFscy9TdGFuZGFyZEFuaW1hdGlvbk1hdGVyaWFsLmpzIiwiLi4vc3JjL21hdGVyaWFscy9Qb2ludHNBbmltYXRpb25NYXRlcmlhbC5qcyIsIi4uL3NyYy9tYXRlcmlhbHMvRGVwdGhBbmltYXRpb25NYXRlcmlhbC5qcyIsIi4uL3NyYy9tYXRlcmlhbHMvRGlzdGFuY2VBbmltYXRpb25NYXRlcmlhbC5qcyIsIi4uL3NyYy9nZW9tZXRyeS9QcmVmYWJCdWZmZXJHZW9tZXRyeS5qcyIsIi4uL3NyYy9VdGlscy5qcyIsIi4uL3NyYy9nZW9tZXRyeS9Nb2RlbEJ1ZmZlckdlb21ldHJ5LmpzIiwiLi4vc3JjL2dlb21ldHJ5L1BvaW50QnVmZmVyR2VvbWV0cnkuanMiLCIuLi9zcmMvU2hhZGVyQ2h1bmsuanMiLCIuLi9zcmMvdGltZWxpbmUvVGltZWxpbmVTZWdtZW50LmpzIiwiLi4vc3JjL3RpbWVsaW5lL1RpbWVsaW5lLmpzIiwiLi4vc3JjL3RpbWVsaW5lL1RpbWVsaW5lQ2h1bmtzLmpzIiwiLi4vc3JjL3RpbWVsaW5lL1RyYW5zbGF0aW9uU2VnbWVudC5qcyIsIi4uL3NyYy90aW1lbGluZS9TY2FsZVNlZ21lbnQuanMiLCIuLi9zcmMvdGltZWxpbmUvUm90YXRpb25TZWdtZW50LmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XHJcbiAgU2hhZGVyTWF0ZXJpYWwsXHJcbiAgVW5pZm9ybXNVdGlscyxcclxuICBDdWJlUmVmbGVjdGlvbk1hcHBpbmcsXHJcbiAgQ3ViZVJlZnJhY3Rpb25NYXBwaW5nLFxyXG4gIEN1YmVVVlJlZmxlY3Rpb25NYXBwaW5nLFxyXG4gIEN1YmVVVlJlZnJhY3Rpb25NYXBwaW5nLFxyXG4gIEVxdWlyZWN0YW5ndWxhclJlZmxlY3Rpb25NYXBwaW5nLFxyXG4gIEVxdWlyZWN0YW5ndWxhclJlZnJhY3Rpb25NYXBwaW5nLFxyXG4gIFNwaGVyaWNhbFJlZmxlY3Rpb25NYXBwaW5nLFxyXG4gIE1peE9wZXJhdGlvbixcclxuICBBZGRPcGVyYXRpb24sXHJcbiAgTXVsdGlwbHlPcGVyYXRpb25cclxufSBmcm9tICd0aHJlZSc7XHJcblxyXG5mdW5jdGlvbiBCYXNlQW5pbWF0aW9uTWF0ZXJpYWwocGFyYW1ldGVycywgdW5pZm9ybXMpIHtcclxuICBTaGFkZXJNYXRlcmlhbC5jYWxsKHRoaXMpO1xyXG4gIFxyXG4gIGNvbnN0IHVuaWZvcm1WYWx1ZXMgPSBwYXJhbWV0ZXJzLnVuaWZvcm1WYWx1ZXM7XHJcbiAgZGVsZXRlIHBhcmFtZXRlcnMudW5pZm9ybVZhbHVlcztcclxuICBcclxuICB0aGlzLnNldFZhbHVlcyhwYXJhbWV0ZXJzKTtcclxuICBcclxuICB0aGlzLnVuaWZvcm1zID0gVW5pZm9ybXNVdGlscy5tZXJnZShbdW5pZm9ybXMsIHRoaXMudW5pZm9ybXNdKTtcclxuICBcclxuICB0aGlzLnNldFVuaWZvcm1WYWx1ZXModW5pZm9ybVZhbHVlcyk7XHJcbiAgXHJcbiAgaWYgKHVuaWZvcm1WYWx1ZXMpIHtcclxuICAgIHVuaWZvcm1WYWx1ZXMubWFwICYmICh0aGlzLmRlZmluZXNbJ1VTRV9NQVAnXSA9ICcnKTtcclxuICAgIHVuaWZvcm1WYWx1ZXMubm9ybWFsTWFwICYmICh0aGlzLmRlZmluZXNbJ1VTRV9OT1JNQUxNQVAnXSA9ICcnKTtcclxuICAgIHVuaWZvcm1WYWx1ZXMuZW52TWFwICYmICh0aGlzLmRlZmluZXNbJ1VTRV9FTlZNQVAnXSA9ICcnKTtcclxuICAgIHVuaWZvcm1WYWx1ZXMuYW9NYXAgJiYgKHRoaXMuZGVmaW5lc1snVVNFX0FPTUFQJ10gPSAnJyk7XHJcbiAgICB1bmlmb3JtVmFsdWVzLnNwZWN1bGFyTWFwICYmICh0aGlzLmRlZmluZXNbJ1VTRV9TUEVDVUxBUk1BUCddID0gJycpO1xyXG4gICAgdW5pZm9ybVZhbHVlcy5hbHBoYU1hcCAmJiAodGhpcy5kZWZpbmVzWydVU0VfQUxQSEFNQVAnXSA9ICcnKTtcclxuICAgIHVuaWZvcm1WYWx1ZXMubGlnaHRNYXAgJiYgKHRoaXMuZGVmaW5lc1snVVNFX0xJR0hUTUFQJ10gPSAnJyk7XHJcbiAgICB1bmlmb3JtVmFsdWVzLmVtaXNzaXZlTWFwICYmICh0aGlzLmRlZmluZXNbJ1VTRV9FTUlTU0lWRU1BUCddID0gJycpO1xyXG4gICAgdW5pZm9ybVZhbHVlcy5idW1wTWFwICYmICh0aGlzLmRlZmluZXNbJ1VTRV9CVU1QTUFQJ10gPSAnJyk7XHJcbiAgICB1bmlmb3JtVmFsdWVzLmRpc3BsYWNlbWVudE1hcCAmJiAodGhpcy5kZWZpbmVzWydVU0VfRElTUExBQ0VNRU5UTUFQJ10gPSAnJyk7XHJcbiAgICB1bmlmb3JtVmFsdWVzLnJvdWdobmVzc01hcCAmJiAodGhpcy5kZWZpbmVzWydVU0VfRElTUExBQ0VNRU5UTUFQJ10gPSAnJyk7XHJcbiAgICB1bmlmb3JtVmFsdWVzLnJvdWdobmVzc01hcCAmJiAodGhpcy5kZWZpbmVzWydVU0VfUk9VR0hORVNTTUFQJ10gPSAnJyk7XHJcbiAgICB1bmlmb3JtVmFsdWVzLm1ldGFsbmVzc01hcCAmJiAodGhpcy5kZWZpbmVzWydVU0VfTUVUQUxORVNTTUFQJ10gPSAnJyk7XHJcbiAgXHJcbiAgICBpZiAodW5pZm9ybVZhbHVlcy5lbnZNYXApIHtcclxuICAgICAgdGhpcy5kZWZpbmVzWydVU0VfRU5WTUFQJ10gPSAnJztcclxuICAgIFxyXG4gICAgICBsZXQgZW52TWFwVHlwZURlZmluZSA9ICdFTlZNQVBfVFlQRV9DVUJFJztcclxuICAgICAgbGV0IGVudk1hcE1vZGVEZWZpbmUgPSAnRU5WTUFQX01PREVfUkVGTEVDVElPTic7XHJcbiAgICAgIGxldCBlbnZNYXBCbGVuZGluZ0RlZmluZSA9ICdFTlZNQVBfQkxFTkRJTkdfTVVMVElQTFknO1xyXG4gICAgXHJcbiAgICAgIHN3aXRjaCAodW5pZm9ybVZhbHVlcy5lbnZNYXAubWFwcGluZykge1xyXG4gICAgICAgIGNhc2UgQ3ViZVJlZmxlY3Rpb25NYXBwaW5nOlxyXG4gICAgICAgIGNhc2UgQ3ViZVJlZnJhY3Rpb25NYXBwaW5nOlxyXG4gICAgICAgICAgZW52TWFwVHlwZURlZmluZSA9ICdFTlZNQVBfVFlQRV9DVUJFJztcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgQ3ViZVVWUmVmbGVjdGlvbk1hcHBpbmc6XHJcbiAgICAgICAgY2FzZSBDdWJlVVZSZWZyYWN0aW9uTWFwcGluZzpcclxuICAgICAgICAgIGVudk1hcFR5cGVEZWZpbmUgPSAnRU5WTUFQX1RZUEVfQ1VCRV9VVic7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIEVxdWlyZWN0YW5ndWxhclJlZmxlY3Rpb25NYXBwaW5nOlxyXG4gICAgICAgIGNhc2UgRXF1aXJlY3Rhbmd1bGFyUmVmcmFjdGlvbk1hcHBpbmc6XHJcbiAgICAgICAgICBlbnZNYXBUeXBlRGVmaW5lID0gJ0VOVk1BUF9UWVBFX0VRVUlSRUMnO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSBTcGhlcmljYWxSZWZsZWN0aW9uTWFwcGluZzpcclxuICAgICAgICAgIGVudk1hcFR5cGVEZWZpbmUgPSAnRU5WTUFQX1RZUEVfU1BIRVJFJztcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICB9XHJcbiAgICBcclxuICAgICAgc3dpdGNoICh1bmlmb3JtVmFsdWVzLmVudk1hcC5tYXBwaW5nKSB7XHJcbiAgICAgICAgY2FzZSBDdWJlUmVmcmFjdGlvbk1hcHBpbmc6XHJcbiAgICAgICAgY2FzZSBFcXVpcmVjdGFuZ3VsYXJSZWZyYWN0aW9uTWFwcGluZzpcclxuICAgICAgICAgIGVudk1hcE1vZGVEZWZpbmUgPSAnRU5WTUFQX01PREVfUkVGUkFDVElPTic7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgfVxyXG4gICAgXHJcbiAgICAgIHN3aXRjaCAodW5pZm9ybVZhbHVlcy5jb21iaW5lKSB7XHJcbiAgICAgICAgY2FzZSBNaXhPcGVyYXRpb246XHJcbiAgICAgICAgICBlbnZNYXBCbGVuZGluZ0RlZmluZSA9ICdFTlZNQVBfQkxFTkRJTkdfTUlYJztcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgQWRkT3BlcmF0aW9uOlxyXG4gICAgICAgICAgZW52TWFwQmxlbmRpbmdEZWZpbmUgPSAnRU5WTUFQX0JMRU5ESU5HX0FERCc7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIE11bHRpcGx5T3BlcmF0aW9uOlxyXG4gICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICBlbnZNYXBCbGVuZGluZ0RlZmluZSA9ICdFTlZNQVBfQkxFTkRJTkdfTVVMVElQTFknO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgIH1cclxuICAgIFxyXG4gICAgICB0aGlzLmRlZmluZXNbZW52TWFwVHlwZURlZmluZV0gPSAnJztcclxuICAgICAgdGhpcy5kZWZpbmVzW2Vudk1hcEJsZW5kaW5nRGVmaW5lXSA9ICcnO1xyXG4gICAgICB0aGlzLmRlZmluZXNbZW52TWFwTW9kZURlZmluZV0gPSAnJztcclxuICAgIH1cclxuICB9XHJcbn1cclxuXHJcbkJhc2VBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUgPSBPYmplY3QuYXNzaWduKE9iamVjdC5jcmVhdGUoU2hhZGVyTWF0ZXJpYWwucHJvdG90eXBlKSwge1xyXG4gIGNvbnN0cnVjdG9yOiBCYXNlQW5pbWF0aW9uTWF0ZXJpYWwsXHJcbiAgXHJcbiAgc2V0VW5pZm9ybVZhbHVlcyh2YWx1ZXMpIHtcclxuICAgIGlmICghdmFsdWVzKSByZXR1cm47XHJcbiAgICBcclxuICAgIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyh2YWx1ZXMpO1xyXG4gICAgXHJcbiAgICBrZXlzLmZvckVhY2goKGtleSkgPT4ge1xyXG4gICAgICBrZXkgaW4gdGhpcy51bmlmb3JtcyAmJiAodGhpcy51bmlmb3Jtc1trZXldLnZhbHVlID0gdmFsdWVzW2tleV0pO1xyXG4gICAgfSk7XHJcbiAgfSxcclxuICBcclxuICBzdHJpbmdpZnlDaHVuayhuYW1lKSB7XHJcbiAgICBsZXQgdmFsdWU7XHJcbiAgICBcclxuICAgIGlmICghdGhpc1tuYW1lXSkge1xyXG4gICAgICB2YWx1ZSA9ICcnO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAodHlwZW9mIHRoaXNbbmFtZV0gPT09ICAnc3RyaW5nJykge1xyXG4gICAgICB2YWx1ZSA9IHRoaXNbbmFtZV07XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgdmFsdWUgPSB0aGlzW25hbWVdLmpvaW4oJ1xcbicpO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICByZXR1cm4gdmFsdWU7XHJcbiAgfVxyXG59KTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IEJhc2VBbmltYXRpb25NYXRlcmlhbDtcclxuIiwiaW1wb3J0IHsgU2hhZGVyTGliIH0gZnJvbSAndGhyZWUnO1xyXG5pbXBvcnQgQmFzZUFuaW1hdGlvbk1hdGVyaWFsIGZyb20gJy4vQmFzZUFuaW1hdGlvbk1hdGVyaWFsJztcclxuXHJcbi8qKlxyXG4gKiBFeHRlbmRzIFRIUkVFLk1lc2hCYXNpY01hdGVyaWFsIHdpdGggY3VzdG9tIHNoYWRlciBjaHVua3MuXHJcbiAqXHJcbiAqIEBzZWUgaHR0cDovL3RocmVlLWJhcy1leGFtcGxlcy5zdXJnZS5zaC9leGFtcGxlcy9tYXRlcmlhbHNfYmFzaWMvXHJcbiAqXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBwYXJhbWV0ZXJzIE9iamVjdCBjb250YWluaW5nIG1hdGVyaWFsIHByb3BlcnRpZXMgYW5kIGN1c3RvbSBzaGFkZXIgY2h1bmtzLlxyXG4gKiBAY29uc3RydWN0b3JcclxuICovXHJcbmZ1bmN0aW9uIEJhc2ljQW5pbWF0aW9uTWF0ZXJpYWwocGFyYW1ldGVycykge1xyXG4gIHRoaXMudmFyeWluZ1BhcmFtZXRlcnMgPSBbXTtcclxuICBcclxuICB0aGlzLnZlcnRleFBhcmFtZXRlcnMgPSBbXTtcclxuICB0aGlzLnZlcnRleEZ1bmN0aW9ucyA9IFtdO1xyXG4gIHRoaXMudmVydGV4SW5pdCA9IFtdO1xyXG4gIHRoaXMudmVydGV4Tm9ybWFsID0gW107XHJcbiAgdGhpcy52ZXJ0ZXhQb3NpdGlvbiA9IFtdO1xyXG4gIHRoaXMudmVydGV4Q29sb3IgPSBbXTtcclxuICBcclxuICB0aGlzLmZyYWdtZW50RnVuY3Rpb25zID0gW107XHJcbiAgdGhpcy5mcmFnbWVudFBhcmFtZXRlcnMgPSBbXTtcclxuICB0aGlzLmZyYWdtZW50SW5pdCA9IFtdO1xyXG4gIHRoaXMuZnJhZ21lbnRNYXAgPSBbXTtcclxuICB0aGlzLmZyYWdtZW50RGlmZnVzZSA9IFtdO1xyXG4gIFxyXG4gIEJhc2VBbmltYXRpb25NYXRlcmlhbC5jYWxsKHRoaXMsIHBhcmFtZXRlcnMsIFNoYWRlckxpYlsnYmFzaWMnXS51bmlmb3Jtcyk7XHJcbiAgXHJcbiAgdGhpcy5saWdodHMgPSBmYWxzZTtcclxuICB0aGlzLnZlcnRleFNoYWRlciA9IHRoaXMuY29uY2F0VmVydGV4U2hhZGVyKCk7XHJcbiAgdGhpcy5mcmFnbWVudFNoYWRlciA9IHRoaXMuY29uY2F0RnJhZ21lbnRTaGFkZXIoKTtcclxufVxyXG5CYXNpY0FuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoQmFzZUFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZSk7XHJcbkJhc2ljQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gQmFzaWNBbmltYXRpb25NYXRlcmlhbDtcclxuXHJcbkJhc2ljQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlLmNvbmNhdFZlcnRleFNoYWRlciA9IGZ1bmN0aW9uKCkge1xyXG4gIHJldHVybiBgXHJcbiAgI2luY2x1ZGUgPGNvbW1vbj5cclxuICAjaW5jbHVkZSA8dXZfcGFyc192ZXJ0ZXg+XHJcbiAgI2luY2x1ZGUgPHV2Ml9wYXJzX3ZlcnRleD5cclxuICAjaW5jbHVkZSA8ZW52bWFwX3BhcnNfdmVydGV4PlxyXG4gICNpbmNsdWRlIDxjb2xvcl9wYXJzX3ZlcnRleD5cclxuICAjaW5jbHVkZSA8Zm9nX3BhcnNfdmVydGV4PlxyXG4gICNpbmNsdWRlIDxtb3JwaHRhcmdldF9wYXJzX3ZlcnRleD5cclxuICAjaW5jbHVkZSA8c2tpbm5pbmdfcGFyc192ZXJ0ZXg+XHJcbiAgI2luY2x1ZGUgPGxvZ2RlcHRoYnVmX3BhcnNfdmVydGV4PlxyXG4gICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfcGFyc192ZXJ0ZXg+XHJcbiAgXHJcbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQYXJhbWV0ZXJzJyl9XHJcbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2YXJ5aW5nUGFyYW1ldGVycycpfVxyXG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4RnVuY3Rpb25zJyl9XHJcbiAgXHJcbiAgdm9pZCBtYWluKCkge1xyXG5cclxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4SW5pdCcpfVxyXG4gIFxyXG4gICAgI2luY2x1ZGUgPHV2X3ZlcnRleD5cclxuICAgICNpbmNsdWRlIDx1djJfdmVydGV4PlxyXG4gICAgI2luY2x1ZGUgPGNvbG9yX3ZlcnRleD5cclxuICAgICNpbmNsdWRlIDxza2luYmFzZV92ZXJ0ZXg+XHJcbiAgXHJcbiAgICAjaWZkZWYgVVNFX0VOVk1BUFxyXG4gIFxyXG4gICAgI2luY2x1ZGUgPGJlZ2lubm9ybWFsX3ZlcnRleD5cclxuICAgIFxyXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhOb3JtYWwnKX1cclxuICAgIFxyXG4gICAgI2luY2x1ZGUgPG1vcnBobm9ybWFsX3ZlcnRleD5cclxuICAgICNpbmNsdWRlIDxza2lubm9ybWFsX3ZlcnRleD5cclxuICAgICNpbmNsdWRlIDxkZWZhdWx0bm9ybWFsX3ZlcnRleD5cclxuICBcclxuICAgICNlbmRpZlxyXG4gIFxyXG4gICAgI2luY2x1ZGUgPGJlZ2luX3ZlcnRleD5cclxuICAgIFxyXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQb3NpdGlvbicpfVxyXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhDb2xvcicpfVxyXG4gICAgXHJcbiAgICAjaW5jbHVkZSA8bW9ycGh0YXJnZXRfdmVydGV4PlxyXG4gICAgI2luY2x1ZGUgPHNraW5uaW5nX3ZlcnRleD5cclxuICAgICNpbmNsdWRlIDxwcm9qZWN0X3ZlcnRleD5cclxuICAgICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl92ZXJ0ZXg+XHJcbiAgXHJcbiAgICAjaW5jbHVkZSA8d29ybGRwb3NfdmVydGV4PlxyXG4gICAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc192ZXJ0ZXg+XHJcbiAgICAjaW5jbHVkZSA8ZW52bWFwX3ZlcnRleD5cclxuICAgICNpbmNsdWRlIDxmb2dfdmVydGV4PlxyXG4gIH1gO1xyXG59O1xyXG5cclxuQmFzaWNBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uY2F0RnJhZ21lbnRTaGFkZXIgPSBmdW5jdGlvbigpIHtcclxuICByZXR1cm4gYFxyXG4gIHVuaWZvcm0gdmVjMyBkaWZmdXNlO1xyXG4gIHVuaWZvcm0gZmxvYXQgb3BhY2l0eTtcclxuICBcclxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50UGFyYW1ldGVycycpfVxyXG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmFyeWluZ1BhcmFtZXRlcnMnKX1cclxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50RnVuY3Rpb25zJyl9XHJcbiAgXHJcbiAgI2lmbmRlZiBGTEFUX1NIQURFRFxyXG4gIFxyXG4gICAgdmFyeWluZyB2ZWMzIHZOb3JtYWw7XHJcbiAgXHJcbiAgI2VuZGlmXHJcbiAgXHJcbiAgI2luY2x1ZGUgPGNvbW1vbj5cclxuICAjaW5jbHVkZSA8Y29sb3JfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8dXZfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8dXYyX3BhcnNfZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPG1hcF9wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxhbHBoYW1hcF9wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxhb21hcF9wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxsaWdodG1hcF9wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxlbnZtYXBfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8Zm9nX3BhcnNfZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPHNwZWN1bGFybWFwX3BhcnNfZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPGxvZ2RlcHRoYnVmX3BhcnNfZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc19wYXJzX2ZyYWdtZW50PlxyXG4gIFxyXG4gIHZvaWQgbWFpbigpIHtcclxuICBcclxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRJbml0Jyl9XHJcbiAgXHJcbiAgICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX2ZyYWdtZW50PlxyXG5cclxuICAgIHZlYzQgZGlmZnVzZUNvbG9yID0gdmVjNCggZGlmZnVzZSwgb3BhY2l0eSApO1xyXG5cclxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnREaWZmdXNlJyl9XHJcbiAgXHJcbiAgICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfZnJhZ21lbnQ+XHJcbiAgICBcclxuICAgICR7KHRoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50TWFwJykgfHwgJyNpbmNsdWRlIDxtYXBfZnJhZ21lbnQ+Jyl9XHJcbiAgICBcclxuICAgICNpbmNsdWRlIDxjb2xvcl9mcmFnbWVudD5cclxuICAgICNpbmNsdWRlIDxhbHBoYW1hcF9mcmFnbWVudD5cclxuICAgICNpbmNsdWRlIDxhbHBoYXRlc3RfZnJhZ21lbnQ+XHJcbiAgICAjaW5jbHVkZSA8c3BlY3VsYXJtYXBfZnJhZ21lbnQ+XHJcbiAgXHJcbiAgICBSZWZsZWN0ZWRMaWdodCByZWZsZWN0ZWRMaWdodCA9IFJlZmxlY3RlZExpZ2h0KCB2ZWMzKCAwLjAgKSwgdmVjMyggMC4wICksIHZlYzMoIDAuMCApLCB2ZWMzKCAwLjAgKSApO1xyXG4gIFxyXG4gICAgLy8gYWNjdW11bGF0aW9uIChiYWtlZCBpbmRpcmVjdCBsaWdodGluZyBvbmx5KVxyXG4gICAgI2lmZGVmIFVTRV9MSUdIVE1BUFxyXG4gIFxyXG4gICAgICByZWZsZWN0ZWRMaWdodC5pbmRpcmVjdERpZmZ1c2UgKz0gdGV4dHVyZTJEKCBsaWdodE1hcCwgdlV2MiApLnh5eiAqIGxpZ2h0TWFwSW50ZW5zaXR5O1xyXG4gIFxyXG4gICAgI2Vsc2VcclxuICBcclxuICAgICAgcmVmbGVjdGVkTGlnaHQuaW5kaXJlY3REaWZmdXNlICs9IHZlYzMoIDEuMCApO1xyXG4gIFxyXG4gICAgI2VuZGlmXHJcbiAgXHJcbiAgICAvLyBtb2R1bGF0aW9uXHJcbiAgICAjaW5jbHVkZSA8YW9tYXBfZnJhZ21lbnQ+XHJcbiAgXHJcbiAgICByZWZsZWN0ZWRMaWdodC5pbmRpcmVjdERpZmZ1c2UgKj0gZGlmZnVzZUNvbG9yLnJnYjtcclxuICBcclxuICAgIHZlYzMgb3V0Z29pbmdMaWdodCA9IHJlZmxlY3RlZExpZ2h0LmluZGlyZWN0RGlmZnVzZTtcclxuICBcclxuICAgICNpbmNsdWRlIDxlbnZtYXBfZnJhZ21lbnQ+XHJcbiAgXHJcbiAgICBnbF9GcmFnQ29sb3IgPSB2ZWM0KCBvdXRnb2luZ0xpZ2h0LCBkaWZmdXNlQ29sb3IuYSApO1xyXG4gIFxyXG4gICAgI2luY2x1ZGUgPHByZW11bHRpcGxpZWRfYWxwaGFfZnJhZ21lbnQ+XHJcbiAgICAjaW5jbHVkZSA8dG9uZW1hcHBpbmdfZnJhZ21lbnQ+XHJcbiAgICAjaW5jbHVkZSA8ZW5jb2RpbmdzX2ZyYWdtZW50PlxyXG4gICAgI2luY2x1ZGUgPGZvZ19mcmFnbWVudD5cclxuICB9YDtcclxufTtcclxuXHJcbmV4cG9ydCB7IEJhc2ljQW5pbWF0aW9uTWF0ZXJpYWwgfTtcclxuIiwiaW1wb3J0IHsgU2hhZGVyTGliIH0gZnJvbSAndGhyZWUnO1xyXG5pbXBvcnQgQmFzZUFuaW1hdGlvbk1hdGVyaWFsIGZyb20gJy4vQmFzZUFuaW1hdGlvbk1hdGVyaWFsJztcclxuXHJcbi8qKlxyXG4gKiBFeHRlbmRzIFRIUkVFLk1lc2hMYW1iZXJ0TWF0ZXJpYWwgd2l0aCBjdXN0b20gc2hhZGVyIGNodW5rcy5cclxuICpcclxuICogQHNlZSBodHRwOi8vdGhyZWUtYmFzLWV4YW1wbGVzLnN1cmdlLnNoL2V4YW1wbGVzL21hdGVyaWFsc19sYW1iZXJ0L1xyXG4gKlxyXG4gKiBAcGFyYW0ge09iamVjdH0gcGFyYW1ldGVycyBPYmplY3QgY29udGFpbmluZyBtYXRlcmlhbCBwcm9wZXJ0aWVzIGFuZCBjdXN0b20gc2hhZGVyIGNodW5rcy5cclxuICogQGNvbnN0cnVjdG9yXHJcbiAqL1xyXG5mdW5jdGlvbiBMYW1iZXJ0QW5pbWF0aW9uTWF0ZXJpYWwocGFyYW1ldGVycykge1xyXG4gIHRoaXMudmFyeWluZ1BhcmFtZXRlcnMgPSBbXTtcclxuICBcclxuICB0aGlzLnZlcnRleEZ1bmN0aW9ucyA9IFtdO1xyXG4gIHRoaXMudmVydGV4UGFyYW1ldGVycyA9IFtdO1xyXG4gIHRoaXMudmVydGV4SW5pdCA9IFtdO1xyXG4gIHRoaXMudmVydGV4Tm9ybWFsID0gW107XHJcbiAgdGhpcy52ZXJ0ZXhQb3NpdGlvbiA9IFtdO1xyXG4gIHRoaXMudmVydGV4Q29sb3IgPSBbXTtcclxuICBcclxuICB0aGlzLmZyYWdtZW50RnVuY3Rpb25zID0gW107XHJcbiAgdGhpcy5mcmFnbWVudFBhcmFtZXRlcnMgPSBbXTtcclxuICB0aGlzLmZyYWdtZW50SW5pdCA9IFtdO1xyXG4gIHRoaXMuZnJhZ21lbnRNYXAgPSBbXTtcclxuICB0aGlzLmZyYWdtZW50RGlmZnVzZSA9IFtdO1xyXG4gIHRoaXMuZnJhZ21lbnRFbWlzc2l2ZSA9IFtdO1xyXG4gIHRoaXMuZnJhZ21lbnRTcGVjdWxhciA9IFtdO1xyXG4gIFxyXG4gIEJhc2VBbmltYXRpb25NYXRlcmlhbC5jYWxsKHRoaXMsIHBhcmFtZXRlcnMsIFNoYWRlckxpYlsnbGFtYmVydCddLnVuaWZvcm1zKTtcclxuICBcclxuICB0aGlzLmxpZ2h0cyA9IHRydWU7XHJcbiAgdGhpcy52ZXJ0ZXhTaGFkZXIgPSB0aGlzLmNvbmNhdFZlcnRleFNoYWRlcigpO1xyXG4gIHRoaXMuZnJhZ21lbnRTaGFkZXIgPSB0aGlzLmNvbmNhdEZyYWdtZW50U2hhZGVyKCk7XHJcbn1cclxuTGFtYmVydEFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoQmFzZUFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZSk7XHJcbkxhbWJlcnRBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBMYW1iZXJ0QW5pbWF0aW9uTWF0ZXJpYWw7XHJcblxyXG5MYW1iZXJ0QW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlLmNvbmNhdFZlcnRleFNoYWRlciA9IGZ1bmN0aW9uICgpIHtcclxuICByZXR1cm4gYFxyXG4gICNkZWZpbmUgTEFNQkVSVFxyXG5cclxuICB2YXJ5aW5nIHZlYzMgdkxpZ2h0RnJvbnQ7XHJcbiAgXHJcbiAgI2lmZGVmIERPVUJMRV9TSURFRFxyXG4gIFxyXG4gICAgdmFyeWluZyB2ZWMzIHZMaWdodEJhY2s7XHJcbiAgXHJcbiAgI2VuZGlmXHJcbiAgXHJcbiAgI2luY2x1ZGUgPGNvbW1vbj5cclxuICAjaW5jbHVkZSA8dXZfcGFyc192ZXJ0ZXg+XHJcbiAgI2luY2x1ZGUgPHV2Ml9wYXJzX3ZlcnRleD5cclxuICAjaW5jbHVkZSA8ZW52bWFwX3BhcnNfdmVydGV4PlxyXG4gICNpbmNsdWRlIDxic2Rmcz5cclxuICAjaW5jbHVkZSA8bGlnaHRzX3BhcnM+XHJcbiAgI2luY2x1ZGUgPGNvbG9yX3BhcnNfdmVydGV4PlxyXG4gICNpbmNsdWRlIDxmb2dfcGFyc192ZXJ0ZXg+XHJcbiAgI2luY2x1ZGUgPG1vcnBodGFyZ2V0X3BhcnNfdmVydGV4PlxyXG4gICNpbmNsdWRlIDxza2lubmluZ19wYXJzX3ZlcnRleD5cclxuICAjaW5jbHVkZSA8c2hhZG93bWFwX3BhcnNfdmVydGV4PlxyXG4gICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl9wYXJzX3ZlcnRleD5cclxuICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX3BhcnNfdmVydGV4PlxyXG4gIFxyXG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UGFyYW1ldGVycycpfVxyXG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmFyeWluZ1BhcmFtZXRlcnMnKX1cclxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleEZ1bmN0aW9ucycpfVxyXG4gIFxyXG4gIHZvaWQgbWFpbigpIHtcclxuICBcclxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4SW5pdCcpfVxyXG4gIFxyXG4gICAgI2luY2x1ZGUgPHV2X3ZlcnRleD5cclxuICAgICNpbmNsdWRlIDx1djJfdmVydGV4PlxyXG4gICAgI2luY2x1ZGUgPGNvbG9yX3ZlcnRleD5cclxuICBcclxuICAgICNpbmNsdWRlIDxiZWdpbm5vcm1hbF92ZXJ0ZXg+XHJcbiAgICBcclxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4Tm9ybWFsJyl9XHJcbiAgICBcclxuICAgICNpbmNsdWRlIDxtb3JwaG5vcm1hbF92ZXJ0ZXg+XHJcbiAgICAjaW5jbHVkZSA8c2tpbmJhc2VfdmVydGV4PlxyXG4gICAgI2luY2x1ZGUgPHNraW5ub3JtYWxfdmVydGV4PlxyXG4gICAgI2luY2x1ZGUgPGRlZmF1bHRub3JtYWxfdmVydGV4PlxyXG4gIFxyXG4gICAgI2luY2x1ZGUgPGJlZ2luX3ZlcnRleD5cclxuICAgIFxyXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQb3NpdGlvbicpfVxyXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhDb2xvcicpfVxyXG4gICAgXHJcbiAgICAjaW5jbHVkZSA8bW9ycGh0YXJnZXRfdmVydGV4PlxyXG4gICAgI2luY2x1ZGUgPHNraW5uaW5nX3ZlcnRleD5cclxuICAgICNpbmNsdWRlIDxwcm9qZWN0X3ZlcnRleD5cclxuICAgICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl92ZXJ0ZXg+XHJcbiAgICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX3ZlcnRleD5cclxuICBcclxuICAgICNpbmNsdWRlIDx3b3JsZHBvc192ZXJ0ZXg+XHJcbiAgICAjaW5jbHVkZSA8ZW52bWFwX3ZlcnRleD5cclxuICAgICNpbmNsdWRlIDxsaWdodHNfbGFtYmVydF92ZXJ0ZXg+XHJcbiAgICAjaW5jbHVkZSA8c2hhZG93bWFwX3ZlcnRleD5cclxuICAgICNpbmNsdWRlIDxmb2dfdmVydGV4PlxyXG4gIH1gO1xyXG59O1xyXG5cclxuTGFtYmVydEFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZS5jb25jYXRGcmFnbWVudFNoYWRlciA9IGZ1bmN0aW9uICgpIHtcclxuICByZXR1cm4gYFxyXG4gIHVuaWZvcm0gdmVjMyBkaWZmdXNlO1xyXG4gIHVuaWZvcm0gdmVjMyBlbWlzc2l2ZTtcclxuICB1bmlmb3JtIGZsb2F0IG9wYWNpdHk7XHJcbiAgXHJcbiAgdmFyeWluZyB2ZWMzIHZMaWdodEZyb250O1xyXG4gIFxyXG4gICNpZmRlZiBET1VCTEVfU0lERURcclxuICBcclxuICAgIHZhcnlpbmcgdmVjMyB2TGlnaHRCYWNrO1xyXG4gIFxyXG4gICNlbmRpZlxyXG4gIFxyXG4gICNpbmNsdWRlIDxjb21tb24+XHJcbiAgI2luY2x1ZGUgPHBhY2tpbmc+XHJcbiAgI2luY2x1ZGUgPGRpdGhlcmluZ19wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxjb2xvcl9wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDx1dl9wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDx1djJfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8bWFwX3BhcnNfZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPGFscGhhbWFwX3BhcnNfZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPGFvbWFwX3BhcnNfZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPGxpZ2h0bWFwX3BhcnNfZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPGVtaXNzaXZlbWFwX3BhcnNfZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPGVudm1hcF9wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxic2Rmcz5cclxuICAjaW5jbHVkZSA8bGlnaHRzX3BhcnM+XHJcbiAgI2luY2x1ZGUgPGZvZ19wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxzaGFkb3dtYXBfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8c2hhZG93bWFza19wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxzcGVjdWxhcm1hcF9wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl9wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfcGFyc19mcmFnbWVudD5cclxuICBcclxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50UGFyYW1ldGVycycpfVxyXG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmFyeWluZ1BhcmFtZXRlcnMnKX1cclxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50RnVuY3Rpb25zJyl9XHJcbiAgXHJcbiAgdm9pZCBtYWluKCkge1xyXG4gIFxyXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudEluaXQnKX1cclxuICBcclxuICAgICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfZnJhZ21lbnQ+XHJcblxyXG4gICAgdmVjNCBkaWZmdXNlQ29sb3IgPSB2ZWM0KCBkaWZmdXNlLCBvcGFjaXR5ICk7XHJcbiAgICBSZWZsZWN0ZWRMaWdodCByZWZsZWN0ZWRMaWdodCA9IFJlZmxlY3RlZExpZ2h0KCB2ZWMzKCAwLjAgKSwgdmVjMyggMC4wICksIHZlYzMoIDAuMCApLCB2ZWMzKCAwLjAgKSApO1xyXG4gICAgdmVjMyB0b3RhbEVtaXNzaXZlUmFkaWFuY2UgPSBlbWlzc2l2ZTtcclxuXHRcclxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnREaWZmdXNlJyl9XHJcbiAgXHJcbiAgICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfZnJhZ21lbnQ+XHJcblxyXG4gICAgJHsodGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRNYXAnKSB8fCAnI2luY2x1ZGUgPG1hcF9mcmFnbWVudD4nKX1cclxuXHJcbiAgICAjaW5jbHVkZSA8Y29sb3JfZnJhZ21lbnQ+XHJcbiAgICAjaW5jbHVkZSA8YWxwaGFtYXBfZnJhZ21lbnQ+XHJcbiAgICAjaW5jbHVkZSA8YWxwaGF0ZXN0X2ZyYWdtZW50PlxyXG4gICAgI2luY2x1ZGUgPHNwZWN1bGFybWFwX2ZyYWdtZW50PlxyXG5cclxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRFbWlzc2l2ZScpfVxyXG5cclxuICAgICNpbmNsdWRlIDxlbWlzc2l2ZW1hcF9mcmFnbWVudD5cclxuICBcclxuICAgIC8vIGFjY3VtdWxhdGlvblxyXG4gICAgcmVmbGVjdGVkTGlnaHQuaW5kaXJlY3REaWZmdXNlID0gZ2V0QW1iaWVudExpZ2h0SXJyYWRpYW5jZSggYW1iaWVudExpZ2h0Q29sb3IgKTtcclxuICBcclxuICAgICNpbmNsdWRlIDxsaWdodG1hcF9mcmFnbWVudD5cclxuICBcclxuICAgIHJlZmxlY3RlZExpZ2h0LmluZGlyZWN0RGlmZnVzZSAqPSBCUkRGX0RpZmZ1c2VfTGFtYmVydCggZGlmZnVzZUNvbG9yLnJnYiApO1xyXG4gIFxyXG4gICAgI2lmZGVmIERPVUJMRV9TSURFRFxyXG4gIFxyXG4gICAgICByZWZsZWN0ZWRMaWdodC5kaXJlY3REaWZmdXNlID0gKCBnbF9Gcm9udEZhY2luZyApID8gdkxpZ2h0RnJvbnQgOiB2TGlnaHRCYWNrO1xyXG4gIFxyXG4gICAgI2Vsc2VcclxuICBcclxuICAgICAgcmVmbGVjdGVkTGlnaHQuZGlyZWN0RGlmZnVzZSA9IHZMaWdodEZyb250O1xyXG4gIFxyXG4gICAgI2VuZGlmXHJcbiAgXHJcbiAgICByZWZsZWN0ZWRMaWdodC5kaXJlY3REaWZmdXNlICo9IEJSREZfRGlmZnVzZV9MYW1iZXJ0KCBkaWZmdXNlQ29sb3IucmdiICkgKiBnZXRTaGFkb3dNYXNrKCk7XHJcbiAgXHJcbiAgICAvLyBtb2R1bGF0aW9uXHJcbiAgICAjaW5jbHVkZSA8YW9tYXBfZnJhZ21lbnQ+XHJcbiAgXHJcbiAgICB2ZWMzIG91dGdvaW5nTGlnaHQgPSByZWZsZWN0ZWRMaWdodC5kaXJlY3REaWZmdXNlICsgcmVmbGVjdGVkTGlnaHQuaW5kaXJlY3REaWZmdXNlICsgdG90YWxFbWlzc2l2ZVJhZGlhbmNlO1xyXG4gIFxyXG4gICAgI2luY2x1ZGUgPGVudm1hcF9mcmFnbWVudD5cclxuICBcclxuICAgIGdsX0ZyYWdDb2xvciA9IHZlYzQoIG91dGdvaW5nTGlnaHQsIGRpZmZ1c2VDb2xvci5hICk7XHJcbiAgXHJcbiAgICAjaW5jbHVkZSA8dG9uZW1hcHBpbmdfZnJhZ21lbnQ+XHJcbiAgICAjaW5jbHVkZSA8ZW5jb2RpbmdzX2ZyYWdtZW50PlxyXG4gICAgI2luY2x1ZGUgPGZvZ19mcmFnbWVudD5cclxuICAgICNpbmNsdWRlIDxwcmVtdWx0aXBsaWVkX2FscGhhX2ZyYWdtZW50PlxyXG4gICAgI2luY2x1ZGUgPGRpdGhlcmluZ19mcmFnbWVudD5cclxuICB9YDtcclxufTtcclxuXHJcbmV4cG9ydCB7IExhbWJlcnRBbmltYXRpb25NYXRlcmlhbCB9O1xyXG4iLCJpbXBvcnQgeyBTaGFkZXJMaWIgfSBmcm9tICd0aHJlZSc7XHJcbmltcG9ydCBCYXNlQW5pbWF0aW9uTWF0ZXJpYWwgZnJvbSAnLi9CYXNlQW5pbWF0aW9uTWF0ZXJpYWwnO1xyXG5cclxuLyoqXHJcbiAqIEV4dGVuZHMgVEhSRUUuTWVzaFBob25nTWF0ZXJpYWwgd2l0aCBjdXN0b20gc2hhZGVyIGNodW5rcy5cclxuICpcclxuICogQHNlZSBodHRwOi8vdGhyZWUtYmFzLWV4YW1wbGVzLnN1cmdlLnNoL2V4YW1wbGVzL21hdGVyaWFsc19waG9uZy9cclxuICpcclxuICogQHBhcmFtIHtPYmplY3R9IHBhcmFtZXRlcnMgT2JqZWN0IGNvbnRhaW5pbmcgbWF0ZXJpYWwgcHJvcGVydGllcyBhbmQgY3VzdG9tIHNoYWRlciBjaHVua3MuXHJcbiAqIEBjb25zdHJ1Y3RvclxyXG4gKi9cclxuZnVuY3Rpb24gUGhvbmdBbmltYXRpb25NYXRlcmlhbChwYXJhbWV0ZXJzKSB7XHJcbiAgdGhpcy52YXJ5aW5nUGFyYW1ldGVycyA9IFtdO1xyXG5cclxuICB0aGlzLnZlcnRleEZ1bmN0aW9ucyA9IFtdO1xyXG4gIHRoaXMudmVydGV4UGFyYW1ldGVycyA9IFtdO1xyXG4gIHRoaXMudmVydGV4SW5pdCA9IFtdO1xyXG4gIHRoaXMudmVydGV4Tm9ybWFsID0gW107XHJcbiAgdGhpcy52ZXJ0ZXhQb3NpdGlvbiA9IFtdO1xyXG4gIHRoaXMudmVydGV4Q29sb3IgPSBbXTtcclxuXHJcbiAgdGhpcy5mcmFnbWVudEZ1bmN0aW9ucyA9IFtdO1xyXG4gIHRoaXMuZnJhZ21lbnRQYXJhbWV0ZXJzID0gW107XHJcbiAgdGhpcy5mcmFnbWVudEluaXQgPSBbXTtcclxuICB0aGlzLmZyYWdtZW50TWFwID0gW107XHJcbiAgdGhpcy5mcmFnbWVudERpZmZ1c2UgPSBbXTtcclxuICB0aGlzLmZyYWdtZW50RW1pc3NpdmUgPSBbXTtcclxuICB0aGlzLmZyYWdtZW50U3BlY3VsYXIgPSBbXTtcclxuXHJcbiAgQmFzZUFuaW1hdGlvbk1hdGVyaWFsLmNhbGwodGhpcywgcGFyYW1ldGVycywgU2hhZGVyTGliWydwaG9uZyddLnVuaWZvcm1zKTtcclxuXHJcbiAgdGhpcy5saWdodHMgPSB0cnVlO1xyXG4gIHRoaXMudmVydGV4U2hhZGVyID0gdGhpcy5jb25jYXRWZXJ0ZXhTaGFkZXIoKTtcclxuICB0aGlzLmZyYWdtZW50U2hhZGVyID0gdGhpcy5jb25jYXRGcmFnbWVudFNoYWRlcigpO1xyXG59XHJcblBob25nQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShCYXNlQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlKTtcclxuUGhvbmdBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBQaG9uZ0FuaW1hdGlvbk1hdGVyaWFsO1xyXG5cclxuUGhvbmdBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uY2F0VmVydGV4U2hhZGVyID0gZnVuY3Rpb24gKCkge1xyXG4gIHJldHVybiBgXHJcbiAgI2RlZmluZSBQSE9OR1xyXG5cclxuICB2YXJ5aW5nIHZlYzMgdlZpZXdQb3NpdGlvbjtcclxuICBcclxuICAjaWZuZGVmIEZMQVRfU0hBREVEXHJcbiAgXHJcbiAgICB2YXJ5aW5nIHZlYzMgdk5vcm1hbDtcclxuICBcclxuICAjZW5kaWZcclxuICBcclxuICAjaW5jbHVkZSA8Y29tbW9uPlxyXG4gICNpbmNsdWRlIDx1dl9wYXJzX3ZlcnRleD5cclxuICAjaW5jbHVkZSA8dXYyX3BhcnNfdmVydGV4PlxyXG4gICNpbmNsdWRlIDxkaXNwbGFjZW1lbnRtYXBfcGFyc192ZXJ0ZXg+XHJcbiAgI2luY2x1ZGUgPGVudm1hcF9wYXJzX3ZlcnRleD5cclxuICAjaW5jbHVkZSA8Y29sb3JfcGFyc192ZXJ0ZXg+XHJcbiAgI2luY2x1ZGUgPGZvZ19wYXJzX3ZlcnRleD5cclxuICAjaW5jbHVkZSA8bW9ycGh0YXJnZXRfcGFyc192ZXJ0ZXg+XHJcbiAgI2luY2x1ZGUgPHNraW5uaW5nX3BhcnNfdmVydGV4PlxyXG4gICNpbmNsdWRlIDxzaGFkb3dtYXBfcGFyc192ZXJ0ZXg+XHJcbiAgI2luY2x1ZGUgPGxvZ2RlcHRoYnVmX3BhcnNfdmVydGV4PlxyXG4gICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfcGFyc192ZXJ0ZXg+XHJcbiAgXHJcbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQYXJhbWV0ZXJzJyl9XHJcbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2YXJ5aW5nUGFyYW1ldGVycycpfVxyXG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4RnVuY3Rpb25zJyl9XHJcbiAgXHJcbiAgdm9pZCBtYWluKCkge1xyXG4gIFxyXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhJbml0Jyl9XHJcbiAgXHJcbiAgICAjaW5jbHVkZSA8dXZfdmVydGV4PlxyXG4gICAgI2luY2x1ZGUgPHV2Ml92ZXJ0ZXg+XHJcbiAgICAjaW5jbHVkZSA8Y29sb3JfdmVydGV4PlxyXG4gIFxyXG4gICAgI2luY2x1ZGUgPGJlZ2lubm9ybWFsX3ZlcnRleD5cclxuICAgIFxyXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhOb3JtYWwnKX1cclxuICAgIFxyXG4gICAgI2luY2x1ZGUgPG1vcnBobm9ybWFsX3ZlcnRleD5cclxuICAgICNpbmNsdWRlIDxza2luYmFzZV92ZXJ0ZXg+XHJcbiAgICAjaW5jbHVkZSA8c2tpbm5vcm1hbF92ZXJ0ZXg+XHJcbiAgICAjaW5jbHVkZSA8ZGVmYXVsdG5vcm1hbF92ZXJ0ZXg+XHJcbiAgXHJcbiAgI2lmbmRlZiBGTEFUX1NIQURFRCAvLyBOb3JtYWwgY29tcHV0ZWQgd2l0aCBkZXJpdmF0aXZlcyB3aGVuIEZMQVRfU0hBREVEXHJcbiAgXHJcbiAgICB2Tm9ybWFsID0gbm9ybWFsaXplKCB0cmFuc2Zvcm1lZE5vcm1hbCApO1xyXG4gIFxyXG4gICNlbmRpZlxyXG4gIFxyXG4gICAgI2luY2x1ZGUgPGJlZ2luX3ZlcnRleD5cclxuICAgIFxyXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQb3NpdGlvbicpfVxyXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhDb2xvcicpfVxyXG4gICAgXHJcbiAgICAjaW5jbHVkZSA8bW9ycGh0YXJnZXRfdmVydGV4PlxyXG4gICAgI2luY2x1ZGUgPHNraW5uaW5nX3ZlcnRleD5cclxuICAgICNpbmNsdWRlIDxkaXNwbGFjZW1lbnRtYXBfdmVydGV4PlxyXG4gICAgI2luY2x1ZGUgPHByb2plY3RfdmVydGV4PlxyXG4gICAgI2luY2x1ZGUgPGxvZ2RlcHRoYnVmX3ZlcnRleD5cclxuICAgICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfdmVydGV4PlxyXG4gIFxyXG4gICAgdlZpZXdQb3NpdGlvbiA9IC0gbXZQb3NpdGlvbi54eXo7XHJcbiAgXHJcbiAgICAjaW5jbHVkZSA8d29ybGRwb3NfdmVydGV4PlxyXG4gICAgI2luY2x1ZGUgPGVudm1hcF92ZXJ0ZXg+XHJcbiAgICAjaW5jbHVkZSA8c2hhZG93bWFwX3ZlcnRleD5cclxuICAgICNpbmNsdWRlIDxmb2dfdmVydGV4PlxyXG4gIH1gO1xyXG59O1xyXG5cclxuUGhvbmdBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uY2F0RnJhZ21lbnRTaGFkZXIgPSBmdW5jdGlvbiAoKSB7XHJcbiAgcmV0dXJuIGBcclxuICAjZGVmaW5lIFBIT05HXHJcblxyXG4gIHVuaWZvcm0gdmVjMyBkaWZmdXNlO1xyXG4gIHVuaWZvcm0gdmVjMyBlbWlzc2l2ZTtcclxuICB1bmlmb3JtIHZlYzMgc3BlY3VsYXI7XHJcbiAgdW5pZm9ybSBmbG9hdCBzaGluaW5lc3M7XHJcbiAgdW5pZm9ybSBmbG9hdCBvcGFjaXR5O1xyXG4gIFxyXG4gICNpbmNsdWRlIDxjb21tb24+XHJcbiAgI2luY2x1ZGUgPHBhY2tpbmc+XHJcbiAgI2luY2x1ZGUgPGRpdGhlcmluZ19wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxjb2xvcl9wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDx1dl9wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDx1djJfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8bWFwX3BhcnNfZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPGFscGhhbWFwX3BhcnNfZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPGFvbWFwX3BhcnNfZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPGxpZ2h0bWFwX3BhcnNfZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPGVtaXNzaXZlbWFwX3BhcnNfZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPGVudm1hcF9wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxncmFkaWVudG1hcF9wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxmb2dfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8YnNkZnM+XHJcbiAgI2luY2x1ZGUgPGxpZ2h0c19wYXJzPlxyXG4gICNpbmNsdWRlIDxsaWdodHNfcGhvbmdfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8c2hhZG93bWFwX3BhcnNfZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPGJ1bXBtYXBfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8bm9ybWFsbWFwX3BhcnNfZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPHNwZWN1bGFybWFwX3BhcnNfZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPGxvZ2RlcHRoYnVmX3BhcnNfZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc19wYXJzX2ZyYWdtZW50PlxyXG4gIFxyXG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRQYXJhbWV0ZXJzJyl9XHJcbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2YXJ5aW5nUGFyYW1ldGVycycpfVxyXG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRGdW5jdGlvbnMnKX1cclxuICBcclxuICB2b2lkIG1haW4oKSB7XHJcbiAgXHJcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50SW5pdCcpfVxyXG4gIFxyXG4gICAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc19mcmFnbWVudD5cclxuICBcclxuICAgIHZlYzQgZGlmZnVzZUNvbG9yID0gdmVjNCggZGlmZnVzZSwgb3BhY2l0eSApO1xyXG4gICAgUmVmbGVjdGVkTGlnaHQgcmVmbGVjdGVkTGlnaHQgPSBSZWZsZWN0ZWRMaWdodCggdmVjMyggMC4wICksIHZlYzMoIDAuMCApLCB2ZWMzKCAwLjAgKSwgdmVjMyggMC4wICkgKTtcclxuICAgIHZlYzMgdG90YWxFbWlzc2l2ZVJhZGlhbmNlID0gZW1pc3NpdmU7XHJcbiAgXHJcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50RGlmZnVzZScpfVxyXG4gIFxyXG4gICAgI2luY2x1ZGUgPGxvZ2RlcHRoYnVmX2ZyYWdtZW50PlxyXG5cclxuICAgICR7KHRoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50TWFwJykgfHwgJyNpbmNsdWRlIDxtYXBfZnJhZ21lbnQ+Jyl9XHJcblxyXG4gICAgI2luY2x1ZGUgPGNvbG9yX2ZyYWdtZW50PlxyXG4gICAgI2luY2x1ZGUgPGFscGhhbWFwX2ZyYWdtZW50PlxyXG4gICAgI2luY2x1ZGUgPGFscGhhdGVzdF9mcmFnbWVudD5cclxuICAgICNpbmNsdWRlIDxzcGVjdWxhcm1hcF9mcmFnbWVudD5cclxuICAgICNpbmNsdWRlIDxub3JtYWxfZnJhZ21lbnQ+XHJcbiAgICBcclxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRFbWlzc2l2ZScpfVxyXG4gICAgXHJcbiAgICAjaW5jbHVkZSA8ZW1pc3NpdmVtYXBfZnJhZ21lbnQ+XHJcbiAgXHJcbiAgICAvLyBhY2N1bXVsYXRpb25cclxuICAgICNpbmNsdWRlIDxsaWdodHNfcGhvbmdfZnJhZ21lbnQ+XHJcbiAgICBcclxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRTcGVjdWxhcicpfVxyXG4gICAgXHJcbiAgICAjaW5jbHVkZSA8bGlnaHRzX3RlbXBsYXRlPlxyXG4gIFxyXG4gICAgLy8gbW9kdWxhdGlvblxyXG4gICAgI2luY2x1ZGUgPGFvbWFwX2ZyYWdtZW50PlxyXG4gIFxyXG4gICAgdmVjMyBvdXRnb2luZ0xpZ2h0ID0gcmVmbGVjdGVkTGlnaHQuZGlyZWN0RGlmZnVzZSArIHJlZmxlY3RlZExpZ2h0LmluZGlyZWN0RGlmZnVzZSArIHJlZmxlY3RlZExpZ2h0LmRpcmVjdFNwZWN1bGFyICsgcmVmbGVjdGVkTGlnaHQuaW5kaXJlY3RTcGVjdWxhciArIHRvdGFsRW1pc3NpdmVSYWRpYW5jZTtcclxuICBcclxuICAgICNpbmNsdWRlIDxlbnZtYXBfZnJhZ21lbnQ+XHJcbiAgXHJcbiAgICBnbF9GcmFnQ29sb3IgPSB2ZWM0KCBvdXRnb2luZ0xpZ2h0LCBkaWZmdXNlQ29sb3IuYSApO1xyXG4gIFxyXG4gICAgI2luY2x1ZGUgPHRvbmVtYXBwaW5nX2ZyYWdtZW50PlxyXG4gICAgI2luY2x1ZGUgPGVuY29kaW5nc19mcmFnbWVudD5cclxuICAgICNpbmNsdWRlIDxmb2dfZnJhZ21lbnQ+XHJcbiAgICAjaW5jbHVkZSA8cHJlbXVsdGlwbGllZF9hbHBoYV9mcmFnbWVudD5cclxuICAgICNpbmNsdWRlIDxkaXRoZXJpbmdfZnJhZ21lbnQ+XHJcbiAgXHJcbiAgfWA7XHJcbn07XHJcblxyXG5leHBvcnQgeyBQaG9uZ0FuaW1hdGlvbk1hdGVyaWFsIH07XHJcbiIsImltcG9ydCB7IFNoYWRlckxpYiB9IGZyb20gJ3RocmVlJztcclxuaW1wb3J0IEJhc2VBbmltYXRpb25NYXRlcmlhbCBmcm9tICcuL0Jhc2VBbmltYXRpb25NYXRlcmlhbCc7XHJcblxyXG4vKipcclxuICogRXh0ZW5kcyBUSFJFRS5NZXNoU3RhbmRhcmRNYXRlcmlhbCB3aXRoIGN1c3RvbSBzaGFkZXIgY2h1bmtzLlxyXG4gKlxyXG4gKiBAc2VlIGh0dHA6Ly90aHJlZS1iYXMtZXhhbXBsZXMuc3VyZ2Uuc2gvZXhhbXBsZXMvbWF0ZXJpYWxzX3N0YW5kYXJkL1xyXG4gKlxyXG4gKiBAcGFyYW0ge09iamVjdH0gcGFyYW1ldGVycyBPYmplY3QgY29udGFpbmluZyBtYXRlcmlhbCBwcm9wZXJ0aWVzIGFuZCBjdXN0b20gc2hhZGVyIGNodW5rcy5cclxuICogQGNvbnN0cnVjdG9yXHJcbiAqL1xyXG5mdW5jdGlvbiBTdGFuZGFyZEFuaW1hdGlvbk1hdGVyaWFsKHBhcmFtZXRlcnMpIHtcclxuICB0aGlzLnZhcnlpbmdQYXJhbWV0ZXJzID0gW107XHJcblxyXG4gIHRoaXMudmVydGV4RnVuY3Rpb25zID0gW107XHJcbiAgdGhpcy52ZXJ0ZXhQYXJhbWV0ZXJzID0gW107XHJcbiAgdGhpcy52ZXJ0ZXhJbml0ID0gW107XHJcbiAgdGhpcy52ZXJ0ZXhOb3JtYWwgPSBbXTtcclxuICB0aGlzLnZlcnRleFBvc2l0aW9uID0gW107XHJcbiAgdGhpcy52ZXJ0ZXhDb2xvciA9IFtdO1xyXG5cclxuICB0aGlzLmZyYWdtZW50RnVuY3Rpb25zID0gW107XHJcbiAgdGhpcy5mcmFnbWVudFBhcmFtZXRlcnMgPSBbXTtcclxuICB0aGlzLmZyYWdtZW50SW5pdCA9IFtdO1xyXG4gIHRoaXMuZnJhZ21lbnRNYXAgPSBbXTtcclxuICB0aGlzLmZyYWdtZW50RGlmZnVzZSA9IFtdO1xyXG4gIHRoaXMuZnJhZ21lbnRSb3VnaG5lc3MgPSBbXTtcclxuICB0aGlzLmZyYWdtZW50TWV0YWxuZXNzID0gW107XHJcbiAgdGhpcy5mcmFnbWVudEVtaXNzaXZlID0gW107XHJcblxyXG4gIEJhc2VBbmltYXRpb25NYXRlcmlhbC5jYWxsKHRoaXMsIHBhcmFtZXRlcnMsIFNoYWRlckxpYlsnc3RhbmRhcmQnXS51bmlmb3Jtcyk7XHJcblxyXG4gIHRoaXMubGlnaHRzID0gdHJ1ZTtcclxuICB0aGlzLnZlcnRleFNoYWRlciA9IHRoaXMuY29uY2F0VmVydGV4U2hhZGVyKCk7XHJcbiAgdGhpcy5mcmFnbWVudFNoYWRlciA9IHRoaXMuY29uY2F0RnJhZ21lbnRTaGFkZXIoKTtcclxufVxyXG5TdGFuZGFyZEFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoQmFzZUFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZSk7XHJcblN0YW5kYXJkQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gU3RhbmRhcmRBbmltYXRpb25NYXRlcmlhbDtcclxuXHJcblN0YW5kYXJkQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlLmNvbmNhdFZlcnRleFNoYWRlciA9IGZ1bmN0aW9uICgpIHtcclxuICByZXR1cm4gYFxyXG4gICNkZWZpbmUgUEhZU0lDQUxcclxuXHJcbiAgdmFyeWluZyB2ZWMzIHZWaWV3UG9zaXRpb247XHJcbiAgXHJcbiAgI2lmbmRlZiBGTEFUX1NIQURFRFxyXG4gIFxyXG4gICAgdmFyeWluZyB2ZWMzIHZOb3JtYWw7XHJcbiAgXHJcbiAgI2VuZGlmXHJcbiAgXHJcbiAgI2luY2x1ZGUgPGNvbW1vbj5cclxuICAjaW5jbHVkZSA8dXZfcGFyc192ZXJ0ZXg+XHJcbiAgI2luY2x1ZGUgPHV2Ml9wYXJzX3ZlcnRleD5cclxuICAjaW5jbHVkZSA8ZGlzcGxhY2VtZW50bWFwX3BhcnNfdmVydGV4PlxyXG4gICNpbmNsdWRlIDxjb2xvcl9wYXJzX3ZlcnRleD5cclxuICAjaW5jbHVkZSA8Zm9nX3BhcnNfdmVydGV4PlxyXG4gICNpbmNsdWRlIDxtb3JwaHRhcmdldF9wYXJzX3ZlcnRleD5cclxuICAjaW5jbHVkZSA8c2tpbm5pbmdfcGFyc192ZXJ0ZXg+XHJcbiAgI2luY2x1ZGUgPHNoYWRvd21hcF9wYXJzX3ZlcnRleD5cclxuICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfcGFyc192ZXJ0ZXg+XHJcbiAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc19wYXJzX3ZlcnRleD5cclxuICBcclxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBhcmFtZXRlcnMnKX1cclxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZhcnlpbmdQYXJhbWV0ZXJzJyl9XHJcbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhGdW5jdGlvbnMnKX1cclxuICBcclxuICB2b2lkIG1haW4oKSB7XHJcblxyXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhJbml0Jyl9XHJcblxyXG4gICAgI2luY2x1ZGUgPHV2X3ZlcnRleD5cclxuICAgICNpbmNsdWRlIDx1djJfdmVydGV4PlxyXG4gICAgI2luY2x1ZGUgPGNvbG9yX3ZlcnRleD5cclxuICBcclxuICAgICNpbmNsdWRlIDxiZWdpbm5vcm1hbF92ZXJ0ZXg+XHJcbiAgICBcclxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4Tm9ybWFsJyl9XHJcbiAgICBcclxuICAgICNpbmNsdWRlIDxtb3JwaG5vcm1hbF92ZXJ0ZXg+XHJcbiAgICAjaW5jbHVkZSA8c2tpbmJhc2VfdmVydGV4PlxyXG4gICAgI2luY2x1ZGUgPHNraW5ub3JtYWxfdmVydGV4PlxyXG4gICAgI2luY2x1ZGUgPGRlZmF1bHRub3JtYWxfdmVydGV4PlxyXG4gIFxyXG4gICNpZm5kZWYgRkxBVF9TSEFERUQgLy8gTm9ybWFsIGNvbXB1dGVkIHdpdGggZGVyaXZhdGl2ZXMgd2hlbiBGTEFUX1NIQURFRFxyXG4gIFxyXG4gICAgdk5vcm1hbCA9IG5vcm1hbGl6ZSggdHJhbnNmb3JtZWROb3JtYWwgKTtcclxuICBcclxuICAjZW5kaWZcclxuICBcclxuICAgICNpbmNsdWRlIDxiZWdpbl92ZXJ0ZXg+XHJcbiAgICBcclxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UG9zaXRpb24nKX1cclxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4Q29sb3InKX1cclxuICAgIFxyXG4gICAgI2luY2x1ZGUgPG1vcnBodGFyZ2V0X3ZlcnRleD5cclxuICAgICNpbmNsdWRlIDxza2lubmluZ192ZXJ0ZXg+XHJcbiAgICAjaW5jbHVkZSA8ZGlzcGxhY2VtZW50bWFwX3ZlcnRleD5cclxuICAgICNpbmNsdWRlIDxwcm9qZWN0X3ZlcnRleD5cclxuICAgICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl92ZXJ0ZXg+XHJcbiAgICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX3ZlcnRleD5cclxuICBcclxuICAgIHZWaWV3UG9zaXRpb24gPSAtIG12UG9zaXRpb24ueHl6O1xyXG4gIFxyXG4gICAgI2luY2x1ZGUgPHdvcmxkcG9zX3ZlcnRleD5cclxuICAgICNpbmNsdWRlIDxzaGFkb3dtYXBfdmVydGV4PlxyXG4gICAgI2luY2x1ZGUgPGZvZ192ZXJ0ZXg+XHJcbiAgfWA7XHJcbn07XHJcblxyXG5TdGFuZGFyZEFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZS5jb25jYXRGcmFnbWVudFNoYWRlciA9IGZ1bmN0aW9uICgpIHtcclxuICByZXR1cm4gYFxyXG4gICNkZWZpbmUgUEhZU0lDQUxcclxuICBcclxuICB1bmlmb3JtIHZlYzMgZGlmZnVzZTtcclxuICB1bmlmb3JtIHZlYzMgZW1pc3NpdmU7XHJcbiAgdW5pZm9ybSBmbG9hdCByb3VnaG5lc3M7XHJcbiAgdW5pZm9ybSBmbG9hdCBtZXRhbG5lc3M7XHJcbiAgdW5pZm9ybSBmbG9hdCBvcGFjaXR5O1xyXG4gIFxyXG4gICNpZm5kZWYgU1RBTkRBUkRcclxuICAgIHVuaWZvcm0gZmxvYXQgY2xlYXJDb2F0O1xyXG4gICAgdW5pZm9ybSBmbG9hdCBjbGVhckNvYXRSb3VnaG5lc3M7XHJcbiAgI2VuZGlmXHJcbiAgXHJcbiAgdmFyeWluZyB2ZWMzIHZWaWV3UG9zaXRpb247XHJcbiAgXHJcbiAgI2lmbmRlZiBGTEFUX1NIQURFRFxyXG4gIFxyXG4gICAgdmFyeWluZyB2ZWMzIHZOb3JtYWw7XHJcbiAgXHJcbiAgI2VuZGlmXHJcbiAgXHJcbiAgI2luY2x1ZGUgPGNvbW1vbj5cclxuICAjaW5jbHVkZSA8cGFja2luZz5cclxuICAjaW5jbHVkZSA8ZGl0aGVyaW5nX3BhcnNfZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPGNvbG9yX3BhcnNfZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPHV2X3BhcnNfZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPHV2Ml9wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxtYXBfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8YWxwaGFtYXBfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8YW9tYXBfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8bGlnaHRtYXBfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8ZW1pc3NpdmVtYXBfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8ZW52bWFwX3BhcnNfZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPGZvZ19wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxic2Rmcz5cclxuICAjaW5jbHVkZSA8Y3ViZV91dl9yZWZsZWN0aW9uX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxsaWdodHNfcGFycz5cclxuICAjaW5jbHVkZSA8bGlnaHRzX3BoeXNpY2FsX3BhcnNfZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPHNoYWRvd21hcF9wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxidW1wbWFwX3BhcnNfZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPG5vcm1hbG1hcF9wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxyb3VnaG5lc3NtYXBfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8bWV0YWxuZXNzbWFwX3BhcnNfZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPGxvZ2RlcHRoYnVmX3BhcnNfZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc19wYXJzX2ZyYWdtZW50PlxyXG4gIFxyXG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRQYXJhbWV0ZXJzJyl9XHJcbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2YXJ5aW5nUGFyYW1ldGVycycpfVxyXG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRGdW5jdGlvbnMnKX1cclxuICBcclxuICB2b2lkIG1haW4oKSB7XHJcbiAgXHJcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50SW5pdCcpfVxyXG4gIFxyXG4gICAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc19mcmFnbWVudD5cclxuICBcclxuICAgIHZlYzQgZGlmZnVzZUNvbG9yID0gdmVjNCggZGlmZnVzZSwgb3BhY2l0eSApO1xyXG4gICAgUmVmbGVjdGVkTGlnaHQgcmVmbGVjdGVkTGlnaHQgPSBSZWZsZWN0ZWRMaWdodCggdmVjMyggMC4wICksIHZlYzMoIDAuMCApLCB2ZWMzKCAwLjAgKSwgdmVjMyggMC4wICkgKTtcclxuICAgIHZlYzMgdG90YWxFbWlzc2l2ZVJhZGlhbmNlID0gZW1pc3NpdmU7XHJcbiAgXHJcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50RGlmZnVzZScpfVxyXG4gIFxyXG4gICAgI2luY2x1ZGUgPGxvZ2RlcHRoYnVmX2ZyYWdtZW50PlxyXG5cclxuICAgICR7KHRoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50TWFwJykgfHwgJyNpbmNsdWRlIDxtYXBfZnJhZ21lbnQ+Jyl9XHJcblxyXG4gICAgI2luY2x1ZGUgPGNvbG9yX2ZyYWdtZW50PlxyXG4gICAgI2luY2x1ZGUgPGFscGhhbWFwX2ZyYWdtZW50PlxyXG4gICAgI2luY2x1ZGUgPGFscGhhdGVzdF9mcmFnbWVudD5cclxuICAgIFxyXG4gICAgZmxvYXQgcm91Z2huZXNzRmFjdG9yID0gcm91Z2huZXNzO1xyXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudFJvdWdobmVzcycpfVxyXG4gICAgI2lmZGVmIFVTRV9ST1VHSE5FU1NNQVBcclxuICAgIFxyXG4gICAgICB2ZWM0IHRleGVsUm91Z2huZXNzID0gdGV4dHVyZTJEKCByb3VnaG5lc3NNYXAsIHZVdiApO1xyXG4gICAgXHJcbiAgICAgIC8vIHJlYWRzIGNoYW5uZWwgRywgY29tcGF0aWJsZSB3aXRoIGEgY29tYmluZWQgT2NjbHVzaW9uUm91Z2huZXNzTWV0YWxsaWMgKFJHQikgdGV4dHVyZVxyXG4gICAgICByb3VnaG5lc3NGYWN0b3IgKj0gdGV4ZWxSb3VnaG5lc3MuZztcclxuICAgIFxyXG4gICAgI2VuZGlmXHJcbiAgICBcclxuICAgIGZsb2F0IG1ldGFsbmVzc0ZhY3RvciA9IG1ldGFsbmVzcztcclxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRNZXRhbG5lc3MnKX1cclxuICAgICNpZmRlZiBVU0VfTUVUQUxORVNTTUFQXHJcbiAgICBcclxuICAgICAgdmVjNCB0ZXhlbE1ldGFsbmVzcyA9IHRleHR1cmUyRCggbWV0YWxuZXNzTWFwLCB2VXYgKTtcclxuICAgICAgbWV0YWxuZXNzRmFjdG9yICo9IHRleGVsTWV0YWxuZXNzLmI7XHJcbiAgICBcclxuICAgICNlbmRpZlxyXG4gICAgXHJcbiAgICAjaW5jbHVkZSA8bm9ybWFsX2ZyYWdtZW50PlxyXG4gICAgXHJcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50RW1pc3NpdmUnKX1cclxuICAgIFxyXG4gICAgI2luY2x1ZGUgPGVtaXNzaXZlbWFwX2ZyYWdtZW50PlxyXG4gIFxyXG4gICAgLy8gYWNjdW11bGF0aW9uXHJcbiAgICAjaW5jbHVkZSA8bGlnaHRzX3BoeXNpY2FsX2ZyYWdtZW50PlxyXG4gICAgI2luY2x1ZGUgPGxpZ2h0c190ZW1wbGF0ZT5cclxuICBcclxuICAgIC8vIG1vZHVsYXRpb25cclxuICAgICNpbmNsdWRlIDxhb21hcF9mcmFnbWVudD5cclxuICBcclxuICAgIHZlYzMgb3V0Z29pbmdMaWdodCA9IHJlZmxlY3RlZExpZ2h0LmRpcmVjdERpZmZ1c2UgKyByZWZsZWN0ZWRMaWdodC5pbmRpcmVjdERpZmZ1c2UgKyByZWZsZWN0ZWRMaWdodC5kaXJlY3RTcGVjdWxhciArIHJlZmxlY3RlZExpZ2h0LmluZGlyZWN0U3BlY3VsYXIgKyB0b3RhbEVtaXNzaXZlUmFkaWFuY2U7XHJcbiAgXHJcbiAgICBnbF9GcmFnQ29sb3IgPSB2ZWM0KCBvdXRnb2luZ0xpZ2h0LCBkaWZmdXNlQ29sb3IuYSApO1xyXG4gIFxyXG4gICAgI2luY2x1ZGUgPHRvbmVtYXBwaW5nX2ZyYWdtZW50PlxyXG4gICAgI2luY2x1ZGUgPGVuY29kaW5nc19mcmFnbWVudD5cclxuICAgICNpbmNsdWRlIDxmb2dfZnJhZ21lbnQ+XHJcbiAgICAjaW5jbHVkZSA8cHJlbXVsdGlwbGllZF9hbHBoYV9mcmFnbWVudD5cclxuICAgICNpbmNsdWRlIDxkaXRoZXJpbmdfZnJhZ21lbnQ+XHJcbiAgXHJcbiAgfWA7XHJcbn07XHJcblxyXG5leHBvcnQgeyBTdGFuZGFyZEFuaW1hdGlvbk1hdGVyaWFsIH07XHJcbiIsImltcG9ydCB7IFNoYWRlckxpYiB9IGZyb20gJ3RocmVlJztcclxuaW1wb3J0IEJhc2VBbmltYXRpb25NYXRlcmlhbCBmcm9tICcuL0Jhc2VBbmltYXRpb25NYXRlcmlhbCc7XHJcblxyXG4vKipcclxuICogRXh0ZW5kcyBUSFJFRS5Qb2ludHNNYXRlcmlhbCB3aXRoIGN1c3RvbSBzaGFkZXIgY2h1bmtzLlxyXG4gKlxyXG4gKiBAcGFyYW0ge09iamVjdH0gcGFyYW1ldGVycyBPYmplY3QgY29udGFpbmluZyBtYXRlcmlhbCBwcm9wZXJ0aWVzIGFuZCBjdXN0b20gc2hhZGVyIGNodW5rcy5cclxuICogQGNvbnN0cnVjdG9yXHJcbiAqL1xyXG5mdW5jdGlvbiBQb2ludHNBbmltYXRpb25NYXRlcmlhbChwYXJhbWV0ZXJzKSB7XHJcbiAgdGhpcy52YXJ5aW5nUGFyYW1ldGVycyA9IFtdO1xyXG4gIFxyXG4gIHRoaXMudmVydGV4RnVuY3Rpb25zID0gW107XHJcbiAgdGhpcy52ZXJ0ZXhQYXJhbWV0ZXJzID0gW107XHJcbiAgdGhpcy52ZXJ0ZXhJbml0ID0gW107XHJcbiAgdGhpcy52ZXJ0ZXhQb3NpdGlvbiA9IFtdO1xyXG4gIHRoaXMudmVydGV4Q29sb3IgPSBbXTtcclxuICBcclxuICB0aGlzLmZyYWdtZW50RnVuY3Rpb25zID0gW107XHJcbiAgdGhpcy5mcmFnbWVudFBhcmFtZXRlcnMgPSBbXTtcclxuICB0aGlzLmZyYWdtZW50SW5pdCA9IFtdO1xyXG4gIHRoaXMuZnJhZ21lbnRNYXAgPSBbXTtcclxuICB0aGlzLmZyYWdtZW50RGlmZnVzZSA9IFtdO1xyXG4gIC8vIHVzZSBmcmFnbWVudCBzaGFkZXIgdG8gc2hhcGUgdG8gcG9pbnQsIHJlZmVyZW5jZTogaHR0cHM6Ly90aGVib29rb2ZzaGFkZXJzLmNvbS8wNy9cclxuICB0aGlzLmZyYWdtZW50U2hhcGUgPSBbXTtcclxuICBcclxuICBCYXNlQW5pbWF0aW9uTWF0ZXJpYWwuY2FsbCh0aGlzLCBwYXJhbWV0ZXJzLCBTaGFkZXJMaWJbJ3BvaW50cyddLnVuaWZvcm1zKTtcclxuICBcclxuICB0aGlzLnZlcnRleFNoYWRlciA9IHRoaXMuY29uY2F0VmVydGV4U2hhZGVyKCk7XHJcbiAgdGhpcy5mcmFnbWVudFNoYWRlciA9IHRoaXMuY29uY2F0RnJhZ21lbnRTaGFkZXIoKTtcclxufVxyXG5cclxuUG9pbnRzQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShCYXNlQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlKTtcclxuUG9pbnRzQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gUG9pbnRzQW5pbWF0aW9uTWF0ZXJpYWw7XHJcblxyXG5Qb2ludHNBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uY2F0VmVydGV4U2hhZGVyID0gZnVuY3Rpb24gKCkge1xyXG4gIHJldHVybiBgXHJcbiAgdW5pZm9ybSBmbG9hdCBzaXplO1xyXG4gIHVuaWZvcm0gZmxvYXQgc2NhbGU7XHJcbiAgXHJcbiAgI2luY2x1ZGUgPGNvbW1vbj5cclxuICAjaW5jbHVkZSA8Y29sb3JfcGFyc192ZXJ0ZXg+XHJcbiAgI2luY2x1ZGUgPGZvZ19wYXJzX3ZlcnRleD5cclxuICAjaW5jbHVkZSA8c2hhZG93bWFwX3BhcnNfdmVydGV4PlxyXG4gICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl9wYXJzX3ZlcnRleD5cclxuICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX3BhcnNfdmVydGV4PlxyXG4gIFxyXG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UGFyYW1ldGVycycpfVxyXG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmFyeWluZ1BhcmFtZXRlcnMnKX1cclxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleEZ1bmN0aW9ucycpfVxyXG4gIFxyXG4gIHZvaWQgbWFpbigpIHtcclxuICBcclxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4SW5pdCcpfVxyXG4gIFxyXG4gICAgI2luY2x1ZGUgPGNvbG9yX3ZlcnRleD5cclxuICAgICNpbmNsdWRlIDxiZWdpbl92ZXJ0ZXg+XHJcbiAgICBcclxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UG9zaXRpb24nKX1cclxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4Q29sb3InKX1cclxuICAgIFxyXG4gICAgI2luY2x1ZGUgPHByb2plY3RfdmVydGV4PlxyXG4gIFxyXG4gICAgI2lmZGVmIFVTRV9TSVpFQVRURU5VQVRJT05cclxuICAgICAgZ2xfUG9pbnRTaXplID0gc2l6ZSAqICggc2NhbGUgLyAtIG12UG9zaXRpb24ueiApO1xyXG4gICAgI2Vsc2VcclxuICAgICAgZ2xfUG9pbnRTaXplID0gc2l6ZTtcclxuICAgICNlbmRpZlxyXG4gIFxyXG4gICAgI2luY2x1ZGUgPGxvZ2RlcHRoYnVmX3ZlcnRleD5cclxuICAgICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfdmVydGV4PlxyXG4gICAgI2luY2x1ZGUgPHdvcmxkcG9zX3ZlcnRleD5cclxuICAgICNpbmNsdWRlIDxzaGFkb3dtYXBfdmVydGV4PlxyXG4gICAgI2luY2x1ZGUgPGZvZ192ZXJ0ZXg+XHJcbiAgfWA7XHJcbn07XHJcblxyXG5Qb2ludHNBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uY2F0RnJhZ21lbnRTaGFkZXIgPSBmdW5jdGlvbiAoKSB7XHJcbiAgcmV0dXJuIGBcclxuICB1bmlmb3JtIHZlYzMgZGlmZnVzZTtcclxuICB1bmlmb3JtIGZsb2F0IG9wYWNpdHk7XHJcbiAgXHJcbiAgI2luY2x1ZGUgPGNvbW1vbj5cclxuICAjaW5jbHVkZSA8cGFja2luZz5cclxuICAjaW5jbHVkZSA8Y29sb3JfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8bWFwX3BhcnRpY2xlX3BhcnNfZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPGZvZ19wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxzaGFkb3dtYXBfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX3BhcnNfZnJhZ21lbnQ+XHJcbiAgXHJcbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudFBhcmFtZXRlcnMnKX1cclxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZhcnlpbmdQYXJhbWV0ZXJzJyl9XHJcbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudEZ1bmN0aW9ucycpfVxyXG4gIFxyXG4gIHZvaWQgbWFpbigpIHtcclxuICBcclxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRJbml0Jyl9XHJcbiAgXHJcbiAgICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX2ZyYWdtZW50PlxyXG4gIFxyXG4gICAgdmVjMyBvdXRnb2luZ0xpZ2h0ID0gdmVjMyggMC4wICk7XHJcbiAgICB2ZWM0IGRpZmZ1c2VDb2xvciA9IHZlYzQoIGRpZmZ1c2UsIG9wYWNpdHkgKTtcclxuICBcclxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnREaWZmdXNlJyl9XHJcbiAgXHJcbiAgICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfZnJhZ21lbnQ+XHJcblxyXG4gICAgJHsodGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRNYXAnKSB8fCAnI2luY2x1ZGUgPG1hcF9wYXJ0aWNsZV9mcmFnbWVudD4nKX1cclxuXHJcbiAgICAjaW5jbHVkZSA8Y29sb3JfZnJhZ21lbnQ+XHJcbiAgICAjaW5jbHVkZSA8YWxwaGF0ZXN0X2ZyYWdtZW50PlxyXG4gIFxyXG4gICAgb3V0Z29pbmdMaWdodCA9IGRpZmZ1c2VDb2xvci5yZ2I7XHJcbiAgXHJcbiAgICBnbF9GcmFnQ29sb3IgPSB2ZWM0KCBvdXRnb2luZ0xpZ2h0LCBkaWZmdXNlQ29sb3IuYSApO1xyXG4gICAgXHJcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50U2hhcGUnKX1cclxuICBcclxuICAgICNpbmNsdWRlIDxwcmVtdWx0aXBsaWVkX2FscGhhX2ZyYWdtZW50PlxyXG4gICAgI2luY2x1ZGUgPHRvbmVtYXBwaW5nX2ZyYWdtZW50PlxyXG4gICAgI2luY2x1ZGUgPGVuY29kaW5nc19mcmFnbWVudD5cclxuICAgICNpbmNsdWRlIDxmb2dfZnJhZ21lbnQ+XHJcbiAgfWA7XHJcbn07XHJcblxyXG5leHBvcnQgeyBQb2ludHNBbmltYXRpb25NYXRlcmlhbCB9O1xyXG4iLCJpbXBvcnQgeyBTaGFkZXJMaWIsIFVuaWZvcm1zVXRpbHMsIFJHQkFEZXB0aFBhY2tpbmcgfSBmcm9tICd0aHJlZSc7XHJcbmltcG9ydCBCYXNlQW5pbWF0aW9uTWF0ZXJpYWwgZnJvbSAnLi9CYXNlQW5pbWF0aW9uTWF0ZXJpYWwnO1xyXG5cclxuZnVuY3Rpb24gRGVwdGhBbmltYXRpb25NYXRlcmlhbChwYXJhbWV0ZXJzKSB7XHJcbiAgdGhpcy5kZXB0aFBhY2tpbmcgPSBSR0JBRGVwdGhQYWNraW5nO1xyXG4gIHRoaXMuY2xpcHBpbmcgPSB0cnVlO1xyXG5cclxuICB0aGlzLnZlcnRleEZ1bmN0aW9ucyA9IFtdO1xyXG4gIHRoaXMudmVydGV4UGFyYW1ldGVycyA9IFtdO1xyXG4gIHRoaXMudmVydGV4SW5pdCA9IFtdO1xyXG4gIHRoaXMudmVydGV4UG9zaXRpb24gPSBbXTtcclxuXHJcbiAgQmFzZUFuaW1hdGlvbk1hdGVyaWFsLmNhbGwodGhpcywgcGFyYW1ldGVycyk7XHJcbiAgXHJcbiAgdGhpcy51bmlmb3JtcyA9IFVuaWZvcm1zVXRpbHMubWVyZ2UoW1NoYWRlckxpYlsnZGVwdGgnXS51bmlmb3JtcywgdGhpcy51bmlmb3Jtc10pO1xyXG4gIHRoaXMudmVydGV4U2hhZGVyID0gdGhpcy5jb25jYXRWZXJ0ZXhTaGFkZXIoKTtcclxuICB0aGlzLmZyYWdtZW50U2hhZGVyID0gU2hhZGVyTGliWydkZXB0aCddLmZyYWdtZW50U2hhZGVyO1xyXG59XHJcbkRlcHRoQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShCYXNlQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlKTtcclxuRGVwdGhBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBEZXB0aEFuaW1hdGlvbk1hdGVyaWFsO1xyXG5cclxuRGVwdGhBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uY2F0VmVydGV4U2hhZGVyID0gZnVuY3Rpb24gKCkge1xyXG4gIFxyXG4gIHJldHVybiBgXHJcbiAgI2luY2x1ZGUgPGNvbW1vbj5cclxuICAjaW5jbHVkZSA8dXZfcGFyc192ZXJ0ZXg+XHJcbiAgI2luY2x1ZGUgPGRpc3BsYWNlbWVudG1hcF9wYXJzX3ZlcnRleD5cclxuICAjaW5jbHVkZSA8bW9ycGh0YXJnZXRfcGFyc192ZXJ0ZXg+XHJcbiAgI2luY2x1ZGUgPHNraW5uaW5nX3BhcnNfdmVydGV4PlxyXG4gICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl9wYXJzX3ZlcnRleD5cclxuICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX3BhcnNfdmVydGV4PlxyXG4gIFxyXG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UGFyYW1ldGVycycpfVxyXG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4RnVuY3Rpb25zJyl9XHJcbiAgXHJcbiAgdm9pZCBtYWluKCkge1xyXG4gIFxyXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhJbml0Jyl9XHJcbiAgXHJcbiAgICAjaW5jbHVkZSA8dXZfdmVydGV4PlxyXG4gIFxyXG4gICAgI2luY2x1ZGUgPHNraW5iYXNlX3ZlcnRleD5cclxuICBcclxuICAgICNpZmRlZiBVU0VfRElTUExBQ0VNRU5UTUFQXHJcbiAgXHJcbiAgICAgICNpbmNsdWRlIDxiZWdpbm5vcm1hbF92ZXJ0ZXg+XHJcbiAgICAgICNpbmNsdWRlIDxtb3JwaG5vcm1hbF92ZXJ0ZXg+XHJcbiAgICAgICNpbmNsdWRlIDxza2lubm9ybWFsX3ZlcnRleD5cclxuICBcclxuICAgICNlbmRpZlxyXG4gIFxyXG4gICAgI2luY2x1ZGUgPGJlZ2luX3ZlcnRleD5cclxuICAgIFxyXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQb3NpdGlvbicpfVxyXG5cclxuICAgICNpbmNsdWRlIDxtb3JwaHRhcmdldF92ZXJ0ZXg+XHJcbiAgICAjaW5jbHVkZSA8c2tpbm5pbmdfdmVydGV4PlxyXG4gICAgI2luY2x1ZGUgPGRpc3BsYWNlbWVudG1hcF92ZXJ0ZXg+XHJcbiAgICAjaW5jbHVkZSA8cHJvamVjdF92ZXJ0ZXg+XHJcbiAgICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfdmVydGV4PlxyXG4gICAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc192ZXJ0ZXg+XHJcbiAgfWA7XHJcbn07XHJcblxyXG5leHBvcnQgeyBEZXB0aEFuaW1hdGlvbk1hdGVyaWFsIH07XHJcbiIsImltcG9ydCB7IFNoYWRlckxpYiwgVW5pZm9ybXNVdGlscywgUkdCQURlcHRoUGFja2luZyB9IGZyb20gJ3RocmVlJztcclxuaW1wb3J0IEJhc2VBbmltYXRpb25NYXRlcmlhbCBmcm9tICcuL0Jhc2VBbmltYXRpb25NYXRlcmlhbCc7XHJcblxyXG5mdW5jdGlvbiBEaXN0YW5jZUFuaW1hdGlvbk1hdGVyaWFsKHBhcmFtZXRlcnMpIHtcclxuICB0aGlzLmRlcHRoUGFja2luZyA9IFJHQkFEZXB0aFBhY2tpbmc7XHJcbiAgdGhpcy5jbGlwcGluZyA9IHRydWU7XHJcblxyXG4gIHRoaXMudmVydGV4RnVuY3Rpb25zID0gW107XHJcbiAgdGhpcy52ZXJ0ZXhQYXJhbWV0ZXJzID0gW107XHJcbiAgdGhpcy52ZXJ0ZXhJbml0ID0gW107XHJcbiAgdGhpcy52ZXJ0ZXhQb3NpdGlvbiA9IFtdO1xyXG5cclxuICBCYXNlQW5pbWF0aW9uTWF0ZXJpYWwuY2FsbCh0aGlzLCBwYXJhbWV0ZXJzKTtcclxuICBcclxuICB0aGlzLnVuaWZvcm1zID0gVW5pZm9ybXNVdGlscy5tZXJnZShbU2hhZGVyTGliWydkaXN0YW5jZVJHQkEnXS51bmlmb3JtcywgdGhpcy51bmlmb3Jtc10pO1xyXG4gIHRoaXMudmVydGV4U2hhZGVyID0gdGhpcy5jb25jYXRWZXJ0ZXhTaGFkZXIoKTtcclxuICB0aGlzLmZyYWdtZW50U2hhZGVyID0gU2hhZGVyTGliWydkaXN0YW5jZVJHQkEnXS5mcmFnbWVudFNoYWRlcjtcclxufVxyXG5EaXN0YW5jZUFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoQmFzZUFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZSk7XHJcbkRpc3RhbmNlQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gRGlzdGFuY2VBbmltYXRpb25NYXRlcmlhbDtcclxuXHJcbkRpc3RhbmNlQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlLmNvbmNhdFZlcnRleFNoYWRlciA9IGZ1bmN0aW9uICgpIHtcclxuICByZXR1cm4gYFxyXG4gICNkZWZpbmUgRElTVEFOQ0VcclxuXHJcbiAgdmFyeWluZyB2ZWMzIHZXb3JsZFBvc2l0aW9uO1xyXG4gIFxyXG4gICNpbmNsdWRlIDxjb21tb24+XHJcbiAgI2luY2x1ZGUgPHV2X3BhcnNfdmVydGV4PlxyXG4gICNpbmNsdWRlIDxkaXNwbGFjZW1lbnRtYXBfcGFyc192ZXJ0ZXg+XHJcbiAgI2luY2x1ZGUgPG1vcnBodGFyZ2V0X3BhcnNfdmVydGV4PlxyXG4gICNpbmNsdWRlIDxza2lubmluZ19wYXJzX3ZlcnRleD5cclxuICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX3BhcnNfdmVydGV4PlxyXG4gIFxyXG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UGFyYW1ldGVycycpfVxyXG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4RnVuY3Rpb25zJyl9XHJcbiAgXHJcbiAgdm9pZCBtYWluKCkge1xyXG5cclxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4SW5pdCcpfVxyXG4gIFxyXG4gICAgI2luY2x1ZGUgPHV2X3ZlcnRleD5cclxuICBcclxuICAgICNpbmNsdWRlIDxza2luYmFzZV92ZXJ0ZXg+XHJcbiAgXHJcbiAgICAjaWZkZWYgVVNFX0RJU1BMQUNFTUVOVE1BUFxyXG4gIFxyXG4gICAgICAjaW5jbHVkZSA8YmVnaW5ub3JtYWxfdmVydGV4PlxyXG4gICAgICAjaW5jbHVkZSA8bW9ycGhub3JtYWxfdmVydGV4PlxyXG4gICAgICAjaW5jbHVkZSA8c2tpbm5vcm1hbF92ZXJ0ZXg+XHJcbiAgXHJcbiAgICAjZW5kaWZcclxuICBcclxuICAgICNpbmNsdWRlIDxiZWdpbl92ZXJ0ZXg+XHJcbiAgICBcclxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UG9zaXRpb24nKX1cclxuXHJcbiAgICAjaW5jbHVkZSA8bW9ycGh0YXJnZXRfdmVydGV4PlxyXG4gICAgI2luY2x1ZGUgPHNraW5uaW5nX3ZlcnRleD5cclxuICAgICNpbmNsdWRlIDxkaXNwbGFjZW1lbnRtYXBfdmVydGV4PlxyXG4gICAgI2luY2x1ZGUgPHByb2plY3RfdmVydGV4PlxyXG4gICAgI2luY2x1ZGUgPHdvcmxkcG9zX3ZlcnRleD5cclxuICAgICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfdmVydGV4PlxyXG4gIFxyXG4gICAgdldvcmxkUG9zaXRpb24gPSB3b3JsZFBvc2l0aW9uLnh5ejtcclxuICBcclxuICB9YDtcclxufTtcclxuXHJcbmV4cG9ydCB7IERpc3RhbmNlQW5pbWF0aW9uTWF0ZXJpYWwgfTtcclxuIiwiaW1wb3J0IHsgQnVmZmVyR2VvbWV0cnksIEJ1ZmZlckF0dHJpYnV0ZSB9IGZyb20gJ3RocmVlJztcclxuLyoqXHJcbiAqIEEgVEhSRUUuQnVmZmVyR2VvbWV0cnkgd2hlcmUgYSAncHJlZmFiJyBnZW9tZXRyeSBpcyByZXBlYXRlZCBhIG51bWJlciBvZiB0aW1lcy5cclxuICpcclxuICogQHBhcmFtIHtUSFJFRS5HZW9tZXRyeX0gcHJlZmFiIFRoZSBUSFJFRS5HZW9tZXRyeSBpbnN0YW5jZSB0byByZXBlYXQuXHJcbiAqIEBwYXJhbSB7TnVtYmVyfSBjb3VudCBUaGUgbnVtYmVyIG9mIHRpbWVzIHRvIHJlcGVhdCB0aGUgZ2VvbWV0cnkuXHJcbiAqIEBjb25zdHJ1Y3RvclxyXG4gKi9cclxuZnVuY3Rpb24gUHJlZmFiQnVmZmVyR2VvbWV0cnkocHJlZmFiLCBjb3VudCkge1xyXG4gIEJ1ZmZlckdlb21ldHJ5LmNhbGwodGhpcyk7XHJcbiAgXHJcbiAgLyoqXHJcbiAgICogQSByZWZlcmVuY2UgdG8gdGhlIHByZWZhYiBnZW9tZXRyeSB1c2VkIHRvIGNyZWF0ZSB0aGlzIGluc3RhbmNlLlxyXG4gICAqIEB0eXBlIHtUSFJFRS5HZW9tZXRyeX1cclxuICAgKi9cclxuICB0aGlzLnByZWZhYkdlb21ldHJ5ID0gcHJlZmFiO1xyXG4gIFxyXG4gIC8qKlxyXG4gICAqIE51bWJlciBvZiBwcmVmYWJzLlxyXG4gICAqIEB0eXBlIHtOdW1iZXJ9XHJcbiAgICovXHJcbiAgdGhpcy5wcmVmYWJDb3VudCA9IGNvdW50O1xyXG4gIFxyXG4gIC8qKlxyXG4gICAqIE51bWJlciBvZiB2ZXJ0aWNlcyBvZiB0aGUgcHJlZmFiLlxyXG4gICAqIEB0eXBlIHtOdW1iZXJ9XHJcbiAgICovXHJcbiAgdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudCA9IHByZWZhYi52ZXJ0aWNlcy5sZW5ndGg7XHJcbiAgXHJcbiAgdGhpcy5idWZmZXJJbmRpY2VzKCk7XHJcbiAgdGhpcy5idWZmZXJQb3NpdGlvbnMoKTtcclxufVxyXG5QcmVmYWJCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZSk7XHJcblByZWZhYkJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFByZWZhYkJ1ZmZlckdlb21ldHJ5O1xyXG5cclxuUHJlZmFiQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmJ1ZmZlckluZGljZXMgPSBmdW5jdGlvbigpIHtcclxuICBjb25zdCBwcmVmYWJGYWNlQ291bnQgPSB0aGlzLnByZWZhYkdlb21ldHJ5LmZhY2VzLmxlbmd0aDtcclxuICBjb25zdCBwcmVmYWJJbmRleENvdW50ID0gdGhpcy5wcmVmYWJHZW9tZXRyeS5mYWNlcy5sZW5ndGggKiAzO1xyXG4gIGNvbnN0IHByZWZhYkluZGljZXMgPSBbXTtcclxuICBcclxuICBmb3IgKGxldCBoID0gMDsgaCA8IHByZWZhYkZhY2VDb3VudDsgaCsrKSB7XHJcbiAgICBjb25zdCBmYWNlID0gdGhpcy5wcmVmYWJHZW9tZXRyeS5mYWNlc1toXTtcclxuICAgIHByZWZhYkluZGljZXMucHVzaChmYWNlLmEsIGZhY2UuYiwgZmFjZS5jKTtcclxuICB9XHJcbiAgXHJcbiAgY29uc3QgaW5kZXhCdWZmZXIgPSBuZXcgVWludDMyQXJyYXkodGhpcy5wcmVmYWJDb3VudCAqIHByZWZhYkluZGV4Q291bnQpO1xyXG4gIFxyXG4gIHRoaXMuc2V0SW5kZXgobmV3IEJ1ZmZlckF0dHJpYnV0ZShpbmRleEJ1ZmZlciwgMSkpO1xyXG4gIFxyXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5wcmVmYWJDb3VudDsgaSsrKSB7XHJcbiAgICBmb3IgKGxldCBrID0gMDsgayA8IHByZWZhYkluZGV4Q291bnQ7IGsrKykge1xyXG4gICAgICBpbmRleEJ1ZmZlcltpICogcHJlZmFiSW5kZXhDb3VudCArIGtdID0gcHJlZmFiSW5kaWNlc1trXSArIGkgKiB0aGlzLnByZWZhYlZlcnRleENvdW50O1xyXG4gICAgfVxyXG4gIH1cclxufTtcclxuXHJcblByZWZhYkJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5idWZmZXJQb3NpdGlvbnMgPSBmdW5jdGlvbigpIHtcclxuICBjb25zdCBwb3NpdGlvbkJ1ZmZlciA9IHRoaXMuY3JlYXRlQXR0cmlidXRlKCdwb3NpdGlvbicsIDMpLmFycmF5O1xyXG4gIFxyXG4gIGZvciAobGV0IGkgPSAwLCBvZmZzZXQgPSAwOyBpIDwgdGhpcy5wcmVmYWJDb3VudDsgaSsrKSB7XHJcbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IHRoaXMucHJlZmFiVmVydGV4Q291bnQ7IGorKywgb2Zmc2V0ICs9IDMpIHtcclxuICAgICAgY29uc3QgcHJlZmFiVmVydGV4ID0gdGhpcy5wcmVmYWJHZW9tZXRyeS52ZXJ0aWNlc1tqXTtcclxuICAgICAgXHJcbiAgICAgIHBvc2l0aW9uQnVmZmVyW29mZnNldCAgICBdID0gcHJlZmFiVmVydGV4Lng7XHJcbiAgICAgIHBvc2l0aW9uQnVmZmVyW29mZnNldCArIDFdID0gcHJlZmFiVmVydGV4Lnk7XHJcbiAgICAgIHBvc2l0aW9uQnVmZmVyW29mZnNldCArIDJdID0gcHJlZmFiVmVydGV4Lno7XHJcbiAgICB9XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgYSBUSFJFRS5CdWZmZXJBdHRyaWJ1dGUgd2l0aCBVViBjb29yZGluYXRlcy5cclxuICovXHJcblByZWZhYkJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5idWZmZXJVdnMgPSBmdW5jdGlvbigpIHtcclxuICBjb25zdCBwcmVmYWJGYWNlQ291bnQgPSB0aGlzLnByZWZhYkdlb21ldHJ5LmZhY2VzLmxlbmd0aDtcclxuICBjb25zdCBwcmVmYWJWZXJ0ZXhDb3VudCA9IHRoaXMucHJlZmFiVmVydGV4Q291bnQgPSB0aGlzLnByZWZhYkdlb21ldHJ5LnZlcnRpY2VzLmxlbmd0aDtcclxuICBjb25zdCBwcmVmYWJVdnMgPSBbXTtcclxuICBcclxuICBmb3IgKGxldCBoID0gMDsgaCA8IHByZWZhYkZhY2VDb3VudDsgaCsrKSB7XHJcbiAgICBjb25zdCBmYWNlID0gdGhpcy5wcmVmYWJHZW9tZXRyeS5mYWNlc1toXTtcclxuICAgIGNvbnN0IHV2ID0gdGhpcy5wcmVmYWJHZW9tZXRyeS5mYWNlVmVydGV4VXZzWzBdW2hdO1xyXG4gICAgXHJcbiAgICBwcmVmYWJVdnNbZmFjZS5hXSA9IHV2WzBdO1xyXG4gICAgcHJlZmFiVXZzW2ZhY2UuYl0gPSB1dlsxXTtcclxuICAgIHByZWZhYlV2c1tmYWNlLmNdID0gdXZbMl07XHJcbiAgfVxyXG4gIFxyXG4gIGNvbnN0IHV2QnVmZmVyID0gdGhpcy5jcmVhdGVBdHRyaWJ1dGUoJ3V2JywgMik7XHJcbiAgXHJcbiAgZm9yIChsZXQgaSA9IDAsIG9mZnNldCA9IDA7IGkgPCB0aGlzLnByZWZhYkNvdW50OyBpKyspIHtcclxuICAgIGZvciAobGV0IGogPSAwOyBqIDwgcHJlZmFiVmVydGV4Q291bnQ7IGorKywgb2Zmc2V0ICs9IDIpIHtcclxuICAgICAgbGV0IHByZWZhYlV2ID0gcHJlZmFiVXZzW2pdO1xyXG4gICAgICBcclxuICAgICAgdXZCdWZmZXIuYXJyYXlbb2Zmc2V0XSA9IHByZWZhYlV2Lng7XHJcbiAgICAgIHV2QnVmZmVyLmFycmF5W29mZnNldCArIDFdID0gcHJlZmFiVXYueTtcclxuICAgIH1cclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogQ3JlYXRlcyBhIFRIUkVFLkJ1ZmZlckF0dHJpYnV0ZSBvbiB0aGlzIGdlb21ldHJ5IGluc3RhbmNlLlxyXG4gKlxyXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZSBOYW1lIG9mIHRoZSBhdHRyaWJ1dGUuXHJcbiAqIEBwYXJhbSB7TnVtYmVyfSBpdGVtU2l6ZSBOdW1iZXIgb2YgZmxvYXRzIHBlciB2ZXJ0ZXggKHR5cGljYWxseSAxLCAyLCAzIG9yIDQpLlxyXG4gKiBAcGFyYW0ge2Z1bmN0aW9uPX0gZmFjdG9yeSBGdW5jdGlvbiB0aGF0IHdpbGwgYmUgY2FsbGVkIGZvciBlYWNoIHByZWZhYiB1cG9uIGNyZWF0aW9uLiBBY2NlcHRzIDMgYXJndW1lbnRzOiBkYXRhW10sIGluZGV4IGFuZCBwcmVmYWJDb3VudC4gQ2FsbHMgc2V0UHJlZmFiRGF0YS5cclxuICpcclxuICogQHJldHVybnMge1RIUkVFLkJ1ZmZlckF0dHJpYnV0ZX1cclxuICovXHJcblByZWZhYkJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5jcmVhdGVBdHRyaWJ1dGUgPSBmdW5jdGlvbihuYW1lLCBpdGVtU2l6ZSwgZmFjdG9yeSkge1xyXG4gIGNvbnN0IGJ1ZmZlciA9IG5ldyBGbG9hdDMyQXJyYXkodGhpcy5wcmVmYWJDb3VudCAqIHRoaXMucHJlZmFiVmVydGV4Q291bnQgKiBpdGVtU2l6ZSk7XHJcbiAgY29uc3QgYXR0cmlidXRlID0gbmV3IEJ1ZmZlckF0dHJpYnV0ZShidWZmZXIsIGl0ZW1TaXplKTtcclxuICBcclxuICB0aGlzLmFkZEF0dHJpYnV0ZShuYW1lLCBhdHRyaWJ1dGUpO1xyXG4gIFxyXG4gIGlmIChmYWN0b3J5KSB7XHJcbiAgICBjb25zdCBkYXRhID0gW107XHJcbiAgICBcclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5wcmVmYWJDb3VudDsgaSsrKSB7XHJcbiAgICAgIGZhY3RvcnkoZGF0YSwgaSwgdGhpcy5wcmVmYWJDb3VudCk7XHJcbiAgICAgIHRoaXMuc2V0UHJlZmFiRGF0YShhdHRyaWJ1dGUsIGksIGRhdGEpO1xyXG4gICAgfVxyXG4gIH1cclxuICBcclxuICByZXR1cm4gYXR0cmlidXRlO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFNldHMgZGF0YSBmb3IgYWxsIHZlcnRpY2VzIG9mIGEgcHJlZmFiIGF0IGEgZ2l2ZW4gaW5kZXguXHJcbiAqIFVzdWFsbHkgY2FsbGVkIGluIGEgbG9vcC5cclxuICpcclxuICogQHBhcmFtIHtTdHJpbmd8VEhSRUUuQnVmZmVyQXR0cmlidXRlfSBhdHRyaWJ1dGUgVGhlIGF0dHJpYnV0ZSBvciBhdHRyaWJ1dGUgbmFtZSB3aGVyZSB0aGUgZGF0YSBpcyB0byBiZSBzdG9yZWQuXHJcbiAqIEBwYXJhbSB7TnVtYmVyfSBwcmVmYWJJbmRleCBJbmRleCBvZiB0aGUgcHJlZmFiIGluIHRoZSBidWZmZXIgZ2VvbWV0cnkuXHJcbiAqIEBwYXJhbSB7QXJyYXl9IGRhdGEgQXJyYXkgb2YgZGF0YS4gTGVuZ3RoIHNob3VsZCBiZSBlcXVhbCB0byBpdGVtIHNpemUgb2YgdGhlIGF0dHJpYnV0ZS5cclxuICovXHJcblByZWZhYkJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5zZXRQcmVmYWJEYXRhID0gZnVuY3Rpb24oYXR0cmlidXRlLCBwcmVmYWJJbmRleCwgZGF0YSkge1xyXG4gIGF0dHJpYnV0ZSA9ICh0eXBlb2YgYXR0cmlidXRlID09PSAnc3RyaW5nJykgPyB0aGlzLmF0dHJpYnV0ZXNbYXR0cmlidXRlXSA6IGF0dHJpYnV0ZTtcclxuICBcclxuICBsZXQgb2Zmc2V0ID0gcHJlZmFiSW5kZXggKiB0aGlzLnByZWZhYlZlcnRleENvdW50ICogYXR0cmlidXRlLml0ZW1TaXplO1xyXG4gIFxyXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudDsgaSsrKSB7XHJcbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IGF0dHJpYnV0ZS5pdGVtU2l6ZTsgaisrKSB7XHJcbiAgICAgIGF0dHJpYnV0ZS5hcnJheVtvZmZzZXQrK10gPSBkYXRhW2pdO1xyXG4gICAgfVxyXG4gIH1cclxufTtcclxuXHJcbmV4cG9ydCB7IFByZWZhYkJ1ZmZlckdlb21ldHJ5IH07XHJcbiIsImltcG9ydCB7IE1hdGggYXMgdE1hdGgsIFZlY3RvcjMgfSBmcm9tICd0aHJlZSc7XHJcbmltcG9ydCB7IERlcHRoQW5pbWF0aW9uTWF0ZXJpYWwgfSBmcm9tICcuL21hdGVyaWFscy9EZXB0aEFuaW1hdGlvbk1hdGVyaWFsJztcclxuaW1wb3J0IHsgRGlzdGFuY2VBbmltYXRpb25NYXRlcmlhbCB9IGZyb20gJy4vbWF0ZXJpYWxzL0Rpc3RhbmNlQW5pbWF0aW9uTWF0ZXJpYWwnO1xyXG5cclxuLyoqXHJcbiAqIENvbGxlY3Rpb24gb2YgdXRpbGl0eSBmdW5jdGlvbnMuXHJcbiAqIEBuYW1lc3BhY2VcclxuICovXHJcbmNvbnN0IFV0aWxzID0ge1xyXG4gIC8qKlxyXG4gICAqIER1cGxpY2F0ZXMgdmVydGljZXMgc28gZWFjaCBmYWNlIGJlY29tZXMgc2VwYXJhdGUuXHJcbiAgICogU2FtZSBhcyBUSFJFRS5FeHBsb2RlTW9kaWZpZXIuXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge1RIUkVFLkdlb21ldHJ5fSBnZW9tZXRyeSBHZW9tZXRyeSBpbnN0YW5jZSB0byBtb2RpZnkuXHJcbiAgICovXHJcbiAgc2VwYXJhdGVGYWNlczogZnVuY3Rpb24gKGdlb21ldHJ5KSB7XHJcbiAgICBsZXQgdmVydGljZXMgPSBbXTtcclxuXHJcbiAgICBmb3IgKGxldCBpID0gMCwgaWwgPSBnZW9tZXRyeS5mYWNlcy5sZW5ndGg7IGkgPCBpbDsgaSsrKSB7XHJcbiAgICAgIGxldCBuID0gdmVydGljZXMubGVuZ3RoO1xyXG4gICAgICBsZXQgZmFjZSA9IGdlb21ldHJ5LmZhY2VzW2ldO1xyXG5cclxuICAgICAgbGV0IGEgPSBmYWNlLmE7XHJcbiAgICAgIGxldCBiID0gZmFjZS5iO1xyXG4gICAgICBsZXQgYyA9IGZhY2UuYztcclxuXHJcbiAgICAgIGxldCB2YSA9IGdlb21ldHJ5LnZlcnRpY2VzW2FdO1xyXG4gICAgICBsZXQgdmIgPSBnZW9tZXRyeS52ZXJ0aWNlc1tiXTtcclxuICAgICAgbGV0IHZjID0gZ2VvbWV0cnkudmVydGljZXNbY107XHJcblxyXG4gICAgICB2ZXJ0aWNlcy5wdXNoKHZhLmNsb25lKCkpO1xyXG4gICAgICB2ZXJ0aWNlcy5wdXNoKHZiLmNsb25lKCkpO1xyXG4gICAgICB2ZXJ0aWNlcy5wdXNoKHZjLmNsb25lKCkpO1xyXG5cclxuICAgICAgZmFjZS5hID0gbjtcclxuICAgICAgZmFjZS5iID0gbiArIDE7XHJcbiAgICAgIGZhY2UuYyA9IG4gKyAyO1xyXG4gICAgfVxyXG5cclxuICAgIGdlb21ldHJ5LnZlcnRpY2VzID0gdmVydGljZXM7XHJcbiAgfSxcclxuXHJcbiAgLyoqXHJcbiAgICogQ29tcHV0ZSB0aGUgY2VudHJvaWQgKGNlbnRlcikgb2YgYSBUSFJFRS5GYWNlMy5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7VEhSRUUuR2VvbWV0cnl9IGdlb21ldHJ5IEdlb21ldHJ5IGluc3RhbmNlIHRoZSBmYWNlIGlzIGluLlxyXG4gICAqIEBwYXJhbSB7VEhSRUUuRmFjZTN9IGZhY2UgRmFjZSBvYmplY3QgZnJvbSB0aGUgVEhSRUUuR2VvbWV0cnkuZmFjZXMgYXJyYXlcclxuICAgKiBAcGFyYW0ge1RIUkVFLlZlY3RvcjM9fSB2IE9wdGlvbmFsIHZlY3RvciB0byBzdG9yZSByZXN1bHQgaW4uXHJcbiAgICogQHJldHVybnMge1RIUkVFLlZlY3RvcjN9XHJcbiAgICovXHJcbiAgY29tcHV0ZUNlbnRyb2lkOiBmdW5jdGlvbihnZW9tZXRyeSwgZmFjZSwgdikge1xyXG4gICAgbGV0IGEgPSBnZW9tZXRyeS52ZXJ0aWNlc1tmYWNlLmFdO1xyXG4gICAgbGV0IGIgPSBnZW9tZXRyeS52ZXJ0aWNlc1tmYWNlLmJdO1xyXG4gICAgbGV0IGMgPSBnZW9tZXRyeS52ZXJ0aWNlc1tmYWNlLmNdO1xyXG5cclxuICAgIHYgPSB2IHx8IG5ldyBUSFJFRS5WZWN0b3IzKCk7XHJcblxyXG4gICAgdi54ID0gKGEueCArIGIueCArIGMueCkgLyAzO1xyXG4gICAgdi55ID0gKGEueSArIGIueSArIGMueSkgLyAzO1xyXG4gICAgdi56ID0gKGEueiArIGIueiArIGMueikgLyAzO1xyXG5cclxuICAgIHJldHVybiB2O1xyXG4gIH0sXHJcblxyXG4gIC8qKlxyXG4gICAqIEdldCBhIHJhbmRvbSB2ZWN0b3IgYmV0d2VlbiBib3gubWluIGFuZCBib3gubWF4LlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtUSFJFRS5Cb3gzfSBib3ggVEhSRUUuQm94MyBpbnN0YW5jZS5cclxuICAgKiBAcGFyYW0ge1RIUkVFLlZlY3RvcjM9fSB2IE9wdGlvbmFsIHZlY3RvciB0byBzdG9yZSByZXN1bHQgaW4uXHJcbiAgICogQHJldHVybnMge1RIUkVFLlZlY3RvcjN9XHJcbiAgICovXHJcbiAgcmFuZG9tSW5Cb3g6IGZ1bmN0aW9uKGJveCwgdikge1xyXG4gICAgdiA9IHYgfHwgbmV3IFZlY3RvcjMoKTtcclxuXHJcbiAgICB2LnggPSB0TWF0aC5yYW5kRmxvYXQoYm94Lm1pbi54LCBib3gubWF4LngpO1xyXG4gICAgdi55ID0gdE1hdGgucmFuZEZsb2F0KGJveC5taW4ueSwgYm94Lm1heC55KTtcclxuICAgIHYueiA9IHRNYXRoLnJhbmRGbG9hdChib3gubWluLnosIGJveC5tYXgueik7XHJcblxyXG4gICAgcmV0dXJuIHY7XHJcbiAgfSxcclxuXHJcbiAgLyoqXHJcbiAgICogR2V0IGEgcmFuZG9tIGF4aXMgZm9yIHF1YXRlcm5pb24gcm90YXRpb24uXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge1RIUkVFLlZlY3RvcjM9fSB2IE9wdGlvbiB2ZWN0b3IgdG8gc3RvcmUgcmVzdWx0IGluLlxyXG4gICAqIEByZXR1cm5zIHtUSFJFRS5WZWN0b3IzfVxyXG4gICAqL1xyXG4gIHJhbmRvbUF4aXM6IGZ1bmN0aW9uKHYpIHtcclxuICAgIHYgPSB2IHx8IG5ldyBWZWN0b3IzKCk7XHJcblxyXG4gICAgdi54ID0gdE1hdGgucmFuZEZsb2F0U3ByZWFkKDIuMCk7XHJcbiAgICB2LnkgPSB0TWF0aC5yYW5kRmxvYXRTcHJlYWQoMi4wKTtcclxuICAgIHYueiA9IHRNYXRoLnJhbmRGbG9hdFNwcmVhZCgyLjApO1xyXG4gICAgdi5ub3JtYWxpemUoKTtcclxuXHJcbiAgICByZXR1cm4gdjtcclxuICB9LFxyXG5cclxuICAvKipcclxuICAgKiBDcmVhdGUgYSBUSFJFRS5CQVMuRGVwdGhBbmltYXRpb25NYXRlcmlhbCBmb3Igc2hhZG93cyBmcm9tIGEgVEhSRUUuU3BvdExpZ2h0IG9yIFRIUkVFLkRpcmVjdGlvbmFsTGlnaHQgYnkgY29weWluZyByZWxldmFudCBzaGFkZXIgY2h1bmtzLlxyXG4gICAqIFVuaWZvcm0gdmFsdWVzIG11c3QgYmUgbWFudWFsbHkgc3luY2VkIGJldHdlZW4gdGhlIHNvdXJjZSBtYXRlcmlhbCBhbmQgdGhlIGRlcHRoIG1hdGVyaWFsLlxyXG4gICAqXHJcbiAgICogQHNlZSB7QGxpbmsgaHR0cDovL3RocmVlLWJhcy1leGFtcGxlcy5zdXJnZS5zaC9leGFtcGxlcy9zaGFkb3dzL31cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7VEhSRUUuQkFTLkJhc2VBbmltYXRpb25NYXRlcmlhbH0gc291cmNlTWF0ZXJpYWwgSW5zdGFuY2UgdG8gZ2V0IHRoZSBzaGFkZXIgY2h1bmtzIGZyb20uXHJcbiAgICogQHJldHVybnMge1RIUkVFLkJBUy5EZXB0aEFuaW1hdGlvbk1hdGVyaWFsfVxyXG4gICAqL1xyXG4gIGNyZWF0ZURlcHRoQW5pbWF0aW9uTWF0ZXJpYWw6IGZ1bmN0aW9uKHNvdXJjZU1hdGVyaWFsKSB7XHJcbiAgICByZXR1cm4gbmV3IERlcHRoQW5pbWF0aW9uTWF0ZXJpYWwoe1xyXG4gICAgICB1bmlmb3Jtczogc291cmNlTWF0ZXJpYWwudW5pZm9ybXMsXHJcbiAgICAgIGRlZmluZXM6IHNvdXJjZU1hdGVyaWFsLmRlZmluZXMsXHJcbiAgICAgIHZlcnRleEZ1bmN0aW9uczogc291cmNlTWF0ZXJpYWwudmVydGV4RnVuY3Rpb25zLFxyXG4gICAgICB2ZXJ0ZXhQYXJhbWV0ZXJzOiBzb3VyY2VNYXRlcmlhbC52ZXJ0ZXhQYXJhbWV0ZXJzLFxyXG4gICAgICB2ZXJ0ZXhJbml0OiBzb3VyY2VNYXRlcmlhbC52ZXJ0ZXhJbml0LFxyXG4gICAgICB2ZXJ0ZXhQb3NpdGlvbjogc291cmNlTWF0ZXJpYWwudmVydGV4UG9zaXRpb25cclxuICAgIH0pO1xyXG4gIH0sXHJcblxyXG4gIC8qKlxyXG4gICAqIENyZWF0ZSBhIFRIUkVFLkJBUy5EaXN0YW5jZUFuaW1hdGlvbk1hdGVyaWFsIGZvciBzaGFkb3dzIGZyb20gYSBUSFJFRS5Qb2ludExpZ2h0IGJ5IGNvcHlpbmcgcmVsZXZhbnQgc2hhZGVyIGNodW5rcy5cclxuICAgKiBVbmlmb3JtIHZhbHVlcyBtdXN0IGJlIG1hbnVhbGx5IHN5bmNlZCBiZXR3ZWVuIHRoZSBzb3VyY2UgbWF0ZXJpYWwgYW5kIHRoZSBkaXN0YW5jZSBtYXRlcmlhbC5cclxuICAgKlxyXG4gICAqIEBzZWUge0BsaW5rIGh0dHA6Ly90aHJlZS1iYXMtZXhhbXBsZXMuc3VyZ2Uuc2gvZXhhbXBsZXMvc2hhZG93cy99XHJcbiAgICpcclxuICAgKiBAcGFyYW0ge1RIUkVFLkJBUy5CYXNlQW5pbWF0aW9uTWF0ZXJpYWx9IHNvdXJjZU1hdGVyaWFsIEluc3RhbmNlIHRvIGdldCB0aGUgc2hhZGVyIGNodW5rcyBmcm9tLlxyXG4gICAqIEByZXR1cm5zIHtUSFJFRS5CQVMuRGlzdGFuY2VBbmltYXRpb25NYXRlcmlhbH1cclxuICAgKi9cclxuICBjcmVhdGVEaXN0YW5jZUFuaW1hdGlvbk1hdGVyaWFsOiBmdW5jdGlvbihzb3VyY2VNYXRlcmlhbCkge1xyXG4gICAgcmV0dXJuIG5ldyBEaXN0YW5jZUFuaW1hdGlvbk1hdGVyaWFsKHtcclxuICAgICAgdW5pZm9ybXM6IHNvdXJjZU1hdGVyaWFsLnVuaWZvcm1zLFxyXG4gICAgICBkZWZpbmVzOiBzb3VyY2VNYXRlcmlhbC5kZWZpbmVzLFxyXG4gICAgICB2ZXJ0ZXhGdW5jdGlvbnM6IHNvdXJjZU1hdGVyaWFsLnZlcnRleEZ1bmN0aW9ucyxcclxuICAgICAgdmVydGV4UGFyYW1ldGVyczogc291cmNlTWF0ZXJpYWwudmVydGV4UGFyYW1ldGVycyxcclxuICAgICAgdmVydGV4SW5pdDogc291cmNlTWF0ZXJpYWwudmVydGV4SW5pdCxcclxuICAgICAgdmVydGV4UG9zaXRpb246IHNvdXJjZU1hdGVyaWFsLnZlcnRleFBvc2l0aW9uXHJcbiAgICB9KTtcclxuICB9XHJcbn07XHJcblxyXG5leHBvcnQgeyBVdGlscyB9O1xyXG4iLCJpbXBvcnQgeyBCdWZmZXJHZW9tZXRyeSwgQnVmZmVyQXR0cmlidXRlIH0gZnJvbSAndGhyZWUnO1xyXG5pbXBvcnQgeyBVdGlscyB9IGZyb20gJy4uL1V0aWxzJztcclxuXHJcbi8qKlxyXG4gKiBBIFRIUkVFLkJ1ZmZlckdlb21ldHJ5IGZvciBhbmltYXRpbmcgaW5kaXZpZHVhbCBmYWNlcyBvZiBhIFRIUkVFLkdlb21ldHJ5LlxyXG4gKlxyXG4gKiBAcGFyYW0ge1RIUkVFLkdlb21ldHJ5fSBtb2RlbCBUaGUgVEhSRUUuR2VvbWV0cnkgdG8gYmFzZSB0aGlzIGdlb21ldHJ5IG9uLlxyXG4gKiBAcGFyYW0ge09iamVjdD19IG9wdGlvbnNcclxuICogQHBhcmFtIHtCb29sZWFuPX0gb3B0aW9ucy5jb21wdXRlQ2VudHJvaWRzIElmIHRydWUsIGEgY2VudHJvaWRzIHdpbGwgYmUgY29tcHV0ZWQgZm9yIGVhY2ggZmFjZSBhbmQgc3RvcmVkIGluIFRIUkVFLkJBUy5Nb2RlbEJ1ZmZlckdlb21ldHJ5LmNlbnRyb2lkcy5cclxuICogQHBhcmFtIHtCb29sZWFuPX0gb3B0aW9ucy5sb2NhbGl6ZUZhY2VzIElmIHRydWUsIHRoZSBwb3NpdGlvbnMgZm9yIGVhY2ggZmFjZSB3aWxsIGJlIHN0b3JlZCByZWxhdGl2ZSB0byB0aGUgY2VudHJvaWQuIFRoaXMgaXMgdXNlZnVsIGlmIHlvdSB3YW50IHRvIHJvdGF0ZSBvciBzY2FsZSBmYWNlcyBhcm91bmQgdGhlaXIgY2VudGVyLlxyXG4gKiBAY29uc3RydWN0b3JcclxuICovXHJcbmZ1bmN0aW9uIE1vZGVsQnVmZmVyR2VvbWV0cnkobW9kZWwsIG9wdGlvbnMpIHtcclxuICBCdWZmZXJHZW9tZXRyeS5jYWxsKHRoaXMpO1xyXG5cclxuICAvKipcclxuICAgKiBBIHJlZmVyZW5jZSB0byB0aGUgZ2VvbWV0cnkgdXNlZCB0byBjcmVhdGUgdGhpcyBpbnN0YW5jZS5cclxuICAgKiBAdHlwZSB7VEhSRUUuR2VvbWV0cnl9XHJcbiAgICovXHJcbiAgdGhpcy5tb2RlbEdlb21ldHJ5ID0gbW9kZWw7XHJcblxyXG4gIC8qKlxyXG4gICAqIE51bWJlciBvZiBmYWNlcyBvZiB0aGUgbW9kZWwuXHJcbiAgICogQHR5cGUge051bWJlcn1cclxuICAgKi9cclxuICB0aGlzLmZhY2VDb3VudCA9IHRoaXMubW9kZWxHZW9tZXRyeS5mYWNlcy5sZW5ndGg7XHJcblxyXG4gIC8qKlxyXG4gICAqIE51bWJlciBvZiB2ZXJ0aWNlcyBvZiB0aGUgbW9kZWwuXHJcbiAgICogQHR5cGUge051bWJlcn1cclxuICAgKi9cclxuICB0aGlzLnZlcnRleENvdW50ID0gdGhpcy5tb2RlbEdlb21ldHJ5LnZlcnRpY2VzLmxlbmd0aDtcclxuXHJcbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XHJcbiAgb3B0aW9ucy5jb21wdXRlQ2VudHJvaWRzICYmIHRoaXMuY29tcHV0ZUNlbnRyb2lkcygpO1xyXG5cclxuICB0aGlzLmJ1ZmZlckluZGljZXMoKTtcclxuICB0aGlzLmJ1ZmZlclBvc2l0aW9ucyhvcHRpb25zLmxvY2FsaXplRmFjZXMpO1xyXG59XHJcbk1vZGVsQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUpO1xyXG5Nb2RlbEJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IE1vZGVsQnVmZmVyR2VvbWV0cnk7XHJcblxyXG4vKipcclxuICogQ29tcHV0ZXMgYSBjZW50cm9pZCBmb3IgZWFjaCBmYWNlIGFuZCBzdG9yZXMgaXQgaW4gVEhSRUUuQkFTLk1vZGVsQnVmZmVyR2VvbWV0cnkuY2VudHJvaWRzLlxyXG4gKi9cclxuTW9kZWxCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuY29tcHV0ZUNlbnRyb2lkcyA9IGZ1bmN0aW9uKCkge1xyXG4gIC8qKlxyXG4gICAqIEFuIGFycmF5IG9mIGNlbnRyb2lkcyBjb3JyZXNwb25kaW5nIHRvIHRoZSBmYWNlcyBvZiB0aGUgbW9kZWwuXHJcbiAgICpcclxuICAgKiBAdHlwZSB7QXJyYXl9XHJcbiAgICovXHJcbiAgdGhpcy5jZW50cm9pZHMgPSBbXTtcclxuXHJcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmZhY2VDb3VudDsgaSsrKSB7XHJcbiAgICB0aGlzLmNlbnRyb2lkc1tpXSA9IFV0aWxzLmNvbXB1dGVDZW50cm9pZCh0aGlzLm1vZGVsR2VvbWV0cnksIHRoaXMubW9kZWxHZW9tZXRyeS5mYWNlc1tpXSk7XHJcbiAgfVxyXG59O1xyXG5cclxuTW9kZWxCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuYnVmZmVySW5kaWNlcyA9IGZ1bmN0aW9uKCkge1xyXG4gIGNvbnN0IGluZGV4QnVmZmVyID0gbmV3IFVpbnQzMkFycmF5KHRoaXMuZmFjZUNvdW50ICogMyk7XHJcblxyXG4gIHRoaXMuc2V0SW5kZXgobmV3IEJ1ZmZlckF0dHJpYnV0ZShpbmRleEJ1ZmZlciwgMSkpO1xyXG5cclxuICBmb3IgKGxldCBpID0gMCwgb2Zmc2V0ID0gMDsgaSA8IHRoaXMuZmFjZUNvdW50OyBpKyssIG9mZnNldCArPSAzKSB7XHJcbiAgICBjb25zdCBmYWNlID0gdGhpcy5tb2RlbEdlb21ldHJ5LmZhY2VzW2ldO1xyXG5cclxuICAgIGluZGV4QnVmZmVyW29mZnNldCAgICBdID0gZmFjZS5hO1xyXG4gICAgaW5kZXhCdWZmZXJbb2Zmc2V0ICsgMV0gPSBmYWNlLmI7XHJcbiAgICBpbmRleEJ1ZmZlcltvZmZzZXQgKyAyXSA9IGZhY2UuYztcclxuICB9XHJcbn07XHJcblxyXG5Nb2RlbEJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5idWZmZXJQb3NpdGlvbnMgPSBmdW5jdGlvbihsb2NhbGl6ZUZhY2VzKSB7XHJcbiAgY29uc3QgcG9zaXRpb25CdWZmZXIgPSB0aGlzLmNyZWF0ZUF0dHJpYnV0ZSgncG9zaXRpb24nLCAzKS5hcnJheTtcclxuICBsZXQgaSwgb2Zmc2V0O1xyXG5cclxuICBpZiAobG9jYWxpemVGYWNlcyA9PT0gdHJ1ZSkge1xyXG4gICAgZm9yIChpID0gMDsgaSA8IHRoaXMuZmFjZUNvdW50OyBpKyspIHtcclxuICAgICAgY29uc3QgZmFjZSA9IHRoaXMubW9kZWxHZW9tZXRyeS5mYWNlc1tpXTtcclxuICAgICAgY29uc3QgY2VudHJvaWQgPSB0aGlzLmNlbnRyb2lkcyA/IHRoaXMuY2VudHJvaWRzW2ldIDogVEhSRUUuQkFTLlV0aWxzLmNvbXB1dGVDZW50cm9pZCh0aGlzLm1vZGVsR2VvbWV0cnksIGZhY2UpO1xyXG5cclxuICAgICAgY29uc3QgYSA9IHRoaXMubW9kZWxHZW9tZXRyeS52ZXJ0aWNlc1tmYWNlLmFdO1xyXG4gICAgICBjb25zdCBiID0gdGhpcy5tb2RlbEdlb21ldHJ5LnZlcnRpY2VzW2ZhY2UuYl07XHJcbiAgICAgIGNvbnN0IGMgPSB0aGlzLm1vZGVsR2VvbWV0cnkudmVydGljZXNbZmFjZS5jXTtcclxuXHJcbiAgICAgIHBvc2l0aW9uQnVmZmVyW2ZhY2UuYSAqIDNdICAgICA9IGEueCAtIGNlbnRyb2lkLng7XHJcbiAgICAgIHBvc2l0aW9uQnVmZmVyW2ZhY2UuYSAqIDMgKyAxXSA9IGEueSAtIGNlbnRyb2lkLnk7XHJcbiAgICAgIHBvc2l0aW9uQnVmZmVyW2ZhY2UuYSAqIDMgKyAyXSA9IGEueiAtIGNlbnRyb2lkLno7XHJcblxyXG4gICAgICBwb3NpdGlvbkJ1ZmZlcltmYWNlLmIgKiAzXSAgICAgPSBiLnggLSBjZW50cm9pZC54O1xyXG4gICAgICBwb3NpdGlvbkJ1ZmZlcltmYWNlLmIgKiAzICsgMV0gPSBiLnkgLSBjZW50cm9pZC55O1xyXG4gICAgICBwb3NpdGlvbkJ1ZmZlcltmYWNlLmIgKiAzICsgMl0gPSBiLnogLSBjZW50cm9pZC56O1xyXG5cclxuICAgICAgcG9zaXRpb25CdWZmZXJbZmFjZS5jICogM10gICAgID0gYy54IC0gY2VudHJvaWQueDtcclxuICAgICAgcG9zaXRpb25CdWZmZXJbZmFjZS5jICogMyArIDFdID0gYy55IC0gY2VudHJvaWQueTtcclxuICAgICAgcG9zaXRpb25CdWZmZXJbZmFjZS5jICogMyArIDJdID0gYy56IC0gY2VudHJvaWQuejtcclxuICAgIH1cclxuICB9XHJcbiAgZWxzZSB7XHJcbiAgICBmb3IgKGkgPSAwLCBvZmZzZXQgPSAwOyBpIDwgdGhpcy52ZXJ0ZXhDb3VudDsgaSsrLCBvZmZzZXQgKz0gMykge1xyXG4gICAgICBjb25zdCB2ZXJ0ZXggPSB0aGlzLm1vZGVsR2VvbWV0cnkudmVydGljZXNbaV07XHJcblxyXG4gICAgICBwb3NpdGlvbkJ1ZmZlcltvZmZzZXQgICAgXSA9IHZlcnRleC54O1xyXG4gICAgICBwb3NpdGlvbkJ1ZmZlcltvZmZzZXQgKyAxXSA9IHZlcnRleC55O1xyXG4gICAgICBwb3NpdGlvbkJ1ZmZlcltvZmZzZXQgKyAyXSA9IHZlcnRleC56O1xyXG4gICAgfVxyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIGEgVEhSRUUuQnVmZmVyQXR0cmlidXRlIHdpdGggVVYgY29vcmRpbmF0ZXMuXHJcbiAqL1xyXG5Nb2RlbEJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5idWZmZXJVVnMgPSBmdW5jdGlvbigpIHtcclxuICBjb25zdCB1dkJ1ZmZlciA9IHRoaXMuY3JlYXRlQXR0cmlidXRlKCd1dicsIDIpLmFycmF5O1xyXG5cclxuICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuZmFjZUNvdW50OyBpKyspIHtcclxuXHJcbiAgICBjb25zdCBmYWNlID0gdGhpcy5tb2RlbEdlb21ldHJ5LmZhY2VzW2ldO1xyXG4gICAgbGV0IHV2O1xyXG5cclxuICAgIHV2ID0gdGhpcy5tb2RlbEdlb21ldHJ5LmZhY2VWZXJ0ZXhVdnNbMF1baV1bMF07XHJcbiAgICB1dkJ1ZmZlcltmYWNlLmEgKiAyXSAgICAgPSB1di54O1xyXG4gICAgdXZCdWZmZXJbZmFjZS5hICogMiArIDFdID0gdXYueTtcclxuXHJcbiAgICB1diA9IHRoaXMubW9kZWxHZW9tZXRyeS5mYWNlVmVydGV4VXZzWzBdW2ldWzFdO1xyXG4gICAgdXZCdWZmZXJbZmFjZS5iICogMl0gICAgID0gdXYueDtcclxuICAgIHV2QnVmZmVyW2ZhY2UuYiAqIDIgKyAxXSA9IHV2Lnk7XHJcblxyXG4gICAgdXYgPSB0aGlzLm1vZGVsR2VvbWV0cnkuZmFjZVZlcnRleFV2c1swXVtpXVsyXTtcclxuICAgIHV2QnVmZmVyW2ZhY2UuYyAqIDJdICAgICA9IHV2Lng7XHJcbiAgICB1dkJ1ZmZlcltmYWNlLmMgKiAyICsgMV0gPSB1di55O1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIGEgVEhSRUUuQnVmZmVyQXR0cmlidXRlIG9uIHRoaXMgZ2VvbWV0cnkgaW5zdGFuY2UuXHJcbiAqXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIE5hbWUgb2YgdGhlIGF0dHJpYnV0ZS5cclxuICogQHBhcmFtIHtpbnR9IGl0ZW1TaXplIE51bWJlciBvZiBmbG9hdHMgcGVyIHZlcnRleCAodHlwaWNhbGx5IDEsIDIsIDMgb3IgNCkuXHJcbiAqIEBwYXJhbSB7ZnVuY3Rpb249fSBmYWN0b3J5IEZ1bmN0aW9uIHRoYXQgd2lsbCBiZSBjYWxsZWQgZm9yIGVhY2ggZmFjZSB1cG9uIGNyZWF0aW9uLiBBY2NlcHRzIDMgYXJndW1lbnRzOiBkYXRhW10sIGluZGV4IGFuZCBmYWNlQ291bnQuIENhbGxzIHNldEZhY2VEYXRhLlxyXG4gKlxyXG4gKiBAcmV0dXJucyB7VEhSRUUuQnVmZmVyQXR0cmlidXRlfVxyXG4gKi9cclxuTW9kZWxCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuY3JlYXRlQXR0cmlidXRlID0gZnVuY3Rpb24obmFtZSwgaXRlbVNpemUsIGZhY3RvcnkpIHtcclxuICBjb25zdCBidWZmZXIgPSBuZXcgRmxvYXQzMkFycmF5KHRoaXMudmVydGV4Q291bnQgKiBpdGVtU2l6ZSk7XHJcbiAgY29uc3QgYXR0cmlidXRlID0gbmV3IFRIUkVFLkJ1ZmZlckF0dHJpYnV0ZShidWZmZXIsIGl0ZW1TaXplKTtcclxuXHJcbiAgdGhpcy5hZGRBdHRyaWJ1dGUobmFtZSwgYXR0cmlidXRlKTtcclxuXHJcbiAgaWYgKGZhY3RvcnkpIHtcclxuICAgIGNvbnN0IGRhdGEgPSBbXTtcclxuXHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuZmFjZUNvdW50OyBpKyspIHtcclxuICAgICAgZmFjdG9yeShkYXRhLCBpLCB0aGlzLmZhY2VDb3VudCk7XHJcbiAgICAgIHRoaXMuc2V0RmFjZURhdGEoYXR0cmlidXRlLCBpLCBkYXRhKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHJldHVybiBhdHRyaWJ1dGU7XHJcbn07XHJcblxyXG4vKipcclxuICogU2V0cyBkYXRhIGZvciBhbGwgdmVydGljZXMgb2YgYSBmYWNlIGF0IGEgZ2l2ZW4gaW5kZXguXHJcbiAqIFVzdWFsbHkgY2FsbGVkIGluIGEgbG9vcC5cclxuICpcclxuICogQHBhcmFtIHtTdHJpbmd8VEhSRUUuQnVmZmVyQXR0cmlidXRlfSBhdHRyaWJ1dGUgVGhlIGF0dHJpYnV0ZSBvciBhdHRyaWJ1dGUgbmFtZSB3aGVyZSB0aGUgZGF0YSBpcyB0byBiZSBzdG9yZWQuXHJcbiAqIEBwYXJhbSB7aW50fSBmYWNlSW5kZXggSW5kZXggb2YgdGhlIGZhY2UgaW4gdGhlIGJ1ZmZlciBnZW9tZXRyeS5cclxuICogQHBhcmFtIHtBcnJheX0gZGF0YSBBcnJheSBvZiBkYXRhLiBMZW5ndGggc2hvdWxkIGJlIGVxdWFsIHRvIGl0ZW0gc2l6ZSBvZiB0aGUgYXR0cmlidXRlLlxyXG4gKi9cclxuTW9kZWxCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuc2V0RmFjZURhdGEgPSBmdW5jdGlvbihhdHRyaWJ1dGUsIGZhY2VJbmRleCwgZGF0YSkge1xyXG4gIGF0dHJpYnV0ZSA9ICh0eXBlb2YgYXR0cmlidXRlID09PSAnc3RyaW5nJykgPyB0aGlzLmF0dHJpYnV0ZXNbYXR0cmlidXRlXSA6IGF0dHJpYnV0ZTtcclxuXHJcbiAgbGV0IG9mZnNldCA9IGZhY2VJbmRleCAqIDMgKiBhdHRyaWJ1dGUuaXRlbVNpemU7XHJcblxyXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgMzsgaSsrKSB7XHJcbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IGF0dHJpYnV0ZS5pdGVtU2l6ZTsgaisrKSB7XHJcbiAgICAgIGF0dHJpYnV0ZS5hcnJheVtvZmZzZXQrK10gPSBkYXRhW2pdO1xyXG4gICAgfVxyXG4gIH1cclxufTtcclxuXHJcbmV4cG9ydCB7IE1vZGVsQnVmZmVyR2VvbWV0cnkgfTtcclxuIiwiaW1wb3J0IHsgQnVmZmVyR2VvbWV0cnksIEJ1ZmZlckF0dHJpYnV0ZSB9IGZyb20gJ3RocmVlJztcclxuXHJcbi8qKlxyXG4gKiBBIFRIUkVFLkJ1ZmZlckdlb21ldHJ5IGNvbnNpc3RzIG9mIHBvaW50cy5cclxuICogQHBhcmFtIHtOdW1iZXJ9IGNvdW50IFRoZSBudW1iZXIgb2YgcG9pbnRzLlxyXG4gKiBAY29uc3RydWN0b3JcclxuICovXHJcbmZ1bmN0aW9uIFBvaW50QnVmZmVyR2VvbWV0cnkoY291bnQpIHtcclxuICBCdWZmZXJHZW9tZXRyeS5jYWxsKHRoaXMpO1xyXG5cclxuICAvKipcclxuICAgKiBOdW1iZXIgb2YgcG9pbnRzLlxyXG4gICAqIEB0eXBlIHtOdW1iZXJ9XHJcbiAgICovXHJcbiAgdGhpcy5wb2ludENvdW50ID0gY291bnQ7XHJcblxyXG4gIHRoaXMuYnVmZmVyUG9zaXRpb25zKCk7XHJcbn1cclxuUG9pbnRCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZSk7XHJcblBvaW50QnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gUG9pbnRCdWZmZXJHZW9tZXRyeTtcclxuXHJcblBvaW50QnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmJ1ZmZlclBvc2l0aW9ucyA9IGZ1bmN0aW9uKCkge1xyXG4gIHRoaXMuY3JlYXRlQXR0cmlidXRlKCdwb3NpdGlvbicsIDMpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgYSBUSFJFRS5CdWZmZXJBdHRyaWJ1dGUgb24gdGhpcyBnZW9tZXRyeSBpbnN0YW5jZS5cclxuICpcclxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgTmFtZSBvZiB0aGUgYXR0cmlidXRlLlxyXG4gKiBAcGFyYW0ge051bWJlcn0gaXRlbVNpemUgTnVtYmVyIG9mIGZsb2F0cyBwZXIgdmVydGV4ICh0eXBpY2FsbHkgMSwgMiwgMyBvciA0KS5cclxuICogQHBhcmFtIHtmdW5jdGlvbj19IGZhY3RvcnkgRnVuY3Rpb24gdGhhdCB3aWxsIGJlIGNhbGxlZCBmb3IgZWFjaCBwb2ludCB1cG9uIGNyZWF0aW9uLiBBY2NlcHRzIDMgYXJndW1lbnRzOiBkYXRhW10sIGluZGV4IGFuZCBwcmVmYWJDb3VudC4gQ2FsbHMgc2V0UHJlZmFiRGF0YS5cclxuICpcclxuICogQHJldHVybnMge1RIUkVFLkJ1ZmZlckF0dHJpYnV0ZX1cclxuICovXHJcblBvaW50QnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmNyZWF0ZUF0dHJpYnV0ZSA9IGZ1bmN0aW9uKG5hbWUsIGl0ZW1TaXplLCBmYWN0b3J5KSB7XHJcbiAgY29uc3QgYnVmZmVyID0gbmV3IEZsb2F0MzJBcnJheSh0aGlzLnBvaW50Q291bnQgKiBpdGVtU2l6ZSk7XHJcbiAgY29uc3QgYXR0cmlidXRlID0gbmV3IEJ1ZmZlckF0dHJpYnV0ZShidWZmZXIsIGl0ZW1TaXplKTtcclxuXHJcbiAgdGhpcy5hZGRBdHRyaWJ1dGUobmFtZSwgYXR0cmlidXRlKTtcclxuXHJcbiAgaWYgKGZhY3RvcnkpIHtcclxuICAgIGNvbnN0IGRhdGEgPSBbXTtcclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5wb2ludENvdW50OyBpKyspIHtcclxuICAgICAgZmFjdG9yeShkYXRhLCBpLCB0aGlzLnBvaW50Q291bnQpO1xyXG4gICAgICB0aGlzLnNldFBvaW50RGF0YShhdHRyaWJ1dGUsIGksIGRhdGEpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcmV0dXJuIGF0dHJpYnV0ZTtcclxufTtcclxuXHJcblBvaW50QnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLnNldFBvaW50RGF0YSA9IGZ1bmN0aW9uKGF0dHJpYnV0ZSwgcG9pbnRJbmRleCwgZGF0YSkge1xyXG4gIGF0dHJpYnV0ZSA9ICh0eXBlb2YgYXR0cmlidXRlID09PSAnc3RyaW5nJykgPyB0aGlzLmF0dHJpYnV0ZXNbYXR0cmlidXRlXSA6IGF0dHJpYnV0ZTtcclxuXHJcbiAgbGV0IG9mZnNldCA9IHBvaW50SW5kZXggKiBhdHRyaWJ1dGUuaXRlbVNpemU7XHJcblxyXG4gIGZvciAobGV0IGogPSAwOyBqIDwgYXR0cmlidXRlLml0ZW1TaXplOyBqKyspIHtcclxuICAgIGF0dHJpYnV0ZS5hcnJheVtvZmZzZXQrK10gPSBkYXRhW2pdO1xyXG4gIH1cclxufTtcclxuXHJcbmV4cG9ydCB7IFBvaW50QnVmZmVyR2VvbWV0cnkgfTtcclxuIiwiLy8gZ2VuZXJhdGVkIGJ5IHNjcmlwdHMvYnVpbGRfc2hhZGVyX2NodW5rcy5qc1xyXG5cclxuaW1wb3J0IGNhdG11bGxfcm9tX3NwbGluZSBmcm9tICcuL2dsc2wvY2F0bXVsbF9yb21fc3BsaW5lLmdsc2wnO1xyXG5pbXBvcnQgY3ViaWNfYmV6aWVyIGZyb20gJy4vZ2xzbC9jdWJpY19iZXppZXIuZ2xzbCc7XHJcbmltcG9ydCBlYXNlX2JhY2tfaW4gZnJvbSAnLi9nbHNsL2Vhc2VfYmFja19pbi5nbHNsJztcclxuaW1wb3J0IGVhc2VfYmFja19pbl9vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfYmFja19pbl9vdXQuZ2xzbCc7XHJcbmltcG9ydCBlYXNlX2JhY2tfb3V0IGZyb20gJy4vZ2xzbC9lYXNlX2JhY2tfb3V0Lmdsc2wnO1xyXG5pbXBvcnQgZWFzZV9iZXppZXIgZnJvbSAnLi9nbHNsL2Vhc2VfYmV6aWVyLmdsc2wnO1xyXG5pbXBvcnQgZWFzZV9ib3VuY2VfaW4gZnJvbSAnLi9nbHNsL2Vhc2VfYm91bmNlX2luLmdsc2wnO1xyXG5pbXBvcnQgZWFzZV9ib3VuY2VfaW5fb3V0IGZyb20gJy4vZ2xzbC9lYXNlX2JvdW5jZV9pbl9vdXQuZ2xzbCc7XHJcbmltcG9ydCBlYXNlX2JvdW5jZV9vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfYm91bmNlX291dC5nbHNsJztcclxuaW1wb3J0IGVhc2VfY2lyY19pbiBmcm9tICcuL2dsc2wvZWFzZV9jaXJjX2luLmdsc2wnO1xyXG5pbXBvcnQgZWFzZV9jaXJjX2luX291dCBmcm9tICcuL2dsc2wvZWFzZV9jaXJjX2luX291dC5nbHNsJztcclxuaW1wb3J0IGVhc2VfY2lyY19vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfY2lyY19vdXQuZ2xzbCc7XHJcbmltcG9ydCBlYXNlX2N1YmljX2luIGZyb20gJy4vZ2xzbC9lYXNlX2N1YmljX2luLmdsc2wnO1xyXG5pbXBvcnQgZWFzZV9jdWJpY19pbl9vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfY3ViaWNfaW5fb3V0Lmdsc2wnO1xyXG5pbXBvcnQgZWFzZV9jdWJpY19vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfY3ViaWNfb3V0Lmdsc2wnO1xyXG5pbXBvcnQgZWFzZV9lbGFzdGljX2luIGZyb20gJy4vZ2xzbC9lYXNlX2VsYXN0aWNfaW4uZ2xzbCc7XHJcbmltcG9ydCBlYXNlX2VsYXN0aWNfaW5fb3V0IGZyb20gJy4vZ2xzbC9lYXNlX2VsYXN0aWNfaW5fb3V0Lmdsc2wnO1xyXG5pbXBvcnQgZWFzZV9lbGFzdGljX291dCBmcm9tICcuL2dsc2wvZWFzZV9lbGFzdGljX291dC5nbHNsJztcclxuaW1wb3J0IGVhc2VfZXhwb19pbiBmcm9tICcuL2dsc2wvZWFzZV9leHBvX2luLmdsc2wnO1xyXG5pbXBvcnQgZWFzZV9leHBvX2luX291dCBmcm9tICcuL2dsc2wvZWFzZV9leHBvX2luX291dC5nbHNsJztcclxuaW1wb3J0IGVhc2VfZXhwb19vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfZXhwb19vdXQuZ2xzbCc7XHJcbmltcG9ydCBlYXNlX3F1YWRfaW4gZnJvbSAnLi9nbHNsL2Vhc2VfcXVhZF9pbi5nbHNsJztcclxuaW1wb3J0IGVhc2VfcXVhZF9pbl9vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfcXVhZF9pbl9vdXQuZ2xzbCc7XHJcbmltcG9ydCBlYXNlX3F1YWRfb3V0IGZyb20gJy4vZ2xzbC9lYXNlX3F1YWRfb3V0Lmdsc2wnO1xyXG5pbXBvcnQgZWFzZV9xdWFydF9pbiBmcm9tICcuL2dsc2wvZWFzZV9xdWFydF9pbi5nbHNsJztcclxuaW1wb3J0IGVhc2VfcXVhcnRfaW5fb3V0IGZyb20gJy4vZ2xzbC9lYXNlX3F1YXJ0X2luX291dC5nbHNsJztcclxuaW1wb3J0IGVhc2VfcXVhcnRfb3V0IGZyb20gJy4vZ2xzbC9lYXNlX3F1YXJ0X291dC5nbHNsJztcclxuaW1wb3J0IGVhc2VfcXVpbnRfaW4gZnJvbSAnLi9nbHNsL2Vhc2VfcXVpbnRfaW4uZ2xzbCc7XHJcbmltcG9ydCBlYXNlX3F1aW50X2luX291dCBmcm9tICcuL2dsc2wvZWFzZV9xdWludF9pbl9vdXQuZ2xzbCc7XHJcbmltcG9ydCBlYXNlX3F1aW50X291dCBmcm9tICcuL2dsc2wvZWFzZV9xdWludF9vdXQuZ2xzbCc7XHJcbmltcG9ydCBlYXNlX3NpbmVfaW4gZnJvbSAnLi9nbHNsL2Vhc2Vfc2luZV9pbi5nbHNsJztcclxuaW1wb3J0IGVhc2Vfc2luZV9pbl9vdXQgZnJvbSAnLi9nbHNsL2Vhc2Vfc2luZV9pbl9vdXQuZ2xzbCc7XHJcbmltcG9ydCBlYXNlX3NpbmVfb3V0IGZyb20gJy4vZ2xzbC9lYXNlX3NpbmVfb3V0Lmdsc2wnO1xyXG5pbXBvcnQgcXVhdGVybmlvbl9yb3RhdGlvbiBmcm9tICcuL2dsc2wvcXVhdGVybmlvbl9yb3RhdGlvbi5nbHNsJztcclxuaW1wb3J0IHF1YXRlcm5pb25fc2xlcnAgZnJvbSAnLi9nbHNsL3F1YXRlcm5pb25fc2xlcnAuZ2xzbCc7XHJcblxyXG5cclxuZXhwb3J0IGNvbnN0IFNoYWRlckNodW5rID0ge1xyXG4gIGNhdG11bGxfcm9tX3NwbGluZTogY2F0bXVsbF9yb21fc3BsaW5lLFxyXG4gIGN1YmljX2JlemllcjogY3ViaWNfYmV6aWVyLFxyXG4gIGVhc2VfYmFja19pbjogZWFzZV9iYWNrX2luLFxyXG4gIGVhc2VfYmFja19pbl9vdXQ6IGVhc2VfYmFja19pbl9vdXQsXHJcbiAgZWFzZV9iYWNrX291dDogZWFzZV9iYWNrX291dCxcclxuICBlYXNlX2JlemllcjogZWFzZV9iZXppZXIsXHJcbiAgZWFzZV9ib3VuY2VfaW46IGVhc2VfYm91bmNlX2luLFxyXG4gIGVhc2VfYm91bmNlX2luX291dDogZWFzZV9ib3VuY2VfaW5fb3V0LFxyXG4gIGVhc2VfYm91bmNlX291dDogZWFzZV9ib3VuY2Vfb3V0LFxyXG4gIGVhc2VfY2lyY19pbjogZWFzZV9jaXJjX2luLFxyXG4gIGVhc2VfY2lyY19pbl9vdXQ6IGVhc2VfY2lyY19pbl9vdXQsXHJcbiAgZWFzZV9jaXJjX291dDogZWFzZV9jaXJjX291dCxcclxuICBlYXNlX2N1YmljX2luOiBlYXNlX2N1YmljX2luLFxyXG4gIGVhc2VfY3ViaWNfaW5fb3V0OiBlYXNlX2N1YmljX2luX291dCxcclxuICBlYXNlX2N1YmljX291dDogZWFzZV9jdWJpY19vdXQsXHJcbiAgZWFzZV9lbGFzdGljX2luOiBlYXNlX2VsYXN0aWNfaW4sXHJcbiAgZWFzZV9lbGFzdGljX2luX291dDogZWFzZV9lbGFzdGljX2luX291dCxcclxuICBlYXNlX2VsYXN0aWNfb3V0OiBlYXNlX2VsYXN0aWNfb3V0LFxyXG4gIGVhc2VfZXhwb19pbjogZWFzZV9leHBvX2luLFxyXG4gIGVhc2VfZXhwb19pbl9vdXQ6IGVhc2VfZXhwb19pbl9vdXQsXHJcbiAgZWFzZV9leHBvX291dDogZWFzZV9leHBvX291dCxcclxuICBlYXNlX3F1YWRfaW46IGVhc2VfcXVhZF9pbixcclxuICBlYXNlX3F1YWRfaW5fb3V0OiBlYXNlX3F1YWRfaW5fb3V0LFxyXG4gIGVhc2VfcXVhZF9vdXQ6IGVhc2VfcXVhZF9vdXQsXHJcbiAgZWFzZV9xdWFydF9pbjogZWFzZV9xdWFydF9pbixcclxuICBlYXNlX3F1YXJ0X2luX291dDogZWFzZV9xdWFydF9pbl9vdXQsXHJcbiAgZWFzZV9xdWFydF9vdXQ6IGVhc2VfcXVhcnRfb3V0LFxyXG4gIGVhc2VfcXVpbnRfaW46IGVhc2VfcXVpbnRfaW4sXHJcbiAgZWFzZV9xdWludF9pbl9vdXQ6IGVhc2VfcXVpbnRfaW5fb3V0LFxyXG4gIGVhc2VfcXVpbnRfb3V0OiBlYXNlX3F1aW50X291dCxcclxuICBlYXNlX3NpbmVfaW46IGVhc2Vfc2luZV9pbixcclxuICBlYXNlX3NpbmVfaW5fb3V0OiBlYXNlX3NpbmVfaW5fb3V0LFxyXG4gIGVhc2Vfc2luZV9vdXQ6IGVhc2Vfc2luZV9vdXQsXHJcbiAgcXVhdGVybmlvbl9yb3RhdGlvbjogcXVhdGVybmlvbl9yb3RhdGlvbixcclxuICBxdWF0ZXJuaW9uX3NsZXJwOiBxdWF0ZXJuaW9uX3NsZXJwLFxyXG5cclxufTtcclxuXHJcbiIsIi8qKlxyXG4gKiBBIHRpbWVsaW5lIHRyYW5zaXRpb24gc2VnbWVudC4gQW4gaW5zdGFuY2Ugb2YgdGhpcyBjbGFzcyBpcyBjcmVhdGVkIGludGVybmFsbHkgd2hlbiBjYWxsaW5nIHtAbGluayBUSFJFRS5CQVMuVGltZWxpbmUuYWRkfSwgc28geW91IHNob3VsZCBub3QgdXNlIHRoaXMgY2xhc3MgZGlyZWN0bHkuXHJcbiAqIFRoZSBpbnN0YW5jZSBpcyBhbHNvIHBhc3NlZCB0aGUgdGhlIGNvbXBpbGVyIGZ1bmN0aW9uIGlmIHlvdSByZWdpc3RlciBhIHRyYW5zaXRpb24gdGhyb3VnaCB7QGxpbmsgVEhSRUUuQkFTLlRpbWVsaW5lLnJlZ2lzdGVyfS4gVGhlcmUgeW91IGNhbiB1c2UgdGhlIHB1YmxpYyBwcm9wZXJ0aWVzIG9mIHRoZSBzZWdtZW50IHRvIGNvbXBpbGUgdGhlIGdsc2wgc3RyaW5nLlxyXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IEEgc3RyaW5nIGtleSBnZW5lcmF0ZWQgYnkgdGhlIHRpbWVsaW5lIHRvIHdoaWNoIHRoaXMgc2VnbWVudCBiZWxvbmdzLiBLZXlzIGFyZSB1bmlxdWUuXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBzdGFydCBTdGFydCB0aW1lIG9mIHRoaXMgc2VnbWVudCBpbiBhIHRpbWVsaW5lIGluIHNlY29uZHMuXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBkdXJhdGlvbiBEdXJhdGlvbiBvZiB0aGlzIHNlZ21lbnQgaW4gc2Vjb25kcy5cclxuICogQHBhcmFtIHtvYmplY3R9IHRyYW5zaXRpb24gT2JqZWN0IGRlc2NyaWJpbmcgdGhlIHRyYW5zaXRpb24uXHJcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGNvbXBpbGVyIEEgcmVmZXJlbmNlIHRvIHRoZSBjb21waWxlciBmdW5jdGlvbiBmcm9tIGEgdHJhbnNpdGlvbiBkZWZpbml0aW9uLlxyXG4gKiBAY29uc3RydWN0b3JcclxuICovXHJcbmZ1bmN0aW9uIFRpbWVsaW5lU2VnbWVudChrZXksIHN0YXJ0LCBkdXJhdGlvbiwgdHJhbnNpdGlvbiwgY29tcGlsZXIpIHtcclxuICB0aGlzLmtleSA9IGtleTtcclxuICB0aGlzLnN0YXJ0ID0gc3RhcnQ7XHJcbiAgdGhpcy5kdXJhdGlvbiA9IGR1cmF0aW9uO1xyXG4gIHRoaXMudHJhbnNpdGlvbiA9IHRyYW5zaXRpb247XHJcbiAgdGhpcy5jb21waWxlciA9IGNvbXBpbGVyO1xyXG5cclxuICB0aGlzLnRyYWlsID0gMDtcclxufVxyXG5cclxuVGltZWxpbmVTZWdtZW50LnByb3RvdHlwZS5jb21waWxlID0gZnVuY3Rpb24oKSB7XHJcbiAgcmV0dXJuIHRoaXMuY29tcGlsZXIodGhpcyk7XHJcbn07XHJcblxyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoVGltZWxpbmVTZWdtZW50LnByb3RvdHlwZSwgJ2VuZCcsIHtcclxuICBnZXQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuc3RhcnQgKyB0aGlzLmR1cmF0aW9uO1xyXG4gIH1cclxufSk7XHJcblxyXG5leHBvcnQgeyBUaW1lbGluZVNlZ21lbnQgfTtcclxuIiwiaW1wb3J0IHsgVGltZWxpbmVTZWdtZW50IH0gZnJvbSAnLi9UaW1lbGluZVNlZ21lbnQnO1xyXG5cclxuLyoqXHJcbiAqIEEgdXRpbGl0eSBjbGFzcyB0byBjcmVhdGUgYW4gYW5pbWF0aW9uIHRpbWVsaW5lIHdoaWNoIGNhbiBiZSBiYWtlZCBpbnRvIGEgKHZlcnRleCkgc2hhZGVyLlxyXG4gKiBCeSBkZWZhdWx0IHRoZSB0aW1lbGluZSBzdXBwb3J0cyB0cmFuc2xhdGlvbiwgc2NhbGUgYW5kIHJvdGF0aW9uLiBUaGlzIGNhbiBiZSBleHRlbmRlZCBvciBvdmVycmlkZGVuLlxyXG4gKiBAY29uc3RydWN0b3JcclxuICovXHJcbmZ1bmN0aW9uIFRpbWVsaW5lKCkge1xyXG4gIC8qKlxyXG4gICAqIFRoZSB0b3RhbCBkdXJhdGlvbiBvZiB0aGUgdGltZWxpbmUgaW4gc2Vjb25kcy5cclxuICAgKiBAdHlwZSB7bnVtYmVyfVxyXG4gICAqL1xyXG4gIHRoaXMuZHVyYXRpb24gPSAwO1xyXG5cclxuICAvKipcclxuICAgKiBUaGUgbmFtZSBvZiB0aGUgdmFsdWUgdGhhdCBzZWdtZW50cyB3aWxsIHVzZSB0byByZWFkIHRoZSB0aW1lLiBEZWZhdWx0cyB0byAndFRpbWUnLlxyXG4gICAqIEB0eXBlIHtzdHJpbmd9XHJcbiAgICovXHJcbiAgdGhpcy50aW1lS2V5ID0gJ3RUaW1lJztcclxuXHJcbiAgdGhpcy5zZWdtZW50cyA9IHt9O1xyXG4gIHRoaXMuX19rZXkgPSAwO1xyXG59XHJcblxyXG4vLyBzdGF0aWMgZGVmaW5pdGlvbnMgbWFwXHJcblRpbWVsaW5lLnNlZ21lbnREZWZpbml0aW9ucyA9IHt9O1xyXG5cclxuLyoqXHJcbiAqIFJlZ2lzdGVycyBhIHRyYW5zaXRpb24gZGVmaW5pdGlvbiBmb3IgdXNlIHdpdGgge0BsaW5rIFRIUkVFLkJBUy5UaW1lbGluZS5hZGR9LlxyXG4gKiBAcGFyYW0ge1N0cmluZ30ga2V5IE5hbWUgb2YgdGhlIHRyYW5zaXRpb24uIERlZmF1bHRzIGluY2x1ZGUgJ3NjYWxlJywgJ3JvdGF0ZScgYW5kICd0cmFuc2xhdGUnLlxyXG4gKiBAcGFyYW0ge09iamVjdH0gZGVmaW5pdGlvblxyXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBkZWZpbml0aW9uLmNvbXBpbGVyIEEgZnVuY3Rpb24gdGhhdCBnZW5lcmF0ZXMgYSBnbHNsIHN0cmluZyBmb3IgYSB0cmFuc2l0aW9uIHNlZ21lbnQuIEFjY2VwdHMgYSBUSFJFRS5CQVMuVGltZWxpbmVTZWdtZW50IGFzIHRoZSBzb2xlIGFyZ3VtZW50LlxyXG4gKiBAcGFyYW0geyp9IGRlZmluaXRpb24uZGVmYXVsdEZyb20gVGhlIGluaXRpYWwgdmFsdWUgZm9yIGEgdHJhbnNmb3JtLmZyb20uIEZvciBleGFtcGxlLCB0aGUgZGVmYXVsdEZyb20gZm9yIGEgdHJhbnNsYXRpb24gaXMgVEhSRUUuVmVjdG9yMygwLCAwLCAwKS5cclxuICogQHN0YXRpY1xyXG4gKi9cclxuVGltZWxpbmUucmVnaXN0ZXIgPSBmdW5jdGlvbihrZXksIGRlZmluaXRpb24pIHtcclxuICBUaW1lbGluZS5zZWdtZW50RGVmaW5pdGlvbnNba2V5XSA9IGRlZmluaXRpb247XHJcbiAgXHJcbiAgcmV0dXJuIGRlZmluaXRpb247XHJcbn07XHJcblxyXG4vKipcclxuICogQWRkIGEgdHJhbnNpdGlvbiB0byB0aGUgdGltZWxpbmUuXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBkdXJhdGlvbiBEdXJhdGlvbiBpbiBzZWNvbmRzXHJcbiAqIEBwYXJhbSB7b2JqZWN0fSB0cmFuc2l0aW9ucyBBbiBvYmplY3QgY29udGFpbmluZyBvbmUgb3Igc2V2ZXJhbCB0cmFuc2l0aW9ucy4gVGhlIGtleXMgc2hvdWxkIG1hdGNoIHRyYW5zZm9ybSBkZWZpbml0aW9ucy5cclxuICogVGhlIHRyYW5zaXRpb24gb2JqZWN0IGZvciBlYWNoIGtleSB3aWxsIGJlIHBhc3NlZCB0byB0aGUgbWF0Y2hpbmcgZGVmaW5pdGlvbidzIGNvbXBpbGVyLiBJdCBjYW4gaGF2ZSBhcmJpdHJhcnkgcHJvcGVydGllcywgYnV0IHRoZSBUaW1lbGluZSBleHBlY3RzIGF0IGxlYXN0IGEgJ3RvJywgJ2Zyb20nIGFuZCBhbiBvcHRpb25hbCAnZWFzZScuXHJcbiAqIEBwYXJhbSB7bnVtYmVyfHN0cmluZ30gW3Bvc2l0aW9uT2Zmc2V0XSBQb3NpdGlvbiBpbiB0aGUgdGltZWxpbmUuIERlZmF1bHRzIHRvIHRoZSBlbmQgb2YgdGhlIHRpbWVsaW5lLiBJZiBhIG51bWJlciBpcyBwcm92aWRlZCwgdGhlIHRyYW5zaXRpb24gd2lsbCBiZSBpbnNlcnRlZCBhdCB0aGF0IHRpbWUgaW4gc2Vjb25kcy4gU3RyaW5ncyAoJys9eCcgb3IgJy09eCcpIGNhbiBiZSB1c2VkIGZvciBhIHZhbHVlIHJlbGF0aXZlIHRvIHRoZSBlbmQgb2YgdGltZWxpbmUuXHJcbiAqL1xyXG5UaW1lbGluZS5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24oZHVyYXRpb24sIHRyYW5zaXRpb25zLCBwb3NpdGlvbk9mZnNldCkge1xyXG4gIC8vIHN0b3Agcm9sbHVwIGZyb20gY29tcGxhaW5pbmcgYWJvdXQgZXZhbFxyXG4gIGNvbnN0IF9ldmFsID0gZXZhbDtcclxuICBcclxuICBsZXQgc3RhcnQgPSB0aGlzLmR1cmF0aW9uO1xyXG5cclxuICBpZiAocG9zaXRpb25PZmZzZXQgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgaWYgKHR5cGVvZiBwb3NpdGlvbk9mZnNldCA9PT0gJ251bWJlcicpIHtcclxuICAgICAgc3RhcnQgPSBwb3NpdGlvbk9mZnNldDtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKHR5cGVvZiBwb3NpdGlvbk9mZnNldCA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgX2V2YWwoJ3N0YXJ0JyArIHBvc2l0aW9uT2Zmc2V0KTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmR1cmF0aW9uID0gTWF0aC5tYXgodGhpcy5kdXJhdGlvbiwgc3RhcnQgKyBkdXJhdGlvbik7XHJcbiAgfVxyXG4gIGVsc2Uge1xyXG4gICAgdGhpcy5kdXJhdGlvbiArPSBkdXJhdGlvbjtcclxuICB9XHJcblxyXG4gIGxldCBrZXlzID0gT2JqZWN0LmtleXModHJhbnNpdGlvbnMpLCBrZXk7XHJcblxyXG4gIGZvciAobGV0IGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7IGkrKykge1xyXG4gICAga2V5ID0ga2V5c1tpXTtcclxuXHJcbiAgICB0aGlzLnByb2Nlc3NUcmFuc2l0aW9uKGtleSwgdHJhbnNpdGlvbnNba2V5XSwgc3RhcnQsIGR1cmF0aW9uKTtcclxuICB9XHJcbn07XHJcblxyXG5UaW1lbGluZS5wcm90b3R5cGUucHJvY2Vzc1RyYW5zaXRpb24gPSBmdW5jdGlvbihrZXksIHRyYW5zaXRpb24sIHN0YXJ0LCBkdXJhdGlvbikge1xyXG4gIGNvbnN0IGRlZmluaXRpb24gPSBUaW1lbGluZS5zZWdtZW50RGVmaW5pdGlvbnNba2V5XTtcclxuXHJcbiAgbGV0IHNlZ21lbnRzID0gdGhpcy5zZWdtZW50c1trZXldO1xyXG4gIGlmICghc2VnbWVudHMpIHNlZ21lbnRzID0gdGhpcy5zZWdtZW50c1trZXldID0gW107XHJcblxyXG4gIGlmICh0cmFuc2l0aW9uLmZyb20gPT09IHVuZGVmaW5lZCkge1xyXG4gICAgaWYgKHNlZ21lbnRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICB0cmFuc2l0aW9uLmZyb20gPSBkZWZpbml0aW9uLmRlZmF1bHRGcm9tO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIHRyYW5zaXRpb24uZnJvbSA9IHNlZ21lbnRzW3NlZ21lbnRzLmxlbmd0aCAtIDFdLnRyYW5zaXRpb24udG87XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBzZWdtZW50cy5wdXNoKG5ldyBUaW1lbGluZVNlZ21lbnQoKHRoaXMuX19rZXkrKykudG9TdHJpbmcoKSwgc3RhcnQsIGR1cmF0aW9uLCB0cmFuc2l0aW9uLCBkZWZpbml0aW9uLmNvbXBpbGVyKSk7XHJcbn07XHJcblxyXG4vKipcclxuICogQ29tcGlsZXMgdGhlIHRpbWVsaW5lIGludG8gYSBnbHNsIHN0cmluZyBhcnJheSB0aGF0IGNhbiBiZSBpbmplY3RlZCBpbnRvIGEgKHZlcnRleCkgc2hhZGVyLlxyXG4gKiBAcmV0dXJucyB7QXJyYXl9XHJcbiAqL1xyXG5UaW1lbGluZS5wcm90b3R5cGUuY29tcGlsZSA9IGZ1bmN0aW9uKCkge1xyXG4gIGNvbnN0IGMgPSBbXTtcclxuXHJcbiAgY29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKHRoaXMuc2VnbWVudHMpO1xyXG4gIGxldCBzZWdtZW50cztcclxuXHJcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICBzZWdtZW50cyA9IHRoaXMuc2VnbWVudHNba2V5c1tpXV07XHJcblxyXG4gICAgdGhpcy5maWxsR2FwcyhzZWdtZW50cyk7XHJcblxyXG4gICAgc2VnbWVudHMuZm9yRWFjaChmdW5jdGlvbihzKSB7XHJcbiAgICAgIGMucHVzaChzLmNvbXBpbGUoKSk7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIHJldHVybiBjO1xyXG59O1xyXG5UaW1lbGluZS5wcm90b3R5cGUuZmlsbEdhcHMgPSBmdW5jdGlvbihzZWdtZW50cykge1xyXG4gIGlmIChzZWdtZW50cy5sZW5ndGggPT09IDApIHJldHVybjtcclxuXHJcbiAgbGV0IHMwLCBzMTtcclxuXHJcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBzZWdtZW50cy5sZW5ndGggLSAxOyBpKyspIHtcclxuICAgIHMwID0gc2VnbWVudHNbaV07XHJcbiAgICBzMSA9IHNlZ21lbnRzW2kgKyAxXTtcclxuXHJcbiAgICBzMC50cmFpbCA9IHMxLnN0YXJ0IC0gczAuZW5kO1xyXG4gIH1cclxuXHJcbiAgLy8gcGFkIGxhc3Qgc2VnbWVudCB1bnRpbCBlbmQgb2YgdGltZWxpbmVcclxuICBzMCA9IHNlZ21lbnRzW3NlZ21lbnRzLmxlbmd0aCAtIDFdO1xyXG4gIHMwLnRyYWlsID0gdGhpcy5kdXJhdGlvbiAtIHMwLmVuZDtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBHZXQgYSBjb21waWxlZCBnbHNsIHN0cmluZyB3aXRoIGNhbGxzIHRvIHRyYW5zZm9ybSBmdW5jdGlvbnMgZm9yIGEgZ2l2ZW4ga2V5LlxyXG4gKiBUaGUgb3JkZXIgaW4gd2hpY2ggdGhlc2UgdHJhbnNpdGlvbnMgYXJlIGFwcGxpZWQgbWF0dGVycyBiZWNhdXNlIHRoZXkgYWxsIG9wZXJhdGUgb24gdGhlIHNhbWUgdmFsdWUuXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgQSBrZXkgbWF0Y2hpbmcgYSB0cmFuc2Zvcm0gZGVmaW5pdGlvbi5cclxuICogQHJldHVybnMge3N0cmluZ31cclxuICovXHJcblRpbWVsaW5lLnByb3RvdHlwZS5nZXRUcmFuc2Zvcm1DYWxscyA9IGZ1bmN0aW9uKGtleSkge1xyXG4gIGxldCB0ID0gdGhpcy50aW1lS2V5O1xyXG5cclxuICByZXR1cm4gdGhpcy5zZWdtZW50c1trZXldID8gIHRoaXMuc2VnbWVudHNba2V5XS5tYXAoZnVuY3Rpb24ocykge1xyXG4gICAgcmV0dXJuIGBhcHBseVRyYW5zZm9ybSR7cy5rZXl9KCR7dH0sIHRyYW5zZm9ybWVkKTtgO1xyXG4gIH0pLmpvaW4oJ1xcbicpIDogJyc7XHJcbn07XHJcblxyXG5leHBvcnQgeyBUaW1lbGluZSB9XHJcbiIsImNvbnN0IFRpbWVsaW5lQ2h1bmtzID0ge1xyXG4gIHZlYzM6IGZ1bmN0aW9uKG4sIHYsIHApIHtcclxuICAgIGNvbnN0IHggPSAodi54IHx8IDApLnRvUHJlY2lzaW9uKHApO1xyXG4gICAgY29uc3QgeSA9ICh2LnkgfHwgMCkudG9QcmVjaXNpb24ocCk7XHJcbiAgICBjb25zdCB6ID0gKHYueiB8fCAwKS50b1ByZWNpc2lvbihwKTtcclxuXHJcbiAgICByZXR1cm4gYHZlYzMgJHtufSA9IHZlYzMoJHt4fSwgJHt5fSwgJHt6fSk7YDtcclxuICB9LFxyXG4gIHZlYzQ6IGZ1bmN0aW9uKG4sIHYsIHApIHtcclxuICAgIGNvbnN0IHggPSAodi54IHx8IDApLnRvUHJlY2lzaW9uKHApO1xyXG4gICAgY29uc3QgeSA9ICh2LnkgfHwgMCkudG9QcmVjaXNpb24ocCk7XHJcbiAgICBjb25zdCB6ID0gKHYueiB8fCAwKS50b1ByZWNpc2lvbihwKTtcclxuICAgIGNvbnN0IHcgPSAodi53IHx8IDApLnRvUHJlY2lzaW9uKHApO1xyXG4gIFxyXG4gICAgcmV0dXJuIGB2ZWM0ICR7bn0gPSB2ZWM0KCR7eH0sICR7eX0sICR7en0sICR7d30pO2A7XHJcbiAgfSxcclxuICBkZWxheUR1cmF0aW9uOiBmdW5jdGlvbihzZWdtZW50KSB7XHJcbiAgICByZXR1cm4gYFxyXG4gICAgZmxvYXQgY0RlbGF5JHtzZWdtZW50LmtleX0gPSAke3NlZ21lbnQuc3RhcnQudG9QcmVjaXNpb24oNCl9O1xyXG4gICAgZmxvYXQgY0R1cmF0aW9uJHtzZWdtZW50LmtleX0gPSAke3NlZ21lbnQuZHVyYXRpb24udG9QcmVjaXNpb24oNCl9O1xyXG4gICAgYDtcclxuICB9LFxyXG4gIHByb2dyZXNzOiBmdW5jdGlvbihzZWdtZW50KSB7XHJcbiAgICAvLyB6ZXJvIGR1cmF0aW9uIHNlZ21lbnRzIHNob3VsZCBhbHdheXMgcmVuZGVyIGNvbXBsZXRlXHJcbiAgICBpZiAoc2VnbWVudC5kdXJhdGlvbiA9PT0gMCkge1xyXG4gICAgICByZXR1cm4gYGZsb2F0IHByb2dyZXNzID0gMS4wO2BcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICByZXR1cm4gYFxyXG4gICAgICBmbG9hdCBwcm9ncmVzcyA9IGNsYW1wKHRpbWUgLSBjRGVsYXkke3NlZ21lbnQua2V5fSwgMC4wLCBjRHVyYXRpb24ke3NlZ21lbnQua2V5fSkgLyBjRHVyYXRpb24ke3NlZ21lbnQua2V5fTtcclxuICAgICAgJHtzZWdtZW50LnRyYW5zaXRpb24uZWFzZSA/IGBwcm9ncmVzcyA9ICR7c2VnbWVudC50cmFuc2l0aW9uLmVhc2V9KHByb2dyZXNzJHsoc2VnbWVudC50cmFuc2l0aW9uLmVhc2VQYXJhbXMgPyBgLCAke3NlZ21lbnQudHJhbnNpdGlvbi5lYXNlUGFyYW1zLm1hcCgodikgPT4gdi50b1ByZWNpc2lvbig0KSkuam9pbihgLCBgKX1gIDogYGApfSk7YCA6IGBgfVxyXG4gICAgICBgO1xyXG4gICAgfVxyXG4gIH0sXHJcbiAgcmVuZGVyQ2hlY2s6IGZ1bmN0aW9uKHNlZ21lbnQpIHtcclxuICAgIGNvbnN0IHN0YXJ0VGltZSA9IHNlZ21lbnQuc3RhcnQudG9QcmVjaXNpb24oNCk7XHJcbiAgICBjb25zdCBlbmRUaW1lID0gKHNlZ21lbnQuZW5kICsgc2VnbWVudC50cmFpbCkudG9QcmVjaXNpb24oNCk7XHJcblxyXG4gICAgcmV0dXJuIGBpZiAodGltZSA8ICR7c3RhcnRUaW1lfSB8fCB0aW1lID4gJHtlbmRUaW1lfSkgcmV0dXJuO2A7XHJcbiAgfVxyXG59O1xyXG5cclxuZXhwb3J0IHsgVGltZWxpbmVDaHVua3MgfTtcclxuIiwiaW1wb3J0IHsgVGltZWxpbmUgfSBmcm9tICcuL1RpbWVsaW5lJztcclxuaW1wb3J0IHsgVGltZWxpbmVDaHVua3MgfSBmcm9tICcuL1RpbWVsaW5lQ2h1bmtzJztcclxuaW1wb3J0IHsgVmVjdG9yMyB9IGZyb20gJ3RocmVlJztcclxuXHJcbmNvbnN0IFRyYW5zbGF0aW9uU2VnbWVudCA9IHtcclxuICBjb21waWxlcjogZnVuY3Rpb24oc2VnbWVudCkge1xyXG4gICAgcmV0dXJuIGBcclxuICAgICR7VGltZWxpbmVDaHVua3MuZGVsYXlEdXJhdGlvbihzZWdtZW50KX1cclxuICAgICR7VGltZWxpbmVDaHVua3MudmVjMyhgY1RyYW5zbGF0ZUZyb20ke3NlZ21lbnQua2V5fWAsIHNlZ21lbnQudHJhbnNpdGlvbi5mcm9tLCAyKX1cclxuICAgICR7VGltZWxpbmVDaHVua3MudmVjMyhgY1RyYW5zbGF0ZVRvJHtzZWdtZW50LmtleX1gLCBzZWdtZW50LnRyYW5zaXRpb24udG8sIDIpfVxyXG4gICAgXHJcbiAgICB2b2lkIGFwcGx5VHJhbnNmb3JtJHtzZWdtZW50LmtleX0oZmxvYXQgdGltZSwgaW5vdXQgdmVjMyB2KSB7XHJcbiAgICBcclxuICAgICAgJHtUaW1lbGluZUNodW5rcy5yZW5kZXJDaGVjayhzZWdtZW50KX1cclxuICAgICAgJHtUaW1lbGluZUNodW5rcy5wcm9ncmVzcyhzZWdtZW50KX1cclxuICAgIFxyXG4gICAgICB2ICs9IG1peChjVHJhbnNsYXRlRnJvbSR7c2VnbWVudC5rZXl9LCBjVHJhbnNsYXRlVG8ke3NlZ21lbnQua2V5fSwgcHJvZ3Jlc3MpO1xyXG4gICAgfVxyXG4gICAgYDtcclxuICB9LFxyXG4gIGRlZmF1bHRGcm9tOiBuZXcgVmVjdG9yMygwLCAwLCAwKVxyXG59O1xyXG5cclxuVGltZWxpbmUucmVnaXN0ZXIoJ3RyYW5zbGF0ZScsIFRyYW5zbGF0aW9uU2VnbWVudCk7XHJcblxyXG5leHBvcnQgeyBUcmFuc2xhdGlvblNlZ21lbnQgfTtcclxuIiwiaW1wb3J0IHsgVGltZWxpbmUgfSBmcm9tICcuL1RpbWVsaW5lJztcclxuaW1wb3J0IHsgVGltZWxpbmVDaHVua3MgfSBmcm9tICcuL1RpbWVsaW5lQ2h1bmtzJztcclxuaW1wb3J0IHsgVmVjdG9yMyB9IGZyb20gJ3RocmVlJztcclxuXHJcbmNvbnN0IFNjYWxlU2VnbWVudCA9IHtcclxuICBjb21waWxlcjogZnVuY3Rpb24oc2VnbWVudCkge1xyXG4gICAgY29uc3Qgb3JpZ2luID0gc2VnbWVudC50cmFuc2l0aW9uLm9yaWdpbjtcclxuICAgIFxyXG4gICAgcmV0dXJuIGBcclxuICAgICR7VGltZWxpbmVDaHVua3MuZGVsYXlEdXJhdGlvbihzZWdtZW50KX1cclxuICAgICR7VGltZWxpbmVDaHVua3MudmVjMyhgY1NjYWxlRnJvbSR7c2VnbWVudC5rZXl9YCwgc2VnbWVudC50cmFuc2l0aW9uLmZyb20sIDIpfVxyXG4gICAgJHtUaW1lbGluZUNodW5rcy52ZWMzKGBjU2NhbGVUbyR7c2VnbWVudC5rZXl9YCwgc2VnbWVudC50cmFuc2l0aW9uLnRvLCAyKX1cclxuICAgICR7b3JpZ2luID8gVGltZWxpbmVDaHVua3MudmVjMyhgY09yaWdpbiR7c2VnbWVudC5rZXl9YCwgb3JpZ2luLCAyKSA6ICcnfVxyXG4gICAgXHJcbiAgICB2b2lkIGFwcGx5VHJhbnNmb3JtJHtzZWdtZW50LmtleX0oZmxvYXQgdGltZSwgaW5vdXQgdmVjMyB2KSB7XHJcbiAgICBcclxuICAgICAgJHtUaW1lbGluZUNodW5rcy5yZW5kZXJDaGVjayhzZWdtZW50KX1cclxuICAgICAgJHtUaW1lbGluZUNodW5rcy5wcm9ncmVzcyhzZWdtZW50KX1cclxuICAgIFxyXG4gICAgICAke29yaWdpbiA/IGB2IC09IGNPcmlnaW4ke3NlZ21lbnQua2V5fTtgIDogJyd9XHJcbiAgICAgIHYgKj0gbWl4KGNTY2FsZUZyb20ke3NlZ21lbnQua2V5fSwgY1NjYWxlVG8ke3NlZ21lbnQua2V5fSwgcHJvZ3Jlc3MpO1xyXG4gICAgICAke29yaWdpbiA/IGB2ICs9IGNPcmlnaW4ke3NlZ21lbnQua2V5fTtgIDogJyd9XHJcbiAgICB9XHJcbiAgICBgO1xyXG4gIH0sXHJcbiAgZGVmYXVsdEZyb206IG5ldyBWZWN0b3IzKDEsIDEsIDEpXHJcbn07XHJcblxyXG5UaW1lbGluZS5yZWdpc3Rlcignc2NhbGUnLCBTY2FsZVNlZ21lbnQpO1xyXG5cclxuZXhwb3J0IHsgU2NhbGVTZWdtZW50IH07XHJcbiIsImltcG9ydCB7IFRpbWVsaW5lIH0gZnJvbSAnLi9UaW1lbGluZSc7XHJcbmltcG9ydCB7IFRpbWVsaW5lQ2h1bmtzIH0gZnJvbSAnLi9UaW1lbGluZUNodW5rcyc7XHJcbmltcG9ydCB7IFZlY3RvcjMsIFZlY3RvcjQgfSBmcm9tICd0aHJlZSc7XHJcblxyXG5jb25zdCBSb3RhdGlvblNlZ21lbnQgPSB7XHJcbiAgY29tcGlsZXIoc2VnbWVudCkge1xyXG4gICAgY29uc3QgZnJvbUF4aXNBbmdsZSA9IG5ldyBWZWN0b3I0KFxyXG4gICAgICBzZWdtZW50LnRyYW5zaXRpb24uZnJvbS5heGlzLngsXHJcbiAgICAgIHNlZ21lbnQudHJhbnNpdGlvbi5mcm9tLmF4aXMueSxcclxuICAgICAgc2VnbWVudC50cmFuc2l0aW9uLmZyb20uYXhpcy56LFxyXG4gICAgICBzZWdtZW50LnRyYW5zaXRpb24uZnJvbS5hbmdsZVxyXG4gICAgKTtcclxuICBcclxuICAgIGNvbnN0IHRvQXhpcyA9IHNlZ21lbnQudHJhbnNpdGlvbi50by5heGlzIHx8IHNlZ21lbnQudHJhbnNpdGlvbi5mcm9tLmF4aXM7XHJcbiAgICBjb25zdCB0b0F4aXNBbmdsZSA9IG5ldyBWZWN0b3I0KFxyXG4gICAgICB0b0F4aXMueCxcclxuICAgICAgdG9BeGlzLnksXHJcbiAgICAgIHRvQXhpcy56LFxyXG4gICAgICBzZWdtZW50LnRyYW5zaXRpb24udG8uYW5nbGVcclxuICAgICk7XHJcbiAgXHJcbiAgICBjb25zdCBvcmlnaW4gPSBzZWdtZW50LnRyYW5zaXRpb24ub3JpZ2luO1xyXG4gICAgXHJcbiAgICByZXR1cm4gYFxyXG4gICAgJHtUaW1lbGluZUNodW5rcy5kZWxheUR1cmF0aW9uKHNlZ21lbnQpfVxyXG4gICAgJHtUaW1lbGluZUNodW5rcy52ZWM0KGBjUm90YXRpb25Gcm9tJHtzZWdtZW50LmtleX1gLCBmcm9tQXhpc0FuZ2xlLCA4KX1cclxuICAgICR7VGltZWxpbmVDaHVua3MudmVjNChgY1JvdGF0aW9uVG8ke3NlZ21lbnQua2V5fWAsIHRvQXhpc0FuZ2xlLCA4KX1cclxuICAgICR7b3JpZ2luID8gVGltZWxpbmVDaHVua3MudmVjMyhgY09yaWdpbiR7c2VnbWVudC5rZXl9YCwgb3JpZ2luLCAyKSA6ICcnfVxyXG4gICAgXHJcbiAgICB2b2lkIGFwcGx5VHJhbnNmb3JtJHtzZWdtZW50LmtleX0oZmxvYXQgdGltZSwgaW5vdXQgdmVjMyB2KSB7XHJcbiAgICAgICR7VGltZWxpbmVDaHVua3MucmVuZGVyQ2hlY2soc2VnbWVudCl9XHJcbiAgICAgICR7VGltZWxpbmVDaHVua3MucHJvZ3Jlc3Moc2VnbWVudCl9XHJcblxyXG4gICAgICAke29yaWdpbiA/IGB2IC09IGNPcmlnaW4ke3NlZ21lbnQua2V5fTtgIDogJyd9XHJcbiAgICAgIHZlYzMgYXhpcyA9IG5vcm1hbGl6ZShtaXgoY1JvdGF0aW9uRnJvbSR7c2VnbWVudC5rZXl9Lnh5eiwgY1JvdGF0aW9uVG8ke3NlZ21lbnQua2V5fS54eXosIHByb2dyZXNzKSk7XHJcbiAgICAgIGZsb2F0IGFuZ2xlID0gbWl4KGNSb3RhdGlvbkZyb20ke3NlZ21lbnQua2V5fS53LCBjUm90YXRpb25UbyR7c2VnbWVudC5rZXl9LncsIHByb2dyZXNzKTtcclxuICAgICAgdmVjNCBxID0gcXVhdEZyb21BeGlzQW5nbGUoYXhpcywgYW5nbGUpO1xyXG4gICAgICB2ID0gcm90YXRlVmVjdG9yKHEsIHYpO1xyXG4gICAgICAke29yaWdpbiA/IGB2ICs9IGNPcmlnaW4ke3NlZ21lbnQua2V5fTtgIDogJyd9XHJcbiAgICB9XHJcbiAgICBgO1xyXG4gIH0sXHJcbiAgZGVmYXVsdEZyb206IHtheGlzOiBuZXcgVmVjdG9yMygpLCBhbmdsZTogMH1cclxufTtcclxuXHJcblRpbWVsaW5lLnJlZ2lzdGVyKCdyb3RhdGUnLCBSb3RhdGlvblNlZ21lbnQpO1xyXG5cclxuZXhwb3J0IHsgUm90YXRpb25TZWdtZW50IH07XHJcbiJdLCJuYW1lcyI6WyJCYXNlQW5pbWF0aW9uTWF0ZXJpYWwiLCJwYXJhbWV0ZXJzIiwidW5pZm9ybXMiLCJjYWxsIiwidW5pZm9ybVZhbHVlcyIsInNldFZhbHVlcyIsIlVuaWZvcm1zVXRpbHMiLCJtZXJnZSIsInNldFVuaWZvcm1WYWx1ZXMiLCJtYXAiLCJkZWZpbmVzIiwibm9ybWFsTWFwIiwiZW52TWFwIiwiYW9NYXAiLCJzcGVjdWxhck1hcCIsImFscGhhTWFwIiwibGlnaHRNYXAiLCJlbWlzc2l2ZU1hcCIsImJ1bXBNYXAiLCJkaXNwbGFjZW1lbnRNYXAiLCJyb3VnaG5lc3NNYXAiLCJtZXRhbG5lc3NNYXAiLCJlbnZNYXBUeXBlRGVmaW5lIiwiZW52TWFwTW9kZURlZmluZSIsImVudk1hcEJsZW5kaW5nRGVmaW5lIiwibWFwcGluZyIsIkN1YmVSZWZsZWN0aW9uTWFwcGluZyIsIkN1YmVSZWZyYWN0aW9uTWFwcGluZyIsIkN1YmVVVlJlZmxlY3Rpb25NYXBwaW5nIiwiQ3ViZVVWUmVmcmFjdGlvbk1hcHBpbmciLCJFcXVpcmVjdGFuZ3VsYXJSZWZsZWN0aW9uTWFwcGluZyIsIkVxdWlyZWN0YW5ndWxhclJlZnJhY3Rpb25NYXBwaW5nIiwiU3BoZXJpY2FsUmVmbGVjdGlvbk1hcHBpbmciLCJjb21iaW5lIiwiTWl4T3BlcmF0aW9uIiwiQWRkT3BlcmF0aW9uIiwiTXVsdGlwbHlPcGVyYXRpb24iLCJwcm90b3R5cGUiLCJPYmplY3QiLCJhc3NpZ24iLCJjcmVhdGUiLCJTaGFkZXJNYXRlcmlhbCIsInZhbHVlcyIsImtleXMiLCJmb3JFYWNoIiwia2V5IiwidmFsdWUiLCJuYW1lIiwiam9pbiIsIkJhc2ljQW5pbWF0aW9uTWF0ZXJpYWwiLCJ2YXJ5aW5nUGFyYW1ldGVycyIsInZlcnRleFBhcmFtZXRlcnMiLCJ2ZXJ0ZXhGdW5jdGlvbnMiLCJ2ZXJ0ZXhJbml0IiwidmVydGV4Tm9ybWFsIiwidmVydGV4UG9zaXRpb24iLCJ2ZXJ0ZXhDb2xvciIsImZyYWdtZW50RnVuY3Rpb25zIiwiZnJhZ21lbnRQYXJhbWV0ZXJzIiwiZnJhZ21lbnRJbml0IiwiZnJhZ21lbnRNYXAiLCJmcmFnbWVudERpZmZ1c2UiLCJTaGFkZXJMaWIiLCJsaWdodHMiLCJ2ZXJ0ZXhTaGFkZXIiLCJjb25jYXRWZXJ0ZXhTaGFkZXIiLCJmcmFnbWVudFNoYWRlciIsImNvbmNhdEZyYWdtZW50U2hhZGVyIiwiY29uc3RydWN0b3IiLCJzdHJpbmdpZnlDaHVuayIsIkxhbWJlcnRBbmltYXRpb25NYXRlcmlhbCIsImZyYWdtZW50RW1pc3NpdmUiLCJmcmFnbWVudFNwZWN1bGFyIiwiUGhvbmdBbmltYXRpb25NYXRlcmlhbCIsIlN0YW5kYXJkQW5pbWF0aW9uTWF0ZXJpYWwiLCJmcmFnbWVudFJvdWdobmVzcyIsImZyYWdtZW50TWV0YWxuZXNzIiwiUG9pbnRzQW5pbWF0aW9uTWF0ZXJpYWwiLCJmcmFnbWVudFNoYXBlIiwiRGVwdGhBbmltYXRpb25NYXRlcmlhbCIsImRlcHRoUGFja2luZyIsIlJHQkFEZXB0aFBhY2tpbmciLCJjbGlwcGluZyIsIkRpc3RhbmNlQW5pbWF0aW9uTWF0ZXJpYWwiLCJQcmVmYWJCdWZmZXJHZW9tZXRyeSIsInByZWZhYiIsImNvdW50IiwicHJlZmFiR2VvbWV0cnkiLCJwcmVmYWJDb3VudCIsInByZWZhYlZlcnRleENvdW50IiwidmVydGljZXMiLCJsZW5ndGgiLCJidWZmZXJJbmRpY2VzIiwiYnVmZmVyUG9zaXRpb25zIiwiQnVmZmVyR2VvbWV0cnkiLCJwcmVmYWJGYWNlQ291bnQiLCJmYWNlcyIsInByZWZhYkluZGV4Q291bnQiLCJwcmVmYWJJbmRpY2VzIiwiaCIsImZhY2UiLCJwdXNoIiwiYSIsImIiLCJjIiwiaW5kZXhCdWZmZXIiLCJVaW50MzJBcnJheSIsInNldEluZGV4IiwiQnVmZmVyQXR0cmlidXRlIiwiaSIsImsiLCJwb3NpdGlvbkJ1ZmZlciIsImNyZWF0ZUF0dHJpYnV0ZSIsImFycmF5Iiwib2Zmc2V0IiwiaiIsInByZWZhYlZlcnRleCIsIngiLCJ5IiwieiIsImJ1ZmZlclV2cyIsInByZWZhYlV2cyIsInV2IiwiZmFjZVZlcnRleFV2cyIsInV2QnVmZmVyIiwicHJlZmFiVXYiLCJpdGVtU2l6ZSIsImZhY3RvcnkiLCJidWZmZXIiLCJGbG9hdDMyQXJyYXkiLCJhdHRyaWJ1dGUiLCJhZGRBdHRyaWJ1dGUiLCJkYXRhIiwic2V0UHJlZmFiRGF0YSIsInByZWZhYkluZGV4IiwiYXR0cmlidXRlcyIsIlV0aWxzIiwiZ2VvbWV0cnkiLCJpbCIsIm4iLCJ2YSIsInZiIiwidmMiLCJjbG9uZSIsInYiLCJUSFJFRSIsIlZlY3RvcjMiLCJib3giLCJ0TWF0aCIsInJhbmRGbG9hdCIsIm1pbiIsIm1heCIsInJhbmRGbG9hdFNwcmVhZCIsIm5vcm1hbGl6ZSIsInNvdXJjZU1hdGVyaWFsIiwiTW9kZWxCdWZmZXJHZW9tZXRyeSIsIm1vZGVsIiwib3B0aW9ucyIsIm1vZGVsR2VvbWV0cnkiLCJmYWNlQ291bnQiLCJ2ZXJ0ZXhDb3VudCIsImNvbXB1dGVDZW50cm9pZHMiLCJsb2NhbGl6ZUZhY2VzIiwiY2VudHJvaWRzIiwiY29tcHV0ZUNlbnRyb2lkIiwiY2VudHJvaWQiLCJCQVMiLCJ2ZXJ0ZXgiLCJidWZmZXJVVnMiLCJzZXRGYWNlRGF0YSIsImZhY2VJbmRleCIsIlBvaW50QnVmZmVyR2VvbWV0cnkiLCJwb2ludENvdW50Iiwic2V0UG9pbnREYXRhIiwicG9pbnRJbmRleCIsIlNoYWRlckNodW5rIiwiY2F0bXVsbF9yb21fc3BsaW5lIiwiY3ViaWNfYmV6aWVyIiwiZWFzZV9iYWNrX2luIiwiZWFzZV9iYWNrX2luX291dCIsImVhc2VfYmFja19vdXQiLCJlYXNlX2JlemllciIsImVhc2VfYm91bmNlX2luIiwiZWFzZV9ib3VuY2VfaW5fb3V0IiwiZWFzZV9ib3VuY2Vfb3V0IiwiZWFzZV9jaXJjX2luIiwiZWFzZV9jaXJjX2luX291dCIsImVhc2VfY2lyY19vdXQiLCJlYXNlX2N1YmljX2luIiwiZWFzZV9jdWJpY19pbl9vdXQiLCJlYXNlX2N1YmljX291dCIsImVhc2VfZWxhc3RpY19pbiIsImVhc2VfZWxhc3RpY19pbl9vdXQiLCJlYXNlX2VsYXN0aWNfb3V0IiwiZWFzZV9leHBvX2luIiwiZWFzZV9leHBvX2luX291dCIsImVhc2VfZXhwb19vdXQiLCJlYXNlX3F1YWRfaW4iLCJlYXNlX3F1YWRfaW5fb3V0IiwiZWFzZV9xdWFkX291dCIsImVhc2VfcXVhcnRfaW4iLCJlYXNlX3F1YXJ0X2luX291dCIsImVhc2VfcXVhcnRfb3V0IiwiZWFzZV9xdWludF9pbiIsImVhc2VfcXVpbnRfaW5fb3V0IiwiZWFzZV9xdWludF9vdXQiLCJlYXNlX3NpbmVfaW4iLCJlYXNlX3NpbmVfaW5fb3V0IiwiZWFzZV9zaW5lX291dCIsInF1YXRlcm5pb25fcm90YXRpb24iLCJxdWF0ZXJuaW9uX3NsZXJwIiwiVGltZWxpbmVTZWdtZW50Iiwic3RhcnQiLCJkdXJhdGlvbiIsInRyYW5zaXRpb24iLCJjb21waWxlciIsInRyYWlsIiwiY29tcGlsZSIsImRlZmluZVByb3BlcnR5IiwiVGltZWxpbmUiLCJ0aW1lS2V5Iiwic2VnbWVudHMiLCJfX2tleSIsInNlZ21lbnREZWZpbml0aW9ucyIsInJlZ2lzdGVyIiwiZGVmaW5pdGlvbiIsImFkZCIsInRyYW5zaXRpb25zIiwicG9zaXRpb25PZmZzZXQiLCJfZXZhbCIsImV2YWwiLCJ1bmRlZmluZWQiLCJNYXRoIiwicHJvY2Vzc1RyYW5zaXRpb24iLCJmcm9tIiwiZGVmYXVsdEZyb20iLCJ0byIsInRvU3RyaW5nIiwiZmlsbEdhcHMiLCJzIiwiczAiLCJzMSIsImVuZCIsImdldFRyYW5zZm9ybUNhbGxzIiwidCIsIlRpbWVsaW5lQ2h1bmtzIiwicCIsInRvUHJlY2lzaW9uIiwidyIsInNlZ21lbnQiLCJlYXNlIiwiZWFzZVBhcmFtcyIsInN0YXJ0VGltZSIsImVuZFRpbWUiLCJUcmFuc2xhdGlvblNlZ21lbnQiLCJkZWxheUR1cmF0aW9uIiwidmVjMyIsInJlbmRlckNoZWNrIiwicHJvZ3Jlc3MiLCJTY2FsZVNlZ21lbnQiLCJvcmlnaW4iLCJSb3RhdGlvblNlZ21lbnQiLCJmcm9tQXhpc0FuZ2xlIiwiVmVjdG9yNCIsImF4aXMiLCJhbmdsZSIsInRvQXhpcyIsInRvQXhpc0FuZ2xlIiwidmVjNCJdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBZUEsU0FBU0EscUJBQVQsQ0FBK0JDLFVBQS9CLEVBQTJDQyxRQUEzQyxFQUFxRDt1QkFDcENDLElBQWYsQ0FBb0IsSUFBcEI7O01BRU1DLGdCQUFnQkgsV0FBV0csYUFBakM7U0FDT0gsV0FBV0csYUFBbEI7O09BRUtDLFNBQUwsQ0FBZUosVUFBZjs7T0FFS0MsUUFBTCxHQUFnQkksb0JBQWNDLEtBQWQsQ0FBb0IsQ0FBQ0wsUUFBRCxFQUFXLEtBQUtBLFFBQWhCLENBQXBCLENBQWhCOztPQUVLTSxnQkFBTCxDQUFzQkosYUFBdEI7O01BRUlBLGFBQUosRUFBbUI7a0JBQ0hLLEdBQWQsS0FBc0IsS0FBS0MsT0FBTCxDQUFhLFNBQWIsSUFBMEIsRUFBaEQ7a0JBQ2NDLFNBQWQsS0FBNEIsS0FB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
