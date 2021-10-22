// get vert values
attribute vec2 aVertexPosition;
attribute vec4 aVertexColor;

// uniforms
uniform mat4 uMatrix;
uniform vec4 uColor;

// uniform mat4 uMVMatrix;
// uniform mat4 uPMatrix;

// send color to fragment shader
varying lowp vec4 vColor;
void main(void) {
  gl_Position = uMatrix * vec4(aVertexPosition, 1, 1);
  // send color to fragshader
  vColor = uColor;
}