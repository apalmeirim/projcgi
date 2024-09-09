/*Authors: Duarte Inácio nº62397
           António Palmeirim nº 63667
*/
import { loadShadersFromURLS, loadShadersFromScripts, setupWebGL, buildProgramFromSources } from "../../libs/utils.js";
import { vec2, vec4, sizeof,mat3, flatten, translate } from "../../libs/MV.js";

/** @type {WebGL2RenderingContext} */
var gl;

/** @type {WebGLProgram} */
var drawProgram;

/** @type {WebGLProgram} */
var iterationProgram;

/** @type {HTMLCanvasElement} */
var canvas;

var aspect;

/** @type {WebGLBuffer} */
var aBuffer, bBuffer;

var scale = 1.0;

let vertices = [];

let m = [];
let p = [];

let start = false;

var shaderRatio = [];
var offsetX = 0.0;
var offsetY = 0.0;

let dragging = false;
let prevX, prevY;

var iterationCount = 0;
var iterLimit = 50;

const colors = [
    vec4(0.9,0.02,1.0,0.5),
    vec4(0.3,0.96,0.95,0.5),
    vec4(0.93,0.5,0.15,0.5),
    vec4(1.0,0.0,0.0,0.5),
    vec4(0.0,1.0,0.0,0.5),
    vec4(0.9,0.93,0.15,0.5),
    vec4(0.0,0.0,1.0,0.5)
];

const nPoints = 500000;

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    aspect = canvas.width / canvas.height;

    // Setup the viewport
    gl.viewport(0, 0, canvas.width, canvas.height);
}


function clearBufferAndScreen(){
    gl.bindBuffer(gl.ARRAY_BUFFER, aBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STREAM_COPY);
    updateScale();
    updateOffset();
}

function updateScale(){
    const scaleInfo = document.getElementById("scale");
    scaleInfo.textContent = "Scale: "+ scale.toFixed(2);
}
function updateOffset(){
    const offsetInfo = document.getElementById("offset");
    offsetInfo.textContent = "Offset: (" + offsetX.toFixed(2) + ", " + offsetY.toFixed(2) + ")";
}

function updateIterations(){
    const iterationInfo = document.getElementById("iterations");
    iterationInfo.textContent = "Iterations: " + iterationCount;
}
function setup(shaders)
{
    // Setup
    canvas = document.getElementById("gl-canvas");
    gl = setupWebGL(canvas, { alpha: true });

    drawProgram = buildProgramFromSources(gl, shaders["shader.vert"], shaders["shader.frag"]);
    iterationProgram = buildProgramFromSources(gl, shaders["iteration.vert"], shaders["iteration.frag"], ["newPosition", "newFunction"]);

    for(let i=0; i<nPoints; i++){
        vertices.push(Math.random());
        vertices.push(Math.random());
        vertices.push(0.0);

    }

    gl.useProgram(drawProgram);

    aBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, aBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STREAM_COPY);

    bBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, nPoints * sizeof["vec2"] + nPoints * 4, gl.STREAM_COPY);

    window.addEventListener("resize", resize);
    resize();

    canvas.addEventListener('wheel', function(event) {
        if(event.deltaY < 0){
            scale *= 0.9;
        } else {
            scale *= 1.1;
        }
        updateScale();
    });

    canvas.onmousedown = function(event){
        dragging = true;
        prevX = (-1 + 2*event.clientX/ canvas.width) * scale;
        prevY = (-1 + 2*(canvas.height - event.clientY) / canvas.height) * scale;
    };

    canvas.onmousemove = function(event){
        if(dragging){
            let currentX = (-1 + 2*event.clientX/ canvas.width) * scale;
            let currentY = (-1 + 2*(canvas.height - event.clientY) / canvas.height) * scale;
            const deltaX = currentX - prevX;
            const deltaY = currentY - prevY;
            offsetX += deltaX;
            offsetY += deltaY;
            prevX = currentX;
            prevY = currentY;
            updateOffset();
        }
    };

    canvas.onmouseup = function(){
        dragging = false;
    };

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Setup the background color
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    window.onkeydown = function(event) {
        const key = event.key;
        switch (key){
            case '0':
                clearBufferAndScreen();
                m = [
                    mat3(0.0, 0.0, 0.0, 0.0 ,0.16 ,0.0, 0.0, 0.0, 1.0),
                    mat3(0.85, 0.04, 0.0, -0.04 ,0.85 ,1.6, 0.0, 0.0, 1.0),
                    mat3(0.2, -0.26, 0.0, 0.23 ,0.22 ,1.6, 0.0, 0.0, 1.0),
                    mat3(-0.15, 0.28, 0.0, 0.26 ,0.24 ,0.44, 0.0, 0.0, 1.0)
                ];
                p = [0.01,0.85,0.07,0.07];
                start = true;
                iterationCount = 0;
                scale = 2.90;
                offsetX = -0.12;
                offsetY = -2.41;
                break;
            case '1':
                clearBufferAndScreen();
                m = [
                    mat3(0.0, 0.0, 0.0, 0.0 ,0.25 ,-0.14, 0.0, 0.0, 1.0),
                    mat3(0.85, 0.002, 0.0, -0.02 ,0.83 ,1.0, 0.0, 0.0, 1.0),
                    mat3(0.09, -0.28, 0.0, 0.3 ,0.11 ,0.6, 0.0, 0.0, 1.0),
                    mat3(-0.09, 0.28, 0.0, 0.3 ,0.09 ,0.7, 0.0, 0.0, 1.0)
                ];
                p = [0.02,0.84,0.07,0.07];
                start = true;
                iterationCount = 0;
                scale = 1.67;
                offsetX = 0.03;
                offsetY = -1.37;
                break;
            case '2':
                clearBufferAndScreen();
                m = [
                    mat3(0.0, 0.0, 0.0, 0.0 ,0.25 ,-0.4, 0.0, 0.0, 1.0),
                    mat3(0.95, 0.005, -0.002, -0.005 ,0.93 ,0.5, 0.0, 0.0, 1.0),
                    mat3(0.035, -0.2, -0.09, 0.16 ,0.04 ,0.02, 0.0, 0.0, 1.0),
                    mat3(-0.04, 0.2, 0.083, 0.16 ,0.04 ,0.12, 0.0, 0.0, 1.0)
                ];
                p = [0.02,0.84,0.07,0.07];
                start = true;
                iterationCount = 0;
                scale = 2.25;
                offsetX = -0.01;
                offsetY = -1.60;
                break;
            case '3':
                clearBufferAndScreen();
                m = [
                    mat3(0.0, 0.0, 0.0, 0.0 ,0.25 ,-0.4, 0.0, 0.0, 1.0),
                    mat3(0.95, 0.002, -0.002, -0.002 ,0.93 ,0.5, 0.0, 0.0, 1.0),
                    mat3(0.035, -0.11, -0.05, 0.27 ,0.01 ,0.005, 0.0, 0.0, 1.0),
                    mat3(-0.04, 0.11, 0.047, 0.27, 0.01 ,0.06, 0.0, 0.0, 1.0)
                ];
                p = [0.02,0.84,0.07,0.07];
                start = true;
                iterationCount = 0;
                scale = 2.18;
                offsetX = 0.00;
                offsetY = -1.57;
                break;
            case '4':
                clearBufferAndScreen();
                m = [
                    mat3(0.787879, -0.424242, 1.758647, 0.242424 ,0.859848 ,1.408065, 0.0, 0.0, 1.0),
                    mat3(-0.121212, 0.257576, -6.721654, 0.151515 ,0.053030 ,1.377236, 0.0, 0.0, 1.0),
                    mat3(0.181818, -0.136364, 6.086107, 0.90909 ,0.181818 ,1.568035, 0.0, 0.0, 1.0)
                ];
                p = [0.9,0.05,0.05];
                start = true;
                iterationCount = 0;
                scale = 5.42;
                offsetX = 0.46;
                offsetY = -1.68;
                break;
            case '5':
                clearBufferAndScreen();
                m = [
                    mat3(0.2020, -0.8050, -0.3730, -0.6890 ,-0.3420 ,-0.6530, 0.0, 0.0, 1.0),
                    mat3(0.1380, 0.6650, 0.6600, -0.5020 ,-0.2220 ,-0.2770, 0.0, 0.0, 1.0)
                ];
                p = [0.5,0.5];
                start = true;
                iterationCount = 0;
                scale = 0.44;
                offsetX = -0.06;
                offsetY = 0.25;
                break;
            case '6':
                clearBufferAndScreen();
                m = [
                    mat3(0.05, 0.0, -0.06, 0.0 ,0.4 ,-0.47, 0.0, 0.0, 1.0),
                    mat3(-0.05, 0.0, -0.06, 0.0 ,-0.4 ,-0.47, 0.0, 0.0, 1.0),
                    mat3(0.03, -0.14, -0.16, 0.0 ,0.26 ,-0.01, 0.0, 0.0, 1.0),
                    mat3(-0.03, 0.14, -0.16, 0.0 ,-0.26 ,-0.01, 0.0, 0.0, 1.0),
                    mat3(0.56, 0.44, 0.3, -0.37 ,0.51 ,0.15, 0.0, 0.0, 1.0),
                    mat3(0.19, 0.07, -0.2, -0.1 ,0.15 ,0.28, 0.0, 0.0, 1.0),
                    mat3(-0.33, -0.34, -0.54, -0.33, 0.34 ,0.39, 0.0, 0.0, 1.0)
                ];
                p = [1/7,1/7,1/7,1/7,1/7,1/7,1/7];
                start = true;
                iterationCount = 0;
                scale = 0.61;
                offsetX = 0.02;
                offsetY = 0.00;
                break;
            case '7':
                clearBufferAndScreen();
                m = [
                    mat3(0.01, 0.0, 0.0, 0.0 ,0.45 ,0.0, 0.0, 0.0, 1.0),
                    mat3(-0.01, 0.0, 0.0, 0.0 ,-0.45 ,0.4, 0.0, 0.0, 1.0),
                    mat3(0.42, -0.42, 0.0, 0.42, 0.42 ,0.4, 0.0, 0.0, 1.0),
                    mat3(0.42, 0.42, 0.0, -0.42, 0.42 ,0.4, 0.0, 0.0, 1.0)
                ];
                p = [0.25,0.25,0.25,0.25];
                start = true;
                iterationCount = 0;
                scale = 0.37;
                offsetX = 0.01;
                offsetY = -0.20;
                break;
            case '8':
                clearBufferAndScreen();
                m = [
                    mat3(0.824074, 0.281428, -1.882290, -0.212346 ,0.864198 ,-0.110607, 0.0, 0.0, 1.0),
                    mat3(0.088272, 0.520988, 0.785360, -0.463889 ,-0.377778 ,8.095795, 0.0, 0.0, 1.0),
                ];
                p = [0.8,0.2];
                start = true;
                iterationCount = 0;
                scale = 3.59;
                offsetX = 0.13;
                offsetY = -1.97;
                break;
            case '9':
                clearBufferAndScreen();
                m = [
                mat3(0.14, 0.01, -0.08, 0.0 ,0.51 ,-1.31, 0.0, 0.0, 1.0),
                mat3(0.43, 0.52, 1.49, -0.45 ,0.5 ,-0.75, 0.0, 0.0, 1.0),
                mat3(0.45, -0.49, -1.62, 0.47 ,0.47 ,-0.74, 0.0, 0.0, 1.0),
                mat3(0.49, 0.0, 0.0, 0.02 ,0.51 ,1.62, 0.0, 0.0, 1.0)
                ];
                p = [0.25,0.25,0.25,0.25];
                start = true;
                iterationCount = 0;
                scale = 2.44;
                offsetX = 0.11;
                offsetY = 0.10;
                break;
            case '+':
                if(iterLimit < 50)
                    iterLimit++;
                break;
            case '-':
                if(iterLimit > 0){
                    clearBufferAndScreen();
                    iterationCount = 0;
                    iterLimit--;
                }
                break;
            case 'i':
                clearBufferAndScreen();
                iterationCount = 0;
                iterLimit = 0;
                updateIterations();
                break;
        }
        updateScale();
        updateOffset();
        gl.useProgram(iterationProgram);
        for(let i = 0; i < m.length; i++){
            const uM = gl.getUniformLocation(iterationProgram, "m[" + i + "]");
            gl.uniformMatrix3fv(uM, false, flatten(m[i]));
        }
        for(let j = 0; j < p.length; j++){
            const uP = gl.getUniformLocation(iterationProgram, "p["+ j +"]");
            gl.uniform1f(uP, p[j]);
        }
        gl.useProgram(drawProgram);
        for(let k = 0; k < colors.length; k++){
            const uC = gl.getUniformLocation(drawProgram, "c[" + k + "]");
            gl.uniform4f(uC, colors[k][0],colors[k][1],colors[k][2],colors[k][3]);
        }
    }

    window.requestAnimationFrame(animate);
}

function animate()
{
    window.requestAnimationFrame(animate);
        // Drawing code
    gl.clear(gl.COLOR_BUFFER_BIT);
    if(start){
        gl.useProgram(drawProgram);
        const uBottomLeft = gl.getUniformLocation(drawProgram, "uBottomLeft");
        gl.uniform2f(uBottomLeft, -aspect * scale - offsetX *aspect, -scale*aspect - offsetY* aspect);
        const uTopRight = gl.getUniformLocation(drawProgram, "uTopRight");
        gl.uniform2f(uTopRight, aspect * scale - offsetX *aspect , scale*aspect - offsetY* aspect);

        gl.bindBuffer(gl.ARRAY_BUFFER, aBuffer);
        const vPosition = gl.getAttribLocation(drawProgram, "vPosition");
        gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 12, 0);
        gl.enableVertexAttribArray(vPosition);
        const vFunction = gl.getAttribLocation(drawProgram, "vFunction");
        gl.vertexAttribPointer(vFunction, 1, gl.FLOAT, false, 12, 8);
        gl.enableVertexAttribArray(vFunction);

        gl.drawArrays(gl.POINTS, 0, nPoints);

        if(iterationCount < iterLimit){
            // Iteration code
            gl.useProgram(iterationProgram);

            gl.bindBuffer(gl.ARRAY_BUFFER, aBuffer);
            const vOldPosition = gl.getAttribLocation(iterationProgram, "vOldPosition");
            gl.vertexAttribPointer(vOldPosition, 2, gl.FLOAT, false, 12, 0);
            gl.enableVertexAttribArray(vOldPosition);

            const transformFeedback = gl.createTransformFeedback();
            gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, transformFeedback);

            gl.enable(gl.RASTERIZER_DISCARD);

            gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, bBuffer);
            gl.beginTransformFeedback(gl.POINTS);
            gl.drawArrays(gl.POINTS, 0, nPoints);
            gl.endTransformFeedback();
            gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);

            gl.disable(gl.RASTERIZER_DISCARD);

            gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
            gl.deleteTransformFeedback(transformFeedback);

            const temp = aBuffer;
            aBuffer = bBuffer;
            bBuffer = temp;
            iterationCount++;
            updateIterations();
        }
    }
    
}

loadShadersFromURLS(["shader.vert", "shader.frag", "iteration.vert", "iteration.frag"]).then(shaders => setup(shaders));
