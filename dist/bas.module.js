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
  this.vertexPostMorph = [];
  this.vertexPostSkinning = [];

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

  BaseAnimationMaterial.call(this, parameters, ShaderLib['lambert'].uniforms);

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

  BaseAnimationMaterial.call(this, parameters, ShaderLib['standard'].uniforms);

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
  this.vertexPostMorph = [];
  this.vertexPostSkinning = [];

  BaseAnimationMaterial.call(this, parameters);

  this.uniforms = UniformsUtils.merge([ShaderLib['depth'].uniforms, this.uniforms]);
  this.vertexShader = this.concatVertexShader();
  this.fragmentShader = ShaderLib['depth'].fragmentShader;
}
DepthAnimationMaterial.prototype = Object.create(BaseAnimationMaterial.prototype);
DepthAnimationMaterial.prototype.constructor = DepthAnimationMaterial;

DepthAnimationMaterial.prototype.concatVertexShader = function () {

  return '\n  #include <common>\n  #include <uv_pars_vertex>\n  #include <displacementmap_pars_vertex>\n  #include <morphtarget_pars_vertex>\n  #include <skinning_pars_vertex>\n  #include <logdepthbuf_pars_vertex>\n  #include <clipping_planes_pars_vertex>\n  \n  ' + this.stringifyChunk('vertexParameters') + '\n  ' + this.stringifyChunk('vertexFunctions') + '\n  \n  void main() {\n  \n    ' + this.stringifyChunk('vertexInit') + '\n  \n    #include <uv_vertex>\n  \n    #include <skinbase_vertex>\n  \n    #ifdef USE_DISPLACEMENTMAP\n  \n      #include <beginnormal_vertex>\n      #include <morphnormal_vertex>\n      #include <skinnormal_vertex>\n  \n    #endif\n  \n    #include <begin_vertex>\n    \n    ' + this.stringifyChunk('vertexPosition') + '\n\n    #include <morphtarget_vertex>\n    \n    ' + this.stringifyChunk('vertexPostMorph') + '\n    \n    #include <skinning_vertex>\n\n    ' + this.stringifyChunk('vertexPostSkinning') + '\n    \n    #include <displacementmap_vertex>\n    #include <project_vertex>\n    #include <logdepthbuf_vertex>\n    #include <clipping_planes_vertex>\n  }';
};

function DistanceAnimationMaterial(parameters) {
  this.depthPacking = RGBADepthPacking;
  this.clipping = true;

  this.vertexFunctions = [];
  this.vertexParameters = [];
  this.vertexInit = [];
  this.vertexPosition = [];
  this.vertexPostMorph = [];
  this.vertexPostSkinning = [];

  BaseAnimationMaterial.call(this, parameters);

  this.uniforms = UniformsUtils.merge([ShaderLib['distanceRGBA'].uniforms, this.uniforms]);
  this.vertexShader = this.concatVertexShader();
  this.fragmentShader = ShaderLib['distanceRGBA'].fragmentShader;
}
DistanceAnimationMaterial.prototype = Object.create(BaseAnimationMaterial.prototype);
DistanceAnimationMaterial.prototype.constructor = DistanceAnimationMaterial;

DistanceAnimationMaterial.prototype.concatVertexShader = function () {
  return '\n  #define DISTANCE\n\n  varying vec3 vWorldPosition;\n  \n  #include <common>\n  #include <uv_pars_vertex>\n  #include <displacementmap_pars_vertex>\n  #include <morphtarget_pars_vertex>\n  #include <skinning_pars_vertex>\n  #include <clipping_planes_pars_vertex>\n  \n  ' + this.stringifyChunk('vertexParameters') + '\n  ' + this.stringifyChunk('vertexFunctions') + '\n  \n  void main() {\n\n    ' + this.stringifyChunk('vertexInit') + '\n  \n    #include <uv_vertex>\n  \n    #include <skinbase_vertex>\n  \n    #ifdef USE_DISPLACEMENTMAP\n  \n      #include <beginnormal_vertex>\n      #include <morphnormal_vertex>\n      #include <skinnormal_vertex>\n  \n    #endif\n  \n    #include <begin_vertex>\n    \n    ' + this.stringifyChunk('vertexPosition') + '\n\n    #include <morphtarget_vertex>\n    \n    ' + this.stringifyChunk('vertexPostMorph') + '\n    \n    #include <skinning_vertex>\n\n    ' + this.stringifyChunk('vertexPostSkinning') + '\n    \n    #include <displacementmap_vertex>\n    #include <project_vertex>\n    #include <worldpos_vertex>\n    #include <clipping_planes_vertex>\n  \n    vWorldPosition = worldPosition.xyz;\n  \n  }';
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzLm1vZHVsZS5qcyIsInNvdXJjZXMiOlsiLi4vc3JjL21hdGVyaWFscy9CYXNlQW5pbWF0aW9uTWF0ZXJpYWwuanMiLCIuLi9zcmMvbWF0ZXJpYWxzL0Jhc2ljQW5pbWF0aW9uTWF0ZXJpYWwuanMiLCIuLi9zcmMvbWF0ZXJpYWxzL0xhbWJlcnRBbmltYXRpb25NYXRlcmlhbC5qcyIsIi4uL3NyYy9tYXRlcmlhbHMvUGhvbmdBbmltYXRpb25NYXRlcmlhbC5qcyIsIi4uL3NyYy9tYXRlcmlhbHMvU3RhbmRhcmRBbmltYXRpb25NYXRlcmlhbC5qcyIsIi4uL3NyYy9tYXRlcmlhbHMvUG9pbnRzQW5pbWF0aW9uTWF0ZXJpYWwuanMiLCIuLi9zcmMvbWF0ZXJpYWxzL0RlcHRoQW5pbWF0aW9uTWF0ZXJpYWwuanMiLCIuLi9zcmMvbWF0ZXJpYWxzL0Rpc3RhbmNlQW5pbWF0aW9uTWF0ZXJpYWwuanMiLCIuLi9zcmMvZ2VvbWV0cnkvUHJlZmFiQnVmZmVyR2VvbWV0cnkuanMiLCIuLi9zcmMvZ2VvbWV0cnkvTXVsdGlQcmVmYWJCdWZmZXJHZW9tZXRyeS5qcyIsIi4uL3NyYy9VdGlscy5qcyIsIi4uL3NyYy9nZW9tZXRyeS9Nb2RlbEJ1ZmZlckdlb21ldHJ5LmpzIiwiLi4vc3JjL2dlb21ldHJ5L1BvaW50QnVmZmVyR2VvbWV0cnkuanMiLCIuLi9zcmMvU2hhZGVyQ2h1bmsuanMiLCIuLi9zcmMvdGltZWxpbmUvVGltZWxpbmVTZWdtZW50LmpzIiwiLi4vc3JjL3RpbWVsaW5lL1RpbWVsaW5lLmpzIiwiLi4vc3JjL3RpbWVsaW5lL1RpbWVsaW5lQ2h1bmtzLmpzIiwiLi4vc3JjL3RpbWVsaW5lL1RyYW5zbGF0aW9uU2VnbWVudC5qcyIsIi4uL3NyYy90aW1lbGluZS9TY2FsZVNlZ21lbnQuanMiLCIuLi9zcmMvdGltZWxpbmUvUm90YXRpb25TZWdtZW50LmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XHJcbiAgU2hhZGVyTWF0ZXJpYWwsXHJcbiAgVW5pZm9ybXNVdGlscyxcclxuICBDdWJlUmVmbGVjdGlvbk1hcHBpbmcsXHJcbiAgQ3ViZVJlZnJhY3Rpb25NYXBwaW5nLFxyXG4gIEN1YmVVVlJlZmxlY3Rpb25NYXBwaW5nLFxyXG4gIEN1YmVVVlJlZnJhY3Rpb25NYXBwaW5nLFxyXG4gIEVxdWlyZWN0YW5ndWxhclJlZmxlY3Rpb25NYXBwaW5nLFxyXG4gIEVxdWlyZWN0YW5ndWxhclJlZnJhY3Rpb25NYXBwaW5nLFxyXG4gIFNwaGVyaWNhbFJlZmxlY3Rpb25NYXBwaW5nLFxyXG4gIE1peE9wZXJhdGlvbixcclxuICBBZGRPcGVyYXRpb24sXHJcbiAgTXVsdGlwbHlPcGVyYXRpb25cclxufSBmcm9tICd0aHJlZSc7XHJcblxyXG5mdW5jdGlvbiBCYXNlQW5pbWF0aW9uTWF0ZXJpYWwocGFyYW1ldGVycywgdW5pZm9ybXMpIHtcclxuICBTaGFkZXJNYXRlcmlhbC5jYWxsKHRoaXMpO1xyXG4gIFxyXG4gIGNvbnN0IHVuaWZvcm1WYWx1ZXMgPSBwYXJhbWV0ZXJzLnVuaWZvcm1WYWx1ZXM7XHJcbiAgZGVsZXRlIHBhcmFtZXRlcnMudW5pZm9ybVZhbHVlcztcclxuICBcclxuICB0aGlzLnNldFZhbHVlcyhwYXJhbWV0ZXJzKTtcclxuICBcclxuICB0aGlzLnVuaWZvcm1zID0gVW5pZm9ybXNVdGlscy5tZXJnZShbdW5pZm9ybXMsIHRoaXMudW5pZm9ybXNdKTtcclxuICBcclxuICB0aGlzLnNldFVuaWZvcm1WYWx1ZXModW5pZm9ybVZhbHVlcyk7XHJcbiAgXHJcbiAgaWYgKHVuaWZvcm1WYWx1ZXMpIHtcclxuICAgIHVuaWZvcm1WYWx1ZXMubWFwICYmICh0aGlzLmRlZmluZXNbJ1VTRV9NQVAnXSA9ICcnKTtcclxuICAgIHVuaWZvcm1WYWx1ZXMubm9ybWFsTWFwICYmICh0aGlzLmRlZmluZXNbJ1VTRV9OT1JNQUxNQVAnXSA9ICcnKTtcclxuICAgIHVuaWZvcm1WYWx1ZXMuZW52TWFwICYmICh0aGlzLmRlZmluZXNbJ1VTRV9FTlZNQVAnXSA9ICcnKTtcclxuICAgIHVuaWZvcm1WYWx1ZXMuYW9NYXAgJiYgKHRoaXMuZGVmaW5lc1snVVNFX0FPTUFQJ10gPSAnJyk7XHJcbiAgICB1bmlmb3JtVmFsdWVzLnNwZWN1bGFyTWFwICYmICh0aGlzLmRlZmluZXNbJ1VTRV9TUEVDVUxBUk1BUCddID0gJycpO1xyXG4gICAgdW5pZm9ybVZhbHVlcy5hbHBoYU1hcCAmJiAodGhpcy5kZWZpbmVzWydVU0VfQUxQSEFNQVAnXSA9ICcnKTtcclxuICAgIHVuaWZvcm1WYWx1ZXMubGlnaHRNYXAgJiYgKHRoaXMuZGVmaW5lc1snVVNFX0xJR0hUTUFQJ10gPSAnJyk7XHJcbiAgICB1bmlmb3JtVmFsdWVzLmVtaXNzaXZlTWFwICYmICh0aGlzLmRlZmluZXNbJ1VTRV9FTUlTU0lWRU1BUCddID0gJycpO1xyXG4gICAgdW5pZm9ybVZhbHVlcy5idW1wTWFwICYmICh0aGlzLmRlZmluZXNbJ1VTRV9CVU1QTUFQJ10gPSAnJyk7XHJcbiAgICB1bmlmb3JtVmFsdWVzLmRpc3BsYWNlbWVudE1hcCAmJiAodGhpcy5kZWZpbmVzWydVU0VfRElTUExBQ0VNRU5UTUFQJ10gPSAnJyk7XHJcbiAgICB1bmlmb3JtVmFsdWVzLnJvdWdobmVzc01hcCAmJiAodGhpcy5kZWZpbmVzWydVU0VfRElTUExBQ0VNRU5UTUFQJ10gPSAnJyk7XHJcbiAgICB1bmlmb3JtVmFsdWVzLnJvdWdobmVzc01hcCAmJiAodGhpcy5kZWZpbmVzWydVU0VfUk9VR0hORVNTTUFQJ10gPSAnJyk7XHJcbiAgICB1bmlmb3JtVmFsdWVzLm1ldGFsbmVzc01hcCAmJiAodGhpcy5kZWZpbmVzWydVU0VfTUVUQUxORVNTTUFQJ10gPSAnJyk7XHJcbiAgXHJcbiAgICBpZiAodW5pZm9ybVZhbHVlcy5lbnZNYXApIHtcclxuICAgICAgdGhpcy5kZWZpbmVzWydVU0VfRU5WTUFQJ10gPSAnJztcclxuICAgIFxyXG4gICAgICBsZXQgZW52TWFwVHlwZURlZmluZSA9ICdFTlZNQVBfVFlQRV9DVUJFJztcclxuICAgICAgbGV0IGVudk1hcE1vZGVEZWZpbmUgPSAnRU5WTUFQX01PREVfUkVGTEVDVElPTic7XHJcbiAgICAgIGxldCBlbnZNYXBCbGVuZGluZ0RlZmluZSA9ICdFTlZNQVBfQkxFTkRJTkdfTVVMVElQTFknO1xyXG4gICAgXHJcbiAgICAgIHN3aXRjaCAodW5pZm9ybVZhbHVlcy5lbnZNYXAubWFwcGluZykge1xyXG4gICAgICAgIGNhc2UgQ3ViZVJlZmxlY3Rpb25NYXBwaW5nOlxyXG4gICAgICAgIGNhc2UgQ3ViZVJlZnJhY3Rpb25NYXBwaW5nOlxyXG4gICAgICAgICAgZW52TWFwVHlwZURlZmluZSA9ICdFTlZNQVBfVFlQRV9DVUJFJztcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgQ3ViZVVWUmVmbGVjdGlvbk1hcHBpbmc6XHJcbiAgICAgICAgY2FzZSBDdWJlVVZSZWZyYWN0aW9uTWFwcGluZzpcclxuICAgICAgICAgIGVudk1hcFR5cGVEZWZpbmUgPSAnRU5WTUFQX1RZUEVfQ1VCRV9VVic7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIEVxdWlyZWN0YW5ndWxhclJlZmxlY3Rpb25NYXBwaW5nOlxyXG4gICAgICAgIGNhc2UgRXF1aXJlY3Rhbmd1bGFyUmVmcmFjdGlvbk1hcHBpbmc6XHJcbiAgICAgICAgICBlbnZNYXBUeXBlRGVmaW5lID0gJ0VOVk1BUF9UWVBFX0VRVUlSRUMnO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSBTcGhlcmljYWxSZWZsZWN0aW9uTWFwcGluZzpcclxuICAgICAgICAgIGVudk1hcFR5cGVEZWZpbmUgPSAnRU5WTUFQX1RZUEVfU1BIRVJFJztcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICB9XHJcbiAgICBcclxuICAgICAgc3dpdGNoICh1bmlmb3JtVmFsdWVzLmVudk1hcC5tYXBwaW5nKSB7XHJcbiAgICAgICAgY2FzZSBDdWJlUmVmcmFjdGlvbk1hcHBpbmc6XHJcbiAgICAgICAgY2FzZSBFcXVpcmVjdGFuZ3VsYXJSZWZyYWN0aW9uTWFwcGluZzpcclxuICAgICAgICAgIGVudk1hcE1vZGVEZWZpbmUgPSAnRU5WTUFQX01PREVfUkVGUkFDVElPTic7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgfVxyXG4gICAgXHJcbiAgICAgIHN3aXRjaCAodW5pZm9ybVZhbHVlcy5jb21iaW5lKSB7XHJcbiAgICAgICAgY2FzZSBNaXhPcGVyYXRpb246XHJcbiAgICAgICAgICBlbnZNYXBCbGVuZGluZ0RlZmluZSA9ICdFTlZNQVBfQkxFTkRJTkdfTUlYJztcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgQWRkT3BlcmF0aW9uOlxyXG4gICAgICAgICAgZW52TWFwQmxlbmRpbmdEZWZpbmUgPSAnRU5WTUFQX0JMRU5ESU5HX0FERCc7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIE11bHRpcGx5T3BlcmF0aW9uOlxyXG4gICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICBlbnZNYXBCbGVuZGluZ0RlZmluZSA9ICdFTlZNQVBfQkxFTkRJTkdfTVVMVElQTFknO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgIH1cclxuICAgIFxyXG4gICAgICB0aGlzLmRlZmluZXNbZW52TWFwVHlwZURlZmluZV0gPSAnJztcclxuICAgICAgdGhpcy5kZWZpbmVzW2Vudk1hcEJsZW5kaW5nRGVmaW5lXSA9ICcnO1xyXG4gICAgICB0aGlzLmRlZmluZXNbZW52TWFwTW9kZURlZmluZV0gPSAnJztcclxuICAgIH1cclxuICB9XHJcbn1cclxuXHJcbkJhc2VBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUgPSBPYmplY3QuYXNzaWduKE9iamVjdC5jcmVhdGUoU2hhZGVyTWF0ZXJpYWwucHJvdG90eXBlKSwge1xyXG4gIGNvbnN0cnVjdG9yOiBCYXNlQW5pbWF0aW9uTWF0ZXJpYWwsXHJcbiAgXHJcbiAgc2V0VW5pZm9ybVZhbHVlcyh2YWx1ZXMpIHtcclxuICAgIGlmICghdmFsdWVzKSByZXR1cm47XHJcbiAgICBcclxuICAgIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyh2YWx1ZXMpO1xyXG4gICAgXHJcbiAgICBrZXlzLmZvckVhY2goKGtleSkgPT4ge1xyXG4gICAgICBrZXkgaW4gdGhpcy51bmlmb3JtcyAmJiAodGhpcy51bmlmb3Jtc1trZXldLnZhbHVlID0gdmFsdWVzW2tleV0pO1xyXG4gICAgfSk7XHJcbiAgfSxcclxuICBcclxuICBzdHJpbmdpZnlDaHVuayhuYW1lKSB7XHJcbiAgICBsZXQgdmFsdWU7XHJcbiAgICBcclxuICAgIGlmICghdGhpc1tuYW1lXSkge1xyXG4gICAgICB2YWx1ZSA9ICcnO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAodHlwZW9mIHRoaXNbbmFtZV0gPT09ICAnc3RyaW5nJykge1xyXG4gICAgICB2YWx1ZSA9IHRoaXNbbmFtZV07XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgdmFsdWUgPSB0aGlzW25hbWVdLmpvaW4oJ1xcbicpO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICByZXR1cm4gdmFsdWU7XHJcbiAgfVxyXG59KTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IEJhc2VBbmltYXRpb25NYXRlcmlhbDtcclxuIiwiaW1wb3J0IHsgU2hhZGVyTGliIH0gZnJvbSAndGhyZWUnO1xyXG5pbXBvcnQgQmFzZUFuaW1hdGlvbk1hdGVyaWFsIGZyb20gJy4vQmFzZUFuaW1hdGlvbk1hdGVyaWFsJztcclxuXHJcbi8qKlxyXG4gKiBFeHRlbmRzIFRIUkVFLk1lc2hCYXNpY01hdGVyaWFsIHdpdGggY3VzdG9tIHNoYWRlciBjaHVua3MuXHJcbiAqXHJcbiAqIEBzZWUgaHR0cDovL3RocmVlLWJhcy1leGFtcGxlcy5zdXJnZS5zaC9leGFtcGxlcy9tYXRlcmlhbHNfYmFzaWMvXHJcbiAqXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBwYXJhbWV0ZXJzIE9iamVjdCBjb250YWluaW5nIG1hdGVyaWFsIHByb3BlcnRpZXMgYW5kIGN1c3RvbSBzaGFkZXIgY2h1bmtzLlxyXG4gKiBAY29uc3RydWN0b3JcclxuICovXHJcbmZ1bmN0aW9uIEJhc2ljQW5pbWF0aW9uTWF0ZXJpYWwocGFyYW1ldGVycykge1xyXG4gIHRoaXMudmFyeWluZ1BhcmFtZXRlcnMgPSBbXTtcclxuICBcclxuICB0aGlzLnZlcnRleFBhcmFtZXRlcnMgPSBbXTtcclxuICB0aGlzLnZlcnRleEZ1bmN0aW9ucyA9IFtdO1xyXG4gIHRoaXMudmVydGV4SW5pdCA9IFtdO1xyXG4gIHRoaXMudmVydGV4Tm9ybWFsID0gW107XHJcbiAgdGhpcy52ZXJ0ZXhQb3NpdGlvbiA9IFtdO1xyXG4gIHRoaXMudmVydGV4Q29sb3IgPSBbXTtcclxuICB0aGlzLnZlcnRleFBvc3RNb3JwaCA9IFtdO1xyXG4gIHRoaXMudmVydGV4UG9zdFNraW5uaW5nID0gW107XHJcblxyXG4gIHRoaXMuZnJhZ21lbnRGdW5jdGlvbnMgPSBbXTtcclxuICB0aGlzLmZyYWdtZW50UGFyYW1ldGVycyA9IFtdO1xyXG4gIHRoaXMuZnJhZ21lbnRJbml0ID0gW107XHJcbiAgdGhpcy5mcmFnbWVudE1hcCA9IFtdO1xyXG4gIHRoaXMuZnJhZ21lbnREaWZmdXNlID0gW107XHJcbiAgXHJcbiAgQmFzZUFuaW1hdGlvbk1hdGVyaWFsLmNhbGwodGhpcywgcGFyYW1ldGVycywgU2hhZGVyTGliWydiYXNpYyddLnVuaWZvcm1zKTtcclxuICBcclxuICB0aGlzLmxpZ2h0cyA9IGZhbHNlO1xyXG4gIHRoaXMudmVydGV4U2hhZGVyID0gdGhpcy5jb25jYXRWZXJ0ZXhTaGFkZXIoKTtcclxuICB0aGlzLmZyYWdtZW50U2hhZGVyID0gdGhpcy5jb25jYXRGcmFnbWVudFNoYWRlcigpO1xyXG59XHJcbkJhc2ljQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShCYXNlQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlKTtcclxuQmFzaWNBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBCYXNpY0FuaW1hdGlvbk1hdGVyaWFsO1xyXG5cclxuQmFzaWNBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uY2F0VmVydGV4U2hhZGVyID0gZnVuY3Rpb24oKSB7XHJcbiAgcmV0dXJuIGBcclxuICAjaW5jbHVkZSA8Y29tbW9uPlxyXG4gICNpbmNsdWRlIDx1dl9wYXJzX3ZlcnRleD5cclxuICAjaW5jbHVkZSA8dXYyX3BhcnNfdmVydGV4PlxyXG4gICNpbmNsdWRlIDxlbnZtYXBfcGFyc192ZXJ0ZXg+XHJcbiAgI2luY2x1ZGUgPGNvbG9yX3BhcnNfdmVydGV4PlxyXG4gICNpbmNsdWRlIDxmb2dfcGFyc192ZXJ0ZXg+XHJcbiAgI2luY2x1ZGUgPG1vcnBodGFyZ2V0X3BhcnNfdmVydGV4PlxyXG4gICNpbmNsdWRlIDxza2lubmluZ19wYXJzX3ZlcnRleD5cclxuICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfcGFyc192ZXJ0ZXg+XHJcbiAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc19wYXJzX3ZlcnRleD5cclxuICBcclxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBhcmFtZXRlcnMnKX1cclxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZhcnlpbmdQYXJhbWV0ZXJzJyl9XHJcbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhGdW5jdGlvbnMnKX1cclxuICBcclxuICB2b2lkIG1haW4oKSB7XHJcblxyXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhJbml0Jyl9XHJcbiAgXHJcbiAgICAjaW5jbHVkZSA8dXZfdmVydGV4PlxyXG4gICAgI2luY2x1ZGUgPHV2Ml92ZXJ0ZXg+XHJcbiAgICAjaW5jbHVkZSA8Y29sb3JfdmVydGV4PlxyXG4gICAgI2luY2x1ZGUgPHNraW5iYXNlX3ZlcnRleD5cclxuICBcclxuICAgICNpZmRlZiBVU0VfRU5WTUFQXHJcbiAgXHJcbiAgICAjaW5jbHVkZSA8YmVnaW5ub3JtYWxfdmVydGV4PlxyXG4gICAgXHJcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleE5vcm1hbCcpfVxyXG4gICAgXHJcbiAgICAjaW5jbHVkZSA8bW9ycGhub3JtYWxfdmVydGV4PlxyXG4gICAgI2luY2x1ZGUgPHNraW5ub3JtYWxfdmVydGV4PlxyXG4gICAgI2luY2x1ZGUgPGRlZmF1bHRub3JtYWxfdmVydGV4PlxyXG4gIFxyXG4gICAgI2VuZGlmXHJcbiAgXHJcbiAgICAjaW5jbHVkZSA8YmVnaW5fdmVydGV4PlxyXG4gICAgXHJcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBvc2l0aW9uJyl9XHJcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleENvbG9yJyl9XHJcbiAgICBcclxuICAgICNpbmNsdWRlIDxtb3JwaHRhcmdldF92ZXJ0ZXg+XHJcbiAgICBcclxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UG9zdE1vcnBoJyl9XHJcbiAgICBcclxuICAgICNpbmNsdWRlIDxza2lubmluZ192ZXJ0ZXg+XHJcblxyXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQb3N0U2tpbm5pbmcnKX1cclxuXHJcbiAgICAjaW5jbHVkZSA8cHJvamVjdF92ZXJ0ZXg+XHJcbiAgICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfdmVydGV4PlxyXG4gIFxyXG4gICAgI2luY2x1ZGUgPHdvcmxkcG9zX3ZlcnRleD5cclxuICAgICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfdmVydGV4PlxyXG4gICAgI2luY2x1ZGUgPGVudm1hcF92ZXJ0ZXg+XHJcbiAgICAjaW5jbHVkZSA8Zm9nX3ZlcnRleD5cclxuICB9YDtcclxufTtcclxuXHJcbkJhc2ljQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlLmNvbmNhdEZyYWdtZW50U2hhZGVyID0gZnVuY3Rpb24oKSB7XHJcbiAgcmV0dXJuIGBcclxuICB1bmlmb3JtIHZlYzMgZGlmZnVzZTtcclxuICB1bmlmb3JtIGZsb2F0IG9wYWNpdHk7XHJcbiAgXHJcbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudFBhcmFtZXRlcnMnKX1cclxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZhcnlpbmdQYXJhbWV0ZXJzJyl9XHJcbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudEZ1bmN0aW9ucycpfVxyXG4gIFxyXG4gICNpZm5kZWYgRkxBVF9TSEFERURcclxuICBcclxuICAgIHZhcnlpbmcgdmVjMyB2Tm9ybWFsO1xyXG4gIFxyXG4gICNlbmRpZlxyXG4gIFxyXG4gICNpbmNsdWRlIDxjb21tb24+XHJcbiAgI2luY2x1ZGUgPGNvbG9yX3BhcnNfZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPHV2X3BhcnNfZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPHV2Ml9wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxtYXBfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8YWxwaGFtYXBfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8YW9tYXBfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8bGlnaHRtYXBfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8ZW52bWFwX3BhcnNfZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPGZvZ19wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxzcGVjdWxhcm1hcF9wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl9wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfcGFyc19mcmFnbWVudD5cclxuICBcclxuICB2b2lkIG1haW4oKSB7XHJcbiAgXHJcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50SW5pdCcpfVxyXG4gIFxyXG4gICAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc19mcmFnbWVudD5cclxuXHJcbiAgICB2ZWM0IGRpZmZ1c2VDb2xvciA9IHZlYzQoIGRpZmZ1c2UsIG9wYWNpdHkgKTtcclxuXHJcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50RGlmZnVzZScpfVxyXG4gIFxyXG4gICAgI2luY2x1ZGUgPGxvZ2RlcHRoYnVmX2ZyYWdtZW50PlxyXG4gICAgXHJcbiAgICAkeyh0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudE1hcCcpIHx8ICcjaW5jbHVkZSA8bWFwX2ZyYWdtZW50PicpfVxyXG4gICAgXHJcbiAgICAjaW5jbHVkZSA8Y29sb3JfZnJhZ21lbnQ+XHJcbiAgICAjaW5jbHVkZSA8YWxwaGFtYXBfZnJhZ21lbnQ+XHJcbiAgICAjaW5jbHVkZSA8YWxwaGF0ZXN0X2ZyYWdtZW50PlxyXG4gICAgI2luY2x1ZGUgPHNwZWN1bGFybWFwX2ZyYWdtZW50PlxyXG4gIFxyXG4gICAgUmVmbGVjdGVkTGlnaHQgcmVmbGVjdGVkTGlnaHQgPSBSZWZsZWN0ZWRMaWdodCggdmVjMyggMC4wICksIHZlYzMoIDAuMCApLCB2ZWMzKCAwLjAgKSwgdmVjMyggMC4wICkgKTtcclxuICBcclxuICAgIC8vIGFjY3VtdWxhdGlvbiAoYmFrZWQgaW5kaXJlY3QgbGlnaHRpbmcgb25seSlcclxuICAgICNpZmRlZiBVU0VfTElHSFRNQVBcclxuICBcclxuICAgICAgcmVmbGVjdGVkTGlnaHQuaW5kaXJlY3REaWZmdXNlICs9IHRleHR1cmUyRCggbGlnaHRNYXAsIHZVdjIgKS54eXogKiBsaWdodE1hcEludGVuc2l0eTtcclxuICBcclxuICAgICNlbHNlXHJcbiAgXHJcbiAgICAgIHJlZmxlY3RlZExpZ2h0LmluZGlyZWN0RGlmZnVzZSArPSB2ZWMzKCAxLjAgKTtcclxuICBcclxuICAgICNlbmRpZlxyXG4gIFxyXG4gICAgLy8gbW9kdWxhdGlvblxyXG4gICAgI2luY2x1ZGUgPGFvbWFwX2ZyYWdtZW50PlxyXG4gIFxyXG4gICAgcmVmbGVjdGVkTGlnaHQuaW5kaXJlY3REaWZmdXNlICo9IGRpZmZ1c2VDb2xvci5yZ2I7XHJcbiAgXHJcbiAgICB2ZWMzIG91dGdvaW5nTGlnaHQgPSByZWZsZWN0ZWRMaWdodC5pbmRpcmVjdERpZmZ1c2U7XHJcbiAgXHJcbiAgICAjaW5jbHVkZSA8ZW52bWFwX2ZyYWdtZW50PlxyXG4gIFxyXG4gICAgZ2xfRnJhZ0NvbG9yID0gdmVjNCggb3V0Z29pbmdMaWdodCwgZGlmZnVzZUNvbG9yLmEgKTtcclxuICBcclxuICAgICNpbmNsdWRlIDxwcmVtdWx0aXBsaWVkX2FscGhhX2ZyYWdtZW50PlxyXG4gICAgI2luY2x1ZGUgPHRvbmVtYXBwaW5nX2ZyYWdtZW50PlxyXG4gICAgI2luY2x1ZGUgPGVuY29kaW5nc19mcmFnbWVudD5cclxuICAgICNpbmNsdWRlIDxmb2dfZnJhZ21lbnQ+XHJcbiAgfWA7XHJcbn07XHJcblxyXG5leHBvcnQgeyBCYXNpY0FuaW1hdGlvbk1hdGVyaWFsIH07XHJcbiIsImltcG9ydCB7IFNoYWRlckxpYiB9IGZyb20gJ3RocmVlJztcclxuaW1wb3J0IEJhc2VBbmltYXRpb25NYXRlcmlhbCBmcm9tICcuL0Jhc2VBbmltYXRpb25NYXRlcmlhbCc7XHJcblxyXG4vKipcclxuICogRXh0ZW5kcyBUSFJFRS5NZXNoTGFtYmVydE1hdGVyaWFsIHdpdGggY3VzdG9tIHNoYWRlciBjaHVua3MuXHJcbiAqXHJcbiAqIEBzZWUgaHR0cDovL3RocmVlLWJhcy1leGFtcGxlcy5zdXJnZS5zaC9leGFtcGxlcy9tYXRlcmlhbHNfbGFtYmVydC9cclxuICpcclxuICogQHBhcmFtIHtPYmplY3R9IHBhcmFtZXRlcnMgT2JqZWN0IGNvbnRhaW5pbmcgbWF0ZXJpYWwgcHJvcGVydGllcyBhbmQgY3VzdG9tIHNoYWRlciBjaHVua3MuXHJcbiAqIEBjb25zdHJ1Y3RvclxyXG4gKi9cclxuZnVuY3Rpb24gTGFtYmVydEFuaW1hdGlvbk1hdGVyaWFsKHBhcmFtZXRlcnMpIHtcclxuICB0aGlzLnZhcnlpbmdQYXJhbWV0ZXJzID0gW107XHJcbiAgXHJcbiAgdGhpcy52ZXJ0ZXhGdW5jdGlvbnMgPSBbXTtcclxuICB0aGlzLnZlcnRleFBhcmFtZXRlcnMgPSBbXTtcclxuICB0aGlzLnZlcnRleEluaXQgPSBbXTtcclxuICB0aGlzLnZlcnRleE5vcm1hbCA9IFtdO1xyXG4gIHRoaXMudmVydGV4UG9zaXRpb24gPSBbXTtcclxuICB0aGlzLnZlcnRleENvbG9yID0gW107XHJcbiAgdGhpcy52ZXJ0ZXhQb3N0TW9ycGggPSBbXTtcclxuICB0aGlzLnZlcnRleFBvc3RTa2lubmluZyA9IFtdO1xyXG4gIFxyXG4gIHRoaXMuZnJhZ21lbnRGdW5jdGlvbnMgPSBbXTtcclxuICB0aGlzLmZyYWdtZW50UGFyYW1ldGVycyA9IFtdO1xyXG4gIHRoaXMuZnJhZ21lbnRJbml0ID0gW107XHJcbiAgdGhpcy5mcmFnbWVudE1hcCA9IFtdO1xyXG4gIHRoaXMuZnJhZ21lbnREaWZmdXNlID0gW107XHJcbiAgdGhpcy5mcmFnbWVudEVtaXNzaXZlID0gW107XHJcbiAgdGhpcy5mcmFnbWVudFNwZWN1bGFyID0gW107XHJcbiAgXHJcbiAgQmFzZUFuaW1hdGlvbk1hdGVyaWFsLmNhbGwodGhpcywgcGFyYW1ldGVycywgU2hhZGVyTGliWydsYW1iZXJ0J10udW5pZm9ybXMpO1xyXG4gIFxyXG4gIHRoaXMubGlnaHRzID0gdHJ1ZTtcclxuICB0aGlzLnZlcnRleFNoYWRlciA9IHRoaXMuY29uY2F0VmVydGV4U2hhZGVyKCk7XHJcbiAgdGhpcy5mcmFnbWVudFNoYWRlciA9IHRoaXMuY29uY2F0RnJhZ21lbnRTaGFkZXIoKTtcclxufVxyXG5MYW1iZXJ0QW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShCYXNlQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlKTtcclxuTGFtYmVydEFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IExhbWJlcnRBbmltYXRpb25NYXRlcmlhbDtcclxuXHJcbkxhbWJlcnRBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uY2F0VmVydGV4U2hhZGVyID0gZnVuY3Rpb24gKCkge1xyXG4gIHJldHVybiBgXHJcbiAgI2RlZmluZSBMQU1CRVJUXHJcblxyXG4gIHZhcnlpbmcgdmVjMyB2TGlnaHRGcm9udDtcclxuICBcclxuICAjaWZkZWYgRE9VQkxFX1NJREVEXHJcbiAgXHJcbiAgICB2YXJ5aW5nIHZlYzMgdkxpZ2h0QmFjaztcclxuICBcclxuICAjZW5kaWZcclxuICBcclxuICAjaW5jbHVkZSA8Y29tbW9uPlxyXG4gICNpbmNsdWRlIDx1dl9wYXJzX3ZlcnRleD5cclxuICAjaW5jbHVkZSA8dXYyX3BhcnNfdmVydGV4PlxyXG4gICNpbmNsdWRlIDxlbnZtYXBfcGFyc192ZXJ0ZXg+XHJcbiAgI2luY2x1ZGUgPGJzZGZzPlxyXG4gICNpbmNsdWRlIDxsaWdodHNfcGFyc19iZWdpbj5cclxuICAjaW5jbHVkZSA8bGlnaHRzX3BhcnNfbWFwcz5cclxuICAjaW5jbHVkZSA8Y29sb3JfcGFyc192ZXJ0ZXg+XHJcbiAgI2luY2x1ZGUgPGZvZ19wYXJzX3ZlcnRleD5cclxuICAjaW5jbHVkZSA8bW9ycGh0YXJnZXRfcGFyc192ZXJ0ZXg+XHJcbiAgI2luY2x1ZGUgPHNraW5uaW5nX3BhcnNfdmVydGV4PlxyXG4gICNpbmNsdWRlIDxzaGFkb3dtYXBfcGFyc192ZXJ0ZXg+XHJcbiAgI2luY2x1ZGUgPGxvZ2RlcHRoYnVmX3BhcnNfdmVydGV4PlxyXG4gICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfcGFyc192ZXJ0ZXg+XHJcbiAgXHJcbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQYXJhbWV0ZXJzJyl9XHJcbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2YXJ5aW5nUGFyYW1ldGVycycpfVxyXG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4RnVuY3Rpb25zJyl9XHJcbiAgXHJcbiAgdm9pZCBtYWluKCkge1xyXG4gIFxyXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhJbml0Jyl9XHJcbiAgXHJcbiAgICAjaW5jbHVkZSA8dXZfdmVydGV4PlxyXG4gICAgI2luY2x1ZGUgPHV2Ml92ZXJ0ZXg+XHJcbiAgICAjaW5jbHVkZSA8Y29sb3JfdmVydGV4PlxyXG4gIFxyXG4gICAgI2luY2x1ZGUgPGJlZ2lubm9ybWFsX3ZlcnRleD5cclxuICAgIFxyXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhOb3JtYWwnKX1cclxuICAgIFxyXG4gICAgI2luY2x1ZGUgPG1vcnBobm9ybWFsX3ZlcnRleD5cclxuICAgICNpbmNsdWRlIDxza2luYmFzZV92ZXJ0ZXg+XHJcbiAgICAjaW5jbHVkZSA8c2tpbm5vcm1hbF92ZXJ0ZXg+XHJcbiAgICAjaW5jbHVkZSA8ZGVmYXVsdG5vcm1hbF92ZXJ0ZXg+XHJcbiAgXHJcbiAgICAjaW5jbHVkZSA8YmVnaW5fdmVydGV4PlxyXG4gICAgXHJcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBvc2l0aW9uJyl9XHJcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleENvbG9yJyl9XHJcbiAgICBcclxuICAgICNpbmNsdWRlIDxtb3JwaHRhcmdldF92ZXJ0ZXg+XHJcbiAgICBcclxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UG9zdE1vcnBoJyl9XHJcbiAgICBcclxuICAgICNpbmNsdWRlIDxza2lubmluZ192ZXJ0ZXg+XHJcblxyXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQb3N0U2tpbm5pbmcnKX1cclxuICAgIFxyXG4gICAgI2luY2x1ZGUgPHByb2plY3RfdmVydGV4PlxyXG4gICAgI2luY2x1ZGUgPGxvZ2RlcHRoYnVmX3ZlcnRleD5cclxuICAgICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfdmVydGV4PlxyXG4gIFxyXG4gICAgI2luY2x1ZGUgPHdvcmxkcG9zX3ZlcnRleD5cclxuICAgICNpbmNsdWRlIDxlbnZtYXBfdmVydGV4PlxyXG4gICAgI2luY2x1ZGUgPGxpZ2h0c19sYW1iZXJ0X3ZlcnRleD5cclxuICAgICNpbmNsdWRlIDxzaGFkb3dtYXBfdmVydGV4PlxyXG4gICAgI2luY2x1ZGUgPGZvZ192ZXJ0ZXg+XHJcbiAgfWA7XHJcbn07XHJcblxyXG5MYW1iZXJ0QW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlLmNvbmNhdEZyYWdtZW50U2hhZGVyID0gZnVuY3Rpb24gKCkge1xyXG4gIHJldHVybiBgXHJcbiAgdW5pZm9ybSB2ZWMzIGRpZmZ1c2U7XHJcbiAgdW5pZm9ybSB2ZWMzIGVtaXNzaXZlO1xyXG4gIHVuaWZvcm0gZmxvYXQgb3BhY2l0eTtcclxuICBcclxuICB2YXJ5aW5nIHZlYzMgdkxpZ2h0RnJvbnQ7XHJcbiAgXHJcbiAgI2lmZGVmIERPVUJMRV9TSURFRFxyXG4gIFxyXG4gICAgdmFyeWluZyB2ZWMzIHZMaWdodEJhY2s7XHJcbiAgXHJcbiAgI2VuZGlmXHJcbiAgXHJcbiAgI2luY2x1ZGUgPGNvbW1vbj5cclxuICAjaW5jbHVkZSA8cGFja2luZz5cclxuICAjaW5jbHVkZSA8ZGl0aGVyaW5nX3BhcnNfZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPGNvbG9yX3BhcnNfZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPHV2X3BhcnNfZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPHV2Ml9wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxtYXBfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8YWxwaGFtYXBfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8YW9tYXBfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8bGlnaHRtYXBfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8ZW1pc3NpdmVtYXBfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8ZW52bWFwX3BhcnNfZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPGJzZGZzPlxyXG4gICNpbmNsdWRlIDxsaWdodHNfcGFyc19iZWdpbj5cclxuICAjaW5jbHVkZSA8bGlnaHRzX3BhcnNfbWFwcz5cclxuICAjaW5jbHVkZSA8Zm9nX3BhcnNfZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPHNoYWRvd21hcF9wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxzaGFkb3dtYXNrX3BhcnNfZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPHNwZWN1bGFybWFwX3BhcnNfZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPGxvZ2RlcHRoYnVmX3BhcnNfZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc19wYXJzX2ZyYWdtZW50PlxyXG4gIFxyXG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRQYXJhbWV0ZXJzJyl9XHJcbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2YXJ5aW5nUGFyYW1ldGVycycpfVxyXG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRGdW5jdGlvbnMnKX1cclxuICBcclxuICB2b2lkIG1haW4oKSB7XHJcbiAgXHJcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50SW5pdCcpfVxyXG4gIFxyXG4gICAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc19mcmFnbWVudD5cclxuXHJcbiAgICB2ZWM0IGRpZmZ1c2VDb2xvciA9IHZlYzQoIGRpZmZ1c2UsIG9wYWNpdHkgKTtcclxuICAgIFJlZmxlY3RlZExpZ2h0IHJlZmxlY3RlZExpZ2h0ID0gUmVmbGVjdGVkTGlnaHQoIHZlYzMoIDAuMCApLCB2ZWMzKCAwLjAgKSwgdmVjMyggMC4wICksIHZlYzMoIDAuMCApICk7XHJcbiAgICB2ZWMzIHRvdGFsRW1pc3NpdmVSYWRpYW5jZSA9IGVtaXNzaXZlO1xyXG5cdFxyXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudERpZmZ1c2UnKX1cclxuICBcclxuICAgICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl9mcmFnbWVudD5cclxuXHJcbiAgICAkeyh0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudE1hcCcpIHx8ICcjaW5jbHVkZSA8bWFwX2ZyYWdtZW50PicpfVxyXG5cclxuICAgICNpbmNsdWRlIDxjb2xvcl9mcmFnbWVudD5cclxuICAgICNpbmNsdWRlIDxhbHBoYW1hcF9mcmFnbWVudD5cclxuICAgICNpbmNsdWRlIDxhbHBoYXRlc3RfZnJhZ21lbnQ+XHJcbiAgICAjaW5jbHVkZSA8c3BlY3VsYXJtYXBfZnJhZ21lbnQ+XHJcblxyXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudEVtaXNzaXZlJyl9XHJcblxyXG4gICAgI2luY2x1ZGUgPGVtaXNzaXZlbWFwX2ZyYWdtZW50PlxyXG4gIFxyXG4gICAgLy8gYWNjdW11bGF0aW9uXHJcbiAgICByZWZsZWN0ZWRMaWdodC5pbmRpcmVjdERpZmZ1c2UgPSBnZXRBbWJpZW50TGlnaHRJcnJhZGlhbmNlKCBhbWJpZW50TGlnaHRDb2xvciApO1xyXG4gIFxyXG4gICAgI2luY2x1ZGUgPGxpZ2h0bWFwX2ZyYWdtZW50PlxyXG4gIFxyXG4gICAgcmVmbGVjdGVkTGlnaHQuaW5kaXJlY3REaWZmdXNlICo9IEJSREZfRGlmZnVzZV9MYW1iZXJ0KCBkaWZmdXNlQ29sb3IucmdiICk7XHJcbiAgXHJcbiAgICAjaWZkZWYgRE9VQkxFX1NJREVEXHJcbiAgXHJcbiAgICAgIHJlZmxlY3RlZExpZ2h0LmRpcmVjdERpZmZ1c2UgPSAoIGdsX0Zyb250RmFjaW5nICkgPyB2TGlnaHRGcm9udCA6IHZMaWdodEJhY2s7XHJcbiAgXHJcbiAgICAjZWxzZVxyXG4gIFxyXG4gICAgICByZWZsZWN0ZWRMaWdodC5kaXJlY3REaWZmdXNlID0gdkxpZ2h0RnJvbnQ7XHJcbiAgXHJcbiAgICAjZW5kaWZcclxuICBcclxuICAgIHJlZmxlY3RlZExpZ2h0LmRpcmVjdERpZmZ1c2UgKj0gQlJERl9EaWZmdXNlX0xhbWJlcnQoIGRpZmZ1c2VDb2xvci5yZ2IgKSAqIGdldFNoYWRvd01hc2soKTtcclxuICBcclxuICAgIC8vIG1vZHVsYXRpb25cclxuICAgICNpbmNsdWRlIDxhb21hcF9mcmFnbWVudD5cclxuICBcclxuICAgIHZlYzMgb3V0Z29pbmdMaWdodCA9IHJlZmxlY3RlZExpZ2h0LmRpcmVjdERpZmZ1c2UgKyByZWZsZWN0ZWRMaWdodC5pbmRpcmVjdERpZmZ1c2UgKyB0b3RhbEVtaXNzaXZlUmFkaWFuY2U7XHJcbiAgXHJcbiAgICAjaW5jbHVkZSA8ZW52bWFwX2ZyYWdtZW50PlxyXG4gIFxyXG4gICAgZ2xfRnJhZ0NvbG9yID0gdmVjNCggb3V0Z29pbmdMaWdodCwgZGlmZnVzZUNvbG9yLmEgKTtcclxuICBcclxuICAgICNpbmNsdWRlIDx0b25lbWFwcGluZ19mcmFnbWVudD5cclxuICAgICNpbmNsdWRlIDxlbmNvZGluZ3NfZnJhZ21lbnQ+XHJcbiAgICAjaW5jbHVkZSA8Zm9nX2ZyYWdtZW50PlxyXG4gICAgI2luY2x1ZGUgPHByZW11bHRpcGxpZWRfYWxwaGFfZnJhZ21lbnQ+XHJcbiAgICAjaW5jbHVkZSA8ZGl0aGVyaW5nX2ZyYWdtZW50PlxyXG4gIH1gO1xyXG59O1xyXG5cclxuZXhwb3J0IHsgTGFtYmVydEFuaW1hdGlvbk1hdGVyaWFsIH07XHJcbiIsImltcG9ydCB7IFNoYWRlckxpYiB9IGZyb20gJ3RocmVlJztcclxuaW1wb3J0IEJhc2VBbmltYXRpb25NYXRlcmlhbCBmcm9tICcuL0Jhc2VBbmltYXRpb25NYXRlcmlhbCc7XHJcblxyXG4vKipcclxuICogRXh0ZW5kcyBUSFJFRS5NZXNoUGhvbmdNYXRlcmlhbCB3aXRoIGN1c3RvbSBzaGFkZXIgY2h1bmtzLlxyXG4gKlxyXG4gKiBAc2VlIGh0dHA6Ly90aHJlZS1iYXMtZXhhbXBsZXMuc3VyZ2Uuc2gvZXhhbXBsZXMvbWF0ZXJpYWxzX3Bob25nL1xyXG4gKlxyXG4gKiBAcGFyYW0ge09iamVjdH0gcGFyYW1ldGVycyBPYmplY3QgY29udGFpbmluZyBtYXRlcmlhbCBwcm9wZXJ0aWVzIGFuZCBjdXN0b20gc2hhZGVyIGNodW5rcy5cclxuICogQGNvbnN0cnVjdG9yXHJcbiAqL1xyXG5mdW5jdGlvbiBQaG9uZ0FuaW1hdGlvbk1hdGVyaWFsKHBhcmFtZXRlcnMpIHtcclxuICB0aGlzLnZhcnlpbmdQYXJhbWV0ZXJzID0gW107XHJcblxyXG4gIHRoaXMudmVydGV4RnVuY3Rpb25zID0gW107XHJcbiAgdGhpcy52ZXJ0ZXhQYXJhbWV0ZXJzID0gW107XHJcbiAgdGhpcy52ZXJ0ZXhJbml0ID0gW107XHJcbiAgdGhpcy52ZXJ0ZXhOb3JtYWwgPSBbXTtcclxuICB0aGlzLnZlcnRleFBvc2l0aW9uID0gW107XHJcbiAgdGhpcy52ZXJ0ZXhDb2xvciA9IFtdO1xyXG5cclxuICB0aGlzLmZyYWdtZW50RnVuY3Rpb25zID0gW107XHJcbiAgdGhpcy5mcmFnbWVudFBhcmFtZXRlcnMgPSBbXTtcclxuICB0aGlzLmZyYWdtZW50SW5pdCA9IFtdO1xyXG4gIHRoaXMuZnJhZ21lbnRNYXAgPSBbXTtcclxuICB0aGlzLmZyYWdtZW50RGlmZnVzZSA9IFtdO1xyXG4gIHRoaXMuZnJhZ21lbnRFbWlzc2l2ZSA9IFtdO1xyXG4gIHRoaXMuZnJhZ21lbnRTcGVjdWxhciA9IFtdO1xyXG5cclxuICBCYXNlQW5pbWF0aW9uTWF0ZXJpYWwuY2FsbCh0aGlzLCBwYXJhbWV0ZXJzLCBTaGFkZXJMaWJbJ3Bob25nJ10udW5pZm9ybXMpO1xyXG5cclxuICB0aGlzLmxpZ2h0cyA9IHRydWU7XHJcbiAgdGhpcy52ZXJ0ZXhTaGFkZXIgPSB0aGlzLmNvbmNhdFZlcnRleFNoYWRlcigpO1xyXG4gIHRoaXMuZnJhZ21lbnRTaGFkZXIgPSB0aGlzLmNvbmNhdEZyYWdtZW50U2hhZGVyKCk7XHJcbn1cclxuUGhvbmdBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEJhc2VBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUpO1xyXG5QaG9uZ0FuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFBob25nQW5pbWF0aW9uTWF0ZXJpYWw7XHJcblxyXG5QaG9uZ0FuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZS5jb25jYXRWZXJ0ZXhTaGFkZXIgPSBmdW5jdGlvbiAoKSB7XHJcbiAgcmV0dXJuIGBcclxuICAjZGVmaW5lIFBIT05HXHJcblxyXG4gIHZhcnlpbmcgdmVjMyB2Vmlld1Bvc2l0aW9uO1xyXG4gIFxyXG4gICNpZm5kZWYgRkxBVF9TSEFERURcclxuICBcclxuICAgIHZhcnlpbmcgdmVjMyB2Tm9ybWFsO1xyXG4gIFxyXG4gICNlbmRpZlxyXG4gIFxyXG4gICNpbmNsdWRlIDxjb21tb24+XHJcbiAgI2luY2x1ZGUgPHV2X3BhcnNfdmVydGV4PlxyXG4gICNpbmNsdWRlIDx1djJfcGFyc192ZXJ0ZXg+XHJcbiAgI2luY2x1ZGUgPGRpc3BsYWNlbWVudG1hcF9wYXJzX3ZlcnRleD5cclxuICAjaW5jbHVkZSA8ZW52bWFwX3BhcnNfdmVydGV4PlxyXG4gICNpbmNsdWRlIDxjb2xvcl9wYXJzX3ZlcnRleD5cclxuICAjaW5jbHVkZSA8Zm9nX3BhcnNfdmVydGV4PlxyXG4gICNpbmNsdWRlIDxtb3JwaHRhcmdldF9wYXJzX3ZlcnRleD5cclxuICAjaW5jbHVkZSA8c2tpbm5pbmdfcGFyc192ZXJ0ZXg+XHJcbiAgI2luY2x1ZGUgPHNoYWRvd21hcF9wYXJzX3ZlcnRleD5cclxuICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfcGFyc192ZXJ0ZXg+XHJcbiAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc19wYXJzX3ZlcnRleD5cclxuICBcclxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBhcmFtZXRlcnMnKX1cclxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZhcnlpbmdQYXJhbWV0ZXJzJyl9XHJcbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhGdW5jdGlvbnMnKX1cclxuICBcclxuICB2b2lkIG1haW4oKSB7XHJcbiAgXHJcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleEluaXQnKX1cclxuICBcclxuICAgICNpbmNsdWRlIDx1dl92ZXJ0ZXg+XHJcbiAgICAjaW5jbHVkZSA8dXYyX3ZlcnRleD5cclxuICAgICNpbmNsdWRlIDxjb2xvcl92ZXJ0ZXg+XHJcbiAgXHJcbiAgICAjaW5jbHVkZSA8YmVnaW5ub3JtYWxfdmVydGV4PlxyXG4gICAgXHJcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleE5vcm1hbCcpfVxyXG4gICAgXHJcbiAgICAjaW5jbHVkZSA8bW9ycGhub3JtYWxfdmVydGV4PlxyXG4gICAgI2luY2x1ZGUgPHNraW5iYXNlX3ZlcnRleD5cclxuICAgICNpbmNsdWRlIDxza2lubm9ybWFsX3ZlcnRleD5cclxuICAgICNpbmNsdWRlIDxkZWZhdWx0bm9ybWFsX3ZlcnRleD5cclxuICBcclxuICAjaWZuZGVmIEZMQVRfU0hBREVEIC8vIE5vcm1hbCBjb21wdXRlZCB3aXRoIGRlcml2YXRpdmVzIHdoZW4gRkxBVF9TSEFERURcclxuICBcclxuICAgIHZOb3JtYWwgPSBub3JtYWxpemUoIHRyYW5zZm9ybWVkTm9ybWFsICk7XHJcbiAgXHJcbiAgI2VuZGlmXHJcbiAgXHJcbiAgICAjaW5jbHVkZSA8YmVnaW5fdmVydGV4PlxyXG4gICAgXHJcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBvc2l0aW9uJyl9XHJcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleENvbG9yJyl9XHJcbiAgICBcclxuICAgICNpbmNsdWRlIDxtb3JwaHRhcmdldF92ZXJ0ZXg+XHJcbiAgICAjaW5jbHVkZSA8c2tpbm5pbmdfdmVydGV4PlxyXG4gICAgI2luY2x1ZGUgPGRpc3BsYWNlbWVudG1hcF92ZXJ0ZXg+XHJcbiAgICAjaW5jbHVkZSA8cHJvamVjdF92ZXJ0ZXg+XHJcbiAgICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfdmVydGV4PlxyXG4gICAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc192ZXJ0ZXg+XHJcbiAgXHJcbiAgICB2Vmlld1Bvc2l0aW9uID0gLSBtdlBvc2l0aW9uLnh5ejtcclxuICBcclxuICAgICNpbmNsdWRlIDx3b3JsZHBvc192ZXJ0ZXg+XHJcbiAgICAjaW5jbHVkZSA8ZW52bWFwX3ZlcnRleD5cclxuICAgICNpbmNsdWRlIDxzaGFkb3dtYXBfdmVydGV4PlxyXG4gICAgI2luY2x1ZGUgPGZvZ192ZXJ0ZXg+XHJcbiAgfWA7XHJcbn07XHJcblxyXG5QaG9uZ0FuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZS5jb25jYXRGcmFnbWVudFNoYWRlciA9IGZ1bmN0aW9uICgpIHtcclxuICByZXR1cm4gYFxyXG4gICNkZWZpbmUgUEhPTkdcclxuXHJcbiAgdW5pZm9ybSB2ZWMzIGRpZmZ1c2U7XHJcbiAgdW5pZm9ybSB2ZWMzIGVtaXNzaXZlO1xyXG4gIHVuaWZvcm0gdmVjMyBzcGVjdWxhcjtcclxuICB1bmlmb3JtIGZsb2F0IHNoaW5pbmVzcztcclxuICB1bmlmb3JtIGZsb2F0IG9wYWNpdHk7XHJcbiAgXHJcbiAgI2luY2x1ZGUgPGNvbW1vbj5cclxuICAjaW5jbHVkZSA8cGFja2luZz5cclxuICAjaW5jbHVkZSA8ZGl0aGVyaW5nX3BhcnNfZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPGNvbG9yX3BhcnNfZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPHV2X3BhcnNfZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPHV2Ml9wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxtYXBfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8YWxwaGFtYXBfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8YW9tYXBfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8bGlnaHRtYXBfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8ZW1pc3NpdmVtYXBfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8ZW52bWFwX3BhcnNfZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPGdyYWRpZW50bWFwX3BhcnNfZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPGZvZ19wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxic2Rmcz5cclxuICAjaW5jbHVkZSA8bGlnaHRzX3BhcnNfYmVnaW4+XHJcbiAgI2luY2x1ZGUgPGxpZ2h0c19wYXJzX21hcHM+XHJcbiAgI2luY2x1ZGUgPGxpZ2h0c19waG9uZ19wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxzaGFkb3dtYXBfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8YnVtcG1hcF9wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxub3JtYWxtYXBfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8c3BlY3VsYXJtYXBfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX3BhcnNfZnJhZ21lbnQ+XHJcbiAgXHJcbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudFBhcmFtZXRlcnMnKX1cclxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZhcnlpbmdQYXJhbWV0ZXJzJyl9XHJcbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudEZ1bmN0aW9ucycpfVxyXG4gIFxyXG4gIHZvaWQgbWFpbigpIHtcclxuICBcclxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRJbml0Jyl9XHJcbiAgXHJcbiAgICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX2ZyYWdtZW50PlxyXG4gIFxyXG4gICAgdmVjNCBkaWZmdXNlQ29sb3IgPSB2ZWM0KCBkaWZmdXNlLCBvcGFjaXR5ICk7XHJcbiAgICBSZWZsZWN0ZWRMaWdodCByZWZsZWN0ZWRMaWdodCA9IFJlZmxlY3RlZExpZ2h0KCB2ZWMzKCAwLjAgKSwgdmVjMyggMC4wICksIHZlYzMoIDAuMCApLCB2ZWMzKCAwLjAgKSApO1xyXG4gICAgdmVjMyB0b3RhbEVtaXNzaXZlUmFkaWFuY2UgPSBlbWlzc2l2ZTtcclxuICBcclxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnREaWZmdXNlJyl9XHJcbiAgXHJcbiAgICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfZnJhZ21lbnQ+XHJcblxyXG4gICAgJHsodGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRNYXAnKSB8fCAnI2luY2x1ZGUgPG1hcF9mcmFnbWVudD4nKX1cclxuXHJcbiAgICAjaW5jbHVkZSA8Y29sb3JfZnJhZ21lbnQ+XHJcbiAgICAjaW5jbHVkZSA8YWxwaGFtYXBfZnJhZ21lbnQ+XHJcbiAgICAjaW5jbHVkZSA8YWxwaGF0ZXN0X2ZyYWdtZW50PlxyXG4gICAgI2luY2x1ZGUgPHNwZWN1bGFybWFwX2ZyYWdtZW50PlxyXG4gICAgI2luY2x1ZGUgPG5vcm1hbF9mcmFnbWVudF9iZWdpbj5cclxuICAgICNpbmNsdWRlIDxub3JtYWxfZnJhZ21lbnRfbWFwcz5cclxuICAgIFxyXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudEVtaXNzaXZlJyl9XHJcbiAgICBcclxuICAgICNpbmNsdWRlIDxlbWlzc2l2ZW1hcF9mcmFnbWVudD5cclxuICBcclxuICAgIC8vIGFjY3VtdWxhdGlvblxyXG4gICAgI2luY2x1ZGUgPGxpZ2h0c19waG9uZ19mcmFnbWVudD5cclxuICAgICNpbmNsdWRlIDxsaWdodHNfZnJhZ21lbnRfYmVnaW4+XHJcbiAgICAjaW5jbHVkZSA8bGlnaHRzX2ZyYWdtZW50X21hcHM+XHJcbiAgICAjaW5jbHVkZSA8bGlnaHRzX2ZyYWdtZW50X2VuZD5cclxuICAgIFxyXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudFNwZWN1bGFyJyl9XHJcbiAgICBcclxuICAgIC8vIG1vZHVsYXRpb25cclxuICAgICNpbmNsdWRlIDxhb21hcF9mcmFnbWVudD5cclxuICBcclxuICAgIHZlYzMgb3V0Z29pbmdMaWdodCA9IHJlZmxlY3RlZExpZ2h0LmRpcmVjdERpZmZ1c2UgKyByZWZsZWN0ZWRMaWdodC5pbmRpcmVjdERpZmZ1c2UgKyByZWZsZWN0ZWRMaWdodC5kaXJlY3RTcGVjdWxhciArIHJlZmxlY3RlZExpZ2h0LmluZGlyZWN0U3BlY3VsYXIgKyB0b3RhbEVtaXNzaXZlUmFkaWFuY2U7XHJcbiAgXHJcbiAgICAjaW5jbHVkZSA8ZW52bWFwX2ZyYWdtZW50PlxyXG4gIFxyXG4gICAgZ2xfRnJhZ0NvbG9yID0gdmVjNCggb3V0Z29pbmdMaWdodCwgZGlmZnVzZUNvbG9yLmEgKTtcclxuICBcclxuICAgICNpbmNsdWRlIDx0b25lbWFwcGluZ19mcmFnbWVudD5cclxuICAgICNpbmNsdWRlIDxlbmNvZGluZ3NfZnJhZ21lbnQ+XHJcbiAgICAjaW5jbHVkZSA8Zm9nX2ZyYWdtZW50PlxyXG4gICAgI2luY2x1ZGUgPHByZW11bHRpcGxpZWRfYWxwaGFfZnJhZ21lbnQ+XHJcbiAgICAjaW5jbHVkZSA8ZGl0aGVyaW5nX2ZyYWdtZW50PlxyXG4gIFxyXG4gIH1gO1xyXG59O1xyXG5cclxuZXhwb3J0IHsgUGhvbmdBbmltYXRpb25NYXRlcmlhbCB9O1xyXG4iLCJpbXBvcnQgeyBTaGFkZXJMaWIgfSBmcm9tICd0aHJlZSc7XHJcbmltcG9ydCBCYXNlQW5pbWF0aW9uTWF0ZXJpYWwgZnJvbSAnLi9CYXNlQW5pbWF0aW9uTWF0ZXJpYWwnO1xyXG5cclxuLyoqXHJcbiAqIEV4dGVuZHMgVEhSRUUuTWVzaFN0YW5kYXJkTWF0ZXJpYWwgd2l0aCBjdXN0b20gc2hhZGVyIGNodW5rcy5cclxuICpcclxuICogQHNlZSBodHRwOi8vdGhyZWUtYmFzLWV4YW1wbGVzLnN1cmdlLnNoL2V4YW1wbGVzL21hdGVyaWFsc19zdGFuZGFyZC9cclxuICpcclxuICogQHBhcmFtIHtPYmplY3R9IHBhcmFtZXRlcnMgT2JqZWN0IGNvbnRhaW5pbmcgbWF0ZXJpYWwgcHJvcGVydGllcyBhbmQgY3VzdG9tIHNoYWRlciBjaHVua3MuXHJcbiAqIEBjb25zdHJ1Y3RvclxyXG4gKi9cclxuZnVuY3Rpb24gU3RhbmRhcmRBbmltYXRpb25NYXRlcmlhbChwYXJhbWV0ZXJzKSB7XHJcbiAgdGhpcy52YXJ5aW5nUGFyYW1ldGVycyA9IFtdO1xyXG5cclxuICB0aGlzLnZlcnRleEZ1bmN0aW9ucyA9IFtdO1xyXG4gIHRoaXMudmVydGV4UGFyYW1ldGVycyA9IFtdO1xyXG4gIHRoaXMudmVydGV4SW5pdCA9IFtdO1xyXG4gIHRoaXMudmVydGV4Tm9ybWFsID0gW107XHJcbiAgdGhpcy52ZXJ0ZXhQb3NpdGlvbiA9IFtdO1xyXG4gIHRoaXMudmVydGV4Q29sb3IgPSBbXTtcclxuICB0aGlzLnZlcnRleFBvc3RNb3JwaCA9IFtdO1xyXG4gIHRoaXMudmVydGV4UG9zdFNraW5uaW5nID0gW107XHJcblxyXG4gIHRoaXMuZnJhZ21lbnRGdW5jdGlvbnMgPSBbXTtcclxuICB0aGlzLmZyYWdtZW50UGFyYW1ldGVycyA9IFtdO1xyXG4gIHRoaXMuZnJhZ21lbnRJbml0ID0gW107XHJcbiAgdGhpcy5mcmFnbWVudE1hcCA9IFtdO1xyXG4gIHRoaXMuZnJhZ21lbnREaWZmdXNlID0gW107XHJcbiAgdGhpcy5mcmFnbWVudFJvdWdobmVzcyA9IFtdO1xyXG4gIHRoaXMuZnJhZ21lbnRNZXRhbG5lc3MgPSBbXTtcclxuICB0aGlzLmZyYWdtZW50RW1pc3NpdmUgPSBbXTtcclxuXHJcbiAgQmFzZUFuaW1hdGlvbk1hdGVyaWFsLmNhbGwodGhpcywgcGFyYW1ldGVycywgU2hhZGVyTGliWydzdGFuZGFyZCddLnVuaWZvcm1zKTtcclxuXHJcbiAgdGhpcy5saWdodHMgPSB0cnVlO1xyXG4gIHRoaXMudmVydGV4U2hhZGVyID0gdGhpcy5jb25jYXRWZXJ0ZXhTaGFkZXIoKTtcclxuICB0aGlzLmZyYWdtZW50U2hhZGVyID0gdGhpcy5jb25jYXRGcmFnbWVudFNoYWRlcigpO1xyXG59XHJcblN0YW5kYXJkQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShCYXNlQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlKTtcclxuU3RhbmRhcmRBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBTdGFuZGFyZEFuaW1hdGlvbk1hdGVyaWFsO1xyXG5cclxuU3RhbmRhcmRBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uY2F0VmVydGV4U2hhZGVyID0gZnVuY3Rpb24gKCkge1xyXG4gIHJldHVybiBgXHJcbiAgI2RlZmluZSBQSFlTSUNBTFxyXG5cclxuICB2YXJ5aW5nIHZlYzMgdlZpZXdQb3NpdGlvbjtcclxuICBcclxuICAjaWZuZGVmIEZMQVRfU0hBREVEXHJcbiAgXHJcbiAgICB2YXJ5aW5nIHZlYzMgdk5vcm1hbDtcclxuICBcclxuICAjZW5kaWZcclxuICBcclxuICAjaW5jbHVkZSA8Y29tbW9uPlxyXG4gICNpbmNsdWRlIDx1dl9wYXJzX3ZlcnRleD5cclxuICAjaW5jbHVkZSA8dXYyX3BhcnNfdmVydGV4PlxyXG4gICNpbmNsdWRlIDxkaXNwbGFjZW1lbnRtYXBfcGFyc192ZXJ0ZXg+XHJcbiAgI2luY2x1ZGUgPGNvbG9yX3BhcnNfdmVydGV4PlxyXG4gICNpbmNsdWRlIDxmb2dfcGFyc192ZXJ0ZXg+XHJcbiAgI2luY2x1ZGUgPG1vcnBodGFyZ2V0X3BhcnNfdmVydGV4PlxyXG4gICNpbmNsdWRlIDxza2lubmluZ19wYXJzX3ZlcnRleD5cclxuICAjaW5jbHVkZSA8c2hhZG93bWFwX3BhcnNfdmVydGV4PlxyXG4gICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl9wYXJzX3ZlcnRleD5cclxuICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX3BhcnNfdmVydGV4PlxyXG4gIFxyXG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UGFyYW1ldGVycycpfVxyXG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmFyeWluZ1BhcmFtZXRlcnMnKX1cclxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleEZ1bmN0aW9ucycpfVxyXG4gIFxyXG4gIHZvaWQgbWFpbigpIHtcclxuXHJcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleEluaXQnKX1cclxuXHJcbiAgICAjaW5jbHVkZSA8dXZfdmVydGV4PlxyXG4gICAgI2luY2x1ZGUgPHV2Ml92ZXJ0ZXg+XHJcbiAgICAjaW5jbHVkZSA8Y29sb3JfdmVydGV4PlxyXG4gIFxyXG4gICAgI2luY2x1ZGUgPGJlZ2lubm9ybWFsX3ZlcnRleD5cclxuICAgIFxyXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhOb3JtYWwnKX1cclxuICAgIFxyXG4gICAgI2luY2x1ZGUgPG1vcnBobm9ybWFsX3ZlcnRleD5cclxuICAgICNpbmNsdWRlIDxza2luYmFzZV92ZXJ0ZXg+XHJcbiAgICAjaW5jbHVkZSA8c2tpbm5vcm1hbF92ZXJ0ZXg+XHJcbiAgICAjaW5jbHVkZSA8ZGVmYXVsdG5vcm1hbF92ZXJ0ZXg+XHJcbiAgXHJcbiAgI2lmbmRlZiBGTEFUX1NIQURFRCAvLyBOb3JtYWwgY29tcHV0ZWQgd2l0aCBkZXJpdmF0aXZlcyB3aGVuIEZMQVRfU0hBREVEXHJcbiAgXHJcbiAgICB2Tm9ybWFsID0gbm9ybWFsaXplKCB0cmFuc2Zvcm1lZE5vcm1hbCApO1xyXG4gIFxyXG4gICNlbmRpZlxyXG4gIFxyXG4gICAgI2luY2x1ZGUgPGJlZ2luX3ZlcnRleD5cclxuICAgIFxyXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQb3NpdGlvbicpfVxyXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhDb2xvcicpfVxyXG4gICAgXHJcbiAgICAjaW5jbHVkZSA8bW9ycGh0YXJnZXRfdmVydGV4PlxyXG4gICAgXHJcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBvc3RNb3JwaCcpfVxyXG4gICAgXHJcbiAgICAjaW5jbHVkZSA8c2tpbm5pbmdfdmVydGV4PlxyXG5cclxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UG9zdFNraW5uaW5nJyl9XHJcbiAgICBcclxuICAgICNpbmNsdWRlIDxkaXNwbGFjZW1lbnRtYXBfdmVydGV4PlxyXG4gICAgI2luY2x1ZGUgPHByb2plY3RfdmVydGV4PlxyXG4gICAgI2luY2x1ZGUgPGxvZ2RlcHRoYnVmX3ZlcnRleD5cclxuICAgICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfdmVydGV4PlxyXG4gIFxyXG4gICAgdlZpZXdQb3NpdGlvbiA9IC0gbXZQb3NpdGlvbi54eXo7XHJcbiAgXHJcbiAgICAjaW5jbHVkZSA8d29ybGRwb3NfdmVydGV4PlxyXG4gICAgI2luY2x1ZGUgPHNoYWRvd21hcF92ZXJ0ZXg+XHJcbiAgICAjaW5jbHVkZSA8Zm9nX3ZlcnRleD5cclxuICB9YDtcclxufTtcclxuXHJcblN0YW5kYXJkQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlLmNvbmNhdEZyYWdtZW50U2hhZGVyID0gZnVuY3Rpb24gKCkge1xyXG4gIHJldHVybiBgXHJcbiAgI2RlZmluZSBQSFlTSUNBTFxyXG4gIFxyXG4gIHVuaWZvcm0gdmVjMyBkaWZmdXNlO1xyXG4gIHVuaWZvcm0gdmVjMyBlbWlzc2l2ZTtcclxuICB1bmlmb3JtIGZsb2F0IHJvdWdobmVzcztcclxuICB1bmlmb3JtIGZsb2F0IG1ldGFsbmVzcztcclxuICB1bmlmb3JtIGZsb2F0IG9wYWNpdHk7XHJcbiAgXHJcbiAgI2lmbmRlZiBTVEFOREFSRFxyXG4gICAgdW5pZm9ybSBmbG9hdCBjbGVhckNvYXQ7XHJcbiAgICB1bmlmb3JtIGZsb2F0IGNsZWFyQ29hdFJvdWdobmVzcztcclxuICAjZW5kaWZcclxuICBcclxuICB2YXJ5aW5nIHZlYzMgdlZpZXdQb3NpdGlvbjtcclxuICBcclxuICAjaWZuZGVmIEZMQVRfU0hBREVEXHJcbiAgXHJcbiAgICB2YXJ5aW5nIHZlYzMgdk5vcm1hbDtcclxuICBcclxuICAjZW5kaWZcclxuICBcclxuICAjaW5jbHVkZSA8Y29tbW9uPlxyXG4gICNpbmNsdWRlIDxwYWNraW5nPlxyXG4gICNpbmNsdWRlIDxkaXRoZXJpbmdfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8Y29sb3JfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8dXZfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8dXYyX3BhcnNfZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPG1hcF9wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxhbHBoYW1hcF9wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxhb21hcF9wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxsaWdodG1hcF9wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxlbWlzc2l2ZW1hcF9wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxlbnZtYXBfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8Zm9nX3BhcnNfZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPGJzZGZzPlxyXG4gICNpbmNsdWRlIDxjdWJlX3V2X3JlZmxlY3Rpb25fZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPGxpZ2h0c19wYXJzX2JlZ2luPlxyXG4gICNpbmNsdWRlIDxsaWdodHNfcGFyc19tYXBzPlxyXG4gICNpbmNsdWRlIDxsaWdodHNfcGh5c2ljYWxfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8c2hhZG93bWFwX3BhcnNfZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPGJ1bXBtYXBfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8bm9ybWFsbWFwX3BhcnNfZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPHJvdWdobmVzc21hcF9wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxtZXRhbG5lc3NtYXBfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX3BhcnNfZnJhZ21lbnQ+XHJcbiAgXHJcbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudFBhcmFtZXRlcnMnKX1cclxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZhcnlpbmdQYXJhbWV0ZXJzJyl9XHJcbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudEZ1bmN0aW9ucycpfVxyXG4gIFxyXG4gIHZvaWQgbWFpbigpIHtcclxuICBcclxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRJbml0Jyl9XHJcbiAgXHJcbiAgICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX2ZyYWdtZW50PlxyXG4gIFxyXG4gICAgdmVjNCBkaWZmdXNlQ29sb3IgPSB2ZWM0KCBkaWZmdXNlLCBvcGFjaXR5ICk7XHJcbiAgICBSZWZsZWN0ZWRMaWdodCByZWZsZWN0ZWRMaWdodCA9IFJlZmxlY3RlZExpZ2h0KCB2ZWMzKCAwLjAgKSwgdmVjMyggMC4wICksIHZlYzMoIDAuMCApLCB2ZWMzKCAwLjAgKSApO1xyXG4gICAgdmVjMyB0b3RhbEVtaXNzaXZlUmFkaWFuY2UgPSBlbWlzc2l2ZTtcclxuICBcclxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnREaWZmdXNlJyl9XHJcbiAgXHJcbiAgICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfZnJhZ21lbnQ+XHJcblxyXG4gICAgJHsodGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRNYXAnKSB8fCAnI2luY2x1ZGUgPG1hcF9mcmFnbWVudD4nKX1cclxuXHJcbiAgICAjaW5jbHVkZSA8Y29sb3JfZnJhZ21lbnQ+XHJcbiAgICAjaW5jbHVkZSA8YWxwaGFtYXBfZnJhZ21lbnQ+XHJcbiAgICAjaW5jbHVkZSA8YWxwaGF0ZXN0X2ZyYWdtZW50PlxyXG4gICAgXHJcbiAgICBmbG9hdCByb3VnaG5lc3NGYWN0b3IgPSByb3VnaG5lc3M7XHJcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50Um91Z2huZXNzJyl9XHJcbiAgICAjaWZkZWYgVVNFX1JPVUdITkVTU01BUFxyXG4gICAgXHJcbiAgICAgIHZlYzQgdGV4ZWxSb3VnaG5lc3MgPSB0ZXh0dXJlMkQoIHJvdWdobmVzc01hcCwgdlV2ICk7XHJcbiAgICBcclxuICAgICAgLy8gcmVhZHMgY2hhbm5lbCBHLCBjb21wYXRpYmxlIHdpdGggYSBjb21iaW5lZCBPY2NsdXNpb25Sb3VnaG5lc3NNZXRhbGxpYyAoUkdCKSB0ZXh0dXJlXHJcbiAgICAgIHJvdWdobmVzc0ZhY3RvciAqPSB0ZXhlbFJvdWdobmVzcy5nO1xyXG4gICAgXHJcbiAgICAjZW5kaWZcclxuICAgIFxyXG4gICAgZmxvYXQgbWV0YWxuZXNzRmFjdG9yID0gbWV0YWxuZXNzO1xyXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudE1ldGFsbmVzcycpfVxyXG4gICAgI2lmZGVmIFVTRV9NRVRBTE5FU1NNQVBcclxuICAgIFxyXG4gICAgICB2ZWM0IHRleGVsTWV0YWxuZXNzID0gdGV4dHVyZTJEKCBtZXRhbG5lc3NNYXAsIHZVdiApO1xyXG4gICAgICBtZXRhbG5lc3NGYWN0b3IgKj0gdGV4ZWxNZXRhbG5lc3MuYjtcclxuICAgIFxyXG4gICAgI2VuZGlmXHJcbiAgICBcclxuICAgICNpbmNsdWRlIDxub3JtYWxfZnJhZ21lbnRfYmVnaW4+XHJcbiAgICAjaW5jbHVkZSA8bm9ybWFsX2ZyYWdtZW50X21hcHM+XHJcbiAgICBcclxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRFbWlzc2l2ZScpfVxyXG4gICAgXHJcbiAgICAjaW5jbHVkZSA8ZW1pc3NpdmVtYXBfZnJhZ21lbnQ+XHJcbiAgXHJcbiAgICAvLyBhY2N1bXVsYXRpb25cclxuICAgICNpbmNsdWRlIDxsaWdodHNfcGh5c2ljYWxfZnJhZ21lbnQ+XHJcbiAgICAjaW5jbHVkZSA8bGlnaHRzX2ZyYWdtZW50X2JlZ2luPlxyXG4gICAgI2luY2x1ZGUgPGxpZ2h0c19mcmFnbWVudF9tYXBzPlxyXG4gICAgI2luY2x1ZGUgPGxpZ2h0c19mcmFnbWVudF9lbmQ+XHJcbiAgXHJcbiAgICAvLyBtb2R1bGF0aW9uXHJcbiAgICAjaW5jbHVkZSA8YW9tYXBfZnJhZ21lbnQ+XHJcbiAgXHJcbiAgICB2ZWMzIG91dGdvaW5nTGlnaHQgPSByZWZsZWN0ZWRMaWdodC5kaXJlY3REaWZmdXNlICsgcmVmbGVjdGVkTGlnaHQuaW5kaXJlY3REaWZmdXNlICsgcmVmbGVjdGVkTGlnaHQuZGlyZWN0U3BlY3VsYXIgKyByZWZsZWN0ZWRMaWdodC5pbmRpcmVjdFNwZWN1bGFyICsgdG90YWxFbWlzc2l2ZVJhZGlhbmNlO1xyXG4gIFxyXG4gICAgZ2xfRnJhZ0NvbG9yID0gdmVjNCggb3V0Z29pbmdMaWdodCwgZGlmZnVzZUNvbG9yLmEgKTtcclxuICBcclxuICAgICNpbmNsdWRlIDx0b25lbWFwcGluZ19mcmFnbWVudD5cclxuICAgICNpbmNsdWRlIDxlbmNvZGluZ3NfZnJhZ21lbnQ+XHJcbiAgICAjaW5jbHVkZSA8Zm9nX2ZyYWdtZW50PlxyXG4gICAgI2luY2x1ZGUgPHByZW11bHRpcGxpZWRfYWxwaGFfZnJhZ21lbnQ+XHJcbiAgICAjaW5jbHVkZSA8ZGl0aGVyaW5nX2ZyYWdtZW50PlxyXG4gIFxyXG4gIH1gO1xyXG59O1xyXG5cclxuZXhwb3J0IHsgU3RhbmRhcmRBbmltYXRpb25NYXRlcmlhbCB9O1xyXG4iLCJpbXBvcnQgeyBTaGFkZXJMaWIgfSBmcm9tICd0aHJlZSc7XHJcbmltcG9ydCBCYXNlQW5pbWF0aW9uTWF0ZXJpYWwgZnJvbSAnLi9CYXNlQW5pbWF0aW9uTWF0ZXJpYWwnO1xyXG5cclxuLyoqXHJcbiAqIEV4dGVuZHMgVEhSRUUuUG9pbnRzTWF0ZXJpYWwgd2l0aCBjdXN0b20gc2hhZGVyIGNodW5rcy5cclxuICpcclxuICogQHBhcmFtIHtPYmplY3R9IHBhcmFtZXRlcnMgT2JqZWN0IGNvbnRhaW5pbmcgbWF0ZXJpYWwgcHJvcGVydGllcyBhbmQgY3VzdG9tIHNoYWRlciBjaHVua3MuXHJcbiAqIEBjb25zdHJ1Y3RvclxyXG4gKi9cclxuZnVuY3Rpb24gUG9pbnRzQW5pbWF0aW9uTWF0ZXJpYWwocGFyYW1ldGVycykge1xyXG4gIHRoaXMudmFyeWluZ1BhcmFtZXRlcnMgPSBbXTtcclxuICBcclxuICB0aGlzLnZlcnRleEZ1bmN0aW9ucyA9IFtdO1xyXG4gIHRoaXMudmVydGV4UGFyYW1ldGVycyA9IFtdO1xyXG4gIHRoaXMudmVydGV4SW5pdCA9IFtdO1xyXG4gIHRoaXMudmVydGV4UG9zaXRpb24gPSBbXTtcclxuICB0aGlzLnZlcnRleENvbG9yID0gW107XHJcbiAgXHJcbiAgdGhpcy5mcmFnbWVudEZ1bmN0aW9ucyA9IFtdO1xyXG4gIHRoaXMuZnJhZ21lbnRQYXJhbWV0ZXJzID0gW107XHJcbiAgdGhpcy5mcmFnbWVudEluaXQgPSBbXTtcclxuICB0aGlzLmZyYWdtZW50TWFwID0gW107XHJcbiAgdGhpcy5mcmFnbWVudERpZmZ1c2UgPSBbXTtcclxuICAvLyB1c2UgZnJhZ21lbnQgc2hhZGVyIHRvIHNoYXBlIHRvIHBvaW50LCByZWZlcmVuY2U6IGh0dHBzOi8vdGhlYm9va29mc2hhZGVycy5jb20vMDcvXHJcbiAgdGhpcy5mcmFnbWVudFNoYXBlID0gW107XHJcbiAgXHJcbiAgQmFzZUFuaW1hdGlvbk1hdGVyaWFsLmNhbGwodGhpcywgcGFyYW1ldGVycywgU2hhZGVyTGliWydwb2ludHMnXS51bmlmb3Jtcyk7XHJcbiAgXHJcbiAgdGhpcy52ZXJ0ZXhTaGFkZXIgPSB0aGlzLmNvbmNhdFZlcnRleFNoYWRlcigpO1xyXG4gIHRoaXMuZnJhZ21lbnRTaGFkZXIgPSB0aGlzLmNvbmNhdEZyYWdtZW50U2hhZGVyKCk7XHJcbn1cclxuXHJcblBvaW50c0FuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoQmFzZUFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZSk7XHJcblBvaW50c0FuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFBvaW50c0FuaW1hdGlvbk1hdGVyaWFsO1xyXG5cclxuUG9pbnRzQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlLmNvbmNhdFZlcnRleFNoYWRlciA9IGZ1bmN0aW9uICgpIHtcclxuICByZXR1cm4gYFxyXG4gIHVuaWZvcm0gZmxvYXQgc2l6ZTtcclxuICB1bmlmb3JtIGZsb2F0IHNjYWxlO1xyXG4gIFxyXG4gICNpbmNsdWRlIDxjb21tb24+XHJcbiAgI2luY2x1ZGUgPGNvbG9yX3BhcnNfdmVydGV4PlxyXG4gICNpbmNsdWRlIDxmb2dfcGFyc192ZXJ0ZXg+XHJcbiAgI2luY2x1ZGUgPHNoYWRvd21hcF9wYXJzX3ZlcnRleD5cclxuICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfcGFyc192ZXJ0ZXg+XHJcbiAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc19wYXJzX3ZlcnRleD5cclxuICBcclxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBhcmFtZXRlcnMnKX1cclxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZhcnlpbmdQYXJhbWV0ZXJzJyl9XHJcbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhGdW5jdGlvbnMnKX1cclxuICBcclxuICB2b2lkIG1haW4oKSB7XHJcbiAgXHJcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleEluaXQnKX1cclxuICBcclxuICAgICNpbmNsdWRlIDxjb2xvcl92ZXJ0ZXg+XHJcbiAgICAjaW5jbHVkZSA8YmVnaW5fdmVydGV4PlxyXG4gICAgXHJcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBvc2l0aW9uJyl9XHJcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleENvbG9yJyl9XHJcbiAgICBcclxuICAgICNpbmNsdWRlIDxwcm9qZWN0X3ZlcnRleD5cclxuICBcclxuICAgICNpZmRlZiBVU0VfU0laRUFUVEVOVUFUSU9OXHJcbiAgICAgIGdsX1BvaW50U2l6ZSA9IHNpemUgKiAoIHNjYWxlIC8gLSBtdlBvc2l0aW9uLnogKTtcclxuICAgICNlbHNlXHJcbiAgICAgIGdsX1BvaW50U2l6ZSA9IHNpemU7XHJcbiAgICAjZW5kaWZcclxuICBcclxuICAgICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl92ZXJ0ZXg+XHJcbiAgICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX3ZlcnRleD5cclxuICAgICNpbmNsdWRlIDx3b3JsZHBvc192ZXJ0ZXg+XHJcbiAgICAjaW5jbHVkZSA8c2hhZG93bWFwX3ZlcnRleD5cclxuICAgICNpbmNsdWRlIDxmb2dfdmVydGV4PlxyXG4gIH1gO1xyXG59O1xyXG5cclxuUG9pbnRzQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlLmNvbmNhdEZyYWdtZW50U2hhZGVyID0gZnVuY3Rpb24gKCkge1xyXG4gIHJldHVybiBgXHJcbiAgdW5pZm9ybSB2ZWMzIGRpZmZ1c2U7XHJcbiAgdW5pZm9ybSBmbG9hdCBvcGFjaXR5O1xyXG4gIFxyXG4gICNpbmNsdWRlIDxjb21tb24+XHJcbiAgI2luY2x1ZGUgPHBhY2tpbmc+XHJcbiAgI2luY2x1ZGUgPGNvbG9yX3BhcnNfZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPG1hcF9wYXJ0aWNsZV9wYXJzX2ZyYWdtZW50PlxyXG4gICNpbmNsdWRlIDxmb2dfcGFyc19mcmFnbWVudD5cclxuICAjaW5jbHVkZSA8c2hhZG93bWFwX3BhcnNfZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPGxvZ2RlcHRoYnVmX3BhcnNfZnJhZ21lbnQ+XHJcbiAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc19wYXJzX2ZyYWdtZW50PlxyXG4gIFxyXG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRQYXJhbWV0ZXJzJyl9XHJcbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2YXJ5aW5nUGFyYW1ldGVycycpfVxyXG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRGdW5jdGlvbnMnKX1cclxuICBcclxuICB2b2lkIG1haW4oKSB7XHJcbiAgXHJcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50SW5pdCcpfVxyXG4gIFxyXG4gICAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc19mcmFnbWVudD5cclxuICBcclxuICAgIHZlYzMgb3V0Z29pbmdMaWdodCA9IHZlYzMoIDAuMCApO1xyXG4gICAgdmVjNCBkaWZmdXNlQ29sb3IgPSB2ZWM0KCBkaWZmdXNlLCBvcGFjaXR5ICk7XHJcbiAgXHJcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50RGlmZnVzZScpfVxyXG4gIFxyXG4gICAgI2luY2x1ZGUgPGxvZ2RlcHRoYnVmX2ZyYWdtZW50PlxyXG5cclxuICAgICR7KHRoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50TWFwJykgfHwgJyNpbmNsdWRlIDxtYXBfcGFydGljbGVfZnJhZ21lbnQ+Jyl9XHJcblxyXG4gICAgI2luY2x1ZGUgPGNvbG9yX2ZyYWdtZW50PlxyXG4gICAgI2luY2x1ZGUgPGFscGhhdGVzdF9mcmFnbWVudD5cclxuICBcclxuICAgIG91dGdvaW5nTGlnaHQgPSBkaWZmdXNlQ29sb3IucmdiO1xyXG4gIFxyXG4gICAgZ2xfRnJhZ0NvbG9yID0gdmVjNCggb3V0Z29pbmdMaWdodCwgZGlmZnVzZUNvbG9yLmEgKTtcclxuICAgIFxyXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudFNoYXBlJyl9XHJcbiAgXHJcbiAgICAjaW5jbHVkZSA8cHJlbXVsdGlwbGllZF9hbHBoYV9mcmFnbWVudD5cclxuICAgICNpbmNsdWRlIDx0b25lbWFwcGluZ19mcmFnbWVudD5cclxuICAgICNpbmNsdWRlIDxlbmNvZGluZ3NfZnJhZ21lbnQ+XHJcbiAgICAjaW5jbHVkZSA8Zm9nX2ZyYWdtZW50PlxyXG4gIH1gO1xyXG59O1xyXG5cclxuZXhwb3J0IHsgUG9pbnRzQW5pbWF0aW9uTWF0ZXJpYWwgfTtcclxuIiwiaW1wb3J0IHsgU2hhZGVyTGliLCBVbmlmb3Jtc1V0aWxzLCBSR0JBRGVwdGhQYWNraW5nIH0gZnJvbSAndGhyZWUnO1xyXG5pbXBvcnQgQmFzZUFuaW1hdGlvbk1hdGVyaWFsIGZyb20gJy4vQmFzZUFuaW1hdGlvbk1hdGVyaWFsJztcclxuXHJcbmZ1bmN0aW9uIERlcHRoQW5pbWF0aW9uTWF0ZXJpYWwocGFyYW1ldGVycykge1xyXG4gIHRoaXMuZGVwdGhQYWNraW5nID0gUkdCQURlcHRoUGFja2luZztcclxuICB0aGlzLmNsaXBwaW5nID0gdHJ1ZTtcclxuXHJcbiAgdGhpcy52ZXJ0ZXhGdW5jdGlvbnMgPSBbXTtcclxuICB0aGlzLnZlcnRleFBhcmFtZXRlcnMgPSBbXTtcclxuICB0aGlzLnZlcnRleEluaXQgPSBbXTtcclxuICB0aGlzLnZlcnRleFBvc2l0aW9uID0gW107XHJcbiAgdGhpcy52ZXJ0ZXhQb3N0TW9ycGggPSBbXTtcclxuICB0aGlzLnZlcnRleFBvc3RTa2lubmluZyA9IFtdO1xyXG5cclxuICBCYXNlQW5pbWF0aW9uTWF0ZXJpYWwuY2FsbCh0aGlzLCBwYXJhbWV0ZXJzKTtcclxuICBcclxuICB0aGlzLnVuaWZvcm1zID0gVW5pZm9ybXNVdGlscy5tZXJnZShbU2hhZGVyTGliWydkZXB0aCddLnVuaWZvcm1zLCB0aGlzLnVuaWZvcm1zXSk7XHJcbiAgdGhpcy52ZXJ0ZXhTaGFkZXIgPSB0aGlzLmNvbmNhdFZlcnRleFNoYWRlcigpO1xyXG4gIHRoaXMuZnJhZ21lbnRTaGFkZXIgPSBTaGFkZXJMaWJbJ2RlcHRoJ10uZnJhZ21lbnRTaGFkZXI7XHJcbn1cclxuRGVwdGhBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEJhc2VBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUpO1xyXG5EZXB0aEFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IERlcHRoQW5pbWF0aW9uTWF0ZXJpYWw7XHJcblxyXG5EZXB0aEFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZS5jb25jYXRWZXJ0ZXhTaGFkZXIgPSBmdW5jdGlvbiAoKSB7XHJcbiAgXHJcbiAgcmV0dXJuIGBcclxuICAjaW5jbHVkZSA8Y29tbW9uPlxyXG4gICNpbmNsdWRlIDx1dl9wYXJzX3ZlcnRleD5cclxuICAjaW5jbHVkZSA8ZGlzcGxhY2VtZW50bWFwX3BhcnNfdmVydGV4PlxyXG4gICNpbmNsdWRlIDxtb3JwaHRhcmdldF9wYXJzX3ZlcnRleD5cclxuICAjaW5jbHVkZSA8c2tpbm5pbmdfcGFyc192ZXJ0ZXg+XHJcbiAgI2luY2x1ZGUgPGxvZ2RlcHRoYnVmX3BhcnNfdmVydGV4PlxyXG4gICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfcGFyc192ZXJ0ZXg+XHJcbiAgXHJcbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQYXJhbWV0ZXJzJyl9XHJcbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhGdW5jdGlvbnMnKX1cclxuICBcclxuICB2b2lkIG1haW4oKSB7XHJcbiAgXHJcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleEluaXQnKX1cclxuICBcclxuICAgICNpbmNsdWRlIDx1dl92ZXJ0ZXg+XHJcbiAgXHJcbiAgICAjaW5jbHVkZSA8c2tpbmJhc2VfdmVydGV4PlxyXG4gIFxyXG4gICAgI2lmZGVmIFVTRV9ESVNQTEFDRU1FTlRNQVBcclxuICBcclxuICAgICAgI2luY2x1ZGUgPGJlZ2lubm9ybWFsX3ZlcnRleD5cclxuICAgICAgI2luY2x1ZGUgPG1vcnBobm9ybWFsX3ZlcnRleD5cclxuICAgICAgI2luY2x1ZGUgPHNraW5ub3JtYWxfdmVydGV4PlxyXG4gIFxyXG4gICAgI2VuZGlmXHJcbiAgXHJcbiAgICAjaW5jbHVkZSA8YmVnaW5fdmVydGV4PlxyXG4gICAgXHJcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBvc2l0aW9uJyl9XHJcblxyXG4gICAgI2luY2x1ZGUgPG1vcnBodGFyZ2V0X3ZlcnRleD5cclxuICAgIFxyXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQb3N0TW9ycGgnKX1cclxuICAgIFxyXG4gICAgI2luY2x1ZGUgPHNraW5uaW5nX3ZlcnRleD5cclxuXHJcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBvc3RTa2lubmluZycpfVxyXG4gICAgXHJcbiAgICAjaW5jbHVkZSA8ZGlzcGxhY2VtZW50bWFwX3ZlcnRleD5cclxuICAgICNpbmNsdWRlIDxwcm9qZWN0X3ZlcnRleD5cclxuICAgICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl92ZXJ0ZXg+XHJcbiAgICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX3ZlcnRleD5cclxuICB9YDtcclxufTtcclxuXHJcbmV4cG9ydCB7IERlcHRoQW5pbWF0aW9uTWF0ZXJpYWwgfTtcclxuIiwiaW1wb3J0IHsgU2hhZGVyTGliLCBVbmlmb3Jtc1V0aWxzLCBSR0JBRGVwdGhQYWNraW5nIH0gZnJvbSAndGhyZWUnO1xyXG5pbXBvcnQgQmFzZUFuaW1hdGlvbk1hdGVyaWFsIGZyb20gJy4vQmFzZUFuaW1hdGlvbk1hdGVyaWFsJztcclxuXHJcbmZ1bmN0aW9uIERpc3RhbmNlQW5pbWF0aW9uTWF0ZXJpYWwocGFyYW1ldGVycykge1xyXG4gIHRoaXMuZGVwdGhQYWNraW5nID0gUkdCQURlcHRoUGFja2luZztcclxuICB0aGlzLmNsaXBwaW5nID0gdHJ1ZTtcclxuXHJcbiAgdGhpcy52ZXJ0ZXhGdW5jdGlvbnMgPSBbXTtcclxuICB0aGlzLnZlcnRleFBhcmFtZXRlcnMgPSBbXTtcclxuICB0aGlzLnZlcnRleEluaXQgPSBbXTtcclxuICB0aGlzLnZlcnRleFBvc2l0aW9uID0gW107XHJcbiAgdGhpcy52ZXJ0ZXhQb3N0TW9ycGggPSBbXTtcclxuICB0aGlzLnZlcnRleFBvc3RTa2lubmluZyA9IFtdO1xyXG5cclxuICBCYXNlQW5pbWF0aW9uTWF0ZXJpYWwuY2FsbCh0aGlzLCBwYXJhbWV0ZXJzKTtcclxuICBcclxuICB0aGlzLnVuaWZvcm1zID0gVW5pZm9ybXNVdGlscy5tZXJnZShbU2hhZGVyTGliWydkaXN0YW5jZVJHQkEnXS51bmlmb3JtcywgdGhpcy51bmlmb3Jtc10pO1xyXG4gIHRoaXMudmVydGV4U2hhZGVyID0gdGhpcy5jb25jYXRWZXJ0ZXhTaGFkZXIoKTtcclxuICB0aGlzLmZyYWdtZW50U2hhZGVyID0gU2hhZGVyTGliWydkaXN0YW5jZVJHQkEnXS5mcmFnbWVudFNoYWRlcjtcclxufVxyXG5EaXN0YW5jZUFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoQmFzZUFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZSk7XHJcbkRpc3RhbmNlQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gRGlzdGFuY2VBbmltYXRpb25NYXRlcmlhbDtcclxuXHJcbkRpc3RhbmNlQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlLmNvbmNhdFZlcnRleFNoYWRlciA9IGZ1bmN0aW9uICgpIHtcclxuICByZXR1cm4gYFxyXG4gICNkZWZpbmUgRElTVEFOQ0VcclxuXHJcbiAgdmFyeWluZyB2ZWMzIHZXb3JsZFBvc2l0aW9uO1xyXG4gIFxyXG4gICNpbmNsdWRlIDxjb21tb24+XHJcbiAgI2luY2x1ZGUgPHV2X3BhcnNfdmVydGV4PlxyXG4gICNpbmNsdWRlIDxkaXNwbGFjZW1lbnRtYXBfcGFyc192ZXJ0ZXg+XHJcbiAgI2luY2x1ZGUgPG1vcnBodGFyZ2V0X3BhcnNfdmVydGV4PlxyXG4gICNpbmNsdWRlIDxza2lubmluZ19wYXJzX3ZlcnRleD5cclxuICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX3BhcnNfdmVydGV4PlxyXG4gIFxyXG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UGFyYW1ldGVycycpfVxyXG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4RnVuY3Rpb25zJyl9XHJcbiAgXHJcbiAgdm9pZCBtYWluKCkge1xyXG5cclxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4SW5pdCcpfVxyXG4gIFxyXG4gICAgI2luY2x1ZGUgPHV2X3ZlcnRleD5cclxuICBcclxuICAgICNpbmNsdWRlIDxza2luYmFzZV92ZXJ0ZXg+XHJcbiAgXHJcbiAgICAjaWZkZWYgVVNFX0RJU1BMQUNFTUVOVE1BUFxyXG4gIFxyXG4gICAgICAjaW5jbHVkZSA8YmVnaW5ub3JtYWxfdmVydGV4PlxyXG4gICAgICAjaW5jbHVkZSA8bW9ycGhub3JtYWxfdmVydGV4PlxyXG4gICAgICAjaW5jbHVkZSA8c2tpbm5vcm1hbF92ZXJ0ZXg+XHJcbiAgXHJcbiAgICAjZW5kaWZcclxuICBcclxuICAgICNpbmNsdWRlIDxiZWdpbl92ZXJ0ZXg+XHJcbiAgICBcclxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UG9zaXRpb24nKX1cclxuXHJcbiAgICAjaW5jbHVkZSA8bW9ycGh0YXJnZXRfdmVydGV4PlxyXG4gICAgXHJcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBvc3RNb3JwaCcpfVxyXG4gICAgXHJcbiAgICAjaW5jbHVkZSA8c2tpbm5pbmdfdmVydGV4PlxyXG5cclxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UG9zdFNraW5uaW5nJyl9XHJcbiAgICBcclxuICAgICNpbmNsdWRlIDxkaXNwbGFjZW1lbnRtYXBfdmVydGV4PlxyXG4gICAgI2luY2x1ZGUgPHByb2plY3RfdmVydGV4PlxyXG4gICAgI2luY2x1ZGUgPHdvcmxkcG9zX3ZlcnRleD5cclxuICAgICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfdmVydGV4PlxyXG4gIFxyXG4gICAgdldvcmxkUG9zaXRpb24gPSB3b3JsZFBvc2l0aW9uLnh5ejtcclxuICBcclxuICB9YDtcclxufTtcclxuXHJcbmV4cG9ydCB7IERpc3RhbmNlQW5pbWF0aW9uTWF0ZXJpYWwgfTtcclxuIiwiaW1wb3J0IHsgQnVmZmVyR2VvbWV0cnksIEJ1ZmZlckF0dHJpYnV0ZSwgVmVjdG9yMiB9IGZyb20gJ3RocmVlJztcclxuLyoqXHJcbiAqIEEgQnVmZmVyR2VvbWV0cnkgd2hlcmUgYSAncHJlZmFiJyBnZW9tZXRyeSBpcyByZXBlYXRlZCBhIG51bWJlciBvZiB0aW1lcy5cclxuICpcclxuICogQHBhcmFtIHtHZW9tZXRyeXxCdWZmZXJHZW9tZXRyeX0gcHJlZmFiIFRoZSBHZW9tZXRyeSBpbnN0YW5jZSB0byByZXBlYXQuXHJcbiAqIEBwYXJhbSB7TnVtYmVyfSBjb3VudCBUaGUgbnVtYmVyIG9mIHRpbWVzIHRvIHJlcGVhdCB0aGUgZ2VvbWV0cnkuXHJcbiAqIEBjb25zdHJ1Y3RvclxyXG4gKi9cclxuZnVuY3Rpb24gUHJlZmFiQnVmZmVyR2VvbWV0cnkocHJlZmFiLCBjb3VudCkge1xyXG4gIEJ1ZmZlckdlb21ldHJ5LmNhbGwodGhpcyk7XHJcbiAgXHJcbiAgLyoqXHJcbiAgICogQSByZWZlcmVuY2UgdG8gdGhlIHByZWZhYiBnZW9tZXRyeSB1c2VkIHRvIGNyZWF0ZSB0aGlzIGluc3RhbmNlLlxyXG4gICAqIEB0eXBlIHtHZW9tZXRyeXxCdWZmZXJHZW9tZXRyeX1cclxuICAgKi9cclxuICB0aGlzLnByZWZhYkdlb21ldHJ5ID0gcHJlZmFiO1xyXG4gIHRoaXMuaXNQcmVmYWJCdWZmZXJHZW9tZXRyeSA9IHByZWZhYi5pc0J1ZmZlckdlb21ldHJ5O1xyXG4gIFxyXG4gIC8qKlxyXG4gICAqIE51bWJlciBvZiBwcmVmYWJzLlxyXG4gICAqIEB0eXBlIHtOdW1iZXJ9XHJcbiAgICovXHJcbiAgdGhpcy5wcmVmYWJDb3VudCA9IGNvdW50O1xyXG4gIFxyXG4gIC8qKlxyXG4gICAqIE51bWJlciBvZiB2ZXJ0aWNlcyBvZiB0aGUgcHJlZmFiLlxyXG4gICAqIEB0eXBlIHtOdW1iZXJ9XHJcbiAgICovXHJcbiAgaWYgKHRoaXMuaXNQcmVmYWJCdWZmZXJHZW9tZXRyeSkge1xyXG4gICAgdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudCA9IHByZWZhYi5hdHRyaWJ1dGVzLnBvc2l0aW9uLmNvdW50O1xyXG4gIH1cclxuICBlbHNlIHtcclxuICAgIHRoaXMucHJlZmFiVmVydGV4Q291bnQgPSBwcmVmYWIudmVydGljZXMubGVuZ3RoO1xyXG4gIH1cclxuXHJcbiAgdGhpcy5idWZmZXJJbmRpY2VzKCk7XHJcbiAgdGhpcy5idWZmZXJQb3NpdGlvbnMoKTtcclxufVxyXG5QcmVmYWJCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZSk7XHJcblByZWZhYkJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFByZWZhYkJ1ZmZlckdlb21ldHJ5O1xyXG5cclxuUHJlZmFiQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmJ1ZmZlckluZGljZXMgPSBmdW5jdGlvbigpIHtcclxuICBsZXQgcHJlZmFiSW5kaWNlcyA9IFtdO1xyXG4gIGxldCBwcmVmYWJJbmRleENvdW50O1xyXG5cclxuICBpZiAodGhpcy5pc1ByZWZhYkJ1ZmZlckdlb21ldHJ5KSB7XHJcbiAgICBpZiAodGhpcy5wcmVmYWJHZW9tZXRyeS5pbmRleCkge1xyXG4gICAgICBwcmVmYWJJbmRleENvdW50ID0gdGhpcy5wcmVmYWJHZW9tZXRyeS5pbmRleC5jb3VudDtcclxuICAgICAgcHJlZmFiSW5kaWNlcyA9IHRoaXMucHJlZmFiR2VvbWV0cnkuaW5kZXguYXJyYXk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgcHJlZmFiSW5kZXhDb3VudCA9IHRoaXMucHJlZmFiVmVydGV4Q291bnQ7XHJcblxyXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHByZWZhYkluZGV4Q291bnQ7IGkrKykge1xyXG4gICAgICAgIHByZWZhYkluZGljZXMucHVzaChpKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuICBlbHNlIHtcclxuICAgIGNvbnN0IHByZWZhYkZhY2VDb3VudCA9IHRoaXMucHJlZmFiR2VvbWV0cnkuZmFjZXMubGVuZ3RoO1xyXG4gICAgcHJlZmFiSW5kZXhDb3VudCA9IHByZWZhYkZhY2VDb3VudCAqIDM7XHJcblxyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcmVmYWJGYWNlQ291bnQ7IGkrKykge1xyXG4gICAgICBjb25zdCBmYWNlID0gdGhpcy5wcmVmYWJHZW9tZXRyeS5mYWNlc1tpXTtcclxuICAgICAgcHJlZmFiSW5kaWNlcy5wdXNoKGZhY2UuYSwgZmFjZS5iLCBmYWNlLmMpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgY29uc3QgaW5kZXhCdWZmZXIgPSBuZXcgVWludDMyQXJyYXkodGhpcy5wcmVmYWJDb3VudCAqIHByZWZhYkluZGV4Q291bnQpO1xyXG5cclxuICB0aGlzLnNldEluZGV4KG5ldyBCdWZmZXJBdHRyaWJ1dGUoaW5kZXhCdWZmZXIsIDEpKTtcclxuICBcclxuICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucHJlZmFiQ291bnQ7IGkrKykge1xyXG4gICAgZm9yIChsZXQgayA9IDA7IGsgPCBwcmVmYWJJbmRleENvdW50OyBrKyspIHtcclxuICAgICAgaW5kZXhCdWZmZXJbaSAqIHByZWZhYkluZGV4Q291bnQgKyBrXSA9IHByZWZhYkluZGljZXNba10gKyBpICogdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudDtcclxuICAgIH1cclxuICB9XHJcbn07XHJcblxyXG5QcmVmYWJCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuYnVmZmVyUG9zaXRpb25zID0gZnVuY3Rpb24oKSB7XHJcbiAgY29uc3QgcG9zaXRpb25CdWZmZXIgPSB0aGlzLmNyZWF0ZUF0dHJpYnV0ZSgncG9zaXRpb24nLCAzKS5hcnJheTtcclxuXHJcbiAgaWYgKHRoaXMuaXNQcmVmYWJCdWZmZXJHZW9tZXRyeSkge1xyXG4gICAgY29uc3QgcG9zaXRpb25zID0gdGhpcy5wcmVmYWJHZW9tZXRyeS5hdHRyaWJ1dGVzLnBvc2l0aW9uLmFycmF5O1xyXG5cclxuICAgIGZvciAobGV0IGkgPSAwLCBvZmZzZXQgPSAwOyBpIDwgdGhpcy5wcmVmYWJDb3VudDsgaSsrKSB7XHJcbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudDsgaisrLCBvZmZzZXQgKz0gMykge1xyXG4gICAgICAgIHBvc2l0aW9uQnVmZmVyW29mZnNldCAgICBdID0gcG9zaXRpb25zW2ogKiAzXTtcclxuICAgICAgICBwb3NpdGlvbkJ1ZmZlcltvZmZzZXQgKyAxXSA9IHBvc2l0aW9uc1tqICogMyArIDFdO1xyXG4gICAgICAgIHBvc2l0aW9uQnVmZmVyW29mZnNldCArIDJdID0gcG9zaXRpb25zW2ogKiAzICsgMl07XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcbiAgZWxzZSB7XHJcbiAgICBmb3IgKGxldCBpID0gMCwgb2Zmc2V0ID0gMDsgaSA8IHRoaXMucHJlZmFiQ291bnQ7IGkrKykge1xyXG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHRoaXMucHJlZmFiVmVydGV4Q291bnQ7IGorKywgb2Zmc2V0ICs9IDMpIHtcclxuICAgICAgICBjb25zdCBwcmVmYWJWZXJ0ZXggPSB0aGlzLnByZWZhYkdlb21ldHJ5LnZlcnRpY2VzW2pdO1xyXG5cclxuICAgICAgICBwb3NpdGlvbkJ1ZmZlcltvZmZzZXQgICAgXSA9IHByZWZhYlZlcnRleC54O1xyXG4gICAgICAgIHBvc2l0aW9uQnVmZmVyW29mZnNldCArIDFdID0gcHJlZmFiVmVydGV4Lnk7XHJcbiAgICAgICAgcG9zaXRpb25CdWZmZXJbb2Zmc2V0ICsgMl0gPSBwcmVmYWJWZXJ0ZXguejtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIGEgQnVmZmVyQXR0cmlidXRlIHdpdGggVVYgY29vcmRpbmF0ZXMuXHJcbiAqL1xyXG5QcmVmYWJCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuYnVmZmVyVXZzID0gZnVuY3Rpb24oKSB7XHJcbiAgY29uc3QgcHJlZmFiVXZzID0gW107XHJcblxyXG4gIGlmICh0aGlzLmlzUHJlZmFiQnVmZmVyR2VvbWV0cnkpIHtcclxuICAgIGNvbnN0IHV2ID0gdGhpcy5wcmVmYWJHZW9tZXRyeS5hdHRyaWJ1dGVzLnV2LmFycmF5O1xyXG5cclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudDsgaSsrKSB7XHJcbiAgICAgIHByZWZhYlV2cy5wdXNoKG5ldyBWZWN0b3IyKHV2W2kgKiAyXSwgdXZbaSAqIDIgKyAxXSkpO1xyXG4gICAgfVxyXG4gIH1cclxuICBlbHNlIHtcclxuICAgIGNvbnN0IHByZWZhYkZhY2VDb3VudCA9IHRoaXMucHJlZmFiR2VvbWV0cnkuZmFjZXMubGVuZ3RoO1xyXG5cclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHJlZmFiRmFjZUNvdW50OyBpKyspIHtcclxuICAgICAgY29uc3QgZmFjZSA9IHRoaXMucHJlZmFiR2VvbWV0cnkuZmFjZXNbaV07XHJcbiAgICAgIGNvbnN0IHV2ID0gdGhpcy5wcmVmYWJHZW9tZXRyeS5mYWNlVmVydGV4VXZzWzBdW2ldO1xyXG5cclxuICAgICAgcHJlZmFiVXZzW2ZhY2UuYV0gPSB1dlswXTtcclxuICAgICAgcHJlZmFiVXZzW2ZhY2UuYl0gPSB1dlsxXTtcclxuICAgICAgcHJlZmFiVXZzW2ZhY2UuY10gPSB1dlsyXTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGNvbnN0IHV2QnVmZmVyID0gdGhpcy5jcmVhdGVBdHRyaWJ1dGUoJ3V2JywgMik7XHJcbiAgXHJcbiAgZm9yIChsZXQgaSA9IDAsIG9mZnNldCA9IDA7IGkgPCB0aGlzLnByZWZhYkNvdW50OyBpKyspIHtcclxuICAgIGZvciAobGV0IGogPSAwOyBqIDwgdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudDsgaisrLCBvZmZzZXQgKz0gMikge1xyXG4gICAgICBsZXQgcHJlZmFiVXYgPSBwcmVmYWJVdnNbal07XHJcbiAgICAgIFxyXG4gICAgICB1dkJ1ZmZlci5hcnJheVtvZmZzZXRdID0gcHJlZmFiVXYueDtcclxuICAgICAgdXZCdWZmZXIuYXJyYXlbb2Zmc2V0ICsgMV0gPSBwcmVmYWJVdi55O1xyXG4gICAgfVxyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIGEgQnVmZmVyQXR0cmlidXRlIG9uIHRoaXMgZ2VvbWV0cnkgaW5zdGFuY2UuXHJcbiAqXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIE5hbWUgb2YgdGhlIGF0dHJpYnV0ZS5cclxuICogQHBhcmFtIHtOdW1iZXJ9IGl0ZW1TaXplIE51bWJlciBvZiBmbG9hdHMgcGVyIHZlcnRleCAodHlwaWNhbGx5IDEsIDIsIDMgb3IgNCkuXHJcbiAqIEBwYXJhbSB7ZnVuY3Rpb249fSBmYWN0b3J5IEZ1bmN0aW9uIHRoYXQgd2lsbCBiZSBjYWxsZWQgZm9yIGVhY2ggcHJlZmFiIHVwb24gY3JlYXRpb24uIEFjY2VwdHMgMyBhcmd1bWVudHM6IGRhdGFbXSwgaW5kZXggYW5kIHByZWZhYkNvdW50LiBDYWxscyBzZXRQcmVmYWJEYXRhLlxyXG4gKlxyXG4gKiBAcmV0dXJucyB7QnVmZmVyQXR0cmlidXRlfVxyXG4gKi9cclxuUHJlZmFiQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmNyZWF0ZUF0dHJpYnV0ZSA9IGZ1bmN0aW9uKG5hbWUsIGl0ZW1TaXplLCBmYWN0b3J5KSB7XHJcbiAgY29uc3QgYnVmZmVyID0gbmV3IEZsb2F0MzJBcnJheSh0aGlzLnByZWZhYkNvdW50ICogdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudCAqIGl0ZW1TaXplKTtcclxuICBjb25zdCBhdHRyaWJ1dGUgPSBuZXcgQnVmZmVyQXR0cmlidXRlKGJ1ZmZlciwgaXRlbVNpemUpO1xyXG4gIFxyXG4gIHRoaXMuYWRkQXR0cmlidXRlKG5hbWUsIGF0dHJpYnV0ZSk7XHJcbiAgXHJcbiAgaWYgKGZhY3RvcnkpIHtcclxuICAgIGNvbnN0IGRhdGEgPSBbXTtcclxuICAgIFxyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnByZWZhYkNvdW50OyBpKyspIHtcclxuICAgICAgZmFjdG9yeShkYXRhLCBpLCB0aGlzLnByZWZhYkNvdW50KTtcclxuICAgICAgdGhpcy5zZXRQcmVmYWJEYXRhKGF0dHJpYnV0ZSwgaSwgZGF0YSk7XHJcbiAgICB9XHJcbiAgfVxyXG4gIFxyXG4gIHJldHVybiBhdHRyaWJ1dGU7XHJcbn07XHJcblxyXG4vKipcclxuICogU2V0cyBkYXRhIGZvciBhbGwgdmVydGljZXMgb2YgYSBwcmVmYWIgYXQgYSBnaXZlbiBpbmRleC5cclxuICogVXN1YWxseSBjYWxsZWQgaW4gYSBsb29wLlxyXG4gKlxyXG4gKiBAcGFyYW0ge1N0cmluZ3xCdWZmZXJBdHRyaWJ1dGV9IGF0dHJpYnV0ZSBUaGUgYXR0cmlidXRlIG9yIGF0dHJpYnV0ZSBuYW1lIHdoZXJlIHRoZSBkYXRhIGlzIHRvIGJlIHN0b3JlZC5cclxuICogQHBhcmFtIHtOdW1iZXJ9IHByZWZhYkluZGV4IEluZGV4IG9mIHRoZSBwcmVmYWIgaW4gdGhlIGJ1ZmZlciBnZW9tZXRyeS5cclxuICogQHBhcmFtIHtBcnJheX0gZGF0YSBBcnJheSBvZiBkYXRhLiBMZW5ndGggc2hvdWxkIGJlIGVxdWFsIHRvIGl0ZW0gc2l6ZSBvZiB0aGUgYXR0cmlidXRlLlxyXG4gKi9cclxuUHJlZmFiQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLnNldFByZWZhYkRhdGEgPSBmdW5jdGlvbihhdHRyaWJ1dGUsIHByZWZhYkluZGV4LCBkYXRhKSB7XHJcbiAgYXR0cmlidXRlID0gKHR5cGVvZiBhdHRyaWJ1dGUgPT09ICdzdHJpbmcnKSA/IHRoaXMuYXR0cmlidXRlc1thdHRyaWJ1dGVdIDogYXR0cmlidXRlO1xyXG4gIFxyXG4gIGxldCBvZmZzZXQgPSBwcmVmYWJJbmRleCAqIHRoaXMucHJlZmFiVmVydGV4Q291bnQgKiBhdHRyaWJ1dGUuaXRlbVNpemU7XHJcbiAgXHJcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnByZWZhYlZlcnRleENvdW50OyBpKyspIHtcclxuICAgIGZvciAobGV0IGogPSAwOyBqIDwgYXR0cmlidXRlLml0ZW1TaXplOyBqKyspIHtcclxuICAgICAgYXR0cmlidXRlLmFycmF5W29mZnNldCsrXSA9IGRhdGFbal07XHJcbiAgICB9XHJcbiAgfVxyXG59O1xyXG5cclxuZXhwb3J0IHsgUHJlZmFiQnVmZmVyR2VvbWV0cnkgfTtcclxuIiwiaW1wb3J0IHsgQnVmZmVyR2VvbWV0cnksIEJ1ZmZlckF0dHJpYnV0ZSB9IGZyb20gJ3RocmVlJztcclxuLyoqXHJcbiAqIEEgQnVmZmVyR2VvbWV0cnkgd2hlcmUgYSAncHJlZmFiJyBnZW9tZXRyeSBhcnJheSBpcyByZXBlYXRlZCBhIG51bWJlciBvZiB0aW1lcy5cclxuICpcclxuICogQHBhcmFtIHtBcnJheX0gcHJlZmFicyBBbiBhcnJheSB3aXRoIEdlb21ldHJ5IGluc3RhbmNlcyB0byByZXBlYXQuXHJcbiAqIEBwYXJhbSB7TnVtYmVyfSByZXBlYXRDb3VudCBUaGUgbnVtYmVyIG9mIHRpbWVzIHRvIHJlcGVhdCB0aGUgYXJyYXkgb2YgR2VvbWV0cmllcy5cclxuICogQGNvbnN0cnVjdG9yXHJcbiAqL1xyXG5mdW5jdGlvbiBNdWx0aVByZWZhYkJ1ZmZlckdlb21ldHJ5KHByZWZhYnMsIHJlcGVhdENvdW50KSB7XHJcbiAgQnVmZmVyR2VvbWV0cnkuY2FsbCh0aGlzKTtcclxuXHJcbiAgaWYgKEFycmF5LmlzQXJyYXkocHJlZmFicykpIHtcclxuICAgIHRoaXMucHJlZmFiR2VvbWV0cmllcyA9IHByZWZhYnM7XHJcbiAgfSBlbHNlIHtcclxuICAgIHRoaXMucHJlZmFiR2VvbWV0cmllcyA9IFtwcmVmYWJzXTtcclxuICB9XHJcblxyXG4gIHRoaXMucHJlZmFiR2VvbWV0cmllc0NvdW50ID0gdGhpcy5wcmVmYWJHZW9tZXRyaWVzLmxlbmd0aDtcclxuXHJcbiAgLyoqXHJcbiAgICogTnVtYmVyIG9mIHByZWZhYnMuXHJcbiAgICogQHR5cGUge051bWJlcn1cclxuICAgKi9cclxuICB0aGlzLnByZWZhYkNvdW50ID0gcmVwZWF0Q291bnQgKiB0aGlzLnByZWZhYkdlb21ldHJpZXNDb3VudDtcclxuICAvKipcclxuICAgKiBIb3cgb2Z0ZW4gdGhlIHByZWZhYiBhcnJheSBpcyByZXBlYXRlZC5cclxuICAgKiBAdHlwZSB7TnVtYmVyfVxyXG4gICAqL1xyXG4gIHRoaXMucmVwZWF0Q291bnQgPSByZXBlYXRDb3VudDtcclxuICBcclxuICAvKipcclxuICAgKiBBcnJheSBvZiB2ZXJ0ZXggY291bnRzIHBlciBwcmVmYWIuXHJcbiAgICogQHR5cGUge0FycmF5fVxyXG4gICAqL1xyXG4gIHRoaXMucHJlZmFiVmVydGV4Q291bnRzID0gdGhpcy5wcmVmYWJHZW9tZXRyaWVzLm1hcChwID0+IHAuaXNCdWZmZXJHZW9tZXRyeSA/IHAuYXR0cmlidXRlcy5wb3NpdGlvbi5jb3VudCA6IHAudmVydGljZXMubGVuZ3RoKTtcclxuICAvKipcclxuICAgKiBUb3RhbCBudW1iZXIgb2YgdmVydGljZXMgZm9yIG9uZSByZXBldGl0aW9uIG9mIHRoZSBwcmVmYWJzXHJcbiAgICogQHR5cGUge251bWJlcn1cclxuICAgKi9cclxuICB0aGlzLnJlcGVhdFZlcnRleENvdW50ID0gdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudHMucmVkdWNlKChyLCB2KSA9PiByICsgdiwgMCk7XHJcblxyXG4gIHRoaXMuYnVmZmVySW5kaWNlcygpO1xyXG4gIHRoaXMuYnVmZmVyUG9zaXRpb25zKCk7XHJcbn1cclxuTXVsdGlQcmVmYWJCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZSk7XHJcbk11bHRpUHJlZmFiQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gTXVsdGlQcmVmYWJCdWZmZXJHZW9tZXRyeTtcclxuXHJcbk11bHRpUHJlZmFiQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmJ1ZmZlckluZGljZXMgPSBmdW5jdGlvbigpIHtcclxuICBsZXQgcmVwZWF0SW5kZXhDb3VudCA9IDA7XHJcblxyXG4gIHRoaXMucHJlZmFiSW5kaWNlcyA9IHRoaXMucHJlZmFiR2VvbWV0cmllcy5tYXAoZ2VvbWV0cnkgPT4ge1xyXG4gICAgbGV0IGluZGljZXMgPSBbXTtcclxuXHJcbiAgICBpZiAoZ2VvbWV0cnkuaXNCdWZmZXJHZW9tZXRyeSkge1xyXG4gICAgICBpZiAoZ2VvbWV0cnkuaW5kZXgpIHtcclxuICAgICAgICBpbmRpY2VzID0gZ2VvbWV0cnkuaW5kZXguYXJyYXk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBnZW9tZXRyeS5hdHRyaWJ1dGVzLnBvc2l0aW9uLmNvdW50OyBpKyspIHtcclxuICAgICAgICAgIGluZGljZXMucHVzaChpKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZ2VvbWV0cnkuZmFjZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICBjb25zdCBmYWNlID0gZ2VvbWV0cnkuZmFjZXNbaV07XHJcbiAgICAgICAgaW5kaWNlcy5wdXNoKGZhY2UuYSwgZmFjZS5iLCBmYWNlLmMpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmVwZWF0SW5kZXhDb3VudCArPSBpbmRpY2VzLmxlbmd0aDtcclxuXHJcbiAgICByZXR1cm4gaW5kaWNlcztcclxuICB9KTtcclxuXHJcbiAgY29uc3QgaW5kZXhCdWZmZXIgPSBuZXcgVWludDMyQXJyYXkocmVwZWF0SW5kZXhDb3VudCAqIHRoaXMucmVwZWF0Q291bnQpO1xyXG4gIGxldCBpbmRleE9mZnNldCA9IDA7XHJcbiAgbGV0IHByZWZhYk9mZnNldCA9IDA7XHJcblxyXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5wcmVmYWJDb3VudDsgaSsrKSB7XHJcbiAgICBjb25zdCBpbmRleCA9IGkgJSB0aGlzLnByZWZhYkdlb21ldHJpZXNDb3VudDtcclxuICAgIGNvbnN0IGluZGljZXMgPSB0aGlzLnByZWZhYkluZGljZXNbaW5kZXhdO1xyXG4gICAgY29uc3QgdmVydGV4Q291bnQgPSB0aGlzLnByZWZhYlZlcnRleENvdW50c1tpbmRleF07XHJcblxyXG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCBpbmRpY2VzLmxlbmd0aDsgaisrKSB7XHJcbiAgICAgIGluZGV4QnVmZmVyW2luZGV4T2Zmc2V0KytdID0gaW5kaWNlc1tqXSArIHByZWZhYk9mZnNldDtcclxuICAgIH1cclxuXHJcbiAgICBwcmVmYWJPZmZzZXQgKz0gdmVydGV4Q291bnQ7XHJcbiAgfVxyXG5cclxuICB0aGlzLnNldEluZGV4KG5ldyBCdWZmZXJBdHRyaWJ1dGUoaW5kZXhCdWZmZXIsIDEpKTtcclxufTtcclxuXHJcbk11bHRpUHJlZmFiQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmJ1ZmZlclBvc2l0aW9ucyA9IGZ1bmN0aW9uKCkge1xyXG4gIGNvbnN0IHBvc2l0aW9uQnVmZmVyID0gdGhpcy5jcmVhdGVBdHRyaWJ1dGUoJ3Bvc2l0aW9uJywgMykuYXJyYXk7XHJcblxyXG4gIGNvbnN0IHByZWZhYlBvc2l0aW9ucyA9IHRoaXMucHJlZmFiR2VvbWV0cmllcy5tYXAoKGdlb21ldHJ5LCBpKSA9PiB7XHJcbiAgICBsZXQgcG9zaXRpb25zO1xyXG5cclxuICAgIGlmIChnZW9tZXRyeS5pc0J1ZmZlckdlb21ldHJ5KSB7XHJcbiAgICAgIHBvc2l0aW9ucyA9IGdlb21ldHJ5LmF0dHJpYnV0ZXMucG9zaXRpb24uYXJyYXk7XHJcbiAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgY29uc3QgdmVydGV4Q291bnQgPSB0aGlzLnByZWZhYlZlcnRleENvdW50c1tpXTtcclxuXHJcbiAgICAgIHBvc2l0aW9ucyA9IFtdO1xyXG5cclxuICAgICAgZm9yIChsZXQgaiA9IDAsIG9mZnNldCA9IDA7IGogPCB2ZXJ0ZXhDb3VudDsgaisrKSB7XHJcbiAgICAgICAgY29uc3QgcHJlZmFiVmVydGV4ID0gZ2VvbWV0cnkudmVydGljZXNbal07XHJcblxyXG4gICAgICAgIHBvc2l0aW9uc1tvZmZzZXQrK10gPSBwcmVmYWJWZXJ0ZXgueDtcclxuICAgICAgICBwb3NpdGlvbnNbb2Zmc2V0KytdID0gcHJlZmFiVmVydGV4Lnk7XHJcbiAgICAgICAgcG9zaXRpb25zW29mZnNldCsrXSA9IHByZWZhYlZlcnRleC56O1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHBvc2l0aW9ucztcclxuICB9KTtcclxuXHJcbiAgZm9yIChsZXQgaSA9IDAsIG9mZnNldCA9IDA7IGkgPCB0aGlzLnByZWZhYkNvdW50OyBpKyspIHtcclxuICAgIGNvbnN0IGluZGV4ID0gaSAlIHRoaXMucHJlZmFiR2VvbWV0cmllcy5sZW5ndGg7XHJcbiAgICBjb25zdCB2ZXJ0ZXhDb3VudCA9IHRoaXMucHJlZmFiVmVydGV4Q291bnRzW2luZGV4XTtcclxuICAgIGNvbnN0IHBvc2l0aW9ucyA9IHByZWZhYlBvc2l0aW9uc1tpbmRleF07XHJcblxyXG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCB2ZXJ0ZXhDb3VudDsgaisrKSB7XHJcbiAgICAgIHBvc2l0aW9uQnVmZmVyW29mZnNldCsrXSA9IHBvc2l0aW9uc1tqICogM107XHJcbiAgICAgIHBvc2l0aW9uQnVmZmVyW29mZnNldCsrXSA9IHBvc2l0aW9uc1tqICogMyArIDFdO1xyXG4gICAgICBwb3NpdGlvbkJ1ZmZlcltvZmZzZXQrK10gPSBwb3NpdGlvbnNbaiAqIDMgKyAyXTtcclxuICAgIH1cclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogQ3JlYXRlcyBhIEJ1ZmZlckF0dHJpYnV0ZSB3aXRoIFVWIGNvb3JkaW5hdGVzLlxyXG4gKi9cclxuTXVsdGlQcmVmYWJCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuYnVmZmVyVXZzID0gZnVuY3Rpb24oKSB7XHJcbiAgY29uc3QgdXZCdWZmZXIgPSB0aGlzLmNyZWF0ZUF0dHJpYnV0ZSgndXYnLCAyKS5hcnJheTtcclxuXHJcbiAgY29uc3QgcHJlZmFiVXZzID0gdGhpcy5wcmVmYWJHZW9tZXRyaWVzLm1hcCgoZ2VvbWV0cnksIGkpID0+IHtcclxuICAgIGxldCB1dnM7XHJcblxyXG4gICAgaWYgKGdlb21ldHJ5LmlzQnVmZmVyR2VvbWV0cnkpIHtcclxuICAgICAgaWYgKCFnZW9tZXRyeS5hdHRyaWJ1dGVzLnV2KSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcignTm8gVVYgZm91bmQgaW4gcHJlZmFiIGdlb21ldHJ5JywgZ2VvbWV0cnkpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB1dnMgPSBnZW9tZXRyeS5hdHRyaWJ1dGVzLnV2LmFycmF5O1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgY29uc3QgcHJlZmFiRmFjZUNvdW50ID0gdGhpcy5wcmVmYWJJbmRpY2VzW2ldLmxlbmd0aCAvIDM7XHJcbiAgICAgIGNvbnN0IHV2T2JqZWN0cyA9IFtdO1xyXG5cclxuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBwcmVmYWJGYWNlQ291bnQ7IGorKykge1xyXG4gICAgICAgIGNvbnN0IGZhY2UgPSBnZW9tZXRyeS5mYWNlc1tqXTtcclxuICAgICAgICBjb25zdCB1diA9IGdlb21ldHJ5LmZhY2VWZXJ0ZXhVdnNbMF1bal07XHJcblxyXG4gICAgICAgIHV2T2JqZWN0c1tmYWNlLmFdID0gdXZbMF07XHJcbiAgICAgICAgdXZPYmplY3RzW2ZhY2UuYl0gPSB1dlsxXTtcclxuICAgICAgICB1dk9iamVjdHNbZmFjZS5jXSA9IHV2WzJdO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB1dnMgPSBbXTtcclxuXHJcbiAgICAgIGZvciAobGV0IGsgPSAwOyBrIDwgdXZPYmplY3RzLmxlbmd0aDsgaysrKSB7XHJcbiAgICAgICAgdXZzW2sgKiAyXSA9IHV2T2JqZWN0c1trXS54O1xyXG4gICAgICAgIHV2c1trICogMiArIDFdID0gdXZPYmplY3RzW2tdLnk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdXZzO1xyXG4gIH0pO1xyXG5cclxuICBmb3IgKGxldCBpID0gMCwgb2Zmc2V0ID0gMDsgaSA8IHRoaXMucHJlZmFiQ291bnQ7IGkrKykge1xyXG5cclxuICAgIGNvbnN0IGluZGV4ID0gaSAlIHRoaXMucHJlZmFiR2VvbWV0cmllcy5sZW5ndGg7XHJcbiAgICBjb25zdCB2ZXJ0ZXhDb3VudCA9IHRoaXMucHJlZmFiVmVydGV4Q291bnRzW2luZGV4XTtcclxuICAgIGNvbnN0IHV2cyA9IHByZWZhYlV2c1tpbmRleF07XHJcblxyXG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCB2ZXJ0ZXhDb3VudDsgaisrKSB7XHJcbiAgICAgIHV2QnVmZmVyW29mZnNldCsrXSA9IHV2c1tqICogMl07XHJcbiAgICAgIHV2QnVmZmVyW29mZnNldCsrXSA9IHV2c1tqICogMiArIDFdO1xyXG4gICAgfVxyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIGEgQnVmZmVyQXR0cmlidXRlIG9uIHRoaXMgZ2VvbWV0cnkgaW5zdGFuY2UuXHJcbiAqXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIE5hbWUgb2YgdGhlIGF0dHJpYnV0ZS5cclxuICogQHBhcmFtIHtOdW1iZXJ9IGl0ZW1TaXplIE51bWJlciBvZiBmbG9hdHMgcGVyIHZlcnRleCAodHlwaWNhbGx5IDEsIDIsIDMgb3IgNCkuXHJcbiAqIEBwYXJhbSB7ZnVuY3Rpb249fSBmYWN0b3J5IEZ1bmN0aW9uIHRoYXQgd2lsbCBiZSBjYWxsZWQgZm9yIGVhY2ggcHJlZmFiIHVwb24gY3JlYXRpb24uIEFjY2VwdHMgMyBhcmd1bWVudHM6IGRhdGFbXSwgaW5kZXggYW5kIHByZWZhYkNvdW50LiBDYWxscyBzZXRQcmVmYWJEYXRhLlxyXG4gKlxyXG4gKiBAcmV0dXJucyB7QnVmZmVyQXR0cmlidXRlfVxyXG4gKi9cclxuTXVsdGlQcmVmYWJCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuY3JlYXRlQXR0cmlidXRlID0gZnVuY3Rpb24obmFtZSwgaXRlbVNpemUsIGZhY3RvcnkpIHtcclxuICBjb25zdCBidWZmZXIgPSBuZXcgRmxvYXQzMkFycmF5KHRoaXMucmVwZWF0Q291bnQgKiB0aGlzLnJlcGVhdFZlcnRleENvdW50ICogaXRlbVNpemUpO1xyXG4gIGNvbnN0IGF0dHJpYnV0ZSA9IG5ldyBCdWZmZXJBdHRyaWJ1dGUoYnVmZmVyLCBpdGVtU2l6ZSk7XHJcbiAgXHJcbiAgdGhpcy5hZGRBdHRyaWJ1dGUobmFtZSwgYXR0cmlidXRlKTtcclxuICBcclxuICBpZiAoZmFjdG9yeSkge1xyXG4gICAgY29uc3QgZGF0YSA9IFtdO1xyXG4gICAgXHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucHJlZmFiQ291bnQ7IGkrKykge1xyXG4gICAgICBmYWN0b3J5KGRhdGEsIGksIHRoaXMucHJlZmFiQ291bnQpO1xyXG4gICAgICB0aGlzLnNldFByZWZhYkRhdGEoYXR0cmlidXRlLCBpLCBkYXRhKTtcclxuICAgIH1cclxuICB9XHJcbiAgXHJcbiAgcmV0dXJuIGF0dHJpYnV0ZTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBTZXRzIGRhdGEgZm9yIGFsbCB2ZXJ0aWNlcyBvZiBhIHByZWZhYiBhdCBhIGdpdmVuIGluZGV4LlxyXG4gKiBVc3VhbGx5IGNhbGxlZCBpbiBhIGxvb3AuXHJcbiAqXHJcbiAqIEBwYXJhbSB7U3RyaW5nfEJ1ZmZlckF0dHJpYnV0ZX0gYXR0cmlidXRlIFRoZSBhdHRyaWJ1dGUgb3IgYXR0cmlidXRlIG5hbWUgd2hlcmUgdGhlIGRhdGEgaXMgdG8gYmUgc3RvcmVkLlxyXG4gKiBAcGFyYW0ge051bWJlcn0gcHJlZmFiSW5kZXggSW5kZXggb2YgdGhlIHByZWZhYiBpbiB0aGUgYnVmZmVyIGdlb21ldHJ5LlxyXG4gKiBAcGFyYW0ge0FycmF5fSBkYXRhIEFycmF5IG9mIGRhdGEuIExlbmd0aCBzaG91bGQgYmUgZXF1YWwgdG8gaXRlbSBzaXplIG9mIHRoZSBhdHRyaWJ1dGUuXHJcbiAqL1xyXG5NdWx0aVByZWZhYkJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5zZXRQcmVmYWJEYXRhID0gZnVuY3Rpb24oYXR0cmlidXRlLCBwcmVmYWJJbmRleCwgZGF0YSkge1xyXG4gIGF0dHJpYnV0ZSA9ICh0eXBlb2YgYXR0cmlidXRlID09PSAnc3RyaW5nJykgPyB0aGlzLmF0dHJpYnV0ZXNbYXR0cmlidXRlXSA6IGF0dHJpYnV0ZTtcclxuXHJcbiAgY29uc3QgcHJlZmFiR2VvbWV0cnlJbmRleCA9IHByZWZhYkluZGV4ICUgdGhpcy5wcmVmYWJHZW9tZXRyaWVzQ291bnQ7XHJcbiAgY29uc3QgcHJlZmFiR2VvbWV0cnlWZXJ0ZXhDb3VudCA9IHRoaXMucHJlZmFiVmVydGV4Q291bnRzW3ByZWZhYkdlb21ldHJ5SW5kZXhdO1xyXG4gIGNvbnN0IHdob2xlID0gKHByZWZhYkluZGV4IC8gdGhpcy5wcmVmYWJHZW9tZXRyaWVzQ291bnQgfCAwKSAqIHRoaXMucHJlZmFiR2VvbWV0cmllc0NvdW50O1xyXG4gIGNvbnN0IHdob2xlT2Zmc2V0ID0gd2hvbGUgKiB0aGlzLnJlcGVhdFZlcnRleENvdW50O1xyXG4gIGNvbnN0IHBhcnQgPSBwcmVmYWJJbmRleCAtIHdob2xlO1xyXG4gIGxldCBwYXJ0T2Zmc2V0ID0gMDtcclxuICBsZXQgaSA9IDA7XHJcblxyXG4gIHdoaWxlKGkgPCBwYXJ0KSB7XHJcbiAgICBwYXJ0T2Zmc2V0ICs9IHRoaXMucHJlZmFiVmVydGV4Q291bnRzW2krK107XHJcbiAgfVxyXG5cclxuICBsZXQgb2Zmc2V0ID0gKHdob2xlT2Zmc2V0ICsgcGFydE9mZnNldCkgKiBhdHRyaWJ1dGUuaXRlbVNpemU7XHJcblxyXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgcHJlZmFiR2VvbWV0cnlWZXJ0ZXhDb3VudDsgaSsrKSB7XHJcbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IGF0dHJpYnV0ZS5pdGVtU2l6ZTsgaisrKSB7XHJcbiAgICAgIGF0dHJpYnV0ZS5hcnJheVtvZmZzZXQrK10gPSBkYXRhW2pdO1xyXG4gICAgfVxyXG4gIH1cclxufTtcclxuXHJcbmV4cG9ydCB7IE11bHRpUHJlZmFiQnVmZmVyR2VvbWV0cnkgfTtcclxuIiwiaW1wb3J0IHsgTWF0aCBhcyB0TWF0aCwgVmVjdG9yMyB9IGZyb20gJ3RocmVlJztcclxuaW1wb3J0IHsgRGVwdGhBbmltYXRpb25NYXRlcmlhbCB9IGZyb20gJy4vbWF0ZXJpYWxzL0RlcHRoQW5pbWF0aW9uTWF0ZXJpYWwnO1xyXG5pbXBvcnQgeyBEaXN0YW5jZUFuaW1hdGlvbk1hdGVyaWFsIH0gZnJvbSAnLi9tYXRlcmlhbHMvRGlzdGFuY2VBbmltYXRpb25NYXRlcmlhbCc7XHJcblxyXG4vKipcclxuICogQ29sbGVjdGlvbiBvZiB1dGlsaXR5IGZ1bmN0aW9ucy5cclxuICogQG5hbWVzcGFjZVxyXG4gKi9cclxuY29uc3QgVXRpbHMgPSB7XHJcbiAgLyoqXHJcbiAgICogRHVwbGljYXRlcyB2ZXJ0aWNlcyBzbyBlYWNoIGZhY2UgYmVjb21lcyBzZXBhcmF0ZS5cclxuICAgKiBTYW1lIGFzIFRIUkVFLkV4cGxvZGVNb2RpZmllci5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7VEhSRUUuR2VvbWV0cnl9IGdlb21ldHJ5IEdlb21ldHJ5IGluc3RhbmNlIHRvIG1vZGlmeS5cclxuICAgKi9cclxuICBzZXBhcmF0ZUZhY2VzOiBmdW5jdGlvbiAoZ2VvbWV0cnkpIHtcclxuICAgIGxldCB2ZXJ0aWNlcyA9IFtdO1xyXG5cclxuICAgIGZvciAobGV0IGkgPSAwLCBpbCA9IGdlb21ldHJ5LmZhY2VzLmxlbmd0aDsgaSA8IGlsOyBpKyspIHtcclxuICAgICAgbGV0IG4gPSB2ZXJ0aWNlcy5sZW5ndGg7XHJcbiAgICAgIGxldCBmYWNlID0gZ2VvbWV0cnkuZmFjZXNbaV07XHJcblxyXG4gICAgICBsZXQgYSA9IGZhY2UuYTtcclxuICAgICAgbGV0IGIgPSBmYWNlLmI7XHJcbiAgICAgIGxldCBjID0gZmFjZS5jO1xyXG5cclxuICAgICAgbGV0IHZhID0gZ2VvbWV0cnkudmVydGljZXNbYV07XHJcbiAgICAgIGxldCB2YiA9IGdlb21ldHJ5LnZlcnRpY2VzW2JdO1xyXG4gICAgICBsZXQgdmMgPSBnZW9tZXRyeS52ZXJ0aWNlc1tjXTtcclxuXHJcbiAgICAgIHZlcnRpY2VzLnB1c2godmEuY2xvbmUoKSk7XHJcbiAgICAgIHZlcnRpY2VzLnB1c2godmIuY2xvbmUoKSk7XHJcbiAgICAgIHZlcnRpY2VzLnB1c2godmMuY2xvbmUoKSk7XHJcblxyXG4gICAgICBmYWNlLmEgPSBuO1xyXG4gICAgICBmYWNlLmIgPSBuICsgMTtcclxuICAgICAgZmFjZS5jID0gbiArIDI7XHJcbiAgICB9XHJcblxyXG4gICAgZ2VvbWV0cnkudmVydGljZXMgPSB2ZXJ0aWNlcztcclxuICB9LFxyXG5cclxuICAvKipcclxuICAgKiBDb21wdXRlIHRoZSBjZW50cm9pZCAoY2VudGVyKSBvZiBhIFRIUkVFLkZhY2UzLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtUSFJFRS5HZW9tZXRyeX0gZ2VvbWV0cnkgR2VvbWV0cnkgaW5zdGFuY2UgdGhlIGZhY2UgaXMgaW4uXHJcbiAgICogQHBhcmFtIHtUSFJFRS5GYWNlM30gZmFjZSBGYWNlIG9iamVjdCBmcm9tIHRoZSBUSFJFRS5HZW9tZXRyeS5mYWNlcyBhcnJheVxyXG4gICAqIEBwYXJhbSB7VEhSRUUuVmVjdG9yMz19IHYgT3B0aW9uYWwgdmVjdG9yIHRvIHN0b3JlIHJlc3VsdCBpbi5cclxuICAgKiBAcmV0dXJucyB7VEhSRUUuVmVjdG9yM31cclxuICAgKi9cclxuICBjb21wdXRlQ2VudHJvaWQ6IGZ1bmN0aW9uKGdlb21ldHJ5LCBmYWNlLCB2KSB7XHJcbiAgICBsZXQgYSA9IGdlb21ldHJ5LnZlcnRpY2VzW2ZhY2UuYV07XHJcbiAgICBsZXQgYiA9IGdlb21ldHJ5LnZlcnRpY2VzW2ZhY2UuYl07XHJcbiAgICBsZXQgYyA9IGdlb21ldHJ5LnZlcnRpY2VzW2ZhY2UuY107XHJcblxyXG4gICAgdiA9IHYgfHwgbmV3IFZlY3RvcjMoKTtcclxuXHJcbiAgICB2LnggPSAoYS54ICsgYi54ICsgYy54KSAvIDM7XHJcbiAgICB2LnkgPSAoYS55ICsgYi55ICsgYy55KSAvIDM7XHJcbiAgICB2LnogPSAoYS56ICsgYi56ICsgYy56KSAvIDM7XHJcblxyXG4gICAgcmV0dXJuIHY7XHJcbiAgfSxcclxuXHJcbiAgLyoqXHJcbiAgICogR2V0IGEgcmFuZG9tIHZlY3RvciBiZXR3ZWVuIGJveC5taW4gYW5kIGJveC5tYXguXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge1RIUkVFLkJveDN9IGJveCBUSFJFRS5Cb3gzIGluc3RhbmNlLlxyXG4gICAqIEBwYXJhbSB7VEhSRUUuVmVjdG9yMz19IHYgT3B0aW9uYWwgdmVjdG9yIHRvIHN0b3JlIHJlc3VsdCBpbi5cclxuICAgKiBAcmV0dXJucyB7VEhSRUUuVmVjdG9yM31cclxuICAgKi9cclxuICByYW5kb21JbkJveDogZnVuY3Rpb24oYm94LCB2KSB7XHJcbiAgICB2ID0gdiB8fCBuZXcgVmVjdG9yMygpO1xyXG5cclxuICAgIHYueCA9IHRNYXRoLnJhbmRGbG9hdChib3gubWluLngsIGJveC5tYXgueCk7XHJcbiAgICB2LnkgPSB0TWF0aC5yYW5kRmxvYXQoYm94Lm1pbi55LCBib3gubWF4LnkpO1xyXG4gICAgdi56ID0gdE1hdGgucmFuZEZsb2F0KGJveC5taW4ueiwgYm94Lm1heC56KTtcclxuXHJcbiAgICByZXR1cm4gdjtcclxuICB9LFxyXG5cclxuICAvKipcclxuICAgKiBHZXQgYSByYW5kb20gYXhpcyBmb3IgcXVhdGVybmlvbiByb3RhdGlvbi5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7VEhSRUUuVmVjdG9yMz19IHYgT3B0aW9uIHZlY3RvciB0byBzdG9yZSByZXN1bHQgaW4uXHJcbiAgICogQHJldHVybnMge1RIUkVFLlZlY3RvcjN9XHJcbiAgICovXHJcbiAgcmFuZG9tQXhpczogZnVuY3Rpb24odikge1xyXG4gICAgdiA9IHYgfHwgbmV3IFZlY3RvcjMoKTtcclxuXHJcbiAgICB2LnggPSB0TWF0aC5yYW5kRmxvYXRTcHJlYWQoMi4wKTtcclxuICAgIHYueSA9IHRNYXRoLnJhbmRGbG9hdFNwcmVhZCgyLjApO1xyXG4gICAgdi56ID0gdE1hdGgucmFuZEZsb2F0U3ByZWFkKDIuMCk7XHJcbiAgICB2Lm5vcm1hbGl6ZSgpO1xyXG5cclxuICAgIHJldHVybiB2O1xyXG4gIH0sXHJcblxyXG4gIC8qKlxyXG4gICAqIENyZWF0ZSBhIFRIUkVFLkJBUy5EZXB0aEFuaW1hdGlvbk1hdGVyaWFsIGZvciBzaGFkb3dzIGZyb20gYSBUSFJFRS5TcG90TGlnaHQgb3IgVEhSRUUuRGlyZWN0aW9uYWxMaWdodCBieSBjb3B5aW5nIHJlbGV2YW50IHNoYWRlciBjaHVua3MuXHJcbiAgICogVW5pZm9ybSB2YWx1ZXMgbXVzdCBiZSBtYW51YWxseSBzeW5jZWQgYmV0d2VlbiB0aGUgc291cmNlIG1hdGVyaWFsIGFuZCB0aGUgZGVwdGggbWF0ZXJpYWwuXHJcbiAgICpcclxuICAgKiBAc2VlIHtAbGluayBodHRwOi8vdGhyZWUtYmFzLWV4YW1wbGVzLnN1cmdlLnNoL2V4YW1wbGVzL3NoYWRvd3MvfVxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtUSFJFRS5CQVMuQmFzZUFuaW1hdGlvbk1hdGVyaWFsfSBzb3VyY2VNYXRlcmlhbCBJbnN0YW5jZSB0byBnZXQgdGhlIHNoYWRlciBjaHVua3MgZnJvbS5cclxuICAgKiBAcmV0dXJucyB7VEhSRUUuQkFTLkRlcHRoQW5pbWF0aW9uTWF0ZXJpYWx9XHJcbiAgICovXHJcbiAgY3JlYXRlRGVwdGhBbmltYXRpb25NYXRlcmlhbDogZnVuY3Rpb24oc291cmNlTWF0ZXJpYWwpIHtcclxuICAgIHJldHVybiBuZXcgRGVwdGhBbmltYXRpb25NYXRlcmlhbCh7XHJcbiAgICAgIHVuaWZvcm1zOiBzb3VyY2VNYXRlcmlhbC51bmlmb3JtcyxcclxuICAgICAgZGVmaW5lczogc291cmNlTWF0ZXJpYWwuZGVmaW5lcyxcclxuICAgICAgdmVydGV4RnVuY3Rpb25zOiBzb3VyY2VNYXRlcmlhbC52ZXJ0ZXhGdW5jdGlvbnMsXHJcbiAgICAgIHZlcnRleFBhcmFtZXRlcnM6IHNvdXJjZU1hdGVyaWFsLnZlcnRleFBhcmFtZXRlcnMsXHJcbiAgICAgIHZlcnRleEluaXQ6IHNvdXJjZU1hdGVyaWFsLnZlcnRleEluaXQsXHJcbiAgICAgIHZlcnRleFBvc2l0aW9uOiBzb3VyY2VNYXRlcmlhbC52ZXJ0ZXhQb3NpdGlvblxyXG4gICAgfSk7XHJcbiAgfSxcclxuXHJcbiAgLyoqXHJcbiAgICogQ3JlYXRlIGEgVEhSRUUuQkFTLkRpc3RhbmNlQW5pbWF0aW9uTWF0ZXJpYWwgZm9yIHNoYWRvd3MgZnJvbSBhIFRIUkVFLlBvaW50TGlnaHQgYnkgY29weWluZyByZWxldmFudCBzaGFkZXIgY2h1bmtzLlxyXG4gICAqIFVuaWZvcm0gdmFsdWVzIG11c3QgYmUgbWFudWFsbHkgc3luY2VkIGJldHdlZW4gdGhlIHNvdXJjZSBtYXRlcmlhbCBhbmQgdGhlIGRpc3RhbmNlIG1hdGVyaWFsLlxyXG4gICAqXHJcbiAgICogQHNlZSB7QGxpbmsgaHR0cDovL3RocmVlLWJhcy1leGFtcGxlcy5zdXJnZS5zaC9leGFtcGxlcy9zaGFkb3dzL31cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7VEhSRUUuQkFTLkJhc2VBbmltYXRpb25NYXRlcmlhbH0gc291cmNlTWF0ZXJpYWwgSW5zdGFuY2UgdG8gZ2V0IHRoZSBzaGFkZXIgY2h1bmtzIGZyb20uXHJcbiAgICogQHJldHVybnMge1RIUkVFLkJBUy5EaXN0YW5jZUFuaW1hdGlvbk1hdGVyaWFsfVxyXG4gICAqL1xyXG4gIGNyZWF0ZURpc3RhbmNlQW5pbWF0aW9uTWF0ZXJpYWw6IGZ1bmN0aW9uKHNvdXJjZU1hdGVyaWFsKSB7XHJcbiAgICByZXR1cm4gbmV3IERpc3RhbmNlQW5pbWF0aW9uTWF0ZXJpYWwoe1xyXG4gICAgICB1bmlmb3Jtczogc291cmNlTWF0ZXJpYWwudW5pZm9ybXMsXHJcbiAgICAgIGRlZmluZXM6IHNvdXJjZU1hdGVyaWFsLmRlZmluZXMsXHJcbiAgICAgIHZlcnRleEZ1bmN0aW9uczogc291cmNlTWF0ZXJpYWwudmVydGV4RnVuY3Rpb25zLFxyXG4gICAgICB2ZXJ0ZXhQYXJhbWV0ZXJzOiBzb3VyY2VNYXRlcmlhbC52ZXJ0ZXhQYXJhbWV0ZXJzLFxyXG4gICAgICB2ZXJ0ZXhJbml0OiBzb3VyY2VNYXRlcmlhbC52ZXJ0ZXhJbml0LFxyXG4gICAgICB2ZXJ0ZXhQb3NpdGlvbjogc291cmNlTWF0ZXJpYWwudmVydGV4UG9zaXRpb25cclxuICAgIH0pO1xyXG4gIH1cclxufTtcclxuXHJcbmV4cG9ydCB7IFV0aWxzIH07XHJcbiIsImltcG9ydCB7IEJ1ZmZlckdlb21ldHJ5LCBCdWZmZXJBdHRyaWJ1dGUgfSBmcm9tICd0aHJlZSc7XHJcbmltcG9ydCB7IFV0aWxzIH0gZnJvbSAnLi4vVXRpbHMnO1xyXG5cclxuLyoqXHJcbiAqIEEgVEhSRUUuQnVmZmVyR2VvbWV0cnkgZm9yIGFuaW1hdGluZyBpbmRpdmlkdWFsIGZhY2VzIG9mIGEgVEhSRUUuR2VvbWV0cnkuXHJcbiAqXHJcbiAqIEBwYXJhbSB7VEhSRUUuR2VvbWV0cnl9IG1vZGVsIFRoZSBUSFJFRS5HZW9tZXRyeSB0byBiYXNlIHRoaXMgZ2VvbWV0cnkgb24uXHJcbiAqIEBwYXJhbSB7T2JqZWN0PX0gb3B0aW9uc1xyXG4gKiBAcGFyYW0ge0Jvb2xlYW49fSBvcHRpb25zLmNvbXB1dGVDZW50cm9pZHMgSWYgdHJ1ZSwgYSBjZW50cm9pZHMgd2lsbCBiZSBjb21wdXRlZCBmb3IgZWFjaCBmYWNlIGFuZCBzdG9yZWQgaW4gVEhSRUUuQkFTLk1vZGVsQnVmZmVyR2VvbWV0cnkuY2VudHJvaWRzLlxyXG4gKiBAcGFyYW0ge0Jvb2xlYW49fSBvcHRpb25zLmxvY2FsaXplRmFjZXMgSWYgdHJ1ZSwgdGhlIHBvc2l0aW9ucyBmb3IgZWFjaCBmYWNlIHdpbGwgYmUgc3RvcmVkIHJlbGF0aXZlIHRvIHRoZSBjZW50cm9pZC4gVGhpcyBpcyB1c2VmdWwgaWYgeW91IHdhbnQgdG8gcm90YXRlIG9yIHNjYWxlIGZhY2VzIGFyb3VuZCB0aGVpciBjZW50ZXIuXHJcbiAqIEBjb25zdHJ1Y3RvclxyXG4gKi9cclxuZnVuY3Rpb24gTW9kZWxCdWZmZXJHZW9tZXRyeShtb2RlbCwgb3B0aW9ucykge1xyXG4gIEJ1ZmZlckdlb21ldHJ5LmNhbGwodGhpcyk7XHJcblxyXG4gIC8qKlxyXG4gICAqIEEgcmVmZXJlbmNlIHRvIHRoZSBnZW9tZXRyeSB1c2VkIHRvIGNyZWF0ZSB0aGlzIGluc3RhbmNlLlxyXG4gICAqIEB0eXBlIHtUSFJFRS5HZW9tZXRyeX1cclxuICAgKi9cclxuICB0aGlzLm1vZGVsR2VvbWV0cnkgPSBtb2RlbDtcclxuXHJcbiAgLyoqXHJcbiAgICogTnVtYmVyIG9mIGZhY2VzIG9mIHRoZSBtb2RlbC5cclxuICAgKiBAdHlwZSB7TnVtYmVyfVxyXG4gICAqL1xyXG4gIHRoaXMuZmFjZUNvdW50ID0gdGhpcy5tb2RlbEdlb21ldHJ5LmZhY2VzLmxlbmd0aDtcclxuXHJcbiAgLyoqXHJcbiAgICogTnVtYmVyIG9mIHZlcnRpY2VzIG9mIHRoZSBtb2RlbC5cclxuICAgKiBAdHlwZSB7TnVtYmVyfVxyXG4gICAqL1xyXG4gIHRoaXMudmVydGV4Q291bnQgPSB0aGlzLm1vZGVsR2VvbWV0cnkudmVydGljZXMubGVuZ3RoO1xyXG5cclxuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuICBvcHRpb25zLmNvbXB1dGVDZW50cm9pZHMgJiYgdGhpcy5jb21wdXRlQ2VudHJvaWRzKCk7XHJcblxyXG4gIHRoaXMuYnVmZmVySW5kaWNlcygpO1xyXG4gIHRoaXMuYnVmZmVyUG9zaXRpb25zKG9wdGlvbnMubG9jYWxpemVGYWNlcyk7XHJcbn1cclxuTW9kZWxCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZSk7XHJcbk1vZGVsQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gTW9kZWxCdWZmZXJHZW9tZXRyeTtcclxuXHJcbi8qKlxyXG4gKiBDb21wdXRlcyBhIGNlbnRyb2lkIGZvciBlYWNoIGZhY2UgYW5kIHN0b3JlcyBpdCBpbiBUSFJFRS5CQVMuTW9kZWxCdWZmZXJHZW9tZXRyeS5jZW50cm9pZHMuXHJcbiAqL1xyXG5Nb2RlbEJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5jb21wdXRlQ2VudHJvaWRzID0gZnVuY3Rpb24oKSB7XHJcbiAgLyoqXHJcbiAgICogQW4gYXJyYXkgb2YgY2VudHJvaWRzIGNvcnJlc3BvbmRpbmcgdG8gdGhlIGZhY2VzIG9mIHRoZSBtb2RlbC5cclxuICAgKlxyXG4gICAqIEB0eXBlIHtBcnJheX1cclxuICAgKi9cclxuICB0aGlzLmNlbnRyb2lkcyA9IFtdO1xyXG5cclxuICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuZmFjZUNvdW50OyBpKyspIHtcclxuICAgIHRoaXMuY2VudHJvaWRzW2ldID0gVXRpbHMuY29tcHV0ZUNlbnRyb2lkKHRoaXMubW9kZWxHZW9tZXRyeSwgdGhpcy5tb2RlbEdlb21ldHJ5LmZhY2VzW2ldKTtcclxuICB9XHJcbn07XHJcblxyXG5Nb2RlbEJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5idWZmZXJJbmRpY2VzID0gZnVuY3Rpb24oKSB7XHJcbiAgY29uc3QgaW5kZXhCdWZmZXIgPSBuZXcgVWludDMyQXJyYXkodGhpcy5mYWNlQ291bnQgKiAzKTtcclxuXHJcbiAgdGhpcy5zZXRJbmRleChuZXcgQnVmZmVyQXR0cmlidXRlKGluZGV4QnVmZmVyLCAxKSk7XHJcblxyXG4gIGZvciAobGV0IGkgPSAwLCBvZmZzZXQgPSAwOyBpIDwgdGhpcy5mYWNlQ291bnQ7IGkrKywgb2Zmc2V0ICs9IDMpIHtcclxuICAgIGNvbnN0IGZhY2UgPSB0aGlzLm1vZGVsR2VvbWV0cnkuZmFjZXNbaV07XHJcblxyXG4gICAgaW5kZXhCdWZmZXJbb2Zmc2V0ICAgIF0gPSBmYWNlLmE7XHJcbiAgICBpbmRleEJ1ZmZlcltvZmZzZXQgKyAxXSA9IGZhY2UuYjtcclxuICAgIGluZGV4QnVmZmVyW29mZnNldCArIDJdID0gZmFjZS5jO1xyXG4gIH1cclxufTtcclxuXHJcbk1vZGVsQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmJ1ZmZlclBvc2l0aW9ucyA9IGZ1bmN0aW9uKGxvY2FsaXplRmFjZXMpIHtcclxuICBjb25zdCBwb3NpdGlvbkJ1ZmZlciA9IHRoaXMuY3JlYXRlQXR0cmlidXRlKCdwb3NpdGlvbicsIDMpLmFycmF5O1xyXG4gIGxldCBpLCBvZmZzZXQ7XHJcblxyXG4gIGlmIChsb2NhbGl6ZUZhY2VzID09PSB0cnVlKSB7XHJcbiAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5mYWNlQ291bnQ7IGkrKykge1xyXG4gICAgICBjb25zdCBmYWNlID0gdGhpcy5tb2RlbEdlb21ldHJ5LmZhY2VzW2ldO1xyXG4gICAgICBjb25zdCBjZW50cm9pZCA9IHRoaXMuY2VudHJvaWRzID8gdGhpcy5jZW50cm9pZHNbaV0gOiBVdGlscy5jb21wdXRlQ2VudHJvaWQodGhpcy5tb2RlbEdlb21ldHJ5LCBmYWNlKTtcclxuXHJcbiAgICAgIGNvbnN0IGEgPSB0aGlzLm1vZGVsR2VvbWV0cnkudmVydGljZXNbZmFjZS5hXTtcclxuICAgICAgY29uc3QgYiA9IHRoaXMubW9kZWxHZW9tZXRyeS52ZXJ0aWNlc1tmYWNlLmJdO1xyXG4gICAgICBjb25zdCBjID0gdGhpcy5tb2RlbEdlb21ldHJ5LnZlcnRpY2VzW2ZhY2UuY107XHJcblxyXG4gICAgICBwb3NpdGlvbkJ1ZmZlcltmYWNlLmEgKiAzXSAgICAgPSBhLnggLSBjZW50cm9pZC54O1xyXG4gICAgICBwb3NpdGlvbkJ1ZmZlcltmYWNlLmEgKiAzICsgMV0gPSBhLnkgLSBjZW50cm9pZC55O1xyXG4gICAgICBwb3NpdGlvbkJ1ZmZlcltmYWNlLmEgKiAzICsgMl0gPSBhLnogLSBjZW50cm9pZC56O1xyXG5cclxuICAgICAgcG9zaXRpb25CdWZmZXJbZmFjZS5iICogM10gICAgID0gYi54IC0gY2VudHJvaWQueDtcclxuICAgICAgcG9zaXRpb25CdWZmZXJbZmFjZS5iICogMyArIDFdID0gYi55IC0gY2VudHJvaWQueTtcclxuICAgICAgcG9zaXRpb25CdWZmZXJbZmFjZS5iICogMyArIDJdID0gYi56IC0gY2VudHJvaWQuejtcclxuXHJcbiAgICAgIHBvc2l0aW9uQnVmZmVyW2ZhY2UuYyAqIDNdICAgICA9IGMueCAtIGNlbnRyb2lkLng7XHJcbiAgICAgIHBvc2l0aW9uQnVmZmVyW2ZhY2UuYyAqIDMgKyAxXSA9IGMueSAtIGNlbnRyb2lkLnk7XHJcbiAgICAgIHBvc2l0aW9uQnVmZmVyW2ZhY2UuYyAqIDMgKyAyXSA9IGMueiAtIGNlbnRyb2lkLno7XHJcbiAgICB9XHJcbiAgfVxyXG4gIGVsc2Uge1xyXG4gICAgZm9yIChpID0gMCwgb2Zmc2V0ID0gMDsgaSA8IHRoaXMudmVydGV4Q291bnQ7IGkrKywgb2Zmc2V0ICs9IDMpIHtcclxuICAgICAgY29uc3QgdmVydGV4ID0gdGhpcy5tb2RlbEdlb21ldHJ5LnZlcnRpY2VzW2ldO1xyXG5cclxuICAgICAgcG9zaXRpb25CdWZmZXJbb2Zmc2V0ICAgIF0gPSB2ZXJ0ZXgueDtcclxuICAgICAgcG9zaXRpb25CdWZmZXJbb2Zmc2V0ICsgMV0gPSB2ZXJ0ZXgueTtcclxuICAgICAgcG9zaXRpb25CdWZmZXJbb2Zmc2V0ICsgMl0gPSB2ZXJ0ZXguejtcclxuICAgIH1cclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogQ3JlYXRlcyBhIFRIUkVFLkJ1ZmZlckF0dHJpYnV0ZSB3aXRoIFVWIGNvb3JkaW5hdGVzLlxyXG4gKi9cclxuTW9kZWxCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuYnVmZmVyVVZzID0gZnVuY3Rpb24oKSB7XHJcbiAgY29uc3QgdXZCdWZmZXIgPSB0aGlzLmNyZWF0ZUF0dHJpYnV0ZSgndXYnLCAyKS5hcnJheTtcclxuXHJcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmZhY2VDb3VudDsgaSsrKSB7XHJcblxyXG4gICAgY29uc3QgZmFjZSA9IHRoaXMubW9kZWxHZW9tZXRyeS5mYWNlc1tpXTtcclxuICAgIGxldCB1djtcclxuXHJcbiAgICB1diA9IHRoaXMubW9kZWxHZW9tZXRyeS5mYWNlVmVydGV4VXZzWzBdW2ldWzBdO1xyXG4gICAgdXZCdWZmZXJbZmFjZS5hICogMl0gICAgID0gdXYueDtcclxuICAgIHV2QnVmZmVyW2ZhY2UuYSAqIDIgKyAxXSA9IHV2Lnk7XHJcblxyXG4gICAgdXYgPSB0aGlzLm1vZGVsR2VvbWV0cnkuZmFjZVZlcnRleFV2c1swXVtpXVsxXTtcclxuICAgIHV2QnVmZmVyW2ZhY2UuYiAqIDJdICAgICA9IHV2Lng7XHJcbiAgICB1dkJ1ZmZlcltmYWNlLmIgKiAyICsgMV0gPSB1di55O1xyXG5cclxuICAgIHV2ID0gdGhpcy5tb2RlbEdlb21ldHJ5LmZhY2VWZXJ0ZXhVdnNbMF1baV1bMl07XHJcbiAgICB1dkJ1ZmZlcltmYWNlLmMgKiAyXSAgICAgPSB1di54O1xyXG4gICAgdXZCdWZmZXJbZmFjZS5jICogMiArIDFdID0gdXYueTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogQ3JlYXRlcyB0d28gVEhSRUUuQnVmZmVyQXR0cmlidXRlczogc2tpbkluZGV4IGFuZCBza2luV2VpZ2h0LiBCb3RoIGFyZSByZXF1aXJlZCBmb3Igc2tpbm5pbmcuXHJcbiAqL1xyXG5Nb2RlbEJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5idWZmZXJTa2lubmluZyA9IGZ1bmN0aW9uKCkge1xyXG4gIGNvbnN0IHNraW5JbmRleEJ1ZmZlciA9IHRoaXMuY3JlYXRlQXR0cmlidXRlKCdza2luSW5kZXgnLCA0KS5hcnJheTtcclxuICBjb25zdCBza2luV2VpZ2h0QnVmZmVyID0gdGhpcy5jcmVhdGVBdHRyaWJ1dGUoJ3NraW5XZWlnaHQnLCA0KS5hcnJheTtcclxuXHJcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnZlcnRleENvdW50OyBpKyspIHtcclxuICAgIGNvbnN0IHNraW5JbmRleCA9IHRoaXMubW9kZWxHZW9tZXRyeS5za2luSW5kaWNlc1tpXTtcclxuICAgIGNvbnN0IHNraW5XZWlnaHQgPSB0aGlzLm1vZGVsR2VvbWV0cnkuc2tpbldlaWdodHNbaV07XHJcblxyXG4gICAgc2tpbkluZGV4QnVmZmVyW2kgKiA0ICAgIF0gPSBza2luSW5kZXgueDtcclxuICAgIHNraW5JbmRleEJ1ZmZlcltpICogNCArIDFdID0gc2tpbkluZGV4Lnk7XHJcbiAgICBza2luSW5kZXhCdWZmZXJbaSAqIDQgKyAyXSA9IHNraW5JbmRleC56O1xyXG4gICAgc2tpbkluZGV4QnVmZmVyW2kgKiA0ICsgM10gPSBza2luSW5kZXgudztcclxuXHJcbiAgICBza2luV2VpZ2h0QnVmZmVyW2kgKiA0ICAgIF0gPSBza2luV2VpZ2h0Lng7XHJcbiAgICBza2luV2VpZ2h0QnVmZmVyW2kgKiA0ICsgMV0gPSBza2luV2VpZ2h0Lnk7XHJcbiAgICBza2luV2VpZ2h0QnVmZmVyW2kgKiA0ICsgMl0gPSBza2luV2VpZ2h0Lno7XHJcbiAgICBza2luV2VpZ2h0QnVmZmVyW2kgKiA0ICsgM10gPSBza2luV2VpZ2h0Lnc7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgYSBUSFJFRS5CdWZmZXJBdHRyaWJ1dGUgb24gdGhpcyBnZW9tZXRyeSBpbnN0YW5jZS5cclxuICpcclxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgTmFtZSBvZiB0aGUgYXR0cmlidXRlLlxyXG4gKiBAcGFyYW0ge2ludH0gaXRlbVNpemUgTnVtYmVyIG9mIGZsb2F0cyBwZXIgdmVydGV4ICh0eXBpY2FsbHkgMSwgMiwgMyBvciA0KS5cclxuICogQHBhcmFtIHtmdW5jdGlvbj19IGZhY3RvcnkgRnVuY3Rpb24gdGhhdCB3aWxsIGJlIGNhbGxlZCBmb3IgZWFjaCBmYWNlIHVwb24gY3JlYXRpb24uIEFjY2VwdHMgMyBhcmd1bWVudHM6IGRhdGFbXSwgaW5kZXggYW5kIGZhY2VDb3VudC4gQ2FsbHMgc2V0RmFjZURhdGEuXHJcbiAqXHJcbiAqIEByZXR1cm5zIHtCdWZmZXJBdHRyaWJ1dGV9XHJcbiAqL1xyXG5Nb2RlbEJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5jcmVhdGVBdHRyaWJ1dGUgPSBmdW5jdGlvbihuYW1lLCBpdGVtU2l6ZSwgZmFjdG9yeSkge1xyXG4gIGNvbnN0IGJ1ZmZlciA9IG5ldyBGbG9hdDMyQXJyYXkodGhpcy52ZXJ0ZXhDb3VudCAqIGl0ZW1TaXplKTtcclxuICBjb25zdCBhdHRyaWJ1dGUgPSBuZXcgQnVmZmVyQXR0cmlidXRlKGJ1ZmZlciwgaXRlbVNpemUpO1xyXG5cclxuICB0aGlzLmFkZEF0dHJpYnV0ZShuYW1lLCBhdHRyaWJ1dGUpO1xyXG5cclxuICBpZiAoZmFjdG9yeSkge1xyXG4gICAgY29uc3QgZGF0YSA9IFtdO1xyXG5cclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5mYWNlQ291bnQ7IGkrKykge1xyXG4gICAgICBmYWN0b3J5KGRhdGEsIGksIHRoaXMuZmFjZUNvdW50KTtcclxuICAgICAgdGhpcy5zZXRGYWNlRGF0YShhdHRyaWJ1dGUsIGksIGRhdGEpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcmV0dXJuIGF0dHJpYnV0ZTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBTZXRzIGRhdGEgZm9yIGFsbCB2ZXJ0aWNlcyBvZiBhIGZhY2UgYXQgYSBnaXZlbiBpbmRleC5cclxuICogVXN1YWxseSBjYWxsZWQgaW4gYSBsb29wLlxyXG4gKlxyXG4gKiBAcGFyYW0ge1N0cmluZ3xUSFJFRS5CdWZmZXJBdHRyaWJ1dGV9IGF0dHJpYnV0ZSBUaGUgYXR0cmlidXRlIG9yIGF0dHJpYnV0ZSBuYW1lIHdoZXJlIHRoZSBkYXRhIGlzIHRvIGJlIHN0b3JlZC5cclxuICogQHBhcmFtIHtpbnR9IGZhY2VJbmRleCBJbmRleCBvZiB0aGUgZmFjZSBpbiB0aGUgYnVmZmVyIGdlb21ldHJ5LlxyXG4gKiBAcGFyYW0ge0FycmF5fSBkYXRhIEFycmF5IG9mIGRhdGEuIExlbmd0aCBzaG91bGQgYmUgZXF1YWwgdG8gaXRlbSBzaXplIG9mIHRoZSBhdHRyaWJ1dGUuXHJcbiAqL1xyXG5Nb2RlbEJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5zZXRGYWNlRGF0YSA9IGZ1bmN0aW9uKGF0dHJpYnV0ZSwgZmFjZUluZGV4LCBkYXRhKSB7XHJcbiAgYXR0cmlidXRlID0gKHR5cGVvZiBhdHRyaWJ1dGUgPT09ICdzdHJpbmcnKSA/IHRoaXMuYXR0cmlidXRlc1thdHRyaWJ1dGVdIDogYXR0cmlidXRlO1xyXG5cclxuICBsZXQgb2Zmc2V0ID0gZmFjZUluZGV4ICogMyAqIGF0dHJpYnV0ZS5pdGVtU2l6ZTtcclxuXHJcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCAzOyBpKyspIHtcclxuICAgIGZvciAobGV0IGogPSAwOyBqIDwgYXR0cmlidXRlLml0ZW1TaXplOyBqKyspIHtcclxuICAgICAgYXR0cmlidXRlLmFycmF5W29mZnNldCsrXSA9IGRhdGFbal07XHJcbiAgICB9XHJcbiAgfVxyXG59O1xyXG5cclxuZXhwb3J0IHsgTW9kZWxCdWZmZXJHZW9tZXRyeSB9O1xyXG4iLCJpbXBvcnQgeyBCdWZmZXJHZW9tZXRyeSwgQnVmZmVyQXR0cmlidXRlIH0gZnJvbSAndGhyZWUnO1xyXG5cclxuLyoqXHJcbiAqIEEgVEhSRUUuQnVmZmVyR2VvbWV0cnkgY29uc2lzdHMgb2YgcG9pbnRzLlxyXG4gKiBAcGFyYW0ge051bWJlcn0gY291bnQgVGhlIG51bWJlciBvZiBwb2ludHMuXHJcbiAqIEBjb25zdHJ1Y3RvclxyXG4gKi9cclxuZnVuY3Rpb24gUG9pbnRCdWZmZXJHZW9tZXRyeShjb3VudCkge1xyXG4gIEJ1ZmZlckdlb21ldHJ5LmNhbGwodGhpcyk7XHJcblxyXG4gIC8qKlxyXG4gICAqIE51bWJlciBvZiBwb2ludHMuXHJcbiAgICogQHR5cGUge051bWJlcn1cclxuICAgKi9cclxuICB0aGlzLnBvaW50Q291bnQgPSBjb3VudDtcclxuXHJcbiAgdGhpcy5idWZmZXJQb3NpdGlvbnMoKTtcclxufVxyXG5Qb2ludEJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlKTtcclxuUG9pbnRCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBQb2ludEJ1ZmZlckdlb21ldHJ5O1xyXG5cclxuUG9pbnRCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuYnVmZmVyUG9zaXRpb25zID0gZnVuY3Rpb24oKSB7XHJcbiAgdGhpcy5jcmVhdGVBdHRyaWJ1dGUoJ3Bvc2l0aW9uJywgMyk7XHJcbn07XHJcblxyXG4vKipcclxuICogQ3JlYXRlcyBhIFRIUkVFLkJ1ZmZlckF0dHJpYnV0ZSBvbiB0aGlzIGdlb21ldHJ5IGluc3RhbmNlLlxyXG4gKlxyXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZSBOYW1lIG9mIHRoZSBhdHRyaWJ1dGUuXHJcbiAqIEBwYXJhbSB7TnVtYmVyfSBpdGVtU2l6ZSBOdW1iZXIgb2YgZmxvYXRzIHBlciB2ZXJ0ZXggKHR5cGljYWxseSAxLCAyLCAzIG9yIDQpLlxyXG4gKiBAcGFyYW0ge2Z1bmN0aW9uPX0gZmFjdG9yeSBGdW5jdGlvbiB0aGF0IHdpbGwgYmUgY2FsbGVkIGZvciBlYWNoIHBvaW50IHVwb24gY3JlYXRpb24uIEFjY2VwdHMgMyBhcmd1bWVudHM6IGRhdGFbXSwgaW5kZXggYW5kIHByZWZhYkNvdW50LiBDYWxscyBzZXRQb2ludERhdGEuXHJcbiAqXHJcbiAqIEByZXR1cm5zIHtUSFJFRS5CdWZmZXJBdHRyaWJ1dGV9XHJcbiAqL1xyXG5Qb2ludEJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5jcmVhdGVBdHRyaWJ1dGUgPSBmdW5jdGlvbihuYW1lLCBpdGVtU2l6ZSwgZmFjdG9yeSkge1xyXG4gIGNvbnN0IGJ1ZmZlciA9IG5ldyBGbG9hdDMyQXJyYXkodGhpcy5wb2ludENvdW50ICogaXRlbVNpemUpO1xyXG4gIGNvbnN0IGF0dHJpYnV0ZSA9IG5ldyBCdWZmZXJBdHRyaWJ1dGUoYnVmZmVyLCBpdGVtU2l6ZSk7XHJcblxyXG4gIHRoaXMuYWRkQXR0cmlidXRlKG5hbWUsIGF0dHJpYnV0ZSk7XHJcblxyXG4gIGlmIChmYWN0b3J5KSB7XHJcbiAgICBjb25zdCBkYXRhID0gW107XHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucG9pbnRDb3VudDsgaSsrKSB7XHJcbiAgICAgIGZhY3RvcnkoZGF0YSwgaSwgdGhpcy5wb2ludENvdW50KTtcclxuICAgICAgdGhpcy5zZXRQb2ludERhdGEoYXR0cmlidXRlLCBpLCBkYXRhKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHJldHVybiBhdHRyaWJ1dGU7XHJcbn07XHJcblxyXG5Qb2ludEJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5zZXRQb2ludERhdGEgPSBmdW5jdGlvbihhdHRyaWJ1dGUsIHBvaW50SW5kZXgsIGRhdGEpIHtcclxuICBhdHRyaWJ1dGUgPSAodHlwZW9mIGF0dHJpYnV0ZSA9PT0gJ3N0cmluZycpID8gdGhpcy5hdHRyaWJ1dGVzW2F0dHJpYnV0ZV0gOiBhdHRyaWJ1dGU7XHJcblxyXG4gIGxldCBvZmZzZXQgPSBwb2ludEluZGV4ICogYXR0cmlidXRlLml0ZW1TaXplO1xyXG5cclxuICBmb3IgKGxldCBqID0gMDsgaiA8IGF0dHJpYnV0ZS5pdGVtU2l6ZTsgaisrKSB7XHJcbiAgICBhdHRyaWJ1dGUuYXJyYXlbb2Zmc2V0KytdID0gZGF0YVtqXTtcclxuICB9XHJcbn07XHJcblxyXG5leHBvcnQgeyBQb2ludEJ1ZmZlckdlb21ldHJ5IH07XHJcbiIsIi8vIGdlbmVyYXRlZCBieSBzY3JpcHRzL2J1aWxkX3NoYWRlcl9jaHVua3MuanNcblxuaW1wb3J0IGNhdG11bGxfcm9tX3NwbGluZSBmcm9tICcuL2dsc2wvY2F0bXVsbF9yb21fc3BsaW5lLmdsc2wnO1xuaW1wb3J0IGN1YmljX2JlemllciBmcm9tICcuL2dsc2wvY3ViaWNfYmV6aWVyLmdsc2wnO1xuaW1wb3J0IGVhc2VfYmFja19pbiBmcm9tICcuL2dsc2wvZWFzZV9iYWNrX2luLmdsc2wnO1xuaW1wb3J0IGVhc2VfYmFja19pbl9vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfYmFja19pbl9vdXQuZ2xzbCc7XG5pbXBvcnQgZWFzZV9iYWNrX291dCBmcm9tICcuL2dsc2wvZWFzZV9iYWNrX291dC5nbHNsJztcbmltcG9ydCBlYXNlX2JlemllciBmcm9tICcuL2dsc2wvZWFzZV9iZXppZXIuZ2xzbCc7XG5pbXBvcnQgZWFzZV9ib3VuY2VfaW4gZnJvbSAnLi9nbHNsL2Vhc2VfYm91bmNlX2luLmdsc2wnO1xuaW1wb3J0IGVhc2VfYm91bmNlX2luX291dCBmcm9tICcuL2dsc2wvZWFzZV9ib3VuY2VfaW5fb3V0Lmdsc2wnO1xuaW1wb3J0IGVhc2VfYm91bmNlX291dCBmcm9tICcuL2dsc2wvZWFzZV9ib3VuY2Vfb3V0Lmdsc2wnO1xuaW1wb3J0IGVhc2VfY2lyY19pbiBmcm9tICcuL2dsc2wvZWFzZV9jaXJjX2luLmdsc2wnO1xuaW1wb3J0IGVhc2VfY2lyY19pbl9vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfY2lyY19pbl9vdXQuZ2xzbCc7XG5pbXBvcnQgZWFzZV9jaXJjX291dCBmcm9tICcuL2dsc2wvZWFzZV9jaXJjX291dC5nbHNsJztcbmltcG9ydCBlYXNlX2N1YmljX2luIGZyb20gJy4vZ2xzbC9lYXNlX2N1YmljX2luLmdsc2wnO1xuaW1wb3J0IGVhc2VfY3ViaWNfaW5fb3V0IGZyb20gJy4vZ2xzbC9lYXNlX2N1YmljX2luX291dC5nbHNsJztcbmltcG9ydCBlYXNlX2N1YmljX291dCBmcm9tICcuL2dsc2wvZWFzZV9jdWJpY19vdXQuZ2xzbCc7XG5pbXBvcnQgZWFzZV9lbGFzdGljX2luIGZyb20gJy4vZ2xzbC9lYXNlX2VsYXN0aWNfaW4uZ2xzbCc7XG5pbXBvcnQgZWFzZV9lbGFzdGljX2luX291dCBmcm9tICcuL2dsc2wvZWFzZV9lbGFzdGljX2luX291dC5nbHNsJztcbmltcG9ydCBlYXNlX2VsYXN0aWNfb3V0IGZyb20gJy4vZ2xzbC9lYXNlX2VsYXN0aWNfb3V0Lmdsc2wnO1xuaW1wb3J0IGVhc2VfZXhwb19pbiBmcm9tICcuL2dsc2wvZWFzZV9leHBvX2luLmdsc2wnO1xuaW1wb3J0IGVhc2VfZXhwb19pbl9vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfZXhwb19pbl9vdXQuZ2xzbCc7XG5pbXBvcnQgZWFzZV9leHBvX291dCBmcm9tICcuL2dsc2wvZWFzZV9leHBvX291dC5nbHNsJztcbmltcG9ydCBlYXNlX3F1YWRfaW4gZnJvbSAnLi9nbHNsL2Vhc2VfcXVhZF9pbi5nbHNsJztcbmltcG9ydCBlYXNlX3F1YWRfaW5fb3V0IGZyb20gJy4vZ2xzbC9lYXNlX3F1YWRfaW5fb3V0Lmdsc2wnO1xuaW1wb3J0IGVhc2VfcXVhZF9vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfcXVhZF9vdXQuZ2xzbCc7XG5pbXBvcnQgZWFzZV9xdWFydF9pbiBmcm9tICcuL2dsc2wvZWFzZV9xdWFydF9pbi5nbHNsJztcbmltcG9ydCBlYXNlX3F1YXJ0X2luX291dCBmcm9tICcuL2dsc2wvZWFzZV9xdWFydF9pbl9vdXQuZ2xzbCc7XG5pbXBvcnQgZWFzZV9xdWFydF9vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfcXVhcnRfb3V0Lmdsc2wnO1xuaW1wb3J0IGVhc2VfcXVpbnRfaW4gZnJvbSAnLi9nbHNsL2Vhc2VfcXVpbnRfaW4uZ2xzbCc7XG5pbXBvcnQgZWFzZV9xdWludF9pbl9vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfcXVpbnRfaW5fb3V0Lmdsc2wnO1xuaW1wb3J0IGVhc2VfcXVpbnRfb3V0IGZyb20gJy4vZ2xzbC9lYXNlX3F1aW50X291dC5nbHNsJztcbmltcG9ydCBlYXNlX3NpbmVfaW4gZnJvbSAnLi9nbHNsL2Vhc2Vfc2luZV9pbi5nbHNsJztcbmltcG9ydCBlYXNlX3NpbmVfaW5fb3V0IGZyb20gJy4vZ2xzbC9lYXNlX3NpbmVfaW5fb3V0Lmdsc2wnO1xuaW1wb3J0IGVhc2Vfc2luZV9vdXQgZnJvbSAnLi9nbHNsL2Vhc2Vfc2luZV9vdXQuZ2xzbCc7XG5pbXBvcnQgcXVhZHJhdGljX2JlemllciBmcm9tICcuL2dsc2wvcXVhZHJhdGljX2Jlemllci5nbHNsJztcbmltcG9ydCBxdWF0ZXJuaW9uX3JvdGF0aW9uIGZyb20gJy4vZ2xzbC9xdWF0ZXJuaW9uX3JvdGF0aW9uLmdsc2wnO1xuaW1wb3J0IHF1YXRlcm5pb25fc2xlcnAgZnJvbSAnLi9nbHNsL3F1YXRlcm5pb25fc2xlcnAuZ2xzbCc7XG5cblxuZXhwb3J0IGNvbnN0IFNoYWRlckNodW5rID0ge1xuICBjYXRtdWxsX3JvbV9zcGxpbmU6IGNhdG11bGxfcm9tX3NwbGluZSxcbiAgY3ViaWNfYmV6aWVyOiBjdWJpY19iZXppZXIsXG4gIGVhc2VfYmFja19pbjogZWFzZV9iYWNrX2luLFxuICBlYXNlX2JhY2tfaW5fb3V0OiBlYXNlX2JhY2tfaW5fb3V0LFxuICBlYXNlX2JhY2tfb3V0OiBlYXNlX2JhY2tfb3V0LFxuICBlYXNlX2JlemllcjogZWFzZV9iZXppZXIsXG4gIGVhc2VfYm91bmNlX2luOiBlYXNlX2JvdW5jZV9pbixcbiAgZWFzZV9ib3VuY2VfaW5fb3V0OiBlYXNlX2JvdW5jZV9pbl9vdXQsXG4gIGVhc2VfYm91bmNlX291dDogZWFzZV9ib3VuY2Vfb3V0LFxuICBlYXNlX2NpcmNfaW46IGVhc2VfY2lyY19pbixcbiAgZWFzZV9jaXJjX2luX291dDogZWFzZV9jaXJjX2luX291dCxcbiAgZWFzZV9jaXJjX291dDogZWFzZV9jaXJjX291dCxcbiAgZWFzZV9jdWJpY19pbjogZWFzZV9jdWJpY19pbixcbiAgZWFzZV9jdWJpY19pbl9vdXQ6IGVhc2VfY3ViaWNfaW5fb3V0LFxuICBlYXNlX2N1YmljX291dDogZWFzZV9jdWJpY19vdXQsXG4gIGVhc2VfZWxhc3RpY19pbjogZWFzZV9lbGFzdGljX2luLFxuICBlYXNlX2VsYXN0aWNfaW5fb3V0OiBlYXNlX2VsYXN0aWNfaW5fb3V0LFxuICBlYXNlX2VsYXN0aWNfb3V0OiBlYXNlX2VsYXN0aWNfb3V0LFxuICBlYXNlX2V4cG9faW46IGVhc2VfZXhwb19pbixcbiAgZWFzZV9leHBvX2luX291dDogZWFzZV9leHBvX2luX291dCxcbiAgZWFzZV9leHBvX291dDogZWFzZV9leHBvX291dCxcbiAgZWFzZV9xdWFkX2luOiBlYXNlX3F1YWRfaW4sXG4gIGVhc2VfcXVhZF9pbl9vdXQ6IGVhc2VfcXVhZF9pbl9vdXQsXG4gIGVhc2VfcXVhZF9vdXQ6IGVhc2VfcXVhZF9vdXQsXG4gIGVhc2VfcXVhcnRfaW46IGVhc2VfcXVhcnRfaW4sXG4gIGVhc2VfcXVhcnRfaW5fb3V0OiBlYXNlX3F1YXJ0X2luX291dCxcbiAgZWFzZV9xdWFydF9vdXQ6IGVhc2VfcXVhcnRfb3V0LFxuICBlYXNlX3F1aW50X2luOiBlYXNlX3F1aW50X2luLFxuICBlYXNlX3F1aW50X2luX291dDogZWFzZV9xdWludF9pbl9vdXQsXG4gIGVhc2VfcXVpbnRfb3V0OiBlYXNlX3F1aW50X291dCxcbiAgZWFzZV9zaW5lX2luOiBlYXNlX3NpbmVfaW4sXG4gIGVhc2Vfc2luZV9pbl9vdXQ6IGVhc2Vfc2luZV9pbl9vdXQsXG4gIGVhc2Vfc2luZV9vdXQ6IGVhc2Vfc2luZV9vdXQsXG4gIHF1YWRyYXRpY19iZXppZXI6IHF1YWRyYXRpY19iZXppZXIsXG4gIHF1YXRlcm5pb25fcm90YXRpb246IHF1YXRlcm5pb25fcm90YXRpb24sXG4gIHF1YXRlcm5pb25fc2xlcnA6IHF1YXRlcm5pb25fc2xlcnAsXG5cbn07XG5cbiIsIi8qKlxyXG4gKiBBIHRpbWVsaW5lIHRyYW5zaXRpb24gc2VnbWVudC4gQW4gaW5zdGFuY2Ugb2YgdGhpcyBjbGFzcyBpcyBjcmVhdGVkIGludGVybmFsbHkgd2hlbiBjYWxsaW5nIHtAbGluayBUSFJFRS5CQVMuVGltZWxpbmUuYWRkfSwgc28geW91IHNob3VsZCBub3QgdXNlIHRoaXMgY2xhc3MgZGlyZWN0bHkuXHJcbiAqIFRoZSBpbnN0YW5jZSBpcyBhbHNvIHBhc3NlZCB0aGUgdGhlIGNvbXBpbGVyIGZ1bmN0aW9uIGlmIHlvdSByZWdpc3RlciBhIHRyYW5zaXRpb24gdGhyb3VnaCB7QGxpbmsgVEhSRUUuQkFTLlRpbWVsaW5lLnJlZ2lzdGVyfS4gVGhlcmUgeW91IGNhbiB1c2UgdGhlIHB1YmxpYyBwcm9wZXJ0aWVzIG9mIHRoZSBzZWdtZW50IHRvIGNvbXBpbGUgdGhlIGdsc2wgc3RyaW5nLlxyXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IEEgc3RyaW5nIGtleSBnZW5lcmF0ZWQgYnkgdGhlIHRpbWVsaW5lIHRvIHdoaWNoIHRoaXMgc2VnbWVudCBiZWxvbmdzLiBLZXlzIGFyZSB1bmlxdWUuXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBzdGFydCBTdGFydCB0aW1lIG9mIHRoaXMgc2VnbWVudCBpbiBhIHRpbWVsaW5lIGluIHNlY29uZHMuXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBkdXJhdGlvbiBEdXJhdGlvbiBvZiB0aGlzIHNlZ21lbnQgaW4gc2Vjb25kcy5cclxuICogQHBhcmFtIHtvYmplY3R9IHRyYW5zaXRpb24gT2JqZWN0IGRlc2NyaWJpbmcgdGhlIHRyYW5zaXRpb24uXHJcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGNvbXBpbGVyIEEgcmVmZXJlbmNlIHRvIHRoZSBjb21waWxlciBmdW5jdGlvbiBmcm9tIGEgdHJhbnNpdGlvbiBkZWZpbml0aW9uLlxyXG4gKiBAY29uc3RydWN0b3JcclxuICovXHJcbmZ1bmN0aW9uIFRpbWVsaW5lU2VnbWVudChrZXksIHN0YXJ0LCBkdXJhdGlvbiwgdHJhbnNpdGlvbiwgY29tcGlsZXIpIHtcclxuICB0aGlzLmtleSA9IGtleTtcclxuICB0aGlzLnN0YXJ0ID0gc3RhcnQ7XHJcbiAgdGhpcy5kdXJhdGlvbiA9IGR1cmF0aW9uO1xyXG4gIHRoaXMudHJhbnNpdGlvbiA9IHRyYW5zaXRpb247XHJcbiAgdGhpcy5jb21waWxlciA9IGNvbXBpbGVyO1xyXG5cclxuICB0aGlzLnRyYWlsID0gMDtcclxufVxyXG5cclxuVGltZWxpbmVTZWdtZW50LnByb3RvdHlwZS5jb21waWxlID0gZnVuY3Rpb24oKSB7XHJcbiAgcmV0dXJuIHRoaXMuY29tcGlsZXIodGhpcyk7XHJcbn07XHJcblxyXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoVGltZWxpbmVTZWdtZW50LnByb3RvdHlwZSwgJ2VuZCcsIHtcclxuICBnZXQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuc3RhcnQgKyB0aGlzLmR1cmF0aW9uO1xyXG4gIH1cclxufSk7XHJcblxyXG5leHBvcnQgeyBUaW1lbGluZVNlZ21lbnQgfTtcclxuIiwiaW1wb3J0IHsgVGltZWxpbmVTZWdtZW50IH0gZnJvbSAnLi9UaW1lbGluZVNlZ21lbnQnO1xyXG5cclxuLyoqXHJcbiAqIEEgdXRpbGl0eSBjbGFzcyB0byBjcmVhdGUgYW4gYW5pbWF0aW9uIHRpbWVsaW5lIHdoaWNoIGNhbiBiZSBiYWtlZCBpbnRvIGEgKHZlcnRleCkgc2hhZGVyLlxyXG4gKiBCeSBkZWZhdWx0IHRoZSB0aW1lbGluZSBzdXBwb3J0cyB0cmFuc2xhdGlvbiwgc2NhbGUgYW5kIHJvdGF0aW9uLiBUaGlzIGNhbiBiZSBleHRlbmRlZCBvciBvdmVycmlkZGVuLlxyXG4gKiBAY29uc3RydWN0b3JcclxuICovXHJcbmZ1bmN0aW9uIFRpbWVsaW5lKCkge1xyXG4gIC8qKlxyXG4gICAqIFRoZSB0b3RhbCBkdXJhdGlvbiBvZiB0aGUgdGltZWxpbmUgaW4gc2Vjb25kcy5cclxuICAgKiBAdHlwZSB7bnVtYmVyfVxyXG4gICAqL1xyXG4gIHRoaXMuZHVyYXRpb24gPSAwO1xyXG5cclxuICAvKipcclxuICAgKiBUaGUgbmFtZSBvZiB0aGUgdmFsdWUgdGhhdCBzZWdtZW50cyB3aWxsIHVzZSB0byByZWFkIHRoZSB0aW1lLiBEZWZhdWx0cyB0byAndFRpbWUnLlxyXG4gICAqIEB0eXBlIHtzdHJpbmd9XHJcbiAgICovXHJcbiAgdGhpcy50aW1lS2V5ID0gJ3RUaW1lJztcclxuXHJcbiAgdGhpcy5zZWdtZW50cyA9IHt9O1xyXG4gIHRoaXMuX19rZXkgPSAwO1xyXG59XHJcblxyXG4vLyBzdGF0aWMgZGVmaW5pdGlvbnMgbWFwXHJcblRpbWVsaW5lLnNlZ21lbnREZWZpbml0aW9ucyA9IHt9O1xyXG5cclxuLyoqXHJcbiAqIFJlZ2lzdGVycyBhIHRyYW5zaXRpb24gZGVmaW5pdGlvbiBmb3IgdXNlIHdpdGgge0BsaW5rIFRIUkVFLkJBUy5UaW1lbGluZS5hZGR9LlxyXG4gKiBAcGFyYW0ge1N0cmluZ30ga2V5IE5hbWUgb2YgdGhlIHRyYW5zaXRpb24uIERlZmF1bHRzIGluY2x1ZGUgJ3NjYWxlJywgJ3JvdGF0ZScgYW5kICd0cmFuc2xhdGUnLlxyXG4gKiBAcGFyYW0ge09iamVjdH0gZGVmaW5pdGlvblxyXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBkZWZpbml0aW9uLmNvbXBpbGVyIEEgZnVuY3Rpb24gdGhhdCBnZW5lcmF0ZXMgYSBnbHNsIHN0cmluZyBmb3IgYSB0cmFuc2l0aW9uIHNlZ21lbnQuIEFjY2VwdHMgYSBUSFJFRS5CQVMuVGltZWxpbmVTZWdtZW50IGFzIHRoZSBzb2xlIGFyZ3VtZW50LlxyXG4gKiBAcGFyYW0geyp9IGRlZmluaXRpb24uZGVmYXVsdEZyb20gVGhlIGluaXRpYWwgdmFsdWUgZm9yIGEgdHJhbnNmb3JtLmZyb20uIEZvciBleGFtcGxlLCB0aGUgZGVmYXVsdEZyb20gZm9yIGEgdHJhbnNsYXRpb24gaXMgVEhSRUUuVmVjdG9yMygwLCAwLCAwKS5cclxuICogQHN0YXRpY1xyXG4gKi9cclxuVGltZWxpbmUucmVnaXN0ZXIgPSBmdW5jdGlvbihrZXksIGRlZmluaXRpb24pIHtcclxuICBUaW1lbGluZS5zZWdtZW50RGVmaW5pdGlvbnNba2V5XSA9IGRlZmluaXRpb247XHJcbiAgXHJcbiAgcmV0dXJuIGRlZmluaXRpb247XHJcbn07XHJcblxyXG4vKipcclxuICogQWRkIGEgdHJhbnNpdGlvbiB0byB0aGUgdGltZWxpbmUuXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBkdXJhdGlvbiBEdXJhdGlvbiBpbiBzZWNvbmRzXHJcbiAqIEBwYXJhbSB7b2JqZWN0fSB0cmFuc2l0aW9ucyBBbiBvYmplY3QgY29udGFpbmluZyBvbmUgb3Igc2V2ZXJhbCB0cmFuc2l0aW9ucy4gVGhlIGtleXMgc2hvdWxkIG1hdGNoIHRyYW5zZm9ybSBkZWZpbml0aW9ucy5cclxuICogVGhlIHRyYW5zaXRpb24gb2JqZWN0IGZvciBlYWNoIGtleSB3aWxsIGJlIHBhc3NlZCB0byB0aGUgbWF0Y2hpbmcgZGVmaW5pdGlvbidzIGNvbXBpbGVyLiBJdCBjYW4gaGF2ZSBhcmJpdHJhcnkgcHJvcGVydGllcywgYnV0IHRoZSBUaW1lbGluZSBleHBlY3RzIGF0IGxlYXN0IGEgJ3RvJywgJ2Zyb20nIGFuZCBhbiBvcHRpb25hbCAnZWFzZScuXHJcbiAqIEBwYXJhbSB7bnVtYmVyfHN0cmluZ30gW3Bvc2l0aW9uT2Zmc2V0XSBQb3NpdGlvbiBpbiB0aGUgdGltZWxpbmUuIERlZmF1bHRzIHRvIHRoZSBlbmQgb2YgdGhlIHRpbWVsaW5lLiBJZiBhIG51bWJlciBpcyBwcm92aWRlZCwgdGhlIHRyYW5zaXRpb24gd2lsbCBiZSBpbnNlcnRlZCBhdCB0aGF0IHRpbWUgaW4gc2Vjb25kcy4gU3RyaW5ncyAoJys9eCcgb3IgJy09eCcpIGNhbiBiZSB1c2VkIGZvciBhIHZhbHVlIHJlbGF0aXZlIHRvIHRoZSBlbmQgb2YgdGltZWxpbmUuXHJcbiAqL1xyXG5UaW1lbGluZS5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24oZHVyYXRpb24sIHRyYW5zaXRpb25zLCBwb3NpdGlvbk9mZnNldCkge1xyXG4gIC8vIHN0b3Agcm9sbHVwIGZyb20gY29tcGxhaW5pbmcgYWJvdXQgZXZhbFxyXG4gIGNvbnN0IF9ldmFsID0gZXZhbDtcclxuICBcclxuICBsZXQgc3RhcnQgPSB0aGlzLmR1cmF0aW9uO1xyXG5cclxuICBpZiAocG9zaXRpb25PZmZzZXQgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgaWYgKHR5cGVvZiBwb3NpdGlvbk9mZnNldCA9PT0gJ251bWJlcicpIHtcclxuICAgICAgc3RhcnQgPSBwb3NpdGlvbk9mZnNldDtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKHR5cGVvZiBwb3NpdGlvbk9mZnNldCA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgX2V2YWwoJ3N0YXJ0JyArIHBvc2l0aW9uT2Zmc2V0KTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmR1cmF0aW9uID0gTWF0aC5tYXgodGhpcy5kdXJhdGlvbiwgc3RhcnQgKyBkdXJhdGlvbik7XHJcbiAgfVxyXG4gIGVsc2Uge1xyXG4gICAgdGhpcy5kdXJhdGlvbiArPSBkdXJhdGlvbjtcclxuICB9XHJcblxyXG4gIGxldCBrZXlzID0gT2JqZWN0LmtleXModHJhbnNpdGlvbnMpLCBrZXk7XHJcblxyXG4gIGZvciAobGV0IGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7IGkrKykge1xyXG4gICAga2V5ID0ga2V5c1tpXTtcclxuXHJcbiAgICB0aGlzLnByb2Nlc3NUcmFuc2l0aW9uKGtleSwgdHJhbnNpdGlvbnNba2V5XSwgc3RhcnQsIGR1cmF0aW9uKTtcclxuICB9XHJcbn07XHJcblxyXG5UaW1lbGluZS5wcm90b3R5cGUucHJvY2Vzc1RyYW5zaXRpb24gPSBmdW5jdGlvbihrZXksIHRyYW5zaXRpb24sIHN0YXJ0LCBkdXJhdGlvbikge1xyXG4gIGNvbnN0IGRlZmluaXRpb24gPSBUaW1lbGluZS5zZWdtZW50RGVmaW5pdGlvbnNba2V5XTtcclxuXHJcbiAgbGV0IHNlZ21lbnRzID0gdGhpcy5zZWdtZW50c1trZXldO1xyXG4gIGlmICghc2VnbWVudHMpIHNlZ21lbnRzID0gdGhpcy5zZWdtZW50c1trZXldID0gW107XHJcblxyXG4gIGlmICh0cmFuc2l0aW9uLmZyb20gPT09IHVuZGVmaW5lZCkge1xyXG4gICAgaWYgKHNlZ21lbnRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICB0cmFuc2l0aW9uLmZyb20gPSBkZWZpbml0aW9uLmRlZmF1bHRGcm9tO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIHRyYW5zaXRpb24uZnJvbSA9IHNlZ21lbnRzW3NlZ21lbnRzLmxlbmd0aCAtIDFdLnRyYW5zaXRpb24udG87XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBzZWdtZW50cy5wdXNoKG5ldyBUaW1lbGluZVNlZ21lbnQoKHRoaXMuX19rZXkrKykudG9TdHJpbmcoKSwgc3RhcnQsIGR1cmF0aW9uLCB0cmFuc2l0aW9uLCBkZWZpbml0aW9uLmNvbXBpbGVyKSk7XHJcbn07XHJcblxyXG4vKipcclxuICogQ29tcGlsZXMgdGhlIHRpbWVsaW5lIGludG8gYSBnbHNsIHN0cmluZyBhcnJheSB0aGF0IGNhbiBiZSBpbmplY3RlZCBpbnRvIGEgKHZlcnRleCkgc2hhZGVyLlxyXG4gKiBAcmV0dXJucyB7QXJyYXl9XHJcbiAqL1xyXG5UaW1lbGluZS5wcm90b3R5cGUuY29tcGlsZSA9IGZ1bmN0aW9uKCkge1xyXG4gIGNvbnN0IGMgPSBbXTtcclxuXHJcbiAgY29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKHRoaXMuc2VnbWVudHMpO1xyXG4gIGxldCBzZWdtZW50cztcclxuXHJcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICBzZWdtZW50cyA9IHRoaXMuc2VnbWVudHNba2V5c1tpXV07XHJcblxyXG4gICAgdGhpcy5maWxsR2FwcyhzZWdtZW50cyk7XHJcblxyXG4gICAgc2VnbWVudHMuZm9yRWFjaChmdW5jdGlvbihzKSB7XHJcbiAgICAgIGMucHVzaChzLmNvbXBpbGUoKSk7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIHJldHVybiBjO1xyXG59O1xyXG5UaW1lbGluZS5wcm90b3R5cGUuZmlsbEdhcHMgPSBmdW5jdGlvbihzZWdtZW50cykge1xyXG4gIGlmIChzZWdtZW50cy5sZW5ndGggPT09IDApIHJldHVybjtcclxuXHJcbiAgbGV0IHMwLCBzMTtcclxuXHJcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBzZWdtZW50cy5sZW5ndGggLSAxOyBpKyspIHtcclxuICAgIHMwID0gc2VnbWVudHNbaV07XHJcbiAgICBzMSA9IHNlZ21lbnRzW2kgKyAxXTtcclxuXHJcbiAgICBzMC50cmFpbCA9IHMxLnN0YXJ0IC0gczAuZW5kO1xyXG4gIH1cclxuXHJcbiAgLy8gcGFkIGxhc3Qgc2VnbWVudCB1bnRpbCBlbmQgb2YgdGltZWxpbmVcclxuICBzMCA9IHNlZ21lbnRzW3NlZ21lbnRzLmxlbmd0aCAtIDFdO1xyXG4gIHMwLnRyYWlsID0gdGhpcy5kdXJhdGlvbiAtIHMwLmVuZDtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBHZXQgYSBjb21waWxlZCBnbHNsIHN0cmluZyB3aXRoIGNhbGxzIHRvIHRyYW5zZm9ybSBmdW5jdGlvbnMgZm9yIGEgZ2l2ZW4ga2V5LlxyXG4gKiBUaGUgb3JkZXIgaW4gd2hpY2ggdGhlc2UgdHJhbnNpdGlvbnMgYXJlIGFwcGxpZWQgbWF0dGVycyBiZWNhdXNlIHRoZXkgYWxsIG9wZXJhdGUgb24gdGhlIHNhbWUgdmFsdWUuXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgQSBrZXkgbWF0Y2hpbmcgYSB0cmFuc2Zvcm0gZGVmaW5pdGlvbi5cclxuICogQHJldHVybnMge3N0cmluZ31cclxuICovXHJcblRpbWVsaW5lLnByb3RvdHlwZS5nZXRUcmFuc2Zvcm1DYWxscyA9IGZ1bmN0aW9uKGtleSkge1xyXG4gIGxldCB0ID0gdGhpcy50aW1lS2V5O1xyXG5cclxuICByZXR1cm4gdGhpcy5zZWdtZW50c1trZXldID8gIHRoaXMuc2VnbWVudHNba2V5XS5tYXAoZnVuY3Rpb24ocykge1xyXG4gICAgcmV0dXJuIGBhcHBseVRyYW5zZm9ybSR7cy5rZXl9KCR7dH0sIHRyYW5zZm9ybWVkKTtgO1xyXG4gIH0pLmpvaW4oJ1xcbicpIDogJyc7XHJcbn07XHJcblxyXG5leHBvcnQgeyBUaW1lbGluZSB9XHJcbiIsImNvbnN0IFRpbWVsaW5lQ2h1bmtzID0ge1xyXG4gIHZlYzM6IGZ1bmN0aW9uKG4sIHYsIHApIHtcclxuICAgIGNvbnN0IHggPSAodi54IHx8IDApLnRvUHJlY2lzaW9uKHApO1xyXG4gICAgY29uc3QgeSA9ICh2LnkgfHwgMCkudG9QcmVjaXNpb24ocCk7XHJcbiAgICBjb25zdCB6ID0gKHYueiB8fCAwKS50b1ByZWNpc2lvbihwKTtcclxuXHJcbiAgICByZXR1cm4gYHZlYzMgJHtufSA9IHZlYzMoJHt4fSwgJHt5fSwgJHt6fSk7YDtcclxuICB9LFxyXG4gIHZlYzQ6IGZ1bmN0aW9uKG4sIHYsIHApIHtcclxuICAgIGNvbnN0IHggPSAodi54IHx8IDApLnRvUHJlY2lzaW9uKHApO1xyXG4gICAgY29uc3QgeSA9ICh2LnkgfHwgMCkudG9QcmVjaXNpb24ocCk7XHJcbiAgICBjb25zdCB6ID0gKHYueiB8fCAwKS50b1ByZWNpc2lvbihwKTtcclxuICAgIGNvbnN0IHcgPSAodi53IHx8IDApLnRvUHJlY2lzaW9uKHApO1xyXG4gIFxyXG4gICAgcmV0dXJuIGB2ZWM0ICR7bn0gPSB2ZWM0KCR7eH0sICR7eX0sICR7en0sICR7d30pO2A7XHJcbiAgfSxcclxuICBkZWxheUR1cmF0aW9uOiBmdW5jdGlvbihzZWdtZW50KSB7XHJcbiAgICByZXR1cm4gYFxyXG4gICAgZmxvYXQgY0RlbGF5JHtzZWdtZW50LmtleX0gPSAke3NlZ21lbnQuc3RhcnQudG9QcmVjaXNpb24oNCl9O1xyXG4gICAgZmxvYXQgY0R1cmF0aW9uJHtzZWdtZW50LmtleX0gPSAke3NlZ21lbnQuZHVyYXRpb24udG9QcmVjaXNpb24oNCl9O1xyXG4gICAgYDtcclxuICB9LFxyXG4gIHByb2dyZXNzOiBmdW5jdGlvbihzZWdtZW50KSB7XHJcbiAgICAvLyB6ZXJvIGR1cmF0aW9uIHNlZ21lbnRzIHNob3VsZCBhbHdheXMgcmVuZGVyIGNvbXBsZXRlXHJcbiAgICBpZiAoc2VnbWVudC5kdXJhdGlvbiA9PT0gMCkge1xyXG4gICAgICByZXR1cm4gYGZsb2F0IHByb2dyZXNzID0gMS4wO2BcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICByZXR1cm4gYFxyXG4gICAgICBmbG9hdCBwcm9ncmVzcyA9IGNsYW1wKHRpbWUgLSBjRGVsYXkke3NlZ21lbnQua2V5fSwgMC4wLCBjRHVyYXRpb24ke3NlZ21lbnQua2V5fSkgLyBjRHVyYXRpb24ke3NlZ21lbnQua2V5fTtcclxuICAgICAgJHtzZWdtZW50LnRyYW5zaXRpb24uZWFzZSA/IGBwcm9ncmVzcyA9ICR7c2VnbWVudC50cmFuc2l0aW9uLmVhc2V9KHByb2dyZXNzJHsoc2VnbWVudC50cmFuc2l0aW9uLmVhc2VQYXJhbXMgPyBgLCAke3NlZ21lbnQudHJhbnNpdGlvbi5lYXNlUGFyYW1zLm1hcCgodikgPT4gdi50b1ByZWNpc2lvbig0KSkuam9pbihgLCBgKX1gIDogYGApfSk7YCA6IGBgfVxyXG4gICAgICBgO1xyXG4gICAgfVxyXG4gIH0sXHJcbiAgcmVuZGVyQ2hlY2s6IGZ1bmN0aW9uKHNlZ21lbnQpIHtcclxuICAgIGNvbnN0IHN0YXJ0VGltZSA9IHNlZ21lbnQuc3RhcnQudG9QcmVjaXNpb24oNCk7XHJcbiAgICBjb25zdCBlbmRUaW1lID0gKHNlZ21lbnQuZW5kICsgc2VnbWVudC50cmFpbCkudG9QcmVjaXNpb24oNCk7XHJcblxyXG4gICAgcmV0dXJuIGBpZiAodGltZSA8ICR7c3RhcnRUaW1lfSB8fCB0aW1lID4gJHtlbmRUaW1lfSkgcmV0dXJuO2A7XHJcbiAgfVxyXG59O1xyXG5cclxuZXhwb3J0IHsgVGltZWxpbmVDaHVua3MgfTtcclxuIiwiaW1wb3J0IHsgVGltZWxpbmUgfSBmcm9tICcuL1RpbWVsaW5lJztcclxuaW1wb3J0IHsgVGltZWxpbmVDaHVua3MgfSBmcm9tICcuL1RpbWVsaW5lQ2h1bmtzJztcclxuaW1wb3J0IHsgVmVjdG9yMyB9IGZyb20gJ3RocmVlJztcclxuXHJcbmNvbnN0IFRyYW5zbGF0aW9uU2VnbWVudCA9IHtcclxuICBjb21waWxlcjogZnVuY3Rpb24oc2VnbWVudCkge1xyXG4gICAgcmV0dXJuIGBcclxuICAgICR7VGltZWxpbmVDaHVua3MuZGVsYXlEdXJhdGlvbihzZWdtZW50KX1cclxuICAgICR7VGltZWxpbmVDaHVua3MudmVjMyhgY1RyYW5zbGF0ZUZyb20ke3NlZ21lbnQua2V5fWAsIHNlZ21lbnQudHJhbnNpdGlvbi5mcm9tLCAyKX1cclxuICAgICR7VGltZWxpbmVDaHVua3MudmVjMyhgY1RyYW5zbGF0ZVRvJHtzZWdtZW50LmtleX1gLCBzZWdtZW50LnRyYW5zaXRpb24udG8sIDIpfVxyXG4gICAgXHJcbiAgICB2b2lkIGFwcGx5VHJhbnNmb3JtJHtzZWdtZW50LmtleX0oZmxvYXQgdGltZSwgaW5vdXQgdmVjMyB2KSB7XHJcbiAgICBcclxuICAgICAgJHtUaW1lbGluZUNodW5rcy5yZW5kZXJDaGVjayhzZWdtZW50KX1cclxuICAgICAgJHtUaW1lbGluZUNodW5rcy5wcm9ncmVzcyhzZWdtZW50KX1cclxuICAgIFxyXG4gICAgICB2ICs9IG1peChjVHJhbnNsYXRlRnJvbSR7c2VnbWVudC5rZXl9LCBjVHJhbnNsYXRlVG8ke3NlZ21lbnQua2V5fSwgcHJvZ3Jlc3MpO1xyXG4gICAgfVxyXG4gICAgYDtcclxuICB9LFxyXG4gIGRlZmF1bHRGcm9tOiBuZXcgVmVjdG9yMygwLCAwLCAwKVxyXG59O1xyXG5cclxuVGltZWxpbmUucmVnaXN0ZXIoJ3RyYW5zbGF0ZScsIFRyYW5zbGF0aW9uU2VnbWVudCk7XHJcblxyXG5leHBvcnQgeyBUcmFuc2xhdGlvblNlZ21lbnQgfTtcclxuIiwiaW1wb3J0IHsgVGltZWxpbmUgfSBmcm9tICcuL1RpbWVsaW5lJztcclxuaW1wb3J0IHsgVGltZWxpbmVDaHVua3MgfSBmcm9tICcuL1RpbWVsaW5lQ2h1bmtzJztcclxuaW1wb3J0IHsgVmVjdG9yMyB9IGZyb20gJ3RocmVlJztcclxuXHJcbmNvbnN0IFNjYWxlU2VnbWVudCA9IHtcclxuICBjb21waWxlcjogZnVuY3Rpb24oc2VnbWVudCkge1xyXG4gICAgY29uc3Qgb3JpZ2luID0gc2VnbWVudC50cmFuc2l0aW9uLm9yaWdpbjtcclxuICAgIFxyXG4gICAgcmV0dXJuIGBcclxuICAgICR7VGltZWxpbmVDaHVua3MuZGVsYXlEdXJhdGlvbihzZWdtZW50KX1cclxuICAgICR7VGltZWxpbmVDaHVua3MudmVjMyhgY1NjYWxlRnJvbSR7c2VnbWVudC5rZXl9YCwgc2VnbWVudC50cmFuc2l0aW9uLmZyb20sIDIpfVxyXG4gICAgJHtUaW1lbGluZUNodW5rcy52ZWMzKGBjU2NhbGVUbyR7c2VnbWVudC5rZXl9YCwgc2VnbWVudC50cmFuc2l0aW9uLnRvLCAyKX1cclxuICAgICR7b3JpZ2luID8gVGltZWxpbmVDaHVua3MudmVjMyhgY09yaWdpbiR7c2VnbWVudC5rZXl9YCwgb3JpZ2luLCAyKSA6ICcnfVxyXG4gICAgXHJcbiAgICB2b2lkIGFwcGx5VHJhbnNmb3JtJHtzZWdtZW50LmtleX0oZmxvYXQgdGltZSwgaW5vdXQgdmVjMyB2KSB7XHJcbiAgICBcclxuICAgICAgJHtUaW1lbGluZUNodW5rcy5yZW5kZXJDaGVjayhzZWdtZW50KX1cclxuICAgICAgJHtUaW1lbGluZUNodW5rcy5wcm9ncmVzcyhzZWdtZW50KX1cclxuICAgIFxyXG4gICAgICAke29yaWdpbiA/IGB2IC09IGNPcmlnaW4ke3NlZ21lbnQua2V5fTtgIDogJyd9XHJcbiAgICAgIHYgKj0gbWl4KGNTY2FsZUZyb20ke3NlZ21lbnQua2V5fSwgY1NjYWxlVG8ke3NlZ21lbnQua2V5fSwgcHJvZ3Jlc3MpO1xyXG4gICAgICAke29yaWdpbiA/IGB2ICs9IGNPcmlnaW4ke3NlZ21lbnQua2V5fTtgIDogJyd9XHJcbiAgICB9XHJcbiAgICBgO1xyXG4gIH0sXHJcbiAgZGVmYXVsdEZyb206IG5ldyBWZWN0b3IzKDEsIDEsIDEpXHJcbn07XHJcblxyXG5UaW1lbGluZS5yZWdpc3Rlcignc2NhbGUnLCBTY2FsZVNlZ21lbnQpO1xyXG5cclxuZXhwb3J0IHsgU2NhbGVTZWdtZW50IH07XHJcbiIsImltcG9ydCB7IFRpbWVsaW5lIH0gZnJvbSAnLi9UaW1lbGluZSc7XHJcbmltcG9ydCB7IFRpbWVsaW5lQ2h1bmtzIH0gZnJvbSAnLi9UaW1lbGluZUNodW5rcyc7XHJcbmltcG9ydCB7IFZlY3RvcjMsIFZlY3RvcjQgfSBmcm9tICd0aHJlZSc7XHJcblxyXG5jb25zdCBSb3RhdGlvblNlZ21lbnQgPSB7XHJcbiAgY29tcGlsZXIoc2VnbWVudCkge1xyXG4gICAgY29uc3QgZnJvbUF4aXNBbmdsZSA9IG5ldyBWZWN0b3I0KFxyXG4gICAgICBzZWdtZW50LnRyYW5zaXRpb24uZnJvbS5heGlzLngsXHJcbiAgICAgIHNlZ21lbnQudHJhbnNpdGlvbi5mcm9tLmF4aXMueSxcclxuICAgICAgc2VnbWVudC50cmFuc2l0aW9uLmZyb20uYXhpcy56LFxyXG4gICAgICBzZWdtZW50LnRyYW5zaXRpb24uZnJvbS5hbmdsZVxyXG4gICAgKTtcclxuICBcclxuICAgIGNvbnN0IHRvQXhpcyA9IHNlZ21lbnQudHJhbnNpdGlvbi50by5heGlzIHx8IHNlZ21lbnQudHJhbnNpdGlvbi5mcm9tLmF4aXM7XHJcbiAgICBjb25zdCB0b0F4aXNBbmdsZSA9IG5ldyBWZWN0b3I0KFxyXG4gICAgICB0b0F4aXMueCxcclxuICAgICAgdG9BeGlzLnksXHJcbiAgICAgIHRvQXhpcy56LFxyXG4gICAgICBzZWdtZW50LnRyYW5zaXRpb24udG8uYW5nbGVcclxuICAgICk7XHJcbiAgXHJcbiAgICBjb25zdCBvcmlnaW4gPSBzZWdtZW50LnRyYW5zaXRpb24ub3JpZ2luO1xyXG4gICAgXHJcbiAgICByZXR1cm4gYFxyXG4gICAgJHtUaW1lbGluZUNodW5rcy5kZWxheUR1cmF0aW9uKHNlZ21lbnQpfVxyXG4gICAgJHtUaW1lbGluZUNodW5rcy52ZWM0KGBjUm90YXRpb25Gcm9tJHtzZWdtZW50LmtleX1gLCBmcm9tQXhpc0FuZ2xlLCA4KX1cclxuICAgICR7VGltZWxpbmVDaHVua3MudmVjNChgY1JvdGF0aW9uVG8ke3NlZ21lbnQua2V5fWAsIHRvQXhpc0FuZ2xlLCA4KX1cclxuICAgICR7b3JpZ2luID8gVGltZWxpbmVDaHVua3MudmVjMyhgY09yaWdpbiR7c2VnbWVudC5rZXl9YCwgb3JpZ2luLCAyKSA6ICcnfVxyXG4gICAgXHJcbiAgICB2b2lkIGFwcGx5VHJhbnNmb3JtJHtzZWdtZW50LmtleX0oZmxvYXQgdGltZSwgaW5vdXQgdmVjMyB2KSB7XHJcbiAgICAgICR7VGltZWxpbmVDaHVua3MucmVuZGVyQ2hlY2soc2VnbWVudCl9XHJcbiAgICAgICR7VGltZWxpbmVDaHVua3MucHJvZ3Jlc3Moc2VnbWVudCl9XHJcblxyXG4gICAgICAke29yaWdpbiA/IGB2IC09IGNPcmlnaW4ke3NlZ21lbnQua2V5fTtgIDogJyd9XHJcbiAgICAgIHZlYzMgYXhpcyA9IG5vcm1hbGl6ZShtaXgoY1JvdGF0aW9uRnJvbSR7c2VnbWVudC5rZXl9Lnh5eiwgY1JvdGF0aW9uVG8ke3NlZ21lbnQua2V5fS54eXosIHByb2dyZXNzKSk7XHJcbiAgICAgIGZsb2F0IGFuZ2xlID0gbWl4KGNSb3RhdGlvbkZyb20ke3NlZ21lbnQua2V5fS53LCBjUm90YXRpb25UbyR7c2VnbWVudC5rZXl9LncsIHByb2dyZXNzKTtcclxuICAgICAgdmVjNCBxID0gcXVhdEZyb21BeGlzQW5nbGUoYXhpcywgYW5nbGUpO1xyXG4gICAgICB2ID0gcm90YXRlVmVjdG9yKHEsIHYpO1xyXG4gICAgICAke29yaWdpbiA/IGB2ICs9IGNPcmlnaW4ke3NlZ21lbnQua2V5fTtgIDogJyd9XHJcbiAgICB9XHJcbiAgICBgO1xyXG4gIH0sXHJcbiAgZGVmYXVsdEZyb206IHtheGlzOiBuZXcgVmVjdG9yMygpLCBhbmdsZTogMH1cclxufTtcclxuXHJcblRpbWVsaW5lLnJlZ2lzdGVyKCdyb3RhdGUnLCBSb3RhdGlvblNlZ21lbnQpO1xyXG5cclxuZXhwb3J0IHsgUm90YXRpb25TZWdtZW50IH07XHJcbiJdLCJuYW1lcyI6WyJCYXNlQW5pbWF0aW9uTWF0ZXJpYWwiLCJwYXJhbWV0ZXJzIiwidW5pZm9ybXMiLCJjYWxsIiwidW5pZm9ybVZhbHVlcyIsInNldFZhbHVlcyIsIlVuaWZvcm1zVXRpbHMiLCJtZXJnZSIsInNldFVuaWZvcm1WYWx1ZXMiLCJtYXAiLCJkZWZpbmVzIiwibm9ybWFsTWFwIiwiZW52TWFwIiwiYW9NYXAiLCJzcGVjdWxhck1hcCIsImFscGhhTWFwIiwibGlnaHRNYXAiLCJlbWlzc2l2ZU1hcCIsImJ1bXBNYXAiLCJkaXNwbGFjZW1lbnRNYXAiLCJyb3VnaG5lc3NNYXAiLCJtZXRhbG5lc3NNYXAiLCJlbnZNYXBUeXBlRGVmaW5lIiwiZW52TWFwTW9kZURlZmluZSIsImVudk1hcEJsZW5kaW5nRGVmaW5lIiwibWFwcGluZyIsIkN1YmVSZWZsZWN0aW9uTWFwcGluZyIsIkN1YmVSZWZyYWN0aW9uTWFwcGluZyIsIkN1YmVVVlJlZmxlY3Rpb25NYXBwaW5nIiwiQ3ViZVVWUmVmcmFjdGlvbk1hcHBpbmciLCJFcXVpcmVjdGFuZ3VsYXJSZWZsZWN0aW9uTWFwcGluZyIsIkVxdWlyZWN0YW5ndWxhclJlZnJhY3Rpb25NYXBwaW5nIiwiU3BoZXJpY2FsUmVmbGVjdGlvbk1hcHBpbmciLCJjb21iaW5lIiwiTWl4T3BlcmF0aW9uIiwiQWRkT3BlcmF0aW9uIiwiTXVsdGlwbHlPcGVyYXRpb24iLCJwcm90b3R5cGUiLCJPYmplY3QiLCJhc3NpZ24iLCJjcmVhdGUiLCJTaGFkZXJNYXRlcmlhbCIsInZhbHVlcyIsImtleXMiLCJmb3JFYWNoIiwia2V5IiwidmFsdWUiLCJuYW1lIiwiam9pbiIsIkJhc2ljQW5pbWF0aW9uTWF0ZXJpYWwiLCJ2YXJ5aW5nUGFyYW1ldGVycyIsInZlcnRleFBhcmFtZXRlcnMiLCJ2ZXJ0ZXhGdW5jdGlvbnMiLCJ2ZXJ0ZXhJbml0IiwidmVydGV4Tm9ybWFsIiwidmVydGV4UG9zaXRpb24iLCJ2ZXJ0ZXhDb2xvciIsInZlcnRleFBvc3RNb3JwaCIsInZlcnRleFBvc3RTa2lubmluZyIsImZyYWdtZW50RnVuY3Rpb25zIiwiZnJhZ21lbnRQYXJhbWV0ZXJzIiwiZnJhZ21lbnRJbml0IiwiZnJhZ21lbnRNYXAiLCJmcmFnbWVudERpZmZ1c2UiLCJTaGFkZXJMaWIiLCJsaWdodHMiLCJ2ZXJ0ZXhTaGFkZXIiLCJjb25jYXRWZXJ0ZXhTaGFkZXIiLCJmcmFnbWVudFNoYWRlciIsImNvbmNhdEZyYWdtZW50U2hhZGVyIiwiY29uc3RydWN0b3IiLCJzdHJpbmdpZnlDaHVuayIsIkxhbWJlcnRBbmltYXRpb25NYXRlcmlhbCIsImZyYWdtZW50RW1pc3NpdmUiLCJmcmFnbWVudFNwZWN1bGFyIiwiUGhvbmdBbmltYXRpb25NYXRlcmlhbCIsIlN0YW5kYXJkQW5pbWF0aW9uTWF0ZXJpYWwiLCJmcmFnbWVudFJvdWdobmVzcyIsImZyYWdtZW50TWV0YWxuZXNzIiwiUG9pbnRzQW5pbWF0aW9uTWF0ZXJpYWwiLCJmcmFnbWVudFNoYXBlIiwiRGVwdGhBbmltYXRpb25NYXRlcmlhbCIsImRlcHRoUGFja2luZyIsIlJHQkFEZXB0aFBhY2tpbmciLCJjbGlwcGluZyIsIkRpc3RhbmNlQW5pbWF0aW9uTWF0ZXJpYWwiLCJQcmVmYWJCdWZmZXJHZW9tZXRyeSIsInByZWZhYiIsImNvdW50IiwicHJlZmFiR2VvbWV0cnkiLCJpc1ByZWZhYkJ1ZmZlckdlb21ldHJ5IiwiaXNCdWZmZXJHZW9tZXRyeSIsInByZWZhYkNvdW50IiwicHJlZmFiVmVydGV4Q291bnQiLCJhdHRyaWJ1dGVzIiwicG9zaXRpb24iLCJ2ZXJ0aWNlcyIsImxlbmd0aCIsImJ1ZmZlckluZGljZXMiLCJidWZmZXJQb3NpdGlvbnMiLCJCdWZmZXJHZW9tZXRyeSIsInByZWZhYkluZGljZXMiLCJwcmVmYWJJbmRleENvdW50IiwiaW5kZXgiLCJhcnJheSIsImkiLCJwdXNoIiwicHJlZmFiRmFjZUNvdW50IiwiZmFjZXMiLCJmYWNlIiwiYSIsImIiLCJjIiwiaW5kZXhCdWZmZXIiLCJVaW50MzJBcnJheSIsInNldEluZGV4IiwiQnVmZmVyQXR0cmlidXRlIiwiayIsInBvc2l0aW9uQnVmZmVyIiwiY3JlYXRlQXR0cmlidXRlIiwicG9zaXRpb25zIiwib2Zmc2V0IiwiaiIsInByZWZhYlZlcnRleCIsIngiLCJ5IiwieiIsImJ1ZmZlclV2cyIsInByZWZhYlV2cyIsInV2IiwiVmVjdG9yMiIsImZhY2VWZXJ0ZXhVdnMiLCJ1dkJ1ZmZlciIsInByZWZhYlV2IiwiaXRlbVNpemUiLCJmYWN0b3J5IiwiYnVmZmVyIiwiRmxvYXQzMkFycmF5IiwiYXR0cmlidXRlIiwiYWRkQXR0cmlidXRlIiwiZGF0YSIsInNldFByZWZhYkRhdGEiLCJwcmVmYWJJbmRleCIsIk11bHRpUHJlZmFiQnVmZmVyR2VvbWV0cnkiLCJwcmVmYWJzIiwicmVwZWF0Q291bnQiLCJBcnJheSIsImlzQXJyYXkiLCJwcmVmYWJHZW9tZXRyaWVzIiwicHJlZmFiR2VvbWV0cmllc0NvdW50IiwicHJlZmFiVmVydGV4Q291bnRzIiwicCIsInJlcGVhdFZlcnRleENvdW50IiwicmVkdWNlIiwiciIsInYiLCJyZXBlYXRJbmRleENvdW50IiwiaW5kaWNlcyIsImdlb21ldHJ5IiwiaW5kZXhPZmZzZXQiLCJwcmVmYWJPZmZzZXQiLCJ2ZXJ0ZXhDb3VudCIsInByZWZhYlBvc2l0aW9ucyIsInV2cyIsImVycm9yIiwidXZPYmplY3RzIiwicHJlZmFiR2VvbWV0cnlJbmRleCIsInByZWZhYkdlb21ldHJ5VmVydGV4Q291bnQiLCJ3aG9sZSIsIndob2xlT2Zmc2V0IiwicGFydCIsInBhcnRPZmZzZXQiLCJVdGlscyIsImlsIiwibiIsInZhIiwidmIiLCJ2YyIsImNsb25lIiwiVmVjdG9yMyIsImJveCIsInRNYXRoIiwicmFuZEZsb2F0IiwibWluIiwibWF4IiwicmFuZEZsb2F0U3ByZWFkIiwibm9ybWFsaXplIiwic291cmNlTWF0ZXJpYWwiLCJNb2RlbEJ1ZmZlckdlb21ldHJ5IiwibW9kZWwiLCJvcHRpb25zIiwibW9kZWxHZW9tZXRyeSIsImZhY2VDb3VudCIsImNvbXB1dGVDZW50cm9pZHMiLCJsb2NhbGl6ZUZhY2VzIiwiY2VudHJvaWRzIiwiY29tcHV0ZUNlbnRyb2lkIiwiY2VudHJvaWQiLCJ2ZXJ0ZXgiLCJidWZmZXJVVnMiLCJidWZmZXJTa2lubmluZyIsInNraW5JbmRleEJ1ZmZlciIsInNraW5XZWlnaHRCdWZmZXIiLCJza2luSW5kZXgiLCJza2luSW5kaWNlcyIsInNraW5XZWlnaHQiLCJza2luV2VpZ2h0cyIsInciLCJzZXRGYWNlRGF0YSIsImZhY2VJbmRleCIsIlBvaW50QnVmZmVyR2VvbWV0cnkiLCJwb2ludENvdW50Iiwic2V0UG9pbnREYXRhIiwicG9pbnRJbmRleCIsIlNoYWRlckNodW5rIiwiY2F0bXVsbF9yb21fc3BsaW5lIiwiY3ViaWNfYmV6aWVyIiwiZWFzZV9iYWNrX2luIiwiZWFzZV9iYWNrX2luX291dCIsImVhc2VfYmFja19vdXQiLCJlYXNlX2JlemllciIsImVhc2VfYm91bmNlX2luIiwiZWFzZV9ib3VuY2VfaW5fb3V0IiwiZWFzZV9ib3VuY2Vfb3V0IiwiZWFzZV9jaXJjX2luIiwiZWFzZV9jaXJjX2luX291dCIsImVhc2VfY2lyY19vdXQiLCJlYXNlX2N1YmljX2luIiwiZWFzZV9jdWJpY19pbl9vdXQiLCJlYXNlX2N1YmljX291dCIsImVhc2VfZWxhc3RpY19pbiIsImVhc2VfZWxhc3RpY19pbl9vdXQiLCJlYXNlX2VsYXN0aWNfb3V0IiwiZWFzZV9leHBvX2luIiwiZWFzZV9leHBvX2luX291dCIsImVhc2VfZXhwb19vdXQiLCJlYXNlX3F1YWRfaW4iLCJlYXNlX3F1YWRfaW5fb3V0IiwiZWFzZV9xdWFkX291dCIsImVhc2VfcXVhcnRfaW4iLCJlYXNlX3F1YXJ0X2luX291dCIsImVhc2VfcXVhcnRfb3V0IiwiZWFzZV9xdWludF9pbiIsImVhc2VfcXVpbnRfaW5fb3V0IiwiZWFzZV9xdWludF9vdXQiLCJlYXNlX3NpbmVfaW4iLCJlYXNlX3NpbmVfaW5fb3V0IiwiZWFzZV9zaW5lX291dCIsInF1YWRyYXRpY19iZXppZXIiLCJxdWF0ZXJuaW9uX3JvdGF0aW9uIiwicXVhdGVybmlvbl9zbGVycCIsIlRpbWVsaW5lU2VnbWVudCIsInN0YXJ0IiwiZHVyYXRpb24iLCJ0cmFuc2l0aW9uIiwiY29tcGlsZXIiLCJ0cmFpbCIsImNvbXBpbGUiLCJkZWZpbmVQcm9wZXJ0eSIsIlRpbWVsaW5lIiwidGltZUtleSIsInNlZ21lbnRzIiwiX19rZXkiLCJzZWdtZW50RGVmaW5pdGlvbnMiLCJyZWdpc3RlciIsImRlZmluaXRpb24iLCJhZGQiLCJ0cmFuc2l0aW9ucyIsInBvc2l0aW9uT2Zmc2V0IiwiX2V2YWwiLCJldmFsIiwidW5kZWZpbmVkIiwiTWF0aCIsInByb2Nlc3NUcmFuc2l0aW9uIiwiZnJvbSIsImRlZmF1bHRGcm9tIiwidG8iLCJ0b1N0cmluZyIsImZpbGxHYXBzIiwicyIsInMwIiwiczEiLCJlbmQiLCJnZXRUcmFuc2Zvcm1DYWxscyIsInQiLCJUaW1lbGluZUNodW5rcyIsInRvUHJlY2lzaW9uIiwic2VnbWVudCIsImVhc2UiLCJlYXNlUGFyYW1zIiwic3RhcnRUaW1lIiwiZW5kVGltZSIsIlRyYW5zbGF0aW9uU2VnbWVudCIsImRlbGF5RHVyYXRpb24iLCJ2ZWMzIiwicmVuZGVyQ2hlY2siLCJwcm9ncmVzcyIsIlNjYWxlU2VnbWVudCIsIm9yaWdpbiIsIlJvdGF0aW9uU2VnbWVudCIsImZyb21B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
