// ... у класі UI ...
static createHotbar(inventoryItems, selectedSlot, hp, engine) {
    const existing = document.getElementById('hotbar-cont');
    if (existing) existing.remove();
    
    const cont = document.createElement('div');
    cont.id = 'hotbar-cont';
    cont.style = `position:fixed; bottom:20px; left:50%; transform:translateX(-50%); display:flex; flex-direction:column; align-items:center; gap:8px; z-index:100;`;
    
    const barCont = document.createElement('div');
    barCont.style = `display:flex; align-items:center; gap:10px;`;

    const bar = document.createElement('div');
    bar.style = `display:flex; gap:8px; background:rgba(0,0,0,0.85); padding:10px; border-radius:12px; border:2px solid #444;`;
    
    inventoryItems.forEach((name, i) => {
        const count = engine.gameMode === 'creative' ? '∞' : (engine.playerData.inventory[name] || 0);
        const s = document.createElement('div');
        s.style = `width:50px; height:65px; border:2px solid ${i === selectedSlot ? '#4CAF50' : '#555'}; display:flex; flex-direction:column; align-items:center; color:white; font-size:12px; border-radius:5px; pointer-events:none;`;
        s.innerHTML = `
            <div style="width:35px; height:35px; background:url('./assets/${name}.png'); background-size:cover; image-rendering:pixelated; margin-top:5px; background-color:#333;"></div> 
            <span style="margin-top:2px; font-weight:bold;">${count}</span>
        `;
        bar.appendChild(s);
    });

    // Кнопка інвентарю
    const invBtn = document.createElement('button');
    invBtn.innerHTML = '🎒';
    invBtn.style = `width:50px; height:50px; border-radius:12px; background:#4CAF50; border:none; cursor:pointer; font-size:24px; color:white; box-shadow: 0 4px 0 #2e6631;`;
    invBtn.onclick = () => engine.bigInventory.toggle();

    barCont.appendChild(bar);
    barCont.appendChild(invBtn);

    if (engine.gameMode === 'survival') {
        const hpBar = document.createElement('div');
        hpBar.style = "color:#ff5252; font-size:18px; text-shadow: 1px 1px #000; font-weight:bold;";
        hpBar.innerText = "❤".repeat(Math.max(0, hp || 0));
        cont.appendChild(hpBar);
    }
    cont.appendChild(barCont);
    document.body.appendChild(cont);
}
