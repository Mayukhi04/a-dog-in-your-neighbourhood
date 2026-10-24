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
        
        this.load.image('background', 'ds.png');
        this.load.image('logo', 'logo.png');
    }

    create ()
    {
        // 1. Get the real-time width and height of the browser screen
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const cx = this.cameras.main.centerX;
        const cy = this.cameras.main.centerY;

        // 2. Place the background right in the center of the screen
        const bg = this.add.image(cx-35, cy+95, 'background');

        // 3. Find the best scale factor to fill the screen without distortion
        const scale = Math.max(width / bg.width, height / bg.height);
        bg.setScale(scale * 1.28);
        
        // 4. Center your logo and text using the fluid center points
        this.add.image(cx, cy - 30, 'logo').setDepth(100);
        this.add.text(cx, cy + 110, 'Make something fun!\nand share it with us:\nsupport@phaser.io', {
            fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5).setDepth(100);
    }
}
