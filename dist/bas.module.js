import { AddOperation, BufferAttribute, BufferGeometry, CubeReflectionMapping, CubeRefractionMapping, CubeUVReflectionMapping, CubeUVRefractionMapping, EquirectangularReflectionMapping, EquirectangularRefractionMapping, Math as Math$1, MixOperation, MultiplyOperation, RGBADepthPacking, ShaderLib, ShaderMaterial, SphericalReflectionMapping, UniformsUtils, Vector2, Vector3, Vector4 } from 'three';

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
  return '\n  #define LAMBERT\n\n  varying vec3 vLightFront;\n  \n  #ifdef DOUBLE_SIDED\n  \n    varying vec3 vLightBack;\n  \n  #endif\n  \n  #include <common>\n  #include <uv_pars_vertex>\n  #include <uv2_pars_vertex>\n  #include <envmap_pars_vertex>\n  #include <bsdfs>\n  #include <lights_pars_begin>\n  #include <lights_pars_maps>\n  #include <color_pars_vertex>\n  #include <fog_pars_vertex>\n  #include <morphtarget_pars_vertex>\n  #include <skinning_pars_vertex>\n  #include <shadowmap_pars_vertex>\n  #include <logdepthbuf_pars_vertex>\n  #include <clipping_planes_pars_vertex>\n  \n  ' + this.stringifyChunk('vertexParameters') + '\n  ' + this.stringifyChunk('varyingParameters') + '\n  ' + this.stringifyChunk('vertexFunctions') + '\n  \n  void main() {\n  \n    ' + this.stringifyChunk('vertexInit') + '\n  \n    #include <uv_vertex>\n    #include <uv2_vertex>\n    #include <color_vertex>\n  \n    #include <beginnormal_vertex>\n    \n    ' + this.stringifyChunk('vertexNormal') + '\n    \n    #include <morphnormal_vertex>\n    #include <skinbase_vertex>\n    #include <skinnormal_vertex>\n    #include <defaultnormal_vertex>\n  \n    #include <begin_vertex>\n    \n    ' + this.stringifyChunk('vertexPosition') + '\n    ' + this.stringifyChunk('vertexColor') + '\n    \n    #include <morphtarget_vertex>\n    #include <skinning_vertex>\n    #include <project_vertex>\n    #include <logdepthbuf_vertex>\n    #include <clipping_planes_vertex>\n  \n    #include <worldpos_vertex>\n    #include <envmap_vertex>\n    #include <lights_lambert_vertex>\n    #include <shadowmap_vertex>\n    #include <fog_vertex>\n  }';
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
  return '\n  #define PHONG\n\n  uniform vec3 diffuse;\n  uniform vec3 emissive;\n  uniform vec3 specular;\n  uniform float shininess;\n  uniform float opacity;\n  \n  #include <common>\n  #include <packing>\n  #include <dithering_pars_fragment>\n  #include <color_pars_fragment>\n  #include <uv_pars_fragment>\n  #include <uv2_pars_fragment>\n  #include <map_pars_fragment>\n  #include <alphamap_pars_fragment>\n  #include <aomap_pars_fragment>\n  #include <lightmap_pars_fragment>\n  #include <emissivemap_pars_fragment>\n  #include <envmap_pars_fragment>\n  #include <gradientmap_pars_fragment>\n  #include <fog_pars_fragment>\n  #include <bsdfs>\n  #include <lights_pars_begin>\n  #include <lights_pars_maps>\n  #include <lights_phong_pars_fragment>\n  #include <shadowmap_pars_fragment>\n  #include <bumpmap_pars_fragment>\n  #include <normalmap_pars_fragment>\n  #include <specularmap_pars_fragment>\n  #include <logdepthbuf_pars_fragment>\n  #include <clipping_planes_pars_fragment>\n  \n  ' + this.stringifyChunk('fragmentParameters') + '\n  ' + this.stringifyChunk('varyingParameters') + '\n  ' + this.stringifyChunk('fragmentFunctions') + '\n  \n  void main() {\n  \n    ' + this.stringifyChunk('fragmentInit') + '\n  \n    #include <clipping_planes_fragment>\n  \n    vec4 diffuseColor = vec4( diffuse, opacity );\n    ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );\n    vec3 totalEmissiveRadiance = emissive;\n  \n    ' + this.stringifyChunk('fragmentDiffuse') + '\n  \n    #include <logdepthbuf_fragment>\n\n    ' + (this.stringifyChunk('fragmentMap') || '#include <map_fragment>') + '\n\n    #include <color_fragment>\n    #include <alphamap_fragment>\n    #include <alphatest_fragment>\n    #include <specularmap_fragment>\n    #include <normal_fragment_begin>\n    #include <normal_fragment_maps>\n    \n    ' + this.stringifyChunk('fragmentEmissive') + '\n    \n    #include <emissivemap_fragment>\n  \n    // accumulation\n    #include <lights_phong_fragment>\n    \n    ' + this.stringifyChunk('fragmentSpecular') + '\n    \n    #include <lights_template>\n  \n    // modulation\n    #include <aomap_fragment>\n  \n    vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;\n  \n    #include <envmap_fragment>\n  \n    gl_FragColor = vec4( outgoingLight, diffuseColor.a );\n  \n    #include <tonemapping_fragment>\n    #include <encodings_fragment>\n    #include <fog_fragment>\n    #include <premultiplied_alpha_fragment>\n    #include <dithering_fragment>\n  \n  }';
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
  return '\n  #define PHYSICAL\n  \n  uniform vec3 diffuse;\n  uniform vec3 emissive;\n  uniform float roughness;\n  uniform float metalness;\n  uniform float opacity;\n  \n  #ifndef STANDARD\n    uniform float clearCoat;\n    uniform float clearCoatRoughness;\n  #endif\n  \n  varying vec3 vViewPosition;\n  \n  #ifndef FLAT_SHADED\n  \n    varying vec3 vNormal;\n  \n  #endif\n  \n  #include <common>\n  #include <packing>\n  #include <dithering_pars_fragment>\n  #include <color_pars_fragment>\n  #include <uv_pars_fragment>\n  #include <uv2_pars_fragment>\n  #include <map_pars_fragment>\n  #include <alphamap_pars_fragment>\n  #include <aomap_pars_fragment>\n  #include <lightmap_pars_fragment>\n  #include <emissivemap_pars_fragment>\n  #include <envmap_pars_fragment>\n  #include <fog_pars_fragment>\n  #include <bsdfs>\n  #include <cube_uv_reflection_fragment>\n  #include <lights_pars_begin>\n  #include <lights_pars_maps>\n  #include <lights_physical_pars_fragment>\n  #include <shadowmap_pars_fragment>\n  #include <bumpmap_pars_fragment>\n  #include <normalmap_pars_fragment>\n  #include <roughnessmap_pars_fragment>\n  #include <metalnessmap_pars_fragment>\n  #include <logdepthbuf_pars_fragment>\n  #include <clipping_planes_pars_fragment>\n  \n  ' + this.stringifyChunk('fragmentParameters') + '\n  ' + this.stringifyChunk('varyingParameters') + '\n  ' + this.stringifyChunk('fragmentFunctions') + '\n  \n  void main() {\n  \n    ' + this.stringifyChunk('fragmentInit') + '\n  \n    #include <clipping_planes_fragment>\n  \n    vec4 diffuseColor = vec4( diffuse, opacity );\n    ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );\n    vec3 totalEmissiveRadiance = emissive;\n  \n    ' + this.stringifyChunk('fragmentDiffuse') + '\n  \n    #include <logdepthbuf_fragment>\n\n    ' + (this.stringifyChunk('fragmentMap') || '#include <map_fragment>') + '\n\n    #include <color_fragment>\n    #include <alphamap_fragment>\n    #include <alphatest_fragment>\n    \n    float roughnessFactor = roughness;\n    ' + this.stringifyChunk('fragmentRoughness') + '\n    #ifdef USE_ROUGHNESSMAP\n    \n      vec4 texelRoughness = texture2D( roughnessMap, vUv );\n    \n      // reads channel G, compatible with a combined OcclusionRoughnessMetallic (RGB) texture\n      roughnessFactor *= texelRoughness.g;\n    \n    #endif\n    \n    float metalnessFactor = metalness;\n    ' + this.stringifyChunk('fragmentMetalness') + '\n    #ifdef USE_METALNESSMAP\n    \n      vec4 texelMetalness = texture2D( metalnessMap, vUv );\n      metalnessFactor *= texelMetalness.b;\n    \n    #endif\n    \n    #include <normal_fragment_begin>\n    #include <normal_fragment_maps>\n    \n    ' + this.stringifyChunk('fragmentEmissive') + '\n    \n    #include <emissivemap_fragment>\n  \n    // accumulation\n    #include <lights_physical_fragment>\n    #include <lights_template>\n  \n    // modulation\n    #include <aomap_fragment>\n  \n    vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;\n  \n    gl_FragColor = vec4( outgoingLight, diffuseColor.a );\n  \n    #include <tonemapping_fragment>\n    #include <encodings_fragment>\n    #include <fog_fragment>\n    #include <premultiplied_alpha_fragment>\n    #include <dithering_fragment>\n  \n  }';
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
 * Creates a BufferAttribute with UV coordinates.
 */
PrefabBufferGeometry.prototype.bufferUvs = function () {
  var prefabUvs = [];

  if (this.isPrefabBufferGeometry) {
    var uv = this.prefabGeometry.attributes.uv.array;

    for (var i = 0; i < this.prefabVertexCount; i++) {
      prefabUvs.push(new Vector2(uv[i * 2], uv[i * 2 + 1]));
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
  BufferGeometry.call(this);

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
MultiPrefabBufferGeometry.prototype = Object.create(BufferGeometry.prototype);
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

  this.setIndex(new BufferAttribute(indexBuffer, 1));
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

    v = v || new Vector3();

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
  var attribute = new BufferAttribute(buffer, itemSize);

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
 * @param {function=} factory Function that will be called for each point upon creation. Accepts 3 arguments: data[], index and prefabCount. Calls setPointData.
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

export { BasicAnimationMaterial, LambertAnimationMaterial, PhongAnimationMaterial, StandardAnimationMaterial, PointsAnimationMaterial, DepthAnimationMaterial, DistanceAnimationMaterial, PrefabBufferGeometry, MultiPrefabBufferGeometry, ModelBufferGeometry, PointBufferGeometry, ShaderChunk, Timeline, TimelineSegment, TimelineChunks, TranslationSegment, ScaleSegment, RotationSegment, Utils };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzLm1vZHVsZS5qcyIsInNvdXJjZXMiOlsiLi4vc3JjL21hdGVyaWFscy9CYXNlQW5pbWF0aW9uTWF0ZXJpYWwuanMiLCIuLi9zcmMvbWF0ZXJpYWxzL0Jhc2ljQW5pbWF0aW9uTWF0ZXJpYWwuanMiLCIuLi9zcmMvbWF0ZXJpYWxzL0xhbWJlcnRBbmltYXRpb25NYXRlcmlhbC5qcyIsIi4uL3NyYy9tYXRlcmlhbHMvUGhvbmdBbmltYXRpb25NYXRlcmlhbC5qcyIsIi4uL3NyYy9tYXRlcmlhbHMvU3RhbmRhcmRBbmltYXRpb25NYXRlcmlhbC5qcyIsIi4uL3NyYy9tYXRlcmlhbHMvUG9pbnRzQW5pbWF0aW9uTWF0ZXJpYWwuanMiLCIuLi9zcmMvbWF0ZXJpYWxzL0RlcHRoQW5pbWF0aW9uTWF0ZXJpYWwuanMiLCIuLi9zcmMvbWF0ZXJpYWxzL0Rpc3RhbmNlQW5pbWF0aW9uTWF0ZXJpYWwuanMiLCIuLi9zcmMvZ2VvbWV0cnkvUHJlZmFiQnVmZmVyR2VvbWV0cnkuanMiLCIuLi9zcmMvZ2VvbWV0cnkvTXVsdGlQcmVmYWJCdWZmZXJHZW9tZXRyeS5qcyIsIi4uL3NyYy9VdGlscy5qcyIsIi4uL3NyYy9nZW9tZXRyeS9Nb2RlbEJ1ZmZlckdlb21ldHJ5LmpzIiwiLi4vc3JjL2dlb21ldHJ5L1BvaW50QnVmZmVyR2VvbWV0cnkuanMiLCIuLi9zcmMvU2hhZGVyQ2h1bmsuanMiLCIuLi9zcmMvdGltZWxpbmUvVGltZWxpbmVTZWdtZW50LmpzIiwiLi4vc3JjL3RpbWVsaW5lL1RpbWVsaW5lLmpzIiwiLi4vc3JjL3RpbWVsaW5lL1RpbWVsaW5lQ2h1bmtzLmpzIiwiLi4vc3JjL3RpbWVsaW5lL1RyYW5zbGF0aW9uU2VnbWVudC5qcyIsIi4uL3NyYy90aW1lbGluZS9TY2FsZVNlZ21lbnQuanMiLCIuLi9zcmMvdGltZWxpbmUvUm90YXRpb25TZWdtZW50LmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG4gIFNoYWRlck1hdGVyaWFsLFxuICBVbmlmb3Jtc1V0aWxzLFxuICBDdWJlUmVmbGVjdGlvbk1hcHBpbmcsXG4gIEN1YmVSZWZyYWN0aW9uTWFwcGluZyxcbiAgQ3ViZVVWUmVmbGVjdGlvbk1hcHBpbmcsXG4gIEN1YmVVVlJlZnJhY3Rpb25NYXBwaW5nLFxuICBFcXVpcmVjdGFuZ3VsYXJSZWZsZWN0aW9uTWFwcGluZyxcbiAgRXF1aXJlY3Rhbmd1bGFyUmVmcmFjdGlvbk1hcHBpbmcsXG4gIFNwaGVyaWNhbFJlZmxlY3Rpb25NYXBwaW5nLFxuICBNaXhPcGVyYXRpb24sXG4gIEFkZE9wZXJhdGlvbixcbiAgTXVsdGlwbHlPcGVyYXRpb25cbn0gZnJvbSAndGhyZWUnO1xuXG5mdW5jdGlvbiBCYXNlQW5pbWF0aW9uTWF0ZXJpYWwocGFyYW1ldGVycywgdW5pZm9ybXMpIHtcbiAgU2hhZGVyTWF0ZXJpYWwuY2FsbCh0aGlzKTtcbiAgXG4gIGNvbnN0IHVuaWZvcm1WYWx1ZXMgPSBwYXJhbWV0ZXJzLnVuaWZvcm1WYWx1ZXM7XG4gIGRlbGV0ZSBwYXJhbWV0ZXJzLnVuaWZvcm1WYWx1ZXM7XG4gIFxuICB0aGlzLnNldFZhbHVlcyhwYXJhbWV0ZXJzKTtcbiAgXG4gIHRoaXMudW5pZm9ybXMgPSBVbmlmb3Jtc1V0aWxzLm1lcmdlKFt1bmlmb3JtcywgdGhpcy51bmlmb3Jtc10pO1xuICBcbiAgdGhpcy5zZXRVbmlmb3JtVmFsdWVzKHVuaWZvcm1WYWx1ZXMpO1xuICBcbiAgaWYgKHVuaWZvcm1WYWx1ZXMpIHtcbiAgICB1bmlmb3JtVmFsdWVzLm1hcCAmJiAodGhpcy5kZWZpbmVzWydVU0VfTUFQJ10gPSAnJyk7XG4gICAgdW5pZm9ybVZhbHVlcy5ub3JtYWxNYXAgJiYgKHRoaXMuZGVmaW5lc1snVVNFX05PUk1BTE1BUCddID0gJycpO1xuICAgIHVuaWZvcm1WYWx1ZXMuZW52TWFwICYmICh0aGlzLmRlZmluZXNbJ1VTRV9FTlZNQVAnXSA9ICcnKTtcbiAgICB1bmlmb3JtVmFsdWVzLmFvTWFwICYmICh0aGlzLmRlZmluZXNbJ1VTRV9BT01BUCddID0gJycpO1xuICAgIHVuaWZvcm1WYWx1ZXMuc3BlY3VsYXJNYXAgJiYgKHRoaXMuZGVmaW5lc1snVVNFX1NQRUNVTEFSTUFQJ10gPSAnJyk7XG4gICAgdW5pZm9ybVZhbHVlcy5hbHBoYU1hcCAmJiAodGhpcy5kZWZpbmVzWydVU0VfQUxQSEFNQVAnXSA9ICcnKTtcbiAgICB1bmlmb3JtVmFsdWVzLmxpZ2h0TWFwICYmICh0aGlzLmRlZmluZXNbJ1VTRV9MSUdIVE1BUCddID0gJycpO1xuICAgIHVuaWZvcm1WYWx1ZXMuZW1pc3NpdmVNYXAgJiYgKHRoaXMuZGVmaW5lc1snVVNFX0VNSVNTSVZFTUFQJ10gPSAnJyk7XG4gICAgdW5pZm9ybVZhbHVlcy5idW1wTWFwICYmICh0aGlzLmRlZmluZXNbJ1VTRV9CVU1QTUFQJ10gPSAnJyk7XG4gICAgdW5pZm9ybVZhbHVlcy5kaXNwbGFjZW1lbnRNYXAgJiYgKHRoaXMuZGVmaW5lc1snVVNFX0RJU1BMQUNFTUVOVE1BUCddID0gJycpO1xuICAgIHVuaWZvcm1WYWx1ZXMucm91Z2huZXNzTWFwICYmICh0aGlzLmRlZmluZXNbJ1VTRV9ESVNQTEFDRU1FTlRNQVAnXSA9ICcnKTtcbiAgICB1bmlmb3JtVmFsdWVzLnJvdWdobmVzc01hcCAmJiAodGhpcy5kZWZpbmVzWydVU0VfUk9VR0hORVNTTUFQJ10gPSAnJyk7XG4gICAgdW5pZm9ybVZhbHVlcy5tZXRhbG5lc3NNYXAgJiYgKHRoaXMuZGVmaW5lc1snVVNFX01FVEFMTkVTU01BUCddID0gJycpO1xuICBcbiAgICBpZiAodW5pZm9ybVZhbHVlcy5lbnZNYXApIHtcbiAgICAgIHRoaXMuZGVmaW5lc1snVVNFX0VOVk1BUCddID0gJyc7XG4gICAgXG4gICAgICBsZXQgZW52TWFwVHlwZURlZmluZSA9ICdFTlZNQVBfVFlQRV9DVUJFJztcbiAgICAgIGxldCBlbnZNYXBNb2RlRGVmaW5lID0gJ0VOVk1BUF9NT0RFX1JFRkxFQ1RJT04nO1xuICAgICAgbGV0IGVudk1hcEJsZW5kaW5nRGVmaW5lID0gJ0VOVk1BUF9CTEVORElOR19NVUxUSVBMWSc7XG4gICAgXG4gICAgICBzd2l0Y2ggKHVuaWZvcm1WYWx1ZXMuZW52TWFwLm1hcHBpbmcpIHtcbiAgICAgICAgY2FzZSBDdWJlUmVmbGVjdGlvbk1hcHBpbmc6XG4gICAgICAgIGNhc2UgQ3ViZVJlZnJhY3Rpb25NYXBwaW5nOlxuICAgICAgICAgIGVudk1hcFR5cGVEZWZpbmUgPSAnRU5WTUFQX1RZUEVfQ1VCRSc7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ3ViZVVWUmVmbGVjdGlvbk1hcHBpbmc6XG4gICAgICAgIGNhc2UgQ3ViZVVWUmVmcmFjdGlvbk1hcHBpbmc6XG4gICAgICAgICAgZW52TWFwVHlwZURlZmluZSA9ICdFTlZNQVBfVFlQRV9DVUJFX1VWJztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBFcXVpcmVjdGFuZ3VsYXJSZWZsZWN0aW9uTWFwcGluZzpcbiAgICAgICAgY2FzZSBFcXVpcmVjdGFuZ3VsYXJSZWZyYWN0aW9uTWFwcGluZzpcbiAgICAgICAgICBlbnZNYXBUeXBlRGVmaW5lID0gJ0VOVk1BUF9UWVBFX0VRVUlSRUMnO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFNwaGVyaWNhbFJlZmxlY3Rpb25NYXBwaW5nOlxuICAgICAgICAgIGVudk1hcFR5cGVEZWZpbmUgPSAnRU5WTUFQX1RZUEVfU1BIRVJFJztcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICBcbiAgICAgIHN3aXRjaCAodW5pZm9ybVZhbHVlcy5lbnZNYXAubWFwcGluZykge1xuICAgICAgICBjYXNlIEN1YmVSZWZyYWN0aW9uTWFwcGluZzpcbiAgICAgICAgY2FzZSBFcXVpcmVjdGFuZ3VsYXJSZWZyYWN0aW9uTWFwcGluZzpcbiAgICAgICAgICBlbnZNYXBNb2RlRGVmaW5lID0gJ0VOVk1BUF9NT0RFX1JFRlJBQ1RJT04nO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIFxuICAgICAgc3dpdGNoICh1bmlmb3JtVmFsdWVzLmNvbWJpbmUpIHtcbiAgICAgICAgY2FzZSBNaXhPcGVyYXRpb246XG4gICAgICAgICAgZW52TWFwQmxlbmRpbmdEZWZpbmUgPSAnRU5WTUFQX0JMRU5ESU5HX01JWCc7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQWRkT3BlcmF0aW9uOlxuICAgICAgICAgIGVudk1hcEJsZW5kaW5nRGVmaW5lID0gJ0VOVk1BUF9CTEVORElOR19BREQnO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIE11bHRpcGx5T3BlcmF0aW9uOlxuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIGVudk1hcEJsZW5kaW5nRGVmaW5lID0gJ0VOVk1BUF9CTEVORElOR19NVUxUSVBMWSc7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgXG4gICAgICB0aGlzLmRlZmluZXNbZW52TWFwVHlwZURlZmluZV0gPSAnJztcbiAgICAgIHRoaXMuZGVmaW5lc1tlbnZNYXBCbGVuZGluZ0RlZmluZV0gPSAnJztcbiAgICAgIHRoaXMuZGVmaW5lc1tlbnZNYXBNb2RlRGVmaW5lXSA9ICcnO1xuICAgIH1cbiAgfVxufVxuXG5CYXNlQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlID0gT2JqZWN0LmFzc2lnbihPYmplY3QuY3JlYXRlKFNoYWRlck1hdGVyaWFsLnByb3RvdHlwZSksIHtcbiAgY29uc3RydWN0b3I6IEJhc2VBbmltYXRpb25NYXRlcmlhbCxcbiAgXG4gIHNldFVuaWZvcm1WYWx1ZXModmFsdWVzKSB7XG4gICAgaWYgKCF2YWx1ZXMpIHJldHVybjtcbiAgICBcbiAgICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXModmFsdWVzKTtcbiAgICBcbiAgICBrZXlzLmZvckVhY2goKGtleSkgPT4ge1xuICAgICAga2V5IGluIHRoaXMudW5pZm9ybXMgJiYgKHRoaXMudW5pZm9ybXNba2V5XS52YWx1ZSA9IHZhbHVlc1trZXldKTtcbiAgICB9KTtcbiAgfSxcbiAgXG4gIHN0cmluZ2lmeUNodW5rKG5hbWUpIHtcbiAgICBsZXQgdmFsdWU7XG4gICAgXG4gICAgaWYgKCF0aGlzW25hbWVdKSB7XG4gICAgICB2YWx1ZSA9ICcnO1xuICAgIH1cbiAgICBlbHNlIGlmICh0eXBlb2YgdGhpc1tuYW1lXSA9PT0gICdzdHJpbmcnKSB7XG4gICAgICB2YWx1ZSA9IHRoaXNbbmFtZV07XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgdmFsdWUgPSB0aGlzW25hbWVdLmpvaW4oJ1xcbicpO1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cbn0pO1xuXG5leHBvcnQgZGVmYXVsdCBCYXNlQW5pbWF0aW9uTWF0ZXJpYWw7XG4iLCJpbXBvcnQgeyBTaGFkZXJMaWIgfSBmcm9tICd0aHJlZSc7XG5pbXBvcnQgQmFzZUFuaW1hdGlvbk1hdGVyaWFsIGZyb20gJy4vQmFzZUFuaW1hdGlvbk1hdGVyaWFsJztcblxuLyoqXG4gKiBFeHRlbmRzIFRIUkVFLk1lc2hCYXNpY01hdGVyaWFsIHdpdGggY3VzdG9tIHNoYWRlciBjaHVua3MuXG4gKlxuICogQHNlZSBodHRwOi8vdGhyZWUtYmFzLWV4YW1wbGVzLnN1cmdlLnNoL2V4YW1wbGVzL21hdGVyaWFsc19iYXNpYy9cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gcGFyYW1ldGVycyBPYmplY3QgY29udGFpbmluZyBtYXRlcmlhbCBwcm9wZXJ0aWVzIGFuZCBjdXN0b20gc2hhZGVyIGNodW5rcy5cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBCYXNpY0FuaW1hdGlvbk1hdGVyaWFsKHBhcmFtZXRlcnMpIHtcbiAgdGhpcy52YXJ5aW5nUGFyYW1ldGVycyA9IFtdO1xuICBcbiAgdGhpcy52ZXJ0ZXhQYXJhbWV0ZXJzID0gW107XG4gIHRoaXMudmVydGV4RnVuY3Rpb25zID0gW107XG4gIHRoaXMudmVydGV4SW5pdCA9IFtdO1xuICB0aGlzLnZlcnRleE5vcm1hbCA9IFtdO1xuICB0aGlzLnZlcnRleFBvc2l0aW9uID0gW107XG4gIHRoaXMudmVydGV4Q29sb3IgPSBbXTtcbiAgXG4gIHRoaXMuZnJhZ21lbnRGdW5jdGlvbnMgPSBbXTtcbiAgdGhpcy5mcmFnbWVudFBhcmFtZXRlcnMgPSBbXTtcbiAgdGhpcy5mcmFnbWVudEluaXQgPSBbXTtcbiAgdGhpcy5mcmFnbWVudE1hcCA9IFtdO1xuICB0aGlzLmZyYWdtZW50RGlmZnVzZSA9IFtdO1xuICBcbiAgQmFzZUFuaW1hdGlvbk1hdGVyaWFsLmNhbGwodGhpcywgcGFyYW1ldGVycywgU2hhZGVyTGliWydiYXNpYyddLnVuaWZvcm1zKTtcbiAgXG4gIHRoaXMubGlnaHRzID0gZmFsc2U7XG4gIHRoaXMudmVydGV4U2hhZGVyID0gdGhpcy5jb25jYXRWZXJ0ZXhTaGFkZXIoKTtcbiAgdGhpcy5mcmFnbWVudFNoYWRlciA9IHRoaXMuY29uY2F0RnJhZ21lbnRTaGFkZXIoKTtcbn1cbkJhc2ljQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShCYXNlQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlKTtcbkJhc2ljQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gQmFzaWNBbmltYXRpb25NYXRlcmlhbDtcblxuQmFzaWNBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uY2F0VmVydGV4U2hhZGVyID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBgXG4gICNpbmNsdWRlIDxjb21tb24+XG4gICNpbmNsdWRlIDx1dl9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPHV2Ml9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPGVudm1hcF9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPGNvbG9yX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8Zm9nX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8bW9ycGh0YXJnZXRfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxza2lubmluZ19wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPGxvZ2RlcHRoYnVmX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX3BhcnNfdmVydGV4PlxuICBcbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQYXJhbWV0ZXJzJyl9XG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmFyeWluZ1BhcmFtZXRlcnMnKX1cbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhGdW5jdGlvbnMnKX1cbiAgXG4gIHZvaWQgbWFpbigpIHtcblxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4SW5pdCcpfVxuICBcbiAgICAjaW5jbHVkZSA8dXZfdmVydGV4PlxuICAgICNpbmNsdWRlIDx1djJfdmVydGV4PlxuICAgICNpbmNsdWRlIDxjb2xvcl92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPHNraW5iYXNlX3ZlcnRleD5cbiAgXG4gICAgI2lmZGVmIFVTRV9FTlZNQVBcbiAgXG4gICAgI2luY2x1ZGUgPGJlZ2lubm9ybWFsX3ZlcnRleD5cbiAgICBcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleE5vcm1hbCcpfVxuICAgIFxuICAgICNpbmNsdWRlIDxtb3JwaG5vcm1hbF92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPHNraW5ub3JtYWxfdmVydGV4PlxuICAgICNpbmNsdWRlIDxkZWZhdWx0bm9ybWFsX3ZlcnRleD5cbiAgXG4gICAgI2VuZGlmXG4gIFxuICAgICNpbmNsdWRlIDxiZWdpbl92ZXJ0ZXg+XG4gICAgXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQb3NpdGlvbicpfVxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4Q29sb3InKX1cbiAgICBcbiAgICAjaW5jbHVkZSA8bW9ycGh0YXJnZXRfdmVydGV4PlxuICAgICNpbmNsdWRlIDxza2lubmluZ192ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPHByb2plY3RfdmVydGV4PlxuICAgICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl92ZXJ0ZXg+XG4gIFxuICAgICNpbmNsdWRlIDx3b3JsZHBvc192ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc192ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPGVudm1hcF92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPGZvZ192ZXJ0ZXg+XG4gIH1gO1xufTtcblxuQmFzaWNBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uY2F0RnJhZ21lbnRTaGFkZXIgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIGBcbiAgdW5pZm9ybSB2ZWMzIGRpZmZ1c2U7XG4gIHVuaWZvcm0gZmxvYXQgb3BhY2l0eTtcbiAgXG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRQYXJhbWV0ZXJzJyl9XG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmFyeWluZ1BhcmFtZXRlcnMnKX1cbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudEZ1bmN0aW9ucycpfVxuICBcbiAgI2lmbmRlZiBGTEFUX1NIQURFRFxuICBcbiAgICB2YXJ5aW5nIHZlYzMgdk5vcm1hbDtcbiAgXG4gICNlbmRpZlxuICBcbiAgI2luY2x1ZGUgPGNvbW1vbj5cbiAgI2luY2x1ZGUgPGNvbG9yX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDx1dl9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8dXYyX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxtYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGFscGhhbWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxhb21hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8bGlnaHRtYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGVudm1hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8Zm9nX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxzcGVjdWxhcm1hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc19wYXJzX2ZyYWdtZW50PlxuICBcbiAgdm9pZCBtYWluKCkge1xuICBcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50SW5pdCcpfVxuICBcbiAgICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX2ZyYWdtZW50PlxuXG4gICAgdmVjNCBkaWZmdXNlQ29sb3IgPSB2ZWM0KCBkaWZmdXNlLCBvcGFjaXR5ICk7XG5cbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50RGlmZnVzZScpfVxuICBcbiAgICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfZnJhZ21lbnQ+XG4gICAgXG4gICAgJHsodGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRNYXAnKSB8fCAnI2luY2x1ZGUgPG1hcF9mcmFnbWVudD4nKX1cbiAgICBcbiAgICAjaW5jbHVkZSA8Y29sb3JfZnJhZ21lbnQ+XG4gICAgI2luY2x1ZGUgPGFscGhhbWFwX2ZyYWdtZW50PlxuICAgICNpbmNsdWRlIDxhbHBoYXRlc3RfZnJhZ21lbnQ+XG4gICAgI2luY2x1ZGUgPHNwZWN1bGFybWFwX2ZyYWdtZW50PlxuICBcbiAgICBSZWZsZWN0ZWRMaWdodCByZWZsZWN0ZWRMaWdodCA9IFJlZmxlY3RlZExpZ2h0KCB2ZWMzKCAwLjAgKSwgdmVjMyggMC4wICksIHZlYzMoIDAuMCApLCB2ZWMzKCAwLjAgKSApO1xuICBcbiAgICAvLyBhY2N1bXVsYXRpb24gKGJha2VkIGluZGlyZWN0IGxpZ2h0aW5nIG9ubHkpXG4gICAgI2lmZGVmIFVTRV9MSUdIVE1BUFxuICBcbiAgICAgIHJlZmxlY3RlZExpZ2h0LmluZGlyZWN0RGlmZnVzZSArPSB0ZXh0dXJlMkQoIGxpZ2h0TWFwLCB2VXYyICkueHl6ICogbGlnaHRNYXBJbnRlbnNpdHk7XG4gIFxuICAgICNlbHNlXG4gIFxuICAgICAgcmVmbGVjdGVkTGlnaHQuaW5kaXJlY3REaWZmdXNlICs9IHZlYzMoIDEuMCApO1xuICBcbiAgICAjZW5kaWZcbiAgXG4gICAgLy8gbW9kdWxhdGlvblxuICAgICNpbmNsdWRlIDxhb21hcF9mcmFnbWVudD5cbiAgXG4gICAgcmVmbGVjdGVkTGlnaHQuaW5kaXJlY3REaWZmdXNlICo9IGRpZmZ1c2VDb2xvci5yZ2I7XG4gIFxuICAgIHZlYzMgb3V0Z29pbmdMaWdodCA9IHJlZmxlY3RlZExpZ2h0LmluZGlyZWN0RGlmZnVzZTtcbiAgXG4gICAgI2luY2x1ZGUgPGVudm1hcF9mcmFnbWVudD5cbiAgXG4gICAgZ2xfRnJhZ0NvbG9yID0gdmVjNCggb3V0Z29pbmdMaWdodCwgZGlmZnVzZUNvbG9yLmEgKTtcbiAgXG4gICAgI2luY2x1ZGUgPHByZW11bHRpcGxpZWRfYWxwaGFfZnJhZ21lbnQ+XG4gICAgI2luY2x1ZGUgPHRvbmVtYXBwaW5nX2ZyYWdtZW50PlxuICAgICNpbmNsdWRlIDxlbmNvZGluZ3NfZnJhZ21lbnQ+XG4gICAgI2luY2x1ZGUgPGZvZ19mcmFnbWVudD5cbiAgfWA7XG59O1xuXG5leHBvcnQgeyBCYXNpY0FuaW1hdGlvbk1hdGVyaWFsIH07XG4iLCJpbXBvcnQgeyBTaGFkZXJMaWIgfSBmcm9tICd0aHJlZSc7XG5pbXBvcnQgQmFzZUFuaW1hdGlvbk1hdGVyaWFsIGZyb20gJy4vQmFzZUFuaW1hdGlvbk1hdGVyaWFsJztcblxuLyoqXG4gKiBFeHRlbmRzIFRIUkVFLk1lc2hMYW1iZXJ0TWF0ZXJpYWwgd2l0aCBjdXN0b20gc2hhZGVyIGNodW5rcy5cbiAqXG4gKiBAc2VlIGh0dHA6Ly90aHJlZS1iYXMtZXhhbXBsZXMuc3VyZ2Uuc2gvZXhhbXBsZXMvbWF0ZXJpYWxzX2xhbWJlcnQvXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IHBhcmFtZXRlcnMgT2JqZWN0IGNvbnRhaW5pbmcgbWF0ZXJpYWwgcHJvcGVydGllcyBhbmQgY3VzdG9tIHNoYWRlciBjaHVua3MuXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gTGFtYmVydEFuaW1hdGlvbk1hdGVyaWFsKHBhcmFtZXRlcnMpIHtcbiAgdGhpcy52YXJ5aW5nUGFyYW1ldGVycyA9IFtdO1xuICBcbiAgdGhpcy52ZXJ0ZXhGdW5jdGlvbnMgPSBbXTtcbiAgdGhpcy52ZXJ0ZXhQYXJhbWV0ZXJzID0gW107XG4gIHRoaXMudmVydGV4SW5pdCA9IFtdO1xuICB0aGlzLnZlcnRleE5vcm1hbCA9IFtdO1xuICB0aGlzLnZlcnRleFBvc2l0aW9uID0gW107XG4gIHRoaXMudmVydGV4Q29sb3IgPSBbXTtcbiAgXG4gIHRoaXMuZnJhZ21lbnRGdW5jdGlvbnMgPSBbXTtcbiAgdGhpcy5mcmFnbWVudFBhcmFtZXRlcnMgPSBbXTtcbiAgdGhpcy5mcmFnbWVudEluaXQgPSBbXTtcbiAgdGhpcy5mcmFnbWVudE1hcCA9IFtdO1xuICB0aGlzLmZyYWdtZW50RGlmZnVzZSA9IFtdO1xuICB0aGlzLmZyYWdtZW50RW1pc3NpdmUgPSBbXTtcbiAgdGhpcy5mcmFnbWVudFNwZWN1bGFyID0gW107XG4gIFxuICBCYXNlQW5pbWF0aW9uTWF0ZXJpYWwuY2FsbCh0aGlzLCBwYXJhbWV0ZXJzLCBTaGFkZXJMaWJbJ2xhbWJlcnQnXS51bmlmb3Jtcyk7XG4gIFxuICB0aGlzLmxpZ2h0cyA9IHRydWU7XG4gIHRoaXMudmVydGV4U2hhZGVyID0gdGhpcy5jb25jYXRWZXJ0ZXhTaGFkZXIoKTtcbiAgdGhpcy5mcmFnbWVudFNoYWRlciA9IHRoaXMuY29uY2F0RnJhZ21lbnRTaGFkZXIoKTtcbn1cbkxhbWJlcnRBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEJhc2VBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUpO1xuTGFtYmVydEFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IExhbWJlcnRBbmltYXRpb25NYXRlcmlhbDtcblxuTGFtYmVydEFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZS5jb25jYXRWZXJ0ZXhTaGFkZXIgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiBgXG4gICNkZWZpbmUgTEFNQkVSVFxuXG4gIHZhcnlpbmcgdmVjMyB2TGlnaHRGcm9udDtcbiAgXG4gICNpZmRlZiBET1VCTEVfU0lERURcbiAgXG4gICAgdmFyeWluZyB2ZWMzIHZMaWdodEJhY2s7XG4gIFxuICAjZW5kaWZcbiAgXG4gICNpbmNsdWRlIDxjb21tb24+XG4gICNpbmNsdWRlIDx1dl9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPHV2Ml9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPGVudm1hcF9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPGJzZGZzPlxuICAjaW5jbHVkZSA8bGlnaHRzX3BhcnNfYmVnaW4+XG4gICNpbmNsdWRlIDxsaWdodHNfcGFyc19tYXBzPlxuICAjaW5jbHVkZSA8Y29sb3JfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxmb2dfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxtb3JwaHRhcmdldF9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPHNraW5uaW5nX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8c2hhZG93bWFwX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfcGFyc192ZXJ0ZXg+XG4gIFxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBhcmFtZXRlcnMnKX1cbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2YXJ5aW5nUGFyYW1ldGVycycpfVxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleEZ1bmN0aW9ucycpfVxuICBcbiAgdm9pZCBtYWluKCkge1xuICBcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleEluaXQnKX1cbiAgXG4gICAgI2luY2x1ZGUgPHV2X3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8dXYyX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8Y29sb3JfdmVydGV4PlxuICBcbiAgICAjaW5jbHVkZSA8YmVnaW5ub3JtYWxfdmVydGV4PlxuICAgIFxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4Tm9ybWFsJyl9XG4gICAgXG4gICAgI2luY2x1ZGUgPG1vcnBobm9ybWFsX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8c2tpbmJhc2VfdmVydGV4PlxuICAgICNpbmNsdWRlIDxza2lubm9ybWFsX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8ZGVmYXVsdG5vcm1hbF92ZXJ0ZXg+XG4gIFxuICAgICNpbmNsdWRlIDxiZWdpbl92ZXJ0ZXg+XG4gICAgXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQb3NpdGlvbicpfVxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4Q29sb3InKX1cbiAgICBcbiAgICAjaW5jbHVkZSA8bW9ycGh0YXJnZXRfdmVydGV4PlxuICAgICNpbmNsdWRlIDxza2lubmluZ192ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPHByb2plY3RfdmVydGV4PlxuICAgICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc192ZXJ0ZXg+XG4gIFxuICAgICNpbmNsdWRlIDx3b3JsZHBvc192ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPGVudm1hcF92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPGxpZ2h0c19sYW1iZXJ0X3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8c2hhZG93bWFwX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8Zm9nX3ZlcnRleD5cbiAgfWA7XG59O1xuXG5MYW1iZXJ0QW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlLmNvbmNhdEZyYWdtZW50U2hhZGVyID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gYFxuICB1bmlmb3JtIHZlYzMgZGlmZnVzZTtcbiAgdW5pZm9ybSB2ZWMzIGVtaXNzaXZlO1xuICB1bmlmb3JtIGZsb2F0IG9wYWNpdHk7XG4gIFxuICB2YXJ5aW5nIHZlYzMgdkxpZ2h0RnJvbnQ7XG4gIFxuICAjaWZkZWYgRE9VQkxFX1NJREVEXG4gIFxuICAgIHZhcnlpbmcgdmVjMyB2TGlnaHRCYWNrO1xuICBcbiAgI2VuZGlmXG4gIFxuICAjaW5jbHVkZSA8Y29tbW9uPlxuICAjaW5jbHVkZSA8cGFja2luZz5cbiAgI2luY2x1ZGUgPGRpdGhlcmluZ19wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8Y29sb3JfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPHV2X3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDx1djJfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPG1hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8YWxwaGFtYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGFvbWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxsaWdodG1hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8ZW1pc3NpdmVtYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGVudm1hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8YnNkZnM+XG4gICNpbmNsdWRlIDxsaWdodHNfcGFyc19iZWdpbj5cbiAgI2luY2x1ZGUgPGxpZ2h0c19wYXJzX21hcHM+XG4gICNpbmNsdWRlIDxmb2dfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPHNoYWRvd21hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8c2hhZG93bWFza19wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8c3BlY3VsYXJtYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGxvZ2RlcHRoYnVmX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfcGFyc19mcmFnbWVudD5cbiAgXG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRQYXJhbWV0ZXJzJyl9XG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmFyeWluZ1BhcmFtZXRlcnMnKX1cbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudEZ1bmN0aW9ucycpfVxuICBcbiAgdm9pZCBtYWluKCkge1xuICBcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50SW5pdCcpfVxuICBcbiAgICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX2ZyYWdtZW50PlxuXG4gICAgdmVjNCBkaWZmdXNlQ29sb3IgPSB2ZWM0KCBkaWZmdXNlLCBvcGFjaXR5ICk7XG4gICAgUmVmbGVjdGVkTGlnaHQgcmVmbGVjdGVkTGlnaHQgPSBSZWZsZWN0ZWRMaWdodCggdmVjMyggMC4wICksIHZlYzMoIDAuMCApLCB2ZWMzKCAwLjAgKSwgdmVjMyggMC4wICkgKTtcbiAgICB2ZWMzIHRvdGFsRW1pc3NpdmVSYWRpYW5jZSA9IGVtaXNzaXZlO1xuXHRcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50RGlmZnVzZScpfVxuICBcbiAgICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfZnJhZ21lbnQ+XG5cbiAgICAkeyh0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudE1hcCcpIHx8ICcjaW5jbHVkZSA8bWFwX2ZyYWdtZW50PicpfVxuXG4gICAgI2luY2x1ZGUgPGNvbG9yX2ZyYWdtZW50PlxuICAgICNpbmNsdWRlIDxhbHBoYW1hcF9mcmFnbWVudD5cbiAgICAjaW5jbHVkZSA8YWxwaGF0ZXN0X2ZyYWdtZW50PlxuICAgICNpbmNsdWRlIDxzcGVjdWxhcm1hcF9mcmFnbWVudD5cblxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRFbWlzc2l2ZScpfVxuXG4gICAgI2luY2x1ZGUgPGVtaXNzaXZlbWFwX2ZyYWdtZW50PlxuICBcbiAgICAvLyBhY2N1bXVsYXRpb25cbiAgICByZWZsZWN0ZWRMaWdodC5pbmRpcmVjdERpZmZ1c2UgPSBnZXRBbWJpZW50TGlnaHRJcnJhZGlhbmNlKCBhbWJpZW50TGlnaHRDb2xvciApO1xuICBcbiAgICAjaW5jbHVkZSA8bGlnaHRtYXBfZnJhZ21lbnQ+XG4gIFxuICAgIHJlZmxlY3RlZExpZ2h0LmluZGlyZWN0RGlmZnVzZSAqPSBCUkRGX0RpZmZ1c2VfTGFtYmVydCggZGlmZnVzZUNvbG9yLnJnYiApO1xuICBcbiAgICAjaWZkZWYgRE9VQkxFX1NJREVEXG4gIFxuICAgICAgcmVmbGVjdGVkTGlnaHQuZGlyZWN0RGlmZnVzZSA9ICggZ2xfRnJvbnRGYWNpbmcgKSA/IHZMaWdodEZyb250IDogdkxpZ2h0QmFjaztcbiAgXG4gICAgI2Vsc2VcbiAgXG4gICAgICByZWZsZWN0ZWRMaWdodC5kaXJlY3REaWZmdXNlID0gdkxpZ2h0RnJvbnQ7XG4gIFxuICAgICNlbmRpZlxuICBcbiAgICByZWZsZWN0ZWRMaWdodC5kaXJlY3REaWZmdXNlICo9IEJSREZfRGlmZnVzZV9MYW1iZXJ0KCBkaWZmdXNlQ29sb3IucmdiICkgKiBnZXRTaGFkb3dNYXNrKCk7XG4gIFxuICAgIC8vIG1vZHVsYXRpb25cbiAgICAjaW5jbHVkZSA8YW9tYXBfZnJhZ21lbnQ+XG4gIFxuICAgIHZlYzMgb3V0Z29pbmdMaWdodCA9IHJlZmxlY3RlZExpZ2h0LmRpcmVjdERpZmZ1c2UgKyByZWZsZWN0ZWRMaWdodC5pbmRpcmVjdERpZmZ1c2UgKyB0b3RhbEVtaXNzaXZlUmFkaWFuY2U7XG4gIFxuICAgICNpbmNsdWRlIDxlbnZtYXBfZnJhZ21lbnQ+XG4gIFxuICAgIGdsX0ZyYWdDb2xvciA9IHZlYzQoIG91dGdvaW5nTGlnaHQsIGRpZmZ1c2VDb2xvci5hICk7XG4gIFxuICAgICNpbmNsdWRlIDx0b25lbWFwcGluZ19mcmFnbWVudD5cbiAgICAjaW5jbHVkZSA8ZW5jb2RpbmdzX2ZyYWdtZW50PlxuICAgICNpbmNsdWRlIDxmb2dfZnJhZ21lbnQ+XG4gICAgI2luY2x1ZGUgPHByZW11bHRpcGxpZWRfYWxwaGFfZnJhZ21lbnQ+XG4gICAgI2luY2x1ZGUgPGRpdGhlcmluZ19mcmFnbWVudD5cbiAgfWA7XG59O1xuXG5leHBvcnQgeyBMYW1iZXJ0QW5pbWF0aW9uTWF0ZXJpYWwgfTtcbiIsImltcG9ydCB7IFNoYWRlckxpYiB9IGZyb20gJ3RocmVlJztcbmltcG9ydCBCYXNlQW5pbWF0aW9uTWF0ZXJpYWwgZnJvbSAnLi9CYXNlQW5pbWF0aW9uTWF0ZXJpYWwnO1xuXG4vKipcbiAqIEV4dGVuZHMgVEhSRUUuTWVzaFBob25nTWF0ZXJpYWwgd2l0aCBjdXN0b20gc2hhZGVyIGNodW5rcy5cbiAqXG4gKiBAc2VlIGh0dHA6Ly90aHJlZS1iYXMtZXhhbXBsZXMuc3VyZ2Uuc2gvZXhhbXBsZXMvbWF0ZXJpYWxzX3Bob25nL1xuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBwYXJhbWV0ZXJzIE9iamVjdCBjb250YWluaW5nIG1hdGVyaWFsIHByb3BlcnRpZXMgYW5kIGN1c3RvbSBzaGFkZXIgY2h1bmtzLlxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIFBob25nQW5pbWF0aW9uTWF0ZXJpYWwocGFyYW1ldGVycykge1xuICB0aGlzLnZhcnlpbmdQYXJhbWV0ZXJzID0gW107XG5cbiAgdGhpcy52ZXJ0ZXhGdW5jdGlvbnMgPSBbXTtcbiAgdGhpcy52ZXJ0ZXhQYXJhbWV0ZXJzID0gW107XG4gIHRoaXMudmVydGV4SW5pdCA9IFtdO1xuICB0aGlzLnZlcnRleE5vcm1hbCA9IFtdO1xuICB0aGlzLnZlcnRleFBvc2l0aW9uID0gW107XG4gIHRoaXMudmVydGV4Q29sb3IgPSBbXTtcblxuICB0aGlzLmZyYWdtZW50RnVuY3Rpb25zID0gW107XG4gIHRoaXMuZnJhZ21lbnRQYXJhbWV0ZXJzID0gW107XG4gIHRoaXMuZnJhZ21lbnRJbml0ID0gW107XG4gIHRoaXMuZnJhZ21lbnRNYXAgPSBbXTtcbiAgdGhpcy5mcmFnbWVudERpZmZ1c2UgPSBbXTtcbiAgdGhpcy5mcmFnbWVudEVtaXNzaXZlID0gW107XG4gIHRoaXMuZnJhZ21lbnRTcGVjdWxhciA9IFtdO1xuXG4gIEJhc2VBbmltYXRpb25NYXRlcmlhbC5jYWxsKHRoaXMsIHBhcmFtZXRlcnMsIFNoYWRlckxpYlsncGhvbmcnXS51bmlmb3Jtcyk7XG5cbiAgdGhpcy5saWdodHMgPSB0cnVlO1xuICB0aGlzLnZlcnRleFNoYWRlciA9IHRoaXMuY29uY2F0VmVydGV4U2hhZGVyKCk7XG4gIHRoaXMuZnJhZ21lbnRTaGFkZXIgPSB0aGlzLmNvbmNhdEZyYWdtZW50U2hhZGVyKCk7XG59XG5QaG9uZ0FuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoQmFzZUFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZSk7XG5QaG9uZ0FuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFBob25nQW5pbWF0aW9uTWF0ZXJpYWw7XG5cblBob25nQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlLmNvbmNhdFZlcnRleFNoYWRlciA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIGBcbiAgI2RlZmluZSBQSE9OR1xuXG4gIHZhcnlpbmcgdmVjMyB2Vmlld1Bvc2l0aW9uO1xuICBcbiAgI2lmbmRlZiBGTEFUX1NIQURFRFxuICBcbiAgICB2YXJ5aW5nIHZlYzMgdk5vcm1hbDtcbiAgXG4gICNlbmRpZlxuICBcbiAgI2luY2x1ZGUgPGNvbW1vbj5cbiAgI2luY2x1ZGUgPHV2X3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8dXYyX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8ZGlzcGxhY2VtZW50bWFwX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8ZW52bWFwX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8Y29sb3JfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxmb2dfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxtb3JwaHRhcmdldF9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPHNraW5uaW5nX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8c2hhZG93bWFwX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfcGFyc192ZXJ0ZXg+XG4gIFxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBhcmFtZXRlcnMnKX1cbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2YXJ5aW5nUGFyYW1ldGVycycpfVxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleEZ1bmN0aW9ucycpfVxuICBcbiAgdm9pZCBtYWluKCkge1xuICBcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleEluaXQnKX1cbiAgXG4gICAgI2luY2x1ZGUgPHV2X3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8dXYyX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8Y29sb3JfdmVydGV4PlxuICBcbiAgICAjaW5jbHVkZSA8YmVnaW5ub3JtYWxfdmVydGV4PlxuICAgIFxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4Tm9ybWFsJyl9XG4gICAgXG4gICAgI2luY2x1ZGUgPG1vcnBobm9ybWFsX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8c2tpbmJhc2VfdmVydGV4PlxuICAgICNpbmNsdWRlIDxza2lubm9ybWFsX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8ZGVmYXVsdG5vcm1hbF92ZXJ0ZXg+XG4gIFxuICAjaWZuZGVmIEZMQVRfU0hBREVEIC8vIE5vcm1hbCBjb21wdXRlZCB3aXRoIGRlcml2YXRpdmVzIHdoZW4gRkxBVF9TSEFERURcbiAgXG4gICAgdk5vcm1hbCA9IG5vcm1hbGl6ZSggdHJhbnNmb3JtZWROb3JtYWwgKTtcbiAgXG4gICNlbmRpZlxuICBcbiAgICAjaW5jbHVkZSA8YmVnaW5fdmVydGV4PlxuICAgIFxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UG9zaXRpb24nKX1cbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleENvbG9yJyl9XG4gICAgXG4gICAgI2luY2x1ZGUgPG1vcnBodGFyZ2V0X3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8c2tpbm5pbmdfdmVydGV4PlxuICAgICNpbmNsdWRlIDxkaXNwbGFjZW1lbnRtYXBfdmVydGV4PlxuICAgICNpbmNsdWRlIDxwcm9qZWN0X3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfdmVydGV4PlxuICAgICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfdmVydGV4PlxuICBcbiAgICB2Vmlld1Bvc2l0aW9uID0gLSBtdlBvc2l0aW9uLnh5ejtcbiAgXG4gICAgI2luY2x1ZGUgPHdvcmxkcG9zX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8ZW52bWFwX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8c2hhZG93bWFwX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8Zm9nX3ZlcnRleD5cbiAgfWA7XG59O1xuXG5QaG9uZ0FuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZS5jb25jYXRGcmFnbWVudFNoYWRlciA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIGBcbiAgI2RlZmluZSBQSE9OR1xuXG4gIHVuaWZvcm0gdmVjMyBkaWZmdXNlO1xuICB1bmlmb3JtIHZlYzMgZW1pc3NpdmU7XG4gIHVuaWZvcm0gdmVjMyBzcGVjdWxhcjtcbiAgdW5pZm9ybSBmbG9hdCBzaGluaW5lc3M7XG4gIHVuaWZvcm0gZmxvYXQgb3BhY2l0eTtcbiAgXG4gICNpbmNsdWRlIDxjb21tb24+XG4gICNpbmNsdWRlIDxwYWNraW5nPlxuICAjaW5jbHVkZSA8ZGl0aGVyaW5nX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxjb2xvcl9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8dXZfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPHV2Ml9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8bWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxhbHBoYW1hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8YW9tYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGxpZ2h0bWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxlbWlzc2l2ZW1hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8ZW52bWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxncmFkaWVudG1hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8Zm9nX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxic2Rmcz5cbiAgI2luY2x1ZGUgPGxpZ2h0c19wYXJzX2JlZ2luPlxuICAjaW5jbHVkZSA8bGlnaHRzX3BhcnNfbWFwcz5cbiAgI2luY2x1ZGUgPGxpZ2h0c19waG9uZ19wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8c2hhZG93bWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxidW1wbWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxub3JtYWxtYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPHNwZWN1bGFybWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX3BhcnNfZnJhZ21lbnQ+XG4gIFxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50UGFyYW1ldGVycycpfVxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZhcnlpbmdQYXJhbWV0ZXJzJyl9XG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRGdW5jdGlvbnMnKX1cbiAgXG4gIHZvaWQgbWFpbigpIHtcbiAgXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudEluaXQnKX1cbiAgXG4gICAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc19mcmFnbWVudD5cbiAgXG4gICAgdmVjNCBkaWZmdXNlQ29sb3IgPSB2ZWM0KCBkaWZmdXNlLCBvcGFjaXR5ICk7XG4gICAgUmVmbGVjdGVkTGlnaHQgcmVmbGVjdGVkTGlnaHQgPSBSZWZsZWN0ZWRMaWdodCggdmVjMyggMC4wICksIHZlYzMoIDAuMCApLCB2ZWMzKCAwLjAgKSwgdmVjMyggMC4wICkgKTtcbiAgICB2ZWMzIHRvdGFsRW1pc3NpdmVSYWRpYW5jZSA9IGVtaXNzaXZlO1xuICBcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50RGlmZnVzZScpfVxuICBcbiAgICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfZnJhZ21lbnQ+XG5cbiAgICAkeyh0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudE1hcCcpIHx8ICcjaW5jbHVkZSA8bWFwX2ZyYWdtZW50PicpfVxuXG4gICAgI2luY2x1ZGUgPGNvbG9yX2ZyYWdtZW50PlxuICAgICNpbmNsdWRlIDxhbHBoYW1hcF9mcmFnbWVudD5cbiAgICAjaW5jbHVkZSA8YWxwaGF0ZXN0X2ZyYWdtZW50PlxuICAgICNpbmNsdWRlIDxzcGVjdWxhcm1hcF9mcmFnbWVudD5cbiAgICAjaW5jbHVkZSA8bm9ybWFsX2ZyYWdtZW50X2JlZ2luPlxuICAgICNpbmNsdWRlIDxub3JtYWxfZnJhZ21lbnRfbWFwcz5cbiAgICBcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50RW1pc3NpdmUnKX1cbiAgICBcbiAgICAjaW5jbHVkZSA8ZW1pc3NpdmVtYXBfZnJhZ21lbnQ+XG4gIFxuICAgIC8vIGFjY3VtdWxhdGlvblxuICAgICNpbmNsdWRlIDxsaWdodHNfcGhvbmdfZnJhZ21lbnQ+XG4gICAgXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudFNwZWN1bGFyJyl9XG4gICAgXG4gICAgI2luY2x1ZGUgPGxpZ2h0c190ZW1wbGF0ZT5cbiAgXG4gICAgLy8gbW9kdWxhdGlvblxuICAgICNpbmNsdWRlIDxhb21hcF9mcmFnbWVudD5cbiAgXG4gICAgdmVjMyBvdXRnb2luZ0xpZ2h0ID0gcmVmbGVjdGVkTGlnaHQuZGlyZWN0RGlmZnVzZSArIHJlZmxlY3RlZExpZ2h0LmluZGlyZWN0RGlmZnVzZSArIHJlZmxlY3RlZExpZ2h0LmRpcmVjdFNwZWN1bGFyICsgcmVmbGVjdGVkTGlnaHQuaW5kaXJlY3RTcGVjdWxhciArIHRvdGFsRW1pc3NpdmVSYWRpYW5jZTtcbiAgXG4gICAgI2luY2x1ZGUgPGVudm1hcF9mcmFnbWVudD5cbiAgXG4gICAgZ2xfRnJhZ0NvbG9yID0gdmVjNCggb3V0Z29pbmdMaWdodCwgZGlmZnVzZUNvbG9yLmEgKTtcbiAgXG4gICAgI2luY2x1ZGUgPHRvbmVtYXBwaW5nX2ZyYWdtZW50PlxuICAgICNpbmNsdWRlIDxlbmNvZGluZ3NfZnJhZ21lbnQ+XG4gICAgI2luY2x1ZGUgPGZvZ19mcmFnbWVudD5cbiAgICAjaW5jbHVkZSA8cHJlbXVsdGlwbGllZF9hbHBoYV9mcmFnbWVudD5cbiAgICAjaW5jbHVkZSA8ZGl0aGVyaW5nX2ZyYWdtZW50PlxuICBcbiAgfWA7XG59O1xuXG5leHBvcnQgeyBQaG9uZ0FuaW1hdGlvbk1hdGVyaWFsIH07XG4iLCJpbXBvcnQgeyBTaGFkZXJMaWIgfSBmcm9tICd0aHJlZSc7XG5pbXBvcnQgQmFzZUFuaW1hdGlvbk1hdGVyaWFsIGZyb20gJy4vQmFzZUFuaW1hdGlvbk1hdGVyaWFsJztcblxuLyoqXG4gKiBFeHRlbmRzIFRIUkVFLk1lc2hTdGFuZGFyZE1hdGVyaWFsIHdpdGggY3VzdG9tIHNoYWRlciBjaHVua3MuXG4gKlxuICogQHNlZSBodHRwOi8vdGhyZWUtYmFzLWV4YW1wbGVzLnN1cmdlLnNoL2V4YW1wbGVzL21hdGVyaWFsc19zdGFuZGFyZC9cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gcGFyYW1ldGVycyBPYmplY3QgY29udGFpbmluZyBtYXRlcmlhbCBwcm9wZXJ0aWVzIGFuZCBjdXN0b20gc2hhZGVyIGNodW5rcy5cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBTdGFuZGFyZEFuaW1hdGlvbk1hdGVyaWFsKHBhcmFtZXRlcnMpIHtcbiAgdGhpcy52YXJ5aW5nUGFyYW1ldGVycyA9IFtdO1xuXG4gIHRoaXMudmVydGV4RnVuY3Rpb25zID0gW107XG4gIHRoaXMudmVydGV4UGFyYW1ldGVycyA9IFtdO1xuICB0aGlzLnZlcnRleEluaXQgPSBbXTtcbiAgdGhpcy52ZXJ0ZXhOb3JtYWwgPSBbXTtcbiAgdGhpcy52ZXJ0ZXhQb3NpdGlvbiA9IFtdO1xuICB0aGlzLnZlcnRleENvbG9yID0gW107XG5cbiAgdGhpcy5mcmFnbWVudEZ1bmN0aW9ucyA9IFtdO1xuICB0aGlzLmZyYWdtZW50UGFyYW1ldGVycyA9IFtdO1xuICB0aGlzLmZyYWdtZW50SW5pdCA9IFtdO1xuICB0aGlzLmZyYWdtZW50TWFwID0gW107XG4gIHRoaXMuZnJhZ21lbnREaWZmdXNlID0gW107XG4gIHRoaXMuZnJhZ21lbnRSb3VnaG5lc3MgPSBbXTtcbiAgdGhpcy5mcmFnbWVudE1ldGFsbmVzcyA9IFtdO1xuICB0aGlzLmZyYWdtZW50RW1pc3NpdmUgPSBbXTtcblxuICBCYXNlQW5pbWF0aW9uTWF0ZXJpYWwuY2FsbCh0aGlzLCBwYXJhbWV0ZXJzLCBTaGFkZXJMaWJbJ3N0YW5kYXJkJ10udW5pZm9ybXMpO1xuXG4gIHRoaXMubGlnaHRzID0gdHJ1ZTtcbiAgdGhpcy52ZXJ0ZXhTaGFkZXIgPSB0aGlzLmNvbmNhdFZlcnRleFNoYWRlcigpO1xuICB0aGlzLmZyYWdtZW50U2hhZGVyID0gdGhpcy5jb25jYXRGcmFnbWVudFNoYWRlcigpO1xufVxuU3RhbmRhcmRBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEJhc2VBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUpO1xuU3RhbmRhcmRBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBTdGFuZGFyZEFuaW1hdGlvbk1hdGVyaWFsO1xuXG5TdGFuZGFyZEFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZS5jb25jYXRWZXJ0ZXhTaGFkZXIgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiBgXG4gICNkZWZpbmUgUEhZU0lDQUxcblxuICB2YXJ5aW5nIHZlYzMgdlZpZXdQb3NpdGlvbjtcbiAgXG4gICNpZm5kZWYgRkxBVF9TSEFERURcbiAgXG4gICAgdmFyeWluZyB2ZWMzIHZOb3JtYWw7XG4gIFxuICAjZW5kaWZcbiAgXG4gICNpbmNsdWRlIDxjb21tb24+XG4gICNpbmNsdWRlIDx1dl9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPHV2Ml9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPGRpc3BsYWNlbWVudG1hcF9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPGNvbG9yX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8Zm9nX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8bW9ycGh0YXJnZXRfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxza2lubmluZ19wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPHNoYWRvd21hcF9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPGxvZ2RlcHRoYnVmX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX3BhcnNfdmVydGV4PlxuICBcbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQYXJhbWV0ZXJzJyl9XG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmFyeWluZ1BhcmFtZXRlcnMnKX1cbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhGdW5jdGlvbnMnKX1cbiAgXG4gIHZvaWQgbWFpbigpIHtcblxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4SW5pdCcpfVxuXG4gICAgI2luY2x1ZGUgPHV2X3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8dXYyX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8Y29sb3JfdmVydGV4PlxuICBcbiAgICAjaW5jbHVkZSA8YmVnaW5ub3JtYWxfdmVydGV4PlxuICAgIFxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4Tm9ybWFsJyl9XG4gICAgXG4gICAgI2luY2x1ZGUgPG1vcnBobm9ybWFsX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8c2tpbmJhc2VfdmVydGV4PlxuICAgICNpbmNsdWRlIDxza2lubm9ybWFsX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8ZGVmYXVsdG5vcm1hbF92ZXJ0ZXg+XG4gIFxuICAjaWZuZGVmIEZMQVRfU0hBREVEIC8vIE5vcm1hbCBjb21wdXRlZCB3aXRoIGRlcml2YXRpdmVzIHdoZW4gRkxBVF9TSEFERURcbiAgXG4gICAgdk5vcm1hbCA9IG5vcm1hbGl6ZSggdHJhbnNmb3JtZWROb3JtYWwgKTtcbiAgXG4gICNlbmRpZlxuICBcbiAgICAjaW5jbHVkZSA8YmVnaW5fdmVydGV4PlxuICAgIFxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UG9zaXRpb24nKX1cbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleENvbG9yJyl9XG4gICAgXG4gICAgI2luY2x1ZGUgPG1vcnBodGFyZ2V0X3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8c2tpbm5pbmdfdmVydGV4PlxuICAgICNpbmNsdWRlIDxkaXNwbGFjZW1lbnRtYXBfdmVydGV4PlxuICAgICNpbmNsdWRlIDxwcm9qZWN0X3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfdmVydGV4PlxuICAgICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfdmVydGV4PlxuICBcbiAgICB2Vmlld1Bvc2l0aW9uID0gLSBtdlBvc2l0aW9uLnh5ejtcbiAgXG4gICAgI2luY2x1ZGUgPHdvcmxkcG9zX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8c2hhZG93bWFwX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8Zm9nX3ZlcnRleD5cbiAgfWA7XG59O1xuXG5TdGFuZGFyZEFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZS5jb25jYXRGcmFnbWVudFNoYWRlciA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIGBcbiAgI2RlZmluZSBQSFlTSUNBTFxuICBcbiAgdW5pZm9ybSB2ZWMzIGRpZmZ1c2U7XG4gIHVuaWZvcm0gdmVjMyBlbWlzc2l2ZTtcbiAgdW5pZm9ybSBmbG9hdCByb3VnaG5lc3M7XG4gIHVuaWZvcm0gZmxvYXQgbWV0YWxuZXNzO1xuICB1bmlmb3JtIGZsb2F0IG9wYWNpdHk7XG4gIFxuICAjaWZuZGVmIFNUQU5EQVJEXG4gICAgdW5pZm9ybSBmbG9hdCBjbGVhckNvYXQ7XG4gICAgdW5pZm9ybSBmbG9hdCBjbGVhckNvYXRSb3VnaG5lc3M7XG4gICNlbmRpZlxuICBcbiAgdmFyeWluZyB2ZWMzIHZWaWV3UG9zaXRpb247XG4gIFxuICAjaWZuZGVmIEZMQVRfU0hBREVEXG4gIFxuICAgIHZhcnlpbmcgdmVjMyB2Tm9ybWFsO1xuICBcbiAgI2VuZGlmXG4gIFxuICAjaW5jbHVkZSA8Y29tbW9uPlxuICAjaW5jbHVkZSA8cGFja2luZz5cbiAgI2luY2x1ZGUgPGRpdGhlcmluZ19wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8Y29sb3JfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPHV2X3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDx1djJfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPG1hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8YWxwaGFtYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGFvbWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxsaWdodG1hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8ZW1pc3NpdmVtYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGVudm1hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8Zm9nX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxic2Rmcz5cbiAgI2luY2x1ZGUgPGN1YmVfdXZfcmVmbGVjdGlvbl9mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGxpZ2h0c19wYXJzX2JlZ2luPlxuICAjaW5jbHVkZSA8bGlnaHRzX3BhcnNfbWFwcz5cbiAgI2luY2x1ZGUgPGxpZ2h0c19waHlzaWNhbF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8c2hhZG93bWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxidW1wbWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxub3JtYWxtYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPHJvdWdobmVzc21hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8bWV0YWxuZXNzbWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX3BhcnNfZnJhZ21lbnQ+XG4gIFxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50UGFyYW1ldGVycycpfVxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZhcnlpbmdQYXJhbWV0ZXJzJyl9XG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRGdW5jdGlvbnMnKX1cbiAgXG4gIHZvaWQgbWFpbigpIHtcbiAgXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudEluaXQnKX1cbiAgXG4gICAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc19mcmFnbWVudD5cbiAgXG4gICAgdmVjNCBkaWZmdXNlQ29sb3IgPSB2ZWM0KCBkaWZmdXNlLCBvcGFjaXR5ICk7XG4gICAgUmVmbGVjdGVkTGlnaHQgcmVmbGVjdGVkTGlnaHQgPSBSZWZsZWN0ZWRMaWdodCggdmVjMyggMC4wICksIHZlYzMoIDAuMCApLCB2ZWMzKCAwLjAgKSwgdmVjMyggMC4wICkgKTtcbiAgICB2ZWMzIHRvdGFsRW1pc3NpdmVSYWRpYW5jZSA9IGVtaXNzaXZlO1xuICBcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50RGlmZnVzZScpfVxuICBcbiAgICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfZnJhZ21lbnQ+XG5cbiAgICAkeyh0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudE1hcCcpIHx8ICcjaW5jbHVkZSA8bWFwX2ZyYWdtZW50PicpfVxuXG4gICAgI2luY2x1ZGUgPGNvbG9yX2ZyYWdtZW50PlxuICAgICNpbmNsdWRlIDxhbHBoYW1hcF9mcmFnbWVudD5cbiAgICAjaW5jbHVkZSA8YWxwaGF0ZXN0X2ZyYWdtZW50PlxuICAgIFxuICAgIGZsb2F0IHJvdWdobmVzc0ZhY3RvciA9IHJvdWdobmVzcztcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50Um91Z2huZXNzJyl9XG4gICAgI2lmZGVmIFVTRV9ST1VHSE5FU1NNQVBcbiAgICBcbiAgICAgIHZlYzQgdGV4ZWxSb3VnaG5lc3MgPSB0ZXh0dXJlMkQoIHJvdWdobmVzc01hcCwgdlV2ICk7XG4gICAgXG4gICAgICAvLyByZWFkcyBjaGFubmVsIEcsIGNvbXBhdGlibGUgd2l0aCBhIGNvbWJpbmVkIE9jY2x1c2lvblJvdWdobmVzc01ldGFsbGljIChSR0IpIHRleHR1cmVcbiAgICAgIHJvdWdobmVzc0ZhY3RvciAqPSB0ZXhlbFJvdWdobmVzcy5nO1xuICAgIFxuICAgICNlbmRpZlxuICAgIFxuICAgIGZsb2F0IG1ldGFsbmVzc0ZhY3RvciA9IG1ldGFsbmVzcztcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50TWV0YWxuZXNzJyl9XG4gICAgI2lmZGVmIFVTRV9NRVRBTE5FU1NNQVBcbiAgICBcbiAgICAgIHZlYzQgdGV4ZWxNZXRhbG5lc3MgPSB0ZXh0dXJlMkQoIG1ldGFsbmVzc01hcCwgdlV2ICk7XG4gICAgICBtZXRhbG5lc3NGYWN0b3IgKj0gdGV4ZWxNZXRhbG5lc3MuYjtcbiAgICBcbiAgICAjZW5kaWZcbiAgICBcbiAgICAjaW5jbHVkZSA8bm9ybWFsX2ZyYWdtZW50X2JlZ2luPlxuICAgICNpbmNsdWRlIDxub3JtYWxfZnJhZ21lbnRfbWFwcz5cbiAgICBcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50RW1pc3NpdmUnKX1cbiAgICBcbiAgICAjaW5jbHVkZSA8ZW1pc3NpdmVtYXBfZnJhZ21lbnQ+XG4gIFxuICAgIC8vIGFjY3VtdWxhdGlvblxuICAgICNpbmNsdWRlIDxsaWdodHNfcGh5c2ljYWxfZnJhZ21lbnQ+XG4gICAgI2luY2x1ZGUgPGxpZ2h0c190ZW1wbGF0ZT5cbiAgXG4gICAgLy8gbW9kdWxhdGlvblxuICAgICNpbmNsdWRlIDxhb21hcF9mcmFnbWVudD5cbiAgXG4gICAgdmVjMyBvdXRnb2luZ0xpZ2h0ID0gcmVmbGVjdGVkTGlnaHQuZGlyZWN0RGlmZnVzZSArIHJlZmxlY3RlZExpZ2h0LmluZGlyZWN0RGlmZnVzZSArIHJlZmxlY3RlZExpZ2h0LmRpcmVjdFNwZWN1bGFyICsgcmVmbGVjdGVkTGlnaHQuaW5kaXJlY3RTcGVjdWxhciArIHRvdGFsRW1pc3NpdmVSYWRpYW5jZTtcbiAgXG4gICAgZ2xfRnJhZ0NvbG9yID0gdmVjNCggb3V0Z29pbmdMaWdodCwgZGlmZnVzZUNvbG9yLmEgKTtcbiAgXG4gICAgI2luY2x1ZGUgPHRvbmVtYXBwaW5nX2ZyYWdtZW50PlxuICAgICNpbmNsdWRlIDxlbmNvZGluZ3NfZnJhZ21lbnQ+XG4gICAgI2luY2x1ZGUgPGZvZ19mcmFnbWVudD5cbiAgICAjaW5jbHVkZSA8cHJlbXVsdGlwbGllZF9hbHBoYV9mcmFnbWVudD5cbiAgICAjaW5jbHVkZSA8ZGl0aGVyaW5nX2ZyYWdtZW50PlxuICBcbiAgfWA7XG59O1xuXG5leHBvcnQgeyBTdGFuZGFyZEFuaW1hdGlvbk1hdGVyaWFsIH07XG4iLCJpbXBvcnQgeyBTaGFkZXJMaWIgfSBmcm9tICd0aHJlZSc7XG5pbXBvcnQgQmFzZUFuaW1hdGlvbk1hdGVyaWFsIGZyb20gJy4vQmFzZUFuaW1hdGlvbk1hdGVyaWFsJztcblxuLyoqXG4gKiBFeHRlbmRzIFRIUkVFLlBvaW50c01hdGVyaWFsIHdpdGggY3VzdG9tIHNoYWRlciBjaHVua3MuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IHBhcmFtZXRlcnMgT2JqZWN0IGNvbnRhaW5pbmcgbWF0ZXJpYWwgcHJvcGVydGllcyBhbmQgY3VzdG9tIHNoYWRlciBjaHVua3MuXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gUG9pbnRzQW5pbWF0aW9uTWF0ZXJpYWwocGFyYW1ldGVycykge1xuICB0aGlzLnZhcnlpbmdQYXJhbWV0ZXJzID0gW107XG4gIFxuICB0aGlzLnZlcnRleEZ1bmN0aW9ucyA9IFtdO1xuICB0aGlzLnZlcnRleFBhcmFtZXRlcnMgPSBbXTtcbiAgdGhpcy52ZXJ0ZXhJbml0ID0gW107XG4gIHRoaXMudmVydGV4UG9zaXRpb24gPSBbXTtcbiAgdGhpcy52ZXJ0ZXhDb2xvciA9IFtdO1xuICBcbiAgdGhpcy5mcmFnbWVudEZ1bmN0aW9ucyA9IFtdO1xuICB0aGlzLmZyYWdtZW50UGFyYW1ldGVycyA9IFtdO1xuICB0aGlzLmZyYWdtZW50SW5pdCA9IFtdO1xuICB0aGlzLmZyYWdtZW50TWFwID0gW107XG4gIHRoaXMuZnJhZ21lbnREaWZmdXNlID0gW107XG4gIC8vIHVzZSBmcmFnbWVudCBzaGFkZXIgdG8gc2hhcGUgdG8gcG9pbnQsIHJlZmVyZW5jZTogaHR0cHM6Ly90aGVib29rb2ZzaGFkZXJzLmNvbS8wNy9cbiAgdGhpcy5mcmFnbWVudFNoYXBlID0gW107XG4gIFxuICBCYXNlQW5pbWF0aW9uTWF0ZXJpYWwuY2FsbCh0aGlzLCBwYXJhbWV0ZXJzLCBTaGFkZXJMaWJbJ3BvaW50cyddLnVuaWZvcm1zKTtcbiAgXG4gIHRoaXMudmVydGV4U2hhZGVyID0gdGhpcy5jb25jYXRWZXJ0ZXhTaGFkZXIoKTtcbiAgdGhpcy5mcmFnbWVudFNoYWRlciA9IHRoaXMuY29uY2F0RnJhZ21lbnRTaGFkZXIoKTtcbn1cblxuUG9pbnRzQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShCYXNlQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlKTtcblBvaW50c0FuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFBvaW50c0FuaW1hdGlvbk1hdGVyaWFsO1xuXG5Qb2ludHNBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uY2F0VmVydGV4U2hhZGVyID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gYFxuICB1bmlmb3JtIGZsb2F0IHNpemU7XG4gIHVuaWZvcm0gZmxvYXQgc2NhbGU7XG4gIFxuICAjaW5jbHVkZSA8Y29tbW9uPlxuICAjaW5jbHVkZSA8Y29sb3JfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxmb2dfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxzaGFkb3dtYXBfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc19wYXJzX3ZlcnRleD5cbiAgXG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UGFyYW1ldGVycycpfVxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZhcnlpbmdQYXJhbWV0ZXJzJyl9XG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4RnVuY3Rpb25zJyl9XG4gIFxuICB2b2lkIG1haW4oKSB7XG4gIFxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4SW5pdCcpfVxuICBcbiAgICAjaW5jbHVkZSA8Y29sb3JfdmVydGV4PlxuICAgICNpbmNsdWRlIDxiZWdpbl92ZXJ0ZXg+XG4gICAgXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQb3NpdGlvbicpfVxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4Q29sb3InKX1cbiAgICBcbiAgICAjaW5jbHVkZSA8cHJvamVjdF92ZXJ0ZXg+XG4gIFxuICAgICNpZmRlZiBVU0VfU0laRUFUVEVOVUFUSU9OXG4gICAgICBnbF9Qb2ludFNpemUgPSBzaXplICogKCBzY2FsZSAvIC0gbXZQb3NpdGlvbi56ICk7XG4gICAgI2Vsc2VcbiAgICAgIGdsX1BvaW50U2l6ZSA9IHNpemU7XG4gICAgI2VuZGlmXG4gIFxuICAgICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc192ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPHdvcmxkcG9zX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8c2hhZG93bWFwX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8Zm9nX3ZlcnRleD5cbiAgfWA7XG59O1xuXG5Qb2ludHNBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uY2F0RnJhZ21lbnRTaGFkZXIgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiBgXG4gIHVuaWZvcm0gdmVjMyBkaWZmdXNlO1xuICB1bmlmb3JtIGZsb2F0IG9wYWNpdHk7XG4gIFxuICAjaW5jbHVkZSA8Y29tbW9uPlxuICAjaW5jbHVkZSA8cGFja2luZz5cbiAgI2luY2x1ZGUgPGNvbG9yX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxtYXBfcGFydGljbGVfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGZvZ19wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8c2hhZG93bWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX3BhcnNfZnJhZ21lbnQ+XG4gIFxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50UGFyYW1ldGVycycpfVxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZhcnlpbmdQYXJhbWV0ZXJzJyl9XG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRGdW5jdGlvbnMnKX1cbiAgXG4gIHZvaWQgbWFpbigpIHtcbiAgXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudEluaXQnKX1cbiAgXG4gICAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc19mcmFnbWVudD5cbiAgXG4gICAgdmVjMyBvdXRnb2luZ0xpZ2h0ID0gdmVjMyggMC4wICk7XG4gICAgdmVjNCBkaWZmdXNlQ29sb3IgPSB2ZWM0KCBkaWZmdXNlLCBvcGFjaXR5ICk7XG4gIFxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnREaWZmdXNlJyl9XG4gIFxuICAgICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl9mcmFnbWVudD5cblxuICAgICR7KHRoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50TWFwJykgfHwgJyNpbmNsdWRlIDxtYXBfcGFydGljbGVfZnJhZ21lbnQ+Jyl9XG5cbiAgICAjaW5jbHVkZSA8Y29sb3JfZnJhZ21lbnQ+XG4gICAgI2luY2x1ZGUgPGFscGhhdGVzdF9mcmFnbWVudD5cbiAgXG4gICAgb3V0Z29pbmdMaWdodCA9IGRpZmZ1c2VDb2xvci5yZ2I7XG4gIFxuICAgIGdsX0ZyYWdDb2xvciA9IHZlYzQoIG91dGdvaW5nTGlnaHQsIGRpZmZ1c2VDb2xvci5hICk7XG4gICAgXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudFNoYXBlJyl9XG4gIFxuICAgICNpbmNsdWRlIDxwcmVtdWx0aXBsaWVkX2FscGhhX2ZyYWdtZW50PlxuICAgICNpbmNsdWRlIDx0b25lbWFwcGluZ19mcmFnbWVudD5cbiAgICAjaW5jbHVkZSA8ZW5jb2RpbmdzX2ZyYWdtZW50PlxuICAgICNpbmNsdWRlIDxmb2dfZnJhZ21lbnQ+XG4gIH1gO1xufTtcblxuZXhwb3J0IHsgUG9pbnRzQW5pbWF0aW9uTWF0ZXJpYWwgfTtcbiIsImltcG9ydCB7IFNoYWRlckxpYiwgVW5pZm9ybXNVdGlscywgUkdCQURlcHRoUGFja2luZyB9IGZyb20gJ3RocmVlJztcbmltcG9ydCBCYXNlQW5pbWF0aW9uTWF0ZXJpYWwgZnJvbSAnLi9CYXNlQW5pbWF0aW9uTWF0ZXJpYWwnO1xuXG5mdW5jdGlvbiBEZXB0aEFuaW1hdGlvbk1hdGVyaWFsKHBhcmFtZXRlcnMpIHtcbiAgdGhpcy5kZXB0aFBhY2tpbmcgPSBSR0JBRGVwdGhQYWNraW5nO1xuICB0aGlzLmNsaXBwaW5nID0gdHJ1ZTtcblxuICB0aGlzLnZlcnRleEZ1bmN0aW9ucyA9IFtdO1xuICB0aGlzLnZlcnRleFBhcmFtZXRlcnMgPSBbXTtcbiAgdGhpcy52ZXJ0ZXhJbml0ID0gW107XG4gIHRoaXMudmVydGV4UG9zaXRpb24gPSBbXTtcblxuICBCYXNlQW5pbWF0aW9uTWF0ZXJpYWwuY2FsbCh0aGlzLCBwYXJhbWV0ZXJzKTtcbiAgXG4gIHRoaXMudW5pZm9ybXMgPSBVbmlmb3Jtc1V0aWxzLm1lcmdlKFtTaGFkZXJMaWJbJ2RlcHRoJ10udW5pZm9ybXMsIHRoaXMudW5pZm9ybXNdKTtcbiAgdGhpcy52ZXJ0ZXhTaGFkZXIgPSB0aGlzLmNvbmNhdFZlcnRleFNoYWRlcigpO1xuICB0aGlzLmZyYWdtZW50U2hhZGVyID0gU2hhZGVyTGliWydkZXB0aCddLmZyYWdtZW50U2hhZGVyO1xufVxuRGVwdGhBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEJhc2VBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUpO1xuRGVwdGhBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBEZXB0aEFuaW1hdGlvbk1hdGVyaWFsO1xuXG5EZXB0aEFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZS5jb25jYXRWZXJ0ZXhTaGFkZXIgPSBmdW5jdGlvbiAoKSB7XG4gIFxuICByZXR1cm4gYFxuICAjaW5jbHVkZSA8Y29tbW9uPlxuICAjaW5jbHVkZSA8dXZfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxkaXNwbGFjZW1lbnRtYXBfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxtb3JwaHRhcmdldF9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPHNraW5uaW5nX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfcGFyc192ZXJ0ZXg+XG4gIFxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBhcmFtZXRlcnMnKX1cbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhGdW5jdGlvbnMnKX1cbiAgXG4gIHZvaWQgbWFpbigpIHtcbiAgXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhJbml0Jyl9XG4gIFxuICAgICNpbmNsdWRlIDx1dl92ZXJ0ZXg+XG4gIFxuICAgICNpbmNsdWRlIDxza2luYmFzZV92ZXJ0ZXg+XG4gIFxuICAgICNpZmRlZiBVU0VfRElTUExBQ0VNRU5UTUFQXG4gIFxuICAgICAgI2luY2x1ZGUgPGJlZ2lubm9ybWFsX3ZlcnRleD5cbiAgICAgICNpbmNsdWRlIDxtb3JwaG5vcm1hbF92ZXJ0ZXg+XG4gICAgICAjaW5jbHVkZSA8c2tpbm5vcm1hbF92ZXJ0ZXg+XG4gIFxuICAgICNlbmRpZlxuICBcbiAgICAjaW5jbHVkZSA8YmVnaW5fdmVydGV4PlxuICAgIFxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UG9zaXRpb24nKX1cblxuICAgICNpbmNsdWRlIDxtb3JwaHRhcmdldF92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPHNraW5uaW5nX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8ZGlzcGxhY2VtZW50bWFwX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8cHJvamVjdF92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPGxvZ2RlcHRoYnVmX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX3ZlcnRleD5cbiAgfWA7XG59O1xuXG5leHBvcnQgeyBEZXB0aEFuaW1hdGlvbk1hdGVyaWFsIH07XG4iLCJpbXBvcnQgeyBTaGFkZXJMaWIsIFVuaWZvcm1zVXRpbHMsIFJHQkFEZXB0aFBhY2tpbmcgfSBmcm9tICd0aHJlZSc7XG5pbXBvcnQgQmFzZUFuaW1hdGlvbk1hdGVyaWFsIGZyb20gJy4vQmFzZUFuaW1hdGlvbk1hdGVyaWFsJztcblxuZnVuY3Rpb24gRGlzdGFuY2VBbmltYXRpb25NYXRlcmlhbChwYXJhbWV0ZXJzKSB7XG4gIHRoaXMuZGVwdGhQYWNraW5nID0gUkdCQURlcHRoUGFja2luZztcbiAgdGhpcy5jbGlwcGluZyA9IHRydWU7XG5cbiAgdGhpcy52ZXJ0ZXhGdW5jdGlvbnMgPSBbXTtcbiAgdGhpcy52ZXJ0ZXhQYXJhbWV0ZXJzID0gW107XG4gIHRoaXMudmVydGV4SW5pdCA9IFtdO1xuICB0aGlzLnZlcnRleFBvc2l0aW9uID0gW107XG5cbiAgQmFzZUFuaW1hdGlvbk1hdGVyaWFsLmNhbGwodGhpcywgcGFyYW1ldGVycyk7XG4gIFxuICB0aGlzLnVuaWZvcm1zID0gVW5pZm9ybXNVdGlscy5tZXJnZShbU2hhZGVyTGliWydkaXN0YW5jZVJHQkEnXS51bmlmb3JtcywgdGhpcy51bmlmb3Jtc10pO1xuICB0aGlzLnZlcnRleFNoYWRlciA9IHRoaXMuY29uY2F0VmVydGV4U2hhZGVyKCk7XG4gIHRoaXMuZnJhZ21lbnRTaGFkZXIgPSBTaGFkZXJMaWJbJ2Rpc3RhbmNlUkdCQSddLmZyYWdtZW50U2hhZGVyO1xufVxuRGlzdGFuY2VBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEJhc2VBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUpO1xuRGlzdGFuY2VBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBEaXN0YW5jZUFuaW1hdGlvbk1hdGVyaWFsO1xuXG5EaXN0YW5jZUFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZS5jb25jYXRWZXJ0ZXhTaGFkZXIgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiBgXG4gICNkZWZpbmUgRElTVEFOQ0VcblxuICB2YXJ5aW5nIHZlYzMgdldvcmxkUG9zaXRpb247XG4gIFxuICAjaW5jbHVkZSA8Y29tbW9uPlxuICAjaW5jbHVkZSA8dXZfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxkaXNwbGFjZW1lbnRtYXBfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxtb3JwaHRhcmdldF9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPHNraW5uaW5nX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX3BhcnNfdmVydGV4PlxuICBcbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQYXJhbWV0ZXJzJyl9XG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4RnVuY3Rpb25zJyl9XG4gIFxuICB2b2lkIG1haW4oKSB7XG5cbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleEluaXQnKX1cbiAgXG4gICAgI2luY2x1ZGUgPHV2X3ZlcnRleD5cbiAgXG4gICAgI2luY2x1ZGUgPHNraW5iYXNlX3ZlcnRleD5cbiAgXG4gICAgI2lmZGVmIFVTRV9ESVNQTEFDRU1FTlRNQVBcbiAgXG4gICAgICAjaW5jbHVkZSA8YmVnaW5ub3JtYWxfdmVydGV4PlxuICAgICAgI2luY2x1ZGUgPG1vcnBobm9ybWFsX3ZlcnRleD5cbiAgICAgICNpbmNsdWRlIDxza2lubm9ybWFsX3ZlcnRleD5cbiAgXG4gICAgI2VuZGlmXG4gIFxuICAgICNpbmNsdWRlIDxiZWdpbl92ZXJ0ZXg+XG4gICAgXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQb3NpdGlvbicpfVxuXG4gICAgI2luY2x1ZGUgPG1vcnBodGFyZ2V0X3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8c2tpbm5pbmdfdmVydGV4PlxuICAgICNpbmNsdWRlIDxkaXNwbGFjZW1lbnRtYXBfdmVydGV4PlxuICAgICNpbmNsdWRlIDxwcm9qZWN0X3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8d29ybGRwb3NfdmVydGV4PlxuICAgICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfdmVydGV4PlxuICBcbiAgICB2V29ybGRQb3NpdGlvbiA9IHdvcmxkUG9zaXRpb24ueHl6O1xuICBcbiAgfWA7XG59O1xuXG5leHBvcnQgeyBEaXN0YW5jZUFuaW1hdGlvbk1hdGVyaWFsIH07XG4iLCJpbXBvcnQgeyBCdWZmZXJHZW9tZXRyeSwgQnVmZmVyQXR0cmlidXRlLCBWZWN0b3IyIH0gZnJvbSAndGhyZWUnO1xuLyoqXG4gKiBBIEJ1ZmZlckdlb21ldHJ5IHdoZXJlIGEgJ3ByZWZhYicgZ2VvbWV0cnkgaXMgcmVwZWF0ZWQgYSBudW1iZXIgb2YgdGltZXMuXG4gKlxuICogQHBhcmFtIHtHZW9tZXRyeXxCdWZmZXJHZW9tZXRyeX0gcHJlZmFiIFRoZSBHZW9tZXRyeSBpbnN0YW5jZSB0byByZXBlYXQuXG4gKiBAcGFyYW0ge051bWJlcn0gY291bnQgVGhlIG51bWJlciBvZiB0aW1lcyB0byByZXBlYXQgdGhlIGdlb21ldHJ5LlxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIFByZWZhYkJ1ZmZlckdlb21ldHJ5KHByZWZhYiwgY291bnQpIHtcbiAgQnVmZmVyR2VvbWV0cnkuY2FsbCh0aGlzKTtcbiAgXG4gIC8qKlxuICAgKiBBIHJlZmVyZW5jZSB0byB0aGUgcHJlZmFiIGdlb21ldHJ5IHVzZWQgdG8gY3JlYXRlIHRoaXMgaW5zdGFuY2UuXG4gICAqIEB0eXBlIHtHZW9tZXRyeXxCdWZmZXJHZW9tZXRyeX1cbiAgICovXG4gIHRoaXMucHJlZmFiR2VvbWV0cnkgPSBwcmVmYWI7XG4gIHRoaXMuaXNQcmVmYWJCdWZmZXJHZW9tZXRyeSA9IHByZWZhYi5pc0J1ZmZlckdlb21ldHJ5O1xuICBcbiAgLyoqXG4gICAqIE51bWJlciBvZiBwcmVmYWJzLlxuICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgKi9cbiAgdGhpcy5wcmVmYWJDb3VudCA9IGNvdW50O1xuICBcbiAgLyoqXG4gICAqIE51bWJlciBvZiB2ZXJ0aWNlcyBvZiB0aGUgcHJlZmFiLlxuICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgKi9cbiAgaWYgKHRoaXMuaXNQcmVmYWJCdWZmZXJHZW9tZXRyeSkge1xuICAgIHRoaXMucHJlZmFiVmVydGV4Q291bnQgPSBwcmVmYWIuYXR0cmlidXRlcy5wb3NpdGlvbi5jb3VudDtcbiAgfVxuICBlbHNlIHtcbiAgICB0aGlzLnByZWZhYlZlcnRleENvdW50ID0gcHJlZmFiLnZlcnRpY2VzLmxlbmd0aDtcbiAgfVxuXG4gIHRoaXMuYnVmZmVySW5kaWNlcygpO1xuICB0aGlzLmJ1ZmZlclBvc2l0aW9ucygpO1xufVxuUHJlZmFiQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUpO1xuUHJlZmFiQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gUHJlZmFiQnVmZmVyR2VvbWV0cnk7XG5cblByZWZhYkJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5idWZmZXJJbmRpY2VzID0gZnVuY3Rpb24oKSB7XG4gIGxldCBwcmVmYWJJbmRpY2VzID0gW107XG4gIGxldCBwcmVmYWJJbmRleENvdW50O1xuXG4gIGlmICh0aGlzLmlzUHJlZmFiQnVmZmVyR2VvbWV0cnkpIHtcbiAgICBpZiAodGhpcy5wcmVmYWJHZW9tZXRyeS5pbmRleCkge1xuICAgICAgcHJlZmFiSW5kZXhDb3VudCA9IHRoaXMucHJlZmFiR2VvbWV0cnkuaW5kZXguY291bnQ7XG4gICAgICBwcmVmYWJJbmRpY2VzID0gdGhpcy5wcmVmYWJHZW9tZXRyeS5pbmRleC5hcnJheTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBwcmVmYWJJbmRleENvdW50ID0gdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudDtcblxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcmVmYWJJbmRleENvdW50OyBpKyspIHtcbiAgICAgICAgcHJlZmFiSW5kaWNlcy5wdXNoKGkpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBlbHNlIHtcbiAgICBjb25zdCBwcmVmYWJGYWNlQ291bnQgPSB0aGlzLnByZWZhYkdlb21ldHJ5LmZhY2VzLmxlbmd0aDtcbiAgICBwcmVmYWJJbmRleENvdW50ID0gcHJlZmFiRmFjZUNvdW50ICogMztcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHJlZmFiRmFjZUNvdW50OyBpKyspIHtcbiAgICAgIGNvbnN0IGZhY2UgPSB0aGlzLnByZWZhYkdlb21ldHJ5LmZhY2VzW2ldO1xuICAgICAgcHJlZmFiSW5kaWNlcy5wdXNoKGZhY2UuYSwgZmFjZS5iLCBmYWNlLmMpO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IGluZGV4QnVmZmVyID0gbmV3IFVpbnQzMkFycmF5KHRoaXMucHJlZmFiQ291bnQgKiBwcmVmYWJJbmRleENvdW50KTtcblxuICB0aGlzLnNldEluZGV4KG5ldyBCdWZmZXJBdHRyaWJ1dGUoaW5kZXhCdWZmZXIsIDEpKTtcbiAgXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5wcmVmYWJDb3VudDsgaSsrKSB7XG4gICAgZm9yIChsZXQgayA9IDA7IGsgPCBwcmVmYWJJbmRleENvdW50OyBrKyspIHtcbiAgICAgIGluZGV4QnVmZmVyW2kgKiBwcmVmYWJJbmRleENvdW50ICsga10gPSBwcmVmYWJJbmRpY2VzW2tdICsgaSAqIHRoaXMucHJlZmFiVmVydGV4Q291bnQ7XG4gICAgfVxuICB9XG59O1xuXG5QcmVmYWJCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuYnVmZmVyUG9zaXRpb25zID0gZnVuY3Rpb24oKSB7XG4gIGNvbnN0IHBvc2l0aW9uQnVmZmVyID0gdGhpcy5jcmVhdGVBdHRyaWJ1dGUoJ3Bvc2l0aW9uJywgMykuYXJyYXk7XG5cbiAgaWYgKHRoaXMuaXNQcmVmYWJCdWZmZXJHZW9tZXRyeSkge1xuICAgIGNvbnN0IHBvc2l0aW9ucyA9IHRoaXMucHJlZmFiR2VvbWV0cnkuYXR0cmlidXRlcy5wb3NpdGlvbi5hcnJheTtcblxuICAgIGZvciAobGV0IGkgPSAwLCBvZmZzZXQgPSAwOyBpIDwgdGhpcy5wcmVmYWJDb3VudDsgaSsrKSB7XG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHRoaXMucHJlZmFiVmVydGV4Q291bnQ7IGorKywgb2Zmc2V0ICs9IDMpIHtcbiAgICAgICAgcG9zaXRpb25CdWZmZXJbb2Zmc2V0ICAgIF0gPSBwb3NpdGlvbnNbaiAqIDNdO1xuICAgICAgICBwb3NpdGlvbkJ1ZmZlcltvZmZzZXQgKyAxXSA9IHBvc2l0aW9uc1tqICogMyArIDFdO1xuICAgICAgICBwb3NpdGlvbkJ1ZmZlcltvZmZzZXQgKyAyXSA9IHBvc2l0aW9uc1tqICogMyArIDJdO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBlbHNlIHtcbiAgICBmb3IgKGxldCBpID0gMCwgb2Zmc2V0ID0gMDsgaSA8IHRoaXMucHJlZmFiQ291bnQ7IGkrKykge1xuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCB0aGlzLnByZWZhYlZlcnRleENvdW50OyBqKyssIG9mZnNldCArPSAzKSB7XG4gICAgICAgIGNvbnN0IHByZWZhYlZlcnRleCA9IHRoaXMucHJlZmFiR2VvbWV0cnkudmVydGljZXNbal07XG5cbiAgICAgICAgcG9zaXRpb25CdWZmZXJbb2Zmc2V0ICAgIF0gPSBwcmVmYWJWZXJ0ZXgueDtcbiAgICAgICAgcG9zaXRpb25CdWZmZXJbb2Zmc2V0ICsgMV0gPSBwcmVmYWJWZXJ0ZXgueTtcbiAgICAgICAgcG9zaXRpb25CdWZmZXJbb2Zmc2V0ICsgMl0gPSBwcmVmYWJWZXJ0ZXguejtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn07XG5cbi8qKlxuICogQ3JlYXRlcyBhIEJ1ZmZlckF0dHJpYnV0ZSB3aXRoIFVWIGNvb3JkaW5hdGVzLlxuICovXG5QcmVmYWJCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuYnVmZmVyVXZzID0gZnVuY3Rpb24oKSB7XG4gIGNvbnN0IHByZWZhYlV2cyA9IFtdO1xuXG4gIGlmICh0aGlzLmlzUHJlZmFiQnVmZmVyR2VvbWV0cnkpIHtcbiAgICBjb25zdCB1diA9IHRoaXMucHJlZmFiR2VvbWV0cnkuYXR0cmlidXRlcy51di5hcnJheTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudDsgaSsrKSB7XG4gICAgICBwcmVmYWJVdnMucHVzaChuZXcgVmVjdG9yMih1dltpICogMl0sIHV2W2kgKiAyICsgMV0pKTtcbiAgICB9XG4gIH1cbiAgZWxzZSB7XG4gICAgY29uc3QgcHJlZmFiRmFjZUNvdW50ID0gdGhpcy5wcmVmYWJHZW9tZXRyeS5mYWNlcy5sZW5ndGg7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHByZWZhYkZhY2VDb3VudDsgaSsrKSB7XG4gICAgICBjb25zdCBmYWNlID0gdGhpcy5wcmVmYWJHZW9tZXRyeS5mYWNlc1tpXTtcbiAgICAgIGNvbnN0IHV2ID0gdGhpcy5wcmVmYWJHZW9tZXRyeS5mYWNlVmVydGV4VXZzWzBdW2ldO1xuXG4gICAgICBwcmVmYWJVdnNbZmFjZS5hXSA9IHV2WzBdO1xuICAgICAgcHJlZmFiVXZzW2ZhY2UuYl0gPSB1dlsxXTtcbiAgICAgIHByZWZhYlV2c1tmYWNlLmNdID0gdXZbMl07XG4gICAgfVxuICB9XG5cbiAgY29uc3QgdXZCdWZmZXIgPSB0aGlzLmNyZWF0ZUF0dHJpYnV0ZSgndXYnLCAyKTtcbiAgXG4gIGZvciAobGV0IGkgPSAwLCBvZmZzZXQgPSAwOyBpIDwgdGhpcy5wcmVmYWJDb3VudDsgaSsrKSB7XG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCB0aGlzLnByZWZhYlZlcnRleENvdW50OyBqKyssIG9mZnNldCArPSAyKSB7XG4gICAgICBsZXQgcHJlZmFiVXYgPSBwcmVmYWJVdnNbal07XG4gICAgICBcbiAgICAgIHV2QnVmZmVyLmFycmF5W29mZnNldF0gPSBwcmVmYWJVdi54O1xuICAgICAgdXZCdWZmZXIuYXJyYXlbb2Zmc2V0ICsgMV0gPSBwcmVmYWJVdi55O1xuICAgIH1cbiAgfVxufTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgQnVmZmVyQXR0cmlidXRlIG9uIHRoaXMgZ2VvbWV0cnkgaW5zdGFuY2UuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgTmFtZSBvZiB0aGUgYXR0cmlidXRlLlxuICogQHBhcmFtIHtOdW1iZXJ9IGl0ZW1TaXplIE51bWJlciBvZiBmbG9hdHMgcGVyIHZlcnRleCAodHlwaWNhbGx5IDEsIDIsIDMgb3IgNCkuXG4gKiBAcGFyYW0ge2Z1bmN0aW9uPX0gZmFjdG9yeSBGdW5jdGlvbiB0aGF0IHdpbGwgYmUgY2FsbGVkIGZvciBlYWNoIHByZWZhYiB1cG9uIGNyZWF0aW9uLiBBY2NlcHRzIDMgYXJndW1lbnRzOiBkYXRhW10sIGluZGV4IGFuZCBwcmVmYWJDb3VudC4gQ2FsbHMgc2V0UHJlZmFiRGF0YS5cbiAqXG4gKiBAcmV0dXJucyB7QnVmZmVyQXR0cmlidXRlfVxuICovXG5QcmVmYWJCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuY3JlYXRlQXR0cmlidXRlID0gZnVuY3Rpb24obmFtZSwgaXRlbVNpemUsIGZhY3RvcnkpIHtcbiAgY29uc3QgYnVmZmVyID0gbmV3IEZsb2F0MzJBcnJheSh0aGlzLnByZWZhYkNvdW50ICogdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudCAqIGl0ZW1TaXplKTtcbiAgY29uc3QgYXR0cmlidXRlID0gbmV3IEJ1ZmZlckF0dHJpYnV0ZShidWZmZXIsIGl0ZW1TaXplKTtcbiAgXG4gIHRoaXMuYWRkQXR0cmlidXRlKG5hbWUsIGF0dHJpYnV0ZSk7XG4gIFxuICBpZiAoZmFjdG9yeSkge1xuICAgIGNvbnN0IGRhdGEgPSBbXTtcbiAgICBcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucHJlZmFiQ291bnQ7IGkrKykge1xuICAgICAgZmFjdG9yeShkYXRhLCBpLCB0aGlzLnByZWZhYkNvdW50KTtcbiAgICAgIHRoaXMuc2V0UHJlZmFiRGF0YShhdHRyaWJ1dGUsIGksIGRhdGEpO1xuICAgIH1cbiAgfVxuICBcbiAgcmV0dXJuIGF0dHJpYnV0ZTtcbn07XG5cbi8qKlxuICogU2V0cyBkYXRhIGZvciBhbGwgdmVydGljZXMgb2YgYSBwcmVmYWIgYXQgYSBnaXZlbiBpbmRleC5cbiAqIFVzdWFsbHkgY2FsbGVkIGluIGEgbG9vcC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ3xCdWZmZXJBdHRyaWJ1dGV9IGF0dHJpYnV0ZSBUaGUgYXR0cmlidXRlIG9yIGF0dHJpYnV0ZSBuYW1lIHdoZXJlIHRoZSBkYXRhIGlzIHRvIGJlIHN0b3JlZC5cbiAqIEBwYXJhbSB7TnVtYmVyfSBwcmVmYWJJbmRleCBJbmRleCBvZiB0aGUgcHJlZmFiIGluIHRoZSBidWZmZXIgZ2VvbWV0cnkuXG4gKiBAcGFyYW0ge0FycmF5fSBkYXRhIEFycmF5IG9mIGRhdGEuIExlbmd0aCBzaG91bGQgYmUgZXF1YWwgdG8gaXRlbSBzaXplIG9mIHRoZSBhdHRyaWJ1dGUuXG4gKi9cblByZWZhYkJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5zZXRQcmVmYWJEYXRhID0gZnVuY3Rpb24oYXR0cmlidXRlLCBwcmVmYWJJbmRleCwgZGF0YSkge1xuICBhdHRyaWJ1dGUgPSAodHlwZW9mIGF0dHJpYnV0ZSA9PT0gJ3N0cmluZycpID8gdGhpcy5hdHRyaWJ1dGVzW2F0dHJpYnV0ZV0gOiBhdHRyaWJ1dGU7XG4gIFxuICBsZXQgb2Zmc2V0ID0gcHJlZmFiSW5kZXggKiB0aGlzLnByZWZhYlZlcnRleENvdW50ICogYXR0cmlidXRlLml0ZW1TaXplO1xuICBcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnByZWZhYlZlcnRleENvdW50OyBpKyspIHtcbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IGF0dHJpYnV0ZS5pdGVtU2l6ZTsgaisrKSB7XG4gICAgICBhdHRyaWJ1dGUuYXJyYXlbb2Zmc2V0KytdID0gZGF0YVtqXTtcbiAgICB9XG4gIH1cbn07XG5cbmV4cG9ydCB7IFByZWZhYkJ1ZmZlckdlb21ldHJ5IH07XG4iLCJpbXBvcnQgeyBCdWZmZXJHZW9tZXRyeSwgQnVmZmVyQXR0cmlidXRlIH0gZnJvbSAndGhyZWUnO1xuLyoqXG4gKiBBIEJ1ZmZlckdlb21ldHJ5IHdoZXJlIGEgJ3ByZWZhYicgZ2VvbWV0cnkgYXJyYXkgaXMgcmVwZWF0ZWQgYSBudW1iZXIgb2YgdGltZXMuXG4gKlxuICogQHBhcmFtIHtBcnJheX0gcHJlZmFicyBBbiBhcnJheSB3aXRoIEdlb21ldHJ5IGluc3RhbmNlcyB0byByZXBlYXQuXG4gKiBAcGFyYW0ge051bWJlcn0gcmVwZWF0Q291bnQgVGhlIG51bWJlciBvZiB0aW1lcyB0byByZXBlYXQgdGhlIGFycmF5IG9mIEdlb21ldHJpZXMuXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gTXVsdGlQcmVmYWJCdWZmZXJHZW9tZXRyeShwcmVmYWJzLCByZXBlYXRDb3VudCkge1xuICBCdWZmZXJHZW9tZXRyeS5jYWxsKHRoaXMpO1xuXG4gIGlmIChBcnJheS5pc0FycmF5KHByZWZhYnMpKSB7XG4gICAgdGhpcy5wcmVmYWJHZW9tZXRyaWVzID0gcHJlZmFicztcbiAgfSBlbHNlIHtcbiAgICB0aGlzLnByZWZhYkdlb21ldHJpZXMgPSBbcHJlZmFic107XG4gIH1cblxuICB0aGlzLnByZWZhYkdlb21ldHJpZXNDb3VudCA9IHRoaXMucHJlZmFiR2VvbWV0cmllcy5sZW5ndGg7XG5cbiAgLyoqXG4gICAqIE51bWJlciBvZiBwcmVmYWJzLlxuICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgKi9cbiAgdGhpcy5wcmVmYWJDb3VudCA9IHJlcGVhdENvdW50ICogdGhpcy5wcmVmYWJHZW9tZXRyaWVzQ291bnQ7XG4gIC8qKlxuICAgKiBIb3cgb2Z0ZW4gdGhlIHByZWZhYiBhcnJheSBpcyByZXBlYXRlZC5cbiAgICogQHR5cGUge051bWJlcn1cbiAgICovXG4gIHRoaXMucmVwZWF0Q291bnQgPSByZXBlYXRDb3VudDtcbiAgXG4gIC8qKlxuICAgKiBBcnJheSBvZiB2ZXJ0ZXggY291bnRzIHBlciBwcmVmYWIuXG4gICAqIEB0eXBlIHtBcnJheX1cbiAgICovXG4gIHRoaXMucHJlZmFiVmVydGV4Q291bnRzID0gdGhpcy5wcmVmYWJHZW9tZXRyaWVzLm1hcChwID0+IHAuaXNCdWZmZXJHZW9tZXRyeSA/IHAuYXR0cmlidXRlcy5wb3NpdGlvbi5jb3VudCA6IHAudmVydGljZXMubGVuZ3RoKTtcbiAgLyoqXG4gICAqIFRvdGFsIG51bWJlciBvZiB2ZXJ0aWNlcyBmb3Igb25lIHJlcGV0aXRpb24gb2YgdGhlIHByZWZhYnNcbiAgICogQHR5cGUge251bWJlcn1cbiAgICovXG4gIHRoaXMucmVwZWF0VmVydGV4Q291bnQgPSB0aGlzLnByZWZhYlZlcnRleENvdW50cy5yZWR1Y2UoKHIsIHYpID0+IHIgKyB2LCAwKTtcblxuICB0aGlzLmJ1ZmZlckluZGljZXMoKTtcbiAgdGhpcy5idWZmZXJQb3NpdGlvbnMoKTtcbn1cbk11bHRpUHJlZmFiQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUpO1xuTXVsdGlQcmVmYWJCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBNdWx0aVByZWZhYkJ1ZmZlckdlb21ldHJ5O1xuXG5NdWx0aVByZWZhYkJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5idWZmZXJJbmRpY2VzID0gZnVuY3Rpb24oKSB7XG4gIGxldCByZXBlYXRJbmRleENvdW50ID0gMDtcblxuICB0aGlzLnByZWZhYkluZGljZXMgPSB0aGlzLnByZWZhYkdlb21ldHJpZXMubWFwKGdlb21ldHJ5ID0+IHtcbiAgICBsZXQgaW5kaWNlcyA9IFtdO1xuXG4gICAgaWYgKGdlb21ldHJ5LmlzQnVmZmVyR2VvbWV0cnkpIHtcbiAgICAgIGlmIChnZW9tZXRyeS5pbmRleCkge1xuICAgICAgICBpbmRpY2VzID0gZ2VvbWV0cnkuaW5kZXguYXJyYXk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGdlb21ldHJ5LmF0dHJpYnV0ZXMucG9zaXRpb24uY291bnQ7IGkrKykge1xuICAgICAgICAgIGluZGljZXMucHVzaChpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGdlb21ldHJ5LmZhY2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGZhY2UgPSBnZW9tZXRyeS5mYWNlc1tpXTtcbiAgICAgICAgaW5kaWNlcy5wdXNoKGZhY2UuYSwgZmFjZS5iLCBmYWNlLmMpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJlcGVhdEluZGV4Q291bnQgKz0gaW5kaWNlcy5sZW5ndGg7XG5cbiAgICByZXR1cm4gaW5kaWNlcztcbiAgfSk7XG5cbiAgY29uc3QgaW5kZXhCdWZmZXIgPSBuZXcgVWludDMyQXJyYXkocmVwZWF0SW5kZXhDb3VudCAqIHRoaXMucmVwZWF0Q291bnQpO1xuICBsZXQgaW5kZXhPZmZzZXQgPSAwO1xuICBsZXQgcHJlZmFiT2Zmc2V0ID0gMDtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucHJlZmFiQ291bnQ7IGkrKykge1xuICAgIGNvbnN0IGluZGV4ID0gaSAlIHRoaXMucHJlZmFiR2VvbWV0cmllc0NvdW50O1xuICAgIGNvbnN0IGluZGljZXMgPSB0aGlzLnByZWZhYkluZGljZXNbaW5kZXhdO1xuICAgIGNvbnN0IHZlcnRleENvdW50ID0gdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudHNbaW5kZXhdO1xuXG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCBpbmRpY2VzLmxlbmd0aDsgaisrKSB7XG4gICAgICBpbmRleEJ1ZmZlcltpbmRleE9mZnNldCsrXSA9IGluZGljZXNbal0gKyBwcmVmYWJPZmZzZXQ7XG4gICAgfVxuXG4gICAgcHJlZmFiT2Zmc2V0ICs9IHZlcnRleENvdW50O1xuICB9XG5cbiAgdGhpcy5zZXRJbmRleChuZXcgQnVmZmVyQXR0cmlidXRlKGluZGV4QnVmZmVyLCAxKSk7XG59O1xuXG5NdWx0aVByZWZhYkJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5idWZmZXJQb3NpdGlvbnMgPSBmdW5jdGlvbigpIHtcbiAgY29uc3QgcG9zaXRpb25CdWZmZXIgPSB0aGlzLmNyZWF0ZUF0dHJpYnV0ZSgncG9zaXRpb24nLCAzKS5hcnJheTtcblxuICBjb25zdCBwcmVmYWJQb3NpdGlvbnMgPSB0aGlzLnByZWZhYkdlb21ldHJpZXMubWFwKChnZW9tZXRyeSwgaSkgPT4ge1xuICAgIGxldCBwb3NpdGlvbnM7XG5cbiAgICBpZiAoZ2VvbWV0cnkuaXNCdWZmZXJHZW9tZXRyeSkge1xuICAgICAgcG9zaXRpb25zID0gZ2VvbWV0cnkuYXR0cmlidXRlcy5wb3NpdGlvbi5hcnJheTtcbiAgICB9IGVsc2Uge1xuXG4gICAgICBjb25zdCB2ZXJ0ZXhDb3VudCA9IHRoaXMucHJlZmFiVmVydGV4Q291bnRzW2ldO1xuXG4gICAgICBwb3NpdGlvbnMgPSBbXTtcblxuICAgICAgZm9yIChsZXQgaiA9IDAsIG9mZnNldCA9IDA7IGogPCB2ZXJ0ZXhDb3VudDsgaisrKSB7XG4gICAgICAgIGNvbnN0IHByZWZhYlZlcnRleCA9IGdlb21ldHJ5LnZlcnRpY2VzW2pdO1xuXG4gICAgICAgIHBvc2l0aW9uc1tvZmZzZXQrK10gPSBwcmVmYWJWZXJ0ZXgueDtcbiAgICAgICAgcG9zaXRpb25zW29mZnNldCsrXSA9IHByZWZhYlZlcnRleC55O1xuICAgICAgICBwb3NpdGlvbnNbb2Zmc2V0KytdID0gcHJlZmFiVmVydGV4Lno7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHBvc2l0aW9ucztcbiAgfSk7XG5cbiAgZm9yIChsZXQgaSA9IDAsIG9mZnNldCA9IDA7IGkgPCB0aGlzLnByZWZhYkNvdW50OyBpKyspIHtcbiAgICBjb25zdCBpbmRleCA9IGkgJSB0aGlzLnByZWZhYkdlb21ldHJpZXMubGVuZ3RoO1xuICAgIGNvbnN0IHZlcnRleENvdW50ID0gdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudHNbaW5kZXhdO1xuICAgIGNvbnN0IHBvc2l0aW9ucyA9IHByZWZhYlBvc2l0aW9uc1tpbmRleF07XG5cbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IHZlcnRleENvdW50OyBqKyspIHtcbiAgICAgIHBvc2l0aW9uQnVmZmVyW29mZnNldCsrXSA9IHBvc2l0aW9uc1tqICogM107XG4gICAgICBwb3NpdGlvbkJ1ZmZlcltvZmZzZXQrK10gPSBwb3NpdGlvbnNbaiAqIDMgKyAxXTtcbiAgICAgIHBvc2l0aW9uQnVmZmVyW29mZnNldCsrXSA9IHBvc2l0aW9uc1tqICogMyArIDJdO1xuICAgIH1cbiAgfVxufTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgQnVmZmVyQXR0cmlidXRlIHdpdGggVVYgY29vcmRpbmF0ZXMuXG4gKi9cbk11bHRpUHJlZmFiQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmJ1ZmZlclV2cyA9IGZ1bmN0aW9uKCkge1xuICBjb25zdCB1dkJ1ZmZlciA9IHRoaXMuY3JlYXRlQXR0cmlidXRlKCd1dicsIDIpLmFycmF5O1xuXG4gIGNvbnN0IHByZWZhYlV2cyA9IHRoaXMucHJlZmFiR2VvbWV0cmllcy5tYXAoKGdlb21ldHJ5LCBpKSA9PiB7XG4gICAgbGV0IHV2cztcblxuICAgIGlmIChnZW9tZXRyeS5pc0J1ZmZlckdlb21ldHJ5KSB7XG4gICAgICBpZiAoIWdlb21ldHJ5LmF0dHJpYnV0ZXMudXYpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignTm8gVVYgZm91bmQgaW4gcHJlZmFiIGdlb21ldHJ5JywgZ2VvbWV0cnkpO1xuICAgICAgfVxuXG4gICAgICB1dnMgPSBnZW9tZXRyeS5hdHRyaWJ1dGVzLnV2LmFycmF5O1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBwcmVmYWJGYWNlQ291bnQgPSB0aGlzLnByZWZhYkluZGljZXNbaV0ubGVuZ3RoIC8gMztcbiAgICAgIGNvbnN0IHV2T2JqZWN0cyA9IFtdO1xuXG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHByZWZhYkZhY2VDb3VudDsgaisrKSB7XG4gICAgICAgIGNvbnN0IGZhY2UgPSBnZW9tZXRyeS5mYWNlc1tqXTtcbiAgICAgICAgY29uc3QgdXYgPSBnZW9tZXRyeS5mYWNlVmVydGV4VXZzWzBdW2pdO1xuXG4gICAgICAgIHV2T2JqZWN0c1tmYWNlLmFdID0gdXZbMF07XG4gICAgICAgIHV2T2JqZWN0c1tmYWNlLmJdID0gdXZbMV07XG4gICAgICAgIHV2T2JqZWN0c1tmYWNlLmNdID0gdXZbMl07XG4gICAgICB9XG5cbiAgICAgIHV2cyA9IFtdO1xuXG4gICAgICBmb3IgKGxldCBrID0gMDsgayA8IHV2T2JqZWN0cy5sZW5ndGg7IGsrKykge1xuICAgICAgICB1dnNbayAqIDJdID0gdXZPYmplY3RzW2tdLng7XG4gICAgICAgIHV2c1trICogMiArIDFdID0gdXZPYmplY3RzW2tdLnk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHV2cztcbiAgfSk7XG5cbiAgZm9yIChsZXQgaSA9IDAsIG9mZnNldCA9IDA7IGkgPCB0aGlzLnByZWZhYkNvdW50OyBpKyspIHtcblxuICAgIGNvbnN0IGluZGV4ID0gaSAlIHRoaXMucHJlZmFiR2VvbWV0cmllcy5sZW5ndGg7XG4gICAgY29uc3QgdmVydGV4Q291bnQgPSB0aGlzLnByZWZhYlZlcnRleENvdW50c1tpbmRleF07XG4gICAgY29uc3QgdXZzID0gcHJlZmFiVXZzW2luZGV4XTtcblxuICAgIGZvciAobGV0IGogPSAwOyBqIDwgdmVydGV4Q291bnQ7IGorKykge1xuICAgICAgdXZCdWZmZXJbb2Zmc2V0KytdID0gdXZzW2ogKiAyXTtcbiAgICAgIHV2QnVmZmVyW29mZnNldCsrXSA9IHV2c1tqICogMiArIDFdO1xuICAgIH1cbiAgfVxufTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgQnVmZmVyQXR0cmlidXRlIG9uIHRoaXMgZ2VvbWV0cnkgaW5zdGFuY2UuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgTmFtZSBvZiB0aGUgYXR0cmlidXRlLlxuICogQHBhcmFtIHtOdW1iZXJ9IGl0ZW1TaXplIE51bWJlciBvZiBmbG9hdHMgcGVyIHZlcnRleCAodHlwaWNhbGx5IDEsIDIsIDMgb3IgNCkuXG4gKiBAcGFyYW0ge2Z1bmN0aW9uPX0gZmFjdG9yeSBGdW5jdGlvbiB0aGF0IHdpbGwgYmUgY2FsbGVkIGZvciBlYWNoIHByZWZhYiB1cG9uIGNyZWF0aW9uLiBBY2NlcHRzIDMgYXJndW1lbnRzOiBkYXRhW10sIGluZGV4IGFuZCBwcmVmYWJDb3VudC4gQ2FsbHMgc2V0UHJlZmFiRGF0YS5cbiAqXG4gKiBAcmV0dXJucyB7QnVmZmVyQXR0cmlidXRlfVxuICovXG5NdWx0aVByZWZhYkJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5jcmVhdGVBdHRyaWJ1dGUgPSBmdW5jdGlvbihuYW1lLCBpdGVtU2l6ZSwgZmFjdG9yeSkge1xuICBjb25zdCBidWZmZXIgPSBuZXcgRmxvYXQzMkFycmF5KHRoaXMucmVwZWF0Q291bnQgKiB0aGlzLnJlcGVhdFZlcnRleENvdW50ICogaXRlbVNpemUpO1xuICBjb25zdCBhdHRyaWJ1dGUgPSBuZXcgQnVmZmVyQXR0cmlidXRlKGJ1ZmZlciwgaXRlbVNpemUpO1xuICBcbiAgdGhpcy5hZGRBdHRyaWJ1dGUobmFtZSwgYXR0cmlidXRlKTtcbiAgXG4gIGlmIChmYWN0b3J5KSB7XG4gICAgY29uc3QgZGF0YSA9IFtdO1xuICAgIFxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5wcmVmYWJDb3VudDsgaSsrKSB7XG4gICAgICBmYWN0b3J5KGRhdGEsIGksIHRoaXMucHJlZmFiQ291bnQpO1xuICAgICAgdGhpcy5zZXRQcmVmYWJEYXRhKGF0dHJpYnV0ZSwgaSwgZGF0YSk7XG4gICAgfVxuICB9XG4gIFxuICByZXR1cm4gYXR0cmlidXRlO1xufTtcblxuLyoqXG4gKiBTZXRzIGRhdGEgZm9yIGFsbCB2ZXJ0aWNlcyBvZiBhIHByZWZhYiBhdCBhIGdpdmVuIGluZGV4LlxuICogVXN1YWxseSBjYWxsZWQgaW4gYSBsb29wLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfEJ1ZmZlckF0dHJpYnV0ZX0gYXR0cmlidXRlIFRoZSBhdHRyaWJ1dGUgb3IgYXR0cmlidXRlIG5hbWUgd2hlcmUgdGhlIGRhdGEgaXMgdG8gYmUgc3RvcmVkLlxuICogQHBhcmFtIHtOdW1iZXJ9IHByZWZhYkluZGV4IEluZGV4IG9mIHRoZSBwcmVmYWIgaW4gdGhlIGJ1ZmZlciBnZW9tZXRyeS5cbiAqIEBwYXJhbSB7QXJyYXl9IGRhdGEgQXJyYXkgb2YgZGF0YS4gTGVuZ3RoIHNob3VsZCBiZSBlcXVhbCB0byBpdGVtIHNpemUgb2YgdGhlIGF0dHJpYnV0ZS5cbiAqL1xuTXVsdGlQcmVmYWJCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuc2V0UHJlZmFiRGF0YSA9IGZ1bmN0aW9uKGF0dHJpYnV0ZSwgcHJlZmFiSW5kZXgsIGRhdGEpIHtcbiAgYXR0cmlidXRlID0gKHR5cGVvZiBhdHRyaWJ1dGUgPT09ICdzdHJpbmcnKSA/IHRoaXMuYXR0cmlidXRlc1thdHRyaWJ1dGVdIDogYXR0cmlidXRlO1xuXG4gIGNvbnN0IHByZWZhYkdlb21ldHJ5SW5kZXggPSBwcmVmYWJJbmRleCAlIHRoaXMucHJlZmFiR2VvbWV0cmllc0NvdW50O1xuICBjb25zdCBwcmVmYWJHZW9tZXRyeVZlcnRleENvdW50ID0gdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudHNbcHJlZmFiR2VvbWV0cnlJbmRleF07XG4gIGNvbnN0IHdob2xlID0gKHByZWZhYkluZGV4IC8gdGhpcy5wcmVmYWJHZW9tZXRyaWVzQ291bnQgfCAwKSAqIHRoaXMucHJlZmFiR2VvbWV0cmllc0NvdW50O1xuICBjb25zdCB3aG9sZU9mZnNldCA9IHdob2xlICogdGhpcy5yZXBlYXRWZXJ0ZXhDb3VudDtcbiAgY29uc3QgcGFydCA9IHByZWZhYkluZGV4IC0gd2hvbGU7XG4gIGxldCBwYXJ0T2Zmc2V0ID0gMDtcbiAgbGV0IGkgPSAwO1xuXG4gIHdoaWxlKGkgPCBwYXJ0KSB7XG4gICAgcGFydE9mZnNldCArPSB0aGlzLnByZWZhYlZlcnRleENvdW50c1tpKytdO1xuICB9XG5cbiAgbGV0IG9mZnNldCA9ICh3aG9sZU9mZnNldCArIHBhcnRPZmZzZXQpICogYXR0cmlidXRlLml0ZW1TaXplO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgcHJlZmFiR2VvbWV0cnlWZXJ0ZXhDb3VudDsgaSsrKSB7XG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCBhdHRyaWJ1dGUuaXRlbVNpemU7IGorKykge1xuICAgICAgYXR0cmlidXRlLmFycmF5W29mZnNldCsrXSA9IGRhdGFbal07XG4gICAgfVxuICB9XG59O1xuXG5leHBvcnQgeyBNdWx0aVByZWZhYkJ1ZmZlckdlb21ldHJ5IH07XG4iLCJpbXBvcnQgeyBNYXRoIGFzIHRNYXRoLCBWZWN0b3IzIH0gZnJvbSAndGhyZWUnO1xuaW1wb3J0IHsgRGVwdGhBbmltYXRpb25NYXRlcmlhbCB9IGZyb20gJy4vbWF0ZXJpYWxzL0RlcHRoQW5pbWF0aW9uTWF0ZXJpYWwnO1xuaW1wb3J0IHsgRGlzdGFuY2VBbmltYXRpb25NYXRlcmlhbCB9IGZyb20gJy4vbWF0ZXJpYWxzL0Rpc3RhbmNlQW5pbWF0aW9uTWF0ZXJpYWwnO1xuXG4vKipcbiAqIENvbGxlY3Rpb24gb2YgdXRpbGl0eSBmdW5jdGlvbnMuXG4gKiBAbmFtZXNwYWNlXG4gKi9cbmNvbnN0IFV0aWxzID0ge1xuICAvKipcbiAgICogRHVwbGljYXRlcyB2ZXJ0aWNlcyBzbyBlYWNoIGZhY2UgYmVjb21lcyBzZXBhcmF0ZS5cbiAgICogU2FtZSBhcyBUSFJFRS5FeHBsb2RlTW9kaWZpZXIuXG4gICAqXG4gICAqIEBwYXJhbSB7VEhSRUUuR2VvbWV0cnl9IGdlb21ldHJ5IEdlb21ldHJ5IGluc3RhbmNlIHRvIG1vZGlmeS5cbiAgICovXG4gIHNlcGFyYXRlRmFjZXM6IGZ1bmN0aW9uIChnZW9tZXRyeSkge1xuICAgIGxldCB2ZXJ0aWNlcyA9IFtdO1xuXG4gICAgZm9yIChsZXQgaSA9IDAsIGlsID0gZ2VvbWV0cnkuZmFjZXMubGVuZ3RoOyBpIDwgaWw7IGkrKykge1xuICAgICAgbGV0IG4gPSB2ZXJ0aWNlcy5sZW5ndGg7XG4gICAgICBsZXQgZmFjZSA9IGdlb21ldHJ5LmZhY2VzW2ldO1xuXG4gICAgICBsZXQgYSA9IGZhY2UuYTtcbiAgICAgIGxldCBiID0gZmFjZS5iO1xuICAgICAgbGV0IGMgPSBmYWNlLmM7XG5cbiAgICAgIGxldCB2YSA9IGdlb21ldHJ5LnZlcnRpY2VzW2FdO1xuICAgICAgbGV0IHZiID0gZ2VvbWV0cnkudmVydGljZXNbYl07XG4gICAgICBsZXQgdmMgPSBnZW9tZXRyeS52ZXJ0aWNlc1tjXTtcblxuICAgICAgdmVydGljZXMucHVzaCh2YS5jbG9uZSgpKTtcbiAgICAgIHZlcnRpY2VzLnB1c2godmIuY2xvbmUoKSk7XG4gICAgICB2ZXJ0aWNlcy5wdXNoKHZjLmNsb25lKCkpO1xuXG4gICAgICBmYWNlLmEgPSBuO1xuICAgICAgZmFjZS5iID0gbiArIDE7XG4gICAgICBmYWNlLmMgPSBuICsgMjtcbiAgICB9XG5cbiAgICBnZW9tZXRyeS52ZXJ0aWNlcyA9IHZlcnRpY2VzO1xuICB9LFxuXG4gIC8qKlxuICAgKiBDb21wdXRlIHRoZSBjZW50cm9pZCAoY2VudGVyKSBvZiBhIFRIUkVFLkZhY2UzLlxuICAgKlxuICAgKiBAcGFyYW0ge1RIUkVFLkdlb21ldHJ5fSBnZW9tZXRyeSBHZW9tZXRyeSBpbnN0YW5jZSB0aGUgZmFjZSBpcyBpbi5cbiAgICogQHBhcmFtIHtUSFJFRS5GYWNlM30gZmFjZSBGYWNlIG9iamVjdCBmcm9tIHRoZSBUSFJFRS5HZW9tZXRyeS5mYWNlcyBhcnJheVxuICAgKiBAcGFyYW0ge1RIUkVFLlZlY3RvcjM9fSB2IE9wdGlvbmFsIHZlY3RvciB0byBzdG9yZSByZXN1bHQgaW4uXG4gICAqIEByZXR1cm5zIHtUSFJFRS5WZWN0b3IzfVxuICAgKi9cbiAgY29tcHV0ZUNlbnRyb2lkOiBmdW5jdGlvbihnZW9tZXRyeSwgZmFjZSwgdikge1xuICAgIGxldCBhID0gZ2VvbWV0cnkudmVydGljZXNbZmFjZS5hXTtcbiAgICBsZXQgYiA9IGdlb21ldHJ5LnZlcnRpY2VzW2ZhY2UuYl07XG4gICAgbGV0IGMgPSBnZW9tZXRyeS52ZXJ0aWNlc1tmYWNlLmNdO1xuXG4gICAgdiA9IHYgfHwgbmV3IFZlY3RvcjMoKTtcblxuICAgIHYueCA9IChhLnggKyBiLnggKyBjLngpIC8gMztcbiAgICB2LnkgPSAoYS55ICsgYi55ICsgYy55KSAvIDM7XG4gICAgdi56ID0gKGEueiArIGIueiArIGMueikgLyAzO1xuXG4gICAgcmV0dXJuIHY7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEdldCBhIHJhbmRvbSB2ZWN0b3IgYmV0d2VlbiBib3gubWluIGFuZCBib3gubWF4LlxuICAgKlxuICAgKiBAcGFyYW0ge1RIUkVFLkJveDN9IGJveCBUSFJFRS5Cb3gzIGluc3RhbmNlLlxuICAgKiBAcGFyYW0ge1RIUkVFLlZlY3RvcjM9fSB2IE9wdGlvbmFsIHZlY3RvciB0byBzdG9yZSByZXN1bHQgaW4uXG4gICAqIEByZXR1cm5zIHtUSFJFRS5WZWN0b3IzfVxuICAgKi9cbiAgcmFuZG9tSW5Cb3g6IGZ1bmN0aW9uKGJveCwgdikge1xuICAgIHYgPSB2IHx8IG5ldyBWZWN0b3IzKCk7XG5cbiAgICB2LnggPSB0TWF0aC5yYW5kRmxvYXQoYm94Lm1pbi54LCBib3gubWF4LngpO1xuICAgIHYueSA9IHRNYXRoLnJhbmRGbG9hdChib3gubWluLnksIGJveC5tYXgueSk7XG4gICAgdi56ID0gdE1hdGgucmFuZEZsb2F0KGJveC5taW4ueiwgYm94Lm1heC56KTtcblxuICAgIHJldHVybiB2O1xuICB9LFxuXG4gIC8qKlxuICAgKiBHZXQgYSByYW5kb20gYXhpcyBmb3IgcXVhdGVybmlvbiByb3RhdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIHtUSFJFRS5WZWN0b3IzPX0gdiBPcHRpb24gdmVjdG9yIHRvIHN0b3JlIHJlc3VsdCBpbi5cbiAgICogQHJldHVybnMge1RIUkVFLlZlY3RvcjN9XG4gICAqL1xuICByYW5kb21BeGlzOiBmdW5jdGlvbih2KSB7XG4gICAgdiA9IHYgfHwgbmV3IFZlY3RvcjMoKTtcblxuICAgIHYueCA9IHRNYXRoLnJhbmRGbG9hdFNwcmVhZCgyLjApO1xuICAgIHYueSA9IHRNYXRoLnJhbmRGbG9hdFNwcmVhZCgyLjApO1xuICAgIHYueiA9IHRNYXRoLnJhbmRGbG9hdFNwcmVhZCgyLjApO1xuICAgIHYubm9ybWFsaXplKCk7XG5cbiAgICByZXR1cm4gdjtcbiAgfSxcblxuICAvKipcbiAgICogQ3JlYXRlIGEgVEhSRUUuQkFTLkRlcHRoQW5pbWF0aW9uTWF0ZXJpYWwgZm9yIHNoYWRvd3MgZnJvbSBhIFRIUkVFLlNwb3RMaWdodCBvciBUSFJFRS5EaXJlY3Rpb25hbExpZ2h0IGJ5IGNvcHlpbmcgcmVsZXZhbnQgc2hhZGVyIGNodW5rcy5cbiAgICogVW5pZm9ybSB2YWx1ZXMgbXVzdCBiZSBtYW51YWxseSBzeW5jZWQgYmV0d2VlbiB0aGUgc291cmNlIG1hdGVyaWFsIGFuZCB0aGUgZGVwdGggbWF0ZXJpYWwuXG4gICAqXG4gICAqIEBzZWUge0BsaW5rIGh0dHA6Ly90aHJlZS1iYXMtZXhhbXBsZXMuc3VyZ2Uuc2gvZXhhbXBsZXMvc2hhZG93cy99XG4gICAqXG4gICAqIEBwYXJhbSB7VEhSRUUuQkFTLkJhc2VBbmltYXRpb25NYXRlcmlhbH0gc291cmNlTWF0ZXJpYWwgSW5zdGFuY2UgdG8gZ2V0IHRoZSBzaGFkZXIgY2h1bmtzIGZyb20uXG4gICAqIEByZXR1cm5zIHtUSFJFRS5CQVMuRGVwdGhBbmltYXRpb25NYXRlcmlhbH1cbiAgICovXG4gIGNyZWF0ZURlcHRoQW5pbWF0aW9uTWF0ZXJpYWw6IGZ1bmN0aW9uKHNvdXJjZU1hdGVyaWFsKSB7XG4gICAgcmV0dXJuIG5ldyBEZXB0aEFuaW1hdGlvbk1hdGVyaWFsKHtcbiAgICAgIHVuaWZvcm1zOiBzb3VyY2VNYXRlcmlhbC51bmlmb3JtcyxcbiAgICAgIGRlZmluZXM6IHNvdXJjZU1hdGVyaWFsLmRlZmluZXMsXG4gICAgICB2ZXJ0ZXhGdW5jdGlvbnM6IHNvdXJjZU1hdGVyaWFsLnZlcnRleEZ1bmN0aW9ucyxcbiAgICAgIHZlcnRleFBhcmFtZXRlcnM6IHNvdXJjZU1hdGVyaWFsLnZlcnRleFBhcmFtZXRlcnMsXG4gICAgICB2ZXJ0ZXhJbml0OiBzb3VyY2VNYXRlcmlhbC52ZXJ0ZXhJbml0LFxuICAgICAgdmVydGV4UG9zaXRpb246IHNvdXJjZU1hdGVyaWFsLnZlcnRleFBvc2l0aW9uXG4gICAgfSk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIFRIUkVFLkJBUy5EaXN0YW5jZUFuaW1hdGlvbk1hdGVyaWFsIGZvciBzaGFkb3dzIGZyb20gYSBUSFJFRS5Qb2ludExpZ2h0IGJ5IGNvcHlpbmcgcmVsZXZhbnQgc2hhZGVyIGNodW5rcy5cbiAgICogVW5pZm9ybSB2YWx1ZXMgbXVzdCBiZSBtYW51YWxseSBzeW5jZWQgYmV0d2VlbiB0aGUgc291cmNlIG1hdGVyaWFsIGFuZCB0aGUgZGlzdGFuY2UgbWF0ZXJpYWwuXG4gICAqXG4gICAqIEBzZWUge0BsaW5rIGh0dHA6Ly90aHJlZS1iYXMtZXhhbXBsZXMuc3VyZ2Uuc2gvZXhhbXBsZXMvc2hhZG93cy99XG4gICAqXG4gICAqIEBwYXJhbSB7VEhSRUUuQkFTLkJhc2VBbmltYXRpb25NYXRlcmlhbH0gc291cmNlTWF0ZXJpYWwgSW5zdGFuY2UgdG8gZ2V0IHRoZSBzaGFkZXIgY2h1bmtzIGZyb20uXG4gICAqIEByZXR1cm5zIHtUSFJFRS5CQVMuRGlzdGFuY2VBbmltYXRpb25NYXRlcmlhbH1cbiAgICovXG4gIGNyZWF0ZURpc3RhbmNlQW5pbWF0aW9uTWF0ZXJpYWw6IGZ1bmN0aW9uKHNvdXJjZU1hdGVyaWFsKSB7XG4gICAgcmV0dXJuIG5ldyBEaXN0YW5jZUFuaW1hdGlvbk1hdGVyaWFsKHtcbiAgICAgIHVuaWZvcm1zOiBzb3VyY2VNYXRlcmlhbC51bmlmb3JtcyxcbiAgICAgIGRlZmluZXM6IHNvdXJjZU1hdGVyaWFsLmRlZmluZXMsXG4gICAgICB2ZXJ0ZXhGdW5jdGlvbnM6IHNvdXJjZU1hdGVyaWFsLnZlcnRleEZ1bmN0aW9ucyxcbiAgICAgIHZlcnRleFBhcmFtZXRlcnM6IHNvdXJjZU1hdGVyaWFsLnZlcnRleFBhcmFtZXRlcnMsXG4gICAgICB2ZXJ0ZXhJbml0OiBzb3VyY2VNYXRlcmlhbC52ZXJ0ZXhJbml0LFxuICAgICAgdmVydGV4UG9zaXRpb246IHNvdXJjZU1hdGVyaWFsLnZlcnRleFBvc2l0aW9uXG4gICAgfSk7XG4gIH1cbn07XG5cbmV4cG9ydCB7IFV0aWxzIH07XG4iLCJpbXBvcnQgeyBCdWZmZXJHZW9tZXRyeSwgQnVmZmVyQXR0cmlidXRlIH0gZnJvbSAndGhyZWUnO1xuaW1wb3J0IHsgVXRpbHMgfSBmcm9tICcuLi9VdGlscyc7XG5cbi8qKlxuICogQSBUSFJFRS5CdWZmZXJHZW9tZXRyeSBmb3IgYW5pbWF0aW5nIGluZGl2aWR1YWwgZmFjZXMgb2YgYSBUSFJFRS5HZW9tZXRyeS5cbiAqXG4gKiBAcGFyYW0ge1RIUkVFLkdlb21ldHJ5fSBtb2RlbCBUaGUgVEhSRUUuR2VvbWV0cnkgdG8gYmFzZSB0aGlzIGdlb21ldHJ5IG9uLlxuICogQHBhcmFtIHtPYmplY3Q9fSBvcHRpb25zXG4gKiBAcGFyYW0ge0Jvb2xlYW49fSBvcHRpb25zLmNvbXB1dGVDZW50cm9pZHMgSWYgdHJ1ZSwgYSBjZW50cm9pZHMgd2lsbCBiZSBjb21wdXRlZCBmb3IgZWFjaCBmYWNlIGFuZCBzdG9yZWQgaW4gVEhSRUUuQkFTLk1vZGVsQnVmZmVyR2VvbWV0cnkuY2VudHJvaWRzLlxuICogQHBhcmFtIHtCb29sZWFuPX0gb3B0aW9ucy5sb2NhbGl6ZUZhY2VzIElmIHRydWUsIHRoZSBwb3NpdGlvbnMgZm9yIGVhY2ggZmFjZSB3aWxsIGJlIHN0b3JlZCByZWxhdGl2ZSB0byB0aGUgY2VudHJvaWQuIFRoaXMgaXMgdXNlZnVsIGlmIHlvdSB3YW50IHRvIHJvdGF0ZSBvciBzY2FsZSBmYWNlcyBhcm91bmQgdGhlaXIgY2VudGVyLlxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIE1vZGVsQnVmZmVyR2VvbWV0cnkobW9kZWwsIG9wdGlvbnMpIHtcbiAgQnVmZmVyR2VvbWV0cnkuY2FsbCh0aGlzKTtcblxuICAvKipcbiAgICogQSByZWZlcmVuY2UgdG8gdGhlIGdlb21ldHJ5IHVzZWQgdG8gY3JlYXRlIHRoaXMgaW5zdGFuY2UuXG4gICAqIEB0eXBlIHtUSFJFRS5HZW9tZXRyeX1cbiAgICovXG4gIHRoaXMubW9kZWxHZW9tZXRyeSA9IG1vZGVsO1xuXG4gIC8qKlxuICAgKiBOdW1iZXIgb2YgZmFjZXMgb2YgdGhlIG1vZGVsLlxuICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgKi9cbiAgdGhpcy5mYWNlQ291bnQgPSB0aGlzLm1vZGVsR2VvbWV0cnkuZmFjZXMubGVuZ3RoO1xuXG4gIC8qKlxuICAgKiBOdW1iZXIgb2YgdmVydGljZXMgb2YgdGhlIG1vZGVsLlxuICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgKi9cbiAgdGhpcy52ZXJ0ZXhDb3VudCA9IHRoaXMubW9kZWxHZW9tZXRyeS52ZXJ0aWNlcy5sZW5ndGg7XG5cbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gIG9wdGlvbnMuY29tcHV0ZUNlbnRyb2lkcyAmJiB0aGlzLmNvbXB1dGVDZW50cm9pZHMoKTtcblxuICB0aGlzLmJ1ZmZlckluZGljZXMoKTtcbiAgdGhpcy5idWZmZXJQb3NpdGlvbnMob3B0aW9ucy5sb2NhbGl6ZUZhY2VzKTtcbn1cbk1vZGVsQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUpO1xuTW9kZWxCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBNb2RlbEJ1ZmZlckdlb21ldHJ5O1xuXG4vKipcbiAqIENvbXB1dGVzIGEgY2VudHJvaWQgZm9yIGVhY2ggZmFjZSBhbmQgc3RvcmVzIGl0IGluIFRIUkVFLkJBUy5Nb2RlbEJ1ZmZlckdlb21ldHJ5LmNlbnRyb2lkcy5cbiAqL1xuTW9kZWxCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuY29tcHV0ZUNlbnRyb2lkcyA9IGZ1bmN0aW9uKCkge1xuICAvKipcbiAgICogQW4gYXJyYXkgb2YgY2VudHJvaWRzIGNvcnJlc3BvbmRpbmcgdG8gdGhlIGZhY2VzIG9mIHRoZSBtb2RlbC5cbiAgICpcbiAgICogQHR5cGUge0FycmF5fVxuICAgKi9cbiAgdGhpcy5jZW50cm9pZHMgPSBbXTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuZmFjZUNvdW50OyBpKyspIHtcbiAgICB0aGlzLmNlbnRyb2lkc1tpXSA9IFV0aWxzLmNvbXB1dGVDZW50cm9pZCh0aGlzLm1vZGVsR2VvbWV0cnksIHRoaXMubW9kZWxHZW9tZXRyeS5mYWNlc1tpXSk7XG4gIH1cbn07XG5cbk1vZGVsQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmJ1ZmZlckluZGljZXMgPSBmdW5jdGlvbigpIHtcbiAgY29uc3QgaW5kZXhCdWZmZXIgPSBuZXcgVWludDMyQXJyYXkodGhpcy5mYWNlQ291bnQgKiAzKTtcblxuICB0aGlzLnNldEluZGV4KG5ldyBCdWZmZXJBdHRyaWJ1dGUoaW5kZXhCdWZmZXIsIDEpKTtcblxuICBmb3IgKGxldCBpID0gMCwgb2Zmc2V0ID0gMDsgaSA8IHRoaXMuZmFjZUNvdW50OyBpKyssIG9mZnNldCArPSAzKSB7XG4gICAgY29uc3QgZmFjZSA9IHRoaXMubW9kZWxHZW9tZXRyeS5mYWNlc1tpXTtcblxuICAgIGluZGV4QnVmZmVyW29mZnNldCAgICBdID0gZmFjZS5hO1xuICAgIGluZGV4QnVmZmVyW29mZnNldCArIDFdID0gZmFjZS5iO1xuICAgIGluZGV4QnVmZmVyW29mZnNldCArIDJdID0gZmFjZS5jO1xuICB9XG59O1xuXG5Nb2RlbEJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5idWZmZXJQb3NpdGlvbnMgPSBmdW5jdGlvbihsb2NhbGl6ZUZhY2VzKSB7XG4gIGNvbnN0IHBvc2l0aW9uQnVmZmVyID0gdGhpcy5jcmVhdGVBdHRyaWJ1dGUoJ3Bvc2l0aW9uJywgMykuYXJyYXk7XG4gIGxldCBpLCBvZmZzZXQ7XG5cbiAgaWYgKGxvY2FsaXplRmFjZXMgPT09IHRydWUpIHtcbiAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5mYWNlQ291bnQ7IGkrKykge1xuICAgICAgY29uc3QgZmFjZSA9IHRoaXMubW9kZWxHZW9tZXRyeS5mYWNlc1tpXTtcbiAgICAgIGNvbnN0IGNlbnRyb2lkID0gdGhpcy5jZW50cm9pZHMgPyB0aGlzLmNlbnRyb2lkc1tpXSA6IFV0aWxzLmNvbXB1dGVDZW50cm9pZCh0aGlzLm1vZGVsR2VvbWV0cnksIGZhY2UpO1xuXG4gICAgICBjb25zdCBhID0gdGhpcy5tb2RlbEdlb21ldHJ5LnZlcnRpY2VzW2ZhY2UuYV07XG4gICAgICBjb25zdCBiID0gdGhpcy5tb2RlbEdlb21ldHJ5LnZlcnRpY2VzW2ZhY2UuYl07XG4gICAgICBjb25zdCBjID0gdGhpcy5tb2RlbEdlb21ldHJ5LnZlcnRpY2VzW2ZhY2UuY107XG5cbiAgICAgIHBvc2l0aW9uQnVmZmVyW2ZhY2UuYSAqIDNdICAgICA9IGEueCAtIGNlbnRyb2lkLng7XG4gICAgICBwb3NpdGlvbkJ1ZmZlcltmYWNlLmEgKiAzICsgMV0gPSBhLnkgLSBjZW50cm9pZC55O1xuICAgICAgcG9zaXRpb25CdWZmZXJbZmFjZS5hICogMyArIDJdID0gYS56IC0gY2VudHJvaWQuejtcblxuICAgICAgcG9zaXRpb25CdWZmZXJbZmFjZS5iICogM10gICAgID0gYi54IC0gY2VudHJvaWQueDtcbiAgICAgIHBvc2l0aW9uQnVmZmVyW2ZhY2UuYiAqIDMgKyAxXSA9IGIueSAtIGNlbnRyb2lkLnk7XG4gICAgICBwb3NpdGlvbkJ1ZmZlcltmYWNlLmIgKiAzICsgMl0gPSBiLnogLSBjZW50cm9pZC56O1xuXG4gICAgICBwb3NpdGlvbkJ1ZmZlcltmYWNlLmMgKiAzXSAgICAgPSBjLnggLSBjZW50cm9pZC54O1xuICAgICAgcG9zaXRpb25CdWZmZXJbZmFjZS5jICogMyArIDFdID0gYy55IC0gY2VudHJvaWQueTtcbiAgICAgIHBvc2l0aW9uQnVmZmVyW2ZhY2UuYyAqIDMgKyAyXSA9IGMueiAtIGNlbnRyb2lkLno7XG4gICAgfVxuICB9XG4gIGVsc2Uge1xuICAgIGZvciAoaSA9IDAsIG9mZnNldCA9IDA7IGkgPCB0aGlzLnZlcnRleENvdW50OyBpKyssIG9mZnNldCArPSAzKSB7XG4gICAgICBjb25zdCB2ZXJ0ZXggPSB0aGlzLm1vZGVsR2VvbWV0cnkudmVydGljZXNbaV07XG5cbiAgICAgIHBvc2l0aW9uQnVmZmVyW29mZnNldCAgICBdID0gdmVydGV4Lng7XG4gICAgICBwb3NpdGlvbkJ1ZmZlcltvZmZzZXQgKyAxXSA9IHZlcnRleC55O1xuICAgICAgcG9zaXRpb25CdWZmZXJbb2Zmc2V0ICsgMl0gPSB2ZXJ0ZXguejtcbiAgICB9XG4gIH1cbn07XG5cbi8qKlxuICogQ3JlYXRlcyBhIFRIUkVFLkJ1ZmZlckF0dHJpYnV0ZSB3aXRoIFVWIGNvb3JkaW5hdGVzLlxuICovXG5Nb2RlbEJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5idWZmZXJVVnMgPSBmdW5jdGlvbigpIHtcbiAgY29uc3QgdXZCdWZmZXIgPSB0aGlzLmNyZWF0ZUF0dHJpYnV0ZSgndXYnLCAyKS5hcnJheTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuZmFjZUNvdW50OyBpKyspIHtcblxuICAgIGNvbnN0IGZhY2UgPSB0aGlzLm1vZGVsR2VvbWV0cnkuZmFjZXNbaV07XG4gICAgbGV0IHV2O1xuXG4gICAgdXYgPSB0aGlzLm1vZGVsR2VvbWV0cnkuZmFjZVZlcnRleFV2c1swXVtpXVswXTtcbiAgICB1dkJ1ZmZlcltmYWNlLmEgKiAyXSAgICAgPSB1di54O1xuICAgIHV2QnVmZmVyW2ZhY2UuYSAqIDIgKyAxXSA9IHV2Lnk7XG5cbiAgICB1diA9IHRoaXMubW9kZWxHZW9tZXRyeS5mYWNlVmVydGV4VXZzWzBdW2ldWzFdO1xuICAgIHV2QnVmZmVyW2ZhY2UuYiAqIDJdICAgICA9IHV2Lng7XG4gICAgdXZCdWZmZXJbZmFjZS5iICogMiArIDFdID0gdXYueTtcblxuICAgIHV2ID0gdGhpcy5tb2RlbEdlb21ldHJ5LmZhY2VWZXJ0ZXhVdnNbMF1baV1bMl07XG4gICAgdXZCdWZmZXJbZmFjZS5jICogMl0gICAgID0gdXYueDtcbiAgICB1dkJ1ZmZlcltmYWNlLmMgKiAyICsgMV0gPSB1di55O1xuICB9XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgdHdvIFRIUkVFLkJ1ZmZlckF0dHJpYnV0ZXM6IHNraW5JbmRleCBhbmQgc2tpbldlaWdodC4gQm90aCBhcmUgcmVxdWlyZWQgZm9yIHNraW5uaW5nLlxuICovXG5Nb2RlbEJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5idWZmZXJTa2lubmluZyA9IGZ1bmN0aW9uKCkge1xuICBjb25zdCBza2luSW5kZXhCdWZmZXIgPSB0aGlzLmNyZWF0ZUF0dHJpYnV0ZSgnc2tpbkluZGV4JywgNCkuYXJyYXk7XG4gIGNvbnN0IHNraW5XZWlnaHRCdWZmZXIgPSB0aGlzLmNyZWF0ZUF0dHJpYnV0ZSgnc2tpbldlaWdodCcsIDQpLmFycmF5O1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy52ZXJ0ZXhDb3VudDsgaSsrKSB7XG4gICAgY29uc3Qgc2tpbkluZGV4ID0gdGhpcy5tb2RlbEdlb21ldHJ5LnNraW5JbmRpY2VzW2ldO1xuICAgIGNvbnN0IHNraW5XZWlnaHQgPSB0aGlzLm1vZGVsR2VvbWV0cnkuc2tpbldlaWdodHNbaV07XG5cbiAgICBza2luSW5kZXhCdWZmZXJbaSAqIDQgICAgXSA9IHNraW5JbmRleC54O1xuICAgIHNraW5JbmRleEJ1ZmZlcltpICogNCArIDFdID0gc2tpbkluZGV4Lnk7XG4gICAgc2tpbkluZGV4QnVmZmVyW2kgKiA0ICsgMl0gPSBza2luSW5kZXguejtcbiAgICBza2luSW5kZXhCdWZmZXJbaSAqIDQgKyAzXSA9IHNraW5JbmRleC53O1xuXG4gICAgc2tpbldlaWdodEJ1ZmZlcltpICogNCAgICBdID0gc2tpbldlaWdodC54O1xuICAgIHNraW5XZWlnaHRCdWZmZXJbaSAqIDQgKyAxXSA9IHNraW5XZWlnaHQueTtcbiAgICBza2luV2VpZ2h0QnVmZmVyW2kgKiA0ICsgMl0gPSBza2luV2VpZ2h0Lno7XG4gICAgc2tpbldlaWdodEJ1ZmZlcltpICogNCArIDNdID0gc2tpbldlaWdodC53O1xuICB9XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBUSFJFRS5CdWZmZXJBdHRyaWJ1dGUgb24gdGhpcyBnZW9tZXRyeSBpbnN0YW5jZS5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZSBOYW1lIG9mIHRoZSBhdHRyaWJ1dGUuXG4gKiBAcGFyYW0ge2ludH0gaXRlbVNpemUgTnVtYmVyIG9mIGZsb2F0cyBwZXIgdmVydGV4ICh0eXBpY2FsbHkgMSwgMiwgMyBvciA0KS5cbiAqIEBwYXJhbSB7ZnVuY3Rpb249fSBmYWN0b3J5IEZ1bmN0aW9uIHRoYXQgd2lsbCBiZSBjYWxsZWQgZm9yIGVhY2ggZmFjZSB1cG9uIGNyZWF0aW9uLiBBY2NlcHRzIDMgYXJndW1lbnRzOiBkYXRhW10sIGluZGV4IGFuZCBmYWNlQ291bnQuIENhbGxzIHNldEZhY2VEYXRhLlxuICpcbiAqIEByZXR1cm5zIHtCdWZmZXJBdHRyaWJ1dGV9XG4gKi9cbk1vZGVsQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmNyZWF0ZUF0dHJpYnV0ZSA9IGZ1bmN0aW9uKG5hbWUsIGl0ZW1TaXplLCBmYWN0b3J5KSB7XG4gIGNvbnN0IGJ1ZmZlciA9IG5ldyBGbG9hdDMyQXJyYXkodGhpcy52ZXJ0ZXhDb3VudCAqIGl0ZW1TaXplKTtcbiAgY29uc3QgYXR0cmlidXRlID0gbmV3IEJ1ZmZlckF0dHJpYnV0ZShidWZmZXIsIGl0ZW1TaXplKTtcblxuICB0aGlzLmFkZEF0dHJpYnV0ZShuYW1lLCBhdHRyaWJ1dGUpO1xuXG4gIGlmIChmYWN0b3J5KSB7XG4gICAgY29uc3QgZGF0YSA9IFtdO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmZhY2VDb3VudDsgaSsrKSB7XG4gICAgICBmYWN0b3J5KGRhdGEsIGksIHRoaXMuZmFjZUNvdW50KTtcbiAgICAgIHRoaXMuc2V0RmFjZURhdGEoYXR0cmlidXRlLCBpLCBkYXRhKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gYXR0cmlidXRlO1xufTtcblxuLyoqXG4gKiBTZXRzIGRhdGEgZm9yIGFsbCB2ZXJ0aWNlcyBvZiBhIGZhY2UgYXQgYSBnaXZlbiBpbmRleC5cbiAqIFVzdWFsbHkgY2FsbGVkIGluIGEgbG9vcC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ3xUSFJFRS5CdWZmZXJBdHRyaWJ1dGV9IGF0dHJpYnV0ZSBUaGUgYXR0cmlidXRlIG9yIGF0dHJpYnV0ZSBuYW1lIHdoZXJlIHRoZSBkYXRhIGlzIHRvIGJlIHN0b3JlZC5cbiAqIEBwYXJhbSB7aW50fSBmYWNlSW5kZXggSW5kZXggb2YgdGhlIGZhY2UgaW4gdGhlIGJ1ZmZlciBnZW9tZXRyeS5cbiAqIEBwYXJhbSB7QXJyYXl9IGRhdGEgQXJyYXkgb2YgZGF0YS4gTGVuZ3RoIHNob3VsZCBiZSBlcXVhbCB0byBpdGVtIHNpemUgb2YgdGhlIGF0dHJpYnV0ZS5cbiAqL1xuTW9kZWxCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuc2V0RmFjZURhdGEgPSBmdW5jdGlvbihhdHRyaWJ1dGUsIGZhY2VJbmRleCwgZGF0YSkge1xuICBhdHRyaWJ1dGUgPSAodHlwZW9mIGF0dHJpYnV0ZSA9PT0gJ3N0cmluZycpID8gdGhpcy5hdHRyaWJ1dGVzW2F0dHJpYnV0ZV0gOiBhdHRyaWJ1dGU7XG5cbiAgbGV0IG9mZnNldCA9IGZhY2VJbmRleCAqIDMgKiBhdHRyaWJ1dGUuaXRlbVNpemU7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCAzOyBpKyspIHtcbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IGF0dHJpYnV0ZS5pdGVtU2l6ZTsgaisrKSB7XG4gICAgICBhdHRyaWJ1dGUuYXJyYXlbb2Zmc2V0KytdID0gZGF0YVtqXTtcbiAgICB9XG4gIH1cbn07XG5cbmV4cG9ydCB7IE1vZGVsQnVmZmVyR2VvbWV0cnkgfTtcbiIsImltcG9ydCB7IEJ1ZmZlckdlb21ldHJ5LCBCdWZmZXJBdHRyaWJ1dGUgfSBmcm9tICd0aHJlZSc7XG5cbi8qKlxuICogQSBUSFJFRS5CdWZmZXJHZW9tZXRyeSBjb25zaXN0cyBvZiBwb2ludHMuXG4gKiBAcGFyYW0ge051bWJlcn0gY291bnQgVGhlIG51bWJlciBvZiBwb2ludHMuXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gUG9pbnRCdWZmZXJHZW9tZXRyeShjb3VudCkge1xuICBCdWZmZXJHZW9tZXRyeS5jYWxsKHRoaXMpO1xuXG4gIC8qKlxuICAgKiBOdW1iZXIgb2YgcG9pbnRzLlxuICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgKi9cbiAgdGhpcy5wb2ludENvdW50ID0gY291bnQ7XG5cbiAgdGhpcy5idWZmZXJQb3NpdGlvbnMoKTtcbn1cblBvaW50QnVmZmVyR2VvbWV0cnkucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUpO1xuUG9pbnRCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBQb2ludEJ1ZmZlckdlb21ldHJ5O1xuXG5Qb2ludEJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5idWZmZXJQb3NpdGlvbnMgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5jcmVhdGVBdHRyaWJ1dGUoJ3Bvc2l0aW9uJywgMyk7XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBUSFJFRS5CdWZmZXJBdHRyaWJ1dGUgb24gdGhpcyBnZW9tZXRyeSBpbnN0YW5jZS5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZSBOYW1lIG9mIHRoZSBhdHRyaWJ1dGUuXG4gKiBAcGFyYW0ge051bWJlcn0gaXRlbVNpemUgTnVtYmVyIG9mIGZsb2F0cyBwZXIgdmVydGV4ICh0eXBpY2FsbHkgMSwgMiwgMyBvciA0KS5cbiAqIEBwYXJhbSB7ZnVuY3Rpb249fSBmYWN0b3J5IEZ1bmN0aW9uIHRoYXQgd2lsbCBiZSBjYWxsZWQgZm9yIGVhY2ggcG9pbnQgdXBvbiBjcmVhdGlvbi4gQWNjZXB0cyAzIGFyZ3VtZW50czogZGF0YVtdLCBpbmRleCBhbmQgcHJlZmFiQ291bnQuIENhbGxzIHNldFBvaW50RGF0YS5cbiAqXG4gKiBAcmV0dXJucyB7VEhSRUUuQnVmZmVyQXR0cmlidXRlfVxuICovXG5Qb2ludEJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5jcmVhdGVBdHRyaWJ1dGUgPSBmdW5jdGlvbihuYW1lLCBpdGVtU2l6ZSwgZmFjdG9yeSkge1xuICBjb25zdCBidWZmZXIgPSBuZXcgRmxvYXQzMkFycmF5KHRoaXMucG9pbnRDb3VudCAqIGl0ZW1TaXplKTtcbiAgY29uc3QgYXR0cmlidXRlID0gbmV3IEJ1ZmZlckF0dHJpYnV0ZShidWZmZXIsIGl0ZW1TaXplKTtcblxuICB0aGlzLmFkZEF0dHJpYnV0ZShuYW1lLCBhdHRyaWJ1dGUpO1xuXG4gIGlmIChmYWN0b3J5KSB7XG4gICAgY29uc3QgZGF0YSA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5wb2ludENvdW50OyBpKyspIHtcbiAgICAgIGZhY3RvcnkoZGF0YSwgaSwgdGhpcy5wb2ludENvdW50KTtcbiAgICAgIHRoaXMuc2V0UG9pbnREYXRhKGF0dHJpYnV0ZSwgaSwgZGF0YSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGF0dHJpYnV0ZTtcbn07XG5cblBvaW50QnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLnNldFBvaW50RGF0YSA9IGZ1bmN0aW9uKGF0dHJpYnV0ZSwgcG9pbnRJbmRleCwgZGF0YSkge1xuICBhdHRyaWJ1dGUgPSAodHlwZW9mIGF0dHJpYnV0ZSA9PT0gJ3N0cmluZycpID8gdGhpcy5hdHRyaWJ1dGVzW2F0dHJpYnV0ZV0gOiBhdHRyaWJ1dGU7XG5cbiAgbGV0IG9mZnNldCA9IHBvaW50SW5kZXggKiBhdHRyaWJ1dGUuaXRlbVNpemU7XG5cbiAgZm9yIChsZXQgaiA9IDA7IGogPCBhdHRyaWJ1dGUuaXRlbVNpemU7IGorKykge1xuICAgIGF0dHJpYnV0ZS5hcnJheVtvZmZzZXQrK10gPSBkYXRhW2pdO1xuICB9XG59O1xuXG5leHBvcnQgeyBQb2ludEJ1ZmZlckdlb21ldHJ5IH07XG4iLCIvLyBnZW5lcmF0ZWQgYnkgc2NyaXB0cy9idWlsZF9zaGFkZXJfY2h1bmtzLmpzXG5cbmltcG9ydCBjYXRtdWxsX3JvbV9zcGxpbmUgZnJvbSAnLi9nbHNsL2NhdG11bGxfcm9tX3NwbGluZS5nbHNsJztcbmltcG9ydCBjdWJpY19iZXppZXIgZnJvbSAnLi9nbHNsL2N1YmljX2Jlemllci5nbHNsJztcbmltcG9ydCBlYXNlX2JhY2tfaW4gZnJvbSAnLi9nbHNsL2Vhc2VfYmFja19pbi5nbHNsJztcbmltcG9ydCBlYXNlX2JhY2tfaW5fb3V0IGZyb20gJy4vZ2xzbC9lYXNlX2JhY2tfaW5fb3V0Lmdsc2wnO1xuaW1wb3J0IGVhc2VfYmFja19vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfYmFja19vdXQuZ2xzbCc7XG5pbXBvcnQgZWFzZV9iZXppZXIgZnJvbSAnLi9nbHNsL2Vhc2VfYmV6aWVyLmdsc2wnO1xuaW1wb3J0IGVhc2VfYm91bmNlX2luIGZyb20gJy4vZ2xzbC9lYXNlX2JvdW5jZV9pbi5nbHNsJztcbmltcG9ydCBlYXNlX2JvdW5jZV9pbl9vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfYm91bmNlX2luX291dC5nbHNsJztcbmltcG9ydCBlYXNlX2JvdW5jZV9vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfYm91bmNlX291dC5nbHNsJztcbmltcG9ydCBlYXNlX2NpcmNfaW4gZnJvbSAnLi9nbHNsL2Vhc2VfY2lyY19pbi5nbHNsJztcbmltcG9ydCBlYXNlX2NpcmNfaW5fb3V0IGZyb20gJy4vZ2xzbC9lYXNlX2NpcmNfaW5fb3V0Lmdsc2wnO1xuaW1wb3J0IGVhc2VfY2lyY19vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfY2lyY19vdXQuZ2xzbCc7XG5pbXBvcnQgZWFzZV9jdWJpY19pbiBmcm9tICcuL2dsc2wvZWFzZV9jdWJpY19pbi5nbHNsJztcbmltcG9ydCBlYXNlX2N1YmljX2luX291dCBmcm9tICcuL2dsc2wvZWFzZV9jdWJpY19pbl9vdXQuZ2xzbCc7XG5pbXBvcnQgZWFzZV9jdWJpY19vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfY3ViaWNfb3V0Lmdsc2wnO1xuaW1wb3J0IGVhc2VfZWxhc3RpY19pbiBmcm9tICcuL2dsc2wvZWFzZV9lbGFzdGljX2luLmdsc2wnO1xuaW1wb3J0IGVhc2VfZWxhc3RpY19pbl9vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfZWxhc3RpY19pbl9vdXQuZ2xzbCc7XG5pbXBvcnQgZWFzZV9lbGFzdGljX291dCBmcm9tICcuL2dsc2wvZWFzZV9lbGFzdGljX291dC5nbHNsJztcbmltcG9ydCBlYXNlX2V4cG9faW4gZnJvbSAnLi9nbHNsL2Vhc2VfZXhwb19pbi5nbHNsJztcbmltcG9ydCBlYXNlX2V4cG9faW5fb3V0IGZyb20gJy4vZ2xzbC9lYXNlX2V4cG9faW5fb3V0Lmdsc2wnO1xuaW1wb3J0IGVhc2VfZXhwb19vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfZXhwb19vdXQuZ2xzbCc7XG5pbXBvcnQgZWFzZV9xdWFkX2luIGZyb20gJy4vZ2xzbC9lYXNlX3F1YWRfaW4uZ2xzbCc7XG5pbXBvcnQgZWFzZV9xdWFkX2luX291dCBmcm9tICcuL2dsc2wvZWFzZV9xdWFkX2luX291dC5nbHNsJztcbmltcG9ydCBlYXNlX3F1YWRfb3V0IGZyb20gJy4vZ2xzbC9lYXNlX3F1YWRfb3V0Lmdsc2wnO1xuaW1wb3J0IGVhc2VfcXVhcnRfaW4gZnJvbSAnLi9nbHNsL2Vhc2VfcXVhcnRfaW4uZ2xzbCc7XG5pbXBvcnQgZWFzZV9xdWFydF9pbl9vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfcXVhcnRfaW5fb3V0Lmdsc2wnO1xuaW1wb3J0IGVhc2VfcXVhcnRfb3V0IGZyb20gJy4vZ2xzbC9lYXNlX3F1YXJ0X291dC5nbHNsJztcbmltcG9ydCBlYXNlX3F1aW50X2luIGZyb20gJy4vZ2xzbC9lYXNlX3F1aW50X2luLmdsc2wnO1xuaW1wb3J0IGVhc2VfcXVpbnRfaW5fb3V0IGZyb20gJy4vZ2xzbC9lYXNlX3F1aW50X2luX291dC5nbHNsJztcbmltcG9ydCBlYXNlX3F1aW50X291dCBmcm9tICcuL2dsc2wvZWFzZV9xdWludF9vdXQuZ2xzbCc7XG5pbXBvcnQgZWFzZV9zaW5lX2luIGZyb20gJy4vZ2xzbC9lYXNlX3NpbmVfaW4uZ2xzbCc7XG5pbXBvcnQgZWFzZV9zaW5lX2luX291dCBmcm9tICcuL2dsc2wvZWFzZV9zaW5lX2luX291dC5nbHNsJztcbmltcG9ydCBlYXNlX3NpbmVfb3V0IGZyb20gJy4vZ2xzbC9lYXNlX3NpbmVfb3V0Lmdsc2wnO1xuaW1wb3J0IHF1YXRlcm5pb25fcm90YXRpb24gZnJvbSAnLi9nbHNsL3F1YXRlcm5pb25fcm90YXRpb24uZ2xzbCc7XG5pbXBvcnQgcXVhdGVybmlvbl9zbGVycCBmcm9tICcuL2dsc2wvcXVhdGVybmlvbl9zbGVycC5nbHNsJztcblxuXG5leHBvcnQgY29uc3QgU2hhZGVyQ2h1bmsgPSB7XG4gIGNhdG11bGxfcm9tX3NwbGluZTogY2F0bXVsbF9yb21fc3BsaW5lLFxuICBjdWJpY19iZXppZXI6IGN1YmljX2JlemllcixcbiAgZWFzZV9iYWNrX2luOiBlYXNlX2JhY2tfaW4sXG4gIGVhc2VfYmFja19pbl9vdXQ6IGVhc2VfYmFja19pbl9vdXQsXG4gIGVhc2VfYmFja19vdXQ6IGVhc2VfYmFja19vdXQsXG4gIGVhc2VfYmV6aWVyOiBlYXNlX2JlemllcixcbiAgZWFzZV9ib3VuY2VfaW46IGVhc2VfYm91bmNlX2luLFxuICBlYXNlX2JvdW5jZV9pbl9vdXQ6IGVhc2VfYm91bmNlX2luX291dCxcbiAgZWFzZV9ib3VuY2Vfb3V0OiBlYXNlX2JvdW5jZV9vdXQsXG4gIGVhc2VfY2lyY19pbjogZWFzZV9jaXJjX2luLFxuICBlYXNlX2NpcmNfaW5fb3V0OiBlYXNlX2NpcmNfaW5fb3V0LFxuICBlYXNlX2NpcmNfb3V0OiBlYXNlX2NpcmNfb3V0LFxuICBlYXNlX2N1YmljX2luOiBlYXNlX2N1YmljX2luLFxuICBlYXNlX2N1YmljX2luX291dDogZWFzZV9jdWJpY19pbl9vdXQsXG4gIGVhc2VfY3ViaWNfb3V0OiBlYXNlX2N1YmljX291dCxcbiAgZWFzZV9lbGFzdGljX2luOiBlYXNlX2VsYXN0aWNfaW4sXG4gIGVhc2VfZWxhc3RpY19pbl9vdXQ6IGVhc2VfZWxhc3RpY19pbl9vdXQsXG4gIGVhc2VfZWxhc3RpY19vdXQ6IGVhc2VfZWxhc3RpY19vdXQsXG4gIGVhc2VfZXhwb19pbjogZWFzZV9leHBvX2luLFxuICBlYXNlX2V4cG9faW5fb3V0OiBlYXNlX2V4cG9faW5fb3V0LFxuICBlYXNlX2V4cG9fb3V0OiBlYXNlX2V4cG9fb3V0LFxuICBlYXNlX3F1YWRfaW46IGVhc2VfcXVhZF9pbixcbiAgZWFzZV9xdWFkX2luX291dDogZWFzZV9xdWFkX2luX291dCxcbiAgZWFzZV9xdWFkX291dDogZWFzZV9xdWFkX291dCxcbiAgZWFzZV9xdWFydF9pbjogZWFzZV9xdWFydF9pbixcbiAgZWFzZV9xdWFydF9pbl9vdXQ6IGVhc2VfcXVhcnRfaW5fb3V0LFxuICBlYXNlX3F1YXJ0X291dDogZWFzZV9xdWFydF9vdXQsXG4gIGVhc2VfcXVpbnRfaW46IGVhc2VfcXVpbnRfaW4sXG4gIGVhc2VfcXVpbnRfaW5fb3V0OiBlYXNlX3F1aW50X2luX291dCxcbiAgZWFzZV9xdWludF9vdXQ6IGVhc2VfcXVpbnRfb3V0LFxuICBlYXNlX3NpbmVfaW46IGVhc2Vfc2luZV9pbixcbiAgZWFzZV9zaW5lX2luX291dDogZWFzZV9zaW5lX2luX291dCxcbiAgZWFzZV9zaW5lX291dDogZWFzZV9zaW5lX291dCxcbiAgcXVhdGVybmlvbl9yb3RhdGlvbjogcXVhdGVybmlvbl9yb3RhdGlvbixcbiAgcXVhdGVybmlvbl9zbGVycDogcXVhdGVybmlvbl9zbGVycCxcblxufTtcblxuIiwiLyoqXG4gKiBBIHRpbWVsaW5lIHRyYW5zaXRpb24gc2VnbWVudC4gQW4gaW5zdGFuY2Ugb2YgdGhpcyBjbGFzcyBpcyBjcmVhdGVkIGludGVybmFsbHkgd2hlbiBjYWxsaW5nIHtAbGluayBUSFJFRS5CQVMuVGltZWxpbmUuYWRkfSwgc28geW91IHNob3VsZCBub3QgdXNlIHRoaXMgY2xhc3MgZGlyZWN0bHkuXG4gKiBUaGUgaW5zdGFuY2UgaXMgYWxzbyBwYXNzZWQgdGhlIHRoZSBjb21waWxlciBmdW5jdGlvbiBpZiB5b3UgcmVnaXN0ZXIgYSB0cmFuc2l0aW9uIHRocm91Z2gge0BsaW5rIFRIUkVFLkJBUy5UaW1lbGluZS5yZWdpc3Rlcn0uIFRoZXJlIHlvdSBjYW4gdXNlIHRoZSBwdWJsaWMgcHJvcGVydGllcyBvZiB0aGUgc2VnbWVudCB0byBjb21waWxlIHRoZSBnbHNsIHN0cmluZy5cbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgQSBzdHJpbmcga2V5IGdlbmVyYXRlZCBieSB0aGUgdGltZWxpbmUgdG8gd2hpY2ggdGhpcyBzZWdtZW50IGJlbG9uZ3MuIEtleXMgYXJlIHVuaXF1ZS5cbiAqIEBwYXJhbSB7bnVtYmVyfSBzdGFydCBTdGFydCB0aW1lIG9mIHRoaXMgc2VnbWVudCBpbiBhIHRpbWVsaW5lIGluIHNlY29uZHMuXG4gKiBAcGFyYW0ge251bWJlcn0gZHVyYXRpb24gRHVyYXRpb24gb2YgdGhpcyBzZWdtZW50IGluIHNlY29uZHMuXG4gKiBAcGFyYW0ge29iamVjdH0gdHJhbnNpdGlvbiBPYmplY3QgZGVzY3JpYmluZyB0aGUgdHJhbnNpdGlvbi5cbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGNvbXBpbGVyIEEgcmVmZXJlbmNlIHRvIHRoZSBjb21waWxlciBmdW5jdGlvbiBmcm9tIGEgdHJhbnNpdGlvbiBkZWZpbml0aW9uLlxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIFRpbWVsaW5lU2VnbWVudChrZXksIHN0YXJ0LCBkdXJhdGlvbiwgdHJhbnNpdGlvbiwgY29tcGlsZXIpIHtcbiAgdGhpcy5rZXkgPSBrZXk7XG4gIHRoaXMuc3RhcnQgPSBzdGFydDtcbiAgdGhpcy5kdXJhdGlvbiA9IGR1cmF0aW9uO1xuICB0aGlzLnRyYW5zaXRpb24gPSB0cmFuc2l0aW9uO1xuICB0aGlzLmNvbXBpbGVyID0gY29tcGlsZXI7XG5cbiAgdGhpcy50cmFpbCA9IDA7XG59XG5cblRpbWVsaW5lU2VnbWVudC5wcm90b3R5cGUuY29tcGlsZSA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy5jb21waWxlcih0aGlzKTtcbn07XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShUaW1lbGluZVNlZ21lbnQucHJvdG90eXBlLCAnZW5kJywge1xuICBnZXQ6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLnN0YXJ0ICsgdGhpcy5kdXJhdGlvbjtcbiAgfVxufSk7XG5cbmV4cG9ydCB7IFRpbWVsaW5lU2VnbWVudCB9O1xuIiwiaW1wb3J0IHsgVGltZWxpbmVTZWdtZW50IH0gZnJvbSAnLi9UaW1lbGluZVNlZ21lbnQnO1xuXG4vKipcbiAqIEEgdXRpbGl0eSBjbGFzcyB0byBjcmVhdGUgYW4gYW5pbWF0aW9uIHRpbWVsaW5lIHdoaWNoIGNhbiBiZSBiYWtlZCBpbnRvIGEgKHZlcnRleCkgc2hhZGVyLlxuICogQnkgZGVmYXVsdCB0aGUgdGltZWxpbmUgc3VwcG9ydHMgdHJhbnNsYXRpb24sIHNjYWxlIGFuZCByb3RhdGlvbi4gVGhpcyBjYW4gYmUgZXh0ZW5kZWQgb3Igb3ZlcnJpZGRlbi5cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBUaW1lbGluZSgpIHtcbiAgLyoqXG4gICAqIFRoZSB0b3RhbCBkdXJhdGlvbiBvZiB0aGUgdGltZWxpbmUgaW4gc2Vjb25kcy5cbiAgICogQHR5cGUge251bWJlcn1cbiAgICovXG4gIHRoaXMuZHVyYXRpb24gPSAwO1xuXG4gIC8qKlxuICAgKiBUaGUgbmFtZSBvZiB0aGUgdmFsdWUgdGhhdCBzZWdtZW50cyB3aWxsIHVzZSB0byByZWFkIHRoZSB0aW1lLiBEZWZhdWx0cyB0byAndFRpbWUnLlxuICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgKi9cbiAgdGhpcy50aW1lS2V5ID0gJ3RUaW1lJztcblxuICB0aGlzLnNlZ21lbnRzID0ge307XG4gIHRoaXMuX19rZXkgPSAwO1xufVxuXG4vLyBzdGF0aWMgZGVmaW5pdGlvbnMgbWFwXG5UaW1lbGluZS5zZWdtZW50RGVmaW5pdGlvbnMgPSB7fTtcblxuLyoqXG4gKiBSZWdpc3RlcnMgYSB0cmFuc2l0aW9uIGRlZmluaXRpb24gZm9yIHVzZSB3aXRoIHtAbGluayBUSFJFRS5CQVMuVGltZWxpbmUuYWRkfS5cbiAqIEBwYXJhbSB7U3RyaW5nfSBrZXkgTmFtZSBvZiB0aGUgdHJhbnNpdGlvbi4gRGVmYXVsdHMgaW5jbHVkZSAnc2NhbGUnLCAncm90YXRlJyBhbmQgJ3RyYW5zbGF0ZScuXG4gKiBAcGFyYW0ge09iamVjdH0gZGVmaW5pdGlvblxuICogQHBhcmFtIHtGdW5jdGlvbn0gZGVmaW5pdGlvbi5jb21waWxlciBBIGZ1bmN0aW9uIHRoYXQgZ2VuZXJhdGVzIGEgZ2xzbCBzdHJpbmcgZm9yIGEgdHJhbnNpdGlvbiBzZWdtZW50LiBBY2NlcHRzIGEgVEhSRUUuQkFTLlRpbWVsaW5lU2VnbWVudCBhcyB0aGUgc29sZSBhcmd1bWVudC5cbiAqIEBwYXJhbSB7Kn0gZGVmaW5pdGlvbi5kZWZhdWx0RnJvbSBUaGUgaW5pdGlhbCB2YWx1ZSBmb3IgYSB0cmFuc2Zvcm0uZnJvbS4gRm9yIGV4YW1wbGUsIHRoZSBkZWZhdWx0RnJvbSBmb3IgYSB0cmFuc2xhdGlvbiBpcyBUSFJFRS5WZWN0b3IzKDAsIDAsIDApLlxuICogQHN0YXRpY1xuICovXG5UaW1lbGluZS5yZWdpc3RlciA9IGZ1bmN0aW9uKGtleSwgZGVmaW5pdGlvbikge1xuICBUaW1lbGluZS5zZWdtZW50RGVmaW5pdGlvbnNba2V5XSA9IGRlZmluaXRpb247XG4gIFxuICByZXR1cm4gZGVmaW5pdGlvbjtcbn07XG5cbi8qKlxuICogQWRkIGEgdHJhbnNpdGlvbiB0byB0aGUgdGltZWxpbmUuXG4gKiBAcGFyYW0ge251bWJlcn0gZHVyYXRpb24gRHVyYXRpb24gaW4gc2Vjb25kc1xuICogQHBhcmFtIHtvYmplY3R9IHRyYW5zaXRpb25zIEFuIG9iamVjdCBjb250YWluaW5nIG9uZSBvciBzZXZlcmFsIHRyYW5zaXRpb25zLiBUaGUga2V5cyBzaG91bGQgbWF0Y2ggdHJhbnNmb3JtIGRlZmluaXRpb25zLlxuICogVGhlIHRyYW5zaXRpb24gb2JqZWN0IGZvciBlYWNoIGtleSB3aWxsIGJlIHBhc3NlZCB0byB0aGUgbWF0Y2hpbmcgZGVmaW5pdGlvbidzIGNvbXBpbGVyLiBJdCBjYW4gaGF2ZSBhcmJpdHJhcnkgcHJvcGVydGllcywgYnV0IHRoZSBUaW1lbGluZSBleHBlY3RzIGF0IGxlYXN0IGEgJ3RvJywgJ2Zyb20nIGFuZCBhbiBvcHRpb25hbCAnZWFzZScuXG4gKiBAcGFyYW0ge251bWJlcnxzdHJpbmd9IFtwb3NpdGlvbk9mZnNldF0gUG9zaXRpb24gaW4gdGhlIHRpbWVsaW5lLiBEZWZhdWx0cyB0byB0aGUgZW5kIG9mIHRoZSB0aW1lbGluZS4gSWYgYSBudW1iZXIgaXMgcHJvdmlkZWQsIHRoZSB0cmFuc2l0aW9uIHdpbGwgYmUgaW5zZXJ0ZWQgYXQgdGhhdCB0aW1lIGluIHNlY29uZHMuIFN0cmluZ3MgKCcrPXgnIG9yICctPXgnKSBjYW4gYmUgdXNlZCBmb3IgYSB2YWx1ZSByZWxhdGl2ZSB0byB0aGUgZW5kIG9mIHRpbWVsaW5lLlxuICovXG5UaW1lbGluZS5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24oZHVyYXRpb24sIHRyYW5zaXRpb25zLCBwb3NpdGlvbk9mZnNldCkge1xuICAvLyBzdG9wIHJvbGx1cCBmcm9tIGNvbXBsYWluaW5nIGFib3V0IGV2YWxcbiAgY29uc3QgX2V2YWwgPSBldmFsO1xuICBcbiAgbGV0IHN0YXJ0ID0gdGhpcy5kdXJhdGlvbjtcblxuICBpZiAocG9zaXRpb25PZmZzZXQgIT09IHVuZGVmaW5lZCkge1xuICAgIGlmICh0eXBlb2YgcG9zaXRpb25PZmZzZXQgPT09ICdudW1iZXInKSB7XG4gICAgICBzdGFydCA9IHBvc2l0aW9uT2Zmc2V0O1xuICAgIH1cbiAgICBlbHNlIGlmICh0eXBlb2YgcG9zaXRpb25PZmZzZXQgPT09ICdzdHJpbmcnKSB7XG4gICAgICBfZXZhbCgnc3RhcnQnICsgcG9zaXRpb25PZmZzZXQpO1xuICAgIH1cblxuICAgIHRoaXMuZHVyYXRpb24gPSBNYXRoLm1heCh0aGlzLmR1cmF0aW9uLCBzdGFydCArIGR1cmF0aW9uKTtcbiAgfVxuICBlbHNlIHtcbiAgICB0aGlzLmR1cmF0aW9uICs9IGR1cmF0aW9uO1xuICB9XG5cbiAgbGV0IGtleXMgPSBPYmplY3Qua2V5cyh0cmFuc2l0aW9ucyksIGtleTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyBpKyspIHtcbiAgICBrZXkgPSBrZXlzW2ldO1xuXG4gICAgdGhpcy5wcm9jZXNzVHJhbnNpdGlvbihrZXksIHRyYW5zaXRpb25zW2tleV0sIHN0YXJ0LCBkdXJhdGlvbik7XG4gIH1cbn07XG5cblRpbWVsaW5lLnByb3RvdHlwZS5wcm9jZXNzVHJhbnNpdGlvbiA9IGZ1bmN0aW9uKGtleSwgdHJhbnNpdGlvbiwgc3RhcnQsIGR1cmF0aW9uKSB7XG4gIGNvbnN0IGRlZmluaXRpb24gPSBUaW1lbGluZS5zZWdtZW50RGVmaW5pdGlvbnNba2V5XTtcblxuICBsZXQgc2VnbWVudHMgPSB0aGlzLnNlZ21lbnRzW2tleV07XG4gIGlmICghc2VnbWVudHMpIHNlZ21lbnRzID0gdGhpcy5zZWdtZW50c1trZXldID0gW107XG5cbiAgaWYgKHRyYW5zaXRpb24uZnJvbSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgaWYgKHNlZ21lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgdHJhbnNpdGlvbi5mcm9tID0gZGVmaW5pdGlvbi5kZWZhdWx0RnJvbTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICB0cmFuc2l0aW9uLmZyb20gPSBzZWdtZW50c1tzZWdtZW50cy5sZW5ndGggLSAxXS50cmFuc2l0aW9uLnRvO1xuICAgIH1cbiAgfVxuXG4gIHNlZ21lbnRzLnB1c2gobmV3IFRpbWVsaW5lU2VnbWVudCgodGhpcy5fX2tleSsrKS50b1N0cmluZygpLCBzdGFydCwgZHVyYXRpb24sIHRyYW5zaXRpb24sIGRlZmluaXRpb24uY29tcGlsZXIpKTtcbn07XG5cbi8qKlxuICogQ29tcGlsZXMgdGhlIHRpbWVsaW5lIGludG8gYSBnbHNsIHN0cmluZyBhcnJheSB0aGF0IGNhbiBiZSBpbmplY3RlZCBpbnRvIGEgKHZlcnRleCkgc2hhZGVyLlxuICogQHJldHVybnMge0FycmF5fVxuICovXG5UaW1lbGluZS5wcm90b3R5cGUuY29tcGlsZSA9IGZ1bmN0aW9uKCkge1xuICBjb25zdCBjID0gW107XG5cbiAgY29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKHRoaXMuc2VnbWVudHMpO1xuICBsZXQgc2VnbWVudHM7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgaSsrKSB7XG4gICAgc2VnbWVudHMgPSB0aGlzLnNlZ21lbnRzW2tleXNbaV1dO1xuXG4gICAgdGhpcy5maWxsR2FwcyhzZWdtZW50cyk7XG5cbiAgICBzZWdtZW50cy5mb3JFYWNoKGZ1bmN0aW9uKHMpIHtcbiAgICAgIGMucHVzaChzLmNvbXBpbGUoKSk7XG4gICAgfSk7XG4gIH1cblxuICByZXR1cm4gYztcbn07XG5UaW1lbGluZS5wcm90b3R5cGUuZmlsbEdhcHMgPSBmdW5jdGlvbihzZWdtZW50cykge1xuICBpZiAoc2VnbWVudHMubGVuZ3RoID09PSAwKSByZXR1cm47XG5cbiAgbGV0IHMwLCBzMTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IHNlZ21lbnRzLmxlbmd0aCAtIDE7IGkrKykge1xuICAgIHMwID0gc2VnbWVudHNbaV07XG4gICAgczEgPSBzZWdtZW50c1tpICsgMV07XG5cbiAgICBzMC50cmFpbCA9IHMxLnN0YXJ0IC0gczAuZW5kO1xuICB9XG5cbiAgLy8gcGFkIGxhc3Qgc2VnbWVudCB1bnRpbCBlbmQgb2YgdGltZWxpbmVcbiAgczAgPSBzZWdtZW50c1tzZWdtZW50cy5sZW5ndGggLSAxXTtcbiAgczAudHJhaWwgPSB0aGlzLmR1cmF0aW9uIC0gczAuZW5kO1xufTtcblxuLyoqXG4gKiBHZXQgYSBjb21waWxlZCBnbHNsIHN0cmluZyB3aXRoIGNhbGxzIHRvIHRyYW5zZm9ybSBmdW5jdGlvbnMgZm9yIGEgZ2l2ZW4ga2V5LlxuICogVGhlIG9yZGVyIGluIHdoaWNoIHRoZXNlIHRyYW5zaXRpb25zIGFyZSBhcHBsaWVkIG1hdHRlcnMgYmVjYXVzZSB0aGV5IGFsbCBvcGVyYXRlIG9uIHRoZSBzYW1lIHZhbHVlLlxuICogQHBhcmFtIHtzdHJpbmd9IGtleSBBIGtleSBtYXRjaGluZyBhIHRyYW5zZm9ybSBkZWZpbml0aW9uLlxuICogQHJldHVybnMge3N0cmluZ31cbiAqL1xuVGltZWxpbmUucHJvdG90eXBlLmdldFRyYW5zZm9ybUNhbGxzID0gZnVuY3Rpb24oa2V5KSB7XG4gIGxldCB0ID0gdGhpcy50aW1lS2V5O1xuXG4gIHJldHVybiB0aGlzLnNlZ21lbnRzW2tleV0gPyAgdGhpcy5zZWdtZW50c1trZXldLm1hcChmdW5jdGlvbihzKSB7XG4gICAgcmV0dXJuIGBhcHBseVRyYW5zZm9ybSR7cy5rZXl9KCR7dH0sIHRyYW5zZm9ybWVkKTtgO1xuICB9KS5qb2luKCdcXG4nKSA6ICcnO1xufTtcblxuZXhwb3J0IHsgVGltZWxpbmUgfVxuIiwiY29uc3QgVGltZWxpbmVDaHVua3MgPSB7XG4gIHZlYzM6IGZ1bmN0aW9uKG4sIHYsIHApIHtcbiAgICBjb25zdCB4ID0gKHYueCB8fCAwKS50b1ByZWNpc2lvbihwKTtcbiAgICBjb25zdCB5ID0gKHYueSB8fCAwKS50b1ByZWNpc2lvbihwKTtcbiAgICBjb25zdCB6ID0gKHYueiB8fCAwKS50b1ByZWNpc2lvbihwKTtcblxuICAgIHJldHVybiBgdmVjMyAke259ID0gdmVjMygke3h9LCAke3l9LCAke3p9KTtgO1xuICB9LFxuICB2ZWM0OiBmdW5jdGlvbihuLCB2LCBwKSB7XG4gICAgY29uc3QgeCA9ICh2LnggfHwgMCkudG9QcmVjaXNpb24ocCk7XG4gICAgY29uc3QgeSA9ICh2LnkgfHwgMCkudG9QcmVjaXNpb24ocCk7XG4gICAgY29uc3QgeiA9ICh2LnogfHwgMCkudG9QcmVjaXNpb24ocCk7XG4gICAgY29uc3QgdyA9ICh2LncgfHwgMCkudG9QcmVjaXNpb24ocCk7XG4gIFxuICAgIHJldHVybiBgdmVjNCAke259ID0gdmVjNCgke3h9LCAke3l9LCAke3p9LCAke3d9KTtgO1xuICB9LFxuICBkZWxheUR1cmF0aW9uOiBmdW5jdGlvbihzZWdtZW50KSB7XG4gICAgcmV0dXJuIGBcbiAgICBmbG9hdCBjRGVsYXkke3NlZ21lbnQua2V5fSA9ICR7c2VnbWVudC5zdGFydC50b1ByZWNpc2lvbig0KX07XG4gICAgZmxvYXQgY0R1cmF0aW9uJHtzZWdtZW50LmtleX0gPSAke3NlZ21lbnQuZHVyYXRpb24udG9QcmVjaXNpb24oNCl9O1xuICAgIGA7XG4gIH0sXG4gIHByb2dyZXNzOiBmdW5jdGlvbihzZWdtZW50KSB7XG4gICAgLy8gemVybyBkdXJhdGlvbiBzZWdtZW50cyBzaG91bGQgYWx3YXlzIHJlbmRlciBjb21wbGV0ZVxuICAgIGlmIChzZWdtZW50LmR1cmF0aW9uID09PSAwKSB7XG4gICAgICByZXR1cm4gYGZsb2F0IHByb2dyZXNzID0gMS4wO2BcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICByZXR1cm4gYFxuICAgICAgZmxvYXQgcHJvZ3Jlc3MgPSBjbGFtcCh0aW1lIC0gY0RlbGF5JHtzZWdtZW50LmtleX0sIDAuMCwgY0R1cmF0aW9uJHtzZWdtZW50LmtleX0pIC8gY0R1cmF0aW9uJHtzZWdtZW50LmtleX07XG4gICAgICAke3NlZ21lbnQudHJhbnNpdGlvbi5lYXNlID8gYHByb2dyZXNzID0gJHtzZWdtZW50LnRyYW5zaXRpb24uZWFzZX0ocHJvZ3Jlc3MkeyhzZWdtZW50LnRyYW5zaXRpb24uZWFzZVBhcmFtcyA/IGAsICR7c2VnbWVudC50cmFuc2l0aW9uLmVhc2VQYXJhbXMubWFwKCh2KSA9PiB2LnRvUHJlY2lzaW9uKDQpKS5qb2luKGAsIGApfWAgOiBgYCl9KTtgIDogYGB9XG4gICAgICBgO1xuICAgIH1cbiAgfSxcbiAgcmVuZGVyQ2hlY2s6IGZ1bmN0aW9uKHNlZ21lbnQpIHtcbiAgICBjb25zdCBzdGFydFRpbWUgPSBzZWdtZW50LnN0YXJ0LnRvUHJlY2lzaW9uKDQpO1xuICAgIGNvbnN0IGVuZFRpbWUgPSAoc2VnbWVudC5lbmQgKyBzZWdtZW50LnRyYWlsKS50b1ByZWNpc2lvbig0KTtcblxuICAgIHJldHVybiBgaWYgKHRpbWUgPCAke3N0YXJ0VGltZX0gfHwgdGltZSA+ICR7ZW5kVGltZX0pIHJldHVybjtgO1xuICB9XG59O1xuXG5leHBvcnQgeyBUaW1lbGluZUNodW5rcyB9O1xuIiwiaW1wb3J0IHsgVGltZWxpbmUgfSBmcm9tICcuL1RpbWVsaW5lJztcbmltcG9ydCB7IFRpbWVsaW5lQ2h1bmtzIH0gZnJvbSAnLi9UaW1lbGluZUNodW5rcyc7XG5pbXBvcnQgeyBWZWN0b3IzIH0gZnJvbSAndGhyZWUnO1xuXG5jb25zdCBUcmFuc2xhdGlvblNlZ21lbnQgPSB7XG4gIGNvbXBpbGVyOiBmdW5jdGlvbihzZWdtZW50KSB7XG4gICAgcmV0dXJuIGBcbiAgICAke1RpbWVsaW5lQ2h1bmtzLmRlbGF5RHVyYXRpb24oc2VnbWVudCl9XG4gICAgJHtUaW1lbGluZUNodW5rcy52ZWMzKGBjVHJhbnNsYXRlRnJvbSR7c2VnbWVudC5rZXl9YCwgc2VnbWVudC50cmFuc2l0aW9uLmZyb20sIDIpfVxuICAgICR7VGltZWxpbmVDaHVua3MudmVjMyhgY1RyYW5zbGF0ZVRvJHtzZWdtZW50LmtleX1gLCBzZWdtZW50LnRyYW5zaXRpb24udG8sIDIpfVxuICAgIFxuICAgIHZvaWQgYXBwbHlUcmFuc2Zvcm0ke3NlZ21lbnQua2V5fShmbG9hdCB0aW1lLCBpbm91dCB2ZWMzIHYpIHtcbiAgICBcbiAgICAgICR7VGltZWxpbmVDaHVua3MucmVuZGVyQ2hlY2soc2VnbWVudCl9XG4gICAgICAke1RpbWVsaW5lQ2h1bmtzLnByb2dyZXNzKHNlZ21lbnQpfVxuICAgIFxuICAgICAgdiArPSBtaXgoY1RyYW5zbGF0ZUZyb20ke3NlZ21lbnQua2V5fSwgY1RyYW5zbGF0ZVRvJHtzZWdtZW50LmtleX0sIHByb2dyZXNzKTtcbiAgICB9XG4gICAgYDtcbiAgfSxcbiAgZGVmYXVsdEZyb206IG5ldyBWZWN0b3IzKDAsIDAsIDApXG59O1xuXG5UaW1lbGluZS5yZWdpc3RlcigndHJhbnNsYXRlJywgVHJhbnNsYXRpb25TZWdtZW50KTtcblxuZXhwb3J0IHsgVHJhbnNsYXRpb25TZWdtZW50IH07XG4iLCJpbXBvcnQgeyBUaW1lbGluZSB9IGZyb20gJy4vVGltZWxpbmUnO1xuaW1wb3J0IHsgVGltZWxpbmVDaHVua3MgfSBmcm9tICcuL1RpbWVsaW5lQ2h1bmtzJztcbmltcG9ydCB7IFZlY3RvcjMgfSBmcm9tICd0aHJlZSc7XG5cbmNvbnN0IFNjYWxlU2VnbWVudCA9IHtcbiAgY29tcGlsZXI6IGZ1bmN0aW9uKHNlZ21lbnQpIHtcbiAgICBjb25zdCBvcmlnaW4gPSBzZWdtZW50LnRyYW5zaXRpb24ub3JpZ2luO1xuICAgIFxuICAgIHJldHVybiBgXG4gICAgJHtUaW1lbGluZUNodW5rcy5kZWxheUR1cmF0aW9uKHNlZ21lbnQpfVxuICAgICR7VGltZWxpbmVDaHVua3MudmVjMyhgY1NjYWxlRnJvbSR7c2VnbWVudC5rZXl9YCwgc2VnbWVudC50cmFuc2l0aW9uLmZyb20sIDIpfVxuICAgICR7VGltZWxpbmVDaHVua3MudmVjMyhgY1NjYWxlVG8ke3NlZ21lbnQua2V5fWAsIHNlZ21lbnQudHJhbnNpdGlvbi50bywgMil9XG4gICAgJHtvcmlnaW4gPyBUaW1lbGluZUNodW5rcy52ZWMzKGBjT3JpZ2luJHtzZWdtZW50LmtleX1gLCBvcmlnaW4sIDIpIDogJyd9XG4gICAgXG4gICAgdm9pZCBhcHBseVRyYW5zZm9ybSR7c2VnbWVudC5rZXl9KGZsb2F0IHRpbWUsIGlub3V0IHZlYzMgdikge1xuICAgIFxuICAgICAgJHtUaW1lbGluZUNodW5rcy5yZW5kZXJDaGVjayhzZWdtZW50KX1cbiAgICAgICR7VGltZWxpbmVDaHVua3MucHJvZ3Jlc3Moc2VnbWVudCl9XG4gICAgXG4gICAgICAke29yaWdpbiA/IGB2IC09IGNPcmlnaW4ke3NlZ21lbnQua2V5fTtgIDogJyd9XG4gICAgICB2ICo9IG1peChjU2NhbGVGcm9tJHtzZWdtZW50LmtleX0sIGNTY2FsZVRvJHtzZWdtZW50LmtleX0sIHByb2dyZXNzKTtcbiAgICAgICR7b3JpZ2luID8gYHYgKz0gY09yaWdpbiR7c2VnbWVudC5rZXl9O2AgOiAnJ31cbiAgICB9XG4gICAgYDtcbiAgfSxcbiAgZGVmYXVsdEZyb206IG5ldyBWZWN0b3IzKDEsIDEsIDEpXG59O1xuXG5UaW1lbGluZS5yZWdpc3Rlcignc2NhbGUnLCBTY2FsZVNlZ21lbnQpO1xuXG5leHBvcnQgeyBTY2FsZVNlZ21lbnQgfTtcbiIsImltcG9ydCB7IFRpbWVsaW5lIH0gZnJvbSAnLi9UaW1lbGluZSc7XG5pbXBvcnQgeyBUaW1lbGluZUNodW5rcyB9IGZyb20gJy4vVGltZWxpbmVDaHVua3MnO1xuaW1wb3J0IHsgVmVjdG9yMywgVmVjdG9yNCB9IGZyb20gJ3RocmVlJztcblxuY29uc3QgUm90YXRpb25TZWdtZW50ID0ge1xuICBjb21waWxlcihzZWdtZW50KSB7XG4gICAgY29uc3QgZnJvbUF4aXNBbmdsZSA9IG5ldyBWZWN0b3I0KFxuICAgICAgc2VnbWVudC50cmFuc2l0aW9uLmZyb20uYXhpcy54LFxuICAgICAgc2VnbWVudC50cmFuc2l0aW9uLmZyb20uYXhpcy55LFxuICAgICAgc2VnbWVudC50cmFuc2l0aW9uLmZyb20uYXhpcy56LFxuICAgICAgc2VnbWVudC50cmFuc2l0aW9uLmZyb20uYW5nbGVcbiAgICApO1xuICBcbiAgICBjb25zdCB0b0F4aXMgPSBzZWdtZW50LnRyYW5zaXRpb24udG8uYXhpcyB8fCBzZWdtZW50LnRyYW5zaXRpb24uZnJvbS5heGlzO1xuICAgIGNvbnN0IHRvQXhpc0FuZ2xlID0gbmV3IFZlY3RvcjQoXG4gICAgICB0b0F4aXMueCxcbiAgICAgIHRvQXhpcy55LFxuICAgICAgdG9BeGlzLnosXG4gICAgICBzZWdtZW50LnRyYW5zaXRpb24udG8uYW5nbGVcbiAgICApO1xuICBcbiAgICBjb25zdCBvcmlnaW4gPSBzZWdtZW50LnRyYW5zaXRpb24ub3JpZ2luO1xuICAgIFxuICAgIHJldHVybiBgXG4gICAgJHtUaW1lbGluZUNodW5rcy5kZWxheUR1cmF0aW9uKHNlZ21lbnQpfVxuICAgICR7VGltZWxpbmVDaHVua3MudmVjNChgY1JvdGF0aW9uRnJvbSR7c2VnbWVudC5rZXl9YCwgZnJvbUF4aXNBbmdsZSwgOCl9XG4gICAgJHtUaW1lbGluZUNodW5rcy52ZWM0KGBjUm90YXRpb25UbyR7c2VnbWVudC5rZXl9YCwgdG9BeGlzQW5nbGUsIDgpfVxuICAgICR7b3JpZ2luID8gVGltZWxpbmVDaHVua3MudmVjMyhgY09yaWdpbiR7c2VnbWVudC5rZXl9YCwgb3JpZ2luLCAyKSA6ICcnfVxuICAgIFxuICAgIHZvaWQgYXBwbHlUcmFuc2Zvcm0ke3NlZ21lbnQua2V5fShmbG9hdCB0aW1lLCBpbm91dCB2ZWMzIHYpIHtcbiAgICAgICR7VGltZWxpbmVDaHVua3MucmVuZGVyQ2hlY2soc2VnbWVudCl9XG4gICAgICAke1RpbWVsaW5lQ2h1bmtzLnByb2dyZXNzKHNlZ21lbnQpfVxuXG4gICAgICAke29yaWdpbiA/IGB2IC09IGNPcmlnaW4ke3NlZ21lbnQua2V5fTtgIDogJyd9XG4gICAgICB2ZWMzIGF4aXMgPSBub3JtYWxpemUobWl4KGNSb3RhdGlvbkZyb20ke3NlZ21lbnQua2V5fS54eXosIGNSb3RhdGlvblRvJHtzZWdtZW50LmtleX0ueHl6LCBwcm9ncmVzcykpO1xuICAgICAgZmxvYXQgYW5nbGUgPSBtaXgoY1JvdGF0aW9uRnJvbSR7c2VnbWVudC5rZXl9LncsIGNSb3RhdGlvblRvJHtzZWdtZW50LmtleX0udywgcHJvZ3Jlc3MpO1xuICAgICAgdmVjNCBxID0gcXVhdEZyb21BeGlzQW5nbGUoYXhpcywgYW5nbGUpO1xuICAgICAgdiA9IHJvdGF0ZVZlY3RvcihxLCB2KTtcbiAgICAgICR7b3JpZ2luID8gYHYgKz0gY09yaWdpbiR7c2VnbWVudC5rZXl9O2AgOiAnJ31cbiAgICB9XG4gICAgYDtcbiAgfSxcbiAgZGVmYXVsdEZyb206IHtheGlzOiBuZXcgVmVjdG9yMygpLCBhbmdsZTogMH1cbn07XG5cblRpbWVsaW5lLnJlZ2lzdGVyKCdyb3RhdGUnLCBSb3RhdGlvblNlZ21lbnQpO1xuXG5leHBvcnQgeyBSb3RhdGlvblNlZ21lbnQgfTtcbiJdLCJuYW1lcyI6WyJCYXNlQW5pbWF0aW9uTWF0ZXJpYWwiLCJwYXJhbWV0ZXJzIiwidW5pZm9ybXMiLCJjYWxsIiwidW5pZm9ybVZhbHVlcyIsInNldFZhbHVlcyIsIlVuaWZvcm1zVXRpbHMiLCJtZXJnZSIsInNldFVuaWZvcm1WYWx1ZXMiLCJtYXAiLCJkZWZpbmVzIiwibm9ybWFsTWFwIiwiZW52TWFwIiwiYW9NYXAiLCJzcGVjdWxhck1hcCIsImFscGhhTWFwIiwibGlnaHRNYXAiLCJlbWlzc2l2ZU1hcCIsImJ1bXBNYXAiLCJkaXNwbGFjZW1lbnRNYXAiLCJyb3VnaG5lc3NNYXAiLCJtZXRhbG5lc3NNYXAiLCJlbnZNYXBUeXBlRGVmaW5lIiwiZW52TWFwTW9kZURlZmluZSIsImVudk1hcEJsZW5kaW5nRGVmaW5lIiwibWFwcGluZyIsIkN1YmVSZWZsZWN0aW9uTWFwcGluZyIsIkN1YmVSZWZyYWN0aW9uTWFwcGluZyIsIkN1YmVVVlJlZmxlY3Rpb25NYXBwaW5nIiwiQ3ViZVVWUmVmcmFjdGlvbk1hcHBpbmciLCJFcXVpcmVjdGFuZ3VsYXJSZWZsZWN0aW9uTWFwcGluZyIsIkVxdWlyZWN0YW5ndWxhclJlZnJhY3Rpb25NYXBwaW5nIiwiU3BoZXJpY2FsUmVmbGVjdGlvbk1hcHBpbmciLCJjb21iaW5lIiwiTWl4T3BlcmF0aW9uIiwiQWRkT3BlcmF0aW9uIiwiTXVsdGlwbHlPcGVyYXRpb24iLCJwcm90b3R5cGUiLCJPYmplY3QiLCJhc3NpZ24iLCJjcmVhdGUiLCJTaGFkZXJNYXRlcmlhbCIsInZhbHVlcyIsImtleXMiLCJmb3JFYWNoIiwia2V5IiwidmFsdWUiLCJuYW1lIiwiam9pbiIsIkJhc2ljQW5pbWF0aW9uTWF0ZXJpYWwiLCJ2YXJ5aW5nUGFyYW1ldGVycyIsInZlcnRleFBhcmFtZXRlcnMiLCJ2ZXJ0ZXhGdW5jdGlvbnMiLCJ2ZXJ0ZXhJbml0IiwidmVydGV4Tm9ybWFsIiwidmVydGV4UG9zaXRpb24iLCJ2ZXJ0ZXhDb2xvciIsImZyYWdtZW50RnVuY3Rpb25zIiwiZnJhZ21lbnRQYXJhbWV0ZXJzIiwiZnJhZ21lbnRJbml0IiwiZnJhZ21lbnRNYXAiLCJmcmFnbWVudERpZmZ1c2UiLCJTaGFkZXJMaWIiLCJsaWdodHMiLCJ2ZXJ0ZXhTaGFkZXIiLCJjb25jYXRWZXJ0ZXhTaGFkZXIiLCJmcmFnbWVudFNoYWRlciIsImNvbmNhdEZyYWdtZW50U2hhZGVyIiwiY29uc3RydWN0b3IiLCJzdHJpbmdpZnlDaHVuayIsIkxhbWJlcnRBbmltYXRpb25NYXRlcmlhbCIsImZyYWdtZW50RW1pc3NpdmUiLCJmcmFnbWVudFNwZWN1bGFyIiwiUGhvbmdBbmltYXRpb25NYXRlcmlhbCIsIlN0YW5kYXJkQW5pbWF0aW9uTWF0ZXJpYWwiLCJmcmFnbWVudFJvdWdobmVzcyIsImZyYWdtZW50TWV0YWxuZXNzIiwiUG9pbnRzQW5pbWF0aW9uTWF0ZXJpYWwiLCJmcmFnbWVudFNoYXBlIiwiRGVwdGhBbmltYXRpb25NYXRlcmlhbCIsImRlcHRoUGFja2luZyIsIlJHQkFEZXB0aFBhY2tpbmciLCJjbGlwcGluZyIsIkRpc3RhbmNlQW5pbWF0aW9uTWF0ZXJpYWwiLCJQcmVmYWJCdWZmZXJHZW9tZXRyeSIsInByZWZhYiIsImNvdW50IiwicHJlZmFiR2VvbWV0cnkiLCJpc1ByZWZhYkJ1ZmZlckdlb21ldHJ5IiwiaXNCdWZmZXJHZW9tZXRyeSIsInByZWZhYkNvdW50IiwicHJlZmFiVmVydGV4Q291bnQiLCJhdHRyaWJ1dGVzIiwicG9zaXRpb24iLCJ2ZXJ0aWNlcyIsImxlbmd0aCIsImJ1ZmZlckluZGljZXMiLCJidWZmZXJQb3NpdGlvbnMiLCJCdWZmZXJHZW9tZXRyeSIsInByZWZhYkluZGljZXMiLCJwcmVmYWJJbmRleENvdW50IiwiaW5kZXgiLCJhcnJheSIsImkiLCJwdXNoIiwicHJlZmFiRmFjZUNvdW50IiwiZmFjZXMiLCJmYWNlIiwiYSIsImIiLCJjIiwiaW5kZXhCdWZmZXIiLCJVaW50MzJBcnJheSIsInNldEluZGV4IiwiQnVmZmVyQXR0cmlidXRlIiwiayIsInBvc2l0aW9uQnVmZmVyIiwiY3JlYXRlQXR0cmlidXRlIiwicG9zaXRpb25zIiwib2Zmc2V0IiwiaiIsInByZWZhYlZlcnRleCIsIngiLCJ5IiwieiIsImJ1ZmZlclV2cyIsInByZWZhYlV2cyIsInV2IiwiVmVjdG9yMiIsImZhY2VWZXJ0ZXhVdnMiLCJ1dkJ1ZmZlciIsInByZWZhYlV2IiwiaXRlbVNpemUiLCJmYWN0b3J5IiwiYnVmZmVyIiwiRmxvYXQzMkFycmF5IiwiYXR0cmlidXRlIiwiYWRkQXR0cmlidXRlIiwiZGF0YSIsInNldFByZWZhYkRhdGEiLCJwcmVmYWJJbmRleCIsIk11bHRpUHJlZmFiQnVmZmVyR2VvbWV0cnkiLCJwcmVmYWJzIiwicmVwZWF0Q291bnQiLCJBcnJheSIsImlzQXJyYXkiLCJwcmVmYWJHZW9tZXRyaWVzIiwicHJlZmFiR2VvbWV0cmllc0NvdW50IiwicHJlZmFiVmVydGV4Q291bnRzIiwicCIsInJlcGVhdFZlcnRleENvdW50IiwicmVkdWNlIiwiciIsInYiLCJyZXBlYXRJbmRleENvdW50IiwiaW5kaWNlcyIsImdlb21ldHJ5IiwiaW5kZXhPZmZzZXQiLCJwcmVmYWJPZmZzZXQiLCJ2ZXJ0ZXhDb3VudCIsInByZWZhYlBvc2l0aW9ucyIsInV2cyIsImVycm9yIiwidXZPYmplY3RzIiwicHJlZmFiR2VvbWV0cnlJbmRleCIsInByZWZhYkdlb21ldHJ5VmVydGV4Q291bnQiLCJ3aG9sZSIsIndob2xlT2Zmc2V0IiwicGFydCIsInBhcnRPZmZzZXQiLCJVdGlscyIsImlsIiwibiIsInZhIiwidmIiLCJ2YyIsImNsb25lIiwiVmVjdG9yMyIsImJveCIsInRNYXRoIiwicmFuZEZsb2F0IiwibWluIiwibWF4IiwicmFuZEZsb2F0U3ByZWFkIiwibm9ybWFsaXplIiwic291cmNlTWF0ZXJpYWwiLCJNb2RlbEJ1ZmZlckdlb21ldHJ5IiwibW9kZWwiLCJvcHRpb25zIiwibW9kZWxHZW9tZXRyeSIsImZhY2VDb3VudCIsImNvbXB1dGVDZW50cm9pZHMiLCJsb2NhbGl6ZUZhY2VzIiwiY2VudHJvaWRzIiwiY29tcHV0ZUNlbnRyb2lkIiwiY2VudHJvaWQiLCJ2ZXJ0ZXgiLCJidWZmZXJVVnMiLCJidWZmZXJTa2lubmluZyIsInNraW5JbmRleEJ1ZmZlciIsInNraW5XZWlnaHRCdWZmZXIiLCJza2luSW5kZXgiLCJza2luSW5kaWNlcyIsInNraW5XZWlnaHQiLCJza2luV2VpZ2h0cyIsInciLCJzZXRGYWNlRGF0YSIsImZhY2VJbmRleCIsIlBvaW50QnVmZmVyR2VvbWV0cnkiLCJwb2ludENvdW50Iiwic2V0UG9pbnREYXRhIiwicG9pbnRJbmRleCIsIlNoYWRlckNodW5rIiwiY2F0bXVsbF9yb21fc3BsaW5lIiwiY3ViaWNfYmV6aWVyIiwiZWFzZV9iYWNrX2luIiwiZWFzZV9iYWNrX2luX291dCIsImVhc2VfYmFja19vdXQiLCJlYXNlX2JlemllciIsImVhc2VfYm91bmNlX2luIiwiZWFzZV9ib3VuY2VfaW5fb3V0IiwiZWFzZV9ib3VuY2Vfb3V0IiwiZWFzZV9jaXJjX2luIiwiZWFzZV9jaXJjX2luX291dCIsImVhc2VfY2lyY19vdXQiLCJlYXNlX2N1YmljX2luIiwiZWFzZV9jdWJpY19pbl9vdXQiLCJlYXNlX2N1YmljX291dCIsImVhc2VfZWxhc3RpY19pbiIsImVhc2VfZWxhc3RpY19pbl9vdXQiLCJlYXNlX2VsYXN0aWNfb3V0IiwiZWFzZV9leHBvX2luIiwiZWFzZV9leHBvX2luX291dCIsImVhc2VfZXhwb19vdXQiLCJlYXNlX3F1YWRfaW4iLCJlYXNlX3F1YWRfaW5fb3V0IiwiZWFzZV9xdWFkX291dCIsImVhc2VfcXVhcnRfaW4iLCJlYXNlX3F1YXJ0X2luX291dCIsImVhc2VfcXVhcnRfb3V0IiwiZWFzZV9xdWludF9pbiIsImVhc2VfcXVpbnRfaW5fb3V0IiwiZWFzZV9xdWludF9vdXQiLCJlYXNlX3NpbmVfaW4iLCJlYXNlX3NpbmVfaW5fb3V0IiwiZWFzZV9zaW5lX291dCIsInF1YXRlcm5pb25fcm90YXRpb24iLCJxdWF0ZXJuaW9uX3NsZXJwIiwiVGltZWxpbmVTZWdtZW50Iiwic3RhcnQiLCJkdXJhdGlvbiIsInRyYW5zaXRpb24iLCJjb21waWxlciIsInRyYWlsIiwiY29tcGlsZSIsImRlZmluZVByb3BlcnR5IiwiVGltZWxpbmUiLCJ0aW1lS2V5Iiwic2VnbWVudHMiLCJfX2tleSIsInNlZ21lbnREZWZpbml0aW9ucyIsInJlZ2lzdGVyIiwiZGVmaW5pdGlvbiIsImFkZCIsInRyYW5zaXRpb25zIiwicG9zaXRpb25PZmZzZXQiLCJfZXZhbCIsImV2YWwiLCJ1bmRlZmluZWQiLCJNYXRoIiwicHJvY2Vzc1RyYW5zaXRpb24iLCJmcm9tIiwiZGVmYXVsdEZyb20iLCJ0byIsInRvU3RyaW5nIiwiZmlsbEdhcHMiLCJzIiwiczAiLCJzMSIsImVuZCIsImdldFRyYW5zZm9ybUNhbGxzIiwidCIsIlRpbWVsaW5lQ2h1bmtzIiwidG9QcmVjaXNpb24iLCJzZWdtZW50IiwiZWFzZSIsImVhc2VQYXJhbXMiLCJzdGFydFRpbWUiLCJlbmRUaW1lIiwiVHJhbnNsYXRpb25TZWdtZW50IiwiZGVsYXlEdXJhdGlvbiIsInZlYzMiLCJyZW5kZXJDaGVjayIsInByb2dyZXNzIiwiU2NhbGVTZWdtZW50Iiwib3JpZ2luIiwiUm90YXRpb25TZWdtZW50IiwiZnJvbUF4aXNBbmdsZSIsIlZlY3RvcjQiLCJheGlzIiwiYW5nbGUiLCJ0b0F4aXMiLCJ0b0F4aXNBbmdsZSIsInZlYzQiXSwibWFwcGluZ3MiOiI7O0FBZUEsU0FBU0EscUJBQVQsQ0FBK0JDLFVBQS9CLEVBQTJDQyxRQUEzQyxFQUFxRDtpQkFDcENDLElBQWYsQ0FBb0IsSUFBcEI7O01BRU1DLGdCQUFnQkgsV0FBV0csYUFBakM7U0FDT0gsV0FBV0csYUFBbEI7O09BRUtDLFNBQUwsQ0FBZUosVUFBZjs7T0FFS0MsUUFBTCxHQUFnQkksY0FBY0MsS0FBZCxDQUFvQixDQUFDTCxRQUFELEVBQVcsS0FBS0EsUUFBaEIsQ0FBcEIsQ0FBaEI7O09BRUtNLGdCQUFMLENBQXNCSixhQUF0Qjs7TUFFSUEsYUFBSixFQUFtQjtrQkFDSEssR0FBZCxLQUFzQixLQUFLQyxPQUFMLENBQWEsU0FBYixJQUEwQixFQUFoRDtrQkFDY0MsU0FBZCxLQUE0QixLQUFLRCxPQUFMLENBQWEsZUFBYixJQUFnQyxFQUE1RDtrQkFDY0UsTUFBZCxLQUF5QixLQUFLRixPQUFMLENBQWEsWUFBYixJQUE2QixFQUF0RDtrQkFDY0csS0FBZCxLQUF3QixLQUFLSCxPQUFMLENBQWEsV0FBYixJQUE0QixFQUFwRDtrQkFDY0ksV0FBZCxLQUE4QixLQUFLSixPQUFMLENBQWEsaUJBQWIsSUFBa0MsRUFBaEU7a0JBQ2NLLFFBQWQsS0FBMkIsS0FBS0wsT0FBTCxDQUFh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
