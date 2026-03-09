export class UI {
    static createHotbar(inventory, selectedSlot) {
        const hotbar = document.createElement('div');
        hotbar.id = 'hotbar';
        hotbar.style = `position:fixed; bottom:20px; left:50%; transform:translateX(-50%); display:flex; gap:10px; background:rgba(0,0,0,0.5); padding:10px; border-radius:5px;`;
        
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
