var canvas = document.getElementById("renderCanvas");
// Load the BABYLON 3D engine
var engine = new BABYLON.Engine(canvas, true);

var gameOver = false;
//create ball
var ball = {};
//create paddle
var paddle = {};

//create area walls
var areaWalls = {
  sideWall1: {},
  sideWall2: {},
  topWall: {}
};

//create pendulum box
var pendulumBox = {
  pendSideWall1: {},
  pendSideWall2: {}
};

//pendulum object
var pendulum = {
  pendulumAnchor: {},
  pendulumBall: {}
};

//array to hold blocks
var blocks = [];

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
  scene.getPhysicsEngine().setTimeStep(1/240);
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

  ball.mesh = BABYLON.Mesh.CreateSphere("ball", 16, 0.5, scene);
  ball.mesh.position = new BABYLON.Vector3(0, -2, 0);
  ball.mesh.material = new BABYLON.StandardMaterial("s-mat", scene);

  //pendulum box
  pendulumBox.pendSideWall1.mesh = BABYLON.Mesh.CreateBox("pendSideWall1", 4, scene);
  pendulumBox.pendSideWall1.mesh.scaling = new BABYLON.Vector3(0.1, 0.5, 1);
  pendulumBox.pendSideWall1.mesh.position = new BABYLON.Vector3(-1.5, 4.5, 0);
  pendulumBox.pendSideWall2.mesh = BABYLON.Mesh.CreateBox("pendSideWall2", 4, scene);
  pendulumBox.pendSideWall2.mesh.scaling = pendulumBox.pendSideWall1.mesh.scaling;
  pendulumBox.pendSideWall2.mesh.position = new BABYLON.Vector3(1.5, 4.5, 0);

  //create anchor point for pendulum
  pendulum.pendulumAnchor.mesh = BABYLON.Mesh.CreateSphere("pendulum_anchor", 16, 0.3, scene);
  pendulum.pendulumAnchor.mesh.position = new BABYLON.Vector3(0, 5.6, 0);

  pendulum.pendulumBall.mesh = BABYLON.Mesh.CreateSphere("pendulum_ball", 16, 0.3, scene);
  pendulum.pendulumBall.mesh.position = new BABYLON.Vector3(0, 4.5, 0);

  //create blocks
  for(var i = 0; i < 3; i++){
      for(var j = 0; j < 8; j++){
          var block = BABYLON.Mesh.CreateBox("block_" + (i+j), 0.5, scene);
          block.position = new BABYLON.Vector3(-3 + j, 2.5 - i, 0);
          blocks.push(block);   //add block to blocks array for later collision detection
      }
  }

  setUpPhysicsImposters();
  setUpPendulum();
  addParticleSystemTo(ball.mesh, new BABYLON.Color4(0.7, 0.8, 1.0, 1.0), new BABYLON.Color4(0.2, 0.5, 1.0, 1.0), new BABYLON.Color4(0, 0, 0.2, 0.0), scene);

    return scene;
}

function setUpPhysicsImposters(){
  /*-----------------------------------------------------------
   *                          PHYSICS
   * ---------------------------------------------------------*/
  //make physics imposters
  areaWalls.sideWall1.mesh.physicsImpostor = new BABYLON.PhysicsImpostor(areaWalls.sideWall1.mesh, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 0, restitution: 1}, scene);
  areaWalls.sideWall2.mesh.physicsImpostor = new BABYLON.PhysicsImpostor(areaWalls.sideWall2.mesh, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 0, restitution: 1}, scene);
  areaWalls.topWall.mesh.physicsImpostor = new BABYLON.PhysicsImpostor(areaWalls.topWall.mesh, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 0, restitution: 1}, scene);
  pendulumBox.pendSideWall1.mesh.physicsImpostor = new BABYLON.PhysicsImpostor(pendulumBox.pendSideWall1.mesh, BABYLON.PhysicsImpostor.BoxImpostor, {mass:0, restitution: 1})
  pendulumBox.pendSideWall2.mesh.physicsImpostor = new BABYLON.PhysicsImpostor(pendulumBox.pendSideWall2.mesh, BABYLON.PhysicsImpostor.BoxImpostor, {mass:0, restitution: 1})
  pendulum.pendulumAnchor.mesh.physicsImpostor = new BABYLON.PhysicsImpostor(pendulum.pendulumAnchor.mesh, BABYLON.PhysicsImpostor.SphereImpostor, {mass: 0.0, restitution: 0}, scene);
  pendulum.pendulumBall.mesh.physicsImpostor = new BABYLON.PhysicsImpostor(pendulum.pendulumBall.mesh, BABYLON.PhysicsImpostor.SphereImpostor, {mass: 0.5, restitution: 0}, scene);
  paddle.mesh.physicsImpostor = new BABYLON.PhysicsImpostor(paddle.mesh, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 0, restitution: 1}, scene);
  ball.mesh.physicsImpostor = new BABYLON.PhysicsImpostor(ball.mesh, BABYLON.PhysicsImpostor.SphereImpostor, {mass: 0.5, restitution: 1}, scene);
  ball.mesh.physicsImpostor.setLinearVelocity(new BABYLON.Vector3(0, 12, 0));
  //Math.random() * (5 - 1) + 1 use this to make angle at start different

  //collision actions with imposters
  ball.mesh.physicsImpostor.registerOnPhysicsCollide(paddle.mesh.physicsImpostor, function(main, collided) {
      main.object.material.diffuseColor = new BABYLON.Color3(Math.random(), Math.random(), Math.random());
      ball.mesh.physicsImpostor.setLinearVelocity(new BABYLON.Vector3(ball.mesh.physicsImpostor.getLinearVelocity().x, ball.mesh.physicsImpostor.getLinearVelocity().y, 0));
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
  pendulum.pendulumBall.mesh.applyImpulse(new BABYLON.Vector3(1.5, 0, 0), ball.mesh.getAbsolutePosition());
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
          paddle.mesh.position.x += -0.2;
          scene.activeCamera.position.x += -0.2;
      }else if(evt.sourceEvent.key == "d"){
          paddle.mesh.position.x += 0.2;
          scene.activeCamera.position.x += 0.2;
      }
  }));
}

/*-----------------------------------------------------------
 *                  GAME STATE
 * ---------------------------------------------------------*/



 //add a block wider than the sphere radius to a distance joint on the sphere so players can hit the ball from straight under
//create cubes that rotate in columns and rows as the blocks to break
//add imposters for each cube that increments a score counter
//create a sphere that is hanging from the top wall as a pendulumn (this is game win condition to hit it)
//maybe create a json object that saves the position of the blocks and if a space is vacant mayeb put a power up there
//space bar activates powerups (longer paddle, maybe multiple balls, slow down time for a few seconds)
//stop paddle when it hits side walls
//game over condition when ball.position goes below Vec3f (0,0,0);
//add a score
//add a replay function (reset function might suffice, maybe make an init function)
//create a box above the 'topWall' inside the box the sphere with the pendulumn is there,
//when all boxes have been destroyed a hinge joint lowers the side walls giving access to the end of game item.

var scene = createScene();
//set up actions for scene
setUpActionManager();

engine.runRenderLoop(function(){
    scene.render();
    for (var block in blocks) {

    }
});

window.addEventListener("resize", function () {
  engine.resize();
});
