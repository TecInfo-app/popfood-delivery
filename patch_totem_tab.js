import fs from 'fs';

const filePath = 'perfil.html';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add sidebar menu button
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
`;

content = content.replace(
    '</aside>',
    newMenuBtn + '      </div>\n    </aside>'
);

// 2. Add Tab content
const newTabContent = `
      <!-- TAB: TOTEM E QR CODE -->
      <div id="tab-totem" class="space-y-6 hidden">
        <!-- HEADER CARD -->
        <div class="bg-gradient-to-br from-purple-900 to-indigo-950 rounded-2xl p-6 border border-purple-800 shadow-xl text-white relative overflow-hidden">
          <div class="absolute -top-12 -right-12 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>
          <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div class="space-y-1">
              <h2 class="font-display font-black text-2xl text-white flex items-center gap-2">
                💻 Totem de Pedido Rápido
              </h2>
              <p class="text-purple-200 text-sm font-medium">
                Autoatendimento para balcão e QR Code nas mesas. Reduza filas e aumente vendas.
              </p>
            </div>
            <a href="javascript:void(0)" onclick="window.open('/rapido.html?store=' + window.currentStoreId, '_blank')" class="bg-purple-500 hover:bg-purple-400 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg transition-all text-sm text-center flex items-center gap-2">
              <span>Acessar Totem / Balcão</span>
              <span>➔</span>
            </a>
          </div>
        </div>

        <!-- GENERATE LINKS CARD -->
        <div class="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
          <h3 class="font-display font-bold text-slate-800 flex items-center gap-2">
            🔗 QR Codes para Mesas
          </h3>
          <p class="text-xs text-gray-500">
            Gere o link exato para colocar no QR Code da mesa. O cliente que escanear será vinculado automaticamente à mesa especificada.
          </p>

          <div class="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
            <div class="flex items-end gap-3">
              <div class="flex-grow space-y-1">
                <label class="block text-[11px] font-extrabold uppercase text-gray-600">Número da Mesa:</label>
                <input type="number" id="totem-qr-mesa" placeholder="Ex: 10" class="w-full text-sm font-bold p-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-purple-500" />
              </div>
              <button type="button" onclick="generateTotemLink()" class="px-5 py-3 bg-slate-900 hover:bg-black text-white font-bold rounded-xl text-xs transition-all active:scale-95 whitespace-nowrap">
                Gerar Link
              </button>
            </div>

            <div id="totem-qr-result" class="hidden mt-4 pt-4 border-t border-gray-200 space-y-2">
              <p class="text-[11px] font-bold text-green-600">✅ Link gerado com sucesso!</p>
              <div class="flex items-center gap-2">
                <input type="text" id="totem-qr-url" readonly class="w-full text-xs font-mono p-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600" />
                <button type="button" onclick="copyTotemUrl()" class="px-3 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 font-bold rounded-lg text-xs transition-all shrink-0">
                  Copiar
                </button>
              </div>
              <p class="text-[10px] text-gray-500 mt-1">Gere um QR Code (em sites como qrcode-monkey.com) utilizando o link acima e imprima para colocar na mesa.</p>
            </div>
          </div>
        </div>

      </div>
`;

content = content.replace(
    '<!-- TAB: WHATSAPP BOT -->',
    newTabContent + '\n      <!-- TAB: WHATSAPP BOT -->'
);

// 3. Update switchTab function
content = content.replace(
    "const tabs = ['cadastro', 'banners', 'taxa-entrega', 'cupons', 'pagamentos', 'assinatura', 'motoboy', 'notificacoes', 'whatsapp'];",
    "const tabs = ['cadastro', 'banners', 'taxa-entrega', 'cupons', 'pagamentos', 'assinatura', 'motoboy', 'notificacoes', 'whatsapp', 'totem'];"
);

// 4. Add custom active styling for the totem button in switchTab
content = content.replace(
    "} else if (tabId === 'whatsapp') {",
    "} else if (tabId === 'totem') {\n          activeBtn.className = \"w-full flex items-center justify-between px-3.5 py-3.5 rounded-xl text-left text-xs font-semibold cursor-pointer transition-all duration-205 bg-purple-50 text-purple-700 border-l-4 border-purple-500 pl-2.5\";\n          const arr = activeBtn.querySelector('span:last-child');\n          if (arr) arr.className = \"text-purple-600 font-bold transition-transform translate-x-1\";\n        } else if (tabId === 'whatsapp') {"
);

// 5. Add generate and copy JS logic
const logic = `
    // TOTEM & QR CODE LOGIC
    window.generateTotemLink = function() {
      const mesa = document.getElementById("totem-qr-mesa").value;
      if (!mesa) {
        alert("Digite o número da mesa para gerar o link.");
        return;
      }
      const baseUrl = window.location.origin;
      const finalUrl = baseUrl + "/rapido.html?store=" + window.currentStoreId + "&mesa=" + mesa;
      
      const resDiv = document.getElementById("totem-qr-result");
      const urlInput = document.getElementById("totem-qr-url");
      
      urlInput.value = finalUrl;
      resDiv.classList.remove("hidden");
    };

    window.copyTotemUrl = function() {
      const urlInput = document.getElementById("totem-qr-url");
      urlInput.select();
      document.execCommand('copy');
      alert("Link copiado para a área de transferência! Cole em um gerador de QR Code.");
    };
`;

content = content.replace('// Global Admin Config', logic + '\n          // Global Admin Config');


fs.writeFileSync(filePath, content, 'utf8');
console.log("SUCCESS");
