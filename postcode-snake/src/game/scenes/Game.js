import { Scene, Actions, Input } from 'phaser';

export class Game extends Scene
{
    cursors;
    puppy;
    moveSpeed = 3;
    lastAnim = 'walk-up'; 

    roadSegments = [];

    constructor ()
    {
        super('Game');
    }

    preload ()
    {
        this.load.setPath('assets');
        
        this.load.image('overlay', 'ds.png');
        this.load.image('meat', 'meat.png');

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

        this.puppy = this.add.sprite(spawnX, spawnY, 'dog', 24);
        this.puppy.setScale(1.5);
        gameContainer.add(this.puppy);

        // puppy walking logic
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

            // calculate where the player intends to step and find the closest point on the road network
            const targetX = this.puppy.x + moveX * speed;
            const targetY = this.puppy.y + moveY * speed;

            let closestPoint = null;
            let minDistance = Infinity;

            for (const seg of this.roadSegments) {
                const pt = this.getClosestPointOnSegment(targetX, targetY, seg.x1, seg.y1, seg.x2, seg.y2);
                if (pt.distance < minDistance) {
                    minDistance = pt.distance;
                    closestPoint = pt;
                }
            }

            // allowed variance thickness
            const roadWidthThreshold = 8; 

            if (closestPoint && minDistance <= roadWidthThreshold) {
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
            // handle idle state based on the last direction walked
            this.puppy.stop();
            
            if (this.puppy.anims.currentAnim) {
                const currentFrames = this.puppy.anims.currentAnim.frames;
                if (currentFrames && currentFrames.length > 0) {
                    this.puppy.setFrame(currentFrames[0].frame.name);
                }
            }
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
}
