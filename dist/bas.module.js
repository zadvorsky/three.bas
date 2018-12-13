import { AddOperation, BufferAttribute, BufferGeometry, CubeReflectionMapping, CubeRefractionMapping, CubeUVReflectionMapping, CubeUVRefractionMapping, EquirectangularReflectionMapping, EquirectangularRefractionMapping, InstancedBufferAttribute, InstancedBufferGeometry, Material, Math as Math$1, MixOperation, MultiplyOperation, RGBADepthPacking, ShaderLib, ShaderMaterial, SphericalReflectionMapping, UniformsUtils, Vector3, Vector4 } from 'three';

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
  },
  toJSON: function toJSON(meta) {
    var data = Material.prototype.toJSON.call(this, meta);

    data.uniforms = {};

    for (var name in this.uniforms) {

      var uniform = this.uniforms[name];
      var value = uniform.value;

      if (value === null || value === undefined) continue;

      if (value.isTexture) {

        data.uniforms[name] = {
          type: 't',
          value: value.toJSON(meta).uuid
        };
      } else if (value.isColor) {

        data.uniforms[name] = {
          type: 'c',
          value: value.getHex()
        };
      } else if (value.isVector2) {

        data.uniforms[name] = {
          type: 'v2',
          value: value.toArray()
        };
      } else if (value.isVector3) {

        data.uniforms[name] = {
          type: 'v3',
          value: value.toArray()
        };
      } else if (value.isVector4) {

        data.uniforms[name] = {
          type: 'v4',
          value: value.toArray()
        };
      } else if (value.isMatrix4) {

        data.uniforms[name] = {
          type: 'm4',
          value: value.toArray()
        };
      } else {

        data.uniforms[name] = {
          value: value
        };

        // note: the array variants v2v, v3v, v4v, m4v and tv are not supported so far
      }
    }

    if (Object.keys(this.defines).length > 0) data.defines = this.defines;

    data.vertexShader = this.vertexShader;
    data.fragmentShader = this.fragmentShader;

    return data;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzLm1vZHVsZS5qcyIsInNvdXJjZXMiOlsiLi4vc3JjL21hdGVyaWFscy9CYXNlQW5pbWF0aW9uTWF0ZXJpYWwuanMiLCIuLi9zcmMvbWF0ZXJpYWxzL0Jhc2ljQW5pbWF0aW9uTWF0ZXJpYWwuanMiLCIuLi9zcmMvbWF0ZXJpYWxzL0xhbWJlcnRBbmltYXRpb25NYXRlcmlhbC5qcyIsIi4uL3NyYy9tYXRlcmlhbHMvUGhvbmdBbmltYXRpb25NYXRlcmlhbC5qcyIsIi4uL3NyYy9tYXRlcmlhbHMvU3RhbmRhcmRBbmltYXRpb25NYXRlcmlhbC5qcyIsIi4uL3NyYy9tYXRlcmlhbHMvVG9vbkFuaW1hdGlvbk1hdGVyaWFsLmpzIiwiLi4vc3JjL21hdGVyaWFscy9Qb2ludHNBbmltYXRpb25NYXRlcmlhbC5qcyIsIi4uL3NyYy9tYXRlcmlhbHMvRGVwdGhBbmltYXRpb25NYXRlcmlhbC5qcyIsIi4uL3NyYy9tYXRlcmlhbHMvRGlzdGFuY2VBbmltYXRpb25NYXRlcmlhbC5qcyIsIi4uL3NyYy9nZW9tZXRyeS9QcmVmYWJCdWZmZXJHZW9tZXRyeS5qcyIsIi4uL3NyYy9nZW9tZXRyeS9NdWx0aVByZWZhYkJ1ZmZlckdlb21ldHJ5LmpzIiwiLi4vc3JjL2dlb21ldHJ5L0luc3RhbmNlZFByZWZhYkJ1ZmZlckdlb21ldHJ5LmpzIiwiLi4vc3JjL1V0aWxzLmpzIiwiLi4vc3JjL2dlb21ldHJ5L01vZGVsQnVmZmVyR2VvbWV0cnkuanMiLCIuLi9zcmMvZ2VvbWV0cnkvUG9pbnRCdWZmZXJHZW9tZXRyeS5qcyIsIi4uL3NyYy9TaGFkZXJDaHVuay5qcyIsIi4uL3NyYy90aW1lbGluZS9UaW1lbGluZVNlZ21lbnQuanMiLCIuLi9zcmMvdGltZWxpbmUvVGltZWxpbmUuanMiLCIuLi9zcmMvdGltZWxpbmUvVGltZWxpbmVDaHVua3MuanMiLCIuLi9zcmMvdGltZWxpbmUvVHJhbnNsYXRpb25TZWdtZW50LmpzIiwiLi4vc3JjL3RpbWVsaW5lL1NjYWxlU2VnbWVudC5qcyIsIi4uL3NyYy90aW1lbGluZS9Sb3RhdGlvblNlZ21lbnQuanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgTWF0ZXJpYWwsXG4gIFNoYWRlck1hdGVyaWFsLFxuICBVbmlmb3Jtc1V0aWxzLFxuICBDdWJlUmVmbGVjdGlvbk1hcHBpbmcsXG4gIEN1YmVSZWZyYWN0aW9uTWFwcGluZyxcbiAgQ3ViZVVWUmVmbGVjdGlvbk1hcHBpbmcsXG4gIEN1YmVVVlJlZnJhY3Rpb25NYXBwaW5nLFxuICBFcXVpcmVjdGFuZ3VsYXJSZWZsZWN0aW9uTWFwcGluZyxcbiAgRXF1aXJlY3Rhbmd1bGFyUmVmcmFjdGlvbk1hcHBpbmcsXG4gIFNwaGVyaWNhbFJlZmxlY3Rpb25NYXBwaW5nLFxuICBNaXhPcGVyYXRpb24sXG4gIEFkZE9wZXJhdGlvbixcbiAgTXVsdGlwbHlPcGVyYXRpb25cbn0gZnJvbSAndGhyZWUnO1xuXG5mdW5jdGlvbiBCYXNlQW5pbWF0aW9uTWF0ZXJpYWwocGFyYW1ldGVycywgdW5pZm9ybXMpIHtcbiAgU2hhZGVyTWF0ZXJpYWwuY2FsbCh0aGlzKTtcblxuICBjb25zdCB1bmlmb3JtVmFsdWVzID0gcGFyYW1ldGVycy51bmlmb3JtVmFsdWVzO1xuICBkZWxldGUgcGFyYW1ldGVycy51bmlmb3JtVmFsdWVzO1xuXG4gIHRoaXMuc2V0VmFsdWVzKHBhcmFtZXRlcnMpO1xuXG4gIHRoaXMudW5pZm9ybXMgPSBVbmlmb3Jtc1V0aWxzLm1lcmdlKFt1bmlmb3JtcywgdGhpcy51bmlmb3Jtc10pO1xuXG4gIHRoaXMuc2V0VW5pZm9ybVZhbHVlcyh1bmlmb3JtVmFsdWVzKTtcblxuICBpZiAodW5pZm9ybVZhbHVlcykge1xuICAgIHVuaWZvcm1WYWx1ZXMubWFwICYmICh0aGlzLmRlZmluZXNbJ1VTRV9NQVAnXSA9ICcnKTtcbiAgICB1bmlmb3JtVmFsdWVzLm5vcm1hbE1hcCAmJiAodGhpcy5kZWZpbmVzWydVU0VfTk9STUFMTUFQJ10gPSAnJyk7XG4gICAgdW5pZm9ybVZhbHVlcy5lbnZNYXAgJiYgKHRoaXMuZGVmaW5lc1snVVNFX0VOVk1BUCddID0gJycpO1xuICAgIHVuaWZvcm1WYWx1ZXMuYW9NYXAgJiYgKHRoaXMuZGVmaW5lc1snVVNFX0FPTUFQJ10gPSAnJyk7XG4gICAgdW5pZm9ybVZhbHVlcy5zcGVjdWxhck1hcCAmJiAodGhpcy5kZWZpbmVzWydVU0VfU1BFQ1VMQVJNQVAnXSA9ICcnKTtcbiAgICB1bmlmb3JtVmFsdWVzLmFscGhhTWFwICYmICh0aGlzLmRlZmluZXNbJ1VTRV9BTFBIQU1BUCddID0gJycpO1xuICAgIHVuaWZvcm1WYWx1ZXMubGlnaHRNYXAgJiYgKHRoaXMuZGVmaW5lc1snVVNFX0xJR0hUTUFQJ10gPSAnJyk7XG4gICAgdW5pZm9ybVZhbHVlcy5lbWlzc2l2ZU1hcCAmJiAodGhpcy5kZWZpbmVzWydVU0VfRU1JU1NJVkVNQVAnXSA9ICcnKTtcbiAgICB1bmlmb3JtVmFsdWVzLmJ1bXBNYXAgJiYgKHRoaXMuZGVmaW5lc1snVVNFX0JVTVBNQVAnXSA9ICcnKTtcbiAgICB1bmlmb3JtVmFsdWVzLmRpc3BsYWNlbWVudE1hcCAmJiAodGhpcy5kZWZpbmVzWydVU0VfRElTUExBQ0VNRU5UTUFQJ10gPSAnJyk7XG4gICAgdW5pZm9ybVZhbHVlcy5yb3VnaG5lc3NNYXAgJiYgKHRoaXMuZGVmaW5lc1snVVNFX0RJU1BMQUNFTUVOVE1BUCddID0gJycpO1xuICAgIHVuaWZvcm1WYWx1ZXMucm91Z2huZXNzTWFwICYmICh0aGlzLmRlZmluZXNbJ1VTRV9ST1VHSE5FU1NNQVAnXSA9ICcnKTtcbiAgICB1bmlmb3JtVmFsdWVzLm1ldGFsbmVzc01hcCAmJiAodGhpcy5kZWZpbmVzWydVU0VfTUVUQUxORVNTTUFQJ10gPSAnJyk7XG4gICAgdW5pZm9ybVZhbHVlcy5ncmFkaWVudE1hcCAmJiAodGhpcy5kZWZpbmVzWydVU0VfR1JBRElFTlRNQVAnXSA9ICcnKTtcblxuICAgIGlmICh1bmlmb3JtVmFsdWVzLmVudk1hcCkge1xuICAgICAgdGhpcy5kZWZpbmVzWydVU0VfRU5WTUFQJ10gPSAnJztcblxuICAgICAgbGV0IGVudk1hcFR5cGVEZWZpbmUgPSAnRU5WTUFQX1RZUEVfQ1VCRSc7XG4gICAgICBsZXQgZW52TWFwTW9kZURlZmluZSA9ICdFTlZNQVBfTU9ERV9SRUZMRUNUSU9OJztcbiAgICAgIGxldCBlbnZNYXBCbGVuZGluZ0RlZmluZSA9ICdFTlZNQVBfQkxFTkRJTkdfTVVMVElQTFknO1xuXG4gICAgICBzd2l0Y2ggKHVuaWZvcm1WYWx1ZXMuZW52TWFwLm1hcHBpbmcpIHtcbiAgICAgICAgY2FzZSBDdWJlUmVmbGVjdGlvbk1hcHBpbmc6XG4gICAgICAgIGNhc2UgQ3ViZVJlZnJhY3Rpb25NYXBwaW5nOlxuICAgICAgICAgIGVudk1hcFR5cGVEZWZpbmUgPSAnRU5WTUFQX1RZUEVfQ1VCRSc7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ3ViZVVWUmVmbGVjdGlvbk1hcHBpbmc6XG4gICAgICAgIGNhc2UgQ3ViZVVWUmVmcmFjdGlvbk1hcHBpbmc6XG4gICAgICAgICAgZW52TWFwVHlwZURlZmluZSA9ICdFTlZNQVBfVFlQRV9DVUJFX1VWJztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBFcXVpcmVjdGFuZ3VsYXJSZWZsZWN0aW9uTWFwcGluZzpcbiAgICAgICAgY2FzZSBFcXVpcmVjdGFuZ3VsYXJSZWZyYWN0aW9uTWFwcGluZzpcbiAgICAgICAgICBlbnZNYXBUeXBlRGVmaW5lID0gJ0VOVk1BUF9UWVBFX0VRVUlSRUMnO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFNwaGVyaWNhbFJlZmxlY3Rpb25NYXBwaW5nOlxuICAgICAgICAgIGVudk1hcFR5cGVEZWZpbmUgPSAnRU5WTUFQX1RZUEVfU1BIRVJFJztcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgc3dpdGNoICh1bmlmb3JtVmFsdWVzLmVudk1hcC5tYXBwaW5nKSB7XG4gICAgICAgIGNhc2UgQ3ViZVJlZnJhY3Rpb25NYXBwaW5nOlxuICAgICAgICBjYXNlIEVxdWlyZWN0YW5ndWxhclJlZnJhY3Rpb25NYXBwaW5nOlxuICAgICAgICAgIGVudk1hcE1vZGVEZWZpbmUgPSAnRU5WTUFQX01PREVfUkVGUkFDVElPTic7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIHN3aXRjaCAodW5pZm9ybVZhbHVlcy5jb21iaW5lKSB7XG4gICAgICAgIGNhc2UgTWl4T3BlcmF0aW9uOlxuICAgICAgICAgIGVudk1hcEJsZW5kaW5nRGVmaW5lID0gJ0VOVk1BUF9CTEVORElOR19NSVgnO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIEFkZE9wZXJhdGlvbjpcbiAgICAgICAgICBlbnZNYXBCbGVuZGluZ0RlZmluZSA9ICdFTlZNQVBfQkxFTkRJTkdfQUREJztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBNdWx0aXBseU9wZXJhdGlvbjpcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICBlbnZNYXBCbGVuZGluZ0RlZmluZSA9ICdFTlZNQVBfQkxFTkRJTkdfTVVMVElQTFknO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICB0aGlzLmRlZmluZXNbZW52TWFwVHlwZURlZmluZV0gPSAnJztcbiAgICAgIHRoaXMuZGVmaW5lc1tlbnZNYXBCbGVuZGluZ0RlZmluZV0gPSAnJztcbiAgICAgIHRoaXMuZGVmaW5lc1tlbnZNYXBNb2RlRGVmaW5lXSA9ICcnO1xuICAgIH1cbiAgfVxufVxuXG5CYXNlQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlID0gT2JqZWN0LmFzc2lnbihPYmplY3QuY3JlYXRlKFNoYWRlck1hdGVyaWFsLnByb3RvdHlwZSksIHtcbiAgY29uc3RydWN0b3I6IEJhc2VBbmltYXRpb25NYXRlcmlhbCxcblxuICBzZXRVbmlmb3JtVmFsdWVzKHZhbHVlcykge1xuICAgIGlmICghdmFsdWVzKSByZXR1cm47XG5cbiAgICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXModmFsdWVzKTtcblxuICAgIGtleXMuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgICBrZXkgaW4gdGhpcy51bmlmb3JtcyAmJiAodGhpcy51bmlmb3Jtc1trZXldLnZhbHVlID0gdmFsdWVzW2tleV0pO1xuICAgIH0pO1xuICB9LFxuXG4gIHN0cmluZ2lmeUNodW5rKG5hbWUpIHtcbiAgICBsZXQgdmFsdWU7XG5cbiAgICBpZiAoIXRoaXNbbmFtZV0pIHtcbiAgICAgIHZhbHVlID0gJyc7XG4gICAgfVxuICAgIGVsc2UgaWYgKHR5cGVvZiB0aGlzW25hbWVdID09PSAgJ3N0cmluZycpIHtcbiAgICAgIHZhbHVlID0gdGhpc1tuYW1lXTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICB2YWx1ZSA9IHRoaXNbbmFtZV0uam9pbignXFxuJyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHZhbHVlO1xuICB9LFxuXG4gIHRvSlNPTiAobWV0YSkge1xuICAgIHZhciBkYXRhID0gTWF0ZXJpYWwucHJvdG90eXBlLnRvSlNPTi5jYWxsKCB0aGlzLCBtZXRhICk7XG5cbiAgICBkYXRhLnVuaWZvcm1zID0ge307XG5cbiAgICBmb3IgKCB2YXIgbmFtZSBpbiB0aGlzLnVuaWZvcm1zICkge1xuXG4gICAgICB2YXIgdW5pZm9ybSA9IHRoaXMudW5pZm9ybXNbIG5hbWUgXTtcbiAgICAgIHZhciB2YWx1ZSA9IHVuaWZvcm0udmFsdWU7XG5cbiAgICAgIGlmICh2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkKSBjb250aW51ZTtcblxuICAgICAgaWYgKCB2YWx1ZS5pc1RleHR1cmUgKSB7XG5cbiAgICAgICAgZGF0YS51bmlmb3Jtc1sgbmFtZSBdID0ge1xuICAgICAgICAgIHR5cGU6ICd0JyxcbiAgICAgICAgICB2YWx1ZTogdmFsdWUudG9KU09OKCBtZXRhICkudXVpZFxuICAgICAgICB9O1xuXG4gICAgICB9IGVsc2UgaWYgKCB2YWx1ZS5pc0NvbG9yICkge1xuXG4gICAgICAgIGRhdGEudW5pZm9ybXNbIG5hbWUgXSA9IHtcbiAgICAgICAgICB0eXBlOiAnYycsXG4gICAgICAgICAgdmFsdWU6IHZhbHVlLmdldEhleCgpXG4gICAgICAgIH07XG5cbiAgICAgIH0gZWxzZSBpZiAoIHZhbHVlLmlzVmVjdG9yMiApIHtcblxuICAgICAgICBkYXRhLnVuaWZvcm1zWyBuYW1lIF0gPSB7XG4gICAgICAgICAgdHlwZTogJ3YyJyxcbiAgICAgICAgICB2YWx1ZTogdmFsdWUudG9BcnJheSgpXG4gICAgICAgIH07XG5cbiAgICAgIH0gZWxzZSBpZiAoIHZhbHVlLmlzVmVjdG9yMyApIHtcblxuICAgICAgICBkYXRhLnVuaWZvcm1zWyBuYW1lIF0gPSB7XG4gICAgICAgICAgdHlwZTogJ3YzJyxcbiAgICAgICAgICB2YWx1ZTogdmFsdWUudG9BcnJheSgpXG4gICAgICAgIH07XG5cbiAgICAgIH0gZWxzZSBpZiAoIHZhbHVlLmlzVmVjdG9yNCApIHtcblxuICAgICAgICBkYXRhLnVuaWZvcm1zWyBuYW1lIF0gPSB7XG4gICAgICAgICAgdHlwZTogJ3Y0JyxcbiAgICAgICAgICB2YWx1ZTogdmFsdWUudG9BcnJheSgpXG4gICAgICAgIH07XG5cbiAgICAgIH0gZWxzZSBpZiAoIHZhbHVlLmlzTWF0cml4NCApIHtcblxuICAgICAgICBkYXRhLnVuaWZvcm1zWyBuYW1lIF0gPSB7XG4gICAgICAgICAgdHlwZTogJ200JyxcbiAgICAgICAgICB2YWx1ZTogdmFsdWUudG9BcnJheSgpXG4gICAgICAgIH07XG5cbiAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgZGF0YS51bmlmb3Jtc1sgbmFtZSBdID0ge1xuICAgICAgICAgIHZhbHVlOiB2YWx1ZVxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIG5vdGU6IHRoZSBhcnJheSB2YXJpYW50cyB2MnYsIHYzdiwgdjR2LCBtNHYgYW5kIHR2IGFyZSBub3Qgc3VwcG9ydGVkIHNvIGZhclxuXG4gICAgICB9XG5cbiAgICB9XG5cbiAgICBpZiAoIE9iamVjdC5rZXlzKCB0aGlzLmRlZmluZXMgKS5sZW5ndGggPiAwICkgZGF0YS5kZWZpbmVzID0gdGhpcy5kZWZpbmVzO1xuXG4gICAgZGF0YS52ZXJ0ZXhTaGFkZXIgPSB0aGlzLnZlcnRleFNoYWRlcjtcbiAgICBkYXRhLmZyYWdtZW50U2hhZGVyID0gdGhpcy5mcmFnbWVudFNoYWRlcjtcblxuICAgIHJldHVybiBkYXRhO1xuICB9XG59KTtcblxuZXhwb3J0IGRlZmF1bHQgQmFzZUFuaW1hdGlvbk1hdGVyaWFsO1xuIiwiaW1wb3J0IHsgU2hhZGVyTGliIH0gZnJvbSAndGhyZWUnO1xuaW1wb3J0IEJhc2VBbmltYXRpb25NYXRlcmlhbCBmcm9tICcuL0Jhc2VBbmltYXRpb25NYXRlcmlhbCc7XG5cbi8qKlxuICogRXh0ZW5kcyBUSFJFRS5NZXNoQmFzaWNNYXRlcmlhbCB3aXRoIGN1c3RvbSBzaGFkZXIgY2h1bmtzLlxuICpcbiAqIEBzZWUgaHR0cDovL3RocmVlLWJhcy1leGFtcGxlcy5zdXJnZS5zaC9leGFtcGxlcy9tYXRlcmlhbHNfYmFzaWMvXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IHBhcmFtZXRlcnMgT2JqZWN0IGNvbnRhaW5pbmcgbWF0ZXJpYWwgcHJvcGVydGllcyBhbmQgY3VzdG9tIHNoYWRlciBjaHVua3MuXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gQmFzaWNBbmltYXRpb25NYXRlcmlhbChwYXJhbWV0ZXJzKSB7XG4gIHRoaXMudmFyeWluZ1BhcmFtZXRlcnMgPSBbXTtcbiAgXG4gIHRoaXMudmVydGV4UGFyYW1ldGVycyA9IFtdO1xuICB0aGlzLnZlcnRleEZ1bmN0aW9ucyA9IFtdO1xuICB0aGlzLnZlcnRleEluaXQgPSBbXTtcbiAgdGhpcy52ZXJ0ZXhOb3JtYWwgPSBbXTtcbiAgdGhpcy52ZXJ0ZXhQb3NpdGlvbiA9IFtdO1xuICB0aGlzLnZlcnRleENvbG9yID0gW107XG4gIHRoaXMudmVydGV4UG9zdE1vcnBoID0gW107XG4gIHRoaXMudmVydGV4UG9zdFNraW5uaW5nID0gW107XG5cbiAgdGhpcy5mcmFnbWVudEZ1bmN0aW9ucyA9IFtdO1xuICB0aGlzLmZyYWdtZW50UGFyYW1ldGVycyA9IFtdO1xuICB0aGlzLmZyYWdtZW50SW5pdCA9IFtdO1xuICB0aGlzLmZyYWdtZW50TWFwID0gW107XG4gIHRoaXMuZnJhZ21lbnREaWZmdXNlID0gW107XG4gIFxuICBCYXNlQW5pbWF0aW9uTWF0ZXJpYWwuY2FsbCh0aGlzLCBwYXJhbWV0ZXJzLCBTaGFkZXJMaWJbJ2Jhc2ljJ10udW5pZm9ybXMpO1xuICBcbiAgdGhpcy5saWdodHMgPSBmYWxzZTtcbiAgdGhpcy52ZXJ0ZXhTaGFkZXIgPSB0aGlzLmNvbmNhdFZlcnRleFNoYWRlcigpO1xuICB0aGlzLmZyYWdtZW50U2hhZGVyID0gdGhpcy5jb25jYXRGcmFnbWVudFNoYWRlcigpO1xufVxuQmFzaWNBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEJhc2VBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUpO1xuQmFzaWNBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBCYXNpY0FuaW1hdGlvbk1hdGVyaWFsO1xuXG5CYXNpY0FuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZS5jb25jYXRWZXJ0ZXhTaGFkZXIgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIGBcbiAgI2luY2x1ZGUgPGNvbW1vbj5cbiAgI2luY2x1ZGUgPHV2X3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8dXYyX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8ZW52bWFwX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8Y29sb3JfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxmb2dfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxtb3JwaHRhcmdldF9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPHNraW5uaW5nX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfcGFyc192ZXJ0ZXg+XG4gIFxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBhcmFtZXRlcnMnKX1cbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2YXJ5aW5nUGFyYW1ldGVycycpfVxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleEZ1bmN0aW9ucycpfVxuICBcbiAgdm9pZCBtYWluKCkge1xuXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhJbml0Jyl9XG4gIFxuICAgICNpbmNsdWRlIDx1dl92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPHV2Ml92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPGNvbG9yX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8c2tpbmJhc2VfdmVydGV4PlxuICBcbiAgICAjaWZkZWYgVVNFX0VOVk1BUFxuICBcbiAgICAjaW5jbHVkZSA8YmVnaW5ub3JtYWxfdmVydGV4PlxuICAgIFxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4Tm9ybWFsJyl9XG4gICAgXG4gICAgI2luY2x1ZGUgPG1vcnBobm9ybWFsX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8c2tpbm5vcm1hbF92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPGRlZmF1bHRub3JtYWxfdmVydGV4PlxuICBcbiAgICAjZW5kaWZcbiAgXG4gICAgI2luY2x1ZGUgPGJlZ2luX3ZlcnRleD5cbiAgICBcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBvc2l0aW9uJyl9XG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhDb2xvcicpfVxuICAgIFxuICAgICNpbmNsdWRlIDxtb3JwaHRhcmdldF92ZXJ0ZXg+XG4gICAgXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQb3N0TW9ycGgnKX1cbiAgICBcbiAgICAjaW5jbHVkZSA8c2tpbm5pbmdfdmVydGV4PlxuXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQb3N0U2tpbm5pbmcnKX1cblxuICAgICNpbmNsdWRlIDxwcm9qZWN0X3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfdmVydGV4PlxuICBcbiAgICAjaW5jbHVkZSA8d29ybGRwb3NfdmVydGV4PlxuICAgICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfdmVydGV4PlxuICAgICNpbmNsdWRlIDxlbnZtYXBfdmVydGV4PlxuICAgICNpbmNsdWRlIDxmb2dfdmVydGV4PlxuICB9YDtcbn07XG5cbkJhc2ljQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlLmNvbmNhdEZyYWdtZW50U2hhZGVyID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBgXG4gIHVuaWZvcm0gdmVjMyBkaWZmdXNlO1xuICB1bmlmb3JtIGZsb2F0IG9wYWNpdHk7XG4gIFxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50UGFyYW1ldGVycycpfVxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZhcnlpbmdQYXJhbWV0ZXJzJyl9XG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRGdW5jdGlvbnMnKX1cbiAgXG4gICNpZm5kZWYgRkxBVF9TSEFERURcbiAgXG4gICAgdmFyeWluZyB2ZWMzIHZOb3JtYWw7XG4gIFxuICAjZW5kaWZcbiAgXG4gICNpbmNsdWRlIDxjb21tb24+XG4gICNpbmNsdWRlIDxjb2xvcl9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8dXZfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPHV2Ml9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8bWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxhbHBoYW1hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8YW9tYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGxpZ2h0bWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxlbnZtYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGZvZ19wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8c3BlY3VsYXJtYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGxvZ2RlcHRoYnVmX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfcGFyc19mcmFnbWVudD5cbiAgXG4gIHZvaWQgbWFpbigpIHtcbiAgXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudEluaXQnKX1cbiAgXG4gICAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc19mcmFnbWVudD5cblxuICAgIHZlYzQgZGlmZnVzZUNvbG9yID0gdmVjNCggZGlmZnVzZSwgb3BhY2l0eSApO1xuXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudERpZmZ1c2UnKX1cbiAgXG4gICAgI2luY2x1ZGUgPGxvZ2RlcHRoYnVmX2ZyYWdtZW50PlxuICAgIFxuICAgICR7KHRoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50TWFwJykgfHwgJyNpbmNsdWRlIDxtYXBfZnJhZ21lbnQ+Jyl9XG4gICAgXG4gICAgI2luY2x1ZGUgPGNvbG9yX2ZyYWdtZW50PlxuICAgICNpbmNsdWRlIDxhbHBoYW1hcF9mcmFnbWVudD5cbiAgICAjaW5jbHVkZSA8YWxwaGF0ZXN0X2ZyYWdtZW50PlxuICAgICNpbmNsdWRlIDxzcGVjdWxhcm1hcF9mcmFnbWVudD5cbiAgXG4gICAgUmVmbGVjdGVkTGlnaHQgcmVmbGVjdGVkTGlnaHQgPSBSZWZsZWN0ZWRMaWdodCggdmVjMyggMC4wICksIHZlYzMoIDAuMCApLCB2ZWMzKCAwLjAgKSwgdmVjMyggMC4wICkgKTtcbiAgXG4gICAgLy8gYWNjdW11bGF0aW9uIChiYWtlZCBpbmRpcmVjdCBsaWdodGluZyBvbmx5KVxuICAgICNpZmRlZiBVU0VfTElHSFRNQVBcbiAgXG4gICAgICByZWZsZWN0ZWRMaWdodC5pbmRpcmVjdERpZmZ1c2UgKz0gdGV4dHVyZTJEKCBsaWdodE1hcCwgdlV2MiApLnh5eiAqIGxpZ2h0TWFwSW50ZW5zaXR5O1xuICBcbiAgICAjZWxzZVxuICBcbiAgICAgIHJlZmxlY3RlZExpZ2h0LmluZGlyZWN0RGlmZnVzZSArPSB2ZWMzKCAxLjAgKTtcbiAgXG4gICAgI2VuZGlmXG4gIFxuICAgIC8vIG1vZHVsYXRpb25cbiAgICAjaW5jbHVkZSA8YW9tYXBfZnJhZ21lbnQ+XG4gIFxuICAgIHJlZmxlY3RlZExpZ2h0LmluZGlyZWN0RGlmZnVzZSAqPSBkaWZmdXNlQ29sb3IucmdiO1xuICBcbiAgICB2ZWMzIG91dGdvaW5nTGlnaHQgPSByZWZsZWN0ZWRMaWdodC5pbmRpcmVjdERpZmZ1c2U7XG4gIFxuICAgICNpbmNsdWRlIDxlbnZtYXBfZnJhZ21lbnQ+XG4gIFxuICAgIGdsX0ZyYWdDb2xvciA9IHZlYzQoIG91dGdvaW5nTGlnaHQsIGRpZmZ1c2VDb2xvci5hICk7XG4gIFxuICAgICNpbmNsdWRlIDxwcmVtdWx0aXBsaWVkX2FscGhhX2ZyYWdtZW50PlxuICAgICNpbmNsdWRlIDx0b25lbWFwcGluZ19mcmFnbWVudD5cbiAgICAjaW5jbHVkZSA8ZW5jb2RpbmdzX2ZyYWdtZW50PlxuICAgICNpbmNsdWRlIDxmb2dfZnJhZ21lbnQ+XG4gIH1gO1xufTtcblxuZXhwb3J0IHsgQmFzaWNBbmltYXRpb25NYXRlcmlhbCB9O1xuIiwiaW1wb3J0IHsgU2hhZGVyTGliIH0gZnJvbSAndGhyZWUnO1xuaW1wb3J0IEJhc2VBbmltYXRpb25NYXRlcmlhbCBmcm9tICcuL0Jhc2VBbmltYXRpb25NYXRlcmlhbCc7XG5cbi8qKlxuICogRXh0ZW5kcyBUSFJFRS5NZXNoTGFtYmVydE1hdGVyaWFsIHdpdGggY3VzdG9tIHNoYWRlciBjaHVua3MuXG4gKlxuICogQHNlZSBodHRwOi8vdGhyZWUtYmFzLWV4YW1wbGVzLnN1cmdlLnNoL2V4YW1wbGVzL21hdGVyaWFsc19sYW1iZXJ0L1xuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBwYXJhbWV0ZXJzIE9iamVjdCBjb250YWluaW5nIG1hdGVyaWFsIHByb3BlcnRpZXMgYW5kIGN1c3RvbSBzaGFkZXIgY2h1bmtzLlxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIExhbWJlcnRBbmltYXRpb25NYXRlcmlhbChwYXJhbWV0ZXJzKSB7XG4gIHRoaXMudmFyeWluZ1BhcmFtZXRlcnMgPSBbXTtcbiAgXG4gIHRoaXMudmVydGV4RnVuY3Rpb25zID0gW107XG4gIHRoaXMudmVydGV4UGFyYW1ldGVycyA9IFtdO1xuICB0aGlzLnZlcnRleEluaXQgPSBbXTtcbiAgdGhpcy52ZXJ0ZXhOb3JtYWwgPSBbXTtcbiAgdGhpcy52ZXJ0ZXhQb3NpdGlvbiA9IFtdO1xuICB0aGlzLnZlcnRleENvbG9yID0gW107XG4gIHRoaXMudmVydGV4UG9zdE1vcnBoID0gW107XG4gIHRoaXMudmVydGV4UG9zdFNraW5uaW5nID0gW107XG4gIFxuICB0aGlzLmZyYWdtZW50RnVuY3Rpb25zID0gW107XG4gIHRoaXMuZnJhZ21lbnRQYXJhbWV0ZXJzID0gW107XG4gIHRoaXMuZnJhZ21lbnRJbml0ID0gW107XG4gIHRoaXMuZnJhZ21lbnRNYXAgPSBbXTtcbiAgdGhpcy5mcmFnbWVudERpZmZ1c2UgPSBbXTtcbiAgdGhpcy5mcmFnbWVudEVtaXNzaXZlID0gW107XG4gIHRoaXMuZnJhZ21lbnRTcGVjdWxhciA9IFtdO1xuICBcbiAgQmFzZUFuaW1hdGlvbk1hdGVyaWFsLmNhbGwodGhpcywgcGFyYW1ldGVycywgU2hhZGVyTGliWydsYW1iZXJ0J10udW5pZm9ybXMpO1xuICBcbiAgdGhpcy5saWdodHMgPSB0cnVlO1xuICB0aGlzLnZlcnRleFNoYWRlciA9IHRoaXMuY29uY2F0VmVydGV4U2hhZGVyKCk7XG4gIHRoaXMuZnJhZ21lbnRTaGFkZXIgPSB0aGlzLmNvbmNhdEZyYWdtZW50U2hhZGVyKCk7XG59XG5MYW1iZXJ0QW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShCYXNlQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlKTtcbkxhbWJlcnRBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBMYW1iZXJ0QW5pbWF0aW9uTWF0ZXJpYWw7XG5cbkxhbWJlcnRBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uY2F0VmVydGV4U2hhZGVyID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gYFxuICAjZGVmaW5lIExBTUJFUlRcblxuICB2YXJ5aW5nIHZlYzMgdkxpZ2h0RnJvbnQ7XG4gIFxuICAjaWZkZWYgRE9VQkxFX1NJREVEXG4gIFxuICAgIHZhcnlpbmcgdmVjMyB2TGlnaHRCYWNrO1xuICBcbiAgI2VuZGlmXG4gIFxuICAjaW5jbHVkZSA8Y29tbW9uPlxuICAjaW5jbHVkZSA8dXZfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDx1djJfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxlbnZtYXBfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxic2Rmcz5cbiAgI2luY2x1ZGUgPGxpZ2h0c19wYXJzX2JlZ2luPlxuICAjaW5jbHVkZSA8ZW52bWFwX3BoeXNpY2FsX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxjb2xvcl9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPGZvZ19wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPG1vcnBodGFyZ2V0X3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8c2tpbm5pbmdfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxzaGFkb3dtYXBfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc19wYXJzX3ZlcnRleD5cbiAgXG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UGFyYW1ldGVycycpfVxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZhcnlpbmdQYXJhbWV0ZXJzJyl9XG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4RnVuY3Rpb25zJyl9XG4gIFxuICB2b2lkIG1haW4oKSB7XG4gIFxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4SW5pdCcpfVxuICBcbiAgICAjaW5jbHVkZSA8dXZfdmVydGV4PlxuICAgICNpbmNsdWRlIDx1djJfdmVydGV4PlxuICAgICNpbmNsdWRlIDxjb2xvcl92ZXJ0ZXg+XG4gIFxuICAgICNpbmNsdWRlIDxiZWdpbm5vcm1hbF92ZXJ0ZXg+XG4gICAgXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhOb3JtYWwnKX1cbiAgICBcbiAgICAjaW5jbHVkZSA8bW9ycGhub3JtYWxfdmVydGV4PlxuICAgICNpbmNsdWRlIDxza2luYmFzZV92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPHNraW5ub3JtYWxfdmVydGV4PlxuICAgICNpbmNsdWRlIDxkZWZhdWx0bm9ybWFsX3ZlcnRleD5cbiAgXG4gICAgI2luY2x1ZGUgPGJlZ2luX3ZlcnRleD5cbiAgICBcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBvc2l0aW9uJyl9XG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhDb2xvcicpfVxuICAgIFxuICAgICNpbmNsdWRlIDxtb3JwaHRhcmdldF92ZXJ0ZXg+XG4gICAgXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQb3N0TW9ycGgnKX1cbiAgICBcbiAgICAjaW5jbHVkZSA8c2tpbm5pbmdfdmVydGV4PlxuXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQb3N0U2tpbm5pbmcnKX1cbiAgICBcbiAgICAjaW5jbHVkZSA8cHJvamVjdF92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPGxvZ2RlcHRoYnVmX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX3ZlcnRleD5cbiAgXG4gICAgI2luY2x1ZGUgPHdvcmxkcG9zX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8ZW52bWFwX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8bGlnaHRzX2xhbWJlcnRfdmVydGV4PlxuICAgICNpbmNsdWRlIDxzaGFkb3dtYXBfdmVydGV4PlxuICAgICNpbmNsdWRlIDxmb2dfdmVydGV4PlxuICB9YDtcbn07XG5cbkxhbWJlcnRBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uY2F0RnJhZ21lbnRTaGFkZXIgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiBgXG4gIHVuaWZvcm0gdmVjMyBkaWZmdXNlO1xuICB1bmlmb3JtIHZlYzMgZW1pc3NpdmU7XG4gIHVuaWZvcm0gZmxvYXQgb3BhY2l0eTtcbiAgXG4gIHZhcnlpbmcgdmVjMyB2TGlnaHRGcm9udDtcbiAgXG4gICNpZmRlZiBET1VCTEVfU0lERURcbiAgXG4gICAgdmFyeWluZyB2ZWMzIHZMaWdodEJhY2s7XG4gIFxuICAjZW5kaWZcbiAgXG4gICNpbmNsdWRlIDxjb21tb24+XG4gICNpbmNsdWRlIDxwYWNraW5nPlxuICAjaW5jbHVkZSA8ZGl0aGVyaW5nX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxjb2xvcl9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8dXZfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPHV2Ml9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8bWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxhbHBoYW1hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8YW9tYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGxpZ2h0bWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxlbWlzc2l2ZW1hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8ZW52bWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxic2Rmcz5cbiAgI2luY2x1ZGUgPGxpZ2h0c19wYXJzX2JlZ2luPlxuICAjaW5jbHVkZSA8ZW52bWFwX3BoeXNpY2FsX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxmb2dfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPHNoYWRvd21hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8c2hhZG93bWFza19wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8c3BlY3VsYXJtYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGxvZ2RlcHRoYnVmX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfcGFyc19mcmFnbWVudD5cbiAgXG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRQYXJhbWV0ZXJzJyl9XG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmFyeWluZ1BhcmFtZXRlcnMnKX1cbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudEZ1bmN0aW9ucycpfVxuICBcbiAgdm9pZCBtYWluKCkge1xuICBcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50SW5pdCcpfVxuICBcbiAgICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX2ZyYWdtZW50PlxuXG4gICAgdmVjNCBkaWZmdXNlQ29sb3IgPSB2ZWM0KCBkaWZmdXNlLCBvcGFjaXR5ICk7XG4gICAgUmVmbGVjdGVkTGlnaHQgcmVmbGVjdGVkTGlnaHQgPSBSZWZsZWN0ZWRMaWdodCggdmVjMyggMC4wICksIHZlYzMoIDAuMCApLCB2ZWMzKCAwLjAgKSwgdmVjMyggMC4wICkgKTtcbiAgICB2ZWMzIHRvdGFsRW1pc3NpdmVSYWRpYW5jZSA9IGVtaXNzaXZlO1xuXHRcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50RGlmZnVzZScpfVxuICBcbiAgICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfZnJhZ21lbnQ+XG5cbiAgICAkeyh0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudE1hcCcpIHx8ICcjaW5jbHVkZSA8bWFwX2ZyYWdtZW50PicpfVxuXG4gICAgI2luY2x1ZGUgPGNvbG9yX2ZyYWdtZW50PlxuICAgICNpbmNsdWRlIDxhbHBoYW1hcF9mcmFnbWVudD5cbiAgICAjaW5jbHVkZSA8YWxwaGF0ZXN0X2ZyYWdtZW50PlxuICAgICNpbmNsdWRlIDxzcGVjdWxhcm1hcF9mcmFnbWVudD5cblxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRFbWlzc2l2ZScpfVxuXG4gICAgI2luY2x1ZGUgPGVtaXNzaXZlbWFwX2ZyYWdtZW50PlxuICBcbiAgICAvLyBhY2N1bXVsYXRpb25cbiAgICByZWZsZWN0ZWRMaWdodC5pbmRpcmVjdERpZmZ1c2UgPSBnZXRBbWJpZW50TGlnaHRJcnJhZGlhbmNlKCBhbWJpZW50TGlnaHRDb2xvciApO1xuICBcbiAgICAjaW5jbHVkZSA8bGlnaHRtYXBfZnJhZ21lbnQ+XG4gIFxuICAgIHJlZmxlY3RlZExpZ2h0LmluZGlyZWN0RGlmZnVzZSAqPSBCUkRGX0RpZmZ1c2VfTGFtYmVydCggZGlmZnVzZUNvbG9yLnJnYiApO1xuICBcbiAgICAjaWZkZWYgRE9VQkxFX1NJREVEXG4gIFxuICAgICAgcmVmbGVjdGVkTGlnaHQuZGlyZWN0RGlmZnVzZSA9ICggZ2xfRnJvbnRGYWNpbmcgKSA/IHZMaWdodEZyb250IDogdkxpZ2h0QmFjaztcbiAgXG4gICAgI2Vsc2VcbiAgXG4gICAgICByZWZsZWN0ZWRMaWdodC5kaXJlY3REaWZmdXNlID0gdkxpZ2h0RnJvbnQ7XG4gIFxuICAgICNlbmRpZlxuICBcbiAgICByZWZsZWN0ZWRMaWdodC5kaXJlY3REaWZmdXNlICo9IEJSREZfRGlmZnVzZV9MYW1iZXJ0KCBkaWZmdXNlQ29sb3IucmdiICkgKiBnZXRTaGFkb3dNYXNrKCk7XG4gIFxuICAgIC8vIG1vZHVsYXRpb25cbiAgICAjaW5jbHVkZSA8YW9tYXBfZnJhZ21lbnQ+XG4gIFxuICAgIHZlYzMgb3V0Z29pbmdMaWdodCA9IHJlZmxlY3RlZExpZ2h0LmRpcmVjdERpZmZ1c2UgKyByZWZsZWN0ZWRMaWdodC5pbmRpcmVjdERpZmZ1c2UgKyB0b3RhbEVtaXNzaXZlUmFkaWFuY2U7XG4gIFxuICAgICNpbmNsdWRlIDxlbnZtYXBfZnJhZ21lbnQ+XG4gIFxuICAgIGdsX0ZyYWdDb2xvciA9IHZlYzQoIG91dGdvaW5nTGlnaHQsIGRpZmZ1c2VDb2xvci5hICk7XG4gIFxuICAgICNpbmNsdWRlIDx0b25lbWFwcGluZ19mcmFnbWVudD5cbiAgICAjaW5jbHVkZSA8ZW5jb2RpbmdzX2ZyYWdtZW50PlxuICAgICNpbmNsdWRlIDxmb2dfZnJhZ21lbnQ+XG4gICAgI2luY2x1ZGUgPHByZW11bHRpcGxpZWRfYWxwaGFfZnJhZ21lbnQ+XG4gICAgI2luY2x1ZGUgPGRpdGhlcmluZ19mcmFnbWVudD5cbiAgfWA7XG59O1xuXG5leHBvcnQgeyBMYW1iZXJ0QW5pbWF0aW9uTWF0ZXJpYWwgfTtcbiIsImltcG9ydCB7IFNoYWRlckxpYiB9IGZyb20gJ3RocmVlJztcbmltcG9ydCBCYXNlQW5pbWF0aW9uTWF0ZXJpYWwgZnJvbSAnLi9CYXNlQW5pbWF0aW9uTWF0ZXJpYWwnO1xuXG4vKipcbiAqIEV4dGVuZHMgVEhSRUUuTWVzaFBob25nTWF0ZXJpYWwgd2l0aCBjdXN0b20gc2hhZGVyIGNodW5rcy5cbiAqXG4gKiBAc2VlIGh0dHA6Ly90aHJlZS1iYXMtZXhhbXBsZXMuc3VyZ2Uuc2gvZXhhbXBsZXMvbWF0ZXJpYWxzX3Bob25nL1xuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBwYXJhbWV0ZXJzIE9iamVjdCBjb250YWluaW5nIG1hdGVyaWFsIHByb3BlcnRpZXMgYW5kIGN1c3RvbSBzaGFkZXIgY2h1bmtzLlxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIFBob25nQW5pbWF0aW9uTWF0ZXJpYWwocGFyYW1ldGVycykge1xuICB0aGlzLnZhcnlpbmdQYXJhbWV0ZXJzID0gW107XG5cbiAgdGhpcy52ZXJ0ZXhGdW5jdGlvbnMgPSBbXTtcbiAgdGhpcy52ZXJ0ZXhQYXJhbWV0ZXJzID0gW107XG4gIHRoaXMudmVydGV4SW5pdCA9IFtdO1xuICB0aGlzLnZlcnRleE5vcm1hbCA9IFtdO1xuICB0aGlzLnZlcnRleFBvc2l0aW9uID0gW107XG4gIHRoaXMudmVydGV4Q29sb3IgPSBbXTtcblxuICB0aGlzLmZyYWdtZW50RnVuY3Rpb25zID0gW107XG4gIHRoaXMuZnJhZ21lbnRQYXJhbWV0ZXJzID0gW107XG4gIHRoaXMuZnJhZ21lbnRJbml0ID0gW107XG4gIHRoaXMuZnJhZ21lbnRNYXAgPSBbXTtcbiAgdGhpcy5mcmFnbWVudERpZmZ1c2UgPSBbXTtcbiAgdGhpcy5mcmFnbWVudEVtaXNzaXZlID0gW107XG4gIHRoaXMuZnJhZ21lbnRTcGVjdWxhciA9IFtdO1xuXG4gIEJhc2VBbmltYXRpb25NYXRlcmlhbC5jYWxsKHRoaXMsIHBhcmFtZXRlcnMsIFNoYWRlckxpYlsncGhvbmcnXS51bmlmb3Jtcyk7XG5cbiAgdGhpcy5saWdodHMgPSB0cnVlO1xuICB0aGlzLnZlcnRleFNoYWRlciA9IHRoaXMuY29uY2F0VmVydGV4U2hhZGVyKCk7XG4gIHRoaXMuZnJhZ21lbnRTaGFkZXIgPSB0aGlzLmNvbmNhdEZyYWdtZW50U2hhZGVyKCk7XG59XG5QaG9uZ0FuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoQmFzZUFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZSk7XG5QaG9uZ0FuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFBob25nQW5pbWF0aW9uTWF0ZXJpYWw7XG5cblBob25nQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlLmNvbmNhdFZlcnRleFNoYWRlciA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIGBcbiAgI2RlZmluZSBQSE9OR1xuXG4gIHZhcnlpbmcgdmVjMyB2Vmlld1Bvc2l0aW9uO1xuXG4gICNpZm5kZWYgRkxBVF9TSEFERURcblxuICAgIHZhcnlpbmcgdmVjMyB2Tm9ybWFsO1xuXG4gICNlbmRpZlxuXG4gICNpbmNsdWRlIDxjb21tb24+XG4gICNpbmNsdWRlIDx1dl9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPHV2Ml9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPGRpc3BsYWNlbWVudG1hcF9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPGVudm1hcF9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPGNvbG9yX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8Zm9nX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8bW9ycGh0YXJnZXRfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxza2lubmluZ19wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPHNoYWRvd21hcF9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPGxvZ2RlcHRoYnVmX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX3BhcnNfdmVydGV4PlxuXG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UGFyYW1ldGVycycpfVxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZhcnlpbmdQYXJhbWV0ZXJzJyl9XG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4RnVuY3Rpb25zJyl9XG5cbiAgdm9pZCBtYWluKCkge1xuXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhJbml0Jyl9XG5cbiAgICAjaW5jbHVkZSA8dXZfdmVydGV4PlxuICAgICNpbmNsdWRlIDx1djJfdmVydGV4PlxuICAgICNpbmNsdWRlIDxjb2xvcl92ZXJ0ZXg+XG5cbiAgICAjaW5jbHVkZSA8YmVnaW5ub3JtYWxfdmVydGV4PlxuXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhOb3JtYWwnKX1cblxuICAgICNpbmNsdWRlIDxtb3JwaG5vcm1hbF92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPHNraW5iYXNlX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8c2tpbm5vcm1hbF92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPGRlZmF1bHRub3JtYWxfdmVydGV4PlxuXG4gICNpZm5kZWYgRkxBVF9TSEFERUQgLy8gTm9ybWFsIGNvbXB1dGVkIHdpdGggZGVyaXZhdGl2ZXMgd2hlbiBGTEFUX1NIQURFRFxuXG4gICAgdk5vcm1hbCA9IG5vcm1hbGl6ZSggdHJhbnNmb3JtZWROb3JtYWwgKTtcblxuICAjZW5kaWZcblxuICAgICNpbmNsdWRlIDxiZWdpbl92ZXJ0ZXg+XG5cbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBvc2l0aW9uJyl9XG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhDb2xvcicpfVxuXG4gICAgI2luY2x1ZGUgPG1vcnBodGFyZ2V0X3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8c2tpbm5pbmdfdmVydGV4PlxuICAgICNpbmNsdWRlIDxkaXNwbGFjZW1lbnRtYXBfdmVydGV4PlxuICAgICNpbmNsdWRlIDxwcm9qZWN0X3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfdmVydGV4PlxuICAgICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfdmVydGV4PlxuXG4gICAgdlZpZXdQb3NpdGlvbiA9IC0gbXZQb3NpdGlvbi54eXo7XG5cbiAgICAjaW5jbHVkZSA8d29ybGRwb3NfdmVydGV4PlxuICAgICNpbmNsdWRlIDxlbnZtYXBfdmVydGV4PlxuICAgICNpbmNsdWRlIDxzaGFkb3dtYXBfdmVydGV4PlxuICAgICNpbmNsdWRlIDxmb2dfdmVydGV4PlxuICB9YDtcbn07XG5cblBob25nQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlLmNvbmNhdEZyYWdtZW50U2hhZGVyID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gYFxuICAjZGVmaW5lIFBIT05HXG5cbiAgdW5pZm9ybSB2ZWMzIGRpZmZ1c2U7XG4gIHVuaWZvcm0gdmVjMyBlbWlzc2l2ZTtcbiAgdW5pZm9ybSB2ZWMzIHNwZWN1bGFyO1xuICB1bmlmb3JtIGZsb2F0IHNoaW5pbmVzcztcbiAgdW5pZm9ybSBmbG9hdCBvcGFjaXR5O1xuXG4gICNpbmNsdWRlIDxjb21tb24+XG4gICNpbmNsdWRlIDxwYWNraW5nPlxuICAjaW5jbHVkZSA8ZGl0aGVyaW5nX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxjb2xvcl9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8dXZfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPHV2Ml9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8bWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxhbHBoYW1hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8YW9tYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGxpZ2h0bWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxlbWlzc2l2ZW1hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8ZW52bWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxncmFkaWVudG1hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8Zm9nX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxic2Rmcz5cbiAgI2luY2x1ZGUgPGxpZ2h0c19wYXJzX2JlZ2luPlxuICAjaW5jbHVkZSA8ZW52bWFwX3BoeXNpY2FsX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxsaWdodHNfcGhvbmdfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPHNoYWRvd21hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8YnVtcG1hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8bm9ybWFsbWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxzcGVjdWxhcm1hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc19wYXJzX2ZyYWdtZW50PlxuXG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRQYXJhbWV0ZXJzJyl9XG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmFyeWluZ1BhcmFtZXRlcnMnKX1cbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudEZ1bmN0aW9ucycpfVxuXG4gIHZvaWQgbWFpbigpIHtcblxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRJbml0Jyl9XG5cbiAgICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX2ZyYWdtZW50PlxuXG4gICAgdmVjNCBkaWZmdXNlQ29sb3IgPSB2ZWM0KCBkaWZmdXNlLCBvcGFjaXR5ICk7XG4gICAgUmVmbGVjdGVkTGlnaHQgcmVmbGVjdGVkTGlnaHQgPSBSZWZsZWN0ZWRMaWdodCggdmVjMyggMC4wICksIHZlYzMoIDAuMCApLCB2ZWMzKCAwLjAgKSwgdmVjMyggMC4wICkgKTtcbiAgICB2ZWMzIHRvdGFsRW1pc3NpdmVSYWRpYW5jZSA9IGVtaXNzaXZlO1xuXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudERpZmZ1c2UnKX1cblxuICAgICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl9mcmFnbWVudD5cblxuICAgICR7KHRoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50TWFwJykgfHwgJyNpbmNsdWRlIDxtYXBfZnJhZ21lbnQ+Jyl9XG5cbiAgICAjaW5jbHVkZSA8Y29sb3JfZnJhZ21lbnQ+XG4gICAgI2luY2x1ZGUgPGFscGhhbWFwX2ZyYWdtZW50PlxuICAgICNpbmNsdWRlIDxhbHBoYXRlc3RfZnJhZ21lbnQ+XG4gICAgI2luY2x1ZGUgPHNwZWN1bGFybWFwX2ZyYWdtZW50PlxuICAgICNpbmNsdWRlIDxub3JtYWxfZnJhZ21lbnRfYmVnaW4+XG4gICAgI2luY2x1ZGUgPG5vcm1hbF9mcmFnbWVudF9tYXBzPlxuXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudEVtaXNzaXZlJyl9XG5cbiAgICAjaW5jbHVkZSA8ZW1pc3NpdmVtYXBfZnJhZ21lbnQ+XG5cbiAgICAvLyBhY2N1bXVsYXRpb25cbiAgICAjaW5jbHVkZSA8bGlnaHRzX3Bob25nX2ZyYWdtZW50PlxuICAgICNpbmNsdWRlIDxsaWdodHNfZnJhZ21lbnRfYmVnaW4+XG4gICAgI2luY2x1ZGUgPGxpZ2h0c19mcmFnbWVudF9tYXBzPlxuICAgICNpbmNsdWRlIDxsaWdodHNfZnJhZ21lbnRfZW5kPlxuXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudFNwZWN1bGFyJyl9XG5cbiAgICAvLyBtb2R1bGF0aW9uXG4gICAgI2luY2x1ZGUgPGFvbWFwX2ZyYWdtZW50PlxuXG4gICAgdmVjMyBvdXRnb2luZ0xpZ2h0ID0gcmVmbGVjdGVkTGlnaHQuZGlyZWN0RGlmZnVzZSArIHJlZmxlY3RlZExpZ2h0LmluZGlyZWN0RGlmZnVzZSArIHJlZmxlY3RlZExpZ2h0LmRpcmVjdFNwZWN1bGFyICsgcmVmbGVjdGVkTGlnaHQuaW5kaXJlY3RTcGVjdWxhciArIHRvdGFsRW1pc3NpdmVSYWRpYW5jZTtcblxuICAgICNpbmNsdWRlIDxlbnZtYXBfZnJhZ21lbnQ+XG5cbiAgICBnbF9GcmFnQ29sb3IgPSB2ZWM0KCBvdXRnb2luZ0xpZ2h0LCBkaWZmdXNlQ29sb3IuYSApO1xuXG4gICAgI2luY2x1ZGUgPHRvbmVtYXBwaW5nX2ZyYWdtZW50PlxuICAgICNpbmNsdWRlIDxlbmNvZGluZ3NfZnJhZ21lbnQ+XG4gICAgI2luY2x1ZGUgPGZvZ19mcmFnbWVudD5cbiAgICAjaW5jbHVkZSA8cHJlbXVsdGlwbGllZF9hbHBoYV9mcmFnbWVudD5cbiAgICAjaW5jbHVkZSA8ZGl0aGVyaW5nX2ZyYWdtZW50PlxuXG4gIH1gO1xufTtcblxuZXhwb3J0IHsgUGhvbmdBbmltYXRpb25NYXRlcmlhbCB9O1xuIiwiaW1wb3J0IHsgU2hhZGVyTGliIH0gZnJvbSAndGhyZWUnO1xuaW1wb3J0IEJhc2VBbmltYXRpb25NYXRlcmlhbCBmcm9tICcuL0Jhc2VBbmltYXRpb25NYXRlcmlhbCc7XG5cbi8qKlxuICogRXh0ZW5kcyBUSFJFRS5NZXNoU3RhbmRhcmRNYXRlcmlhbCB3aXRoIGN1c3RvbSBzaGFkZXIgY2h1bmtzLlxuICpcbiAqIEBzZWUgaHR0cDovL3RocmVlLWJhcy1leGFtcGxlcy5zdXJnZS5zaC9leGFtcGxlcy9tYXRlcmlhbHNfc3RhbmRhcmQvXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IHBhcmFtZXRlcnMgT2JqZWN0IGNvbnRhaW5pbmcgbWF0ZXJpYWwgcHJvcGVydGllcyBhbmQgY3VzdG9tIHNoYWRlciBjaHVua3MuXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gU3RhbmRhcmRBbmltYXRpb25NYXRlcmlhbChwYXJhbWV0ZXJzKSB7XG4gIHRoaXMudmFyeWluZ1BhcmFtZXRlcnMgPSBbXTtcblxuICB0aGlzLnZlcnRleEZ1bmN0aW9ucyA9IFtdO1xuICB0aGlzLnZlcnRleFBhcmFtZXRlcnMgPSBbXTtcbiAgdGhpcy52ZXJ0ZXhJbml0ID0gW107XG4gIHRoaXMudmVydGV4Tm9ybWFsID0gW107XG4gIHRoaXMudmVydGV4UG9zaXRpb24gPSBbXTtcbiAgdGhpcy52ZXJ0ZXhDb2xvciA9IFtdO1xuICB0aGlzLnZlcnRleFBvc3RNb3JwaCA9IFtdO1xuICB0aGlzLnZlcnRleFBvc3RTa2lubmluZyA9IFtdO1xuXG4gIHRoaXMuZnJhZ21lbnRGdW5jdGlvbnMgPSBbXTtcbiAgdGhpcy5mcmFnbWVudFBhcmFtZXRlcnMgPSBbXTtcbiAgdGhpcy5mcmFnbWVudEluaXQgPSBbXTtcbiAgdGhpcy5mcmFnbWVudE1hcCA9IFtdO1xuICB0aGlzLmZyYWdtZW50RGlmZnVzZSA9IFtdO1xuICB0aGlzLmZyYWdtZW50Um91Z2huZXNzID0gW107XG4gIHRoaXMuZnJhZ21lbnRNZXRhbG5lc3MgPSBbXTtcbiAgdGhpcy5mcmFnbWVudEVtaXNzaXZlID0gW107XG5cbiAgQmFzZUFuaW1hdGlvbk1hdGVyaWFsLmNhbGwodGhpcywgcGFyYW1ldGVycywgU2hhZGVyTGliWydzdGFuZGFyZCddLnVuaWZvcm1zKTtcblxuICB0aGlzLmxpZ2h0cyA9IHRydWU7XG4gIHRoaXMudmVydGV4U2hhZGVyID0gdGhpcy5jb25jYXRWZXJ0ZXhTaGFkZXIoKTtcbiAgdGhpcy5mcmFnbWVudFNoYWRlciA9IHRoaXMuY29uY2F0RnJhZ21lbnRTaGFkZXIoKTtcbn1cblN0YW5kYXJkQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShCYXNlQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlKTtcblN0YW5kYXJkQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gU3RhbmRhcmRBbmltYXRpb25NYXRlcmlhbDtcblxuU3RhbmRhcmRBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uY2F0VmVydGV4U2hhZGVyID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gYFxuICAjZGVmaW5lIFBIWVNJQ0FMXG5cbiAgdmFyeWluZyB2ZWMzIHZWaWV3UG9zaXRpb247XG4gIFxuICAjaWZuZGVmIEZMQVRfU0hBREVEXG4gIFxuICAgIHZhcnlpbmcgdmVjMyB2Tm9ybWFsO1xuICBcbiAgI2VuZGlmXG4gIFxuICAjaW5jbHVkZSA8Y29tbW9uPlxuICAjaW5jbHVkZSA8dXZfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDx1djJfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxkaXNwbGFjZW1lbnRtYXBfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxjb2xvcl9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPGZvZ19wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPG1vcnBodGFyZ2V0X3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8c2tpbm5pbmdfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxzaGFkb3dtYXBfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl9wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc19wYXJzX3ZlcnRleD5cbiAgXG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UGFyYW1ldGVycycpfVxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZhcnlpbmdQYXJhbWV0ZXJzJyl9XG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4RnVuY3Rpb25zJyl9XG4gIFxuICB2b2lkIG1haW4oKSB7XG5cbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleEluaXQnKX1cblxuICAgICNpbmNsdWRlIDx1dl92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPHV2Ml92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPGNvbG9yX3ZlcnRleD5cbiAgXG4gICAgI2luY2x1ZGUgPGJlZ2lubm9ybWFsX3ZlcnRleD5cbiAgICBcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleE5vcm1hbCcpfVxuICAgIFxuICAgICNpbmNsdWRlIDxtb3JwaG5vcm1hbF92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPHNraW5iYXNlX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8c2tpbm5vcm1hbF92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPGRlZmF1bHRub3JtYWxfdmVydGV4PlxuICBcbiAgI2lmbmRlZiBGTEFUX1NIQURFRCAvLyBOb3JtYWwgY29tcHV0ZWQgd2l0aCBkZXJpdmF0aXZlcyB3aGVuIEZMQVRfU0hBREVEXG4gIFxuICAgIHZOb3JtYWwgPSBub3JtYWxpemUoIHRyYW5zZm9ybWVkTm9ybWFsICk7XG4gIFxuICAjZW5kaWZcbiAgXG4gICAgI2luY2x1ZGUgPGJlZ2luX3ZlcnRleD5cbiAgICBcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBvc2l0aW9uJyl9XG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhDb2xvcicpfVxuICAgIFxuICAgICNpbmNsdWRlIDxtb3JwaHRhcmdldF92ZXJ0ZXg+XG4gICAgXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQb3N0TW9ycGgnKX1cbiAgICBcbiAgICAjaW5jbHVkZSA8c2tpbm5pbmdfdmVydGV4PlxuXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQb3N0U2tpbm5pbmcnKX1cbiAgICBcbiAgICAjaW5jbHVkZSA8ZGlzcGxhY2VtZW50bWFwX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8cHJvamVjdF92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPGxvZ2RlcHRoYnVmX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX3ZlcnRleD5cbiAgXG4gICAgdlZpZXdQb3NpdGlvbiA9IC0gbXZQb3NpdGlvbi54eXo7XG4gIFxuICAgICNpbmNsdWRlIDx3b3JsZHBvc192ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPHNoYWRvd21hcF92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPGZvZ192ZXJ0ZXg+XG4gIH1gO1xufTtcblxuU3RhbmRhcmRBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uY2F0RnJhZ21lbnRTaGFkZXIgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiBgXG4gICNkZWZpbmUgUEhZU0lDQUxcbiAgXG4gIHVuaWZvcm0gdmVjMyBkaWZmdXNlO1xuICB1bmlmb3JtIHZlYzMgZW1pc3NpdmU7XG4gIHVuaWZvcm0gZmxvYXQgcm91Z2huZXNzO1xuICB1bmlmb3JtIGZsb2F0IG1ldGFsbmVzcztcbiAgdW5pZm9ybSBmbG9hdCBvcGFjaXR5O1xuICBcbiAgI2lmbmRlZiBTVEFOREFSRFxuICAgIHVuaWZvcm0gZmxvYXQgY2xlYXJDb2F0O1xuICAgIHVuaWZvcm0gZmxvYXQgY2xlYXJDb2F0Um91Z2huZXNzO1xuICAjZW5kaWZcbiAgXG4gIHZhcnlpbmcgdmVjMyB2Vmlld1Bvc2l0aW9uO1xuICBcbiAgI2lmbmRlZiBGTEFUX1NIQURFRFxuICBcbiAgICB2YXJ5aW5nIHZlYzMgdk5vcm1hbDtcbiAgXG4gICNlbmRpZlxuICBcbiAgI2luY2x1ZGUgPGNvbW1vbj5cbiAgI2luY2x1ZGUgPHBhY2tpbmc+XG4gICNpbmNsdWRlIDxkaXRoZXJpbmdfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGNvbG9yX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDx1dl9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8dXYyX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxtYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGFscGhhbWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxhb21hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8bGlnaHRtYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGVtaXNzaXZlbWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxlbnZtYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGZvZ19wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8YnNkZnM+XG4gICNpbmNsdWRlIDxjdWJlX3V2X3JlZmxlY3Rpb25fZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxsaWdodHNfcGFyc19iZWdpbj5cbiAgI2luY2x1ZGUgPGVudm1hcF9waHlzaWNhbF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8bGlnaHRzX3BoeXNpY2FsX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxzaGFkb3dtYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGJ1bXBtYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPG5vcm1hbG1hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8cm91Z2huZXNzbWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxtZXRhbG5lc3NtYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGxvZ2RlcHRoYnVmX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfcGFyc19mcmFnbWVudD5cbiAgXG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRQYXJhbWV0ZXJzJyl9XG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmFyeWluZ1BhcmFtZXRlcnMnKX1cbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudEZ1bmN0aW9ucycpfVxuICBcbiAgdm9pZCBtYWluKCkge1xuICBcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50SW5pdCcpfVxuICBcbiAgICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX2ZyYWdtZW50PlxuICBcbiAgICB2ZWM0IGRpZmZ1c2VDb2xvciA9IHZlYzQoIGRpZmZ1c2UsIG9wYWNpdHkgKTtcbiAgICBSZWZsZWN0ZWRMaWdodCByZWZsZWN0ZWRMaWdodCA9IFJlZmxlY3RlZExpZ2h0KCB2ZWMzKCAwLjAgKSwgdmVjMyggMC4wICksIHZlYzMoIDAuMCApLCB2ZWMzKCAwLjAgKSApO1xuICAgIHZlYzMgdG90YWxFbWlzc2l2ZVJhZGlhbmNlID0gZW1pc3NpdmU7XG4gIFxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnREaWZmdXNlJyl9XG4gIFxuICAgICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl9mcmFnbWVudD5cblxuICAgICR7KHRoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50TWFwJykgfHwgJyNpbmNsdWRlIDxtYXBfZnJhZ21lbnQ+Jyl9XG5cbiAgICAjaW5jbHVkZSA8Y29sb3JfZnJhZ21lbnQ+XG4gICAgI2luY2x1ZGUgPGFscGhhbWFwX2ZyYWdtZW50PlxuICAgICNpbmNsdWRlIDxhbHBoYXRlc3RfZnJhZ21lbnQ+XG4gICAgXG4gICAgZmxvYXQgcm91Z2huZXNzRmFjdG9yID0gcm91Z2huZXNzO1xuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRSb3VnaG5lc3MnKX1cbiAgICAjaWZkZWYgVVNFX1JPVUdITkVTU01BUFxuICAgIFxuICAgICAgdmVjNCB0ZXhlbFJvdWdobmVzcyA9IHRleHR1cmUyRCggcm91Z2huZXNzTWFwLCB2VXYgKTtcbiAgICBcbiAgICAgIC8vIHJlYWRzIGNoYW5uZWwgRywgY29tcGF0aWJsZSB3aXRoIGEgY29tYmluZWQgT2NjbHVzaW9uUm91Z2huZXNzTWV0YWxsaWMgKFJHQikgdGV4dHVyZVxuICAgICAgcm91Z2huZXNzRmFjdG9yICo9IHRleGVsUm91Z2huZXNzLmc7XG4gICAgXG4gICAgI2VuZGlmXG4gICAgXG4gICAgZmxvYXQgbWV0YWxuZXNzRmFjdG9yID0gbWV0YWxuZXNzO1xuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRNZXRhbG5lc3MnKX1cbiAgICAjaWZkZWYgVVNFX01FVEFMTkVTU01BUFxuICAgIFxuICAgICAgdmVjNCB0ZXhlbE1ldGFsbmVzcyA9IHRleHR1cmUyRCggbWV0YWxuZXNzTWFwLCB2VXYgKTtcbiAgICAgIG1ldGFsbmVzc0ZhY3RvciAqPSB0ZXhlbE1ldGFsbmVzcy5iO1xuICAgIFxuICAgICNlbmRpZlxuICAgIFxuICAgICNpbmNsdWRlIDxub3JtYWxfZnJhZ21lbnRfYmVnaW4+XG4gICAgI2luY2x1ZGUgPG5vcm1hbF9mcmFnbWVudF9tYXBzPlxuICAgIFxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRFbWlzc2l2ZScpfVxuICAgIFxuICAgICNpbmNsdWRlIDxlbWlzc2l2ZW1hcF9mcmFnbWVudD5cbiAgXG4gICAgLy8gYWNjdW11bGF0aW9uXG4gICAgI2luY2x1ZGUgPGxpZ2h0c19waHlzaWNhbF9mcmFnbWVudD5cbiAgICAjaW5jbHVkZSA8bGlnaHRzX2ZyYWdtZW50X2JlZ2luPlxuICAgICNpbmNsdWRlIDxsaWdodHNfZnJhZ21lbnRfbWFwcz5cbiAgICAjaW5jbHVkZSA8bGlnaHRzX2ZyYWdtZW50X2VuZD5cbiAgXG4gICAgLy8gbW9kdWxhdGlvblxuICAgICNpbmNsdWRlIDxhb21hcF9mcmFnbWVudD5cbiAgXG4gICAgdmVjMyBvdXRnb2luZ0xpZ2h0ID0gcmVmbGVjdGVkTGlnaHQuZGlyZWN0RGlmZnVzZSArIHJlZmxlY3RlZExpZ2h0LmluZGlyZWN0RGlmZnVzZSArIHJlZmxlY3RlZExpZ2h0LmRpcmVjdFNwZWN1bGFyICsgcmVmbGVjdGVkTGlnaHQuaW5kaXJlY3RTcGVjdWxhciArIHRvdGFsRW1pc3NpdmVSYWRpYW5jZTtcbiAgXG4gICAgZ2xfRnJhZ0NvbG9yID0gdmVjNCggb3V0Z29pbmdMaWdodCwgZGlmZnVzZUNvbG9yLmEgKTtcbiAgXG4gICAgI2luY2x1ZGUgPHRvbmVtYXBwaW5nX2ZyYWdtZW50PlxuICAgICNpbmNsdWRlIDxlbmNvZGluZ3NfZnJhZ21lbnQ+XG4gICAgI2luY2x1ZGUgPGZvZ19mcmFnbWVudD5cbiAgICAjaW5jbHVkZSA8cHJlbXVsdGlwbGllZF9hbHBoYV9mcmFnbWVudD5cbiAgICAjaW5jbHVkZSA8ZGl0aGVyaW5nX2ZyYWdtZW50PlxuICBcbiAgfWA7XG59O1xuXG5leHBvcnQgeyBTdGFuZGFyZEFuaW1hdGlvbk1hdGVyaWFsIH07XG4iLCJpbXBvcnQgeyBTaGFkZXJMaWIgfSBmcm9tICd0aHJlZSc7XG5pbXBvcnQgeyBQaG9uZ0FuaW1hdGlvbk1hdGVyaWFsIH0gZnJvbSAnLi9QaG9uZ0FuaW1hdGlvbk1hdGVyaWFsJztcblxuLyoqXG4gKiBFeHRlbmRzIFRIUkVFLk1lc2hUb29uTWF0ZXJpYWwgd2l0aCBjdXN0b20gc2hhZGVyIGNodW5rcy4gTWVzaFRvb25NYXRlcmlhbCBpcyBtb3N0bHkgdGhlIHNhbWUgYXMgTWVzaFBob25nTWF0ZXJpYWwuIFRoZSBvbmx5IGRpZmZlcmVuY2UgaXMgYSBUT09OIGRlZmluZSwgYW5kIHN1cHBvcnQgZm9yIGEgZ3JhZGllbnRNYXAgdW5pZm9ybS5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gcGFyYW1ldGVycyBPYmplY3QgY29udGFpbmluZyBtYXRlcmlhbCBwcm9wZXJ0aWVzIGFuZCBjdXN0b20gc2hhZGVyIGNodW5rcy5cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBUb29uQW5pbWF0aW9uTWF0ZXJpYWwocGFyYW1ldGVycykge1xuICBpZiAoIXBhcmFtZXRlcnMuZGVmaW5lcykge1xuICAgIHBhcmFtZXRlcnMuZGVmaW5lcyA9IHt9XG4gIH1cbiAgcGFyYW1ldGVycy5kZWZpbmVzWydUT09OJ10gPSAnJ1xuXG4gIFBob25nQW5pbWF0aW9uTWF0ZXJpYWwuY2FsbCh0aGlzLCBwYXJhbWV0ZXJzKTtcbn1cblRvb25BbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFBob25nQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlKTtcblRvb25BbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBUb29uQW5pbWF0aW9uTWF0ZXJpYWw7XG5cbmV4cG9ydCB7IFRvb25BbmltYXRpb25NYXRlcmlhbCB9O1xuIiwiaW1wb3J0IHsgU2hhZGVyTGliIH0gZnJvbSAndGhyZWUnO1xuaW1wb3J0IEJhc2VBbmltYXRpb25NYXRlcmlhbCBmcm9tICcuL0Jhc2VBbmltYXRpb25NYXRlcmlhbCc7XG5cbi8qKlxuICogRXh0ZW5kcyBUSFJFRS5Qb2ludHNNYXRlcmlhbCB3aXRoIGN1c3RvbSBzaGFkZXIgY2h1bmtzLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBwYXJhbWV0ZXJzIE9iamVjdCBjb250YWluaW5nIG1hdGVyaWFsIHByb3BlcnRpZXMgYW5kIGN1c3RvbSBzaGFkZXIgY2h1bmtzLlxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIFBvaW50c0FuaW1hdGlvbk1hdGVyaWFsKHBhcmFtZXRlcnMpIHtcbiAgdGhpcy52YXJ5aW5nUGFyYW1ldGVycyA9IFtdO1xuICBcbiAgdGhpcy52ZXJ0ZXhGdW5jdGlvbnMgPSBbXTtcbiAgdGhpcy52ZXJ0ZXhQYXJhbWV0ZXJzID0gW107XG4gIHRoaXMudmVydGV4SW5pdCA9IFtdO1xuICB0aGlzLnZlcnRleFBvc2l0aW9uID0gW107XG4gIHRoaXMudmVydGV4Q29sb3IgPSBbXTtcbiAgXG4gIHRoaXMuZnJhZ21lbnRGdW5jdGlvbnMgPSBbXTtcbiAgdGhpcy5mcmFnbWVudFBhcmFtZXRlcnMgPSBbXTtcbiAgdGhpcy5mcmFnbWVudEluaXQgPSBbXTtcbiAgdGhpcy5mcmFnbWVudE1hcCA9IFtdO1xuICB0aGlzLmZyYWdtZW50RGlmZnVzZSA9IFtdO1xuICAvLyB1c2UgZnJhZ21lbnQgc2hhZGVyIHRvIHNoYXBlIHRvIHBvaW50LCByZWZlcmVuY2U6IGh0dHBzOi8vdGhlYm9va29mc2hhZGVycy5jb20vMDcvXG4gIHRoaXMuZnJhZ21lbnRTaGFwZSA9IFtdO1xuICBcbiAgQmFzZUFuaW1hdGlvbk1hdGVyaWFsLmNhbGwodGhpcywgcGFyYW1ldGVycywgU2hhZGVyTGliWydwb2ludHMnXS51bmlmb3Jtcyk7XG4gIFxuICB0aGlzLnZlcnRleFNoYWRlciA9IHRoaXMuY29uY2F0VmVydGV4U2hhZGVyKCk7XG4gIHRoaXMuZnJhZ21lbnRTaGFkZXIgPSB0aGlzLmNvbmNhdEZyYWdtZW50U2hhZGVyKCk7XG59XG5cblBvaW50c0FuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoQmFzZUFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZSk7XG5Qb2ludHNBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBQb2ludHNBbmltYXRpb25NYXRlcmlhbDtcblxuUG9pbnRzQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlLmNvbmNhdFZlcnRleFNoYWRlciA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIGBcbiAgdW5pZm9ybSBmbG9hdCBzaXplO1xuICB1bmlmb3JtIGZsb2F0IHNjYWxlO1xuICBcbiAgI2luY2x1ZGUgPGNvbW1vbj5cbiAgI2luY2x1ZGUgPGNvbG9yX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8Zm9nX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8c2hhZG93bWFwX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfcGFyc192ZXJ0ZXg+XG4gIFxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBhcmFtZXRlcnMnKX1cbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2YXJ5aW5nUGFyYW1ldGVycycpfVxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleEZ1bmN0aW9ucycpfVxuICBcbiAgdm9pZCBtYWluKCkge1xuICBcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleEluaXQnKX1cbiAgXG4gICAgI2luY2x1ZGUgPGNvbG9yX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8YmVnaW5fdmVydGV4PlxuICAgIFxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UG9zaXRpb24nKX1cbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleENvbG9yJyl9XG4gICAgXG4gICAgI2luY2x1ZGUgPHByb2plY3RfdmVydGV4PlxuICBcbiAgICAjaWZkZWYgVVNFX1NJWkVBVFRFTlVBVElPTlxuICAgICAgZ2xfUG9pbnRTaXplID0gc2l6ZSAqICggc2NhbGUgLyAtIG12UG9zaXRpb24ueiApO1xuICAgICNlbHNlXG4gICAgICBnbF9Qb2ludFNpemUgPSBzaXplO1xuICAgICNlbmRpZlxuICBcbiAgICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfdmVydGV4PlxuICAgICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfdmVydGV4PlxuICAgICNpbmNsdWRlIDx3b3JsZHBvc192ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPHNoYWRvd21hcF92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPGZvZ192ZXJ0ZXg+XG4gIH1gO1xufTtcblxuUG9pbnRzQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlLmNvbmNhdEZyYWdtZW50U2hhZGVyID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gYFxuICB1bmlmb3JtIHZlYzMgZGlmZnVzZTtcbiAgdW5pZm9ybSBmbG9hdCBvcGFjaXR5O1xuICBcbiAgI2luY2x1ZGUgPGNvbW1vbj5cbiAgI2luY2x1ZGUgPHBhY2tpbmc+XG4gICNpbmNsdWRlIDxjb2xvcl9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8bWFwX3BhcnRpY2xlX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxmb2dfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPHNoYWRvd21hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc19wYXJzX2ZyYWdtZW50PlxuICBcbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudFBhcmFtZXRlcnMnKX1cbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2YXJ5aW5nUGFyYW1ldGVycycpfVxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50RnVuY3Rpb25zJyl9XG4gIFxuICB2b2lkIG1haW4oKSB7XG4gIFxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRJbml0Jyl9XG4gIFxuICAgICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfZnJhZ21lbnQ+XG4gIFxuICAgIHZlYzMgb3V0Z29pbmdMaWdodCA9IHZlYzMoIDAuMCApO1xuICAgIHZlYzQgZGlmZnVzZUNvbG9yID0gdmVjNCggZGlmZnVzZSwgb3BhY2l0eSApO1xuICBcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50RGlmZnVzZScpfVxuICBcbiAgICAjaW5jbHVkZSA8bG9nZGVwdGhidWZfZnJhZ21lbnQ+XG5cbiAgICAkeyh0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudE1hcCcpIHx8ICcjaW5jbHVkZSA8bWFwX3BhcnRpY2xlX2ZyYWdtZW50PicpfVxuXG4gICAgI2luY2x1ZGUgPGNvbG9yX2ZyYWdtZW50PlxuICAgICNpbmNsdWRlIDxhbHBoYXRlc3RfZnJhZ21lbnQ+XG4gIFxuICAgIG91dGdvaW5nTGlnaHQgPSBkaWZmdXNlQ29sb3IucmdiO1xuICBcbiAgICBnbF9GcmFnQ29sb3IgPSB2ZWM0KCBvdXRnb2luZ0xpZ2h0LCBkaWZmdXNlQ29sb3IuYSApO1xuICAgIFxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRTaGFwZScpfVxuICBcbiAgICAjaW5jbHVkZSA8cHJlbXVsdGlwbGllZF9hbHBoYV9mcmFnbWVudD5cbiAgICAjaW5jbHVkZSA8dG9uZW1hcHBpbmdfZnJhZ21lbnQ+XG4gICAgI2luY2x1ZGUgPGVuY29kaW5nc19mcmFnbWVudD5cbiAgICAjaW5jbHVkZSA8Zm9nX2ZyYWdtZW50PlxuICB9YDtcbn07XG5cbmV4cG9ydCB7IFBvaW50c0FuaW1hdGlvbk1hdGVyaWFsIH07XG4iLCJpbXBvcnQgeyBTaGFkZXJMaWIsIFVuaWZvcm1zVXRpbHMsIFJHQkFEZXB0aFBhY2tpbmcgfSBmcm9tICd0aHJlZSc7XG5pbXBvcnQgQmFzZUFuaW1hdGlvbk1hdGVyaWFsIGZyb20gJy4vQmFzZUFuaW1hdGlvbk1hdGVyaWFsJztcblxuZnVuY3Rpb24gRGVwdGhBbmltYXRpb25NYXRlcmlhbChwYXJhbWV0ZXJzKSB7XG4gIHRoaXMuZGVwdGhQYWNraW5nID0gUkdCQURlcHRoUGFja2luZztcbiAgdGhpcy5jbGlwcGluZyA9IHRydWU7XG5cbiAgdGhpcy52ZXJ0ZXhGdW5jdGlvbnMgPSBbXTtcbiAgdGhpcy52ZXJ0ZXhQYXJhbWV0ZXJzID0gW107XG4gIHRoaXMudmVydGV4SW5pdCA9IFtdO1xuICB0aGlzLnZlcnRleFBvc2l0aW9uID0gW107XG4gIHRoaXMudmVydGV4UG9zdE1vcnBoID0gW107XG4gIHRoaXMudmVydGV4UG9zdFNraW5uaW5nID0gW107XG5cbiAgQmFzZUFuaW1hdGlvbk1hdGVyaWFsLmNhbGwodGhpcywgcGFyYW1ldGVycyk7XG4gIFxuICB0aGlzLnVuaWZvcm1zID0gVW5pZm9ybXNVdGlscy5tZXJnZShbU2hhZGVyTGliWydkZXB0aCddLnVuaWZvcm1zLCB0aGlzLnVuaWZvcm1zXSk7XG4gIHRoaXMudmVydGV4U2hhZGVyID0gdGhpcy5jb25jYXRWZXJ0ZXhTaGFkZXIoKTtcbiAgdGhpcy5mcmFnbWVudFNoYWRlciA9IFNoYWRlckxpYlsnZGVwdGgnXS5mcmFnbWVudFNoYWRlcjtcbn1cbkRlcHRoQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShCYXNlQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlKTtcbkRlcHRoQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gRGVwdGhBbmltYXRpb25NYXRlcmlhbDtcblxuRGVwdGhBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uY2F0VmVydGV4U2hhZGVyID0gZnVuY3Rpb24gKCkge1xuICBcbiAgcmV0dXJuIGBcbiAgI2luY2x1ZGUgPGNvbW1vbj5cbiAgI2luY2x1ZGUgPHV2X3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8ZGlzcGxhY2VtZW50bWFwX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8bW9ycGh0YXJnZXRfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxza2lubmluZ19wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPGxvZ2RlcHRoYnVmX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX3BhcnNfdmVydGV4PlxuICBcbiAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQYXJhbWV0ZXJzJyl9XG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4RnVuY3Rpb25zJyl9XG4gIFxuICB2b2lkIG1haW4oKSB7XG4gIFxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4SW5pdCcpfVxuICBcbiAgICAjaW5jbHVkZSA8dXZfdmVydGV4PlxuICBcbiAgICAjaW5jbHVkZSA8c2tpbmJhc2VfdmVydGV4PlxuICBcbiAgICAjaWZkZWYgVVNFX0RJU1BMQUNFTUVOVE1BUFxuICBcbiAgICAgICNpbmNsdWRlIDxiZWdpbm5vcm1hbF92ZXJ0ZXg+XG4gICAgICAjaW5jbHVkZSA8bW9ycGhub3JtYWxfdmVydGV4PlxuICAgICAgI2luY2x1ZGUgPHNraW5ub3JtYWxfdmVydGV4PlxuICBcbiAgICAjZW5kaWZcbiAgXG4gICAgI2luY2x1ZGUgPGJlZ2luX3ZlcnRleD5cbiAgICBcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBvc2l0aW9uJyl9XG5cbiAgICAjaW5jbHVkZSA8bW9ycGh0YXJnZXRfdmVydGV4PlxuICAgIFxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UG9zdE1vcnBoJyl9XG4gICAgXG4gICAgI2luY2x1ZGUgPHNraW5uaW5nX3ZlcnRleD5cblxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UG9zdFNraW5uaW5nJyl9XG4gICAgXG4gICAgI2luY2x1ZGUgPGRpc3BsYWNlbWVudG1hcF92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPHByb2plY3RfdmVydGV4PlxuICAgICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc192ZXJ0ZXg+XG4gIH1gO1xufTtcblxuZXhwb3J0IHsgRGVwdGhBbmltYXRpb25NYXRlcmlhbCB9O1xuIiwiaW1wb3J0IHsgU2hhZGVyTGliLCBVbmlmb3Jtc1V0aWxzLCBSR0JBRGVwdGhQYWNraW5nIH0gZnJvbSAndGhyZWUnO1xuaW1wb3J0IEJhc2VBbmltYXRpb25NYXRlcmlhbCBmcm9tICcuL0Jhc2VBbmltYXRpb25NYXRlcmlhbCc7XG5cbmZ1bmN0aW9uIERpc3RhbmNlQW5pbWF0aW9uTWF0ZXJpYWwocGFyYW1ldGVycykge1xuICB0aGlzLmRlcHRoUGFja2luZyA9IFJHQkFEZXB0aFBhY2tpbmc7XG4gIHRoaXMuY2xpcHBpbmcgPSB0cnVlO1xuXG4gIHRoaXMudmVydGV4RnVuY3Rpb25zID0gW107XG4gIHRoaXMudmVydGV4UGFyYW1ldGVycyA9IFtdO1xuICB0aGlzLnZlcnRleEluaXQgPSBbXTtcbiAgdGhpcy52ZXJ0ZXhQb3NpdGlvbiA9IFtdO1xuICB0aGlzLnZlcnRleFBvc3RNb3JwaCA9IFtdO1xuICB0aGlzLnZlcnRleFBvc3RTa2lubmluZyA9IFtdO1xuXG4gIEJhc2VBbmltYXRpb25NYXRlcmlhbC5jYWxsKHRoaXMsIHBhcmFtZXRlcnMpO1xuICBcbiAgdGhpcy51bmlmb3JtcyA9IFVuaWZvcm1zVXRpbHMubWVyZ2UoW1NoYWRlckxpYlsnZGlzdGFuY2VSR0JBJ10udW5pZm9ybXMsIHRoaXMudW5pZm9ybXNdKTtcbiAgdGhpcy52ZXJ0ZXhTaGFkZXIgPSB0aGlzLmNvbmNhdFZlcnRleFNoYWRlcigpO1xuICB0aGlzLmZyYWdtZW50U2hhZGVyID0gU2hhZGVyTGliWydkaXN0YW5jZVJHQkEnXS5mcmFnbWVudFNoYWRlcjtcbn1cbkRpc3RhbmNlQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShCYXNlQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlKTtcbkRpc3RhbmNlQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gRGlzdGFuY2VBbmltYXRpb25NYXRlcmlhbDtcblxuRGlzdGFuY2VBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uY2F0VmVydGV4U2hhZGVyID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gYFxuICAjZGVmaW5lIERJU1RBTkNFXG5cbiAgdmFyeWluZyB2ZWMzIHZXb3JsZFBvc2l0aW9uO1xuICBcbiAgI2luY2x1ZGUgPGNvbW1vbj5cbiAgI2luY2x1ZGUgPHV2X3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8ZGlzcGxhY2VtZW50bWFwX3BhcnNfdmVydGV4PlxuICAjaW5jbHVkZSA8bW9ycGh0YXJnZXRfcGFyc192ZXJ0ZXg+XG4gICNpbmNsdWRlIDxza2lubmluZ19wYXJzX3ZlcnRleD5cbiAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc19wYXJzX3ZlcnRleD5cbiAgXG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UGFyYW1ldGVycycpfVxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleEZ1bmN0aW9ucycpfVxuICBcbiAgdm9pZCBtYWluKCkge1xuXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhJbml0Jyl9XG4gIFxuICAgICNpbmNsdWRlIDx1dl92ZXJ0ZXg+XG4gIFxuICAgICNpbmNsdWRlIDxza2luYmFzZV92ZXJ0ZXg+XG4gIFxuICAgICNpZmRlZiBVU0VfRElTUExBQ0VNRU5UTUFQXG4gIFxuICAgICAgI2luY2x1ZGUgPGJlZ2lubm9ybWFsX3ZlcnRleD5cbiAgICAgICNpbmNsdWRlIDxtb3JwaG5vcm1hbF92ZXJ0ZXg+XG4gICAgICAjaW5jbHVkZSA8c2tpbm5vcm1hbF92ZXJ0ZXg+XG4gIFxuICAgICNlbmRpZlxuICBcbiAgICAjaW5jbHVkZSA8YmVnaW5fdmVydGV4PlxuICAgIFxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UG9zaXRpb24nKX1cblxuICAgICNpbmNsdWRlIDxtb3JwaHRhcmdldF92ZXJ0ZXg+XG4gICAgXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQb3N0TW9ycGgnKX1cbiAgICBcbiAgICAjaW5jbHVkZSA8c2tpbm5pbmdfdmVydGV4PlxuXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQb3N0U2tpbm5pbmcnKX1cbiAgICBcbiAgICAjaW5jbHVkZSA8ZGlzcGxhY2VtZW50bWFwX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8cHJvamVjdF92ZXJ0ZXg+XG4gICAgI2luY2x1ZGUgPHdvcmxkcG9zX3ZlcnRleD5cbiAgICAjaW5jbHVkZSA8Y2xpcHBpbmdfcGxhbmVzX3ZlcnRleD5cbiAgXG4gICAgdldvcmxkUG9zaXRpb24gPSB3b3JsZFBvc2l0aW9uLnh5ejtcbiAgXG4gIH1gO1xufTtcblxuZXhwb3J0IHsgRGlzdGFuY2VBbmltYXRpb25NYXRlcmlhbCB9O1xuIiwiaW1wb3J0IHsgQnVmZmVyR2VvbWV0cnksIEJ1ZmZlckF0dHJpYnV0ZSB9IGZyb20gJ3RocmVlJztcbi8qKlxuICogQSBCdWZmZXJHZW9tZXRyeSB3aGVyZSBhICdwcmVmYWInIGdlb21ldHJ5IGlzIHJlcGVhdGVkIGEgbnVtYmVyIG9mIHRpbWVzLlxuICpcbiAqIEBwYXJhbSB7R2VvbWV0cnl8QnVmZmVyR2VvbWV0cnl9IHByZWZhYiBUaGUgR2VvbWV0cnkgaW5zdGFuY2UgdG8gcmVwZWF0LlxuICogQHBhcmFtIHtOdW1iZXJ9IGNvdW50IFRoZSBudW1iZXIgb2YgdGltZXMgdG8gcmVwZWF0IHRoZSBnZW9tZXRyeS5cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBQcmVmYWJCdWZmZXJHZW9tZXRyeShwcmVmYWIsIGNvdW50KSB7XG4gIEJ1ZmZlckdlb21ldHJ5LmNhbGwodGhpcyk7XG5cbiAgLyoqXG4gICAqIEEgcmVmZXJlbmNlIHRvIHRoZSBwcmVmYWIgZ2VvbWV0cnkgdXNlZCB0byBjcmVhdGUgdGhpcyBpbnN0YW5jZS5cbiAgICogQHR5cGUge0dlb21ldHJ5fEJ1ZmZlckdlb21ldHJ5fVxuICAgKi9cbiAgdGhpcy5wcmVmYWJHZW9tZXRyeSA9IHByZWZhYjtcbiAgdGhpcy5pc1ByZWZhYkJ1ZmZlckdlb21ldHJ5ID0gcHJlZmFiLmlzQnVmZmVyR2VvbWV0cnk7XG5cbiAgLyoqXG4gICAqIE51bWJlciBvZiBwcmVmYWJzLlxuICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgKi9cbiAgdGhpcy5wcmVmYWJDb3VudCA9IGNvdW50O1xuXG4gIC8qKlxuICAgKiBOdW1iZXIgb2YgdmVydGljZXMgb2YgdGhlIHByZWZhYi5cbiAgICogQHR5cGUge051bWJlcn1cbiAgICovXG4gIGlmICh0aGlzLmlzUHJlZmFiQnVmZmVyR2VvbWV0cnkpIHtcbiAgICB0aGlzLnByZWZhYlZlcnRleENvdW50ID0gcHJlZmFiLmF0dHJpYnV0ZXMucG9zaXRpb24uY291bnQ7XG4gIH1cbiAgZWxzZSB7XG4gICAgdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudCA9IHByZWZhYi52ZXJ0aWNlcy5sZW5ndGg7XG4gIH1cblxuICB0aGlzLmJ1ZmZlckluZGljZXMoKTtcbiAgdGhpcy5idWZmZXJQb3NpdGlvbnMoKTtcbn1cblByZWZhYkJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlKTtcblByZWZhYkJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFByZWZhYkJ1ZmZlckdlb21ldHJ5O1xuXG5QcmVmYWJCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuYnVmZmVySW5kaWNlcyA9IGZ1bmN0aW9uKCkge1xuICBsZXQgcHJlZmFiSW5kaWNlcyA9IFtdO1xuICBsZXQgcHJlZmFiSW5kZXhDb3VudDtcblxuICBpZiAodGhpcy5pc1ByZWZhYkJ1ZmZlckdlb21ldHJ5KSB7XG4gICAgaWYgKHRoaXMucHJlZmFiR2VvbWV0cnkuaW5kZXgpIHtcbiAgICAgIHByZWZhYkluZGV4Q291bnQgPSB0aGlzLnByZWZhYkdlb21ldHJ5LmluZGV4LmNvdW50O1xuICAgICAgcHJlZmFiSW5kaWNlcyA9IHRoaXMucHJlZmFiR2VvbWV0cnkuaW5kZXguYXJyYXk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgcHJlZmFiSW5kZXhDb3VudCA9IHRoaXMucHJlZmFiVmVydGV4Q291bnQ7XG5cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHJlZmFiSW5kZXhDb3VudDsgaSsrKSB7XG4gICAgICAgIHByZWZhYkluZGljZXMucHVzaChpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgZWxzZSB7XG4gICAgY29uc3QgcHJlZmFiRmFjZUNvdW50ID0gdGhpcy5wcmVmYWJHZW9tZXRyeS5mYWNlcy5sZW5ndGg7XG4gICAgcHJlZmFiSW5kZXhDb3VudCA9IHByZWZhYkZhY2VDb3VudCAqIDM7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHByZWZhYkZhY2VDb3VudDsgaSsrKSB7XG4gICAgICBjb25zdCBmYWNlID0gdGhpcy5wcmVmYWJHZW9tZXRyeS5mYWNlc1tpXTtcbiAgICAgIHByZWZhYkluZGljZXMucHVzaChmYWNlLmEsIGZhY2UuYiwgZmFjZS5jKTtcbiAgICB9XG4gIH1cblxuICBjb25zdCBpbmRleEJ1ZmZlciA9IG5ldyBVaW50MzJBcnJheSh0aGlzLnByZWZhYkNvdW50ICogcHJlZmFiSW5kZXhDb3VudCk7XG5cbiAgdGhpcy5zZXRJbmRleChuZXcgQnVmZmVyQXR0cmlidXRlKGluZGV4QnVmZmVyLCAxKSk7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnByZWZhYkNvdW50OyBpKyspIHtcbiAgICBmb3IgKGxldCBrID0gMDsgayA8IHByZWZhYkluZGV4Q291bnQ7IGsrKykge1xuICAgICAgaW5kZXhCdWZmZXJbaSAqIHByZWZhYkluZGV4Q291bnQgKyBrXSA9IHByZWZhYkluZGljZXNba10gKyBpICogdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudDtcbiAgICB9XG4gIH1cbn07XG5cblByZWZhYkJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5idWZmZXJQb3NpdGlvbnMgPSBmdW5jdGlvbigpIHtcbiAgY29uc3QgcG9zaXRpb25CdWZmZXIgPSB0aGlzLmNyZWF0ZUF0dHJpYnV0ZSgncG9zaXRpb24nLCAzKS5hcnJheTtcblxuICBpZiAodGhpcy5pc1ByZWZhYkJ1ZmZlckdlb21ldHJ5KSB7XG4gICAgY29uc3QgcG9zaXRpb25zID0gdGhpcy5wcmVmYWJHZW9tZXRyeS5hdHRyaWJ1dGVzLnBvc2l0aW9uLmFycmF5O1xuXG4gICAgZm9yIChsZXQgaSA9IDAsIG9mZnNldCA9IDA7IGkgPCB0aGlzLnByZWZhYkNvdW50OyBpKyspIHtcbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudDsgaisrLCBvZmZzZXQgKz0gMykge1xuICAgICAgICBwb3NpdGlvbkJ1ZmZlcltvZmZzZXQgICAgXSA9IHBvc2l0aW9uc1tqICogM107XG4gICAgICAgIHBvc2l0aW9uQnVmZmVyW29mZnNldCArIDFdID0gcG9zaXRpb25zW2ogKiAzICsgMV07XG4gICAgICAgIHBvc2l0aW9uQnVmZmVyW29mZnNldCArIDJdID0gcG9zaXRpb25zW2ogKiAzICsgMl07XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGVsc2Uge1xuICAgIGZvciAobGV0IGkgPSAwLCBvZmZzZXQgPSAwOyBpIDwgdGhpcy5wcmVmYWJDb3VudDsgaSsrKSB7XG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHRoaXMucHJlZmFiVmVydGV4Q291bnQ7IGorKywgb2Zmc2V0ICs9IDMpIHtcbiAgICAgICAgY29uc3QgcHJlZmFiVmVydGV4ID0gdGhpcy5wcmVmYWJHZW9tZXRyeS52ZXJ0aWNlc1tqXTtcblxuICAgICAgICBwb3NpdGlvbkJ1ZmZlcltvZmZzZXQgICAgXSA9IHByZWZhYlZlcnRleC54O1xuICAgICAgICBwb3NpdGlvbkJ1ZmZlcltvZmZzZXQgKyAxXSA9IHByZWZhYlZlcnRleC55O1xuICAgICAgICBwb3NpdGlvbkJ1ZmZlcltvZmZzZXQgKyAyXSA9IHByZWZhYlZlcnRleC56O1xuICAgICAgfVxuICAgIH1cbiAgfVxufTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgQnVmZmVyQXR0cmlidXRlIHdpdGggVVYgY29vcmRpbmF0ZXMuXG4gKi9cblByZWZhYkJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5idWZmZXJVdnMgPSBmdW5jdGlvbigpIHtcbiAgY29uc3QgdXZCdWZmZXIgPSB0aGlzLmNyZWF0ZUF0dHJpYnV0ZSgndXYnLCAyKS5hcnJheTtcblxuICBpZiAodGhpcy5pc1ByZWZhYkJ1ZmZlckdlb21ldHJ5KSB7XG4gICAgY29uc3QgdXZzID0gdGhpcy5wcmVmYWJHZW9tZXRyeS5hdHRyaWJ1dGVzLnV2LmFycmF5XG5cbiAgICBmb3IgKGxldCBpID0gMCwgb2Zmc2V0ID0gMDsgaSA8IHRoaXMucHJlZmFiQ291bnQ7IGkrKykge1xuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCB0aGlzLnByZWZhYlZlcnRleENvdW50OyBqKyssIG9mZnNldCArPSAyKSB7XG4gICAgICAgIHV2QnVmZmVyW29mZnNldCAgICBdID0gdXZzW2ogKiAyXTtcbiAgICAgICAgdXZCdWZmZXJbb2Zmc2V0ICsgMV0gPSB1dnNbaiAqIDIgKyAxXTtcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgcHJlZmFiRmFjZUNvdW50ID0gdGhpcy5wcmVmYWJHZW9tZXRyeS5mYWNlcy5sZW5ndGg7XG4gICAgY29uc3QgdXZzID0gW11cblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHJlZmFiRmFjZUNvdW50OyBpKyspIHtcbiAgICAgIGNvbnN0IGZhY2UgPSB0aGlzLnByZWZhYkdlb21ldHJ5LmZhY2VzW2ldO1xuICAgICAgY29uc3QgdXYgPSB0aGlzLnByZWZhYkdlb21ldHJ5LmZhY2VWZXJ0ZXhVdnNbMF1baV07XG5cbiAgICAgIHV2c1tmYWNlLmFdID0gdXZbMF07XG4gICAgICB1dnNbZmFjZS5iXSA9IHV2WzFdO1xuICAgICAgdXZzW2ZhY2UuY10gPSB1dlsyXTtcbiAgICB9XG5cbiAgICBmb3IgKGxldCBpID0gMCwgb2Zmc2V0ID0gMDsgaSA8IHRoaXMucHJlZmFiQ291bnQ7IGkrKykge1xuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCB0aGlzLnByZWZhYlZlcnRleENvdW50OyBqKyssIG9mZnNldCArPSAyKSB7XG4gICAgICAgIGNvbnN0IHV2ID0gdXZzW2pdO1xuXG4gICAgICAgIHV2QnVmZmVyW29mZnNldF0gPSB1di54O1xuICAgICAgICB1dkJ1ZmZlcltvZmZzZXQgKyAxXSA9IHV2Lnk7XG4gICAgICB9XG4gICAgfVxuICB9XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBCdWZmZXJBdHRyaWJ1dGUgb24gdGhpcyBnZW9tZXRyeSBpbnN0YW5jZS5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZSBOYW1lIG9mIHRoZSBhdHRyaWJ1dGUuXG4gKiBAcGFyYW0ge051bWJlcn0gaXRlbVNpemUgTnVtYmVyIG9mIGZsb2F0cyBwZXIgdmVydGV4ICh0eXBpY2FsbHkgMSwgMiwgMyBvciA0KS5cbiAqIEBwYXJhbSB7ZnVuY3Rpb249fSBmYWN0b3J5IEZ1bmN0aW9uIHRoYXQgd2lsbCBiZSBjYWxsZWQgZm9yIGVhY2ggcHJlZmFiIHVwb24gY3JlYXRpb24uIEFjY2VwdHMgMyBhcmd1bWVudHM6IGRhdGFbXSwgaW5kZXggYW5kIHByZWZhYkNvdW50LiBDYWxscyBzZXRQcmVmYWJEYXRhLlxuICpcbiAqIEByZXR1cm5zIHtCdWZmZXJBdHRyaWJ1dGV9XG4gKi9cblByZWZhYkJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5jcmVhdGVBdHRyaWJ1dGUgPSBmdW5jdGlvbihuYW1lLCBpdGVtU2l6ZSwgZmFjdG9yeSkge1xuICBjb25zdCBidWZmZXIgPSBuZXcgRmxvYXQzMkFycmF5KHRoaXMucHJlZmFiQ291bnQgKiB0aGlzLnByZWZhYlZlcnRleENvdW50ICogaXRlbVNpemUpO1xuICBjb25zdCBhdHRyaWJ1dGUgPSBuZXcgQnVmZmVyQXR0cmlidXRlKGJ1ZmZlciwgaXRlbVNpemUpO1xuXG4gIHRoaXMuYWRkQXR0cmlidXRlKG5hbWUsIGF0dHJpYnV0ZSk7XG5cbiAgaWYgKGZhY3RvcnkpIHtcbiAgICBjb25zdCBkYXRhID0gW107XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucHJlZmFiQ291bnQ7IGkrKykge1xuICAgICAgZmFjdG9yeShkYXRhLCBpLCB0aGlzLnByZWZhYkNvdW50KTtcbiAgICAgIHRoaXMuc2V0UHJlZmFiRGF0YShhdHRyaWJ1dGUsIGksIGRhdGEpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBhdHRyaWJ1dGU7XG59O1xuXG4vKipcbiAqIFNldHMgZGF0YSBmb3IgYWxsIHZlcnRpY2VzIG9mIGEgcHJlZmFiIGF0IGEgZ2l2ZW4gaW5kZXguXG4gKiBVc3VhbGx5IGNhbGxlZCBpbiBhIGxvb3AuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd8QnVmZmVyQXR0cmlidXRlfSBhdHRyaWJ1dGUgVGhlIGF0dHJpYnV0ZSBvciBhdHRyaWJ1dGUgbmFtZSB3aGVyZSB0aGUgZGF0YSBpcyB0byBiZSBzdG9yZWQuXG4gKiBAcGFyYW0ge051bWJlcn0gcHJlZmFiSW5kZXggSW5kZXggb2YgdGhlIHByZWZhYiBpbiB0aGUgYnVmZmVyIGdlb21ldHJ5LlxuICogQHBhcmFtIHtBcnJheX0gZGF0YSBBcnJheSBvZiBkYXRhLiBMZW5ndGggc2hvdWxkIGJlIGVxdWFsIHRvIGl0ZW0gc2l6ZSBvZiB0aGUgYXR0cmlidXRlLlxuICovXG5QcmVmYWJCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuc2V0UHJlZmFiRGF0YSA9IGZ1bmN0aW9uKGF0dHJpYnV0ZSwgcHJlZmFiSW5kZXgsIGRhdGEpIHtcbiAgYXR0cmlidXRlID0gKHR5cGVvZiBhdHRyaWJ1dGUgPT09ICdzdHJpbmcnKSA/IHRoaXMuYXR0cmlidXRlc1thdHRyaWJ1dGVdIDogYXR0cmlidXRlO1xuXG4gIGxldCBvZmZzZXQgPSBwcmVmYWJJbmRleCAqIHRoaXMucHJlZmFiVmVydGV4Q291bnQgKiBhdHRyaWJ1dGUuaXRlbVNpemU7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnByZWZhYlZlcnRleENvdW50OyBpKyspIHtcbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IGF0dHJpYnV0ZS5pdGVtU2l6ZTsgaisrKSB7XG4gICAgICBhdHRyaWJ1dGUuYXJyYXlbb2Zmc2V0KytdID0gZGF0YVtqXTtcbiAgICB9XG4gIH1cbn07XG5cbmV4cG9ydCB7IFByZWZhYkJ1ZmZlckdlb21ldHJ5IH07XG4iLCJpbXBvcnQgeyBCdWZmZXJHZW9tZXRyeSwgQnVmZmVyQXR0cmlidXRlIH0gZnJvbSAndGhyZWUnO1xuLyoqXG4gKiBBIEJ1ZmZlckdlb21ldHJ5IHdoZXJlIGEgJ3ByZWZhYicgZ2VvbWV0cnkgYXJyYXkgaXMgcmVwZWF0ZWQgYSBudW1iZXIgb2YgdGltZXMuXG4gKlxuICogQHBhcmFtIHtBcnJheX0gcHJlZmFicyBBbiBhcnJheSB3aXRoIEdlb21ldHJ5IGluc3RhbmNlcyB0byByZXBlYXQuXG4gKiBAcGFyYW0ge051bWJlcn0gcmVwZWF0Q291bnQgVGhlIG51bWJlciBvZiB0aW1lcyB0byByZXBlYXQgdGhlIGFycmF5IG9mIEdlb21ldHJpZXMuXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gTXVsdGlQcmVmYWJCdWZmZXJHZW9tZXRyeShwcmVmYWJzLCByZXBlYXRDb3VudCkge1xuICBCdWZmZXJHZW9tZXRyeS5jYWxsKHRoaXMpO1xuXG4gIGlmIChBcnJheS5pc0FycmF5KHByZWZhYnMpKSB7XG4gICAgdGhpcy5wcmVmYWJHZW9tZXRyaWVzID0gcHJlZmFicztcbiAgfSBlbHNlIHtcbiAgICB0aGlzLnByZWZhYkdlb21ldHJpZXMgPSBbcHJlZmFic107XG4gIH1cblxuICB0aGlzLnByZWZhYkdlb21ldHJpZXNDb3VudCA9IHRoaXMucHJlZmFiR2VvbWV0cmllcy5sZW5ndGg7XG5cbiAgLyoqXG4gICAqIE51bWJlciBvZiBwcmVmYWJzLlxuICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgKi9cbiAgdGhpcy5wcmVmYWJDb3VudCA9IHJlcGVhdENvdW50ICogdGhpcy5wcmVmYWJHZW9tZXRyaWVzQ291bnQ7XG4gIC8qKlxuICAgKiBIb3cgb2Z0ZW4gdGhlIHByZWZhYiBhcnJheSBpcyByZXBlYXRlZC5cbiAgICogQHR5cGUge051bWJlcn1cbiAgICovXG4gIHRoaXMucmVwZWF0Q291bnQgPSByZXBlYXRDb3VudDtcbiAgXG4gIC8qKlxuICAgKiBBcnJheSBvZiB2ZXJ0ZXggY291bnRzIHBlciBwcmVmYWIuXG4gICAqIEB0eXBlIHtBcnJheX1cbiAgICovXG4gIHRoaXMucHJlZmFiVmVydGV4Q291bnRzID0gdGhpcy5wcmVmYWJHZW9tZXRyaWVzLm1hcChwID0+IHAuaXNCdWZmZXJHZW9tZXRyeSA/IHAuYXR0cmlidXRlcy5wb3NpdGlvbi5jb3VudCA6IHAudmVydGljZXMubGVuZ3RoKTtcbiAgLyoqXG4gICAqIFRvdGFsIG51bWJlciBvZiB2ZXJ0aWNlcyBmb3Igb25lIHJlcGV0aXRpb24gb2YgdGhlIHByZWZhYnNcbiAgICogQHR5cGUge251bWJlcn1cbiAgICovXG4gIHRoaXMucmVwZWF0VmVydGV4Q291bnQgPSB0aGlzLnByZWZhYlZlcnRleENvdW50cy5yZWR1Y2UoKHIsIHYpID0+IHIgKyB2LCAwKTtcblxuICB0aGlzLmJ1ZmZlckluZGljZXMoKTtcbiAgdGhpcy5idWZmZXJQb3NpdGlvbnMoKTtcbn1cbk11bHRpUHJlZmFiQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUpO1xuTXVsdGlQcmVmYWJCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBNdWx0aVByZWZhYkJ1ZmZlckdlb21ldHJ5O1xuXG5NdWx0aVByZWZhYkJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5idWZmZXJJbmRpY2VzID0gZnVuY3Rpb24oKSB7XG4gIGxldCByZXBlYXRJbmRleENvdW50ID0gMDtcblxuICB0aGlzLnByZWZhYkluZGljZXMgPSB0aGlzLnByZWZhYkdlb21ldHJpZXMubWFwKGdlb21ldHJ5ID0+IHtcbiAgICBsZXQgaW5kaWNlcyA9IFtdO1xuXG4gICAgaWYgKGdlb21ldHJ5LmlzQnVmZmVyR2VvbWV0cnkpIHtcbiAgICAgIGlmIChnZW9tZXRyeS5pbmRleCkge1xuICAgICAgICBpbmRpY2VzID0gZ2VvbWV0cnkuaW5kZXguYXJyYXk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGdlb21ldHJ5LmF0dHJpYnV0ZXMucG9zaXRpb24uY291bnQ7IGkrKykge1xuICAgICAgICAgIGluZGljZXMucHVzaChpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGdlb21ldHJ5LmZhY2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGZhY2UgPSBnZW9tZXRyeS5mYWNlc1tpXTtcbiAgICAgICAgaW5kaWNlcy5wdXNoKGZhY2UuYSwgZmFjZS5iLCBmYWNlLmMpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJlcGVhdEluZGV4Q291bnQgKz0gaW5kaWNlcy5sZW5ndGg7XG5cbiAgICByZXR1cm4gaW5kaWNlcztcbiAgfSk7XG5cbiAgY29uc3QgaW5kZXhCdWZmZXIgPSBuZXcgVWludDMyQXJyYXkocmVwZWF0SW5kZXhDb3VudCAqIHRoaXMucmVwZWF0Q291bnQpO1xuICBsZXQgaW5kZXhPZmZzZXQgPSAwO1xuICBsZXQgcHJlZmFiT2Zmc2V0ID0gMDtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucHJlZmFiQ291bnQ7IGkrKykge1xuICAgIGNvbnN0IGluZGV4ID0gaSAlIHRoaXMucHJlZmFiR2VvbWV0cmllc0NvdW50O1xuICAgIGNvbnN0IGluZGljZXMgPSB0aGlzLnByZWZhYkluZGljZXNbaW5kZXhdO1xuICAgIGNvbnN0IHZlcnRleENvdW50ID0gdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudHNbaW5kZXhdO1xuXG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCBpbmRpY2VzLmxlbmd0aDsgaisrKSB7XG4gICAgICBpbmRleEJ1ZmZlcltpbmRleE9mZnNldCsrXSA9IGluZGljZXNbal0gKyBwcmVmYWJPZmZzZXQ7XG4gICAgfVxuXG4gICAgcHJlZmFiT2Zmc2V0ICs9IHZlcnRleENvdW50O1xuICB9XG5cbiAgdGhpcy5zZXRJbmRleChuZXcgQnVmZmVyQXR0cmlidXRlKGluZGV4QnVmZmVyLCAxKSk7XG59O1xuXG5NdWx0aVByZWZhYkJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5idWZmZXJQb3NpdGlvbnMgPSBmdW5jdGlvbigpIHtcbiAgY29uc3QgcG9zaXRpb25CdWZmZXIgPSB0aGlzLmNyZWF0ZUF0dHJpYnV0ZSgncG9zaXRpb24nLCAzKS5hcnJheTtcblxuICBjb25zdCBwcmVmYWJQb3NpdGlvbnMgPSB0aGlzLnByZWZhYkdlb21ldHJpZXMubWFwKChnZW9tZXRyeSwgaSkgPT4ge1xuICAgIGxldCBwb3NpdGlvbnM7XG5cbiAgICBpZiAoZ2VvbWV0cnkuaXNCdWZmZXJHZW9tZXRyeSkge1xuICAgICAgcG9zaXRpb25zID0gZ2VvbWV0cnkuYXR0cmlidXRlcy5wb3NpdGlvbi5hcnJheTtcbiAgICB9IGVsc2Uge1xuXG4gICAgICBjb25zdCB2ZXJ0ZXhDb3VudCA9IHRoaXMucHJlZmFiVmVydGV4Q291bnRzW2ldO1xuXG4gICAgICBwb3NpdGlvbnMgPSBbXTtcblxuICAgICAgZm9yIChsZXQgaiA9IDAsIG9mZnNldCA9IDA7IGogPCB2ZXJ0ZXhDb3VudDsgaisrKSB7XG4gICAgICAgIGNvbnN0IHByZWZhYlZlcnRleCA9IGdlb21ldHJ5LnZlcnRpY2VzW2pdO1xuXG4gICAgICAgIHBvc2l0aW9uc1tvZmZzZXQrK10gPSBwcmVmYWJWZXJ0ZXgueDtcbiAgICAgICAgcG9zaXRpb25zW29mZnNldCsrXSA9IHByZWZhYlZlcnRleC55O1xuICAgICAgICBwb3NpdGlvbnNbb2Zmc2V0KytdID0gcHJlZmFiVmVydGV4Lno7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHBvc2l0aW9ucztcbiAgfSk7XG5cbiAgZm9yIChsZXQgaSA9IDAsIG9mZnNldCA9IDA7IGkgPCB0aGlzLnByZWZhYkNvdW50OyBpKyspIHtcbiAgICBjb25zdCBpbmRleCA9IGkgJSB0aGlzLnByZWZhYkdlb21ldHJpZXMubGVuZ3RoO1xuICAgIGNvbnN0IHZlcnRleENvdW50ID0gdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudHNbaW5kZXhdO1xuICAgIGNvbnN0IHBvc2l0aW9ucyA9IHByZWZhYlBvc2l0aW9uc1tpbmRleF07XG5cbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IHZlcnRleENvdW50OyBqKyspIHtcbiAgICAgIHBvc2l0aW9uQnVmZmVyW29mZnNldCsrXSA9IHBvc2l0aW9uc1tqICogM107XG4gICAgICBwb3NpdGlvbkJ1ZmZlcltvZmZzZXQrK10gPSBwb3NpdGlvbnNbaiAqIDMgKyAxXTtcbiAgICAgIHBvc2l0aW9uQnVmZmVyW29mZnNldCsrXSA9IHBvc2l0aW9uc1tqICogMyArIDJdO1xuICAgIH1cbiAgfVxufTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgQnVmZmVyQXR0cmlidXRlIHdpdGggVVYgY29vcmRpbmF0ZXMuXG4gKi9cbk11bHRpUHJlZmFiQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmJ1ZmZlclV2cyA9IGZ1bmN0aW9uKCkge1xuICBjb25zdCB1dkJ1ZmZlciA9IHRoaXMuY3JlYXRlQXR0cmlidXRlKCd1dicsIDIpLmFycmF5O1xuXG4gIGNvbnN0IHByZWZhYlV2cyA9IHRoaXMucHJlZmFiR2VvbWV0cmllcy5tYXAoKGdlb21ldHJ5LCBpKSA9PiB7XG4gICAgbGV0IHV2cztcblxuICAgIGlmIChnZW9tZXRyeS5pc0J1ZmZlckdlb21ldHJ5KSB7XG4gICAgICBpZiAoIWdlb21ldHJ5LmF0dHJpYnV0ZXMudXYpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignTm8gVVYgZm91bmQgaW4gcHJlZmFiIGdlb21ldHJ5JywgZ2VvbWV0cnkpO1xuICAgICAgfVxuXG4gICAgICB1dnMgPSBnZW9tZXRyeS5hdHRyaWJ1dGVzLnV2LmFycmF5O1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBwcmVmYWJGYWNlQ291bnQgPSB0aGlzLnByZWZhYkluZGljZXNbaV0ubGVuZ3RoIC8gMztcbiAgICAgIGNvbnN0IHV2T2JqZWN0cyA9IFtdO1xuXG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHByZWZhYkZhY2VDb3VudDsgaisrKSB7XG4gICAgICAgIGNvbnN0IGZhY2UgPSBnZW9tZXRyeS5mYWNlc1tqXTtcbiAgICAgICAgY29uc3QgdXYgPSBnZW9tZXRyeS5mYWNlVmVydGV4VXZzWzBdW2pdO1xuXG4gICAgICAgIHV2T2JqZWN0c1tmYWNlLmFdID0gdXZbMF07XG4gICAgICAgIHV2T2JqZWN0c1tmYWNlLmJdID0gdXZbMV07XG4gICAgICAgIHV2T2JqZWN0c1tmYWNlLmNdID0gdXZbMl07XG4gICAgICB9XG5cbiAgICAgIHV2cyA9IFtdO1xuXG4gICAgICBmb3IgKGxldCBrID0gMDsgayA8IHV2T2JqZWN0cy5sZW5ndGg7IGsrKykge1xuICAgICAgICB1dnNbayAqIDJdID0gdXZPYmplY3RzW2tdLng7XG4gICAgICAgIHV2c1trICogMiArIDFdID0gdXZPYmplY3RzW2tdLnk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHV2cztcbiAgfSk7XG5cbiAgZm9yIChsZXQgaSA9IDAsIG9mZnNldCA9IDA7IGkgPCB0aGlzLnByZWZhYkNvdW50OyBpKyspIHtcblxuICAgIGNvbnN0IGluZGV4ID0gaSAlIHRoaXMucHJlZmFiR2VvbWV0cmllcy5sZW5ndGg7XG4gICAgY29uc3QgdmVydGV4Q291bnQgPSB0aGlzLnByZWZhYlZlcnRleENvdW50c1tpbmRleF07XG4gICAgY29uc3QgdXZzID0gcHJlZmFiVXZzW2luZGV4XTtcblxuICAgIGZvciAobGV0IGogPSAwOyBqIDwgdmVydGV4Q291bnQ7IGorKykge1xuICAgICAgdXZCdWZmZXJbb2Zmc2V0KytdID0gdXZzW2ogKiAyXTtcbiAgICAgIHV2QnVmZmVyW29mZnNldCsrXSA9IHV2c1tqICogMiArIDFdO1xuICAgIH1cbiAgfVxufTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgQnVmZmVyQXR0cmlidXRlIG9uIHRoaXMgZ2VvbWV0cnkgaW5zdGFuY2UuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgTmFtZSBvZiB0aGUgYXR0cmlidXRlLlxuICogQHBhcmFtIHtOdW1iZXJ9IGl0ZW1TaXplIE51bWJlciBvZiBmbG9hdHMgcGVyIHZlcnRleCAodHlwaWNhbGx5IDEsIDIsIDMgb3IgNCkuXG4gKiBAcGFyYW0ge2Z1bmN0aW9uPX0gZmFjdG9yeSBGdW5jdGlvbiB0aGF0IHdpbGwgYmUgY2FsbGVkIGZvciBlYWNoIHByZWZhYiB1cG9uIGNyZWF0aW9uLiBBY2NlcHRzIDMgYXJndW1lbnRzOiBkYXRhW10sIGluZGV4IGFuZCBwcmVmYWJDb3VudC4gQ2FsbHMgc2V0UHJlZmFiRGF0YS5cbiAqXG4gKiBAcmV0dXJucyB7QnVmZmVyQXR0cmlidXRlfVxuICovXG5NdWx0aVByZWZhYkJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5jcmVhdGVBdHRyaWJ1dGUgPSBmdW5jdGlvbihuYW1lLCBpdGVtU2l6ZSwgZmFjdG9yeSkge1xuICBjb25zdCBidWZmZXIgPSBuZXcgRmxvYXQzMkFycmF5KHRoaXMucmVwZWF0Q291bnQgKiB0aGlzLnJlcGVhdFZlcnRleENvdW50ICogaXRlbVNpemUpO1xuICBjb25zdCBhdHRyaWJ1dGUgPSBuZXcgQnVmZmVyQXR0cmlidXRlKGJ1ZmZlciwgaXRlbVNpemUpO1xuICBcbiAgdGhpcy5hZGRBdHRyaWJ1dGUobmFtZSwgYXR0cmlidXRlKTtcbiAgXG4gIGlmIChmYWN0b3J5KSB7XG4gICAgY29uc3QgZGF0YSA9IFtdO1xuICAgIFxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5wcmVmYWJDb3VudDsgaSsrKSB7XG4gICAgICBmYWN0b3J5KGRhdGEsIGksIHRoaXMucHJlZmFiQ291bnQpO1xuICAgICAgdGhpcy5zZXRQcmVmYWJEYXRhKGF0dHJpYnV0ZSwgaSwgZGF0YSk7XG4gICAgfVxuICB9XG4gIFxuICByZXR1cm4gYXR0cmlidXRlO1xufTtcblxuLyoqXG4gKiBTZXRzIGRhdGEgZm9yIGFsbCB2ZXJ0aWNlcyBvZiBhIHByZWZhYiBhdCBhIGdpdmVuIGluZGV4LlxuICogVXN1YWxseSBjYWxsZWQgaW4gYSBsb29wLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfEJ1ZmZlckF0dHJpYnV0ZX0gYXR0cmlidXRlIFRoZSBhdHRyaWJ1dGUgb3IgYXR0cmlidXRlIG5hbWUgd2hlcmUgdGhlIGRhdGEgaXMgdG8gYmUgc3RvcmVkLlxuICogQHBhcmFtIHtOdW1iZXJ9IHByZWZhYkluZGV4IEluZGV4IG9mIHRoZSBwcmVmYWIgaW4gdGhlIGJ1ZmZlciBnZW9tZXRyeS5cbiAqIEBwYXJhbSB7QXJyYXl9IGRhdGEgQXJyYXkgb2YgZGF0YS4gTGVuZ3RoIHNob3VsZCBiZSBlcXVhbCB0byBpdGVtIHNpemUgb2YgdGhlIGF0dHJpYnV0ZS5cbiAqL1xuTXVsdGlQcmVmYWJCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuc2V0UHJlZmFiRGF0YSA9IGZ1bmN0aW9uKGF0dHJpYnV0ZSwgcHJlZmFiSW5kZXgsIGRhdGEpIHtcbiAgYXR0cmlidXRlID0gKHR5cGVvZiBhdHRyaWJ1dGUgPT09ICdzdHJpbmcnKSA/IHRoaXMuYXR0cmlidXRlc1thdHRyaWJ1dGVdIDogYXR0cmlidXRlO1xuXG4gIGNvbnN0IHByZWZhYkdlb21ldHJ5SW5kZXggPSBwcmVmYWJJbmRleCAlIHRoaXMucHJlZmFiR2VvbWV0cmllc0NvdW50O1xuICBjb25zdCBwcmVmYWJHZW9tZXRyeVZlcnRleENvdW50ID0gdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudHNbcHJlZmFiR2VvbWV0cnlJbmRleF07XG4gIGNvbnN0IHdob2xlID0gKHByZWZhYkluZGV4IC8gdGhpcy5wcmVmYWJHZW9tZXRyaWVzQ291bnQgfCAwKSAqIHRoaXMucHJlZmFiR2VvbWV0cmllc0NvdW50O1xuICBjb25zdCB3aG9sZU9mZnNldCA9IHdob2xlICogdGhpcy5yZXBlYXRWZXJ0ZXhDb3VudDtcbiAgY29uc3QgcGFydCA9IHByZWZhYkluZGV4IC0gd2hvbGU7XG4gIGxldCBwYXJ0T2Zmc2V0ID0gMDtcbiAgbGV0IGkgPSAwO1xuXG4gIHdoaWxlKGkgPCBwYXJ0KSB7XG4gICAgcGFydE9mZnNldCArPSB0aGlzLnByZWZhYlZlcnRleENvdW50c1tpKytdO1xuICB9XG5cbiAgbGV0IG9mZnNldCA9ICh3aG9sZU9mZnNldCArIHBhcnRPZmZzZXQpICogYXR0cmlidXRlLml0ZW1TaXplO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgcHJlZmFiR2VvbWV0cnlWZXJ0ZXhDb3VudDsgaSsrKSB7XG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCBhdHRyaWJ1dGUuaXRlbVNpemU7IGorKykge1xuICAgICAgYXR0cmlidXRlLmFycmF5W29mZnNldCsrXSA9IGRhdGFbal07XG4gICAgfVxuICB9XG59O1xuXG5leHBvcnQgeyBNdWx0aVByZWZhYkJ1ZmZlckdlb21ldHJ5IH07XG4iLCJpbXBvcnQgeyBJbnN0YW5jZWRCdWZmZXJHZW9tZXRyeSwgSW5zdGFuY2VkQnVmZmVyQXR0cmlidXRlIH0gZnJvbSAndGhyZWUnO1xuLyoqXG4gKiBBIHdyYXBwZXIgYXJvdW5kIFRIUkVFLkluc3RhbmNlZEJ1ZmZlckdlb21ldHJ5LCB3aGljaCBpcyBtb3JlIG1lbW9yeSBlZmZpY2llbnQgdGhhbiBQcmVmYWJCdWZmZXJHZW9tZXRyeSwgYnV0IHJlcXVpcmVzIHRoZSBBTkdMRV9pbnN0YW5jZWRfYXJyYXlzIGV4dGVuc2lvbi5cbiAqXG4gKiBAcGFyYW0ge0J1ZmZlckdlb21ldHJ5fSBwcmVmYWIgVGhlIEdlb21ldHJ5IGluc3RhbmNlIHRvIHJlcGVhdC5cbiAqIEBwYXJhbSB7TnVtYmVyfSBjb3VudCBUaGUgbnVtYmVyIG9mIHRpbWVzIHRvIHJlcGVhdCB0aGUgZ2VvbWV0cnkuXG4gKlxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIEluc3RhbmNlZFByZWZhYkJ1ZmZlckdlb21ldHJ5KHByZWZhYiwgY291bnQpIHtcbiAgaWYgKHByZWZhYi5pc0dlb21ldHJ5ID09PSB0cnVlKSB7XG4gICAgY29uc29sZS5lcnJvcignSW5zdGFuY2VkUHJlZmFiQnVmZmVyR2VvbWV0cnkgcHJlZmFiIG11c3QgYmUgYSBCdWZmZXJHZW9tZXRyeS4nKVxuICB9XG5cbiAgSW5zdGFuY2VkQnVmZmVyR2VvbWV0cnkuY2FsbCh0aGlzKTtcblxuICB0aGlzLnByZWZhYkdlb21ldHJ5ID0gcHJlZmFiO1xuICB0aGlzLmNvcHkocHJlZmFiKVxuXG4gIHRoaXMubWF4SW5zdGFuY2VkQ291bnQgPSBjb3VudFxuICB0aGlzLnByZWZhYkNvdW50ID0gY291bnQ7XG59XG5JbnN0YW5jZWRQcmVmYWJCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEluc3RhbmNlZEJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZSk7XG5JbnN0YW5jZWRQcmVmYWJCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBJbnN0YW5jZWRQcmVmYWJCdWZmZXJHZW9tZXRyeTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgQnVmZmVyQXR0cmlidXRlIG9uIHRoaXMgZ2VvbWV0cnkgaW5zdGFuY2UuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgTmFtZSBvZiB0aGUgYXR0cmlidXRlLlxuICogQHBhcmFtIHtOdW1iZXJ9IGl0ZW1TaXplIE51bWJlciBvZiBmbG9hdHMgcGVyIHZlcnRleCAodHlwaWNhbGx5IDEsIDIsIDMgb3IgNCkuXG4gKiBAcGFyYW0ge2Z1bmN0aW9uPX0gZmFjdG9yeSBGdW5jdGlvbiB0aGF0IHdpbGwgYmUgY2FsbGVkIGZvciBlYWNoIHByZWZhYiB1cG9uIGNyZWF0aW9uLiBBY2NlcHRzIDMgYXJndW1lbnRzOiBkYXRhW10sIGluZGV4IGFuZCBwcmVmYWJDb3VudC4gQ2FsbHMgc2V0UHJlZmFiRGF0YS5cbiAqXG4gKiBAcmV0dXJucyB7QnVmZmVyQXR0cmlidXRlfVxuICovXG5JbnN0YW5jZWRQcmVmYWJCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuY3JlYXRlQXR0cmlidXRlID0gZnVuY3Rpb24obmFtZSwgaXRlbVNpemUsIGZhY3RvcnkpIHtcbiAgY29uc3QgYnVmZmVyID0gbmV3IEZsb2F0MzJBcnJheSh0aGlzLnByZWZhYkNvdW50ICogaXRlbVNpemUpO1xuICBjb25zdCBhdHRyaWJ1dGUgPSBuZXcgSW5zdGFuY2VkQnVmZmVyQXR0cmlidXRlKGJ1ZmZlciwgaXRlbVNpemUpO1xuXG4gIHRoaXMuYWRkQXR0cmlidXRlKG5hbWUsIGF0dHJpYnV0ZSk7XG5cbiAgaWYgKGZhY3RvcnkpIHtcbiAgICBjb25zdCBkYXRhID0gW107XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucHJlZmFiQ291bnQ7IGkrKykge1xuICAgICAgZmFjdG9yeShkYXRhLCBpLCB0aGlzLnByZWZhYkNvdW50KTtcbiAgICAgIHRoaXMuc2V0UHJlZmFiRGF0YShhdHRyaWJ1dGUsIGksIGRhdGEpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBhdHRyaWJ1dGU7XG59O1xuXG4vKipcbiAqIFNldHMgZGF0YSBmb3IgYSBwcmVmYWIgYXQgYSBnaXZlbiBpbmRleC5cbiAqIFVzdWFsbHkgY2FsbGVkIGluIGEgbG9vcC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ3xCdWZmZXJBdHRyaWJ1dGV9IGF0dHJpYnV0ZSBUaGUgYXR0cmlidXRlIG9yIGF0dHJpYnV0ZSBuYW1lIHdoZXJlIHRoZSBkYXRhIGlzIHRvIGJlIHN0b3JlZC5cbiAqIEBwYXJhbSB7TnVtYmVyfSBwcmVmYWJJbmRleCBJbmRleCBvZiB0aGUgcHJlZmFiIGluIHRoZSBidWZmZXIgZ2VvbWV0cnkuXG4gKiBAcGFyYW0ge0FycmF5fSBkYXRhIEFycmF5IG9mIGRhdGEuIExlbmd0aCBzaG91bGQgYmUgZXF1YWwgdG8gaXRlbSBzaXplIG9mIHRoZSBhdHRyaWJ1dGUuXG4gKi9cbkluc3RhbmNlZFByZWZhYkJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5zZXRQcmVmYWJEYXRhID0gZnVuY3Rpb24oYXR0cmlidXRlLCBwcmVmYWJJbmRleCwgZGF0YSkge1xuICBhdHRyaWJ1dGUgPSAodHlwZW9mIGF0dHJpYnV0ZSA9PT0gJ3N0cmluZycpID8gdGhpcy5hdHRyaWJ1dGVzW2F0dHJpYnV0ZV0gOiBhdHRyaWJ1dGU7XG5cbiAgbGV0IG9mZnNldCA9IHByZWZhYkluZGV4ICogYXR0cmlidXRlLml0ZW1TaXplO1xuXG4gIGZvciAobGV0IGogPSAwOyBqIDwgYXR0cmlidXRlLml0ZW1TaXplOyBqKyspIHtcbiAgICBhdHRyaWJ1dGUuYXJyYXlbb2Zmc2V0KytdID0gZGF0YVtqXTtcbiAgfVxufTtcblxuZXhwb3J0IHsgSW5zdGFuY2VkUHJlZmFiQnVmZmVyR2VvbWV0cnkgfTtcbiIsImltcG9ydCB7IE1hdGggYXMgdE1hdGgsIFZlY3RvcjMgfSBmcm9tICd0aHJlZSc7XG5pbXBvcnQgeyBEZXB0aEFuaW1hdGlvbk1hdGVyaWFsIH0gZnJvbSAnLi9tYXRlcmlhbHMvRGVwdGhBbmltYXRpb25NYXRlcmlhbCc7XG5pbXBvcnQgeyBEaXN0YW5jZUFuaW1hdGlvbk1hdGVyaWFsIH0gZnJvbSAnLi9tYXRlcmlhbHMvRGlzdGFuY2VBbmltYXRpb25NYXRlcmlhbCc7XG5cbi8qKlxuICogQ29sbGVjdGlvbiBvZiB1dGlsaXR5IGZ1bmN0aW9ucy5cbiAqIEBuYW1lc3BhY2VcbiAqL1xuY29uc3QgVXRpbHMgPSB7XG4gIC8qKlxuICAgKiBEdXBsaWNhdGVzIHZlcnRpY2VzIHNvIGVhY2ggZmFjZSBiZWNvbWVzIHNlcGFyYXRlLlxuICAgKiBTYW1lIGFzIFRIUkVFLkV4cGxvZGVNb2RpZmllci5cbiAgICpcbiAgICogQHBhcmFtIHtUSFJFRS5HZW9tZXRyeX0gZ2VvbWV0cnkgR2VvbWV0cnkgaW5zdGFuY2UgdG8gbW9kaWZ5LlxuICAgKi9cbiAgc2VwYXJhdGVGYWNlczogZnVuY3Rpb24gKGdlb21ldHJ5KSB7XG4gICAgbGV0IHZlcnRpY2VzID0gW107XG5cbiAgICBmb3IgKGxldCBpID0gMCwgaWwgPSBnZW9tZXRyeS5mYWNlcy5sZW5ndGg7IGkgPCBpbDsgaSsrKSB7XG4gICAgICBsZXQgbiA9IHZlcnRpY2VzLmxlbmd0aDtcbiAgICAgIGxldCBmYWNlID0gZ2VvbWV0cnkuZmFjZXNbaV07XG5cbiAgICAgIGxldCBhID0gZmFjZS5hO1xuICAgICAgbGV0IGIgPSBmYWNlLmI7XG4gICAgICBsZXQgYyA9IGZhY2UuYztcblxuICAgICAgbGV0IHZhID0gZ2VvbWV0cnkudmVydGljZXNbYV07XG4gICAgICBsZXQgdmIgPSBnZW9tZXRyeS52ZXJ0aWNlc1tiXTtcbiAgICAgIGxldCB2YyA9IGdlb21ldHJ5LnZlcnRpY2VzW2NdO1xuXG4gICAgICB2ZXJ0aWNlcy5wdXNoKHZhLmNsb25lKCkpO1xuICAgICAgdmVydGljZXMucHVzaCh2Yi5jbG9uZSgpKTtcbiAgICAgIHZlcnRpY2VzLnB1c2godmMuY2xvbmUoKSk7XG5cbiAgICAgIGZhY2UuYSA9IG47XG4gICAgICBmYWNlLmIgPSBuICsgMTtcbiAgICAgIGZhY2UuYyA9IG4gKyAyO1xuICAgIH1cblxuICAgIGdlb21ldHJ5LnZlcnRpY2VzID0gdmVydGljZXM7XG4gIH0sXG5cbiAgLyoqXG4gICAqIENvbXB1dGUgdGhlIGNlbnRyb2lkIChjZW50ZXIpIG9mIGEgVEhSRUUuRmFjZTMuXG4gICAqXG4gICAqIEBwYXJhbSB7VEhSRUUuR2VvbWV0cnl9IGdlb21ldHJ5IEdlb21ldHJ5IGluc3RhbmNlIHRoZSBmYWNlIGlzIGluLlxuICAgKiBAcGFyYW0ge1RIUkVFLkZhY2UzfSBmYWNlIEZhY2Ugb2JqZWN0IGZyb20gdGhlIFRIUkVFLkdlb21ldHJ5LmZhY2VzIGFycmF5XG4gICAqIEBwYXJhbSB7VEhSRUUuVmVjdG9yMz19IHYgT3B0aW9uYWwgdmVjdG9yIHRvIHN0b3JlIHJlc3VsdCBpbi5cbiAgICogQHJldHVybnMge1RIUkVFLlZlY3RvcjN9XG4gICAqL1xuICBjb21wdXRlQ2VudHJvaWQ6IGZ1bmN0aW9uKGdlb21ldHJ5LCBmYWNlLCB2KSB7XG4gICAgbGV0IGEgPSBnZW9tZXRyeS52ZXJ0aWNlc1tmYWNlLmFdO1xuICAgIGxldCBiID0gZ2VvbWV0cnkudmVydGljZXNbZmFjZS5iXTtcbiAgICBsZXQgYyA9IGdlb21ldHJ5LnZlcnRpY2VzW2ZhY2UuY107XG5cbiAgICB2ID0gdiB8fCBuZXcgVmVjdG9yMygpO1xuXG4gICAgdi54ID0gKGEueCArIGIueCArIGMueCkgLyAzO1xuICAgIHYueSA9IChhLnkgKyBiLnkgKyBjLnkpIC8gMztcbiAgICB2LnogPSAoYS56ICsgYi56ICsgYy56KSAvIDM7XG5cbiAgICByZXR1cm4gdjtcbiAgfSxcblxuICAvKipcbiAgICogR2V0IGEgcmFuZG9tIHZlY3RvciBiZXR3ZWVuIGJveC5taW4gYW5kIGJveC5tYXguXG4gICAqXG4gICAqIEBwYXJhbSB7VEhSRUUuQm94M30gYm94IFRIUkVFLkJveDMgaW5zdGFuY2UuXG4gICAqIEBwYXJhbSB7VEhSRUUuVmVjdG9yMz19IHYgT3B0aW9uYWwgdmVjdG9yIHRvIHN0b3JlIHJlc3VsdCBpbi5cbiAgICogQHJldHVybnMge1RIUkVFLlZlY3RvcjN9XG4gICAqL1xuICByYW5kb21JbkJveDogZnVuY3Rpb24oYm94LCB2KSB7XG4gICAgdiA9IHYgfHwgbmV3IFZlY3RvcjMoKTtcblxuICAgIHYueCA9IHRNYXRoLnJhbmRGbG9hdChib3gubWluLngsIGJveC5tYXgueCk7XG4gICAgdi55ID0gdE1hdGgucmFuZEZsb2F0KGJveC5taW4ueSwgYm94Lm1heC55KTtcbiAgICB2LnogPSB0TWF0aC5yYW5kRmxvYXQoYm94Lm1pbi56LCBib3gubWF4LnopO1xuXG4gICAgcmV0dXJuIHY7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEdldCBhIHJhbmRvbSBheGlzIGZvciBxdWF0ZXJuaW9uIHJvdGF0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0ge1RIUkVFLlZlY3RvcjM9fSB2IE9wdGlvbiB2ZWN0b3IgdG8gc3RvcmUgcmVzdWx0IGluLlxuICAgKiBAcmV0dXJucyB7VEhSRUUuVmVjdG9yM31cbiAgICovXG4gIHJhbmRvbUF4aXM6IGZ1bmN0aW9uKHYpIHtcbiAgICB2ID0gdiB8fCBuZXcgVmVjdG9yMygpO1xuXG4gICAgdi54ID0gdE1hdGgucmFuZEZsb2F0U3ByZWFkKDIuMCk7XG4gICAgdi55ID0gdE1hdGgucmFuZEZsb2F0U3ByZWFkKDIuMCk7XG4gICAgdi56ID0gdE1hdGgucmFuZEZsb2F0U3ByZWFkKDIuMCk7XG4gICAgdi5ub3JtYWxpemUoKTtcblxuICAgIHJldHVybiB2O1xuICB9LFxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBUSFJFRS5CQVMuRGVwdGhBbmltYXRpb25NYXRlcmlhbCBmb3Igc2hhZG93cyBmcm9tIGEgVEhSRUUuU3BvdExpZ2h0IG9yIFRIUkVFLkRpcmVjdGlvbmFsTGlnaHQgYnkgY29weWluZyByZWxldmFudCBzaGFkZXIgY2h1bmtzLlxuICAgKiBVbmlmb3JtIHZhbHVlcyBtdXN0IGJlIG1hbnVhbGx5IHN5bmNlZCBiZXR3ZWVuIHRoZSBzb3VyY2UgbWF0ZXJpYWwgYW5kIHRoZSBkZXB0aCBtYXRlcmlhbC5cbiAgICpcbiAgICogQHNlZSB7QGxpbmsgaHR0cDovL3RocmVlLWJhcy1leGFtcGxlcy5zdXJnZS5zaC9leGFtcGxlcy9zaGFkb3dzL31cbiAgICpcbiAgICogQHBhcmFtIHtUSFJFRS5CQVMuQmFzZUFuaW1hdGlvbk1hdGVyaWFsfSBzb3VyY2VNYXRlcmlhbCBJbnN0YW5jZSB0byBnZXQgdGhlIHNoYWRlciBjaHVua3MgZnJvbS5cbiAgICogQHJldHVybnMge1RIUkVFLkJBUy5EZXB0aEFuaW1hdGlvbk1hdGVyaWFsfVxuICAgKi9cbiAgY3JlYXRlRGVwdGhBbmltYXRpb25NYXRlcmlhbDogZnVuY3Rpb24oc291cmNlTWF0ZXJpYWwpIHtcbiAgICByZXR1cm4gbmV3IERlcHRoQW5pbWF0aW9uTWF0ZXJpYWwoe1xuICAgICAgdW5pZm9ybXM6IHNvdXJjZU1hdGVyaWFsLnVuaWZvcm1zLFxuICAgICAgZGVmaW5lczogc291cmNlTWF0ZXJpYWwuZGVmaW5lcyxcbiAgICAgIHZlcnRleEZ1bmN0aW9uczogc291cmNlTWF0ZXJpYWwudmVydGV4RnVuY3Rpb25zLFxuICAgICAgdmVydGV4UGFyYW1ldGVyczogc291cmNlTWF0ZXJpYWwudmVydGV4UGFyYW1ldGVycyxcbiAgICAgIHZlcnRleEluaXQ6IHNvdXJjZU1hdGVyaWFsLnZlcnRleEluaXQsXG4gICAgICB2ZXJ0ZXhQb3NpdGlvbjogc291cmNlTWF0ZXJpYWwudmVydGV4UG9zaXRpb25cbiAgICB9KTtcbiAgfSxcblxuICAvKipcbiAgICogQ3JlYXRlIGEgVEhSRUUuQkFTLkRpc3RhbmNlQW5pbWF0aW9uTWF0ZXJpYWwgZm9yIHNoYWRvd3MgZnJvbSBhIFRIUkVFLlBvaW50TGlnaHQgYnkgY29weWluZyByZWxldmFudCBzaGFkZXIgY2h1bmtzLlxuICAgKiBVbmlmb3JtIHZhbHVlcyBtdXN0IGJlIG1hbnVhbGx5IHN5bmNlZCBiZXR3ZWVuIHRoZSBzb3VyY2UgbWF0ZXJpYWwgYW5kIHRoZSBkaXN0YW5jZSBtYXRlcmlhbC5cbiAgICpcbiAgICogQHNlZSB7QGxpbmsgaHR0cDovL3RocmVlLWJhcy1leGFtcGxlcy5zdXJnZS5zaC9leGFtcGxlcy9zaGFkb3dzL31cbiAgICpcbiAgICogQHBhcmFtIHtUSFJFRS5CQVMuQmFzZUFuaW1hdGlvbk1hdGVyaWFsfSBzb3VyY2VNYXRlcmlhbCBJbnN0YW5jZSB0byBnZXQgdGhlIHNoYWRlciBjaHVua3MgZnJvbS5cbiAgICogQHJldHVybnMge1RIUkVFLkJBUy5EaXN0YW5jZUFuaW1hdGlvbk1hdGVyaWFsfVxuICAgKi9cbiAgY3JlYXRlRGlzdGFuY2VBbmltYXRpb25NYXRlcmlhbDogZnVuY3Rpb24oc291cmNlTWF0ZXJpYWwpIHtcbiAgICByZXR1cm4gbmV3IERpc3RhbmNlQW5pbWF0aW9uTWF0ZXJpYWwoe1xuICAgICAgdW5pZm9ybXM6IHNvdXJjZU1hdGVyaWFsLnVuaWZvcm1zLFxuICAgICAgZGVmaW5lczogc291cmNlTWF0ZXJpYWwuZGVmaW5lcyxcbiAgICAgIHZlcnRleEZ1bmN0aW9uczogc291cmNlTWF0ZXJpYWwudmVydGV4RnVuY3Rpb25zLFxuICAgICAgdmVydGV4UGFyYW1ldGVyczogc291cmNlTWF0ZXJpYWwudmVydGV4UGFyYW1ldGVycyxcbiAgICAgIHZlcnRleEluaXQ6IHNvdXJjZU1hdGVyaWFsLnZlcnRleEluaXQsXG4gICAgICB2ZXJ0ZXhQb3NpdGlvbjogc291cmNlTWF0ZXJpYWwudmVydGV4UG9zaXRpb25cbiAgICB9KTtcbiAgfVxufTtcblxuZXhwb3J0IHsgVXRpbHMgfTtcbiIsImltcG9ydCB7IEJ1ZmZlckdlb21ldHJ5LCBCdWZmZXJBdHRyaWJ1dGUgfSBmcm9tICd0aHJlZSc7XG5pbXBvcnQgeyBVdGlscyB9IGZyb20gJy4uL1V0aWxzJztcblxuLyoqXG4gKiBBIFRIUkVFLkJ1ZmZlckdlb21ldHJ5IGZvciBhbmltYXRpbmcgaW5kaXZpZHVhbCBmYWNlcyBvZiBhIFRIUkVFLkdlb21ldHJ5LlxuICpcbiAqIEBwYXJhbSB7VEhSRUUuR2VvbWV0cnl9IG1vZGVsIFRoZSBUSFJFRS5HZW9tZXRyeSB0byBiYXNlIHRoaXMgZ2VvbWV0cnkgb24uXG4gKiBAcGFyYW0ge09iamVjdD19IG9wdGlvbnNcbiAqIEBwYXJhbSB7Qm9vbGVhbj19IG9wdGlvbnMuY29tcHV0ZUNlbnRyb2lkcyBJZiB0cnVlLCBhIGNlbnRyb2lkcyB3aWxsIGJlIGNvbXB1dGVkIGZvciBlYWNoIGZhY2UgYW5kIHN0b3JlZCBpbiBUSFJFRS5CQVMuTW9kZWxCdWZmZXJHZW9tZXRyeS5jZW50cm9pZHMuXG4gKiBAcGFyYW0ge0Jvb2xlYW49fSBvcHRpb25zLmxvY2FsaXplRmFjZXMgSWYgdHJ1ZSwgdGhlIHBvc2l0aW9ucyBmb3IgZWFjaCBmYWNlIHdpbGwgYmUgc3RvcmVkIHJlbGF0aXZlIHRvIHRoZSBjZW50cm9pZC4gVGhpcyBpcyB1c2VmdWwgaWYgeW91IHdhbnQgdG8gcm90YXRlIG9yIHNjYWxlIGZhY2VzIGFyb3VuZCB0aGVpciBjZW50ZXIuXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gTW9kZWxCdWZmZXJHZW9tZXRyeShtb2RlbCwgb3B0aW9ucykge1xuICBCdWZmZXJHZW9tZXRyeS5jYWxsKHRoaXMpO1xuXG4gIC8qKlxuICAgKiBBIHJlZmVyZW5jZSB0byB0aGUgZ2VvbWV0cnkgdXNlZCB0byBjcmVhdGUgdGhpcyBpbnN0YW5jZS5cbiAgICogQHR5cGUge1RIUkVFLkdlb21ldHJ5fVxuICAgKi9cbiAgdGhpcy5tb2RlbEdlb21ldHJ5ID0gbW9kZWw7XG5cbiAgLyoqXG4gICAqIE51bWJlciBvZiBmYWNlcyBvZiB0aGUgbW9kZWwuXG4gICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAqL1xuICB0aGlzLmZhY2VDb3VudCA9IHRoaXMubW9kZWxHZW9tZXRyeS5mYWNlcy5sZW5ndGg7XG5cbiAgLyoqXG4gICAqIE51bWJlciBvZiB2ZXJ0aWNlcyBvZiB0aGUgbW9kZWwuXG4gICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAqL1xuICB0aGlzLnZlcnRleENvdW50ID0gdGhpcy5tb2RlbEdlb21ldHJ5LnZlcnRpY2VzLmxlbmd0aDtcblxuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgb3B0aW9ucy5jb21wdXRlQ2VudHJvaWRzICYmIHRoaXMuY29tcHV0ZUNlbnRyb2lkcygpO1xuXG4gIHRoaXMuYnVmZmVySW5kaWNlcygpO1xuICB0aGlzLmJ1ZmZlclBvc2l0aW9ucyhvcHRpb25zLmxvY2FsaXplRmFjZXMpO1xufVxuTW9kZWxCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZSk7XG5Nb2RlbEJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IE1vZGVsQnVmZmVyR2VvbWV0cnk7XG5cbi8qKlxuICogQ29tcHV0ZXMgYSBjZW50cm9pZCBmb3IgZWFjaCBmYWNlIGFuZCBzdG9yZXMgaXQgaW4gVEhSRUUuQkFTLk1vZGVsQnVmZmVyR2VvbWV0cnkuY2VudHJvaWRzLlxuICovXG5Nb2RlbEJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5jb21wdXRlQ2VudHJvaWRzID0gZnVuY3Rpb24oKSB7XG4gIC8qKlxuICAgKiBBbiBhcnJheSBvZiBjZW50cm9pZHMgY29ycmVzcG9uZGluZyB0byB0aGUgZmFjZXMgb2YgdGhlIG1vZGVsLlxuICAgKlxuICAgKiBAdHlwZSB7QXJyYXl9XG4gICAqL1xuICB0aGlzLmNlbnRyb2lkcyA9IFtdO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5mYWNlQ291bnQ7IGkrKykge1xuICAgIHRoaXMuY2VudHJvaWRzW2ldID0gVXRpbHMuY29tcHV0ZUNlbnRyb2lkKHRoaXMubW9kZWxHZW9tZXRyeSwgdGhpcy5tb2RlbEdlb21ldHJ5LmZhY2VzW2ldKTtcbiAgfVxufTtcblxuTW9kZWxCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuYnVmZmVySW5kaWNlcyA9IGZ1bmN0aW9uKCkge1xuICBjb25zdCBpbmRleEJ1ZmZlciA9IG5ldyBVaW50MzJBcnJheSh0aGlzLmZhY2VDb3VudCAqIDMpO1xuXG4gIHRoaXMuc2V0SW5kZXgobmV3IEJ1ZmZlckF0dHJpYnV0ZShpbmRleEJ1ZmZlciwgMSkpO1xuXG4gIGZvciAobGV0IGkgPSAwLCBvZmZzZXQgPSAwOyBpIDwgdGhpcy5mYWNlQ291bnQ7IGkrKywgb2Zmc2V0ICs9IDMpIHtcbiAgICBjb25zdCBmYWNlID0gdGhpcy5tb2RlbEdlb21ldHJ5LmZhY2VzW2ldO1xuXG4gICAgaW5kZXhCdWZmZXJbb2Zmc2V0ICAgIF0gPSBmYWNlLmE7XG4gICAgaW5kZXhCdWZmZXJbb2Zmc2V0ICsgMV0gPSBmYWNlLmI7XG4gICAgaW5kZXhCdWZmZXJbb2Zmc2V0ICsgMl0gPSBmYWNlLmM7XG4gIH1cbn07XG5cbk1vZGVsQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmJ1ZmZlclBvc2l0aW9ucyA9IGZ1bmN0aW9uKGxvY2FsaXplRmFjZXMpIHtcbiAgY29uc3QgcG9zaXRpb25CdWZmZXIgPSB0aGlzLmNyZWF0ZUF0dHJpYnV0ZSgncG9zaXRpb24nLCAzKS5hcnJheTtcbiAgbGV0IGksIG9mZnNldDtcblxuICBpZiAobG9jYWxpemVGYWNlcyA9PT0gdHJ1ZSkge1xuICAgIGZvciAoaSA9IDA7IGkgPCB0aGlzLmZhY2VDb3VudDsgaSsrKSB7XG4gICAgICBjb25zdCBmYWNlID0gdGhpcy5tb2RlbEdlb21ldHJ5LmZhY2VzW2ldO1xuICAgICAgY29uc3QgY2VudHJvaWQgPSB0aGlzLmNlbnRyb2lkcyA/IHRoaXMuY2VudHJvaWRzW2ldIDogVXRpbHMuY29tcHV0ZUNlbnRyb2lkKHRoaXMubW9kZWxHZW9tZXRyeSwgZmFjZSk7XG5cbiAgICAgIGNvbnN0IGEgPSB0aGlzLm1vZGVsR2VvbWV0cnkudmVydGljZXNbZmFjZS5hXTtcbiAgICAgIGNvbnN0IGIgPSB0aGlzLm1vZGVsR2VvbWV0cnkudmVydGljZXNbZmFjZS5iXTtcbiAgICAgIGNvbnN0IGMgPSB0aGlzLm1vZGVsR2VvbWV0cnkudmVydGljZXNbZmFjZS5jXTtcblxuICAgICAgcG9zaXRpb25CdWZmZXJbZmFjZS5hICogM10gICAgID0gYS54IC0gY2VudHJvaWQueDtcbiAgICAgIHBvc2l0aW9uQnVmZmVyW2ZhY2UuYSAqIDMgKyAxXSA9IGEueSAtIGNlbnRyb2lkLnk7XG4gICAgICBwb3NpdGlvbkJ1ZmZlcltmYWNlLmEgKiAzICsgMl0gPSBhLnogLSBjZW50cm9pZC56O1xuXG4gICAgICBwb3NpdGlvbkJ1ZmZlcltmYWNlLmIgKiAzXSAgICAgPSBiLnggLSBjZW50cm9pZC54O1xuICAgICAgcG9zaXRpb25CdWZmZXJbZmFjZS5iICogMyArIDFdID0gYi55IC0gY2VudHJvaWQueTtcbiAgICAgIHBvc2l0aW9uQnVmZmVyW2ZhY2UuYiAqIDMgKyAyXSA9IGIueiAtIGNlbnRyb2lkLno7XG5cbiAgICAgIHBvc2l0aW9uQnVmZmVyW2ZhY2UuYyAqIDNdICAgICA9IGMueCAtIGNlbnRyb2lkLng7XG4gICAgICBwb3NpdGlvbkJ1ZmZlcltmYWNlLmMgKiAzICsgMV0gPSBjLnkgLSBjZW50cm9pZC55O1xuICAgICAgcG9zaXRpb25CdWZmZXJbZmFjZS5jICogMyArIDJdID0gYy56IC0gY2VudHJvaWQuejtcbiAgICB9XG4gIH1cbiAgZWxzZSB7XG4gICAgZm9yIChpID0gMCwgb2Zmc2V0ID0gMDsgaSA8IHRoaXMudmVydGV4Q291bnQ7IGkrKywgb2Zmc2V0ICs9IDMpIHtcbiAgICAgIGNvbnN0IHZlcnRleCA9IHRoaXMubW9kZWxHZW9tZXRyeS52ZXJ0aWNlc1tpXTtcblxuICAgICAgcG9zaXRpb25CdWZmZXJbb2Zmc2V0ICAgIF0gPSB2ZXJ0ZXgueDtcbiAgICAgIHBvc2l0aW9uQnVmZmVyW29mZnNldCArIDFdID0gdmVydGV4Lnk7XG4gICAgICBwb3NpdGlvbkJ1ZmZlcltvZmZzZXQgKyAyXSA9IHZlcnRleC56O1xuICAgIH1cbiAgfVxufTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgVEhSRUUuQnVmZmVyQXR0cmlidXRlIHdpdGggVVYgY29vcmRpbmF0ZXMuXG4gKi9cbk1vZGVsQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmJ1ZmZlclV2cyA9IGZ1bmN0aW9uKCkge1xuICBjb25zdCB1dkJ1ZmZlciA9IHRoaXMuY3JlYXRlQXR0cmlidXRlKCd1dicsIDIpLmFycmF5O1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5mYWNlQ291bnQ7IGkrKykge1xuXG4gICAgY29uc3QgZmFjZSA9IHRoaXMubW9kZWxHZW9tZXRyeS5mYWNlc1tpXTtcbiAgICBsZXQgdXY7XG5cbiAgICB1diA9IHRoaXMubW9kZWxHZW9tZXRyeS5mYWNlVmVydGV4VXZzWzBdW2ldWzBdO1xuICAgIHV2QnVmZmVyW2ZhY2UuYSAqIDJdICAgICA9IHV2Lng7XG4gICAgdXZCdWZmZXJbZmFjZS5hICogMiArIDFdID0gdXYueTtcblxuICAgIHV2ID0gdGhpcy5tb2RlbEdlb21ldHJ5LmZhY2VWZXJ0ZXhVdnNbMF1baV1bMV07XG4gICAgdXZCdWZmZXJbZmFjZS5iICogMl0gICAgID0gdXYueDtcbiAgICB1dkJ1ZmZlcltmYWNlLmIgKiAyICsgMV0gPSB1di55O1xuXG4gICAgdXYgPSB0aGlzLm1vZGVsR2VvbWV0cnkuZmFjZVZlcnRleFV2c1swXVtpXVsyXTtcbiAgICB1dkJ1ZmZlcltmYWNlLmMgKiAyXSAgICAgPSB1di54O1xuICAgIHV2QnVmZmVyW2ZhY2UuYyAqIDIgKyAxXSA9IHV2Lnk7XG4gIH1cbn07XG5cbi8qKlxuICogQ3JlYXRlcyB0d28gVEhSRUUuQnVmZmVyQXR0cmlidXRlczogc2tpbkluZGV4IGFuZCBza2luV2VpZ2h0LiBCb3RoIGFyZSByZXF1aXJlZCBmb3Igc2tpbm5pbmcuXG4gKi9cbk1vZGVsQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmJ1ZmZlclNraW5uaW5nID0gZnVuY3Rpb24oKSB7XG4gIGNvbnN0IHNraW5JbmRleEJ1ZmZlciA9IHRoaXMuY3JlYXRlQXR0cmlidXRlKCdza2luSW5kZXgnLCA0KS5hcnJheTtcbiAgY29uc3Qgc2tpbldlaWdodEJ1ZmZlciA9IHRoaXMuY3JlYXRlQXR0cmlidXRlKCdza2luV2VpZ2h0JywgNCkuYXJyYXk7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnZlcnRleENvdW50OyBpKyspIHtcbiAgICBjb25zdCBza2luSW5kZXggPSB0aGlzLm1vZGVsR2VvbWV0cnkuc2tpbkluZGljZXNbaV07XG4gICAgY29uc3Qgc2tpbldlaWdodCA9IHRoaXMubW9kZWxHZW9tZXRyeS5za2luV2VpZ2h0c1tpXTtcblxuICAgIHNraW5JbmRleEJ1ZmZlcltpICogNCAgICBdID0gc2tpbkluZGV4Lng7XG4gICAgc2tpbkluZGV4QnVmZmVyW2kgKiA0ICsgMV0gPSBza2luSW5kZXgueTtcbiAgICBza2luSW5kZXhCdWZmZXJbaSAqIDQgKyAyXSA9IHNraW5JbmRleC56O1xuICAgIHNraW5JbmRleEJ1ZmZlcltpICogNCArIDNdID0gc2tpbkluZGV4Lnc7XG5cbiAgICBza2luV2VpZ2h0QnVmZmVyW2kgKiA0ICAgIF0gPSBza2luV2VpZ2h0Lng7XG4gICAgc2tpbldlaWdodEJ1ZmZlcltpICogNCArIDFdID0gc2tpbldlaWdodC55O1xuICAgIHNraW5XZWlnaHRCdWZmZXJbaSAqIDQgKyAyXSA9IHNraW5XZWlnaHQuejtcbiAgICBza2luV2VpZ2h0QnVmZmVyW2kgKiA0ICsgM10gPSBza2luV2VpZ2h0Lnc7XG4gIH1cbn07XG5cbi8qKlxuICogQ3JlYXRlcyBhIFRIUkVFLkJ1ZmZlckF0dHJpYnV0ZSBvbiB0aGlzIGdlb21ldHJ5IGluc3RhbmNlLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIE5hbWUgb2YgdGhlIGF0dHJpYnV0ZS5cbiAqIEBwYXJhbSB7aW50fSBpdGVtU2l6ZSBOdW1iZXIgb2YgZmxvYXRzIHBlciB2ZXJ0ZXggKHR5cGljYWxseSAxLCAyLCAzIG9yIDQpLlxuICogQHBhcmFtIHtmdW5jdGlvbj19IGZhY3RvcnkgRnVuY3Rpb24gdGhhdCB3aWxsIGJlIGNhbGxlZCBmb3IgZWFjaCBmYWNlIHVwb24gY3JlYXRpb24uIEFjY2VwdHMgMyBhcmd1bWVudHM6IGRhdGFbXSwgaW5kZXggYW5kIGZhY2VDb3VudC4gQ2FsbHMgc2V0RmFjZURhdGEuXG4gKlxuICogQHJldHVybnMge0J1ZmZlckF0dHJpYnV0ZX1cbiAqL1xuTW9kZWxCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuY3JlYXRlQXR0cmlidXRlID0gZnVuY3Rpb24obmFtZSwgaXRlbVNpemUsIGZhY3RvcnkpIHtcbiAgY29uc3QgYnVmZmVyID0gbmV3IEZsb2F0MzJBcnJheSh0aGlzLnZlcnRleENvdW50ICogaXRlbVNpemUpO1xuICBjb25zdCBhdHRyaWJ1dGUgPSBuZXcgQnVmZmVyQXR0cmlidXRlKGJ1ZmZlciwgaXRlbVNpemUpO1xuXG4gIHRoaXMuYWRkQXR0cmlidXRlKG5hbWUsIGF0dHJpYnV0ZSk7XG5cbiAgaWYgKGZhY3RvcnkpIHtcbiAgICBjb25zdCBkYXRhID0gW107XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuZmFjZUNvdW50OyBpKyspIHtcbiAgICAgIGZhY3RvcnkoZGF0YSwgaSwgdGhpcy5mYWNlQ291bnQpO1xuICAgICAgdGhpcy5zZXRGYWNlRGF0YShhdHRyaWJ1dGUsIGksIGRhdGEpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBhdHRyaWJ1dGU7XG59O1xuXG4vKipcbiAqIFNldHMgZGF0YSBmb3IgYWxsIHZlcnRpY2VzIG9mIGEgZmFjZSBhdCBhIGdpdmVuIGluZGV4LlxuICogVXN1YWxseSBjYWxsZWQgaW4gYSBsb29wLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfFRIUkVFLkJ1ZmZlckF0dHJpYnV0ZX0gYXR0cmlidXRlIFRoZSBhdHRyaWJ1dGUgb3IgYXR0cmlidXRlIG5hbWUgd2hlcmUgdGhlIGRhdGEgaXMgdG8gYmUgc3RvcmVkLlxuICogQHBhcmFtIHtpbnR9IGZhY2VJbmRleCBJbmRleCBvZiB0aGUgZmFjZSBpbiB0aGUgYnVmZmVyIGdlb21ldHJ5LlxuICogQHBhcmFtIHtBcnJheX0gZGF0YSBBcnJheSBvZiBkYXRhLiBMZW5ndGggc2hvdWxkIGJlIGVxdWFsIHRvIGl0ZW0gc2l6ZSBvZiB0aGUgYXR0cmlidXRlLlxuICovXG5Nb2RlbEJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5zZXRGYWNlRGF0YSA9IGZ1bmN0aW9uKGF0dHJpYnV0ZSwgZmFjZUluZGV4LCBkYXRhKSB7XG4gIGF0dHJpYnV0ZSA9ICh0eXBlb2YgYXR0cmlidXRlID09PSAnc3RyaW5nJykgPyB0aGlzLmF0dHJpYnV0ZXNbYXR0cmlidXRlXSA6IGF0dHJpYnV0ZTtcblxuICBsZXQgb2Zmc2V0ID0gZmFjZUluZGV4ICogMyAqIGF0dHJpYnV0ZS5pdGVtU2l6ZTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IDM7IGkrKykge1xuICAgIGZvciAobGV0IGogPSAwOyBqIDwgYXR0cmlidXRlLml0ZW1TaXplOyBqKyspIHtcbiAgICAgIGF0dHJpYnV0ZS5hcnJheVtvZmZzZXQrK10gPSBkYXRhW2pdO1xuICAgIH1cbiAgfVxufTtcblxuZXhwb3J0IHsgTW9kZWxCdWZmZXJHZW9tZXRyeSB9O1xuIiwiaW1wb3J0IHsgQnVmZmVyR2VvbWV0cnksIEJ1ZmZlckF0dHJpYnV0ZSB9IGZyb20gJ3RocmVlJztcblxuLyoqXG4gKiBBIFRIUkVFLkJ1ZmZlckdlb21ldHJ5IGNvbnNpc3RzIG9mIHBvaW50cy5cbiAqIEBwYXJhbSB7TnVtYmVyfSBjb3VudCBUaGUgbnVtYmVyIG9mIHBvaW50cy5cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBQb2ludEJ1ZmZlckdlb21ldHJ5KGNvdW50KSB7XG4gIEJ1ZmZlckdlb21ldHJ5LmNhbGwodGhpcyk7XG5cbiAgLyoqXG4gICAqIE51bWJlciBvZiBwb2ludHMuXG4gICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAqL1xuICB0aGlzLnBvaW50Q291bnQgPSBjb3VudDtcblxuICB0aGlzLmJ1ZmZlclBvc2l0aW9ucygpO1xufVxuUG9pbnRCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZSk7XG5Qb2ludEJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFBvaW50QnVmZmVyR2VvbWV0cnk7XG5cblBvaW50QnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmJ1ZmZlclBvc2l0aW9ucyA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLmNyZWF0ZUF0dHJpYnV0ZSgncG9zaXRpb24nLCAzKTtcbn07XG5cbi8qKlxuICogQ3JlYXRlcyBhIFRIUkVFLkJ1ZmZlckF0dHJpYnV0ZSBvbiB0aGlzIGdlb21ldHJ5IGluc3RhbmNlLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIE5hbWUgb2YgdGhlIGF0dHJpYnV0ZS5cbiAqIEBwYXJhbSB7TnVtYmVyfSBpdGVtU2l6ZSBOdW1iZXIgb2YgZmxvYXRzIHBlciB2ZXJ0ZXggKHR5cGljYWxseSAxLCAyLCAzIG9yIDQpLlxuICogQHBhcmFtIHtmdW5jdGlvbj19IGZhY3RvcnkgRnVuY3Rpb24gdGhhdCB3aWxsIGJlIGNhbGxlZCBmb3IgZWFjaCBwb2ludCB1cG9uIGNyZWF0aW9uLiBBY2NlcHRzIDMgYXJndW1lbnRzOiBkYXRhW10sIGluZGV4IGFuZCBwcmVmYWJDb3VudC4gQ2FsbHMgc2V0UG9pbnREYXRhLlxuICpcbiAqIEByZXR1cm5zIHtUSFJFRS5CdWZmZXJBdHRyaWJ1dGV9XG4gKi9cblBvaW50QnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmNyZWF0ZUF0dHJpYnV0ZSA9IGZ1bmN0aW9uKG5hbWUsIGl0ZW1TaXplLCBmYWN0b3J5KSB7XG4gIGNvbnN0IGJ1ZmZlciA9IG5ldyBGbG9hdDMyQXJyYXkodGhpcy5wb2ludENvdW50ICogaXRlbVNpemUpO1xuICBjb25zdCBhdHRyaWJ1dGUgPSBuZXcgQnVmZmVyQXR0cmlidXRlKGJ1ZmZlciwgaXRlbVNpemUpO1xuXG4gIHRoaXMuYWRkQXR0cmlidXRlKG5hbWUsIGF0dHJpYnV0ZSk7XG5cbiAgaWYgKGZhY3RvcnkpIHtcbiAgICBjb25zdCBkYXRhID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnBvaW50Q291bnQ7IGkrKykge1xuICAgICAgZmFjdG9yeShkYXRhLCBpLCB0aGlzLnBvaW50Q291bnQpO1xuICAgICAgdGhpcy5zZXRQb2ludERhdGEoYXR0cmlidXRlLCBpLCBkYXRhKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gYXR0cmlidXRlO1xufTtcblxuUG9pbnRCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuc2V0UG9pbnREYXRhID0gZnVuY3Rpb24oYXR0cmlidXRlLCBwb2ludEluZGV4LCBkYXRhKSB7XG4gIGF0dHJpYnV0ZSA9ICh0eXBlb2YgYXR0cmlidXRlID09PSAnc3RyaW5nJykgPyB0aGlzLmF0dHJpYnV0ZXNbYXR0cmlidXRlXSA6IGF0dHJpYnV0ZTtcblxuICBsZXQgb2Zmc2V0ID0gcG9pbnRJbmRleCAqIGF0dHJpYnV0ZS5pdGVtU2l6ZTtcblxuICBmb3IgKGxldCBqID0gMDsgaiA8IGF0dHJpYnV0ZS5pdGVtU2l6ZTsgaisrKSB7XG4gICAgYXR0cmlidXRlLmFycmF5W29mZnNldCsrXSA9IGRhdGFbal07XG4gIH1cbn07XG5cbmV4cG9ydCB7IFBvaW50QnVmZmVyR2VvbWV0cnkgfTtcbiIsIi8vIGdlbmVyYXRlZCBieSBzY3JpcHRzL2J1aWxkX3NoYWRlcl9jaHVua3MuanNcblxuaW1wb3J0IGNhdG11bGxfcm9tX3NwbGluZSBmcm9tICcuL2dsc2wvY2F0bXVsbF9yb21fc3BsaW5lLmdsc2wnO1xuaW1wb3J0IGN1YmljX2JlemllciBmcm9tICcuL2dsc2wvY3ViaWNfYmV6aWVyLmdsc2wnO1xuaW1wb3J0IGVhc2VfYmFja19pbiBmcm9tICcuL2dsc2wvZWFzZV9iYWNrX2luLmdsc2wnO1xuaW1wb3J0IGVhc2VfYmFja19pbl9vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfYmFja19pbl9vdXQuZ2xzbCc7XG5pbXBvcnQgZWFzZV9iYWNrX291dCBmcm9tICcuL2dsc2wvZWFzZV9iYWNrX291dC5nbHNsJztcbmltcG9ydCBlYXNlX2JlemllciBmcm9tICcuL2dsc2wvZWFzZV9iZXppZXIuZ2xzbCc7XG5pbXBvcnQgZWFzZV9ib3VuY2VfaW4gZnJvbSAnLi9nbHNsL2Vhc2VfYm91bmNlX2luLmdsc2wnO1xuaW1wb3J0IGVhc2VfYm91bmNlX2luX291dCBmcm9tICcuL2dsc2wvZWFzZV9ib3VuY2VfaW5fb3V0Lmdsc2wnO1xuaW1wb3J0IGVhc2VfYm91bmNlX291dCBmcm9tICcuL2dsc2wvZWFzZV9ib3VuY2Vfb3V0Lmdsc2wnO1xuaW1wb3J0IGVhc2VfY2lyY19pbiBmcm9tICcuL2dsc2wvZWFzZV9jaXJjX2luLmdsc2wnO1xuaW1wb3J0IGVhc2VfY2lyY19pbl9vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfY2lyY19pbl9vdXQuZ2xzbCc7XG5pbXBvcnQgZWFzZV9jaXJjX291dCBmcm9tICcuL2dsc2wvZWFzZV9jaXJjX291dC5nbHNsJztcbmltcG9ydCBlYXNlX2N1YmljX2luIGZyb20gJy4vZ2xzbC9lYXNlX2N1YmljX2luLmdsc2wnO1xuaW1wb3J0IGVhc2VfY3ViaWNfaW5fb3V0IGZyb20gJy4vZ2xzbC9lYXNlX2N1YmljX2luX291dC5nbHNsJztcbmltcG9ydCBlYXNlX2N1YmljX291dCBmcm9tICcuL2dsc2wvZWFzZV9jdWJpY19vdXQuZ2xzbCc7XG5pbXBvcnQgZWFzZV9lbGFzdGljX2luIGZyb20gJy4vZ2xzbC9lYXNlX2VsYXN0aWNfaW4uZ2xzbCc7XG5pbXBvcnQgZWFzZV9lbGFzdGljX2luX291dCBmcm9tICcuL2dsc2wvZWFzZV9lbGFzdGljX2luX291dC5nbHNsJztcbmltcG9ydCBlYXNlX2VsYXN0aWNfb3V0IGZyb20gJy4vZ2xzbC9lYXNlX2VsYXN0aWNfb3V0Lmdsc2wnO1xuaW1wb3J0IGVhc2VfZXhwb19pbiBmcm9tICcuL2dsc2wvZWFzZV9leHBvX2luLmdsc2wnO1xuaW1wb3J0IGVhc2VfZXhwb19pbl9vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfZXhwb19pbl9vdXQuZ2xzbCc7XG5pbXBvcnQgZWFzZV9leHBvX291dCBmcm9tICcuL2dsc2wvZWFzZV9leHBvX291dC5nbHNsJztcbmltcG9ydCBlYXNlX3F1YWRfaW4gZnJvbSAnLi9nbHNsL2Vhc2VfcXVhZF9pbi5nbHNsJztcbmltcG9ydCBlYXNlX3F1YWRfaW5fb3V0IGZyb20gJy4vZ2xzbC9lYXNlX3F1YWRfaW5fb3V0Lmdsc2wnO1xuaW1wb3J0IGVhc2VfcXVhZF9vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfcXVhZF9vdXQuZ2xzbCc7XG5pbXBvcnQgZWFzZV9xdWFydF9pbiBmcm9tICcuL2dsc2wvZWFzZV9xdWFydF9pbi5nbHNsJztcbmltcG9ydCBlYXNlX3F1YXJ0X2luX291dCBmcm9tICcuL2dsc2wvZWFzZV9xdWFydF9pbl9vdXQuZ2xzbCc7XG5pbXBvcnQgZWFzZV9xdWFydF9vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfcXVhcnRfb3V0Lmdsc2wnO1xuaW1wb3J0IGVhc2VfcXVpbnRfaW4gZnJvbSAnLi9nbHNsL2Vhc2VfcXVpbnRfaW4uZ2xzbCc7XG5pbXBvcnQgZWFzZV9xdWludF9pbl9vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfcXVpbnRfaW5fb3V0Lmdsc2wnO1xuaW1wb3J0IGVhc2VfcXVpbnRfb3V0IGZyb20gJy4vZ2xzbC9lYXNlX3F1aW50X291dC5nbHNsJztcbmltcG9ydCBlYXNlX3NpbmVfaW4gZnJvbSAnLi9nbHNsL2Vhc2Vfc2luZV9pbi5nbHNsJztcbmltcG9ydCBlYXNlX3NpbmVfaW5fb3V0IGZyb20gJy4vZ2xzbC9lYXNlX3NpbmVfaW5fb3V0Lmdsc2wnO1xuaW1wb3J0IGVhc2Vfc2luZV9vdXQgZnJvbSAnLi9nbHNsL2Vhc2Vfc2luZV9vdXQuZ2xzbCc7XG5pbXBvcnQgcXVhZHJhdGljX2JlemllciBmcm9tICcuL2dsc2wvcXVhZHJhdGljX2Jlemllci5nbHNsJztcbmltcG9ydCBxdWF0ZXJuaW9uX3JvdGF0aW9uIGZyb20gJy4vZ2xzbC9xdWF0ZXJuaW9uX3JvdGF0aW9uLmdsc2wnO1xuaW1wb3J0IHF1YXRlcm5pb25fc2xlcnAgZnJvbSAnLi9nbHNsL3F1YXRlcm5pb25fc2xlcnAuZ2xzbCc7XG5cblxuZXhwb3J0IGNvbnN0IFNoYWRlckNodW5rID0ge1xuICBjYXRtdWxsX3JvbV9zcGxpbmU6IGNhdG11bGxfcm9tX3NwbGluZSxcbiAgY3ViaWNfYmV6aWVyOiBjdWJpY19iZXppZXIsXG4gIGVhc2VfYmFja19pbjogZWFzZV9iYWNrX2luLFxuICBlYXNlX2JhY2tfaW5fb3V0OiBlYXNlX2JhY2tfaW5fb3V0LFxuICBlYXNlX2JhY2tfb3V0OiBlYXNlX2JhY2tfb3V0LFxuICBlYXNlX2JlemllcjogZWFzZV9iZXppZXIsXG4gIGVhc2VfYm91bmNlX2luOiBlYXNlX2JvdW5jZV9pbixcbiAgZWFzZV9ib3VuY2VfaW5fb3V0OiBlYXNlX2JvdW5jZV9pbl9vdXQsXG4gIGVhc2VfYm91bmNlX291dDogZWFzZV9ib3VuY2Vfb3V0LFxuICBlYXNlX2NpcmNfaW46IGVhc2VfY2lyY19pbixcbiAgZWFzZV9jaXJjX2luX291dDogZWFzZV9jaXJjX2luX291dCxcbiAgZWFzZV9jaXJjX291dDogZWFzZV9jaXJjX291dCxcbiAgZWFzZV9jdWJpY19pbjogZWFzZV9jdWJpY19pbixcbiAgZWFzZV9jdWJpY19pbl9vdXQ6IGVhc2VfY3ViaWNfaW5fb3V0LFxuICBlYXNlX2N1YmljX291dDogZWFzZV9jdWJpY19vdXQsXG4gIGVhc2VfZWxhc3RpY19pbjogZWFzZV9lbGFzdGljX2luLFxuICBlYXNlX2VsYXN0aWNfaW5fb3V0OiBlYXNlX2VsYXN0aWNfaW5fb3V0LFxuICBlYXNlX2VsYXN0aWNfb3V0OiBlYXNlX2VsYXN0aWNfb3V0LFxuICBlYXNlX2V4cG9faW46IGVhc2VfZXhwb19pbixcbiAgZWFzZV9leHBvX2luX291dDogZWFzZV9leHBvX2luX291dCxcbiAgZWFzZV9leHBvX291dDogZWFzZV9leHBvX291dCxcbiAgZWFzZV9xdWFkX2luOiBlYXNlX3F1YWRfaW4sXG4gIGVhc2VfcXVhZF9pbl9vdXQ6IGVhc2VfcXVhZF9pbl9vdXQsXG4gIGVhc2VfcXVhZF9vdXQ6IGVhc2VfcXVhZF9vdXQsXG4gIGVhc2VfcXVhcnRfaW46IGVhc2VfcXVhcnRfaW4sXG4gIGVhc2VfcXVhcnRfaW5fb3V0OiBlYXNlX3F1YXJ0X2luX291dCxcbiAgZWFzZV9xdWFydF9vdXQ6IGVhc2VfcXVhcnRfb3V0LFxuICBlYXNlX3F1aW50X2luOiBlYXNlX3F1aW50X2luLFxuICBlYXNlX3F1aW50X2luX291dDogZWFzZV9xdWludF9pbl9vdXQsXG4gIGVhc2VfcXVpbnRfb3V0OiBlYXNlX3F1aW50X291dCxcbiAgZWFzZV9zaW5lX2luOiBlYXNlX3NpbmVfaW4sXG4gIGVhc2Vfc2luZV9pbl9vdXQ6IGVhc2Vfc2luZV9pbl9vdXQsXG4gIGVhc2Vfc2luZV9vdXQ6IGVhc2Vfc2luZV9vdXQsXG4gIHF1YWRyYXRpY19iZXppZXI6IHF1YWRyYXRpY19iZXppZXIsXG4gIHF1YXRlcm5pb25fcm90YXRpb246IHF1YXRlcm5pb25fcm90YXRpb24sXG4gIHF1YXRlcm5pb25fc2xlcnA6IHF1YXRlcm5pb25fc2xlcnAsXG5cbn07XG5cbiIsIi8qKlxuICogQSB0aW1lbGluZSB0cmFuc2l0aW9uIHNlZ21lbnQuIEFuIGluc3RhbmNlIG9mIHRoaXMgY2xhc3MgaXMgY3JlYXRlZCBpbnRlcm5hbGx5IHdoZW4gY2FsbGluZyB7QGxpbmsgVEhSRUUuQkFTLlRpbWVsaW5lLmFkZH0sIHNvIHlvdSBzaG91bGQgbm90IHVzZSB0aGlzIGNsYXNzIGRpcmVjdGx5LlxuICogVGhlIGluc3RhbmNlIGlzIGFsc28gcGFzc2VkIHRoZSB0aGUgY29tcGlsZXIgZnVuY3Rpb24gaWYgeW91IHJlZ2lzdGVyIGEgdHJhbnNpdGlvbiB0aHJvdWdoIHtAbGluayBUSFJFRS5CQVMuVGltZWxpbmUucmVnaXN0ZXJ9LiBUaGVyZSB5b3UgY2FuIHVzZSB0aGUgcHVibGljIHByb3BlcnRpZXMgb2YgdGhlIHNlZ21lbnQgdG8gY29tcGlsZSB0aGUgZ2xzbCBzdHJpbmcuXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IEEgc3RyaW5nIGtleSBnZW5lcmF0ZWQgYnkgdGhlIHRpbWVsaW5lIHRvIHdoaWNoIHRoaXMgc2VnbWVudCBiZWxvbmdzLiBLZXlzIGFyZSB1bmlxdWUuXG4gKiBAcGFyYW0ge251bWJlcn0gc3RhcnQgU3RhcnQgdGltZSBvZiB0aGlzIHNlZ21lbnQgaW4gYSB0aW1lbGluZSBpbiBzZWNvbmRzLlxuICogQHBhcmFtIHtudW1iZXJ9IGR1cmF0aW9uIER1cmF0aW9uIG9mIHRoaXMgc2VnbWVudCBpbiBzZWNvbmRzLlxuICogQHBhcmFtIHtvYmplY3R9IHRyYW5zaXRpb24gT2JqZWN0IGRlc2NyaWJpbmcgdGhlIHRyYW5zaXRpb24uXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBjb21waWxlciBBIHJlZmVyZW5jZSB0byB0aGUgY29tcGlsZXIgZnVuY3Rpb24gZnJvbSBhIHRyYW5zaXRpb24gZGVmaW5pdGlvbi5cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBUaW1lbGluZVNlZ21lbnQoa2V5LCBzdGFydCwgZHVyYXRpb24sIHRyYW5zaXRpb24sIGNvbXBpbGVyKSB7XG4gIHRoaXMua2V5ID0ga2V5O1xuICB0aGlzLnN0YXJ0ID0gc3RhcnQ7XG4gIHRoaXMuZHVyYXRpb24gPSBkdXJhdGlvbjtcbiAgdGhpcy50cmFuc2l0aW9uID0gdHJhbnNpdGlvbjtcbiAgdGhpcy5jb21waWxlciA9IGNvbXBpbGVyO1xuXG4gIHRoaXMudHJhaWwgPSAwO1xufVxuXG5UaW1lbGluZVNlZ21lbnQucHJvdG90eXBlLmNvbXBpbGUgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMuY29tcGlsZXIodGhpcyk7XG59O1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoVGltZWxpbmVTZWdtZW50LnByb3RvdHlwZSwgJ2VuZCcsIHtcbiAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5zdGFydCArIHRoaXMuZHVyYXRpb247XG4gIH1cbn0pO1xuXG5leHBvcnQgeyBUaW1lbGluZVNlZ21lbnQgfTtcbiIsImltcG9ydCB7IFRpbWVsaW5lU2VnbWVudCB9IGZyb20gJy4vVGltZWxpbmVTZWdtZW50JztcblxuLyoqXG4gKiBBIHV0aWxpdHkgY2xhc3MgdG8gY3JlYXRlIGFuIGFuaW1hdGlvbiB0aW1lbGluZSB3aGljaCBjYW4gYmUgYmFrZWQgaW50byBhICh2ZXJ0ZXgpIHNoYWRlci5cbiAqIEJ5IGRlZmF1bHQgdGhlIHRpbWVsaW5lIHN1cHBvcnRzIHRyYW5zbGF0aW9uLCBzY2FsZSBhbmQgcm90YXRpb24uIFRoaXMgY2FuIGJlIGV4dGVuZGVkIG9yIG92ZXJyaWRkZW4uXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gVGltZWxpbmUoKSB7XG4gIC8qKlxuICAgKiBUaGUgdG90YWwgZHVyYXRpb24gb2YgdGhlIHRpbWVsaW5lIGluIHNlY29uZHMuXG4gICAqIEB0eXBlIHtudW1iZXJ9XG4gICAqL1xuICB0aGlzLmR1cmF0aW9uID0gMDtcblxuICAvKipcbiAgICogVGhlIG5hbWUgb2YgdGhlIHZhbHVlIHRoYXQgc2VnbWVudHMgd2lsbCB1c2UgdG8gcmVhZCB0aGUgdGltZS4gRGVmYXVsdHMgdG8gJ3RUaW1lJy5cbiAgICogQHR5cGUge3N0cmluZ31cbiAgICovXG4gIHRoaXMudGltZUtleSA9ICd0VGltZSc7XG5cbiAgdGhpcy5zZWdtZW50cyA9IHt9O1xuICB0aGlzLl9fa2V5ID0gMDtcbn1cblxuLy8gc3RhdGljIGRlZmluaXRpb25zIG1hcFxuVGltZWxpbmUuc2VnbWVudERlZmluaXRpb25zID0ge307XG5cbi8qKlxuICogUmVnaXN0ZXJzIGEgdHJhbnNpdGlvbiBkZWZpbml0aW9uIGZvciB1c2Ugd2l0aCB7QGxpbmsgVEhSRUUuQkFTLlRpbWVsaW5lLmFkZH0uXG4gKiBAcGFyYW0ge1N0cmluZ30ga2V5IE5hbWUgb2YgdGhlIHRyYW5zaXRpb24uIERlZmF1bHRzIGluY2x1ZGUgJ3NjYWxlJywgJ3JvdGF0ZScgYW5kICd0cmFuc2xhdGUnLlxuICogQHBhcmFtIHtPYmplY3R9IGRlZmluaXRpb25cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGRlZmluaXRpb24uY29tcGlsZXIgQSBmdW5jdGlvbiB0aGF0IGdlbmVyYXRlcyBhIGdsc2wgc3RyaW5nIGZvciBhIHRyYW5zaXRpb24gc2VnbWVudC4gQWNjZXB0cyBhIFRIUkVFLkJBUy5UaW1lbGluZVNlZ21lbnQgYXMgdGhlIHNvbGUgYXJndW1lbnQuXG4gKiBAcGFyYW0geyp9IGRlZmluaXRpb24uZGVmYXVsdEZyb20gVGhlIGluaXRpYWwgdmFsdWUgZm9yIGEgdHJhbnNmb3JtLmZyb20uIEZvciBleGFtcGxlLCB0aGUgZGVmYXVsdEZyb20gZm9yIGEgdHJhbnNsYXRpb24gaXMgVEhSRUUuVmVjdG9yMygwLCAwLCAwKS5cbiAqIEBzdGF0aWNcbiAqL1xuVGltZWxpbmUucmVnaXN0ZXIgPSBmdW5jdGlvbihrZXksIGRlZmluaXRpb24pIHtcbiAgVGltZWxpbmUuc2VnbWVudERlZmluaXRpb25zW2tleV0gPSBkZWZpbml0aW9uO1xuICBcbiAgcmV0dXJuIGRlZmluaXRpb247XG59O1xuXG4vKipcbiAqIEFkZCBhIHRyYW5zaXRpb24gdG8gdGhlIHRpbWVsaW5lLlxuICogQHBhcmFtIHtudW1iZXJ9IGR1cmF0aW9uIER1cmF0aW9uIGluIHNlY29uZHNcbiAqIEBwYXJhbSB7b2JqZWN0fSB0cmFuc2l0aW9ucyBBbiBvYmplY3QgY29udGFpbmluZyBvbmUgb3Igc2V2ZXJhbCB0cmFuc2l0aW9ucy4gVGhlIGtleXMgc2hvdWxkIG1hdGNoIHRyYW5zZm9ybSBkZWZpbml0aW9ucy5cbiAqIFRoZSB0cmFuc2l0aW9uIG9iamVjdCBmb3IgZWFjaCBrZXkgd2lsbCBiZSBwYXNzZWQgdG8gdGhlIG1hdGNoaW5nIGRlZmluaXRpb24ncyBjb21waWxlci4gSXQgY2FuIGhhdmUgYXJiaXRyYXJ5IHByb3BlcnRpZXMsIGJ1dCB0aGUgVGltZWxpbmUgZXhwZWN0cyBhdCBsZWFzdCBhICd0bycsICdmcm9tJyBhbmQgYW4gb3B0aW9uYWwgJ2Vhc2UnLlxuICogQHBhcmFtIHtudW1iZXJ8c3RyaW5nfSBbcG9zaXRpb25PZmZzZXRdIFBvc2l0aW9uIGluIHRoZSB0aW1lbGluZS4gRGVmYXVsdHMgdG8gdGhlIGVuZCBvZiB0aGUgdGltZWxpbmUuIElmIGEgbnVtYmVyIGlzIHByb3ZpZGVkLCB0aGUgdHJhbnNpdGlvbiB3aWxsIGJlIGluc2VydGVkIGF0IHRoYXQgdGltZSBpbiBzZWNvbmRzLiBTdHJpbmdzICgnKz14JyBvciAnLT14JykgY2FuIGJlIHVzZWQgZm9yIGEgdmFsdWUgcmVsYXRpdmUgdG8gdGhlIGVuZCBvZiB0aW1lbGluZS5cbiAqL1xuVGltZWxpbmUucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uKGR1cmF0aW9uLCB0cmFuc2l0aW9ucywgcG9zaXRpb25PZmZzZXQpIHtcbiAgLy8gc3RvcCByb2xsdXAgZnJvbSBjb21wbGFpbmluZyBhYm91dCBldmFsXG4gIGNvbnN0IF9ldmFsID0gZXZhbDtcbiAgXG4gIGxldCBzdGFydCA9IHRoaXMuZHVyYXRpb247XG5cbiAgaWYgKHBvc2l0aW9uT2Zmc2V0ICE9PSB1bmRlZmluZWQpIHtcbiAgICBpZiAodHlwZW9mIHBvc2l0aW9uT2Zmc2V0ID09PSAnbnVtYmVyJykge1xuICAgICAgc3RhcnQgPSBwb3NpdGlvbk9mZnNldDtcbiAgICB9XG4gICAgZWxzZSBpZiAodHlwZW9mIHBvc2l0aW9uT2Zmc2V0ID09PSAnc3RyaW5nJykge1xuICAgICAgX2V2YWwoJ3N0YXJ0JyArIHBvc2l0aW9uT2Zmc2V0KTtcbiAgICB9XG5cbiAgICB0aGlzLmR1cmF0aW9uID0gTWF0aC5tYXgodGhpcy5kdXJhdGlvbiwgc3RhcnQgKyBkdXJhdGlvbik7XG4gIH1cbiAgZWxzZSB7XG4gICAgdGhpcy5kdXJhdGlvbiArPSBkdXJhdGlvbjtcbiAgfVxuXG4gIGxldCBrZXlzID0gT2JqZWN0LmtleXModHJhbnNpdGlvbnMpLCBrZXk7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgaSsrKSB7XG4gICAga2V5ID0ga2V5c1tpXTtcblxuICAgIHRoaXMucHJvY2Vzc1RyYW5zaXRpb24oa2V5LCB0cmFuc2l0aW9uc1trZXldLCBzdGFydCwgZHVyYXRpb24pO1xuICB9XG59O1xuXG5UaW1lbGluZS5wcm90b3R5cGUucHJvY2Vzc1RyYW5zaXRpb24gPSBmdW5jdGlvbihrZXksIHRyYW5zaXRpb24sIHN0YXJ0LCBkdXJhdGlvbikge1xuICBjb25zdCBkZWZpbml0aW9uID0gVGltZWxpbmUuc2VnbWVudERlZmluaXRpb25zW2tleV07XG5cbiAgbGV0IHNlZ21lbnRzID0gdGhpcy5zZWdtZW50c1trZXldO1xuICBpZiAoIXNlZ21lbnRzKSBzZWdtZW50cyA9IHRoaXMuc2VnbWVudHNba2V5XSA9IFtdO1xuXG4gIGlmICh0cmFuc2l0aW9uLmZyb20gPT09IHVuZGVmaW5lZCkge1xuICAgIGlmIChzZWdtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHRyYW5zaXRpb24uZnJvbSA9IGRlZmluaXRpb24uZGVmYXVsdEZyb207XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgdHJhbnNpdGlvbi5mcm9tID0gc2VnbWVudHNbc2VnbWVudHMubGVuZ3RoIC0gMV0udHJhbnNpdGlvbi50bztcbiAgICB9XG4gIH1cblxuICBzZWdtZW50cy5wdXNoKG5ldyBUaW1lbGluZVNlZ21lbnQoKHRoaXMuX19rZXkrKykudG9TdHJpbmcoKSwgc3RhcnQsIGR1cmF0aW9uLCB0cmFuc2l0aW9uLCBkZWZpbml0aW9uLmNvbXBpbGVyKSk7XG59O1xuXG4vKipcbiAqIENvbXBpbGVzIHRoZSB0aW1lbGluZSBpbnRvIGEgZ2xzbCBzdHJpbmcgYXJyYXkgdGhhdCBjYW4gYmUgaW5qZWN0ZWQgaW50byBhICh2ZXJ0ZXgpIHNoYWRlci5cbiAqIEByZXR1cm5zIHtBcnJheX1cbiAqL1xuVGltZWxpbmUucHJvdG90eXBlLmNvbXBpbGUgPSBmdW5jdGlvbigpIHtcbiAgY29uc3QgYyA9IFtdO1xuXG4gIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyh0aGlzLnNlZ21lbnRzKTtcbiAgbGV0IHNlZ21lbnRzO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7IGkrKykge1xuICAgIHNlZ21lbnRzID0gdGhpcy5zZWdtZW50c1trZXlzW2ldXTtcblxuICAgIHRoaXMuZmlsbEdhcHMoc2VnbWVudHMpO1xuXG4gICAgc2VnbWVudHMuZm9yRWFjaChmdW5jdGlvbihzKSB7XG4gICAgICBjLnB1c2gocy5jb21waWxlKCkpO1xuICAgIH0pO1xuICB9XG5cbiAgcmV0dXJuIGM7XG59O1xuVGltZWxpbmUucHJvdG90eXBlLmZpbGxHYXBzID0gZnVuY3Rpb24oc2VnbWVudHMpIHtcbiAgaWYgKHNlZ21lbnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuO1xuXG4gIGxldCBzMCwgczE7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBzZWdtZW50cy5sZW5ndGggLSAxOyBpKyspIHtcbiAgICBzMCA9IHNlZ21lbnRzW2ldO1xuICAgIHMxID0gc2VnbWVudHNbaSArIDFdO1xuXG4gICAgczAudHJhaWwgPSBzMS5zdGFydCAtIHMwLmVuZDtcbiAgfVxuXG4gIC8vIHBhZCBsYXN0IHNlZ21lbnQgdW50aWwgZW5kIG9mIHRpbWVsaW5lXG4gIHMwID0gc2VnbWVudHNbc2VnbWVudHMubGVuZ3RoIC0gMV07XG4gIHMwLnRyYWlsID0gdGhpcy5kdXJhdGlvbiAtIHMwLmVuZDtcbn07XG5cbi8qKlxuICogR2V0IGEgY29tcGlsZWQgZ2xzbCBzdHJpbmcgd2l0aCBjYWxscyB0byB0cmFuc2Zvcm0gZnVuY3Rpb25zIGZvciBhIGdpdmVuIGtleS5cbiAqIFRoZSBvcmRlciBpbiB3aGljaCB0aGVzZSB0cmFuc2l0aW9ucyBhcmUgYXBwbGllZCBtYXR0ZXJzIGJlY2F1c2UgdGhleSBhbGwgb3BlcmF0ZSBvbiB0aGUgc2FtZSB2YWx1ZS5cbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgQSBrZXkgbWF0Y2hpbmcgYSB0cmFuc2Zvcm0gZGVmaW5pdGlvbi5cbiAqIEByZXR1cm5zIHtzdHJpbmd9XG4gKi9cblRpbWVsaW5lLnByb3RvdHlwZS5nZXRUcmFuc2Zvcm1DYWxscyA9IGZ1bmN0aW9uKGtleSkge1xuICBsZXQgdCA9IHRoaXMudGltZUtleTtcblxuICByZXR1cm4gdGhpcy5zZWdtZW50c1trZXldID8gIHRoaXMuc2VnbWVudHNba2V5XS5tYXAoZnVuY3Rpb24ocykge1xuICAgIHJldHVybiBgYXBwbHlUcmFuc2Zvcm0ke3Mua2V5fSgke3R9LCB0cmFuc2Zvcm1lZCk7YDtcbiAgfSkuam9pbignXFxuJykgOiAnJztcbn07XG5cbmV4cG9ydCB7IFRpbWVsaW5lIH1cbiIsImNvbnN0IFRpbWVsaW5lQ2h1bmtzID0ge1xuICB2ZWMzOiBmdW5jdGlvbihuLCB2LCBwKSB7XG4gICAgY29uc3QgeCA9ICh2LnggfHwgMCkudG9QcmVjaXNpb24ocCk7XG4gICAgY29uc3QgeSA9ICh2LnkgfHwgMCkudG9QcmVjaXNpb24ocCk7XG4gICAgY29uc3QgeiA9ICh2LnogfHwgMCkudG9QcmVjaXNpb24ocCk7XG5cbiAgICByZXR1cm4gYHZlYzMgJHtufSA9IHZlYzMoJHt4fSwgJHt5fSwgJHt6fSk7YDtcbiAgfSxcbiAgdmVjNDogZnVuY3Rpb24obiwgdiwgcCkge1xuICAgIGNvbnN0IHggPSAodi54IHx8IDApLnRvUHJlY2lzaW9uKHApO1xuICAgIGNvbnN0IHkgPSAodi55IHx8IDApLnRvUHJlY2lzaW9uKHApO1xuICAgIGNvbnN0IHogPSAodi56IHx8IDApLnRvUHJlY2lzaW9uKHApO1xuICAgIGNvbnN0IHcgPSAodi53IHx8IDApLnRvUHJlY2lzaW9uKHApO1xuICBcbiAgICByZXR1cm4gYHZlYzQgJHtufSA9IHZlYzQoJHt4fSwgJHt5fSwgJHt6fSwgJHt3fSk7YDtcbiAgfSxcbiAgZGVsYXlEdXJhdGlvbjogZnVuY3Rpb24oc2VnbWVudCkge1xuICAgIHJldHVybiBgXG4gICAgZmxvYXQgY0RlbGF5JHtzZWdtZW50LmtleX0gPSAke3NlZ21lbnQuc3RhcnQudG9QcmVjaXNpb24oNCl9O1xuICAgIGZsb2F0IGNEdXJhdGlvbiR7c2VnbWVudC5rZXl9ID0gJHtzZWdtZW50LmR1cmF0aW9uLnRvUHJlY2lzaW9uKDQpfTtcbiAgICBgO1xuICB9LFxuICBwcm9ncmVzczogZnVuY3Rpb24oc2VnbWVudCkge1xuICAgIC8vIHplcm8gZHVyYXRpb24gc2VnbWVudHMgc2hvdWxkIGFsd2F5cyByZW5kZXIgY29tcGxldGVcbiAgICBpZiAoc2VnbWVudC5kdXJhdGlvbiA9PT0gMCkge1xuICAgICAgcmV0dXJuIGBmbG9hdCBwcm9ncmVzcyA9IDEuMDtgXG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgcmV0dXJuIGBcbiAgICAgIGZsb2F0IHByb2dyZXNzID0gY2xhbXAodGltZSAtIGNEZWxheSR7c2VnbWVudC5rZXl9LCAwLjAsIGNEdXJhdGlvbiR7c2VnbWVudC5rZXl9KSAvIGNEdXJhdGlvbiR7c2VnbWVudC5rZXl9O1xuICAgICAgJHtzZWdtZW50LnRyYW5zaXRpb24uZWFzZSA/IGBwcm9ncmVzcyA9ICR7c2VnbWVudC50cmFuc2l0aW9uLmVhc2V9KHByb2dyZXNzJHsoc2VnbWVudC50cmFuc2l0aW9uLmVhc2VQYXJhbXMgPyBgLCAke3NlZ21lbnQudHJhbnNpdGlvbi5lYXNlUGFyYW1zLm1hcCgodikgPT4gdi50b1ByZWNpc2lvbig0KSkuam9pbihgLCBgKX1gIDogYGApfSk7YCA6IGBgfVxuICAgICAgYDtcbiAgICB9XG4gIH0sXG4gIHJlbmRlckNoZWNrOiBmdW5jdGlvbihzZWdtZW50KSB7XG4gICAgY29uc3Qgc3RhcnRUaW1lID0gc2VnbWVudC5zdGFydC50b1ByZWNpc2lvbig0KTtcbiAgICBjb25zdCBlbmRUaW1lID0gKHNlZ21lbnQuZW5kICsgc2VnbWVudC50cmFpbCkudG9QcmVjaXNpb24oNCk7XG5cbiAgICByZXR1cm4gYGlmICh0aW1lIDwgJHtzdGFydFRpbWV9IHx8IHRpbWUgPiAke2VuZFRpbWV9KSByZXR1cm47YDtcbiAgfVxufTtcblxuZXhwb3J0IHsgVGltZWxpbmVDaHVua3MgfTtcbiIsImltcG9ydCB7IFRpbWVsaW5lIH0gZnJvbSAnLi9UaW1lbGluZSc7XG5pbXBvcnQgeyBUaW1lbGluZUNodW5rcyB9IGZyb20gJy4vVGltZWxpbmVDaHVua3MnO1xuaW1wb3J0IHsgVmVjdG9yMyB9IGZyb20gJ3RocmVlJztcblxuY29uc3QgVHJhbnNsYXRpb25TZWdtZW50ID0ge1xuICBjb21waWxlcjogZnVuY3Rpb24oc2VnbWVudCkge1xuICAgIHJldHVybiBgXG4gICAgJHtUaW1lbGluZUNodW5rcy5kZWxheUR1cmF0aW9uKHNlZ21lbnQpfVxuICAgICR7VGltZWxpbmVDaHVua3MudmVjMyhgY1RyYW5zbGF0ZUZyb20ke3NlZ21lbnQua2V5fWAsIHNlZ21lbnQudHJhbnNpdGlvbi5mcm9tLCAyKX1cbiAgICAke1RpbWVsaW5lQ2h1bmtzLnZlYzMoYGNUcmFuc2xhdGVUbyR7c2VnbWVudC5rZXl9YCwgc2VnbWVudC50cmFuc2l0aW9uLnRvLCAyKX1cbiAgICBcbiAgICB2b2lkIGFwcGx5VHJhbnNmb3JtJHtzZWdtZW50LmtleX0oZmxvYXQgdGltZSwgaW5vdXQgdmVjMyB2KSB7XG4gICAgXG4gICAgICAke1RpbWVsaW5lQ2h1bmtzLnJlbmRlckNoZWNrKHNlZ21lbnQpfVxuICAgICAgJHtUaW1lbGluZUNodW5rcy5wcm9ncmVzcyhzZWdtZW50KX1cbiAgICBcbiAgICAgIHYgKz0gbWl4KGNUcmFuc2xhdGVGcm9tJHtzZWdtZW50LmtleX0sIGNUcmFuc2xhdGVUbyR7c2VnbWVudC5rZXl9LCBwcm9ncmVzcyk7XG4gICAgfVxuICAgIGA7XG4gIH0sXG4gIGRlZmF1bHRGcm9tOiBuZXcgVmVjdG9yMygwLCAwLCAwKVxufTtcblxuVGltZWxpbmUucmVnaXN0ZXIoJ3RyYW5zbGF0ZScsIFRyYW5zbGF0aW9uU2VnbWVudCk7XG5cbmV4cG9ydCB7IFRyYW5zbGF0aW9uU2VnbWVudCB9O1xuIiwiaW1wb3J0IHsgVGltZWxpbmUgfSBmcm9tICcuL1RpbWVsaW5lJztcbmltcG9ydCB7IFRpbWVsaW5lQ2h1bmtzIH0gZnJvbSAnLi9UaW1lbGluZUNodW5rcyc7XG5pbXBvcnQgeyBWZWN0b3IzIH0gZnJvbSAndGhyZWUnO1xuXG5jb25zdCBTY2FsZVNlZ21lbnQgPSB7XG4gIGNvbXBpbGVyOiBmdW5jdGlvbihzZWdtZW50KSB7XG4gICAgY29uc3Qgb3JpZ2luID0gc2VnbWVudC50cmFuc2l0aW9uLm9yaWdpbjtcbiAgICBcbiAgICByZXR1cm4gYFxuICAgICR7VGltZWxpbmVDaHVua3MuZGVsYXlEdXJhdGlvbihzZWdtZW50KX1cbiAgICAke1RpbWVsaW5lQ2h1bmtzLnZlYzMoYGNTY2FsZUZyb20ke3NlZ21lbnQua2V5fWAsIHNlZ21lbnQudHJhbnNpdGlvbi5mcm9tLCAyKX1cbiAgICAke1RpbWVsaW5lQ2h1bmtzLnZlYzMoYGNTY2FsZVRvJHtzZWdtZW50LmtleX1gLCBzZWdtZW50LnRyYW5zaXRpb24udG8sIDIpfVxuICAgICR7b3JpZ2luID8gVGltZWxpbmVDaHVua3MudmVjMyhgY09yaWdpbiR7c2VnbWVudC5rZXl9YCwgb3JpZ2luLCAyKSA6ICcnfVxuICAgIFxuICAgIHZvaWQgYXBwbHlUcmFuc2Zvcm0ke3NlZ21lbnQua2V5fShmbG9hdCB0aW1lLCBpbm91dCB2ZWMzIHYpIHtcbiAgICBcbiAgICAgICR7VGltZWxpbmVDaHVua3MucmVuZGVyQ2hlY2soc2VnbWVudCl9XG4gICAgICAke1RpbWVsaW5lQ2h1bmtzLnByb2dyZXNzKHNlZ21lbnQpfVxuICAgIFxuICAgICAgJHtvcmlnaW4gPyBgdiAtPSBjT3JpZ2luJHtzZWdtZW50LmtleX07YCA6ICcnfVxuICAgICAgdiAqPSBtaXgoY1NjYWxlRnJvbSR7c2VnbWVudC5rZXl9LCBjU2NhbGVUbyR7c2VnbWVudC5rZXl9LCBwcm9ncmVzcyk7XG4gICAgICAke29yaWdpbiA/IGB2ICs9IGNPcmlnaW4ke3NlZ21lbnQua2V5fTtgIDogJyd9XG4gICAgfVxuICAgIGA7XG4gIH0sXG4gIGRlZmF1bHRGcm9tOiBuZXcgVmVjdG9yMygxLCAxLCAxKVxufTtcblxuVGltZWxpbmUucmVnaXN0ZXIoJ3NjYWxlJywgU2NhbGVTZWdtZW50KTtcblxuZXhwb3J0IHsgU2NhbGVTZWdtZW50IH07XG4iLCJpbXBvcnQgeyBUaW1lbGluZSB9IGZyb20gJy4vVGltZWxpbmUnO1xuaW1wb3J0IHsgVGltZWxpbmVDaHVua3MgfSBmcm9tICcuL1RpbWVsaW5lQ2h1bmtzJztcbmltcG9ydCB7IFZlY3RvcjMsIFZlY3RvcjQgfSBmcm9tICd0aHJlZSc7XG5cbmNvbnN0IFJvdGF0aW9uU2VnbWVudCA9IHtcbiAgY29tcGlsZXIoc2VnbWVudCkge1xuICAgIGNvbnN0IGZyb21BeGlzQW5nbGUgPSBuZXcgVmVjdG9yNChcbiAgICAgIHNlZ21lbnQudHJhbnNpdGlvbi5mcm9tLmF4aXMueCxcbiAgICAgIHNlZ21lbnQudHJhbnNpdGlvbi5mcm9tLmF4aXMueSxcbiAgICAgIHNlZ21lbnQudHJhbnNpdGlvbi5mcm9tLmF4aXMueixcbiAgICAgIHNlZ21lbnQudHJhbnNpdGlvbi5mcm9tLmFuZ2xlXG4gICAgKTtcbiAgXG4gICAgY29uc3QgdG9BeGlzID0gc2VnbWVudC50cmFuc2l0aW9uLnRvLmF4aXMgfHwgc2VnbWVudC50cmFuc2l0aW9uLmZyb20uYXhpcztcbiAgICBjb25zdCB0b0F4aXNBbmdsZSA9IG5ldyBWZWN0b3I0KFxuICAgICAgdG9BeGlzLngsXG4gICAgICB0b0F4aXMueSxcbiAgICAgIHRvQXhpcy56LFxuICAgICAgc2VnbWVudC50cmFuc2l0aW9uLnRvLmFuZ2xlXG4gICAgKTtcbiAgXG4gICAgY29uc3Qgb3JpZ2luID0gc2VnbWVudC50cmFuc2l0aW9uLm9yaWdpbjtcbiAgICBcbiAgICByZXR1cm4gYFxuICAgICR7VGltZWxpbmVDaHVua3MuZGVsYXlEdXJhdGlvbihzZWdtZW50KX1cbiAgICAke1RpbWVsaW5lQ2h1bmtzLnZlYzQoYGNSb3RhdGlvbkZyb20ke3NlZ21lbnQua2V5fWAsIGZyb21BeGlzQW5nbGUsIDgpfVxuICAgICR7VGltZWxpbmVDaHVua3MudmVjNChgY1JvdGF0aW9uVG8ke3NlZ21lbnQua2V5fWAsIHRvQXhpc0FuZ2xlLCA4KX1cbiAgICAke29yaWdpbiA/IFRpbWVsaW5lQ2h1bmtzLnZlYzMoYGNPcmlnaW4ke3NlZ21lbnQua2V5fWAsIG9yaWdpbiwgMikgOiAnJ31cbiAgICBcbiAgICB2b2lkIGFwcGx5VHJhbnNmb3JtJHtzZWdtZW50LmtleX0oZmxvYXQgdGltZSwgaW5vdXQgdmVjMyB2KSB7XG4gICAgICAke1RpbWVsaW5lQ2h1bmtzLnJlbmRlckNoZWNrKHNlZ21lbnQpfVxuICAgICAgJHtUaW1lbGluZUNodW5rcy5wcm9ncmVzcyhzZWdtZW50KX1cblxuICAgICAgJHtvcmlnaW4gPyBgdiAtPSBjT3JpZ2luJHtzZWdtZW50LmtleX07YCA6ICcnfVxuICAgICAgdmVjMyBheGlzID0gbm9ybWFsaXplKG1peChjUm90YXRpb25Gcm9tJHtzZWdtZW50LmtleX0ueHl6LCBjUm90YXRpb25UbyR7c2VnbWVudC5rZXl9Lnh5eiwgcHJvZ3Jlc3MpKTtcbiAgICAgIGZsb2F0IGFuZ2xlID0gbWl4KGNSb3RhdGlvbkZyb20ke3NlZ21lbnQua2V5fS53LCBjUm90YXRpb25UbyR7c2VnbWVudC5rZXl9LncsIHByb2dyZXNzKTtcbiAgICAgIHZlYzQgcSA9IHF1YXRGcm9tQXhpc0FuZ2xlKGF4aXMsIGFuZ2xlKTtcbiAgICAgIHYgPSByb3RhdGVWZWN0b3IocSwgdik7XG4gICAgICAke29yaWdpbiA/IGB2ICs9IGNPcmlnaW4ke3NlZ21lbnQua2V5fTtgIDogJyd9XG4gICAgfVxuICAgIGA7XG4gIH0sXG4gIGRlZmF1bHRGcm9tOiB7YXhpczogbmV3IFZlY3RvcjMoKSwgYW5nbGU6IDB9XG59O1xuXG5UaW1lbGluZS5yZWdpc3Rlcigncm90YXRlJywgUm90YXRpb25TZWdtZW50KTtcblxuZXhwb3J0IHsgUm90YXRpb25TZWdtZW50IH07XG4iXSwibmFtZXMiOlsiQmFzZUFuaW1hdGlvbk1hdGVyaWFsIiwicGFyYW1ldGVycyIsInVuaWZvcm1zIiwiY2FsbCIsInVuaWZvcm1WYWx1ZXMiLCJzZXRWYWx1ZXMiLCJVbmlmb3Jtc1V0aWxzIiwibWVyZ2UiLCJzZXRVbmlmb3JtVmFsdWVzIiwibWFwIiwiZGVmaW5lcyIsIm5vcm1hbE1hcCIsImVudk1hcCIsImFvTWFwIiwic3BlY3VsYXJNYXAiLCJhbHBoYU1hcCIsImxpZ2h0TWFwIiwiZW1pc3NpdmVNYXAiLCJidW1wTWFwIiwiZGlzcGxhY2VtZW50TWFwIiwicm91Z2huZXNzTWFwIiwibWV0YWxuZXNzTWFwIiwiZ3JhZGllbnRNYXAiLCJlbnZNYXBUeXBlRGVmaW5lIiwiZW52TWFwTW9kZURlZmluZSIsImVudk1hcEJsZW5kaW5nRGVmaW5lIiwibWFwcGluZyIsIkN1YmVSZWZsZWN0aW9uTWFwcGluZyIsIkN1YmVSZWZyYWN0aW9uTWFwcGluZyIsIkN1YmVVVlJlZmxlY3Rpb25NYXBwaW5nIiwiQ3ViZVVWUmVmcmFjdGlvbk1hcHBpbmciLCJFcXVpcmVjdGFuZ3VsYXJSZWZsZWN0aW9uTWFwcGluZyIsIkVxdWlyZWN0YW5ndWxhclJlZnJhY3Rpb25NYXBwaW5nIiwiU3BoZXJpY2FsUmVmbGVjdGlvbk1hcHBpbmciLCJjb21iaW5lIiwiTWl4T3BlcmF0aW9uIiwiQWRkT3BlcmF0aW9uIiwiTXVsdGlwbHlPcGVyYXRpb24iLCJwcm90b3R5cGUiLCJPYmplY3QiLCJhc3NpZ24iLCJjcmVhdGUiLCJTaGFkZXJNYXRlcmlhbCIsInZhbHVlcyIsImtleXMiLCJmb3JFYWNoIiwia2V5IiwidmFsdWUiLCJuYW1lIiwiam9pbiIsIm1ldGEiLCJkYXRhIiwiTWF0ZXJpYWwiLCJ0b0pTT04iLCJ1bmlmb3JtIiwidW5kZWZpbmVkIiwiaXNUZXh0dXJlIiwidXVpZCIsImlzQ29sb3IiLCJnZXRIZXgiLCJpc1ZlY3RvcjIiLCJ0b0FycmF5IiwiaXNWZWN0b3IzIiwiaXNWZWN0b3I0IiwiaXNNYXRyaXg0IiwibGVuZ3RoIiwidmVydGV4U2hhZGVyIiwiZnJhZ21lbnRTaGFkZXIiLCJCYXNpY0FuaW1hdGlvbk1hdGVyaWFsIiwidmFyeWluZ1BhcmFtZXRlcnMiLCJ2ZXJ0ZXhQYXJhbWV0ZXJzIiwidmVydGV4RnVuY3Rpb25zIiwidmVydGV4SW5pdCIsInZlcnRleE5vcm1hbCIsInZlcnRleFBvc2l0aW9uIiwidmVydGV4Q29sb3IiLCJ2ZXJ0ZXhQb3N0TW9ycGgiLCJ2ZXJ0ZXhQb3N0U2tpbm5pbmciLCJmcmFnbWVudEZ1bmN0aW9ucyIsImZyYWdtZW50UGFyYW1ldGVycyIsImZyYWdtZW50SW5pdCIsImZyYWdtZW50TWFwIiwiZnJhZ21lbnREaWZmdXNlIiwiU2hhZGVyTGliIiwibGlnaHRzIiwiY29uY2F0VmVydGV4U2hhZGVyIiwiY29uY2F0RnJhZ21lbnRTaGFkZXIiLCJjb25zdHJ1Y3RvciIsInN0cmluZ2lmeUNodW5rIiwiTGFtYmVydEFuaW1hdGlvbk1hdGVyaWFsIiwiZnJhZ21lbnRFbWlzc2l2ZSIsImZyYWdtZW50U3BlY3VsYXIiLCJQaG9uZ0FuaW1hdGlvbk1hdGVyaWFsIiwiU3RhbmRhcmRBbmltYXRpb25NYXRlcmlhbCIsImZyYWdtZW50Um91Z2huZXNzIiwiZnJhZ21lbnRNZXRhbG5lc3MiLCJUb29uQW5pbWF0aW9uTWF0ZXJpYWwiLCJQb2ludHNBbmltYXRpb25NYXRlcmlhbCIsImZyYWdtZW50U2hhcGUiLCJEZXB0aEFuaW1hdGlvbk1hdGVyaWFsIiwiZGVwdGhQYWNraW5nIiwiUkdCQURlcHRoUGFja2luZyIsImNsaXBwaW5nIiwiRGlzdGFuY2VBbmltYXRpb25NYXRlcmlhbCIsIlByZWZhYkJ1ZmZlckdlb21ldHJ5IiwicHJlZmFiIiwiY291bnQiLCJwcmVmYWJHZW9tZXRyeSIsImlzUHJlZmFiQnVmZmVyR2VvbWV0cnkiLCJpc0J1ZmZlckdlb21ldHJ5IiwicHJlZmFiQ291bnQiLCJwcmVmYWJWZXJ0ZXhDb3VudCIsImF0dHJpYnV0ZXMiLCJwb3NpdGlvbiIsInZlcnRpY2VzIiwiYnVmZmVySW5kaWNlcyIsImJ1ZmZlclBvc2l0aW9ucyIsIkJ1ZmZlckdlb21ldHJ5IiwicHJlZmFiSW5kaWNlcyIsInByZWZhYkluZGV4Q291bnQiLCJpbmRleCIsImFycmF5IiwiaSIsInB1c2giLCJwcmVmYWJGYWNlQ291bnQiLCJmYWNlcyIsImZhY2UiLCJhIiwiYiIsImMiLCJpbmRleEJ1ZmZlciIsIlVpbnQzMkFycmF5Iiwic2V0SW5kZXgiLCJCdWZmZXJBdHRyaWJ1dGUiLCJrIiwicG9zaXRpb25CdWZmZXIiLCJjcmVhdGVBdHRyaWJ1dGUiLCJwb3NpdGlvbnMiLCJvZmZzZXQiLCJqIiwicHJlZmFiVmVydGV4IiwieCIsInkiLCJ6IiwiYnVmZmVyVXZzIiwidXZCdWZmZXIiLCJ1dnMiLCJ1diIsImZhY2VWZXJ0ZXhVdnMiLCJpdGVtU2l6ZSIsImZhY3RvcnkiLCJidWZmZXIiLCJGbG9hdDMyQXJyYXkiLCJhdHRyaWJ1dGUiLCJhZGRBdHRyaWJ1dGUiLCJzZXRQcmVmYWJEYXRhIiwicHJlZmFiSW5kZXgiLCJNdWx0aVByZWZhYkJ1ZmZlckdlb21ldHJ5IiwicHJlZmFicyIsInJlcGVhdENvdW50IiwiQXJyYXkiLCJpc0FycmF5IiwicHJlZmFiR2VvbWV0cmllcyIsInByZWZhYkdlb21ldHJpZXNDb3VudCIsInByZWZhYlZlcnRleENvdW50cyIsInAiLCJyZXBlYXRWZXJ0ZXhDb3VudCIsInJlZHVjZSIsInIiLCJ2IiwicmVwZWF0SW5kZXhDb3VudCIsImluZGljZXMiLCJnZW9tZXRyeSIsImluZGV4T2Zmc2V0IiwicHJlZmFiT2Zmc2V0IiwidmVydGV4Q291bnQiLCJwcmVmYWJQb3NpdGlvbnMiLCJwcmVmYWJVdnMiLCJlcnJvciIsInV2T2JqZWN0cyIsInByZWZhYkdlb21ldHJ5SW5kZXgiLCJwcmVmYWJHZW9tZXRyeVZlcnRleENvdW50Iiwid2hvbGUiLCJ3aG9sZU9mZnNldCIsInBhcnQiLCJwYXJ0T2Zmc2V0IiwiSW5zdGFuY2VkUHJlZmFiQnVmZmVyR2VvbWV0cnkiLCJpc0dlb21ldHJ5IiwiY29weSIsIm1heEluc3RhbmNlZENvdW50IiwiSW5zdGFuY2VkQnVmZmVyR2VvbWV0cnkiLCJJbnN0YW5jZWRCdWZmZXJBdHRyaWJ1dGUiLCJVdGlscyIsImlsIiwibiIsInZhIiwidmIiLCJ2YyIsImNsb25lIiwiVmVjdG9yMyIsImJveCIsInRNYXRoIiwicmFuZEZsb2F0IiwibWluIiwibWF4IiwicmFuZEZsb2F0U3ByZWFkIiwibm9ybWFsaXplIiwic291cmNlTWF0ZXJpYWwiLCJNb2RlbEJ1ZmZlckdlb21ldHJ5IiwibW9kZWwiLCJvcHRpb25zIiwibW9kZWxHZW9tZXRyeSIsImZhY2VDb3VudCIsImNvbXB1dGVDZW50cm9pZHMiLCJsb2NhbGl6ZUZhY2VzIiwiY2VudHJvaWRzIiwiY29tcHV0ZUNlbnRyb2lkIiwiY2VudHJvaWQiLCJ2ZXJ0ZXgiLCJidWZmZXJTa2lubmluZyIsInNraW5JbmRleEJ1ZmZlciIsInNraW5XZWlnaHRCdWZmZXIiLCJza2luSW5kZXgiLCJza2luSW5kaWNlcyIsInNraW5XZWlnaHQiLCJza2luV2VpZ2h0cyIsInciLCJzZXRGYWNlRGF0YSIsImZhY2VJbmRleCIsIlBvaW50QnVmZmVyR2VvbWV0cnkiLCJwb2ludENvdW50Iiwic2V0UG9pbnREYXRhIiwicG9pbnRJbmRleCIsIlNoYWRlckNodW5rIiwiY2F0bXVsbF9yb21fc3BsaW5lIiwiY3ViaWNfYmV6aWVyIiwiZWFzZV9iYWNrX2luIiwiZWFzZV9iYWNrX2luX291dCIsImVhc2VfYmFja19vdXQiLCJlYXNlX2JlemllciIsImVhc2VfYm91bmNlX2luIiwiZWFzZV9ib3VuY2VfaW5fb3V0IiwiZWFzZV9ib3VuY2Vfb3V0IiwiZWFzZV9jaXJjX2luIiwiZWFzZV9jaXJjX2luX291dCIsImVhc2VfY2lyY19vdXQiLCJlYXNlX2N1YmljX2luIiwiZWFzZV9jdWJpY19pbl9vdXQiLCJlYXNlX2N1YmljX291dCIsImVhc2VfZWxhc3RpY19pbiIsImVhc2VfZWxhc3RpY19pbl9vdXQiLCJlYXNlX2VsYXN0aWNfb3V0IiwiZWFzZV9leHBvX2luIiwiZWFzZV9leHBvX2luX291dCIsImVhc2VfZXhwb19vdXQiLCJlYXNlX3F1YWRfaW4iLCJlYXNlX3F1YWRfaW5fb3V0IiwiZWFzZV9xdWFkX291dCIsImVhc2VfcXVhcnRfaW4iLCJlYXNlX3F1YXJ0X2luX291dCIsImVhc2VfcXVhcnRfb3V0IiwiZWFzZV9xdWludF9pbiIsImVhc2VfcXVpbnRfaW5fb3V0IiwiZWFzZV9xdWludF9vdXQiLCJlYXNlX3NpbmVfaW4iLCJlYXNlX3NpbmVfaW5fb3V0IiwiZWFzZV9zaW5lX291dCIsInF1YWRyYXRpY19iZXppZXIiLCJxdWF0ZXJuaW9uX3JvdGF0aW9uIiwicXVhdGVybmlvbl9zbGVycCIsIlRpbWVsaW5lU2VnbWVudCIsInN0YXJ0IiwiZHVyYXRpb24iLCJ0cmFuc2l0aW9uIiwiY29tcGlsZXIiLCJ0cmFpbCIsImNvbXBpbGUiLCJkZWZpbmVQcm9wZXJ0eSIsIlRpbWVsaW5lIiwidGltZUtleSIsInNlZ21lbnRzIiwiX19rZXkiLCJzZWdtZW50RGVmaW5pdGlvbnMiLCJyZWdpc3RlciIsImRlZmluaXRpb24iLCJhZGQiLCJ0cmFuc2l0aW9ucyIsInBvc2l0aW9uT2Zmc2V0IiwiX2V2YWwiLCJldmFsIiwiTWF0aCIsInByb2Nlc3NUcmFuc2l0aW9uIiwiZnJvbSIsImRlZmF1bHRGcm9tIiwidG8iLCJ0b1N0cmluZyIsImZpbGxHYXBzIiwicyIsInMwIiwiczEiLCJlbmQiLCJnZXRUcmFuc2Zvcm1DYWxscyIsInQiLCJUaW1lbGluZUNodW5rcyIsInRvUHJlY2lzaW9uIiwic2VnbWVudCIsImVhc2UiLCJlYXNlUGFyYW1zIiwic3RhcnRUaW1lIiwiZW5kVGltZSIsIlRyYW5zbGF0aW9uU2VnbWVudCIsImRlbGF5RHVyYXRpb24iLCJ2ZWMzIiwicmVuZGVyQ2hlY2siLCJwcm9ncmVzcyIsIlNjYWxlU2VnbWVudCIsIm9yaWdpbiIsIlJvdGF0aW9uU2VnbWVudCIsImZyb21BeGlzQW5nbGUiLCJWZWN0b3I0IiwiYXhpcyIsImFuZ2xlIiwidG9BeGlzIiwidG9BeGlzQW5nbGUiLCJ2ZWM0Il0sIm1hcHBpbmdzIjoiOztBQWdCQSxTQUFTQSxxQkFBVCxDQUErQkMsVUFBL0IsRUFBMkNDLFFBQTNDLEVBQXFEO2lCQUNwQ0MsSUFBZixDQUFvQixJQUFwQjs7TUFFTUMsZ0JBQWdCSCxXQUFXRyxhQUFqQztTQUNPSCxXQUFXRyxhQUFsQjs7T0FFS0MsU0FBTCxDQUFlSixVQUFmOztPQUVLQyxRQUFMLEdBQWdCSSxjQUFjQyxLQUFkLENBQW9CLENBQUNMLFFBQUQsRUFBVyxLQUFLQSxRQUFoQixDQUFwQixDQUFoQjs7T0FFS00sZ0JBQUwsQ0FBc0JKLGFBQXRCOztNQUVJQSxhQUFKLEVB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
