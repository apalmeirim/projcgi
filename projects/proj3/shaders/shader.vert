attribute vec4 vPosition;
attribute vec4 vNormal;

uniform mat4 mProjection;
uniform mat4 mModelView;
uniform mat4 mNormals;

varying vec4 fNormal;
varying vec4 fPosition;

void main()
{
    gl_Position = mProjection * mModelView * vPosition;
    fNormal = vNormal;
    fPosition = vPosition;
}
