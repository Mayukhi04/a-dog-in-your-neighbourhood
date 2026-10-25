import { Scene } from 'phaser';

export class GameOverScene extends Scene {
    constructor() {
        super('GameOverScene');
    }

    preload() {
        this.load.setPath('assets');
        this.load.image('menuBackground', 'ds.jpeg');
        this.load.image('menuField', 'field.jpeg');
    }

    create() {
        const screenW = this.cameras.main.width;
        const screenH = this.cameras.main.height;
        const cx = this.cameras.main.centerX;
        const cy = this.cameras.main.centerY;

        const bgContainer = this.add.container(cx, 0);
        bgContainer.setDepth(0);

        const source = this.textures.get('menuBackground').getSourceImage();
        const aspectRatio = source.height / source.width;
        const bgHeight = screenW * aspectRatio;

        const dsBg = this.add.image(0, bgHeight / 2, 'menuBackground');
        dsBg.setDisplaySize(screenW, bgHeight);
        bgContainer.add(dsBg);

        const fieldBg = this.add.image(0, bgHeight * 0.243, 'menuField');
        fieldBg.setDisplaySize(screenW * 0.5, bgHeight * 0.375);
        fieldBg.setOrigin(0.5);
        fieldBg.setDepth(2);
        bgContainer.add(fieldBg);

        this.add.text(cx, cy - 120, 'Game Over!', {
            fontFamily: 'PixelFont',
            fontSize: '36px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6,
            align: 'center',
        }).setOrigin(0.5);

        const playAgainButton = this.add.text(cx, cy + 20, 'PLAY AGAIN', {
            fontFamily: 'PixelFont',
            fontSize: '22px',
            color: '#ffffff',
            backgroundColor: '#2d9cdb',
            padding: { x: 24, y: 14 },
            stroke: '#ffffff',
            strokeThickness: 3,
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        playAgainButton.on('pointerdown', () => {
            this.scene.start('MenuScene');
        });
    }
}
