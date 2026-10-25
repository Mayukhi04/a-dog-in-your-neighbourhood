import StartGame from './game/main';

document.addEventListener('DOMContentLoaded', async () => {
    await document.fonts.load('34px PixelFont');
    StartGame('game-container');
});