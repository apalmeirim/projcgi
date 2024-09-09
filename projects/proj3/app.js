/**
 * Authors: Duarte Inácio 62397, António Palmeirim 63667
 */

import { buildProgramFromSources, loadShadersFromURLS, setupWebGL } from '../../libs/utils.js';
import { length, flatten, inverse, mult, normalMatrix, perspective, lookAt, vec4, vec3, vec2, subtract, add, scale, rotate, rotateY, rotateX, rotateZ, normalize } from '../../libs/MV.js';
import * as dat from '../../libs/dat.gui.module.js';

import * as CUBE from '../../libs/objects/cube.js';
import * as SPHERE from '../../libs/objects/sphere.js';
import * as COW from '../../libs/objects/cow.js';
import * as BUNNY from '../../libs/objects/bunny.js';
import * as TORUS from '../../libs/objects/torus.js';
import * as PYRAMID from '../../libs/objects/pyramid.js';
import * as STACK from '../../libs/stack.js';

function setup(shaders) {
    const canvas = document.getElementById('gl-canvas');
    const gl = setupWebGL(canvas);

    CUBE.init(gl);
    SPHERE.init(gl);
    COW.init(gl);
    BUNNY.init(gl);
    PYRAMID.init(gl);
    TORUS.init(gl);

    const program = buildProgramFromSources(gl, shaders['shader.vert'], shaders['shader.frag']);

    // All 4 objects represented
    let object1 = {
        name: "Cube",
        type: CUBE,
        posX: -1,
        posY: 0.5,
        posZ: -1,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        scaleZ: 1,
        Ka: vec3(200,110,110),
        Kd: vec3(200,110,110),
        Ks: vec3(200,110,110),
        shininess: 100,
    }

    let object2 = {
        name: "Sphere",
        type: SPHERE,
        posX: 1,
        posY: 0.5,
        posZ: -1,
        rotation: 0,       
        scaleX: 1,
        scaleY: 1,
        scaleZ: 1,
        Ka: vec3(60, 180, 60),
        Kd: vec3(60, 180, 60),
        Ks: vec3(60, 180, 60),
        shininess: 100,
    }
    
    let  object3 = {
        type: COW,
        name: "Cow",
        posX: -1,
        posY: 0.5,
        posZ: 1,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        scaleZ: 1,
        Ka: vec3(157,157,157),
        Kd: vec3(157,157,157),
        Ks: vec3(157,157,157),
        shininess: 100,
    }

    let object4 = {
        type: BUNNY,
        name: "Bunny",
        posX: 1,
        posY: 0.5,
        posZ: 1,
        rotation: 0,        
        scaleX: 1,
        scaleY: 1,
        scaleZ: 1,
        Ka: vec3(0, 100, 150),
        Kd: vec3(0, 100, 125),
        Ks: vec3(200, 200, 200),
        shininess: 100,
    }
    
    // All 3 lights represented
    let light1 = {
        rotation: 0,
        posX: 0,
        posY: 0,
        posZ: 7,
        Ia: vec3(74, 74, 74),
        Id: vec3(175, 175, 175),
        Is: vec3(255, 255, 255),
        directional: false,
        active: true
    }

    let light2 = {
        posX: 0,
        posY: 7,
        posZ: 0,
        rotation: 0,
        Ia: vec3(74, 74, 74),
        Id: vec3(175, 175, 175),
        Is: vec3(255, 255, 255),
        directional: false,
        active: false
    }
    
    let light3 = {
        posX: 7,
        posY: 0,
        posZ: 0,
        rotation: 0,
        Ia: vec3(74, 74, 74),
        Id: vec3(175, 175, 175),
        Is: vec3(255, 255, 255),
        directional: false,
        active: false
    }
    
    // Pointer to current object selected
    let objPointer;

    // Reference to current object selected
    let SelectedObject = {
        name: "Cow",
        type: CUBE,
        posX: 0,
        posY: 0,
        posZ: 0,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        scaleZ: 1,
        Ka: vec3(0,0,0),
        Kd: vec3(0,0,0),
        Ks: vec3(0,0,0),
        shininess: 100,
        mode: gl.LINES
    }

    // Camera  
    let camera = {
        eye: vec3(0,5,10),
        at: vec3(0,0,0),
        up: vec3(0,1,0),
        fovy: 45,
        aspect: 1, // Updated further down
        near: 0.1,
        far: 20
    }

    // Boolean to create selection wireframe on selected object
    let highlightOn = false;

    let options = {
        zBuffer: true,
        backFace: true,
        animate: true,
        viewLight: true
    }

    /**
     * All dat.GUI information
     */
    
    const gui = new dat.GUI();
    
    const gui2 = new dat.GUI();
    gui2.domElement.id = "object-gui";
    
    var optionsGui = gui.addFolder("options");
    //optionsGui.add(options, "wireframe");
    //optionsGui.add(options, "normals");
    optionsGui.add(options, "zBuffer").name("z-buffer").listen();
    optionsGui.add(options, "backFace").name("backface culling").listen();
    optionsGui.add(options, "animate").name("animate").listen();
    optionsGui.add(options, "viewLight").name("view light").listen();

    var cameraGui = gui.addFolder("camera");
    cameraGui.add(camera, "fovy").min(1).max(100).step(1).listen();
    cameraGui.add(camera, "aspect").min(0).max(10).step(0.01).listen().domElement.style.pointerEvents = "none";
    
    cameraGui.add(camera, "near").min(0.1).max(20).step(0.01).listen().onChange( function(v) {
        camera.near = Math.min(camera.far-0.5, v);
    });

    cameraGui.add(camera, "far").min(0.1).max(20).step(0.01).listen().onChange( function(v) {
        camera.far = Math.max(camera.near+0.5, v);
    });

    var eye = cameraGui.addFolder("eye");
    eye.add(camera.eye, 0).step(0.05).listen().domElement.style.pointerEvents = "none";;
    eye.add(camera.eye, 1).step(0.05).listen().domElement.style.pointerEvents = "none";;
    eye.add(camera.eye, 2).step(0.05).listen().domElement.style.pointerEvents = "none";;

    var at = cameraGui.addFolder("at");
    at.add(camera.at, 0).step(0.05).listen().domElement.style.pointerEvents = "none";;
    at.add(camera.at, 1).step(0.05).listen().domElement.style.pointerEvents = "none";;
    at.add(camera.at, 2).step(0.05).listen().domElement.style.pointerEvents = "none";;

    var up = cameraGui.addFolder("up");
    up.add(camera.up, 0).step(0.05).listen().domElement.style.pointerEvents = "none";;
    up.add(camera.up, 1).step(0.05).listen().domElement.style.pointerEvents = "none";;
    up.add(camera.up, 2).step(0.05).listen().domElement.style.pointerEvents = "none";;

    const lights = gui.addFolder("lights");
    
    const lightFolder1 = lights.addFolder("Light1");
    lightFolder1.add(light1, "posX").step(0.1).name('x').listen().domElement.style.pointerEvents = "none";;
    lightFolder1.add(light1, "posY").step(0.1).name('y').listen().domElement.style.pointerEvents = "none";;
    lightFolder1.add(light1, "posZ").step(0.1).name('z').listen().domElement.style.pointerEvents = "none";;
    lightFolder1.addColor(light1, "Ia").name('ambient').listen();
    lightFolder1.addColor(light1, "Id").name('diffuse').listen();
    lightFolder1.addColor(light1, "Is").name('specular').listen();
    lightFolder1.add(light1, "directional").listen();
    lightFolder1.add(light1, "active").listen();
    
    const lightFolder2 = lights.addFolder("Light2");
    lightFolder2.add(light2, "posX").name('x').listen().domElement.style.pointerEvents = "none";;
    lightFolder2.add(light2, "posY").name('y').listen().domElement.style.pointerEvents = "none";;
    lightFolder2.add(light2, "posZ").name('z').listen().domElement.style.pointerEvents = "none";;
    lightFolder2.addColor(light2, "Ia").name("ambient").listen();
    lightFolder2.addColor(light2, "Id").name("diffuse").listen();
    lightFolder2.addColor(light2, "Is").name("specular").listen();
    lightFolder2.add(light2, "directional").listen();
    lightFolder2.add(light2, "active").listen();

    const lightFolder3 = lights.addFolder("Light3");
    lightFolder3.add(light3, "posX").name('x').listen().domElement.style.pointerEvents = "none";;
    lightFolder3.add(light3, "posY").name('y').listen().domElement.style.pointerEvents = "none";;
    lightFolder3.add(light3, "posZ").name('z').listen().domElement.style.pointerEvents = "none";;
    lightFolder3.addColor(light3, "Ia").name('ambient').listen();
    lightFolder3.addColor(light3, "Id").name('diffuse').listen();
    lightFolder3.addColor(light3, "Is").name('specular').listen();
    lightFolder3.add(light3, "directional").listen();
    lightFolder3.add(light3, "active").listen();
    


    gui2.add(SelectedObject, 'name', ['Cow', 'Bunny', 'Sphere', 'Cube', 'Torus', 'Pyramid']).listen().onChange( function(value) {
        objPointer.name = value;
        switch(value){
            case 'Cow':
                objPointer.type = COW;
                objPointer.posY = 0.5;
                break;
            case 'Bunny':
                objPointer.type = BUNNY;
                objPointer.posY = 0.5;
                break;
            case 'Sphere':
                objPointer.type = SPHERE;
                objPointer.posY = 0.5;
                break;
            case 'Cube':
                objPointer.type = CUBE;
                objPointer.posY = 0.5;
                break;
            case 'Pyramid':
                objPointer.type = PYRAMID;
                objPointer.posY = 0.5;
                break;
            case 'Torus':
                objPointer.type = TORUS;
                objPointer.posY = 0.2;
                break;
        }
    });

    const transform = gui2.addFolder("transform");
    const selectedposition = transform.addFolder("position");

    selectedposition.add(SelectedObject, "posX").name('x').min(-1).max(1).step(0.1).listen().onChange( function(value) {
        objPointer.posX = value;
    });
    selectedposition.add(SelectedObject, "posY").name('y').domElement.style.pointerEvents = "none";
    selectedposition.add(SelectedObject, "posZ").name('z').min(-1).max(1).step(0.1).listen().onChange( function(value) {
        objPointer.posZ = value;
    });
    
    var selectedRotation = transform.addFolder("rotation");
    selectedRotation.add(SelectedObject, "rotation").setValue(0).name('x').domElement.style.pointerEvents = "none";;
    selectedRotation.add(SelectedObject, "rotation").name('y').min(-360).max(360).step(1).listen()
    .onChange( function(value) {
        objPointer.rotation = value;
    });
    selectedRotation.add(SelectedObject, "rotation").setValue(0).name('z').domElement.style.pointerEvents = "none";;
    
    const selectedScale = transform.addFolder("scale");
    selectedScale.add(SelectedObject, "scaleX").name('x').min(0.1).max(1).step(0.05).listen().onChange( function(value) {
        objPointer.scaleX = value;
    });
    selectedScale.add(SelectedObject, "scaleY").name('y').min(0.1).max(1).step(0.05).listen().onChange( function(value) {
        objPointer.scaleY = value;
    });
    selectedScale.add(SelectedObject, "scaleZ").name('z').min(0.1).max(1).step(0.05).listen().onChange( function(value) {
        objPointer.scaleZ = value;
    });

    const selectedMaterial = transform.addFolder("material");
    selectedMaterial.addColor(SelectedObject, "Ka").listen().onChange( function(value) {
        objPointer.Ka = value;
    });
    selectedMaterial.addColor(SelectedObject, "Kd").listen().onChange( function(value) {
        objPointer.Kd = value;
    });
    selectedMaterial.addColor(SelectedObject, "Ks").listen().onChange( function(value) {
        objPointer.Ks = value;
    });
    selectedMaterial.add(SelectedObject, "shininess").min(1).max(300).step(0.1).listen().onChange( function(value) {
        objPointer.shininess = value;
    }); 
    
    // matrices
    let mView, mProjection, mViewNormals;

    let down = false;
    let lastX, lastY;

    gl.clearColor(0.5, 0.5, 0.5, 1.0);
    gl.enable(gl.DEPTH_TEST);

    resizeCanvasToFullWindow();

    window.addEventListener('resize', resizeCanvasToFullWindow);

    window.addEventListener('wheel', function(event) {

        
        if(!event.altKey && !event.metaKey && !event.ctrlKey) { // Change fovy
            const factor = 1 - event.deltaY/1000;
            camera.fovy = Math.max(1, Math.min(100, camera.fovy * factor)); 
        }
        else if(event.metaKey || event.ctrlKey) {
            // move camera forward and backwards (shift)

            const offset = event.deltaY / 1000;

            const dir = normalize(subtract(camera.at, camera.eye));

            const ce = add(camera.eye, scale(offset, dir));
            const ca = add(camera.at, scale(offset, dir));
            
            // Can't replace the objects that are being listened by dat.gui, only their properties.
            camera.eye[0] = ce[0];
            camera.eye[1] = ce[1];
            camera.eye[2] = ce[2];

            if(event.ctrlKey) {
                camera.at[0] = ca[0];
                camera.at[1] = ca[1];
                camera.at[2] = ca[2];
            }
        }
    });

    function inCameraSpace(m) {
        const mInvView = inverse(mView);

        return mult(mInvView, mult(m, mView));
    }

    canvas.addEventListener('mousemove', function(event) {
        if(down) {
            const dx = event.offsetX - lastX;
            const dy = event.offsetY - lastY;

            if(dx != 0 || dy != 0) {
                // Do something here...

                const d = vec2(dx, dy);
                const axis = vec3(-dy, -dx, 0);

                const rotation = rotate(0.5*length(d), axis);

                let eyeAt = subtract(camera.eye, camera.at);                
                eyeAt = vec4(eyeAt[0], eyeAt[1], eyeAt[2], 0);
                let newUp = vec4(camera.up[0], camera.up[1], camera.up[2], 0);

                eyeAt = mult(inCameraSpace(rotation), eyeAt);
                newUp = mult(inCameraSpace(rotation), newUp);
                
                //console.log(eyeAt, newUp);

                camera.eye[0] = camera.at[0] + eyeAt[0];
                camera.eye[1] = camera.at[1] + eyeAt[1];
                camera.eye[2] = camera.at[2] + eyeAt[2];

                camera.up[0] = newUp[0];
                camera.up[1] = newUp[1];
                camera.up[2] = newUp[2];

                lastX = event.offsetX;
                lastY = event.offsetY;
            }

        }
    });

    canvas.addEventListener('mousedown', function(event) {
        down=true;
        lastX = event.offsetX;
        lastY = event.offsetY;
        //gl.clearColor(0.5, 0.5, 0.5, 1.0);
    });


    canvas.addEventListener('mouseup', function(event) {
        down = false;
        //gl.clearColor(0.5, 0.5, 0.5, 1.0);
    });

    window.requestAnimationFrame(render);

    function resizeCanvasToFullWindow()
    {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        camera.aspect = canvas.width / canvas.height;

        gl.viewport(0,0,canvas.width, canvas.height);
    }

    /**
     * Function to active the Backface Culling
     */
    function backFaceCullingactive(){
        if (options.backFace){
            gl.enable(gl.CULL_FACE);
        }
        else{
            gl.disable(gl.CULL_FACE);
        }
    }

    /**
     * Function to active the Z-Buffer
     */
    function zBufferactive(){
        if (options.zBuffer){
            gl.enable(gl.DEPTH_TEST);
        }
        else{
            gl.disable(gl.DEPTH_TEST);
        }
    }

    /**
     * Function that changes the values of the selected object depending on the pressed key
     * @param {*} event 
     */
    document.onkeydown = function(event) {
        switch(event.key) {
            case '1':
                objPointer = object1;
                SelectedObject.name = object1.name;
                SelectedObject.type = object1.type;
                SelectedObject.posX = object1.posX;
                SelectedObject.posZ = object1.posZ;
                SelectedObject.rotation = object1.rotation;
                SelectedObject.scaleX = object1.scaleX;
                SelectedObject.scaleY = object1.scaleY;
                SelectedObject.scaleZ = object1.scaleZ;
                SelectedObject.Ka = object1.Ka;
                SelectedObject.Kd = object1.Kd;
                SelectedObject.Ks = object1.Ks;
                SelectedObject.shininess = object1.shininess;
                highlightOn = true;
                break;
            case '2':
                objPointer = object2;
                SelectedObject.name = object2.name;
                SelectedObject.type = object2.type;
                SelectedObject.posX = object2.posX;
                SelectedObject.posZ = object2.posZ;
                SelectedObject.rotation = object2.rotation;
                SelectedObject.scaleX = object2.scaleX;
                SelectedObject.scaleY = object2.scaleY;
                SelectedObject.scaleZ = object2.scaleZ;
                SelectedObject.Ka = object2.Ka;
                SelectedObject.Kd = object2.Kd;
                SelectedObject.Ks = object2.Ks;
                SelectedObject.shininess = object2.shininess;
                highlightOn = true;
                break;
            case '3':
                objPointer = object3;
                SelectedObject.name = object3.name;
                SelectedObject.type = object3.type;
                SelectedObject.posX = object3.posX;
                SelectedObject.posZ = object3.posZ;
                SelectedObject.rotation = object3.rotation;
                SelectedObject.scaleX = object3.scaleX;
                SelectedObject.scaleY = object3.scaleY;
                SelectedObject.scaleZ = object3.scaleZ;
                SelectedObject.Ka = object3.Ka;
                SelectedObject.Kd = object3.Kd;
                SelectedObject.Ks = object3.Ks;
                SelectedObject.shininess = object3.shininess;
                highlightOn = true;
                break;
            case '4':
                objPointer = object4;
                SelectedObject.name = object4.name;
                SelectedObject.type = object4.type;
                SelectedObject.posX = object4.posX;
                SelectedObject.posZ = object4.posZ;
                SelectedObject.rotation = object4.rotation;
                SelectedObject.scaleX = object4.scaleX;
                SelectedObject.scaleY = object4.scaleY;
                SelectedObject.scaleZ = object4.scaleZ;
                SelectedObject.Ka = object4.Ka;
                SelectedObject.Kd = object4.Kd;
                SelectedObject.Ks = object4.Ks;
                SelectedObject.shininess = object4.shininess;
                highlightOn = true;
                break;
        }
    }

    function uploadModelView()
    {
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mModelView"), false, flatten(STACK.modelView()));
    }

    function uploadNormals()
    {
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mNormals"), false, flatten(normalMatrix(STACK.modelView())));
    }

    /**
     * Function to create overlapping wireframe over selected object
     */
    function highlight() {
        if(highlightOn) {
            STACK.multTranslation([objPointer.posX ,objPointer.posY, objPointer.posZ]);
            STACK.multRotationY(objPointer.rotation);
            STACK.multScale([objPointer.scaleX,objPointer.scaleY,objPointer.scaleZ]);
            gl.uniform3fv(gl.getUniformLocation(program, "uMaterial.Ka"), flatten(vec3(1, 1, 1)));
            gl.uniform3fv(gl.getUniformLocation(program, "uMaterial.Kd"), flatten(vec3(1, 1, 1)));
            gl.uniform3fv(gl.getUniformLocation(program, "uMaterial.Ks"), flatten(vec3(1, 1, 1)));
            gl.uniform1f(gl.getUniformLocation(program, "uMaterial.shininess"), objPointer.shininess);
            uploadModelView();
            objPointer.type.draw(gl, program, gl.LINES);  
        }
    };

    /**
     * Function that updates the liu
     */
    function lightUpdate() {
        let actives = 0;
        if(light1.active) {
            addLight(light1,actives, vec3(0,1,0));
            actives++;
        }
        if(light2.active){
            addLight(light2,actives, vec3(1,0,0));
            actives++;
        }
        if(light3.active) {
            addLight(light3,actives, vec3(0,0,1));
            actives++;
        }
        if(actives == 0) gl.clearColor(0.0,0.0,0.0,1.0);
        else gl.clearColor(0.5,0.5,0.5,1.0);
        gl.uniform1i(gl.getUniformLocation(program, "uNLights"), actives);
    }

    /**
     * Function that adds a new light to the system, applying a rotation to it so that it moves around the desired field.
     * @param {*} light 
     * @param {*} actives 
     * @param {*} axis 
     */
    function addLight(light, actives, axis) {
        let rotationMatrix = rotate(0.5, axis);
        if(options.animate)  {
            const lightPosition = mult(rotationMatrix, vec4(vec3(light.posX, light.posY, light.posZ), 1.0)).slice(0,3);
            light.posX = lightPosition[0];
            light.posY = lightPosition[1];
            light.posZ = lightPosition[2];
        }
        if(light.directional) gl.uniform4fv(gl.getUniformLocation(program, "uLight[" + actives + "].pos"), flatten(vec4(vec3(light.posX, light.posY, light.posZ), 0.0)));
        else gl.uniform4fv(gl.getUniformLocation(program, "uLight[" + actives + "].pos"), flatten(vec4(vec3(light.posX, light.posY, light.posZ), 1.0)));
        gl.uniform3fv(gl.getUniformLocation(program, "uLight[" + actives + "].Ia"), flatten(vec3(light.Ia[0]/255, light.Ia[1]/255, light.Ia[2]/255)));
        gl.uniform3fv(gl.getUniformLocation(program, "uLight[" + actives + "].Id"), flatten(vec3(light.Id[0]/255, light.Id[1]/255, light.Id[2]/255)));
        gl.uniform3fv(gl.getUniformLocation(program, "uLight[" + actives + "].Is"), flatten(vec3(light.Is[0]/255, light.Is[1]/255, light.Is[2]/255)));
        if(options.viewLight) drawLight(light);
    }

    /**
     * Function to draw the light that represents the lights currently in the scene
     * (Can be turned off and on)
     */
    function drawLight(light){
        STACK.pushMatrix();
            STACK.multTranslation([light.posX,light.posY,light.posZ]);
            STACK.multScale([0.1, 0.1, 0.1]);
            gl.uniform1f(gl.getUniformLocation(program, "lightObj"), true);
            gl.uniform3fv(gl.getUniformLocation(program, "uMaterial.Ka"), flatten(vec3(0.0,0.0,0.0)));
            gl.uniform3fv(gl.getUniformLocation(program, "uMaterial.Kd"), flatten(vec3(light.Id[0]/255, light.Id[1]/255, light.Id[2]/255)));
            gl.uniform3fv(gl.getUniformLocation(program, "uMaterial.Ks"), flatten(vec3(0.0,0.0,0.0)));
            uploadModelView();
            SPHERE.draw(gl,program, gl.TRIANGLES);
        STACK.popMatrix();
        gl.uniform1f(gl.getUniformLocation(program, "lightObj"), false);
    }


    /**
     * Function to draw the objects with the material characteristics, translation, scale, rotation and 
     * position necessary
     */
    function drawObject(object) {
        STACK.multTranslation([object.posX,object.posY,object.posZ]);
        STACK.multRotationY(object.rotation);
        STACK.multScale([object.scaleX,object.scaleY,object.scaleZ]);
        gl.uniform3fv(gl.getUniformLocation(program, "uMaterial.Ka"), flatten(vec3(object.Ka[0]/255, object.Ka[1]/255, object.Ka[2]/255)));
        gl.uniform3fv(gl.getUniformLocation(program, "uMaterial.Kd"), flatten(vec3(object.Kd[0]/255, object.Kd[1]/255, object.Kd[2]/255)));
        gl.uniform3fv(gl.getUniformLocation(program, "uMaterial.Ks"), flatten(vec3(object.Ks[0]/255, object.Ks[1]/255, object.Ks[2]/255)));
        gl.uniform1f(gl.getUniformLocation(program, "uMaterial.shininess"), object.shininess);
        uploadModelView();
        uploadNormals();
        object.type.draw(gl, program, gl.TRIANGLES);
    }

    /**
     * Function to draw all 4 objects
     */
    function drawObjects() {
        STACK.pushMatrix();
            drawObject(object1);
        STACK.popMatrix();
        STACK.pushMatrix();
            drawObject(object2);
        STACK.popMatrix();
        STACK.pushMatrix();
            drawObject(object3);
        STACK.popMatrix();
        STACK.pushMatrix();
            drawObject(object4);
        STACK.popMatrix();
    }

    /**
    * Function to draw the floor
    */
    function floor(){
        STACK.multTranslation([0,-0.1,0]);
        STACK.multScale([6,0.2,6]);
        uploadModelView();
        gl.uniform3fv(gl.getUniformLocation(program, "uMaterial.Ka"), flatten(vec3(142/255, 142/255, 105/255)));
        gl.uniform3fv(gl.getUniformLocation(program, "uMaterial.Kd"), flatten(vec3(142/255, 142/255, 105/255)));
        gl.uniform3fv(gl.getUniformLocation(program, "uMaterial.Ks"), flatten(vec3(142/255, 142/255, 105/255)));
        gl.uniform1f(gl.getUniformLocation(program, "uMaterial.shininess"),300);
        CUBE.draw(gl,program, gl.TRIANGLES);
    }

    /**
    * Support functions to create the refrential
    */
    function vigaY()
    {
        uploadModelView();
        CUBE.draw(gl, program, gl.TRIANGLES);
    }
    function vigaX()
    {
        uploadModelView();
        CUBE.draw(gl, program, gl.TRIANGLES);
    }
    function vigaZ()
    {
        uploadModelView();
        CUBE.draw(gl, program, gl.TRIANGLES);
    }

    /**
    * Auxiliary function that served as a basis for understanding the axes.
    */
    function refrential() {
        STACK.pushMatrix();
            gl.uniform3fv(gl.getUniformLocation(program, "uColor"), flatten(vec3(1.0,1.0,1.0)));
            STACK.multScale([0.01, 1000, 0.01]);
            vigaY();
        STACK.popMatrix();
        STACK.pushMatrix();
            gl.uniform3fv(gl.getUniformLocation(program, "uColor"), flatten(vec3(1.0, 1.0, 1.0)));
            STACK.multScale([0.01, 0.01, 1000]);
            vigaZ();
        STACK.popMatrix();
        STACK.pushMatrix();
            gl.uniform3fv(gl.getUniformLocation(program, "uColor"), flatten(vec3(1.0, 1.0, 1.0)));
            STACK.multScale([1000, 0.01, 0.01]);
            vigaX();
        STACK.popMatrix();
    }



    function render(time)
    {
        window.requestAnimationFrame(render);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.useProgram(program);

        mView = lookAt(camera.eye, camera.at, camera.up);

        mViewNormals = inverse(mView);

        STACK.loadMatrix(mView);

        mProjection = perspective(camera.fovy, camera.aspect, camera.near, camera.far);

        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mModelView"), false, flatten(STACK.modelView()));
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mViewNormals"), false, flatten(mViewNormals));
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mView"), false, flatten(mView));
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mProjection"), false, flatten(mProjection));
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mNormals"), false, flatten(normalMatrix(STACK.modelView())));

        gl.uniform1i(gl.getUniformLocation(program, "uUseNormals"), options.normals);

        //STACK.pushMatrix();
        //    refrential();
        //STACK.popMatrix();
        STACK.pushMatrix();
            floor();
        STACK.popMatrix();
        STACK.pushMatrix();
            drawObjects();
        STACK.popMatrix();
        STACK.pushMatrix();
            lightUpdate();
        STACK.popMatrix();
        STACK.pushMatrix();
            backFaceCullingactive();
            zBufferactive();
        STACK.popMatrix();
        STACK.pushMatrix();
            highlight();
        STACK.popMatrix();
    }
}

const urls = ['shader.vert', 'shader.frag'];

loadShadersFromURLS(urls).then( shaders => setup(shaders));