import fs from 'fs';

let lines = fs.readFileSync('perfil.html', 'utf8').split('\n');

// 1. Find the global sidebar closure (around line 180)
let logoutLine = lines.findIndex(l => l.includes('btn-logout-sidebar'));
console.log("Logout line:", logoutLine);

if (logoutLine !== -1) {
    let asideClose = -1;
    for (let i = logoutLine; i < logoutLine + 30; i++) {
        if (lines[i] && lines[i].includes('</aside>')) {
            asideClose = i;
            break;
        }
    }
    
    console.log("Aside close:", asideClose);
    
    if (asideClose !== -1) {
        let startDelete = -1;
        for (let i = logoutLine; i < asideClose; i++) {
            if (lines[i] && lines[i].includes('<button') && lines[i].includes('switchTab(\'totem\')')) {
                startDelete = i;
                break;
            }
        }
        
        console.log("Start delete:", startDelete);
        if (startDelete !== -1) {
            lines.splice(startDelete, asideClose - startDelete);
        }
    }
}

// 2. Add it to the correct sidebar
let whatsappLine = lines.findIndex(l => l.includes('menu-btn-whatsapp'));
if (whatsappLine !== -1) {
    let whatsappClose = -1;
    for (let i = whatsappLine; i < whatsappLine + 15; i++) {
        if (lines[i] && lines[i].includes('</button>')) {
            whatsappClose = i;
            break;
        }
    }
    
    console.log("Whatsapp close:", whatsappClose);
    if (whatsappClose !== -1) {
        // check if it's already there
        let alreadyHas = false;
        for(let i=whatsappClose; i < whatsappClose+20; i++){
            if(lines[i] && lines[i].includes("switchTab('totem')")) alreadyHas = true;
        }
        
        if(!alreadyHas) {
            const newMenuBtn = `        <button type="button" onclick="switchTab('totem')" id="menu-btn-totem" class="w-full flex items-center justify-between px-3.5 py-3.5 rounded-xl text-left text-xs font-semibold cursor-pointer transition-all duration-205 bg-purple-50/40">
          <div class="flex items-center gap-3">
            <span class="text-lg">💻</span>
            <div>
              <p class="font-bold text-slate-800">Totem e QR Code</p>
              <p class="text-[9px] text-gray-400 mt-0.5 font-medium">Autoatendimento na loja</p>
            </div>
          </div>
          <span class="font-bold text-purple-500">➔</span>
        </button>`;
            
            lines.splice(whatsappClose + 1, 0, newMenuBtn);
        }
    }
}

fs.writeFileSync('perfil.html', lines.join('\n'), 'utf8');
console.log("DONE");

