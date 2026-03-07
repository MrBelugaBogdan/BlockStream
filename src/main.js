// Головний запуск гри
import { GameEngine } from './engine.js';

const canvas = document.querySelector('#gameCanvas');
const engine = new GameEngine(canvas);

// Запускаємо двигун
engine.start();

console.log("BlockStream запущено!");
