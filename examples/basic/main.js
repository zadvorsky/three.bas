var mContainer;
var mCamera, mRenderer;
var mControls;

var mScene;

var mParticleCount = 1000000;
var mParticleSystem;

var mTime = 0.0;

window.onload = function() {
    init();
};

function init() {
    initTHREE();
    initControls();
    initParticleSystem();

    requestAnimationFrame(tick);
    window.addEventListener('resize', resize, false);
}

function initTHREE() {
    mRenderer = new THREE.WebGLRenderer({antialias:false});
    mRenderer.setSize(window.innerWidth, window.innerHeight);

    mContainer = document.getElementById('three-container');
    mContainer.appendChild(mRenderer.domElement);

    mCamera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 10000);
    mCamera.position.z = 800;

    mScene = new THREE.Scene();

    var light;

    light = new THREE.DirectionalLight(0xAD2959, 1);
    light.position.set(0, 1, 0);
    mScene.add(light);

    light = new THREE.DirectionalLight(0x095062, 1);
    light.position.set(0, -1, 0);
    mScene.add(light);
}

function initControls() {
    mControls = new THREE.OrbitControls(mCamera, mRenderer.domElement);
}

function initParticleSystem() {
    // the geometry of each particle
    var prefabGeometry = new THREE.TetrahedronGeometry(1);
    // the geometry for all particles, stored in one buffer
    // the data (vertex position, uv and index) of the prefabGeometry will be duplicated x mParticleCount
    var bufferGeometry = new THREE.BAS.PrefabBufferGeometry(prefabGeometry, mParticleCount);

    // generate additional geometry data

    var i, j, offset;

    // aPosition is a THREE.BufferAttribute that stores the position of each particle in the scene
    var aPosition = bufferGeometry.createAttribute('aPosition', 3);
    var spread = 400;

    offset = 0;

    for (i = 0; i < mParticleCount; i++) {
        // random position from -range/2 to range/2
        var x = THREE.Math.randFloatSpread(spread);
        var y = THREE.Math.randFloatSpread(spread);
        var z = THREE.Math.randFloatSpread(spread);

        // store the same position for each particle
        for (j = 0; j < prefabGeometry.vertices.length; j++) {
            aPosition.array[offset++] = x;
            aPosition.array[offset++] = y;
            aPosition.array[offset++] = z;
        }
    }

    // aAxis is a THREE.BufferAttribute that stores the local rotation axis for each particle
    var aAxis = bufferGeometry.createAttribute('aAxis', 3);
    var axis = new THREE.Vector3();

    offset = 0;

    for (i = 0; i < mParticleCount; i++) {
        // a random axis (must be normalized, or things will get funky)
        axis.x = THREE.Math.randFloatSpread(2);
        axis.y = THREE.Math.randFloatSpread(2);
        axis.z = THREE.Math.randFloatSpread(2);
        axis.normalize();

        // store the same axis for each particle
        for (j = 0; j < prefabGeometry.vertices.length; j++) {
            aAxis.array[offset++] = axis.x;
            aAxis.array[offset++] = axis.y;
            aAxis.array[offset++] = axis.z;
        }
    }

    // this is where the magic happens!

    var material = new THREE.BAS.PhongAnimationMaterial(
        // custom parameters & THREE.MeshPhongMaterial parameters
        {
            shading: THREE.FlatShading,
            // definitions of extra uniforms used in the shader
            uniforms: {
                // uTime is used to calculate the rotation of each particle
                uTime:{type:'f', value:0}
            },
            // glsl functions that should be inserted into the vertex shader
            shaderFunctions: [
                THREE.BAS.ShaderChunk['quaternion_rotation']
            ],
            // glsl parameters that should be inserted into the vertex shader
            // these must match the custom uniforms of this PhongAnimationMaterial
            // and the custom attributes of the PrefabBufferGeometry
            shaderParameters: [
                'uniform float uTime;',
                'attribute vec3 aPosition;',
                'attribute vec3 aAxis;'
            ],
            // glsl code that should be inserted at the start of the vertex shader body (after 'void main() {')
            shaderVertexInit: [
                // set the angle based on time (which is increased every frame)
                // this is quite lazy, but efficient
                'float angle = uTime;',
                // create a quaternion based on the axis attribute and the angle
                // the 'quatFromAxisAngle' function is defined in THREE.BAS.ShaderChunk['quaternion_rotation']
                'vec4 tQuat = quatFromAxisAngle(aAxis, angle);'
            ],
            // glsl code used to transform the vertex normal
            // 'objectNormal' is the temporary register used inside THREE.MeshPhongMaterial.vertexShader
            // this code will be inserted before any other transformations
            shaderTransformNormal: [
                // use the quaternion created in 'shaderVertexInit' to rotate the normal
                // the 'rotateVector' function is defined in THREE.BAS.ShaderChunk['quaternion_rotation']
                'objectNormal = rotateVector(tQuat, objectNormal);'
            ],
            // glsl code used to transform the vertex position
            // 'transformed' is the temporary register used inside THREE.MeshPhongMaterial.vertexShader
            // this code will be inserted before any other transformations
            shaderTransformPosition: [
                // use the quaternion created in 'shaderVertexInit' to rotate the vertex position
                'transformed = rotateVector(tQuat, transformed);',
                // translate the rotated vertex position
                // the order of transformation matters, just like with matrices
                'transformed += aPosition;'
            ]
        },
        // THREE.MeshPhongMaterial uniforms
        {
            diffuse: 0xffffff, // color
            specular: 0xFBE087,
            shininess: 80
        }
    );

    // it's just a mesh!
    mParticleSystem = new THREE.Mesh(bufferGeometry, material);

    mScene.add(mParticleSystem);
}

function tick() {
    update();
    render();

    mTime += (1/60);

    requestAnimationFrame(tick);
}

function update() {
    mControls.update();

    // update the uTime attribute of the particle system
    mParticleSystem.material.uniforms['uTime'].value = mTime;
}

function render() {
    mRenderer.render(mScene, mCamera);
}

function resize() {
    mCamera.aspect = window.innerWidth / window.innerHeight;
    mCamera.updateProjectionMatrix();

    mRenderer.setSize(window.innerWidth, window.innerHeight);
}
