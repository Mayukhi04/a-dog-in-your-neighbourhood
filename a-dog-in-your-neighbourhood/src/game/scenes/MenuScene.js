import { Scene } from 'phaser';

export class MenuScene extends Scene {
    constructor() {
        super('MenuScene');
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

        this.add.text(cx, cy - 120, 'A Dog In Your Neighbourhood', {
            fontFamily: 'PixelFont',
            fontSize: '36px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6,
            align: 'center',
        }).setOrigin(0.5);

        const form = this.add.dom(cx, cy + 40).createFromHTML(`
            <div style="display:flex; flex-direction:column; align-items:center; gap:12px; font-family: 'PixelFont', sans-serif;">
                <input type="text" placeholder="Please type postcode here" value="" style="width: 300px; height: 46px; border: 3px solid #ffffff; border-radius: 10px; background: rgba(17, 24, 39, 0.8); color: #ffffff; font-size: 18px; text-transform: uppercase; padding: 0 12px; outline: none; box-sizing: border-box; font-family: 'PixelFont', sans-serif;" />
                <button type="button" style="width: 170px; height: 52px; border: 3px solid #ffffff; border-radius: 12px; background: rgba(45, 156, 219, 0.9); color: #ffffff; font-size: 22px; font-weight: bold; cursor: pointer; font-family: 'PixelFont', sans-serif;">START</button>
                <div id="postcode-error" style="min-height: 18px; color: #ffd7d7; font-size: 14px; text-align: center; max-width: 300px;"> </div>
            </div>
        `);
        form.setOrigin(0.5);
        form.setDepth(10);

        const postcodeInput = form.node.querySelector('input');
        const submitButton = form.node.querySelector('button');
        const errorText = form.node.querySelector('#postcode-error');

        const handleGenerate = async () => {
            const postcode = (postcodeInput.value || '').trim();

            if (!postcode) {
                errorText.textContent = 'Please enter a postcode.';
                return;
            }

            const cleanPostcode = postcode.toUpperCase();
            postcodeInput.value = cleanPostcode;
            errorText.textContent = '';

            try {
                const response = await fetch('http://localhost:3001/api/generate-map', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ postcode: cleanPostcode })
                });

                if (!response.ok) {
                    const errorBody = await response.json().catch(() => ({}));
                    throw new Error(errorBody.error || 'Unable to generate map from postcode.');
                }

                this.scene.start('Game');
            } catch (error) {
                console.error(error);
                errorText.textContent = error.message || 'There was a problem generating the map.';
            }
        };

        submitButton.addEventListener('click', handleGenerate);
        postcodeInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                handleGenerate();
            }
        });
    }
}
