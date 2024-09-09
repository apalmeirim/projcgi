precision highp float;

varying vec3 fColor;
varying vec3 fNormal;

void main() {
    gl_FragColor = vec4(fColor, 1.0);
}

