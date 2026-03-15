export class UI {
    static createMainMenu(onStart) {
        const menu = document.createElement('div');
        menu.id = 'main-menu';
        menu.style = `position:absolute;top:0;left:0;width:100%;height:100%;background:#121212;color:white;display:flex;flex-direction:column;align-items:center;z-index:500;padding-top:40px;font-family:monospace;`;
        
        menu.innerHTML = `
            <h1 style="color:#4CAF50; font-size:48px; margin-bottom:10px;">BLOCKSTREAM</h1>
            <div id="content" style="width:550px; background:#1e1e1e; padding:25px; border-radius:10px; border:1px solid #333; overflow: hidden;"></div>
        `;
        document.body.appendChild(menu);

        const renderWorlds = () => {
            const content = document.getElementById('content');
            const worlds = JSON.parse(localStorage.getItem('blockstream_worlds') || '[]');
            content.innerHTML = `
                <div style="display:flex; gap:5px; margin-bottom:20px;">
                    <input id="w-name" placeholder="Назва світу..." style="flex:1; padding:10px; background:#222; color:white; border:1px solid #444;">
                    <select id="w-mode" style="padding:10px; background:#222; color:white; border:1px solid #444;">
                        <option value="survival">Виживання</option>
                        <option value="creative">Креатив</option>
                    </select>
                    <button id="w-create" style="padding:10px 20px; background:#4CAF50; color:white; border:none; cursor:pointer;">+</button>
                </div>
                <div id="w-list" style="max-height:300px; overflow-y:auto; padding-right:10px;"></div>
            `;

            const list = document.getElementById('w-list');
            worlds.forEach((w, index) => {
                const row = document.createElement('div');
                row.style = "background:#2a2a2a; padding:12px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center; border-radius:5px;";
                row.innerHTML = `
                    <div><b>${w.name}</b> <br><small style="color:#888">${w.mode}</small></div>
                    <div style="display:flex; gap:10px;">
                        <button class="play-btn" style="background:#4CAF50; color:white; border:none; padding:8px 15px; cursor:pointer;">ГРАТИ</button>
                        <button class="opt-btn" style="background:#444; color:white; border:none; padding:8px; cursor:pointer;">⋮</button>
                    </div>
                `;

                row.querySelector('.play-btn').onclick = () => { menu.remove(); onStart(w); document.body.requestPointerLock(); };
                row.querySelector('.opt-btn').onclick = (e) => this.showWorldOptions(e, index, worlds, renderWorlds);
                list.appendChild(row);
            });
        };

        document.getElementById('w-create').onclick = () => {
            const name = document.getElementById('w-name').value;
            const mode = document.getElementById('w-mode').value;
            if(name) {
                const worlds = JSON.parse(localStorage.getItem('blockstream_worlds') || '[]');
                worlds.push({name, mode, inventory: {grass: 0, stone: 0, wood: 0, leaves: 0}, health: 10});
                localStorage.setItem('blockstream_worlds', JSON.stringify(worlds));
                renderWorlds();
            }
        };

        renderWorlds();
    }

    static showWorldOptions(e, index, worlds, refresh) {
        const existing = document.getElementById('opt-popup');
        if (existing) existing.remove();
        const popup = document.createElement('div');
        popup.id = 'opt-popup';
        popup.style = `position:fixed; left:${e.clientX}px; top:${e.clientY}px; background:#333; padding:10px; border:1px solid #555; z-index:1000; display:flex; flex-direction:column;`;
        popup.innerHTML = `
            <button id="pop-del" style="color:red; background:none; border:none; cursor:pointer; padding:5px;">Видалити</button>
            <button id="pop-copy" style="color:white; background:none; border:none; cursor:pointer; padding:5px;">Копіювати</button>
        `;
        document.body.appendChild(popup);
        
        document.getElementById('pop-del').onclick = () => { worlds.splice(index, 1); localStorage.setItem('blockstream_worlds', JSON.stringify(worlds)); refresh(); popup.remove(); };
        document.getElementById('pop-copy').onclick = () => { worlds.push({...worlds[index], name: worlds[index].name + " Copy"}); localStorage.setItem('blockstream_worlds', JSON.stringify(worlds)); refresh(); popup.remove(); };
        setTimeout(() => document.addEventListener('click', () => popup.remove(), {once:true}), 10);
    }

    static createHotbar(inventoryItems, selectedSlot, hp, engine) {
        const existing = document.getElementById('hotbar-cont');
        if (existing) existing.remove();
        
        const cont = document.createElement('div');
        cont.id = 'hotbar-cont';
        cont.style = `position:fixed; bottom:20px; left:50%; transform:translateX(-50%); display:flex; flex-direction:column; align-items:center; gap:5px; z-index:100;`;
        
        const bar = document.createElement('div');
        bar.style = `display:flex; gap:8px; background:rgba(0,0,0,0.8); padding:8px; border-radius:10px; border:2px solid #444;`;
        
        inventoryItems.forEach((name, i) => {
            const count = engine.gameMode === 'creative' ? '∞' : (engine.playerData.inventory[name] || 0);
            const s = document.createElement('div');
            s.style = `width:50px; height:60px; border:2px solid ${i === selectedSlot ? '#4CAF50' : '#555'}; display:flex; flex-direction:column; align-items:center; color:white; font-size:10px;`;
            s.innerHTML = `<div style="width:30px; height:30px; background:url('./assets/${name}.png'); background-size:cover; margin-top:5px;"></div> <span>${count}</span>`;
            bar.appendChild(s);
        });

        if (engine.gameMode === 'survival') {
            const hpBar = document.createElement('div');
            hpBar.style = "color:#ff5252; font-weight:bold;";
            hpBar.innerText = "❤".repeat(hp);
            cont.appendChild(hpBar);
        }
        cont.appendChild(bar);
        document.body.appendChild(cont);
    }
}
