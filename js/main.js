var canvas = document.getElementById("renderCanvas");
// Load the BABYLON 3D engine
var engine = new BABYLON.Engine(canvas, true);

var gameOver = false;
//create ball
var ball = {
    originalScale: new BABYLON.Vector3(0.5, 0.5, 0.5),
    yVelocity : 15,     //balls constant y velocity
    radius: 0.5         //balls radius
};

//create paddle
var paddle = {
    originalScale: new BABYLON.Vector3(1, 0.2, 1)
};

//create area walls
var areaWalls = {
  sideWall1: {},
  sideWall2: {},
  topWall: {}
};

//create pendulum box
var pendulumBox = {
  pendSideWall1: {},
  pendSideWall2: {},
  pendBottomWall: {}
};

//pendulum object
var pendulum = {
  pendulumAnchor: {},
  pendulumBall: {}
};

//object for blocks
var blocks = {
    activeBlocks: 0,        //total blocks made in the game life
    meshes: [],             //block meshes currently in the scene
    positions: [],          //positions of block meshses in the scene(Vec3)
    vacancies: []           //boolean array indicating if an index in the meshses array is free for a potential powerup
};

//object for powerups
var powerups = {
    activePowerups: 0,      //total powerups made in the game life
    meshes: [],             //powerup meshes currently in the scene
    positions: [],          //position of the powerup meshes in the scene (Vec3)
    playersPowerups: [],    //the players powerup inventory
    types: ["LONGER_PADDLE", "SLOW_MOTION", "BIGGER_BALL"]      //types of powerups available
};

const DEFAULT_STEP_TIME = 1/240;
const SLOW_MOTION_STEP_TIME = 1/480;

var isUsingPowerup = false;     //powerups is off on game start
var powerupTimer = 6000;    //6 seconds
var score = 0;      //starting score

var pendulumBoxOpen = false;

/*-----------------------------------------------------------
*                  SCENE SETUP
* ---------------------------------------------------------*/

var createScene = function () {

  // This creates a basic Babylon Scene object (non-mesh)
  var scene = new BABYLON.Scene(engine);

  // This creates and positions a free camera (non-mesh)
  var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 3, -20), scene);

  // This targets the camera to scene origin
  camera.setTarget(BABYLON.Vector3.Zero());

  // This attaches the camera to the canvas
  camera.attachControl(canvas, true);

  // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
  var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);

  // Default intensity is 1. Let's dim the light a small amount
  light.intensity = 0.7;

  //enable physics and time step
  scene.enablePhysics();
  scene.getPhysicsEngine().setTimeStep(DEFAULT_STEP_TIME);
  var score = 0;

  /*-----------------------------------------------------------
   *                  OBJECT CREATION
   * ---------------------------------------------------------*/
  //create walls
  areaWalls.sideWall1.mesh = BABYLON.Mesh.CreateBox("sideWall1", 4, scene);
  areaWalls.sideWall1.mesh.scaling = new BABYLON.Vector3(0.1, 3, 1);
  areaWalls.sideWall1.mesh.position = new BABYLON.Vector3(-8, 0, 0);

  areaWalls.sideWall2.mesh = BABYLON.Mesh.CreateBox("sideWall2", 4, scene);
  areaWalls.sideWall2.mesh.scaling = areaWalls.sideWall1.mesh.scaling;
  areaWalls.sideWall2.mesh.position = new BABYLON.Vector3(8, 0 , 0);

  areaWalls.topWall.mesh = BABYLON.Mesh.CreateBox("topWall", 4, scene);
  areaWalls.topWall.mesh.scaling = new BABYLON.Vector3(areaWalls.topWall.mesh.scaling.x + 3, 0.1, areaWalls.topWall.mesh.scaling.z);
  areaWalls.topWall.mesh.position = new BABYLON.Vector3(0, 5.8, 0);

  paddle.mesh = BABYLON.Mesh.CreateBox("paddle", 2, scene);
  paddle.mesh.scaling = new BABYLON.Vector3(1, 0.2, 1);
  paddle.mesh.position = new BABYLON.Vector3(0, -4, 0);

  ball.mesh = BABYLON.Mesh.CreateSphere("ball", 16, ball.radius, scene);
  ball.mesh.position = new BABYLON.Vector3(0, -2, 0);
  ball.mesh.material = new BABYLON.StandardMaterial("s-mat", scene);

  //pendulum box
  pendulumBox.pendSideWall1.mesh = BABYLON.Mesh.CreateBox("pendSideWall1", 4, scene);
  pendulumBox.pendSideWall1.mesh.scaling = new BABYLON.Vector3(0.1, 0.5, 1);
  pendulumBox.pendSideWall1.mesh.position = new BABYLON.Vector3(-1.5, 4.5, 0);
  pendulumBox.pendSideWall2.mesh = BABYLON.Mesh.CreateBox("pendSideWall2", 4, scene);
  pendulumBox.pendSideWall2.mesh.scaling = pendulumBox.pendSideWall1.mesh.scaling;
  pendulumBox.pendSideWall2.mesh.position = new BABYLON.Vector3(1.5, 4.5, 0);
  pendulumBox.pendBottomWall.mesh = BABYLON.Mesh.CreateBox("pendBottomWall", 4, scene);
  pendulumBox.pendBottomWall.mesh.scaling = new BABYLON.Vector3(0.84, 0.1, -1.3);
  pendulumBox.pendBottomWall.mesh.position = new BABYLON.Vector3(0, 3.28, 0);

  //create anchor point for pendulum
  pendulum.pendulumAnchor.mesh = BABYLON.Mesh.CreateSphere("pendulum_anchor", 16, 0.3, scene);
  pendulum.pendulumAnchor.mesh.position = new BABYLON.Vector3(0, 5.6, 0);

  pendulum.pendulumBall.mesh = BABYLON.Mesh.CreateSphere("pendulum_ball", 16, 0.3, scene);
  pendulum.pendulumBall.mesh.position = new BABYLON.Vector3(0, 4.5, 0);

  //create blocks
  var boxNumber = 0;
  for(var i = 0; i < 3; i++){
      for(var j = 0; j < 8; j++){
          var block = BABYLON.Mesh.CreateBox("block_" + blocks.activeBlocks++, 0.5, scene, false);
          block.position = new BABYLON.Vector3(-3 + j, 2.5 - i, 0);
          blocks.meshes.push(block);   //add block to blocks array for later collision detection
          blocks.positions.push(block.position);
          blocks.vacancies.push(false);
          boxNumber++;
      }
  }

  setUpPhysicsImposters();
  setUpPendulum();
  addParticleSystemTo(ball.mesh, new BABYLON.Color4(0.7, 0.8, 1.0, 1.0), new BABYLON.Color4(0.2, 0.5, 1.0, 1.0), new BABYLON.Color4(0, 0, 0.2, 0.0), scene);

    return scene;
}

/*-----------------------------------------------------------
 *                          PHYSICS
 * ---------------------------------------------------------*/
function setUpPhysicsImposters(){

  //make physics imposters
  areaWalls.sideWall1.mesh.physicsImpostor = new BABYLON.PhysicsImpostor(areaWalls.sideWall1.mesh, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 0, restitution: 1}, scene);
  areaWalls.sideWall2.mesh.physicsImpostor = new BABYLON.PhysicsImpostor(areaWalls.sideWall2.mesh, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 0, restitution: 1}, scene);
  areaWalls.topWall.mesh.physicsImpostor = new BABYLON.PhysicsImpostor(areaWalls.topWall.mesh, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 0, restitution: 1}, scene);
  pendulumBox.pendSideWall1.mesh.physicsImpostor = new BABYLON.PhysicsImpostor(pendulumBox.pendSideWall1.mesh, BABYLON.PhysicsImpostor.BoxImpostor, {mass:0, restitution: 1});
  pendulumBox.pendSideWall2.mesh.physicsImpostor = new BABYLON.PhysicsImpostor(pendulumBox.pendSideWall2.mesh, BABYLON.PhysicsImpostor.BoxImpostor, {mass:0, restitution: 1});
  pendulumBox.pendBottomWall.mesh.physicsImpostor = new BABYLON.PhysicsImpostor(pendulumBox.pendBottomWall.mesh, BABYLON.PhysicsImpostor.BoxImpostor, {mass:0, restitution: 1});
  pendulum.pendulumAnchor.mesh.physicsImpostor = new BABYLON.PhysicsImpostor(pendulum.pendulumAnchor.mesh, BABYLON.PhysicsImpostor.SphereImpostor, {mass: 0.0, restitution: 0}, scene);
  pendulum.pendulumBall.mesh.physicsImpostor = new BABYLON.PhysicsImpostor(pendulum.pendulumBall.mesh, BABYLON.PhysicsImpostor.SphereImpostor, {mass: 0.5, restitution: 0}, scene);
  paddle.mesh.physicsImpostor = new BABYLON.PhysicsImpostor(paddle.mesh, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 0, restitution: 1}, scene);
  ball.mesh.physicsImpostor = new BABYLON.PhysicsImpostor(ball.mesh, BABYLON.PhysicsImpostor.SphereImpostor, {mass: 0.5, restitution: 1}, scene);
  ball.mesh.physicsImpostor.setLinearVelocity(new BABYLON.Vector3(0, ball.yVelocity, 0));

  //collision actions with imposters
  ball.mesh.physicsImpostor.registerOnPhysicsCollide(paddle.mesh.physicsImpostor, function(main, collided) {
      main.object.material.diffuseColor = new BABYLON.Color3(Math.random(), Math.random(), Math.random());
      ball.mesh.physicsImpostor.setLinearVelocity(new BABYLON.Vector3(ball.mesh.physicsImpostor.getLinearVelocity().x, ball.yVelocity, 0));
  });

  ball.mesh.physicsImpostor.registerOnPhysicsCollide(areaWalls.topWall.mesh.physicsImpostor, function(main, collided) {
      ball.mesh.physicsImpostor.setLinearVelocity(new BABYLON.Vector3(ball.mesh.physicsImpostor.getLinearVelocity().x, -ball.mesh.physicsImpostor.getLinearVelocity().y, 0));
  });

  ball.mesh.physicsImpostor.registerOnPhysicsCollide(areaWalls.sideWall1.mesh.physicsImpostor, function(main, collided) {
      ball.mesh.physicsImpostor.setLinearVelocity(new BABYLON.Vector3(ball.mesh.physicsImpostor.getLinearVelocity().x, ball.mesh.physicsImpostor.getLinearVelocity().y, 0));
  });

  ball.mesh.physicsImpostor.registerOnPhysicsCollide(areaWalls.sideWall2.mesh.physicsImpostor, function(main, collided) {
      ball.mesh.physicsImpostor.setLinearVelocity(new BABYLON.Vector3(-ball.mesh.physicsImpostor.getLinearVelocity().x, ball.mesh.physicsImpostor.getLinearVelocity().y, 0));
  });

  ball.mesh.physicsImpostor.registerOnPhysicsCollide(pendulumBox.pendSideWall1.mesh.physicsImpostor, function(main, collided) {
      ball.mesh.physicsImpostor.setLinearVelocity(new BABYLON.Vector3(-ball.mesh.physicsImpostor.getLinearVelocity().x, ball.mesh.physicsImpostor.getLinearVelocity().y, 0));
  });

  ball.mesh.physicsImpostor.registerOnPhysicsCollide(pendulumBox.pendSideWall2.mesh.physicsImpostor, function(main, collided) {
      ball.mesh.physicsImpostor.setLinearVelocity(new BABYLON.Vector3(ball.mesh.physicsImpostor.getLinearVelocity().x, ball.mesh.physicsImpostor.getLinearVelocity().y, 0));
  });

  ball.mesh.physicsImpostor.registerOnPhysicsCollide(pendulumBox.pendBottomWall.mesh.physicsImpostor, function(main, collided) {
      ball.mesh.physicsImpostor.setLinearVelocity(new BABYLON.Vector3(ball.mesh.physicsImpostor.getLinearVelocity().x, -ball.mesh.physicsImpostor.getLinearVelocity().y, 0));
  });

  ball.mesh.physicsImpostor.registerOnPhysicsCollide(pendulum.pendulumBall.mesh.physicsImpostor, function(main, collided) {
      ball.mesh.physicsImpostor.setLinearVelocity(new BABYLON.Vector3(ball.mesh.physicsImpostor.getLinearVelocity().x, -ball.mesh.physicsImpostor.getLinearVelocity().y, 0));
      gameOver = true;
  });
}

/*-----------------------------------------------------------
 *                  PENDULUM SYSTEM
 * ---------------------------------------------------------*/

function setUpPendulum(){
  //pendulumn physics distance joint
  var distanceJoint = new BABYLON.DistanceJoint({ maxDistance: 1 });
  pendulum.pendulumAnchor.mesh.physicsImpostor.addJoint(pendulum.pendulumBall.mesh.physicsImpostor, distanceJoint);
  pendulum.pendulumBall.mesh.applyImpulse(new BABYLON.Vector3(1.5, 0, 0), pendulum.pendulumBall.mesh.getAbsolutePosition());
}

function updatePendulum(){
    pendulum.pendulumBall.mesh.applyImpulse(new BABYLON.Vector3(0.01, 0, 0), ball.mesh.getAbsolutePosition());
}

function openPendulumBox(){
    //start particle system
    addParticleSystemTo(pendulum.pendulumBall.mesh, new BABYLON.Color4(0.1, 0.8, 0.1, 1.0), new BABYLON.Color4(0.1, 0.8, 1.0, 1.0), new BABYLON.Color4(0, 0, 0.2, 0.0), scene);

    //blow open the doors
    pendulumBox.pendSideWall1.mesh.physicsImpostor.setMass(1);
    pendulumBox.pendSideWall1.mesh.applyImpulse(new BABYLON.Vector3(-5, 0, 0), pendulumBox.pendSideWall1.mesh.getAbsolutePosition());

    pendulumBox.pendSideWall2.mesh.physicsImpostor.setMass(1);
    pendulumBox.pendSideWall2.mesh.applyImpulse(new BABYLON.Vector3(5, 0, 0), pendulumBox.pendSideWall2.mesh.getAbsolutePosition());

    pendulumBoxOpen = true;
}


/*-----------------------------------------------------------
 *                  PARTICLE SYSTEM
 * ---------------------------------------------------------*/

function addParticleSystemTo(objectMesh, colour1, colour2, colourDead ,scene){

    // Create a particle system
    var particleSystem = new BABYLON.ParticleSystem("particles", 2000, scene);

    //Texture of each particle
    particleSystem.particleTexture = new BABYLON.Texture("./../resources/textures/flare.png", scene);

    // Where the particles come from
    particleSystem.emitter = objectMesh; // the starting object, the emitter
    particleSystem.minEmitBox = new BABYLON.Vector3(0, 0.0, 0); // Starting all from
    particleSystem.maxEmitBox = new BABYLON.Vector3(0, 0.5, 0); // To...

    // Colors of all particles
    particleSystem.color1 = colour1;
    particleSystem.color2 = colour2;
    particleSystem.colorDead = colourDead;

    // Size of each particle (random between...)
    particleSystem.minSize = 0.1;
    particleSystem.maxSize = 0.2;

    // Life time of each particle (random between...
    particleSystem.minLifeTime = 0.3;
    particleSystem.maxLifeTime = 0.5;

    // Emission rate
    particleSystem.emitRate = 500;

    // Blend mode : BLENDMODE_ONEONE, or BLENDMODE_STANDARD
    particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;

    // Set the gravity of all particles
    particleSystem.gravity = new BABYLON.Vector3(0, -9.81, 0);

    // Direction of each particle after it has been emitted
    particleSystem.direction1 = new BABYLON.Vector3(-7, 8, 3);
    particleSystem.direction2 = new BABYLON.Vector3(7, 8, -3);

    // Angular speed, in radians
    particleSystem.minAngularSpeed = 0;
    particleSystem.maxAngularSpeed = Math.PI;

    // Speed
    particleSystem.minEmitPower = 0.5;
    particleSystem.maxEmitPower = 1;
    particleSystem.updateSpeed = 0.005;

    // Start the particle system
    particleSystem.start();
}

/*-----------------------------------------------------------
 *                      ACTIONS
 * ---------------------------------------------------------*/

function setUpActionManager(){
  //action manager
  scene.actionManager = new BABYLON.ActionManager(scene);

  //register key actions
  scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger, function(evt){
      if(evt.sourceEvent.key == "a"){
          //clamp the paddle and camera within the game area
          paddle.mesh.position.x = BABYLON.MathTools.Clamp(paddle.mesh.position.x + -0.01 * engine.getDeltaTime() * 2, -6.7, 6.7);
          scene.activeCamera.position.x = BABYLON.MathTools.Clamp(scene.activeCamera.position.x + -0.01 * engine.getDeltaTime() * 2, -6.7, 6.7);
      }else if(evt.sourceEvent.key == "d"){
          paddle.mesh.position.x = BABYLON.MathTools.Clamp(paddle.mesh.position.x + 0.01 * engine.getDeltaTime() * 2, -6.7, 6.7);
          scene.activeCamera.position.x = BABYLON.MathTools.Clamp(scene.activeCamera.position.x + 0.01 * engine.getDeltaTime() * 2, -6.7, 6.7);
      }else if(evt.sourceEvent.key == "r"){ //activate powerup
          activatePowerup(powerups.playersPowerups[0]);
      }else if(evt.sourceEvent.key == "e"){
          blocks.length = 0;
      }
  }));
}

/*-----------------------------------------------------------
 *                  GAME UTILS
 * ---------------------------------------------------------*/

function getRandomNumber(min, max){
    return Math.random() * (max - min) + min;
}

/*-----------------------------------------------------------
 *                  GAME STATE/ UPDATING
 * ---------------------------------------------------------*/

//updates breakable blocks
 function updateBlocks(){
     updateCollisionObjects(blocks.meshes);
 }

//updates powerups
 function updatePowerups(){
     updateCollisionObjects(powerups.meshes)
 }

//updates collision based objects (breakable blocks, powerups etc..)
 function updateCollisionObjects(objects){
     for(var i = objects.length - 1; i >= 0; i--){ //must loop backwards due to splicing, splicing re indexs the array, meaning reverse iteration is safe
         if(ball.mesh.intersectsMesh(objects[i], true)){
            objects[i].dispose();         //destroy the mesh
            objects.splice(i, 1);         //update array size
            blocks.vacancies[i] = true;   //update vacancy
            ball.mesh.physicsImpostor.setLinearVelocity(new BABYLON.Vector3(ball.mesh.physicsImpostor.getLinearVelocity().x, -ball.mesh.physicsImpostor.getLinearVelocity().y, 0));
            score += 100;
        }else{
            objects[i].rotation.y += 0.01;    //rotate the cube
        }
     }
 }

//spawns a powerup, gives a 1 in 10 chance of a powerup being spawned
function spawnPowerup(){
    for(var i = 0; i < blocks.vacancies.length; i++){
        if(blocks.vacancies[i] && getRandomNumber(1, 10) <= 2){    //if there is a vacancy and you fall within the chance range
            var powerup = BABYLON.Mesh.CreateBox("powerup_" + powerups.activePowerups++, 0.5, scene, false);
            powerup.position = blocks.positions[i];     //set the power up position to that of the vacant space
            powerups.meshes.push(powerup);
            powerups.positions[i] = powerup.position;
            blocks.vacancies[i] = false;        //space is no longer vacant
            if(powerups.playersPowerups.length < 3){    //max of 3 powerups
                powerups.playersPowerups.push(powerups.types[Math.floor(Math.random()*powerups.types.length)]); //get a random powerup type, and assign it to the player
            }
        }
    }
}

//activates a powerup
function activatePowerup(powerup){
    if(!isUsingPowerup){        //turn powerup on
        isUsingPowerup = true;
        switch (powerup) {
            case "LONGER_PADDLE":
                paddle.mesh.scaling.x += 1;
                //reset the physics imposter to match the change in the mesh
                paddle.mesh.physicsImpostor = new BABYLON.PhysicsImpostor(paddle.mesh, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 0, restitution: 1}, scene);
                break;
            case "BIGGER_BALL":
                ball.mesh.scaling = new BABYLON.Vector3(2.5, 2.5, 2.5);
                //reset the physics imposter to match the change in the mesh
                ball.mesh.physicsImpostor = new BABYLON.PhysicsImpostor(ball.mesh, BABYLON.PhysicsImpostor.SphereImpostor, {mass: 0.5, restitution: 1}, scene);
                break;
            case "SLOW_MOTION":
                scene.getPhysicsEngine().setTimeStep(SLOW_MOTION_STEP_TIME);
                break;
            default:

        }
    }
}

function removePowerupEffect(powerup){
    switch(powerup){
        case "LONGER_PADDLE":
            paddle.mesh.scaling = paddle.originalScale;
            //reset the physics imposter to match the change in the mesh
            paddle.mesh.physicsImpostor = new BABYLON.PhysicsImpostor(paddle.mesh, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 0, restitution: 1}, scene);
            break;
        case "BIGGER_BALL":
            ball.mesh.scaling = ball.originalScale;
            //reset the physics imposter to match the change in the mesh
            ball.mesh.physicsImpostor = new BABYLON.PhysicsImpostor(ball.mesh, BABYLON.PhysicsImpostor.SphereImpostor, {mass: 0.5, restitution: 1}, scene);
            break;
        case "SLOW_MOTION":
            scene.getPhysicsEngine().setTimeStep(DEFAULT_STEP_TIME);
            break;
        default:
    }
}

//updats the ball object
function updateBall(){
    if(ball.mesh.position.y < -10){     //ball has fallen out of game area
        gameOver = true;
    }
}

//update the player
function updatePlayer(){
    if(isUsingPowerup){
        if(powerupTimer <= 0){
            isUsingPowerup = false;
            powerupTimer = 6000;                        //reset to 6 seconds
            removePowerupEffect(powerups.playersPowerups[0]);
            powerups.playersPowerups.splice(0, 1);      //remove first index
        }else{
            powerupTimer -= engine.getDeltaTime();
        }
    }
}



//add a block wider than the sphere radius to a distance joint on the sphere so players can hit the ball from straight under
//add a replay function (reset function might suffice, maybe make an init function)
//when all boxes have been destroyed a hinge joint lowers the side walls giving access to the end of game item.
//if the ball gets within the box slow down time, resume normal speed when done
//clamp camera rotation

var scene = createScene();

//set up actions for scene
setUpActionManager();


engine.runRenderLoop(function(){
    scene.render();
    if(!gameOver){
        if(blocks.length != 0){
            updateBall();
            updateBlocks();
            updatePowerups();
            spawnPowerup();
        }else{
            //open up the end game box
            if(!pendulumBoxOpen){
                openPendulumBox();
            }
        }
        updatePlayer();
    }else{
        //display gui with score and a replay
        //gameOver = false;
        //scene = createScene
    }
});

window.addEventListener("resize", function () {
  engine.resize();
});
