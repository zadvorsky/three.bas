var mContainer;
var mCamera, mRenderer;
var mControls;

var mScene;

var mTime = 0.0;
var mTimeStep = (1/60);
var mDuration = 10;

var mGameController;

window.onload = function () {
  init();
};

function init() {
  initTHREE();
  initControls();

  mGameController = new GameController(mScene);
  mGameController.init();

  requestAnimationFrame(tick);
  window.addEventListener('resize', resize, false);
}

function initTHREE() {
  mRenderer = new THREE.WebGLRenderer({antialias: false});
  mRenderer.setSize(window.innerWidth, window.innerHeight);
  mRenderer.setClearColor(0x666666);

  mContainer = document.getElementById('three-container');
  mContainer.appendChild(mRenderer.domElement);

  mCamera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 10000);
  mCamera.position.set(0, 2, -4);

  mScene = new THREE.Scene();
  //mScene.fog = new THREE.FogExp2(0x666666, 0.015);
  //mScene.add(new THREE.GridHelper(50, 10));

  var light;

  light = new THREE.DirectionalLight();
  light.position.set(0, 25, 50);
  mScene.add(light);

  light = new THREE.DirectionalLight(0xffffff, 0.5);
  light.position.set(0, 25, -50);
  mScene.add(light);
}

function initControls() {
  mControls = new THREE.OrbitControls(mCamera, mRenderer.domElement);
  mControls.target.y = 2;
}

function tick() {
  update();
  render();

  mTime += mTimeStep;
  mTime %= mDuration;

  requestAnimationFrame(tick);
}

function update() {
  mControls.update();

  mGameController.update();
}

function render() {
  mRenderer.render(mScene, mCamera);
}

function resize() {
  mCamera.aspect = window.innerWidth / window.innerHeight;
  mCamera.updateProjectionMatrix();

  mRenderer.setSize(window.innerWidth, window.innerHeight);
}


function GameController(scene) {
  var mPlayerTileIndex = 0;
  var mTilesInWorld = [];

  var mDebug = true;

  var mPlayerTile = null;
  var mMainSpline = null;
  var mCrossSpline = null;
  var mPlayerSplineProgress = 0;

  var mTileFactory = new TileFactory();
  var mTileWidth = mTileFactory.tileWidth, mHalfTileWidth = mTileWidth * 0.5;
  var mTileDepth = mTileFactory.tileDepth, mHalfTileDepth = mTileDepth * 0.5;


  var mEyeHeight = 3;

  var g = new THREE.OctahedronGeometry(1);
  var m = new THREE.MeshPhongMaterial({color:0xff0000, shading:THREE.FlatShading});
  var mPlayerObject = new THREE.Mesh(g, m);

  function placeNextTile() {
    var tile = mTileFactory.nextTile();

    tile.position.z = mTileFactory.tileDepth * mTilesInWorld.length;
    tile.setAnimationProgress(0);

    if (mDebug) {
      tile.userData.mainSplineHelper && tile.remove(tile.userData.mainSplineHelper);
      tile.userData.mainSplineHelper = new SplineHelper(tile.userData.mainSpline, 0xff0000);
      tile.userData.mainSplineHelper.position.y += mEyeHeight;
      tile.add(tile.userData.mainSplineHelper);
    }

    mTilesInWorld.push(tile);

    return tile;
  }

  function updatePlayerSpline() {
    mPlayerTile = mTilesInWorld[mPlayerTileIndex];
    mMainSpline = mPlayerTile.userData.mainSpline;
    mCrossSpline = mPlayerTile.userData.crossSpline;

    mPlayerTile.add(mPlayerObject);
  }

  return {
    init:function() {
      for (var i = 0; i < mTileFactory.cacheSize; i++) {
        scene.add(placeNextTile());
      }

      updatePlayerSpline();

      mPlayerObject.add(mCamera);
    },
    update:function() {
      if (mPlayerSplineProgress >= 1.0) {
        mPlayerSplineProgress = 0;
        mPlayerTileIndex++;

        placeNextTile();
        updatePlayerSpline();
      }

      mPlayerObject.position.copy(mMainSpline.getPointAt(mPlayerSplineProgress));

      var crossFraction = THREE.Math.mapLinear(mPlayerObject.position.x, -mHalfTileWidth, mHalfTileWidth, 0.0, 1.0);

      mPlayerObject.position.y += mCrossSpline.getPointAt(crossFraction).y;
      mPlayerObject.position.y += mEyeHeight;

      mPlayerSplineProgress += 0.005;

      //var animationProgress = mPlayerSplineProgress + 0.25;
      var animationProgress = THREE.Math.mapLinear(mPlayerObject.position.z, -mHalfTileDepth, mHalfTileDepth, 0.0, 1.0) + 0.25;

      if (animationProgress > 1.0) {
        var nextAnimationProgress = animationProgress - 1.0;
        var nextTile = mTilesInWorld[mPlayerTileIndex + 1];
        nextTile.setAnimationProgress(nextAnimationProgress);

        animationProgress = 1.0;
      }

      mPlayerTile.setAnimationProgress(animationProgress);
    }
  }
}

function SplineHelper(spline, color) {
  var g = new THREE.Geometry();
  var m = new THREE.LineBasicMaterial({color:color});

  g.vertices = spline.getPoints(100);

  THREE.Line.call(this, g, m);
}
SplineHelper.prototype = Object.create(THREE.Line.prototype);
SplineHelper.prototype.constructor = SplineHelper;


function TileBufferGeometry(prefab, count) {
  THREE.BAS.PrefabBufferGeometry.call(this, prefab, count);
}
TileBufferGeometry.prototype = Object.create(THREE.BAS.PrefabBufferGeometry.prototype);
TileBufferGeometry.prototype.constructor = TileBufferGeometry;
TileBufferGeometry.prototype.bufferPositions = function() {
  var positionBuffer = this.attributes['position'].array;

  for (var i = 0, offset = 0; i < this.prefabCount; i++) {
    for (var j = 0; j < this.prefabVertexCount; j++, offset += 3) {
      var prefabVertex = this.prefabGeometry.vertices[j];

      positionBuffer[offset    ] = prefabVertex.x;
      positionBuffer[offset + 1] = prefabVertex.y + THREE.Math.randFloatSpread(1);
      positionBuffer[offset + 2] = prefabVertex.z;
    }
  }
};


function Tile(prefabGeometry, prefabCount) {
  var geometry = new TileBufferGeometry(prefabGeometry, prefabCount);

  geometry.createAttribute('aDelayDuration', 2);
  geometry.createAttribute('aStartPosition', 3);
  geometry.createAttribute('aEndPosition', 3);

  var material = new THREE.BAS.PhongAnimationMaterial({
      shading: THREE.FlatShading,
      fog: true,
      uniforms: {
        uTime: {type: 'f', value: 0}
      },
      shaderFunctions: [
        THREE.BAS.ShaderChunk['ease_in_out_cubic']
      ],
      shaderParameters: [
        'uniform float uTime;',
        'attribute vec2 aDelayDuration;',
        'attribute vec3 aStartPosition;',
        'attribute vec3 aEndPosition;'
      ],
      shaderVertexInit: [
        'float tDelay = aDelayDuration.x;',
        'float tDuration = aDelayDuration.y;',
        'float tTime = clamp(uTime - tDelay, 0.0, tDuration);',
        'float tProgress = ease(tTime, 0.0, 1.0, tDuration);'
      ],
      shaderTransformPosition: [
        'transformed += mix(aStartPosition, aEndPosition, tProgress);'
      ]
    }, {
      shininess: 30,
      diffuse:0x333333
    }
  );

  THREE.Mesh.call(this, geometry, material);
}
Tile.prototype = Object.create(THREE.Mesh.prototype);
Tile.prototype.constructor = Tile;

Tile.prototype.setAnimationProgress = function(progress) {
  this.material.uniforms['uTime'].value = this.animationDuration * progress;
};

function TileFactory() {
  // pillar things
  var mPillarWidth = 2;
  var mPillarHeight = 60;
  var mPillarDepth = 4;
  var mPillarGeometry = new THREE.BoxGeometry(mPillarWidth, mPillarHeight, mPillarDepth);
  var mPrefabVertexCount = mPillarGeometry.vertices.length;

  mPillarGeometry.applyMatrix(new THREE.Matrix4().makeTranslation(0, -mPillarHeight * 0.5, 0));

  // tile things
  var mGridWidth = 100;
  var mGridDepth = 50;
  var mTileWidth = mGridWidth * mPillarWidth, halfTileWidth = mTileWidth * 0.5;
  var mTileDepth = mGridDepth * mPillarDepth, halfTileDepth = mTileDepth * 0.5;
  var mPillarCount = mGridWidth * mGridDepth;
  // height variance along the x axis
  var mCrossSpline = createCrossSpline(8, 8);

  // tile cache
  var mTileCache = [];
  var mTileCacheIndex = 0;

  for (var i = 0; i < 2; i++) {
    mTileCache[i] = createTile();
  }

  // helpers
  function createTile() {
    var tile = new Tile(mPillarGeometry, mPillarCount);

    tile.frustumCulled = false;

    return tile;
  }

  function configureTile(tile, mainSpline, crossSpline) {
    var aDelayDuration = tile.geometry.attributes['aDelayDuration'];
    var aStartPosition = tile.geometry.attributes['aStartPosition'];
    var aEndPosition = tile.geometry.attributes['aEndPosition'];

    var i, j, offset;

    // buffer time offset
    var delay;
    var duration;
    var minDuration = 1;
    var maxDuration = 2;
    var rowDelay = 0.05;
    var vertexVariance = 0.5;

    for (i = 0, offset = 0; i < mPillarCount; i++) {
      delay = rowDelay * (i % mGridDepth);
      duration = THREE.Math.randFloat(minDuration, maxDuration);

      for (j = 0; j < mPrefabVertexCount; j++) {
        aDelayDuration.array[offset++] = delay + THREE.Math.randFloatSpread(vertexVariance * 2);
        aDelayDuration.array[offset++] = duration;
      }
    }

    tile.animationDuration = maxDuration + rowDelay * mGridDepth + vertexVariance;

    var x, y, z;

    var pathWidth = 40; // meters
    var pathWidthRange = pathWidth / mTileWidth * 0.5;
    var tileRandomSpreadY = 0; // meters
    var tileDensity = 0.25;

    for (x = -halfTileWidth, offset = 0; x < halfTileWidth; x += mPillarWidth) {
      for (z = -halfTileDepth; z < halfTileDepth; z += mPillarDepth) {

        var t1 = THREE.Math.mapLinear(z, -halfTileDepth, halfTileDepth, 0, 1);
        var mainSplinePoint = mainSpline.getPoint(t1);
        var t2 = THREE.Math.mapLinear(x, -halfTileWidth, halfTileWidth, 0, 1);
        var crossSplinePoint = crossSpline.getPoint(t2);

        y = mainSplinePoint.y + crossSplinePoint.y + THREE.Math.randFloat(0, tileRandomSpreadY);
        //y = mainSplinePoint.y + THREE.Math.randFloat(0, tileRandomSpreadY);

        var endY;

        if (Math.random() < tileDensity && Math.abs(mainSplinePoint.x - x) > mTileWidth * pathWidthRange) {
          endY = THREE.Math.randFloat(mPillarHeight * 0.25, mPillarHeight * 0.75);
        }
        else {
          endY = y;
        }

        for (j = 0; j < mPrefabVertexCount; j++, offset += 3) {
          aStartPosition.array[offset  ] = x;
          aStartPosition.array[offset+1] = y;
          aStartPosition.array[offset+2] = z;

          aEndPosition.array[offset  ] = x;
          aEndPosition.array[offset+1] = endY;
          aEndPosition.array[offset+2] = z;
        }
      }
    }

    aDelayDuration.needsUpdate = true;
    aEndPosition.needsUpdate = true;
    aStartPosition.needsUpdate = true;

    tile.userData.mainSpline = mainSpline;
    tile.userData.crossSpline = crossSpline;
  }

  function createMainSpline(pointCount, xVariance, yVariance) {
    var points = [];
    var point;

    for (var i = 0; i < pointCount; i++) {
      point = new THREE.Vector3();

      if (!i || pointCount - i === 1) {
        point.x = 0;
        point.y = 0;
      }
      else {
        point.x = THREE.Math.randFloatSpread(xVariance);
        point.y = THREE.Math.randFloatSpread(yVariance);
      }

      point.z = THREE.Math.mapLinear(i, 0, pointCount - 1, -halfTileDepth, halfTileDepth);

      points.push(point);
    }

    return new THREE.CatmullRomCurve3(points);
  }

  function createCrossSpline(pointCount, yVariance) {
    var points = [];
    var point;

    for (var i = 0; i < pointCount; i++) {
      point = new THREE.Vector3();
      point.x = THREE.Math.mapLinear(i, 0, pointCount - 1, -halfTileWidth, halfTileWidth);
      point.y = THREE.Math.randFloatSpread(yVariance);
      point.z = 0;

      points.push(point);
    }

    return new THREE.CatmullRomCurve3(points);
  }

  return {
    tileWidth:mTileWidth,
    tileDepth:mTileDepth,
    cacheSize:mTileCache.length,
    nextTile:function() {
      var tile = mTileCache[mTileCacheIndex];

      mTileCacheIndex++;
      mTileCacheIndex %= mTileCache.length;

      var mainSpline = createMainSpline(6, 32, 16);

      configureTile(tile, mainSpline, mCrossSpline);

      return tile;
    }
  }
}

