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
PrefabBufferGeometry.prototype = Object.create(BufferGeometry.prototype);
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

  this.setIndex(new BufferAttribute(indexBuffer, 1));

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
 * Creates a THREE.BufferAttribute with UV coordinates.
 */
PrefabBufferGeometry.prototype.bufferUvs = function () {
  var prefabUvs = [];

  if (this.isPrefabBufferGeometry) {
    var uv = this.prefabGeometry.attributes.uv.array;

    for (var i = 0; i < this.prefabVertexCount; i++) {
      prefabUvs.push(new THREE.Vector2(uv[i * 2], uv[i * 2 + 1]));
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzLm1vZHVsZS5qcyIsInNvdXJjZXMiOlsiLi4vc3JjL21hdGVyaWFscy9CYXNlQW5pbWF0aW9uTWF0ZXJpYWwuanMiLCIuLi9zcmMvbWF0ZXJpYWxzL0Jhc2ljQW5pbWF0aW9uTWF0ZXJpYWwuanMiLCIuLi9zcmMvbWF0ZXJpYWxzL0xhbWJlcnRBbmltYXRpb25NYXRlcmlhbC5qcyIsIi4uL3NyYy9tYXRlcmlhbHMvUGhvbmdBbmltYXRpb25NYXRlcmlhbC5qcyIsIi4uL3NyYy9tYXRlcmlhbHMvU3RhbmRhcmRBbmltYXRpb25NYXRlcmlhbC5qcyIsIi4uL3NyYy9tYXRlcmlhbHMvUG9pbnRzQW5pbWF0aW9uTWF0ZXJpYWwuanMiLCIuLi9zcmMvbWF0ZXJpYWxzL0RlcHRoQW5pbWF0aW9uTWF0ZXJpYWwuanMiLCIuLi9zcmMvbWF0ZXJpYWxzL0Rpc3RhbmNlQW5pbWF0aW9uTWF0ZXJpYWwuanMiLCIuLi9zcmMvZ2VvbWV0cnkvUHJlZmFiQnVmZmVyR2VvbWV0cnkuanMiLCIuLi9zcmMvVXRpbHMuanMiLCIuLi9zcmMvZ2VvbWV0cnkvTW9kZWxCdWZmZXJHZW9tZXRyeS5qcyIsIi4uL3NyYy9nZW9tZXRyeS9Qb2ludEJ1ZmZlckdlb21ldHJ5LmpzIiwiLi4vc3JjL1NoYWRlckNodW5rLmpzIiwiLi4vc3JjL3RpbWVsaW5lL1RpbWVsaW5lU2VnbWVudC5qcyIsIi4uL3NyYy90aW1lbGluZS9UaW1lbGluZS5qcyIsIi4uL3NyYy90aW1lbGluZS9UaW1lbGluZUNodW5rcy5qcyIsIi4uL3NyYy90aW1lbGluZS9UcmFuc2xhdGlvblNlZ21lbnQuanMiLCIuLi9zcmMvdGltZWxpbmUvU2NhbGVTZWdtZW50LmpzIiwiLi4vc3JjL3RpbWVsaW5lL1JvdGF0aW9uU2VnbWVudC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICBTaGFkZXJNYXRlcmlhbCxcbiAgVW5pZm9ybXNVdGlscyxcbiAgQ3ViZVJlZmxlY3Rpb25NYXBwaW5nLFxuICBDdWJlUmVmcmFjdGlvbk1hcHBpbmcsXG4gIEN1YmVVVlJlZmxlY3Rpb25NYXBwaW5nLFxuICBDdWJlVVZSZWZyYWN0aW9uTWFwcGluZyxcbiAgRXF1aXJlY3Rhbmd1bGFyUmVmbGVjdGlvbk1hcHBpbmcsXG4gIEVxdWlyZWN0YW5ndWxhclJlZnJhY3Rpb25NYXBwaW5nLFxuICBTcGhlcmljYWxSZWZsZWN0aW9uTWFwcGluZyxcbiAgTWl4T3BlcmF0aW9uLFxuICBBZGRPcGVyYXRpb24sXG4gIE11bHRpcGx5T3BlcmF0aW9uXG59IGZyb20gJ3RocmVlJztcblxuZnVuY3Rpb24gQmFzZUFuaW1hdGlvbk1hdGVyaWFsKHBhcmFtZXRlcnMsIHVuaWZvcm1zKSB7XG4gIFNoYWRlck1hdGVyaWFsLmNhbGwodGhpcyk7XG4gIFxuICBjb25zdCB1bmlmb3JtVmFsdWVzID0gcGFyYW1ldGVycy51bmlmb3JtVmFsdWVzO1xuICBkZWxldGUgcGFyYW1ldGVycy51bmlmb3JtVmFsdWVzO1xuICBcbiAgdGhpcy5zZXRWYWx1ZXMocGFyYW1ldGVycyk7XG4gIFxuICB0aGlzLnVuaWZvcm1zID0gVW5pZm9ybXNVdGlscy5tZXJnZShbdW5pZm9ybXMsIHRoaXMudW5pZm9ybXNdKTtcbiAgXG4gIHRoaXMuc2V0VW5pZm9ybVZhbHVlcyh1bmlmb3JtVmFsdWVzKTtcbiAgXG4gIGlmICh1bmlmb3JtVmFsdWVzKSB7XG4gICAgdW5pZm9ybVZhbHVlcy5tYXAgJiYgKHRoaXMuZGVmaW5lc1snVVNFX01BUCddID0gJycpO1xuICAgIHVuaWZvcm1WYWx1ZXMubm9ybWFsTWFwICYmICh0aGlzLmRlZmluZXNbJ1VTRV9OT1JNQUxNQVAnXSA9ICcnKTtcbiAgICB1bmlmb3JtVmFsdWVzLmVudk1hcCAmJiAodGhpcy5kZWZpbmVzWydVU0VfRU5WTUFQJ10gPSAnJyk7XG4gICAgdW5pZm9ybVZhbHVlcy5hb01hcCAmJiAodGhpcy5kZWZpbmVzWydVU0VfQU9NQVAnXSA9ICcnKTtcbiAgICB1bmlmb3JtVmFsdWVzLnNwZWN1bGFyTWFwICYmICh0aGlzLmRlZmluZXNbJ1VTRV9TUEVDVUxBUk1BUCddID0gJycpO1xuICAgIHVuaWZvcm1WYWx1ZXMuYWxwaGFNYXAgJiYgKHRoaXMuZGVmaW5lc1snVVNFX0FMUEhBTUFQJ10gPSAnJyk7XG4gICAgdW5pZm9ybVZhbHVlcy5saWdodE1hcCAmJiAodGhpcy5kZWZpbmVzWydVU0VfTElHSFRNQVAnXSA9ICcnKTtcbiAgICB1bmlmb3JtVmFsdWVzLmVtaXNzaXZlTWFwICYmICh0aGlzLmRlZmluZXNbJ1VTRV9FTUlTU0lWRU1BUCddID0gJycpO1xuICAgIHVuaWZvcm1WYWx1ZXMuYnVtcE1hcCAmJiAodGhpcy5kZWZpbmVzWydVU0VfQlVNUE1BUCddID0gJycpO1xuICAgIHVuaWZvcm1WYWx1ZXMuZGlzcGxhY2VtZW50TWFwICYmICh0aGlzLmRlZmluZXNbJ1VTRV9ESVNQTEFDRU1FTlRNQVAnXSA9ICcnKTtcbiAgICB1bmlmb3JtVmFsdWVzLnJvdWdobmVzc01hcCAmJiAodGhpcy5kZWZpbmVzWydVU0VfRElTUExBQ0VNRU5UTUFQJ10gPSAnJyk7XG4gICAgdW5pZm9ybVZhbHVlcy5yb3VnaG5lc3NNYXAgJiYgKHRoaXMuZGVmaW5lc1snVVNFX1JPVUdITkVTU01BUCddID0gJycpO1xuICAgIHVuaWZvcm1WYWx1ZXMubWV0YWxuZXNzTWFwICYmICh0aGlzLmRlZmluZXNbJ1VTRV9NRVRBTE5FU1NNQVAnXSA9ICcnKTtcbiAgXG4gICAgaWYgKHVuaWZvcm1WYWx1ZXMuZW52TWFwKSB7XG4gICAgICB0aGlzLmRlZmluZXNbJ1VTRV9FTlZNQVAnXSA9ICcnO1xuICAgIFxuICAgICAgbGV0IGVudk1hcFR5cGVEZWZpbmUgPSAnRU5WTUFQX1RZUEVfQ1VCRSc7XG4gICAgICBsZXQgZW52TWFwTW9kZURlZmluZSA9ICdFTlZNQVBfTU9ERV9SRUZMRUNUSU9OJztcbiAgICAgIGxldCBlbnZNYXBCbGVuZGluZ0RlZmluZSA9ICdFTlZNQVBfQkxFTkRJTkdfTVVMVElQTFknO1xuICAgIFxuICAgICAgc3dpdGNoICh1bmlmb3JtVmFsdWVzLmVudk1hcC5tYXBwaW5nKSB7XG4gICAgICAgIGNhc2UgQ3ViZVJlZmxlY3Rpb25NYXBwaW5nOlxuICAgICAgICBjYXNlIEN1YmVSZWZyYWN0aW9uTWFwcGluZzpcbiAgICAgICAgICBlbnZNYXBUeXBlRGVmaW5lID0gJ0VOVk1BUF9UWVBFX0NVQkUnO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIEN1YmVVVlJlZmxlY3Rpb25NYXBwaW5nOlxuICAgICAgICBjYXNlIEN1YmVVVlJlZnJhY3Rpb25NYXBwaW5nOlxuICAgICAgICAgIGVudk1hcFR5cGVEZWZpbmUgPSAnRU5WTUFQX1RZUEVfQ1VCRV9VVic7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgRXF1aXJlY3Rhbmd1bGFyUmVmbGVjdGlvbk1hcHBpbmc6XG4gICAgICAgIGNhc2UgRXF1aXJlY3Rhbmd1bGFyUmVmcmFjdGlvbk1hcHBpbmc6XG4gICAgICAgICAgZW52TWFwVHlwZURlZmluZSA9ICdFTlZNQVBfVFlQRV9FUVVJUkVDJztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBTcGhlcmljYWxSZWZsZWN0aW9uTWFwcGluZzpcbiAgICAgICAgICBlbnZNYXBUeXBlRGVmaW5lID0gJ0VOVk1BUF9UWVBFX1NQSEVSRSc7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgXG4gICAgICBzd2l0Y2ggKHVuaWZvcm1WYWx1ZXMuZW52TWFwLm1hcHBpbmcpIHtcbiAgICAgICAgY2FzZSBDdWJlUmVmcmFjdGlvbk1hcHBpbmc6XG4gICAgICAgIGNhc2UgRXF1aXJlY3Rhbmd1bGFyUmVmcmFjdGlvbk1hcHBpbmc6XG4gICAgICAgICAgZW52TWFwTW9kZURlZmluZSA9ICdFTlZNQVBfTU9ERV9SRUZSQUNUSU9OJztcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICBcbiAgICAgIHN3aXRjaCAodW5pZm9ybVZhbHVlcy5jb21iaW5lKSB7XG4gICAgICAgIGNhc2UgTWl4T3BlcmF0aW9uOlxuICAgICAgICAgIGVudk1hcEJsZW5kaW5nRGVmaW5lID0gJ0VOVk1BUF9CTEVORElOR19NSVgnO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIEFkZE9wZXJhdGlvbjpcbiAgICAgICAgICBlbnZNYXBCbGVuZGluZ0RlZmluZSA9ICdFTlZNQVBfQkxFTkRJTkdfQUREJztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBNdWx0aXBseU9wZXJhdGlvbjpcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICBlbnZNYXBCbGVuZGluZ0RlZmluZSA9ICdFTlZNQVBfQkxFTkRJTkdfTVVMVElQTFknO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIFxuICAgICAgdGhpcy5kZWZpbmVzW2Vudk1hcFR5cGVEZWZpbmVdID0gJyc7XG4gICAgICB0aGlzLmRlZmluZXNbZW52TWFwQmxlbmRpbmdEZWZpbmVdID0gJyc7XG4gICAgICB0aGlzLmRlZmluZXNbZW52TWFwTW9kZURlZmluZV0gPSAnJztcbiAgICB9XG4gIH1cbn1cblxuQmFzZUFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZSA9IE9iamVjdC5hc3NpZ24oT2JqZWN0LmNyZWF0ZShTaGFkZXJNYXRlcmlhbC5wcm90b3R5cGUpLCB7XG4gIGNvbnN0cnVjdG9yOiBCYXNlQW5pbWF0aW9uTWF0ZXJpYWwsXG4gIFxuICBzZXRVbmlmb3JtVmFsdWVzKHZhbHVlcykge1xuICAgIGlmICghdmFsdWVzKSByZXR1cm47XG4gICAgXG4gICAgY29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKHZhbHVlcyk7XG4gICAgXG4gICAga2V5cy5mb3JFYWNoKChrZXkpID0+IHtcbiAgICAgIGtleSBpbiB0aGlzLnVuaWZvcm1zICYmICh0aGlzLnVuaWZvcm1zW2tleV0udmFsdWUgPSB2YWx1ZXNba2V5XSk7XG4gICAgfSk7XG4gIH0sXG4gIFxuICBzdHJpbmdpZnlDaHVuayhuYW1lKSB7XG4gICAgbGV0IHZhbHVlO1xuICAgIFxuICAgIGlmICghdGhpc1tuYW1lXSkge1xuICAgICAgdmFsdWUgPSAnJztcbiAgICB9XG4gICAgZWxzZSBpZiAodHlwZW9mIHRoaXNbbmFtZV0gPT09ICAnc3RyaW5nJykge1xuICAgICAgdmFsdWUgPSB0aGlzW25hbWVdO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHZhbHVlID0gdGhpc1tuYW1lXS5qb2luKCdcXG4nKTtcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG59KTtcblxuZXhwb3J0IGRlZmF1bHQgQmFzZUFuaW1hdGlvbk1hdGVyaWFsO1xuIiwiaW1wb3J0IHsgU2hhZGVyTGliIH0gZnJvbSAndGhyZWUnO1xuaW1wb3J0IEJhc2VBbmltYXRpb25NYXRlcmlhbCBmcm9tICcuL0Jhc2VBbmltYXRpb25NYXRlcmlhbCc7XG5cbi8qKlxuICogRXh0ZW5kcyBUSFJFRS5NZXNoQmFzaWNNYXRlcmlhbCB3aXRoIGN1c3RvbSBzaGFkZXIgY2h1bmtzLlxuICpcbiAqIEBzZWUgaHR0cDovL3RocmVlLWJhcy1leGFtcGxlcy5zdXJnZS5zaC9leGFtcGxlcy9tYXRlcmlhbHNfYmFzaWMvXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IHBhcmFtZXRlcnMgT2JqZWN0IGNvbnRhaW5pbmcgbWF0ZXJpYWwgcHJvcGVydGllcyBhbmQgY3VzdG9tIHNoYWRlciBjaHVua3MuXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gQmFzaWNBbmltYXRpb25NYXRlcmlhbChwYXJhbWV0ZXJzKSB7XG4gIHRoaXMudmFyeWluZ1BhcmFtZXRlcnMgPSBbXTtcbiAgXG4gIHRoaXMudmVydGV4UGFyYW1ldGVycyA9IFtdO1xuICB0aGlzLnZlcnRleEZ1bmN0aW9ucyA9IFtdO1xuICB0aGlzLnZlcnRleEluaXQgPSBbXTtcbiAgdGhpcy52ZXJ0ZXhOb3JtYWwgPSBbXTtcbiAgdGhpcy52ZXJ0ZXhQb3NpdGlvbiA9IFtdO1xuICB0aGlzLnZlcnRleENvbG9yID0gW107XG4gIFxuICB0aGlzLmZyYWdtZW50RnVuY3Rpb25zID0gW107XG4gIHRoaXMuZnJhZ21lbnRQYXJhbWV0ZXJzID0gW107XG4gIHRoaXMuZnJhZ21lbnRJbml0ID0gW107XG4gIHRoaXMuZnJhZ21lbnRNYXAgPSBbXTtcbiAgdGhpcy5mcmFnbWVudERpZmZ1c2UgPSBbXTtcbiAgXG4gIEJhc2VBbmltYXRpb25NYXRlcmlhbC5jYWxsKHRoaXMsIHBhcmFtZXRlcnMsIFNoYWRlckxpYlsnYmFzaWMnXS51bmlmb3Jtcyk7XG4gIFxuICB0aGlzLmxpZ2h0cyA9IGZhbHNlO1xuICB0aGlzLnZlcnRleFNoYWRlciA9IHRoaXMuY29uY2F0VmVydGV4U2hhZGVyKCk7XG4gIHRoaXMuZnJhZ21lbnRTaGFkZXIgPSB0aGlzLmNvbmNhdEZyYWdtZW50U2hhZGVyKCk7XG59XG5CYXNpY0FuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoQmFzZUFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZSk7XG5CYXNpY0FuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IEJhc2ljQW5pbWF0aW9uTWF0ZXJpYWw7XG5cbkJhc2ljQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlLmNvbmNhdFZlcnRleFNoYWRlciA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gYFxuICAjaW5jbHVkZSA8Y29tbW9uPlxuICAjaW5jbHVkZSA8dXZfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDx1djJfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxlbnZtYXBfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxjb2xvcl9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPGZvZ19wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPG1vcnBodGFyZ2V0X3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8c2tpbm5pbmdfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc19wYXJzX3ZlcnRleD5cbiAgXG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UGFyYW1ldGVycycpfVxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZhcnlpbmdQYXJhbWV0ZXJzJyl9XG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4RnVuY3Rpb25zJyl9XG4gIFxuICB2b2lkIG1haW4oKSB7XG5cbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleEluaXQnKX1cbiAgXG4gICAgI2luY2x1ZGUgPHV2X3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8dXYyX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8Y29sb3JfdmVydGV4PlxuICAgICNpbmNsdWRlIDxza2luYmFzZV92ZXJ0ZXg+XG4gIFxuICAgICNpZmRlZiBVU0VfRU5WTUFQXG4gIFxuICAgICNpbmNsdWRlIDxiZWdpbm5vcm1hbF92ZXJ0ZXg+XG4gICAgXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhOb3JtYWwnKX1cbiAgICBcbiAgICAjaW5jbHVkZSA8bW9ycGhub3JtYWxfdmVydGV4PlxuICAgICNpbmNsdWRlIDxza2lubm9ybWFsX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8ZGVmYXVsdG5vcm1hbF92ZXJ0ZXg+XG4gIFxuICAgICNlbmRpZlxuICBcbiAgICAjaW5jbHVkZSA8YmVnaW5fdmVydGV4PlxuICAgIFxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UG9zaXRpb24nKX1cbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleENvbG9yJyl9XG4gICAgXG4gICAgI2luY2x1ZGUgPG1vcnBodGFyZ2V0X3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8c2tpbm5pbmdfdmVydGV4PlxuICAgICNpbmNsdWRlIDxwcm9qZWN0X3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfdmVydGV4PlxuICBcbiAgICAjaW5jbHVkZSA8d29ybGRwb3NfdmVydGV4PlxuICAgICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfdmVydGV4PlxuICAgICNpbmNsdWRlIDxlbnZtYXBfdmVydGV4PlxuICAgICNpbmNsdWRlIDxmb2dfdmVydGV4PlxuICB9YDtcbn07XG5cbkJhc2ljQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlLmNvbmNhdEZyYWdtZW50U2hhZGVyID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBgXG4gIHVuaWZvcm0gdmVjMyBkaWZmdXNlO1xuICB1bmlmb3JtIGZsb2F0IG9wYWNpdHk7XG4gIFxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50UGFyYW1ldGVycycpfVxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZhcnlpbmdQYXJhbWV0ZXJzJyl9XG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRGdW5jdGlvbnMnKX1cbiAgXG4gICNpZm5kZWYgRkxBVF9TSEFERURcbiAgXG4gICAgdmFyeWluZyB2ZWMzIHZOb3JtYWw7XG4gIFxuICAjZW5kaWZcbiAgXG4gICNpbmNsdWRlIDxjb21tb24+XG4gICNpbmNsdWRlIDxjb2xvcl9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8dXZfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPHV2Ml9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8bWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxhbHBoYW1hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8YW9tYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGxpZ2h0bWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxlbnZtYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGZvZ19wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8c3BlY3VsYXJtYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGxvZ2RlcHRoYnVmX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfcGFyc19mcmFnbWVudD5cbiAgXG4gIHZvaWQgbWFpbigpIHtcbiAgXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudEluaXQnKX1cbiAgXG4gICAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc19mcmFnbWVudD5cblxuICAgIHZlYzQgZGlmZnVzZUNvbG9yID0gdmVjNCggZGlmZnVzZSwgb3BhY2l0eSApO1xuXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudERpZmZ1c2UnKX1cbiAgXG4gICAgI2luY2x1ZGUgPGxvZ2RlcHRoYnVmX2ZyYWdtZW50PlxuICAgIFxuICAgICR7KHRoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50TWFwJykgfHwgJyNpbmNsdWRlIDxtYXBfZnJhZ21lbnQ+Jyl9XG4gICAgXG4gICAgI2luY2x1ZGUgPGNvbG9yX2ZyYWdtZW50PlxuICAgICNpbmNsdWRlIDxhbHBoYW1hcF9mcmFnbWVudD5cbiAgICAjaW5jbHVkZSA8YWxwaGF0ZXN0X2ZyYWdtZW50PlxuICAgICNpbmNsdWRlIDxzcGVjdWxhcm1hcF9mcmFnbWVudD5cbiAgXG4gICAgUmVmbGVjdGVkTGlnaHQgcmVmbGVjdGVkTGlnaHQgPSBSZWZsZWN0ZWRMaWdodCggdmVjMyggMC4wICksIHZlYzMoIDAuMCApLCB2ZWMzKCAwLjAgKSwgdmVjMyggMC4wICkgKTtcbiAgXG4gICAgLy8gYWNjdW11bGF0aW9uIChiYWtlZCBpbmRpcmVjdCBsaWdodGluZyBvbmx5KVxuICAgICNpZmRlZiBVU0VfTElHSFRNQVBcbiAgXG4gICAgICByZWZsZWN0ZWRMaWdodC5pbmRpcmVjdERpZmZ1c2UgKz0gdGV4dHVyZTJEKCBsaWdodE1hcCwgdlV2MiApLnh5eiAqIGxpZ2h0TWFwSW50ZW5zaXR5O1xuICBcbiAgICAjZWxzZVxuICBcbiAgICAgIHJlZmxlY3RlZExpZ2h0LmluZGlyZWN0RGlmZnVzZSArPSB2ZWMzKCAxLjAgKTtcbiAgXG4gICAgI2VuZGlmXG4gIFxuICAgIC8vIG1vZHVsYXRpb25cbiAgICAjaW5jbHVkZSA8YW9tYXBfZnJhZ21lbnQ+XG4gIFxuICAgIHJlZmxlY3RlZExpZ2h0LmluZGlyZWN0RGlmZnVzZSAqPSBkaWZmdXNlQ29sb3IucmdiO1xuICBcbiAgICB2ZWMzIG91dGdvaW5nTGlnaHQgPSByZWZsZWN0ZWRMaWdodC5pbmRpcmVjdERpZmZ1c2U7XG4gIFxuICAgICNpbmNsdWRlIDxlbnZtYXBfZnJhZ21lbnQ+XG4gIFxuICAgIGdsX0ZyYWdDb2xvciA9IHZlYzQoIG91dGdvaW5nTGlnaHQsIGRpZmZ1c2VDb2xvci5hICk7XG4gIFxuICAgICNpbmNsdWRlIDxwcmVtdWx0aXBsaWVkX2FscGhhX2ZyYWdtZW50PlxuICAgICNpbmNsdWRlIDx0b25lbWFwcGluZ19mcmFnbWVudD5cbiAgICAjaW5jbHVkZSA8ZW5jb2RpbmdzX2ZyYWdtZW50PlxuICAgICNpbmNsdWRlIDxmb2dfZnJhZ21lbnQ+XG4gIH1gO1xufTtcblxuZXhwb3J0IHsgQmFzaWNBbmltYXRpb25NYXRlcmlhbCB9O1xuIiwiaW1wb3J0IHsgU2hhZGVyTGliIH0gZnJvbSAndGhyZWUnO1xuaW1wb3J0IEJhc2VBbmltYXRpb25NYXRlcmlhbCBmcm9tICcuL0Jhc2VBbmltYXRpb25NYXRlcmlhbCc7XG5cbi8qKlxuICogRXh0ZW5kcyBUSFJFRS5NZXNoTGFtYmVydE1hdGVyaWFsIHdpdGggY3VzdG9tIHNoYWRlciBjaHVua3MuXG4gKlxuICogQHNlZSBodHRwOi8vdGhyZWUtYmFzLWV4YW1wbGVzLnN1cmdlLnNoL2V4YW1wbGVzL21hdGVyaWFsc19sYW1iZXJ0L1xuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBwYXJhbWV0ZXJzIE9iamVjdCBjb250YWluaW5nIG1hdGVyaWFsIHByb3BlcnRpZXMgYW5kIGN1c3RvbSBzaGFkZXIgY2h1bmtzLlxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIExhbWJlcnRBbmltYXRpb25NYXRlcmlhbChwYXJhbWV0ZXJzKSB7XG4gIHRoaXMudmFyeWluZ1BhcmFtZXRlcnMgPSBbXTtcbiAgXG4gIHRoaXMudmVydGV4RnVuY3Rpb25zID0gW107XG4gIHRoaXMudmVydGV4UGFyYW1ldGVycyA9IFtdO1xuICB0aGlzLnZlcnRleEluaXQgPSBbXTtcbiAgdGhpcy52ZXJ0ZXhOb3JtYWwgPSBbXTtcbiAgdGhpcy52ZXJ0ZXhQb3NpdGlvbiA9IFtdO1xuICB0aGlzLnZlcnRleENvbG9yID0gW107XG4gIFxuICB0aGlzLmZyYWdtZW50RnVuY3Rpb25zID0gW107XG4gIHRoaXMuZnJhZ21lbnRQYXJhbWV0ZXJzID0gW107XG4gIHRoaXMuZnJhZ21lbnRJbml0ID0gW107XG4gIHRoaXMuZnJhZ21lbnRNYXAgPSBbXTtcbiAgdGhpcy5mcmFnbWVudERpZmZ1c2UgPSBbXTtcbiAgdGhpcy5mcmFnbWVudEVtaXNzaXZlID0gW107XG4gIHRoaXMuZnJhZ21lbnRTcGVjdWxhciA9IFtdO1xuICBcbiAgQmFzZUFuaW1hdGlvbk1hdGVyaWFsLmNhbGwodGhpcywgcGFyYW1ldGVycywgU2hhZGVyTGliWydsYW1iZXJ0J10udW5pZm9ybXMpO1xuICBcbiAgdGhpcy5saWdodHMgPSB0cnVlO1xuICB0aGlzLnZlcnRleFNoYWRlciA9IHRoaXMuY29uY2F0VmVydGV4U2hhZGVyKCk7XG4gIHRoaXMuZnJhZ21lbnRTaGFkZXIgPSB0aGlzLmNvbmNhdEZyYWdtZW50U2hhZGVyKCk7XG59XG5MYW1iZXJ0QW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShCYXNlQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlKTtcbkxhbWJlcnRBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBMYW1iZXJ0QW5pbWF0aW9uTWF0ZXJpYWw7XG5cbkxhbWJlcnRBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uY2F0VmVydGV4U2hhZGVyID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gYFxuICAjZGVmaW5lIExBTUJFUlRcblxuICB2YXJ5aW5nIHZlYzMgdkxpZ2h0RnJvbnQ7XG4gIFxuICAjaWZkZWYgRE9VQkxFX1NJREVEXG4gIFxuICAgIHZhcnlpbmcgdmVjMyB2TGlnaHRCYWNrO1xuICBcbiAgI2VuZGlmXG4gIFxuICAjaW5jbHVkZSA8Y29tbW9uPlxuICAjaW5jbHVkZSA8dXZfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDx1djJfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxlbnZtYXBfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxic2Rmcz5cbiAgI2luY2x1ZGUgPGxpZ2h0c19wYXJzPlxuICAjaW5jbHVkZSA8Y29sb3JfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxmb2dfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxtb3JwaHRhcmdldF9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPHNraW5uaW5nX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8c2hhZG93bWFwX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfcGFyc192ZXJ0ZXg+XG4gIFxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBhcmFtZXRlcnMnKX1cbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2YXJ5aW5nUGFyYW1ldGVycycpfVxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleEZ1bmN0aW9ucycpfVxuICBcbiAgdm9pZCBtYWluKCkge1xuICBcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleEluaXQnKX1cbiAgXG4gICAgI2luY2x1ZGUgPHV2X3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8dXYyX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8Y29sb3JfdmVydGV4PlxuICBcbiAgICAjaW5jbHVkZSA8YmVnaW5ub3JtYWxfdmVydGV4PlxuICAgIFxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4Tm9ybWFsJyl9XG4gICAgXG4gICAgI2luY2x1ZGUgPG1vcnBobm9ybWFsX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8c2tpbmJhc2VfdmVydGV4PlxuICAgICNpbmNsdWRlIDxza2lubm9ybWFsX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8ZGVmYXVsdG5vcm1hbF92ZXJ0ZXg+XG4gIFxuICAgICNpbmNsdWRlIDxiZWdpbl92ZXJ0ZXg+XG4gICAgXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQb3NpdGlvbicpfVxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4Q29sb3InKX1cbiAgICBcbiAgICAjaW5jbHVkZSA8bW9ycGh0YXJnZXRfdmVydGV4PlxuICAgICNpbmNsdWRlIDxza2lubmluZ192ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPHByb2plY3RfdmVydGV4PlxuICAgICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc192ZXJ0ZXg+XG4gIFxuICAgICNpbmNsdWRlIDx3b3JsZHBvc192ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPGVudm1hcF92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPGxpZ2h0c19sYW1iZXJ0X3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8c2hhZG93bWFwX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8Zm9nX3ZlcnRleD5cbiAgfWA7XG59O1xuXG5MYW1iZXJ0QW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlLmNvbmNhdEZyYWdtZW50U2hhZGVyID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gYFxuICB1bmlmb3JtIHZlYzMgZGlmZnVzZTtcbiAgdW5pZm9ybSB2ZWMzIGVtaXNzaXZlO1xuICB1bmlmb3JtIGZsb2F0IG9wYWNpdHk7XG4gIFxuICB2YXJ5aW5nIHZlYzMgdkxpZ2h0RnJvbnQ7XG4gIFxuICAjaWZkZWYgRE9VQkxFX1NJREVEXG4gIFxuICAgIHZhcnlpbmcgdmVjMyB2TGlnaHRCYWNrO1xuICBcbiAgI2VuZGlmXG4gIFxuICAjaW5jbHVkZSA8Y29tbW9uPlxuICAjaW5jbHVkZSA8cGFja2luZz5cbiAgI2luY2x1ZGUgPGRpdGhlcmluZ19wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8Y29sb3JfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPHV2X3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDx1djJfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPG1hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8YWxwaGFtYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGFvbWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxsaWdodG1hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8ZW1pc3NpdmVtYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGVudm1hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8YnNkZnM+XG4gICNpbmNsdWRlIDxsaWdodHNfcGFycz5cbiAgI2luY2x1ZGUgPGZvZ19wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8c2hhZG93bWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxzaGFkb3dtYXNrX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxzcGVjdWxhcm1hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc19wYXJzX2ZyYWdtZW50PlxuICBcbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudFBhcmFtZXRlcnMnKX1cbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2YXJ5aW5nUGFyYW1ldGVycycpfVxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50RnVuY3Rpb25zJyl9XG4gIFxuICB2b2lkIG1haW4oKSB7XG4gIFxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRJbml0Jyl9XG4gIFxuICAgICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfZnJhZ21lbnQ+XG5cbiAgICB2ZWM0IGRpZmZ1c2VDb2xvciA9IHZlYzQoIGRpZmZ1c2UsIG9wYWNpdHkgKTtcbiAgICBSZWZsZWN0ZWRMaWdodCByZWZsZWN0ZWRMaWdodCA9IFJlZmxlY3RlZExpZ2h0KCB2ZWMzKCAwLjAgKSwgdmVjMyggMC4wICksIHZlYzMoIDAuMCApLCB2ZWMzKCAwLjAgKSApO1xuICAgIHZlYzMgdG90YWxFbWlzc2l2ZVJhZGlhbmNlID0gZW1pc3NpdmU7XG5cdFxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnREaWZmdXNlJyl9XG4gIFxuICAgICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl9mcmFnbWVudD5cblxuICAgICR7KHRoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50TWFwJykgfHwgJyNpbmNsdWRlIDxtYXBfZnJhZ21lbnQ+Jyl9XG5cbiAgICAjaW5jbHVkZSA8Y29sb3JfZnJhZ21lbnQ+XG4gICAgI2luY2x1ZGUgPGFscGhhbWFwX2ZyYWdtZW50PlxuICAgICNpbmNsdWRlIDxhbHBoYXRlc3RfZnJhZ21lbnQ+XG4gICAgI2luY2x1ZGUgPHNwZWN1bGFybWFwX2ZyYWdtZW50PlxuXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudEVtaXNzaXZlJyl9XG5cbiAgICAjaW5jbHVkZSA8ZW1pc3NpdmVtYXBfZnJhZ21lbnQ+XG4gIFxuICAgIC8vIGFjY3VtdWxhdGlvblxuICAgIHJlZmxlY3RlZExpZ2h0LmluZGlyZWN0RGlmZnVzZSA9IGdldEFtYmllbnRMaWdodElycmFkaWFuY2UoIGFtYmllbnRMaWdodENvbG9yICk7XG4gIFxuICAgICNpbmNsdWRlIDxsaWdodG1hcF9mcmFnbWVudD5cbiAgXG4gICAgcmVmbGVjdGVkTGlnaHQuaW5kaXJlY3REaWZmdXNlICo9IEJSREZfRGlmZnVzZV9MYW1iZXJ0KCBkaWZmdXNlQ29sb3IucmdiICk7XG4gIFxuICAgICNpZmRlZiBET1VCTEVfU0lERURcbiAgXG4gICAgICByZWZsZWN0ZWRMaWdodC5kaXJlY3REaWZmdXNlID0gKCBnbF9Gcm9udEZhY2luZyApID8gdkxpZ2h0RnJvbnQgOiB2TGlnaHRCYWNrO1xuICBcbiAgICAjZWxzZVxuICBcbiAgICAgIHJlZmxlY3RlZExpZ2h0LmRpcmVjdERpZmZ1c2UgPSB2TGlnaHRGcm9udDtcbiAgXG4gICAgI2VuZGlmXG4gIFxuICAgIHJlZmxlY3RlZExpZ2h0LmRpcmVjdERpZmZ1c2UgKj0gQlJERl9EaWZmdXNlX0xhbWJlcnQoIGRpZmZ1c2VDb2xvci5yZ2IgKSAqIGdldFNoYWRvd01hc2soKTtcbiAgXG4gICAgLy8gbW9kdWxhdGlvblxuICAgICNpbmNsdWRlIDxhb21hcF9mcmFnbWVudD5cbiAgXG4gICAgdmVjMyBvdXRnb2luZ0xpZ2h0ID0gcmVmbGVjdGVkTGlnaHQuZGlyZWN0RGlmZnVzZSArIHJlZmxlY3RlZExpZ2h0LmluZGlyZWN0RGlmZnVzZSArIHRvdGFsRW1pc3NpdmVSYWRpYW5jZTtcbiAgXG4gICAgI2luY2x1ZGUgPGVudm1hcF9mcmFnbWVudD5cbiAgXG4gICAgZ2xfRnJhZ0NvbG9yID0gdmVjNCggb3V0Z29pbmdMaWdodCwgZGlmZnVzZUNvbG9yLmEgKTtcbiAgXG4gICAgI2luY2x1ZGUgPHRvbmVtYXBwaW5nX2ZyYWdtZW50PlxuICAgICNpbmNsdWRlIDxlbmNvZGluZ3NfZnJhZ21lbnQ+XG4gICAgI2luY2x1ZGUgPGZvZ19mcmFnbWVudD5cbiAgICAjaW5jbHVkZSA8cHJlbXVsdGlwbGllZF9hbHBoYV9mcmFnbWVudD5cbiAgICAjaW5jbHVkZSA8ZGl0aGVyaW5nX2ZyYWdtZW50PlxuICB9YDtcbn07XG5cbmV4cG9ydCB7IExhbWJlcnRBbmltYXRpb25NYXRlcmlhbCB9O1xuIiwiaW1wb3J0IHsgU2hhZGVyTGliIH0gZnJvbSAndGhyZWUnO1xuaW1wb3J0IEJhc2VBbmltYXRpb25NYXRlcmlhbCBmcm9tICcuL0Jhc2VBbmltYXRpb25NYXRlcmlhbCc7XG5cbi8qKlxuICogRXh0ZW5kcyBUSFJFRS5NZXNoUGhvbmdNYXRlcmlhbCB3aXRoIGN1c3RvbSBzaGFkZXIgY2h1bmtzLlxuICpcbiAqIEBzZWUgaHR0cDovL3RocmVlLWJhcy1leGFtcGxlcy5zdXJnZS5zaC9leGFtcGxlcy9tYXRlcmlhbHNfcGhvbmcvXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IHBhcmFtZXRlcnMgT2JqZWN0IGNvbnRhaW5pbmcgbWF0ZXJpYWwgcHJvcGVydGllcyBhbmQgY3VzdG9tIHNoYWRlciBjaHVua3MuXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gUGhvbmdBbmltYXRpb25NYXRlcmlhbChwYXJhbWV0ZXJzKSB7XG4gIHRoaXMudmFyeWluZ1BhcmFtZXRlcnMgPSBbXTtcblxuICB0aGlzLnZlcnRleEZ1bmN0aW9ucyA9IFtdO1xuICB0aGlzLnZlcnRleFBhcmFtZXRlcnMgPSBbXTtcbiAgdGhpcy52ZXJ0ZXhJbml0ID0gW107XG4gIHRoaXMudmVydGV4Tm9ybWFsID0gW107XG4gIHRoaXMudmVydGV4UG9zaXRpb24gPSBbXTtcbiAgdGhpcy52ZXJ0ZXhDb2xvciA9IFtdO1xuXG4gIHRoaXMuZnJhZ21lbnRGdW5jdGlvbnMgPSBbXTtcbiAgdGhpcy5mcmFnbWVudFBhcmFtZXRlcnMgPSBbXTtcbiAgdGhpcy5mcmFnbWVudEluaXQgPSBbXTtcbiAgdGhpcy5mcmFnbWVudE1hcCA9IFtdO1xuICB0aGlzLmZyYWdtZW50RGlmZnVzZSA9IFtdO1xuICB0aGlzLmZyYWdtZW50RW1pc3NpdmUgPSBbXTtcbiAgdGhpcy5mcmFnbWVudFNwZWN1bGFyID0gW107XG5cbiAgQmFzZUFuaW1hdGlvbk1hdGVyaWFsLmNhbGwodGhpcywgcGFyYW1ldGVycywgU2hhZGVyTGliWydwaG9uZyddLnVuaWZvcm1zKTtcblxuICB0aGlzLmxpZ2h0cyA9IHRydWU7XG4gIHRoaXMudmVydGV4U2hhZGVyID0gdGhpcy5jb25jYXRWZXJ0ZXhTaGFkZXIoKTtcbiAgdGhpcy5mcmFnbWVudFNoYWRlciA9IHRoaXMuY29uY2F0RnJhZ21lbnRTaGFkZXIoKTtcbn1cblBob25nQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShCYXNlQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlKTtcblBob25nQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gUGhvbmdBbmltYXRpb25NYXRlcmlhbDtcblxuUGhvbmdBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uY2F0VmVydGV4U2hhZGVyID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gYFxuICAjZGVmaW5lIFBIT05HXG5cbiAgdmFyeWluZyB2ZWMzIHZWaWV3UG9zaXRpb247XG4gIFxuICAjaWZuZGVmIEZMQVRfU0hBREVEXG4gIFxuICAgIHZhcnlpbmcgdmVjMyB2Tm9ybWFsO1xuICBcbiAgI2VuZGlmXG4gIFxuICAjaW5jbHVkZSA8Y29tbW9uPlxuICAjaW5jbHVkZSA8dXZfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDx1djJfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxkaXNwbGFjZW1lbnRtYXBfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxlbnZtYXBfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxjb2xvcl9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPGZvZ19wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPG1vcnBodGFyZ2V0X3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8c2tpbm5pbmdfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxzaGFkb3dtYXBfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc19wYXJzX3ZlcnRleD5cbiAgXG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UGFyYW1ldGVycycpfVxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZhcnlpbmdQYXJhbWV0ZXJzJyl9XG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4RnVuY3Rpb25zJyl9XG4gIFxuICB2b2lkIG1haW4oKSB7XG4gIFxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4SW5pdCcpfVxuICBcbiAgICAjaW5jbHVkZSA8dXZfdmVydGV4PlxuICAgICNpbmNsdWRlIDx1djJfdmVydGV4PlxuICAgICNpbmNsdWRlIDxjb2xvcl92ZXJ0ZXg+XG4gIFxuICAgICNpbmNsdWRlIDxiZWdpbm5vcm1hbF92ZXJ0ZXg+XG4gICAgXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhOb3JtYWwnKX1cbiAgICBcbiAgICAjaW5jbHVkZSA8bW9ycGhub3JtYWxfdmVydGV4PlxuICAgICNpbmNsdWRlIDxza2luYmFzZV92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPHNraW5ub3JtYWxfdmVydGV4PlxuICAgICNpbmNsdWRlIDxkZWZhdWx0bm9ybWFsX3ZlcnRleD5cbiAgXG4gICNpZm5kZWYgRkxBVF9TSEFERUQgLy8gTm9ybWFsIGNvbXB1dGVkIHdpdGggZGVyaXZhdGl2ZXMgd2hlbiBGTEFUX1NIQURFRFxuICBcbiAgICB2Tm9ybWFsID0gbm9ybWFsaXplKCB0cmFuc2Zvcm1lZE5vcm1hbCApO1xuICBcbiAgI2VuZGlmXG4gIFxuICAgICNpbmNsdWRlIDxiZWdpbl92ZXJ0ZXg+XG4gICAgXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQb3NpdGlvbicpfVxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4Q29sb3InKX1cbiAgICBcbiAgICAjaW5jbHVkZSA8bW9ycGh0YXJnZXRfdmVydGV4PlxuICAgICNpbmNsdWRlIDxza2lubmluZ192ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPGRpc3BsYWNlbWVudG1hcF92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPHByb2plY3RfdmVydGV4PlxuICAgICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc192ZXJ0ZXg+XG4gIFxuICAgIHZWaWV3UG9zaXRpb24gPSAtIG12UG9zaXRpb24ueHl6O1xuICBcbiAgICAjaW5jbHVkZSA8d29ybGRwb3NfdmVydGV4PlxuICAgICNpbmNsdWRlIDxlbnZtYXBfdmVydGV4PlxuICAgICNpbmNsdWRlIDxzaGFkb3dtYXBfdmVydGV4PlxuICAgICNpbmNsdWRlIDxmb2dfdmVydGV4PlxuICB9YDtcbn07XG5cblBob25nQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlLmNvbmNhdEZyYWdtZW50U2hhZGVyID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gYFxuICAjZGVmaW5lIFBIT05HXG5cbiAgdW5pZm9ybSB2ZWMzIGRpZmZ1c2U7XG4gIHVuaWZvcm0gdmVjMyBlbWlzc2l2ZTtcbiAgdW5pZm9ybSB2ZWMzIHNwZWN1bGFyO1xuICB1bmlmb3JtIGZsb2F0IHNoaW5pbmVzcztcbiAgdW5pZm9ybSBmbG9hdCBvcGFjaXR5O1xuICBcbiAgI2luY2x1ZGUgPGNvbW1vbj5cbiAgI2luY2x1ZGUgPHBhY2tpbmc+XG4gICNpbmNsdWRlIDxkaXRoZXJpbmdfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGNvbG9yX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDx1dl9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8dXYyX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxtYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGFscGhhbWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxhb21hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8bGlnaHRtYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGVtaXNzaXZlbWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxlbnZtYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGdyYWRpZW50bWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxmb2dfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGJzZGZzPlxuICAjaW5jbHVkZSA8bGlnaHRzX3BhcnM+XG4gICNpbmNsdWRlIDxsaWdodHNfcGhvbmdfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPHNoYWRvd21hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8YnVtcG1hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8bm9ybWFsbWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxzcGVjdWxhcm1hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc19wYXJzX2ZyYWdtZW50PlxuICBcbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudFBhcmFtZXRlcnMnKX1cbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2YXJ5aW5nUGFyYW1ldGVycycpfVxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50RnVuY3Rpb25zJyl9XG4gIFxuICB2b2lkIG1haW4oKSB7XG4gIFxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRJbml0Jyl9XG4gIFxuICAgICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfZnJhZ21lbnQ+XG4gIFxuICAgIHZlYzQgZGlmZnVzZUNvbG9yID0gdmVjNCggZGlmZnVzZSwgb3BhY2l0eSApO1xuICAgIFJlZmxlY3RlZExpZ2h0IHJlZmxlY3RlZExpZ2h0ID0gUmVmbGVjdGVkTGlnaHQoIHZlYzMoIDAuMCApLCB2ZWMzKCAwLjAgKSwgdmVjMyggMC4wICksIHZlYzMoIDAuMCApICk7XG4gICAgdmVjMyB0b3RhbEVtaXNzaXZlUmFkaWFuY2UgPSBlbWlzc2l2ZTtcbiAgXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudERpZmZ1c2UnKX1cbiAgXG4gICAgI2luY2x1ZGUgPGxvZ2RlcHRoYnVmX2ZyYWdtZW50PlxuXG4gICAgJHsodGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRNYXAnKSB8fCAnI2luY2x1ZGUgPG1hcF9mcmFnbWVudD4nKX1cblxuICAgICNpbmNsdWRlIDxjb2xvcl9mcmFnbWVudD5cbiAgICAjaW5jbHVkZSA8YWxwaGFtYXBfZnJhZ21lbnQ+XG4gICAgI2luY2x1ZGUgPGFscGhhdGVzdF9mcmFnbWVudD5cbiAgICAjaW5jbHVkZSA8c3BlY3VsYXJtYXBfZnJhZ21lbnQ+XG4gICAgI2luY2x1ZGUgPG5vcm1hbF9mcmFnbWVudD5cbiAgICBcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50RW1pc3NpdmUnKX1cbiAgICBcbiAgICAjaW5jbHVkZSA8ZW1pc3NpdmVtYXBfZnJhZ21lbnQ+XG4gIFxuICAgIC8vIGFjY3VtdWxhdGlvblxuICAgICNpbmNsdWRlIDxsaWdodHNfcGhvbmdfZnJhZ21lbnQ+XG4gICAgXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudFNwZWN1bGFyJyl9XG4gICAgXG4gICAgI2luY2x1ZGUgPGxpZ2h0c190ZW1wbGF0ZT5cbiAgXG4gICAgLy8gbW9kdWxhdGlvblxuICAgICNpbmNsdWRlIDxhb21hcF9mcmFnbWVudD5cbiAgXG4gICAgdmVjMyBvdXRnb2luZ0xpZ2h0ID0gcmVmbGVjdGVkTGlnaHQuZGlyZWN0RGlmZnVzZSArIHJlZmxlY3RlZExpZ2h0LmluZGlyZWN0RGlmZnVzZSArIHJlZmxlY3RlZExpZ2h0LmRpcmVjdFNwZWN1bGFyICsgcmVmbGVjdGVkTGlnaHQuaW5kaXJlY3RTcGVjdWxhciArIHRvdGFsRW1pc3NpdmVSYWRpYW5jZTtcbiAgXG4gICAgI2luY2x1ZGUgPGVudm1hcF9mcmFnbWVudD5cbiAgXG4gICAgZ2xfRnJhZ0NvbG9yID0gdmVjNCggb3V0Z29pbmdMaWdodCwgZGlmZnVzZUNvbG9yLmEgKTtcbiAgXG4gICAgI2luY2x1ZGUgPHRvbmVtYXBwaW5nX2ZyYWdtZW50PlxuICAgICNpbmNsdWRlIDxlbmNvZGluZ3NfZnJhZ21lbnQ+XG4gICAgI2luY2x1ZGUgPGZvZ19mcmFnbWVudD5cbiAgICAjaW5jbHVkZSA8cHJlbXVsdGlwbGllZF9hbHBoYV9mcmFnbWVudD5cbiAgICAjaW5jbHVkZSA8ZGl0aGVyaW5nX2ZyYWdtZW50PlxuICBcbiAgfWA7XG59O1xuXG5leHBvcnQgeyBQaG9uZ0FuaW1hdGlvbk1hdGVyaWFsIH07XG4iLCJpbXBvcnQgeyBTaGFkZXJMaWIgfSBmcm9tICd0aHJlZSc7XG5pbXBvcnQgQmFzZUFuaW1hdGlvbk1hdGVyaWFsIGZyb20gJy4vQmFzZUFuaW1hdGlvbk1hdGVyaWFsJztcblxuLyoqXG4gKiBFeHRlbmRzIFRIUkVFLk1lc2hTdGFuZGFyZE1hdGVyaWFsIHdpdGggY3VzdG9tIHNoYWRlciBjaHVua3MuXG4gKlxuICogQHNlZSBodHRwOi8vdGhyZWUtYmFzLWV4YW1wbGVzLnN1cmdlLnNoL2V4YW1wbGVzL21hdGVyaWFsc19zdGFuZGFyZC9cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gcGFyYW1ldGVycyBPYmplY3QgY29udGFpbmluZyBtYXRlcmlhbCBwcm9wZXJ0aWVzIGFuZCBjdXN0b20gc2hhZGVyIGNodW5rcy5cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBTdGFuZGFyZEFuaW1hdGlvbk1hdGVyaWFsKHBhcmFtZXRlcnMpIHtcbiAgdGhpcy52YXJ5aW5nUGFyYW1ldGVycyA9IFtdO1xuXG4gIHRoaXMudmVydGV4RnVuY3Rpb25zID0gW107XG4gIHRoaXMudmVydGV4UGFyYW1ldGVycyA9IFtdO1xuICB0aGlzLnZlcnRleEluaXQgPSBbXTtcbiAgdGhpcy52ZXJ0ZXhOb3JtYWwgPSBbXTtcbiAgdGhpcy52ZXJ0ZXhQb3NpdGlvbiA9IFtdO1xuICB0aGlzLnZlcnRleENvbG9yID0gW107XG5cbiAgdGhpcy5mcmFnbWVudEZ1bmN0aW9ucyA9IFtdO1xuICB0aGlzLmZyYWdtZW50UGFyYW1ldGVycyA9IFtdO1xuICB0aGlzLmZyYWdtZW50SW5pdCA9IFtdO1xuICB0aGlzLmZyYWdtZW50TWFwID0gW107XG4gIHRoaXMuZnJhZ21lbnREaWZmdXNlID0gW107XG4gIHRoaXMuZnJhZ21lbnRSb3VnaG5lc3MgPSBbXTtcbiAgdGhpcy5mcmFnbWVudE1ldGFsbmVzcyA9IFtdO1xuICB0aGlzLmZyYWdtZW50RW1pc3NpdmUgPSBbXTtcblxuICBCYXNlQW5pbWF0aW9uTWF0ZXJpYWwuY2FsbCh0aGlzLCBwYXJhbWV0ZXJzLCBTaGFkZXJMaWJbJ3N0YW5kYXJkJ10udW5pZm9ybXMpO1xuXG4gIHRoaXMubGlnaHRzID0gdHJ1ZTtcbiAgdGhpcy52ZXJ0ZXhTaGFkZXIgPSB0aGlzLmNvbmNhdFZlcnRleFNoYWRlcigpO1xuICB0aGlzLmZyYWdtZW50U2hhZGVyID0gdGhpcy5jb25jYXRGcmFnbWVudFNoYWRlcigpO1xufVxuU3RhbmRhcmRBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEJhc2VBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUpO1xuU3RhbmRhcmRBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBTdGFuZGFyZEFuaW1hdGlvbk1hdGVyaWFsO1xuXG5TdGFuZGFyZEFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZS5jb25jYXRWZXJ0ZXhTaGFkZXIgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiBgXG4gICNkZWZpbmUgUEhZU0lDQUxcblxuICB2YXJ5aW5nIHZlYzMgdlZpZXdQb3NpdGlvbjtcbiAgXG4gICNpZm5kZWYgRkxBVF9TSEFERURcbiAgXG4gICAgdmFyeWluZyB2ZWMzIHZOb3JtYWw7XG4gIFxuICAjZW5kaWZcbiAgXG4gICNpbmNsdWRlIDxjb21tb24+XG4gICNpbmNsdWRlIDx1dl9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPHV2Ml9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPGRpc3BsYWNlbWVudG1hcF9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPGNvbG9yX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8Zm9nX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8bW9ycGh0YXJnZXRfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxza2lubmluZ19wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPHNoYWRvd21hcF9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPGxvZ2RlcHRoYnVmX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX3BhcnNfdmVydGV4PlxuICBcbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQYXJhbWV0ZXJzJyl9XG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmFyeWluZ1BhcmFtZXRlcnMnKX1cbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhGdW5jdGlvbnMnKX1cbiAgXG4gIHZvaWQgbWFpbigpIHtcblxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4SW5pdCcpfVxuXG4gICAgI2luY2x1ZGUgPHV2X3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8dXYyX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8Y29sb3JfdmVydGV4PlxuICBcbiAgICAjaW5jbHVkZSA8YmVnaW5ub3JtYWxfdmVydGV4PlxuICAgIFxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4Tm9ybWFsJyl9XG4gICAgXG4gICAgI2luY2x1ZGUgPG1vcnBobm9ybWFsX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8c2tpbmJhc2VfdmVydGV4PlxuICAgICNpbmNsdWRlIDxza2lubm9ybWFsX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8ZGVmYXVsdG5vcm1hbF92ZXJ0ZXg+XG4gIFxuICAjaWZuZGVmIEZMQVRfU0hBREVEIC8vIE5vcm1hbCBjb21wdXRlZCB3aXRoIGRlcml2YXRpdmVzIHdoZW4gRkxBVF9TSEFERURcbiAgXG4gICAgdk5vcm1hbCA9IG5vcm1hbGl6ZSggdHJhbnNmb3JtZWROb3JtYWwgKTtcbiAgXG4gICNlbmRpZlxuICBcbiAgICAjaW5jbHVkZSA8YmVnaW5fdmVydGV4PlxuICAgIFxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UG9zaXRpb24nKX1cbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleENvbG9yJyl9XG4gICAgXG4gICAgI2luY2x1ZGUgPG1vcnBodGFyZ2V0X3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8c2tpbm5pbmdfdmVydGV4PlxuICAgICNpbmNsdWRlIDxkaXNwbGFjZW1lbnRtYXBfdmVydGV4PlxuICAgICNpbmNsdWRlIDxwcm9qZWN0X3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfdmVydGV4PlxuICAgICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfdmVydGV4PlxuICBcbiAgICB2Vmlld1Bvc2l0aW9uID0gLSBtdlBvc2l0aW9uLnh5ejtcbiAgXG4gICAgI2luY2x1ZGUgPHdvcmxkcG9zX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8c2hhZG93bWFwX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8Zm9nX3ZlcnRleD5cbiAgfWA7XG59O1xuXG5TdGFuZGFyZEFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZS5jb25jYXRGcmFnbWVudFNoYWRlciA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIGBcbiAgI2RlZmluZSBQSFlTSUNBTFxuICBcbiAgdW5pZm9ybSB2ZWMzIGRpZmZ1c2U7XG4gIHVuaWZvcm0gdmVjMyBlbWlzc2l2ZTtcbiAgdW5pZm9ybSBmbG9hdCByb3VnaG5lc3M7XG4gIHVuaWZvcm0gZmxvYXQgbWV0YWxuZXNzO1xuICB1bmlmb3JtIGZsb2F0IG9wYWNpdHk7XG4gIFxuICAjaWZuZGVmIFNUQU5EQVJEXG4gICAgdW5pZm9ybSBmbG9hdCBjbGVhckNvYXQ7XG4gICAgdW5pZm9ybSBmbG9hdCBjbGVhckNvYXRSb3VnaG5lc3M7XG4gICNlbmRpZlxuICBcbiAgdmFyeWluZyB2ZWMzIHZWaWV3UG9zaXRpb247XG4gIFxuICAjaWZuZGVmIEZMQVRfU0hBREVEXG4gIFxuICAgIHZhcnlpbmcgdmVjMyB2Tm9ybWFsO1xuICBcbiAgI2VuZGlmXG4gIFxuICAjaW5jbHVkZSA8Y29tbW9uPlxuICAjaW5jbHVkZSA8cGFja2luZz5cbiAgI2luY2x1ZGUgPGRpdGhlcmluZ19wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8Y29sb3JfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPHV2X3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDx1djJfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPG1hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8YWxwaGFtYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGFvbWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxsaWdodG1hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8ZW1pc3NpdmVtYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGVudm1hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8Zm9nX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxic2Rmcz5cbiAgI2luY2x1ZGUgPGN1YmVfdXZfcmVmbGVjdGlvbl9mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGxpZ2h0c19wYXJzPlxuICAjaW5jbHVkZSA8bGlnaHRzX3BoeXNpY2FsX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxzaGFkb3dtYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGJ1bXBtYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPG5vcm1hbG1hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8cm91Z2huZXNzbWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxtZXRhbG5lc3NtYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGxvZ2RlcHRoYnVmX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfcGFyc19mcmFnbWVudD5cbiAgXG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRQYXJhbWV0ZXJzJyl9XG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmFyeWluZ1BhcmFtZXRlcnMnKX1cbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudEZ1bmN0aW9ucycpfVxuICBcbiAgdm9pZCBtYWluKCkge1xuICBcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50SW5pdCcpfVxuICBcbiAgICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX2ZyYWdtZW50PlxuICBcbiAgICB2ZWM0IGRpZmZ1c2VDb2xvciA9IHZlYzQoIGRpZmZ1c2UsIG9wYWNpdHkgKTtcbiAgICBSZWZsZWN0ZWRMaWdodCByZWZsZWN0ZWRMaWdodCA9IFJlZmxlY3RlZExpZ2h0KCB2ZWMzKCAwLjAgKSwgdmVjMyggMC4wICksIHZlYzMoIDAuMCApLCB2ZWMzKCAwLjAgKSApO1xuICAgIHZlYzMgdG90YWxFbWlzc2l2ZVJhZGlhbmNlID0gZW1pc3NpdmU7XG4gIFxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnREaWZmdXNlJyl9XG4gIFxuICAgICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl9mcmFnbWVudD5cblxuICAgICR7KHRoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50TWFwJykgfHwgJyNpbmNsdWRlIDxtYXBfZnJhZ21lbnQ+Jyl9XG5cbiAgICAjaW5jbHVkZSA8Y29sb3JfZnJhZ21lbnQ+XG4gICAgI2luY2x1ZGUgPGFscGhhbWFwX2ZyYWdtZW50PlxuICAgICNpbmNsdWRlIDxhbHBoYXRlc3RfZnJhZ21lbnQ+XG4gICAgXG4gICAgZmxvYXQgcm91Z2huZXNzRmFjdG9yID0gcm91Z2huZXNzO1xuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRSb3VnaG5lc3MnKX1cbiAgICAjaWZkZWYgVVNFX1JPVUdITkVTU01BUFxuICAgIFxuICAgICAgdmVjNCB0ZXhlbFJvdWdobmVzcyA9IHRleHR1cmUyRCggcm91Z2huZXNzTWFwLCB2VXYgKTtcbiAgICBcbiAgICAgIC8vIHJlYWRzIGNoYW5uZWwgRywgY29tcGF0aWJsZSB3aXRoIGEgY29tYmluZWQgT2NjbHVzaW9uUm91Z2huZXNzTWV0YWxsaWMgKFJHQikgdGV4dHVyZVxuICAgICAgcm91Z2huZXNzRmFjdG9yICo9IHRleGVsUm91Z2huZXNzLmc7XG4gICAgXG4gICAgI2VuZGlmXG4gICAgXG4gICAgZmxvYXQgbWV0YWxuZXNzRmFjdG9yID0gbWV0YWxuZXNzO1xuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRNZXRhbG5lc3MnKX1cbiAgICAjaWZkZWYgVVNFX01FVEFMTkVTU01BUFxuICAgIFxuICAgICAgdmVjNCB0ZXhlbE1ldGFsbmVzcyA9IHRleHR1cmUyRCggbWV0YWxuZXNzTWFwLCB2VXYgKTtcbiAgICAgIG1ldGFsbmVzc0ZhY3RvciAqPSB0ZXhlbE1ldGFsbmVzcy5iO1xuICAgIFxuICAgICNlbmRpZlxuICAgIFxuICAgICNpbmNsdWRlIDxub3JtYWxfZnJhZ21lbnQ+XG4gICAgXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudEVtaXNzaXZlJyl9XG4gICAgXG4gICAgI2luY2x1ZGUgPGVtaXNzaXZlbWFwX2ZyYWdtZW50PlxuICBcbiAgICAvLyBhY2N1bXVsYXRpb25cbiAgICAjaW5jbHVkZSA8bGlnaHRzX3BoeXNpY2FsX2ZyYWdtZW50PlxuICAgICNpbmNsdWRlIDxsaWdodHNfdGVtcGxhdGU+XG4gIFxuICAgIC8vIG1vZHVsYXRpb25cbiAgICAjaW5jbHVkZSA8YW9tYXBfZnJhZ21lbnQ+XG4gIFxuICAgIHZlYzMgb3V0Z29pbmdMaWdodCA9IHJlZmxlY3RlZExpZ2h0LmRpcmVjdERpZmZ1c2UgKyByZWZsZWN0ZWRMaWdodC5pbmRpcmVjdERpZmZ1c2UgKyByZWZsZWN0ZWRMaWdodC5kaXJlY3RTcGVjdWxhciArIHJlZmxlY3RlZExpZ2h0LmluZGlyZWN0U3BlY3VsYXIgKyB0b3RhbEVtaXNzaXZlUmFkaWFuY2U7XG4gIFxuICAgIGdsX0ZyYWdDb2xvciA9IHZlYzQoIG91dGdvaW5nTGlnaHQsIGRpZmZ1c2VDb2xvci5hICk7XG4gIFxuICAgICNpbmNsdWRlIDx0b25lbWFwcGluZ19mcmFnbWVudD5cbiAgICAjaW5jbHVkZSA8ZW5jb2RpbmdzX2ZyYWdtZW50PlxuICAgICNpbmNsdWRlIDxmb2dfZnJhZ21lbnQ+XG4gICAgI2luY2x1ZGUgPHByZW11bHRpcGxpZWRfYWxwaGFfZnJhZ21lbnQ+XG4gICAgI2luY2x1ZGUgPGRpdGhlcmluZ19mcmFnbWVudD5cbiAgXG4gIH1gO1xufTtcblxuZXhwb3J0IHsgU3RhbmRhcmRBbmltYXRpb25NYXRlcmlhbCB9O1xuIiwiaW1wb3J0IHsgU2hhZGVyTGliIH0gZnJvbSAndGhyZWUnO1xuaW1wb3J0IEJhc2VBbmltYXRpb25NYXRlcmlhbCBmcm9tICcuL0Jhc2VBbmltYXRpb25NYXRlcmlhbCc7XG5cbi8qKlxuICogRXh0ZW5kcyBUSFJFRS5Qb2ludHNNYXRlcmlhbCB3aXRoIGN1c3RvbSBzaGFkZXIgY2h1bmtzLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBwYXJhbWV0ZXJzIE9iamVjdCBjb250YWluaW5nIG1hdGVyaWFsIHByb3BlcnRpZXMgYW5kIGN1c3RvbSBzaGFkZXIgY2h1bmtzLlxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIFBvaW50c0FuaW1hdGlvbk1hdGVyaWFsKHBhcmFtZXRlcnMpIHtcbiAgdGhpcy52YXJ5aW5nUGFyYW1ldGVycyA9IFtdO1xuICBcbiAgdGhpcy52ZXJ0ZXhGdW5jdGlvbnMgPSBbXTtcbiAgdGhpcy52ZXJ0ZXhQYXJhbWV0ZXJzID0gW107XG4gIHRoaXMudmVydGV4SW5pdCA9IFtdO1xuICB0aGlzLnZlcnRleFBvc2l0aW9uID0gW107XG4gIHRoaXMudmVydGV4Q29sb3IgPSBbXTtcbiAgXG4gIHRoaXMuZnJhZ21lbnRGdW5jdGlvbnMgPSBbXTtcbiAgdGhpcy5mcmFnbWVudFBhcmFtZXRlcnMgPSBbXTtcbiAgdGhpcy5mcmFnbWVudEluaXQgPSBbXTtcbiAgdGhpcy5mcmFnbWVudE1hcCA9IFtdO1xuICB0aGlzLmZyYWdtZW50RGlmZnVzZSA9IFtdO1xuICAvLyB1c2UgZnJhZ21lbnQgc2hhZGVyIHRvIHNoYXBlIHRvIHBvaW50LCByZWZlcmVuY2U6IGh0dHBzOi8vdGhlYm9va29mc2hhZGVycy5jb20vMDcvXG4gIHRoaXMuZnJhZ21lbnRTaGFwZSA9IFtdO1xuICBcbiAgQmFzZUFuaW1hdGlvbk1hdGVyaWFsLmNhbGwodGhpcywgcGFyYW1ldGVycywgU2hhZGVyTGliWydwb2ludHMnXS51bmlmb3Jtcyk7XG4gIFxuICB0aGlzLnZlcnRleFNoYWRlciA9IHRoaXMuY29uY2F0VmVydGV4U2hhZGVyKCk7XG4gIHRoaXMuZnJhZ21lbnRTaGFkZXIgPSB0aGlzLmNvbmNhdEZyYWdtZW50U2hhZGVyKCk7XG59XG5cblBvaW50c0FuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoQmFzZUFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZSk7XG5Qb2ludHNBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBQb2ludHNBbmltYXRpb25NYXRlcmlhbDtcblxuUG9pbnRzQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlLmNvbmNhdFZlcnRleFNoYWRlciA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIGBcbiAgdW5pZm9ybSBmbG9hdCBzaXplO1xuICB1bmlmb3JtIGZsb2F0IHNjYWxlO1xuICBcbiAgI2luY2x1ZGUgPGNvbW1vbj5cbiAgI2luY2x1ZGUgPGNvbG9yX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8Zm9nX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8c2hhZG93bWFwX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfcGFyc192ZXJ0ZXg+XG4gIFxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBhcmFtZXRlcnMnKX1cbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2YXJ5aW5nUGFyYW1ldGVycycpfVxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleEZ1bmN0aW9ucycpfVxuICBcbiAgdm9pZCBtYWluKCkge1xuICBcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleEluaXQnKX1cbiAgXG4gICAgI2luY2x1ZGUgPGNvbG9yX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8YmVnaW5fdmVydGV4PlxuICAgIFxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UG9zaXRpb24nKX1cbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleENvbG9yJyl9XG4gICAgXG4gICAgI2luY2x1ZGUgPHByb2plY3RfdmVydGV4PlxuICBcbiAgICAjaWZkZWYgVVNFX1NJWkVBVFRFTlVBVElPTlxuICAgICAgZ2xfUG9pbnRTaXplID0gc2l6ZSAqICggc2NhbGUgLyAtIG12UG9zaXRpb24ueiApO1xuICAgICNlbHNlXG4gICAgICBnbF9Qb2ludFNpemUgPSBzaXplO1xuICAgICNlbmRpZlxuICBcbiAgICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfdmVydGV4PlxuICAgICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfdmVydGV4PlxuICAgICNpbmNsdWRlIDx3b3JsZHBvc192ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPHNoYWRvd21hcF92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPGZvZ192ZXJ0ZXg+XG4gIH1gO1xufTtcblxuUG9pbnRzQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlLmNvbmNhdEZyYWdtZW50U2hhZGVyID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gYFxuICB1bmlmb3JtIHZlYzMgZGlmZnVzZTtcbiAgdW5pZm9ybSBmbG9hdCBvcGFjaXR5O1xuICBcbiAgI2luY2x1ZGUgPGNvbW1vbj5cbiAgI2luY2x1ZGUgPHBhY2tpbmc+XG4gICNpbmNsdWRlIDxjb2xvcl9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8bWFwX3BhcnRpY2xlX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxmb2dfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPHNoYWRvd21hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc19wYXJzX2ZyYWdtZW50PlxuICBcbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudFBhcmFtZXRlcnMnKX1cbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2YXJ5aW5nUGFyYW1ldGVycycpfVxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50RnVuY3Rpb25zJyl9XG4gIFxuICB2b2lkIG1haW4oKSB7XG4gIFxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRJbml0Jyl9XG4gIFxuICAgICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfZnJhZ21lbnQ+XG4gIFxuICAgIHZlYzMgb3V0Z29pbmdMaWdodCA9IHZlYzMoIDAuMCApO1xuICAgIHZlYzQgZGlmZnVzZUNvbG9yID0gdmVjNCggZGlmZnVzZSwgb3BhY2l0eSApO1xuICBcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50RGlmZnVzZScpfVxuICBcbiAgICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfZnJhZ21lbnQ+XG5cbiAgICAkeyh0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudE1hcCcpIHx8ICcjaW5jbHVkZSA8bWFwX3BhcnRpY2xlX2ZyYWdtZW50PicpfVxuXG4gICAgI2luY2x1ZGUgPGNvbG9yX2ZyYWdtZW50PlxuICAgICNpbmNsdWRlIDxhbHBoYXRlc3RfZnJhZ21lbnQ+XG4gIFxuICAgIG91dGdvaW5nTGlnaHQgPSBkaWZmdXNlQ29sb3IucmdiO1xuICBcbiAgICBnbF9GcmFnQ29sb3IgPSB2ZWM0KCBvdXRnb2luZ0xpZ2h0LCBkaWZmdXNlQ29sb3IuYSApO1xuICAgIFxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRTaGFwZScpfVxuICBcbiAgICAjaW5jbHVkZSA8cHJlbXVsdGlwbGllZF9hbHBoYV9mcmFnbWVudD5cbiAgICAjaW5jbHVkZSA8dG9uZW1hcHBpbmdfZnJhZ21lbnQ+XG4gICAgI2luY2x1ZGUgPGVuY29kaW5nc19mcmFnbWVudD5cbiAgICAjaW5jbHVkZSA8Zm9nX2ZyYWdtZW50PlxuICB9YDtcbn07XG5cbmV4cG9ydCB7IFBvaW50c0FuaW1hdGlvbk1hdGVyaWFsIH07XG4iLCJpbXBvcnQgeyBTaGFkZXJMaWIsIFVuaWZvcm1zVXRpbHMsIFJHQkFEZXB0aFBhY2tpbmcgfSBmcm9tICd0aHJlZSc7XG5pbXBvcnQgQmFzZUFuaW1hdGlvbk1hdGVyaWFsIGZyb20gJy4vQmFzZUFuaW1hdGlvbk1hdGVyaWFsJztcblxuZnVuY3Rpb24gRGVwdGhBbmltYXRpb25NYXRlcmlhbChwYXJhbWV0ZXJzKSB7XG4gIHRoaXMuZGVwdGhQYWNraW5nID0gUkdCQURlcHRoUGFja2luZztcbiAgdGhpcy5jbGlwcGluZyA9IHRydWU7XG5cbiAgdGhpcy52ZXJ0ZXhGdW5jdGlvbnMgPSBbXTtcbiAgdGhpcy52ZXJ0ZXhQYXJhbWV0ZXJzID0gW107XG4gIHRoaXMudmVydGV4SW5pdCA9IFtdO1xuICB0aGlzLnZlcnRleFBvc2l0aW9uID0gW107XG5cbiAgQmFzZUFuaW1hdGlvbk1hdGVyaWFsLmNhbGwodGhpcywgcGFyYW1ldGVycyk7XG4gIFxuICB0aGlzLnVuaWZvcm1zID0gVW5pZm9ybXNVdGlscy5tZXJnZShbU2hhZGVyTGliWydkZXB0aCddLnVuaWZvcm1zLCB0aGlzLnVuaWZvcm1zXSk7XG4gIHRoaXMudmVydGV4U2hhZGVyID0gdGhpcy5jb25jYXRWZXJ0ZXhTaGFkZXIoKTtcbiAgdGhpcy5mcmFnbWVudFNoYWRlciA9IFNoYWRlckxpYlsnZGVwdGgnXS5mcmFnbWVudFNoYWRlcjtcbn1cbkRlcHRoQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShCYXNlQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlKTtcbkRlcHRoQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gRGVwdGhBbmltYXRpb25NYXRlcmlhbDtcblxuRGVwdGhBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uY2F0VmVydGV4U2hhZGVyID0gZnVuY3Rpb24gKCkge1xuICBcbiAgcmV0dXJuIGBcbiAgI2luY2x1ZGUgPGNvbW1vbj5cbiAgI2luY2x1ZGUgPHV2X3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8ZGlzcGxhY2VtZW50bWFwX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8bW9ycGh0YXJnZXRfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxza2lubmluZ19wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPGxvZ2RlcHRoYnVmX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX3BhcnNfdmVydGV4PlxuICBcbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQYXJhbWV0ZXJzJyl9XG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4RnVuY3Rpb25zJyl9XG4gIFxuICB2b2lkIG1haW4oKSB7XG4gIFxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4SW5pdCcpfVxuICBcbiAgICAjaW5jbHVkZSA8dXZfdmVydGV4PlxuICBcbiAgICAjaW5jbHVkZSA8c2tpbmJhc2VfdmVydGV4PlxuICBcbiAgICAjaWZkZWYgVVNFX0RJU1BMQUNFTUVOVE1BUFxuICBcbiAgICAgICNpbmNsdWRlIDxiZWdpbm5vcm1hbF92ZXJ0ZXg+XG4gICAgICAjaW5jbHVkZSA8bW9ycGhub3JtYWxfdmVydGV4PlxuICAgICAgI2luY2x1ZGUgPHNraW5ub3JtYWxfdmVydGV4PlxuICBcbiAgICAjZW5kaWZcbiAgXG4gICAgI2luY2x1ZGUgPGJlZ2luX3ZlcnRleD5cbiAgICBcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBvc2l0aW9uJyl9XG5cbiAgICAjaW5jbHVkZSA8bW9ycGh0YXJnZXRfdmVydGV4PlxuICAgICNpbmNsdWRlIDxza2lubmluZ192ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPGRpc3BsYWNlbWVudG1hcF92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPHByb2plY3RfdmVydGV4PlxuICAgICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc192ZXJ0ZXg+XG4gIH1gO1xufTtcblxuZXhwb3J0IHsgRGVwdGhBbmltYXRpb25NYXRlcmlhbCB9O1xuIiwiaW1wb3J0IHsgU2hhZGVyTGliLCBVbmlmb3Jtc1V0aWxzLCBSR0JBRGVwdGhQYWNraW5nIH0gZnJvbSAndGhyZWUnO1xuaW1wb3J0IEJhc2VBbmltYXRpb25NYXRlcmlhbCBmcm9tICcuL0Jhc2VBbmltYXRpb25NYXRlcmlhbCc7XG5cbmZ1bmN0aW9uIERpc3RhbmNlQW5pbWF0aW9uTWF0ZXJpYWwocGFyYW1ldGVycykge1xuICB0aGlzLmRlcHRoUGFja2luZyA9IFJHQkFEZXB0aFBhY2tpbmc7XG4gIHRoaXMuY2xpcHBpbmcgPSB0cnVlO1xuXG4gIHRoaXMudmVydGV4RnVuY3Rpb25zID0gW107XG4gIHRoaXMudmVydGV4UGFyYW1ldGVycyA9IFtdO1xuICB0aGlzLnZlcnRleEluaXQgPSBbXTtcbiAgdGhpcy52ZXJ0ZXhQb3NpdGlvbiA9IFtdO1xuXG4gIEJhc2VBbmltYXRpb25NYXRlcmlhbC5jYWxsKHRoaXMsIHBhcmFtZXRlcnMpO1xuICBcbiAgdGhpcy51bmlmb3JtcyA9IFVuaWZvcm1zVXRpbHMubWVyZ2UoW1NoYWRlckxpYlsnZGlzdGFuY2VSR0JBJ10udW5pZm9ybXMsIHRoaXMudW5pZm9ybXNdKTtcbiAgdGhpcy52ZXJ0ZXhTaGFkZXIgPSB0aGlzLmNvbmNhdFZlcnRleFNoYWRlcigpO1xuICB0aGlzLmZyYWdtZW50U2hhZGVyID0gU2hhZGVyTGliWydkaXN0YW5jZVJHQkEnXS5mcmFnbWVudFNoYWRlcjtcbn1cbkRpc3RhbmNlQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShCYXNlQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlKTtcbkRpc3RhbmNlQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gRGlzdGFuY2VBbmltYXRpb25NYXRlcmlhbDtcblxuRGlzdGFuY2VBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uY2F0VmVydGV4U2hhZGVyID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gYFxuICAjZGVmaW5lIERJU1RBTkNFXG5cbiAgdmFyeWluZyB2ZWMzIHZXb3JsZFBvc2l0aW9uO1xuICBcbiAgI2luY2x1ZGUgPGNvbW1vbj5cbiAgI2luY2x1ZGUgPHV2X3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8ZGlzcGxhY2VtZW50bWFwX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8bW9ycGh0YXJnZXRfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxza2lubmluZ19wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc19wYXJzX3ZlcnRleD5cbiAgXG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UGFyYW1ldGVycycpfVxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleEZ1bmN0aW9ucycpfVxuICBcbiAgdm9pZCBtYWluKCkge1xuXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhJbml0Jyl9XG4gIFxuICAgICNpbmNsdWRlIDx1dl92ZXJ0ZXg+XG4gIFxuICAgICNpbmNsdWRlIDxza2luYmFzZV92ZXJ0ZXg+XG4gIFxuICAgICNpZmRlZiBVU0VfRElTUExBQ0VNRU5UTUFQXG4gIFxuICAgICAgI2luY2x1ZGUgPGJlZ2lubm9ybWFsX3ZlcnRleD5cbiAgICAgICNpbmNsdWRlIDxtb3JwaG5vcm1hbF92ZXJ0ZXg+XG4gICAgICAjaW5jbHVkZSA8c2tpbm5vcm1hbF92ZXJ0ZXg+XG4gIFxuICAgICNlbmRpZlxuICBcbiAgICAjaW5jbHVkZSA8YmVnaW5fdmVydGV4PlxuICAgIFxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UG9zaXRpb24nKX1cblxuICAgICNpbmNsdWRlIDxtb3JwaHRhcmdldF92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPHNraW5uaW5nX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8ZGlzcGxhY2VtZW50bWFwX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8cHJvamVjdF92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPHdvcmxkcG9zX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX3ZlcnRleD5cbiAgXG4gICAgdldvcmxkUG9zaXRpb24gPSB3b3JsZFBvc2l0aW9uLnh5ejtcbiAgXG4gIH1gO1xufTtcblxuZXhwb3J0IHsgRGlzdGFuY2VBbmltYXRpb25NYXRlcmlhbCB9O1xuIiwiaW1wb3J0IHsgQnVmZmVyR2VvbWV0cnksIEJ1ZmZlckF0dHJpYnV0ZSB9IGZyb20gJ3RocmVlJztcbi8qKlxuICogQSBUSFJFRS5CdWZmZXJHZW9tZXRyeSB3aGVyZSBhICdwcmVmYWInIGdlb21ldHJ5IGlzIHJlcGVhdGVkIGEgbnVtYmVyIG9mIHRpbWVzLlxuICpcbiAqIEBwYXJhbSB7VEhSRUUuR2VvbWV0cnl9IHByZWZhYiBUaGUgVEhSRUUuR2VvbWV0cnkgaW5zdGFuY2UgdG8gcmVwZWF0LlxuICogQHBhcmFtIHtOdW1iZXJ9IGNvdW50IFRoZSBudW1iZXIgb2YgdGltZXMgdG8gcmVwZWF0IHRoZSBnZW9tZXRyeS5cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBQcmVmYWJCdWZmZXJHZW9tZXRyeShwcmVmYWIsIGNvdW50KSB7XG4gIEJ1ZmZlckdlb21ldHJ5LmNhbGwodGhpcyk7XG4gIFxuICAvKipcbiAgICogQSByZWZlcmVuY2UgdG8gdGhlIHByZWZhYiBnZW9tZXRyeSB1c2VkIHRvIGNyZWF0ZSB0aGlzIGluc3RhbmNlLlxuICAgKiBAdHlwZSB7VEhSRUUuR2VvbWV0cnl9XG4gICAqL1xuICB0aGlzLnByZWZhYkdlb21ldHJ5ID0gcHJlZmFiO1xuICB0aGlzLmlzUHJlZmFiQnVmZmVyR2VvbWV0cnkgPSBwcmVmYWIuaXNCdWZmZXJHZW9tZXRyeTtcbiAgXG4gIC8qKlxuICAgKiBOdW1iZXIgb2YgcHJlZmFicy5cbiAgICogQHR5cGUge051bWJlcn1cbiAgICovXG4gIHRoaXMucHJlZmFiQ291bnQgPSBjb3VudDtcbiAgXG4gIC8qKlxuICAgKiBOdW1iZXIgb2YgdmVydGljZXMgb2YgdGhlIHByZWZhYi5cbiAgICogQHR5cGUge051bWJlcn1cbiAgICovXG4gIGlmICh0aGlzLmlzUHJlZmFiQnVmZmVyR2VvbWV0cnkpIHtcbiAgICB0aGlzLnByZWZhYlZlcnRleENvdW50ID0gcHJlZmFiLmF0dHJpYnV0ZXMucG9zaXRpb24uY291bnQ7XG4gIH1cbiAgZWxzZSB7XG4gICAgdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudCA9IHByZWZhYi52ZXJ0aWNlcy5sZW5ndGg7XG4gIH1cblxuICB0aGlzLmJ1ZmZlckluZGljZXMoKTtcbiAgdGhpcy5idWZmZXJQb3NpdGlvbnMoKTtcbn1cblByZWZhYkJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlKTtcblByZWZhYkJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFByZWZhYkJ1ZmZlckdlb21ldHJ5O1xuXG5QcmVmYWJCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuYnVmZmVySW5kaWNlcyA9IGZ1bmN0aW9uKCkge1xuICBsZXQgcHJlZmFiSW5kaWNlcyA9IFtdO1xuICBsZXQgcHJlZmFiSW5kZXhDb3VudDtcblxuICBpZiAodGhpcy5pc1ByZWZhYkJ1ZmZlckdlb21ldHJ5KSB7XG4gICAgaWYgKHRoaXMucHJlZmFiR2VvbWV0cnkuaW5kZXgpIHtcbiAgICAgIHByZWZhYkluZGV4Q291bnQgPSB0aGlzLnByZWZhYkdlb21ldHJ5LmluZGV4LmNvdW50O1xuICAgICAgcHJlZmFiSW5kaWNlcyA9IHRoaXMucHJlZmFiR2VvbWV0cnkuaW5kZXguYXJyYXk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgcHJlZmFiSW5kZXhDb3VudCA9IHRoaXMucHJlZmFiVmVydGV4Q291bnQ7XG5cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHJlZmFiSW5kZXhDb3VudDsgaSsrKSB7XG4gICAgICAgIHByZWZhYkluZGljZXMucHVzaChpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgZWxzZSB7XG4gICAgY29uc3QgcHJlZmFiRmFjZUNvdW50ID0gdGhpcy5wcmVmYWJHZW9tZXRyeS5mYWNlcy5sZW5ndGg7XG4gICAgcHJlZmFiSW5kZXhDb3VudCA9IHByZWZhYkZhY2VDb3VudCAqIDM7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHByZWZhYkZhY2VDb3VudDsgaSsrKSB7XG4gICAgICBjb25zdCBmYWNlID0gdGhpcy5wcmVmYWJHZW9tZXRyeS5mYWNlc1tpXTtcbiAgICAgIHByZWZhYkluZGljZXMucHVzaChmYWNlLmEsIGZhY2UuYiwgZmFjZS5jKTtcbiAgICB9XG4gIH1cblxuICBjb25zdCBpbmRleEJ1ZmZlciA9IG5ldyBVaW50MzJBcnJheSh0aGlzLnByZWZhYkNvdW50ICogcHJlZmFiSW5kZXhDb3VudCk7XG5cbiAgdGhpcy5zZXRJbmRleChuZXcgQnVmZmVyQXR0cmlidXRlKGluZGV4QnVmZmVyLCAxKSk7XG4gIFxuICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucHJlZmFiQ291bnQ7IGkrKykge1xuICAgIGZvciAobGV0IGsgPSAwOyBrIDwgcHJlZmFiSW5kZXhDb3VudDsgaysrKSB7XG4gICAgICBpbmRleEJ1ZmZlcltpICogcHJlZmFiSW5kZXhDb3VudCArIGtdID0gcHJlZmFiSW5kaWNlc1trXSArIGkgKiB0aGlzLnByZWZhYlZlcnRleENvdW50O1xuICAgIH1cbiAgfVxufTtcblxuUHJlZmFiQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmJ1ZmZlclBvc2l0aW9ucyA9IGZ1bmN0aW9uKCkge1xuICBjb25zdCBwb3NpdGlvbkJ1ZmZlciA9IHRoaXMuY3JlYXRlQXR0cmlidXRlKCdwb3NpdGlvbicsIDMpLmFycmF5O1xuXG4gIGlmICh0aGlzLmlzUHJlZmFiQnVmZmVyR2VvbWV0cnkpIHtcbiAgICBjb25zdCBwb3NpdGlvbnMgPSB0aGlzLnByZWZhYkdlb21ldHJ5LmF0dHJpYnV0ZXMucG9zaXRpb24uYXJyYXk7XG5cbiAgICBmb3IgKGxldCBpID0gMCwgb2Zmc2V0ID0gMDsgaSA8IHRoaXMucHJlZmFiQ291bnQ7IGkrKykge1xuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCB0aGlzLnByZWZhYlZlcnRleENvdW50OyBqKyssIG9mZnNldCArPSAzKSB7XG4gICAgICAgIHBvc2l0aW9uQnVmZmVyW29mZnNldCAgICBdID0gcG9zaXRpb25zW2ogKiAzXTtcbiAgICAgICAgcG9zaXRpb25CdWZmZXJbb2Zmc2V0ICsgMV0gPSBwb3NpdGlvbnNbaiAqIDMgKyAxXTtcbiAgICAgICAgcG9zaXRpb25CdWZmZXJbb2Zmc2V0ICsgMl0gPSBwb3NpdGlvbnNbaiAqIDMgKyAyXTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgZWxzZSB7XG4gICAgZm9yIChsZXQgaSA9IDAsIG9mZnNldCA9IDA7IGkgPCB0aGlzLnByZWZhYkNvdW50OyBpKyspIHtcbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudDsgaisrLCBvZmZzZXQgKz0gMykge1xuICAgICAgICBjb25zdCBwcmVmYWJWZXJ0ZXggPSB0aGlzLnByZWZhYkdlb21ldHJ5LnZlcnRpY2VzW2pdO1xuXG4gICAgICAgIHBvc2l0aW9uQnVmZmVyW29mZnNldCAgICBdID0gcHJlZmFiVmVydGV4Lng7XG4gICAgICAgIHBvc2l0aW9uQnVmZmVyW29mZnNldCArIDFdID0gcHJlZmFiVmVydGV4Lnk7XG4gICAgICAgIHBvc2l0aW9uQnVmZmVyW29mZnNldCArIDJdID0gcHJlZmFiVmVydGV4Lno7XG4gICAgICB9XG4gICAgfVxuICB9XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBUSFJFRS5CdWZmZXJBdHRyaWJ1dGUgd2l0aCBVViBjb29yZGluYXRlcy5cbiAqL1xuUHJlZmFiQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmJ1ZmZlclV2cyA9IGZ1bmN0aW9uKCkge1xuICBjb25zdCBwcmVmYWJVdnMgPSBbXTtcblxuICBpZiAodGhpcy5pc1ByZWZhYkJ1ZmZlckdlb21ldHJ5KSB7XG4gICAgY29uc3QgdXYgPSB0aGlzLnByZWZhYkdlb21ldHJ5LmF0dHJpYnV0ZXMudXYuYXJyYXk7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucHJlZmFiVmVydGV4Q291bnQ7IGkrKykge1xuICAgICAgcHJlZmFiVXZzLnB1c2gobmV3IFRIUkVFLlZlY3RvcjIodXZbaSAqIDJdLCB1dltpICogMiArIDFdKSk7XG4gICAgfVxuICB9XG4gIGVsc2Uge1xuICAgIGNvbnN0IHByZWZhYkZhY2VDb3VudCA9IHRoaXMucHJlZmFiR2VvbWV0cnkuZmFjZXMubGVuZ3RoO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcmVmYWJGYWNlQ291bnQ7IGkrKykge1xuICAgICAgY29uc3QgZmFjZSA9IHRoaXMucHJlZmFiR2VvbWV0cnkuZmFjZXNbaV07XG4gICAgICBjb25zdCB1diA9IHRoaXMucHJlZmFiR2VvbWV0cnkuZmFjZVZlcnRleFV2c1swXVtpXTtcblxuICAgICAgcHJlZmFiVXZzW2ZhY2UuYV0gPSB1dlswXTtcbiAgICAgIHByZWZhYlV2c1tmYWNlLmJdID0gdXZbMV07XG4gICAgICBwcmVmYWJVdnNbZmFjZS5jXSA9IHV2WzJdO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IHV2QnVmZmVyID0gdGhpcy5jcmVhdGVBdHRyaWJ1dGUoJ3V2JywgMik7XG4gIFxuICBmb3IgKGxldCBpID0gMCwgb2Zmc2V0ID0gMDsgaSA8IHRoaXMucHJlZmFiQ291bnQ7IGkrKykge1xuICAgIGZvciAobGV0IGogPSAwOyBqIDwgdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudDsgaisrLCBvZmZzZXQgKz0gMikge1xuICAgICAgbGV0IHByZWZhYlV2ID0gcHJlZmFiVXZzW2pdO1xuICAgICAgXG4gICAgICB1dkJ1ZmZlci5hcnJheVtvZmZzZXRdID0gcHJlZmFiVXYueDtcbiAgICAgIHV2QnVmZmVyLmFycmF5W29mZnNldCArIDFdID0gcHJlZmFiVXYueTtcbiAgICB9XG4gIH1cbn07XG5cbi8qKlxuICogQ3JlYXRlcyBhIFRIUkVFLkJ1ZmZlckF0dHJpYnV0ZSBvbiB0aGlzIGdlb21ldHJ5IGluc3RhbmNlLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIE5hbWUgb2YgdGhlIGF0dHJpYnV0ZS5cbiAqIEBwYXJhbSB7TnVtYmVyfSBpdGVtU2l6ZSBOdW1iZXIgb2YgZmxvYXRzIHBlciB2ZXJ0ZXggKHR5cGljYWxseSAxLCAyLCAzIG9yIDQpLlxuICogQHBhcmFtIHtmdW5jdGlvbj19IGZhY3RvcnkgRnVuY3Rpb24gdGhhdCB3aWxsIGJlIGNhbGxlZCBmb3IgZWFjaCBwcmVmYWIgdXBvbiBjcmVhdGlvbi4gQWNjZXB0cyAzIGFyZ3VtZW50czogZGF0YVtdLCBpbmRleCBhbmQgcHJlZmFiQ291bnQuIENhbGxzIHNldFByZWZhYkRhdGEuXG4gKlxuICogQHJldHVybnMge1RIUkVFLkJ1ZmZlckF0dHJpYnV0ZX1cbiAqL1xuUHJlZmFiQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmNyZWF0ZUF0dHJpYnV0ZSA9IGZ1bmN0aW9uKG5hbWUsIGl0ZW1TaXplLCBmYWN0b3J5KSB7XG4gIGNvbnN0IGJ1ZmZlciA9IG5ldyBGbG9hdDMyQXJyYXkodGhpcy5wcmVmYWJDb3VudCAqIHRoaXMucHJlZmFiVmVydGV4Q291bnQgKiBpdGVtU2l6ZSk7XG4gIGNvbnN0IGF0dHJpYnV0ZSA9IG5ldyBCdWZmZXJBdHRyaWJ1dGUoYnVmZmVyLCBpdGVtU2l6ZSk7XG4gIFxuICB0aGlzLmFkZEF0dHJpYnV0ZShuYW1lLCBhdHRyaWJ1dGUpO1xuICBcbiAgaWYgKGZhY3RvcnkpIHtcbiAgICBjb25zdCBkYXRhID0gW107XG4gICAgXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnByZWZhYkNvdW50OyBpKyspIHtcbiAgICAgIGZhY3RvcnkoZGF0YSwgaSwgdGhpcy5wcmVmYWJDb3VudCk7XG4gICAgICB0aGlzLnNldFByZWZhYkRhdGEoYXR0cmlidXRlLCBpLCBkYXRhKTtcbiAgICB9XG4gIH1cbiAgXG4gIHJldHVybiBhdHRyaWJ1dGU7XG59O1xuXG4vKipcbiAqIFNldHMgZGF0YSBmb3IgYWxsIHZlcnRpY2VzIG9mIGEgcHJlZmFiIGF0IGEgZ2l2ZW4gaW5kZXguXG4gKiBVc3VhbGx5IGNhbGxlZCBpbiBhIGxvb3AuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd8VEhSRUUuQnVmZmVyQXR0cmlidXRlfSBhdHRyaWJ1dGUgVGhlIGF0dHJpYnV0ZSBvciBhdHRyaWJ1dGUgbmFtZSB3aGVyZSB0aGUgZGF0YSBpcyB0byBiZSBzdG9yZWQuXG4gKiBAcGFyYW0ge051bWJlcn0gcHJlZmFiSW5kZXggSW5kZXggb2YgdGhlIHByZWZhYiBpbiB0aGUgYnVmZmVyIGdlb21ldHJ5LlxuICogQHBhcmFtIHtBcnJheX0gZGF0YSBBcnJheSBvZiBkYXRhLiBMZW5ndGggc2hvdWxkIGJlIGVxdWFsIHRvIGl0ZW0gc2l6ZSBvZiB0aGUgYXR0cmlidXRlLlxuICovXG5QcmVmYWJCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuc2V0UHJlZmFiRGF0YSA9IGZ1bmN0aW9uKGF0dHJpYnV0ZSwgcHJlZmFiSW5kZXgsIGRhdGEpIHtcbiAgYXR0cmlidXRlID0gKHR5cGVvZiBhdHRyaWJ1dGUgPT09ICdzdHJpbmcnKSA/IHRoaXMuYXR0cmlidXRlc1thdHRyaWJ1dGVdIDogYXR0cmlidXRlO1xuICBcbiAgbGV0IG9mZnNldCA9IHByZWZhYkluZGV4ICogdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudCAqIGF0dHJpYnV0ZS5pdGVtU2l6ZTtcbiAgXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudDsgaSsrKSB7XG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCBhdHRyaWJ1dGUuaXRlbVNpemU7IGorKykge1xuICAgICAgYXR0cmlidXRlLmFycmF5W29mZnNldCsrXSA9IGRhdGFbal07XG4gICAgfVxuICB9XG59O1xuXG5leHBvcnQgeyBQcmVmYWJCdWZmZXJHZW9tZXRyeSB9O1xuIiwiaW1wb3J0IHsgTWF0aCBhcyB0TWF0aCwgVmVjdG9yMyB9IGZyb20gJ3RocmVlJztcbmltcG9ydCB7IERlcHRoQW5pbWF0aW9uTWF0ZXJpYWwgfSBmcm9tICcuL21hdGVyaWFscy9EZXB0aEFuaW1hdGlvbk1hdGVyaWFsJztcbmltcG9ydCB7IERpc3RhbmNlQW5pbWF0aW9uTWF0ZXJpYWwgfSBmcm9tICcuL21hdGVyaWFscy9EaXN0YW5jZUFuaW1hdGlvbk1hdGVyaWFsJztcblxuLyoqXG4gKiBDb2xsZWN0aW9uIG9mIHV0aWxpdHkgZnVuY3Rpb25zLlxuICogQG5hbWVzcGFjZVxuICovXG5jb25zdCBVdGlscyA9IHtcbiAgLyoqXG4gICAqIER1cGxpY2F0ZXMgdmVydGljZXMgc28gZWFjaCBmYWNlIGJlY29tZXMgc2VwYXJhdGUuXG4gICAqIFNhbWUgYXMgVEhSRUUuRXhwbG9kZU1vZGlmaWVyLlxuICAgKlxuICAgKiBAcGFyYW0ge1RIUkVFLkdlb21ldHJ5fSBnZW9tZXRyeSBHZW9tZXRyeSBpbnN0YW5jZSB0byBtb2RpZnkuXG4gICAqL1xuICBzZXBhcmF0ZUZhY2VzOiBmdW5jdGlvbiAoZ2VvbWV0cnkpIHtcbiAgICBsZXQgdmVydGljZXMgPSBbXTtcblxuICAgIGZvciAobGV0IGkgPSAwLCBpbCA9IGdlb21ldHJ5LmZhY2VzLmxlbmd0aDsgaSA8IGlsOyBpKyspIHtcbiAgICAgIGxldCBuID0gdmVydGljZXMubGVuZ3RoO1xuICAgICAgbGV0IGZhY2UgPSBnZW9tZXRyeS5mYWNlc1tpXTtcblxuICAgICAgbGV0IGEgPSBmYWNlLmE7XG4gICAgICBsZXQgYiA9IGZhY2UuYjtcbiAgICAgIGxldCBjID0gZmFjZS5jO1xuXG4gICAgICBsZXQgdmEgPSBnZW9tZXRyeS52ZXJ0aWNlc1thXTtcbiAgICAgIGxldCB2YiA9IGdlb21ldHJ5LnZlcnRpY2VzW2JdO1xuICAgICAgbGV0IHZjID0gZ2VvbWV0cnkudmVydGljZXNbY107XG5cbiAgICAgIHZlcnRpY2VzLnB1c2godmEuY2xvbmUoKSk7XG4gICAgICB2ZXJ0aWNlcy5wdXNoKHZiLmNsb25lKCkpO1xuICAgICAgdmVydGljZXMucHVzaCh2Yy5jbG9uZSgpKTtcblxuICAgICAgZmFjZS5hID0gbjtcbiAgICAgIGZhY2UuYiA9IG4gKyAxO1xuICAgICAgZmFjZS5jID0gbiArIDI7XG4gICAgfVxuXG4gICAgZ2VvbWV0cnkudmVydGljZXMgPSB2ZXJ0aWNlcztcbiAgfSxcblxuICAvKipcbiAgICogQ29tcHV0ZSB0aGUgY2VudHJvaWQgKGNlbnRlcikgb2YgYSBUSFJFRS5GYWNlMy5cbiAgICpcbiAgICogQHBhcmFtIHtUSFJFRS5HZW9tZXRyeX0gZ2VvbWV0cnkgR2VvbWV0cnkgaW5zdGFuY2UgdGhlIGZhY2UgaXMgaW4uXG4gICAqIEBwYXJhbSB7VEhSRUUuRmFjZTN9IGZhY2UgRmFjZSBvYmplY3QgZnJvbSB0aGUgVEhSRUUuR2VvbWV0cnkuZmFjZXMgYXJyYXlcbiAgICogQHBhcmFtIHtUSFJFRS5WZWN0b3IzPX0gdiBPcHRpb25hbCB2ZWN0b3IgdG8gc3RvcmUgcmVzdWx0IGluLlxuICAgKiBAcmV0dXJucyB7VEhSRUUuVmVjdG9yM31cbiAgICovXG4gIGNvbXB1dGVDZW50cm9pZDogZnVuY3Rpb24oZ2VvbWV0cnksIGZhY2UsIHYpIHtcbiAgICBsZXQgYSA9IGdlb21ldHJ5LnZlcnRpY2VzW2ZhY2UuYV07XG4gICAgbGV0IGIgPSBnZW9tZXRyeS52ZXJ0aWNlc1tmYWNlLmJdO1xuICAgIGxldCBjID0gZ2VvbWV0cnkudmVydGljZXNbZmFjZS5jXTtcblxuICAgIHYgPSB2IHx8IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG5cbiAgICB2LnggPSAoYS54ICsgYi54ICsgYy54KSAvIDM7XG4gICAgdi55ID0gKGEueSArIGIueSArIGMueSkgLyAzO1xuICAgIHYueiA9IChhLnogKyBiLnogKyBjLnopIC8gMztcblxuICAgIHJldHVybiB2O1xuICB9LFxuXG4gIC8qKlxuICAgKiBHZXQgYSByYW5kb20gdmVjdG9yIGJldHdlZW4gYm94Lm1pbiBhbmQgYm94Lm1heC5cbiAgICpcbiAgICogQHBhcmFtIHtUSFJFRS5Cb3gzfSBib3ggVEhSRUUuQm94MyBpbnN0YW5jZS5cbiAgICogQHBhcmFtIHtUSFJFRS5WZWN0b3IzPX0gdiBPcHRpb25hbCB2ZWN0b3IgdG8gc3RvcmUgcmVzdWx0IGluLlxuICAgKiBAcmV0dXJucyB7VEhSRUUuVmVjdG9yM31cbiAgICovXG4gIHJhbmRvbUluQm94OiBmdW5jdGlvbihib3gsIHYpIHtcbiAgICB2ID0gdiB8fCBuZXcgVmVjdG9yMygpO1xuXG4gICAgdi54ID0gdE1hdGgucmFuZEZsb2F0KGJveC5taW4ueCwgYm94Lm1heC54KTtcbiAgICB2LnkgPSB0TWF0aC5yYW5kRmxvYXQoYm94Lm1pbi55LCBib3gubWF4LnkpO1xuICAgIHYueiA9IHRNYXRoLnJhbmRGbG9hdChib3gubWluLnosIGJveC5tYXgueik7XG5cbiAgICByZXR1cm4gdjtcbiAgfSxcblxuICAvKipcbiAgICogR2V0IGEgcmFuZG9tIGF4aXMgZm9yIHF1YXRlcm5pb24gcm90YXRpb24uXG4gICAqXG4gICAqIEBwYXJhbSB7VEhSRUUuVmVjdG9yMz19IHYgT3B0aW9uIHZlY3RvciB0byBzdG9yZSByZXN1bHQgaW4uXG4gICAqIEByZXR1cm5zIHtUSFJFRS5WZWN0b3IzfVxuICAgKi9cbiAgcmFuZG9tQXhpczogZnVuY3Rpb24odikge1xuICAgIHYgPSB2IHx8IG5ldyBWZWN0b3IzKCk7XG5cbiAgICB2LnggPSB0TWF0aC5yYW5kRmxvYXRTcHJlYWQoMi4wKTtcbiAgICB2LnkgPSB0TWF0aC5yYW5kRmxvYXRTcHJlYWQoMi4wKTtcbiAgICB2LnogPSB0TWF0aC5yYW5kRmxvYXRTcHJlYWQoMi4wKTtcbiAgICB2Lm5vcm1hbGl6ZSgpO1xuXG4gICAgcmV0dXJuIHY7XG4gIH0sXG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIFRIUkVFLkJBUy5EZXB0aEFuaW1hdGlvbk1hdGVyaWFsIGZvciBzaGFkb3dzIGZyb20gYSBUSFJFRS5TcG90TGlnaHQgb3IgVEhSRUUuRGlyZWN0aW9uYWxMaWdodCBieSBjb3B5aW5nIHJlbGV2YW50IHNoYWRlciBjaHVua3MuXG4gICAqIFVuaWZvcm0gdmFsdWVzIG11c3QgYmUgbWFudWFsbHkgc3luY2VkIGJldHdlZW4gdGhlIHNvdXJjZSBtYXRlcmlhbCBhbmQgdGhlIGRlcHRoIG1hdGVyaWFsLlxuICAgKlxuICAgKiBAc2VlIHtAbGluayBodHRwOi8vdGhyZWUtYmFzLWV4YW1wbGVzLnN1cmdlLnNoL2V4YW1wbGVzL3NoYWRvd3MvfVxuICAgKlxuICAgKiBAcGFyYW0ge1RIUkVFLkJBUy5CYXNlQW5pbWF0aW9uTWF0ZXJpYWx9IHNvdXJjZU1hdGVyaWFsIEluc3RhbmNlIHRvIGdldCB0aGUgc2hhZGVyIGNodW5rcyBmcm9tLlxuICAgKiBAcmV0dXJucyB7VEhSRUUuQkFTLkRlcHRoQW5pbWF0aW9uTWF0ZXJpYWx9XG4gICAqL1xuICBjcmVhdGVEZXB0aEFuaW1hdGlvbk1hdGVyaWFsOiBmdW5jdGlvbihzb3VyY2VNYXRlcmlhbCkge1xuICAgIHJldHVybiBuZXcgRGVwdGhBbmltYXRpb25NYXRlcmlhbCh7XG4gICAgICB1bmlmb3Jtczogc291cmNlTWF0ZXJpYWwudW5pZm9ybXMsXG4gICAgICBkZWZpbmVzOiBzb3VyY2VNYXRlcmlhbC5kZWZpbmVzLFxuICAgICAgdmVydGV4RnVuY3Rpb25zOiBzb3VyY2VNYXRlcmlhbC52ZXJ0ZXhGdW5jdGlvbnMsXG4gICAgICB2ZXJ0ZXhQYXJhbWV0ZXJzOiBzb3VyY2VNYXRlcmlhbC52ZXJ0ZXhQYXJhbWV0ZXJzLFxuICAgICAgdmVydGV4SW5pdDogc291cmNlTWF0ZXJpYWwudmVydGV4SW5pdCxcbiAgICAgIHZlcnRleFBvc2l0aW9uOiBzb3VyY2VNYXRlcmlhbC52ZXJ0ZXhQb3NpdGlvblxuICAgIH0pO1xuICB9LFxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBUSFJFRS5CQVMuRGlzdGFuY2VBbmltYXRpb25NYXRlcmlhbCBmb3Igc2hhZG93cyBmcm9tIGEgVEhSRUUuUG9pbnRMaWdodCBieSBjb3B5aW5nIHJlbGV2YW50IHNoYWRlciBjaHVua3MuXG4gICAqIFVuaWZvcm0gdmFsdWVzIG11c3QgYmUgbWFudWFsbHkgc3luY2VkIGJldHdlZW4gdGhlIHNvdXJjZSBtYXRlcmlhbCBhbmQgdGhlIGRpc3RhbmNlIG1hdGVyaWFsLlxuICAgKlxuICAgKiBAc2VlIHtAbGluayBodHRwOi8vdGhyZWUtYmFzLWV4YW1wbGVzLnN1cmdlLnNoL2V4YW1wbGVzL3NoYWRvd3MvfVxuICAgKlxuICAgKiBAcGFyYW0ge1RIUkVFLkJBUy5CYXNlQW5pbWF0aW9uTWF0ZXJpYWx9IHNvdXJjZU1hdGVyaWFsIEluc3RhbmNlIHRvIGdldCB0aGUgc2hhZGVyIGNodW5rcyBmcm9tLlxuICAgKiBAcmV0dXJucyB7VEhSRUUuQkFTLkRpc3RhbmNlQW5pbWF0aW9uTWF0ZXJpYWx9XG4gICAqL1xuICBjcmVhdGVEaXN0YW5jZUFuaW1hdGlvbk1hdGVyaWFsOiBmdW5jdGlvbihzb3VyY2VNYXRlcmlhbCkge1xuICAgIHJldHVybiBuZXcgRGlzdGFuY2VBbmltYXRpb25NYXRlcmlhbCh7XG4gICAgICB1bmlmb3Jtczogc291cmNlTWF0ZXJpYWwudW5pZm9ybXMsXG4gICAgICBkZWZpbmVzOiBzb3VyY2VNYXRlcmlhbC5kZWZpbmVzLFxuICAgICAgdmVydGV4RnVuY3Rpb25zOiBzb3VyY2VNYXRlcmlhbC52ZXJ0ZXhGdW5jdGlvbnMsXG4gICAgICB2ZXJ0ZXhQYXJhbWV0ZXJzOiBzb3VyY2VNYXRlcmlhbC52ZXJ0ZXhQYXJhbWV0ZXJzLFxuICAgICAgdmVydGV4SW5pdDogc291cmNlTWF0ZXJpYWwudmVydGV4SW5pdCxcbiAgICAgIHZlcnRleFBvc2l0aW9uOiBzb3VyY2VNYXRlcmlhbC52ZXJ0ZXhQb3NpdGlvblxuICAgIH0pO1xuICB9XG59O1xuXG5leHBvcnQgeyBVdGlscyB9O1xuIiwiaW1wb3J0IHsgQnVmZmVyR2VvbWV0cnksIEJ1ZmZlckF0dHJpYnV0ZSB9IGZyb20gJ3RocmVlJztcbmltcG9ydCB7IFV0aWxzIH0gZnJvbSAnLi4vVXRpbHMnO1xuXG4vKipcbiAqIEEgVEhSRUUuQnVmZmVyR2VvbWV0cnkgZm9yIGFuaW1hdGluZyBpbmRpdmlkdWFsIGZhY2VzIG9mIGEgVEhSRUUuR2VvbWV0cnkuXG4gKlxuICogQHBhcmFtIHtUSFJFRS5HZW9tZXRyeX0gbW9kZWwgVGhlIFRIUkVFLkdlb21ldHJ5IHRvIGJhc2UgdGhpcyBnZW9tZXRyeSBvbi5cbiAqIEBwYXJhbSB7T2JqZWN0PX0gb3B0aW9uc1xuICogQHBhcmFtIHtCb29sZWFuPX0gb3B0aW9ucy5jb21wdXRlQ2VudHJvaWRzIElmIHRydWUsIGEgY2VudHJvaWRzIHdpbGwgYmUgY29tcHV0ZWQgZm9yIGVhY2ggZmFjZSBhbmQgc3RvcmVkIGluIFRIUkVFLkJBUy5Nb2RlbEJ1ZmZlckdlb21ldHJ5LmNlbnRyb2lkcy5cbiAqIEBwYXJhbSB7Qm9vbGVhbj19IG9wdGlvbnMubG9jYWxpemVGYWNlcyBJZiB0cnVlLCB0aGUgcG9zaXRpb25zIGZvciBlYWNoIGZhY2Ugd2lsbCBiZSBzdG9yZWQgcmVsYXRpdmUgdG8gdGhlIGNlbnRyb2lkLiBUaGlzIGlzIHVzZWZ1bCBpZiB5b3Ugd2FudCB0byByb3RhdGUgb3Igc2NhbGUgZmFjZXMgYXJvdW5kIHRoZWlyIGNlbnRlci5cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBNb2RlbEJ1ZmZlckdlb21ldHJ5KG1vZGVsLCBvcHRpb25zKSB7XG4gIEJ1ZmZlckdlb21ldHJ5LmNhbGwodGhpcyk7XG5cbiAgLyoqXG4gICAqIEEgcmVmZXJlbmNlIHRvIHRoZSBnZW9tZXRyeSB1c2VkIHRvIGNyZWF0ZSB0aGlzIGluc3RhbmNlLlxuICAgKiBAdHlwZSB7VEhSRUUuR2VvbWV0cnl9XG4gICAqL1xuICB0aGlzLm1vZGVsR2VvbWV0cnkgPSBtb2RlbDtcblxuICAvKipcbiAgICogTnVtYmVyIG9mIGZhY2VzIG9mIHRoZSBtb2RlbC5cbiAgICogQHR5cGUge051bWJlcn1cbiAgICovXG4gIHRoaXMuZmFjZUNvdW50ID0gdGhpcy5tb2RlbEdlb21ldHJ5LmZhY2VzLmxlbmd0aDtcblxuICAvKipcbiAgICogTnVtYmVyIG9mIHZlcnRpY2VzIG9mIHRoZSBtb2RlbC5cbiAgICogQHR5cGUge051bWJlcn1cbiAgICovXG4gIHRoaXMudmVydGV4Q291bnQgPSB0aGlzLm1vZGVsR2VvbWV0cnkudmVydGljZXMubGVuZ3RoO1xuXG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICBvcHRpb25zLmNvbXB1dGVDZW50cm9pZHMgJiYgdGhpcy5jb21wdXRlQ2VudHJvaWRzKCk7XG5cbiAgdGhpcy5idWZmZXJJbmRpY2VzKCk7XG4gIHRoaXMuYnVmZmVyUG9zaXRpb25zKG9wdGlvbnMubG9jYWxpemVGYWNlcyk7XG59XG5Nb2RlbEJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlKTtcbk1vZGVsQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gTW9kZWxCdWZmZXJHZW9tZXRyeTtcblxuLyoqXG4gKiBDb21wdXRlcyBhIGNlbnRyb2lkIGZvciBlYWNoIGZhY2UgYW5kIHN0b3JlcyBpdCBpbiBUSFJFRS5CQVMuTW9kZWxCdWZmZXJHZW9tZXRyeS5jZW50cm9pZHMuXG4gKi9cbk1vZGVsQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmNvbXB1dGVDZW50cm9pZHMgPSBmdW5jdGlvbigpIHtcbiAgLyoqXG4gICAqIEFuIGFycmF5IG9mIGNlbnRyb2lkcyBjb3JyZXNwb25kaW5nIHRvIHRoZSBmYWNlcyBvZiB0aGUgbW9kZWwuXG4gICAqXG4gICAqIEB0eXBlIHtBcnJheX1cbiAgICovXG4gIHRoaXMuY2VudHJvaWRzID0gW107XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmZhY2VDb3VudDsgaSsrKSB7XG4gICAgdGhpcy5jZW50cm9pZHNbaV0gPSBVdGlscy5jb21wdXRlQ2VudHJvaWQodGhpcy5tb2RlbEdlb21ldHJ5LCB0aGlzLm1vZGVsR2VvbWV0cnkuZmFjZXNbaV0pO1xuICB9XG59O1xuXG5Nb2RlbEJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5idWZmZXJJbmRpY2VzID0gZnVuY3Rpb24oKSB7XG4gIGNvbnN0IGluZGV4QnVmZmVyID0gbmV3IFVpbnQzMkFycmF5KHRoaXMuZmFjZUNvdW50ICogMyk7XG5cbiAgdGhpcy5zZXRJbmRleChuZXcgQnVmZmVyQXR0cmlidXRlKGluZGV4QnVmZmVyLCAxKSk7XG5cbiAgZm9yIChsZXQgaSA9IDAsIG9mZnNldCA9IDA7IGkgPCB0aGlzLmZhY2VDb3VudDsgaSsrLCBvZmZzZXQgKz0gMykge1xuICAgIGNvbnN0IGZhY2UgPSB0aGlzLm1vZGVsR2VvbWV0cnkuZmFjZXNbaV07XG5cbiAgICBpbmRleEJ1ZmZlcltvZmZzZXQgICAgXSA9IGZhY2UuYTtcbiAgICBpbmRleEJ1ZmZlcltvZmZzZXQgKyAxXSA9IGZhY2UuYjtcbiAgICBpbmRleEJ1ZmZlcltvZmZzZXQgKyAyXSA9IGZhY2UuYztcbiAgfVxufTtcblxuTW9kZWxCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuYnVmZmVyUG9zaXRpb25zID0gZnVuY3Rpb24obG9jYWxpemVGYWNlcykge1xuICBjb25zdCBwb3NpdGlvbkJ1ZmZlciA9IHRoaXMuY3JlYXRlQXR0cmlidXRlKCdwb3NpdGlvbicsIDMpLmFycmF5O1xuICBsZXQgaSwgb2Zmc2V0O1xuXG4gIGlmIChsb2NhbGl6ZUZhY2VzID09PSB0cnVlKSB7XG4gICAgZm9yIChpID0gMDsgaSA8IHRoaXMuZmFjZUNvdW50OyBpKyspIHtcbiAgICAgIGNvbnN0IGZhY2UgPSB0aGlzLm1vZGVsR2VvbWV0cnkuZmFjZXNbaV07XG4gICAgICBjb25zdCBjZW50cm9pZCA9IHRoaXMuY2VudHJvaWRzID8gdGhpcy5jZW50cm9pZHNbaV0gOiBUSFJFRS5CQVMuVXRpbHMuY29tcHV0ZUNlbnRyb2lkKHRoaXMubW9kZWxHZW9tZXRyeSwgZmFjZSk7XG5cbiAgICAgIGNvbnN0IGEgPSB0aGlzLm1vZGVsR2VvbWV0cnkudmVydGljZXNbZmFjZS5hXTtcbiAgICAgIGNvbnN0IGIgPSB0aGlzLm1vZGVsR2VvbWV0cnkudmVydGljZXNbZmFjZS5iXTtcbiAgICAgIGNvbnN0IGMgPSB0aGlzLm1vZGVsR2VvbWV0cnkudmVydGljZXNbZmFjZS5jXTtcblxuICAgICAgcG9zaXRpb25CdWZmZXJbZmFjZS5hICogM10gICAgID0gYS54IC0gY2VudHJvaWQueDtcbiAgICAgIHBvc2l0aW9uQnVmZmVyW2ZhY2UuYSAqIDMgKyAxXSA9IGEueSAtIGNlbnRyb2lkLnk7XG4gICAgICBwb3NpdGlvbkJ1ZmZlcltmYWNlLmEgKiAzICsgMl0gPSBhLnogLSBjZW50cm9pZC56O1xuXG4gICAgICBwb3NpdGlvbkJ1ZmZlcltmYWNlLmIgKiAzXSAgICAgPSBiLnggLSBjZW50cm9pZC54O1xuICAgICAgcG9zaXRpb25CdWZmZXJbZmFjZS5iICogMyArIDFdID0gYi55IC0gY2VudHJvaWQueTtcbiAgICAgIHBvc2l0aW9uQnVmZmVyW2ZhY2UuYiAqIDMgKyAyXSA9IGIueiAtIGNlbnRyb2lkLno7XG5cbiAgICAgIHBvc2l0aW9uQnVmZmVyW2ZhY2UuYyAqIDNdICAgICA9IGMueCAtIGNlbnRyb2lkLng7XG4gICAgICBwb3NpdGlvbkJ1ZmZlcltmYWNlLmMgKiAzICsgMV0gPSBjLnkgLSBjZW50cm9pZC55O1xuICAgICAgcG9zaXRpb25CdWZmZXJbZmFjZS5jICogMyArIDJdID0gYy56IC0gY2VudHJvaWQuejtcbiAgICB9XG4gIH1cbiAgZWxzZSB7XG4gICAgZm9yIChpID0gMCwgb2Zmc2V0ID0gMDsgaSA8IHRoaXMudmVydGV4Q291bnQ7IGkrKywgb2Zmc2V0ICs9IDMpIHtcbiAgICAgIGNvbnN0IHZlcnRleCA9IHRoaXMubW9kZWxHZW9tZXRyeS52ZXJ0aWNlc1tpXTtcblxuICAgICAgcG9zaXRpb25CdWZmZXJbb2Zmc2V0ICAgIF0gPSB2ZXJ0ZXgueDtcbiAgICAgIHBvc2l0aW9uQnVmZmVyW29mZnNldCArIDFdID0gdmVydGV4Lnk7XG4gICAgICBwb3NpdGlvbkJ1ZmZlcltvZmZzZXQgKyAyXSA9IHZlcnRleC56O1xuICAgIH1cbiAgfVxufTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgVEhSRUUuQnVmZmVyQXR0cmlidXRlIHdpdGggVVYgY29vcmRpbmF0ZXMuXG4gKi9cbk1vZGVsQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmJ1ZmZlclVWcyA9IGZ1bmN0aW9uKCkge1xuICBjb25zdCB1dkJ1ZmZlciA9IHRoaXMuY3JlYXRlQXR0cmlidXRlKCd1dicsIDIpLmFycmF5O1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5mYWNlQ291bnQ7IGkrKykge1xuXG4gICAgY29uc3QgZmFjZSA9IHRoaXMubW9kZWxHZW9tZXRyeS5mYWNlc1tpXTtcbiAgICBsZXQgdXY7XG5cbiAgICB1diA9IHRoaXMubW9kZWxHZW9tZXRyeS5mYWNlVmVydGV4VXZzWzBdW2ldWzBdO1xuICAgIHV2QnVmZmVyW2ZhY2UuYSAqIDJdICAgICA9IHV2Lng7XG4gICAgdXZCdWZmZXJbZmFjZS5hICogMiArIDFdID0gdXYueTtcblxuICAgIHV2ID0gdGhpcy5tb2RlbEdlb21ldHJ5LmZhY2VWZXJ0ZXhVdnNbMF1baV1bMV07XG4gICAgdXZCdWZmZXJbZmFjZS5iICogMl0gICAgID0gdXYueDtcbiAgICB1dkJ1ZmZlcltmYWNlLmIgKiAyICsgMV0gPSB1di55O1xuXG4gICAgdXYgPSB0aGlzLm1vZGVsR2VvbWV0cnkuZmFjZVZlcnRleFV2c1swXVtpXVsyXTtcbiAgICB1dkJ1ZmZlcltmYWNlLmMgKiAyXSAgICAgPSB1di54O1xuICAgIHV2QnVmZmVyW2ZhY2UuYyAqIDIgKyAxXSA9IHV2Lnk7XG4gIH1cbn07XG5cbi8qKlxuICogQ3JlYXRlcyB0d28gVEhSRUUuQnVmZmVyQXR0cmlidXRlczogc2tpbkluZGV4IGFuZCBza2luV2VpZ2h0LiBCb3RoIGFyZSByZXF1aXJlZCBmb3Igc2tpbm5pbmcuXG4gKi9cbk1vZGVsQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmJ1ZmZlclNraW5uaW5nID0gZnVuY3Rpb24oKSB7XG4gIGNvbnN0IHNraW5JbmRleEJ1ZmZlciA9IHRoaXMuY3JlYXRlQXR0cmlidXRlKCdza2luSW5kZXgnLCA0KS5hcnJheTtcbiAgY29uc3Qgc2tpbldlaWdodEJ1ZmZlciA9IHRoaXMuY3JlYXRlQXR0cmlidXRlKCdza2luV2VpZ2h0JywgNCkuYXJyYXk7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnZlcnRleENvdW50OyBpKyspIHtcbiAgICBjb25zdCBza2luSW5kZXggPSB0aGlzLm1vZGVsR2VvbWV0cnkuc2tpbkluZGljZXNbaV07XG4gICAgY29uc3Qgc2tpbldlaWdodCA9IHRoaXMubW9kZWxHZW9tZXRyeS5za2luV2VpZ2h0c1tpXTtcblxuICAgIHNraW5JbmRleEJ1ZmZlcltpICogNCAgICBdID0gc2tpbkluZGV4Lng7XG4gICAgc2tpbkluZGV4QnVmZmVyW2kgKiA0ICsgMV0gPSBza2luSW5kZXgueTtcbiAgICBza2luSW5kZXhCdWZmZXJbaSAqIDQgKyAyXSA9IHNraW5JbmRleC56O1xuICAgIHNraW5JbmRleEJ1ZmZlcltpICogNCArIDNdID0gc2tpbkluZGV4Lnc7XG5cbiAgICBza2luV2VpZ2h0QnVmZmVyW2kgKiA0ICAgIF0gPSBza2luV2VpZ2h0Lng7XG4gICAgc2tpbldlaWdodEJ1ZmZlcltpICogNCArIDFdID0gc2tpbldlaWdodC55O1xuICAgIHNraW5XZWlnaHRCdWZmZXJbaSAqIDQgKyAyXSA9IHNraW5XZWlnaHQuejtcbiAgICBza2luV2VpZ2h0QnVmZmVyW2kgKiA0ICsgM10gPSBza2luV2VpZ2h0Lnc7XG4gIH1cbn07XG5cbi8qKlxuICogQ3JlYXRlcyBhIFRIUkVFLkJ1ZmZlckF0dHJpYnV0ZSBvbiB0aGlzIGdlb21ldHJ5IGluc3RhbmNlLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIE5hbWUgb2YgdGhlIGF0dHJpYnV0ZS5cbiAqIEBwYXJhbSB7aW50fSBpdGVtU2l6ZSBOdW1iZXIgb2YgZmxvYXRzIHBlciB2ZXJ0ZXggKHR5cGljYWxseSAxLCAyLCAzIG9yIDQpLlxuICogQHBhcmFtIHtmdW5jdGlvbj19IGZhY3RvcnkgRnVuY3Rpb24gdGhhdCB3aWxsIGJlIGNhbGxlZCBmb3IgZWFjaCBmYWNlIHVwb24gY3JlYXRpb24uIEFjY2VwdHMgMyBhcmd1bWVudHM6IGRhdGFbXSwgaW5kZXggYW5kIGZhY2VDb3VudC4gQ2FsbHMgc2V0RmFjZURhdGEuXG4gKlxuICogQHJldHVybnMge1RIUkVFLkJ1ZmZlckF0dHJpYnV0ZX1cbiAqL1xuTW9kZWxCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuY3JlYXRlQXR0cmlidXRlID0gZnVuY3Rpb24obmFtZSwgaXRlbVNpemUsIGZhY3RvcnkpIHtcbiAgY29uc3QgYnVmZmVyID0gbmV3IEZsb2F0MzJBcnJheSh0aGlzLnZlcnRleENvdW50ICogaXRlbVNpemUpO1xuICBjb25zdCBhdHRyaWJ1dGUgPSBuZXcgVEhSRUUuQnVmZmVyQXR0cmlidXRlKGJ1ZmZlciwgaXRlbVNpemUpO1xuXG4gIHRoaXMuYWRkQXR0cmlidXRlKG5hbWUsIGF0dHJpYnV0ZSk7XG5cbiAgaWYgKGZhY3RvcnkpIHtcbiAgICBjb25zdCBkYXRhID0gW107XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuZmFjZUNvdW50OyBpKyspIHtcbiAgICAgIGZhY3RvcnkoZGF0YSwgaSwgdGhpcy5mYWNlQ291bnQpO1xuICAgICAgdGhpcy5zZXRGYWNlRGF0YShhdHRyaWJ1dGUsIGksIGRhdGEpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBhdHRyaWJ1dGU7XG59O1xuXG4vKipcbiAqIFNldHMgZGF0YSBmb3IgYWxsIHZlcnRpY2VzIG9mIGEgZmFjZSBhdCBhIGdpdmVuIGluZGV4LlxuICogVXN1YWxseSBjYWxsZWQgaW4gYSBsb29wLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfFRIUkVFLkJ1ZmZlckF0dHJpYnV0ZX0gYXR0cmlidXRlIFRoZSBhdHRyaWJ1dGUgb3IgYXR0cmlidXRlIG5hbWUgd2hlcmUgdGhlIGRhdGEgaXMgdG8gYmUgc3RvcmVkLlxuICogQHBhcmFtIHtpbnR9IGZhY2VJbmRleCBJbmRleCBvZiB0aGUgZmFjZSBpbiB0aGUgYnVmZmVyIGdlb21ldHJ5LlxuICogQHBhcmFtIHtBcnJheX0gZGF0YSBBcnJheSBvZiBkYXRhLiBMZW5ndGggc2hvdWxkIGJlIGVxdWFsIHRvIGl0ZW0gc2l6ZSBvZiB0aGUgYXR0cmlidXRlLlxuICovXG5Nb2RlbEJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5zZXRGYWNlRGF0YSA9IGZ1bmN0aW9uKGF0dHJpYnV0ZSwgZmFjZUluZGV4LCBkYXRhKSB7XG4gIGF0dHJpYnV0ZSA9ICh0eXBlb2YgYXR0cmlidXRlID09PSAnc3RyaW5nJykgPyB0aGlzLmF0dHJpYnV0ZXNbYXR0cmlidXRlXSA6IGF0dHJpYnV0ZTtcblxuICBsZXQgb2Zmc2V0ID0gZmFjZUluZGV4ICogMyAqIGF0dHJpYnV0ZS5pdGVtU2l6ZTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IDM7IGkrKykge1xuICAgIGZvciAobGV0IGogPSAwOyBqIDwgYXR0cmlidXRlLml0ZW1TaXplOyBqKyspIHtcbiAgICAgIGF0dHJpYnV0ZS5hcnJheVtvZmZzZXQrK10gPSBkYXRhW2pdO1xuICAgIH1cbiAgfVxufTtcblxuZXhwb3J0IHsgTW9kZWxCdWZmZXJHZW9tZXRyeSB9O1xuIiwiaW1wb3J0IHsgQnVmZmVyR2VvbWV0cnksIEJ1ZmZlckF0dHJpYnV0ZSB9IGZyb20gJ3RocmVlJztcblxuLyoqXG4gKiBBIFRIUkVFLkJ1ZmZlckdlb21ldHJ5IGNvbnNpc3RzIG9mIHBvaW50cy5cbiAqIEBwYXJhbSB7TnVtYmVyfSBjb3VudCBUaGUgbnVtYmVyIG9mIHBvaW50cy5cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBQb2ludEJ1ZmZlckdlb21ldHJ5KGNvdW50KSB7XG4gIEJ1ZmZlckdlb21ldHJ5LmNhbGwodGhpcyk7XG5cbiAgLyoqXG4gICAqIE51bWJlciBvZiBwb2ludHMuXG4gICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAqL1xuICB0aGlzLnBvaW50Q291bnQgPSBjb3VudDtcblxuICB0aGlzLmJ1ZmZlclBvc2l0aW9ucygpO1xufVxuUG9pbnRCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZSk7XG5Qb2ludEJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFBvaW50QnVmZmVyR2VvbWV0cnk7XG5cblBvaW50QnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmJ1ZmZlclBvc2l0aW9ucyA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLmNyZWF0ZUF0dHJpYnV0ZSgncG9zaXRpb24nLCAzKTtcbn07XG5cbi8qKlxuICogQ3JlYXRlcyBhIFRIUkVFLkJ1ZmZlckF0dHJpYnV0ZSBvbiB0aGlzIGdlb21ldHJ5IGluc3RhbmNlLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIE5hbWUgb2YgdGhlIGF0dHJpYnV0ZS5cbiAqIEBwYXJhbSB7TnVtYmVyfSBpdGVtU2l6ZSBOdW1iZXIgb2YgZmxvYXRzIHBlciB2ZXJ0ZXggKHR5cGljYWxseSAxLCAyLCAzIG9yIDQpLlxuICogQHBhcmFtIHtmdW5jdGlvbj19IGZhY3RvcnkgRnVuY3Rpb24gdGhhdCB3aWxsIGJlIGNhbGxlZCBmb3IgZWFjaCBwb2ludCB1cG9uIGNyZWF0aW9uLiBBY2NlcHRzIDMgYXJndW1lbnRzOiBkYXRhW10sIGluZGV4IGFuZCBwcmVmYWJDb3VudC4gQ2FsbHMgc2V0UHJlZmFiRGF0YS5cbiAqXG4gKiBAcmV0dXJucyB7VEhSRUUuQnVmZmVyQXR0cmlidXRlfVxuICovXG5Qb2ludEJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5jcmVhdGVBdHRyaWJ1dGUgPSBmdW5jdGlvbihuYW1lLCBpdGVtU2l6ZSwgZmFjdG9yeSkge1xuICBjb25zdCBidWZmZXIgPSBuZXcgRmxvYXQzMkFycmF5KHRoaXMucG9pbnRDb3VudCAqIGl0ZW1TaXplKTtcbiAgY29uc3QgYXR0cmlidXRlID0gbmV3IEJ1ZmZlckF0dHJpYnV0ZShidWZmZXIsIGl0ZW1TaXplKTtcblxuICB0aGlzLmFkZEF0dHJpYnV0ZShuYW1lLCBhdHRyaWJ1dGUpO1xuXG4gIGlmIChmYWN0b3J5KSB7XG4gICAgY29uc3QgZGF0YSA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5wb2ludENvdW50OyBpKyspIHtcbiAgICAgIGZhY3RvcnkoZGF0YSwgaSwgdGhpcy5wb2ludENvdW50KTtcbiAgICAgIHRoaXMuc2V0UG9pbnREYXRhKGF0dHJpYnV0ZSwgaSwgZGF0YSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGF0dHJpYnV0ZTtcbn07XG5cblBvaW50QnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLnNldFBvaW50RGF0YSA9IGZ1bmN0aW9uKGF0dHJpYnV0ZSwgcG9pbnRJbmRleCwgZGF0YSkge1xuICBhdHRyaWJ1dGUgPSAodHlwZW9mIGF0dHJpYnV0ZSA9PT0gJ3N0cmluZycpID8gdGhpcy5hdHRyaWJ1dGVzW2F0dHJpYnV0ZV0gOiBhdHRyaWJ1dGU7XG5cbiAgbGV0IG9mZnNldCA9IHBvaW50SW5kZXggKiBhdHRyaWJ1dGUuaXRlbVNpemU7XG5cbiAgZm9yIChsZXQgaiA9IDA7IGogPCBhdHRyaWJ1dGUuaXRlbVNpemU7IGorKykge1xuICAgIGF0dHJpYnV0ZS5hcnJheVtvZmZzZXQrK10gPSBkYXRhW2pdO1xuICB9XG59O1xuXG5leHBvcnQgeyBQb2ludEJ1ZmZlckdlb21ldHJ5IH07XG4iLCIvLyBnZW5lcmF0ZWQgYnkgc2NyaXB0cy9idWlsZF9zaGFkZXJfY2h1bmtzLmpzXG5cbmltcG9ydCBjYXRtdWxsX3JvbV9zcGxpbmUgZnJvbSAnLi9nbHNsL2NhdG11bGxfcm9tX3NwbGluZS5nbHNsJztcbmltcG9ydCBjdWJpY19iZXppZXIgZnJvbSAnLi9nbHNsL2N1YmljX2Jlemllci5nbHNsJztcbmltcG9ydCBlYXNlX2JhY2tfaW4gZnJvbSAnLi9nbHNsL2Vhc2VfYmFja19pbi5nbHNsJztcbmltcG9ydCBlYXNlX2JhY2tfaW5fb3V0IGZyb20gJy4vZ2xzbC9lYXNlX2JhY2tfaW5fb3V0Lmdsc2wnO1xuaW1wb3J0IGVhc2VfYmFja19vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfYmFja19vdXQuZ2xzbCc7XG5pbXBvcnQgZWFzZV9iZXppZXIgZnJvbSAnLi9nbHNsL2Vhc2VfYmV6aWVyLmdsc2wnO1xuaW1wb3J0IGVhc2VfYm91bmNlX2luIGZyb20gJy4vZ2xzbC9lYXNlX2JvdW5jZV9pbi5nbHNsJztcbmltcG9ydCBlYXNlX2JvdW5jZV9pbl9vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfYm91bmNlX2luX291dC5nbHNsJztcbmltcG9ydCBlYXNlX2JvdW5jZV9vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfYm91bmNlX291dC5nbHNsJztcbmltcG9ydCBlYXNlX2NpcmNfaW4gZnJvbSAnLi9nbHNsL2Vhc2VfY2lyY19pbi5nbHNsJztcbmltcG9ydCBlYXNlX2NpcmNfaW5fb3V0IGZyb20gJy4vZ2xzbC9lYXNlX2NpcmNfaW5fb3V0Lmdsc2wnO1xuaW1wb3J0IGVhc2VfY2lyY19vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfY2lyY19vdXQuZ2xzbCc7XG5pbXBvcnQgZWFzZV9jdWJpY19pbiBmcm9tICcuL2dsc2wvZWFzZV9jdWJpY19pbi5nbHNsJztcbmltcG9ydCBlYXNlX2N1YmljX2luX291dCBmcm9tICcuL2dsc2wvZWFzZV9jdWJpY19pbl9vdXQuZ2xzbCc7XG5pbXBvcnQgZWFzZV9jdWJpY19vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfY3ViaWNfb3V0Lmdsc2wnO1xuaW1wb3J0IGVhc2VfZWxhc3RpY19pbiBmcm9tICcuL2dsc2wvZWFzZV9lbGFzdGljX2luLmdsc2wnO1xuaW1wb3J0IGVhc2VfZWxhc3RpY19pbl9vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfZWxhc3RpY19pbl9vdXQuZ2xzbCc7XG5pbXBvcnQgZWFzZV9lbGFzdGljX291dCBmcm9tICcuL2dsc2wvZWFzZV9lbGFzdGljX291dC5nbHNsJztcbmltcG9ydCBlYXNlX2V4cG9faW4gZnJvbSAnLi9nbHNsL2Vhc2VfZXhwb19pbi5nbHNsJztcbmltcG9ydCBlYXNlX2V4cG9faW5fb3V0IGZyb20gJy4vZ2xzbC9lYXNlX2V4cG9faW5fb3V0Lmdsc2wnO1xuaW1wb3J0IGVhc2VfZXhwb19vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfZXhwb19vdXQuZ2xzbCc7XG5pbXBvcnQgZWFzZV9xdWFkX2luIGZyb20gJy4vZ2xzbC9lYXNlX3F1YWRfaW4uZ2xzbCc7XG5pbXBvcnQgZWFzZV9xdWFkX2luX291dCBmcm9tICcuL2dsc2wvZWFzZV9xdWFkX2luX291dC5nbHNsJztcbmltcG9ydCBlYXNlX3F1YWRfb3V0IGZyb20gJy4vZ2xzbC9lYXNlX3F1YWRfb3V0Lmdsc2wnO1xuaW1wb3J0IGVhc2VfcXVhcnRfaW4gZnJvbSAnLi9nbHNsL2Vhc2VfcXVhcnRfaW4uZ2xzbCc7XG5pbXBvcnQgZWFzZV9xdWFydF9pbl9vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfcXVhcnRfaW5fb3V0Lmdsc2wnO1xuaW1wb3J0IGVhc2VfcXVhcnRfb3V0IGZyb20gJy4vZ2xzbC9lYXNlX3F1YXJ0X291dC5nbHNsJztcbmltcG9ydCBlYXNlX3F1aW50X2luIGZyb20gJy4vZ2xzbC9lYXNlX3F1aW50X2luLmdsc2wnO1xuaW1wb3J0IGVhc2VfcXVpbnRfaW5fb3V0IGZyb20gJy4vZ2xzbC9lYXNlX3F1aW50X2luX291dC5nbHNsJztcbmltcG9ydCBlYXNlX3F1aW50X291dCBmcm9tICcuL2dsc2wvZWFzZV9xdWludF9vdXQuZ2xzbCc7XG5pbXBvcnQgZWFzZV9zaW5lX2luIGZyb20gJy4vZ2xzbC9lYXNlX3NpbmVfaW4uZ2xzbCc7XG5pbXBvcnQgZWFzZV9zaW5lX2luX291dCBmcm9tICcuL2dsc2wvZWFzZV9zaW5lX2luX291dC5nbHNsJztcbmltcG9ydCBlYXNlX3NpbmVfb3V0IGZyb20gJy4vZ2xzbC9lYXNlX3NpbmVfb3V0Lmdsc2wnO1xuaW1wb3J0IHF1YXRlcm5pb25fcm90YXRpb24gZnJvbSAnLi9nbHNsL3F1YXRlcm5pb25fcm90YXRpb24uZ2xzbCc7XG5pbXBvcnQgcXVhdGVybmlvbl9zbGVycCBmcm9tICcuL2dsc2wvcXVhdGVybmlvbl9zbGVycC5nbHNsJztcblxuXG5leHBvcnQgY29uc3QgU2hhZGVyQ2h1bmsgPSB7XG4gIGNhdG11bGxfcm9tX3NwbGluZTogY2F0bXVsbF9yb21fc3BsaW5lLFxuICBjdWJpY19iZXppZXI6IGN1YmljX2JlemllcixcbiAgZWFzZV9iYWNrX2luOiBlYXNlX2JhY2tfaW4sXG4gIGVhc2VfYmFja19pbl9vdXQ6IGVhc2VfYmFja19pbl9vdXQsXG4gIGVhc2VfYmFja19vdXQ6IGVhc2VfYmFja19vdXQsXG4gIGVhc2VfYmV6aWVyOiBlYXNlX2JlemllcixcbiAgZWFzZV9ib3VuY2VfaW46IGVhc2VfYm91bmNlX2luLFxuICBlYXNlX2JvdW5jZV9pbl9vdXQ6IGVhc2VfYm91bmNlX2luX291dCxcbiAgZWFzZV9ib3VuY2Vfb3V0OiBlYXNlX2JvdW5jZV9vdXQsXG4gIGVhc2VfY2lyY19pbjogZWFzZV9jaXJjX2luLFxuICBlYXNlX2NpcmNfaW5fb3V0OiBlYXNlX2NpcmNfaW5fb3V0LFxuICBlYXNlX2NpcmNfb3V0OiBlYXNlX2NpcmNfb3V0LFxuICBlYXNlX2N1YmljX2luOiBlYXNlX2N1YmljX2luLFxuICBlYXNlX2N1YmljX2luX291dDogZWFzZV9jdWJpY19pbl9vdXQsXG4gIGVhc2VfY3ViaWNfb3V0OiBlYXNlX2N1YmljX291dCxcbiAgZWFzZV9lbGFzdGljX2luOiBlYXNlX2VsYXN0aWNfaW4sXG4gIGVhc2VfZWxhc3RpY19pbl9vdXQ6IGVhc2VfZWxhc3RpY19pbl9vdXQsXG4gIGVhc2VfZWxhc3RpY19vdXQ6IGVhc2VfZWxhc3RpY19vdXQsXG4gIGVhc2VfZXhwb19pbjogZWFzZV9leHBvX2luLFxuICBlYXNlX2V4cG9faW5fb3V0OiBlYXNlX2V4cG9faW5fb3V0LFxuICBlYXNlX2V4cG9fb3V0OiBlYXNlX2V4cG9fb3V0LFxuICBlYXNlX3F1YWRfaW46IGVhc2VfcXVhZF9pbixcbiAgZWFzZV9xdWFkX2luX291dDogZWFzZV9xdWFkX2luX291dCxcbiAgZWFzZV9xdWFkX291dDogZWFzZV9xdWFkX291dCxcbiAgZWFzZV9xdWFydF9pbjogZWFzZV9xdWFydF9pbixcbiAgZWFzZV9xdWFydF9pbl9vdXQ6IGVhc2VfcXVhcnRfaW5fb3V0LFxuICBlYXNlX3F1YXJ0X291dDogZWFzZV9xdWFydF9vdXQsXG4gIGVhc2VfcXVpbnRfaW46IGVhc2VfcXVpbnRfaW4sXG4gIGVhc2VfcXVpbnRfaW5fb3V0OiBlYXNlX3F1aW50X2luX291dCxcbiAgZWFzZV9xdWludF9vdXQ6IGVhc2VfcXVpbnRfb3V0LFxuICBlYXNlX3NpbmVfaW46IGVhc2Vfc2luZV9pbixcbiAgZWFzZV9zaW5lX2luX291dDogZWFzZV9zaW5lX2luX291dCxcbiAgZWFzZV9zaW5lX291dDogZWFzZV9zaW5lX291dCxcbiAgcXVhdGVybmlvbl9yb3RhdGlvbjogcXVhdGVybmlvbl9yb3RhdGlvbixcbiAgcXVhdGVybmlvbl9zbGVycDogcXVhdGVybmlvbl9zbGVycCxcblxufTtcblxuIiwiLyoqXG4gKiBBIHRpbWVsaW5lIHRyYW5zaXRpb24gc2VnbWVudC4gQW4gaW5zdGFuY2Ugb2YgdGhpcyBjbGFzcyBpcyBjcmVhdGVkIGludGVybmFsbHkgd2hlbiBjYWxsaW5nIHtAbGluayBUSFJFRS5CQVMuVGltZWxpbmUuYWRkfSwgc28geW91IHNob3VsZCBub3QgdXNlIHRoaXMgY2xhc3MgZGlyZWN0bHkuXG4gKiBUaGUgaW5zdGFuY2UgaXMgYWxzbyBwYXNzZWQgdGhlIHRoZSBjb21waWxlciBmdW5jdGlvbiBpZiB5b3UgcmVnaXN0ZXIgYSB0cmFuc2l0aW9uIHRocm91Z2gge0BsaW5rIFRIUkVFLkJBUy5UaW1lbGluZS5yZWdpc3Rlcn0uIFRoZXJlIHlvdSBjYW4gdXNlIHRoZSBwdWJsaWMgcHJvcGVydGllcyBvZiB0aGUgc2VnbWVudCB0byBjb21waWxlIHRoZSBnbHNsIHN0cmluZy5cbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgQSBzdHJpbmcga2V5IGdlbmVyYXRlZCBieSB0aGUgdGltZWxpbmUgdG8gd2hpY2ggdGhpcyBzZWdtZW50IGJlbG9uZ3MuIEtleXMgYXJlIHVuaXF1ZS5cbiAqIEBwYXJhbSB7bnVtYmVyfSBzdGFydCBTdGFydCB0aW1lIG9mIHRoaXMgc2VnbWVudCBpbiBhIHRpbWVsaW5lIGluIHNlY29uZHMuXG4gKiBAcGFyYW0ge251bWJlcn0gZHVyYXRpb24gRHVyYXRpb24gb2YgdGhpcyBzZWdtZW50IGluIHNlY29uZHMuXG4gKiBAcGFyYW0ge29iamVjdH0gdHJhbnNpdGlvbiBPYmplY3QgZGVzY3JpYmluZyB0aGUgdHJhbnNpdGlvbi5cbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGNvbXBpbGVyIEEgcmVmZXJlbmNlIHRvIHRoZSBjb21waWxlciBmdW5jdGlvbiBmcm9tIGEgdHJhbnNpdGlvbiBkZWZpbml0aW9uLlxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIFRpbWVsaW5lU2VnbWVudChrZXksIHN0YXJ0LCBkdXJhdGlvbiwgdHJhbnNpdGlvbiwgY29tcGlsZXIpIHtcbiAgdGhpcy5rZXkgPSBrZXk7XG4gIHRoaXMuc3RhcnQgPSBzdGFydDtcbiAgdGhpcy5kdXJhdGlvbiA9IGR1cmF0aW9uO1xuICB0aGlzLnRyYW5zaXRpb24gPSB0cmFuc2l0aW9uO1xuICB0aGlzLmNvbXBpbGVyID0gY29tcGlsZXI7XG5cbiAgdGhpcy50cmFpbCA9IDA7XG59XG5cblRpbWVsaW5lU2VnbWVudC5wcm90b3R5cGUuY29tcGlsZSA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy5jb21waWxlcih0aGlzKTtcbn07XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShUaW1lbGluZVNlZ21lbnQucHJvdG90eXBlLCAnZW5kJywge1xuICBnZXQ6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLnN0YXJ0ICsgdGhpcy5kdXJhdGlvbjtcbiAgfVxufSk7XG5cbmV4cG9ydCB7IFRpbWVsaW5lU2VnbWVudCB9O1xuIiwiaW1wb3J0IHsgVGltZWxpbmVTZWdtZW50IH0gZnJvbSAnLi9UaW1lbGluZVNlZ21lbnQnO1xuXG4vKipcbiAqIEEgdXRpbGl0eSBjbGFzcyB0byBjcmVhdGUgYW4gYW5pbWF0aW9uIHRpbWVsaW5lIHdoaWNoIGNhbiBiZSBiYWtlZCBpbnRvIGEgKHZlcnRleCkgc2hhZGVyLlxuICogQnkgZGVmYXVsdCB0aGUgdGltZWxpbmUgc3VwcG9ydHMgdHJhbnNsYXRpb24sIHNjYWxlIGFuZCByb3RhdGlvbi4gVGhpcyBjYW4gYmUgZXh0ZW5kZWQgb3Igb3ZlcnJpZGRlbi5cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBUaW1lbGluZSgpIHtcbiAgLyoqXG4gICAqIFRoZSB0b3RhbCBkdXJhdGlvbiBvZiB0aGUgdGltZWxpbmUgaW4gc2Vjb25kcy5cbiAgICogQHR5cGUge251bWJlcn1cbiAgICovXG4gIHRoaXMuZHVyYXRpb24gPSAwO1xuXG4gIC8qKlxuICAgKiBUaGUgbmFtZSBvZiB0aGUgdmFsdWUgdGhhdCBzZWdtZW50cyB3aWxsIHVzZSB0byByZWFkIHRoZSB0aW1lLiBEZWZhdWx0cyB0byAndFRpbWUnLlxuICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgKi9cbiAgdGhpcy50aW1lS2V5ID0gJ3RUaW1lJztcblxuICB0aGlzLnNlZ21lbnRzID0ge307XG4gIHRoaXMuX19rZXkgPSAwO1xufVxuXG4vLyBzdGF0aWMgZGVmaW5pdGlvbnMgbWFwXG5UaW1lbGluZS5zZWdtZW50RGVmaW5pdGlvbnMgPSB7fTtcblxuLyoqXG4gKiBSZWdpc3RlcnMgYSB0cmFuc2l0aW9uIGRlZmluaXRpb24gZm9yIHVzZSB3aXRoIHtAbGluayBUSFJFRS5CQVMuVGltZWxpbmUuYWRkfS5cbiAqIEBwYXJhbSB7U3RyaW5nfSBrZXkgTmFtZSBvZiB0aGUgdHJhbnNpdGlvbi4gRGVmYXVsdHMgaW5jbHVkZSAnc2NhbGUnLCAncm90YXRlJyBhbmQgJ3RyYW5zbGF0ZScuXG4gKiBAcGFyYW0ge09iamVjdH0gZGVmaW5pdGlvblxuICogQHBhcmFtIHtGdW5jdGlvbn0gZGVmaW5pdGlvbi5jb21waWxlciBBIGZ1bmN0aW9uIHRoYXQgZ2VuZXJhdGVzIGEgZ2xzbCBzdHJpbmcgZm9yIGEgdHJhbnNpdGlvbiBzZWdtZW50LiBBY2NlcHRzIGEgVEhSRUUuQkFTLlRpbWVsaW5lU2VnbWVudCBhcyB0aGUgc29sZSBhcmd1bWVudC5cbiAqIEBwYXJhbSB7Kn0gZGVmaW5pdGlvbi5kZWZhdWx0RnJvbSBUaGUgaW5pdGlhbCB2YWx1ZSBmb3IgYSB0cmFuc2Zvcm0uZnJvbS4gRm9yIGV4YW1wbGUsIHRoZSBkZWZhdWx0RnJvbSBmb3IgYSB0cmFuc2xhdGlvbiBpcyBUSFJFRS5WZWN0b3IzKDAsIDAsIDApLlxuICogQHN0YXRpY1xuICovXG5UaW1lbGluZS5yZWdpc3RlciA9IGZ1bmN0aW9uKGtleSwgZGVmaW5pdGlvbikge1xuICBUaW1lbGluZS5zZWdtZW50RGVmaW5pdGlvbnNba2V5XSA9IGRlZmluaXRpb247XG4gIFxuICByZXR1cm4gZGVmaW5pdGlvbjtcbn07XG5cbi8qKlxuICogQWRkIGEgdHJhbnNpdGlvbiB0byB0aGUgdGltZWxpbmUuXG4gKiBAcGFyYW0ge251bWJlcn0gZHVyYXRpb24gRHVyYXRpb24gaW4gc2Vjb25kc1xuICogQHBhcmFtIHtvYmplY3R9IHRyYW5zaXRpb25zIEFuIG9iamVjdCBjb250YWluaW5nIG9uZSBvciBzZXZlcmFsIHRyYW5zaXRpb25zLiBUaGUga2V5cyBzaG91bGQgbWF0Y2ggdHJhbnNmb3JtIGRlZmluaXRpb25zLlxuICogVGhlIHRyYW5zaXRpb24gb2JqZWN0IGZvciBlYWNoIGtleSB3aWxsIGJlIHBhc3NlZCB0byB0aGUgbWF0Y2hpbmcgZGVmaW5pdGlvbidzIGNvbXBpbGVyLiBJdCBjYW4gaGF2ZSBhcmJpdHJhcnkgcHJvcGVydGllcywgYnV0IHRoZSBUaW1lbGluZSBleHBlY3RzIGF0IGxlYXN0IGEgJ3RvJywgJ2Zyb20nIGFuZCBhbiBvcHRpb25hbCAnZWFzZScuXG4gKiBAcGFyYW0ge251bWJlcnxzdHJpbmd9IFtwb3NpdGlvbk9mZnNldF0gUG9zaXRpb24gaW4gdGhlIHRpbWVsaW5lLiBEZWZhdWx0cyB0byB0aGUgZW5kIG9mIHRoZSB0aW1lbGluZS4gSWYgYSBudW1iZXIgaXMgcHJvdmlkZWQsIHRoZSB0cmFuc2l0aW9uIHdpbGwgYmUgaW5zZXJ0ZWQgYXQgdGhhdCB0aW1lIGluIHNlY29uZHMuIFN0cmluZ3MgKCcrPXgnIG9yICctPXgnKSBjYW4gYmUgdXNlZCBmb3IgYSB2YWx1ZSByZWxhdGl2ZSB0byB0aGUgZW5kIG9mIHRpbWVsaW5lLlxuICovXG5UaW1lbGluZS5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24oZHVyYXRpb24sIHRyYW5zaXRpb25zLCBwb3NpdGlvbk9mZnNldCkge1xuICAvLyBzdG9wIHJvbGx1cCBmcm9tIGNvbXBsYWluaW5nIGFib3V0IGV2YWxcbiAgY29uc3QgX2V2YWwgPSBldmFsO1xuICBcbiAgbGV0IHN0YXJ0ID0gdGhpcy5kdXJhdGlvbjtcblxuICBpZiAocG9zaXRpb25PZmZzZXQgIT09IHVuZGVmaW5lZCkge1xuICAgIGlmICh0eXBlb2YgcG9zaXRpb25PZmZzZXQgPT09ICdudW1iZXInKSB7XG4gICAgICBzdGFydCA9IHBvc2l0aW9uT2Zmc2V0O1xuICAgIH1cbiAgICBlbHNlIGlmICh0eXBlb2YgcG9zaXRpb25PZmZzZXQgPT09ICdzdHJpbmcnKSB7XG4gICAgICBfZXZhbCgnc3RhcnQnICsgcG9zaXRpb25PZmZzZXQpO1xuICAgIH1cblxuICAgIHRoaXMuZHVyYXRpb24gPSBNYXRoLm1heCh0aGlzLmR1cmF0aW9uLCBzdGFydCArIGR1cmF0aW9uKTtcbiAgfVxuICBlbHNlIHtcbiAgICB0aGlzLmR1cmF0aW9uICs9IGR1cmF0aW9uO1xuICB9XG5cbiAgbGV0IGtleXMgPSBPYmplY3Qua2V5cyh0cmFuc2l0aW9ucyksIGtleTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyBpKyspIHtcbiAgICBrZXkgPSBrZXlzW2ldO1xuXG4gICAgdGhpcy5wcm9jZXNzVHJhbnNpdGlvbihrZXksIHRyYW5zaXRpb25zW2tleV0sIHN0YXJ0LCBkdXJhdGlvbik7XG4gIH1cbn07XG5cblRpbWVsaW5lLnByb3RvdHlwZS5wcm9jZXNzVHJhbnNpdGlvbiA9IGZ1bmN0aW9uKGtleSwgdHJhbnNpdGlvbiwgc3RhcnQsIGR1cmF0aW9uKSB7XG4gIGNvbnN0IGRlZmluaXRpb24gPSBUaW1lbGluZS5zZWdtZW50RGVmaW5pdGlvbnNba2V5XTtcblxuICBsZXQgc2VnbWVudHMgPSB0aGlzLnNlZ21lbnRzW2tleV07XG4gIGlmICghc2VnbWVudHMpIHNlZ21lbnRzID0gdGhpcy5zZWdtZW50c1trZXldID0gW107XG5cbiAgaWYgKHRyYW5zaXRpb24uZnJvbSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgaWYgKHNlZ21lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgdHJhbnNpdGlvbi5mcm9tID0gZGVmaW5pdGlvbi5kZWZhdWx0RnJvbTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICB0cmFuc2l0aW9uLmZyb20gPSBzZWdtZW50c1tzZWdtZW50cy5sZW5ndGggLSAxXS50cmFuc2l0aW9uLnRvO1xuICAgIH1cbiAgfVxuXG4gIHNlZ21lbnRzLnB1c2gobmV3IFRpbWVsaW5lU2VnbWVudCgodGhpcy5fX2tleSsrKS50b1N0cmluZygpLCBzdGFydCwgZHVyYXRpb24sIHRyYW5zaXRpb24sIGRlZmluaXRpb24uY29tcGlsZXIpKTtcbn07XG5cbi8qKlxuICogQ29tcGlsZXMgdGhlIHRpbWVsaW5lIGludG8gYSBnbHNsIHN0cmluZyBhcnJheSB0aGF0IGNhbiBiZSBpbmplY3RlZCBpbnRvIGEgKHZlcnRleCkgc2hhZGVyLlxuICogQHJldHVybnMge0FycmF5fVxuICovXG5UaW1lbGluZS5wcm90b3R5cGUuY29tcGlsZSA9IGZ1bmN0aW9uKCkge1xuICBjb25zdCBjID0gW107XG5cbiAgY29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKHRoaXMuc2VnbWVudHMpO1xuICBsZXQgc2VnbWVudHM7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgaSsrKSB7XG4gICAgc2VnbWVudHMgPSB0aGlzLnNlZ21lbnRzW2tleXNbaV1dO1xuXG4gICAgdGhpcy5maWxsR2FwcyhzZWdtZW50cyk7XG5cbiAgICBzZWdtZW50cy5mb3JFYWNoKGZ1bmN0aW9uKHMpIHtcbiAgICAgIGMucHVzaChzLmNvbXBpbGUoKSk7XG4gICAgfSk7XG4gIH1cblxuICByZXR1cm4gYztcbn07XG5UaW1lbGluZS5wcm90b3R5cGUuZmlsbEdhcHMgPSBmdW5jdGlvbihzZWdtZW50cykge1xuICBpZiAoc2VnbWVudHMubGVuZ3RoID09PSAwKSByZXR1cm47XG5cbiAgbGV0IHMwLCBzMTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IHNlZ21lbnRzLmxlbmd0aCAtIDE7IGkrKykge1xuICAgIHMwID0gc2VnbWVudHNbaV07XG4gICAgczEgPSBzZWdtZW50c1tpICsgMV07XG5cbiAgICBzMC50cmFpbCA9IHMxLnN0YXJ0IC0gczAuZW5kO1xuICB9XG5cbiAgLy8gcGFkIGxhc3Qgc2VnbWVudCB1bnRpbCBlbmQgb2YgdGltZWxpbmVcbiAgczAgPSBzZWdtZW50c1tzZWdtZW50cy5sZW5ndGggLSAxXTtcbiAgczAudHJhaWwgPSB0aGlzLmR1cmF0aW9uIC0gczAuZW5kO1xufTtcblxuLyoqXG4gKiBHZXQgYSBjb21waWxlZCBnbHNsIHN0cmluZyB3aXRoIGNhbGxzIHRvIHRyYW5zZm9ybSBmdW5jdGlvbnMgZm9yIGEgZ2l2ZW4ga2V5LlxuICogVGhlIG9yZGVyIGluIHdoaWNoIHRoZXNlIHRyYW5zaXRpb25zIGFyZSBhcHBsaWVkIG1hdHRlcnMgYmVjYXVzZSB0aGV5IGFsbCBvcGVyYXRlIG9uIHRoZSBzYW1lIHZhbHVlLlxuICogQHBhcmFtIHtzdHJpbmd9IGtleSBBIGtleSBtYXRjaGluZyBhIHRyYW5zZm9ybSBkZWZpbml0aW9uLlxuICogQHJldHVybnMge3N0cmluZ31cbiAqL1xuVGltZWxpbmUucHJvdG90eXBlLmdldFRyYW5zZm9ybUNhbGxzID0gZnVuY3Rpb24oa2V5KSB7XG4gIGxldCB0ID0gdGhpcy50aW1lS2V5O1xuXG4gIHJldHVybiB0aGlzLnNlZ21lbnRzW2tleV0gPyAgdGhpcy5zZWdtZW50c1trZXldLm1hcChmdW5jdGlvbihzKSB7XG4gICAgcmV0dXJuIGBhcHBseVRyYW5zZm9ybSR7cy5rZXl9KCR7dH0sIHRyYW5zZm9ybWVkKTtgO1xuICB9KS5qb2luKCdcXG4nKSA6ICcnO1xufTtcblxuZXhwb3J0IHsgVGltZWxpbmUgfVxuIiwiY29uc3QgVGltZWxpbmVDaHVua3MgPSB7XG4gIHZlYzM6IGZ1bmN0aW9uKG4sIHYsIHApIHtcbiAgICBjb25zdCB4ID0gKHYueCB8fCAwKS50b1ByZWNpc2lvbihwKTtcbiAgICBjb25zdCB5ID0gKHYueSB8fCAwKS50b1ByZWNpc2lvbihwKTtcbiAgICBjb25zdCB6ID0gKHYueiB8fCAwKS50b1ByZWNpc2lvbihwKTtcblxuICAgIHJldHVybiBgdmVjMyAke259ID0gdmVjMygke3h9LCAke3l9LCAke3p9KTtgO1xuICB9LFxuICB2ZWM0OiBmdW5jdGlvbihuLCB2LCBwKSB7XG4gICAgY29uc3QgeCA9ICh2LnggfHwgMCkudG9QcmVjaXNpb24ocCk7XG4gICAgY29uc3QgeSA9ICh2LnkgfHwgMCkudG9QcmVjaXNpb24ocCk7XG4gICAgY29uc3QgeiA9ICh2LnogfHwgMCkudG9QcmVjaXNpb24ocCk7XG4gICAgY29uc3QgdyA9ICh2LncgfHwgMCkudG9QcmVjaXNpb24ocCk7XG4gIFxuICAgIHJldHVybiBgdmVjNCAke259ID0gdmVjNCgke3h9LCAke3l9LCAke3p9LCAke3d9KTtgO1xuICB9LFxuICBkZWxheUR1cmF0aW9uOiBmdW5jdGlvbihzZWdtZW50KSB7XG4gICAgcmV0dXJuIGBcbiAgICBmbG9hdCBjRGVsYXkke3NlZ21lbnQua2V5fSA9ICR7c2VnbWVudC5zdGFydC50b1ByZWNpc2lvbig0KX07XG4gICAgZmxvYXQgY0R1cmF0aW9uJHtzZWdtZW50LmtleX0gPSAke3NlZ21lbnQuZHVyYXRpb24udG9QcmVjaXNpb24oNCl9O1xuICAgIGA7XG4gIH0sXG4gIHByb2dyZXNzOiBmdW5jdGlvbihzZWdtZW50KSB7XG4gICAgLy8gemVybyBkdXJhdGlvbiBzZWdtZW50cyBzaG91bGQgYWx3YXlzIHJlbmRlciBjb21wbGV0ZVxuICAgIGlmIChzZWdtZW50LmR1cmF0aW9uID09PSAwKSB7XG4gICAgICByZXR1cm4gYGZsb2F0IHByb2dyZXNzID0gMS4wO2BcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICByZXR1cm4gYFxuICAgICAgZmxvYXQgcHJvZ3Jlc3MgPSBjbGFtcCh0aW1lIC0gY0RlbGF5JHtzZWdtZW50LmtleX0sIDAuMCwgY0R1cmF0aW9uJHtzZWdtZW50LmtleX0pIC8gY0R1cmF0aW9uJHtzZWdtZW50LmtleX07XG4gICAgICAke3NlZ21lbnQudHJhbnNpdGlvbi5lYXNlID8gYHByb2dyZXNzID0gJHtzZWdtZW50LnRyYW5zaXRpb24uZWFzZX0ocHJvZ3Jlc3MkeyhzZWdtZW50LnRyYW5zaXRpb24uZWFzZVBhcmFtcyA/IGAsICR7c2VnbWVudC50cmFuc2l0aW9uLmVhc2VQYXJhbXMubWFwKCh2KSA9PiB2LnRvUHJlY2lzaW9uKDQpKS5qb2luKGAsIGApfWAgOiBgYCl9KTtgIDogYGB9XG4gICAgICBgO1xuICAgIH1cbiAgfSxcbiAgcmVuZGVyQ2hlY2s6IGZ1bmN0aW9uKHNlZ21lbnQpIHtcbiAgICBjb25zdCBzdGFydFRpbWUgPSBzZWdtZW50LnN0YXJ0LnRvUHJlY2lzaW9uKDQpO1xuICAgIGNvbnN0IGVuZFRpbWUgPSAoc2VnbWVudC5lbmQgKyBzZWdtZW50LnRyYWlsKS50b1ByZWNpc2lvbig0KTtcblxuICAgIHJldHVybiBgaWYgKHRpbWUgPCAke3N0YXJ0VGltZX0gfHwgdGltZSA+ICR7ZW5kVGltZX0pIHJldHVybjtgO1xuICB9XG59O1xuXG5leHBvcnQgeyBUaW1lbGluZUNodW5rcyB9O1xuIiwiaW1wb3J0IHsgVGltZWxpbmUgfSBmcm9tICcuL1RpbWVsaW5lJztcbmltcG9ydCB7IFRpbWVsaW5lQ2h1bmtzIH0gZnJvbSAnLi9UaW1lbGluZUNodW5rcyc7XG5pbXBvcnQgeyBWZWN0b3IzIH0gZnJvbSAndGhyZWUnO1xuXG5jb25zdCBUcmFuc2xhdGlvblNlZ21lbnQgPSB7XG4gIGNvbXBpbGVyOiBmdW5jdGlvbihzZWdtZW50KSB7XG4gICAgcmV0dXJuIGBcbiAgICAke1RpbWVsaW5lQ2h1bmtzLmRlbGF5RHVyYXRpb24oc2VnbWVudCl9XG4gICAgJHtUaW1lbGluZUNodW5rcy52ZWMzKGBjVHJhbnNsYXRlRnJvbSR7c2VnbWVudC5rZXl9YCwgc2VnbWVudC50cmFuc2l0aW9uLmZyb20sIDIpfVxuICAgICR7VGltZWxpbmVDaHVua3MudmVjMyhgY1RyYW5zbGF0ZVRvJHtzZWdtZW50LmtleX1gLCBzZWdtZW50LnRyYW5zaXRpb24udG8sIDIpfVxuICAgIFxuICAgIHZvaWQgYXBwbHlUcmFuc2Zvcm0ke3NlZ21lbnQua2V5fShmbG9hdCB0aW1lLCBpbm91dCB2ZWMzIHYpIHtcbiAgICBcbiAgICAgICR7VGltZWxpbmVDaHVua3MucmVuZGVyQ2hlY2soc2VnbWVudCl9XG4gICAgICAke1RpbWVsaW5lQ2h1bmtzLnByb2dyZXNzKHNlZ21lbnQpfVxuICAgIFxuICAgICAgdiArPSBtaXgoY1RyYW5zbGF0ZUZyb20ke3NlZ21lbnQua2V5fSwgY1RyYW5zbGF0ZVRvJHtzZWdtZW50LmtleX0sIHByb2dyZXNzKTtcbiAgICB9XG4gICAgYDtcbiAgfSxcbiAgZGVmYXVsdEZyb206IG5ldyBWZWN0b3IzKDAsIDAsIDApXG59O1xuXG5UaW1lbGluZS5yZWdpc3RlcigndHJhbnNsYXRlJywgVHJhbnNsYXRpb25TZWdtZW50KTtcblxuZXhwb3J0IHsgVHJhbnNsYXRpb25TZWdtZW50IH07XG4iLCJpbXBvcnQgeyBUaW1lbGluZSB9IGZyb20gJy4vVGltZWxpbmUnO1xuaW1wb3J0IHsgVGltZWxpbmVDaHVua3MgfSBmcm9tICcuL1RpbWVsaW5lQ2h1bmtzJztcbmltcG9ydCB7IFZlY3RvcjMgfSBmcm9tICd0aHJlZSc7XG5cbmNvbnN0IFNjYWxlU2VnbWVudCA9IHtcbiAgY29tcGlsZXI6IGZ1bmN0aW9uKHNlZ21lbnQpIHtcbiAgICBjb25zdCBvcmlnaW4gPSBzZWdtZW50LnRyYW5zaXRpb24ub3JpZ2luO1xuICAgIFxuICAgIHJldHVybiBgXG4gICAgJHtUaW1lbGluZUNodW5rcy5kZWxheUR1cmF0aW9uKHNlZ21lbnQpfVxuICAgICR7VGltZWxpbmVDaHVua3MudmVjMyhgY1NjYWxlRnJvbSR7c2VnbWVudC5rZXl9YCwgc2VnbWVudC50cmFuc2l0aW9uLmZyb20sIDIpfVxuICAgICR7VGltZWxpbmVDaHVua3MudmVjMyhgY1NjYWxlVG8ke3NlZ21lbnQua2V5fWAsIHNlZ21lbnQudHJhbnNpdGlvbi50bywgMil9XG4gICAgJHtvcmlnaW4gPyBUaW1lbGluZUNodW5rcy52ZWMzKGBjT3JpZ2luJHtzZWdtZW50LmtleX1gLCBvcmlnaW4sIDIpIDogJyd9XG4gICAgXG4gICAgdm9pZCBhcHBseVRyYW5zZm9ybSR7c2VnbWVudC5rZXl9KGZsb2F0IHRpbWUsIGlub3V0IHZlYzMgdikge1xuICAgIFxuICAgICAgJHtUaW1lbGluZUNodW5rcy5yZW5kZXJDaGVjayhzZWdtZW50KX1cbiAgICAgICR7VGltZWxpbmVDaHVua3MucHJvZ3Jlc3Moc2VnbWVudCl9XG4gICAgXG4gICAgICAke29yaWdpbiA/IGB2IC09IGNPcmlnaW4ke3NlZ21lbnQua2V5fTtgIDogJyd9XG4gICAgICB2ICo9IG1peChjU2NhbGVGcm9tJHtzZWdtZW50LmtleX0sIGNTY2FsZVRvJHtzZWdtZW50LmtleX0sIHByb2dyZXNzKTtcbiAgICAgICR7b3JpZ2luID8gYHYgKz0gY09yaWdpbiR7c2VnbWVudC5rZXl9O2AgOiAnJ31cbiAgICB9XG4gICAgYDtcbiAgfSxcbiAgZGVmYXVsdEZyb206IG5ldyBWZWN0b3IzKDEsIDEsIDEpXG59O1xuXG5UaW1lbGluZS5yZWdpc3Rlcignc2NhbGUnLCBTY2FsZVNlZ21lbnQpO1xuXG5leHBvcnQgeyBTY2FsZVNlZ21lbnQgfTtcbiIsImltcG9ydCB7IFRpbWVsaW5lIH0gZnJvbSAnLi9UaW1lbGluZSc7XG5pbXBvcnQgeyBUaW1lbGluZUNodW5rcyB9IGZyb20gJy4vVGltZWxpbmVDaHVua3MnO1xuaW1wb3J0IHsgVmVjdG9yMywgVmVjdG9yNCB9IGZyb20gJ3RocmVlJztcblxuY29uc3QgUm90YXRpb25TZWdtZW50ID0ge1xuICBjb21waWxlcihzZWdtZW50KSB7XG4gICAgY29uc3QgZnJvbUF4aXNBbmdsZSA9IG5ldyBWZWN0b3I0KFxuICAgICAgc2VnbWVudC50cmFuc2l0aW9uLmZyb20uYXhpcy54LFxuICAgICAgc2VnbWVudC50cmFuc2l0aW9uLmZyb20uYXhpcy55LFxuICAgICAgc2VnbWVudC50cmFuc2l0aW9uLmZyb20uYXhpcy56LFxuICAgICAgc2VnbWVudC50cmFuc2l0aW9uLmZyb20uYW5nbGVcbiAgICApO1xuICBcbiAgICBjb25zdCB0b0F4aXMgPSBzZWdtZW50LnRyYW5zaXRpb24udG8uYXhpcyB8fCBzZWdtZW50LnRyYW5zaXRpb24uZnJvbS5heGlzO1xuICAgIGNvbnN0IHRvQXhpc0FuZ2xlID0gbmV3IFZlY3RvcjQoXG4gICAgICB0b0F4aXMueCxcbiAgICAgIHRvQXhpcy55LFxuICAgICAgdG9BeGlzLnosXG4gICAgICBzZWdtZW50LnRyYW5zaXRpb24udG8uYW5nbGVcbiAgICApO1xuICBcbiAgICBjb25zdCBvcmlnaW4gPSBzZWdtZW50LnRyYW5zaXRpb24ub3JpZ2luO1xuICAgIFxuICAgIHJldHVybiBgXG4gICAgJHtUaW1lbGluZUNodW5rcy5kZWxheUR1cmF0aW9uKHNlZ21lbnQpfVxuICAgICR7VGltZWxpbmVDaHVua3MudmVjNChgY1JvdGF0aW9uRnJvbSR7c2VnbWVudC5rZXl9YCwgZnJvbUF4aXNBbmdsZSwgOCl9XG4gICAgJHtUaW1lbGluZUNodW5rcy52ZWM0KGBjUm90YXRpb25UbyR7c2VnbWVudC5rZXl9YCwgdG9BeGlzQW5nbGUsIDgpfVxuICAgICR7b3JpZ2luID8gVGltZWxpbmVDaHVua3MudmVjMyhgY09yaWdpbiR7c2VnbWVudC5rZXl9YCwgb3JpZ2luLCAyKSA6ICcnfVxuICAgIFxuICAgIHZvaWQgYXBwbHlUcmFuc2Zvcm0ke3NlZ21lbnQua2V5fShmbG9hdCB0aW1lLCBpbm91dCB2ZWMzIHYpIHtcbiAgICAgICR7VGltZWxpbmVDaHVua3MucmVuZGVyQ2hlY2soc2VnbWVudCl9XG4gICAgICAke1RpbWVsaW5lQ2h1bmtzLnByb2dyZXNzKHNlZ21lbnQpfVxuXG4gICAgICAke29yaWdpbiA/IGB2IC09IGNPcmlnaW4ke3NlZ21lbnQua2V5fTtgIDogJyd9XG4gICAgICB2ZWMzIGF4aXMgPSBub3JtYWxpemUobWl4KGNSb3RhdGlvbkZyb20ke3NlZ21lbnQua2V5fS54eXosIGNSb3RhdGlvblRvJHtzZWdtZW50LmtleX0ueHl6LCBwcm9ncmVzcykpO1xuICAgICAgZmxvYXQgYW5nbGUgPSBtaXgoY1JvdGF0aW9uRnJvbSR7c2VnbWVudC5rZXl9LncsIGNSb3RhdGlvblRvJHtzZWdtZW50LmtleX0udywgcHJvZ3Jlc3MpO1xuICAgICAgdmVjNCBxID0gcXVhdEZyb21BeGlzQW5nbGUoYXhpcywgYW5nbGUpO1xuICAgICAgdiA9IHJvdGF0ZVZlY3RvcihxLCB2KTtcbiAgICAgICR7b3JpZ2luID8gYHYgKz0gY09yaWdpbiR7c2VnbWVudC5rZXl9O2AgOiAnJ31cbiAgICB9XG4gICAgYDtcbiAgfSxcbiAgZGVmYXVsdEZyb206IHtheGlzOiBuZXcgVmVjdG9yMygpLCBhbmdsZTogMH1cbn07XG5cblRpbWVsaW5lLnJlZ2lzdGVyKCdyb3RhdGUnLCBSb3RhdGlvblNlZ21lbnQpO1xuXG5leHBvcnQgeyBSb3RhdGlvblNlZ21lbnQgfTtcbiJdLCJuYW1lcyI6WyJCYXNlQW5pbWF0aW9uTWF0ZXJpYWwiLCJwYXJhbWV0ZXJzIiwidW5pZm9ybXMiLCJjYWxsIiwidW5pZm9ybVZhbHVlcyIsInNldFZhbHVlcyIsIlVuaWZvcm1zVXRpbHMiLCJtZXJnZSIsInNldFVuaWZvcm1WYWx1ZXMiLCJtYXAiLCJkZWZpbmVzIiwibm9ybWFsTWFwIiwiZW52TWFwIiwiYW9NYXAiLCJzcGVjdWxhck1hcCIsImFscGhhTWFwIiwibGlnaHRNYXAiLCJlbWlzc2l2ZU1hcCIsImJ1bXBNYXAiLCJkaXNwbGFjZW1lbnRNYXAiLCJyb3VnaG5lc3NNYXAiLCJtZXRhbG5lc3NNYXAiLCJlbnZNYXBUeXBlRGVmaW5lIiwiZW52TWFwTW9kZURlZmluZSIsImVudk1hcEJsZW5kaW5nRGVmaW5lIiwibWFwcGluZyIsIkN1YmVSZWZsZWN0aW9uTWFwcGluZyIsIkN1YmVSZWZyYWN0aW9uTWFwcGluZyIsIkN1YmVVVlJlZmxlY3Rpb25NYXBwaW5nIiwiQ3ViZVVWUmVmcmFjdGlvbk1hcHBpbmciLCJFcXVpcmVjdGFuZ3VsYXJSZWZsZWN0aW9uTWFwcGluZyIsIkVxdWlyZWN0YW5ndWxhclJlZnJhY3Rpb25NYXBwaW5nIiwiU3BoZXJpY2FsUmVmbGVjdGlvbk1hcHBpbmciLCJjb21iaW5lIiwiTWl4T3BlcmF0aW9uIiwiQWRkT3BlcmF0aW9uIiwiTXVsdGlwbHlPcGVyYXRpb24iLCJwcm90b3R5cGUiLCJPYmplY3QiLCJhc3NpZ24iLCJjcmVhdGUiLCJTaGFkZXJNYXRlcmlhbCIsInZhbHVlcyIsImtleXMiLCJmb3JFYWNoIiwia2V5IiwidmFsdWUiLCJuYW1lIiwiam9pbiIsIkJhc2ljQW5pbWF0aW9uTWF0ZXJpYWwiLCJ2YXJ5aW5nUGFyYW1ldGVycyIsInZlcnRleFBhcmFtZXRlcnMiLCJ2ZXJ0ZXhGdW5jdGlvbnMiLCJ2ZXJ0ZXhJbml0IiwidmVydGV4Tm9ybWFsIiwidmVydGV4UG9zaXRpb24iLCJ2ZXJ0ZXhDb2xvciIsImZyYWdtZW50RnVuY3Rpb25zIiwiZnJhZ21lbnRQYXJhbWV0ZXJzIiwiZnJhZ21lbnRJbml0IiwiZnJhZ21lbnRNYXAiLCJmcmFnbWVudERpZmZ1c2UiLCJTaGFkZXJMaWIiLCJsaWdodHMiLCJ2ZXJ0ZXhTaGFkZXIiLCJjb25jYXRWZXJ0ZXhTaGFkZXIiLCJmcmFnbWVudFNoYWRlciIsImNvbmNhdEZyYWdtZW50U2hhZGVyIiwiY29uc3RydWN0b3IiLCJzdHJpbmdpZnlDaHVuayIsIkxhbWJlcnRBbmltYXRpb25NYXRlcmlhbCIsImZyYWdtZW50RW1pc3NpdmUiLCJmcmFnbWVudFNwZWN1bGFyIiwiUGhvbmdBbmltYXRpb25NYXRlcmlhbCIsIlN0YW5kYXJkQW5pbWF0aW9uTWF0ZXJpYWwiLCJmcmFnbWVudFJvdWdobmVzcyIsImZyYWdtZW50TWV0YWxuZXNzIiwiUG9pbnRzQW5pbWF0aW9uTWF0ZXJpYWwiLCJmcmFnbWVudFNoYXBlIiwiRGVwdGhBbmltYXRpb25NYXRlcmlhbCIsImRlcHRoUGFja2luZyIsIlJHQkFEZXB0aFBhY2tpbmciLCJjbGlwcGluZyIsIkRpc3RhbmNlQW5pbWF0aW9uTWF0ZXJpYWwiLCJQcmVmYWJCdWZmZXJHZW9tZXRyeSIsInByZWZhYiIsImNvdW50IiwicHJlZmFiR2VvbWV0cnkiLCJpc1ByZWZhYkJ1ZmZlckdlb21ldHJ5IiwiaXNCdWZmZXJHZW9tZXRyeSIsInByZWZhYkNvdW50IiwicHJlZmFiVmVydGV4Q291bnQiLCJhdHRyaWJ1dGVzIiwicG9zaXRpb24iLCJ2ZXJ0aWNlcyIsImxlbmd0aCIsImJ1ZmZlckluZGljZXMiLCJidWZmZXJQb3NpdGlvbnMiLCJCdWZmZXJHZW9tZXRyeSIsInByZWZhYkluZGljZXMiLCJwcmVmYWJJbmRleENvdW50IiwiaW5kZXgiLCJhcnJheSIsImkiLCJwdXNoIiwicHJlZmFiRmFjZUNvdW50IiwiZmFjZXMiLCJmYWNlIiwiYSIsImIiLCJjIiwiaW5kZXhCdWZmZXIiLCJVaW50MzJBcnJheSIsInNldEluZGV4IiwiQnVmZmVyQXR0cmlidXRlIiwiayIsInBvc2l0aW9uQnVmZmVyIiwiY3JlYXRlQXR0cmlidXRlIiwicG9zaXRpb25zIiwib2Zmc2V0IiwiaiIsInByZWZhYlZlcnRleCIsIngiLCJ5IiwieiIsImJ1ZmZlclV2cyIsInByZWZhYlV2cyIsInV2IiwiVEhSRUUiLCJWZWN0b3IyIiwiZmFjZVZlcnRleFV2cyIsInV2QnVmZmVyIiwicHJlZmFiVXYiLCJpdGVtU2l6ZSIsImZhY3RvcnkiLCJidWZmZXIiLCJGbG9hdDMyQXJyYXkiLCJhdHRyaWJ1dGUiLCJhZGRBdHRyaWJ1dGUiLCJkYXRhIiwic2V0UHJlZmFiRGF0YSIsInByZWZhYkluZGV4IiwiVXRpbHMiLCJnZW9tZXRyeSIsImlsIiwibiIsInZhIiwidmIiLCJ2YyIsImNsb25lIiwidiIsIlZlY3RvcjMiLCJib3giLCJ0TWF0aCIsInJhbmRGbG9hdCIsIm1pbiIsIm1heCIsInJhbmRGbG9hdFNwcmVhZCIsIm5vcm1hbGl6ZSIsInNvdXJjZU1hdGVyaWFsIiwiTW9kZWxCdWZmZXJHZW9tZXRyeSIsIm1vZGVsIiwib3B0aW9ucyIsIm1vZGVsR2VvbWV0cnkiLCJmYWNlQ291bnQiLCJ2ZXJ0ZXhDb3VudCIsImNvbXB1dGVDZW50cm9pZHMiLCJsb2NhbGl6ZUZhY2VzIiwiY2VudHJvaWRzIiwiY29tcHV0ZUNlbnRyb2lkIiwiY2VudHJvaWQiLCJCQVMiLCJ2ZXJ0ZXgiLCJidWZmZXJVVnMiLCJidWZmZXJTa2lubmluZyIsInNraW5JbmRleEJ1ZmZlciIsInNraW5XZWlnaHRCdWZmZXIiLCJza2luSW5kZXgiLCJza2luSW5kaWNlcyIsInNraW5XZWlnaHQiLCJza2luV2VpZ2h0cyIsInciLCJzZXRGYWNlRGF0YSIsImZhY2VJbmRleCIsIlBvaW50QnVmZmVyR2VvbWV0cnkiLCJwb2ludENvdW50Iiwic2V0UG9pbnREYXRhIiwicG9pbnRJbmRleCIsIlNoYWRlckNodW5rIiwiY2F0bXVsbF9yb21fc3BsaW5lIiwiY3ViaWNfYmV6aWVyIiwiZWFzZV9iYWNrX2luIiwiZWFzZV9iYWNrX2luX291dCIsImVhc2VfYmFja19vdXQiLCJlYXNlX2JlemllciIsImVhc2VfYm91bmNlX2luIiwiZWFzZV9ib3VuY2VfaW5fb3V0IiwiZWFzZV9ib3VuY2Vfb3V0IiwiZWFzZV9jaXJjX2luIiwiZWFzZV9jaXJjX2luX291dCIsImVhc2VfY2lyY19vdXQiLCJlYXNlX2N1YmljX2luIiwiZWFzZV9jdWJpY19pbl9vdXQiLCJlYXNlX2N1YmljX291dCIsImVhc2VfZWxhc3RpY19pbiIsImVhc2VfZWxhc3RpY19pbl9vdXQiLCJlYXNlX2VsYXN0aWNfb3V0IiwiZWFzZV9leHBvX2luIiwiZWFzZV9leHBvX2luX291dCIsImVhc2VfZXhwb19vdXQiLCJlYXNlX3F1YWRfaW4iLCJlYXNlX3F1YWRfaW5fb3V0IiwiZWFzZV9xdWFkX291dCIsImVhc2VfcXVhcnRfaW4iLCJlYXNlX3F1YXJ0X2luX291dCIsImVhc2VfcXVhcnRfb3V0IiwiZWFzZV9xdWludF9pbiIsImVhc2VfcXVpbnRfaW5fb3V0IiwiZWFzZV9xdWludF9vdXQiLCJlYXNlX3NpbmVfaW4iLCJlYXNlX3NpbmVfaW5fb3V0IiwiZWFzZV9zaW5lX291dCIsInF1YXRlcm5pb25fcm90YXRpb24iLCJxdWF0ZXJuaW9uX3NsZXJwIiwiVGltZWxpbmVTZWdtZW50Iiwic3RhcnQiLCJkdXJhdGlvbiIsInRyYW5zaXRpb24iLCJjb21waWxlciIsInRyYWlsIiwiY29tcGlsZSIsImRlZmluZVByb3BlcnR5IiwiVGltZWxpbmUiLCJ0aW1lS2V5Iiwic2VnbWVudHMiLCJfX2tleSIsInNlZ21lbnREZWZpbml0aW9ucyIsInJlZ2lzdGVyIiwiZGVmaW5pdGlvbiIsImFkZCIsInRyYW5zaXRpb25zIiwicG9zaXRpb25PZmZzZXQiLCJfZXZhbCIsImV2YWwiLCJ1bmRlZmluZWQiLCJNYXRoIiwicHJvY2Vzc1RyYW5zaXRpb24iLCJmcm9tIiwiZGVmYXVsdEZyb20iLCJ0byIsInRvU3RyaW5nIiwiZmlsbEdhcHMiLCJzIiwiczAiLCJzMSIsImVuZCIsImdldFRyYW5zZm9ybUNhbGxzIiwidCIsIlRpbWVsaW5lQ2h1bmtzIiwicCIsInRvUHJlY2lzaW9uIiwic2VnbWVudCIsImVhc2UiLCJlYXNlUGFyYW1zIiwic3RhcnRUaW1lIiwiZW5kVGltZSIsIlRyYW5zbGF0aW9uU2VnbWVudCIsImRlbGF5RHVyYXRpb24iLCJ2ZWMzIiwicmVuZGVyQ2hlY2siLCJwcm9ncmVzcyIsIlNjYWxlU2VnbWVudCIsIm9yaWdpbiIsIlJvdGF0aW9uU2VnbWVudCIsImZyb21BeGlzQW5nbGUiLCJWZWN0b3I0IiwiYXhpcyIsImFuZ2xlIiwidG9BeGlzIiwidG9BeGlzQW5nbGUiLCJ2ZWM0Il0sIm1hcHBpbmdzIjoiOztBQWVBLFNBQVNBLHFCQUFULENBQStCQyxVQUEvQixFQUEyQ0MsUUFBM0MsRUFBcUQ7aUJBQ3BDQyxJQUFmLENBQW9CLElBQXBCOztNQUVNQyxnQkFBZ0JILFdBQVdHLGFBQWpDO1NBQ09ILFdBQVdHLGFBQWxCOztPQUVLQyxTQUFMLENBQWVKLFVBQWY7O09BRUtDLFFBQUwsR0FBZ0JJLGNBQWNDLEtBQWQsQ0FBb0IsQ0FBQ0wsUUFBRCxFQUFXLEtBQUtBLFFBQWhCLENBQXBCLENBQWhCOztPQUVLTSxnQkFBTCxDQUFzQkosYUFBdEI7O01BRUlBLGFBQUosRUFBbUI7a0JBQ0hLLEdBQWQsS0FBc0IsS0FBS0MsT0FBTCxDQUFhLFNBQWIsSUFBMEIsRUFBaEQ7a0JBQ2NDLFNBQWQsS0FBNEIsS0FBS0QsT0FBTCxDQUFhLGVBQWIsSUFBZ0MsRUFBNUQ7a0JBQ2NFLE1BQWQsS0FBeUIsS0FBS0YsT0FBTCxDQUFhLFlBQWIsSUFBNkIsRUFBdEQ7a0JBQ2NHLEtBQWQsS0FBd0IsS0FBS0gsT0FBTCxDQUFhLFdBQWIsSUFBNEIsRUFBcEQ7a0JBQ2NJLFdBQWQsS0FBOEIsS0FBS0osT0FBTCxDQUFhLGlCQUFiLElBQWtDLEVBQWhFO2tC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
