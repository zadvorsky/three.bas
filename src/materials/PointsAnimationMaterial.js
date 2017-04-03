/**
 * Extends THREE.PointsMaterial with custom shader chunks.
 *
 * @param {Object} parameters Object containing material properties and custom shader chunks.
 * @constructor
 */
THREE.BAS.PointsAnimationMaterial = function (parameters) {
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
  // use fragment shader to shape to point, reference: https://thebookofshaders.com/07/
  this.fragmentShape = [];

  var pointsShader = THREE.ShaderLib['points'];

  THREE.BAS.BaseAnimationMaterial.call(this, parameters, pointsShader.uniforms);

  this.vertexShader = this._concatVertexShader();
  this.fragmentShader = this._concatFragmentShader();
};

THREE.BAS.PointsAnimationMaterial.prototype = Object.create(THREE.BAS.BaseAnimationMaterial.prototype);
THREE.BAS.PointsAnimationMaterial.prototype.constructor = THREE.BAS.PointsAnimationMaterial;

THREE.BAS.PointsAnimationMaterial.prototype._concatVertexShader = function () {
  // based on THREE.ShaderLib.points
  return [
    `
    uniform float size;
    uniform float scale;
    #include <common>
    #include <color_pars_vertex>
    #include <shadowmap_pars_vertex>
    #include <logdepthbuf_pars_vertex>
    #include <clipping_planes_pars_vertex>
    `,
    this._stringifyChunk('vertexFunctions'),
    this._stringifyChunk('vertexParameters'),
    this._stringifyChunk('varyingParameters'),
    `void main() {
    `,
    this._stringifyChunk('vertexInit'),
    `
        #include <color_vertex>
        #include <begin_vertex>
    `,
    this._stringifyChunk('vertexPosition'),
    this._stringifyChunk('vertexColor'),
    `
        #include <project_vertex>
        #ifdef USE_SIZEATTENUATION
            gl_PointSize = size * ( scale / - mvPosition.z );
        #else
            gl_PointSize = size;
        #endif
        #include <logdepthbuf_vertex>
        #include <clipping_planes_vertex>
        #include <worldpos_vertex>
        #include <shadowmap_vertex>
    }
    `
  ].join("\n");
};

THREE.BAS.PointsAnimationMaterial.prototype._concatFragmentShader = function () {
  return [
    `
    uniform vec3 diffuse;
    uniform float opacity;
    `,
    this._stringifyChunk('fragmentFunctions'),
    this._stringifyChunk('fragmentParameters'),
    this._stringifyChunk('varyingParameters'),
    `
    #include <common>
    #include <packing>
    #include <color_pars_fragment>
    #include <map_particle_pars_fragment>
    #include <fog_pars_fragment>
    #include <shadowmap_pars_fragment>
    #include <logdepthbuf_pars_fragment>
    #include <clipping_planes_pars_fragment>
    void main() {
        #include <clipping_planes_fragment>
    `,
    this._stringifyChunk('fragmentInit'),
    `
        vec3 outgoingLight = vec3( 0.0 );
        vec4 diffuseColor = vec4( diffuse, opacity );
    `,
    this._stringifyChunk('fragmentDiffuse'),
    `
        #include <logdepthbuf_fragment>
    `,
    (this._stringifyChunk('fragmentMap') || '#include <map_fragment>'),
    `   #include <map_particle_fragment>
        #include <color_fragment>
        #include <alphatest_fragment>
        outgoingLight = diffuseColor.rgb;
        gl_FragColor = vec4( outgoingLight, diffuseColor.a );
    `,
    this._stringifyChunk('fragmentShape'),
    `
        #include <premultiplied_alpha_fragment>
        #include <tonemapping_fragment>
        #include <encodings_fragment>
        #include <fog_fragment>
    }
    `
  ].join("\n")
};
