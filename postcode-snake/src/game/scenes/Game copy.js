import { Scene } from 'phaser';

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
        this.load.image('logo', 'logo.png');

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

        const containerBg = this.add.image(0, 0, 'background');
        gameContainer.add(containerBg);

        const cropX = (containerBg.width - gameW) / 2;
        const cropY = (containerBg.height - gameH) / 2;

        containerBg.setCrop(cropX, cropY, gameW, gameH);
        
        gameContainer.add(containerBg);

        // Get the exported road data
        const mapData = this.cache.json.get('roadMaze');

        if (!mapData || !mapData.roads) {
            console.error('Road maze data could not be loaded.');
            return;
        }

        // Define the upper DS screen area within ds.png.
        // These values are proportions of the original overlay image.
        const screenLeft = bg.width * 0.262;
        const screenRight = bg.width * 0.739;
        const screenTop = bg.height * 0.168;
        const screenBottom = bg.height * 0.845;

        // Convert the screen rectangle into game-world coordinates.
        const left = bg.x + (screenLeft - bg.width / 2) * bg.scaleX;
        const right = bg.x + (screenRight - bg.width / 2) * bg.scaleX;
        const top = bg.y + (screenTop - bg.height / 2) * bg.scaleY;
        const bottom = bg.y + (screenBottom - bg.height / 2) * bg.scaleY;

        const mazeW = right - left;
        const mazeH = bottom - top;

        // Uniformly scale the roads to fit inside the DS screen.
        const fitScale = Math.min(
            mazeW / mapData.width,
            mazeH / mapData.height
        );

        // Reduce this value to make the roads occupy less of the screen.
        const shrink = 0.7;

        const scaleX = fitScale * shrink;
        const scaleY = fitScale * shrink;

        // Centre the roads inside the DS screen.
        const offsetX = left + (mazeW - mapData.width * scaleX) / 2;
        const offsetY = top + (mazeH - mapData.height * scaleY) / 2;

        // Draw roads on top of the DS overlay.
        const graphics = this.add.graphics();
        graphics.setDepth(1);

        graphics.lineStyle(2, 0x303030, 1);

        for (const road of mapData.roads) {
            if (road.length < 2) {
                continue;
            }

            graphics.beginPath();

            graphics.moveTo(
                offsetX + road[0][0] * scaleX,
                offsetY + road[0][1] * scaleY
            );

            for (let i = 1; i < road.length; i++) {
                graphics.lineTo(
                    offsetX + road[i][0] * scaleX,
                    offsetY + road[i][1] * scaleY
                );
            }

            graphics.strokePath();
        }
    }



}
