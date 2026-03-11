export class UI {
    static createMainMenu(onStart) {
        const menu = document.createElement('div');
        menu.id = 'main-menu';
        menu.style = `position:absolute;top:0;left:0;width:100%;height:100%;background:#121212;color:white;display:flex;flex-direction:column;align-items:center;z-index:500;padding-top:40px;font-family:monospace;`;
        
        menu.innerHTML = `
            <h1 style="color:#4CAF50; font-size:48px;">BLOCKSTREAM</h1>
            <div style="margin: 20px; display:flex; gap:10px;">
                <button id="tab-multi" style="padding:15px; cursor:pointer;">ОНЛАЙН РЕЖИМ</button>
                <button id="tab-local" style="padding:15px; cursor:pointer;">МОЇ СЕРВЕРИ (ОФЛАЙН)</button>
                <button id="tab-created" style="padding:15px; cursor:pointer;">СТВОРЕНІ СЕРВЕРИ</button>
            </div>
            <div id="content" style="width:500px; border:2px solid #333; background:#1e1e1e; padding:30px; border-radius:10px;">
                <h3 style="color:#888;">Оберіть вкладку для початку роботи</h3>
            </div>
        `;
        document.body.appendChild(menu);

        const content = document.getElementById('content');

        document.getElementById('tab-local').onclick = () => {
            const worlds = JSON.parse(localStorage.getItem('blockstream_worlds') || '[]');
            content.innerHTML = `
                <h2 style="margin-top:0;">Локальні світи</h2>
                <input id="w-name" placeholder="Назва..." style="padding:10px; width:60%;">
                <select id="w-mode" style="padding:10px;"><option value="survival">Виживання</option><option value="creative">Креатив</option></select>
                <button id="w-create" style="padding:10px; background:#4CAF50; color:white; border:none; cursor:pointer;">+</button>
                <div id="w-list" style="margin-top:20px; text-align:left; max-height:200px; overflow-y:auto;"></div>
            `;
            
            const list = document.getElementById('w-list');
            worlds.forEach(w => {
                const row = document.createElement('div');
                row.style = "background:#2a2a2a; padding:10px; margin-bottom:5px; display:flex; justify-content:space-between; align-items:center; border-radius:5px;";
                row.innerHTML = `<span><b>${w.name}</b> <small>(${w.mode})</small></span> <button style="background:#4CAF50; color:white; border:none; padding:5px 15px; cursor:pointer;">ГРАТИ</button>`;
                row.querySelector('button').onclick = () => { menu.remove(); onStart(w); };
                list.appendChild(row);
            });

            document.getElementById('w-create').onclick = () => {
                const name = document.getElementById('w-name').value;
                const mode = document.getElementById('w-mode').value;
                if(name) {
                    worlds.push({name, mode});
                    localStorage.setItem('blockstream_worlds', JSON.stringify(worlds));
                    document.getElementById('tab-local').click();
                }
            };
        };

        document.getElementById('tab-multi').onclick = () => { content.innerHTML = "<h2>Онлайн режим</h2><p style='color:#f44336;'>Сервери тимчасово недоступні. Перевірте з'єднання.</p>"; };
        document.getElementById('tab-created').onclick = () => { content.innerHTML = "<h2>Створені сервери</h2><p style='color:#888;'>Ви ще не опублікували жодного сервера в мережі BlockStream.</p>"; };
    }

    static createHotbar(inventory, selectedSlot, mode) {
        const existing = document.getElementById('hotbar');
        if (existing) existing.remove();
        const bar = document.createElement('div');
        bar.id = 'hotbar';
        bar.style = `position:fixed;bottom:20px;left:50%;transform:translateX(-50%);display:flex;gap:8px;background:rgba(0,0,0,0.7);padding:10px;border-radius:8px;border:1px solid #444;`;
        inventory.forEach((item, i) => {
            const s = document.createElement('div');
            s.className = 'slot';
            s.style = `width:45px;height:45px;border:2px solid ${i === selectedSlot ? '#4CAF50' : '#555'};color:white;text-align:center;line-height:45px;font-weight:bold;`;
            s.innerText = item[0].toUpperCase();
            bar.appendChild(s);
        });
        if(mode === 'survival') {
            const hp = document.createElement('div');
            hp.style = "position:absolute; top:-25px; left:10px; color:#ff5252; font-size:12px; letter-spacing:2px;";
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
