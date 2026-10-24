import { Game as MainGame } from './scenes/Game';
import { MenuScene } from './scenes/MenuScene';
import { AUTO, Scale, Game } from 'phaser';

const config = {
    type: AUTO,
    parent: 'game-container',
    backgroundColor: '#ffffff',
    scale: {
        mode: Scale.RESIZE,
        autoCenter: Scale.CENTER_BOTH
    },
    scene: [
        MenuScene,
        MainGame
    ]
};

const StartGame = (parent) => {
    return new Game({ ...config, parent });
};

export default StartGame;
