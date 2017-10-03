import { AddOperation, BufferAttribute, BufferGeometry, CubeReflectionMapping, CubeRefractionMapping, CubeUVReflectionMapping, CubeUVRefractionMapping, EquirectangularReflectionMapping, EquirectangularRefractionMapping, Math as Math$1, MixOperation, MultiplyOperation, RGBADepthPacking, ShaderLib, ShaderMaterial, SphericalReflectionMapping, UniformsUtils, Vector3, Vector4 } from 'three';

function BaseAnimationMaterial(parameters, uniforms) {
  ShaderMaterial.call(this);

  var uniformValues = parameters.uniformValues;
  delete parameters.uniformValues;

  this.setValues(parameters);

  this.uniforms = UniformsUtils.merge([uniforms, this.uniforms]);

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
        case CubeReflectionMapping:
        case CubeRefractionMapping:
          envMapTypeDefine = 'ENVMAP_TYPE_CUBE';
          break;
        case CubeUVReflectionMapping:
        case CubeUVRefractionMapping:
          envMapTypeDefine = 'ENVMAP_TYPE_CUBE_UV';
          break;
        case EquirectangularReflectionMapping:
        case EquirectangularRefractionMapping:
          envMapTypeDefine = 'ENVMAP_TYPE_EQUIREC';
          break;
        case SphericalReflectionMapping:
          envMapTypeDefine = 'ENVMAP_TYPE_SPHERE';
          break;
      }

      switch (uniformValues.envMap.mapping) {
        case CubeRefractionMapping:
        case EquirectangularRefractionMapping:
          envMapModeDefine = 'ENVMAP_MODE_REFRACTION';
          break;
      }

      switch (uniformValues.combine) {
        case MixOperation:
          envMapBlendingDefine = 'ENVMAP_BLENDING_MIX';
          break;
        case AddOperation:
          envMapBlendingDefine = 'ENVMAP_BLENDING_ADD';
          break;
        case MultiplyOperation:
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

BaseAnimationMaterial.prototype = Object.assign(Object.create(ShaderMaterial.prototype), {
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

  BaseAnimationMaterial.call(this, parameters, ShaderLib['basic'].uniforms);

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

  BaseAnimationMaterial.call(this, parameters, ShaderLib['lambert'].uniforms);

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

  BaseAnimationMaterial.call(this, parameters, ShaderLib['phong'].uniforms);

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

  BaseAnimationMaterial.call(this, parameters, ShaderLib['standard'].uniforms);

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

  BaseAnimationMaterial.call(this, parameters, ShaderLib['points'].uniforms);

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
  this.depthPacking = RGBADepthPacking;
  this.clipping = true;

  this.vertexFunctions = [];
  this.vertexParameters = [];
  this.vertexInit = [];
  this.vertexPosition = [];

  BaseAnimationMaterial.call(this, parameters);

  this.uniforms = UniformsUtils.merge([ShaderLib['depth'].uniforms, this.uniforms]);
  this.vertexShader = this.concatVertexShader();
  this.fragmentShader = ShaderLib['depth'].fragmentShader;
}
DepthAnimationMaterial.prototype = Object.create(BaseAnimationMaterial.prototype);
DepthAnimationMaterial.prototype.constructor = DepthAnimationMaterial;

DepthAnimationMaterial.prototype.concatVertexShader = function () {

  return '\n  #include <common>\n  #include <uv_pars_vertex>\n  #include <displacementmap_pars_vertex>\n  #include <morphtarget_pars_vertex>\n  #include <skinning_pars_vertex>\n  #include <logdepthbuf_pars_vertex>\n  #include <clipping_planes_pars_vertex>\n  \n  ' + this.stringifyChunk('vertexParameters') + '\n  ' + this.stringifyChunk('vertexFunctions') + '\n  \n  void main() {\n  \n    ' + this.stringifyChunk('vertexInit') + '\n  \n    #include <uv_vertex>\n  \n    #include <skinbase_vertex>\n  \n    #ifdef USE_DISPLACEMENTMAP\n  \n      #include <beginnormal_vertex>\n      #include <morphnormal_vertex>\n      #include <skinnormal_vertex>\n  \n    #endif\n  \n    #include <begin_vertex>\n    \n    ' + this.stringifyChunk('vertexPosition') + '\n\n    #include <morphtarget_vertex>\n    #include <skinning_vertex>\n    #include <displacementmap_vertex>\n    #include <project_vertex>\n    #include <logdepthbuf_vertex>\n    #include <clipping_planes_vertex>\n  }';
};

function DistanceAnimationMaterial(parameters) {
  this.depthPacking = RGBADepthPacking;
  this.clipping = true;

  this.vertexFunctions = [];
  this.vertexParameters = [];
  this.vertexInit = [];
  this.vertexPosition = [];

  BaseAnimationMaterial.call(this, parameters);

  this.uniforms = UniformsUtils.merge([ShaderLib['distanceRGBA'].uniforms, this.uniforms]);
  this.vertexShader = this.concatVertexShader();
  this.fragmentShader = ShaderLib['distanceRGBA'].fragmentShader;
}
DistanceAnimationMaterial.prototype = Object.create(BaseAnimationMaterial.prototype);
DistanceAnimationMaterial.prototype.constructor = DistanceAnimationMaterial;

DistanceAnimationMaterial.prototype.concatVertexShader = function () {
  return '\n  #define DISTANCE\n\n  varying vec3 vWorldPosition;\n  \n  #include <common>\n  #include <uv_pars_vertex>\n  #include <displacementmap_pars_vertex>\n  #include <morphtarget_pars_vertex>\n  #include <skinning_pars_vertex>\n  #include <clipping_planes_pars_vertex>\n  \n  ' + this.stringifyChunk('vertexParameters') + '\n  ' + this.stringifyChunk('vertexFunctions') + '\n  \n  void main() {\n\n    ' + this.stringifyChunk('vertexInit') + '\n  \n    #include <uv_vertex>\n  \n    #include <skinbase_vertex>\n  \n    #ifdef USE_DISPLACEMENTMAP\n  \n      #include <beginnormal_vertex>\n      #include <morphnormal_vertex>\n      #include <skinnormal_vertex>\n  \n    #endif\n  \n    #include <begin_vertex>\n    \n    ' + this.stringifyChunk('vertexPosition') + '\n\n    #include <morphtarget_vertex>\n    #include <skinning_vertex>\n    #include <displacementmap_vertex>\n    #include <project_vertex>\n    #include <worldpos_vertex>\n    #include <clipping_planes_vertex>\n  \n    vWorldPosition = worldPosition.xyz;\n  \n  }';
};

function PrefabBufferGeometry(prefab, count) {
  BufferGeometry.call(this);

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
PrefabBufferGeometry.prototype = Object.create(BufferGeometry.prototype);
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

  this.setIndex(new BufferAttribute(indexBuffer, 1));

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
  var attribute = new BufferAttribute(buffer, itemSize);

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
    v = v || new Vector3();

    v.x = Math$1.randFloat(box.min.x, box.max.x);
    v.y = Math$1.randFloat(box.min.y, box.max.y);
    v.z = Math$1.randFloat(box.min.z, box.max.z);

    return v;
  },

  /**
   * Get a random axis for quaternion rotation.
   *
   * @param {THREE.Vector3=} v Option vector to store result in.
   * @returns {THREE.Vector3}
   */
  randomAxis: function randomAxis(v) {
    v = v || new Vector3();

    v.x = Math$1.randFloatSpread(2.0);
    v.y = Math$1.randFloatSpread(2.0);
    v.z = Math$1.randFloatSpread(2.0);
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
  BufferGeometry.call(this);

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
ModelBufferGeometry.prototype = Object.create(BufferGeometry.prototype);
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

  this.setIndex(new BufferAttribute(indexBuffer, 1));

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
  BufferGeometry.call(this);

  /**
   * Number of points.
   * @type {Number}
   */
  this.pointCount = count;

  this.bufferPositions();
}
PointBufferGeometry.prototype = Object.create(BufferGeometry.prototype);
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
  var attribute = new BufferAttribute(buffer, itemSize);

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
  defaultFrom: new Vector3(0, 0, 0)
};

Timeline.register('translate', TranslationSegment);

var ScaleSegment = {
  compiler: function compiler(segment) {
    var origin = segment.transition.origin;

    return '\n    ' + TimelineChunks.delayDuration(segment) + '\n    ' + TimelineChunks.vec3('cScaleFrom' + segment.key, segment.transition.from, 2) + '\n    ' + TimelineChunks.vec3('cScaleTo' + segment.key, segment.transition.to, 2) + '\n    ' + (origin ? TimelineChunks.vec3('cOrigin' + segment.key, origin, 2) : '') + '\n    \n    void applyTransform' + segment.key + '(float time, inout vec3 v) {\n    \n      ' + TimelineChunks.renderCheck(segment) + '\n      ' + TimelineChunks.progress(segment) + '\n    \n      ' + (origin ? 'v -= cOrigin' + segment.key + ';' : '') + '\n      v *= mix(cScaleFrom' + segment.key + ', cScaleTo' + segment.key + ', progress);\n      ' + (origin ? 'v += cOrigin' + segment.key + ';' : '') + '\n    }\n    ';
  },
  defaultFrom: new Vector3(1, 1, 1)
};

Timeline.register('scale', ScaleSegment);

var RotationSegment = {
  compiler: function compiler(segment) {
    var fromAxisAngle = new Vector4(segment.transition.from.axis.x, segment.transition.from.axis.y, segment.transition.from.axis.z, segment.transition.from.angle);

    var toAxis = segment.transition.to.axis || segment.transition.from.axis;
    var toAxisAngle = new Vector4(toAxis.x, toAxis.y, toAxis.z, segment.transition.to.angle);

    var origin = segment.transition.origin;

    return '\n    ' + TimelineChunks.delayDuration(segment) + '\n    ' + TimelineChunks.vec4('cRotationFrom' + segment.key, fromAxisAngle, 8) + '\n    ' + TimelineChunks.vec4('cRotationTo' + segment.key, toAxisAngle, 8) + '\n    ' + (origin ? TimelineChunks.vec3('cOrigin' + segment.key, origin, 2) : '') + '\n    \n    void applyTransform' + segment.key + '(float time, inout vec3 v) {\n      ' + TimelineChunks.renderCheck(segment) + '\n      ' + TimelineChunks.progress(segment) + '\n\n      ' + (origin ? 'v -= cOrigin' + segment.key + ';' : '') + '\n      vec3 axis = normalize(mix(cRotationFrom' + segment.key + '.xyz, cRotationTo' + segment.key + '.xyz, progress));\n      float angle = mix(cRotationFrom' + segment.key + '.w, cRotationTo' + segment.key + '.w, progress);\n      vec4 q = quatFromAxisAngle(axis, angle);\n      v = rotateVector(q, v);\n      ' + (origin ? 'v += cOrigin' + segment.key + ';' : '') + '\n    }\n    ';
  },

  defaultFrom: { axis: new Vector3(), angle: 0 }
};

Timeline.register('rotate', RotationSegment);

export { BasicAnimationMaterial, LambertAnimationMaterial, PhongAnimationMaterial, StandardAnimationMaterial, PointsAnimationMaterial, DepthAnimationMaterial, DistanceAnimationMaterial, PrefabBufferGeometry, ModelBufferGeometry, PointBufferGeometry, ShaderChunk, Timeline, TimelineSegment, TimelineChunks, TranslationSegment, ScaleSegment, RotationSegment, Utils };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzLm1vZHVsZS5qcyIsInNvdXJjZXMiOlsiLi4vc3JjL21hdGVyaWFscy9CYXNlQW5pbWF0aW9uTWF0ZXJpYWwuanMiLCIuLi9zcmMvbWF0ZXJpYWxzL0Jhc2ljQW5pbWF0aW9uTWF0ZXJpYWwuanMiLCIuLi9zcmMvbWF0ZXJpYWxzL0xhbWJlcnRBbmltYXRpb25NYXRlcmlhbC5qcyIsIi4uL3NyYy9tYXRlcmlhbHMvUGhvbmdBbmltYXRpb25NYXRlcmlhbC5qcyIsIi4uL3NyYy9tYXRlcmlhbHMvU3RhbmRhcmRBbmltYXRpb25NYXRlcmlhbC5qcyIsIi4uL3NyYy9tYXRlcmlhbHMvUG9pbnRzQW5pbWF0aW9uTWF0ZXJpYWwuanMiLCIuLi9zcmMvbWF0ZXJpYWxzL0RlcHRoQW5pbWF0aW9uTWF0ZXJpYWwuanMiLCIuLi9zcmMvbWF0ZXJpYWxzL0Rpc3RhbmNlQW5pbWF0aW9uTWF0ZXJpYWwuanMiLCIuLi9zcmMvZ2VvbWV0cnkvUHJlZmFiQnVmZmVyR2VvbWV0cnkuanMiLCIuLi9zcmMvVXRpbHMuanMiLCIuLi9zcmMvZ2VvbWV0cnkvTW9kZWxCdWZmZXJHZW9tZXRyeS5qcyIsIi4uL3NyYy9nZW9tZXRyeS9Qb2ludEJ1ZmZlckdlb21ldHJ5LmpzIiwiLi4vc3JjL1NoYWRlckNodW5rLmpzIiwiLi4vc3JjL3RpbWVsaW5lL1RpbWVsaW5lU2VnbWVudC5qcyIsIi4uL3NyYy90aW1lbGluZS9UaW1lbGluZS5qcyIsIi4uL3NyYy90aW1lbGluZS9UaW1lbGluZUNodW5rcy5qcyIsIi4uL3NyYy90aW1lbGluZS9UcmFuc2xhdGlvblNlZ21lbnQuanMiLCIuLi9zcmMvdGltZWxpbmUvU2NhbGVTZWdtZW50LmpzIiwiLi4vc3JjL3RpbWVsaW5lL1JvdGF0aW9uU2VnbWVudC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xyXG4gIFNoYWRlck1hdGVyaWFsLFxyXG4gIFVuaWZvcm1zVXRpbHMsXHJcbiAgQ3ViZVJlZmxlY3Rpb25NYXBwaW5nLFxyXG4gIEN1YmVSZWZyYWN0aW9uTWFwcGluZyxcclxuICBDdWJlVVZSZWZsZWN0aW9uTWFwcGluZyxcclxuICBDdWJlVVZSZWZyYWN0aW9uTWFwcGluZyxcclxuICBFcXVpcmVjdGFuZ3VsYXJSZWZsZWN0aW9uTWFwcGluZyxcclxuICBFcXVpcmVjdGFuZ3VsYXJSZWZyYWN0aW9uTWFwcGluZyxcclxuICBTcGhlcmljYWxSZWZsZWN0aW9uTWFwcGluZyxcclxuICBNaXhPcGVyYXRpb24sXHJcbiAgQWRkT3BlcmF0aW9uLFxyXG4gIE11bHRpcGx5T3BlcmF0aW9uXHJcbn0gZnJvbSAndGhyZWUnO1xyXG5cclxuZnVuY3Rpb24gQmFzZUFuaW1hdGlvbk1hdGVyaWFsKHBhcmFtZXRlcnMsIHVuaWZvcm1zKSB7XHJcbiAgU2hhZGVyTWF0ZXJpYWwuY2FsbCh0aGlzKTtcclxuICBcclxuICBjb25zdCB1bmlmb3JtVmFsdWVzID0gcGFyYW1ldGVycy51bmlmb3JtVmFsdWVzO1xyXG4gIGRlbGV0ZSBwYXJhbWV0ZXJzLnVuaWZvcm1WYWx1ZXM7XHJcbiAgXHJcbiAgdGhpcy5zZXRWYWx1ZXMocGFyYW1ldGVycyk7XHJcbiAgXHJcbiAgdGhpcy51bmlmb3JtcyA9IFVuaWZvcm1zVXRpbHMubWVyZ2UoW3VuaWZvcm1zLCB0aGlzLnVuaWZvcm1zXSk7XHJcbiAgXHJcbiAgdGhpcy5zZXRVbmlmb3JtVmFsdWVzKHVuaWZvcm1WYWx1ZXMpO1xyXG4gIFxyXG4gIGlmICh1bmlmb3JtVmFsdWVzKSB7XHJcbiAgICB1bmlmb3JtVmFsdWVzLm1hcCAmJiAodGhpcy5kZWZpbmVzWydVU0VfTUFQJ10gPSAnJyk7XHJcbiAgICB1bmlmb3JtVmFsdWVzLm5vcm1hbE1hcCAmJiAodGhpcy5kZWZpbmVzWydVU0VfTk9STUFMTUFQJ10gPSAnJyk7XHJcbiAgICB1bmlmb3JtVmFsdWVzLmVudk1hcCAmJiAodGhpcy5kZWZpbmVzWydVU0VfRU5WTUFQJ10gPSAnJyk7XHJcbiAgICB1bmlmb3JtVmFsdWVzLmFvTWFwICYmICh0aGlzLmRlZmluZXNbJ1VTRV9BT01BUCddID0gJycpO1xyXG4gICAgdW5pZm9ybVZhbHVlcy5zcGVjdWxhck1hcCAmJiAodGhpcy5kZWZpbmVzWydVU0VfU1BFQ1VMQVJNQVAnXSA9ICcnKTtcclxuICAgIHVuaWZvcm1WYWx1ZXMuYWxwaGFNYXAgJiYgKHRoaXMuZGVmaW5lc1snVVNFX0FMUEhBTUFQJ10gPSAnJyk7XHJcbiAgICB1bmlmb3JtVmFsdWVzLmxpZ2h0TWFwICYmICh0aGlzLmRlZmluZXNbJ1VTRV9MSUdIVE1BUCddID0gJycpO1xyXG4gICAgdW5pZm9ybVZhbHVlcy5lbWlzc2l2ZU1hcCAmJiAodGhpcy5kZWZpbmVzWydVU0VfRU1JU1NJVkVNQVAnXSA9ICcnKTtcclxuICAgIHVuaWZvcm1WYWx1ZXMuYnVtcE1hcCAmJiAodGhpcy5kZWZpbmVzWydVU0VfQlVNUE1BUCddID0gJycpO1xyXG4gICAgdW5pZm9ybVZhbHVlcy5kaXNwbGFjZW1lbnRNYXAgJiYgKHRoaXMuZGVmaW5lc1snVVNFX0RJU1BMQUNFTUVOVE1BUCddID0gJycpO1xyXG4gICAgdW5pZm9ybVZhbHVlcy5yb3VnaG5lc3NNYXAgJiYgKHRoaXMuZGVmaW5lc1snVVNFX0RJU1BMQUNFTUVOVE1BUCddID0gJycpO1xyXG4gICAgdW5pZm9ybVZhbHVlcy5yb3VnaG5lc3NNYXAgJiYgKHRoaXMuZGVmaW5lc1snVVNFX1JPVUdITkVTU01BUCddID0gJycpO1xyXG4gICAgdW5pZm9ybVZhbHVlcy5tZXRhbG5lc3NNYXAgJiYgKHRoaXMuZGVmaW5lc1snVVNFX01FVEFMTkVTU01BUCddID0gJycpO1xyXG4gIFxyXG4gICAgaWYgKHVuaWZvcm1WYWx1ZXMuZW52TWFwKSB7XHJcbiAgICAgIHRoaXMuZGVmaW5lc1snVVNFX0VOVk1BUCddID0gJyc7XHJcbiAgICBcclxuICAgICAgbGV0IGVudk1hcFR5cGVEZWZpbmUgPSAnRU5WTUFQX1RZUEVfQ1VCRSc7XHJcbiAgICAgIGxldCBlbnZNYXBNb2RlRGVmaW5lID0gJ0VOVk1BUF9NT0RFX1JFRkxFQ1RJT04nO1xyXG4gICAgICBsZXQgZW52TWFwQmxlbmRpbmdEZWZpbmUgPSAnRU5WTUFQX0JMRU5ESU5HX01VTFRJUExZJztcclxuICAgIFxyXG4gICAgICBzd2l0Y2ggKHVuaWZvcm1WYWx1ZXMuZW52TWFwLm1hcHBpbmcpIHtcclxuICAgICAgICBjYXNlIEN1YmVSZWZsZWN0aW9uTWFwcGluZzpcclxuICAgICAgICBjYXNlIEN1YmVSZWZyYWN0aW9uTWFwcGluZzpcclxuICAgICAgICAgIGVudk1hcFR5cGVEZWZpbmUgPSAnRU5WTUFQX1RZUEVfQ1VCRSc7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIEN1YmVVVlJlZmxlY3Rpb25NYXBwaW5nOlxyXG4gICAgICAgIGNhc2UgQ3ViZVVWUmVmcmFjdGlvbk1hcHBpbmc6XHJcbiAgICAgICAgICBlbnZNYXBUeXBlRGVmaW5lID0gJ0VOVk1BUF9UWVBFX0NVQkVfVVYnO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSBFcXVpcmVjdGFuZ3VsYXJSZWZsZWN0aW9uTWFwcGluZzpcclxuICAgICAgICBjYXNlIEVxdWlyZWN0YW5ndWxhclJlZnJhY3Rpb25NYXBwaW5nOlxyXG4gICAgICAgICAgZW52TWFwVHlwZURlZmluZSA9ICdFTlZNQVBfVFlQRV9FUVVJUkVDJztcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgU3BoZXJpY2FsUmVmbGVjdGlvbk1hcHBpbmc6XHJcbiAgICAgICAgICBlbnZNYXBUeXBlRGVmaW5lID0gJ0VOVk1BUF9UWVBFX1NQSEVSRSc7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgfVxyXG4gICAgXHJcbiAgICAgIHN3aXRjaCAodW5pZm9ybVZhbHVlcy5lbnZNYXAubWFwcGluZykge1xyXG4gICAgICAgIGNhc2UgQ3ViZVJlZnJhY3Rpb25NYXBwaW5nOlxyXG4gICAgICAgIGNhc2UgRXF1aXJlY3Rhbmd1bGFyUmVmcmFjdGlvbk1hcHBpbmc6XHJcbiAgICAgICAgICBlbnZNYXBNb2RlRGVmaW5lID0gJ0VOVk1BUF9NT0RFX1JFRlJBQ1RJT04nO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgIH1cclxuICAgIFxyXG4gICAgICBzd2l0Y2ggKHVuaWZvcm1WYWx1ZXMuY29tYmluZSkge1xyXG4gICAgICAgIGNhc2UgTWl4T3BlcmF0aW9uOlxyXG4gICAgICAgICAgZW52TWFwQmxlbmRpbmdEZWZpbmUgPSAnRU5WTUFQX0JMRU5ESU5HX01JWCc7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIEFkZE9wZXJhdGlvbjpcclxuICAgICAgICAgIGVudk1hcEJsZW5kaW5nRGVmaW5lID0gJ0VOVk1BUF9CTEVORElOR19BREQnO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSBNdWx0aXBseU9wZXJhdGlvbjpcclxuICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgZW52TWFwQmxlbmRpbmdEZWZpbmUgPSAnRU5WTUFQX0JMRU5ESU5HX01VTFRJUExZJztcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICB9XHJcbiAgICBcclxuICAgICAgdGhpcy5kZWZpbmVzW2Vudk1hcFR5cGVEZWZpbmVdID0gJyc7XHJcbiAgICAgIHRoaXMuZGVmaW5lc1tlbnZNYXBCbGVuZGluZ0RlZmluZV0gPSAnJztcclxuICAgICAgdGhpcy5kZWZpbmVzW2Vudk1hcE1vZGVEZWZpbmVdID0gJyc7XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG5CYXNlQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlID0gT2JqZWN0LmFzc2lnbihPYmplY3QuY3JlYXRlKFNoYWRlck1hdGVyaWFsLnByb3RvdHlwZSksIHtcclxuICBjb25zdHJ1Y3RvcjogQmFzZUFuaW1hdGlvbk1hdGVyaWFsLFxyXG4gIFxyXG4gIHNldFVuaWZvcm1WYWx1ZXModmFsdWVzKSB7XHJcbiAgICBpZiAoIXZhbHVlcykgcmV0dXJuO1xyXG4gICAgXHJcbiAgICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXModmFsdWVzKTtcclxuICAgIFxyXG4gICAga2V5cy5mb3JFYWNoKChrZXkpID0+IHtcclxuICAgICAga2V5IGluIHRoaXMudW5pZm9ybXMgJiYgKHRoaXMudW5pZm9ybXNba2V5XS52YWx1ZSA9IHZhbHVlc1trZXldKTtcclxuICAgIH0pO1xyXG4gIH0sXHJcbiAgXHJcbiAgc3RyaW5naWZ5Q2h1bmsobmFtZSkge1xyXG4gICAgbGV0IHZhbHVlO1xyXG4gICAgXHJcbiAgICBpZiAoIXRoaXNbbmFtZV0pIHtcclxuICAgICAgdmFsdWUgPSAnJztcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKHR5cGVvZiB0aGlzW25hbWVdID09PSAgJ3N0cmluZycpIHtcclxuICAgICAgdmFsdWUgPSB0aGlzW25hbWVdO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIHZhbHVlID0gdGhpc1tuYW1lXS5qb2luKCdcXG4nKTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgcmV0dXJuIHZhbHVlO1xyXG4gIH1cclxufSk7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBCYXNlQW5pbWF0aW9uTWF0ZXJpYWw7XHJcbiIsImltcG9ydCB7IFNoYWRlckxpYiB9IGZyb20gJ3RocmVlJztcclxuaW1wb3J0IEJhc2VBbmltYXRpb25NYXRlcmlhbCBmcm9tICcuL0Jhc2VBbmltYXRpb25NYXRlcmlhbCc7XHJcblxyXG4vKipcclxuICogRXh0ZW5kcyBUSFJFRS5NZXNoQmFzaWNNYXRlcmlhbCB3aXRoIGN1c3RvbSBzaGFkZXIgY2h1bmtzLlxyXG4gKlxyXG4gKiBAc2VlIGh0dHA6Ly90aHJlZS1iYXMtZXhhbXBsZXMuc3VyZ2Uuc2gvZXhhbXBsZXMvbWF0ZXJpYWxzX2Jhc2ljL1xyXG4gKlxyXG4gKiBAcGFyYW0ge09iamVjdH0gcGFyYW1ldGVycyBPYmplY3QgY29udGFpbmluZyBtYXRlcmlhbCBwcm9wZXJ0aWVzIGFuZCBjdXN0b20gc2hhZGVyIGNodW5rcy5cclxuICogQGNvbnN0cnVjdG9yXHJcbiAqL1xyXG5mdW5jdGlvbiBCYXNpY0FuaW1hdGlvbk1hdGVyaWFsKHBhcmFtZXRlcnMpIHtcclxuICB0aGlzLnZhcnlpbmdQYXJhbWV0ZXJzID0gW107XHJcbiAgXHJcbiAgdGhpcy52ZXJ0ZXhQYXJhbWV0ZXJzID0gW107XHJcbiAgdGhpcy52ZXJ0ZXhGdW5jdGlvbnMgPSBbXTtcclxuICB0aGlzLnZlcnRleEluaXQgPSBbXTtcclxuICB0aGlzLnZlcnRleE5vcm1hbCA9IFtdO1xyXG4gIHRoaXMudmVydGV4UG9zaXRpb24gPSBbXTtcclxuICB0aGlzLnZlcnRleENvbG9yID0gW107XHJcbiAgXHJcbiAgdGhpcy5mcmFnbWVudEZ1bmN0aW9ucyA9IFtdO1xyXG4gIHRoaXMuZnJhZ21lbnRQYXJhbWV0ZXJzID0gW107XHJcbiAgdGhpcy5mcmFnbWVudEluaXQgPSBbXTtcclxuICB0aGlzLmZyYWdtZW50TWFwID0gW107XHJcbiAgdGhpcy5mcmFnbWVudERpZmZ1c2UgPSBbXTtcclxuICBcclxuICBCYXNlQW5pbWF0aW9uTWF0ZXJpYWwuY2FsbCh0aGlzLCBwYXJhbWV0ZXJzLCBTaGFkZXJMaWJbJ2Jhc2ljJ10udW5pZm9ybXMpO1xyXG4gIFxyXG4gIHRoaXMubGlnaHRzID0gZmFsc2U7XHJcbiAgdGhpcy52ZXJ0ZXhTaGFkZXIgPSB0aGlzLmNvbmNhdFZlcnRleFNoYWRlcigpO1xyXG4gIHRoaXMuZnJhZ21lbnRTaGFkZXIgPSB0aGlzLmNvbmNhdEZyYWdtZW50U2hhZGVyKCk7XHJcbn1cclxuQmFzaWNBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEJhc2VBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUpO1xyXG5CYXNpY0FuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IEJhc2ljQW5pbWF0aW9uTWF0ZXJpYWw7XHJcblxyXG5CYXNpY0FuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZS5jb25jYXRWZXJ0ZXhTaGFkZXIgPSBmdW5jdGlvbigpIHtcclxuICByZXR1cm4gYFxyXG4gICNpbmNsdWRlIDxjb21tb24+XHJcbiAgI2luY2x1ZGUgPHV2X3BhcnNfdmVydGV4PlxyXG4gICNpbmNsdWRlIDx1djJfcGFyc192ZXJ0ZXg+XHJcbiAgI2luY2x1ZGUgPGVudm1hcF9wYXJzX3ZlcnRleD5cclxuICAjaW5jbHVkZSA8Y29sb3JfcGFyc192ZXJ0ZXg+XHJcbiAgI2luY2x1ZGUgPGZvZ19wYXJzX3ZlcnRleD5cclxuICAjaW5jbHVkZSA8bW9ycGh0YXJnZXRfcGFyc192ZXJ0ZXg+XHJcbiAgI2luY2x1ZGUgPHNraW5uaW5nX3BhcnNfdmVydGV4PlxyXG4gICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl9wYXJzX3ZlcnRleD5cclxuICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX3BhcnNfdmVydGV4PlxyXG4gIFxyXG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UGFyYW1ldGVycycpfVxyXG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmFyeWluZ1BhcmFtZXRlcnMnKX1cclxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleEZ1bmN0aW9ucycpfVxyXG4gIFxyXG4gIHZvaWQgbWFpbigpIHtcclxuXHJcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleEluaXQnKX1cclxuICBcclxuICAgICNpbmNsdWRlIDx1dl92ZXJ0ZXg+XHJcbiAgICAjaW5jbHVkZSA8dXYyX3ZlcnRleD5cclxuICAgICNpbmNsdWRlIDxjb2xvcl92ZXJ0ZXg+XHJcbiAgICAjaW5jbHVkZSA8c2tpbmJhc2VfdmVydGV4PlxyXG4gIFxyXG4gICAgI2lmZGVmIFVTRV9FTlZNQVBcclxuICBcclxuICAgICNpbmNsdWRlIDxiZWdpbm5vcm1hbF92ZXJ0ZXg+XHJcbiAgICBcclxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4Tm9ybWFsJyl9XHJcbiAgICBcclxuICAgICNpbmNsdWRlIDxtb3JwaG5vcm1hbF92ZXJ0ZXg+XHJcbiAgICAjaW5jbHVkZSA8c2tpbm5vcm1hbF92ZXJ0ZXg+XHJcbiAgICAjaW5jbHVkZSA8ZGVmYXVsdG5vcm1hbF92ZXJ0ZXg+XHJcbiAgXHJcbiAgICAjZW5kaWZcclxuICBcclxuICAgICNpbmNsdWRlIDxiZWdpbl92ZXJ0ZXg+XHJcbiAgICBcclxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UG9zaXRpb24nKX1cclxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4Q29sb3InKX1cclxuICAgIFxyXG4gICAgI2luY2x1ZGUgPG1vcnBodGFyZ2V0X3ZlcnRleD5cclxuICAgICNpbmNsdWRlIDxza2lubmluZ192ZXJ0ZXg+XHJcbiAgICAjaW5jbHVkZSA8cHJvamVjdF92ZXJ0ZXg+XHJcbiAgICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfdmVydGV4PlxyXG4gIFxyXG4gICAgI2luY2x1ZGUgPHdvcmxkcG9zX3ZlcnRleD5cclxuICAgICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfdmVydGV4PlxyXG4gICAgI2luY2x1ZGUgPGVudm1hcF92ZXJ0ZXg+XHJcbiAgICAjaW5jbHVkZSA8Zm9nX3ZlcnRleD5cclxuICB9YDtcclxufTtcclxuXHJcbkJhc2ljQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlLmNvbmNhdEZyYWdtZW50U2hhZGVyID0gZnVuY3Rpb24oKSB7XHJcbiAgcmV0dXJuIGBcclxuICB1bmlmb3JtIHZlYzMgZGlmZnVzZTtcclxuICB1bmlmb3JtIGZsb2F0IG9wYWNpdHk7XHJcbiAgXHJcbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudFBhcmFtZXRlcnMnKX1cclxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZhcnlpbmdQYXJhbWV0ZXJzJyl9XHJcbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudEZ1bmN0aW9ucycpfVxyXG4gIFxyXG4gICNpZm5kZWYgRkxBVF9TSEFERURcclxuICBcclxuICAgIHZhcnlpbmcgdmVjMyB2Tm9ybWFsO1xyXG4gIFxyXG4gICNlbmRpZlxyXG4gIFxyXG4gICNpbmNsdWRlIDxjb21tb24+XHJcbiAgI2luY2x1ZGUgPGNvbG9yX3BhcnNfZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPHV2X3BhcnNfZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPHV2Ml9wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxtYXBfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8YWxwaGFtYXBfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8YW9tYXBfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8bGlnaHRtYXBfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8ZW52bWFwX3BhcnNfZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPGZvZ19wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxzcGVjdWxhcm1hcF9wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl9wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfcGFyc19mcmFnbWVudD5cclxuICBcclxuICB2b2lkIG1haW4oKSB7XHJcbiAgXHJcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50SW5pdCcpfVxyXG4gIFxyXG4gICAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc19mcmFnbWVudD5cclxuXHJcbiAgICB2ZWM0IGRpZmZ1c2VDb2xvciA9IHZlYzQoIGRpZmZ1c2UsIG9wYWNpdHkgKTtcclxuXHJcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50RGlmZnVzZScpfVxyXG4gIFxyXG4gICAgI2luY2x1ZGUgPGxvZ2RlcHRoYnVmX2ZyYWdtZW50PlxyXG4gICAgXHJcbiAgICAkeyh0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudE1hcCcpIHx8ICcjaW5jbHVkZSA8bWFwX2ZyYWdtZW50PicpfVxyXG4gICAgXHJcbiAgICAjaW5jbHVkZSA8Y29sb3JfZnJhZ21lbnQ+XHJcbiAgICAjaW5jbHVkZSA8YWxwaGFtYXBfZnJhZ21lbnQ+XHJcbiAgICAjaW5jbHVkZSA8YWxwaGF0ZXN0X2ZyYWdtZW50PlxyXG4gICAgI2luY2x1ZGUgPHNwZWN1bGFybWFwX2ZyYWdtZW50PlxyXG4gIFxyXG4gICAgUmVmbGVjdGVkTGlnaHQgcmVmbGVjdGVkTGlnaHQgPSBSZWZsZWN0ZWRMaWdodCggdmVjMyggMC4wICksIHZlYzMoIDAuMCApLCB2ZWMzKCAwLjAgKSwgdmVjMyggMC4wICkgKTtcclxuICBcclxuICAgIC8vIGFjY3VtdWxhdGlvbiAoYmFrZWQgaW5kaXJlY3QgbGlnaHRpbmcgb25seSlcclxuICAgICNpZmRlZiBVU0VfTElHSFRNQVBcclxuICBcclxuICAgICAgcmVmbGVjdGVkTGlnaHQuaW5kaXJlY3REaWZmdXNlICs9IHRleHR1cmUyRCggbGlnaHRNYXAsIHZVdjIgKS54eXogKiBsaWdodE1hcEludGVuc2l0eTtcclxuICBcclxuICAgICNlbHNlXHJcbiAgXHJcbiAgICAgIHJlZmxlY3RlZExpZ2h0LmluZGlyZWN0RGlmZnVzZSArPSB2ZWMzKCAxLjAgKTtcclxuICBcclxuICAgICNlbmRpZlxyXG4gIFxyXG4gICAgLy8gbW9kdWxhdGlvblxyXG4gICAgI2luY2x1ZGUgPGFvbWFwX2ZyYWdtZW50PlxyXG4gIFxyXG4gICAgcmVmbGVjdGVkTGlnaHQuaW5kaXJlY3REaWZmdXNlICo9IGRpZmZ1c2VDb2xvci5yZ2I7XHJcbiAgXHJcbiAgICB2ZWMzIG91dGdvaW5nTGlnaHQgPSByZWZsZWN0ZWRMaWdodC5pbmRpcmVjdERpZmZ1c2U7XHJcbiAgXHJcbiAgICAjaW5jbHVkZSA8ZW52bWFwX2ZyYWdtZW50PlxyXG4gIFxyXG4gICAgZ2xfRnJhZ0NvbG9yID0gdmVjNCggb3V0Z29pbmdMaWdodCwgZGlmZnVzZUNvbG9yLmEgKTtcclxuICBcclxuICAgICNpbmNsdWRlIDxwcmVtdWx0aXBsaWVkX2FscGhhX2ZyYWdtZW50PlxyXG4gICAgI2luY2x1ZGUgPHRvbmVtYXBwaW5nX2ZyYWdtZW50PlxyXG4gICAgI2luY2x1ZGUgPGVuY29kaW5nc19mcmFnbWVudD5cclxuICAgICNpbmNsdWRlIDxmb2dfZnJhZ21lbnQ+XHJcbiAgfWA7XHJcbn07XHJcblxyXG5leHBvcnQgeyBCYXNpY0FuaW1hdGlvbk1hdGVyaWFsIH07XHJcbiIsImltcG9ydCB7IFNoYWRlckxpYiB9IGZyb20gJ3RocmVlJztcclxuaW1wb3J0IEJhc2VBbmltYXRpb25NYXRlcmlhbCBmcm9tICcuL0Jhc2VBbmltYXRpb25NYXRlcmlhbCc7XHJcblxyXG4vKipcclxuICogRXh0ZW5kcyBUSFJFRS5NZXNoTGFtYmVydE1hdGVyaWFsIHdpdGggY3VzdG9tIHNoYWRlciBjaHVua3MuXHJcbiAqXHJcbiAqIEBzZWUgaHR0cDovL3RocmVlLWJhcy1leGFtcGxlcy5zdXJnZS5zaC9leGFtcGxlcy9tYXRlcmlhbHNfbGFtYmVydC9cclxuICpcclxuICogQHBhcmFtIHtPYmplY3R9IHBhcmFtZXRlcnMgT2JqZWN0IGNvbnRhaW5pbmcgbWF0ZXJpYWwgcHJvcGVydGllcyBhbmQgY3VzdG9tIHNoYWRlciBjaHVua3MuXHJcbiAqIEBjb25zdHJ1Y3RvclxyXG4gKi9cclxuZnVuY3Rpb24gTGFtYmVydEFuaW1hdGlvbk1hdGVyaWFsKHBhcmFtZXRlcnMpIHtcclxuICB0aGlzLnZhcnlpbmdQYXJhbWV0ZXJzID0gW107XHJcbiAgXHJcbiAgdGhpcy52ZXJ0ZXhGdW5jdGlvbnMgPSBbXTtcclxuICB0aGlzLnZlcnRleFBhcmFtZXRlcnMgPSBbXTtcclxuICB0aGlzLnZlcnRleEluaXQgPSBbXTtcclxuICB0aGlzLnZlcnRleE5vcm1hbCA9IFtdO1xyXG4gIHRoaXMudmVydGV4UG9zaXRpb24gPSBbXTtcclxuICB0aGlzLnZlcnRleENvbG9yID0gW107XHJcbiAgXHJcbiAgdGhpcy5mcmFnbWVudEZ1bmN0aW9ucyA9IFtdO1xyXG4gIHRoaXMuZnJhZ21lbnRQYXJhbWV0ZXJzID0gW107XHJcbiAgdGhpcy5mcmFnbWVudEluaXQgPSBbXTtcclxuICB0aGlzLmZyYWdtZW50TWFwID0gW107XHJcbiAgdGhpcy5mcmFnbWVudERpZmZ1c2UgPSBbXTtcclxuICB0aGlzLmZyYWdtZW50RW1pc3NpdmUgPSBbXTtcclxuICB0aGlzLmZyYWdtZW50U3BlY3VsYXIgPSBbXTtcclxuICBcclxuICBCYXNlQW5pbWF0aW9uTWF0ZXJpYWwuY2FsbCh0aGlzLCBwYXJhbWV0ZXJzLCBTaGFkZXJMaWJbJ2xhbWJlcnQnXS51bmlmb3Jtcyk7XHJcbiAgXHJcbiAgdGhpcy5saWdodHMgPSB0cnVlO1xyXG4gIHRoaXMudmVydGV4U2hhZGVyID0gdGhpcy5jb25jYXRWZXJ0ZXhTaGFkZXIoKTtcclxuICB0aGlzLmZyYWdtZW50U2hhZGVyID0gdGhpcy5jb25jYXRGcmFnbWVudFNoYWRlcigpO1xyXG59XHJcbkxhbWJlcnRBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEJhc2VBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUpO1xyXG5MYW1iZXJ0QW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gTGFtYmVydEFuaW1hdGlvbk1hdGVyaWFsO1xyXG5cclxuTGFtYmVydEFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZS5jb25jYXRWZXJ0ZXhTaGFkZXIgPSBmdW5jdGlvbiAoKSB7XHJcbiAgcmV0dXJuIGBcclxuICAjZGVmaW5lIExBTUJFUlRcclxuXHJcbiAgdmFyeWluZyB2ZWMzIHZMaWdodEZyb250O1xyXG4gIFxyXG4gICNpZmRlZiBET1VCTEVfU0lERURcclxuICBcclxuICAgIHZhcnlpbmcgdmVjMyB2TGlnaHRCYWNrO1xyXG4gIFxyXG4gICNlbmRpZlxyXG4gIFxyXG4gICNpbmNsdWRlIDxjb21tb24+XHJcbiAgI2luY2x1ZGUgPHV2X3BhcnNfdmVydGV4PlxyXG4gICNpbmNsdWRlIDx1djJfcGFyc192ZXJ0ZXg+XHJcbiAgI2luY2x1ZGUgPGVudm1hcF9wYXJzX3ZlcnRleD5cclxuICAjaW5jbHVkZSA8YnNkZnM+XHJcbiAgI2luY2x1ZGUgPGxpZ2h0c19wYXJzPlxyXG4gICNpbmNsdWRlIDxjb2xvcl9wYXJzX3ZlcnRleD5cclxuICAjaW5jbHVkZSA8Zm9nX3BhcnNfdmVydGV4PlxyXG4gICNpbmNsdWRlIDxtb3JwaHRhcmdldF9wYXJzX3ZlcnRleD5cclxuICAjaW5jbHVkZSA8c2tpbm5pbmdfcGFyc192ZXJ0ZXg+XHJcbiAgI2luY2x1ZGUgPHNoYWRvd21hcF9wYXJzX3ZlcnRleD5cclxuICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfcGFyc192ZXJ0ZXg+XHJcbiAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc19wYXJzX3ZlcnRleD5cclxuICBcclxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBhcmFtZXRlcnMnKX1cclxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZhcnlpbmdQYXJhbWV0ZXJzJyl9XHJcbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhGdW5jdGlvbnMnKX1cclxuICBcclxuICB2b2lkIG1haW4oKSB7XHJcbiAgXHJcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleEluaXQnKX1cclxuICBcclxuICAgICNpbmNsdWRlIDx1dl92ZXJ0ZXg+XHJcbiAgICAjaW5jbHVkZSA8dXYyX3ZlcnRleD5cclxuICAgICNpbmNsdWRlIDxjb2xvcl92ZXJ0ZXg+XHJcbiAgXHJcbiAgICAjaW5jbHVkZSA8YmVnaW5ub3JtYWxfdmVydGV4PlxyXG4gICAgXHJcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleE5vcm1hbCcpfVxyXG4gICAgXHJcbiAgICAjaW5jbHVkZSA8bW9ycGhub3JtYWxfdmVydGV4PlxyXG4gICAgI2luY2x1ZGUgPHNraW5iYXNlX3ZlcnRleD5cclxuICAgICNpbmNsdWRlIDxza2lubm9ybWFsX3ZlcnRleD5cclxuICAgICNpbmNsdWRlIDxkZWZhdWx0bm9ybWFsX3ZlcnRleD5cclxuICBcclxuICAgICNpbmNsdWRlIDxiZWdpbl92ZXJ0ZXg+XHJcbiAgICBcclxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UG9zaXRpb24nKX1cclxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4Q29sb3InKX1cclxuICAgIFxyXG4gICAgI2luY2x1ZGUgPG1vcnBodGFyZ2V0X3ZlcnRleD5cclxuICAgICNpbmNsdWRlIDxza2lubmluZ192ZXJ0ZXg+XHJcbiAgICAjaW5jbHVkZSA8cHJvamVjdF92ZXJ0ZXg+XHJcbiAgICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfdmVydGV4PlxyXG4gICAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc192ZXJ0ZXg+XHJcbiAgXHJcbiAgICAjaW5jbHVkZSA8d29ybGRwb3NfdmVydGV4PlxyXG4gICAgI2luY2x1ZGUgPGVudm1hcF92ZXJ0ZXg+XHJcbiAgICAjaW5jbHVkZSA8bGlnaHRzX2xhbWJlcnRfdmVydGV4PlxyXG4gICAgI2luY2x1ZGUgPHNoYWRvd21hcF92ZXJ0ZXg+XHJcbiAgICAjaW5jbHVkZSA8Zm9nX3ZlcnRleD5cclxuICB9YDtcclxufTtcclxuXHJcbkxhbWJlcnRBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uY2F0RnJhZ21lbnRTaGFkZXIgPSBmdW5jdGlvbiAoKSB7XHJcbiAgcmV0dXJuIGBcclxuICB1bmlmb3JtIHZlYzMgZGlmZnVzZTtcclxuICB1bmlmb3JtIHZlYzMgZW1pc3NpdmU7XHJcbiAgdW5pZm9ybSBmbG9hdCBvcGFjaXR5O1xyXG4gIFxyXG4gIHZhcnlpbmcgdmVjMyB2TGlnaHRGcm9udDtcclxuICBcclxuICAjaWZkZWYgRE9VQkxFX1NJREVEXHJcbiAgXHJcbiAgICB2YXJ5aW5nIHZlYzMgdkxpZ2h0QmFjaztcclxuICBcclxuICAjZW5kaWZcclxuICBcclxuICAjaW5jbHVkZSA8Y29tbW9uPlxyXG4gICNpbmNsdWRlIDxwYWNraW5nPlxyXG4gICNpbmNsdWRlIDxkaXRoZXJpbmdfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8Y29sb3JfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8dXZfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8dXYyX3BhcnNfZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPG1hcF9wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxhbHBoYW1hcF9wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxhb21hcF9wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxsaWdodG1hcF9wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxlbWlzc2l2ZW1hcF9wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxlbnZtYXBfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8YnNkZnM+XHJcbiAgI2luY2x1ZGUgPGxpZ2h0c19wYXJzPlxyXG4gICNpbmNsdWRlIDxmb2dfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8c2hhZG93bWFwX3BhcnNfZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPHNoYWRvd21hc2tfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8c3BlY3VsYXJtYXBfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX3BhcnNfZnJhZ21lbnQ+XHJcbiAgXHJcbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudFBhcmFtZXRlcnMnKX1cclxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZhcnlpbmdQYXJhbWV0ZXJzJyl9XHJcbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudEZ1bmN0aW9ucycpfVxyXG4gIFxyXG4gIHZvaWQgbWFpbigpIHtcclxuICBcclxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRJbml0Jyl9XHJcbiAgXHJcbiAgICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX2ZyYWdtZW50PlxyXG5cclxuICAgIHZlYzQgZGlmZnVzZUNvbG9yID0gdmVjNCggZGlmZnVzZSwgb3BhY2l0eSApO1xyXG4gICAgUmVmbGVjdGVkTGlnaHQgcmVmbGVjdGVkTGlnaHQgPSBSZWZsZWN0ZWRMaWdodCggdmVjMyggMC4wICksIHZlYzMoIDAuMCApLCB2ZWMzKCAwLjAgKSwgdmVjMyggMC4wICkgKTtcclxuICAgIHZlYzMgdG90YWxFbWlzc2l2ZVJhZGlhbmNlID0gZW1pc3NpdmU7XHJcblx0XHJcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50RGlmZnVzZScpfVxyXG4gIFxyXG4gICAgI2luY2x1ZGUgPGxvZ2RlcHRoYnVmX2ZyYWdtZW50PlxyXG5cclxuICAgICR7KHRoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50TWFwJykgfHwgJyNpbmNsdWRlIDxtYXBfZnJhZ21lbnQ+Jyl9XHJcblxyXG4gICAgI2luY2x1ZGUgPGNvbG9yX2ZyYWdtZW50PlxyXG4gICAgI2luY2x1ZGUgPGFscGhhbWFwX2ZyYWdtZW50PlxyXG4gICAgI2luY2x1ZGUgPGFscGhhdGVzdF9mcmFnbWVudD5cclxuICAgICNpbmNsdWRlIDxzcGVjdWxhcm1hcF9mcmFnbWVudD5cclxuXHJcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50RW1pc3NpdmUnKX1cclxuXHJcbiAgICAjaW5jbHVkZSA8ZW1pc3NpdmVtYXBfZnJhZ21lbnQ+XHJcbiAgXHJcbiAgICAvLyBhY2N1bXVsYXRpb25cclxuICAgIHJlZmxlY3RlZExpZ2h0LmluZGlyZWN0RGlmZnVzZSA9IGdldEFtYmllbnRMaWdodElycmFkaWFuY2UoIGFtYmllbnRMaWdodENvbG9yICk7XHJcbiAgXHJcbiAgICAjaW5jbHVkZSA8bGlnaHRtYXBfZnJhZ21lbnQ+XHJcbiAgXHJcbiAgICByZWZsZWN0ZWRMaWdodC5pbmRpcmVjdERpZmZ1c2UgKj0gQlJERl9EaWZmdXNlX0xhbWJlcnQoIGRpZmZ1c2VDb2xvci5yZ2IgKTtcclxuICBcclxuICAgICNpZmRlZiBET1VCTEVfU0lERURcclxuICBcclxuICAgICAgcmVmbGVjdGVkTGlnaHQuZGlyZWN0RGlmZnVzZSA9ICggZ2xfRnJvbnRGYWNpbmcgKSA/IHZMaWdodEZyb250IDogdkxpZ2h0QmFjaztcclxuICBcclxuICAgICNlbHNlXHJcbiAgXHJcbiAgICAgIHJlZmxlY3RlZExpZ2h0LmRpcmVjdERpZmZ1c2UgPSB2TGlnaHRGcm9udDtcclxuICBcclxuICAgICNlbmRpZlxyXG4gIFxyXG4gICAgcmVmbGVjdGVkTGlnaHQuZGlyZWN0RGlmZnVzZSAqPSBCUkRGX0RpZmZ1c2VfTGFtYmVydCggZGlmZnVzZUNvbG9yLnJnYiApICogZ2V0U2hhZG93TWFzaygpO1xyXG4gIFxyXG4gICAgLy8gbW9kdWxhdGlvblxyXG4gICAgI2luY2x1ZGUgPGFvbWFwX2ZyYWdtZW50PlxyXG4gIFxyXG4gICAgdmVjMyBvdXRnb2luZ0xpZ2h0ID0gcmVmbGVjdGVkTGlnaHQuZGlyZWN0RGlmZnVzZSArIHJlZmxlY3RlZExpZ2h0LmluZGlyZWN0RGlmZnVzZSArIHRvdGFsRW1pc3NpdmVSYWRpYW5jZTtcclxuICBcclxuICAgICNpbmNsdWRlIDxlbnZtYXBfZnJhZ21lbnQ+XHJcbiAgXHJcbiAgICBnbF9GcmFnQ29sb3IgPSB2ZWM0KCBvdXRnb2luZ0xpZ2h0LCBkaWZmdXNlQ29sb3IuYSApO1xyXG4gIFxyXG4gICAgI2luY2x1ZGUgPHRvbmVtYXBwaW5nX2ZyYWdtZW50PlxyXG4gICAgI2luY2x1ZGUgPGVuY29kaW5nc19mcmFnbWVudD5cclxuICAgICNpbmNsdWRlIDxmb2dfZnJhZ21lbnQ+XHJcbiAgICAjaW5jbHVkZSA8cHJlbXVsdGlwbGllZF9hbHBoYV9mcmFnbWVudD5cclxuICAgICNpbmNsdWRlIDxkaXRoZXJpbmdfZnJhZ21lbnQ+XHJcbiAgfWA7XHJcbn07XHJcblxyXG5leHBvcnQgeyBMYW1iZXJ0QW5pbWF0aW9uTWF0ZXJpYWwgfTtcclxuIiwiaW1wb3J0IHsgU2hhZGVyTGliIH0gZnJvbSAndGhyZWUnO1xyXG5pbXBvcnQgQmFzZUFuaW1hdGlvbk1hdGVyaWFsIGZyb20gJy4vQmFzZUFuaW1hdGlvbk1hdGVyaWFsJztcclxuXHJcbi8qKlxyXG4gKiBFeHRlbmRzIFRIUkVFLk1lc2hQaG9uZ01hdGVyaWFsIHdpdGggY3VzdG9tIHNoYWRlciBjaHVua3MuXHJcbiAqXHJcbiAqIEBzZWUgaHR0cDovL3RocmVlLWJhcy1leGFtcGxlcy5zdXJnZS5zaC9leGFtcGxlcy9tYXRlcmlhbHNfcGhvbmcvXHJcbiAqXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBwYXJhbWV0ZXJzIE9iamVjdCBjb250YWluaW5nIG1hdGVyaWFsIHByb3BlcnRpZXMgYW5kIGN1c3RvbSBzaGFkZXIgY2h1bmtzLlxyXG4gKiBAY29uc3RydWN0b3JcclxuICovXHJcbmZ1bmN0aW9uIFBob25nQW5pbWF0aW9uTWF0ZXJpYWwocGFyYW1ldGVycykge1xyXG4gIHRoaXMudmFyeWluZ1BhcmFtZXRlcnMgPSBbXTtcclxuXHJcbiAgdGhpcy52ZXJ0ZXhGdW5jdGlvbnMgPSBbXTtcclxuICB0aGlzLnZlcnRleFBhcmFtZXRlcnMgPSBbXTtcclxuICB0aGlzLnZlcnRleEluaXQgPSBbXTtcclxuICB0aGlzLnZlcnRleE5vcm1hbCA9IFtdO1xyXG4gIHRoaXMudmVydGV4UG9zaXRpb24gPSBbXTtcclxuICB0aGlzLnZlcnRleENvbG9yID0gW107XHJcblxyXG4gIHRoaXMuZnJhZ21lbnRGdW5jdGlvbnMgPSBbXTtcclxuICB0aGlzLmZyYWdtZW50UGFyYW1ldGVycyA9IFtdO1xyXG4gIHRoaXMuZnJhZ21lbnRJbml0ID0gW107XHJcbiAgdGhpcy5mcmFnbWVudE1hcCA9IFtdO1xyXG4gIHRoaXMuZnJhZ21lbnREaWZmdXNlID0gW107XHJcbiAgdGhpcy5mcmFnbWVudEVtaXNzaXZlID0gW107XHJcbiAgdGhpcy5mcmFnbWVudFNwZWN1bGFyID0gW107XHJcblxyXG4gIEJhc2VBbmltYXRpb25NYXRlcmlhbC5jYWxsKHRoaXMsIHBhcmFtZXRlcnMsIFNoYWRlckxpYlsncGhvbmcnXS51bmlmb3Jtcyk7XHJcblxyXG4gIHRoaXMubGlnaHRzID0gdHJ1ZTtcclxuICB0aGlzLnZlcnRleFNoYWRlciA9IHRoaXMuY29uY2F0VmVydGV4U2hhZGVyKCk7XHJcbiAgdGhpcy5mcmFnbWVudFNoYWRlciA9IHRoaXMuY29uY2F0RnJhZ21lbnRTaGFkZXIoKTtcclxufVxyXG5QaG9uZ0FuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoQmFzZUFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZSk7XHJcblBob25nQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gUGhvbmdBbmltYXRpb25NYXRlcmlhbDtcclxuXHJcblBob25nQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlLmNvbmNhdFZlcnRleFNoYWRlciA9IGZ1bmN0aW9uICgpIHtcclxuICByZXR1cm4gYFxyXG4gICNkZWZpbmUgUEhPTkdcclxuXHJcbiAgdmFyeWluZyB2ZWMzIHZWaWV3UG9zaXRpb247XHJcbiAgXHJcbiAgI2lmbmRlZiBGTEFUX1NIQURFRFxyXG4gIFxyXG4gICAgdmFyeWluZyB2ZWMzIHZOb3JtYWw7XHJcbiAgXHJcbiAgI2VuZGlmXHJcbiAgXHJcbiAgI2luY2x1ZGUgPGNvbW1vbj5cclxuICAjaW5jbHVkZSA8dXZfcGFyc192ZXJ0ZXg+XHJcbiAgI2luY2x1ZGUgPHV2Ml9wYXJzX3ZlcnRleD5cclxuICAjaW5jbHVkZSA8ZGlzcGxhY2VtZW50bWFwX3BhcnNfdmVydGV4PlxyXG4gICNpbmNsdWRlIDxlbnZtYXBfcGFyc192ZXJ0ZXg+XHJcbiAgI2luY2x1ZGUgPGNvbG9yX3BhcnNfdmVydGV4PlxyXG4gICNpbmNsdWRlIDxmb2dfcGFyc192ZXJ0ZXg+XHJcbiAgI2luY2x1ZGUgPG1vcnBodGFyZ2V0X3BhcnNfdmVydGV4PlxyXG4gICNpbmNsdWRlIDxza2lubmluZ19wYXJzX3ZlcnRleD5cclxuICAjaW5jbHVkZSA8c2hhZG93bWFwX3BhcnNfdmVydGV4PlxyXG4gICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl9wYXJzX3ZlcnRleD5cclxuICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX3BhcnNfdmVydGV4PlxyXG4gIFxyXG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UGFyYW1ldGVycycpfVxyXG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmFyeWluZ1BhcmFtZXRlcnMnKX1cclxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleEZ1bmN0aW9ucycpfVxyXG4gIFxyXG4gIHZvaWQgbWFpbigpIHtcclxuICBcclxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4SW5pdCcpfVxyXG4gIFxyXG4gICAgI2luY2x1ZGUgPHV2X3ZlcnRleD5cclxuICAgICNpbmNsdWRlIDx1djJfdmVydGV4PlxyXG4gICAgI2luY2x1ZGUgPGNvbG9yX3ZlcnRleD5cclxuICBcclxuICAgICNpbmNsdWRlIDxiZWdpbm5vcm1hbF92ZXJ0ZXg+XHJcbiAgICBcclxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4Tm9ybWFsJyl9XHJcbiAgICBcclxuICAgICNpbmNsdWRlIDxtb3JwaG5vcm1hbF92ZXJ0ZXg+XHJcbiAgICAjaW5jbHVkZSA8c2tpbmJhc2VfdmVydGV4PlxyXG4gICAgI2luY2x1ZGUgPHNraW5ub3JtYWxfdmVydGV4PlxyXG4gICAgI2luY2x1ZGUgPGRlZmF1bHRub3JtYWxfdmVydGV4PlxyXG4gIFxyXG4gICNpZm5kZWYgRkxBVF9TSEFERUQgLy8gTm9ybWFsIGNvbXB1dGVkIHdpdGggZGVyaXZhdGl2ZXMgd2hlbiBGTEFUX1NIQURFRFxyXG4gIFxyXG4gICAgdk5vcm1hbCA9IG5vcm1hbGl6ZSggdHJhbnNmb3JtZWROb3JtYWwgKTtcclxuICBcclxuICAjZW5kaWZcclxuICBcclxuICAgICNpbmNsdWRlIDxiZWdpbl92ZXJ0ZXg+XHJcbiAgICBcclxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UG9zaXRpb24nKX1cclxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4Q29sb3InKX1cclxuICAgIFxyXG4gICAgI2luY2x1ZGUgPG1vcnBodGFyZ2V0X3ZlcnRleD5cclxuICAgICNpbmNsdWRlIDxza2lubmluZ192ZXJ0ZXg+XHJcbiAgICAjaW5jbHVkZSA8ZGlzcGxhY2VtZW50bWFwX3ZlcnRleD5cclxuICAgICNpbmNsdWRlIDxwcm9qZWN0X3ZlcnRleD5cclxuICAgICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl92ZXJ0ZXg+XHJcbiAgICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX3ZlcnRleD5cclxuICBcclxuICAgIHZWaWV3UG9zaXRpb24gPSAtIG12UG9zaXRpb24ueHl6O1xyXG4gIFxyXG4gICAgI2luY2x1ZGUgPHdvcmxkcG9zX3ZlcnRleD5cclxuICAgICNpbmNsdWRlIDxlbnZtYXBfdmVydGV4PlxyXG4gICAgI2luY2x1ZGUgPHNoYWRvd21hcF92ZXJ0ZXg+XHJcbiAgICAjaW5jbHVkZSA8Zm9nX3ZlcnRleD5cclxuICB9YDtcclxufTtcclxuXHJcblBob25nQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlLmNvbmNhdEZyYWdtZW50U2hhZGVyID0gZnVuY3Rpb24gKCkge1xyXG4gIHJldHVybiBgXHJcbiAgI2RlZmluZSBQSE9OR1xyXG5cclxuICB1bmlmb3JtIHZlYzMgZGlmZnVzZTtcclxuICB1bmlmb3JtIHZlYzMgZW1pc3NpdmU7XHJcbiAgdW5pZm9ybSB2ZWMzIHNwZWN1bGFyO1xyXG4gIHVuaWZvcm0gZmxvYXQgc2hpbmluZXNzO1xyXG4gIHVuaWZvcm0gZmxvYXQgb3BhY2l0eTtcclxuICBcclxuICAjaW5jbHVkZSA8Y29tbW9uPlxyXG4gICNpbmNsdWRlIDxwYWNraW5nPlxyXG4gICNpbmNsdWRlIDxkaXRoZXJpbmdfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8Y29sb3JfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8dXZfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8dXYyX3BhcnNfZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPG1hcF9wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxhbHBoYW1hcF9wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxhb21hcF9wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxsaWdodG1hcF9wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxlbWlzc2l2ZW1hcF9wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxlbnZtYXBfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8Z3JhZGllbnRtYXBfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8Zm9nX3BhcnNfZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPGJzZGZzPlxyXG4gICNpbmNsdWRlIDxsaWdodHNfcGFycz5cclxuICAjaW5jbHVkZSA8bGlnaHRzX3Bob25nX3BhcnNfZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPHNoYWRvd21hcF9wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxidW1wbWFwX3BhcnNfZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPG5vcm1hbG1hcF9wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxzcGVjdWxhcm1hcF9wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl9wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfcGFyc19mcmFnbWVudD5cclxuICBcclxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50UGFyYW1ldGVycycpfVxyXG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmFyeWluZ1BhcmFtZXRlcnMnKX1cclxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50RnVuY3Rpb25zJyl9XHJcbiAgXHJcbiAgdm9pZCBtYWluKCkge1xyXG4gIFxyXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudEluaXQnKX1cclxuICBcclxuICAgICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfZnJhZ21lbnQ+XHJcbiAgXHJcbiAgICB2ZWM0IGRpZmZ1c2VDb2xvciA9IHZlYzQoIGRpZmZ1c2UsIG9wYWNpdHkgKTtcclxuICAgIFJlZmxlY3RlZExpZ2h0IHJlZmxlY3RlZExpZ2h0ID0gUmVmbGVjdGVkTGlnaHQoIHZlYzMoIDAuMCApLCB2ZWMzKCAwLjAgKSwgdmVjMyggMC4wICksIHZlYzMoIDAuMCApICk7XHJcbiAgICB2ZWMzIHRvdGFsRW1pc3NpdmVSYWRpYW5jZSA9IGVtaXNzaXZlO1xyXG4gIFxyXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudERpZmZ1c2UnKX1cclxuICBcclxuICAgICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl9mcmFnbWVudD5cclxuXHJcbiAgICAkeyh0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudE1hcCcpIHx8ICcjaW5jbHVkZSA8bWFwX2ZyYWdtZW50PicpfVxyXG5cclxuICAgICNpbmNsdWRlIDxjb2xvcl9mcmFnbWVudD5cclxuICAgICNpbmNsdWRlIDxhbHBoYW1hcF9mcmFnbWVudD5cclxuICAgICNpbmNsdWRlIDxhbHBoYXRlc3RfZnJhZ21lbnQ+XHJcbiAgICAjaW5jbHVkZSA8c3BlY3VsYXJtYXBfZnJhZ21lbnQ+XHJcbiAgICAjaW5jbHVkZSA8bm9ybWFsX2ZyYWdtZW50PlxyXG4gICAgXHJcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50RW1pc3NpdmUnKX1cclxuICAgIFxyXG4gICAgI2luY2x1ZGUgPGVtaXNzaXZlbWFwX2ZyYWdtZW50PlxyXG4gIFxyXG4gICAgLy8gYWNjdW11bGF0aW9uXHJcbiAgICAjaW5jbHVkZSA8bGlnaHRzX3Bob25nX2ZyYWdtZW50PlxyXG4gICAgXHJcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50U3BlY3VsYXInKX1cclxuICAgIFxyXG4gICAgI2luY2x1ZGUgPGxpZ2h0c190ZW1wbGF0ZT5cclxuICBcclxuICAgIC8vIG1vZHVsYXRpb25cclxuICAgICNpbmNsdWRlIDxhb21hcF9mcmFnbWVudD5cclxuICBcclxuICAgIHZlYzMgb3V0Z29pbmdMaWdodCA9IHJlZmxlY3RlZExpZ2h0LmRpcmVjdERpZmZ1c2UgKyByZWZsZWN0ZWRMaWdodC5pbmRpcmVjdERpZmZ1c2UgKyByZWZsZWN0ZWRMaWdodC5kaXJlY3RTcGVjdWxhciArIHJlZmxlY3RlZExpZ2h0LmluZGlyZWN0U3BlY3VsYXIgKyB0b3RhbEVtaXNzaXZlUmFkaWFuY2U7XHJcbiAgXHJcbiAgICAjaW5jbHVkZSA8ZW52bWFwX2ZyYWdtZW50PlxyXG4gIFxyXG4gICAgZ2xfRnJhZ0NvbG9yID0gdmVjNCggb3V0Z29pbmdMaWdodCwgZGlmZnVzZUNvbG9yLmEgKTtcclxuICBcclxuICAgICNpbmNsdWRlIDx0b25lbWFwcGluZ19mcmFnbWVudD5cclxuICAgICNpbmNsdWRlIDxlbmNvZGluZ3NfZnJhZ21lbnQ+XHJcbiAgICAjaW5jbHVkZSA8Zm9nX2ZyYWdtZW50PlxyXG4gICAgI2luY2x1ZGUgPHByZW11bHRpcGxpZWRfYWxwaGFfZnJhZ21lbnQ+XHJcbiAgICAjaW5jbHVkZSA8ZGl0aGVyaW5nX2ZyYWdtZW50PlxyXG4gIFxyXG4gIH1gO1xyXG59O1xyXG5cclxuZXhwb3J0IHsgUGhvbmdBbmltYXRpb25NYXRlcmlhbCB9O1xyXG4iLCJpbXBvcnQgeyBTaGFkZXJMaWIgfSBmcm9tICd0aHJlZSc7XHJcbmltcG9ydCBCYXNlQW5pbWF0aW9uTWF0ZXJpYWwgZnJvbSAnLi9CYXNlQW5pbWF0aW9uTWF0ZXJpYWwnO1xyXG5cclxuLyoqXHJcbiAqIEV4dGVuZHMgVEhSRUUuTWVzaFN0YW5kYXJkTWF0ZXJpYWwgd2l0aCBjdXN0b20gc2hhZGVyIGNodW5rcy5cclxuICpcclxuICogQHNlZSBodHRwOi8vdGhyZWUtYmFzLWV4YW1wbGVzLnN1cmdlLnNoL2V4YW1wbGVzL21hdGVyaWFsc19zdGFuZGFyZC9cclxuICpcclxuICogQHBhcmFtIHtPYmplY3R9IHBhcmFtZXRlcnMgT2JqZWN0IGNvbnRhaW5pbmcgbWF0ZXJpYWwgcHJvcGVydGllcyBhbmQgY3VzdG9tIHNoYWRlciBjaHVua3MuXHJcbiAqIEBjb25zdHJ1Y3RvclxyXG4gKi9cclxuZnVuY3Rpb24gU3RhbmRhcmRBbmltYXRpb25NYXRlcmlhbChwYXJhbWV0ZXJzKSB7XHJcbiAgdGhpcy52YXJ5aW5nUGFyYW1ldGVycyA9IFtdO1xyXG5cclxuICB0aGlzLnZlcnRleEZ1bmN0aW9ucyA9IFtdO1xyXG4gIHRoaXMudmVydGV4UGFyYW1ldGVycyA9IFtdO1xyXG4gIHRoaXMudmVydGV4SW5pdCA9IFtdO1xyXG4gIHRoaXMudmVydGV4Tm9ybWFsID0gW107XHJcbiAgdGhpcy52ZXJ0ZXhQb3NpdGlvbiA9IFtdO1xyXG4gIHRoaXMudmVydGV4Q29sb3IgPSBbXTtcclxuXHJcbiAgdGhpcy5mcmFnbWVudEZ1bmN0aW9ucyA9IFtdO1xyXG4gIHRoaXMuZnJhZ21lbnRQYXJhbWV0ZXJzID0gW107XHJcbiAgdGhpcy5mcmFnbWVudEluaXQgPSBbXTtcclxuICB0aGlzLmZyYWdtZW50TWFwID0gW107XHJcbiAgdGhpcy5mcmFnbWVudERpZmZ1c2UgPSBbXTtcclxuICB0aGlzLmZyYWdtZW50Um91Z2huZXNzID0gW107XHJcbiAgdGhpcy5mcmFnbWVudE1ldGFsbmVzcyA9IFtdO1xyXG4gIHRoaXMuZnJhZ21lbnRFbWlzc2l2ZSA9IFtdO1xyXG5cclxuICBCYXNlQW5pbWF0aW9uTWF0ZXJpYWwuY2FsbCh0aGlzLCBwYXJhbWV0ZXJzLCBTaGFkZXJMaWJbJ3N0YW5kYXJkJ10udW5pZm9ybXMpO1xyXG5cclxuICB0aGlzLmxpZ2h0cyA9IHRydWU7XHJcbiAgdGhpcy52ZXJ0ZXhTaGFkZXIgPSB0aGlzLmNvbmNhdFZlcnRleFNoYWRlcigpO1xyXG4gIHRoaXMuZnJhZ21lbnRTaGFkZXIgPSB0aGlzLmNvbmNhdEZyYWdtZW50U2hhZGVyKCk7XHJcbn1cclxuU3RhbmRhcmRBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEJhc2VBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUpO1xyXG5TdGFuZGFyZEFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFN0YW5kYXJkQW5pbWF0aW9uTWF0ZXJpYWw7XHJcblxyXG5TdGFuZGFyZEFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZS5jb25jYXRWZXJ0ZXhTaGFkZXIgPSBmdW5jdGlvbiAoKSB7XHJcbiAgcmV0dXJuIGBcclxuICAjZGVmaW5lIFBIWVNJQ0FMXHJcblxyXG4gIHZhcnlpbmcgdmVjMyB2Vmlld1Bvc2l0aW9uO1xyXG4gIFxyXG4gICNpZm5kZWYgRkxBVF9TSEFERURcclxuICBcclxuICAgIHZhcnlpbmcgdmVjMyB2Tm9ybWFsO1xyXG4gIFxyXG4gICNlbmRpZlxyXG4gIFxyXG4gICNpbmNsdWRlIDxjb21tb24+XHJcbiAgI2luY2x1ZGUgPHV2X3BhcnNfdmVydGV4PlxyXG4gICNpbmNsdWRlIDx1djJfcGFyc192ZXJ0ZXg+XHJcbiAgI2luY2x1ZGUgPGRpc3BsYWNlbWVudG1hcF9wYXJzX3ZlcnRleD5cclxuICAjaW5jbHVkZSA8Y29sb3JfcGFyc192ZXJ0ZXg+XHJcbiAgI2luY2x1ZGUgPGZvZ19wYXJzX3ZlcnRleD5cclxuICAjaW5jbHVkZSA8bW9ycGh0YXJnZXRfcGFyc192ZXJ0ZXg+XHJcbiAgI2luY2x1ZGUgPHNraW5uaW5nX3BhcnNfdmVydGV4PlxyXG4gICNpbmNsdWRlIDxzaGFkb3dtYXBfcGFyc192ZXJ0ZXg+XHJcbiAgI2luY2x1ZGUgPGxvZ2RlcHRoYnVmX3BhcnNfdmVydGV4PlxyXG4gICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfcGFyc192ZXJ0ZXg+XHJcbiAgXHJcbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQYXJhbWV0ZXJzJyl9XHJcbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2YXJ5aW5nUGFyYW1ldGVycycpfVxyXG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4RnVuY3Rpb25zJyl9XHJcbiAgXHJcbiAgdm9pZCBtYWluKCkge1xyXG5cclxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4SW5pdCcpfVxyXG5cclxuICAgICNpbmNsdWRlIDx1dl92ZXJ0ZXg+XHJcbiAgICAjaW5jbHVkZSA8dXYyX3ZlcnRleD5cclxuICAgICNpbmNsdWRlIDxjb2xvcl92ZXJ0ZXg+XHJcbiAgXHJcbiAgICAjaW5jbHVkZSA8YmVnaW5ub3JtYWxfdmVydGV4PlxyXG4gICAgXHJcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleE5vcm1hbCcpfVxyXG4gICAgXHJcbiAgICAjaW5jbHVkZSA8bW9ycGhub3JtYWxfdmVydGV4PlxyXG4gICAgI2luY2x1ZGUgPHNraW5iYXNlX3ZlcnRleD5cclxuICAgICNpbmNsdWRlIDxza2lubm9ybWFsX3ZlcnRleD5cclxuICAgICNpbmNsdWRlIDxkZWZhdWx0bm9ybWFsX3ZlcnRleD5cclxuICBcclxuICAjaWZuZGVmIEZMQVRfU0hBREVEIC8vIE5vcm1hbCBjb21wdXRlZCB3aXRoIGRlcml2YXRpdmVzIHdoZW4gRkxBVF9TSEFERURcclxuICBcclxuICAgIHZOb3JtYWwgPSBub3JtYWxpemUoIHRyYW5zZm9ybWVkTm9ybWFsICk7XHJcbiAgXHJcbiAgI2VuZGlmXHJcbiAgXHJcbiAgICAjaW5jbHVkZSA8YmVnaW5fdmVydGV4PlxyXG4gICAgXHJcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBvc2l0aW9uJyl9XHJcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleENvbG9yJyl9XHJcbiAgICBcclxuICAgICNpbmNsdWRlIDxtb3JwaHRhcmdldF92ZXJ0ZXg+XHJcbiAgICAjaW5jbHVkZSA8c2tpbm5pbmdfdmVydGV4PlxyXG4gICAgI2luY2x1ZGUgPGRpc3BsYWNlbWVudG1hcF92ZXJ0ZXg+XHJcbiAgICAjaW5jbHVkZSA8cHJvamVjdF92ZXJ0ZXg+XHJcbiAgICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfdmVydGV4PlxyXG4gICAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc192ZXJ0ZXg+XHJcbiAgXHJcbiAgICB2Vmlld1Bvc2l0aW9uID0gLSBtdlBvc2l0aW9uLnh5ejtcclxuICBcclxuICAgICNpbmNsdWRlIDx3b3JsZHBvc192ZXJ0ZXg+XHJcbiAgICAjaW5jbHVkZSA8c2hhZG93bWFwX3ZlcnRleD5cclxuICAgICNpbmNsdWRlIDxmb2dfdmVydGV4PlxyXG4gIH1gO1xyXG59O1xyXG5cclxuU3RhbmRhcmRBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uY2F0RnJhZ21lbnRTaGFkZXIgPSBmdW5jdGlvbiAoKSB7XHJcbiAgcmV0dXJuIGBcclxuICAjZGVmaW5lIFBIWVNJQ0FMXHJcbiAgXHJcbiAgdW5pZm9ybSB2ZWMzIGRpZmZ1c2U7XHJcbiAgdW5pZm9ybSB2ZWMzIGVtaXNzaXZlO1xyXG4gIHVuaWZvcm0gZmxvYXQgcm91Z2huZXNzO1xyXG4gIHVuaWZvcm0gZmxvYXQgbWV0YWxuZXNzO1xyXG4gIHVuaWZvcm0gZmxvYXQgb3BhY2l0eTtcclxuICBcclxuICAjaWZuZGVmIFNUQU5EQVJEXHJcbiAgICB1bmlmb3JtIGZsb2F0IGNsZWFyQ29hdDtcclxuICAgIHVuaWZvcm0gZmxvYXQgY2xlYXJDb2F0Um91Z2huZXNzO1xyXG4gICNlbmRpZlxyXG4gIFxyXG4gIHZhcnlpbmcgdmVjMyB2Vmlld1Bvc2l0aW9uO1xyXG4gIFxyXG4gICNpZm5kZWYgRkxBVF9TSEFERURcclxuICBcclxuICAgIHZhcnlpbmcgdmVjMyB2Tm9ybWFsO1xyXG4gIFxyXG4gICNlbmRpZlxyXG4gIFxyXG4gICNpbmNsdWRlIDxjb21tb24+XHJcbiAgI2luY2x1ZGUgPHBhY2tpbmc+XHJcbiAgI2luY2x1ZGUgPGRpdGhlcmluZ19wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxjb2xvcl9wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDx1dl9wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDx1djJfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8bWFwX3BhcnNfZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPGFscGhhbWFwX3BhcnNfZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPGFvbWFwX3BhcnNfZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPGxpZ2h0bWFwX3BhcnNfZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPGVtaXNzaXZlbWFwX3BhcnNfZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPGVudm1hcF9wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxmb2dfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8YnNkZnM+XHJcbiAgI2luY2x1ZGUgPGN1YmVfdXZfcmVmbGVjdGlvbl9mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8bGlnaHRzX3BhcnM+XHJcbiAgI2luY2x1ZGUgPGxpZ2h0c19waHlzaWNhbF9wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxzaGFkb3dtYXBfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8YnVtcG1hcF9wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxub3JtYWxtYXBfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8cm91Z2huZXNzbWFwX3BhcnNfZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPG1ldGFsbmVzc21hcF9wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl9wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfcGFyc19mcmFnbWVudD5cclxuICBcclxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50UGFyYW1ldGVycycpfVxyXG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmFyeWluZ1BhcmFtZXRlcnMnKX1cclxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50RnVuY3Rpb25zJyl9XHJcbiAgXHJcbiAgdm9pZCBtYWluKCkge1xyXG4gIFxyXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudEluaXQnKX1cclxuICBcclxuICAgICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfZnJhZ21lbnQ+XHJcbiAgXHJcbiAgICB2ZWM0IGRpZmZ1c2VDb2xvciA9IHZlYzQoIGRpZmZ1c2UsIG9wYWNpdHkgKTtcclxuICAgIFJlZmxlY3RlZExpZ2h0IHJlZmxlY3RlZExpZ2h0ID0gUmVmbGVjdGVkTGlnaHQoIHZlYzMoIDAuMCApLCB2ZWMzKCAwLjAgKSwgdmVjMyggMC4wICksIHZlYzMoIDAuMCApICk7XHJcbiAgICB2ZWMzIHRvdGFsRW1pc3NpdmVSYWRpYW5jZSA9IGVtaXNzaXZlO1xyXG4gIFxyXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudERpZmZ1c2UnKX1cclxuICBcclxuICAgICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl9mcmFnbWVudD5cclxuXHJcbiAgICAkeyh0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudE1hcCcpIHx8ICcjaW5jbHVkZSA8bWFwX2ZyYWdtZW50PicpfVxyXG5cclxuICAgICNpbmNsdWRlIDxjb2xvcl9mcmFnbWVudD5cclxuICAgICNpbmNsdWRlIDxhbHBoYW1hcF9mcmFnbWVudD5cclxuICAgICNpbmNsdWRlIDxhbHBoYXRlc3RfZnJhZ21lbnQ+XHJcbiAgICBcclxuICAgIGZsb2F0IHJvdWdobmVzc0ZhY3RvciA9IHJvdWdobmVzcztcclxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRSb3VnaG5lc3MnKX1cclxuICAgICNpZmRlZiBVU0VfUk9VR0hORVNTTUFQXHJcbiAgICBcclxuICAgICAgdmVjNCB0ZXhlbFJvdWdobmVzcyA9IHRleHR1cmUyRCggcm91Z2huZXNzTWFwLCB2VXYgKTtcclxuICAgIFxyXG4gICAgICAvLyByZWFkcyBjaGFubmVsIEcsIGNvbXBhdGlibGUgd2l0aCBhIGNvbWJpbmVkIE9jY2x1c2lvblJvdWdobmVzc01ldGFsbGljIChSR0IpIHRleHR1cmVcclxuICAgICAgcm91Z2huZXNzRmFjdG9yICo9IHRleGVsUm91Z2huZXNzLmc7XHJcbiAgICBcclxuICAgICNlbmRpZlxyXG4gICAgXHJcbiAgICBmbG9hdCBtZXRhbG5lc3NGYWN0b3IgPSBtZXRhbG5lc3M7XHJcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50TWV0YWxuZXNzJyl9XHJcbiAgICAjaWZkZWYgVVNFX01FVEFMTkVTU01BUFxyXG4gICAgXHJcbiAgICAgIHZlYzQgdGV4ZWxNZXRhbG5lc3MgPSB0ZXh0dXJlMkQoIG1ldGFsbmVzc01hcCwgdlV2ICk7XHJcbiAgICAgIG1ldGFsbmVzc0ZhY3RvciAqPSB0ZXhlbE1ldGFsbmVzcy5iO1xyXG4gICAgXHJcbiAgICAjZW5kaWZcclxuICAgIFxyXG4gICAgI2luY2x1ZGUgPG5vcm1hbF9mcmFnbWVudD5cclxuICAgIFxyXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudEVtaXNzaXZlJyl9XHJcbiAgICBcclxuICAgICNpbmNsdWRlIDxlbWlzc2l2ZW1hcF9mcmFnbWVudD5cclxuICBcclxuICAgIC8vIGFjY3VtdWxhdGlvblxyXG4gICAgI2luY2x1ZGUgPGxpZ2h0c19waHlzaWNhbF9mcmFnbWVudD5cclxuICAgICNpbmNsdWRlIDxsaWdodHNfdGVtcGxhdGU+XHJcbiAgXHJcbiAgICAvLyBtb2R1bGF0aW9uXHJcbiAgICAjaW5jbHVkZSA8YW9tYXBfZnJhZ21lbnQ+XHJcbiAgXHJcbiAgICB2ZWMzIG91dGdvaW5nTGlnaHQgPSByZWZsZWN0ZWRMaWdodC5kaXJlY3REaWZmdXNlICsgcmVmbGVjdGVkTGlnaHQuaW5kaXJlY3REaWZmdXNlICsgcmVmbGVjdGVkTGlnaHQuZGlyZWN0U3BlY3VsYXIgKyByZWZsZWN0ZWRMaWdodC5pbmRpcmVjdFNwZWN1bGFyICsgdG90YWxFbWlzc2l2ZVJhZGlhbmNlO1xyXG4gIFxyXG4gICAgZ2xfRnJhZ0NvbG9yID0gdmVjNCggb3V0Z29pbmdMaWdodCwgZGlmZnVzZUNvbG9yLmEgKTtcclxuICBcclxuICAgICNpbmNsdWRlIDx0b25lbWFwcGluZ19mcmFnbWVudD5cclxuICAgICNpbmNsdWRlIDxlbmNvZGluZ3NfZnJhZ21lbnQ+XHJcbiAgICAjaW5jbHVkZSA8Zm9nX2ZyYWdtZW50PlxyXG4gICAgI2luY2x1ZGUgPHByZW11bHRpcGxpZWRfYWxwaGFfZnJhZ21lbnQ+XHJcbiAgICAjaW5jbHVkZSA8ZGl0aGVyaW5nX2ZyYWdtZW50PlxyXG4gIFxyXG4gIH1gO1xyXG59O1xyXG5cclxuZXhwb3J0IHsgU3RhbmRhcmRBbmltYXRpb25NYXRlcmlhbCB9O1xyXG4iLCJpbXBvcnQgeyBTaGFkZXJMaWIgfSBmcm9tICd0aHJlZSc7XHJcbmltcG9ydCBCYXNlQW5pbWF0aW9uTWF0ZXJpYWwgZnJvbSAnLi9CYXNlQW5pbWF0aW9uTWF0ZXJpYWwnO1xyXG5cclxuLyoqXHJcbiAqIEV4dGVuZHMgVEhSRUUuUG9pbnRzTWF0ZXJpYWwgd2l0aCBjdXN0b20gc2hhZGVyIGNodW5rcy5cclxuICpcclxuICogQHBhcmFtIHtPYmplY3R9IHBhcmFtZXRlcnMgT2JqZWN0IGNvbnRhaW5pbmcgbWF0ZXJpYWwgcHJvcGVydGllcyBhbmQgY3VzdG9tIHNoYWRlciBjaHVua3MuXHJcbiAqIEBjb25zdHJ1Y3RvclxyXG4gKi9cclxuZnVuY3Rpb24gUG9pbnRzQW5pbWF0aW9uTWF0ZXJpYWwocGFyYW1ldGVycykge1xyXG4gIHRoaXMudmFyeWluZ1BhcmFtZXRlcnMgPSBbXTtcclxuICBcclxuICB0aGlzLnZlcnRleEZ1bmN0aW9ucyA9IFtdO1xyXG4gIHRoaXMudmVydGV4UGFyYW1ldGVycyA9IFtdO1xyXG4gIHRoaXMudmVydGV4SW5pdCA9IFtdO1xyXG4gIHRoaXMudmVydGV4UG9zaXRpb24gPSBbXTtcclxuICB0aGlzLnZlcnRleENvbG9yID0gW107XHJcbiAgXHJcbiAgdGhpcy5mcmFnbWVudEZ1bmN0aW9ucyA9IFtdO1xyXG4gIHRoaXMuZnJhZ21lbnRQYXJhbWV0ZXJzID0gW107XHJcbiAgdGhpcy5mcmFnbWVudEluaXQgPSBbXTtcclxuICB0aGlzLmZyYWdtZW50TWFwID0gW107XHJcbiAgdGhpcy5mcmFnbWVudERpZmZ1c2UgPSBbXTtcclxuICAvLyB1c2UgZnJhZ21lbnQgc2hhZGVyIHRvIHNoYXBlIHRvIHBvaW50LCByZWZlcmVuY2U6IGh0dHBzOi8vdGhlYm9va29mc2hhZGVycy5jb20vMDcvXHJcbiAgdGhpcy5mcmFnbWVudFNoYXBlID0gW107XHJcbiAgXHJcbiAgQmFzZUFuaW1hdGlvbk1hdGVyaWFsLmNhbGwodGhpcywgcGFyYW1ldGVycywgU2hhZGVyTGliWydwb2ludHMnXS51bmlmb3Jtcyk7XHJcbiAgXHJcbiAgdGhpcy52ZXJ0ZXhTaGFkZXIgPSB0aGlzLmNvbmNhdFZlcnRleFNoYWRlcigpO1xyXG4gIHRoaXMuZnJhZ21lbnRTaGFkZXIgPSB0aGlzLmNvbmNhdEZyYWdtZW50U2hhZGVyKCk7XHJcbn1cclxuXHJcblBvaW50c0FuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoQmFzZUFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZSk7XHJcblBvaW50c0FuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFBvaW50c0FuaW1hdGlvbk1hdGVyaWFsO1xyXG5cclxuUG9pbnRzQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlLmNvbmNhdFZlcnRleFNoYWRlciA9IGZ1bmN0aW9uICgpIHtcclxuICByZXR1cm4gYFxyXG4gIHVuaWZvcm0gZmxvYXQgc2l6ZTtcclxuICB1bmlmb3JtIGZsb2F0IHNjYWxlO1xyXG4gIFxyXG4gICNpbmNsdWRlIDxjb21tb24+XHJcbiAgI2luY2x1ZGUgPGNvbG9yX3BhcnNfdmVydGV4PlxyXG4gICNpbmNsdWRlIDxmb2dfcGFyc192ZXJ0ZXg+XHJcbiAgI2luY2x1ZGUgPHNoYWRvd21hcF9wYXJzX3ZlcnRleD5cclxuICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfcGFyc192ZXJ0ZXg+XHJcbiAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc19wYXJzX3ZlcnRleD5cclxuICBcclxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBhcmFtZXRlcnMnKX1cclxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZhcnlpbmdQYXJhbWV0ZXJzJyl9XHJcbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhGdW5jdGlvbnMnKX1cclxuICBcclxuICB2b2lkIG1haW4oKSB7XHJcbiAgXHJcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleEluaXQnKX1cclxuICBcclxuICAgICNpbmNsdWRlIDxjb2xvcl92ZXJ0ZXg+XHJcbiAgICAjaW5jbHVkZSA8YmVnaW5fdmVydGV4PlxyXG4gICAgXHJcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBvc2l0aW9uJyl9XHJcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleENvbG9yJyl9XHJcbiAgICBcclxuICAgICNpbmNsdWRlIDxwcm9qZWN0X3ZlcnRleD5cclxuICBcclxuICAgICNpZmRlZiBVU0VfU0laRUFUVEVOVUFUSU9OXHJcbiAgICAgIGdsX1BvaW50U2l6ZSA9IHNpemUgKiAoIHNjYWxlIC8gLSBtdlBvc2l0aW9uLnogKTtcclxuICAgICNlbHNlXHJcbiAgICAgIGdsX1BvaW50U2l6ZSA9IHNpemU7XHJcbiAgICAjZW5kaWZcclxuICBcclxuICAgICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl92ZXJ0ZXg+XHJcbiAgICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX3ZlcnRleD5cclxuICAgICNpbmNsdWRlIDx3b3JsZHBvc192ZXJ0ZXg+XHJcbiAgICAjaW5jbHVkZSA8c2hhZG93bWFwX3ZlcnRleD5cclxuICAgICNpbmNsdWRlIDxmb2dfdmVydGV4PlxyXG4gIH1gO1xyXG59O1xyXG5cclxuUG9pbnRzQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlLmNvbmNhdEZyYWdtZW50U2hhZGVyID0gZnVuY3Rpb24gKCkge1xyXG4gIHJldHVybiBgXHJcbiAgdW5pZm9ybSB2ZWMzIGRpZmZ1c2U7XHJcbiAgdW5pZm9ybSBmbG9hdCBvcGFjaXR5O1xyXG4gIFxyXG4gICNpbmNsdWRlIDxjb21tb24+XHJcbiAgI2luY2x1ZGUgPHBhY2tpbmc+XHJcbiAgI2luY2x1ZGUgPGNvbG9yX3BhcnNfZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPG1hcF9wYXJ0aWNsZV9wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxmb2dfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8c2hhZG93bWFwX3BhcnNfZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPGxvZ2RlcHRoYnVmX3BhcnNfZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc19wYXJzX2ZyYWdtZW50PlxyXG4gIFxyXG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRQYXJhbWV0ZXJzJyl9XHJcbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2YXJ5aW5nUGFyYW1ldGVycycpfVxyXG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRGdW5jdGlvbnMnKX1cclxuICBcclxuICB2b2lkIG1haW4oKSB7XHJcbiAgXHJcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50SW5pdCcpfVxyXG4gIFxyXG4gICAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc19mcmFnbWVudD5cclxuICBcclxuICAgIHZlYzMgb3V0Z29pbmdMaWdodCA9IHZlYzMoIDAuMCApO1xyXG4gICAgdmVjNCBkaWZmdXNlQ29sb3IgPSB2ZWM0KCBkaWZmdXNlLCBvcGFjaXR5ICk7XHJcbiAgXHJcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50RGlmZnVzZScpfVxyXG4gIFxyXG4gICAgI2luY2x1ZGUgPGxvZ2RlcHRoYnVmX2ZyYWdtZW50PlxyXG5cclxuICAgICR7KHRoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50TWFwJykgfHwgJyNpbmNsdWRlIDxtYXBfcGFydGljbGVfZnJhZ21lbnQ+Jyl9XHJcblxyXG4gICAgI2luY2x1ZGUgPGNvbG9yX2ZyYWdtZW50PlxyXG4gICAgI2luY2x1ZGUgPGFscGhhdGVzdF9mcmFnbWVudD5cclxuICBcclxuICAgIG91dGdvaW5nTGlnaHQgPSBkaWZmdXNlQ29sb3IucmdiO1xyXG4gIFxyXG4gICAgZ2xfRnJhZ0NvbG9yID0gdmVjNCggb3V0Z29pbmdMaWdodCwgZGlmZnVzZUNvbG9yLmEgKTtcclxuICAgIFxyXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudFNoYXBlJyl9XHJcbiAgXHJcbiAgICAjaW5jbHVkZSA8cHJlbXVsdGlwbGllZF9hbHBoYV9mcmFnbWVudD5cclxuICAgICNpbmNsdWRlIDx0b25lbWFwcGluZ19mcmFnbWVudD5cclxuICAgICNpbmNsdWRlIDxlbmNvZGluZ3NfZnJhZ21lbnQ+XHJcbiAgICAjaW5jbHVkZSA8Zm9nX2ZyYWdtZW50PlxyXG4gIH1gO1xyXG59O1xyXG5cclxuZXhwb3J0IHsgUG9pbnRzQW5pbWF0aW9uTWF0ZXJpYWwgfTtcclxuIiwiaW1wb3J0IHsgU2hhZGVyTGliLCBVbmlmb3Jtc1V0aWxzLCBSR0JBRGVwdGhQYWNraW5nIH0gZnJvbSAndGhyZWUnO1xyXG5pbXBvcnQgQmFzZUFuaW1hdGlvbk1hdGVyaWFsIGZyb20gJy4vQmFzZUFuaW1hdGlvbk1hdGVyaWFsJztcclxuXHJcbmZ1bmN0aW9uIERlcHRoQW5pbWF0aW9uTWF0ZXJpYWwocGFyYW1ldGVycykge1xyXG4gIHRoaXMuZGVwdGhQYWNraW5nID0gUkdCQURlcHRoUGFja2luZztcclxuICB0aGlzLmNsaXBwaW5nID0gdHJ1ZTtcclxuXHJcbiAgdGhpcy52ZXJ0ZXhGdW5jdGlvbnMgPSBbXTtcclxuICB0aGlzLnZlcnRleFBhcmFtZXRlcnMgPSBbXTtcclxuICB0aGlzLnZlcnRleEluaXQgPSBbXTtcclxuICB0aGlzLnZlcnRleFBvc2l0aW9uID0gW107XHJcblxyXG4gIEJhc2VBbmltYXRpb25NYXRlcmlhbC5jYWxsKHRoaXMsIHBhcmFtZXRlcnMpO1xyXG4gIFxyXG4gIHRoaXMudW5pZm9ybXMgPSBVbmlmb3Jtc1V0aWxzLm1lcmdlKFtTaGFkZXJMaWJbJ2RlcHRoJ10udW5pZm9ybXMsIHRoaXMudW5pZm9ybXNdKTtcclxuICB0aGlzLnZlcnRleFNoYWRlciA9IHRoaXMuY29uY2F0VmVydGV4U2hhZGVyKCk7XHJcbiAgdGhpcy5mcmFnbWVudFNoYWRlciA9IFNoYWRlckxpYlsnZGVwdGgnXS5mcmFnbWVudFNoYWRlcjtcclxufVxyXG5EZXB0aEFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoQmFzZUFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZSk7XHJcbkRlcHRoQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gRGVwdGhBbmltYXRpb25NYXRlcmlhbDtcclxuXHJcbkRlcHRoQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlLmNvbmNhdFZlcnRleFNoYWRlciA9IGZ1bmN0aW9uICgpIHtcclxuICBcclxuICByZXR1cm4gYFxyXG4gICNpbmNsdWRlIDxjb21tb24+XHJcbiAgI2luY2x1ZGUgPHV2X3BhcnNfdmVydGV4PlxyXG4gICNpbmNsdWRlIDxkaXNwbGFjZW1lbnRtYXBfcGFyc192ZXJ0ZXg+XHJcbiAgI2luY2x1ZGUgPG1vcnBodGFyZ2V0X3BhcnNfdmVydGV4PlxyXG4gICNpbmNsdWRlIDxza2lubmluZ19wYXJzX3ZlcnRleD5cclxuICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfcGFyc192ZXJ0ZXg+XHJcbiAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc19wYXJzX3ZlcnRleD5cclxuICBcclxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBhcmFtZXRlcnMnKX1cclxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleEZ1bmN0aW9ucycpfVxyXG4gIFxyXG4gIHZvaWQgbWFpbigpIHtcclxuICBcclxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4SW5pdCcpfVxyXG4gIFxyXG4gICAgI2luY2x1ZGUgPHV2X3ZlcnRleD5cclxuICBcclxuICAgICNpbmNsdWRlIDxza2luYmFzZV92ZXJ0ZXg+XHJcbiAgXHJcbiAgICAjaWZkZWYgVVNFX0RJU1BMQUNFTUVOVE1BUFxyXG4gIFxyXG4gICAgICAjaW5jbHVkZSA8YmVnaW5ub3JtYWxfdmVydGV4PlxyXG4gICAgICAjaW5jbHVkZSA8bW9ycGhub3JtYWxfdmVydGV4PlxyXG4gICAgICAjaW5jbHVkZSA8c2tpbm5vcm1hbF92ZXJ0ZXg+XHJcbiAgXHJcbiAgICAjZW5kaWZcclxuICBcclxuICAgICNpbmNsdWRlIDxiZWdpbl92ZXJ0ZXg+XHJcbiAgICBcclxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UG9zaXRpb24nKX1cclxuXHJcbiAgICAjaW5jbHVkZSA8bW9ycGh0YXJnZXRfdmVydGV4PlxyXG4gICAgI2luY2x1ZGUgPHNraW5uaW5nX3ZlcnRleD5cclxuICAgICNpbmNsdWRlIDxkaXNwbGFjZW1lbnRtYXBfdmVydGV4PlxyXG4gICAgI2luY2x1ZGUgPHByb2plY3RfdmVydGV4PlxyXG4gICAgI2luY2x1ZGUgPGxvZ2RlcHRoYnVmX3ZlcnRleD5cclxuICAgICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfdmVydGV4PlxyXG4gIH1gO1xyXG59O1xyXG5cclxuZXhwb3J0IHsgRGVwdGhBbmltYXRpb25NYXRlcmlhbCB9O1xyXG4iLCJpbXBvcnQgeyBTaGFkZXJMaWIsIFVuaWZvcm1zVXRpbHMsIFJHQkFEZXB0aFBhY2tpbmcgfSBmcm9tICd0aHJlZSc7XHJcbmltcG9ydCBCYXNlQW5pbWF0aW9uTWF0ZXJpYWwgZnJvbSAnLi9CYXNlQW5pbWF0aW9uTWF0ZXJpYWwnO1xyXG5cclxuZnVuY3Rpb24gRGlzdGFuY2VBbmltYXRpb25NYXRlcmlhbChwYXJhbWV0ZXJzKSB7XHJcbiAgdGhpcy5kZXB0aFBhY2tpbmcgPSBSR0JBRGVwdGhQYWNraW5nO1xyXG4gIHRoaXMuY2xpcHBpbmcgPSB0cnVlO1xyXG5cclxuICB0aGlzLnZlcnRleEZ1bmN0aW9ucyA9IFtdO1xyXG4gIHRoaXMudmVydGV4UGFyYW1ldGVycyA9IFtdO1xyXG4gIHRoaXMudmVydGV4SW5pdCA9IFtdO1xyXG4gIHRoaXMudmVydGV4UG9zaXRpb24gPSBbXTtcclxuXHJcbiAgQmFzZUFuaW1hdGlvbk1hdGVyaWFsLmNhbGwodGhpcywgcGFyYW1ldGVycyk7XHJcbiAgXHJcbiAgdGhpcy51bmlmb3JtcyA9IFVuaWZvcm1zVXRpbHMubWVyZ2UoW1NoYWRlckxpYlsnZGlzdGFuY2VSR0JBJ10udW5pZm9ybXMsIHRoaXMudW5pZm9ybXNdKTtcclxuICB0aGlzLnZlcnRleFNoYWRlciA9IHRoaXMuY29uY2F0VmVydGV4U2hhZGVyKCk7XHJcbiAgdGhpcy5mcmFnbWVudFNoYWRlciA9IFNoYWRlckxpYlsnZGlzdGFuY2VSR0JBJ10uZnJhZ21lbnRTaGFkZXI7XHJcbn1cclxuRGlzdGFuY2VBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEJhc2VBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUpO1xyXG5EaXN0YW5jZUFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IERpc3RhbmNlQW5pbWF0aW9uTWF0ZXJpYWw7XHJcblxyXG5EaXN0YW5jZUFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZS5jb25jYXRWZXJ0ZXhTaGFkZXIgPSBmdW5jdGlvbiAoKSB7XHJcbiAgcmV0dXJuIGBcclxuICAjZGVmaW5lIERJU1RBTkNFXHJcblxyXG4gIHZhcnlpbmcgdmVjMyB2V29ybGRQb3NpdGlvbjtcclxuICBcclxuICAjaW5jbHVkZSA8Y29tbW9uPlxyXG4gICNpbmNsdWRlIDx1dl9wYXJzX3ZlcnRleD5cclxuICAjaW5jbHVkZSA8ZGlzcGxhY2VtZW50bWFwX3BhcnNfdmVydGV4PlxyXG4gICNpbmNsdWRlIDxtb3JwaHRhcmdldF9wYXJzX3ZlcnRleD5cclxuICAjaW5jbHVkZSA8c2tpbm5pbmdfcGFyc192ZXJ0ZXg+XHJcbiAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc19wYXJzX3ZlcnRleD5cclxuICBcclxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBhcmFtZXRlcnMnKX1cclxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleEZ1bmN0aW9ucycpfVxyXG4gIFxyXG4gIHZvaWQgbWFpbigpIHtcclxuXHJcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleEluaXQnKX1cclxuICBcclxuICAgICNpbmNsdWRlIDx1dl92ZXJ0ZXg+XHJcbiAgXHJcbiAgICAjaW5jbHVkZSA8c2tpbmJhc2VfdmVydGV4PlxyXG4gIFxyXG4gICAgI2lmZGVmIFVTRV9ESVNQTEFDRU1FTlRNQVBcclxuICBcclxuICAgICAgI2luY2x1ZGUgPGJlZ2lubm9ybWFsX3ZlcnRleD5cclxuICAgICAgI2luY2x1ZGUgPG1vcnBobm9ybWFsX3ZlcnRleD5cclxuICAgICAgI2luY2x1ZGUgPHNraW5ub3JtYWxfdmVydGV4PlxyXG4gIFxyXG4gICAgI2VuZGlmXHJcbiAgXHJcbiAgICAjaW5jbHVkZSA8YmVnaW5fdmVydGV4PlxyXG4gICAgXHJcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBvc2l0aW9uJyl9XHJcblxyXG4gICAgI2luY2x1ZGUgPG1vcnBodGFyZ2V0X3ZlcnRleD5cclxuICAgICNpbmNsdWRlIDxza2lubmluZ192ZXJ0ZXg+XHJcbiAgICAjaW5jbHVkZSA8ZGlzcGxhY2VtZW50bWFwX3ZlcnRleD5cclxuICAgICNpbmNsdWRlIDxwcm9qZWN0X3ZlcnRleD5cclxuICAgICNpbmNsdWRlIDx3b3JsZHBvc192ZXJ0ZXg+XHJcbiAgICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX3ZlcnRleD5cclxuICBcclxuICAgIHZXb3JsZFBvc2l0aW9uID0gd29ybGRQb3NpdGlvbi54eXo7XHJcbiAgXHJcbiAgfWA7XHJcbn07XHJcblxyXG5leHBvcnQgeyBEaXN0YW5jZUFuaW1hdGlvbk1hdGVyaWFsIH07XHJcbiIsImltcG9ydCB7IEJ1ZmZlckdlb21ldHJ5LCBCdWZmZXJBdHRyaWJ1dGUgfSBmcm9tICd0aHJlZSc7XHJcbi8qKlxyXG4gKiBBIFRIUkVFLkJ1ZmZlckdlb21ldHJ5IHdoZXJlIGEgJ3ByZWZhYicgZ2VvbWV0cnkgaXMgcmVwZWF0ZWQgYSBudW1iZXIgb2YgdGltZXMuXHJcbiAqXHJcbiAqIEBwYXJhbSB7VEhSRUUuR2VvbWV0cnl9IHByZWZhYiBUaGUgVEhSRUUuR2VvbWV0cnkgaW5zdGFuY2UgdG8gcmVwZWF0LlxyXG4gKiBAcGFyYW0ge051bWJlcn0gY291bnQgVGhlIG51bWJlciBvZiB0aW1lcyB0byByZXBlYXQgdGhlIGdlb21ldHJ5LlxyXG4gKiBAY29uc3RydWN0b3JcclxuICovXHJcbmZ1bmN0aW9uIFByZWZhYkJ1ZmZlckdlb21ldHJ5KHByZWZhYiwgY291bnQpIHtcclxuICBCdWZmZXJHZW9tZXRyeS5jYWxsKHRoaXMpO1xyXG4gIFxyXG4gIC8qKlxyXG4gICAqIEEgcmVmZXJlbmNlIHRvIHRoZSBwcmVmYWIgZ2VvbWV0cnkgdXNlZCB0byBjcmVhdGUgdGhpcyBpbnN0YW5jZS5cclxuICAgKiBAdHlwZSB7VEhSRUUuR2VvbWV0cnl9XHJcbiAgICovXHJcbiAgdGhpcy5wcmVmYWJHZW9tZXRyeSA9IHByZWZhYjtcclxuICBcclxuICAvKipcclxuICAgKiBOdW1iZXIgb2YgcHJlZmFicy5cclxuICAgKiBAdHlwZSB7TnVtYmVyfVxyXG4gICAqL1xyXG4gIHRoaXMucHJlZmFiQ291bnQgPSBjb3VudDtcclxuICBcclxuICAvKipcclxuICAgKiBOdW1iZXIgb2YgdmVydGljZXMgb2YgdGhlIHByZWZhYi5cclxuICAgKiBAdHlwZSB7TnVtYmVyfVxyXG4gICAqL1xyXG4gIHRoaXMucHJlZmFiVmVydGV4Q291bnQgPSBwcmVmYWIudmVydGljZXMubGVuZ3RoO1xyXG4gIFxyXG4gIHRoaXMuYnVmZmVySW5kaWNlcygpO1xyXG4gIHRoaXMuYnVmZmVyUG9zaXRpb25zKCk7XHJcbn1cclxuUHJlZmFiQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUpO1xyXG5QcmVmYWJCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBQcmVmYWJCdWZmZXJHZW9tZXRyeTtcclxuXHJcblByZWZhYkJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5idWZmZXJJbmRpY2VzID0gZnVuY3Rpb24oKSB7XHJcbiAgY29uc3QgcHJlZmFiRmFjZUNvdW50ID0gdGhpcy5wcmVmYWJHZW9tZXRyeS5mYWNlcy5sZW5ndGg7XHJcbiAgY29uc3QgcHJlZmFiSW5kZXhDb3VudCA9IHRoaXMucHJlZmFiR2VvbWV0cnkuZmFjZXMubGVuZ3RoICogMztcclxuICBjb25zdCBwcmVmYWJJbmRpY2VzID0gW107XHJcbiAgXHJcbiAgZm9yIChsZXQgaCA9IDA7IGggPCBwcmVmYWJGYWNlQ291bnQ7IGgrKykge1xyXG4gICAgY29uc3QgZmFjZSA9IHRoaXMucHJlZmFiR2VvbWV0cnkuZmFjZXNbaF07XHJcbiAgICBwcmVmYWJJbmRpY2VzLnB1c2goZmFjZS5hLCBmYWNlLmIsIGZhY2UuYyk7XHJcbiAgfVxyXG4gIFxyXG4gIGNvbnN0IGluZGV4QnVmZmVyID0gbmV3IFVpbnQzMkFycmF5KHRoaXMucHJlZmFiQ291bnQgKiBwcmVmYWJJbmRleENvdW50KTtcclxuICBcclxuICB0aGlzLnNldEluZGV4KG5ldyBCdWZmZXJBdHRyaWJ1dGUoaW5kZXhCdWZmZXIsIDEpKTtcclxuICBcclxuICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucHJlZmFiQ291bnQ7IGkrKykge1xyXG4gICAgZm9yIChsZXQgayA9IDA7IGsgPCBwcmVmYWJJbmRleENvdW50OyBrKyspIHtcclxuICAgICAgaW5kZXhCdWZmZXJbaSAqIHByZWZhYkluZGV4Q291bnQgKyBrXSA9IHByZWZhYkluZGljZXNba10gKyBpICogdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudDtcclxuICAgIH1cclxuICB9XHJcbn07XHJcblxyXG5QcmVmYWJCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuYnVmZmVyUG9zaXRpb25zID0gZnVuY3Rpb24oKSB7XHJcbiAgY29uc3QgcG9zaXRpb25CdWZmZXIgPSB0aGlzLmNyZWF0ZUF0dHJpYnV0ZSgncG9zaXRpb24nLCAzKS5hcnJheTtcclxuICBcclxuICBmb3IgKGxldCBpID0gMCwgb2Zmc2V0ID0gMDsgaSA8IHRoaXMucHJlZmFiQ291bnQ7IGkrKykge1xyXG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCB0aGlzLnByZWZhYlZlcnRleENvdW50OyBqKyssIG9mZnNldCArPSAzKSB7XHJcbiAgICAgIGNvbnN0IHByZWZhYlZlcnRleCA9IHRoaXMucHJlZmFiR2VvbWV0cnkudmVydGljZXNbal07XHJcbiAgICAgIFxyXG4gICAgICBwb3NpdGlvbkJ1ZmZlcltvZmZzZXQgICAgXSA9IHByZWZhYlZlcnRleC54O1xyXG4gICAgICBwb3NpdGlvbkJ1ZmZlcltvZmZzZXQgKyAxXSA9IHByZWZhYlZlcnRleC55O1xyXG4gICAgICBwb3NpdGlvbkJ1ZmZlcltvZmZzZXQgKyAyXSA9IHByZWZhYlZlcnRleC56O1xyXG4gICAgfVxyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIGEgVEhSRUUuQnVmZmVyQXR0cmlidXRlIHdpdGggVVYgY29vcmRpbmF0ZXMuXHJcbiAqL1xyXG5QcmVmYWJCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuYnVmZmVyVXZzID0gZnVuY3Rpb24oKSB7XHJcbiAgY29uc3QgcHJlZmFiRmFjZUNvdW50ID0gdGhpcy5wcmVmYWJHZW9tZXRyeS5mYWNlcy5sZW5ndGg7XHJcbiAgY29uc3QgcHJlZmFiVmVydGV4Q291bnQgPSB0aGlzLnByZWZhYlZlcnRleENvdW50ID0gdGhpcy5wcmVmYWJHZW9tZXRyeS52ZXJ0aWNlcy5sZW5ndGg7XHJcbiAgY29uc3QgcHJlZmFiVXZzID0gW107XHJcbiAgXHJcbiAgZm9yIChsZXQgaCA9IDA7IGggPCBwcmVmYWJGYWNlQ291bnQ7IGgrKykge1xyXG4gICAgY29uc3QgZmFjZSA9IHRoaXMucHJlZmFiR2VvbWV0cnkuZmFjZXNbaF07XHJcbiAgICBjb25zdCB1diA9IHRoaXMucHJlZmFiR2VvbWV0cnkuZmFjZVZlcnRleFV2c1swXVtoXTtcclxuICAgIFxyXG4gICAgcHJlZmFiVXZzW2ZhY2UuYV0gPSB1dlswXTtcclxuICAgIHByZWZhYlV2c1tmYWNlLmJdID0gdXZbMV07XHJcbiAgICBwcmVmYWJVdnNbZmFjZS5jXSA9IHV2WzJdO1xyXG4gIH1cclxuICBcclxuICBjb25zdCB1dkJ1ZmZlciA9IHRoaXMuY3JlYXRlQXR0cmlidXRlKCd1dicsIDIpO1xyXG4gIFxyXG4gIGZvciAobGV0IGkgPSAwLCBvZmZzZXQgPSAwOyBpIDwgdGhpcy5wcmVmYWJDb3VudDsgaSsrKSB7XHJcbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IHByZWZhYlZlcnRleENvdW50OyBqKyssIG9mZnNldCArPSAyKSB7XHJcbiAgICAgIGxldCBwcmVmYWJVdiA9IHByZWZhYlV2c1tqXTtcclxuICAgICAgXHJcbiAgICAgIHV2QnVmZmVyLmFycmF5W29mZnNldF0gPSBwcmVmYWJVdi54O1xyXG4gICAgICB1dkJ1ZmZlci5hcnJheVtvZmZzZXQgKyAxXSA9IHByZWZhYlV2Lnk7XHJcbiAgICB9XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgYSBUSFJFRS5CdWZmZXJBdHRyaWJ1dGUgb24gdGhpcyBnZW9tZXRyeSBpbnN0YW5jZS5cclxuICpcclxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgTmFtZSBvZiB0aGUgYXR0cmlidXRlLlxyXG4gKiBAcGFyYW0ge051bWJlcn0gaXRlbVNpemUgTnVtYmVyIG9mIGZsb2F0cyBwZXIgdmVydGV4ICh0eXBpY2FsbHkgMSwgMiwgMyBvciA0KS5cclxuICogQHBhcmFtIHtmdW5jdGlvbj19IGZhY3RvcnkgRnVuY3Rpb24gdGhhdCB3aWxsIGJlIGNhbGxlZCBmb3IgZWFjaCBwcmVmYWIgdXBvbiBjcmVhdGlvbi4gQWNjZXB0cyAzIGFyZ3VtZW50czogZGF0YVtdLCBpbmRleCBhbmQgcHJlZmFiQ291bnQuIENhbGxzIHNldFByZWZhYkRhdGEuXHJcbiAqXHJcbiAqIEByZXR1cm5zIHtUSFJFRS5CdWZmZXJBdHRyaWJ1dGV9XHJcbiAqL1xyXG5QcmVmYWJCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuY3JlYXRlQXR0cmlidXRlID0gZnVuY3Rpb24obmFtZSwgaXRlbVNpemUsIGZhY3RvcnkpIHtcclxuICBjb25zdCBidWZmZXIgPSBuZXcgRmxvYXQzMkFycmF5KHRoaXMucHJlZmFiQ291bnQgKiB0aGlzLnByZWZhYlZlcnRleENvdW50ICogaXRlbVNpemUpO1xyXG4gIGNvbnN0IGF0dHJpYnV0ZSA9IG5ldyBCdWZmZXJBdHRyaWJ1dGUoYnVmZmVyLCBpdGVtU2l6ZSk7XHJcbiAgXHJcbiAgdGhpcy5hZGRBdHRyaWJ1dGUobmFtZSwgYXR0cmlidXRlKTtcclxuICBcclxuICBpZiAoZmFjdG9yeSkge1xyXG4gICAgY29uc3QgZGF0YSA9IFtdO1xyXG4gICAgXHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucHJlZmFiQ291bnQ7IGkrKykge1xyXG4gICAgICBmYWN0b3J5KGRhdGEsIGksIHRoaXMucHJlZmFiQ291bnQpO1xyXG4gICAgICB0aGlzLnNldFByZWZhYkRhdGEoYXR0cmlidXRlLCBpLCBkYXRhKTtcclxuICAgIH1cclxuICB9XHJcbiAgXHJcbiAgcmV0dXJuIGF0dHJpYnV0ZTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBTZXRzIGRhdGEgZm9yIGFsbCB2ZXJ0aWNlcyBvZiBhIHByZWZhYiBhdCBhIGdpdmVuIGluZGV4LlxyXG4gKiBVc3VhbGx5IGNhbGxlZCBpbiBhIGxvb3AuXHJcbiAqXHJcbiAqIEBwYXJhbSB7U3RyaW5nfFRIUkVFLkJ1ZmZlckF0dHJpYnV0ZX0gYXR0cmlidXRlIFRoZSBhdHRyaWJ1dGUgb3IgYXR0cmlidXRlIG5hbWUgd2hlcmUgdGhlIGRhdGEgaXMgdG8gYmUgc3RvcmVkLlxyXG4gKiBAcGFyYW0ge051bWJlcn0gcHJlZmFiSW5kZXggSW5kZXggb2YgdGhlIHByZWZhYiBpbiB0aGUgYnVmZmVyIGdlb21ldHJ5LlxyXG4gKiBAcGFyYW0ge0FycmF5fSBkYXRhIEFycmF5IG9mIGRhdGEuIExlbmd0aCBzaG91bGQgYmUgZXF1YWwgdG8gaXRlbSBzaXplIG9mIHRoZSBhdHRyaWJ1dGUuXHJcbiAqL1xyXG5QcmVmYWJCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuc2V0UHJlZmFiRGF0YSA9IGZ1bmN0aW9uKGF0dHJpYnV0ZSwgcHJlZmFiSW5kZXgsIGRhdGEpIHtcclxuICBhdHRyaWJ1dGUgPSAodHlwZW9mIGF0dHJpYnV0ZSA9PT0gJ3N0cmluZycpID8gdGhpcy5hdHRyaWJ1dGVzW2F0dHJpYnV0ZV0gOiBhdHRyaWJ1dGU7XHJcbiAgXHJcbiAgbGV0IG9mZnNldCA9IHByZWZhYkluZGV4ICogdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudCAqIGF0dHJpYnV0ZS5pdGVtU2l6ZTtcclxuICBcclxuICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucHJlZmFiVmVydGV4Q291bnQ7IGkrKykge1xyXG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCBhdHRyaWJ1dGUuaXRlbVNpemU7IGorKykge1xyXG4gICAgICBhdHRyaWJ1dGUuYXJyYXlbb2Zmc2V0KytdID0gZGF0YVtqXTtcclxuICAgIH1cclxuICB9XHJcbn07XHJcblxyXG5leHBvcnQgeyBQcmVmYWJCdWZmZXJHZW9tZXRyeSB9O1xyXG4iLCJpbXBvcnQgeyBNYXRoIGFzIHRNYXRoLCBWZWN0b3IzIH0gZnJvbSAndGhyZWUnO1xyXG5pbXBvcnQgeyBEZXB0aEFuaW1hdGlvbk1hdGVyaWFsIH0gZnJvbSAnLi9tYXRlcmlhbHMvRGVwdGhBbmltYXRpb25NYXRlcmlhbCc7XHJcbmltcG9ydCB7IERpc3RhbmNlQW5pbWF0aW9uTWF0ZXJpYWwgfSBmcm9tICcuL21hdGVyaWFscy9EaXN0YW5jZUFuaW1hdGlvbk1hdGVyaWFsJztcclxuXHJcbi8qKlxyXG4gKiBDb2xsZWN0aW9uIG9mIHV0aWxpdHkgZnVuY3Rpb25zLlxyXG4gKiBAbmFtZXNwYWNlXHJcbiAqL1xyXG5jb25zdCBVdGlscyA9IHtcclxuICAvKipcclxuICAgKiBEdXBsaWNhdGVzIHZlcnRpY2VzIHNvIGVhY2ggZmFjZSBiZWNvbWVzIHNlcGFyYXRlLlxyXG4gICAqIFNhbWUgYXMgVEhSRUUuRXhwbG9kZU1vZGlmaWVyLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtUSFJFRS5HZW9tZXRyeX0gZ2VvbWV0cnkgR2VvbWV0cnkgaW5zdGFuY2UgdG8gbW9kaWZ5LlxyXG4gICAqL1xyXG4gIHNlcGFyYXRlRmFjZXM6IGZ1bmN0aW9uIChnZW9tZXRyeSkge1xyXG4gICAgbGV0IHZlcnRpY2VzID0gW107XHJcblxyXG4gICAgZm9yIChsZXQgaSA9IDAsIGlsID0gZ2VvbWV0cnkuZmFjZXMubGVuZ3RoOyBpIDwgaWw7IGkrKykge1xyXG4gICAgICBsZXQgbiA9IHZlcnRpY2VzLmxlbmd0aDtcclxuICAgICAgbGV0IGZhY2UgPSBnZW9tZXRyeS5mYWNlc1tpXTtcclxuXHJcbiAgICAgIGxldCBhID0gZmFjZS5hO1xyXG4gICAgICBsZXQgYiA9IGZhY2UuYjtcclxuICAgICAgbGV0IGMgPSBmYWNlLmM7XHJcblxyXG4gICAgICBsZXQgdmEgPSBnZW9tZXRyeS52ZXJ0aWNlc1thXTtcclxuICAgICAgbGV0IHZiID0gZ2VvbWV0cnkudmVydGljZXNbYl07XHJcbiAgICAgIGxldCB2YyA9IGdlb21ldHJ5LnZlcnRpY2VzW2NdO1xyXG5cclxuICAgICAgdmVydGljZXMucHVzaCh2YS5jbG9uZSgpKTtcclxuICAgICAgdmVydGljZXMucHVzaCh2Yi5jbG9uZSgpKTtcclxuICAgICAgdmVydGljZXMucHVzaCh2Yy5jbG9uZSgpKTtcclxuXHJcbiAgICAgIGZhY2UuYSA9IG47XHJcbiAgICAgIGZhY2UuYiA9IG4gKyAxO1xyXG4gICAgICBmYWNlLmMgPSBuICsgMjtcclxuICAgIH1cclxuXHJcbiAgICBnZW9tZXRyeS52ZXJ0aWNlcyA9IHZlcnRpY2VzO1xyXG4gIH0sXHJcblxyXG4gIC8qKlxyXG4gICAqIENvbXB1dGUgdGhlIGNlbnRyb2lkIChjZW50ZXIpIG9mIGEgVEhSRUUuRmFjZTMuXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge1RIUkVFLkdlb21ldHJ5fSBnZW9tZXRyeSBHZW9tZXRyeSBpbnN0YW5jZSB0aGUgZmFjZSBpcyBpbi5cclxuICAgKiBAcGFyYW0ge1RIUkVFLkZhY2UzfSBmYWNlIEZhY2Ugb2JqZWN0IGZyb20gdGhlIFRIUkVFLkdlb21ldHJ5LmZhY2VzIGFycmF5XHJcbiAgICogQHBhcmFtIHtUSFJFRS5WZWN0b3IzPX0gdiBPcHRpb25hbCB2ZWN0b3IgdG8gc3RvcmUgcmVzdWx0IGluLlxyXG4gICAqIEByZXR1cm5zIHtUSFJFRS5WZWN0b3IzfVxyXG4gICAqL1xyXG4gIGNvbXB1dGVDZW50cm9pZDogZnVuY3Rpb24oZ2VvbWV0cnksIGZhY2UsIHYpIHtcclxuICAgIGxldCBhID0gZ2VvbWV0cnkudmVydGljZXNbZmFjZS5hXTtcclxuICAgIGxldCBiID0gZ2VvbWV0cnkudmVydGljZXNbZmFjZS5iXTtcclxuICAgIGxldCBjID0gZ2VvbWV0cnkudmVydGljZXNbZmFjZS5jXTtcclxuXHJcbiAgICB2ID0gdiB8fCBuZXcgVEhSRUUuVmVjdG9yMygpO1xyXG5cclxuICAgIHYueCA9IChhLnggKyBiLnggKyBjLngpIC8gMztcclxuICAgIHYueSA9IChhLnkgKyBiLnkgKyBjLnkpIC8gMztcclxuICAgIHYueiA9IChhLnogKyBiLnogKyBjLnopIC8gMztcclxuXHJcbiAgICByZXR1cm4gdjtcclxuICB9LFxyXG5cclxuICAvKipcclxuICAgKiBHZXQgYSByYW5kb20gdmVjdG9yIGJldHdlZW4gYm94Lm1pbiBhbmQgYm94Lm1heC5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7VEhSRUUuQm94M30gYm94IFRIUkVFLkJveDMgaW5zdGFuY2UuXHJcbiAgICogQHBhcmFtIHtUSFJFRS5WZWN0b3IzPX0gdiBPcHRpb25hbCB2ZWN0b3IgdG8gc3RvcmUgcmVzdWx0IGluLlxyXG4gICAqIEByZXR1cm5zIHtUSFJFRS5WZWN0b3IzfVxyXG4gICAqL1xyXG4gIHJhbmRvbUluQm94OiBmdW5jdGlvbihib3gsIHYpIHtcclxuICAgIHYgPSB2IHx8IG5ldyBWZWN0b3IzKCk7XHJcblxyXG4gICAgdi54ID0gdE1hdGgucmFuZEZsb2F0KGJveC5taW4ueCwgYm94Lm1heC54KTtcclxuICAgIHYueSA9IHRNYXRoLnJhbmRGbG9hdChib3gubWluLnksIGJveC5tYXgueSk7XHJcbiAgICB2LnogPSB0TWF0aC5yYW5kRmxvYXQoYm94Lm1pbi56LCBib3gubWF4LnopO1xyXG5cclxuICAgIHJldHVybiB2O1xyXG4gIH0sXHJcblxyXG4gIC8qKlxyXG4gICAqIEdldCBhIHJhbmRvbSBheGlzIGZvciBxdWF0ZXJuaW9uIHJvdGF0aW9uLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtUSFJFRS5WZWN0b3IzPX0gdiBPcHRpb24gdmVjdG9yIHRvIHN0b3JlIHJlc3VsdCBpbi5cclxuICAgKiBAcmV0dXJucyB7VEhSRUUuVmVjdG9yM31cclxuICAgKi9cclxuICByYW5kb21BeGlzOiBmdW5jdGlvbih2KSB7XHJcbiAgICB2ID0gdiB8fCBuZXcgVmVjdG9yMygpO1xyXG5cclxuICAgIHYueCA9IHRNYXRoLnJhbmRGbG9hdFNwcmVhZCgyLjApO1xyXG4gICAgdi55ID0gdE1hdGgucmFuZEZsb2F0U3ByZWFkKDIuMCk7XHJcbiAgICB2LnogPSB0TWF0aC5yYW5kRmxvYXRTcHJlYWQoMi4wKTtcclxuICAgIHYubm9ybWFsaXplKCk7XHJcblxyXG4gICAgcmV0dXJuIHY7XHJcbiAgfSxcclxuXHJcbiAgLyoqXHJcbiAgICogQ3JlYXRlIGEgVEhSRUUuQkFTLkRlcHRoQW5pbWF0aW9uTWF0ZXJpYWwgZm9yIHNoYWRvd3MgZnJvbSBhIFRIUkVFLlNwb3RMaWdodCBvciBUSFJFRS5EaXJlY3Rpb25hbExpZ2h0IGJ5IGNvcHlpbmcgcmVsZXZhbnQgc2hhZGVyIGNodW5rcy5cclxuICAgKiBVbmlmb3JtIHZhbHVlcyBtdXN0IGJlIG1hbnVhbGx5IHN5bmNlZCBiZXR3ZWVuIHRoZSBzb3VyY2UgbWF0ZXJpYWwgYW5kIHRoZSBkZXB0aCBtYXRlcmlhbC5cclxuICAgKlxyXG4gICAqIEBzZWUge0BsaW5rIGh0dHA6Ly90aHJlZS1iYXMtZXhhbXBsZXMuc3VyZ2Uuc2gvZXhhbXBsZXMvc2hhZG93cy99XHJcbiAgICpcclxuICAgKiBAcGFyYW0ge1RIUkVFLkJBUy5CYXNlQW5pbWF0aW9uTWF0ZXJpYWx9IHNvdXJjZU1hdGVyaWFsIEluc3RhbmNlIHRvIGdldCB0aGUgc2hhZGVyIGNodW5rcyBmcm9tLlxyXG4gICAqIEByZXR1cm5zIHtUSFJFRS5CQVMuRGVwdGhBbmltYXRpb25NYXRlcmlhbH1cclxuICAgKi9cclxuICBjcmVhdGVEZXB0aEFuaW1hdGlvbk1hdGVyaWFsOiBmdW5jdGlvbihzb3VyY2VNYXRlcmlhbCkge1xyXG4gICAgcmV0dXJuIG5ldyBEZXB0aEFuaW1hdGlvbk1hdGVyaWFsKHtcclxuICAgICAgdW5pZm9ybXM6IHNvdXJjZU1hdGVyaWFsLnVuaWZvcm1zLFxyXG4gICAgICBkZWZpbmVzOiBzb3VyY2VNYXRlcmlhbC5kZWZpbmVzLFxyXG4gICAgICB2ZXJ0ZXhGdW5jdGlvbnM6IHNvdXJjZU1hdGVyaWFsLnZlcnRleEZ1bmN0aW9ucyxcclxuICAgICAgdmVydGV4UGFyYW1ldGVyczogc291cmNlTWF0ZXJpYWwudmVydGV4UGFyYW1ldGVycyxcclxuICAgICAgdmVydGV4SW5pdDogc291cmNlTWF0ZXJpYWwudmVydGV4SW5pdCxcclxuICAgICAgdmVydGV4UG9zaXRpb246IHNvdXJjZU1hdGVyaWFsLnZlcnRleFBvc2l0aW9uXHJcbiAgICB9KTtcclxuICB9LFxyXG5cclxuICAvKipcclxuICAgKiBDcmVhdGUgYSBUSFJFRS5CQVMuRGlzdGFuY2VBbmltYXRpb25NYXRlcmlhbCBmb3Igc2hhZG93cyBmcm9tIGEgVEhSRUUuUG9pbnRMaWdodCBieSBjb3B5aW5nIHJlbGV2YW50IHNoYWRlciBjaHVua3MuXHJcbiAgICogVW5pZm9ybSB2YWx1ZXMgbXVzdCBiZSBtYW51YWxseSBzeW5jZWQgYmV0d2VlbiB0aGUgc291cmNlIG1hdGVyaWFsIGFuZCB0aGUgZGlzdGFuY2UgbWF0ZXJpYWwuXHJcbiAgICpcclxuICAgKiBAc2VlIHtAbGluayBodHRwOi8vdGhyZWUtYmFzLWV4YW1wbGVzLnN1cmdlLnNoL2V4YW1wbGVzL3NoYWRvd3MvfVxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtUSFJFRS5CQVMuQmFzZUFuaW1hdGlvbk1hdGVyaWFsfSBzb3VyY2VNYXRlcmlhbCBJbnN0YW5jZSB0byBnZXQgdGhlIHNoYWRlciBjaHVua3MgZnJvbS5cclxuICAgKiBAcmV0dXJucyB7VEhSRUUuQkFTLkRpc3RhbmNlQW5pbWF0aW9uTWF0ZXJpYWx9XHJcbiAgICovXHJcbiAgY3JlYXRlRGlzdGFuY2VBbmltYXRpb25NYXRlcmlhbDogZnVuY3Rpb24oc291cmNlTWF0ZXJpYWwpIHtcclxuICAgIHJldHVybiBuZXcgRGlzdGFuY2VBbmltYXRpb25NYXRlcmlhbCh7XHJcbiAgICAgIHVuaWZvcm1zOiBzb3VyY2VNYXRlcmlhbC51bmlmb3JtcyxcclxuICAgICAgZGVmaW5lczogc291cmNlTWF0ZXJpYWwuZGVmaW5lcyxcclxuICAgICAgdmVydGV4RnVuY3Rpb25zOiBzb3VyY2VNYXRlcmlhbC52ZXJ0ZXhGdW5jdGlvbnMsXHJcbiAgICAgIHZlcnRleFBhcmFtZXRlcnM6IHNvdXJjZU1hdGVyaWFsLnZlcnRleFBhcmFtZXRlcnMsXHJcbiAgICAgIHZlcnRleEluaXQ6IHNvdXJjZU1hdGVyaWFsLnZlcnRleEluaXQsXHJcbiAgICAgIHZlcnRleFBvc2l0aW9uOiBzb3VyY2VNYXRlcmlhbC52ZXJ0ZXhQb3NpdGlvblxyXG4gICAgfSk7XHJcbiAgfVxyXG59O1xyXG5cclxuZXhwb3J0IHsgVXRpbHMgfTtcclxuIiwiaW1wb3J0IHsgQnVmZmVyR2VvbWV0cnksIEJ1ZmZlckF0dHJpYnV0ZSB9IGZyb20gJ3RocmVlJztcclxuaW1wb3J0IHsgVXRpbHMgfSBmcm9tICcuLi9VdGlscyc7XHJcblxyXG4vKipcclxuICogQSBUSFJFRS5CdWZmZXJHZW9tZXRyeSBmb3IgYW5pbWF0aW5nIGluZGl2aWR1YWwgZmFjZXMgb2YgYSBUSFJFRS5HZW9tZXRyeS5cclxuICpcclxuICogQHBhcmFtIHtUSFJFRS5HZW9tZXRyeX0gbW9kZWwgVGhlIFRIUkVFLkdlb21ldHJ5IHRvIGJhc2UgdGhpcyBnZW9tZXRyeSBvbi5cclxuICogQHBhcmFtIHtPYmplY3Q9fSBvcHRpb25zXHJcbiAqIEBwYXJhbSB7Qm9vbGVhbj19IG9wdGlvbnMuY29tcHV0ZUNlbnRyb2lkcyBJZiB0cnVlLCBhIGNlbnRyb2lkcyB3aWxsIGJlIGNvbXB1dGVkIGZvciBlYWNoIGZhY2UgYW5kIHN0b3JlZCBpbiBUSFJFRS5CQVMuTW9kZWxCdWZmZXJHZW9tZXRyeS5jZW50cm9pZHMuXHJcbiAqIEBwYXJhbSB7Qm9vbGVhbj19IG9wdGlvbnMubG9jYWxpemVGYWNlcyBJZiB0cnVlLCB0aGUgcG9zaXRpb25zIGZvciBlYWNoIGZhY2Ugd2lsbCBiZSBzdG9yZWQgcmVsYXRpdmUgdG8gdGhlIGNlbnRyb2lkLiBUaGlzIGlzIHVzZWZ1bCBpZiB5b3Ugd2FudCB0byByb3RhdGUgb3Igc2NhbGUgZmFjZXMgYXJvdW5kIHRoZWlyIGNlbnRlci5cclxuICogQGNvbnN0cnVjdG9yXHJcbiAqL1xyXG5mdW5jdGlvbiBNb2RlbEJ1ZmZlckdlb21ldHJ5KG1vZGVsLCBvcHRpb25zKSB7XHJcbiAgQnVmZmVyR2VvbWV0cnkuY2FsbCh0aGlzKTtcclxuXHJcbiAgLyoqXHJcbiAgICogQSByZWZlcmVuY2UgdG8gdGhlIGdlb21ldHJ5IHVzZWQgdG8gY3JlYXRlIHRoaXMgaW5zdGFuY2UuXHJcbiAgICogQHR5cGUge1RIUkVFLkdlb21ldHJ5fVxyXG4gICAqL1xyXG4gIHRoaXMubW9kZWxHZW9tZXRyeSA9IG1vZGVsO1xyXG5cclxuICAvKipcclxuICAgKiBOdW1iZXIgb2YgZmFjZXMgb2YgdGhlIG1vZGVsLlxyXG4gICAqIEB0eXBlIHtOdW1iZXJ9XHJcbiAgICovXHJcbiAgdGhpcy5mYWNlQ291bnQgPSB0aGlzLm1vZGVsR2VvbWV0cnkuZmFjZXMubGVuZ3RoO1xyXG5cclxuICAvKipcclxuICAgKiBOdW1iZXIgb2YgdmVydGljZXMgb2YgdGhlIG1vZGVsLlxyXG4gICAqIEB0eXBlIHtOdW1iZXJ9XHJcbiAgICovXHJcbiAgdGhpcy52ZXJ0ZXhDb3VudCA9IHRoaXMubW9kZWxHZW9tZXRyeS52ZXJ0aWNlcy5sZW5ndGg7XHJcblxyXG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xyXG4gIG9wdGlvbnMuY29tcHV0ZUNlbnRyb2lkcyAmJiB0aGlzLmNvbXB1dGVDZW50cm9pZHMoKTtcclxuXHJcbiAgdGhpcy5idWZmZXJJbmRpY2VzKCk7XHJcbiAgdGhpcy5idWZmZXJQb3NpdGlvbnMob3B0aW9ucy5sb2NhbGl6ZUZhY2VzKTtcclxufVxyXG5Nb2RlbEJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlKTtcclxuTW9kZWxCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBNb2RlbEJ1ZmZlckdlb21ldHJ5O1xyXG5cclxuLyoqXHJcbiAqIENvbXB1dGVzIGEgY2VudHJvaWQgZm9yIGVhY2ggZmFjZSBhbmQgc3RvcmVzIGl0IGluIFRIUkVFLkJBUy5Nb2RlbEJ1ZmZlckdlb21ldHJ5LmNlbnRyb2lkcy5cclxuICovXHJcbk1vZGVsQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmNvbXB1dGVDZW50cm9pZHMgPSBmdW5jdGlvbigpIHtcclxuICAvKipcclxuICAgKiBBbiBhcnJheSBvZiBjZW50cm9pZHMgY29ycmVzcG9uZGluZyB0byB0aGUgZmFjZXMgb2YgdGhlIG1vZGVsLlxyXG4gICAqXHJcbiAgICogQHR5cGUge0FycmF5fVxyXG4gICAqL1xyXG4gIHRoaXMuY2VudHJvaWRzID0gW107XHJcblxyXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5mYWNlQ291bnQ7IGkrKykge1xyXG4gICAgdGhpcy5jZW50cm9pZHNbaV0gPSBVdGlscy5jb21wdXRlQ2VudHJvaWQodGhpcy5tb2RlbEdlb21ldHJ5LCB0aGlzLm1vZGVsR2VvbWV0cnkuZmFjZXNbaV0pO1xyXG4gIH1cclxufTtcclxuXHJcbk1vZGVsQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmJ1ZmZlckluZGljZXMgPSBmdW5jdGlvbigpIHtcclxuICBjb25zdCBpbmRleEJ1ZmZlciA9IG5ldyBVaW50MzJBcnJheSh0aGlzLmZhY2VDb3VudCAqIDMpO1xyXG5cclxuICB0aGlzLnNldEluZGV4KG5ldyBCdWZmZXJBdHRyaWJ1dGUoaW5kZXhCdWZmZXIsIDEpKTtcclxuXHJcbiAgZm9yIChsZXQgaSA9IDAsIG9mZnNldCA9IDA7IGkgPCB0aGlzLmZhY2VDb3VudDsgaSsrLCBvZmZzZXQgKz0gMykge1xyXG4gICAgY29uc3QgZmFjZSA9IHRoaXMubW9kZWxHZW9tZXRyeS5mYWNlc1tpXTtcclxuXHJcbiAgICBpbmRleEJ1ZmZlcltvZmZzZXQgICAgXSA9IGZhY2UuYTtcclxuICAgIGluZGV4QnVmZmVyW29mZnNldCArIDFdID0gZmFjZS5iO1xyXG4gICAgaW5kZXhCdWZmZXJbb2Zmc2V0ICsgMl0gPSBmYWNlLmM7XHJcbiAgfVxyXG59O1xyXG5cclxuTW9kZWxCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuYnVmZmVyUG9zaXRpb25zID0gZnVuY3Rpb24obG9jYWxpemVGYWNlcykge1xyXG4gIGNvbnN0IHBvc2l0aW9uQnVmZmVyID0gdGhpcy5jcmVhdGVBdHRyaWJ1dGUoJ3Bvc2l0aW9uJywgMykuYXJyYXk7XHJcbiAgbGV0IGksIG9mZnNldDtcclxuXHJcbiAgaWYgKGxvY2FsaXplRmFjZXMgPT09IHRydWUpIHtcclxuICAgIGZvciAoaSA9IDA7IGkgPCB0aGlzLmZhY2VDb3VudDsgaSsrKSB7XHJcbiAgICAgIGNvbnN0IGZhY2UgPSB0aGlzLm1vZGVsR2VvbWV0cnkuZmFjZXNbaV07XHJcbiAgICAgIGNvbnN0IGNlbnRyb2lkID0gdGhpcy5jZW50cm9pZHMgPyB0aGlzLmNlbnRyb2lkc1tpXSA6IFRIUkVFLkJBUy5VdGlscy5jb21wdXRlQ2VudHJvaWQodGhpcy5tb2RlbEdlb21ldHJ5LCBmYWNlKTtcclxuXHJcbiAgICAgIGNvbnN0IGEgPSB0aGlzLm1vZGVsR2VvbWV0cnkudmVydGljZXNbZmFjZS5hXTtcclxuICAgICAgY29uc3QgYiA9IHRoaXMubW9kZWxHZW9tZXRyeS52ZXJ0aWNlc1tmYWNlLmJdO1xyXG4gICAgICBjb25zdCBjID0gdGhpcy5tb2RlbEdlb21ldHJ5LnZlcnRpY2VzW2ZhY2UuY107XHJcblxyXG4gICAgICBwb3NpdGlvbkJ1ZmZlcltmYWNlLmEgKiAzXSAgICAgPSBhLnggLSBjZW50cm9pZC54O1xyXG4gICAgICBwb3NpdGlvbkJ1ZmZlcltmYWNlLmEgKiAzICsgMV0gPSBhLnkgLSBjZW50cm9pZC55O1xyXG4gICAgICBwb3NpdGlvbkJ1ZmZlcltmYWNlLmEgKiAzICsgMl0gPSBhLnogLSBjZW50cm9pZC56O1xyXG5cclxuICAgICAgcG9zaXRpb25CdWZmZXJbZmFjZS5iICogM10gICAgID0gYi54IC0gY2VudHJvaWQueDtcclxuICAgICAgcG9zaXRpb25CdWZmZXJbZmFjZS5iICogMyArIDFdID0gYi55IC0gY2VudHJvaWQueTtcclxuICAgICAgcG9zaXRpb25CdWZmZXJbZmFjZS5iICogMyArIDJdID0gYi56IC0gY2VudHJvaWQuejtcclxuXHJcbiAgICAgIHBvc2l0aW9uQnVmZmVyW2ZhY2UuYyAqIDNdICAgICA9IGMueCAtIGNlbnRyb2lkLng7XHJcbiAgICAgIHBvc2l0aW9uQnVmZmVyW2ZhY2UuYyAqIDMgKyAxXSA9IGMueSAtIGNlbnRyb2lkLnk7XHJcbiAgICAgIHBvc2l0aW9uQnVmZmVyW2ZhY2UuYyAqIDMgKyAyXSA9IGMueiAtIGNlbnRyb2lkLno7XHJcbiAgICB9XHJcbiAgfVxyXG4gIGVsc2Uge1xyXG4gICAgZm9yIChpID0gMCwgb2Zmc2V0ID0gMDsgaSA8IHRoaXMudmVydGV4Q291bnQ7IGkrKywgb2Zmc2V0ICs9IDMpIHtcclxuICAgICAgY29uc3QgdmVydGV4ID0gdGhpcy5tb2RlbEdlb21ldHJ5LnZlcnRpY2VzW2ldO1xyXG5cclxuICAgICAgcG9zaXRpb25CdWZmZXJbb2Zmc2V0ICAgIF0gPSB2ZXJ0ZXgueDtcclxuICAgICAgcG9zaXRpb25CdWZmZXJbb2Zmc2V0ICsgMV0gPSB2ZXJ0ZXgueTtcclxuICAgICAgcG9zaXRpb25CdWZmZXJbb2Zmc2V0ICsgMl0gPSB2ZXJ0ZXguejtcclxuICAgIH1cclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogQ3JlYXRlcyBhIFRIUkVFLkJ1ZmZlckF0dHJpYnV0ZSB3aXRoIFVWIGNvb3JkaW5hdGVzLlxyXG4gKi9cclxuTW9kZWxCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuYnVmZmVyVVZzID0gZnVuY3Rpb24oKSB7XHJcbiAgY29uc3QgdXZCdWZmZXIgPSB0aGlzLmNyZWF0ZUF0dHJpYnV0ZSgndXYnLCAyKS5hcnJheTtcclxuXHJcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmZhY2VDb3VudDsgaSsrKSB7XHJcblxyXG4gICAgY29uc3QgZmFjZSA9IHRoaXMubW9kZWxHZW9tZXRyeS5mYWNlc1tpXTtcclxuICAgIGxldCB1djtcclxuXHJcbiAgICB1diA9IHRoaXMubW9kZWxHZW9tZXRyeS5mYWNlVmVydGV4VXZzWzBdW2ldWzBdO1xyXG4gICAgdXZCdWZmZXJbZmFjZS5hICogMl0gICAgID0gdXYueDtcclxuICAgIHV2QnVmZmVyW2ZhY2UuYSAqIDIgKyAxXSA9IHV2Lnk7XHJcblxyXG4gICAgdXYgPSB0aGlzLm1vZGVsR2VvbWV0cnkuZmFjZVZlcnRleFV2c1swXVtpXVsxXTtcclxuICAgIHV2QnVmZmVyW2ZhY2UuYiAqIDJdICAgICA9IHV2Lng7XHJcbiAgICB1dkJ1ZmZlcltmYWNlLmIgKiAyICsgMV0gPSB1di55O1xyXG5cclxuICAgIHV2ID0gdGhpcy5tb2RlbEdlb21ldHJ5LmZhY2VWZXJ0ZXhVdnNbMF1baV1bMl07XHJcbiAgICB1dkJ1ZmZlcltmYWNlLmMgKiAyXSAgICAgPSB1di54O1xyXG4gICAgdXZCdWZmZXJbZmFjZS5jICogMiArIDFdID0gdXYueTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogQ3JlYXRlcyBhIFRIUkVFLkJ1ZmZlckF0dHJpYnV0ZSBvbiB0aGlzIGdlb21ldHJ5IGluc3RhbmNlLlxyXG4gKlxyXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZSBOYW1lIG9mIHRoZSBhdHRyaWJ1dGUuXHJcbiAqIEBwYXJhbSB7aW50fSBpdGVtU2l6ZSBOdW1iZXIgb2YgZmxvYXRzIHBlciB2ZXJ0ZXggKHR5cGljYWxseSAxLCAyLCAzIG9yIDQpLlxyXG4gKiBAcGFyYW0ge2Z1bmN0aW9uPX0gZmFjdG9yeSBGdW5jdGlvbiB0aGF0IHdpbGwgYmUgY2FsbGVkIGZvciBlYWNoIGZhY2UgdXBvbiBjcmVhdGlvbi4gQWNjZXB0cyAzIGFyZ3VtZW50czogZGF0YVtdLCBpbmRleCBhbmQgZmFjZUNvdW50LiBDYWxscyBzZXRGYWNlRGF0YS5cclxuICpcclxuICogQHJldHVybnMge1RIUkVFLkJ1ZmZlckF0dHJpYnV0ZX1cclxuICovXHJcbk1vZGVsQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmNyZWF0ZUF0dHJpYnV0ZSA9IGZ1bmN0aW9uKG5hbWUsIGl0ZW1TaXplLCBmYWN0b3J5KSB7XHJcbiAgY29uc3QgYnVmZmVyID0gbmV3IEZsb2F0MzJBcnJheSh0aGlzLnZlcnRleENvdW50ICogaXRlbVNpemUpO1xyXG4gIGNvbnN0IGF0dHJpYnV0ZSA9IG5ldyBUSFJFRS5CdWZmZXJBdHRyaWJ1dGUoYnVmZmVyLCBpdGVtU2l6ZSk7XHJcblxyXG4gIHRoaXMuYWRkQXR0cmlidXRlKG5hbWUsIGF0dHJpYnV0ZSk7XHJcblxyXG4gIGlmIChmYWN0b3J5KSB7XHJcbiAgICBjb25zdCBkYXRhID0gW107XHJcblxyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmZhY2VDb3VudDsgaSsrKSB7XHJcbiAgICAgIGZhY3RvcnkoZGF0YSwgaSwgdGhpcy5mYWNlQ291bnQpO1xyXG4gICAgICB0aGlzLnNldEZhY2VEYXRhKGF0dHJpYnV0ZSwgaSwgZGF0YSk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICByZXR1cm4gYXR0cmlidXRlO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFNldHMgZGF0YSBmb3IgYWxsIHZlcnRpY2VzIG9mIGEgZmFjZSBhdCBhIGdpdmVuIGluZGV4LlxyXG4gKiBVc3VhbGx5IGNhbGxlZCBpbiBhIGxvb3AuXHJcbiAqXHJcbiAqIEBwYXJhbSB7U3RyaW5nfFRIUkVFLkJ1ZmZlckF0dHJpYnV0ZX0gYXR0cmlidXRlIFRoZSBhdHRyaWJ1dGUgb3IgYXR0cmlidXRlIG5hbWUgd2hlcmUgdGhlIGRhdGEgaXMgdG8gYmUgc3RvcmVkLlxyXG4gKiBAcGFyYW0ge2ludH0gZmFjZUluZGV4IEluZGV4IG9mIHRoZSBmYWNlIGluIHRoZSBidWZmZXIgZ2VvbWV0cnkuXHJcbiAqIEBwYXJhbSB7QXJyYXl9IGRhdGEgQXJyYXkgb2YgZGF0YS4gTGVuZ3RoIHNob3VsZCBiZSBlcXVhbCB0byBpdGVtIHNpemUgb2YgdGhlIGF0dHJpYnV0ZS5cclxuICovXHJcbk1vZGVsQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLnNldEZhY2VEYXRhID0gZnVuY3Rpb24oYXR0cmlidXRlLCBmYWNlSW5kZXgsIGRhdGEpIHtcclxuICBhdHRyaWJ1dGUgPSAodHlwZW9mIGF0dHJpYnV0ZSA9PT0gJ3N0cmluZycpID8gdGhpcy5hdHRyaWJ1dGVzW2F0dHJpYnV0ZV0gOiBhdHRyaWJ1dGU7XHJcblxyXG4gIGxldCBvZmZzZXQgPSBmYWNlSW5kZXggKiAzICogYXR0cmlidXRlLml0ZW1TaXplO1xyXG5cclxuICBmb3IgKGxldCBpID0gMDsgaSA8IDM7IGkrKykge1xyXG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCBhdHRyaWJ1dGUuaXRlbVNpemU7IGorKykge1xyXG4gICAgICBhdHRyaWJ1dGUuYXJyYXlbb2Zmc2V0KytdID0gZGF0YVtqXTtcclxuICAgIH1cclxuICB9XHJcbn07XHJcblxyXG5leHBvcnQgeyBNb2RlbEJ1ZmZlckdlb21ldHJ5IH07XHJcbiIsImltcG9ydCB7IEJ1ZmZlckdlb21ldHJ5LCBCdWZmZXJBdHRyaWJ1dGUgfSBmcm9tICd0aHJlZSc7XHJcblxyXG4vKipcclxuICogQSBUSFJFRS5CdWZmZXJHZW9tZXRyeSBjb25zaXN0cyBvZiBwb2ludHMuXHJcbiAqIEBwYXJhbSB7TnVtYmVyfSBjb3VudCBUaGUgbnVtYmVyIG9mIHBvaW50cy5cclxuICogQGNvbnN0cnVjdG9yXHJcbiAqL1xyXG5mdW5jdGlvbiBQb2ludEJ1ZmZlckdlb21ldHJ5KGNvdW50KSB7XHJcbiAgQnVmZmVyR2VvbWV0cnkuY2FsbCh0aGlzKTtcclxuXHJcbiAgLyoqXHJcbiAgICogTnVtYmVyIG9mIHBvaW50cy5cclxuICAgKiBAdHlwZSB7TnVtYmVyfVxyXG4gICAqL1xyXG4gIHRoaXMucG9pbnRDb3VudCA9IGNvdW50O1xyXG5cclxuICB0aGlzLmJ1ZmZlclBvc2l0aW9ucygpO1xyXG59XHJcblBvaW50QnVmZmVyR2VvbWV0cnkucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUpO1xyXG5Qb2ludEJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFBvaW50QnVmZmVyR2VvbWV0cnk7XHJcblxyXG5Qb2ludEJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5idWZmZXJQb3NpdGlvbnMgPSBmdW5jdGlvbigpIHtcclxuICB0aGlzLmNyZWF0ZUF0dHJpYnV0ZSgncG9zaXRpb24nLCAzKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIGEgVEhSRUUuQnVmZmVyQXR0cmlidXRlIG9uIHRoaXMgZ2VvbWV0cnkgaW5zdGFuY2UuXHJcbiAqXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIE5hbWUgb2YgdGhlIGF0dHJpYnV0ZS5cclxuICogQHBhcmFtIHtOdW1iZXJ9IGl0ZW1TaXplIE51bWJlciBvZiBmbG9hdHMgcGVyIHZlcnRleCAodHlwaWNhbGx5IDEsIDIsIDMgb3IgNCkuXHJcbiAqIEBwYXJhbSB7ZnVuY3Rpb249fSBmYWN0b3J5IEZ1bmN0aW9uIHRoYXQgd2lsbCBiZSBjYWxsZWQgZm9yIGVhY2ggcG9pbnQgdXBvbiBjcmVhdGlvbi4gQWNjZXB0cyAzIGFyZ3VtZW50czogZGF0YVtdLCBpbmRleCBhbmQgcHJlZmFiQ291bnQuIENhbGxzIHNldFByZWZhYkRhdGEuXHJcbiAqXHJcbiAqIEByZXR1cm5zIHtUSFJFRS5CdWZmZXJBdHRyaWJ1dGV9XHJcbiAqL1xyXG5Qb2ludEJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5jcmVhdGVBdHRyaWJ1dGUgPSBmdW5jdGlvbihuYW1lLCBpdGVtU2l6ZSwgZmFjdG9yeSkge1xyXG4gIGNvbnN0IGJ1ZmZlciA9IG5ldyBGbG9hdDMyQXJyYXkodGhpcy5wb2ludENvdW50ICogaXRlbVNpemUpO1xyXG4gIGNvbnN0IGF0dHJpYnV0ZSA9IG5ldyBCdWZmZXJBdHRyaWJ1dGUoYnVmZmVyLCBpdGVtU2l6ZSk7XHJcblxyXG4gIHRoaXMuYWRkQXR0cmlidXRlKG5hbWUsIGF0dHJpYnV0ZSk7XHJcblxyXG4gIGlmIChmYWN0b3J5KSB7XHJcbiAgICBjb25zdCBkYXRhID0gW107XHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucG9pbnRDb3VudDsgaSsrKSB7XHJcbiAgICAgIGZhY3RvcnkoZGF0YSwgaSwgdGhpcy5wb2ludENvdW50KTtcclxuICAgICAgdGhpcy5zZXRQb2ludERhdGEoYXR0cmlidXRlLCBpLCBkYXRhKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHJldHVybiBhdHRyaWJ1dGU7XHJcbn07XHJcblxyXG5Qb2ludEJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5zZXRQb2ludERhdGEgPSBmdW5jdGlvbihhdHRyaWJ1dGUsIHBvaW50SW5kZXgsIGRhdGEpIHtcclxuICBhdHRyaWJ1dGUgPSAodHlwZW9mIGF0dHJpYnV0ZSA9PT0gJ3N0cmluZycpID8gdGhpcy5hdHRyaWJ1dGVzW2F0dHJpYnV0ZV0gOiBhdHRyaWJ1dGU7XHJcblxyXG4gIGxldCBvZmZzZXQgPSBwb2ludEluZGV4ICogYXR0cmlidXRlLml0ZW1TaXplO1xyXG5cclxuICBmb3IgKGxldCBqID0gMDsgaiA8IGF0dHJpYnV0ZS5pdGVtU2l6ZTsgaisrKSB7XHJcbiAgICBhdHRyaWJ1dGUuYXJyYXlbb2Zmc2V0KytdID0gZGF0YVtqXTtcclxuICB9XHJcbn07XHJcblxyXG5leHBvcnQgeyBQb2ludEJ1ZmZlckdlb21ldHJ5IH07XHJcbiIsIi8vIGdlbmVyYXRlZCBieSBzY3JpcHRzL2J1aWxkX3NoYWRlcl9jaHVua3MuanNcclxuXHJcbmltcG9ydCBjYXRtdWxsX3JvbV9zcGxpbmUgZnJvbSAnLi9nbHNsL2NhdG11bGxfcm9tX3NwbGluZS5nbHNsJztcclxuaW1wb3J0IGN1YmljX2JlemllciBmcm9tICcuL2dsc2wvY3ViaWNfYmV6aWVyLmdsc2wnO1xyXG5pbXBvcnQgZWFzZV9iYWNrX2luIGZyb20gJy4vZ2xzbC9lYXNlX2JhY2tfaW4uZ2xzbCc7XHJcbmltcG9ydCBlYXNlX2JhY2tfaW5fb3V0IGZyb20gJy4vZ2xzbC9lYXNlX2JhY2tfaW5fb3V0Lmdsc2wnO1xyXG5pbXBvcnQgZWFzZV9iYWNrX291dCBmcm9tICcuL2dsc2wvZWFzZV9iYWNrX291dC5nbHNsJztcclxuaW1wb3J0IGVhc2VfYmV6aWVyIGZyb20gJy4vZ2xzbC9lYXNlX2Jlemllci5nbHNsJztcclxuaW1wb3J0IGVhc2VfYm91bmNlX2luIGZyb20gJy4vZ2xzbC9lYXNlX2JvdW5jZV9pbi5nbHNsJztcclxuaW1wb3J0IGVhc2VfYm91bmNlX2luX291dCBmcm9tICcuL2dsc2wvZWFzZV9ib3VuY2VfaW5fb3V0Lmdsc2wnO1xyXG5pbXBvcnQgZWFzZV9ib3VuY2Vfb3V0IGZyb20gJy4vZ2xzbC9lYXNlX2JvdW5jZV9vdXQuZ2xzbCc7XHJcbmltcG9ydCBlYXNlX2NpcmNfaW4gZnJvbSAnLi9nbHNsL2Vhc2VfY2lyY19pbi5nbHNsJztcclxuaW1wb3J0IGVhc2VfY2lyY19pbl9vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfY2lyY19pbl9vdXQuZ2xzbCc7XHJcbmltcG9ydCBlYXNlX2NpcmNfb3V0IGZyb20gJy4vZ2xzbC9lYXNlX2NpcmNfb3V0Lmdsc2wnO1xyXG5pbXBvcnQgZWFzZV9jdWJpY19pbiBmcm9tICcuL2dsc2wvZWFzZV9jdWJpY19pbi5nbHNsJztcclxuaW1wb3J0IGVhc2VfY3ViaWNfaW5fb3V0IGZyb20gJy4vZ2xzbC9lYXNlX2N1YmljX2luX291dC5nbHNsJztcclxuaW1wb3J0IGVhc2VfY3ViaWNfb3V0IGZyb20gJy4vZ2xzbC9lYXNlX2N1YmljX291dC5nbHNsJztcclxuaW1wb3J0IGVhc2VfZWxhc3RpY19pbiBmcm9tICcuL2dsc2wvZWFzZV9lbGFzdGljX2luLmdsc2wnO1xyXG5pbXBvcnQgZWFzZV9lbGFzdGljX2luX291dCBmcm9tICcuL2dsc2wvZWFzZV9lbGFzdGljX2luX291dC5nbHNsJztcclxuaW1wb3J0IGVhc2VfZWxhc3RpY19vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfZWxhc3RpY19vdXQuZ2xzbCc7XHJcbmltcG9ydCBlYXNlX2V4cG9faW4gZnJvbSAnLi9nbHNsL2Vhc2VfZXhwb19pbi5nbHNsJztcclxuaW1wb3J0IGVhc2VfZXhwb19pbl9vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfZXhwb19pbl9vdXQuZ2xzbCc7XHJcbmltcG9ydCBlYXNlX2V4cG9fb3V0IGZyb20gJy4vZ2xzbC9lYXNlX2V4cG9fb3V0Lmdsc2wnO1xyXG5pbXBvcnQgZWFzZV9xdWFkX2luIGZyb20gJy4vZ2xzbC9lYXNlX3F1YWRfaW4uZ2xzbCc7XHJcbmltcG9ydCBlYXNlX3F1YWRfaW5fb3V0IGZyb20gJy4vZ2xzbC9lYXNlX3F1YWRfaW5fb3V0Lmdsc2wnO1xyXG5pbXBvcnQgZWFzZV9xdWFkX291dCBmcm9tICcuL2dsc2wvZWFzZV9xdWFkX291dC5nbHNsJztcclxuaW1wb3J0IGVhc2VfcXVhcnRfaW4gZnJvbSAnLi9nbHNsL2Vhc2VfcXVhcnRfaW4uZ2xzbCc7XHJcbmltcG9ydCBlYXNlX3F1YXJ0X2luX291dCBmcm9tICcuL2dsc2wvZWFzZV9xdWFydF9pbl9vdXQuZ2xzbCc7XHJcbmltcG9ydCBlYXNlX3F1YXJ0X291dCBmcm9tICcuL2dsc2wvZWFzZV9xdWFydF9vdXQuZ2xzbCc7XHJcbmltcG9ydCBlYXNlX3F1aW50X2luIGZyb20gJy4vZ2xzbC9lYXNlX3F1aW50X2luLmdsc2wnO1xyXG5pbXBvcnQgZWFzZV9xdWludF9pbl9vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfcXVpbnRfaW5fb3V0Lmdsc2wnO1xyXG5pbXBvcnQgZWFzZV9xdWludF9vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfcXVpbnRfb3V0Lmdsc2wnO1xyXG5pbXBvcnQgZWFzZV9zaW5lX2luIGZyb20gJy4vZ2xzbC9lYXNlX3NpbmVfaW4uZ2xzbCc7XHJcbmltcG9ydCBlYXNlX3NpbmVfaW5fb3V0IGZyb20gJy4vZ2xzbC9lYXNlX3NpbmVfaW5fb3V0Lmdsc2wnO1xyXG5pbXBvcnQgZWFzZV9zaW5lX291dCBmcm9tICcuL2dsc2wvZWFzZV9zaW5lX291dC5nbHNsJztcclxuaW1wb3J0IHF1YXRlcm5pb25fcm90YXRpb24gZnJvbSAnLi9nbHNsL3F1YXRlcm5pb25fcm90YXRpb24uZ2xzbCc7XHJcbmltcG9ydCBxdWF0ZXJuaW9uX3NsZXJwIGZyb20gJy4vZ2xzbC9xdWF0ZXJuaW9uX3NsZXJwLmdsc2wnO1xyXG5cclxuXHJcbmV4cG9ydCBjb25zdCBTaGFkZXJDaHVuayA9IHtcclxuICBjYXRtdWxsX3JvbV9zcGxpbmU6IGNhdG11bGxfcm9tX3NwbGluZSxcclxuICBjdWJpY19iZXppZXI6IGN1YmljX2JlemllcixcclxuICBlYXNlX2JhY2tfaW46IGVhc2VfYmFja19pbixcclxuICBlYXNlX2JhY2tfaW5fb3V0OiBlYXNlX2JhY2tfaW5fb3V0LFxyXG4gIGVhc2VfYmFja19vdXQ6IGVhc2VfYmFja19vdXQsXHJcbiAgZWFzZV9iZXppZXI6IGVhc2VfYmV6aWVyLFxyXG4gIGVhc2VfYm91bmNlX2luOiBlYXNlX2JvdW5jZV9pbixcclxuICBlYXNlX2JvdW5jZV9pbl9vdXQ6IGVhc2VfYm91bmNlX2luX291dCxcclxuICBlYXNlX2JvdW5jZV9vdXQ6IGVhc2VfYm91bmNlX291dCxcclxuICBlYXNlX2NpcmNfaW46IGVhc2VfY2lyY19pbixcclxuICBlYXNlX2NpcmNfaW5fb3V0OiBlYXNlX2NpcmNfaW5fb3V0LFxyXG4gIGVhc2VfY2lyY19vdXQ6IGVhc2VfY2lyY19vdXQsXHJcbiAgZWFzZV9jdWJpY19pbjogZWFzZV9jdWJpY19pbixcclxuICBlYXNlX2N1YmljX2luX291dDogZWFzZV9jdWJpY19pbl9vdXQsXHJcbiAgZWFzZV9jdWJpY19vdXQ6IGVhc2VfY3ViaWNfb3V0LFxyXG4gIGVhc2VfZWxhc3RpY19pbjogZWFzZV9lbGFzdGljX2luLFxyXG4gIGVhc2VfZWxhc3RpY19pbl9vdXQ6IGVhc2VfZWxhc3RpY19pbl9vdXQsXHJcbiAgZWFzZV9lbGFzdGljX291dDogZWFzZV9lbGFzdGljX291dCxcclxuICBlYXNlX2V4cG9faW46IGVhc2VfZXhwb19pbixcclxuICBlYXNlX2V4cG9faW5fb3V0OiBlYXNlX2V4cG9faW5fb3V0LFxyXG4gIGVhc2VfZXhwb19vdXQ6IGVhc2VfZXhwb19vdXQsXHJcbiAgZWFzZV9xdWFkX2luOiBlYXNlX3F1YWRfaW4sXHJcbiAgZWFzZV9xdWFkX2luX291dDogZWFzZV9xdWFkX2luX291dCxcclxuICBlYXNlX3F1YWRfb3V0OiBlYXNlX3F1YWRfb3V0LFxyXG4gIGVhc2VfcXVhcnRfaW46IGVhc2VfcXVhcnRfaW4sXHJcbiAgZWFzZV9xdWFydF9pbl9vdXQ6IGVhc2VfcXVhcnRfaW5fb3V0LFxyXG4gIGVhc2VfcXVhcnRfb3V0OiBlYXNlX3F1YXJ0X291dCxcclxuICBlYXNlX3F1aW50X2luOiBlYXNlX3F1aW50X2luLFxyXG4gIGVhc2VfcXVpbnRfaW5fb3V0OiBlYXNlX3F1aW50X2luX291dCxcclxuICBlYXNlX3F1aW50X291dDogZWFzZV9xdWludF9vdXQsXHJcbiAgZWFzZV9zaW5lX2luOiBlYXNlX3NpbmVfaW4sXHJcbiAgZWFzZV9zaW5lX2luX291dDogZWFzZV9zaW5lX2luX291dCxcclxuICBlYXNlX3NpbmVfb3V0OiBlYXNlX3NpbmVfb3V0LFxyXG4gIHF1YXRlcm5pb25fcm90YXRpb246IHF1YXRlcm5pb25fcm90YXRpb24sXHJcbiAgcXVhdGVybmlvbl9zbGVycDogcXVhdGVybmlvbl9zbGVycCxcclxuXHJcbn07XHJcblxyXG4iLCIvKipcclxuICogQSB0aW1lbGluZSB0cmFuc2l0aW9uIHNlZ21lbnQuIEFuIGluc3RhbmNlIG9mIHRoaXMgY2xhc3MgaXMgY3JlYXRlZCBpbnRlcm5hbGx5IHdoZW4gY2FsbGluZyB7QGxpbmsgVEhSRUUuQkFTLlRpbWVsaW5lLmFkZH0sIHNvIHlvdSBzaG91bGQgbm90IHVzZSB0aGlzIGNsYXNzIGRpcmVjdGx5LlxyXG4gKiBUaGUgaW5zdGFuY2UgaXMgYWxzbyBwYXNzZWQgdGhlIHRoZSBjb21waWxlciBmdW5jdGlvbiBpZiB5b3UgcmVnaXN0ZXIgYSB0cmFuc2l0aW9uIHRocm91Z2gge0BsaW5rIFRIUkVFLkJBUy5UaW1lbGluZS5yZWdpc3Rlcn0uIFRoZXJlIHlvdSBjYW4gdXNlIHRoZSBwdWJsaWMgcHJvcGVydGllcyBvZiB0aGUgc2VnbWVudCB0byBjb21waWxlIHRoZSBnbHNsIHN0cmluZy5cclxuICogQHBhcmFtIHtzdHJpbmd9IGtleSBBIHN0cmluZyBrZXkgZ2VuZXJhdGVkIGJ5IHRoZSB0aW1lbGluZSB0byB3aGljaCB0aGlzIHNlZ21lbnQgYmVsb25ncy4gS2V5cyBhcmUgdW5pcXVlLlxyXG4gKiBAcGFyYW0ge251bWJlcn0gc3RhcnQgU3RhcnQgdGltZSBvZiB0aGlzIHNlZ21lbnQgaW4gYSB0aW1lbGluZSBpbiBzZWNvbmRzLlxyXG4gKiBAcGFyYW0ge251bWJlcn0gZHVyYXRpb24gRHVyYXRpb24gb2YgdGhpcyBzZWdtZW50IGluIHNlY29uZHMuXHJcbiAqIEBwYXJhbSB7b2JqZWN0fSB0cmFuc2l0aW9uIE9iamVjdCBkZXNjcmliaW5nIHRoZSB0cmFuc2l0aW9uLlxyXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBjb21waWxlciBBIHJlZmVyZW5jZSB0byB0aGUgY29tcGlsZXIgZnVuY3Rpb24gZnJvbSBhIHRyYW5zaXRpb24gZGVmaW5pdGlvbi5cclxuICogQGNvbnN0cnVjdG9yXHJcbiAqL1xyXG5mdW5jdGlvbiBUaW1lbGluZVNlZ21lbnQoa2V5LCBzdGFydCwgZHVyYXRpb24sIHRyYW5zaXRpb24sIGNvbXBpbGVyKSB7XHJcbiAgdGhpcy5rZXkgPSBrZXk7XHJcbiAgdGhpcy5zdGFydCA9IHN0YXJ0O1xyXG4gIHRoaXMuZHVyYXRpb24gPSBkdXJhdGlvbjtcclxuICB0aGlzLnRyYW5zaXRpb24gPSB0cmFuc2l0aW9uO1xyXG4gIHRoaXMuY29tcGlsZXIgPSBjb21waWxlcjtcclxuXHJcbiAgdGhpcy50cmFpbCA9IDA7XHJcbn1cclxuXHJcblRpbWVsaW5lU2VnbWVudC5wcm90b3R5cGUuY29tcGlsZSA9IGZ1bmN0aW9uKCkge1xyXG4gIHJldHVybiB0aGlzLmNvbXBpbGVyKHRoaXMpO1xyXG59O1xyXG5cclxuT2JqZWN0LmRlZmluZVByb3BlcnR5KFRpbWVsaW5lU2VnbWVudC5wcm90b3R5cGUsICdlbmQnLCB7XHJcbiAgZ2V0OiBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB0aGlzLnN0YXJ0ICsgdGhpcy5kdXJhdGlvbjtcclxuICB9XHJcbn0pO1xyXG5cclxuZXhwb3J0IHsgVGltZWxpbmVTZWdtZW50IH07XHJcbiIsImltcG9ydCB7IFRpbWVsaW5lU2VnbWVudCB9IGZyb20gJy4vVGltZWxpbmVTZWdtZW50JztcclxuXHJcbi8qKlxyXG4gKiBBIHV0aWxpdHkgY2xhc3MgdG8gY3JlYXRlIGFuIGFuaW1hdGlvbiB0aW1lbGluZSB3aGljaCBjYW4gYmUgYmFrZWQgaW50byBhICh2ZXJ0ZXgpIHNoYWRlci5cclxuICogQnkgZGVmYXVsdCB0aGUgdGltZWxpbmUgc3VwcG9ydHMgdHJhbnNsYXRpb24sIHNjYWxlIGFuZCByb3RhdGlvbi4gVGhpcyBjYW4gYmUgZXh0ZW5kZWQgb3Igb3ZlcnJpZGRlbi5cclxuICogQGNvbnN0cnVjdG9yXHJcbiAqL1xyXG5mdW5jdGlvbiBUaW1lbGluZSgpIHtcclxuICAvKipcclxuICAgKiBUaGUgdG90YWwgZHVyYXRpb24gb2YgdGhlIHRpbWVsaW5lIGluIHNlY29uZHMuXHJcbiAgICogQHR5cGUge251bWJlcn1cclxuICAgKi9cclxuICB0aGlzLmR1cmF0aW9uID0gMDtcclxuXHJcbiAgLyoqXHJcbiAgICogVGhlIG5hbWUgb2YgdGhlIHZhbHVlIHRoYXQgc2VnbWVudHMgd2lsbCB1c2UgdG8gcmVhZCB0aGUgdGltZS4gRGVmYXVsdHMgdG8gJ3RUaW1lJy5cclxuICAgKiBAdHlwZSB7c3RyaW5nfVxyXG4gICAqL1xyXG4gIHRoaXMudGltZUtleSA9ICd0VGltZSc7XHJcblxyXG4gIHRoaXMuc2VnbWVudHMgPSB7fTtcclxuICB0aGlzLl9fa2V5ID0gMDtcclxufVxyXG5cclxuLy8gc3RhdGljIGRlZmluaXRpb25zIG1hcFxyXG5UaW1lbGluZS5zZWdtZW50RGVmaW5pdGlvbnMgPSB7fTtcclxuXHJcbi8qKlxyXG4gKiBSZWdpc3RlcnMgYSB0cmFuc2l0aW9uIGRlZmluaXRpb24gZm9yIHVzZSB3aXRoIHtAbGluayBUSFJFRS5CQVMuVGltZWxpbmUuYWRkfS5cclxuICogQHBhcmFtIHtTdHJpbmd9IGtleSBOYW1lIG9mIHRoZSB0cmFuc2l0aW9uLiBEZWZhdWx0cyBpbmNsdWRlICdzY2FsZScsICdyb3RhdGUnIGFuZCAndHJhbnNsYXRlJy5cclxuICogQHBhcmFtIHtPYmplY3R9IGRlZmluaXRpb25cclxuICogQHBhcmFtIHtGdW5jdGlvbn0gZGVmaW5pdGlvbi5jb21waWxlciBBIGZ1bmN0aW9uIHRoYXQgZ2VuZXJhdGVzIGEgZ2xzbCBzdHJpbmcgZm9yIGEgdHJhbnNpdGlvbiBzZWdtZW50LiBBY2NlcHRzIGEgVEhSRUUuQkFTLlRpbWVsaW5lU2VnbWVudCBhcyB0aGUgc29sZSBhcmd1bWVudC5cclxuICogQHBhcmFtIHsqfSBkZWZpbml0aW9uLmRlZmF1bHRGcm9tIFRoZSBpbml0aWFsIHZhbHVlIGZvciBhIHRyYW5zZm9ybS5mcm9tLiBGb3IgZXhhbXBsZSwgdGhlIGRlZmF1bHRGcm9tIGZvciBhIHRyYW5zbGF0aW9uIGlzIFRIUkVFLlZlY3RvcjMoMCwgMCwgMCkuXHJcbiAqIEBzdGF0aWNcclxuICovXHJcblRpbWVsaW5lLnJlZ2lzdGVyID0gZnVuY3Rpb24oa2V5LCBkZWZpbml0aW9uKSB7XHJcbiAgVGltZWxpbmUuc2VnbWVudERlZmluaXRpb25zW2tleV0gPSBkZWZpbml0aW9uO1xyXG4gIFxyXG4gIHJldHVybiBkZWZpbml0aW9uO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEFkZCBhIHRyYW5zaXRpb24gdG8gdGhlIHRpbWVsaW5lLlxyXG4gKiBAcGFyYW0ge251bWJlcn0gZHVyYXRpb24gRHVyYXRpb24gaW4gc2Vjb25kc1xyXG4gKiBAcGFyYW0ge29iamVjdH0gdHJhbnNpdGlvbnMgQW4gb2JqZWN0IGNvbnRhaW5pbmcgb25lIG9yIHNldmVyYWwgdHJhbnNpdGlvbnMuIFRoZSBrZXlzIHNob3VsZCBtYXRjaCB0cmFuc2Zvcm0gZGVmaW5pdGlvbnMuXHJcbiAqIFRoZSB0cmFuc2l0aW9uIG9iamVjdCBmb3IgZWFjaCBrZXkgd2lsbCBiZSBwYXNzZWQgdG8gdGhlIG1hdGNoaW5nIGRlZmluaXRpb24ncyBjb21waWxlci4gSXQgY2FuIGhhdmUgYXJiaXRyYXJ5IHByb3BlcnRpZXMsIGJ1dCB0aGUgVGltZWxpbmUgZXhwZWN0cyBhdCBsZWFzdCBhICd0bycsICdmcm9tJyBhbmQgYW4gb3B0aW9uYWwgJ2Vhc2UnLlxyXG4gKiBAcGFyYW0ge251bWJlcnxzdHJpbmd9IFtwb3NpdGlvbk9mZnNldF0gUG9zaXRpb24gaW4gdGhlIHRpbWVsaW5lLiBEZWZhdWx0cyB0byB0aGUgZW5kIG9mIHRoZSB0aW1lbGluZS4gSWYgYSBudW1iZXIgaXMgcHJvdmlkZWQsIHRoZSB0cmFuc2l0aW9uIHdpbGwgYmUgaW5zZXJ0ZWQgYXQgdGhhdCB0aW1lIGluIHNlY29uZHMuIFN0cmluZ3MgKCcrPXgnIG9yICctPXgnKSBjYW4gYmUgdXNlZCBmb3IgYSB2YWx1ZSByZWxhdGl2ZSB0byB0aGUgZW5kIG9mIHRpbWVsaW5lLlxyXG4gKi9cclxuVGltZWxpbmUucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uKGR1cmF0aW9uLCB0cmFuc2l0aW9ucywgcG9zaXRpb25PZmZzZXQpIHtcclxuICAvLyBzdG9wIHJvbGx1cCBmcm9tIGNvbXBsYWluaW5nIGFib3V0IGV2YWxcclxuICBjb25zdCBfZXZhbCA9IGV2YWw7XHJcbiAgXHJcbiAgbGV0IHN0YXJ0ID0gdGhpcy5kdXJhdGlvbjtcclxuXHJcbiAgaWYgKHBvc2l0aW9uT2Zmc2V0ICE9PSB1bmRlZmluZWQpIHtcclxuICAgIGlmICh0eXBlb2YgcG9zaXRpb25PZmZzZXQgPT09ICdudW1iZXInKSB7XHJcbiAgICAgIHN0YXJ0ID0gcG9zaXRpb25PZmZzZXQ7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICh0eXBlb2YgcG9zaXRpb25PZmZzZXQgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgIF9ldmFsKCdzdGFydCcgKyBwb3NpdGlvbk9mZnNldCk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5kdXJhdGlvbiA9IE1hdGgubWF4KHRoaXMuZHVyYXRpb24sIHN0YXJ0ICsgZHVyYXRpb24pO1xyXG4gIH1cclxuICBlbHNlIHtcclxuICAgIHRoaXMuZHVyYXRpb24gKz0gZHVyYXRpb247XHJcbiAgfVxyXG5cclxuICBsZXQga2V5cyA9IE9iamVjdC5rZXlzKHRyYW5zaXRpb25zKSwga2V5O1xyXG5cclxuICBmb3IgKGxldCBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyBpKyspIHtcclxuICAgIGtleSA9IGtleXNbaV07XHJcblxyXG4gICAgdGhpcy5wcm9jZXNzVHJhbnNpdGlvbihrZXksIHRyYW5zaXRpb25zW2tleV0sIHN0YXJ0LCBkdXJhdGlvbik7XHJcbiAgfVxyXG59O1xyXG5cclxuVGltZWxpbmUucHJvdG90eXBlLnByb2Nlc3NUcmFuc2l0aW9uID0gZnVuY3Rpb24oa2V5LCB0cmFuc2l0aW9uLCBzdGFydCwgZHVyYXRpb24pIHtcclxuICBjb25zdCBkZWZpbml0aW9uID0gVGltZWxpbmUuc2VnbWVudERlZmluaXRpb25zW2tleV07XHJcblxyXG4gIGxldCBzZWdtZW50cyA9IHRoaXMuc2VnbWVudHNba2V5XTtcclxuICBpZiAoIXNlZ21lbnRzKSBzZWdtZW50cyA9IHRoaXMuc2VnbWVudHNba2V5XSA9IFtdO1xyXG5cclxuICBpZiAodHJhbnNpdGlvbi5mcm9tID09PSB1bmRlZmluZWQpIHtcclxuICAgIGlmIChzZWdtZW50cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgdHJhbnNpdGlvbi5mcm9tID0gZGVmaW5pdGlvbi5kZWZhdWx0RnJvbTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICB0cmFuc2l0aW9uLmZyb20gPSBzZWdtZW50c1tzZWdtZW50cy5sZW5ndGggLSAxXS50cmFuc2l0aW9uLnRvO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgc2VnbWVudHMucHVzaChuZXcgVGltZWxpbmVTZWdtZW50KCh0aGlzLl9fa2V5KyspLnRvU3RyaW5nKCksIHN0YXJ0LCBkdXJhdGlvbiwgdHJhbnNpdGlvbiwgZGVmaW5pdGlvbi5jb21waWxlcikpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIENvbXBpbGVzIHRoZSB0aW1lbGluZSBpbnRvIGEgZ2xzbCBzdHJpbmcgYXJyYXkgdGhhdCBjYW4gYmUgaW5qZWN0ZWQgaW50byBhICh2ZXJ0ZXgpIHNoYWRlci5cclxuICogQHJldHVybnMge0FycmF5fVxyXG4gKi9cclxuVGltZWxpbmUucHJvdG90eXBlLmNvbXBpbGUgPSBmdW5jdGlvbigpIHtcclxuICBjb25zdCBjID0gW107XHJcblxyXG4gIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyh0aGlzLnNlZ21lbnRzKTtcclxuICBsZXQgc2VnbWVudHM7XHJcblxyXG4gIGZvciAobGV0IGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7IGkrKykge1xyXG4gICAgc2VnbWVudHMgPSB0aGlzLnNlZ21lbnRzW2tleXNbaV1dO1xyXG5cclxuICAgIHRoaXMuZmlsbEdhcHMoc2VnbWVudHMpO1xyXG5cclxuICAgIHNlZ21lbnRzLmZvckVhY2goZnVuY3Rpb24ocykge1xyXG4gICAgICBjLnB1c2gocy5jb21waWxlKCkpO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gYztcclxufTtcclxuVGltZWxpbmUucHJvdG90eXBlLmZpbGxHYXBzID0gZnVuY3Rpb24oc2VnbWVudHMpIHtcclxuICBpZiAoc2VnbWVudHMubGVuZ3RoID09PSAwKSByZXR1cm47XHJcblxyXG4gIGxldCBzMCwgczE7XHJcblxyXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgc2VnbWVudHMubGVuZ3RoIC0gMTsgaSsrKSB7XHJcbiAgICBzMCA9IHNlZ21lbnRzW2ldO1xyXG4gICAgczEgPSBzZWdtZW50c1tpICsgMV07XHJcblxyXG4gICAgczAudHJhaWwgPSBzMS5zdGFydCAtIHMwLmVuZDtcclxuICB9XHJcblxyXG4gIC8vIHBhZCBsYXN0IHNlZ21lbnQgdW50aWwgZW5kIG9mIHRpbWVsaW5lXHJcbiAgczAgPSBzZWdtZW50c1tzZWdtZW50cy5sZW5ndGggLSAxXTtcclxuICBzMC50cmFpbCA9IHRoaXMuZHVyYXRpb24gLSBzMC5lbmQ7XHJcbn07XHJcblxyXG4vKipcclxuICogR2V0IGEgY29tcGlsZWQgZ2xzbCBzdHJpbmcgd2l0aCBjYWxscyB0byB0cmFuc2Zvcm0gZnVuY3Rpb25zIGZvciBhIGdpdmVuIGtleS5cclxuICogVGhlIG9yZGVyIGluIHdoaWNoIHRoZXNlIHRyYW5zaXRpb25zIGFyZSBhcHBsaWVkIG1hdHRlcnMgYmVjYXVzZSB0aGV5IGFsbCBvcGVyYXRlIG9uIHRoZSBzYW1lIHZhbHVlLlxyXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IEEga2V5IG1hdGNoaW5nIGEgdHJhbnNmb3JtIGRlZmluaXRpb24uXHJcbiAqIEByZXR1cm5zIHtzdHJpbmd9XHJcbiAqL1xyXG5UaW1lbGluZS5wcm90b3R5cGUuZ2V0VHJhbnNmb3JtQ2FsbHMgPSBmdW5jdGlvbihrZXkpIHtcclxuICBsZXQgdCA9IHRoaXMudGltZUtleTtcclxuXHJcbiAgcmV0dXJuIHRoaXMuc2VnbWVudHNba2V5XSA/ICB0aGlzLnNlZ21lbnRzW2tleV0ubWFwKGZ1bmN0aW9uKHMpIHtcclxuICAgIHJldHVybiBgYXBwbHlUcmFuc2Zvcm0ke3Mua2V5fSgke3R9LCB0cmFuc2Zvcm1lZCk7YDtcclxuICB9KS5qb2luKCdcXG4nKSA6ICcnO1xyXG59O1xyXG5cclxuZXhwb3J0IHsgVGltZWxpbmUgfVxyXG4iLCJjb25zdCBUaW1lbGluZUNodW5rcyA9IHtcclxuICB2ZWMzOiBmdW5jdGlvbihuLCB2LCBwKSB7XHJcbiAgICBjb25zdCB4ID0gKHYueCB8fCAwKS50b1ByZWNpc2lvbihwKTtcclxuICAgIGNvbnN0IHkgPSAodi55IHx8IDApLnRvUHJlY2lzaW9uKHApO1xyXG4gICAgY29uc3QgeiA9ICh2LnogfHwgMCkudG9QcmVjaXNpb24ocCk7XHJcblxyXG4gICAgcmV0dXJuIGB2ZWMzICR7bn0gPSB2ZWMzKCR7eH0sICR7eX0sICR7en0pO2A7XHJcbiAgfSxcclxuICB2ZWM0OiBmdW5jdGlvbihuLCB2LCBwKSB7XHJcbiAgICBjb25zdCB4ID0gKHYueCB8fCAwKS50b1ByZWNpc2lvbihwKTtcclxuICAgIGNvbnN0IHkgPSAodi55IHx8IDApLnRvUHJlY2lzaW9uKHApO1xyXG4gICAgY29uc3QgeiA9ICh2LnogfHwgMCkudG9QcmVjaXNpb24ocCk7XHJcbiAgICBjb25zdCB3ID0gKHYudyB8fCAwKS50b1ByZWNpc2lvbihwKTtcclxuICBcclxuICAgIHJldHVybiBgdmVjNCAke259ID0gdmVjNCgke3h9LCAke3l9LCAke3p9LCAke3d9KTtgO1xyXG4gIH0sXHJcbiAgZGVsYXlEdXJhdGlvbjogZnVuY3Rpb24oc2VnbWVudCkge1xyXG4gICAgcmV0dXJuIGBcclxuICAgIGZsb2F0IGNEZWxheSR7c2VnbWVudC5rZXl9ID0gJHtzZWdtZW50LnN0YXJ0LnRvUHJlY2lzaW9uKDQpfTtcclxuICAgIGZsb2F0IGNEdXJhdGlvbiR7c2VnbWVudC5rZXl9ID0gJHtzZWdtZW50LmR1cmF0aW9uLnRvUHJlY2lzaW9uKDQpfTtcclxuICAgIGA7XHJcbiAgfSxcclxuICBwcm9ncmVzczogZnVuY3Rpb24oc2VnbWVudCkge1xyXG4gICAgLy8gemVybyBkdXJhdGlvbiBzZWdtZW50cyBzaG91bGQgYWx3YXlzIHJlbmRlciBjb21wbGV0ZVxyXG4gICAgaWYgKHNlZ21lbnQuZHVyYXRpb24gPT09IDApIHtcclxuICAgICAgcmV0dXJuIGBmbG9hdCBwcm9ncmVzcyA9IDEuMDtgXHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgcmV0dXJuIGBcclxuICAgICAgZmxvYXQgcHJvZ3Jlc3MgPSBjbGFtcCh0aW1lIC0gY0RlbGF5JHtzZWdtZW50LmtleX0sIDAuMCwgY0R1cmF0aW9uJHtzZWdtZW50LmtleX0pIC8gY0R1cmF0aW9uJHtzZWdtZW50LmtleX07XHJcbiAgICAgICR7c2VnbWVudC50cmFuc2l0aW9uLmVhc2UgPyBgcHJvZ3Jlc3MgPSAke3NlZ21lbnQudHJhbnNpdGlvbi5lYXNlfShwcm9ncmVzcyR7KHNlZ21lbnQudHJhbnNpdGlvbi5lYXNlUGFyYW1zID8gYCwgJHtzZWdtZW50LnRyYW5zaXRpb24uZWFzZVBhcmFtcy5tYXAoKHYpID0+IHYudG9QcmVjaXNpb24oNCkpLmpvaW4oYCwgYCl9YCA6IGBgKX0pO2AgOiBgYH1cclxuICAgICAgYDtcclxuICAgIH1cclxuICB9LFxyXG4gIHJlbmRlckNoZWNrOiBmdW5jdGlvbihzZWdtZW50KSB7XHJcbiAgICBjb25zdCBzdGFydFRpbWUgPSBzZWdtZW50LnN0YXJ0LnRvUHJlY2lzaW9uKDQpO1xyXG4gICAgY29uc3QgZW5kVGltZSA9IChzZWdtZW50LmVuZCArIHNlZ21lbnQudHJhaWwpLnRvUHJlY2lzaW9uKDQpO1xyXG5cclxuICAgIHJldHVybiBgaWYgKHRpbWUgPCAke3N0YXJ0VGltZX0gfHwgdGltZSA+ICR7ZW5kVGltZX0pIHJldHVybjtgO1xyXG4gIH1cclxufTtcclxuXHJcbmV4cG9ydCB7IFRpbWVsaW5lQ2h1bmtzIH07XHJcbiIsImltcG9ydCB7IFRpbWVsaW5lIH0gZnJvbSAnLi9UaW1lbGluZSc7XHJcbmltcG9ydCB7IFRpbWVsaW5lQ2h1bmtzIH0gZnJvbSAnLi9UaW1lbGluZUNodW5rcyc7XHJcbmltcG9ydCB7IFZlY3RvcjMgfSBmcm9tICd0aHJlZSc7XHJcblxyXG5jb25zdCBUcmFuc2xhdGlvblNlZ21lbnQgPSB7XHJcbiAgY29tcGlsZXI6IGZ1bmN0aW9uKHNlZ21lbnQpIHtcclxuICAgIHJldHVybiBgXHJcbiAgICAke1RpbWVsaW5lQ2h1bmtzLmRlbGF5RHVyYXRpb24oc2VnbWVudCl9XHJcbiAgICAke1RpbWVsaW5lQ2h1bmtzLnZlYzMoYGNUcmFuc2xhdGVGcm9tJHtzZWdtZW50LmtleX1gLCBzZWdtZW50LnRyYW5zaXRpb24uZnJvbSwgMil9XHJcbiAgICAke1RpbWVsaW5lQ2h1bmtzLnZlYzMoYGNUcmFuc2xhdGVUbyR7c2VnbWVudC5rZXl9YCwgc2VnbWVudC50cmFuc2l0aW9uLnRvLCAyKX1cclxuICAgIFxyXG4gICAgdm9pZCBhcHBseVRyYW5zZm9ybSR7c2VnbWVudC5rZXl9KGZsb2F0IHRpbWUsIGlub3V0IHZlYzMgdikge1xyXG4gICAgXHJcbiAgICAgICR7VGltZWxpbmVDaHVua3MucmVuZGVyQ2hlY2soc2VnbWVudCl9XHJcbiAgICAgICR7VGltZWxpbmVDaHVua3MucHJvZ3Jlc3Moc2VnbWVudCl9XHJcbiAgICBcclxuICAgICAgdiArPSBtaXgoY1RyYW5zbGF0ZUZyb20ke3NlZ21lbnQua2V5fSwgY1RyYW5zbGF0ZVRvJHtzZWdtZW50LmtleX0sIHByb2dyZXNzKTtcclxuICAgIH1cclxuICAgIGA7XHJcbiAgfSxcclxuICBkZWZhdWx0RnJvbTogbmV3IFZlY3RvcjMoMCwgMCwgMClcclxufTtcclxuXHJcblRpbWVsaW5lLnJlZ2lzdGVyKCd0cmFuc2xhdGUnLCBUcmFuc2xhdGlvblNlZ21lbnQpO1xyXG5cclxuZXhwb3J0IHsgVHJhbnNsYXRpb25TZWdtZW50IH07XHJcbiIsImltcG9ydCB7IFRpbWVsaW5lIH0gZnJvbSAnLi9UaW1lbGluZSc7XHJcbmltcG9ydCB7IFRpbWVsaW5lQ2h1bmtzIH0gZnJvbSAnLi9UaW1lbGluZUNodW5rcyc7XHJcbmltcG9ydCB7IFZlY3RvcjMgfSBmcm9tICd0aHJlZSc7XHJcblxyXG5jb25zdCBTY2FsZVNlZ21lbnQgPSB7XHJcbiAgY29tcGlsZXI6IGZ1bmN0aW9uKHNlZ21lbnQpIHtcclxuICAgIGNvbnN0IG9yaWdpbiA9IHNlZ21lbnQudHJhbnNpdGlvbi5vcmlnaW47XHJcbiAgICBcclxuICAgIHJldHVybiBgXHJcbiAgICAke1RpbWVsaW5lQ2h1bmtzLmRlbGF5RHVyYXRpb24oc2VnbWVudCl9XHJcbiAgICAke1RpbWVsaW5lQ2h1bmtzLnZlYzMoYGNTY2FsZUZyb20ke3NlZ21lbnQua2V5fWAsIHNlZ21lbnQudHJhbnNpdGlvbi5mcm9tLCAyKX1cclxuICAgICR7VGltZWxpbmVDaHVua3MudmVjMyhgY1NjYWxlVG8ke3NlZ21lbnQua2V5fWAsIHNlZ21lbnQudHJhbnNpdGlvbi50bywgMil9XHJcbiAgICAke29yaWdpbiA/IFRpbWVsaW5lQ2h1bmtzLnZlYzMoYGNPcmlnaW4ke3NlZ21lbnQua2V5fWAsIG9yaWdpbiwgMikgOiAnJ31cclxuICAgIFxyXG4gICAgdm9pZCBhcHBseVRyYW5zZm9ybSR7c2VnbWVudC5rZXl9KGZsb2F0IHRpbWUsIGlub3V0IHZlYzMgdikge1xyXG4gICAgXHJcbiAgICAgICR7VGltZWxpbmVDaHVua3MucmVuZGVyQ2hlY2soc2VnbWVudCl9XHJcbiAgICAgICR7VGltZWxpbmVDaHVua3MucHJvZ3Jlc3Moc2VnbWVudCl9XHJcbiAgICBcclxuICAgICAgJHtvcmlnaW4gPyBgdiAtPSBjT3JpZ2luJHtzZWdtZW50LmtleX07YCA6ICcnfVxyXG4gICAgICB2ICo9IG1peChjU2NhbGVGcm9tJHtzZWdtZW50LmtleX0sIGNTY2FsZVRvJHtzZWdtZW50LmtleX0sIHByb2dyZXNzKTtcclxuICAgICAgJHtvcmlnaW4gPyBgdiArPSBjT3JpZ2luJHtzZWdtZW50LmtleX07YCA6ICcnfVxyXG4gICAgfVxyXG4gICAgYDtcclxuICB9LFxyXG4gIGRlZmF1bHRGcm9tOiBuZXcgVmVjdG9yMygxLCAxLCAxKVxyXG59O1xyXG5cclxuVGltZWxpbmUucmVnaXN0ZXIoJ3NjYWxlJywgU2NhbGVTZWdtZW50KTtcclxuXHJcbmV4cG9ydCB7IFNjYWxlU2VnbWVudCB9O1xyXG4iLCJpbXBvcnQgeyBUaW1lbGluZSB9IGZyb20gJy4vVGltZWxpbmUnO1xyXG5pbXBvcnQgeyBUaW1lbGluZUNodW5rcyB9IGZyb20gJy4vVGltZWxpbmVDaHVua3MnO1xyXG5pbXBvcnQgeyBWZWN0b3IzLCBWZWN0b3I0IH0gZnJvbSAndGhyZWUnO1xyXG5cclxuY29uc3QgUm90YXRpb25TZWdtZW50ID0ge1xyXG4gIGNvbXBpbGVyKHNlZ21lbnQpIHtcclxuICAgIGNvbnN0IGZyb21BeGlzQW5nbGUgPSBuZXcgVmVjdG9yNChcclxuICAgICAgc2VnbWVudC50cmFuc2l0aW9uLmZyb20uYXhpcy54LFxyXG4gICAgICBzZWdtZW50LnRyYW5zaXRpb24uZnJvbS5heGlzLnksXHJcbiAgICAgIHNlZ21lbnQudHJhbnNpdGlvbi5mcm9tLmF4aXMueixcclxuICAgICAgc2VnbWVudC50cmFuc2l0aW9uLmZyb20uYW5nbGVcclxuICAgICk7XHJcbiAgXHJcbiAgICBjb25zdCB0b0F4aXMgPSBzZWdtZW50LnRyYW5zaXRpb24udG8uYXhpcyB8fCBzZWdtZW50LnRyYW5zaXRpb24uZnJvbS5heGlzO1xyXG4gICAgY29uc3QgdG9BeGlzQW5nbGUgPSBuZXcgVmVjdG9yNChcclxuICAgICAgdG9BeGlzLngsXHJcbiAgICAgIHRvQXhpcy55LFxyXG4gICAgICB0b0F4aXMueixcclxuICAgICAgc2VnbWVudC50cmFuc2l0aW9uLnRvLmFuZ2xlXHJcbiAgICApO1xyXG4gIFxyXG4gICAgY29uc3Qgb3JpZ2luID0gc2VnbWVudC50cmFuc2l0aW9uLm9yaWdpbjtcclxuICAgIFxyXG4gICAgcmV0dXJuIGBcclxuICAgICR7VGltZWxpbmVDaHVua3MuZGVsYXlEdXJhdGlvbihzZWdtZW50KX1cclxuICAgICR7VGltZWxpbmVDaHVua3MudmVjNChgY1JvdGF0aW9uRnJvbSR7c2VnbWVudC5rZXl9YCwgZnJvbUF4aXNBbmdsZSwgOCl9XHJcbiAgICAke1RpbWVsaW5lQ2h1bmtzLnZlYzQoYGNSb3RhdGlvblRvJHtzZWdtZW50LmtleX1gLCB0b0F4aXNBbmdsZSwgOCl9XHJcbiAgICAke29yaWdpbiA/IFRpbWVsaW5lQ2h1bmtzLnZlYzMoYGNPcmlnaW4ke3NlZ21lbnQua2V5fWAsIG9yaWdpbiwgMikgOiAnJ31cclxuICAgIFxyXG4gICAgdm9pZCBhcHBseVRyYW5zZm9ybSR7c2VnbWVudC5rZXl9KGZsb2F0IHRpbWUsIGlub3V0IHZlYzMgdikge1xyXG4gICAgICAke1RpbWVsaW5lQ2h1bmtzLnJlbmRlckNoZWNrKHNlZ21lbnQpfVxyXG4gICAgICAke1RpbWVsaW5lQ2h1bmtzLnByb2dyZXNzKHNlZ21lbnQpfVxyXG5cclxuICAgICAgJHtvcmlnaW4gPyBgdiAtPSBjT3JpZ2luJHtzZWdtZW50LmtleX07YCA6ICcnfVxyXG4gICAgICB2ZWMzIGF4aXMgPSBub3JtYWxpemUobWl4KGNSb3RhdGlvbkZyb20ke3NlZ21lbnQua2V5fS54eXosIGNSb3RhdGlvblRvJHtzZWdtZW50LmtleX0ueHl6LCBwcm9ncmVzcykpO1xyXG4gICAgICBmbG9hdCBhbmdsZSA9IG1peChjUm90YXRpb25Gcm9tJHtzZWdtZW50LmtleX0udywgY1JvdGF0aW9uVG8ke3NlZ21lbnQua2V5fS53LCBwcm9ncmVzcyk7XHJcbiAgICAgIHZlYzQgcSA9IHF1YXRGcm9tQXhpc0FuZ2xlKGF4aXMsIGFuZ2xlKTtcclxuICAgICAgdiA9IHJvdGF0ZVZlY3RvcihxLCB2KTtcclxuICAgICAgJHtvcmlnaW4gPyBgdiArPSBjT3JpZ2luJHtzZWdtZW50LmtleX07YCA6ICcnfVxyXG4gICAgfVxyXG4gICAgYDtcclxuICB9LFxyXG4gIGRlZmF1bHRGcm9tOiB7YXhpczogbmV3IFZlY3RvcjMoKSwgYW5nbGU6IDB9XHJcbn07XHJcblxyXG5UaW1lbGluZS5yZWdpc3Rlcigncm90YXRlJywgUm90YXRpb25TZWdtZW50KTtcclxuXHJcbmV4cG9ydCB7IFJvdGF0aW9uU2VnbWVudCB9O1xyXG4iXSwibmFtZXMiOlsiQmFzZUFuaW1hdGlvbk1hdGVyaWFsIiwicGFyYW1ldGVycyIsInVuaWZvcm1zIiwiY2FsbCIsInVuaWZvcm1WYWx1ZXMiLCJzZXRWYWx1ZXMiLCJVbmlmb3Jtc1V0aWxzIiwibWVyZ2UiLCJzZXRVbmlmb3JtVmFsdWVzIiwibWFwIiwiZGVmaW5lcyIsIm5vcm1hbE1hcCIsImVudk1hcCIsImFvTWFwIiwic3BlY3VsYXJNYXAiLCJhbHBoYU1hcCIsImxpZ2h0TWFwIiwiZW1pc3NpdmVNYXAiLCJidW1wTWFwIiwiZGlzcGxhY2VtZW50TWFwIiwicm91Z2huZXNzTWFwIiwibWV0YWxuZXNzTWFwIiwiZW52TWFwVHlwZURlZmluZSIsImVudk1hcE1vZGVEZWZpbmUiLCJlbnZNYXBCbGVuZGluZ0RlZmluZSIsIm1hcHBpbmciLCJDdWJlUmVmbGVjdGlvbk1hcHBpbmciLCJDdWJlUmVmcmFjdGlvbk1hcHBpbmciLCJDdWJlVVZSZWZsZWN0aW9uTWFwcGluZyIsIkN1YmVVVlJlZnJhY3Rpb25NYXBwaW5nIiwiRXF1aXJlY3Rhbmd1bGFyUmVmbGVjdGlvbk1hcHBpbmciLCJFcXVpcmVjdGFuZ3VsYXJSZWZyYWN0aW9uTWFwcGluZyIsIlNwaGVyaWNhbFJlZmxlY3Rpb25NYXBwaW5nIiwiY29tYmluZSIsIk1peE9wZXJhdGlvbiIsIkFkZE9wZXJhdGlvbiIsIk11bHRpcGx5T3BlcmF0aW9uIiwicHJvdG90eXBlIiwiT2JqZWN0IiwiYXNzaWduIiwiY3JlYXRlIiwiU2hhZGVyTWF0ZXJpYWwiLCJ2YWx1ZXMiLCJrZXlzIiwiZm9yRWFjaCIsImtleSIsInZhbHVlIiwibmFtZSIsImpvaW4iLCJCYXNpY0FuaW1hdGlvbk1hdGVyaWFsIiwidmFyeWluZ1BhcmFtZXRlcnMiLCJ2ZXJ0ZXhQYXJhbWV0ZXJzIiwidmVydGV4RnVuY3Rpb25zIiwidmVydGV4SW5pdCIsInZlcnRleE5vcm1hbCIsInZlcnRleFBvc2l0aW9uIiwidmVydGV4Q29sb3IiLCJmcmFnbWVudEZ1bmN0aW9ucyIsImZyYWdtZW50UGFyYW1ldGVycyIsImZyYWdtZW50SW5pdCIsImZyYWdtZW50TWFwIiwiZnJhZ21lbnREaWZmdXNlIiwiU2hhZGVyTGliIiwibGlnaHRzIiwidmVydGV4U2hhZGVyIiwiY29uY2F0VmVydGV4U2hhZGVyIiwiZnJhZ21lbnRTaGFkZXIiLCJjb25jYXRGcmFnbWVudFNoYWRlciIsImNvbnN0cnVjdG9yIiwic3RyaW5naWZ5Q2h1bmsiLCJMYW1iZXJ0QW5pbWF0aW9uTWF0ZXJpYWwiLCJmcmFnbWVudEVtaXNzaXZlIiwiZnJhZ21lbnRTcGVjdWxhciIsIlBob25nQW5pbWF0aW9uTWF0ZXJpYWwiLCJTdGFuZGFyZEFuaW1hdGlvbk1hdGVyaWFsIiwiZnJhZ21lbnRSb3VnaG5lc3MiLCJmcmFnbWVudE1ldGFsbmVzcyIsIlBvaW50c0FuaW1hdGlvbk1hdGVyaWFsIiwiZnJhZ21lbnRTaGFwZSIsIkRlcHRoQW5pbWF0aW9uTWF0ZXJpYWwiLCJkZXB0aFBhY2tpbmciLCJSR0JBRGVwdGhQYWNraW5nIiwiY2xpcHBpbmciLCJEaXN0YW5jZUFuaW1hdGlvbk1hdGVyaWFsIiwiUHJlZmFiQnVmZmVyR2VvbWV0cnkiLCJwcmVmYWIiLCJjb3VudCIsInByZWZhYkdlb21ldHJ5IiwicHJlZmFiQ291bnQiLCJwcmVmYWJWZXJ0ZXhDb3VudCIsInZlcnRpY2VzIiwibGVuZ3RoIiwiYnVmZmVySW5kaWNlcyIsImJ1ZmZlclBvc2l0aW9ucyIsIkJ1ZmZlckdlb21ldHJ5IiwicHJlZmFiRmFjZUNvdW50IiwiZmFjZXMiLCJwcmVmYWJJbmRleENvdW50IiwicHJlZmFiSW5kaWNlcyIsImgiLCJmYWNlIiwicHVzaCIsImEiLCJiIiwiYyIsImluZGV4QnVmZmVyIiwiVWludDMyQXJyYXkiLCJzZXRJbmRleCIsIkJ1ZmZlckF0dHJpYnV0ZSIsImkiLCJrIiwicG9zaXRpb25CdWZmZXIiLCJjcmVhdGVBdHRyaWJ1dGUiLCJhcnJheSIsIm9mZnNldCIsImoiLCJwcmVmYWJWZXJ0ZXgiLCJ4IiwieSIsInoiLCJidWZmZXJVdnMiLCJwcmVmYWJVdnMiLCJ1diIsImZhY2VWZXJ0ZXhVdnMiLCJ1dkJ1ZmZlciIsInByZWZhYlV2IiwiaXRlbVNpemUiLCJmYWN0b3J5IiwiYnVmZmVyIiwiRmxvYXQzMkFycmF5IiwiYXR0cmlidXRlIiwiYWRkQXR0cmlidXRlIiwiZGF0YSIsInNldFByZWZhYkRhdGEiLCJwcmVmYWJJbmRleCIsImF0dHJpYnV0ZXMiLCJVdGlscyIsImdlb21ldHJ5IiwiaWwiLCJuIiwidmEiLCJ2YiIsInZjIiwiY2xvbmUiLCJ2IiwiVEhSRUUiLCJWZWN0b3IzIiwiYm94IiwidE1hdGgiLCJyYW5kRmxvYXQiLCJtaW4iLCJtYXgiLCJyYW5kRmxvYXRTcHJlYWQiLCJub3JtYWxpemUiLCJzb3VyY2VNYXRlcmlhbCIsIk1vZGVsQnVmZmVyR2VvbWV0cnkiLCJtb2RlbCIsIm9wdGlvbnMiLCJtb2RlbEdlb21ldHJ5IiwiZmFjZUNvdW50IiwidmVydGV4Q291bnQiLCJjb21wdXRlQ2VudHJvaWRzIiwibG9jYWxpemVGYWNlcyIsImNlbnRyb2lkcyIsImNvbXB1dGVDZW50cm9pZCIsImNlbnRyb2lkIiwiQkFTIiwidmVydGV4IiwiYnVmZmVyVVZzIiwic2V0RmFjZURhdGEiLCJmYWNlSW5kZXgiLCJQb2ludEJ1ZmZlckdlb21ldHJ5IiwicG9pbnRDb3VudCIsInNldFBvaW50RGF0YSIsInBvaW50SW5kZXgiLCJTaGFkZXJDaHVuayIsImNhdG11bGxfcm9tX3NwbGluZSIsImN1YmljX2JlemllciIsImVhc2VfYmFja19pbiIsImVhc2VfYmFja19pbl9vdXQiLCJlYXNlX2JhY2tfb3V0IiwiZWFzZV9iZXppZXIiLCJlYXNlX2JvdW5jZV9pbiIsImVhc2VfYm91bmNlX2luX291dCIsImVhc2VfYm91bmNlX291dCIsImVhc2VfY2lyY19pbiIsImVhc2VfY2lyY19pbl9vdXQiLCJlYXNlX2NpcmNfb3V0IiwiZWFzZV9jdWJpY19pbiIsImVhc2VfY3ViaWNfaW5fb3V0IiwiZWFzZV9jdWJpY19vdXQiLCJlYXNlX2VsYXN0aWNfaW4iLCJlYXNlX2VsYXN0aWNfaW5fb3V0IiwiZWFzZV9lbGFzdGljX291dCIsImVhc2VfZXhwb19pbiIsImVhc2VfZXhwb19pbl9vdXQiLCJlYXNlX2V4cG9fb3V0IiwiZWFzZV9xdWFkX2luIiwiZWFzZV9xdWFkX2luX291dCIsImVhc2VfcXVhZF9vdXQiLCJlYXNlX3F1YXJ0X2luIiwiZWFzZV9xdWFydF9pbl9vdXQiLCJlYXNlX3F1YXJ0X291dCIsImVhc2VfcXVpbnRfaW4iLCJlYXNlX3F1aW50X2luX291dCIsImVhc2VfcXVpbnRfb3V0IiwiZWFzZV9zaW5lX2luIiwiZWFzZV9zaW5lX2luX291dCIsImVhc2Vfc2luZV9vdXQiLCJxdWF0ZXJuaW9uX3JvdGF0aW9uIiwicXVhdGVybmlvbl9zbGVycCIsIlRpbWVsaW5lU2VnbWVudCIsInN0YXJ0IiwiZHVyYXRpb24iLCJ0cmFuc2l0aW9uIiwiY29tcGlsZXIiLCJ0cmFpbCIsImNvbXBpbGUiLCJkZWZpbmVQcm9wZXJ0eSIsIlRpbWVsaW5lIiwidGltZUtleSIsInNlZ21lbnRzIiwiX19rZXkiLCJzZWdtZW50RGVmaW5pdGlvbnMiLCJyZWdpc3RlciIsImRlZmluaXRpb24iLCJhZGQiLCJ0cmFuc2l0aW9ucyIsInBvc2l0aW9uT2Zmc2V0IiwiX2V2YWwiLCJldmFsIiwidW5kZWZpbmVkIiwiTWF0aCIsInByb2Nlc3NUcmFuc2l0aW9uIiwiZnJvbSIsImRlZmF1bHRGcm9tIiwidG8iLCJ0b1N0cmluZyIsImZpbGxHYXBzIiwicyIsInMwIiwiczEiLCJlbmQiLCJnZXRUcmFuc2Zvcm1DYWxscyIsInQiLCJUaW1lbGluZUNodW5rcyIsInAiLCJ0b1ByZWNpc2lvbiIsInciLCJzZWdtZW50IiwiZWFzZSIsImVhc2VQYXJhbXMiLCJzdGFydFRpbWUiLCJlbmRUaW1lIiwiVHJhbnNsYXRpb25TZWdtZW50IiwiZGVsYXlEdXJhdGlvbiIsInZlYzMiLCJyZW5kZXJDaGVjayIsInByb2dyZXNzIiwiU2NhbGVTZWdtZW50Iiwib3JpZ2luIiwiUm90YXRpb25TZWdtZW50IiwiZnJvbUF4aXNBbmdsZSIsIlZlY3RvcjQiLCJheGlzIiwiYW5nbGUiLCJ0b0F4aXMiLCJ0b0F4aXNBbmdsZSIsInZlYzQiXSwibWFwcGluZ3MiOiI7O0FBZUEsU0FBU0EscUJBQVQsQ0FBK0JDLFVBQS9CLEVBQTJDQyxRQUEzQyxFQUFxRDtpQkFDcENDLElBQWYsQ0FBb0IsSUFBcEI7O01BRU1DLGdCQUFnQkgsV0FBV0csYUFBakM7U0FDT0gsV0FBV0csYUFBbEI7O09BRUtDLFNBQUwsQ0FBZUosVUFBZjs7T0FFS0MsUUFBTCxHQUFnQkksY0FBY0MsS0FBZCxDQUFvQixDQUFDTCxRQUFELEVBQVcsS0FBS0EsUUFBaEIsQ0FBcEIsQ0FBaEI7O09BRUtNLGdCQUFMLENBQXNCSixhQUF0Qjs7TUFFSUEsYUFBSixFQUFtQjtrQkFDSEssR0FBZCxLQUFzQixLQUFLQyxPQUFMLENBQWEsU0FBYixJQUEwQixFQUFoRDtrQkFDY0MsU0FBZCxLQUE0QixL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
