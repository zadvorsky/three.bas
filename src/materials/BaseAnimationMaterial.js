THREE.BAS.BaseAnimationMaterial = function (parameters) {
  THREE.ShaderMaterial.call(this);

  this.shaderFunctions = [];
  this.shaderParameters = [];
  this.shaderVertexInit = [];
  this.shaderTransformNormal = [];
  this.shaderTransformPosition = [];

  this.setValues(parameters);
};
THREE.BAS.BaseAnimationMaterial.prototype = Object.create(THREE.ShaderMaterial.prototype);
THREE.BAS.BaseAnimationMaterial.prototype.constructor = THREE.BAS.BaseAnimationMaterial;

// abstract
THREE.BAS.BaseAnimationMaterial.prototype._concatVertexShader = function () {
  return '';
};

THREE.BAS.BaseAnimationMaterial.prototype._concatFunctions = function () {
  return this.shaderFunctions.join('\n');
};
THREE.BAS.BaseAnimationMaterial.prototype._concatParameters = function () {
  return this.shaderParameters.join('\n');
};
THREE.BAS.BaseAnimationMaterial.prototype._concatVertexInit = function () {
  return this.shaderVertexInit.join('\n');
};
THREE.BAS.BaseAnimationMaterial.prototype._concatTransformNormal = function () {
  return this.shaderTransformNormal.join('\n');
};
THREE.BAS.BaseAnimationMaterial.prototype._concatTransformPosition = function () {
  return this.shaderTransformPosition.join('\n');
};


THREE.BAS.BaseAnimationMaterial.prototype.setUniformValues = function (values) {
  for (var key in values) {
    if (key in this.uniforms) {
      var uniform = this.uniforms[key];
      var value = values[key];

      // todo add matrix uniform types
      switch (uniform.type) {
        case 'c': // color
          uniform.value.set(value);
          break;
        case 'v2': // vectors
        case 'v3':
        case 'v4':
          uniform.value.copy(value);
          break;
        case 'f': // float
        case 't': // texture
        default:
          uniform.value = value;
      }
    }
  }
};
