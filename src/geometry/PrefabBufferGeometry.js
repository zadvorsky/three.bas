THREE.BAS.PrefabBufferGeometry = function(prefab, count) {
    THREE.BufferGeometry.call(this);

    this.prefabGeometry = prefab;
    this.prefabCount = count;
    this.prefabVertexCount = prefab.vertices.length;

    this.bufferDefaults();
};
THREE.BAS.PrefabBufferGeometry.prototype = Object.create(THREE.BufferGeometry.prototype);
THREE.BAS.PrefabBufferGeometry.prototype.constructor = THREE.BAS.PrefabBufferGeometry;

THREE.BAS.PrefabBufferGeometry.prototype.bufferDefaults = function() {
    // todo figure out how to handle normals
    var prefabIndices = [];
    var prefabUvs = [];
    var prefabFaceCount = this.prefabGeometry.faces.length;
    var prefabIndexCount = this.prefabGeometry.faces.length * 3;
    var prefabVertexCount = this.prefabVertexCount = this.prefabGeometry.vertices.length;

    //console.log('prefabCount', this.prefabCount);
    //console.log('prefabFaceCount', prefabFaceCount);
    //console.log('prefabIndexCount', prefabIndexCount);
    //console.log('prefabVertexCount', prefabVertexCount);
    //console.log('triangles', prefabFaceCount * this.prefabCount);

    for (var h = 0; h < prefabFaceCount; h++) {
        var face = this.prefabGeometry.faces[h];
        prefabIndices.push(face.a, face.b, face.c);

        var uv = this.prefabGeometry.faceVertexUvs[0][h];
        prefabUvs[face.a] = uv[0];
        prefabUvs[face.b] = uv[1];
        prefabUvs[face.c] = uv[2];
    }

    var indexBuffer = new Uint32Array(this.prefabCount * prefabIndexCount);
    var positionBuffer = new Float32Array(this.prefabCount * prefabVertexCount * 3);
    var uvBuffer = new Float32Array(this.prefabCount * prefabVertexCount * 2);

    this.setIndex(new THREE.BufferAttribute(indexBuffer, 1));
    this.addAttribute('position', new THREE.BufferAttribute(positionBuffer, 3));
    this.addAttribute('uv', new THREE.BufferAttribute(uvBuffer, 2));

    var s2 = 0, s3 = 0;

    for (var i = 0; i < this.prefabCount; i++) {
        for (var j = 0; j < prefabVertexCount; j++) {

            var prefabVertex = this.prefabGeometry.vertices[j];
            positionBuffer[s3    ] = prefabVertex.x;
            positionBuffer[s3 + 1] = prefabVertex.y;
            positionBuffer[s3 + 2] = prefabVertex.z;

            var prefabUv = prefabUvs[j];
            uvBuffer[s2    ] = prefabUv.x;
            uvBuffer[s2 + 1] = prefabUv.y;

            s2 += 2; s3 += 3;
        }

        for (var k = 0; k < prefabIndexCount; k++) {
            indexBuffer[i * prefabIndexCount + k] = prefabIndices[k] + i * prefabVertexCount;
        }
    }
};

THREE.BAS.PrefabBufferGeometry.prototype.createAttribute = function(name, itemSize) {
    var buffer = new Float32Array(this.prefabCount * this.prefabVertexCount * itemSize);
    var attribute = new THREE.BufferAttribute(buffer, itemSize);

   this.addAttribute(name, attribute);

    return attribute;
};

THREE.BAS.PrefabBufferGeometry.prototype.setAttribute4 = function(name, data) {
    var offset = 0;
    var array = this.geometry.attributes[name].array;
    var i, j;

    for (i = 0; i < data.length; i++) {
        var v = data[i];

        for (j = 0; j < this.prefabVertexCount; j++) {
            array[offset++] = v.x;
            array[offset++] = v.y;
            array[offset++] = v.z;
            array[offset++] = v.w;
        }
    }

    this.geometry.attributes[name].needsUpdate = true;
};
THREE.BAS.PrefabBufferGeometry.prototype.setAttribute3 = function(name, data) {
    var offset = 0;
    var array = this.geometry.attributes[name].array;
    var i, j;

    for (i = 0; i < data.length; i++) {
        var v = data[i];

        for (j = 0; j < this.prefabVertexCount; j++) {
            array[offset++] = v.x;
            array[offset++] = v.y;
            array[offset++] = v.z;
        }
    }

    this.geometry.attributes[name].needsUpdate = true;
};
THREE.BAS.PrefabBufferGeometry.prototype.setAttribute2 = function(name, data) {
    var offset = 0;
    var array = this.geometry.attributes[name].array;
    var i, j;

    for (i = 0; i < this.prefabCount; i++) {
        var v = data[i];

        for (j = 0; j < this.prefabVertexCount; j++) {
            array[offset++] = v.x;
            array[offset++] = v.y;
        }
    }

    this.geometry.attributes[name].needsUpdate = true;
};
