//create ball
var ball = {
    originalScale: new BABYLON.Vector3(1, 1, 1),
    yVelocity : 13,     //balls constant y velocity
    radius: 0.5         //balls radius
};

//create paddle
var paddle = {
    originalScale: new BABYLON.Vector3(1, 0.2, 1),
    originalSpeed: 2,
    currentSpeed: 2
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
    meshes: [],             //block meshes currently in the gameScene
    positions: [],          //positions of block meshses in the gameScene(Vec3)
    vacancies: []           //boolean array indicating if an index in the meshses array is free for a potential powerup
};

//object for powerups
var powerups = {
    powerupSpawnTime: 4000,
    activePowerups: 0,      //total powerups made in the game life
    meshes: [],             //powerup meshes currently in the gameScene
    positions: [],          //position of the powerup meshes in the gameScene (Vec3)
    playersPowerups: [],    //the players powerup inventory
    types: ["LONGER_PADDLE", "SLOW_MOTION", "SPEED_UP"]      //types of powerups available
};

const DEFAULT_STEP_TIME = 1/240;
const SLOW_MOTION_STEP_TIME = 1/480;

var isUsingPowerup = false;     //powerups is off on game start
var powerupTimer = 6000;    //6 seconds
var score = 0;      //starting score

var pendulumBoxOpen = false;

var minPaddleDistance;
var maxPaddleDistance;

//GUI
var gui;
var scoreText;
var powerupText;
var blocksRemainingText;
var powerupTimeLeftText;
var rect1;
var target;
var line;

/*-----------------------------------------------------------
*                  gameScene SETUP
* ---------------------------------------------------------*/

function createGameScene() {
  return initGameScene();
}

function resetGameScene(){
  clearObjects();
  setUpObjects();
  addParticleSystemTo(ball.mesh, new BABYLON.Color4(0.7, 0.8, 1.0, 1.0), new BABYLON.Color4(0.2, 0.5, 1.0, 1.0), new BABYLON.Color4(0, 0, 0.2, 0.0), gameScene);
}

function initGameScene(){
  // This creates a basic Babylon gameScene object (non-mesh)
  var gameScene = new BABYLON.Scene(engine);

  // This creates and positions a free camera (non-mesh)
  var camera = new BABYLON.FreeCamera("gameCamera", new BABYLON.Vector3(0, 3, -20), gameScene);

  camera.inputs.clear();

  // This targets the camera to gameScene origin
  camera.setTarget(BABYLON.Vector3.Zero());

  // This attaches the camera to the canvas
  camera.attachControl(canvas, true);


  //set still camera as active camera
  gameScene.activeCamera = camera;

  // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
  var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, -1, 0), gameScene);
  light.position = new BABYLON.Vector3(0, 0, 0);

  // Default intensity is 1. Let's dim the light a small amount
  light.intensity = 0.7;

  var envTexture = new BABYLON.CubeTexture("./../../resources/textures/SpecularHDR.dds", gameScene);
  gameScene.createDefaultSkybox(envTexture, true, 1000);

  gameScene.fogMode = BABYLON.Scene.FOGMODE_EXP;
  gameScene.fogDensity = 0.01;
  gameScene.fogStart = 20.0;
  gameScene.fogEnd = 60.0;
  gameScene.fogColor = new BABYLON.Color3(0.2, 0.3, 0.85);

  //enable physics and time step
  gameScene.enablePhysics();
  gameScene.getPhysicsEngine().setTimeStep(DEFAULT_STEP_TIME);


  setUpObjects();
  //set up actions for gameScene
  setUpActionManager(gameScene);
  addParticleSystemTo(ball.mesh, new BABYLON.Color4(0.7, 0.8, 1.0, 1.0), new BABYLON.Color4(0.2, 0.5, 1.0, 1.0), new BABYLON.Color4(0, 0, 0.2, 0.0), gameScene);

  //shadow generator
  var shadowGenerator = new BABYLON.ShadowGenerator(1024, light);
  shadowGenerator.useBlurExponentialShadowMap = true;
  shadowGenerator.useKernelBlur = true;
  shadowGenerator.blurKernel = 64;
  shadowGenerator.getShadowMap().renderList.push(ball.mesh);        //add shadw map to ball
  paddle.mesh.receiveShadows = true;                                //add shadow receiver to paddle

  gameScene.renderLoop = function(){
    if(!Game.gameStates.gameOver){
        if(blocks.meshes.length != 0){
            updateBlocks();
        }else{
            //open up the end game box
            if(!pendulumBoxOpen){
                openPendulumBox();
            }
        }
        updatePowerups();
        spawnPowerup();
        updateBall();
        updatePlayer();
    }else{
      Game.activeScene++;
      Game.gameStates.playing = false;
      Game.gameStates.gameOver = true;
      resetGameScene();
    }
    this.render();
  }
    return gameScene;
}

function setupGameSceneGUI(){
    //gui element
    gui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI", true, gameScene);
    //score
    scoreText = new BABYLON.GUI.TextBlock();
    scoreText.text = "Score: 0";
    scoreText.color = "white";
    scoreText.fontSize = 32;
    scoreText.left = "20px";
    scoreText.top = "10px";
    scoreText.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    scoreText.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    gui.addControl(scoreText);

    //powerup
    powerupText = new BABYLON.GUI.TextBlock();
    powerupText.text = "Powerup: None";
    powerupText.color = "white";
    powerupText.fontSize = 32;
    powerupText.left = "20px";
    powerupText.top = "10px";
    powerupText.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    powerupText.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    powerupText.paddingTop = 40;
    gui.addControl(powerupText);

    //powerup time remaining
    blocksRemainingText = new BABYLON.GUI.TextBlock();
    blocksRemainingText.text = "Blocks: 0";
    blocksRemainingText.color = "white";
    blocksRemainingText.fontSize = 32;
    blocksRemainingText.left = "20px";
    blocksRemainingText.top = "10px";
    blocksRemainingText.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    blocksRemainingText.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    blocksRemainingText.paddingTop = 80;
    gui.addControl(blocksRemainingText);

    //link timer to paddl mesh
    powerupTimeLeftText = new BABYLON.GUI.TextBlock();
    powerupTimeLeftText.text = "Time: " + powerupTimer;
    powerupTimeLeftText.color = "white";
    powerupTimeLeftText.alpha = 0;

    //remianing powerup time
    rect1 = new BABYLON.GUI.Rectangle();
    rect1.width = 0.2;
    rect1.height = "40px";
    rect1.cornerRadius = 20;
    rect1.color = "Orange";
    rect1.thickness = 4;
    rect1.background = "green";
    gui.addControl(rect1);
    rect1.linkWithMesh(paddle.mesh);
    rect1.linkOffsetY = 150;
    rect1.addControl(powerupTimeLeftText);
    rect1.alpha = 0;

    target = new BABYLON.GUI.Ellipse();
    target.width = "40px";
    target.height = "40px";
    target.color = "Orange";
    target.thickness = 4;
    target.background = "green";
    gui.addControl(target);
    target.linkWithMesh(paddle.mesh);
    target.alpha = 0;

    line = new BABYLON.GUI.Line();
    line.lineWidth = 4;
    line.color = "Orange";
    line.y2 = -20;
    line.linkOffsetY = 20;
    gui.addControl(line);
    line.linkWithMesh(paddle.mesh);
    line.connectedControl = rect1;
    line.alpha = 0;
}

function clearObjects(){
    clearBlocks(true);
    clearPowerups();

    //destroy walls
    areaWalls.sideWall1.mesh.dispose();
    areaWalls.sideWall2.mesh.dispose();
    areaWalls.topWall.mesh.dispose();

    //destroy paddle
    paddle.mesh.dispose();
    //destroy ball
    ball.mesh.dispose();

    //destroy pendulum box
    pendulumBox.pendSideWall1.mesh.dispose();
    pendulumBox.pendSideWall2.mesh.dispose();
    pendulumBox.pendBottomWall.mesh.dispose();

    //destroy pendulum anchor
    pendulum.pendulumAnchor.mesh.dispose();
    pendulum.pendulumBall.mesh.dispose();

    removeGUI();
}

function removeGUI(){
    //remove gui elements
    gui.removeControl(scoreText);
    gui.removeControl(powerupText);
    gui.removeControl(blocksRemainingText);
    gui.removeControl(powerupTimeLeftText);
    gui.removeControl(rect1);
    gui.removeControl(target);
    gui.removeControl(line);
}


/*-----------------------------------------------------------
 *                  OBJECT CREATION
 * ---------------------------------------------------------*/
function setUpObjects(){

  isUsingPowerup = false;     //powerups is off on game start
  powerupTimer = 6000;    //6 seconds
  score = 0;      //starting score

  var wallMaterial = new BABYLON.StandardMaterial("wall_material",gameScene);
  wallMaterial.diffuseTexture = new BABYLON.Texture("./../../resources/textures/floor.png", gameScene);
  //create walls
  areaWalls.sideWall1.mesh = BABYLON.Mesh.CreateBox("sideWall1", 4, gameScene);
  areaWalls.sideWall1.mesh.scaling = new BABYLON.Vector3(0.1, 3, 1);
  areaWalls.sideWall1.mesh.position = new BABYLON.Vector3(-8, 0, 0);
  areaWalls.sideWall1.mesh.material = wallMaterial;

  areaWalls.sideWall2.mesh = BABYLON.Mesh.CreateBox("sideWall2", 4, gameScene);
  areaWalls.sideWall2.mesh.scaling = areaWalls.sideWall1.mesh.scaling;
  areaWalls.sideWall2.mesh.position = new BABYLON.Vector3(8, 0 , 0);
  areaWalls.sideWall2.mesh.material = wallMaterial;

  areaWalls.topWall.mesh = BABYLON.Mesh.CreateBox("topWall", 4, gameScene);
  areaWalls.topWall.mesh.scaling = new BABYLON.Vector3(areaWalls.topWall.mesh.scaling.x + 3, 0.1, areaWalls.topWall.mesh.scaling.z);
  areaWalls.topWall.mesh.position = new BABYLON.Vector3(0, 5.8, 0);
  areaWalls.topWall.mesh.material = wallMaterial;

  paddle.mesh = BABYLON.Mesh.CreateBox("paddle", 2, gameScene);
  paddle.mesh.scaling = new BABYLON.Vector3(1, 0.2, 1);
  paddle.mesh.position = new BABYLON.Vector3(0, -4, 0);
  paddle.mesh.material = new BABYLON.StandardMaterial("paddle_material", gameScene);
  paddle.mesh.material.diffuseTexture = new BABYLON.Texture("./../../resources/textures/floor_bump.png", gameScene);

  ball.mesh = BABYLON.Mesh.CreateSphere("ball", 16, ball.radius, gameScene);
  ball.mesh.position = new BABYLON.Vector3(0, -2, 0);
  ball.mesh.material = new BABYLON.StandardMaterial("s-mat", gameScene);

  //pendulum box
  pendulumBox.pendSideWall1.mesh = BABYLON.Mesh.CreateBox("pendSideWall1", 4, gameScene);
  pendulumBox.pendSideWall1.mesh.scaling = new BABYLON.Vector3(0.1, 0.5, 1);
  pendulumBox.pendSideWall1.mesh.position = new BABYLON.Vector3(-1.5, 4.5, 0);
  pendulumBox.pendSideWall1.mesh.material = wallMaterial;

  pendulumBox.pendSideWall2.mesh = BABYLON.Mesh.CreateBox("pendSideWall2", 4, gameScene);
  pendulumBox.pendSideWall2.mesh.scaling = pendulumBox.pendSideWall1.mesh.scaling;
  pendulumBox.pendSideWall2.mesh.position = new BABYLON.Vector3(1.5, 4.5, 0);
  pendulumBox.pendSideWall2.mesh.material = wallMaterial;

  pendulumBox.pendBottomWall.mesh = BABYLON.Mesh.CreateBox("pendBottomWall", 4, gameScene);
  pendulumBox.pendBottomWall.mesh.scaling = new BABYLON.Vector3(0.84, 0.1, 1);
  pendulumBox.pendBottomWall.mesh.position = new BABYLON.Vector3(0, 3.25, 0);
  pendulumBox.pendBottomWall.mesh.material = wallMaterial;

  var pendulumMaterial = new BABYLON.StandardMaterial("pendulum_material",gameScene);
  pendulumMaterial.diffuseTexture = new BABYLON.Texture("./../../resources/textures/fire.png", gameScene);

  //create anchor point for pendulum
  pendulum.pendulumAnchor.mesh = BABYLON.Mesh.CreateSphere("pendulum_anchor", 16, 0.3, gameScene);
  pendulum.pendulumAnchor.mesh.position = new BABYLON.Vector3(0, 5.6, 0);
  pendulum.pendulumAnchor.mesh.material = pendulumMaterial;

  pendulum.pendulumBall.mesh = BABYLON.Mesh.CreateSphere("pendulum_ball", 16, 0.3, gameScene);
  pendulum.pendulumBall.mesh.position = new BABYLON.Vector3(0, 4.5, 0);
  pendulum.pendulumBall.mesh.material = pendulumMaterial;

  setupBlocks();
  setPaddleMovementLimit();
  setUpPhysicsImposters();
  setUpPendulum();

  pendulumBoxOpen = false;
  setupGameSceneGUI();

}

function setupBlocks(){
  //create blocks
  for(var i = 0; i < 3; i++){
      for(var j = 0; j < 8; j++){
          var index = i + j;
          var block = BABYLON.Mesh.CreateBox("block_" + blocks.activeBlocks++, 0.5, gameScene, false);
          block.position = new BABYLON.Vector3(-3 + j, 2.5 - i, 0);
          block.material = new BABYLON.StandardMaterial("block_material", gameScene);
          block.material.diffuseTexture = new BABYLON.Texture("./../../resources/textures/albedo.png", gameScene);
          blocks.meshes.splice(index, 0, block);   //add block to blocks array for later collision detection
          blocks.positions.splice(index, 0, block.position);
          blocks.vacancies.splice(index, 0 , false);
      }
  }
}

function clearBlocks(deepClean){
  blocks.meshes.forEach(function(block){
    block.dispose();
  });

  if(deepClean){
      blocks.meshes.length = 0;
      //object for blocks, destroy them
      blocks = {
          activeBlocks: 0,        //total blocks made in the game life
          meshes: [],             //block meshes currently in the gameScene
          positions: [],          //positions of block meshses in the gameScene(Vec3)
          vacancies: []           //boolean array indicating if an index in the meshses array is free for a potential powerup
      };
  }
}

function clearPowerups(){
  powerups.meshes.forEach(function(powerup){
    powerup.dispose();
  });

  powerups.meshes.length = 0;
  powerups.playersPowerups.length = 0;

  //object for powerups destroy them
  powerups = {
      activePowerups: 0,      //total powerups made in the game life
      meshes: [],             //powerup meshes currently in the gameScene
      positions: [],          //position of the powerup meshes in the gameScene (Vec3)
      playersPowerups: [],    //the players powerup inventory
      types: ["LONGER_PADDLE", "SLOW_MOTION", "BIGGER_BALL"]      //types of powerups available
  };
}


/*-----------------------------------------------------------
 *                          PHYSICS
 * ---------------------------------------------------------*/
function setUpPhysicsImposters(){

  //make physics imposters
  areaWalls.sideWall1.mesh.physicsImpostor = new BABYLON.PhysicsImpostor(areaWalls.sideWall1.mesh, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 0, restitution: 1}, gameScene);
  areaWalls.sideWall2.mesh.physicsImpostor = new BABYLON.PhysicsImpostor(areaWalls.sideWall2.mesh, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 0, restitution: 1}, gameScene);
  areaWalls.topWall.mesh.physicsImpostor = new BABYLON.PhysicsImpostor(areaWalls.topWall.mesh, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 0, restitution: 1}, gameScene);
  pendulumBox.pendSideWall1.mesh.physicsImpostor = new BABYLON.PhysicsImpostor(pendulumBox.pendSideWall1.mesh, BABYLON.PhysicsImpostor.BoxImpostor, {mass:0.0, restitution: 1});
  pendulumBox.pendSideWall2.mesh.physicsImpostor = new BABYLON.PhysicsImpostor(pendulumBox.pendSideWall2.mesh, BABYLON.PhysicsImpostor.BoxImpostor, {mass:0.0, restitution: 1});
  pendulumBox.pendBottomWall.mesh.physicsImpostor = new BABYLON.PhysicsImpostor(pendulumBox.pendBottomWall.mesh, BABYLON.PhysicsImpostor.BoxImpostor, {mass:0, restitution: 1});
  pendulum.pendulumAnchor.mesh.physicsImpostor = new BABYLON.PhysicsImpostor(pendulum.pendulumAnchor.mesh, BABYLON.PhysicsImpostor.SphereImpostor, {mass: 0.0, restitution: 0}, gameScene);
  pendulum.pendulumBall.mesh.physicsImpostor = new BABYLON.PhysicsImpostor(pendulum.pendulumBall.mesh, BABYLON.PhysicsImpostor.SphereImpostor, {mass: 0.5, restitution: 0}, gameScene);
  paddle.mesh.physicsImpostor = new BABYLON.PhysicsImpostor(paddle.mesh, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 0, restitution: 1}, gameScene);
  ball.mesh.physicsImpostor = new BABYLON.PhysicsImpostor(ball.mesh, BABYLON.PhysicsImpostor.SphereImpostor, {mass: 0.5, restitution: 1}, gameScene);
  ball.mesh.physicsImpostor.setLinearVelocity(new BABYLON.Vector3(getRandomNumber(-4 ,4), ball.yVelocity, 0));

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
      Game.gameStates.gameOver = true;
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
    addParticleSystemTo(pendulum.pendulumBall.mesh, new BABYLON.Color4(0.1, 0.8, 0.1, 1.0), new BABYLON.Color4(0.1, 0.8, 1.0, 1.0), new BABYLON.Color4(0, 0, 0.2, 0.0), gameScene);

    //blow open the doors
    pendulumBox.pendSideWall1.mesh.physicsImpostor.setMass(0.1);
    pendulumBox.pendSideWall2.mesh.physicsImpostor.setMass(0.1);
    pendulumBox.pendSideWall1.mesh.physicsImpostor.setLinearVelocity(new BABYLON.Vector3(-5, 0, 0));
    pendulumBox.pendSideWall1.mesh.physicsImpostor.setAngularVelocity(new BABYLON.Quaternion(1 ,0 ,0, 0));
    pendulumBox.pendSideWall2.mesh.applyImpulse(new BABYLON.Vector3(5, 0, 0), pendulumBox.pendSideWall2.mesh.getAbsolutePosition());
    pendulumBox.pendSideWall2.mesh.physicsImpostor.setLinearVelocity(new BABYLON.Vector3(5, 0, 0));
    pendulumBox.pendSideWall2.mesh.physicsImpostor.setAngularVelocity(new BABYLON.Quaternion(-1 ,0 ,0, 0));
    pendulumBoxOpen = true;
}


/*-----------------------------------------------------------
 *                  PARTICLE SYSTEM
 * ---------------------------------------------------------*/

function addParticleSystemTo(objectMesh, colour1, colour2, colourDead ,gameScene){

    // Create a particle system
    var particleSystem = new BABYLON.ParticleSystem("particles", 2000, gameScene);

    //Texture of each particle
    particleSystem.particleTexture = new BABYLON.Texture("./../../resources/textures/flare.png", gameScene);

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

function setUpActionManager(gameScene){
  //action manager
  gameScene.actionManager = new BABYLON.ActionManager(gameScene);

  //register key actions
  gameScene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger, function(evt){
      if(evt.sourceEvent.key == "a"){
          //clamp the paddle and camera within the game area
          paddle.mesh.position.x = BABYLON.MathTools.Clamp(paddle.mesh.position.x + -0.01 * engine.getDeltaTime() * paddle.currentSpeed, minPaddleDistance, maxPaddleDistance);
          //gameScene.activeCamera.position.x = BABYLON.MathTools.Clamp(gameScene.activeCamera.position.x + -0.01 * engine.getDeltaTime() * paddle.currentSpeed /2, minPaddleDistance, maxPaddleDistance);
      }else if(evt.sourceEvent.key == "d"){
          paddle.mesh.position.x = BABYLON.MathTools.Clamp(paddle.mesh.position.x + 0.01 * engine.getDeltaTime() * paddle.currentSpeed, minPaddleDistance, maxPaddleDistance);
          //gameScene.activeCamera.position.x = BABYLON.MathTools.Clamp(gameScene.activeCamera.position.x + 0.01 * engine.getDeltaTime() * paddle.currentSpeed / 2, minPaddleDistance, maxPaddleDistance);
      }else if(evt.sourceEvent.key == "w"){
          paddle.mesh.rotation.z += 0.01 * engine.getDeltaTime();  //rotate paddle
      }else if(evt.sourceEvent.key == "s"){
          paddle.mesh.rotation.z += -0.01 * engine.getDeltaTime(); //rotate the paddle
      }else if(evt.sourceEvent.key == "r" && powerups.playersPowerups.length != 0){ //activate powerup
          activatePowerup(powerups.playersPowerups[0]);
      }else if(evt.sourceEvent.key == "e"){   //END OF GAME BUTTON TO DEMONSTRACTE PENDULUM BOX!!
          clearBlocks(false);
          blocks.meshes.length = 0;
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
function setPaddleMovementLimit(){
    const offset = 0.3;
    //set paddle distance restrictions, set here because the paddle mesh changes on power up
    minPaddleDistance = (areaWalls.sideWall1.mesh.position.x + paddle.mesh.scaling.x) + offset;
    maxPaddleDistance = (areaWalls.sideWall2.mesh.position.x - paddle.mesh.scaling.x) - offset;
}

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
            blocks.vacancies[i] = true;   //update vacancy      *****THE BUG FOR POWERUP SPAWNING IS HERE AS POWER MESHES LENGTH IS DIFFERENT TO BLOCKS LENGTH!!!!****
            ball.mesh.physicsImpostor.setLinearVelocity(new BABYLON.Vector3(ball.mesh.physicsImpostor.getLinearVelocity().x, -ball.mesh.physicsImpostor.getLinearVelocity().y, 0));
            score += 100;
            scoreText.text = "Score: " + score;
            blocksRemainingText.text = "Blocks: " + blocks.meshes.length;
        }else{
            objects[i].rotation.y += 0.01;    //rotate the cube
        }
     }
 }

//spawns a powerup, gives a 1 in 10 chance of a powerup being spawned
function spawnPowerup(){
    for(var i =0; i < 3; i++){
        for(var j = 0; j < 8; j++){
            var index = i+j;
            if(canSpawnPowerup(index)){    //if there is a vacancy and you fall within the chance range
                console.log("spawned powerup at index:" + index + "\nvacant:" + blocks.vacancies[index]);
                blocks.vacancies[index] = false;        //space is no longer vacant
                var powerup = BABYLON.Mesh.CreateBox("powerup_" + powerups.activePowerups++, 0.5, gameScene, false);
                powerup.material = new BABYLON.StandardMaterial("powerup_material", gameScene);
                powerup.material.diffuseTexture = new BABYLON.Texture("./../../resources/textures/bloc.jpg", gameScene);
                powerup.position = blocks.positions[index];     //set the power up position to that of the vacant space
                powerups.meshes.splice(index, 0, powerup);              //push the powerup mesh to its array
                powerups.powerupSpawnTime = 4;              //reset the spawn time
                if(powerups.playersPowerups.length < 3){    //max of 3 powerups for player
                    powerups.playersPowerups.splice(index, 0, powerups.types[Math.floor(Math.random()*powerups.types.length)]); //get a random powerup type, and assign it to the player
                }
            }else{
                powerups.powerupSpawnTime -= engine.getDeltaTime();
            }
        }
    }
}

//returns true if can the space is vacant, the chance is less than 2,
//there are less than 3 powerups already present and the spawn time is less than 0, false otherwise
function canSpawnPowerup(index){
    return blocks.vacancies[index]   &&
    Math.floor(getRandomNumber(1, 10))  <= 3    &&
    powerups.meshes.length < 3              &&
    powerups.powerupSpawnTime <= 0;
}

//turns the powerup gui timer on and off depending on its current state
function togglePowerupTimerGUI(){
    powerupTimeLeftText.alpha = (powerupTimeLeftText.alpha == 0) ? 1 : 0;
    rect1.alpha = (rect1.alpha == 0) ? 1 : 0;
    target.alpha = (target.alpha == 0) ? 1 : 0;
    line.alpha = (line.alpha == 0) ? 1 : 0;
}

//activates a powerup
function activatePowerup(powerup){
    if(!isUsingPowerup){        //turn powerup on
        isUsingPowerup = true;
        togglePowerupTimerGUI();
        switch (powerup) {
            case "LONGER_PADDLE":
                paddle.mesh.scaling.x += 1;
                //reset the physics imposter to match the change in the mesh
                paddle.mesh.physicsImpostor = new BABYLON.PhysicsImpostor(paddle.mesh, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 0, restitution: 1}, gameScene);
                setPaddleMovementLimit();
                break;
            case "SPEED_UP":
                paddle.currentSpeed = paddle.originalSpeed * 2;
                break;
            case "SLOW_MOTION":
                gameScene.getPhysicsEngine().setTimeStep(SLOW_MOTION_STEP_TIME);
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
            paddle.mesh.physicsImpostor = new BABYLON.PhysicsImpostor(paddle.mesh, BABYLON.PhysicsImpostor.BoxImpostor, {mass: 0, restitution: 1}, gameScene);
            setPaddleMovementLimit();
            break;
        case "SPEED_UP":
            paddle.currentSpeed = paddle.originalSpeed;
            break;
        case "SLOW_MOTION":
            gameScene.getPhysicsEngine().setTimeStep(DEFAULT_STEP_TIME);
            break;
        default:
    }
}

//updats the ball object
function updateBall(){
    if(ball.mesh.position.y < -10){     //ball has fallen out of game area
        Game.gameStates.gameOver = true;
    }
    if(Math.floor(ball.mesh.physicsImpostor.getLinearVelocity().x) == 0){
       ball.mesh.applyImpulse(new BABYLON.Vector3(0.1, 0, 0), ball.mesh.getAbsolutePosition());
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
            togglePowerupTimerGUI();
        }else{
            powerupTimer -= engine.getDeltaTime();
            powerupTimeLeftText.text = "Time: " + Math.floor(powerupTimer / 1000);
        }
    }
    powerupText.text = (powerups.playersPowerups.length != 0) ? "Powerup: " + powerups.playersPowerups[0] : "Powerup: None";
}
