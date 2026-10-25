import { Game as MainGame } from './scenes/Game';
import { MenuScene } from './scenes/MenuScene';
import { GameOverScene } from './scenes/GameOverScene';
import { DESIGN_HEIGHT, DESIGN_WIDTH } from './layout';
import { AUTO, Scale, Game } from 'phaser';

const config = {
    type: AUTO,
    parent: 'game-container',
    backgroundColor: '#ffffff',
    dom: {
        createContainer: true
    },
    scale: {
        mode: Scale.FIT,
        autoCenter: Scale.CENTER_BOTH,
        width: DESIGN_WIDTH,
        height: DESIGN_HEIGHT
    },
    scene: [
        MenuScene,
        MainGame,
        GameOverScene
    ]
};

const StartGame = (parent) => {
    return new Game({ ...config, parent });
};

export default StartGame;
