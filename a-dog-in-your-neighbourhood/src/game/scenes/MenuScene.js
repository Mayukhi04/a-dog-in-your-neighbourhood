import { Scene } from 'phaser';
import { DS_TOP_SCREEN, DESIGN_HEIGHT, DESIGN_WIDTH } from '../layout';

export class MenuScene extends Scene {
    constructor() {
        super('MenuScene');
    }

    preload() {
        this.load.setPath('assets');
        this.load.image('menuBackground', 'ds_top.jpeg');
        this.load.image('menuField', 'field.jpeg');

        this.load.spritesheet('menuDog', 'dog.png', {
            frameWidth: 32,
            frameHeight: 32
        });
        this.load.spritesheet('menuPigeon', 'pigeon_eat-Sheet.png', {
            frameWidth: 32,
            frameHeight: 32
        });
    }

    create() {
        const cx = DESIGN_WIDTH / 2;
        const cy = DESIGN_HEIGHT / 2;

        const bgContainer = this.add.container(0, 0);
        bgContainer.setDepth(0);

        const dsBg = this.add.image(cx, DESIGN_HEIGHT - 537, 'menuBackground')
            .setOrigin(0.5, 0);
        dsBg.setDisplaySize(DESIGN_WIDTH, 537);
        bgContainer.add(dsBg);

        const fieldBg = this.add.image(
            DS_TOP_SCREEN.x + DS_TOP_SCREEN.width / 2,
            DS_TOP_SCREEN.y + DS_TOP_SCREEN.height / 2,
            'menuField'
        );
        fieldBg.setDisplaySize(DS_TOP_SCREEN.width, DS_TOP_SCREEN.height);
        fieldBg.setOrigin(0.5);
        fieldBg.setDepth(2);
        bgContainer.add(fieldBg);

        // pigeon sprite
        if (!this.anims.exists('menu-pigeon-eat')) {
            this.anims.create({
                key: 'menu-pigeon-eat',
                frames: this.anims.generateFrameNumbers('menuPigeon', { start: 0, end: 3 }),
                frameRate: 5,
                repeat: -1
            });
        }

        const pigeon = this.add.sprite(0, 0, 'menuPigeon');
        pigeon.setScale(1);
        pigeon.setFlipX(true);
        pigeon.setOrigin(0.5, 0.8);
        pigeon.setDepth(3);
        pigeon.play('menu-pigeon-eat');

        // dog sprite
        if (!this.anims.exists('menu-dog-walk-left')) {
            this.anims.create({
                key: 'menu-dog-walk-left',
                frames: this.anims.generateFrameNumbers('menuDog', { start: 48, end: 50 }),
                frameRate: 10,
                repeat: -1
            });
        }

        if (!this.anims.exists('menu-dog-walk-right')) {
            this.anims.create({
                key: 'menu-dog-walk-right',
                frames: this.anims.generateFrameNumbers('menuDog', { start: 0, end: 2 }),
                frameRate: 10,
                repeat: -1
            });
        }

        const dog = this.add.sprite(
            cx - DS_TOP_SCREEN.width * 0.4,
            DS_TOP_SCREEN.y + DS_TOP_SCREEN.height * 0.63,
            'menuDog'
        );
        dog.setScale(2);
        dog.setOrigin(0.5, 0.8);
        dog.setDepth(3);
        dog.play('menu-dog-walk-right');

        this.tweens.add({
            targets: dog,
            x: cx + DS_TOP_SCREEN.width * 0.4,
            duration: 6500,
            ease: 'Linear',
            yoyo: true,
            repeat: -1,
            onYoyo: () => dog.play('menu-dog-walk-left'),
            onRepeat: () => dog.play('menu-dog-walk-right')
        });

        const title = this.add.text(cx, DS_TOP_SCREEN.y + 66, 'A Dog In Your Neighbourhood', {
            fontFamily: 'PixelFont',
            fontSize: '34px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6,
            align: 'center',
        }).setOrigin(0.5);
        const titleContext = title.canvas.getContext('2d');
        const lastOIndex = title.text.lastIndexOf('o');
        const prefixWidth = titleContext.measureText(title.text.slice(0, lastOIndex)).width;
        const lastOWidth = titleContext.measureText('o').width;
        pigeon.setPosition(
            title.x - title.width / 2 + prefixWidth + lastOWidth / 2,
            title.y - title.height / 2
                - (1 - pigeon.originY) * pigeon.displayHeight
                + 16
        );

        const form = this.add.dom(cx, DS_TOP_SCREEN.y + DS_TOP_SCREEN.height * 0.82 + 8).createFromHTML(`
            <div style="display:flex; flex-direction:column; align-items:center; gap:14px; font-family: 'PixelFont', sans-serif;">
                <style>
                    input::placeholder {
                        color: rgba(255,255,255,0.95);
                        opacity: 1;
                    }
                </style>
                <input type="text" placeholder="Please type your postcode here" value="" style="width: 280px; height: 42px; border: 4px solid rgba(255,255,255,0.9); border-radius: 0; background: rgba(24, 31, 42, 0.7); color: #ffffff; font-size: 16px; text-transform: uppercase; padding: 0 8px; outline: none; box-sizing: border-box; font-family: 'PixelFont', sans-serif; box-shadow: 0 0 0 2px rgba(0,0,0,0.45), inset 0 0 0 2px rgba(255,255,255,0.18); appearance: none; -webkit-appearance: none; image-rendering: pixelated; -webkit-font-smoothing: none; font-smooth: none; text-rendering: geometricPrecision; filter: contrast(1.1) brightness(0.9) blur(0.2px); text-align: center;" />
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
        const isFixedMapDeployment = import.meta.env.VITE_GITHUB_PAGES === 'true';

        if (isFixedMapDeployment) {
            postcodeInput.hidden = true;
            errorText.hidden = true;
        }

        const handleGenerate = async () => {
            if (isFixedMapDeployment) {
                this.scene.start('Game');
                return;
            }

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
