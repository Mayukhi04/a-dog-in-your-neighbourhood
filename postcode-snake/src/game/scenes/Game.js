import { Scene, Actions } from 'phaser';

export class Game extends Scene
{
    constructor ()
    {
        super('Game');
    }

    preload ()
    {
        this.load.setPath('assets');
        
        this.load.image('overlay', 'ds.png');

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
        
        // container visual effects
        gameContainer.enableFilters();

        gameContainer.filters.internal.addPixelate(1);

        Actions.AddEffectBloom(gameContainer, {
            threshold: 0.3,
            blurRadius: 2,
            blurSteps: 2,
            blendAmount: 1,
            useInternal: true
        });

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

        // Add the roads to the existing container
        gameContainer.add(graphics);
    }
}
