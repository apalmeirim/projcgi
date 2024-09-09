precision highp float;

const int MAX_LIGHTS = 8;

struct LightInfo {
    vec4 pos;
    vec3 Ia;
    vec3 Id;
    vec3 Is;
};

struct MaterialInfo {
    vec3 Ka;
    vec3 Kd;
    vec3 Ks;
    float shininess;
};

uniform int uNLights;

uniform LightInfo uLight [MAX_LIGHTS];
uniform MaterialInfo uMaterial;

uniform mat4 mView;
uniform mat4 mProjection;
uniform mat4 mModelView;
uniform mat4 mNormals;
uniform mat4 mViewNormals;

uniform bool uUseNormals;
uniform bool lightObj;

varying vec4 fPosition;
varying vec4 fNormal;

void main()
{
    
    vec3 light;
    vec3 posC = (mModelView * fPosition).xyz;
    vec3 normal = (mNormals * fNormal).xyz;
    vec3 viewer = vec3(0,0,1);
    
    vec3 ambient = vec3(0.0,0.0,0.0);
    vec3 diffuse = vec3(0.0,0.0,0.0);
    vec3 specular = vec3(0.0,0.0,0.0);

    if(lightObj){
        ambient = uMaterial.Ka;
        diffuse = uMaterial.Kd;
        specular = uMaterial.Ks;
    }
    
    else{
        for(int i = 0; i < 8; i++) {
            if(i == uNLights) break;
            
            if(uLight[i].pos.w == 0.0)
                light = normalize((mViewNormals * uLight[i].pos).xyz);
            else
                light = normalize((mView * uLight[i].pos).xyz - posC);

            vec3 N = normalize(normal);
            vec3 L = light;
            vec3 V = normalize(viewer);
            vec3 H = normalize(L + V);
            //vec3 R = reflect(-L,V);
            float dFactor = max(dot(L,N), 0.0);
            float sFactor = pow(max(dot(N, H), 0.0), uMaterial.shininess);
            
            ambient += uLight[i].Ia * uMaterial.Ka;
            diffuse += uLight[i].Id * uMaterial.Kd * dFactor;
            specular += uLight[i].Is * uMaterial.Ks * sFactor;

            if(dot(L, N) < 0.0) {
                specular = vec3(0.0, 0.0, 0.0);
            }
        }
    }

    gl_FragColor = vec4(ambient + diffuse + specular, 1.0);

}


