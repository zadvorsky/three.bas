(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('three')) :
	typeof define === 'function' && define.amd ? define(['exports', 'three'], factory) :
	(global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.BAS = {}, global.THREE));
}(this, (function (exports, three) { 'use strict';

	class BaseAnimationMaterial extends three.ShaderMaterial {
	  constructor(parameters, uniforms) {
	    super();

	    if (parameters.uniformValues) {
	      console.warn('THREE.BAS - `uniformValues` is deprecated. Put their values directly into the parameters.');
	      Object.keys(parameters.uniformValues).forEach(key => {
	        parameters[key] = parameters.uniformValues[key];
	      });
	      delete parameters.uniformValues;
	    } // copy parameters to (1) make use of internal #define generation
	    // and (2) prevent 'x is not a property of this material' warnings.


	    Object.keys(parameters).forEach(key => {
	      this[key] = parameters[key];
	    }); // override default parameter values

	    this.setValues(parameters); // override uniforms

	    this.uniforms = three.UniformsUtils.merge([uniforms, parameters.uniforms || {}]); // set uniform values from parameters that affect uniforms

	    this.setUniformValues(parameters);
	  }

	  setUniformValues(values) {
	    if (!values) return;
	    const keys = Object.keys(values);
	    keys.forEach(key => {
	      key in this.uniforms && (this.uniforms[key].value = values[key]);
	    });
	  }

	  stringifyChunk(name) {
	    let value;

	    if (!this[name]) {
	      value = '';
	    } else if (typeof this[name] === 'string') {
	      value = this[name];
	    } else {
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
	  constructor(parameters) {
	    super(parameters, three.ShaderLib['basic'].uniforms);
	    this.lights = false;
	    this.vertexShader = this.concatVertexShader();
	    this.fragmentShader = this.concatFragmentShader();
	  }

	  concatVertexShader() {
	    return three.ShaderLib.basic.vertexShader.replace('void main() {', `
        ${this.stringifyChunk('vertexParameters')}
        ${this.stringifyChunk('varyingParameters')}
        ${this.stringifyChunk('vertexFunctions')}

        void main() {
          ${this.stringifyChunk('vertexInit')}
        `).replace('#include <beginnormal_vertex>', `
        #include <beginnormal_vertex>
        ${this.stringifyChunk('vertexNormal')}
        `).replace('#include <begin_vertex>', `
        #include <begin_vertex>
        ${this.stringifyChunk('vertexPosition')}
        ${this.stringifyChunk('vertexColor')}
        `).replace('#include <morphtarget_vertex>', `
        #include <morphtarget_vertex>
        ${this.stringifyChunk('vertexPostMorph')}
        `).replace('#include <skinning_vertex>', `
        #include <skinning_vertex>
        ${this.stringifyChunk('vertexPostSkinning')}
        `);
	  }

	  concatFragmentShader() {
	    return three.ShaderLib.basic.fragmentShader.replace('void main() {', `
        ${this.stringifyChunk('fragmentParameters')}
        ${this.stringifyChunk('varyingParameters')}
        ${this.stringifyChunk('fragmentFunctions')}

        void main() {
          ${this.stringifyChunk('fragmentInit')}
        `).replace('#include <map_fragment>', `
        ${this.stringifyChunk('fragmentDiffuse')}
        ${this.stringifyChunk('fragmentMap') || '#include <map_fragment>'}

        `);
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
	  constructor(parameters) {
	    super(parameters, three.ShaderLib['lambert'].uniforms);
	    this.lights = true;
	    this.vertexShader = this.concatVertexShader();
	    this.fragmentShader = this.concatFragmentShader();
	  }

	  concatVertexShader() {
	    return three.ShaderLib.lambert.vertexShader.replace('void main() {', `
        ${this.stringifyChunk('vertexParameters')}
        ${this.stringifyChunk('varyingParameters')}
        ${this.stringifyChunk('vertexFunctions')}

        void main() {
          ${this.stringifyChunk('vertexInit')}
        `).replace('#include <beginnormal_vertex>', `
        #include <beginnormal_vertex>

        ${this.stringifyChunk('vertexNormal')}
        `).replace('#include <begin_vertex>', `
        #include <begin_vertex>

        ${this.stringifyChunk('vertexPosition')}
        ${this.stringifyChunk('vertexColor')}
        `).replace('#include <morphtarget_vertex>', `
        #include <morphtarget_vertex>

        ${this.stringifyChunk('vertexPostMorph')}
        `).replace('#include <skinning_vertex>', `
        #include <skinning_vertex>

        ${this.stringifyChunk('vertexPostSkinning')}
        `);
	  }

	  concatFragmentShader() {
	    return three.ShaderLib.lambert.fragmentShader.replace('void main() {', `
        ${this.stringifyChunk('fragmentParameters')}
        ${this.stringifyChunk('varyingParameters')}
        ${this.stringifyChunk('fragmentFunctions')}

        void main() {
          ${this.stringifyChunk('fragmentInit')}
        `).replace('#include <map_fragment>', `
        ${this.stringifyChunk('fragmentDiffuse')}
        ${this.stringifyChunk('fragmentMap') || '#include <map_fragment>'}

        `).replace('#include <emissivemap_fragment>', `
        ${this.stringifyChunk('fragmentEmissive')}

        #include <emissivemap_fragment>
        `);
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
	  constructor(parameters) {
	    super(parameters, three.ShaderLib['phong'].uniforms);
	    this.lights = true;
	    this.vertexShader = this.concatVertexShader();
	    this.fragmentShader = this.concatFragmentShader();
	  }

	  concatVertexShader() {
	    return three.ShaderLib.phong.vertexShader.replace('void main() {', `
        ${this.stringifyChunk('vertexParameters')}
        ${this.stringifyChunk('varyingParameters')}
        ${this.stringifyChunk('vertexFunctions')}

        void main() {
          ${this.stringifyChunk('vertexInit')}
        `).replace('#include <beginnormal_vertex>', `
        #include <beginnormal_vertex>

        ${this.stringifyChunk('vertexNormal')}
        `).replace('#include <begin_vertex>', `
        #include <begin_vertex>

        ${this.stringifyChunk('vertexPosition')}
        ${this.stringifyChunk('vertexColor')}
        `).replace('#include <morphtarget_vertex>', `
        #include <morphtarget_vertex>

        ${this.stringifyChunk('vertexPostMorph')}
        `).replace('#include <skinning_vertex>', `
        #include <skinning_vertex>

        ${this.stringifyChunk('vertexPostSkinning')}
        `);
	  }

	  concatFragmentShader() {
	    return three.ShaderLib.phong.fragmentShader.replace('void main() {', `
        ${this.stringifyChunk('fragmentParameters')}
        ${this.stringifyChunk('varyingParameters')}
        ${this.stringifyChunk('fragmentFunctions')}

        void main() {
          ${this.stringifyChunk('fragmentInit')}
        `).replace('#include <map_fragment>', `
        ${this.stringifyChunk('fragmentDiffuse')}
        ${this.stringifyChunk('fragmentMap') || '#include <map_fragment>'}

        `).replace('#include <emissivemap_fragment>', `
        ${this.stringifyChunk('fragmentEmissive')}

        #include <emissivemap_fragment>
        `).replace('#include <lights_phong_fragment>', `
        #include <lights_phong_fragment>
        ${this.stringifyChunk('fragmentSpecular')}
        `);
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
	  constructor(parameters) {
	    super(parameters, three.ShaderLib['physical'].uniforms);
	    this.lights = true;
	    this.extensions = this.extensions || {};
	    this.extensions.derivatives = true;
	    this.vertexShader = this.concatVertexShader();
	    this.fragmentShader = this.concatFragmentShader();
	  }

	  concatVertexShader() {
	    return three.ShaderLib.standard.vertexShader.replace('void main() {', `
        ${this.stringifyChunk('vertexParameters')}
        ${this.stringifyChunk('varyingParameters')}
        ${this.stringifyChunk('vertexFunctions')}

        void main() {
          ${this.stringifyChunk('vertexInit')}
        `).replace('#include <beginnormal_vertex>', `
        #include <beginnormal_vertex>

        ${this.stringifyChunk('vertexNormal')}
        `).replace('#include <begin_vertex>', `
        #include <begin_vertex>

        ${this.stringifyChunk('vertexPosition')}
        ${this.stringifyChunk('vertexColor')}
        `).replace('#include <morphtarget_vertex>', `
        #include <morphtarget_vertex>

        ${this.stringifyChunk('vertexPostMorph')}
        `).replace('#include <skinning_vertex>', `
        #include <skinning_vertex>

        ${this.stringifyChunk('vertexPostSkinning')}
        `);
	  }

	  concatFragmentShader() {
	    return three.ShaderLib.standard.fragmentShader.replace('void main() {', `
        ${this.stringifyChunk('fragmentParameters')}
        ${this.stringifyChunk('varyingParameters')}
        ${this.stringifyChunk('fragmentFunctions')}

        void main() {
          ${this.stringifyChunk('fragmentInit')}
        `).replace('#include <map_fragment>', `
        ${this.stringifyChunk('fragmentDiffuse')}
        ${this.stringifyChunk('fragmentMap') || '#include <map_fragment>'}

        `).replace('#include <emissivemap_fragment>', `
        ${this.stringifyChunk('fragmentEmissive')}

        #include <emissivemap_fragment>
        `).replace('#include <roughnessmap_fragment>', `
        float roughnessFactor = roughness;
        ${this.stringifyChunk('fragmentRoughness')}
        #ifdef USE_ROUGHNESSMAP

        vec4 texelRoughness = texture2D( roughnessMap, vUv );
          roughnessFactor *= texelRoughness.g;
        #endif
        `).replace('#include <metalnessmap_fragment>', `
        float metalnessFactor = metalness;
        ${this.stringifyChunk('fragmentMetalness')}

        #ifdef USE_METALNESSMAP
          vec4 texelMetalness = texture2D( metalnessMap, vUv );
          metalnessFactor *= texelMetalness.b;
        #endif
        `);
	  }

	}

	class ToonAnimationMaterial extends BaseAnimationMaterial {
	  /**
	   * Extends THREE.MeshToonMaterial with custom shader chunks.
	   *
	   * @param {Object} parameters Object containing material properties and custom shader chunks.
	   */
	  constructor(parameters) {
	    super(parameters, three.ShaderLib['toon'].uniforms);
	    this.lights = true;
	    this.vertexShader = this.concatVertexShader();
	    this.fragmentShader = this.concatFragmentShader();
	  }

	  concatVertexShader() {
	    return three.ShaderLib.toon.vertexShader.replace('void main() {', `
        ${this.stringifyChunk('vertexParameters')}
        ${this.stringifyChunk('varyingParameters')}
        ${this.stringifyChunk('vertexFunctions')}

        void main() {
          ${this.stringifyChunk('vertexInit')}
        `).replace('#include <beginnormal_vertex>', `
        #include <beginnormal_vertex>

        ${this.stringifyChunk('vertexNormal')}
        `).replace('#include <begin_vertex>', `
        #include <begin_vertex>

        ${this.stringifyChunk('vertexPosition')}
        ${this.stringifyChunk('vertexColor')}
        `).replace('#include <morphtarget_vertex>', `
        #include <morphtarget_vertex>

        ${this.stringifyChunk('vertexPostMorph')}
        `).replace('#include <skinning_vertex>', `
        #include <skinning_vertex>

        ${this.stringifyChunk('vertexPostSkinning')}
        `);
	  }

	  concatFragmentShader() {
	    return three.ShaderLib.toon.fragmentShader.replace('void main() {', `
        ${this.stringifyChunk('fragmentParameters')}
        ${this.stringifyChunk('varyingParameters')}
        ${this.stringifyChunk('fragmentFunctions')}

        void main() {
          ${this.stringifyChunk('fragmentInit')}
        `).replace('#include <map_fragment>', `
        ${this.stringifyChunk('fragmentDiffuse')}
        ${this.stringifyChunk('fragmentMap') || '#include <map_fragment>'}

        `).replace('#include <emissivemap_fragment>', `
        ${this.stringifyChunk('fragmentEmissive')}

        #include <emissivemap_fragment>
        `);
	  }

	}

	class PointsAnimationMaterial extends BaseAnimationMaterial {
	  /**
	   * Extends THREE.PointsMaterial with custom shader chunks.
	   *
	   * @param {Object} parameters Object containing material properties and custom shader chunks.
	   * @constructor
	   */
	  constructor(parameters) {
	    super(parameters, three.ShaderLib['points'].uniforms);
	    this.vertexShader = this.concatVertexShader();
	    this.fragmentShader = this.concatFragmentShader();
	  }

	  concatVertexShader() {
	    return three.ShaderLib.points.vertexShader.replace('void main() {', `
        ${this.stringifyChunk('vertexParameters')}
        ${this.stringifyChunk('varyingParameters')}
        ${this.stringifyChunk('vertexFunctions')}

        void main() {
          ${this.stringifyChunk('vertexInit')}
        `).replace('#include <begin_vertex>', `
        #include <begin_vertex>

        ${this.stringifyChunk('vertexPosition')}
        ${this.stringifyChunk('vertexColor')}
        `).replace('#include <morphtarget_vertex>', `
        #include <morphtarget_vertex>

        ${this.stringifyChunk('vertexPostMorph')}
        `);
	  }

	  concatFragmentShader() {
	    return three.ShaderLib.points.fragmentShader.replace('void main() {', `
        ${this.stringifyChunk('fragmentParameters')}
        ${this.stringifyChunk('varyingParameters')}
        ${this.stringifyChunk('fragmentFunctions')}

        void main() {
          ${this.stringifyChunk('fragmentInit')}
        `).replace('#include <map_fragment>', `
        ${this.stringifyChunk('fragmentDiffuse')}
        ${this.stringifyChunk('fragmentMap') || '#include <map_fragment>'}

        `).replace('#include <premultiplied_alpha_fragment>', `
        ${this.stringifyChunk('fragmentShape')}

        #include <premultiplied_alpha_fragment>
        `);
	  }

	}

	class DepthAnimationMaterial extends BaseAnimationMaterial {
	  constructor(parameters) {
	    super(parameters, three.ShaderLib['depth'].uniforms);
	    this.depthPacking = three.RGBADepthPacking;
	    this.clipping = true;
	    this.vertexShader = this.concatVertexShader();
	    this.fragmentShader = three.ShaderLib['depth'].fragmentShader;
	  }

	  concatVertexShader() {
	    return three.ShaderLib.depth.vertexShader.replace('void main() {', `
        ${this.stringifyChunk('vertexParameters')}
        ${this.stringifyChunk('vertexFunctions')}

        void main() {
          ${this.stringifyChunk('vertexInit')}
        `).replace('#include <begin_vertex>', `
        #include <begin_vertex>

        ${this.stringifyChunk('vertexPosition')}
        `).replace('#include <morphtarget_vertex>', `
        #include <morphtarget_vertex>

        ${this.stringifyChunk('vertexPostMorph')}
        `).replace('#include <skinning_vertex>', `
        #include <skinning_vertex>

        ${this.stringifyChunk('vertexPostSkinning')}
        `);
	  }

	}

	class DistanceAnimationMaterial extends BaseAnimationMaterial {
	  constructor(parameters) {
	    super(parameters, three.ShaderLib['distanceRGBA'].uniforms);
	    this.depthPacking = three.RGBADepthPacking;
	    this.clipping = true;
	    this.vertexShader = this.concatVertexShader();
	    this.fragmentShader = three.ShaderLib['distanceRGBA'].fragmentShader;
	  }

	  concatVertexShader() {
	    return three.ShaderLib.distanceRGBA.vertexShader.replace('void main() {', `
        ${this.stringifyChunk('vertexParameters')}
        ${this.stringifyChunk('vertexFunctions')}

        void main() {
          ${this.stringifyChunk('vertexInit')}
        `).replace('#include <begin_vertex>', `
        #include <begin_vertex>

        ${this.stringifyChunk('vertexPosition')}
        `).replace('#include <morphtarget_vertex>', `
        #include <morphtarget_vertex>

        ${this.stringifyChunk('vertexPostMorph')}
        `).replace('#include <skinning_vertex>', `
        #include <skinning_vertex>

        ${this.stringifyChunk('vertexPostSkinning')}
        `);
	  }

	}

	class PrefabBufferGeometry extends three.BufferGeometry {
	  /**
	   * A BufferGeometry where a 'prefab' geometry is repeated a number of times.
	   *
	   * @param {Geometry|BufferGeometry} prefab The Geometry instance to repeat.
	   * @param {Number} count The number of times to repeat the geometry.
	   */
	  constructor(prefab, count) {
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
	    } else {
	      this.prefabVertexCount = prefab.vertices.length;
	    }

	    this.bufferIndices();
	    this.bufferPositions();
	  }

	  bufferIndices() {
	    let prefabIndices = [];
	    let prefabIndexCount;

	    if (this.isPrefabBufferGeometry) {
	      if (this.prefabGeometry.index) {
	        prefabIndexCount = this.prefabGeometry.index.count;
	        prefabIndices = this.prefabGeometry.index.array;
	      } else {
	        prefabIndexCount = this.prefabVertexCount;

	        for (let i = 0; i < prefabIndexCount; i++) {
	          prefabIndices.push(i);
	        }
	      }
	    } else {
	      const prefabFaceCount = this.prefabGeometry.faces.length;
	      prefabIndexCount = prefabFaceCount * 3;

	      for (let i = 0; i < prefabFaceCount; i++) {
	        const face = this.prefabGeometry.faces[i];
	        prefabIndices.push(face.a, face.b, face.c);
	      }
	    }

	    const indexBuffer = new Uint32Array(this.prefabCount * prefabIndexCount);
	    this.setIndex(new three.BufferAttribute(indexBuffer, 1));

	    for (let i = 0; i < this.prefabCount; i++) {
	      for (let k = 0; k < prefabIndexCount; k++) {
	        indexBuffer[i * prefabIndexCount + k] = prefabIndices[k] + i * this.prefabVertexCount;
	      }
	    }
	  }

	  bufferPositions() {
	    const positionBuffer = this.createAttribute('position', 3).array;

	    if (this.isPrefabBufferGeometry) {
	      const positions = this.prefabGeometry.attributes.position.array;

	      for (let i = 0, offset = 0; i < this.prefabCount; i++) {
	        for (let j = 0; j < this.prefabVertexCount; j++, offset += 3) {
	          positionBuffer[offset] = positions[j * 3];
	          positionBuffer[offset + 1] = positions[j * 3 + 1];
	          positionBuffer[offset + 2] = positions[j * 3 + 2];
	        }
	      }
	    } else {
	      for (let i = 0, offset = 0; i < this.prefabCount; i++) {
	        for (let j = 0; j < this.prefabVertexCount; j++, offset += 3) {
	          const prefabVertex = this.prefabGeometry.vertices[j];
	          positionBuffer[offset] = prefabVertex.x;
	          positionBuffer[offset + 1] = prefabVertex.y;
	          positionBuffer[offset + 2] = prefabVertex.z;
	        }
	      }
	    }
	  }

	  bufferUvs() {
	    const uvBuffer = this.createAttribute('uv', 2).array;

	    if (this.isPrefabBufferGeometry) {
	      const uvs = this.prefabGeometry.attributes.uv.array;

	      for (let i = 0, offset = 0; i < this.prefabCount; i++) {
	        for (let j = 0; j < this.prefabVertexCount; j++, offset += 2) {
	          uvBuffer[offset] = uvs[j * 2];
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


	  createAttribute(name, itemSize, factory) {
	    const buffer = new Float32Array(this.prefabCount * this.prefabVertexCount * itemSize);
	    const attribute = new three.BufferAttribute(buffer, itemSize);
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


	  setPrefabData(attribute, prefabIndex, data) {
	    attribute = typeof attribute === 'string' ? this.attributes[attribute] : attribute;
	    let offset = prefabIndex * this.prefabVertexCount * attribute.itemSize;

	    for (let i = 0; i < this.prefabVertexCount; i++) {
	      for (let j = 0; j < attribute.itemSize; j++) {
	        attribute.array[offset++] = data[j];
	      }
	    }
	  }

	}

	class MultiPrefabBufferGeometry extends three.BufferGeometry {
	  /**
	   * A BufferGeometry where a 'prefab' geometry array is repeated a number of times.
	   *
	   * @param {Array} prefabs An array with Geometry instances to repeat.
	   * @param {Number} repeatCount The number of times to repeat the array of Geometries.
	   * @constructor
	   */
	  constructor(prefabs, repeatCount) {
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

	  bufferIndices() {
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

	    this.setIndex(new three.BufferAttribute(indexBuffer, 1));
	  }

	  bufferPositions() {
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


	  bufferUvs() {
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


	  createAttribute(name, itemSize, factory) {
	    const buffer = new Float32Array(this.repeatCount * this.repeatVertexCount * itemSize);
	    const attribute = new three.BufferAttribute(buffer, itemSize);
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


	  setPrefabData(attribute, prefabIndex, data) {
	    attribute = typeof attribute === 'string' ? this.attributes[attribute] : attribute;
	    const prefabGeometryIndex = prefabIndex % this.prefabGeometriesCount;
	    const prefabGeometryVertexCount = this.prefabVertexCounts[prefabGeometryIndex];
	    const whole = (prefabIndex / this.prefabGeometriesCount | 0) * this.prefabGeometriesCount;
	    const wholeOffset = whole * this.repeatVertexCount;
	    const part = prefabIndex - whole;
	    let partOffset = 0;
	    let i = 0;

	    while (i < part) {
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

	class InstancedPrefabBufferGeometry extends three.InstancedBufferGeometry {
	  /**
	   * A wrapper around THREE.InstancedBufferGeometry, which is more memory efficient than PrefabBufferGeometry, but requires the ANGLE_instanced_arrays extension.
	   *
	   * @param {BufferGeometry} prefab The Geometry instance to repeat.
	   * @param {Number} count The number of times to repeat the geometry.
	   */
	  constructor(prefab, count) {
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


	  createAttribute(name, itemSize, factory) {
	    const buffer = new Float32Array(this.prefabCount * itemSize);
	    const attribute = new three.InstancedBufferAttribute(buffer, itemSize);
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
	   * Sets data for a prefab at a given index.
	   * Usually called in a loop.
	   *
	   * @param {String|BufferAttribute} attribute The attribute or attribute name where the data is to be stored.
	   * @param {Number} prefabIndex Index of the prefab in the buffer geometry.
	   * @param {Array} data Array of data. Length should be equal to item size of the attribute.
	   */
	  setPrefabData(attribute, prefabIndex, data) {
	    attribute = typeof attribute === 'string' ? this.attributes[attribute] : attribute;
	    let offset = prefabIndex * attribute.itemSize;

	    for (let j = 0; j < attribute.itemSize; j++) {
	      attribute.array[offset++] = data[j];
	    }
	  }

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
	  computeCentroid: function (geometry, face, v) {
	    let a = geometry.vertices[face.a];
	    let b = geometry.vertices[face.b];
	    let c = geometry.vertices[face.c];
	    v = v || new three.Vector3();
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
	  randomInBox: function (box, v) {
	    v = v || new three.Vector3();
	    v.x = three.Math.randFloat(box.min.x, box.max.x);
	    v.y = three.Math.randFloat(box.min.y, box.max.y);
	    v.z = three.Math.randFloat(box.min.z, box.max.z);
	    return v;
	  },

	  /**
	   * Get a random axis for quaternion rotation.
	   *
	   * @param {THREE.Vector3=} v Option vector to store result in.
	   * @returns {THREE.Vector3}
	   */
	  randomAxis: function (v) {
	    v = v || new three.Vector3();
	    v.x = three.Math.randFloatSpread(2.0);
	    v.y = three.Math.randFloatSpread(2.0);
	    v.z = three.Math.randFloatSpread(2.0);
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
	  createDepthAnimationMaterial: function (sourceMaterial) {
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
	  createDistanceAnimationMaterial: function (sourceMaterial) {
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

	class ModelBufferGeometry extends three.BufferGeometry {
	  /**
	   * A THREE.BufferGeometry for animating individual faces of a THREE.Geometry.
	   *
	   * @param {THREE.Geometry} model The THREE.Geometry to base this geometry on.
	   * @param {Object=} options
	   * @param {Boolean=} options.computeCentroids If true, a centroids will be computed for each face and stored in THREE.BAS.ModelBufferGeometry.centroids.
	   * @param {Boolean=} options.localizeFaces If true, the positions for each face will be stored relative to the centroid. This is useful if you want to rotate or scale faces around their center.
	   */
	  constructor(model, options) {
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


	  computeCentroids() {
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

	  bufferIndices() {
	    const indexBuffer = new Uint32Array(this.faceCount * 3);
	    this.setIndex(new three.BufferAttribute(indexBuffer, 1));

	    for (let i = 0, offset = 0; i < this.faceCount; i++, offset += 3) {
	      const face = this.modelGeometry.faces[i];
	      indexBuffer[offset] = face.a;
	      indexBuffer[offset + 1] = face.b;
	      indexBuffer[offset + 2] = face.c;
	    }
	  }

	  bufferPositions(localizeFaces) {
	    const positionBuffer = this.createAttribute('position', 3).array;
	    let i, offset;

	    if (localizeFaces === true) {
	      for (i = 0; i < this.faceCount; i++) {
	        const face = this.modelGeometry.faces[i];
	        const centroid = this.centroids ? this.centroids[i] : Utils.computeCentroid(this.modelGeometry, face);
	        const a = this.modelGeometry.vertices[face.a];
	        const b = this.modelGeometry.vertices[face.b];
	        const c = this.modelGeometry.vertices[face.c];
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
	        const vertex = this.modelGeometry.vertices[i];
	        positionBuffer[offset] = vertex.x;
	        positionBuffer[offset + 1] = vertex.y;
	        positionBuffer[offset + 2] = vertex.z;
	      }
	    }
	  }
	  /**
	   * Creates a THREE.BufferAttribute with UV coordinates.
	   */


	  bufferUvs() {
	    const uvBuffer = this.createAttribute('uv', 2).array;

	    for (let i = 0; i < this.faceCount; i++) {
	      const face = this.modelGeometry.faces[i];
	      let uv;
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
	  }
	  /**
	   * Creates two THREE.BufferAttributes: skinIndex and skinWeight. Both are required for skinning.
	   */


	  bufferSkinning() {
	    const skinIndexBuffer = this.createAttribute('skinIndex', 4).array;
	    const skinWeightBuffer = this.createAttribute('skinWeight', 4).array;

	    for (let i = 0; i < this.vertexCount; i++) {
	      const skinIndex = this.modelGeometry.skinIndices[i];
	      const skinWeight = this.modelGeometry.skinWeights[i];
	      skinIndexBuffer[i * 4] = skinIndex.x;
	      skinIndexBuffer[i * 4 + 1] = skinIndex.y;
	      skinIndexBuffer[i * 4 + 2] = skinIndex.z;
	      skinIndexBuffer[i * 4 + 3] = skinIndex.w;
	      skinWeightBuffer[i * 4] = skinWeight.x;
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


	  createAttribute(name, itemSize, factory) {
	    const buffer = new Float32Array(this.vertexCount * itemSize);
	    const attribute = new three.BufferAttribute(buffer, itemSize);
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


	  setFaceData(attribute, faceIndex, data) {
	    attribute = typeof attribute === 'string' ? this.attributes[attribute] : attribute;
	    let offset = faceIndex * 3 * attribute.itemSize;

	    for (let i = 0; i < 3; i++) {
	      for (let j = 0; j < attribute.itemSize; j++) {
	        attribute.array[offset++] = data[j];
	      }
	    }
	  }

	}

	class PointBufferGeometry extends three.BufferGeometry {
	  /**
	   * A THREE.BufferGeometry consists of points.
	   * @param {Number} count The number of points.
	   * @constructor
	   */
	  constructor(count) {
	    super();
	    /**
	     * Number of points.
	     * @type {Number}
	     */

	    this.pointCount = count;
	    this.bufferPositions();
	  }

	  bufferPositions() {
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


	  createAttribute(name, itemSize, factory) {
	    const buffer = new Float32Array(this.pointCount * itemSize);
	    const attribute = new three.BufferAttribute(buffer, itemSize);
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

	  setPointData(attribute, pointIndex, data) {
	    attribute = typeof attribute === 'string' ? this.attributes[attribute] : attribute;
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
	  get: function () {
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
	} // static definitions map


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
	  const _eval = eval;
	  let start = this.duration;

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

	  let keys = Object.keys(transitions),
	      key;

	  for (let i = 0; i < keys.length; i++) {
	    key = keys[i];
	    this.processTransition(key, transitions[key], start, duration);
	  }
	};

	Timeline.prototype.processTransition = function (key, transition, start, duration) {
	  const definition = Timeline.segmentDefinitions[key];
	  let segments = this.segments[key];
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
	  const c = [];
	  const keys = Object.keys(this.segments);
	  let segments;

	  for (let i = 0; i < keys.length; i++) {
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
	  let s0, s1;

	  for (let i = 0; i < segments.length - 1; i++) {
	    s0 = segments[i];
	    s1 = segments[i + 1];
	    s0.trail = s1.start - s0.end;
	  } // pad last segment until end of timeline


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
	  let t = this.timeKey;
	  return this.segments[key] ? this.segments[key].map(function (s) {
	    return `applyTransform${s.key}(${t}, transformed);`;
	  }).join('\n') : '';
	};

	const TimelineChunks = {
	  vec3: function (n, v, p) {
	    const x = (v.x || 0).toPrecision(p);
	    const y = (v.y || 0).toPrecision(p);
	    const z = (v.z || 0).toPrecision(p);
	    return `vec3 ${n} = vec3(${x}, ${y}, ${z});`;
	  },
	  vec4: function (n, v, p) {
	    const x = (v.x || 0).toPrecision(p);
	    const y = (v.y || 0).toPrecision(p);
	    const z = (v.z || 0).toPrecision(p);
	    const w = (v.w || 0).toPrecision(p);
	    return `vec4 ${n} = vec4(${x}, ${y}, ${z}, ${w});`;
	  },
	  delayDuration: function (segment) {
	    return `
    float cDelay${segment.key} = ${segment.start.toPrecision(4)};
    float cDuration${segment.key} = ${segment.duration.toPrecision(4)};
    `;
	  },
	  progress: function (segment) {
	    // zero duration segments should always render complete
	    if (segment.duration === 0) {
	      return `float progress = 1.0;`;
	    } else {
	      return `
      float progress = clamp(time - cDelay${segment.key}, 0.0, cDuration${segment.key}) / cDuration${segment.key};
      ${segment.transition.ease ? `progress = ${segment.transition.ease}(progress${segment.transition.easeParams ? `, ${segment.transition.easeParams.map(v => v.toPrecision(4)).join(`, `)}` : ``});` : ``}
      `;
	    }
	  },
	  renderCheck: function (segment) {
	    const startTime = segment.start.toPrecision(4);
	    const endTime = (segment.end + segment.trail).toPrecision(4);
	    return `if (time < ${startTime} || time > ${endTime}) return;`;
	  }
	};

	const TranslationSegment = {
	  compiler: function (segment) {
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
	  defaultFrom: new three.Vector3(0, 0, 0)
	};
	Timeline.register('translate', TranslationSegment);

	const ScaleSegment = {
	  compiler: function (segment) {
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
	  defaultFrom: new three.Vector3(1, 1, 1)
	};
	Timeline.register('scale', ScaleSegment);

	const RotationSegment = {
	  compiler(segment) {
	    const fromAxisAngle = new three.Vector4(segment.transition.from.axis.x, segment.transition.from.axis.y, segment.transition.from.axis.z, segment.transition.from.angle);
	    const toAxis = segment.transition.to.axis || segment.transition.from.axis;
	    const toAxisAngle = new three.Vector4(toAxis.x, toAxis.y, toAxis.z, segment.transition.to.angle);
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

	  defaultFrom: {
	    axis: new three.Vector3(),
	    angle: 0
	  }
	};
	Timeline.register('rotate', RotationSegment);

	exports.BaseAnimationMaterial = BaseAnimationMaterial;
	exports.BasicAnimationMaterial = BasicAnimationMaterial;
	exports.DepthAnimationMaterial = DepthAnimationMaterial;
	exports.DistanceAnimationMaterial = DistanceAnimationMaterial;
	exports.InstancedPrefabBufferGeometry = InstancedPrefabBufferGeometry;
	exports.LambertAnimationMaterial = LambertAnimationMaterial;
	exports.ModelBufferGeometry = ModelBufferGeometry;
	exports.MultiPrefabBufferGeometry = MultiPrefabBufferGeometry;
	exports.PhongAnimationMaterial = PhongAnimationMaterial;
	exports.PointBufferGeometry = PointBufferGeometry;
	exports.PointsAnimationMaterial = PointsAnimationMaterial;
	exports.PrefabBufferGeometry = PrefabBufferGeometry;
	exports.RotationSegment = RotationSegment;
	exports.ScaleSegment = ScaleSegment;
	exports.ShaderChunk = ShaderChunk;
	exports.StandardAnimationMaterial = StandardAnimationMaterial;
	exports.Timeline = Timeline;
	exports.TimelineChunks = TimelineChunks;
	exports.TimelineSegment = TimelineSegment;
	exports.ToonAnimationMaterial = ToonAnimationMaterial;
	exports.TranslationSegment = TranslationSegment;
	exports.Utils = Utils;

	Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzLmpzIiwic291cmNlcyI6WyIuLi9zcmMvbWF0ZXJpYWxzL0Jhc2VBbmltYXRpb25NYXRlcmlhbC5qcyIsIi4uL3NyYy9tYXRlcmlhbHMvQmFzaWNBbmltYXRpb25NYXRlcmlhbC5qcyIsIi4uL3NyYy9tYXRlcmlhbHMvTGFtYmVydEFuaW1hdGlvbk1hdGVyaWFsLmpzIiwiLi4vc3JjL21hdGVyaWFscy9QaG9uZ0FuaW1hdGlvbk1hdGVyaWFsLmpzIiwiLi4vc3JjL21hdGVyaWFscy9TdGFuZGFyZEFuaW1hdGlvbk1hdGVyaWFsLmpzIiwiLi4vc3JjL21hdGVyaWFscy9Ub29uQW5pbWF0aW9uTWF0ZXJpYWwuanMiLCIuLi9zcmMvbWF0ZXJpYWxzL1BvaW50c0FuaW1hdGlvbk1hdGVyaWFsLmpzIiwiLi4vc3JjL21hdGVyaWFscy9EZXB0aEFuaW1hdGlvbk1hdGVyaWFsLmpzIiwiLi4vc3JjL21hdGVyaWFscy9EaXN0YW5jZUFuaW1hdGlvbk1hdGVyaWFsLmpzIiwiLi4vc3JjL2dlb21ldHJ5L1ByZWZhYkJ1ZmZlckdlb21ldHJ5LmpzIiwiLi4vc3JjL2dlb21ldHJ5L011bHRpUHJlZmFiQnVmZmVyR2VvbWV0cnkuanMiLCIuLi9zcmMvZ2VvbWV0cnkvSW5zdGFuY2VkUHJlZmFiQnVmZmVyR2VvbWV0cnkuanMiLCIuLi9zcmMvVXRpbHMuanMiLCIuLi9zcmMvZ2VvbWV0cnkvTW9kZWxCdWZmZXJHZW9tZXRyeS5qcyIsIi4uL3NyYy9nZW9tZXRyeS9Qb2ludEJ1ZmZlckdlb21ldHJ5LmpzIiwiLi4vc3JjL1NoYWRlckNodW5rLmpzIiwiLi4vc3JjL3RpbWVsaW5lL1RpbWVsaW5lU2VnbWVudC5qcyIsIi4uL3NyYy90aW1lbGluZS9UaW1lbGluZS5qcyIsIi4uL3NyYy90aW1lbGluZS9UaW1lbGluZUNodW5rcy5qcyIsIi4uL3NyYy90aW1lbGluZS9UcmFuc2xhdGlvblNlZ21lbnQuanMiLCIuLi9zcmMvdGltZWxpbmUvU2NhbGVTZWdtZW50LmpzIiwiLi4vc3JjL3RpbWVsaW5lL1JvdGF0aW9uU2VnbWVudC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICBTaGFkZXJNYXRlcmlhbCxcbiAgVW5pZm9ybXNVdGlscyxcbn0gZnJvbSAndGhyZWUnO1xuXG5jbGFzcyBCYXNlQW5pbWF0aW9uTWF0ZXJpYWwgZXh0ZW5kcyBTaGFkZXJNYXRlcmlhbCB7XG4gIGNvbnN0cnVjdG9yIChwYXJhbWV0ZXJzLCB1bmlmb3Jtcykge1xuICAgIHN1cGVyKCk7XG5cbiAgICBpZiAocGFyYW1ldGVycy51bmlmb3JtVmFsdWVzKSB7XG4gICAgICBjb25zb2xlLndhcm4oJ1RIUkVFLkJBUyAtIGB1bmlmb3JtVmFsdWVzYCBpcyBkZXByZWNhdGVkLiBQdXQgdGhlaXIgdmFsdWVzIGRpcmVjdGx5IGludG8gdGhlIHBhcmFtZXRlcnMuJylcblxuICAgICAgT2JqZWN0LmtleXMocGFyYW1ldGVycy51bmlmb3JtVmFsdWVzKS5mb3JFYWNoKChrZXkpID0+IHtcbiAgICAgICAgcGFyYW1ldGVyc1trZXldID0gcGFyYW1ldGVycy51bmlmb3JtVmFsdWVzW2tleV1cbiAgICAgIH0pXG5cbiAgICAgIGRlbGV0ZSBwYXJhbWV0ZXJzLnVuaWZvcm1WYWx1ZXNcbiAgICB9XG5cbiAgICAvLyBjb3B5IHBhcmFtZXRlcnMgdG8gKDEpIG1ha2UgdXNlIG9mIGludGVybmFsICNkZWZpbmUgZ2VuZXJhdGlvblxuICAgIC8vIGFuZCAoMikgcHJldmVudCAneCBpcyBub3QgYSBwcm9wZXJ0eSBvZiB0aGlzIG1hdGVyaWFsJyB3YXJuaW5ncy5cbiAgICBPYmplY3Qua2V5cyhwYXJhbWV0ZXJzKS5mb3JFYWNoKChrZXkpID0+IHtcbiAgICAgIHRoaXNba2V5XSA9IHBhcmFtZXRlcnNba2V5XVxuICAgIH0pXG5cbiAgICAvLyBvdmVycmlkZSBkZWZhdWx0IHBhcmFtZXRlciB2YWx1ZXNcbiAgICB0aGlzLnNldFZhbHVlcyhwYXJhbWV0ZXJzKTtcblxuICAgIC8vIG92ZXJyaWRlIHVuaWZvcm1zXG4gICAgdGhpcy51bmlmb3JtcyA9IFVuaWZvcm1zVXRpbHMubWVyZ2UoW3VuaWZvcm1zLCBwYXJhbWV0ZXJzLnVuaWZvcm1zIHx8IHt9XSk7XG5cbiAgICAvLyBzZXQgdW5pZm9ybSB2YWx1ZXMgZnJvbSBwYXJhbWV0ZXJzIHRoYXQgYWZmZWN0IHVuaWZvcm1zXG4gICAgdGhpcy5zZXRVbmlmb3JtVmFsdWVzKHBhcmFtZXRlcnMpO1xuICB9XG5cbiAgc2V0VW5pZm9ybVZhbHVlcyAodmFsdWVzKSB7XG4gICAgaWYgKCF2YWx1ZXMpIHJldHVybjtcblxuICAgIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyh2YWx1ZXMpO1xuXG4gICAga2V5cy5mb3JFYWNoKChrZXkpID0+IHtcbiAgICAgIGtleSBpbiB0aGlzLnVuaWZvcm1zICYmICh0aGlzLnVuaWZvcm1zW2tleV0udmFsdWUgPSB2YWx1ZXNba2V5XSk7XG4gICAgfSk7XG4gIH1cblxuICBzdHJpbmdpZnlDaHVuayAobmFtZSkge1xuICAgIGxldCB2YWx1ZTtcblxuICAgIGlmICghdGhpc1tuYW1lXSkge1xuICAgICAgdmFsdWUgPSAnJztcbiAgICB9XG4gICAgZWxzZSBpZiAodHlwZW9mIHRoaXNbbmFtZV0gPT09ICAnc3RyaW5nJykge1xuICAgICAgdmFsdWUgPSB0aGlzW25hbWVdO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHZhbHVlID0gdGhpc1tuYW1lXS5qb2luKCdcXG4nKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgQmFzZUFuaW1hdGlvbk1hdGVyaWFsO1xuIiwiaW1wb3J0IHsgU2hhZGVyTGliIH0gZnJvbSAndGhyZWUnO1xuaW1wb3J0IEJhc2VBbmltYXRpb25NYXRlcmlhbCBmcm9tICcuL0Jhc2VBbmltYXRpb25NYXRlcmlhbCc7XG5cbmNsYXNzIEJhc2ljQW5pbWF0aW9uTWF0ZXJpYWwgZXh0ZW5kcyBCYXNlQW5pbWF0aW9uTWF0ZXJpYWwge1xuICAvKipcbiAgICogRXh0ZW5kcyBUSFJFRS5NZXNoQmFzaWNNYXRlcmlhbCB3aXRoIGN1c3RvbSBzaGFkZXIgY2h1bmtzLlxuICAgKlxuICAgKiBAc2VlIGh0dHA6Ly90aHJlZS1iYXMtZXhhbXBsZXMuc3VyZ2Uuc2gvZXhhbXBsZXMvbWF0ZXJpYWxzX2Jhc2ljL1xuICAgKlxuICAgKiBAcGFyYW0ge09iamVjdH0gcGFyYW1ldGVycyBPYmplY3QgY29udGFpbmluZyBtYXRlcmlhbCBwcm9wZXJ0aWVzIGFuZCBjdXN0b20gc2hhZGVyIGNodW5rcy5cbiAgICovXG4gIGNvbnN0cnVjdG9yIChwYXJhbWV0ZXJzKSB7XG4gICAgc3VwZXIocGFyYW1ldGVycywgU2hhZGVyTGliWydiYXNpYyddLnVuaWZvcm1zKTtcblxuICAgIHRoaXMubGlnaHRzID0gZmFsc2U7XG4gICAgdGhpcy52ZXJ0ZXhTaGFkZXIgPSB0aGlzLmNvbmNhdFZlcnRleFNoYWRlcigpO1xuICAgIHRoaXMuZnJhZ21lbnRTaGFkZXIgPSB0aGlzLmNvbmNhdEZyYWdtZW50U2hhZGVyKCk7XG4gIH1cblxuICBjb25jYXRWZXJ0ZXhTaGFkZXIgKCkge1xuICAgIHJldHVybiBTaGFkZXJMaWIuYmFzaWMudmVydGV4U2hhZGVyXG4gICAgICAucmVwbGFjZShcbiAgICAgICAgJ3ZvaWQgbWFpbigpIHsnLFxuICAgICAgICBgXG4gICAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UGFyYW1ldGVycycpfVxuICAgICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZhcnlpbmdQYXJhbWV0ZXJzJyl9XG4gICAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4RnVuY3Rpb25zJyl9XG5cbiAgICAgICAgdm9pZCBtYWluKCkge1xuICAgICAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4SW5pdCcpfVxuICAgICAgICBgXG4gICAgICApXG4gICAgICAucmVwbGFjZShcbiAgICAgICAgJyNpbmNsdWRlIDxiZWdpbm5vcm1hbF92ZXJ0ZXg+JyxcbiAgICAgICAgYFxuICAgICAgICAjaW5jbHVkZSA8YmVnaW5ub3JtYWxfdmVydGV4PlxuICAgICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleE5vcm1hbCcpfVxuICAgICAgICBgXG4gICAgICApXG4gICAgICAucmVwbGFjZShcbiAgICAgICAgJyNpbmNsdWRlIDxiZWdpbl92ZXJ0ZXg+JyxcbiAgICAgICAgYFxuICAgICAgICAjaW5jbHVkZSA8YmVnaW5fdmVydGV4PlxuICAgICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBvc2l0aW9uJyl9XG4gICAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4Q29sb3InKX1cbiAgICAgICAgYFxuICAgICAgKVxuICAgICAgLnJlcGxhY2UoXG4gICAgICAgICcjaW5jbHVkZSA8bW9ycGh0YXJnZXRfdmVydGV4PicsXG4gICAgICAgIGBcbiAgICAgICAgI2luY2x1ZGUgPG1vcnBodGFyZ2V0X3ZlcnRleD5cbiAgICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQb3N0TW9ycGgnKX1cbiAgICAgICAgYFxuICAgICAgKVxuICAgICAgLnJlcGxhY2UoXG4gICAgICAgICcjaW5jbHVkZSA8c2tpbm5pbmdfdmVydGV4PicsXG4gICAgICAgIGBcbiAgICAgICAgI2luY2x1ZGUgPHNraW5uaW5nX3ZlcnRleD5cbiAgICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQb3N0U2tpbm5pbmcnKX1cbiAgICAgICAgYFxuICAgICAgKVxuICB9XG5cbiAgY29uY2F0RnJhZ21lbnRTaGFkZXIgKCkge1xuICAgIHJldHVybiBTaGFkZXJMaWIuYmFzaWMuZnJhZ21lbnRTaGFkZXJcbiAgICAgIC5yZXBsYWNlKFxuICAgICAgICAndm9pZCBtYWluKCkgeycsXG4gICAgICAgIGBcbiAgICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudFBhcmFtZXRlcnMnKX1cbiAgICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2YXJ5aW5nUGFyYW1ldGVycycpfVxuICAgICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50RnVuY3Rpb25zJyl9XG5cbiAgICAgICAgdm9pZCBtYWluKCkge1xuICAgICAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRJbml0Jyl9XG4gICAgICAgIGBcbiAgICAgIClcbiAgICAgIC5yZXBsYWNlKFxuICAgICAgICAnI2luY2x1ZGUgPG1hcF9mcmFnbWVudD4nLFxuICAgICAgICBgXG4gICAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnREaWZmdXNlJyl9XG4gICAgICAgICR7KHRoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50TWFwJykgfHwgJyNpbmNsdWRlIDxtYXBfZnJhZ21lbnQ+Jyl9XG5cbiAgICAgICAgYFxuICAgICAgKVxuICB9XG59XG5cbmV4cG9ydCB7IEJhc2ljQW5pbWF0aW9uTWF0ZXJpYWwgfTtcbiIsImltcG9ydCB7IFNoYWRlckxpYiB9IGZyb20gJ3RocmVlJztcbmltcG9ydCBCYXNlQW5pbWF0aW9uTWF0ZXJpYWwgZnJvbSAnLi9CYXNlQW5pbWF0aW9uTWF0ZXJpYWwnO1xuXG5jbGFzcyBMYW1iZXJ0QW5pbWF0aW9uTWF0ZXJpYWwgZXh0ZW5kcyBCYXNlQW5pbWF0aW9uTWF0ZXJpYWwge1xuICAvKipcbiAgICogRXh0ZW5kcyBUSFJFRS5NZXNoTGFtYmVydE1hdGVyaWFsIHdpdGggY3VzdG9tIHNoYWRlciBjaHVua3MuXG4gICAqXG4gICAqIEBzZWUgaHR0cDovL3RocmVlLWJhcy1leGFtcGxlcy5zdXJnZS5zaC9leGFtcGxlcy9tYXRlcmlhbHNfbGFtYmVydC9cbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9IHBhcmFtZXRlcnMgT2JqZWN0IGNvbnRhaW5pbmcgbWF0ZXJpYWwgcHJvcGVydGllcyBhbmQgY3VzdG9tIHNoYWRlciBjaHVua3MuXG4gICAqIEBjb25zdHJ1Y3RvclxuICAgKi9cbiAgY29uc3RydWN0b3IgKHBhcmFtZXRlcnMpIHtcbiAgICBzdXBlcihwYXJhbWV0ZXJzLCBTaGFkZXJMaWJbJ2xhbWJlcnQnXS51bmlmb3Jtcyk7XG5cbiAgICB0aGlzLmxpZ2h0cyA9IHRydWU7XG4gICAgdGhpcy52ZXJ0ZXhTaGFkZXIgPSB0aGlzLmNvbmNhdFZlcnRleFNoYWRlcigpO1xuICAgIHRoaXMuZnJhZ21lbnRTaGFkZXIgPSB0aGlzLmNvbmNhdEZyYWdtZW50U2hhZGVyKCk7XG4gIH1cblxuICBjb25jYXRWZXJ0ZXhTaGFkZXIgKCkge1xuICAgIHJldHVybiBTaGFkZXJMaWIubGFtYmVydC52ZXJ0ZXhTaGFkZXJcbiAgICAgIC5yZXBsYWNlKFxuICAgICAgICAndm9pZCBtYWluKCkgeycsXG4gICAgICAgIGBcbiAgICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQYXJhbWV0ZXJzJyl9XG4gICAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmFyeWluZ1BhcmFtZXRlcnMnKX1cbiAgICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhGdW5jdGlvbnMnKX1cblxuICAgICAgICB2b2lkIG1haW4oKSB7XG4gICAgICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhJbml0Jyl9XG4gICAgICAgIGBcbiAgICAgIClcbiAgICAgIC5yZXBsYWNlKFxuICAgICAgICAnI2luY2x1ZGUgPGJlZ2lubm9ybWFsX3ZlcnRleD4nLFxuICAgICAgICBgXG4gICAgICAgICNpbmNsdWRlIDxiZWdpbm5vcm1hbF92ZXJ0ZXg+XG5cbiAgICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhOb3JtYWwnKX1cbiAgICAgICAgYFxuICAgICAgKVxuICAgICAgLnJlcGxhY2UoXG4gICAgICAgICcjaW5jbHVkZSA8YmVnaW5fdmVydGV4PicsXG4gICAgICAgIGBcbiAgICAgICAgI2luY2x1ZGUgPGJlZ2luX3ZlcnRleD5cblxuICAgICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBvc2l0aW9uJyl9XG4gICAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4Q29sb3InKX1cbiAgICAgICAgYFxuICAgICAgKVxuICAgICAgLnJlcGxhY2UoXG4gICAgICAgICcjaW5jbHVkZSA8bW9ycGh0YXJnZXRfdmVydGV4PicsXG4gICAgICAgIGBcbiAgICAgICAgI2luY2x1ZGUgPG1vcnBodGFyZ2V0X3ZlcnRleD5cblxuICAgICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBvc3RNb3JwaCcpfVxuICAgICAgICBgXG4gICAgICApXG4gICAgICAucmVwbGFjZShcbiAgICAgICAgJyNpbmNsdWRlIDxza2lubmluZ192ZXJ0ZXg+JyxcbiAgICAgICAgYFxuICAgICAgICAjaW5jbHVkZSA8c2tpbm5pbmdfdmVydGV4PlxuXG4gICAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UG9zdFNraW5uaW5nJyl9XG4gICAgICAgIGBcbiAgICAgIClcbiAgfVxuXG4gIGNvbmNhdEZyYWdtZW50U2hhZGVyICgpIHtcbiAgICByZXR1cm4gU2hhZGVyTGliLmxhbWJlcnQuZnJhZ21lbnRTaGFkZXJcbiAgICAgIC5yZXBsYWNlKFxuICAgICAgICAndm9pZCBtYWluKCkgeycsXG4gICAgICAgIGBcbiAgICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudFBhcmFtZXRlcnMnKX1cbiAgICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2YXJ5aW5nUGFyYW1ldGVycycpfVxuICAgICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50RnVuY3Rpb25zJyl9XG5cbiAgICAgICAgdm9pZCBtYWluKCkge1xuICAgICAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRJbml0Jyl9XG4gICAgICAgIGBcbiAgICAgIClcbiAgICAgIC5yZXBsYWNlKFxuICAgICAgICAnI2luY2x1ZGUgPG1hcF9mcmFnbWVudD4nLFxuICAgICAgICBgXG4gICAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnREaWZmdXNlJyl9XG4gICAgICAgICR7KHRoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50TWFwJykgfHwgJyNpbmNsdWRlIDxtYXBfZnJhZ21lbnQ+Jyl9XG5cbiAgICAgICAgYFxuICAgICAgKVxuICAgICAgLnJlcGxhY2UoXG4gICAgICAgICcjaW5jbHVkZSA8ZW1pc3NpdmVtYXBfZnJhZ21lbnQ+JyxcbiAgICAgICAgYFxuICAgICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50RW1pc3NpdmUnKX1cblxuICAgICAgICAjaW5jbHVkZSA8ZW1pc3NpdmVtYXBfZnJhZ21lbnQ+XG4gICAgICAgIGBcbiAgICAgIClcbiAgfVxufVxuXG5leHBvcnQgeyBMYW1iZXJ0QW5pbWF0aW9uTWF0ZXJpYWwgfTtcbiIsImltcG9ydCB7IFNoYWRlckxpYiB9IGZyb20gJ3RocmVlJztcbmltcG9ydCBCYXNlQW5pbWF0aW9uTWF0ZXJpYWwgZnJvbSAnLi9CYXNlQW5pbWF0aW9uTWF0ZXJpYWwnO1xuXG5jbGFzcyBQaG9uZ0FuaW1hdGlvbk1hdGVyaWFsIGV4dGVuZHMgQmFzZUFuaW1hdGlvbk1hdGVyaWFsIHtcbiAgLyoqXG4gICAqIEV4dGVuZHMgVEhSRUUuTWVzaFBob25nTWF0ZXJpYWwgd2l0aCBjdXN0b20gc2hhZGVyIGNodW5rcy5cbiAgICpcbiAgICogQHNlZSBodHRwOi8vdGhyZWUtYmFzLWV4YW1wbGVzLnN1cmdlLnNoL2V4YW1wbGVzL21hdGVyaWFsc19waG9uZy9cbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9IHBhcmFtZXRlcnMgT2JqZWN0IGNvbnRhaW5pbmcgbWF0ZXJpYWwgcHJvcGVydGllcyBhbmQgY3VzdG9tIHNoYWRlciBjaHVua3MuXG4gICAqIEBjb25zdHJ1Y3RvclxuICAgKi9cbiAgY29uc3RydWN0b3IgKHBhcmFtZXRlcnMpIHtcbiAgICBzdXBlcihwYXJhbWV0ZXJzLCBTaGFkZXJMaWJbJ3Bob25nJ10udW5pZm9ybXMpO1xuXG4gICAgdGhpcy5saWdodHMgPSB0cnVlO1xuICAgIHRoaXMudmVydGV4U2hhZGVyID0gdGhpcy5jb25jYXRWZXJ0ZXhTaGFkZXIoKTtcbiAgICB0aGlzLmZyYWdtZW50U2hhZGVyID0gdGhpcy5jb25jYXRGcmFnbWVudFNoYWRlcigpO1xuICB9XG5cbiAgY29uY2F0VmVydGV4U2hhZGVyICgpIHtcbiAgICByZXR1cm4gU2hhZGVyTGliLnBob25nLnZlcnRleFNoYWRlclxuICAgICAgLnJlcGxhY2UoXG4gICAgICAgICd2b2lkIG1haW4oKSB7JyxcbiAgICAgICAgYFxuICAgICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBhcmFtZXRlcnMnKX1cbiAgICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2YXJ5aW5nUGFyYW1ldGVycycpfVxuICAgICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleEZ1bmN0aW9ucycpfVxuXG4gICAgICAgIHZvaWQgbWFpbigpIHtcbiAgICAgICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleEluaXQnKX1cbiAgICAgICAgYFxuICAgICAgKVxuICAgICAgLnJlcGxhY2UoXG4gICAgICAgICcjaW5jbHVkZSA8YmVnaW5ub3JtYWxfdmVydGV4PicsXG4gICAgICAgIGBcbiAgICAgICAgI2luY2x1ZGUgPGJlZ2lubm9ybWFsX3ZlcnRleD5cblxuICAgICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleE5vcm1hbCcpfVxuICAgICAgICBgXG4gICAgICApXG4gICAgICAucmVwbGFjZShcbiAgICAgICAgJyNpbmNsdWRlIDxiZWdpbl92ZXJ0ZXg+JyxcbiAgICAgICAgYFxuICAgICAgICAjaW5jbHVkZSA8YmVnaW5fdmVydGV4PlxuXG4gICAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UG9zaXRpb24nKX1cbiAgICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhDb2xvcicpfVxuICAgICAgICBgXG4gICAgICApXG4gICAgICAucmVwbGFjZShcbiAgICAgICAgJyNpbmNsdWRlIDxtb3JwaHRhcmdldF92ZXJ0ZXg+JyxcbiAgICAgICAgYFxuICAgICAgICAjaW5jbHVkZSA8bW9ycGh0YXJnZXRfdmVydGV4PlxuXG4gICAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UG9zdE1vcnBoJyl9XG4gICAgICAgIGBcbiAgICAgIClcbiAgICAgIC5yZXBsYWNlKFxuICAgICAgICAnI2luY2x1ZGUgPHNraW5uaW5nX3ZlcnRleD4nLFxuICAgICAgICBgXG4gICAgICAgICNpbmNsdWRlIDxza2lubmluZ192ZXJ0ZXg+XG5cbiAgICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQb3N0U2tpbm5pbmcnKX1cbiAgICAgICAgYFxuICAgICAgKVxuICB9XG5cbiAgY29uY2F0RnJhZ21lbnRTaGFkZXIgKCkge1xuICAgIHJldHVybiBTaGFkZXJMaWIucGhvbmcuZnJhZ21lbnRTaGFkZXJcbiAgICAgIC5yZXBsYWNlKFxuICAgICAgICAndm9pZCBtYWluKCkgeycsXG4gICAgICAgIGBcbiAgICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudFBhcmFtZXRlcnMnKX1cbiAgICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2YXJ5aW5nUGFyYW1ldGVycycpfVxuICAgICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50RnVuY3Rpb25zJyl9XG5cbiAgICAgICAgdm9pZCBtYWluKCkge1xuICAgICAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRJbml0Jyl9XG4gICAgICAgIGBcbiAgICAgIClcbiAgICAgIC5yZXBsYWNlKFxuICAgICAgICAnI2luY2x1ZGUgPG1hcF9mcmFnbWVudD4nLFxuICAgICAgICBgXG4gICAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnREaWZmdXNlJyl9XG4gICAgICAgICR7KHRoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50TWFwJykgfHwgJyNpbmNsdWRlIDxtYXBfZnJhZ21lbnQ+Jyl9XG5cbiAgICAgICAgYFxuICAgICAgKVxuICAgICAgLnJlcGxhY2UoXG4gICAgICAgICcjaW5jbHVkZSA8ZW1pc3NpdmVtYXBfZnJhZ21lbnQ+JyxcbiAgICAgICAgYFxuICAgICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50RW1pc3NpdmUnKX1cblxuICAgICAgICAjaW5jbHVkZSA8ZW1pc3NpdmVtYXBfZnJhZ21lbnQ+XG4gICAgICAgIGBcbiAgICAgIClcbiAgICAgIC5yZXBsYWNlKFxuICAgICAgICAnI2luY2x1ZGUgPGxpZ2h0c19waG9uZ19mcmFnbWVudD4nLFxuICAgICAgICBgXG4gICAgICAgICNpbmNsdWRlIDxsaWdodHNfcGhvbmdfZnJhZ21lbnQ+XG4gICAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRTcGVjdWxhcicpfVxuICAgICAgICBgXG4gICAgICApXG4gIH1cbn1cblxuZXhwb3J0IHsgUGhvbmdBbmltYXRpb25NYXRlcmlhbCB9O1xuIiwiaW1wb3J0IHsgU2hhZGVyTGliIH0gZnJvbSAndGhyZWUnO1xuaW1wb3J0IEJhc2VBbmltYXRpb25NYXRlcmlhbCBmcm9tICcuL0Jhc2VBbmltYXRpb25NYXRlcmlhbCc7XG5cbmNsYXNzIFN0YW5kYXJkQW5pbWF0aW9uTWF0ZXJpYWwgZXh0ZW5kcyBCYXNlQW5pbWF0aW9uTWF0ZXJpYWwge1xuICAvKipcbiAgICogRXh0ZW5kcyBUSFJFRS5NZXNoU3RhbmRhcmRNYXRlcmlhbCB3aXRoIGN1c3RvbSBzaGFkZXIgY2h1bmtzLlxuICAgKlxuICAgKiBAc2VlIGh0dHA6Ly90aHJlZS1iYXMtZXhhbXBsZXMuc3VyZ2Uuc2gvZXhhbXBsZXMvbWF0ZXJpYWxzX3N0YW5kYXJkL1xuICAgKlxuICAgKiBAcGFyYW0ge09iamVjdH0gcGFyYW1ldGVycyBPYmplY3QgY29udGFpbmluZyBtYXRlcmlhbCBwcm9wZXJ0aWVzIGFuZCBjdXN0b20gc2hhZGVyIGNodW5rcy5cbiAgICovXG4gIGNvbnN0cnVjdG9yIChwYXJhbWV0ZXJzKSB7XG4gICAgc3VwZXIocGFyYW1ldGVycywgU2hhZGVyTGliWydwaHlzaWNhbCddLnVuaWZvcm1zKTtcblxuICAgIHRoaXMubGlnaHRzID0gdHJ1ZTtcbiAgICB0aGlzLmV4dGVuc2lvbnMgPSAodGhpcy5leHRlbnNpb25zIHx8IHt9KTtcbiAgICB0aGlzLmV4dGVuc2lvbnMuZGVyaXZhdGl2ZXMgPSB0cnVlO1xuICAgIHRoaXMudmVydGV4U2hhZGVyID0gdGhpcy5jb25jYXRWZXJ0ZXhTaGFkZXIoKTtcbiAgICB0aGlzLmZyYWdtZW50U2hhZGVyID0gdGhpcy5jb25jYXRGcmFnbWVudFNoYWRlcigpO1xuICB9XG5cbiAgY29uY2F0VmVydGV4U2hhZGVyICgpIHtcbiAgICByZXR1cm4gU2hhZGVyTGliLnN0YW5kYXJkLnZlcnRleFNoYWRlclxuICAgICAgLnJlcGxhY2UoXG4gICAgICAgICd2b2lkIG1haW4oKSB7JyxcbiAgICAgICAgYFxuICAgICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBhcmFtZXRlcnMnKX1cbiAgICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2YXJ5aW5nUGFyYW1ldGVycycpfVxuICAgICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleEZ1bmN0aW9ucycpfVxuXG4gICAgICAgIHZvaWQgbWFpbigpIHtcbiAgICAgICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleEluaXQnKX1cbiAgICAgICAgYFxuICAgICAgKVxuICAgICAgLnJlcGxhY2UoXG4gICAgICAgICcjaW5jbHVkZSA8YmVnaW5ub3JtYWxfdmVydGV4PicsXG4gICAgICAgIGBcbiAgICAgICAgI2luY2x1ZGUgPGJlZ2lubm9ybWFsX3ZlcnRleD5cblxuICAgICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleE5vcm1hbCcpfVxuICAgICAgICBgXG4gICAgICApXG4gICAgICAucmVwbGFjZShcbiAgICAgICAgJyNpbmNsdWRlIDxiZWdpbl92ZXJ0ZXg+JyxcbiAgICAgICAgYFxuICAgICAgICAjaW5jbHVkZSA8YmVnaW5fdmVydGV4PlxuXG4gICAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UG9zaXRpb24nKX1cbiAgICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhDb2xvcicpfVxuICAgICAgICBgXG4gICAgICApXG4gICAgICAucmVwbGFjZShcbiAgICAgICAgJyNpbmNsdWRlIDxtb3JwaHRhcmdldF92ZXJ0ZXg+JyxcbiAgICAgICAgYFxuICAgICAgICAjaW5jbHVkZSA8bW9ycGh0YXJnZXRfdmVydGV4PlxuXG4gICAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UG9zdE1vcnBoJyl9XG4gICAgICAgIGBcbiAgICAgIClcbiAgICAgIC5yZXBsYWNlKFxuICAgICAgICAnI2luY2x1ZGUgPHNraW5uaW5nX3ZlcnRleD4nLFxuICAgICAgICBgXG4gICAgICAgICNpbmNsdWRlIDxza2lubmluZ192ZXJ0ZXg+XG5cbiAgICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQb3N0U2tpbm5pbmcnKX1cbiAgICAgICAgYFxuICAgICAgKVxuICB9XG5cbiAgY29uY2F0RnJhZ21lbnRTaGFkZXIgKCkge1xuICAgIHJldHVybiBTaGFkZXJMaWIuc3RhbmRhcmQuZnJhZ21lbnRTaGFkZXJcbiAgICAgIC5yZXBsYWNlKFxuICAgICAgICAndm9pZCBtYWluKCkgeycsXG4gICAgICAgIGBcbiAgICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudFBhcmFtZXRlcnMnKX1cbiAgICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2YXJ5aW5nUGFyYW1ldGVycycpfVxuICAgICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50RnVuY3Rpb25zJyl9XG5cbiAgICAgICAgdm9pZCBtYWluKCkge1xuICAgICAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRJbml0Jyl9XG4gICAgICAgIGBcbiAgICAgIClcbiAgICAgIC5yZXBsYWNlKFxuICAgICAgICAnI2luY2x1ZGUgPG1hcF9mcmFnbWVudD4nLFxuICAgICAgICBgXG4gICAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnREaWZmdXNlJyl9XG4gICAgICAgICR7KHRoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50TWFwJykgfHwgJyNpbmNsdWRlIDxtYXBfZnJhZ21lbnQ+Jyl9XG5cbiAgICAgICAgYFxuICAgICAgKVxuICAgICAgLnJlcGxhY2UoXG4gICAgICAgICcjaW5jbHVkZSA8ZW1pc3NpdmVtYXBfZnJhZ21lbnQ+JyxcbiAgICAgICAgYFxuICAgICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50RW1pc3NpdmUnKX1cblxuICAgICAgICAjaW5jbHVkZSA8ZW1pc3NpdmVtYXBfZnJhZ21lbnQ+XG4gICAgICAgIGBcbiAgICAgIClcbiAgICAgIC5yZXBsYWNlKFxuICAgICAgICAnI2luY2x1ZGUgPHJvdWdobmVzc21hcF9mcmFnbWVudD4nLFxuICAgICAgICBgXG4gICAgICAgIGZsb2F0IHJvdWdobmVzc0ZhY3RvciA9IHJvdWdobmVzcztcbiAgICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudFJvdWdobmVzcycpfVxuICAgICAgICAjaWZkZWYgVVNFX1JPVUdITkVTU01BUFxuXG4gICAgICAgIHZlYzQgdGV4ZWxSb3VnaG5lc3MgPSB0ZXh0dXJlMkQoIHJvdWdobmVzc01hcCwgdlV2ICk7XG4gICAgICAgICAgcm91Z2huZXNzRmFjdG9yICo9IHRleGVsUm91Z2huZXNzLmc7XG4gICAgICAgICNlbmRpZlxuICAgICAgICBgXG4gICAgICApXG4gICAgICAucmVwbGFjZShcbiAgICAgICAgJyNpbmNsdWRlIDxtZXRhbG5lc3NtYXBfZnJhZ21lbnQ+JyxcbiAgICAgICAgYFxuICAgICAgICBmbG9hdCBtZXRhbG5lc3NGYWN0b3IgPSBtZXRhbG5lc3M7XG4gICAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRNZXRhbG5lc3MnKX1cblxuICAgICAgICAjaWZkZWYgVVNFX01FVEFMTkVTU01BUFxuICAgICAgICAgIHZlYzQgdGV4ZWxNZXRhbG5lc3MgPSB0ZXh0dXJlMkQoIG1ldGFsbmVzc01hcCwgdlV2ICk7XG4gICAgICAgICAgbWV0YWxuZXNzRmFjdG9yICo9IHRleGVsTWV0YWxuZXNzLmI7XG4gICAgICAgICNlbmRpZlxuICAgICAgICBgXG4gICAgICApXG4gIH1cbn1cblxuZXhwb3J0IHsgU3RhbmRhcmRBbmltYXRpb25NYXRlcmlhbCB9O1xuIiwiaW1wb3J0IHsgU2hhZGVyTGliIH0gZnJvbSAndGhyZWUnXG5pbXBvcnQgQmFzZUFuaW1hdGlvbk1hdGVyaWFsIGZyb20gJy4vQmFzZUFuaW1hdGlvbk1hdGVyaWFsJztcblxuY2xhc3MgVG9vbkFuaW1hdGlvbk1hdGVyaWFsIGV4dGVuZHMgQmFzZUFuaW1hdGlvbk1hdGVyaWFsIHtcbiAgLyoqXG4gICAqIEV4dGVuZHMgVEhSRUUuTWVzaFRvb25NYXRlcmlhbCB3aXRoIGN1c3RvbSBzaGFkZXIgY2h1bmtzLlxuICAgKlxuICAgKiBAcGFyYW0ge09iamVjdH0gcGFyYW1ldGVycyBPYmplY3QgY29udGFpbmluZyBtYXRlcmlhbCBwcm9wZXJ0aWVzIGFuZCBjdXN0b20gc2hhZGVyIGNodW5rcy5cbiAgICovXG4gIGNvbnN0cnVjdG9yIChwYXJhbWV0ZXJzKSB7XG4gICAgc3VwZXIocGFyYW1ldGVycywgU2hhZGVyTGliWyd0b29uJ10udW5pZm9ybXMpO1xuXG4gICAgdGhpcy5saWdodHMgPSB0cnVlO1xuICAgIHRoaXMudmVydGV4U2hhZGVyID0gdGhpcy5jb25jYXRWZXJ0ZXhTaGFkZXIoKTtcbiAgICB0aGlzLmZyYWdtZW50U2hhZGVyID0gdGhpcy5jb25jYXRGcmFnbWVudFNoYWRlcigpO1xuICB9XG5cbiAgY29uY2F0VmVydGV4U2hhZGVyICgpIHtcbiAgICByZXR1cm4gU2hhZGVyTGliLnRvb24udmVydGV4U2hhZGVyXG4gICAgICAucmVwbGFjZShcbiAgICAgICAgJ3ZvaWQgbWFpbigpIHsnLFxuICAgICAgICBgXG4gICAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UGFyYW1ldGVycycpfVxuICAgICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZhcnlpbmdQYXJhbWV0ZXJzJyl9XG4gICAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4RnVuY3Rpb25zJyl9XG5cbiAgICAgICAgdm9pZCBtYWluKCkge1xuICAgICAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4SW5pdCcpfVxuICAgICAgICBgXG4gICAgICApXG4gICAgICAucmVwbGFjZShcbiAgICAgICAgJyNpbmNsdWRlIDxiZWdpbm5vcm1hbF92ZXJ0ZXg+JyxcbiAgICAgICAgYFxuICAgICAgICAjaW5jbHVkZSA8YmVnaW5ub3JtYWxfdmVydGV4PlxuXG4gICAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4Tm9ybWFsJyl9XG4gICAgICAgIGBcbiAgICAgIClcbiAgICAgIC5yZXBsYWNlKFxuICAgICAgICAnI2luY2x1ZGUgPGJlZ2luX3ZlcnRleD4nLFxuICAgICAgICBgXG4gICAgICAgICNpbmNsdWRlIDxiZWdpbl92ZXJ0ZXg+XG5cbiAgICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQb3NpdGlvbicpfVxuICAgICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleENvbG9yJyl9XG4gICAgICAgIGBcbiAgICAgIClcbiAgICAgIC5yZXBsYWNlKFxuICAgICAgICAnI2luY2x1ZGUgPG1vcnBodGFyZ2V0X3ZlcnRleD4nLFxuICAgICAgICBgXG4gICAgICAgICNpbmNsdWRlIDxtb3JwaHRhcmdldF92ZXJ0ZXg+XG5cbiAgICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQb3N0TW9ycGgnKX1cbiAgICAgICAgYFxuICAgICAgKVxuICAgICAgLnJlcGxhY2UoXG4gICAgICAgICcjaW5jbHVkZSA8c2tpbm5pbmdfdmVydGV4PicsXG4gICAgICAgIGBcbiAgICAgICAgI2luY2x1ZGUgPHNraW5uaW5nX3ZlcnRleD5cblxuICAgICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBvc3RTa2lubmluZycpfVxuICAgICAgICBgXG4gICAgICApXG4gIH1cblxuICBjb25jYXRGcmFnbWVudFNoYWRlciAoKSB7XG4gICAgcmV0dXJuIFNoYWRlckxpYi50b29uLmZyYWdtZW50U2hhZGVyXG4gICAgICAucmVwbGFjZShcbiAgICAgICAgJ3ZvaWQgbWFpbigpIHsnLFxuICAgICAgICBgXG4gICAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRQYXJhbWV0ZXJzJyl9XG4gICAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmFyeWluZ1BhcmFtZXRlcnMnKX1cbiAgICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudEZ1bmN0aW9ucycpfVxuXG4gICAgICAgIHZvaWQgbWFpbigpIHtcbiAgICAgICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50SW5pdCcpfVxuICAgICAgICBgXG4gICAgICApXG4gICAgICAucmVwbGFjZShcbiAgICAgICAgJyNpbmNsdWRlIDxtYXBfZnJhZ21lbnQ+JyxcbiAgICAgICAgYFxuICAgICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50RGlmZnVzZScpfVxuICAgICAgICAkeyh0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudE1hcCcpIHx8ICcjaW5jbHVkZSA8bWFwX2ZyYWdtZW50PicpfVxuXG4gICAgICAgIGBcbiAgICAgIClcbiAgICAgIC5yZXBsYWNlKFxuICAgICAgICAnI2luY2x1ZGUgPGVtaXNzaXZlbWFwX2ZyYWdtZW50PicsXG4gICAgICAgIGBcbiAgICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudEVtaXNzaXZlJyl9XG5cbiAgICAgICAgI2luY2x1ZGUgPGVtaXNzaXZlbWFwX2ZyYWdtZW50PlxuICAgICAgICBgXG4gICAgICApXG4gIH1cbn1cblxuZXhwb3J0IHsgVG9vbkFuaW1hdGlvbk1hdGVyaWFsIH07XG4iLCJpbXBvcnQgeyBTaGFkZXJMaWIgfSBmcm9tICd0aHJlZSc7XG5pbXBvcnQgQmFzZUFuaW1hdGlvbk1hdGVyaWFsIGZyb20gJy4vQmFzZUFuaW1hdGlvbk1hdGVyaWFsJztcblxuY2xhc3MgUG9pbnRzQW5pbWF0aW9uTWF0ZXJpYWwgZXh0ZW5kcyBCYXNlQW5pbWF0aW9uTWF0ZXJpYWwge1xuICAvKipcbiAgICogRXh0ZW5kcyBUSFJFRS5Qb2ludHNNYXRlcmlhbCB3aXRoIGN1c3RvbSBzaGFkZXIgY2h1bmtzLlxuICAgKlxuICAgKiBAcGFyYW0ge09iamVjdH0gcGFyYW1ldGVycyBPYmplY3QgY29udGFpbmluZyBtYXRlcmlhbCBwcm9wZXJ0aWVzIGFuZCBjdXN0b20gc2hhZGVyIGNodW5rcy5cbiAgICogQGNvbnN0cnVjdG9yXG4gICAqL1xuICBjb25zdHJ1Y3RvciAocGFyYW1ldGVycykge1xuICAgIHN1cGVyKHBhcmFtZXRlcnMsIFNoYWRlckxpYlsncG9pbnRzJ10udW5pZm9ybXMpO1xuXG4gICAgdGhpcy52ZXJ0ZXhTaGFkZXIgPSB0aGlzLmNvbmNhdFZlcnRleFNoYWRlcigpO1xuICAgIHRoaXMuZnJhZ21lbnRTaGFkZXIgPSB0aGlzLmNvbmNhdEZyYWdtZW50U2hhZGVyKCk7XG4gIH1cblxuICBjb25jYXRWZXJ0ZXhTaGFkZXIgKCkge1xuICAgIHJldHVybiBTaGFkZXJMaWIucG9pbnRzLnZlcnRleFNoYWRlclxuICAgICAgLnJlcGxhY2UoXG4gICAgICAgICd2b2lkIG1haW4oKSB7JyxcbiAgICAgICAgYFxuICAgICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBhcmFtZXRlcnMnKX1cbiAgICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2YXJ5aW5nUGFyYW1ldGVycycpfVxuICAgICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleEZ1bmN0aW9ucycpfVxuXG4gICAgICAgIHZvaWQgbWFpbigpIHtcbiAgICAgICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleEluaXQnKX1cbiAgICAgICAgYFxuICAgICAgKVxuICAgICAgLnJlcGxhY2UoXG4gICAgICAgICcjaW5jbHVkZSA8YmVnaW5fdmVydGV4PicsXG4gICAgICAgIGBcbiAgICAgICAgI2luY2x1ZGUgPGJlZ2luX3ZlcnRleD5cblxuICAgICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBvc2l0aW9uJyl9XG4gICAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4Q29sb3InKX1cbiAgICAgICAgYFxuICAgICAgKVxuICAgICAgLnJlcGxhY2UoXG4gICAgICAgICcjaW5jbHVkZSA8bW9ycGh0YXJnZXRfdmVydGV4PicsXG4gICAgICAgIGBcbiAgICAgICAgI2luY2x1ZGUgPG1vcnBodGFyZ2V0X3ZlcnRleD5cblxuICAgICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBvc3RNb3JwaCcpfVxuICAgICAgICBgXG4gICAgICApXG4gIH1cblxuICBjb25jYXRGcmFnbWVudFNoYWRlciAoKSB7XG4gICAgcmV0dXJuIFNoYWRlckxpYi5wb2ludHMuZnJhZ21lbnRTaGFkZXJcbiAgICAgIC5yZXBsYWNlKFxuICAgICAgICAndm9pZCBtYWluKCkgeycsXG4gICAgICAgIGBcbiAgICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCdmcmFnbWVudFBhcmFtZXRlcnMnKX1cbiAgICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2YXJ5aW5nUGFyYW1ldGVycycpfVxuICAgICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50RnVuY3Rpb25zJyl9XG5cbiAgICAgICAgdm9pZCBtYWluKCkge1xuICAgICAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRJbml0Jyl9XG4gICAgICAgIGBcbiAgICAgIClcbiAgICAgIC5yZXBsYWNlKFxuICAgICAgICAnI2luY2x1ZGUgPG1hcF9mcmFnbWVudD4nLFxuICAgICAgICBgXG4gICAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnREaWZmdXNlJyl9XG4gICAgICAgICR7KHRoaXMuc3RyaW5naWZ5Q2h1bmsoJ2ZyYWdtZW50TWFwJykgfHwgJyNpbmNsdWRlIDxtYXBfZnJhZ21lbnQ+Jyl9XG5cbiAgICAgICAgYFxuICAgICAgKVxuICAgICAgLnJlcGxhY2UoXG4gICAgICAgICcjaW5jbHVkZSA8cHJlbXVsdGlwbGllZF9hbHBoYV9mcmFnbWVudD4nLFxuICAgICAgICBgXG4gICAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygnZnJhZ21lbnRTaGFwZScpfVxuXG4gICAgICAgICNpbmNsdWRlIDxwcmVtdWx0aXBsaWVkX2FscGhhX2ZyYWdtZW50PlxuICAgICAgICBgXG4gICAgICApXG4gIH1cbn1cblxuZXhwb3J0IHsgUG9pbnRzQW5pbWF0aW9uTWF0ZXJpYWwgfTtcbiIsImltcG9ydCB7IFNoYWRlckxpYiwgUkdCQURlcHRoUGFja2luZyB9IGZyb20gJ3RocmVlJztcbmltcG9ydCBCYXNlQW5pbWF0aW9uTWF0ZXJpYWwgZnJvbSAnLi9CYXNlQW5pbWF0aW9uTWF0ZXJpYWwnO1xuXG5jbGFzcyBEZXB0aEFuaW1hdGlvbk1hdGVyaWFsIGV4dGVuZHMgQmFzZUFuaW1hdGlvbk1hdGVyaWFsIHtcbiAgY29uc3RydWN0b3IgKHBhcmFtZXRlcnMpIHtcbiAgICBzdXBlcihwYXJhbWV0ZXJzLCBTaGFkZXJMaWJbJ2RlcHRoJ10udW5pZm9ybXMpO1xuXG4gICAgdGhpcy5kZXB0aFBhY2tpbmcgPSBSR0JBRGVwdGhQYWNraW5nO1xuICAgIHRoaXMuY2xpcHBpbmcgPSB0cnVlO1xuICAgIHRoaXMudmVydGV4U2hhZGVyID0gdGhpcy5jb25jYXRWZXJ0ZXhTaGFkZXIoKTtcbiAgICB0aGlzLmZyYWdtZW50U2hhZGVyID0gU2hhZGVyTGliWydkZXB0aCddLmZyYWdtZW50U2hhZGVyO1xuICB9XG5cbiAgY29uY2F0VmVydGV4U2hhZGVyICgpIHtcbiAgICByZXR1cm4gU2hhZGVyTGliLmRlcHRoLnZlcnRleFNoYWRlclxuICAgICAgLnJlcGxhY2UoXG4gICAgICAgICd2b2lkIG1haW4oKSB7JyxcbiAgICAgICAgYFxuICAgICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBhcmFtZXRlcnMnKX1cbiAgICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhGdW5jdGlvbnMnKX1cblxuICAgICAgICB2b2lkIG1haW4oKSB7XG4gICAgICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhJbml0Jyl9XG4gICAgICAgIGBcbiAgICAgIClcbiAgICAgIC5yZXBsYWNlKFxuICAgICAgICAnI2luY2x1ZGUgPGJlZ2luX3ZlcnRleD4nLFxuICAgICAgICBgXG4gICAgICAgICNpbmNsdWRlIDxiZWdpbl92ZXJ0ZXg+XG5cbiAgICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQb3NpdGlvbicpfVxuICAgICAgICBgXG4gICAgICApXG4gICAgICAucmVwbGFjZShcbiAgICAgICAgJyNpbmNsdWRlIDxtb3JwaHRhcmdldF92ZXJ0ZXg+JyxcbiAgICAgICAgYFxuICAgICAgICAjaW5jbHVkZSA8bW9ycGh0YXJnZXRfdmVydGV4PlxuXG4gICAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UG9zdE1vcnBoJyl9XG4gICAgICAgIGBcbiAgICAgIClcbiAgICAgIC5yZXBsYWNlKFxuICAgICAgICAnI2luY2x1ZGUgPHNraW5uaW5nX3ZlcnRleD4nLFxuICAgICAgICBgXG4gICAgICAgICNpbmNsdWRlIDxza2lubmluZ192ZXJ0ZXg+XG5cbiAgICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQb3N0U2tpbm5pbmcnKX1cbiAgICAgICAgYFxuICAgICAgKVxuICB9XG59XG5cbmV4cG9ydCB7IERlcHRoQW5pbWF0aW9uTWF0ZXJpYWwgfTtcbiIsImltcG9ydCB7IFNoYWRlckxpYiwgUkdCQURlcHRoUGFja2luZyB9IGZyb20gJ3RocmVlJztcbmltcG9ydCBCYXNlQW5pbWF0aW9uTWF0ZXJpYWwgZnJvbSAnLi9CYXNlQW5pbWF0aW9uTWF0ZXJpYWwnO1xuXG5jbGFzcyBEaXN0YW5jZUFuaW1hdGlvbk1hdGVyaWFsIGV4dGVuZHMgQmFzZUFuaW1hdGlvbk1hdGVyaWFsIHtcbiAgY29uc3RydWN0b3IgKHBhcmFtZXRlcnMpIHtcbiAgICBzdXBlcihwYXJhbWV0ZXJzLCBTaGFkZXJMaWJbJ2Rpc3RhbmNlUkdCQSddLnVuaWZvcm1zKTtcblxuICAgIHRoaXMuZGVwdGhQYWNraW5nID0gUkdCQURlcHRoUGFja2luZztcbiAgICB0aGlzLmNsaXBwaW5nID0gdHJ1ZTtcbiAgICB0aGlzLnZlcnRleFNoYWRlciA9IHRoaXMuY29uY2F0VmVydGV4U2hhZGVyKCk7XG4gICAgdGhpcy5mcmFnbWVudFNoYWRlciA9IFNoYWRlckxpYlsnZGlzdGFuY2VSR0JBJ10uZnJhZ21lbnRTaGFkZXI7XG4gIH1cblxuICBjb25jYXRWZXJ0ZXhTaGFkZXIgKCkge1xuICAgIHJldHVybiBTaGFkZXJMaWIuZGlzdGFuY2VSR0JBLnZlcnRleFNoYWRlclxuICAgICAgLnJlcGxhY2UoXG4gICAgICAgICd2b2lkIG1haW4oKSB7JyxcbiAgICAgICAgYFxuICAgICAgICAke3RoaXMuc3RyaW5naWZ5Q2h1bmsoJ3ZlcnRleFBhcmFtZXRlcnMnKX1cbiAgICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhGdW5jdGlvbnMnKX1cblxuICAgICAgICB2b2lkIG1haW4oKSB7XG4gICAgICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhJbml0Jyl9XG4gICAgICAgIGBcbiAgICAgIClcbiAgICAgIC5yZXBsYWNlKFxuICAgICAgICAnI2luY2x1ZGUgPGJlZ2luX3ZlcnRleD4nLFxuICAgICAgICBgXG4gICAgICAgICNpbmNsdWRlIDxiZWdpbl92ZXJ0ZXg+XG5cbiAgICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQb3NpdGlvbicpfVxuICAgICAgICBgXG4gICAgICApXG4gICAgICAucmVwbGFjZShcbiAgICAgICAgJyNpbmNsdWRlIDxtb3JwaHRhcmdldF92ZXJ0ZXg+JyxcbiAgICAgICAgYFxuICAgICAgICAjaW5jbHVkZSA8bW9ycGh0YXJnZXRfdmVydGV4PlxuXG4gICAgICAgICR7dGhpcy5zdHJpbmdpZnlDaHVuaygndmVydGV4UG9zdE1vcnBoJyl9XG4gICAgICAgIGBcbiAgICAgIClcbiAgICAgIC5yZXBsYWNlKFxuICAgICAgICAnI2luY2x1ZGUgPHNraW5uaW5nX3ZlcnRleD4nLFxuICAgICAgICBgXG4gICAgICAgICNpbmNsdWRlIDxza2lubmluZ192ZXJ0ZXg+XG5cbiAgICAgICAgJHt0aGlzLnN0cmluZ2lmeUNodW5rKCd2ZXJ0ZXhQb3N0U2tpbm5pbmcnKX1cbiAgICAgICAgYFxuICAgICAgKVxuICB9XG59XG5cbmV4cG9ydCB7IERpc3RhbmNlQW5pbWF0aW9uTWF0ZXJpYWwgfTtcbiIsImltcG9ydCB7IEJ1ZmZlckdlb21ldHJ5LCBCdWZmZXJBdHRyaWJ1dGUgfSBmcm9tICd0aHJlZSc7XG5cbmNsYXNzIFByZWZhYkJ1ZmZlckdlb21ldHJ5IGV4dGVuZHMgQnVmZmVyR2VvbWV0cnkge1xuICAvKipcbiAgICogQSBCdWZmZXJHZW9tZXRyeSB3aGVyZSBhICdwcmVmYWInIGdlb21ldHJ5IGlzIHJlcGVhdGVkIGEgbnVtYmVyIG9mIHRpbWVzLlxuICAgKlxuICAgKiBAcGFyYW0ge0dlb21ldHJ5fEJ1ZmZlckdlb21ldHJ5fSBwcmVmYWIgVGhlIEdlb21ldHJ5IGluc3RhbmNlIHRvIHJlcGVhdC5cbiAgICogQHBhcmFtIHtOdW1iZXJ9IGNvdW50IFRoZSBudW1iZXIgb2YgdGltZXMgdG8gcmVwZWF0IHRoZSBnZW9tZXRyeS5cbiAgICovXG4gIGNvbnN0cnVjdG9yIChwcmVmYWIsIGNvdW50KSB7XG4gICAgc3VwZXIoKTtcblxuICAgIC8qKlxuICAgICAqIEEgcmVmZXJlbmNlIHRvIHRoZSBwcmVmYWIgZ2VvbWV0cnkgdXNlZCB0byBjcmVhdGUgdGhpcyBpbnN0YW5jZS5cbiAgICAgKiBAdHlwZSB7R2VvbWV0cnl8QnVmZmVyR2VvbWV0cnl9XG4gICAgICovXG4gICAgdGhpcy5wcmVmYWJHZW9tZXRyeSA9IHByZWZhYjtcbiAgICB0aGlzLmlzUHJlZmFiQnVmZmVyR2VvbWV0cnkgPSBwcmVmYWIuaXNCdWZmZXJHZW9tZXRyeTtcblxuICAgIC8qKlxuICAgICAqIE51bWJlciBvZiBwcmVmYWJzLlxuICAgICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAgICovXG4gICAgdGhpcy5wcmVmYWJDb3VudCA9IGNvdW50O1xuXG4gICAgLyoqXG4gICAgICogTnVtYmVyIG9mIHZlcnRpY2VzIG9mIHRoZSBwcmVmYWIuXG4gICAgICogQHR5cGUge051bWJlcn1cbiAgICAgKi9cbiAgICBpZiAodGhpcy5pc1ByZWZhYkJ1ZmZlckdlb21ldHJ5KSB7XG4gICAgICB0aGlzLnByZWZhYlZlcnRleENvdW50ID0gcHJlZmFiLmF0dHJpYnV0ZXMucG9zaXRpb24uY291bnQ7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudCA9IHByZWZhYi52ZXJ0aWNlcy5sZW5ndGg7XG4gICAgfVxuXG4gICAgdGhpcy5idWZmZXJJbmRpY2VzKCk7XG4gICAgdGhpcy5idWZmZXJQb3NpdGlvbnMoKTtcbiAgfVxuXG4gIGJ1ZmZlckluZGljZXMgKCkge1xuICAgIGxldCBwcmVmYWJJbmRpY2VzID0gW107XG4gICAgbGV0IHByZWZhYkluZGV4Q291bnQ7XG5cbiAgICBpZiAodGhpcy5pc1ByZWZhYkJ1ZmZlckdlb21ldHJ5KSB7XG4gICAgICBpZiAodGhpcy5wcmVmYWJHZW9tZXRyeS5pbmRleCkge1xuICAgICAgICBwcmVmYWJJbmRleENvdW50ID0gdGhpcy5wcmVmYWJHZW9tZXRyeS5pbmRleC5jb3VudDtcbiAgICAgICAgcHJlZmFiSW5kaWNlcyA9IHRoaXMucHJlZmFiR2VvbWV0cnkuaW5kZXguYXJyYXk7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgcHJlZmFiSW5kZXhDb3VudCA9IHRoaXMucHJlZmFiVmVydGV4Q291bnQ7XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcmVmYWJJbmRleENvdW50OyBpKyspIHtcbiAgICAgICAgICBwcmVmYWJJbmRpY2VzLnB1c2goaSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBjb25zdCBwcmVmYWJGYWNlQ291bnQgPSB0aGlzLnByZWZhYkdlb21ldHJ5LmZhY2VzLmxlbmd0aDtcbiAgICAgIHByZWZhYkluZGV4Q291bnQgPSBwcmVmYWJGYWNlQ291bnQgKiAzO1xuXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHByZWZhYkZhY2VDb3VudDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGZhY2UgPSB0aGlzLnByZWZhYkdlb21ldHJ5LmZhY2VzW2ldO1xuICAgICAgICBwcmVmYWJJbmRpY2VzLnB1c2goZmFjZS5hLCBmYWNlLmIsIGZhY2UuYyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgaW5kZXhCdWZmZXIgPSBuZXcgVWludDMyQXJyYXkodGhpcy5wcmVmYWJDb3VudCAqIHByZWZhYkluZGV4Q291bnQpO1xuXG4gICAgdGhpcy5zZXRJbmRleChuZXcgQnVmZmVyQXR0cmlidXRlKGluZGV4QnVmZmVyLCAxKSk7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucHJlZmFiQ291bnQ7IGkrKykge1xuICAgICAgZm9yIChsZXQgayA9IDA7IGsgPCBwcmVmYWJJbmRleENvdW50OyBrKyspIHtcbiAgICAgICAgaW5kZXhCdWZmZXJbaSAqIHByZWZhYkluZGV4Q291bnQgKyBrXSA9IHByZWZhYkluZGljZXNba10gKyBpICogdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudDtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBidWZmZXJQb3NpdGlvbnMgKCkge1xuICAgIGNvbnN0IHBvc2l0aW9uQnVmZmVyID0gdGhpcy5jcmVhdGVBdHRyaWJ1dGUoJ3Bvc2l0aW9uJywgMykuYXJyYXk7XG5cbiAgICBpZiAodGhpcy5pc1ByZWZhYkJ1ZmZlckdlb21ldHJ5KSB7XG4gICAgICBjb25zdCBwb3NpdGlvbnMgPSB0aGlzLnByZWZhYkdlb21ldHJ5LmF0dHJpYnV0ZXMucG9zaXRpb24uYXJyYXk7XG5cbiAgICAgIGZvciAobGV0IGkgPSAwLCBvZmZzZXQgPSAwOyBpIDwgdGhpcy5wcmVmYWJDb3VudDsgaSsrKSB7XG4gICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudDsgaisrLCBvZmZzZXQgKz0gMykge1xuICAgICAgICAgIHBvc2l0aW9uQnVmZmVyW29mZnNldCAgICBdID0gcG9zaXRpb25zW2ogKiAzXTtcbiAgICAgICAgICBwb3NpdGlvbkJ1ZmZlcltvZmZzZXQgKyAxXSA9IHBvc2l0aW9uc1tqICogMyArIDFdO1xuICAgICAgICAgIHBvc2l0aW9uQnVmZmVyW29mZnNldCArIDJdID0gcG9zaXRpb25zW2ogKiAzICsgMl07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBmb3IgKGxldCBpID0gMCwgb2Zmc2V0ID0gMDsgaSA8IHRoaXMucHJlZmFiQ291bnQ7IGkrKykge1xuICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHRoaXMucHJlZmFiVmVydGV4Q291bnQ7IGorKywgb2Zmc2V0ICs9IDMpIHtcbiAgICAgICAgICBjb25zdCBwcmVmYWJWZXJ0ZXggPSB0aGlzLnByZWZhYkdlb21ldHJ5LnZlcnRpY2VzW2pdO1xuXG4gICAgICAgICAgcG9zaXRpb25CdWZmZXJbb2Zmc2V0ICAgIF0gPSBwcmVmYWJWZXJ0ZXgueDtcbiAgICAgICAgICBwb3NpdGlvbkJ1ZmZlcltvZmZzZXQgKyAxXSA9IHByZWZhYlZlcnRleC55O1xuICAgICAgICAgIHBvc2l0aW9uQnVmZmVyW29mZnNldCArIDJdID0gcHJlZmFiVmVydGV4Lno7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBidWZmZXJVdnMgKCkge1xuICAgIGNvbnN0IHV2QnVmZmVyID0gdGhpcy5jcmVhdGVBdHRyaWJ1dGUoJ3V2JywgMikuYXJyYXk7XG5cbiAgICBpZiAodGhpcy5pc1ByZWZhYkJ1ZmZlckdlb21ldHJ5KSB7XG4gICAgICBjb25zdCB1dnMgPSB0aGlzLnByZWZhYkdlb21ldHJ5LmF0dHJpYnV0ZXMudXYuYXJyYXlcblxuICAgICAgZm9yIChsZXQgaSA9IDAsIG9mZnNldCA9IDA7IGkgPCB0aGlzLnByZWZhYkNvdW50OyBpKyspIHtcbiAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCB0aGlzLnByZWZhYlZlcnRleENvdW50OyBqKyssIG9mZnNldCArPSAyKSB7XG4gICAgICAgICAgdXZCdWZmZXJbb2Zmc2V0ICAgIF0gPSB1dnNbaiAqIDJdO1xuICAgICAgICAgIHV2QnVmZmVyW29mZnNldCArIDFdID0gdXZzW2ogKiAyICsgMV07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgcHJlZmFiRmFjZUNvdW50ID0gdGhpcy5wcmVmYWJHZW9tZXRyeS5mYWNlcy5sZW5ndGg7XG4gICAgICBjb25zdCB1dnMgPSBbXVxuXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHByZWZhYkZhY2VDb3VudDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGZhY2UgPSB0aGlzLnByZWZhYkdlb21ldHJ5LmZhY2VzW2ldO1xuICAgICAgICBjb25zdCB1diA9IHRoaXMucHJlZmFiR2VvbWV0cnkuZmFjZVZlcnRleFV2c1swXVtpXTtcblxuICAgICAgICB1dnNbZmFjZS5hXSA9IHV2WzBdO1xuICAgICAgICB1dnNbZmFjZS5iXSA9IHV2WzFdO1xuICAgICAgICB1dnNbZmFjZS5jXSA9IHV2WzJdO1xuICAgICAgfVxuXG4gICAgICBmb3IgKGxldCBpID0gMCwgb2Zmc2V0ID0gMDsgaSA8IHRoaXMucHJlZmFiQ291bnQ7IGkrKykge1xuICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHRoaXMucHJlZmFiVmVydGV4Q291bnQ7IGorKywgb2Zmc2V0ICs9IDIpIHtcbiAgICAgICAgICBjb25zdCB1diA9IHV2c1tqXTtcblxuICAgICAgICAgIHV2QnVmZmVyW29mZnNldF0gPSB1di54O1xuICAgICAgICAgIHV2QnVmZmVyW29mZnNldCArIDFdID0gdXYueTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgQnVmZmVyQXR0cmlidXRlIG9uIHRoaXMgZ2VvbWV0cnkgaW5zdGFuY2UuXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIE5hbWUgb2YgdGhlIGF0dHJpYnV0ZS5cbiAgICogQHBhcmFtIHtOdW1iZXJ9IGl0ZW1TaXplIE51bWJlciBvZiBmbG9hdHMgcGVyIHZlcnRleCAodHlwaWNhbGx5IDEsIDIsIDMgb3IgNCkuXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb249fSBmYWN0b3J5IEZ1bmN0aW9uIHRoYXQgd2lsbCBiZSBjYWxsZWQgZm9yIGVhY2ggcHJlZmFiIHVwb24gY3JlYXRpb24uIEFjY2VwdHMgMyBhcmd1bWVudHM6IGRhdGFbXSwgaW5kZXggYW5kIHByZWZhYkNvdW50LiBDYWxscyBzZXRQcmVmYWJEYXRhLlxuICAgKlxuICAgKiBAcmV0dXJucyB7QnVmZmVyQXR0cmlidXRlfVxuICAgKi9cbiAgY3JlYXRlQXR0cmlidXRlIChuYW1lLCBpdGVtU2l6ZSwgZmFjdG9yeSkge1xuICAgIGNvbnN0IGJ1ZmZlciA9IG5ldyBGbG9hdDMyQXJyYXkodGhpcy5wcmVmYWJDb3VudCAqIHRoaXMucHJlZmFiVmVydGV4Q291bnQgKiBpdGVtU2l6ZSk7XG4gICAgY29uc3QgYXR0cmlidXRlID0gbmV3IEJ1ZmZlckF0dHJpYnV0ZShidWZmZXIsIGl0ZW1TaXplKTtcblxuICAgIHRoaXMuc2V0QXR0cmlidXRlKG5hbWUsIGF0dHJpYnV0ZSk7XG5cbiAgICBpZiAoZmFjdG9yeSkge1xuICAgICAgY29uc3QgZGF0YSA9IFtdO1xuXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucHJlZmFiQ291bnQ7IGkrKykge1xuICAgICAgICBmYWN0b3J5KGRhdGEsIGksIHRoaXMucHJlZmFiQ291bnQpO1xuICAgICAgICB0aGlzLnNldFByZWZhYkRhdGEoYXR0cmlidXRlLCBpLCBkYXRhKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gYXR0cmlidXRlO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgZGF0YSBmb3IgYWxsIHZlcnRpY2VzIG9mIGEgcHJlZmFiIGF0IGEgZ2l2ZW4gaW5kZXguXG4gICAqIFVzdWFsbHkgY2FsbGVkIGluIGEgbG9vcC5cbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd8QnVmZmVyQXR0cmlidXRlfSBhdHRyaWJ1dGUgVGhlIGF0dHJpYnV0ZSBvciBhdHRyaWJ1dGUgbmFtZSB3aGVyZSB0aGUgZGF0YSBpcyB0byBiZSBzdG9yZWQuXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBwcmVmYWJJbmRleCBJbmRleCBvZiB0aGUgcHJlZmFiIGluIHRoZSBidWZmZXIgZ2VvbWV0cnkuXG4gICAqIEBwYXJhbSB7QXJyYXl9IGRhdGEgQXJyYXkgb2YgZGF0YS4gTGVuZ3RoIHNob3VsZCBiZSBlcXVhbCB0byBpdGVtIHNpemUgb2YgdGhlIGF0dHJpYnV0ZS5cbiAgICovXG4gIHNldFByZWZhYkRhdGEgKGF0dHJpYnV0ZSwgcHJlZmFiSW5kZXgsIGRhdGEpIHtcbiAgICBhdHRyaWJ1dGUgPSAodHlwZW9mIGF0dHJpYnV0ZSA9PT0gJ3N0cmluZycpID8gdGhpcy5hdHRyaWJ1dGVzW2F0dHJpYnV0ZV0gOiBhdHRyaWJ1dGU7XG5cbiAgICBsZXQgb2Zmc2V0ID0gcHJlZmFiSW5kZXggKiB0aGlzLnByZWZhYlZlcnRleENvdW50ICogYXR0cmlidXRlLml0ZW1TaXplO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnByZWZhYlZlcnRleENvdW50OyBpKyspIHtcbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgYXR0cmlidXRlLml0ZW1TaXplOyBqKyspIHtcbiAgICAgICAgYXR0cmlidXRlLmFycmF5W29mZnNldCsrXSA9IGRhdGFbal07XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCB7IFByZWZhYkJ1ZmZlckdlb21ldHJ5IH07XG4iLCJpbXBvcnQgeyBCdWZmZXJHZW9tZXRyeSwgQnVmZmVyQXR0cmlidXRlIH0gZnJvbSAndGhyZWUnO1xuXG5jbGFzcyBNdWx0aVByZWZhYkJ1ZmZlckdlb21ldHJ5IGV4dGVuZHMgQnVmZmVyR2VvbWV0cnkge1xuICAvKipcbiAgICogQSBCdWZmZXJHZW9tZXRyeSB3aGVyZSBhICdwcmVmYWInIGdlb21ldHJ5IGFycmF5IGlzIHJlcGVhdGVkIGEgbnVtYmVyIG9mIHRpbWVzLlxuICAgKlxuICAgKiBAcGFyYW0ge0FycmF5fSBwcmVmYWJzIEFuIGFycmF5IHdpdGggR2VvbWV0cnkgaW5zdGFuY2VzIHRvIHJlcGVhdC5cbiAgICogQHBhcmFtIHtOdW1iZXJ9IHJlcGVhdENvdW50IFRoZSBudW1iZXIgb2YgdGltZXMgdG8gcmVwZWF0IHRoZSBhcnJheSBvZiBHZW9tZXRyaWVzLlxuICAgKiBAY29uc3RydWN0b3JcbiAgICovXG4gIGNvbnN0cnVjdG9yIChwcmVmYWJzLCByZXBlYXRDb3VudCkge1xuICAgIHN1cGVyKCk7XG5cbiAgICBpZiAoQXJyYXkuaXNBcnJheShwcmVmYWJzKSkge1xuICAgICAgdGhpcy5wcmVmYWJHZW9tZXRyaWVzID0gcHJlZmFicztcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5wcmVmYWJHZW9tZXRyaWVzID0gW3ByZWZhYnNdO1xuICAgIH1cblxuICAgIHRoaXMucHJlZmFiR2VvbWV0cmllc0NvdW50ID0gdGhpcy5wcmVmYWJHZW9tZXRyaWVzLmxlbmd0aDtcblxuICAgIC8qKlxuICAgICAqIE51bWJlciBvZiBwcmVmYWJzLlxuICAgICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAgICovXG4gICAgdGhpcy5wcmVmYWJDb3VudCA9IHJlcGVhdENvdW50ICogdGhpcy5wcmVmYWJHZW9tZXRyaWVzQ291bnQ7XG4gICAgLyoqXG4gICAgICogSG93IG9mdGVuIHRoZSBwcmVmYWIgYXJyYXkgaXMgcmVwZWF0ZWQuXG4gICAgICogQHR5cGUge051bWJlcn1cbiAgICAgKi9cbiAgICB0aGlzLnJlcGVhdENvdW50ID0gcmVwZWF0Q291bnQ7XG5cbiAgICAvKipcbiAgICAgKiBBcnJheSBvZiB2ZXJ0ZXggY291bnRzIHBlciBwcmVmYWIuXG4gICAgICogQHR5cGUge0FycmF5fVxuICAgICAqL1xuICAgIHRoaXMucHJlZmFiVmVydGV4Q291bnRzID0gdGhpcy5wcmVmYWJHZW9tZXRyaWVzLm1hcChwID0+IHAuaXNCdWZmZXJHZW9tZXRyeSA/IHAuYXR0cmlidXRlcy5wb3NpdGlvbi5jb3VudCA6IHAudmVydGljZXMubGVuZ3RoKTtcbiAgICAvKipcbiAgICAgKiBUb3RhbCBudW1iZXIgb2YgdmVydGljZXMgZm9yIG9uZSByZXBldGl0aW9uIG9mIHRoZSBwcmVmYWJzXG4gICAgICogQHR5cGUge251bWJlcn1cbiAgICAgKi9cbiAgICB0aGlzLnJlcGVhdFZlcnRleENvdW50ID0gdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudHMucmVkdWNlKChyLCB2KSA9PiByICsgdiwgMCk7XG5cbiAgICB0aGlzLmJ1ZmZlckluZGljZXMoKTtcbiAgICB0aGlzLmJ1ZmZlclBvc2l0aW9ucygpO1xuICB9XG5cbiAgYnVmZmVySW5kaWNlcyAoKSB7XG4gICAgbGV0IHJlcGVhdEluZGV4Q291bnQgPSAwO1xuXG4gICAgdGhpcy5wcmVmYWJJbmRpY2VzID0gdGhpcy5wcmVmYWJHZW9tZXRyaWVzLm1hcChnZW9tZXRyeSA9PiB7XG4gICAgICBsZXQgaW5kaWNlcyA9IFtdO1xuXG4gICAgICBpZiAoZ2VvbWV0cnkuaXNCdWZmZXJHZW9tZXRyeSkge1xuICAgICAgICBpZiAoZ2VvbWV0cnkuaW5kZXgpIHtcbiAgICAgICAgICBpbmRpY2VzID0gZ2VvbWV0cnkuaW5kZXguYXJyYXk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBnZW9tZXRyeS5hdHRyaWJ1dGVzLnBvc2l0aW9uLmNvdW50OyBpKyspIHtcbiAgICAgICAgICAgIGluZGljZXMucHVzaChpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZ2VvbWV0cnkuZmFjZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBjb25zdCBmYWNlID0gZ2VvbWV0cnkuZmFjZXNbaV07XG4gICAgICAgICAgaW5kaWNlcy5wdXNoKGZhY2UuYSwgZmFjZS5iLCBmYWNlLmMpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJlcGVhdEluZGV4Q291bnQgKz0gaW5kaWNlcy5sZW5ndGg7XG5cbiAgICAgIHJldHVybiBpbmRpY2VzO1xuICAgIH0pO1xuXG4gICAgY29uc3QgaW5kZXhCdWZmZXIgPSBuZXcgVWludDMyQXJyYXkocmVwZWF0SW5kZXhDb3VudCAqIHRoaXMucmVwZWF0Q291bnQpO1xuICAgIGxldCBpbmRleE9mZnNldCA9IDA7XG4gICAgbGV0IHByZWZhYk9mZnNldCA9IDA7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucHJlZmFiQ291bnQ7IGkrKykge1xuICAgICAgY29uc3QgaW5kZXggPSBpICUgdGhpcy5wcmVmYWJHZW9tZXRyaWVzQ291bnQ7XG4gICAgICBjb25zdCBpbmRpY2VzID0gdGhpcy5wcmVmYWJJbmRpY2VzW2luZGV4XTtcbiAgICAgIGNvbnN0IHZlcnRleENvdW50ID0gdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudHNbaW5kZXhdO1xuXG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGluZGljZXMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgaW5kZXhCdWZmZXJbaW5kZXhPZmZzZXQrK10gPSBpbmRpY2VzW2pdICsgcHJlZmFiT2Zmc2V0O1xuICAgICAgfVxuXG4gICAgICBwcmVmYWJPZmZzZXQgKz0gdmVydGV4Q291bnQ7XG4gICAgfVxuXG4gICAgdGhpcy5zZXRJbmRleChuZXcgQnVmZmVyQXR0cmlidXRlKGluZGV4QnVmZmVyLCAxKSk7XG4gIH1cblxuICBidWZmZXJQb3NpdGlvbnMgKCkge1xuICAgIGNvbnN0IHBvc2l0aW9uQnVmZmVyID0gdGhpcy5jcmVhdGVBdHRyaWJ1dGUoJ3Bvc2l0aW9uJywgMykuYXJyYXk7XG5cbiAgICBjb25zdCBwcmVmYWJQb3NpdGlvbnMgPSB0aGlzLnByZWZhYkdlb21ldHJpZXMubWFwKChnZW9tZXRyeSwgaSkgPT4ge1xuICAgICAgbGV0IHBvc2l0aW9ucztcblxuICAgICAgaWYgKGdlb21ldHJ5LmlzQnVmZmVyR2VvbWV0cnkpIHtcbiAgICAgICAgcG9zaXRpb25zID0gZ2VvbWV0cnkuYXR0cmlidXRlcy5wb3NpdGlvbi5hcnJheTtcbiAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgY29uc3QgdmVydGV4Q291bnQgPSB0aGlzLnByZWZhYlZlcnRleENvdW50c1tpXTtcblxuICAgICAgICBwb3NpdGlvbnMgPSBbXTtcblxuICAgICAgICBmb3IgKGxldCBqID0gMCwgb2Zmc2V0ID0gMDsgaiA8IHZlcnRleENvdW50OyBqKyspIHtcbiAgICAgICAgICBjb25zdCBwcmVmYWJWZXJ0ZXggPSBnZW9tZXRyeS52ZXJ0aWNlc1tqXTtcblxuICAgICAgICAgIHBvc2l0aW9uc1tvZmZzZXQrK10gPSBwcmVmYWJWZXJ0ZXgueDtcbiAgICAgICAgICBwb3NpdGlvbnNbb2Zmc2V0KytdID0gcHJlZmFiVmVydGV4Lnk7XG4gICAgICAgICAgcG9zaXRpb25zW29mZnNldCsrXSA9IHByZWZhYlZlcnRleC56O1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBwb3NpdGlvbnM7XG4gICAgfSk7XG5cbiAgICBmb3IgKGxldCBpID0gMCwgb2Zmc2V0ID0gMDsgaSA8IHRoaXMucHJlZmFiQ291bnQ7IGkrKykge1xuICAgICAgY29uc3QgaW5kZXggPSBpICUgdGhpcy5wcmVmYWJHZW9tZXRyaWVzLmxlbmd0aDtcbiAgICAgIGNvbnN0IHZlcnRleENvdW50ID0gdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudHNbaW5kZXhdO1xuICAgICAgY29uc3QgcG9zaXRpb25zID0gcHJlZmFiUG9zaXRpb25zW2luZGV4XTtcblxuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCB2ZXJ0ZXhDb3VudDsgaisrKSB7XG4gICAgICAgIHBvc2l0aW9uQnVmZmVyW29mZnNldCsrXSA9IHBvc2l0aW9uc1tqICogM107XG4gICAgICAgIHBvc2l0aW9uQnVmZmVyW29mZnNldCsrXSA9IHBvc2l0aW9uc1tqICogMyArIDFdO1xuICAgICAgICBwb3NpdGlvbkJ1ZmZlcltvZmZzZXQrK10gPSBwb3NpdGlvbnNbaiAqIDMgKyAyXTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIEJ1ZmZlckF0dHJpYnV0ZSB3aXRoIFVWIGNvb3JkaW5hdGVzLlxuICAgKi9cbiAgYnVmZmVyVXZzICgpIHtcbiAgICBjb25zdCB1dkJ1ZmZlciA9IHRoaXMuY3JlYXRlQXR0cmlidXRlKCd1dicsIDIpLmFycmF5O1xuICAgIGNvbnN0IHByZWZhYlV2cyA9IHRoaXMucHJlZmFiR2VvbWV0cmllcy5tYXAoKGdlb21ldHJ5LCBpKSA9PiB7XG4gICAgICBsZXQgdXZzO1xuXG4gICAgICBpZiAoZ2VvbWV0cnkuaXNCdWZmZXJHZW9tZXRyeSkge1xuICAgICAgICBpZiAoIWdlb21ldHJ5LmF0dHJpYnV0ZXMudXYpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKCdObyBVViBmb3VuZCBpbiBwcmVmYWIgZ2VvbWV0cnknLCBnZW9tZXRyeSk7XG4gICAgICAgIH1cblxuICAgICAgICB1dnMgPSBnZW9tZXRyeS5hdHRyaWJ1dGVzLnV2LmFycmF5O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgcHJlZmFiRmFjZUNvdW50ID0gdGhpcy5wcmVmYWJJbmRpY2VzW2ldLmxlbmd0aCAvIDM7XG4gICAgICAgIGNvbnN0IHV2T2JqZWN0cyA9IFtdO1xuXG4gICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgcHJlZmFiRmFjZUNvdW50OyBqKyspIHtcbiAgICAgICAgICBjb25zdCBmYWNlID0gZ2VvbWV0cnkuZmFjZXNbal07XG4gICAgICAgICAgY29uc3QgdXYgPSBnZW9tZXRyeS5mYWNlVmVydGV4VXZzWzBdW2pdO1xuXG4gICAgICAgICAgdXZPYmplY3RzW2ZhY2UuYV0gPSB1dlswXTtcbiAgICAgICAgICB1dk9iamVjdHNbZmFjZS5iXSA9IHV2WzFdO1xuICAgICAgICAgIHV2T2JqZWN0c1tmYWNlLmNdID0gdXZbMl07XG4gICAgICAgIH1cblxuICAgICAgICB1dnMgPSBbXTtcblxuICAgICAgICBmb3IgKGxldCBrID0gMDsgayA8IHV2T2JqZWN0cy5sZW5ndGg7IGsrKykge1xuICAgICAgICAgIHV2c1trICogMl0gPSB1dk9iamVjdHNba10ueDtcbiAgICAgICAgICB1dnNbayAqIDIgKyAxXSA9IHV2T2JqZWN0c1trXS55O1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB1dnM7XG4gICAgfSk7XG5cbiAgICBmb3IgKGxldCBpID0gMCwgb2Zmc2V0ID0gMDsgaSA8IHRoaXMucHJlZmFiQ291bnQ7IGkrKykge1xuXG4gICAgICBjb25zdCBpbmRleCA9IGkgJSB0aGlzLnByZWZhYkdlb21ldHJpZXMubGVuZ3RoO1xuICAgICAgY29uc3QgdmVydGV4Q291bnQgPSB0aGlzLnByZWZhYlZlcnRleENvdW50c1tpbmRleF07XG4gICAgICBjb25zdCB1dnMgPSBwcmVmYWJVdnNbaW5kZXhdO1xuXG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHZlcnRleENvdW50OyBqKyspIHtcbiAgICAgICAgdXZCdWZmZXJbb2Zmc2V0KytdID0gdXZzW2ogKiAyXTtcbiAgICAgICAgdXZCdWZmZXJbb2Zmc2V0KytdID0gdXZzW2ogKiAyICsgMV07XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBCdWZmZXJBdHRyaWJ1dGUgb24gdGhpcyBnZW9tZXRyeSBpbnN0YW5jZS5cbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgTmFtZSBvZiB0aGUgYXR0cmlidXRlLlxuICAgKiBAcGFyYW0ge051bWJlcn0gaXRlbVNpemUgTnVtYmVyIG9mIGZsb2F0cyBwZXIgdmVydGV4ICh0eXBpY2FsbHkgMSwgMiwgMyBvciA0KS5cbiAgICogQHBhcmFtIHtmdW5jdGlvbj19IGZhY3RvcnkgRnVuY3Rpb24gdGhhdCB3aWxsIGJlIGNhbGxlZCBmb3IgZWFjaCBwcmVmYWIgdXBvbiBjcmVhdGlvbi4gQWNjZXB0cyAzIGFyZ3VtZW50czogZGF0YVtdLCBpbmRleCBhbmQgcHJlZmFiQ291bnQuIENhbGxzIHNldFByZWZhYkRhdGEuXG4gICAqXG4gICAqIEByZXR1cm5zIHtCdWZmZXJBdHRyaWJ1dGV9XG4gICAqL1xuICAgY3JlYXRlQXR0cmlidXRlIChuYW1lLCBpdGVtU2l6ZSwgZmFjdG9yeSkge1xuICAgIGNvbnN0IGJ1ZmZlciA9IG5ldyBGbG9hdDMyQXJyYXkodGhpcy5yZXBlYXRDb3VudCAqIHRoaXMucmVwZWF0VmVydGV4Q291bnQgKiBpdGVtU2l6ZSk7XG4gICAgY29uc3QgYXR0cmlidXRlID0gbmV3IEJ1ZmZlckF0dHJpYnV0ZShidWZmZXIsIGl0ZW1TaXplKTtcblxuICAgIHRoaXMuc2V0QXR0cmlidXRlKG5hbWUsIGF0dHJpYnV0ZSk7XG5cbiAgICBpZiAoZmFjdG9yeSkge1xuICAgICAgY29uc3QgZGF0YSA9IFtdO1xuXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucHJlZmFiQ291bnQ7IGkrKykge1xuICAgICAgICBmYWN0b3J5KGRhdGEsIGksIHRoaXMucHJlZmFiQ291bnQpO1xuICAgICAgICB0aGlzLnNldFByZWZhYkRhdGEoYXR0cmlidXRlLCBpLCBkYXRhKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gYXR0cmlidXRlO1xuICAgfVxuXG4gICAvKipcbiAgICogU2V0cyBkYXRhIGZvciBhbGwgdmVydGljZXMgb2YgYSBwcmVmYWIgYXQgYSBnaXZlbiBpbmRleC5cbiAgICogVXN1YWxseSBjYWxsZWQgaW4gYSBsb29wLlxuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ3xCdWZmZXJBdHRyaWJ1dGV9IGF0dHJpYnV0ZSBUaGUgYXR0cmlidXRlIG9yIGF0dHJpYnV0ZSBuYW1lIHdoZXJlIHRoZSBkYXRhIGlzIHRvIGJlIHN0b3JlZC5cbiAgICogQHBhcmFtIHtOdW1iZXJ9IHByZWZhYkluZGV4IEluZGV4IG9mIHRoZSBwcmVmYWIgaW4gdGhlIGJ1ZmZlciBnZW9tZXRyeS5cbiAgICogQHBhcmFtIHtBcnJheX0gZGF0YSBBcnJheSBvZiBkYXRhLiBMZW5ndGggc2hvdWxkIGJlIGVxdWFsIHRvIGl0ZW0gc2l6ZSBvZiB0aGUgYXR0cmlidXRlLlxuICAgKi9cbiAgc2V0UHJlZmFiRGF0YSAoYXR0cmlidXRlLCBwcmVmYWJJbmRleCwgZGF0YSkge1xuICAgIGF0dHJpYnV0ZSA9ICh0eXBlb2YgYXR0cmlidXRlID09PSAnc3RyaW5nJykgPyB0aGlzLmF0dHJpYnV0ZXNbYXR0cmlidXRlXSA6IGF0dHJpYnV0ZTtcblxuICAgIGNvbnN0IHByZWZhYkdlb21ldHJ5SW5kZXggPSBwcmVmYWJJbmRleCAlIHRoaXMucHJlZmFiR2VvbWV0cmllc0NvdW50O1xuICAgIGNvbnN0IHByZWZhYkdlb21ldHJ5VmVydGV4Q291bnQgPSB0aGlzLnByZWZhYlZlcnRleENvdW50c1twcmVmYWJHZW9tZXRyeUluZGV4XTtcbiAgICBjb25zdCB3aG9sZSA9IChwcmVmYWJJbmRleCAvIHRoaXMucHJlZmFiR2VvbWV0cmllc0NvdW50IHwgMCkgKiB0aGlzLnByZWZhYkdlb21ldHJpZXNDb3VudDtcbiAgICBjb25zdCB3aG9sZU9mZnNldCA9IHdob2xlICogdGhpcy5yZXBlYXRWZXJ0ZXhDb3VudDtcbiAgICBjb25zdCBwYXJ0ID0gcHJlZmFiSW5kZXggLSB3aG9sZTtcbiAgICBsZXQgcGFydE9mZnNldCA9IDA7XG4gICAgbGV0IGkgPSAwO1xuXG4gICAgd2hpbGUoaSA8IHBhcnQpIHtcbiAgICAgIHBhcnRPZmZzZXQgKz0gdGhpcy5wcmVmYWJWZXJ0ZXhDb3VudHNbaSsrXTtcbiAgICB9XG5cbiAgICBsZXQgb2Zmc2V0ID0gKHdob2xlT2Zmc2V0ICsgcGFydE9mZnNldCkgKiBhdHRyaWJ1dGUuaXRlbVNpemU7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHByZWZhYkdlb21ldHJ5VmVydGV4Q291bnQ7IGkrKykge1xuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBhdHRyaWJ1dGUuaXRlbVNpemU7IGorKykge1xuICAgICAgICBhdHRyaWJ1dGUuYXJyYXlbb2Zmc2V0KytdID0gZGF0YVtqXTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IHsgTXVsdGlQcmVmYWJCdWZmZXJHZW9tZXRyeSB9O1xuIiwiaW1wb3J0IHsgSW5zdGFuY2VkQnVmZmVyR2VvbWV0cnksIEluc3RhbmNlZEJ1ZmZlckF0dHJpYnV0ZSB9IGZyb20gJ3RocmVlJztcblxuY2xhc3MgSW5zdGFuY2VkUHJlZmFiQnVmZmVyR2VvbWV0cnkgZXh0ZW5kcyBJbnN0YW5jZWRCdWZmZXJHZW9tZXRyeSB7XG4gIC8qKlxuICAgKiBBIHdyYXBwZXIgYXJvdW5kIFRIUkVFLkluc3RhbmNlZEJ1ZmZlckdlb21ldHJ5LCB3aGljaCBpcyBtb3JlIG1lbW9yeSBlZmZpY2llbnQgdGhhbiBQcmVmYWJCdWZmZXJHZW9tZXRyeSwgYnV0IHJlcXVpcmVzIHRoZSBBTkdMRV9pbnN0YW5jZWRfYXJyYXlzIGV4dGVuc2lvbi5cbiAgICpcbiAgICogQHBhcmFtIHtCdWZmZXJHZW9tZXRyeX0gcHJlZmFiIFRoZSBHZW9tZXRyeSBpbnN0YW5jZSB0byByZXBlYXQuXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBjb3VudCBUaGUgbnVtYmVyIG9mIHRpbWVzIHRvIHJlcGVhdCB0aGUgZ2VvbWV0cnkuXG4gICAqL1xuICBjb25zdHJ1Y3RvciAocHJlZmFiLCBjb3VudCkge1xuICAgIHN1cGVyKCk7XG5cbiAgICB0aGlzLnByZWZhYkdlb21ldHJ5ID0gcHJlZmFiO1xuICAgIHRoaXMuY29weShwcmVmYWIpO1xuXG4gICAgdGhpcy5pbnN0YW5jZUNvdW50ID0gY291bnRcbiAgICB0aGlzLnByZWZhYkNvdW50ID0gY291bnQ7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIEJ1ZmZlckF0dHJpYnV0ZSBvbiB0aGlzIGdlb21ldHJ5IGluc3RhbmNlLlxuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gbmFtZSBOYW1lIG9mIHRoZSBhdHRyaWJ1dGUuXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBpdGVtU2l6ZSBOdW1iZXIgb2YgZmxvYXRzIHBlciB2ZXJ0ZXggKHR5cGljYWxseSAxLCAyLCAzIG9yIDQpLlxuICAgKiBAcGFyYW0ge2Z1bmN0aW9uPX0gZmFjdG9yeSBGdW5jdGlvbiB0aGF0IHdpbGwgYmUgY2FsbGVkIGZvciBlYWNoIHByZWZhYiB1cG9uIGNyZWF0aW9uLiBBY2NlcHRzIDMgYXJndW1lbnRzOiBkYXRhW10sIGluZGV4IGFuZCBwcmVmYWJDb3VudC4gQ2FsbHMgc2V0UHJlZmFiRGF0YS5cbiAgICpcbiAgICogQHJldHVybnMge0J1ZmZlckF0dHJpYnV0ZX1cbiAgICovXG4gIGNyZWF0ZUF0dHJpYnV0ZSAobmFtZSwgaXRlbVNpemUsIGZhY3RvcnkpIHtcbiAgICBjb25zdCBidWZmZXIgPSBuZXcgRmxvYXQzMkFycmF5KHRoaXMucHJlZmFiQ291bnQgKiBpdGVtU2l6ZSk7XG4gICAgY29uc3QgYXR0cmlidXRlID0gbmV3IEluc3RhbmNlZEJ1ZmZlckF0dHJpYnV0ZShidWZmZXIsIGl0ZW1TaXplKTtcblxuICAgIHRoaXMuc2V0QXR0cmlidXRlKG5hbWUsIGF0dHJpYnV0ZSk7XG5cbiAgICBpZiAoZmFjdG9yeSkge1xuICAgICAgY29uc3QgZGF0YSA9IFtdO1xuXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucHJlZmFiQ291bnQ7IGkrKykge1xuICAgICAgICBmYWN0b3J5KGRhdGEsIGksIHRoaXMucHJlZmFiQ291bnQpO1xuICAgICAgICB0aGlzLnNldFByZWZhYkRhdGEoYXR0cmlidXRlLCBpLCBkYXRhKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gYXR0cmlidXRlO1xuICB9O1xuXG4gIC8qKlxuICAgKiBTZXRzIGRhdGEgZm9yIGEgcHJlZmFiIGF0IGEgZ2l2ZW4gaW5kZXguXG4gICAqIFVzdWFsbHkgY2FsbGVkIGluIGEgbG9vcC5cbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd8QnVmZmVyQXR0cmlidXRlfSBhdHRyaWJ1dGUgVGhlIGF0dHJpYnV0ZSBvciBhdHRyaWJ1dGUgbmFtZSB3aGVyZSB0aGUgZGF0YSBpcyB0byBiZSBzdG9yZWQuXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBwcmVmYWJJbmRleCBJbmRleCBvZiB0aGUgcHJlZmFiIGluIHRoZSBidWZmZXIgZ2VvbWV0cnkuXG4gICAqIEBwYXJhbSB7QXJyYXl9IGRhdGEgQXJyYXkgb2YgZGF0YS4gTGVuZ3RoIHNob3VsZCBiZSBlcXVhbCB0byBpdGVtIHNpemUgb2YgdGhlIGF0dHJpYnV0ZS5cbiAgICovXG4gIHNldFByZWZhYkRhdGEgKGF0dHJpYnV0ZSwgcHJlZmFiSW5kZXgsIGRhdGEpIHtcbiAgICBhdHRyaWJ1dGUgPSAodHlwZW9mIGF0dHJpYnV0ZSA9PT0gJ3N0cmluZycpID8gdGhpcy5hdHRyaWJ1dGVzW2F0dHJpYnV0ZV0gOiBhdHRyaWJ1dGU7XG5cbiAgICBsZXQgb2Zmc2V0ID0gcHJlZmFiSW5kZXggKiBhdHRyaWJ1dGUuaXRlbVNpemU7XG5cbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IGF0dHJpYnV0ZS5pdGVtU2l6ZTsgaisrKSB7XG4gICAgICBhdHRyaWJ1dGUuYXJyYXlbb2Zmc2V0KytdID0gZGF0YVtqXTtcbiAgICB9XG4gIH07XG59O1xuXG5leHBvcnQgeyBJbnN0YW5jZWRQcmVmYWJCdWZmZXJHZW9tZXRyeSB9O1xuIiwiaW1wb3J0IHsgTWF0aCBhcyB0TWF0aCwgVmVjdG9yMyB9IGZyb20gJ3RocmVlJztcbmltcG9ydCB7IERlcHRoQW5pbWF0aW9uTWF0ZXJpYWwgfSBmcm9tICcuL21hdGVyaWFscy9EZXB0aEFuaW1hdGlvbk1hdGVyaWFsJztcbmltcG9ydCB7IERpc3RhbmNlQW5pbWF0aW9uTWF0ZXJpYWwgfSBmcm9tICcuL21hdGVyaWFscy9EaXN0YW5jZUFuaW1hdGlvbk1hdGVyaWFsJztcblxuLyoqXG4gKiBDb2xsZWN0aW9uIG9mIHV0aWxpdHkgZnVuY3Rpb25zLlxuICogQG5hbWVzcGFjZVxuICovXG5jb25zdCBVdGlscyA9IHtcbiAgLyoqXG4gICAqIER1cGxpY2F0ZXMgdmVydGljZXMgc28gZWFjaCBmYWNlIGJlY29tZXMgc2VwYXJhdGUuXG4gICAqIFNhbWUgYXMgVEhSRUUuRXhwbG9kZU1vZGlmaWVyLlxuICAgKlxuICAgKiBAcGFyYW0ge1RIUkVFLkdlb21ldHJ5fSBnZW9tZXRyeSBHZW9tZXRyeSBpbnN0YW5jZSB0byBtb2RpZnkuXG4gICAqL1xuICBzZXBhcmF0ZUZhY2VzOiBmdW5jdGlvbiAoZ2VvbWV0cnkpIHtcbiAgICBsZXQgdmVydGljZXMgPSBbXTtcblxuICAgIGZvciAobGV0IGkgPSAwLCBpbCA9IGdlb21ldHJ5LmZhY2VzLmxlbmd0aDsgaSA8IGlsOyBpKyspIHtcbiAgICAgIGxldCBuID0gdmVydGljZXMubGVuZ3RoO1xuICAgICAgbGV0IGZhY2UgPSBnZW9tZXRyeS5mYWNlc1tpXTtcblxuICAgICAgbGV0IGEgPSBmYWNlLmE7XG4gICAgICBsZXQgYiA9IGZhY2UuYjtcbiAgICAgIGxldCBjID0gZmFjZS5jO1xuXG4gICAgICBsZXQgdmEgPSBnZW9tZXRyeS52ZXJ0aWNlc1thXTtcbiAgICAgIGxldCB2YiA9IGdlb21ldHJ5LnZlcnRpY2VzW2JdO1xuICAgICAgbGV0IHZjID0gZ2VvbWV0cnkudmVydGljZXNbY107XG5cbiAgICAgIHZlcnRpY2VzLnB1c2godmEuY2xvbmUoKSk7XG4gICAgICB2ZXJ0aWNlcy5wdXNoKHZiLmNsb25lKCkpO1xuICAgICAgdmVydGljZXMucHVzaCh2Yy5jbG9uZSgpKTtcblxuICAgICAgZmFjZS5hID0gbjtcbiAgICAgIGZhY2UuYiA9IG4gKyAxO1xuICAgICAgZmFjZS5jID0gbiArIDI7XG4gICAgfVxuXG4gICAgZ2VvbWV0cnkudmVydGljZXMgPSB2ZXJ0aWNlcztcbiAgfSxcblxuICAvKipcbiAgICogQ29tcHV0ZSB0aGUgY2VudHJvaWQgKGNlbnRlcikgb2YgYSBUSFJFRS5GYWNlMy5cbiAgICpcbiAgICogQHBhcmFtIHtUSFJFRS5HZW9tZXRyeX0gZ2VvbWV0cnkgR2VvbWV0cnkgaW5zdGFuY2UgdGhlIGZhY2UgaXMgaW4uXG4gICAqIEBwYXJhbSB7VEhSRUUuRmFjZTN9IGZhY2UgRmFjZSBvYmplY3QgZnJvbSB0aGUgVEhSRUUuR2VvbWV0cnkuZmFjZXMgYXJyYXlcbiAgICogQHBhcmFtIHtUSFJFRS5WZWN0b3IzPX0gdiBPcHRpb25hbCB2ZWN0b3IgdG8gc3RvcmUgcmVzdWx0IGluLlxuICAgKiBAcmV0dXJucyB7VEhSRUUuVmVjdG9yM31cbiAgICovXG4gIGNvbXB1dGVDZW50cm9pZDogZnVuY3Rpb24oZ2VvbWV0cnksIGZhY2UsIHYpIHtcbiAgICBsZXQgYSA9IGdlb21ldHJ5LnZlcnRpY2VzW2ZhY2UuYV07XG4gICAgbGV0IGIgPSBnZW9tZXRyeS52ZXJ0aWNlc1tmYWNlLmJdO1xuICAgIGxldCBjID0gZ2VvbWV0cnkudmVydGljZXNbZmFjZS5jXTtcblxuICAgIHYgPSB2IHx8IG5ldyBWZWN0b3IzKCk7XG5cbiAgICB2LnggPSAoYS54ICsgYi54ICsgYy54KSAvIDM7XG4gICAgdi55ID0gKGEueSArIGIueSArIGMueSkgLyAzO1xuICAgIHYueiA9IChhLnogKyBiLnogKyBjLnopIC8gMztcblxuICAgIHJldHVybiB2O1xuICB9LFxuXG4gIC8qKlxuICAgKiBHZXQgYSByYW5kb20gdmVjdG9yIGJldHdlZW4gYm94Lm1pbiBhbmQgYm94Lm1heC5cbiAgICpcbiAgICogQHBhcmFtIHtUSFJFRS5Cb3gzfSBib3ggVEhSRUUuQm94MyBpbnN0YW5jZS5cbiAgICogQHBhcmFtIHtUSFJFRS5WZWN0b3IzPX0gdiBPcHRpb25hbCB2ZWN0b3IgdG8gc3RvcmUgcmVzdWx0IGluLlxuICAgKiBAcmV0dXJucyB7VEhSRUUuVmVjdG9yM31cbiAgICovXG4gIHJhbmRvbUluQm94OiBmdW5jdGlvbihib3gsIHYpIHtcbiAgICB2ID0gdiB8fCBuZXcgVmVjdG9yMygpO1xuXG4gICAgdi54ID0gdE1hdGgucmFuZEZsb2F0KGJveC5taW4ueCwgYm94Lm1heC54KTtcbiAgICB2LnkgPSB0TWF0aC5yYW5kRmxvYXQoYm94Lm1pbi55LCBib3gubWF4LnkpO1xuICAgIHYueiA9IHRNYXRoLnJhbmRGbG9hdChib3gubWluLnosIGJveC5tYXgueik7XG5cbiAgICByZXR1cm4gdjtcbiAgfSxcblxuICAvKipcbiAgICogR2V0IGEgcmFuZG9tIGF4aXMgZm9yIHF1YXRlcm5pb24gcm90YXRpb24uXG4gICAqXG4gICAqIEBwYXJhbSB7VEhSRUUuVmVjdG9yMz19IHYgT3B0aW9uIHZlY3RvciB0byBzdG9yZSByZXN1bHQgaW4uXG4gICAqIEByZXR1cm5zIHtUSFJFRS5WZWN0b3IzfVxuICAgKi9cbiAgcmFuZG9tQXhpczogZnVuY3Rpb24odikge1xuICAgIHYgPSB2IHx8IG5ldyBWZWN0b3IzKCk7XG5cbiAgICB2LnggPSB0TWF0aC5yYW5kRmxvYXRTcHJlYWQoMi4wKTtcbiAgICB2LnkgPSB0TWF0aC5yYW5kRmxvYXRTcHJlYWQoMi4wKTtcbiAgICB2LnogPSB0TWF0aC5yYW5kRmxvYXRTcHJlYWQoMi4wKTtcbiAgICB2Lm5vcm1hbGl6ZSgpO1xuXG4gICAgcmV0dXJuIHY7XG4gIH0sXG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIFRIUkVFLkJBUy5EZXB0aEFuaW1hdGlvbk1hdGVyaWFsIGZvciBzaGFkb3dzIGZyb20gYSBUSFJFRS5TcG90TGlnaHQgb3IgVEhSRUUuRGlyZWN0aW9uYWxMaWdodCBieSBjb3B5aW5nIHJlbGV2YW50IHNoYWRlciBjaHVua3MuXG4gICAqIFVuaWZvcm0gdmFsdWVzIG11c3QgYmUgbWFudWFsbHkgc3luY2VkIGJldHdlZW4gdGhlIHNvdXJjZSBtYXRlcmlhbCBhbmQgdGhlIGRlcHRoIG1hdGVyaWFsLlxuICAgKlxuICAgKiBAc2VlIHtAbGluayBodHRwOi8vdGhyZWUtYmFzLWV4YW1wbGVzLnN1cmdlLnNoL2V4YW1wbGVzL3NoYWRvd3MvfVxuICAgKlxuICAgKiBAcGFyYW0ge1RIUkVFLkJBUy5CYXNlQW5pbWF0aW9uTWF0ZXJpYWx9IHNvdXJjZU1hdGVyaWFsIEluc3RhbmNlIHRvIGdldCB0aGUgc2hhZGVyIGNodW5rcyBmcm9tLlxuICAgKiBAcmV0dXJucyB7VEhSRUUuQkFTLkRlcHRoQW5pbWF0aW9uTWF0ZXJpYWx9XG4gICAqL1xuICBjcmVhdGVEZXB0aEFuaW1hdGlvbk1hdGVyaWFsOiBmdW5jdGlvbihzb3VyY2VNYXRlcmlhbCkge1xuICAgIHJldHVybiBuZXcgRGVwdGhBbmltYXRpb25NYXRlcmlhbCh7XG4gICAgICB1bmlmb3Jtczogc291cmNlTWF0ZXJpYWwudW5pZm9ybXMsXG4gICAgICBkZWZpbmVzOiBzb3VyY2VNYXRlcmlhbC5kZWZpbmVzLFxuICAgICAgdmVydGV4RnVuY3Rpb25zOiBzb3VyY2VNYXRlcmlhbC52ZXJ0ZXhGdW5jdGlvbnMsXG4gICAgICB2ZXJ0ZXhQYXJhbWV0ZXJzOiBzb3VyY2VNYXRlcmlhbC52ZXJ0ZXhQYXJhbWV0ZXJzLFxuICAgICAgdmVydGV4SW5pdDogc291cmNlTWF0ZXJpYWwudmVydGV4SW5pdCxcbiAgICAgIHZlcnRleFBvc2l0aW9uOiBzb3VyY2VNYXRlcmlhbC52ZXJ0ZXhQb3NpdGlvblxuICAgIH0pO1xuICB9LFxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBUSFJFRS5CQVMuRGlzdGFuY2VBbmltYXRpb25NYXRlcmlhbCBmb3Igc2hhZG93cyBmcm9tIGEgVEhSRUUuUG9pbnRMaWdodCBieSBjb3B5aW5nIHJlbGV2YW50IHNoYWRlciBjaHVua3MuXG4gICAqIFVuaWZvcm0gdmFsdWVzIG11c3QgYmUgbWFudWFsbHkgc3luY2VkIGJldHdlZW4gdGhlIHNvdXJjZSBtYXRlcmlhbCBhbmQgdGhlIGRpc3RhbmNlIG1hdGVyaWFsLlxuICAgKlxuICAgKiBAc2VlIHtAbGluayBodHRwOi8vdGhyZWUtYmFzLWV4YW1wbGVzLnN1cmdlLnNoL2V4YW1wbGVzL3NoYWRvd3MvfVxuICAgKlxuICAgKiBAcGFyYW0ge1RIUkVFLkJBUy5CYXNlQW5pbWF0aW9uTWF0ZXJpYWx9IHNvdXJjZU1hdGVyaWFsIEluc3RhbmNlIHRvIGdldCB0aGUgc2hhZGVyIGNodW5rcyBmcm9tLlxuICAgKiBAcmV0dXJucyB7VEhSRUUuQkFTLkRpc3RhbmNlQW5pbWF0aW9uTWF0ZXJpYWx9XG4gICAqL1xuICBjcmVhdGVEaXN0YW5jZUFuaW1hdGlvbk1hdGVyaWFsOiBmdW5jdGlvbihzb3VyY2VNYXRlcmlhbCkge1xuICAgIHJldHVybiBuZXcgRGlzdGFuY2VBbmltYXRpb25NYXRlcmlhbCh7XG4gICAgICB1bmlmb3Jtczogc291cmNlTWF0ZXJpYWwudW5pZm9ybXMsXG4gICAgICBkZWZpbmVzOiBzb3VyY2VNYXRlcmlhbC5kZWZpbmVzLFxuICAgICAgdmVydGV4RnVuY3Rpb25zOiBzb3VyY2VNYXRlcmlhbC52ZXJ0ZXhGdW5jdGlvbnMsXG4gICAgICB2ZXJ0ZXhQYXJhbWV0ZXJzOiBzb3VyY2VNYXRlcmlhbC52ZXJ0ZXhQYXJhbWV0ZXJzLFxuICAgICAgdmVydGV4SW5pdDogc291cmNlTWF0ZXJpYWwudmVydGV4SW5pdCxcbiAgICAgIHZlcnRleFBvc2l0aW9uOiBzb3VyY2VNYXRlcmlhbC52ZXJ0ZXhQb3NpdGlvblxuICAgIH0pO1xuICB9XG59O1xuXG5leHBvcnQgeyBVdGlscyB9O1xuIiwiaW1wb3J0IHsgQnVmZmVyR2VvbWV0cnksIEJ1ZmZlckF0dHJpYnV0ZSB9IGZyb20gJ3RocmVlJztcbmltcG9ydCB7IFV0aWxzIH0gZnJvbSAnLi4vVXRpbHMnO1xuXG5jbGFzcyBNb2RlbEJ1ZmZlckdlb21ldHJ5IGV4dGVuZHMgQnVmZmVyR2VvbWV0cnkge1xuICAvKipcbiAgICogQSBUSFJFRS5CdWZmZXJHZW9tZXRyeSBmb3IgYW5pbWF0aW5nIGluZGl2aWR1YWwgZmFjZXMgb2YgYSBUSFJFRS5HZW9tZXRyeS5cbiAgICpcbiAgICogQHBhcmFtIHtUSFJFRS5HZW9tZXRyeX0gbW9kZWwgVGhlIFRIUkVFLkdlb21ldHJ5IHRvIGJhc2UgdGhpcyBnZW9tZXRyeSBvbi5cbiAgICogQHBhcmFtIHtPYmplY3Q9fSBvcHRpb25zXG4gICAqIEBwYXJhbSB7Qm9vbGVhbj19IG9wdGlvbnMuY29tcHV0ZUNlbnRyb2lkcyBJZiB0cnVlLCBhIGNlbnRyb2lkcyB3aWxsIGJlIGNvbXB1dGVkIGZvciBlYWNoIGZhY2UgYW5kIHN0b3JlZCBpbiBUSFJFRS5CQVMuTW9kZWxCdWZmZXJHZW9tZXRyeS5jZW50cm9pZHMuXG4gICAqIEBwYXJhbSB7Qm9vbGVhbj19IG9wdGlvbnMubG9jYWxpemVGYWNlcyBJZiB0cnVlLCB0aGUgcG9zaXRpb25zIGZvciBlYWNoIGZhY2Ugd2lsbCBiZSBzdG9yZWQgcmVsYXRpdmUgdG8gdGhlIGNlbnRyb2lkLiBUaGlzIGlzIHVzZWZ1bCBpZiB5b3Ugd2FudCB0byByb3RhdGUgb3Igc2NhbGUgZmFjZXMgYXJvdW5kIHRoZWlyIGNlbnRlci5cbiAgICovXG4gIGNvbnN0cnVjdG9yIChtb2RlbCwgb3B0aW9ucykge1xuICAgIHN1cGVyKCk7XG5cbiAgICAvKipcbiAgICAgKiBBIHJlZmVyZW5jZSB0byB0aGUgZ2VvbWV0cnkgdXNlZCB0byBjcmVhdGUgdGhpcyBpbnN0YW5jZS5cbiAgICAgKiBAdHlwZSB7VEhSRUUuR2VvbWV0cnl9XG4gICAgICovXG4gICAgdGhpcy5tb2RlbEdlb21ldHJ5ID0gbW9kZWw7XG5cbiAgICAvKipcbiAgICAgKiBOdW1iZXIgb2YgZmFjZXMgb2YgdGhlIG1vZGVsLlxuICAgICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAgICovXG4gICAgdGhpcy5mYWNlQ291bnQgPSB0aGlzLm1vZGVsR2VvbWV0cnkuZmFjZXMubGVuZ3RoO1xuXG4gICAgLyoqXG4gICAgICogTnVtYmVyIG9mIHZlcnRpY2VzIG9mIHRoZSBtb2RlbC5cbiAgICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgICAqL1xuICAgIHRoaXMudmVydGV4Q291bnQgPSB0aGlzLm1vZGVsR2VvbWV0cnkudmVydGljZXMubGVuZ3RoO1xuXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgb3B0aW9ucy5jb21wdXRlQ2VudHJvaWRzICYmIHRoaXMuY29tcHV0ZUNlbnRyb2lkcygpO1xuXG4gICAgdGhpcy5idWZmZXJJbmRpY2VzKCk7XG4gICAgdGhpcy5idWZmZXJQb3NpdGlvbnMob3B0aW9ucy5sb2NhbGl6ZUZhY2VzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb21wdXRlcyBhIGNlbnRyb2lkIGZvciBlYWNoIGZhY2UgYW5kIHN0b3JlcyBpdCBpbiBUSFJFRS5CQVMuTW9kZWxCdWZmZXJHZW9tZXRyeS5jZW50cm9pZHMuXG4gICAqL1xuICBjb21wdXRlQ2VudHJvaWRzICgpIHtcbiAgICAvKipcbiAgICAgKiBBbiBhcnJheSBvZiBjZW50cm9pZHMgY29ycmVzcG9uZGluZyB0byB0aGUgZmFjZXMgb2YgdGhlIG1vZGVsLlxuICAgICAqXG4gICAgICogQHR5cGUge0FycmF5fVxuICAgICAqL1xuICAgIHRoaXMuY2VudHJvaWRzID0gW107XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuZmFjZUNvdW50OyBpKyspIHtcbiAgICAgIHRoaXMuY2VudHJvaWRzW2ldID0gVXRpbHMuY29tcHV0ZUNlbnRyb2lkKHRoaXMubW9kZWxHZW9tZXRyeSwgdGhpcy5tb2RlbEdlb21ldHJ5LmZhY2VzW2ldKTtcbiAgICB9XG4gIH1cblxuICBidWZmZXJJbmRpY2VzICgpIHtcbiAgICBjb25zdCBpbmRleEJ1ZmZlciA9IG5ldyBVaW50MzJBcnJheSh0aGlzLmZhY2VDb3VudCAqIDMpO1xuXG4gICAgdGhpcy5zZXRJbmRleChuZXcgQnVmZmVyQXR0cmlidXRlKGluZGV4QnVmZmVyLCAxKSk7XG5cbiAgICBmb3IgKGxldCBpID0gMCwgb2Zmc2V0ID0gMDsgaSA8IHRoaXMuZmFjZUNvdW50OyBpKyssIG9mZnNldCArPSAzKSB7XG4gICAgICBjb25zdCBmYWNlID0gdGhpcy5tb2RlbEdlb21ldHJ5LmZhY2VzW2ldO1xuXG4gICAgICBpbmRleEJ1ZmZlcltvZmZzZXQgICAgXSA9IGZhY2UuYTtcbiAgICAgIGluZGV4QnVmZmVyW29mZnNldCArIDFdID0gZmFjZS5iO1xuICAgICAgaW5kZXhCdWZmZXJbb2Zmc2V0ICsgMl0gPSBmYWNlLmM7XG4gICAgfVxuICB9XG5cbiAgYnVmZmVyUG9zaXRpb25zIChsb2NhbGl6ZUZhY2VzKSB7XG4gICAgY29uc3QgcG9zaXRpb25CdWZmZXIgPSB0aGlzLmNyZWF0ZUF0dHJpYnV0ZSgncG9zaXRpb24nLCAzKS5hcnJheTtcbiAgICBsZXQgaSwgb2Zmc2V0O1xuXG4gICAgaWYgKGxvY2FsaXplRmFjZXMgPT09IHRydWUpIHtcbiAgICAgIGZvciAoaSA9IDA7IGkgPCB0aGlzLmZhY2VDb3VudDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGZhY2UgPSB0aGlzLm1vZGVsR2VvbWV0cnkuZmFjZXNbaV07XG4gICAgICAgIGNvbnN0IGNlbnRyb2lkID0gdGhpcy5jZW50cm9pZHMgPyB0aGlzLmNlbnRyb2lkc1tpXSA6IFV0aWxzLmNvbXB1dGVDZW50cm9pZCh0aGlzLm1vZGVsR2VvbWV0cnksIGZhY2UpO1xuXG4gICAgICAgIGNvbnN0IGEgPSB0aGlzLm1vZGVsR2VvbWV0cnkudmVydGljZXNbZmFjZS5hXTtcbiAgICAgICAgY29uc3QgYiA9IHRoaXMubW9kZWxHZW9tZXRyeS52ZXJ0aWNlc1tmYWNlLmJdO1xuICAgICAgICBjb25zdCBjID0gdGhpcy5tb2RlbEdlb21ldHJ5LnZlcnRpY2VzW2ZhY2UuY107XG5cbiAgICAgICAgcG9zaXRpb25CdWZmZXJbZmFjZS5hICogM10gICAgID0gYS54IC0gY2VudHJvaWQueDtcbiAgICAgICAgcG9zaXRpb25CdWZmZXJbZmFjZS5hICogMyArIDFdID0gYS55IC0gY2VudHJvaWQueTtcbiAgICAgICAgcG9zaXRpb25CdWZmZXJbZmFjZS5hICogMyArIDJdID0gYS56IC0gY2VudHJvaWQuejtcblxuICAgICAgICBwb3NpdGlvbkJ1ZmZlcltmYWNlLmIgKiAzXSAgICAgPSBiLnggLSBjZW50cm9pZC54O1xuICAgICAgICBwb3NpdGlvbkJ1ZmZlcltmYWNlLmIgKiAzICsgMV0gPSBiLnkgLSBjZW50cm9pZC55O1xuICAgICAgICBwb3NpdGlvbkJ1ZmZlcltmYWNlLmIgKiAzICsgMl0gPSBiLnogLSBjZW50cm9pZC56O1xuXG4gICAgICAgIHBvc2l0aW9uQnVmZmVyW2ZhY2UuYyAqIDNdICAgICA9IGMueCAtIGNlbnRyb2lkLng7XG4gICAgICAgIHBvc2l0aW9uQnVmZmVyW2ZhY2UuYyAqIDMgKyAxXSA9IGMueSAtIGNlbnRyb2lkLnk7XG4gICAgICAgIHBvc2l0aW9uQnVmZmVyW2ZhY2UuYyAqIDMgKyAyXSA9IGMueiAtIGNlbnRyb2lkLno7XG4gICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgZm9yIChpID0gMCwgb2Zmc2V0ID0gMDsgaSA8IHRoaXMudmVydGV4Q291bnQ7IGkrKywgb2Zmc2V0ICs9IDMpIHtcbiAgICAgICAgY29uc3QgdmVydGV4ID0gdGhpcy5tb2RlbEdlb21ldHJ5LnZlcnRpY2VzW2ldO1xuXG4gICAgICAgIHBvc2l0aW9uQnVmZmVyW29mZnNldCAgICBdID0gdmVydGV4Lng7XG4gICAgICAgIHBvc2l0aW9uQnVmZmVyW29mZnNldCArIDFdID0gdmVydGV4Lnk7XG4gICAgICAgIHBvc2l0aW9uQnVmZmVyW29mZnNldCArIDJdID0gdmVydGV4Lno7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBUSFJFRS5CdWZmZXJBdHRyaWJ1dGUgd2l0aCBVViBjb29yZGluYXRlcy5cbiAgICovXG4gIGJ1ZmZlclV2cyAoKSB7XG4gICAgY29uc3QgdXZCdWZmZXIgPSB0aGlzLmNyZWF0ZUF0dHJpYnV0ZSgndXYnLCAyKS5hcnJheTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5mYWNlQ291bnQ7IGkrKykge1xuXG4gICAgICBjb25zdCBmYWNlID0gdGhpcy5tb2RlbEdlb21ldHJ5LmZhY2VzW2ldO1xuICAgICAgbGV0IHV2O1xuXG4gICAgICB1diA9IHRoaXMubW9kZWxHZW9tZXRyeS5mYWNlVmVydGV4VXZzWzBdW2ldWzBdO1xuICAgICAgdXZCdWZmZXJbZmFjZS5hICogMl0gICAgID0gdXYueDtcbiAgICAgIHV2QnVmZmVyW2ZhY2UuYSAqIDIgKyAxXSA9IHV2Lnk7XG5cbiAgICAgIHV2ID0gdGhpcy5tb2RlbEdlb21ldHJ5LmZhY2VWZXJ0ZXhVdnNbMF1baV1bMV07XG4gICAgICB1dkJ1ZmZlcltmYWNlLmIgKiAyXSAgICAgPSB1di54O1xuICAgICAgdXZCdWZmZXJbZmFjZS5iICogMiArIDFdID0gdXYueTtcblxuICAgICAgdXYgPSB0aGlzLm1vZGVsR2VvbWV0cnkuZmFjZVZlcnRleFV2c1swXVtpXVsyXTtcbiAgICAgIHV2QnVmZmVyW2ZhY2UuYyAqIDJdICAgICA9IHV2Lng7XG4gICAgICB1dkJ1ZmZlcltmYWNlLmMgKiAyICsgMV0gPSB1di55O1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIHR3byBUSFJFRS5CdWZmZXJBdHRyaWJ1dGVzOiBza2luSW5kZXggYW5kIHNraW5XZWlnaHQuIEJvdGggYXJlIHJlcXVpcmVkIGZvciBza2lubmluZy5cbiAgICovXG4gIGJ1ZmZlclNraW5uaW5nICgpIHtcbiAgICBjb25zdCBza2luSW5kZXhCdWZmZXIgPSB0aGlzLmNyZWF0ZUF0dHJpYnV0ZSgnc2tpbkluZGV4JywgNCkuYXJyYXk7XG4gICAgY29uc3Qgc2tpbldlaWdodEJ1ZmZlciA9IHRoaXMuY3JlYXRlQXR0cmlidXRlKCdza2luV2VpZ2h0JywgNCkuYXJyYXk7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMudmVydGV4Q291bnQ7IGkrKykge1xuICAgICAgY29uc3Qgc2tpbkluZGV4ID0gdGhpcy5tb2RlbEdlb21ldHJ5LnNraW5JbmRpY2VzW2ldO1xuICAgICAgY29uc3Qgc2tpbldlaWdodCA9IHRoaXMubW9kZWxHZW9tZXRyeS5za2luV2VpZ2h0c1tpXTtcblxuICAgICAgc2tpbkluZGV4QnVmZmVyW2kgKiA0ICAgIF0gPSBza2luSW5kZXgueDtcbiAgICAgIHNraW5JbmRleEJ1ZmZlcltpICogNCArIDFdID0gc2tpbkluZGV4Lnk7XG4gICAgICBza2luSW5kZXhCdWZmZXJbaSAqIDQgKyAyXSA9IHNraW5JbmRleC56O1xuICAgICAgc2tpbkluZGV4QnVmZmVyW2kgKiA0ICsgM10gPSBza2luSW5kZXgudztcblxuICAgICAgc2tpbldlaWdodEJ1ZmZlcltpICogNCAgICBdID0gc2tpbldlaWdodC54O1xuICAgICAgc2tpbldlaWdodEJ1ZmZlcltpICogNCArIDFdID0gc2tpbldlaWdodC55O1xuICAgICAgc2tpbldlaWdodEJ1ZmZlcltpICogNCArIDJdID0gc2tpbldlaWdodC56O1xuICAgICAgc2tpbldlaWdodEJ1ZmZlcltpICogNCArIDNdID0gc2tpbldlaWdodC53O1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgVEhSRUUuQnVmZmVyQXR0cmlidXRlIG9uIHRoaXMgZ2VvbWV0cnkgaW5zdGFuY2UuXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIE5hbWUgb2YgdGhlIGF0dHJpYnV0ZS5cbiAgICogQHBhcmFtIHtpbnR9IGl0ZW1TaXplIE51bWJlciBvZiBmbG9hdHMgcGVyIHZlcnRleCAodHlwaWNhbGx5IDEsIDIsIDMgb3IgNCkuXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb249fSBmYWN0b3J5IEZ1bmN0aW9uIHRoYXQgd2lsbCBiZSBjYWxsZWQgZm9yIGVhY2ggZmFjZSB1cG9uIGNyZWF0aW9uLiBBY2NlcHRzIDMgYXJndW1lbnRzOiBkYXRhW10sIGluZGV4IGFuZCBmYWNlQ291bnQuIENhbGxzIHNldEZhY2VEYXRhLlxuICAgKlxuICAgKiBAcmV0dXJucyB7QnVmZmVyQXR0cmlidXRlfVxuICAgKi9cbiAgY3JlYXRlQXR0cmlidXRlIChuYW1lLCBpdGVtU2l6ZSwgZmFjdG9yeSkge1xuICAgIGNvbnN0IGJ1ZmZlciA9IG5ldyBGbG9hdDMyQXJyYXkodGhpcy52ZXJ0ZXhDb3VudCAqIGl0ZW1TaXplKTtcbiAgICBjb25zdCBhdHRyaWJ1dGUgPSBuZXcgQnVmZmVyQXR0cmlidXRlKGJ1ZmZlciwgaXRlbVNpemUpO1xuXG4gICAgdGhpcy5zZXRBdHRyaWJ1dGUobmFtZSwgYXR0cmlidXRlKTtcblxuICAgIGlmIChmYWN0b3J5KSB7XG4gICAgICBjb25zdCBkYXRhID0gW107XG5cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5mYWNlQ291bnQ7IGkrKykge1xuICAgICAgICBmYWN0b3J5KGRhdGEsIGksIHRoaXMuZmFjZUNvdW50KTtcbiAgICAgICAgdGhpcy5zZXRGYWNlRGF0YShhdHRyaWJ1dGUsIGksIGRhdGEpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBhdHRyaWJ1dGU7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyBkYXRhIGZvciBhbGwgdmVydGljZXMgb2YgYSBmYWNlIGF0IGEgZ2l2ZW4gaW5kZXguXG4gICAqIFVzdWFsbHkgY2FsbGVkIGluIGEgbG9vcC5cbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd8VEhSRUUuQnVmZmVyQXR0cmlidXRlfSBhdHRyaWJ1dGUgVGhlIGF0dHJpYnV0ZSBvciBhdHRyaWJ1dGUgbmFtZSB3aGVyZSB0aGUgZGF0YSBpcyB0byBiZSBzdG9yZWQuXG4gICAqIEBwYXJhbSB7aW50fSBmYWNlSW5kZXggSW5kZXggb2YgdGhlIGZhY2UgaW4gdGhlIGJ1ZmZlciBnZW9tZXRyeS5cbiAgICogQHBhcmFtIHtBcnJheX0gZGF0YSBBcnJheSBvZiBkYXRhLiBMZW5ndGggc2hvdWxkIGJlIGVxdWFsIHRvIGl0ZW0gc2l6ZSBvZiB0aGUgYXR0cmlidXRlLlxuICAgKi9cbiAgc2V0RmFjZURhdGEgKGF0dHJpYnV0ZSwgZmFjZUluZGV4LCBkYXRhKSB7XG4gICAgYXR0cmlidXRlID0gKHR5cGVvZiBhdHRyaWJ1dGUgPT09ICdzdHJpbmcnKSA/IHRoaXMuYXR0cmlidXRlc1thdHRyaWJ1dGVdIDogYXR0cmlidXRlO1xuXG4gICAgbGV0IG9mZnNldCA9IGZhY2VJbmRleCAqIDMgKiBhdHRyaWJ1dGUuaXRlbVNpemU7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IDM7IGkrKykge1xuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBhdHRyaWJ1dGUuaXRlbVNpemU7IGorKykge1xuICAgICAgICBhdHRyaWJ1dGUuYXJyYXlbb2Zmc2V0KytdID0gZGF0YVtqXTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IHsgTW9kZWxCdWZmZXJHZW9tZXRyeSB9O1xuIiwiaW1wb3J0IHsgQnVmZmVyR2VvbWV0cnksIEJ1ZmZlckF0dHJpYnV0ZSB9IGZyb20gJ3RocmVlJztcblxuY2xhc3MgUG9pbnRCdWZmZXJHZW9tZXRyeSBleHRlbmRzIEJ1ZmZlckdlb21ldHJ5IHtcbiAgLyoqXG4gICAqIEEgVEhSRUUuQnVmZmVyR2VvbWV0cnkgY29uc2lzdHMgb2YgcG9pbnRzLlxuICAgKiBAcGFyYW0ge051bWJlcn0gY291bnQgVGhlIG51bWJlciBvZiBwb2ludHMuXG4gICAqIEBjb25zdHJ1Y3RvclxuICAgKi9cbiAgY29uc3RydWN0b3IgKGNvdW50KSB7XG4gICAgc3VwZXIoKTtcblxuICAgIC8qKlxuICAgICAqIE51bWJlciBvZiBwb2ludHMuXG4gICAgICogQHR5cGUge051bWJlcn1cbiAgICAgKi9cbiAgICB0aGlzLnBvaW50Q291bnQgPSBjb3VudDtcblxuICAgIHRoaXMuYnVmZmVyUG9zaXRpb25zKCk7XG4gIH1cblxuICBidWZmZXJQb3NpdGlvbnMgKCkge1xuICAgIHRoaXMuY3JlYXRlQXR0cmlidXRlKCdwb3NpdGlvbicsIDMpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBUSFJFRS5CdWZmZXJBdHRyaWJ1dGUgb24gdGhpcyBnZW9tZXRyeSBpbnN0YW5jZS5cbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgTmFtZSBvZiB0aGUgYXR0cmlidXRlLlxuICAgKiBAcGFyYW0ge051bWJlcn0gaXRlbVNpemUgTnVtYmVyIG9mIGZsb2F0cyBwZXIgdmVydGV4ICh0eXBpY2FsbHkgMSwgMiwgMyBvciA0KS5cbiAgICogQHBhcmFtIHtmdW5jdGlvbj19IGZhY3RvcnkgRnVuY3Rpb24gdGhhdCB3aWxsIGJlIGNhbGxlZCBmb3IgZWFjaCBwb2ludCB1cG9uIGNyZWF0aW9uLiBBY2NlcHRzIDMgYXJndW1lbnRzOiBkYXRhW10sIGluZGV4IGFuZCBwcmVmYWJDb3VudC4gQ2FsbHMgc2V0UG9pbnREYXRhLlxuICAgKlxuICAgKiBAcmV0dXJucyB7VEhSRUUuQnVmZmVyQXR0cmlidXRlfVxuICAgKi9cbiAgY3JlYXRlQXR0cmlidXRlIChuYW1lLCBpdGVtU2l6ZSwgZmFjdG9yeSkge1xuICAgIGNvbnN0IGJ1ZmZlciA9IG5ldyBGbG9hdDMyQXJyYXkodGhpcy5wb2ludENvdW50ICogaXRlbVNpemUpO1xuICAgIGNvbnN0IGF0dHJpYnV0ZSA9IG5ldyBCdWZmZXJBdHRyaWJ1dGUoYnVmZmVyLCBpdGVtU2l6ZSk7XG5cbiAgICB0aGlzLnNldEF0dHJpYnV0ZShuYW1lLCBhdHRyaWJ1dGUpO1xuXG4gICAgaWYgKGZhY3RvcnkpIHtcbiAgICAgIGNvbnN0IGRhdGEgPSBbXTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5wb2ludENvdW50OyBpKyspIHtcbiAgICAgICAgZmFjdG9yeShkYXRhLCBpLCB0aGlzLnBvaW50Q291bnQpO1xuICAgICAgICB0aGlzLnNldFBvaW50RGF0YShhdHRyaWJ1dGUsIGksIGRhdGEpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBhdHRyaWJ1dGU7XG4gIH1cblxuICBzZXRQb2ludERhdGEgKGF0dHJpYnV0ZSwgcG9pbnRJbmRleCwgZGF0YSkge1xuICAgIGF0dHJpYnV0ZSA9ICh0eXBlb2YgYXR0cmlidXRlID09PSAnc3RyaW5nJykgPyB0aGlzLmF0dHJpYnV0ZXNbYXR0cmlidXRlXSA6IGF0dHJpYnV0ZTtcblxuICAgIGxldCBvZmZzZXQgPSBwb2ludEluZGV4ICogYXR0cmlidXRlLml0ZW1TaXplO1xuXG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCBhdHRyaWJ1dGUuaXRlbVNpemU7IGorKykge1xuICAgICAgYXR0cmlidXRlLmFycmF5W29mZnNldCsrXSA9IGRhdGFbal07XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCB7IFBvaW50QnVmZmVyR2VvbWV0cnkgfTtcbiIsIi8vIGdlbmVyYXRlZCBieSBzY3JpcHRzL2J1aWxkX3NoYWRlcl9jaHVua3MuanNcblxuaW1wb3J0IGNhdG11bGxfcm9tX3NwbGluZSBmcm9tICcuL2dsc2wvY2F0bXVsbF9yb21fc3BsaW5lLmdsc2wnO1xuaW1wb3J0IGN1YmljX2JlemllciBmcm9tICcuL2dsc2wvY3ViaWNfYmV6aWVyLmdsc2wnO1xuaW1wb3J0IGVhc2VfYmFja19pbiBmcm9tICcuL2dsc2wvZWFzZV9iYWNrX2luLmdsc2wnO1xuaW1wb3J0IGVhc2VfYmFja19pbl9vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfYmFja19pbl9vdXQuZ2xzbCc7XG5pbXBvcnQgZWFzZV9iYWNrX291dCBmcm9tICcuL2dsc2wvZWFzZV9iYWNrX291dC5nbHNsJztcbmltcG9ydCBlYXNlX2JlemllciBmcm9tICcuL2dsc2wvZWFzZV9iZXppZXIuZ2xzbCc7XG5pbXBvcnQgZWFzZV9ib3VuY2VfaW4gZnJvbSAnLi9nbHNsL2Vhc2VfYm91bmNlX2luLmdsc2wnO1xuaW1wb3J0IGVhc2VfYm91bmNlX2luX291dCBmcm9tICcuL2dsc2wvZWFzZV9ib3VuY2VfaW5fb3V0Lmdsc2wnO1xuaW1wb3J0IGVhc2VfYm91bmNlX291dCBmcm9tICcuL2dsc2wvZWFzZV9ib3VuY2Vfb3V0Lmdsc2wnO1xuaW1wb3J0IGVhc2VfY2lyY19pbiBmcm9tICcuL2dsc2wvZWFzZV9jaXJjX2luLmdsc2wnO1xuaW1wb3J0IGVhc2VfY2lyY19pbl9vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfY2lyY19pbl9vdXQuZ2xzbCc7XG5pbXBvcnQgZWFzZV9jaXJjX291dCBmcm9tICcuL2dsc2wvZWFzZV9jaXJjX291dC5nbHNsJztcbmltcG9ydCBlYXNlX2N1YmljX2luIGZyb20gJy4vZ2xzbC9lYXNlX2N1YmljX2luLmdsc2wnO1xuaW1wb3J0IGVhc2VfY3ViaWNfaW5fb3V0IGZyb20gJy4vZ2xzbC9lYXNlX2N1YmljX2luX291dC5nbHNsJztcbmltcG9ydCBlYXNlX2N1YmljX291dCBmcm9tICcuL2dsc2wvZWFzZV9jdWJpY19vdXQuZ2xzbCc7XG5pbXBvcnQgZWFzZV9lbGFzdGljX2luIGZyb20gJy4vZ2xzbC9lYXNlX2VsYXN0aWNfaW4uZ2xzbCc7XG5pbXBvcnQgZWFzZV9lbGFzdGljX2luX291dCBmcm9tICcuL2dsc2wvZWFzZV9lbGFzdGljX2luX291dC5nbHNsJztcbmltcG9ydCBlYXNlX2VsYXN0aWNfb3V0IGZyb20gJy4vZ2xzbC9lYXNlX2VsYXN0aWNfb3V0Lmdsc2wnO1xuaW1wb3J0IGVhc2VfZXhwb19pbiBmcm9tICcuL2dsc2wvZWFzZV9leHBvX2luLmdsc2wnO1xuaW1wb3J0IGVhc2VfZXhwb19pbl9vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfZXhwb19pbl9vdXQuZ2xzbCc7XG5pbXBvcnQgZWFzZV9leHBvX291dCBmcm9tICcuL2dsc2wvZWFzZV9leHBvX291dC5nbHNsJztcbmltcG9ydCBlYXNlX3F1YWRfaW4gZnJvbSAnLi9nbHNsL2Vhc2VfcXVhZF9pbi5nbHNsJztcbmltcG9ydCBlYXNlX3F1YWRfaW5fb3V0IGZyb20gJy4vZ2xzbC9lYXNlX3F1YWRfaW5fb3V0Lmdsc2wnO1xuaW1wb3J0IGVhc2VfcXVhZF9vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfcXVhZF9vdXQuZ2xzbCc7XG5pbXBvcnQgZWFzZV9xdWFydF9pbiBmcm9tICcuL2dsc2wvZWFzZV9xdWFydF9pbi5nbHNsJztcbmltcG9ydCBlYXNlX3F1YXJ0X2luX291dCBmcm9tICcuL2dsc2wvZWFzZV9xdWFydF9pbl9vdXQuZ2xzbCc7XG5pbXBvcnQgZWFzZV9xdWFydF9vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfcXVhcnRfb3V0Lmdsc2wnO1xuaW1wb3J0IGVhc2VfcXVpbnRfaW4gZnJvbSAnLi9nbHNsL2Vhc2VfcXVpbnRfaW4uZ2xzbCc7XG5pbXBvcnQgZWFzZV9xdWludF9pbl9vdXQgZnJvbSAnLi9nbHNsL2Vhc2VfcXVpbnRfaW5fb3V0Lmdsc2wnO1xuaW1wb3J0IGVhc2VfcXVpbnRfb3V0IGZyb20gJy4vZ2xzbC9lYXNlX3F1aW50X291dC5nbHNsJztcbmltcG9ydCBlYXNlX3NpbmVfaW4gZnJvbSAnLi9nbHNsL2Vhc2Vfc2luZV9pbi5nbHNsJztcbmltcG9ydCBlYXNlX3NpbmVfaW5fb3V0IGZyb20gJy4vZ2xzbC9lYXNlX3NpbmVfaW5fb3V0Lmdsc2wnO1xuaW1wb3J0IGVhc2Vfc2luZV9vdXQgZnJvbSAnLi9nbHNsL2Vhc2Vfc2luZV9vdXQuZ2xzbCc7XG5pbXBvcnQgcXVhZHJhdGljX2JlemllciBmcm9tICcuL2dsc2wvcXVhZHJhdGljX2Jlemllci5nbHNsJztcbmltcG9ydCBxdWF0ZXJuaW9uX3JvdGF0aW9uIGZyb20gJy4vZ2xzbC9xdWF0ZXJuaW9uX3JvdGF0aW9uLmdsc2wnO1xuaW1wb3J0IHF1YXRlcm5pb25fc2xlcnAgZnJvbSAnLi9nbHNsL3F1YXRlcm5pb25fc2xlcnAuZ2xzbCc7XG5cblxuZXhwb3J0IGNvbnN0IFNoYWRlckNodW5rID0ge1xuICBjYXRtdWxsX3JvbV9zcGxpbmU6IGNhdG11bGxfcm9tX3NwbGluZSxcbiAgY3ViaWNfYmV6aWVyOiBjdWJpY19iZXppZXIsXG4gIGVhc2VfYmFja19pbjogZWFzZV9iYWNrX2luLFxuICBlYXNlX2JhY2tfaW5fb3V0OiBlYXNlX2JhY2tfaW5fb3V0LFxuICBlYXNlX2JhY2tfb3V0OiBlYXNlX2JhY2tfb3V0LFxuICBlYXNlX2JlemllcjogZWFzZV9iZXppZXIsXG4gIGVhc2VfYm91bmNlX2luOiBlYXNlX2JvdW5jZV9pbixcbiAgZWFzZV9ib3VuY2VfaW5fb3V0OiBlYXNlX2JvdW5jZV9pbl9vdXQsXG4gIGVhc2VfYm91bmNlX291dDogZWFzZV9ib3VuY2Vfb3V0LFxuICBlYXNlX2NpcmNfaW46IGVhc2VfY2lyY19pbixcbiAgZWFzZV9jaXJjX2luX291dDogZWFzZV9jaXJjX2luX291dCxcbiAgZWFzZV9jaXJjX291dDogZWFzZV9jaXJjX291dCxcbiAgZWFzZV9jdWJpY19pbjogZWFzZV9jdWJpY19pbixcbiAgZWFzZV9jdWJpY19pbl9vdXQ6IGVhc2VfY3ViaWNfaW5fb3V0LFxuICBlYXNlX2N1YmljX291dDogZWFzZV9jdWJpY19vdXQsXG4gIGVhc2VfZWxhc3RpY19pbjogZWFzZV9lbGFzdGljX2luLFxuICBlYXNlX2VsYXN0aWNfaW5fb3V0OiBlYXNlX2VsYXN0aWNfaW5fb3V0LFxuICBlYXNlX2VsYXN0aWNfb3V0OiBlYXNlX2VsYXN0aWNfb3V0LFxuICBlYXNlX2V4cG9faW46IGVhc2VfZXhwb19pbixcbiAgZWFzZV9leHBvX2luX291dDogZWFzZV9leHBvX2luX291dCxcbiAgZWFzZV9leHBvX291dDogZWFzZV9leHBvX291dCxcbiAgZWFzZV9xdWFkX2luOiBlYXNlX3F1YWRfaW4sXG4gIGVhc2VfcXVhZF9pbl9vdXQ6IGVhc2VfcXVhZF9pbl9vdXQsXG4gIGVhc2VfcXVhZF9vdXQ6IGVhc2VfcXVhZF9vdXQsXG4gIGVhc2VfcXVhcnRfaW46IGVhc2VfcXVhcnRfaW4sXG4gIGVhc2VfcXVhcnRfaW5fb3V0OiBlYXNlX3F1YXJ0X2luX291dCxcbiAgZWFzZV9xdWFydF9vdXQ6IGVhc2VfcXVhcnRfb3V0LFxuICBlYXNlX3F1aW50X2luOiBlYXNlX3F1aW50X2luLFxuICBlYXNlX3F1aW50X2luX291dDogZWFzZV9xdWludF9pbl9vdXQsXG4gIGVhc2VfcXVpbnRfb3V0OiBlYXNlX3F1aW50X291dCxcbiAgZWFzZV9zaW5lX2luOiBlYXNlX3NpbmVfaW4sXG4gIGVhc2Vfc2luZV9pbl9vdXQ6IGVhc2Vfc2luZV9pbl9vdXQsXG4gIGVhc2Vfc2luZV9vdXQ6IGVhc2Vfc2luZV9vdXQsXG4gIHF1YWRyYXRpY19iZXppZXI6IHF1YWRyYXRpY19iZXppZXIsXG4gIHF1YXRlcm5pb25fcm90YXRpb246IHF1YXRlcm5pb25fcm90YXRpb24sXG4gIHF1YXRlcm5pb25fc2xlcnA6IHF1YXRlcm5pb25fc2xlcnAsXG5cbn07XG5cbiIsIi8qKlxuICogQSB0aW1lbGluZSB0cmFuc2l0aW9uIHNlZ21lbnQuIEFuIGluc3RhbmNlIG9mIHRoaXMgY2xhc3MgaXMgY3JlYXRlZCBpbnRlcm5hbGx5IHdoZW4gY2FsbGluZyB7QGxpbmsgVEhSRUUuQkFTLlRpbWVsaW5lLmFkZH0sIHNvIHlvdSBzaG91bGQgbm90IHVzZSB0aGlzIGNsYXNzIGRpcmVjdGx5LlxuICogVGhlIGluc3RhbmNlIGlzIGFsc28gcGFzc2VkIHRoZSB0aGUgY29tcGlsZXIgZnVuY3Rpb24gaWYgeW91IHJlZ2lzdGVyIGEgdHJhbnNpdGlvbiB0aHJvdWdoIHtAbGluayBUSFJFRS5CQVMuVGltZWxpbmUucmVnaXN0ZXJ9LiBUaGVyZSB5b3UgY2FuIHVzZSB0aGUgcHVibGljIHByb3BlcnRpZXMgb2YgdGhlIHNlZ21lbnQgdG8gY29tcGlsZSB0aGUgZ2xzbCBzdHJpbmcuXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IEEgc3RyaW5nIGtleSBnZW5lcmF0ZWQgYnkgdGhlIHRpbWVsaW5lIHRvIHdoaWNoIHRoaXMgc2VnbWVudCBiZWxvbmdzLiBLZXlzIGFyZSB1bmlxdWUuXG4gKiBAcGFyYW0ge251bWJlcn0gc3RhcnQgU3RhcnQgdGltZSBvZiB0aGlzIHNlZ21lbnQgaW4gYSB0aW1lbGluZSBpbiBzZWNvbmRzLlxuICogQHBhcmFtIHtudW1iZXJ9IGR1cmF0aW9uIER1cmF0aW9uIG9mIHRoaXMgc2VnbWVudCBpbiBzZWNvbmRzLlxuICogQHBhcmFtIHtvYmplY3R9IHRyYW5zaXRpb24gT2JqZWN0IGRlc2NyaWJpbmcgdGhlIHRyYW5zaXRpb24uXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBjb21waWxlciBBIHJlZmVyZW5jZSB0byB0aGUgY29tcGlsZXIgZnVuY3Rpb24gZnJvbSBhIHRyYW5zaXRpb24gZGVmaW5pdGlvbi5cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBUaW1lbGluZVNlZ21lbnQoa2V5LCBzdGFydCwgZHVyYXRpb24sIHRyYW5zaXRpb24sIGNvbXBpbGVyKSB7XG4gIHRoaXMua2V5ID0ga2V5O1xuICB0aGlzLnN0YXJ0ID0gc3RhcnQ7XG4gIHRoaXMuZHVyYXRpb24gPSBkdXJhdGlvbjtcbiAgdGhpcy50cmFuc2l0aW9uID0gdHJhbnNpdGlvbjtcbiAgdGhpcy5jb21waWxlciA9IGNvbXBpbGVyO1xuXG4gIHRoaXMudHJhaWwgPSAwO1xufVxuXG5UaW1lbGluZVNlZ21lbnQucHJvdG90eXBlLmNvbXBpbGUgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMuY29tcGlsZXIodGhpcyk7XG59O1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoVGltZWxpbmVTZWdtZW50LnByb3RvdHlwZSwgJ2VuZCcsIHtcbiAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5zdGFydCArIHRoaXMuZHVyYXRpb247XG4gIH1cbn0pO1xuXG5leHBvcnQgeyBUaW1lbGluZVNlZ21lbnQgfTtcbiIsImltcG9ydCB7IFRpbWVsaW5lU2VnbWVudCB9IGZyb20gJy4vVGltZWxpbmVTZWdtZW50JztcblxuLyoqXG4gKiBBIHV0aWxpdHkgY2xhc3MgdG8gY3JlYXRlIGFuIGFuaW1hdGlvbiB0aW1lbGluZSB3aGljaCBjYW4gYmUgYmFrZWQgaW50byBhICh2ZXJ0ZXgpIHNoYWRlci5cbiAqIEJ5IGRlZmF1bHQgdGhlIHRpbWVsaW5lIHN1cHBvcnRzIHRyYW5zbGF0aW9uLCBzY2FsZSBhbmQgcm90YXRpb24uIFRoaXMgY2FuIGJlIGV4dGVuZGVkIG9yIG92ZXJyaWRkZW4uXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gVGltZWxpbmUoKSB7XG4gIC8qKlxuICAgKiBUaGUgdG90YWwgZHVyYXRpb24gb2YgdGhlIHRpbWVsaW5lIGluIHNlY29uZHMuXG4gICAqIEB0eXBlIHtudW1iZXJ9XG4gICAqL1xuICB0aGlzLmR1cmF0aW9uID0gMDtcblxuICAvKipcbiAgICogVGhlIG5hbWUgb2YgdGhlIHZhbHVlIHRoYXQgc2VnbWVudHMgd2lsbCB1c2UgdG8gcmVhZCB0aGUgdGltZS4gRGVmYXVsdHMgdG8gJ3RUaW1lJy5cbiAgICogQHR5cGUge3N0cmluZ31cbiAgICovXG4gIHRoaXMudGltZUtleSA9ICd0VGltZSc7XG5cbiAgdGhpcy5zZWdtZW50cyA9IHt9O1xuICB0aGlzLl9fa2V5ID0gMDtcbn1cblxuLy8gc3RhdGljIGRlZmluaXRpb25zIG1hcFxuVGltZWxpbmUuc2VnbWVudERlZmluaXRpb25zID0ge307XG5cbi8qKlxuICogUmVnaXN0ZXJzIGEgdHJhbnNpdGlvbiBkZWZpbml0aW9uIGZvciB1c2Ugd2l0aCB7QGxpbmsgVEhSRUUuQkFTLlRpbWVsaW5lLmFkZH0uXG4gKiBAcGFyYW0ge1N0cmluZ30ga2V5IE5hbWUgb2YgdGhlIHRyYW5zaXRpb24uIERlZmF1bHRzIGluY2x1ZGUgJ3NjYWxlJywgJ3JvdGF0ZScgYW5kICd0cmFuc2xhdGUnLlxuICogQHBhcmFtIHtPYmplY3R9IGRlZmluaXRpb25cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGRlZmluaXRpb24uY29tcGlsZXIgQSBmdW5jdGlvbiB0aGF0IGdlbmVyYXRlcyBhIGdsc2wgc3RyaW5nIGZvciBhIHRyYW5zaXRpb24gc2VnbWVudC4gQWNjZXB0cyBhIFRIUkVFLkJBUy5UaW1lbGluZVNlZ21lbnQgYXMgdGhlIHNvbGUgYXJndW1lbnQuXG4gKiBAcGFyYW0geyp9IGRlZmluaXRpb24uZGVmYXVsdEZyb20gVGhlIGluaXRpYWwgdmFsdWUgZm9yIGEgdHJhbnNmb3JtLmZyb20uIEZvciBleGFtcGxlLCB0aGUgZGVmYXVsdEZyb20gZm9yIGEgdHJhbnNsYXRpb24gaXMgVEhSRUUuVmVjdG9yMygwLCAwLCAwKS5cbiAqIEBzdGF0aWNcbiAqL1xuVGltZWxpbmUucmVnaXN0ZXIgPSBmdW5jdGlvbihrZXksIGRlZmluaXRpb24pIHtcbiAgVGltZWxpbmUuc2VnbWVudERlZmluaXRpb25zW2tleV0gPSBkZWZpbml0aW9uO1xuICBcbiAgcmV0dXJuIGRlZmluaXRpb247XG59O1xuXG4vKipcbiAqIEFkZCBhIHRyYW5zaXRpb24gdG8gdGhlIHRpbWVsaW5lLlxuICogQHBhcmFtIHtudW1iZXJ9IGR1cmF0aW9uIER1cmF0aW9uIGluIHNlY29uZHNcbiAqIEBwYXJhbSB7b2JqZWN0fSB0cmFuc2l0aW9ucyBBbiBvYmplY3QgY29udGFpbmluZyBvbmUgb3Igc2V2ZXJhbCB0cmFuc2l0aW9ucy4gVGhlIGtleXMgc2hvdWxkIG1hdGNoIHRyYW5zZm9ybSBkZWZpbml0aW9ucy5cbiAqIFRoZSB0cmFuc2l0aW9uIG9iamVjdCBmb3IgZWFjaCBrZXkgd2lsbCBiZSBwYXNzZWQgdG8gdGhlIG1hdGNoaW5nIGRlZmluaXRpb24ncyBjb21waWxlci4gSXQgY2FuIGhhdmUgYXJiaXRyYXJ5IHByb3BlcnRpZXMsIGJ1dCB0aGUgVGltZWxpbmUgZXhwZWN0cyBhdCBsZWFzdCBhICd0bycsICdmcm9tJyBhbmQgYW4gb3B0aW9uYWwgJ2Vhc2UnLlxuICogQHBhcmFtIHtudW1iZXJ8c3RyaW5nfSBbcG9zaXRpb25PZmZzZXRdIFBvc2l0aW9uIGluIHRoZSB0aW1lbGluZS4gRGVmYXVsdHMgdG8gdGhlIGVuZCBvZiB0aGUgdGltZWxpbmUuIElmIGEgbnVtYmVyIGlzIHByb3ZpZGVkLCB0aGUgdHJhbnNpdGlvbiB3aWxsIGJlIGluc2VydGVkIGF0IHRoYXQgdGltZSBpbiBzZWNvbmRzLiBTdHJpbmdzICgnKz14JyBvciAnLT14JykgY2FuIGJlIHVzZWQgZm9yIGEgdmFsdWUgcmVsYXRpdmUgdG8gdGhlIGVuZCBvZiB0aW1lbGluZS5cbiAqL1xuVGltZWxpbmUucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uKGR1cmF0aW9uLCB0cmFuc2l0aW9ucywgcG9zaXRpb25PZmZzZXQpIHtcbiAgLy8gc3RvcCByb2xsdXAgZnJvbSBjb21wbGFpbmluZyBhYm91dCBldmFsXG4gIGNvbnN0IF9ldmFsID0gZXZhbDtcbiAgXG4gIGxldCBzdGFydCA9IHRoaXMuZHVyYXRpb247XG5cbiAgaWYgKHBvc2l0aW9uT2Zmc2V0ICE9PSB1bmRlZmluZWQpIHtcbiAgICBpZiAodHlwZW9mIHBvc2l0aW9uT2Zmc2V0ID09PSAnbnVtYmVyJykge1xuICAgICAgc3RhcnQgPSBwb3NpdGlvbk9mZnNldDtcbiAgICB9XG4gICAgZWxzZSBpZiAodHlwZW9mIHBvc2l0aW9uT2Zmc2V0ID09PSAnc3RyaW5nJykge1xuICAgICAgX2V2YWwoJ3N0YXJ0JyArIHBvc2l0aW9uT2Zmc2V0KTtcbiAgICB9XG5cbiAgICB0aGlzLmR1cmF0aW9uID0gTWF0aC5tYXgodGhpcy5kdXJhdGlvbiwgc3RhcnQgKyBkdXJhdGlvbik7XG4gIH1cbiAgZWxzZSB7XG4gICAgdGhpcy5kdXJhdGlvbiArPSBkdXJhdGlvbjtcbiAgfVxuXG4gIGxldCBrZXlzID0gT2JqZWN0LmtleXModHJhbnNpdGlvbnMpLCBrZXk7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgaSsrKSB7XG4gICAga2V5ID0ga2V5c1tpXTtcblxuICAgIHRoaXMucHJvY2Vzc1RyYW5zaXRpb24oa2V5LCB0cmFuc2l0aW9uc1trZXldLCBzdGFydCwgZHVyYXRpb24pO1xuICB9XG59O1xuXG5UaW1lbGluZS5wcm90b3R5cGUucHJvY2Vzc1RyYW5zaXRpb24gPSBmdW5jdGlvbihrZXksIHRyYW5zaXRpb24sIHN0YXJ0LCBkdXJhdGlvbikge1xuICBjb25zdCBkZWZpbml0aW9uID0gVGltZWxpbmUuc2VnbWVudERlZmluaXRpb25zW2tleV07XG5cbiAgbGV0IHNlZ21lbnRzID0gdGhpcy5zZWdtZW50c1trZXldO1xuICBpZiAoIXNlZ21lbnRzKSBzZWdtZW50cyA9IHRoaXMuc2VnbWVudHNba2V5XSA9IFtdO1xuXG4gIGlmICh0cmFuc2l0aW9uLmZyb20gPT09IHVuZGVmaW5lZCkge1xuICAgIGlmIChzZWdtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHRyYW5zaXRpb24uZnJvbSA9IGRlZmluaXRpb24uZGVmYXVsdEZyb207XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgdHJhbnNpdGlvbi5mcm9tID0gc2VnbWVudHNbc2VnbWVudHMubGVuZ3RoIC0gMV0udHJhbnNpdGlvbi50bztcbiAgICB9XG4gIH1cblxuICBzZWdtZW50cy5wdXNoKG5ldyBUaW1lbGluZVNlZ21lbnQoKHRoaXMuX19rZXkrKykudG9TdHJpbmcoKSwgc3RhcnQsIGR1cmF0aW9uLCB0cmFuc2l0aW9uLCBkZWZpbml0aW9uLmNvbXBpbGVyKSk7XG59O1xuXG4vKipcbiAqIENvbXBpbGVzIHRoZSB0aW1lbGluZSBpbnRvIGEgZ2xzbCBzdHJpbmcgYXJyYXkgdGhhdCBjYW4gYmUgaW5qZWN0ZWQgaW50byBhICh2ZXJ0ZXgpIHNoYWRlci5cbiAqIEByZXR1cm5zIHtBcnJheX1cbiAqL1xuVGltZWxpbmUucHJvdG90eXBlLmNvbXBpbGUgPSBmdW5jdGlvbigpIHtcbiAgY29uc3QgYyA9IFtdO1xuXG4gIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyh0aGlzLnNlZ21lbnRzKTtcbiAgbGV0IHNlZ21lbnRzO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7IGkrKykge1xuICAgIHNlZ21lbnRzID0gdGhpcy5zZWdtZW50c1trZXlzW2ldXTtcblxuICAgIHRoaXMuZmlsbEdhcHMoc2VnbWVudHMpO1xuXG4gICAgc2VnbWVudHMuZm9yRWFjaChmdW5jdGlvbihzKSB7XG4gICAgICBjLnB1c2gocy5jb21waWxlKCkpO1xuICAgIH0pO1xuICB9XG5cbiAgcmV0dXJuIGM7XG59O1xuVGltZWxpbmUucHJvdG90eXBlLmZpbGxHYXBzID0gZnVuY3Rpb24oc2VnbWVudHMpIHtcbiAgaWYgKHNlZ21lbnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuO1xuXG4gIGxldCBzMCwgczE7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBzZWdtZW50cy5sZW5ndGggLSAxOyBpKyspIHtcbiAgICBzMCA9IHNlZ21lbnRzW2ldO1xuICAgIHMxID0gc2VnbWVudHNbaSArIDFdO1xuXG4gICAgczAudHJhaWwgPSBzMS5zdGFydCAtIHMwLmVuZDtcbiAgfVxuXG4gIC8vIHBhZCBsYXN0IHNlZ21lbnQgdW50aWwgZW5kIG9mIHRpbWVsaW5lXG4gIHMwID0gc2VnbWVudHNbc2VnbWVudHMubGVuZ3RoIC0gMV07XG4gIHMwLnRyYWlsID0gdGhpcy5kdXJhdGlvbiAtIHMwLmVuZDtcbn07XG5cbi8qKlxuICogR2V0IGEgY29tcGlsZWQgZ2xzbCBzdHJpbmcgd2l0aCBjYWxscyB0byB0cmFuc2Zvcm0gZnVuY3Rpb25zIGZvciBhIGdpdmVuIGtleS5cbiAqIFRoZSBvcmRlciBpbiB3aGljaCB0aGVzZSB0cmFuc2l0aW9ucyBhcmUgYXBwbGllZCBtYXR0ZXJzIGJlY2F1c2UgdGhleSBhbGwgb3BlcmF0ZSBvbiB0aGUgc2FtZSB2YWx1ZS5cbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgQSBrZXkgbWF0Y2hpbmcgYSB0cmFuc2Zvcm0gZGVmaW5pdGlvbi5cbiAqIEByZXR1cm5zIHtzdHJpbmd9XG4gKi9cblRpbWVsaW5lLnByb3RvdHlwZS5nZXRUcmFuc2Zvcm1DYWxscyA9IGZ1bmN0aW9uKGtleSkge1xuICBsZXQgdCA9IHRoaXMudGltZUtleTtcblxuICByZXR1cm4gdGhpcy5zZWdtZW50c1trZXldID8gIHRoaXMuc2VnbWVudHNba2V5XS5tYXAoZnVuY3Rpb24ocykge1xuICAgIHJldHVybiBgYXBwbHlUcmFuc2Zvcm0ke3Mua2V5fSgke3R9LCB0cmFuc2Zvcm1lZCk7YDtcbiAgfSkuam9pbignXFxuJykgOiAnJztcbn07XG5cbmV4cG9ydCB7IFRpbWVsaW5lIH1cbiIsImNvbnN0IFRpbWVsaW5lQ2h1bmtzID0ge1xuICB2ZWMzOiBmdW5jdGlvbihuLCB2LCBwKSB7XG4gICAgY29uc3QgeCA9ICh2LnggfHwgMCkudG9QcmVjaXNpb24ocCk7XG4gICAgY29uc3QgeSA9ICh2LnkgfHwgMCkudG9QcmVjaXNpb24ocCk7XG4gICAgY29uc3QgeiA9ICh2LnogfHwgMCkudG9QcmVjaXNpb24ocCk7XG5cbiAgICByZXR1cm4gYHZlYzMgJHtufSA9IHZlYzMoJHt4fSwgJHt5fSwgJHt6fSk7YDtcbiAgfSxcbiAgdmVjNDogZnVuY3Rpb24obiwgdiwgcCkge1xuICAgIGNvbnN0IHggPSAodi54IHx8IDApLnRvUHJlY2lzaW9uKHApO1xuICAgIGNvbnN0IHkgPSAodi55IHx8IDApLnRvUHJlY2lzaW9uKHApO1xuICAgIGNvbnN0IHogPSAodi56IHx8IDApLnRvUHJlY2lzaW9uKHApO1xuICAgIGNvbnN0IHcgPSAodi53IHx8IDApLnRvUHJlY2lzaW9uKHApO1xuICBcbiAgICByZXR1cm4gYHZlYzQgJHtufSA9IHZlYzQoJHt4fSwgJHt5fSwgJHt6fSwgJHt3fSk7YDtcbiAgfSxcbiAgZGVsYXlEdXJhdGlvbjogZnVuY3Rpb24oc2VnbWVudCkge1xuICAgIHJldHVybiBgXG4gICAgZmxvYXQgY0RlbGF5JHtzZWdtZW50LmtleX0gPSAke3NlZ21lbnQuc3RhcnQudG9QcmVjaXNpb24oNCl9O1xuICAgIGZsb2F0IGNEdXJhdGlvbiR7c2VnbWVudC5rZXl9ID0gJHtzZWdtZW50LmR1cmF0aW9uLnRvUHJlY2lzaW9uKDQpfTtcbiAgICBgO1xuICB9LFxuICBwcm9ncmVzczogZnVuY3Rpb24oc2VnbWVudCkge1xuICAgIC8vIHplcm8gZHVyYXRpb24gc2VnbWVudHMgc2hvdWxkIGFsd2F5cyByZW5kZXIgY29tcGxldGVcbiAgICBpZiAoc2VnbWVudC5kdXJhdGlvbiA9PT0gMCkge1xuICAgICAgcmV0dXJuIGBmbG9hdCBwcm9ncmVzcyA9IDEuMDtgXG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgcmV0dXJuIGBcbiAgICAgIGZsb2F0IHByb2dyZXNzID0gY2xhbXAodGltZSAtIGNEZWxheSR7c2VnbWVudC5rZXl9LCAwLjAsIGNEdXJhdGlvbiR7c2VnbWVudC5rZXl9KSAvIGNEdXJhdGlvbiR7c2VnbWVudC5rZXl9O1xuICAgICAgJHtzZWdtZW50LnRyYW5zaXRpb24uZWFzZSA/IGBwcm9ncmVzcyA9ICR7c2VnbWVudC50cmFuc2l0aW9uLmVhc2V9KHByb2dyZXNzJHsoc2VnbWVudC50cmFuc2l0aW9uLmVhc2VQYXJhbXMgPyBgLCAke3NlZ21lbnQudHJhbnNpdGlvbi5lYXNlUGFyYW1zLm1hcCgodikgPT4gdi50b1ByZWNpc2lvbig0KSkuam9pbihgLCBgKX1gIDogYGApfSk7YCA6IGBgfVxuICAgICAgYDtcbiAgICB9XG4gIH0sXG4gIHJlbmRlckNoZWNrOiBmdW5jdGlvbihzZWdtZW50KSB7XG4gICAgY29uc3Qgc3RhcnRUaW1lID0gc2VnbWVudC5zdGFydC50b1ByZWNpc2lvbig0KTtcbiAgICBjb25zdCBlbmRUaW1lID0gKHNlZ21lbnQuZW5kICsgc2VnbWVudC50cmFpbCkudG9QcmVjaXNpb24oNCk7XG5cbiAgICByZXR1cm4gYGlmICh0aW1lIDwgJHtzdGFydFRpbWV9IHx8IHRpbWUgPiAke2VuZFRpbWV9KSByZXR1cm47YDtcbiAgfVxufTtcblxuZXhwb3J0IHsgVGltZWxpbmVDaHVua3MgfTtcbiIsImltcG9ydCB7IFRpbWVsaW5lIH0gZnJvbSAnLi9UaW1lbGluZSc7XG5pbXBvcnQgeyBUaW1lbGluZUNodW5rcyB9IGZyb20gJy4vVGltZWxpbmVDaHVua3MnO1xuaW1wb3J0IHsgVmVjdG9yMyB9IGZyb20gJ3RocmVlJztcblxuY29uc3QgVHJhbnNsYXRpb25TZWdtZW50ID0ge1xuICBjb21waWxlcjogZnVuY3Rpb24oc2VnbWVudCkge1xuICAgIHJldHVybiBgXG4gICAgJHtUaW1lbGluZUNodW5rcy5kZWxheUR1cmF0aW9uKHNlZ21lbnQpfVxuICAgICR7VGltZWxpbmVDaHVua3MudmVjMyhgY1RyYW5zbGF0ZUZyb20ke3NlZ21lbnQua2V5fWAsIHNlZ21lbnQudHJhbnNpdGlvbi5mcm9tLCAyKX1cbiAgICAke1RpbWVsaW5lQ2h1bmtzLnZlYzMoYGNUcmFuc2xhdGVUbyR7c2VnbWVudC5rZXl9YCwgc2VnbWVudC50cmFuc2l0aW9uLnRvLCAyKX1cbiAgICBcbiAgICB2b2lkIGFwcGx5VHJhbnNmb3JtJHtzZWdtZW50LmtleX0oZmxvYXQgdGltZSwgaW5vdXQgdmVjMyB2KSB7XG4gICAgXG4gICAgICAke1RpbWVsaW5lQ2h1bmtzLnJlbmRlckNoZWNrKHNlZ21lbnQpfVxuICAgICAgJHtUaW1lbGluZUNodW5rcy5wcm9ncmVzcyhzZWdtZW50KX1cbiAgICBcbiAgICAgIHYgKz0gbWl4KGNUcmFuc2xhdGVGcm9tJHtzZWdtZW50LmtleX0sIGNUcmFuc2xhdGVUbyR7c2VnbWVudC5rZXl9LCBwcm9ncmVzcyk7XG4gICAgfVxuICAgIGA7XG4gIH0sXG4gIGRlZmF1bHRGcm9tOiBuZXcgVmVjdG9yMygwLCAwLCAwKVxufTtcblxuVGltZWxpbmUucmVnaXN0ZXIoJ3RyYW5zbGF0ZScsIFRyYW5zbGF0aW9uU2VnbWVudCk7XG5cbmV4cG9ydCB7IFRyYW5zbGF0aW9uU2VnbWVudCB9O1xuIiwiaW1wb3J0IHsgVGltZWxpbmUgfSBmcm9tICcuL1RpbWVsaW5lJztcbmltcG9ydCB7IFRpbWVsaW5lQ2h1bmtzIH0gZnJvbSAnLi9UaW1lbGluZUNodW5rcyc7XG5pbXBvcnQgeyBWZWN0b3IzIH0gZnJvbSAndGhyZWUnO1xuXG5jb25zdCBTY2FsZVNlZ21lbnQgPSB7XG4gIGNvbXBpbGVyOiBmdW5jdGlvbihzZWdtZW50KSB7XG4gICAgY29uc3Qgb3JpZ2luID0gc2VnbWVudC50cmFuc2l0aW9uLm9yaWdpbjtcbiAgICBcbiAgICByZXR1cm4gYFxuICAgICR7VGltZWxpbmVDaHVua3MuZGVsYXlEdXJhdGlvbihzZWdtZW50KX1cbiAgICAke1RpbWVsaW5lQ2h1bmtzLnZlYzMoYGNTY2FsZUZyb20ke3NlZ21lbnQua2V5fWAsIHNlZ21lbnQudHJhbnNpdGlvbi5mcm9tLCAyKX1cbiAgICAke1RpbWVsaW5lQ2h1bmtzLnZlYzMoYGNTY2FsZVRvJHtzZWdtZW50LmtleX1gLCBzZWdtZW50LnRyYW5zaXRpb24udG8sIDIpfVxuICAgICR7b3JpZ2luID8gVGltZWxpbmVDaHVua3MudmVjMyhgY09yaWdpbiR7c2VnbWVudC5rZXl9YCwgb3JpZ2luLCAyKSA6ICcnfVxuICAgIFxuICAgIHZvaWQgYXBwbHlUcmFuc2Zvcm0ke3NlZ21lbnQua2V5fShmbG9hdCB0aW1lLCBpbm91dCB2ZWMzIHYpIHtcbiAgICBcbiAgICAgICR7VGltZWxpbmVDaHVua3MucmVuZGVyQ2hlY2soc2VnbWVudCl9XG4gICAgICAke1RpbWVsaW5lQ2h1bmtzLnByb2dyZXNzKHNlZ21lbnQpfVxuICAgIFxuICAgICAgJHtvcmlnaW4gPyBgdiAtPSBjT3JpZ2luJHtzZWdtZW50LmtleX07YCA6ICcnfVxuICAgICAgdiAqPSBtaXgoY1NjYWxlRnJvbSR7c2VnbWVudC5rZXl9LCBjU2NhbGVUbyR7c2VnbWVudC5rZXl9LCBwcm9ncmVzcyk7XG4gICAgICAke29yaWdpbiA/IGB2ICs9IGNPcmlnaW4ke3NlZ21lbnQua2V5fTtgIDogJyd9XG4gICAgfVxuICAgIGA7XG4gIH0sXG4gIGRlZmF1bHRGcm9tOiBuZXcgVmVjdG9yMygxLCAxLCAxKVxufTtcblxuVGltZWxpbmUucmVnaXN0ZXIoJ3NjYWxlJywgU2NhbGVTZWdtZW50KTtcblxuZXhwb3J0IHsgU2NhbGVTZWdtZW50IH07XG4iLCJpbXBvcnQgeyBUaW1lbGluZSB9IGZyb20gJy4vVGltZWxpbmUnO1xuaW1wb3J0IHsgVGltZWxpbmVDaHVua3MgfSBmcm9tICcuL1RpbWVsaW5lQ2h1bmtzJztcbmltcG9ydCB7IFZlY3RvcjMsIFZlY3RvcjQgfSBmcm9tICd0aHJlZSc7XG5cbmNvbnN0IFJvdGF0aW9uU2VnbWVudCA9IHtcbiAgY29tcGlsZXIoc2VnbWVudCkge1xuICAgIGNvbnN0IGZyb21BeGlzQW5nbGUgPSBuZXcgVmVjdG9yNChcbiAgICAgIHNlZ21lbnQudHJhbnNpdGlvbi5mcm9tLmF4aXMueCxcbiAgICAgIHNlZ21lbnQudHJhbnNpdGlvbi5mcm9tLmF4aXMueSxcbiAgICAgIHNlZ21lbnQudHJhbnNpdGlvbi5mcm9tLmF4aXMueixcbiAgICAgIHNlZ21lbnQudHJhbnNpdGlvbi5mcm9tLmFuZ2xlXG4gICAgKTtcbiAgXG4gICAgY29uc3QgdG9BeGlzID0gc2VnbWVudC50cmFuc2l0aW9uLnRvLmF4aXMgfHwgc2VnbWVudC50cmFuc2l0aW9uLmZyb20uYXhpcztcbiAgICBjb25zdCB0b0F4aXNBbmdsZSA9IG5ldyBWZWN0b3I0KFxuICAgICAgdG9BeGlzLngsXG4gICAgICB0b0F4aXMueSxcbiAgICAgIHRvQXhpcy56LFxuICAgICAgc2VnbWVudC50cmFuc2l0aW9uLnRvLmFuZ2xlXG4gICAgKTtcbiAgXG4gICAgY29uc3Qgb3JpZ2luID0gc2VnbWVudC50cmFuc2l0aW9uLm9yaWdpbjtcbiAgICBcbiAgICByZXR1cm4gYFxuICAgICR7VGltZWxpbmVDaHVua3MuZGVsYXlEdXJhdGlvbihzZWdtZW50KX1cbiAgICAke1RpbWVsaW5lQ2h1bmtzLnZlYzQoYGNSb3RhdGlvbkZyb20ke3NlZ21lbnQua2V5fWAsIGZyb21BeGlzQW5nbGUsIDgpfVxuICAgICR7VGltZWxpbmVDaHVua3MudmVjNChgY1JvdGF0aW9uVG8ke3NlZ21lbnQua2V5fWAsIHRvQXhpc0FuZ2xlLCA4KX1cbiAgICAke29yaWdpbiA/IFRpbWVsaW5lQ2h1bmtzLnZlYzMoYGNPcmlnaW4ke3NlZ21lbnQua2V5fWAsIG9yaWdpbiwgMikgOiAnJ31cbiAgICBcbiAgICB2b2lkIGFwcGx5VHJhbnNmb3JtJHtzZWdtZW50LmtleX0oZmxvYXQgdGltZSwgaW5vdXQgdmVjMyB2KSB7XG4gICAgICAke1RpbWVsaW5lQ2h1bmtzLnJlbmRlckNoZWNrKHNlZ21lbnQpfVxuICAgICAgJHtUaW1lbGluZUNodW5rcy5wcm9ncmVzcyhzZWdtZW50KX1cblxuICAgICAgJHtvcmlnaW4gPyBgdiAtPSBjT3JpZ2luJHtzZWdtZW50LmtleX07YCA6ICcnfVxuICAgICAgdmVjMyBheGlzID0gbm9ybWFsaXplKG1peChjUm90YXRpb25Gcm9tJHtzZWdtZW50LmtleX0ueHl6LCBjUm90YXRpb25UbyR7c2VnbWVudC5rZXl9Lnh5eiwgcHJvZ3Jlc3MpKTtcbiAgICAgIGZsb2F0IGFuZ2xlID0gbWl4KGNSb3RhdGlvbkZyb20ke3NlZ21lbnQua2V5fS53LCBjUm90YXRpb25UbyR7c2VnbWVudC5rZXl9LncsIHByb2dyZXNzKTtcbiAgICAgIHZlYzQgcSA9IHF1YXRGcm9tQXhpc0FuZ2xlKGF4aXMsIGFuZ2xlKTtcbiAgICAgIHYgPSByb3RhdGVWZWN0b3IocSwgdik7XG4gICAgICAke29yaWdpbiA/IGB2ICs9IGNPcmlnaW4ke3NlZ21lbnQua2V5fTtgIDogJyd9XG4gICAgfVxuICAgIGA7XG4gIH0sXG4gIGRlZmF1bHRGcm9tOiB7YXhpczogbmV3IFZlY3RvcjMoKSwgYW5nbGU6IDB9XG59O1xuXG5UaW1lbGluZS5yZWdpc3Rlcigncm90YXRlJywgUm90YXRpb25TZWdtZW50KTtcblxuZXhwb3J0IHsgUm90YXRpb25TZWdtZW50IH07XG4iXSwibmFtZXMiOlsiQmFzZUFuaW1hdGlvbk1hdGVyaWFsIiwiU2hhZGVyTWF0ZXJpYWwiLCJjb25zdHJ1Y3RvciIsInBhcmFtZXRlcnMiLCJ1bmlmb3JtcyIsInVuaWZvcm1WYWx1ZXMiLCJjb25zb2xlIiwid2FybiIsIk9iamVjdCIsImtleXMiLCJmb3JFYWNoIiwia2V5Iiwic2V0VmFsdWVzIiwiVW5pZm9ybXNVdGlscyIsIm1lcmdlIiwic2V0VW5pZm9ybVZhbHVlcyIsInZhbHVlcyIsInZhbHVlIiwic3RyaW5naWZ5Q2h1bmsiLCJuYW1lIiwiam9pbiIsIkJhc2ljQW5pbWF0aW9uTWF0ZXJpYWwiLCJTaGFkZXJMaWIiLCJsaWdodHMiLCJ2ZXJ0ZXhTaGFkZXIiLCJjb25jYXRWZXJ0ZXhTaGFkZXIiLCJmcmFnbWVudFNoYWRlciIsImNvbmNhdEZyYWdtZW50U2hhZGVyIiwiYmFzaWMiLCJyZXBsYWNlIiwiTGFtYmVydEFuaW1hdGlvbk1hdGVyaWFsIiwibGFtYmVydCIsIlBob25nQW5pbWF0aW9uTWF0ZXJpYWwiLCJwaG9uZyIsIlN0YW5kYXJkQW5pbWF0aW9uTWF0ZXJpYWwiLCJleHRlbnNpb25zIiwiZGVyaXZhdGl2ZXMiLCJzdGFuZGFyZCIsIlRvb25BbmltYXRpb25NYXRlcmlhbCIsInRvb24iLCJQb2ludHNBbmltYXRpb25NYXRlcmlhbCIsInBvaW50cyIsIkRlcHRoQW5pbWF0aW9uTWF0ZXJpYWwiLCJkZXB0aFBhY2tpbmciLCJSR0JBRGVwdGhQYWNraW5nIiwiY2xpcHBpbmciLCJkZXB0aCIsIkRpc3RhbmNlQW5pbWF0aW9uTWF0ZXJpYWwiLCJkaXN0YW5jZVJHQkEiLCJQcmVmYWJCdWZmZXJHZW9tZXRyeSIsIkJ1ZmZlckdlb21ldHJ5IiwicHJlZmFiIiwiY291bnQiLCJwcmVmYWJHZW9tZXRyeSIsImlzUHJlZmFiQnVmZmVyR2VvbWV0cnkiLCJpc0J1ZmZlckdlb21ldHJ5IiwicHJlZmFiQ291bnQiLCJwcmVmYWJWZXJ0ZXhDb3VudCIsImF0dHJpYnV0ZXMiLCJwb3NpdGlvbiIsInZlcnRpY2VzIiwibGVuZ3RoIiwiYnVmZmVySW5kaWNlcyIsImJ1ZmZlclBvc2l0aW9ucyIsInByZWZhYkluZGljZXMiLCJwcmVmYWJJbmRleENvdW50IiwiaW5kZXgiLCJhcnJheSIsImkiLCJwdXNoIiwicHJlZmFiRmFjZUNvdW50IiwiZmFjZXMiLCJmYWNlIiwiYSIsImIiLCJjIiwiaW5kZXhCdWZmZXIiLCJVaW50MzJBcnJheSIsInNldEluZGV4IiwiQnVmZmVyQXR0cmlidXRlIiwiayIsInBvc2l0aW9uQnVmZmVyIiwiY3JlYXRlQXR0cmlidXRlIiwicG9zaXRpb25zIiwib2Zmc2V0IiwiaiIsInByZWZhYlZlcnRleCIsIngiLCJ5IiwieiIsImJ1ZmZlclV2cyIsInV2QnVmZmVyIiwidXZzIiwidXYiLCJmYWNlVmVydGV4VXZzIiwiaXRlbVNpemUiLCJmYWN0b3J5IiwiYnVmZmVyIiwiRmxvYXQzMkFycmF5IiwiYXR0cmlidXRlIiwic2V0QXR0cmlidXRlIiwiZGF0YSIsInNldFByZWZhYkRhdGEiLCJwcmVmYWJJbmRleCIsIk11bHRpUHJlZmFiQnVmZmVyR2VvbWV0cnkiLCJwcmVmYWJzIiwicmVwZWF0Q291bnQiLCJBcnJheSIsImlzQXJyYXkiLCJwcmVmYWJHZW9tZXRyaWVzIiwicHJlZmFiR2VvbWV0cmllc0NvdW50IiwicHJlZmFiVmVydGV4Q291bnRzIiwibWFwIiwicCIsInJlcGVhdFZlcnRleENvdW50IiwicmVkdWNlIiwiciIsInYiLCJyZXBlYXRJbmRleENvdW50IiwiZ2VvbWV0cnkiLCJpbmRpY2VzIiwiaW5kZXhPZmZzZXQiLCJwcmVmYWJPZmZzZXQiLCJ2ZXJ0ZXhDb3VudCIsInByZWZhYlBvc2l0aW9ucyIsInByZWZhYlV2cyIsImVycm9yIiwidXZPYmplY3RzIiwicHJlZmFiR2VvbWV0cnlJbmRleCIsInByZWZhYkdlb21ldHJ5VmVydGV4Q291bnQiLCJ3aG9sZSIsIndob2xlT2Zmc2V0IiwicGFydCIsInBhcnRPZmZzZXQiLCJJbnN0YW5jZWRQcmVmYWJCdWZmZXJHZW9tZXRyeSIsIkluc3RhbmNlZEJ1ZmZlckdlb21ldHJ5IiwiY29weSIsImluc3RhbmNlQ291bnQiLCJJbnN0YW5jZWRCdWZmZXJBdHRyaWJ1dGUiLCJVdGlscyIsInNlcGFyYXRlRmFjZXMiLCJpbCIsIm4iLCJ2YSIsInZiIiwidmMiLCJjbG9uZSIsImNvbXB1dGVDZW50cm9pZCIsIlZlY3RvcjMiLCJyYW5kb21JbkJveCIsImJveCIsInRNYXRoIiwicmFuZEZsb2F0IiwibWluIiwibWF4IiwicmFuZG9tQXhpcyIsInJhbmRGbG9hdFNwcmVhZCIsIm5vcm1hbGl6ZSIsImNyZWF0ZURlcHRoQW5pbWF0aW9uTWF0ZXJpYWwiLCJzb3VyY2VNYXRlcmlhbCIsImRlZmluZXMiLCJ2ZXJ0ZXhGdW5jdGlvbnMiLCJ2ZXJ0ZXhQYXJhbWV0ZXJzIiwidmVydGV4SW5pdCIsInZlcnRleFBvc2l0aW9uIiwiY3JlYXRlRGlzdGFuY2VBbmltYXRpb25NYXRlcmlhbCIsIk1vZGVsQnVmZmVyR2VvbWV0cnkiLCJtb2RlbCIsIm9wdGlvbnMiLCJtb2RlbEdlb21ldHJ5IiwiZmFjZUNvdW50IiwiY29tcHV0ZUNlbnRyb2lkcyIsImxvY2FsaXplRmFjZXMiLCJjZW50cm9pZHMiLCJjZW50cm9pZCIsInZlcnRleCIsImJ1ZmZlclNraW5uaW5nIiwic2tpbkluZGV4QnVmZmVyIiwic2tpbldlaWdodEJ1ZmZlciIsInNraW5JbmRleCIsInNraW5JbmRpY2VzIiwic2tpbldlaWdodCIsInNraW5XZWlnaHRzIiwidyIsInNldEZhY2VEYXRhIiwiZmFjZUluZGV4IiwiUG9pbnRCdWZmZXJHZW9tZXRyeSIsInBvaW50Q291bnQiLCJzZXRQb2ludERhdGEiLCJwb2ludEluZGV4IiwiU2hhZGVyQ2h1bmsiLCJjYXRtdWxsX3JvbV9zcGxpbmUiLCJjdWJpY19iZXppZXIiLCJlYXNlX2JhY2tfaW4iLCJlYXNlX2JhY2tfaW5fb3V0IiwiZWFzZV9iYWNrX291dCIsImVhc2VfYmV6aWVyIiwiZWFzZV9ib3VuY2VfaW4iLCJlYXNlX2JvdW5jZV9pbl9vdXQiLCJlYXNlX2JvdW5jZV9vdXQiLCJlYXNlX2NpcmNfaW4iLCJlYXNlX2NpcmNfaW5fb3V0IiwiZWFzZV9jaXJjX291dCIsImVhc2VfY3ViaWNfaW4iLCJlYXNlX2N1YmljX2luX291dCIsImVhc2VfY3ViaWNfb3V0IiwiZWFzZV9lbGFzdGljX2luIiwiZWFzZV9lbGFzdGljX2luX291dCIsImVhc2VfZWxhc3RpY19vdXQiLCJlYXNlX2V4cG9faW4iLCJlYXNlX2V4cG9faW5fb3V0IiwiZWFzZV9leHBvX291dCIsImVhc2VfcXVhZF9pbiIsImVhc2VfcXVhZF9pbl9vdXQiLCJlYXNlX3F1YWRfb3V0IiwiZWFzZV9xdWFydF9pbiIsImVhc2VfcXVhcnRfaW5fb3V0IiwiZWFzZV9xdWFydF9vdXQiLCJlYXNlX3F1aW50X2luIiwiZWFzZV9xdWludF9pbl9vdXQiLCJlYXNlX3F1aW50X291dCIsImVhc2Vfc2luZV9pbiIsImVhc2Vfc2luZV9pbl9vdXQiLCJlYXNlX3NpbmVfb3V0IiwicXVhZHJhdGljX2JlemllciIsInF1YXRlcm5pb25fcm90YXRpb24iLCJxdWF0ZXJuaW9uX3NsZXJwIiwiVGltZWxpbmVTZWdtZW50Iiwic3RhcnQiLCJkdXJhdGlvbiIsInRyYW5zaXRpb24iLCJjb21waWxlciIsInRyYWlsIiwicHJvdG90eXBlIiwiY29tcGlsZSIsImRlZmluZVByb3BlcnR5IiwiZ2V0IiwiVGltZWxpbmUiLCJ0aW1lS2V5Iiwic2VnbWVudHMiLCJfX2tleSIsInNlZ21lbnREZWZpbml0aW9ucyIsInJlZ2lzdGVyIiwiZGVmaW5pdGlvbiIsImFkZCIsInRyYW5zaXRpb25zIiwicG9zaXRpb25PZmZzZXQiLCJfZXZhbCIsImV2YWwiLCJ1bmRlZmluZWQiLCJNYXRoIiwicHJvY2Vzc1RyYW5zaXRpb24iLCJmcm9tIiwiZGVmYXVsdEZyb20iLCJ0byIsInRvU3RyaW5nIiwiZmlsbEdhcHMiLCJzIiwiczAiLCJzMSIsImVuZCIsImdldFRyYW5zZm9ybUNhbGxzIiwidCIsIlRpbWVsaW5lQ2h1bmtzIiwidmVjMyIsInRvUHJlY2lzaW9uIiwidmVjNCIsImRlbGF5RHVyYXRpb24iLCJzZWdtZW50IiwicHJvZ3Jlc3MiLCJlYXNlIiwiZWFzZVBhcmFtcyIsInJlbmRlckNoZWNrIiwic3RhcnRUaW1lIiwiZW5kVGltZSIsIlRyYW5zbGF0aW9uU2VnbWVudCIsIlNjYWxlU2VnbWVudCIsIm9yaWdpbiIsIlJvdGF0aW9uU2VnbWVudCIsImZyb21BeGlzQW5nbGUiLCJWZWN0b3I0IiwiYXhpcyIsImFuZ2xlIiwidG9BeGlzIiwidG9BeGlzQW5nbGUiXSwibWFwcGluZ3MiOiI7Ozs7OztDQUtBLE1BQU1BLHFCQUFOLFNBQW9DQyxvQkFBcEMsQ0FBbUQ7Q0FDakRDLEVBQUFBLFdBQVcsQ0FBRUMsVUFBRixFQUFjQyxRQUFkLEVBQXdCO0NBQ2pDOztDQUVBLFFBQUlELFVBQVUsQ0FBQ0UsYUFBZixFQUE4QjtDQUM1QkMsTUFBQUEsT0FBTyxDQUFDQyxJQUFSLENBQWEsMkZBQWI7Q0FFQUMsTUFBQUEsTUFBTSxDQUFDQyxJQUFQLENBQVlOLFVBQVUsQ0FBQ0UsYUFBdkIsRUFBc0NLLE9BQXRDLENBQStDQyxHQUFELElBQVM7Q0FDckRSLFFBQUFBLFVBQVUsQ0FBQ1EsR0FBRCxDQUFWLEdBQWtCUixVQUFVLENBQUNFLGFBQVgsQ0FBeUJNLEdBQXpCLENBQWxCO0NBQ0QsT0FGRDtDQUlBLGFBQU9SLFVBQVUsQ0FBQ0UsYUFBbEI7Q0FDRCxLQVhnQztDQWNqQzs7O0NBQ0FHLElBQUFBLE1BQU0sQ0FBQ0MsSUFBUCxDQUFZTixVQUFaLEVBQXdCTyxPQUF4QixDQUFpQ0MsR0FBRCxJQUFTO0NBQ3ZDLFdBQUtBLEdBQUwsSUFBWVIsVUFBVSxDQUFDUSxHQUFELENBQXRCO0NBQ0QsS0FGRCxFQWZpQzs7Q0FvQmpDLFNBQUtDLFNBQUwsQ0FBZVQsVUFBZixFQXBCaUM7O0NBdUJqQyxTQUFLQyxRQUFMLEdBQWdCUyxtQkFBYSxDQUFDQyxLQUFkLENBQW9CLENBQUNWLFFBQUQsRUFBV0QsVUFBVSxDQUFDQyxRQUFYLElBQXVCLEVBQWxDLENBQXBCLENBQWhCLENBdkJpQzs7Q0EwQmpDLFNBQUtXLGdCQUFMLENBQXNCWixVQUF0QjtDQUNEOztDQUVEWSxFQUFB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
