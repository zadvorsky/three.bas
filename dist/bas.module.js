import { BufferAttribute, BufferGeometry, InstancedBufferAttribute, InstancedBufferGeometry, Math as Math$1, RGBADepthPacking, ShaderLib, ShaderMaterial, UniformsUtils, Vector3, Vector4 } from 'three';

function BaseAnimationMaterial(parameters, uniforms) {
  var _this = this;

  ShaderMaterial.call(this);

  if (parameters.uniformValues) {
    console.warn('THREE.BAS - `uniformValues` is deprecated. Put their values directly into the parameters.');

    Object.keys(parameters.uniformValues).forEach(function (key) {
      parameters[key] = parameters.uniformValues[key];
    });

    delete parameters.uniformValues;
  }

  // copy parameters to (1) make use of internal #define generation
  // and (2) prevent 'x is not a property of this material' warnings.
  Object.keys(parameters).forEach(function (key) {
    _this[key] = parameters[key];
  });

  // override default parameter values
  this.setValues(parameters);

  // override uniforms
  this.uniforms = UniformsUtils.merge([uniforms, parameters.uniforms || {}]);

  // set uniform values from parameters that affect uniforms
  this.setUniformValues(parameters);
}

BaseAnimationMaterial.prototype = Object.assign(Object.create(ShaderMaterial.prototype), {
  constructor: BaseAnimationMaterial,

  setUniformValues: function setUniformValues(values) {
    var _this2 = this;

    if (!values) return;

    var keys = Object.keys(values);

    keys.forEach(function (key) {
      key in _this2.uniforms && (_this2.uniforms[key].value = values[key]);
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

/**
 * Extends THREE.MeshBasicMaterial with custom shader chunks.
 *
 * @see http://three-bas-examples.surge.sh/examples/materials_basic/
 *
 * @param {Object} parameters Object containing material properties and custom shader chunks.
 * @constructor
 */
function BasicAnimationMaterial(parameters) {
  BaseAnimationMaterial.call(this, parameters, ShaderLib['basic'].uniforms);

  this.lights = false;
  this.vertexShader = this.concatVertexShader();
  this.fragmentShader = this.concatFragmentShader();
}
BasicAnimationMaterial.prototype = Object.create(BaseAnimationMaterial.prototype);
BasicAnimationMaterial.prototype.constructor = BasicAnimationMaterial;

BasicAnimationMaterial.prototype.concatVertexShader = function () {
  return ShaderLib.basic.vertexShader.replace('void main() {', '\n      ' + this.stringifyChunk('vertexParameters') + '\n      ' + this.stringifyChunk('varyingParameters') + '\n      ' + this.stringifyChunk('vertexFunctions') + '\n\n      void main() {\n        ' + this.stringifyChunk('vertexInit') + '\n      ').replace('#include <beginnormal_vertex>', '\n      #include <beginnormal_vertex>\n      ' + this.stringifyChunk('vertexNormal') + '\n      ').replace('#include <begin_vertex>', '\n      #include <begin_vertex>\n      ' + this.stringifyChunk('vertexPosition') + '\n      ' + this.stringifyChunk('vertexColor') + '\n      ').replace('#include <morphtarget_vertex>', '\n      #include <morphtarget_vertex>\n      ' + this.stringifyChunk('vertexPostMorph') + '\n      ').replace('#include <skinning_vertex>', '\n      #include <skinning_vertex>\n      ' + this.stringifyChunk('vertexPostSkinning') + '\n      ');
};

BasicAnimationMaterial.prototype.concatFragmentShader = function () {
  return ShaderLib.basic.fragmentShader.replace('void main() {', '\n      ' + this.stringifyChunk('fragmentParameters') + '\n      ' + this.stringifyChunk('varyingParameters') + '\n      ' + this.stringifyChunk('fragmentFunctions') + '\n\n      void main() {\n        ' + this.stringifyChunk('fragmentInit') + '\n      ').replace('#include <map_fragment>', '\n      ' + this.stringifyChunk('fragmentDiffuse') + '\n      ' + (this.stringifyChunk('fragmentMap') || '#include <map_fragment>') + '\n\n      ');
};

function LambertAnimationMaterial(parameters) {
  BaseAnimationMaterial.call(this, parameters, ShaderLib['lambert'].uniforms);

  this.lights = true;
  this.vertexShader = this.concatVertexShader();
  this.fragmentShader = this.concatFragmentShader();
}
LambertAnimationMaterial.prototype = Object.create(BaseAnimationMaterial.prototype);
LambertAnimationMaterial.prototype.constructor = LambertAnimationMaterial;

LambertAnimationMaterial.prototype.concatVertexShader = function () {
  return ShaderLib.lambert.vertexShader.replace('void main() {', '\n      ' + this.stringifyChunk('vertexParameters') + '\n      ' + this.stringifyChunk('varyingParameters') + '\n      ' + this.stringifyChunk('vertexFunctions') + '\n\n      void main() {\n        ' + this.stringifyChunk('vertexInit') + '\n      ').replace('#include <beginnormal_vertex>', '\n      #include <beginnormal_vertex>\n\n      ' + this.stringifyChunk('vertexNormal') + '\n      ').replace('#include <begin_vertex>', '\n      #include <begin_vertex>\n\n      ' + this.stringifyChunk('vertexPosition') + '\n      ' + this.stringifyChunk('vertexColor') + '\n      ').replace('#include <morphtarget_vertex>', '\n      #include <morphtarget_vertex>\n\n      ' + this.stringifyChunk('vertexPostMorph') + '\n      ').replace('#include <skinning_vertex>', '\n      #include <skinning_vertex>\n\n      ' + this.stringifyChunk('vertexPostSkinning') + '\n      ');
};

LambertAnimationMaterial.prototype.concatFragmentShader = function () {
  return ShaderLib.lambert.fragmentShader.replace('void main() {', '\n      ' + this.stringifyChunk('fragmentParameters') + '\n      ' + this.stringifyChunk('varyingParameters') + '\n      ' + this.stringifyChunk('fragmentFunctions') + '\n\n      void main() {\n        ' + this.stringifyChunk('fragmentInit') + '\n      ').replace('#include <map_fragment>', '\n      ' + this.stringifyChunk('fragmentDiffuse') + '\n      ' + (this.stringifyChunk('fragmentMap') || '#include <map_fragment>') + '\n\n      ').replace('#include <emissivemap_fragment>', '\n      ' + this.stringifyChunk('fragmentEmissive') + '\n\n      #include <emissivemap_fragment>\n      ');
  return '\n  uniform vec3 diffuse;\n  uniform vec3 emissive;\n  uniform float opacity;\n\n  varying vec3 vLightFront;\n  varying vec3 vIndirectFront;\n\n  #ifdef DOUBLE_SIDED\n    varying vec3 vLightBack;\n    varying vec3 vIndirectBack;\n  #endif\n\n  #include <common>\n  #include <packing>\n  #include <dithering_pars_fragment>\n  #include <color_pars_fragment>\n  #include <uv_pars_fragment>\n  #include <uv2_pars_fragment>\n  #include <map_pars_fragment>\n  #include <alphamap_pars_fragment>\n  #include <aomap_pars_fragment>\n  #include <lightmap_pars_fragment>\n  #include <emissivemap_pars_fragment>\n  #include <envmap_common_pars_fragment>\n  #include <envmap_pars_fragment>\n  #include <cube_uv_reflection_fragment>\n  #include <bsdfs>\n  #include <lights_pars_begin>\n  #include <fog_pars_fragment>\n  #include <shadowmap_pars_fragment>\n  #include <shadowmask_pars_fragment>\n  #include <specularmap_pars_fragment>\n  #include <logdepthbuf_pars_fragment>\n  #include <clipping_planes_pars_fragment>\n\n  ' + this.stringifyChunk('fragmentParameters') + '\n  ' + this.stringifyChunk('varyingParameters') + '\n  ' + this.stringifyChunk('fragmentFunctions') + '\n\n  void main() {\n\n    ' + this.stringifyChunk('fragmentInit') + '\n\n    #include <clipping_planes_fragment>\n\n    vec4 diffuseColor = vec4( diffuse, opacity );\n    ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );\n    vec3 totalEmissiveRadiance = emissive;\n\n    #include <logdepthbuf_fragment>\n\n    ' + this.stringifyChunk('fragmentDiffuse') + '\n    ' + (this.stringifyChunk('fragmentMap') || '#include <map_fragment>') + '\n\n    #include <color_fragment>\n    #include <alphamap_fragment>\n    #include <alphatest_fragment>\n    #include <specularmap_fragment>\n\n    ' + this.stringifyChunk('fragmentEmissive') + '\n\n    #include <emissivemap_fragment>\n\n    // accumulation\n    reflectedLight.indirectDiffuse = getAmbientLightIrradiance( ambientLightColor );\n\n    #ifdef DOUBLE_SIDED\n      reflectedLight.indirectDiffuse += ( gl_FrontFacing ) ? vIndirectFront : vIndirectBack;\n    #else\n      reflectedLight.indirectDiffuse += vIndirectFront;\n    #endif\n\n    #include <lightmap_fragment>\n\n    reflectedLight.indirectDiffuse *= BRDF_Diffuse_Lambert( diffuseColor.rgb );\n\n    #ifdef DOUBLE_SIDED\n      reflectedLight.directDiffuse = ( gl_FrontFacing ) ? vLightFront : vLightBack;\n    #else\n      reflectedLight.directDiffuse = vLightFront;\n    #endif\n\n    reflectedLight.directDiffuse *= BRDF_Diffuse_Lambert( diffuseColor.rgb ) * getShadowMask();\n    // modulation\n    #include <aomap_fragment>\n\n    vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;\n\n    #include <envmap_fragment>\n\n    gl_FragColor = vec4( outgoingLight, diffuseColor.a );\n\n    #include <tonemapping_fragment>\n    #include <encodings_fragment>\n    #include <fog_fragment>\n    #include <premultiplied_alpha_fragment>\n    #include <dithering_fragment>\n  }';
};

function PhongAnimationMaterial(parameters) {
  BaseAnimationMaterial.call(this, parameters, ShaderLib['phong'].uniforms);

  this.lights = true;
  this.vertexShader = this.concatVertexShader();
  this.fragmentShader = this.concatFragmentShader();
}
PhongAnimationMaterial.prototype = Object.create(BaseAnimationMaterial.prototype);
PhongAnimationMaterial.prototype.constructor = PhongAnimationMaterial;

PhongAnimationMaterial.prototype.concatVertexShader = function () {
  return ShaderLib.phong.vertexShader.replace('void main() {', '\n      ' + this.stringifyChunk('vertexParameters') + '\n      ' + this.stringifyChunk('varyingParameters') + '\n      ' + this.stringifyChunk('vertexFunctions') + '\n\n      void main() {\n        ' + this.stringifyChunk('vertexInit') + '\n      ').replace('#include <beginnormal_vertex>', '\n      #include <beginnormal_vertex>\n\n      ' + this.stringifyChunk('vertexNormal') + '\n      ').replace('#include <begin_vertex>', '\n      #include <begin_vertex>\n\n      ' + this.stringifyChunk('vertexPosition') + '\n      ' + this.stringifyChunk('vertexColor') + '\n      ').replace('#include <morphtarget_vertex>', '\n      #include <morphtarget_vertex>\n\n      ' + this.stringifyChunk('vertexPostMorph') + '\n      ').replace('#include <skinning_vertex>', '\n      #include <skinning_vertex>\n\n      ' + this.stringifyChunk('vertexPostSkinning') + '\n      ');
};

PhongAnimationMaterial.prototype.concatFragmentShader = function () {
  return ShaderLib.phong.fragmentShader.replace('void main() {', '\n      ' + this.stringifyChunk('fragmentParameters') + '\n      ' + this.stringifyChunk('varyingParameters') + '\n      ' + this.stringifyChunk('fragmentFunctions') + '\n\n      void main() {\n        ' + this.stringifyChunk('fragmentInit') + '\n      ').replace('#include <map_fragment>', '\n      ' + this.stringifyChunk('fragmentDiffuse') + '\n      ' + (this.stringifyChunk('fragmentMap') || '#include <map_fragment>') + '\n\n      ').replace('#include <emissivemap_fragment>', '\n      ' + this.stringifyChunk('fragmentEmissive') + '\n\n      #include <emissivemap_fragment>\n      ').replace('#include <lights_phong_fragment>', '\n      #include <lights_phong_fragment>\n      ' + this.stringifyChunk('fragmentSpecular') + '\n      ');
};

function StandardAnimationMaterial(parameters) {
  BaseAnimationMaterial.call(this, parameters, ShaderLib['physical'].uniforms);

  this.lights = true;
  this.extensions = this.extensions || {};
  this.extensions.derivatives = true;
  this.vertexShader = this.concatVertexShader();
  this.fragmentShader = this.concatFragmentShader();
}
StandardAnimationMaterial.prototype = Object.create(BaseAnimationMaterial.prototype);
StandardAnimationMaterial.prototype.constructor = StandardAnimationMaterial;

StandardAnimationMaterial.prototype.concatVertexShader = function () {
  return ShaderLib.standard.vertexShader.replace('void main() {', '\n      ' + this.stringifyChunk('vertexParameters') + '\n      ' + this.stringifyChunk('varyingParameters') + '\n      ' + this.stringifyChunk('vertexFunctions') + '\n\n      void main() {\n        ' + this.stringifyChunk('vertexInit') + '\n      ').replace('#include <beginnormal_vertex>', '\n      #include <beginnormal_vertex>\n\n      ' + this.stringifyChunk('vertexNormal') + '\n      ').replace('#include <begin_vertex>', '\n      #include <begin_vertex>\n\n      ' + this.stringifyChunk('vertexPosition') + '\n      ' + this.stringifyChunk('vertexColor') + '\n      ').replace('#include <morphtarget_vertex>', '\n      #include <morphtarget_vertex>\n\n      ' + this.stringifyChunk('vertexPostMorph') + '\n      ').replace('#include <skinning_vertex>', '\n      #include <skinning_vertex>\n\n      ' + this.stringifyChunk('vertexPostSkinning') + '\n      ');
};

StandardAnimationMaterial.prototype.concatFragmentShader = function () {
  return ShaderLib.standard.fragmentShader.replace('void main() {', '\n      ' + this.stringifyChunk('fragmentParameters') + '\n      ' + this.stringifyChunk('varyingParameters') + '\n      ' + this.stringifyChunk('fragmentFunctions') + '\n\n      void main() {\n        ' + this.stringifyChunk('fragmentInit') + '\n      ').replace('#include <map_fragment>', '\n      ' + this.stringifyChunk('fragmentDiffuse') + '\n      ' + (this.stringifyChunk('fragmentMap') || '#include <map_fragment>') + '\n\n      ').replace('#include <emissivemap_fragment>', '\n      ' + this.stringifyChunk('fragmentEmissive') + '\n\n      #include <emissivemap_fragment>\n      ').replace('#include <roughnessmap_fragment>', '\n      float roughnessFactor = roughness;\n      ' + this.stringifyChunk('fragmentRoughness') + '\n      #ifdef USE_ROUGHNESSMAP\n\n      vec4 texelRoughness = texture2D( roughnessMap, vUv );\n        roughnessFactor *= texelRoughness.g;\n      #endif\n      ').replace('#include <metalnessmap_fragment>', '\n      float metalnessFactor = metalness;\n      ' + this.stringifyChunk('fragmentMetalness') + '\n\n      #ifdef USE_METALNESSMAP\n        vec4 texelMetalness = texture2D( metalnessMap, vUv );\n        metalnessFactor *= texelMetalness.b;\n      #endif\n      ');
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
  BaseAnimationMaterial.call(this, parameters, ShaderLib['points'].uniforms);

  this.vertexShader = this.concatVertexShader();
  this.fragmentShader = this.concatFragmentShader();
}

PointsAnimationMaterial.prototype = Object.create(BaseAnimationMaterial.prototype);
PointsAnimationMaterial.prototype.constructor = PointsAnimationMaterial;

PointsAnimationMaterial.prototype.concatVertexShader = function () {
  return ShaderLib.points.vertexShader.replace('void main() {', '\n      ' + this.stringifyChunk('vertexParameters') + '\n      ' + this.stringifyChunk('varyingParameters') + '\n      ' + this.stringifyChunk('vertexFunctions') + '\n\n      void main() {\n        ' + this.stringifyChunk('vertexInit') + '\n      ').replace('#include <begin_vertex>', '\n      #include <begin_vertex>\n\n      ' + this.stringifyChunk('vertexPosition') + '\n      ' + this.stringifyChunk('vertexColor') + '\n      ').replace('#include <morphtarget_vertex>', '\n      #include <morphtarget_vertex>\n\n      ' + this.stringifyChunk('vertexPostMorph') + '\n      ');
};

PointsAnimationMaterial.prototype.concatFragmentShader = function () {
  return ShaderLib.points.fragmentShader.replace('void main() {', '\n      ' + this.stringifyChunk('fragmentParameters') + '\n      ' + this.stringifyChunk('varyingParameters') + '\n      ' + this.stringifyChunk('fragmentFunctions') + '\n\n      void main() {\n        ' + this.stringifyChunk('fragmentInit') + '\n      ').replace('#include <map_fragment>', '\n      ' + this.stringifyChunk('fragmentDiffuse') + '\n      ' + (this.stringifyChunk('fragmentMap') || '#include <map_fragment>') + '\n\n      ').replace('#include <premultiplied_alpha_fragment>', '\n      ' + this.stringifyChunk('fragmentShape') + '\n\n      #include <premultiplied_alpha_fragment>\n      ');
};

function DepthAnimationMaterial(parameters) {
  this.depthPacking = RGBADepthPacking;
  this.clipping = true;

  BaseAnimationMaterial.call(this, parameters, ShaderLib['depth'].uniforms);

  this.vertexShader = this.concatVertexShader();
  this.fragmentShader = ShaderLib['depth'].fragmentShader;
}
DepthAnimationMaterial.prototype = Object.create(BaseAnimationMaterial.prototype);
DepthAnimationMaterial.prototype.constructor = DepthAnimationMaterial;

DepthAnimationMaterial.prototype.concatVertexShader = function () {
  return ShaderLib.depth.vertexShader.replace('void main() {', '\n      ' + this.stringifyChunk('vertexParameters') + '\n      ' + this.stringifyChunk('vertexFunctions') + '\n\n      void main() {\n        ' + this.stringifyChunk('vertexInit') + '\n      ').replace('#include <begin_vertex>', '\n      #include <begin_vertex>\n\n      ' + this.stringifyChunk('vertexPosition') + '\n      ').replace('#include <morphtarget_vertex>', '\n      #include <morphtarget_vertex>\n\n      ' + this.stringifyChunk('vertexPostMorph') + '\n      ').replace('#include <skinning_vertex>', '\n      #include <skinning_vertex>\n\n      ' + this.stringifyChunk('vertexPostSkinning') + '\n      ');
};

function DistanceAnimationMaterial(parameters) {
  this.depthPacking = RGBADepthPacking;
  this.clipping = true;

  BaseAnimationMaterial.call(this, parameters, ShaderLib['distanceRGBA'].uniforms);

  this.vertexShader = this.concatVertexShader();
  this.fragmentShader = ShaderLib['distanceRGBA'].fragmentShader;
}
DistanceAnimationMaterial.prototype = Object.create(BaseAnimationMaterial.prototype);
DistanceAnimationMaterial.prototype.constructor = DistanceAnimationMaterial;

DistanceAnimationMaterial.prototype.concatVertexShader = function () {
  return ShaderLib.distanceRGBA.vertexShader.replace('void main() {', '\n    ' + this.stringifyChunk('vertexParameters') + '\n    ' + this.stringifyChunk('vertexFunctions') + '\n\n    void main() {\n      ' + this.stringifyChunk('vertexInit') + '\n    ').replace('#include <begin_vertex>', '\n    #include <begin_vertex>\n\n    ' + this.stringifyChunk('vertexPosition') + '\n    ').replace('#include <morphtarget_vertex>', '\n    #include <morphtarget_vertex>\n\n    ' + this.stringifyChunk('vertexPostMorph') + '\n    ').replace('#include <skinning_vertex>', '\n    #include <skinning_vertex>\n\n    ' + this.stringifyChunk('vertexPostSkinning') + '\n    ');
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

  this.setAttribute(name, attribute);

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

  this.setAttribute(name, attribute);

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

  this.setAttribute(name, attribute);

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

  this.setAttribute(name, attribute);

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

  this.setAttribute(name, attribute);

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzLm1vZHVsZS5qcyIsInNvdXJjZXMiOlsiLi4vc3JjL21hdGVyaWFscy9CYXNlQW5pbWF0aW9uTWF0ZXJpYWwuanMiLCIuLi9zcmMvbWF0ZXJpYWxzL0Jhc2ljQW5pbWF0aW9uTWF0ZXJpYWwuanMiLCIuLi9zcmMvbWF0ZXJpYWxzL0xhbWJlcnRBbmltYXRpb25NYXRlcmlhbC5qcyIsIi4uL3NyYy9tYXRlcmlhbHMvUGhvbmdBbmltYXRpb25NYXRlcmlhbC5qcyIsIi4uL3NyYy9tYXRlcmlhbHMvU3RhbmRhcmRBbmltYXRpb25NYXRlcmlhbC5qcyIsIi4uL3NyYy9tYXRlcmlhbHMvVG9vbkFuaW1hdGlvbk1hdGVyaWFsLmpzIiwiLi4vc3JjL21hdGVyaWFscy9Qb2ludHNBbmltYXRpb25NYXRlcmlhbC5qcyIsIi4uL3NyYy9tYXRlcmlhbHMvRGVwdGhBbmltYXRpb25NYXRlcmlhbC5qcyIsIi4uL3NyYy9tYXRlcmlhbHMvRGlzdGFuY2VBbmltYXRpb25NYXRlcmlhbC5qcyIsIi4uL3NyYy9nZW9tZXRyeS9QcmVmYWJCdWZmZXJHZW9tZXRyeS5qcyIsIi4uL3NyYy9nZW9tZXRyeS9NdWx0aVByZWZhYkJ1ZmZlckdlb21ldHJ5LmpzIiwiLi4vc3JjL2dlb21ldHJ5L0luc3RhbmNlZFByZWZhYkJ1ZmZlckdlb21ldHJ5LmpzIiwiLi4vc3JjL1V0aWxzLmpzIiwiLi4vc3JjL2dlb21ldHJ5L01vZGVsQnVmZmVyR2VvbWV0cnkuanMiLCIuLi9zcmMvZ2VvbWV0cnkvUG9pbnRCdWZmZXJHZW9tZXRyeS5qcyIsIi4uL3NyYy9TaGFkZXJDaHVuay5qcyIsIi4uL3NyYy90aW1lbGluZS9UaW1lbGluZVNlZ21lbnQuanMiLCIuLi9zcmMvdGltZWxpbmUvVGltZWxpbmUuanMiLCIuLi9zcmMvdGltZWxpbmUvVGltZWxpbmVDaHVua3MuanMiLCIuLi9zcmMvdGltZWxpbmUvVHJhbnNsYXRpb25TZWdtZW50LmpzIiwiLi4vc3JjL3RpbWVsaW5lL1NjYWxlU2VnbWVudC5qcyIsIi4uL3NyYy90aW1lbGluZS9Sb3RhdGlvblNlZ21lbnQuanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgTWF0ZXJpYWwsXG4gIFNoYWRlck1hdGVyaWFsLFxuICBVbmlmb3Jtc1V0aWxzLFxufSBmcm9tICd0aHJlZSc7XG5cbmZ1bmN0aW9uIEJhc2VBbmltYXRpb25NYXRlcmlhbChwYXJhbWV0ZXJzLCB1bmlmb3Jtcykge1xuICBTaGFkZXJNYXRlcmlhbC5jYWxsKHRoaXMpO1xuXG4gIGlmIChwYXJhbWV0ZXJzLnVuaWZvcm1WYWx1ZXMpIHtcbiAgICBjb25zb2xlLndhcm4oJ1RIUkVFLkJBUyAtIGB1bmlmb3JtVmFsdWVzYCBpcyBkZXByZWNhdGVkLiBQdXQgdGhlaXIgdmFsdWVzIGRpcmVjdGx5IGludG8gdGhlIHBhcmFtZXRlcnMuJylcblxuICAgIE9iamVjdC5rZXlzKHBhcmFtZXRlcnMudW5pZm9ybVZhbHVlcykuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgICBwYXJhbWV0ZXJzW2tleV0gPSBwYXJhbWV0ZXJzLnVuaWZvcm1WYWx1ZXNba2V5XVxuICAgIH0pXG5cbiAgICBkZWxldGUgcGFyYW1ldGVycy51bmlmb3JtVmFsdWVzXG4gIH1cblxuICAvLyBjb3B5IHBhcmFtZXRlcnMgdG8gKDEpIG1ha2UgdXNlIG9mIGludGVybmFsICNkZWZpbmUgZ2VuZXJhdGlvblxuICAvLyBhbmQgKDIpIHByZXZlbnQgJ3ggaXMgbm90IGEgcHJvcGVydHkgb2YgdGhpcyBtYXRlcmlhbCcgd2FybmluZ3MuXG4gIE9iamVjdC5rZXlzKHBhcmFtZXRlcnMpLmZvckVhY2goKGtleSkgPT4ge1xuICAgIHRoaXNba2V5XSA9IHBhcmFtZXRlcnNba2V5XVxuICB9KVxuXG4gIC8vIG92ZXJyaWRlIGRlZmF1bHQgcGFyYW1ldGVyIHZhbHVlc1xuICB0aGlzLnNldFZhbHVlcyhwYXJhbWV0ZXJzKTtcblxuICAvLyBvdmVycmlkZSB1bmlmb3Jtc1xuICB0aGlzLnVuaWZvcm1zID0gVW5pZm9ybXNVdGlscy5tZXJnZShbdW5pZm9ybXMsIHBhcmFtZXRlcnMudW5pZm9ybXMgfHwge31dKTtcblxuICAvLyBzZXQgdW5pZm9ybSB2YWx1ZXMgZnJvbSBwYXJhbWV0ZXJzIHRoYXQgYWZmZWN0IHVuaWZvcm1zXG4gIHRoaXMuc2V0VW5pZm9ybVZhbHVlcyhwYXJhbWV0ZXJzKTtcbn1cblxuQmFzZUFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZSA9IE9iamVjdC5hc3NpZ24oT2JqZWN0LmNyZWF0ZShTaGFkZXJNYXRlcmlhbC5wcm90b3R5cGUpLCB7XG4gIGNvbnN0cnVjdG9yOiBCYXNlQW5pbWF0aW9uTWF0ZXJpYWwsXG5cbiAgc2V0VW5pZm9ybVZhbHVlcyh2YWx1ZXMpIHtcbiAgICBpZiAoIXZhbHVlcykgcmV0dXJuO1xuXG4gICAgY29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKHZhbHVlcyk7XG5cbiAgICBrZXlzLmZvckVhY2goKGtleSkgPT4ge1xuICAgICAga2V5IGluIHRoaXMudW5pZm9ybXMgJiYgKHRoaXMudW5pZm9ybXNba2V5XS52YWx1ZSA9IHZhbHVlc1trZXldKTtcbiAgICB9KTtcbiAgfSxcblxuICBzdHJpbmdpZnlDaHVuayhuYW1lKSB7XG4gICAgbGV0IHZhbHVlO1xuXG4gICAgaWYgKCF0aGlzW25hbWVdKSB7XG4gICAgICB2YWx1ZSA9ICcnO1xuICAgIH1cbiAgICBlbHNlIGlmICh0eXBlb2YgdGhpc1tuYW1lXSA9PT0gICdzdHJpbmcnKSB7XG4gICAgICB2YWx1ZSA9IHRoaXNbbmFtZV07XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgdmFsdWUgPSB0aGlzW25hbWVdLmpvaW4oJ1xcbicpO1xuICAgIH1cblxuICAgIHJldHVybiB2YWx1ZTtcbiAgfSxcblxufSk7XG5cbmV4cG9ydCBkZWZhdWx0IEJhc2VBbmltYXRpb25NYXRlcmlhbDtcbiIsImltcG9ydCB7IFNoYWRlckxpYiB9IGZyb20gJ3RocmVlJztcbmltcG9ydCBCYXNlQW5pbWF0aW9uTWF0ZXJpYWwgZnJvbSAnLi9CYXNlQW5pbWF0aW9uTWF0ZXJpYWwnO1xuXG4vKipcbiAqIEV4dGVuZHMgVEhSRUUuTWVzaEJhc2ljTWF0ZXJpYWwgd2l0aCBjdXN0b20gc2hhZGVyIGNodW5rcy5cbiAqXG4gKiBAc2VlIGh0dHA6Ly90aHJlZS1iYXMtZXhhbXBsZXMuc3VyZ2Uuc2gvZXhhbXBsZXMvbWF0ZXJpYWxzX2Jhc2ljL1xuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBwYXJhbWV0ZXJzIE9iamVjdCBjb250YWluaW5nIG1hdGVyaWFsIHByb3BlcnRpZXMgYW5kIGN1c3RvbSBzaGFkZXIgY2h1bmtzLlxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIEJhc2ljQW5pbWF0aW9uTWF0ZXJpYWwocGFyYW1ldGVycykge1xuICBCYXNlQW5pbWF0aW9uTWF0ZXJpYWwuY2FsbCh0aGlzLCBwYXJhbWV0ZXJzLCBTaGFkZXJMaWJbJ2Jhc2ljJ10udW5pZm9ybXMpO1xuXG4gIHRoaXMubGlnaHRzID0gZmFsc2U7XG4gIHRoaXMudmVydGV4U2hhZGVyID0gdGhpcy5jb25jYXRWZXJ0ZXhTaGFkZXIoKTtcbiAgdGhpcy5mcmFnbWVudFNoYWRlciA9IHRoaXMuY29uY2F0RnJhZ21lbnRTaGFkZXIoKTtcbn1cbkJhc2ljQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShCYXNlQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlKTtcbkJhc2ljQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gQmFzaWNBbmltYXRpb25NYXRlcmlhbDtcblxuQmFzaWNBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uY2F0VmVydGV4U2hhZGVyID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBTaGFkZXJMaWIuYmFzaWMudmVydGV4U2hhZGVyXG4gICAgLnJlcGxhY2UoXG4gICAgICAndm9pZCBtYWluKCkgeycsXG4gICAgICBgXG4gICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBhcmFtZXRlcnMnKX1cbiAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmFyeWluZ1BhcmFtZXRlcnMnKX1cbiAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4RnVuY3Rpb25zJyl9XG5cbiAgICAgIHZvaWQgbWFpbigpIHtcbiAgICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhJbml0Jyl9XG4gICAgICBgXG4gICAgKVxuICAgIC5yZXBsYWNlKFxuICAgICAgJyNpbmNsdWRlIDxiZWdpbm5vcm1hbF92ZXJ0ZXg+JyxcbiAgICAgIGBcbiAgICAgICNpbmNsdWRlIDxiZWdpbm5vcm1hbF92ZXJ0ZXg+XG4gICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleE5vcm1hbCcpfVxuICAgICAgYFxuICAgIClcbiAgICAucmVwbGFjZShcbiAgICAgICcjaW5jbHVkZSA8YmVnaW5fdmVydGV4PicsXG4gICAgICBgXG4gICAgICAjaW5jbHVkZSA8YmVnaW5fdmVydGV4PlxuICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQb3NpdGlvbicpfVxuICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhDb2xvcicpfVxuICAgICAgYFxuICAgIClcbiAgICAucmVwbGFjZShcbiAgICAgICcjaW5jbHVkZSA8bW9ycGh0YXJnZXRfdmVydGV4PicsXG4gICAgICBgXG4gICAgICAjaW5jbHVkZSA8bW9ycGh0YXJnZXRfdmVydGV4PlxuICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQb3N0TW9ycGgnKX1cbiAgICAgIGBcbiAgICApXG4gICAgLnJlcGxhY2UoXG4gICAgICAnI2luY2x1ZGUgPHNraW5uaW5nX3ZlcnRleD4nLFxuICAgICAgYFxuICAgICAgI2luY2x1ZGUgPHNraW5uaW5nX3ZlcnRleD5cbiAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UG9zdFNraW5uaW5nJyl9XG4gICAgICBgXG4gICAgKVxufTtcblxuQmFzaWNBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uY2F0RnJhZ21lbnRTaGFkZXIgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIFNoYWRlckxpYi5iYXNpYy5mcmFnbWVudFNoYWRlclxuICAgIC5yZXBsYWNlKFxuICAgICAgJ3ZvaWQgbWFpbigpIHsnLFxuICAgICAgYFxuICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudFBhcmFtZXRlcnMnKX1cbiAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmFyeWluZ1BhcmFtZXRlcnMnKX1cbiAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRGdW5jdGlvbnMnKX1cblxuICAgICAgdm9pZCBtYWluKCkge1xuICAgICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50SW5pdCcpfVxuICAgICAgYFxuICAgIClcbiAgICAucmVwbGFjZShcbiAgICAgICcjaW5jbHVkZSA8bWFwX2ZyYWdtZW50PicsXG4gICAgICBgXG4gICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50RGlmZnVzZScpfVxuICAgICAgJHsodGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRNYXAnKSB8fCAnI2luY2x1ZGUgPG1hcF9mcmFnbWVudD4nKX1cblxuICAgICAgYFxuICAgIClcbn07XG5cbmV4cG9ydCB7IEJhc2ljQW5pbWF0aW9uTWF0ZXJpYWwgfTtcbiIsImltcG9ydCB7IFNoYWRlckxpYiB9IGZyb20gJ3RocmVlJztcbmltcG9ydCBCYXNlQW5pbWF0aW9uTWF0ZXJpYWwgZnJvbSAnLi9CYXNlQW5pbWF0aW9uTWF0ZXJpYWwnO1xuXG4vKipcbiAqIEV4dGVuZHMgVEhSRUUuTWVzaExhbWJlcnRNYXRlcmlhbCB3aXRoIGN1c3RvbSBzaGFkZXIgY2h1bmtzLlxuICpcbiAqIEBzZWUgaHR0cDovL3RocmVlLWJhcy1leGFtcGxlcy5zdXJnZS5zaC9leGFtcGxlcy9tYXRlcmlhbHNfbGFtYmVydC9cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gcGFyYW1ldGVycyBPYmplY3QgY29udGFpbmluZyBtYXRlcmlhbCBwcm9wZXJ0aWVzIGFuZCBjdXN0b20gc2hhZGVyIGNodW5rcy5cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBMYW1iZXJ0QW5pbWF0aW9uTWF0ZXJpYWwocGFyYW1ldGVycykge1xuICBCYXNlQW5pbWF0aW9uTWF0ZXJpYWwuY2FsbCh0aGlzLCBwYXJhbWV0ZXJzLCBTaGFkZXJMaWJbJ2xhbWJlcnQnXS51bmlmb3Jtcyk7XG5cbiAgdGhpcy5saWdodHMgPSB0cnVlO1xuICB0aGlzLnZlcnRleFNoYWRlciA9IHRoaXMuY29uY2F0VmVydGV4U2hhZGVyKCk7XG4gIHRoaXMuZnJhZ21lbnRTaGFkZXIgPSB0aGlzLmNvbmNhdEZyYWdtZW50U2hhZGVyKCk7XG59XG5MYW1iZXJ0QW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShCYXNlQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlKTtcbkxhbWJlcnRBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBMYW1iZXJ0QW5pbWF0aW9uTWF0ZXJpYWw7XG5cbkxhbWJlcnRBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uY2F0VmVydGV4U2hhZGVyID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gU2hhZGVyTGliLmxhbWJlcnQudmVydGV4U2hhZGVyXG4gICAgLnJlcGxhY2UoXG4gICAgICAndm9pZCBtYWluKCkgeycsXG4gICAgICBgXG4gICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBhcmFtZXRlcnMnKX1cbiAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmFyeWluZ1BhcmFtZXRlcnMnKX1cbiAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4RnVuY3Rpb25zJyl9XG5cbiAgICAgIHZvaWQgbWFpbigpIHtcbiAgICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhJbml0Jyl9XG4gICAgICBgXG4gICAgKVxuICAgIC5yZXBsYWNlKFxuICAgICAgJyNpbmNsdWRlIDxiZWdpbm5vcm1hbF92ZXJ0ZXg+JyxcbiAgICAgIGBcbiAgICAgICNpbmNsdWRlIDxiZWdpbm5vcm1hbF92ZXJ0ZXg+XG5cbiAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4Tm9ybWFsJyl9XG4gICAgICBgXG4gICAgKVxuICAgIC5yZXBsYWNlKFxuICAgICAgJyNpbmNsdWRlIDxiZWdpbl92ZXJ0ZXg+JyxcbiAgICAgIGBcbiAgICAgICNpbmNsdWRlIDxiZWdpbl92ZXJ0ZXg+XG5cbiAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UG9zaXRpb24nKX1cbiAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4Q29sb3InKX1cbiAgICAgIGBcbiAgICApXG4gICAgLnJlcGxhY2UoXG4gICAgICAnI2luY2x1ZGUgPG1vcnBodGFyZ2V0X3ZlcnRleD4nLFxuICAgICAgYFxuICAgICAgI2luY2x1ZGUgPG1vcnBodGFyZ2V0X3ZlcnRleD5cblxuICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQb3N0TW9ycGgnKX1cbiAgICAgIGBcbiAgICApXG4gICAgLnJlcGxhY2UoXG4gICAgICAnI2luY2x1ZGUgPHNraW5uaW5nX3ZlcnRleD4nLFxuICAgICAgYFxuICAgICAgI2luY2x1ZGUgPHNraW5uaW5nX3ZlcnRleD5cblxuICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQb3N0U2tpbm5pbmcnKX1cbiAgICAgIGBcbiAgICApXG59O1xuXG5MYW1iZXJ0QW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlLmNvbmNhdEZyYWdtZW50U2hhZGVyID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gU2hhZGVyTGliLmxhbWJlcnQuZnJhZ21lbnRTaGFkZXJcbiAgICAucmVwbGFjZShcbiAgICAgICd2b2lkIG1haW4oKSB7JyxcbiAgICAgIGBcbiAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRQYXJhbWV0ZXJzJyl9XG4gICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZhcnlpbmdQYXJhbWV0ZXJzJyl9XG4gICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50RnVuY3Rpb25zJyl9XG5cbiAgICAgIHZvaWQgbWFpbigpIHtcbiAgICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudEluaXQnKX1cbiAgICAgIGBcbiAgICApXG4gICAgLnJlcGxhY2UoXG4gICAgICAnI2luY2x1ZGUgPG1hcF9mcmFnbWVudD4nLFxuICAgICAgYFxuICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudERpZmZ1c2UnKX1cbiAgICAgICR7KHRoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50TWFwJykgfHwgJyNpbmNsdWRlIDxtYXBfZnJhZ21lbnQ+Jyl9XG5cbiAgICAgIGBcbiAgICApXG4gICAgLnJlcGxhY2UoXG4gICAgICAnI2luY2x1ZGUgPGVtaXNzaXZlbWFwX2ZyYWdtZW50PicsXG4gICAgICBgXG4gICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50RW1pc3NpdmUnKX1cblxuICAgICAgI2luY2x1ZGUgPGVtaXNzaXZlbWFwX2ZyYWdtZW50PlxuICAgICAgYFxuICAgIClcbiAgcmV0dXJuIGBcbiAgdW5pZm9ybSB2ZWMzIGRpZmZ1c2U7XG4gIHVuaWZvcm0gdmVjMyBlbWlzc2l2ZTtcbiAgdW5pZm9ybSBmbG9hdCBvcGFjaXR5O1xuXG4gIHZhcnlpbmcgdmVjMyB2TGlnaHRGcm9udDtcbiAgdmFyeWluZyB2ZWMzIHZJbmRpcmVjdEZyb250O1xuXG4gICNpZmRlZiBET1VCTEVfU0lERURcbiAgICB2YXJ5aW5nIHZlYzMgdkxpZ2h0QmFjaztcbiAgICB2YXJ5aW5nIHZlYzMgdkluZGlyZWN0QmFjaztcbiAgI2VuZGlmXG5cbiAgI2luY2x1ZGUgPGNvbW1vbj5cbiAgI2luY2x1ZGUgPHBhY2tpbmc+XG4gICNpbmNsdWRlIDxkaXRoZXJpbmdfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGNvbG9yX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDx1dl9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8dXYyX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxtYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGFscGhhbWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxhb21hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8bGlnaHRtYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGVtaXNzaXZlbWFwX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxlbnZtYXBfY29tbW9uX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxlbnZtYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGN1YmVfdXZfcmVmbGVjdGlvbl9mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGJzZGZzPlxuICAjaW5jbHVkZSA8bGlnaHRzX3BhcnNfYmVnaW4+XG4gICNpbmNsdWRlIDxmb2dfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPHNoYWRvd21hcF9wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8c2hhZG93bWFza19wYXJzX2ZyYWdtZW50PlxuICAjaW5jbHVkZSA8c3BlY3VsYXJtYXBfcGFyc19mcmFnbWVudD5cbiAgI2luY2x1ZGUgPGxvZ2RlcHRoYnVmX3BhcnNfZnJhZ21lbnQ+XG4gICNpbmNsdWRlIDxjbGlwcGluZ19wbGFuZXNfcGFyc19mcmFnbWVudD5cblxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50UGFyYW1ldGVycycpfVxuICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZhcnlpbmdQYXJhbWV0ZXJzJyl9XG4gICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRGdW5jdGlvbnMnKX1cblxuICB2b2lkIG1haW4oKSB7XG5cbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50SW5pdCcpfVxuXG4gICAgI2luY2x1ZGUgPGNsaXBwaW5nX3BsYW5lc19mcmFnbWVudD5cblxuICAgIHZlYzQgZGlmZnVzZUNvbG9yID0gdmVjNCggZGlmZnVzZSwgb3BhY2l0eSApO1xuICAgIFJlZmxlY3RlZExpZ2h0IHJlZmxlY3RlZExpZ2h0ID0gUmVmbGVjdGVkTGlnaHQoIHZlYzMoIDAuMCApLCB2ZWMzKCAwLjAgKSwgdmVjMyggMC4wICksIHZlYzMoIDAuMCApICk7XG4gICAgdmVjMyB0b3RhbEVtaXNzaXZlUmFkaWFuY2UgPSBlbWlzc2l2ZTtcblxuICAgICNpbmNsdWRlIDxsb2dkZXB0aGJ1Zl9mcmFnbWVudD5cblxuICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnREaWZmdXNlJyl9XG4gICAgJHsodGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRNYXAnKSB8fCAnI2luY2x1ZGUgPG1hcF9mcmFnbWVudD4nKX1cblxuICAgICNpbmNsdWRlIDxjb2xvcl9mcmFnbWVudD5cbiAgICAjaW5jbHVkZSA8YWxwaGFtYXBfZnJhZ21lbnQ+XG4gICAgI2luY2x1ZGUgPGFscGhhdGVzdF9mcmFnbWVudD5cbiAgICAjaW5jbHVkZSA8c3BlY3VsYXJtYXBfZnJhZ21lbnQ+XG5cbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50RW1pc3NpdmUnKX1cblxuICAgICNpbmNsdWRlIDxlbWlzc2l2ZW1hcF9mcmFnbWVudD5cblxuICAgIC8vIGFjY3VtdWxhdGlvblxuICAgIHJlZmxlY3RlZExpZ2h0LmluZGlyZWN0RGlmZnVzZSA9IGdldEFtYmllbnRMaWdodElycmFkaWFuY2UoIGFtYmllbnRMaWdodENvbG9yICk7XG5cbiAgICAjaWZkZWYgRE9VQkxFX1NJREVEXG4gICAgICByZWZsZWN0ZWRMaWdodC5pbmRpcmVjdERpZmZ1c2UgKz0gKCBnbF9Gcm9udEZhY2luZyApID8gdkluZGlyZWN0RnJvbnQgOiB2SW5kaXJlY3RCYWNrO1xuICAgICNlbHNlXG4gICAgICByZWZsZWN0ZWRMaWdodC5pbmRpcmVjdERpZmZ1c2UgKz0gdkluZGlyZWN0RnJvbnQ7XG4gICAgI2VuZGlmXG5cbiAgICAjaW5jbHVkZSA8bGlnaHRtYXBfZnJhZ21lbnQ+XG5cbiAgICByZWZsZWN0ZWRMaWdodC5pbmRpcmVjdERpZmZ1c2UgKj0gQlJERl9EaWZmdXNlX0xhbWJlcnQoIGRpZmZ1c2VDb2xvci5yZ2IgKTtcblxuICAgICNpZmRlZiBET1VCTEVfU0lERURcbiAgICAgIHJlZmxlY3RlZExpZ2h0LmRpcmVjdERpZmZ1c2UgPSAoIGdsX0Zyb250RmFjaW5nICkgPyB2TGlnaHRGcm9udCA6IHZMaWdodEJhY2s7XG4gICAgI2Vsc2VcbiAgICAgIHJlZmxlY3RlZExpZ2h0LmRpcmVjdERpZmZ1c2UgPSB2TGlnaHRGcm9udDtcbiAgICAjZW5kaWZcblxuICAgIHJlZmxlY3RlZExpZ2h0LmRpcmVjdERpZmZ1c2UgKj0gQlJERl9EaWZmdXNlX0xhbWJlcnQoIGRpZmZ1c2VDb2xvci5yZ2IgKSAqIGdldFNoYWRvd01hc2soKTtcbiAgICAvLyBtb2R1bGF0aW9uXG4gICAgI2luY2x1ZGUgPGFvbWFwX2ZyYWdtZW50PlxuXG4gICAgdmVjMyBvdXRnb2luZ0xpZ2h0ID0gcmVmbGVjdGVkTGlnaHQuZGlyZWN0RGlmZnVzZSArIHJlZmxlY3RlZExpZ2h0LmluZGlyZWN0RGlmZnVzZSArIHRvdGFsRW1pc3NpdmVSYWRpYW5jZTtcblxuICAgICNpbmNsdWRlIDxlbnZtYXBfZnJhZ21lbnQ+XG5cbiAgICBnbF9GcmFnQ29sb3IgPSB2ZWM0KCBvdXRnb2luZ0xpZ2h0LCBkaWZmdXNlQ29sb3IuYSApO1xuXG4gICAgI2luY2x1ZGUgPHRvbmVtYXBwaW5nX2ZyYWdtZW50PlxuICAgICNpbmNsdWRlIDxlbmNvZGluZ3NfZnJhZ21lbnQ+XG4gICAgI2luY2x1ZGUgPGZvZ19mcmFnbWVudD5cbiAgICAjaW5jbHVkZSA8cHJlbXVsdGlwbGllZF9hbHBoYV9mcmFnbWVudD5cbiAgICAjaW5jbHVkZSA8ZGl0aGVyaW5nX2ZyYWdtZW50PlxuICB9YDtcbn07XG5cbmV4cG9ydCB7IExhbWJlcnRBbmltYXRpb25NYXRlcmlhbCB9O1xuIiwiaW1wb3J0IHsgU2hhZGVyTGliIH0gZnJvbSAndGhyZWUnO1xuaW1wb3J0IEJhc2VBbmltYXRpb25NYXRlcmlhbCBmcm9tICcuL0Jhc2VBbmltYXRpb25NYXRlcmlhbCc7XG5cbi8qKlxuICogRXh0ZW5kcyBUSFJFRS5NZXNoUGhvbmdNYXRlcmlhbCB3aXRoIGN1c3RvbSBzaGFkZXIgY2h1bmtzLlxuICpcbiAqIEBzZWUgaHR0cDovL3RocmVlLWJhcy1leGFtcGxlcy5zdXJnZS5zaC9leGFtcGxlcy9tYXRlcmlhbHNfcGhvbmcvXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IHBhcmFtZXRlcnMgT2JqZWN0IGNvbnRhaW5pbmcgbWF0ZXJpYWwgcHJvcGVydGllcyBhbmQgY3VzdG9tIHNoYWRlciBjaHVua3MuXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gUGhvbmdBbmltYXRpb25NYXRlcmlhbChwYXJhbWV0ZXJzKSB7XG4gIEJhc2VBbmltYXRpb25NYXRlcmlhbC5jYWxsKHRoaXMsIHBhcmFtZXRlcnMsIFNoYWRlckxpYlsncGhvbmcnXS51bmlmb3Jtcyk7XG5cbiAgdGhpcy5saWdodHMgPSB0cnVlO1xuICB0aGlzLnZlcnRleFNoYWRlciA9IHRoaXMuY29uY2F0VmVydGV4U2hhZGVyKCk7XG4gIHRoaXMuZnJhZ21lbnRTaGFkZXIgPSB0aGlzLmNvbmNhdEZyYWdtZW50U2hhZGVyKCk7XG59XG5QaG9uZ0FuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoQmFzZUFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZSk7XG5QaG9uZ0FuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFBob25nQW5pbWF0aW9uTWF0ZXJpYWw7XG5cblBob25nQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlLmNvbmNhdFZlcnRleFNoYWRlciA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIFNoYWRlckxpYi5waG9uZy52ZXJ0ZXhTaGFkZXJcbiAgICAucmVwbGFjZShcbiAgICAgICd2b2lkIG1haW4oKSB7JyxcbiAgICAgIGBcbiAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UGFyYW1ldGVycycpfVxuICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2YXJ5aW5nUGFyYW1ldGVycycpfVxuICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhGdW5jdGlvbnMnKX1cblxuICAgICAgdm9pZCBtYWluKCkge1xuICAgICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleEluaXQnKX1cbiAgICAgIGBcbiAgICApXG4gICAgLnJlcGxhY2UoXG4gICAgICAnI2luY2x1ZGUgPGJlZ2lubm9ybWFsX3ZlcnRleD4nLFxuICAgICAgYFxuICAgICAgI2luY2x1ZGUgPGJlZ2lubm9ybWFsX3ZlcnRleD5cblxuICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhOb3JtYWwnKX1cbiAgICAgIGBcbiAgICApXG4gICAgLnJlcGxhY2UoXG4gICAgICAnI2luY2x1ZGUgPGJlZ2luX3ZlcnRleD4nLFxuICAgICAgYFxuICAgICAgI2luY2x1ZGUgPGJlZ2luX3ZlcnRleD5cblxuICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQb3NpdGlvbicpfVxuICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhDb2xvcicpfVxuICAgICAgYFxuICAgIClcbiAgICAucmVwbGFjZShcbiAgICAgICcjaW5jbHVkZSA8bW9ycGh0YXJnZXRfdmVydGV4PicsXG4gICAgICBgXG4gICAgICAjaW5jbHVkZSA8bW9ycGh0YXJnZXRfdmVydGV4PlxuXG4gICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBvc3RNb3JwaCcpfVxuICAgICAgYFxuICAgIClcbiAgICAucmVwbGFjZShcbiAgICAgICcjaW5jbHVkZSA8c2tpbm5pbmdfdmVydGV4PicsXG4gICAgICBgXG4gICAgICAjaW5jbHVkZSA8c2tpbm5pbmdfdmVydGV4PlxuXG4gICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBvc3RTa2lubmluZycpfVxuICAgICAgYFxuICAgIClcbn07XG5cblBob25nQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlLmNvbmNhdEZyYWdtZW50U2hhZGVyID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gU2hhZGVyTGliLnBob25nLmZyYWdtZW50U2hhZGVyXG4gICAgLnJlcGxhY2UoXG4gICAgICAndm9pZCBtYWluKCkgeycsXG4gICAgICBgXG4gICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50UGFyYW1ldGVycycpfVxuICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2YXJ5aW5nUGFyYW1ldGVycycpfVxuICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudEZ1bmN0aW9ucycpfVxuXG4gICAgICB2b2lkIG1haW4oKSB7XG4gICAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRJbml0Jyl9XG4gICAgICBgXG4gICAgKVxuICAgIC5yZXBsYWNlKFxuICAgICAgJyNpbmNsdWRlIDxtYXBfZnJhZ21lbnQ+JyxcbiAgICAgIGBcbiAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnREaWZmdXNlJyl9XG4gICAgICAkeyh0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudE1hcCcpIHx8ICcjaW5jbHVkZSA8bWFwX2ZyYWdtZW50PicpfVxuXG4gICAgICBgXG4gICAgKVxuICAgIC5yZXBsYWNlKFxuICAgICAgJyNpbmNsdWRlIDxlbWlzc2l2ZW1hcF9mcmFnbWVudD4nLFxuICAgICAgYFxuICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudEVtaXNzaXZlJyl9XG5cbiAgICAgICNpbmNsdWRlIDxlbWlzc2l2ZW1hcF9mcmFnbWVudD5cbiAgICAgIGBcbiAgICApXG4gICAgLnJlcGxhY2UoXG4gICAgICAnI2luY2x1ZGUgPGxpZ2h0c19waG9uZ19mcmFnbWVudD4nLFxuICAgICAgYFxuICAgICAgI2luY2x1ZGUgPGxpZ2h0c19waG9uZ19mcmFnbWVudD5cbiAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRTcGVjdWxhcicpfVxuICAgICAgYFxuICAgIClcbn07XG5cbmV4cG9ydCB7IFBob25nQW5pbWF0aW9uTWF0ZXJpYWwgfTtcbiIsImltcG9ydCB7IFNoYWRlckxpYiB9IGZyb20gJ3RocmVlJztcbmltcG9ydCBCYXNlQW5pbWF0aW9uTWF0ZXJpYWwgZnJvbSAnLi9CYXNlQW5pbWF0aW9uTWF0ZXJpYWwnO1xuXG4vKipcbiAqIEV4dGVuZHMgVEhSRUUuTWVzaFN0YW5kYXJkTWF0ZXJpYWwgd2l0aCBjdXN0b20gc2hhZGVyIGNodW5rcy5cbiAqXG4gKiBAc2VlIGh0dHA6Ly90aHJlZS1iYXMtZXhhbXBsZXMuc3VyZ2Uuc2gvZXhhbXBsZXMvbWF0ZXJpYWxzX3N0YW5kYXJkL1xuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBwYXJhbWV0ZXJzIE9iamVjdCBjb250YWluaW5nIG1hdGVyaWFsIHByb3BlcnRpZXMgYW5kIGN1c3RvbSBzaGFkZXIgY2h1bmtzLlxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIFN0YW5kYXJkQW5pbWF0aW9uTWF0ZXJpYWwocGFyYW1ldGVycykge1xuICBCYXNlQW5pbWF0aW9uTWF0ZXJpYWwuY2FsbCh0aGlzLCBwYXJhbWV0ZXJzLCBTaGFkZXJMaWJbJ3BoeXNpY2FsJ10udW5pZm9ybXMpO1xuXG4gIHRoaXMubGlnaHRzID0gdHJ1ZTtcbiAgdGhpcy5leHRlbnNpb25zID0gKHRoaXMuZXh0ZW5zaW9ucyB8fCB7fSk7XG4gIHRoaXMuZXh0ZW5zaW9ucy5kZXJpdmF0aXZlcyA9IHRydWU7XG4gIHRoaXMudmVydGV4U2hhZGVyID0gdGhpcy5jb25jYXRWZXJ0ZXhTaGFkZXIoKTtcbiAgdGhpcy5mcmFnbWVudFNoYWRlciA9IHRoaXMuY29uY2F0RnJhZ21lbnRTaGFkZXIoKTtcbn1cblN0YW5kYXJkQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShCYXNlQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlKTtcblN0YW5kYXJkQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gU3RhbmRhcmRBbmltYXRpb25NYXRlcmlhbDtcblxuU3RhbmRhcmRBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uY2F0VmVydGV4U2hhZGVyID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gU2hhZGVyTGliLnN0YW5kYXJkLnZlcnRleFNoYWRlclxuICAgIC5yZXBsYWNlKFxuICAgICAgJ3ZvaWQgbWFpbigpIHsnLFxuICAgICAgYFxuICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQYXJhbWV0ZXJzJyl9XG4gICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZhcnlpbmdQYXJhbWV0ZXJzJyl9XG4gICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleEZ1bmN0aW9ucycpfVxuXG4gICAgICB2b2lkIG1haW4oKSB7XG4gICAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4SW5pdCcpfVxuICAgICAgYFxuICAgIClcbiAgICAucmVwbGFjZShcbiAgICAgICcjaW5jbHVkZSA8YmVnaW5ub3JtYWxfdmVydGV4PicsXG4gICAgICBgXG4gICAgICAjaW5jbHVkZSA8YmVnaW5ub3JtYWxfdmVydGV4PlxuXG4gICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleE5vcm1hbCcpfVxuICAgICAgYFxuICAgIClcbiAgICAucmVwbGFjZShcbiAgICAgICcjaW5jbHVkZSA8YmVnaW5fdmVydGV4PicsXG4gICAgICBgXG4gICAgICAjaW5jbHVkZSA8YmVnaW5fdmVydGV4PlxuXG4gICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBvc2l0aW9uJyl9XG4gICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleENvbG9yJyl9XG4gICAgICBgXG4gICAgKVxuICAgIC5yZXBsYWNlKFxuICAgICAgJyNpbmNsdWRlIDxtb3JwaHRhcmdldF92ZXJ0ZXg+JyxcbiAgICAgIGBcbiAgICAgICNpbmNsdWRlIDxtb3JwaHRhcmdldF92ZXJ0ZXg+XG5cbiAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UG9zdE1vcnBoJyl9XG4gICAgICBgXG4gICAgKVxuICAgIC5yZXBsYWNlKFxuICAgICAgJyNpbmNsdWRlIDxza2lubmluZ192ZXJ0ZXg+JyxcbiAgICAgIGBcbiAgICAgICNpbmNsdWRlIDxza2lubmluZ192ZXJ0ZXg+XG5cbiAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UG9zdFNraW5uaW5nJyl9XG4gICAgICBgXG4gICAgKVxufTtcblxuU3RhbmRhcmRBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uY2F0RnJhZ21lbnRTaGFkZXIgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiBTaGFkZXJMaWIuc3RhbmRhcmQuZnJhZ21lbnRTaGFkZXJcbiAgICAucmVwbGFjZShcbiAgICAgICd2b2lkIG1haW4oKSB7JyxcbiAgICAgIGBcbiAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRQYXJhbWV0ZXJzJyl9XG4gICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZhcnlpbmdQYXJhbWV0ZXJzJyl9XG4gICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50RnVuY3Rpb25zJyl9XG5cbiAgICAgIHZvaWQgbWFpbigpIHtcbiAgICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudEluaXQnKX1cbiAgICAgIGBcbiAgICApXG4gICAgLnJlcGxhY2UoXG4gICAgICAnI2luY2x1ZGUgPG1hcF9mcmFnbWVudD4nLFxuICAgICAgYFxuICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudERpZmZ1c2UnKX1cbiAgICAgICR7KHRoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50TWFwJykgfHwgJyNpbmNsdWRlIDxtYXBfZnJhZ21lbnQ+Jyl9XG5cbiAgICAgIGBcbiAgICApXG4gICAgLnJlcGxhY2UoXG4gICAgICAnI2luY2x1ZGUgPGVtaXNzaXZlbWFwX2ZyYWdtZW50PicsXG4gICAgICBgXG4gICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50RW1pc3NpdmUnKX1cblxuICAgICAgI2luY2x1ZGUgPGVtaXNzaXZlbWFwX2ZyYWdtZW50PlxuICAgICAgYFxuICAgIClcbiAgICAucmVwbGFjZShcbiAgICAgICcjaW5jbHVkZSA8cm91Z2huZXNzbWFwX2ZyYWdtZW50PicsXG4gICAgICBgXG4gICAgICBmbG9hdCByb3VnaG5lc3NGYWN0b3IgPSByb3VnaG5lc3M7XG4gICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50Um91Z2huZXNzJyl9XG4gICAgICAjaWZkZWYgVVNFX1JPVUdITkVTU01BUFxuXG4gICAgICB2ZWM0IHRleGVsUm91Z2huZXNzID0gdGV4dHVyZTJEKCByb3VnaG5lc3NNYXAsIHZVdiApO1xuICAgICAgICByb3VnaG5lc3NGYWN0b3IgKj0gdGV4ZWxSb3VnaG5lc3MuZztcbiAgICAgICNlbmRpZlxuICAgICAgYFxuICAgIClcbiAgICAucmVwbGFjZShcbiAgICAgICcjaW5jbHVkZSA8bWV0YWxuZXNzbWFwX2ZyYWdtZW50PicsXG4gICAgICBgXG4gICAgICBmbG9hdCBtZXRhbG5lc3NGYWN0b3IgPSBtZXRhbG5lc3M7XG4gICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50TWV0YWxuZXNzJyl9XG5cbiAgICAgICNpZmRlZiBVU0VfTUVUQUxORVNTTUFQXG4gICAgICAgIHZlYzQgdGV4ZWxNZXRhbG5lc3MgPSB0ZXh0dXJlMkQoIG1ldGFsbmVzc01hcCwgdlV2ICk7XG4gICAgICAgIG1ldGFsbmVzc0ZhY3RvciAqPSB0ZXhlbE1ldGFsbmVzcy5iO1xuICAgICAgI2VuZGlmXG4gICAgICBgXG4gICAgKVxufTtcblxuZXhwb3J0IHsgU3RhbmRhcmRBbmltYXRpb25NYXRlcmlhbCB9O1xuIiwiaW1wb3J0IHsgU2hhZGVyTGliIH0gZnJvbSAndGhyZWUnO1xuaW1wb3J0IHsgUGhvbmdBbmltYXRpb25NYXRlcmlhbCB9IGZyb20gJy4vUGhvbmdBbmltYXRpb25NYXRlcmlhbCc7XG5cbi8qKlxuICogRXh0ZW5kcyBUSFJFRS5NZXNoVG9vbk1hdGVyaWFsIHdpdGggY3VzdG9tIHNoYWRlciBjaHVua3MuIE1lc2hUb29uTWF0ZXJpYWwgaXMgbW9zdGx5IHRoZSBzYW1lIGFzIE1lc2hQaG9uZ01hdGVyaWFsLiBUaGUgb25seSBkaWZmZXJlbmNlIGlzIGEgVE9PTiBkZWZpbmUsIGFuZCBzdXBwb3J0IGZvciBhIGdyYWRpZW50TWFwIHVuaWZvcm0uXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IHBhcmFtZXRlcnMgT2JqZWN0IGNvbnRhaW5pbmcgbWF0ZXJpYWwgcHJvcGVydGllcyBhbmQgY3VzdG9tIHNoYWRlciBjaHVua3MuXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gVG9vbkFuaW1hdGlvbk1hdGVyaWFsKHBhcmFtZXRlcnMpIHtcbiAgaWYgKCFwYXJhbWV0ZXJzLmRlZmluZXMpIHtcbiAgICBwYXJhbWV0ZXJzLmRlZmluZXMgPSB7fVxuICB9XG4gIHBhcmFtZXRlcnMuZGVmaW5lc1snVE9PTiddID0gJydcblxuICBQaG9uZ0FuaW1hdGlvbk1hdGVyaWFsLmNhbGwodGhpcywgcGFyYW1ldGVycyk7XG59XG5Ub29uQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShQaG9uZ0FuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZSk7XG5Ub29uQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gVG9vbkFuaW1hdGlvbk1hdGVyaWFsO1xuXG5leHBvcnQgeyBUb29uQW5pbWF0aW9uTWF0ZXJpYWwgfTtcbiIsImltcG9ydCB7IFNoYWRlckxpYiB9IGZyb20gJ3RocmVlJztcbmltcG9ydCBCYXNlQW5pbWF0aW9uTWF0ZXJpYWwgZnJvbSAnLi9CYXNlQW5pbWF0aW9uTWF0ZXJpYWwnO1xuXG4vKipcbiAqIEV4dGVuZHMgVEhSRUUuUG9pbnRzTWF0ZXJpYWwgd2l0aCBjdXN0b20gc2hhZGVyIGNodW5rcy5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gcGFyYW1ldGVycyBPYmplY3QgY29udGFpbmluZyBtYXRlcmlhbCBwcm9wZXJ0aWVzIGFuZCBjdXN0b20gc2hhZGVyIGNodW5rcy5cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBQb2ludHNBbmltYXRpb25NYXRlcmlhbChwYXJhbWV0ZXJzKSB7XG4gIEJhc2VBbmltYXRpb25NYXRlcmlhbC5jYWxsKHRoaXMsIHBhcmFtZXRlcnMsIFNoYWRlckxpYlsncG9pbnRzJ10udW5pZm9ybXMpO1xuXG4gIHRoaXMudmVydGV4U2hhZGVyID0gdGhpcy5jb25jYXRWZXJ0ZXhTaGFkZXIoKTtcbiAgdGhpcy5mcmFnbWVudFNoYWRlciA9IHRoaXMuY29uY2F0RnJhZ21lbnRTaGFkZXIoKTtcbn1cblxuUG9pbnRzQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShCYXNlQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlKTtcblBvaW50c0FuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFBvaW50c0FuaW1hdGlvbk1hdGVyaWFsO1xuXG5Qb2ludHNBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uY2F0VmVydGV4U2hhZGVyID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gU2hhZGVyTGliLnBvaW50cy52ZXJ0ZXhTaGFkZXJcbiAgICAucmVwbGFjZShcbiAgICAgICd2b2lkIG1haW4oKSB7JyxcbiAgICAgIGBcbiAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UGFyYW1ldGVycycpfVxuICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2YXJ5aW5nUGFyYW1ldGVycycpfVxuICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhGdW5jdGlvbnMnKX1cblxuICAgICAgdm9pZCBtYWluKCkge1xuICAgICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleEluaXQnKX1cbiAgICAgIGBcbiAgICApXG4gICAgLnJlcGxhY2UoXG4gICAgICAnI2luY2x1ZGUgPGJlZ2luX3ZlcnRleD4nLFxuICAgICAgYFxuICAgICAgI2luY2x1ZGUgPGJlZ2luX3ZlcnRleD5cblxuICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQb3NpdGlvbicpfVxuICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhDb2xvcicpfVxuICAgICAgYFxuICAgIClcbiAgICAucmVwbGFjZShcbiAgICAgICcjaW5jbHVkZSA8bW9ycGh0YXJnZXRfdmVydGV4PicsXG4gICAgICBgXG4gICAgICAjaW5jbHVkZSA8bW9ycGh0YXJnZXRfdmVydGV4PlxuXG4gICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBvc3RNb3JwaCcpfVxuICAgICAgYFxuICAgIClcbn07XG5cblBvaW50c0FuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZS5jb25jYXRGcmFnbWVudFNoYWRlciA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIFNoYWRlckxpYi5wb2ludHMuZnJhZ21lbnRTaGFkZXJcbiAgICAucmVwbGFjZShcbiAgICAgICd2b2lkIG1haW4oKSB7JyxcbiAgICAgIGBcbiAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRQYXJhbWV0ZXJzJyl9XG4gICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZhcnlpbmdQYXJhbWV0ZXJzJyl9XG4gICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50RnVuY3Rpb25zJyl9XG5cbiAgICAgIHZvaWQgbWFpbigpIHtcbiAgICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudEluaXQnKX1cbiAgICAgIGBcbiAgICApXG4gICAgLnJlcGxhY2UoXG4gICAgICAnI2luY2x1ZGUgPG1hcF9mcmFnbWVudD4nLFxuICAgICAgYFxuICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudERpZmZ1c2UnKX1cbiAgICAgICR7KHRoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50TWFwJykgfHwgJyNpbmNsdWRlIDxtYXBfZnJhZ21lbnQ+Jyl9XG5cbiAgICAgIGBcbiAgICApXG4gICAgLnJlcGxhY2UoXG4gICAgICAnI2luY2x1ZGUgPHByZW11bHRpcGxpZWRfYWxwaGFfZnJhZ21lbnQ+JyxcbiAgICAgIGBcbiAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRTaGFwZScpfVxuXG4gICAgICAjaW5jbHVkZSA8cHJlbXVsdGlwbGllZF9hbHBoYV9mcmFnbWVudD5cbiAgICAgIGBcbiAgICApXG59O1xuXG5leHBvcnQgeyBQb2ludHNBbmltYXRpb25NYXRlcmlhbCB9O1xuIiwiaW1wb3J0IHsgU2hhZGVyTGliLCBVbmlmb3Jtc1V0aWxzLCBSR0JBRGVwdGhQYWNraW5nIH0gZnJvbSAndGhyZWUnO1xuaW1wb3J0IEJhc2VBbmltYXRpb25NYXRlcmlhbCBmcm9tICcuL0Jhc2VBbmltYXRpb25NYXRlcmlhbCc7XG5cbmZ1bmN0aW9uIERlcHRoQW5pbWF0aW9uTWF0ZXJpYWwocGFyYW1ldGVycykge1xuICB0aGlzLmRlcHRoUGFja2luZyA9IFJHQkFEZXB0aFBhY2tpbmc7XG4gIHRoaXMuY2xpcHBpbmcgPSB0cnVlO1xuXG4gIEJhc2VBbmltYXRpb25NYXRlcmlhbC5jYWxsKHRoaXMsIHBhcmFtZXRlcnMsIFNoYWRlckxpYlsnZGVwdGgnXS51bmlmb3Jtcyk7XG5cbiAgdGhpcy52ZXJ0ZXhTaGFkZXIgPSB0aGlzLmNvbmNhdFZlcnRleFNoYWRlcigpO1xuICB0aGlzLmZyYWdtZW50U2hhZGVyID0gU2hhZGVyTGliWydkZXB0aCddLmZyYWdtZW50U2hhZGVyO1xufVxuRGVwdGhBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEJhc2VBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUpO1xuRGVwdGhBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBEZXB0aEFuaW1hdGlvbk1hdGVyaWFsO1xuXG5EZXB0aEFuaW1hdGlvbk1hdGVyaWFsLnByb3RvdHlwZS5jb25jYXRWZXJ0ZXhTaGFkZXIgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiBTaGFkZXJMaWIuZGVwdGgudmVydGV4U2hhZGVyXG4gICAgLnJlcGxhY2UoXG4gICAgICAndm9pZCBtYWluKCkgeycsXG4gICAgICBgXG4gICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBhcmFtZXRlcnMnKX1cbiAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4RnVuY3Rpb25zJyl9XG5cbiAgICAgIHZvaWQgbWFpbigpIHtcbiAgICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhJbml0Jyl9XG4gICAgICBgXG4gICAgKVxuICAgIC5yZXBsYWNlKFxuICAgICAgJyNpbmNsdWRlIDxiZWdpbl92ZXJ0ZXg+JyxcbiAgICAgIGBcbiAgICAgICNpbmNsdWRlIDxiZWdpbl92ZXJ0ZXg+XG5cbiAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UG9zaXRpb24nKX1cbiAgICAgIGBcbiAgICApXG4gICAgLnJlcGxhY2UoXG4gICAgICAnI2luY2x1ZGUgPG1vcnBodGFyZ2V0X3ZlcnRleD4nLFxuICAgICAgYFxuICAgICAgI2luY2x1ZGUgPG1vcnBodGFyZ2V0X3ZlcnRleD5cblxuICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQb3N0TW9ycGgnKX1cbiAgICAgIGBcbiAgICApXG4gICAgLnJlcGxhY2UoXG4gICAgICAnI2luY2x1ZGUgPHNraW5uaW5nX3ZlcnRleD4nLFxuICAgICAgYFxuICAgICAgI2luY2x1ZGUgPHNraW5uaW5nX3ZlcnRleD5cblxuICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQb3N0U2tpbm5pbmcnKX1cbiAgICAgIGBcbiAgICApXG59O1xuXG5leHBvcnQgeyBEZXB0aEFuaW1hdGlvbk1hdGVyaWFsIH07XG4iLCJpbXBvcnQgeyBTaGFkZXJMaWIsIFVuaWZvcm1zVXRpbHMsIFJHQkFEZXB0aFBhY2tpbmcgfSBmcm9tICd0aHJlZSc7XG5pbXBvcnQgQmFzZUFuaW1hdGlvbk1hdGVyaWFsIGZyb20gJy4vQmFzZUFuaW1hdGlvbk1hdGVyaWFsJztcblxuZnVuY3Rpb24gRGlzdGFuY2VBbmltYXRpb25NYXRlcmlhbChwYXJhbWV0ZXJzKSB7XG4gIHRoaXMuZGVwdGhQYWNraW5nID0gUkdCQURlcHRoUGFja2luZztcbiAgdGhpcy5jbGlwcGluZyA9IHRydWU7XG5cbiAgQmFzZUFuaW1hdGlvbk1hdGVyaWFsLmNhbGwodGhpcywgcGFyYW1ldGVycywgU2hhZGVyTGliWydkaXN0YW5jZVJHQkEnXS51bmlmb3Jtcyk7XG5cbiAgdGhpcy52ZXJ0ZXhTaGFkZXIgPSB0aGlzLmNvbmNhdFZlcnRleFNoYWRlcigpO1xuICB0aGlzLmZyYWdtZW50U2hhZGVyID0gU2hhZGVyTGliWydkaXN0YW5jZVJHQkEnXS5mcmFnbWVudFNoYWRlcjtcbn1cbkRpc3RhbmNlQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShCYXNlQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlKTtcbkRpc3RhbmNlQW5pbWF0aW9uTWF0ZXJpYWwucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gRGlzdGFuY2VBbmltYXRpb25NYXRlcmlhbDtcblxuRGlzdGFuY2VBbmltYXRpb25NYXRlcmlhbC5wcm90b3R5cGUuY29uY2F0VmVydGV4U2hhZGVyID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gU2hhZGVyTGliLmRpc3RhbmNlUkdCQS52ZXJ0ZXhTaGFkZXJcbiAgLnJlcGxhY2UoXG4gICAgJ3ZvaWQgbWFpbigpIHsnLFxuICAgIGBcbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBhcmFtZXRlcnMnKX1cbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleEZ1bmN0aW9ucycpfVxuXG4gICAgdm9pZCBtYWluKCkge1xuICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhJbml0Jyl9XG4gICAgYFxuICApXG4gIC5yZXBsYWNlKFxuICAgICcjaW5jbHVkZSA8YmVnaW5fdmVydGV4PicsXG4gICAgYFxuICAgICNpbmNsdWRlIDxiZWdpbl92ZXJ0ZXg+XG5cbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBvc2l0aW9uJyl9XG4gICAgYFxuICApXG4gIC5yZXBsYWNlKFxuICAgICcjaW5jbHVkZSA8bW9ycGh0YXJnZXRfdmVydGV4PicsXG4gICAgYFxuICAgICNpbmNsdWRlIDxtb3JwaHRhcmdldF92ZXJ0ZXg+XG5cbiAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBvc3RNb3JwaCcpfVxuICAgIGBcbiAgKVxuICAucmVwbGFjZShcbiAgICAnI2luY2x1ZGUgPHNraW5uaW5nX3ZlcnRleD4nLFxuICAgIGBcbiAgICAjaW5jbHVkZSA8c2tpbm5pbmdfdmVydGV4PlxuXG4gICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQb3N0U2tpbm5pbmcnKX1cbiAgICBgXG4gIClcbn07XG5cbmV4cG9ydCB7IERpc3RhbmNlQW5pbWF0aW9uTWF0ZXJpYWwgfTtcbiIsImltcG9ydCB7IEJ1ZmZlckdlb21ldHJ5LCBCdWZmZXJBdHRyaWJ1dGUgfSBmcm9tICd0aHJlZSc7XG4vKipcbiAqIEEgQnVmZmVyR2VvbWV0cnkgd2hlcmUgYSAncHJlZmFiJyBnZW9tZXRyeSBpcyByZXBlYXRlZCBhIG51bWJlciBvZiB0aW1lcy5cbiAqXG4gKiBAcGFyYW0ge0dlb21ldHJ5fEJ1ZmZlckdlb21ldHJ5fSBwcmVmYWIgVGhlIEdlb21ldHJ5IGluc3RhbmNlIHRvIHJlcGVhdC5cbiAqIEBwYXJhbSB7TnVtYmVyfSBjb3VudCBUaGUgbnVtYmVyIG9mIHRpbWVzIHRvIHJlcGVhdCB0aGUgZ2VvbWV0cnkuXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gUHJlZmFiQnVmZmVyR2VvbWV0cnkocHJlZmFiLCBjb3VudCkge1xuICBCdWZmZXJHZW9tZXRyeS5jYWxsKHRoaXMpO1xuXG4gIC8qKlxuICAgKiBBIHJlZmVyZW5jZSB0byB0aGUgcHJlZmFiIGdlb21ldHJ5IHVzZWQgdG8gY3JlYXRlIHRoaXMgaW5zdGFuY2UuXG4gICAqIEB0eXBlIHtHZW9tZXRyeXxCdWZmZXJHZW9tZXRyeX1cbiAgICovXG4gIHRoaXMucHJlZmFiR2VvbWV0cnkgPSBwcmVmYWI7XG4gIHRoaXMuaXNQcmVmYWJCdWZmZXJHZW9tZXRyeSA9IHByZWZhYi5pc0J1ZmZlckdlb21ldHJ5O1xuXG4gIC8qKlxuICAgKiBOdW1iZXIgb2YgcHJlZmFicy5cbiAgICogQHR5cGUge051bWJlcn1cbiAgICovXG4gIHRoaXMucHJlZmFiQ291bnQgPSBjb3VudDtcblxuICAvKipcbiAgICogTnVtYmVyIG9mIHZlcnRpY2VzIG9mIHRoZSBwcmVmYWIuXG4gICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAqL1xuICBpZiAodGhpcy5pc1ByZWZhYkJ1ZmZlckdlb21ldHJ5KSB7XG4gICAgdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudCA9IHByZWZhYi5hdHRyaWJ1dGVzLnBvc2l0aW9uLmNvdW50O1xuICB9XG4gIGVsc2Uge1xuICAgIHRoaXMucHJlZmFiVmVydGV4Q291bnQgPSBwcmVmYWIudmVydGljZXMubGVuZ3RoO1xuICB9XG5cbiAgdGhpcy5idWZmZXJJbmRpY2VzKCk7XG4gIHRoaXMuYnVmZmVyUG9zaXRpb25zKCk7XG59XG5QcmVmYWJCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZSk7XG5QcmVmYWJCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBQcmVmYWJCdWZmZXJHZW9tZXRyeTtcblxuUHJlZmFiQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmJ1ZmZlckluZGljZXMgPSBmdW5jdGlvbigpIHtcbiAgbGV0IHByZWZhYkluZGljZXMgPSBbXTtcbiAgbGV0IHByZWZhYkluZGV4Q291bnQ7XG5cbiAgaWYgKHRoaXMuaXNQcmVmYWJCdWZmZXJHZW9tZXRyeSkge1xuICAgIGlmICh0aGlzLnByZWZhYkdlb21ldHJ5LmluZGV4KSB7XG4gICAgICBwcmVmYWJJbmRleENvdW50ID0gdGhpcy5wcmVmYWJHZW9tZXRyeS5pbmRleC5jb3VudDtcbiAgICAgIHByZWZhYkluZGljZXMgPSB0aGlzLnByZWZhYkdlb21ldHJ5LmluZGV4LmFycmF5O1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHByZWZhYkluZGV4Q291bnQgPSB0aGlzLnByZWZhYlZlcnRleENvdW50O1xuXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHByZWZhYkluZGV4Q291bnQ7IGkrKykge1xuICAgICAgICBwcmVmYWJJbmRpY2VzLnB1c2goaSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGVsc2Uge1xuICAgIGNvbnN0IHByZWZhYkZhY2VDb3VudCA9IHRoaXMucHJlZmFiR2VvbWV0cnkuZmFjZXMubGVuZ3RoO1xuICAgIHByZWZhYkluZGV4Q291bnQgPSBwcmVmYWJGYWNlQ291bnQgKiAzO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcmVmYWJGYWNlQ291bnQ7IGkrKykge1xuICAgICAgY29uc3QgZmFjZSA9IHRoaXMucHJlZmFiR2VvbWV0cnkuZmFjZXNbaV07XG4gICAgICBwcmVmYWJJbmRpY2VzLnB1c2goZmFjZS5hLCBmYWNlLmIsIGZhY2UuYyk7XG4gICAgfVxuICB9XG5cbiAgY29uc3QgaW5kZXhCdWZmZXIgPSBuZXcgVWludDMyQXJyYXkodGhpcy5wcmVmYWJDb3VudCAqIHByZWZhYkluZGV4Q291bnQpO1xuXG4gIHRoaXMuc2V0SW5kZXgobmV3IEJ1ZmZlckF0dHJpYnV0ZShpbmRleEJ1ZmZlciwgMSkpO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5wcmVmYWJDb3VudDsgaSsrKSB7XG4gICAgZm9yIChsZXQgayA9IDA7IGsgPCBwcmVmYWJJbmRleENvdW50OyBrKyspIHtcbiAgICAgIGluZGV4QnVmZmVyW2kgKiBwcmVmYWJJbmRleENvdW50ICsga10gPSBwcmVmYWJJbmRpY2VzW2tdICsgaSAqIHRoaXMucHJlZmFiVmVydGV4Q291bnQ7XG4gICAgfVxuICB9XG59O1xuXG5QcmVmYWJCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuYnVmZmVyUG9zaXRpb25zID0gZnVuY3Rpb24oKSB7XG4gIGNvbnN0IHBvc2l0aW9uQnVmZmVyID0gdGhpcy5jcmVhdGVBdHRyaWJ1dGUoJ3Bvc2l0aW9uJywgMykuYXJyYXk7XG5cbiAgaWYgKHRoaXMuaXNQcmVmYWJCdWZmZXJHZW9tZXRyeSkge1xuICAgIGNvbnN0IHBvc2l0aW9ucyA9IHRoaXMucHJlZmFiR2VvbWV0cnkuYXR0cmlidXRlcy5wb3NpdGlvbi5hcnJheTtcblxuICAgIGZvciAobGV0IGkgPSAwLCBvZmZzZXQgPSAwOyBpIDwgdGhpcy5wcmVmYWJDb3VudDsgaSsrKSB7XG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHRoaXMucHJlZmFiVmVydGV4Q291bnQ7IGorKywgb2Zmc2V0ICs9IDMpIHtcbiAgICAgICAgcG9zaXRpb25CdWZmZXJbb2Zmc2V0ICAgIF0gPSBwb3NpdGlvbnNbaiAqIDNdO1xuICAgICAgICBwb3NpdGlvbkJ1ZmZlcltvZmZzZXQgKyAxXSA9IHBvc2l0aW9uc1tqICogMyArIDFdO1xuICAgICAgICBwb3NpdGlvbkJ1ZmZlcltvZmZzZXQgKyAyXSA9IHBvc2l0aW9uc1tqICogMyArIDJdO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBlbHNlIHtcbiAgICBmb3IgKGxldCBpID0gMCwgb2Zmc2V0ID0gMDsgaSA8IHRoaXMucHJlZmFiQ291bnQ7IGkrKykge1xuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCB0aGlzLnByZWZhYlZlcnRleENvdW50OyBqKyssIG9mZnNldCArPSAzKSB7XG4gICAgICAgIGNvbnN0IHByZWZhYlZlcnRleCA9IHRoaXMucHJlZmFiR2VvbWV0cnkudmVydGljZXNbal07XG5cbiAgICAgICAgcG9zaXRpb25CdWZmZXJbb2Zmc2V0ICAgIF0gPSBwcmVmYWJWZXJ0ZXgueDtcbiAgICAgICAgcG9zaXRpb25CdWZmZXJbb2Zmc2V0ICsgMV0gPSBwcmVmYWJWZXJ0ZXgueTtcbiAgICAgICAgcG9zaXRpb25CdWZmZXJbb2Zmc2V0ICsgMl0gPSBwcmVmYWJWZXJ0ZXguejtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn07XG5cbi8qKlxuICogQ3JlYXRlcyBhIEJ1ZmZlckF0dHJpYnV0ZSB3aXRoIFVWIGNvb3JkaW5hdGVzLlxuICovXG5QcmVmYWJCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuYnVmZmVyVXZzID0gZnVuY3Rpb24oKSB7XG4gIGNvbnN0IHV2QnVmZmVyID0gdGhpcy5jcmVhdGVBdHRyaWJ1dGUoJ3V2JywgMikuYXJyYXk7XG5cbiAgaWYgKHRoaXMuaXNQcmVmYWJCdWZmZXJHZW9tZXRyeSkge1xuICAgIGNvbnN0IHV2cyA9IHRoaXMucHJlZmFiR2VvbWV0cnkuYXR0cmlidXRlcy51di5hcnJheVxuXG4gICAgZm9yIChsZXQgaSA9IDAsIG9mZnNldCA9IDA7IGkgPCB0aGlzLnByZWZhYkNvdW50OyBpKyspIHtcbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudDsgaisrLCBvZmZzZXQgKz0gMikge1xuICAgICAgICB1dkJ1ZmZlcltvZmZzZXQgICAgXSA9IHV2c1tqICogMl07XG4gICAgICAgIHV2QnVmZmVyW29mZnNldCArIDFdID0gdXZzW2ogKiAyICsgMV07XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGNvbnN0IHByZWZhYkZhY2VDb3VudCA9IHRoaXMucHJlZmFiR2VvbWV0cnkuZmFjZXMubGVuZ3RoO1xuICAgIGNvbnN0IHV2cyA9IFtdXG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHByZWZhYkZhY2VDb3VudDsgaSsrKSB7XG4gICAgICBjb25zdCBmYWNlID0gdGhpcy5wcmVmYWJHZW9tZXRyeS5mYWNlc1tpXTtcbiAgICAgIGNvbnN0IHV2ID0gdGhpcy5wcmVmYWJHZW9tZXRyeS5mYWNlVmVydGV4VXZzWzBdW2ldO1xuXG4gICAgICB1dnNbZmFjZS5hXSA9IHV2WzBdO1xuICAgICAgdXZzW2ZhY2UuYl0gPSB1dlsxXTtcbiAgICAgIHV2c1tmYWNlLmNdID0gdXZbMl07XG4gICAgfVxuXG4gICAgZm9yIChsZXQgaSA9IDAsIG9mZnNldCA9IDA7IGkgPCB0aGlzLnByZWZhYkNvdW50OyBpKyspIHtcbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudDsgaisrLCBvZmZzZXQgKz0gMikge1xuICAgICAgICBjb25zdCB1diA9IHV2c1tqXTtcblxuICAgICAgICB1dkJ1ZmZlcltvZmZzZXRdID0gdXYueDtcbiAgICAgICAgdXZCdWZmZXJbb2Zmc2V0ICsgMV0gPSB1di55O1xuICAgICAgfVxuICAgIH1cbiAgfVxufTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgQnVmZmVyQXR0cmlidXRlIG9uIHRoaXMgZ2VvbWV0cnkgaW5zdGFuY2UuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgTmFtZSBvZiB0aGUgYXR0cmlidXRlLlxuICogQHBhcmFtIHtOdW1iZXJ9IGl0ZW1TaXplIE51bWJlciBvZiBmbG9hdHMgcGVyIHZlcnRleCAodHlwaWNhbGx5IDEsIDIsIDMgb3IgNCkuXG4gKiBAcGFyYW0ge2Z1bmN0aW9uPX0gZmFjdG9yeSBGdW5jdGlvbiB0aGF0IHdpbGwgYmUgY2FsbGVkIGZvciBlYWNoIHByZWZhYiB1cG9uIGNyZWF0aW9uLiBBY2NlcHRzIDMgYXJndW1lbnRzOiBkYXRhW10sIGluZGV4IGFuZCBwcmVmYWJDb3VudC4gQ2FsbHMgc2V0UHJlZmFiRGF0YS5cbiAqXG4gKiBAcmV0dXJucyB7QnVmZmVyQXR0cmlidXRlfVxuICovXG5QcmVmYWJCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuY3JlYXRlQXR0cmlidXRlID0gZnVuY3Rpb24obmFtZSwgaXRlbVNpemUsIGZhY3RvcnkpIHtcbiAgY29uc3QgYnVmZmVyID0gbmV3IEZsb2F0MzJBcnJheSh0aGlzLnByZWZhYkNvdW50ICogdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudCAqIGl0ZW1TaXplKTtcbiAgY29uc3QgYXR0cmlidXRlID0gbmV3IEJ1ZmZlckF0dHJpYnV0ZShidWZmZXIsIGl0ZW1TaXplKTtcblxuICB0aGlzLnNldEF0dHJpYnV0ZShuYW1lLCBhdHRyaWJ1dGUpO1xuXG4gIGlmIChmYWN0b3J5KSB7XG4gICAgY29uc3QgZGF0YSA9IFtdO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnByZWZhYkNvdW50OyBpKyspIHtcbiAgICAgIGZhY3RvcnkoZGF0YSwgaSwgdGhpcy5wcmVmYWJDb3VudCk7XG4gICAgICB0aGlzLnNldFByZWZhYkRhdGEoYXR0cmlidXRlLCBpLCBkYXRhKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gYXR0cmlidXRlO1xufTtcblxuLyoqXG4gKiBTZXRzIGRhdGEgZm9yIGFsbCB2ZXJ0aWNlcyBvZiBhIHByZWZhYiBhdCBhIGdpdmVuIGluZGV4LlxuICogVXN1YWxseSBjYWxsZWQgaW4gYSBsb29wLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfEJ1ZmZlckF0dHJpYnV0ZX0gYXR0cmlidXRlIFRoZSBhdHRyaWJ1dGUgb3IgYXR0cmlidXRlIG5hbWUgd2hlcmUgdGhlIGRhdGEgaXMgdG8gYmUgc3RvcmVkLlxuICogQHBhcmFtIHtOdW1iZXJ9IHByZWZhYkluZGV4IEluZGV4IG9mIHRoZSBwcmVmYWIgaW4gdGhlIGJ1ZmZlciBnZW9tZXRyeS5cbiAqIEBwYXJhbSB7QXJyYXl9IGRhdGEgQXJyYXkgb2YgZGF0YS4gTGVuZ3RoIHNob3VsZCBiZSBlcXVhbCB0byBpdGVtIHNpemUgb2YgdGhlIGF0dHJpYnV0ZS5cbiAqL1xuUHJlZmFiQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLnNldFByZWZhYkRhdGEgPSBmdW5jdGlvbihhdHRyaWJ1dGUsIHByZWZhYkluZGV4LCBkYXRhKSB7XG4gIGF0dHJpYnV0ZSA9ICh0eXBlb2YgYXR0cmlidXRlID09PSAnc3RyaW5nJykgPyB0aGlzLmF0dHJpYnV0ZXNbYXR0cmlidXRlXSA6IGF0dHJpYnV0ZTtcblxuICBsZXQgb2Zmc2V0ID0gcHJlZmFiSW5kZXggKiB0aGlzLnByZWZhYlZlcnRleENvdW50ICogYXR0cmlidXRlLml0ZW1TaXplO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudDsgaSsrKSB7XG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCBhdHRyaWJ1dGUuaXRlbVNpemU7IGorKykge1xuICAgICAgYXR0cmlidXRlLmFycmF5W29mZnNldCsrXSA9IGRhdGFbal07XG4gICAgfVxuICB9XG59O1xuXG5leHBvcnQgeyBQcmVmYWJCdWZmZXJHZW9tZXRyeSB9O1xuIiwiaW1wb3J0IHsgQnVmZmVyR2VvbWV0cnksIEJ1ZmZlckF0dHJpYnV0ZSB9IGZyb20gJ3RocmVlJztcbi8qKlxuICogQSBCdWZmZXJHZW9tZXRyeSB3aGVyZSBhICdwcmVmYWInIGdlb21ldHJ5IGFycmF5IGlzIHJlcGVhdGVkIGEgbnVtYmVyIG9mIHRpbWVzLlxuICpcbiAqIEBwYXJhbSB7QXJyYXl9IHByZWZhYnMgQW4gYXJyYXkgd2l0aCBHZW9tZXRyeSBpbnN0YW5jZXMgdG8gcmVwZWF0LlxuICogQHBhcmFtIHtOdW1iZXJ9IHJlcGVhdENvdW50IFRoZSBudW1iZXIgb2YgdGltZXMgdG8gcmVwZWF0IHRoZSBhcnJheSBvZiBHZW9tZXRyaWVzLlxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIE11bHRpUHJlZmFiQnVmZmVyR2VvbWV0cnkocHJlZmFicywgcmVwZWF0Q291bnQpIHtcbiAgQnVmZmVyR2VvbWV0cnkuY2FsbCh0aGlzKTtcblxuICBpZiAoQXJyYXkuaXNBcnJheShwcmVmYWJzKSkge1xuICAgIHRoaXMucHJlZmFiR2VvbWV0cmllcyA9IHByZWZhYnM7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5wcmVmYWJHZW9tZXRyaWVzID0gW3ByZWZhYnNdO1xuICB9XG5cbiAgdGhpcy5wcmVmYWJHZW9tZXRyaWVzQ291bnQgPSB0aGlzLnByZWZhYkdlb21ldHJpZXMubGVuZ3RoO1xuXG4gIC8qKlxuICAgKiBOdW1iZXIgb2YgcHJlZmFicy5cbiAgICogQHR5cGUge051bWJlcn1cbiAgICovXG4gIHRoaXMucHJlZmFiQ291bnQgPSByZXBlYXRDb3VudCAqIHRoaXMucHJlZmFiR2VvbWV0cmllc0NvdW50O1xuICAvKipcbiAgICogSG93IG9mdGVuIHRoZSBwcmVmYWIgYXJyYXkgaXMgcmVwZWF0ZWQuXG4gICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAqL1xuICB0aGlzLnJlcGVhdENvdW50ID0gcmVwZWF0Q291bnQ7XG5cbiAgLyoqXG4gICAqIEFycmF5IG9mIHZlcnRleCBjb3VudHMgcGVyIHByZWZhYi5cbiAgICogQHR5cGUge0FycmF5fVxuICAgKi9cbiAgdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudHMgPSB0aGlzLnByZWZhYkdlb21ldHJpZXMubWFwKHAgPT4gcC5pc0J1ZmZlckdlb21ldHJ5ID8gcC5hdHRyaWJ1dGVzLnBvc2l0aW9uLmNvdW50IDogcC52ZXJ0aWNlcy5sZW5ndGgpO1xuICAvKipcbiAgICogVG90YWwgbnVtYmVyIG9mIHZlcnRpY2VzIGZvciBvbmUgcmVwZXRpdGlvbiBvZiB0aGUgcHJlZmFic1xuICAgKiBAdHlwZSB7bnVtYmVyfVxuICAgKi9cbiAgdGhpcy5yZXBlYXRWZXJ0ZXhDb3VudCA9IHRoaXMucHJlZmFiVmVydGV4Q291bnRzLnJlZHVjZSgociwgdikgPT4gciArIHYsIDApO1xuXG4gIHRoaXMuYnVmZmVySW5kaWNlcygpO1xuICB0aGlzLmJ1ZmZlclBvc2l0aW9ucygpO1xufVxuTXVsdGlQcmVmYWJCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZSk7XG5NdWx0aVByZWZhYkJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IE11bHRpUHJlZmFiQnVmZmVyR2VvbWV0cnk7XG5cbk11bHRpUHJlZmFiQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmJ1ZmZlckluZGljZXMgPSBmdW5jdGlvbigpIHtcbiAgbGV0IHJlcGVhdEluZGV4Q291bnQgPSAwO1xuXG4gIHRoaXMucHJlZmFiSW5kaWNlcyA9IHRoaXMucHJlZmFiR2VvbWV0cmllcy5tYXAoZ2VvbWV0cnkgPT4ge1xuICAgIGxldCBpbmRpY2VzID0gW107XG5cbiAgICBpZiAoZ2VvbWV0cnkuaXNCdWZmZXJHZW9tZXRyeSkge1xuICAgICAgaWYgKGdlb21ldHJ5LmluZGV4KSB7XG4gICAgICAgIGluZGljZXMgPSBnZW9tZXRyeS5pbmRleC5hcnJheTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZ2VvbWV0cnkuYXR0cmlidXRlcy5wb3NpdGlvbi5jb3VudDsgaSsrKSB7XG4gICAgICAgICAgaW5kaWNlcy5wdXNoKGkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZ2VvbWV0cnkuZmFjZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgZmFjZSA9IGdlb21ldHJ5LmZhY2VzW2ldO1xuICAgICAgICBpbmRpY2VzLnB1c2goZmFjZS5hLCBmYWNlLmIsIGZhY2UuYyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmVwZWF0SW5kZXhDb3VudCArPSBpbmRpY2VzLmxlbmd0aDtcblxuICAgIHJldHVybiBpbmRpY2VzO1xuICB9KTtcblxuICBjb25zdCBpbmRleEJ1ZmZlciA9IG5ldyBVaW50MzJBcnJheShyZXBlYXRJbmRleENvdW50ICogdGhpcy5yZXBlYXRDb3VudCk7XG4gIGxldCBpbmRleE9mZnNldCA9IDA7XG4gIGxldCBwcmVmYWJPZmZzZXQgPSAwO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5wcmVmYWJDb3VudDsgaSsrKSB7XG4gICAgY29uc3QgaW5kZXggPSBpICUgdGhpcy5wcmVmYWJHZW9tZXRyaWVzQ291bnQ7XG4gICAgY29uc3QgaW5kaWNlcyA9IHRoaXMucHJlZmFiSW5kaWNlc1tpbmRleF07XG4gICAgY29uc3QgdmVydGV4Q291bnQgPSB0aGlzLnByZWZhYlZlcnRleENvdW50c1tpbmRleF07XG5cbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IGluZGljZXMubGVuZ3RoOyBqKyspIHtcbiAgICAgIGluZGV4QnVmZmVyW2luZGV4T2Zmc2V0KytdID0gaW5kaWNlc1tqXSArIHByZWZhYk9mZnNldDtcbiAgICB9XG5cbiAgICBwcmVmYWJPZmZzZXQgKz0gdmVydGV4Q291bnQ7XG4gIH1cblxuICB0aGlzLnNldEluZGV4KG5ldyBCdWZmZXJBdHRyaWJ1dGUoaW5kZXhCdWZmZXIsIDEpKTtcbn07XG5cbk11bHRpUHJlZmFiQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmJ1ZmZlclBvc2l0aW9ucyA9IGZ1bmN0aW9uKCkge1xuICBjb25zdCBwb3NpdGlvbkJ1ZmZlciA9IHRoaXMuY3JlYXRlQXR0cmlidXRlKCdwb3NpdGlvbicsIDMpLmFycmF5O1xuXG4gIGNvbnN0IHByZWZhYlBvc2l0aW9ucyA9IHRoaXMucHJlZmFiR2VvbWV0cmllcy5tYXAoKGdlb21ldHJ5LCBpKSA9PiB7XG4gICAgbGV0IHBvc2l0aW9ucztcblxuICAgIGlmIChnZW9tZXRyeS5pc0J1ZmZlckdlb21ldHJ5KSB7XG4gICAgICBwb3NpdGlvbnMgPSBnZW9tZXRyeS5hdHRyaWJ1dGVzLnBvc2l0aW9uLmFycmF5O1xuICAgIH0gZWxzZSB7XG5cbiAgICAgIGNvbnN0IHZlcnRleENvdW50ID0gdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudHNbaV07XG5cbiAgICAgIHBvc2l0aW9ucyA9IFtdO1xuXG4gICAgICBmb3IgKGxldCBqID0gMCwgb2Zmc2V0ID0gMDsgaiA8IHZlcnRleENvdW50OyBqKyspIHtcbiAgICAgICAgY29uc3QgcHJlZmFiVmVydGV4ID0gZ2VvbWV0cnkudmVydGljZXNbal07XG5cbiAgICAgICAgcG9zaXRpb25zW29mZnNldCsrXSA9IHByZWZhYlZlcnRleC54O1xuICAgICAgICBwb3NpdGlvbnNbb2Zmc2V0KytdID0gcHJlZmFiVmVydGV4Lnk7XG4gICAgICAgIHBvc2l0aW9uc1tvZmZzZXQrK10gPSBwcmVmYWJWZXJ0ZXguejtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gcG9zaXRpb25zO1xuICB9KTtcblxuICBmb3IgKGxldCBpID0gMCwgb2Zmc2V0ID0gMDsgaSA8IHRoaXMucHJlZmFiQ291bnQ7IGkrKykge1xuICAgIGNvbnN0IGluZGV4ID0gaSAlIHRoaXMucHJlZmFiR2VvbWV0cmllcy5sZW5ndGg7XG4gICAgY29uc3QgdmVydGV4Q291bnQgPSB0aGlzLnByZWZhYlZlcnRleENvdW50c1tpbmRleF07XG4gICAgY29uc3QgcG9zaXRpb25zID0gcHJlZmFiUG9zaXRpb25zW2luZGV4XTtcblxuICAgIGZvciAobGV0IGogPSAwOyBqIDwgdmVydGV4Q291bnQ7IGorKykge1xuICAgICAgcG9zaXRpb25CdWZmZXJbb2Zmc2V0KytdID0gcG9zaXRpb25zW2ogKiAzXTtcbiAgICAgIHBvc2l0aW9uQnVmZmVyW29mZnNldCsrXSA9IHBvc2l0aW9uc1tqICogMyArIDFdO1xuICAgICAgcG9zaXRpb25CdWZmZXJbb2Zmc2V0KytdID0gcG9zaXRpb25zW2ogKiAzICsgMl07XG4gICAgfVxuICB9XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBCdWZmZXJBdHRyaWJ1dGUgd2l0aCBVViBjb29yZGluYXRlcy5cbiAqL1xuTXVsdGlQcmVmYWJCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuYnVmZmVyVXZzID0gZnVuY3Rpb24oKSB7XG4gIGNvbnN0IHV2QnVmZmVyID0gdGhpcy5jcmVhdGVBdHRyaWJ1dGUoJ3V2JywgMikuYXJyYXk7XG5cbiAgY29uc3QgcHJlZmFiVXZzID0gdGhpcy5wcmVmYWJHZW9tZXRyaWVzLm1hcCgoZ2VvbWV0cnksIGkpID0+IHtcbiAgICBsZXQgdXZzO1xuXG4gICAgaWYgKGdlb21ldHJ5LmlzQnVmZmVyR2VvbWV0cnkpIHtcbiAgICAgIGlmICghZ2VvbWV0cnkuYXR0cmlidXRlcy51dikge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdObyBVViBmb3VuZCBpbiBwcmVmYWIgZ2VvbWV0cnknLCBnZW9tZXRyeSk7XG4gICAgICB9XG5cbiAgICAgIHV2cyA9IGdlb21ldHJ5LmF0dHJpYnV0ZXMudXYuYXJyYXk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHByZWZhYkZhY2VDb3VudCA9IHRoaXMucHJlZmFiSW5kaWNlc1tpXS5sZW5ndGggLyAzO1xuICAgICAgY29uc3QgdXZPYmplY3RzID0gW107XG5cbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgcHJlZmFiRmFjZUNvdW50OyBqKyspIHtcbiAgICAgICAgY29uc3QgZmFjZSA9IGdlb21ldHJ5LmZhY2VzW2pdO1xuICAgICAgICBjb25zdCB1diA9IGdlb21ldHJ5LmZhY2VWZXJ0ZXhVdnNbMF1bal07XG5cbiAgICAgICAgdXZPYmplY3RzW2ZhY2UuYV0gPSB1dlswXTtcbiAgICAgICAgdXZPYmplY3RzW2ZhY2UuYl0gPSB1dlsxXTtcbiAgICAgICAgdXZPYmplY3RzW2ZhY2UuY10gPSB1dlsyXTtcbiAgICAgIH1cblxuICAgICAgdXZzID0gW107XG5cbiAgICAgIGZvciAobGV0IGsgPSAwOyBrIDwgdXZPYmplY3RzLmxlbmd0aDsgaysrKSB7XG4gICAgICAgIHV2c1trICogMl0gPSB1dk9iamVjdHNba10ueDtcbiAgICAgICAgdXZzW2sgKiAyICsgMV0gPSB1dk9iamVjdHNba10ueTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdXZzO1xuICB9KTtcblxuICBmb3IgKGxldCBpID0gMCwgb2Zmc2V0ID0gMDsgaSA8IHRoaXMucHJlZmFiQ291bnQ7IGkrKykge1xuXG4gICAgY29uc3QgaW5kZXggPSBpICUgdGhpcy5wcmVmYWJHZW9tZXRyaWVzLmxlbmd0aDtcbiAgICBjb25zdCB2ZXJ0ZXhDb3VudCA9IHRoaXMucHJlZmFiVmVydGV4Q291bnRzW2luZGV4XTtcbiAgICBjb25zdCB1dnMgPSBwcmVmYWJVdnNbaW5kZXhdO1xuXG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCB2ZXJ0ZXhDb3VudDsgaisrKSB7XG4gICAgICB1dkJ1ZmZlcltvZmZzZXQrK10gPSB1dnNbaiAqIDJdO1xuICAgICAgdXZCdWZmZXJbb2Zmc2V0KytdID0gdXZzW2ogKiAyICsgMV07XG4gICAgfVxuICB9XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBCdWZmZXJBdHRyaWJ1dGUgb24gdGhpcyBnZW9tZXRyeSBpbnN0YW5jZS5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZSBOYW1lIG9mIHRoZSBhdHRyaWJ1dGUuXG4gKiBAcGFyYW0ge051bWJlcn0gaXRlbVNpemUgTnVtYmVyIG9mIGZsb2F0cyBwZXIgdmVydGV4ICh0eXBpY2FsbHkgMSwgMiwgMyBvciA0KS5cbiAqIEBwYXJhbSB7ZnVuY3Rpb249fSBmYWN0b3J5IEZ1bmN0aW9uIHRoYXQgd2lsbCBiZSBjYWxsZWQgZm9yIGVhY2ggcHJlZmFiIHVwb24gY3JlYXRpb24uIEFjY2VwdHMgMyBhcmd1bWVudHM6IGRhdGFbXSwgaW5kZXggYW5kIHByZWZhYkNvdW50LiBDYWxscyBzZXRQcmVmYWJEYXRhLlxuICpcbiAqIEByZXR1cm5zIHtCdWZmZXJBdHRyaWJ1dGV9XG4gKi9cbk11bHRpUHJlZmFiQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmNyZWF0ZUF0dHJpYnV0ZSA9IGZ1bmN0aW9uKG5hbWUsIGl0ZW1TaXplLCBmYWN0b3J5KSB7XG4gIGNvbnN0IGJ1ZmZlciA9IG5ldyBGbG9hdDMyQXJyYXkodGhpcy5yZXBlYXRDb3VudCAqIHRoaXMucmVwZWF0VmVydGV4Q291bnQgKiBpdGVtU2l6ZSk7XG4gIGNvbnN0IGF0dHJpYnV0ZSA9IG5ldyBCdWZmZXJBdHRyaWJ1dGUoYnVmZmVyLCBpdGVtU2l6ZSk7XG5cbiAgdGhpcy5zZXRBdHRyaWJ1dGUobmFtZSwgYXR0cmlidXRlKTtcblxuICBpZiAoZmFjdG9yeSkge1xuICAgIGNvbnN0IGRhdGEgPSBbXTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5wcmVmYWJDb3VudDsgaSsrKSB7XG4gICAgICBmYWN0b3J5KGRhdGEsIGksIHRoaXMucHJlZmFiQ291bnQpO1xuICAgICAgdGhpcy5zZXRQcmVmYWJEYXRhKGF0dHJpYnV0ZSwgaSwgZGF0YSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGF0dHJpYnV0ZTtcbn07XG5cbi8qKlxuICogU2V0cyBkYXRhIGZvciBhbGwgdmVydGljZXMgb2YgYSBwcmVmYWIgYXQgYSBnaXZlbiBpbmRleC5cbiAqIFVzdWFsbHkgY2FsbGVkIGluIGEgbG9vcC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ3xCdWZmZXJBdHRyaWJ1dGV9IGF0dHJpYnV0ZSBUaGUgYXR0cmlidXRlIG9yIGF0dHJpYnV0ZSBuYW1lIHdoZXJlIHRoZSBkYXRhIGlzIHRvIGJlIHN0b3JlZC5cbiAqIEBwYXJhbSB7TnVtYmVyfSBwcmVmYWJJbmRleCBJbmRleCBvZiB0aGUgcHJlZmFiIGluIHRoZSBidWZmZXIgZ2VvbWV0cnkuXG4gKiBAcGFyYW0ge0FycmF5fSBkYXRhIEFycmF5IG9mIGRhdGEuIExlbmd0aCBzaG91bGQgYmUgZXF1YWwgdG8gaXRlbSBzaXplIG9mIHRoZSBhdHRyaWJ1dGUuXG4gKi9cbk11bHRpUHJlZmFiQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLnNldFByZWZhYkRhdGEgPSBmdW5jdGlvbihhdHRyaWJ1dGUsIHByZWZhYkluZGV4LCBkYXRhKSB7XG4gIGF0dHJpYnV0ZSA9ICh0eXBlb2YgYXR0cmlidXRlID09PSAnc3RyaW5nJykgPyB0aGlzLmF0dHJpYnV0ZXNbYXR0cmlidXRlXSA6IGF0dHJpYnV0ZTtcblxuICBjb25zdCBwcmVmYWJHZW9tZXRyeUluZGV4ID0gcHJlZmFiSW5kZXggJSB0aGlzLnByZWZhYkdlb21ldHJpZXNDb3VudDtcbiAgY29uc3QgcHJlZmFiR2VvbWV0cnlWZXJ0ZXhDb3VudCA9IHRoaXMucHJlZmFiVmVydGV4Q291bnRzW3ByZWZhYkdlb21ldHJ5SW5kZXhdO1xuICBjb25zdCB3aG9sZSA9IChwcmVmYWJJbmRleCAvIHRoaXMucHJlZmFiR2VvbWV0cmllc0NvdW50IHwgMCkgKiB0aGlzLnByZWZhYkdlb21ldHJpZXNDb3VudDtcbiAgY29uc3Qgd2hvbGVPZmZzZXQgPSB3aG9sZSAqIHRoaXMucmVwZWF0VmVydGV4Q291bnQ7XG4gIGNvbnN0IHBhcnQgPSBwcmVmYWJJbmRleCAtIHdob2xlO1xuICBsZXQgcGFydE9mZnNldCA9IDA7XG4gIGxldCBpID0gMDtcblxuICB3aGlsZShpIDwgcGFydCkge1xuICAgIHBhcnRPZmZzZXQgKz0gdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudHNbaSsrXTtcbiAgfVxuXG4gIGxldCBvZmZzZXQgPSAod2hvbGVPZmZzZXQgKyBwYXJ0T2Zmc2V0KSAqIGF0dHJpYnV0ZS5pdGVtU2l6ZTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IHByZWZhYkdlb21ldHJ5VmVydGV4Q291bnQ7IGkrKykge1xuICAgIGZvciAobGV0IGogPSAwOyBqIDwgYXR0cmlidXRlLml0ZW1TaXplOyBqKyspIHtcbiAgICAgIGF0dHJpYnV0ZS5hcnJheVtvZmZzZXQrK10gPSBkYXRhW2pdO1xuICAgIH1cbiAgfVxufTtcblxuZXhwb3J0IHsgTXVsdGlQcmVmYWJCdWZmZXJHZW9tZXRyeSB9O1xuIiwiaW1wb3J0IHsgSW5zdGFuY2VkQnVmZmVyR2VvbWV0cnksIEluc3RhbmNlZEJ1ZmZlckF0dHJpYnV0ZSB9IGZyb20gJ3RocmVlJztcbi8qKlxuICogQSB3cmFwcGVyIGFyb3VuZCBUSFJFRS5JbnN0YW5jZWRCdWZmZXJHZW9tZXRyeSwgd2hpY2ggaXMgbW9yZSBtZW1vcnkgZWZmaWNpZW50IHRoYW4gUHJlZmFiQnVmZmVyR2VvbWV0cnksIGJ1dCByZXF1aXJlcyB0aGUgQU5HTEVfaW5zdGFuY2VkX2FycmF5cyBleHRlbnNpb24uXG4gKlxuICogQHBhcmFtIHtCdWZmZXJHZW9tZXRyeX0gcHJlZmFiIFRoZSBHZW9tZXRyeSBpbnN0YW5jZSB0byByZXBlYXQuXG4gKiBAcGFyYW0ge051bWJlcn0gY291bnQgVGhlIG51bWJlciBvZiB0aW1lcyB0byByZXBlYXQgdGhlIGdlb21ldHJ5LlxuICpcbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBJbnN0YW5jZWRQcmVmYWJCdWZmZXJHZW9tZXRyeShwcmVmYWIsIGNvdW50KSB7XG4gIGlmIChwcmVmYWIuaXNHZW9tZXRyeSA9PT0gdHJ1ZSkge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0luc3RhbmNlZFByZWZhYkJ1ZmZlckdlb21ldHJ5IHByZWZhYiBtdXN0IGJlIGEgQnVmZmVyR2VvbWV0cnkuJylcbiAgfVxuXG4gIEluc3RhbmNlZEJ1ZmZlckdlb21ldHJ5LmNhbGwodGhpcyk7XG5cbiAgdGhpcy5wcmVmYWJHZW9tZXRyeSA9IHByZWZhYjtcbiAgdGhpcy5jb3B5KHByZWZhYilcblxuICB0aGlzLm1heEluc3RhbmNlZENvdW50ID0gY291bnRcbiAgdGhpcy5wcmVmYWJDb3VudCA9IGNvdW50O1xufVxuSW5zdGFuY2VkUHJlZmFiQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShJbnN0YW5jZWRCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUpO1xuSW5zdGFuY2VkUHJlZmFiQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gSW5zdGFuY2VkUHJlZmFiQnVmZmVyR2VvbWV0cnk7XG5cbi8qKlxuICogQ3JlYXRlcyBhIEJ1ZmZlckF0dHJpYnV0ZSBvbiB0aGlzIGdlb21ldHJ5IGluc3RhbmNlLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIE5hbWUgb2YgdGhlIGF0dHJpYnV0ZS5cbiAqIEBwYXJhbSB7TnVtYmVyfSBpdGVtU2l6ZSBOdW1iZXIgb2YgZmxvYXRzIHBlciB2ZXJ0ZXggKHR5cGljYWxseSAxLCAyLCAzIG9yIDQpLlxuICogQHBhcmFtIHtmdW5jdGlvbj19IGZhY3RvcnkgRnVuY3Rpb24gdGhhdCB3aWxsIGJlIGNhbGxlZCBmb3IgZWFjaCBwcmVmYWIgdXBvbiBjcmVhdGlvbi4gQWNjZXB0cyAzIGFyZ3VtZW50czogZGF0YVtdLCBpbmRleCBhbmQgcHJlZmFiQ291bnQuIENhbGxzIHNldFByZWZhYkRhdGEuXG4gKlxuICogQHJldHVybnMge0J1ZmZlckF0dHJpYnV0ZX1cbiAqL1xuSW5zdGFuY2VkUHJlZmFiQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmNyZWF0ZUF0dHJpYnV0ZSA9IGZ1bmN0aW9uKG5hbWUsIGl0ZW1TaXplLCBmYWN0b3J5KSB7XG4gIGNvbnN0IGJ1ZmZlciA9IG5ldyBGbG9hdDMyQXJyYXkodGhpcy5wcmVmYWJDb3VudCAqIGl0ZW1TaXplKTtcbiAgY29uc3QgYXR0cmlidXRlID0gbmV3IEluc3RhbmNlZEJ1ZmZlckF0dHJpYnV0ZShidWZmZXIsIGl0ZW1TaXplKTtcblxuICB0aGlzLnNldEF0dHJpYnV0ZShuYW1lLCBhdHRyaWJ1dGUpO1xuXG4gIGlmIChmYWN0b3J5KSB7XG4gICAgY29uc3QgZGF0YSA9IFtdO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnByZWZhYkNvdW50OyBpKyspIHtcbiAgICAgIGZhY3RvcnkoZGF0YSwgaSwgdGhpcy5wcmVmYWJDb3VudCk7XG4gICAgICB0aGlzLnNldFByZWZhYkRhdGEoYXR0cmlidXRlLCBpLCBkYXRhKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gYXR0cmlidXRlO1xufTtcblxuLyoqXG4gKiBTZXRzIGRhdGEgZm9yIGEgcHJlZmFiIGF0IGEgZ2l2ZW4gaW5kZXguXG4gKiBVc3VhbGx5IGNhbGxlZCBpbiBhIGxvb3AuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd8QnVmZmVyQXR0cmlidXRlfSBhdHRyaWJ1dGUgVGhlIGF0dHJpYnV0ZSBvciBhdHRyaWJ1dGUgbmFtZSB3aGVyZSB0aGUgZGF0YSBpcyB0byBiZSBzdG9yZWQuXG4gKiBAcGFyYW0ge051bWJlcn0gcHJlZmFiSW5kZXggSW5kZXggb2YgdGhlIHByZWZhYiBpbiB0aGUgYnVmZmVyIGdlb21ldHJ5LlxuICogQHBhcmFtIHtBcnJheX0gZGF0YSBBcnJheSBvZiBkYXRhLiBMZW5ndGggc2hvdWxkIGJlIGVxdWFsIHRvIGl0ZW0gc2l6ZSBvZiB0aGUgYXR0cmlidXRlLlxuICovXG5JbnN0YW5jZWRQcmVmYWJCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuc2V0UHJlZmFiRGF0YSA9IGZ1bmN0aW9uKGF0dHJpYnV0ZSwgcHJlZmFiSW5kZXgsIGRhdGEpIHtcbiAgYXR0cmlidXRlID0gKHR5cGVvZiBhdHRyaWJ1dGUgPT09ICdzdHJpbmcnKSA/IHRoaXMuYXR0cmlidXRlc1thdHRyaWJ1dGVdIDogYXR0cmlidXRlO1xuXG4gIGxldCBvZmZzZXQgPSBwcmVmYWJJbmRleCAqIGF0dHJpYnV0ZS5pdGVtU2l6ZTtcblxuICBmb3IgKGxldCBqID0gMDsgaiA8IGF0dHJpYnV0ZS5pdGVtU2l6ZTsgaisrKSB7XG4gICAgYXR0cmlidXRlLmFycmF5W29mZnNldCsrXSA9IGRhdGFbal07XG4gIH1cbn07XG5cbmV4cG9ydCB7IEluc3RhbmNlZFByZWZhYkJ1ZmZlckdlb21ldHJ5IH07XG4iLCJpbXBvcnQgeyBNYXRoIGFzIHRNYXRoLCBWZWN0b3IzIH0gZnJvbSAndGhyZWUnO1xuaW1wb3J0IHsgRGVwdGhBbmltYXRpb25NYXRlcmlhbCB9IGZyb20gJy4vbWF0ZXJpYWxzL0RlcHRoQW5pbWF0aW9uTWF0ZXJpYWwnO1xuaW1wb3J0IHsgRGlzdGFuY2VBbmltYXRpb25NYXRlcmlhbCB9IGZyb20gJy4vbWF0ZXJpYWxzL0Rpc3RhbmNlQW5pbWF0aW9uTWF0ZXJpYWwnO1xuXG4vKipcbiAqIENvbGxlY3Rpb24gb2YgdXRpbGl0eSBmdW5jdGlvbnMuXG4gKiBAbmFtZXNwYWNlXG4gKi9cbmNvbnN0IFV0aWxzID0ge1xuICAvKipcbiAgICogRHVwbGljYXRlcyB2ZXJ0aWNlcyBzbyBlYWNoIGZhY2UgYmVjb21lcyBzZXBhcmF0ZS5cbiAgICogU2FtZSBhcyBUSFJFRS5FeHBsb2RlTW9kaWZpZXIuXG4gICAqXG4gICAqIEBwYXJhbSB7VEhSRUUuR2VvbWV0cnl9IGdlb21ldHJ5IEdlb21ldHJ5IGluc3RhbmNlIHRvIG1vZGlmeS5cbiAgICovXG4gIHNlcGFyYXRlRmFjZXM6IGZ1bmN0aW9uIChnZW9tZXRyeSkge1xuICAgIGxldCB2ZXJ0aWNlcyA9IFtdO1xuXG4gICAgZm9yIChsZXQgaSA9IDAsIGlsID0gZ2VvbWV0cnkuZmFjZXMubGVuZ3RoOyBpIDwgaWw7IGkrKykge1xuICAgICAgbGV0IG4gPSB2ZXJ0aWNlcy5sZW5ndGg7XG4gICAgICBsZXQgZmFjZSA9IGdlb21ldHJ5LmZhY2VzW2ldO1xuXG4gICAgICBsZXQgYSA9IGZhY2UuYTtcbiAgICAgIGxldCBiID0gZmFjZS5iO1xuICAgICAgbGV0IGMgPSBmYWNlLmM7XG5cbiAgICAgIGxldCB2YSA9IGdlb21ldHJ5LnZlcnRpY2VzW2FdO1xuICAgICAgbGV0IHZiID0gZ2VvbWV0cnkudmVydGljZXNbYl07XG4gICAgICBsZXQgdmMgPSBnZW9tZXRyeS52ZXJ0aWNlc1tjXTtcblxuICAgICAgdmVydGljZXMucHVzaCh2YS5jbG9uZSgpKTtcbiAgICAgIHZlcnRpY2VzLnB1c2godmIuY2xvbmUoKSk7XG4gICAgICB2ZXJ0aWNlcy5wdXNoKHZjLmNsb25lKCkpO1xuXG4gICAgICBmYWNlLmEgPSBuO1xuICAgICAgZmFjZS5iID0gbiArIDE7XG4gICAgICBmYWNlLmMgPSBuICsgMjtcbiAgICB9XG5cbiAgICBnZW9tZXRyeS52ZXJ0aWNlcyA9IHZlcnRpY2VzO1xuICB9LFxuXG4gIC8qKlxuICAgKiBDb21wdXRlIHRoZSBjZW50cm9pZCAoY2VudGVyKSBvZiBhIFRIUkVFLkZhY2UzLlxuICAgKlxuICAgKiBAcGFyYW0ge1RIUkVFLkdlb21ldHJ5fSBnZW9tZXRyeSBHZW9tZXRyeSBpbnN0YW5jZSB0aGUgZmFjZSBpcyBpbi5cbiAgICogQHBhcmFtIHtUSFJFRS5GYWNlM30gZmFjZSBGYWNlIG9iamVjdCBmcm9tIHRoZSBUSFJFRS5HZW9tZXRyeS5mYWNlcyBhcnJheVxuICAgKiBAcGFyYW0ge1RIUkVFLlZlY3RvcjM9fSB2IE9wdGlvbmFsIHZlY3RvciB0byBzdG9yZSByZXN1bHQgaW4uXG4gICAqIEByZXR1cm5zIHtUSFJFRS5WZWN0b3IzfVxuICAgKi9cbiAgY29tcHV0ZUNlbnRyb2lkOiBmdW5jdGlvbihnZW9tZXRyeSwgZmFjZSwgdikge1xuICAgIGxldCBhID0gZ2VvbWV0cnkudmVydGljZXNbZmFjZS5hXTtcbiAgICBsZXQgYiA9IGdlb21ldHJ5LnZlcnRpY2VzW2ZhY2UuYl07XG4gICAgbGV0IGMgPSBnZW9tZXRyeS52ZXJ0aWNlc1tmYWNlLmNdO1xuXG4gICAgdiA9IHYgfHwgbmV3IFZlY3RvcjMoKTtcblxuICAgIHYueCA9IChhLnggKyBiLnggKyBjLngpIC8gMztcbiAgICB2LnkgPSAoYS55ICsgYi55ICsgYy55KSAvIDM7XG4gICAgdi56ID0gKGEueiArIGIueiArIGMueikgLyAzO1xuXG4gICAgcmV0dXJuIHY7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEdldCBhIHJhbmRvbSB2ZWN0b3IgYmV0d2VlbiBib3gubWluIGFuZCBib3gubWF4LlxuICAgKlxuICAgKiBAcGFyYW0ge1RIUkVFLkJveDN9IGJveCBUSFJFRS5Cb3gzIGluc3RhbmNlLlxuICAgKiBAcGFyYW0ge1RIUkVFLlZlY3RvcjM9fSB2IE9wdGlvbmFsIHZlY3RvciB0byBzdG9yZSByZXN1bHQgaW4uXG4gICAqIEByZXR1cm5zIHtUSFJFRS5WZWN0b3IzfVxuICAgKi9cbiAgcmFuZG9tSW5Cb3g6IGZ1bmN0aW9uKGJveCwgdikge1xuICAgIHYgPSB2IHx8IG5ldyBWZWN0b3IzKCk7XG5cbiAgICB2LnggPSB0TWF0aC5yYW5kRmxvYXQoYm94Lm1pbi54LCBib3gubWF4LngpO1xuICAgIHYueSA9IHRNYXRoLnJhbmRGbG9hdChib3gubWluLnksIGJveC5tYXgueSk7XG4gICAgdi56ID0gdE1hdGgucmFuZEZsb2F0KGJveC5taW4ueiwgYm94Lm1heC56KTtcblxuICAgIHJldHVybiB2O1xuICB9LFxuXG4gIC8qKlxuICAgKiBHZXQgYSByYW5kb20gYXhpcyBmb3IgcXVhdGVybmlvbiByb3RhdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIHtUSFJFRS5WZWN0b3IzPX0gdiBPcHRpb24gdmVjdG9yIHRvIHN0b3JlIHJlc3VsdCBpbi5cbiAgICogQHJldHVybnMge1RIUkVFLlZlY3RvcjN9XG4gICAqL1xuICByYW5kb21BeGlzOiBmdW5jdGlvbih2KSB7XG4gICAgdiA9IHYgfHwgbmV3IFZlY3RvcjMoKTtcblxuICAgIHYueCA9IHRNYXRoLnJhbmRGbG9hdFNwcmVhZCgyLjApO1xuICAgIHYueSA9IHRNYXRoLnJhbmRGbG9hdFNwcmVhZCgyLjApO1xuICAgIHYueiA9IHRNYXRoLnJhbmRGbG9hdFNwcmVhZCgyLjApO1xuICAgIHYubm9ybWFsaXplKCk7XG5cbiAgICByZXR1cm4gdjtcbiAgfSxcblxuICAvKipcbiAgICogQ3JlYXRlIGEgVEhSRUUuQkFTLkRlcHRoQW5pbWF0aW9uTWF0ZXJpYWwgZm9yIHNoYWRvd3MgZnJvbSBhIFRIUkVFLlNwb3RMaWdodCBvciBUSFJFRS5EaXJlY3Rpb25hbExpZ2h0IGJ5IGNvcHlpbmcgcmVsZXZhbnQgc2hhZGVyIGNodW5rcy5cbiAgICogVW5pZm9ybSB2YWx1ZXMgbXVzdCBiZSBtYW51YWxseSBzeW5jZWQgYmV0d2VlbiB0aGUgc291cmNlIG1hdGVyaWFsIGFuZCB0aGUgZGVwdGggbWF0ZXJpYWwuXG4gICAqXG4gICAqIEBzZWUge0BsaW5rIGh0dHA6Ly90aHJlZS1iYXMtZXhhbXBsZXMuc3VyZ2Uuc2gvZXhhbXBsZXMvc2hhZG93cy99XG4gICAqXG4gICAqIEBwYXJhbSB7VEhSRUUuQkFTLkJhc2VBbmltYXRpb25NYXRlcmlhbH0gc291cmNlTWF0ZXJpYWwgSW5zdGFuY2UgdG8gZ2V0IHRoZSBzaGFkZXIgY2h1bmtzIGZyb20uXG4gICAqIEByZXR1cm5zIHtUSFJFRS5CQVMuRGVwdGhBbmltYXRpb25NYXRlcmlhbH1cbiAgICovXG4gIGNyZWF0ZURlcHRoQW5pbWF0aW9uTWF0ZXJpYWw6IGZ1bmN0aW9uKHNvdXJjZU1hdGVyaWFsKSB7XG4gICAgcmV0dXJuIG5ldyBEZXB0aEFuaW1hdGlvbk1hdGVyaWFsKHtcbiAgICAgIHVuaWZvcm1zOiBzb3VyY2VNYXRlcmlhbC51bmlmb3JtcyxcbiAgICAgIGRlZmluZXM6IHNvdXJjZU1hdGVyaWFsLmRlZmluZXMsXG4gICAgICB2ZXJ0ZXhGdW5jdGlvbnM6IHNvdXJjZU1hdGVyaWFsLnZlcnRleEZ1bmN0aW9ucyxcbiAgICAgIHZlcnRleFBhcmFtZXRlcnM6IHNvdXJjZU1hdGVyaWFsLnZlcnRleFBhcmFtZXRlcnMsXG4gICAgICB2ZXJ0ZXhJbml0OiBzb3VyY2VNYXRlcmlhbC52ZXJ0ZXhJbml0LFxuICAgICAgdmVydGV4UG9zaXRpb246IHNvdXJjZU1hdGVyaWFsLnZlcnRleFBvc2l0aW9uXG4gICAgfSk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIFRIUkVFLkJBUy5EaXN0YW5jZUFuaW1hdGlvbk1hdGVyaWFsIGZvciBzaGFkb3dzIGZyb20gYSBUSFJFRS5Qb2ludExpZ2h0IGJ5IGNvcHlpbmcgcmVsZXZhbnQgc2hhZGVyIGNodW5rcy5cbiAgICogVW5pZm9ybSB2YWx1ZXMgbXVzdCBiZSBtYW51YWxseSBzeW5jZWQgYmV0d2VlbiB0aGUgc291cmNlIG1hdGVyaWFsIGFuZCB0aGUgZGlzdGFuY2UgbWF0ZXJpYWwuXG4gICAqXG4gICAqIEBzZWUge0BsaW5rIGh0dHA6Ly90aHJlZS1iYXMtZXhhbXBsZXMuc3VyZ2Uuc2gvZXhhbXBsZXMvc2hhZG93cy99XG4gICAqXG4gICAqIEBwYXJhbSB7VEhSRUUuQkFTLkJhc2VBbmltYXRpb25NYXRlcmlhbH0gc291cmNlTWF0ZXJpYWwgSW5zdGFuY2UgdG8gZ2V0IHRoZSBzaGFkZXIgY2h1bmtzIGZyb20uXG4gICAqIEByZXR1cm5zIHtUSFJFRS5CQVMuRGlzdGFuY2VBbmltYXRpb25NYXRlcmlhbH1cbiAgICovXG4gIGNyZWF0ZURpc3RhbmNlQW5pbWF0aW9uTWF0ZXJpYWw6IGZ1bmN0aW9uKHNvdXJjZU1hdGVyaWFsKSB7XG4gICAgcmV0dXJuIG5ldyBEaXN0YW5jZUFuaW1hdGlvbk1hdGVyaWFsKHtcbiAgICAgIHVuaWZvcm1zOiBzb3VyY2VNYXRlcmlhbC51bmlmb3JtcyxcbiAgICAgIGRlZmluZXM6IHNvdXJjZU1hdGVyaWFsLmRlZmluZXMsXG4gICAgICB2ZXJ0ZXhGdW5jdGlvbnM6IHNvdXJjZU1hdGVyaWFsLnZlcnRleEZ1bmN0aW9ucyxcbiAgICAgIHZlcnRleFBhcmFtZXRlcnM6IHNvdXJjZU1hdGVyaWFsLnZlcnRleFBhcmFtZXRlcnMsXG4gICAgICB2ZXJ0ZXhJbml0OiBzb3VyY2VNYXRlcmlhbC52ZXJ0ZXhJbml0LFxuICAgICAgdmVydGV4UG9zaXRpb246IHNvdXJjZU1hdGVyaWFsLnZlcnRleFBvc2l0aW9uXG4gICAgfSk7XG4gIH1cbn07XG5cbmV4cG9ydCB7IFV0aWxzIH07XG4iLCJpbXBvcnQgeyBCdWZmZXJHZW9tZXRyeSwgQnVmZmVyQXR0cmlidXRlIH0gZnJvbSAndGhyZWUnO1xuaW1wb3J0IHsgVXRpbHMgfSBmcm9tICcuLi9VdGlscyc7XG5cbi8qKlxuICogQSBUSFJFRS5CdWZmZXJHZW9tZXRyeSBmb3IgYW5pbWF0aW5nIGluZGl2aWR1YWwgZmFjZXMgb2YgYSBUSFJFRS5HZW9tZXRyeS5cbiAqXG4gKiBAcGFyYW0ge1RIUkVFLkdlb21ldHJ5fSBtb2RlbCBUaGUgVEhSRUUuR2VvbWV0cnkgdG8gYmFzZSB0aGlzIGdlb21ldHJ5IG9uLlxuICogQHBhcmFtIHtPYmplY3Q9fSBvcHRpb25zXG4gKiBAcGFyYW0ge0Jvb2xlYW49fSBvcHRpb25zLmNvbXB1dGVDZW50cm9pZHMgSWYgdHJ1ZSwgYSBjZW50cm9pZHMgd2lsbCBiZSBjb21wdXRlZCBmb3IgZWFjaCBmYWNlIGFuZCBzdG9yZWQgaW4gVEhSRUUuQkFTLk1vZGVsQnVmZmVyR2VvbWV0cnkuY2VudHJvaWRzLlxuICogQHBhcmFtIHtCb29sZWFuPX0gb3B0aW9ucy5sb2NhbGl6ZUZhY2VzIElmIHRydWUsIHRoZSBwb3NpdGlvbnMgZm9yIGVhY2ggZmFjZSB3aWxsIGJlIHN0b3JlZCByZWxhdGl2ZSB0byB0aGUgY2VudHJvaWQuIFRoaXMgaXMgdXNlZnVsIGlmIHlvdSB3YW50IHRvIHJvdGF0ZSBvciBzY2FsZSBmYWNlcyBhcm91bmQgdGhlaXIgY2VudGVyLlxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIE1vZGVsQnVmZmVyR2VvbWV0cnkobW9kZWwsIG9wdGlvbnMpIHtcbiAgQnVmZmVyR2VvbWV0cnkuY2FsbCh0aGlzKTtcblxuICAvKipcbiAgICogQSByZWZlcmVuY2UgdG8gdGhlIGdlb21ldHJ5IHVzZWQgdG8gY3JlYXRlIHRoaXMgaW5zdGFuY2UuXG4gICAqIEB0eXBlIHtUSFJFRS5HZW9tZXRyeX1cbiAgICovXG4gIHRoaXMubW9kZWxHZW9tZXRyeSA9IG1vZGVsO1xuXG4gIC8qKlxuICAgKiBOdW1iZXIgb2YgZmFjZXMgb2YgdGhlIG1vZGVsLlxuICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgKi9cbiAgdGhpcy5mYWNlQ291bnQgPSB0aGlzLm1vZGVsR2VvbWV0cnkuZmFjZXMubGVuZ3RoO1xuXG4gIC8qKlxuICAgKiBOdW1iZXIgb2YgdmVydGljZXMgb2YgdGhlIG1vZGVsLlxuICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgKi9cbiAgdGhpcy52ZXJ0ZXhDb3VudCA9IHRoaXMubW9kZWxHZW9tZXRyeS52ZXJ0aWNlcy5sZW5ndGg7XG5cbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gIG9wdGlvbnMuY29tcHV0ZUNlbnRyb2lkcyAmJiB0aGlzLmNvbXB1dGVDZW50cm9pZHMoKTtcblxuICB0aGlzLmJ1ZmZlckluZGljZXMoKTtcbiAgdGhpcy5idWZmZXJQb3NpdGlvbnMob3B0aW9ucy5sb2NhbGl6ZUZhY2VzKTtcbn1cbk1vZGVsQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUpO1xuTW9kZWxCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBNb2RlbEJ1ZmZlckdlb21ldHJ5O1xuXG4vKipcbiAqIENvbXB1dGVzIGEgY2VudHJvaWQgZm9yIGVhY2ggZmFjZSBhbmQgc3RvcmVzIGl0IGluIFRIUkVFLkJBUy5Nb2RlbEJ1ZmZlckdlb21ldHJ5LmNlbnRyb2lkcy5cbiAqL1xuTW9kZWxCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuY29tcHV0ZUNlbnRyb2lkcyA9IGZ1bmN0aW9uKCkge1xuICAvKipcbiAgICogQW4gYXJyYXkgb2YgY2VudHJvaWRzIGNvcnJlc3BvbmRpbmcgdG8gdGhlIGZhY2VzIG9mIHRoZSBtb2RlbC5cbiAgICpcbiAgICogQHR5cGUge0FycmF5fVxuICAgKi9cbiAgdGhpcy5jZW50cm9pZHMgPSBbXTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuZmFjZUNvdW50OyBpKyspIHtcbiAgICB0aGlzLmNlbnRyb2lkc1tpXSA9IFV0aWxzLmNvbXB1dGVDZW50cm9pZCh0aGlzLm1vZGVsR2VvbWV0cnksIHRoaXMubW9kZWxHZW9tZXRyeS5mYWNlc1tpXSk7XG4gIH1cbn07XG5cbk1vZGVsQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmJ1ZmZlckluZGljZXMgPSBmdW5jdGlvbigpIHtcbiAgY29uc3QgaW5kZXhCdWZmZXIgPSBuZXcgVWludDMyQXJyYXkodGhpcy5mYWNlQ291bnQgKiAzKTtcblxuICB0aGlzLnNldEluZGV4KG5ldyBCdWZmZXJBdHRyaWJ1dGUoaW5kZXhCdWZmZXIsIDEpKTtcblxuICBmb3IgKGxldCBpID0gMCwgb2Zmc2V0ID0gMDsgaSA8IHRoaXMuZmFjZUNvdW50OyBpKyssIG9mZnNldCArPSAzKSB7XG4gICAgY29uc3QgZmFjZSA9IHRoaXMubW9kZWxHZW9tZXRyeS5mYWNlc1tpXTtcblxuICAgIGluZGV4QnVmZmVyW29mZnNldCAgICBdID0gZmFjZS5hO1xuICAgIGluZGV4QnVmZmVyW29mZnNldCArIDFdID0gZmFjZS5iO1xuICAgIGluZGV4QnVmZmVyW29mZnNldCArIDJdID0gZmFjZS5jO1xuICB9XG59O1xuXG5Nb2RlbEJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5idWZmZXJQb3NpdGlvbnMgPSBmdW5jdGlvbihsb2NhbGl6ZUZhY2VzKSB7XG4gIGNvbnN0IHBvc2l0aW9uQnVmZmVyID0gdGhpcy5jcmVhdGVBdHRyaWJ1dGUoJ3Bvc2l0aW9uJywgMykuYXJyYXk7XG4gIGxldCBpLCBvZmZzZXQ7XG5cbiAgaWYgKGxvY2FsaXplRmFjZXMgPT09IHRydWUpIHtcbiAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5mYWNlQ291bnQ7IGkrKykge1xuICAgICAgY29uc3QgZmFjZSA9IHRoaXMubW9kZWxHZW9tZXRyeS5mYWNlc1tpXTtcbiAgICAgIGNvbnN0IGNlbnRyb2lkID0gdGhpcy5jZW50cm9pZHMgPyB0aGlzLmNlbnRyb2lkc1tpXSA6IFV0aWxzLmNvbXB1dGVDZW50cm9pZCh0aGlzLm1vZGVsR2VvbWV0cnksIGZhY2UpO1xuXG4gICAgICBjb25zdCBhID0gdGhpcy5tb2RlbEdlb21ldHJ5LnZlcnRpY2VzW2ZhY2UuYV07XG4gICAgICBjb25zdCBiID0gdGhpcy5tb2RlbEdlb21ldHJ5LnZlcnRpY2VzW2ZhY2UuYl07XG4gICAgICBjb25zdCBjID0gdGhpcy5tb2RlbEdlb21ldHJ5LnZlcnRpY2VzW2ZhY2UuY107XG5cbiAgICAgIHBvc2l0aW9uQnVmZmVyW2ZhY2UuYSAqIDNdICAgICA9IGEueCAtIGNlbnRyb2lkLng7XG4gICAgICBwb3NpdGlvbkJ1ZmZlcltmYWNlLmEgKiAzICsgMV0gPSBhLnkgLSBjZW50cm9pZC55O1xuICAgICAgcG9zaXRpb25CdWZmZXJbZmFjZS5hICogMyArIDJdID0gYS56IC0gY2VudHJvaWQuejtcblxuICAgICAgcG9zaXRpb25CdWZmZXJbZmFjZS5iICogM10gICAgID0gYi54IC0gY2VudHJvaWQueDtcbiAgICAgIHBvc2l0aW9uQnVmZmVyW2ZhY2UuYiAqIDMgKyAxXSA9IGIueSAtIGNlbnRyb2lkLnk7XG4gICAgICBwb3NpdGlvbkJ1ZmZlcltmYWNlLmIgKiAzICsgMl0gPSBiLnogLSBjZW50cm9pZC56O1xuXG4gICAgICBwb3NpdGlvbkJ1ZmZlcltmYWNlLmMgKiAzXSAgICAgPSBjLnggLSBjZW50cm9pZC54O1xuICAgICAgcG9zaXRpb25CdWZmZXJbZmFjZS5jICogMyArIDFdID0gYy55IC0gY2VudHJvaWQueTtcbiAgICAgIHBvc2l0aW9uQnVmZmVyW2ZhY2UuYyAqIDMgKyAyXSA9IGMueiAtIGNlbnRyb2lkLno7XG4gICAgfVxuICB9XG4gIGVsc2Uge1xuICAgIGZvciAoaSA9IDAsIG9mZnNldCA9IDA7IGkgPCB0aGlzLnZlcnRleENvdW50OyBpKyssIG9mZnNldCArPSAzKSB7XG4gICAgICBjb25zdCB2ZXJ0ZXggPSB0aGlzLm1vZGVsR2VvbWV0cnkudmVydGljZXNbaV07XG5cbiAgICAgIHBvc2l0aW9uQnVmZmVyW29mZnNldCAgICBdID0gdmVydGV4Lng7XG4gICAgICBwb3NpdGlvbkJ1ZmZlcltvZmZzZXQgKyAxXSA9IHZlcnRleC55O1xuICAgICAgcG9zaXRpb25CdWZmZXJbb2Zmc2V0ICsgMl0gPSB2ZXJ0ZXguejtcbiAgICB9XG4gIH1cbn07XG5cbi8qKlxuICogQ3JlYXRlcyBhIFRIUkVFLkJ1ZmZlckF0dHJpYnV0ZSB3aXRoIFVWIGNvb3JkaW5hdGVzLlxuICovXG5Nb2RlbEJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5idWZmZXJVdnMgPSBmdW5jdGlvbigpIHtcbiAgY29uc3QgdXZCdWZmZXIgPSB0aGlzLmNyZWF0ZUF0dHJpYnV0ZSgndXYnLCAyKS5hcnJheTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuZmFjZUNvdW50OyBpKyspIHtcblxuICAgIGNvbnN0IGZhY2UgPSB0aGlzLm1vZGVsR2VvbWV0cnkuZmFjZXNbaV07XG4gICAgbGV0IHV2O1xuXG4gICAgdXYgPSB0aGlzLm1vZGVsR2VvbWV0cnkuZmFjZVZlcnRleFV2c1swXVtpXVswXTtcbiAgICB1dkJ1ZmZlcltmYWNlLmEgKiAyXSAgICAgPSB1di54O1xuICAgIHV2QnVmZmVyW2ZhY2UuYSAqIDIgKyAxXSA9IHV2Lnk7XG5cbiAgICB1diA9IHRoaXMubW9kZWxHZW9tZXRyeS5mYWNlVmVydGV4VXZzWzBdW2ldWzFdO1xuICAgIHV2QnVmZmVyW2ZhY2UuYiAqIDJdICAgICA9IHV2Lng7XG4gICAgdXZCdWZmZXJbZmFjZS5iICogMiArIDFdID0gdXYueTtcblxuICAgIHV2ID0gdGhpcy5tb2RlbEdlb21ldHJ5LmZhY2VWZXJ0ZXhVdnNbMF1baV1bMl07XG4gICAgdXZCdWZmZXJbZmFjZS5jICogMl0gICAgID0gdXYueDtcbiAgICB1dkJ1ZmZlcltmYWNlLmMgKiAyICsgMV0gPSB1di55O1xuICB9XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgdHdvIFRIUkVFLkJ1ZmZlckF0dHJpYnV0ZXM6IHNraW5JbmRleCBhbmQgc2tpbldlaWdodC4gQm90aCBhcmUgcmVxdWlyZWQgZm9yIHNraW5uaW5nLlxuICovXG5Nb2RlbEJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5idWZmZXJTa2lubmluZyA9IGZ1bmN0aW9uKCkge1xuICBjb25zdCBza2luSW5kZXhCdWZmZXIgPSB0aGlzLmNyZWF0ZUF0dHJpYnV0ZSgnc2tpbkluZGV4JywgNCkuYXJyYXk7XG4gIGNvbnN0IHNraW5XZWlnaHRCdWZmZXIgPSB0aGlzLmNyZWF0ZUF0dHJpYnV0ZSgnc2tpbldlaWdodCcsIDQpLmFycmF5O1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy52ZXJ0ZXhDb3VudDsgaSsrKSB7XG4gICAgY29uc3Qgc2tpbkluZGV4ID0gdGhpcy5tb2RlbEdlb21ldHJ5LnNraW5JbmRpY2VzW2ldO1xuICAgIGNvbnN0IHNraW5XZWlnaHQgPSB0aGlzLm1vZGVsR2VvbWV0cnkuc2tpbldlaWdodHNbaV07XG5cbiAgICBza2luSW5kZXhCdWZmZXJbaSAqIDQgICAgXSA9IHNraW5JbmRleC54O1xuICAgIHNraW5JbmRleEJ1ZmZlcltpICogNCArIDFdID0gc2tpbkluZGV4Lnk7XG4gICAgc2tpbkluZGV4QnVmZmVyW2kgKiA0ICsgMl0gPSBza2luSW5kZXguejtcbiAgICBza2luSW5kZXhCdWZmZXJbaSAqIDQgKyAzXSA9IHNraW5JbmRleC53O1xuXG4gICAgc2tpbldlaWdodEJ1ZmZlcltpICogNCAgICBdID0gc2tpbldlaWdodC54O1xuICAgIHNraW5XZWlnaHRCdWZmZXJbaSAqIDQgKyAxXSA9IHNraW5XZWlnaHQueTtcbiAgICBza2luV2VpZ2h0QnVmZmVyW2kgKiA0ICsgMl0gPSBza2luV2VpZ2h0Lno7XG4gICAgc2tpbldlaWdodEJ1ZmZlcltpICogNCArIDNdID0gc2tpbldlaWdodC53O1xuICB9XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBUSFJFRS5CdWZmZXJBdHRyaWJ1dGUgb24gdGhpcyBnZW9tZXRyeSBpbnN0YW5jZS5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZSBOYW1lIG9mIHRoZSBhdHRyaWJ1dGUuXG4gKiBAcGFyYW0ge2ludH0gaXRlbVNpemUgTnVtYmVyIG9mIGZsb2F0cyBwZXIgdmVydGV4ICh0eXBpY2FsbHkgMSwgMiwgMyBvciA0KS5cbiAqIEBwYXJhbSB7ZnVuY3Rpb249fSBmYWN0b3J5IEZ1bmN0aW9uIHRoYXQgd2lsbCBiZSBjYWxsZWQgZm9yIGVhY2ggZmFjZSB1cG9uIGNyZWF0aW9uLiBBY2NlcHRzIDMgYXJndW1lbnRzOiBkYXRhW10sIGluZGV4IGFuZCBmYWNlQ291bnQuIENhbGxzIHNldEZhY2VEYXRhLlxuICpcbiAqIEByZXR1cm5zIHtCdWZmZXJBdHRyaWJ1dGV9XG4gKi9cbk1vZGVsQnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLmNyZWF0ZUF0dHJpYnV0ZSA9IGZ1bmN0aW9uKG5hbWUsIGl0ZW1TaXplLCBmYWN0b3J5KSB7XG4gIGNvbnN0IGJ1ZmZlciA9IG5ldyBGbG9hdDMyQXJyYXkodGhpcy52ZXJ0ZXhDb3VudCAqIGl0ZW1TaXplKTtcbiAgY29uc3QgYXR0cmlidXRlID0gbmV3IEJ1ZmZlckF0dHJpYnV0ZShidWZmZXIsIGl0ZW1TaXplKTtcblxuICB0aGlzLnNldEF0dHJpYnV0ZShuYW1lLCBhdHRyaWJ1dGUpO1xuXG4gIGlmIChmYWN0b3J5KSB7XG4gICAgY29uc3QgZGF0YSA9IFtdO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmZhY2VDb3VudDsgaSsrKSB7XG4gICAgICBmYWN0b3J5KGRhdGEsIGksIHRoaXMuZmFjZUNvdW50KTtcbiAgICAgIHRoaXMuc2V0RmFjZURhdGEoYXR0cmlidXRlLCBpLCBkYXRhKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gYXR0cmlidXRlO1xufTtcblxuLyoqXG4gKiBTZXRzIGRhdGEgZm9yIGFsbCB2ZXJ0aWNlcyBvZiBhIGZhY2UgYXQgYSBnaXZlbiBpbmRleC5cbiAqIFVzdWFsbHkgY2FsbGVkIGluIGEgbG9vcC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ3xUSFJFRS5CdWZmZXJBdHRyaWJ1dGV9IGF0dHJpYnV0ZSBUaGUgYXR0cmlidXRlIG9yIGF0dHJpYnV0ZSBuYW1lIHdoZXJlIHRoZSBkYXRhIGlzIHRvIGJlIHN0b3JlZC5cbiAqIEBwYXJhbSB7aW50fSBmYWNlSW5kZXggSW5kZXggb2YgdGhlIGZhY2UgaW4gdGhlIGJ1ZmZlciBnZW9tZXRyeS5cbiAqIEBwYXJhbSB7QXJyYXl9IGRhdGEgQXJyYXkgb2YgZGF0YS4gTGVuZ3RoIHNob3VsZCBiZSBlcXVhbCB0byBpdGVtIHNpemUgb2YgdGhlIGF0dHJpYnV0ZS5cbiAqL1xuTW9kZWxCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuc2V0RmFjZURhdGEgPSBmdW5jdGlvbihhdHRyaWJ1dGUsIGZhY2VJbmRleCwgZGF0YSkge1xuICBhdHRyaWJ1dGUgPSAodHlwZW9mIGF0dHJpYnV0ZSA9PT0gJ3N0cmluZycpID8gdGhpcy5hdHRyaWJ1dGVzW2F0dHJpYnV0ZV0gOiBhdHRyaWJ1dGU7XG5cbiAgbGV0IG9mZnNldCA9IGZhY2VJbmRleCAqIDMgKiBhdHRyaWJ1dGUuaXRlbVNpemU7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCAzOyBpKyspIHtcbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IGF0dHJpYnV0ZS5pdGVtU2l6ZTsgaisrKSB7XG4gICAgICBhdHRyaWJ1dGUuYXJyYXlbb2Zmc2V0KytdID0gZGF0YVtqXTtcbiAgICB9XG4gIH1cbn07XG5cbmV4cG9ydCB7IE1vZGVsQnVmZmVyR2VvbWV0cnkgfTtcbiIsImltcG9ydCB7IEJ1ZmZlckdlb21ldHJ5LCBCdWZmZXJBdHRyaWJ1dGUgfSBmcm9tICd0aHJlZSc7XG5cbi8qKlxuICogQSBUSFJFRS5CdWZmZXJHZW9tZXRyeSBjb25zaXN0cyBvZiBwb2ludHMuXG4gKiBAcGFyYW0ge051bWJlcn0gY291bnQgVGhlIG51bWJlciBvZiBwb2ludHMuXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gUG9pbnRCdWZmZXJHZW9tZXRyeShjb3VudCkge1xuICBCdWZmZXJHZW9tZXRyeS5jYWxsKHRoaXMpO1xuXG4gIC8qKlxuICAgKiBOdW1iZXIgb2YgcG9pbnRzLlxuICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgKi9cbiAgdGhpcy5wb2ludENvdW50ID0gY291bnQ7XG5cbiAgdGhpcy5idWZmZXJQb3NpdGlvbnMoKTtcbn1cblBvaW50QnVmZmVyR2VvbWV0cnkucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUpO1xuUG9pbnRCdWZmZXJHZW9tZXRyeS5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBQb2ludEJ1ZmZlckdlb21ldHJ5O1xuXG5Qb2ludEJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5idWZmZXJQb3NpdGlvbnMgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5jcmVhdGVBdHRyaWJ1dGUoJ3Bvc2l0aW9uJywgMyk7XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBUSFJFRS5CdWZmZXJBdHRyaWJ1dGUgb24gdGhpcyBnZW9tZXRyeSBpbnN0YW5jZS5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZSBOYW1lIG9mIHRoZSBhdHRyaWJ1dGUuXG4gKiBAcGFyYW0ge051bWJlcn0gaXRlbVNpemUgTnVtYmVyIG9mIGZsb2F0cyBwZXIgdmVydGV4ICh0eXBpY2FsbHkgMSwgMiwgMyBvciA0KS5cbiAqIEBwYXJhbSB7ZnVuY3Rpb249fSBmYWN0b3J5IEZ1bmN0aW9uIHRoYXQgd2lsbCBiZSBjYWxsZWQgZm9yIGVhY2ggcG9pbnQgdXBvbiBjcmVhdGlvbi4gQWNjZXB0cyAzIGFyZ3VtZW50czogZGF0YVtdLCBpbmRleCBhbmQgcHJlZmFiQ291bnQuIENhbGxzIHNldFBvaW50RGF0YS5cbiAqXG4gKiBAcmV0dXJucyB7VEhSRUUuQnVmZmVyQXR0cmlidXRlfVxuICovXG5Qb2ludEJ1ZmZlckdlb21ldHJ5LnByb3RvdHlwZS5jcmVhdGVBdHRyaWJ1dGUgPSBmdW5jdGlvbihuYW1lLCBpdGVtU2l6ZSwgZmFjdG9yeSkge1xuICBjb25zdCBidWZmZXIgPSBuZXcgRmxvYXQzMkFycmF5KHRoaXMucG9pbnRDb3VudCAqIGl0ZW1TaXplKTtcbiAgY29uc3QgYXR0cmlidXRlID0gbmV3IEJ1ZmZlckF0dHJpYnV0ZShidWZmZXIsIGl0ZW1TaXplKTtcblxuICB0aGlzLnNldEF0dHJpYnV0ZShuYW1lLCBhdHRyaWJ1dGUpO1xuXG4gIGlmIChmYWN0b3J5KSB7XG4gICAgY29uc3QgZGF0YSA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5wb2ludENvdW50OyBpKyspIHtcbiAgICAgIGZhY3RvcnkoZGF0YSwgaSwgdGhpcy5wb2ludENvdW50KTtcbiAgICAgIHRoaXMuc2V0UG9pbnREYXRhKGF0dHJpYnV0ZSwgaSwgZGF0YSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGF0dHJpYnV0ZTtcbn07XG5cblBvaW50QnVmZmVyR2VvbWV0cnkucHJvdG90eXBlLnNldFBvaW50RGF0YSA9IGZ1bmN0aW9uKGF0dHJpYnV0ZSwgcG9pbnRJbmRleCwgZGF0YSkge1xuICBhdHRyaWJ1dGUgPSAodHlwZW9mIGF0dHJpYnV0ZSA9PT0gJ3N0cmluZycpID8gdGhpcy5hdHRyaWJ1dGVzW2F0dHJpYnV0ZV0gOiBhdHRyaWJ1dGU7XG5cbiAgbGV0IG9mZnNldCA9IHBvaW50SW5kZXggKiBhdHRyaWJ1dGUuaXRlbVNpemU7XG5cbiAgZm9yIChsZXQgaiA9IDA7IGogPCBhdHRyaWJ1dGUuaXRlbVNpemU7IGorKykge1xuICAgIGF0dHJpYnV0ZS5hcnJheVtvZmZzZXQrK10gPSBkYXRhW2pdO1xuICB9XG59O1xuXG5leHBvcnQgeyBQb2ludEJ1ZmZlckdlb21ldHJ5IH07XG4iLCIvLyBnZW5lcmF0ZWQgYnkgc2NyaXB0cy9idWlsZF9zaGFkZXJfY2h1bmtzLmpzXG5cbmltcG9ydCBjYXRtdWxsX3JvbV9zcGxpbmUgZnJvbSAnLi9nbHNsL2NhdG11bGxfcm9tX3NwbGluZS5nbHNsJztcbmltcG9ydCBjdWJpY19iZXppZXIgZnJvbSAnLi9nbHNsL2N1YmljX2Jlemllci5nbHNsJztcbmltcG9ydCBlYXNlX2JhY2tfaW4gZnJvbSAnLi9nbHNsL2Vhc2VfYmFja19pbi5nbHNsJztcbmltcG9ydCBlYXNlX2JhY2tfaW5fb3V0IGZyb20gJy4vZ2xzbC9lYXNlX2JhY2tfaW5fb3V0Lmdsc2wnO1xuaW1wb3J0IGVhc2VfYmFja19vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfYmFja19vdXQuZ2xzbCc7XG5pbXBvcnQgZWFzZV9iZXppZXIgZnJvbSAnLi9nbHNsL2Vhc2VfYmV6aWVyLmdsc2wnO1xuaW1wb3J0IGVhc2VfYm91bmNlX2luIGZyb20gJy4vZ2xzbC9lYXNlX2JvdW5jZV9pbi5nbHNsJztcbmltcG9ydCBlYXNlX2JvdW5jZV9pbl9vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfYm91bmNlX2luX291dC5nbHNsJztcbmltcG9ydCBlYXNlX2JvdW5jZV9vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfYm91bmNlX291dC5nbHNsJztcbmltcG9ydCBlYXNlX2NpcmNfaW4gZnJvbSAnLi9nbHNsL2Vhc2VfY2lyY19pbi5nbHNsJztcbmltcG9ydCBlYXNlX2NpcmNfaW5fb3V0IGZyb20gJy4vZ2xzbC9lYXNlX2NpcmNfaW5fb3V0Lmdsc2wnO1xuaW1wb3J0IGVhc2VfY2lyY19vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfY2lyY19vdXQuZ2xzbCc7XG5pbXBvcnQgZWFzZV9jdWJpY19pbiBmcm9tICcuL2dsc2wvZWFzZV9jdWJpY19pbi5nbHNsJztcbmltcG9ydCBlYXNlX2N1YmljX2luX291dCBmcm9tICcuL2dsc2wvZWFzZV9jdWJpY19pbl9vdXQuZ2xzbCc7XG5pbXBvcnQgZWFzZV9jdWJpY19vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfY3ViaWNfb3V0Lmdsc2wnO1xuaW1wb3J0IGVhc2VfZWxhc3RpY19pbiBmcm9tICcuL2dsc2wvZWFzZV9lbGFzdGljX2luLmdsc2wnO1xuaW1wb3J0IGVhc2VfZWxhc3RpY19pbl9vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfZWxhc3RpY19pbl9vdXQuZ2xzbCc7XG5pbXBvcnQgZWFzZV9lbGFzdGljX291dCBmcm9tICcuL2dsc2wvZWFzZV9lbGFzdGljX291dC5nbHNsJztcbmltcG9ydCBlYXNlX2V4cG9faW4gZnJvbSAnLi9nbHNsL2Vhc2VfZXhwb19pbi5nbHNsJztcbmltcG9ydCBlYXNlX2V4cG9faW5fb3V0IGZyb20gJy4vZ2xzbC9lYXNlX2V4cG9faW5fb3V0Lmdsc2wnO1xuaW1wb3J0IGVhc2VfZXhwb19vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfZXhwb19vdXQuZ2xzbCc7XG5pbXBvcnQgZWFzZV9xdWFkX2luIGZyb20gJy4vZ2xzbC9lYXNlX3F1YWRfaW4uZ2xzbCc7XG5pbXBvcnQgZWFzZV9xdWFkX2luX291dCBmcm9tICcuL2dsc2wvZWFzZV9xdWFkX2luX291dC5nbHNsJztcbmltcG9ydCBlYXNlX3F1YWRfb3V0IGZyb20gJy4vZ2xzbC9lYXNlX3F1YWRfb3V0Lmdsc2wnO1xuaW1wb3J0IGVhc2VfcXVhcnRfaW4gZnJvbSAnLi9nbHNsL2Vhc2VfcXVhcnRfaW4uZ2xzbCc7XG5pbXBvcnQgZWFzZV9xdWFydF9pbl9vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfcXVhcnRfaW5fb3V0Lmdsc2wnO1xuaW1wb3J0IGVhc2VfcXVhcnRfb3V0IGZyb20gJy4vZ2xzbC9lYXNlX3F1YXJ0X291dC5nbHNsJztcbmltcG9ydCBlYXNlX3F1aW50X2luIGZyb20gJy4vZ2xzbC9lYXNlX3F1aW50X2luLmdsc2wnO1xuaW1wb3J0IGVhc2VfcXVpbnRfaW5fb3V0IGZyb20gJy4vZ2xzbC9lYXNlX3F1aW50X2luX291dC5nbHNsJztcbmltcG9ydCBlYXNlX3F1aW50X291dCBmcm9tICcuL2dsc2wvZWFzZV9xdWludF9vdXQuZ2xzbCc7XG5pbXBvcnQgZWFzZV9zaW5lX2luIGZyb20gJy4vZ2xzbC9lYXNlX3NpbmVfaW4uZ2xzbCc7XG5pbXBvcnQgZWFzZV9zaW5lX2luX291dCBmcm9tICcuL2dsc2wvZWFzZV9zaW5lX2luX291dC5nbHNsJztcbmltcG9ydCBlYXNlX3NpbmVfb3V0IGZyb20gJy4vZ2xzbC9lYXNlX3NpbmVfb3V0Lmdsc2wnO1xuaW1wb3J0IHF1YWRyYXRpY19iZXppZXIgZnJvbSAnLi9nbHNsL3F1YWRyYXRpY19iZXppZXIuZ2xzbCc7XG5pbXBvcnQgcXVhdGVybmlvbl9yb3RhdGlvbiBmcm9tICcuL2dsc2wvcXVhdGVybmlvbl9yb3RhdGlvbi5nbHNsJztcbmltcG9ydCBxdWF0ZXJuaW9uX3NsZXJwIGZyb20gJy4vZ2xzbC9xdWF0ZXJuaW9uX3NsZXJwLmdsc2wnO1xuXG5cbmV4cG9ydCBjb25zdCBTaGFkZXJDaHVuayA9IHtcbiAgY2F0bXVsbF9yb21fc3BsaW5lOiBjYXRtdWxsX3JvbV9zcGxpbmUsXG4gIGN1YmljX2JlemllcjogY3ViaWNfYmV6aWVyLFxuICBlYXNlX2JhY2tfaW46IGVhc2VfYmFja19pbixcbiAgZWFzZV9iYWNrX2luX291dDogZWFzZV9iYWNrX2luX291dCxcbiAgZWFzZV9iYWNrX291dDogZWFzZV9iYWNrX291dCxcbiAgZWFzZV9iZXppZXI6IGVhc2VfYmV6aWVyLFxuICBlYXNlX2JvdW5jZV9pbjogZWFzZV9ib3VuY2VfaW4sXG4gIGVhc2VfYm91bmNlX2luX291dDogZWFzZV9ib3VuY2VfaW5fb3V0LFxuICBlYXNlX2JvdW5jZV9vdXQ6IGVhc2VfYm91bmNlX291dCxcbiAgZWFzZV9jaXJjX2luOiBlYXNlX2NpcmNfaW4sXG4gIGVhc2VfY2lyY19pbl9vdXQ6IGVhc2VfY2lyY19pbl9vdXQsXG4gIGVhc2VfY2lyY19vdXQ6IGVhc2VfY2lyY19vdXQsXG4gIGVhc2VfY3ViaWNfaW46IGVhc2VfY3ViaWNfaW4sXG4gIGVhc2VfY3ViaWNfaW5fb3V0OiBlYXNlX2N1YmljX2luX291dCxcbiAgZWFzZV9jdWJpY19vdXQ6IGVhc2VfY3ViaWNfb3V0LFxuICBlYXNlX2VsYXN0aWNfaW46IGVhc2VfZWxhc3RpY19pbixcbiAgZWFzZV9lbGFzdGljX2luX291dDogZWFzZV9lbGFzdGljX2luX291dCxcbiAgZWFzZV9lbGFzdGljX291dDogZWFzZV9lbGFzdGljX291dCxcbiAgZWFzZV9leHBvX2luOiBlYXNlX2V4cG9faW4sXG4gIGVhc2VfZXhwb19pbl9vdXQ6IGVhc2VfZXhwb19pbl9vdXQsXG4gIGVhc2VfZXhwb19vdXQ6IGVhc2VfZXhwb19vdXQsXG4gIGVhc2VfcXVhZF9pbjogZWFzZV9xdWFkX2luLFxuICBlYXNlX3F1YWRfaW5fb3V0OiBlYXNlX3F1YWRfaW5fb3V0LFxuICBlYXNlX3F1YWRfb3V0OiBlYXNlX3F1YWRfb3V0LFxuICBlYXNlX3F1YXJ0X2luOiBlYXNlX3F1YXJ0X2luLFxuICBlYXNlX3F1YXJ0X2luX291dDogZWFzZV9xdWFydF9pbl9vdXQsXG4gIGVhc2VfcXVhcnRfb3V0OiBlYXNlX3F1YXJ0X291dCxcbiAgZWFzZV9xdWludF9pbjogZWFzZV9xdWludF9pbixcbiAgZWFzZV9xdWludF9pbl9vdXQ6IGVhc2VfcXVpbnRfaW5fb3V0LFxuICBlYXNlX3F1aW50X291dDogZWFzZV9xdWludF9vdXQsXG4gIGVhc2Vfc2luZV9pbjogZWFzZV9zaW5lX2luLFxuICBlYXNlX3NpbmVfaW5fb3V0OiBlYXNlX3NpbmVfaW5fb3V0LFxuICBlYXNlX3NpbmVfb3V0OiBlYXNlX3NpbmVfb3V0LFxuICBxdWFkcmF0aWNfYmV6aWVyOiBxdWFkcmF0aWNfYmV6aWVyLFxuICBxdWF0ZXJuaW9uX3JvdGF0aW9uOiBxdWF0ZXJuaW9uX3JvdGF0aW9uLFxuICBxdWF0ZXJuaW9uX3NsZXJwOiBxdWF0ZXJuaW9uX3NsZXJwLFxuXG59O1xuXG4iLCIvKipcbiAqIEEgdGltZWxpbmUgdHJhbnNpdGlvbiBzZWdtZW50LiBBbiBpbnN0YW5jZSBvZiB0aGlzIGNsYXNzIGlzIGNyZWF0ZWQgaW50ZXJuYWxseSB3aGVuIGNhbGxpbmcge0BsaW5rIFRIUkVFLkJBUy5UaW1lbGluZS5hZGR9LCBzbyB5b3Ugc2hvdWxkIG5vdCB1c2UgdGhpcyBjbGFzcyBkaXJlY3RseS5cbiAqIFRoZSBpbnN0YW5jZSBpcyBhbHNvIHBhc3NlZCB0aGUgdGhlIGNvbXBpbGVyIGZ1bmN0aW9uIGlmIHlvdSByZWdpc3RlciBhIHRyYW5zaXRpb24gdGhyb3VnaCB7QGxpbmsgVEhSRUUuQkFTLlRpbWVsaW5lLnJlZ2lzdGVyfS4gVGhlcmUgeW91IGNhbiB1c2UgdGhlIHB1YmxpYyBwcm9wZXJ0aWVzIG9mIHRoZSBzZWdtZW50IHRvIGNvbXBpbGUgdGhlIGdsc2wgc3RyaW5nLlxuICogQHBhcmFtIHtzdHJpbmd9IGtleSBBIHN0cmluZyBrZXkgZ2VuZXJhdGVkIGJ5IHRoZSB0aW1lbGluZSB0byB3aGljaCB0aGlzIHNlZ21lbnQgYmVsb25ncy4gS2V5cyBhcmUgdW5pcXVlLlxuICogQHBhcmFtIHtudW1iZXJ9IHN0YXJ0IFN0YXJ0IHRpbWUgb2YgdGhpcyBzZWdtZW50IGluIGEgdGltZWxpbmUgaW4gc2Vjb25kcy5cbiAqIEBwYXJhbSB7bnVtYmVyfSBkdXJhdGlvbiBEdXJhdGlvbiBvZiB0aGlzIHNlZ21lbnQgaW4gc2Vjb25kcy5cbiAqIEBwYXJhbSB7b2JqZWN0fSB0cmFuc2l0aW9uIE9iamVjdCBkZXNjcmliaW5nIHRoZSB0cmFuc2l0aW9uLlxuICogQHBhcmFtIHtmdW5jdGlvbn0gY29tcGlsZXIgQSByZWZlcmVuY2UgdG8gdGhlIGNvbXBpbGVyIGZ1bmN0aW9uIGZyb20gYSB0cmFuc2l0aW9uIGRlZmluaXRpb24uXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gVGltZWxpbmVTZWdtZW50KGtleSwgc3RhcnQsIGR1cmF0aW9uLCB0cmFuc2l0aW9uLCBjb21waWxlcikge1xuICB0aGlzLmtleSA9IGtleTtcbiAgdGhpcy5zdGFydCA9IHN0YXJ0O1xuICB0aGlzLmR1cmF0aW9uID0gZHVyYXRpb247XG4gIHRoaXMudHJhbnNpdGlvbiA9IHRyYW5zaXRpb247XG4gIHRoaXMuY29tcGlsZXIgPSBjb21waWxlcjtcblxuICB0aGlzLnRyYWlsID0gMDtcbn1cblxuVGltZWxpbmVTZWdtZW50LnByb3RvdHlwZS5jb21waWxlID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLmNvbXBpbGVyKHRoaXMpO1xufTtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KFRpbWVsaW5lU2VnbWVudC5wcm90b3R5cGUsICdlbmQnLCB7XG4gIGdldDogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuc3RhcnQgKyB0aGlzLmR1cmF0aW9uO1xuICB9XG59KTtcblxuZXhwb3J0IHsgVGltZWxpbmVTZWdtZW50IH07XG4iLCJpbXBvcnQgeyBUaW1lbGluZVNlZ21lbnQgfSBmcm9tICcuL1RpbWVsaW5lU2VnbWVudCc7XG5cbi8qKlxuICogQSB1dGlsaXR5IGNsYXNzIHRvIGNyZWF0ZSBhbiBhbmltYXRpb24gdGltZWxpbmUgd2hpY2ggY2FuIGJlIGJha2VkIGludG8gYSAodmVydGV4KSBzaGFkZXIuXG4gKiBCeSBkZWZhdWx0IHRoZSB0aW1lbGluZSBzdXBwb3J0cyB0cmFuc2xhdGlvbiwgc2NhbGUgYW5kIHJvdGF0aW9uLiBUaGlzIGNhbiBiZSBleHRlbmRlZCBvciBvdmVycmlkZGVuLlxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIFRpbWVsaW5lKCkge1xuICAvKipcbiAgICogVGhlIHRvdGFsIGR1cmF0aW9uIG9mIHRoZSB0aW1lbGluZSBpbiBzZWNvbmRzLlxuICAgKiBAdHlwZSB7bnVtYmVyfVxuICAgKi9cbiAgdGhpcy5kdXJhdGlvbiA9IDA7XG5cbiAgLyoqXG4gICAqIFRoZSBuYW1lIG9mIHRoZSB2YWx1ZSB0aGF0IHNlZ21lbnRzIHdpbGwgdXNlIHRvIHJlYWQgdGhlIHRpbWUuIERlZmF1bHRzIHRvICd0VGltZScuXG4gICAqIEB0eXBlIHtzdHJpbmd9XG4gICAqL1xuICB0aGlzLnRpbWVLZXkgPSAndFRpbWUnO1xuXG4gIHRoaXMuc2VnbWVudHMgPSB7fTtcbiAgdGhpcy5fX2tleSA9IDA7XG59XG5cbi8vIHN0YXRpYyBkZWZpbml0aW9ucyBtYXBcblRpbWVsaW5lLnNlZ21lbnREZWZpbml0aW9ucyA9IHt9O1xuXG4vKipcbiAqIFJlZ2lzdGVycyBhIHRyYW5zaXRpb24gZGVmaW5pdGlvbiBmb3IgdXNlIHdpdGgge0BsaW5rIFRIUkVFLkJBUy5UaW1lbGluZS5hZGR9LlxuICogQHBhcmFtIHtTdHJpbmd9IGtleSBOYW1lIG9mIHRoZSB0cmFuc2l0aW9uLiBEZWZhdWx0cyBpbmNsdWRlICdzY2FsZScsICdyb3RhdGUnIGFuZCAndHJhbnNsYXRlJy5cbiAqIEBwYXJhbSB7T2JqZWN0fSBkZWZpbml0aW9uXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBkZWZpbml0aW9uLmNvbXBpbGVyIEEgZnVuY3Rpb24gdGhhdCBnZW5lcmF0ZXMgYSBnbHNsIHN0cmluZyBmb3IgYSB0cmFuc2l0aW9uIHNlZ21lbnQuIEFjY2VwdHMgYSBUSFJFRS5CQVMuVGltZWxpbmVTZWdtZW50IGFzIHRoZSBzb2xlIGFyZ3VtZW50LlxuICogQHBhcmFtIHsqfSBkZWZpbml0aW9uLmRlZmF1bHRGcm9tIFRoZSBpbml0aWFsIHZhbHVlIGZvciBhIHRyYW5zZm9ybS5mcm9tLiBGb3IgZXhhbXBsZSwgdGhlIGRlZmF1bHRGcm9tIGZvciBhIHRyYW5zbGF0aW9uIGlzIFRIUkVFLlZlY3RvcjMoMCwgMCwgMCkuXG4gKiBAc3RhdGljXG4gKi9cblRpbWVsaW5lLnJlZ2lzdGVyID0gZnVuY3Rpb24oa2V5LCBkZWZpbml0aW9uKSB7XG4gIFRpbWVsaW5lLnNlZ21lbnREZWZpbml0aW9uc1trZXldID0gZGVmaW5pdGlvbjtcbiAgXG4gIHJldHVybiBkZWZpbml0aW9uO1xufTtcblxuLyoqXG4gKiBBZGQgYSB0cmFuc2l0aW9uIHRvIHRoZSB0aW1lbGluZS5cbiAqIEBwYXJhbSB7bnVtYmVyfSBkdXJhdGlvbiBEdXJhdGlvbiBpbiBzZWNvbmRzXG4gKiBAcGFyYW0ge29iamVjdH0gdHJhbnNpdGlvbnMgQW4gb2JqZWN0IGNvbnRhaW5pbmcgb25lIG9yIHNldmVyYWwgdHJhbnNpdGlvbnMuIFRoZSBrZXlzIHNob3VsZCBtYXRjaCB0cmFuc2Zvcm0gZGVmaW5pdGlvbnMuXG4gKiBUaGUgdHJhbnNpdGlvbiBvYmplY3QgZm9yIGVhY2gga2V5IHdpbGwgYmUgcGFzc2VkIHRvIHRoZSBtYXRjaGluZyBkZWZpbml0aW9uJ3MgY29tcGlsZXIuIEl0IGNhbiBoYXZlIGFyYml0cmFyeSBwcm9wZXJ0aWVzLCBidXQgdGhlIFRpbWVsaW5lIGV4cGVjdHMgYXQgbGVhc3QgYSAndG8nLCAnZnJvbScgYW5kIGFuIG9wdGlvbmFsICdlYXNlJy5cbiAqIEBwYXJhbSB7bnVtYmVyfHN0cmluZ30gW3Bvc2l0aW9uT2Zmc2V0XSBQb3NpdGlvbiBpbiB0aGUgdGltZWxpbmUuIERlZmF1bHRzIHRvIHRoZSBlbmQgb2YgdGhlIHRpbWVsaW5lLiBJZiBhIG51bWJlciBpcyBwcm92aWRlZCwgdGhlIHRyYW5zaXRpb24gd2lsbCBiZSBpbnNlcnRlZCBhdCB0aGF0IHRpbWUgaW4gc2Vjb25kcy4gU3RyaW5ncyAoJys9eCcgb3IgJy09eCcpIGNhbiBiZSB1c2VkIGZvciBhIHZhbHVlIHJlbGF0aXZlIHRvIHRoZSBlbmQgb2YgdGltZWxpbmUuXG4gKi9cblRpbWVsaW5lLnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbihkdXJhdGlvbiwgdHJhbnNpdGlvbnMsIHBvc2l0aW9uT2Zmc2V0KSB7XG4gIC8vIHN0b3Agcm9sbHVwIGZyb20gY29tcGxhaW5pbmcgYWJvdXQgZXZhbFxuICBjb25zdCBfZXZhbCA9IGV2YWw7XG4gIFxuICBsZXQgc3RhcnQgPSB0aGlzLmR1cmF0aW9uO1xuXG4gIGlmIChwb3NpdGlvbk9mZnNldCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgaWYgKHR5cGVvZiBwb3NpdGlvbk9mZnNldCA9PT0gJ251bWJlcicpIHtcbiAgICAgIHN0YXJ0ID0gcG9zaXRpb25PZmZzZXQ7XG4gICAgfVxuICAgIGVsc2UgaWYgKHR5cGVvZiBwb3NpdGlvbk9mZnNldCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIF9ldmFsKCdzdGFydCcgKyBwb3NpdGlvbk9mZnNldCk7XG4gICAgfVxuXG4gICAgdGhpcy5kdXJhdGlvbiA9IE1hdGgubWF4KHRoaXMuZHVyYXRpb24sIHN0YXJ0ICsgZHVyYXRpb24pO1xuICB9XG4gIGVsc2Uge1xuICAgIHRoaXMuZHVyYXRpb24gKz0gZHVyYXRpb247XG4gIH1cblxuICBsZXQga2V5cyA9IE9iamVjdC5rZXlzKHRyYW5zaXRpb25zKSwga2V5O1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7IGkrKykge1xuICAgIGtleSA9IGtleXNbaV07XG5cbiAgICB0aGlzLnByb2Nlc3NUcmFuc2l0aW9uKGtleSwgdHJhbnNpdGlvbnNba2V5XSwgc3RhcnQsIGR1cmF0aW9uKTtcbiAgfVxufTtcblxuVGltZWxpbmUucHJvdG90eXBlLnByb2Nlc3NUcmFuc2l0aW9uID0gZnVuY3Rpb24oa2V5LCB0cmFuc2l0aW9uLCBzdGFydCwgZHVyYXRpb24pIHtcbiAgY29uc3QgZGVmaW5pdGlvbiA9IFRpbWVsaW5lLnNlZ21lbnREZWZpbml0aW9uc1trZXldO1xuXG4gIGxldCBzZWdtZW50cyA9IHRoaXMuc2VnbWVudHNba2V5XTtcbiAgaWYgKCFzZWdtZW50cykgc2VnbWVudHMgPSB0aGlzLnNlZ21lbnRzW2tleV0gPSBbXTtcblxuICBpZiAodHJhbnNpdGlvbi5mcm9tID09PSB1bmRlZmluZWQpIHtcbiAgICBpZiAoc2VnbWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICB0cmFuc2l0aW9uLmZyb20gPSBkZWZpbml0aW9uLmRlZmF1bHRGcm9tO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHRyYW5zaXRpb24uZnJvbSA9IHNlZ21lbnRzW3NlZ21lbnRzLmxlbmd0aCAtIDFdLnRyYW5zaXRpb24udG87XG4gICAgfVxuICB9XG5cbiAgc2VnbWVudHMucHVzaChuZXcgVGltZWxpbmVTZWdtZW50KCh0aGlzLl9fa2V5KyspLnRvU3RyaW5nKCksIHN0YXJ0LCBkdXJhdGlvbiwgdHJhbnNpdGlvbiwgZGVmaW5pdGlvbi5jb21waWxlcikpO1xufTtcblxuLyoqXG4gKiBDb21waWxlcyB0aGUgdGltZWxpbmUgaW50byBhIGdsc2wgc3RyaW5nIGFycmF5IHRoYXQgY2FuIGJlIGluamVjdGVkIGludG8gYSAodmVydGV4KSBzaGFkZXIuXG4gKiBAcmV0dXJucyB7QXJyYXl9XG4gKi9cblRpbWVsaW5lLnByb3RvdHlwZS5jb21waWxlID0gZnVuY3Rpb24oKSB7XG4gIGNvbnN0IGMgPSBbXTtcblxuICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXModGhpcy5zZWdtZW50cyk7XG4gIGxldCBzZWdtZW50cztcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyBpKyspIHtcbiAgICBzZWdtZW50cyA9IHRoaXMuc2VnbWVudHNba2V5c1tpXV07XG5cbiAgICB0aGlzLmZpbGxHYXBzKHNlZ21lbnRzKTtcblxuICAgIHNlZ21lbnRzLmZvckVhY2goZnVuY3Rpb24ocykge1xuICAgICAgYy5wdXNoKHMuY29tcGlsZSgpKTtcbiAgICB9KTtcbiAgfVxuXG4gIHJldHVybiBjO1xufTtcblRpbWVsaW5lLnByb3RvdHlwZS5maWxsR2FwcyA9IGZ1bmN0aW9uKHNlZ21lbnRzKSB7XG4gIGlmIChzZWdtZW50cy5sZW5ndGggPT09IDApIHJldHVybjtcblxuICBsZXQgczAsIHMxO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgc2VnbWVudHMubGVuZ3RoIC0gMTsgaSsrKSB7XG4gICAgczAgPSBzZWdtZW50c1tpXTtcbiAgICBzMSA9IHNlZ21lbnRzW2kgKyAxXTtcblxuICAgIHMwLnRyYWlsID0gczEuc3RhcnQgLSBzMC5lbmQ7XG4gIH1cblxuICAvLyBwYWQgbGFzdCBzZWdtZW50IHVudGlsIGVuZCBvZiB0aW1lbGluZVxuICBzMCA9IHNlZ21lbnRzW3NlZ21lbnRzLmxlbmd0aCAtIDFdO1xuICBzMC50cmFpbCA9IHRoaXMuZHVyYXRpb24gLSBzMC5lbmQ7XG59O1xuXG4vKipcbiAqIEdldCBhIGNvbXBpbGVkIGdsc2wgc3RyaW5nIHdpdGggY2FsbHMgdG8gdHJhbnNmb3JtIGZ1bmN0aW9ucyBmb3IgYSBnaXZlbiBrZXkuXG4gKiBUaGUgb3JkZXIgaW4gd2hpY2ggdGhlc2UgdHJhbnNpdGlvbnMgYXJlIGFwcGxpZWQgbWF0dGVycyBiZWNhdXNlIHRoZXkgYWxsIG9wZXJhdGUgb24gdGhlIHNhbWUgdmFsdWUuXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IEEga2V5IG1hdGNoaW5nIGEgdHJhbnNmb3JtIGRlZmluaXRpb24uXG4gKiBAcmV0dXJucyB7c3RyaW5nfVxuICovXG5UaW1lbGluZS5wcm90b3R5cGUuZ2V0VHJhbnNmb3JtQ2FsbHMgPSBmdW5jdGlvbihrZXkpIHtcbiAgbGV0IHQgPSB0aGlzLnRpbWVLZXk7XG5cbiAgcmV0dXJuIHRoaXMuc2VnbWVudHNba2V5XSA/ICB0aGlzLnNlZ21lbnRzW2tleV0ubWFwKGZ1bmN0aW9uKHMpIHtcbiAgICByZXR1cm4gYGFwcGx5VHJhbnNmb3JtJHtzLmtleX0oJHt0fSwgdHJhbnNmb3JtZWQpO2A7XG4gIH0pLmpvaW4oJ1xcbicpIDogJyc7XG59O1xuXG5leHBvcnQgeyBUaW1lbGluZSB9XG4iLCJjb25zdCBUaW1lbGluZUNodW5rcyA9IHtcbiAgdmVjMzogZnVuY3Rpb24obiwgdiwgcCkge1xuICAgIGNvbnN0IHggPSAodi54IHx8IDApLnRvUHJlY2lzaW9uKHApO1xuICAgIGNvbnN0IHkgPSAodi55IHx8IDApLnRvUHJlY2lzaW9uKHApO1xuICAgIGNvbnN0IHogPSAodi56IHx8IDApLnRvUHJlY2lzaW9uKHApO1xuXG4gICAgcmV0dXJuIGB2ZWMzICR7bn0gPSB2ZWMzKCR7eH0sICR7eX0sICR7en0pO2A7XG4gIH0sXG4gIHZlYzQ6IGZ1bmN0aW9uKG4sIHYsIHApIHtcbiAgICBjb25zdCB4ID0gKHYueCB8fCAwKS50b1ByZWNpc2lvbihwKTtcbiAgICBjb25zdCB5ID0gKHYueSB8fCAwKS50b1ByZWNpc2lvbihwKTtcbiAgICBjb25zdCB6ID0gKHYueiB8fCAwKS50b1ByZWNpc2lvbihwKTtcbiAgICBjb25zdCB3ID0gKHYudyB8fCAwKS50b1ByZWNpc2lvbihwKTtcbiAgXG4gICAgcmV0dXJuIGB2ZWM0ICR7bn0gPSB2ZWM0KCR7eH0sICR7eX0sICR7en0sICR7d30pO2A7XG4gIH0sXG4gIGRlbGF5RHVyYXRpb246IGZ1bmN0aW9uKHNlZ21lbnQpIHtcbiAgICByZXR1cm4gYFxuICAgIGZsb2F0IGNEZWxheSR7c2VnbWVudC5rZXl9ID0gJHtzZWdtZW50LnN0YXJ0LnRvUHJlY2lzaW9uKDQpfTtcbiAgICBmbG9hdCBjRHVyYXRpb24ke3NlZ21lbnQua2V5fSA9ICR7c2VnbWVudC5kdXJhdGlvbi50b1ByZWNpc2lvbig0KX07XG4gICAgYDtcbiAgfSxcbiAgcHJvZ3Jlc3M6IGZ1bmN0aW9uKHNlZ21lbnQpIHtcbiAgICAvLyB6ZXJvIGR1cmF0aW9uIHNlZ21lbnRzIHNob3VsZCBhbHdheXMgcmVuZGVyIGNvbXBsZXRlXG4gICAgaWYgKHNlZ21lbnQuZHVyYXRpb24gPT09IDApIHtcbiAgICAgIHJldHVybiBgZmxvYXQgcHJvZ3Jlc3MgPSAxLjA7YFxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHJldHVybiBgXG4gICAgICBmbG9hdCBwcm9ncmVzcyA9IGNsYW1wKHRpbWUgLSBjRGVsYXkke3NlZ21lbnQua2V5fSwgMC4wLCBjRHVyYXRpb24ke3NlZ21lbnQua2V5fSkgLyBjRHVyYXRpb24ke3NlZ21lbnQua2V5fTtcbiAgICAgICR7c2VnbWVudC50cmFuc2l0aW9uLmVhc2UgPyBgcHJvZ3Jlc3MgPSAke3NlZ21lbnQudHJhbnNpdGlvbi5lYXNlfShwcm9ncmVzcyR7KHNlZ21lbnQudHJhbnNpdGlvbi5lYXNlUGFyYW1zID8gYCwgJHtzZWdtZW50LnRyYW5zaXRpb24uZWFzZVBhcmFtcy5tYXAoKHYpID0+IHYudG9QcmVjaXNpb24oNCkpLmpvaW4oYCwgYCl9YCA6IGBgKX0pO2AgOiBgYH1cbiAgICAgIGA7XG4gICAgfVxuICB9LFxuICByZW5kZXJDaGVjazogZnVuY3Rpb24oc2VnbWVudCkge1xuICAgIGNvbnN0IHN0YXJ0VGltZSA9IHNlZ21lbnQuc3RhcnQudG9QcmVjaXNpb24oNCk7XG4gICAgY29uc3QgZW5kVGltZSA9IChzZWdtZW50LmVuZCArIHNlZ21lbnQudHJhaWwpLnRvUHJlY2lzaW9uKDQpO1xuXG4gICAgcmV0dXJuIGBpZiAodGltZSA8ICR7c3RhcnRUaW1lfSB8fCB0aW1lID4gJHtlbmRUaW1lfSkgcmV0dXJuO2A7XG4gIH1cbn07XG5cbmV4cG9ydCB7IFRpbWVsaW5lQ2h1bmtzIH07XG4iLCJpbXBvcnQgeyBUaW1lbGluZSB9IGZyb20gJy4vVGltZWxpbmUnO1xuaW1wb3J0IHsgVGltZWxpbmVDaHVua3MgfSBmcm9tICcuL1RpbWVsaW5lQ2h1bmtzJztcbmltcG9ydCB7IFZlY3RvcjMgfSBmcm9tICd0aHJlZSc7XG5cbmNvbnN0IFRyYW5zbGF0aW9uU2VnbWVudCA9IHtcbiAgY29tcGlsZXI6IGZ1bmN0aW9uKHNlZ21lbnQpIHtcbiAgICByZXR1cm4gYFxuICAgICR7VGltZWxpbmVDaHVua3MuZGVsYXlEdXJhdGlvbihzZWdtZW50KX1cbiAgICAke1RpbWVsaW5lQ2h1bmtzLnZlYzMoYGNUcmFuc2xhdGVGcm9tJHtzZWdtZW50LmtleX1gLCBzZWdtZW50LnRyYW5zaXRpb24uZnJvbSwgMil9XG4gICAgJHtUaW1lbGluZUNodW5rcy52ZWMzKGBjVHJhbnNsYXRlVG8ke3NlZ21lbnQua2V5fWAsIHNlZ21lbnQudHJhbnNpdGlvbi50bywgMil9XG4gICAgXG4gICAgdm9pZCBhcHBseVRyYW5zZm9ybSR7c2VnbWVudC5rZXl9KGZsb2F0IHRpbWUsIGlub3V0IHZlYzMgdikge1xuICAgIFxuICAgICAgJHtUaW1lbGluZUNodW5rcy5yZW5kZXJDaGVjayhzZWdtZW50KX1cbiAgICAgICR7VGltZWxpbmVDaHVua3MucHJvZ3Jlc3Moc2VnbWVudCl9XG4gICAgXG4gICAgICB2ICs9IG1peChjVHJhbnNsYXRlRnJvbSR7c2VnbWVudC5rZXl9LCBjVHJhbnNsYXRlVG8ke3NlZ21lbnQua2V5fSwgcHJvZ3Jlc3MpO1xuICAgIH1cbiAgICBgO1xuICB9LFxuICBkZWZhdWx0RnJvbTogbmV3IFZlY3RvcjMoMCwgMCwgMClcbn07XG5cblRpbWVsaW5lLnJlZ2lzdGVyKCd0cmFuc2xhdGUnLCBUcmFuc2xhdGlvblNlZ21lbnQpO1xuXG5leHBvcnQgeyBUcmFuc2xhdGlvblNlZ21lbnQgfTtcbiIsImltcG9ydCB7IFRpbWVsaW5lIH0gZnJvbSAnLi9UaW1lbGluZSc7XG5pbXBvcnQgeyBUaW1lbGluZUNodW5rcyB9IGZyb20gJy4vVGltZWxpbmVDaHVua3MnO1xuaW1wb3J0IHsgVmVjdG9yMyB9IGZyb20gJ3RocmVlJztcblxuY29uc3QgU2NhbGVTZWdtZW50ID0ge1xuICBjb21waWxlcjogZnVuY3Rpb24oc2VnbWVudCkge1xuICAgIGNvbnN0IG9yaWdpbiA9IHNlZ21lbnQudHJhbnNpdGlvbi5vcmlnaW47XG4gICAgXG4gICAgcmV0dXJuIGBcbiAgICAke1RpbWVsaW5lQ2h1bmtzLmRlbGF5RHVyYXRpb24oc2VnbWVudCl9XG4gICAgJHtUaW1lbGluZUNodW5rcy52ZWMzKGBjU2NhbGVGcm9tJHtzZWdtZW50LmtleX1gLCBzZWdtZW50LnRyYW5zaXRpb24uZnJvbSwgMil9XG4gICAgJHtUaW1lbGluZUNodW5rcy52ZWMzKGBjU2NhbGVUbyR7c2VnbWVudC5rZXl9YCwgc2VnbWVudC50cmFuc2l0aW9uLnRvLCAyKX1cbiAgICAke29yaWdpbiA/IFRpbWVsaW5lQ2h1bmtzLnZlYzMoYGNPcmlnaW4ke3NlZ21lbnQua2V5fWAsIG9yaWdpbiwgMikgOiAnJ31cbiAgICBcbiAgICB2b2lkIGFwcGx5VHJhbnNmb3JtJHtzZWdtZW50LmtleX0oZmxvYXQgdGltZSwgaW5vdXQgdmVjMyB2KSB7XG4gICAgXG4gICAgICAke1RpbWVsaW5lQ2h1bmtzLnJlbmRlckNoZWNrKHNlZ21lbnQpfVxuICAgICAgJHtUaW1lbGluZUNodW5rcy5wcm9ncmVzcyhzZWdtZW50KX1cbiAgICBcbiAgICAgICR7b3JpZ2luID8gYHYgLT0gY09yaWdpbiR7c2VnbWVudC5rZXl9O2AgOiAnJ31cbiAgICAgIHYgKj0gbWl4KGNTY2FsZUZyb20ke3NlZ21lbnQua2V5fSwgY1NjYWxlVG8ke3NlZ21lbnQua2V5fSwgcHJvZ3Jlc3MpO1xuICAgICAgJHtvcmlnaW4gPyBgdiArPSBjT3JpZ2luJHtzZWdtZW50LmtleX07YCA6ICcnfVxuICAgIH1cbiAgICBgO1xuICB9LFxuICBkZWZhdWx0RnJvbTogbmV3IFZlY3RvcjMoMSwgMSwgMSlcbn07XG5cblRpbWVsaW5lLnJlZ2lzdGVyKCdzY2FsZScsIFNjYWxlU2VnbWVudCk7XG5cbmV4cG9ydCB7IFNjYWxlU2VnbWVudCB9O1xuIiwiaW1wb3J0IHsgVGltZWxpbmUgfSBmcm9tICcuL1RpbWVsaW5lJztcbmltcG9ydCB7IFRpbWVsaW5lQ2h1bmtzIH0gZnJvbSAnLi9UaW1lbGluZUNodW5rcyc7XG5pbXBvcnQgeyBWZWN0b3IzLCBWZWN0b3I0IH0gZnJvbSAndGhyZWUnO1xuXG5jb25zdCBSb3RhdGlvblNlZ21lbnQgPSB7XG4gIGNvbXBpbGVyKHNlZ21lbnQpIHtcbiAgICBjb25zdCBmcm9tQXhpc0FuZ2xlID0gbmV3IFZlY3RvcjQoXG4gICAgICBzZWdtZW50LnRyYW5zaXRpb24uZnJvbS5heGlzLngsXG4gICAgICBzZWdtZW50LnRyYW5zaXRpb24uZnJvbS5heGlzLnksXG4gICAgICBzZWdtZW50LnRyYW5zaXRpb24uZnJvbS5heGlzLnosXG4gICAgICBzZWdtZW50LnRyYW5zaXRpb24uZnJvbS5hbmdsZVxuICAgICk7XG4gIFxuICAgIGNvbnN0IHRvQXhpcyA9IHNlZ21lbnQudHJhbnNpdGlvbi50by5heGlzIHx8IHNlZ21lbnQudHJhbnNpdGlvbi5mcm9tLmF4aXM7XG4gICAgY29uc3QgdG9BeGlzQW5nbGUgPSBuZXcgVmVjdG9yNChcbiAgICAgIHRvQXhpcy54LFxuICAgICAgdG9BeGlzLnksXG4gICAgICB0b0F4aXMueixcbiAgICAgIHNlZ21lbnQudHJhbnNpdGlvbi50by5hbmdsZVxuICAgICk7XG4gIFxuICAgIGNvbnN0IG9yaWdpbiA9IHNlZ21lbnQudHJhbnNpdGlvbi5vcmlnaW47XG4gICAgXG4gICAgcmV0dXJuIGBcbiAgICAke1RpbWVsaW5lQ2h1bmtzLmRlbGF5RHVyYXRpb24oc2VnbWVudCl9XG4gICAgJHtUaW1lbGluZUNodW5rcy52ZWM0KGBjUm90YXRpb25Gcm9tJHtzZWdtZW50LmtleX1gLCBmcm9tQXhpc0FuZ2xlLCA4KX1cbiAgICAke1RpbWVsaW5lQ2h1bmtzLnZlYzQoYGNSb3RhdGlvblRvJHtzZWdtZW50LmtleX1gLCB0b0F4aXNBbmdsZSwgOCl9XG4gICAgJHtvcmlnaW4gPyBUaW1lbGluZUNodW5rcy52ZWMzKGBjT3JpZ2luJHtzZWdtZW50LmtleX1gLCBvcmlnaW4sIDIpIDogJyd9XG4gICAgXG4gICAgdm9pZCBhcHBseVRyYW5zZm9ybSR7c2VnbWVudC5rZXl9KGZsb2F0IHRpbWUsIGlub3V0IHZlYzMgdikge1xuICAgICAgJHtUaW1lbGluZUNodW5rcy5yZW5kZXJDaGVjayhzZWdtZW50KX1cbiAgICAgICR7VGltZWxpbmVDaHVua3MucHJvZ3Jlc3Moc2VnbWVudCl9XG5cbiAgICAgICR7b3JpZ2luID8gYHYgLT0gY09yaWdpbiR7c2VnbWVudC5rZXl9O2AgOiAnJ31cbiAgICAgIHZlYzMgYXhpcyA9IG5vcm1hbGl6ZShtaXgoY1JvdGF0aW9uRnJvbSR7c2VnbWVudC5rZXl9Lnh5eiwgY1JvdGF0aW9uVG8ke3NlZ21lbnQua2V5fS54eXosIHByb2dyZXNzKSk7XG4gICAgICBmbG9hdCBhbmdsZSA9IG1peChjUm90YXRpb25Gcm9tJHtzZWdtZW50LmtleX0udywgY1JvdGF0aW9uVG8ke3NlZ21lbnQua2V5fS53LCBwcm9ncmVzcyk7XG4gICAgICB2ZWM0IHEgPSBxdWF0RnJvbUF4aXNBbmdsZShheGlzLCBhbmdsZSk7XG4gICAgICB2ID0gcm90YXRlVmVjdG9yKHEsIHYpO1xuICAgICAgJHtvcmlnaW4gPyBgdiArPSBjT3JpZ2luJHtzZWdtZW50LmtleX07YCA6ICcnfVxuICAgIH1cbiAgICBgO1xuICB9LFxuICBkZWZhdWx0RnJvbToge2F4aXM6IG5ldyBWZWN0b3IzKCksIGFuZ2xlOiAwfVxufTtcblxuVGltZWxpbmUucmVnaXN0ZXIoJ3JvdGF0ZScsIFJvdGF0aW9uU2VnbWVudCk7XG5cbmV4cG9ydCB7IFJvdGF0aW9uU2VnbWVudCB9O1xuIl0sIm5hbWVzIjpbIkJhc2VBbmltYXRpb25NYXRlcmlhbCIsInBhcmFtZXRlcnMiLCJ1bmlmb3JtcyIsImNhbGwiLCJ1bmlmb3JtVmFsdWVzIiwid2FybiIsImtleXMiLCJmb3JFYWNoIiwia2V5Iiwic2V0VmFsdWVzIiwiVW5pZm9ybXNVdGlscyIsIm1lcmdlIiwic2V0VW5pZm9ybVZhbHVlcyIsInByb3RvdHlwZSIsIk9iamVjdCIsImFzc2lnbiIsImNyZWF0ZSIsIlNoYWRlck1hdGVyaWFsIiwidmFsdWVzIiwidmFsdWUiLCJuYW1lIiwiam9pbiIsIkJhc2ljQW5pbWF0aW9uTWF0ZXJpYWwiLCJTaGFkZXJMaWIiLCJsaWdodHMiLCJ2ZXJ0ZXhTaGFkZXIiLCJjb25jYXRWZXJ0ZXhTaGFkZXIiLCJmcmFnbWVudFNoYWRlciIsImNvbmNhdEZyYWdtZW50U2hhZGVyIiwiY29uc3RydWN0b3IiLCJiYXNpYyIsInJlcGxhY2UiLCJzdHJpbmdpZnlDaHVuayIsIkxhbWJlcnRBbmltYXRpb25NYXRlcmlhbCIsImxhbWJlcnQiLCJQaG9uZ0FuaW1hdGlvbk1hdGVyaWFsIiwicGhvbmciLCJTdGFuZGFyZEFuaW1hdGlvbk1hdGVyaWFsIiwiZXh0ZW5zaW9ucyIsImRlcml2YXRpdmVzIiwic3RhbmRhcmQiLCJUb29uQW5pbWF0aW9uTWF0ZXJpYWwiLCJkZWZpbmVzIiwiUG9pbnRzQW5pbWF0aW9uTWF0ZXJpYWwiLCJwb2ludHMiLCJEZXB0aEFuaW1hdGlvbk1hdGVyaWFsIiwiZGVwdGhQYWNraW5nIiwiUkdCQURlcHRoUGFja2luZyIsImNsaXBwaW5nIiwiZGVwdGgiLCJEaXN0YW5jZUFuaW1hdGlvbk1hdGVyaWFsIiwiZGlzdGFuY2VSR0JBIiwiUHJlZmFiQnVmZmVyR2VvbWV0cnkiLCJwcmVmYWIiLCJjb3VudCIsInByZWZhYkdlb21ldHJ5IiwiaXNQcmVmYWJCdWZmZXJHZW9tZXRyeSIsImlzQnVmZmVyR2VvbWV0cnkiLCJwcmVmYWJDb3VudCIsInByZWZhYlZlcnRleENvdW50IiwiYXR0cmlidXRlcyIsInBvc2l0aW9uIiwidmVydGljZXMiLCJsZW5ndGgiLCJidWZmZXJJbmRpY2VzIiwiYnVmZmVyUG9zaXRpb25zIiwiQnVmZmVyR2VvbWV0cnkiLCJwcmVmYWJJbmRpY2VzIiwicHJlZmFiSW5kZXhDb3VudCIsImluZGV4IiwiYXJyYXkiLCJpIiwicHVzaCIsInByZWZhYkZhY2VDb3VudCIsImZhY2VzIiwiZmFjZSIsImEiLCJiIiwiYyIsImluZGV4QnVmZmVyIiwiVWludDMyQXJyYXkiLCJzZXRJbmRleCIsIkJ1ZmZlckF0dHJpYnV0ZSIsImsiLCJwb3NpdGlvbkJ1ZmZlciIsImNyZWF0ZUF0dHJpYnV0ZSIsInBvc2l0aW9ucyIsIm9mZnNldCIsImoiLCJwcmVmYWJWZXJ0ZXgiLCJ4IiwieSIsInoiLCJidWZmZXJVdnMiLCJ1dkJ1ZmZlciIsInV2cyIsInV2IiwiZmFjZVZlcnRleFV2cyIsIml0ZW1TaXplIiwiZmFjdG9yeSIsImJ1ZmZlciIsIkZsb2F0MzJBcnJheSIsImF0dHJpYnV0ZSIsInNldEF0dHJpYnV0ZSIsImRhdGEiLCJzZXRQcmVmYWJEYXRhIiwicHJlZmFiSW5kZXgiLCJNdWx0aVByZWZhYkJ1ZmZlckdlb21ldHJ5IiwicHJlZmFicyIsInJlcGVhdENvdW50IiwiQXJyYXkiLCJpc0FycmF5IiwicHJlZmFiR2VvbWV0cmllcyIsInByZWZhYkdlb21ldHJpZXNDb3VudCIsInByZWZhYlZlcnRleENvdW50cyIsIm1hcCIsInAiLCJyZXBlYXRWZXJ0ZXhDb3VudCIsInJlZHVjZSIsInIiLCJ2IiwicmVwZWF0SW5kZXhDb3VudCIsImluZGljZXMiLCJnZW9tZXRyeSIsImluZGV4T2Zmc2V0IiwicHJlZmFiT2Zmc2V0IiwidmVydGV4Q291bnQiLCJwcmVmYWJQb3NpdGlvbnMiLCJwcmVmYWJVdnMiLCJlcnJvciIsInV2T2JqZWN0cyIsInByZWZhYkdlb21ldHJ5SW5kZXgiLCJwcmVmYWJHZW9tZXRyeVZlcnRleENvdW50Iiwid2hvbGUiLCJ3aG9sZU9mZnNldCIsInBhcnQiLCJwYXJ0T2Zmc2V0IiwiSW5zdGFuY2VkUHJlZmFiQnVmZmVyR2VvbWV0cnkiLCJpc0dlb21ldHJ5IiwiY29weSIsIm1heEluc3RhbmNlZENvdW50IiwiSW5zdGFuY2VkQnVmZmVyR2VvbWV0cnkiLCJJbnN0YW5jZWRCdWZmZXJBdHRyaWJ1dGUiLCJVdGlscyIsImlsIiwibiIsInZhIiwidmIiLCJ2YyIsImNsb25lIiwiVmVjdG9yMyIsImJveCIsInRNYXRoIiwicmFuZEZsb2F0IiwibWluIiwibWF4IiwicmFuZEZsb2F0U3ByZWFkIiwibm9ybWFsaXplIiwic291cmNlTWF0ZXJpYWwiLCJ2ZXJ0ZXhGdW5jdGlvbnMiLCJ2ZXJ0ZXhQYXJhbWV0ZXJzIiwidmVydGV4SW5pdCIsInZlcnRleFBvc2l0aW9uIiwiTW9kZWxCdWZmZXJHZW9tZXRyeSIsIm1vZGVsIiwib3B0aW9ucyIsIm1vZGVsR2VvbWV0cnkiLCJmYWNlQ291bnQiLCJjb21wdXRlQ2VudHJvaWRzIiwibG9jYWxpemVGYWNlcyIsImNlbnRyb2lkcyIsImNvbXB1dGVDZW50cm9pZCIsImNlbnRyb2lkIiwidmVydGV4IiwiYnVmZmVyU2tpbm5pbmciLCJza2luSW5kZXhCdWZmZXIiLCJza2luV2VpZ2h0QnVmZmVyIiwic2tpbkluZGV4Iiwic2tpbkluZGljZXMiLCJza2luV2VpZ2h0Iiwic2tpbldlaWdodHMiLCJ3Iiwic2V0RmFjZURhdGEiLCJmYWNlSW5kZXgiLCJQb2ludEJ1ZmZlckdlb21ldHJ5IiwicG9pbnRDb3VudCIsInNldFBvaW50RGF0YSIsInBvaW50SW5kZXgiLCJTaGFkZXJDaHVuayIsImNhdG11bGxfcm9tX3NwbGluZSIsImN1YmljX2JlemllciIsImVhc2VfYmFja19pbiIsImVhc2VfYmFja19pbl9vdXQiLCJlYXNlX2JhY2tfb3V0IiwiZWFzZV9iZXppZXIiLCJlYXNlX2JvdW5jZV9pbiIsImVhc2VfYm91bmNlX2luX291dCIsImVhc2VfYm91bmNlX291dCIsImVhc2VfY2lyY19pbiIsImVhc2VfY2lyY19pbl9vdXQiLCJlYXNlX2NpcmNfb3V0IiwiZWFzZV9jdWJpY19pbiIsImVhc2VfY3ViaWNfaW5fb3V0IiwiZWFzZV9jdWJpY19vdXQiLCJlYXNlX2VsYXN0aWNfaW4iLCJlYXNlX2VsYXN0aWNfaW5fb3V0IiwiZWFzZV9lbGFzdGljX291dCIsImVhc2VfZXhwb19pbiIsImVhc2VfZXhwb19pbl9vdXQiLCJlYXNlX2V4cG9fb3V0IiwiZWFzZV9xdWFkX2luIiwiZWFzZV9xdWFkX2luX291dCIsImVhc2VfcXVhZF9vdXQiLCJlYXNlX3F1YXJ0X2luIiwiZWFzZV9xdWFydF9pbl9vdXQiLCJlYXNlX3F1YXJ0X291dCIsImVhc2VfcXVpbnRfaW4iLCJlYXNlX3F1aW50X2luX291dCIsImVhc2VfcXVpbnRfb3V0IiwiZWFzZV9zaW5lX2luIiwiZWFzZV9zaW5lX2luX291dCIsImVhc2Vfc2luZV9vdXQiLCJxdWFkcmF0aWNfYmV6aWVyIiwicXVhdGVybmlvbl9yb3RhdGlvbiIsInF1YXRlcm5pb25fc2xlcnAiLCJUaW1lbGluZVNlZ21lbnQiLCJzdGFydCIsImR1cmF0aW9uIiwidHJhbnNpdGlvbiIsImNvbXBpbGVyIiwidHJhaWwiLCJjb21waWxlIiwiZGVmaW5lUHJvcGVydHkiLCJUaW1lbGluZSIsInRpbWVLZXkiLCJzZWdtZW50cyIsIl9fa2V5Iiwic2VnbWVudERlZmluaXRpb25zIiwicmVnaXN0ZXIiLCJkZWZpbml0aW9uIiwiYWRkIiwidHJhbnNpdGlvbnMiLCJwb3NpdGlvbk9mZnNldCIsIl9ldmFsIiwiZXZhbCIsInVuZGVmaW5lZCIsIk1hdGgiLCJwcm9jZXNzVHJhbnNpdGlvbiIsImZyb20iLCJkZWZhdWx0RnJvbSIsInRvIiwidG9TdHJpbmciLCJmaWxsR2FwcyIsInMiLCJzMCIsInMxIiwiZW5kIiwiZ2V0VHJhbnNmb3JtQ2FsbHMiLCJ0IiwiVGltZWxpbmVDaHVua3MiLCJ0b1ByZWNpc2lvbiIsInNlZ21lbnQiLCJlYXNlIiwiZWFzZVBhcmFtcyIsInN0YXJ0VGltZSIsImVuZFRpbWUiLCJUcmFuc2xhdGlvblNlZ21lbnQiLCJkZWxheUR1cmF0aW9uIiwidmVjMyIsInJlbmRlckNoZWNrIiwicHJvZ3Jlc3MiLCJTY2FsZVNlZ21lbnQiLCJvcmlnaW4iLCJSb3RhdGlvblNlZ21lbnQiLCJmcm9tQXhpc0FuZ2xlIiwiVmVjdG9yNCIsImF4aXMiLCJhbmdsZSIsInRvQXhpcyIsInRvQXhpc0FuZ2xlIiwidmVjNCJdLCJt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
