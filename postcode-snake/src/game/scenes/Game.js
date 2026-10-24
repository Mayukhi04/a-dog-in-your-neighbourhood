import { Scene, Actions, Input } from 'phaser';

export class Game extends Scene
{
    cursors;
    puppy;
    moveSpeed = 3;

    constructor ()
    {
        super('Game');
    }

    preload ()
    {
        this.load.setPath('assets');
        
        this.load.image('overlay', 'ds.png');

        this.load.spritesheet('dog', 'dog.png', {
            frameWidth: 32,
            frameHeight: 32
        });

        this.load.json('roadMaze', '../road_maze.json');
    }

    create ()
    {
        // ds overlay positioning
        const screenW = this.cameras.main.width;
        const screenH = this.cameras.main.height;
        const cx = this.cameras.main.centerX;
        const cy = this.cameras.main.centerY;

        const bg = this.add.image(cx-35, cy+95, 'overlay');
        const bgScale = Math.max(screenW / bg.width, screenH / bg.height);
        bg.setScale(bgScale*1.27);
        bg.setDepth(0);

        // actual game container positioning
        const gameW = 1024;
        const gameH = 768;

        const gameScale = Math.min(screenW / gameW, screenH / gameH)/1.4;

        const containerX = cx;
        const containerY = cy + 20;

        // container background
        const gameContainer = this.add.container(containerX, containerY);
        gameContainer.setScale(gameScale);
        gameContainer.setDepth(1);

        const rect = this.add.rectangle(0, 0, gameW-120, gameH-100, 0x000000);
        gameContainer.add(rect);

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

        graphics.lineStyle(10, 0xffffff, 1);

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

        // dog walking logic
        this.puppy = this.add.sprite(0, 0, 'dog', 24);
        this.puppy.setScale(1.5)
        gameContainer.add(this.puppy);

        this.anims.create({
            key: 'walk-down',
            frames: this.anims.generateFrameNumbers('dog', { start: 40, end: 42 }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'walk-left',
            frames: this.anims.generateFrameNumbers('dog', { start: 56, end: 58 }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'walk-right',
            frames: this.anims.generateFrameNumbers('dog', { start: 8, end: 10 }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'walk-up',
            frames: this.anims.generateFrameNumbers('dog', { start: 24, end: 26 }),
            frameRate: 10,
            repeat: -1
        });

        // set up keyboard arrow keys
        this.cursors = this.input.keyboard.createCursorKeys();

    }

    // keep track of last played animation to set the correct idle frame
    lastAnim = 'walk-up'; 

    update ()
    {
        let moveX = 0;
        let moveY = 0;
        let currentAnim = null;

        if (!this.cursors || !this.puppy) return;

        // check inputs and assign the correct animation string
        if (this.cursors.left.isDown) {
            moveX = -1;
            currentAnim = 'walk-left';
        } else if (this.cursors.right.isDown) {
            moveX = 1;
            currentAnim = 'walk-right';
        }

        if (this.cursors.up.isDown) {
            moveY = -1;
            currentAnim = 'walk-up';
        } else if (this.cursors.down.isDown) {
            moveY = 1;
            currentAnim = 'walk-down';
        }

        // execute movement and animations
        if (moveX !== 0 || moveY !== 0) 
        {

            // normalise speed if moving diagonally
            let speed = this.moveSpeed;
            if (moveX !== 0 && moveY !== 0) {
                speed = this.moveSpeed * 0.7071;
            }

            this.puppy.x += moveX * speed;
            this.puppy.y += moveY * speed;

            if (currentAnim && this.anims.exists(currentAnim)) {
                this.puppy.play(currentAnim, true);
                this.lastAnim = currentAnim;
            }
        }
        else 
        {
            // handle idle state based on the last direction walked
            this.puppy.stop();
            
            // set the dog to frame 0 of whatever animation row he was last using
            if (this.puppy.anims.currentAnim) {
                const currentFrames = this.puppy.anims.currentAnim.frames;
                if (currentFrames && currentFrames.length > 0) {
                    this.puppy.setFrame(currentFrames[0].frame.name);
                }
            }
        }
    }

}
