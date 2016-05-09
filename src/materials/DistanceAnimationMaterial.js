THREE.BAS.DistanceAnimationMaterial = function (parameters) {
  this.depthPacking = THREE.RGBADepthPacking;
  this.clipping = true;

  this.vertexFunctions = [];
  this.vertexParameters = [];
  this.vertexInit = [];
  this.vertexPosition = [];

  THREE.BAS.BaseAnimationMaterial.call(this, parameters);

  var distanceShader = THREE.ShaderLib['distanceRGBA'];

  this.uniforms = THREE.UniformsUtils.merge([distanceShader.uniforms, this.uniforms]);
  this.vertexShader = this._concatVertexShader();
  this.fragmentShader = distanceShader.fragmentShader;
};
THREE.BAS.DistanceAnimationMaterial.prototype = Object.create(THREE.BAS.BaseAnimationMaterial.prototype);
THREE.BAS.DistanceAnimationMaterial.prototype.constructor = THREE.BAS.DistanceAnimationMaterial;

THREE.BAS.DistanceAnimationMaterial.prototype._concatVertexShader = function () {
  return [
    'varying vec4 vWorldPosition;',

    THREE.ShaderChunk["common"],
    THREE.ShaderChunk["morphtarget_pars_vertex"],
    THREE.ShaderChunk["skinning_pars_vertex"],
    THREE.ShaderChunk["clipping_planes_pars_vertex"],

    this._stringifyChunk('vertexFunctions'),
    this._stringifyChunk('vertexParameters'),

    'void main() {',

    this._stringifyChunk('vertexInit'),

    THREE.ShaderChunk["skinbase_vertex"],
    THREE.ShaderChunk["begin_vertex"],

    this._stringifyChunk('vertexPosition'),

    THREE.ShaderChunk["morphtarget_vertex"],
    THREE.ShaderChunk["skinning_vertex"],
    THREE.ShaderChunk["project_vertex"],
    THREE.ShaderChunk["worldpos_vertex"],
    THREE.ShaderChunk["clipping_planes_vertex"],

    'vWorldPosition = worldPosition;',

    '}'

  ].join('\n');
};
