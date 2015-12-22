THREE.BAS.Utils = {
  separateFaces:function(geometry) {
    var vertices = [];

    for ( var i = 0, il = geometry.faces.length; i < il; i ++ ) {

      var n = vertices.length;

      var face = geometry.faces[ i ];

      var a = face.a;
      var b = face.b;
      var c = face.c;

      var va = geometry.vertices[ a ];
      var vb = geometry.vertices[ b ];
      var vc = geometry.vertices[ c ];

      vertices.push( va.clone() );
      vertices.push( vb.clone() );
      vertices.push( vc.clone() );

      face.a = n;
      face.b = n + 1;
      face.c = n + 2;

    }

    geometry.vertices = vertices;
    delete geometry.__tmpVertices;
  },

  computeCentroid:(function() {
    var v = new THREE.Vector3();

    return function (geometry, face) {
      var a = geometry.vertices[face.a],
          b = geometry.vertices[face.b],
          c = geometry.vertices[face.c];

      v.x = (a.x + b.x + c.x) / 3;
      v.y = (a.y + b.y + c.y) / 3;
      v.z = (a.z + b.z + c.z) / 3;

      return v;
    }
  })()
};