// get vert values
attribute vec2 aVertexPosition;
attribute vec2 aTexcoord;

// canvas resolution and other uniforms
uniform vec4 uColor;
uniform vec2 uResolution;
uniform vec2 uTranslation;
uniform vec2 uScale;
uniform vec2 uRotation;
// texture uniforms
uniform vec2 uTexpos;    // position on image
uniform vec2 uTexsize;   // size on image
uniform vec2 uImagesize; // total image size

// send texcoords to fragment shader
varying vec2 vTexcoord;
varying vec4 vColor;

void main(void) {
  vec2 scaledPosition = aVertexPosition * uScale;
  vec2 rotatedPosition = vec2(
     scaledPosition.x * uRotation.y + scaledPosition.y * uRotation.x,
     scaledPosition.y * uRotation.y - scaledPosition.x * uRotation.x
  );
  vec2 position = rotatedPosition + uTranslation;
  vec2 zeroToOne = position / uResolution;
  vec2 zeroToTwo = zeroToOne * 2.0;
  vec2 clipSpace = zeroToTwo - 1.0;

  gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);


  vec2 newPos = (aTexcoord * uTexsize) / uImagesize; // image relative position
  vTexcoord = (uTexpos / uImagesize) + newPos;
  vColor = uColor;
}