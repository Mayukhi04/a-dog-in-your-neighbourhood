import { Scene, Actions, Input} from 'phaser';

export class Game extends Scene
{
    cursors;
    puppy;
    bird;
    dogCaught = false;
    birdEscapeDirection = 0;
    birdEscapeTargetX = 0;

    moveSpeed = 3;
    lastAnim = 'walk-up';
    lastHorizontalDir = 'right'; 
    lastMovedTime = 0;
    nextYipTime = 0;
    nextSnoreTime = 0;
    meatHasSpawned = false;
    isTransitioning = false;

    score = 0;
    meatCollectedCount = 0;
    cat;
    catSpeed = 145;
    catRunDirection = 'right';
  
    timerVal = 30;
    timerPassed = 0;
    timer;
    timerFlashUntil = 0;
    timerFlashSuffix = '';
    gameContainer;
    gameOverBirdLaunched = false;
  
    roadSegments = [];
    connectedRoadSegments = [];
    connectedRoadSet = new Set();
    reachableRoadSegments = [];
    roadWidthThreshold = 16;

    bgMusic;

    dsOverlay;
    dpadButtons = {};
    dpadPositions = {};
    dpadPointerState = {
        up: false,
        left: false,
        down: false,
        right: false
    };

    constructor ()
    {
        super('Game');
    }

    resetGameState() {
        this.cursors = null;
        this.puppy = null;
        this.bird = null;
        this.birdfly = null;
        this.dogCaught = false;
        this.birdEscapeDirection = 0;
        this.birdEscapeTargetX = 0;
        this.moveSpeed = 3;
        this.lastAnim = 'walk-up';
        this.lastHorizontalDir = 'right';
        this.lastMovedTime = 0;
        this.nextYipTime = 0;
        this.nextSnoreTime = 0;
        this.meatHasSpawned = false;
        this.isTransitioning = false;
        this.score = 0;
        this.meatCollectedCount = 0;
        this.cat = null;
        this.catRunDirection = 'right';
        this.timerVal = 30;
        this.timerPassed = 0;
        this.timerFlashUntil = 0;
        this.timerFlashSuffix = '';
        this.gameOverBirdLaunched = false;
        this.roadSegments = [];
        this.connectedRoadSegments = [];
        this.connectedRoadSet = new Set();
        this.reachableRoadSegments = [];
        this.gameContainer = null;
    }

    preload ()
    {
        this.load.setPath('assets');
        
        this.load.image('overlay', 'ds.jpeg');
        this.load.image('field', 'red_flower.jpg')

        this.load.spritesheet('dog', 'dog.png', {
            frameWidth: 32,
            frameHeight: 32
        });

        this.load.spritesheet('bird', 'pigeon_eat-Sheet.png', {
            frameWidth: 32,
            frameHeight: 32
        });

        this.load.spritesheet('birdfly', 'pigeon_fiy-Sheet.png', {
            frameWidth: 32,
            frameHeight: 32
        });

        this.load.spritesheet('birdflyleft', 'pigeon_fiy-SheetLeft.png',{
            frameWidth: 32,
            frameHeight: 32
        });

        this.load.json('roadMaze', '../road_maze.json');

        this.load.image('meat', 'meat.png');
        this.load.image('rotten_meat', 'rotten_meat.png');
        this.load.spritesheet('cat', 'cat.png', {
            frameWidth: 32,
            frameHeight: 32,
            margin: 0,
            spacing: 0
        });

        this.load.audio('dog_theme', 'audio/dog_theme.mp3');
        this.load.audio('chomp_theme', 'audio/chomp.mp3');
        this.load.audio('yip', 'audio/yip.mp3');
        this.load.audio('snore', 'audio/snore.mp3');
    }

    create ()
    {
        this.resetGameState();

        // load audio and play background music
        this.bgMusic = this.sound.add('dog_theme', {
            volume: 0.5,
            loop: true
        });

        this.bgMusic.play();
        this.events.once('shutdown', () => {
            this.bgMusic.stop();
            this.bgMusic.destroy();
        });

        this.chompSFX = this.sound.add('chomp_theme', {
            volume: 5,
            loop: false
        });

        this.yipSFX = this.sound.add('yip', {
            volume: 1,
            loop: false
        });

        this.snoreSFX = this.sound.add('snore', {
            volume: 3,
            loop: false
        });

        // ds overlay positioning
        const screenW = this.cameras.main.width;
        const screenH = this.cameras.main.height;
        const cx = this.cameras.main.centerX;
        const cy = this.cameras.main.centerY;

        const source = this.textures.get('overlay').getSourceImage();
        const aspectRatio = source.height / source.width;
        const bgHeight = screenW * aspectRatio;

        const dsOverlay = this.add.image(cx, screenH - (bgHeight / 2), 'overlay');
        dsOverlay.setDisplaySize(screenW, bgHeight);
        dsOverlay.setDepth(0);

        this.cameras.main.setScroll(0, 0);

        // actual game container positioning
        const gameW = 1024;
        const gameH = 768;

        const usableHeight = screenH * 0.74;
        const gameScale = Math.min(screenW / gameW, usableHeight / gameH);

        const containerX = cx;
        const containerY = screenH - (gameH * gameScale / 2) - (screenH * 0.09);

        // container field background
        const gameContainer = this.add.container(containerX, containerY);
        gameContainer.setScale(gameScale);
        gameContainer.setDepth(1);
        this.gameContainer = gameContainer;

        const tilesW = gameW - 120;
        this.gameFieldWidth = tilesW;
        const tilesH = gameH - 100;
        const fieldTiles = this.add.tileSprite(0, 0, tilesW, tilesH, 'field');

        fieldTiles.setTileScale(0.75, 0.75); 

        gameContainer.add(fieldTiles);

        this.timer = this.add.text(containerX - 290, -containerY + 150, `${this.timerVal}`, {
            fontFamily: 'PixelFont',
            fontSize: '52px',
            color: '#ffffff',
            padding: { x: 12, y: 8 }
        });
        this.timer.setOrigin(1, 0.5);

        // Get the exported road data
        const mapData = this.cache.json.get('roadMaze');

        if (!mapData || !mapData.roads) {
            console.error('Road maze data could not be loaded.');
            return;
        }

        // Scale the roads to fit within the existing game container
        const shrink = 0.88;

        const fitScale = Math.min(
            gameW / mapData.width,
            gameH / mapData.height
        );

        const roadScale = fitScale * shrink;

        // Centre the roads within the existing container
        const offsetX = -mapData.width * roadScale / 2;
        const offsetY = -mapData.height * roadScale / 2;

        // Draw roads inside the game container
        const graphics = this.add.graphics();

        graphics.lineStyle(10, 0xB69F66, 1);

        for (const road of mapData.roads) {
            if (road.length < 2) {
                continue;
            }

            graphics.beginPath();

            graphics.moveTo(
                offsetX + road[0][0] * roadScale,
                offsetY + road[0][1] * roadScale
            );

            for (let i = 1; i < road.length; i++) {
                graphics.lineTo(
                    offsetX + road[i][0] * roadScale,
                    offsetY + road[i][1] * roadScale
                );
            }

            graphics.strokePath();
        }

        // add road to container with visual effects
        graphics.enableFilters();

        graphics.filters.internal.addPixelate(1);

        Actions.AddEffectBloom(graphics, {
            threshold: 0.3,
            blurRadius: 2,
            blurSteps: 2,
            blendAmount: 1,
            useInternal: true
        });
        
        gameContainer.add(graphics);

        // populate road segments list with container-scaled lines
        for (const road of mapData.roads) {
            if (road.length < 2) {
                continue;
            }

            graphics.beginPath();
            graphics.moveTo(
                offsetX + road[0][0] * roadScale,
                offsetY + road[0][1] * roadScale
            );

            for (let i = 1; i < road.length; i++) {
                const x1 = offsetX + road[i-1][0] * roadScale;
                const y1 = offsetY + road[i-1][1] * roadScale;
                const x2 = offsetX + road[i][0] * roadScale;
                const y2 = offsetY + road[i][1] * roadScale;

                this.roadSegments.push({ x1, y1, x2, y2 });

                graphics.lineTo(x2, y2);
            }
            graphics.strokePath();
        }

        // calculate center of the road network and spawn the puppy there
        let spawnX = 0;
        let spawnY = 0;

        if (this.roadSegments.length > 0) {
            // calculate geometric midpoint of all road coordinates
            let sumX = 0;
            let sumY = 0;
            this.roadSegments.forEach(seg => {
                sumX += (seg.x1 + seg.x2) / 2;
                sumY += (seg.y1 + seg.y2) / 2;
            });
            const mazeCenterX = sumX / this.roadSegments.length;
            const mazeCenterY = sumY / this.roadSegments.length;

            // find the road point that sits closest to absolute center
            let minCenterDistance = Infinity;
            for (const seg of this.roadSegments) {
                const pt = this.getClosestPointOnSegment(mazeCenterX, mazeCenterY, seg.x1, seg.y1, seg.x2, seg.y2);
                if (pt.distance < minCenterDistance) {
                    minCenterDistance = pt.distance;
                    spawnX = pt.x;
                    spawnY = pt.y;
                }
            }
        }

        //add text here so it shows on top of roads
        gameContainer.add(this.timer);
        
        this.puppy = this.add.sprite(spawnX, spawnY, 'dog', 16);
        this.puppy.setScale(2);
        this.puppy.setOrigin(0.5, 0.8); 
        this.buildConnectedRoadComponent(spawnX, spawnY);

        gameContainer.add(this.puppy);
        this.reachableRoadSegments = this.getReachableRoadSegments(spawnX, spawnY);

        // puppy walking logic
        this.anims.create({
            key: 'walk-down',
            frames: this.anims.generateFrameNumbers('dog', { start: 32, end: 34 }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'walk-left',
            frames: this.anims.generateFrameNumbers('dog', { start: 48, end: 50 }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'walk-right',
            frames: this.anims.generateFrameNumbers('dog', { start: 0, end: 2 }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'walk-up',
            frames: this.anims.generateFrameNumbers('dog', { start: 16, end: 18 }),
            frameRate: 10,
            repeat: -1
        });

        const birdPosition = this.getRandomOffRoadPosition(tilesW, tilesH);

        if (birdPosition) {
            this.bird = this.add.sprite(birdPosition.x, birdPosition.y, 'bird', 0);
            this.bird.setScale(1.2);
            this.bird.setOrigin(1, 0.8);
            gameContainer.add(this.bird);

            this.anims.create({
                key: 'sitting',
                frames: this.anims.generateFrameNumbers('bird', { start: 0, end: 3 }),
                frameRate: 5,
                repeat: -1
            });

            this.bird.play('sitting');
        } else {
            console.warn('Could not find an off-road location for the bird.');
        }
        

        this.meat = this.add.sprite(spawnX, spawnY, 'meat');
        this.meat.setScale(0.08);
        gameContainer.add(this.meat);

        this.rottenMeat = this.add.sprite(spawnX, spawnY, 'rotten_meat');
        this.rottenMeat.setScale(0.08);
        this.rottenMeat.setVisible(false);
        gameContainer.add(this.rottenMeat);

        this.cat = this.add.sprite(-200, -200, 'cat', 0);
        this.cat.setScale(2);
        this.cat.setVisible(false);
        this.cat.setDepth(5);
        gameContainer.add(this.cat);

        this.anims.create({
            key: 'cat-run-right',
            frames: this.anims.generateFrameNumbers('cat', { start: 13, end: 15 }),
            frameRate: 8,
            repeat: -1
        });

        this.anims.create({
            key: 'cat-run-left',
            frames: this.anims.generateFrameNumbers('cat', { start: 24, end: 26 }),
            frameRate: 8,
            repeat: -1
        });

        this.cat.play('cat-run-right');
        
        this.spawnMeat();

        // set up keyboard arrow keys
        this.cursors = this.input.keyboard.createCursorKeys();

        this.wasdKeys = this.input.keyboard.addKeys({
            up: 'W',
            left: 'A',
            down: 'S',
            right: 'D'
        });

        this.createDPadOverlay();
    }

    createDPadOverlay ()
    {
        const baseX = this.cameras.main.width * 0.11;
        const baseY = this.cameras.main.height * 0.45;

        const buttonSize = 45;
        const buttonSpacing = 60;
        const defaultColour = 0x2f3135;

        const directions = ['up', 'left', 'down', 'right'];

        directions.forEach((direction) => {
            const offset = {
                up: { x: 0, y: -buttonSpacing },
                left: { x: -buttonSpacing, y: 0 },
                down: { x: 0, y: buttonSpacing },
                right: { x: buttonSpacing, y: 0 }
            }[direction];

            const button = this.add.rectangle(
                baseX + offset.x,
                baseY + offset.y,
                buttonSize,
                buttonSize,
                defaultColour,
                0.9
            );

            button.setStrokeStyle(3, 0x0d0f12, 1);
            button.setDepth(10);
            button.setScrollFactor(0);
            button.setInteractive({ useHandCursor: true });

            const setPressedState = (pressed) => {
                this.dpadPointerState[direction] = pressed;
                this.updateDPadVisualState();
            };

            button.on('pointerdown', () => setPressedState(true));
            button.on('pointerup', () => setPressedState(false));
            button.on('pointerout', () => setPressedState(false));
            button.on('pointerupoutside', () => setPressedState(false));

            this.dpadPositions[direction] = {
                x: baseX + offset.x,
                y: baseY + offset.y
            };

            this.dpadButtons[direction] = button;
        });

        this.updateDPadVisualState();
    }

    getDPadState ()
    {
        if (!this.wasdKeys || !this.cursors) {
            return {
                up: false,
                left: false,
                down: false,
                right: false
            };
        }

        return {
            up: this.cursors.up.isDown || this.wasdKeys.up.isDown || this.dpadPointerState.up,
            left: this.cursors.left.isDown || this.wasdKeys.left.isDown || this.dpadPointerState.left,
            down: this.cursors.down.isDown || this.wasdKeys.down.isDown || this.dpadPointerState.down,
            right: this.cursors.right.isDown || this.wasdKeys.right.isDown || this.dpadPointerState.right,
        };
    }

    updateDPadVisualState ()
    {
        const state = this.getDPadState();

        for (const direction of Object.keys(this.dpadButtons)) {
            const button = this.dpadButtons[direction];
            const active = state[direction];

            button.setFillStyle(active ? 0x4a4e55 : 0x2d3035);
            button.setStrokeStyle(3, active ? 0xb9c0c8 : 0x090a0d, 1);
            button.setPosition(
                this.dpadPositions[direction].x,
                this.dpadPositions[direction].y + (active ? 4 : 0)
            );
        }

        
    }

    update (time, delta)
    {
        if (this.timerFlashUntil && time > this.timerFlashUntil) {
            this.timerFlashUntil = 0;
            this.timerFlashSuffix = '';
            this.timer.setText(`${this.timerVal}`);
        } else if (this.timerFlashUntil) {
            this.timer.setText(`${this.timerVal}${this.timerFlashSuffix}`);
        }

        let moveX = 0;
        let moveY = 0;
        let currentAnim = null;

        if (this.cat && this.cat.visible) {
            const dx = this.meat.x - this.cat.x;
            const dy = this.meat.y - this.cat.y;
            const distance = Math.hypot(dx, dy);
            const step = Math.min(this.catSpeed * (delta / 1000), distance);

            if (distance > 0) {
                this.cat.x += (dx / distance) * step;
                this.cat.y = this.meat.y;
            }

            const animKey = this.catRunDirection === 'right' ? 'cat-run-right' : 'cat-run-left';
            if (this.cat.anims.currentAnim?.key !== animKey) {
                this.cat.play(animKey, true);
            }

            if (distance <= 10) {
                this.cat.setVisible(false);
                this.cat.x = this.meat.x;
                this.cat.y = this.meat.y;
            }
        }

        if (this.timerVal > 0) {
            this.gameOverBirdLaunched = false;
            this.timerPassed += delta;

            if (this.timerPassed >= 1000) {
                const passedSeconds = Math.floor(this.timerPassed / 1000);
                this.timerVal = Math.max(0, this.timerVal - passedSeconds);
                this.timerPassed %= 1000;
                this.timer.setText(`${this.timerVal}`);
            }

            if (this.bird && this.birdfly) {
                this.bird.setPosition(this.birdfly.x, this.birdfly.y);
            }
            this.bird?.setVisible(true);
            this.birdfly?.setVisible(false);
        }

        if (this.timerVal === 0 && !this.gameOverBirdLaunched && this.bird && this.gameContainer) {
            const { x, y } = this.bird;
            this.bird.setVisible(false);

            if (!this.birdfly) {
                this.birdfly = this.add.sprite(x, y, 'birdfly', 0);
                this.birdfly.setScale(1.2);
                this.birdfly.setOrigin(1, 0.8);
                this.gameContainer.add(this.birdfly);

                this.anims.create({
                    key: 'flying',
                    frames: this.anims.generateFrameNumbers('birdfly', { start: 0, end: 6 }),
                    frameRate: 5,
                    repeat: -1
                });

                this.anims.create({
                    key: 'flyingLeft',
                    frames: this.anims.generateFrameNumbers('birdflyleft', { start: 0, end: 6 }),
                    frameRate: 5,
                    repeat: -1

                });


            }

    

            this.birdfly.setVisible(true);
            this.gameOverBirdLaunched = true;

        }

    
        if (this.timerVal === 0 && this.birdfly?.visible && this.puppy && !this.dogCaught) {

            
            const targetX = this.puppy.x + 25;
            const targetY = this.puppy.y - 20;
            const dx = targetX - this.birdfly.x;
            const dy = targetY - this.birdfly.y;
            const distance = Math.hypot(dx, dy);
            const step = Math.min(110 * delta / 1000, distance);

            if (dx < 0) {
                this.birdfly.play('flyingLeft', true);
            } else {
                this.birdfly.play('flying', true);
            }

            if (distance > 0) {
                this.birdfly.x += (dx / distance) * step;
                this.birdfly.y += (dy / distance) * step;
            }


        }

        if (!this.dogCaught && this.gameOverBirdLaunched && this.birdfly?.visible && this.puppy) {
            const birdDistance = Math.hypot(
                this.puppy.x - this.birdfly.x,
                this.puppy.y - this.birdfly.y
            );

            if (birdDistance < 25) {
                this.dogCaught = true;
                this.birdEscapeDirection = this.birdfly.x < 0 ? -1 : 1;
                const halfFieldWidth = this.gameFieldWidth / 2;
                this.birdEscapeTargetX = this.birdEscapeDirection * (halfFieldWidth + 100);
                this.puppy.anims.stop();
                this.puppy.setFrame(this.lastHorizontalDir === 'left' ? 51 : 3);
            }
        }

        if (this.dogCaught && this.birdfly?.visible && this.puppy) {
            const step = 100 * delta / 1000;
            const remainingDistance = Math.abs(this.birdEscapeTargetX - this.birdfly.x);
            const movement = Math.min(step, remainingDistance);

            this.birdfly.x += this.birdEscapeDirection * movement;
            this.birdfly.play(this.birdEscapeDirection < 0 ? 'flyingLeft' : 'flying', true);
            this.puppy.setPosition(
                this.birdfly.x - this.birdEscapeDirection * 30,
                this.birdfly.y + 20
            );
        }

        if (
            this.dogCaught &&
            this.birdfly?.visible &&
            !this.isTransitioning &&
            Math.abs(this.birdEscapeTargetX - this.birdfly.x) < 1
        ) {
            this.isTransitioning = true;
            this.input.keyboard.clearCaptures();
            this.input.keyboard.removeAllListeners();
            this.scene.start('GameOverScene');
        }

        const isCurrentlyLayingDown = (this.lastMovedTime !== 0 && (time - this.lastMovedTime > 5000));

        if (time >= this.nextYipTime && !isCurrentlyLayingDown) {
            if (Math.random() < 0.001) {
                this.yipSFX.play();
                this.nextYipTime = time + 2000; 
            }
        }

        this.updateDPadVisualState();

        if (!this.cursors || !this.puppy) return;
        if (this.dogCaught) return;

        const dpadState = this.getDPadState();

        // check inputs and assign the correct animation string
         if (this.cursors.left.isDown || this.wasdKeys.left.isDown || dpadState.left) {
            moveX = -1;
            currentAnim = 'walk-left';
            this.lastHorizontalDir = 'left';
        } else if (this.cursors.right.isDown || this.wasdKeys.right.isDown || dpadState.right) {
            moveX = 1;
            currentAnim = 'walk-right';
            this.lastHorizontalDir = 'right';
        }

        if (this.cursors.up.isDown || this.wasdKeys.up.isDown || dpadState.up) {
            moveY = -1;
            currentAnim = 'walk-up';
        } else if (this.cursors.down.isDown || this.wasdKeys.down.isDown || dpadState.down) {
            moveY = 1;
            currentAnim = 'walk-down';
        }

        

        // execute movement and animations
        if (moveX !== 0 || moveY !== 0) 
        {
            this.lastMovedTime = time;
            this.nextSnoreTime = 0;

            // normalise speed if moving diagonally
            let speed = this.moveSpeed;
            if (moveX !== 0 && moveY !== 0) {
                speed = this.moveSpeed * 0.7071;
            }

            // calculate where the player intends to step and find the closest point on the road network
            const targetX = this.puppy.x + moveX * speed;
            const targetY = this.puppy.y + moveY * speed;

            let closestPoint = null;
            let minDistance = Infinity;
            const walkableSegments = this.getWalkableRoadSegments();

            for (const seg of this.roadSegments) {
                const pt = this.getClosestPointOnSegment(targetX, targetY, seg.x1, seg.y1, seg.x2, seg.y2);
                if (pt.distance < minDistance) {
                    minDistance = pt.distance;
                    closestPoint = pt;
                }
            }

            // allowed variance thickness
            if (closestPoint && minDistance <= this.roadWidthThreshold) {
                this.puppy.x = closestPoint.x;
                this.puppy.y = closestPoint.y;

                if (currentAnim && this.anims.exists(currentAnim)) {
                    this.puppy.play(currentAnim, true);
                    this.lastAnim = currentAnim;
                }
            }

        }
        else 
        {
            // lay down if idle for 5+ seconds
            if (this.lastMovedTime === 0) {
                this.lastMovedTime = time;
            }

            if (time - this.lastMovedTime > 5000) {
                this.puppy.anims.stop();

                if (this.lastHorizontalDir === 'left') 
                {
                    this.puppy.setFrame(51);
                } 
                else 
                {
                    this.puppy.setFrame(3);
                }

                // snore
                if (this.nextSnoreTime === 0) {
                    this.nextSnoreTime = time + 5000;
                }

                if (time >= this.nextSnoreTime) {
                    if (this.snoreSFX) {
                        this.snoreSFX.play();
                    }
                    this.nextSnoreTime = time + 5000;
                }
            } else {
                // handle idle state based on the last direction walked
                this.puppy.stop();
                
                if (this.puppy.anims.currentAnim) {
                    const currentFrames = this.puppy.anims.currentAnim.frames;
                    if (currentFrames && currentFrames.length > 0) {
                        this.puppy.setFrame(currentFrames[0].frame.name);
                    }
                }

                this.nextSnoreTime = 0;
            }
        }

        //Control spawning of meat when dog "Collects"
        const meatDistance = Math.hypot(this.puppy.x-this.meat.x,
            this.puppy.y - this.meat.y
        );
        const rottenMeatDistance = this.rottenMeat.visible
            ? Math.hypot(this.puppy.x - this.rottenMeat.x, this.puppy.y - this.rottenMeat.y)
            : Infinity;

        if (meatDistance < 20 || rottenMeatDistance < 20) {
            const collectedRottenMeat = rottenMeatDistance < meatDistance;
            this.chompSFX.play();

            if (!collectedRottenMeat) {
                this.meatCollectedCount += 1;
            }

            this.timerVal = collectedRottenMeat
                ? Math.max(0, this.timerVal - 5)
                : this.timerVal + 5;
            this.timerFlashUntil = time + 500;
            this.timerFlashSuffix = collectedRottenMeat ? '-' : '+';
            this.timer.setText(`${this.timerVal}${this.timerFlashSuffix}`);
            this.spawnMeat();
        }
    }

    // projection helper to map player point onto vector line segment
    getClosestPointOnSegment(x, y, x1, y1, x2, y2) {
        const A = x - x1;
        const B = y - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;
        
        if (lenSq !== 0) param = dot / lenSq;

        let xx, yy;

        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
                 yy = y1 + param * D;
        }

        const dx = x - xx;
        const dy = y - yy;
        
        return {
            x: xx,
            y: yy,
            distance: Math.sqrt(dx * dx + dy * dy)
        };
    }

    getNearestRoadDistance(x, y, segments = this.getWalkableRoadSegments()) {
        let nearestDistance = Infinity;

        for (const seg of segments) {
            const closest = this.getClosestPointOnSegment(x, y, seg.x1, seg.y1, seg.x2, seg.y2);
            nearestDistance = Math.min(nearestDistance, closest.distance);
        }

        return nearestDistance;
    }

    getWalkableRoadSegments() {
        if (this.connectedRoadSegments.length > 0) {
            return this.connectedRoadSegments;
        }

        return this.roadSegments;
    }

    buildConnectedRoadComponent(startX, startY) {
        if (this.roadSegments.length === 0) {
            this.connectedRoadSegments = [];
            this.connectedRoadSet = new Set();
            return;
        }

        const segmentGraph = new Map();
        const pointKey = (x, y) => `${Math.round(x * 10) / 10},${Math.round(y * 10) / 10}`;

        for (let i = 0; i < this.roadSegments.length; i++) {
            segmentGraph.set(i, new Set());
        }

        for (let i = 0; i < this.roadSegments.length; i++) {
            const segA = this.roadSegments[i];
            const aKey = pointKey(segA.x1, segA.y1);
            const bKey = pointKey(segA.x2, segA.y2);

            for (let j = i + 1; j < this.roadSegments.length; j++) {
                const segB = this.roadSegments[j];
                const a2Key = pointKey(segB.x1, segB.y1);
                const b2Key = pointKey(segB.x2, segB.y2);

                if (aKey === a2Key || aKey === b2Key || bKey === a2Key || bKey === b2Key) {
                    segmentGraph.get(i).add(j);
                    segmentGraph.get(j).add(i);
                }
            }
        }

        let startIndex = 0;
        let minDistance = Infinity;

        for (let i = 0; i < this.roadSegments.length; i++) {
            const seg = this.roadSegments[i];
            const closest = this.getClosestPointOnSegment(startX, startY, seg.x1, seg.y1, seg.x2, seg.y2);
            if (closest.distance < minDistance) {
                minDistance = closest.distance;
                startIndex = i;
            }
        }

        const queue = [startIndex];
        const visited = new Set([startIndex]);
        const connected = [];

        while (queue.length > 0) {
            const index = queue.shift();
            connected.push(this.roadSegments[index]);

            for (const nextIndex of segmentGraph.get(index) || []) {
                if (!visited.has(nextIndex)) {
                    visited.add(nextIndex);
                    queue.push(nextIndex);
                }
            }
        }

        this.connectedRoadSegments = connected;
        this.connectedRoadSet = new Set(connected);
    }

    getReachableRoadSegments(startX, startY) {
        if (this.roadSegments.length === 0) {
            return [];
        }

        let startSegment = this.roadSegments[0];
        let minDistance = Infinity;

        for (const segment of this.roadSegments) {
            const point = this.getClosestPointOnSegment(
                startX,
                startY,
                segment.x1,
                segment.y1,
                segment.x2,
                segment.y2
            );

            if (point.distance < minDistance) {
                minDistance = point.distance;
                startSegment = segment;
            }
        }

        const thresholdSquared = this.roadWidthThreshold ** 2;
        const reachable = new Set([startSegment]);
        const queue = [startSegment];

        while (queue.length > 0) {
            const current = queue.pop();

            for (const candidate of this.roadSegments) {
                if (reachable.has(candidate)) {
                    continue;
                }

                const endpoints = [
                    [current.x1, current.y1],
                    [current.x2, current.y2]
                ];
                const candidateEndpoints = [
                    [candidate.x1, candidate.y1],
                    [candidate.x2, candidate.y2]
                ];
                const connected = endpoints.some(([x, y]) => {
                    const distanceToCandidate = this.getClosestPointOnSegment(
                        x,
                        y,
                        candidate.x1,
                        candidate.y1,
                        candidate.x2,
                        candidate.y2
                    ).distance;

                    return distanceToCandidate ** 2 <= thresholdSquared;
                }) || candidateEndpoints.some(([x, y]) => {
                    const distanceToCurrent = this.getClosestPointOnSegment(
                        x,
                        y,
                        current.x1,
                        current.y1,
                        current.x2,
                        current.y2
                    ).distance;

                    return distanceToCurrent ** 2 <= thresholdSquared;
                });

                if (connected) {
                    reachable.add(candidate);
                    queue.push(candidate);
                }
            }
        }

        return [...reachable];
    }

    getRandomOffRoadPosition(fieldWidth, fieldHeight) {
        const padding = 40;
        const safeDistance = this.roadWidthThreshold + padding;
        const minX = -fieldWidth / 2 + padding;
        const maxX = fieldWidth / 2 - padding;
        const minY = -fieldHeight / 2 + padding;
        const maxY = fieldHeight / 2 - padding;

        for (let attempt = 0; attempt < 500; attempt++) {
            const x = Math.floor(Math.random() * (maxX - minX + 1)) + minX;
            const y = Math.floor(Math.random() * (maxY - minY + 1)) + minY;
            const isOffRoad = this.roadSegments.every((segment) => {
                const point = this.getClosestPointOnSegment(
                    x,
                    y,
                    segment.x1,
                    segment.y1,
                    segment.x2,
                    segment.y2
                );

                return point.distance > safeDistance;
            });

            if (isOffRoad) {
                return { x, y };
            }
        }

        return null;
    }

    triggerCatRun() {
        if (!this.cat || !this.meat || this.meatCollectedCount < 3 || !this.gameContainer) {
            return;
        }

        if (Math.random() >= 0.9) {
            return;
        }

        const leftBound = -460;
        const rightBound = 460;
        const nearestSide = Math.abs(this.meat.x - leftBound) <= Math.abs(this.meat.x - rightBound) ? 'left' : 'right';
        const runFrom = nearestSide === 'left' ? 'right' : 'left';
        const spawnOffset = 200;

        this.catRunDirection = runFrom;
        const startX = runFrom === 'right' ? this.meat.x + spawnOffset : this.meat.x - spawnOffset;
        const startY = this.meat.y;

        this.cat.setPosition(startX, startY);
        this.cat.setVisible(true);
        this.cat.setScale(2);
        this.cat.play(runFrom === 'right' ? 'cat-run-right' : 'cat-run-left', true);
    }

    spawnMeat() {
        if (this.roadSegments.length === 0 || !this.meat || !this.rottenMeat) return;

        const walkableSegments = this.getWalkableRoadSegments();
        const rottenMeatSpawns = this.meatHasSpawned && Math.random() < 0.2;
        this.meatHasSpawned = true;

        const roadSamples = [];
        for (const segment of walkableSegments) {
            for (let i = 1; i <= 8; i++) {
                const t = i / 9;
                const x = segment.x1 + t * (segment.x2 - segment.x1);
                const y = segment.y1 + t * (segment.y2 - segment.y1);

                const nearestRoadDistance = this.getNearestRoadDistance(x, y, walkableSegments);
                const distanceFromDog = this.puppy ? Math.hypot(this.puppy.x - x, this.puppy.y - y) : Infinity;

                if (nearestRoadDistance <= 18 && distanceFromDog >= 80) {
                    roadSamples.push({ x, y });
                }
            }
        }

        const pickRoadSample = () => {
            if (roadSamples.length === 0) {
                const fallback = walkableSegments[Math.floor(Math.random() * walkableSegments.length)];
                const t = Math.random();
                return {
                    x: fallback.x1 + t * (fallback.x2 - fallback.x1),
                    y: fallback.y1 + t * (fallback.y2 - fallback.y1)
                };
            }

            return roadSamples[Math.floor(Math.random() * roadSamples.length)];
        };

        const meatPosition = pickRoadSample();
        this.meat.setPosition(meatPosition.x, meatPosition.y);
        this.cat?.setVisible(false);

        this.rottenMeat.setVisible(rottenMeatSpawns);
        if (rottenMeatSpawns) {
            const rottenPosition = pickRoadSample();
            this.rottenMeat.setPosition(rottenPosition.x, rottenPosition.y);
        }

        this.triggerCatRun();
    }
}
