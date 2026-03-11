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
                <button id="tab-created" style="padding:12px; cursor:pointer; background:#333; color:white; border:none;">СТВОРЕНІ</button>
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
                <div id="w-list" style="max-height:300px; overflow-y:auto;"></div>
            `;

            const list = document.getElementById('w-list');
            worlds.forEach((w, index) => {
                const row = document.createElement('div');
                row.style = "background:#2a2a2a; padding:12px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center; border-radius:5px;";
                row.innerHTML = `
                    <div style="display:flex; flex-direction:column;">
                        <span style="font-weight:bold;">${w.name}</span>
                        <small style="color:#888;">${w.mode}</small>
                    </div>
                    <div style="display:flex; gap:10px; align-items:center;">
                        <button class="play-btn" style="background:#4CAF50; color:white; border:none; padding:8px 15px; cursor:pointer; border-radius:3px;">ГРАТИ</button>
                        <div class="options-trigger" style="cursor:pointer; padding:5px; font-weight:bold; font-size:20px;">⋮</div>
                    </div>
                `;

                // Кнопка ГРАТИ
                row.querySelector('.play-btn').onclick = () => {
                    menu.remove();
                    onStart(w);
                    document.body.requestPointerLock();
                };

                // Три крапки
                row.querySelector('.options-trigger').onclick = (e) => {
                    const existing = document.getElementById('options-panel');
                    if (existing) existing.remove();

                    const panel = document.createElement('div');
                    panel.id = 'options-panel';
                    panel.style = `position:fixed; left:${e.clientX}px; top:${e.clientY}px; background:#333; border:1px solid #555; padding:10px; display:flex; flex-direction:column; gap:5px; z-index:1000; border-radius:5px;`;
                    panel.innerHTML = `
                        <button id="opt-rename" style="background:none; border:none; color:white; text-align:left; cursor:pointer; padding:5px;">Перейменувати</button>
                        <button id="opt-copy" style="background:none; border:none; color:white; text-align:left; cursor:pointer; padding:5px;">Копіювати</button>
                        <button id="opt-delete" style="background:none; border:none; color:#ff5252; text-align:left; cursor:pointer; padding:5px;">Видалити</button>
                    `;
                    document.body.appendChild(panel);

                    // Закриття панелі при кліку в іншому місці
                    setTimeout(() => document.addEventListener('click', () => panel.remove(), {once:true}), 10);

                    document.getElementById('opt-delete').onclick = () => {
                        worlds.splice(index, 1);
                        localStorage.setItem('blockstream_worlds', JSON.stringify(worlds));
                        renderWorlds();
                    };

                    document.getElementById('opt-copy').onclick = () => {
                        worlds.push({...w, name: w.name + " (Копія)"});
                        localStorage.setItem('blockstream_worlds', JSON.stringify(worlds));
                        renderWorlds();
                    };

                    document.getElementById('opt-rename').onclick = () => {
                        const newName = prompt("Введіть нову назву:", w.name);
                        if (newName) {
                            worlds[index].name = newName;
                            localStorage.setItem('blockstream_worlds', JSON.stringify(worlds));
                            renderWorlds();
                        }
                    };
                };

                list.appendChild(row);
            });

            document.getElementById('w-create').onclick = () => {
                const name = document.getElementById('w-name').value;
                const mode = document.getElementById('w-mode').value;
                if(name) {
                    worlds.push({name, mode});
                    localStorage.setItem('blockstream_worlds', JSON.stringify(worlds));
                    renderWorlds();
                }
            };
        };

        document.getElementById('tab-local').onclick = renderWorlds;
        renderWorlds(); // Початковий рендер
    }

    static createHotbar(inventory, selectedSlot, mode) {
        const existing = document.getElementById('hotbar');
        if (existing) existing.remove();
        const bar = document.createElement('div');
        bar.id = 'hotbar';
        bar.style = `position:fixed;bottom:20px;left:50%;transform:translateX(-50%);display:flex;gap:8px;background:rgba(0,0,0,0.8);padding:10px;border-radius:10px;border:1px solid #444;z-index:100;`;
        inventory.forEach((item, i) => {
            const s = document.createElement('div');
            s.className = 'slot';
            s.style = `width:45px;height:45px;border:2px solid ${i === selectedSlot ? '#4CAF50' : '#555'};color:white;text-align:center;line-height:45px;font-weight:bold;`;
            s.innerText = item[0].toUpperCase();
            bar.appendChild(s);
        });
        if(mode === 'survival') {
            const hp = document.createElement('div');
            hp.style = "position:absolute; top:-25px; left:5px; color:#ff5252; font-size:14px;";
            hp.innerText = "❤❤❤❤❤❤❤❤❤❤";
            bar.appendChild(hp);
        }
        document.body.appendChild(bar);
    }

    static updateHotbar(selectedSlot) {
        const slots = document.querySelectorAll('.slot');
        slots.forEach((s, i) => s.style.borderColor = i === selectedSlot ? '#4CAF50' : '#555');
    }
}
