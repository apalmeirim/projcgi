attribute vec2 vOldPosition;

uniform mat3 m[7];
uniform float p[7];

varying float newFunction;
varying vec2 newPosition;

void main() {
    float r = fract(sin(dot(vOldPosition.xy, vec2(12.9898, 78.233))) * 43758.5453);
    int tmp;
    float sum = 0.0;
    for (int i = 0; i < 7; i++){
        sum += p[i];
        if(r <= sum){
            tmp = i;
            
            break;
        }
    }
    newPosition = (m[tmp] * vec3(vOldPosition, 1.0)).xy;
    newFunction = float(tmp);
}