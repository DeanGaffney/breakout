var canvas = document.getElementById("renderCanvas");
// Load the BABYLON 3D engine
var engine = new BABYLON.Engine(canvas, true);

BABYLON.Engine.audioEngine.setGlobalVolume(0.5);


var gameScene = createGameScene();
var splashScreen = createSplashScene();
var gameOverScreen = createGameOverScene();

//add game scens to game scene array
Game.gameScenes.push(splashScreen);
Game.gameScenes.push(gameScene);
Game.gameScenes.push(gameOverScreen);

engine.runRenderLoop(function(){
      Game.gameScenes[Game.activeScene].renderLoop();
});

window.addEventListener("resize", function () {
  engine.resize();
});
