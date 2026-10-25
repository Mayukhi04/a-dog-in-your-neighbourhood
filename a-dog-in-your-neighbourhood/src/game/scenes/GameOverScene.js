import { Scene } from 'phaser';
import { DS_TOP_SCREEN, DESIGN_HEIGHT, DESIGN_WIDTH } from '../layout';

export class GameOverScene extends Scene {
    constructor() {
        super('GameOverScene');
    }

    preload() {
        this.load.setPath('assets');
        this.load.image('menuBackground', 'ds_top.jpeg');
        this.load.image('nightField', 'night_field.jpg');
        this.load.audio('click', 'audio/click.mp3');
        this.load.audio('slow_song', 'audio/slow_song.mp3');
    }

    create(data = {}) {
        const clickSfx = this.sound.add('click', { volume: 0.5 });
        this.slowSong = this.sound.add('slow_song', {
            volume: 0.55,
            loop: true
        });
        this.slowSong.play();

        this.events.once('shutdown', () => {
            if (this.slowSong) {
                this.slowSong.stop();
                this.slowSong.destroy();
            }
        });
        // ds overlay
        const cx = DESIGN_WIDTH / 2;

        const bgContainer = this.add.container(0, 0);
        bgContainer.setDepth(0);

        const dsBg = this.add.image(cx, DESIGN_HEIGHT - 537, 'menuBackground')
            .setOrigin(0.5, 0);
        dsBg.setDisplaySize(DESIGN_WIDTH, 537);
        bgContainer.add(dsBg);

        // background + dog
        const fieldBg = this.add.image(
            DS_TOP_SCREEN.x + DS_TOP_SCREEN.width / 2,
            DS_TOP_SCREEN.y + DS_TOP_SCREEN.height / 2,
            'nightField'
        );
        fieldBg.setDisplaySize(DS_TOP_SCREEN.width, DS_TOP_SCREEN.height);
        fieldBg.setOrigin(0.5);
        fieldBg.setDepth(2);
        bgContainer.add(fieldBg);

        // menu text/play again button
        this.add.text(cx, DS_TOP_SCREEN.y + 90, 'Game Over!', {
            fontFamily: 'PixelFont',
            fontSize: '36px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6,
            align: 'center',
        }).setOrigin(0.5);

        this.add.text(cx, DS_TOP_SCREEN.y + 160, `Score: ${data.score ?? 0}`, {
            fontFamily: 'PixelFont',
            fontSize: '24px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4,
            align: 'center',
        }).setOrigin(0.5);

        const playAgainButton = this.add.dom(cx, DS_TOP_SCREEN.y + 235).createFromHTML(`
            <button type="button" style="display: inline-block; width: fit-content; height: auto; border: 0; margin: 0; padding: 0; line-height: 1; background: transparent; color: rgba(255,255,255,0.9); font-size: 22px; letter-spacing: 0.08em; cursor: pointer; text-decoration: none; transition: color 0.15s ease, opacity 0.15s ease; font-family: 'PixelFont', sans-serif;">PLAY AGAIN</button>
        `);
        playAgainButton.setOrigin(0.5);
        playAgainButton.setDepth(10);

        const playAgainLink = playAgainButton.node.querySelector('button');
        playAgainLink.addEventListener('click', () => {
            clickSfx.play();
            this.scene.start('MenuScene');
        });
        this.input.keyboard.disableGlobalCapture(); // Allows keys to function normally
        this.input.keyboard.on('keydown-ENTER', () => {
            this.scene.start('MenuScene');
        });
        playAgainLink.addEventListener('mouseenter', () => {
            playAgainLink.style.color = '#ffffff';
            playAgainLink.style.opacity = '1';
        });
        playAgainLink.addEventListener('mouseleave', () => {
            playAgainLink.style.color = 'rgba(255,255,255,0.8)';
            playAgainLink.style.opacity = '0.9';
        });
    }
}
