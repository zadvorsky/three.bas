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
MultiPrefabBufferGeometry.prototype = Object.create(BufferGeometry.prototype);
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

  this.setIndex(new BufferAttribute(indexBuffer, 1));
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzLm1vZHVsZS5qcyIsInNvdXJjZXMiOlsiLi4vc3JjL21hdGVyaWFscy9CYXNlQW5pbWF0aW9uTWF0ZXJpYWwuanMiLCIuLi9zcmMvbWF0ZXJpYWxzL0Jhc2ljQW5pbWF0aW9uTWF0ZXJpYWwuanMiLCIuLi9zcmMvbWF0ZXJpYWxzL0xhbWJlcnRBbmltYXRpb25NYXRlcmlhbC5qcyIsIi4uL3NyYy9tYXRlcmlhbHMvUGhvbmdBbmltYXRpb25NYXRlcmlhbC5qcyIsIi4uL3NyYy9tYXRlcmlhbHMvU3RhbmRhcmRBbmltYXRpb25NYXRlcmlhbC5qcyIsIi4uL3NyYy9tYXRlcmlhbHMvUG9pbnRzQW5pbWF0aW9uTWF0ZXJpYWwuanMiLCIuLi9zcmMvbWF0ZXJpYWxzL0RlcHRoQW5pbWF0aW9uTWF0ZXJpYWwuanMiLCIuLi9zcmMvbWF0ZXJpYWxzL0Rpc3RhbmNlQW5pbWF0aW9uTWF0ZXJpYWwuanMiLCIuLi9zcmMvZ2VvbWV0cnkvUHJlZmFiQnVmZmVyR2VvbWV0cnkuanMiLCIuLi9zcmMvZ2VvbWV0cnkvTXVsdGlQcmVmYWJCdWZmZXJHZW9tZXRyeS5qcyIsIi4uL3NyYy9VdGlscy5qcyIsIi4uL3NyYy9nZW9tZXRyeS9Nb2RlbEJ1ZmZlckdlb21ldHJ5LmpzIiwiLi4vc3JjL2dlb21ldHJ5L1BvaW50QnVmZmVyR2VvbWV0cnkuanMiLCIuLi9zcmMvU2hhZGVyQ2h1bmsuanMiLCIuLi9zcmMvdGltZWxpbmUvVGltZWxpbmVTZWdtZW50LmpzIiwiLi4vc3JjL3RpbWVsaW5lL1RpbWVsaW5lLmpzIiwiLi4vc3JjL3RpbWVsaW5lL1RpbWVsaW5lQ2h1bmtzLmpzIiwiLi4vc3JjL3RpbWVsaW5lL1RyYW5zbGF0aW9uU2VnbWVudC5qcyIsIi4uL3NyYy90aW1lbGluZS9TY2FsZVNlZ21lbnQuanMiLCIuLi9zcmMvdGltZWxpbmUvUm90YXRpb25TZWdtZW50LmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG4gIFNoYWRlck1hdGVyaWFsLFxuICBVbmlmb3Jtc1V0aWxzLFxuICBDdWJlUmVmbGVjdGlvbk1hcHBpbmcsXG4gIEN1YmVSZWZyYWN0aW9uTWFwcGluZyxcbiAgQ3ViZVVWUmVmbGVjdGlvbk1hcHBpbmcsXG4gIEN1YmVVVlJlZnJhY3Rpb25NYXBwaW5nLFxuICBFcXVpcmVjdGFuZ3VsYXJSZWZsZWN0aW9uTWFwcGluZyxcbiAgRXF1aXJlY3Rhbmd1bGFyUmVmcmFjdGlvbk1hcHBpbmcsXG4gIFNwaGVyaWNhbFJlZmxlY3Rpb25NYXBwaW5nLFxuICBNaXhPcGVyYXRpb24sXG4gIEFkZE9wZXJhdGlvbixcbiAgTXVsdGlwbHlPcGVyYXRpb25cbn0gZnJvbSAndGhyZWUnO1xuXG5mdW5jdGlvbiBCYXNlQW5pbWF0aW9uTWF0ZXJpYWwocGFyYW1ldGVycywgdW5pZm9ybXMpIHtcbiAgU2hhZGVyTWF0ZXJpYWwuY2FsbCh0aGlzKTtcbiAgXG4gIGNvbnN0IHVuaWZvcm1WYWx1ZXMgPSBwYXJhbWV0ZXJzLnVuaWZvcm1WYWx1ZXM7XG4gIGRlbGV0ZSBwYXJhbWV0ZXJzLnVuaWZvcm1WYWx1ZXM7XG4gIFxuICB0aGlzLnNldFZhbHVlcyhwYXJhbWV0ZXJzKTtcbiAgXG4gIHRoaXMudW5pZm9ybXMgPSBVbmlmb3Jtc1V0aWxzLm1lcmdlKFt1bmlmb3JtcywgdGhpcy51bmlmb3Jtc10pO1xuICBcbiAgdGhpcy5zZXRVbmlmb3JtVmFsdWVzKHVuaWZvcm1WYWx1ZXMpO1xuICBcbiAgaWYgKHVuaWZvcm1WYWx1ZXMpIHtcbiAgICB1bmlmb3JtVmFsdWVzLm1hcCAmJiAodGhpcy5kZWZpbmVzWydVU0VfTUFQJ10gPSAnJyk7XG4gICAgdW5pZm9ybVZhbHVlcy5ub3JtYWxNYXAgJiYgKHRoaXMuZGVmaW5lc1snVVNFX05PUk1BTE1BUCddID0gJycpO1xuICAgIHVuaWZvcm1WYWx1ZXMuZW52TWFwICYmICh0aGlzLmRlZmluZXNbJ1VTRV9FTlZNQVAnXSA9ICcnKTtcbiAgICB1bmlmb3JtVmFsdWVzLmFvTWFwICYmICh0aGlzLmRlZmluZXNbJ1VTRV9BT01BUCddID0gJycpO1xuICAgIHVuaWZvcm1WYWx1ZXMuc3BlY3VsYXJNYXAgJiYgKHRoaXMuZGVmaW5lc1snVVNFX1NQRUNVTEFSTUFQJ10gPSAnJyk7XG4gICAgdW5pZm9ybVZhbHVlcy5hbHBoYU1hcCAmJiAodGhpcy5kZWZpbmVzWydVU0VfQUxQSEFNQVAnXSA9ICcnKTtcbiAgICB1bmlmb3JtVmFsdWVzLmxpZ2h0TWFwICYmICh0aGlzLmRlZmluZXNbJ1VTRV9MSUdIVE1BUCddID0gJycpO1xuICAgIHVuaWZvcm1WYWx1ZXMuZW1pc3NpdmVNYXAgJiYgKHRoaXMuZGVmaW5lc1snVVNFX0VNSVNTSVZFTUFQJ10gPSAnJyk7XG4gICAgdW5pZm9ybVZhbHVlcy5idW1wTWFwICYmICh0aGlzLmRlZmluZXNbJ1VTRV9CVU1QTUFQJ10gPSAnJyk7XG4gICAgdW5pZm9ybVZhbHVlcy5kaXNwbGFjZW1lbnRNYXAgJiYgKHRoaXMuZGVmaW5lc1snVVNFX0RJU1BMQUNFTUVOVE1BUCddID0gJycpO1xuICAgIHVuaWZvcm1WYWx1ZXMucm91Z2huZXNzTWFwICYmICh0aGlzLmRlZmluZXNbJ1VTRV9ESVNQTEFDRU1FTlRNQVAnXSA9ICcnKTtcbiAgICB1bmlmb3JtVmFsdWVzLnJvdWdobmVzc01hcCAmJiAodGhpcy5kZWZpbmVzWydVU0VfUk9VR0hORVNTTUFQJ10gPSAnJyk7XG4gICAgdW5pZm9ybVZhbHVlcy5tZXRhbG5lc3NNYXAgJiYgKHRoaXMuZGVmaW5lc1snVVNFX01FVEFMTkVTU01BUCddID0gJycpO1xuICBcbiAgICBpZiAodW5pZm9ybVZhbHVlcy5lbnZNYXApIHtcbiAgICAgIHRoaXMuZGVmaW5lc1snVVNFX0VOVk1BUCddID0gJyc7XG4gICAgXG4gICAgICBsZXQgZW52TWFwVHlwZURlZmluZSA9ICdFTlZNQVBfVFlQRV9DVUJFJztcbiAgICAgIGxldCBlbnZNYXBNb2RlRGVmaW5lID0gJ0VOVk1BUF9NT0RFX1JFRkxFQ1RJT04nO1xuICAgICAgbGV0IGVudk1hcEJsZW5kaW5nRGVmaW5lID0gJ0VOVk1BUF9CTEVORElOR19NVUxUSVBMWSc7XG4gICAgXG4gICAgICBzd2l0Y2ggKHVuaWZvcm1WYWx1ZXMuZW52TWFwLm1hcHBpbmcpIHtcbiAgICAgICAgY2FzZSBDdWJlUmVmbGVjdGlvbk1hcHBpbmc6XG4gICAgICAgIGNhc2UgQ3ViZVJlZnJhY3Rpb25NYXBwaW5nOlxuICAgICAgICAgIGVudk1hcFR5cGVEZWZpbmUgPSAnRU5WTUFQX1RZUEVfQ1VCRSc7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ3ViZVVWUmVmbGVjdGlvbk1hcHBpbmc6XG4gICAgICAgIGNhc2UgQ3ViZVVWUmVmcmFjdGlvbk1hcHBpbmc6XG4gICAgICAgICAgZW52TWFwVHlwZURlZmluZSA9ICdFTlZNQVBfVFlQRV9DVUJFX1VWJztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBFcXVpcmVjdGFuZ3VsYXJSZWZsZWN0aW9uTWFwcGluZzpcbiAgICAgICAgY2FzZSBFcXVpcmVjdGFuZ3VsYXJSZWZyYWN0aW9uTWFwcGluZzpcbiAgICAgICAgICBlbnZNYXBUeXBlRGVmaW5lID0gJ0VOVk1BUF9UWVBFX0VRVUlSRUMnO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFNwaGVyaWNhbFJlZmxlY3Rpb25NYXBwaW5nOlxuICAgICAgICAgIGVudk1hcFR5cGVEZWZpbmUgPSAnRU5WTUFQX1RZUEVfU1BIRVJFJztcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICBcbiAgICAgIHN3aXRjaCAodW5pZm9ybVZhbHVlcy5lbnZNYXAubWFwcGluZykge1xuICAgICAgICBjYXNlIEN1YmVSZWZyYWN0aW9uTWFwcGluZzpcbiAgICAgICAgY2FzZSBFcXVpcmVjdGFuZ3VsYXJSZWZyYWN0aW9uTWFwcGluZzpcbiAgICAgICAgICBlbnZNYXBNb2RlRGVmaW5lID0gJ0VOVk1BUF9NT0RFX1JFRlJBQ1RJT04nO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIFxuICAgICAgc3dpdGNoICh1bmlmb3JtVmFsdWVzLmNvbWJpbmUpIHtcbiAgICAgICAgY2FzZSBNaXhPcGVyYXRpb246XG4gICAgICAgICAgZW52TWFwQmxlbmRpbmdEZWZpbmUgPSAnRU5WTUFQX0JMRU5ESU5HX01JWCc7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQWRkT3BlcmF0aW9uOlxuICAgICAgICAgIGVudk1hcEJsZW5kaW5nRGVmaW5lID0gJ0VOVk1BUF9CTEVORElOR19BREQnO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIE11bHRpcGx5T3BlcmF0aW9uOlxuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIGVudk1hcEJsZW5kaW5nRGVmaW5lID0gJ0VOVk1BUF9CTEVORElOR19NVUxUSVBMWSc7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgXG4gICAgICB0aGlzLmRlZmluZXNbZW52TWFwVHlwZURlZmluZV0gPSAnJztcbiAgICAgIHRoaXMuZGVmaW5lc1tlbnZNYXBCbGVuZGluZ0RlZmluZV0gPSAnJztcbiAgICAgIHRoaXMuZGVmaW5lc1tlbnZNYXBNb2RlRGVmaW5lXSA9ICcnO1xuICAgIH1cbiAgfVxufVxuXG5CYXNlQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlID0gT2JqZWN0LmFzc2lnbihPYmplY3QuY3JlYXRlKFNoYWRlck1hdGVyaWFsLnByb3RvdHlwZSksIHtcbiAgY29uc3RydWN0b3I6IEJhc2VBbmltYXRpb25NYXRlcmlhbCxcbiAgXG4gIHNldFVuaWZvcm1WYWx1ZXModmFsdWVzKSB7XG4gICAgaWYgKCF2YWx1ZXMpIHJldHVybjtcbiAgICBcbiAgICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXModmFsdWVzKTtcbiAgICBcbiAgICBrZXlzLmZvckVhY2goKGtleSkgPT4ge1xuICAgICAga2V5IGluIHRoaXMudW5pZm9ybXMgJiYgKHRoaXMudW5pZm9ybXNba2V5XS52YWx1ZSA9IHZhbHVlc1trZXldKTtcbiAgICB9KTtcbiAgfSxcbiAgXG4gIHN0cmluZ2lmeUNodW5rKG5hbWUpIHtcbiAgICBsZXQgdmFsdWU7XG4gICAgXG4gICAgaWYgKCF0aGlzW25hbWVdKSB7XG4gICAgICB2YWx1ZSA9ICcnO1xuICAgIH1cbiAgICBlbHNlIGlmICh0eXBlb2YgdGhpc1tuYW1lXSA9PT0gICdzdHJpbmcnKSB7XG4gICAgICB2YWx1ZSA9IHRoaXNbbmFtZV07XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgdmFsdWUgPSB0aGlzW25hbWVdLmpvaW4oJ1xcbicpO1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cbn0pO1xuXG5leHBvcnQgZGVmYXVsdCBCYXNlQW5pbWF0aW9uTWF0ZXJpYWw7XG4iLCJpbXBvcnQgeyBTaGFkZXJMaWIgfSBmcm9tICd0aHJlZSc7XG5pbXBvcnQgQmFzZUFuaW1hdGlvbk1hdGVyaWFsIGZyb20gJy4vQmFzZUFuaW1hdGlvbk1hdGVyaWFsJztcblxuLyoqXG4gKiBFeHRlbmRzIFRIUkVFLk1lc2hCYXNpY01hdGVyaWFsIHdpdGggY3VzdG9tIHNoYWRlciBjaHVua3MuXG4gKlxuICogQHNlZSBodHRwOi8vdGhyZWUtYmFzLWV4YW1wbGVzLnN1cmdlLnNoL2V4YW1wbGVzL21hdGVyaWFsc19iYXNpYy9cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gcGFyYW1ldGVycyBPYmplY3QgY29udGFpbmluZyBtYXRlcmlhbCBwcm9wZXJ0aWVzIGFuZCBjdXN0b20gc2hhZGVyIGNodW5rcy5cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBCYXNpY0FuaW1hdGlvbk1hdGVyaWFsKHBhcmFtZXRlcnMpIHtcbiAgdGhpcy52YXJ5aW5nUGFyYW1ldGVycyA9IFtdO1xuICBcbiAgdGhpcy52ZXJ0ZXhQYXJhbWV0ZXJzID0gW107XG4gIHRoaXMudmVydGV4RnVuY3Rpb25zID0gW107XG4gIHRoaXMudmVydGV4SW5pdCA9IFtdO1xuICB0aGlzLnZlcnRleE5vcm1hbCA9IFtdO1xuICB0aGlzLnZlcnRleFBvc2l0aW9uID0gW107XG4gIHRoaXMudmVydGV4Q29sb3IgPSBbXTtcbiAgXG4gIHRoaXMuZnJhZ21lbnRGdW5jdGlvbnMgPSBbXTtcbiAgdGhpcy5mcmFnbWVudFBhcmFtZXRlcnMgPSBbXTtcbiAgdGhpcy5mcmFnbWVudEluaXQgPSBbXTtcbiAgdGhpcy5mcmFnbWVudE1hcCA9IFtdO1xuICB0aGlzLmZyYWdtZW50RGlmZnVzZSA9IFtdO1xuICBcbiAgQmFzZUFuaW1hdGlvbk1hdGVyaWFsLmNhbGwodGhpcywgcGFyYW1ldGVycywgU2hhZGVyTGliWydiYXNpYyddLnVuaWZvcm1zKTtcbiAgXG4gIHRoaXMubGlnaHRzID0gZmFsc2U7XG4gIHRoaXMudmVydGV4U2hhZGVyID0gdGhpcy5jb25jYXRWZXJ0ZXhTaGFkZXIoKTtcbiAgdGhpcy5mcmFnbWVudFNoYWRlciA9IHRoaXMuY29uY2F0RnJhZ21lbnRTaGFkZXIoKTtcbn1cbkJhc2ljQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShCYXNlQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlKTtcbkJhc2ljQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gQmFzaWNBbmltYXRpb25NYXRlcmlhbDtcblxuQmFzaWNBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uY2F0VmVydGV4U2hhZGVyID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBgXG4gICNpbmNsdWRlIDxjb21tb24+XG4gICNpbmNsdWRlIDx1dl9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPHV2Ml9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPGVudm1hcF9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPGNvbG9yX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8Zm9nX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8bW9ycGh0YXJnZXRfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxza2lubmluZ19wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPGxvZ2RlcHRoYnVmX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX3BhcnNfdmVydGV4PlxuICBcbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQYXJhbWV0ZXJzJyl9XG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmFyeWluZ1BhcmFtZXRlcnMnKX1cbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhGdW5jdGlvbnMnKX1cbiAgXG4gIHZvaWQgbWFpbigpIHtcblxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4SW5pdCcpfVxuICBcbiAgICAjaW5jbHVkZSA8dXZfdmVydGV4PlxuICAgICNpbmNsdWRlIDx1djJfdmVydGV4PlxuICAgICNpbmNsdWRlIDxjb2xvcl92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPHNraW5iYXNlX3ZlcnRleD5cbiAgXG4gICAgI2lmZGVmIFVTRV9FTlZNQVBcbiAgXG4gICAgI2luY2x1ZGUgPGJlZ2lubm9ybWFsX3ZlcnRleD5cbiAgICBcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleE5vcm1hbCcpfVxuICAgIFxuICAgICNpbmNsdWRlIDxtb3JwaG5vcm1hbF92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPHNraW5ub3JtYWxfdmVydGV4PlxuICAgICNpbmNsdWRlIDxkZWZhdWx0bm9ybWFsX3ZlcnRleD5cbiAgXG4gICAgI2VuZGlmXG4gIFxuICAgICNpbmNsdWRlIDxiZWdpbl92ZXJ0ZXg+XG4gICAgXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQb3NpdGlvbicpfVxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4Q29sb3InKX1cbiAgICBcbiAgICAjaW5jbHVkZSA8bW9ycGh0YXJnZXRfdmVydGV4PlxuICAgICNpbmNsdWRlIDxza2lubmluZ192ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPHByb2plY3RfdmVydGV4PlxuICAgICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl92ZXJ0ZXg+XG4gIFxuICAgICNpbmNsdWRlIDx3b3JsZHBvc192ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc192ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPGVudm1hcF92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPGZvZ192ZXJ0ZXg+XG4gIH1gO1xufTtcblxuQmFzaWNBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uY2F0RnJhZ21lbnRTaGFkZXIgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIGBcbiAgdW5pZm9ybSB2ZWMzIGRpZmZ1c2U7XG4gIHVuaWZvcm0gZmxvYXQgb3BhY2l0eTtcbiAgXG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRQYXJhbWV0ZXJzJyl9XG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmFyeWluZ1BhcmFtZXRlcnMnKX1cbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudEZ1bmN0aW9ucycpfVxuICBcbiAgI2lmbmRlZiBGTEFUX1NIQURFRFxuICBcbiAgICB2YXJ5aW5nIHZlYzMgdk5vcm1hbDtcbiAgXG4gICNlbmRpZlxuICBcbiAgI2luY2x1ZGUgPGNvbW1vbj5cbiAgI2luY2x1ZGUgPGNvbG9yX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDx1dl9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8dXYyX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxtYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGFscGhhbWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxhb21hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8bGlnaHRtYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGVudm1hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8Zm9nX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxzcGVjdWxhcm1hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc19wYXJzX2ZyYWdtZW50PlxuICBcbiAgdm9pZCBtYWluKCkge1xuICBcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50SW5pdCcpfVxuICBcbiAgICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX2ZyYWdtZW50PlxuXG4gICAgdmVjNCBkaWZmdXNlQ29sb3IgPSB2ZWM0KCBkaWZmdXNlLCBvcGFjaXR5ICk7XG5cbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50RGlmZnVzZScpfVxuICBcbiAgICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfZnJhZ21lbnQ+XG4gICAgXG4gICAgJHsodGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRNYXAnKSB8fCAnI2luY2x1ZGUgPG1hcF9mcmFnbWVudD4nKX1cbiAgICBcbiAgICAjaW5jbHVkZSA8Y29sb3JfZnJhZ21lbnQ+XG4gICAgI2luY2x1ZGUgPGFscGhhbWFwX2ZyYWdtZW50PlxuICAgICNpbmNsdWRlIDxhbHBoYXRlc3RfZnJhZ21lbnQ+XG4gICAgI2luY2x1ZGUgPHNwZWN1bGFybWFwX2ZyYWdtZW50PlxuICBcbiAgICBSZWZsZWN0ZWRMaWdodCByZWZsZWN0ZWRMaWdodCA9IFJlZmxlY3RlZExpZ2h0KCB2ZWMzKCAwLjAgKSwgdmVjMyggMC4wICksIHZlYzMoIDAuMCApLCB2ZWMzKCAwLjAgKSApO1xuICBcbiAgICAvLyBhY2N1bXVsYXRpb24gKGJha2VkIGluZGlyZWN0IGxpZ2h0aW5nIG9ubHkpXG4gICAgI2lmZGVmIFVTRV9MSUdIVE1BUFxuICBcbiAgICAgIHJlZmxlY3RlZExpZ2h0LmluZGlyZWN0RGlmZnVzZSArPSB0ZXh0dXJlMkQoIGxpZ2h0TWFwLCB2VXYyICkueHl6ICogbGlnaHRNYXBJbnRlbnNpdHk7XG4gIFxuICAgICNlbHNlXG4gIFxuICAgICAgcmVmbGVjdGVkTGlnaHQuaW5kaXJlY3REaWZmdXNlICs9IHZlYzMoIDEuMCApO1xuICBcbiAgICAjZW5kaWZcbiAgXG4gICAgLy8gbW9kdWxhdGlvblxuICAgICNpbmNsdWRlIDxhb21hcF9mcmFnbWVudD5cbiAgXG4gICAgcmVmbGVjdGVkTGlnaHQuaW5kaXJlY3REaWZmdXNlICo9IGRpZmZ1c2VDb2xvci5yZ2I7XG4gIFxuICAgIHZlYzMgb3V0Z29pbmdMaWdodCA9IHJlZmxlY3RlZExpZ2h0LmluZGlyZWN0RGlmZnVzZTtcbiAgXG4gICAgI2luY2x1ZGUgPGVudm1hcF9mcmFnbWVudD5cbiAgXG4gICAgZ2xfRnJhZ0NvbG9yID0gdmVjNCggb3V0Z29pbmdMaWdodCwgZGlmZnVzZUNvbG9yLmEgKTtcbiAgXG4gICAgI2luY2x1ZGUgPHByZW11bHRpcGxpZWRfYWxwaGFfZnJhZ21lbnQ+XG4gICAgI2luY2x1ZGUgPHRvbmVtYXBwaW5nX2ZyYWdtZW50PlxuICAgICNpbmNsdWRlIDxlbmNvZGluZ3NfZnJhZ21lbnQ+XG4gICAgI2luY2x1ZGUgPGZvZ19mcmFnbWVudD5cbiAgfWA7XG59O1xuXG5leHBvcnQgeyBCYXNpY0FuaW1hdGlvbk1hdGVyaWFsIH07XG4iLCJpbXBvcnQgeyBTaGFkZXJMaWIgfSBmcm9tICd0aHJlZSc7XG5pbXBvcnQgQmFzZUFuaW1hdGlvbk1hdGVyaWFsIGZyb20gJy4vQmFzZUFuaW1hdGlvbk1hdGVyaWFsJztcblxuLyoqXG4gKiBFeHRlbmRzIFRIUkVFLk1lc2hMYW1iZXJ0TWF0ZXJpYWwgd2l0aCBjdXN0b20gc2hhZGVyIGNodW5rcy5cbiAqXG4gKiBAc2VlIGh0dHA6Ly90aHJlZS1iYXMtZXhhbXBsZXMuc3VyZ2Uuc2gvZXhhbXBsZXMvbWF0ZXJpYWxzX2xhbWJlcnQvXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IHBhcmFtZXRlcnMgT2JqZWN0IGNvbnRhaW5pbmcgbWF0ZXJpYWwgcHJvcGVydGllcyBhbmQgY3VzdG9tIHNoYWRlciBjaHVua3MuXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gTGFtYmVydEFuaW1hdGlvbk1hdGVyaWFsKHBhcmFtZXRlcnMpIHtcbiAgdGhpcy52YXJ5aW5nUGFyYW1ldGVycyA9IFtdO1xuICBcbiAgdGhpcy52ZXJ0ZXhGdW5jdGlvbnMgPSBbXTtcbiAgdGhpcy52ZXJ0ZXhQYXJhbWV0ZXJzID0gW107XG4gIHRoaXMudmVydGV4SW5pdCA9IFtdO1xuICB0aGlzLnZlcnRleE5vcm1hbCA9IFtdO1xuICB0aGlzLnZlcnRleFBvc2l0aW9uID0gW107XG4gIHRoaXMudmVydGV4Q29sb3IgPSBbXTtcbiAgXG4gIHRoaXMuZnJhZ21lbnRGdW5jdGlvbnMgPSBbXTtcbiAgdGhpcy5mcmFnbWVudFBhcmFtZXRlcnMgPSBbXTtcbiAgdGhpcy5mcmFnbWVudEluaXQgPSBbXTtcbiAgdGhpcy5mcmFnbWVudE1hcCA9IFtdO1xuICB0aGlzLmZyYWdtZW50RGlmZnVzZSA9IFtdO1xuICB0aGlzLmZyYWdtZW50RW1pc3NpdmUgPSBbXTtcbiAgdGhpcy5mcmFnbWVudFNwZWN1bGFyID0gW107XG4gIFxuICBCYXNlQW5pbWF0aW9uTWF0ZXJpYWwuY2FsbCh0aGlzLCBwYXJhbWV0ZXJzLCBTaGFkZXJMaWJbJ2xhbWJlcnQnXS51bmlmb3Jtcyk7XG4gIFxuICB0aGlzLmxpZ2h0cyA9IHRydWU7XG4gIHRoaXMudmVydGV4U2hhZGVyID0gdGhpcy5jb25jYXRWZXJ0ZXhTaGFkZXIoKTtcbiAgdGhpcy5mcmFnbWVudFNoYWRlciA9IHRoaXMuY29uY2F0RnJhZ21lbnRTaGFkZXIoKTtcbn1cbkxhbWJlcnRBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEJhc2VBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUpO1xuTGFtYmVydEFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IExhbWJlcnRBbmltYXRpb25NYXRlcmlhbDtcblxuTGFtYmVydEFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZS5jb25jYXRWZXJ0ZXhTaGFkZXIgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiBgXG4gICNkZWZpbmUgTEFNQkVSVFxuXG4gIHZhcnlpbmcgdmVjMyB2TGlnaHRGcm9udDtcbiAgXG4gICNpZmRlZiBET1VCTEVfU0lERURcbiAgXG4gICAgdmFyeWluZyB2ZWMzIHZMaWdodEJhY2s7XG4gIFxuICAjZW5kaWZcbiAgXG4gICNpbmNsdWRlIDxjb21tb24+XG4gICNpbmNsdWRlIDx1dl9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPHV2Ml9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPGVudm1hcF9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPGJzZGZzPlxuICAjaW5jbHVkZSA8bGlnaHRzX3BhcnM+XG4gICNpbmNsdWRlIDxjb2xvcl9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPGZvZ19wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPG1vcnBodGFyZ2V0X3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8c2tpbm5pbmdfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxzaGFkb3dtYXBfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc19wYXJzX3ZlcnRleD5cbiAgXG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UGFyYW1ldGVycycpfVxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZhcnlpbmdQYXJhbWV0ZXJzJyl9XG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4RnVuY3Rpb25zJyl9XG4gIFxuICB2b2lkIG1haW4oKSB7XG4gIFxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4SW5pdCcpfVxuICBcbiAgICAjaW5jbHVkZSA8dXZfdmVydGV4PlxuICAgICNpbmNsdWRlIDx1djJfdmVydGV4PlxuICAgICNpbmNsdWRlIDxjb2xvcl92ZXJ0ZXg+XG4gIFxuICAgICNpbmNsdWRlIDxiZWdpbm5vcm1hbF92ZXJ0ZXg+XG4gICAgXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhOb3JtYWwnKX1cbiAgICBcbiAgICAjaW5jbHVkZSA8bW9ycGhub3JtYWxfdmVydGV4PlxuICAgICNpbmNsdWRlIDxza2luYmFzZV92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPHNraW5ub3JtYWxfdmVydGV4PlxuICAgICNpbmNsdWRlIDxkZWZhdWx0bm9ybWFsX3ZlcnRleD5cbiAgXG4gICAgI2luY2x1ZGUgPGJlZ2luX3ZlcnRleD5cbiAgICBcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBvc2l0aW9uJyl9XG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhDb2xvcicpfVxuICAgIFxuICAgICNpbmNsdWRlIDxtb3JwaHRhcmdldF92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPHNraW5uaW5nX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8cHJvamVjdF92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPGxvZ2RlcHRoYnVmX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX3ZlcnRleD5cbiAgXG4gICAgI2luY2x1ZGUgPHdvcmxkcG9zX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8ZW52bWFwX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8bGlnaHRzX2xhbWJlcnRfdmVydGV4PlxuICAgICNpbmNsdWRlIDxzaGFkb3dtYXBfdmVydGV4PlxuICAgICNpbmNsdWRlIDxmb2dfdmVydGV4PlxuICB9YDtcbn07XG5cbkxhbWJlcnRBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uY2F0RnJhZ21lbnRTaGFkZXIgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiBgXG4gIHVuaWZvcm0gdmVjMyBkaWZmdXNlO1xuICB1bmlmb3JtIHZlYzMgZW1pc3NpdmU7XG4gIHVuaWZvcm0gZmxvYXQgb3BhY2l0eTtcbiAgXG4gIHZhcnlpbmcgdmVjMyB2TGlnaHRGcm9udDtcbiAgXG4gICNpZmRlZiBET1VCTEVfU0lERURcbiAgXG4gICAgdmFyeWluZyB2ZWMzIHZMaWdodEJhY2s7XG4gIFxuICAjZW5kaWZcbiAgXG4gICNpbmNsdWRlIDxjb21tb24+XG4gICNpbmNsdWRlIDxwYWNraW5nPlxuICAjaW5jbHVkZSA8ZGl0aGVyaW5nX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxjb2xvcl9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8dXZfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPHV2Ml9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8bWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxhbHBoYW1hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8YW9tYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGxpZ2h0bWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxlbWlzc2l2ZW1hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8ZW52bWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxic2Rmcz5cbiAgI2luY2x1ZGUgPGxpZ2h0c19wYXJzPlxuICAjaW5jbHVkZSA8Zm9nX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxzaGFkb3dtYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPHNoYWRvd21hc2tfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPHNwZWN1bGFybWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX3BhcnNfZnJhZ21lbnQ+XG4gIFxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50UGFyYW1ldGVycycpfVxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZhcnlpbmdQYXJhbWV0ZXJzJyl9XG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRGdW5jdGlvbnMnKX1cbiAgXG4gIHZvaWQgbWFpbigpIHtcbiAgXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudEluaXQnKX1cbiAgXG4gICAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc19mcmFnbWVudD5cblxuICAgIHZlYzQgZGlmZnVzZUNvbG9yID0gdmVjNCggZGlmZnVzZSwgb3BhY2l0eSApO1xuICAgIFJlZmxlY3RlZExpZ2h0IHJlZmxlY3RlZExpZ2h0ID0gUmVmbGVjdGVkTGlnaHQoIHZlYzMoIDAuMCApLCB2ZWMzKCAwLjAgKSwgdmVjMyggMC4wICksIHZlYzMoIDAuMCApICk7XG4gICAgdmVjMyB0b3RhbEVtaXNzaXZlUmFkaWFuY2UgPSBlbWlzc2l2ZTtcblx0XG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudERpZmZ1c2UnKX1cbiAgXG4gICAgI2luY2x1ZGUgPGxvZ2RlcHRoYnVmX2ZyYWdtZW50PlxuXG4gICAgJHsodGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRNYXAnKSB8fCAnI2luY2x1ZGUgPG1hcF9mcmFnbWVudD4nKX1cblxuICAgICNpbmNsdWRlIDxjb2xvcl9mcmFnbWVudD5cbiAgICAjaW5jbHVkZSA8YWxwaGFtYXBfZnJhZ21lbnQ+XG4gICAgI2luY2x1ZGUgPGFscGhhdGVzdF9mcmFnbWVudD5cbiAgICAjaW5jbHVkZSA8c3BlY3VsYXJtYXBfZnJhZ21lbnQ+XG5cbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50RW1pc3NpdmUnKX1cblxuICAgICNpbmNsdWRlIDxlbWlzc2l2ZW1hcF9mcmFnbWVudD5cbiAgXG4gICAgLy8gYWNjdW11bGF0aW9uXG4gICAgcmVmbGVjdGVkTGlnaHQuaW5kaXJlY3REaWZmdXNlID0gZ2V0QW1iaWVudExpZ2h0SXJyYWRpYW5jZSggYW1iaWVudExpZ2h0Q29sb3IgKTtcbiAgXG4gICAgI2luY2x1ZGUgPGxpZ2h0bWFwX2ZyYWdtZW50PlxuICBcbiAgICByZWZsZWN0ZWRMaWdodC5pbmRpcmVjdERpZmZ1c2UgKj0gQlJERl9EaWZmdXNlX0xhbWJlcnQoIGRpZmZ1c2VDb2xvci5yZ2IgKTtcbiAgXG4gICAgI2lmZGVmIERPVUJMRV9TSURFRFxuICBcbiAgICAgIHJlZmxlY3RlZExpZ2h0LmRpcmVjdERpZmZ1c2UgPSAoIGdsX0Zyb250RmFjaW5nICkgPyB2TGlnaHRGcm9udCA6IHZMaWdodEJhY2s7XG4gIFxuICAgICNlbHNlXG4gIFxuICAgICAgcmVmbGVjdGVkTGlnaHQuZGlyZWN0RGlmZnVzZSA9IHZMaWdodEZyb250O1xuICBcbiAgICAjZW5kaWZcbiAgXG4gICAgcmVmbGVjdGVkTGlnaHQuZGlyZWN0RGlmZnVzZSAqPSBCUkRGX0RpZmZ1c2VfTGFtYmVydCggZGlmZnVzZUNvbG9yLnJnYiApICogZ2V0U2hhZG93TWFzaygpO1xuICBcbiAgICAvLyBtb2R1bGF0aW9uXG4gICAgI2luY2x1ZGUgPGFvbWFwX2ZyYWdtZW50PlxuICBcbiAgICB2ZWMzIG91dGdvaW5nTGlnaHQgPSByZWZsZWN0ZWRMaWdodC5kaXJlY3REaWZmdXNlICsgcmVmbGVjdGVkTGlnaHQuaW5kaXJlY3REaWZmdXNlICsgdG90YWxFbWlzc2l2ZVJhZGlhbmNlO1xuICBcbiAgICAjaW5jbHVkZSA8ZW52bWFwX2ZyYWdtZW50PlxuICBcbiAgICBnbF9GcmFnQ29sb3IgPSB2ZWM0KCBvdXRnb2luZ0xpZ2h0LCBkaWZmdXNlQ29sb3IuYSApO1xuICBcbiAgICAjaW5jbHVkZSA8dG9uZW1hcHBpbmdfZnJhZ21lbnQ+XG4gICAgI2luY2x1ZGUgPGVuY29kaW5nc19mcmFnbWVudD5cbiAgICAjaW5jbHVkZSA8Zm9nX2ZyYWdtZW50PlxuICAgICNpbmNsdWRlIDxwcmVtdWx0aXBsaWVkX2FscGhhX2ZyYWdtZW50PlxuICAgICNpbmNsdWRlIDxkaXRoZXJpbmdfZnJhZ21lbnQ+XG4gIH1gO1xufTtcblxuZXhwb3J0IHsgTGFtYmVydEFuaW1hdGlvbk1hdGVyaWFsIH07XG4iLCJpbXBvcnQgeyBTaGFkZXJMaWIgfSBmcm9tICd0aHJlZSc7XG5pbXBvcnQgQmFzZUFuaW1hdGlvbk1hdGVyaWFsIGZyb20gJy4vQmFzZUFuaW1hdGlvbk1hdGVyaWFsJztcblxuLyoqXG4gKiBFeHRlbmRzIFRIUkVFLk1lc2hQaG9uZ01hdGVyaWFsIHdpdGggY3VzdG9tIHNoYWRlciBjaHVua3MuXG4gKlxuICogQHNlZSBodHRwOi8vdGhyZWUtYmFzLWV4YW1wbGVzLnN1cmdlLnNoL2V4YW1wbGVzL21hdGVyaWFsc19waG9uZy9cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gcGFyYW1ldGVycyBPYmplY3QgY29udGFpbmluZyBtYXRlcmlhbCBwcm9wZXJ0aWVzIGFuZCBjdXN0b20gc2hhZGVyIGNodW5rcy5cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBQaG9uZ0FuaW1hdGlvbk1hdGVyaWFsKHBhcmFtZXRlcnMpIHtcbiAgdGhpcy52YXJ5aW5nUGFyYW1ldGVycyA9IFtdO1xuXG4gIHRoaXMudmVydGV4RnVuY3Rpb25zID0gW107XG4gIHRoaXMudmVydGV4UGFyYW1ldGVycyA9IFtdO1xuICB0aGlzLnZlcnRleEluaXQgPSBbXTtcbiAgdGhpcy52ZXJ0ZXhOb3JtYWwgPSBbXTtcbiAgdGhpcy52ZXJ0ZXhQb3NpdGlvbiA9IFtdO1xuICB0aGlzLnZlcnRleENvbG9yID0gW107XG5cbiAgdGhpcy5mcmFnbWVudEZ1bmN0aW9ucyA9IFtdO1xuICB0aGlzLmZyYWdtZW50UGFyYW1ldGVycyA9IFtdO1xuICB0aGlzLmZyYWdtZW50SW5pdCA9IFtdO1xuICB0aGlzLmZyYWdtZW50TWFwID0gW107XG4gIHRoaXMuZnJhZ21lbnREaWZmdXNlID0gW107XG4gIHRoaXMuZnJhZ21lbnRFbWlzc2l2ZSA9IFtdO1xuICB0aGlzLmZyYWdtZW50U3BlY3VsYXIgPSBbXTtcblxuICBCYXNlQW5pbWF0aW9uTWF0ZXJpYWwuY2FsbCh0aGlzLCBwYXJhbWV0ZXJzLCBTaGFkZXJMaWJbJ3Bob25nJ10udW5pZm9ybXMpO1xuXG4gIHRoaXMubGlnaHRzID0gdHJ1ZTtcbiAgdGhpcy52ZXJ0ZXhTaGFkZXIgPSB0aGlzLmNvbmNhdFZlcnRleFNoYWRlcigpO1xuICB0aGlzLmZyYWdtZW50U2hhZGVyID0gdGhpcy5jb25jYXRGcmFnbWVudFNoYWRlcigpO1xufVxuUGhvbmdBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEJhc2VBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUpO1xuUGhvbmdBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBQaG9uZ0FuaW1hdGlvbk1hdGVyaWFsO1xuXG5QaG9uZ0FuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZS5jb25jYXRWZXJ0ZXhTaGFkZXIgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiBgXG4gICNkZWZpbmUgUEhPTkdcblxuICB2YXJ5aW5nIHZlYzMgdlZpZXdQb3NpdGlvbjtcbiAgXG4gICNpZm5kZWYgRkxBVF9TSEFERURcbiAgXG4gICAgdmFyeWluZyB2ZWMzIHZOb3JtYWw7XG4gIFxuICAjZW5kaWZcbiAgXG4gICNpbmNsdWRlIDxjb21tb24+XG4gICNpbmNsdWRlIDx1dl9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPHV2Ml9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPGRpc3BsYWNlbWVudG1hcF9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPGVudm1hcF9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPGNvbG9yX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8Zm9nX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8bW9ycGh0YXJnZXRfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxza2lubmluZ19wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPHNoYWRvd21hcF9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPGxvZ2RlcHRoYnVmX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX3BhcnNfdmVydGV4PlxuICBcbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQYXJhbWV0ZXJzJyl9XG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmFyeWluZ1BhcmFtZXRlcnMnKX1cbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhGdW5jdGlvbnMnKX1cbiAgXG4gIHZvaWQgbWFpbigpIHtcbiAgXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhJbml0Jyl9XG4gIFxuICAgICNpbmNsdWRlIDx1dl92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPHV2Ml92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPGNvbG9yX3ZlcnRleD5cbiAgXG4gICAgI2luY2x1ZGUgPGJlZ2lubm9ybWFsX3ZlcnRleD5cbiAgICBcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleE5vcm1hbCcpfVxuICAgIFxuICAgICNpbmNsdWRlIDxtb3JwaG5vcm1hbF92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPHNraW5iYXNlX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8c2tpbm5vcm1hbF92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPGRlZmF1bHRub3JtYWxfdmVydGV4PlxuICBcbiAgI2lmbmRlZiBGTEFUX1NIQURFRCAvLyBOb3JtYWwgY29tcHV0ZWQgd2l0aCBkZXJpdmF0aXZlcyB3aGVuIEZMQVRfU0hBREVEXG4gIFxuICAgIHZOb3JtYWwgPSBub3JtYWxpemUoIHRyYW5zZm9ybWVkTm9ybWFsICk7XG4gIFxuICAjZW5kaWZcbiAgXG4gICAgI2luY2x1ZGUgPGJlZ2luX3ZlcnRleD5cbiAgICBcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBvc2l0aW9uJyl9XG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhDb2xvcicpfVxuICAgIFxuICAgICNpbmNsdWRlIDxtb3JwaHRhcmdldF92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPHNraW5uaW5nX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8ZGlzcGxhY2VtZW50bWFwX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8cHJvamVjdF92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPGxvZ2RlcHRoYnVmX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX3ZlcnRleD5cbiAgXG4gICAgdlZpZXdQb3NpdGlvbiA9IC0gbXZQb3NpdGlvbi54eXo7XG4gIFxuICAgICNpbmNsdWRlIDx3b3JsZHBvc192ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPGVudm1hcF92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPHNoYWRvd21hcF92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPGZvZ192ZXJ0ZXg+XG4gIH1gO1xufTtcblxuUGhvbmdBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uY2F0RnJhZ21lbnRTaGFkZXIgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiBgXG4gICNkZWZpbmUgUEhPTkdcblxuICB1bmlmb3JtIHZlYzMgZGlmZnVzZTtcbiAgdW5pZm9ybSB2ZWMzIGVtaXNzaXZlO1xuICB1bmlmb3JtIHZlYzMgc3BlY3VsYXI7XG4gIHVuaWZvcm0gZmxvYXQgc2hpbmluZXNzO1xuICB1bmlmb3JtIGZsb2F0IG9wYWNpdHk7XG4gIFxuICAjaW5jbHVkZSA8Y29tbW9uPlxuICAjaW5jbHVkZSA8cGFja2luZz5cbiAgI2luY2x1ZGUgPGRpdGhlcmluZ19wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8Y29sb3JfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPHV2X3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDx1djJfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPG1hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8YWxwaGFtYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGFvbWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxsaWdodG1hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8ZW1pc3NpdmVtYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGVudm1hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8Z3JhZGllbnRtYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGZvZ19wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8YnNkZnM+XG4gICNpbmNsdWRlIDxsaWdodHNfcGFycz5cbiAgI2luY2x1ZGUgPGxpZ2h0c19waG9uZ19wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8c2hhZG93bWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxidW1wbWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxub3JtYWxtYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPHNwZWN1bGFybWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX3BhcnNfZnJhZ21lbnQ+XG4gIFxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50UGFyYW1ldGVycycpfVxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZhcnlpbmdQYXJhbWV0ZXJzJyl9XG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRGdW5jdGlvbnMnKX1cbiAgXG4gIHZvaWQgbWFpbigpIHtcbiAgXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudEluaXQnKX1cbiAgXG4gICAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc19mcmFnbWVudD5cbiAgXG4gICAgdmVjNCBkaWZmdXNlQ29sb3IgPSB2ZWM0KCBkaWZmdXNlLCBvcGFjaXR5ICk7XG4gICAgUmVmbGVjdGVkTGlnaHQgcmVmbGVjdGVkTGlnaHQgPSBSZWZsZWN0ZWRMaWdodCggdmVjMyggMC4wICksIHZlYzMoIDAuMCApLCB2ZWMzKCAwLjAgKSwgdmVjMyggMC4wICkgKTtcbiAgICB2ZWMzIHRvdGFsRW1pc3NpdmVSYWRpYW5jZSA9IGVtaXNzaXZlO1xuICBcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50RGlmZnVzZScpfVxuICBcbiAgICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfZnJhZ21lbnQ+XG5cbiAgICAkeyh0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudE1hcCcpIHx8ICcjaW5jbHVkZSA8bWFwX2ZyYWdtZW50PicpfVxuXG4gICAgI2luY2x1ZGUgPGNvbG9yX2ZyYWdtZW50PlxuICAgICNpbmNsdWRlIDxhbHBoYW1hcF9mcmFnbWVudD5cbiAgICAjaW5jbHVkZSA8YWxwaGF0ZXN0X2ZyYWdtZW50PlxuICAgICNpbmNsdWRlIDxzcGVjdWxhcm1hcF9mcmFnbWVudD5cbiAgICAjaW5jbHVkZSA8bm9ybWFsX2ZyYWdtZW50PlxuICAgIFxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRFbWlzc2l2ZScpfVxuICAgIFxuICAgICNpbmNsdWRlIDxlbWlzc2l2ZW1hcF9mcmFnbWVudD5cbiAgXG4gICAgLy8gYWNjdW11bGF0aW9uXG4gICAgI2luY2x1ZGUgPGxpZ2h0c19waG9uZ19mcmFnbWVudD5cbiAgICBcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50U3BlY3VsYXInKX1cbiAgICBcbiAgICAjaW5jbHVkZSA8bGlnaHRzX3RlbXBsYXRlPlxuICBcbiAgICAvLyBtb2R1bGF0aW9uXG4gICAgI2luY2x1ZGUgPGFvbWFwX2ZyYWdtZW50PlxuICBcbiAgICB2ZWMzIG91dGdvaW5nTGlnaHQgPSByZWZsZWN0ZWRMaWdodC5kaXJlY3REaWZmdXNlICsgcmVmbGVjdGVkTGlnaHQuaW5kaXJlY3REaWZmdXNlICsgcmVmbGVjdGVkTGlnaHQuZGlyZWN0U3BlY3VsYXIgKyByZWZsZWN0ZWRMaWdodC5pbmRpcmVjdFNwZWN1bGFyICsgdG90YWxFbWlzc2l2ZVJhZGlhbmNlO1xuICBcbiAgICAjaW5jbHVkZSA8ZW52bWFwX2ZyYWdtZW50PlxuICBcbiAgICBnbF9GcmFnQ29sb3IgPSB2ZWM0KCBvdXRnb2luZ0xpZ2h0LCBkaWZmdXNlQ29sb3IuYSApO1xuICBcbiAgICAjaW5jbHVkZSA8dG9uZW1hcHBpbmdfZnJhZ21lbnQ+XG4gICAgI2luY2x1ZGUgPGVuY29kaW5nc19mcmFnbWVudD5cbiAgICAjaW5jbHVkZSA8Zm9nX2ZyYWdtZW50PlxuICAgICNpbmNsdWRlIDxwcmVtdWx0aXBsaWVkX2FscGhhX2ZyYWdtZW50PlxuICAgICNpbmNsdWRlIDxkaXRoZXJpbmdfZnJhZ21lbnQ+XG4gIFxuICB9YDtcbn07XG5cbmV4cG9ydCB7IFBob25nQW5pbWF0aW9uTWF0ZXJpYWwgfTtcbiIsImltcG9ydCB7IFNoYWRlckxpYiB9IGZyb20gJ3RocmVlJztcbmltcG9ydCBCYXNlQW5pbWF0aW9uTWF0ZXJpYWwgZnJvbSAnLi9CYXNlQW5pbWF0aW9uTWF0ZXJpYWwnO1xuXG4vKipcbiAqIEV4dGVuZHMgVEhSRUUuTWVzaFN0YW5kYXJkTWF0ZXJpYWwgd2l0aCBjdXN0b20gc2hhZGVyIGNodW5rcy5cbiAqXG4gKiBAc2VlIGh0dHA6Ly90aHJlZS1iYXMtZXhhbXBsZXMuc3VyZ2Uuc2gvZXhhbXBsZXMvbWF0ZXJpYWxzX3N0YW5kYXJkL1xuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBwYXJhbWV0ZXJzIE9iamVjdCBjb250YWluaW5nIG1hdGVyaWFsIHByb3BlcnRpZXMgYW5kIGN1c3RvbSBzaGFkZXIgY2h1bmtzLlxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIFN0YW5kYXJkQW5pbWF0aW9uTWF0ZXJpYWwocGFyYW1ldGVycykge1xuICB0aGlzLnZhcnlpbmdQYXJhbWV0ZXJzID0gW107XG5cbiAgdGhpcy52ZXJ0ZXhGdW5jdGlvbnMgPSBbXTtcbiAgdGhpcy52ZXJ0ZXhQYXJhbWV0ZXJzID0gW107XG4gIHRoaXMudmVydGV4SW5pdCA9IFtdO1xuICB0aGlzLnZlcnRleE5vcm1hbCA9IFtdO1xuICB0aGlzLnZlcnRleFBvc2l0aW9uID0gW107XG4gIHRoaXMudmVydGV4Q29sb3IgPSBbXTtcblxuICB0aGlzLmZyYWdtZW50RnVuY3Rpb25zID0gW107XG4gIHRoaXMuZnJhZ21lbnRQYXJhbWV0ZXJzID0gW107XG4gIHRoaXMuZnJhZ21lbnRJbml0ID0gW107XG4gIHRoaXMuZnJhZ21lbnRNYXAgPSBbXTtcbiAgdGhpcy5mcmFnbWVudERpZmZ1c2UgPSBbXTtcbiAgdGhpcy5mcmFnbWVudFJvdWdobmVzcyA9IFtdO1xuICB0aGlzLmZyYWdtZW50TWV0YWxuZXNzID0gW107XG4gIHRoaXMuZnJhZ21lbnRFbWlzc2l2ZSA9IFtdO1xuXG4gIEJhc2VBbmltYXRpb25NYXRlcmlhbC5jYWxsKHRoaXMsIHBhcmFtZXRlcnMsIFNoYWRlckxpYlsnc3RhbmRhcmQnXS51bmlmb3Jtcyk7XG5cbiAgdGhpcy5saWdodHMgPSB0cnVlO1xuICB0aGlzLnZlcnRleFNoYWRlciA9IHRoaXMuY29uY2F0VmVydGV4U2hhZGVyKCk7XG4gIHRoaXMuZnJhZ21lbnRTaGFkZXIgPSB0aGlzLmNvbmNhdEZyYWdtZW50U2hhZGVyKCk7XG59XG5TdGFuZGFyZEFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoQmFzZUFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZSk7XG5TdGFuZGFyZEFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFN0YW5kYXJkQW5pbWF0aW9uTWF0ZXJpYWw7XG5cblN0YW5kYXJkQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlLmNvbmNhdFZlcnRleFNoYWRlciA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIGBcbiAgI2RlZmluZSBQSFlTSUNBTFxuXG4gIHZhcnlpbmcgdmVjMyB2Vmlld1Bvc2l0aW9uO1xuICBcbiAgI2lmbmRlZiBGTEFUX1NIQURFRFxuICBcbiAgICB2YXJ5aW5nIHZlYzMgdk5vcm1hbDtcbiAgXG4gICNlbmRpZlxuICBcbiAgI2luY2x1ZGUgPGNvbW1vbj5cbiAgI2luY2x1ZGUgPHV2X3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8dXYyX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8ZGlzcGxhY2VtZW50bWFwX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8Y29sb3JfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxmb2dfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxtb3JwaHRhcmdldF9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPHNraW5uaW5nX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8c2hhZG93bWFwX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfcGFyc192ZXJ0ZXg+XG4gIFxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBhcmFtZXRlcnMnKX1cbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2YXJ5aW5nUGFyYW1ldGVycycpfVxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleEZ1bmN0aW9ucycpfVxuICBcbiAgdm9pZCBtYWluKCkge1xuXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhJbml0Jyl9XG5cbiAgICAjaW5jbHVkZSA8dXZfdmVydGV4PlxuICAgICNpbmNsdWRlIDx1djJfdmVydGV4PlxuICAgICNpbmNsdWRlIDxjb2xvcl92ZXJ0ZXg+XG4gIFxuICAgICNpbmNsdWRlIDxiZWdpbm5vcm1hbF92ZXJ0ZXg+XG4gICAgXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhOb3JtYWwnKX1cbiAgICBcbiAgICAjaW5jbHVkZSA8bW9ycGhub3JtYWxfdmVydGV4PlxuICAgICNpbmNsdWRlIDxza2luYmFzZV92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPHNraW5ub3JtYWxfdmVydGV4PlxuICAgICNpbmNsdWRlIDxkZWZhdWx0bm9ybWFsX3ZlcnRleD5cbiAgXG4gICNpZm5kZWYgRkxBVF9TSEFERUQgLy8gTm9ybWFsIGNvbXB1dGVkIHdpdGggZGVyaXZhdGl2ZXMgd2hlbiBGTEFUX1NIQURFRFxuICBcbiAgICB2Tm9ybWFsID0gbm9ybWFsaXplKCB0cmFuc2Zvcm1lZE5vcm1hbCApO1xuICBcbiAgI2VuZGlmXG4gIFxuICAgICNpbmNsdWRlIDxiZWdpbl92ZXJ0ZXg+XG4gICAgXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQb3NpdGlvbicpfVxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4Q29sb3InKX1cbiAgICBcbiAgICAjaW5jbHVkZSA8bW9ycGh0YXJnZXRfdmVydGV4PlxuICAgICNpbmNsdWRlIDxza2lubmluZ192ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPGRpc3BsYWNlbWVudG1hcF92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPHByb2plY3RfdmVydGV4PlxuICAgICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc192ZXJ0ZXg+XG4gIFxuICAgIHZWaWV3UG9zaXRpb24gPSAtIG12UG9zaXRpb24ueHl6O1xuICBcbiAgICAjaW5jbHVkZSA8d29ybGRwb3NfdmVydGV4PlxuICAgICNpbmNsdWRlIDxzaGFkb3dtYXBfdmVydGV4PlxuICAgICNpbmNsdWRlIDxmb2dfdmVydGV4PlxuICB9YDtcbn07XG5cblN0YW5kYXJkQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlLmNvbmNhdEZyYWdtZW50U2hhZGVyID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gYFxuICAjZGVmaW5lIFBIWVNJQ0FMXG4gIFxuICB1bmlmb3JtIHZlYzMgZGlmZnVzZTtcbiAgdW5pZm9ybSB2ZWMzIGVtaXNzaXZlO1xuICB1bmlmb3JtIGZsb2F0IHJvdWdobmVzcztcbiAgdW5pZm9ybSBmbG9hdCBtZXRhbG5lc3M7XG4gIHVuaWZvcm0gZmxvYXQgb3BhY2l0eTtcbiAgXG4gICNpZm5kZWYgU1RBTkRBUkRcbiAgICB1bmlmb3JtIGZsb2F0IGNsZWFyQ29hdDtcbiAgICB1bmlmb3JtIGZsb2F0IGNsZWFyQ29hdFJvdWdobmVzcztcbiAgI2VuZGlmXG4gIFxuICB2YXJ5aW5nIHZlYzMgdlZpZXdQb3NpdGlvbjtcbiAgXG4gICNpZm5kZWYgRkxBVF9TSEFERURcbiAgXG4gICAgdmFyeWluZyB2ZWMzIHZOb3JtYWw7XG4gIFxuICAjZW5kaWZcbiAgXG4gICNpbmNsdWRlIDxjb21tb24+XG4gICNpbmNsdWRlIDxwYWNraW5nPlxuICAjaW5jbHVkZSA8ZGl0aGVyaW5nX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxjb2xvcl9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8dXZfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPHV2Ml9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8bWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxhbHBoYW1hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8YW9tYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGxpZ2h0bWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxlbWlzc2l2ZW1hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8ZW52bWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxmb2dfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGJzZGZzPlxuICAjaW5jbHVkZSA8Y3ViZV91dl9yZWZsZWN0aW9uX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8bGlnaHRzX3BhcnM+XG4gICNpbmNsdWRlIDxsaWdodHNfcGh5c2ljYWxfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPHNoYWRvd21hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8YnVtcG1hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8bm9ybWFsbWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxyb3VnaG5lc3NtYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPG1ldGFsbmVzc21hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc19wYXJzX2ZyYWdtZW50PlxuICBcbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudFBhcmFtZXRlcnMnKX1cbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2YXJ5aW5nUGFyYW1ldGVycycpfVxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50RnVuY3Rpb25zJyl9XG4gIFxuICB2b2lkIG1haW4oKSB7XG4gIFxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRJbml0Jyl9XG4gIFxuICAgICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfZnJhZ21lbnQ+XG4gIFxuICAgIHZlYzQgZGlmZnVzZUNvbG9yID0gdmVjNCggZGlmZnVzZSwgb3BhY2l0eSApO1xuICAgIFJlZmxlY3RlZExpZ2h0IHJlZmxlY3RlZExpZ2h0ID0gUmVmbGVjdGVkTGlnaHQoIHZlYzMoIDAuMCApLCB2ZWMzKCAwLjAgKSwgdmVjMyggMC4wICksIHZlYzMoIDAuMCApICk7XG4gICAgdmVjMyB0b3RhbEVtaXNzaXZlUmFkaWFuY2UgPSBlbWlzc2l2ZTtcbiAgXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudERpZmZ1c2UnKX1cbiAgXG4gICAgI2luY2x1ZGUgPGxvZ2RlcHRoYnVmX2ZyYWdtZW50PlxuXG4gICAgJHsodGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRNYXAnKSB8fCAnI2luY2x1ZGUgPG1hcF9mcmFnbWVudD4nKX1cblxuICAgICNpbmNsdWRlIDxjb2xvcl9mcmFnbWVudD5cbiAgICAjaW5jbHVkZSA8YWxwaGFtYXBfZnJhZ21lbnQ+XG4gICAgI2luY2x1ZGUgPGFscGhhdGVzdF9mcmFnbWVudD5cbiAgICBcbiAgICBmbG9hdCByb3VnaG5lc3NGYWN0b3IgPSByb3VnaG5lc3M7XG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudFJvdWdobmVzcycpfVxuICAgICNpZmRlZiBVU0VfUk9VR0hORVNTTUFQXG4gICAgXG4gICAgICB2ZWM0IHRleGVsUm91Z2huZXNzID0gdGV4dHVyZTJEKCByb3VnaG5lc3NNYXAsIHZVdiApO1xuICAgIFxuICAgICAgLy8gcmVhZHMgY2hhbm5lbCBHLCBjb21wYXRpYmxlIHdpdGggYSBjb21iaW5lZCBPY2NsdXNpb25Sb3VnaG5lc3NNZXRhbGxpYyAoUkdCKSB0ZXh0dXJlXG4gICAgICByb3VnaG5lc3NGYWN0b3IgKj0gdGV4ZWxSb3VnaG5lc3MuZztcbiAgICBcbiAgICAjZW5kaWZcbiAgICBcbiAgICBmbG9hdCBtZXRhbG5lc3NGYWN0b3IgPSBtZXRhbG5lc3M7XG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudE1ldGFsbmVzcycpfVxuICAgICNpZmRlZiBVU0VfTUVUQUxORVNTTUFQXG4gICAgXG4gICAgICB2ZWM0IHRleGVsTWV0YWxuZXNzID0gdGV4dHVyZTJEKCBtZXRhbG5lc3NNYXAsIHZVdiApO1xuICAgICAgbWV0YWxuZXNzRmFjdG9yICo9IHRleGVsTWV0YWxuZXNzLmI7XG4gICAgXG4gICAgI2VuZGlmXG4gICAgXG4gICAgI2luY2x1ZGUgPG5vcm1hbF9mcmFnbWVudD5cbiAgICBcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50RW1pc3NpdmUnKX1cbiAgICBcbiAgICAjaW5jbHVkZSA8ZW1pc3NpdmVtYXBfZnJhZ21lbnQ+XG4gIFxuICAgIC8vIGFjY3VtdWxhdGlvblxuICAgICNpbmNsdWRlIDxsaWdodHNfcGh5c2ljYWxfZnJhZ21lbnQ+XG4gICAgI2luY2x1ZGUgPGxpZ2h0c190ZW1wbGF0ZT5cbiAgXG4gICAgLy8gbW9kdWxhdGlvblxuICAgICNpbmNsdWRlIDxhb21hcF9mcmFnbWVudD5cbiAgXG4gICAgdmVjMyBvdXRnb2luZ0xpZ2h0ID0gcmVmbGVjdGVkTGlnaHQuZGlyZWN0RGlmZnVzZSArIHJlZmxlY3RlZExpZ2h0LmluZGlyZWN0RGlmZnVzZSArIHJlZmxlY3RlZExpZ2h0LmRpcmVjdFNwZWN1bGFyICsgcmVmbGVjdGVkTGlnaHQuaW5kaXJlY3RTcGVjdWxhciArIHRvdGFsRW1pc3NpdmVSYWRpYW5jZTtcbiAgXG4gICAgZ2xfRnJhZ0NvbG9yID0gdmVjNCggb3V0Z29pbmdMaWdodCwgZGlmZnVzZUNvbG9yLmEgKTtcbiAgXG4gICAgI2luY2x1ZGUgPHRvbmVtYXBwaW5nX2ZyYWdtZW50PlxuICAgICNpbmNsdWRlIDxlbmNvZGluZ3NfZnJhZ21lbnQ+XG4gICAgI2luY2x1ZGUgPGZvZ19mcmFnbWVudD5cbiAgICAjaW5jbHVkZSA8cHJlbXVsdGlwbGllZF9hbHBoYV9mcmFnbWVudD5cbiAgICAjaW5jbHVkZSA8ZGl0aGVyaW5nX2ZyYWdtZW50PlxuICBcbiAgfWA7XG59O1xuXG5leHBvcnQgeyBTdGFuZGFyZEFuaW1hdGlvbk1hdGVyaWFsIH07XG4iLCJpbXBvcnQgeyBTaGFkZXJMaWIgfSBmcm9tICd0aHJlZSc7XG5pbXBvcnQgQmFzZUFuaW1hdGlvbk1hdGVyaWFsIGZyb20gJy4vQmFzZUFuaW1hdGlvbk1hdGVyaWFsJztcblxuLyoqXG4gKiBFeHRlbmRzIFRIUkVFLlBvaW50c01hdGVyaWFsIHdpdGggY3VzdG9tIHNoYWRlciBjaHVua3MuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IHBhcmFtZXRlcnMgT2JqZWN0IGNvbnRhaW5pbmcgbWF0ZXJpYWwgcHJvcGVydGllcyBhbmQgY3VzdG9tIHNoYWRlciBjaHVua3MuXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gUG9pbnRzQW5pbWF0aW9uTWF0ZXJpYWwocGFyYW1ldGVycykge1xuICB0aGlzLnZhcnlpbmdQYXJhbWV0ZXJzID0gW107XG4gIFxuICB0aGlzLnZlcnRleEZ1bmN0aW9ucyA9IFtdO1xuICB0aGlzLnZlcnRleFBhcmFtZXRlcnMgPSBbXTtcbiAgdGhpcy52ZXJ0ZXhJbml0ID0gW107XG4gIHRoaXMudmVydGV4UG9zaXRpb24gPSBbXTtcbiAgdGhpcy52ZXJ0ZXhDb2xvciA9IFtdO1xuICBcbiAgdGhpcy5mcmFnbWVudEZ1bmN0aW9ucyA9IFtdO1xuICB0aGlzLmZyYWdtZW50UGFyYW1ldGVycyA9IFtdO1xuICB0aGlzLmZyYWdtZW50SW5pdCA9IFtdO1xuICB0aGlzLmZyYWdtZW50TWFwID0gW107XG4gIHRoaXMuZnJhZ21lbnREaWZmdXNlID0gW107XG4gIC8vIHVzZSBmcmFnbWVudCBzaGFkZXIgdG8gc2hhcGUgdG8gcG9pbnQsIHJlZmVyZW5jZTogaHR0cHM6Ly90aGVib29rb2ZzaGFkZXJzLmNvbS8wNy9cbiAgdGhpcy5mcmFnbWVudFNoYXBlID0gW107XG4gIFxuICBCYXNlQW5pbWF0aW9uTWF0ZXJpYWwuY2FsbCh0aGlzLCBwYXJhbWV0ZXJzLCBTaGFkZXJMaWJbJ3BvaW50cyddLnVuaWZvcm1zKTtcbiAgXG4gIHRoaXMudmVydGV4U2hhZGVyID0gdGhpcy5jb25jYXRWZXJ0ZXhTaGFkZXIoKTtcbiAgdGhpcy5mcmFnbWVudFNoYWRlciA9IHRoaXMuY29uY2F0RnJhZ21lbnRTaGFkZXIoKTtcbn1cblxuUG9pbnRzQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShCYXNlQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlKTtcblBvaW50c0FuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFBvaW50c0FuaW1hdGlvbk1hdGVyaWFsO1xuXG5Qb2ludHNBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uY2F0VmVydGV4U2hhZGVyID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gYFxuICB1bmlmb3JtIGZsb2F0IHNpemU7XG4gIHVuaWZvcm0gZmxvYXQgc2NhbGU7XG4gIFxuICAjaW5jbHVkZSA8Y29tbW9uPlxuICAjaW5jbHVkZSA8Y29sb3JfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxmb2dfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxzaGFkb3dtYXBfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc19wYXJzX3ZlcnRleD5cbiAgXG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UGFyYW1ldGVycycpfVxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZhcnlpbmdQYXJhbWV0ZXJzJyl9XG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4RnVuY3Rpb25zJyl9XG4gIFxuICB2b2lkIG1haW4oKSB7XG4gIFxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4SW5pdCcpfVxuICBcbiAgICAjaW5jbHVkZSA8Y29sb3JfdmVydGV4PlxuICAgICNpbmNsdWRlIDxiZWdpbl92ZXJ0ZXg+XG4gICAgXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQb3NpdGlvbicpfVxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4Q29sb3InKX1cbiAgICBcbiAgICAjaW5jbHVkZSA8cHJvamVjdF92ZXJ0ZXg+XG4gIFxuICAgICNpZmRlZiBVU0VfU0laRUFUVEVOVUFUSU9OXG4gICAgICBnbF9Qb2ludFNpemUgPSBzaXplICogKCBzY2FsZSAvIC0gbXZQb3NpdGlvbi56ICk7XG4gICAgI2Vsc2VcbiAgICAgIGdsX1BvaW50U2l6ZSA9IHNpemU7XG4gICAgI2VuZGlmXG4gIFxuICAgICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc192ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPHdvcmxkcG9zX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8c2hhZG93bWFwX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8Zm9nX3ZlcnRleD5cbiAgfWA7XG59O1xuXG5Qb2ludHNBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uY2F0RnJhZ21lbnRTaGFkZXIgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiBgXG4gIHVuaWZvcm0gdmVjMyBkaWZmdXNlO1xuICB1bmlmb3JtIGZsb2F0IG9wYWNpdHk7XG4gIFxuICAjaW5jbHVkZSA8Y29tbW9uPlxuICAjaW5jbHVkZSA8cGFja2luZz5cbiAgI2luY2x1ZGUgPGNvbG9yX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxtYXBfcGFydGljbGVfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGZvZ19wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8c2hhZG93bWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX3BhcnNfZnJhZ21lbnQ+XG4gIFxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50UGFyYW1ldGVycycpfVxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZhcnlpbmdQYXJhbWV0ZXJzJyl9XG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRGdW5jdGlvbnMnKX1cbiAgXG4gIHZvaWQgbWFpbigpIHtcbiAgXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudEluaXQnKX1cbiAgXG4gICAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc19mcmFnbWVudD5cbiAgXG4gICAgdmVjMyBvdXRnb2luZ0xpZ2h0ID0gdmVjMyggMC4wICk7XG4gICAgdmVjNCBkaWZmdXNlQ29sb3IgPSB2ZWM0KCBkaWZmdXNlLCBvcGFjaXR5ICk7XG4gIFxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnREaWZmdXNlJyl9XG4gIFxuICAgICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl9mcmFnbWVudD5cblxuICAgICR7KHRoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50TWFwJykgfHwgJyNpbmNsdWRlIDxtYXBfcGFydGljbGVfZnJhZ21lbnQ+Jyl9XG5cbiAgICAjaW5jbHVkZSA8Y29sb3JfZnJhZ21lbnQ+XG4gICAgI2luY2x1ZGUgPGFscGhhdGVzdF9mcmFnbWVudD5cbiAgXG4gICAgb3V0Z29pbmdMaWdodCA9IGRpZmZ1c2VDb2xvci5yZ2I7XG4gIFxuICAgIGdsX0ZyYWdDb2xvciA9IHZlYzQoIG91dGdvaW5nTGlnaHQsIGRpZmZ1c2VDb2xvci5hICk7XG4gICAgXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudFNoYXBlJyl9XG4gIFxuICAgICNpbmNsdWRlIDxwcmVtdWx0aXBsaWVkX2FscGhhX2ZyYWdtZW50PlxuICAgICNpbmNsdWRlIDx0b25lbWFwcGluZ19mcmFnbWVudD5cbiAgICAjaW5jbHVkZSA8ZW5jb2RpbmdzX2ZyYWdtZW50PlxuICAgICNpbmNsdWRlIDxmb2dfZnJhZ21lbnQ+XG4gIH1gO1xufTtcblxuZXhwb3J0IHsgUG9pbnRzQW5pbWF0aW9uTWF0ZXJpYWwgfTtcbiIsImltcG9ydCB7IFNoYWRlckxpYiwgVW5pZm9ybXNVdGlscywgUkdCQURlcHRoUGFja2luZyB9IGZyb20gJ3RocmVlJztcbmltcG9ydCBCYXNlQW5pbWF0aW9uTWF0ZXJpYWwgZnJvbSAnLi9CYXNlQW5pbWF0aW9uTWF0ZXJpYWwnO1xuXG5mdW5jdGlvbiBEZXB0aEFuaW1hdGlvbk1hdGVyaWFsKHBhcmFtZXRlcnMpIHtcbiAgdGhpcy5kZXB0aFBhY2tpbmcgPSBSR0JBRGVwdGhQYWNraW5nO1xuICB0aGlzLmNsaXBwaW5nID0gdHJ1ZTtcblxuICB0aGlzLnZlcnRleEZ1bmN0aW9ucyA9IFtdO1xuICB0aGlzLnZlcnRleFBhcmFtZXRlcnMgPSBbXTtcbiAgdGhpcy52ZXJ0ZXhJbml0ID0gW107XG4gIHRoaXMudmVydGV4UG9zaXRpb24gPSBbXTtcblxuICBCYXNlQW5pbWF0aW9uTWF0ZXJpYWwuY2FsbCh0aGlzLCBwYXJhbWV0ZXJzKTtcbiAgXG4gIHRoaXMudW5pZm9ybXMgPSBVbmlmb3Jtc1V0aWxzLm1lcmdlKFtTaGFkZXJMaWJbJ2RlcHRoJ10udW5pZm9ybXMsIHRoaXMudW5pZm9ybXNdKTtcbiAgdGhpcy52ZXJ0ZXhTaGFkZXIgPSB0aGlzLmNvbmNhdFZlcnRleFNoYWRlcigpO1xuICB0aGlzLmZyYWdtZW50U2hhZGVyID0gU2hhZGVyTGliWydkZXB0aCddLmZyYWdtZW50U2hhZGVyO1xufVxuRGVwdGhBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEJhc2VBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUpO1xuRGVwdGhBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBEZXB0aEFuaW1hdGlvbk1hdGVyaWFsO1xuXG5EZXB0aEFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZS5jb25jYXRWZXJ0ZXhTaGFkZXIgPSBmdW5jdGlvbiAoKSB7XG4gIFxuICByZXR1cm4gYFxuICAjaW5jbHVkZSA8Y29tbW9uPlxuICAjaW5jbHVkZSA8dXZfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxkaXNwbGFjZW1lbnRtYXBfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxtb3JwaHRhcmdldF9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPHNraW5uaW5nX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfcGFyc192ZXJ0ZXg+XG4gIFxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBhcmFtZXRlcnMnKX1cbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhGdW5jdGlvbnMnKX1cbiAgXG4gIHZvaWQgbWFpbigpIHtcbiAgXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhJbml0Jyl9XG4gIFxuICAgICNpbmNsdWRlIDx1dl92ZXJ0ZXg+XG4gIFxuICAgICNpbmNsdWRlIDxza2luYmFzZV92ZXJ0ZXg+XG4gIFxuICAgICNpZmRlZiBVU0VfRElTUExBQ0VNRU5UTUFQXG4gIFxuICAgICAgI2luY2x1ZGUgPGJlZ2lubm9ybWFsX3ZlcnRleD5cbiAgICAgICNpbmNsdWRlIDxtb3JwaG5vcm1hbF92ZXJ0ZXg+XG4gICAgICAjaW5jbHVkZSA8c2tpbm5vcm1hbF92ZXJ0ZXg+XG4gIFxuICAgICNlbmRpZlxuICBcbiAgICAjaW5jbHVkZSA8YmVnaW5fdmVydGV4PlxuICAgIFxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UG9zaXRpb24nKX1cblxuICAgICNpbmNsdWRlIDxtb3JwaHRhcmdldF92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPHNraW5uaW5nX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8ZGlzcGxhY2VtZW50bWFwX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8cHJvamVjdF92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPGxvZ2RlcHRoYnVmX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX3ZlcnRleD5cbiAgfWA7XG59O1xuXG5leHBvcnQgeyBEZXB0aEFuaW1hdGlvbk1hdGVyaWFsIH07XG4iLCJpbXBvcnQgeyBTaGFkZXJMaWIsIFVuaWZvcm1zVXRpbHMsIFJHQkFEZXB0aFBhY2tpbmcgfSBmcm9tICd0aHJlZSc7XG5pbXBvcnQgQmFzZUFuaW1hdGlvbk1hdGVyaWFsIGZyb20gJy4vQmFzZUFuaW1hdGlvbk1hdGVyaWFsJztcblxuZnVuY3Rpb24gRGlzdGFuY2VBbmltYXRpb25NYXRlcmlhbChwYXJhbWV0ZXJzKSB7XG4gIHRoaXMuZGVwdGhQYWNraW5nID0gUkdCQURlcHRoUGFja2luZztcbiAgdGhpcy5jbGlwcGluZyA9IHRydWU7XG5cbiAgdGhpcy52ZXJ0ZXhGdW5jdGlvbnMgPSBbXTtcbiAgdGhpcy52ZXJ0ZXhQYXJhbWV0ZXJzID0gW107XG4gIHRoaXMudmVydGV4SW5pdCA9IFtdO1xuICB0aGlzLnZlcnRleFBvc2l0aW9uID0gW107XG5cbiAgQmFzZUFuaW1hdGlvbk1hdGVyaWFsLmNhbGwodGhpcywgcGFyYW1ldGVycyk7XG4gIFxuICB0aGlzLnVuaWZvcm1zID0gVW5pZm9ybXNVdGlscy5tZXJnZShbU2hhZGVyTGliWydkaXN0YW5jZVJHQkEnXS51bmlmb3JtcywgdGhpcy51bmlmb3Jtc10pO1xuICB0aGlzLnZlcnRleFNoYWRlciA9IHRoaXMuY29uY2F0VmVydGV4U2hhZGVyKCk7XG4gIHRoaXMuZnJhZ21lbnRTaGFkZXIgPSBTaGFkZXJMaWJbJ2Rpc3RhbmNlUkdCQSddLmZyYWdtZW50U2hhZGVyO1xufVxuRGlzdGFuY2VBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEJhc2VBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUpO1xuRGlzdGFuY2VBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBEaXN0YW5jZUFuaW1hdGlvbk1hdGVyaWFsO1xuXG5EaXN0YW5jZUFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZS5jb25jYXRWZXJ0ZXhTaGFkZXIgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiBgXG4gICNkZWZpbmUgRElTVEFOQ0VcblxuICB2YXJ5aW5nIHZlYzMgdldvcmxkUG9zaXRpb247XG4gIFxuICAjaW5jbHVkZSA8Y29tbW9uPlxuICAjaW5jbHVkZSA8dXZfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxkaXNwbGFjZW1lbnRtYXBfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxtb3JwaHRhcmdldF9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPHNraW5uaW5nX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX3BhcnNfdmVydGV4PlxuICBcbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQYXJhbWV0ZXJzJyl9XG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4RnVuY3Rpb25zJyl9XG4gIFxuICB2b2lkIG1haW4oKSB7XG5cbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleEluaXQnKX1cbiAgXG4gICAgI2luY2x1ZGUgPHV2X3ZlcnRleD5cbiAgXG4gICAgI2luY2x1ZGUgPHNraW5iYXNlX3ZlcnRleD5cbiAgXG4gICAgI2lmZGVmIFVTRV9ESVNQTEFDRU1FTlRNQVBcbiAgXG4gICAgICAjaW5jbHVkZSA8YmVnaW5ub3JtYWxfdmVydGV4PlxuICAgICAgI2luY2x1ZGUgPG1vcnBobm9ybWFsX3ZlcnRleD5cbiAgICAgICNpbmNsdWRlIDxza2lubm9ybWFsX3ZlcnRleD5cbiAgXG4gICAgI2VuZGlmXG4gIFxuICAgICNpbmNsdWRlIDxiZWdpbl92ZXJ0ZXg+XG4gICAgXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQb3NpdGlvbicpfVxuXG4gICAgI2luY2x1ZGUgPG1vcnBodGFyZ2V0X3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8c2tpbm5pbmdfdmVydGV4PlxuICAgICNpbmNsdWRlIDxkaXNwbGFjZW1lbnRtYXBfdmVydGV4PlxuICAgICNpbmNsdWRlIDxwcm9qZWN0X3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8d29ybGRwb3NfdmVydGV4PlxuICAgICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfdmVydGV4PlxuICBcbiAgICB2V29ybGRQb3NpdGlvbiA9IHdvcmxkUG9zaXRpb24ueHl6O1xuICBcbiAgfWA7XG59O1xuXG5leHBvcnQgeyBEaXN0YW5jZUFuaW1hdGlvbk1hdGVyaWFsIH07XG4iLCJpbXBvcnQgeyBCdWZmZXJHZW9tZXRyeSwgQnVmZmVyQXR0cmlidXRlLCBWZWN0b3IyIH0gZnJvbSAndGhyZWUnO1xuLyoqXG4gKiBBIEJ1ZmZlckdlb21ldHJ5IHdoZXJlIGEgJ3ByZWZhYicgZ2VvbWV0cnkgaXMgcmVwZWF0ZWQgYSBudW1iZXIgb2YgdGltZXMuXG4gKlxuICogQHBhcmFtIHtHZW9tZXRyeXxCdWZmZXJHZW9tZXRyeX0gcHJlZmFiIFRoZSBHZW9tZXRyeSBpbnN0YW5jZSB0byByZXBlYXQuXG4gKiBAcGFyYW0ge051bWJlcn0gY291bnQgVGhlIG51bWJlciBvZiB0aW1lcyB0byByZXBlYXQgdGhlIGdlb21ldHJ5LlxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIFByZWZhYkJ1ZmZlckdlb21ldHJ5KHByZWZhYiwgY291bnQpIHtcbiAgQnVmZmVyR2VvbWV0cnkuY2FsbCh0aGlzKTtcbiAgXG4gIC8qKlxuICAgKiBBIHJlZmVyZW5jZSB0byB0aGUgcHJlZmFiIGdlb21ldHJ5IHVzZWQgdG8gY3JlYXRlIHRoaXMgaW5zdGFuY2UuXG4gICAqIEB0eXBlIHtHZW9tZXRyeXxCdWZmZXJHZW9tZXRyeX1cbiAgICovXG4gIHRoaXMucHJlZmFiR2VvbWV0cnkgPSBwcmVmYWI7XG4gIHRoaXMuaXNQcmVmYWJCdWZmZXJHZW9tZXRyeSA9IHByZWZhYi5pc0J1ZmZlckdlb21ldHJ5O1xuICBcbiAgLyoqXG4gICAqIE51bWJlciBvZiBwcmVmYWJzLlxuICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgKi9cbiAgdGhpcy5wcmVmYWJDb3VudCA9IGNvdW50O1xuICBcbiAgLyoqXG4gICAqIE51bWJlciBvZiB2ZXJ0aWNlcyBvZiB0aGUgcHJlZmFiLlxuICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgKi9cbiAgaWYgKHRoaXMuaXNQcmVmYWJCdWZmZXJHZW9tZXRyeSkge1xuICAgIHRoaXMucHJlZmFiVmVydGV4Q291bnQgPSBwcmVmYWIuYXR0cmlidXRlcy5wb3NpdGlvbi5jb3VudDtcbiAgfVxuICBlbHNlIHtcbiAgICB0aGlzLnByZWZhYlZlcnRleENvdW50ID0gcHJlZmFiLnZlcnRpY2VzLmxlbmd0aDtcbiAgfVxuXG4gIHRoaXMuYnVmZmVySW5kaWNlcygpO1xuICB0aGlzLmJ1ZmZlclBvc2l0aW9ucygpO1xufVxuUHJlZmFiQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUpO1xuUHJlZmFiQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gUHJlZmFiQnVmZmVyR2VvbWV0cnk7XG5cblByZWZhYkJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5idWZmZXJJbmRpY2VzID0gZnVuY3Rpb24oKSB7XG4gIGxldCBwcmVmYWJJbmRpY2VzID0gW107XG4gIGxldCBwcmVmYWJJbmRleENvdW50O1xuXG4gIGlmICh0aGlzLmlzUHJlZmFiQnVmZmVyR2VvbWV0cnkpIHtcbiAgICBpZiAodGhpcy5wcmVmYWJHZW9tZXRyeS5pbmRleCkge1xuICAgICAgcHJlZmFiSW5kZXhDb3VudCA9IHRoaXMucHJlZmFiR2VvbWV0cnkuaW5kZXguY291bnQ7XG4gICAgICBwcmVmYWJJbmRpY2VzID0gdGhpcy5wcmVmYWJHZW9tZXRyeS5pbmRleC5hcnJheTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBwcmVmYWJJbmRleENvdW50ID0gdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudDtcblxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcmVmYWJJbmRleENvdW50OyBpKyspIHtcbiAgICAgICAgcHJlZmFiSW5kaWNlcy5wdXNoKGkpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBlbHNlIHtcbiAgICBjb25zdCBwcmVmYWJGYWNlQ291bnQgPSB0aGlzLnByZWZhYkdlb21ldHJ5LmZhY2VzLmxlbmd0aDtcbiAgICBwcmVmYWJJbmRleENvdW50ID0gcHJlZmFiRmFjZUNvdW50ICogMztcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHJlZmFiRmFjZUNvdW50OyBpKyspIHtcbiAgICAgIGNvbnN0IGZhY2UgPSB0aGlzLnByZWZhYkdlb21ldHJ5LmZhY2VzW2ldO1xuICAgICAgcHJlZmFiSW5kaWNlcy5wdXNoKGZhY2UuYSwgZmFjZS5iLCBmYWNlLmMpO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IGluZGV4QnVmZmVyID0gbmV3IFVpbnQzMkFycmF5KHRoaXMucHJlZmFiQ291bnQgKiBwcmVmYWJJbmRleENvdW50KTtcblxuICB0aGlzLnNldEluZGV4KG5ldyBCdWZmZXJBdHRyaWJ1dGUoaW5kZXhCdWZmZXIsIDEpKTtcbiAgXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5wcmVmYWJDb3VudDsgaSsrKSB7XG4gICAgZm9yIChsZXQgayA9IDA7IGsgPCBwcmVmYWJJbmRleENvdW50OyBrKyspIHtcbiAgICAgIGluZGV4QnVmZmVyW2kgKiBwcmVmYWJJbmRleENvdW50ICsga10gPSBwcmVmYWJJbmRpY2VzW2tdICsgaSAqIHRoaXMucHJlZmFiVmVydGV4Q291bnQ7XG4gICAgfVxuICB9XG59O1xuXG5QcmVmYWJCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuYnVmZmVyUG9zaXRpb25zID0gZnVuY3Rpb24oKSB7XG4gIGNvbnN0IHBvc2l0aW9uQnVmZmVyID0gdGhpcy5jcmVhdGVBdHRyaWJ1dGUoJ3Bvc2l0aW9uJywgMykuYXJyYXk7XG5cbiAgaWYgKHRoaXMuaXNQcmVmYWJCdWZmZXJHZW9tZXRyeSkge1xuICAgIGNvbnN0IHBvc2l0aW9ucyA9IHRoaXMucHJlZmFiR2VvbWV0cnkuYXR0cmlidXRlcy5wb3NpdGlvbi5hcnJheTtcblxuICAgIGZvciAobGV0IGkgPSAwLCBvZmZzZXQgPSAwOyBpIDwgdGhpcy5wcmVmYWJDb3VudDsgaSsrKSB7XG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHRoaXMucHJlZmFiVmVydGV4Q291bnQ7IGorKywgb2Zmc2V0ICs9IDMpIHtcbiAgICAgICAgcG9zaXRpb25CdWZmZXJbb2Zmc2V0ICAgIF0gPSBwb3NpdGlvbnNbaiAqIDNdO1xuICAgICAgICBwb3NpdGlvbkJ1ZmZlcltvZmZzZXQgKyAxXSA9IHBvc2l0aW9uc1tqICogMyArIDFdO1xuICAgICAgICBwb3NpdGlvbkJ1ZmZlcltvZmZzZXQgKyAyXSA9IHBvc2l0aW9uc1tqICogMyArIDJdO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBlbHNlIHtcbiAgICBmb3IgKGxldCBpID0gMCwgb2Zmc2V0ID0gMDsgaSA8IHRoaXMucHJlZmFiQ291bnQ7IGkrKykge1xuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCB0aGlzLnByZWZhYlZlcnRleENvdW50OyBqKyssIG9mZnNldCArPSAzKSB7XG4gICAgICAgIGNvbnN0IHByZWZhYlZlcnRleCA9IHRoaXMucHJlZmFiR2VvbWV0cnkudmVydGljZXNbal07XG5cbiAgICAgICAgcG9zaXRpb25CdWZmZXJbb2Zmc2V0ICAgIF0gPSBwcmVmYWJWZXJ0ZXgueDtcbiAgICAgICAgcG9zaXRpb25CdWZmZXJbb2Zmc2V0ICsgMV0gPSBwcmVmYWJWZXJ0ZXgueTtcbiAgICAgICAgcG9zaXRpb25CdWZmZXJbb2Zmc2V0ICsgMl0gPSBwcmVmYWJWZXJ0ZXguejtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn07XG5cbi8qKlxuICogQ3JlYXRlcyBhIEJ1ZmZlckF0dHJpYnV0ZSB3aXRoIFVWIGNvb3JkaW5hdGVzLlxuICovXG5QcmVmYWJCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuYnVmZmVyVXZzID0gZnVuY3Rpb24oKSB7XG4gIGNvbnN0IHByZWZhYlV2cyA9IFtdO1xuXG4gIGlmICh0aGlzLmlzUHJlZmFiQnVmZmVyR2VvbWV0cnkpIHtcbiAgICBjb25zdCB1diA9IHRoaXMucHJlZmFiR2VvbWV0cnkuYXR0cmlidXRlcy51di5hcnJheTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudDsgaSsrKSB7XG4gICAgICBwcmVmYWJVdnMucHVzaChuZXcgVmVjdG9yMih1dltpICogMl0sIHV2W2kgKiAyICsgMV0pKTtcbiAgICB9XG4gIH1cbiAgZWxzZSB7XG4gICAgY29uc3QgcHJlZmFiRmFjZUNvdW50ID0gdGhpcy5wcmVmYWJHZW9tZXRyeS5mYWNlcy5sZW5ndGg7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHByZWZhYkZhY2VDb3VudDsgaSsrKSB7XG4gICAgICBjb25zdCBmYWNlID0gdGhpcy5wcmVmYWJHZW9tZXRyeS5mYWNlc1tpXTtcbiAgICAgIGNvbnN0IHV2ID0gdGhpcy5wcmVmYWJHZW9tZXRyeS5mYWNlVmVydGV4VXZzWzBdW2ldO1xuXG4gICAgICBwcmVmYWJVdnNbZmFjZS5hXSA9IHV2WzBdO1xuICAgICAgcHJlZmFiVXZzW2ZhY2UuYl0gPSB1dlsxXTtcbiAgICAgIHByZWZhYlV2c1tmYWNlLmNdID0gdXZbMl07XG4gICAgfVxuICB9XG5cbiAgY29uc3QgdXZCdWZmZXIgPSB0aGlzLmNyZWF0ZUF0dHJpYnV0ZSgndXYnLCAyKTtcbiAgXG4gIGZvciAobGV0IGkgPSAwLCBvZmZzZXQgPSAwOyBpIDwgdGhpcy5wcmVmYWJDb3VudDsgaSsrKSB7XG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCB0aGlzLnByZWZhYlZlcnRleENvdW50OyBqKyssIG9mZnNldCArPSAyKSB7XG4gICAgICBsZXQgcHJlZmFiVXYgPSBwcmVmYWJVdnNbal07XG4gICAgICBcbiAgICAgIHV2QnVmZmVyLmFycmF5W29mZnNldF0gPSBwcmVmYWJVdi54O1xuICAgICAgdXZCdWZmZXIuYXJyYXlbb2Zmc2V0ICsgMV0gPSBwcmVmYWJVdi55O1xuICAgIH1cbiAgfVxufTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgQnVmZmVyQXR0cmlidXRlIG9uIHRoaXMgZ2VvbWV0cnkgaW5zdGFuY2UuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgTmFtZSBvZiB0aGUgYXR0cmlidXRlLlxuICogQHBhcmFtIHtOdW1iZXJ9IGl0ZW1TaXplIE51bWJlciBvZiBmbG9hdHMgcGVyIHZlcnRleCAodHlwaWNhbGx5IDEsIDIsIDMgb3IgNCkuXG4gKiBAcGFyYW0ge2Z1bmN0aW9uPX0gZmFjdG9yeSBGdW5jdGlvbiB0aGF0IHdpbGwgYmUgY2FsbGVkIGZvciBlYWNoIHByZWZhYiB1cG9uIGNyZWF0aW9uLiBBY2NlcHRzIDMgYXJndW1lbnRzOiBkYXRhW10sIGluZGV4IGFuZCBwcmVmYWJDb3VudC4gQ2FsbHMgc2V0UHJlZmFiRGF0YS5cbiAqXG4gKiBAcmV0dXJucyB7QnVmZmVyQXR0cmlidXRlfVxuICovXG5QcmVmYWJCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuY3JlYXRlQXR0cmlidXRlID0gZnVuY3Rpb24obmFtZSwgaXRlbVNpemUsIGZhY3RvcnkpIHtcbiAgY29uc3QgYnVmZmVyID0gbmV3IEZsb2F0MzJBcnJheSh0aGlzLnByZWZhYkNvdW50ICogdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudCAqIGl0ZW1TaXplKTtcbiAgY29uc3QgYXR0cmlidXRlID0gbmV3IEJ1ZmZlckF0dHJpYnV0ZShidWZmZXIsIGl0ZW1TaXplKTtcbiAgXG4gIHRoaXMuYWRkQXR0cmlidXRlKG5hbWUsIGF0dHJpYnV0ZSk7XG4gIFxuICBpZiAoZmFjdG9yeSkge1xuICAgIGNvbnN0IGRhdGEgPSBbXTtcbiAgICBcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucHJlZmFiQ291bnQ7IGkrKykge1xuICAgICAgZmFjdG9yeShkYXRhLCBpLCB0aGlzLnByZWZhYkNvdW50KTtcbiAgICAgIHRoaXMuc2V0UHJlZmFiRGF0YShhdHRyaWJ1dGUsIGksIGRhdGEpO1xuICAgIH1cbiAgfVxuICBcbiAgcmV0dXJuIGF0dHJpYnV0ZTtcbn07XG5cbi8qKlxuICogU2V0cyBkYXRhIGZvciBhbGwgdmVydGljZXMgb2YgYSBwcmVmYWIgYXQgYSBnaXZlbiBpbmRleC5cbiAqIFVzdWFsbHkgY2FsbGVkIGluIGEgbG9vcC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ3xCdWZmZXJBdHRyaWJ1dGV9IGF0dHJpYnV0ZSBUaGUgYXR0cmlidXRlIG9yIGF0dHJpYnV0ZSBuYW1lIHdoZXJlIHRoZSBkYXRhIGlzIHRvIGJlIHN0b3JlZC5cbiAqIEBwYXJhbSB7TnVtYmVyfSBwcmVmYWJJbmRleCBJbmRleCBvZiB0aGUgcHJlZmFiIGluIHRoZSBidWZmZXIgZ2VvbWV0cnkuXG4gKiBAcGFyYW0ge0FycmF5fSBkYXRhIEFycmF5IG9mIGRhdGEuIExlbmd0aCBzaG91bGQgYmUgZXF1YWwgdG8gaXRlbSBzaXplIG9mIHRoZSBhdHRyaWJ1dGUuXG4gKi9cblByZWZhYkJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5zZXRQcmVmYWJEYXRhID0gZnVuY3Rpb24oYXR0cmlidXRlLCBwcmVmYWJJbmRleCwgZGF0YSkge1xuICBhdHRyaWJ1dGUgPSAodHlwZW9mIGF0dHJpYnV0ZSA9PT0gJ3N0cmluZycpID8gdGhpcy5hdHRyaWJ1dGVzW2F0dHJpYnV0ZV0gOiBhdHRyaWJ1dGU7XG4gIFxuICBsZXQgb2Zmc2V0ID0gcHJlZmFiSW5kZXggKiB0aGlzLnByZWZhYlZlcnRleENvdW50ICogYXR0cmlidXRlLml0ZW1TaXplO1xuICBcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnByZWZhYlZlcnRleENvdW50OyBpKyspIHtcbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IGF0dHJpYnV0ZS5pdGVtU2l6ZTsgaisrKSB7XG4gICAgICBhdHRyaWJ1dGUuYXJyYXlbb2Zmc2V0KytdID0gZGF0YVtqXTtcbiAgICB9XG4gIH1cbn07XG5cbmV4cG9ydCB7IFByZWZhYkJ1ZmZlckdlb21ldHJ5IH07XG4iLCJpbXBvcnQgeyBCdWZmZXJHZW9tZXRyeSwgQnVmZmVyQXR0cmlidXRlIH0gZnJvbSAndGhyZWUnO1xuLyoqXG4gKiBBIEJ1ZmZlckdlb21ldHJ5IHdoZXJlIGEgJ3ByZWZhYicgZ2VvbWV0cnkgYXJyYXkgaXMgcmVwZWF0ZWQgYSBudW1iZXIgb2YgdGltZXMuXG4gKlxuICogQHBhcmFtIHtBcnJheX0gcHJlZmFicyBBbiBhcnJheSB3aXRoIEdlb21ldHJ5IGluc3RhbmNlcyB0byByZXBlYXQuXG4gKiBAcGFyYW0ge051bWJlcn0gcmVwZWF0Q291bnQgVGhlIG51bWJlciBvZiB0aW1lcyB0byByZXBlYXQgdGhlIGFycmF5IG9mIEdlb21ldHJpZXMuXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gTXVsdGlQcmVmYWJCdWZmZXJHZW9tZXRyeShwcmVmYWJzLCByZXBlYXRDb3VudCkge1xuICBCdWZmZXJHZW9tZXRyeS5jYWxsKHRoaXMpO1xuXG4gIGlmIChBcnJheS5pc0FycmF5KHByZWZhYnMpKSB7XG4gICAgdGhpcy5wcmVmYWJHZW9tZXRyaWVzID0gcHJlZmFicztcbiAgfSBlbHNlIHtcbiAgICB0aGlzLnByZWZhYkdlb21ldHJpZXMgPSBbcHJlZmFic107XG4gIH1cblxuICB0aGlzLnByZWZhYkdlb21ldHJpZXNDb3VudCA9IHRoaXMucHJlZmFiR2VvbWV0cmllcy5sZW5ndGg7XG5cbiAgLyoqXG4gICAqIE51bWJlciBvZiBwcmVmYWJzLlxuICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgKi9cbiAgdGhpcy5wcmVmYWJDb3VudCA9IHJlcGVhdENvdW50ICogdGhpcy5wcmVmYWJHZW9tZXRyaWVzQ291bnQ7XG4gIHRoaXMucmVwZWF0Q291bnQgPSByZXBlYXRDb3VudDtcbiAgXG4gIC8qKlxuICAgKiBBcnJheSBvZiB2ZXJ0ZXggY291bnRzIHBlciBwcmVmYWIuXG4gICAqIEB0eXBlIHtBcnJheX1cbiAgICovXG4gIHRoaXMucHJlZmFiVmVydGV4Q291bnRzID0gdGhpcy5wcmVmYWJHZW9tZXRyaWVzLm1hcChwID0+IHAuaXNCdWZmZXJHZW9tZXRyeSA/IHAuYXR0cmlidXRlcy5wb3NpdGlvbi5jb3VudCA6IHAudmVydGljZXMubGVuZ3RoKTtcbiAgdGhpcy5yZXBlYXRWZXJ0ZXhDb3VudCA9IHRoaXMucHJlZmFiVmVydGV4Q291bnRzLnJlZHVjZSgociwgdikgPT4gciArIHYsIDApO1xuXG4gIHRoaXMuYnVmZmVySW5kaWNlcygpO1xuICB0aGlzLmJ1ZmZlclBvc2l0aW9ucygpO1xufVxuTXVsdGlQcmVmYWJCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZSk7XG5NdWx0aVByZWZhYkJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IE11bHRpUHJlZmFiQnVmZmVyR2VvbWV0cnk7XG5cbk11bHRpUHJlZmFiQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmJ1ZmZlckluZGljZXMgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5wcmVmYWJJbmRpY2VzID0gW107XG4gIGxldCByZXBlYXRJbmRleENvdW50ID0gMDtcblxuICB0aGlzLnByZWZhYkdlb21ldHJpZXMuZm9yRWFjaChnZW9tZXRyeSA9PiB7XG4gICAgbGV0IGluZGljZXMgPSBbXTtcblxuICAgIGlmIChnZW9tZXRyeS5pc0J1ZmZlckdlb21ldHJ5KSB7XG4gICAgICBpZiAoZ2VvbWV0cnkuaW5kZXgpIHtcbiAgICAgICAgaW5kaWNlcyA9IGdlb21ldHJ5LmluZGV4LmFycmF5O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBnZW9tZXRyeS5hdHRyaWJ1dGVzLnBvc2l0aW9uLmNvdW50OyBpKyspIHtcbiAgICAgICAgICBpbmRpY2VzLnB1c2goaSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBnZW9tZXRyeS5mYWNlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBmYWNlID0gZ2VvbWV0cnkuZmFjZXNbaV07XG4gICAgICAgIGluZGljZXMucHVzaChmYWNlLmEsIGZhY2UuYiwgZmFjZS5jKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLnByZWZhYkluZGljZXMucHVzaChpbmRpY2VzKTtcblxuICAgIHJlcGVhdEluZGV4Q291bnQgKz0gaW5kaWNlcy5sZW5ndGg7XG4gIH0pO1xuXG4gIGNvbnN0IGluZGV4QnVmZmVyID0gbmV3IFVpbnQzMkFycmF5KHJlcGVhdEluZGV4Q291bnQgKiB0aGlzLnJlcGVhdENvdW50KTtcbiAgbGV0IGluZGV4T2Zmc2V0ID0gMDtcbiAgbGV0IHByZWZhYk9mZnNldCA9IDA7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnByZWZhYkNvdW50OyBpKyspIHtcbiAgICBjb25zdCBpbmRleCA9IGkgJSB0aGlzLnByZWZhYkdlb21ldHJpZXNDb3VudDtcbiAgICBjb25zdCBpbmRpY2VzID0gdGhpcy5wcmVmYWJJbmRpY2VzW2luZGV4XTtcbiAgICBjb25zdCB2ZXJ0ZXhDb3VudCA9IHRoaXMucHJlZmFiVmVydGV4Q291bnRzW2luZGV4XTtcblxuICAgIGZvciAobGV0IGogPSAwOyBqIDwgaW5kaWNlcy5sZW5ndGg7IGorKykge1xuICAgICAgaW5kZXhCdWZmZXJbaW5kZXhPZmZzZXQrK10gPSBpbmRpY2VzW2pdICsgcHJlZmFiT2Zmc2V0O1xuICAgIH1cblxuICAgIHByZWZhYk9mZnNldCArPSB2ZXJ0ZXhDb3VudDtcbiAgfVxuXG4gIHRoaXMuc2V0SW5kZXgobmV3IEJ1ZmZlckF0dHJpYnV0ZShpbmRleEJ1ZmZlciwgMSkpO1xufTtcblxuTXVsdGlQcmVmYWJCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuYnVmZmVyUG9zaXRpb25zID0gZnVuY3Rpb24oKSB7XG4gIGNvbnN0IHBvc2l0aW9uQnVmZmVyID0gdGhpcy5jcmVhdGVBdHRyaWJ1dGUoJ3Bvc2l0aW9uJywgMykuYXJyYXk7XG5cbiAgY29uc3QgcHJlZmFiUG9zaXRpb25zID0gdGhpcy5wcmVmYWJHZW9tZXRyaWVzLm1hcCgoZ2VvbWV0cnksIGkpID0+IHtcbiAgICBsZXQgcG9zaXRpb25zO1xuXG4gICAgaWYgKGdlb21ldHJ5LmlzQnVmZmVyR2VvbWV0cnkpIHtcbiAgICAgIHBvc2l0aW9ucyA9IGdlb21ldHJ5LmF0dHJpYnV0ZXMucG9zaXRpb24uYXJyYXk7XG4gICAgfSBlbHNlIHtcblxuICAgICAgY29uc3QgdmVydGV4Q291bnQgPSB0aGlzLnByZWZhYlZlcnRleENvdW50c1tpXTtcblxuICAgICAgcG9zaXRpb25zID0gW107XG5cbiAgICAgIGZvciAobGV0IGogPSAwLCBvZmZzZXQgPSAwOyBqIDwgdmVydGV4Q291bnQ7IGorKykge1xuICAgICAgICBjb25zdCBwcmVmYWJWZXJ0ZXggPSBnZW9tZXRyeS52ZXJ0aWNlc1tqXTtcblxuICAgICAgICBwb3NpdGlvbnNbb2Zmc2V0KytdID0gcHJlZmFiVmVydGV4Lng7XG4gICAgICAgIHBvc2l0aW9uc1tvZmZzZXQrK10gPSBwcmVmYWJWZXJ0ZXgueTtcbiAgICAgICAgcG9zaXRpb25zW29mZnNldCsrXSA9IHByZWZhYlZlcnRleC56O1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBwb3NpdGlvbnM7XG4gIH0pO1xuXG4gIGZvciAobGV0IGkgPSAwLCBvZmZzZXQgPSAwOyBpIDwgdGhpcy5wcmVmYWJDb3VudDsgaSsrKSB7XG4gICAgY29uc3QgaW5kZXggPSBpICUgdGhpcy5wcmVmYWJHZW9tZXRyaWVzLmxlbmd0aDtcbiAgICBjb25zdCB2ZXJ0ZXhDb3VudCA9IHRoaXMucHJlZmFiVmVydGV4Q291bnRzW2luZGV4XTtcbiAgICBjb25zdCBwb3NpdGlvbnMgPSBwcmVmYWJQb3NpdGlvbnNbaW5kZXhdO1xuXG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCB2ZXJ0ZXhDb3VudDsgaisrKSB7XG4gICAgICBwb3NpdGlvbkJ1ZmZlcltvZmZzZXQrK10gPSBwb3NpdGlvbnNbaiAqIDNdO1xuICAgICAgcG9zaXRpb25CdWZmZXJbb2Zmc2V0KytdID0gcG9zaXRpb25zW2ogKiAzICsgMV07XG4gICAgICBwb3NpdGlvbkJ1ZmZlcltvZmZzZXQrK10gPSBwb3NpdGlvbnNbaiAqIDMgKyAyXTtcbiAgICB9XG4gIH1cbn07XG5cbi8qKlxuICogQ3JlYXRlcyBhIEJ1ZmZlckF0dHJpYnV0ZSB3aXRoIFVWIGNvb3JkaW5hdGVzLlxuICovXG5NdWx0aVByZWZhYkJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5idWZmZXJVdnMgPSBmdW5jdGlvbigpIHtcbiAgY29uc3QgdXZCdWZmZXIgPSB0aGlzLmNyZWF0ZUF0dHJpYnV0ZSgndXYnLCAyKS5hcnJheTtcblxuICBjb25zdCBwcmVmYWJVdnMgPSB0aGlzLnByZWZhYkdlb21ldHJpZXMubWFwKChnZW9tZXRyeSwgaSkgPT4ge1xuICAgIGxldCB1dnM7XG5cbiAgICBpZiAoZ2VvbWV0cnkuaXNCdWZmZXJHZW9tZXRyeSkge1xuICAgICAgaWYgKCFnZW9tZXRyeS5hdHRyaWJ1dGVzLnV2KSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ05vIFVWIGZvdW5kIGluIHByZWZhYiBnZW9tZXRyeScsIGdlb21ldHJ5KTtcbiAgICAgIH1cblxuICAgICAgdXZzID0gZ2VvbWV0cnkuYXR0cmlidXRlcy51di5hcnJheTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgcHJlZmFiRmFjZUNvdW50ID0gdGhpcy5wcmVmYWJJbmRpY2VzW2ldLmxlbmd0aCAvIDM7XG4gICAgICBjb25zdCB1dk9iamVjdHMgPSBbXTtcblxuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBwcmVmYWJGYWNlQ291bnQ7IGorKykge1xuICAgICAgICBjb25zdCBmYWNlID0gZ2VvbWV0cnkuZmFjZXNbal07XG4gICAgICAgIGNvbnN0IHV2ID0gZ2VvbWV0cnkuZmFjZVZlcnRleFV2c1swXVtqXTtcblxuICAgICAgICB1dk9iamVjdHNbZmFjZS5hXSA9IHV2WzBdO1xuICAgICAgICB1dk9iamVjdHNbZmFjZS5iXSA9IHV2WzFdO1xuICAgICAgICB1dk9iamVjdHNbZmFjZS5jXSA9IHV2WzJdO1xuICAgICAgfVxuXG4gICAgICB1dnMgPSBbXTtcblxuICAgICAgZm9yIChsZXQgayA9IDA7IGsgPCB1dk9iamVjdHMubGVuZ3RoOyBrKyspIHtcbiAgICAgICAgdXZzW2sgKiAyXSA9IHV2T2JqZWN0c1trXS54O1xuICAgICAgICB1dnNbayAqIDIgKyAxXSA9IHV2T2JqZWN0c1trXS55O1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB1dnM7XG4gIH0pO1xuXG4gIGZvciAobGV0IGkgPSAwLCBvZmZzZXQgPSAwOyBpIDwgdGhpcy5wcmVmYWJDb3VudDsgaSsrKSB7XG5cbiAgICBjb25zdCBpbmRleCA9IGkgJSB0aGlzLnByZWZhYkdlb21ldHJpZXMubGVuZ3RoO1xuICAgIGNvbnN0IHZlcnRleENvdW50ID0gdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudHNbaW5kZXhdO1xuICAgIGNvbnN0IHV2cyA9IHByZWZhYlV2c1tpbmRleF07XG5cbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IHZlcnRleENvdW50OyBqKyspIHtcbiAgICAgIHV2QnVmZmVyW29mZnNldCsrXSA9IHV2c1tqICogMl07XG4gICAgICB1dkJ1ZmZlcltvZmZzZXQrK10gPSB1dnNbaiAqIDIgKyAxXTtcbiAgICB9XG4gIH1cbn07XG5cbi8qKlxuICogQ3JlYXRlcyBhIEJ1ZmZlckF0dHJpYnV0ZSBvbiB0aGlzIGdlb21ldHJ5IGluc3RhbmNlLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIE5hbWUgb2YgdGhlIGF0dHJpYnV0ZS5cbiAqIEBwYXJhbSB7TnVtYmVyfSBpdGVtU2l6ZSBOdW1iZXIgb2YgZmxvYXRzIHBlciB2ZXJ0ZXggKHR5cGljYWxseSAxLCAyLCAzIG9yIDQpLlxuICogQHBhcmFtIHtmdW5jdGlvbj19IGZhY3RvcnkgRnVuY3Rpb24gdGhhdCB3aWxsIGJlIGNhbGxlZCBmb3IgZWFjaCBwcmVmYWIgdXBvbiBjcmVhdGlvbi4gQWNjZXB0cyAzIGFyZ3VtZW50czogZGF0YVtdLCBpbmRleCBhbmQgcHJlZmFiQ291bnQuIENhbGxzIHNldFByZWZhYkRhdGEuXG4gKlxuICogQHJldHVybnMge0J1ZmZlckF0dHJpYnV0ZX1cbiAqL1xuTXVsdGlQcmVmYWJCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuY3JlYXRlQXR0cmlidXRlID0gZnVuY3Rpb24obmFtZSwgaXRlbVNpemUsIGZhY3RvcnkpIHtcbiAgY29uc3QgYnVmZmVyID0gbmV3IEZsb2F0MzJBcnJheSh0aGlzLnJlcGVhdENvdW50ICogdGhpcy5yZXBlYXRWZXJ0ZXhDb3VudCAqIGl0ZW1TaXplKTtcbiAgY29uc3QgYXR0cmlidXRlID0gbmV3IEJ1ZmZlckF0dHJpYnV0ZShidWZmZXIsIGl0ZW1TaXplKTtcbiAgXG4gIHRoaXMuYWRkQXR0cmlidXRlKG5hbWUsIGF0dHJpYnV0ZSk7XG4gIFxuICBpZiAoZmFjdG9yeSkge1xuICAgIGNvbnN0IGRhdGEgPSBbXTtcbiAgICBcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucHJlZmFiQ291bnQ7IGkrKykge1xuICAgICAgZmFjdG9yeShkYXRhLCBpLCB0aGlzLnByZWZhYkNvdW50KTtcbiAgICAgIHRoaXMuc2V0UHJlZmFiRGF0YShhdHRyaWJ1dGUsIGksIGRhdGEpO1xuICAgIH1cbiAgfVxuICBcbiAgcmV0dXJuIGF0dHJpYnV0ZTtcbn07XG5cbi8qKlxuICogU2V0cyBkYXRhIGZvciBhbGwgdmVydGljZXMgb2YgYSBwcmVmYWIgYXQgYSBnaXZlbiBpbmRleC5cbiAqIFVzdWFsbHkgY2FsbGVkIGluIGEgbG9vcC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ3xCdWZmZXJBdHRyaWJ1dGV9IGF0dHJpYnV0ZSBUaGUgYXR0cmlidXRlIG9yIGF0dHJpYnV0ZSBuYW1lIHdoZXJlIHRoZSBkYXRhIGlzIHRvIGJlIHN0b3JlZC5cbiAqIEBwYXJhbSB7TnVtYmVyfSBwcmVmYWJJbmRleCBJbmRleCBvZiB0aGUgcHJlZmFiIGluIHRoZSBidWZmZXIgZ2VvbWV0cnkuXG4gKiBAcGFyYW0ge0FycmF5fSBkYXRhIEFycmF5IG9mIGRhdGEuIExlbmd0aCBzaG91bGQgYmUgZXF1YWwgdG8gaXRlbSBzaXplIG9mIHRoZSBhdHRyaWJ1dGUuXG4gKi9cbk11bHRpUHJlZmFiQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLnNldFByZWZhYkRhdGEgPSBmdW5jdGlvbihhdHRyaWJ1dGUsIHByZWZhYkluZGV4LCBkYXRhKSB7XG4gIGF0dHJpYnV0ZSA9ICh0eXBlb2YgYXR0cmlidXRlID09PSAnc3RyaW5nJykgPyB0aGlzLmF0dHJpYnV0ZXNbYXR0cmlidXRlXSA6IGF0dHJpYnV0ZTtcblxuICBjb25zdCBwcmVmYWJHZW9tZXRyeUluZGV4ID0gcHJlZmFiSW5kZXggJSB0aGlzLnByZWZhYkdlb21ldHJpZXNDb3VudDtcbiAgY29uc3QgcHJlZmFiR2VvbWV0cnlWZXJ0ZXhDb3VudCA9IHRoaXMucHJlZmFiVmVydGV4Q291bnRzW3ByZWZhYkdlb21ldHJ5SW5kZXhdO1xuICBjb25zdCB3aG9sZSA9IChwcmVmYWJJbmRleCAvIHRoaXMucHJlZmFiR2VvbWV0cmllc0NvdW50IHwgMCkgKiB0aGlzLnByZWZhYkdlb21ldHJpZXNDb3VudDtcbiAgY29uc3Qgd2hvbGVPZmZzZXQgPSB3aG9sZSAqIHRoaXMucmVwZWF0VmVydGV4Q291bnQ7XG4gIGNvbnN0IHBhcnQgPSBwcmVmYWJJbmRleCAtIHdob2xlO1xuICBsZXQgcGFydE9mZnNldCA9IDA7XG4gIGxldCBpID0gMDtcblxuICB3aGlsZShpIDwgcGFydCkge1xuICAgIHBhcnRPZmZzZXQgKz0gdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudHNbaSsrXTtcbiAgfVxuXG4gIGxldCBvZmZzZXQgPSAod2hvbGVPZmZzZXQgKyBwYXJ0T2Zmc2V0KSAqIGF0dHJpYnV0ZS5pdGVtU2l6ZTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IHByZWZhYkdlb21ldHJ5VmVydGV4Q291bnQ7IGkrKykge1xuICAgIGZvciAobGV0IGogPSAwOyBqIDwgYXR0cmlidXRlLml0ZW1TaXplOyBqKyspIHtcbiAgICAgIGF0dHJpYnV0ZS5hcnJheVtvZmZzZXQrK10gPSBkYXRhW2pdO1xuICAgIH1cbiAgfVxufTtcblxuZXhwb3J0IHsgTXVsdGlQcmVmYWJCdWZmZXJHZW9tZXRyeSB9O1xuIiwiaW1wb3J0IHsgTWF0aCBhcyB0TWF0aCwgVmVjdG9yMyB9IGZyb20gJ3RocmVlJztcbmltcG9ydCB7IERlcHRoQW5pbWF0aW9uTWF0ZXJpYWwgfSBmcm9tICcuL21hdGVyaWFscy9EZXB0aEFuaW1hdGlvbk1hdGVyaWFsJztcbmltcG9ydCB7IERpc3RhbmNlQW5pbWF0aW9uTWF0ZXJpYWwgfSBmcm9tICcuL21hdGVyaWFscy9EaXN0YW5jZUFuaW1hdGlvbk1hdGVyaWFsJztcblxuLyoqXG4gKiBDb2xsZWN0aW9uIG9mIHV0aWxpdHkgZnVuY3Rpb25zLlxuICogQG5hbWVzcGFjZVxuICovXG5jb25zdCBVdGlscyA9IHtcbiAgLyoqXG4gICAqIER1cGxpY2F0ZXMgdmVydGljZXMgc28gZWFjaCBmYWNlIGJlY29tZXMgc2VwYXJhdGUuXG4gICAqIFNhbWUgYXMgVEhSRUUuRXhwbG9kZU1vZGlmaWVyLlxuICAgKlxuICAgKiBAcGFyYW0ge1RIUkVFLkdlb21ldHJ5fSBnZW9tZXRyeSBHZW9tZXRyeSBpbnN0YW5jZSB0byBtb2RpZnkuXG4gICAqL1xuICBzZXBhcmF0ZUZhY2VzOiBmdW5jdGlvbiAoZ2VvbWV0cnkpIHtcbiAgICBsZXQgdmVydGljZXMgPSBbXTtcblxuICAgIGZvciAobGV0IGkgPSAwLCBpbCA9IGdlb21ldHJ5LmZhY2VzLmxlbmd0aDsgaSA8IGlsOyBpKyspIHtcbiAgICAgIGxldCBuID0gdmVydGljZXMubGVuZ3RoO1xuICAgICAgbGV0IGZhY2UgPSBnZW9tZXRyeS5mYWNlc1tpXTtcblxuICAgICAgbGV0IGEgPSBmYWNlLmE7XG4gICAgICBsZXQgYiA9IGZhY2UuYjtcbiAgICAgIGxldCBjID0gZmFjZS5jO1xuXG4gICAgICBsZXQgdmEgPSBnZW9tZXRyeS52ZXJ0aWNlc1thXTtcbiAgICAgIGxldCB2YiA9IGdlb21ldHJ5LnZlcnRpY2VzW2JdO1xuICAgICAgbGV0IHZjID0gZ2VvbWV0cnkudmVydGljZXNbY107XG5cbiAgICAgIHZlcnRpY2VzLnB1c2godmEuY2xvbmUoKSk7XG4gICAgICB2ZXJ0aWNlcy5wdXNoKHZiLmNsb25lKCkpO1xuICAgICAgdmVydGljZXMucHVzaCh2Yy5jbG9uZSgpKTtcblxuICAgICAgZmFjZS5hID0gbjtcbiAgICAgIGZhY2UuYiA9IG4gKyAxO1xuICAgICAgZmFjZS5jID0gbiArIDI7XG4gICAgfVxuXG4gICAgZ2VvbWV0cnkudmVydGljZXMgPSB2ZXJ0aWNlcztcbiAgfSxcblxuICAvKipcbiAgICogQ29tcHV0ZSB0aGUgY2VudHJvaWQgKGNlbnRlcikgb2YgYSBUSFJFRS5GYWNlMy5cbiAgICpcbiAgICogQHBhcmFtIHtUSFJFRS5HZW9tZXRyeX0gZ2VvbWV0cnkgR2VvbWV0cnkgaW5zdGFuY2UgdGhlIGZhY2UgaXMgaW4uXG4gICAqIEBwYXJhbSB7VEhSRUUuRmFjZTN9IGZhY2UgRmFjZSBvYmplY3QgZnJvbSB0aGUgVEhSRUUuR2VvbWV0cnkuZmFjZXMgYXJyYXlcbiAgICogQHBhcmFtIHtUSFJFRS5WZWN0b3IzPX0gdiBPcHRpb25hbCB2ZWN0b3IgdG8gc3RvcmUgcmVzdWx0IGluLlxuICAgKiBAcmV0dXJucyB7VEhSRUUuVmVjdG9yM31cbiAgICovXG4gIGNvbXB1dGVDZW50cm9pZDogZnVuY3Rpb24oZ2VvbWV0cnksIGZhY2UsIHYpIHtcbiAgICBsZXQgYSA9IGdlb21ldHJ5LnZlcnRpY2VzW2ZhY2UuYV07XG4gICAgbGV0IGIgPSBnZW9tZXRyeS52ZXJ0aWNlc1tmYWNlLmJdO1xuICAgIGxldCBjID0gZ2VvbWV0cnkudmVydGljZXNbZmFjZS5jXTtcblxuICAgIHYgPSB2IHx8IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG5cbiAgICB2LnggPSAoYS54ICsgYi54ICsgYy54KSAvIDM7XG4gICAgdi55ID0gKGEueSArIGIueSArIGMueSkgLyAzO1xuICAgIHYueiA9IChhLnogKyBiLnogKyBjLnopIC8gMztcblxuICAgIHJldHVybiB2O1xuICB9LFxuXG4gIC8qKlxuICAgKiBHZXQgYSByYW5kb20gdmVjdG9yIGJldHdlZW4gYm94Lm1pbiBhbmQgYm94Lm1heC5cbiAgICpcbiAgICogQHBhcmFtIHtUSFJFRS5Cb3gzfSBib3ggVEhSRUUuQm94MyBpbnN0YW5jZS5cbiAgICogQHBhcmFtIHtUSFJFRS5WZWN0b3IzPX0gdiBPcHRpb25hbCB2ZWN0b3IgdG8gc3RvcmUgcmVzdWx0IGluLlxuICAgKiBAcmV0dXJucyB7VEhSRUUuVmVjdG9yM31cbiAgICovXG4gIHJhbmRvbUluQm94OiBmdW5jdGlvbihib3gsIHYpIHtcbiAgICB2ID0gdiB8fCBuZXcgVmVjdG9yMygpO1xuXG4gICAgdi54ID0gdE1hdGgucmFuZEZsb2F0KGJveC5taW4ueCwgYm94Lm1heC54KTtcbiAgICB2LnkgPSB0TWF0aC5yYW5kRmxvYXQoYm94Lm1pbi55LCBib3gubWF4LnkpO1xuICAgIHYueiA9IHRNYXRoLnJhbmRGbG9hdChib3gubWluLnosIGJveC5tYXgueik7XG5cbiAgICByZXR1cm4gdjtcbiAgfSxcblxuICAvKipcbiAgICogR2V0IGEgcmFuZG9tIGF4aXMgZm9yIHF1YXRlcm5pb24gcm90YXRpb24uXG4gICAqXG4gICAqIEBwYXJhbSB7VEhSRUUuVmVjdG9yMz19IHYgT3B0aW9uIHZlY3RvciB0byBzdG9yZSByZXN1bHQgaW4uXG4gICAqIEByZXR1cm5zIHtUSFJFRS5WZWN0b3IzfVxuICAgKi9cbiAgcmFuZG9tQXhpczogZnVuY3Rpb24odikge1xuICAgIHYgPSB2IHx8IG5ldyBWZWN0b3IzKCk7XG5cbiAgICB2LnggPSB0TWF0aC5yYW5kRmxvYXRTcHJlYWQoMi4wKTtcbiAgICB2LnkgPSB0TWF0aC5yYW5kRmxvYXRTcHJlYWQoMi4wKTtcbiAgICB2LnogPSB0TWF0aC5yYW5kRmxvYXRTcHJlYWQoMi4wKTtcbiAgICB2Lm5vcm1hbGl6ZSgpO1xuXG4gICAgcmV0dXJuIHY7XG4gIH0sXG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIFRIUkVFLkJBUy5EZXB0aEFuaW1hdGlvbk1hdGVyaWFsIGZvciBzaGFkb3dzIGZyb20gYSBUSFJFRS5TcG90TGlnaHQgb3IgVEhSRUUuRGlyZWN0aW9uYWxMaWdodCBieSBjb3B5aW5nIHJlbGV2YW50IHNoYWRlciBjaHVua3MuXG4gICAqIFVuaWZvcm0gdmFsdWVzIG11c3QgYmUgbWFudWFsbHkgc3luY2VkIGJldHdlZW4gdGhlIHNvdXJjZSBtYXRlcmlhbCBhbmQgdGhlIGRlcHRoIG1hdGVyaWFsLlxuICAgKlxuICAgKiBAc2VlIHtAbGluayBodHRwOi8vdGhyZWUtYmFzLWV4YW1wbGVzLnN1cmdlLnNoL2V4YW1wbGVzL3NoYWRvd3MvfVxuICAgKlxuICAgKiBAcGFyYW0ge1RIUkVFLkJBUy5CYXNlQW5pbWF0aW9uTWF0ZXJpYWx9IHNvdXJjZU1hdGVyaWFsIEluc3RhbmNlIHRvIGdldCB0aGUgc2hhZGVyIGNodW5rcyBmcm9tLlxuICAgKiBAcmV0dXJucyB7VEhSRUUuQkFTLkRlcHRoQW5pbWF0aW9uTWF0ZXJpYWx9XG4gICAqL1xuICBjcmVhdGVEZXB0aEFuaW1hdGlvbk1hdGVyaWFsOiBmdW5jdGlvbihzb3VyY2VNYXRlcmlhbCkge1xuICAgIHJldHVybiBuZXcgRGVwdGhBbmltYXRpb25NYXRlcmlhbCh7XG4gICAgICB1bmlmb3Jtczogc291cmNlTWF0ZXJpYWwudW5pZm9ybXMsXG4gICAgICBkZWZpbmVzOiBzb3VyY2VNYXRlcmlhbC5kZWZpbmVzLFxuICAgICAgdmVydGV4RnVuY3Rpb25zOiBzb3VyY2VNYXRlcmlhbC52ZXJ0ZXhGdW5jdGlvbnMsXG4gICAgICB2ZXJ0ZXhQYXJhbWV0ZXJzOiBzb3VyY2VNYXRlcmlhbC52ZXJ0ZXhQYXJhbWV0ZXJzLFxuICAgICAgdmVydGV4SW5pdDogc291cmNlTWF0ZXJpYWwudmVydGV4SW5pdCxcbiAgICAgIHZlcnRleFBvc2l0aW9uOiBzb3VyY2VNYXRlcmlhbC52ZXJ0ZXhQb3NpdGlvblxuICAgIH0pO1xuICB9LFxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBUSFJFRS5CQVMuRGlzdGFuY2VBbmltYXRpb25NYXRlcmlhbCBmb3Igc2hhZG93cyBmcm9tIGEgVEhSRUUuUG9pbnRMaWdodCBieSBjb3B5aW5nIHJlbGV2YW50IHNoYWRlciBjaHVua3MuXG4gICAqIFVuaWZvcm0gdmFsdWVzIG11c3QgYmUgbWFudWFsbHkgc3luY2VkIGJldHdlZW4gdGhlIHNvdXJjZSBtYXRlcmlhbCBhbmQgdGhlIGRpc3RhbmNlIG1hdGVyaWFsLlxuICAgKlxuICAgKiBAc2VlIHtAbGluayBodHRwOi8vdGhyZWUtYmFzLWV4YW1wbGVzLnN1cmdlLnNoL2V4YW1wbGVzL3NoYWRvd3MvfVxuICAgKlxuICAgKiBAcGFyYW0ge1RIUkVFLkJBUy5CYXNlQW5pbWF0aW9uTWF0ZXJpYWx9IHNvdXJjZU1hdGVyaWFsIEluc3RhbmNlIHRvIGdldCB0aGUgc2hhZGVyIGNodW5rcyBmcm9tLlxuICAgKiBAcmV0dXJucyB7VEhSRUUuQkFTLkRpc3RhbmNlQW5pbWF0aW9uTWF0ZXJpYWx9XG4gICAqL1xuICBjcmVhdGVEaXN0YW5jZUFuaW1hdGlvbk1hdGVyaWFsOiBmdW5jdGlvbihzb3VyY2VNYXRlcmlhbCkge1xuICAgIHJldHVybiBuZXcgRGlzdGFuY2VBbmltYXRpb25NYXRlcmlhbCh7XG4gICAgICB1bmlmb3Jtczogc291cmNlTWF0ZXJpYWwudW5pZm9ybXMsXG4gICAgICBkZWZpbmVzOiBzb3VyY2VNYXRlcmlhbC5kZWZpbmVzLFxuICAgICAgdmVydGV4RnVuY3Rpb25zOiBzb3VyY2VNYXRlcmlhbC52ZXJ0ZXhGdW5jdGlvbnMsXG4gICAgICB2ZXJ0ZXhQYXJhbWV0ZXJzOiBzb3VyY2VNYXRlcmlhbC52ZXJ0ZXhQYXJhbWV0ZXJzLFxuICAgICAgdmVydGV4SW5pdDogc291cmNlTWF0ZXJpYWwudmVydGV4SW5pdCxcbiAgICAgIHZlcnRleFBvc2l0aW9uOiBzb3VyY2VNYXRlcmlhbC52ZXJ0ZXhQb3NpdGlvblxuICAgIH0pO1xuICB9XG59O1xuXG5leHBvcnQgeyBVdGlscyB9O1xuIiwiaW1wb3J0IHsgQnVmZmVyR2VvbWV0cnksIEJ1ZmZlckF0dHJpYnV0ZSB9IGZyb20gJ3RocmVlJztcbmltcG9ydCB7IFV0aWxzIH0gZnJvbSAnLi4vVXRpbHMnO1xuXG4vKipcbiAqIEEgVEhSRUUuQnVmZmVyR2VvbWV0cnkgZm9yIGFuaW1hdGluZyBpbmRpdmlkdWFsIGZhY2VzIG9mIGEgVEhSRUUuR2VvbWV0cnkuXG4gKlxuICogQHBhcmFtIHtUSFJFRS5HZW9tZXRyeX0gbW9kZWwgVGhlIFRIUkVFLkdlb21ldHJ5IHRvIGJhc2UgdGhpcyBnZW9tZXRyeSBvbi5cbiAqIEBwYXJhbSB7T2JqZWN0PX0gb3B0aW9uc1xuICogQHBhcmFtIHtCb29sZWFuPX0gb3B0aW9ucy5jb21wdXRlQ2VudHJvaWRzIElmIHRydWUsIGEgY2VudHJvaWRzIHdpbGwgYmUgY29tcHV0ZWQgZm9yIGVhY2ggZmFjZSBhbmQgc3RvcmVkIGluIFRIUkVFLkJBUy5Nb2RlbEJ1ZmZlckdlb21ldHJ5LmNlbnRyb2lkcy5cbiAqIEBwYXJhbSB7Qm9vbGVhbj19IG9wdGlvbnMubG9jYWxpemVGYWNlcyBJZiB0cnVlLCB0aGUgcG9zaXRpb25zIGZvciBlYWNoIGZhY2Ugd2lsbCBiZSBzdG9yZWQgcmVsYXRpdmUgdG8gdGhlIGNlbnRyb2lkLiBUaGlzIGlzIHVzZWZ1bCBpZiB5b3Ugd2FudCB0byByb3RhdGUgb3Igc2NhbGUgZmFjZXMgYXJvdW5kIHRoZWlyIGNlbnRlci5cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBNb2RlbEJ1ZmZlckdlb21ldHJ5KG1vZGVsLCBvcHRpb25zKSB7XG4gIEJ1ZmZlckdlb21ldHJ5LmNhbGwodGhpcyk7XG5cbiAgLyoqXG4gICAqIEEgcmVmZXJlbmNlIHRvIHRoZSBnZW9tZXRyeSB1c2VkIHRvIGNyZWF0ZSB0aGlzIGluc3RhbmNlLlxuICAgKiBAdHlwZSB7VEhSRUUuR2VvbWV0cnl9XG4gICAqL1xuICB0aGlzLm1vZGVsR2VvbWV0cnkgPSBtb2RlbDtcblxuICAvKipcbiAgICogTnVtYmVyIG9mIGZhY2VzIG9mIHRoZSBtb2RlbC5cbiAgICogQHR5cGUge051bWJlcn1cbiAgICovXG4gIHRoaXMuZmFjZUNvdW50ID0gdGhpcy5tb2RlbEdlb21ldHJ5LmZhY2VzLmxlbmd0aDtcblxuICAvKipcbiAgICogTnVtYmVyIG9mIHZlcnRpY2VzIG9mIHRoZSBtb2RlbC5cbiAgICogQHR5cGUge051bWJlcn1cbiAgICovXG4gIHRoaXMudmVydGV4Q291bnQgPSB0aGlzLm1vZGVsR2VvbWV0cnkudmVydGljZXMubGVuZ3RoO1xuXG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICBvcHRpb25zLmNvbXB1dGVDZW50cm9pZHMgJiYgdGhpcy5jb21wdXRlQ2VudHJvaWRzKCk7XG5cbiAgdGhpcy5idWZmZXJJbmRpY2VzKCk7XG4gIHRoaXMuYnVmZmVyUG9zaXRpb25zKG9wdGlvbnMubG9jYWxpemVGYWNlcyk7XG59XG5Nb2RlbEJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlKTtcbk1vZGVsQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gTW9kZWxCdWZmZXJHZW9tZXRyeTtcblxuLyoqXG4gKiBDb21wdXRlcyBhIGNlbnRyb2lkIGZvciBlYWNoIGZhY2UgYW5kIHN0b3JlcyBpdCBpbiBUSFJFRS5CQVMuTW9kZWxCdWZmZXJHZW9tZXRyeS5jZW50cm9pZHMuXG4gKi9cbk1vZGVsQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmNvbXB1dGVDZW50cm9pZHMgPSBmdW5jdGlvbigpIHtcbiAgLyoqXG4gICAqIEFuIGFycmF5IG9mIGNlbnRyb2lkcyBjb3JyZXNwb25kaW5nIHRvIHRoZSBmYWNlcyBvZiB0aGUgbW9kZWwuXG4gICAqXG4gICAqIEB0eXBlIHtBcnJheX1cbiAgICovXG4gIHRoaXMuY2VudHJvaWRzID0gW107XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmZhY2VDb3VudDsgaSsrKSB7XG4gICAgdGhpcy5jZW50cm9pZHNbaV0gPSBVdGlscy5jb21wdXRlQ2VudHJvaWQodGhpcy5tb2RlbEdlb21ldHJ5LCB0aGlzLm1vZGVsR2VvbWV0cnkuZmFjZXNbaV0pO1xuICB9XG59O1xuXG5Nb2RlbEJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5idWZmZXJJbmRpY2VzID0gZnVuY3Rpb24oKSB7XG4gIGNvbnN0IGluZGV4QnVmZmVyID0gbmV3IFVpbnQzMkFycmF5KHRoaXMuZmFjZUNvdW50ICogMyk7XG5cbiAgdGhpcy5zZXRJbmRleChuZXcgQnVmZmVyQXR0cmlidXRlKGluZGV4QnVmZmVyLCAxKSk7XG5cbiAgZm9yIChsZXQgaSA9IDAsIG9mZnNldCA9IDA7IGkgPCB0aGlzLmZhY2VDb3VudDsgaSsrLCBvZmZzZXQgKz0gMykge1xuICAgIGNvbnN0IGZhY2UgPSB0aGlzLm1vZGVsR2VvbWV0cnkuZmFjZXNbaV07XG5cbiAgICBpbmRleEJ1ZmZlcltvZmZzZXQgICAgXSA9IGZhY2UuYTtcbiAgICBpbmRleEJ1ZmZlcltvZmZzZXQgKyAxXSA9IGZhY2UuYjtcbiAgICBpbmRleEJ1ZmZlcltvZmZzZXQgKyAyXSA9IGZhY2UuYztcbiAgfVxufTtcblxuTW9kZWxCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuYnVmZmVyUG9zaXRpb25zID0gZnVuY3Rpb24obG9jYWxpemVGYWNlcykge1xuICBjb25zdCBwb3NpdGlvbkJ1ZmZlciA9IHRoaXMuY3JlYXRlQXR0cmlidXRlKCdwb3NpdGlvbicsIDMpLmFycmF5O1xuICBsZXQgaSwgb2Zmc2V0O1xuXG4gIGlmIChsb2NhbGl6ZUZhY2VzID09PSB0cnVlKSB7XG4gICAgZm9yIChpID0gMDsgaSA8IHRoaXMuZmFjZUNvdW50OyBpKyspIHtcbiAgICAgIGNvbnN0IGZhY2UgPSB0aGlzLm1vZGVsR2VvbWV0cnkuZmFjZXNbaV07XG4gICAgICBjb25zdCBjZW50cm9pZCA9IHRoaXMuY2VudHJvaWRzID8gdGhpcy5jZW50cm9pZHNbaV0gOiBUSFJFRS5CQVMuVXRpbHMuY29tcHV0ZUNlbnRyb2lkKHRoaXMubW9kZWxHZW9tZXRyeSwgZmFjZSk7XG5cbiAgICAgIGNvbnN0IGEgPSB0aGlzLm1vZGVsR2VvbWV0cnkudmVydGljZXNbZmFjZS5hXTtcbiAgICAgIGNvbnN0IGIgPSB0aGlzLm1vZGVsR2VvbWV0cnkudmVydGljZXNbZmFjZS5iXTtcbiAgICAgIGNvbnN0IGMgPSB0aGlzLm1vZGVsR2VvbWV0cnkudmVydGljZXNbZmFjZS5jXTtcblxuICAgICAgcG9zaXRpb25CdWZmZXJbZmFjZS5hICogM10gICAgID0gYS54IC0gY2VudHJvaWQueDtcbiAgICAgIHBvc2l0aW9uQnVmZmVyW2ZhY2UuYSAqIDMgKyAxXSA9IGEueSAtIGNlbnRyb2lkLnk7XG4gICAgICBwb3NpdGlvbkJ1ZmZlcltmYWNlLmEgKiAzICsgMl0gPSBhLnogLSBjZW50cm9pZC56O1xuXG4gICAgICBwb3NpdGlvbkJ1ZmZlcltmYWNlLmIgKiAzXSAgICAgPSBiLnggLSBjZW50cm9pZC54O1xuICAgICAgcG9zaXRpb25CdWZmZXJbZmFjZS5iICogMyArIDFdID0gYi55IC0gY2VudHJvaWQueTtcbiAgICAgIHBvc2l0aW9uQnVmZmVyW2ZhY2UuYiAqIDMgKyAyXSA9IGIueiAtIGNlbnRyb2lkLno7XG5cbiAgICAgIHBvc2l0aW9uQnVmZmVyW2ZhY2UuYyAqIDNdICAgICA9IGMueCAtIGNlbnRyb2lkLng7XG4gICAgICBwb3NpdGlvbkJ1ZmZlcltmYWNlLmMgKiAzICsgMV0gPSBjLnkgLSBjZW50cm9pZC55O1xuICAgICAgcG9zaXRpb25CdWZmZXJbZmFjZS5jICogMyArIDJdID0gYy56IC0gY2VudHJvaWQuejtcbiAgICB9XG4gIH1cbiAgZWxzZSB7XG4gICAgZm9yIChpID0gMCwgb2Zmc2V0ID0gMDsgaSA8IHRoaXMudmVydGV4Q291bnQ7IGkrKywgb2Zmc2V0ICs9IDMpIHtcbiAgICAgIGNvbnN0IHZlcnRleCA9IHRoaXMubW9kZWxHZW9tZXRyeS52ZXJ0aWNlc1tpXTtcblxuICAgICAgcG9zaXRpb25CdWZmZXJbb2Zmc2V0ICAgIF0gPSB2ZXJ0ZXgueDtcbiAgICAgIHBvc2l0aW9uQnVmZmVyW29mZnNldCArIDFdID0gdmVydGV4Lnk7XG4gICAgICBwb3NpdGlvbkJ1ZmZlcltvZmZzZXQgKyAyXSA9IHZlcnRleC56O1xuICAgIH1cbiAgfVxufTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgVEhSRUUuQnVmZmVyQXR0cmlidXRlIHdpdGggVVYgY29vcmRpbmF0ZXMuXG4gKi9cbk1vZGVsQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmJ1ZmZlclVWcyA9IGZ1bmN0aW9uKCkge1xuICBjb25zdCB1dkJ1ZmZlciA9IHRoaXMuY3JlYXRlQXR0cmlidXRlKCd1dicsIDIpLmFycmF5O1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5mYWNlQ291bnQ7IGkrKykge1xuXG4gICAgY29uc3QgZmFjZSA9IHRoaXMubW9kZWxHZW9tZXRyeS5mYWNlc1tpXTtcbiAgICBsZXQgdXY7XG5cbiAgICB1diA9IHRoaXMubW9kZWxHZW9tZXRyeS5mYWNlVmVydGV4VXZzWzBdW2ldWzBdO1xuICAgIHV2QnVmZmVyW2ZhY2UuYSAqIDJdICAgICA9IHV2Lng7XG4gICAgdXZCdWZmZXJbZmFjZS5hICogMiArIDFdID0gdXYueTtcblxuICAgIHV2ID0gdGhpcy5tb2RlbEdlb21ldHJ5LmZhY2VWZXJ0ZXhVdnNbMF1baV1bMV07XG4gICAgdXZCdWZmZXJbZmFjZS5iICogMl0gICAgID0gdXYueDtcbiAgICB1dkJ1ZmZlcltmYWNlLmIgKiAyICsgMV0gPSB1di55O1xuXG4gICAgdXYgPSB0aGlzLm1vZGVsR2VvbWV0cnkuZmFjZVZlcnRleFV2c1swXVtpXVsyXTtcbiAgICB1dkJ1ZmZlcltmYWNlLmMgKiAyXSAgICAgPSB1di54O1xuICAgIHV2QnVmZmVyW2ZhY2UuYyAqIDIgKyAxXSA9IHV2Lnk7XG4gIH1cbn07XG5cbi8qKlxuICogQ3JlYXRlcyBhIFRIUkVFLkJ1ZmZlckF0dHJpYnV0ZSBvbiB0aGlzIGdlb21ldHJ5IGluc3RhbmNlLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIE5hbWUgb2YgdGhlIGF0dHJpYnV0ZS5cbiAqIEBwYXJhbSB7aW50fSBpdGVtU2l6ZSBOdW1iZXIgb2YgZmxvYXRzIHBlciB2ZXJ0ZXggKHR5cGljYWxseSAxLCAyLCAzIG9yIDQpLlxuICogQHBhcmFtIHtmdW5jdGlvbj19IGZhY3RvcnkgRnVuY3Rpb24gdGhhdCB3aWxsIGJlIGNhbGxlZCBmb3IgZWFjaCBmYWNlIHVwb24gY3JlYXRpb24uIEFjY2VwdHMgMyBhcmd1bWVudHM6IGRhdGFbXSwgaW5kZXggYW5kIGZhY2VDb3VudC4gQ2FsbHMgc2V0RmFjZURhdGEuXG4gKlxuICogQHJldHVybnMge1RIUkVFLkJ1ZmZlckF0dHJpYnV0ZX1cbiAqL1xuTW9kZWxCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuY3JlYXRlQXR0cmlidXRlID0gZnVuY3Rpb24obmFtZSwgaXRlbVNpemUsIGZhY3RvcnkpIHtcbiAgY29uc3QgYnVmZmVyID0gbmV3IEZsb2F0MzJBcnJheSh0aGlzLnZlcnRleENvdW50ICogaXRlbVNpemUpO1xuICBjb25zdCBhdHRyaWJ1dGUgPSBuZXcgVEhSRUUuQnVmZmVyQXR0cmlidXRlKGJ1ZmZlciwgaXRlbVNpemUpO1xuXG4gIHRoaXMuYWRkQXR0cmlidXRlKG5hbWUsIGF0dHJpYnV0ZSk7XG5cbiAgaWYgKGZhY3RvcnkpIHtcbiAgICBjb25zdCBkYXRhID0gW107XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuZmFjZUNvdW50OyBpKyspIHtcbiAgICAgIGZhY3RvcnkoZGF0YSwgaSwgdGhpcy5mYWNlQ291bnQpO1xuICAgICAgdGhpcy5zZXRGYWNlRGF0YShhdHRyaWJ1dGUsIGksIGRhdGEpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBhdHRyaWJ1dGU7XG59O1xuXG4vKipcbiAqIFNldHMgZGF0YSBmb3IgYWxsIHZlcnRpY2VzIG9mIGEgZmFjZSBhdCBhIGdpdmVuIGluZGV4LlxuICogVXN1YWxseSBjYWxsZWQgaW4gYSBsb29wLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfFRIUkVFLkJ1ZmZlckF0dHJpYnV0ZX0gYXR0cmlidXRlIFRoZSBhdHRyaWJ1dGUgb3IgYXR0cmlidXRlIG5hbWUgd2hlcmUgdGhlIGRhdGEgaXMgdG8gYmUgc3RvcmVkLlxuICogQHBhcmFtIHtpbnR9IGZhY2VJbmRleCBJbmRleCBvZiB0aGUgZmFjZSBpbiB0aGUgYnVmZmVyIGdlb21ldHJ5LlxuICogQHBhcmFtIHtBcnJheX0gZGF0YSBBcnJheSBvZiBkYXRhLiBMZW5ndGggc2hvdWxkIGJlIGVxdWFsIHRvIGl0ZW0gc2l6ZSBvZiB0aGUgYXR0cmlidXRlLlxuICovXG5Nb2RlbEJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5zZXRGYWNlRGF0YSA9IGZ1bmN0aW9uKGF0dHJpYnV0ZSwgZmFjZUluZGV4LCBkYXRhKSB7XG4gIGF0dHJpYnV0ZSA9ICh0eXBlb2YgYXR0cmlidXRlID09PSAnc3RyaW5nJykgPyB0aGlzLmF0dHJpYnV0ZXNbYXR0cmlidXRlXSA6IGF0dHJpYnV0ZTtcblxuICBsZXQgb2Zmc2V0ID0gZmFjZUluZGV4ICogMyAqIGF0dHJpYnV0ZS5pdGVtU2l6ZTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IDM7IGkrKykge1xuICAgIGZvciAobGV0IGogPSAwOyBqIDwgYXR0cmlidXRlLml0ZW1TaXplOyBqKyspIHtcbiAgICAgIGF0dHJpYnV0ZS5hcnJheVtvZmZzZXQrK10gPSBkYXRhW2pdO1xuICAgIH1cbiAgfVxufTtcblxuZXhwb3J0IHsgTW9kZWxCdWZmZXJHZW9tZXRyeSB9O1xuIiwiaW1wb3J0IHsgQnVmZmVyR2VvbWV0cnksIEJ1ZmZlckF0dHJpYnV0ZSB9IGZyb20gJ3RocmVlJztcblxuLyoqXG4gKiBBIFRIUkVFLkJ1ZmZlckdlb21ldHJ5IGNvbnNpc3RzIG9mIHBvaW50cy5cbiAqIEBwYXJhbSB7TnVtYmVyfSBjb3VudCBUaGUgbnVtYmVyIG9mIHBvaW50cy5cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBQb2ludEJ1ZmZlckdlb21ldHJ5KGNvdW50KSB7XG4gIEJ1ZmZlckdlb21ldHJ5LmNhbGwodGhpcyk7XG5cbiAgLyoqXG4gICAqIE51bWJlciBvZiBwb2ludHMuXG4gICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAqL1xuICB0aGlzLnBvaW50Q291bnQgPSBjb3VudDtcblxuICB0aGlzLmJ1ZmZlclBvc2l0aW9ucygpO1xufVxuUG9pbnRCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZSk7XG5Qb2ludEJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFBvaW50QnVmZmVyR2VvbWV0cnk7XG5cblBvaW50QnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmJ1ZmZlclBvc2l0aW9ucyA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLmNyZWF0ZUF0dHJpYnV0ZSgncG9zaXRpb24nLCAzKTtcbn07XG5cbi8qKlxuICogQ3JlYXRlcyBhIFRIUkVFLkJ1ZmZlckF0dHJpYnV0ZSBvbiB0aGlzIGdlb21ldHJ5IGluc3RhbmNlLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIE5hbWUgb2YgdGhlIGF0dHJpYnV0ZS5cbiAqIEBwYXJhbSB7TnVtYmVyfSBpdGVtU2l6ZSBOdW1iZXIgb2YgZmxvYXRzIHBlciB2ZXJ0ZXggKHR5cGljYWxseSAxLCAyLCAzIG9yIDQpLlxuICogQHBhcmFtIHtmdW5jdGlvbj19IGZhY3RvcnkgRnVuY3Rpb24gdGhhdCB3aWxsIGJlIGNhbGxlZCBmb3IgZWFjaCBwb2ludCB1cG9uIGNyZWF0aW9uLiBBY2NlcHRzIDMgYXJndW1lbnRzOiBkYXRhW10sIGluZGV4IGFuZCBwcmVmYWJDb3VudC4gQ2FsbHMgc2V0UG9pbnREYXRhLlxuICpcbiAqIEByZXR1cm5zIHtUSFJFRS5CdWZmZXJBdHRyaWJ1dGV9XG4gKi9cblBvaW50QnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmNyZWF0ZUF0dHJpYnV0ZSA9IGZ1bmN0aW9uKG5hbWUsIGl0ZW1TaXplLCBmYWN0b3J5KSB7XG4gIGNvbnN0IGJ1ZmZlciA9IG5ldyBGbG9hdDMyQXJyYXkodGhpcy5wb2ludENvdW50ICogaXRlbVNpemUpO1xuICBjb25zdCBhdHRyaWJ1dGUgPSBuZXcgQnVmZmVyQXR0cmlidXRlKGJ1ZmZlciwgaXRlbVNpemUpO1xuXG4gIHRoaXMuYWRkQXR0cmlidXRlKG5hbWUsIGF0dHJpYnV0ZSk7XG5cbiAgaWYgKGZhY3RvcnkpIHtcbiAgICBjb25zdCBkYXRhID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnBvaW50Q291bnQ7IGkrKykge1xuICAgICAgZmFjdG9yeShkYXRhLCBpLCB0aGlzLnBvaW50Q291bnQpO1xuICAgICAgdGhpcy5zZXRQb2ludERhdGEoYXR0cmlidXRlLCBpLCBkYXRhKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gYXR0cmlidXRlO1xufTtcblxuUG9pbnRCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuc2V0UG9pbnREYXRhID0gZnVuY3Rpb24oYXR0cmlidXRlLCBwb2ludEluZGV4LCBkYXRhKSB7XG4gIGF0dHJpYnV0ZSA9ICh0eXBlb2YgYXR0cmlidXRlID09PSAnc3RyaW5nJykgPyB0aGlzLmF0dHJpYnV0ZXNbYXR0cmlidXRlXSA6IGF0dHJpYnV0ZTtcblxuICBsZXQgb2Zmc2V0ID0gcG9pbnRJbmRleCAqIGF0dHJpYnV0ZS5pdGVtU2l6ZTtcblxuICBmb3IgKGxldCBqID0gMDsgaiA8IGF0dHJpYnV0ZS5pdGVtU2l6ZTsgaisrKSB7XG4gICAgYXR0cmlidXRlLmFycmF5W29mZnNldCsrXSA9IGRhdGFbal07XG4gIH1cbn07XG5cbmV4cG9ydCB7IFBvaW50QnVmZmVyR2VvbWV0cnkgfTtcbiIsIi8vIGdlbmVyYXRlZCBieSBzY3JpcHRzL2J1aWxkX3NoYWRlcl9jaHVua3MuanNcblxuaW1wb3J0IGNhdG11bGxfcm9tX3NwbGluZSBmcm9tICcuL2dsc2wvY2F0bXVsbF9yb21fc3BsaW5lLmdsc2wnO1xuaW1wb3J0IGN1YmljX2JlemllciBmcm9tICcuL2dsc2wvY3ViaWNfYmV6aWVyLmdsc2wnO1xuaW1wb3J0IGVhc2VfYmFja19pbiBmcm9tICcuL2dsc2wvZWFzZV9iYWNrX2luLmdsc2wnO1xuaW1wb3J0IGVhc2VfYmFja19pbl9vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfYmFja19pbl9vdXQuZ2xzbCc7XG5pbXBvcnQgZWFzZV9iYWNrX291dCBmcm9tICcuL2dsc2wvZWFzZV9iYWNrX291dC5nbHNsJztcbmltcG9ydCBlYXNlX2JlemllciBmcm9tICcuL2dsc2wvZWFzZV9iZXppZXIuZ2xzbCc7XG5pbXBvcnQgZWFzZV9ib3VuY2VfaW4gZnJvbSAnLi9nbHNsL2Vhc2VfYm91bmNlX2luLmdsc2wnO1xuaW1wb3J0IGVhc2VfYm91bmNlX2luX291dCBmcm9tICcuL2dsc2wvZWFzZV9ib3VuY2VfaW5fb3V0Lmdsc2wnO1xuaW1wb3J0IGVhc2VfYm91bmNlX291dCBmcm9tICcuL2dsc2wvZWFzZV9ib3VuY2Vfb3V0Lmdsc2wnO1xuaW1wb3J0IGVhc2VfY2lyY19pbiBmcm9tICcuL2dsc2wvZWFzZV9jaXJjX2luLmdsc2wnO1xuaW1wb3J0IGVhc2VfY2lyY19pbl9vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfY2lyY19pbl9vdXQuZ2xzbCc7XG5pbXBvcnQgZWFzZV9jaXJjX291dCBmcm9tICcuL2dsc2wvZWFzZV9jaXJjX291dC5nbHNsJztcbmltcG9ydCBlYXNlX2N1YmljX2luIGZyb20gJy4vZ2xzbC9lYXNlX2N1YmljX2luLmdsc2wnO1xuaW1wb3J0IGVhc2VfY3ViaWNfaW5fb3V0IGZyb20gJy4vZ2xzbC9lYXNlX2N1YmljX2luX291dC5nbHNsJztcbmltcG9ydCBlYXNlX2N1YmljX291dCBmcm9tICcuL2dsc2wvZWFzZV9jdWJpY19vdXQuZ2xzbCc7XG5pbXBvcnQgZWFzZV9lbGFzdGljX2luIGZyb20gJy4vZ2xzbC9lYXNlX2VsYXN0aWNfaW4uZ2xzbCc7XG5pbXBvcnQgZWFzZV9lbGFzdGljX2luX291dCBmcm9tICcuL2dsc2wvZWFzZV9lbGFzdGljX2luX291dC5nbHNsJztcbmltcG9ydCBlYXNlX2VsYXN0aWNfb3V0IGZyb20gJy4vZ2xzbC9lYXNlX2VsYXN0aWNfb3V0Lmdsc2wnO1xuaW1wb3J0IGVhc2VfZXhwb19pbiBmcm9tICcuL2dsc2wvZWFzZV9leHBvX2luLmdsc2wnO1xuaW1wb3J0IGVhc2VfZXhwb19pbl9vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfZXhwb19pbl9vdXQuZ2xzbCc7XG5pbXBvcnQgZWFzZV9leHBvX291dCBmcm9tICcuL2dsc2wvZWFzZV9leHBvX291dC5nbHNsJztcbmltcG9ydCBlYXNlX3F1YWRfaW4gZnJvbSAnLi9nbHNsL2Vhc2VfcXVhZF9pbi5nbHNsJztcbmltcG9ydCBlYXNlX3F1YWRfaW5fb3V0IGZyb20gJy4vZ2xzbC9lYXNlX3F1YWRfaW5fb3V0Lmdsc2wnO1xuaW1wb3J0IGVhc2VfcXVhZF9vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfcXVhZF9vdXQuZ2xzbCc7XG5pbXBvcnQgZWFzZV9xdWFydF9pbiBmcm9tICcuL2dsc2wvZWFzZV9xdWFydF9pbi5nbHNsJztcbmltcG9ydCBlYXNlX3F1YXJ0X2luX291dCBmcm9tICcuL2dsc2wvZWFzZV9xdWFydF9pbl9vdXQuZ2xzbCc7XG5pbXBvcnQgZWFzZV9xdWFydF9vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfcXVhcnRfb3V0Lmdsc2wnO1xuaW1wb3J0IGVhc2VfcXVpbnRfaW4gZnJvbSAnLi9nbHNsL2Vhc2VfcXVpbnRfaW4uZ2xzbCc7XG5pbXBvcnQgZWFzZV9xdWludF9pbl9vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfcXVpbnRfaW5fb3V0Lmdsc2wnO1xuaW1wb3J0IGVhc2VfcXVpbnRfb3V0IGZyb20gJy4vZ2xzbC9lYXNlX3F1aW50X291dC5nbHNsJztcbmltcG9ydCBlYXNlX3NpbmVfaW4gZnJvbSAnLi9nbHNsL2Vhc2Vfc2luZV9pbi5nbHNsJztcbmltcG9ydCBlYXNlX3NpbmVfaW5fb3V0IGZyb20gJy4vZ2xzbC9lYXNlX3NpbmVfaW5fb3V0Lmdsc2wnO1xuaW1wb3J0IGVhc2Vfc2luZV9vdXQgZnJvbSAnLi9nbHNsL2Vhc2Vfc2luZV9vdXQuZ2xzbCc7XG5pbXBvcnQgcXVhdGVybmlvbl9yb3RhdGlvbiBmcm9tICcuL2dsc2wvcXVhdGVybmlvbl9yb3RhdGlvbi5nbHNsJztcbmltcG9ydCBxdWF0ZXJuaW9uX3NsZXJwIGZyb20gJy4vZ2xzbC9xdWF0ZXJuaW9uX3NsZXJwLmdsc2wnO1xuXG5cbmV4cG9ydCBjb25zdCBTaGFkZXJDaHVuayA9IHtcbiAgY2F0bXVsbF9yb21fc3BsaW5lOiBjYXRtdWxsX3JvbV9zcGxpbmUsXG4gIGN1YmljX2JlemllcjogY3ViaWNfYmV6aWVyLFxuICBlYXNlX2JhY2tfaW46IGVhc2VfYmFja19pbixcbiAgZWFzZV9iYWNrX2luX291dDogZWFzZV9iYWNrX2luX291dCxcbiAgZWFzZV9iYWNrX291dDogZWFzZV9iYWNrX291dCxcbiAgZWFzZV9iZXppZXI6IGVhc2VfYmV6aWVyLFxuICBlYXNlX2JvdW5jZV9pbjogZWFzZV9ib3VuY2VfaW4sXG4gIGVhc2VfYm91bmNlX2luX291dDogZWFzZV9ib3VuY2VfaW5fb3V0LFxuICBlYXNlX2JvdW5jZV9vdXQ6IGVhc2VfYm91bmNlX291dCxcbiAgZWFzZV9jaXJjX2luOiBlYXNlX2NpcmNfaW4sXG4gIGVhc2VfY2lyY19pbl9vdXQ6IGVhc2VfY2lyY19pbl9vdXQsXG4gIGVhc2VfY2lyY19vdXQ6IGVhc2VfY2lyY19vdXQsXG4gIGVhc2VfY3ViaWNfaW46IGVhc2VfY3ViaWNfaW4sXG4gIGVhc2VfY3ViaWNfaW5fb3V0OiBlYXNlX2N1YmljX2luX291dCxcbiAgZWFzZV9jdWJpY19vdXQ6IGVhc2VfY3ViaWNfb3V0LFxuICBlYXNlX2VsYXN0aWNfaW46IGVhc2VfZWxhc3RpY19pbixcbiAgZWFzZV9lbGFzdGljX2luX291dDogZWFzZV9lbGFzdGljX2luX291dCxcbiAgZWFzZV9lbGFzdGljX291dDogZWFzZV9lbGFzdGljX291dCxcbiAgZWFzZV9leHBvX2luOiBlYXNlX2V4cG9faW4sXG4gIGVhc2VfZXhwb19pbl9vdXQ6IGVhc2VfZXhwb19pbl9vdXQsXG4gIGVhc2VfZXhwb19vdXQ6IGVhc2VfZXhwb19vdXQsXG4gIGVhc2VfcXVhZF9pbjogZWFzZV9xdWFkX2luLFxuICBlYXNlX3F1YWRfaW5fb3V0OiBlYXNlX3F1YWRfaW5fb3V0LFxuICBlYXNlX3F1YWRfb3V0OiBlYXNlX3F1YWRfb3V0LFxuICBlYXNlX3F1YXJ0X2luOiBlYXNlX3F1YXJ0X2luLFxuICBlYXNlX3F1YXJ0X2luX291dDogZWFzZV9xdWFydF9pbl9vdXQsXG4gIGVhc2VfcXVhcnRfb3V0OiBlYXNlX3F1YXJ0X291dCxcbiAgZWFzZV9xdWludF9pbjogZWFzZV9xdWludF9pbixcbiAgZWFzZV9xdWludF9pbl9vdXQ6IGVhc2VfcXVpbnRfaW5fb3V0LFxuICBlYXNlX3F1aW50X291dDogZWFzZV9xdWludF9vdXQsXG4gIGVhc2Vfc2luZV9pbjogZWFzZV9zaW5lX2luLFxuICBlYXNlX3NpbmVfaW5fb3V0OiBlYXNlX3NpbmVfaW5fb3V0LFxuICBlYXNlX3NpbmVfb3V0OiBlYXNlX3NpbmVfb3V0LFxuICBxdWF0ZXJuaW9uX3JvdGF0aW9uOiBxdWF0ZXJuaW9uX3JvdGF0aW9uLFxuICBxdWF0ZXJuaW9uX3NsZXJwOiBxdWF0ZXJuaW9uX3NsZXJwLFxuXG59O1xuXG4iLCIvKipcbiAqIEEgdGltZWxpbmUgdHJhbnNpdGlvbiBzZWdtZW50LiBBbiBpbnN0YW5jZSBvZiB0aGlzIGNsYXNzIGlzIGNyZWF0ZWQgaW50ZXJuYWxseSB3aGVuIGNhbGxpbmcge0BsaW5rIFRIUkVFLkJBUy5UaW1lbGluZS5hZGR9LCBzbyB5b3Ugc2hvdWxkIG5vdCB1c2UgdGhpcyBjbGFzcyBkaXJlY3RseS5cbiAqIFRoZSBpbnN0YW5jZSBpcyBhbHNvIHBhc3NlZCB0aGUgdGhlIGNvbXBpbGVyIGZ1bmN0aW9uIGlmIHlvdSByZWdpc3RlciBhIHRyYW5zaXRpb24gdGhyb3VnaCB7QGxpbmsgVEhSRUUuQkFTLlRpbWVsaW5lLnJlZ2lzdGVyfS4gVGhlcmUgeW91IGNhbiB1c2UgdGhlIHB1YmxpYyBwcm9wZXJ0aWVzIG9mIHRoZSBzZWdtZW50IHRvIGNvbXBpbGUgdGhlIGdsc2wgc3RyaW5nLlxuICogQHBhcmFtIHtzdHJpbmd9IGtleSBBIHN0cmluZyBrZXkgZ2VuZXJhdGVkIGJ5IHRoZSB0aW1lbGluZSB0byB3aGljaCB0aGlzIHNlZ21lbnQgYmVsb25ncy4gS2V5cyBhcmUgdW5pcXVlLlxuICogQHBhcmFtIHtudW1iZXJ9IHN0YXJ0IFN0YXJ0IHRpbWUgb2YgdGhpcyBzZWdtZW50IGluIGEgdGltZWxpbmUgaW4gc2Vjb25kcy5cbiAqIEBwYXJhbSB7bnVtYmVyfSBkdXJhdGlvbiBEdXJhdGlvbiBvZiB0aGlzIHNlZ21lbnQgaW4gc2Vjb25kcy5cbiAqIEBwYXJhbSB7b2JqZWN0fSB0cmFuc2l0aW9uIE9iamVjdCBkZXNjcmliaW5nIHRoZSB0cmFuc2l0aW9uLlxuICogQHBhcmFtIHtmdW5jdGlvbn0gY29tcGlsZXIgQSByZWZlcmVuY2UgdG8gdGhlIGNvbXBpbGVyIGZ1bmN0aW9uIGZyb20gYSB0cmFuc2l0aW9uIGRlZmluaXRpb24uXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gVGltZWxpbmVTZWdtZW50KGtleSwgc3RhcnQsIGR1cmF0aW9uLCB0cmFuc2l0aW9uLCBjb21waWxlcikge1xuICB0aGlzLmtleSA9IGtleTtcbiAgdGhpcy5zdGFydCA9IHN0YXJ0O1xuICB0aGlzLmR1cmF0aW9uID0gZHVyYXRpb247XG4gIHRoaXMudHJhbnNpdGlvbiA9IHRyYW5zaXRpb247XG4gIHRoaXMuY29tcGlsZXIgPSBjb21waWxlcjtcblxuICB0aGlzLnRyYWlsID0gMDtcbn1cblxuVGltZWxpbmVTZWdtZW50LnByb3RvdHlwZS5jb21waWxlID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLmNvbXBpbGVyKHRoaXMpO1xufTtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KFRpbWVsaW5lU2VnbWVudC5wcm90b3R5cGUsICdlbmQnLCB7XG4gIGdldDogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuc3RhcnQgKyB0aGlzLmR1cmF0aW9uO1xuICB9XG59KTtcblxuZXhwb3J0IHsgVGltZWxpbmVTZWdtZW50IH07XG4iLCJpbXBvcnQgeyBUaW1lbGluZVNlZ21lbnQgfSBmcm9tICcuL1RpbWVsaW5lU2VnbWVudCc7XG5cbi8qKlxuICogQSB1dGlsaXR5IGNsYXNzIHRvIGNyZWF0ZSBhbiBhbmltYXRpb24gdGltZWxpbmUgd2hpY2ggY2FuIGJlIGJha2VkIGludG8gYSAodmVydGV4KSBzaGFkZXIuXG4gKiBCeSBkZWZhdWx0IHRoZSB0aW1lbGluZSBzdXBwb3J0cyB0cmFuc2xhdGlvbiwgc2NhbGUgYW5kIHJvdGF0aW9uLiBUaGlzIGNhbiBiZSBleHRlbmRlZCBvciBvdmVycmlkZGVuLlxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIFRpbWVsaW5lKCkge1xuICAvKipcbiAgICogVGhlIHRvdGFsIGR1cmF0aW9uIG9mIHRoZSB0aW1lbGluZSBpbiBzZWNvbmRzLlxuICAgKiBAdHlwZSB7bnVtYmVyfVxuICAgKi9cbiAgdGhpcy5kdXJhdGlvbiA9IDA7XG5cbiAgLyoqXG4gICAqIFRoZSBuYW1lIG9mIHRoZSB2YWx1ZSB0aGF0IHNlZ21lbnRzIHdpbGwgdXNlIHRvIHJlYWQgdGhlIHRpbWUuIERlZmF1bHRzIHRvICd0VGltZScuXG4gICAqIEB0eXBlIHtzdHJpbmd9XG4gICAqL1xuICB0aGlzLnRpbWVLZXkgPSAndFRpbWUnO1xuXG4gIHRoaXMuc2VnbWVudHMgPSB7fTtcbiAgdGhpcy5fX2tleSA9IDA7XG59XG5cbi8vIHN0YXRpYyBkZWZpbml0aW9ucyBtYXBcblRpbWVsaW5lLnNlZ21lbnREZWZpbml0aW9ucyA9IHt9O1xuXG4vKipcbiAqIFJlZ2lzdGVycyBhIHRyYW5zaXRpb24gZGVmaW5pdGlvbiBmb3IgdXNlIHdpdGgge0BsaW5rIFRIUkVFLkJBUy5UaW1lbGluZS5hZGR9LlxuICogQHBhcmFtIHtTdHJpbmd9IGtleSBOYW1lIG9mIHRoZSB0cmFuc2l0aW9uLiBEZWZhdWx0cyBpbmNsdWRlICdzY2FsZScsICdyb3RhdGUnIGFuZCAndHJhbnNsYXRlJy5cbiAqIEBwYXJhbSB7T2JqZWN0fSBkZWZpbml0aW9uXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBkZWZpbml0aW9uLmNvbXBpbGVyIEEgZnVuY3Rpb24gdGhhdCBnZW5lcmF0ZXMgYSBnbHNsIHN0cmluZyBmb3IgYSB0cmFuc2l0aW9uIHNlZ21lbnQuIEFjY2VwdHMgYSBUSFJFRS5CQVMuVGltZWxpbmVTZWdtZW50IGFzIHRoZSBzb2xlIGFyZ3VtZW50LlxuICogQHBhcmFtIHsqfSBkZWZpbml0aW9uLmRlZmF1bHRGcm9tIFRoZSBpbml0aWFsIHZhbHVlIGZvciBhIHRyYW5zZm9ybS5mcm9tLiBGb3IgZXhhbXBsZSwgdGhlIGRlZmF1bHRGcm9tIGZvciBhIHRyYW5zbGF0aW9uIGlzIFRIUkVFLlZlY3RvcjMoMCwgMCwgMCkuXG4gKiBAc3RhdGljXG4gKi9cblRpbWVsaW5lLnJlZ2lzdGVyID0gZnVuY3Rpb24oa2V5LCBkZWZpbml0aW9uKSB7XG4gIFRpbWVsaW5lLnNlZ21lbnREZWZpbml0aW9uc1trZXldID0gZGVmaW5pdGlvbjtcbiAgXG4gIHJldHVybiBkZWZpbml0aW9uO1xufTtcblxuLyoqXG4gKiBBZGQgYSB0cmFuc2l0aW9uIHRvIHRoZSB0aW1lbGluZS5cbiAqIEBwYXJhbSB7bnVtYmVyfSBkdXJhdGlvbiBEdXJhdGlvbiBpbiBzZWNvbmRzXG4gKiBAcGFyYW0ge29iamVjdH0gdHJhbnNpdGlvbnMgQW4gb2JqZWN0IGNvbnRhaW5pbmcgb25lIG9yIHNldmVyYWwgdHJhbnNpdGlvbnMuIFRoZSBrZXlzIHNob3VsZCBtYXRjaCB0cmFuc2Zvcm0gZGVmaW5pdGlvbnMuXG4gKiBUaGUgdHJhbnNpdGlvbiBvYmplY3QgZm9yIGVhY2gga2V5IHdpbGwgYmUgcGFzc2VkIHRvIHRoZSBtYXRjaGluZyBkZWZpbml0aW9uJ3MgY29tcGlsZXIuIEl0IGNhbiBoYXZlIGFyYml0cmFyeSBwcm9wZXJ0aWVzLCBidXQgdGhlIFRpbWVsaW5lIGV4cGVjdHMgYXQgbGVhc3QgYSAndG8nLCAnZnJvbScgYW5kIGFuIG9wdGlvbmFsICdlYXNlJy5cbiAqIEBwYXJhbSB7bnVtYmVyfHN0cmluZ30gW3Bvc2l0aW9uT2Zmc2V0XSBQb3NpdGlvbiBpbiB0aGUgdGltZWxpbmUuIERlZmF1bHRzIHRvIHRoZSBlbmQgb2YgdGhlIHRpbWVsaW5lLiBJZiBhIG51bWJlciBpcyBwcm92aWRlZCwgdGhlIHRyYW5zaXRpb24gd2lsbCBiZSBpbnNlcnRlZCBhdCB0aGF0IHRpbWUgaW4gc2Vjb25kcy4gU3RyaW5ncyAoJys9eCcgb3IgJy09eCcpIGNhbiBiZSB1c2VkIGZvciBhIHZhbHVlIHJlbGF0aXZlIHRvIHRoZSBlbmQgb2YgdGltZWxpbmUuXG4gKi9cblRpbWVsaW5lLnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbihkdXJhdGlvbiwgdHJhbnNpdGlvbnMsIHBvc2l0aW9uT2Zmc2V0KSB7XG4gIC8vIHN0b3Agcm9sbHVwIGZyb20gY29tcGxhaW5pbmcgYWJvdXQgZXZhbFxuICBjb25zdCBfZXZhbCA9IGV2YWw7XG4gIFxuICBsZXQgc3RhcnQgPSB0aGlzLmR1cmF0aW9uO1xuXG4gIGlmIChwb3NpdGlvbk9mZnNldCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgaWYgKHR5cGVvZiBwb3NpdGlvbk9mZnNldCA9PT0gJ251bWJlcicpIHtcbiAgICAgIHN0YXJ0ID0gcG9zaXRpb25PZmZzZXQ7XG4gICAgfVxuICAgIGVsc2UgaWYgKHR5cGVvZiBwb3NpdGlvbk9mZnNldCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIF9ldmFsKCdzdGFydCcgKyBwb3NpdGlvbk9mZnNldCk7XG4gICAgfVxuXG4gICAgdGhpcy5kdXJhdGlvbiA9IE1hdGgubWF4KHRoaXMuZHVyYXRpb24sIHN0YXJ0ICsgZHVyYXRpb24pO1xuICB9XG4gIGVsc2Uge1xuICAgIHRoaXMuZHVyYXRpb24gKz0gZHVyYXRpb247XG4gIH1cblxuICBsZXQga2V5cyA9IE9iamVjdC5rZXlzKHRyYW5zaXRpb25zKSwga2V5O1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7IGkrKykge1xuICAgIGtleSA9IGtleXNbaV07XG5cbiAgICB0aGlzLnByb2Nlc3NUcmFuc2l0aW9uKGtleSwgdHJhbnNpdGlvbnNba2V5XSwgc3RhcnQsIGR1cmF0aW9uKTtcbiAgfVxufTtcblxuVGltZWxpbmUucHJvdG90eXBlLnByb2Nlc3NUcmFuc2l0aW9uID0gZnVuY3Rpb24oa2V5LCB0cmFuc2l0aW9uLCBzdGFydCwgZHVyYXRpb24pIHtcbiAgY29uc3QgZGVmaW5pdGlvbiA9IFRpbWVsaW5lLnNlZ21lbnREZWZpbml0aW9uc1trZXldO1xuXG4gIGxldCBzZWdtZW50cyA9IHRoaXMuc2VnbWVudHNba2V5XTtcbiAgaWYgKCFzZWdtZW50cykgc2VnbWVudHMgPSB0aGlzLnNlZ21lbnRzW2tleV0gPSBbXTtcblxuICBpZiAodHJhbnNpdGlvbi5mcm9tID09PSB1bmRlZmluZWQpIHtcbiAgICBpZiAoc2VnbWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICB0cmFuc2l0aW9uLmZyb20gPSBkZWZpbml0aW9uLmRlZmF1bHRGcm9tO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHRyYW5zaXRpb24uZnJvbSA9IHNlZ21lbnRzW3NlZ21lbnRzLmxlbmd0aCAtIDFdLnRyYW5zaXRpb24udG87XG4gICAgfVxuICB9XG5cbiAgc2VnbWVudHMucHVzaChuZXcgVGltZWxpbmVTZWdtZW50KCh0aGlzLl9fa2V5KyspLnRvU3RyaW5nKCksIHN0YXJ0LCBkdXJhdGlvbiwgdHJhbnNpdGlvbiwgZGVmaW5pdGlvbi5jb21waWxlcikpO1xufTtcblxuLyoqXG4gKiBDb21waWxlcyB0aGUgdGltZWxpbmUgaW50byBhIGdsc2wgc3RyaW5nIGFycmF5IHRoYXQgY2FuIGJlIGluamVjdGVkIGludG8gYSAodmVydGV4KSBzaGFkZXIuXG4gKiBAcmV0dXJucyB7QXJyYXl9XG4gKi9cblRpbWVsaW5lLnByb3RvdHlwZS5jb21waWxlID0gZnVuY3Rpb24oKSB7XG4gIGNvbnN0IGMgPSBbXTtcblxuICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXModGhpcy5zZWdtZW50cyk7XG4gIGxldCBzZWdtZW50cztcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyBpKyspIHtcbiAgICBzZWdtZW50cyA9IHRoaXMuc2VnbWVudHNba2V5c1tpXV07XG5cbiAgICB0aGlzLmZpbGxHYXBzKHNlZ21lbnRzKTtcblxuICAgIHNlZ21lbnRzLmZvckVhY2goZnVuY3Rpb24ocykge1xuICAgICAgYy5wdXNoKHMuY29tcGlsZSgpKTtcbiAgICB9KTtcbiAgfVxuXG4gIHJldHVybiBjO1xufTtcblRpbWVsaW5lLnByb3RvdHlwZS5maWxsR2FwcyA9IGZ1bmN0aW9uKHNlZ21lbnRzKSB7XG4gIGlmIChzZWdtZW50cy5sZW5ndGggPT09IDApIHJldHVybjtcblxuICBsZXQgczAsIHMxO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgc2VnbWVudHMubGVuZ3RoIC0gMTsgaSsrKSB7XG4gICAgczAgPSBzZWdtZW50c1tpXTtcbiAgICBzMSA9IHNlZ21lbnRzW2kgKyAxXTtcblxuICAgIHMwLnRyYWlsID0gczEuc3RhcnQgLSBzMC5lbmQ7XG4gIH1cblxuICAvLyBwYWQgbGFzdCBzZWdtZW50IHVudGlsIGVuZCBvZiB0aW1lbGluZVxuICBzMCA9IHNlZ21lbnRzW3NlZ21lbnRzLmxlbmd0aCAtIDFdO1xuICBzMC50cmFpbCA9IHRoaXMuZHVyYXRpb24gLSBzMC5lbmQ7XG59O1xuXG4vKipcbiAqIEdldCBhIGNvbXBpbGVkIGdsc2wgc3RyaW5nIHdpdGggY2FsbHMgdG8gdHJhbnNmb3JtIGZ1bmN0aW9ucyBmb3IgYSBnaXZlbiBrZXkuXG4gKiBUaGUgb3JkZXIgaW4gd2hpY2ggdGhlc2UgdHJhbnNpdGlvbnMgYXJlIGFwcGxpZWQgbWF0dGVycyBiZWNhdXNlIHRoZXkgYWxsIG9wZXJhdGUgb24gdGhlIHNhbWUgdmFsdWUuXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IEEga2V5IG1hdGNoaW5nIGEgdHJhbnNmb3JtIGRlZmluaXRpb24uXG4gKiBAcmV0dXJucyB7c3RyaW5nfVxuICovXG5UaW1lbGluZS5wcm90b3R5cGUuZ2V0VHJhbnNmb3JtQ2FsbHMgPSBmdW5jdGlvbihrZXkpIHtcbiAgbGV0IHQgPSB0aGlzLnRpbWVLZXk7XG5cbiAgcmV0dXJuIHRoaXMuc2VnbWVudHNba2V5XSA/ICB0aGlzLnNlZ21lbnRzW2tleV0ubWFwKGZ1bmN0aW9uKHMpIHtcbiAgICByZXR1cm4gYGFwcGx5VHJhbnNmb3JtJHtzLmtleX0oJHt0fSwgdHJhbnNmb3JtZWQpO2A7XG4gIH0pLmpvaW4oJ1xcbicpIDogJyc7XG59O1xuXG5leHBvcnQgeyBUaW1lbGluZSB9XG4iLCJjb25zdCBUaW1lbGluZUNodW5rcyA9IHtcbiAgdmVjMzogZnVuY3Rpb24obiwgdiwgcCkge1xuICAgIGNvbnN0IHggPSAodi54IHx8IDApLnRvUHJlY2lzaW9uKHApO1xuICAgIGNvbnN0IHkgPSAodi55IHx8IDApLnRvUHJlY2lzaW9uKHApO1xuICAgIGNvbnN0IHogPSAodi56IHx8IDApLnRvUHJlY2lzaW9uKHApO1xuXG4gICAgcmV0dXJuIGB2ZWMzICR7bn0gPSB2ZWMzKCR7eH0sICR7eX0sICR7en0pO2A7XG4gIH0sXG4gIHZlYzQ6IGZ1bmN0aW9uKG4sIHYsIHApIHtcbiAgICBjb25zdCB4ID0gKHYueCB8fCAwKS50b1ByZWNpc2lvbihwKTtcbiAgICBjb25zdCB5ID0gKHYueSB8fCAwKS50b1ByZWNpc2lvbihwKTtcbiAgICBjb25zdCB6ID0gKHYueiB8fCAwKS50b1ByZWNpc2lvbihwKTtcbiAgICBjb25zdCB3ID0gKHYudyB8fCAwKS50b1ByZWNpc2lvbihwKTtcbiAgXG4gICAgcmV0dXJuIGB2ZWM0ICR7bn0gPSB2ZWM0KCR7eH0sICR7eX0sICR7en0sICR7d30pO2A7XG4gIH0sXG4gIGRlbGF5RHVyYXRpb246IGZ1bmN0aW9uKHNlZ21lbnQpIHtcbiAgICByZXR1cm4gYFxuICAgIGZsb2F0IGNEZWxheSR7c2VnbWVudC5rZXl9ID0gJHtzZWdtZW50LnN0YXJ0LnRvUHJlY2lzaW9uKDQpfTtcbiAgICBmbG9hdCBjRHVyYXRpb24ke3NlZ21lbnQua2V5fSA9ICR7c2VnbWVudC5kdXJhdGlvbi50b1ByZWNpc2lvbig0KX07XG4gICAgYDtcbiAgfSxcbiAgcHJvZ3Jlc3M6IGZ1bmN0aW9uKHNlZ21lbnQpIHtcbiAgICAvLyB6ZXJvIGR1cmF0aW9uIHNlZ21lbnRzIHNob3VsZCBhbHdheXMgcmVuZGVyIGNvbXBsZXRlXG4gICAgaWYgKHNlZ21lbnQuZHVyYXRpb24gPT09IDApIHtcbiAgICAgIHJldHVybiBgZmxvYXQgcHJvZ3Jlc3MgPSAxLjA7YFxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHJldHVybiBgXG4gICAgICBmbG9hdCBwcm9ncmVzcyA9IGNsYW1wKHRpbWUgLSBjRGVsYXkke3NlZ21lbnQua2V5fSwgMC4wLCBjRHVyYXRpb24ke3NlZ21lbnQua2V5fSkgLyBjRHVyYXRpb24ke3NlZ21lbnQua2V5fTtcbiAgICAgICR7c2VnbWVudC50cmFuc2l0aW9uLmVhc2UgPyBgcHJvZ3Jlc3MgPSAke3NlZ21lbnQudHJhbnNpdGlvbi5lYXNlfShwcm9ncmVzcyR7KHNlZ21lbnQudHJhbnNpdGlvbi5lYXNlUGFyYW1zID8gYCwgJHtzZWdtZW50LnRyYW5zaXRpb24uZWFzZVBhcmFtcy5tYXAoKHYpID0+IHYudG9QcmVjaXNpb24oNCkpLmpvaW4oYCwgYCl9YCA6IGBgKX0pO2AgOiBgYH1cbiAgICAgIGA7XG4gICAgfVxuICB9LFxuICByZW5kZXJDaGVjazogZnVuY3Rpb24oc2VnbWVudCkge1xuICAgIGNvbnN0IHN0YXJ0VGltZSA9IHNlZ21lbnQuc3RhcnQudG9QcmVjaXNpb24oNCk7XG4gICAgY29uc3QgZW5kVGltZSA9IChzZWdtZW50LmVuZCArIHNlZ21lbnQudHJhaWwpLnRvUHJlY2lzaW9uKDQpO1xuXG4gICAgcmV0dXJuIGBpZiAodGltZSA8ICR7c3RhcnRUaW1lfSB8fCB0aW1lID4gJHtlbmRUaW1lfSkgcmV0dXJuO2A7XG4gIH1cbn07XG5cbmV4cG9ydCB7IFRpbWVsaW5lQ2h1bmtzIH07XG4iLCJpbXBvcnQgeyBUaW1lbGluZSB9IGZyb20gJy4vVGltZWxpbmUnO1xuaW1wb3J0IHsgVGltZWxpbmVDaHVua3MgfSBmcm9tICcuL1RpbWVsaW5lQ2h1bmtzJztcbmltcG9ydCB7IFZlY3RvcjMgfSBmcm9tICd0aHJlZSc7XG5cbmNvbnN0IFRyYW5zbGF0aW9uU2VnbWVudCA9IHtcbiAgY29tcGlsZXI6IGZ1bmN0aW9uKHNlZ21lbnQpIHtcbiAgICByZXR1cm4gYFxuICAgICR7VGltZWxpbmVDaHVua3MuZGVsYXlEdXJhdGlvbihzZWdtZW50KX1cbiAgICAke1RpbWVsaW5lQ2h1bmtzLnZlYzMoYGNUcmFuc2xhdGVGcm9tJHtzZWdtZW50LmtleX1gLCBzZWdtZW50LnRyYW5zaXRpb24uZnJvbSwgMil9XG4gICAgJHtUaW1lbGluZUNodW5rcy52ZWMzKGBjVHJhbnNsYXRlVG8ke3NlZ21lbnQua2V5fWAsIHNlZ21lbnQudHJhbnNpdGlvbi50bywgMil9XG4gICAgXG4gICAgdm9pZCBhcHBseVRyYW5zZm9ybSR7c2VnbWVudC5rZXl9KGZsb2F0IHRpbWUsIGlub3V0IHZlYzMgdikge1xuICAgIFxuICAgICAgJHtUaW1lbGluZUNodW5rcy5yZW5kZXJDaGVjayhzZWdtZW50KX1cbiAgICAgICR7VGltZWxpbmVDaHVua3MucHJvZ3Jlc3Moc2VnbWVudCl9XG4gICAgXG4gICAgICB2ICs9IG1peChjVHJhbnNsYXRlRnJvbSR7c2VnbWVudC5rZXl9LCBjVHJhbnNsYXRlVG8ke3NlZ21lbnQua2V5fSwgcHJvZ3Jlc3MpO1xuICAgIH1cbiAgICBgO1xuICB9LFxuICBkZWZhdWx0RnJvbTogbmV3IFZlY3RvcjMoMCwgMCwgMClcbn07XG5cblRpbWVsaW5lLnJlZ2lzdGVyKCd0cmFuc2xhdGUnLCBUcmFuc2xhdGlvblNlZ21lbnQpO1xuXG5leHBvcnQgeyBUcmFuc2xhdGlvblNlZ21lbnQgfTtcbiIsImltcG9ydCB7IFRpbWVsaW5lIH0gZnJvbSAnLi9UaW1lbGluZSc7XG5pbXBvcnQgeyBUaW1lbGluZUNodW5rcyB9IGZyb20gJy4vVGltZWxpbmVDaHVua3MnO1xuaW1wb3J0IHsgVmVjdG9yMyB9IGZyb20gJ3RocmVlJztcblxuY29uc3QgU2NhbGVTZWdtZW50ID0ge1xuICBjb21waWxlcjogZnVuY3Rpb24oc2VnbWVudCkge1xuICAgIGNvbnN0IG9yaWdpbiA9IHNlZ21lbnQudHJhbnNpdGlvbi5vcmlnaW47XG4gICAgXG4gICAgcmV0dXJuIGBcbiAgICAke1RpbWVsaW5lQ2h1bmtzLmRlbGF5RHVyYXRpb24oc2VnbWVudCl9XG4gICAgJHtUaW1lbGluZUNodW5rcy52ZWMzKGBjU2NhbGVGcm9tJHtzZWdtZW50LmtleX1gLCBzZWdtZW50LnRyYW5zaXRpb24uZnJvbSwgMil9XG4gICAgJHtUaW1lbGluZUNodW5rcy52ZWMzKGBjU2NhbGVUbyR7c2VnbWVudC5rZXl9YCwgc2VnbWVudC50cmFuc2l0aW9uLnRvLCAyKX1cbiAgICAke29yaWdpbiA/IFRpbWVsaW5lQ2h1bmtzLnZlYzMoYGNPcmlnaW4ke3NlZ21lbnQua2V5fWAsIG9yaWdpbiwgMikgOiAnJ31cbiAgICBcbiAgICB2b2lkIGFwcGx5VHJhbnNmb3JtJHtzZWdtZW50LmtleX0oZmxvYXQgdGltZSwgaW5vdXQgdmVjMyB2KSB7XG4gICAgXG4gICAgICAke1RpbWVsaW5lQ2h1bmtzLnJlbmRlckNoZWNrKHNlZ21lbnQpfVxuICAgICAgJHtUaW1lbGluZUNodW5rcy5wcm9ncmVzcyhzZWdtZW50KX1cbiAgICBcbiAgICAgICR7b3JpZ2luID8gYHYgLT0gY09yaWdpbiR7c2VnbWVudC5rZXl9O2AgOiAnJ31cbiAgICAgIHYgKj0gbWl4KGNTY2FsZUZyb20ke3NlZ21lbnQua2V5fSwgY1NjYWxlVG8ke3NlZ21lbnQua2V5fSwgcHJvZ3Jlc3MpO1xuICAgICAgJHtvcmlnaW4gPyBgdiArPSBjT3JpZ2luJHtzZWdtZW50LmtleX07YCA6ICcnfVxuICAgIH1cbiAgICBgO1xuICB9LFxuICBkZWZhdWx0RnJvbTogbmV3IFZlY3RvcjMoMSwgMSwgMSlcbn07XG5cblRpbWVsaW5lLnJlZ2lzdGVyKCdzY2FsZScsIFNjYWxlU2VnbWVudCk7XG5cbmV4cG9ydCB7IFNjYWxlU2VnbWVudCB9O1xuIiwiaW1wb3J0IHsgVGltZWxpbmUgfSBmcm9tICcuL1RpbWVsaW5lJztcbmltcG9ydCB7IFRpbWVsaW5lQ2h1bmtzIH0gZnJvbSAnLi9UaW1lbGluZUNodW5rcyc7XG5pbXBvcnQgeyBWZWN0b3IzLCBWZWN0b3I0IH0gZnJvbSAndGhyZWUnO1xuXG5jb25zdCBSb3RhdGlvblNlZ21lbnQgPSB7XG4gIGNvbXBpbGVyKHNlZ21lbnQpIHtcbiAgICBjb25zdCBmcm9tQXhpc0FuZ2xlID0gbmV3IFZlY3RvcjQoXG4gICAgICBzZWdtZW50LnRyYW5zaXRpb24uZnJvbS5heGlzLngsXG4gICAgICBzZWdtZW50LnRyYW5zaXRpb24uZnJvbS5heGlzLnksXG4gICAgICBzZWdtZW50LnRyYW5zaXRpb24uZnJvbS5heGlzLnosXG4gICAgICBzZWdtZW50LnRyYW5zaXRpb24uZnJvbS5hbmdsZVxuICAgICk7XG4gIFxuICAgIGNvbnN0IHRvQXhpcyA9IHNlZ21lbnQudHJhbnNpdGlvbi50by5heGlzIHx8IHNlZ21lbnQudHJhbnNpdGlvbi5mcm9tLmF4aXM7XG4gICAgY29uc3QgdG9BeGlzQW5nbGUgPSBuZXcgVmVjdG9yNChcbiAgICAgIHRvQXhpcy54LFxuICAgICAgdG9BeGlzLnksXG4gICAgICB0b0F4aXMueixcbiAgICAgIHNlZ21lbnQudHJhbnNpdGlvbi50by5hbmdsZVxuICAgICk7XG4gIFxuICAgIGNvbnN0IG9yaWdpbiA9IHNlZ21lbnQudHJhbnNpdGlvbi5vcmlnaW47XG4gICAgXG4gICAgcmV0dXJuIGBcbiAgICAke1RpbWVsaW5lQ2h1bmtzLmRlbGF5RHVyYXRpb24oc2VnbWVudCl9XG4gICAgJHtUaW1lbGluZUNodW5rcy52ZWM0KGBjUm90YXRpb25Gcm9tJHtzZWdtZW50LmtleX1gLCBmcm9tQXhpc0FuZ2xlLCA4KX1cbiAgICAke1RpbWVsaW5lQ2h1bmtzLnZlYzQoYGNSb3RhdGlvblRvJHtzZWdtZW50LmtleX1gLCB0b0F4aXNBbmdsZSwgOCl9XG4gICAgJHtvcmlnaW4gPyBUaW1lbGluZUNodW5rcy52ZWMzKGBjT3JpZ2luJHtzZWdtZW50LmtleX1gLCBvcmlnaW4sIDIpIDogJyd9XG4gICAgXG4gICAgdm9pZCBhcHBseVRyYW5zZm9ybSR7c2VnbWVudC5rZXl9KGZsb2F0IHRpbWUsIGlub3V0IHZlYzMgdikge1xuICAgICAgJHtUaW1lbGluZUNodW5rcy5yZW5kZXJDaGVjayhzZWdtZW50KX1cbiAgICAgICR7VGltZWxpbmVDaHVua3MucHJvZ3Jlc3Moc2VnbWVudCl9XG5cbiAgICAgICR7b3JpZ2luID8gYHYgLT0gY09yaWdpbiR7c2VnbWVudC5rZXl9O2AgOiAnJ31cbiAgICAgIHZlYzMgYXhpcyA9IG5vcm1hbGl6ZShtaXgoY1JvdGF0aW9uRnJvbSR7c2VnbWVudC5rZXl9Lnh5eiwgY1JvdGF0aW9uVG8ke3NlZ21lbnQua2V5fS54eXosIHByb2dyZXNzKSk7XG4gICAgICBmbG9hdCBhbmdsZSA9IG1peChjUm90YXRpb25Gcm9tJHtzZWdtZW50LmtleX0udywgY1JvdGF0aW9uVG8ke3NlZ21lbnQua2V5fS53LCBwcm9ncmVzcyk7XG4gICAgICB2ZWM0IHEgPSBxdWF0RnJvbUF4aXNBbmdsZShheGlzLCBhbmdsZSk7XG4gICAgICB2ID0gcm90YXRlVmVjdG9yKHEsIHYpO1xuICAgICAgJHtvcmlnaW4gPyBgdiArPSBjT3JpZ2luJHtzZWdtZW50LmtleX07YCA6ICcnfVxuICAgIH1cbiAgICBgO1xuICB9LFxuICBkZWZhdWx0RnJvbToge2F4aXM6IG5ldyBWZWN0b3IzKCksIGFuZ2xlOiAwfVxufTtcblxuVGltZWxpbmUucmVnaXN0ZXIoJ3JvdGF0ZScsIFJvdGF0aW9uU2VnbWVudCk7XG5cbmV4cG9ydCB7IFJvdGF0aW9uU2VnbWVudCB9O1xuIl0sIm5hbWVzIjpbIkJhc2VBbmltYXRpb25NYXRlcmlhbCIsInBhcmFtZXRlcnMiLCJ1bmlmb3JtcyIsImNhbGwiLCJ1bmlmb3JtVmFsdWVzIiwic2V0VmFsdWVzIiwiVW5pZm9ybXNVdGlscyIsIm1lcmdlIiwic2V0VW5pZm9ybVZhbHVlcyIsIm1hcCIsImRlZmluZXMiLCJub3JtYWxNYXAiLCJlbnZNYXAiLCJhb01hcCIsInNwZWN1bGFyTWFwIiwiYWxwaGFNYXAiLCJsaWdodE1hcCIsImVtaXNzaXZlTWFwIiwiYnVtcE1hcCIsImRpc3BsYWNlbWVudE1hcCIsInJvdWdobmVzc01hcCIsIm1ldGFsbmVzc01hcCIsImVudk1hcFR5cGVEZWZpbmUiLCJlbnZNYXBNb2RlRGVmaW5lIiwiZW52TWFwQmxlbmRpbmdEZWZpbmUiLCJtYXBwaW5nIiwiQ3ViZVJlZmxlY3Rpb25NYXBwaW5nIiwiQ3ViZVJlZnJhY3Rpb25NYXBwaW5nIiwiQ3ViZVVWUmVmbGVjdGlvbk1hcHBpbmciLCJDdWJlVVZSZWZyYWN0aW9uTWFwcGluZyIsIkVxdWlyZWN0YW5ndWxhclJlZmxlY3Rpb25NYXBwaW5nIiwiRXF1aXJlY3Rhbmd1bGFyUmVmcmFjdGlvbk1hcHBpbmciLCJTcGhlcmljYWxSZWZsZWN0aW9uTWFwcGluZyIsImNvbWJpbmUiLCJNaXhPcGVyYXRpb24iLCJBZGRPcGVyYXRpb24iLCJNdWx0aXBseU9wZXJhdGlvbiIsInByb3RvdHlwZSIsIk9iamVjdCIsImFzc2lnbiIsImNyZWF0ZSIsIlNoYWRlck1hdGVyaWFsIiwidmFsdWVzIiwia2V5cyIsImZvckVhY2giLCJrZXkiLCJ2YWx1ZSIsIm5hbWUiLCJqb2luIiwiQmFzaWNBbmltYXRpb25NYXRlcmlhbCIsInZhcnlpbmdQYXJhbWV0ZXJzIiwidmVydGV4UGFyYW1ldGVycyIsInZlcnRleEZ1bmN0aW9ucyIsInZlcnRleEluaXQiLCJ2ZXJ0ZXhOb3JtYWwiLCJ2ZXJ0ZXhQb3NpdGlvbiIsInZlcnRleENvbG9yIiwiZnJhZ21lbnRGdW5jdGlvbnMiLCJmcmFnbWVudFBhcmFtZXRlcnMiLCJmcmFnbWVudEluaXQiLCJmcmFnbWVudE1hcCIsImZyYWdtZW50RGlmZnVzZSIsIlNoYWRlckxpYiIsImxpZ2h0cyIsInZlcnRleFNoYWRlciIsImNvbmNhdFZlcnRleFNoYWRlciIsImZyYWdtZW50U2hhZGVyIiwiY29uY2F0RnJhZ21lbnRTaGFkZXIiLCJjb25zdHJ1Y3RvciIsInN0cmluZ2lmeUNodW5rIiwiTGFtYmVydEFuaW1hdGlvbk1hdGVyaWFsIiwiZnJhZ21lbnRFbWlzc2l2ZSIsImZyYWdtZW50U3BlY3VsYXIiLCJQaG9uZ0FuaW1hdGlvbk1hdGVyaWFsIiwiU3RhbmRhcmRBbmltYXRpb25NYXRlcmlhbCIsImZyYWdtZW50Um91Z2huZXNzIiwiZnJhZ21lbnRNZXRhbG5lc3MiLCJQb2ludHNBbmltYXRpb25NYXRlcmlhbCIsImZyYWdtZW50U2hhcGUiLCJEZXB0aEFuaW1hdGlvbk1hdGVyaWFsIiwiZGVwdGhQYWNraW5nIiwiUkdCQURlcHRoUGFja2luZyIsImNsaXBwaW5nIiwiRGlzdGFuY2VBbmltYXRpb25NYXRlcmlhbCIsIlByZWZhYkJ1ZmZlckdlb21ldHJ5IiwicHJlZmFiIiwiY291bnQiLCJwcmVmYWJHZW9tZXRyeSIsImlzUHJlZmFiQnVmZmVyR2VvbWV0cnkiLCJpc0J1ZmZlckdlb21ldHJ5IiwicHJlZmFiQ291bnQiLCJwcmVmYWJWZXJ0ZXhDb3VudCIsImF0dHJpYnV0ZXMiLCJwb3NpdGlvbiIsInZlcnRpY2VzIiwibGVuZ3RoIiwiYnVmZmVySW5kaWNlcyIsImJ1ZmZlclBvc2l0aW9ucyIsIkJ1ZmZlckdlb21ldHJ5IiwicHJlZmFiSW5kaWNlcyIsInByZWZhYkluZGV4Q291bnQiLCJpbmRleCIsImFycmF5IiwiaSIsInB1c2giLCJwcmVmYWJGYWNlQ291bnQiLCJmYWNlcyIsImZhY2UiLCJhIiwiYiIsImMiLCJpbmRleEJ1ZmZlciIsIlVpbnQzMkFycmF5Iiwic2V0SW5kZXgiLCJCdWZmZXJBdHRyaWJ1dGUiLCJrIiwicG9zaXRpb25CdWZmZXIiLCJjcmVhdGVBdHRyaWJ1dGUiLCJwb3NpdGlvbnMiLCJvZmZzZXQiLCJqIiwicHJlZmFiVmVydGV4IiwieCIsInkiLCJ6IiwiYnVmZmVyVXZzIiwicHJlZmFiVXZzIiwidXYiLCJWZWN0b3IyIiwiZmFjZVZlcnRleFV2cyIsInV2QnVmZmVyIiwicHJlZmFiVXYiLCJpdGVtU2l6ZSIsImZhY3RvcnkiLCJidWZmZXIiLCJGbG9hdDMyQXJyYXkiLCJhdHRyaWJ1dGUiLCJhZGRBdHRyaWJ1dGUiLCJkYXRhIiwic2V0UHJlZmFiRGF0YSIsInByZWZhYkluZGV4IiwiTXVsdGlQcmVmYWJCdWZmZXJHZW9tZXRyeSIsInByZWZhYnMiLCJyZXBlYXRDb3VudCIsIkFycmF5IiwiaXNBcnJheSIsInByZWZhYkdlb21ldHJpZXMiLCJwcmVmYWJHZW9tZXRyaWVzQ291bnQiLCJwcmVmYWJWZXJ0ZXhDb3VudHMiLCJwIiwicmVwZWF0VmVydGV4Q291bnQiLCJyZWR1Y2UiLCJyIiwidiIsInJlcGVhdEluZGV4Q291bnQiLCJpbmRpY2VzIiwiZ2VvbWV0cnkiLCJpbmRleE9mZnNldCIsInByZWZhYk9mZnNldCIsInZlcnRleENvdW50IiwicHJlZmFiUG9zaXRpb25zIiwidXZzIiwiZXJyb3IiLCJ1dk9iamVjdHMiLCJwcmVmYWJHZW9tZXRyeUluZGV4IiwicHJlZmFiR2VvbWV0cnlWZXJ0ZXhDb3VudCIsIndob2xlIiwid2hvbGVPZmZzZXQiLCJwYXJ0IiwicGFydE9mZnNldCIsIlV0aWxzIiwiaWwiLCJuIiwidmEiLCJ2YiIsInZjIiwiY2xvbmUiLCJUSFJFRSIsIlZlY3RvcjMiLCJib3giLCJ0TWF0aCIsInJhbmRGbG9hdCIsIm1pbiIsIm1heCIsInJhbmRGbG9hdFNwcmVhZCIsIm5vcm1hbGl6ZSIsInNvdXJjZU1hdGVyaWFsIiwiTW9kZWxCdWZmZXJHZW9tZXRyeSIsIm1vZGVsIiwib3B0aW9ucyIsIm1vZGVsR2VvbWV0cnkiLCJmYWNlQ291bnQiLCJjb21wdXRlQ2VudHJvaWRzIiwibG9jYWxpemVGYWNlcyIsImNlbnRyb2lkcyIsImNvbXB1dGVDZW50cm9pZCIsImNlbnRyb2lkIiwiQkFTIiwidmVydGV4IiwiYnVmZmVyVVZzIiwic2V0RmFjZURhdGEiLCJmYWNlSW5kZXgiLCJQb2ludEJ1ZmZlckdlb21ldHJ5IiwicG9pbnRDb3VudCIsInNldFBvaW50RGF0YSIsInBvaW50SW5kZXgiLCJTaGFkZXJDaHVuayIsImNhdG11bGxfcm9tX3NwbGluZSIsImN1YmljX2JlemllciIsImVhc2VfYmFja19pbiIsImVhc2VfYmFja19pbl9vdXQiLCJlYXNlX2JhY2tfb3V0IiwiZWFzZV9iZXppZXIiLCJlYXNlX2JvdW5jZV9pbiIsImVhc2VfYm91bmNlX2luX291dCIsImVhc2VfYm91bmNlX291dCIsImVhc2VfY2lyY19pbiIsImVhc2VfY2lyY19pbl9vdXQiLCJlYXNlX2NpcmNfb3V0IiwiZWFzZV9jdWJpY19pbiIsImVhc2VfY3ViaWNfaW5fb3V0IiwiZWFzZV9jdWJpY19vdXQiLCJlYXNlX2VsYXN0aWNfaW4iLCJlYXNlX2VsYXN0aWNfaW5fb3V0IiwiZWFzZV9lbGFzdGljX291dCIsImVhc2VfZXhwb19pbiIsImVhc2VfZXhwb19pbl9vdXQiLCJlYXNlX2V4cG9fb3V0IiwiZWFzZV9xdWFkX2luIiwiZWFzZV9xdWFkX2luX291dCIsImVhc2VfcXVhZF9vdXQiLCJlYXNlX3F1YXJ0X2luIiwiZWFzZV9xdWFydF9pbl9vdXQiLCJlYXNlX3F1YXJ0X291dCIsImVhc2VfcXVpbnRfaW4iLCJlYXNlX3F1aW50X2luX291dCIsImVhc2VfcXVpbnRfb3V0IiwiZWFzZV9zaW5lX2luIiwiZWFzZV9zaW5lX2luX291dCIsImVhc2Vfc2luZV9vdXQiLCJxdWF0ZXJuaW9uX3JvdGF0aW9uIiwicXVhdGVybmlvbl9zbGVycCIsIlRpbWVsaW5lU2VnbWVudCIsInN0YXJ0IiwiZHVyYXRpb24iLCJ0cmFuc2l0aW9uIiwiY29tcGlsZXIiLCJ0cmFpbCIsImNvbXBpbGUiLCJkZWZpbmVQcm9wZXJ0eSIsIlRpbWVsaW5lIiwidGltZUtleSIsInNlZ21lbnRzIiwiX19rZXkiLCJzZWdtZW50RGVmaW5pdGlvbnMiLCJyZWdpc3RlciIsImRlZmluaXRpb24iLCJhZGQiLCJ0cmFuc2l0aW9ucyIsInBvc2l0aW9uT2Zmc2V0IiwiX2V2YWwiLCJldmFsIiwidW5kZWZpbmVkIiwiTWF0aCIsInByb2Nlc3NUcmFuc2l0aW9uIiwiZnJvbSIsImRlZmF1bHRGcm9tIiwidG8iLCJ0b1N0cmluZyIsImZpbGxHYXBzIiwicyIsInMwIiwiczEiLCJlbmQiLCJnZXRUcmFuc2Zvcm1DYWxscyIsInQiLCJUaW1lbGluZUNodW5rcyIsInRvUHJlY2lzaW9uIiwidyIsInNlZ21lbnQiLCJlYXNlIiwiZWFzZVBhcmFtcyIsInN0YXJ0VGltZSIsImVuZFRpbWUiLCJUcmFuc2xhdGlvblNlZ21lbnQiLCJkZWxheUR1cmF0aW9uIiwidmVjMyIsInJlbmRlckNoZWNrIiwicHJvZ3Jlc3MiLCJTY2FsZVNlZ21lbnQiLCJvcmlnaW4iLCJSb3RhdGlvblNlZ21lbnQiLCJmcm9tQXhpc0FuZ2xlIiwiVmVjdG9yNCIsImF4aXMiLCJhbmdsZSIsInRvQXhpcyIsInRvQXhpc0FuZ2xlIiwidmVjNCJdLCJtYXBwaW5ncyI6Ijs7QUFlQSxTQUFTQSxxQkFBVCxDQUErQkMsVUFBL0IsRUFBMkNDLFFBQTNDLEVBQXFEO2lCQUNwQ0MsSUFBZixDQUFvQixJQUFwQjs7TUFFTUMs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
