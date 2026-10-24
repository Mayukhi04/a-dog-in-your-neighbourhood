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
        this.load.image('background', 'bg.png');
        this.load.image('logo', 'logo.png');
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
        const gameW = 2000;
        const gameH = 1000;

        const gameScale = Math.min(screenW / gameW, screenH / gameH);

        const gameContainer = this.add.container(cx, cy+20);
        gameContainer.setScale(gameScale);
        gameContainer.setDepth(1);

        const containerBg = this.add.image(0, 0, 'background');
        gameContainer.add(containerBg);

        // container contents
        const logo = this.add.image(0, 0, 'logo');
        
        const text = this.add.text(0, 110, 'Make something fun!\nand share it with us:\nsupport@phaser.io', {
            fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5);

        gameContainer.add([logo, text]);
        
        gameContainer.setDepth(100);
    }

}
