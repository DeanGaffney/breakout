function createSplashScene(){
    var splashScreen = new BABYLON.Scene(engine);

    // This creates and positions a free camera (non-mesh)
    var camera = new BABYLON.FreeCamera("splashScreenCamera", new BABYLON.Vector3(0, 3, -20), splashScreen);

    camera.inputs.clear();

    // This targets the camera to gameScene origin
    camera.setTarget(BABYLON.Vector3.Zero());

    // This attaches the camera to the canvas
    camera.attachControl(canvas, true);

    //set still camera as active camera
    splashScreen.activeCamera = camera;
    var advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("splashScreenUI");
    var container = new BABYLON.GUI.Container();
    container.background = "blue";

    var playButton = BABYLON.GUI.Button.CreateSimpleButton("playButton", "PLAY!");
    playButton.width = 0.2;
    playButton.height = "40px";
    playButton.color = "white";
    playButton.background = "green";

    playButton.onPointerUpObservable.add(function(info) {
      Game.activeScene++;   //increment scene number to GameScene
      Game.gameStates.gameStart = false;
      Game.gameStates.playing = true;
    });

    container.addControl(playButton);

    advancedTexture.addControl(container);

    splashScreen.renderLoop = function(){this.render();}

    return splashScreen;
}
