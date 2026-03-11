export class UI {
    static createMainMenu(onStart) {
        const menu = document.createElement('div');
        menu.id = 'main-menu';
        menu.style = `position:absolute;top:0;left:0;width:100%;height:100%;background:#121212;color:white;display:flex;flex-direction:column;align-items:center;z-index:500;padding-top:40px;font-family:monospace;`;
        
        menu.innerHTML = `
            <h1 style="color:#4CAF50; font-size:48px; margin-bottom:10px;">BLOCKSTREAM</h1>
            <div style="display:flex; gap:10px; margin-bottom:20px;">
                <button id="tab-multi" style="padding:12px; cursor:pointer; background:#333; color:white; border:none;">ОНЛАЙН</button>
                <button id="tab-local" style="padding:12px; cursor:pointer; background:#4CAF50; color:white; border:none;">МОЇ СЕРВЕРИ</button>
            </div>
            <div id="content" style="width:550px; background:#1e1e1e; padding:25px; border-radius:10px; border:1px solid #333;"></div>
        `;
        document.body.appendChild(menu);

        const renderWorlds = () => {
            const content = document.getElementById('content');
            const worlds = JSON.parse(localStorage.getItem('blockstream_worlds') || '[]');
            content.innerHTML = `
                <div style="display:flex; gap:5px; margin-bottom:20px;">
                    <input id="w-name" placeholder="Назва..." style="flex:1; padding:10px; background:#222; color:white; border:1px solid #444;">
                    <select id="w-mode" style="padding:10px; background:#222; color:white; border:1px solid #444;">
                        <option value="survival">Виживання</option>
                        <option value="creative">Креатив</option>
                    </select>
                    <button id="w-create" style="padding:10px 20px; background:#4CAF50; color:white; border:none; cursor:pointer;">+</button>
                </div>
                <div id="w-list"></div>
            `;

            document.getElementById('w-create').onclick = () => {
                const name = document.getElementById('w-name').value;
                const mode = document.getElementById('w-mode').value;
                if(name) {
                    worlds.push({name, mode, inventory: {grass: 10, stone: 5, wood: 0, leaves: 0}, health: 10});
                    localStorage.setItem('blockstream_worlds', JSON.stringify(worlds));
                    renderWorlds(); // ПЕРЕЗАВАНТАЖУЄМО СПИСОК (мишка НЕ зникає)
                }
            };

            const list = document.getElementById('w-list');
            worlds.forEach((w, index) => {
                const row = document.createElement('div');
                row.style = "background:#2a2a2a; padding:10px; margin-bottom:8px; display:flex; justify-content:space-between; border-radius:5px;";
                row.innerHTML = `<span>${w.name} (${w.mode})</span> <button class="play">ГРАТИ</button>`;
                row.querySelector('.play').onclick = () => { 
                    menu.remove(); 
                    onStart(w); 
                    document.body.requestPointerLock(); 
                };
                list.appendChild(row);
            });
        };
        renderWorlds();
    }

    static createInGameUI(engine) {
        // Кнопка інвентаря (три крапки)
        const btn = document.createElement('div');
        btn.innerHTML = '⋮';
        btn.style = `position:fixed; top:20px; right:20px; color:white; font-size:30px; cursor:pointer; z-index:600;`;
        btn.onclick = () => this.toggleInventory(engine);
        document.body.appendChild(btn);
    }

    static toggleInventory(engine) {
        const existing = document.getElementById('inv-menu');
        if (existing) {
            existing.remove();
            document.body.requestPointerLock();
            return;
        }

        document.exitPointerLock();
        const inv = document.createElement('div');
        inv.id = 'inv-menu';
        inv.style = `position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); width:400px; height:300px; background:rgba(0,0,0,0.9); border:2px solid #4CAF50; color:white; padding:20px; z-index:700; display:grid; grid-template-columns: repeat(4, 1fr); gap:10px;`;
        
        Object.entries(engine.playerData.inventory).forEach(([item, count]) => {
            const slot = document.createElement('div');
            slot.style = `border:1px solid #555; padding:10px; text-align:center;`;
            slot.innerHTML = `<div style="font-size:10px;">${item.toUpperCase()}</div><div style="font-size:20px;">${count}</div>`;
            inv.appendChild(slot);
        });

        const close = document.createElement('button');
        close.innerText = 'ЗАКРИТИ';
        close.style = `grid-column: span 4; background:#4CAF50; border:none; color:white; padding:10px; cursor:pointer;`;
        close.onclick = () => { inv.remove(); document.body.requestPointerLock(); };
        inv.appendChild(close);

        document.body.appendChild(inv);
    }

    static createHotbar(inventory, selectedSlot, hp) {
        const existing = document.getElementById('hotbar-cont');
        if (existing) existing.remove();
        
        const cont = document.createElement('div');
        cont.id = 'hotbar-cont';
        cont.style = `position:fixed; bottom:20px; left:50%; transform:translateX(-50%); display:flex; flex-direction:column; align-items:center; gap:5px;`;
        
        const hpBar = document.createElement('div');
        hpBar.style = `color:#ff5252; font-weight:bold; letter-spacing:2px;`;
        hpBar.innerText = "❤".repeat(hp);
        
        const bar = document.createElement('div');
        bar.style = `display:flex; gap:8px; background:rgba(0,0,0,0.8); padding:8px; border-radius:10px; border:1px solid #444;`;
        
        ['grass', 'stone', 'wood', 'leaves'].forEach((name, i) => {
            const s = document.createElement('div');
            s.className = 'slot';
            s.style = `width:45px;height:45px;border:2px solid ${i === selectedSlot ? '#4CAF50' : '#555'}; color:white; text-align:center; line-height:45px;`;
            s.innerText = name[0].toUpperCase();
            bar.appendChild(s);
        });

        cont.appendChild(hpBar);
        cont.appendChild(bar);
        document.body.appendChild(cont);
    }
}
