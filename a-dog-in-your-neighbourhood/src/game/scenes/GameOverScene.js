import { Scene } from 'phaser';

export class GameOverScene extends Scene {
    constructor() {
        super('GameOverScene');
    }

    preload() {
        this.load.setPath('assets');
        this.load.image('menuBackground', 'ds.jpeg');
        this.load.image('nightField', 'night_field.jpg');
    }

    create() {
        // ds overlay
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

        // background + dog
        const fieldBg = this.add.image(0, bgHeight * 0.243, 'nightField');
        fieldBg.setDisplaySize(screenW * 0.5, bgHeight * 0.375);
        fieldBg.setOrigin(0.5);
        fieldBg.setDepth(2);
        bgContainer.add(fieldBg);

        // menu text/play again button
        this.add.text(cx, cy - 120, 'Game Over!', {
            fontFamily: 'PixelFont',
            fontSize: '36px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6,
            align: 'center',
        }).setOrigin(0.5);

        const playAgainButton = this.add.dom(cx, cy).createFromHTML(`
            <button type="button" style="width: 170px; height: 52px; border: 3px solid #ffffff; border-radius: 12px; background: rgba(45, 156, 219, 0.9); color: #ffffff; font-size: 22px; font-weight: bold; cursor: pointer; font-family: 'PixelFont', sans-serif;">PLAY AGAIN</button>
        `);
        playAgainButton.setOrigin(0.5);
        playAgainButton.setDepth(10);

        playAgainButton.node.addEventListener('click', () => {
            this.scene.start('MenuScene');
        });
    }
}
