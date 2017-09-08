import babel from 'rollup-plugin-babel';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

function glsl() {
  return {
    transform( code, id ) {
      if ( /\.glsl$/.test( id ) === false ) return;
      
      var transformedCode = 'export default ' + JSON.stringify(
          code
            .replace( /[ \t]*\/\/.*\n/g, '' ) // remove //
            .replace( /[ \t]*\/\*[\s\S]*?\*\//g, '' ) // remove /* */
            .replace( /\n{2,}/g, '\n' ) // # \n+ to \n
        ) + ';';
      return {
        code: transformedCode,
        map: { mappings: '' }
      };
    }
  };
}

export default {
  plugins: [
    babel({
      exclude: ['node_modules/**', 'src/**/*.glsl'],
    }),
    resolve({
      jsnext: true,
      main: true,
      browser: true,
    }),
    commonjs(),
    glsl()
  ],
  input: 'src/main.js',

  external: ['three'],
  globals: {
    three: 'THREE'
  },
  
  output: [
    {
      format: 'umd',
      name: 'BAS',
      file: 'dist/bas.js'
    },
    {
      format: 'es',
      file: 'dist/bas.module.js'
    }
  ],
};
