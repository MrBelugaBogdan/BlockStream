// В init() додамо створення простого меню через JS
init() {
    this.createMenu(); // Створюємо меню перед запуском
    // ... весь інший код init ...
}

createMenu() {
    const menu = document.createElement('div');
    menu.id = 'main-menu';
    menu.style = `
        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.8); display: flex; flex-direction: column;
        justify-content: center; align-items: center; z-index: 100;
        color: white; font-family: Arial, sans-serif;
    `;
    menu.innerHTML = `
        <h1>BLOCKSTREAM</h1>
        <button id="start-btn" style="padding: 15px 40px; font-size: 20px; cursor: pointer;">ГРАТИ</button>
        <p style="margin-top: 20px;">Керування: WASD + Space. Ламати: ЛКМ. Ставити: ПКМ.</p>
    `;
    document.body.appendChild(menu);

    document.getElementById('start-btn').onclick = () => {
        menu.style.display = 'none';
        this.controls.lock();
    };
}

// У методі animate() переконайся, що checkCollision працює:
checkCollision(vector) {
    this.collisionRaycaster.set(this.camera.position, vector);
    // Шукаємо зіткнення серед усіх об'єктів сцени
    const intersects = this.collisionRaycaster.intersectObjects(this.scene.children);
    return intersects.length > 0 && intersects[0].distance < 0.8;
}
