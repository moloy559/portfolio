//stage
var stage;

//player's score
var score = 0;
var lives = 3;

//screen elements
var title, b1, b2, b3, scoreStat, livesStat;

//set assets Visual assets from https://jonathan-so.itch.io/creatorpack
var imgSpriteSheet, imgEnemySprites, imgBG, imgPlayerBullet, imgExplosionPlayer, imgExplosionEnemy;
var playerSprites, enemySprites, playerExplosionSprites, enemyExplosionSprites;

//player obj
var char;
var currentFrame;
var bulletArray = [];
var playerDead = false;
var playerExplosion;
var playerRespawnReady = false;

//enemy obj
var enemyArray = [];
var enemyExplosionArray = [];

//take player input
var holdingLeft, holdingRight, holdingFire;

//a variable used to ensure the player cant spam shots too fast
var fireRate = 0;

//enemy count, should never go above enemyMax
var enemyCount = 1, scoreSpace = 0, enemyMax = 3;

//ensures all important parts are loaded before onTick runs stuff
var gameLoaded = false;

//sound IDs all sounds from https://freesound.org/
var laserSound, playSound, loseSound, explosionSound;

//music ID also taken from https://jonathan-so.itch.io/creatorpack
var mechaSong;
var musicInstance;

function init(){
    
    //Creates Stage
    stage = new createjs.Stage("gameCanvas");
    
    //takes player input - press key
    document.addEventListener('keydown', function (event) {
        if (event.keyCode == 37) {
            holdingLeft = true;
            holdingRight = false;
        }
        if (event.keyCode == 39) {
            holdingRight = true;
            holdingLeft = false;
        }
        if (event.keyCode == 32) {
            holdingFire = true;
        }
        
    });
    //takes player input - release key
    document.addEventListener('keyup', function(event) {
        if(event.keyCode == 37) {
            holdingLeft = false;
        }
        if(event.keyCode == 39) {
            holdingRight = false;
        }
        if(event.keyCode == 32) {
            holdingFire = false;
        }   
    });
    
    loadAssets();
    loadBG();
    startScreen();
    moveBG();
    
    //sets up onTick method method
    createjs.Ticker.setFPS(60);
    createjs.Ticker.addEventListener("tick", onTick);
    
}


function loadAssets(){
    imgSpriteSheet = new Image();
    imgSpriteSheet.src = "images/player.png";
    imgPlayerBullet = new Image();
    imgPlayerBullet.src = "images/bullet.png";
    imgEnemySprites = new Image();
    imgEnemySprites.src = "images/enemy-ships.png";
    imgExplosionEnemy = new Image();
    imgExplosionEnemy.src = "images/enemy-explosion.png"
    imgExplosionPlayer = new Image();
    imgExplosionPlayer.src = "images/player-explosion.png";
    
    playerExplosionSprites = new createjs.SpriteSheet({
    // image to use
    images: [imgExplosionPlayer], 
    // width & height of each sprite
    frames: {width: 14, height: 14}, 
    animations: {
 
    }
});
    
    
    enemyExplosionSprites = new createjs.SpriteSheet({
    // image to use
    images: [imgExplosionEnemy], 
    // width & height of each sprite
    frames: {width: 16, height: 16}, 
    animations: {
        
    }
});
    
    playerSprites = new createjs.SpriteSheet({
    // image to use
    images: [imgSpriteSheet], 
    // width, height & registration point of each sprite
    frames: {width: 18, height: 18}, 
    animations: {
        
    }
        
});
    
    enemySprites = new createjs.SpriteSheet({
    // image to use
    images: [imgEnemySprites], 
    // width, height & registration point of each sprite
    frames: {width: 12, height: 18}, 
    animations: {
        
    }
        
});
    
    //All sounds from https://freesound.org/
    laserSound = "laser";
    createjs.Sound.registerSound("sounds/WAV/laser.wav",laserSound);
    playSound = "play";
    createjs.Sound.registerSound("sounds/WAV/play.wav",playSound);
    loseSound = "lose";
    createjs.Sound.registerSound("sounds/WAV/lose.wav",loseSound);
    explosionSound = "explosion";
    createjs.Sound.registerSound("sounds/WAV/explosion.wav",explosionSound);
    mechaSong = "mecha";
    createjs.Sound.registerSound("sounds/WAV/Mecha Collection.wav",mechaSong);
    
}

function onTick(){
    
    //check to see if game is running
    if(gameLoaded){
        
        if(!playerDead){
            //velocity updating
            if(holdingLeft){
                if(char.v < 3){
                    char.v += 0.3;
                }
                char.dir = -1;
            } else if(holdingRight){
                if(char.v < 3){
                    char.v += 0.3;
                }
                char.dir = 1;
            } else{
                if(char.v <=0){
                    char.v = 0;
                } else{
                    char.v -= 0.4;
                }
            }

            //char frame in animation
            if(char.v === 0 && currentFrame != 0){
                char.gotoAndStop(0);
                currentFrame = 0;
            } else if (char.v >= 3 && currentFrame != 2){
                char.gotoAndStop(2);
                currentFrame = 2;
            } else if (char.v > 0 && char.v < 3 && currentFrame != 1) {
                char.gotoAndStop(1);
                currentFrame = 1;
            }

            //update fireRate
            if(holdingFire && fireRate === 0){
                spawnBullet();
                fireRate = 14;
            }

            if(fireRate != 0){
                fireRate--;
            }

            //char switch direction
            if(char.dir > 0 && char.scaleX > 0){
                char.scaleX = -3;
                char.x += 54;
            } else if(char.dir < 0 && char.scaleX < 0) {
                char.scaleX = 3;
                char.x -= 54;
            }

            //update char position
            if(char.x > 0 || char.dir > 0){
                if(char.x < 600 || char.dir < 0){
                    char.x += (char.v * char.dir);
                }
            }

        }
        //update bullets
        bulletArray.forEach(fireBullet);
        
        //update enemy
        enemyArray.forEach(checkHit);
        enemyArray.forEach(enemyMove);
        
        //update explosions
        enemyExplosionArray.forEach(animateExplosion);
        
        if(playerDead){
            if(playerExplosion.tickCount===0){
                if(playerExplosion.frame===3){
                    stage.removeChild(playerExplosion);
                    playerRespawnReady = true;
                } else{
                    playerExplosion.frame += 1;
                    playerExplosion.tickCount = 3;
                    playerExplosion.gotoAndStop(playerExplosion.frame);
                }
            }else{
                playerExplosion.tickCount -= 1;
            }
            
            if (playerRespawnReady&&enemyArray.length===0){
                if(lives>=0){
                 respawnPlayer();   
                }
            }
        }
    
    }
    
    stage.update();
}


//loads the background
function loadBG(){
    imgBG = new createjs.Bitmap("images/space-BG.jpg");
    imgBG.x = 0;
    imgBG.y = 0;
    stage.addChild(imgBG);
}

//function that calls itself to move the bg
function moveBG(){
    createjs.Tween.get(imgBG)
    .to({ y: -1000 }, 30000, createjs.Ease.getPowInOut(2))
    .to({ y: 0 }, 2000, createjs.Ease.getPowInOut(2))
    .call(moveBG);
}

function startScreen(){
    //Adds title to start screen
    title = new createjs.Text("SPACE SHOOTER", "42px Russo One", "white")
    title.x = 100;
    title.y = 100;
    stage.addChild(title);
    
    //adds a button to start screen
    b1 = new createjs.Shape();
    b1.graphics.beginFill("#dddd6a").drawRect(0, 0, 300, 50);
    b1.x = 100;
    b1.y = 210;    
    stage.addChild(b1);
    
    b1.text = new createjs.Text("Play", "36px Russo One", "black");
    b1.text.x = 110;
    b1.text.y = 210;
    stage.addChild(b1.text);
    
    //enable mouse over
    stage.enableMouseOver();
    
    //add event listeners
    b1.addEventListener("click", gameStart);
    b1.addEventListener("mouseover", onButtonOver);
    b1.addEventListener("mouseout", onButtonOut);
}

function removeStartScreen(){
    stage.removeChild(title);
    stage.removeChild(b1);
    stage.removeChild(b1.text);
}

function onButtonOver(event){
    event.target.text.x = 120;
    event.target.x = 110;
}

function onButtonOut(event){
    event.target.text.x = 110;
    event.target.x = 100;
}

function gameStart(event){
    loadPlayer();
    spawnEnemy();
    removeStartScreen();
    gameLoaded = true;
    playerDead = false;
    //plays sound
    createjs.Sound.play(playSound);
}

//loads and places the player char
function loadPlayer(){
    
    //sets the player into the scene
    char = new createjs.Sprite(playerSprites);
    char.gotoAndStop(0);
    currentFrame = 0;
    char.x = 273;
    char.y = 700;
    char.v = 0;
    char.dir = 1;
    char.scaleX = 3;
    char.scaleY = 3;
    stage.addChild(char);
    
    score = 0;
    lives = 3;
    
    //loads score
    scoreStat = new createjs.Text("Score: " + score, "36px Russo One", "White");
    scoreStat.x = 12;
    stage.addChild(scoreStat);
    
    livesStat = new createjs.Text("Lives: " + lives, "36px Russo One", "White");
    livesStat.x = 450;
    stage.addChild(livesStat);
    
    //plays music
    playSong(mechaSong);
}

//spawns an enemy
function spawnEnemy(){
    var enemy = new createjs.Sprite(enemySprites);
    enemy.x = (Math.random() * 564);
    enemy.y = -54;
    enemy.scaleX = 3;
    enemy.scaleY = 3;
    
    stage.addChild(enemy);
    enemy.gotoAndStop(0);
    enemyArray.push(enemy);
}

//spawns a bullet
function spawnBullet(){
    var bullet = new createjs.Bitmap(imgPlayerBullet);
    bullet.scaleX = char.scaleX;
    bullet.scaleY = 3;
    bullet.y = char.y;
    bullet.x = char.x - (21 * char.dir);
    stage.addChild(bullet);
    bulletArray.push(bullet);
    
    //plays sound
    createjs.Sound.play(laserSound, {volume:0.2});
}

//moves bullets
function fireBullet(item, index){
    item.y -= 10;
    if(item.y <= -10){
        bulletArray.splice(index,1);
        stage.removeChild(item);
    }
}

//moves enemy
function enemyMove(item, index){
    item.y += 7;
    
    if(!playerDead){
        if(item.y > 646 && item.y < 736){
         if(item.getTransformedBounds().intersects(char.getTransformedBounds())){
             destroyPlayer();
             destroyEnemy(item,index);
         }
        }

        if(item.y > 854){
            enemyArray.splice(index,1);
            stage.removeChild(item);
            spawnEnemy();
        }
    } else {
        if(item.y > 854){
            enemyArray.splice(index,1);
            stage.removeChild(item);
        }
    }
       
}

function destroyEnemy(enemy,enemyIndex){
    //set up explosion
    var explosion = new createjs.Sprite(enemyExplosionSprites);
    explosion.scaleX = 3;
    explosion.scaleY = 3;
    explosion.x = enemy.x;
    explosion.y = enemy.y;
    explosion.frame = 2;
    explosion.tickCount = 3;
    
    //remove the enemy
    enemyArray.splice(enemyIndex,1);
    stage.removeChild(enemy);
    
    //add the explosion to the scene
    enemyExplosionArray.push(explosion);
    stage.addChild(explosion);
    explosion.gotoAndStop("2");
    
    //plays sound
    createjs.Sound.play(explosionSound,  {volume:0.15});
    
    //player gets a point /scales difficulty
    manageScore();
    
}

function manageScore(){
    //reset max if needed
    if(score===0){
        enemyMax = 3;
    }
    
    //increase score
    score += 1;
    scoreStat.text = "Score: " + score;
    if(score > 9){
        if(scoreSpace===10){
            scoreSpace = 0;
            enemyMax += 1;
        }else{
            scoreSpace += 1;
        }
    }
    
    //spawns a new enemy aswell as another one if limit is not reached
    spawnEnemy();
    if(enemyCount < enemyMax){
        spawnEnemy();
        enemyCount++;
    }
}


//checks all enemys to see if they've been hit by a bullet
 //stage.removeChild(bulletArray[i]);
 //bulletArray.splice(i,1);
function checkHit(item, index){
    for(i = 0; i < bulletArray.length; i++){
        if(bulletArray[i].getTransformedBounds().intersects(item.getTransformedBounds())){
            destroyEnemy(item,index);
            stage.removeChild(bulletArray[i]);
            bulletArray.splice(i,1);
        }
    }
    
}

//animates explosions of enemys
function animateExplosion(item, index){
    if(item.tickCount === 0){
        if(item.frame === 0){
            enemyExplosionArray.splice(index, 1);
            stage.removeChild(item);
        } else {
            item.frame -= 1;
            item.gotoAndStop(item.frame);
            item.tickCount = 3;
        }
    } else{
        item.tickCount -= 1;
    }
}

//destroys the player and adds an explosion
function destroyPlayer(){
    //set up player explosion
    playerExplosion = new createjs.Sprite(playerExplosionSprites);
    playerExplosion.scaleX = char.scaleX;
    playerExplosion.scaleY = 3;
    playerExplosion.x = char.x;
    playerExplosion.y = char.y;
    playerExplosion.frame = 0;
    playerExplosion.tickCount = 3;
    
    //remove player object
    stage.removeChild(char);
    
    //add explosion
    playerDead = true;
    stage.addChild(playerExplosion);
    playerExplosion.gotoAndStop(0);
    
    
    if(lives === 0){
     //plays sound
    lives -= 1;    
    stopSong();
    createjs.Sound.play(loseSound);
    gameOverScreen();   
    } else {
        lives -= 1;
        livesStat.text = "Lives: " + lives;
    }
    
}

//game over screen
function gameOverScreen(){
    //remove score
    stage.removeChild(scoreStat);
    stage.removeChild(livesStat);
    
    //add text
    title = new createjs.Text("Game Over! \nYour score was: " + score, "36px Russo One", "white")
    title.x = 100;
    title.y = 100;
    stage.addChild(title);
    
    //adds a button to start screen
    b2 = new createjs.Shape();
    b2.graphics.beginFill("#dddd6a").drawRect(0, 0, 300, 50);
    b2.x = 100;
    b2.y = 310;    
    stage.addChild(b2);
    
    //adds a button to start screen 
    b3 = new createjs.Shape();
    b3.graphics.beginFill("#dddd6a").drawRect(0, 0, 300, 50);
    b3.x = 100;
    b3.y = 370;    
    stage.addChild(b3);
    
    //adds button text
    b2.text = new createjs.Text("Restart", "36px Russo One", "black")
    b2.text.x = 110;
    b2.text.y = 310;
    stage.addChild(b2.text);
    
    //adds button text
    b3.text = new createjs.Text("Menu", "36px Russo One", "black")
    b3.text.x = 110;
    b3.text.y = 370;
    stage.addChild(b3.text);
    
    
    //add button functionality
    b2.addEventListener("click", restart);
    b2.addEventListener("mouseover", onButtonOver);
    b2.addEventListener("mouseout", onButtonOut);
    b3.addEventListener("click", toMenu);
    b3.addEventListener("mouseover", onButtonOver);
    b3.addEventListener("mouseout", onButtonOut);
}

function removeGameOverScreen(){
    stage.removeChild(b2);
    stage.removeChild(b2.text);
    stage.removeChild(b3);
    stage.removeChild(b3.text);
    stage.removeChild(title);
}

function toMenu(){
    removeGameOverScreen();
    startScreen();
    enemyCount = 1;
    for(i = 0; i < enemyArray.length; i++){
        stage.removeChild(enemyArray[i]);
    }
    enemyArray = [];
}

function restart(){
    //restart
    removeGameOverScreen();
    enemyCount = 1;
    for(i = 0; i < enemyArray.length; i++){
        stage.removeChild(enemyArray[i]);
    }
    enemyArray = [];
    loadPlayer();
    spawnEnemy();
    gameLoaded = true;
    playerDead = false;
    //plays sound
    createjs.Sound.play(playSound);
}

function respawnPlayer(){
    stage.addChild(char);
    playerDead = false;
    enemyCount = 1;
    spawnEnemy();
}

function playSong(songID){
    musicInstance = createjs.Sound.play(mechaSong, {loop:-1});
}

function stopSong(){
    musicInstance.stop();
}

function getRect(bounded){
    
}