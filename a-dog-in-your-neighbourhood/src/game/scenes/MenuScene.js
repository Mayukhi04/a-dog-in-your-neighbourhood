import { Scene } from 'phaser';
import { DS_TOP_SCREEN, DESIGN_HEIGHT, DESIGN_WIDTH } from '../layout';
import { CITIES } from '../cities';

function parsePostcodeCsvFile(contents) {
    return (contents || '')
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
            const cleaned = line.replace(/^"|"$/g, '').replace(/""/g, '"');
            const [postcode] = cleaned.split(',');
            return postcode ? postcode.replace(/"/g, '').trim() : '';
        })
        .filter((postcode) => postcode && postcode.length >= 4);
}

async function loadRandomPostcodes() {
    const baseUrl = new URL(import.meta.env.BASE_URL || '/', window.location.href);
    const postcodeDirectory = new URL('postcodes/', baseUrl);
    const manifestUrl = new URL('postcodes/index.json', baseUrl);

    try {
        const manifestResponse = await fetch(manifestUrl);
        if (manifestResponse.ok) {
            const fileNames = await manifestResponse.json();
            if (Array.isArray(fileNames) && fileNames.length > 0) {
                const datasets = await Promise.all(
                    fileNames.map(async (fileName) => {
                        try {
                            const csvUrl = new URL(fileName, postcodeDirectory);
                            const response = await fetch(csvUrl);
                            if (!response.ok) {
                                return [];
                            }
                            const contents = await response.text();
                            return parsePostcodeCsvFile(contents);
                        } catch (error) {
                            console.warn('Failed to load postcode CSV', error);
                            return [];
                        }
                    })
                );

                const values = [...new Set(datasets.flat())].filter(Boolean);
                if (values.length > 0) {
                    return values;
                }
            }
        }
    } catch (error) {
        console.warn('postcode catalogue lookup failed', error);
    }

    try {
        const response = await fetch(new URL('postcodes/ab.csv', postcodeDirectory));
        if (!response.ok) return [];
        const contents = await response.text();
        return [...new Set(parsePostcodeCsvFile(contents))].filter(Boolean);
    } catch (error) {
        console.warn('postcode fallback fetch failed', error);
        return [];
    }
}

export class MenuScene extends Scene {
    hardModeEnabled = false;

    constructor() {
        super('MenuScene');
    }

    preload() {
        this.load.setPath('assets');
        this.load.image('menuBackground', 'ds_top.jpeg');
        this.load.image('menuField', 'field.jpeg');
        this.load.image('notesButton', 'notes.png');
        this.load.image('notePage', 'note_page.png');
        this.load.audio('click', 'audio/click.mp3');
        this.load.audio('dice_roll', 'audio/dice_roll.mp3');
        this.load.audio('slow_song', 'audio/slow_song.mp3');

        this.load.spritesheet('menuDog', 'dog.png', {
            frameWidth: 32,
            frameHeight: 32
        });
        this.load.spritesheet('menuPigeon', 'pigeon_eat-Sheet.png', {
            frameWidth: 32,
            frameHeight: 32
        });
    }

    async create() {
        const clickSfx = this.sound.add('click', { volume: 0.5 });
        const diceRollSfx = this.sound.add('dice_roll', { volume: 0.7 });
        this.sound.pauseOnBlur = false;
        this.slowSong = this.sound.add('slow_song', {
            volume: 0.55,
            loop: true
        });

        const startMenuMusic = () => {
            if (!this.slowSong) return;

            if (this.sound.context && this.sound.context.state === 'suspended') {
                this.sound.context.resume();
            }

            if (!this.slowSong.isPlaying) {
                this.slowSong.play();
            }
        };

        this.input.once('pointerdown', startMenuMusic, this);
        this.input.keyboard?.on('keydown', startMenuMusic, this);

        this.events.once('shutdown', () => {
            if (this.slowSong) {
                this.slowSong.stop();
                this.slowSong.destroy();
            }
        });
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

        let postcodeCatalogue = [];
        loadRandomPostcodes().then((values) => {
            postcodeCatalogue = values || [];
        }).catch(() => {
            postcodeCatalogue = [];
        });

        const diceIconUrl = `${import.meta.env.BASE_URL}assets/falling_dice.png`;
        const form = this.add.dom(cx, DS_TOP_SCREEN.y + DS_TOP_SCREEN.height * 0.82 + 8).createFromHTML(`
            <div style="display:flex; flex-direction:column; align-items:center; gap:14px; font-family: 'PixelFont', sans-serif;">
                <style>
                    input::placeholder {
                        color: rgba(255,255,255,0.95);
                        opacity: 1;
                    }
                    #city-picker {
                        display: none;
                        position: relative;
                        width: 280px;
                        font-family: 'PixelFont', sans-serif;
                    }
                    #city-picker-row {
                        display: none;
                        align-items: center;
                        gap: 10px;
                        justify-content: center;
                    }
                    #city-picker-trigger,
                    #city-picker-options button {
                        width: 100%;
                        border: 4px solid rgba(255,255,255,0.9);
                        border-radius: 0;
                        background: rgba(24, 31, 42, 0.7);
                        color: #ffffff;
                        font: 16px 'PixelFont', sans-serif;
                        text-transform: uppercase;
                        box-shadow: 0 0 0 2px rgba(0,0,0,0.45), inset 0 0 0 2px rgba(255,255,255,0.18);
                        appearance: none;
                        -webkit-appearance: none;
                        image-rendering: pixelated;
                        -webkit-font-smoothing: none;
                        text-align: center;
                        cursor: pointer;
                    }
                    #city-picker-trigger {
                        height: 42px;
                        padding: 0 8px;
                        filter: contrast(1.1) brightness(0.9) blur(0.2px);
                    }
                    #city-picker-options {
                        position: absolute;
                        z-index: 20;
                        bottom: calc(100% + 4px);
                        left: 0;
                        display: none;
                        width: 100%;
                        max-height: 96px;
                        overflow-y: auto;
                        background: rgba(24, 31, 42, 0.96);
                        box-shadow: 0 0 0 2px rgba(0,0,0,0.6);
                    }
                    #city-picker-options.open {
                        display: block;
                    }
                    #city-picker-options button {
                        min-height: 32px;
                        padding: 2px 8px;
                        border-width: 2px 4px 0;
                    }
                    #city-picker-options button:hover,
                    #city-picker-options button:focus {
                        background: rgba(80, 115, 74, 0.95);
                        outline: none;
                    }
                </style>
                <div id="postcode-row" style="display:flex; align-items:center; gap:10px; justify-content:center;">
                    <input type="text" placeholder="Please type your postcode here" value="" style="width: 280px; height: 42px; border: 4px solid rgba(255,255,255,0.9); border-radius: 0; background: rgba(24, 31, 42, 0.7); color: #ffffff; font-size: 16px; text-transform: uppercase; padding: 0 8px; outline: none; box-sizing: border-box; font-family: 'PixelFont', sans-serif; box-shadow: 0 0 0 2px rgba(0,0,0,0.45), inset 0 0 0 2px rgba(255,255,255,0.18); appearance: none; -webkit-appearance: none; image-rendering: pixelated; -webkit-font-smoothing: none; font-smooth: none; text-rendering: geometricPrecision; filter: contrast(1.1) brightness(0.9) blur(0.2px); text-align: center;" />
                    <button id="random-postcode" type="button" aria-label="Random postcode" title="Random postcode" style="height: 42px; min-width: 42px; width: 42px; padding: 0; border: 4px solid rgba(255,255,255,0.9); border-radius: 0; background: rgba(24, 31, 42, 0.7); color: #ffffff; font-size: 18px; cursor:pointer; font-family: 'PixelFont', sans-serif; box-shadow: 0 0 0 2px rgba(0,0,0,0.45), inset 0 0 0 2px rgba(255,255,255,0.18); line-height: 1; display:flex; align-items:center; justify-content:center; background-image: url('${diceIconUrl}'); background-size: 72% 72%; background-repeat: no-repeat; background-position: center; image-rendering: pixelated; image-rendering: crisp-edges; -ms-interpolation-mode: nearest-neighbor; filter: contrast(1.15) saturate(1.1); transform: translateZ(0);"> </button>
                </div>
                <div id="city-picker-row">
                    <div id="city-picker">
                        <button id="city-picker-trigger" type="button" aria-haspopup="listbox" aria-expanded="false">Choose a city</button>
                        <div id="city-picker-options" role="listbox" aria-label="Choose a city">
                            ${CITIES.map(({ value, label }) => `<button type="button" role="option" data-city="${value}" aria-selected="false">${label}</button>`).join('')}
                        </div>
                    </div>
                    <button id="random-city" type="button" aria-label="Random city" title="Random city" style="height: 42px; min-width: 42px; width: 42px; padding: 0; border: 4px solid rgba(255,255,255,0.9); border-radius: 0; background: rgba(24, 31, 42, 0.7); color: #ffffff; font-size: 18px; cursor:pointer; font-family: 'PixelFont', sans-serif; box-shadow: 0 0 0 2px rgba(0,0,0,0.45), inset 0 0 0 2px rgba(255,255,255,0.18); line-height: 1; display:flex; align-items:center; justify-content:center; background-image: url('${diceIconUrl}'); background-size: 72% 72%; background-repeat: no-repeat; background-position: center; image-rendering: pixelated; image-rendering: crisp-edges; filter: contrast(1.15) saturate(1.1); transform: translateZ(0);"> </button>
                </div>
                <div style="display:flex; justify-content:center; align-items:center; min-height: 28px;">
                    <span id="start-link" style="display: inline-block; width: fit-content; line-height: 1; color: rgba(255,255,255,0.9); font-size: 22px; letter-spacing: 0.08em; cursor: pointer; text-decoration: none; transition: color 0.15s ease, opacity 0.15s ease; font-family: 'PixelFont', sans-serif;">START</span>
                </div>
                <div id="postcode-error" style="min-height: 18px; color: #ffe3e3; font-size: 14px; text-align: center; max-width: 300px; font-weight: 700;"> </div>
            </div>
        `);
        form.setOrigin(0.5);
        form.setDepth(10);

        const postcodeInput = form.node.querySelector('input');
        const postcodeRow = form.node.querySelector('#postcode-row');
        const cityPicker = form.node.querySelector('#city-picker');
        const cityPickerRow = form.node.querySelector('#city-picker-row');
        const cityPickerTrigger = form.node.querySelector('#city-picker-trigger');
        const cityPickerOptions = form.node.querySelector('#city-picker-options');
        const randomPostcodeButton = form.node.querySelector('#random-postcode');
        const randomCityButton = form.node.querySelector('#random-city');
        const submitButton = form.node.querySelector('#start-link');
        const errorText = form.node.querySelector('#postcode-error');
        const isCityPickerMode = import.meta.env.VITE_GITHUB_PAGES === 'true';
        let selectedCity = '';
        form.node.addEventListener('click', () => clickSfx.play());
        errorText.style.color = this.hardModeEnabled ? '#d8ffd0' : '#ffe3e3';
        errorText.textContent = this.hardModeEnabled ? 'Hard mode enabled!' : '';

        if (isCityPickerMode) {
            postcodeRow.style.display = 'none';
            postcodeInput.style.display = 'none';
            randomPostcodeButton.style.display = 'none';
            cityPicker.style.display = 'block';
            cityPickerRow.style.display = 'flex';
            randomCityButton.style.display = 'flex';
        } else {
            postcodeRow.style.display = 'flex';
            postcodeInput.style.display = 'block';
            randomPostcodeButton.style.display = 'inline-flex';
            cityPicker.style.display = 'none';
            cityPickerRow.style.display = 'none';
            randomCityButton.style.display = 'none';
        }

        const handleGenerate = async () => {
            if (isCityPickerMode) {
                if (!selectedCity) {
                    errorText.textContent = 'Please choose a city.';
                    return;
                }

                errorText.textContent = '';
                this.scene.start('Game', { city: selectedCity, hardMode: false });
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

                const mapData = await response.json();
                this.scene.start('Game', {
                    postcode: cleanPostcode,
                    generatedMap: mapData,
                    hardMode: this.hardModeEnabled
                });
            } catch (error) {
                console.error(error);
                errorText.textContent = 'Invalid postcode';
            }
        };

        randomPostcodeButton.addEventListener('click', (event) => {
            event.stopPropagation();
            diceRollSfx.play();

            if (postcodeCatalogue.length === 0) {
                errorText.textContent = 'No postcode data found.';
                return;
            }

            const randomPostcode = postcodeCatalogue[Math.floor(Math.random() * postcodeCatalogue.length)];
            postcodeInput.value = randomPostcode.toUpperCase();
            errorText.textContent = this.hardModeEnabled ? 'Hard mode enabled!' : '';
        });

        randomCityButton.addEventListener('click', (event) => {
            event.stopPropagation();
            diceRollSfx.play();

            const city = CITIES[Math.floor(Math.random() * CITIES.length)];
            selectedCity = city.value;
            cityPickerTrigger.textContent = city.label;
            cityPickerTrigger.setAttribute('aria-expanded', 'false');
            cityPickerOptions.classList.remove('open');
            cityPickerOptions.querySelectorAll('[role="option"]').forEach((option) => {
                option.setAttribute('aria-selected', String(option.dataset.city === selectedCity));
            });
            errorText.textContent = '';
        });

        pigeon.setInteractive({ useHandCursor: true });
        pigeon.on('pointerdown', () => {
            clickSfx.play();

            this.hardModeEnabled = !this.hardModeEnabled;
            errorText.style.color = this.hardModeEnabled ? '#d8ffd0' : '#ffe3e3';
            errorText.textContent = this.hardModeEnabled ? 'Hard mode enabled!' : '';
        });

        if (randomPostcodeButton) {
            randomPostcodeButton.style.opacity = '1';
            randomPostcodeButton.style.pointerEvents = 'auto';
        }

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

        cityPickerTrigger.addEventListener('click', () => {
            const isOpen = cityPickerOptions.classList.toggle('open');
            cityPickerTrigger.setAttribute('aria-expanded', String(isOpen));
        });
        cityPickerOptions.addEventListener('click', (event) => {
            const option = event.target.closest('[data-city]');
            if (!option) {
                return;
            }

            selectedCity = option.dataset.city;
            cityPickerTrigger.textContent = option.textContent;
            cityPickerTrigger.setAttribute('aria-expanded', 'false');
            cityPickerOptions.classList.remove('open');
            cityPickerOptions.querySelectorAll('[role="option"]').forEach((cityOption) => {
                cityOption.setAttribute('aria-selected', String(cityOption === option));
            });
            errorText.textContent = '';
        });
        cityPicker.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                cityPickerOptions.classList.remove('open');
                cityPickerTrigger.setAttribute('aria-expanded', 'false');
                cityPickerTrigger.focus();
            }
        });
        const closeCityPicker = (event) => {
            if (!cityPicker.contains(event.target)) {
                cityPickerOptions.classList.remove('open');
                cityPickerTrigger.setAttribute('aria-expanded', 'false');
            }
        };
        document.addEventListener('pointerdown', closeCityPicker);
        this.events.once('shutdown', () => {
            document.removeEventListener('pointerdown', closeCityPicker);
        });

        const notesButton = this.add.image(
            DS_TOP_SCREEN.x + 18,
            DS_TOP_SCREEN.y + 18,
            'notesButton'
        ).setOrigin(0).setDisplaySize(26, 28).setDepth(20);
        notesButton.setInteractive({ useHandCursor: true });
        notesButton.setName('notes-button');

        const noteOverlay = this.add.dom(
            DS_TOP_SCREEN.x + DS_TOP_SCREEN.width / 2,
            DS_TOP_SCREEN.y + DS_TOP_SCREEN.height / 2
        ).createFromHTML(`
            <div style="position:relative; width:${DS_TOP_SCREEN.width}px; height:${DS_TOP_SCREEN.height}px; display:flex; align-items:center; justify-content:center; background:rgba(16,26,22,0.78);">
                <img src="${import.meta.env.BASE_URL}assets/note_page.png" alt="Notes" style="display:block; max-width:calc(100% - 36px); max-height:calc(100% - 36px); object-fit:contain; image-rendering:pixelated;">
            </div>
        `).setOrigin(0.5).setDepth(30).setVisible(false);

        const setNotesOpen = (isOpen) => {
            noteOverlay.setVisible(isOpen);
        };
        const closeNotes = () => setNotesOpen(false);

        notesButton.on('pointerdown', () => {
            clickSfx.play();
            setNotesOpen(true);
        });
        noteOverlay.node.addEventListener('click', () => {
            clickSfx.play();
            closeNotes();
        });
        this.input.keyboard?.on('keydown-ESC', closeNotes);
        this.events.once('shutdown', () => {
            this.input.keyboard?.off('keydown-ESC', closeNotes);
        });
    }
}
