precision mediump float;

varying vec2 vTexcoord;
varying vec4 vColor;
uniform sampler2D uTexture;

void main(void) {
    // if (vTexcoord.x < 0.0 ||
    //     vTexcoord.y < 0.0 ||
    //     vTexcoord.x > 1.0 ||
    //     vTexcoord.y > 1.0) {
    //     discard;
    // }
    gl_FragColor = vec4(texture2D(uTexture, vTexcoord) * vColor);
}