// Перевірка наявності ядра перед запуском
if (window.GameEngine) {
    const engine = new window.GameEngine();
    engine.init();
    console.log("BlockStream Engine запущено успішно!");
} else {
    console.error("Помилка: GameEngine не знайдено. Перевірте engine.js");
}
