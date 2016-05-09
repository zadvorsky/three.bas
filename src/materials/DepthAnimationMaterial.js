THREE.BAS.DepthAnimationMaterial = function (parameters) {

  this.depthPacking = THREE.RGBADepthPacking;
  this.clipping = true;

  this.vertexFunctions = [];
  this.vertexParameters = [];
  this.vertexInit = [];
  this.vertexPosition = [];

  THREE.BAS.BaseAnimationMaterial.call(this, parameters);

  var depthShader = THREE.ShaderLib['depth'];

  this.uniforms = THREE.UniformsUtils.merge([depthShader.uniforms, this.uniforms]);
  //this.vertexShader = depthShader.vertexShader;
  this.vertexShader = this._concatVertexShader();
  this.fragmentShader = depthShader.fragmentShader;
};
THREE.BAS.DepthAnimationMaterial.prototype = Object.create(THREE.BAS.BaseAnimationMaterial.prototype);
THREE.BAS.DepthAnimationMaterial.prototype.constructor = THREE.BAS.DepthAnimationMaterial;

THREE.BAS.DepthAnimationMaterial.prototype._concatVertexShader = function () {
  return [
    THREE.ShaderChunk["common"],
    THREE.ShaderChunk["uv_pars_vertex"],
    THREE.ShaderChunk["displacementmap_pars_vertex"],
    THREE.ShaderChunk["morphtarget_pars_vertex"],
    THREE.ShaderChunk["skinning_pars_vertex"],
    THREE.ShaderChunk["logdepthbuf_pars_vertex"],
    THREE.ShaderChunk["clipping_planes_pars_vertex"],

    this._stringifyChunk('vertexFunctions'),
    this._stringifyChunk('vertexParameters'),

    'void main() {',

    this._stringifyChunk('vertexInit'),

    THREE.ShaderChunk["uv_vertex"],
    THREE.ShaderChunk["skinbase_vertex"],

    THREE.ShaderChunk["begin_vertex"],

    this._stringifyChunk('vertexPosition'),


    THREE.ShaderChunk["displacementmap_vertex"],
    THREE.ShaderChunk["morphtarget_vertex"],
    THREE.ShaderChunk["skinning_vertex"],
    THREE.ShaderChunk["project_vertex"],
    THREE.ShaderChunk["logdepthbuf_vertex"],
    THREE.ShaderChunk["clipping_planes_vertex"],

    '}'

  ].join('\n');
};
