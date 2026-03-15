export class UI {
    static createMainMenu(onStart) {
        // Очищаємо екран перед створенням меню
        const oldMenu = document.getElementById('main-menu');
        if (oldMenu) oldMenu.remove();

        const menu = document.createElement('div');
        menu.id = 'main-menu';
        menu.style = `position:absolute;top:0;left:0;width:100%;height:100%;background:#121212;color:white;display:flex;flex-direction:column;align-items:center;z-index:500;padding-top:40px;font-family:monospace;`;
        
        menu.innerHTML = `
            <h1 style="color:#4CAF50; font-size:48px; margin-bottom:10px;">BLOCKSTREAM</h1>
            <div id="content" style="width:550px; background:#1e1e1e; padding:25px; border-radius:10px; border:1px solid #333;"></div>
        `;
        document.body.appendChild(menu);

        const renderWorlds = () => {
            const content = document.getElementById('content');
            const worlds = JSON.parse(localStorage.getItem('blockstream_worlds') || '[]');
            
            // Вставляємо структуру разом із кнопкою +
            content.innerHTML = `
                <div style="display:flex; gap:5px; margin-bottom:20px;">
                    <input id="w-name" placeholder="Назва світу..." style="flex:1; padding:10px; background:#222; color:white; border:1px solid #444;">
                    <select id="w-mode" style="padding:10px; background:#222; color:white; border:1px solid #444;">
                        <option value="survival">Виживання</option>
                        <option value="creative">Креатив</option>
                    </select>
                    <button id="w-create" style="padding:10px 20px; background:#4CAF50; color:white; border:none; cursor:pointer;">+</button>
                </div>
                <div id="w-list" style="max-height:350px; overflow-y:auto; padding-right:10px; scrollbar-width: thin; scrollbar-color: #4CAF50 #1e1e1e;"></div>
            `;

            // Тепер кнопка ТОЧНО є в DOM, вішаємо клік:
            document.getElementById('w-create').onclick = () => {
                const name = document.getElementById('w-name').value;
                const mode = document.getElementById('w-mode').value;
                if(name) {
                    const currentWorlds = JSON.parse(localStorage.getItem('blockstream_worlds') || '[]');
                    currentWorlds.push({
                        name, 
                        mode, 
                        inventory: {grass: 10, stone: 5, wood: 0, leaves: 0}, 
                        health: 10
                    });
                    localStorage.setItem('blockstream_worlds', JSON.stringify(currentWorlds));
                    renderWorlds(); // Перемальовуємо список
                }
            };

            const list = document.getElementById('w-list');
            worlds.forEach((w, index) => {
                const row = document.createElement('div');
                row.style = "background:#2a2a2a; padding:12px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center; border-radius:5px; border-left: 4px solid #4CAF50;";
                row.innerHTML = `
                    <div><b>${w.name}</b> <br><small style="color:#888">${w.mode.toUpperCase()}</small></div>
                    <div style="display:flex; gap:10px;">
                        <button class="play-btn" style="background:#4CAF50; color:white; border:none; padding:8px 15px; cursor:pointer; border-radius:3px;">ГРАТИ</button>
                        <button class="opt-btn" style="background:#444; color:white; border:none; padding:8px 12px; cursor:pointer; border-radius:3px;">⋮</button>
                    </div>
                `;

                row.querySelector('.play-btn').onclick = () => { 
                    menu.remove(); 
                    onStart(w); 
                    document.body.requestPointerLock(); 
                };
                
                row.querySelector('.opt-btn').onclick = (e) => this.showWorldOptions(e, index, worlds, renderWorlds);
                list.appendChild(row);
            });
        };

        renderWorlds();
    }

    static showWorldOptions(e, index, worlds, refresh) {
        const existing = document.getElementById('opt-popup');
        if (existing) existing.remove();
        
        const popup = document.createElement('div');
        popup.id = 'opt-popup';
        popup.style = `position:fixed; left:${e.clientX - 100}px; top:${e.clientY}px; background:#333; padding:5px; border:1px solid #555; z-index:1000; display:flex; flex-direction:column; min-width:120px; box-shadow: 0 4px 10px rgba(0,0,0,0.5);`;
        popup.innerHTML = `
            <button id="pop-del" style="color:#ff5252; background:none; border:none; cursor:pointer; padding:10px; text-align:left; font-family:monospace;">🗑 Видалити</button>
            <button id="pop-copy" style="color:white; background:none; border:none; cursor:pointer; padding:10px; text-align:left; font-family:monospace;">📋 Копіювати</button>
        `;
        document.body.appendChild(popup);
        
        document.getElementById('pop-del').onclick = () => { 
            worlds.splice(index, 1); 
            localStorage.setItem('blockstream_worlds', JSON.stringify(worlds)); 
            refresh(); 
            popup.remove(); 
        };
        
        document.getElementById('pop-copy').onclick = () => { 
            const copy = {...worlds[index], name: worlds[index].name + " (Copy)"};
            worlds.push(copy); 
            localStorage.setItem('blockstream_worlds', JSON.stringify(worlds)); 
            refresh(); 
            popup.remove(); 
        };

        // Закриття при кліку повз
        setTimeout(() => {
            const closer = () => { popup.remove(); document.removeEventListener('click', closer); };
            document.addEventListener('click', closer);
        }, 10);
    }

    static createHotbar(inventoryItems, selectedSlot, hp, engine) {
        const existing = document.getElementById('hotbar-cont');
        if (existing) existing.remove();
        
        const cont = document.createElement('div');
        cont.id = 'hotbar-cont';
        cont.style = `position:fixed; bottom:20px; left:50%; transform:translateX(-50%); display:flex; flex-direction:column; align-items:center; gap:8px; z-index:100; pointer-events:none;`;
        
        const bar = document.createElement('div');
        bar.style = `display:flex; gap:8px; background:rgba(0,0,0,0.85); padding:10px; border-radius:12px; border:2px solid #444;`;
        
        inventoryItems.forEach((name, i) => {
            const count = engine.gameMode === 'creative' ? '∞' : (engine.playerData.inventory[name] || 0);
            const s = document.createElement('div');
            s.style = `width:50px; height:65px; border:2px solid ${i === selectedSlot ? '#4CAF50' : '#555'}; display:flex; flex-direction:column; align-items:center; color:white; font-size:12px; background:rgba(255,255,255,0.05); border-radius:5px; transition: 0.2s;`;
            
            // Тут ми додаємо "іконку" - якщо файлу немає, буде просто колір
            s.innerHTML = `
                <div style="width:35px; height:35px; background:url('./assets/${name}.png'); background-size:cover; image-rendering: pixelated; margin-top:5px; background-color:#333;"></div> 
                <span style="margin-top:2px; font-weight:bold;">${count}</span>
            `;
            bar.appendChild(s);
        });

        if (engine.gameMode === 'survival') {
            const hpBar = document.createElement('div');
            hpBar.style = "color:#ff5252; font-size:18px; text-shadow: 1px 1px #000; font-weight:bold;";
            hpBar.innerText = "❤".repeat(hp);
            cont.appendChild(hpBar);
        }
        cont.appendChild(bar);
        document.body.appendChild(cont);
    }
}
