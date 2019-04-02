//the canvas the game is displayed on
var stage;

//The player character
var char;

//The Bg images
var bgFront, bgMid, bgBack;

//text that displays onscreen
var screenText;

//sounds
var step1S, step2S, step3S, step4S, jumpS;

//timer to keep track of steps
var soundTimer = 0;

//The direction the player is facing (1 = right, -1 = left)
var xDir = 1;

//The velocity of the character, these start at 0 always
var xv = 0, yv = 0;

//how fast the player picks up speed, and how quickly they slow down
var xAccel = 0.5, xDeAccel = 0.7;

//The max speed the player can meet on the X plane
var maxSpeedX = 7;

//The Gravity Applied to the player while they are moving up, should be lower than hardGravity
var initialGravity = 1;

//The Gravity Applied while the player is falling
var hardGravity = 1.5;

//The power of the players jump
var jumpPower = -15;

//Var for animation 0 = Idle, 1 = Walk, 2 = Jump
var currentAnim = 0;
var animOver = false;

//The Bounds of the character, used for collisions
var charBounds;

//bools for player controls
var holdingLeft, holdingRight, holdingJump;

//bool for player on ground
var grounded;

//var for time the player must wait before jumping
var jumpTimer;

//an array that contains all of the "walls" space a player cant go through
var walls = [];

//goal, the objective of the player
var goal;

//the floor the player is currently standing on, tells when to apply gravity
var currentFloor;

//bounds to see what is moving, world or character
var leftBound = 200, rightBound = 600;

//bool for the end of the game
var gameOver = false, gameWon = false;

function init(){
    stage = new createjs.Stage("minerCanvas");
    
    //load the bg
    loadBg();
    loadSounds();
    
    //gets player character
    char = new CaveMiner();
    
    //player variables
    char.x = 400;
    char.y = 300;
    char.width = 100;
    char.height = 285;
    stage.addChild(char);
    stage.update();
    
    //takes player input - press key
    document.addEventListener('keydown', function (event) {
        if (event.keyCode === 32) {
            holdingJump = true;
        }
        if (event.keyCode === 37) {
            holdingLeft = true;
            holdingRight = false;
        }
        if (event.keyCode === 39) {
            holdingRight = true;
            holdingLeft = false;
        }
    });
    //takes player input - release key
    document.addEventListener('keyup', function(event) {
        if (event.keyCode === 32) {
            holdingJump = false;
        }
        if(event.keyCode === 37) {
            holdingLeft = false;
        }
        if(event.keyCode === 39) {
            holdingRight = false;
        }
    });
    
    //walls and floor
    createWall(0,0,50,550);
    createWall(3100,0,50,600);
    createWall(0,550,900,50);
	createWall(1000,450,200,50);
    createWall(1400,550,100,50);
	createWall(1650,550,200,50);
    createWall(1950,450,50,50);
    createWall(2100,350,50,50);
    createWall(2400,550,50,50);
	createWall(2650,550,50,50);
	createWall(2800,450,50,50);
    
    //goal
    createGoal(3050,200,50,50);
    
    //Text to explain
    loadText();
    
    createjs.Ticker.setFPS(30);
    createjs.Ticker.addEventListener("tick", onTick);
}


function onTick(){
    
    if(!holdingRight && !holdingLeft && grounded){
        changeAnim(0);
    }else if (!grounded){
        changeAnim(2);
    }else{
        changeAnim(1);
        //plays step on a timer
        soundTimer += 1;
        if(soundTimer >= 25 && !gameWon){
            playStep()
            soundTimer = 0;
        }
    }
    
    if(xDir === 1 && holdingLeft){
        xDir = -1;
    }
    
    if(xDir === -1 && holdingRight){
        xDir = 1;
    }
    
    if(holdingLeft || holdingRight){
        if(xv < maxSpeedX){
            xv = xv + xAccel;
        } else{
            xv = maxSpeedX;
        }
    } else {
        if(xv > 0){
            xv = xv - xDeAccel;
        } else {
            xv = 0;
        }
    }
    
     //handle player jumps and gravity
    //jump timer - more in wall collision
    if(jumpTimer > 0){
        jumpTimer--;
    }else{
            //has player jump
            if(grounded && holdingJump){
            grounded = false;
            yv = jumpPower;
                
            //play jump sound
            createjs.Sound.play(jumpS);    
        }
    }

    if(!grounded){
        if(holdingJump && yv < 0.5){
            yv += initialGravity;
        }else{
           yv += hardGravity; 
        }
    }
    
    if(grounded){
        if(char.x - (char.width / 2) > currentFloor.nx + currentFloor.width||char.x + (char.width / 2) < currentFloor.nx){
            grounded = false;
        }
    }
    
    if(!gameOver){
        char.y += yv;
    }
    
	if(char.y > 650){
		gameEnd("You Lose! \nRefresh the page to try again.");
	}
	
    movePlayer((xv * xDir) * -1)
    char.scaleX = xDir;
     
    //check collisions
    //gets the box around the player character
    charBounds = new createjs.Rectangle(char.x - (char.width / 2), char.y - char.height, char.width, char.height);
    
    checkColl();
    checkGoal();
    
    if(gameWon){
        soundTimer += 1;
        if(soundTimer >= 35){
            createjs.Sound.play(pickaxeS);    
            soundTimer = 0;
        }
    }
    
    stage.update();
}

//add BG to screen
function loadBg(){
    bgBack = new createjs.Bitmap("images/cave-wall.png");    
    bgMid = new createjs.Bitmap("images/cave-form.png");
    bgFront = new createjs.Bitmap("images/cave-foreground.png");

    bgBack.x = -145;
    bgBack.y = -60;
    
    stage.addChild(bgBack);
    stage.addChild(bgMid);
    stage.addChild(bgFront);
}

//add text to screen
function loadText(){
    screenText = new createjs.Text("Use Arrow keys to move the character. \nPress space to jump. \nReach the gold block at the end to win!", "34px Arial", "#ff7700");
	screenText.x = 20;
	screenText.y = 20;
        
	stage.addChild(screenText);
}

//loads sounds into game
function loadSounds(){
    step1S = "step1";
    step2S = "step2";
    step3S = "step3";
    step4S = "step4";
    jumpS = "jump";
    pickaxeS = "pickaxe";
    
    //from http://soundbible.com/2057-Footsteps-On-Cement.html
    createjs.Sound.registerSound("sounds/step1.wav",step1S);
    createjs.Sound.registerSound("sounds/step2.wav",step2S);
    createjs.Sound.registerSound("sounds/step3.wav",step3S);
    createjs.Sound.registerSound("sounds/step4.wav",step4S);
    
    //from http://soundbible.com/682-Swoosh-1.html
    createjs.Sound.registerSound("sounds/jump.wav",jumpS);
    
    //from http://soundbible.com/1980-Swords-Collide.html
    createjs.Sound.registerSound("sounds/pickaxe.wav",pickaxeS);
}

//plays a random step sound
function playStep(){
    var rndNum = Math.floor((Math.random() * 5) + 1);
    switch(rndNum){
        default:
            createjs.Sound.play(step1S);
            break;
        case 2:
            createjs.Sound.play(step2S);
            break;
        case 3:
            createjs.Sound.play(step3S);
            break;
        case 4:
            createjs.Sound.play(step4S);
            break;
    }
    
}

//creates a wall/platform for the player to collide with. 
function createWall(x,y,width,height){
    var wall = new createjs.Shape();
    wall.graphics.beginFill("#000000").drawRect(x, y, width, height);
    wall.fixedX = x + 1;
    wall.nx = x + 1;
    wall.ny = y + 1;
    wall.height = height - 2;
    wall.width = width - 2;
    wall.setBounds(wall.nx,wall.ny,wall.width,wall.height);
    stage.addChild(wall);
    walls.push(wall);
}

function checkColl(){
    //checks all the walls on screen
    for(i = 0; i < walls.length; i++){
        
        //checks to see if intersecting any boxes
        if(charBounds.intersects(walls[i].getBounds())){

            //creates a rectangle that details the area of intersection
            collBox = charBounds.intersection(walls[i].getBounds());
            
            //checks to see which intersection is deeper - the x axis or the y axis
            if(collBox.width > collBox.height){
                
                //checks to see if the collision happened on the top or bottom of the "wall"
                if(collBox.y > walls[i].ny + walls[i].height / 2){
                    
                    //the collision is on the bottom, move char outside of collision to bottom
                    char.y += collBox.height + 1;
                    
                    //stop the player from rising - They hit the roof and must not continue momentum
                    if(yv < 0){
                        yv = 0;
                    }
                    
                }else{
                    //the collision is on the top, move char outside of collision to top
                    char.y -= collBox.height + 1;
                    
                    //place the player on the ground and set the floor
                    grounded = true;
                    yv = 0;
                    currentFloor = walls[i];
                    
                    //how long the player must wait before jumping
                    jumpTimer = 5;
                }
                
            }else{
                //checks to see if the collision happened on the left or rigth side of the "wall"
                if(charBounds.x < walls[i].nx + walls[i].width /2){
                    
                    //the collision is on the right side, move char outside of collision to right
                    //char.x -= collBox.width + 1;
                    movePlayer(collBox.width + 1);
                }else{
                    
                    //the collision is on the left side, move char outside of collision to left
                    //char.x += collBox.width + 1;
                    movePlayer((collBox.width + 1) * -1);
                }
            }
        }
    }
}

function createGoal(x,y,width,height){
    goal = new createjs.Shape();
    goal.graphics.beginFill("#dafc00").drawRect(x, y, width, height);
    goal.setBounds(x,y,width,height);
    stage.addChild(goal);
}

function checkGoal(){
    if(charBounds.intersects(goal.getTransformedBounds())){
        gameEnd("You Win!");
    }
}

function movePlayer(amount){
    if(!gameOver){
        playerHitBorder = false;
    
        //checks to see if player will move off screen to right and moves camera
        if(char.x + amount >= rightBound && amount < 0){
            moveAllNonPlayer(amount);
            playerHitBorder = true;
        }

        //checks to see if player will move off screen to left and moves camera
        if(char.x + amount <= leftBound && amount > 0){
            moveAllNonPlayer(amount);
            playerHitBorder = true;
        }

        if(!playerHitBorder){
            char.x -= amount;
        }
    }

}

//move all objects that are not the player to make a sidescroller feeling
function moveAllNonPlayer(amount){
    for(i = 0; i < walls.length; i++){
        walls[i].x += amount;
        walls[i].nx = walls[i].fixedX + walls[i].x;
        walls[i].setBounds(walls[i].nx,walls[i].ny,walls[i].width,walls[i].height);
    }
    
    goal.x += amount;
    
    //moves the bg in the opposite direction the player is moving at a reduced pace
    bgFront.x += amount/3;
    bgMid.x += amount/8;
        
}

//change the animation in an update function without spamming one and freezing the character
function changeAnim(animNum){
    if(currentAnim != animNum && !animOver){
        currentAnim = animNum;
        switch(animNum){
            case 0:
            char.Idle();    
            break;
            case 1:
            char.Walk();
            break;
            case 2:
            char.Jump();    
            break;
            case 3:
            char.Break();
            animOver = true;    
            default:
            break;    
        }
    }
}

function gameEnd(endText){
	if(!gameOver){
        if(endText == "You Win!"){
            //char.x = goal.x - (char.width / 2);
            //char.y = goal.y + ((char.height / 2) + 50);
            changeAnim(3);
            gameWon = true;
        }else {
            stage.removeChild(char);
        }
       stage.removeChild(screenText);
	   screenText = new createjs.Text(endText, "34px Arial", "#ff7700");
	   screenText.x = 100;
	   screenText.y = 100;
        
	stage.addChild(screenText);
	gameOver = true;
	}
}