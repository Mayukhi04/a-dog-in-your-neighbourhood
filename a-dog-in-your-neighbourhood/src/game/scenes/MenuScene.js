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

        const form = this.add.dom(cx, cy + 180).createFromHTML(`
            <div style="display:flex; flex-direction:column; align-items:center; gap:14px; font-family: 'PixelFont', sans-serif;">
                <style>
                    input::placeholder {
                        color: rgba(255,255,255,0.95);
                        opacity: 1;
                    }
                </style>
                <input type="text" placeholder="Please type your postcode here" value="" style="width: 310px; height: 48px; border: 4px solid rgba(255,255,255,0.9); border-radius: 0; background: rgba(24, 31, 42, 0.7); color: #ffffff; font-size: 18px; text-transform: uppercase; padding: 0 12px; outline: none; box-sizing: border-box; font-family: 'PixelFont', sans-serif; box-shadow: 0 0 0 2px rgba(0,0,0,0.45), inset 0 0 0 2px rgba(255,255,255,0.18); appearance: none; -webkit-appearance: none; image-rendering: pixelated; -webkit-font-smoothing: none; font-smooth: none; text-rendering: geometricPrecision; filter: contrast(1.1) brightness(0.9) blur(0.2px); text-align: center;" />
                <div style="display:flex; justify-content:center; align-items:center; min-height: 28px;">
                    <span id="start-link" style="color: rgba(255,255,255,0.9); font-size: 22px; letter-spacing: 0.08em; cursor: pointer; text-decoration: none; transition: color 0.15s ease, opacity 0.15s ease; font-family: 'PixelFont', sans-serif;">START</span>
                </div>
                <div id="postcode-error" style="min-height: 18px; color: #ffe3e3; font-size: 14px; text-align: center; max-width: 300px; font-weight: 700;"> </div>
            </div>
        `);
        form.setOrigin(0.5);
        form.setDepth(10);

        const postcodeInput = form.node.querySelector('input');
        const submitButton = form.node.querySelector('#start-link');
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
                    const message = errorBody.error || 'Invalid postcode';
                    throw new Error(message.includes('postcode') || message.includes('invalid') || message.includes('not found') ? 'Invalid postcode' : 'Invalid postcode');
                }

                this.scene.start('Game');
            } catch (error) {
                console.error(error);
                errorText.textContent = 'Invalid postcode';
            }
        };

        submitButton.addEventListener('click', handleGenerate);
        submitButton.addEventListener('mouseenter', () => {
            submitButton.style.color = '#ffffff';
            submitButton.style.opacity = '1';
        });
        submitButton.addEventListener('mouseleave', () => {
            submitButton.style.color = 'rgba(255,255,255,0.8)';
            submitButton.style.opacity = '0.9';
        });
        postcodeInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                handleGenerate();
            }
        });
    }
}
