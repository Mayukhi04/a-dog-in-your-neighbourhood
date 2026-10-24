import { Scene } from 'phaser';

export class MenuScene extends Scene {
    constructor() {
        super('MenuScene');
    }

    preload() {
        this.load.setPath('assets');
        this.load.image('menuBackground', 'ds.jpeg');
    }

    create() {
        const screenW = this.cameras.main.width;
        const screenH = this.cameras.main.height;
        const cx = this.cameras.main.centerX;
        const cy = this.cameras.main.centerY;

        const source = this.textures.get('menuBackground').getSourceImage();
        const aspectRatio = source.height / source.width;
        const bgHeight = screenW * aspectRatio;

        const bg = this.add.image(cx, bgHeight / 2, 'menuBackground');
        bg.setDisplaySize(screenW, bgHeight);
        bg.setDepth(0);

        this.add.text(cx, cy - 120, 'A Dog In Your Neighbourhood', {
            fontFamily: 'Arial Black',
            fontSize: '42px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 8,
            align: 'center',
        }).setOrigin(0.5);

        const button = this.add.container(cx, cy + 60);
        const buttonBg = this.add.rectangle(0, 0, 280, 90, 0x2d9cdb, 0.9);
        buttonBg.setStrokeStyle(4, 0xffffff);
        buttonBg.setInteractive({ useHandCursor: true });

        const label = this.add.text(0, 0, 'START', {
            fontFamily: 'Arial Black',
            fontSize: '32px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6,
        }).setOrigin(0.5);

        button.add([buttonBg, label]);

        buttonBg.on('pointerdown', async () => {
            const postcode = window.prompt('Enter a UK postcode to generate your road maze', 'NG8 1BB');

            if (!postcode) {
                return;
            }

            try {
                const response = await fetch('http://localhost:3001/api/generate-map', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ postcode })
                });

                if (!response.ok) {
                    const errorBody = await response.json().catch(() => ({}));
                    throw new Error(errorBody.error || 'Unable to generate map from postcode.');
                }

                this.scene.start('Game');
            } catch (error) {
                console.error(error);
                window.alert(error.message || 'There was a problem generating the map.');
            }
        });
    }
}
