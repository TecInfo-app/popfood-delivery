import fs from 'fs';

const filePath = 'perfil.html';
let content = fs.readFileSync(filePath, 'utf8');

// The block that was accidentally inserted:
const newMenuBtn = `
        <button type="button" onclick="switchTab('totem')" id="menu-btn-totem" class="w-full flex items-center justify-between px-3.5 py-3.5 rounded-xl text-left text-xs font-semibold cursor-pointer transition-all duration-205 bg-purple-50/40">
          <div class="flex items-center gap-3">
            <span class="text-lg">💻</span>
            <div>
              <p class="font-bold text-slate-800">Totem e QR Code</p>
              <p class="text-[9px] text-gray-400 mt-0.5 font-medium">Autoatendimento na loja</p>
            </div>
          </div>
          <span class="font-bold text-purple-500">➔</span>
        </button>
      </div>
    </aside>
`;

// It might have spaces or newlines slightly different, let's just find and replace using regex
// The wrong injection is between btn-logout-sidebar and <!-- CONTENT WRAPPER FOR SIDEBAR LAYOUT -->

content = content.replace(
    /        <\/button>\n      <\/div>\n\n        <button type="button" onclick="switchTab\('totem'\)" id="menu-btn-totem"[\s\S]*?<\/aside>/,
    '        </button>\n      </div>\n    </aside>'
);

// Now we need to find the REAL sidebar where it should go, which is before:
//    <!-- ACTIVE TAB CONTENT PANEL -->
const correctInsertionPointStr = `          <span class="font-bold text-emerald-500">➔</span>
        </button>
      </div>
    </aside>

    <!-- ACTIVE TAB CONTENT PANEL -->`;

const correctReplacement = `          <span class="font-bold text-emerald-500">➔</span>
        </button>

        <button type="button" onclick="switchTab('totem')" id="menu-btn-totem" class="w-full flex items-center justify-between px-3.5 py-3.5 rounded-xl text-left text-xs font-semibold cursor-pointer transition-all duration-205 bg-purple-50/40">
          <div class="flex items-center gap-3">
            <span class="text-lg">💻</span>
            <div>
              <p class="font-bold text-slate-800">Totem e QR Code</p>
              <p class="text-[9px] text-gray-400 mt-0.5 font-medium">Autoatendimento na loja</p>
            </div>
          </div>
          <span class="font-bold text-purple-500">➔</span>
        </button>
      </div>
    </aside>

    <!-- ACTIVE TAB CONTENT PANEL -->`;

content = content.replace(correctInsertionPointStr, correctReplacement);

fs.writeFileSync(filePath, content, 'utf8');
console.log("FIXED");
