import { Scene, Actions } from 'phaser';
import { DS_BOTTOM_SCREEN, DESIGN_WIDTH } from '../layout';
import { CITIES } from '../cities';

export class Game extends Scene
{
    cursors;
    puppy;
    bird;
    dogCaught = false;
    birdEscapeDirection = 0;
    birdEscapeTargetX = 0;
    birdPuppyFollowOffset = 30;
    birdEscapePauseElapsed = 0;

    moveSpeed = 3;
    lastAnim = 'walk-up';
    lastHorizontalDir = 'right'; 
    lastMovedTime = 0;
    nextYipTime = 0;
    nextSnoreTime = 0;
    meatHasSpawned = false;
    isTransitioning = false;
    bones = [];

    score = 0;
    meatHasSpawned = false;
    meatCollectedCount = 0;
    postman;
    postmanCrossingStarted = false;
    postmanFollowTriggered = false;
    postmanFollowDistance = 0;
    postmanFollowMaxDistance = 400;
    postmanFollowDelayUntil = 0;
    postmanFollowChaseUntil = 0;
    postmanFollowLastPosition = null;
    postmanLastDetectionPosition = null;
    postmanFollowTarget = null;
    postmanFollowRoute = [];
    postmanFollowRouteIndex = 0;
    postmanTripTriggered = false;
    postmanOverlapBufferUntil = 0;
    postmanYipNextTime = 0;
    postmanRedFlash = null;
    postmanSFX = null;
    postmanRoadOffsetY = -8;
    postmanDirectionX = 1;
    postmanDirectionY = 0;
    cat;
    catSpeed = 145;
    catRunDirection = 'right';
    catCarrying = false;
    catHasMeat = false;
    catTarget = null;
    catStationaryTime = 0;
  
    timerVal = 30;
    timerPassed = 0;
    timer;
    scoreText;
    timerFlashUntil = 0;
    timerFlashSuffix = '';
    gameContainer;
    pauseScreenFilter;
    pauseIcon;
    gameOverBirdLaunched = false;
    isGamePaused = false;
  
    roadSegments = [];
    connectedRoadSegments = [];
    connectedRoadSet = new Set();
    reachableRoadSegments = [];
    roadWidthThreshold = 16;

    bgMusic;

    dsOverlay;
    dpadScale = 1;
    dpadButtons = {};
    dpadPositions = {};
    letterButtonOverlays = {};
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
        this.birdPuppyFollowOffset = 30;
        this.birdEscapePauseElapsed = 0;
        this.moveSpeed = 3;
        this.lastAnim = 'walk-up';
        this.lastHorizontalDir = 'right';
        this.lastMovedTime = 0;
        this.nextYipTime = 0;
        this.nextSnoreTime = 0;
        this.meatHasSpawned = false;
        this.isTransitioning = false;
        this.bones = [];
        this.score = 0;
        this.meatCollectedCount = 0;
        this.postman = null;
        this.postmanCrossingStarted = false;
        this.postmanFollowTriggered = false;
        this.postmanFollowDistance = 0;
        this.postmanFollowMaxDistance = 400;
        this.postmanFollowDelayUntil = 0;
        this.postmanFollowChaseUntil = 0;
        this.postmanFollowLastPosition = null;
        this.postmanLastDetectionPosition = null;
        this.postmanFollowTarget = null;
        this.postmanFollowRoute = [];
        this.postmanFollowRouteIndex = 0;
        this.postmanTripTriggered = false;
        this.postmanOverlapBufferUntil = 0;
        this.postmanYipNextTime = 0;
        this.postmanRedFlash = null;
        this.postmanSFX = null;
        this.postmanRoadOffsetY = -8;
        this.postmanDirectionX = 1;
        this.postmanDirectionY = 0;
        this.cat = null;
        this.catRunDirection = 'right';
        this.catCarrying = false;
        this.catHasMeat = false;
        this.catTarget = null;
        this.catStationaryTime = 0;
        this.timerVal = 30;
        this.timerPassed = 0;
        this.timerFlashUntil = 0;
        this.timerFlashSuffix = '';
        this.gameOverBirdLaunched = false;
        this.isGamePaused = false;
        this.roadSegments = [];
        this.connectedRoadSegments = [];
        this.connectedRoadSet = new Set();
        this.reachableRoadSegments = [];
        this.gameContainer = null;
        this.pauseScreenFilter = null;
        this.pauseIcon = null;
        this.dsOverlay = null;
        this.dpadScale = 1;
        this.dpadButtons = {};
        this.dpadPositions = {};
        this.letterButtonOverlays = {};
        this.dpadPointerState = {
            up: false,
            left: false,
            down: false,
            right: false
        };
    }

    preload ()
    {
        const cacheBust = `?cacheBust=${Date.now()}`;
        this.load.setPath('assets');
        
        this.load.image('overlay', 'ds_bottom.jpeg');
        this.load.image('field', 'red_flower.jpg')
        this.load.image('postman', 'postman.png');


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

        this.load.json('roadMaze', `../road_maze.json${cacheBust}`);
        if (import.meta.env.VITE_GITHUB_PAGES === 'true') {
            for (const city of CITIES) {
                this.load.json(`cityMap-${city.value}`, `../saved_locations/${city.value}.json${cacheBust}`);
            }
        }

        this.load.image('meat', 'meat.png');
        this.load.image('rotten_meat', 'rotten_meat.png');
        this.load.image('bone', 'bone.png');

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
        this.load.audio('hawk', 'audio/hawk.mp3');
        this.load.audio('meow', 'audio/meow.mp3');
        this.load.audio('purr', 'audio/purr.mp3');
        this.load.audio('postman', 'audio/postman.mp3');
    }

    create (data = {})
    {
        this.resetGameState();

        // load audio and play background music
        this.bgMusic = this.sound.add('dog_theme', {
            volume: 0.5,
            loop: true
        });

        this.bgMusic.play();
        this.postmanSFX = this.sound.add('postman', {
            volume: 5,
            loop: true
        });
        this.events.once('shutdown', () => {
            this.bgMusic.stop();
            this.bgMusic.destroy();
            this.purrSFX?.stop();
            this.postmanSFX?.stop();
            this.postmanSFX?.destroy();
        });

        this.chompSFX = this.sound.add('chomp_theme', {
            volume: 5,
            loop: false
        });

        this.hawkSFX = this.sound.add('hawk', {
            volume: 1,
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

        this.meowSFX = this.sound.add('meow', {
            volume: 0.2,
            loop: false
        });
        this.purrSFX = this.sound.add('purr', {
            volume: 1.3,
            loop: true
        });

        // ds overlay positioning
        const cx = DESIGN_WIDTH / 2;

        const dsOverlay = this.add.image(cx, 0, 'overlay').setOrigin(0.5, 0);
        dsOverlay.setDepth(0);
        this.dsOverlay = dsOverlay;

        this.cameras.main.setScroll(0, 0);

        // actual game container positioning
        const gameW = 1024;
        const gameH = 768;

        this.postmanRedFlash = this.add.rectangle(
            DS_BOTTOM_SCREEN.x + DS_BOTTOM_SCREEN.width / 2,
            DS_BOTTOM_SCREEN.y + DS_BOTTOM_SCREEN.height / 2,
            DS_BOTTOM_SCREEN.width,
            DS_BOTTOM_SCREEN.height,
            0xff3d3d,
            0
        );
        this.postmanRedFlash.setOrigin(0.5);
        this.postmanRedFlash.setDepth(8);
        this.postmanRedFlash.setVisible(true);

        const gameScale = Math.min(
            DS_BOTTOM_SCREEN.width / gameW,
            DS_BOTTOM_SCREEN.height / gameH
        );

        const containerX = DS_BOTTOM_SCREEN.x + DS_BOTTOM_SCREEN.width / 2;
        const containerY = DS_BOTTOM_SCREEN.y + DS_BOTTOM_SCREEN.height / 2;

        // container field background
        const gameContainer = this.add.container(containerX, containerY);
        gameContainer.setScale(gameScale);
        gameContainer.setDepth(1);
        this.gameContainer = gameContainer;
        this.pauseScreenFilter = this.add.rectangle(
            containerX,
            containerY,
            DS_BOTTOM_SCREEN.width,
            DS_BOTTOM_SCREEN.height,
            0xffffff,
            0.35
        ).setDepth(5).setVisible(false);
        this.pauseIcon = this.add.graphics({ x: containerX, y: containerY })
            .setDepth(6)
            .setVisible(false);
        const drawPauseBar = (x) => {
            this.pauseIcon.fillStyle(0x35633a, 0.9);
            this.pauseIcon.fillRect(x - 4, -14, 8, 3);
            this.pauseIcon.fillRect(x - 6, -11, 12, 22);
            this.pauseIcon.fillRect(x - 4, 11, 8, 3);

            this.pauseIcon.fillStyle(0x9acb7d, 0.9);
            this.pauseIcon.fillRect(x - 2, -11, 4, 22);
        };

        drawPauseBar(-7);
        drawPauseBar(7);

        const tilesW = gameW;
        this.gameFieldWidth = tilesW;
        const tilesH = gameH;
        const fieldTiles = this.add.tileSprite(0, 0, tilesW, tilesH, 'field');

        fieldTiles.setTileScale(0.75, 0.75); 

        gameContainer.add(fieldTiles);

        this.timer = this.add.text(gameW / 2 - 24, -gameH / 2 + 42, `${this.timerVal}`, {
            fontFamily: 'PixelFont',
            fontSize: '52px',
            color: '#ffffff',
            padding: { x: 12, y: 8 }
        });
        this.timer.setOrigin(1, 0.5);

        this.scoreText = this.add.text(this.timer.x, this.timer.y + 52, `Score: ${this.score}`, {
            fontFamily: 'PixelFont',
            fontSize: '26px',
            color: '#ffffff',
            padding: { x: 12, y: 8 }
        });
        this.scoreText.setOrigin(1, 0.5);

        // Get the exported road data
        const mapKey = data.city ? `cityMap-${data.city}` : 'roadMaze';
        const mapData = data.generatedMap || this.cache.json.get(mapKey);

        if (!mapData || !mapData.roads) {
            console.error(`Map data could not be loaded for "${data.city ?? 'postcode'}".`);
            return;
        }

        const fitScale = Math.min(
            gameW / mapData.width,
            gameH / mapData.height
        );

        const roadScale = fitScale;

        // Centre the roads within the existing container
        const offsetX = -mapData.width * roadScale / 2;
        const offsetY = -mapData.height * roadScale / 2;

        // Layer a darker edge under the yellow road surface for a defined outline.
        const graphics = this.add.graphics();
        const drawRoads = (width, color) => {
            graphics.lineStyle(width, color, 1);

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
        };

        drawRoads(16, 0xB18443);
        drawRoads(10, 0xF2CC72);

        graphics.enableFilters();
        graphics.filters.internal.addPixelate(0.5);

        Actions.AddEffectBloom(graphics, {
            threshold: 0.7,
            blurRadius: 1,
            blurSteps: 1,
            blendAmount: 0.25,
            useInternal: true
        });

        gameContainer.add(graphics);

        // populate road segments list with container-scaled lines
        for (const road of mapData.roads) {
            if (road.length < 2) {
                continue;
            }

            for (let i = 1; i < road.length; i++) {
                const x1 = offsetX + road[i-1][0] * roadScale;
                const y1 = offsetY + road[i-1][1] * roadScale;
                const x2 = offsetX + road[i][0] * roadScale;
                const y2 = offsetY + road[i][1] * roadScale;

                this.roadSegments.push({ x1, y1, x2, y2 });
            }
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
        gameContainer.add(this.scoreText);
        
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
        

        this.postman = this.add.sprite(10,50,'postman');
        this.postman.setScale(0.07);
        this.postman.setVisible(false);
        gameContainer.add(this.postman);


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
            frames: this.anims.generateFrameNumbers('cat', { start: 24, end: 26 }),
            frameRate: 8,
            repeat: -1
        });

        this.anims.create({
            key: 'cat-run-left',
            frames: this.anims.generateFrameNumbers('cat', { start: 13, end: 15 }),
            frameRate: 8,
            repeat: -1
        });

        this.anims.create({
            key: 'cat-run-up',
            frames: this.anims.generateFrameNumbers('cat', { start: 35, end: 37 }),
            frameRate: 8,
            repeat: -1
        });

        this.anims.create({
            key: 'cat-run-down',
            frames: this.anims.generateFrameNumbers('cat', { start: 2, end: 4 }),
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
        const source = this.textures.get('overlay').getSourceImage();
        const overlayScale = this.dsOverlay.displayWidth / source.width;
        this.dpadScale = overlayScale;
        const toCanvasX = (x) => this.dsOverlay.x
            + (x - source.width * this.dsOverlay.originX) * overlayScale;
        const toCanvasY = (y) => this.dsOverlay.y
            + (y - source.height * this.dsOverlay.originY) * overlayScale;
        const buttonSize = 44 * overlayScale;
        const defaultColour = 0x2f3135;

        const directions = {
            up: { x: 111, y: 207 },
            left: { x: 64, y: 254 },
            down: { x: 111, y: 301 },
            right: { x: 158, y: 254 }
        };

        Object.entries(directions).forEach(([direction, position]) => {
            const x = toCanvasX(position.x);
            const y = toCanvasY(position.y);
            const button = this.add.rectangle(
                x,
                y,
                buttonSize,
                buttonSize,
                defaultColour,
                0.9
            );

            button.setStrokeStyle(2 * overlayScale, 0x090a0d, 0.9);
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
                x,
                y
            };

            this.dpadButtons[direction] = button;
        });

        const letterButtons = {
            X: { x: 875, y: 175 },
            Y: { x: 818, y: 233 },
            A: { x: 932, y: 233 },
            B: { x: 875, y: 291 }
        };

        Object.entries(letterButtons).forEach(([letter, position]) => {
            const x = toCanvasX(position.x);
            const y = toCanvasY(position.y);
            const button = this.add.circle(
                x,
                y,
                26 * overlayScale,
                defaultColour,
                0.72
            );

            button.setStrokeStyle(2 * overlayScale, 0x090a0d, 0.9);
            button.setDepth(10);
            button.setScrollFactor(0);
            button.setInteractive({ useHandCursor: true });

            let isPressed = false;
            const setPressedState = (pressed) => {
                isPressed = pressed;
                button.setFillStyle(pressed ? 0x4a4e55 : defaultColour, pressed ? 0.9 : 0.72);
                button.setPosition(x, y + (pressed ? 2 * overlayScale : 0));
            };

            button.on('pointerdown', () => setPressedState(true));
            button.on('pointerup', () => {
                if (!isPressed) {
                    return;
                }

                setPressedState(false);
                this.handleLetterButtonPress(letter);
            });
            button.on('pointerout', () => setPressedState(false));
            button.on('pointerupoutside', () => setPressedState(false));

            this.letterButtonOverlays[letter] = button;
        });

        this.updateDPadVisualState();
    }

    handleLetterButtonPress (letter)
    {
        switch (letter) {
            case 'A':
                this.yipSFX.play();
                break;
            case 'B':
                if (!this.isTransitioning) {
                    this.isTransitioning = true;
                    this.input.keyboard.clearCaptures();
                    this.input.keyboard.removeAllListeners();
                    this.scene.start('MenuScene');
                }
                break;
            case 'X':
                this.sound.mute = !this.sound.mute;
                break;
            case 'Y':
                this.toggleGamePause();
                break;
            default:
                console.warn(`Unknown DS button: ${letter}`);
        }
    }

    toggleGamePause ()
    {
        this.isGamePaused = !this.isGamePaused;
        this.pauseScreenFilter.setVisible(this.isGamePaused);
        this.pauseIcon.setVisible(this.isGamePaused);

        if (this.isGamePaused) {
            this.time.paused = true;
            this.tweens.pauseAll();
            this.anims.pauseAll();
            this.sound.pauseAll();
            return;
        }

        this.time.paused = false;
        this.tweens.resumeAll();
        this.anims.resumeAll();
        this.sound.resumeAll();
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

            button.setFillStyle(active ? 0x4a4e55 : 0x2f3135, active ? 0.9 : 0.72);
            button.setStrokeStyle(2 * this.dpadScale, 0x090a0d, 0.9);
            button.setPosition(
                this.dpadPositions[direction].x,
                this.dpadPositions[direction].y + (active ? 2 * this.dpadScale : 0)
            );
        }

        
    }

    getCatAnimKeyForVector(moveX = 0, moveY = 0, fallback = 'right') {
        if (Math.abs(moveX) >= Math.abs(moveY)) {
            if (moveX > 0) return 'cat-run-right';
            if (moveX < 0) return 'cat-run-left';
        } else {
            if (moveY > 0) return 'cat-run-down';
            if (moveY < 0) return 'cat-run-up';
        }

        return fallback === 'left' ? 'cat-run-left' : fallback === 'right' ? 'cat-run-right' : fallback === 'up' ? 'cat-run-up' : 'cat-run-down';
    }

    update (time, delta)
    {
        if (this.isGamePaused) return;

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
            if (this.catCarrying) {
                const previousX = this.cat.x;
                const previousY = this.cat.y;
                const awayX = this.cat.x - this.puppy.x;
                const awayY = this.cat.y - this.puppy.y;
                let moveX = 0;
                let moveY = 0;

                if (Math.abs(awayX) >= Math.abs(awayY)) {
                    moveX = awayX >= 0 ? 1 : -1;
                } else {
                    moveY = awayY >= 0 ? 1 : -1;
                }

                const travel = this.catSpeed * (delta / 1000);
                const desiredX = this.cat.x + moveX * travel;
                const desiredY = this.cat.y + moveY * travel;

                let bestPoint = { x: this.cat.x, y: this.cat.y };
                let closestDistance = Infinity;

                for (const seg of this.roadSegments) {
                    const point = this.getClosestPointOnSegment(
                        desiredX,
                        desiredY,
                        seg.x1,
                        seg.y1,
                        seg.x2,
                        seg.y2
                    );

                    if (point.distance < closestDistance) {
                        closestDistance = point.distance;
                        bestPoint = point;
                    }
                }

                if (closestDistance <= this.roadWidthThreshold + 8) {
                    this.cat.x = bestPoint.x;
                    this.cat.y = bestPoint.y;
                }

                if (Math.hypot(this.cat.x - previousX, this.cat.y - previousY) < 0.01) {
                    this.catStationaryTime += delta;
                    if (this.catStationaryTime >= 500 && !this.purrSFX.isPlaying) {
                        this.purrSFX.play();
                    }
                } else {
                    this.catStationaryTime = 0;
                    this.purrSFX.stop();
                }

                this.catRunDirection = moveX < 0 ? 'left' : moveX > 0 ? 'right' : moveY < 0 ? 'up' : moveY > 0 ? 'down' : this.catRunDirection;
                const animKey = this.getCatAnimKeyForVector(moveX, moveY, this.catRunDirection);
                if (this.cat.anims.currentAnim?.key !== animKey) {
                    this.cat.play(animKey, true);
                }

                this.catTarget.setPosition(this.cat.x, this.cat.y);
                this.catTarget.setDepth(this.cat.depth + 1);

                const catDogDistance = Math.hypot(this.puppy.x - this.cat.x, this.puppy.y - this.cat.y);
                if (catDogDistance < 32) {
                    this.purrSFX.stop();
                    this.meowSFX.play();
                    this.cat.setVisible(false);
                    this.catCarrying = false;
                    this.catHasMeat = false;
                    this.catTarget.setVisible(false);
                    this.catTarget = null;
                    this.catStationaryTime = 0;
                    this.meatCollectedCount += 1;
                    this.addScore();
                    this.timerVal += 5;
                    this.timerFlashUntil = time + 500;
                    this.timerFlashSuffix = '+';
                    this.timer.setText(`${this.timerVal}${this.timerFlashSuffix}`);
                    this.spawnMeat();
                }
            } else {
                this.catStationaryTime = 0;
                this.purrSFX.stop();
                const dx = this.catTarget.x - this.cat.x;
                const dy = this.catTarget.y - this.cat.y;
                const distance = Math.hypot(dx, dy);
                const step = Math.min(this.catSpeed * (delta / 1000), distance);

                if (distance > 0) {
                    this.cat.x += (dx / distance) * step;
                    this.cat.y += (dy / distance) * step;
                }

                const animKey = this.getCatAnimKeyForVector(
                    dx >= 0 ? 1 : -1,
                    dy >= 0 ? 1 : -1,
                    this.catRunDirection
                );
                if (this.cat.anims.currentAnim?.key !== animKey) {
                    this.cat.play(animKey, true);
                }

                if (distance <= 10) {
                    this.catCarrying = true;
                    this.catHasMeat = true;
                    this.catStationaryTime = 0;
                    this.cat.setVisible(true);
                    this.catTarget.setPosition(this.cat.x, this.cat.y);
                    this.catTarget.setDepth(this.cat.depth + 1);
                }
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
            const puppyCenterX = this.puppy.x + (0.5 - this.puppy.originX) * this.puppy.displayWidth;
            const puppyCenterY = this.puppy.y + (0.5 - this.puppy.originY) * this.puppy.displayHeight;
            const birdCenterX = this.birdfly.x + (0.5 - this.birdfly.originX) * this.birdfly.displayWidth;
            const birdCenterY = this.birdfly.y + (0.5 - this.birdfly.originY) * this.birdfly.displayHeight;
            const overlapsHorizontally = Math.abs(puppyCenterX - birdCenterX)
                <= (this.puppy.displayWidth + this.birdfly.displayWidth) / 2;
            const overlapsVertically = Math.abs(puppyCenterY - birdCenterY)
                <= (this.puppy.displayHeight + this.birdfly.displayHeight) / 2;

            if (overlapsHorizontally && overlapsVertically) {
                this.dogCaught = true;
                this.birdEscapeDirection = this.birdfly.x < 0 ? -1 : 1;
                const halfFieldWidth = this.gameFieldWidth / 2;
                const birdLeft = -this.birdfly.originX * this.birdfly.displayWidth;
                const birdRight = (1 - this.birdfly.originX) * this.birdfly.displayWidth;
                const puppyRelativeX = -this.birdEscapeDirection * this.birdPuppyFollowOffset;
                const puppyLeft = puppyRelativeX - this.puppy.originX * this.puppy.displayWidth;
                const puppyRight = puppyRelativeX
                    + (1 - this.puppy.originX) * this.puppy.displayWidth;
                const groupLeft = Math.min(birdLeft, puppyLeft);
                const groupRight = Math.max(birdRight, puppyRight);

                this.birdEscapeTargetX = this.birdEscapeDirection > 0
                    ? halfFieldWidth - groupRight
                    : -halfFieldWidth - groupLeft;
                this.puppy.anims.stop();
                this.puppy.setFrame(this.lastHorizontalDir === 'left' ? 51 : 3);
                this.hawkSFX.play();
            }
        }

        if (this.dogCaught && this.birdfly?.visible && this.puppy) {
            const step = 100 * delta / 1000;
            const remainingDistance = Math.abs(this.birdEscapeTargetX - this.birdfly.x);
            const movement = Math.min(step, remainingDistance);

            this.birdfly.x += this.birdEscapeDirection * movement;
            this.birdfly.play(this.birdEscapeDirection < 0 ? 'flyingLeft' : 'flying', true);
            this.puppy.setPosition(
                this.birdfly.x - this.birdEscapeDirection * this.birdPuppyFollowOffset,
                this.birdfly.y + 20
            );
        }

        if (
            this.dogCaught &&
            this.birdfly?.visible &&
            !this.isTransitioning &&
            Math.abs(this.birdEscapeTargetX - this.birdfly.x) < 1
        ) {
            this.birdEscapePauseElapsed += delta;

            if (this.birdEscapePauseElapsed >= 1000) {
                this.isTransitioning = true;
                this.input.keyboard.clearCaptures();
                this.input.keyboard.removeAllListeners();
                this.scene.start('GameOverScene', { score: this.score });
            }
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

        if (this.postman?.visible && !this.postmanFollowTriggered && !this.postmanTripTriggered) {
            const directDistance = Math.hypot(
                this.postman.x - this.puppy.x,
                this.postman.y - this.puppy.y
            );

            if (directDistance <= 18) {
                this.postmanFollowTriggered = true;
                this.postmanTripTriggered = true;
                this.postmanFollowChaseUntil = this.time.now + 3000;
                this.postmanOverlapBufferUntil = 0;
                this.postmanYipNextTime = this.time.now + 250;
                this.postmanFollowDistance = 0;
                this.postmanFollowLastPosition = { x: this.postman.x, y: this.postman.y };
                this.postmanFollowTarget = { x: this.postman.x, y: this.postman.y };

                const route = this.getPostmanRoute();
                const routeIndex = this.getNearestRouteIndex(this.postman.x, this.postman.y, route);
                this.postmanFollowRoute = route.slice(Math.max(0, routeIndex));
                this.postmanFollowRouteIndex = 0;
            }
        }

        if (this.postmanFollowTriggered && this.postman?.visible) {
            const overlapDistance = Math.hypot(
                this.postman.x - this.puppy.x,
                this.postman.y - this.puppy.y
            );
            const chaseActive = this.time.now < this.postmanFollowChaseUntil;

            if (chaseActive) {
                this.postmanRedFlash?.setFillStyle(0xff3d3d, 1);
                this.postmanRedFlash?.setAlpha(0.4);
                if (this.postmanSFX && !this.postmanSFX.isPlaying) {
                    this.postmanSFX.play();
                }

                if (this.time.now >= this.postmanYipNextTime) {
                    this.yipSFX?.play();
                    this.postmanYipNextTime = this.time.now + 300;
                }

                if (overlapDistance <= 18) {
                    this.postmanOverlapBufferUntil = this.time.now + 500;
                    this.puppy.anims.stop();
                    this.puppy.setFrame(1);
                    return;
                }

                if (this.time.now < this.postmanOverlapBufferUntil) {
                    this.puppy.anims.stop();
                    this.puppy.setFrame(1);
                    return;
                }

                this.updatePostmanFollowTarget();
                this.followPostman(delta);

                this.postmanFollowDistance += Math.hypot(
                    this.postman.x - (this.postmanFollowLastPosition?.x ?? this.postman.x),
                    this.postman.y - (this.postmanFollowLastPosition?.y ?? this.postman.y)
                );
                this.postmanFollowLastPosition = { x: this.postman.x, y: this.postman.y };
                return;
            }

            this.postmanFollowTriggered = false;
            this.postmanFollowDistance = 0;
            this.postmanFollowLastPosition = null;
            this.postmanFollowTarget = null;
            this.postmanOverlapBufferUntil = 0;
            this.postmanYipNextTime = 0;
            if (this.postmanRedFlash) {
                this.postmanRedFlash.setAlpha(0);
            }
            this.postmanSFX?.stop();
            this.puppy.anims.stop();
            this.puppy.setFrame(1);
            this.lastMovedTime = this.time.now;
            return;
        }

        if (this.postmanRedFlash) {
            this.postmanRedFlash.setAlpha(0);
        }

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
                this.addScore();
            }

            this.timerVal = collectedRottenMeat
                ? Math.max(0, this.timerVal - 5)
                : this.timerVal + 5;
            this.timerFlashUntil = time + 500;
            this.timerFlashSuffix = collectedRottenMeat ? '-' : '+';
            this.timer.setText(`${this.timerVal}${this.timerFlashSuffix}`);
            this.spawnMeat();
        }

        for (const bone of this.bones) {
            if (!bone.active || Math.hypot(this.puppy.x - bone.x, this.puppy.y - bone.y) >= 20) {
                continue;
            }

            this.chompSFX.play();
            this.timerVal += 2;
            this.timerFlashUntil = time + 500;
            this.timerFlashSuffix = '+';
            this.timer.setText(`${this.timerVal}${this.timerFlashSuffix}`);
            bone.destroy();
        }
        this.bones = this.bones.filter((bone) => bone.active);
    }

    followPostman(delta) {
        if (!this.puppy || this.postmanFollowRoute.length === 0) {
            return;
        }

        const route = this.postmanFollowRoute;
        const targetIndex = Math.min(this.postmanFollowRouteIndex, route.length - 1);
        const target = route[targetIndex];
        if (!target) {
            return;
        }

        const dx = target.x - this.puppy.x;
        const dy = target.y - this.puppy.y;
        const distance = Math.hypot(dx, dy);
        const step = this.moveSpeed * (delta / 1000) * 60;

        if (distance <= step) {
            this.puppy.setPosition(target.x, target.y);
            if (this.postmanFollowRouteIndex < route.length - 1) {
                this.postmanFollowRouteIndex += 1;
            } else if (this.time.now >= this.postmanFollowChaseUntil) {
                this.postmanFollowTriggered = false;
                this.postmanFollowDistance = 0;
                this.postmanFollowTarget = null;
                this.postmanFollowRoute = [];
                this.postmanFollowRouteIndex = 0;
            }
        } else {
            const nextX = this.puppy.x + (dx / distance) * step;
            const nextY = this.puppy.y + (dy / distance) * step;
            this.puppy.setPosition(nextX, nextY);
        }

        const anim = Math.abs(dx) >= Math.abs(dy)
            ? (dx < 0 ? 'walk-left' : 'walk-right')
            : (dy < 0 ? 'walk-up' : 'walk-down');

        if (this.anims.exists(anim)) {
            this.puppy.play(anim, true);
            this.lastAnim = anim;
            if (anim === 'walk-left' || anim === 'walk-right') {
                this.lastHorizontalDir = anim === 'walk-left' ? 'left' : 'right';
            }
        }
    }

    updatePostmanFollowTarget() {
        this.postmanFollowTarget = {
            x: this.postman.x - this.postmanDirectionX * 20,
            y: this.postman.y - this.postmanDirectionY * 20
        };
    }

    getNearestRouteIndex(x, y, route) {
        if (!route || route.length === 0) {
            return 0;
        }

        let nearestIndex = 0;
        let nearestDistance = Infinity;

        for (let i = 0; i < route.length; i++) {
            const point = route[i];
            const distance = Math.hypot(x - point.x, y - point.y);
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestIndex = i;
            }
        }

        return nearestIndex;
    }

    addScore() {
        this.score++;
        this.scoreText.setText(`Score: ${this.score}`);
        if (this.score % 3 == 0) {
            this.startPostmanCrossing();
        }
    }

    startPostmanCrossing() {
        if (this.postmanCrossingStarted || !this.gameContainer) {
            return;
        }

        const route = this.getPostmanRoute();
        if (route.length === 0) {
            console.warn('Could not find a connected road route for the postman.');
            return;
        }

        if (!this.postman) {
            this.postman = this.add.sprite(10, 50, 'postman');
            this.postman.setScale(0.07);
            this.postman.setVisible(false);
            this.gameContainer.add(this.postman);
        }

        this.postmanCrossingStarted = true;
        this.postmanTripTriggered = false;
        this.postman.setPosition(route[0].x, route[0].y + this.postmanRoadOffsetY);
        this.postmanLastDetectionPosition = { x: this.postman.x, y: this.postman.y };
        this.postman.setVisible(true);
        this.postmanSFX.stop();
        this.postmanSFX.play();
        this.movePostmanAlongRoute(route, 1);
    }

    getPostmanRoute() {
        const points = new Map();
        const connections = new Map();
        const pointKey = (x, y) => `${Math.round(x * 10) / 10},${Math.round(y * 10) / 10}`;

        for (const segment of this.roadSegments) {
            const startKey = pointKey(segment.x1, segment.y1);
            const endKey = pointKey(segment.x2, segment.y2);
            points.set(startKey, { x: segment.x1, y: segment.y1 });
            points.set(endKey, { x: segment.x2, y: segment.y2 });

            if (!connections.has(startKey)) {
                connections.set(startKey, []);
            }
            if (!connections.has(endKey)) {
                connections.set(endKey, []);
            }
            connections.get(startKey).push(endKey);
            connections.get(endKey).push(startKey);
        }

        if (points.size === 0) {
            return [];
        }

        const leftmostX = Math.min(...[...points.values()].map(point => point.x));
        const startKeys = [...points.entries()]
            .filter(([, point]) => point.x === leftmostX)
            .map(([key]) => key);

        let bestRoute = [];
        for (const startKey of startKeys) {
            const queue = [startKey];
            const previous = new Map([[startKey, null]]);
            let furthestKey = startKey;

            for (let index = 0; index < queue.length; index++) {
                const currentKey = queue[index];
                if (points.get(currentKey).x > points.get(furthestKey).x) {
                    furthestKey = currentKey;
                }

                for (const nextKey of connections.get(currentKey)) {
                    if (!previous.has(nextKey)) {
                        previous.set(nextKey, currentKey);
                        queue.push(nextKey);
                    }
                }
            }

            const route = [];
            for (let key = furthestKey; key !== null; key = previous.get(key)) {
                route.unshift(points.get(key));
            }

            if (
                route.length > 0 &&
                (bestRoute.length === 0 || route[route.length - 1].x > bestRoute[bestRoute.length - 1].x)
            ) {
                bestRoute = route;
            }
        }

        return bestRoute;
    }

    movePostmanAlongRoute(route, index) {
        if (!this.postman) {
            return;
        }

        const destination = index < route.length
            ? { x: route[index].x, y: route[index].y + this.postmanRoadOffsetY }
            : {
                x: this.gameFieldWidth / 2 + this.postman.displayWidth / 2,
                y: this.postman.y
            };
        const distance = Math.hypot(destination.x - this.postman.x, destination.y - this.postman.y);

        if (distance < 0.1) {
            if (index < route.length) {
                this.movePostmanAlongRoute(route, index + 1);
            } else {
                this.postmanSFX?.stop();
                this.postman.destroy();
                this.postman = null;
            }
            return;
        }

        this.postmanDirectionX = (destination.x - this.postman.x) / distance;
        this.postmanDirectionY = (destination.y - this.postman.y) / distance;

        this.tweens.add({
            targets: this.postman,
            x: destination.x,
            y: destination.y,
            duration: distance / 200 * 1000,
            ease: 'Linear',
            onComplete: () => {
                if (index < route.length) {
                    this.movePostmanAlongRoute(route, index + 1);
                } else {
                    this.postmanCrossingStarted = false;
                    this.postmanFollowTriggered = false;
                    this.postmanTripTriggered = false;
                    this.postmanFollowDistance = 0;
                    this.postmanFollowDelayUntil = 0;
                    this.postmanFollowChaseUntil = 0;
                    this.postmanFollowLastPosition = null;
                    this.postmanFollowTarget = null;
                    this.postmanLastDetectionPosition = null;
                    this.postmanSFX?.stop();
                    this.postman?.destroy();
                    this.postman = null;
                }
            }
        });
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

        if (Math.random() >= 0.6) {
            return;
        }

        this.catTarget = this.rottenMeat.visible && Math.random() < 0.5
            ? this.rottenMeat
            : this.meat;

        const leftBound = -460;
        const rightBound = 460;
        const nearestSide = Math.abs(this.catTarget.x - leftBound) <= Math.abs(this.catTarget.x - rightBound) ? 'left' : 'right';
        const runFrom = nearestSide === 'left' ? 'right' : 'left';
        const spawnOffset = 200;

        this.catRunDirection = runFrom;
        this.catCarrying = false;
        this.catHasMeat = false;
        this.catStationaryTime = 0;
        this.purrSFX.stop();
        const startX = runFrom === 'right' ? this.catTarget.x + spawnOffset : this.catTarget.x - spawnOffset;
        const startY = this.catTarget.y;

        this.cat.setPosition(startX, startY);
        this.cat.setVisible(true);
        this.cat.setScale(2);
        this.cat.play(this.getCatAnimKeyForVector(runFrom === 'right' ? 1 : -1, 0, runFrom), true);
    }

    spawnMeat() {
        if (this.roadSegments.length === 0 || !this.meat || !this.rottenMeat) return;

        const walkableSegments = this.getWalkableRoadSegments();
        const rottenMeatSpawns = this.meatHasSpawned && Math.random() < 0.2;
        this.meatHasSpawned = true;
        this.catCarrying = false;
        this.catHasMeat = false;
        this.catTarget = null;
        this.catStationaryTime = 0;
        this.purrSFX?.stop();

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
        this.meat.setVisible(true);
        this.meat.setPosition(meatPosition.x, meatPosition.y);
        this.cat?.setVisible(false);

        if (Math.random() < 1 / 3) {
            let bonePosition = pickRoadSample();
            for (let attempt = 0; attempt < 10; attempt++) {
                const overlapsExistingBone = this.bones.some(
                    (bone) => Math.hypot(bone.x - bonePosition.x, bone.y - bonePosition.y) < 48
                );
                const overlapsMeat = Math.hypot(
                    meatPosition.x - bonePosition.x,
                    meatPosition.y - bonePosition.y
                ) < 48;

                if (!overlapsExistingBone && !overlapsMeat) {
                    break;
                }
                bonePosition = pickRoadSample();
            }

            const bone = this.add.image(bonePosition.x, bonePosition.y, 'bone');
            bone.setDisplaySize(36, 17);
            bone.setAngle(Math.random() * 360);
            bone.setDepth(4);
            this.gameContainer.add(bone);
            this.bones.push(bone);
        }

        this.rottenMeat.setVisible(rottenMeatSpawns);
        if (rottenMeatSpawns) {
            const rottenPosition = pickRoadSample();
            this.rottenMeat.setPosition(rottenPosition.x, rottenPosition.y);
        }

        this.triggerCatRun();
    }
}
