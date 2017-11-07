

function createGameOverScene(gameState){
  var gameOverScreen = new BABYLON.Scene(engine);

  // This creates and positions a free camera (non-mesh)
  var camera = new BABYLON.FreeCamera("gameOverCamera", new BABYLON.Vector3(0, 3, -20), gameOverScreen);

  camera.inputs.clear();

  // This targets the camera to gameScene origin
  camera.setTarget(BABYLON.Vector3.Zero());

  // This attaches the camera to the canvas
  camera.attachControl(canvas, true);


  //set still camera as active camera
  gameOverScreen.activeCamera = camera;

  var advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("myUI");

  var replayButton = BABYLON.GUI.Button.CreateSimpleButton("replayButton", "REPLAY!");
  replayButton.width = 0.2;
  replayButton.height = "40px";
  replayButton.color = "white";
  replayButton.background = "red";

  replayButton.onPointerUpObservable.add(function(info) {
    Game.gameStates.gameOver = false;
    Game.activeScene = 1;
  });

  var backgroundImage = new BABYLON.GUI.Image("backgroundImage", "./../../resources/textures/background.png");

  advancedTexture.addControl(backgroundImage);
  advancedTexture.addControl(replayButton);

  gameOverScreen.renderLoop = function(){this.render();}

  return gameOverScreen;
}
