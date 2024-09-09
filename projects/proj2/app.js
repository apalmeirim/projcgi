
/**
 * CGI
 * Projecto 2.
 * Codigo escrito por:
 * Antonio Palmeirim 63667
 * Duarte Inacio 62397
 */

import { buildProgramFromSources, loadShadersFromURLS, setupWebGL } from "../../libs/utils.js";
import { ortho, lookAt, flatten, mult ,vec3, translate, rotateY, rotateX, rotateZ, rotate } from "../../libs/MV.js";
import {modelView, loadMatrix, multRotationY,multRotationZ,multRotationX, multScale, multTranslation,pushMatrix, popMatrix } from "../../libs/stack.js";

import * as SPHERE from '../../libs/objects/sphere.js';
import * as CUBE from '../../libs/objects/cube.js';
import * as CYLINDER from '../../libs/objects/cylinder.js';
import * as BUNNY from '../../libs//objects/bunny.js';

/** @type WebGLRenderingContext */
let gl;

let mode;               // Drawing mode (gl.LINES or gl.TRIANGLES)

//Camera scale
const VP_DISTANCE = 15;

/**
 * Color constants.
 */
let white = vec3(1.0, 1.0, 1.0);
let whiteGrey = vec3(0.8,0.8,0.8);
let grey = vec3(0.3,0.3,0.3);
let yellow = vec3(1.0,1.0,0);
let red = vec3(1.0,0,0);
let lightGreen = vec3(0.6, 1, 0.65);
let darkGreen = vec3(0.0, 0.74, 0.15);

/**
 * Floor color constants.
 * Initially whiteGrey and grey.
 */
let color1 = whiteGrey;
let color2 = grey;

/**
 * Constants for inner and outer tower length.
 * Pre: T1 < T2
 */
let T1 = 8;
let T2 = 10;
let L1 = 1;
let E1 = 0.1;
let L2 = L1 - E1;
let E2 = E1;

/**
 * Constants for the beam of the crane.
 */
let T3 = 16;
let T4 = Math.floor(T3/3);
let L3 = 1;
let E3 = 0.1 * L3;

/**
 * Rotation angles for camera.
 */
let theta = -30;
let gamma = 30;

//Initial camera lookAt.
var viewlook = mult(rotateX(gamma), rotateY(theta));

//Variable for controlling base vertical movement.
let up = 0;

//Variable for controlling slider horizontal movement.
let sliderMovement = (-T3+T4) * L3;

//Variable for controlling crane beam rotation.
let rotationAngle = 0;

//Variable for controlling cable length.
let cableLength = 1;

//Variable for camera zoom scale.
let scale = 1;
//Variable to grab object;
let grab = false;
let xBunny = Math.random() * (T4-T3) - L1 * 2;
let yBunny = 0;
let zBunny = 0;
let rotationBunny = 0;
let bunnyVelocity = 0;

function setup(shaders)
{
    let canvas = document.getElementById("gl-canvas");
    let aspect = canvas.width / canvas.height;

    gl = setupWebGL(canvas);

    let program = buildProgramFromSources(gl, shaders["shader.vert"], shaders["shader.frag"]);

    let mProjection = ortho(-VP_DISTANCE*aspect*scale,VP_DISTANCE*aspect, -VP_DISTANCE, VP_DISTANCE,-3*VP_DISTANCE,3*VP_DISTANCE);

    mode = gl.LINES; 

    resize_canvas();
    window.addEventListener("resize", resize_canvas);

    /**
     * Event listener to have scroll function for zooming in and out.
     */
    window.addEventListener('wheel', function(event) {
        if(event.deltaY < 0){
            scale *= 0.9;
        } else {
            scale *= 1.1;
        }
        resize_canvas();

    });

    document.onkeydown = function(event) {
        switch(event.key) {
            case 'ArrowUp':
                gamma += 3;
                viewlook = mult(rotateX(gamma), rotateY(theta));
                break;
            case 'ArrowDown':
                gamma -= 3;
                viewlook = mult(rotateX(gamma), rotateY(theta));
                break;
            case 'ArrowLeft':
                theta += 3;
                viewlook = mult(rotateX(gamma), rotateY(theta));
                break;
            case 'ArrowRight':
                theta -= 3;
                viewlook = mult(rotateX(gamma), rotateY(theta));
                break;
            case '0':
                if(mode == gl.LINES) mode = gl.TRIANGLES;
                else mode = gl.LINES;
                break;
            case '1':
                theta = 0;
                gamma = 0;
                viewlook = mult(rotateX(gamma), rotateY(theta));
                break;
            case '2':
                theta = 0;
                gamma = 90;
                viewlook = mult(rotateX(gamma), rotateY(theta));
                break;
            case '3':
                theta = 90;
                gamma = 0;
                viewlook = mult(rotateX(gamma), rotateY(theta));
                break;
            case '4':
                gamma = 30;
                theta = -30;
                viewlook = mult(rotateX(gamma), rotateY(theta));
                break;
            //The cable can only go down until it reaches the floor, which is calculated using the current height of the crane.
            case 's':
                if(cableLength < T2*L2+L1 + up) cableLength += 1;
                break;
            //The cable can't retract beyond it's original length. 
            case 'w':
                if(cableLength > 1) cableLength -= 1;
                break;
            //The inner base can only go up till a certain point.
            case 'i':
                if(up <= (T1*L1 - (T2*L2 -T1*L1))) up += 0.1;
                break;
            //The inner base can only go down till it reaches the floor.
            case 'k':
                if(up > 0 && cableLength < T2*L2 + up) up -= 0.1;
                break;
            //The slider stops at the penultimate beam section before the rotating cylinder.
            case 'd':
                if(sliderMovement < - 2*L1*L3 - E2) sliderMovement +=0.1;
                break;
            case 'a':
                if(sliderMovement > (-T3 + T4) *L3) sliderMovement -=0.1;
                break;
            case 'j':
                rotationAngle += 4;
                break;
            case 'l':
                rotationAngle -= 4;
                break;
            case 'g':
                color1 = lightGreen;
                color2 = darkGreen;
                break;
            case 'r':
                scale = 1;
                theta = -30;
                gamma = 30;
                up = 0;
                sliderMovement = (-T3+T4) * L3;
                cableLength = 1;
                rotationAngle = 0;
                viewlook = mult(rotateX(gamma), rotateY(theta))
                color1 = whiteGrey;
                color2 = grey;
                resize_canvas();
                break;
            case 'q':
                grab = !grab;
                break;
        }
    }

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    SPHERE.init(gl);
    CUBE.init(gl);
    CYLINDER.init(gl);
    BUNNY.init(gl);
    gl.enable(gl.DEPTH_TEST);   // Enables Z-buffer depth test
    
    window.requestAnimationFrame(render);


    function resize_canvas(event)
    {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        aspect = canvas.width / canvas.height;

        gl.viewport(0,0,canvas.width, canvas.height);
        mProjection = ortho(-VP_DISTANCE*aspect*scale,VP_DISTANCE*aspect*scale, -VP_DISTANCE*scale, VP_DISTANCE*scale,-3*VP_DISTANCE*scale,3*VP_DISTANCE*scale);
    }

    function uploadModelView()
    {
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mModelView"), false, flatten(modelView()));
    }

    /**
     * Function for creating the floor, with size directly proportional to L1.
     */
    function floor(){
        let swapColor = true;
        for(let i=-16; i<= 16; i++){
            for(let j = -16; j <= 16; j++){
                pushMatrix();
                    multTranslation([i*L1, 0, j*L1]);
                    multScale([L1, 0.2, L1]);
                    uploadModelView();
                    if(swapColor)
                        gl.uniform3fv(gl.getUniformLocation(program, "uColor"), flatten(color1));
                    else
                        gl.uniform3fv(gl.getUniformLocation(program, "uColor"), flatten(color2));
                    CUBE.draw(gl,program, gl.TRIANGLES);  
                popMatrix();
                swapColor = !swapColor;
                          
            }
        }
    }

    
    /**
     * Three functions to create pilars for the base, scaling the X, Y and Z coordinates of a cube.
     * Depending on if drawing the inner or outer base, using E1 or E2, L1 or L2.
     */
    function armoredPilarZ(E,L){
        multScale([E,E,L]);
        uploadModelView();
        CUBE.draw(gl, program, mode);
    }
    function armoredPilarX(E,L) 
    {
        multScale([L,E,E]);
        uploadModelView();
        CUBE.draw(gl, program, mode);
    }

    function armoredPilarY(E,L)
    {
        multScale([E,L,E]);
        uploadModelView();
        CUBE.draw(gl, program, mode);
    }



    /**
     * Three functions to create 4 pilars to create the cube.
     * Depending on if drawing the inner or outer base, using E1 or E2, L1 or L2.
     */
    function armoredPilarVertexY(E,L)
    {
        pushMatrix();
            multTranslation([L/2, 0, L/2]);
            armoredPilarY(E,L);
        popMatrix();
        pushMatrix();
            multTranslation([L/2, 0, -L/2]);
            armoredPilarY(E,L);
        popMatrix();
        pushMatrix();
            multTranslation([-L/2, 0, L/2]);
            armoredPilarY(E,L);
        popMatrix();
        pushMatrix();
            multTranslation([-L/2, 0, -L/2]);
            armoredPilarY(E,L);
        popMatrix();
    }
    
    function armoredPilarVertexZ(E,L)
    {
        pushMatrix();
            multTranslation([L/2, L/2, 0]);
            armoredPilarZ(E,L);
        popMatrix();
        pushMatrix();
            multTranslation([-L/2, L/2, 0]);
            armoredPilarZ(E,L);
        popMatrix();
        pushMatrix();
            multTranslation([L/2, -L/2, 0]);
            armoredPilarZ(E,L);
        popMatrix();
        pushMatrix();
            multTranslation([-L/2, -L/2, 0]);
            armoredPilarZ(E,L);
        popMatrix();
    }
    
    function armoredPilarVertexX(E,L){
        pushMatrix();
            multTranslation([0,-L/2,-L/2]);
            armoredPilarX(E,L);
        popMatrix();
        pushMatrix();
            multTranslation([0,L/2,-L/2]);
            armoredPilarX(E,L);
        popMatrix();
        pushMatrix();
            multTranslation([0,-L/2,L/2]);
            armoredPilarX(E,L);
        popMatrix();
        pushMatrix();
            multTranslation([0, L/2, L/2]);
            armoredPilarX(E,L);
        popMatrix();
    }
    

    /**
     * Function that creates one armored cube.
     * Depending on if drawing the inner or outer base, using E1 or E2, L1 or L2.
     */
    function armoredCube(E,L)
    {
        armoredPilarVertexX(E,L);
        armoredPilarVertexY(E,L);
        armoredPilarVertexZ(E,L);   
    }


    /**
     * Function that creates the full inner or outer base, using height, E, L to distinguish
     * between drawing the inner or outer base.
     */
    function armoredPilar(height,E,L)
    {
        gl.uniform3fv(gl.getUniformLocation(program, "uColor"), flatten(yellow));
        for(let i = 0; i < height; i++){
            armoredCube(E,L);
            multTranslation([0,L1,0]);
        }
    }


    /**
     * Function that creates the rotating cylinder between the base and beam of the crane, with 
     * the scale directly proportional to the length of the sections of the outer base.
     */
    function cylinder()
    {
        gl.uniform3fv(gl.getUniformLocation(program, "uColor"), flatten(grey));
        multScale([L1 * 3, L1, L1 * 3]);
        uploadModelView();
        CYLINDER.draw(gl,program,mode);
    }


    /**
     * Main function that calls all the parts of the crane, starting with the inner and outer
     * base, with all the transformations necessary.
     */
    function grua(){
        pushMatrix();
            multTranslation([0, L1/2, 0]);
            armoredPilar(T1,E1,L1);
        popMatrix();
        pushMatrix();
            multTranslation([0,L1/2 + up,0]);
            armoredPilar(T2,E2,L2);
            multRotationY(rotationAngle);
            pushMatrix();
                cylinder();
            popMatrix();
            pushMatrix();
                multTranslation([-L3/2 + T4 * L3, L2/2, 0]);
                multRotationY(-90);
                armoredPrisma();
            popMatrix();
            pushMatrix();
                multTranslation([sliderMovement, L1/2 - E3,0]);
                multScale([L3,0.2*L3,L3]);
                slider();
            popMatrix();
            pushMatrix();
                multTranslation([L3 * (T4-2), -(L3-1)/2 + (L1-1)/2, 0]);
                multScale([L3, L3, L3]);
                contraPeso();
            popMatrix();
            pushMatrix();
                for(let i = 0; i < cableLength; i++){
                    pushMatrix();
                        /**
                         * Testei com L1, L3, T1, T3 diferentes e deu so assim.
                         * Subir e descer com os limites impostos tambem funciona.
                         */
                        multTranslation([sliderMovement, -i,0]);
                        //refrential();
                        //multTranslation([sliderMovement, -i-((0.2*L3)/2*L3) + (L1-1)/2, 0]);
                        /**
                         * O scale do Y, esta so dependente do L3, quando L1 aumenta, o cabo fica proprocional ao 
                         * L3 e nao ao L1 tambem, nao sei fazer ficar proporcional aos dois sem deformacao. Mas faz mais
                         * sentido estar dependente da viga e nao da base.
                         */
                        multScale([0.1*L1*L3, L1, 0.1*L1*L3]);
                        cable();
                    popMatrix();
                }
        popMatrix();
    }


    /**
     * Three functions to create the sections of each triangular section of the crane beam, depending
     * on the X, Y and Z scale.
     */
    function vigaY()
    {
        multScale([E3,L3,E3]);
        uploadModelView();
        CUBE.draw(gl, program, mode);
    }
    function vigaX()
    {
        multScale([L3,E3,E3]);
        uploadModelView();
        CUBE.draw(gl, program, mode);
    }
    function vigaZ()
    {
        multScale([E3,E3,L3]);
        uploadModelView();
        CUBE.draw(gl, program, mode);
    }


    /**
     * Function to draw a triangle, using the "vigas".
     */
    function triangle()
    {   
        gl.uniform3fv(gl.getUniformLocation(program, "uColor"), flatten(yellow));
        pushMatrix();
            multTranslation([L3/4,L3/2,0]);
            multRotationZ(30);
            vigaY();
        popMatrix();
        pushMatrix();
            multTranslation([-L3/4, L3/2, 0]);
            multRotationZ(-30);
            vigaY();
        popMatrix();
        pushMatrix();
            vigaX();
        popMatrix();
    }


    /**
     * Function to draw a three "vigas" to build the body of the prisma for the beam.
     */
    function prismaTriangle(){
        triangle();
        pushMatrix();
            multTranslation([L3/2,0,L3/2]);
            vigaZ();
        popMatrix();
        pushMatrix();
            multTranslation([-L3/2,0,L3/2]);
            vigaZ();
        popMatrix();
        pushMatrix();
            multTranslation([0,L3-E3/2,L3/2]);
            vigaZ();
        popMatrix();
    }

    /**
     * Function to build the beam of the crane, using the triangles and the prismaTriangles.
     */
    function armoredPrisma(){
        pushMatrix();
            for(let i=0; i < T3; i++){
                prismaTriangle();
                multTranslation([0,0,L3]);
            }
            triangle();

        popMatrix();
    }
    

    /**
     * Function to build the cable of the beam.
     */
    function cable() {
        gl.uniform3fv(gl.getUniformLocation(program, "uColor"), flatten(white));
        uploadModelView();
        CUBE.draw(gl, program, gl.TRIANGLES);
    }


    /**
     * Function to build the slider of the beam.
     */
    function slider(){
        gl.uniform3fv(gl.getUniformLocation(program, "uColor"), flatten(red));
        uploadModelView();
        CUBE.draw(gl, program, gl.TRIANGLES);
    }


    /**
     * Function used to build the weight on the beam.
     */
    function contraPeso() {
        gl.uniform3fv(gl.getUniformLocation(program, "uColor"), flatten(white));
        uploadModelView();
        CUBE.draw(gl, program, gl.TRIANGLES);
    }

    function bunny(){
        if(grab){
            xBunny = sliderMovement;
            yBunny = T2 -cableLength + L2/2 + up;
            zBunny = 0;
            rotationBunny = rotationAngle;
        }
        else {
            if(yBunny!=0){
                bunnyVelocity += ( 0.98);
                yBunny -= bunnyVelocity * 0.02; // valor que pareceu mais correto ao testar
                if(yBunny < 0){
                    yBunny = 0;
                }
            }
            else {
                yBunny = 0;
                bunnyVelocity = 0;
            }
        }
        multRotationY(rotationBunny);
        multTranslation([xBunny, yBunny,zBunny]);
        multScale([10*L1,10*L1,10*L1]);
        gl.uniform3fv(gl.getUniformLocation(program, "uColor"), flatten(red));
        uploadModelView();
        BUNNY.draw(gl, program,mode);
    }

    /**
     * Refrential to help understand the X, Y, Z axis of the project.
     */
    function refrential() {
        pushMatrix();
            gl.uniform3fv(gl.getUniformLocation(program, "uColor"), flatten(white));
            multScale([0.01, 1000, 0.01]);
            vigaY();
        popMatrix();
        pushMatrix();
            gl.uniform3fv(gl.getUniformLocation(program, "uColor"), flatten(white));
            multScale([0.01, 0.01, 1000]);
            vigaZ();
        popMatrix();
        pushMatrix();
            gl.uniform3fv(gl.getUniformLocation(program, "uColor"), flatten(white));
            multScale([1000, 0.01, 0.01]);
            vigaX();
        popMatrix();
    }

    function render()
    {
        window.requestAnimationFrame(render);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        gl.useProgram(program);
        
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mProjection"), false, flatten(mProjection));
    
        loadMatrix(viewlook);

        pushMatrix();
            //Drawing the floor at y=0.
            multTranslation([0,-0.1,0]);
            floor();
        popMatrix();
        pushMatrix();
            bunny();
        popMatrix();
        //pushMatrix();
        //    refrential();
        //popMatrix();
    
        //Drawing the full crane, with beam and base.
        grua();
    }
}

const urls = ["shader.vert", "shader.frag"];
loadShadersFromURLS(urls).then(shaders => setup(shaders))
