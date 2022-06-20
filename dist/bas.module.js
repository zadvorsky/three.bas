import { ShaderMaterial, UniformsUtils, ShaderLib, RGBADepthPacking, BufferGeometry, BufferAttribute, InstancedBufferGeometry, InstancedBufferAttribute, Vector3, MathUtils, Vector4 } from 'three';

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

    v.x = MathUtils.randFloat(box.min.x, box.max.x);
    v.y = MathUtils.randFloat(box.min.y, box.max.y);
    v.z = MathUtils.randFloat(box.min.z, box.max.z);

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

    v.x = MathUtils.randFloatSpread(2.0);
    v.y = MathUtils.randFloatSpread(2.0);
    v.z = MathUtils.randFloatSpread(2.0);
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
