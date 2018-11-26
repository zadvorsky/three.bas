import { ShaderLib } from 'three';
import { PhongAnimationMaterial } from './PhongAnimationMaterial';

/**
 * Extends THREE.MeshToonMaterial with custom shader chunks. MeshToonMaterial is mostly the same as MeshPhongMaterial. The only difference is a TOON define, and support for a gradientMap uniform.
 *
 * @param {Object} parameters Object containing material properties and custom shader chunks.
 * @constructor
 */
function ToonAnimationMaterial(parameters) {
  if (!parameters.defines) {
    parameters.defines = {}
  }
  parameters.defines['TOON'] = ''

  PhongAnimationMaterial.call(this, parameters);
}
ToonAnimationMaterial.prototype = Object.create(PhongAnimationMaterial.prototype);
ToonAnimationMaterial.prototype.constructor = ToonAnimationMaterial;

export { ToonAnimationMaterial };
