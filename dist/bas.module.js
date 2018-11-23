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

/**
 * Extends THREE.MeshToonMaterial with custom shader chunks.
 *
 * @param {Object} parameters Object containing material properties and custom shader chunks.
 * @constructor
 */
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzLm1vZHVsZS5qcyIsInNvdXJjZXMiOlsiLi4vc3JjL21hdGVyaWFscy9CYXNlQW5pbWF0aW9uTWF0ZXJpYWwuanMiLCIuLi9zcmMvbWF0ZXJpYWxzL0Jhc2ljQW5pbWF0aW9uTWF0ZXJpYWwuanMiLCIuLi9zcmMvbWF0ZXJpYWxzL0xhbWJlcnRBbmltYXRpb25NYXRlcmlhbC5qcyIsIi4uL3NyYy9tYXRlcmlhbHMvUGhvbmdBbmltYXRpb25NYXRlcmlhbC5qcyIsIi4uL3NyYy9tYXRlcmlhbHMvU3RhbmRhcmRBbmltYXRpb25NYXRlcmlhbC5qcyIsIi4uL3NyYy9tYXRlcmlhbHMvVG9vbkFuaW1hdGlvbk1hdGVyaWFsLmpzIiwiLi4vc3JjL21hdGVyaWFscy9Qb2ludHNBbmltYXRpb25NYXRlcmlhbC5qcyIsIi4uL3NyYy9tYXRlcmlhbHMvRGVwdGhBbmltYXRpb25NYXRlcmlhbC5qcyIsIi4uL3NyYy9tYXRlcmlhbHMvRGlzdGFuY2VBbmltYXRpb25NYXRlcmlhbC5qcyIsIi4uL3NyYy9nZW9tZXRyeS9QcmVmYWJCdWZmZXJHZW9tZXRyeS5qcyIsIi4uL3NyYy9nZW9tZXRyeS9NdWx0aVByZWZhYkJ1ZmZlckdlb21ldHJ5LmpzIiwiLi4vc3JjL2dlb21ldHJ5L0luc3RhbmNlZFByZWZhYkJ1ZmZlckdlb21ldHJ5LmpzIiwiLi4vc3JjL1V0aWxzLmpzIiwiLi4vc3JjL2dlb21ldHJ5L01vZGVsQnVmZmVyR2VvbWV0cnkuanMiLCIuLi9zcmMvZ2VvbWV0cnkvUG9pbnRCdWZmZXJHZW9tZXRyeS5qcyIsIi4uL3NyYy9TaGFkZXJDaHVuay5qcyIsIi4uL3NyYy90aW1lbGluZS9UaW1lbGluZVNlZ21lbnQuanMiLCIuLi9zcmMvdGltZWxpbmUvVGltZWxpbmUuanMiLCIuLi9zcmMvdGltZWxpbmUvVGltZWxpbmVDaHVua3MuanMiLCIuLi9zcmMvdGltZWxpbmUvVHJhbnNsYXRpb25TZWdtZW50LmpzIiwiLi4vc3JjL3RpbWVsaW5lL1NjYWxlU2VnbWVudC5qcyIsIi4uL3NyYy90aW1lbGluZS9Sb3RhdGlvblNlZ21lbnQuanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgU2hhZGVyTWF0ZXJpYWwsXG4gIFVuaWZvcm1zVXRpbHMsXG4gIEN1YmVSZWZsZWN0aW9uTWFwcGluZyxcbiAgQ3ViZVJlZnJhY3Rpb25NYXBwaW5nLFxuICBDdWJlVVZSZWZsZWN0aW9uTWFwcGluZyxcbiAgQ3ViZVVWUmVmcmFjdGlvbk1hcHBpbmcsXG4gIEVxdWlyZWN0YW5ndWxhclJlZmxlY3Rpb25NYXBwaW5nLFxuICBFcXVpcmVjdGFuZ3VsYXJSZWZyYWN0aW9uTWFwcGluZyxcbiAgU3BoZXJpY2FsUmVmbGVjdGlvbk1hcHBpbmcsXG4gIE1peE9wZXJhdGlvbixcbiAgQWRkT3BlcmF0aW9uLFxuICBNdWx0aXBseU9wZXJhdGlvblxufSBmcm9tICd0aHJlZSc7XG5cbmZ1bmN0aW9uIEJhc2VBbmltYXRpb25NYXRlcmlhbChwYXJhbWV0ZXJzLCB1bmlmb3Jtcykge1xuICBTaGFkZXJNYXRlcmlhbC5jYWxsKHRoaXMpO1xuXG4gIGNvbnN0IHVuaWZvcm1WYWx1ZXMgPSBwYXJhbWV0ZXJzLnVuaWZvcm1WYWx1ZXM7XG4gIGRlbGV0ZSBwYXJhbWV0ZXJzLnVuaWZvcm1WYWx1ZXM7XG5cbiAgdGhpcy5zZXRWYWx1ZXMocGFyYW1ldGVycyk7XG5cbiAgdGhpcy51bmlmb3JtcyA9IFVuaWZvcm1zVXRpbHMubWVyZ2UoW3VuaWZvcm1zLCB0aGlzLnVuaWZvcm1zXSk7XG5cbiAgdGhpcy5zZXRVbmlmb3JtVmFsdWVzKHVuaWZvcm1WYWx1ZXMpO1xuXG4gIGlmICh1bmlmb3JtVmFsdWVzKSB7XG4gICAgdW5pZm9ybVZhbHVlcy5tYXAgJiYgKHRoaXMuZGVmaW5lc1snVVNFX01BUCddID0gJycpO1xuICAgIHVuaWZvcm1WYWx1ZXMubm9ybWFsTWFwICYmICh0aGlzLmRlZmluZXNbJ1VTRV9OT1JNQUxNQVAnXSA9ICcnKTtcbiAgICB1bmlmb3JtVmFsdWVzLmVudk1hcCAmJiAodGhpcy5kZWZpbmVzWydVU0VfRU5WTUFQJ10gPSAnJyk7XG4gICAgdW5pZm9ybVZhbHVlcy5hb01hcCAmJiAodGhpcy5kZWZpbmVzWydVU0VfQU9NQVAnXSA9ICcnKTtcbiAgICB1bmlmb3JtVmFsdWVzLnNwZWN1bGFyTWFwICYmICh0aGlzLmRlZmluZXNbJ1VTRV9TUEVDVUxBUk1BUCddID0gJycpO1xuICAgIHVuaWZvcm1WYWx1ZXMuYWxwaGFNYXAgJiYgKHRoaXMuZGVmaW5lc1snVVNFX0FMUEhBTUFQJ10gPSAnJyk7XG4gICAgdW5pZm9ybVZhbHVlcy5saWdodE1hcCAmJiAodGhpcy5kZWZpbmVzWydVU0VfTElHSFRNQVAnXSA9ICcnKTtcbiAgICB1bmlmb3JtVmFsdWVzLmVtaXNzaXZlTWFwICYmICh0aGlzLmRlZmluZXNbJ1VTRV9FTUlTU0lWRU1BUCddID0gJycpO1xuICAgIHVuaWZvcm1WYWx1ZXMuYnVtcE1hcCAmJiAodGhpcy5kZWZpbmVzWydVU0VfQlVNUE1BUCddID0gJycpO1xuICAgIHVuaWZvcm1WYWx1ZXMuZGlzcGxhY2VtZW50TWFwICYmICh0aGlzLmRlZmluZXNbJ1VTRV9ESVNQTEFDRU1FTlRNQVAnXSA9ICcnKTtcbiAgICB1bmlmb3JtVmFsdWVzLnJvdWdobmVzc01hcCAmJiAodGhpcy5kZWZpbmVzWydVU0VfRElTUExBQ0VNRU5UTUFQJ10gPSAnJyk7XG4gICAgdW5pZm9ybVZhbHVlcy5yb3VnaG5lc3NNYXAgJiYgKHRoaXMuZGVmaW5lc1snVVNFX1JPVUdITkVTU01BUCddID0gJycpO1xuICAgIHVuaWZvcm1WYWx1ZXMubWV0YWxuZXNzTWFwICYmICh0aGlzLmRlZmluZXNbJ1VTRV9NRVRBTE5FU1NNQVAnXSA9ICcnKTtcbiAgICB1bmlmb3JtVmFsdWVzLmdyYWRpZW50TWFwICYmICh0aGlzLmRlZmluZXNbJ1VTRV9HUkFESUVOVE1BUCddID0gJycpO1xuXG4gICAgaWYgKHVuaWZvcm1WYWx1ZXMuZW52TWFwKSB7XG4gICAgICB0aGlzLmRlZmluZXNbJ1VTRV9FTlZNQVAnXSA9ICcnO1xuXG4gICAgICBsZXQgZW52TWFwVHlwZURlZmluZSA9ICdFTlZNQVBfVFlQRV9DVUJFJztcbiAgICAgIGxldCBlbnZNYXBNb2RlRGVmaW5lID0gJ0VOVk1BUF9NT0RFX1JFRkxFQ1RJT04nO1xuICAgICAgbGV0IGVudk1hcEJsZW5kaW5nRGVmaW5lID0gJ0VOVk1BUF9CTEVORElOR19NVUxUSVBMWSc7XG5cbiAgICAgIHN3aXRjaCAodW5pZm9ybVZhbHVlcy5lbnZNYXAubWFwcGluZykge1xuICAgICAgICBjYXNlIEN1YmVSZWZsZWN0aW9uTWFwcGluZzpcbiAgICAgICAgY2FzZSBDdWJlUmVmcmFjdGlvbk1hcHBpbmc6XG4gICAgICAgICAgZW52TWFwVHlwZURlZmluZSA9ICdFTlZNQVBfVFlQRV9DVUJFJztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDdWJlVVZSZWZsZWN0aW9uTWFwcGluZzpcbiAgICAgICAgY2FzZSBDdWJlVVZSZWZyYWN0aW9uTWFwcGluZzpcbiAgICAgICAgICBlbnZNYXBUeXBlRGVmaW5lID0gJ0VOVk1BUF9UWVBFX0NVQkVfVVYnO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIEVxdWlyZWN0YW5ndWxhclJlZmxlY3Rpb25NYXBwaW5nOlxuICAgICAgICBjYXNlIEVxdWlyZWN0YW5ndWxhclJlZnJhY3Rpb25NYXBwaW5nOlxuICAgICAgICAgIGVudk1hcFR5cGVEZWZpbmUgPSAnRU5WTUFQX1RZUEVfRVFVSVJFQyc7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgU3BoZXJpY2FsUmVmbGVjdGlvbk1hcHBpbmc6XG4gICAgICAgICAgZW52TWFwVHlwZURlZmluZSA9ICdFTlZNQVBfVFlQRV9TUEhFUkUnO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBzd2l0Y2ggKHVuaWZvcm1WYWx1ZXMuZW52TWFwLm1hcHBpbmcpIHtcbiAgICAgICAgY2FzZSBDdWJlUmVmcmFjdGlvbk1hcHBpbmc6XG4gICAgICAgIGNhc2UgRXF1aXJlY3Rhbmd1bGFyUmVmcmFjdGlvbk1hcHBpbmc6XG4gICAgICAgICAgZW52TWFwTW9kZURlZmluZSA9ICdFTlZNQVBfTU9ERV9SRUZSQUNUSU9OJztcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgc3dpdGNoICh1bmlmb3JtVmFsdWVzLmNvbWJpbmUpIHtcbiAgICAgICAgY2FzZSBNaXhPcGVyYXRpb246XG4gICAgICAgICAgZW52TWFwQmxlbmRpbmdEZWZpbmUgPSAnRU5WTUFQX0JMRU5ESU5HX01JWCc7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQWRkT3BlcmF0aW9uOlxuICAgICAgICAgIGVudk1hcEJsZW5kaW5nRGVmaW5lID0gJ0VOVk1BUF9CTEVORElOR19BREQnO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIE11bHRpcGx5T3BlcmF0aW9uOlxuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIGVudk1hcEJsZW5kaW5nRGVmaW5lID0gJ0VOVk1BUF9CTEVORElOR19NVUxUSVBMWSc7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuZGVmaW5lc1tlbnZNYXBUeXBlRGVmaW5lXSA9ICcnO1xuICAgICAgdGhpcy5kZWZpbmVzW2Vudk1hcEJsZW5kaW5nRGVmaW5lXSA9ICcnO1xuICAgICAgdGhpcy5kZWZpbmVzW2Vudk1hcE1vZGVEZWZpbmVdID0gJyc7XG4gICAgfVxuICB9XG59XG5cbkJhc2VBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUgPSBPYmplY3QuYXNzaWduKE9iamVjdC5jcmVhdGUoU2hhZGVyTWF0ZXJpYWwucHJvdG90eXBlKSwge1xuICBjb25zdHJ1Y3RvcjogQmFzZUFuaW1hdGlvbk1hdGVyaWFsLFxuXG4gIHNldFVuaWZvcm1WYWx1ZXModmFsdWVzKSB7XG4gICAgaWYgKCF2YWx1ZXMpIHJldHVybjtcblxuICAgIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyh2YWx1ZXMpO1xuXG4gICAga2V5cy5mb3JFYWNoKChrZXkpID0+IHtcbiAgICAgIGtleSBpbiB0aGlzLnVuaWZvcm1zICYmICh0aGlzLnVuaWZvcm1zW2tleV0udmFsdWUgPSB2YWx1ZXNba2V5XSk7XG4gICAgfSk7XG4gIH0sXG5cbiAgc3RyaW5naWZ5Q2h1bmsobmFtZSkge1xuICAgIGxldCB2YWx1ZTtcblxuICAgIGlmICghdGhpc1tuYW1lXSkge1xuICAgICAgdmFsdWUgPSAnJztcbiAgICB9XG4gICAgZWxzZSBpZiAodHlwZW9mIHRoaXNbbmFtZV0gPT09ICAnc3RyaW5nJykge1xuICAgICAgdmFsdWUgPSB0aGlzW25hbWVdO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHZhbHVlID0gdGhpc1tuYW1lXS5qb2luKCdcXG4nKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cbn0pO1xuXG5leHBvcnQgZGVmYXVsdCBCYXNlQW5pbWF0aW9uTWF0ZXJpYWw7XG4iLCJpbXBvcnQgeyBTaGFkZXJMaWIgfSBmcm9tICd0aHJlZSc7XG5pbXBvcnQgQmFzZUFuaW1hdGlvbk1hdGVyaWFsIGZyb20gJy4vQmFzZUFuaW1hdGlvbk1hdGVyaWFsJztcblxuLyoqXG4gKiBFeHRlbmRzIFRIUkVFLk1lc2hCYXNpY01hdGVyaWFsIHdpdGggY3VzdG9tIHNoYWRlciBjaHVua3MuXG4gKlxuICogQHNlZSBodHRwOi8vdGhyZWUtYmFzLWV4YW1wbGVzLnN1cmdlLnNoL2V4YW1wbGVzL21hdGVyaWFsc19iYXNpYy9cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gcGFyYW1ldGVycyBPYmplY3QgY29udGFpbmluZyBtYXRlcmlhbCBwcm9wZXJ0aWVzIGFuZCBjdXN0b20gc2hhZGVyIGNodW5rcy5cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBCYXNpY0FuaW1hdGlvbk1hdGVyaWFsKHBhcmFtZXRlcnMpIHtcbiAgdGhpcy52YXJ5aW5nUGFyYW1ldGVycyA9IFtdO1xuICBcbiAgdGhpcy52ZXJ0ZXhQYXJhbWV0ZXJzID0gW107XG4gIHRoaXMudmVydGV4RnVuY3Rpb25zID0gW107XG4gIHRoaXMudmVydGV4SW5pdCA9IFtdO1xuICB0aGlzLnZlcnRleE5vcm1hbCA9IFtdO1xuICB0aGlzLnZlcnRleFBvc2l0aW9uID0gW107XG4gIHRoaXMudmVydGV4Q29sb3IgPSBbXTtcbiAgdGhpcy52ZXJ0ZXhQb3N0TW9ycGggPSBbXTtcbiAgdGhpcy52ZXJ0ZXhQb3N0U2tpbm5pbmcgPSBbXTtcblxuICB0aGlzLmZyYWdtZW50RnVuY3Rpb25zID0gW107XG4gIHRoaXMuZnJhZ21lbnRQYXJhbWV0ZXJzID0gW107XG4gIHRoaXMuZnJhZ21lbnRJbml0ID0gW107XG4gIHRoaXMuZnJhZ21lbnRNYXAgPSBbXTtcbiAgdGhpcy5mcmFnbWVudERpZmZ1c2UgPSBbXTtcbiAgXG4gIEJhc2VBbmltYXRpb25NYXRlcmlhbC5jYWxsKHRoaXMsIHBhcmFtZXRlcnMsIFNoYWRlckxpYlsnYmFzaWMnXS51bmlmb3Jtcyk7XG4gIFxuICB0aGlzLmxpZ2h0cyA9IGZhbHNlO1xuICB0aGlzLnZlcnRleFNoYWRlciA9IHRoaXMuY29uY2F0VmVydGV4U2hhZGVyKCk7XG4gIHRoaXMuZnJhZ21lbnRTaGFkZXIgPSB0aGlzLmNvbmNhdEZyYWdtZW50U2hhZGVyKCk7XG59XG5CYXNpY0FuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoQmFzZUFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZSk7XG5CYXNpY0FuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IEJhc2ljQW5pbWF0aW9uTWF0ZXJpYWw7XG5cbkJhc2ljQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlLmNvbmNhdFZlcnRleFNoYWRlciA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gYFxuICAjaW5jbHVkZSA8Y29tbW9uPlxuICAjaW5jbHVkZSA8dXZfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDx1djJfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxlbnZtYXBfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxjb2xvcl9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPGZvZ19wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPG1vcnBodGFyZ2V0X3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8c2tpbm5pbmdfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc19wYXJzX3ZlcnRleD5cbiAgXG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UGFyYW1ldGVycycpfVxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZhcnlpbmdQYXJhbWV0ZXJzJyl9XG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4RnVuY3Rpb25zJyl9XG4gIFxuICB2b2lkIG1haW4oKSB7XG5cbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleEluaXQnKX1cbiAgXG4gICAgI2luY2x1ZGUgPHV2X3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8dXYyX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8Y29sb3JfdmVydGV4PlxuICAgICNpbmNsdWRlIDxza2luYmFzZV92ZXJ0ZXg+XG4gIFxuICAgICNpZmRlZiBVU0VfRU5WTUFQXG4gIFxuICAgICNpbmNsdWRlIDxiZWdpbm5vcm1hbF92ZXJ0ZXg+XG4gICAgXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhOb3JtYWwnKX1cbiAgICBcbiAgICAjaW5jbHVkZSA8bW9ycGhub3JtYWxfdmVydGV4PlxuICAgICNpbmNsdWRlIDxza2lubm9ybWFsX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8ZGVmYXVsdG5vcm1hbF92ZXJ0ZXg+XG4gIFxuICAgICNlbmRpZlxuICBcbiAgICAjaW5jbHVkZSA8YmVnaW5fdmVydGV4PlxuICAgIFxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UG9zaXRpb24nKX1cbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleENvbG9yJyl9XG4gICAgXG4gICAgI2luY2x1ZGUgPG1vcnBodGFyZ2V0X3ZlcnRleD5cbiAgICBcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBvc3RNb3JwaCcpfVxuICAgIFxuICAgICNpbmNsdWRlIDxza2lubmluZ192ZXJ0ZXg+XG5cbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBvc3RTa2lubmluZycpfVxuXG4gICAgI2luY2x1ZGUgPHByb2plY3RfdmVydGV4PlxuICAgICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl92ZXJ0ZXg+XG4gIFxuICAgICNpbmNsdWRlIDx3b3JsZHBvc192ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc192ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPGVudm1hcF92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPGZvZ192ZXJ0ZXg+XG4gIH1gO1xufTtcblxuQmFzaWNBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uY2F0RnJhZ21lbnRTaGFkZXIgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIGBcbiAgdW5pZm9ybSB2ZWMzIGRpZmZ1c2U7XG4gIHVuaWZvcm0gZmxvYXQgb3BhY2l0eTtcbiAgXG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRQYXJhbWV0ZXJzJyl9XG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmFyeWluZ1BhcmFtZXRlcnMnKX1cbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudEZ1bmN0aW9ucycpfVxuICBcbiAgI2lmbmRlZiBGTEFUX1NIQURFRFxuICBcbiAgICB2YXJ5aW5nIHZlYzMgdk5vcm1hbDtcbiAgXG4gICNlbmRpZlxuICBcbiAgI2luY2x1ZGUgPGNvbW1vbj5cbiAgI2luY2x1ZGUgPGNvbG9yX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDx1dl9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8dXYyX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxtYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGFscGhhbWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxhb21hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8bGlnaHRtYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGVudm1hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8Zm9nX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxzcGVjdWxhcm1hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc19wYXJzX2ZyYWdtZW50PlxuICBcbiAgdm9pZCBtYWluKCkge1xuICBcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50SW5pdCcpfVxuICBcbiAgICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX2ZyYWdtZW50PlxuXG4gICAgdmVjNCBkaWZmdXNlQ29sb3IgPSB2ZWM0KCBkaWZmdXNlLCBvcGFjaXR5ICk7XG5cbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50RGlmZnVzZScpfVxuICBcbiAgICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfZnJhZ21lbnQ+XG4gICAgXG4gICAgJHsodGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRNYXAnKSB8fCAnI2luY2x1ZGUgPG1hcF9mcmFnbWVudD4nKX1cbiAgICBcbiAgICAjaW5jbHVkZSA8Y29sb3JfZnJhZ21lbnQ+XG4gICAgI2luY2x1ZGUgPGFscGhhbWFwX2ZyYWdtZW50PlxuICAgICNpbmNsdWRlIDxhbHBoYXRlc3RfZnJhZ21lbnQ+XG4gICAgI2luY2x1ZGUgPHNwZWN1bGFybWFwX2ZyYWdtZW50PlxuICBcbiAgICBSZWZsZWN0ZWRMaWdodCByZWZsZWN0ZWRMaWdodCA9IFJlZmxlY3RlZExpZ2h0KCB2ZWMzKCAwLjAgKSwgdmVjMyggMC4wICksIHZlYzMoIDAuMCApLCB2ZWMzKCAwLjAgKSApO1xuICBcbiAgICAvLyBhY2N1bXVsYXRpb24gKGJha2VkIGluZGlyZWN0IGxpZ2h0aW5nIG9ubHkpXG4gICAgI2lmZGVmIFVTRV9MSUdIVE1BUFxuICBcbiAgICAgIHJlZmxlY3RlZExpZ2h0LmluZGlyZWN0RGlmZnVzZSArPSB0ZXh0dXJlMkQoIGxpZ2h0TWFwLCB2VXYyICkueHl6ICogbGlnaHRNYXBJbnRlbnNpdHk7XG4gIFxuICAgICNlbHNlXG4gIFxuICAgICAgcmVmbGVjdGVkTGlnaHQuaW5kaXJlY3REaWZmdXNlICs9IHZlYzMoIDEuMCApO1xuICBcbiAgICAjZW5kaWZcbiAgXG4gICAgLy8gbW9kdWxhdGlvblxuICAgICNpbmNsdWRlIDxhb21hcF9mcmFnbWVudD5cbiAgXG4gICAgcmVmbGVjdGVkTGlnaHQuaW5kaXJlY3REaWZmdXNlICo9IGRpZmZ1c2VDb2xvci5yZ2I7XG4gIFxuICAgIHZlYzMgb3V0Z29pbmdMaWdodCA9IHJlZmxlY3RlZExpZ2h0LmluZGlyZWN0RGlmZnVzZTtcbiAgXG4gICAgI2luY2x1ZGUgPGVudm1hcF9mcmFnbWVudD5cbiAgXG4gICAgZ2xfRnJhZ0NvbG9yID0gdmVjNCggb3V0Z29pbmdMaWdodCwgZGlmZnVzZUNvbG9yLmEgKTtcbiAgXG4gICAgI2luY2x1ZGUgPHByZW11bHRpcGxpZWRfYWxwaGFfZnJhZ21lbnQ+XG4gICAgI2luY2x1ZGUgPHRvbmVtYXBwaW5nX2ZyYWdtZW50PlxuICAgICNpbmNsdWRlIDxlbmNvZGluZ3NfZnJhZ21lbnQ+XG4gICAgI2luY2x1ZGUgPGZvZ19mcmFnbWVudD5cbiAgfWA7XG59O1xuXG5leHBvcnQgeyBCYXNpY0FuaW1hdGlvbk1hdGVyaWFsIH07XG4iLCJpbXBvcnQgeyBTaGFkZXJMaWIgfSBmcm9tICd0aHJlZSc7XG5pbXBvcnQgQmFzZUFuaW1hdGlvbk1hdGVyaWFsIGZyb20gJy4vQmFzZUFuaW1hdGlvbk1hdGVyaWFsJztcblxuLyoqXG4gKiBFeHRlbmRzIFRIUkVFLk1lc2hMYW1iZXJ0TWF0ZXJpYWwgd2l0aCBjdXN0b20gc2hhZGVyIGNodW5rcy5cbiAqXG4gKiBAc2VlIGh0dHA6Ly90aHJlZS1iYXMtZXhhbXBsZXMuc3VyZ2Uuc2gvZXhhbXBsZXMvbWF0ZXJpYWxzX2xhbWJlcnQvXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IHBhcmFtZXRlcnMgT2JqZWN0IGNvbnRhaW5pbmcgbWF0ZXJpYWwgcHJvcGVydGllcyBhbmQgY3VzdG9tIHNoYWRlciBjaHVua3MuXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gTGFtYmVydEFuaW1hdGlvbk1hdGVyaWFsKHBhcmFtZXRlcnMpIHtcbiAgdGhpcy52YXJ5aW5nUGFyYW1ldGVycyA9IFtdO1xuICBcbiAgdGhpcy52ZXJ0ZXhGdW5jdGlvbnMgPSBbXTtcbiAgdGhpcy52ZXJ0ZXhQYXJhbWV0ZXJzID0gW107XG4gIHRoaXMudmVydGV4SW5pdCA9IFtdO1xuICB0aGlzLnZlcnRleE5vcm1hbCA9IFtdO1xuICB0aGlzLnZlcnRleFBvc2l0aW9uID0gW107XG4gIHRoaXMudmVydGV4Q29sb3IgPSBbXTtcbiAgdGhpcy52ZXJ0ZXhQb3N0TW9ycGggPSBbXTtcbiAgdGhpcy52ZXJ0ZXhQb3N0U2tpbm5pbmcgPSBbXTtcbiAgXG4gIHRoaXMuZnJhZ21lbnRGdW5jdGlvbnMgPSBbXTtcbiAgdGhpcy5mcmFnbWVudFBhcmFtZXRlcnMgPSBbXTtcbiAgdGhpcy5mcmFnbWVudEluaXQgPSBbXTtcbiAgdGhpcy5mcmFnbWVudE1hcCA9IFtdO1xuICB0aGlzLmZyYWdtZW50RGlmZnVzZSA9IFtdO1xuICB0aGlzLmZyYWdtZW50RW1pc3NpdmUgPSBbXTtcbiAgdGhpcy5mcmFnbWVudFNwZWN1bGFyID0gW107XG4gIFxuICBCYXNlQW5pbWF0aW9uTWF0ZXJpYWwuY2FsbCh0aGlzLCBwYXJhbWV0ZXJzLCBTaGFkZXJMaWJbJ2xhbWJlcnQnXS51bmlmb3Jtcyk7XG4gIFxuICB0aGlzLmxpZ2h0cyA9IHRydWU7XG4gIHRoaXMudmVydGV4U2hhZGVyID0gdGhpcy5jb25jYXRWZXJ0ZXhTaGFkZXIoKTtcbiAgdGhpcy5mcmFnbWVudFNoYWRlciA9IHRoaXMuY29uY2F0RnJhZ21lbnRTaGFkZXIoKTtcbn1cbkxhbWJlcnRBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEJhc2VBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUpO1xuTGFtYmVydEFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IExhbWJlcnRBbmltYXRpb25NYXRlcmlhbDtcblxuTGFtYmVydEFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZS5jb25jYXRWZXJ0ZXhTaGFkZXIgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiBgXG4gICNkZWZpbmUgTEFNQkVSVFxuXG4gIHZhcnlpbmcgdmVjMyB2TGlnaHRGcm9udDtcbiAgXG4gICNpZmRlZiBET1VCTEVfU0lERURcbiAgXG4gICAgdmFyeWluZyB2ZWMzIHZMaWdodEJhY2s7XG4gIFxuICAjZW5kaWZcbiAgXG4gICNpbmNsdWRlIDxjb21tb24+XG4gICNpbmNsdWRlIDx1dl9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPHV2Ml9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPGVudm1hcF9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPGJzZGZzPlxuICAjaW5jbHVkZSA8bGlnaHRzX3BhcnNfYmVnaW4+XG4gICNpbmNsdWRlIDxlbnZtYXBfcGh5c2ljYWxfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGNvbG9yX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8Zm9nX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8bW9ycGh0YXJnZXRfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxza2lubmluZ19wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPHNoYWRvd21hcF9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPGxvZ2RlcHRoYnVmX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX3BhcnNfdmVydGV4PlxuICBcbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQYXJhbWV0ZXJzJyl9XG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmFyeWluZ1BhcmFtZXRlcnMnKX1cbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhGdW5jdGlvbnMnKX1cbiAgXG4gIHZvaWQgbWFpbigpIHtcbiAgXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhJbml0Jyl9XG4gIFxuICAgICNpbmNsdWRlIDx1dl92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPHV2Ml92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPGNvbG9yX3ZlcnRleD5cbiAgXG4gICAgI2luY2x1ZGUgPGJlZ2lubm9ybWFsX3ZlcnRleD5cbiAgICBcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleE5vcm1hbCcpfVxuICAgIFxuICAgICNpbmNsdWRlIDxtb3JwaG5vcm1hbF92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPHNraW5iYXNlX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8c2tpbm5vcm1hbF92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPGRlZmF1bHRub3JtYWxfdmVydGV4PlxuICBcbiAgICAjaW5jbHVkZSA8YmVnaW5fdmVydGV4PlxuICAgIFxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UG9zaXRpb24nKX1cbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleENvbG9yJyl9XG4gICAgXG4gICAgI2luY2x1ZGUgPG1vcnBodGFyZ2V0X3ZlcnRleD5cbiAgICBcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBvc3RNb3JwaCcpfVxuICAgIFxuICAgICNpbmNsdWRlIDxza2lubmluZ192ZXJ0ZXg+XG5cbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBvc3RTa2lubmluZycpfVxuICAgIFxuICAgICNpbmNsdWRlIDxwcm9qZWN0X3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfdmVydGV4PlxuICAgICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfdmVydGV4PlxuICBcbiAgICAjaW5jbHVkZSA8d29ybGRwb3NfdmVydGV4PlxuICAgICNpbmNsdWRlIDxlbnZtYXBfdmVydGV4PlxuICAgICNpbmNsdWRlIDxsaWdodHNfbGFtYmVydF92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPHNoYWRvd21hcF92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPGZvZ192ZXJ0ZXg+XG4gIH1gO1xufTtcblxuTGFtYmVydEFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZS5jb25jYXRGcmFnbWVudFNoYWRlciA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIGBcbiAgdW5pZm9ybSB2ZWMzIGRpZmZ1c2U7XG4gIHVuaWZvcm0gdmVjMyBlbWlzc2l2ZTtcbiAgdW5pZm9ybSBmbG9hdCBvcGFjaXR5O1xuICBcbiAgdmFyeWluZyB2ZWMzIHZMaWdodEZyb250O1xuICBcbiAgI2lmZGVmIERPVUJMRV9TSURFRFxuICBcbiAgICB2YXJ5aW5nIHZlYzMgdkxpZ2h0QmFjaztcbiAgXG4gICNlbmRpZlxuICBcbiAgI2luY2x1ZGUgPGNvbW1vbj5cbiAgI2luY2x1ZGUgPHBhY2tpbmc+XG4gICNpbmNsdWRlIDxkaXRoZXJpbmdfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGNvbG9yX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDx1dl9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8dXYyX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxtYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGFscGhhbWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxhb21hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8bGlnaHRtYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGVtaXNzaXZlbWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxlbnZtYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGJzZGZzPlxuICAjaW5jbHVkZSA8bGlnaHRzX3BhcnNfYmVnaW4+XG4gICNpbmNsdWRlIDxlbnZtYXBfcGh5c2ljYWxfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGZvZ19wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8c2hhZG93bWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxzaGFkb3dtYXNrX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxzcGVjdWxhcm1hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc19wYXJzX2ZyYWdtZW50PlxuICBcbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudFBhcmFtZXRlcnMnKX1cbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2YXJ5aW5nUGFyYW1ldGVycycpfVxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50RnVuY3Rpb25zJyl9XG4gIFxuICB2b2lkIG1haW4oKSB7XG4gIFxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRJbml0Jyl9XG4gIFxuICAgICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfZnJhZ21lbnQ+XG5cbiAgICB2ZWM0IGRpZmZ1c2VDb2xvciA9IHZlYzQoIGRpZmZ1c2UsIG9wYWNpdHkgKTtcbiAgICBSZWZsZWN0ZWRMaWdodCByZWZsZWN0ZWRMaWdodCA9IFJlZmxlY3RlZExpZ2h0KCB2ZWMzKCAwLjAgKSwgdmVjMyggMC4wICksIHZlYzMoIDAuMCApLCB2ZWMzKCAwLjAgKSApO1xuICAgIHZlYzMgdG90YWxFbWlzc2l2ZVJhZGlhbmNlID0gZW1pc3NpdmU7XG5cdFxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnREaWZmdXNlJyl9XG4gIFxuICAgICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl9mcmFnbWVudD5cblxuICAgICR7KHRoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50TWFwJykgfHwgJyNpbmNsdWRlIDxtYXBfZnJhZ21lbnQ+Jyl9XG5cbiAgICAjaW5jbHVkZSA8Y29sb3JfZnJhZ21lbnQ+XG4gICAgI2luY2x1ZGUgPGFscGhhbWFwX2ZyYWdtZW50PlxuICAgICNpbmNsdWRlIDxhbHBoYXRlc3RfZnJhZ21lbnQ+XG4gICAgI2luY2x1ZGUgPHNwZWN1bGFybWFwX2ZyYWdtZW50PlxuXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudEVtaXNzaXZlJyl9XG5cbiAgICAjaW5jbHVkZSA8ZW1pc3NpdmVtYXBfZnJhZ21lbnQ+XG4gIFxuICAgIC8vIGFjY3VtdWxhdGlvblxuICAgIHJlZmxlY3RlZExpZ2h0LmluZGlyZWN0RGlmZnVzZSA9IGdldEFtYmllbnRMaWdodElycmFkaWFuY2UoIGFtYmllbnRMaWdodENvbG9yICk7XG4gIFxuICAgICNpbmNsdWRlIDxsaWdodG1hcF9mcmFnbWVudD5cbiAgXG4gICAgcmVmbGVjdGVkTGlnaHQuaW5kaXJlY3REaWZmdXNlICo9IEJSREZfRGlmZnVzZV9MYW1iZXJ0KCBkaWZmdXNlQ29sb3IucmdiICk7XG4gIFxuICAgICNpZmRlZiBET1VCTEVfU0lERURcbiAgXG4gICAgICByZWZsZWN0ZWRMaWdodC5kaXJlY3REaWZmdXNlID0gKCBnbF9Gcm9udEZhY2luZyApID8gdkxpZ2h0RnJvbnQgOiB2TGlnaHRCYWNrO1xuICBcbiAgICAjZWxzZVxuICBcbiAgICAgIHJlZmxlY3RlZExpZ2h0LmRpcmVjdERpZmZ1c2UgPSB2TGlnaHRGcm9udDtcbiAgXG4gICAgI2VuZGlmXG4gIFxuICAgIHJlZmxlY3RlZExpZ2h0LmRpcmVjdERpZmZ1c2UgKj0gQlJERl9EaWZmdXNlX0xhbWJlcnQoIGRpZmZ1c2VDb2xvci5yZ2IgKSAqIGdldFNoYWRvd01hc2soKTtcbiAgXG4gICAgLy8gbW9kdWxhdGlvblxuICAgICNpbmNsdWRlIDxhb21hcF9mcmFnbWVudD5cbiAgXG4gICAgdmVjMyBvdXRnb2luZ0xpZ2h0ID0gcmVmbGVjdGVkTGlnaHQuZGlyZWN0RGlmZnVzZSArIHJlZmxlY3RlZExpZ2h0LmluZGlyZWN0RGlmZnVzZSArIHRvdGFsRW1pc3NpdmVSYWRpYW5jZTtcbiAgXG4gICAgI2luY2x1ZGUgPGVudm1hcF9mcmFnbWVudD5cbiAgXG4gICAgZ2xfRnJhZ0NvbG9yID0gdmVjNCggb3V0Z29pbmdMaWdodCwgZGlmZnVzZUNvbG9yLmEgKTtcbiAgXG4gICAgI2luY2x1ZGUgPHRvbmVtYXBwaW5nX2ZyYWdtZW50PlxuICAgICNpbmNsdWRlIDxlbmNvZGluZ3NfZnJhZ21lbnQ+XG4gICAgI2luY2x1ZGUgPGZvZ19mcmFnbWVudD5cbiAgICAjaW5jbHVkZSA8cHJlbXVsdGlwbGllZF9hbHBoYV9mcmFnbWVudD5cbiAgICAjaW5jbHVkZSA8ZGl0aGVyaW5nX2ZyYWdtZW50PlxuICB9YDtcbn07XG5cbmV4cG9ydCB7IExhbWJlcnRBbmltYXRpb25NYXRlcmlhbCB9O1xuIiwiaW1wb3J0IHsgU2hhZGVyTGliIH0gZnJvbSAndGhyZWUnO1xuaW1wb3J0IEJhc2VBbmltYXRpb25NYXRlcmlhbCBmcm9tICcuL0Jhc2VBbmltYXRpb25NYXRlcmlhbCc7XG5cbi8qKlxuICogRXh0ZW5kcyBUSFJFRS5NZXNoUGhvbmdNYXRlcmlhbCB3aXRoIGN1c3RvbSBzaGFkZXIgY2h1bmtzLlxuICpcbiAqIEBzZWUgaHR0cDovL3RocmVlLWJhcy1leGFtcGxlcy5zdXJnZS5zaC9leGFtcGxlcy9tYXRlcmlhbHNfcGhvbmcvXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IHBhcmFtZXRlcnMgT2JqZWN0IGNvbnRhaW5pbmcgbWF0ZXJpYWwgcHJvcGVydGllcyBhbmQgY3VzdG9tIHNoYWRlciBjaHVua3MuXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gUGhvbmdBbmltYXRpb25NYXRlcmlhbChwYXJhbWV0ZXJzKSB7XG4gIHRoaXMudmFyeWluZ1BhcmFtZXRlcnMgPSBbXTtcblxuICB0aGlzLnZlcnRleEZ1bmN0aW9ucyA9IFtdO1xuICB0aGlzLnZlcnRleFBhcmFtZXRlcnMgPSBbXTtcbiAgdGhpcy52ZXJ0ZXhJbml0ID0gW107XG4gIHRoaXMudmVydGV4Tm9ybWFsID0gW107XG4gIHRoaXMudmVydGV4UG9zaXRpb24gPSBbXTtcbiAgdGhpcy52ZXJ0ZXhDb2xvciA9IFtdO1xuXG4gIHRoaXMuZnJhZ21lbnRGdW5jdGlvbnMgPSBbXTtcbiAgdGhpcy5mcmFnbWVudFBhcmFtZXRlcnMgPSBbXTtcbiAgdGhpcy5mcmFnbWVudEluaXQgPSBbXTtcbiAgdGhpcy5mcmFnbWVudE1hcCA9IFtdO1xuICB0aGlzLmZyYWdtZW50RGlmZnVzZSA9IFtdO1xuICB0aGlzLmZyYWdtZW50RW1pc3NpdmUgPSBbXTtcbiAgdGhpcy5mcmFnbWVudFNwZWN1bGFyID0gW107XG5cbiAgQmFzZUFuaW1hdGlvbk1hdGVyaWFsLmNhbGwodGhpcywgcGFyYW1ldGVycywgU2hhZGVyTGliWydwaG9uZyddLnVuaWZvcm1zKTtcblxuICB0aGlzLmxpZ2h0cyA9IHRydWU7XG4gIHRoaXMudmVydGV4U2hhZGVyID0gdGhpcy5jb25jYXRWZXJ0ZXhTaGFkZXIoKTtcbiAgdGhpcy5mcmFnbWVudFNoYWRlciA9IHRoaXMuY29uY2F0RnJhZ21lbnRTaGFkZXIoKTtcbn1cblBob25nQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShCYXNlQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlKTtcblBob25nQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gUGhvbmdBbmltYXRpb25NYXRlcmlhbDtcblxuUGhvbmdBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uY2F0VmVydGV4U2hhZGVyID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gYFxuICAjZGVmaW5lIFBIT05HXG5cbiAgdmFyeWluZyB2ZWMzIHZWaWV3UG9zaXRpb247XG5cbiAgI2lmbmRlZiBGTEFUX1NIQURFRFxuXG4gICAgdmFyeWluZyB2ZWMzIHZOb3JtYWw7XG5cbiAgI2VuZGlmXG5cbiAgI2luY2x1ZGUgPGNvbW1vbj5cbiAgI2luY2x1ZGUgPHV2X3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8dXYyX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8ZGlzcGxhY2VtZW50bWFwX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8ZW52bWFwX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8Y29sb3JfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxmb2dfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxtb3JwaHRhcmdldF9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPHNraW5uaW5nX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8c2hhZG93bWFwX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfcGFyc192ZXJ0ZXg+XG5cbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQYXJhbWV0ZXJzJyl9XG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmFyeWluZ1BhcmFtZXRlcnMnKX1cbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhGdW5jdGlvbnMnKX1cblxuICB2b2lkIG1haW4oKSB7XG5cbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleEluaXQnKX1cblxuICAgICNpbmNsdWRlIDx1dl92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPHV2Ml92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPGNvbG9yX3ZlcnRleD5cblxuICAgICNpbmNsdWRlIDxiZWdpbm5vcm1hbF92ZXJ0ZXg+XG5cbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleE5vcm1hbCcpfVxuXG4gICAgI2luY2x1ZGUgPG1vcnBobm9ybWFsX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8c2tpbmJhc2VfdmVydGV4PlxuICAgICNpbmNsdWRlIDxza2lubm9ybWFsX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8ZGVmYXVsdG5vcm1hbF92ZXJ0ZXg+XG5cbiAgI2lmbmRlZiBGTEFUX1NIQURFRCAvLyBOb3JtYWwgY29tcHV0ZWQgd2l0aCBkZXJpdmF0aXZlcyB3aGVuIEZMQVRfU0hBREVEXG5cbiAgICB2Tm9ybWFsID0gbm9ybWFsaXplKCB0cmFuc2Zvcm1lZE5vcm1hbCApO1xuXG4gICNlbmRpZlxuXG4gICAgI2luY2x1ZGUgPGJlZ2luX3ZlcnRleD5cblxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UG9zaXRpb24nKX1cbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleENvbG9yJyl9XG5cbiAgICAjaW5jbHVkZSA8bW9ycGh0YXJnZXRfdmVydGV4PlxuICAgICNpbmNsdWRlIDxza2lubmluZ192ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPGRpc3BsYWNlbWVudG1hcF92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPHByb2plY3RfdmVydGV4PlxuICAgICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc192ZXJ0ZXg+XG5cbiAgICB2Vmlld1Bvc2l0aW9uID0gLSBtdlBvc2l0aW9uLnh5ejtcblxuICAgICNpbmNsdWRlIDx3b3JsZHBvc192ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPGVudm1hcF92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPHNoYWRvd21hcF92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPGZvZ192ZXJ0ZXg+XG4gIH1gO1xufTtcblxuUGhvbmdBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uY2F0RnJhZ21lbnRTaGFkZXIgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiBgXG4gICNkZWZpbmUgUEhPTkdcblxuICB1bmlmb3JtIHZlYzMgZGlmZnVzZTtcbiAgdW5pZm9ybSB2ZWMzIGVtaXNzaXZlO1xuICB1bmlmb3JtIHZlYzMgc3BlY3VsYXI7XG4gIHVuaWZvcm0gZmxvYXQgc2hpbmluZXNzO1xuICB1bmlmb3JtIGZsb2F0IG9wYWNpdHk7XG5cbiAgI2luY2x1ZGUgPGNvbW1vbj5cbiAgI2luY2x1ZGUgPHBhY2tpbmc+XG4gICNpbmNsdWRlIDxkaXRoZXJpbmdfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGNvbG9yX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDx1dl9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8dXYyX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxtYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGFscGhhbWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxhb21hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8bGlnaHRtYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGVtaXNzaXZlbWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxlbnZtYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGdyYWRpZW50bWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxmb2dfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGJzZGZzPlxuICAjaW5jbHVkZSA8bGlnaHRzX3BhcnNfYmVnaW4+XG4gICNpbmNsdWRlIDxlbnZtYXBfcGh5c2ljYWxfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGxpZ2h0c19waG9uZ19wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8c2hhZG93bWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxidW1wbWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxub3JtYWxtYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPHNwZWN1bGFybWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX3BhcnNfZnJhZ21lbnQ+XG5cbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudFBhcmFtZXRlcnMnKX1cbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2YXJ5aW5nUGFyYW1ldGVycycpfVxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50RnVuY3Rpb25zJyl9XG5cbiAgdm9pZCBtYWluKCkge1xuXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudEluaXQnKX1cblxuICAgICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfZnJhZ21lbnQ+XG5cbiAgICB2ZWM0IGRpZmZ1c2VDb2xvciA9IHZlYzQoIGRpZmZ1c2UsIG9wYWNpdHkgKTtcbiAgICBSZWZsZWN0ZWRMaWdodCByZWZsZWN0ZWRMaWdodCA9IFJlZmxlY3RlZExpZ2h0KCB2ZWMzKCAwLjAgKSwgdmVjMyggMC4wICksIHZlYzMoIDAuMCApLCB2ZWMzKCAwLjAgKSApO1xuICAgIHZlYzMgdG90YWxFbWlzc2l2ZVJhZGlhbmNlID0gZW1pc3NpdmU7XG5cbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50RGlmZnVzZScpfVxuXG4gICAgI2luY2x1ZGUgPGxvZ2RlcHRoYnVmX2ZyYWdtZW50PlxuXG4gICAgJHsodGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRNYXAnKSB8fCAnI2luY2x1ZGUgPG1hcF9mcmFnbWVudD4nKX1cblxuICAgICNpbmNsdWRlIDxjb2xvcl9mcmFnbWVudD5cbiAgICAjaW5jbHVkZSA8YWxwaGFtYXBfZnJhZ21lbnQ+XG4gICAgI2luY2x1ZGUgPGFscGhhdGVzdF9mcmFnbWVudD5cbiAgICAjaW5jbHVkZSA8c3BlY3VsYXJtYXBfZnJhZ21lbnQ+XG4gICAgI2luY2x1ZGUgPG5vcm1hbF9mcmFnbWVudF9iZWdpbj5cbiAgICAjaW5jbHVkZSA8bm9ybWFsX2ZyYWdtZW50X21hcHM+XG5cbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50RW1pc3NpdmUnKX1cblxuICAgICNpbmNsdWRlIDxlbWlzc2l2ZW1hcF9mcmFnbWVudD5cblxuICAgIC8vIGFjY3VtdWxhdGlvblxuICAgICNpbmNsdWRlIDxsaWdodHNfcGhvbmdfZnJhZ21lbnQ+XG4gICAgI2luY2x1ZGUgPGxpZ2h0c19mcmFnbWVudF9iZWdpbj5cbiAgICAjaW5jbHVkZSA8bGlnaHRzX2ZyYWdtZW50X21hcHM+XG4gICAgI2luY2x1ZGUgPGxpZ2h0c19mcmFnbWVudF9lbmQ+XG5cbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50U3BlY3VsYXInKX1cblxuICAgIC8vIG1vZHVsYXRpb25cbiAgICAjaW5jbHVkZSA8YW9tYXBfZnJhZ21lbnQ+XG5cbiAgICB2ZWMzIG91dGdvaW5nTGlnaHQgPSByZWZsZWN0ZWRMaWdodC5kaXJlY3REaWZmdXNlICsgcmVmbGVjdGVkTGlnaHQuaW5kaXJlY3REaWZmdXNlICsgcmVmbGVjdGVkTGlnaHQuZGlyZWN0U3BlY3VsYXIgKyByZWZsZWN0ZWRMaWdodC5pbmRpcmVjdFNwZWN1bGFyICsgdG90YWxFbWlzc2l2ZVJhZGlhbmNlO1xuXG4gICAgI2luY2x1ZGUgPGVudm1hcF9mcmFnbWVudD5cblxuICAgIGdsX0ZyYWdDb2xvciA9IHZlYzQoIG91dGdvaW5nTGlnaHQsIGRpZmZ1c2VDb2xvci5hICk7XG5cbiAgICAjaW5jbHVkZSA8dG9uZW1hcHBpbmdfZnJhZ21lbnQ+XG4gICAgI2luY2x1ZGUgPGVuY29kaW5nc19mcmFnbWVudD5cbiAgICAjaW5jbHVkZSA8Zm9nX2ZyYWdtZW50PlxuICAgICNpbmNsdWRlIDxwcmVtdWx0aXBsaWVkX2FscGhhX2ZyYWdtZW50PlxuICAgICNpbmNsdWRlIDxkaXRoZXJpbmdfZnJhZ21lbnQ+XG5cbiAgfWA7XG59O1xuXG5leHBvcnQgeyBQaG9uZ0FuaW1hdGlvbk1hdGVyaWFsIH07XG4iLCJpbXBvcnQgeyBTaGFkZXJMaWIgfSBmcm9tICd0aHJlZSc7XG5pbXBvcnQgQmFzZUFuaW1hdGlvbk1hdGVyaWFsIGZyb20gJy4vQmFzZUFuaW1hdGlvbk1hdGVyaWFsJztcblxuLyoqXG4gKiBFeHRlbmRzIFRIUkVFLk1lc2hTdGFuZGFyZE1hdGVyaWFsIHdpdGggY3VzdG9tIHNoYWRlciBjaHVua3MuXG4gKlxuICogQHNlZSBodHRwOi8vdGhyZWUtYmFzLWV4YW1wbGVzLnN1cmdlLnNoL2V4YW1wbGVzL21hdGVyaWFsc19zdGFuZGFyZC9cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gcGFyYW1ldGVycyBPYmplY3QgY29udGFpbmluZyBtYXRlcmlhbCBwcm9wZXJ0aWVzIGFuZCBjdXN0b20gc2hhZGVyIGNodW5rcy5cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBTdGFuZGFyZEFuaW1hdGlvbk1hdGVyaWFsKHBhcmFtZXRlcnMpIHtcbiAgdGhpcy52YXJ5aW5nUGFyYW1ldGVycyA9IFtdO1xuXG4gIHRoaXMudmVydGV4RnVuY3Rpb25zID0gW107XG4gIHRoaXMudmVydGV4UGFyYW1ldGVycyA9IFtdO1xuICB0aGlzLnZlcnRleEluaXQgPSBbXTtcbiAgdGhpcy52ZXJ0ZXhOb3JtYWwgPSBbXTtcbiAgdGhpcy52ZXJ0ZXhQb3NpdGlvbiA9IFtdO1xuICB0aGlzLnZlcnRleENvbG9yID0gW107XG4gIHRoaXMudmVydGV4UG9zdE1vcnBoID0gW107XG4gIHRoaXMudmVydGV4UG9zdFNraW5uaW5nID0gW107XG5cbiAgdGhpcy5mcmFnbWVudEZ1bmN0aW9ucyA9IFtdO1xuICB0aGlzLmZyYWdtZW50UGFyYW1ldGVycyA9IFtdO1xuICB0aGlzLmZyYWdtZW50SW5pdCA9IFtdO1xuICB0aGlzLmZyYWdtZW50TWFwID0gW107XG4gIHRoaXMuZnJhZ21lbnREaWZmdXNlID0gW107XG4gIHRoaXMuZnJhZ21lbnRSb3VnaG5lc3MgPSBbXTtcbiAgdGhpcy5mcmFnbWVudE1ldGFsbmVzcyA9IFtdO1xuICB0aGlzLmZyYWdtZW50RW1pc3NpdmUgPSBbXTtcblxuICBCYXNlQW5pbWF0aW9uTWF0ZXJpYWwuY2FsbCh0aGlzLCBwYXJhbWV0ZXJzLCBTaGFkZXJMaWJbJ3N0YW5kYXJkJ10udW5pZm9ybXMpO1xuXG4gIHRoaXMubGlnaHRzID0gdHJ1ZTtcbiAgdGhpcy52ZXJ0ZXhTaGFkZXIgPSB0aGlzLmNvbmNhdFZlcnRleFNoYWRlcigpO1xuICB0aGlzLmZyYWdtZW50U2hhZGVyID0gdGhpcy5jb25jYXRGcmFnbWVudFNoYWRlcigpO1xufVxuU3RhbmRhcmRBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEJhc2VBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUpO1xuU3RhbmRhcmRBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBTdGFuZGFyZEFuaW1hdGlvbk1hdGVyaWFsO1xuXG5TdGFuZGFyZEFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZS5jb25jYXRWZXJ0ZXhTaGFkZXIgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiBgXG4gICNkZWZpbmUgUEhZU0lDQUxcblxuICB2YXJ5aW5nIHZlYzMgdlZpZXdQb3NpdGlvbjtcbiAgXG4gICNpZm5kZWYgRkxBVF9TSEFERURcbiAgXG4gICAgdmFyeWluZyB2ZWMzIHZOb3JtYWw7XG4gIFxuICAjZW5kaWZcbiAgXG4gICNpbmNsdWRlIDxjb21tb24+XG4gICNpbmNsdWRlIDx1dl9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPHV2Ml9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPGRpc3BsYWNlbWVudG1hcF9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPGNvbG9yX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8Zm9nX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8bW9ycGh0YXJnZXRfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxza2lubmluZ19wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPHNoYWRvd21hcF9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPGxvZ2RlcHRoYnVmX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX3BhcnNfdmVydGV4PlxuICBcbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQYXJhbWV0ZXJzJyl9XG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmFyeWluZ1BhcmFtZXRlcnMnKX1cbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhGdW5jdGlvbnMnKX1cbiAgXG4gIHZvaWQgbWFpbigpIHtcblxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4SW5pdCcpfVxuXG4gICAgI2luY2x1ZGUgPHV2X3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8dXYyX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8Y29sb3JfdmVydGV4PlxuICBcbiAgICAjaW5jbHVkZSA8YmVnaW5ub3JtYWxfdmVydGV4PlxuICAgIFxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4Tm9ybWFsJyl9XG4gICAgXG4gICAgI2luY2x1ZGUgPG1vcnBobm9ybWFsX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8c2tpbmJhc2VfdmVydGV4PlxuICAgICNpbmNsdWRlIDxza2lubm9ybWFsX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8ZGVmYXVsdG5vcm1hbF92ZXJ0ZXg+XG4gIFxuICAjaWZuZGVmIEZMQVRfU0hBREVEIC8vIE5vcm1hbCBjb21wdXRlZCB3aXRoIGRlcml2YXRpdmVzIHdoZW4gRkxBVF9TSEFERURcbiAgXG4gICAgdk5vcm1hbCA9IG5vcm1hbGl6ZSggdHJhbnNmb3JtZWROb3JtYWwgKTtcbiAgXG4gICNlbmRpZlxuICBcbiAgICAjaW5jbHVkZSA8YmVnaW5fdmVydGV4PlxuICAgIFxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UG9zaXRpb24nKX1cbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleENvbG9yJyl9XG4gICAgXG4gICAgI2luY2x1ZGUgPG1vcnBodGFyZ2V0X3ZlcnRleD5cbiAgICBcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBvc3RNb3JwaCcpfVxuICAgIFxuICAgICNpbmNsdWRlIDxza2lubmluZ192ZXJ0ZXg+XG5cbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBvc3RTa2lubmluZycpfVxuICAgIFxuICAgICNpbmNsdWRlIDxkaXNwbGFjZW1lbnRtYXBfdmVydGV4PlxuICAgICNpbmNsdWRlIDxwcm9qZWN0X3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfdmVydGV4PlxuICAgICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfdmVydGV4PlxuICBcbiAgICB2Vmlld1Bvc2l0aW9uID0gLSBtdlBvc2l0aW9uLnh5ejtcbiAgXG4gICAgI2luY2x1ZGUgPHdvcmxkcG9zX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8c2hhZG93bWFwX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8Zm9nX3ZlcnRleD5cbiAgfWA7XG59O1xuXG5TdGFuZGFyZEFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZS5jb25jYXRGcmFnbWVudFNoYWRlciA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIGBcbiAgI2RlZmluZSBQSFlTSUNBTFxuICBcbiAgdW5pZm9ybSB2ZWMzIGRpZmZ1c2U7XG4gIHVuaWZvcm0gdmVjMyBlbWlzc2l2ZTtcbiAgdW5pZm9ybSBmbG9hdCByb3VnaG5lc3M7XG4gIHVuaWZvcm0gZmxvYXQgbWV0YWxuZXNzO1xuICB1bmlmb3JtIGZsb2F0IG9wYWNpdHk7XG4gIFxuICAjaWZuZGVmIFNUQU5EQVJEXG4gICAgdW5pZm9ybSBmbG9hdCBjbGVhckNvYXQ7XG4gICAgdW5pZm9ybSBmbG9hdCBjbGVhckNvYXRSb3VnaG5lc3M7XG4gICNlbmRpZlxuICBcbiAgdmFyeWluZyB2ZWMzIHZWaWV3UG9zaXRpb247XG4gIFxuICAjaWZuZGVmIEZMQVRfU0hBREVEXG4gIFxuICAgIHZhcnlpbmcgdmVjMyB2Tm9ybWFsO1xuICBcbiAgI2VuZGlmXG4gIFxuICAjaW5jbHVkZSA8Y29tbW9uPlxuICAjaW5jbHVkZSA8cGFja2luZz5cbiAgI2luY2x1ZGUgPGRpdGhlcmluZ19wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8Y29sb3JfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPHV2X3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDx1djJfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPG1hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8YWxwaGFtYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGFvbWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxsaWdodG1hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8ZW1pc3NpdmVtYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGVudm1hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8Zm9nX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxic2Rmcz5cbiAgI2luY2x1ZGUgPGN1YmVfdXZfcmVmbGVjdGlvbl9mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGxpZ2h0c19wYXJzX2JlZ2luPlxuICAjaW5jbHVkZSA8ZW52bWFwX3BoeXNpY2FsX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxsaWdodHNfcGh5c2ljYWxfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPHNoYWRvd21hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8YnVtcG1hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8bm9ybWFsbWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxyb3VnaG5lc3NtYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPG1ldGFsbmVzc21hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc19wYXJzX2ZyYWdtZW50PlxuICBcbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudFBhcmFtZXRlcnMnKX1cbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2YXJ5aW5nUGFyYW1ldGVycycpfVxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50RnVuY3Rpb25zJyl9XG4gIFxuICB2b2lkIG1haW4oKSB7XG4gIFxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRJbml0Jyl9XG4gIFxuICAgICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfZnJhZ21lbnQ+XG4gIFxuICAgIHZlYzQgZGlmZnVzZUNvbG9yID0gdmVjNCggZGlmZnVzZSwgb3BhY2l0eSApO1xuICAgIFJlZmxlY3RlZExpZ2h0IHJlZmxlY3RlZExpZ2h0ID0gUmVmbGVjdGVkTGlnaHQoIHZlYzMoIDAuMCApLCB2ZWMzKCAwLjAgKSwgdmVjMyggMC4wICksIHZlYzMoIDAuMCApICk7XG4gICAgdmVjMyB0b3RhbEVtaXNzaXZlUmFkaWFuY2UgPSBlbWlzc2l2ZTtcbiAgXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudERpZmZ1c2UnKX1cbiAgXG4gICAgI2luY2x1ZGUgPGxvZ2RlcHRoYnVmX2ZyYWdtZW50PlxuXG4gICAgJHsodGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRNYXAnKSB8fCAnI2luY2x1ZGUgPG1hcF9mcmFnbWVudD4nKX1cblxuICAgICNpbmNsdWRlIDxjb2xvcl9mcmFnbWVudD5cbiAgICAjaW5jbHVkZSA8YWxwaGFtYXBfZnJhZ21lbnQ+XG4gICAgI2luY2x1ZGUgPGFscGhhdGVzdF9mcmFnbWVudD5cbiAgICBcbiAgICBmbG9hdCByb3VnaG5lc3NGYWN0b3IgPSByb3VnaG5lc3M7XG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudFJvdWdobmVzcycpfVxuICAgICNpZmRlZiBVU0VfUk9VR0hORVNTTUFQXG4gICAgXG4gICAgICB2ZWM0IHRleGVsUm91Z2huZXNzID0gdGV4dHVyZTJEKCByb3VnaG5lc3NNYXAsIHZVdiApO1xuICAgIFxuICAgICAgLy8gcmVhZHMgY2hhbm5lbCBHLCBjb21wYXRpYmxlIHdpdGggYSBjb21iaW5lZCBPY2NsdXNpb25Sb3VnaG5lc3NNZXRhbGxpYyAoUkdCKSB0ZXh0dXJlXG4gICAgICByb3VnaG5lc3NGYWN0b3IgKj0gdGV4ZWxSb3VnaG5lc3MuZztcbiAgICBcbiAgICAjZW5kaWZcbiAgICBcbiAgICBmbG9hdCBtZXRhbG5lc3NGYWN0b3IgPSBtZXRhbG5lc3M7XG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudE1ldGFsbmVzcycpfVxuICAgICNpZmRlZiBVU0VfTUVUQUxORVNTTUFQXG4gICAgXG4gICAgICB2ZWM0IHRleGVsTWV0YWxuZXNzID0gdGV4dHVyZTJEKCBtZXRhbG5lc3NNYXAsIHZVdiApO1xuICAgICAgbWV0YWxuZXNzRmFjdG9yICo9IHRleGVsTWV0YWxuZXNzLmI7XG4gICAgXG4gICAgI2VuZGlmXG4gICAgXG4gICAgI2luY2x1ZGUgPG5vcm1hbF9mcmFnbWVudF9iZWdpbj5cbiAgICAjaW5jbHVkZSA8bm9ybWFsX2ZyYWdtZW50X21hcHM+XG4gICAgXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudEVtaXNzaXZlJyl9XG4gICAgXG4gICAgI2luY2x1ZGUgPGVtaXNzaXZlbWFwX2ZyYWdtZW50PlxuICBcbiAgICAvLyBhY2N1bXVsYXRpb25cbiAgICAjaW5jbHVkZSA8bGlnaHRzX3BoeXNpY2FsX2ZyYWdtZW50PlxuICAgICNpbmNsdWRlIDxsaWdodHNfZnJhZ21lbnRfYmVnaW4+XG4gICAgI2luY2x1ZGUgPGxpZ2h0c19mcmFnbWVudF9tYXBzPlxuICAgICNpbmNsdWRlIDxsaWdodHNfZnJhZ21lbnRfZW5kPlxuICBcbiAgICAvLyBtb2R1bGF0aW9uXG4gICAgI2luY2x1ZGUgPGFvbWFwX2ZyYWdtZW50PlxuICBcbiAgICB2ZWMzIG91dGdvaW5nTGlnaHQgPSByZWZsZWN0ZWRMaWdodC5kaXJlY3REaWZmdXNlICsgcmVmbGVjdGVkTGlnaHQuaW5kaXJlY3REaWZmdXNlICsgcmVmbGVjdGVkTGlnaHQuZGlyZWN0U3BlY3VsYXIgKyByZWZsZWN0ZWRMaWdodC5pbmRpcmVjdFNwZWN1bGFyICsgdG90YWxFbWlzc2l2ZVJhZGlhbmNlO1xuICBcbiAgICBnbF9GcmFnQ29sb3IgPSB2ZWM0KCBvdXRnb2luZ0xpZ2h0LCBkaWZmdXNlQ29sb3IuYSApO1xuICBcbiAgICAjaW5jbHVkZSA8dG9uZW1hcHBpbmdfZnJhZ21lbnQ+XG4gICAgI2luY2x1ZGUgPGVuY29kaW5nc19mcmFnbWVudD5cbiAgICAjaW5jbHVkZSA8Zm9nX2ZyYWdtZW50PlxuICAgICNpbmNsdWRlIDxwcmVtdWx0aXBsaWVkX2FscGhhX2ZyYWdtZW50PlxuICAgICNpbmNsdWRlIDxkaXRoZXJpbmdfZnJhZ21lbnQ+XG4gIFxuICB9YDtcbn07XG5cbmV4cG9ydCB7IFN0YW5kYXJkQW5pbWF0aW9uTWF0ZXJpYWwgfTtcbiIsImltcG9ydCB7IFNoYWRlckxpYiB9IGZyb20gJ3RocmVlJztcbmltcG9ydCB7IFBob25nQW5pbWF0aW9uTWF0ZXJpYWwgfSBmcm9tICcuL1Bob25nQW5pbWF0aW9uTWF0ZXJpYWwnO1xuXG4vKipcbiAqIEV4dGVuZHMgVEhSRUUuTWVzaFRvb25NYXRlcmlhbCB3aXRoIGN1c3RvbSBzaGFkZXIgY2h1bmtzLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBwYXJhbWV0ZXJzIE9iamVjdCBjb250YWluaW5nIG1hdGVyaWFsIHByb3BlcnRpZXMgYW5kIGN1c3RvbSBzaGFkZXIgY2h1bmtzLlxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIFRvb25BbmltYXRpb25NYXRlcmlhbChwYXJhbWV0ZXJzKSB7XG4gIGlmICghcGFyYW1ldGVycy5kZWZpbmVzKSB7XG4gICAgcGFyYW1ldGVycy5kZWZpbmVzID0ge31cbiAgfVxuICBwYXJhbWV0ZXJzLmRlZmluZXNbJ1RPT04nXSA9ICcnXG5cbiAgUGhvbmdBbmltYXRpb25NYXRlcmlhbC5jYWxsKHRoaXMsIHBhcmFtZXRlcnMpO1xufVxuVG9vbkFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoUGhvbmdBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUpO1xuVG9vbkFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFRvb25BbmltYXRpb25NYXRlcmlhbDtcblxuZXhwb3J0IHsgVG9vbkFuaW1hdGlvbk1hdGVyaWFsIH07XG4iLCJpbXBvcnQgeyBTaGFkZXJMaWIgfSBmcm9tICd0aHJlZSc7XG5pbXBvcnQgQmFzZUFuaW1hdGlvbk1hdGVyaWFsIGZyb20gJy4vQmFzZUFuaW1hdGlvbk1hdGVyaWFsJztcblxuLyoqXG4gKiBFeHRlbmRzIFRIUkVFLlBvaW50c01hdGVyaWFsIHdpdGggY3VzdG9tIHNoYWRlciBjaHVua3MuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IHBhcmFtZXRlcnMgT2JqZWN0IGNvbnRhaW5pbmcgbWF0ZXJpYWwgcHJvcGVydGllcyBhbmQgY3VzdG9tIHNoYWRlciBjaHVua3MuXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gUG9pbnRzQW5pbWF0aW9uTWF0ZXJpYWwocGFyYW1ldGVycykge1xuICB0aGlzLnZhcnlpbmdQYXJhbWV0ZXJzID0gW107XG4gIFxuICB0aGlzLnZlcnRleEZ1bmN0aW9ucyA9IFtdO1xuICB0aGlzLnZlcnRleFBhcmFtZXRlcnMgPSBbXTtcbiAgdGhpcy52ZXJ0ZXhJbml0ID0gW107XG4gIHRoaXMudmVydGV4UG9zaXRpb24gPSBbXTtcbiAgdGhpcy52ZXJ0ZXhDb2xvciA9IFtdO1xuICBcbiAgdGhpcy5mcmFnbWVudEZ1bmN0aW9ucyA9IFtdO1xuICB0aGlzLmZyYWdtZW50UGFyYW1ldGVycyA9IFtdO1xuICB0aGlzLmZyYWdtZW50SW5pdCA9IFtdO1xuICB0aGlzLmZyYWdtZW50TWFwID0gW107XG4gIHRoaXMuZnJhZ21lbnREaWZmdXNlID0gW107XG4gIC8vIHVzZSBmcmFnbWVudCBzaGFkZXIgdG8gc2hhcGUgdG8gcG9pbnQsIHJlZmVyZW5jZTogaHR0cHM6Ly90aGVib29rb2ZzaGFkZXJzLmNvbS8wNy9cbiAgdGhpcy5mcmFnbWVudFNoYXBlID0gW107XG4gIFxuICBCYXNlQW5pbWF0aW9uTWF0ZXJpYWwuY2FsbCh0aGlzLCBwYXJhbWV0ZXJzLCBTaGFkZXJMaWJbJ3BvaW50cyddLnVuaWZvcm1zKTtcbiAgXG4gIHRoaXMudmVydGV4U2hhZGVyID0gdGhpcy5jb25jYXRWZXJ0ZXhTaGFkZXIoKTtcbiAgdGhpcy5mcmFnbWVudFNoYWRlciA9IHRoaXMuY29uY2F0RnJhZ21lbnRTaGFkZXIoKTtcbn1cblxuUG9pbnRzQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShCYXNlQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlKTtcblBvaW50c0FuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFBvaW50c0FuaW1hdGlvbk1hdGVyaWFsO1xuXG5Qb2ludHNBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uY2F0VmVydGV4U2hhZGVyID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gYFxuICB1bmlmb3JtIGZsb2F0IHNpemU7XG4gIHVuaWZvcm0gZmxvYXQgc2NhbGU7XG4gIFxuICAjaW5jbHVkZSA8Y29tbW9uPlxuICAjaW5jbHVkZSA8Y29sb3JfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxmb2dfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxzaGFkb3dtYXBfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc19wYXJzX3ZlcnRleD5cbiAgXG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UGFyYW1ldGVycycpfVxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZhcnlpbmdQYXJhbWV0ZXJzJyl9XG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4RnVuY3Rpb25zJyl9XG4gIFxuICB2b2lkIG1haW4oKSB7XG4gIFxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4SW5pdCcpfVxuICBcbiAgICAjaW5jbHVkZSA8Y29sb3JfdmVydGV4PlxuICAgICNpbmNsdWRlIDxiZWdpbl92ZXJ0ZXg+XG4gICAgXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQb3NpdGlvbicpfVxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4Q29sb3InKX1cbiAgICBcbiAgICAjaW5jbHVkZSA8cHJvamVjdF92ZXJ0ZXg+XG4gIFxuICAgICNpZmRlZiBVU0VfU0laRUFUVEVOVUFUSU9OXG4gICAgICBnbF9Qb2ludFNpemUgPSBzaXplICogKCBzY2FsZSAvIC0gbXZQb3NpdGlvbi56ICk7XG4gICAgI2Vsc2VcbiAgICAgIGdsX1BvaW50U2l6ZSA9IHNpemU7XG4gICAgI2VuZGlmXG4gIFxuICAgICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc192ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPHdvcmxkcG9zX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8c2hhZG93bWFwX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8Zm9nX3ZlcnRleD5cbiAgfWA7XG59O1xuXG5Qb2ludHNBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uY2F0RnJhZ21lbnRTaGFkZXIgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiBgXG4gIHVuaWZvcm0gdmVjMyBkaWZmdXNlO1xuICB1bmlmb3JtIGZsb2F0IG9wYWNpdHk7XG4gIFxuICAjaW5jbHVkZSA8Y29tbW9uPlxuICAjaW5jbHVkZSA8cGFja2luZz5cbiAgI2luY2x1ZGUgPGNvbG9yX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxtYXBfcGFydGljbGVfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGZvZ19wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8c2hhZG93bWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX3BhcnNfZnJhZ21lbnQ+XG4gIFxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50UGFyYW1ldGVycycpfVxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZhcnlpbmdQYXJhbWV0ZXJzJyl9XG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRGdW5jdGlvbnMnKX1cbiAgXG4gIHZvaWQgbWFpbigpIHtcbiAgXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudEluaXQnKX1cbiAgXG4gICAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc19mcmFnbWVudD5cbiAgXG4gICAgdmVjMyBvdXRnb2luZ0xpZ2h0ID0gdmVjMyggMC4wICk7XG4gICAgdmVjNCBkaWZmdXNlQ29sb3IgPSB2ZWM0KCBkaWZmdXNlLCBvcGFjaXR5ICk7XG4gIFxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnREaWZmdXNlJyl9XG4gIFxuICAgICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl9mcmFnbWVudD5cblxuICAgICR7KHRoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50TWFwJykgfHwgJyNpbmNsdWRlIDxtYXBfcGFydGljbGVfZnJhZ21lbnQ+Jyl9XG5cbiAgICAjaW5jbHVkZSA8Y29sb3JfZnJhZ21lbnQ+XG4gICAgI2luY2x1ZGUgPGFscGhhdGVzdF9mcmFnbWVudD5cbiAgXG4gICAgb3V0Z29pbmdMaWdodCA9IGRpZmZ1c2VDb2xvci5yZ2I7XG4gIFxuICAgIGdsX0ZyYWdDb2xvciA9IHZlYzQoIG91dGdvaW5nTGlnaHQsIGRpZmZ1c2VDb2xvci5hICk7XG4gICAgXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudFNoYXBlJyl9XG4gIFxuICAgICNpbmNsdWRlIDxwcmVtdWx0aXBsaWVkX2FscGhhX2ZyYWdtZW50PlxuICAgICNpbmNsdWRlIDx0b25lbWFwcGluZ19mcmFnbWVudD5cbiAgICAjaW5jbHVkZSA8ZW5jb2RpbmdzX2ZyYWdtZW50PlxuICAgICNpbmNsdWRlIDxmb2dfZnJhZ21lbnQ+XG4gIH1gO1xufTtcblxuZXhwb3J0IHsgUG9pbnRzQW5pbWF0aW9uTWF0ZXJpYWwgfTtcbiIsImltcG9ydCB7IFNoYWRlckxpYiwgVW5pZm9ybXNVdGlscywgUkdCQURlcHRoUGFja2luZyB9IGZyb20gJ3RocmVlJztcbmltcG9ydCBCYXNlQW5pbWF0aW9uTWF0ZXJpYWwgZnJvbSAnLi9CYXNlQW5pbWF0aW9uTWF0ZXJpYWwnO1xuXG5mdW5jdGlvbiBEZXB0aEFuaW1hdGlvbk1hdGVyaWFsKHBhcmFtZXRlcnMpIHtcbiAgdGhpcy5kZXB0aFBhY2tpbmcgPSBSR0JBRGVwdGhQYWNraW5nO1xuICB0aGlzLmNsaXBwaW5nID0gdHJ1ZTtcblxuICB0aGlzLnZlcnRleEZ1bmN0aW9ucyA9IFtdO1xuICB0aGlzLnZlcnRleFBhcmFtZXRlcnMgPSBbXTtcbiAgdGhpcy52ZXJ0ZXhJbml0ID0gW107XG4gIHRoaXMudmVydGV4UG9zaXRpb24gPSBbXTtcbiAgdGhpcy52ZXJ0ZXhQb3N0TW9ycGggPSBbXTtcbiAgdGhpcy52ZXJ0ZXhQb3N0U2tpbm5pbmcgPSBbXTtcblxuICBCYXNlQW5pbWF0aW9uTWF0ZXJpYWwuY2FsbCh0aGlzLCBwYXJhbWV0ZXJzKTtcbiAgXG4gIHRoaXMudW5pZm9ybXMgPSBVbmlmb3Jtc1V0aWxzLm1lcmdlKFtTaGFkZXJMaWJbJ2RlcHRoJ10udW5pZm9ybXMsIHRoaXMudW5pZm9ybXNdKTtcbiAgdGhpcy52ZXJ0ZXhTaGFkZXIgPSB0aGlzLmNvbmNhdFZlcnRleFNoYWRlcigpO1xuICB0aGlzLmZyYWdtZW50U2hhZGVyID0gU2hhZGVyTGliWydkZXB0aCddLmZyYWdtZW50U2hhZGVyO1xufVxuRGVwdGhBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEJhc2VBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUpO1xuRGVwdGhBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBEZXB0aEFuaW1hdGlvbk1hdGVyaWFsO1xuXG5EZXB0aEFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZS5jb25jYXRWZXJ0ZXhTaGFkZXIgPSBmdW5jdGlvbiAoKSB7XG4gIFxuICByZXR1cm4gYFxuICAjaW5jbHVkZSA8Y29tbW9uPlxuICAjaW5jbHVkZSA8dXZfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxkaXNwbGFjZW1lbnRtYXBfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxtb3JwaHRhcmdldF9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPHNraW5uaW5nX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfcGFyc192ZXJ0ZXg+XG4gIFxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBhcmFtZXRlcnMnKX1cbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhGdW5jdGlvbnMnKX1cbiAgXG4gIHZvaWQgbWFpbigpIHtcbiAgXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhJbml0Jyl9XG4gIFxuICAgICNpbmNsdWRlIDx1dl92ZXJ0ZXg+XG4gIFxuICAgICNpbmNsdWRlIDxza2luYmFzZV92ZXJ0ZXg+XG4gIFxuICAgICNpZmRlZiBVU0VfRElTUExBQ0VNRU5UTUFQXG4gIFxuICAgICAgI2luY2x1ZGUgPGJlZ2lubm9ybWFsX3ZlcnRleD5cbiAgICAgICNpbmNsdWRlIDxtb3JwaG5vcm1hbF92ZXJ0ZXg+XG4gICAgICAjaW5jbHVkZSA8c2tpbm5vcm1hbF92ZXJ0ZXg+XG4gIFxuICAgICNlbmRpZlxuICBcbiAgICAjaW5jbHVkZSA8YmVnaW5fdmVydGV4PlxuICAgIFxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UG9zaXRpb24nKX1cblxuICAgICNpbmNsdWRlIDxtb3JwaHRhcmdldF92ZXJ0ZXg+XG4gICAgXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQb3N0TW9ycGgnKX1cbiAgICBcbiAgICAjaW5jbHVkZSA8c2tpbm5pbmdfdmVydGV4PlxuXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQb3N0U2tpbm5pbmcnKX1cbiAgICBcbiAgICAjaW5jbHVkZSA8ZGlzcGxhY2VtZW50bWFwX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8cHJvamVjdF92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPGxvZ2RlcHRoYnVmX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX3ZlcnRleD5cbiAgfWA7XG59O1xuXG5leHBvcnQgeyBEZXB0aEFuaW1hdGlvbk1hdGVyaWFsIH07XG4iLCJpbXBvcnQgeyBTaGFkZXJMaWIsIFVuaWZvcm1zVXRpbHMsIFJHQkFEZXB0aFBhY2tpbmcgfSBmcm9tICd0aHJlZSc7XG5pbXBvcnQgQmFzZUFuaW1hdGlvbk1hdGVyaWFsIGZyb20gJy4vQmFzZUFuaW1hdGlvbk1hdGVyaWFsJztcblxuZnVuY3Rpb24gRGlzdGFuY2VBbmltYXRpb25NYXRlcmlhbChwYXJhbWV0ZXJzKSB7XG4gIHRoaXMuZGVwdGhQYWNraW5nID0gUkdCQURlcHRoUGFja2luZztcbiAgdGhpcy5jbGlwcGluZyA9IHRydWU7XG5cbiAgdGhpcy52ZXJ0ZXhGdW5jdGlvbnMgPSBbXTtcbiAgdGhpcy52ZXJ0ZXhQYXJhbWV0ZXJzID0gW107XG4gIHRoaXMudmVydGV4SW5pdCA9IFtdO1xuICB0aGlzLnZlcnRleFBvc2l0aW9uID0gW107XG4gIHRoaXMudmVydGV4UG9zdE1vcnBoID0gW107XG4gIHRoaXMudmVydGV4UG9zdFNraW5uaW5nID0gW107XG5cbiAgQmFzZUFuaW1hdGlvbk1hdGVyaWFsLmNhbGwodGhpcywgcGFyYW1ldGVycyk7XG4gIFxuICB0aGlzLnVuaWZvcm1zID0gVW5pZm9ybXNVdGlscy5tZXJnZShbU2hhZGVyTGliWydkaXN0YW5jZVJHQkEnXS51bmlmb3JtcywgdGhpcy51bmlmb3Jtc10pO1xuICB0aGlzLnZlcnRleFNoYWRlciA9IHRoaXMuY29uY2F0VmVydGV4U2hhZGVyKCk7XG4gIHRoaXMuZnJhZ21lbnRTaGFkZXIgPSBTaGFkZXJMaWJbJ2Rpc3RhbmNlUkdCQSddLmZyYWdtZW50U2hhZGVyO1xufVxuRGlzdGFuY2VBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEJhc2VBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUpO1xuRGlzdGFuY2VBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBEaXN0YW5jZUFuaW1hdGlvbk1hdGVyaWFsO1xuXG5EaXN0YW5jZUFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZS5jb25jYXRWZXJ0ZXhTaGFkZXIgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiBgXG4gICNkZWZpbmUgRElTVEFOQ0VcblxuICB2YXJ5aW5nIHZlYzMgdldvcmxkUG9zaXRpb247XG4gIFxuICAjaW5jbHVkZSA8Y29tbW9uPlxuICAjaW5jbHVkZSA8dXZfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxkaXNwbGFjZW1lbnRtYXBfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxtb3JwaHRhcmdldF9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPHNraW5uaW5nX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX3BhcnNfdmVydGV4PlxuICBcbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQYXJhbWV0ZXJzJyl9XG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4RnVuY3Rpb25zJyl9XG4gIFxuICB2b2lkIG1haW4oKSB7XG5cbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleEluaXQnKX1cbiAgXG4gICAgI2luY2x1ZGUgPHV2X3ZlcnRleD5cbiAgXG4gICAgI2luY2x1ZGUgPHNraW5iYXNlX3ZlcnRleD5cbiAgXG4gICAgI2lmZGVmIFVTRV9ESVNQTEFDRU1FTlRNQVBcbiAgXG4gICAgICAjaW5jbHVkZSA8YmVnaW5ub3JtYWxfdmVydGV4PlxuICAgICAgI2luY2x1ZGUgPG1vcnBobm9ybWFsX3ZlcnRleD5cbiAgICAgICNpbmNsdWRlIDxza2lubm9ybWFsX3ZlcnRleD5cbiAgXG4gICAgI2VuZGlmXG4gIFxuICAgICNpbmNsdWRlIDxiZWdpbl92ZXJ0ZXg+XG4gICAgXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQb3NpdGlvbicpfVxuXG4gICAgI2luY2x1ZGUgPG1vcnBodGFyZ2V0X3ZlcnRleD5cbiAgICBcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBvc3RNb3JwaCcpfVxuICAgIFxuICAgICNpbmNsdWRlIDxza2lubmluZ192ZXJ0ZXg+XG5cbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBvc3RTa2lubmluZycpfVxuICAgIFxuICAgICNpbmNsdWRlIDxkaXNwbGFjZW1lbnRtYXBfdmVydGV4PlxuICAgICNpbmNsdWRlIDxwcm9qZWN0X3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8d29ybGRwb3NfdmVydGV4PlxuICAgICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfdmVydGV4PlxuICBcbiAgICB2V29ybGRQb3NpdGlvbiA9IHdvcmxkUG9zaXRpb24ueHl6O1xuICBcbiAgfWA7XG59O1xuXG5leHBvcnQgeyBEaXN0YW5jZUFuaW1hdGlvbk1hdGVyaWFsIH07XG4iLCJpbXBvcnQgeyBCdWZmZXJHZW9tZXRyeSwgQnVmZmVyQXR0cmlidXRlIH0gZnJvbSAndGhyZWUnO1xuLyoqXG4gKiBBIEJ1ZmZlckdlb21ldHJ5IHdoZXJlIGEgJ3ByZWZhYicgZ2VvbWV0cnkgaXMgcmVwZWF0ZWQgYSBudW1iZXIgb2YgdGltZXMuXG4gKlxuICogQHBhcmFtIHtHZW9tZXRyeXxCdWZmZXJHZW9tZXRyeX0gcHJlZmFiIFRoZSBHZW9tZXRyeSBpbnN0YW5jZSB0byByZXBlYXQuXG4gKiBAcGFyYW0ge051bWJlcn0gY291bnQgVGhlIG51bWJlciBvZiB0aW1lcyB0byByZXBlYXQgdGhlIGdlb21ldHJ5LlxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIFByZWZhYkJ1ZmZlckdlb21ldHJ5KHByZWZhYiwgY291bnQpIHtcbiAgQnVmZmVyR2VvbWV0cnkuY2FsbCh0aGlzKTtcblxuICAvKipcbiAgICogQSByZWZlcmVuY2UgdG8gdGhlIHByZWZhYiBnZW9tZXRyeSB1c2VkIHRvIGNyZWF0ZSB0aGlzIGluc3RhbmNlLlxuICAgKiBAdHlwZSB7R2VvbWV0cnl8QnVmZmVyR2VvbWV0cnl9XG4gICAqL1xuICB0aGlzLnByZWZhYkdlb21ldHJ5ID0gcHJlZmFiO1xuICB0aGlzLmlzUHJlZmFiQnVmZmVyR2VvbWV0cnkgPSBwcmVmYWIuaXNCdWZmZXJHZW9tZXRyeTtcblxuICAvKipcbiAgICogTnVtYmVyIG9mIHByZWZhYnMuXG4gICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAqL1xuICB0aGlzLnByZWZhYkNvdW50ID0gY291bnQ7XG5cbiAgLyoqXG4gICAqIE51bWJlciBvZiB2ZXJ0aWNlcyBvZiB0aGUgcHJlZmFiLlxuICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgKi9cbiAgaWYgKHRoaXMuaXNQcmVmYWJCdWZmZXJHZW9tZXRyeSkge1xuICAgIHRoaXMucHJlZmFiVmVydGV4Q291bnQgPSBwcmVmYWIuYXR0cmlidXRlcy5wb3NpdGlvbi5jb3VudDtcbiAgfVxuICBlbHNlIHtcbiAgICB0aGlzLnByZWZhYlZlcnRleENvdW50ID0gcHJlZmFiLnZlcnRpY2VzLmxlbmd0aDtcbiAgfVxuXG4gIHRoaXMuYnVmZmVySW5kaWNlcygpO1xuICB0aGlzLmJ1ZmZlclBvc2l0aW9ucygpO1xufVxuUHJlZmFiQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUpO1xuUHJlZmFiQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gUHJlZmFiQnVmZmVyR2VvbWV0cnk7XG5cblByZWZhYkJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5idWZmZXJJbmRpY2VzID0gZnVuY3Rpb24oKSB7XG4gIGxldCBwcmVmYWJJbmRpY2VzID0gW107XG4gIGxldCBwcmVmYWJJbmRleENvdW50O1xuXG4gIGlmICh0aGlzLmlzUHJlZmFiQnVmZmVyR2VvbWV0cnkpIHtcbiAgICBpZiAodGhpcy5wcmVmYWJHZW9tZXRyeS5pbmRleCkge1xuICAgICAgcHJlZmFiSW5kZXhDb3VudCA9IHRoaXMucHJlZmFiR2VvbWV0cnkuaW5kZXguY291bnQ7XG4gICAgICBwcmVmYWJJbmRpY2VzID0gdGhpcy5wcmVmYWJHZW9tZXRyeS5pbmRleC5hcnJheTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBwcmVmYWJJbmRleENvdW50ID0gdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudDtcblxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcmVmYWJJbmRleENvdW50OyBpKyspIHtcbiAgICAgICAgcHJlZmFiSW5kaWNlcy5wdXNoKGkpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBlbHNlIHtcbiAgICBjb25zdCBwcmVmYWJGYWNlQ291bnQgPSB0aGlzLnByZWZhYkdlb21ldHJ5LmZhY2VzLmxlbmd0aDtcbiAgICBwcmVmYWJJbmRleENvdW50ID0gcHJlZmFiRmFjZUNvdW50ICogMztcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHJlZmFiRmFjZUNvdW50OyBpKyspIHtcbiAgICAgIGNvbnN0IGZhY2UgPSB0aGlzLnByZWZhYkdlb21ldHJ5LmZhY2VzW2ldO1xuICAgICAgcHJlZmFiSW5kaWNlcy5wdXNoKGZhY2UuYSwgZmFjZS5iLCBmYWNlLmMpO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IGluZGV4QnVmZmVyID0gbmV3IFVpbnQzMkFycmF5KHRoaXMucHJlZmFiQ291bnQgKiBwcmVmYWJJbmRleENvdW50KTtcblxuICB0aGlzLnNldEluZGV4KG5ldyBCdWZmZXJBdHRyaWJ1dGUoaW5kZXhCdWZmZXIsIDEpKTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucHJlZmFiQ291bnQ7IGkrKykge1xuICAgIGZvciAobGV0IGsgPSAwOyBrIDwgcHJlZmFiSW5kZXhDb3VudDsgaysrKSB7XG4gICAgICBpbmRleEJ1ZmZlcltpICogcHJlZmFiSW5kZXhDb3VudCArIGtdID0gcHJlZmFiSW5kaWNlc1trXSArIGkgKiB0aGlzLnByZWZhYlZlcnRleENvdW50O1xuICAgIH1cbiAgfVxufTtcblxuUHJlZmFiQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmJ1ZmZlclBvc2l0aW9ucyA9IGZ1bmN0aW9uKCkge1xuICBjb25zdCBwb3NpdGlvbkJ1ZmZlciA9IHRoaXMuY3JlYXRlQXR0cmlidXRlKCdwb3NpdGlvbicsIDMpLmFycmF5O1xuXG4gIGlmICh0aGlzLmlzUHJlZmFiQnVmZmVyR2VvbWV0cnkpIHtcbiAgICBjb25zdCBwb3NpdGlvbnMgPSB0aGlzLnByZWZhYkdlb21ldHJ5LmF0dHJpYnV0ZXMucG9zaXRpb24uYXJyYXk7XG5cbiAgICBmb3IgKGxldCBpID0gMCwgb2Zmc2V0ID0gMDsgaSA8IHRoaXMucHJlZmFiQ291bnQ7IGkrKykge1xuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCB0aGlzLnByZWZhYlZlcnRleENvdW50OyBqKyssIG9mZnNldCArPSAzKSB7XG4gICAgICAgIHBvc2l0aW9uQnVmZmVyW29mZnNldCAgICBdID0gcG9zaXRpb25zW2ogKiAzXTtcbiAgICAgICAgcG9zaXRpb25CdWZmZXJbb2Zmc2V0ICsgMV0gPSBwb3NpdGlvbnNbaiAqIDMgKyAxXTtcbiAgICAgICAgcG9zaXRpb25CdWZmZXJbb2Zmc2V0ICsgMl0gPSBwb3NpdGlvbnNbaiAqIDMgKyAyXTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgZWxzZSB7XG4gICAgZm9yIChsZXQgaSA9IDAsIG9mZnNldCA9IDA7IGkgPCB0aGlzLnByZWZhYkNvdW50OyBpKyspIHtcbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudDsgaisrLCBvZmZzZXQgKz0gMykge1xuICAgICAgICBjb25zdCBwcmVmYWJWZXJ0ZXggPSB0aGlzLnByZWZhYkdlb21ldHJ5LnZlcnRpY2VzW2pdO1xuXG4gICAgICAgIHBvc2l0aW9uQnVmZmVyW29mZnNldCAgICBdID0gcHJlZmFiVmVydGV4Lng7XG4gICAgICAgIHBvc2l0aW9uQnVmZmVyW29mZnNldCArIDFdID0gcHJlZmFiVmVydGV4Lnk7XG4gICAgICAgIHBvc2l0aW9uQnVmZmVyW29mZnNldCArIDJdID0gcHJlZmFiVmVydGV4Lno7XG4gICAgICB9XG4gICAgfVxuICB9XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBCdWZmZXJBdHRyaWJ1dGUgd2l0aCBVViBjb29yZGluYXRlcy5cbiAqL1xuUHJlZmFiQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmJ1ZmZlclV2cyA9IGZ1bmN0aW9uKCkge1xuICBjb25zdCB1dkJ1ZmZlciA9IHRoaXMuY3JlYXRlQXR0cmlidXRlKCd1dicsIDIpLmFycmF5O1xuXG4gIGlmICh0aGlzLmlzUHJlZmFiQnVmZmVyR2VvbWV0cnkpIHtcbiAgICBjb25zdCB1dnMgPSB0aGlzLnByZWZhYkdlb21ldHJ5LmF0dHJpYnV0ZXMudXYuYXJyYXlcblxuICAgIGZvciAobGV0IGkgPSAwLCBvZmZzZXQgPSAwOyBpIDwgdGhpcy5wcmVmYWJDb3VudDsgaSsrKSB7XG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHRoaXMucHJlZmFiVmVydGV4Q291bnQ7IGorKywgb2Zmc2V0ICs9IDIpIHtcbiAgICAgICAgdXZCdWZmZXJbb2Zmc2V0ICAgIF0gPSB1dnNbaiAqIDJdO1xuICAgICAgICB1dkJ1ZmZlcltvZmZzZXQgKyAxXSA9IHV2c1tqICogMiArIDFdO1xuICAgICAgfVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBjb25zdCBwcmVmYWJGYWNlQ291bnQgPSB0aGlzLnByZWZhYkdlb21ldHJ5LmZhY2VzLmxlbmd0aDtcbiAgICBjb25zdCB1dnMgPSBbXVxuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcmVmYWJGYWNlQ291bnQ7IGkrKykge1xuICAgICAgY29uc3QgZmFjZSA9IHRoaXMucHJlZmFiR2VvbWV0cnkuZmFjZXNbaV07XG4gICAgICBjb25zdCB1diA9IHRoaXMucHJlZmFiR2VvbWV0cnkuZmFjZVZlcnRleFV2c1swXVtpXTtcblxuICAgICAgdXZzW2ZhY2UuYV0gPSB1dlswXTtcbiAgICAgIHV2c1tmYWNlLmJdID0gdXZbMV07XG4gICAgICB1dnNbZmFjZS5jXSA9IHV2WzJdO1xuICAgIH1cblxuICAgIGZvciAobGV0IGkgPSAwLCBvZmZzZXQgPSAwOyBpIDwgdGhpcy5wcmVmYWJDb3VudDsgaSsrKSB7XG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHRoaXMucHJlZmFiVmVydGV4Q291bnQ7IGorKywgb2Zmc2V0ICs9IDIpIHtcbiAgICAgICAgY29uc3QgdXYgPSB1dnNbal07XG5cbiAgICAgICAgdXZCdWZmZXJbb2Zmc2V0XSA9IHV2Lng7XG4gICAgICAgIHV2QnVmZmVyW29mZnNldCArIDFdID0gdXYueTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn07XG5cbi8qKlxuICogQ3JlYXRlcyBhIEJ1ZmZlckF0dHJpYnV0ZSBvbiB0aGlzIGdlb21ldHJ5IGluc3RhbmNlLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIE5hbWUgb2YgdGhlIGF0dHJpYnV0ZS5cbiAqIEBwYXJhbSB7TnVtYmVyfSBpdGVtU2l6ZSBOdW1iZXIgb2YgZmxvYXRzIHBlciB2ZXJ0ZXggKHR5cGljYWxseSAxLCAyLCAzIG9yIDQpLlxuICogQHBhcmFtIHtmdW5jdGlvbj19IGZhY3RvcnkgRnVuY3Rpb24gdGhhdCB3aWxsIGJlIGNhbGxlZCBmb3IgZWFjaCBwcmVmYWIgdXBvbiBjcmVhdGlvbi4gQWNjZXB0cyAzIGFyZ3VtZW50czogZGF0YVtdLCBpbmRleCBhbmQgcHJlZmFiQ291bnQuIENhbGxzIHNldFByZWZhYkRhdGEuXG4gKlxuICogQHJldHVybnMge0J1ZmZlckF0dHJpYnV0ZX1cbiAqL1xuUHJlZmFiQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmNyZWF0ZUF0dHJpYnV0ZSA9IGZ1bmN0aW9uKG5hbWUsIGl0ZW1TaXplLCBmYWN0b3J5KSB7XG4gIGNvbnN0IGJ1ZmZlciA9IG5ldyBGbG9hdDMyQXJyYXkodGhpcy5wcmVmYWJDb3VudCAqIHRoaXMucHJlZmFiVmVydGV4Q291bnQgKiBpdGVtU2l6ZSk7XG4gIGNvbnN0IGF0dHJpYnV0ZSA9IG5ldyBCdWZmZXJBdHRyaWJ1dGUoYnVmZmVyLCBpdGVtU2l6ZSk7XG5cbiAgdGhpcy5hZGRBdHRyaWJ1dGUobmFtZSwgYXR0cmlidXRlKTtcblxuICBpZiAoZmFjdG9yeSkge1xuICAgIGNvbnN0IGRhdGEgPSBbXTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5wcmVmYWJDb3VudDsgaSsrKSB7XG4gICAgICBmYWN0b3J5KGRhdGEsIGksIHRoaXMucHJlZmFiQ291bnQpO1xuICAgICAgdGhpcy5zZXRQcmVmYWJEYXRhKGF0dHJpYnV0ZSwgaSwgZGF0YSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGF0dHJpYnV0ZTtcbn07XG5cbi8qKlxuICogU2V0cyBkYXRhIGZvciBhbGwgdmVydGljZXMgb2YgYSBwcmVmYWIgYXQgYSBnaXZlbiBpbmRleC5cbiAqIFVzdWFsbHkgY2FsbGVkIGluIGEgbG9vcC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ3xCdWZmZXJBdHRyaWJ1dGV9IGF0dHJpYnV0ZSBUaGUgYXR0cmlidXRlIG9yIGF0dHJpYnV0ZSBuYW1lIHdoZXJlIHRoZSBkYXRhIGlzIHRvIGJlIHN0b3JlZC5cbiAqIEBwYXJhbSB7TnVtYmVyfSBwcmVmYWJJbmRleCBJbmRleCBvZiB0aGUgcHJlZmFiIGluIHRoZSBidWZmZXIgZ2VvbWV0cnkuXG4gKiBAcGFyYW0ge0FycmF5fSBkYXRhIEFycmF5IG9mIGRhdGEuIExlbmd0aCBzaG91bGQgYmUgZXF1YWwgdG8gaXRlbSBzaXplIG9mIHRoZSBhdHRyaWJ1dGUuXG4gKi9cblByZWZhYkJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5zZXRQcmVmYWJEYXRhID0gZnVuY3Rpb24oYXR0cmlidXRlLCBwcmVmYWJJbmRleCwgZGF0YSkge1xuICBhdHRyaWJ1dGUgPSAodHlwZW9mIGF0dHJpYnV0ZSA9PT0gJ3N0cmluZycpID8gdGhpcy5hdHRyaWJ1dGVzW2F0dHJpYnV0ZV0gOiBhdHRyaWJ1dGU7XG5cbiAgbGV0IG9mZnNldCA9IHByZWZhYkluZGV4ICogdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudCAqIGF0dHJpYnV0ZS5pdGVtU2l6ZTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucHJlZmFiVmVydGV4Q291bnQ7IGkrKykge1xuICAgIGZvciAobGV0IGogPSAwOyBqIDwgYXR0cmlidXRlLml0ZW1TaXplOyBqKyspIHtcbiAgICAgIGF0dHJpYnV0ZS5hcnJheVtvZmZzZXQrK10gPSBkYXRhW2pdO1xuICAgIH1cbiAgfVxufTtcblxuZXhwb3J0IHsgUHJlZmFiQnVmZmVyR2VvbWV0cnkgfTtcbiIsImltcG9ydCB7IEJ1ZmZlckdlb21ldHJ5LCBCdWZmZXJBdHRyaWJ1dGUgfSBmcm9tICd0aHJlZSc7XG4vKipcbiAqIEEgQnVmZmVyR2VvbWV0cnkgd2hlcmUgYSAncHJlZmFiJyBnZW9tZXRyeSBhcnJheSBpcyByZXBlYXRlZCBhIG51bWJlciBvZiB0aW1lcy5cbiAqXG4gKiBAcGFyYW0ge0FycmF5fSBwcmVmYWJzIEFuIGFycmF5IHdpdGggR2VvbWV0cnkgaW5zdGFuY2VzIHRvIHJlcGVhdC5cbiAqIEBwYXJhbSB7TnVtYmVyfSByZXBlYXRDb3VudCBUaGUgbnVtYmVyIG9mIHRpbWVzIHRvIHJlcGVhdCB0aGUgYXJyYXkgb2YgR2VvbWV0cmllcy5cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBNdWx0aVByZWZhYkJ1ZmZlckdlb21ldHJ5KHByZWZhYnMsIHJlcGVhdENvdW50KSB7XG4gIEJ1ZmZlckdlb21ldHJ5LmNhbGwodGhpcyk7XG5cbiAgaWYgKEFycmF5LmlzQXJyYXkocHJlZmFicykpIHtcbiAgICB0aGlzLnByZWZhYkdlb21ldHJpZXMgPSBwcmVmYWJzO1xuICB9IGVsc2Uge1xuICAgIHRoaXMucHJlZmFiR2VvbWV0cmllcyA9IFtwcmVmYWJzXTtcbiAgfVxuXG4gIHRoaXMucHJlZmFiR2VvbWV0cmllc0NvdW50ID0gdGhpcy5wcmVmYWJHZW9tZXRyaWVzLmxlbmd0aDtcblxuICAvKipcbiAgICogTnVtYmVyIG9mIHByZWZhYnMuXG4gICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAqL1xuICB0aGlzLnByZWZhYkNvdW50ID0gcmVwZWF0Q291bnQgKiB0aGlzLnByZWZhYkdlb21ldHJpZXNDb3VudDtcbiAgLyoqXG4gICAqIEhvdyBvZnRlbiB0aGUgcHJlZmFiIGFycmF5IGlzIHJlcGVhdGVkLlxuICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgKi9cbiAgdGhpcy5yZXBlYXRDb3VudCA9IHJlcGVhdENvdW50O1xuICBcbiAgLyoqXG4gICAqIEFycmF5IG9mIHZlcnRleCBjb3VudHMgcGVyIHByZWZhYi5cbiAgICogQHR5cGUge0FycmF5fVxuICAgKi9cbiAgdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudHMgPSB0aGlzLnByZWZhYkdlb21ldHJpZXMubWFwKHAgPT4gcC5pc0J1ZmZlckdlb21ldHJ5ID8gcC5hdHRyaWJ1dGVzLnBvc2l0aW9uLmNvdW50IDogcC52ZXJ0aWNlcy5sZW5ndGgpO1xuICAvKipcbiAgICogVG90YWwgbnVtYmVyIG9mIHZlcnRpY2VzIGZvciBvbmUgcmVwZXRpdGlvbiBvZiB0aGUgcHJlZmFic1xuICAgKiBAdHlwZSB7bnVtYmVyfVxuICAgKi9cbiAgdGhpcy5yZXBlYXRWZXJ0ZXhDb3VudCA9IHRoaXMucHJlZmFiVmVydGV4Q291bnRzLnJlZHVjZSgociwgdikgPT4gciArIHYsIDApO1xuXG4gIHRoaXMuYnVmZmVySW5kaWNlcygpO1xuICB0aGlzLmJ1ZmZlclBvc2l0aW9ucygpO1xufVxuTXVsdGlQcmVmYWJCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZSk7XG5NdWx0aVByZWZhYkJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IE11bHRpUHJlZmFiQnVmZmVyR2VvbWV0cnk7XG5cbk11bHRpUHJlZmFiQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmJ1ZmZlckluZGljZXMgPSBmdW5jdGlvbigpIHtcbiAgbGV0IHJlcGVhdEluZGV4Q291bnQgPSAwO1xuXG4gIHRoaXMucHJlZmFiSW5kaWNlcyA9IHRoaXMucHJlZmFiR2VvbWV0cmllcy5tYXAoZ2VvbWV0cnkgPT4ge1xuICAgIGxldCBpbmRpY2VzID0gW107XG5cbiAgICBpZiAoZ2VvbWV0cnkuaXNCdWZmZXJHZW9tZXRyeSkge1xuICAgICAgaWYgKGdlb21ldHJ5LmluZGV4KSB7XG4gICAgICAgIGluZGljZXMgPSBnZW9tZXRyeS5pbmRleC5hcnJheTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZ2VvbWV0cnkuYXR0cmlidXRlcy5wb3NpdGlvbi5jb3VudDsgaSsrKSB7XG4gICAgICAgICAgaW5kaWNlcy5wdXNoKGkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZ2VvbWV0cnkuZmFjZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgZmFjZSA9IGdlb21ldHJ5LmZhY2VzW2ldO1xuICAgICAgICBpbmRpY2VzLnB1c2goZmFjZS5hLCBmYWNlLmIsIGZhY2UuYyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmVwZWF0SW5kZXhDb3VudCArPSBpbmRpY2VzLmxlbmd0aDtcblxuICAgIHJldHVybiBpbmRpY2VzO1xuICB9KTtcblxuICBjb25zdCBpbmRleEJ1ZmZlciA9IG5ldyBVaW50MzJBcnJheShyZXBlYXRJbmRleENvdW50ICogdGhpcy5yZXBlYXRDb3VudCk7XG4gIGxldCBpbmRleE9mZnNldCA9IDA7XG4gIGxldCBwcmVmYWJPZmZzZXQgPSAwO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5wcmVmYWJDb3VudDsgaSsrKSB7XG4gICAgY29uc3QgaW5kZXggPSBpICUgdGhpcy5wcmVmYWJHZW9tZXRyaWVzQ291bnQ7XG4gICAgY29uc3QgaW5kaWNlcyA9IHRoaXMucHJlZmFiSW5kaWNlc1tpbmRleF07XG4gICAgY29uc3QgdmVydGV4Q291bnQgPSB0aGlzLnByZWZhYlZlcnRleENvdW50c1tpbmRleF07XG5cbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IGluZGljZXMubGVuZ3RoOyBqKyspIHtcbiAgICAgIGluZGV4QnVmZmVyW2luZGV4T2Zmc2V0KytdID0gaW5kaWNlc1tqXSArIHByZWZhYk9mZnNldDtcbiAgICB9XG5cbiAgICBwcmVmYWJPZmZzZXQgKz0gdmVydGV4Q291bnQ7XG4gIH1cblxuICB0aGlzLnNldEluZGV4KG5ldyBCdWZmZXJBdHRyaWJ1dGUoaW5kZXhCdWZmZXIsIDEpKTtcbn07XG5cbk11bHRpUHJlZmFiQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmJ1ZmZlclBvc2l0aW9ucyA9IGZ1bmN0aW9uKCkge1xuICBjb25zdCBwb3NpdGlvbkJ1ZmZlciA9IHRoaXMuY3JlYXRlQXR0cmlidXRlKCdwb3NpdGlvbicsIDMpLmFycmF5O1xuXG4gIGNvbnN0IHByZWZhYlBvc2l0aW9ucyA9IHRoaXMucHJlZmFiR2VvbWV0cmllcy5tYXAoKGdlb21ldHJ5LCBpKSA9PiB7XG4gICAgbGV0IHBvc2l0aW9ucztcblxuICAgIGlmIChnZW9tZXRyeS5pc0J1ZmZlckdlb21ldHJ5KSB7XG4gICAgICBwb3NpdGlvbnMgPSBnZW9tZXRyeS5hdHRyaWJ1dGVzLnBvc2l0aW9uLmFycmF5O1xuICAgIH0gZWxzZSB7XG5cbiAgICAgIGNvbnN0IHZlcnRleENvdW50ID0gdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudHNbaV07XG5cbiAgICAgIHBvc2l0aW9ucyA9IFtdO1xuXG4gICAgICBmb3IgKGxldCBqID0gMCwgb2Zmc2V0ID0gMDsgaiA8IHZlcnRleENvdW50OyBqKyspIHtcbiAgICAgICAgY29uc3QgcHJlZmFiVmVydGV4ID0gZ2VvbWV0cnkudmVydGljZXNbal07XG5cbiAgICAgICAgcG9zaXRpb25zW29mZnNldCsrXSA9IHByZWZhYlZlcnRleC54O1xuICAgICAgICBwb3NpdGlvbnNbb2Zmc2V0KytdID0gcHJlZmFiVmVydGV4Lnk7XG4gICAgICAgIHBvc2l0aW9uc1tvZmZzZXQrK10gPSBwcmVmYWJWZXJ0ZXguejtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gcG9zaXRpb25zO1xuICB9KTtcblxuICBmb3IgKGxldCBpID0gMCwgb2Zmc2V0ID0gMDsgaSA8IHRoaXMucHJlZmFiQ291bnQ7IGkrKykge1xuICAgIGNvbnN0IGluZGV4ID0gaSAlIHRoaXMucHJlZmFiR2VvbWV0cmllcy5sZW5ndGg7XG4gICAgY29uc3QgdmVydGV4Q291bnQgPSB0aGlzLnByZWZhYlZlcnRleENvdW50c1tpbmRleF07XG4gICAgY29uc3QgcG9zaXRpb25zID0gcHJlZmFiUG9zaXRpb25zW2luZGV4XTtcblxuICAgIGZvciAobGV0IGogPSAwOyBqIDwgdmVydGV4Q291bnQ7IGorKykge1xuICAgICAgcG9zaXRpb25CdWZmZXJbb2Zmc2V0KytdID0gcG9zaXRpb25zW2ogKiAzXTtcbiAgICAgIHBvc2l0aW9uQnVmZmVyW29mZnNldCsrXSA9IHBvc2l0aW9uc1tqICogMyArIDFdO1xuICAgICAgcG9zaXRpb25CdWZmZXJbb2Zmc2V0KytdID0gcG9zaXRpb25zW2ogKiAzICsgMl07XG4gICAgfVxuICB9XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBCdWZmZXJBdHRyaWJ1dGUgd2l0aCBVViBjb29yZGluYXRlcy5cbiAqL1xuTXVsdGlQcmVmYWJCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuYnVmZmVyVXZzID0gZnVuY3Rpb24oKSB7XG4gIGNvbnN0IHV2QnVmZmVyID0gdGhpcy5jcmVhdGVBdHRyaWJ1dGUoJ3V2JywgMikuYXJyYXk7XG5cbiAgY29uc3QgcHJlZmFiVXZzID0gdGhpcy5wcmVmYWJHZW9tZXRyaWVzLm1hcCgoZ2VvbWV0cnksIGkpID0+IHtcbiAgICBsZXQgdXZzO1xuXG4gICAgaWYgKGdlb21ldHJ5LmlzQnVmZmVyR2VvbWV0cnkpIHtcbiAgICAgIGlmICghZ2VvbWV0cnkuYXR0cmlidXRlcy51dikge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdObyBVViBmb3VuZCBpbiBwcmVmYWIgZ2VvbWV0cnknLCBnZW9tZXRyeSk7XG4gICAgICB9XG5cbiAgICAgIHV2cyA9IGdlb21ldHJ5LmF0dHJpYnV0ZXMudXYuYXJyYXk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHByZWZhYkZhY2VDb3VudCA9IHRoaXMucHJlZmFiSW5kaWNlc1tpXS5sZW5ndGggLyAzO1xuICAgICAgY29uc3QgdXZPYmplY3RzID0gW107XG5cbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgcHJlZmFiRmFjZUNvdW50OyBqKyspIHtcbiAgICAgICAgY29uc3QgZmFjZSA9IGdlb21ldHJ5LmZhY2VzW2pdO1xuICAgICAgICBjb25zdCB1diA9IGdlb21ldHJ5LmZhY2VWZXJ0ZXhVdnNbMF1bal07XG5cbiAgICAgICAgdXZPYmplY3RzW2ZhY2UuYV0gPSB1dlswXTtcbiAgICAgICAgdXZPYmplY3RzW2ZhY2UuYl0gPSB1dlsxXTtcbiAgICAgICAgdXZPYmplY3RzW2ZhY2UuY10gPSB1dlsyXTtcbiAgICAgIH1cblxuICAgICAgdXZzID0gW107XG5cbiAgICAgIGZvciAobGV0IGsgPSAwOyBrIDwgdXZPYmplY3RzLmxlbmd0aDsgaysrKSB7XG4gICAgICAgIHV2c1trICogMl0gPSB1dk9iamVjdHNba10ueDtcbiAgICAgICAgdXZzW2sgKiAyICsgMV0gPSB1dk9iamVjdHNba10ueTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdXZzO1xuICB9KTtcblxuICBmb3IgKGxldCBpID0gMCwgb2Zmc2V0ID0gMDsgaSA8IHRoaXMucHJlZmFiQ291bnQ7IGkrKykge1xuXG4gICAgY29uc3QgaW5kZXggPSBpICUgdGhpcy5wcmVmYWJHZW9tZXRyaWVzLmxlbmd0aDtcbiAgICBjb25zdCB2ZXJ0ZXhDb3VudCA9IHRoaXMucHJlZmFiVmVydGV4Q291bnRzW2luZGV4XTtcbiAgICBjb25zdCB1dnMgPSBwcmVmYWJVdnNbaW5kZXhdO1xuXG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCB2ZXJ0ZXhDb3VudDsgaisrKSB7XG4gICAgICB1dkJ1ZmZlcltvZmZzZXQrK10gPSB1dnNbaiAqIDJdO1xuICAgICAgdXZCdWZmZXJbb2Zmc2V0KytdID0gdXZzW2ogKiAyICsgMV07XG4gICAgfVxuICB9XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBCdWZmZXJBdHRyaWJ1dGUgb24gdGhpcyBnZW9tZXRyeSBpbnN0YW5jZS5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZSBOYW1lIG9mIHRoZSBhdHRyaWJ1dGUuXG4gKiBAcGFyYW0ge051bWJlcn0gaXRlbVNpemUgTnVtYmVyIG9mIGZsb2F0cyBwZXIgdmVydGV4ICh0eXBpY2FsbHkgMSwgMiwgMyBvciA0KS5cbiAqIEBwYXJhbSB7ZnVuY3Rpb249fSBmYWN0b3J5IEZ1bmN0aW9uIHRoYXQgd2lsbCBiZSBjYWxsZWQgZm9yIGVhY2ggcHJlZmFiIHVwb24gY3JlYXRpb24uIEFjY2VwdHMgMyBhcmd1bWVudHM6IGRhdGFbXSwgaW5kZXggYW5kIHByZWZhYkNvdW50LiBDYWxscyBzZXRQcmVmYWJEYXRhLlxuICpcbiAqIEByZXR1cm5zIHtCdWZmZXJBdHRyaWJ1dGV9XG4gKi9cbk11bHRpUHJlZmFiQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmNyZWF0ZUF0dHJpYnV0ZSA9IGZ1bmN0aW9uKG5hbWUsIGl0ZW1TaXplLCBmYWN0b3J5KSB7XG4gIGNvbnN0IGJ1ZmZlciA9IG5ldyBGbG9hdDMyQXJyYXkodGhpcy5yZXBlYXRDb3VudCAqIHRoaXMucmVwZWF0VmVydGV4Q291bnQgKiBpdGVtU2l6ZSk7XG4gIGNvbnN0IGF0dHJpYnV0ZSA9IG5ldyBCdWZmZXJBdHRyaWJ1dGUoYnVmZmVyLCBpdGVtU2l6ZSk7XG4gIFxuICB0aGlzLmFkZEF0dHJpYnV0ZShuYW1lLCBhdHRyaWJ1dGUpO1xuICBcbiAgaWYgKGZhY3RvcnkpIHtcbiAgICBjb25zdCBkYXRhID0gW107XG4gICAgXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnByZWZhYkNvdW50OyBpKyspIHtcbiAgICAgIGZhY3RvcnkoZGF0YSwgaSwgdGhpcy5wcmVmYWJDb3VudCk7XG4gICAgICB0aGlzLnNldFByZWZhYkRhdGEoYXR0cmlidXRlLCBpLCBkYXRhKTtcbiAgICB9XG4gIH1cbiAgXG4gIHJldHVybiBhdHRyaWJ1dGU7XG59O1xuXG4vKipcbiAqIFNldHMgZGF0YSBmb3IgYWxsIHZlcnRpY2VzIG9mIGEgcHJlZmFiIGF0IGEgZ2l2ZW4gaW5kZXguXG4gKiBVc3VhbGx5IGNhbGxlZCBpbiBhIGxvb3AuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd8QnVmZmVyQXR0cmlidXRlfSBhdHRyaWJ1dGUgVGhlIGF0dHJpYnV0ZSBvciBhdHRyaWJ1dGUgbmFtZSB3aGVyZSB0aGUgZGF0YSBpcyB0byBiZSBzdG9yZWQuXG4gKiBAcGFyYW0ge051bWJlcn0gcHJlZmFiSW5kZXggSW5kZXggb2YgdGhlIHByZWZhYiBpbiB0aGUgYnVmZmVyIGdlb21ldHJ5LlxuICogQHBhcmFtIHtBcnJheX0gZGF0YSBBcnJheSBvZiBkYXRhLiBMZW5ndGggc2hvdWxkIGJlIGVxdWFsIHRvIGl0ZW0gc2l6ZSBvZiB0aGUgYXR0cmlidXRlLlxuICovXG5NdWx0aVByZWZhYkJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5zZXRQcmVmYWJEYXRhID0gZnVuY3Rpb24oYXR0cmlidXRlLCBwcmVmYWJJbmRleCwgZGF0YSkge1xuICBhdHRyaWJ1dGUgPSAodHlwZW9mIGF0dHJpYnV0ZSA9PT0gJ3N0cmluZycpID8gdGhpcy5hdHRyaWJ1dGVzW2F0dHJpYnV0ZV0gOiBhdHRyaWJ1dGU7XG5cbiAgY29uc3QgcHJlZmFiR2VvbWV0cnlJbmRleCA9IHByZWZhYkluZGV4ICUgdGhpcy5wcmVmYWJHZW9tZXRyaWVzQ291bnQ7XG4gIGNvbnN0IHByZWZhYkdlb21ldHJ5VmVydGV4Q291bnQgPSB0aGlzLnByZWZhYlZlcnRleENvdW50c1twcmVmYWJHZW9tZXRyeUluZGV4XTtcbiAgY29uc3Qgd2hvbGUgPSAocHJlZmFiSW5kZXggLyB0aGlzLnByZWZhYkdlb21ldHJpZXNDb3VudCB8IDApICogdGhpcy5wcmVmYWJHZW9tZXRyaWVzQ291bnQ7XG4gIGNvbnN0IHdob2xlT2Zmc2V0ID0gd2hvbGUgKiB0aGlzLnJlcGVhdFZlcnRleENvdW50O1xuICBjb25zdCBwYXJ0ID0gcHJlZmFiSW5kZXggLSB3aG9sZTtcbiAgbGV0IHBhcnRPZmZzZXQgPSAwO1xuICBsZXQgaSA9IDA7XG5cbiAgd2hpbGUoaSA8IHBhcnQpIHtcbiAgICBwYXJ0T2Zmc2V0ICs9IHRoaXMucHJlZmFiVmVydGV4Q291bnRzW2krK107XG4gIH1cblxuICBsZXQgb2Zmc2V0ID0gKHdob2xlT2Zmc2V0ICsgcGFydE9mZnNldCkgKiBhdHRyaWJ1dGUuaXRlbVNpemU7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcmVmYWJHZW9tZXRyeVZlcnRleENvdW50OyBpKyspIHtcbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IGF0dHJpYnV0ZS5pdGVtU2l6ZTsgaisrKSB7XG4gICAgICBhdHRyaWJ1dGUuYXJyYXlbb2Zmc2V0KytdID0gZGF0YVtqXTtcbiAgICB9XG4gIH1cbn07XG5cbmV4cG9ydCB7IE11bHRpUHJlZmFiQnVmZmVyR2VvbWV0cnkgfTtcbiIsImltcG9ydCB7IEluc3RhbmNlZEJ1ZmZlckdlb21ldHJ5LCBJbnN0YW5jZWRCdWZmZXJBdHRyaWJ1dGUgfSBmcm9tICd0aHJlZSc7XG4vKipcbiAqIEEgd3JhcHBlciBhcm91bmQgVEhSRUUuSW5zdGFuY2VkQnVmZmVyR2VvbWV0cnkuXG4gKlxuICogQHBhcmFtIHtCdWZmZXJHZW9tZXRyeX0gcHJlZmFiIFRoZSBHZW9tZXRyeSBpbnN0YW5jZSB0byByZXBlYXQuXG4gKiBAcGFyYW0ge051bWJlcn0gY291bnQgVGhlIG51bWJlciBvZiB0aW1lcyB0byByZXBlYXQgdGhlIGdlb21ldHJ5LlxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIEluc3RhbmNlZFByZWZhYkJ1ZmZlckdlb21ldHJ5KHByZWZhYiwgY291bnQpIHtcbiAgaWYgKHByZWZhYi5pc0dlb21ldHJ5ID09PSB0cnVlKSB7XG4gICAgY29uc29sZS5lcnJvcignSW5zdGFuY2VkUHJlZmFiQnVmZmVyR2VvbWV0cnkgcHJlZmFiIG11c3QgYmUgYSBCdWZmZXJHZW9tZXRyeS4nKVxuICB9XG5cbiAgSW5zdGFuY2VkQnVmZmVyR2VvbWV0cnkuY2FsbCh0aGlzKTtcblxuICB0aGlzLnByZWZhYkdlb21ldHJ5ID0gcHJlZmFiO1xuICB0aGlzLmNvcHkocHJlZmFiKVxuXG4gIHRoaXMubWF4SW5zdGFuY2VkQ291bnQgPSBjb3VudFxuICB0aGlzLnByZWZhYkNvdW50ID0gY291bnQ7XG59XG5JbnN0YW5jZWRQcmVmYWJCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEluc3RhbmNlZEJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZSk7XG5JbnN0YW5jZWRQcmVmYWJCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBJbnN0YW5jZWRQcmVmYWJCdWZmZXJHZW9tZXRyeTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgQnVmZmVyQXR0cmlidXRlIG9uIHRoaXMgZ2VvbWV0cnkgaW5zdGFuY2UuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgTmFtZSBvZiB0aGUgYXR0cmlidXRlLlxuICogQHBhcmFtIHtOdW1iZXJ9IGl0ZW1TaXplIE51bWJlciBvZiBmbG9hdHMgcGVyIHZlcnRleCAodHlwaWNhbGx5IDEsIDIsIDMgb3IgNCkuXG4gKiBAcGFyYW0ge2Z1bmN0aW9uPX0gZmFjdG9yeSBGdW5jdGlvbiB0aGF0IHdpbGwgYmUgY2FsbGVkIGZvciBlYWNoIHByZWZhYiB1cG9uIGNyZWF0aW9uLiBBY2NlcHRzIDMgYXJndW1lbnRzOiBkYXRhW10sIGluZGV4IGFuZCBwcmVmYWJDb3VudC4gQ2FsbHMgc2V0UHJlZmFiRGF0YS5cbiAqXG4gKiBAcmV0dXJucyB7QnVmZmVyQXR0cmlidXRlfVxuICovXG5JbnN0YW5jZWRQcmVmYWJCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuY3JlYXRlQXR0cmlidXRlID0gZnVuY3Rpb24obmFtZSwgaXRlbVNpemUsIGZhY3RvcnkpIHtcbiAgY29uc3QgYnVmZmVyID0gbmV3IEZsb2F0MzJBcnJheSh0aGlzLnByZWZhYkNvdW50ICogaXRlbVNpemUpO1xuICBjb25zdCBhdHRyaWJ1dGUgPSBuZXcgSW5zdGFuY2VkQnVmZmVyQXR0cmlidXRlKGJ1ZmZlciwgaXRlbVNpemUpO1xuXG4gIHRoaXMuYWRkQXR0cmlidXRlKG5hbWUsIGF0dHJpYnV0ZSk7XG5cbiAgaWYgKGZhY3RvcnkpIHtcbiAgICBjb25zdCBkYXRhID0gW107XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucHJlZmFiQ291bnQ7IGkrKykge1xuICAgICAgZmFjdG9yeShkYXRhLCBpLCB0aGlzLnByZWZhYkNvdW50KTtcbiAgICAgIHRoaXMuc2V0UHJlZmFiRGF0YShhdHRyaWJ1dGUsIGksIGRhdGEpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBhdHRyaWJ1dGU7XG59O1xuXG4vKipcbiAqIFNldHMgZGF0YSBmb3IgYSBwcmVmYWIgYXQgYSBnaXZlbiBpbmRleC5cbiAqIFVzdWFsbHkgY2FsbGVkIGluIGEgbG9vcC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ3xCdWZmZXJBdHRyaWJ1dGV9IGF0dHJpYnV0ZSBUaGUgYXR0cmlidXRlIG9yIGF0dHJpYnV0ZSBuYW1lIHdoZXJlIHRoZSBkYXRhIGlzIHRvIGJlIHN0b3JlZC5cbiAqIEBwYXJhbSB7TnVtYmVyfSBwcmVmYWJJbmRleCBJbmRleCBvZiB0aGUgcHJlZmFiIGluIHRoZSBidWZmZXIgZ2VvbWV0cnkuXG4gKiBAcGFyYW0ge0FycmF5fSBkYXRhIEFycmF5IG9mIGRhdGEuIExlbmd0aCBzaG91bGQgYmUgZXF1YWwgdG8gaXRlbSBzaXplIG9mIHRoZSBhdHRyaWJ1dGUuXG4gKi9cbkluc3RhbmNlZFByZWZhYkJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5zZXRQcmVmYWJEYXRhID0gZnVuY3Rpb24oYXR0cmlidXRlLCBwcmVmYWJJbmRleCwgZGF0YSkge1xuICBhdHRyaWJ1dGUgPSAodHlwZW9mIGF0dHJpYnV0ZSA9PT0gJ3N0cmluZycpID8gdGhpcy5hdHRyaWJ1dGVzW2F0dHJpYnV0ZV0gOiBhdHRyaWJ1dGU7XG5cbiAgbGV0IG9mZnNldCA9IHByZWZhYkluZGV4ICogYXR0cmlidXRlLml0ZW1TaXplO1xuXG4gIGZvciAobGV0IGogPSAwOyBqIDwgYXR0cmlidXRlLml0ZW1TaXplOyBqKyspIHtcbiAgICBhdHRyaWJ1dGUuYXJyYXlbb2Zmc2V0KytdID0gZGF0YVtqXTtcbiAgfVxufTtcblxuZXhwb3J0IHsgSW5zdGFuY2VkUHJlZmFiQnVmZmVyR2VvbWV0cnkgfTtcbiIsImltcG9ydCB7IE1hdGggYXMgdE1hdGgsIFZlY3RvcjMgfSBmcm9tICd0aHJlZSc7XG5pbXBvcnQgeyBEZXB0aEFuaW1hdGlvbk1hdGVyaWFsIH0gZnJvbSAnLi9tYXRlcmlhbHMvRGVwdGhBbmltYXRpb25NYXRlcmlhbCc7XG5pbXBvcnQgeyBEaXN0YW5jZUFuaW1hdGlvbk1hdGVyaWFsIH0gZnJvbSAnLi9tYXRlcmlhbHMvRGlzdGFuY2VBbmltYXRpb25NYXRlcmlhbCc7XG5cbi8qKlxuICogQ29sbGVjdGlvbiBvZiB1dGlsaXR5IGZ1bmN0aW9ucy5cbiAqIEBuYW1lc3BhY2VcbiAqL1xuY29uc3QgVXRpbHMgPSB7XG4gIC8qKlxuICAgKiBEdXBsaWNhdGVzIHZlcnRpY2VzIHNvIGVhY2ggZmFjZSBiZWNvbWVzIHNlcGFyYXRlLlxuICAgKiBTYW1lIGFzIFRIUkVFLkV4cGxvZGVNb2RpZmllci5cbiAgICpcbiAgICogQHBhcmFtIHtUSFJFRS5HZW9tZXRyeX0gZ2VvbWV0cnkgR2VvbWV0cnkgaW5zdGFuY2UgdG8gbW9kaWZ5LlxuICAgKi9cbiAgc2VwYXJhdGVGYWNlczogZnVuY3Rpb24gKGdlb21ldHJ5KSB7XG4gICAgbGV0IHZlcnRpY2VzID0gW107XG5cbiAgICBmb3IgKGxldCBpID0gMCwgaWwgPSBnZW9tZXRyeS5mYWNlcy5sZW5ndGg7IGkgPCBpbDsgaSsrKSB7XG4gICAgICBsZXQgbiA9IHZlcnRpY2VzLmxlbmd0aDtcbiAgICAgIGxldCBmYWNlID0gZ2VvbWV0cnkuZmFjZXNbaV07XG5cbiAgICAgIGxldCBhID0gZmFjZS5hO1xuICAgICAgbGV0IGIgPSBmYWNlLmI7XG4gICAgICBsZXQgYyA9IGZhY2UuYztcblxuICAgICAgbGV0IHZhID0gZ2VvbWV0cnkudmVydGljZXNbYV07XG4gICAgICBsZXQgdmIgPSBnZW9tZXRyeS52ZXJ0aWNlc1tiXTtcbiAgICAgIGxldCB2YyA9IGdlb21ldHJ5LnZlcnRpY2VzW2NdO1xuXG4gICAgICB2ZXJ0aWNlcy5wdXNoKHZhLmNsb25lKCkpO1xuICAgICAgdmVydGljZXMucHVzaCh2Yi5jbG9uZSgpKTtcbiAgICAgIHZlcnRpY2VzLnB1c2godmMuY2xvbmUoKSk7XG5cbiAgICAgIGZhY2UuYSA9IG47XG4gICAgICBmYWNlLmIgPSBuICsgMTtcbiAgICAgIGZhY2UuYyA9IG4gKyAyO1xuICAgIH1cblxuICAgIGdlb21ldHJ5LnZlcnRpY2VzID0gdmVydGljZXM7XG4gIH0sXG5cbiAgLyoqXG4gICAqIENvbXB1dGUgdGhlIGNlbnRyb2lkIChjZW50ZXIpIG9mIGEgVEhSRUUuRmFjZTMuXG4gICAqXG4gICAqIEBwYXJhbSB7VEhSRUUuR2VvbWV0cnl9IGdlb21ldHJ5IEdlb21ldHJ5IGluc3RhbmNlIHRoZSBmYWNlIGlzIGluLlxuICAgKiBAcGFyYW0ge1RIUkVFLkZhY2UzfSBmYWNlIEZhY2Ugb2JqZWN0IGZyb20gdGhlIFRIUkVFLkdlb21ldHJ5LmZhY2VzIGFycmF5XG4gICAqIEBwYXJhbSB7VEhSRUUuVmVjdG9yMz19IHYgT3B0aW9uYWwgdmVjdG9yIHRvIHN0b3JlIHJlc3VsdCBpbi5cbiAgICogQHJldHVybnMge1RIUkVFLlZlY3RvcjN9XG4gICAqL1xuICBjb21wdXRlQ2VudHJvaWQ6IGZ1bmN0aW9uKGdlb21ldHJ5LCBmYWNlLCB2KSB7XG4gICAgbGV0IGEgPSBnZW9tZXRyeS52ZXJ0aWNlc1tmYWNlLmFdO1xuICAgIGxldCBiID0gZ2VvbWV0cnkudmVydGljZXNbZmFjZS5iXTtcbiAgICBsZXQgYyA9IGdlb21ldHJ5LnZlcnRpY2VzW2ZhY2UuY107XG5cbiAgICB2ID0gdiB8fCBuZXcgVmVjdG9yMygpO1xuXG4gICAgdi54ID0gKGEueCArIGIueCArIGMueCkgLyAzO1xuICAgIHYueSA9IChhLnkgKyBiLnkgKyBjLnkpIC8gMztcbiAgICB2LnogPSAoYS56ICsgYi56ICsgYy56KSAvIDM7XG5cbiAgICByZXR1cm4gdjtcbiAgfSxcblxuICAvKipcbiAgICogR2V0IGEgcmFuZG9tIHZlY3RvciBiZXR3ZWVuIGJveC5taW4gYW5kIGJveC5tYXguXG4gICAqXG4gICAqIEBwYXJhbSB7VEhSRUUuQm94M30gYm94IFRIUkVFLkJveDMgaW5zdGFuY2UuXG4gICAqIEBwYXJhbSB7VEhSRUUuVmVjdG9yMz19IHYgT3B0aW9uYWwgdmVjdG9yIHRvIHN0b3JlIHJlc3VsdCBpbi5cbiAgICogQHJldHVybnMge1RIUkVFLlZlY3RvcjN9XG4gICAqL1xuICByYW5kb21JbkJveDogZnVuY3Rpb24oYm94LCB2KSB7XG4gICAgdiA9IHYgfHwgbmV3IFZlY3RvcjMoKTtcblxuICAgIHYueCA9IHRNYXRoLnJhbmRGbG9hdChib3gubWluLngsIGJveC5tYXgueCk7XG4gICAgdi55ID0gdE1hdGgucmFuZEZsb2F0KGJveC5taW4ueSwgYm94Lm1heC55KTtcbiAgICB2LnogPSB0TWF0aC5yYW5kRmxvYXQoYm94Lm1pbi56LCBib3gubWF4LnopO1xuXG4gICAgcmV0dXJuIHY7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEdldCBhIHJhbmRvbSBheGlzIGZvciBxdWF0ZXJuaW9uIHJvdGF0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0ge1RIUkVFLlZlY3RvcjM9fSB2IE9wdGlvbiB2ZWN0b3IgdG8gc3RvcmUgcmVzdWx0IGluLlxuICAgKiBAcmV0dXJucyB7VEhSRUUuVmVjdG9yM31cbiAgICovXG4gIHJhbmRvbUF4aXM6IGZ1bmN0aW9uKHYpIHtcbiAgICB2ID0gdiB8fCBuZXcgVmVjdG9yMygpO1xuXG4gICAgdi54ID0gdE1hdGgucmFuZEZsb2F0U3ByZWFkKDIuMCk7XG4gICAgdi55ID0gdE1hdGgucmFuZEZsb2F0U3ByZWFkKDIuMCk7XG4gICAgdi56ID0gdE1hdGgucmFuZEZsb2F0U3ByZWFkKDIuMCk7XG4gICAgdi5ub3JtYWxpemUoKTtcblxuICAgIHJldHVybiB2O1xuICB9LFxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBUSFJFRS5CQVMuRGVwdGhBbmltYXRpb25NYXRlcmlhbCBmb3Igc2hhZG93cyBmcm9tIGEgVEhSRUUuU3BvdExpZ2h0IG9yIFRIUkVFLkRpcmVjdGlvbmFsTGlnaHQgYnkgY29weWluZyByZWxldmFudCBzaGFkZXIgY2h1bmtzLlxuICAgKiBVbmlmb3JtIHZhbHVlcyBtdXN0IGJlIG1hbnVhbGx5IHN5bmNlZCBiZXR3ZWVuIHRoZSBzb3VyY2UgbWF0ZXJpYWwgYW5kIHRoZSBkZXB0aCBtYXRlcmlhbC5cbiAgICpcbiAgICogQHNlZSB7QGxpbmsgaHR0cDovL3RocmVlLWJhcy1leGFtcGxlcy5zdXJnZS5zaC9leGFtcGxlcy9zaGFkb3dzL31cbiAgICpcbiAgICogQHBhcmFtIHtUSFJFRS5CQVMuQmFzZUFuaW1hdGlvbk1hdGVyaWFsfSBzb3VyY2VNYXRlcmlhbCBJbnN0YW5jZSB0byBnZXQgdGhlIHNoYWRlciBjaHVua3MgZnJvbS5cbiAgICogQHJldHVybnMge1RIUkVFLkJBUy5EZXB0aEFuaW1hdGlvbk1hdGVyaWFsfVxuICAgKi9cbiAgY3JlYXRlRGVwdGhBbmltYXRpb25NYXRlcmlhbDogZnVuY3Rpb24oc291cmNlTWF0ZXJpYWwpIHtcbiAgICByZXR1cm4gbmV3IERlcHRoQW5pbWF0aW9uTWF0ZXJpYWwoe1xuICAgICAgdW5pZm9ybXM6IHNvdXJjZU1hdGVyaWFsLnVuaWZvcm1zLFxuICAgICAgZGVmaW5lczogc291cmNlTWF0ZXJpYWwuZGVmaW5lcyxcbiAgICAgIHZlcnRleEZ1bmN0aW9uczogc291cmNlTWF0ZXJpYWwudmVydGV4RnVuY3Rpb25zLFxuICAgICAgdmVydGV4UGFyYW1ldGVyczogc291cmNlTWF0ZXJpYWwudmVydGV4UGFyYW1ldGVycyxcbiAgICAgIHZlcnRleEluaXQ6IHNvdXJjZU1hdGVyaWFsLnZlcnRleEluaXQsXG4gICAgICB2ZXJ0ZXhQb3NpdGlvbjogc291cmNlTWF0ZXJpYWwudmVydGV4UG9zaXRpb25cbiAgICB9KTtcbiAgfSxcblxuICAvKipcbiAgICogQ3JlYXRlIGEgVEhSRUUuQkFTLkRpc3RhbmNlQW5pbWF0aW9uTWF0ZXJpYWwgZm9yIHNoYWRvd3MgZnJvbSBhIFRIUkVFLlBvaW50TGlnaHQgYnkgY29weWluZyByZWxldmFudCBzaGFkZXIgY2h1bmtzLlxuICAgKiBVbmlmb3JtIHZhbHVlcyBtdXN0IGJlIG1hbnVhbGx5IHN5bmNlZCBiZXR3ZWVuIHRoZSBzb3VyY2UgbWF0ZXJpYWwgYW5kIHRoZSBkaXN0YW5jZSBtYXRlcmlhbC5cbiAgICpcbiAgICogQHNlZSB7QGxpbmsgaHR0cDovL3RocmVlLWJhcy1leGFtcGxlcy5zdXJnZS5zaC9leGFtcGxlcy9zaGFkb3dzL31cbiAgICpcbiAgICogQHBhcmFtIHtUSFJFRS5CQVMuQmFzZUFuaW1hdGlvbk1hdGVyaWFsfSBzb3VyY2VNYXRlcmlhbCBJbnN0YW5jZSB0byBnZXQgdGhlIHNoYWRlciBjaHVua3MgZnJvbS5cbiAgICogQHJldHVybnMge1RIUkVFLkJBUy5EaXN0YW5jZUFuaW1hdGlvbk1hdGVyaWFsfVxuICAgKi9cbiAgY3JlYXRlRGlzdGFuY2VBbmltYXRpb25NYXRlcmlhbDogZnVuY3Rpb24oc291cmNlTWF0ZXJpYWwpIHtcbiAgICByZXR1cm4gbmV3IERpc3RhbmNlQW5pbWF0aW9uTWF0ZXJpYWwoe1xuICAgICAgdW5pZm9ybXM6IHNvdXJjZU1hdGVyaWFsLnVuaWZvcm1zLFxuICAgICAgZGVmaW5lczogc291cmNlTWF0ZXJpYWwuZGVmaW5lcyxcbiAgICAgIHZlcnRleEZ1bmN0aW9uczogc291cmNlTWF0ZXJpYWwudmVydGV4RnVuY3Rpb25zLFxuICAgICAgdmVydGV4UGFyYW1ldGVyczogc291cmNlTWF0ZXJpYWwudmVydGV4UGFyYW1ldGVycyxcbiAgICAgIHZlcnRleEluaXQ6IHNvdXJjZU1hdGVyaWFsLnZlcnRleEluaXQsXG4gICAgICB2ZXJ0ZXhQb3NpdGlvbjogc291cmNlTWF0ZXJpYWwudmVydGV4UG9zaXRpb25cbiAgICB9KTtcbiAgfVxufTtcblxuZXhwb3J0IHsgVXRpbHMgfTtcbiIsImltcG9ydCB7IEJ1ZmZlckdlb21ldHJ5LCBCdWZmZXJBdHRyaWJ1dGUgfSBmcm9tICd0aHJlZSc7XG5pbXBvcnQgeyBVdGlscyB9IGZyb20gJy4uL1V0aWxzJztcblxuLyoqXG4gKiBBIFRIUkVFLkJ1ZmZlckdlb21ldHJ5IGZvciBhbmltYXRpbmcgaW5kaXZpZHVhbCBmYWNlcyBvZiBhIFRIUkVFLkdlb21ldHJ5LlxuICpcbiAqIEBwYXJhbSB7VEhSRUUuR2VvbWV0cnl9IG1vZGVsIFRoZSBUSFJFRS5HZW9tZXRyeSB0byBiYXNlIHRoaXMgZ2VvbWV0cnkgb24uXG4gKiBAcGFyYW0ge09iamVjdD19IG9wdGlvbnNcbiAqIEBwYXJhbSB7Qm9vbGVhbj19IG9wdGlvbnMuY29tcHV0ZUNlbnRyb2lkcyBJZiB0cnVlLCBhIGNlbnRyb2lkcyB3aWxsIGJlIGNvbXB1dGVkIGZvciBlYWNoIGZhY2UgYW5kIHN0b3JlZCBpbiBUSFJFRS5CQVMuTW9kZWxCdWZmZXJHZW9tZXRyeS5jZW50cm9pZHMuXG4gKiBAcGFyYW0ge0Jvb2xlYW49fSBvcHRpb25zLmxvY2FsaXplRmFjZXMgSWYgdHJ1ZSwgdGhlIHBvc2l0aW9ucyBmb3IgZWFjaCBmYWNlIHdpbGwgYmUgc3RvcmVkIHJlbGF0aXZlIHRvIHRoZSBjZW50cm9pZC4gVGhpcyBpcyB1c2VmdWwgaWYgeW91IHdhbnQgdG8gcm90YXRlIG9yIHNjYWxlIGZhY2VzIGFyb3VuZCB0aGVpciBjZW50ZXIuXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gTW9kZWxCdWZmZXJHZW9tZXRyeShtb2RlbCwgb3B0aW9ucykge1xuICBCdWZmZXJHZW9tZXRyeS5jYWxsKHRoaXMpO1xuXG4gIC8qKlxuICAgKiBBIHJlZmVyZW5jZSB0byB0aGUgZ2VvbWV0cnkgdXNlZCB0byBjcmVhdGUgdGhpcyBpbnN0YW5jZS5cbiAgICogQHR5cGUge1RIUkVFLkdlb21ldHJ5fVxuICAgKi9cbiAgdGhpcy5tb2RlbEdlb21ldHJ5ID0gbW9kZWw7XG5cbiAgLyoqXG4gICAqIE51bWJlciBvZiBmYWNlcyBvZiB0aGUgbW9kZWwuXG4gICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAqL1xuICB0aGlzLmZhY2VDb3VudCA9IHRoaXMubW9kZWxHZW9tZXRyeS5mYWNlcy5sZW5ndGg7XG5cbiAgLyoqXG4gICAqIE51bWJlciBvZiB2ZXJ0aWNlcyBvZiB0aGUgbW9kZWwuXG4gICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAqL1xuICB0aGlzLnZlcnRleENvdW50ID0gdGhpcy5tb2RlbEdlb21ldHJ5LnZlcnRpY2VzLmxlbmd0aDtcblxuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgb3B0aW9ucy5jb21wdXRlQ2VudHJvaWRzICYmIHRoaXMuY29tcHV0ZUNlbnRyb2lkcygpO1xuXG4gIHRoaXMuYnVmZmVySW5kaWNlcygpO1xuICB0aGlzLmJ1ZmZlclBvc2l0aW9ucyhvcHRpb25zLmxvY2FsaXplRmFjZXMpO1xufVxuTW9kZWxCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZSk7XG5Nb2RlbEJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IE1vZGVsQnVmZmVyR2VvbWV0cnk7XG5cbi8qKlxuICogQ29tcHV0ZXMgYSBjZW50cm9pZCBmb3IgZWFjaCBmYWNlIGFuZCBzdG9yZXMgaXQgaW4gVEhSRUUuQkFTLk1vZGVsQnVmZmVyR2VvbWV0cnkuY2VudHJvaWRzLlxuICovXG5Nb2RlbEJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5jb21wdXRlQ2VudHJvaWRzID0gZnVuY3Rpb24oKSB7XG4gIC8qKlxuICAgKiBBbiBhcnJheSBvZiBjZW50cm9pZHMgY29ycmVzcG9uZGluZyB0byB0aGUgZmFjZXMgb2YgdGhlIG1vZGVsLlxuICAgKlxuICAgKiBAdHlwZSB7QXJyYXl9XG4gICAqL1xuICB0aGlzLmNlbnRyb2lkcyA9IFtdO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5mYWNlQ291bnQ7IGkrKykge1xuICAgIHRoaXMuY2VudHJvaWRzW2ldID0gVXRpbHMuY29tcHV0ZUNlbnRyb2lkKHRoaXMubW9kZWxHZW9tZXRyeSwgdGhpcy5tb2RlbEdlb21ldHJ5LmZhY2VzW2ldKTtcbiAgfVxufTtcblxuTW9kZWxCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuYnVmZmVySW5kaWNlcyA9IGZ1bmN0aW9uKCkge1xuICBjb25zdCBpbmRleEJ1ZmZlciA9IG5ldyBVaW50MzJBcnJheSh0aGlzLmZhY2VDb3VudCAqIDMpO1xuXG4gIHRoaXMuc2V0SW5kZXgobmV3IEJ1ZmZlckF0dHJpYnV0ZShpbmRleEJ1ZmZlciwgMSkpO1xuXG4gIGZvciAobGV0IGkgPSAwLCBvZmZzZXQgPSAwOyBpIDwgdGhpcy5mYWNlQ291bnQ7IGkrKywgb2Zmc2V0ICs9IDMpIHtcbiAgICBjb25zdCBmYWNlID0gdGhpcy5tb2RlbEdlb21ldHJ5LmZhY2VzW2ldO1xuXG4gICAgaW5kZXhCdWZmZXJbb2Zmc2V0ICAgIF0gPSBmYWNlLmE7XG4gICAgaW5kZXhCdWZmZXJbb2Zmc2V0ICsgMV0gPSBmYWNlLmI7XG4gICAgaW5kZXhCdWZmZXJbb2Zmc2V0ICsgMl0gPSBmYWNlLmM7XG4gIH1cbn07XG5cbk1vZGVsQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmJ1ZmZlclBvc2l0aW9ucyA9IGZ1bmN0aW9uKGxvY2FsaXplRmFjZXMpIHtcbiAgY29uc3QgcG9zaXRpb25CdWZmZXIgPSB0aGlzLmNyZWF0ZUF0dHJpYnV0ZSgncG9zaXRpb24nLCAzKS5hcnJheTtcbiAgbGV0IGksIG9mZnNldDtcblxuICBpZiAobG9jYWxpemVGYWNlcyA9PT0gdHJ1ZSkge1xuICAgIGZvciAoaSA9IDA7IGkgPCB0aGlzLmZhY2VDb3VudDsgaSsrKSB7XG4gICAgICBjb25zdCBmYWNlID0gdGhpcy5tb2RlbEdlb21ldHJ5LmZhY2VzW2ldO1xuICAgICAgY29uc3QgY2VudHJvaWQgPSB0aGlzLmNlbnRyb2lkcyA/IHRoaXMuY2VudHJvaWRzW2ldIDogVXRpbHMuY29tcHV0ZUNlbnRyb2lkKHRoaXMubW9kZWxHZW9tZXRyeSwgZmFjZSk7XG5cbiAgICAgIGNvbnN0IGEgPSB0aGlzLm1vZGVsR2VvbWV0cnkudmVydGljZXNbZmFjZS5hXTtcbiAgICAgIGNvbnN0IGIgPSB0aGlzLm1vZGVsR2VvbWV0cnkudmVydGljZXNbZmFjZS5iXTtcbiAgICAgIGNvbnN0IGMgPSB0aGlzLm1vZGVsR2VvbWV0cnkudmVydGljZXNbZmFjZS5jXTtcblxuICAgICAgcG9zaXRpb25CdWZmZXJbZmFjZS5hICogM10gICAgID0gYS54IC0gY2VudHJvaWQueDtcbiAgICAgIHBvc2l0aW9uQnVmZmVyW2ZhY2UuYSAqIDMgKyAxXSA9IGEueSAtIGNlbnRyb2lkLnk7XG4gICAgICBwb3NpdGlvbkJ1ZmZlcltmYWNlLmEgKiAzICsgMl0gPSBhLnogLSBjZW50cm9pZC56O1xuXG4gICAgICBwb3NpdGlvbkJ1ZmZlcltmYWNlLmIgKiAzXSAgICAgPSBiLnggLSBjZW50cm9pZC54O1xuICAgICAgcG9zaXRpb25CdWZmZXJbZmFjZS5iICogMyArIDFdID0gYi55IC0gY2VudHJvaWQueTtcbiAgICAgIHBvc2l0aW9uQnVmZmVyW2ZhY2UuYiAqIDMgKyAyXSA9IGIueiAtIGNlbnRyb2lkLno7XG5cbiAgICAgIHBvc2l0aW9uQnVmZmVyW2ZhY2UuYyAqIDNdICAgICA9IGMueCAtIGNlbnRyb2lkLng7XG4gICAgICBwb3NpdGlvbkJ1ZmZlcltmYWNlLmMgKiAzICsgMV0gPSBjLnkgLSBjZW50cm9pZC55O1xuICAgICAgcG9zaXRpb25CdWZmZXJbZmFjZS5jICogMyArIDJdID0gYy56IC0gY2VudHJvaWQuejtcbiAgICB9XG4gIH1cbiAgZWxzZSB7XG4gICAgZm9yIChpID0gMCwgb2Zmc2V0ID0gMDsgaSA8IHRoaXMudmVydGV4Q291bnQ7IGkrKywgb2Zmc2V0ICs9IDMpIHtcbiAgICAgIGNvbnN0IHZlcnRleCA9IHRoaXMubW9kZWxHZW9tZXRyeS52ZXJ0aWNlc1tpXTtcblxuICAgICAgcG9zaXRpb25CdWZmZXJbb2Zmc2V0ICAgIF0gPSB2ZXJ0ZXgueDtcbiAgICAgIHBvc2l0aW9uQnVmZmVyW29mZnNldCArIDFdID0gdmVydGV4Lnk7XG4gICAgICBwb3NpdGlvbkJ1ZmZlcltvZmZzZXQgKyAyXSA9IHZlcnRleC56O1xuICAgIH1cbiAgfVxufTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgVEhSRUUuQnVmZmVyQXR0cmlidXRlIHdpdGggVVYgY29vcmRpbmF0ZXMuXG4gKi9cbk1vZGVsQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmJ1ZmZlclV2cyA9IGZ1bmN0aW9uKCkge1xuICBjb25zdCB1dkJ1ZmZlciA9IHRoaXMuY3JlYXRlQXR0cmlidXRlKCd1dicsIDIpLmFycmF5O1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5mYWNlQ291bnQ7IGkrKykge1xuXG4gICAgY29uc3QgZmFjZSA9IHRoaXMubW9kZWxHZW9tZXRyeS5mYWNlc1tpXTtcbiAgICBsZXQgdXY7XG5cbiAgICB1diA9IHRoaXMubW9kZWxHZW9tZXRyeS5mYWNlVmVydGV4VXZzWzBdW2ldWzBdO1xuICAgIHV2QnVmZmVyW2ZhY2UuYSAqIDJdICAgICA9IHV2Lng7XG4gICAgdXZCdWZmZXJbZmFjZS5hICogMiArIDFdID0gdXYueTtcblxuICAgIHV2ID0gdGhpcy5tb2RlbEdlb21ldHJ5LmZhY2VWZXJ0ZXhVdnNbMF1baV1bMV07XG4gICAgdXZCdWZmZXJbZmFjZS5iICogMl0gICAgID0gdXYueDtcbiAgICB1dkJ1ZmZlcltmYWNlLmIgKiAyICsgMV0gPSB1di55O1xuXG4gICAgdXYgPSB0aGlzLm1vZGVsR2VvbWV0cnkuZmFjZVZlcnRleFV2c1swXVtpXVsyXTtcbiAgICB1dkJ1ZmZlcltmYWNlLmMgKiAyXSAgICAgPSB1di54O1xuICAgIHV2QnVmZmVyW2ZhY2UuYyAqIDIgKyAxXSA9IHV2Lnk7XG4gIH1cbn07XG5cbi8qKlxuICogQ3JlYXRlcyB0d28gVEhSRUUuQnVmZmVyQXR0cmlidXRlczogc2tpbkluZGV4IGFuZCBza2luV2VpZ2h0LiBCb3RoIGFyZSByZXF1aXJlZCBmb3Igc2tpbm5pbmcuXG4gKi9cbk1vZGVsQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmJ1ZmZlclNraW5uaW5nID0gZnVuY3Rpb24oKSB7XG4gIGNvbnN0IHNraW5JbmRleEJ1ZmZlciA9IHRoaXMuY3JlYXRlQXR0cmlidXRlKCdza2luSW5kZXgnLCA0KS5hcnJheTtcbiAgY29uc3Qgc2tpbldlaWdodEJ1ZmZlciA9IHRoaXMuY3JlYXRlQXR0cmlidXRlKCdza2luV2VpZ2h0JywgNCkuYXJyYXk7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnZlcnRleENvdW50OyBpKyspIHtcbiAgICBjb25zdCBza2luSW5kZXggPSB0aGlzLm1vZGVsR2VvbWV0cnkuc2tpbkluZGljZXNbaV07XG4gICAgY29uc3Qgc2tpbldlaWdodCA9IHRoaXMubW9kZWxHZW9tZXRyeS5za2luV2VpZ2h0c1tpXTtcblxuICAgIHNraW5JbmRleEJ1ZmZlcltpICogNCAgICBdID0gc2tpbkluZGV4Lng7XG4gICAgc2tpbkluZGV4QnVmZmVyW2kgKiA0ICsgMV0gPSBza2luSW5kZXgueTtcbiAgICBza2luSW5kZXhCdWZmZXJbaSAqIDQgKyAyXSA9IHNraW5JbmRleC56O1xuICAgIHNraW5JbmRleEJ1ZmZlcltpICogNCArIDNdID0gc2tpbkluZGV4Lnc7XG5cbiAgICBza2luV2VpZ2h0QnVmZmVyW2kgKiA0ICAgIF0gPSBza2luV2VpZ2h0Lng7XG4gICAgc2tpbldlaWdodEJ1ZmZlcltpICogNCArIDFdID0gc2tpbldlaWdodC55O1xuICAgIHNraW5XZWlnaHRCdWZmZXJbaSAqIDQgKyAyXSA9IHNraW5XZWlnaHQuejtcbiAgICBza2luV2VpZ2h0QnVmZmVyW2kgKiA0ICsgM10gPSBza2luV2VpZ2h0Lnc7XG4gIH1cbn07XG5cbi8qKlxuICogQ3JlYXRlcyBhIFRIUkVFLkJ1ZmZlckF0dHJpYnV0ZSBvbiB0aGlzIGdlb21ldHJ5IGluc3RhbmNlLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIE5hbWUgb2YgdGhlIGF0dHJpYnV0ZS5cbiAqIEBwYXJhbSB7aW50fSBpdGVtU2l6ZSBOdW1iZXIgb2YgZmxvYXRzIHBlciB2ZXJ0ZXggKHR5cGljYWxseSAxLCAyLCAzIG9yIDQpLlxuICogQHBhcmFtIHtmdW5jdGlvbj19IGZhY3RvcnkgRnVuY3Rpb24gdGhhdCB3aWxsIGJlIGNhbGxlZCBmb3IgZWFjaCBmYWNlIHVwb24gY3JlYXRpb24uIEFjY2VwdHMgMyBhcmd1bWVudHM6IGRhdGFbXSwgaW5kZXggYW5kIGZhY2VDb3VudC4gQ2FsbHMgc2V0RmFjZURhdGEuXG4gKlxuICogQHJldHVybnMge0J1ZmZlckF0dHJpYnV0ZX1cbiAqL1xuTW9kZWxCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuY3JlYXRlQXR0cmlidXRlID0gZnVuY3Rpb24obmFtZSwgaXRlbVNpemUsIGZhY3RvcnkpIHtcbiAgY29uc3QgYnVmZmVyID0gbmV3IEZsb2F0MzJBcnJheSh0aGlzLnZlcnRleENvdW50ICogaXRlbVNpemUpO1xuICBjb25zdCBhdHRyaWJ1dGUgPSBuZXcgQnVmZmVyQXR0cmlidXRlKGJ1ZmZlciwgaXRlbVNpemUpO1xuXG4gIHRoaXMuYWRkQXR0cmlidXRlKG5hbWUsIGF0dHJpYnV0ZSk7XG5cbiAgaWYgKGZhY3RvcnkpIHtcbiAgICBjb25zdCBkYXRhID0gW107XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuZmFjZUNvdW50OyBpKyspIHtcbiAgICAgIGZhY3RvcnkoZGF0YSwgaSwgdGhpcy5mYWNlQ291bnQpO1xuICAgICAgdGhpcy5zZXRGYWNlRGF0YShhdHRyaWJ1dGUsIGksIGRhdGEpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBhdHRyaWJ1dGU7XG59O1xuXG4vKipcbiAqIFNldHMgZGF0YSBmb3IgYWxsIHZlcnRpY2VzIG9mIGEgZmFjZSBhdCBhIGdpdmVuIGluZGV4LlxuICogVXN1YWxseSBjYWxsZWQgaW4gYSBsb29wLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfFRIUkVFLkJ1ZmZlckF0dHJpYnV0ZX0gYXR0cmlidXRlIFRoZSBhdHRyaWJ1dGUgb3IgYXR0cmlidXRlIG5hbWUgd2hlcmUgdGhlIGRhdGEgaXMgdG8gYmUgc3RvcmVkLlxuICogQHBhcmFtIHtpbnR9IGZhY2VJbmRleCBJbmRleCBvZiB0aGUgZmFjZSBpbiB0aGUgYnVmZmVyIGdlb21ldHJ5LlxuICogQHBhcmFtIHtBcnJheX0gZGF0YSBBcnJheSBvZiBkYXRhLiBMZW5ndGggc2hvdWxkIGJlIGVxdWFsIHRvIGl0ZW0gc2l6ZSBvZiB0aGUgYXR0cmlidXRlLlxuICovXG5Nb2RlbEJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5zZXRGYWNlRGF0YSA9IGZ1bmN0aW9uKGF0dHJpYnV0ZSwgZmFjZUluZGV4LCBkYXRhKSB7XG4gIGF0dHJpYnV0ZSA9ICh0eXBlb2YgYXR0cmlidXRlID09PSAnc3RyaW5nJykgPyB0aGlzLmF0dHJpYnV0ZXNbYXR0cmlidXRlXSA6IGF0dHJpYnV0ZTtcblxuICBsZXQgb2Zmc2V0ID0gZmFjZUluZGV4ICogMyAqIGF0dHJpYnV0ZS5pdGVtU2l6ZTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IDM7IGkrKykge1xuICAgIGZvciAobGV0IGogPSAwOyBqIDwgYXR0cmlidXRlLml0ZW1TaXplOyBqKyspIHtcbiAgICAgIGF0dHJpYnV0ZS5hcnJheVtvZmZzZXQrK10gPSBkYXRhW2pdO1xuICAgIH1cbiAgfVxufTtcblxuZXhwb3J0IHsgTW9kZWxCdWZmZXJHZW9tZXRyeSB9O1xuIiwiaW1wb3J0IHsgQnVmZmVyR2VvbWV0cnksIEJ1ZmZlckF0dHJpYnV0ZSB9IGZyb20gJ3RocmVlJztcblxuLyoqXG4gKiBBIFRIUkVFLkJ1ZmZlckdlb21ldHJ5IGNvbnNpc3RzIG9mIHBvaW50cy5cbiAqIEBwYXJhbSB7TnVtYmVyfSBjb3VudCBUaGUgbnVtYmVyIG9mIHBvaW50cy5cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBQb2ludEJ1ZmZlckdlb21ldHJ5KGNvdW50KSB7XG4gIEJ1ZmZlckdlb21ldHJ5LmNhbGwodGhpcyk7XG5cbiAgLyoqXG4gICAqIE51bWJlciBvZiBwb2ludHMuXG4gICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAqL1xuICB0aGlzLnBvaW50Q291bnQgPSBjb3VudDtcblxuICB0aGlzLmJ1ZmZlclBvc2l0aW9ucygpO1xufVxuUG9pbnRCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZSk7XG5Qb2ludEJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFBvaW50QnVmZmVyR2VvbWV0cnk7XG5cblBvaW50QnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmJ1ZmZlclBvc2l0aW9ucyA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLmNyZWF0ZUF0dHJpYnV0ZSgncG9zaXRpb24nLCAzKTtcbn07XG5cbi8qKlxuICogQ3JlYXRlcyBhIFRIUkVFLkJ1ZmZlckF0dHJpYnV0ZSBvbiB0aGlzIGdlb21ldHJ5IGluc3RhbmNlLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIE5hbWUgb2YgdGhlIGF0dHJpYnV0ZS5cbiAqIEBwYXJhbSB7TnVtYmVyfSBpdGVtU2l6ZSBOdW1iZXIgb2YgZmxvYXRzIHBlciB2ZXJ0ZXggKHR5cGljYWxseSAxLCAyLCAzIG9yIDQpLlxuICogQHBhcmFtIHtmdW5jdGlvbj19IGZhY3RvcnkgRnVuY3Rpb24gdGhhdCB3aWxsIGJlIGNhbGxlZCBmb3IgZWFjaCBwb2ludCB1cG9uIGNyZWF0aW9uLiBBY2NlcHRzIDMgYXJndW1lbnRzOiBkYXRhW10sIGluZGV4IGFuZCBwcmVmYWJDb3VudC4gQ2FsbHMgc2V0UG9pbnREYXRhLlxuICpcbiAqIEByZXR1cm5zIHtUSFJFRS5CdWZmZXJBdHRyaWJ1dGV9XG4gKi9cblBvaW50QnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmNyZWF0ZUF0dHJpYnV0ZSA9IGZ1bmN0aW9uKG5hbWUsIGl0ZW1TaXplLCBmYWN0b3J5KSB7XG4gIGNvbnN0IGJ1ZmZlciA9IG5ldyBGbG9hdDMyQXJyYXkodGhpcy5wb2ludENvdW50ICogaXRlbVNpemUpO1xuICBjb25zdCBhdHRyaWJ1dGUgPSBuZXcgQnVmZmVyQXR0cmlidXRlKGJ1ZmZlciwgaXRlbVNpemUpO1xuXG4gIHRoaXMuYWRkQXR0cmlidXRlKG5hbWUsIGF0dHJpYnV0ZSk7XG5cbiAgaWYgKGZhY3RvcnkpIHtcbiAgICBjb25zdCBkYXRhID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnBvaW50Q291bnQ7IGkrKykge1xuICAgICAgZmFjdG9yeShkYXRhLCBpLCB0aGlzLnBvaW50Q291bnQpO1xuICAgICAgdGhpcy5zZXRQb2ludERhdGEoYXR0cmlidXRlLCBpLCBkYXRhKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gYXR0cmlidXRlO1xufTtcblxuUG9pbnRCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuc2V0UG9pbnREYXRhID0gZnVuY3Rpb24oYXR0cmlidXRlLCBwb2ludEluZGV4LCBkYXRhKSB7XG4gIGF0dHJpYnV0ZSA9ICh0eXBlb2YgYXR0cmlidXRlID09PSAnc3RyaW5nJykgPyB0aGlzLmF0dHJpYnV0ZXNbYXR0cmlidXRlXSA6IGF0dHJpYnV0ZTtcblxuICBsZXQgb2Zmc2V0ID0gcG9pbnRJbmRleCAqIGF0dHJpYnV0ZS5pdGVtU2l6ZTtcblxuICBmb3IgKGxldCBqID0gMDsgaiA8IGF0dHJpYnV0ZS5pdGVtU2l6ZTsgaisrKSB7XG4gICAgYXR0cmlidXRlLmFycmF5W29mZnNldCsrXSA9IGRhdGFbal07XG4gIH1cbn07XG5cbmV4cG9ydCB7IFBvaW50QnVmZmVyR2VvbWV0cnkgfTtcbiIsIi8vIGdlbmVyYXRlZCBieSBzY3JpcHRzL2J1aWxkX3NoYWRlcl9jaHVua3MuanNcblxuaW1wb3J0IGNhdG11bGxfcm9tX3NwbGluZSBmcm9tICcuL2dsc2wvY2F0bXVsbF9yb21fc3BsaW5lLmdsc2wnO1xuaW1wb3J0IGN1YmljX2JlemllciBmcm9tICcuL2dsc2wvY3ViaWNfYmV6aWVyLmdsc2wnO1xuaW1wb3J0IGVhc2VfYmFja19pbiBmcm9tICcuL2dsc2wvZWFzZV9iYWNrX2luLmdsc2wnO1xuaW1wb3J0IGVhc2VfYmFja19pbl9vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfYmFja19pbl9vdXQuZ2xzbCc7XG5pbXBvcnQgZWFzZV9iYWNrX291dCBmcm9tICcuL2dsc2wvZWFzZV9iYWNrX291dC5nbHNsJztcbmltcG9ydCBlYXNlX2JlemllciBmcm9tICcuL2dsc2wvZWFzZV9iZXppZXIuZ2xzbCc7XG5pbXBvcnQgZWFzZV9ib3VuY2VfaW4gZnJvbSAnLi9nbHNsL2Vhc2VfYm91bmNlX2luLmdsc2wnO1xuaW1wb3J0IGVhc2VfYm91bmNlX2luX291dCBmcm9tICcuL2dsc2wvZWFzZV9ib3VuY2VfaW5fb3V0Lmdsc2wnO1xuaW1wb3J0IGVhc2VfYm91bmNlX291dCBmcm9tICcuL2dsc2wvZWFzZV9ib3VuY2Vfb3V0Lmdsc2wnO1xuaW1wb3J0IGVhc2VfY2lyY19pbiBmcm9tICcuL2dsc2wvZWFzZV9jaXJjX2luLmdsc2wnO1xuaW1wb3J0IGVhc2VfY2lyY19pbl9vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfY2lyY19pbl9vdXQuZ2xzbCc7XG5pbXBvcnQgZWFzZV9jaXJjX291dCBmcm9tICcuL2dsc2wvZWFzZV9jaXJjX291dC5nbHNsJztcbmltcG9ydCBlYXNlX2N1YmljX2luIGZyb20gJy4vZ2xzbC9lYXNlX2N1YmljX2luLmdsc2wnO1xuaW1wb3J0IGVhc2VfY3ViaWNfaW5fb3V0IGZyb20gJy4vZ2xzbC9lYXNlX2N1YmljX2luX291dC5nbHNsJztcbmltcG9ydCBlYXNlX2N1YmljX291dCBmcm9tICcuL2dsc2wvZWFzZV9jdWJpY19vdXQuZ2xzbCc7XG5pbXBvcnQgZWFzZV9lbGFzdGljX2luIGZyb20gJy4vZ2xzbC9lYXNlX2VsYXN0aWNfaW4uZ2xzbCc7XG5pbXBvcnQgZWFzZV9lbGFzdGljX2luX291dCBmcm9tICcuL2dsc2wvZWFzZV9lbGFzdGljX2luX291dC5nbHNsJztcbmltcG9ydCBlYXNlX2VsYXN0aWNfb3V0IGZyb20gJy4vZ2xzbC9lYXNlX2VsYXN0aWNfb3V0Lmdsc2wnO1xuaW1wb3J0IGVhc2VfZXhwb19pbiBmcm9tICcuL2dsc2wvZWFzZV9leHBvX2luLmdsc2wnO1xuaW1wb3J0IGVhc2VfZXhwb19pbl9vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfZXhwb19pbl9vdXQuZ2xzbCc7XG5pbXBvcnQgZWFzZV9leHBvX291dCBmcm9tICcuL2dsc2wvZWFzZV9leHBvX291dC5nbHNsJztcbmltcG9ydCBlYXNlX3F1YWRfaW4gZnJvbSAnLi9nbHNsL2Vhc2VfcXVhZF9pbi5nbHNsJztcbmltcG9ydCBlYXNlX3F1YWRfaW5fb3V0IGZyb20gJy4vZ2xzbC9lYXNlX3F1YWRfaW5fb3V0Lmdsc2wnO1xuaW1wb3J0IGVhc2VfcXVhZF9vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfcXVhZF9vdXQuZ2xzbCc7XG5pbXBvcnQgZWFzZV9xdWFydF9pbiBmcm9tICcuL2dsc2wvZWFzZV9xdWFydF9pbi5nbHNsJztcbmltcG9ydCBlYXNlX3F1YXJ0X2luX291dCBmcm9tICcuL2dsc2wvZWFzZV9xdWFydF9pbl9vdXQuZ2xzbCc7XG5pbXBvcnQgZWFzZV9xdWFydF9vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfcXVhcnRfb3V0Lmdsc2wnO1xuaW1wb3J0IGVhc2VfcXVpbnRfaW4gZnJvbSAnLi9nbHNsL2Vhc2VfcXVpbnRfaW4uZ2xzbCc7XG5pbXBvcnQgZWFzZV9xdWludF9pbl9vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfcXVpbnRfaW5fb3V0Lmdsc2wnO1xuaW1wb3J0IGVhc2VfcXVpbnRfb3V0IGZyb20gJy4vZ2xzbC9lYXNlX3F1aW50X291dC5nbHNsJztcbmltcG9ydCBlYXNlX3NpbmVfaW4gZnJvbSAnLi9nbHNsL2Vhc2Vfc2luZV9pbi5nbHNsJztcbmltcG9ydCBlYXNlX3NpbmVfaW5fb3V0IGZyb20gJy4vZ2xzbC9lYXNlX3NpbmVfaW5fb3V0Lmdsc2wnO1xuaW1wb3J0IGVhc2Vfc2luZV9vdXQgZnJvbSAnLi9nbHNsL2Vhc2Vfc2luZV9vdXQuZ2xzbCc7XG5pbXBvcnQgcXVhZHJhdGljX2JlemllciBmcm9tICcuL2dsc2wvcXVhZHJhdGljX2Jlemllci5nbHNsJztcbmltcG9ydCBxdWF0ZXJuaW9uX3JvdGF0aW9uIGZyb20gJy4vZ2xzbC9xdWF0ZXJuaW9uX3JvdGF0aW9uLmdsc2wnO1xuaW1wb3J0IHF1YXRlcm5pb25fc2xlcnAgZnJvbSAnLi9nbHNsL3F1YXRlcm5pb25fc2xlcnAuZ2xzbCc7XG5cblxuZXhwb3J0IGNvbnN0IFNoYWRlckNodW5rID0ge1xuICBjYXRtdWxsX3JvbV9zcGxpbmU6IGNhdG11bGxfcm9tX3NwbGluZSxcbiAgY3ViaWNfYmV6aWVyOiBjdWJpY19iZXppZXIsXG4gIGVhc2VfYmFja19pbjogZWFzZV9iYWNrX2luLFxuICBlYXNlX2JhY2tfaW5fb3V0OiBlYXNlX2JhY2tfaW5fb3V0LFxuICBlYXNlX2JhY2tfb3V0OiBlYXNlX2JhY2tfb3V0LFxuICBlYXNlX2JlemllcjogZWFzZV9iZXppZXIsXG4gIGVhc2VfYm91bmNlX2luOiBlYXNlX2JvdW5jZV9pbixcbiAgZWFzZV9ib3VuY2VfaW5fb3V0OiBlYXNlX2JvdW5jZV9pbl9vdXQsXG4gIGVhc2VfYm91bmNlX291dDogZWFzZV9ib3VuY2Vfb3V0LFxuICBlYXNlX2NpcmNfaW46IGVhc2VfY2lyY19pbixcbiAgZWFzZV9jaXJjX2luX291dDogZWFzZV9jaXJjX2luX291dCxcbiAgZWFzZV9jaXJjX291dDogZWFzZV9jaXJjX291dCxcbiAgZWFzZV9jdWJpY19pbjogZWFzZV9jdWJpY19pbixcbiAgZWFzZV9jdWJpY19pbl9vdXQ6IGVhc2VfY3ViaWNfaW5fb3V0LFxuICBlYXNlX2N1YmljX291dDogZWFzZV9jdWJpY19vdXQsXG4gIGVhc2VfZWxhc3RpY19pbjogZWFzZV9lbGFzdGljX2luLFxuICBlYXNlX2VsYXN0aWNfaW5fb3V0OiBlYXNlX2VsYXN0aWNfaW5fb3V0LFxuICBlYXNlX2VsYXN0aWNfb3V0OiBlYXNlX2VsYXN0aWNfb3V0LFxuICBlYXNlX2V4cG9faW46IGVhc2VfZXhwb19pbixcbiAgZWFzZV9leHBvX2luX291dDogZWFzZV9leHBvX2luX291dCxcbiAgZWFzZV9leHBvX291dDogZWFzZV9leHBvX291dCxcbiAgZWFzZV9xdWFkX2luOiBlYXNlX3F1YWRfaW4sXG4gIGVhc2VfcXVhZF9pbl9vdXQ6IGVhc2VfcXVhZF9pbl9vdXQsXG4gIGVhc2VfcXVhZF9vdXQ6IGVhc2VfcXVhZF9vdXQsXG4gIGVhc2VfcXVhcnRfaW46IGVhc2VfcXVhcnRfaW4sXG4gIGVhc2VfcXVhcnRfaW5fb3V0OiBlYXNlX3F1YXJ0X2luX291dCxcbiAgZWFzZV9xdWFydF9vdXQ6IGVhc2VfcXVhcnRfb3V0LFxuICBlYXNlX3F1aW50X2luOiBlYXNlX3F1aW50X2luLFxuICBlYXNlX3F1aW50X2luX291dDogZWFzZV9xdWludF9pbl9vdXQsXG4gIGVhc2VfcXVpbnRfb3V0OiBlYXNlX3F1aW50X291dCxcbiAgZWFzZV9zaW5lX2luOiBlYXNlX3NpbmVfaW4sXG4gIGVhc2Vfc2luZV9pbl9vdXQ6IGVhc2Vfc2luZV9pbl9vdXQsXG4gIGVhc2Vfc2luZV9vdXQ6IGVhc2Vfc2luZV9vdXQsXG4gIHF1YWRyYXRpY19iZXppZXI6IHF1YWRyYXRpY19iZXppZXIsXG4gIHF1YXRlcm5pb25fcm90YXRpb246IHF1YXRlcm5pb25fcm90YXRpb24sXG4gIHF1YXRlcm5pb25fc2xlcnA6IHF1YXRlcm5pb25fc2xlcnAsXG5cbn07XG5cbiIsIi8qKlxuICogQSB0aW1lbGluZSB0cmFuc2l0aW9uIHNlZ21lbnQuIEFuIGluc3RhbmNlIG9mIHRoaXMgY2xhc3MgaXMgY3JlYXRlZCBpbnRlcm5hbGx5IHdoZW4gY2FsbGluZyB7QGxpbmsgVEhSRUUuQkFTLlRpbWVsaW5lLmFkZH0sIHNvIHlvdSBzaG91bGQgbm90IHVzZSB0aGlzIGNsYXNzIGRpcmVjdGx5LlxuICogVGhlIGluc3RhbmNlIGlzIGFsc28gcGFzc2VkIHRoZSB0aGUgY29tcGlsZXIgZnVuY3Rpb24gaWYgeW91IHJlZ2lzdGVyIGEgdHJhbnNpdGlvbiB0aHJvdWdoIHtAbGluayBUSFJFRS5CQVMuVGltZWxpbmUucmVnaXN0ZXJ9LiBUaGVyZSB5b3UgY2FuIHVzZSB0aGUgcHVibGljIHByb3BlcnRpZXMgb2YgdGhlIHNlZ21lbnQgdG8gY29tcGlsZSB0aGUgZ2xzbCBzdHJpbmcuXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IEEgc3RyaW5nIGtleSBnZW5lcmF0ZWQgYnkgdGhlIHRpbWVsaW5lIHRvIHdoaWNoIHRoaXMgc2VnbWVudCBiZWxvbmdzLiBLZXlzIGFyZSB1bmlxdWUuXG4gKiBAcGFyYW0ge251bWJlcn0gc3RhcnQgU3RhcnQgdGltZSBvZiB0aGlzIHNlZ21lbnQgaW4gYSB0aW1lbGluZSBpbiBzZWNvbmRzLlxuICogQHBhcmFtIHtudW1iZXJ9IGR1cmF0aW9uIER1cmF0aW9uIG9mIHRoaXMgc2VnbWVudCBpbiBzZWNvbmRzLlxuICogQHBhcmFtIHtvYmplY3R9IHRyYW5zaXRpb24gT2JqZWN0IGRlc2NyaWJpbmcgdGhlIHRyYW5zaXRpb24uXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBjb21waWxlciBBIHJlZmVyZW5jZSB0byB0aGUgY29tcGlsZXIgZnVuY3Rpb24gZnJvbSBhIHRyYW5zaXRpb24gZGVmaW5pdGlvbi5cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBUaW1lbGluZVNlZ21lbnQoa2V5LCBzdGFydCwgZHVyYXRpb24sIHRyYW5zaXRpb24sIGNvbXBpbGVyKSB7XG4gIHRoaXMua2V5ID0ga2V5O1xuICB0aGlzLnN0YXJ0ID0gc3RhcnQ7XG4gIHRoaXMuZHVyYXRpb24gPSBkdXJhdGlvbjtcbiAgdGhpcy50cmFuc2l0aW9uID0gdHJhbnNpdGlvbjtcbiAgdGhpcy5jb21waWxlciA9IGNvbXBpbGVyO1xuXG4gIHRoaXMudHJhaWwgPSAwO1xufVxuXG5UaW1lbGluZVNlZ21lbnQucHJvdG90eXBlLmNvbXBpbGUgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMuY29tcGlsZXIodGhpcyk7XG59O1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoVGltZWxpbmVTZWdtZW50LnByb3RvdHlwZSwgJ2VuZCcsIHtcbiAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5zdGFydCArIHRoaXMuZHVyYXRpb247XG4gIH1cbn0pO1xuXG5leHBvcnQgeyBUaW1lbGluZVNlZ21lbnQgfTtcbiIsImltcG9ydCB7IFRpbWVsaW5lU2VnbWVudCB9IGZyb20gJy4vVGltZWxpbmVTZWdtZW50JztcblxuLyoqXG4gKiBBIHV0aWxpdHkgY2xhc3MgdG8gY3JlYXRlIGFuIGFuaW1hdGlvbiB0aW1lbGluZSB3aGljaCBjYW4gYmUgYmFrZWQgaW50byBhICh2ZXJ0ZXgpIHNoYWRlci5cbiAqIEJ5IGRlZmF1bHQgdGhlIHRpbWVsaW5lIHN1cHBvcnRzIHRyYW5zbGF0aW9uLCBzY2FsZSBhbmQgcm90YXRpb24uIFRoaXMgY2FuIGJlIGV4dGVuZGVkIG9yIG92ZXJyaWRkZW4uXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gVGltZWxpbmUoKSB7XG4gIC8qKlxuICAgKiBUaGUgdG90YWwgZHVyYXRpb24gb2YgdGhlIHRpbWVsaW5lIGluIHNlY29uZHMuXG4gICAqIEB0eXBlIHtudW1iZXJ9XG4gICAqL1xuICB0aGlzLmR1cmF0aW9uID0gMDtcblxuICAvKipcbiAgICogVGhlIG5hbWUgb2YgdGhlIHZhbHVlIHRoYXQgc2VnbWVudHMgd2lsbCB1c2UgdG8gcmVhZCB0aGUgdGltZS4gRGVmYXVsdHMgdG8gJ3RUaW1lJy5cbiAgICogQHR5cGUge3N0cmluZ31cbiAgICovXG4gIHRoaXMudGltZUtleSA9ICd0VGltZSc7XG5cbiAgdGhpcy5zZWdtZW50cyA9IHt9O1xuICB0aGlzLl9fa2V5ID0gMDtcbn1cblxuLy8gc3RhdGljIGRlZmluaXRpb25zIG1hcFxuVGltZWxpbmUuc2VnbWVudERlZmluaXRpb25zID0ge307XG5cbi8qKlxuICogUmVnaXN0ZXJzIGEgdHJhbnNpdGlvbiBkZWZpbml0aW9uIGZvciB1c2Ugd2l0aCB7QGxpbmsgVEhSRUUuQkFTLlRpbWVsaW5lLmFkZH0uXG4gKiBAcGFyYW0ge1N0cmluZ30ga2V5IE5hbWUgb2YgdGhlIHRyYW5zaXRpb24uIERlZmF1bHRzIGluY2x1ZGUgJ3NjYWxlJywgJ3JvdGF0ZScgYW5kICd0cmFuc2xhdGUnLlxuICogQHBhcmFtIHtPYmplY3R9IGRlZmluaXRpb25cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGRlZmluaXRpb24uY29tcGlsZXIgQSBmdW5jdGlvbiB0aGF0IGdlbmVyYXRlcyBhIGdsc2wgc3RyaW5nIGZvciBhIHRyYW5zaXRpb24gc2VnbWVudC4gQWNjZXB0cyBhIFRIUkVFLkJBUy5UaW1lbGluZVNlZ21lbnQgYXMgdGhlIHNvbGUgYXJndW1lbnQuXG4gKiBAcGFyYW0geyp9IGRlZmluaXRpb24uZGVmYXVsdEZyb20gVGhlIGluaXRpYWwgdmFsdWUgZm9yIGEgdHJhbnNmb3JtLmZyb20uIEZvciBleGFtcGxlLCB0aGUgZGVmYXVsdEZyb20gZm9yIGEgdHJhbnNsYXRpb24gaXMgVEhSRUUuVmVjdG9yMygwLCAwLCAwKS5cbiAqIEBzdGF0aWNcbiAqL1xuVGltZWxpbmUucmVnaXN0ZXIgPSBmdW5jdGlvbihrZXksIGRlZmluaXRpb24pIHtcbiAgVGltZWxpbmUuc2VnbWVudERlZmluaXRpb25zW2tleV0gPSBkZWZpbml0aW9uO1xuICBcbiAgcmV0dXJuIGRlZmluaXRpb247XG59O1xuXG4vKipcbiAqIEFkZCBhIHRyYW5zaXRpb24gdG8gdGhlIHRpbWVsaW5lLlxuICogQHBhcmFtIHtudW1iZXJ9IGR1cmF0aW9uIER1cmF0aW9uIGluIHNlY29uZHNcbiAqIEBwYXJhbSB7b2JqZWN0fSB0cmFuc2l0aW9ucyBBbiBvYmplY3QgY29udGFpbmluZyBvbmUgb3Igc2V2ZXJhbCB0cmFuc2l0aW9ucy4gVGhlIGtleXMgc2hvdWxkIG1hdGNoIHRyYW5zZm9ybSBkZWZpbml0aW9ucy5cbiAqIFRoZSB0cmFuc2l0aW9uIG9iamVjdCBmb3IgZWFjaCBrZXkgd2lsbCBiZSBwYXNzZWQgdG8gdGhlIG1hdGNoaW5nIGRlZmluaXRpb24ncyBjb21waWxlci4gSXQgY2FuIGhhdmUgYXJiaXRyYXJ5IHByb3BlcnRpZXMsIGJ1dCB0aGUgVGltZWxpbmUgZXhwZWN0cyBhdCBsZWFzdCBhICd0bycsICdmcm9tJyBhbmQgYW4gb3B0aW9uYWwgJ2Vhc2UnLlxuICogQHBhcmFtIHtudW1iZXJ8c3RyaW5nfSBbcG9zaXRpb25PZmZzZXRdIFBvc2l0aW9uIGluIHRoZSB0aW1lbGluZS4gRGVmYXVsdHMgdG8gdGhlIGVuZCBvZiB0aGUgdGltZWxpbmUuIElmIGEgbnVtYmVyIGlzIHByb3ZpZGVkLCB0aGUgdHJhbnNpdGlvbiB3aWxsIGJlIGluc2VydGVkIGF0IHRoYXQgdGltZSBpbiBzZWNvbmRzLiBTdHJpbmdzICgnKz14JyBvciAnLT14JykgY2FuIGJlIHVzZWQgZm9yIGEgdmFsdWUgcmVsYXRpdmUgdG8gdGhlIGVuZCBvZiB0aW1lbGluZS5cbiAqL1xuVGltZWxpbmUucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uKGR1cmF0aW9uLCB0cmFuc2l0aW9ucywgcG9zaXRpb25PZmZzZXQpIHtcbiAgLy8gc3RvcCByb2xsdXAgZnJvbSBjb21wbGFpbmluZyBhYm91dCBldmFsXG4gIGNvbnN0IF9ldmFsID0gZXZhbDtcbiAgXG4gIGxldCBzdGFydCA9IHRoaXMuZHVyYXRpb247XG5cbiAgaWYgKHBvc2l0aW9uT2Zmc2V0ICE9PSB1bmRlZmluZWQpIHtcbiAgICBpZiAodHlwZW9mIHBvc2l0aW9uT2Zmc2V0ID09PSAnbnVtYmVyJykge1xuICAgICAgc3RhcnQgPSBwb3NpdGlvbk9mZnNldDtcbiAgICB9XG4gICAgZWxzZSBpZiAodHlwZW9mIHBvc2l0aW9uT2Zmc2V0ID09PSAnc3RyaW5nJykge1xuICAgICAgX2V2YWwoJ3N0YXJ0JyArIHBvc2l0aW9uT2Zmc2V0KTtcbiAgICB9XG5cbiAgICB0aGlzLmR1cmF0aW9uID0gTWF0aC5tYXgodGhpcy5kdXJhdGlvbiwgc3RhcnQgKyBkdXJhdGlvbik7XG4gIH1cbiAgZWxzZSB7XG4gICAgdGhpcy5kdXJhdGlvbiArPSBkdXJhdGlvbjtcbiAgfVxuXG4gIGxldCBrZXlzID0gT2JqZWN0LmtleXModHJhbnNpdGlvbnMpLCBrZXk7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgaSsrKSB7XG4gICAga2V5ID0ga2V5c1tpXTtcblxuICAgIHRoaXMucHJvY2Vzc1RyYW5zaXRpb24oa2V5LCB0cmFuc2l0aW9uc1trZXldLCBzdGFydCwgZHVyYXRpb24pO1xuICB9XG59O1xuXG5UaW1lbGluZS5wcm90b3R5cGUucHJvY2Vzc1RyYW5zaXRpb24gPSBmdW5jdGlvbihrZXksIHRyYW5zaXRpb24sIHN0YXJ0LCBkdXJhdGlvbikge1xuICBjb25zdCBkZWZpbml0aW9uID0gVGltZWxpbmUuc2VnbWVudERlZmluaXRpb25zW2tleV07XG5cbiAgbGV0IHNlZ21lbnRzID0gdGhpcy5zZWdtZW50c1trZXldO1xuICBpZiAoIXNlZ21lbnRzKSBzZWdtZW50cyA9IHRoaXMuc2VnbWVudHNba2V5XSA9IFtdO1xuXG4gIGlmICh0cmFuc2l0aW9uLmZyb20gPT09IHVuZGVmaW5lZCkge1xuICAgIGlmIChzZWdtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHRyYW5zaXRpb24uZnJvbSA9IGRlZmluaXRpb24uZGVmYXVsdEZyb207XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgdHJhbnNpdGlvbi5mcm9tID0gc2VnbWVudHNbc2VnbWVudHMubGVuZ3RoIC0gMV0udHJhbnNpdGlvbi50bztcbiAgICB9XG4gIH1cblxuICBzZWdtZW50cy5wdXNoKG5ldyBUaW1lbGluZVNlZ21lbnQoKHRoaXMuX19rZXkrKykudG9TdHJpbmcoKSwgc3RhcnQsIGR1cmF0aW9uLCB0cmFuc2l0aW9uLCBkZWZpbml0aW9uLmNvbXBpbGVyKSk7XG59O1xuXG4vKipcbiAqIENvbXBpbGVzIHRoZSB0aW1lbGluZSBpbnRvIGEgZ2xzbCBzdHJpbmcgYXJyYXkgdGhhdCBjYW4gYmUgaW5qZWN0ZWQgaW50byBhICh2ZXJ0ZXgpIHNoYWRlci5cbiAqIEByZXR1cm5zIHtBcnJheX1cbiAqL1xuVGltZWxpbmUucHJvdG90eXBlLmNvbXBpbGUgPSBmdW5jdGlvbigpIHtcbiAgY29uc3QgYyA9IFtdO1xuXG4gIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyh0aGlzLnNlZ21lbnRzKTtcbiAgbGV0IHNlZ21lbnRzO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7IGkrKykge1xuICAgIHNlZ21lbnRzID0gdGhpcy5zZWdtZW50c1trZXlzW2ldXTtcblxuICAgIHRoaXMuZmlsbEdhcHMoc2VnbWVudHMpO1xuXG4gICAgc2VnbWVudHMuZm9yRWFjaChmdW5jdGlvbihzKSB7XG4gICAgICBjLnB1c2gocy5jb21waWxlKCkpO1xuICAgIH0pO1xuICB9XG5cbiAgcmV0dXJuIGM7XG59O1xuVGltZWxpbmUucHJvdG90eXBlLmZpbGxHYXBzID0gZnVuY3Rpb24oc2VnbWVudHMpIHtcbiAgaWYgKHNlZ21lbnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuO1xuXG4gIGxldCBzMCwgczE7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBzZWdtZW50cy5sZW5ndGggLSAxOyBpKyspIHtcbiAgICBzMCA9IHNlZ21lbnRzW2ldO1xuICAgIHMxID0gc2VnbWVudHNbaSArIDFdO1xuXG4gICAgczAudHJhaWwgPSBzMS5zdGFydCAtIHMwLmVuZDtcbiAgfVxuXG4gIC8vIHBhZCBsYXN0IHNlZ21lbnQgdW50aWwgZW5kIG9mIHRpbWVsaW5lXG4gIHMwID0gc2VnbWVudHNbc2VnbWVudHMubGVuZ3RoIC0gMV07XG4gIHMwLnRyYWlsID0gdGhpcy5kdXJhdGlvbiAtIHMwLmVuZDtcbn07XG5cbi8qKlxuICogR2V0IGEgY29tcGlsZWQgZ2xzbCBzdHJpbmcgd2l0aCBjYWxscyB0byB0cmFuc2Zvcm0gZnVuY3Rpb25zIGZvciBhIGdpdmVuIGtleS5cbiAqIFRoZSBvcmRlciBpbiB3aGljaCB0aGVzZSB0cmFuc2l0aW9ucyBhcmUgYXBwbGllZCBtYXR0ZXJzIGJlY2F1c2UgdGhleSBhbGwgb3BlcmF0ZSBvbiB0aGUgc2FtZSB2YWx1ZS5cbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgQSBrZXkgbWF0Y2hpbmcgYSB0cmFuc2Zvcm0gZGVmaW5pdGlvbi5cbiAqIEByZXR1cm5zIHtzdHJpbmd9XG4gKi9cblRpbWVsaW5lLnByb3RvdHlwZS5nZXRUcmFuc2Zvcm1DYWxscyA9IGZ1bmN0aW9uKGtleSkge1xuICBsZXQgdCA9IHRoaXMudGltZUtleTtcblxuICByZXR1cm4gdGhpcy5zZWdtZW50c1trZXldID8gIHRoaXMuc2VnbWVudHNba2V5XS5tYXAoZnVuY3Rpb24ocykge1xuICAgIHJldHVybiBgYXBwbHlUcmFuc2Zvcm0ke3Mua2V5fSgke3R9LCB0cmFuc2Zvcm1lZCk7YDtcbiAgfSkuam9pbignXFxuJykgOiAnJztcbn07XG5cbmV4cG9ydCB7IFRpbWVsaW5lIH1cbiIsImNvbnN0IFRpbWVsaW5lQ2h1bmtzID0ge1xuICB2ZWMzOiBmdW5jdGlvbihuLCB2LCBwKSB7XG4gICAgY29uc3QgeCA9ICh2LnggfHwgMCkudG9QcmVjaXNpb24ocCk7XG4gICAgY29uc3QgeSA9ICh2LnkgfHwgMCkudG9QcmVjaXNpb24ocCk7XG4gICAgY29uc3QgeiA9ICh2LnogfHwgMCkudG9QcmVjaXNpb24ocCk7XG5cbiAgICByZXR1cm4gYHZlYzMgJHtufSA9IHZlYzMoJHt4fSwgJHt5fSwgJHt6fSk7YDtcbiAgfSxcbiAgdmVjNDogZnVuY3Rpb24obiwgdiwgcCkge1xuICAgIGNvbnN0IHggPSAodi54IHx8IDApLnRvUHJlY2lzaW9uKHApO1xuICAgIGNvbnN0IHkgPSAodi55IHx8IDApLnRvUHJlY2lzaW9uKHApO1xuICAgIGNvbnN0IHogPSAodi56IHx8IDApLnRvUHJlY2lzaW9uKHApO1xuICAgIGNvbnN0IHcgPSAodi53IHx8IDApLnRvUHJlY2lzaW9uKHApO1xuICBcbiAgICByZXR1cm4gYHZlYzQgJHtufSA9IHZlYzQoJHt4fSwgJHt5fSwgJHt6fSwgJHt3fSk7YDtcbiAgfSxcbiAgZGVsYXlEdXJhdGlvbjogZnVuY3Rpb24oc2VnbWVudCkge1xuICAgIHJldHVybiBgXG4gICAgZmxvYXQgY0RlbGF5JHtzZWdtZW50LmtleX0gPSAke3NlZ21lbnQuc3RhcnQudG9QcmVjaXNpb24oNCl9O1xuICAgIGZsb2F0IGNEdXJhdGlvbiR7c2VnbWVudC5rZXl9ID0gJHtzZWdtZW50LmR1cmF0aW9uLnRvUHJlY2lzaW9uKDQpfTtcbiAgICBgO1xuICB9LFxuICBwcm9ncmVzczogZnVuY3Rpb24oc2VnbWVudCkge1xuICAgIC8vIHplcm8gZHVyYXRpb24gc2VnbWVudHMgc2hvdWxkIGFsd2F5cyByZW5kZXIgY29tcGxldGVcbiAgICBpZiAoc2VnbWVudC5kdXJhdGlvbiA9PT0gMCkge1xuICAgICAgcmV0dXJuIGBmbG9hdCBwcm9ncmVzcyA9IDEuMDtgXG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgcmV0dXJuIGBcbiAgICAgIGZsb2F0IHByb2dyZXNzID0gY2xhbXAodGltZSAtIGNEZWxheSR7c2VnbWVudC5rZXl9LCAwLjAsIGNEdXJhdGlvbiR7c2VnbWVudC5rZXl9KSAvIGNEdXJhdGlvbiR7c2VnbWVudC5rZXl9O1xuICAgICAgJHtzZWdtZW50LnRyYW5zaXRpb24uZWFzZSA/IGBwcm9ncmVzcyA9ICR7c2VnbWVudC50cmFuc2l0aW9uLmVhc2V9KHByb2dyZXNzJHsoc2VnbWVudC50cmFuc2l0aW9uLmVhc2VQYXJhbXMgPyBgLCAke3NlZ21lbnQudHJhbnNpdGlvbi5lYXNlUGFyYW1zLm1hcCgodikgPT4gdi50b1ByZWNpc2lvbig0KSkuam9pbihgLCBgKX1gIDogYGApfSk7YCA6IGBgfVxuICAgICAgYDtcbiAgICB9XG4gIH0sXG4gIHJlbmRlckNoZWNrOiBmdW5jdGlvbihzZWdtZW50KSB7XG4gICAgY29uc3Qgc3RhcnRUaW1lID0gc2VnbWVudC5zdGFydC50b1ByZWNpc2lvbig0KTtcbiAgICBjb25zdCBlbmRUaW1lID0gKHNlZ21lbnQuZW5kICsgc2VnbWVudC50cmFpbCkudG9QcmVjaXNpb24oNCk7XG5cbiAgICByZXR1cm4gYGlmICh0aW1lIDwgJHtzdGFydFRpbWV9IHx8IHRpbWUgPiAke2VuZFRpbWV9KSByZXR1cm47YDtcbiAgfVxufTtcblxuZXhwb3J0IHsgVGltZWxpbmVDaHVua3MgfTtcbiIsImltcG9ydCB7IFRpbWVsaW5lIH0gZnJvbSAnLi9UaW1lbGluZSc7XG5pbXBvcnQgeyBUaW1lbGluZUNodW5rcyB9IGZyb20gJy4vVGltZWxpbmVDaHVua3MnO1xuaW1wb3J0IHsgVmVjdG9yMyB9IGZyb20gJ3RocmVlJztcblxuY29uc3QgVHJhbnNsYXRpb25TZWdtZW50ID0ge1xuICBjb21waWxlcjogZnVuY3Rpb24oc2VnbWVudCkge1xuICAgIHJldHVybiBgXG4gICAgJHtUaW1lbGluZUNodW5rcy5kZWxheUR1cmF0aW9uKHNlZ21lbnQpfVxuICAgICR7VGltZWxpbmVDaHVua3MudmVjMyhgY1RyYW5zbGF0ZUZyb20ke3NlZ21lbnQua2V5fWAsIHNlZ21lbnQudHJhbnNpdGlvbi5mcm9tLCAyKX1cbiAgICAke1RpbWVsaW5lQ2h1bmtzLnZlYzMoYGNUcmFuc2xhdGVUbyR7c2VnbWVudC5rZXl9YCwgc2VnbWVudC50cmFuc2l0aW9uLnRvLCAyKX1cbiAgICBcbiAgICB2b2lkIGFwcGx5VHJhbnNmb3JtJHtzZWdtZW50LmtleX0oZmxvYXQgdGltZSwgaW5vdXQgdmVjMyB2KSB7XG4gICAgXG4gICAgICAke1RpbWVsaW5lQ2h1bmtzLnJlbmRlckNoZWNrKHNlZ21lbnQpfVxuICAgICAgJHtUaW1lbGluZUNodW5rcy5wcm9ncmVzcyhzZWdtZW50KX1cbiAgICBcbiAgICAgIHYgKz0gbWl4KGNUcmFuc2xhdGVGcm9tJHtzZWdtZW50LmtleX0sIGNUcmFuc2xhdGVUbyR7c2VnbWVudC5rZXl9LCBwcm9ncmVzcyk7XG4gICAgfVxuICAgIGA7XG4gIH0sXG4gIGRlZmF1bHRGcm9tOiBuZXcgVmVjdG9yMygwLCAwLCAwKVxufTtcblxuVGltZWxpbmUucmVnaXN0ZXIoJ3RyYW5zbGF0ZScsIFRyYW5zbGF0aW9uU2VnbWVudCk7XG5cbmV4cG9ydCB7IFRyYW5zbGF0aW9uU2VnbWVudCB9O1xuIiwiaW1wb3J0IHsgVGltZWxpbmUgfSBmcm9tICcuL1RpbWVsaW5lJztcbmltcG9ydCB7IFRpbWVsaW5lQ2h1bmtzIH0gZnJvbSAnLi9UaW1lbGluZUNodW5rcyc7XG5pbXBvcnQgeyBWZWN0b3IzIH0gZnJvbSAndGhyZWUnO1xuXG5jb25zdCBTY2FsZVNlZ21lbnQgPSB7XG4gIGNvbXBpbGVyOiBmdW5jdGlvbihzZWdtZW50KSB7XG4gICAgY29uc3Qgb3JpZ2luID0gc2VnbWVudC50cmFuc2l0aW9uLm9yaWdpbjtcbiAgICBcbiAgICByZXR1cm4gYFxuICAgICR7VGltZWxpbmVDaHVua3MuZGVsYXlEdXJhdGlvbihzZWdtZW50KX1cbiAgICAke1RpbWVsaW5lQ2h1bmtzLnZlYzMoYGNTY2FsZUZyb20ke3NlZ21lbnQua2V5fWAsIHNlZ21lbnQudHJhbnNpdGlvbi5mcm9tLCAyKX1cbiAgICAke1RpbWVsaW5lQ2h1bmtzLnZlYzMoYGNTY2FsZVRvJHtzZWdtZW50LmtleX1gLCBzZWdtZW50LnRyYW5zaXRpb24udG8sIDIpfVxuICAgICR7b3JpZ2luID8gVGltZWxpbmVDaHVua3MudmVjMyhgY09yaWdpbiR7c2VnbWVudC5rZXl9YCwgb3JpZ2luLCAyKSA6ICcnfVxuICAgIFxuICAgIHZvaWQgYXBwbHlUcmFuc2Zvcm0ke3NlZ21lbnQua2V5fShmbG9hdCB0aW1lLCBpbm91dCB2ZWMzIHYpIHtcbiAgICBcbiAgICAgICR7VGltZWxpbmVDaHVua3MucmVuZGVyQ2hlY2soc2VnbWVudCl9XG4gICAgICAke1RpbWVsaW5lQ2h1bmtzLnByb2dyZXNzKHNlZ21lbnQpfVxuICAgIFxuICAgICAgJHtvcmlnaW4gPyBgdiAtPSBjT3JpZ2luJHtzZWdtZW50LmtleX07YCA6ICcnfVxuICAgICAgdiAqPSBtaXgoY1NjYWxlRnJvbSR7c2VnbWVudC5rZXl9LCBjU2NhbGVUbyR7c2VnbWVudC5rZXl9LCBwcm9ncmVzcyk7XG4gICAgICAke29yaWdpbiA/IGB2ICs9IGNPcmlnaW4ke3NlZ21lbnQua2V5fTtgIDogJyd9XG4gICAgfVxuICAgIGA7XG4gIH0sXG4gIGRlZmF1bHRGcm9tOiBuZXcgVmVjdG9yMygxLCAxLCAxKVxufTtcblxuVGltZWxpbmUucmVnaXN0ZXIoJ3NjYWxlJywgU2NhbGVTZWdtZW50KTtcblxuZXhwb3J0IHsgU2NhbGVTZWdtZW50IH07XG4iLCJpbXBvcnQgeyBUaW1lbGluZSB9IGZyb20gJy4vVGltZWxpbmUnO1xuaW1wb3J0IHsgVGltZWxpbmVDaHVua3MgfSBmcm9tICcuL1RpbWVsaW5lQ2h1bmtzJztcbmltcG9ydCB7IFZlY3RvcjMsIFZlY3RvcjQgfSBmcm9tICd0aHJlZSc7XG5cbmNvbnN0IFJvdGF0aW9uU2VnbWVudCA9IHtcbiAgY29tcGlsZXIoc2VnbWVudCkge1xuICAgIGNvbnN0IGZyb21BeGlzQW5nbGUgPSBuZXcgVmVjdG9yNChcbiAgICAgIHNlZ21lbnQudHJhbnNpdGlvbi5mcm9tLmF4aXMueCxcbiAgICAgIHNlZ21lbnQudHJhbnNpdGlvbi5mcm9tLmF4aXMueSxcbiAgICAgIHNlZ21lbnQudHJhbnNpdGlvbi5mcm9tLmF4aXMueixcbiAgICAgIHNlZ21lbnQudHJhbnNpdGlvbi5mcm9tLmFuZ2xlXG4gICAgKTtcbiAgXG4gICAgY29uc3QgdG9BeGlzID0gc2VnbWVudC50cmFuc2l0aW9uLnRvLmF4aXMgfHwgc2VnbWVudC50cmFuc2l0aW9uLmZyb20uYXhpcztcbiAgICBjb25zdCB0b0F4aXNBbmdsZSA9IG5ldyBWZWN0b3I0KFxuICAgICAgdG9BeGlzLngsXG4gICAgICB0b0F4aXMueSxcbiAgICAgIHRvQXhpcy56LFxuICAgICAgc2VnbWVudC50cmFuc2l0aW9uLnRvLmFuZ2xlXG4gICAgKTtcbiAgXG4gICAgY29uc3Qgb3JpZ2luID0gc2VnbWVudC50cmFuc2l0aW9uLm9yaWdpbjtcbiAgICBcbiAgICByZXR1cm4gYFxuICAgICR7VGltZWxpbmVDaHVua3MuZGVsYXlEdXJhdGlvbihzZWdtZW50KX1cbiAgICAke1RpbWVsaW5lQ2h1bmtzLnZlYzQoYGNSb3RhdGlvbkZyb20ke3NlZ21lbnQua2V5fWAsIGZyb21BeGlzQW5nbGUsIDgpfVxuICAgICR7VGltZWxpbmVDaHVua3MudmVjNChgY1JvdGF0aW9uVG8ke3NlZ21lbnQua2V5fWAsIHRvQXhpc0FuZ2xlLCA4KX1cbiAgICAke29yaWdpbiA/IFRpbWVsaW5lQ2h1bmtzLnZlYzMoYGNPcmlnaW4ke3NlZ21lbnQua2V5fWAsIG9yaWdpbiwgMikgOiAnJ31cbiAgICBcbiAgICB2b2lkIGFwcGx5VHJhbnNmb3JtJHtzZWdtZW50LmtleX0oZmxvYXQgdGltZSwgaW5vdXQgdmVjMyB2KSB7XG4gICAgICAke1RpbWVsaW5lQ2h1bmtzLnJlbmRlckNoZWNrKHNlZ21lbnQpfVxuICAgICAgJHtUaW1lbGluZUNodW5rcy5wcm9ncmVzcyhzZWdtZW50KX1cblxuICAgICAgJHtvcmlnaW4gPyBgdiAtPSBjT3JpZ2luJHtzZWdtZW50LmtleX07YCA6ICcnfVxuICAgICAgdmVjMyBheGlzID0gbm9ybWFsaXplKG1peChjUm90YXRpb25Gcm9tJHtzZWdtZW50LmtleX0ueHl6LCBjUm90YXRpb25UbyR7c2VnbWVudC5rZXl9Lnh5eiwgcHJvZ3Jlc3MpKTtcbiAgICAgIGZsb2F0IGFuZ2xlID0gbWl4KGNSb3RhdGlvbkZyb20ke3NlZ21lbnQua2V5fS53LCBjUm90YXRpb25UbyR7c2VnbWVudC5rZXl9LncsIHByb2dyZXNzKTtcbiAgICAgIHZlYzQgcSA9IHF1YXRGcm9tQXhpc0FuZ2xlKGF4aXMsIGFuZ2xlKTtcbiAgICAgIHYgPSByb3RhdGVWZWN0b3IocSwgdik7XG4gICAgICAke29yaWdpbiA/IGB2ICs9IGNPcmlnaW4ke3NlZ21lbnQua2V5fTtgIDogJyd9XG4gICAgfVxuICAgIGA7XG4gIH0sXG4gIGRlZmF1bHRGcm9tOiB7YXhpczogbmV3IFZlY3RvcjMoKSwgYW5nbGU6IDB9XG59O1xuXG5UaW1lbGluZS5yZWdpc3Rlcigncm90YXRlJywgUm90YXRpb25TZWdtZW50KTtcblxuZXhwb3J0IHsgUm90YXRpb25TZWdtZW50IH07XG4iXSwibmFtZXMiOlsiQmFzZUFuaW1hdGlvbk1hdGVyaWFsIiwicGFyYW1ldGVycyIsInVuaWZvcm1zIiwiY2FsbCIsInVuaWZvcm1WYWx1ZXMiLCJzZXRWYWx1ZXMiLCJVbmlmb3Jtc1V0aWxzIiwibWVyZ2UiLCJzZXRVbmlmb3JtVmFsdWVzIiwibWFwIiwiZGVmaW5lcyIsIm5vcm1hbE1hcCIsImVudk1hcCIsImFvTWFwIiwic3BlY3VsYXJNYXAiLCJhbHBoYU1hcCIsImxpZ2h0TWFwIiwiZW1pc3NpdmVNYXAiLCJidW1wTWFwIiwiZGlzcGxhY2VtZW50TWFwIiwicm91Z2huZXNzTWFwIiwibWV0YWxuZXNzTWFwIiwiZ3JhZGllbnRNYXAiLCJlbnZNYXBUeXBlRGVmaW5lIiwiZW52TWFwTW9kZURlZmluZSIsImVudk1hcEJsZW5kaW5nRGVmaW5lIiwibWFwcGluZyIsIkN1YmVSZWZsZWN0aW9uTWFwcGluZyIsIkN1YmVSZWZyYWN0aW9uTWFwcGluZyIsIkN1YmVVVlJlZmxlY3Rpb25NYXBwaW5nIiwiQ3ViZVVWUmVmcmFjdGlvbk1hcHBpbmciLCJFcXVpcmVjdGFuZ3VsYXJSZWZsZWN0aW9uTWFwcGluZyIsIkVxdWlyZWN0YW5ndWxhclJlZnJhY3Rpb25NYXBwaW5nIiwiU3BoZXJpY2FsUmVmbGVjdGlvbk1hcHBpbmciLCJjb21iaW5lIiwiTWl4T3BlcmF0aW9uIiwiQWRkT3BlcmF0aW9uIiwiTXVsdGlwbHlPcGVyYXRpb24iLCJwcm90b3R5cGUiLCJPYmplY3QiLCJhc3NpZ24iLCJjcmVhdGUiLCJTaGFkZXJNYXRlcmlhbCIsInZhbHVlcyIsImtleXMiLCJmb3JFYWNoIiwia2V5IiwidmFsdWUiLCJuYW1lIiwiam9pbiIsIkJhc2ljQW5pbWF0aW9uTWF0ZXJpYWwiLCJ2YXJ5aW5nUGFyYW1ldGVycyIsInZlcnRleFBhcmFtZXRlcnMiLCJ2ZXJ0ZXhGdW5jdGlvbnMiLCJ2ZXJ0ZXhJbml0IiwidmVydGV4Tm9ybWFsIiwidmVydGV4UG9zaXRpb24iLCJ2ZXJ0ZXhDb2xvciIsInZlcnRleFBvc3RNb3JwaCIsInZlcnRleFBvc3RTa2lubmluZyIsImZyYWdtZW50RnVuY3Rpb25zIiwiZnJhZ21lbnRQYXJhbWV0ZXJzIiwiZnJhZ21lbnRJbml0IiwiZnJhZ21lbnRNYXAiLCJmcmFnbWVudERpZmZ1c2UiLCJTaGFkZXJMaWIiLCJsaWdodHMiLCJ2ZXJ0ZXhTaGFkZXIiLCJjb25jYXRWZXJ0ZXhTaGFkZXIiLCJmcmFnbWVudFNoYWRlciIsImNvbmNhdEZyYWdtZW50U2hhZGVyIiwiY29uc3RydWN0b3IiLCJzdHJpbmdpZnlDaHVuayIsIkxhbWJlcnRBbmltYXRpb25NYXRlcmlhbCIsImZyYWdtZW50RW1pc3NpdmUiLCJmcmFnbWVudFNwZWN1bGFyIiwiUGhvbmdBbmltYXRpb25NYXRlcmlhbCIsIlN0YW5kYXJkQW5pbWF0aW9uTWF0ZXJpYWwiLCJmcmFnbWVudFJvdWdobmVzcyIsImZyYWdtZW50TWV0YWxuZXNzIiwiVG9vbkFuaW1hdGlvbk1hdGVyaWFsIiwiUG9pbnRzQW5pbWF0aW9uTWF0ZXJpYWwiLCJmcmFnbWVudFNoYXBlIiwiRGVwdGhBbmltYXRpb25NYXRlcmlhbCIsImRlcHRoUGFja2luZyIsIlJHQkFEZXB0aFBhY2tpbmciLCJjbGlwcGluZyIsIkRpc3RhbmNlQW5pbWF0aW9uTWF0ZXJpYWwiLCJQcmVmYWJCdWZmZXJHZW9tZXRyeSIsInByZWZhYiIsImNvdW50IiwicHJlZmFiR2VvbWV0cnkiLCJpc1ByZWZhYkJ1ZmZlckdlb21ldHJ5IiwiaXNCdWZmZXJHZW9tZXRyeSIsInByZWZhYkNvdW50IiwicHJlZmFiVmVydGV4Q291bnQiLCJhdHRyaWJ1dGVzIiwicG9zaXRpb24iLCJ2ZXJ0aWNlcyIsImxlbmd0aCIsImJ1ZmZlckluZGljZXMiLCJidWZmZXJQb3NpdGlvbnMiLCJCdWZmZXJHZW9tZXRyeSIsInByZWZhYkluZGljZXMiLCJwcmVmYWJJbmRleENvdW50IiwiaW5kZXgiLCJhcnJheSIsImkiLCJwdXNoIiwicHJlZmFiRmFjZUNvdW50IiwiZmFjZXMiLCJmYWNlIiwiYSIsImIiLCJjIiwiaW5kZXhCdWZmZXIiLCJVaW50MzJBcnJheSIsInNldEluZGV4IiwiQnVmZmVyQXR0cmlidXRlIiwiayIsInBvc2l0aW9uQnVmZmVyIiwiY3JlYXRlQXR0cmlidXRlIiwicG9zaXRpb25zIiwib2Zmc2V0IiwiaiIsInByZWZhYlZlcnRleCIsIngiLCJ5IiwieiIsImJ1ZmZlclV2cyIsInV2QnVmZmVyIiwidXZzIiwidXYiLCJmYWNlVmVydGV4VXZzIiwiaXRlbVNpemUiLCJmYWN0b3J5IiwiYnVmZmVyIiwiRmxvYXQzMkFycmF5IiwiYXR0cmlidXRlIiwiYWRkQXR0cmlidXRlIiwiZGF0YSIsInNldFByZWZhYkRhdGEiLCJwcmVmYWJJbmRleCIsIk11bHRpUHJlZmFiQnVmZmVyR2VvbWV0cnkiLCJwcmVmYWJzIiwicmVwZWF0Q291bnQiLCJBcnJheSIsImlzQXJyYXkiLCJwcmVmYWJHZW9tZXRyaWVzIiwicHJlZmFiR2VvbWV0cmllc0NvdW50IiwicHJlZmFiVmVydGV4Q291bnRzIiwicCIsInJlcGVhdFZlcnRleENvdW50IiwicmVkdWNlIiwiciIsInYiLCJyZXBlYXRJbmRleENvdW50IiwiaW5kaWNlcyIsImdlb21ldHJ5IiwiaW5kZXhPZmZzZXQiLCJwcmVmYWJPZmZzZXQiLCJ2ZXJ0ZXhDb3VudCIsInByZWZhYlBvc2l0aW9ucyIsInByZWZhYlV2cyIsImVycm9yIiwidXZPYmplY3RzIiwicHJlZmFiR2VvbWV0cnlJbmRleCIsInByZWZhYkdlb21ldHJ5VmVydGV4Q291bnQiLCJ3aG9sZSIsIndob2xlT2Zmc2V0IiwicGFydCIsInBhcnRPZmZzZXQiLCJJbnN0YW5jZWRQcmVmYWJCdWZmZXJHZW9tZXRyeSIsImlzR2VvbWV0cnkiLCJjb3B5IiwibWF4SW5zdGFuY2VkQ291bnQiLCJJbnN0YW5jZWRCdWZmZXJHZW9tZXRyeSIsIkluc3RhbmNlZEJ1ZmZlckF0dHJpYnV0ZSIsIlV0aWxzIiwiaWwiLCJuIiwidmEiLCJ2YiIsInZjIiwiY2xvbmUiLCJWZWN0b3IzIiwiYm94IiwidE1hdGgiLCJyYW5kRmxvYXQiLCJtaW4iLCJtYXgiLCJyYW5kRmxvYXRTcHJlYWQiLCJub3JtYWxpemUiLCJzb3VyY2VNYXRlcmlhbCIsIk1vZGVsQnVmZmVyR2VvbWV0cnkiLCJtb2RlbCIsIm9wdGlvbnMiLCJtb2RlbEdlb21ldHJ5IiwiZmFjZUNvdW50IiwiY29tcHV0ZUNlbnRyb2lkcyIsImxvY2FsaXplRmFjZXMiLCJjZW50cm9pZHMiLCJjb21wdXRlQ2VudHJvaWQiLCJjZW50cm9pZCIsInZlcnRleCIsImJ1ZmZlclNraW5uaW5nIiwic2tpbkluZGV4QnVmZmVyIiwic2tpbldlaWdodEJ1ZmZlciIsInNraW5JbmRleCIsInNraW5JbmRpY2VzIiwic2tpbldlaWdodCIsInNraW5XZWlnaHRzIiwidyIsInNldEZhY2VEYXRhIiwiZmFjZUluZGV4IiwiUG9pbnRCdWZmZXJHZW9tZXRyeSIsInBvaW50Q291bnQiLCJzZXRQb2ludERhdGEiLCJwb2ludEluZGV4IiwiU2hhZGVyQ2h1bmsiLCJjYXRtdWxsX3JvbV9zcGxpbmUiLCJjdWJpY19iZXppZXIiLCJlYXNlX2JhY2tfaW4iLCJlYXNlX2JhY2tfaW5fb3V0IiwiZWFzZV9iYWNrX291dCIsImVhc2VfYmV6aWVyIiwiZWFzZV9ib3VuY2VfaW4iLCJlYXNlX2JvdW5jZV9pbl9vdXQiLCJlYXNlX2JvdW5jZV9vdXQiLCJlYXNlX2NpcmNfaW4iLCJlYXNlX2NpcmNfaW5fb3V0IiwiZWFzZV9jaXJjX291dCIsImVhc2VfY3ViaWNfaW4iLCJlYXNlX2N1YmljX2luX291dCIsImVhc2VfY3ViaWNfb3V0IiwiZWFzZV9lbGFzdGljX2luIiwiZWFzZV9lbGFzdGljX2luX291dCIsImVhc2VfZWxhc3RpY19vdXQiLCJlYXNlX2V4cG9faW4iLCJlYXNlX2V4cG9faW5fb3V0IiwiZWFzZV9leHBvX291dCIsImVhc2VfcXVhZF9pbiIsImVhc2VfcXVhZF9pbl9vdXQiLCJlYXNlX3F1YWRfb3V0IiwiZWFzZV9xdWFydF9pbiIsImVhc2VfcXVhcnRfaW5fb3V0IiwiZWFzZV9xdWFydF9vdXQiLCJlYXNlX3F1aW50X2luIiwiZWFzZV9xdWludF9pbl9vdXQiLCJlYXNlX3F1aW50X291dCIsImVhc2Vfc2luZV9pbiIsImVhc2Vfc2luZV9pbl9vdXQiLCJlYXNlX3NpbmVfb3V0IiwicXVhZHJhdGljX2JlemllciIsInF1YXRlcm5pb25fcm90YXRpb24iLCJxdWF0ZXJuaW9uX3NsZXJwIiwiVGltZWxpbmVTZWdtZW50Iiwic3RhcnQiLCJkdXJhdGlvbiIsInRyYW5zaXRpb24iLCJjb21waWxlciIsInRyYWlsIiwiY29tcGlsZSIsImRlZmluZVByb3BlcnR5IiwiVGltZWxpbmUiLCJ0aW1lS2V5Iiwic2VnbWVudHMiLCJfX2tleSIsInNlZ21lbnREZWZpbml0aW9ucyIsInJlZ2lzdGVyIiwiZGVmaW5pdGlvbiIsImFkZCIsInRyYW5zaXRpb25zIiwicG9zaXRpb25PZmZzZXQiLCJfZXZhbCIsImV2YWwiLCJ1bmRlZmluZWQiLCJNYXRoIiwicHJvY2Vzc1RyYW5zaXRpb24iLCJmcm9tIiwiZGVmYXVsdEZyb20iLCJ0byIsInRvU3RyaW5nIiwiZmlsbEdhcHMiLCJzIiwiczAiLCJzMSIsImVuZCIsImdldFRyYW5zZm9ybUNhbGxzIiwidCIsIlRpbWVsaW5lQ2h1bmtzIiwidG9QcmVjaXNpb24iLCJzZWdtZW50IiwiZWFzZSIsImVhc2VQYXJhbXMiLCJzdGFydFRpbWUiLCJlbmRUaW1lIiwiVHJhbnNsYXRpb25TZWdtZW50IiwiZGVsYXlEdXJhdGlvbiIsInZlYzMiLCJyZW5kZXJDaGVjayIsInByb2dyZXNzIiwiU2NhbGVTZWdtZW50Iiwib3JpZ2luIiwiUm90YXRpb25TZWdtZW50IiwiZnJvbUF4aXNBbmdsZSIsIlZlY3RvcjQiLCJheGlzIiwiYW5nbGUiLCJ0b0F4aXMiLCJ0b0F4aXNBbmdsZSIsInZlYzQiXSwibWFwcGluZ3MiOiI7O0FBZUEsU0FBU0EscUJBQVQsQ0FBK0JDLFVBQS9CLEVBQTJDQyxRQUEzQyxFQUFxRDtpQkFDcENDLElBQWYsQ0FBb0IsSUFBcEI7O01BRU1DLGdCQUFnQkgsV0FBV0csYUFBakM7U0FDT0gsV0FBV0csYUFBbEI7O09BRUtDLFNBQUwsQ0FBZUosVUFBZjs7T0FFS0MsUUFBTCxHQUFnQkksY0FBY0MsS0FBZCxDQUFvQixDQUFDTCxRQUFELEVBQVcsS0FBS0EsUUFBaEIsQ0FBcEIsQ0FBaEI7O09BRUtNLGdCQUFMLENBQXNCSixhQUF0Qjs7TUFFSUEsYUFBSixFQUFtQjtrQkFDSEssR0FBZCxLQUFzQixLQUFLQyxPQUFMLENBQWEsU0FBYixJQUEwQixFQUFoRDtrQkFDY0MsU0FBZCxLQUE0QixLQUFLRCxPQUFMLENBQWEsZUFBYixJQUFnQyxFQUE1RDtrQkFDY0UsTUFBZCxLQUF5QixLQUFLRixPQUFMLENBQWEsWUFBYixJQUE2QixFQUF0RDtrQkFDY0csS0FBZCxLQUF3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
