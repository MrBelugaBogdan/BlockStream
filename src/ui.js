export class UI {
    static createWorldMenu(onStart) {
        const menu = document.createElement('div');
        menu.id = 'world-menu';
        menu.style = `position:absolute;top:0;left:0;width:100%;height:100%;background:#1a1a1a;color:white;display:flex;flex-direction:column;align-items:center;z-index:200;padding:50px;font-family:monospace;`;
        
        const worlds = JSON.parse(localStorage.getItem('blockstream_worlds') || '[]');
        menu.innerHTML = `<h1>BLOCKSTREAM</h1><div id="w-list"></div>
            <input id="w-name" placeholder="Світ..." style="margin-top:20px; padding:10px;">
            <button id="c-btn" style="padding:10px; margin:10px; background:#4CAF50; border:none; color:white; cursor:pointer;">СТВОРИТИ</button>`;
        document.body.appendChild(menu);

        const list = document.getElementById('w-list');
        worlds.forEach(name => {
            const b = document.createElement('button');
            b.innerText = `Увійти в ${name}`;
            b.style = "display:block; width:200px; padding:10px; margin:5px; cursor:pointer;";
            b.onclick = () => { menu.remove(); onStart(name); };
            list.appendChild(b);
        });

        document.getElementById('c-btn').onclick = () => {
            const n = document.getElementById('w-name').value;
            if(n) { 
                worlds.push(n); 
                localStorage.setItem('blockstream_worlds', JSON.stringify(worlds)); 
                location.reload(); 
            }
        };
    }

    static createHotbar(inventory, selectedSlot) {
        const existing = document.getElementById('hotbar');
        if (existing) existing.remove();
        
        const hotbar = document.createElement('div');
        hotbar.id = 'hotbar';
        hotbar.style = `position:fixed; bottom:20px; left:50%; transform:translateX(-50%); display:flex; gap:10px; background:rgba(0,0,0,0.5); padding:10px; border-radius:5px; z-index:100;`;
        
        inventory.forEach((item, i) => {
            const slot = document.createElement('div');
            slot.className = 'slot';
            slot.style = `width:50px; height:50px; border:2px solid ${i === selectedSlot ? 'white' : '#555'}; color:white; display:flex; justify-content:center; align-items:center;`;
            slot.innerText = item[0].toUpperCase();
            hotbar.appendChild(slot);
        });
        document.body.appendChild(hotbar);
    }

    static updateHotbar(selectedSlot) {
        const slots = document.querySelectorAll('.slot');
        slots.forEach((s, i) => {
            s.style.borderColor = (i === selectedSlot) ? 'white' : '#555';
        });
    }
}
