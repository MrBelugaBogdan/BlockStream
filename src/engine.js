import { Inventory } from './inventory.js'; // Імпортуємо
// ... інші імпорти ...

export class GameEngine {
    constructor() {
        // ... твій конструктор ...
        this.bigInventory = new Inventory(this); // Створюємо об'єкт
    }

    init() {
        // ... твій код ініціалізації ...
        
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            // Кнопка E відкриває інвентар
            if (e.code === 'KeyE') {
                this.bigInventory.toggle();
            }
            // ... інша логіка клавіш ...
        });
        
        // ... решта коду ...
    }
    
    // Переконайся, що в методі updateUI() викликається UI.createHotbar правильно
}
