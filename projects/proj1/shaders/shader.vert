attribute vec2 vPosition;
attribute float vFunction;

uniform vec4 c[7];
uniform vec2 uBottomLeft;
uniform vec2 uTopRight;
varying vec4 fColor;

void main() 
{
    vec2 size = uTopRight - uBottomLeft;
    vec2 tmp = (vPosition - uBottomLeft)*2.0 / size - vec2(1.0, 1.0);
    
    gl_PointSize = 1.0;
    gl_Position = vec4(tmp, 0.0, 1.0);
    fColor = c[int(vFunction)];
}
