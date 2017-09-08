import {
  ShaderMaterial,
  UniformsUtils,
  CubeReflectionMapping,
  CubeRefractionMapping,
  CubeUVReflectionMapping,
  CubeUVRefractionMapping,
  EquirectangularReflectionMapping,
  EquirectangularRefractionMapping,
  SphericalReflectionMapping,
  MixOperation,
  AddOperation,
  MultiplyOperation
} from 'three';

function BaseAnimationMaterial(parameters, uniforms) {
  ShaderMaterial.call(this);
  
  const uniformValues = parameters.uniformValues;
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
    
      let envMapTypeDefine = 'ENVMAP_TYPE_CUBE';
      let envMapModeDefine = 'ENVMAP_MODE_REFLECTION';
      let envMapBlendingDefine = 'ENVMAP_BLENDING_MULTIPLY';
    
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
  
  setUniformValues(values) {
    if (!values) return;
    
    const keys = Object.keys(values);
    
    keys.forEach((key) => {
      key in this.uniforms && (this.uniforms[key].value = values[key]);
    });
  },
  
  stringifyChunk(name) {
    let value;
    
    if (!this[name]) {
      value = '';
    }
    else if (typeof this[name] ===  'string') {
      value = this[name];
    }
    else {
      value = this[name].join('\n');
    }
    
    return value;
  }
});

export default BaseAnimationMaterial;
