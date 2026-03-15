export class Inventory {
    constructor(engine) {
        this.engine = engine;
        this.isOpen = false;
        this.draggedItem = null;
        
        // Описи блоків
        this.descriptions = {
            grass: "Блок землі з травою. М'який та приємний на дотик.",
            stone: "Міцний кругляк. Чудово підходить для будівництва замків.",
            wood: "Свіжа деревина. Пахне лісом та пригодами.",
            leaves: "Густе листя. Через нього майже не видно сонця."
        };
    }

    toggle() {
        this.isOpen = !this.isOpen;
        if (this.isOpen) {
            document.exitPointerLock();
            this.render();
        } else {
            const ui = document.getElementById('big-inventory');
            if (ui) ui.remove();
            document.body.requestPointerLock();
        }
    }

    render() {
        const existing = document.getElementById('big-inventory');
        if (existing) existing.remove();

        const inv = document.createElement('div');
        inv.id = 'big-inventory';
        inv.style = `position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); width:500px; height:400px; background:rgba(20,20,20,0.95); border:3px solid #4CAF50; border-radius:15px; color:white; padding:20px; z-index:1000; font-family:monospace; display:flex; flex-direction:column;`;
        
        inv.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <h2 style="margin:0; color:#4CAF50;">ІНВЕНТАР ПЕРСОНАЖА</h2>
                <button id="close-inv" style="background:none; border:none; color:#ff5252; cursor:pointer; font-size:20px;">✖</button>
            </div>
            <div style="display:flex; gap:20px; flex:1;">
                <div id="inv-grid" style="display:grid; grid-template-columns: repeat(4, 1fr); gap:10px; flex:1;"></div>
                <div id="inv-details" style="width:180px; background:rgba(255,255,255,0.05); padding:15px; border-radius:10px; border:1px solid #333;">
                    <h3 id="det-name" style="margin-top:0; color:#4CAF50;">Оберіть блок</h3>
                    <p id="det-desc" style="font-size:12px; color:#ccc; line-height:1.4;">Натисніть на предмет, щоб побачити опис.</p>
                </div>
            </div>
        `;

        document.body.appendChild(inv);
        document.getElementById('close-inv').onclick = () => this.toggle();

        const grid = document.getElementById('inv-grid');
        this.engine.inventoryItems.forEach(item => {
            const count = this.engine.playerData.inventory[item] || 0;
            const slot = document.createElement('div');
            slot.style = `background:#2a2a2a; border:2px solid #444; border-radius:8px; display:flex; flex-direction:column; align-items:center; justify-content:center; cursor:pointer; transition:0.2s; position:relative;`;
            slot.innerHTML = `
                <div style="width:40px; height:40px; background:url('./assets/${item}.png'); background-size:cover; image-rendering:pixelated;"></div>
                <span style="font-size:12px; font-weight:bold;">${this.engine.gameMode === 'creative' ? '∞' : count}</span>
            `;

            // Наведення/Затискання для опису
            slot.onmousedown = () => {
                document.getElementById('det-name').innerText = item.toUpperCase();
                document.getElementById('det-desc').innerText = this.descriptions[item] || "Звичайний блок.";
                slot.style.borderColor = "#4CAF50";
            };

            grid.appendChild(slot);
        });
    }
}
