precision mediump float;

// Color from vert shader
varying lowp vec4 vColor;

void main(void) {
    gl_FragColor = vColor;
}