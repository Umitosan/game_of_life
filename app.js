/*jshint esversion: 6 */

var CANVAS,
    ctx,
    myGame,
    myReq;
var myColors = new Colors();

var State = {
  myReq: undefined,
  loopRunning: false,
  gameStarted: false,
  lastFrameTimeMs: 0, // The last time the loop was run
  maxFPS: 60, // The maximum FPS allowed
  frameCounter: 0,
  lastKey: 'none'
};


function Colors() {
  this.black = 'rgba(0, 0, 0, 1)';
  this.darkGrey = 'rgba(50, 50, 50, 1)';
  this.lightGreyTrans = 'rgba(50, 50, 50, 0.3)';
  this.greyReset = 'rgb(211,211,211)';
  this.lighterGreyReset = 'rgb(240,240,240)';
  this.white = 'rgba(250, 250, 250, 1)';
  this.red = 'rgba(230, 0, 0, 1)';
  this.green = 'rgba(0, 230, 0, 1)';
  this.blue = 'rgba(0, 0, 230, 0.7)';
}


function Game(updateDur) {
  this.timeGap = 0;
  this.lastUpdate = 0;
  this.updateDuration = updateDur; // milliseconds duration between update()
  this.paused = false;
  this.bg = new Image();
  this.lastKey = 0;
  this.pausedTxt = undefined;

  this.init = function() {
    this.bg.src = 'bg1.png';
  };

  this.draw = function() {

  };

  this.drawBG = function() {
    ctx.imageSmoothingEnabled = false;  // turns off AntiAliasing
    ctx.drawImage(this.bg,4,4,CANVAS.width-9,CANVAS.height-9);
  };

  this.update = function() {

      if (this.paused === false) { // performance based update: myGame.update() runs every myGame.updateDuration milliseconds

            if (State.playTime < 1) { // make sure on first update() only run once
              this.lastUpdate = performance.now();
              this.timeGap = 0;
            } else {
              this.timeGap = performance.now() - this.lastUpdate;
            }

            if ( this.timeGap >= this.updateDuration ) {
              let timesToUpdate = this.timeGap / this.updateDuration;
              for (let i=1; i < timesToUpdate; i++) {
                // update children objects
              }
              this.lastUpdate = performance.now();
            }

            this.updatePlayTime();
      } else if (this.paused === true) {
        // do nothin
      } else {
        console.log('game pause issue');
      }

  };

}


//////////////////////////////////////////////////////////////////////////////////
// GAME LOOP
//////////////////////////////////////////////////////////////////////////////////
function gameLoop(timestamp) {
  // timestamp is automatically returnd from requestAnimationFrame
  // timestamp uses performance.now() to compute the time
  State.myReq = requestAnimationFrame(gameLoop);

  if ( (State.loopRunning === true) && (State.gameStarted === true) ) { myGame.update();  }

  clearCanvas();
  if (State.gameStarted === false) {
    myGame.drawBG();
  } else {
    myGame.draw();
  }

}


//////////////////////////////////////////////////////////////////////////////////
// HELPERS
//////////////////////////////////////////////////////////////////////////////////
function clearCanvas() {
  ctx.clearRect(-1, -1, canvas.width+1, canvas.height+1); // offset by 1 px because the whole canvas is offset initially (for better pixel accuracy)
}

function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
$(document).ready(function() {

  CANVAS =  $('#canvas')[0];
  ctx =  CANVAS.getContext('2d');
  // CANVAS.addEventListener('keydown',keyDown,false);

  // this is to correct for canvas blurryness on single pixel wide lines etc
  // this is extremely important when animating to reduce rendering artifacts and other oddities
  ctx.translate(0.5, 0.5);

  // start things up so that the background image can be drawn
  myGame = new Game(10);
  myGame.init();
  State.loopRunning = true;
  myReq = requestAnimationFrame(gameLoop);

  $('#start-btn').click(function() {
    console.log("start button clicked");
    if (State.myReq !== undefined) {  // reset game loop if already started
      console.log('tried to cancel');
      cancelAnimationFrame(State.myReq);
      hardReset();
    }
    myGame = new Game(10); // param = ms per update()
    myGame.init();
    State.myReq = requestAnimationFrame(gameLoop);
    State.loopRunning = true;
    State.gameStarted = true;
  });

});
