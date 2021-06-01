import {
  ShaderMaterial,
  UniformsUtils,
} from 'three';

class BaseAnimationMaterial extends ShaderMaterial {
  constructor (parameters, uniforms) {
    super();

    if (parameters.uniformValues) {
      console.warn('THREE.BAS - `uniformValues` is deprecated. Put their values directly into the parameters.')

      Object.keys(parameters.uniformValues).forEach((key) => {
        parameters[key] = parameters.uniformValues[key]
      })

      delete parameters.uniformValues
    }

    // copy parameters to (1) make use of internal #define generation
    // and (2) prevent 'x is not a property of this material' warnings.
    Object.keys(parameters).forEach((key) => {
      this[key] = parameters[key]
    })

    // override default parameter values
    this.setValues(parameters);

    // override uniforms
    this.uniforms = UniformsUtils.merge([uniforms, parameters.uniforms || {}]);

    // set uniform values from parameters that affect uniforms
    this.setUniformValues(parameters);
  }

  setUniformValues (values) {
    if (!values) return;

    const keys = Object.keys(values);

    keys.forEach((key) => {
      key in this.uniforms && (this.uniforms[key].value = values[key]);
    });
  }

  stringifyChunk (name) {
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
}

export default BaseAnimationMaterial;
