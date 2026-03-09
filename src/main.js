import { GameEngine } from './engine.js';

const game = new GameEngine();
game.init().catch(err => console.error("Помилка запуску:", err));

// Клік для входу в гру
document.addEventListener('click', () => {
    game.controls.lock();
});
