import { ShaderMaterial, UniformsUtils, ShaderLib, RGBADepthPacking, BufferGeometry, BufferAttribute, InstancedBufferGeometry, InstancedBufferAttribute, Vector3, Math as Math$1, Vector4 } from 'three';

class BaseAnimationMaterial extends ShaderMaterial {
  constructor (parameters, uniforms) {
    super();

    if (parameters.uniformValues) {
      console.warn('THREE.BAS - `uniformValues` is deprecated. Put their values directly into the parameters.');

      Object.keys(parameters.uniformValues).forEach((key) => {
        parameters[key] = parameters.uniformValues[key];
      });

      delete parameters.uniformValues;
    }

    // copy parameters to (1) make use of internal #define generation
    // and (2) prevent 'x is not a property of this material' warnings.
    Object.keys(parameters).forEach((key) => {
      this[key] = parameters[key];
    });

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

class BasicAnimationMaterial extends BaseAnimationMaterial {
  /**
   * Extends THREE.MeshBasicMaterial with custom shader chunks.
   *
   * @see http://three-bas-examples.surge.sh/examples/materials_basic/
   *
   * @param {Object} parameters Object containing material properties and custom shader chunks.
   */
  constructor (parameters) {
    super(parameters, ShaderLib['basic'].uniforms);

    this.lights = false;
    this.vertexShader = this.concatVertexShader();
    this.fragmentShader = this.concatFragmentShader();
  }

  concatVertexShader () {
    return ShaderLib.basic.vertexShader
      .replace(
        'void main() {',
        `
        ${this.stringifyChunk('vertexParameters')}
        ${this.stringifyChunk('varyingParameters')}
        ${this.stringifyChunk('vertexFunctions')}

        void main() {
          ${this.stringifyChunk('vertexInit')}
        `
      )
      .replace(
        '#include <beginnormal_vertex>',
        `
        #include <beginnormal_vertex>
        ${this.stringifyChunk('vertexNormal')}
        `
      )
      .replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>
        ${this.stringifyChunk('vertexPosition')}
        ${this.stringifyChunk('vertexColor')}
        `
      )
      .replace(
        '#include <morphtarget_vertex>',
        `
        #include <morphtarget_vertex>
        ${this.stringifyChunk('vertexPostMorph')}
        `
      )
      .replace(
        '#include <skinning_vertex>',
        `
        #include <skinning_vertex>
        ${this.stringifyChunk('vertexPostSkinning')}
        `
      )
  }

  concatFragmentShader () {
    return ShaderLib.basic.fragmentShader
      .replace(
        'void main() {',
        `
        ${this.stringifyChunk('fragmentParameters')}
        ${this.stringifyChunk('varyingParameters')}
        ${this.stringifyChunk('fragmentFunctions')}

        void main() {
          ${this.stringifyChunk('fragmentInit')}
        `
      )
      .replace(
        '#include <map_fragment>',
        `
        ${this.stringifyChunk('fragmentDiffuse')}
        ${(this.stringifyChunk('fragmentMap') || '#include <map_fragment>')}

        `
      )
  }
}

class LambertAnimationMaterial extends BaseAnimationMaterial {
  /**
   * Extends THREE.MeshLambertMaterial with custom shader chunks.
   *
   * @see http://three-bas-examples.surge.sh/examples/materials_lambert/
   *
   * @param {Object} parameters Object containing material properties and custom shader chunks.
   * @constructor
   */
  constructor (parameters) {
    super(parameters, ShaderLib['lambert'].uniforms);

    this.lights = true;
    this.vertexShader = this.concatVertexShader();
    this.fragmentShader = this.concatFragmentShader();
  }

  concatVertexShader () {
    return ShaderLib.lambert.vertexShader
      .replace(
        'void main() {',
        `
        ${this.stringifyChunk('vertexParameters')}
        ${this.stringifyChunk('varyingParameters')}
        ${this.stringifyChunk('vertexFunctions')}

        void main() {
          ${this.stringifyChunk('vertexInit')}
        `
      )
      .replace(
        '#include <beginnormal_vertex>',
        `
        #include <beginnormal_vertex>

        ${this.stringifyChunk('vertexNormal')}
        `
      )
      .replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>

        ${this.stringifyChunk('vertexPosition')}
        ${this.stringifyChunk('vertexColor')}
        `
      )
      .replace(
        '#include <morphtarget_vertex>',
        `
        #include <morphtarget_vertex>

        ${this.stringifyChunk('vertexPostMorph')}
        `
      )
      .replace(
        '#include <skinning_vertex>',
        `
        #include <skinning_vertex>

        ${this.stringifyChunk('vertexPostSkinning')}
        `
      )
  }

  concatFragmentShader () {
    return ShaderLib.lambert.fragmentShader
      .replace(
        'void main() {',
        `
        ${this.stringifyChunk('fragmentParameters')}
        ${this.stringifyChunk('varyingParameters')}
        ${this.stringifyChunk('fragmentFunctions')}

        void main() {
          ${this.stringifyChunk('fragmentInit')}
        `
      )
      .replace(
        '#include <map_fragment>',
        `
        ${this.stringifyChunk('fragmentDiffuse')}
        ${(this.stringifyChunk('fragmentMap') || '#include <map_fragment>')}

        `
      )
      .replace(
        '#include <emissivemap_fragment>',
        `
        ${this.stringifyChunk('fragmentEmissive')}

        #include <emissivemap_fragment>
        `
      )
  }
}

class PhongAnimationMaterial extends BaseAnimationMaterial {
  /**
   * Extends THREE.MeshPhongMaterial with custom shader chunks.
   *
   * @see http://three-bas-examples.surge.sh/examples/materials_phong/
   *
   * @param {Object} parameters Object containing material properties and custom shader chunks.
   * @constructor
   */
  constructor (parameters) {
    super(parameters, ShaderLib['phong'].uniforms);

    this.lights = true;
    this.vertexShader = this.concatVertexShader();
    this.fragmentShader = this.concatFragmentShader();
  }

  concatVertexShader () {
    return ShaderLib.phong.vertexShader
      .replace(
        'void main() {',
        `
        ${this.stringifyChunk('vertexParameters')}
        ${this.stringifyChunk('varyingParameters')}
        ${this.stringifyChunk('vertexFunctions')}

        void main() {
          ${this.stringifyChunk('vertexInit')}
        `
      )
      .replace(
        '#include <beginnormal_vertex>',
        `
        #include <beginnormal_vertex>

        ${this.stringifyChunk('vertexNormal')}
        `
      )
      .replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>

        ${this.stringifyChunk('vertexPosition')}
        ${this.stringifyChunk('vertexColor')}
        `
      )
      .replace(
        '#include <morphtarget_vertex>',
        `
        #include <morphtarget_vertex>

        ${this.stringifyChunk('vertexPostMorph')}
        `
      )
      .replace(
        '#include <skinning_vertex>',
        `
        #include <skinning_vertex>

        ${this.stringifyChunk('vertexPostSkinning')}
        `
      )
  }

  concatFragmentShader () {
    return ShaderLib.phong.fragmentShader
      .replace(
        'void main() {',
        `
        ${this.stringifyChunk('fragmentParameters')}
        ${this.stringifyChunk('varyingParameters')}
        ${this.stringifyChunk('fragmentFunctions')}

        void main() {
          ${this.stringifyChunk('fragmentInit')}
        `
      )
      .replace(
        '#include <map_fragment>',
        `
        ${this.stringifyChunk('fragmentDiffuse')}
        ${(this.stringifyChunk('fragmentMap') || '#include <map_fragment>')}

        `
      )
      .replace(
        '#include <emissivemap_fragment>',
        `
        ${this.stringifyChunk('fragmentEmissive')}

        #include <emissivemap_fragment>
        `
      )
      .replace(
        '#include <lights_phong_fragment>',
        `
        #include <lights_phong_fragment>
        ${this.stringifyChunk('fragmentSpecular')}
        `
      )
  }
}

class StandardAnimationMaterial extends BaseAnimationMaterial {
  /**
   * Extends THREE.MeshStandardMaterial with custom shader chunks.
   *
   * @see http://three-bas-examples.surge.sh/examples/materials_standard/
   *
   * @param {Object} parameters Object containing material properties and custom shader chunks.
   */
  constructor (parameters) {
    super(parameters, ShaderLib['physical'].uniforms);

    this.lights = true;
    this.extensions = (this.extensions || {});
    this.extensions.derivatives = true;
    this.vertexShader = this.concatVertexShader();
    this.fragmentShader = this.concatFragmentShader();
  }

  concatVertexShader () {
    return ShaderLib.standard.vertexShader
      .replace(
        'void main() {',
        `
        ${this.stringifyChunk('vertexParameters')}
        ${this.stringifyChunk('varyingParameters')}
        ${this.stringifyChunk('vertexFunctions')}

        void main() {
          ${this.stringifyChunk('vertexInit')}
        `
      )
      .replace(
        '#include <beginnormal_vertex>',
        `
        #include <beginnormal_vertex>

        ${this.stringifyChunk('vertexNormal')}
        `
      )
      .replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>

        ${this.stringifyChunk('vertexPosition')}
        ${this.stringifyChunk('vertexColor')}
        `
      )
      .replace(
        '#include <morphtarget_vertex>',
        `
        #include <morphtarget_vertex>

        ${this.stringifyChunk('vertexPostMorph')}
        `
      )
      .replace(
        '#include <skinning_vertex>',
        `
        #include <skinning_vertex>

        ${this.stringifyChunk('vertexPostSkinning')}
        `
      )
  }

  concatFragmentShader () {
    return ShaderLib.standard.fragmentShader
      .replace(
        'void main() {',
        `
        ${this.stringifyChunk('fragmentParameters')}
        ${this.stringifyChunk('varyingParameters')}
        ${this.stringifyChunk('fragmentFunctions')}

        void main() {
          ${this.stringifyChunk('fragmentInit')}
        `
      )
      .replace(
        '#include <map_fragment>',
        `
        ${this.stringifyChunk('fragmentDiffuse')}
        ${(this.stringifyChunk('fragmentMap') || '#include <map_fragment>')}

        `
      )
      .replace(
        '#include <emissivemap_fragment>',
        `
        ${this.stringifyChunk('fragmentEmissive')}

        #include <emissivemap_fragment>
        `
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `
        float roughnessFactor = roughness;
        ${this.stringifyChunk('fragmentRoughness')}
        #ifdef USE_ROUGHNESSMAP

        vec4 texelRoughness = texture2D( roughnessMap, vUv );
          roughnessFactor *= texelRoughness.g;
        #endif
        `
      )
      .replace(
        '#include <metalnessmap_fragment>',
        `
        float metalnessFactor = metalness;
        ${this.stringifyChunk('fragmentMetalness')}

        #ifdef USE_METALNESSMAP
          vec4 texelMetalness = texture2D( metalnessMap, vUv );
          metalnessFactor *= texelMetalness.b;
        #endif
        `
      )
  }
}

class ToonAnimationMaterial extends BaseAnimationMaterial {
  /**
   * Extends THREE.MeshToonMaterial with custom shader chunks.
   *
   * @param {Object} parameters Object containing material properties and custom shader chunks.
   */
  constructor (parameters) {
    super(parameters, ShaderLib['toon'].uniforms);

    this.lights = true;
    this.vertexShader = this.concatVertexShader();
    this.fragmentShader = this.concatFragmentShader();
  }

  concatVertexShader () {
    return ShaderLib.toon.vertexShader
      .replace(
        'void main() {',
        `
        ${this.stringifyChunk('vertexParameters')}
        ${this.stringifyChunk('varyingParameters')}
        ${this.stringifyChunk('vertexFunctions')}

        void main() {
          ${this.stringifyChunk('vertexInit')}
        `
      )
      .replace(
        '#include <beginnormal_vertex>',
        `
        #include <beginnormal_vertex>

        ${this.stringifyChunk('vertexNormal')}
        `
      )
      .replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>

        ${this.stringifyChunk('vertexPosition')}
        ${this.stringifyChunk('vertexColor')}
        `
      )
      .replace(
        '#include <morphtarget_vertex>',
        `
        #include <morphtarget_vertex>

        ${this.stringifyChunk('vertexPostMorph')}
        `
      )
      .replace(
        '#include <skinning_vertex>',
        `
        #include <skinning_vertex>

        ${this.stringifyChunk('vertexPostSkinning')}
        `
      )
  }

  concatFragmentShader () {
    return ShaderLib.toon.fragmentShader
      .replace(
        'void main() {',
        `
        ${this.stringifyChunk('fragmentParameters')}
        ${this.stringifyChunk('varyingParameters')}
        ${this.stringifyChunk('fragmentFunctions')}

        void main() {
          ${this.stringifyChunk('fragmentInit')}
        `
      )
      .replace(
        '#include <map_fragment>',
        `
        ${this.stringifyChunk('fragmentDiffuse')}
        ${(this.stringifyChunk('fragmentMap') || '#include <map_fragment>')}

        `
      )
      .replace(
        '#include <emissivemap_fragment>',
        `
        ${this.stringifyChunk('fragmentEmissive')}

        #include <emissivemap_fragment>
        `
      )
  }
}

class PointsAnimationMaterial extends BaseAnimationMaterial {
  /**
   * Extends THREE.PointsMaterial with custom shader chunks.
   *
   * @param {Object} parameters Object containing material properties and custom shader chunks.
   * @constructor
   */
  constructor (parameters) {
    super(parameters, ShaderLib['points'].uniforms);

    this.vertexShader = this.concatVertexShader();
    this.fragmentShader = this.concatFragmentShader();
  }

  concatVertexShader () {
    return ShaderLib.points.vertexShader
      .replace(
        'void main() {',
        `
        ${this.stringifyChunk('vertexParameters')}
        ${this.stringifyChunk('varyingParameters')}
        ${this.stringifyChunk('vertexFunctions')}

        void main() {
          ${this.stringifyChunk('vertexInit')}
        `
      )
      .replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>

        ${this.stringifyChunk('vertexPosition')}
        ${this.stringifyChunk('vertexColor')}
        `
      )
      .replace(
        '#include <morphtarget_vertex>',
        `
        #include <morphtarget_vertex>

        ${this.stringifyChunk('vertexPostMorph')}
        `
      )
  }

  concatFragmentShader () {
    return ShaderLib.points.fragmentShader
      .replace(
        'void main() {',
        `
        ${this.stringifyChunk('fragmentParameters')}
        ${this.stringifyChunk('varyingParameters')}
        ${this.stringifyChunk('fragmentFunctions')}

        void main() {
          ${this.stringifyChunk('fragmentInit')}
        `
      )
      .replace(
        '#include <map_fragment>',
        `
        ${this.stringifyChunk('fragmentDiffuse')}
        ${(this.stringifyChunk('fragmentMap') || '#include <map_fragment>')}

        `
      )
      .replace(
        '#include <premultiplied_alpha_fragment>',
        `
        ${this.stringifyChunk('fragmentShape')}

        #include <premultiplied_alpha_fragment>
        `
      )
  }
}

class DepthAnimationMaterial extends BaseAnimationMaterial {
  constructor (parameters) {
    super(parameters, ShaderLib['depth'].uniforms);

    this.depthPacking = RGBADepthPacking;
    this.clipping = true;
    this.vertexShader = this.concatVertexShader();
    this.fragmentShader = ShaderLib['depth'].fragmentShader;
  }

  concatVertexShader () {
    return ShaderLib.depth.vertexShader
      .replace(
        'void main() {',
        `
        ${this.stringifyChunk('vertexParameters')}
        ${this.stringifyChunk('vertexFunctions')}

        void main() {
          ${this.stringifyChunk('vertexInit')}
        `
      )
      .replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>

        ${this.stringifyChunk('vertexPosition')}
        `
      )
      .replace(
        '#include <morphtarget_vertex>',
        `
        #include <morphtarget_vertex>

        ${this.stringifyChunk('vertexPostMorph')}
        `
      )
      .replace(
        '#include <skinning_vertex>',
        `
        #include <skinning_vertex>

        ${this.stringifyChunk('vertexPostSkinning')}
        `
      )
  }
}

class DistanceAnimationMaterial extends BaseAnimationMaterial {
  constructor (parameters) {
    super(parameters, ShaderLib['distanceRGBA'].uniforms);

    this.depthPacking = RGBADepthPacking;
    this.clipping = true;
    this.vertexShader = this.concatVertexShader();
    this.fragmentShader = ShaderLib['distanceRGBA'].fragmentShader;
  }

  concatVertexShader () {
    return ShaderLib.distanceRGBA.vertexShader
      .replace(
        'void main() {',
        `
        ${this.stringifyChunk('vertexParameters')}
        ${this.stringifyChunk('vertexFunctions')}

        void main() {
          ${this.stringifyChunk('vertexInit')}
        `
      )
      .replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>

        ${this.stringifyChunk('vertexPosition')}
        `
      )
      .replace(
        '#include <morphtarget_vertex>',
        `
        #include <morphtarget_vertex>

        ${this.stringifyChunk('vertexPostMorph')}
        `
      )
      .replace(
        '#include <skinning_vertex>',
        `
        #include <skinning_vertex>

        ${this.stringifyChunk('vertexPostSkinning')}
        `
      )
  }
}

class PrefabBufferGeometry extends BufferGeometry {
  /**
   * A BufferGeometry where a 'prefab' geometry is repeated a number of times.
   *
   * @param {Geometry|BufferGeometry} prefab The Geometry instance to repeat.
   * @param {Number} count The number of times to repeat the geometry.
   */
  constructor (prefab, count) {
    super();

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
    }
    else {
      this.prefabVertexCount = prefab.vertices.length;
    }

    this.bufferIndices();
    this.bufferPositions();
  }

  bufferIndices () {
    let prefabIndices = [];
    let prefabIndexCount;

    if (this.isPrefabBufferGeometry) {
      if (this.prefabGeometry.index) {
        prefabIndexCount = this.prefabGeometry.index.count;
        prefabIndices = this.prefabGeometry.index.array;
      }
      else {
        prefabIndexCount = this.prefabVertexCount;

        for (let i = 0; i < prefabIndexCount; i++) {
          prefabIndices.push(i);
        }
      }
    }
    else {
      const prefabFaceCount = this.prefabGeometry.faces.length;
      prefabIndexCount = prefabFaceCount * 3;

      for (let i = 0; i < prefabFaceCount; i++) {
        const face = this.prefabGeometry.faces[i];
        prefabIndices.push(face.a, face.b, face.c);
      }
    }

    const indexBuffer = new Uint32Array(this.prefabCount * prefabIndexCount);

    this.setIndex(new BufferAttribute(indexBuffer, 1));

    for (let i = 0; i < this.prefabCount; i++) {
      for (let k = 0; k < prefabIndexCount; k++) {
        indexBuffer[i * prefabIndexCount + k] = prefabIndices[k] + i * this.prefabVertexCount;
      }
    }
  }

  bufferPositions () {
    const positionBuffer = this.createAttribute('position', 3).array;

    if (this.isPrefabBufferGeometry) {
      const positions = this.prefabGeometry.attributes.position.array;

      for (let i = 0, offset = 0; i < this.prefabCount; i++) {
        for (let j = 0; j < this.prefabVertexCount; j++, offset += 3) {
          positionBuffer[offset    ] = positions[j * 3];
          positionBuffer[offset + 1] = positions[j * 3 + 1];
          positionBuffer[offset + 2] = positions[j * 3 + 2];
        }
      }
    }
    else {
      for (let i = 0, offset = 0; i < this.prefabCount; i++) {
        for (let j = 0; j < this.prefabVertexCount; j++, offset += 3) {
          const prefabVertex = this.prefabGeometry.vertices[j];

          positionBuffer[offset    ] = prefabVertex.x;
          positionBuffer[offset + 1] = prefabVertex.y;
          positionBuffer[offset + 2] = prefabVertex.z;
        }
      }
    }
  }

  bufferUvs () {
    const uvBuffer = this.createAttribute('uv', 2).array;

    if (this.isPrefabBufferGeometry) {
      const uvs = this.prefabGeometry.attributes.uv.array;

      for (let i = 0, offset = 0; i < this.prefabCount; i++) {
        for (let j = 0; j < this.prefabVertexCount; j++, offset += 2) {
          uvBuffer[offset    ] = uvs[j * 2];
          uvBuffer[offset + 1] = uvs[j * 2 + 1];
        }
      }
    } else {
      const prefabFaceCount = this.prefabGeometry.faces.length;
      const uvs = [];

      for (let i = 0; i < prefabFaceCount; i++) {
        const face = this.prefabGeometry.faces[i];
        const uv = this.prefabGeometry.faceVertexUvs[0][i];

        uvs[face.a] = uv[0];
        uvs[face.b] = uv[1];
        uvs[face.c] = uv[2];
      }

      for (let i = 0, offset = 0; i < this.prefabCount; i++) {
        for (let j = 0; j < this.prefabVertexCount; j++, offset += 2) {
          const uv = uvs[j];

          uvBuffer[offset] = uv.x;
          uvBuffer[offset + 1] = uv.y;
        }
      }
    }
  }

  /**
   * Creates a BufferAttribute on this geometry instance.
   *
   * @param {String} name Name of the attribute.
   * @param {Number} itemSize Number of floats per vertex (typically 1, 2, 3 or 4).
   * @param {function=} factory Function that will be called for each prefab upon creation. Accepts 3 arguments: data[], index and prefabCount. Calls setPrefabData.
   *
   * @returns {BufferAttribute}
   */
  createAttribute (name, itemSize, factory) {
    const buffer = new Float32Array(this.prefabCount * this.prefabVertexCount * itemSize);
    const attribute = new BufferAttribute(buffer, itemSize);

    this.setAttribute(name, attribute);

    if (factory) {
      const data = [];

      for (let i = 0; i < this.prefabCount; i++) {
        factory(data, i, this.prefabCount);
        this.setPrefabData(attribute, i, data);
      }
    }

    return attribute;
  }

  /**
   * Sets data for all vertices of a prefab at a given index.
   * Usually called in a loop.
   *
   * @param {String|BufferAttribute} attribute The attribute or attribute name where the data is to be stored.
   * @param {Number} prefabIndex Index of the prefab in the buffer geometry.
   * @param {Array} data Array of data. Length should be equal to item size of the attribute.
   */
  setPrefabData (attribute, prefabIndex, data) {
    attribute = (typeof attribute === 'string') ? this.attributes[attribute] : attribute;

    let offset = prefabIndex * this.prefabVertexCount * attribute.itemSize;

    for (let i = 0; i < this.prefabVertexCount; i++) {
      for (let j = 0; j < attribute.itemSize; j++) {
        attribute.array[offset++] = data[j];
      }
    }
  }
}

class MultiPrefabBufferGeometry extends BufferGeometry {
  /**
   * A BufferGeometry where a 'prefab' geometry array is repeated a number of times.
   *
   * @param {Array} prefabs An array with Geometry instances to repeat.
   * @param {Number} repeatCount The number of times to repeat the array of Geometries.
   * @constructor
   */
  constructor (prefabs, repeatCount) {
    super();

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
    this.prefabVertexCounts = this.prefabGeometries.map(p => p.isBufferGeometry ? p.attributes.position.count : p.vertices.length);
    /**
     * Total number of vertices for one repetition of the prefabs
     * @type {number}
     */
    this.repeatVertexCount = this.prefabVertexCounts.reduce((r, v) => r + v, 0);

    this.bufferIndices();
    this.bufferPositions();
  }

  bufferIndices () {
    let repeatIndexCount = 0;

    this.prefabIndices = this.prefabGeometries.map(geometry => {
      let indices = [];

      if (geometry.isBufferGeometry) {
        if (geometry.index) {
          indices = geometry.index.array;
        } else {
          for (let i = 0; i < geometry.attributes.position.count; i++) {
            indices.push(i);
          }
        }
      } else {
        for (let i = 0; i < geometry.faces.length; i++) {
          const face = geometry.faces[i];
          indices.push(face.a, face.b, face.c);
        }
      }

      repeatIndexCount += indices.length;

      return indices;
    });

    const indexBuffer = new Uint32Array(repeatIndexCount * this.repeatCount);
    let indexOffset = 0;
    let prefabOffset = 0;

    for (let i = 0; i < this.prefabCount; i++) {
      const index = i % this.prefabGeometriesCount;
      const indices = this.prefabIndices[index];
      const vertexCount = this.prefabVertexCounts[index];

      for (let j = 0; j < indices.length; j++) {
        indexBuffer[indexOffset++] = indices[j] + prefabOffset;
      }

      prefabOffset += vertexCount;
    }

    this.setIndex(new BufferAttribute(indexBuffer, 1));
  }

  bufferPositions () {
    const positionBuffer = this.createAttribute('position', 3).array;

    const prefabPositions = this.prefabGeometries.map((geometry, i) => {
      let positions;

      if (geometry.isBufferGeometry) {
        positions = geometry.attributes.position.array;
      } else {

        const vertexCount = this.prefabVertexCounts[i];

        positions = [];

        for (let j = 0, offset = 0; j < vertexCount; j++) {
          const prefabVertex = geometry.vertices[j];

          positions[offset++] = prefabVertex.x;
          positions[offset++] = prefabVertex.y;
          positions[offset++] = prefabVertex.z;
        }
      }

      return positions;
    });

    for (let i = 0, offset = 0; i < this.prefabCount; i++) {
      const index = i % this.prefabGeometries.length;
      const vertexCount = this.prefabVertexCounts[index];
      const positions = prefabPositions[index];

      for (let j = 0; j < vertexCount; j++) {
        positionBuffer[offset++] = positions[j * 3];
        positionBuffer[offset++] = positions[j * 3 + 1];
        positionBuffer[offset++] = positions[j * 3 + 2];
      }
    }
  }

  /**
   * Creates a BufferAttribute with UV coordinates.
   */
  bufferUvs () {
    const uvBuffer = this.createAttribute('uv', 2).array;
    const prefabUvs = this.prefabGeometries.map((geometry, i) => {
      let uvs;

      if (geometry.isBufferGeometry) {
        if (!geometry.attributes.uv) {
          console.error('No UV found in prefab geometry', geometry);
        }

        uvs = geometry.attributes.uv.array;
      } else {
        const prefabFaceCount = this.prefabIndices[i].length / 3;
        const uvObjects = [];

        for (let j = 0; j < prefabFaceCount; j++) {
          const face = geometry.faces[j];
          const uv = geometry.faceVertexUvs[0][j];

          uvObjects[face.a] = uv[0];
          uvObjects[face.b] = uv[1];
          uvObjects[face.c] = uv[2];
        }

        uvs = [];

        for (let k = 0; k < uvObjects.length; k++) {
          uvs[k * 2] = uvObjects[k].x;
          uvs[k * 2 + 1] = uvObjects[k].y;
        }
      }

      return uvs;
    });

    for (let i = 0, offset = 0; i < this.prefabCount; i++) {

      const index = i % this.prefabGeometries.length;
      const vertexCount = this.prefabVertexCounts[index];
      const uvs = prefabUvs[index];

      for (let j = 0; j < vertexCount; j++) {
        uvBuffer[offset++] = uvs[j * 2];
        uvBuffer[offset++] = uvs[j * 2 + 1];
      }
    }
  }

  /**
   * Creates a BufferAttribute on this geometry instance.
   *
   * @param {String} name Name of the attribute.
   * @param {Number} itemSize Number of floats per vertex (typically 1, 2, 3 or 4).
   * @param {function=} factory Function that will be called for each prefab upon creation. Accepts 3 arguments: data[], index and prefabCount. Calls setPrefabData.
   *
   * @returns {BufferAttribute}
   */
   createAttribute (name, itemSize, factory) {
    const buffer = new Float32Array(this.repeatCount * this.repeatVertexCount * itemSize);
    const attribute = new BufferAttribute(buffer, itemSize);

    this.setAttribute(name, attribute);

    if (factory) {
      const data = [];

      for (let i = 0; i < this.prefabCount; i++) {
        factory(data, i, this.prefabCount);
        this.setPrefabData(attribute, i, data);
      }
    }

    return attribute;
   }

   /**
   * Sets data for all vertices of a prefab at a given index.
   * Usually called in a loop.
   *
   * @param {String|BufferAttribute} attribute The attribute or attribute name where the data is to be stored.
   * @param {Number} prefabIndex Index of the prefab in the buffer geometry.
   * @param {Array} data Array of data. Length should be equal to item size of the attribute.
   */
  setPrefabData (attribute, prefabIndex, data) {
    attribute = (typeof attribute === 'string') ? this.attributes[attribute] : attribute;

    const prefabGeometryIndex = prefabIndex % this.prefabGeometriesCount;
    const prefabGeometryVertexCount = this.prefabVertexCounts[prefabGeometryIndex];
    const whole = (prefabIndex / this.prefabGeometriesCount | 0) * this.prefabGeometriesCount;
    const wholeOffset = whole * this.repeatVertexCount;
    const part = prefabIndex - whole;
    let partOffset = 0;
    let i = 0;

    while(i < part) {
      partOffset += this.prefabVertexCounts[i++];
    }

    let offset = (wholeOffset + partOffset) * attribute.itemSize;

    for (let i = 0; i < prefabGeometryVertexCount; i++) {
      for (let j = 0; j < attribute.itemSize; j++) {
        attribute.array[offset++] = data[j];
      }
    }
  }
}

class InstancedPrefabBufferGeometry extends InstancedBufferGeometry {
  /**
   * A wrapper around THREE.InstancedBufferGeometry, which is more memory efficient than PrefabBufferGeometry, but requires the ANGLE_instanced_arrays extension.
   *
   * @param {BufferGeometry} prefab The Geometry instance to repeat.
   * @param {Number} count The number of times to repeat the geometry.
   */
  constructor (prefab, count) {
    super();

    this.prefabGeometry = prefab;
    this.copy(prefab);

    this.instanceCount = count;
    this.prefabCount = count;
  }

  /**
   * Creates a BufferAttribute on this geometry instance.
   *
   * @param {String} name Name of the attribute.
   * @param {Number} itemSize Number of floats per vertex (typically 1, 2, 3 or 4).
   * @param {function=} factory Function that will be called for each prefab upon creation. Accepts 3 arguments: data[], index and prefabCount. Calls setPrefabData.
   *
   * @returns {BufferAttribute}
   */
  createAttribute (name, itemSize, factory) {
    const buffer = new Float32Array(this.prefabCount * itemSize);
    const attribute = new InstancedBufferAttribute(buffer, itemSize);

    this.setAttribute(name, attribute);

    if (factory) {
      const data = [];

      for (let i = 0; i < this.prefabCount; i++) {
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
  setPrefabData (attribute, prefabIndex, data) {
    attribute = (typeof attribute === 'string') ? this.attributes[attribute] : attribute;

    let offset = prefabIndex * attribute.itemSize;

    for (let j = 0; j < attribute.itemSize; j++) {
      attribute.array[offset++] = data[j];
    }
  };
}

/**
 * Collection of utility functions.
 * @namespace
 */
const Utils = {
  /**
   * Duplicates vertices so each face becomes separate.
   * Same as THREE.ExplodeModifier.
   *
   * @param {THREE.Geometry} geometry Geometry instance to modify.
   */
  separateFaces: function (geometry) {
    let vertices = [];

    for (let i = 0, il = geometry.faces.length; i < il; i++) {
      let n = vertices.length;
      let face = geometry.faces[i];

      let a = face.a;
      let b = face.b;
      let c = face.c;

      let va = geometry.vertices[a];
      let vb = geometry.vertices[b];
      let vc = geometry.vertices[c];

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
  computeCentroid: function(geometry, face, v) {
    let a = geometry.vertices[face.a];
    let b = geometry.vertices[face.b];
    let c = geometry.vertices[face.c];

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
  randomInBox: function(box, v) {
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
  randomAxis: function(v) {
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
  createDepthAnimationMaterial: function(sourceMaterial) {
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
  createDistanceAnimationMaterial: function(sourceMaterial) {
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

class ModelBufferGeometry extends BufferGeometry {
  /**
   * A THREE.BufferGeometry for animating individual faces of a THREE.Geometry.
   *
   * @param {THREE.Geometry} model The THREE.Geometry to base this geometry on.
   * @param {Object=} options
   * @param {Boolean=} options.computeCentroids If true, a centroids will be computed for each face and stored in THREE.BAS.ModelBufferGeometry.centroids.
   * @param {Boolean=} options.localizeFaces If true, the positions for each face will be stored relative to the centroid. This is useful if you want to rotate or scale faces around their center.
   */
  constructor (model, options) {
    super();

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

  /**
   * Computes a centroid for each face and stores it in THREE.BAS.ModelBufferGeometry.centroids.
   */
  computeCentroids () {
    /**
     * An array of centroids corresponding to the faces of the model.
     *
     * @type {Array}
     */
    this.centroids = [];

    for (let i = 0; i < this.faceCount; i++) {
      this.centroids[i] = Utils.computeCentroid(this.modelGeometry, this.modelGeometry.faces[i]);
    }
  }

  bufferIndices () {
    const indexBuffer = new Uint32Array(this.faceCount * 3);

    this.setIndex(new BufferAttribute(indexBuffer, 1));

    for (let i = 0, offset = 0; i < this.faceCount; i++, offset += 3) {
      const face = this.modelGeometry.faces[i];

      indexBuffer[offset    ] = face.a;
      indexBuffer[offset + 1] = face.b;
      indexBuffer[offset + 2] = face.c;
    }
  }

  bufferPositions (localizeFaces) {
    const positionBuffer = this.createAttribute('position', 3).array;
    let i, offset;

    if (localizeFaces === true) {
      for (i = 0; i < this.faceCount; i++) {
        const face = this.modelGeometry.faces[i];
        const centroid = this.centroids ? this.centroids[i] : Utils.computeCentroid(this.modelGeometry, face);

        const a = this.modelGeometry.vertices[face.a];
        const b = this.modelGeometry.vertices[face.b];
        const c = this.modelGeometry.vertices[face.c];

        positionBuffer[face.a * 3]     = a.x - centroid.x;
        positionBuffer[face.a * 3 + 1] = a.y - centroid.y;
        positionBuffer[face.a * 3 + 2] = a.z - centroid.z;

        positionBuffer[face.b * 3]     = b.x - centroid.x;
        positionBuffer[face.b * 3 + 1] = b.y - centroid.y;
        positionBuffer[face.b * 3 + 2] = b.z - centroid.z;

        positionBuffer[face.c * 3]     = c.x - centroid.x;
        positionBuffer[face.c * 3 + 1] = c.y - centroid.y;
        positionBuffer[face.c * 3 + 2] = c.z - centroid.z;
      }
    }
    else {
      for (i = 0, offset = 0; i < this.vertexCount; i++, offset += 3) {
        const vertex = this.modelGeometry.vertices[i];

        positionBuffer[offset    ] = vertex.x;
        positionBuffer[offset + 1] = vertex.y;
        positionBuffer[offset + 2] = vertex.z;
      }
    }
  }

  /**
   * Creates a THREE.BufferAttribute with UV coordinates.
   */
  bufferUvs () {
    const uvBuffer = this.createAttribute('uv', 2).array;

    for (let i = 0; i < this.faceCount; i++) {

      const face = this.modelGeometry.faces[i];
      let uv;

      uv = this.modelGeometry.faceVertexUvs[0][i][0];
      uvBuffer[face.a * 2]     = uv.x;
      uvBuffer[face.a * 2 + 1] = uv.y;

      uv = this.modelGeometry.faceVertexUvs[0][i][1];
      uvBuffer[face.b * 2]     = uv.x;
      uvBuffer[face.b * 2 + 1] = uv.y;

      uv = this.modelGeometry.faceVertexUvs[0][i][2];
      uvBuffer[face.c * 2]     = uv.x;
      uvBuffer[face.c * 2 + 1] = uv.y;
    }
  }

  /**
   * Creates two THREE.BufferAttributes: skinIndex and skinWeight. Both are required for skinning.
   */
  bufferSkinning () {
    const skinIndexBuffer = this.createAttribute('skinIndex', 4).array;
    const skinWeightBuffer = this.createAttribute('skinWeight', 4).array;

    for (let i = 0; i < this.vertexCount; i++) {
      const skinIndex = this.modelGeometry.skinIndices[i];
      const skinWeight = this.modelGeometry.skinWeights[i];

      skinIndexBuffer[i * 4    ] = skinIndex.x;
      skinIndexBuffer[i * 4 + 1] = skinIndex.y;
      skinIndexBuffer[i * 4 + 2] = skinIndex.z;
      skinIndexBuffer[i * 4 + 3] = skinIndex.w;

      skinWeightBuffer[i * 4    ] = skinWeight.x;
      skinWeightBuffer[i * 4 + 1] = skinWeight.y;
      skinWeightBuffer[i * 4 + 2] = skinWeight.z;
      skinWeightBuffer[i * 4 + 3] = skinWeight.w;
    }
  }

  /**
   * Creates a THREE.BufferAttribute on this geometry instance.
   *
   * @param {String} name Name of the attribute.
   * @param {int} itemSize Number of floats per vertex (typically 1, 2, 3 or 4).
   * @param {function=} factory Function that will be called for each face upon creation. Accepts 3 arguments: data[], index and faceCount. Calls setFaceData.
   *
   * @returns {BufferAttribute}
   */
  createAttribute (name, itemSize, factory) {
    const buffer = new Float32Array(this.vertexCount * itemSize);
    const attribute = new BufferAttribute(buffer, itemSize);

    this.setAttribute(name, attribute);

    if (factory) {
      const data = [];

      for (let i = 0; i < this.faceCount; i++) {
        factory(data, i, this.faceCount);
        this.setFaceData(attribute, i, data);
      }
    }

    return attribute;
  }

  /**
   * Sets data for all vertices of a face at a given index.
   * Usually called in a loop.
   *
   * @param {String|THREE.BufferAttribute} attribute The attribute or attribute name where the data is to be stored.
   * @param {int} faceIndex Index of the face in the buffer geometry.
   * @param {Array} data Array of data. Length should be equal to item size of the attribute.
   */
  setFaceData (attribute, faceIndex, data) {
    attribute = (typeof attribute === 'string') ? this.attributes[attribute] : attribute;

    let offset = faceIndex * 3 * attribute.itemSize;

    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < attribute.itemSize; j++) {
        attribute.array[offset++] = data[j];
      }
    }
  }
}

class PointBufferGeometry extends BufferGeometry {
  /**
   * A THREE.BufferGeometry consists of points.
   * @param {Number} count The number of points.
   * @constructor
   */
  constructor (count) {
    super();

    /**
     * Number of points.
     * @type {Number}
     */
    this.pointCount = count;

    this.bufferPositions();
  }

  bufferPositions () {
    this.createAttribute('position', 3);
  }

  /**
   * Creates a THREE.BufferAttribute on this geometry instance.
   *
   * @param {String} name Name of the attribute.
   * @param {Number} itemSize Number of floats per vertex (typically 1, 2, 3 or 4).
   * @param {function=} factory Function that will be called for each point upon creation. Accepts 3 arguments: data[], index and prefabCount. Calls setPointData.
   *
   * @returns {THREE.BufferAttribute}
   */
  createAttribute (name, itemSize, factory) {
    const buffer = new Float32Array(this.pointCount * itemSize);
    const attribute = new BufferAttribute(buffer, itemSize);

    this.setAttribute(name, attribute);

    if (factory) {
      const data = [];
      for (let i = 0; i < this.pointCount; i++) {
        factory(data, i, this.pointCount);
        this.setPointData(attribute, i, data);
      }
    }

    return attribute;
  }

  setPointData (attribute, pointIndex, data) {
    attribute = (typeof attribute === 'string') ? this.attributes[attribute] : attribute;

    let offset = pointIndex * attribute.itemSize;

    for (let j = 0; j < attribute.itemSize; j++) {
      attribute.array[offset++] = data[j];
    }
  }
}

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


const ShaderChunk = {
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
  quaternion_slerp: quaternion_slerp,

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

TimelineSegment.prototype.compile = function() {
  return this.compiler(this);
};

Object.defineProperty(TimelineSegment.prototype, 'end', {
  get: function() {
    return this.start + this.duration;
  }
});

/**
 * A utility class to create an animation timeline which can be baked into a (vertex) shader.
 * By default the timeline supports translation, scale and rotation. This can be extended or overridden.
 * @constructor
 */
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
Timeline.register = function(key, definition) {
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
Timeline.prototype.add = function(duration, transitions, positionOffset) {
  // stop rollup from complaining about eval
  const _eval = eval;
  
  let start = this.duration;

  if (positionOffset !== undefined) {
    if (typeof positionOffset === 'number') {
      start = positionOffset;
    }
    else if (typeof positionOffset === 'string') {
      _eval('start' + positionOffset);
    }

    this.duration = Math.max(this.duration, start + duration);
  }
  else {
    this.duration += duration;
  }

  let keys = Object.keys(transitions), key;

  for (let i = 0; i < keys.length; i++) {
    key = keys[i];

    this.processTransition(key, transitions[key], start, duration);
  }
};

Timeline.prototype.processTransition = function(key, transition, start, duration) {
  const definition = Timeline.segmentDefinitions[key];

  let segments = this.segments[key];
  if (!segments) segments = this.segments[key] = [];

  if (transition.from === undefined) {
    if (segments.length === 0) {
      transition.from = definition.defaultFrom;
    }
    else {
      transition.from = segments[segments.length - 1].transition.to;
    }
  }

  segments.push(new TimelineSegment((this.__key++).toString(), start, duration, transition, definition.compiler));
};

/**
 * Compiles the timeline into a glsl string array that can be injected into a (vertex) shader.
 * @returns {Array}
 */
Timeline.prototype.compile = function() {
  const c = [];

  const keys = Object.keys(this.segments);
  let segments;

  for (let i = 0; i < keys.length; i++) {
    segments = this.segments[keys[i]];

    this.fillGaps(segments);

    segments.forEach(function(s) {
      c.push(s.compile());
    });
  }

  return c;
};
Timeline.prototype.fillGaps = function(segments) {
  if (segments.length === 0) return;

  let s0, s1;

  for (let i = 0; i < segments.length - 1; i++) {
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
Timeline.prototype.getTransformCalls = function(key) {
  let t = this.timeKey;

  return this.segments[key] ?  this.segments[key].map(function(s) {
    return `applyTransform${s.key}(${t}, transformed);`;
  }).join('\n') : '';
};

const TimelineChunks = {
  vec3: function(n, v, p) {
    const x = (v.x || 0).toPrecision(p);
    const y = (v.y || 0).toPrecision(p);
    const z = (v.z || 0).toPrecision(p);

    return `vec3 ${n} = vec3(${x}, ${y}, ${z});`;
  },
  vec4: function(n, v, p) {
    const x = (v.x || 0).toPrecision(p);
    const y = (v.y || 0).toPrecision(p);
    const z = (v.z || 0).toPrecision(p);
    const w = (v.w || 0).toPrecision(p);
  
    return `vec4 ${n} = vec4(${x}, ${y}, ${z}, ${w});`;
  },
  delayDuration: function(segment) {
    return `
    float cDelay${segment.key} = ${segment.start.toPrecision(4)};
    float cDuration${segment.key} = ${segment.duration.toPrecision(4)};
    `;
  },
  progress: function(segment) {
    // zero duration segments should always render complete
    if (segment.duration === 0) {
      return `float progress = 1.0;`
    }
    else {
      return `
      float progress = clamp(time - cDelay${segment.key}, 0.0, cDuration${segment.key}) / cDuration${segment.key};
      ${segment.transition.ease ? `progress = ${segment.transition.ease}(progress${(segment.transition.easeParams ? `, ${segment.transition.easeParams.map((v) => v.toPrecision(4)).join(`, `)}` : ``)});` : ``}
      `;
    }
  },
  renderCheck: function(segment) {
    const startTime = segment.start.toPrecision(4);
    const endTime = (segment.end + segment.trail).toPrecision(4);

    return `if (time < ${startTime} || time > ${endTime}) return;`;
  }
};

const TranslationSegment = {
  compiler: function(segment) {
    return `
    ${TimelineChunks.delayDuration(segment)}
    ${TimelineChunks.vec3(`cTranslateFrom${segment.key}`, segment.transition.from, 2)}
    ${TimelineChunks.vec3(`cTranslateTo${segment.key}`, segment.transition.to, 2)}
    
    void applyTransform${segment.key}(float time, inout vec3 v) {
    
      ${TimelineChunks.renderCheck(segment)}
      ${TimelineChunks.progress(segment)}
    
      v += mix(cTranslateFrom${segment.key}, cTranslateTo${segment.key}, progress);
    }
    `;
  },
  defaultFrom: new Vector3(0, 0, 0)
};

Timeline.register('translate', TranslationSegment);

const ScaleSegment = {
  compiler: function(segment) {
    const origin = segment.transition.origin;
    
    return `
    ${TimelineChunks.delayDuration(segment)}
    ${TimelineChunks.vec3(`cScaleFrom${segment.key}`, segment.transition.from, 2)}
    ${TimelineChunks.vec3(`cScaleTo${segment.key}`, segment.transition.to, 2)}
    ${origin ? TimelineChunks.vec3(`cOrigin${segment.key}`, origin, 2) : ''}
    
    void applyTransform${segment.key}(float time, inout vec3 v) {
    
      ${TimelineChunks.renderCheck(segment)}
      ${TimelineChunks.progress(segment)}
    
      ${origin ? `v -= cOrigin${segment.key};` : ''}
      v *= mix(cScaleFrom${segment.key}, cScaleTo${segment.key}, progress);
      ${origin ? `v += cOrigin${segment.key};` : ''}
    }
    `;
  },
  defaultFrom: new Vector3(1, 1, 1)
};

Timeline.register('scale', ScaleSegment);

const RotationSegment = {
  compiler(segment) {
    const fromAxisAngle = new Vector4(
      segment.transition.from.axis.x,
      segment.transition.from.axis.y,
      segment.transition.from.axis.z,
      segment.transition.from.angle
    );
  
    const toAxis = segment.transition.to.axis || segment.transition.from.axis;
    const toAxisAngle = new Vector4(
      toAxis.x,
      toAxis.y,
      toAxis.z,
      segment.transition.to.angle
    );
  
    const origin = segment.transition.origin;
    
    return `
    ${TimelineChunks.delayDuration(segment)}
    ${TimelineChunks.vec4(`cRotationFrom${segment.key}`, fromAxisAngle, 8)}
    ${TimelineChunks.vec4(`cRotationTo${segment.key}`, toAxisAngle, 8)}
    ${origin ? TimelineChunks.vec3(`cOrigin${segment.key}`, origin, 2) : ''}
    
    void applyTransform${segment.key}(float time, inout vec3 v) {
      ${TimelineChunks.renderCheck(segment)}
      ${TimelineChunks.progress(segment)}

      ${origin ? `v -= cOrigin${segment.key};` : ''}
      vec3 axis = normalize(mix(cRotationFrom${segment.key}.xyz, cRotationTo${segment.key}.xyz, progress));
      float angle = mix(cRotationFrom${segment.key}.w, cRotationTo${segment.key}.w, progress);
      vec4 q = quatFromAxisAngle(axis, angle);
      v = rotateVector(q, v);
      ${origin ? `v += cOrigin${segment.key};` : ''}
    }
    `;
  },
  defaultFrom: {axis: new Vector3(), angle: 0}
};

Timeline.register('rotate', RotationSegment);

export { BaseAnimationMaterial, BasicAnimationMaterial, DepthAnimationMaterial, DistanceAnimationMaterial, InstancedPrefabBufferGeometry, LambertAnimationMaterial, ModelBufferGeometry, MultiPrefabBufferGeometry, PhongAnimationMaterial, PointBufferGeometry, PointsAnimationMaterial, PrefabBufferGeometry, RotationSegment, ScaleSegment, ShaderChunk, StandardAnimationMaterial, Timeline, TimelineChunks, TimelineSegment, ToonAnimationMaterial, TranslationSegment, Utils };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzLm1vZHVsZS5qcyIsInNvdXJjZXMiOlsiLi4vc3JjL21hdGVyaWFscy9CYXNlQW5pbWF0aW9uTWF0ZXJpYWwuanMiLCIuLi9zcmMvbWF0ZXJpYWxzL0Jhc2ljQW5pbWF0aW9uTWF0ZXJpYWwuanMiLCIuLi9zcmMvbWF0ZXJpYWxzL0xhbWJlcnRBbmltYXRpb25NYXRlcmlhbC5qcyIsIi4uL3NyYy9tYXRlcmlhbHMvUGhvbmdBbmltYXRpb25NYXRlcmlhbC5qcyIsIi4uL3NyYy9tYXRlcmlhbHMvU3RhbmRhcmRBbmltYXRpb25NYXRlcmlhbC5qcyIsIi4uL3NyYy9tYXRlcmlhbHMvVG9vbkFuaW1hdGlvbk1hdGVyaWFsLmpzIiwiLi4vc3JjL21hdGVyaWFscy9Qb2ludHNBbmltYXRpb25NYXRlcmlhbC5qcyIsIi4uL3NyYy9tYXRlcmlhbHMvRGVwdGhBbmltYXRpb25NYXRlcmlhbC5qcyIsIi4uL3NyYy9tYXRlcmlhbHMvRGlzdGFuY2VBbmltYXRpb25NYXRlcmlhbC5qcyIsIi4uL3NyYy9nZW9tZXRyeS9QcmVmYWJCdWZmZXJHZW9tZXRyeS5qcyIsIi4uL3NyYy9nZW9tZXRyeS9NdWx0aVByZWZhYkJ1ZmZlckdlb21ldHJ5LmpzIiwiLi4vc3JjL2dlb21ldHJ5L0luc3RhbmNlZFByZWZhYkJ1ZmZlckdlb21ldHJ5LmpzIiwiLi4vc3JjL1V0aWxzLmpzIiwiLi4vc3JjL2dlb21ldHJ5L01vZGVsQnVmZmVyR2VvbWV0cnkuanMiLCIuLi9zcmMvZ2VvbWV0cnkvUG9pbnRCdWZmZXJHZW9tZXRyeS5qcyIsIi4uL3NyYy9TaGFkZXJDaHVuay5qcyIsIi4uL3NyYy90aW1lbGluZS9UaW1lbGluZVNlZ21lbnQuanMiLCIuLi9zcmMvdGltZWxpbmUvVGltZWxpbmUuanMiLCIuLi9zcmMvdGltZWxpbmUvVGltZWxpbmVDaHVua3MuanMiLCIuLi9zcmMvdGltZWxpbmUvVHJhbnNsYXRpb25TZWdtZW50LmpzIiwiLi4vc3JjL3RpbWVsaW5lL1NjYWxlU2VnbWVudC5qcyIsIi4uL3NyYy90aW1lbGluZS9Sb3RhdGlvblNlZ21lbnQuanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgU2hhZGVyTWF0ZXJpYWwsXG4gIFVuaWZvcm1zVXRpbHMsXG59IGZyb20gJ3RocmVlJztcblxuY2xhc3MgQmFzZUFuaW1hdGlvbk1hdGVyaWFsIGV4dGVuZHMgU2hhZGVyTWF0ZXJpYWwge1xuICBjb25zdHJ1Y3RvciAocGFyYW1ldGVycywgdW5pZm9ybXMpIHtcbiAgICBzdXBlcigpO1xuXG4gICAgaWYgKHBhcmFtZXRlcnMudW5pZm9ybVZhbHVlcykge1xuICAgICAgY29uc29sZS53YXJuKCdUSFJFRS5CQVMgLSBgdW5pZm9ybVZhbHVlc2AgaXMgZGVwcmVjYXRlZC4gUHV0IHRoZWlyIHZhbHVlcyBkaXJlY3RseSBpbnRvIHRoZSBwYXJhbWV0ZXJzLicpXG5cbiAgICAgIE9iamVjdC5rZXlzKHBhcmFtZXRlcnMudW5pZm9ybVZhbHVlcykuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgICAgIHBhcmFtZXRlcnNba2V5XSA9IHBhcmFtZXRlcnMudW5pZm9ybVZhbHVlc1trZXldXG4gICAgICB9KVxuXG4gICAgICBkZWxldGUgcGFyYW1ldGVycy51bmlmb3JtVmFsdWVzXG4gICAgfVxuXG4gICAgLy8gY29weSBwYXJhbWV0ZXJzIHRvICgxKSBtYWtlIHVzZSBvZiBpbnRlcm5hbCAjZGVmaW5lIGdlbmVyYXRpb25cbiAgICAvLyBhbmQgKDIpIHByZXZlbnQgJ3ggaXMgbm90IGEgcHJvcGVydHkgb2YgdGhpcyBtYXRlcmlhbCcgd2FybmluZ3MuXG4gICAgT2JqZWN0LmtleXMocGFyYW1ldGVycykuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgICB0aGlzW2tleV0gPSBwYXJhbWV0ZXJzW2tleV1cbiAgICB9KVxuXG4gICAgLy8gb3ZlcnJpZGUgZGVmYXVsdCBwYXJhbWV0ZXIgdmFsdWVzXG4gICAgdGhpcy5zZXRWYWx1ZXMocGFyYW1ldGVycyk7XG5cbiAgICAvLyBvdmVycmlkZSB1bmlmb3Jtc1xuICAgIHRoaXMudW5pZm9ybXMgPSBVbmlmb3Jtc1V0aWxzLm1lcmdlKFt1bmlmb3JtcywgcGFyYW1ldGVycy51bmlmb3JtcyB8fCB7fV0pO1xuXG4gICAgLy8gc2V0IHVuaWZvcm0gdmFsdWVzIGZyb20gcGFyYW1ldGVycyB0aGF0IGFmZmVjdCB1bmlmb3Jtc1xuICAgIHRoaXMuc2V0VW5pZm9ybVZhbHVlcyhwYXJhbWV0ZXJzKTtcbiAgfVxuXG4gIHNldFVuaWZvcm1WYWx1ZXMgKHZhbHVlcykge1xuICAgIGlmICghdmFsdWVzKSByZXR1cm47XG5cbiAgICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXModmFsdWVzKTtcblxuICAgIGtleXMuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgICBrZXkgaW4gdGhpcy51bmlmb3JtcyAmJiAodGhpcy51bmlmb3Jtc1trZXldLnZhbHVlID0gdmFsdWVzW2tleV0pO1xuICAgIH0pO1xuICB9XG5cbiAgc3RyaW5naWZ5Q2h1bmsgKG5hbWUpIHtcbiAgICBsZXQgdmFsdWU7XG5cbiAgICBpZiAoIXRoaXNbbmFtZV0pIHtcbiAgICAgIHZhbHVlID0gJyc7XG4gICAgfVxuICAgIGVsc2UgaWYgKHR5cGVvZiB0aGlzW25hbWVdID09PSAgJ3N0cmluZycpIHtcbiAgICAgIHZhbHVlID0gdGhpc1tuYW1lXTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICB2YWx1ZSA9IHRoaXNbbmFtZV0uam9pbignXFxuJyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IEJhc2VBbmltYXRpb25NYXRlcmlhbDtcbiIsImltcG9ydCB7IFNoYWRlckxpYiB9IGZyb20gJ3RocmVlJztcbmltcG9ydCBCYXNlQW5pbWF0aW9uTWF0ZXJpYWwgZnJvbSAnLi9CYXNlQW5pbWF0aW9uTWF0ZXJpYWwnO1xuXG5jbGFzcyBCYXNpY0FuaW1hdGlvbk1hdGVyaWFsIGV4dGVuZHMgQmFzZUFuaW1hdGlvbk1hdGVyaWFsIHtcbiAgLyoqXG4gICAqIEV4dGVuZHMgVEhSRUUuTWVzaEJhc2ljTWF0ZXJpYWwgd2l0aCBjdXN0b20gc2hhZGVyIGNodW5rcy5cbiAgICpcbiAgICogQHNlZSBodHRwOi8vdGhyZWUtYmFzLWV4YW1wbGVzLnN1cmdlLnNoL2V4YW1wbGVzL21hdGVyaWFsc19iYXNpYy9cbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9IHBhcmFtZXRlcnMgT2JqZWN0IGNvbnRhaW5pbmcgbWF0ZXJpYWwgcHJvcGVydGllcyBhbmQgY3VzdG9tIHNoYWRlciBjaHVua3MuXG4gICAqL1xuICBjb25zdHJ1Y3RvciAocGFyYW1ldGVycykge1xuICAgIHN1cGVyKHBhcmFtZXRlcnMsIFNoYWRlckxpYlsnYmFzaWMnXS51bmlmb3Jtcyk7XG5cbiAgICB0aGlzLmxpZ2h0cyA9IGZhbHNlO1xuICAgIHRoaXMudmVydGV4U2hhZGVyID0gdGhpcy5jb25jYXRWZXJ0ZXhTaGFkZXIoKTtcbiAgICB0aGlzLmZyYWdtZW50U2hhZGVyID0gdGhpcy5jb25jYXRGcmFnbWVudFNoYWRlcigpO1xuICB9XG5cbiAgY29uY2F0VmVydGV4U2hhZGVyICgpIHtcbiAgICByZXR1cm4gU2hhZGVyTGliLmJhc2ljLnZlcnRleFNoYWRlclxuICAgICAgLnJlcGxhY2UoXG4gICAgICAgICd2b2lkIG1haW4oKSB7JyxcbiAgICAgICAgYFxuICAgICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBhcmFtZXRlcnMnKX1cbiAgICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2YXJ5aW5nUGFyYW1ldGVycycpfVxuICAgICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleEZ1bmN0aW9ucycpfVxuXG4gICAgICAgIHZvaWQgbWFpbigpIHtcbiAgICAgICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleEluaXQnKX1cbiAgICAgICAgYFxuICAgICAgKVxuICAgICAgLnJlcGxhY2UoXG4gICAgICAgICcjaW5jbHVkZSA8YmVnaW5ub3JtYWxfdmVydGV4PicsXG4gICAgICAgIGBcbiAgICAgICAgI2luY2x1ZGUgPGJlZ2lubm9ybWFsX3ZlcnRleD5cbiAgICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhOb3JtYWwnKX1cbiAgICAgICAgYFxuICAgICAgKVxuICAgICAgLnJlcGxhY2UoXG4gICAgICAgICcjaW5jbHVkZSA8YmVnaW5fdmVydGV4PicsXG4gICAgICAgIGBcbiAgICAgICAgI2luY2x1ZGUgPGJlZ2luX3ZlcnRleD5cbiAgICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQb3NpdGlvbicpfVxuICAgICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleENvbG9yJyl9XG4gICAgICAgIGBcbiAgICAgIClcbiAgICAgIC5yZXBsYWNlKFxuICAgICAgICAnI2luY2x1ZGUgPG1vcnBodGFyZ2V0X3ZlcnRleD4nLFxuICAgICAgICBgXG4gICAgICAgICNpbmNsdWRlIDxtb3JwaHRhcmdldF92ZXJ0ZXg+XG4gICAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UG9zdE1vcnBoJyl9XG4gICAgICAgIGBcbiAgICAgIClcbiAgICAgIC5yZXBsYWNlKFxuICAgICAgICAnI2luY2x1ZGUgPHNraW5uaW5nX3ZlcnRleD4nLFxuICAgICAgICBgXG4gICAgICAgICNpbmNsdWRlIDxza2lubmluZ192ZXJ0ZXg+XG4gICAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UG9zdFNraW5uaW5nJyl9XG4gICAgICAgIGBcbiAgICAgIClcbiAgfVxuXG4gIGNvbmNhdEZyYWdtZW50U2hhZGVyICgpIHtcbiAgICByZXR1cm4gU2hhZGVyTGliLmJhc2ljLmZyYWdtZW50U2hhZGVyXG4gICAgICAucmVwbGFjZShcbiAgICAgICAgJ3ZvaWQgbWFpbigpIHsnLFxuICAgICAgICBgXG4gICAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRQYXJhbWV0ZXJzJyl9XG4gICAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmFyeWluZ1BhcmFtZXRlcnMnKX1cbiAgICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudEZ1bmN0aW9ucycpfVxuXG4gICAgICAgIHZvaWQgbWFpbigpIHtcbiAgICAgICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50SW5pdCcpfVxuICAgICAgICBgXG4gICAgICApXG4gICAgICAucmVwbGFjZShcbiAgICAgICAgJyNpbmNsdWRlIDxtYXBfZnJhZ21lbnQ+JyxcbiAgICAgICAgYFxuICAgICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50RGlmZnVzZScpfVxuICAgICAgICAkeyh0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudE1hcCcpIHx8ICcjaW5jbHVkZSA8bWFwX2ZyYWdtZW50PicpfVxuXG4gICAgICAgIGBcbiAgICAgIClcbiAgfVxufVxuXG5leHBvcnQgeyBCYXNpY0FuaW1hdGlvbk1hdGVyaWFsIH07XG4iLCJpbXBvcnQgeyBTaGFkZXJMaWIgfSBmcm9tICd0aHJlZSc7XG5pbXBvcnQgQmFzZUFuaW1hdGlvbk1hdGVyaWFsIGZyb20gJy4vQmFzZUFuaW1hdGlvbk1hdGVyaWFsJztcblxuY2xhc3MgTGFtYmVydEFuaW1hdGlvbk1hdGVyaWFsIGV4dGVuZHMgQmFzZUFuaW1hdGlvbk1hdGVyaWFsIHtcbiAgLyoqXG4gICAqIEV4dGVuZHMgVEhSRUUuTWVzaExhbWJlcnRNYXRlcmlhbCB3aXRoIGN1c3RvbSBzaGFkZXIgY2h1bmtzLlxuICAgKlxuICAgKiBAc2VlIGh0dHA6Ly90aHJlZS1iYXMtZXhhbXBsZXMuc3VyZ2Uuc2gvZXhhbXBsZXMvbWF0ZXJpYWxzX2xhbWJlcnQvXG4gICAqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBwYXJhbWV0ZXJzIE9iamVjdCBjb250YWluaW5nIG1hdGVyaWFsIHByb3BlcnRpZXMgYW5kIGN1c3RvbSBzaGFkZXIgY2h1bmtzLlxuICAgKiBAY29uc3RydWN0b3JcbiAgICovXG4gIGNvbnN0cnVjdG9yIChwYXJhbWV0ZXJzKSB7XG4gICAgc3VwZXIocGFyYW1ldGVycywgU2hhZGVyTGliWydsYW1iZXJ0J10udW5pZm9ybXMpO1xuXG4gICAgdGhpcy5saWdodHMgPSB0cnVlO1xuICAgIHRoaXMudmVydGV4U2hhZGVyID0gdGhpcy5jb25jYXRWZXJ0ZXhTaGFkZXIoKTtcbiAgICB0aGlzLmZyYWdtZW50U2hhZGVyID0gdGhpcy5jb25jYXRGcmFnbWVudFNoYWRlcigpO1xuICB9XG5cbiAgY29uY2F0VmVydGV4U2hhZGVyICgpIHtcbiAgICByZXR1cm4gU2hhZGVyTGliLmxhbWJlcnQudmVydGV4U2hhZGVyXG4gICAgICAucmVwbGFjZShcbiAgICAgICAgJ3ZvaWQgbWFpbigpIHsnLFxuICAgICAgICBgXG4gICAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UGFyYW1ldGVycycpfVxuICAgICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZhcnlpbmdQYXJhbWV0ZXJzJyl9XG4gICAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4RnVuY3Rpb25zJyl9XG5cbiAgICAgICAgdm9pZCBtYWluKCkge1xuICAgICAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4SW5pdCcpfVxuICAgICAgICBgXG4gICAgICApXG4gICAgICAucmVwbGFjZShcbiAgICAgICAgJyNpbmNsdWRlIDxiZWdpbm5vcm1hbF92ZXJ0ZXg+JyxcbiAgICAgICAgYFxuICAgICAgICAjaW5jbHVkZSA8YmVnaW5ub3JtYWxfdmVydGV4PlxuXG4gICAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4Tm9ybWFsJyl9XG4gICAgICAgIGBcbiAgICAgIClcbiAgICAgIC5yZXBsYWNlKFxuICAgICAgICAnI2luY2x1ZGUgPGJlZ2luX3ZlcnRleD4nLFxuICAgICAgICBgXG4gICAgICAgICNpbmNsdWRlIDxiZWdpbl92ZXJ0ZXg+XG5cbiAgICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQb3NpdGlvbicpfVxuICAgICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleENvbG9yJyl9XG4gICAgICAgIGBcbiAgICAgIClcbiAgICAgIC5yZXBsYWNlKFxuICAgICAgICAnI2luY2x1ZGUgPG1vcnBodGFyZ2V0X3ZlcnRleD4nLFxuICAgICAgICBgXG4gICAgICAgICNpbmNsdWRlIDxtb3JwaHRhcmdldF92ZXJ0ZXg+XG5cbiAgICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQb3N0TW9ycGgnKX1cbiAgICAgICAgYFxuICAgICAgKVxuICAgICAgLnJlcGxhY2UoXG4gICAgICAgICcjaW5jbHVkZSA8c2tpbm5pbmdfdmVydGV4PicsXG4gICAgICAgIGBcbiAgICAgICAgI2luY2x1ZGUgPHNraW5uaW5nX3ZlcnRleD5cblxuICAgICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBvc3RTa2lubmluZycpfVxuICAgICAgICBgXG4gICAgICApXG4gIH1cblxuICBjb25jYXRGcmFnbWVudFNoYWRlciAoKSB7XG4gICAgcmV0dXJuIFNoYWRlckxpYi5sYW1iZXJ0LmZyYWdtZW50U2hhZGVyXG4gICAgICAucmVwbGFjZShcbiAgICAgICAgJ3ZvaWQgbWFpbigpIHsnLFxuICAgICAgICBgXG4gICAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRQYXJhbWV0ZXJzJyl9XG4gICAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmFyeWluZ1BhcmFtZXRlcnMnKX1cbiAgICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudEZ1bmN0aW9ucycpfVxuXG4gICAgICAgIHZvaWQgbWFpbigpIHtcbiAgICAgICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50SW5pdCcpfVxuICAgICAgICBgXG4gICAgICApXG4gICAgICAucmVwbGFjZShcbiAgICAgICAgJyNpbmNsdWRlIDxtYXBfZnJhZ21lbnQ+JyxcbiAgICAgICAgYFxuICAgICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50RGlmZnVzZScpfVxuICAgICAgICAkeyh0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudE1hcCcpIHx8ICcjaW5jbHVkZSA8bWFwX2ZyYWdtZW50PicpfVxuXG4gICAgICAgIGBcbiAgICAgIClcbiAgICAgIC5yZXBsYWNlKFxuICAgICAgICAnI2luY2x1ZGUgPGVtaXNzaXZlbWFwX2ZyYWdtZW50PicsXG4gICAgICAgIGBcbiAgICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudEVtaXNzaXZlJyl9XG5cbiAgICAgICAgI2luY2x1ZGUgPGVtaXNzaXZlbWFwX2ZyYWdtZW50PlxuICAgICAgICBgXG4gICAgICApXG4gIH1cbn1cblxuZXhwb3J0IHsgTGFtYmVydEFuaW1hdGlvbk1hdGVyaWFsIH07XG4iLCJpbXBvcnQgeyBTaGFkZXJMaWIgfSBmcm9tICd0aHJlZSc7XG5pbXBvcnQgQmFzZUFuaW1hdGlvbk1hdGVyaWFsIGZyb20gJy4vQmFzZUFuaW1hdGlvbk1hdGVyaWFsJztcblxuY2xhc3MgUGhvbmdBbmltYXRpb25NYXRlcmlhbCBleHRlbmRzIEJhc2VBbmltYXRpb25NYXRlcmlhbCB7XG4gIC8qKlxuICAgKiBFeHRlbmRzIFRIUkVFLk1lc2hQaG9uZ01hdGVyaWFsIHdpdGggY3VzdG9tIHNoYWRlciBjaHVua3MuXG4gICAqXG4gICAqIEBzZWUgaHR0cDovL3RocmVlLWJhcy1leGFtcGxlcy5zdXJnZS5zaC9leGFtcGxlcy9tYXRlcmlhbHNfcGhvbmcvXG4gICAqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBwYXJhbWV0ZXJzIE9iamVjdCBjb250YWluaW5nIG1hdGVyaWFsIHByb3BlcnRpZXMgYW5kIGN1c3RvbSBzaGFkZXIgY2h1bmtzLlxuICAgKiBAY29uc3RydWN0b3JcbiAgICovXG4gIGNvbnN0cnVjdG9yIChwYXJhbWV0ZXJzKSB7XG4gICAgc3VwZXIocGFyYW1ldGVycywgU2hhZGVyTGliWydwaG9uZyddLnVuaWZvcm1zKTtcblxuICAgIHRoaXMubGlnaHRzID0gdHJ1ZTtcbiAgICB0aGlzLnZlcnRleFNoYWRlciA9IHRoaXMuY29uY2F0VmVydGV4U2hhZGVyKCk7XG4gICAgdGhpcy5mcmFnbWVudFNoYWRlciA9IHRoaXMuY29uY2F0RnJhZ21lbnRTaGFkZXIoKTtcbiAgfVxuXG4gIGNvbmNhdFZlcnRleFNoYWRlciAoKSB7XG4gICAgcmV0dXJuIFNoYWRlckxpYi5waG9uZy52ZXJ0ZXhTaGFkZXJcbiAgICAgIC5yZXBsYWNlKFxuICAgICAgICAndm9pZCBtYWluKCkgeycsXG4gICAgICAgIGBcbiAgICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQYXJhbWV0ZXJzJyl9XG4gICAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmFyeWluZ1BhcmFtZXRlcnMnKX1cbiAgICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhGdW5jdGlvbnMnKX1cblxuICAgICAgICB2b2lkIG1haW4oKSB7XG4gICAgICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhJbml0Jyl9XG4gICAgICAgIGBcbiAgICAgIClcbiAgICAgIC5yZXBsYWNlKFxuICAgICAgICAnI2luY2x1ZGUgPGJlZ2lubm9ybWFsX3ZlcnRleD4nLFxuICAgICAgICBgXG4gICAgICAgICNpbmNsdWRlIDxiZWdpbm5vcm1hbF92ZXJ0ZXg+XG5cbiAgICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhOb3JtYWwnKX1cbiAgICAgICAgYFxuICAgICAgKVxuICAgICAgLnJlcGxhY2UoXG4gICAgICAgICcjaW5jbHVkZSA8YmVnaW5fdmVydGV4PicsXG4gICAgICAgIGBcbiAgICAgICAgI2luY2x1ZGUgPGJlZ2luX3ZlcnRleD5cblxuICAgICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBvc2l0aW9uJyl9XG4gICAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4Q29sb3InKX1cbiAgICAgICAgYFxuICAgICAgKVxuICAgICAgLnJlcGxhY2UoXG4gICAgICAgICcjaW5jbHVkZSA8bW9ycGh0YXJnZXRfdmVydGV4PicsXG4gICAgICAgIGBcbiAgICAgICAgI2luY2x1ZGUgPG1vcnBodGFyZ2V0X3ZlcnRleD5cblxuICAgICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBvc3RNb3JwaCcpfVxuICAgICAgICBgXG4gICAgICApXG4gICAgICAucmVwbGFjZShcbiAgICAgICAgJyNpbmNsdWRlIDxza2lubmluZ192ZXJ0ZXg+JyxcbiAgICAgICAgYFxuICAgICAgICAjaW5jbHVkZSA8c2tpbm5pbmdfdmVydGV4PlxuXG4gICAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UG9zdFNraW5uaW5nJyl9XG4gICAgICAgIGBcbiAgICAgIClcbiAgfVxuXG4gIGNvbmNhdEZyYWdtZW50U2hhZGVyICgpIHtcbiAgICByZXR1cm4gU2hhZGVyTGliLnBob25nLmZyYWdtZW50U2hhZGVyXG4gICAgICAucmVwbGFjZShcbiAgICAgICAgJ3ZvaWQgbWFpbigpIHsnLFxuICAgICAgICBgXG4gICAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRQYXJhbWV0ZXJzJyl9XG4gICAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmFyeWluZ1BhcmFtZXRlcnMnKX1cbiAgICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudEZ1bmN0aW9ucycpfVxuXG4gICAgICAgIHZvaWQgbWFpbigpIHtcbiAgICAgICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50SW5pdCcpfVxuICAgICAgICBgXG4gICAgICApXG4gICAgICAucmVwbGFjZShcbiAgICAgICAgJyNpbmNsdWRlIDxtYXBfZnJhZ21lbnQ+JyxcbiAgICAgICAgYFxuICAgICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50RGlmZnVzZScpfVxuICAgICAgICAkeyh0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudE1hcCcpIHx8ICcjaW5jbHVkZSA8bWFwX2ZyYWdtZW50PicpfVxuXG4gICAgICAgIGBcbiAgICAgIClcbiAgICAgIC5yZXBsYWNlKFxuICAgICAgICAnI2luY2x1ZGUgPGVtaXNzaXZlbWFwX2ZyYWdtZW50PicsXG4gICAgICAgIGBcbiAgICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudEVtaXNzaXZlJyl9XG5cbiAgICAgICAgI2luY2x1ZGUgPGVtaXNzaXZlbWFwX2ZyYWdtZW50PlxuICAgICAgICBgXG4gICAgICApXG4gICAgICAucmVwbGFjZShcbiAgICAgICAgJyNpbmNsdWRlIDxsaWdodHNfcGhvbmdfZnJhZ21lbnQ+JyxcbiAgICAgICAgYFxuICAgICAgICAjaW5jbHVkZSA8bGlnaHRzX3Bob25nX2ZyYWdtZW50PlxuICAgICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50U3BlY3VsYXInKX1cbiAgICAgICAgYFxuICAgICAgKVxuICB9XG59XG5cbmV4cG9ydCB7IFBob25nQW5pbWF0aW9uTWF0ZXJpYWwgfTtcbiIsImltcG9ydCB7IFNoYWRlckxpYiB9IGZyb20gJ3RocmVlJztcbmltcG9ydCBCYXNlQW5pbWF0aW9uTWF0ZXJpYWwgZnJvbSAnLi9CYXNlQW5pbWF0aW9uTWF0ZXJpYWwnO1xuXG5jbGFzcyBTdGFuZGFyZEFuaW1hdGlvbk1hdGVyaWFsIGV4dGVuZHMgQmFzZUFuaW1hdGlvbk1hdGVyaWFsIHtcbiAgLyoqXG4gICAqIEV4dGVuZHMgVEhSRUUuTWVzaFN0YW5kYXJkTWF0ZXJpYWwgd2l0aCBjdXN0b20gc2hhZGVyIGNodW5rcy5cbiAgICpcbiAgICogQHNlZSBodHRwOi8vdGhyZWUtYmFzLWV4YW1wbGVzLnN1cmdlLnNoL2V4YW1wbGVzL21hdGVyaWFsc19zdGFuZGFyZC9cbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9IHBhcmFtZXRlcnMgT2JqZWN0IGNvbnRhaW5pbmcgbWF0ZXJpYWwgcHJvcGVydGllcyBhbmQgY3VzdG9tIHNoYWRlciBjaHVua3MuXG4gICAqL1xuICBjb25zdHJ1Y3RvciAocGFyYW1ldGVycykge1xuICAgIHN1cGVyKHBhcmFtZXRlcnMsIFNoYWRlckxpYlsncGh5c2ljYWwnXS51bmlmb3Jtcyk7XG5cbiAgICB0aGlzLmxpZ2h0cyA9IHRydWU7XG4gICAgdGhpcy5leHRlbnNpb25zID0gKHRoaXMuZXh0ZW5zaW9ucyB8fCB7fSk7XG4gICAgdGhpcy5leHRlbnNpb25zLmRlcml2YXRpdmVzID0gdHJ1ZTtcbiAgICB0aGlzLnZlcnRleFNoYWRlciA9IHRoaXMuY29uY2F0VmVydGV4U2hhZGVyKCk7XG4gICAgdGhpcy5mcmFnbWVudFNoYWRlciA9IHRoaXMuY29uY2F0RnJhZ21lbnRTaGFkZXIoKTtcbiAgfVxuXG4gIGNvbmNhdFZlcnRleFNoYWRlciAoKSB7XG4gICAgcmV0dXJuIFNoYWRlckxpYi5zdGFuZGFyZC52ZXJ0ZXhTaGFkZXJcbiAgICAgIC5yZXBsYWNlKFxuICAgICAgICAndm9pZCBtYWluKCkgeycsXG4gICAgICAgIGBcbiAgICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQYXJhbWV0ZXJzJyl9XG4gICAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmFyeWluZ1BhcmFtZXRlcnMnKX1cbiAgICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhGdW5jdGlvbnMnKX1cblxuICAgICAgICB2b2lkIG1haW4oKSB7XG4gICAgICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhJbml0Jyl9XG4gICAgICAgIGBcbiAgICAgIClcbiAgICAgIC5yZXBsYWNlKFxuICAgICAgICAnI2luY2x1ZGUgPGJlZ2lubm9ybWFsX3ZlcnRleD4nLFxuICAgICAgICBgXG4gICAgICAgICNpbmNsdWRlIDxiZWdpbm5vcm1hbF92ZXJ0ZXg+XG5cbiAgICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhOb3JtYWwnKX1cbiAgICAgICAgYFxuICAgICAgKVxuICAgICAgLnJlcGxhY2UoXG4gICAgICAgICcjaW5jbHVkZSA8YmVnaW5fdmVydGV4PicsXG4gICAgICAgIGBcbiAgICAgICAgI2luY2x1ZGUgPGJlZ2luX3ZlcnRleD5cblxuICAgICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBvc2l0aW9uJyl9XG4gICAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4Q29sb3InKX1cbiAgICAgICAgYFxuICAgICAgKVxuICAgICAgLnJlcGxhY2UoXG4gICAgICAgICcjaW5jbHVkZSA8bW9ycGh0YXJnZXRfdmVydGV4PicsXG4gICAgICAgIGBcbiAgICAgICAgI2luY2x1ZGUgPG1vcnBodGFyZ2V0X3ZlcnRleD5cblxuICAgICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBvc3RNb3JwaCcpfVxuICAgICAgICBgXG4gICAgICApXG4gICAgICAucmVwbGFjZShcbiAgICAgICAgJyNpbmNsdWRlIDxza2lubmluZ192ZXJ0ZXg+JyxcbiAgICAgICAgYFxuICAgICAgICAjaW5jbHVkZSA8c2tpbm5pbmdfdmVydGV4PlxuXG4gICAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UG9zdFNraW5uaW5nJyl9XG4gICAgICAgIGBcbiAgICAgIClcbiAgfVxuXG4gIGNvbmNhdEZyYWdtZW50U2hhZGVyICgpIHtcbiAgICByZXR1cm4gU2hhZGVyTGliLnN0YW5kYXJkLmZyYWdtZW50U2hhZGVyXG4gICAgICAucmVwbGFjZShcbiAgICAgICAgJ3ZvaWQgbWFpbigpIHsnLFxuICAgICAgICBgXG4gICAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRQYXJhbWV0ZXJzJyl9XG4gICAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmFyeWluZ1BhcmFtZXRlcnMnKX1cbiAgICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudEZ1bmN0aW9ucycpfVxuXG4gICAgICAgIHZvaWQgbWFpbigpIHtcbiAgICAgICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50SW5pdCcpfVxuICAgICAgICBgXG4gICAgICApXG4gICAgICAucmVwbGFjZShcbiAgICAgICAgJyNpbmNsdWRlIDxtYXBfZnJhZ21lbnQ+JyxcbiAgICAgICAgYFxuICAgICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50RGlmZnVzZScpfVxuICAgICAgICAkeyh0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudE1hcCcpIHx8ICcjaW5jbHVkZSA8bWFwX2ZyYWdtZW50PicpfVxuXG4gICAgICAgIGBcbiAgICAgIClcbiAgICAgIC5yZXBsYWNlKFxuICAgICAgICAnI2luY2x1ZGUgPGVtaXNzaXZlbWFwX2ZyYWdtZW50PicsXG4gICAgICAgIGBcbiAgICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudEVtaXNzaXZlJyl9XG5cbiAgICAgICAgI2luY2x1ZGUgPGVtaXNzaXZlbWFwX2ZyYWdtZW50PlxuICAgICAgICBgXG4gICAgICApXG4gICAgICAucmVwbGFjZShcbiAgICAgICAgJyNpbmNsdWRlIDxyb3VnaG5lc3NtYXBfZnJhZ21lbnQ+JyxcbiAgICAgICAgYFxuICAgICAgICBmbG9hdCByb3VnaG5lc3NGYWN0b3IgPSByb3VnaG5lc3M7XG4gICAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRSb3VnaG5lc3MnKX1cbiAgICAgICAgI2lmZGVmIFVTRV9ST1VHSE5FU1NNQVBcblxuICAgICAgICB2ZWM0IHRleGVsUm91Z2huZXNzID0gdGV4dHVyZTJEKCByb3VnaG5lc3NNYXAsIHZVdiApO1xuICAgICAgICAgIHJvdWdobmVzc0ZhY3RvciAqPSB0ZXhlbFJvdWdobmVzcy5nO1xuICAgICAgICAjZW5kaWZcbiAgICAgICAgYFxuICAgICAgKVxuICAgICAgLnJlcGxhY2UoXG4gICAgICAgICcjaW5jbHVkZSA8bWV0YWxuZXNzbWFwX2ZyYWdtZW50PicsXG4gICAgICAgIGBcbiAgICAgICAgZmxvYXQgbWV0YWxuZXNzRmFjdG9yID0gbWV0YWxuZXNzO1xuICAgICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50TWV0YWxuZXNzJyl9XG5cbiAgICAgICAgI2lmZGVmIFVTRV9NRVRBTE5FU1NNQVBcbiAgICAgICAgICB2ZWM0IHRleGVsTWV0YWxuZXNzID0gdGV4dHVyZTJEKCBtZXRhbG5lc3NNYXAsIHZVdiApO1xuICAgICAgICAgIG1ldGFsbmVzc0ZhY3RvciAqPSB0ZXhlbE1ldGFsbmVzcy5iO1xuICAgICAgICAjZW5kaWZcbiAgICAgICAgYFxuICAgICAgKVxuICB9XG59XG5cbmV4cG9ydCB7IFN0YW5kYXJkQW5pbWF0aW9uTWF0ZXJpYWwgfTtcbiIsImltcG9ydCB7IFNoYWRlckxpYiB9IGZyb20gJ3RocmVlJ1xuaW1wb3J0IEJhc2VBbmltYXRpb25NYXRlcmlhbCBmcm9tICcuL0Jhc2VBbmltYXRpb25NYXRlcmlhbCc7XG5cbmNsYXNzIFRvb25BbmltYXRpb25NYXRlcmlhbCBleHRlbmRzIEJhc2VBbmltYXRpb25NYXRlcmlhbCB7XG4gIC8qKlxuICAgKiBFeHRlbmRzIFRIUkVFLk1lc2hUb29uTWF0ZXJpYWwgd2l0aCBjdXN0b20gc2hhZGVyIGNodW5rcy5cbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9IHBhcmFtZXRlcnMgT2JqZWN0IGNvbnRhaW5pbmcgbWF0ZXJpYWwgcHJvcGVydGllcyBhbmQgY3VzdG9tIHNoYWRlciBjaHVua3MuXG4gICAqL1xuICBjb25zdHJ1Y3RvciAocGFyYW1ldGVycykge1xuICAgIHN1cGVyKHBhcmFtZXRlcnMsIFNoYWRlckxpYlsndG9vbiddLnVuaWZvcm1zKTtcblxuICAgIHRoaXMubGlnaHRzID0gdHJ1ZTtcbiAgICB0aGlzLnZlcnRleFNoYWRlciA9IHRoaXMuY29uY2F0VmVydGV4U2hhZGVyKCk7XG4gICAgdGhpcy5mcmFnbWVudFNoYWRlciA9IHRoaXMuY29uY2F0RnJhZ21lbnRTaGFkZXIoKTtcbiAgfVxuXG4gIGNvbmNhdFZlcnRleFNoYWRlciAoKSB7XG4gICAgcmV0dXJuIFNoYWRlckxpYi50b29uLnZlcnRleFNoYWRlclxuICAgICAgLnJlcGxhY2UoXG4gICAgICAgICd2b2lkIG1haW4oKSB7JyxcbiAgICAgICAgYFxuICAgICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBhcmFtZXRlcnMnKX1cbiAgICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2YXJ5aW5nUGFyYW1ldGVycycpfVxuICAgICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleEZ1bmN0aW9ucycpfVxuXG4gICAgICAgIHZvaWQgbWFpbigpIHtcbiAgICAgICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleEluaXQnKX1cbiAgICAgICAgYFxuICAgICAgKVxuICAgICAgLnJlcGxhY2UoXG4gICAgICAgICcjaW5jbHVkZSA8YmVnaW5ub3JtYWxfdmVydGV4PicsXG4gICAgICAgIGBcbiAgICAgICAgI2luY2x1ZGUgPGJlZ2lubm9ybWFsX3ZlcnRleD5cblxuICAgICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleE5vcm1hbCcpfVxuICAgICAgICBgXG4gICAgICApXG4gICAgICAucmVwbGFjZShcbiAgICAgICAgJyNpbmNsdWRlIDxiZWdpbl92ZXJ0ZXg+JyxcbiAgICAgICAgYFxuICAgICAgICAjaW5jbHVkZSA8YmVnaW5fdmVydGV4PlxuXG4gICAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UG9zaXRpb24nKX1cbiAgICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhDb2xvcicpfVxuICAgICAgICBgXG4gICAgICApXG4gICAgICAucmVwbGFjZShcbiAgICAgICAgJyNpbmNsdWRlIDxtb3JwaHRhcmdldF92ZXJ0ZXg+JyxcbiAgICAgICAgYFxuICAgICAgICAjaW5jbHVkZSA8bW9ycGh0YXJnZXRfdmVydGV4PlxuXG4gICAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UG9zdE1vcnBoJyl9XG4gICAgICAgIGBcbiAgICAgIClcbiAgICAgIC5yZXBsYWNlKFxuICAgICAgICAnI2luY2x1ZGUgPHNraW5uaW5nX3ZlcnRleD4nLFxuICAgICAgICBgXG4gICAgICAgICNpbmNsdWRlIDxza2lubmluZ192ZXJ0ZXg+XG5cbiAgICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQb3N0U2tpbm5pbmcnKX1cbiAgICAgICAgYFxuICAgICAgKVxuICB9XG5cbiAgY29uY2F0RnJhZ21lbnRTaGFkZXIgKCkge1xuICAgIHJldHVybiBTaGFkZXJMaWIudG9vbi5mcmFnbWVudFNoYWRlclxuICAgICAgLnJlcGxhY2UoXG4gICAgICAgICd2b2lkIG1haW4oKSB7JyxcbiAgICAgICAgYFxuICAgICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50UGFyYW1ldGVycycpfVxuICAgICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZhcnlpbmdQYXJhbWV0ZXJzJyl9XG4gICAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRGdW5jdGlvbnMnKX1cblxuICAgICAgICB2b2lkIG1haW4oKSB7XG4gICAgICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudEluaXQnKX1cbiAgICAgICAgYFxuICAgICAgKVxuICAgICAgLnJlcGxhY2UoXG4gICAgICAgICcjaW5jbHVkZSA8bWFwX2ZyYWdtZW50PicsXG4gICAgICAgIGBcbiAgICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudERpZmZ1c2UnKX1cbiAgICAgICAgJHsodGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRNYXAnKSB8fCAnI2luY2x1ZGUgPG1hcF9mcmFnbWVudD4nKX1cblxuICAgICAgICBgXG4gICAgICApXG4gICAgICAucmVwbGFjZShcbiAgICAgICAgJyNpbmNsdWRlIDxlbWlzc2l2ZW1hcF9mcmFnbWVudD4nLFxuICAgICAgICBgXG4gICAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRFbWlzc2l2ZScpfVxuXG4gICAgICAgICNpbmNsdWRlIDxlbWlzc2l2ZW1hcF9mcmFnbWVudD5cbiAgICAgICAgYFxuICAgICAgKVxuICB9XG59XG5cbmV4cG9ydCB7IFRvb25BbmltYXRpb25NYXRlcmlhbCB9O1xuIiwiaW1wb3J0IHsgU2hhZGVyTGliIH0gZnJvbSAndGhyZWUnO1xuaW1wb3J0IEJhc2VBbmltYXRpb25NYXRlcmlhbCBmcm9tICcuL0Jhc2VBbmltYXRpb25NYXRlcmlhbCc7XG5cbmNsYXNzIFBvaW50c0FuaW1hdGlvbk1hdGVyaWFsIGV4dGVuZHMgQmFzZUFuaW1hdGlvbk1hdGVyaWFsIHtcbiAgLyoqXG4gICAqIEV4dGVuZHMgVEhSRUUuUG9pbnRzTWF0ZXJpYWwgd2l0aCBjdXN0b20gc2hhZGVyIGNodW5rcy5cbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9IHBhcmFtZXRlcnMgT2JqZWN0IGNvbnRhaW5pbmcgbWF0ZXJpYWwgcHJvcGVydGllcyBhbmQgY3VzdG9tIHNoYWRlciBjaHVua3MuXG4gICAqIEBjb25zdHJ1Y3RvclxuICAgKi9cbiAgY29uc3RydWN0b3IgKHBhcmFtZXRlcnMpIHtcbiAgICBzdXBlcihwYXJhbWV0ZXJzLCBTaGFkZXJMaWJbJ3BvaW50cyddLnVuaWZvcm1zKTtcblxuICAgIHRoaXMudmVydGV4U2hhZGVyID0gdGhpcy5jb25jYXRWZXJ0ZXhTaGFkZXIoKTtcbiAgICB0aGlzLmZyYWdtZW50U2hhZGVyID0gdGhpcy5jb25jYXRGcmFnbWVudFNoYWRlcigpO1xuICB9XG5cbiAgY29uY2F0VmVydGV4U2hhZGVyICgpIHtcbiAgICByZXR1cm4gU2hhZGVyTGliLnBvaW50cy52ZXJ0ZXhTaGFkZXJcbiAgICAgIC5yZXBsYWNlKFxuICAgICAgICAndm9pZCBtYWluKCkgeycsXG4gICAgICAgIGBcbiAgICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQYXJhbWV0ZXJzJyl9XG4gICAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmFyeWluZ1BhcmFtZXRlcnMnKX1cbiAgICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhGdW5jdGlvbnMnKX1cblxuICAgICAgICB2b2lkIG1haW4oKSB7XG4gICAgICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhJbml0Jyl9XG4gICAgICAgIGBcbiAgICAgIClcbiAgICAgIC5yZXBsYWNlKFxuICAgICAgICAnI2luY2x1ZGUgPGJlZ2luX3ZlcnRleD4nLFxuICAgICAgICBgXG4gICAgICAgICNpbmNsdWRlIDxiZWdpbl92ZXJ0ZXg+XG5cbiAgICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQb3NpdGlvbicpfVxuICAgICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleENvbG9yJyl9XG4gICAgICAgIGBcbiAgICAgIClcbiAgICAgIC5yZXBsYWNlKFxuICAgICAgICAnI2luY2x1ZGUgPG1vcnBodGFyZ2V0X3ZlcnRleD4nLFxuICAgICAgICBgXG4gICAgICAgICNpbmNsdWRlIDxtb3JwaHRhcmdldF92ZXJ0ZXg+XG5cbiAgICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQb3N0TW9ycGgnKX1cbiAgICAgICAgYFxuICAgICAgKVxuICB9XG5cbiAgY29uY2F0RnJhZ21lbnRTaGFkZXIgKCkge1xuICAgIHJldHVybiBTaGFkZXJMaWIucG9pbnRzLmZyYWdtZW50U2hhZGVyXG4gICAgICAucmVwbGFjZShcbiAgICAgICAgJ3ZvaWQgbWFpbigpIHsnLFxuICAgICAgICBgXG4gICAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRQYXJhbWV0ZXJzJyl9XG4gICAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmFyeWluZ1BhcmFtZXRlcnMnKX1cbiAgICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudEZ1bmN0aW9ucycpfVxuXG4gICAgICAgIHZvaWQgbWFpbigpIHtcbiAgICAgICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50SW5pdCcpfVxuICAgICAgICBgXG4gICAgICApXG4gICAgICAucmVwbGFjZShcbiAgICAgICAgJyNpbmNsdWRlIDxtYXBfZnJhZ21lbnQ+JyxcbiAgICAgICAgYFxuICAgICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50RGlmZnVzZScpfVxuICAgICAgICAkeyh0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudE1hcCcpIHx8ICcjaW5jbHVkZSA8bWFwX2ZyYWdtZW50PicpfVxuXG4gICAgICAgIGBcbiAgICAgIClcbiAgICAgIC5yZXBsYWNlKFxuICAgICAgICAnI2luY2x1ZGUgPHByZW11bHRpcGxpZWRfYWxwaGFfZnJhZ21lbnQ+JyxcbiAgICAgICAgYFxuICAgICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50U2hhcGUnKX1cblxuICAgICAgICAjaW5jbHVkZSA8cHJlbXVsdGlwbGllZF9hbHBoYV9mcmFnbWVudD5cbiAgICAgICAgYFxuICAgICAgKVxuICB9XG59XG5cbmV4cG9ydCB7IFBvaW50c0FuaW1hdGlvbk1hdGVyaWFsIH07XG4iLCJpbXBvcnQgeyBTaGFkZXJMaWIsIFJHQkFEZXB0aFBhY2tpbmcgfSBmcm9tICd0aHJlZSc7XG5pbXBvcnQgQmFzZUFuaW1hdGlvbk1hdGVyaWFsIGZyb20gJy4vQmFzZUFuaW1hdGlvbk1hdGVyaWFsJztcblxuY2xhc3MgRGVwdGhBbmltYXRpb25NYXRlcmlhbCBleHRlbmRzIEJhc2VBbmltYXRpb25NYXRlcmlhbCB7XG4gIGNvbnN0cnVjdG9yIChwYXJhbWV0ZXJzKSB7XG4gICAgc3VwZXIocGFyYW1ldGVycywgU2hhZGVyTGliWydkZXB0aCddLnVuaWZvcm1zKTtcblxuICAgIHRoaXMuZGVwdGhQYWNraW5nID0gUkdCQURlcHRoUGFja2luZztcbiAgICB0aGlzLmNsaXBwaW5nID0gdHJ1ZTtcbiAgICB0aGlzLnZlcnRleFNoYWRlciA9IHRoaXMuY29uY2F0VmVydGV4U2hhZGVyKCk7XG4gICAgdGhpcy5mcmFnbWVudFNoYWRlciA9IFNoYWRlckxpYlsnZGVwdGgnXS5mcmFnbWVudFNoYWRlcjtcbiAgfVxuXG4gIGNvbmNhdFZlcnRleFNoYWRlciAoKSB7XG4gICAgcmV0dXJuIFNoYWRlckxpYi5kZXB0aC52ZXJ0ZXhTaGFkZXJcbiAgICAgIC5yZXBsYWNlKFxuICAgICAgICAndm9pZCBtYWluKCkgeycsXG4gICAgICAgIGBcbiAgICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQYXJhbWV0ZXJzJyl9XG4gICAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4RnVuY3Rpb25zJyl9XG5cbiAgICAgICAgdm9pZCBtYWluKCkge1xuICAgICAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4SW5pdCcpfVxuICAgICAgICBgXG4gICAgICApXG4gICAgICAucmVwbGFjZShcbiAgICAgICAgJyNpbmNsdWRlIDxiZWdpbl92ZXJ0ZXg+JyxcbiAgICAgICAgYFxuICAgICAgICAjaW5jbHVkZSA8YmVnaW5fdmVydGV4PlxuXG4gICAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UG9zaXRpb24nKX1cbiAgICAgICAgYFxuICAgICAgKVxuICAgICAgLnJlcGxhY2UoXG4gICAgICAgICcjaW5jbHVkZSA8bW9ycGh0YXJnZXRfdmVydGV4PicsXG4gICAgICAgIGBcbiAgICAgICAgI2luY2x1ZGUgPG1vcnBodGFyZ2V0X3ZlcnRleD5cblxuICAgICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBvc3RNb3JwaCcpfVxuICAgICAgICBgXG4gICAgICApXG4gICAgICAucmVwbGFjZShcbiAgICAgICAgJyNpbmNsdWRlIDxza2lubmluZ192ZXJ0ZXg+JyxcbiAgICAgICAgYFxuICAgICAgICAjaW5jbHVkZSA8c2tpbm5pbmdfdmVydGV4PlxuXG4gICAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UG9zdFNraW5uaW5nJyl9XG4gICAgICAgIGBcbiAgICAgIClcbiAgfVxufVxuXG5leHBvcnQgeyBEZXB0aEFuaW1hdGlvbk1hdGVyaWFsIH07XG4iLCJpbXBvcnQgeyBTaGFkZXJMaWIsIFJHQkFEZXB0aFBhY2tpbmcgfSBmcm9tICd0aHJlZSc7XG5pbXBvcnQgQmFzZUFuaW1hdGlvbk1hdGVyaWFsIGZyb20gJy4vQmFzZUFuaW1hdGlvbk1hdGVyaWFsJztcblxuY2xhc3MgRGlzdGFuY2VBbmltYXRpb25NYXRlcmlhbCBleHRlbmRzIEJhc2VBbmltYXRpb25NYXRlcmlhbCB7XG4gIGNvbnN0cnVjdG9yIChwYXJhbWV0ZXJzKSB7XG4gICAgc3VwZXIocGFyYW1ldGVycywgU2hhZGVyTGliWydkaXN0YW5jZVJHQkEnXS51bmlmb3Jtcyk7XG5cbiAgICB0aGlzLmRlcHRoUGFja2luZyA9IFJHQkFEZXB0aFBhY2tpbmc7XG4gICAgdGhpcy5jbGlwcGluZyA9IHRydWU7XG4gICAgdGhpcy52ZXJ0ZXhTaGFkZXIgPSB0aGlzLmNvbmNhdFZlcnRleFNoYWRlcigpO1xuICAgIHRoaXMuZnJhZ21lbnRTaGFkZXIgPSBTaGFkZXJMaWJbJ2Rpc3RhbmNlUkdCQSddLmZyYWdtZW50U2hhZGVyO1xuICB9XG5cbiAgY29uY2F0VmVydGV4U2hhZGVyICgpIHtcbiAgICByZXR1cm4gU2hhZGVyTGliLmRpc3RhbmNlUkdCQS52ZXJ0ZXhTaGFkZXJcbiAgICAgIC5yZXBsYWNlKFxuICAgICAgICAndm9pZCBtYWluKCkgeycsXG4gICAgICAgIGBcbiAgICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQYXJhbWV0ZXJzJyl9XG4gICAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4RnVuY3Rpb25zJyl9XG5cbiAgICAgICAgdm9pZCBtYWluKCkge1xuICAgICAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4SW5pdCcpfVxuICAgICAgICBgXG4gICAgICApXG4gICAgICAucmVwbGFjZShcbiAgICAgICAgJyNpbmNsdWRlIDxiZWdpbl92ZXJ0ZXg+JyxcbiAgICAgICAgYFxuICAgICAgICAjaW5jbHVkZSA8YmVnaW5fdmVydGV4PlxuXG4gICAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UG9zaXRpb24nKX1cbiAgICAgICAgYFxuICAgICAgKVxuICAgICAgLnJlcGxhY2UoXG4gICAgICAgICcjaW5jbHVkZSA8bW9ycGh0YXJnZXRfdmVydGV4PicsXG4gICAgICAgIGBcbiAgICAgICAgI2luY2x1ZGUgPG1vcnBodGFyZ2V0X3ZlcnRleD5cblxuICAgICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBvc3RNb3JwaCcpfVxuICAgICAgICBgXG4gICAgICApXG4gICAgICAucmVwbGFjZShcbiAgICAgICAgJyNpbmNsdWRlIDxza2lubmluZ192ZXJ0ZXg+JyxcbiAgICAgICAgYFxuICAgICAgICAjaW5jbHVkZSA8c2tpbm5pbmdfdmVydGV4PlxuXG4gICAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UG9zdFNraW5uaW5nJyl9XG4gICAgICAgIGBcbiAgICAgIClcbiAgfVxufVxuXG5leHBvcnQgeyBEaXN0YW5jZUFuaW1hdGlvbk1hdGVyaWFsIH07XG4iLCJpbXBvcnQgeyBCdWZmZXJHZW9tZXRyeSwgQnVmZmVyQXR0cmlidXRlIH0gZnJvbSAndGhyZWUnO1xuXG5jbGFzcyBQcmVmYWJCdWZmZXJHZW9tZXRyeSBleHRlbmRzIEJ1ZmZlckdlb21ldHJ5IHtcbiAgLyoqXG4gICAqIEEgQnVmZmVyR2VvbWV0cnkgd2hlcmUgYSAncHJlZmFiJyBnZW9tZXRyeSBpcyByZXBlYXRlZCBhIG51bWJlciBvZiB0aW1lcy5cbiAgICpcbiAgICogQHBhcmFtIHtHZW9tZXRyeXxCdWZmZXJHZW9tZXRyeX0gcHJlZmFiIFRoZSBHZW9tZXRyeSBpbnN0YW5jZSB0byByZXBlYXQuXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBjb3VudCBUaGUgbnVtYmVyIG9mIHRpbWVzIHRvIHJlcGVhdCB0aGUgZ2VvbWV0cnkuXG4gICAqL1xuICBjb25zdHJ1Y3RvciAocHJlZmFiLCBjb3VudCkge1xuICAgIHN1cGVyKCk7XG5cbiAgICAvKipcbiAgICAgKiBBIHJlZmVyZW5jZSB0byB0aGUgcHJlZmFiIGdlb21ldHJ5IHVzZWQgdG8gY3JlYXRlIHRoaXMgaW5zdGFuY2UuXG4gICAgICogQHR5cGUge0dlb21ldHJ5fEJ1ZmZlckdlb21ldHJ5fVxuICAgICAqL1xuICAgIHRoaXMucHJlZmFiR2VvbWV0cnkgPSBwcmVmYWI7XG4gICAgdGhpcy5pc1ByZWZhYkJ1ZmZlckdlb21ldHJ5ID0gcHJlZmFiLmlzQnVmZmVyR2VvbWV0cnk7XG5cbiAgICAvKipcbiAgICAgKiBOdW1iZXIgb2YgcHJlZmFicy5cbiAgICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgICAqL1xuICAgIHRoaXMucHJlZmFiQ291bnQgPSBjb3VudDtcblxuICAgIC8qKlxuICAgICAqIE51bWJlciBvZiB2ZXJ0aWNlcyBvZiB0aGUgcHJlZmFiLlxuICAgICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAgICovXG4gICAgaWYgKHRoaXMuaXNQcmVmYWJCdWZmZXJHZW9tZXRyeSkge1xuICAgICAgdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudCA9IHByZWZhYi5hdHRyaWJ1dGVzLnBvc2l0aW9uLmNvdW50O1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHRoaXMucHJlZmFiVmVydGV4Q291bnQgPSBwcmVmYWIudmVydGljZXMubGVuZ3RoO1xuICAgIH1cblxuICAgIHRoaXMuYnVmZmVySW5kaWNlcygpO1xuICAgIHRoaXMuYnVmZmVyUG9zaXRpb25zKCk7XG4gIH1cblxuICBidWZmZXJJbmRpY2VzICgpIHtcbiAgICBsZXQgcHJlZmFiSW5kaWNlcyA9IFtdO1xuICAgIGxldCBwcmVmYWJJbmRleENvdW50O1xuXG4gICAgaWYgKHRoaXMuaXNQcmVmYWJCdWZmZXJHZW9tZXRyeSkge1xuICAgICAgaWYgKHRoaXMucHJlZmFiR2VvbWV0cnkuaW5kZXgpIHtcbiAgICAgICAgcHJlZmFiSW5kZXhDb3VudCA9IHRoaXMucHJlZmFiR2VvbWV0cnkuaW5kZXguY291bnQ7XG4gICAgICAgIHByZWZhYkluZGljZXMgPSB0aGlzLnByZWZhYkdlb21ldHJ5LmluZGV4LmFycmF5O1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIHByZWZhYkluZGV4Q291bnQgPSB0aGlzLnByZWZhYlZlcnRleENvdW50O1xuXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHJlZmFiSW5kZXhDb3VudDsgaSsrKSB7XG4gICAgICAgICAgcHJlZmFiSW5kaWNlcy5wdXNoKGkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgY29uc3QgcHJlZmFiRmFjZUNvdW50ID0gdGhpcy5wcmVmYWJHZW9tZXRyeS5mYWNlcy5sZW5ndGg7XG4gICAgICBwcmVmYWJJbmRleENvdW50ID0gcHJlZmFiRmFjZUNvdW50ICogMztcblxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcmVmYWJGYWNlQ291bnQ7IGkrKykge1xuICAgICAgICBjb25zdCBmYWNlID0gdGhpcy5wcmVmYWJHZW9tZXRyeS5mYWNlc1tpXTtcbiAgICAgICAgcHJlZmFiSW5kaWNlcy5wdXNoKGZhY2UuYSwgZmFjZS5iLCBmYWNlLmMpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IGluZGV4QnVmZmVyID0gbmV3IFVpbnQzMkFycmF5KHRoaXMucHJlZmFiQ291bnQgKiBwcmVmYWJJbmRleENvdW50KTtcblxuICAgIHRoaXMuc2V0SW5kZXgobmV3IEJ1ZmZlckF0dHJpYnV0ZShpbmRleEJ1ZmZlciwgMSkpO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnByZWZhYkNvdW50OyBpKyspIHtcbiAgICAgIGZvciAobGV0IGsgPSAwOyBrIDwgcHJlZmFiSW5kZXhDb3VudDsgaysrKSB7XG4gICAgICAgIGluZGV4QnVmZmVyW2kgKiBwcmVmYWJJbmRleENvdW50ICsga10gPSBwcmVmYWJJbmRpY2VzW2tdICsgaSAqIHRoaXMucHJlZmFiVmVydGV4Q291bnQ7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgYnVmZmVyUG9zaXRpb25zICgpIHtcbiAgICBjb25zdCBwb3NpdGlvbkJ1ZmZlciA9IHRoaXMuY3JlYXRlQXR0cmlidXRlKCdwb3NpdGlvbicsIDMpLmFycmF5O1xuXG4gICAgaWYgKHRoaXMuaXNQcmVmYWJCdWZmZXJHZW9tZXRyeSkge1xuICAgICAgY29uc3QgcG9zaXRpb25zID0gdGhpcy5wcmVmYWJHZW9tZXRyeS5hdHRyaWJ1dGVzLnBvc2l0aW9uLmFycmF5O1xuXG4gICAgICBmb3IgKGxldCBpID0gMCwgb2Zmc2V0ID0gMDsgaSA8IHRoaXMucHJlZmFiQ291bnQ7IGkrKykge1xuICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHRoaXMucHJlZmFiVmVydGV4Q291bnQ7IGorKywgb2Zmc2V0ICs9IDMpIHtcbiAgICAgICAgICBwb3NpdGlvbkJ1ZmZlcltvZmZzZXQgICAgXSA9IHBvc2l0aW9uc1tqICogM107XG4gICAgICAgICAgcG9zaXRpb25CdWZmZXJbb2Zmc2V0ICsgMV0gPSBwb3NpdGlvbnNbaiAqIDMgKyAxXTtcbiAgICAgICAgICBwb3NpdGlvbkJ1ZmZlcltvZmZzZXQgKyAyXSA9IHBvc2l0aW9uc1tqICogMyArIDJdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgZm9yIChsZXQgaSA9IDAsIG9mZnNldCA9IDA7IGkgPCB0aGlzLnByZWZhYkNvdW50OyBpKyspIHtcbiAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCB0aGlzLnByZWZhYlZlcnRleENvdW50OyBqKyssIG9mZnNldCArPSAzKSB7XG4gICAgICAgICAgY29uc3QgcHJlZmFiVmVydGV4ID0gdGhpcy5wcmVmYWJHZW9tZXRyeS52ZXJ0aWNlc1tqXTtcblxuICAgICAgICAgIHBvc2l0aW9uQnVmZmVyW29mZnNldCAgICBdID0gcHJlZmFiVmVydGV4Lng7XG4gICAgICAgICAgcG9zaXRpb25CdWZmZXJbb2Zmc2V0ICsgMV0gPSBwcmVmYWJWZXJ0ZXgueTtcbiAgICAgICAgICBwb3NpdGlvbkJ1ZmZlcltvZmZzZXQgKyAyXSA9IHByZWZhYlZlcnRleC56O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgYnVmZmVyVXZzICgpIHtcbiAgICBjb25zdCB1dkJ1ZmZlciA9IHRoaXMuY3JlYXRlQXR0cmlidXRlKCd1dicsIDIpLmFycmF5O1xuXG4gICAgaWYgKHRoaXMuaXNQcmVmYWJCdWZmZXJHZW9tZXRyeSkge1xuICAgICAgY29uc3QgdXZzID0gdGhpcy5wcmVmYWJHZW9tZXRyeS5hdHRyaWJ1dGVzLnV2LmFycmF5XG5cbiAgICAgIGZvciAobGV0IGkgPSAwLCBvZmZzZXQgPSAwOyBpIDwgdGhpcy5wcmVmYWJDb3VudDsgaSsrKSB7XG4gICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudDsgaisrLCBvZmZzZXQgKz0gMikge1xuICAgICAgICAgIHV2QnVmZmVyW29mZnNldCAgICBdID0gdXZzW2ogKiAyXTtcbiAgICAgICAgICB1dkJ1ZmZlcltvZmZzZXQgKyAxXSA9IHV2c1tqICogMiArIDFdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHByZWZhYkZhY2VDb3VudCA9IHRoaXMucHJlZmFiR2VvbWV0cnkuZmFjZXMubGVuZ3RoO1xuICAgICAgY29uc3QgdXZzID0gW11cblxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcmVmYWJGYWNlQ291bnQ7IGkrKykge1xuICAgICAgICBjb25zdCBmYWNlID0gdGhpcy5wcmVmYWJHZW9tZXRyeS5mYWNlc1tpXTtcbiAgICAgICAgY29uc3QgdXYgPSB0aGlzLnByZWZhYkdlb21ldHJ5LmZhY2VWZXJ0ZXhVdnNbMF1baV07XG5cbiAgICAgICAgdXZzW2ZhY2UuYV0gPSB1dlswXTtcbiAgICAgICAgdXZzW2ZhY2UuYl0gPSB1dlsxXTtcbiAgICAgICAgdXZzW2ZhY2UuY10gPSB1dlsyXTtcbiAgICAgIH1cblxuICAgICAgZm9yIChsZXQgaSA9IDAsIG9mZnNldCA9IDA7IGkgPCB0aGlzLnByZWZhYkNvdW50OyBpKyspIHtcbiAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCB0aGlzLnByZWZhYlZlcnRleENvdW50OyBqKyssIG9mZnNldCArPSAyKSB7XG4gICAgICAgICAgY29uc3QgdXYgPSB1dnNbal07XG5cbiAgICAgICAgICB1dkJ1ZmZlcltvZmZzZXRdID0gdXYueDtcbiAgICAgICAgICB1dkJ1ZmZlcltvZmZzZXQgKyAxXSA9IHV2Lnk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIEJ1ZmZlckF0dHJpYnV0ZSBvbiB0aGlzIGdlb21ldHJ5IGluc3RhbmNlLlxuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gbmFtZSBOYW1lIG9mIHRoZSBhdHRyaWJ1dGUuXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBpdGVtU2l6ZSBOdW1iZXIgb2YgZmxvYXRzIHBlciB2ZXJ0ZXggKHR5cGljYWxseSAxLCAyLCAzIG9yIDQpLlxuICAgKiBAcGFyYW0ge2Z1bmN0aW9uPX0gZmFjdG9yeSBGdW5jdGlvbiB0aGF0IHdpbGwgYmUgY2FsbGVkIGZvciBlYWNoIHByZWZhYiB1cG9uIGNyZWF0aW9uLiBBY2NlcHRzIDMgYXJndW1lbnRzOiBkYXRhW10sIGluZGV4IGFuZCBwcmVmYWJDb3VudC4gQ2FsbHMgc2V0UHJlZmFiRGF0YS5cbiAgICpcbiAgICogQHJldHVybnMge0J1ZmZlckF0dHJpYnV0ZX1cbiAgICovXG4gIGNyZWF0ZUF0dHJpYnV0ZSAobmFtZSwgaXRlbVNpemUsIGZhY3RvcnkpIHtcbiAgICBjb25zdCBidWZmZXIgPSBuZXcgRmxvYXQzMkFycmF5KHRoaXMucHJlZmFiQ291bnQgKiB0aGlzLnByZWZhYlZlcnRleENvdW50ICogaXRlbVNpemUpO1xuICAgIGNvbnN0IGF0dHJpYnV0ZSA9IG5ldyBCdWZmZXJBdHRyaWJ1dGUoYnVmZmVyLCBpdGVtU2l6ZSk7XG5cbiAgICB0aGlzLnNldEF0dHJpYnV0ZShuYW1lLCBhdHRyaWJ1dGUpO1xuXG4gICAgaWYgKGZhY3RvcnkpIHtcbiAgICAgIGNvbnN0IGRhdGEgPSBbXTtcblxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnByZWZhYkNvdW50OyBpKyspIHtcbiAgICAgICAgZmFjdG9yeShkYXRhLCBpLCB0aGlzLnByZWZhYkNvdW50KTtcbiAgICAgICAgdGhpcy5zZXRQcmVmYWJEYXRhKGF0dHJpYnV0ZSwgaSwgZGF0YSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGF0dHJpYnV0ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIGRhdGEgZm9yIGFsbCB2ZXJ0aWNlcyBvZiBhIHByZWZhYiBhdCBhIGdpdmVuIGluZGV4LlxuICAgKiBVc3VhbGx5IGNhbGxlZCBpbiBhIGxvb3AuXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfEJ1ZmZlckF0dHJpYnV0ZX0gYXR0cmlidXRlIFRoZSBhdHRyaWJ1dGUgb3IgYXR0cmlidXRlIG5hbWUgd2hlcmUgdGhlIGRhdGEgaXMgdG8gYmUgc3RvcmVkLlxuICAgKiBAcGFyYW0ge051bWJlcn0gcHJlZmFiSW5kZXggSW5kZXggb2YgdGhlIHByZWZhYiBpbiB0aGUgYnVmZmVyIGdlb21ldHJ5LlxuICAgKiBAcGFyYW0ge0FycmF5fSBkYXRhIEFycmF5IG9mIGRhdGEuIExlbmd0aCBzaG91bGQgYmUgZXF1YWwgdG8gaXRlbSBzaXplIG9mIHRoZSBhdHRyaWJ1dGUuXG4gICAqL1xuICBzZXRQcmVmYWJEYXRhIChhdHRyaWJ1dGUsIHByZWZhYkluZGV4LCBkYXRhKSB7XG4gICAgYXR0cmlidXRlID0gKHR5cGVvZiBhdHRyaWJ1dGUgPT09ICdzdHJpbmcnKSA/IHRoaXMuYXR0cmlidXRlc1thdHRyaWJ1dGVdIDogYXR0cmlidXRlO1xuXG4gICAgbGV0IG9mZnNldCA9IHByZWZhYkluZGV4ICogdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudCAqIGF0dHJpYnV0ZS5pdGVtU2l6ZTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudDsgaSsrKSB7XG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGF0dHJpYnV0ZS5pdGVtU2l6ZTsgaisrKSB7XG4gICAgICAgIGF0dHJpYnV0ZS5hcnJheVtvZmZzZXQrK10gPSBkYXRhW2pdO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgeyBQcmVmYWJCdWZmZXJHZW9tZXRyeSB9O1xuIiwiaW1wb3J0IHsgQnVmZmVyR2VvbWV0cnksIEJ1ZmZlckF0dHJpYnV0ZSB9IGZyb20gJ3RocmVlJztcblxuY2xhc3MgTXVsdGlQcmVmYWJCdWZmZXJHZW9tZXRyeSBleHRlbmRzIEJ1ZmZlckdlb21ldHJ5IHtcbiAgLyoqXG4gICAqIEEgQnVmZmVyR2VvbWV0cnkgd2hlcmUgYSAncHJlZmFiJyBnZW9tZXRyeSBhcnJheSBpcyByZXBlYXRlZCBhIG51bWJlciBvZiB0aW1lcy5cbiAgICpcbiAgICogQHBhcmFtIHtBcnJheX0gcHJlZmFicyBBbiBhcnJheSB3aXRoIEdlb21ldHJ5IGluc3RhbmNlcyB0byByZXBlYXQuXG4gICAqIEBwYXJhbSB7TnVtYmVyfSByZXBlYXRDb3VudCBUaGUgbnVtYmVyIG9mIHRpbWVzIHRvIHJlcGVhdCB0aGUgYXJyYXkgb2YgR2VvbWV0cmllcy5cbiAgICogQGNvbnN0cnVjdG9yXG4gICAqL1xuICBjb25zdHJ1Y3RvciAocHJlZmFicywgcmVwZWF0Q291bnQpIHtcbiAgICBzdXBlcigpO1xuXG4gICAgaWYgKEFycmF5LmlzQXJyYXkocHJlZmFicykpIHtcbiAgICAgIHRoaXMucHJlZmFiR2VvbWV0cmllcyA9IHByZWZhYnM7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMucHJlZmFiR2VvbWV0cmllcyA9IFtwcmVmYWJzXTtcbiAgICB9XG5cbiAgICB0aGlzLnByZWZhYkdlb21ldHJpZXNDb3VudCA9IHRoaXMucHJlZmFiR2VvbWV0cmllcy5sZW5ndGg7XG5cbiAgICAvKipcbiAgICAgKiBOdW1iZXIgb2YgcHJlZmFicy5cbiAgICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgICAqL1xuICAgIHRoaXMucHJlZmFiQ291bnQgPSByZXBlYXRDb3VudCAqIHRoaXMucHJlZmFiR2VvbWV0cmllc0NvdW50O1xuICAgIC8qKlxuICAgICAqIEhvdyBvZnRlbiB0aGUgcHJlZmFiIGFycmF5IGlzIHJlcGVhdGVkLlxuICAgICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAgICovXG4gICAgdGhpcy5yZXBlYXRDb3VudCA9IHJlcGVhdENvdW50O1xuXG4gICAgLyoqXG4gICAgICogQXJyYXkgb2YgdmVydGV4IGNvdW50cyBwZXIgcHJlZmFiLlxuICAgICAqIEB0eXBlIHtBcnJheX1cbiAgICAgKi9cbiAgICB0aGlzLnByZWZhYlZlcnRleENvdW50cyA9IHRoaXMucHJlZmFiR2VvbWV0cmllcy5tYXAocCA9PiBwLmlzQnVmZmVyR2VvbWV0cnkgPyBwLmF0dHJpYnV0ZXMucG9zaXRpb24uY291bnQgOiBwLnZlcnRpY2VzLmxlbmd0aCk7XG4gICAgLyoqXG4gICAgICogVG90YWwgbnVtYmVyIG9mIHZlcnRpY2VzIGZvciBvbmUgcmVwZXRpdGlvbiBvZiB0aGUgcHJlZmFic1xuICAgICAqIEB0eXBlIHtudW1iZXJ9XG4gICAgICovXG4gICAgdGhpcy5yZXBlYXRWZXJ0ZXhDb3VudCA9IHRoaXMucHJlZmFiVmVydGV4Q291bnRzLnJlZHVjZSgociwgdikgPT4gciArIHYsIDApO1xuXG4gICAgdGhpcy5idWZmZXJJbmRpY2VzKCk7XG4gICAgdGhpcy5idWZmZXJQb3NpdGlvbnMoKTtcbiAgfVxuXG4gIGJ1ZmZlckluZGljZXMgKCkge1xuICAgIGxldCByZXBlYXRJbmRleENvdW50ID0gMDtcblxuICAgIHRoaXMucHJlZmFiSW5kaWNlcyA9IHRoaXMucHJlZmFiR2VvbWV0cmllcy5tYXAoZ2VvbWV0cnkgPT4ge1xuICAgICAgbGV0IGluZGljZXMgPSBbXTtcblxuICAgICAgaWYgKGdlb21ldHJ5LmlzQnVmZmVyR2VvbWV0cnkpIHtcbiAgICAgICAgaWYgKGdlb21ldHJ5LmluZGV4KSB7XG4gICAgICAgICAgaW5kaWNlcyA9IGdlb21ldHJ5LmluZGV4LmFycmF5O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZ2VvbWV0cnkuYXR0cmlidXRlcy5wb3NpdGlvbi5jb3VudDsgaSsrKSB7XG4gICAgICAgICAgICBpbmRpY2VzLnB1c2goaSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGdlb21ldHJ5LmZhY2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgY29uc3QgZmFjZSA9IGdlb21ldHJ5LmZhY2VzW2ldO1xuICAgICAgICAgIGluZGljZXMucHVzaChmYWNlLmEsIGZhY2UuYiwgZmFjZS5jKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXBlYXRJbmRleENvdW50ICs9IGluZGljZXMubGVuZ3RoO1xuXG4gICAgICByZXR1cm4gaW5kaWNlcztcbiAgICB9KTtcblxuICAgIGNvbnN0IGluZGV4QnVmZmVyID0gbmV3IFVpbnQzMkFycmF5KHJlcGVhdEluZGV4Q291bnQgKiB0aGlzLnJlcGVhdENvdW50KTtcbiAgICBsZXQgaW5kZXhPZmZzZXQgPSAwO1xuICAgIGxldCBwcmVmYWJPZmZzZXQgPSAwO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnByZWZhYkNvdW50OyBpKyspIHtcbiAgICAgIGNvbnN0IGluZGV4ID0gaSAlIHRoaXMucHJlZmFiR2VvbWV0cmllc0NvdW50O1xuICAgICAgY29uc3QgaW5kaWNlcyA9IHRoaXMucHJlZmFiSW5kaWNlc1tpbmRleF07XG4gICAgICBjb25zdCB2ZXJ0ZXhDb3VudCA9IHRoaXMucHJlZmFiVmVydGV4Q291bnRzW2luZGV4XTtcblxuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBpbmRpY2VzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgIGluZGV4QnVmZmVyW2luZGV4T2Zmc2V0KytdID0gaW5kaWNlc1tqXSArIHByZWZhYk9mZnNldDtcbiAgICAgIH1cblxuICAgICAgcHJlZmFiT2Zmc2V0ICs9IHZlcnRleENvdW50O1xuICAgIH1cblxuICAgIHRoaXMuc2V0SW5kZXgobmV3IEJ1ZmZlckF0dHJpYnV0ZShpbmRleEJ1ZmZlciwgMSkpO1xuICB9XG5cbiAgYnVmZmVyUG9zaXRpb25zICgpIHtcbiAgICBjb25zdCBwb3NpdGlvbkJ1ZmZlciA9IHRoaXMuY3JlYXRlQXR0cmlidXRlKCdwb3NpdGlvbicsIDMpLmFycmF5O1xuXG4gICAgY29uc3QgcHJlZmFiUG9zaXRpb25zID0gdGhpcy5wcmVmYWJHZW9tZXRyaWVzLm1hcCgoZ2VvbWV0cnksIGkpID0+IHtcbiAgICAgIGxldCBwb3NpdGlvbnM7XG5cbiAgICAgIGlmIChnZW9tZXRyeS5pc0J1ZmZlckdlb21ldHJ5KSB7XG4gICAgICAgIHBvc2l0aW9ucyA9IGdlb21ldHJ5LmF0dHJpYnV0ZXMucG9zaXRpb24uYXJyYXk7XG4gICAgICB9IGVsc2Uge1xuXG4gICAgICAgIGNvbnN0IHZlcnRleENvdW50ID0gdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudHNbaV07XG5cbiAgICAgICAgcG9zaXRpb25zID0gW107XG5cbiAgICAgICAgZm9yIChsZXQgaiA9IDAsIG9mZnNldCA9IDA7IGogPCB2ZXJ0ZXhDb3VudDsgaisrKSB7XG4gICAgICAgICAgY29uc3QgcHJlZmFiVmVydGV4ID0gZ2VvbWV0cnkudmVydGljZXNbal07XG5cbiAgICAgICAgICBwb3NpdGlvbnNbb2Zmc2V0KytdID0gcHJlZmFiVmVydGV4Lng7XG4gICAgICAgICAgcG9zaXRpb25zW29mZnNldCsrXSA9IHByZWZhYlZlcnRleC55O1xuICAgICAgICAgIHBvc2l0aW9uc1tvZmZzZXQrK10gPSBwcmVmYWJWZXJ0ZXguejtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gcG9zaXRpb25zO1xuICAgIH0pO1xuXG4gICAgZm9yIChsZXQgaSA9IDAsIG9mZnNldCA9IDA7IGkgPCB0aGlzLnByZWZhYkNvdW50OyBpKyspIHtcbiAgICAgIGNvbnN0IGluZGV4ID0gaSAlIHRoaXMucHJlZmFiR2VvbWV0cmllcy5sZW5ndGg7XG4gICAgICBjb25zdCB2ZXJ0ZXhDb3VudCA9IHRoaXMucHJlZmFiVmVydGV4Q291bnRzW2luZGV4XTtcbiAgICAgIGNvbnN0IHBvc2l0aW9ucyA9IHByZWZhYlBvc2l0aW9uc1tpbmRleF07XG5cbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgdmVydGV4Q291bnQ7IGorKykge1xuICAgICAgICBwb3NpdGlvbkJ1ZmZlcltvZmZzZXQrK10gPSBwb3NpdGlvbnNbaiAqIDNdO1xuICAgICAgICBwb3NpdGlvbkJ1ZmZlcltvZmZzZXQrK10gPSBwb3NpdGlvbnNbaiAqIDMgKyAxXTtcbiAgICAgICAgcG9zaXRpb25CdWZmZXJbb2Zmc2V0KytdID0gcG9zaXRpb25zW2ogKiAzICsgMl07XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBCdWZmZXJBdHRyaWJ1dGUgd2l0aCBVViBjb29yZGluYXRlcy5cbiAgICovXG4gIGJ1ZmZlclV2cyAoKSB7XG4gICAgY29uc3QgdXZCdWZmZXIgPSB0aGlzLmNyZWF0ZUF0dHJpYnV0ZSgndXYnLCAyKS5hcnJheTtcbiAgICBjb25zdCBwcmVmYWJVdnMgPSB0aGlzLnByZWZhYkdlb21ldHJpZXMubWFwKChnZW9tZXRyeSwgaSkgPT4ge1xuICAgICAgbGV0IHV2cztcblxuICAgICAgaWYgKGdlb21ldHJ5LmlzQnVmZmVyR2VvbWV0cnkpIHtcbiAgICAgICAgaWYgKCFnZW9tZXRyeS5hdHRyaWJ1dGVzLnV2KSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcignTm8gVVYgZm91bmQgaW4gcHJlZmFiIGdlb21ldHJ5JywgZ2VvbWV0cnkpO1xuICAgICAgICB9XG5cbiAgICAgICAgdXZzID0gZ2VvbWV0cnkuYXR0cmlidXRlcy51di5hcnJheTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IHByZWZhYkZhY2VDb3VudCA9IHRoaXMucHJlZmFiSW5kaWNlc1tpXS5sZW5ndGggLyAzO1xuICAgICAgICBjb25zdCB1dk9iamVjdHMgPSBbXTtcblxuICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHByZWZhYkZhY2VDb3VudDsgaisrKSB7XG4gICAgICAgICAgY29uc3QgZmFjZSA9IGdlb21ldHJ5LmZhY2VzW2pdO1xuICAgICAgICAgIGNvbnN0IHV2ID0gZ2VvbWV0cnkuZmFjZVZlcnRleFV2c1swXVtqXTtcblxuICAgICAgICAgIHV2T2JqZWN0c1tmYWNlLmFdID0gdXZbMF07XG4gICAgICAgICAgdXZPYmplY3RzW2ZhY2UuYl0gPSB1dlsxXTtcbiAgICAgICAgICB1dk9iamVjdHNbZmFjZS5jXSA9IHV2WzJdO1xuICAgICAgICB9XG5cbiAgICAgICAgdXZzID0gW107XG5cbiAgICAgICAgZm9yIChsZXQgayA9IDA7IGsgPCB1dk9iamVjdHMubGVuZ3RoOyBrKyspIHtcbiAgICAgICAgICB1dnNbayAqIDJdID0gdXZPYmplY3RzW2tdLng7XG4gICAgICAgICAgdXZzW2sgKiAyICsgMV0gPSB1dk9iamVjdHNba10ueTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gdXZzO1xuICAgIH0pO1xuXG4gICAgZm9yIChsZXQgaSA9IDAsIG9mZnNldCA9IDA7IGkgPCB0aGlzLnByZWZhYkNvdW50OyBpKyspIHtcblxuICAgICAgY29uc3QgaW5kZXggPSBpICUgdGhpcy5wcmVmYWJHZW9tZXRyaWVzLmxlbmd0aDtcbiAgICAgIGNvbnN0IHZlcnRleENvdW50ID0gdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudHNbaW5kZXhdO1xuICAgICAgY29uc3QgdXZzID0gcHJlZmFiVXZzW2luZGV4XTtcblxuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCB2ZXJ0ZXhDb3VudDsgaisrKSB7XG4gICAgICAgIHV2QnVmZmVyW29mZnNldCsrXSA9IHV2c1tqICogMl07XG4gICAgICAgIHV2QnVmZmVyW29mZnNldCsrXSA9IHV2c1tqICogMiArIDFdO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgQnVmZmVyQXR0cmlidXRlIG9uIHRoaXMgZ2VvbWV0cnkgaW5zdGFuY2UuXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIE5hbWUgb2YgdGhlIGF0dHJpYnV0ZS5cbiAgICogQHBhcmFtIHtOdW1iZXJ9IGl0ZW1TaXplIE51bWJlciBvZiBmbG9hdHMgcGVyIHZlcnRleCAodHlwaWNhbGx5IDEsIDIsIDMgb3IgNCkuXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb249fSBmYWN0b3J5IEZ1bmN0aW9uIHRoYXQgd2lsbCBiZSBjYWxsZWQgZm9yIGVhY2ggcHJlZmFiIHVwb24gY3JlYXRpb24uIEFjY2VwdHMgMyBhcmd1bWVudHM6IGRhdGFbXSwgaW5kZXggYW5kIHByZWZhYkNvdW50LiBDYWxscyBzZXRQcmVmYWJEYXRhLlxuICAgKlxuICAgKiBAcmV0dXJucyB7QnVmZmVyQXR0cmlidXRlfVxuICAgKi9cbiAgIGNyZWF0ZUF0dHJpYnV0ZSAobmFtZSwgaXRlbVNpemUsIGZhY3RvcnkpIHtcbiAgICBjb25zdCBidWZmZXIgPSBuZXcgRmxvYXQzMkFycmF5KHRoaXMucmVwZWF0Q291bnQgKiB0aGlzLnJlcGVhdFZlcnRleENvdW50ICogaXRlbVNpemUpO1xuICAgIGNvbnN0IGF0dHJpYnV0ZSA9IG5ldyBCdWZmZXJBdHRyaWJ1dGUoYnVmZmVyLCBpdGVtU2l6ZSk7XG5cbiAgICB0aGlzLnNldEF0dHJpYnV0ZShuYW1lLCBhdHRyaWJ1dGUpO1xuXG4gICAgaWYgKGZhY3RvcnkpIHtcbiAgICAgIGNvbnN0IGRhdGEgPSBbXTtcblxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnByZWZhYkNvdW50OyBpKyspIHtcbiAgICAgICAgZmFjdG9yeShkYXRhLCBpLCB0aGlzLnByZWZhYkNvdW50KTtcbiAgICAgICAgdGhpcy5zZXRQcmVmYWJEYXRhKGF0dHJpYnV0ZSwgaSwgZGF0YSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGF0dHJpYnV0ZTtcbiAgIH1cblxuICAgLyoqXG4gICAqIFNldHMgZGF0YSBmb3IgYWxsIHZlcnRpY2VzIG9mIGEgcHJlZmFiIGF0IGEgZ2l2ZW4gaW5kZXguXG4gICAqIFVzdWFsbHkgY2FsbGVkIGluIGEgbG9vcC5cbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd8QnVmZmVyQXR0cmlidXRlfSBhdHRyaWJ1dGUgVGhlIGF0dHJpYnV0ZSBvciBhdHRyaWJ1dGUgbmFtZSB3aGVyZSB0aGUgZGF0YSBpcyB0byBiZSBzdG9yZWQuXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBwcmVmYWJJbmRleCBJbmRleCBvZiB0aGUgcHJlZmFiIGluIHRoZSBidWZmZXIgZ2VvbWV0cnkuXG4gICAqIEBwYXJhbSB7QXJyYXl9IGRhdGEgQXJyYXkgb2YgZGF0YS4gTGVuZ3RoIHNob3VsZCBiZSBlcXVhbCB0byBpdGVtIHNpemUgb2YgdGhlIGF0dHJpYnV0ZS5cbiAgICovXG4gIHNldFByZWZhYkRhdGEgKGF0dHJpYnV0ZSwgcHJlZmFiSW5kZXgsIGRhdGEpIHtcbiAgICBhdHRyaWJ1dGUgPSAodHlwZW9mIGF0dHJpYnV0ZSA9PT0gJ3N0cmluZycpID8gdGhpcy5hdHRyaWJ1dGVzW2F0dHJpYnV0ZV0gOiBhdHRyaWJ1dGU7XG5cbiAgICBjb25zdCBwcmVmYWJHZW9tZXRyeUluZGV4ID0gcHJlZmFiSW5kZXggJSB0aGlzLnByZWZhYkdlb21ldHJpZXNDb3VudDtcbiAgICBjb25zdCBwcmVmYWJHZW9tZXRyeVZlcnRleENvdW50ID0gdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudHNbcHJlZmFiR2VvbWV0cnlJbmRleF07XG4gICAgY29uc3Qgd2hvbGUgPSAocHJlZmFiSW5kZXggLyB0aGlzLnByZWZhYkdlb21ldHJpZXNDb3VudCB8IDApICogdGhpcy5wcmVmYWJHZW9tZXRyaWVzQ291bnQ7XG4gICAgY29uc3Qgd2hvbGVPZmZzZXQgPSB3aG9sZSAqIHRoaXMucmVwZWF0VmVydGV4Q291bnQ7XG4gICAgY29uc3QgcGFydCA9IHByZWZhYkluZGV4IC0gd2hvbGU7XG4gICAgbGV0IHBhcnRPZmZzZXQgPSAwO1xuICAgIGxldCBpID0gMDtcblxuICAgIHdoaWxlKGkgPCBwYXJ0KSB7XG4gICAgICBwYXJ0T2Zmc2V0ICs9IHRoaXMucHJlZmFiVmVydGV4Q291bnRzW2krK107XG4gICAgfVxuXG4gICAgbGV0IG9mZnNldCA9ICh3aG9sZU9mZnNldCArIHBhcnRPZmZzZXQpICogYXR0cmlidXRlLml0ZW1TaXplO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcmVmYWJHZW9tZXRyeVZlcnRleENvdW50OyBpKyspIHtcbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgYXR0cmlidXRlLml0ZW1TaXplOyBqKyspIHtcbiAgICAgICAgYXR0cmlidXRlLmFycmF5W29mZnNldCsrXSA9IGRhdGFbal07XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCB7IE11bHRpUHJlZmFiQnVmZmVyR2VvbWV0cnkgfTtcbiIsImltcG9ydCB7IEluc3RhbmNlZEJ1ZmZlckdlb21ldHJ5LCBJbnN0YW5jZWRCdWZmZXJBdHRyaWJ1dGUgfSBmcm9tICd0aHJlZSc7XG5cbmNsYXNzIEluc3RhbmNlZFByZWZhYkJ1ZmZlckdlb21ldHJ5IGV4dGVuZHMgSW5zdGFuY2VkQnVmZmVyR2VvbWV0cnkge1xuICAvKipcbiAgICogQSB3cmFwcGVyIGFyb3VuZCBUSFJFRS5JbnN0YW5jZWRCdWZmZXJHZW9tZXRyeSwgd2hpY2ggaXMgbW9yZSBtZW1vcnkgZWZmaWNpZW50IHRoYW4gUHJlZmFiQnVmZmVyR2VvbWV0cnksIGJ1dCByZXF1aXJlcyB0aGUgQU5HTEVfaW5zdGFuY2VkX2FycmF5cyBleHRlbnNpb24uXG4gICAqXG4gICAqIEBwYXJhbSB7QnVmZmVyR2VvbWV0cnl9IHByZWZhYiBUaGUgR2VvbWV0cnkgaW5zdGFuY2UgdG8gcmVwZWF0LlxuICAgKiBAcGFyYW0ge051bWJlcn0gY291bnQgVGhlIG51bWJlciBvZiB0aW1lcyB0byByZXBlYXQgdGhlIGdlb21ldHJ5LlxuICAgKi9cbiAgY29uc3RydWN0b3IgKHByZWZhYiwgY291bnQpIHtcbiAgICBzdXBlcigpO1xuXG4gICAgdGhpcy5wcmVmYWJHZW9tZXRyeSA9IHByZWZhYjtcbiAgICB0aGlzLmNvcHkocHJlZmFiKTtcblxuICAgIHRoaXMuaW5zdGFuY2VDb3VudCA9IGNvdW50XG4gICAgdGhpcy5wcmVmYWJDb3VudCA9IGNvdW50O1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBCdWZmZXJBdHRyaWJ1dGUgb24gdGhpcyBnZW9tZXRyeSBpbnN0YW5jZS5cbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgTmFtZSBvZiB0aGUgYXR0cmlidXRlLlxuICAgKiBAcGFyYW0ge051bWJlcn0gaXRlbVNpemUgTnVtYmVyIG9mIGZsb2F0cyBwZXIgdmVydGV4ICh0eXBpY2FsbHkgMSwgMiwgMyBvciA0KS5cbiAgICogQHBhcmFtIHtmdW5jdGlvbj19IGZhY3RvcnkgRnVuY3Rpb24gdGhhdCB3aWxsIGJlIGNhbGxlZCBmb3IgZWFjaCBwcmVmYWIgdXBvbiBjcmVhdGlvbi4gQWNjZXB0cyAzIGFyZ3VtZW50czogZGF0YVtdLCBpbmRleCBhbmQgcHJlZmFiQ291bnQuIENhbGxzIHNldFByZWZhYkRhdGEuXG4gICAqXG4gICAqIEByZXR1cm5zIHtCdWZmZXJBdHRyaWJ1dGV9XG4gICAqL1xuICBjcmVhdGVBdHRyaWJ1dGUgKG5hbWUsIGl0ZW1TaXplLCBmYWN0b3J5KSB7XG4gICAgY29uc3QgYnVmZmVyID0gbmV3IEZsb2F0MzJBcnJheSh0aGlzLnByZWZhYkNvdW50ICogaXRlbVNpemUpO1xuICAgIGNvbnN0IGF0dHJpYnV0ZSA9IG5ldyBJbnN0YW5jZWRCdWZmZXJBdHRyaWJ1dGUoYnVmZmVyLCBpdGVtU2l6ZSk7XG5cbiAgICB0aGlzLnNldEF0dHJpYnV0ZShuYW1lLCBhdHRyaWJ1dGUpO1xuXG4gICAgaWYgKGZhY3RvcnkpIHtcbiAgICAgIGNvbnN0IGRhdGEgPSBbXTtcblxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnByZWZhYkNvdW50OyBpKyspIHtcbiAgICAgICAgZmFjdG9yeShkYXRhLCBpLCB0aGlzLnByZWZhYkNvdW50KTtcbiAgICAgICAgdGhpcy5zZXRQcmVmYWJEYXRhKGF0dHJpYnV0ZSwgaSwgZGF0YSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGF0dHJpYnV0ZTtcbiAgfTtcblxuICAvKipcbiAgICogU2V0cyBkYXRhIGZvciBhIHByZWZhYiBhdCBhIGdpdmVuIGluZGV4LlxuICAgKiBVc3VhbGx5IGNhbGxlZCBpbiBhIGxvb3AuXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfEJ1ZmZlckF0dHJpYnV0ZX0gYXR0cmlidXRlIFRoZSBhdHRyaWJ1dGUgb3IgYXR0cmlidXRlIG5hbWUgd2hlcmUgdGhlIGRhdGEgaXMgdG8gYmUgc3RvcmVkLlxuICAgKiBAcGFyYW0ge051bWJlcn0gcHJlZmFiSW5kZXggSW5kZXggb2YgdGhlIHByZWZhYiBpbiB0aGUgYnVmZmVyIGdlb21ldHJ5LlxuICAgKiBAcGFyYW0ge0FycmF5fSBkYXRhIEFycmF5IG9mIGRhdGEuIExlbmd0aCBzaG91bGQgYmUgZXF1YWwgdG8gaXRlbSBzaXplIG9mIHRoZSBhdHRyaWJ1dGUuXG4gICAqL1xuICBzZXRQcmVmYWJEYXRhIChhdHRyaWJ1dGUsIHByZWZhYkluZGV4LCBkYXRhKSB7XG4gICAgYXR0cmlidXRlID0gKHR5cGVvZiBhdHRyaWJ1dGUgPT09ICdzdHJpbmcnKSA/IHRoaXMuYXR0cmlidXRlc1thdHRyaWJ1dGVdIDogYXR0cmlidXRlO1xuXG4gICAgbGV0IG9mZnNldCA9IHByZWZhYkluZGV4ICogYXR0cmlidXRlLml0ZW1TaXplO1xuXG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCBhdHRyaWJ1dGUuaXRlbVNpemU7IGorKykge1xuICAgICAgYXR0cmlidXRlLmFycmF5W29mZnNldCsrXSA9IGRhdGFbal07XG4gICAgfVxuICB9O1xufTtcblxuZXhwb3J0IHsgSW5zdGFuY2VkUHJlZmFiQnVmZmVyR2VvbWV0cnkgfTtcbiIsImltcG9ydCB7IE1hdGggYXMgdE1hdGgsIFZlY3RvcjMgfSBmcm9tICd0aHJlZSc7XG5pbXBvcnQgeyBEZXB0aEFuaW1hdGlvbk1hdGVyaWFsIH0gZnJvbSAnLi9tYXRlcmlhbHMvRGVwdGhBbmltYXRpb25NYXRlcmlhbCc7XG5pbXBvcnQgeyBEaXN0YW5jZUFuaW1hdGlvbk1hdGVyaWFsIH0gZnJvbSAnLi9tYXRlcmlhbHMvRGlzdGFuY2VBbmltYXRpb25NYXRlcmlhbCc7XG5cbi8qKlxuICogQ29sbGVjdGlvbiBvZiB1dGlsaXR5IGZ1bmN0aW9ucy5cbiAqIEBuYW1lc3BhY2VcbiAqL1xuY29uc3QgVXRpbHMgPSB7XG4gIC8qKlxuICAgKiBEdXBsaWNhdGVzIHZlcnRpY2VzIHNvIGVhY2ggZmFjZSBiZWNvbWVzIHNlcGFyYXRlLlxuICAgKiBTYW1lIGFzIFRIUkVFLkV4cGxvZGVNb2RpZmllci5cbiAgICpcbiAgICogQHBhcmFtIHtUSFJFRS5HZW9tZXRyeX0gZ2VvbWV0cnkgR2VvbWV0cnkgaW5zdGFuY2UgdG8gbW9kaWZ5LlxuICAgKi9cbiAgc2VwYXJhdGVGYWNlczogZnVuY3Rpb24gKGdlb21ldHJ5KSB7XG4gICAgbGV0IHZlcnRpY2VzID0gW107XG5cbiAgICBmb3IgKGxldCBpID0gMCwgaWwgPSBnZW9tZXRyeS5mYWNlcy5sZW5ndGg7IGkgPCBpbDsgaSsrKSB7XG4gICAgICBsZXQgbiA9IHZlcnRpY2VzLmxlbmd0aDtcbiAgICAgIGxldCBmYWNlID0gZ2VvbWV0cnkuZmFjZXNbaV07XG5cbiAgICAgIGxldCBhID0gZmFjZS5hO1xuICAgICAgbGV0IGIgPSBmYWNlLmI7XG4gICAgICBsZXQgYyA9IGZhY2UuYztcblxuICAgICAgbGV0IHZhID0gZ2VvbWV0cnkudmVydGljZXNbYV07XG4gICAgICBsZXQgdmIgPSBnZW9tZXRyeS52ZXJ0aWNlc1tiXTtcbiAgICAgIGxldCB2YyA9IGdlb21ldHJ5LnZlcnRpY2VzW2NdO1xuXG4gICAgICB2ZXJ0aWNlcy5wdXNoKHZhLmNsb25lKCkpO1xuICAgICAgdmVydGljZXMucHVzaCh2Yi5jbG9uZSgpKTtcbiAgICAgIHZlcnRpY2VzLnB1c2godmMuY2xvbmUoKSk7XG5cbiAgICAgIGZhY2UuYSA9IG47XG4gICAgICBmYWNlLmIgPSBuICsgMTtcbiAgICAgIGZhY2UuYyA9IG4gKyAyO1xuICAgIH1cblxuICAgIGdlb21ldHJ5LnZlcnRpY2VzID0gdmVydGljZXM7XG4gIH0sXG5cbiAgLyoqXG4gICAqIENvbXB1dGUgdGhlIGNlbnRyb2lkIChjZW50ZXIpIG9mIGEgVEhSRUUuRmFjZTMuXG4gICAqXG4gICAqIEBwYXJhbSB7VEhSRUUuR2VvbWV0cnl9IGdlb21ldHJ5IEdlb21ldHJ5IGluc3RhbmNlIHRoZSBmYWNlIGlzIGluLlxuICAgKiBAcGFyYW0ge1RIUkVFLkZhY2UzfSBmYWNlIEZhY2Ugb2JqZWN0IGZyb20gdGhlIFRIUkVFLkdlb21ldHJ5LmZhY2VzIGFycmF5XG4gICAqIEBwYXJhbSB7VEhSRUUuVmVjdG9yMz19IHYgT3B0aW9uYWwgdmVjdG9yIHRvIHN0b3JlIHJlc3VsdCBpbi5cbiAgICogQHJldHVybnMge1RIUkVFLlZlY3RvcjN9XG4gICAqL1xuICBjb21wdXRlQ2VudHJvaWQ6IGZ1bmN0aW9uKGdlb21ldHJ5LCBmYWNlLCB2KSB7XG4gICAgbGV0IGEgPSBnZW9tZXRyeS52ZXJ0aWNlc1tmYWNlLmFdO1xuICAgIGxldCBiID0gZ2VvbWV0cnkudmVydGljZXNbZmFjZS5iXTtcbiAgICBsZXQgYyA9IGdlb21ldHJ5LnZlcnRpY2VzW2ZhY2UuY107XG5cbiAgICB2ID0gdiB8fCBuZXcgVmVjdG9yMygpO1xuXG4gICAgdi54ID0gKGEueCArIGIueCArIGMueCkgLyAzO1xuICAgIHYueSA9IChhLnkgKyBiLnkgKyBjLnkpIC8gMztcbiAgICB2LnogPSAoYS56ICsgYi56ICsgYy56KSAvIDM7XG5cbiAgICByZXR1cm4gdjtcbiAgfSxcblxuICAvKipcbiAgICogR2V0IGEgcmFuZG9tIHZlY3RvciBiZXR3ZWVuIGJveC5taW4gYW5kIGJveC5tYXguXG4gICAqXG4gICAqIEBwYXJhbSB7VEhSRUUuQm94M30gYm94IFRIUkVFLkJveDMgaW5zdGFuY2UuXG4gICAqIEBwYXJhbSB7VEhSRUUuVmVjdG9yMz19IHYgT3B0aW9uYWwgdmVjdG9yIHRvIHN0b3JlIHJlc3VsdCBpbi5cbiAgICogQHJldHVybnMge1RIUkVFLlZlY3RvcjN9XG4gICAqL1xuICByYW5kb21JbkJveDogZnVuY3Rpb24oYm94LCB2KSB7XG4gICAgdiA9IHYgfHwgbmV3IFZlY3RvcjMoKTtcblxuICAgIHYueCA9IHRNYXRoLnJhbmRGbG9hdChib3gubWluLngsIGJveC5tYXgueCk7XG4gICAgdi55ID0gdE1hdGgucmFuZEZsb2F0KGJveC5taW4ueSwgYm94Lm1heC55KTtcbiAgICB2LnogPSB0TWF0aC5yYW5kRmxvYXQoYm94Lm1pbi56LCBib3gubWF4LnopO1xuXG4gICAgcmV0dXJuIHY7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEdldCBhIHJhbmRvbSBheGlzIGZvciBxdWF0ZXJuaW9uIHJvdGF0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0ge1RIUkVFLlZlY3RvcjM9fSB2IE9wdGlvbiB2ZWN0b3IgdG8gc3RvcmUgcmVzdWx0IGluLlxuICAgKiBAcmV0dXJucyB7VEhSRUUuVmVjdG9yM31cbiAgICovXG4gIHJhbmRvbUF4aXM6IGZ1bmN0aW9uKHYpIHtcbiAgICB2ID0gdiB8fCBuZXcgVmVjdG9yMygpO1xuXG4gICAgdi54ID0gdE1hdGgucmFuZEZsb2F0U3ByZWFkKDIuMCk7XG4gICAgdi55ID0gdE1hdGgucmFuZEZsb2F0U3ByZWFkKDIuMCk7XG4gICAgdi56ID0gdE1hdGgucmFuZEZsb2F0U3ByZWFkKDIuMCk7XG4gICAgdi5ub3JtYWxpemUoKTtcblxuICAgIHJldHVybiB2O1xuICB9LFxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBUSFJFRS5CQVMuRGVwdGhBbmltYXRpb25NYXRlcmlhbCBmb3Igc2hhZG93cyBmcm9tIGEgVEhSRUUuU3BvdExpZ2h0IG9yIFRIUkVFLkRpcmVjdGlvbmFsTGlnaHQgYnkgY29weWluZyByZWxldmFudCBzaGFkZXIgY2h1bmtzLlxuICAgKiBVbmlmb3JtIHZhbHVlcyBtdXN0IGJlIG1hbnVhbGx5IHN5bmNlZCBiZXR3ZWVuIHRoZSBzb3VyY2UgbWF0ZXJpYWwgYW5kIHRoZSBkZXB0aCBtYXRlcmlhbC5cbiAgICpcbiAgICogQHNlZSB7QGxpbmsgaHR0cDovL3RocmVlLWJhcy1leGFtcGxlcy5zdXJnZS5zaC9leGFtcGxlcy9zaGFkb3dzL31cbiAgICpcbiAgICogQHBhcmFtIHtUSFJFRS5CQVMuQmFzZUFuaW1hdGlvbk1hdGVyaWFsfSBzb3VyY2VNYXRlcmlhbCBJbnN0YW5jZSB0byBnZXQgdGhlIHNoYWRlciBjaHVua3MgZnJvbS5cbiAgICogQHJldHVybnMge1RIUkVFLkJBUy5EZXB0aEFuaW1hdGlvbk1hdGVyaWFsfVxuICAgKi9cbiAgY3JlYXRlRGVwdGhBbmltYXRpb25NYXRlcmlhbDogZnVuY3Rpb24oc291cmNlTWF0ZXJpYWwpIHtcbiAgICByZXR1cm4gbmV3IERlcHRoQW5pbWF0aW9uTWF0ZXJpYWwoe1xuICAgICAgdW5pZm9ybXM6IHNvdXJjZU1hdGVyaWFsLnVuaWZvcm1zLFxuICAgICAgZGVmaW5lczogc291cmNlTWF0ZXJpYWwuZGVmaW5lcyxcbiAgICAgIHZlcnRleEZ1bmN0aW9uczogc291cmNlTWF0ZXJpYWwudmVydGV4RnVuY3Rpb25zLFxuICAgICAgdmVydGV4UGFyYW1ldGVyczogc291cmNlTWF0ZXJpYWwudmVydGV4UGFyYW1ldGVycyxcbiAgICAgIHZlcnRleEluaXQ6IHNvdXJjZU1hdGVyaWFsLnZlcnRleEluaXQsXG4gICAgICB2ZXJ0ZXhQb3NpdGlvbjogc291cmNlTWF0ZXJpYWwudmVydGV4UG9zaXRpb25cbiAgICB9KTtcbiAgfSxcblxuICAvKipcbiAgICogQ3JlYXRlIGEgVEhSRUUuQkFTLkRpc3RhbmNlQW5pbWF0aW9uTWF0ZXJpYWwgZm9yIHNoYWRvd3MgZnJvbSBhIFRIUkVFLlBvaW50TGlnaHQgYnkgY29weWluZyByZWxldmFudCBzaGFkZXIgY2h1bmtzLlxuICAgKiBVbmlmb3JtIHZhbHVlcyBtdXN0IGJlIG1hbnVhbGx5IHN5bmNlZCBiZXR3ZWVuIHRoZSBzb3VyY2UgbWF0ZXJpYWwgYW5kIHRoZSBkaXN0YW5jZSBtYXRlcmlhbC5cbiAgICpcbiAgICogQHNlZSB7QGxpbmsgaHR0cDovL3RocmVlLWJhcy1leGFtcGxlcy5zdXJnZS5zaC9leGFtcGxlcy9zaGFkb3dzL31cbiAgICpcbiAgICogQHBhcmFtIHtUSFJFRS5CQVMuQmFzZUFuaW1hdGlvbk1hdGVyaWFsfSBzb3VyY2VNYXRlcmlhbCBJbnN0YW5jZSB0byBnZXQgdGhlIHNoYWRlciBjaHVua3MgZnJvbS5cbiAgICogQHJldHVybnMge1RIUkVFLkJBUy5EaXN0YW5jZUFuaW1hdGlvbk1hdGVyaWFsfVxuICAgKi9cbiAgY3JlYXRlRGlzdGFuY2VBbmltYXRpb25NYXRlcmlhbDogZnVuY3Rpb24oc291cmNlTWF0ZXJpYWwpIHtcbiAgICByZXR1cm4gbmV3IERpc3RhbmNlQW5pbWF0aW9uTWF0ZXJpYWwoe1xuICAgICAgdW5pZm9ybXM6IHNvdXJjZU1hdGVyaWFsLnVuaWZvcm1zLFxuICAgICAgZGVmaW5lczogc291cmNlTWF0ZXJpYWwuZGVmaW5lcyxcbiAgICAgIHZlcnRleEZ1bmN0aW9uczogc291cmNlTWF0ZXJpYWwudmVydGV4RnVuY3Rpb25zLFxuICAgICAgdmVydGV4UGFyYW1ldGVyczogc291cmNlTWF0ZXJpYWwudmVydGV4UGFyYW1ldGVycyxcbiAgICAgIHZlcnRleEluaXQ6IHNvdXJjZU1hdGVyaWFsLnZlcnRleEluaXQsXG4gICAgICB2ZXJ0ZXhQb3NpdGlvbjogc291cmNlTWF0ZXJpYWwudmVydGV4UG9zaXRpb25cbiAgICB9KTtcbiAgfVxufTtcblxuZXhwb3J0IHsgVXRpbHMgfTtcbiIsImltcG9ydCB7IEJ1ZmZlckdlb21ldHJ5LCBCdWZmZXJBdHRyaWJ1dGUgfSBmcm9tICd0aHJlZSc7XG5pbXBvcnQgeyBVdGlscyB9IGZyb20gJy4uL1V0aWxzJztcblxuY2xhc3MgTW9kZWxCdWZmZXJHZW9tZXRyeSBleHRlbmRzIEJ1ZmZlckdlb21ldHJ5IHtcbiAgLyoqXG4gICAqIEEgVEhSRUUuQnVmZmVyR2VvbWV0cnkgZm9yIGFuaW1hdGluZyBpbmRpdmlkdWFsIGZhY2VzIG9mIGEgVEhSRUUuR2VvbWV0cnkuXG4gICAqXG4gICAqIEBwYXJhbSB7VEhSRUUuR2VvbWV0cnl9IG1vZGVsIFRoZSBUSFJFRS5HZW9tZXRyeSB0byBiYXNlIHRoaXMgZ2VvbWV0cnkgb24uXG4gICAqIEBwYXJhbSB7T2JqZWN0PX0gb3B0aW9uc1xuICAgKiBAcGFyYW0ge0Jvb2xlYW49fSBvcHRpb25zLmNvbXB1dGVDZW50cm9pZHMgSWYgdHJ1ZSwgYSBjZW50cm9pZHMgd2lsbCBiZSBjb21wdXRlZCBmb3IgZWFjaCBmYWNlIGFuZCBzdG9yZWQgaW4gVEhSRUUuQkFTLk1vZGVsQnVmZmVyR2VvbWV0cnkuY2VudHJvaWRzLlxuICAgKiBAcGFyYW0ge0Jvb2xlYW49fSBvcHRpb25zLmxvY2FsaXplRmFjZXMgSWYgdHJ1ZSwgdGhlIHBvc2l0aW9ucyBmb3IgZWFjaCBmYWNlIHdpbGwgYmUgc3RvcmVkIHJlbGF0aXZlIHRvIHRoZSBjZW50cm9pZC4gVGhpcyBpcyB1c2VmdWwgaWYgeW91IHdhbnQgdG8gcm90YXRlIG9yIHNjYWxlIGZhY2VzIGFyb3VuZCB0aGVpciBjZW50ZXIuXG4gICAqL1xuICBjb25zdHJ1Y3RvciAobW9kZWwsIG9wdGlvbnMpIHtcbiAgICBzdXBlcigpO1xuXG4gICAgLyoqXG4gICAgICogQSByZWZlcmVuY2UgdG8gdGhlIGdlb21ldHJ5IHVzZWQgdG8gY3JlYXRlIHRoaXMgaW5zdGFuY2UuXG4gICAgICogQHR5cGUge1RIUkVFLkdlb21ldHJ5fVxuICAgICAqL1xuICAgIHRoaXMubW9kZWxHZW9tZXRyeSA9IG1vZGVsO1xuXG4gICAgLyoqXG4gICAgICogTnVtYmVyIG9mIGZhY2VzIG9mIHRoZSBtb2RlbC5cbiAgICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgICAqL1xuICAgIHRoaXMuZmFjZUNvdW50ID0gdGhpcy5tb2RlbEdlb21ldHJ5LmZhY2VzLmxlbmd0aDtcblxuICAgIC8qKlxuICAgICAqIE51bWJlciBvZiB2ZXJ0aWNlcyBvZiB0aGUgbW9kZWwuXG4gICAgICogQHR5cGUge051bWJlcn1cbiAgICAgKi9cbiAgICB0aGlzLnZlcnRleENvdW50ID0gdGhpcy5tb2RlbEdlb21ldHJ5LnZlcnRpY2VzLmxlbmd0aDtcblxuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgIG9wdGlvbnMuY29tcHV0ZUNlbnRyb2lkcyAmJiB0aGlzLmNvbXB1dGVDZW50cm9pZHMoKTtcblxuICAgIHRoaXMuYnVmZmVySW5kaWNlcygpO1xuICAgIHRoaXMuYnVmZmVyUG9zaXRpb25zKG9wdGlvbnMubG9jYWxpemVGYWNlcyk7XG4gIH1cblxuICAvKipcbiAgICogQ29tcHV0ZXMgYSBjZW50cm9pZCBmb3IgZWFjaCBmYWNlIGFuZCBzdG9yZXMgaXQgaW4gVEhSRUUuQkFTLk1vZGVsQnVmZmVyR2VvbWV0cnkuY2VudHJvaWRzLlxuICAgKi9cbiAgY29tcHV0ZUNlbnRyb2lkcyAoKSB7XG4gICAgLyoqXG4gICAgICogQW4gYXJyYXkgb2YgY2VudHJvaWRzIGNvcnJlc3BvbmRpbmcgdG8gdGhlIGZhY2VzIG9mIHRoZSBtb2RlbC5cbiAgICAgKlxuICAgICAqIEB0eXBlIHtBcnJheX1cbiAgICAgKi9cbiAgICB0aGlzLmNlbnRyb2lkcyA9IFtdO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmZhY2VDb3VudDsgaSsrKSB7XG4gICAgICB0aGlzLmNlbnRyb2lkc1tpXSA9IFV0aWxzLmNvbXB1dGVDZW50cm9pZCh0aGlzLm1vZGVsR2VvbWV0cnksIHRoaXMubW9kZWxHZW9tZXRyeS5mYWNlc1tpXSk7XG4gICAgfVxuICB9XG5cbiAgYnVmZmVySW5kaWNlcyAoKSB7XG4gICAgY29uc3QgaW5kZXhCdWZmZXIgPSBuZXcgVWludDMyQXJyYXkodGhpcy5mYWNlQ291bnQgKiAzKTtcblxuICAgIHRoaXMuc2V0SW5kZXgobmV3IEJ1ZmZlckF0dHJpYnV0ZShpbmRleEJ1ZmZlciwgMSkpO1xuXG4gICAgZm9yIChsZXQgaSA9IDAsIG9mZnNldCA9IDA7IGkgPCB0aGlzLmZhY2VDb3VudDsgaSsrLCBvZmZzZXQgKz0gMykge1xuICAgICAgY29uc3QgZmFjZSA9IHRoaXMubW9kZWxHZW9tZXRyeS5mYWNlc1tpXTtcblxuICAgICAgaW5kZXhCdWZmZXJbb2Zmc2V0ICAgIF0gPSBmYWNlLmE7XG4gICAgICBpbmRleEJ1ZmZlcltvZmZzZXQgKyAxXSA9IGZhY2UuYjtcbiAgICAgIGluZGV4QnVmZmVyW29mZnNldCArIDJdID0gZmFjZS5jO1xuICAgIH1cbiAgfVxuXG4gIGJ1ZmZlclBvc2l0aW9ucyAobG9jYWxpemVGYWNlcykge1xuICAgIGNvbnN0IHBvc2l0aW9uQnVmZmVyID0gdGhpcy5jcmVhdGVBdHRyaWJ1dGUoJ3Bvc2l0aW9uJywgMykuYXJyYXk7XG4gICAgbGV0IGksIG9mZnNldDtcblxuICAgIGlmIChsb2NhbGl6ZUZhY2VzID09PSB0cnVlKSB7XG4gICAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5mYWNlQ291bnQ7IGkrKykge1xuICAgICAgICBjb25zdCBmYWNlID0gdGhpcy5tb2RlbEdlb21ldHJ5LmZhY2VzW2ldO1xuICAgICAgICBjb25zdCBjZW50cm9pZCA9IHRoaXMuY2VudHJvaWRzID8gdGhpcy5jZW50cm9pZHNbaV0gOiBVdGlscy5jb21wdXRlQ2VudHJvaWQodGhpcy5tb2RlbEdlb21ldHJ5LCBmYWNlKTtcblxuICAgICAgICBjb25zdCBhID0gdGhpcy5tb2RlbEdlb21ldHJ5LnZlcnRpY2VzW2ZhY2UuYV07XG4gICAgICAgIGNvbnN0IGIgPSB0aGlzLm1vZGVsR2VvbWV0cnkudmVydGljZXNbZmFjZS5iXTtcbiAgICAgICAgY29uc3QgYyA9IHRoaXMubW9kZWxHZW9tZXRyeS52ZXJ0aWNlc1tmYWNlLmNdO1xuXG4gICAgICAgIHBvc2l0aW9uQnVmZmVyW2ZhY2UuYSAqIDNdICAgICA9IGEueCAtIGNlbnRyb2lkLng7XG4gICAgICAgIHBvc2l0aW9uQnVmZmVyW2ZhY2UuYSAqIDMgKyAxXSA9IGEueSAtIGNlbnRyb2lkLnk7XG4gICAgICAgIHBvc2l0aW9uQnVmZmVyW2ZhY2UuYSAqIDMgKyAyXSA9IGEueiAtIGNlbnRyb2lkLno7XG5cbiAgICAgICAgcG9zaXRpb25CdWZmZXJbZmFjZS5iICogM10gICAgID0gYi54IC0gY2VudHJvaWQueDtcbiAgICAgICAgcG9zaXRpb25CdWZmZXJbZmFjZS5iICogMyArIDFdID0gYi55IC0gY2VudHJvaWQueTtcbiAgICAgICAgcG9zaXRpb25CdWZmZXJbZmFjZS5iICogMyArIDJdID0gYi56IC0gY2VudHJvaWQuejtcblxuICAgICAgICBwb3NpdGlvbkJ1ZmZlcltmYWNlLmMgKiAzXSAgICAgPSBjLnggLSBjZW50cm9pZC54O1xuICAgICAgICBwb3NpdGlvbkJ1ZmZlcltmYWNlLmMgKiAzICsgMV0gPSBjLnkgLSBjZW50cm9pZC55O1xuICAgICAgICBwb3NpdGlvbkJ1ZmZlcltmYWNlLmMgKiAzICsgMl0gPSBjLnogLSBjZW50cm9pZC56O1xuICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIGZvciAoaSA9IDAsIG9mZnNldCA9IDA7IGkgPCB0aGlzLnZlcnRleENvdW50OyBpKyssIG9mZnNldCArPSAzKSB7XG4gICAgICAgIGNvbnN0IHZlcnRleCA9IHRoaXMubW9kZWxHZW9tZXRyeS52ZXJ0aWNlc1tpXTtcblxuICAgICAgICBwb3NpdGlvbkJ1ZmZlcltvZmZzZXQgICAgXSA9IHZlcnRleC54O1xuICAgICAgICBwb3NpdGlvbkJ1ZmZlcltvZmZzZXQgKyAxXSA9IHZlcnRleC55O1xuICAgICAgICBwb3NpdGlvbkJ1ZmZlcltvZmZzZXQgKyAyXSA9IHZlcnRleC56O1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgVEhSRUUuQnVmZmVyQXR0cmlidXRlIHdpdGggVVYgY29vcmRpbmF0ZXMuXG4gICAqL1xuICBidWZmZXJVdnMgKCkge1xuICAgIGNvbnN0IHV2QnVmZmVyID0gdGhpcy5jcmVhdGVBdHRyaWJ1dGUoJ3V2JywgMikuYXJyYXk7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuZmFjZUNvdW50OyBpKyspIHtcblxuICAgICAgY29uc3QgZmFjZSA9IHRoaXMubW9kZWxHZW9tZXRyeS5mYWNlc1tpXTtcbiAgICAgIGxldCB1djtcblxuICAgICAgdXYgPSB0aGlzLm1vZGVsR2VvbWV0cnkuZmFjZVZlcnRleFV2c1swXVtpXVswXTtcbiAgICAgIHV2QnVmZmVyW2ZhY2UuYSAqIDJdICAgICA9IHV2Lng7XG4gICAgICB1dkJ1ZmZlcltmYWNlLmEgKiAyICsgMV0gPSB1di55O1xuXG4gICAgICB1diA9IHRoaXMubW9kZWxHZW9tZXRyeS5mYWNlVmVydGV4VXZzWzBdW2ldWzFdO1xuICAgICAgdXZCdWZmZXJbZmFjZS5iICogMl0gICAgID0gdXYueDtcbiAgICAgIHV2QnVmZmVyW2ZhY2UuYiAqIDIgKyAxXSA9IHV2Lnk7XG5cbiAgICAgIHV2ID0gdGhpcy5tb2RlbEdlb21ldHJ5LmZhY2VWZXJ0ZXhVdnNbMF1baV1bMl07XG4gICAgICB1dkJ1ZmZlcltmYWNlLmMgKiAyXSAgICAgPSB1di54O1xuICAgICAgdXZCdWZmZXJbZmFjZS5jICogMiArIDFdID0gdXYueTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyB0d28gVEhSRUUuQnVmZmVyQXR0cmlidXRlczogc2tpbkluZGV4IGFuZCBza2luV2VpZ2h0LiBCb3RoIGFyZSByZXF1aXJlZCBmb3Igc2tpbm5pbmcuXG4gICAqL1xuICBidWZmZXJTa2lubmluZyAoKSB7XG4gICAgY29uc3Qgc2tpbkluZGV4QnVmZmVyID0gdGhpcy5jcmVhdGVBdHRyaWJ1dGUoJ3NraW5JbmRleCcsIDQpLmFycmF5O1xuICAgIGNvbnN0IHNraW5XZWlnaHRCdWZmZXIgPSB0aGlzLmNyZWF0ZUF0dHJpYnV0ZSgnc2tpbldlaWdodCcsIDQpLmFycmF5O1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnZlcnRleENvdW50OyBpKyspIHtcbiAgICAgIGNvbnN0IHNraW5JbmRleCA9IHRoaXMubW9kZWxHZW9tZXRyeS5za2luSW5kaWNlc1tpXTtcbiAgICAgIGNvbnN0IHNraW5XZWlnaHQgPSB0aGlzLm1vZGVsR2VvbWV0cnkuc2tpbldlaWdodHNbaV07XG5cbiAgICAgIHNraW5JbmRleEJ1ZmZlcltpICogNCAgICBdID0gc2tpbkluZGV4Lng7XG4gICAgICBza2luSW5kZXhCdWZmZXJbaSAqIDQgKyAxXSA9IHNraW5JbmRleC55O1xuICAgICAgc2tpbkluZGV4QnVmZmVyW2kgKiA0ICsgMl0gPSBza2luSW5kZXguejtcbiAgICAgIHNraW5JbmRleEJ1ZmZlcltpICogNCArIDNdID0gc2tpbkluZGV4Lnc7XG5cbiAgICAgIHNraW5XZWlnaHRCdWZmZXJbaSAqIDQgICAgXSA9IHNraW5XZWlnaHQueDtcbiAgICAgIHNraW5XZWlnaHRCdWZmZXJbaSAqIDQgKyAxXSA9IHNraW5XZWlnaHQueTtcbiAgICAgIHNraW5XZWlnaHRCdWZmZXJbaSAqIDQgKyAyXSA9IHNraW5XZWlnaHQuejtcbiAgICAgIHNraW5XZWlnaHRCdWZmZXJbaSAqIDQgKyAzXSA9IHNraW5XZWlnaHQudztcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIFRIUkVFLkJ1ZmZlckF0dHJpYnV0ZSBvbiB0aGlzIGdlb21ldHJ5IGluc3RhbmNlLlxuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gbmFtZSBOYW1lIG9mIHRoZSBhdHRyaWJ1dGUuXG4gICAqIEBwYXJhbSB7aW50fSBpdGVtU2l6ZSBOdW1iZXIgb2YgZmxvYXRzIHBlciB2ZXJ0ZXggKHR5cGljYWxseSAxLCAyLCAzIG9yIDQpLlxuICAgKiBAcGFyYW0ge2Z1bmN0aW9uPX0gZmFjdG9yeSBGdW5jdGlvbiB0aGF0IHdpbGwgYmUgY2FsbGVkIGZvciBlYWNoIGZhY2UgdXBvbiBjcmVhdGlvbi4gQWNjZXB0cyAzIGFyZ3VtZW50czogZGF0YVtdLCBpbmRleCBhbmQgZmFjZUNvdW50LiBDYWxscyBzZXRGYWNlRGF0YS5cbiAgICpcbiAgICogQHJldHVybnMge0J1ZmZlckF0dHJpYnV0ZX1cbiAgICovXG4gIGNyZWF0ZUF0dHJpYnV0ZSAobmFtZSwgaXRlbVNpemUsIGZhY3RvcnkpIHtcbiAgICBjb25zdCBidWZmZXIgPSBuZXcgRmxvYXQzMkFycmF5KHRoaXMudmVydGV4Q291bnQgKiBpdGVtU2l6ZSk7XG4gICAgY29uc3QgYXR0cmlidXRlID0gbmV3IEJ1ZmZlckF0dHJpYnV0ZShidWZmZXIsIGl0ZW1TaXplKTtcblxuICAgIHRoaXMuc2V0QXR0cmlidXRlKG5hbWUsIGF0dHJpYnV0ZSk7XG5cbiAgICBpZiAoZmFjdG9yeSkge1xuICAgICAgY29uc3QgZGF0YSA9IFtdO1xuXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuZmFjZUNvdW50OyBpKyspIHtcbiAgICAgICAgZmFjdG9yeShkYXRhLCBpLCB0aGlzLmZhY2VDb3VudCk7XG4gICAgICAgIHRoaXMuc2V0RmFjZURhdGEoYXR0cmlidXRlLCBpLCBkYXRhKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gYXR0cmlidXRlO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgZGF0YSBmb3IgYWxsIHZlcnRpY2VzIG9mIGEgZmFjZSBhdCBhIGdpdmVuIGluZGV4LlxuICAgKiBVc3VhbGx5IGNhbGxlZCBpbiBhIGxvb3AuXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfFRIUkVFLkJ1ZmZlckF0dHJpYnV0ZX0gYXR0cmlidXRlIFRoZSBhdHRyaWJ1dGUgb3IgYXR0cmlidXRlIG5hbWUgd2hlcmUgdGhlIGRhdGEgaXMgdG8gYmUgc3RvcmVkLlxuICAgKiBAcGFyYW0ge2ludH0gZmFjZUluZGV4IEluZGV4IG9mIHRoZSBmYWNlIGluIHRoZSBidWZmZXIgZ2VvbWV0cnkuXG4gICAqIEBwYXJhbSB7QXJyYXl9IGRhdGEgQXJyYXkgb2YgZGF0YS4gTGVuZ3RoIHNob3VsZCBiZSBlcXVhbCB0byBpdGVtIHNpemUgb2YgdGhlIGF0dHJpYnV0ZS5cbiAgICovXG4gIHNldEZhY2VEYXRhIChhdHRyaWJ1dGUsIGZhY2VJbmRleCwgZGF0YSkge1xuICAgIGF0dHJpYnV0ZSA9ICh0eXBlb2YgYXR0cmlidXRlID09PSAnc3RyaW5nJykgPyB0aGlzLmF0dHJpYnV0ZXNbYXR0cmlidXRlXSA6IGF0dHJpYnV0ZTtcblxuICAgIGxldCBvZmZzZXQgPSBmYWNlSW5kZXggKiAzICogYXR0cmlidXRlLml0ZW1TaXplO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCAzOyBpKyspIHtcbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgYXR0cmlidXRlLml0ZW1TaXplOyBqKyspIHtcbiAgICAgICAgYXR0cmlidXRlLmFycmF5W29mZnNldCsrXSA9IGRhdGFbal07XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCB7IE1vZGVsQnVmZmVyR2VvbWV0cnkgfTtcbiIsImltcG9ydCB7IEJ1ZmZlckdlb21ldHJ5LCBCdWZmZXJBdHRyaWJ1dGUgfSBmcm9tICd0aHJlZSc7XG5cbmNsYXNzIFBvaW50QnVmZmVyR2VvbWV0cnkgZXh0ZW5kcyBCdWZmZXJHZW9tZXRyeSB7XG4gIC8qKlxuICAgKiBBIFRIUkVFLkJ1ZmZlckdlb21ldHJ5IGNvbnNpc3RzIG9mIHBvaW50cy5cbiAgICogQHBhcmFtIHtOdW1iZXJ9IGNvdW50IFRoZSBudW1iZXIgb2YgcG9pbnRzLlxuICAgKiBAY29uc3RydWN0b3JcbiAgICovXG4gIGNvbnN0cnVjdG9yIChjb3VudCkge1xuICAgIHN1cGVyKCk7XG5cbiAgICAvKipcbiAgICAgKiBOdW1iZXIgb2YgcG9pbnRzLlxuICAgICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAgICovXG4gICAgdGhpcy5wb2ludENvdW50ID0gY291bnQ7XG5cbiAgICB0aGlzLmJ1ZmZlclBvc2l0aW9ucygpO1xuICB9XG5cbiAgYnVmZmVyUG9zaXRpb25zICgpIHtcbiAgICB0aGlzLmNyZWF0ZUF0dHJpYnV0ZSgncG9zaXRpb24nLCAzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgVEhSRUUuQnVmZmVyQXR0cmlidXRlIG9uIHRoaXMgZ2VvbWV0cnkgaW5zdGFuY2UuXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIE5hbWUgb2YgdGhlIGF0dHJpYnV0ZS5cbiAgICogQHBhcmFtIHtOdW1iZXJ9IGl0ZW1TaXplIE51bWJlciBvZiBmbG9hdHMgcGVyIHZlcnRleCAodHlwaWNhbGx5IDEsIDIsIDMgb3IgNCkuXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb249fSBmYWN0b3J5IEZ1bmN0aW9uIHRoYXQgd2lsbCBiZSBjYWxsZWQgZm9yIGVhY2ggcG9pbnQgdXBvbiBjcmVhdGlvbi4gQWNjZXB0cyAzIGFyZ3VtZW50czogZGF0YVtdLCBpbmRleCBhbmQgcHJlZmFiQ291bnQuIENhbGxzIHNldFBvaW50RGF0YS5cbiAgICpcbiAgICogQHJldHVybnMge1RIUkVFLkJ1ZmZlckF0dHJpYnV0ZX1cbiAgICovXG4gIGNyZWF0ZUF0dHJpYnV0ZSAobmFtZSwgaXRlbVNpemUsIGZhY3RvcnkpIHtcbiAgICBjb25zdCBidWZmZXIgPSBuZXcgRmxvYXQzMkFycmF5KHRoaXMucG9pbnRDb3VudCAqIGl0ZW1TaXplKTtcbiAgICBjb25zdCBhdHRyaWJ1dGUgPSBuZXcgQnVmZmVyQXR0cmlidXRlKGJ1ZmZlciwgaXRlbVNpemUpO1xuXG4gICAgdGhpcy5zZXRBdHRyaWJ1dGUobmFtZSwgYXR0cmlidXRlKTtcblxuICAgIGlmIChmYWN0b3J5KSB7XG4gICAgICBjb25zdCBkYXRhID0gW107XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucG9pbnRDb3VudDsgaSsrKSB7XG4gICAgICAgIGZhY3RvcnkoZGF0YSwgaSwgdGhpcy5wb2ludENvdW50KTtcbiAgICAgICAgdGhpcy5zZXRQb2ludERhdGEoYXR0cmlidXRlLCBpLCBkYXRhKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gYXR0cmlidXRlO1xuICB9XG5cbiAgc2V0UG9pbnREYXRhIChhdHRyaWJ1dGUsIHBvaW50SW5kZXgsIGRhdGEpIHtcbiAgICBhdHRyaWJ1dGUgPSAodHlwZW9mIGF0dHJpYnV0ZSA9PT0gJ3N0cmluZycpID8gdGhpcy5hdHRyaWJ1dGVzW2F0dHJpYnV0ZV0gOiBhdHRyaWJ1dGU7XG5cbiAgICBsZXQgb2Zmc2V0ID0gcG9pbnRJbmRleCAqIGF0dHJpYnV0ZS5pdGVtU2l6ZTtcblxuICAgIGZvciAobGV0IGogPSAwOyBqIDwgYXR0cmlidXRlLml0ZW1TaXplOyBqKyspIHtcbiAgICAgIGF0dHJpYnV0ZS5hcnJheVtvZmZzZXQrK10gPSBkYXRhW2pdO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgeyBQb2ludEJ1ZmZlckdlb21ldHJ5IH07XG4iLCIvLyBnZW5lcmF0ZWQgYnkgc2NyaXB0cy9idWlsZF9zaGFkZXJfY2h1bmtzLmpzXG5cbmltcG9ydCBjYXRtdWxsX3JvbV9zcGxpbmUgZnJvbSAnLi9nbHNsL2NhdG11bGxfcm9tX3NwbGluZS5nbHNsJztcbmltcG9ydCBjdWJpY19iZXppZXIgZnJvbSAnLi9nbHNsL2N1YmljX2Jlemllci5nbHNsJztcbmltcG9ydCBlYXNlX2JhY2tfaW4gZnJvbSAnLi9nbHNsL2Vhc2VfYmFja19pbi5nbHNsJztcbmltcG9ydCBlYXNlX2JhY2tfaW5fb3V0IGZyb20gJy4vZ2xzbC9lYXNlX2JhY2tfaW5fb3V0Lmdsc2wnO1xuaW1wb3J0IGVhc2VfYmFja19vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfYmFja19vdXQuZ2xzbCc7XG5pbXBvcnQgZWFzZV9iZXppZXIgZnJvbSAnLi9nbHNsL2Vhc2VfYmV6aWVyLmdsc2wnO1xuaW1wb3J0IGVhc2VfYm91bmNlX2luIGZyb20gJy4vZ2xzbC9lYXNlX2JvdW5jZV9pbi5nbHNsJztcbmltcG9ydCBlYXNlX2JvdW5jZV9pbl9vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfYm91bmNlX2luX291dC5nbHNsJztcbmltcG9ydCBlYXNlX2JvdW5jZV9vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfYm91bmNlX291dC5nbHNsJztcbmltcG9ydCBlYXNlX2NpcmNfaW4gZnJvbSAnLi9nbHNsL2Vhc2VfY2lyY19pbi5nbHNsJztcbmltcG9ydCBlYXNlX2NpcmNfaW5fb3V0IGZyb20gJy4vZ2xzbC9lYXNlX2NpcmNfaW5fb3V0Lmdsc2wnO1xuaW1wb3J0IGVhc2VfY2lyY19vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfY2lyY19vdXQuZ2xzbCc7XG5pbXBvcnQgZWFzZV9jdWJpY19pbiBmcm9tICcuL2dsc2wvZWFzZV9jdWJpY19pbi5nbHNsJztcbmltcG9ydCBlYXNlX2N1YmljX2luX291dCBmcm9tICcuL2dsc2wvZWFzZV9jdWJpY19pbl9vdXQuZ2xzbCc7XG5pbXBvcnQgZWFzZV9jdWJpY19vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfY3ViaWNfb3V0Lmdsc2wnO1xuaW1wb3J0IGVhc2VfZWxhc3RpY19pbiBmcm9tICcuL2dsc2wvZWFzZV9lbGFzdGljX2luLmdsc2wnO1xuaW1wb3J0IGVhc2VfZWxhc3RpY19pbl9vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfZWxhc3RpY19pbl9vdXQuZ2xzbCc7XG5pbXBvcnQgZWFzZV9lbGFzdGljX291dCBmcm9tICcuL2dsc2wvZWFzZV9lbGFzdGljX291dC5nbHNsJztcbmltcG9ydCBlYXNlX2V4cG9faW4gZnJvbSAnLi9nbHNsL2Vhc2VfZXhwb19pbi5nbHNsJztcbmltcG9ydCBlYXNlX2V4cG9faW5fb3V0IGZyb20gJy4vZ2xzbC9lYXNlX2V4cG9faW5fb3V0Lmdsc2wnO1xuaW1wb3J0IGVhc2VfZXhwb19vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfZXhwb19vdXQuZ2xzbCc7XG5pbXBvcnQgZWFzZV9xdWFkX2luIGZyb20gJy4vZ2xzbC9lYXNlX3F1YWRfaW4uZ2xzbCc7XG5pbXBvcnQgZWFzZV9xdWFkX2luX291dCBmcm9tICcuL2dsc2wvZWFzZV9xdWFkX2luX291dC5nbHNsJztcbmltcG9ydCBlYXNlX3F1YWRfb3V0IGZyb20gJy4vZ2xzbC9lYXNlX3F1YWRfb3V0Lmdsc2wnO1xuaW1wb3J0IGVhc2VfcXVhcnRfaW4gZnJvbSAnLi9nbHNsL2Vhc2VfcXVhcnRfaW4uZ2xzbCc7XG5pbXBvcnQgZWFzZV9xdWFydF9pbl9vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfcXVhcnRfaW5fb3V0Lmdsc2wnO1xuaW1wb3J0IGVhc2VfcXVhcnRfb3V0IGZyb20gJy4vZ2xzbC9lYXNlX3F1YXJ0X291dC5nbHNsJztcbmltcG9ydCBlYXNlX3F1aW50X2luIGZyb20gJy4vZ2xzbC9lYXNlX3F1aW50X2luLmdsc2wnO1xuaW1wb3J0IGVhc2VfcXVpbnRfaW5fb3V0IGZyb20gJy4vZ2xzbC9lYXNlX3F1aW50X2luX291dC5nbHNsJztcbmltcG9ydCBlYXNlX3F1aW50X291dCBmcm9tICcuL2dsc2wvZWFzZV9xdWludF9vdXQuZ2xzbCc7XG5pbXBvcnQgZWFzZV9zaW5lX2luIGZyb20gJy4vZ2xzbC9lYXNlX3NpbmVfaW4uZ2xzbCc7XG5pbXBvcnQgZWFzZV9zaW5lX2luX291dCBmcm9tICcuL2dsc2wvZWFzZV9zaW5lX2luX291dC5nbHNsJztcbmltcG9ydCBlYXNlX3NpbmVfb3V0IGZyb20gJy4vZ2xzbC9lYXNlX3NpbmVfb3V0Lmdsc2wnO1xuaW1wb3J0IHF1YWRyYXRpY19iZXppZXIgZnJvbSAnLi9nbHNsL3F1YWRyYXRpY19iZXppZXIuZ2xzbCc7XG5pbXBvcnQgcXVhdGVybmlvbl9yb3RhdGlvbiBmcm9tICcuL2dsc2wvcXVhdGVybmlvbl9yb3RhdGlvbi5nbHNsJztcbmltcG9ydCBxdWF0ZXJuaW9uX3NsZXJwIGZyb20gJy4vZ2xzbC9xdWF0ZXJuaW9uX3NsZXJwLmdsc2wnO1xuXG5cbmV4cG9ydCBjb25zdCBTaGFkZXJDaHVuayA9IHtcbiAgY2F0bXVsbF9yb21fc3BsaW5lOiBjYXRtdWxsX3JvbV9zcGxpbmUsXG4gIGN1YmljX2JlemllcjogY3ViaWNfYmV6aWVyLFxuICBlYXNlX2JhY2tfaW46IGVhc2VfYmFja19pbixcbiAgZWFzZV9iYWNrX2luX291dDogZWFzZV9iYWNrX2luX291dCxcbiAgZWFzZV9iYWNrX291dDogZWFzZV9iYWNrX291dCxcbiAgZWFzZV9iZXppZXI6IGVhc2VfYmV6aWVyLFxuICBlYXNlX2JvdW5jZV9pbjogZWFzZV9ib3VuY2VfaW4sXG4gIGVhc2VfYm91bmNlX2luX291dDogZWFzZV9ib3VuY2VfaW5fb3V0LFxuICBlYXNlX2JvdW5jZV9vdXQ6IGVhc2VfYm91bmNlX291dCxcbiAgZWFzZV9jaXJjX2luOiBlYXNlX2NpcmNfaW4sXG4gIGVhc2VfY2lyY19pbl9vdXQ6IGVhc2VfY2lyY19pbl9vdXQsXG4gIGVhc2VfY2lyY19vdXQ6IGVhc2VfY2lyY19vdXQsXG4gIGVhc2VfY3ViaWNfaW46IGVhc2VfY3ViaWNfaW4sXG4gIGVhc2VfY3ViaWNfaW5fb3V0OiBlYXNlX2N1YmljX2luX291dCxcbiAgZWFzZV9jdWJpY19vdXQ6IGVhc2VfY3ViaWNfb3V0LFxuICBlYXNlX2VsYXN0aWNfaW46IGVhc2VfZWxhc3RpY19pbixcbiAgZWFzZV9lbGFzdGljX2luX291dDogZWFzZV9lbGFzdGljX2luX291dCxcbiAgZWFzZV9lbGFzdGljX291dDogZWFzZV9lbGFzdGljX291dCxcbiAgZWFzZV9leHBvX2luOiBlYXNlX2V4cG9faW4sXG4gIGVhc2VfZXhwb19pbl9vdXQ6IGVhc2VfZXhwb19pbl9vdXQsXG4gIGVhc2VfZXhwb19vdXQ6IGVhc2VfZXhwb19vdXQsXG4gIGVhc2VfcXVhZF9pbjogZWFzZV9xdWFkX2luLFxuICBlYXNlX3F1YWRfaW5fb3V0OiBlYXNlX3F1YWRfaW5fb3V0LFxuICBlYXNlX3F1YWRfb3V0OiBlYXNlX3F1YWRfb3V0LFxuICBlYXNlX3F1YXJ0X2luOiBlYXNlX3F1YXJ0X2luLFxuICBlYXNlX3F1YXJ0X2luX291dDogZWFzZV9xdWFydF9pbl9vdXQsXG4gIGVhc2VfcXVhcnRfb3V0OiBlYXNlX3F1YXJ0X291dCxcbiAgZWFzZV9xdWludF9pbjogZWFzZV9xdWludF9pbixcbiAgZWFzZV9xdWludF9pbl9vdXQ6IGVhc2VfcXVpbnRfaW5fb3V0LFxuICBlYXNlX3F1aW50X291dDogZWFzZV9xdWludF9vdXQsXG4gIGVhc2Vfc2luZV9pbjogZWFzZV9zaW5lX2luLFxuICBlYXNlX3NpbmVfaW5fb3V0OiBlYXNlX3NpbmVfaW5fb3V0LFxuICBlYXNlX3NpbmVfb3V0OiBlYXNlX3NpbmVfb3V0LFxuICBxdWFkcmF0aWNfYmV6aWVyOiBxdWFkcmF0aWNfYmV6aWVyLFxuICBxdWF0ZXJuaW9uX3JvdGF0aW9uOiBxdWF0ZXJuaW9uX3JvdGF0aW9uLFxuICBxdWF0ZXJuaW9uX3NsZXJwOiBxdWF0ZXJuaW9uX3NsZXJwLFxuXG59O1xuXG4iLCIvKipcbiAqIEEgdGltZWxpbmUgdHJhbnNpdGlvbiBzZWdtZW50LiBBbiBpbnN0YW5jZSBvZiB0aGlzIGNsYXNzIGlzIGNyZWF0ZWQgaW50ZXJuYWxseSB3aGVuIGNhbGxpbmcge0BsaW5rIFRIUkVFLkJBUy5UaW1lbGluZS5hZGR9LCBzbyB5b3Ugc2hvdWxkIG5vdCB1c2UgdGhpcyBjbGFzcyBkaXJlY3RseS5cbiAqIFRoZSBpbnN0YW5jZSBpcyBhbHNvIHBhc3NlZCB0aGUgdGhlIGNvbXBpbGVyIGZ1bmN0aW9uIGlmIHlvdSByZWdpc3RlciBhIHRyYW5zaXRpb24gdGhyb3VnaCB7QGxpbmsgVEhSRUUuQkFTLlRpbWVsaW5lLnJlZ2lzdGVyfS4gVGhlcmUgeW91IGNhbiB1c2UgdGhlIHB1YmxpYyBwcm9wZXJ0aWVzIG9mIHRoZSBzZWdtZW50IHRvIGNvbXBpbGUgdGhlIGdsc2wgc3RyaW5nLlxuICogQHBhcmFtIHtzdHJpbmd9IGtleSBBIHN0cmluZyBrZXkgZ2VuZXJhdGVkIGJ5IHRoZSB0aW1lbGluZSB0byB3aGljaCB0aGlzIHNlZ21lbnQgYmVsb25ncy4gS2V5cyBhcmUgdW5pcXVlLlxuICogQHBhcmFtIHtudW1iZXJ9IHN0YXJ0IFN0YXJ0IHRpbWUgb2YgdGhpcyBzZWdtZW50IGluIGEgdGltZWxpbmUgaW4gc2Vjb25kcy5cbiAqIEBwYXJhbSB7bnVtYmVyfSBkdXJhdGlvbiBEdXJhdGlvbiBvZiB0aGlzIHNlZ21lbnQgaW4gc2Vjb25kcy5cbiAqIEBwYXJhbSB7b2JqZWN0fSB0cmFuc2l0aW9uIE9iamVjdCBkZXNjcmliaW5nIHRoZSB0cmFuc2l0aW9uLlxuICogQHBhcmFtIHtmdW5jdGlvbn0gY29tcGlsZXIgQSByZWZlcmVuY2UgdG8gdGhlIGNvbXBpbGVyIGZ1bmN0aW9uIGZyb20gYSB0cmFuc2l0aW9uIGRlZmluaXRpb24uXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gVGltZWxpbmVTZWdtZW50KGtleSwgc3RhcnQsIGR1cmF0aW9uLCB0cmFuc2l0aW9uLCBjb21waWxlcikge1xuICB0aGlzLmtleSA9IGtleTtcbiAgdGhpcy5zdGFydCA9IHN0YXJ0O1xuICB0aGlzLmR1cmF0aW9uID0gZHVyYXRpb247XG4gIHRoaXMudHJhbnNpdGlvbiA9IHRyYW5zaXRpb247XG4gIHRoaXMuY29tcGlsZXIgPSBjb21waWxlcjtcblxuICB0aGlzLnRyYWlsID0gMDtcbn1cblxuVGltZWxpbmVTZWdtZW50LnByb3RvdHlwZS5jb21waWxlID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLmNvbXBpbGVyKHRoaXMpO1xufTtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KFRpbWVsaW5lU2VnbWVudC5wcm90b3R5cGUsICdlbmQnLCB7XG4gIGdldDogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuc3RhcnQgKyB0aGlzLmR1cmF0aW9uO1xuICB9XG59KTtcblxuZXhwb3J0IHsgVGltZWxpbmVTZWdtZW50IH07XG4iLCJpbXBvcnQgeyBUaW1lbGluZVNlZ21lbnQgfSBmcm9tICcuL1RpbWVsaW5lU2VnbWVudCc7XG5cbi8qKlxuICogQSB1dGlsaXR5IGNsYXNzIHRvIGNyZWF0ZSBhbiBhbmltYXRpb24gdGltZWxpbmUgd2hpY2ggY2FuIGJlIGJha2VkIGludG8gYSAodmVydGV4KSBzaGFkZXIuXG4gKiBCeSBkZWZhdWx0IHRoZSB0aW1lbGluZSBzdXBwb3J0cyB0cmFuc2xhdGlvbiwgc2NhbGUgYW5kIHJvdGF0aW9uLiBUaGlzIGNhbiBiZSBleHRlbmRlZCBvciBvdmVycmlkZGVuLlxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIFRpbWVsaW5lKCkge1xuICAvKipcbiAgICogVGhlIHRvdGFsIGR1cmF0aW9uIG9mIHRoZSB0aW1lbGluZSBpbiBzZWNvbmRzLlxuICAgKiBAdHlwZSB7bnVtYmVyfVxuICAgKi9cbiAgdGhpcy5kdXJhdGlvbiA9IDA7XG5cbiAgLyoqXG4gICAqIFRoZSBuYW1lIG9mIHRoZSB2YWx1ZSB0aGF0IHNlZ21lbnRzIHdpbGwgdXNlIHRvIHJlYWQgdGhlIHRpbWUuIERlZmF1bHRzIHRvICd0VGltZScuXG4gICAqIEB0eXBlIHtzdHJpbmd9XG4gICAqL1xuICB0aGlzLnRpbWVLZXkgPSAndFRpbWUnO1xuXG4gIHRoaXMuc2VnbWVudHMgPSB7fTtcbiAgdGhpcy5fX2tleSA9IDA7XG59XG5cbi8vIHN0YXRpYyBkZWZpbml0aW9ucyBtYXBcblRpbWVsaW5lLnNlZ21lbnREZWZpbml0aW9ucyA9IHt9O1xuXG4vKipcbiAqIFJlZ2lzdGVycyBhIHRyYW5zaXRpb24gZGVmaW5pdGlvbiBmb3IgdXNlIHdpdGgge0BsaW5rIFRIUkVFLkJBUy5UaW1lbGluZS5hZGR9LlxuICogQHBhcmFtIHtTdHJpbmd9IGtleSBOYW1lIG9mIHRoZSB0cmFuc2l0aW9uLiBEZWZhdWx0cyBpbmNsdWRlICdzY2FsZScsICdyb3RhdGUnIGFuZCAndHJhbnNsYXRlJy5cbiAqIEBwYXJhbSB7T2JqZWN0fSBkZWZpbml0aW9uXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBkZWZpbml0aW9uLmNvbXBpbGVyIEEgZnVuY3Rpb24gdGhhdCBnZW5lcmF0ZXMgYSBnbHNsIHN0cmluZyBmb3IgYSB0cmFuc2l0aW9uIHNlZ21lbnQuIEFjY2VwdHMgYSBUSFJFRS5CQVMuVGltZWxpbmVTZWdtZW50IGFzIHRoZSBzb2xlIGFyZ3VtZW50LlxuICogQHBhcmFtIHsqfSBkZWZpbml0aW9uLmRlZmF1bHRGcm9tIFRoZSBpbml0aWFsIHZhbHVlIGZvciBhIHRyYW5zZm9ybS5mcm9tLiBGb3IgZXhhbXBsZSwgdGhlIGRlZmF1bHRGcm9tIGZvciBhIHRyYW5zbGF0aW9uIGlzIFRIUkVFLlZlY3RvcjMoMCwgMCwgMCkuXG4gKiBAc3RhdGljXG4gKi9cblRpbWVsaW5lLnJlZ2lzdGVyID0gZnVuY3Rpb24oa2V5LCBkZWZpbml0aW9uKSB7XG4gIFRpbWVsaW5lLnNlZ21lbnREZWZpbml0aW9uc1trZXldID0gZGVmaW5pdGlvbjtcbiAgXG4gIHJldHVybiBkZWZpbml0aW9uO1xufTtcblxuLyoqXG4gKiBBZGQgYSB0cmFuc2l0aW9uIHRvIHRoZSB0aW1lbGluZS5cbiAqIEBwYXJhbSB7bnVtYmVyfSBkdXJhdGlvbiBEdXJhdGlvbiBpbiBzZWNvbmRzXG4gKiBAcGFyYW0ge29iamVjdH0gdHJhbnNpdGlvbnMgQW4gb2JqZWN0IGNvbnRhaW5pbmcgb25lIG9yIHNldmVyYWwgdHJhbnNpdGlvbnMuIFRoZSBrZXlzIHNob3VsZCBtYXRjaCB0cmFuc2Zvcm0gZGVmaW5pdGlvbnMuXG4gKiBUaGUgdHJhbnNpdGlvbiBvYmplY3QgZm9yIGVhY2gga2V5IHdpbGwgYmUgcGFzc2VkIHRvIHRoZSBtYXRjaGluZyBkZWZpbml0aW9uJ3MgY29tcGlsZXIuIEl0IGNhbiBoYXZlIGFyYml0cmFyeSBwcm9wZXJ0aWVzLCBidXQgdGhlIFRpbWVsaW5lIGV4cGVjdHMgYXQgbGVhc3QgYSAndG8nLCAnZnJvbScgYW5kIGFuIG9wdGlvbmFsICdlYXNlJy5cbiAqIEBwYXJhbSB7bnVtYmVyfHN0cmluZ30gW3Bvc2l0aW9uT2Zmc2V0XSBQb3NpdGlvbiBpbiB0aGUgdGltZWxpbmUuIERlZmF1bHRzIHRvIHRoZSBlbmQgb2YgdGhlIHRpbWVsaW5lLiBJZiBhIG51bWJlciBpcyBwcm92aWRlZCwgdGhlIHRyYW5zaXRpb24gd2lsbCBiZSBpbnNlcnRlZCBhdCB0aGF0IHRpbWUgaW4gc2Vjb25kcy4gU3RyaW5ncyAoJys9eCcgb3IgJy09eCcpIGNhbiBiZSB1c2VkIGZvciBhIHZhbHVlIHJlbGF0aXZlIHRvIHRoZSBlbmQgb2YgdGltZWxpbmUuXG4gKi9cblRpbWVsaW5lLnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbihkdXJhdGlvbiwgdHJhbnNpdGlvbnMsIHBvc2l0aW9uT2Zmc2V0KSB7XG4gIC8vIHN0b3Agcm9sbHVwIGZyb20gY29tcGxhaW5pbmcgYWJvdXQgZXZhbFxuICBjb25zdCBfZXZhbCA9IGV2YWw7XG4gIFxuICBsZXQgc3RhcnQgPSB0aGlzLmR1cmF0aW9uO1xuXG4gIGlmIChwb3NpdGlvbk9mZnNldCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgaWYgKHR5cGVvZiBwb3NpdGlvbk9mZnNldCA9PT0gJ251bWJlcicpIHtcbiAgICAgIHN0YXJ0ID0gcG9zaXRpb25PZmZzZXQ7XG4gICAgfVxuICAgIGVsc2UgaWYgKHR5cGVvZiBwb3NpdGlvbk9mZnNldCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIF9ldmFsKCdzdGFydCcgKyBwb3NpdGlvbk9mZnNldCk7XG4gICAgfVxuXG4gICAgdGhpcy5kdXJhdGlvbiA9IE1hdGgubWF4KHRoaXMuZHVyYXRpb24sIHN0YXJ0ICsgZHVyYXRpb24pO1xuICB9XG4gIGVsc2Uge1xuICAgIHRoaXMuZHVyYXRpb24gKz0gZHVyYXRpb247XG4gIH1cblxuICBsZXQga2V5cyA9IE9iamVjdC5rZXlzKHRyYW5zaXRpb25zKSwga2V5O1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7IGkrKykge1xuICAgIGtleSA9IGtleXNbaV07XG5cbiAgICB0aGlzLnByb2Nlc3NUcmFuc2l0aW9uKGtleSwgdHJhbnNpdGlvbnNba2V5XSwgc3RhcnQsIGR1cmF0aW9uKTtcbiAgfVxufTtcblxuVGltZWxpbmUucHJvdG90eXBlLnByb2Nlc3NUcmFuc2l0aW9uID0gZnVuY3Rpb24oa2V5LCB0cmFuc2l0aW9uLCBzdGFydCwgZHVyYXRpb24pIHtcbiAgY29uc3QgZGVmaW5pdGlvbiA9IFRpbWVsaW5lLnNlZ21lbnREZWZpbml0aW9uc1trZXldO1xuXG4gIGxldCBzZWdtZW50cyA9IHRoaXMuc2VnbWVudHNba2V5XTtcbiAgaWYgKCFzZWdtZW50cykgc2VnbWVudHMgPSB0aGlzLnNlZ21lbnRzW2tleV0gPSBbXTtcblxuICBpZiAodHJhbnNpdGlvbi5mcm9tID09PSB1bmRlZmluZWQpIHtcbiAgICBpZiAoc2VnbWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICB0cmFuc2l0aW9uLmZyb20gPSBkZWZpbml0aW9uLmRlZmF1bHRGcm9tO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHRyYW5zaXRpb24uZnJvbSA9IHNlZ21lbnRzW3NlZ21lbnRzLmxlbmd0aCAtIDFdLnRyYW5zaXRpb24udG87XG4gICAgfVxuICB9XG5cbiAgc2VnbWVudHMucHVzaChuZXcgVGltZWxpbmVTZWdtZW50KCh0aGlzLl9fa2V5KyspLnRvU3RyaW5nKCksIHN0YXJ0LCBkdXJhdGlvbiwgdHJhbnNpdGlvbiwgZGVmaW5pdGlvbi5jb21waWxlcikpO1xufTtcblxuLyoqXG4gKiBDb21waWxlcyB0aGUgdGltZWxpbmUgaW50byBhIGdsc2wgc3RyaW5nIGFycmF5IHRoYXQgY2FuIGJlIGluamVjdGVkIGludG8gYSAodmVydGV4KSBzaGFkZXIuXG4gKiBAcmV0dXJucyB7QXJyYXl9XG4gKi9cblRpbWVsaW5lLnByb3RvdHlwZS5jb21waWxlID0gZnVuY3Rpb24oKSB7XG4gIGNvbnN0IGMgPSBbXTtcblxuICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXModGhpcy5zZWdtZW50cyk7XG4gIGxldCBzZWdtZW50cztcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyBpKyspIHtcbiAgICBzZWdtZW50cyA9IHRoaXMuc2VnbWVudHNba2V5c1tpXV07XG5cbiAgICB0aGlzLmZpbGxHYXBzKHNlZ21lbnRzKTtcblxuICAgIHNlZ21lbnRzLmZvckVhY2goZnVuY3Rpb24ocykge1xuICAgICAgYy5wdXNoKHMuY29tcGlsZSgpKTtcbiAgICB9KTtcbiAgfVxuXG4gIHJldHVybiBjO1xufTtcblRpbWVsaW5lLnByb3RvdHlwZS5maWxsR2FwcyA9IGZ1bmN0aW9uKHNlZ21lbnRzKSB7XG4gIGlmIChzZWdtZW50cy5sZW5ndGggPT09IDApIHJldHVybjtcblxuICBsZXQgczAsIHMxO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgc2VnbWVudHMubGVuZ3RoIC0gMTsgaSsrKSB7XG4gICAgczAgPSBzZWdtZW50c1tpXTtcbiAgICBzMSA9IHNlZ21lbnRzW2kgKyAxXTtcblxuICAgIHMwLnRyYWlsID0gczEuc3RhcnQgLSBzMC5lbmQ7XG4gIH1cblxuICAvLyBwYWQgbGFzdCBzZWdtZW50IHVudGlsIGVuZCBvZiB0aW1lbGluZVxuICBzMCA9IHNlZ21lbnRzW3NlZ21lbnRzLmxlbmd0aCAtIDFdO1xuICBzMC50cmFpbCA9IHRoaXMuZHVyYXRpb24gLSBzMC5lbmQ7XG59O1xuXG4vKipcbiAqIEdldCBhIGNvbXBpbGVkIGdsc2wgc3RyaW5nIHdpdGggY2FsbHMgdG8gdHJhbnNmb3JtIGZ1bmN0aW9ucyBmb3IgYSBnaXZlbiBrZXkuXG4gKiBUaGUgb3JkZXIgaW4gd2hpY2ggdGhlc2UgdHJhbnNpdGlvbnMgYXJlIGFwcGxpZWQgbWF0dGVycyBiZWNhdXNlIHRoZXkgYWxsIG9wZXJhdGUgb24gdGhlIHNhbWUgdmFsdWUuXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IEEga2V5IG1hdGNoaW5nIGEgdHJhbnNmb3JtIGRlZmluaXRpb24uXG4gKiBAcmV0dXJucyB7c3RyaW5nfVxuICovXG5UaW1lbGluZS5wcm90b3R5cGUuZ2V0VHJhbnNmb3JtQ2FsbHMgPSBmdW5jdGlvbihrZXkpIHtcbiAgbGV0IHQgPSB0aGlzLnRpbWVLZXk7XG5cbiAgcmV0dXJuIHRoaXMuc2VnbWVudHNba2V5XSA/ICB0aGlzLnNlZ21lbnRzW2tleV0ubWFwKGZ1bmN0aW9uKHMpIHtcbiAgICByZXR1cm4gYGFwcGx5VHJhbnNmb3JtJHtzLmtleX0oJHt0fSwgdHJhbnNmb3JtZWQpO2A7XG4gIH0pLmpvaW4oJ1xcbicpIDogJyc7XG59O1xuXG5leHBvcnQgeyBUaW1lbGluZSB9XG4iLCJjb25zdCBUaW1lbGluZUNodW5rcyA9IHtcbiAgdmVjMzogZnVuY3Rpb24obiwgdiwgcCkge1xuICAgIGNvbnN0IHggPSAodi54IHx8IDApLnRvUHJlY2lzaW9uKHApO1xuICAgIGNvbnN0IHkgPSAodi55IHx8IDApLnRvUHJlY2lzaW9uKHApO1xuICAgIGNvbnN0IHogPSAodi56IHx8IDApLnRvUHJlY2lzaW9uKHApO1xuXG4gICAgcmV0dXJuIGB2ZWMzICR7bn0gPSB2ZWMzKCR7eH0sICR7eX0sICR7en0pO2A7XG4gIH0sXG4gIHZlYzQ6IGZ1bmN0aW9uKG4sIHYsIHApIHtcbiAgICBjb25zdCB4ID0gKHYueCB8fCAwKS50b1ByZWNpc2lvbihwKTtcbiAgICBjb25zdCB5ID0gKHYueSB8fCAwKS50b1ByZWNpc2lvbihwKTtcbiAgICBjb25zdCB6ID0gKHYueiB8fCAwKS50b1ByZWNpc2lvbihwKTtcbiAgICBjb25zdCB3ID0gKHYudyB8fCAwKS50b1ByZWNpc2lvbihwKTtcbiAgXG4gICAgcmV0dXJuIGB2ZWM0ICR7bn0gPSB2ZWM0KCR7eH0sICR7eX0sICR7en0sICR7d30pO2A7XG4gIH0sXG4gIGRlbGF5RHVyYXRpb246IGZ1bmN0aW9uKHNlZ21lbnQpIHtcbiAgICByZXR1cm4gYFxuICAgIGZsb2F0IGNEZWxheSR7c2VnbWVudC5rZXl9ID0gJHtzZWdtZW50LnN0YXJ0LnRvUHJlY2lzaW9uKDQpfTtcbiAgICBmbG9hdCBjRHVyYXRpb24ke3NlZ21lbnQua2V5fSA9ICR7c2VnbWVudC5kdXJhdGlvbi50b1ByZWNpc2lvbig0KX07XG4gICAgYDtcbiAgfSxcbiAgcHJvZ3Jlc3M6IGZ1bmN0aW9uKHNlZ21lbnQpIHtcbiAgICAvLyB6ZXJvIGR1cmF0aW9uIHNlZ21lbnRzIHNob3VsZCBhbHdheXMgcmVuZGVyIGNvbXBsZXRlXG4gICAgaWYgKHNlZ21lbnQuZHVyYXRpb24gPT09IDApIHtcbiAgICAgIHJldHVybiBgZmxvYXQgcHJvZ3Jlc3MgPSAxLjA7YFxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHJldHVybiBgXG4gICAgICBmbG9hdCBwcm9ncmVzcyA9IGNsYW1wKHRpbWUgLSBjRGVsYXkke3NlZ21lbnQua2V5fSwgMC4wLCBjRHVyYXRpb24ke3NlZ21lbnQua2V5fSkgLyBjRHVyYXRpb24ke3NlZ21lbnQua2V5fTtcbiAgICAgICR7c2VnbWVudC50cmFuc2l0aW9uLmVhc2UgPyBgcHJvZ3Jlc3MgPSAke3NlZ21lbnQudHJhbnNpdGlvbi5lYXNlfShwcm9ncmVzcyR7KHNlZ21lbnQudHJhbnNpdGlvbi5lYXNlUGFyYW1zID8gYCwgJHtzZWdtZW50LnRyYW5zaXRpb24uZWFzZVBhcmFtcy5tYXAoKHYpID0+IHYudG9QcmVjaXNpb24oNCkpLmpvaW4oYCwgYCl9YCA6IGBgKX0pO2AgOiBgYH1cbiAgICAgIGA7XG4gICAgfVxuICB9LFxuICByZW5kZXJDaGVjazogZnVuY3Rpb24oc2VnbWVudCkge1xuICAgIGNvbnN0IHN0YXJ0VGltZSA9IHNlZ21lbnQuc3RhcnQudG9QcmVjaXNpb24oNCk7XG4gICAgY29uc3QgZW5kVGltZSA9IChzZWdtZW50LmVuZCArIHNlZ21lbnQudHJhaWwpLnRvUHJlY2lzaW9uKDQpO1xuXG4gICAgcmV0dXJuIGBpZiAodGltZSA8ICR7c3RhcnRUaW1lfSB8fCB0aW1lID4gJHtlbmRUaW1lfSkgcmV0dXJuO2A7XG4gIH1cbn07XG5cbmV4cG9ydCB7IFRpbWVsaW5lQ2h1bmtzIH07XG4iLCJpbXBvcnQgeyBUaW1lbGluZSB9IGZyb20gJy4vVGltZWxpbmUnO1xuaW1wb3J0IHsgVGltZWxpbmVDaHVua3MgfSBmcm9tICcuL1RpbWVsaW5lQ2h1bmtzJztcbmltcG9ydCB7IFZlY3RvcjMgfSBmcm9tICd0aHJlZSc7XG5cbmNvbnN0IFRyYW5zbGF0aW9uU2VnbWVudCA9IHtcbiAgY29tcGlsZXI6IGZ1bmN0aW9uKHNlZ21lbnQpIHtcbiAgICByZXR1cm4gYFxuICAgICR7VGltZWxpbmVDaHVua3MuZGVsYXlEdXJhdGlvbihzZWdtZW50KX1cbiAgICAke1RpbWVsaW5lQ2h1bmtzLnZlYzMoYGNUcmFuc2xhdGVGcm9tJHtzZWdtZW50LmtleX1gLCBzZWdtZW50LnRyYW5zaXRpb24uZnJvbSwgMil9XG4gICAgJHtUaW1lbGluZUNodW5rcy52ZWMzKGBjVHJhbnNsYXRlVG8ke3NlZ21lbnQua2V5fWAsIHNlZ21lbnQudHJhbnNpdGlvbi50bywgMil9XG4gICAgXG4gICAgdm9pZCBhcHBseVRyYW5zZm9ybSR7c2VnbWVudC5rZXl9KGZsb2F0IHRpbWUsIGlub3V0IHZlYzMgdikge1xuICAgIFxuICAgICAgJHtUaW1lbGluZUNodW5rcy5yZW5kZXJDaGVjayhzZWdtZW50KX1cbiAgICAgICR7VGltZWxpbmVDaHVua3MucHJvZ3Jlc3Moc2VnbWVudCl9XG4gICAgXG4gICAgICB2ICs9IG1peChjVHJhbnNsYXRlRnJvbSR7c2VnbWVudC5rZXl9LCBjVHJhbnNsYXRlVG8ke3NlZ21lbnQua2V5fSwgcHJvZ3Jlc3MpO1xuICAgIH1cbiAgICBgO1xuICB9LFxuICBkZWZhdWx0RnJvbTogbmV3IFZlY3RvcjMoMCwgMCwgMClcbn07XG5cblRpbWVsaW5lLnJlZ2lzdGVyKCd0cmFuc2xhdGUnLCBUcmFuc2xhdGlvblNlZ21lbnQpO1xuXG5leHBvcnQgeyBUcmFuc2xhdGlvblNlZ21lbnQgfTtcbiIsImltcG9ydCB7IFRpbWVsaW5lIH0gZnJvbSAnLi9UaW1lbGluZSc7XG5pbXBvcnQgeyBUaW1lbGluZUNodW5rcyB9IGZyb20gJy4vVGltZWxpbmVDaHVua3MnO1xuaW1wb3J0IHsgVmVjdG9yMyB9IGZyb20gJ3RocmVlJztcblxuY29uc3QgU2NhbGVTZWdtZW50ID0ge1xuICBjb21waWxlcjogZnVuY3Rpb24oc2VnbWVudCkge1xuICAgIGNvbnN0IG9yaWdpbiA9IHNlZ21lbnQudHJhbnNpdGlvbi5vcmlnaW47XG4gICAgXG4gICAgcmV0dXJuIGBcbiAgICAke1RpbWVsaW5lQ2h1bmtzLmRlbGF5RHVyYXRpb24oc2VnbWVudCl9XG4gICAgJHtUaW1lbGluZUNodW5rcy52ZWMzKGBjU2NhbGVGcm9tJHtzZWdtZW50LmtleX1gLCBzZWdtZW50LnRyYW5zaXRpb24uZnJvbSwgMil9XG4gICAgJHtUaW1lbGluZUNodW5rcy52ZWMzKGBjU2NhbGVUbyR7c2VnbWVudC5rZXl9YCwgc2VnbWVudC50cmFuc2l0aW9uLnRvLCAyKX1cbiAgICAke29yaWdpbiA/IFRpbWVsaW5lQ2h1bmtzLnZlYzMoYGNPcmlnaW4ke3NlZ21lbnQua2V5fWAsIG9yaWdpbiwgMikgOiAnJ31cbiAgICBcbiAgICB2b2lkIGFwcGx5VHJhbnNmb3JtJHtzZWdtZW50LmtleX0oZmxvYXQgdGltZSwgaW5vdXQgdmVjMyB2KSB7XG4gICAgXG4gICAgICAke1RpbWVsaW5lQ2h1bmtzLnJlbmRlckNoZWNrKHNlZ21lbnQpfVxuICAgICAgJHtUaW1lbGluZUNodW5rcy5wcm9ncmVzcyhzZWdtZW50KX1cbiAgICBcbiAgICAgICR7b3JpZ2luID8gYHYgLT0gY09yaWdpbiR7c2VnbWVudC5rZXl9O2AgOiAnJ31cbiAgICAgIHYgKj0gbWl4KGNTY2FsZUZyb20ke3NlZ21lbnQua2V5fSwgY1NjYWxlVG8ke3NlZ21lbnQua2V5fSwgcHJvZ3Jlc3MpO1xuICAgICAgJHtvcmlnaW4gPyBgdiArPSBjT3JpZ2luJHtzZWdtZW50LmtleX07YCA6ICcnfVxuICAgIH1cbiAgICBgO1xuICB9LFxuICBkZWZhdWx0RnJvbTogbmV3IFZlY3RvcjMoMSwgMSwgMSlcbn07XG5cblRpbWVsaW5lLnJlZ2lzdGVyKCdzY2FsZScsIFNjYWxlU2VnbWVudCk7XG5cbmV4cG9ydCB7IFNjYWxlU2VnbWVudCB9O1xuIiwiaW1wb3J0IHsgVGltZWxpbmUgfSBmcm9tICcuL1RpbWVsaW5lJztcbmltcG9ydCB7IFRpbWVsaW5lQ2h1bmtzIH0gZnJvbSAnLi9UaW1lbGluZUNodW5rcyc7XG5pbXBvcnQgeyBWZWN0b3IzLCBWZWN0b3I0IH0gZnJvbSAndGhyZWUnO1xuXG5jb25zdCBSb3RhdGlvblNlZ21lbnQgPSB7XG4gIGNvbXBpbGVyKHNlZ21lbnQpIHtcbiAgICBjb25zdCBmcm9tQXhpc0FuZ2xlID0gbmV3IFZlY3RvcjQoXG4gICAgICBzZWdtZW50LnRyYW5zaXRpb24uZnJvbS5heGlzLngsXG4gICAgICBzZWdtZW50LnRyYW5zaXRpb24uZnJvbS5heGlzLnksXG4gICAgICBzZWdtZW50LnRyYW5zaXRpb24uZnJvbS5heGlzLnosXG4gICAgICBzZWdtZW50LnRyYW5zaXRpb24uZnJvbS5hbmdsZVxuICAgICk7XG4gIFxuICAgIGNvbnN0IHRvQXhpcyA9IHNlZ21lbnQudHJhbnNpdGlvbi50by5heGlzIHx8IHNlZ21lbnQudHJhbnNpdGlvbi5mcm9tLmF4aXM7XG4gICAgY29uc3QgdG9BeGlzQW5nbGUgPSBuZXcgVmVjdG9yNChcbiAgICAgIHRvQXhpcy54LFxuICAgICAgdG9BeGlzLnksXG4gICAgICB0b0F4aXMueixcbiAgICAgIHNlZ21lbnQudHJhbnNpdGlvbi50by5hbmdsZVxuICAgICk7XG4gIFxuICAgIGNvbnN0IG9yaWdpbiA9IHNlZ21lbnQudHJhbnNpdGlvbi5vcmlnaW47XG4gICAgXG4gICAgcmV0dXJuIGBcbiAgICAke1RpbWVsaW5lQ2h1bmtzLmRlbGF5RHVyYXRpb24oc2VnbWVudCl9XG4gICAgJHtUaW1lbGluZUNodW5rcy52ZWM0KGBjUm90YXRpb25Gcm9tJHtzZWdtZW50LmtleX1gLCBmcm9tQXhpc0FuZ2xlLCA4KX1cbiAgICAke1RpbWVsaW5lQ2h1bmtzLnZlYzQoYGNSb3RhdGlvblRvJHtzZWdtZW50LmtleX1gLCB0b0F4aXNBbmdsZSwgOCl9XG4gICAgJHtvcmlnaW4gPyBUaW1lbGluZUNodW5rcy52ZWMzKGBjT3JpZ2luJHtzZWdtZW50LmtleX1gLCBvcmlnaW4sIDIpIDogJyd9XG4gICAgXG4gICAgdm9pZCBhcHBseVRyYW5zZm9ybSR7c2VnbWVudC5rZXl9KGZsb2F0IHRpbWUsIGlub3V0IHZlYzMgdikge1xuICAgICAgJHtUaW1lbGluZUNodW5rcy5yZW5kZXJDaGVjayhzZWdtZW50KX1cbiAgICAgICR7VGltZWxpbmVDaHVua3MucHJvZ3Jlc3Moc2VnbWVudCl9XG5cbiAgICAgICR7b3JpZ2luID8gYHYgLT0gY09yaWdpbiR7c2VnbWVudC5rZXl9O2AgOiAnJ31cbiAgICAgIHZlYzMgYXhpcyA9IG5vcm1hbGl6ZShtaXgoY1JvdGF0aW9uRnJvbSR7c2VnbWVudC5rZXl9Lnh5eiwgY1JvdGF0aW9uVG8ke3NlZ21lbnQua2V5fS54eXosIHByb2dyZXNzKSk7XG4gICAgICBmbG9hdCBhbmdsZSA9IG1peChjUm90YXRpb25Gcm9tJHtzZWdtZW50LmtleX0udywgY1JvdGF0aW9uVG8ke3NlZ21lbnQua2V5fS53LCBwcm9ncmVzcyk7XG4gICAgICB2ZWM0IHEgPSBxdWF0RnJvbUF4aXNBbmdsZShheGlzLCBhbmdsZSk7XG4gICAgICB2ID0gcm90YXRlVmVjdG9yKHEsIHYpO1xuICAgICAgJHtvcmlnaW4gPyBgdiArPSBjT3JpZ2luJHtzZWdtZW50LmtleX07YCA6ICcnfVxuICAgIH1cbiAgICBgO1xuICB9LFxuICBkZWZhdWx0RnJvbToge2F4aXM6IG5ldyBWZWN0b3IzKCksIGFuZ2xlOiAwfVxufTtcblxuVGltZWxpbmUucmVnaXN0ZXIoJ3JvdGF0ZScsIFJvdGF0aW9uU2VnbWVudCk7XG5cbmV4cG9ydCB7IFJvdGF0aW9uU2VnbWVudCB9O1xuIl0sIm5hbWVzIjpbInRNYXRoIl0sIm1hcHBpbmdzIjoiOztBQUtBLE1BQU0scUJBQXFCLFNBQVMsY0FBYyxDQUFD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SUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ3JCLE1BQU0sSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ3JCLEtBQUs7QUFDTDtBQUNBLElBQUksUUFBUSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7QUFDakMsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEVBQUUsZUFBZSxFQUFFLFNBQVMsUUFBUSxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUU7QUFDL0MsSUFBSSxJQUFJLENBQUMsR0FBRyxRQUFRLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN0QyxJQUFJLElBQUksQ0FBQyxHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3RDLElBQUksSUFBSSxDQUFDLEdBQUcsUUFBUSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDdEM7QUFDQSxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxPQUFPLEVBQUUsQ0FBQztBQUMzQjtBQUNBLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNoQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDaEMsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ2hDO0FBQ0EsSUFBSSxPQUFPLENBQUMsQ0FBQztBQUNiLEdBQUc7QUFDSDtBQUNB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QUFXLEdBQUcsSUFBSSxXQUFXLENBQUMsSUFBSSxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUMsQ0FBQztBQUM1RDtBQUNBLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLGVBQWUsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN2RDtBQUNBLElBQUksS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDLEVBQUUsRUFBRSxNQUFNLElBQUksQ0FBQyxFQUFFO0FBQ3RFLE1BQU0sTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDL0M7QUFDQSxNQUFNLFdBQVcsQ0FBQyxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDO0FBQ3ZDLE1BQU0sV0FBVyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDO0FBQ3ZDLE1BQU0sV0FBVyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDO0FBQ3ZDLEtBQUs7QUFDTCxHQUFHO0FBQ0g7QUFDQSxFQUFFLGVBQWUsQ0FBQyxDQUFDLGFBQWEsRUFBRTtBQUNsQyxJQUFJLE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztBQUNyRSxJQUFJLElBQUksQ0FBQyxFQUFFLE1BQU0sQ0FBQztBQUNsQjtBQUNBLElBQUksSUFBSSxhQUFhLEtBQUssSUFBSSxFQUFFO0FBQ2hDLE1BQU0sS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUMsRUFBRSxFQUFFO0FBQzNDLFFBQVEsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDakQsUUFBUSxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQzlHO0FBQ0EsUUFBUSxNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDdEQsUUFBUSxNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDdEQsUUFBUSxNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDdEQ7QUFDQSxRQUFRLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQztBQUMxRCxRQUFRLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUM7QUFDMUQsUUFBUSxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDO0FBQzFEO0FBQ0EsUUFBUSxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUM7QUFDMUQsUUFBUSxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDO0FBQzFELFFBQVEsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQztBQUMxRDtBQUNBLFFBQVEsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDO0FBQzFELFFBQVEsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQztBQUMxRCxRQUFRLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUM7QUFDMUQsT0FBTztBQUNQLEtBQUs7QUFDTCxTQUFTO0FBQ1QsTUFBTSxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDLEVBQUUsRUFBRSxNQUFNLElBQUksQ0FBQyxFQUFFO0FBQ3RFLFFBQVEsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDdEQ7QUFDQSxRQUFRLGNBQWMsQ0FBQyxNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDO0FBQzlDLFFBQVEsY0FBYyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDO0FBQzlDLFFBQVEsY0FBYyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDO0FBQzlDLE9BQU87QUFDUCxLQUFLO0FBQ0wsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsRUFBRSxTQUFTLENBQUMsR0FBRztBQUNmLElBQUksTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO0FBQ3pEO0FBQ0EsSUFBSSxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDLEVBQUUsRUFBRTtBQUM3QztBQUNBLE1BQU0sTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDL0MsTUFBTSxJQUFJLEVBQUUsQ0FBQztBQUNiO0FBQ0EsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDckQsTUFBTSxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQ3RDLE1BQU0sUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDdEM7QUFDQSxNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNyRCxNQUFNLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDdEMsTUFBTSxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztBQUN0QztBQUNBLE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxD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
