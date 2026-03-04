// ==================== UTILITAIRES ====================
function formatTime(hours, minutes, seconds = 0) {
    let total = hours * 3600 + minutes * 60 + seconds;
    total = total % (24 * 3600);
    if (total < 0) total += 24 * 3600;
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash);
}

function timeToSeconds(timeStr) {
    if (!timeStr) return 0;
    const parts = timeStr.split(':');
    const h = parseInt(parts[0] || '0', 10);
    const m = parseInt(parts[1] || '0', 10);
    const s = parseInt(parts[2] || '0', 10);
    return h * 3600 + m * 60 + (isNaN(s) ? 0 : s);
}

// ==================== GESTION DES ONGLETS ====================
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    const selectedTab = document.getElementById(tabId + '-tab');
    if (selectedTab) selectedTab.classList.remove('hidden');

    document.querySelectorAll('[data-tab]').forEach(btn => {
        btn.classList.remove('active-tab');
        btn.classList.add('text-gray-700', 'bg-white/50');
    });
    const activeBtn = document.querySelector(`[data-tab="${tabId}"]`);
    if (activeBtn) {
        activeBtn.classList.remove('text-gray-700', 'bg-white/50');
        activeBtn.classList.add('active-tab');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.querySelectorAll('[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

// ==================== PREDICTION STANDARD ====================
function calculateStandardPrediction() {
    const timeInput = document.getElementById('standard-time').value.trim();
    const seed = document.getElementById('standard-seed').value.trim();
    const decimal = document.getElementById('standard-decimal').value.trim();

    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(timeInput)) { alert("Format d'heure invalide."); return; }
    if (seed.length === 0) { alert("Entrez une graine"); return; }
    if (decimal.length !== 4 || !/^\d+$/.test(decimal)) { alert("4 chiffres requis"); return; }

    const [hours, minutes] = timeInput.split(':').map(Number);

    function getRange(base, index) {
        const h = simpleHash(base + '-range-' + index + 'min');
        const h2 = simpleHash(base + '-range-' + index + 'max');
        const min = 2 + (h % 600) / 100;
        const max = Math.min(150, 2 + (h2 % 50) + (index * 10) + (h % 100));
        return { min: parseFloat(min.toFixed(2)), max: parseFloat(max.toFixed(2)) };
    }

    const hash1 = simpleHash(seed + '-' + decimal + '-time1');
    const hash2 = simpleHash(seed + '-' + decimal + '-time2');
    const conf1 = 75 + (simpleHash(seed + decimal + 'conf1') % 24);
    const conf2 = 75 + (simpleHash(seed + decimal + 'conf2') % 24);

    const time1 = formatTime(hours, minutes, 110 + (hash1 % 60));
    const time2 = formatTime(hours, minutes, 170 + (hash2 % 120));

    const mult1 = 2.3 + (simpleHash(seed + decimal + 'small') % 770) / 100;
    const mult2 = 10 + (simpleHash(seed + decimal + 'big') % 9000) / 100;

    const predictions = [
        { time: time1, confidence: conf1, multiplier: mult1.toFixed(2), range: getRange(seed + decimal, 0) },
        { time: time2, confidence: conf2, multiplier: mult2.toFixed(2), range: getRange(seed + decimal, 1) }
    ].sort((a, b) => timeToSeconds(a.time) - timeToSeconds(b.time));

    const resultDiv = document.getElementById('standard-result');
    resultDiv.innerHTML = `
        <div class="text-center mb-4"><h3 class="text-xl font-bold text-blue-900">PRÉDICTIONS</h3></div>
        <div class="grid gap-4">
            <div class="glass-card p-5 border-2 border-yellow-400/30 bg-white/70 relative">
                <div class="flex justify-between"><span class="text-blue-800 font-semibold">🎯 Prédiction 1</span><span class="bg-yellow-300/50 px-3 py-1 rounded-full text-blue-900">${predictions[0].confidence}%</span></div>
                <div class="text-center bg-white/50 rounded-xl p-4"><p class="text-3xl font-mono">⏰ ${predictions[0].time}</p><p class="text-purple-700">💜 ${predictions[0].range.min}x</p><p class="text-green-700">🟢 ${predictions[0].range.max}x</p></div>
                <button onclick="copyPrediction('${predictions[0].time}', ${predictions[0].confidence}, ${predictions[0].range.min}, ${predictions[0].range.max})" class="absolute top-4 right-4 p-2 bg-white/70 rounded-lg">📋</button>
            </div>
            <div class="glass-card p-5 border-2 border-yellow-400/30 bg-white/70 relative">
                <div class="flex justify-between"><span class="text-blue-800 font-semibold">🔥 Prédiction 2</span><span class="bg-yellow-300/50 px-3 py-1 rounded-full">${predictions[1].confidence}%</span></div>
                <div class="text-center bg-white/50 rounded-xl p-4"><p class="text-3xl font-mono">⏰ ${predictions[1].time}</p><p class="text-purple-700">💜 ${predictions[1].range.min}x</p><p class="text-green-700">🟢 ${predictions[1].range.max}x</p></div>
                <button onclick="copyPrediction('${predictions[1].time}', ${predictions[1].confidence}, ${predictions[1].range.min}, ${predictions[1].range.max})" class="absolute top-4 right-4 p-2 bg-white/70 rounded-lg">📋</button>
            </div>
        </div>
    `;
    resultDiv.classList.remove('hidden');
}

function copyPrediction(time, conf, minM, maxM) {
    navigator.clipboard.writeText(`⏰ ${time}\nConfiance ${conf}%\n💜 ${minM}x 🟢 ${maxM}x`).then(() => alert('Copié !'));
}

// ==================== GRAINE DE GAIN ====================
function calculateGraine() {
    const multiplier = document.getElementById('graine-multiplier').value.trim();
    const timeStr = document.getElementById('graine-time').value.trim();
    const serverSeed = document.getElementById('graine-server').value.trim();
    const p1 = document.getElementById('graine-player1').value.trim();
    const p2 = document.getElementById('graine-player2').value.trim();
    const p3 = document.getElementById('graine-player3').value.trim();

    if (!multiplier || !timeStr || !serverSeed || !p1 || !p2 || !p3) { alert("Remplissez tout"); return; }

    const [hours, minutes] = timeStr.split(':').map(Number);
    const seed = `graine-${multiplier}-${serverSeed}-${p1}-${p2}-${p3}-${timeStr}`;

    const timeOffset = simpleHash(seed + 'time-offset');
    const minMult = 2 + (simpleHash(seed + 'min-mult') % 600) / 100;
    const maxMult = Math.min(150, 2 + (simpleHash(seed + 'max-mult') % 50) + (simpleHash(p1 + p2 + p3) % 100));
    const successRate = 70 + (simpleHash(seed + 'success') % 29);
    const extraSec = simpleHash(seed + 'extra-sec') % 30;
    const timeSeconds = 110 + (timeOffset % 60) + extraSec;
    const resultTime = formatTime(hours, minutes, timeSeconds);

    document.getElementById('graine-result').innerHTML = `
        <div class="bg-white/80 p-4 rounded-2xl border border-yellow-400/30">
            ⏰ ${resultTime}<br>💜 ${minMult.toFixed(2)}x → 🟢 ${maxMult.toFixed(2)}x <br>📊 ${successRate}%
        </div>`;
    document.getElementById('graine-result').classList.remove('hidden');
}

// ==================== ROSES ====================
function calculateRoses() {
    const timeStr = document.getElementById('roses-time').value.trim();
    const d1 = document.getElementById('roses-digit1').value.trim();
    const d2 = document.getElementById('roses-digit2').value.trim();

    if (!timeStr || !/^\d$/.test(d1) || !/^\d$/.test(d2)) { alert("Chiffres requis"); return; }

    const [hours, minutes] = timeStr.split(':').map(Number);
    const seed = `rose-${d1}-${d2}-${timeStr}`;
    const timeOffset = simpleHash(seed + 'time') % 120;
    const timeSeconds = 240 + timeOffset;
    const resultTime = formatTime(hours, minutes, timeSeconds);
    const minMult = 10 + (simpleHash(seed + 'minMult') % 50);
    const maxMult = minMult + 20 + (simpleHash(seed + 'maxMult') % 140);
    const successRate = 45 + (simpleHash(seed + 'success') % 41);

    document.getElementById('roses-result').innerHTML = `
        <div class="bg-white/80 p-4 rounded-2xl border border-rose-300">
            🌹 ${resultTime} 💜 ${minMult}x → 🟢 ${Math.min(maxMult, 200)}x (${successRate}%)
        </div>`;
    document.getElementById('roses-result').classList.remove('hidden');
}

// ==================== BLACK DECIMAL ====================
function calculateBlackDecimal() {
    const timeStr = document.getElementById('black-time').value.trim();
    const hex = document.getElementById('black-hex').value.trim();
    const dec = document.getElementById('black-dec').value.trim();

    if (!/^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/.test(timeStr)) { alert("Format HH:MM:SS"); return; }
    if (!/^[0-9A-Fa-f]{2}$/.test(hex)) { alert("Hex 2 caractères"); return; }
    if (!/^\d{2}$/.test(dec)) { alert("Déc 2 chiffres"); return; }

    const [hours, minutes, seconds] = timeStr.split(':').map(Number);
    const hexVal = parseInt(hex, 16);
    const decVal = parseInt(dec, 10);

    function mix(a, b, c) {
        let h = (a * 2654435761 ^ b * 2246822519 ^ c * 3266489917) >>> 0;
        h = (h ^ (h >>> 16)) * 73244475;
        h = (h ^ (h >>> 16)) * 73244475;
        return (h ^ (h >>> 16)) >>> 0;
    }

    const diff = Math.abs(hexVal - decVal);
    const product = (hexVal % 10) * (decVal % 10);

    let newSec = seconds - product, newMin = minutes + diff, newHour = hours;
    while (newSec < 0) { newSec += 60; newMin -= 1; }
    while (newSec >= 60) { newSec -= 60; newMin += 1; }
    while (newMin < 0) { newMin += 60; newHour -= 1; }
    while (newMin >= 60) { newMin -= 60; newHour += 1; }
    newHour = (newHour % 24 + 24) % 24;

    let newTotal = newHour * 3600 + newMin * 60 + newSec;
    const originalSeconds = hours * 3600 + minutes * 60 + seconds;
    if (newTotal <= originalSeconds) newTotal += 60;
    if (newTotal - originalSeconds < 40) newTotal += 60;
    newTotal = (newTotal % 86400 + 86400) % 86400;

    const rh = Math.floor(newTotal / 3600);
    const rm = Math.floor((newTotal % 3600) / 60);
    const rs = newTotal % 60;
    const resultTime = `${String(rh).padStart(2, '0')}:${String(rm).padStart(2, '0')}:${String(rs).padStart(2, '0')}`;

    const hash = mix(hexVal * 100 + decVal, hours * 3600 + minutes * 60 + seconds, hexVal * 1000 + decVal * 10 + (hexVal % 10));
    const cible = 2 + (hash % 200) / 100;
    const medium = 4 + ((hash >> 8) % 600) / 100;
    const hard = 10 + ((hash >> 16) % 9000) / 100;

    document.getElementById('black-result').innerHTML = `
        <div class="bg-white/80 p-4 rounded-2xl border border-gray-400">
            🖤 ${resultTime} ✅ ${cible.toFixed(2)}x 💜 ${medium.toFixed(2)}x 💥 ${hard.toFixed(2)}x
        </div>`;
    document.getElementById('black-result').classList.remove('hidden');
}

// ==================== LEÇONS ====================
function toggleLesson(el) {
    const content = el.querySelector('.lesson-content');
    const toggle = el.querySelector('.lesson-toggle');
    if (content.classList.contains('hidden')) {
        content.classList.remove('hidden');
        toggle.textContent = '➖';
    } else {
        content.classList.add('hidden');
        toggle.textContent = '➕';
    }
}

// ==================== INSTALLATION ====================
function showInstallInstructions() {
    document.getElementById('install-modal').classList.remove('hidden');
}

function closeInstallModal(e) {
    if (!e || e.target === document.getElementById('install-modal')) {
        document.getElementById('install-modal').classList.add('hidden');
    }
}

// ==================== INITIALISATION ====================
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('standard-calculate').addEventListener('click', calculateStandardPrediction);
    document.getElementById('graine-calculate').addEventListener('click', calculateGraine);
    document.getElementById('roses-calculate').addEventListener('click', calculateRoses);
    document.getElementById('black-calculate').addEventListener('click', calculateBlackDecimal);

    // Masques de saisie
    document.getElementById('standard-time')?.addEventListener('input', function(e) {
        let v = e.target.value.replace(/[^0-9:]/g, '');
        if (v.length === 2 && !v.includes(':')) v += ':';
        e.target.value = v;
    });
    document.getElementById('standard-decimal')?.addEventListener('input', function(e) {
        e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4);
    });
});
