//GUI
var gameStart = false;
var advancedTexture;

var splashScreen;

var guiCam;

function setUpGameGUI(){

}

function setUpSplashScreenGUI(){
    var splashScreen = new BABYLON.Scene(engine);

    splashScreen.activeCamera = camera;

    advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("myUI");

    var playButton = BABYLON.GUI.Button.CreateSimpleButton("playButton", "PLAY!");
    playButton.width = 0.2;
    playButton.height = "40px";
    playButton.color = "white";
    playButton.background = "red";

    playButton.onPointerUpObservable.add(function(info) {
      gameStart = true;
    });
    advancedTexture.addControl(playButton);

    return splashScreen;
}

function setUpGameOverScreenGUI(){
  var splashScreen = new BABYLON.Scene(engine);

  splashScreen.activeCamera = camera;

  advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("myUI");

  var playButton = BABYLON.GUI.Button.CreateSimpleButton("playButton", "REPLAY!");
  playButton.width = 0.2;
  playButton.height = "40px";
  playButton.color = "white";
  playButton.background = "red";

  playButton.onPointerUpObservable.add(function(info) {
    gameStart = true;
  });
  advancedTexture.addControl(playButton);

  return splashScreen;
}
