import { AddOperation, BufferAttribute, BufferGeometry, CubeReflectionMapping, CubeRefractionMapping, CubeUVReflectionMapping, CubeUVRefractionMapping, EquirectangularReflectionMapping, EquirectangularRefractionMapping, InstancedBufferAttribute, InstancedBufferGeometry, Math as Math$1, MixOperation, MultiplyOperation, RGBADepthPacking, ShaderLib, ShaderMaterial, SphericalReflectionMapping, UniformsUtils, Vector3, Vector4 } from 'three';

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
    uniformValues.gradientMap && (this.defines['USE_GRADIENTMAP'] = '');

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
  return '\n  #define LAMBERT\n\n  varying vec3 vLightFront;\n  \n  #ifdef DOUBLE_SIDED\n  \n    varying vec3 vLightBack;\n  \n  #endif\n  \n  #include <common>\n  #include <uv_pars_vertex>\n  #include <uv2_pars_vertex>\n  #include <envmap_pars_vertex>\n  #include <bsdfs>\n  #include <lights_pars_begin>\n  #include <envmap_physical_pars_fragment>\n  #include <color_pars_vertex>\n  #include <fog_pars_vertex>\n  #include <morphtarget_pars_vertex>\n  #include <skinning_pars_vertex>\n  #include <shadowmap_pars_vertex>\n  #include <logdepthbuf_pars_vertex>\n  #include <clipping_planes_pars_vertex>\n  \n  ' + this.stringifyChunk('vertexParameters') + '\n  ' + this.stringifyChunk('varyingParameters') + '\n  ' + this.stringifyChunk('vertexFunctions') + '\n  \n  void main() {\n  \n    ' + this.stringifyChunk('vertexInit') + '\n  \n    #include <uv_vertex>\n    #include <uv2_vertex>\n    #include <color_vertex>\n  \n    #include <beginnormal_vertex>\n    \n    ' + this.stringifyChunk('vertexNormal') + '\n    \n    #include <morphnormal_vertex>\n    #include <skinbase_vertex>\n    #include <skinnormal_vertex>\n    #include <defaultnormal_vertex>\n  \n    #include <begin_vertex>\n    \n    ' + this.stringifyChunk('vertexPosition') + '\n    ' + this.stringifyChunk('vertexColor') + '\n    \n    #include <morphtarget_vertex>\n    \n    ' + this.stringifyChunk('vertexPostMorph') + '\n    \n    #include <skinning_vertex>\n\n    ' + this.stringifyChunk('vertexPostSkinning') + '\n    \n    #include <project_vertex>\n    #include <logdepthbuf_vertex>\n    #include <clipping_planes_vertex>\n  \n    #include <worldpos_vertex>\n    #include <envmap_vertex>\n    #include <lights_lambert_vertex>\n    #include <shadowmap_vertex>\n    #include <fog_vertex>\n  }';
};

LambertAnimationMaterial.prototype.concatFragmentShader = function () {
  return '\n  uniform vec3 diffuse;\n  uniform vec3 emissive;\n  uniform float opacity;\n  \n  varying vec3 vLightFront;\n  \n  #ifdef DOUBLE_SIDED\n  \n    varying vec3 vLightBack;\n  \n  #endif\n  \n  #include <common>\n  #include <packing>\n  #include <dithering_pars_fragment>\n  #include <color_pars_fragment>\n  #include <uv_pars_fragment>\n  #include <uv2_pars_fragment>\n  #include <map_pars_fragment>\n  #include <alphamap_pars_fragment>\n  #include <aomap_pars_fragment>\n  #include <lightmap_pars_fragment>\n  #include <emissivemap_pars_fragment>\n  #include <envmap_pars_fragment>\n  #include <bsdfs>\n  #include <lights_pars_begin>\n  #include <envmap_physical_pars_fragment>\n  #include <fog_pars_fragment>\n  #include <shadowmap_pars_fragment>\n  #include <shadowmask_pars_fragment>\n  #include <specularmap_pars_fragment>\n  #include <logdepthbuf_pars_fragment>\n  #include <clipping_planes_pars_fragment>\n  \n  ' + this.stringifyChunk('fragmentParameters') + '\n  ' + this.stringifyChunk('varyingParameters') + '\n  ' + this.stringifyChunk('fragmentFunctions') + '\n  \n  void main() {\n  \n    ' + this.stringifyChunk('fragmentInit') + '\n  \n    #include <clipping_planes_fragment>\n\n    vec4 diffuseColor = vec4( diffuse, opacity );\n    ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );\n    vec3 totalEmissiveRadiance = emissive;\n\t\n    ' + this.stringifyChunk('fragmentDiffuse') + '\n  \n    #include <logdepthbuf_fragment>\n\n    ' + (this.stringifyChunk('fragmentMap') || '#include <map_fragment>') + '\n\n    #include <color_fragment>\n    #include <alphamap_fragment>\n    #include <alphatest_fragment>\n    #include <specularmap_fragment>\n\n    ' + this.stringifyChunk('fragmentEmissive') + '\n\n    #include <emissivemap_fragment>\n  \n    // accumulation\n    reflectedLight.indirectDiffuse = getAmbientLightIrradiance( ambientLightColor );\n  \n    #include <lightmap_fragment>\n  \n    reflectedLight.indirectDiffuse *= BRDF_Diffuse_Lambert( diffuseColor.rgb );\n  \n    #ifdef DOUBLE_SIDED\n  \n      reflectedLight.directDiffuse = ( gl_FrontFacing ) ? vLightFront : vLightBack;\n  \n    #else\n  \n      reflectedLight.directDiffuse = vLightFront;\n  \n    #endif\n  \n    reflectedLight.directDiffuse *= BRDF_Diffuse_Lambert( diffuseColor.rgb ) * getShadowMask();\n  \n    // modulation\n    #include <aomap_fragment>\n  \n    vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;\n  \n    #include <envmap_fragment>\n  \n    gl_FragColor = vec4( outgoingLight, diffuseColor.a );\n  \n    #include <tonemapping_fragment>\n    #include <encodings_fragment>\n    #include <fog_fragment>\n    #include <premultiplied_alpha_fragment>\n    #include <dithering_fragment>\n  }';
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
  return '\n  #define PHONG\n\n  varying vec3 vViewPosition;\n\n  #ifndef FLAT_SHADED\n\n    varying vec3 vNormal;\n\n  #endif\n\n  #include <common>\n  #include <uv_pars_vertex>\n  #include <uv2_pars_vertex>\n  #include <displacementmap_pars_vertex>\n  #include <envmap_pars_vertex>\n  #include <color_pars_vertex>\n  #include <fog_pars_vertex>\n  #include <morphtarget_pars_vertex>\n  #include <skinning_pars_vertex>\n  #include <shadowmap_pars_vertex>\n  #include <logdepthbuf_pars_vertex>\n  #include <clipping_planes_pars_vertex>\n\n  ' + this.stringifyChunk('vertexParameters') + '\n  ' + this.stringifyChunk('varyingParameters') + '\n  ' + this.stringifyChunk('vertexFunctions') + '\n\n  void main() {\n\n    ' + this.stringifyChunk('vertexInit') + '\n\n    #include <uv_vertex>\n    #include <uv2_vertex>\n    #include <color_vertex>\n\n    #include <beginnormal_vertex>\n\n    ' + this.stringifyChunk('vertexNormal') + '\n\n    #include <morphnormal_vertex>\n    #include <skinbase_vertex>\n    #include <skinnormal_vertex>\n    #include <defaultnormal_vertex>\n\n  #ifndef FLAT_SHADED // Normal computed with derivatives when FLAT_SHADED\n\n    vNormal = normalize( transformedNormal );\n\n  #endif\n\n    #include <begin_vertex>\n\n    ' + this.stringifyChunk('vertexPosition') + '\n    ' + this.stringifyChunk('vertexColor') + '\n\n    #include <morphtarget_vertex>\n    #include <skinning_vertex>\n    #include <displacementmap_vertex>\n    #include <project_vertex>\n    #include <logdepthbuf_vertex>\n    #include <clipping_planes_vertex>\n\n    vViewPosition = - mvPosition.xyz;\n\n    #include <worldpos_vertex>\n    #include <envmap_vertex>\n    #include <shadowmap_vertex>\n    #include <fog_vertex>\n  }';
};

PhongAnimationMaterial.prototype.concatFragmentShader = function () {
  return '\n  #define PHONG\n\n  uniform vec3 diffuse;\n  uniform vec3 emissive;\n  uniform vec3 specular;\n  uniform float shininess;\n  uniform float opacity;\n\n  #include <common>\n  #include <packing>\n  #include <dithering_pars_fragment>\n  #include <color_pars_fragment>\n  #include <uv_pars_fragment>\n  #include <uv2_pars_fragment>\n  #include <map_pars_fragment>\n  #include <alphamap_pars_fragment>\n  #include <aomap_pars_fragment>\n  #include <lightmap_pars_fragment>\n  #include <emissivemap_pars_fragment>\n  #include <envmap_pars_fragment>\n  #include <gradientmap_pars_fragment>\n  #include <fog_pars_fragment>\n  #include <bsdfs>\n  #include <lights_pars_begin>\n  #include <envmap_physical_pars_fragment>\n  #include <lights_phong_pars_fragment>\n  #include <shadowmap_pars_fragment>\n  #include <bumpmap_pars_fragment>\n  #include <normalmap_pars_fragment>\n  #include <specularmap_pars_fragment>\n  #include <logdepthbuf_pars_fragment>\n  #include <clipping_planes_pars_fragment>\n\n  ' + this.stringifyChunk('fragmentParameters') + '\n  ' + this.stringifyChunk('varyingParameters') + '\n  ' + this.stringifyChunk('fragmentFunctions') + '\n\n  void main() {\n\n    ' + this.stringifyChunk('fragmentInit') + '\n\n    #include <clipping_planes_fragment>\n\n    vec4 diffuseColor = vec4( diffuse, opacity );\n    ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );\n    vec3 totalEmissiveRadiance = emissive;\n\n    ' + this.stringifyChunk('fragmentDiffuse') + '\n\n    #include <logdepthbuf_fragment>\n\n    ' + (this.stringifyChunk('fragmentMap') || '#include <map_fragment>') + '\n\n    #include <color_fragment>\n    #include <alphamap_fragment>\n    #include <alphatest_fragment>\n    #include <specularmap_fragment>\n    #include <normal_fragment_begin>\n    #include <normal_fragment_maps>\n\n    ' + this.stringifyChunk('fragmentEmissive') + '\n\n    #include <emissivemap_fragment>\n\n    // accumulation\n    #include <lights_phong_fragment>\n    #include <lights_fragment_begin>\n    #include <lights_fragment_maps>\n    #include <lights_fragment_end>\n\n    ' + this.stringifyChunk('fragmentSpecular') + '\n\n    // modulation\n    #include <aomap_fragment>\n\n    vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;\n\n    #include <envmap_fragment>\n\n    gl_FragColor = vec4( outgoingLight, diffuseColor.a );\n\n    #include <tonemapping_fragment>\n    #include <encodings_fragment>\n    #include <fog_fragment>\n    #include <premultiplied_alpha_fragment>\n    #include <dithering_fragment>\n\n  }';
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
  return '\n  #define PHYSICAL\n  \n  uniform vec3 diffuse;\n  uniform vec3 emissive;\n  uniform float roughness;\n  uniform float metalness;\n  uniform float opacity;\n  \n  #ifndef STANDARD\n    uniform float clearCoat;\n    uniform float clearCoatRoughness;\n  #endif\n  \n  varying vec3 vViewPosition;\n  \n  #ifndef FLAT_SHADED\n  \n    varying vec3 vNormal;\n  \n  #endif\n  \n  #include <common>\n  #include <packing>\n  #include <dithering_pars_fragment>\n  #include <color_pars_fragment>\n  #include <uv_pars_fragment>\n  #include <uv2_pars_fragment>\n  #include <map_pars_fragment>\n  #include <alphamap_pars_fragment>\n  #include <aomap_pars_fragment>\n  #include <lightmap_pars_fragment>\n  #include <emissivemap_pars_fragment>\n  #include <envmap_pars_fragment>\n  #include <fog_pars_fragment>\n  #include <bsdfs>\n  #include <cube_uv_reflection_fragment>\n  #include <lights_pars_begin>\n  #include <envmap_physical_pars_fragment>\n  #include <lights_physical_pars_fragment>\n  #include <shadowmap_pars_fragment>\n  #include <bumpmap_pars_fragment>\n  #include <normalmap_pars_fragment>\n  #include <roughnessmap_pars_fragment>\n  #include <metalnessmap_pars_fragment>\n  #include <logdepthbuf_pars_fragment>\n  #include <clipping_planes_pars_fragment>\n  \n  ' + this.stringifyChunk('fragmentParameters') + '\n  ' + this.stringifyChunk('varyingParameters') + '\n  ' + this.stringifyChunk('fragmentFunctions') + '\n  \n  void main() {\n  \n    ' + this.stringifyChunk('fragmentInit') + '\n  \n    #include <clipping_planes_fragment>\n  \n    vec4 diffuseColor = vec4( diffuse, opacity );\n    ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );\n    vec3 totalEmissiveRadiance = emissive;\n  \n    ' + this.stringifyChunk('fragmentDiffuse') + '\n  \n    #include <logdepthbuf_fragment>\n\n    ' + (this.stringifyChunk('fragmentMap') || '#include <map_fragment>') + '\n\n    #include <color_fragment>\n    #include <alphamap_fragment>\n    #include <alphatest_fragment>\n    \n    float roughnessFactor = roughness;\n    ' + this.stringifyChunk('fragmentRoughness') + '\n    #ifdef USE_ROUGHNESSMAP\n    \n      vec4 texelRoughness = texture2D( roughnessMap, vUv );\n    \n      // reads channel G, compatible with a combined OcclusionRoughnessMetallic (RGB) texture\n      roughnessFactor *= texelRoughness.g;\n    \n    #endif\n    \n    float metalnessFactor = metalness;\n    ' + this.stringifyChunk('fragmentMetalness') + '\n    #ifdef USE_METALNESSMAP\n    \n      vec4 texelMetalness = texture2D( metalnessMap, vUv );\n      metalnessFactor *= texelMetalness.b;\n    \n    #endif\n    \n    #include <normal_fragment_begin>\n    #include <normal_fragment_maps>\n    \n    ' + this.stringifyChunk('fragmentEmissive') + '\n    \n    #include <emissivemap_fragment>\n  \n    // accumulation\n    #include <lights_physical_fragment>\n    #include <lights_fragment_begin>\n    #include <lights_fragment_maps>\n    #include <lights_fragment_end>\n  \n    // modulation\n    #include <aomap_fragment>\n  \n    vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;\n  \n    gl_FragColor = vec4( outgoingLight, diffuseColor.a );\n  \n    #include <tonemapping_fragment>\n    #include <encodings_fragment>\n    #include <fog_fragment>\n    #include <premultiplied_alpha_fragment>\n    #include <dithering_fragment>\n  \n  }';
};

function ToonAnimationMaterial(parameters) {
  if (!parameters.defines) {
    parameters.defines = {};
  }
  parameters.defines['TOON'] = '';

  PhongAnimationMaterial.call(this, parameters);
}
ToonAnimationMaterial.prototype = Object.create(PhongAnimationMaterial.prototype);
ToonAnimationMaterial.prototype.constructor = ToonAnimationMaterial;

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
  var uvBuffer = this.createAttribute('uv', 2).array;

  if (this.isPrefabBufferGeometry) {
    var uvs = this.prefabGeometry.attributes.uv.array;

    for (var i = 0, offset = 0; i < this.prefabCount; i++) {
      for (var j = 0; j < this.prefabVertexCount; j++, offset += 2) {
        uvBuffer[offset] = uvs[j * 2];
        uvBuffer[offset + 1] = uvs[j * 2 + 1];
      }
    }
  } else {
    var prefabFaceCount = this.prefabGeometry.faces.length;
    var _uvs = [];

    for (var _i4 = 0; _i4 < prefabFaceCount; _i4++) {
      var face = this.prefabGeometry.faces[_i4];
      var uv = this.prefabGeometry.faceVertexUvs[0][_i4];

      _uvs[face.a] = uv[0];
      _uvs[face.b] = uv[1];
      _uvs[face.c] = uv[2];
    }

    for (var _i5 = 0, _offset2 = 0; _i5 < this.prefabCount; _i5++) {
      for (var _j2 = 0; _j2 < this.prefabVertexCount; _j2++, _offset2 += 2) {
        var _uv = _uvs[_j2];

        uvBuffer[_offset2] = _uv.x;
        uvBuffer[_offset2 + 1] = _uv.y;
      }
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

/**
 * A wrapper around THREE.InstancedBufferGeometry, which is more memory efficient than PrefabBufferGeometry, but requires the ANGLE_instanced_arrays extension.
 *
 * @param {BufferGeometry} prefab The Geometry instance to repeat.
 * @param {Number} count The number of times to repeat the geometry.
 *
 * @constructor
 */
function InstancedPrefabBufferGeometry(prefab, count) {
  if (prefab.isGeometry === true) {
    console.error('InstancedPrefabBufferGeometry prefab must be a BufferGeometry.');
  }

  InstancedBufferGeometry.call(this);

  this.prefabGeometry = prefab;
  this.copy(prefab);

  this.maxInstancedCount = count;
  this.prefabCount = count;
}
InstancedPrefabBufferGeometry.prototype = Object.create(InstancedBufferGeometry.prototype);
InstancedPrefabBufferGeometry.prototype.constructor = InstancedPrefabBufferGeometry;

/**
 * Creates a BufferAttribute on this geometry instance.
 *
 * @param {String} name Name of the attribute.
 * @param {Number} itemSize Number of floats per vertex (typically 1, 2, 3 or 4).
 * @param {function=} factory Function that will be called for each prefab upon creation. Accepts 3 arguments: data[], index and prefabCount. Calls setPrefabData.
 *
 * @returns {BufferAttribute}
 */
InstancedPrefabBufferGeometry.prototype.createAttribute = function (name, itemSize, factory) {
  var buffer = new Float32Array(this.prefabCount * itemSize);
  var attribute = new InstancedBufferAttribute(buffer, itemSize);

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
 * Sets data for a prefab at a given index.
 * Usually called in a loop.
 *
 * @param {String|BufferAttribute} attribute The attribute or attribute name where the data is to be stored.
 * @param {Number} prefabIndex Index of the prefab in the buffer geometry.
 * @param {Array} data Array of data. Length should be equal to item size of the attribute.
 */
InstancedPrefabBufferGeometry.prototype.setPrefabData = function (attribute, prefabIndex, data) {
  attribute = typeof attribute === 'string' ? this.attributes[attribute] : attribute;

  var offset = prefabIndex * attribute.itemSize;

  for (var j = 0; j < attribute.itemSize; j++) {
    attribute.array[offset++] = data[j];
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
ModelBufferGeometry.prototype.bufferUvs = function () {
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

var quadratic_bezier = "vec3 quadraticBezier(vec3 p0, vec3 c0, vec3 p1, float t) {\n    float tn = 1.0 - t;\n    return tn * tn * p0 + 2.0 * tn * t * c0 + t * t * p1;\n}\nvec2 quadraticBezier(vec2 p0, vec2 c0, vec2 p1, float t) {\n    float tn = 1.0 - t;\n    return tn * tn * p0 + 2.0 * tn * t * c0 + t * t * p1;\n}";

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

export { BasicAnimationMaterial, LambertAnimationMaterial, PhongAnimationMaterial, StandardAnimationMaterial, ToonAnimationMaterial, PointsAnimationMaterial, DepthAnimationMaterial, DistanceAnimationMaterial, PrefabBufferGeometry, MultiPrefabBufferGeometry, InstancedPrefabBufferGeometry, ModelBufferGeometry, PointBufferGeometry, ShaderChunk, Timeline, TimelineSegment, TimelineChunks, TranslationSegment, ScaleSegment, RotationSegment, Utils };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzLm1vZHVsZS5qcyIsInNvdXJjZXMiOlsiLi4vc3JjL21hdGVyaWFscy9CYXNlQW5pbWF0aW9uTWF0ZXJpYWwuanMiLCIuLi9zcmMvbWF0ZXJpYWxzL0Jhc2ljQW5pbWF0aW9uTWF0ZXJpYWwuanMiLCIuLi9zcmMvbWF0ZXJpYWxzL0xhbWJlcnRBbmltYXRpb25NYXRlcmlhbC5qcyIsIi4uL3NyYy9tYXRlcmlhbHMvUGhvbmdBbmltYXRpb25NYXRlcmlhbC5qcyIsIi4uL3NyYy9tYXRlcmlhbHMvU3RhbmRhcmRBbmltYXRpb25NYXRlcmlhbC5qcyIsIi4uL3NyYy9tYXRlcmlhbHMvVG9vbkFuaW1hdGlvbk1hdGVyaWFsLmpzIiwiLi4vc3JjL21hdGVyaWFscy9Qb2ludHNBbmltYXRpb25NYXRlcmlhbC5qcyIsIi4uL3NyYy9tYXRlcmlhbHMvRGVwdGhBbmltYXRpb25NYXRlcmlhbC5qcyIsIi4uL3NyYy9tYXRlcmlhbHMvRGlzdGFuY2VBbmltYXRpb25NYXRlcmlhbC5qcyIsIi4uL3NyYy9nZW9tZXRyeS9QcmVmYWJCdWZmZXJHZW9tZXRyeS5qcyIsIi4uL3NyYy9nZW9tZXRyeS9NdWx0aVByZWZhYkJ1ZmZlckdlb21ldHJ5LmpzIiwiLi4vc3JjL2dlb21ldHJ5L0luc3RhbmNlZFByZWZhYkJ1ZmZlckdlb21ldHJ5LmpzIiwiLi4vc3JjL1V0aWxzLmpzIiwiLi4vc3JjL2dlb21ldHJ5L01vZGVsQnVmZmVyR2VvbWV0cnkuanMiLCIuLi9zcmMvZ2VvbWV0cnkvUG9pbnRCdWZmZXJHZW9tZXRyeS5qcyIsIi4uL3NyYy9TaGFkZXJDaHVuay5qcyIsIi4uL3NyYy90aW1lbGluZS9UaW1lbGluZVNlZ21lbnQuanMiLCIuLi9zcmMvdGltZWxpbmUvVGltZWxpbmUuanMiLCIuLi9zcmMvdGltZWxpbmUvVGltZWxpbmVDaHVua3MuanMiLCIuLi9zcmMvdGltZWxpbmUvVHJhbnNsYXRpb25TZWdtZW50LmpzIiwiLi4vc3JjL3RpbWVsaW5lL1NjYWxlU2VnbWVudC5qcyIsIi4uL3NyYy90aW1lbGluZS9Sb3RhdGlvblNlZ21lbnQuanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgU2hhZGVyTWF0ZXJpYWwsXG4gIFVuaWZvcm1zVXRpbHMsXG4gIEN1YmVSZWZsZWN0aW9uTWFwcGluZyxcbiAgQ3ViZVJlZnJhY3Rpb25NYXBwaW5nLFxuICBDdWJlVVZSZWZsZWN0aW9uTWFwcGluZyxcbiAgQ3ViZVVWUmVmcmFjdGlvbk1hcHBpbmcsXG4gIEVxdWlyZWN0YW5ndWxhclJlZmxlY3Rpb25NYXBwaW5nLFxuICBFcXVpcmVjdGFuZ3VsYXJSZWZyYWN0aW9uTWFwcGluZyxcbiAgU3BoZXJpY2FsUmVmbGVjdGlvbk1hcHBpbmcsXG4gIE1peE9wZXJhdGlvbixcbiAgQWRkT3BlcmF0aW9uLFxuICBNdWx0aXBseU9wZXJhdGlvblxufSBmcm9tICd0aHJlZSc7XG5cbmZ1bmN0aW9uIEJhc2VBbmltYXRpb25NYXRlcmlhbChwYXJhbWV0ZXJzLCB1bmlmb3Jtcykge1xuICBTaGFkZXJNYXRlcmlhbC5jYWxsKHRoaXMpO1xuXG4gIGNvbnN0IHVuaWZvcm1WYWx1ZXMgPSBwYXJhbWV0ZXJzLnVuaWZvcm1WYWx1ZXM7XG4gIGRlbGV0ZSBwYXJhbWV0ZXJzLnVuaWZvcm1WYWx1ZXM7XG5cbiAgdGhpcy5zZXRWYWx1ZXMocGFyYW1ldGVycyk7XG5cbiAgdGhpcy51bmlmb3JtcyA9IFVuaWZvcm1zVXRpbHMubWVyZ2UoW3VuaWZvcm1zLCB0aGlzLnVuaWZvcm1zXSk7XG5cbiAgdGhpcy5zZXRVbmlmb3JtVmFsdWVzKHVuaWZvcm1WYWx1ZXMpO1xuXG4gIGlmICh1bmlmb3JtVmFsdWVzKSB7XG4gICAgdW5pZm9ybVZhbHVlcy5tYXAgJiYgKHRoaXMuZGVmaW5lc1snVVNFX01BUCddID0gJycpO1xuICAgIHVuaWZvcm1WYWx1ZXMubm9ybWFsTWFwICYmICh0aGlzLmRlZmluZXNbJ1VTRV9OT1JNQUxNQVAnXSA9ICcnKTtcbiAgICB1bmlmb3JtVmFsdWVzLmVudk1hcCAmJiAodGhpcy5kZWZpbmVzWydVU0VfRU5WTUFQJ10gPSAnJyk7XG4gICAgdW5pZm9ybVZhbHVlcy5hb01hcCAmJiAodGhpcy5kZWZpbmVzWydVU0VfQU9NQVAnXSA9ICcnKTtcbiAgICB1bmlmb3JtVmFsdWVzLnNwZWN1bGFyTWFwICYmICh0aGlzLmRlZmluZXNbJ1VTRV9TUEVDVUxBUk1BUCddID0gJycpO1xuICAgIHVuaWZvcm1WYWx1ZXMuYWxwaGFNYXAgJiYgKHRoaXMuZGVmaW5lc1snVVNFX0FMUEhBTUFQJ10gPSAnJyk7XG4gICAgdW5pZm9ybVZhbHVlcy5saWdodE1hcCAmJiAodGhpcy5kZWZpbmVzWydVU0VfTElHSFRNQVAnXSA9ICcnKTtcbiAgICB1bmlmb3JtVmFsdWVzLmVtaXNzaXZlTWFwICYmICh0aGlzLmRlZmluZXNbJ1VTRV9FTUlTU0lWRU1BUCddID0gJycpO1xuICAgIHVuaWZvcm1WYWx1ZXMuYnVtcE1hcCAmJiAodGhpcy5kZWZpbmVzWydVU0VfQlVNUE1BUCddID0gJycpO1xuICAgIHVuaWZvcm1WYWx1ZXMuZGlzcGxhY2VtZW50TWFwICYmICh0aGlzLmRlZmluZXNbJ1VTRV9ESVNQTEFDRU1FTlRNQVAnXSA9ICcnKTtcbiAgICB1bmlmb3JtVmFsdWVzLnJvdWdobmVzc01hcCAmJiAodGhpcy5kZWZpbmVzWydVU0VfRElTUExBQ0VNRU5UTUFQJ10gPSAnJyk7XG4gICAgdW5pZm9ybVZhbHVlcy5yb3VnaG5lc3NNYXAgJiYgKHRoaXMuZGVmaW5lc1snVVNFX1JPVUdITkVTU01BUCddID0gJycpO1xuICAgIHVuaWZvcm1WYWx1ZXMubWV0YWxuZXNzTWFwICYmICh0aGlzLmRlZmluZXNbJ1VTRV9NRVRBTE5FU1NNQVAnXSA9ICcnKTtcbiAgICB1bmlmb3JtVmFsdWVzLmdyYWRpZW50TWFwICYmICh0aGlzLmRlZmluZXNbJ1VTRV9HUkFESUVOVE1BUCddID0gJycpO1xuXG4gICAgaWYgKHVuaWZvcm1WYWx1ZXMuZW52TWFwKSB7XG4gICAgICB0aGlzLmRlZmluZXNbJ1VTRV9FTlZNQVAnXSA9ICcnO1xuXG4gICAgICBsZXQgZW52TWFwVHlwZURlZmluZSA9ICdFTlZNQVBfVFlQRV9DVUJFJztcbiAgICAgIGxldCBlbnZNYXBNb2RlRGVmaW5lID0gJ0VOVk1BUF9NT0RFX1JFRkxFQ1RJT04nO1xuICAgICAgbGV0IGVudk1hcEJsZW5kaW5nRGVmaW5lID0gJ0VOVk1BUF9CTEVORElOR19NVUxUSVBMWSc7XG5cbiAgICAgIHN3aXRjaCAodW5pZm9ybVZhbHVlcy5lbnZNYXAubWFwcGluZykge1xuICAgICAgICBjYXNlIEN1YmVSZWZsZWN0aW9uTWFwcGluZzpcbiAgICAgICAgY2FzZSBDdWJlUmVmcmFjdGlvbk1hcHBpbmc6XG4gICAgICAgICAgZW52TWFwVHlwZURlZmluZSA9ICdFTlZNQVBfVFlQRV9DVUJFJztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDdWJlVVZSZWZsZWN0aW9uTWFwcGluZzpcbiAgICAgICAgY2FzZSBDdWJlVVZSZWZyYWN0aW9uTWFwcGluZzpcbiAgICAgICAgICBlbnZNYXBUeXBlRGVmaW5lID0gJ0VOVk1BUF9UWVBFX0NVQkVfVVYnO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIEVxdWlyZWN0YW5ndWxhclJlZmxlY3Rpb25NYXBwaW5nOlxuICAgICAgICBjYXNlIEVxdWlyZWN0YW5ndWxhclJlZnJhY3Rpb25NYXBwaW5nOlxuICAgICAgICAgIGVudk1hcFR5cGVEZWZpbmUgPSAnRU5WTUFQX1RZUEVfRVFVSVJFQyc7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgU3BoZXJpY2FsUmVmbGVjdGlvbk1hcHBpbmc6XG4gICAgICAgICAgZW52TWFwVHlwZURlZmluZSA9ICdFTlZNQVBfVFlQRV9TUEhFUkUnO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBzd2l0Y2ggKHVuaWZvcm1WYWx1ZXMuZW52TWFwLm1hcHBpbmcpIHtcbiAgICAgICAgY2FzZSBDdWJlUmVmcmFjdGlvbk1hcHBpbmc6XG4gICAgICAgIGNhc2UgRXF1aXJlY3Rhbmd1bGFyUmVmcmFjdGlvbk1hcHBpbmc6XG4gICAgICAgICAgZW52TWFwTW9kZURlZmluZSA9ICdFTlZNQVBfTU9ERV9SRUZSQUNUSU9OJztcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgc3dpdGNoICh1bmlmb3JtVmFsdWVzLmNvbWJpbmUpIHtcbiAgICAgICAgY2FzZSBNaXhPcGVyYXRpb246XG4gICAgICAgICAgZW52TWFwQmxlbmRpbmdEZWZpbmUgPSAnRU5WTUFQX0JMRU5ESU5HX01JWCc7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQWRkT3BlcmF0aW9uOlxuICAgICAgICAgIGVudk1hcEJsZW5kaW5nRGVmaW5lID0gJ0VOVk1BUF9CTEVORElOR19BREQnO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIE11bHRpcGx5T3BlcmF0aW9uOlxuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIGVudk1hcEJsZW5kaW5nRGVmaW5lID0gJ0VOVk1BUF9CTEVORElOR19NVUxUSVBMWSc7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuZGVmaW5lc1tlbnZNYXBUeXBlRGVmaW5lXSA9ICcnO1xuICAgICAgdGhpcy5kZWZpbmVzW2Vudk1hcEJsZW5kaW5nRGVmaW5lXSA9ICcnO1xuICAgICAgdGhpcy5kZWZpbmVzW2Vudk1hcE1vZGVEZWZpbmVdID0gJyc7XG4gICAgfVxuICB9XG59XG5cbkJhc2VBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUgPSBPYmplY3QuYXNzaWduKE9iamVjdC5jcmVhdGUoU2hhZGVyTWF0ZXJpYWwucHJvdG90eXBlKSwge1xuICBjb25zdHJ1Y3RvcjogQmFzZUFuaW1hdGlvbk1hdGVyaWFsLFxuXG4gIHNldFVuaWZvcm1WYWx1ZXModmFsdWVzKSB7XG4gICAgaWYgKCF2YWx1ZXMpIHJldHVybjtcblxuICAgIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyh2YWx1ZXMpO1xuXG4gICAga2V5cy5mb3JFYWNoKChrZXkpID0+IHtcbiAgICAgIGtleSBpbiB0aGlzLnVuaWZvcm1zICYmICh0aGlzLnVuaWZvcm1zW2tleV0udmFsdWUgPSB2YWx1ZXNba2V5XSk7XG4gICAgfSk7XG4gIH0sXG5cbiAgc3RyaW5naWZ5Q2h1bmsobmFtZSkge1xuICAgIGxldCB2YWx1ZTtcblxuICAgIGlmICghdGhpc1tuYW1lXSkge1xuICAgICAgdmFsdWUgPSAnJztcbiAgICB9XG4gICAgZWxzZSBpZiAodHlwZW9mIHRoaXNbbmFtZV0gPT09ICAnc3RyaW5nJykge1xuICAgICAgdmFsdWUgPSB0aGlzW25hbWVdO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHZhbHVlID0gdGhpc1tuYW1lXS5qb2luKCdcXG4nKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cbn0pO1xuXG5leHBvcnQgZGVmYXVsdCBCYXNlQW5pbWF0aW9uTWF0ZXJpYWw7XG4iLCJpbXBvcnQgeyBTaGFkZXJMaWIgfSBmcm9tICd0aHJlZSc7XG5pbXBvcnQgQmFzZUFuaW1hdGlvbk1hdGVyaWFsIGZyb20gJy4vQmFzZUFuaW1hdGlvbk1hdGVyaWFsJztcblxuLyoqXG4gKiBFeHRlbmRzIFRIUkVFLk1lc2hCYXNpY01hdGVyaWFsIHdpdGggY3VzdG9tIHNoYWRlciBjaHVua3MuXG4gKlxuICogQHNlZSBodHRwOi8vdGhyZWUtYmFzLWV4YW1wbGVzLnN1cmdlLnNoL2V4YW1wbGVzL21hdGVyaWFsc19iYXNpYy9cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gcGFyYW1ldGVycyBPYmplY3QgY29udGFpbmluZyBtYXRlcmlhbCBwcm9wZXJ0aWVzIGFuZCBjdXN0b20gc2hhZGVyIGNodW5rcy5cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBCYXNpY0FuaW1hdGlvbk1hdGVyaWFsKHBhcmFtZXRlcnMpIHtcbiAgdGhpcy52YXJ5aW5nUGFyYW1ldGVycyA9IFtdO1xuICBcbiAgdGhpcy52ZXJ0ZXhQYXJhbWV0ZXJzID0gW107XG4gIHRoaXMudmVydGV4RnVuY3Rpb25zID0gW107XG4gIHRoaXMudmVydGV4SW5pdCA9IFtdO1xuICB0aGlzLnZlcnRleE5vcm1hbCA9IFtdO1xuICB0aGlzLnZlcnRleFBvc2l0aW9uID0gW107XG4gIHRoaXMudmVydGV4Q29sb3IgPSBbXTtcbiAgdGhpcy52ZXJ0ZXhQb3N0TW9ycGggPSBbXTtcbiAgdGhpcy52ZXJ0ZXhQb3N0U2tpbm5pbmcgPSBbXTtcblxuICB0aGlzLmZyYWdtZW50RnVuY3Rpb25zID0gW107XG4gIHRoaXMuZnJhZ21lbnRQYXJhbWV0ZXJzID0gW107XG4gIHRoaXMuZnJhZ21lbnRJbml0ID0gW107XG4gIHRoaXMuZnJhZ21lbnRNYXAgPSBbXTtcbiAgdGhpcy5mcmFnbWVudERpZmZ1c2UgPSBbXTtcbiAgXG4gIEJhc2VBbmltYXRpb25NYXRlcmlhbC5jYWxsKHRoaXMsIHBhcmFtZXRlcnMsIFNoYWRlckxpYlsnYmFzaWMnXS51bmlmb3Jtcyk7XG4gIFxuICB0aGlzLmxpZ2h0cyA9IGZhbHNlO1xuICB0aGlzLnZlcnRleFNoYWRlciA9IHRoaXMuY29uY2F0VmVydGV4U2hhZGVyKCk7XG4gIHRoaXMuZnJhZ21lbnRTaGFkZXIgPSB0aGlzLmNvbmNhdEZyYWdtZW50U2hhZGVyKCk7XG59XG5CYXNpY0FuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoQmFzZUFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZSk7XG5CYXNpY0FuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IEJhc2ljQW5pbWF0aW9uTWF0ZXJpYWw7XG5cbkJhc2ljQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlLmNvbmNhdFZlcnRleFNoYWRlciA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gYFxuICAjaW5jbHVkZSA8Y29tbW9uPlxuICAjaW5jbHVkZSA8dXZfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDx1djJfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxlbnZtYXBfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxjb2xvcl9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPGZvZ19wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPG1vcnBodGFyZ2V0X3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8c2tpbm5pbmdfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc19wYXJzX3ZlcnRleD5cbiAgXG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UGFyYW1ldGVycycpfVxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZhcnlpbmdQYXJhbWV0ZXJzJyl9XG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4RnVuY3Rpb25zJyl9XG4gIFxuICB2b2lkIG1haW4oKSB7XG5cbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleEluaXQnKX1cbiAgXG4gICAgI2luY2x1ZGUgPHV2X3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8dXYyX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8Y29sb3JfdmVydGV4PlxuICAgICNpbmNsdWRlIDxza2luYmFzZV92ZXJ0ZXg+XG4gIFxuICAgICNpZmRlZiBVU0VfRU5WTUFQXG4gIFxuICAgICNpbmNsdWRlIDxiZWdpbm5vcm1hbF92ZXJ0ZXg+XG4gICAgXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhOb3JtYWwnKX1cbiAgICBcbiAgICAjaW5jbHVkZSA8bW9ycGhub3JtYWxfdmVydGV4PlxuICAgICNpbmNsdWRlIDxza2lubm9ybWFsX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8ZGVmYXVsdG5vcm1hbF92ZXJ0ZXg+XG4gIFxuICAgICNlbmRpZlxuICBcbiAgICAjaW5jbHVkZSA8YmVnaW5fdmVydGV4PlxuICAgIFxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UG9zaXRpb24nKX1cbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleENvbG9yJyl9XG4gICAgXG4gICAgI2luY2x1ZGUgPG1vcnBodGFyZ2V0X3ZlcnRleD5cbiAgICBcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBvc3RNb3JwaCcpfVxuICAgIFxuICAgICNpbmNsdWRlIDxza2lubmluZ192ZXJ0ZXg+XG5cbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBvc3RTa2lubmluZycpfVxuXG4gICAgI2luY2x1ZGUgPHByb2plY3RfdmVydGV4PlxuICAgICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl92ZXJ0ZXg+XG4gIFxuICAgICNpbmNsdWRlIDx3b3JsZHBvc192ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc192ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPGVudm1hcF92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPGZvZ192ZXJ0ZXg+XG4gIH1gO1xufTtcblxuQmFzaWNBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uY2F0RnJhZ21lbnRTaGFkZXIgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIGBcbiAgdW5pZm9ybSB2ZWMzIGRpZmZ1c2U7XG4gIHVuaWZvcm0gZmxvYXQgb3BhY2l0eTtcbiAgXG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRQYXJhbWV0ZXJzJyl9XG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmFyeWluZ1BhcmFtZXRlcnMnKX1cbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudEZ1bmN0aW9ucycpfVxuICBcbiAgI2lmbmRlZiBGTEFUX1NIQURFRFxuICBcbiAgICB2YXJ5aW5nIHZlYzMgdk5vcm1hbDtcbiAgXG4gICNlbmRpZlxuICBcbiAgI2luY2x1ZGUgPGNvbW1vbj5cbiAgI2luY2x1ZGUgPGNvbG9yX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDx1dl9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8dXYyX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxtYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGFscGhhbWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxhb21hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8bGlnaHRtYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGVudm1hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8Zm9nX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxzcGVjdWxhcm1hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc19wYXJzX2ZyYWdtZW50PlxuICBcbiAgdm9pZCBtYWluKCkge1xuICBcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50SW5pdCcpfVxuICBcbiAgICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX2ZyYWdtZW50PlxuXG4gICAgdmVjNCBkaWZmdXNlQ29sb3IgPSB2ZWM0KCBkaWZmdXNlLCBvcGFjaXR5ICk7XG5cbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50RGlmZnVzZScpfVxuICBcbiAgICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfZnJhZ21lbnQ+XG4gICAgXG4gICAgJHsodGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRNYXAnKSB8fCAnI2luY2x1ZGUgPG1hcF9mcmFnbWVudD4nKX1cbiAgICBcbiAgICAjaW5jbHVkZSA8Y29sb3JfZnJhZ21lbnQ+XG4gICAgI2luY2x1ZGUgPGFscGhhbWFwX2ZyYWdtZW50PlxuICAgICNpbmNsdWRlIDxhbHBoYXRlc3RfZnJhZ21lbnQ+XG4gICAgI2luY2x1ZGUgPHNwZWN1bGFybWFwX2ZyYWdtZW50PlxuICBcbiAgICBSZWZsZWN0ZWRMaWdodCByZWZsZWN0ZWRMaWdodCA9IFJlZmxlY3RlZExpZ2h0KCB2ZWMzKCAwLjAgKSwgdmVjMyggMC4wICksIHZlYzMoIDAuMCApLCB2ZWMzKCAwLjAgKSApO1xuICBcbiAgICAvLyBhY2N1bXVsYXRpb24gKGJha2VkIGluZGlyZWN0IGxpZ2h0aW5nIG9ubHkpXG4gICAgI2lmZGVmIFVTRV9MSUdIVE1BUFxuICBcbiAgICAgIHJlZmxlY3RlZExpZ2h0LmluZGlyZWN0RGlmZnVzZSArPSB0ZXh0dXJlMkQoIGxpZ2h0TWFwLCB2VXYyICkueHl6ICogbGlnaHRNYXBJbnRlbnNpdHk7XG4gIFxuICAgICNlbHNlXG4gIFxuICAgICAgcmVmbGVjdGVkTGlnaHQuaW5kaXJlY3REaWZmdXNlICs9IHZlYzMoIDEuMCApO1xuICBcbiAgICAjZW5kaWZcbiAgXG4gICAgLy8gbW9kdWxhdGlvblxuICAgICNpbmNsdWRlIDxhb21hcF9mcmFnbWVudD5cbiAgXG4gICAgcmVmbGVjdGVkTGlnaHQuaW5kaXJlY3REaWZmdXNlICo9IGRpZmZ1c2VDb2xvci5yZ2I7XG4gIFxuICAgIHZlYzMgb3V0Z29pbmdMaWdodCA9IHJlZmxlY3RlZExpZ2h0LmluZGlyZWN0RGlmZnVzZTtcbiAgXG4gICAgI2luY2x1ZGUgPGVudm1hcF9mcmFnbWVudD5cbiAgXG4gICAgZ2xfRnJhZ0NvbG9yID0gdmVjNCggb3V0Z29pbmdMaWdodCwgZGlmZnVzZUNvbG9yLmEgKTtcbiAgXG4gICAgI2luY2x1ZGUgPHByZW11bHRpcGxpZWRfYWxwaGFfZnJhZ21lbnQ+XG4gICAgI2luY2x1ZGUgPHRvbmVtYXBwaW5nX2ZyYWdtZW50PlxuICAgICNpbmNsdWRlIDxlbmNvZGluZ3NfZnJhZ21lbnQ+XG4gICAgI2luY2x1ZGUgPGZvZ19mcmFnbWVudD5cbiAgfWA7XG59O1xuXG5leHBvcnQgeyBCYXNpY0FuaW1hdGlvbk1hdGVyaWFsIH07XG4iLCJpbXBvcnQgeyBTaGFkZXJMaWIgfSBmcm9tICd0aHJlZSc7XG5pbXBvcnQgQmFzZUFuaW1hdGlvbk1hdGVyaWFsIGZyb20gJy4vQmFzZUFuaW1hdGlvbk1hdGVyaWFsJztcblxuLyoqXG4gKiBFeHRlbmRzIFRIUkVFLk1lc2hMYW1iZXJ0TWF0ZXJpYWwgd2l0aCBjdXN0b20gc2hhZGVyIGNodW5rcy5cbiAqXG4gKiBAc2VlIGh0dHA6Ly90aHJlZS1iYXMtZXhhbXBsZXMuc3VyZ2Uuc2gvZXhhbXBsZXMvbWF0ZXJpYWxzX2xhbWJlcnQvXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IHBhcmFtZXRlcnMgT2JqZWN0IGNvbnRhaW5pbmcgbWF0ZXJpYWwgcHJvcGVydGllcyBhbmQgY3VzdG9tIHNoYWRlciBjaHVua3MuXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gTGFtYmVydEFuaW1hdGlvbk1hdGVyaWFsKHBhcmFtZXRlcnMpIHtcbiAgdGhpcy52YXJ5aW5nUGFyYW1ldGVycyA9IFtdO1xuICBcbiAgdGhpcy52ZXJ0ZXhGdW5jdGlvbnMgPSBbXTtcbiAgdGhpcy52ZXJ0ZXhQYXJhbWV0ZXJzID0gW107XG4gIHRoaXMudmVydGV4SW5pdCA9IFtdO1xuICB0aGlzLnZlcnRleE5vcm1hbCA9IFtdO1xuICB0aGlzLnZlcnRleFBvc2l0aW9uID0gW107XG4gIHRoaXMudmVydGV4Q29sb3IgPSBbXTtcbiAgdGhpcy52ZXJ0ZXhQb3N0TW9ycGggPSBbXTtcbiAgdGhpcy52ZXJ0ZXhQb3N0U2tpbm5pbmcgPSBbXTtcbiAgXG4gIHRoaXMuZnJhZ21lbnRGdW5jdGlvbnMgPSBbXTtcbiAgdGhpcy5mcmFnbWVudFBhcmFtZXRlcnMgPSBbXTtcbiAgdGhpcy5mcmFnbWVudEluaXQgPSBbXTtcbiAgdGhpcy5mcmFnbWVudE1hcCA9IFtdO1xuICB0aGlzLmZyYWdtZW50RGlmZnVzZSA9IFtdO1xuICB0aGlzLmZyYWdtZW50RW1pc3NpdmUgPSBbXTtcbiAgdGhpcy5mcmFnbWVudFNwZWN1bGFyID0gW107XG4gIFxuICBCYXNlQW5pbWF0aW9uTWF0ZXJpYWwuY2FsbCh0aGlzLCBwYXJhbWV0ZXJzLCBTaGFkZXJMaWJbJ2xhbWJlcnQnXS51bmlmb3Jtcyk7XG4gIFxuICB0aGlzLmxpZ2h0cyA9IHRydWU7XG4gIHRoaXMudmVydGV4U2hhZGVyID0gdGhpcy5jb25jYXRWZXJ0ZXhTaGFkZXIoKTtcbiAgdGhpcy5mcmFnbWVudFNoYWRlciA9IHRoaXMuY29uY2F0RnJhZ21lbnRTaGFkZXIoKTtcbn1cbkxhbWJlcnRBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEJhc2VBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUpO1xuTGFtYmVydEFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IExhbWJlcnRBbmltYXRpb25NYXRlcmlhbDtcblxuTGFtYmVydEFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZS5jb25jYXRWZXJ0ZXhTaGFkZXIgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiBgXG4gICNkZWZpbmUgTEFNQkVSVFxuXG4gIHZhcnlpbmcgdmVjMyB2TGlnaHRGcm9udDtcbiAgXG4gICNpZmRlZiBET1VCTEVfU0lERURcbiAgXG4gICAgdmFyeWluZyB2ZWMzIHZMaWdodEJhY2s7XG4gIFxuICAjZW5kaWZcbiAgXG4gICNpbmNsdWRlIDxjb21tb24+XG4gICNpbmNsdWRlIDx1dl9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPHV2Ml9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPGVudm1hcF9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPGJzZGZzPlxuICAjaW5jbHVkZSA8bGlnaHRzX3BhcnNfYmVnaW4+XG4gICNpbmNsdWRlIDxlbnZtYXBfcGh5c2ljYWxfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGNvbG9yX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8Zm9nX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8bW9ycGh0YXJnZXRfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxza2lubmluZ19wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPHNoYWRvd21hcF9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPGxvZ2RlcHRoYnVmX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX3BhcnNfdmVydGV4PlxuICBcbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQYXJhbWV0ZXJzJyl9XG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmFyeWluZ1BhcmFtZXRlcnMnKX1cbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhGdW5jdGlvbnMnKX1cbiAgXG4gIHZvaWQgbWFpbigpIHtcbiAgXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhJbml0Jyl9XG4gIFxuICAgICNpbmNsdWRlIDx1dl92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPHV2Ml92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPGNvbG9yX3ZlcnRleD5cbiAgXG4gICAgI2luY2x1ZGUgPGJlZ2lubm9ybWFsX3ZlcnRleD5cbiAgICBcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleE5vcm1hbCcpfVxuICAgIFxuICAgICNpbmNsdWRlIDxtb3JwaG5vcm1hbF92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPHNraW5iYXNlX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8c2tpbm5vcm1hbF92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPGRlZmF1bHRub3JtYWxfdmVydGV4PlxuICBcbiAgICAjaW5jbHVkZSA8YmVnaW5fdmVydGV4PlxuICAgIFxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UG9zaXRpb24nKX1cbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleENvbG9yJyl9XG4gICAgXG4gICAgI2luY2x1ZGUgPG1vcnBodGFyZ2V0X3ZlcnRleD5cbiAgICBcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBvc3RNb3JwaCcpfVxuICAgIFxuICAgICNpbmNsdWRlIDxza2lubmluZ192ZXJ0ZXg+XG5cbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBvc3RTa2lubmluZycpfVxuICAgIFxuICAgICNpbmNsdWRlIDxwcm9qZWN0X3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfdmVydGV4PlxuICAgICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfdmVydGV4PlxuICBcbiAgICAjaW5jbHVkZSA8d29ybGRwb3NfdmVydGV4PlxuICAgICNpbmNsdWRlIDxlbnZtYXBfdmVydGV4PlxuICAgICNpbmNsdWRlIDxsaWdodHNfbGFtYmVydF92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPHNoYWRvd21hcF92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPGZvZ192ZXJ0ZXg+XG4gIH1gO1xufTtcblxuTGFtYmVydEFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZS5jb25jYXRGcmFnbWVudFNoYWRlciA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIGBcbiAgdW5pZm9ybSB2ZWMzIGRpZmZ1c2U7XG4gIHVuaWZvcm0gdmVjMyBlbWlzc2l2ZTtcbiAgdW5pZm9ybSBmbG9hdCBvcGFjaXR5O1xuICBcbiAgdmFyeWluZyB2ZWMzIHZMaWdodEZyb250O1xuICBcbiAgI2lmZGVmIERPVUJMRV9TSURFRFxuICBcbiAgICB2YXJ5aW5nIHZlYzMgdkxpZ2h0QmFjaztcbiAgXG4gICNlbmRpZlxuICBcbiAgI2luY2x1ZGUgPGNvbW1vbj5cbiAgI2luY2x1ZGUgPHBhY2tpbmc+XG4gICNpbmNsdWRlIDxkaXRoZXJpbmdfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGNvbG9yX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDx1dl9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8dXYyX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxtYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGFscGhhbWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxhb21hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8bGlnaHRtYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGVtaXNzaXZlbWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxlbnZtYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGJzZGZzPlxuICAjaW5jbHVkZSA8bGlnaHRzX3BhcnNfYmVnaW4+XG4gICNpbmNsdWRlIDxlbnZtYXBfcGh5c2ljYWxfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGZvZ19wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8c2hhZG93bWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxzaGFkb3dtYXNrX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxzcGVjdWxhcm1hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc19wYXJzX2ZyYWdtZW50PlxuICBcbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudFBhcmFtZXRlcnMnKX1cbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2YXJ5aW5nUGFyYW1ldGVycycpfVxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50RnVuY3Rpb25zJyl9XG4gIFxuICB2b2lkIG1haW4oKSB7XG4gIFxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRJbml0Jyl9XG4gIFxuICAgICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfZnJhZ21lbnQ+XG5cbiAgICB2ZWM0IGRpZmZ1c2VDb2xvciA9IHZlYzQoIGRpZmZ1c2UsIG9wYWNpdHkgKTtcbiAgICBSZWZsZWN0ZWRMaWdodCByZWZsZWN0ZWRMaWdodCA9IFJlZmxlY3RlZExpZ2h0KCB2ZWMzKCAwLjAgKSwgdmVjMyggMC4wICksIHZlYzMoIDAuMCApLCB2ZWMzKCAwLjAgKSApO1xuICAgIHZlYzMgdG90YWxFbWlzc2l2ZVJhZGlhbmNlID0gZW1pc3NpdmU7XG5cdFxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnREaWZmdXNlJyl9XG4gIFxuICAgICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl9mcmFnbWVudD5cblxuICAgICR7KHRoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50TWFwJykgfHwgJyNpbmNsdWRlIDxtYXBfZnJhZ21lbnQ+Jyl9XG5cbiAgICAjaW5jbHVkZSA8Y29sb3JfZnJhZ21lbnQ+XG4gICAgI2luY2x1ZGUgPGFscGhhbWFwX2ZyYWdtZW50PlxuICAgICNpbmNsdWRlIDxhbHBoYXRlc3RfZnJhZ21lbnQ+XG4gICAgI2luY2x1ZGUgPHNwZWN1bGFybWFwX2ZyYWdtZW50PlxuXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudEVtaXNzaXZlJyl9XG5cbiAgICAjaW5jbHVkZSA8ZW1pc3NpdmVtYXBfZnJhZ21lbnQ+XG4gIFxuICAgIC8vIGFjY3VtdWxhdGlvblxuICAgIHJlZmxlY3RlZExpZ2h0LmluZGlyZWN0RGlmZnVzZSA9IGdldEFtYmllbnRMaWdodElycmFkaWFuY2UoIGFtYmllbnRMaWdodENvbG9yICk7XG4gIFxuICAgICNpbmNsdWRlIDxsaWdodG1hcF9mcmFnbWVudD5cbiAgXG4gICAgcmVmbGVjdGVkTGlnaHQuaW5kaXJlY3REaWZmdXNlICo9IEJSREZfRGlmZnVzZV9MYW1iZXJ0KCBkaWZmdXNlQ29sb3IucmdiICk7XG4gIFxuICAgICNpZmRlZiBET1VCTEVfU0lERURcbiAgXG4gICAgICByZWZsZWN0ZWRMaWdodC5kaXJlY3REaWZmdXNlID0gKCBnbF9Gcm9udEZhY2luZyApID8gdkxpZ2h0RnJvbnQgOiB2TGlnaHRCYWNrO1xuICBcbiAgICAjZWxzZVxuICBcbiAgICAgIHJlZmxlY3RlZExpZ2h0LmRpcmVjdERpZmZ1c2UgPSB2TGlnaHRGcm9udDtcbiAgXG4gICAgI2VuZGlmXG4gIFxuICAgIHJlZmxlY3RlZExpZ2h0LmRpcmVjdERpZmZ1c2UgKj0gQlJERl9EaWZmdXNlX0xhbWJlcnQoIGRpZmZ1c2VDb2xvci5yZ2IgKSAqIGdldFNoYWRvd01hc2soKTtcbiAgXG4gICAgLy8gbW9kdWxhdGlvblxuICAgICNpbmNsdWRlIDxhb21hcF9mcmFnbWVudD5cbiAgXG4gICAgdmVjMyBvdXRnb2luZ0xpZ2h0ID0gcmVmbGVjdGVkTGlnaHQuZGlyZWN0RGlmZnVzZSArIHJlZmxlY3RlZExpZ2h0LmluZGlyZWN0RGlmZnVzZSArIHRvdGFsRW1pc3NpdmVSYWRpYW5jZTtcbiAgXG4gICAgI2luY2x1ZGUgPGVudm1hcF9mcmFnbWVudD5cbiAgXG4gICAgZ2xfRnJhZ0NvbG9yID0gdmVjNCggb3V0Z29pbmdMaWdodCwgZGlmZnVzZUNvbG9yLmEgKTtcbiAgXG4gICAgI2luY2x1ZGUgPHRvbmVtYXBwaW5nX2ZyYWdtZW50PlxuICAgICNpbmNsdWRlIDxlbmNvZGluZ3NfZnJhZ21lbnQ+XG4gICAgI2luY2x1ZGUgPGZvZ19mcmFnbWVudD5cbiAgICAjaW5jbHVkZSA8cHJlbXVsdGlwbGllZF9hbHBoYV9mcmFnbWVudD5cbiAgICAjaW5jbHVkZSA8ZGl0aGVyaW5nX2ZyYWdtZW50PlxuICB9YDtcbn07XG5cbmV4cG9ydCB7IExhbWJlcnRBbmltYXRpb25NYXRlcmlhbCB9O1xuIiwiaW1wb3J0IHsgU2hhZGVyTGliIH0gZnJvbSAndGhyZWUnO1xuaW1wb3J0IEJhc2VBbmltYXRpb25NYXRlcmlhbCBmcm9tICcuL0Jhc2VBbmltYXRpb25NYXRlcmlhbCc7XG5cbi8qKlxuICogRXh0ZW5kcyBUSFJFRS5NZXNoUGhvbmdNYXRlcmlhbCB3aXRoIGN1c3RvbSBzaGFkZXIgY2h1bmtzLlxuICpcbiAqIEBzZWUgaHR0cDovL3RocmVlLWJhcy1leGFtcGxlcy5zdXJnZS5zaC9leGFtcGxlcy9tYXRlcmlhbHNfcGhvbmcvXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IHBhcmFtZXRlcnMgT2JqZWN0IGNvbnRhaW5pbmcgbWF0ZXJpYWwgcHJvcGVydGllcyBhbmQgY3VzdG9tIHNoYWRlciBjaHVua3MuXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gUGhvbmdBbmltYXRpb25NYXRlcmlhbChwYXJhbWV0ZXJzKSB7XG4gIHRoaXMudmFyeWluZ1BhcmFtZXRlcnMgPSBbXTtcblxuICB0aGlzLnZlcnRleEZ1bmN0aW9ucyA9IFtdO1xuICB0aGlzLnZlcnRleFBhcmFtZXRlcnMgPSBbXTtcbiAgdGhpcy52ZXJ0ZXhJbml0ID0gW107XG4gIHRoaXMudmVydGV4Tm9ybWFsID0gW107XG4gIHRoaXMudmVydGV4UG9zaXRpb24gPSBbXTtcbiAgdGhpcy52ZXJ0ZXhDb2xvciA9IFtdO1xuXG4gIHRoaXMuZnJhZ21lbnRGdW5jdGlvbnMgPSBbXTtcbiAgdGhpcy5mcmFnbWVudFBhcmFtZXRlcnMgPSBbXTtcbiAgdGhpcy5mcmFnbWVudEluaXQgPSBbXTtcbiAgdGhpcy5mcmFnbWVudE1hcCA9IFtdO1xuICB0aGlzLmZyYWdtZW50RGlmZnVzZSA9IFtdO1xuICB0aGlzLmZyYWdtZW50RW1pc3NpdmUgPSBbXTtcbiAgdGhpcy5mcmFnbWVudFNwZWN1bGFyID0gW107XG5cbiAgQmFzZUFuaW1hdGlvbk1hdGVyaWFsLmNhbGwodGhpcywgcGFyYW1ldGVycywgU2hhZGVyTGliWydwaG9uZyddLnVuaWZvcm1zKTtcblxuICB0aGlzLmxpZ2h0cyA9IHRydWU7XG4gIHRoaXMudmVydGV4U2hhZGVyID0gdGhpcy5jb25jYXRWZXJ0ZXhTaGFkZXIoKTtcbiAgdGhpcy5mcmFnbWVudFNoYWRlciA9IHRoaXMuY29uY2F0RnJhZ21lbnRTaGFkZXIoKTtcbn1cblBob25nQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShCYXNlQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlKTtcblBob25nQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gUGhvbmdBbmltYXRpb25NYXRlcmlhbDtcblxuUGhvbmdBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uY2F0VmVydGV4U2hhZGVyID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gYFxuICAjZGVmaW5lIFBIT05HXG5cbiAgdmFyeWluZyB2ZWMzIHZWaWV3UG9zaXRpb247XG5cbiAgI2lmbmRlZiBGTEFUX1NIQURFRFxuXG4gICAgdmFyeWluZyB2ZWMzIHZOb3JtYWw7XG5cbiAgI2VuZGlmXG5cbiAgI2luY2x1ZGUgPGNvbW1vbj5cbiAgI2luY2x1ZGUgPHV2X3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8dXYyX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8ZGlzcGxhY2VtZW50bWFwX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8ZW52bWFwX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8Y29sb3JfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxmb2dfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxtb3JwaHRhcmdldF9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPHNraW5uaW5nX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8c2hhZG93bWFwX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfcGFyc192ZXJ0ZXg+XG5cbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQYXJhbWV0ZXJzJyl9XG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmFyeWluZ1BhcmFtZXRlcnMnKX1cbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhGdW5jdGlvbnMnKX1cblxuICB2b2lkIG1haW4oKSB7XG5cbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleEluaXQnKX1cblxuICAgICNpbmNsdWRlIDx1dl92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPHV2Ml92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPGNvbG9yX3ZlcnRleD5cblxuICAgICNpbmNsdWRlIDxiZWdpbm5vcm1hbF92ZXJ0ZXg+XG5cbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleE5vcm1hbCcpfVxuXG4gICAgI2luY2x1ZGUgPG1vcnBobm9ybWFsX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8c2tpbmJhc2VfdmVydGV4PlxuICAgICNpbmNsdWRlIDxza2lubm9ybWFsX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8ZGVmYXVsdG5vcm1hbF92ZXJ0ZXg+XG5cbiAgI2lmbmRlZiBGTEFUX1NIQURFRCAvLyBOb3JtYWwgY29tcHV0ZWQgd2l0aCBkZXJpdmF0aXZlcyB3aGVuIEZMQVRfU0hBREVEXG5cbiAgICB2Tm9ybWFsID0gbm9ybWFsaXplKCB0cmFuc2Zvcm1lZE5vcm1hbCApO1xuXG4gICNlbmRpZlxuXG4gICAgI2luY2x1ZGUgPGJlZ2luX3ZlcnRleD5cblxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UG9zaXRpb24nKX1cbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleENvbG9yJyl9XG5cbiAgICAjaW5jbHVkZSA8bW9ycGh0YXJnZXRfdmVydGV4PlxuICAgICNpbmNsdWRlIDxza2lubmluZ192ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPGRpc3BsYWNlbWVudG1hcF92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPHByb2plY3RfdmVydGV4PlxuICAgICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc192ZXJ0ZXg+XG5cbiAgICB2Vmlld1Bvc2l0aW9uID0gLSBtdlBvc2l0aW9uLnh5ejtcblxuICAgICNpbmNsdWRlIDx3b3JsZHBvc192ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPGVudm1hcF92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPHNoYWRvd21hcF92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPGZvZ192ZXJ0ZXg+XG4gIH1gO1xufTtcblxuUGhvbmdBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uY2F0RnJhZ21lbnRTaGFkZXIgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiBgXG4gICNkZWZpbmUgUEhPTkdcblxuICB1bmlmb3JtIHZlYzMgZGlmZnVzZTtcbiAgdW5pZm9ybSB2ZWMzIGVtaXNzaXZlO1xuICB1bmlmb3JtIHZlYzMgc3BlY3VsYXI7XG4gIHVuaWZvcm0gZmxvYXQgc2hpbmluZXNzO1xuICB1bmlmb3JtIGZsb2F0IG9wYWNpdHk7XG5cbiAgI2luY2x1ZGUgPGNvbW1vbj5cbiAgI2luY2x1ZGUgPHBhY2tpbmc+XG4gICNpbmNsdWRlIDxkaXRoZXJpbmdfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGNvbG9yX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDx1dl9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8dXYyX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxtYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGFscGhhbWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxhb21hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8bGlnaHRtYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGVtaXNzaXZlbWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxlbnZtYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGdyYWRpZW50bWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxmb2dfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGJzZGZzPlxuICAjaW5jbHVkZSA8bGlnaHRzX3BhcnNfYmVnaW4+XG4gICNpbmNsdWRlIDxlbnZtYXBfcGh5c2ljYWxfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGxpZ2h0c19waG9uZ19wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8c2hhZG93bWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxidW1wbWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxub3JtYWxtYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPHNwZWN1bGFybWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX3BhcnNfZnJhZ21lbnQ+XG5cbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudFBhcmFtZXRlcnMnKX1cbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2YXJ5aW5nUGFyYW1ldGVycycpfVxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50RnVuY3Rpb25zJyl9XG5cbiAgdm9pZCBtYWluKCkge1xuXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudEluaXQnKX1cblxuICAgICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfZnJhZ21lbnQ+XG5cbiAgICB2ZWM0IGRpZmZ1c2VDb2xvciA9IHZlYzQoIGRpZmZ1c2UsIG9wYWNpdHkgKTtcbiAgICBSZWZsZWN0ZWRMaWdodCByZWZsZWN0ZWRMaWdodCA9IFJlZmxlY3RlZExpZ2h0KCB2ZWMzKCAwLjAgKSwgdmVjMyggMC4wICksIHZlYzMoIDAuMCApLCB2ZWMzKCAwLjAgKSApO1xuICAgIHZlYzMgdG90YWxFbWlzc2l2ZVJhZGlhbmNlID0gZW1pc3NpdmU7XG5cbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50RGlmZnVzZScpfVxuXG4gICAgI2luY2x1ZGUgPGxvZ2RlcHRoYnVmX2ZyYWdtZW50PlxuXG4gICAgJHsodGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRNYXAnKSB8fCAnI2luY2x1ZGUgPG1hcF9mcmFnbWVudD4nKX1cblxuICAgICNpbmNsdWRlIDxjb2xvcl9mcmFnbWVudD5cbiAgICAjaW5jbHVkZSA8YWxwaGFtYXBfZnJhZ21lbnQ+XG4gICAgI2luY2x1ZGUgPGFscGhhdGVzdF9mcmFnbWVudD5cbiAgICAjaW5jbHVkZSA8c3BlY3VsYXJtYXBfZnJhZ21lbnQ+XG4gICAgI2luY2x1ZGUgPG5vcm1hbF9mcmFnbWVudF9iZWdpbj5cbiAgICAjaW5jbHVkZSA8bm9ybWFsX2ZyYWdtZW50X21hcHM+XG5cbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50RW1pc3NpdmUnKX1cblxuICAgICNpbmNsdWRlIDxlbWlzc2l2ZW1hcF9mcmFnbWVudD5cblxuICAgIC8vIGFjY3VtdWxhdGlvblxuICAgICNpbmNsdWRlIDxsaWdodHNfcGhvbmdfZnJhZ21lbnQ+XG4gICAgI2luY2x1ZGUgPGxpZ2h0c19mcmFnbWVudF9iZWdpbj5cbiAgICAjaW5jbHVkZSA8bGlnaHRzX2ZyYWdtZW50X21hcHM+XG4gICAgI2luY2x1ZGUgPGxpZ2h0c19mcmFnbWVudF9lbmQ+XG5cbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50U3BlY3VsYXInKX1cblxuICAgIC8vIG1vZHVsYXRpb25cbiAgICAjaW5jbHVkZSA8YW9tYXBfZnJhZ21lbnQ+XG5cbiAgICB2ZWMzIG91dGdvaW5nTGlnaHQgPSByZWZsZWN0ZWRMaWdodC5kaXJlY3REaWZmdXNlICsgcmVmbGVjdGVkTGlnaHQuaW5kaXJlY3REaWZmdXNlICsgcmVmbGVjdGVkTGlnaHQuZGlyZWN0U3BlY3VsYXIgKyByZWZsZWN0ZWRMaWdodC5pbmRpcmVjdFNwZWN1bGFyICsgdG90YWxFbWlzc2l2ZVJhZGlhbmNlO1xuXG4gICAgI2luY2x1ZGUgPGVudm1hcF9mcmFnbWVudD5cblxuICAgIGdsX0ZyYWdDb2xvciA9IHZlYzQoIG91dGdvaW5nTGlnaHQsIGRpZmZ1c2VDb2xvci5hICk7XG5cbiAgICAjaW5jbHVkZSA8dG9uZW1hcHBpbmdfZnJhZ21lbnQ+XG4gICAgI2luY2x1ZGUgPGVuY29kaW5nc19mcmFnbWVudD5cbiAgICAjaW5jbHVkZSA8Zm9nX2ZyYWdtZW50PlxuICAgICNpbmNsdWRlIDxwcmVtdWx0aXBsaWVkX2FscGhhX2ZyYWdtZW50PlxuICAgICNpbmNsdWRlIDxkaXRoZXJpbmdfZnJhZ21lbnQ+XG5cbiAgfWA7XG59O1xuXG5leHBvcnQgeyBQaG9uZ0FuaW1hdGlvbk1hdGVyaWFsIH07XG4iLCJpbXBvcnQgeyBTaGFkZXJMaWIgfSBmcm9tICd0aHJlZSc7XG5pbXBvcnQgQmFzZUFuaW1hdGlvbk1hdGVyaWFsIGZyb20gJy4vQmFzZUFuaW1hdGlvbk1hdGVyaWFsJztcblxuLyoqXG4gKiBFeHRlbmRzIFRIUkVFLk1lc2hTdGFuZGFyZE1hdGVyaWFsIHdpdGggY3VzdG9tIHNoYWRlciBjaHVua3MuXG4gKlxuICogQHNlZSBodHRwOi8vdGhyZWUtYmFzLWV4YW1wbGVzLnN1cmdlLnNoL2V4YW1wbGVzL21hdGVyaWFsc19zdGFuZGFyZC9cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gcGFyYW1ldGVycyBPYmplY3QgY29udGFpbmluZyBtYXRlcmlhbCBwcm9wZXJ0aWVzIGFuZCBjdXN0b20gc2hhZGVyIGNodW5rcy5cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBTdGFuZGFyZEFuaW1hdGlvbk1hdGVyaWFsKHBhcmFtZXRlcnMpIHtcbiAgdGhpcy52YXJ5aW5nUGFyYW1ldGVycyA9IFtdO1xuXG4gIHRoaXMudmVydGV4RnVuY3Rpb25zID0gW107XG4gIHRoaXMudmVydGV4UGFyYW1ldGVycyA9IFtdO1xuICB0aGlzLnZlcnRleEluaXQgPSBbXTtcbiAgdGhpcy52ZXJ0ZXhOb3JtYWwgPSBbXTtcbiAgdGhpcy52ZXJ0ZXhQb3NpdGlvbiA9IFtdO1xuICB0aGlzLnZlcnRleENvbG9yID0gW107XG4gIHRoaXMudmVydGV4UG9zdE1vcnBoID0gW107XG4gIHRoaXMudmVydGV4UG9zdFNraW5uaW5nID0gW107XG5cbiAgdGhpcy5mcmFnbWVudEZ1bmN0aW9ucyA9IFtdO1xuICB0aGlzLmZyYWdtZW50UGFyYW1ldGVycyA9IFtdO1xuICB0aGlzLmZyYWdtZW50SW5pdCA9IFtdO1xuICB0aGlzLmZyYWdtZW50TWFwID0gW107XG4gIHRoaXMuZnJhZ21lbnREaWZmdXNlID0gW107XG4gIHRoaXMuZnJhZ21lbnRSb3VnaG5lc3MgPSBbXTtcbiAgdGhpcy5mcmFnbWVudE1ldGFsbmVzcyA9IFtdO1xuICB0aGlzLmZyYWdtZW50RW1pc3NpdmUgPSBbXTtcblxuICBCYXNlQW5pbWF0aW9uTWF0ZXJpYWwuY2FsbCh0aGlzLCBwYXJhbWV0ZXJzLCBTaGFkZXJMaWJbJ3N0YW5kYXJkJ10udW5pZm9ybXMpO1xuXG4gIHRoaXMubGlnaHRzID0gdHJ1ZTtcbiAgdGhpcy52ZXJ0ZXhTaGFkZXIgPSB0aGlzLmNvbmNhdFZlcnRleFNoYWRlcigpO1xuICB0aGlzLmZyYWdtZW50U2hhZGVyID0gdGhpcy5jb25jYXRGcmFnbWVudFNoYWRlcigpO1xufVxuU3RhbmRhcmRBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEJhc2VBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUpO1xuU3RhbmRhcmRBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBTdGFuZGFyZEFuaW1hdGlvbk1hdGVyaWFsO1xuXG5TdGFuZGFyZEFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZS5jb25jYXRWZXJ0ZXhTaGFkZXIgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiBgXG4gICNkZWZpbmUgUEhZU0lDQUxcblxuICB2YXJ5aW5nIHZlYzMgdlZpZXdQb3NpdGlvbjtcbiAgXG4gICNpZm5kZWYgRkxBVF9TSEFERURcbiAgXG4gICAgdmFyeWluZyB2ZWMzIHZOb3JtYWw7XG4gIFxuICAjZW5kaWZcbiAgXG4gICNpbmNsdWRlIDxjb21tb24+XG4gICNpbmNsdWRlIDx1dl9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPHV2Ml9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPGRpc3BsYWNlbWVudG1hcF9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPGNvbG9yX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8Zm9nX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8bW9ycGh0YXJnZXRfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxza2lubmluZ19wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPHNoYWRvd21hcF9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPGxvZ2RlcHRoYnVmX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX3BhcnNfdmVydGV4PlxuICBcbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQYXJhbWV0ZXJzJyl9XG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmFyeWluZ1BhcmFtZXRlcnMnKX1cbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhGdW5jdGlvbnMnKX1cbiAgXG4gIHZvaWQgbWFpbigpIHtcblxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4SW5pdCcpfVxuXG4gICAgI2luY2x1ZGUgPHV2X3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8dXYyX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8Y29sb3JfdmVydGV4PlxuICBcbiAgICAjaW5jbHVkZSA8YmVnaW5ub3JtYWxfdmVydGV4PlxuICAgIFxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4Tm9ybWFsJyl9XG4gICAgXG4gICAgI2luY2x1ZGUgPG1vcnBobm9ybWFsX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8c2tpbmJhc2VfdmVydGV4PlxuICAgICNpbmNsdWRlIDxza2lubm9ybWFsX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8ZGVmYXVsdG5vcm1hbF92ZXJ0ZXg+XG4gIFxuICAjaWZuZGVmIEZMQVRfU0hBREVEIC8vIE5vcm1hbCBjb21wdXRlZCB3aXRoIGRlcml2YXRpdmVzIHdoZW4gRkxBVF9TSEFERURcbiAgXG4gICAgdk5vcm1hbCA9IG5vcm1hbGl6ZSggdHJhbnNmb3JtZWROb3JtYWwgKTtcbiAgXG4gICNlbmRpZlxuICBcbiAgICAjaW5jbHVkZSA8YmVnaW5fdmVydGV4PlxuICAgIFxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UG9zaXRpb24nKX1cbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleENvbG9yJyl9XG4gICAgXG4gICAgI2luY2x1ZGUgPG1vcnBodGFyZ2V0X3ZlcnRleD5cbiAgICBcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBvc3RNb3JwaCcpfVxuICAgIFxuICAgICNpbmNsdWRlIDxza2lubmluZ192ZXJ0ZXg+XG5cbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBvc3RTa2lubmluZycpfVxuICAgIFxuICAgICNpbmNsdWRlIDxkaXNwbGFjZW1lbnRtYXBfdmVydGV4PlxuICAgICNpbmNsdWRlIDxwcm9qZWN0X3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfdmVydGV4PlxuICAgICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfdmVydGV4PlxuICBcbiAgICB2Vmlld1Bvc2l0aW9uID0gLSBtdlBvc2l0aW9uLnh5ejtcbiAgXG4gICAgI2luY2x1ZGUgPHdvcmxkcG9zX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8c2hhZG93bWFwX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8Zm9nX3ZlcnRleD5cbiAgfWA7XG59O1xuXG5TdGFuZGFyZEFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZS5jb25jYXRGcmFnbWVudFNoYWRlciA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIGBcbiAgI2RlZmluZSBQSFlTSUNBTFxuICBcbiAgdW5pZm9ybSB2ZWMzIGRpZmZ1c2U7XG4gIHVuaWZvcm0gdmVjMyBlbWlzc2l2ZTtcbiAgdW5pZm9ybSBmbG9hdCByb3VnaG5lc3M7XG4gIHVuaWZvcm0gZmxvYXQgbWV0YWxuZXNzO1xuICB1bmlmb3JtIGZsb2F0IG9wYWNpdHk7XG4gIFxuICAjaWZuZGVmIFNUQU5EQVJEXG4gICAgdW5pZm9ybSBmbG9hdCBjbGVhckNvYXQ7XG4gICAgdW5pZm9ybSBmbG9hdCBjbGVhckNvYXRSb3VnaG5lc3M7XG4gICNlbmRpZlxuICBcbiAgdmFyeWluZyB2ZWMzIHZWaWV3UG9zaXRpb247XG4gIFxuICAjaWZuZGVmIEZMQVRfU0hBREVEXG4gIFxuICAgIHZhcnlpbmcgdmVjMyB2Tm9ybWFsO1xuICBcbiAgI2VuZGlmXG4gIFxuICAjaW5jbHVkZSA8Y29tbW9uPlxuICAjaW5jbHVkZSA8cGFja2luZz5cbiAgI2luY2x1ZGUgPGRpdGhlcmluZ19wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8Y29sb3JfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPHV2X3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDx1djJfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPG1hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8YWxwaGFtYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGFvbWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxsaWdodG1hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8ZW1pc3NpdmVtYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGVudm1hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8Zm9nX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxic2Rmcz5cbiAgI2luY2x1ZGUgPGN1YmVfdXZfcmVmbGVjdGlvbl9mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGxpZ2h0c19wYXJzX2JlZ2luPlxuICAjaW5jbHVkZSA8ZW52bWFwX3BoeXNpY2FsX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxsaWdodHNfcGh5c2ljYWxfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPHNoYWRvd21hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8YnVtcG1hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8bm9ybWFsbWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxyb3VnaG5lc3NtYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPG1ldGFsbmVzc21hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc19wYXJzX2ZyYWdtZW50PlxuICBcbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudFBhcmFtZXRlcnMnKX1cbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2YXJ5aW5nUGFyYW1ldGVycycpfVxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50RnVuY3Rpb25zJyl9XG4gIFxuICB2b2lkIG1haW4oKSB7XG4gIFxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRJbml0Jyl9XG4gIFxuICAgICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfZnJhZ21lbnQ+XG4gIFxuICAgIHZlYzQgZGlmZnVzZUNvbG9yID0gdmVjNCggZGlmZnVzZSwgb3BhY2l0eSApO1xuICAgIFJlZmxlY3RlZExpZ2h0IHJlZmxlY3RlZExpZ2h0ID0gUmVmbGVjdGVkTGlnaHQoIHZlYzMoIDAuMCApLCB2ZWMzKCAwLjAgKSwgdmVjMyggMC4wICksIHZlYzMoIDAuMCApICk7XG4gICAgdmVjMyB0b3RhbEVtaXNzaXZlUmFkaWFuY2UgPSBlbWlzc2l2ZTtcbiAgXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudERpZmZ1c2UnKX1cbiAgXG4gICAgI2luY2x1ZGUgPGxvZ2RlcHRoYnVmX2ZyYWdtZW50PlxuXG4gICAgJHsodGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRNYXAnKSB8fCAnI2luY2x1ZGUgPG1hcF9mcmFnbWVudD4nKX1cblxuICAgICNpbmNsdWRlIDxjb2xvcl9mcmFnbWVudD5cbiAgICAjaW5jbHVkZSA8YWxwaGFtYXBfZnJhZ21lbnQ+XG4gICAgI2luY2x1ZGUgPGFscGhhdGVzdF9mcmFnbWVudD5cbiAgICBcbiAgICBmbG9hdCByb3VnaG5lc3NGYWN0b3IgPSByb3VnaG5lc3M7XG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudFJvdWdobmVzcycpfVxuICAgICNpZmRlZiBVU0VfUk9VR0hORVNTTUFQXG4gICAgXG4gICAgICB2ZWM0IHRleGVsUm91Z2huZXNzID0gdGV4dHVyZTJEKCByb3VnaG5lc3NNYXAsIHZVdiApO1xuICAgIFxuICAgICAgLy8gcmVhZHMgY2hhbm5lbCBHLCBjb21wYXRpYmxlIHdpdGggYSBjb21iaW5lZCBPY2NsdXNpb25Sb3VnaG5lc3NNZXRhbGxpYyAoUkdCKSB0ZXh0dXJlXG4gICAgICByb3VnaG5lc3NGYWN0b3IgKj0gdGV4ZWxSb3VnaG5lc3MuZztcbiAgICBcbiAgICAjZW5kaWZcbiAgICBcbiAgICBmbG9hdCBtZXRhbG5lc3NGYWN0b3IgPSBtZXRhbG5lc3M7XG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudE1ldGFsbmVzcycpfVxuICAgICNpZmRlZiBVU0VfTUVUQUxORVNTTUFQXG4gICAgXG4gICAgICB2ZWM0IHRleGVsTWV0YWxuZXNzID0gdGV4dHVyZTJEKCBtZXRhbG5lc3NNYXAsIHZVdiApO1xuICAgICAgbWV0YWxuZXNzRmFjdG9yICo9IHRleGVsTWV0YWxuZXNzLmI7XG4gICAgXG4gICAgI2VuZGlmXG4gICAgXG4gICAgI2luY2x1ZGUgPG5vcm1hbF9mcmFnbWVudF9iZWdpbj5cbiAgICAjaW5jbHVkZSA8bm9ybWFsX2ZyYWdtZW50X21hcHM+XG4gICAgXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudEVtaXNzaXZlJyl9XG4gICAgXG4gICAgI2luY2x1ZGUgPGVtaXNzaXZlbWFwX2ZyYWdtZW50PlxuICBcbiAgICAvLyBhY2N1bXVsYXRpb25cbiAgICAjaW5jbHVkZSA8bGlnaHRzX3BoeXNpY2FsX2ZyYWdtZW50PlxuICAgICNpbmNsdWRlIDxsaWdodHNfZnJhZ21lbnRfYmVnaW4+XG4gICAgI2luY2x1ZGUgPGxpZ2h0c19mcmFnbWVudF9tYXBzPlxuICAgICNpbmNsdWRlIDxsaWdodHNfZnJhZ21lbnRfZW5kPlxuICBcbiAgICAvLyBtb2R1bGF0aW9uXG4gICAgI2luY2x1ZGUgPGFvbWFwX2ZyYWdtZW50PlxuICBcbiAgICB2ZWMzIG91dGdvaW5nTGlnaHQgPSByZWZsZWN0ZWRMaWdodC5kaXJlY3REaWZmdXNlICsgcmVmbGVjdGVkTGlnaHQuaW5kaXJlY3REaWZmdXNlICsgcmVmbGVjdGVkTGlnaHQuZGlyZWN0U3BlY3VsYXIgKyByZWZsZWN0ZWRMaWdodC5pbmRpcmVjdFNwZWN1bGFyICsgdG90YWxFbWlzc2l2ZVJhZGlhbmNlO1xuICBcbiAgICBnbF9GcmFnQ29sb3IgPSB2ZWM0KCBvdXRnb2luZ0xpZ2h0LCBkaWZmdXNlQ29sb3IuYSApO1xuICBcbiAgICAjaW5jbHVkZSA8dG9uZW1hcHBpbmdfZnJhZ21lbnQ+XG4gICAgI2luY2x1ZGUgPGVuY29kaW5nc19mcmFnbWVudD5cbiAgICAjaW5jbHVkZSA8Zm9nX2ZyYWdtZW50PlxuICAgICNpbmNsdWRlIDxwcmVtdWx0aXBsaWVkX2FscGhhX2ZyYWdtZW50PlxuICAgICNpbmNsdWRlIDxkaXRoZXJpbmdfZnJhZ21lbnQ+XG4gIFxuICB9YDtcbn07XG5cbmV4cG9ydCB7IFN0YW5kYXJkQW5pbWF0aW9uTWF0ZXJpYWwgfTtcbiIsImltcG9ydCB7IFNoYWRlckxpYiB9IGZyb20gJ3RocmVlJztcbmltcG9ydCB7IFBob25nQW5pbWF0aW9uTWF0ZXJpYWwgfSBmcm9tICcuL1Bob25nQW5pbWF0aW9uTWF0ZXJpYWwnO1xuXG4vKipcbiAqIEV4dGVuZHMgVEhSRUUuTWVzaFRvb25NYXRlcmlhbCB3aXRoIGN1c3RvbSBzaGFkZXIgY2h1bmtzLiBNZXNoVG9vbk1hdGVyaWFsIGlzIG1vc3RseSB0aGUgc2FtZSBhcyBNZXNoUGhvbmdNYXRlcmlhbC4gVGhlIG9ubHkgZGlmZmVyZW5jZSBpcyBhIFRPT04gZGVmaW5lLCBhbmQgc3VwcG9ydCBmb3IgYSBncmFkaWVudE1hcCB1bmlmb3JtLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBwYXJhbWV0ZXJzIE9iamVjdCBjb250YWluaW5nIG1hdGVyaWFsIHByb3BlcnRpZXMgYW5kIGN1c3RvbSBzaGFkZXIgY2h1bmtzLlxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIFRvb25BbmltYXRpb25NYXRlcmlhbChwYXJhbWV0ZXJzKSB7XG4gIGlmICghcGFyYW1ldGVycy5kZWZpbmVzKSB7XG4gICAgcGFyYW1ldGVycy5kZWZpbmVzID0ge31cbiAgfVxuICBwYXJhbWV0ZXJzLmRlZmluZXNbJ1RPT04nXSA9ICcnXG5cbiAgUGhvbmdBbmltYXRpb25NYXRlcmlhbC5jYWxsKHRoaXMsIHBhcmFtZXRlcnMpO1xufVxuVG9vbkFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoUGhvbmdBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUpO1xuVG9vbkFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFRvb25BbmltYXRpb25NYXRlcmlhbDtcblxuZXhwb3J0IHsgVG9vbkFuaW1hdGlvbk1hdGVyaWFsIH07XG4iLCJpbXBvcnQgeyBTaGFkZXJMaWIgfSBmcm9tICd0aHJlZSc7XG5pbXBvcnQgQmFzZUFuaW1hdGlvbk1hdGVyaWFsIGZyb20gJy4vQmFzZUFuaW1hdGlvbk1hdGVyaWFsJztcblxuLyoqXG4gKiBFeHRlbmRzIFRIUkVFLlBvaW50c01hdGVyaWFsIHdpdGggY3VzdG9tIHNoYWRlciBjaHVua3MuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IHBhcmFtZXRlcnMgT2JqZWN0IGNvbnRhaW5pbmcgbWF0ZXJpYWwgcHJvcGVydGllcyBhbmQgY3VzdG9tIHNoYWRlciBjaHVua3MuXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gUG9pbnRzQW5pbWF0aW9uTWF0ZXJpYWwocGFyYW1ldGVycykge1xuICB0aGlzLnZhcnlpbmdQYXJhbWV0ZXJzID0gW107XG4gIFxuICB0aGlzLnZlcnRleEZ1bmN0aW9ucyA9IFtdO1xuICB0aGlzLnZlcnRleFBhcmFtZXRlcnMgPSBbXTtcbiAgdGhpcy52ZXJ0ZXhJbml0ID0gW107XG4gIHRoaXMudmVydGV4UG9zaXRpb24gPSBbXTtcbiAgdGhpcy52ZXJ0ZXhDb2xvciA9IFtdO1xuICBcbiAgdGhpcy5mcmFnbWVudEZ1bmN0aW9ucyA9IFtdO1xuICB0aGlzLmZyYWdtZW50UGFyYW1ldGVycyA9IFtdO1xuICB0aGlzLmZyYWdtZW50SW5pdCA9IFtdO1xuICB0aGlzLmZyYWdtZW50TWFwID0gW107XG4gIHRoaXMuZnJhZ21lbnREaWZmdXNlID0gW107XG4gIC8vIHVzZSBmcmFnbWVudCBzaGFkZXIgdG8gc2hhcGUgdG8gcG9pbnQsIHJlZmVyZW5jZTogaHR0cHM6Ly90aGVib29rb2ZzaGFkZXJzLmNvbS8wNy9cbiAgdGhpcy5mcmFnbWVudFNoYXBlID0gW107XG4gIFxuICBCYXNlQW5pbWF0aW9uTWF0ZXJpYWwuY2FsbCh0aGlzLCBwYXJhbWV0ZXJzLCBTaGFkZXJMaWJbJ3BvaW50cyddLnVuaWZvcm1zKTtcbiAgXG4gIHRoaXMudmVydGV4U2hhZGVyID0gdGhpcy5jb25jYXRWZXJ0ZXhTaGFkZXIoKTtcbiAgdGhpcy5mcmFnbWVudFNoYWRlciA9IHRoaXMuY29uY2F0RnJhZ21lbnRTaGFkZXIoKTtcbn1cblxuUG9pbnRzQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShCYXNlQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlKTtcblBvaW50c0FuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFBvaW50c0FuaW1hdGlvbk1hdGVyaWFsO1xuXG5Qb2ludHNBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uY2F0VmVydGV4U2hhZGVyID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gYFxuICB1bmlmb3JtIGZsb2F0IHNpemU7XG4gIHVuaWZvcm0gZmxvYXQgc2NhbGU7XG4gIFxuICAjaW5jbHVkZSA8Y29tbW9uPlxuICAjaW5jbHVkZSA8Y29sb3JfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxmb2dfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxzaGFkb3dtYXBfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc19wYXJzX3ZlcnRleD5cbiAgXG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UGFyYW1ldGVycycpfVxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZhcnlpbmdQYXJhbWV0ZXJzJyl9XG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4RnVuY3Rpb25zJyl9XG4gIFxuICB2b2lkIG1haW4oKSB7XG4gIFxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4SW5pdCcpfVxuICBcbiAgICAjaW5jbHVkZSA8Y29sb3JfdmVydGV4PlxuICAgICNpbmNsdWRlIDxiZWdpbl92ZXJ0ZXg+XG4gICAgXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQb3NpdGlvbicpfVxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4Q29sb3InKX1cbiAgICBcbiAgICAjaW5jbHVkZSA8cHJvamVjdF92ZXJ0ZXg+XG4gIFxuICAgICNpZmRlZiBVU0VfU0laRUFUVEVOVUFUSU9OXG4gICAgICBnbF9Qb2ludFNpemUgPSBzaXplICogKCBzY2FsZSAvIC0gbXZQb3NpdGlvbi56ICk7XG4gICAgI2Vsc2VcbiAgICAgIGdsX1BvaW50U2l6ZSA9IHNpemU7XG4gICAgI2VuZGlmXG4gIFxuICAgICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc192ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPHdvcmxkcG9zX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8c2hhZG93bWFwX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8Zm9nX3ZlcnRleD5cbiAgfWA7XG59O1xuXG5Qb2ludHNBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uY2F0RnJhZ21lbnRTaGFkZXIgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiBgXG4gIHVuaWZvcm0gdmVjMyBkaWZmdXNlO1xuICB1bmlmb3JtIGZsb2F0IG9wYWNpdHk7XG4gIFxuICAjaW5jbHVkZSA8Y29tbW9uPlxuICAjaW5jbHVkZSA8cGFja2luZz5cbiAgI2luY2x1ZGUgPGNvbG9yX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxtYXBfcGFydGljbGVfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGZvZ19wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8c2hhZG93bWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX3BhcnNfZnJhZ21lbnQ+XG4gIFxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50UGFyYW1ldGVycycpfVxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZhcnlpbmdQYXJhbWV0ZXJzJyl9XG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRGdW5jdGlvbnMnKX1cbiAgXG4gIHZvaWQgbWFpbigpIHtcbiAgXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudEluaXQnKX1cbiAgXG4gICAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc19mcmFnbWVudD5cbiAgXG4gICAgdmVjMyBvdXRnb2luZ0xpZ2h0ID0gdmVjMyggMC4wICk7XG4gICAgdmVjNCBkaWZmdXNlQ29sb3IgPSB2ZWM0KCBkaWZmdXNlLCBvcGFjaXR5ICk7XG4gIFxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnREaWZmdXNlJyl9XG4gIFxuICAgICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl9mcmFnbWVudD5cblxuICAgICR7KHRoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50TWFwJykgfHwgJyNpbmNsdWRlIDxtYXBfcGFydGljbGVfZnJhZ21lbnQ+Jyl9XG5cbiAgICAjaW5jbHVkZSA8Y29sb3JfZnJhZ21lbnQ+XG4gICAgI2luY2x1ZGUgPGFscGhhdGVzdF9mcmFnbWVudD5cbiAgXG4gICAgb3V0Z29pbmdMaWdodCA9IGRpZmZ1c2VDb2xvci5yZ2I7XG4gIFxuICAgIGdsX0ZyYWdDb2xvciA9IHZlYzQoIG91dGdvaW5nTGlnaHQsIGRpZmZ1c2VDb2xvci5hICk7XG4gICAgXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudFNoYXBlJyl9XG4gIFxuICAgICNpbmNsdWRlIDxwcmVtdWx0aXBsaWVkX2FscGhhX2ZyYWdtZW50PlxuICAgICNpbmNsdWRlIDx0b25lbWFwcGluZ19mcmFnbWVudD5cbiAgICAjaW5jbHVkZSA8ZW5jb2RpbmdzX2ZyYWdtZW50PlxuICAgICNpbmNsdWRlIDxmb2dfZnJhZ21lbnQ+XG4gIH1gO1xufTtcblxuZXhwb3J0IHsgUG9pbnRzQW5pbWF0aW9uTWF0ZXJpYWwgfTtcbiIsImltcG9ydCB7IFNoYWRlckxpYiwgVW5pZm9ybXNVdGlscywgUkdCQURlcHRoUGFja2luZyB9IGZyb20gJ3RocmVlJztcbmltcG9ydCBCYXNlQW5pbWF0aW9uTWF0ZXJpYWwgZnJvbSAnLi9CYXNlQW5pbWF0aW9uTWF0ZXJpYWwnO1xuXG5mdW5jdGlvbiBEZXB0aEFuaW1hdGlvbk1hdGVyaWFsKHBhcmFtZXRlcnMpIHtcbiAgdGhpcy5kZXB0aFBhY2tpbmcgPSBSR0JBRGVwdGhQYWNraW5nO1xuICB0aGlzLmNsaXBwaW5nID0gdHJ1ZTtcblxuICB0aGlzLnZlcnRleEZ1bmN0aW9ucyA9IFtdO1xuICB0aGlzLnZlcnRleFBhcmFtZXRlcnMgPSBbXTtcbiAgdGhpcy52ZXJ0ZXhJbml0ID0gW107XG4gIHRoaXMudmVydGV4UG9zaXRpb24gPSBbXTtcbiAgdGhpcy52ZXJ0ZXhQb3N0TW9ycGggPSBbXTtcbiAgdGhpcy52ZXJ0ZXhQb3N0U2tpbm5pbmcgPSBbXTtcblxuICBCYXNlQW5pbWF0aW9uTWF0ZXJpYWwuY2FsbCh0aGlzLCBwYXJhbWV0ZXJzKTtcbiAgXG4gIHRoaXMudW5pZm9ybXMgPSBVbmlmb3Jtc1V0aWxzLm1lcmdlKFtTaGFkZXJMaWJbJ2RlcHRoJ10udW5pZm9ybXMsIHRoaXMudW5pZm9ybXNdKTtcbiAgdGhpcy52ZXJ0ZXhTaGFkZXIgPSB0aGlzLmNvbmNhdFZlcnRleFNoYWRlcigpO1xuICB0aGlzLmZyYWdtZW50U2hhZGVyID0gU2hhZGVyTGliWydkZXB0aCddLmZyYWdtZW50U2hhZGVyO1xufVxuRGVwdGhBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEJhc2VBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUpO1xuRGVwdGhBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBEZXB0aEFuaW1hdGlvbk1hdGVyaWFsO1xuXG5EZXB0aEFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZS5jb25jYXRWZXJ0ZXhTaGFkZXIgPSBmdW5jdGlvbiAoKSB7XG4gIFxuICByZXR1cm4gYFxuICAjaW5jbHVkZSA8Y29tbW9uPlxuICAjaW5jbHVkZSA8dXZfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxkaXNwbGFjZW1lbnRtYXBfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxtb3JwaHRhcmdldF9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPHNraW5uaW5nX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfcGFyc192ZXJ0ZXg+XG4gIFxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBhcmFtZXRlcnMnKX1cbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhGdW5jdGlvbnMnKX1cbiAgXG4gIHZvaWQgbWFpbigpIHtcbiAgXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhJbml0Jyl9XG4gIFxuICAgICNpbmNsdWRlIDx1dl92ZXJ0ZXg+XG4gIFxuICAgICNpbmNsdWRlIDxza2luYmFzZV92ZXJ0ZXg+XG4gIFxuICAgICNpZmRlZiBVU0VfRElTUExBQ0VNRU5UTUFQXG4gIFxuICAgICAgI2luY2x1ZGUgPGJlZ2lubm9ybWFsX3ZlcnRleD5cbiAgICAgICNpbmNsdWRlIDxtb3JwaG5vcm1hbF92ZXJ0ZXg+XG4gICAgICAjaW5jbHVkZSA8c2tpbm5vcm1hbF92ZXJ0ZXg+XG4gIFxuICAgICNlbmRpZlxuICBcbiAgICAjaW5jbHVkZSA8YmVnaW5fdmVydGV4PlxuICAgIFxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UG9zaXRpb24nKX1cblxuICAgICNpbmNsdWRlIDxtb3JwaHRhcmdldF92ZXJ0ZXg+XG4gICAgXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQb3N0TW9ycGgnKX1cbiAgICBcbiAgICAjaW5jbHVkZSA8c2tpbm5pbmdfdmVydGV4PlxuXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQb3N0U2tpbm5pbmcnKX1cbiAgICBcbiAgICAjaW5jbHVkZSA8ZGlzcGxhY2VtZW50bWFwX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8cHJvamVjdF92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPGxvZ2RlcHRoYnVmX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX3ZlcnRleD5cbiAgfWA7XG59O1xuXG5leHBvcnQgeyBEZXB0aEFuaW1hdGlvbk1hdGVyaWFsIH07XG4iLCJpbXBvcnQgeyBTaGFkZXJMaWIsIFVuaWZvcm1zVXRpbHMsIFJHQkFEZXB0aFBhY2tpbmcgfSBmcm9tICd0aHJlZSc7XG5pbXBvcnQgQmFzZUFuaW1hdGlvbk1hdGVyaWFsIGZyb20gJy4vQmFzZUFuaW1hdGlvbk1hdGVyaWFsJztcblxuZnVuY3Rpb24gRGlzdGFuY2VBbmltYXRpb25NYXRlcmlhbChwYXJhbWV0ZXJzKSB7XG4gIHRoaXMuZGVwdGhQYWNraW5nID0gUkdCQURlcHRoUGFja2luZztcbiAgdGhpcy5jbGlwcGluZyA9IHRydWU7XG5cbiAgdGhpcy52ZXJ0ZXhGdW5jdGlvbnMgPSBbXTtcbiAgdGhpcy52ZXJ0ZXhQYXJhbWV0ZXJzID0gW107XG4gIHRoaXMudmVydGV4SW5pdCA9IFtdO1xuICB0aGlzLnZlcnRleFBvc2l0aW9uID0gW107XG4gIHRoaXMudmVydGV4UG9zdE1vcnBoID0gW107XG4gIHRoaXMudmVydGV4UG9zdFNraW5uaW5nID0gW107XG5cbiAgQmFzZUFuaW1hdGlvbk1hdGVyaWFsLmNhbGwodGhpcywgcGFyYW1ldGVycyk7XG4gIFxuICB0aGlzLnVuaWZvcm1zID0gVW5pZm9ybXNVdGlscy5tZXJnZShbU2hhZGVyTGliWydkaXN0YW5jZVJHQkEnXS51bmlmb3JtcywgdGhpcy51bmlmb3Jtc10pO1xuICB0aGlzLnZlcnRleFNoYWRlciA9IHRoaXMuY29uY2F0VmVydGV4U2hhZGVyKCk7XG4gIHRoaXMuZnJhZ21lbnRTaGFkZXIgPSBTaGFkZXJMaWJbJ2Rpc3RhbmNlUkdCQSddLmZyYWdtZW50U2hhZGVyO1xufVxuRGlzdGFuY2VBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEJhc2VBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUpO1xuRGlzdGFuY2VBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBEaXN0YW5jZUFuaW1hdGlvbk1hdGVyaWFsO1xuXG5EaXN0YW5jZUFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZS5jb25jYXRWZXJ0ZXhTaGFkZXIgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiBgXG4gICNkZWZpbmUgRElTVEFOQ0VcblxuICB2YXJ5aW5nIHZlYzMgdldvcmxkUG9zaXRpb247XG4gIFxuICAjaW5jbHVkZSA8Y29tbW9uPlxuICAjaW5jbHVkZSA8dXZfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxkaXNwbGFjZW1lbnRtYXBfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxtb3JwaHRhcmdldF9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPHNraW5uaW5nX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX3BhcnNfdmVydGV4PlxuICBcbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQYXJhbWV0ZXJzJyl9XG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4RnVuY3Rpb25zJyl9XG4gIFxuICB2b2lkIG1haW4oKSB7XG5cbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleEluaXQnKX1cbiAgXG4gICAgI2luY2x1ZGUgPHV2X3ZlcnRleD5cbiAgXG4gICAgI2luY2x1ZGUgPHNraW5iYXNlX3ZlcnRleD5cbiAgXG4gICAgI2lmZGVmIFVTRV9ESVNQTEFDRU1FTlRNQVBcbiAgXG4gICAgICAjaW5jbHVkZSA8YmVnaW5ub3JtYWxfdmVydGV4PlxuICAgICAgI2luY2x1ZGUgPG1vcnBobm9ybWFsX3ZlcnRleD5cbiAgICAgICNpbmNsdWRlIDxza2lubm9ybWFsX3ZlcnRleD5cbiAgXG4gICAgI2VuZGlmXG4gIFxuICAgICNpbmNsdWRlIDxiZWdpbl92ZXJ0ZXg+XG4gICAgXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQb3NpdGlvbicpfVxuXG4gICAgI2luY2x1ZGUgPG1vcnBodGFyZ2V0X3ZlcnRleD5cbiAgICBcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBvc3RNb3JwaCcpfVxuICAgIFxuICAgICNpbmNsdWRlIDxza2lubmluZ192ZXJ0ZXg+XG5cbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBvc3RTa2lubmluZycpfVxuICAgIFxuICAgICNpbmNsdWRlIDxkaXNwbGFjZW1lbnRtYXBfdmVydGV4PlxuICAgICNpbmNsdWRlIDxwcm9qZWN0X3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8d29ybGRwb3NfdmVydGV4PlxuICAgICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfdmVydGV4PlxuICBcbiAgICB2V29ybGRQb3NpdGlvbiA9IHdvcmxkUG9zaXRpb24ueHl6O1xuICBcbiAgfWA7XG59O1xuXG5leHBvcnQgeyBEaXN0YW5jZUFuaW1hdGlvbk1hdGVyaWFsIH07XG4iLCJpbXBvcnQgeyBCdWZmZXJHZW9tZXRyeSwgQnVmZmVyQXR0cmlidXRlIH0gZnJvbSAndGhyZWUnO1xuLyoqXG4gKiBBIEJ1ZmZlckdlb21ldHJ5IHdoZXJlIGEgJ3ByZWZhYicgZ2VvbWV0cnkgaXMgcmVwZWF0ZWQgYSBudW1iZXIgb2YgdGltZXMuXG4gKlxuICogQHBhcmFtIHtHZW9tZXRyeXxCdWZmZXJHZW9tZXRyeX0gcHJlZmFiIFRoZSBHZW9tZXRyeSBpbnN0YW5jZSB0byByZXBlYXQuXG4gKiBAcGFyYW0ge051bWJlcn0gY291bnQgVGhlIG51bWJlciBvZiB0aW1lcyB0byByZXBlYXQgdGhlIGdlb21ldHJ5LlxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIFByZWZhYkJ1ZmZlckdlb21ldHJ5KHByZWZhYiwgY291bnQpIHtcbiAgQnVmZmVyR2VvbWV0cnkuY2FsbCh0aGlzKTtcblxuICAvKipcbiAgICogQSByZWZlcmVuY2UgdG8gdGhlIHByZWZhYiBnZW9tZXRyeSB1c2VkIHRvIGNyZWF0ZSB0aGlzIGluc3RhbmNlLlxuICAgKiBAdHlwZSB7R2VvbWV0cnl8QnVmZmVyR2VvbWV0cnl9XG4gICAqL1xuICB0aGlzLnByZWZhYkdlb21ldHJ5ID0gcHJlZmFiO1xuICB0aGlzLmlzUHJlZmFiQnVmZmVyR2VvbWV0cnkgPSBwcmVmYWIuaXNCdWZmZXJHZW9tZXRyeTtcblxuICAvKipcbiAgICogTnVtYmVyIG9mIHByZWZhYnMuXG4gICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAqL1xuICB0aGlzLnByZWZhYkNvdW50ID0gY291bnQ7XG5cbiAgLyoqXG4gICAqIE51bWJlciBvZiB2ZXJ0aWNlcyBvZiB0aGUgcHJlZmFiLlxuICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgKi9cbiAgaWYgKHRoaXMuaXNQcmVmYWJCdWZmZXJHZW9tZXRyeSkge1xuICAgIHRoaXMucHJlZmFiVmVydGV4Q291bnQgPSBwcmVmYWIuYXR0cmlidXRlcy5wb3NpdGlvbi5jb3VudDtcbiAgfVxuICBlbHNlIHtcbiAgICB0aGlzLnByZWZhYlZlcnRleENvdW50ID0gcHJlZmFiLnZlcnRpY2VzLmxlbmd0aDtcbiAgfVxuXG4gIHRoaXMuYnVmZmVySW5kaWNlcygpO1xuICB0aGlzLmJ1ZmZlclBvc2l0aW9ucygpO1xufVxuUHJlZmFiQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUpO1xuUHJlZmFiQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gUHJlZmFiQnVmZmVyR2VvbWV0cnk7XG5cblByZWZhYkJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5idWZmZXJJbmRpY2VzID0gZnVuY3Rpb24oKSB7XG4gIGxldCBwcmVmYWJJbmRpY2VzID0gW107XG4gIGxldCBwcmVmYWJJbmRleENvdW50O1xuXG4gIGlmICh0aGlzLmlzUHJlZmFiQnVmZmVyR2VvbWV0cnkpIHtcbiAgICBpZiAodGhpcy5wcmVmYWJHZW9tZXRyeS5pbmRleCkge1xuICAgICAgcHJlZmFiSW5kZXhDb3VudCA9IHRoaXMucHJlZmFiR2VvbWV0cnkuaW5kZXguY291bnQ7XG4gICAgICBwcmVmYWJJbmRpY2VzID0gdGhpcy5wcmVmYWJHZW9tZXRyeS5pbmRleC5hcnJheTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBwcmVmYWJJbmRleENvdW50ID0gdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudDtcblxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcmVmYWJJbmRleENvdW50OyBpKyspIHtcbiAgICAgICAgcHJlZmFiSW5kaWNlcy5wdXNoKGkpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBlbHNlIHtcbiAgICBjb25zdCBwcmVmYWJGYWNlQ291bnQgPSB0aGlzLnByZWZhYkdlb21ldHJ5LmZhY2VzLmxlbmd0aDtcbiAgICBwcmVmYWJJbmRleENvdW50ID0gcHJlZmFiRmFjZUNvdW50ICogMztcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHJlZmFiRmFjZUNvdW50OyBpKyspIHtcbiAgICAgIGNvbnN0IGZhY2UgPSB0aGlzLnByZWZhYkdlb21ldHJ5LmZhY2VzW2ldO1xuICAgICAgcHJlZmFiSW5kaWNlcy5wdXNoKGZhY2UuYSwgZmFjZS5iLCBmYWNlLmMpO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IGluZGV4QnVmZmVyID0gbmV3IFVpbnQzMkFycmF5KHRoaXMucHJlZmFiQ291bnQgKiBwcmVmYWJJbmRleENvdW50KTtcblxuICB0aGlzLnNldEluZGV4KG5ldyBCdWZmZXJBdHRyaWJ1dGUoaW5kZXhCdWZmZXIsIDEpKTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucHJlZmFiQ291bnQ7IGkrKykge1xuICAgIGZvciAobGV0IGsgPSAwOyBrIDwgcHJlZmFiSW5kZXhDb3VudDsgaysrKSB7XG4gICAgICBpbmRleEJ1ZmZlcltpICogcHJlZmFiSW5kZXhDb3VudCArIGtdID0gcHJlZmFiSW5kaWNlc1trXSArIGkgKiB0aGlzLnByZWZhYlZlcnRleENvdW50O1xuICAgIH1cbiAgfVxufTtcblxuUHJlZmFiQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmJ1ZmZlclBvc2l0aW9ucyA9IGZ1bmN0aW9uKCkge1xuICBjb25zdCBwb3NpdGlvbkJ1ZmZlciA9IHRoaXMuY3JlYXRlQXR0cmlidXRlKCdwb3NpdGlvbicsIDMpLmFycmF5O1xuXG4gIGlmICh0aGlzLmlzUHJlZmFiQnVmZmVyR2VvbWV0cnkpIHtcbiAgICBjb25zdCBwb3NpdGlvbnMgPSB0aGlzLnByZWZhYkdlb21ldHJ5LmF0dHJpYnV0ZXMucG9zaXRpb24uYXJyYXk7XG5cbiAgICBmb3IgKGxldCBpID0gMCwgb2Zmc2V0ID0gMDsgaSA8IHRoaXMucHJlZmFiQ291bnQ7IGkrKykge1xuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCB0aGlzLnByZWZhYlZlcnRleENvdW50OyBqKyssIG9mZnNldCArPSAzKSB7XG4gICAgICAgIHBvc2l0aW9uQnVmZmVyW29mZnNldCAgICBdID0gcG9zaXRpb25zW2ogKiAzXTtcbiAgICAgICAgcG9zaXRpb25CdWZmZXJbb2Zmc2V0ICsgMV0gPSBwb3NpdGlvbnNbaiAqIDMgKyAxXTtcbiAgICAgICAgcG9zaXRpb25CdWZmZXJbb2Zmc2V0ICsgMl0gPSBwb3NpdGlvbnNbaiAqIDMgKyAyXTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgZWxzZSB7XG4gICAgZm9yIChsZXQgaSA9IDAsIG9mZnNldCA9IDA7IGkgPCB0aGlzLnByZWZhYkNvdW50OyBpKyspIHtcbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudDsgaisrLCBvZmZzZXQgKz0gMykge1xuICAgICAgICBjb25zdCBwcmVmYWJWZXJ0ZXggPSB0aGlzLnByZWZhYkdlb21ldHJ5LnZlcnRpY2VzW2pdO1xuXG4gICAgICAgIHBvc2l0aW9uQnVmZmVyW29mZnNldCAgICBdID0gcHJlZmFiVmVydGV4Lng7XG4gICAgICAgIHBvc2l0aW9uQnVmZmVyW29mZnNldCArIDFdID0gcHJlZmFiVmVydGV4Lnk7XG4gICAgICAgIHBvc2l0aW9uQnVmZmVyW29mZnNldCArIDJdID0gcHJlZmFiVmVydGV4Lno7XG4gICAgICB9XG4gICAgfVxuICB9XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBCdWZmZXJBdHRyaWJ1dGUgd2l0aCBVViBjb29yZGluYXRlcy5cbiAqL1xuUHJlZmFiQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmJ1ZmZlclV2cyA9IGZ1bmN0aW9uKCkge1xuICBjb25zdCB1dkJ1ZmZlciA9IHRoaXMuY3JlYXRlQXR0cmlidXRlKCd1dicsIDIpLmFycmF5O1xuXG4gIGlmICh0aGlzLmlzUHJlZmFiQnVmZmVyR2VvbWV0cnkpIHtcbiAgICBjb25zdCB1dnMgPSB0aGlzLnByZWZhYkdlb21ldHJ5LmF0dHJpYnV0ZXMudXYuYXJyYXlcblxuICAgIGZvciAobGV0IGkgPSAwLCBvZmZzZXQgPSAwOyBpIDwgdGhpcy5wcmVmYWJDb3VudDsgaSsrKSB7XG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHRoaXMucHJlZmFiVmVydGV4Q291bnQ7IGorKywgb2Zmc2V0ICs9IDIpIHtcbiAgICAgICAgdXZCdWZmZXJbb2Zmc2V0ICAgIF0gPSB1dnNbaiAqIDJdO1xuICAgICAgICB1dkJ1ZmZlcltvZmZzZXQgKyAxXSA9IHV2c1tqICogMiArIDFdO1xuICAgICAgfVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBjb25zdCBwcmVmYWJGYWNlQ291bnQgPSB0aGlzLnByZWZhYkdlb21ldHJ5LmZhY2VzLmxlbmd0aDtcbiAgICBjb25zdCB1dnMgPSBbXVxuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcmVmYWJGYWNlQ291bnQ7IGkrKykge1xuICAgICAgY29uc3QgZmFjZSA9IHRoaXMucHJlZmFiR2VvbWV0cnkuZmFjZXNbaV07XG4gICAgICBjb25zdCB1diA9IHRoaXMucHJlZmFiR2VvbWV0cnkuZmFjZVZlcnRleFV2c1swXVtpXTtcblxuICAgICAgdXZzW2ZhY2UuYV0gPSB1dlswXTtcbiAgICAgIHV2c1tmYWNlLmJdID0gdXZbMV07XG4gICAgICB1dnNbZmFjZS5jXSA9IHV2WzJdO1xuICAgIH1cblxuICAgIGZvciAobGV0IGkgPSAwLCBvZmZzZXQgPSAwOyBpIDwgdGhpcy5wcmVmYWJDb3VudDsgaSsrKSB7XG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHRoaXMucHJlZmFiVmVydGV4Q291bnQ7IGorKywgb2Zmc2V0ICs9IDIpIHtcbiAgICAgICAgY29uc3QgdXYgPSB1dnNbal07XG5cbiAgICAgICAgdXZCdWZmZXJbb2Zmc2V0XSA9IHV2Lng7XG4gICAgICAgIHV2QnVmZmVyW29mZnNldCArIDFdID0gdXYueTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn07XG5cbi8qKlxuICogQ3JlYXRlcyBhIEJ1ZmZlckF0dHJpYnV0ZSBvbiB0aGlzIGdlb21ldHJ5IGluc3RhbmNlLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIE5hbWUgb2YgdGhlIGF0dHJpYnV0ZS5cbiAqIEBwYXJhbSB7TnVtYmVyfSBpdGVtU2l6ZSBOdW1iZXIgb2YgZmxvYXRzIHBlciB2ZXJ0ZXggKHR5cGljYWxseSAxLCAyLCAzIG9yIDQpLlxuICogQHBhcmFtIHtmdW5jdGlvbj19IGZhY3RvcnkgRnVuY3Rpb24gdGhhdCB3aWxsIGJlIGNhbGxlZCBmb3IgZWFjaCBwcmVmYWIgdXBvbiBjcmVhdGlvbi4gQWNjZXB0cyAzIGFyZ3VtZW50czogZGF0YVtdLCBpbmRleCBhbmQgcHJlZmFiQ291bnQuIENhbGxzIHNldFByZWZhYkRhdGEuXG4gKlxuICogQHJldHVybnMge0J1ZmZlckF0dHJpYnV0ZX1cbiAqL1xuUHJlZmFiQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmNyZWF0ZUF0dHJpYnV0ZSA9IGZ1bmN0aW9uKG5hbWUsIGl0ZW1TaXplLCBmYWN0b3J5KSB7XG4gIGNvbnN0IGJ1ZmZlciA9IG5ldyBGbG9hdDMyQXJyYXkodGhpcy5wcmVmYWJDb3VudCAqIHRoaXMucHJlZmFiVmVydGV4Q291bnQgKiBpdGVtU2l6ZSk7XG4gIGNvbnN0IGF0dHJpYnV0ZSA9IG5ldyBCdWZmZXJBdHRyaWJ1dGUoYnVmZmVyLCBpdGVtU2l6ZSk7XG5cbiAgdGhpcy5hZGRBdHRyaWJ1dGUobmFtZSwgYXR0cmlidXRlKTtcblxuICBpZiAoZmFjdG9yeSkge1xuICAgIGNvbnN0IGRhdGEgPSBbXTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5wcmVmYWJDb3VudDsgaSsrKSB7XG4gICAgICBmYWN0b3J5KGRhdGEsIGksIHRoaXMucHJlZmFiQ291bnQpO1xuICAgICAgdGhpcy5zZXRQcmVmYWJEYXRhKGF0dHJpYnV0ZSwgaSwgZGF0YSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGF0dHJpYnV0ZTtcbn07XG5cbi8qKlxuICogU2V0cyBkYXRhIGZvciBhbGwgdmVydGljZXMgb2YgYSBwcmVmYWIgYXQgYSBnaXZlbiBpbmRleC5cbiAqIFVzdWFsbHkgY2FsbGVkIGluIGEgbG9vcC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ3xCdWZmZXJBdHRyaWJ1dGV9IGF0dHJpYnV0ZSBUaGUgYXR0cmlidXRlIG9yIGF0dHJpYnV0ZSBuYW1lIHdoZXJlIHRoZSBkYXRhIGlzIHRvIGJlIHN0b3JlZC5cbiAqIEBwYXJhbSB7TnVtYmVyfSBwcmVmYWJJbmRleCBJbmRleCBvZiB0aGUgcHJlZmFiIGluIHRoZSBidWZmZXIgZ2VvbWV0cnkuXG4gKiBAcGFyYW0ge0FycmF5fSBkYXRhIEFycmF5IG9mIGRhdGEuIExlbmd0aCBzaG91bGQgYmUgZXF1YWwgdG8gaXRlbSBzaXplIG9mIHRoZSBhdHRyaWJ1dGUuXG4gKi9cblByZWZhYkJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5zZXRQcmVmYWJEYXRhID0gZnVuY3Rpb24oYXR0cmlidXRlLCBwcmVmYWJJbmRleCwgZGF0YSkge1xuICBhdHRyaWJ1dGUgPSAodHlwZW9mIGF0dHJpYnV0ZSA9PT0gJ3N0cmluZycpID8gdGhpcy5hdHRyaWJ1dGVzW2F0dHJpYnV0ZV0gOiBhdHRyaWJ1dGU7XG5cbiAgbGV0IG9mZnNldCA9IHByZWZhYkluZGV4ICogdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudCAqIGF0dHJpYnV0ZS5pdGVtU2l6ZTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucHJlZmFiVmVydGV4Q291bnQ7IGkrKykge1xuICAgIGZvciAobGV0IGogPSAwOyBqIDwgYXR0cmlidXRlLml0ZW1TaXplOyBqKyspIHtcbiAgICAgIGF0dHJpYnV0ZS5hcnJheVtvZmZzZXQrK10gPSBkYXRhW2pdO1xuICAgIH1cbiAgfVxufTtcblxuZXhwb3J0IHsgUHJlZmFiQnVmZmVyR2VvbWV0cnkgfTtcbiIsImltcG9ydCB7IEJ1ZmZlckdlb21ldHJ5LCBCdWZmZXJBdHRyaWJ1dGUgfSBmcm9tICd0aHJlZSc7XG4vKipcbiAqIEEgQnVmZmVyR2VvbWV0cnkgd2hlcmUgYSAncHJlZmFiJyBnZW9tZXRyeSBhcnJheSBpcyByZXBlYXRlZCBhIG51bWJlciBvZiB0aW1lcy5cbiAqXG4gKiBAcGFyYW0ge0FycmF5fSBwcmVmYWJzIEFuIGFycmF5IHdpdGggR2VvbWV0cnkgaW5zdGFuY2VzIHRvIHJlcGVhdC5cbiAqIEBwYXJhbSB7TnVtYmVyfSByZXBlYXRDb3VudCBUaGUgbnVtYmVyIG9mIHRpbWVzIHRvIHJlcGVhdCB0aGUgYXJyYXkgb2YgR2VvbWV0cmllcy5cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBNdWx0aVByZWZhYkJ1ZmZlckdlb21ldHJ5KHByZWZhYnMsIHJlcGVhdENvdW50KSB7XG4gIEJ1ZmZlckdlb21ldHJ5LmNhbGwodGhpcyk7XG5cbiAgaWYgKEFycmF5LmlzQXJyYXkocHJlZmFicykpIHtcbiAgICB0aGlzLnByZWZhYkdlb21ldHJpZXMgPSBwcmVmYWJzO1xuICB9IGVsc2Uge1xuICAgIHRoaXMucHJlZmFiR2VvbWV0cmllcyA9IFtwcmVmYWJzXTtcbiAgfVxuXG4gIHRoaXMucHJlZmFiR2VvbWV0cmllc0NvdW50ID0gdGhpcy5wcmVmYWJHZW9tZXRyaWVzLmxlbmd0aDtcblxuICAvKipcbiAgICogTnVtYmVyIG9mIHByZWZhYnMuXG4gICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAqL1xuICB0aGlzLnByZWZhYkNvdW50ID0gcmVwZWF0Q291bnQgKiB0aGlzLnByZWZhYkdlb21ldHJpZXNDb3VudDtcbiAgLyoqXG4gICAqIEhvdyBvZnRlbiB0aGUgcHJlZmFiIGFycmF5IGlzIHJlcGVhdGVkLlxuICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgKi9cbiAgdGhpcy5yZXBlYXRDb3VudCA9IHJlcGVhdENvdW50O1xuICBcbiAgLyoqXG4gICAqIEFycmF5IG9mIHZlcnRleCBjb3VudHMgcGVyIHByZWZhYi5cbiAgICogQHR5cGUge0FycmF5fVxuICAgKi9cbiAgdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudHMgPSB0aGlzLnByZWZhYkdlb21ldHJpZXMubWFwKHAgPT4gcC5pc0J1ZmZlckdlb21ldHJ5ID8gcC5hdHRyaWJ1dGVzLnBvc2l0aW9uLmNvdW50IDogcC52ZXJ0aWNlcy5sZW5ndGgpO1xuICAvKipcbiAgICogVG90YWwgbnVtYmVyIG9mIHZlcnRpY2VzIGZvciBvbmUgcmVwZXRpdGlvbiBvZiB0aGUgcHJlZmFic1xuICAgKiBAdHlwZSB7bnVtYmVyfVxuICAgKi9cbiAgdGhpcy5yZXBlYXRWZXJ0ZXhDb3VudCA9IHRoaXMucHJlZmFiVmVydGV4Q291bnRzLnJlZHVjZSgociwgdikgPT4gciArIHYsIDApO1xuXG4gIHRoaXMuYnVmZmVySW5kaWNlcygpO1xuICB0aGlzLmJ1ZmZlclBvc2l0aW9ucygpO1xufVxuTXVsdGlQcmVmYWJCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZSk7XG5NdWx0aVByZWZhYkJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IE11bHRpUHJlZmFiQnVmZmVyR2VvbWV0cnk7XG5cbk11bHRpUHJlZmFiQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmJ1ZmZlckluZGljZXMgPSBmdW5jdGlvbigpIHtcbiAgbGV0IHJlcGVhdEluZGV4Q291bnQgPSAwO1xuXG4gIHRoaXMucHJlZmFiSW5kaWNlcyA9IHRoaXMucHJlZmFiR2VvbWV0cmllcy5tYXAoZ2VvbWV0cnkgPT4ge1xuICAgIGxldCBpbmRpY2VzID0gW107XG5cbiAgICBpZiAoZ2VvbWV0cnkuaXNCdWZmZXJHZW9tZXRyeSkge1xuICAgICAgaWYgKGdlb21ldHJ5LmluZGV4KSB7XG4gICAgICAgIGluZGljZXMgPSBnZW9tZXRyeS5pbmRleC5hcnJheTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZ2VvbWV0cnkuYXR0cmlidXRlcy5wb3NpdGlvbi5jb3VudDsgaSsrKSB7XG4gICAgICAgICAgaW5kaWNlcy5wdXNoKGkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZ2VvbWV0cnkuZmFjZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgZmFjZSA9IGdlb21ldHJ5LmZhY2VzW2ldO1xuICAgICAgICBpbmRpY2VzLnB1c2goZmFjZS5hLCBmYWNlLmIsIGZhY2UuYyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmVwZWF0SW5kZXhDb3VudCArPSBpbmRpY2VzLmxlbmd0aDtcblxuICAgIHJldHVybiBpbmRpY2VzO1xuICB9KTtcblxuICBjb25zdCBpbmRleEJ1ZmZlciA9IG5ldyBVaW50MzJBcnJheShyZXBlYXRJbmRleENvdW50ICogdGhpcy5yZXBlYXRDb3VudCk7XG4gIGxldCBpbmRleE9mZnNldCA9IDA7XG4gIGxldCBwcmVmYWJPZmZzZXQgPSAwO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5wcmVmYWJDb3VudDsgaSsrKSB7XG4gICAgY29uc3QgaW5kZXggPSBpICUgdGhpcy5wcmVmYWJHZW9tZXRyaWVzQ291bnQ7XG4gICAgY29uc3QgaW5kaWNlcyA9IHRoaXMucHJlZmFiSW5kaWNlc1tpbmRleF07XG4gICAgY29uc3QgdmVydGV4Q291bnQgPSB0aGlzLnByZWZhYlZlcnRleENvdW50c1tpbmRleF07XG5cbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IGluZGljZXMubGVuZ3RoOyBqKyspIHtcbiAgICAgIGluZGV4QnVmZmVyW2luZGV4T2Zmc2V0KytdID0gaW5kaWNlc1tqXSArIHByZWZhYk9mZnNldDtcbiAgICB9XG5cbiAgICBwcmVmYWJPZmZzZXQgKz0gdmVydGV4Q291bnQ7XG4gIH1cblxuICB0aGlzLnNldEluZGV4KG5ldyBCdWZmZXJBdHRyaWJ1dGUoaW5kZXhCdWZmZXIsIDEpKTtcbn07XG5cbk11bHRpUHJlZmFiQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmJ1ZmZlclBvc2l0aW9ucyA9IGZ1bmN0aW9uKCkge1xuICBjb25zdCBwb3NpdGlvbkJ1ZmZlciA9IHRoaXMuY3JlYXRlQXR0cmlidXRlKCdwb3NpdGlvbicsIDMpLmFycmF5O1xuXG4gIGNvbnN0IHByZWZhYlBvc2l0aW9ucyA9IHRoaXMucHJlZmFiR2VvbWV0cmllcy5tYXAoKGdlb21ldHJ5LCBpKSA9PiB7XG4gICAgbGV0IHBvc2l0aW9ucztcblxuICAgIGlmIChnZW9tZXRyeS5pc0J1ZmZlckdlb21ldHJ5KSB7XG4gICAgICBwb3NpdGlvbnMgPSBnZW9tZXRyeS5hdHRyaWJ1dGVzLnBvc2l0aW9uLmFycmF5O1xuICAgIH0gZWxzZSB7XG5cbiAgICAgIGNvbnN0IHZlcnRleENvdW50ID0gdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudHNbaV07XG5cbiAgICAgIHBvc2l0aW9ucyA9IFtdO1xuXG4gICAgICBmb3IgKGxldCBqID0gMCwgb2Zmc2V0ID0gMDsgaiA8IHZlcnRleENvdW50OyBqKyspIHtcbiAgICAgICAgY29uc3QgcHJlZmFiVmVydGV4ID0gZ2VvbWV0cnkudmVydGljZXNbal07XG5cbiAgICAgICAgcG9zaXRpb25zW29mZnNldCsrXSA9IHByZWZhYlZlcnRleC54O1xuICAgICAgICBwb3NpdGlvbnNbb2Zmc2V0KytdID0gcHJlZmFiVmVydGV4Lnk7XG4gICAgICAgIHBvc2l0aW9uc1tvZmZzZXQrK10gPSBwcmVmYWJWZXJ0ZXguejtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gcG9zaXRpb25zO1xuICB9KTtcblxuICBmb3IgKGxldCBpID0gMCwgb2Zmc2V0ID0gMDsgaSA8IHRoaXMucHJlZmFiQ291bnQ7IGkrKykge1xuICAgIGNvbnN0IGluZGV4ID0gaSAlIHRoaXMucHJlZmFiR2VvbWV0cmllcy5sZW5ndGg7XG4gICAgY29uc3QgdmVydGV4Q291bnQgPSB0aGlzLnByZWZhYlZlcnRleENvdW50c1tpbmRleF07XG4gICAgY29uc3QgcG9zaXRpb25zID0gcHJlZmFiUG9zaXRpb25zW2luZGV4XTtcblxuICAgIGZvciAobGV0IGogPSAwOyBqIDwgdmVydGV4Q291bnQ7IGorKykge1xuICAgICAgcG9zaXRpb25CdWZmZXJbb2Zmc2V0KytdID0gcG9zaXRpb25zW2ogKiAzXTtcbiAgICAgIHBvc2l0aW9uQnVmZmVyW29mZnNldCsrXSA9IHBvc2l0aW9uc1tqICogMyArIDFdO1xuICAgICAgcG9zaXRpb25CdWZmZXJbb2Zmc2V0KytdID0gcG9zaXRpb25zW2ogKiAzICsgMl07XG4gICAgfVxuICB9XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBCdWZmZXJBdHRyaWJ1dGUgd2l0aCBVViBjb29yZGluYXRlcy5cbiAqL1xuTXVsdGlQcmVmYWJCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuYnVmZmVyVXZzID0gZnVuY3Rpb24oKSB7XG4gIGNvbnN0IHV2QnVmZmVyID0gdGhpcy5jcmVhdGVBdHRyaWJ1dGUoJ3V2JywgMikuYXJyYXk7XG5cbiAgY29uc3QgcHJlZmFiVXZzID0gdGhpcy5wcmVmYWJHZW9tZXRyaWVzLm1hcCgoZ2VvbWV0cnksIGkpID0+IHtcbiAgICBsZXQgdXZzO1xuXG4gICAgaWYgKGdlb21ldHJ5LmlzQnVmZmVyR2VvbWV0cnkpIHtcbiAgICAgIGlmICghZ2VvbWV0cnkuYXR0cmlidXRlcy51dikge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdObyBVViBmb3VuZCBpbiBwcmVmYWIgZ2VvbWV0cnknLCBnZW9tZXRyeSk7XG4gICAgICB9XG5cbiAgICAgIHV2cyA9IGdlb21ldHJ5LmF0dHJpYnV0ZXMudXYuYXJyYXk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHByZWZhYkZhY2VDb3VudCA9IHRoaXMucHJlZmFiSW5kaWNlc1tpXS5sZW5ndGggLyAzO1xuICAgICAgY29uc3QgdXZPYmplY3RzID0gW107XG5cbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgcHJlZmFiRmFjZUNvdW50OyBqKyspIHtcbiAgICAgICAgY29uc3QgZmFjZSA9IGdlb21ldHJ5LmZhY2VzW2pdO1xuICAgICAgICBjb25zdCB1diA9IGdlb21ldHJ5LmZhY2VWZXJ0ZXhVdnNbMF1bal07XG5cbiAgICAgICAgdXZPYmplY3RzW2ZhY2UuYV0gPSB1dlswXTtcbiAgICAgICAgdXZPYmplY3RzW2ZhY2UuYl0gPSB1dlsxXTtcbiAgICAgICAgdXZPYmplY3RzW2ZhY2UuY10gPSB1dlsyXTtcbiAgICAgIH1cblxuICAgICAgdXZzID0gW107XG5cbiAgICAgIGZvciAobGV0IGsgPSAwOyBrIDwgdXZPYmplY3RzLmxlbmd0aDsgaysrKSB7XG4gICAgICAgIHV2c1trICogMl0gPSB1dk9iamVjdHNba10ueDtcbiAgICAgICAgdXZzW2sgKiAyICsgMV0gPSB1dk9iamVjdHNba10ueTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdXZzO1xuICB9KTtcblxuICBmb3IgKGxldCBpID0gMCwgb2Zmc2V0ID0gMDsgaSA8IHRoaXMucHJlZmFiQ291bnQ7IGkrKykge1xuXG4gICAgY29uc3QgaW5kZXggPSBpICUgdGhpcy5wcmVmYWJHZW9tZXRyaWVzLmxlbmd0aDtcbiAgICBjb25zdCB2ZXJ0ZXhDb3VudCA9IHRoaXMucHJlZmFiVmVydGV4Q291bnRzW2luZGV4XTtcbiAgICBjb25zdCB1dnMgPSBwcmVmYWJVdnNbaW5kZXhdO1xuXG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCB2ZXJ0ZXhDb3VudDsgaisrKSB7XG4gICAgICB1dkJ1ZmZlcltvZmZzZXQrK10gPSB1dnNbaiAqIDJdO1xuICAgICAgdXZCdWZmZXJbb2Zmc2V0KytdID0gdXZzW2ogKiAyICsgMV07XG4gICAgfVxuICB9XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBCdWZmZXJBdHRyaWJ1dGUgb24gdGhpcyBnZW9tZXRyeSBpbnN0YW5jZS5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZSBOYW1lIG9mIHRoZSBhdHRyaWJ1dGUuXG4gKiBAcGFyYW0ge051bWJlcn0gaXRlbVNpemUgTnVtYmVyIG9mIGZsb2F0cyBwZXIgdmVydGV4ICh0eXBpY2FsbHkgMSwgMiwgMyBvciA0KS5cbiAqIEBwYXJhbSB7ZnVuY3Rpb249fSBmYWN0b3J5IEZ1bmN0aW9uIHRoYXQgd2lsbCBiZSBjYWxsZWQgZm9yIGVhY2ggcHJlZmFiIHVwb24gY3JlYXRpb24uIEFjY2VwdHMgMyBhcmd1bWVudHM6IGRhdGFbXSwgaW5kZXggYW5kIHByZWZhYkNvdW50LiBDYWxscyBzZXRQcmVmYWJEYXRhLlxuICpcbiAqIEByZXR1cm5zIHtCdWZmZXJBdHRyaWJ1dGV9XG4gKi9cbk11bHRpUHJlZmFiQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmNyZWF0ZUF0dHJpYnV0ZSA9IGZ1bmN0aW9uKG5hbWUsIGl0ZW1TaXplLCBmYWN0b3J5KSB7XG4gIGNvbnN0IGJ1ZmZlciA9IG5ldyBGbG9hdDMyQXJyYXkodGhpcy5yZXBlYXRDb3VudCAqIHRoaXMucmVwZWF0VmVydGV4Q291bnQgKiBpdGVtU2l6ZSk7XG4gIGNvbnN0IGF0dHJpYnV0ZSA9IG5ldyBCdWZmZXJBdHRyaWJ1dGUoYnVmZmVyLCBpdGVtU2l6ZSk7XG4gIFxuICB0aGlzLmFkZEF0dHJpYnV0ZShuYW1lLCBhdHRyaWJ1dGUpO1xuICBcbiAgaWYgKGZhY3RvcnkpIHtcbiAgICBjb25zdCBkYXRhID0gW107XG4gICAgXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnByZWZhYkNvdW50OyBpKyspIHtcbiAgICAgIGZhY3RvcnkoZGF0YSwgaSwgdGhpcy5wcmVmYWJDb3VudCk7XG4gICAgICB0aGlzLnNldFByZWZhYkRhdGEoYXR0cmlidXRlLCBpLCBkYXRhKTtcbiAgICB9XG4gIH1cbiAgXG4gIHJldHVybiBhdHRyaWJ1dGU7XG59O1xuXG4vKipcbiAqIFNldHMgZGF0YSBmb3IgYWxsIHZlcnRpY2VzIG9mIGEgcHJlZmFiIGF0IGEgZ2l2ZW4gaW5kZXguXG4gKiBVc3VhbGx5IGNhbGxlZCBpbiBhIGxvb3AuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd8QnVmZmVyQXR0cmlidXRlfSBhdHRyaWJ1dGUgVGhlIGF0dHJpYnV0ZSBvciBhdHRyaWJ1dGUgbmFtZSB3aGVyZSB0aGUgZGF0YSBpcyB0byBiZSBzdG9yZWQuXG4gKiBAcGFyYW0ge051bWJlcn0gcHJlZmFiSW5kZXggSW5kZXggb2YgdGhlIHByZWZhYiBpbiB0aGUgYnVmZmVyIGdlb21ldHJ5LlxuICogQHBhcmFtIHtBcnJheX0gZGF0YSBBcnJheSBvZiBkYXRhLiBMZW5ndGggc2hvdWxkIGJlIGVxdWFsIHRvIGl0ZW0gc2l6ZSBvZiB0aGUgYXR0cmlidXRlLlxuICovXG5NdWx0aVByZWZhYkJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5zZXRQcmVmYWJEYXRhID0gZnVuY3Rpb24oYXR0cmlidXRlLCBwcmVmYWJJbmRleCwgZGF0YSkge1xuICBhdHRyaWJ1dGUgPSAodHlwZW9mIGF0dHJpYnV0ZSA9PT0gJ3N0cmluZycpID8gdGhpcy5hdHRyaWJ1dGVzW2F0dHJpYnV0ZV0gOiBhdHRyaWJ1dGU7XG5cbiAgY29uc3QgcHJlZmFiR2VvbWV0cnlJbmRleCA9IHByZWZhYkluZGV4ICUgdGhpcy5wcmVmYWJHZW9tZXRyaWVzQ291bnQ7XG4gIGNvbnN0IHByZWZhYkdlb21ldHJ5VmVydGV4Q291bnQgPSB0aGlzLnByZWZhYlZlcnRleENvdW50c1twcmVmYWJHZW9tZXRyeUluZGV4XTtcbiAgY29uc3Qgd2hvbGUgPSAocHJlZmFiSW5kZXggLyB0aGlzLnByZWZhYkdlb21ldHJpZXNDb3VudCB8IDApICogdGhpcy5wcmVmYWJHZW9tZXRyaWVzQ291bnQ7XG4gIGNvbnN0IHdob2xlT2Zmc2V0ID0gd2hvbGUgKiB0aGlzLnJlcGVhdFZlcnRleENvdW50O1xuICBjb25zdCBwYXJ0ID0gcHJlZmFiSW5kZXggLSB3aG9sZTtcbiAgbGV0IHBhcnRPZmZzZXQgPSAwO1xuICBsZXQgaSA9IDA7XG5cbiAgd2hpbGUoaSA8IHBhcnQpIHtcbiAgICBwYXJ0T2Zmc2V0ICs9IHRoaXMucHJlZmFiVmVydGV4Q291bnRzW2krK107XG4gIH1cblxuICBsZXQgb2Zmc2V0ID0gKHdob2xlT2Zmc2V0ICsgcGFydE9mZnNldCkgKiBhdHRyaWJ1dGUuaXRlbVNpemU7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcmVmYWJHZW9tZXRyeVZlcnRleENvdW50OyBpKyspIHtcbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IGF0dHJpYnV0ZS5pdGVtU2l6ZTsgaisrKSB7XG4gICAgICBhdHRyaWJ1dGUuYXJyYXlbb2Zmc2V0KytdID0gZGF0YVtqXTtcbiAgICB9XG4gIH1cbn07XG5cbmV4cG9ydCB7IE11bHRpUHJlZmFiQnVmZmVyR2VvbWV0cnkgfTtcbiIsImltcG9ydCB7IEluc3RhbmNlZEJ1ZmZlckdlb21ldHJ5LCBJbnN0YW5jZWRCdWZmZXJBdHRyaWJ1dGUgfSBmcm9tICd0aHJlZSc7XG4vKipcbiAqIEEgd3JhcHBlciBhcm91bmQgVEhSRUUuSW5zdGFuY2VkQnVmZmVyR2VvbWV0cnksIHdoaWNoIGlzIG1vcmUgbWVtb3J5IGVmZmljaWVudCB0aGFuIFByZWZhYkJ1ZmZlckdlb21ldHJ5LCBidXQgcmVxdWlyZXMgdGhlIEFOR0xFX2luc3RhbmNlZF9hcnJheXMgZXh0ZW5zaW9uLlxuICpcbiAqIEBwYXJhbSB7QnVmZmVyR2VvbWV0cnl9IHByZWZhYiBUaGUgR2VvbWV0cnkgaW5zdGFuY2UgdG8gcmVwZWF0LlxuICogQHBhcmFtIHtOdW1iZXJ9IGNvdW50IFRoZSBudW1iZXIgb2YgdGltZXMgdG8gcmVwZWF0IHRoZSBnZW9tZXRyeS5cbiAqXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gSW5zdGFuY2VkUHJlZmFiQnVmZmVyR2VvbWV0cnkocHJlZmFiLCBjb3VudCkge1xuICBpZiAocHJlZmFiLmlzR2VvbWV0cnkgPT09IHRydWUpIHtcbiAgICBjb25zb2xlLmVycm9yKCdJbnN0YW5jZWRQcmVmYWJCdWZmZXJHZW9tZXRyeSBwcmVmYWIgbXVzdCBiZSBhIEJ1ZmZlckdlb21ldHJ5LicpXG4gIH1cblxuICBJbnN0YW5jZWRCdWZmZXJHZW9tZXRyeS5jYWxsKHRoaXMpO1xuXG4gIHRoaXMucHJlZmFiR2VvbWV0cnkgPSBwcmVmYWI7XG4gIHRoaXMuY29weShwcmVmYWIpXG5cbiAgdGhpcy5tYXhJbnN0YW5jZWRDb3VudCA9IGNvdW50XG4gIHRoaXMucHJlZmFiQ291bnQgPSBjb3VudDtcbn1cbkluc3RhbmNlZFByZWZhYkJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoSW5zdGFuY2VkQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlKTtcbkluc3RhbmNlZFByZWZhYkJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IEluc3RhbmNlZFByZWZhYkJ1ZmZlckdlb21ldHJ5O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBCdWZmZXJBdHRyaWJ1dGUgb24gdGhpcyBnZW9tZXRyeSBpbnN0YW5jZS5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZSBOYW1lIG9mIHRoZSBhdHRyaWJ1dGUuXG4gKiBAcGFyYW0ge051bWJlcn0gaXRlbVNpemUgTnVtYmVyIG9mIGZsb2F0cyBwZXIgdmVydGV4ICh0eXBpY2FsbHkgMSwgMiwgMyBvciA0KS5cbiAqIEBwYXJhbSB7ZnVuY3Rpb249fSBmYWN0b3J5IEZ1bmN0aW9uIHRoYXQgd2lsbCBiZSBjYWxsZWQgZm9yIGVhY2ggcHJlZmFiIHVwb24gY3JlYXRpb24uIEFjY2VwdHMgMyBhcmd1bWVudHM6IGRhdGFbXSwgaW5kZXggYW5kIHByZWZhYkNvdW50LiBDYWxscyBzZXRQcmVmYWJEYXRhLlxuICpcbiAqIEByZXR1cm5zIHtCdWZmZXJBdHRyaWJ1dGV9XG4gKi9cbkluc3RhbmNlZFByZWZhYkJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5jcmVhdGVBdHRyaWJ1dGUgPSBmdW5jdGlvbihuYW1lLCBpdGVtU2l6ZSwgZmFjdG9yeSkge1xuICBjb25zdCBidWZmZXIgPSBuZXcgRmxvYXQzMkFycmF5KHRoaXMucHJlZmFiQ291bnQgKiBpdGVtU2l6ZSk7XG4gIGNvbnN0IGF0dHJpYnV0ZSA9IG5ldyBJbnN0YW5jZWRCdWZmZXJBdHRyaWJ1dGUoYnVmZmVyLCBpdGVtU2l6ZSk7XG5cbiAgdGhpcy5hZGRBdHRyaWJ1dGUobmFtZSwgYXR0cmlidXRlKTtcblxuICBpZiAoZmFjdG9yeSkge1xuICAgIGNvbnN0IGRhdGEgPSBbXTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5wcmVmYWJDb3VudDsgaSsrKSB7XG4gICAgICBmYWN0b3J5KGRhdGEsIGksIHRoaXMucHJlZmFiQ291bnQpO1xuICAgICAgdGhpcy5zZXRQcmVmYWJEYXRhKGF0dHJpYnV0ZSwgaSwgZGF0YSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGF0dHJpYnV0ZTtcbn07XG5cbi8qKlxuICogU2V0cyBkYXRhIGZvciBhIHByZWZhYiBhdCBhIGdpdmVuIGluZGV4LlxuICogVXN1YWxseSBjYWxsZWQgaW4gYSBsb29wLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfEJ1ZmZlckF0dHJpYnV0ZX0gYXR0cmlidXRlIFRoZSBhdHRyaWJ1dGUgb3IgYXR0cmlidXRlIG5hbWUgd2hlcmUgdGhlIGRhdGEgaXMgdG8gYmUgc3RvcmVkLlxuICogQHBhcmFtIHtOdW1iZXJ9IHByZWZhYkluZGV4IEluZGV4IG9mIHRoZSBwcmVmYWIgaW4gdGhlIGJ1ZmZlciBnZW9tZXRyeS5cbiAqIEBwYXJhbSB7QXJyYXl9IGRhdGEgQXJyYXkgb2YgZGF0YS4gTGVuZ3RoIHNob3VsZCBiZSBlcXVhbCB0byBpdGVtIHNpemUgb2YgdGhlIGF0dHJpYnV0ZS5cbiAqL1xuSW5zdGFuY2VkUHJlZmFiQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLnNldFByZWZhYkRhdGEgPSBmdW5jdGlvbihhdHRyaWJ1dGUsIHByZWZhYkluZGV4LCBkYXRhKSB7XG4gIGF0dHJpYnV0ZSA9ICh0eXBlb2YgYXR0cmlidXRlID09PSAnc3RyaW5nJykgPyB0aGlzLmF0dHJpYnV0ZXNbYXR0cmlidXRlXSA6IGF0dHJpYnV0ZTtcblxuICBsZXQgb2Zmc2V0ID0gcHJlZmFiSW5kZXggKiBhdHRyaWJ1dGUuaXRlbVNpemU7XG5cbiAgZm9yIChsZXQgaiA9IDA7IGogPCBhdHRyaWJ1dGUuaXRlbVNpemU7IGorKykge1xuICAgIGF0dHJpYnV0ZS5hcnJheVtvZmZzZXQrK10gPSBkYXRhW2pdO1xuICB9XG59O1xuXG5leHBvcnQgeyBJbnN0YW5jZWRQcmVmYWJCdWZmZXJHZW9tZXRyeSB9O1xuIiwiaW1wb3J0IHsgTWF0aCBhcyB0TWF0aCwgVmVjdG9yMyB9IGZyb20gJ3RocmVlJztcbmltcG9ydCB7IERlcHRoQW5pbWF0aW9uTWF0ZXJpYWwgfSBmcm9tICcuL21hdGVyaWFscy9EZXB0aEFuaW1hdGlvbk1hdGVyaWFsJztcbmltcG9ydCB7IERpc3RhbmNlQW5pbWF0aW9uTWF0ZXJpYWwgfSBmcm9tICcuL21hdGVyaWFscy9EaXN0YW5jZUFuaW1hdGlvbk1hdGVyaWFsJztcblxuLyoqXG4gKiBDb2xsZWN0aW9uIG9mIHV0aWxpdHkgZnVuY3Rpb25zLlxuICogQG5hbWVzcGFjZVxuICovXG5jb25zdCBVdGlscyA9IHtcbiAgLyoqXG4gICAqIER1cGxpY2F0ZXMgdmVydGljZXMgc28gZWFjaCBmYWNlIGJlY29tZXMgc2VwYXJhdGUuXG4gICAqIFNhbWUgYXMgVEhSRUUuRXhwbG9kZU1vZGlmaWVyLlxuICAgKlxuICAgKiBAcGFyYW0ge1RIUkVFLkdlb21ldHJ5fSBnZW9tZXRyeSBHZW9tZXRyeSBpbnN0YW5jZSB0byBtb2RpZnkuXG4gICAqL1xuICBzZXBhcmF0ZUZhY2VzOiBmdW5jdGlvbiAoZ2VvbWV0cnkpIHtcbiAgICBsZXQgdmVydGljZXMgPSBbXTtcblxuICAgIGZvciAobGV0IGkgPSAwLCBpbCA9IGdlb21ldHJ5LmZhY2VzLmxlbmd0aDsgaSA8IGlsOyBpKyspIHtcbiAgICAgIGxldCBuID0gdmVydGljZXMubGVuZ3RoO1xuICAgICAgbGV0IGZhY2UgPSBnZW9tZXRyeS5mYWNlc1tpXTtcblxuICAgICAgbGV0IGEgPSBmYWNlLmE7XG4gICAgICBsZXQgYiA9IGZhY2UuYjtcbiAgICAgIGxldCBjID0gZmFjZS5jO1xuXG4gICAgICBsZXQgdmEgPSBnZW9tZXRyeS52ZXJ0aWNlc1thXTtcbiAgICAgIGxldCB2YiA9IGdlb21ldHJ5LnZlcnRpY2VzW2JdO1xuICAgICAgbGV0IHZjID0gZ2VvbWV0cnkudmVydGljZXNbY107XG5cbiAgICAgIHZlcnRpY2VzLnB1c2godmEuY2xvbmUoKSk7XG4gICAgICB2ZXJ0aWNlcy5wdXNoKHZiLmNsb25lKCkpO1xuICAgICAgdmVydGljZXMucHVzaCh2Yy5jbG9uZSgpKTtcblxuICAgICAgZmFjZS5hID0gbjtcbiAgICAgIGZhY2UuYiA9IG4gKyAxO1xuICAgICAgZmFjZS5jID0gbiArIDI7XG4gICAgfVxuXG4gICAgZ2VvbWV0cnkudmVydGljZXMgPSB2ZXJ0aWNlcztcbiAgfSxcblxuICAvKipcbiAgICogQ29tcHV0ZSB0aGUgY2VudHJvaWQgKGNlbnRlcikgb2YgYSBUSFJFRS5GYWNlMy5cbiAgICpcbiAgICogQHBhcmFtIHtUSFJFRS5HZW9tZXRyeX0gZ2VvbWV0cnkgR2VvbWV0cnkgaW5zdGFuY2UgdGhlIGZhY2UgaXMgaW4uXG4gICAqIEBwYXJhbSB7VEhSRUUuRmFjZTN9IGZhY2UgRmFjZSBvYmplY3QgZnJvbSB0aGUgVEhSRUUuR2VvbWV0cnkuZmFjZXMgYXJyYXlcbiAgICogQHBhcmFtIHtUSFJFRS5WZWN0b3IzPX0gdiBPcHRpb25hbCB2ZWN0b3IgdG8gc3RvcmUgcmVzdWx0IGluLlxuICAgKiBAcmV0dXJucyB7VEhSRUUuVmVjdG9yM31cbiAgICovXG4gIGNvbXB1dGVDZW50cm9pZDogZnVuY3Rpb24oZ2VvbWV0cnksIGZhY2UsIHYpIHtcbiAgICBsZXQgYSA9IGdlb21ldHJ5LnZlcnRpY2VzW2ZhY2UuYV07XG4gICAgbGV0IGIgPSBnZW9tZXRyeS52ZXJ0aWNlc1tmYWNlLmJdO1xuICAgIGxldCBjID0gZ2VvbWV0cnkudmVydGljZXNbZmFjZS5jXTtcblxuICAgIHYgPSB2IHx8IG5ldyBWZWN0b3IzKCk7XG5cbiAgICB2LnggPSAoYS54ICsgYi54ICsgYy54KSAvIDM7XG4gICAgdi55ID0gKGEueSArIGIueSArIGMueSkgLyAzO1xuICAgIHYueiA9IChhLnogKyBiLnogKyBjLnopIC8gMztcblxuICAgIHJldHVybiB2O1xuICB9LFxuXG4gIC8qKlxuICAgKiBHZXQgYSByYW5kb20gdmVjdG9yIGJldHdlZW4gYm94Lm1pbiBhbmQgYm94Lm1heC5cbiAgICpcbiAgICogQHBhcmFtIHtUSFJFRS5Cb3gzfSBib3ggVEhSRUUuQm94MyBpbnN0YW5jZS5cbiAgICogQHBhcmFtIHtUSFJFRS5WZWN0b3IzPX0gdiBPcHRpb25hbCB2ZWN0b3IgdG8gc3RvcmUgcmVzdWx0IGluLlxuICAgKiBAcmV0dXJucyB7VEhSRUUuVmVjdG9yM31cbiAgICovXG4gIHJhbmRvbUluQm94OiBmdW5jdGlvbihib3gsIHYpIHtcbiAgICB2ID0gdiB8fCBuZXcgVmVjdG9yMygpO1xuXG4gICAgdi54ID0gdE1hdGgucmFuZEZsb2F0KGJveC5taW4ueCwgYm94Lm1heC54KTtcbiAgICB2LnkgPSB0TWF0aC5yYW5kRmxvYXQoYm94Lm1pbi55LCBib3gubWF4LnkpO1xuICAgIHYueiA9IHRNYXRoLnJhbmRGbG9hdChib3gubWluLnosIGJveC5tYXgueik7XG5cbiAgICByZXR1cm4gdjtcbiAgfSxcblxuICAvKipcbiAgICogR2V0IGEgcmFuZG9tIGF4aXMgZm9yIHF1YXRlcm5pb24gcm90YXRpb24uXG4gICAqXG4gICAqIEBwYXJhbSB7VEhSRUUuVmVjdG9yMz19IHYgT3B0aW9uIHZlY3RvciB0byBzdG9yZSByZXN1bHQgaW4uXG4gICAqIEByZXR1cm5zIHtUSFJFRS5WZWN0b3IzfVxuICAgKi9cbiAgcmFuZG9tQXhpczogZnVuY3Rpb24odikge1xuICAgIHYgPSB2IHx8IG5ldyBWZWN0b3IzKCk7XG5cbiAgICB2LnggPSB0TWF0aC5yYW5kRmxvYXRTcHJlYWQoMi4wKTtcbiAgICB2LnkgPSB0TWF0aC5yYW5kRmxvYXRTcHJlYWQoMi4wKTtcbiAgICB2LnogPSB0TWF0aC5yYW5kRmxvYXRTcHJlYWQoMi4wKTtcbiAgICB2Lm5vcm1hbGl6ZSgpO1xuXG4gICAgcmV0dXJuIHY7XG4gIH0sXG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIFRIUkVFLkJBUy5EZXB0aEFuaW1hdGlvbk1hdGVyaWFsIGZvciBzaGFkb3dzIGZyb20gYSBUSFJFRS5TcG90TGlnaHQgb3IgVEhSRUUuRGlyZWN0aW9uYWxMaWdodCBieSBjb3B5aW5nIHJlbGV2YW50IHNoYWRlciBjaHVua3MuXG4gICAqIFVuaWZvcm0gdmFsdWVzIG11c3QgYmUgbWFudWFsbHkgc3luY2VkIGJldHdlZW4gdGhlIHNvdXJjZSBtYXRlcmlhbCBhbmQgdGhlIGRlcHRoIG1hdGVyaWFsLlxuICAgKlxuICAgKiBAc2VlIHtAbGluayBodHRwOi8vdGhyZWUtYmFzLWV4YW1wbGVzLnN1cmdlLnNoL2V4YW1wbGVzL3NoYWRvd3MvfVxuICAgKlxuICAgKiBAcGFyYW0ge1RIUkVFLkJBUy5CYXNlQW5pbWF0aW9uTWF0ZXJpYWx9IHNvdXJjZU1hdGVyaWFsIEluc3RhbmNlIHRvIGdldCB0aGUgc2hhZGVyIGNodW5rcyBmcm9tLlxuICAgKiBAcmV0dXJucyB7VEhSRUUuQkFTLkRlcHRoQW5pbWF0aW9uTWF0ZXJpYWx9XG4gICAqL1xuICBjcmVhdGVEZXB0aEFuaW1hdGlvbk1hdGVyaWFsOiBmdW5jdGlvbihzb3VyY2VNYXRlcmlhbCkge1xuICAgIHJldHVybiBuZXcgRGVwdGhBbmltYXRpb25NYXRlcmlhbCh7XG4gICAgICB1bmlmb3Jtczogc291cmNlTWF0ZXJpYWwudW5pZm9ybXMsXG4gICAgICBkZWZpbmVzOiBzb3VyY2VNYXRlcmlhbC5kZWZpbmVzLFxuICAgICAgdmVydGV4RnVuY3Rpb25zOiBzb3VyY2VNYXRlcmlhbC52ZXJ0ZXhGdW5jdGlvbnMsXG4gICAgICB2ZXJ0ZXhQYXJhbWV0ZXJzOiBzb3VyY2VNYXRlcmlhbC52ZXJ0ZXhQYXJhbWV0ZXJzLFxuICAgICAgdmVydGV4SW5pdDogc291cmNlTWF0ZXJpYWwudmVydGV4SW5pdCxcbiAgICAgIHZlcnRleFBvc2l0aW9uOiBzb3VyY2VNYXRlcmlhbC52ZXJ0ZXhQb3NpdGlvblxuICAgIH0pO1xuICB9LFxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBUSFJFRS5CQVMuRGlzdGFuY2VBbmltYXRpb25NYXRlcmlhbCBmb3Igc2hhZG93cyBmcm9tIGEgVEhSRUUuUG9pbnRMaWdodCBieSBjb3B5aW5nIHJlbGV2YW50IHNoYWRlciBjaHVua3MuXG4gICAqIFVuaWZvcm0gdmFsdWVzIG11c3QgYmUgbWFudWFsbHkgc3luY2VkIGJldHdlZW4gdGhlIHNvdXJjZSBtYXRlcmlhbCBhbmQgdGhlIGRpc3RhbmNlIG1hdGVyaWFsLlxuICAgKlxuICAgKiBAc2VlIHtAbGluayBodHRwOi8vdGhyZWUtYmFzLWV4YW1wbGVzLnN1cmdlLnNoL2V4YW1wbGVzL3NoYWRvd3MvfVxuICAgKlxuICAgKiBAcGFyYW0ge1RIUkVFLkJBUy5CYXNlQW5pbWF0aW9uTWF0ZXJpYWx9IHNvdXJjZU1hdGVyaWFsIEluc3RhbmNlIHRvIGdldCB0aGUgc2hhZGVyIGNodW5rcyBmcm9tLlxuICAgKiBAcmV0dXJucyB7VEhSRUUuQkFTLkRpc3RhbmNlQW5pbWF0aW9uTWF0ZXJpYWx9XG4gICAqL1xuICBjcmVhdGVEaXN0YW5jZUFuaW1hdGlvbk1hdGVyaWFsOiBmdW5jdGlvbihzb3VyY2VNYXRlcmlhbCkge1xuICAgIHJldHVybiBuZXcgRGlzdGFuY2VBbmltYXRpb25NYXRlcmlhbCh7XG4gICAgICB1bmlmb3Jtczogc291cmNlTWF0ZXJpYWwudW5pZm9ybXMsXG4gICAgICBkZWZpbmVzOiBzb3VyY2VNYXRlcmlhbC5kZWZpbmVzLFxuICAgICAgdmVydGV4RnVuY3Rpb25zOiBzb3VyY2VNYXRlcmlhbC52ZXJ0ZXhGdW5jdGlvbnMsXG4gICAgICB2ZXJ0ZXhQYXJhbWV0ZXJzOiBzb3VyY2VNYXRlcmlhbC52ZXJ0ZXhQYXJhbWV0ZXJzLFxuICAgICAgdmVydGV4SW5pdDogc291cmNlTWF0ZXJpYWwudmVydGV4SW5pdCxcbiAgICAgIHZlcnRleFBvc2l0aW9uOiBzb3VyY2VNYXRlcmlhbC52ZXJ0ZXhQb3NpdGlvblxuICAgIH0pO1xuICB9XG59O1xuXG5leHBvcnQgeyBVdGlscyB9O1xuIiwiaW1wb3J0IHsgQnVmZmVyR2VvbWV0cnksIEJ1ZmZlckF0dHJpYnV0ZSB9IGZyb20gJ3RocmVlJztcbmltcG9ydCB7IFV0aWxzIH0gZnJvbSAnLi4vVXRpbHMnO1xuXG4vKipcbiAqIEEgVEhSRUUuQnVmZmVyR2VvbWV0cnkgZm9yIGFuaW1hdGluZyBpbmRpdmlkdWFsIGZhY2VzIG9mIGEgVEhSRUUuR2VvbWV0cnkuXG4gKlxuICogQHBhcmFtIHtUSFJFRS5HZW9tZXRyeX0gbW9kZWwgVGhlIFRIUkVFLkdlb21ldHJ5IHRvIGJhc2UgdGhpcyBnZW9tZXRyeSBvbi5cbiAqIEBwYXJhbSB7T2JqZWN0PX0gb3B0aW9uc1xuICogQHBhcmFtIHtCb29sZWFuPX0gb3B0aW9ucy5jb21wdXRlQ2VudHJvaWRzIElmIHRydWUsIGEgY2VudHJvaWRzIHdpbGwgYmUgY29tcHV0ZWQgZm9yIGVhY2ggZmFjZSBhbmQgc3RvcmVkIGluIFRIUkVFLkJBUy5Nb2RlbEJ1ZmZlckdlb21ldHJ5LmNlbnRyb2lkcy5cbiAqIEBwYXJhbSB7Qm9vbGVhbj19IG9wdGlvbnMubG9jYWxpemVGYWNlcyBJZiB0cnVlLCB0aGUgcG9zaXRpb25zIGZvciBlYWNoIGZhY2Ugd2lsbCBiZSBzdG9yZWQgcmVsYXRpdmUgdG8gdGhlIGNlbnRyb2lkLiBUaGlzIGlzIHVzZWZ1bCBpZiB5b3Ugd2FudCB0byByb3RhdGUgb3Igc2NhbGUgZmFjZXMgYXJvdW5kIHRoZWlyIGNlbnRlci5cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBNb2RlbEJ1ZmZlckdlb21ldHJ5KG1vZGVsLCBvcHRpb25zKSB7XG4gIEJ1ZmZlckdlb21ldHJ5LmNhbGwodGhpcyk7XG5cbiAgLyoqXG4gICAqIEEgcmVmZXJlbmNlIHRvIHRoZSBnZW9tZXRyeSB1c2VkIHRvIGNyZWF0ZSB0aGlzIGluc3RhbmNlLlxuICAgKiBAdHlwZSB7VEhSRUUuR2VvbWV0cnl9XG4gICAqL1xuICB0aGlzLm1vZGVsR2VvbWV0cnkgPSBtb2RlbDtcblxuICAvKipcbiAgICogTnVtYmVyIG9mIGZhY2VzIG9mIHRoZSBtb2RlbC5cbiAgICogQHR5cGUge051bWJlcn1cbiAgICovXG4gIHRoaXMuZmFjZUNvdW50ID0gdGhpcy5tb2RlbEdlb21ldHJ5LmZhY2VzLmxlbmd0aDtcblxuICAvKipcbiAgICogTnVtYmVyIG9mIHZlcnRpY2VzIG9mIHRoZSBtb2RlbC5cbiAgICogQHR5cGUge051bWJlcn1cbiAgICovXG4gIHRoaXMudmVydGV4Q291bnQgPSB0aGlzLm1vZGVsR2VvbWV0cnkudmVydGljZXMubGVuZ3RoO1xuXG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICBvcHRpb25zLmNvbXB1dGVDZW50cm9pZHMgJiYgdGhpcy5jb21wdXRlQ2VudHJvaWRzKCk7XG5cbiAgdGhpcy5idWZmZXJJbmRpY2VzKCk7XG4gIHRoaXMuYnVmZmVyUG9zaXRpb25zKG9wdGlvbnMubG9jYWxpemVGYWNlcyk7XG59XG5Nb2RlbEJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlKTtcbk1vZGVsQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gTW9kZWxCdWZmZXJHZW9tZXRyeTtcblxuLyoqXG4gKiBDb21wdXRlcyBhIGNlbnRyb2lkIGZvciBlYWNoIGZhY2UgYW5kIHN0b3JlcyBpdCBpbiBUSFJFRS5CQVMuTW9kZWxCdWZmZXJHZW9tZXRyeS5jZW50cm9pZHMuXG4gKi9cbk1vZGVsQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmNvbXB1dGVDZW50cm9pZHMgPSBmdW5jdGlvbigpIHtcbiAgLyoqXG4gICAqIEFuIGFycmF5IG9mIGNlbnRyb2lkcyBjb3JyZXNwb25kaW5nIHRvIHRoZSBmYWNlcyBvZiB0aGUgbW9kZWwuXG4gICAqXG4gICAqIEB0eXBlIHtBcnJheX1cbiAgICovXG4gIHRoaXMuY2VudHJvaWRzID0gW107XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmZhY2VDb3VudDsgaSsrKSB7XG4gICAgdGhpcy5jZW50cm9pZHNbaV0gPSBVdGlscy5jb21wdXRlQ2VudHJvaWQodGhpcy5tb2RlbEdlb21ldHJ5LCB0aGlzLm1vZGVsR2VvbWV0cnkuZmFjZXNbaV0pO1xuICB9XG59O1xuXG5Nb2RlbEJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5idWZmZXJJbmRpY2VzID0gZnVuY3Rpb24oKSB7XG4gIGNvbnN0IGluZGV4QnVmZmVyID0gbmV3IFVpbnQzMkFycmF5KHRoaXMuZmFjZUNvdW50ICogMyk7XG5cbiAgdGhpcy5zZXRJbmRleChuZXcgQnVmZmVyQXR0cmlidXRlKGluZGV4QnVmZmVyLCAxKSk7XG5cbiAgZm9yIChsZXQgaSA9IDAsIG9mZnNldCA9IDA7IGkgPCB0aGlzLmZhY2VDb3VudDsgaSsrLCBvZmZzZXQgKz0gMykge1xuICAgIGNvbnN0IGZhY2UgPSB0aGlzLm1vZGVsR2VvbWV0cnkuZmFjZXNbaV07XG5cbiAgICBpbmRleEJ1ZmZlcltvZmZzZXQgICAgXSA9IGZhY2UuYTtcbiAgICBpbmRleEJ1ZmZlcltvZmZzZXQgKyAxXSA9IGZhY2UuYjtcbiAgICBpbmRleEJ1ZmZlcltvZmZzZXQgKyAyXSA9IGZhY2UuYztcbiAgfVxufTtcblxuTW9kZWxCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuYnVmZmVyUG9zaXRpb25zID0gZnVuY3Rpb24obG9jYWxpemVGYWNlcykge1xuICBjb25zdCBwb3NpdGlvbkJ1ZmZlciA9IHRoaXMuY3JlYXRlQXR0cmlidXRlKCdwb3NpdGlvbicsIDMpLmFycmF5O1xuICBsZXQgaSwgb2Zmc2V0O1xuXG4gIGlmIChsb2NhbGl6ZUZhY2VzID09PSB0cnVlKSB7XG4gICAgZm9yIChpID0gMDsgaSA8IHRoaXMuZmFjZUNvdW50OyBpKyspIHtcbiAgICAgIGNvbnN0IGZhY2UgPSB0aGlzLm1vZGVsR2VvbWV0cnkuZmFjZXNbaV07XG4gICAgICBjb25zdCBjZW50cm9pZCA9IHRoaXMuY2VudHJvaWRzID8gdGhpcy5jZW50cm9pZHNbaV0gOiBVdGlscy5jb21wdXRlQ2VudHJvaWQodGhpcy5tb2RlbEdlb21ldHJ5LCBmYWNlKTtcblxuICAgICAgY29uc3QgYSA9IHRoaXMubW9kZWxHZW9tZXRyeS52ZXJ0aWNlc1tmYWNlLmFdO1xuICAgICAgY29uc3QgYiA9IHRoaXMubW9kZWxHZW9tZXRyeS52ZXJ0aWNlc1tmYWNlLmJdO1xuICAgICAgY29uc3QgYyA9IHRoaXMubW9kZWxHZW9tZXRyeS52ZXJ0aWNlc1tmYWNlLmNdO1xuXG4gICAgICBwb3NpdGlvbkJ1ZmZlcltmYWNlLmEgKiAzXSAgICAgPSBhLnggLSBjZW50cm9pZC54O1xuICAgICAgcG9zaXRpb25CdWZmZXJbZmFjZS5hICogMyArIDFdID0gYS55IC0gY2VudHJvaWQueTtcbiAgICAgIHBvc2l0aW9uQnVmZmVyW2ZhY2UuYSAqIDMgKyAyXSA9IGEueiAtIGNlbnRyb2lkLno7XG5cbiAgICAgIHBvc2l0aW9uQnVmZmVyW2ZhY2UuYiAqIDNdICAgICA9IGIueCAtIGNlbnRyb2lkLng7XG4gICAgICBwb3NpdGlvbkJ1ZmZlcltmYWNlLmIgKiAzICsgMV0gPSBiLnkgLSBjZW50cm9pZC55O1xuICAgICAgcG9zaXRpb25CdWZmZXJbZmFjZS5iICogMyArIDJdID0gYi56IC0gY2VudHJvaWQuejtcblxuICAgICAgcG9zaXRpb25CdWZmZXJbZmFjZS5jICogM10gICAgID0gYy54IC0gY2VudHJvaWQueDtcbiAgICAgIHBvc2l0aW9uQnVmZmVyW2ZhY2UuYyAqIDMgKyAxXSA9IGMueSAtIGNlbnRyb2lkLnk7XG4gICAgICBwb3NpdGlvbkJ1ZmZlcltmYWNlLmMgKiAzICsgMl0gPSBjLnogLSBjZW50cm9pZC56O1xuICAgIH1cbiAgfVxuICBlbHNlIHtcbiAgICBmb3IgKGkgPSAwLCBvZmZzZXQgPSAwOyBpIDwgdGhpcy52ZXJ0ZXhDb3VudDsgaSsrLCBvZmZzZXQgKz0gMykge1xuICAgICAgY29uc3QgdmVydGV4ID0gdGhpcy5tb2RlbEdlb21ldHJ5LnZlcnRpY2VzW2ldO1xuXG4gICAgICBwb3NpdGlvbkJ1ZmZlcltvZmZzZXQgICAgXSA9IHZlcnRleC54O1xuICAgICAgcG9zaXRpb25CdWZmZXJbb2Zmc2V0ICsgMV0gPSB2ZXJ0ZXgueTtcbiAgICAgIHBvc2l0aW9uQnVmZmVyW29mZnNldCArIDJdID0gdmVydGV4Lno7XG4gICAgfVxuICB9XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBUSFJFRS5CdWZmZXJBdHRyaWJ1dGUgd2l0aCBVViBjb29yZGluYXRlcy5cbiAqL1xuTW9kZWxCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuYnVmZmVyVXZzID0gZnVuY3Rpb24oKSB7XG4gIGNvbnN0IHV2QnVmZmVyID0gdGhpcy5jcmVhdGVBdHRyaWJ1dGUoJ3V2JywgMikuYXJyYXk7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmZhY2VDb3VudDsgaSsrKSB7XG5cbiAgICBjb25zdCBmYWNlID0gdGhpcy5tb2RlbEdlb21ldHJ5LmZhY2VzW2ldO1xuICAgIGxldCB1djtcblxuICAgIHV2ID0gdGhpcy5tb2RlbEdlb21ldHJ5LmZhY2VWZXJ0ZXhVdnNbMF1baV1bMF07XG4gICAgdXZCdWZmZXJbZmFjZS5hICogMl0gICAgID0gdXYueDtcbiAgICB1dkJ1ZmZlcltmYWNlLmEgKiAyICsgMV0gPSB1di55O1xuXG4gICAgdXYgPSB0aGlzLm1vZGVsR2VvbWV0cnkuZmFjZVZlcnRleFV2c1swXVtpXVsxXTtcbiAgICB1dkJ1ZmZlcltmYWNlLmIgKiAyXSAgICAgPSB1di54O1xuICAgIHV2QnVmZmVyW2ZhY2UuYiAqIDIgKyAxXSA9IHV2Lnk7XG5cbiAgICB1diA9IHRoaXMubW9kZWxHZW9tZXRyeS5mYWNlVmVydGV4VXZzWzBdW2ldWzJdO1xuICAgIHV2QnVmZmVyW2ZhY2UuYyAqIDJdICAgICA9IHV2Lng7XG4gICAgdXZCdWZmZXJbZmFjZS5jICogMiArIDFdID0gdXYueTtcbiAgfVxufTtcblxuLyoqXG4gKiBDcmVhdGVzIHR3byBUSFJFRS5CdWZmZXJBdHRyaWJ1dGVzOiBza2luSW5kZXggYW5kIHNraW5XZWlnaHQuIEJvdGggYXJlIHJlcXVpcmVkIGZvciBza2lubmluZy5cbiAqL1xuTW9kZWxCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuYnVmZmVyU2tpbm5pbmcgPSBmdW5jdGlvbigpIHtcbiAgY29uc3Qgc2tpbkluZGV4QnVmZmVyID0gdGhpcy5jcmVhdGVBdHRyaWJ1dGUoJ3NraW5JbmRleCcsIDQpLmFycmF5O1xuICBjb25zdCBza2luV2VpZ2h0QnVmZmVyID0gdGhpcy5jcmVhdGVBdHRyaWJ1dGUoJ3NraW5XZWlnaHQnLCA0KS5hcnJheTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMudmVydGV4Q291bnQ7IGkrKykge1xuICAgIGNvbnN0IHNraW5JbmRleCA9IHRoaXMubW9kZWxHZW9tZXRyeS5za2luSW5kaWNlc1tpXTtcbiAgICBjb25zdCBza2luV2VpZ2h0ID0gdGhpcy5tb2RlbEdlb21ldHJ5LnNraW5XZWlnaHRzW2ldO1xuXG4gICAgc2tpbkluZGV4QnVmZmVyW2kgKiA0ICAgIF0gPSBza2luSW5kZXgueDtcbiAgICBza2luSW5kZXhCdWZmZXJbaSAqIDQgKyAxXSA9IHNraW5JbmRleC55O1xuICAgIHNraW5JbmRleEJ1ZmZlcltpICogNCArIDJdID0gc2tpbkluZGV4Lno7XG4gICAgc2tpbkluZGV4QnVmZmVyW2kgKiA0ICsgM10gPSBza2luSW5kZXgudztcblxuICAgIHNraW5XZWlnaHRCdWZmZXJbaSAqIDQgICAgXSA9IHNraW5XZWlnaHQueDtcbiAgICBza2luV2VpZ2h0QnVmZmVyW2kgKiA0ICsgMV0gPSBza2luV2VpZ2h0Lnk7XG4gICAgc2tpbldlaWdodEJ1ZmZlcltpICogNCArIDJdID0gc2tpbldlaWdodC56O1xuICAgIHNraW5XZWlnaHRCdWZmZXJbaSAqIDQgKyAzXSA9IHNraW5XZWlnaHQudztcbiAgfVxufTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgVEhSRUUuQnVmZmVyQXR0cmlidXRlIG9uIHRoaXMgZ2VvbWV0cnkgaW5zdGFuY2UuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgTmFtZSBvZiB0aGUgYXR0cmlidXRlLlxuICogQHBhcmFtIHtpbnR9IGl0ZW1TaXplIE51bWJlciBvZiBmbG9hdHMgcGVyIHZlcnRleCAodHlwaWNhbGx5IDEsIDIsIDMgb3IgNCkuXG4gKiBAcGFyYW0ge2Z1bmN0aW9uPX0gZmFjdG9yeSBGdW5jdGlvbiB0aGF0IHdpbGwgYmUgY2FsbGVkIGZvciBlYWNoIGZhY2UgdXBvbiBjcmVhdGlvbi4gQWNjZXB0cyAzIGFyZ3VtZW50czogZGF0YVtdLCBpbmRleCBhbmQgZmFjZUNvdW50LiBDYWxscyBzZXRGYWNlRGF0YS5cbiAqXG4gKiBAcmV0dXJucyB7QnVmZmVyQXR0cmlidXRlfVxuICovXG5Nb2RlbEJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5jcmVhdGVBdHRyaWJ1dGUgPSBmdW5jdGlvbihuYW1lLCBpdGVtU2l6ZSwgZmFjdG9yeSkge1xuICBjb25zdCBidWZmZXIgPSBuZXcgRmxvYXQzMkFycmF5KHRoaXMudmVydGV4Q291bnQgKiBpdGVtU2l6ZSk7XG4gIGNvbnN0IGF0dHJpYnV0ZSA9IG5ldyBCdWZmZXJBdHRyaWJ1dGUoYnVmZmVyLCBpdGVtU2l6ZSk7XG5cbiAgdGhpcy5hZGRBdHRyaWJ1dGUobmFtZSwgYXR0cmlidXRlKTtcblxuICBpZiAoZmFjdG9yeSkge1xuICAgIGNvbnN0IGRhdGEgPSBbXTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5mYWNlQ291bnQ7IGkrKykge1xuICAgICAgZmFjdG9yeShkYXRhLCBpLCB0aGlzLmZhY2VDb3VudCk7XG4gICAgICB0aGlzLnNldEZhY2VEYXRhKGF0dHJpYnV0ZSwgaSwgZGF0YSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGF0dHJpYnV0ZTtcbn07XG5cbi8qKlxuICogU2V0cyBkYXRhIGZvciBhbGwgdmVydGljZXMgb2YgYSBmYWNlIGF0IGEgZ2l2ZW4gaW5kZXguXG4gKiBVc3VhbGx5IGNhbGxlZCBpbiBhIGxvb3AuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd8VEhSRUUuQnVmZmVyQXR0cmlidXRlfSBhdHRyaWJ1dGUgVGhlIGF0dHJpYnV0ZSBvciBhdHRyaWJ1dGUgbmFtZSB3aGVyZSB0aGUgZGF0YSBpcyB0byBiZSBzdG9yZWQuXG4gKiBAcGFyYW0ge2ludH0gZmFjZUluZGV4IEluZGV4IG9mIHRoZSBmYWNlIGluIHRoZSBidWZmZXIgZ2VvbWV0cnkuXG4gKiBAcGFyYW0ge0FycmF5fSBkYXRhIEFycmF5IG9mIGRhdGEuIExlbmd0aCBzaG91bGQgYmUgZXF1YWwgdG8gaXRlbSBzaXplIG9mIHRoZSBhdHRyaWJ1dGUuXG4gKi9cbk1vZGVsQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLnNldEZhY2VEYXRhID0gZnVuY3Rpb24oYXR0cmlidXRlLCBmYWNlSW5kZXgsIGRhdGEpIHtcbiAgYXR0cmlidXRlID0gKHR5cGVvZiBhdHRyaWJ1dGUgPT09ICdzdHJpbmcnKSA/IHRoaXMuYXR0cmlidXRlc1thdHRyaWJ1dGVdIDogYXR0cmlidXRlO1xuXG4gIGxldCBvZmZzZXQgPSBmYWNlSW5kZXggKiAzICogYXR0cmlidXRlLml0ZW1TaXplO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgMzsgaSsrKSB7XG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCBhdHRyaWJ1dGUuaXRlbVNpemU7IGorKykge1xuICAgICAgYXR0cmlidXRlLmFycmF5W29mZnNldCsrXSA9IGRhdGFbal07XG4gICAgfVxuICB9XG59O1xuXG5leHBvcnQgeyBNb2RlbEJ1ZmZlckdlb21ldHJ5IH07XG4iLCJpbXBvcnQgeyBCdWZmZXJHZW9tZXRyeSwgQnVmZmVyQXR0cmlidXRlIH0gZnJvbSAndGhyZWUnO1xuXG4vKipcbiAqIEEgVEhSRUUuQnVmZmVyR2VvbWV0cnkgY29uc2lzdHMgb2YgcG9pbnRzLlxuICogQHBhcmFtIHtOdW1iZXJ9IGNvdW50IFRoZSBudW1iZXIgb2YgcG9pbnRzLlxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIFBvaW50QnVmZmVyR2VvbWV0cnkoY291bnQpIHtcbiAgQnVmZmVyR2VvbWV0cnkuY2FsbCh0aGlzKTtcblxuICAvKipcbiAgICogTnVtYmVyIG9mIHBvaW50cy5cbiAgICogQHR5cGUge051bWJlcn1cbiAgICovXG4gIHRoaXMucG9pbnRDb3VudCA9IGNvdW50O1xuXG4gIHRoaXMuYnVmZmVyUG9zaXRpb25zKCk7XG59XG5Qb2ludEJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlKTtcblBvaW50QnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gUG9pbnRCdWZmZXJHZW9tZXRyeTtcblxuUG9pbnRCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuYnVmZmVyUG9zaXRpb25zID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuY3JlYXRlQXR0cmlidXRlKCdwb3NpdGlvbicsIDMpO1xufTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgVEhSRUUuQnVmZmVyQXR0cmlidXRlIG9uIHRoaXMgZ2VvbWV0cnkgaW5zdGFuY2UuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgTmFtZSBvZiB0aGUgYXR0cmlidXRlLlxuICogQHBhcmFtIHtOdW1iZXJ9IGl0ZW1TaXplIE51bWJlciBvZiBmbG9hdHMgcGVyIHZlcnRleCAodHlwaWNhbGx5IDEsIDIsIDMgb3IgNCkuXG4gKiBAcGFyYW0ge2Z1bmN0aW9uPX0gZmFjdG9yeSBGdW5jdGlvbiB0aGF0IHdpbGwgYmUgY2FsbGVkIGZvciBlYWNoIHBvaW50IHVwb24gY3JlYXRpb24uIEFjY2VwdHMgMyBhcmd1bWVudHM6IGRhdGFbXSwgaW5kZXggYW5kIHByZWZhYkNvdW50LiBDYWxscyBzZXRQb2ludERhdGEuXG4gKlxuICogQHJldHVybnMge1RIUkVFLkJ1ZmZlckF0dHJpYnV0ZX1cbiAqL1xuUG9pbnRCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuY3JlYXRlQXR0cmlidXRlID0gZnVuY3Rpb24obmFtZSwgaXRlbVNpemUsIGZhY3RvcnkpIHtcbiAgY29uc3QgYnVmZmVyID0gbmV3IEZsb2F0MzJBcnJheSh0aGlzLnBvaW50Q291bnQgKiBpdGVtU2l6ZSk7XG4gIGNvbnN0IGF0dHJpYnV0ZSA9IG5ldyBCdWZmZXJBdHRyaWJ1dGUoYnVmZmVyLCBpdGVtU2l6ZSk7XG5cbiAgdGhpcy5hZGRBdHRyaWJ1dGUobmFtZSwgYXR0cmlidXRlKTtcblxuICBpZiAoZmFjdG9yeSkge1xuICAgIGNvbnN0IGRhdGEgPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucG9pbnRDb3VudDsgaSsrKSB7XG4gICAgICBmYWN0b3J5KGRhdGEsIGksIHRoaXMucG9pbnRDb3VudCk7XG4gICAgICB0aGlzLnNldFBvaW50RGF0YShhdHRyaWJ1dGUsIGksIGRhdGEpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBhdHRyaWJ1dGU7XG59O1xuXG5Qb2ludEJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5zZXRQb2ludERhdGEgPSBmdW5jdGlvbihhdHRyaWJ1dGUsIHBvaW50SW5kZXgsIGRhdGEpIHtcbiAgYXR0cmlidXRlID0gKHR5cGVvZiBhdHRyaWJ1dGUgPT09ICdzdHJpbmcnKSA/IHRoaXMuYXR0cmlidXRlc1thdHRyaWJ1dGVdIDogYXR0cmlidXRlO1xuXG4gIGxldCBvZmZzZXQgPSBwb2ludEluZGV4ICogYXR0cmlidXRlLml0ZW1TaXplO1xuXG4gIGZvciAobGV0IGogPSAwOyBqIDwgYXR0cmlidXRlLml0ZW1TaXplOyBqKyspIHtcbiAgICBhdHRyaWJ1dGUuYXJyYXlbb2Zmc2V0KytdID0gZGF0YVtqXTtcbiAgfVxufTtcblxuZXhwb3J0IHsgUG9pbnRCdWZmZXJHZW9tZXRyeSB9O1xuIiwiLy8gZ2VuZXJhdGVkIGJ5IHNjcmlwdHMvYnVpbGRfc2hhZGVyX2NodW5rcy5qc1xuXG5pbXBvcnQgY2F0bXVsbF9yb21fc3BsaW5lIGZyb20gJy4vZ2xzbC9jYXRtdWxsX3JvbV9zcGxpbmUuZ2xzbCc7XG5pbXBvcnQgY3ViaWNfYmV6aWVyIGZyb20gJy4vZ2xzbC9jdWJpY19iZXppZXIuZ2xzbCc7XG5pbXBvcnQgZWFzZV9iYWNrX2luIGZyb20gJy4vZ2xzbC9lYXNlX2JhY2tfaW4uZ2xzbCc7XG5pbXBvcnQgZWFzZV9iYWNrX2luX291dCBmcm9tICcuL2dsc2wvZWFzZV9iYWNrX2luX291dC5nbHNsJztcbmltcG9ydCBlYXNlX2JhY2tfb3V0IGZyb20gJy4vZ2xzbC9lYXNlX2JhY2tfb3V0Lmdsc2wnO1xuaW1wb3J0IGVhc2VfYmV6aWVyIGZyb20gJy4vZ2xzbC9lYXNlX2Jlemllci5nbHNsJztcbmltcG9ydCBlYXNlX2JvdW5jZV9pbiBmcm9tICcuL2dsc2wvZWFzZV9ib3VuY2VfaW4uZ2xzbCc7XG5pbXBvcnQgZWFzZV9ib3VuY2VfaW5fb3V0IGZyb20gJy4vZ2xzbC9lYXNlX2JvdW5jZV9pbl9vdXQuZ2xzbCc7XG5pbXBvcnQgZWFzZV9ib3VuY2Vfb3V0IGZyb20gJy4vZ2xzbC9lYXNlX2JvdW5jZV9vdXQuZ2xzbCc7XG5pbXBvcnQgZWFzZV9jaXJjX2luIGZyb20gJy4vZ2xzbC9lYXNlX2NpcmNfaW4uZ2xzbCc7XG5pbXBvcnQgZWFzZV9jaXJjX2luX291dCBmcm9tICcuL2dsc2wvZWFzZV9jaXJjX2luX291dC5nbHNsJztcbmltcG9ydCBlYXNlX2NpcmNfb3V0IGZyb20gJy4vZ2xzbC9lYXNlX2NpcmNfb3V0Lmdsc2wnO1xuaW1wb3J0IGVhc2VfY3ViaWNfaW4gZnJvbSAnLi9nbHNsL2Vhc2VfY3ViaWNfaW4uZ2xzbCc7XG5pbXBvcnQgZWFzZV9jdWJpY19pbl9vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfY3ViaWNfaW5fb3V0Lmdsc2wnO1xuaW1wb3J0IGVhc2VfY3ViaWNfb3V0IGZyb20gJy4vZ2xzbC9lYXNlX2N1YmljX291dC5nbHNsJztcbmltcG9ydCBlYXNlX2VsYXN0aWNfaW4gZnJvbSAnLi9nbHNsL2Vhc2VfZWxhc3RpY19pbi5nbHNsJztcbmltcG9ydCBlYXNlX2VsYXN0aWNfaW5fb3V0IGZyb20gJy4vZ2xzbC9lYXNlX2VsYXN0aWNfaW5fb3V0Lmdsc2wnO1xuaW1wb3J0IGVhc2VfZWxhc3RpY19vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfZWxhc3RpY19vdXQuZ2xzbCc7XG5pbXBvcnQgZWFzZV9leHBvX2luIGZyb20gJy4vZ2xzbC9lYXNlX2V4cG9faW4uZ2xzbCc7XG5pbXBvcnQgZWFzZV9leHBvX2luX291dCBmcm9tICcuL2dsc2wvZWFzZV9leHBvX2luX291dC5nbHNsJztcbmltcG9ydCBlYXNlX2V4cG9fb3V0IGZyb20gJy4vZ2xzbC9lYXNlX2V4cG9fb3V0Lmdsc2wnO1xuaW1wb3J0IGVhc2VfcXVhZF9pbiBmcm9tICcuL2dsc2wvZWFzZV9xdWFkX2luLmdsc2wnO1xuaW1wb3J0IGVhc2VfcXVhZF9pbl9vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfcXVhZF9pbl9vdXQuZ2xzbCc7XG5pbXBvcnQgZWFzZV9xdWFkX291dCBmcm9tICcuL2dsc2wvZWFzZV9xdWFkX291dC5nbHNsJztcbmltcG9ydCBlYXNlX3F1YXJ0X2luIGZyb20gJy4vZ2xzbC9lYXNlX3F1YXJ0X2luLmdsc2wnO1xuaW1wb3J0IGVhc2VfcXVhcnRfaW5fb3V0IGZyb20gJy4vZ2xzbC9lYXNlX3F1YXJ0X2luX291dC5nbHNsJztcbmltcG9ydCBlYXNlX3F1YXJ0X291dCBmcm9tICcuL2dsc2wvZWFzZV9xdWFydF9vdXQuZ2xzbCc7XG5pbXBvcnQgZWFzZV9xdWludF9pbiBmcm9tICcuL2dsc2wvZWFzZV9xdWludF9pbi5nbHNsJztcbmltcG9ydCBlYXNlX3F1aW50X2luX291dCBmcm9tICcuL2dsc2wvZWFzZV9xdWludF9pbl9vdXQuZ2xzbCc7XG5pbXBvcnQgZWFzZV9xdWludF9vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfcXVpbnRfb3V0Lmdsc2wnO1xuaW1wb3J0IGVhc2Vfc2luZV9pbiBmcm9tICcuL2dsc2wvZWFzZV9zaW5lX2luLmdsc2wnO1xuaW1wb3J0IGVhc2Vfc2luZV9pbl9vdXQgZnJvbSAnLi9nbHNsL2Vhc2Vfc2luZV9pbl9vdXQuZ2xzbCc7XG5pbXBvcnQgZWFzZV9zaW5lX291dCBmcm9tICcuL2dsc2wvZWFzZV9zaW5lX291dC5nbHNsJztcbmltcG9ydCBxdWFkcmF0aWNfYmV6aWVyIGZyb20gJy4vZ2xzbC9xdWFkcmF0aWNfYmV6aWVyLmdsc2wnO1xuaW1wb3J0IHF1YXRlcm5pb25fcm90YXRpb24gZnJvbSAnLi9nbHNsL3F1YXRlcm5pb25fcm90YXRpb24uZ2xzbCc7XG5pbXBvcnQgcXVhdGVybmlvbl9zbGVycCBmcm9tICcuL2dsc2wvcXVhdGVybmlvbl9zbGVycC5nbHNsJztcblxuXG5leHBvcnQgY29uc3QgU2hhZGVyQ2h1bmsgPSB7XG4gIGNhdG11bGxfcm9tX3NwbGluZTogY2F0bXVsbF9yb21fc3BsaW5lLFxuICBjdWJpY19iZXppZXI6IGN1YmljX2JlemllcixcbiAgZWFzZV9iYWNrX2luOiBlYXNlX2JhY2tfaW4sXG4gIGVhc2VfYmFja19pbl9vdXQ6IGVhc2VfYmFja19pbl9vdXQsXG4gIGVhc2VfYmFja19vdXQ6IGVhc2VfYmFja19vdXQsXG4gIGVhc2VfYmV6aWVyOiBlYXNlX2JlemllcixcbiAgZWFzZV9ib3VuY2VfaW46IGVhc2VfYm91bmNlX2luLFxuICBlYXNlX2JvdW5jZV9pbl9vdXQ6IGVhc2VfYm91bmNlX2luX291dCxcbiAgZWFzZV9ib3VuY2Vfb3V0OiBlYXNlX2JvdW5jZV9vdXQsXG4gIGVhc2VfY2lyY19pbjogZWFzZV9jaXJjX2luLFxuICBlYXNlX2NpcmNfaW5fb3V0OiBlYXNlX2NpcmNfaW5fb3V0LFxuICBlYXNlX2NpcmNfb3V0OiBlYXNlX2NpcmNfb3V0LFxuICBlYXNlX2N1YmljX2luOiBlYXNlX2N1YmljX2luLFxuICBlYXNlX2N1YmljX2luX291dDogZWFzZV9jdWJpY19pbl9vdXQsXG4gIGVhc2VfY3ViaWNfb3V0OiBlYXNlX2N1YmljX291dCxcbiAgZWFzZV9lbGFzdGljX2luOiBlYXNlX2VsYXN0aWNfaW4sXG4gIGVhc2VfZWxhc3RpY19pbl9vdXQ6IGVhc2VfZWxhc3RpY19pbl9vdXQsXG4gIGVhc2VfZWxhc3RpY19vdXQ6IGVhc2VfZWxhc3RpY19vdXQsXG4gIGVhc2VfZXhwb19pbjogZWFzZV9leHBvX2luLFxuICBlYXNlX2V4cG9faW5fb3V0OiBlYXNlX2V4cG9faW5fb3V0LFxuICBlYXNlX2V4cG9fb3V0OiBlYXNlX2V4cG9fb3V0LFxuICBlYXNlX3F1YWRfaW46IGVhc2VfcXVhZF9pbixcbiAgZWFzZV9xdWFkX2luX291dDogZWFzZV9xdWFkX2luX291dCxcbiAgZWFzZV9xdWFkX291dDogZWFzZV9xdWFkX291dCxcbiAgZWFzZV9xdWFydF9pbjogZWFzZV9xdWFydF9pbixcbiAgZWFzZV9xdWFydF9pbl9vdXQ6IGVhc2VfcXVhcnRfaW5fb3V0LFxuICBlYXNlX3F1YXJ0X291dDogZWFzZV9xdWFydF9vdXQsXG4gIGVhc2VfcXVpbnRfaW46IGVhc2VfcXVpbnRfaW4sXG4gIGVhc2VfcXVpbnRfaW5fb3V0OiBlYXNlX3F1aW50X2luX291dCxcbiAgZWFzZV9xdWludF9vdXQ6IGVhc2VfcXVpbnRfb3V0LFxuICBlYXNlX3NpbmVfaW46IGVhc2Vfc2luZV9pbixcbiAgZWFzZV9zaW5lX2luX291dDogZWFzZV9zaW5lX2luX291dCxcbiAgZWFzZV9zaW5lX291dDogZWFzZV9zaW5lX291dCxcbiAgcXVhZHJhdGljX2JlemllcjogcXVhZHJhdGljX2JlemllcixcbiAgcXVhdGVybmlvbl9yb3RhdGlvbjogcXVhdGVybmlvbl9yb3RhdGlvbixcbiAgcXVhdGVybmlvbl9zbGVycDogcXVhdGVybmlvbl9zbGVycCxcblxufTtcblxuIiwiLyoqXG4gKiBBIHRpbWVsaW5lIHRyYW5zaXRpb24gc2VnbWVudC4gQW4gaW5zdGFuY2Ugb2YgdGhpcyBjbGFzcyBpcyBjcmVhdGVkIGludGVybmFsbHkgd2hlbiBjYWxsaW5nIHtAbGluayBUSFJFRS5CQVMuVGltZWxpbmUuYWRkfSwgc28geW91IHNob3VsZCBub3QgdXNlIHRoaXMgY2xhc3MgZGlyZWN0bHkuXG4gKiBUaGUgaW5zdGFuY2UgaXMgYWxzbyBwYXNzZWQgdGhlIHRoZSBjb21waWxlciBmdW5jdGlvbiBpZiB5b3UgcmVnaXN0ZXIgYSB0cmFuc2l0aW9uIHRocm91Z2gge0BsaW5rIFRIUkVFLkJBUy5UaW1lbGluZS5yZWdpc3Rlcn0uIFRoZXJlIHlvdSBjYW4gdXNlIHRoZSBwdWJsaWMgcHJvcGVydGllcyBvZiB0aGUgc2VnbWVudCB0byBjb21waWxlIHRoZSBnbHNsIHN0cmluZy5cbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgQSBzdHJpbmcga2V5IGdlbmVyYXRlZCBieSB0aGUgdGltZWxpbmUgdG8gd2hpY2ggdGhpcyBzZWdtZW50IGJlbG9uZ3MuIEtleXMgYXJlIHVuaXF1ZS5cbiAqIEBwYXJhbSB7bnVtYmVyfSBzdGFydCBTdGFydCB0aW1lIG9mIHRoaXMgc2VnbWVudCBpbiBhIHRpbWVsaW5lIGluIHNlY29uZHMuXG4gKiBAcGFyYW0ge251bWJlcn0gZHVyYXRpb24gRHVyYXRpb24gb2YgdGhpcyBzZWdtZW50IGluIHNlY29uZHMuXG4gKiBAcGFyYW0ge29iamVjdH0gdHJhbnNpdGlvbiBPYmplY3QgZGVzY3JpYmluZyB0aGUgdHJhbnNpdGlvbi5cbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGNvbXBpbGVyIEEgcmVmZXJlbmNlIHRvIHRoZSBjb21waWxlciBmdW5jdGlvbiBmcm9tIGEgdHJhbnNpdGlvbiBkZWZpbml0aW9uLlxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIFRpbWVsaW5lU2VnbWVudChrZXksIHN0YXJ0LCBkdXJhdGlvbiwgdHJhbnNpdGlvbiwgY29tcGlsZXIpIHtcbiAgdGhpcy5rZXkgPSBrZXk7XG4gIHRoaXMuc3RhcnQgPSBzdGFydDtcbiAgdGhpcy5kdXJhdGlvbiA9IGR1cmF0aW9uO1xuICB0aGlzLnRyYW5zaXRpb24gPSB0cmFuc2l0aW9uO1xuICB0aGlzLmNvbXBpbGVyID0gY29tcGlsZXI7XG5cbiAgdGhpcy50cmFpbCA9IDA7XG59XG5cblRpbWVsaW5lU2VnbWVudC5wcm90b3R5cGUuY29tcGlsZSA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy5jb21waWxlcih0aGlzKTtcbn07XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShUaW1lbGluZVNlZ21lbnQucHJvdG90eXBlLCAnZW5kJywge1xuICBnZXQ6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLnN0YXJ0ICsgdGhpcy5kdXJhdGlvbjtcbiAgfVxufSk7XG5cbmV4cG9ydCB7IFRpbWVsaW5lU2VnbWVudCB9O1xuIiwiaW1wb3J0IHsgVGltZWxpbmVTZWdtZW50IH0gZnJvbSAnLi9UaW1lbGluZVNlZ21lbnQnO1xuXG4vKipcbiAqIEEgdXRpbGl0eSBjbGFzcyB0byBjcmVhdGUgYW4gYW5pbWF0aW9uIHRpbWVsaW5lIHdoaWNoIGNhbiBiZSBiYWtlZCBpbnRvIGEgKHZlcnRleCkgc2hhZGVyLlxuICogQnkgZGVmYXVsdCB0aGUgdGltZWxpbmUgc3VwcG9ydHMgdHJhbnNsYXRpb24sIHNjYWxlIGFuZCByb3RhdGlvbi4gVGhpcyBjYW4gYmUgZXh0ZW5kZWQgb3Igb3ZlcnJpZGRlbi5cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBUaW1lbGluZSgpIHtcbiAgLyoqXG4gICAqIFRoZSB0b3RhbCBkdXJhdGlvbiBvZiB0aGUgdGltZWxpbmUgaW4gc2Vjb25kcy5cbiAgICogQHR5cGUge251bWJlcn1cbiAgICovXG4gIHRoaXMuZHVyYXRpb24gPSAwO1xuXG4gIC8qKlxuICAgKiBUaGUgbmFtZSBvZiB0aGUgdmFsdWUgdGhhdCBzZWdtZW50cyB3aWxsIHVzZSB0byByZWFkIHRoZSB0aW1lLiBEZWZhdWx0cyB0byAndFRpbWUnLlxuICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgKi9cbiAgdGhpcy50aW1lS2V5ID0gJ3RUaW1lJztcblxuICB0aGlzLnNlZ21lbnRzID0ge307XG4gIHRoaXMuX19rZXkgPSAwO1xufVxuXG4vLyBzdGF0aWMgZGVmaW5pdGlvbnMgbWFwXG5UaW1lbGluZS5zZWdtZW50RGVmaW5pdGlvbnMgPSB7fTtcblxuLyoqXG4gKiBSZWdpc3RlcnMgYSB0cmFuc2l0aW9uIGRlZmluaXRpb24gZm9yIHVzZSB3aXRoIHtAbGluayBUSFJFRS5CQVMuVGltZWxpbmUuYWRkfS5cbiAqIEBwYXJhbSB7U3RyaW5nfSBrZXkgTmFtZSBvZiB0aGUgdHJhbnNpdGlvbi4gRGVmYXVsdHMgaW5jbHVkZSAnc2NhbGUnLCAncm90YXRlJyBhbmQgJ3RyYW5zbGF0ZScuXG4gKiBAcGFyYW0ge09iamVjdH0gZGVmaW5pdGlvblxuICogQHBhcmFtIHtGdW5jdGlvbn0gZGVmaW5pdGlvbi5jb21waWxlciBBIGZ1bmN0aW9uIHRoYXQgZ2VuZXJhdGVzIGEgZ2xzbCBzdHJpbmcgZm9yIGEgdHJhbnNpdGlvbiBzZWdtZW50LiBBY2NlcHRzIGEgVEhSRUUuQkFTLlRpbWVsaW5lU2VnbWVudCBhcyB0aGUgc29sZSBhcmd1bWVudC5cbiAqIEBwYXJhbSB7Kn0gZGVmaW5pdGlvbi5kZWZhdWx0RnJvbSBUaGUgaW5pdGlhbCB2YWx1ZSBmb3IgYSB0cmFuc2Zvcm0uZnJvbS4gRm9yIGV4YW1wbGUsIHRoZSBkZWZhdWx0RnJvbSBmb3IgYSB0cmFuc2xhdGlvbiBpcyBUSFJFRS5WZWN0b3IzKDAsIDAsIDApLlxuICogQHN0YXRpY1xuICovXG5UaW1lbGluZS5yZWdpc3RlciA9IGZ1bmN0aW9uKGtleSwgZGVmaW5pdGlvbikge1xuICBUaW1lbGluZS5zZWdtZW50RGVmaW5pdGlvbnNba2V5XSA9IGRlZmluaXRpb247XG4gIFxuICByZXR1cm4gZGVmaW5pdGlvbjtcbn07XG5cbi8qKlxuICogQWRkIGEgdHJhbnNpdGlvbiB0byB0aGUgdGltZWxpbmUuXG4gKiBAcGFyYW0ge251bWJlcn0gZHVyYXRpb24gRHVyYXRpb24gaW4gc2Vjb25kc1xuICogQHBhcmFtIHtvYmplY3R9IHRyYW5zaXRpb25zIEFuIG9iamVjdCBjb250YWluaW5nIG9uZSBvciBzZXZlcmFsIHRyYW5zaXRpb25zLiBUaGUga2V5cyBzaG91bGQgbWF0Y2ggdHJhbnNmb3JtIGRlZmluaXRpb25zLlxuICogVGhlIHRyYW5zaXRpb24gb2JqZWN0IGZvciBlYWNoIGtleSB3aWxsIGJlIHBhc3NlZCB0byB0aGUgbWF0Y2hpbmcgZGVmaW5pdGlvbidzIGNvbXBpbGVyLiBJdCBjYW4gaGF2ZSBhcmJpdHJhcnkgcHJvcGVydGllcywgYnV0IHRoZSBUaW1lbGluZSBleHBlY3RzIGF0IGxlYXN0IGEgJ3RvJywgJ2Zyb20nIGFuZCBhbiBvcHRpb25hbCAnZWFzZScuXG4gKiBAcGFyYW0ge251bWJlcnxzdHJpbmd9IFtwb3NpdGlvbk9mZnNldF0gUG9zaXRpb24gaW4gdGhlIHRpbWVsaW5lLiBEZWZhdWx0cyB0byB0aGUgZW5kIG9mIHRoZSB0aW1lbGluZS4gSWYgYSBudW1iZXIgaXMgcHJvdmlkZWQsIHRoZSB0cmFuc2l0aW9uIHdpbGwgYmUgaW5zZXJ0ZWQgYXQgdGhhdCB0aW1lIGluIHNlY29uZHMuIFN0cmluZ3MgKCcrPXgnIG9yICctPXgnKSBjYW4gYmUgdXNlZCBmb3IgYSB2YWx1ZSByZWxhdGl2ZSB0byB0aGUgZW5kIG9mIHRpbWVsaW5lLlxuICovXG5UaW1lbGluZS5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24oZHVyYXRpb24sIHRyYW5zaXRpb25zLCBwb3NpdGlvbk9mZnNldCkge1xuICAvLyBzdG9wIHJvbGx1cCBmcm9tIGNvbXBsYWluaW5nIGFib3V0IGV2YWxcbiAgY29uc3QgX2V2YWwgPSBldmFsO1xuICBcbiAgbGV0IHN0YXJ0ID0gdGhpcy5kdXJhdGlvbjtcblxuICBpZiAocG9zaXRpb25PZmZzZXQgIT09IHVuZGVmaW5lZCkge1xuICAgIGlmICh0eXBlb2YgcG9zaXRpb25PZmZzZXQgPT09ICdudW1iZXInKSB7XG4gICAgICBzdGFydCA9IHBvc2l0aW9uT2Zmc2V0O1xuICAgIH1cbiAgICBlbHNlIGlmICh0eXBlb2YgcG9zaXRpb25PZmZzZXQgPT09ICdzdHJpbmcnKSB7XG4gICAgICBfZXZhbCgnc3RhcnQnICsgcG9zaXRpb25PZmZzZXQpO1xuICAgIH1cblxuICAgIHRoaXMuZHVyYXRpb24gPSBNYXRoLm1heCh0aGlzLmR1cmF0aW9uLCBzdGFydCArIGR1cmF0aW9uKTtcbiAgfVxuICBlbHNlIHtcbiAgICB0aGlzLmR1cmF0aW9uICs9IGR1cmF0aW9uO1xuICB9XG5cbiAgbGV0IGtleXMgPSBPYmplY3Qua2V5cyh0cmFuc2l0aW9ucyksIGtleTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyBpKyspIHtcbiAgICBrZXkgPSBrZXlzW2ldO1xuXG4gICAgdGhpcy5wcm9jZXNzVHJhbnNpdGlvbihrZXksIHRyYW5zaXRpb25zW2tleV0sIHN0YXJ0LCBkdXJhdGlvbik7XG4gIH1cbn07XG5cblRpbWVsaW5lLnByb3RvdHlwZS5wcm9jZXNzVHJhbnNpdGlvbiA9IGZ1bmN0aW9uKGtleSwgdHJhbnNpdGlvbiwgc3RhcnQsIGR1cmF0aW9uKSB7XG4gIGNvbnN0IGRlZmluaXRpb24gPSBUaW1lbGluZS5zZWdtZW50RGVmaW5pdGlvbnNba2V5XTtcblxuICBsZXQgc2VnbWVudHMgPSB0aGlzLnNlZ21lbnRzW2tleV07XG4gIGlmICghc2VnbWVudHMpIHNlZ21lbnRzID0gdGhpcy5zZWdtZW50c1trZXldID0gW107XG5cbiAgaWYgKHRyYW5zaXRpb24uZnJvbSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgaWYgKHNlZ21lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgdHJhbnNpdGlvbi5mcm9tID0gZGVmaW5pdGlvbi5kZWZhdWx0RnJvbTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICB0cmFuc2l0aW9uLmZyb20gPSBzZWdtZW50c1tzZWdtZW50cy5sZW5ndGggLSAxXS50cmFuc2l0aW9uLnRvO1xuICAgIH1cbiAgfVxuXG4gIHNlZ21lbnRzLnB1c2gobmV3IFRpbWVsaW5lU2VnbWVudCgodGhpcy5fX2tleSsrKS50b1N0cmluZygpLCBzdGFydCwgZHVyYXRpb24sIHRyYW5zaXRpb24sIGRlZmluaXRpb24uY29tcGlsZXIpKTtcbn07XG5cbi8qKlxuICogQ29tcGlsZXMgdGhlIHRpbWVsaW5lIGludG8gYSBnbHNsIHN0cmluZyBhcnJheSB0aGF0IGNhbiBiZSBpbmplY3RlZCBpbnRvIGEgKHZlcnRleCkgc2hhZGVyLlxuICogQHJldHVybnMge0FycmF5fVxuICovXG5UaW1lbGluZS5wcm90b3R5cGUuY29tcGlsZSA9IGZ1bmN0aW9uKCkge1xuICBjb25zdCBjID0gW107XG5cbiAgY29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKHRoaXMuc2VnbWVudHMpO1xuICBsZXQgc2VnbWVudHM7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgaSsrKSB7XG4gICAgc2VnbWVudHMgPSB0aGlzLnNlZ21lbnRzW2tleXNbaV1dO1xuXG4gICAgdGhpcy5maWxsR2FwcyhzZWdtZW50cyk7XG5cbiAgICBzZWdtZW50cy5mb3JFYWNoKGZ1bmN0aW9uKHMpIHtcbiAgICAgIGMucHVzaChzLmNvbXBpbGUoKSk7XG4gICAgfSk7XG4gIH1cblxuICByZXR1cm4gYztcbn07XG5UaW1lbGluZS5wcm90b3R5cGUuZmlsbEdhcHMgPSBmdW5jdGlvbihzZWdtZW50cykge1xuICBpZiAoc2VnbWVudHMubGVuZ3RoID09PSAwKSByZXR1cm47XG5cbiAgbGV0IHMwLCBzMTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IHNlZ21lbnRzLmxlbmd0aCAtIDE7IGkrKykge1xuICAgIHMwID0gc2VnbWVudHNbaV07XG4gICAgczEgPSBzZWdtZW50c1tpICsgMV07XG5cbiAgICBzMC50cmFpbCA9IHMxLnN0YXJ0IC0gczAuZW5kO1xuICB9XG5cbiAgLy8gcGFkIGxhc3Qgc2VnbWVudCB1bnRpbCBlbmQgb2YgdGltZWxpbmVcbiAgczAgPSBzZWdtZW50c1tzZWdtZW50cy5sZW5ndGggLSAxXTtcbiAgczAudHJhaWwgPSB0aGlzLmR1cmF0aW9uIC0gczAuZW5kO1xufTtcblxuLyoqXG4gKiBHZXQgYSBjb21waWxlZCBnbHNsIHN0cmluZyB3aXRoIGNhbGxzIHRvIHRyYW5zZm9ybSBmdW5jdGlvbnMgZm9yIGEgZ2l2ZW4ga2V5LlxuICogVGhlIG9yZGVyIGluIHdoaWNoIHRoZXNlIHRyYW5zaXRpb25zIGFyZSBhcHBsaWVkIG1hdHRlcnMgYmVjYXVzZSB0aGV5IGFsbCBvcGVyYXRlIG9uIHRoZSBzYW1lIHZhbHVlLlxuICogQHBhcmFtIHtzdHJpbmd9IGtleSBBIGtleSBtYXRjaGluZyBhIHRyYW5zZm9ybSBkZWZpbml0aW9uLlxuICogQHJldHVybnMge3N0cmluZ31cbiAqL1xuVGltZWxpbmUucHJvdG90eXBlLmdldFRyYW5zZm9ybUNhbGxzID0gZnVuY3Rpb24oa2V5KSB7XG4gIGxldCB0ID0gdGhpcy50aW1lS2V5O1xuXG4gIHJldHVybiB0aGlzLnNlZ21lbnRzW2tleV0gPyAgdGhpcy5zZWdtZW50c1trZXldLm1hcChmdW5jdGlvbihzKSB7XG4gICAgcmV0dXJuIGBhcHBseVRyYW5zZm9ybSR7cy5rZXl9KCR7dH0sIHRyYW5zZm9ybWVkKTtgO1xuICB9KS5qb2luKCdcXG4nKSA6ICcnO1xufTtcblxuZXhwb3J0IHsgVGltZWxpbmUgfVxuIiwiY29uc3QgVGltZWxpbmVDaHVua3MgPSB7XG4gIHZlYzM6IGZ1bmN0aW9uKG4sIHYsIHApIHtcbiAgICBjb25zdCB4ID0gKHYueCB8fCAwKS50b1ByZWNpc2lvbihwKTtcbiAgICBjb25zdCB5ID0gKHYueSB8fCAwKS50b1ByZWNpc2lvbihwKTtcbiAgICBjb25zdCB6ID0gKHYueiB8fCAwKS50b1ByZWNpc2lvbihwKTtcblxuICAgIHJldHVybiBgdmVjMyAke259ID0gdmVjMygke3h9LCAke3l9LCAke3p9KTtgO1xuICB9LFxuICB2ZWM0OiBmdW5jdGlvbihuLCB2LCBwKSB7XG4gICAgY29uc3QgeCA9ICh2LnggfHwgMCkudG9QcmVjaXNpb24ocCk7XG4gICAgY29uc3QgeSA9ICh2LnkgfHwgMCkudG9QcmVjaXNpb24ocCk7XG4gICAgY29uc3QgeiA9ICh2LnogfHwgMCkudG9QcmVjaXNpb24ocCk7XG4gICAgY29uc3QgdyA9ICh2LncgfHwgMCkudG9QcmVjaXNpb24ocCk7XG4gIFxuICAgIHJldHVybiBgdmVjNCAke259ID0gdmVjNCgke3h9LCAke3l9LCAke3p9LCAke3d9KTtgO1xuICB9LFxuICBkZWxheUR1cmF0aW9uOiBmdW5jdGlvbihzZWdtZW50KSB7XG4gICAgcmV0dXJuIGBcbiAgICBmbG9hdCBjRGVsYXkke3NlZ21lbnQua2V5fSA9ICR7c2VnbWVudC5zdGFydC50b1ByZWNpc2lvbig0KX07XG4gICAgZmxvYXQgY0R1cmF0aW9uJHtzZWdtZW50LmtleX0gPSAke3NlZ21lbnQuZHVyYXRpb24udG9QcmVjaXNpb24oNCl9O1xuICAgIGA7XG4gIH0sXG4gIHByb2dyZXNzOiBmdW5jdGlvbihzZWdtZW50KSB7XG4gICAgLy8gemVybyBkdXJhdGlvbiBzZWdtZW50cyBzaG91bGQgYWx3YXlzIHJlbmRlciBjb21wbGV0ZVxuICAgIGlmIChzZWdtZW50LmR1cmF0aW9uID09PSAwKSB7XG4gICAgICByZXR1cm4gYGZsb2F0IHByb2dyZXNzID0gMS4wO2BcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICByZXR1cm4gYFxuICAgICAgZmxvYXQgcHJvZ3Jlc3MgPSBjbGFtcCh0aW1lIC0gY0RlbGF5JHtzZWdtZW50LmtleX0sIDAuMCwgY0R1cmF0aW9uJHtzZWdtZW50LmtleX0pIC8gY0R1cmF0aW9uJHtzZWdtZW50LmtleX07XG4gICAgICAke3NlZ21lbnQudHJhbnNpdGlvbi5lYXNlID8gYHByb2dyZXNzID0gJHtzZWdtZW50LnRyYW5zaXRpb24uZWFzZX0ocHJvZ3Jlc3MkeyhzZWdtZW50LnRyYW5zaXRpb24uZWFzZVBhcmFtcyA/IGAsICR7c2VnbWVudC50cmFuc2l0aW9uLmVhc2VQYXJhbXMubWFwKCh2KSA9PiB2LnRvUHJlY2lzaW9uKDQpKS5qb2luKGAsIGApfWAgOiBgYCl9KTtgIDogYGB9XG4gICAgICBgO1xuICAgIH1cbiAgfSxcbiAgcmVuZGVyQ2hlY2s6IGZ1bmN0aW9uKHNlZ21lbnQpIHtcbiAgICBjb25zdCBzdGFydFRpbWUgPSBzZWdtZW50LnN0YXJ0LnRvUHJlY2lzaW9uKDQpO1xuICAgIGNvbnN0IGVuZFRpbWUgPSAoc2VnbWVudC5lbmQgKyBzZWdtZW50LnRyYWlsKS50b1ByZWNpc2lvbig0KTtcblxuICAgIHJldHVybiBgaWYgKHRpbWUgPCAke3N0YXJ0VGltZX0gfHwgdGltZSA+ICR7ZW5kVGltZX0pIHJldHVybjtgO1xuICB9XG59O1xuXG5leHBvcnQgeyBUaW1lbGluZUNodW5rcyB9O1xuIiwiaW1wb3J0IHsgVGltZWxpbmUgfSBmcm9tICcuL1RpbWVsaW5lJztcbmltcG9ydCB7IFRpbWVsaW5lQ2h1bmtzIH0gZnJvbSAnLi9UaW1lbGluZUNodW5rcyc7XG5pbXBvcnQgeyBWZWN0b3IzIH0gZnJvbSAndGhyZWUnO1xuXG5jb25zdCBUcmFuc2xhdGlvblNlZ21lbnQgPSB7XG4gIGNvbXBpbGVyOiBmdW5jdGlvbihzZWdtZW50KSB7XG4gICAgcmV0dXJuIGBcbiAgICAke1RpbWVsaW5lQ2h1bmtzLmRlbGF5RHVyYXRpb24oc2VnbWVudCl9XG4gICAgJHtUaW1lbGluZUNodW5rcy52ZWMzKGBjVHJhbnNsYXRlRnJvbSR7c2VnbWVudC5rZXl9YCwgc2VnbWVudC50cmFuc2l0aW9uLmZyb20sIDIpfVxuICAgICR7VGltZWxpbmVDaHVua3MudmVjMyhgY1RyYW5zbGF0ZVRvJHtzZWdtZW50LmtleX1gLCBzZWdtZW50LnRyYW5zaXRpb24udG8sIDIpfVxuICAgIFxuICAgIHZvaWQgYXBwbHlUcmFuc2Zvcm0ke3NlZ21lbnQua2V5fShmbG9hdCB0aW1lLCBpbm91dCB2ZWMzIHYpIHtcbiAgICBcbiAgICAgICR7VGltZWxpbmVDaHVua3MucmVuZGVyQ2hlY2soc2VnbWVudCl9XG4gICAgICAke1RpbWVsaW5lQ2h1bmtzLnByb2dyZXNzKHNlZ21lbnQpfVxuICAgIFxuICAgICAgdiArPSBtaXgoY1RyYW5zbGF0ZUZyb20ke3NlZ21lbnQua2V5fSwgY1RyYW5zbGF0ZVRvJHtzZWdtZW50LmtleX0sIHByb2dyZXNzKTtcbiAgICB9XG4gICAgYDtcbiAgfSxcbiAgZGVmYXVsdEZyb206IG5ldyBWZWN0b3IzKDAsIDAsIDApXG59O1xuXG5UaW1lbGluZS5yZWdpc3RlcigndHJhbnNsYXRlJywgVHJhbnNsYXRpb25TZWdtZW50KTtcblxuZXhwb3J0IHsgVHJhbnNsYXRpb25TZWdtZW50IH07XG4iLCJpbXBvcnQgeyBUaW1lbGluZSB9IGZyb20gJy4vVGltZWxpbmUnO1xuaW1wb3J0IHsgVGltZWxpbmVDaHVua3MgfSBmcm9tICcuL1RpbWVsaW5lQ2h1bmtzJztcbmltcG9ydCB7IFZlY3RvcjMgfSBmcm9tICd0aHJlZSc7XG5cbmNvbnN0IFNjYWxlU2VnbWVudCA9IHtcbiAgY29tcGlsZXI6IGZ1bmN0aW9uKHNlZ21lbnQpIHtcbiAgICBjb25zdCBvcmlnaW4gPSBzZWdtZW50LnRyYW5zaXRpb24ub3JpZ2luO1xuICAgIFxuICAgIHJldHVybiBgXG4gICAgJHtUaW1lbGluZUNodW5rcy5kZWxheUR1cmF0aW9uKHNlZ21lbnQpfVxuICAgICR7VGltZWxpbmVDaHVua3MudmVjMyhgY1NjYWxlRnJvbSR7c2VnbWVudC5rZXl9YCwgc2VnbWVudC50cmFuc2l0aW9uLmZyb20sIDIpfVxuICAgICR7VGltZWxpbmVDaHVua3MudmVjMyhgY1NjYWxlVG8ke3NlZ21lbnQua2V5fWAsIHNlZ21lbnQudHJhbnNpdGlvbi50bywgMil9XG4gICAgJHtvcmlnaW4gPyBUaW1lbGluZUNodW5rcy52ZWMzKGBjT3JpZ2luJHtzZWdtZW50LmtleX1gLCBvcmlnaW4sIDIpIDogJyd9XG4gICAgXG4gICAgdm9pZCBhcHBseVRyYW5zZm9ybSR7c2VnbWVudC5rZXl9KGZsb2F0IHRpbWUsIGlub3V0IHZlYzMgdikge1xuICAgIFxuICAgICAgJHtUaW1lbGluZUNodW5rcy5yZW5kZXJDaGVjayhzZWdtZW50KX1cbiAgICAgICR7VGltZWxpbmVDaHVua3MucHJvZ3Jlc3Moc2VnbWVudCl9XG4gICAgXG4gICAgICAke29yaWdpbiA/IGB2IC09IGNPcmlnaW4ke3NlZ21lbnQua2V5fTtgIDogJyd9XG4gICAgICB2ICo9IG1peChjU2NhbGVGcm9tJHtzZWdtZW50LmtleX0sIGNTY2FsZVRvJHtzZWdtZW50LmtleX0sIHByb2dyZXNzKTtcbiAgICAgICR7b3JpZ2luID8gYHYgKz0gY09yaWdpbiR7c2VnbWVudC5rZXl9O2AgOiAnJ31cbiAgICB9XG4gICAgYDtcbiAgfSxcbiAgZGVmYXVsdEZyb206IG5ldyBWZWN0b3IzKDEsIDEsIDEpXG59O1xuXG5UaW1lbGluZS5yZWdpc3Rlcignc2NhbGUnLCBTY2FsZVNlZ21lbnQpO1xuXG5leHBvcnQgeyBTY2FsZVNlZ21lbnQgfTtcbiIsImltcG9ydCB7IFRpbWVsaW5lIH0gZnJvbSAnLi9UaW1lbGluZSc7XG5pbXBvcnQgeyBUaW1lbGluZUNodW5rcyB9IGZyb20gJy4vVGltZWxpbmVDaHVua3MnO1xuaW1wb3J0IHsgVmVjdG9yMywgVmVjdG9yNCB9IGZyb20gJ3RocmVlJztcblxuY29uc3QgUm90YXRpb25TZWdtZW50ID0ge1xuICBjb21waWxlcihzZWdtZW50KSB7XG4gICAgY29uc3QgZnJvbUF4aXNBbmdsZSA9IG5ldyBWZWN0b3I0KFxuICAgICAgc2VnbWVudC50cmFuc2l0aW9uLmZyb20uYXhpcy54LFxuICAgICAgc2VnbWVudC50cmFuc2l0aW9uLmZyb20uYXhpcy55LFxuICAgICAgc2VnbWVudC50cmFuc2l0aW9uLmZyb20uYXhpcy56LFxuICAgICAgc2VnbWVudC50cmFuc2l0aW9uLmZyb20uYW5nbGVcbiAgICApO1xuICBcbiAgICBjb25zdCB0b0F4aXMgPSBzZWdtZW50LnRyYW5zaXRpb24udG8uYXhpcyB8fCBzZWdtZW50LnRyYW5zaXRpb24uZnJvbS5heGlzO1xuICAgIGNvbnN0IHRvQXhpc0FuZ2xlID0gbmV3IFZlY3RvcjQoXG4gICAgICB0b0F4aXMueCxcbiAgICAgIHRvQXhpcy55LFxuICAgICAgdG9BeGlzLnosXG4gICAgICBzZWdtZW50LnRyYW5zaXRpb24udG8uYW5nbGVcbiAgICApO1xuICBcbiAgICBjb25zdCBvcmlnaW4gPSBzZWdtZW50LnRyYW5zaXRpb24ub3JpZ2luO1xuICAgIFxuICAgIHJldHVybiBgXG4gICAgJHtUaW1lbGluZUNodW5rcy5kZWxheUR1cmF0aW9uKHNlZ21lbnQpfVxuICAgICR7VGltZWxpbmVDaHVua3MudmVjNChgY1JvdGF0aW9uRnJvbSR7c2VnbWVudC5rZXl9YCwgZnJvbUF4aXNBbmdsZSwgOCl9XG4gICAgJHtUaW1lbGluZUNodW5rcy52ZWM0KGBjUm90YXRpb25UbyR7c2VnbWVudC5rZXl9YCwgdG9BeGlzQW5nbGUsIDgpfVxuICAgICR7b3JpZ2luID8gVGltZWxpbmVDaHVua3MudmVjMyhgY09yaWdpbiR7c2VnbWVudC5rZXl9YCwgb3JpZ2luLCAyKSA6ICcnfVxuICAgIFxuICAgIHZvaWQgYXBwbHlUcmFuc2Zvcm0ke3NlZ21lbnQua2V5fShmbG9hdCB0aW1lLCBpbm91dCB2ZWMzIHYpIHtcbiAgICAgICR7VGltZWxpbmVDaHVua3MucmVuZGVyQ2hlY2soc2VnbWVudCl9XG4gICAgICAke1RpbWVsaW5lQ2h1bmtzLnByb2dyZXNzKHNlZ21lbnQpfVxuXG4gICAgICAke29yaWdpbiA/IGB2IC09IGNPcmlnaW4ke3NlZ21lbnQua2V5fTtgIDogJyd9XG4gICAgICB2ZWMzIGF4aXMgPSBub3JtYWxpemUobWl4KGNSb3RhdGlvbkZyb20ke3NlZ21lbnQua2V5fS54eXosIGNSb3RhdGlvblRvJHtzZWdtZW50LmtleX0ueHl6LCBwcm9ncmVzcykpO1xuICAgICAgZmxvYXQgYW5nbGUgPSBtaXgoY1JvdGF0aW9uRnJvbSR7c2VnbWVudC5rZXl9LncsIGNSb3RhdGlvblRvJHtzZWdtZW50LmtleX0udywgcHJvZ3Jlc3MpO1xuICAgICAgdmVjNCBxID0gcXVhdEZyb21BeGlzQW5nbGUoYXhpcywgYW5nbGUpO1xuICAgICAgdiA9IHJvdGF0ZVZlY3RvcihxLCB2KTtcbiAgICAgICR7b3JpZ2luID8gYHYgKz0gY09yaWdpbiR7c2VnbWVudC5rZXl9O2AgOiAnJ31cbiAgICB9XG4gICAgYDtcbiAgfSxcbiAgZGVmYXVsdEZyb206IHtheGlzOiBuZXcgVmVjdG9yMygpLCBhbmdsZTogMH1cbn07XG5cblRpbWVsaW5lLnJlZ2lzdGVyKCdyb3RhdGUnLCBSb3RhdGlvblNlZ21lbnQpO1xuXG5leHBvcnQgeyBSb3RhdGlvblNlZ21lbnQgfTtcbiJdLCJuYW1lcyI6WyJCYXNlQW5pbWF0aW9uTWF0ZXJpYWwiLCJwYXJhbWV0ZXJzIiwidW5pZm9ybXMiLCJjYWxsIiwidW5pZm9ybVZhbHVlcyIsInNldFZhbHVlcyIsIlVuaWZvcm1zVXRpbHMiLCJtZXJnZSIsInNldFVuaWZvcm1WYWx1ZXMiLCJtYXAiLCJkZWZpbmVzIiwibm9ybWFsTWFwIiwiZW52TWFwIiwiYW9NYXAiLCJzcGVjdWxhck1hcCIsImFscGhhTWFwIiwibGlnaHRNYXAiLCJlbWlzc2l2ZU1hcCIsImJ1bXBNYXAiLCJkaXNwbGFjZW1lbnRNYXAiLCJyb3VnaG5lc3NNYXAiLCJtZXRhbG5lc3NNYXAiLCJncmFkaWVudE1hcCIsImVudk1hcFR5cGVEZWZpbmUiLCJlbnZNYXBNb2RlRGVmaW5lIiwiZW52TWFwQmxlbmRpbmdEZWZpbmUiLCJtYXBwaW5nIiwiQ3ViZVJlZmxlY3Rpb25NYXBwaW5nIiwiQ3ViZVJlZnJhY3Rpb25NYXBwaW5nIiwiQ3ViZVVWUmVmbGVjdGlvbk1hcHBpbmciLCJDdWJlVVZSZWZyYWN0aW9uTWFwcGluZyIsIkVxdWlyZWN0YW5ndWxhclJlZmxlY3Rpb25NYXBwaW5nIiwiRXF1aXJlY3Rhbmd1bGFyUmVmcmFjdGlvbk1hcHBpbmciLCJTcGhlcmljYWxSZWZsZWN0aW9uTWFwcGluZyIsImNvbWJpbmUiLCJNaXhPcGVyYXRpb24iLCJBZGRPcGVyYXRpb24iLCJNdWx0aXBseU9wZXJhdGlvbiIsInByb3RvdHlwZSIsIk9iamVjdCIsImFzc2lnbiIsImNyZWF0ZSIsIlNoYWRlck1hdGVyaWFsIiwidmFsdWVzIiwia2V5cyIsImZvckVhY2giLCJrZXkiLCJ2YWx1ZSIsIm5hbWUiLCJqb2luIiwiQmFzaWNBbmltYXRpb25NYXRlcmlhbCIsInZhcnlpbmdQYXJhbWV0ZXJzIiwidmVydGV4UGFyYW1ldGVycyIsInZlcnRleEZ1bmN0aW9ucyIsInZlcnRleEluaXQiLCJ2ZXJ0ZXhOb3JtYWwiLCJ2ZXJ0ZXhQb3NpdGlvbiIsInZlcnRleENvbG9yIiwidmVydGV4UG9zdE1vcnBoIiwidmVydGV4UG9zdFNraW5uaW5nIiwiZnJhZ21lbnRGdW5jdGlvbnMiLCJmcmFnbWVudFBhcmFtZXRlcnMiLCJmcmFnbWVudEluaXQiLCJmcmFnbWVudE1hcCIsImZyYWdtZW50RGlmZnVzZSIsIlNoYWRlckxpYiIsImxpZ2h0cyIsInZlcnRleFNoYWRlciIsImNvbmNhdFZlcnRleFNoYWRlciIsImZyYWdtZW50U2hhZGVyIiwiY29uY2F0RnJhZ21lbnRTaGFkZXIiLCJjb25zdHJ1Y3RvciIsInN0cmluZ2lmeUNodW5rIiwiTGFtYmVydEFuaW1hdGlvbk1hdGVyaWFsIiwiZnJhZ21lbnRFbWlzc2l2ZSIsImZyYWdtZW50U3BlY3VsYXIiLCJQaG9uZ0FuaW1hdGlvbk1hdGVyaWFsIiwiU3RhbmRhcmRBbmltYXRpb25NYXRlcmlhbCIsImZyYWdtZW50Um91Z2huZXNzIiwiZnJhZ21lbnRNZXRhbG5lc3MiLCJUb29uQW5pbWF0aW9uTWF0ZXJpYWwiLCJQb2ludHNBbmltYXRpb25NYXRlcmlhbCIsImZyYWdtZW50U2hhcGUiLCJEZXB0aEFuaW1hdGlvbk1hdGVyaWFsIiwiZGVwdGhQYWNraW5nIiwiUkdCQURlcHRoUGFja2luZyIsImNsaXBwaW5nIiwiRGlzdGFuY2VBbmltYXRpb25NYXRlcmlhbCIsIlByZWZhYkJ1ZmZlckdlb21ldHJ5IiwicHJlZmFiIiwiY291bnQiLCJwcmVmYWJHZW9tZXRyeSIsImlzUHJlZmFiQnVmZmVyR2VvbWV0cnkiLCJpc0J1ZmZlckdlb21ldHJ5IiwicHJlZmFiQ291bnQiLCJwcmVmYWJWZXJ0ZXhDb3VudCIsImF0dHJpYnV0ZXMiLCJwb3NpdGlvbiIsInZlcnRpY2VzIiwibGVuZ3RoIiwiYnVmZmVySW5kaWNlcyIsImJ1ZmZlclBvc2l0aW9ucyIsIkJ1ZmZlckdlb21ldHJ5IiwicHJlZmFiSW5kaWNlcyIsInByZWZhYkluZGV4Q291bnQiLCJpbmRleCIsImFycmF5IiwiaSIsInB1c2giLCJwcmVmYWJGYWNlQ291bnQiLCJmYWNlcyIsImZhY2UiLCJhIiwiYiIsImMiLCJpbmRleEJ1ZmZlciIsIlVpbnQzMkFycmF5Iiwic2V0SW5kZXgiLCJCdWZmZXJBdHRyaWJ1dGUiLCJrIiwicG9zaXRpb25CdWZmZXIiLCJjcmVhdGVBdHRyaWJ1dGUiLCJwb3NpdGlvbnMiLCJvZmZzZXQiLCJqIiwicHJlZmFiVmVydGV4IiwieCIsInkiLCJ6IiwiYnVmZmVyVXZzIiwidXZCdWZmZXIiLCJ1dnMiLCJ1diIsImZhY2VWZXJ0ZXhVdnMiLCJpdGVtU2l6ZSIsImZhY3RvcnkiLCJidWZmZXIiLCJGbG9hdDMyQXJyYXkiLCJhdHRyaWJ1dGUiLCJhZGRBdHRyaWJ1dGUiLCJkYXRhIiwic2V0UHJlZmFiRGF0YSIsInByZWZhYkluZGV4IiwiTXVsdGlQcmVmYWJCdWZmZXJHZW9tZXRyeSIsInByZWZhYnMiLCJyZXBlYXRDb3VudCIsIkFycmF5IiwiaXNBcnJheSIsInByZWZhYkdlb21ldHJpZXMiLCJwcmVmYWJHZW9tZXRyaWVzQ291bnQiLCJwcmVmYWJWZXJ0ZXhDb3VudHMiLCJwIiwicmVwZWF0VmVydGV4Q291bnQiLCJyZWR1Y2UiLCJyIiwidiIsInJlcGVhdEluZGV4Q291bnQiLCJpbmRpY2VzIiwiZ2VvbWV0cnkiLCJpbmRleE9mZnNldCIsInByZWZhYk9mZnNldCIsInZlcnRleENvdW50IiwicHJlZmFiUG9zaXRpb25zIiwicHJlZmFiVXZzIiwiZXJyb3IiLCJ1dk9iamVjdHMiLCJwcmVmYWJHZW9tZXRyeUluZGV4IiwicHJlZmFiR2VvbWV0cnlWZXJ0ZXhDb3VudCIsIndob2xlIiwid2hvbGVPZmZzZXQiLCJwYXJ0IiwicGFydE9mZnNldCIsIkluc3RhbmNlZFByZWZhYkJ1ZmZlckdlb21ldHJ5IiwiaXNHZW9tZXRyeSIsImNvcHkiLCJtYXhJbnN0YW5jZWRDb3VudCIsIkluc3RhbmNlZEJ1ZmZlckdlb21ldHJ5IiwiSW5zdGFuY2VkQnVmZmVyQXR0cmlidXRlIiwiVXRpbHMiLCJpbCIsIm4iLCJ2YSIsInZiIiwidmMiLCJjbG9uZSIsIlZlY3RvcjMiLCJib3giLCJ0TWF0aCIsInJhbmRGbG9hdCIsIm1pbiIsIm1heCIsInJhbmRGbG9hdFNwcmVhZCIsIm5vcm1hbGl6ZSIsInNvdXJjZU1hdGVyaWFsIiwiTW9kZWxCdWZmZXJHZW9tZXRyeSIsIm1vZGVsIiwib3B0aW9ucyIsIm1vZGVsR2VvbWV0cnkiLCJmYWNlQ291bnQiLCJjb21wdXRlQ2VudHJvaWRzIiwibG9jYWxpemVGYWNlcyIsImNlbnRyb2lkcyIsImNvbXB1dGVDZW50cm9pZCIsImNlbnRyb2lkIiwidmVydGV4IiwiYnVmZmVyU2tpbm5pbmciLCJza2luSW5kZXhCdWZmZXIiLCJza2luV2VpZ2h0QnVmZmVyIiwic2tpbkluZGV4Iiwic2tpbkluZGljZXMiLCJza2luV2VpZ2h0Iiwic2tpbldlaWdodHMiLCJ3Iiwic2V0RmFjZURhdGEiLCJmYWNlSW5kZXgiLCJQb2ludEJ1ZmZlckdlb21ldHJ5IiwicG9pbnRDb3VudCIsInNldFBvaW50RGF0YSIsInBvaW50SW5kZXgiLCJTaGFkZXJDaHVuayIsImNhdG11bGxfcm9tX3NwbGluZSIsImN1YmljX2JlemllciIsImVhc2VfYmFja19pbiIsImVhc2VfYmFja19pbl9vdXQiLCJlYXNlX2JhY2tfb3V0IiwiZWFzZV9iZXppZXIiLCJlYXNlX2JvdW5jZV9pbiIsImVhc2VfYm91bmNlX2luX291dCIsImVhc2VfYm91bmNlX291dCIsImVhc2VfY2lyY19pbiIsImVhc2VfY2lyY19pbl9vdXQiLCJlYXNlX2NpcmNfb3V0IiwiZWFzZV9jdWJpY19pbiIsImVhc2VfY3ViaWNfaW5fb3V0IiwiZWFzZV9jdWJpY19vdXQiLCJlYXNlX2VsYXN0aWNfaW4iLCJlYXNlX2VsYXN0aWNfaW5fb3V0IiwiZWFzZV9lbGFzdGljX291dCIsImVhc2VfZXhwb19pbiIsImVhc2VfZXhwb19pbl9vdXQiLCJlYXNlX2V4cG9fb3V0IiwiZWFzZV9xdWFkX2luIiwiZWFzZV9xdWFkX2luX291dCIsImVhc2VfcXVhZF9vdXQiLCJlYXNlX3F1YXJ0X2luIiwiZWFzZV9xdWFydF9pbl9vdXQiLCJlYXNlX3F1YXJ0X291dCIsImVhc2VfcXVpbnRfaW4iLCJlYXNlX3F1aW50X2luX291dCIsImVhc2VfcXVpbnRfb3V0IiwiZWFzZV9zaW5lX2luIiwiZWFzZV9zaW5lX2luX291dCIsImVhc2Vfc2luZV9vdXQiLCJxdWFkcmF0aWNfYmV6aWVyIiwicXVhdGVybmlvbl9yb3RhdGlvbiIsInF1YXRlcm5pb25fc2xlcnAiLCJUaW1lbGluZVNlZ21lbnQiLCJzdGFydCIsImR1cmF0aW9uIiwidHJhbnNpdGlvbiIsImNvbXBpbGVyIiwidHJhaWwiLCJjb21waWxlIiwiZGVmaW5lUHJvcGVydHkiLCJUaW1lbGluZSIsInRpbWVLZXkiLCJzZWdtZW50cyIsIl9fa2V5Iiwic2VnbWVudERlZmluaXRpb25zIiwicmVnaXN0ZXIiLCJkZWZpbml0aW9uIiwiYWRkIiwidHJhbnNpdGlvbnMiLCJwb3NpdGlvbk9mZnNldCIsIl9ldmFsIiwiZXZhbCIsInVuZGVmaW5lZCIsIk1hdGgiLCJwcm9jZXNzVHJhbnNpdGlvbiIsImZyb20iLCJkZWZhdWx0RnJvbSIsInRvIiwidG9TdHJpbmciLCJmaWxsR2FwcyIsInMiLCJzMCIsInMxIiwiZW5kIiwiZ2V0VHJhbnNmb3JtQ2FsbHMiLCJ0IiwiVGltZWxpbmVDaHVua3MiLCJ0b1ByZWNpc2lvbiIsInNlZ21lbnQiLCJlYXNlIiwiZWFzZVBhcmFtcyIsInN0YXJ0VGltZSIsImVuZFRpbWUiLCJUcmFuc2xhdGlvblNlZ21lbnQiLCJkZWxheUR1cmF0aW9uIiwidmVjMyIsInJlbmRlckNoZWNrIiwicHJvZ3Jlc3MiLCJTY2FsZVNlZ21lbnQiLCJvcmlnaW4iLCJSb3RhdGlvblNlZ21lbnQiLCJmcm9tQXhpc0FuZ2xlIiwiVmVjdG9yNCIsImF4aXMiLCJhbmdsZSIsInRvQXhpcyIsInRvQXhpc0FuZ2xlIiwidmVjNCJdLCJtYXBwaW5ncyI6Ijs7QUFlQSxTQUFTQSxxQkFBVCxDQUErQkMsVUFBL0IsRUFBMkNDLFFBQTNDLEVBQXFEO2lCQUNwQ0MsSUFBZixDQUFvQixJQUFwQjs7TUFFTUMsZ0JBQWdCSCxXQUFXRyxhQUFqQztTQUNPSCxXQUFXRyxhQUFsQjs7T0FFS0MsU0FBTCxDQUFlSixVQUFmOztPQUVLQyxRQUFMLEdBQWdCSSxjQUFjQyxLQUFkLENBQW9CLENBQUNM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
