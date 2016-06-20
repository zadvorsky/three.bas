/**
 * simplified version FilmGrain shader by alteredq / http://alteredqualia.com/
 */

THREE.FilmNoiseShader = {
	uniforms: {
		"tDiffuse":   { type: "t", value: null },
		"time":       { type: "f", value: 0.0 },
		"intensity": { type: "f", value: 0.5 }
	},

	vertexShader: [
		"varying vec2 vUv;",

		"void main() {",
			"vUv = uv;",
			"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
		"}"
	].join( "\n" ),

	fragmentShader: [
		"uniform float time;",
		"uniform float intensity;",
		"uniform sampler2D tDiffuse;",
		"varying vec2 vUv;",

		"void main() {",
			"vec4 cTextureScreen = texture2D( tDiffuse, vUv );",

			"float x = vUv.x * vUv.y * time *  1000.0;",
			"x = mod( x, 13.0 ) * mod( x, 123.0 );",
			"float dx = mod( x, 0.01 );",

			"vec3 cResult = cTextureScreen.rgb + cTextureScreen.rgb * clamp( 0.1 + dx * 100.0, 0.0, 1.0 );",

			"cResult = cTextureScreen.rgb + clamp( intensity, 0.0,1.0 ) * ( cResult - cTextureScreen.rgb );",
			"gl_FragColor =  vec4( cResult, cTextureScreen.a );",
		"}"

	].join( "\n" )

};
