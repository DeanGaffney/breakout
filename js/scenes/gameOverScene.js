
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


  var highScoreButton = BABYLON.GUI.Button.CreateSimpleButton("highScoreButton", "High Scores!");
  highScoreButton.top = "50px";
  highScoreButton.width = 0.2;
  highScoreButton.height = "40px";
  highScoreButton.color = "white";
  highScoreButton.background = "red";

  highScoreButton.onPointerUpObservable.add(function(info) {
      getScores(advancedTexture);
  });


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
  advancedTexture.addControl(highScoreButton);
  advancedTexture.addControl(replayButton);

  gameOverScreen.renderLoop = function(){this.render();}

  return gameOverScreen;
}

function displayScores(gui, data){
    var highScores = JSON.parse(data);
    highScores.sort(function(a, b){
        return b.score - a.score;
    });

    for(var i = 0; i < 10; i++){
        var scoreItem = new BABYLON.GUI.TextBlock();
        scoreItem.text = "Score: " + highScores[i].score;
        scoreItem.color = "white";
        scoreItem.fontSize = 32;
        scoreItem.left = "20px";
        scoreItem.top = ((i + 1) * 30) + "px";
        scoreItem.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        scoreItem.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        gui.addControl(scoreItem);
    }
}

function getScores(gui){
    $.ajax({
        type: "GET",
        url: "/scores",
        dataType: "json",
        success: function(data){
            displayScores(gui, JSON.stringify(data));
        }
    });
}
