/* ═══════════════════════════════════════════════════════════════
   DESA — Dynamic Engineering & Site Automation System
   Main Application JavaScript
   ═══════════════════════════════════════════════════════════════ */

// ─── State ──────────────────────────────────────────────────
let sensorChart = null;
let currentSensorHistory = {};
let activeSensor = 'soil_pressure';
let sensorInterval = null;
let currentAlert = null;

// ─── Module Labels ──────────────────────────────────────────
const MODULE_LABELS = {
    generative: 'Generative Design Studio',
    sensors: 'Live Site Sensor Dashboard',
    recalibration: 'Design Recalibration Engine',
    risk: 'Simulation & Risk Predictor',
    integration: 'Integration Hub'
};

// ═══════════════════════════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initClock();
    initDesignForm();
    initRecalibrationActions();
    loadSensors();
    loadRecalibration();
    loadRiskData();
    loadIntegrations();

    // Start sensor auto-refresh
    sensorInterval = setInterval(loadSensors, 2000);
});

function initNavigation() {
    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const moduleId = btn.dataset.module;

            // Update active nav
            navBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Switch panel
            document.querySelectorAll('.module-panel').forEach(p => p.classList.remove('active'));
            document.getElementById(`panel-${moduleId}`).classList.add('active');

            // Update header subtitle
            document.getElementById('activeModuleLabel').textContent = MODULE_LABELS[moduleId] || '';

            // Trigger module-specific loads
            if (moduleId === 'sensors') loadSensors();
            if (moduleId === 'recalibration') loadRecalibration();
            if (moduleId === 'risk') loadRiskData();
            if (moduleId === 'integration') loadIntegrations();
        });
    });
}

// ─── Live Clock ──────────────────────────────────────────────
function initClock() {
    function update() {
        const now = new Date();
        document.getElementById('liveClock').textContent =
            now.toLocaleTimeString('en-IN', { hour12: false });
    }
    update();
    setInterval(update, 1000);
}

// ═══════════════════════════════════════════════════════════════
// MODULE 1 — GENERATIVE DESIGN (with Canvas Preview)
// ═══════════════════════════════════════════════════════════════
let storedVariants = [];
let selectedVariantIdx = -1;
let designAnimFrame = null;

function initDesignForm() {
    drawEmptyCanvas();
    document.getElementById('designForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('generateBtn');
        btn.classList.add('loading');
        btn.innerHTML = `
            <svg class="spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" stroke-dasharray="30 70" />
            </svg>
            Generating AI Variants...`;

        const params = {
            length: document.getElementById('siteLength').value,
            width: document.getElementById('siteWidth').value,
            soil_type: document.getElementById('soilType').value,
            max_load: document.getElementById('maxLoad').value,
            floors: document.getElementById('floors').value,
            budget: document.getElementById('budget').value,
            user_prompt: document.getElementById('userPrompt').value.trim(),
            api_key: document.getElementById('geminiKey').value.trim()
        };

        try {
            const res = await fetch('/api/generate-design', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(params)
            });
            const data = await res.json();
            storedVariants = data.variants;
            renderDesignVariants(data.variants);
            // Show AI source badge
            const badge = document.getElementById('aiSourceBadge');
            const label = document.getElementById('aiSourceLabel');
            badge.style.display = 'flex';
            if (data.source === 'gemini') {
                badge.className = 'ai-source-badge';
                label.textContent = 'Powered by Google Gemini AI';
            } else {
                badge.className = 'ai-source-badge mock-source';
                label.textContent = 'Simulation Engine (add API key for Gemini AI)';
            }
            // Auto-select the AI recommended variant
            const aiIdx = data.variants.findIndex(v => v.ai_recommended);
            selectVariant(aiIdx >= 0 ? aiIdx : 0);
        } catch (err) {
            console.error('Design generation failed:', err);
        } finally {
            btn.classList.remove('loading');
            btn.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10"/>
                </svg>
                Generate Design Variants`;
        }
    });
}

function renderDesignVariants(variants) {
    // Show the selector section
    document.getElementById('variantSelectorSection').style.display = 'block';

    const container = document.getElementById('designResults');
    container.innerHTML = variants.map((v, i) => `
        <div class="variant-card ${v.ai_recommended ? 'recommended' : ''}" data-idx="${i}" onclick="selectVariant(${i})">
            <div class="variant-name">${v.name}</div>
            <div class="variant-material">${v.material}</div>
            <div class="variant-meta">
                <span class="variant-meta-item cost">💰 ${v.estimated_cost}</span>
                <span class="variant-meta-item time">📅 ${v.estimated_days}d</span>
                <span class="variant-meta-item co2">🌱 −${v.co2_reduction}</span>
            </div>
            <div class="variant-scores">
                <div class="score-row">
                    <span class="score-label">Cost Eff.</span>
                    <div class="score-track"><div class="score-fill cost" style="width: ${v.cost_score}%"></div></div>
                    <span class="score-value">${v.cost_score}</span>
                </div>
                <div class="score-row">
                    <span class="score-label">Time Eff.</span>
                    <div class="score-track"><div class="score-fill time" style="width: ${v.time_score}%"></div></div>
                    <span class="score-value">${v.time_score}</span>
                </div>
                <div class="score-row">
                    <span class="score-label">Material</span>
                    <div class="score-track"><div class="score-fill material" style="width: ${v.material_efficiency}%"></div></div>
                    <span class="score-value">${v.material_efficiency}</span>
                </div>
                <div class="score-row">
                    <span class="score-label">Sustain.</span>
                    <div class="score-track"><div class="score-fill sustain" style="width: ${v.sustainability}%"></div></div>
                    <span class="score-value">${v.sustainability}</span>
                </div>
            </div>
            <div class="variant-overall">
                <span class="overall-label">Overall</span>
                <span class="overall-score">${v.overall_score}</span>
            </div>
            ${v.ai_reasoning ? `<div class="variant-reasoning">🧠 ${v.ai_reasoning}</div>` : ''}
        </div>
    `).join('');
}

function selectVariant(idx) {
    if (idx < 0 || idx >= storedVariants.length) return;
    selectedVariantIdx = idx;
    const v = storedVariants[idx];

    // Highlight selected card
    document.querySelectorAll('.variant-card').forEach(c => c.classList.remove('selected'));
    const card = document.querySelector(`.variant-card[data-idx="${idx}"]`);
    if (card) card.classList.add('selected');

    // Update preview header
    document.getElementById('previewVariantLabel').textContent = v.name + (v.ai_recommended ? ' ⭐' : '');

    // Update specs bar
    document.getElementById('specMaterial').textContent = v.material;
    document.getElementById('specCost').textContent = v.estimated_cost;
    document.getElementById('specDays').textContent = v.estimated_days + ' days';
    document.getElementById('specCO2').textContent = '−' + v.co2_reduction;
    document.getElementById('specOverall').textContent = v.overall_score;

    // Draw the structural preview
    drawVariantDesign(v);
}

// ─── Canvas Rendering ────────────────────────────────────────
function getCanvas() {
    const canvas = document.getElementById('designCanvas');
    const wrap = canvas.parentElement;
    canvas.width = wrap.clientWidth || 700;
    canvas.height = wrap.clientHeight || 420;
    return { canvas, ctx: canvas.getContext('2d'), w: canvas.width, h: canvas.height };
}

function drawEmptyCanvas() {
    const { ctx, w, h } = getCanvas();
    ctx.clearRect(0, 0, w, h);
    // Draw grid
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.06)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = 0; y < h; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    // Center text
    ctx.fillStyle = 'rgba(0, 212, 255, 0.2)';
    ctx.font = '16px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Generate variants to preview structural design', w / 2, h / 2);
}

function drawVariantDesign(variant) {
    if (designAnimFrame) cancelAnimationFrame(designAnimFrame);
    const { ctx, w, h } = getCanvas();

    const name = variant.name.toLowerCase();
    const floors = parseInt(document.getElementById('floors').value) || 12;
    const load = parseInt(document.getElementById('maxLoad').value) || 500;
    const siteW = parseInt(document.getElementById('siteLength').value) || 120;
    const t = Date.now();
    // Data-driven params from variant scores
    const dp = {
        widthFactor: 0.2 + (variant.cost_score / 100) * 0.25,
        heightFactor: 0.5 + (variant.material_efficiency / 100) * 0.4,
        density: Math.max(3, Math.round(variant.time_score / 12)),
        greenIntensity: variant.sustainability / 100,
        loadThickness: 1 + (load / 500) * 2,
        siteScale: siteW / 120
    };

    if (name.includes('cantilever')) drawCantilever(ctx, w, h, variant, floors, t, dp);
    else if (name.includes('deep foundation')) drawDeepFoundation(ctx, w, h, variant, floors, t, dp);
    else if (name.includes('hybrid frame')) drawHybridFrame(ctx, w, h, variant, floors, t, dp);
    else if (name.includes('tensile mesh')) drawTensileMesh(ctx, w, h, variant, floors, t, dp);
    else if (name.includes('arch rib')) drawArchRib(ctx, w, h, variant, floors, t, dp);
    else if (name.includes('box girder')) drawBoxGirder(ctx, w, h, variant, floors, t, dp);
    else if (name.includes('modular truss')) drawModularTruss(ctx, w, h, variant, floors, t, dp);
    else if (name.includes('shell structure')) drawShellStructure(ctx, w, h, variant, floors, t, dp);
    else drawGenericBuilding(ctx, w, h, variant, floors, t, dp);

    // Draw score annotations on canvas
    drawScoreAnnotations(ctx, w, h, variant);

    designAnimFrame = requestAnimationFrame(() => drawVariantDesign(variant));
}

function drawScoreAnnotations(ctx, w, h, v) {
    const x = 12, y0 = h - 70;
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(x - 4, y0 - 14, 130, 68);
    ctx.font = '9px "JetBrains Mono"';
    ctx.textAlign = 'left';
    const items = [
        ['Cost', v.cost_score, '0, 212, 255'],
        ['Time', v.time_score, '245, 158, 11'],
        ['Material', v.material_efficiency, '16, 185, 129'],
        ['Sustain', v.sustainability, '139, 92, 246']
    ];
    items.forEach(([label, score, rgb], i) => {
        const ly = y0 + i * 15;
        ctx.fillStyle = `rgba(${rgb}, 0.7)`;
        ctx.fillText(label, x, ly);
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(x + 55, ly - 7, 60, 6);
        ctx.fillStyle = `rgba(${rgb}, 0.6)`;
        ctx.fillRect(x + 55, ly - 7, (score / 100) * 60, 6);
    });
}

// ─── Background Grid ─────────────────────────────────────────
function drawGrid(ctx, w, h, accent) {
    ctx.clearRect(0, 0, w, h);
    // Atmospheric radial glow
    const ac = accent || '0, 212, 255';
    const glow = ctx.createRadialGradient(w / 2, h * 0.5, 30, w / 2, h * 0.5, w * 0.7);
    glow.addColorStop(0, `rgba(${ac}, 0.06)`);
    glow.addColorStop(0.5, `rgba(${ac}, 0.02)`);
    glow.addColorStop(1, 'rgba(10, 14, 23, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);
    // Grid lines
    ctx.strokeStyle = `rgba(${ac}, 0.04)`;
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = 0; y < h; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    // Ground line with gradient
    const groundGrad = ctx.createLinearGradient(30, 0, w - 30, 0);
    groundGrad.addColorStop(0, `rgba(${ac}, 0.05)`);
    groundGrad.addColorStop(0.5, `rgba(${ac}, 0.25)`);
    groundGrad.addColorStop(1, `rgba(${ac}, 0.05)`);
    ctx.strokeStyle = groundGrad;
    ctx.lineWidth = 2;
    const gy = h * 0.85;
    ctx.beginPath(); ctx.moveTo(30, gy); ctx.lineTo(w - 30, gy); ctx.stroke();
    return gy;
}

function drawLabel(ctx, w, text, color) {
    ctx.fillStyle = color || 'rgba(0, 212, 255, 0.6)';
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(text, w / 2, 20);
}

// ─── Variant-Specific Drawing Functions ──────────────────────

function drawCantilever(ctx, w, h, v, floors, t, dp) {
    const gy = drawGrid(ctx, w, h, '0, 200, 255');
    drawLabel(ctx, w, `CANTILEVER — ${v.material} | Load: ${dp.loadThickness.toFixed(1)}x`, 'rgba(0, 220, 255, 0.7)');
    const bw = w * dp.widthFactor, bh = Math.min(floors * 22, gy - 60) * dp.heightFactor;
    const bx = w * 0.35, by = gy - bh;
    // Main tower — gradient fill
    const towerGrad = ctx.createLinearGradient(bx, by, bx, gy);
    towerGrad.addColorStop(0, 'rgba(0, 180, 255, 0.2)');
    towerGrad.addColorStop(0.5, 'rgba(0, 220, 255, 0.12)');
    towerGrad.addColorStop(1, 'rgba(56, 189, 248, 0.08)');
    ctx.fillStyle = towerGrad;
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(bx, by, bw, bh);
    // Floors
    for (let i = 1; i < floors && i < 20; i++) {
        const fy = by + (bh / Math.min(floors, 20)) * i;
        ctx.strokeStyle = `rgba(56, 189, 248, ${0.15 + Math.sin(t / 600 + i) * 0.05})`;
        ctx.beginPath(); ctx.moveTo(bx, fy); ctx.lineTo(bx + bw, fy); ctx.stroke();
    }
    // Cantilever extension — hot orange gradient
    const cw = bw * 1.2, ch = bh * 0.35;
    const cy = by + bh * 0.15;
    const extGrad = ctx.createLinearGradient(bx + bw, cy, bx + bw + cw, cy + ch);
    extGrad.addColorStop(0, 'rgba(255, 107, 53, 0.2)');
    extGrad.addColorStop(1, 'rgba(251, 191, 36, 0.12)');
    ctx.fillStyle = extGrad;
    ctx.fillRect(bx + bw, cy, cw, ch);
    ctx.strokeStyle = 'rgba(255, 107, 53, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(bx + bw, cy, cw, ch);
    // Support diagonal — gold
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(bx + bw, cy + ch); ctx.lineTo(bx + bw + cw, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bx + bw, cy); ctx.lineTo(bx + bw + cw, cy + ch); ctx.stroke();
    ctx.setLineDash([]);
    // Glowing junction node
    const glowA = Math.sin(t / 400) * 0.3 + 0.7;
    ctx.beginPath();
    ctx.arc(bx + bw, cy + ch / 2, 8, 0, Math.PI * 2);
    const nodeGrad = ctx.createRadialGradient(bx + bw, cy + ch / 2, 0, bx + bw, cy + ch / 2, 12);
    nodeGrad.addColorStop(0, `rgba(255, 200, 50, ${glowA})`);
    nodeGrad.addColorStop(1, `rgba(255, 107, 53, 0)`);
    ctx.fillStyle = nodeGrad;
    ctx.fill();
    ctx.beginPath(); ctx.arc(bx + bw, cy + ch / 2, 4, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 220, 100, ${glowA})`;
    ctx.fill();
    // Foundation — warm gradient
    const fGrad = ctx.createLinearGradient(bx - 10, gy, bx + bw + 20, gy + 12);
    fGrad.addColorStop(0, 'rgba(120, 100, 80, 0.4)');
    fGrad.addColorStop(1, 'rgba(80, 80, 100, 0.3)');
    ctx.fillStyle = fGrad;
    ctx.fillRect(bx - 10, gy, bw + 20, 12);
    drawDimension(ctx, bx, gy + 30, bx + bw + cw, gy + 30, `${Math.round(bw + cw)}px span`);
}

function drawDeepFoundation(ctx, w, h, v, floors, t, dp) {
    const gy = drawGrid(ctx, w, h, '100, 140, 255');
    drawLabel(ctx, w, `DEEP FOUNDATION — ${v.material} | Piles: ${dp.density}`, 'rgba(100, 160, 255, 0.7)');
    const bw = w * (dp.widthFactor + 0.05), bh = Math.min(floors * 20, (gy - 60) * 0.65) * dp.heightFactor;
    const bx = (w - bw) / 2, by = gy - bh;
    // Building — blue gradient
    const bldgGrad = ctx.createLinearGradient(bx, by, bx + bw, gy);
    bldgGrad.addColorStop(0, 'rgba(59, 130, 246, 0.18)');
    bldgGrad.addColorStop(1, 'rgba(37, 99, 235, 0.08)');
    ctx.fillStyle = bldgGrad;
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = 'rgba(96, 165, 250, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(bx, by, bw, bh);
    // Floor lines
    for (let i = 1; i < floors && i < 18; i++) {
        const fy = by + (bh / Math.min(floors, 18)) * i;
        ctx.strokeStyle = 'rgba(96, 165, 250, 0.2)';
        ctx.beginPath(); ctx.moveTo(bx, fy); ctx.lineTo(bx + bw, fy); ctx.stroke();
    }
    // Windows — colored panes
    for (let i = 0; i < Math.min(floors, 18); i++) {
        const fy = by + (bh / Math.min(floors, 18)) * i + 4;
        const fh = (bh / Math.min(floors, 18)) - 8;
        for (let j = 0; j < 4; j++) {
            const wx = bx + 12 + j * (bw - 24) / 4;
            const wc = j % 2 === 0 ? '59, 130, 246' : '99, 102, 241';
            ctx.fillStyle = `rgba(${wc}, ${0.06 + Math.random() * 0.1})`;
            ctx.fillRect(wx, fy, (bw - 48) / 4, Math.max(fh, 2));
        }
    }
    // Deep piles — golden amber with gradient glow
    const pileDepth = (h - gy) + 40;
    const pileCount = 5;
    for (let i = 0; i < pileCount; i++) {
        const px = bx + (bw / (pileCount + 1)) * (i + 1);
        const pulse = Math.sin(t / 300 + i) * 0.3 + 0.6;
        // Pile glow
        const pGlow = ctx.createRadialGradient(px, gy + pileDepth / 2, 0, px, gy + pileDepth / 2, 15);
        pGlow.addColorStop(0, `rgba(251, 191, 36, ${pulse * 0.3})`);
        pGlow.addColorStop(1, 'rgba(251, 191, 36, 0)');
        ctx.fillStyle = pGlow;
        ctx.fillRect(px - 15, gy, 30, pileDepth);
        // Pile shaft
        ctx.strokeStyle = `rgba(251, 191, 36, ${pulse})`;
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(px, gy); ctx.lineTo(px, gy + pileDepth); ctx.stroke();
        // Pile tip — bright
        ctx.beginPath();
        ctx.moveTo(px - 6, gy + pileDepth);
        ctx.lineTo(px, gy + pileDepth + 10);
        ctx.lineTo(px + 6, gy + pileDepth);
        ctx.fillStyle = `rgba(255, 200, 50, ${pulse})`;
        ctx.fill();
    }
    // Underground zone — purple gradient
    const ugGrad = ctx.createLinearGradient(bx - 20, gy, bx - 20, h);
    ugGrad.addColorStop(0, 'rgba(124, 58, 237, 0.08)');
    ugGrad.addColorStop(1, 'rgba(124, 58, 237, 0.2)');
    ctx.fillStyle = ugGrad;
    ctx.fillRect(bx - 20, gy + 2, bw + 40, h - gy);
    ctx.fillStyle = 'rgba(167, 139, 250, 0.6)';
    ctx.font = '9px "JetBrains Mono"'; ctx.textAlign = 'center';
    ctx.fillText('DEEP PILE ZONE', w / 2, gy + 20);
    // Foundation slab — gradient
    const slabGrad = ctx.createLinearGradient(bx - 15, gy, bx + bw + 15, gy);
    slabGrad.addColorStop(0, 'rgba(99, 102, 241, 0.3)');
    slabGrad.addColorStop(0.5, 'rgba(139, 92, 246, 0.5)');
    slabGrad.addColorStop(1, 'rgba(99, 102, 241, 0.3)');
    ctx.fillStyle = slabGrad;
    ctx.fillRect(bx - 15, gy - 4, bw + 30, 8);
}

function drawHybridFrame(ctx, w, h, v, floors, t, dp) {
    const gy = drawGrid(ctx, w, h, '245, 158, 11');
    drawLabel(ctx, w, `HYBRID FRAME — ${v.material} | Bays: ${Math.max(3, dp.density)}`, 'rgba(245, 180, 50, 0.7)');
    const bw = w * (dp.widthFactor + 0.1), bh = Math.min(floors * 20, gy - 60) * dp.heightFactor;
    const bx = (w - bw) / 2, by = gy - bh;
    const fh = bh / Math.min(floors, 16);
    const bays = Math.max(3, Math.min(6, dp.density));
    const bayW = bw / bays;
    // Columns — amber/gold
    for (let col = 0; col <= bays; col++) {
        const x = bx + col * bayW;
        const colGrad = ctx.createLinearGradient(x, by, x, gy);
        colGrad.addColorStop(0, 'rgba(251, 191, 36, 0.7)');
        colGrad.addColorStop(1, 'rgba(245, 158, 11, 0.5)');
        ctx.strokeStyle = colGrad;
        ctx.lineWidth = col === 0 || col === bays ? 3 : 2;
        ctx.beginPath(); ctx.moveTo(x, by); ctx.lineTo(x, gy); ctx.stroke();
    }
    // Beams — teal
    for (let row = 0; row <= Math.min(floors, 16); row++) {
        const y = by + row * fh;
        ctx.strokeStyle = 'rgba(20, 184, 166, 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(bx, y); ctx.lineTo(bx + bw, y); ctx.stroke();
    }
    // Cross bracing — animated emerald green
    for (let col = 0; col < bays; col++) {
        for (let row = 0; row < Math.min(floors, 16); row++) {
            if ((col + row) % 3 === 0) {
                const x1 = bx + col * bayW, x2 = bx + (col + 1) * bayW;
                const y1 = by + row * fh, y2 = by + (row + 1) * fh;
                const pulse = Math.sin(t / 500 + col + row) * 0.25 + 0.45;
                ctx.strokeStyle = `rgba(16, 185, 129, ${pulse})`;
                ctx.lineWidth = 1.5;
                ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(x2, y1); ctx.lineTo(x1, y2); ctx.stroke();
            }
        }
    }
    // Colored panels — warm fills
    const panelColors = ['0, 200, 255', '245, 158, 11', '16, 185, 129', '236, 72, 153', '139, 92, 246'];
    for (let col = 0; col < bays; col++) {
        for (let row = 0; row < Math.min(floors, 16); row++) {
            const pc = panelColors[(col + row) % panelColors.length];
            ctx.fillStyle = `rgba(${pc}, 0.04)`;
            ctx.fillRect(bx + col * bayW + 1, by + row * fh + 1, bayW - 2, fh - 2);
        }
    }
    // Foundation
    const fGrad = ctx.createLinearGradient(bx - 10, gy, bx + bw + 20, gy + 10);
    fGrad.addColorStop(0, 'rgba(245, 158, 11, 0.3)');
    fGrad.addColorStop(1, 'rgba(120, 100, 60, 0.4)');
    ctx.fillStyle = fGrad;
    ctx.fillRect(bx - 10, gy, bw + 20, 10);
}

function drawTensileMesh(ctx, w, h, v, floors, t, dp) {
    const gy = drawGrid(ctx, w, h, '168, 85, 247');
    drawLabel(ctx, w, `TENSILE MESH — ${v.material} | Cables: ${dp.density * 2}`, 'rgba(192, 132, 252, 0.7)');
    const bw = w * (dp.widthFactor + 0.15), bh = Math.min(floors * 22, gy - 60) * dp.heightFactor;
    const bx = (w - bw) / 2, by = gy - bh;
    // Core structure — blue/indigo gradient
    const coreGrad = ctx.createLinearGradient(bx + bw * 0.15, by, bx + bw * 0.85, gy);
    coreGrad.addColorStop(0, 'rgba(99, 102, 241, 0.12)');
    coreGrad.addColorStop(1, 'rgba(59, 130, 246, 0.06)');
    ctx.fillStyle = coreGrad;
    ctx.fillRect(bx + bw * 0.15, by, bw * 0.7, bh);
    ctx.strokeStyle = 'rgba(129, 140, 248, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(bx + bw * 0.15, by, bw * 0.7, bh);
    // Tensile mesh — pink/magenta cables
    for (let side = 0; side < 2; side++) {
        const sx = side === 0 ? bx : bx + bw;
        const mx = side === 0 ? bx + bw * 0.15 : bx + bw * 0.85;
        const dir = side === 0 ? -1 : 1;
        for (let i = 0; i < 8; i++) {
            const cy1 = by + (bh / 8) * i;
            const pulse = Math.sin(t / 600 + i * 0.5) * 8;
            const hue = 280 + i * 10;
            ctx.strokeStyle = `hsla(${hue}, 80%, 65%, ${0.35 + Math.sin(t / 400 + i) * 0.2})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(mx, cy1);
            ctx.quadraticCurveTo(sx + dir * (20 + pulse), cy1 + bh / 16, mx, cy1 + bh / 8);
            ctx.stroke();
        }
        // Mesh lines — violet
        for (let i = 0; i <= 12; i++) {
            const my = by + (bh / 12) * i;
            ctx.strokeStyle = 'rgba(167, 139, 250, 0.18)';
            ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(sx + dir * 15, my); ctx.stroke();
        }
    }
    // Floor lines — subtle indigo
    for (let i = 1; i < Math.min(floors, 16); i++) {
        const fy = by + (bh / Math.min(floors, 16)) * i;
        ctx.strokeStyle = 'rgba(129, 140, 248, 0.18)';
        ctx.beginPath(); ctx.moveTo(bx + bw * 0.15, fy); ctx.lineTo(bx + bw * 0.85, fy); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(100, 80, 120, 0.3)';
    ctx.fillRect(bx - 5, gy, bw + 10, 10);
}

function drawArchRib(ctx, w, h, v, floors, t, dp) {
    const gy = drawGrid(ctx, w, h, '20, 184, 166');
    drawLabel(ctx, w, `ARCH RIB — ${v.material} | Span: ${Math.round(dp.siteScale * 100)}m`, 'rgba(45, 212, 191, 0.7)');
    const archW = w * (dp.widthFactor + 0.3), archH = (gy - 40) * dp.heightFactor;
    const cx = w / 2, archBase = gy;
    // Arch ribs — teal to cyan gradient strokes
    const archColors = ['20, 184, 166', '6, 182, 212', '56, 189, 248'];
    for (let r = 0; r < 3; r++) {
        const offset = r * 8;
        const pulse = Math.sin(t / 500 + r) * 0.2 + 0.55;
        ctx.strokeStyle = `rgba(${archColors[r]}, ${pulse})`;
        ctx.lineWidth = 3.5 - r * 0.8;
        ctx.beginPath();
        ctx.moveTo(cx - archW / 2 - offset, archBase);
        ctx.quadraticCurveTo(cx, archBase - archH - offset * 3, cx + archW / 2 + offset, archBase);
        ctx.stroke();
    }
    // Vertical hangers — golden with glow nodes
    const segments = 10;
    for (let i = 1; i < segments; i++) {
        const frac = i / segments;
        const x = cx - archW / 2 + archW * frac;
        const archY = archBase - 4 * archH * frac * (1 - frac);
        const pulse = Math.sin(t / 350 + i) * 0.25 + 0.5;
        ctx.strokeStyle = `rgba(251, 191, 36, ${pulse})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(x, archY); ctx.lineTo(x, archBase); ctx.stroke();
        // Glow node
        const nGlow = ctx.createRadialGradient(x, archY, 0, x, archY, 8);
        nGlow.addColorStop(0, `rgba(251, 191, 36, ${pulse + 0.3})`);
        nGlow.addColorStop(1, 'rgba(251, 191, 36, 0)');
        ctx.fillStyle = nGlow;
        ctx.beginPath(); ctx.arc(x, archY, 8, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x, archY, 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 220, 80, ${pulse + 0.2})`;
        ctx.fill();
    }
    // Deck — emerald gradient
    const deckGrad = ctx.createLinearGradient(cx - archW / 2, 0, cx + archW / 2, 0);
    deckGrad.addColorStop(0, 'rgba(16, 185, 129, 0.05)');
    deckGrad.addColorStop(0.5, 'rgba(5, 150, 105, 0.15)');
    deckGrad.addColorStop(1, 'rgba(16, 185, 129, 0.05)');
    ctx.fillStyle = deckGrad;
    ctx.fillRect(cx - archW / 2 - 5, archBase - 15, archW + 10, 15);
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx - archW / 2 - 5, archBase - 15); ctx.lineTo(cx + archW / 2 + 5, archBase - 15); ctx.stroke();
    // Supports — gradient blocks
    for (let s = -1; s <= 1; s += 2) {
        const sx = cx + s * archW / 2;
        const sGrad = ctx.createLinearGradient(sx - 8, gy, sx + 8, gy + 15);
        sGrad.addColorStop(0, 'rgba(20, 184, 166, 0.5)');
        sGrad.addColorStop(1, 'rgba(100, 100, 120, 0.4)');
        ctx.fillStyle = sGrad;
        ctx.fillRect(sx - 8, gy, 16, 15);
    }
}

function drawBoxGirder(ctx, w, h, v, floors, t, dp) {
    const gy = drawGrid(ctx, w, h, '168, 85, 247');
    drawLabel(ctx, w, `BOX GIRDER — ${v.material} | Sections: ${Math.min(floors, 14)}`, 'rgba(192, 132, 252, 0.7)');
    const bw = w * (dp.widthFactor + 0.1), bh = Math.min(floors * 20, gy - 60) * dp.heightFactor;
    const bx = (w - bw) / 2, by = gy - bh;
    const depth = 40;
    // Top face — teal
    ctx.fillStyle = 'rgba(45, 212, 191, 0.1)';
    ctx.beginPath();
    ctx.moveTo(bx, by); ctx.lineTo(bx + depth, by - depth * 0.5);
    ctx.lineTo(bx + bw + depth, by - depth * 0.5); ctx.lineTo(bx + bw, by);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(45, 212, 191, 0.5)'; ctx.lineWidth = 1; ctx.stroke();
    // Right face — magenta/pink
    ctx.fillStyle = 'rgba(217, 70, 239, 0.08)';
    ctx.beginPath();
    ctx.moveTo(bx + bw, by); ctx.lineTo(bx + bw + depth, by - depth * 0.5);
    ctx.lineTo(bx + bw + depth, gy - depth * 0.5); ctx.lineTo(bx + bw, gy);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(217, 70, 239, 0.4)'; ctx.stroke();
    // Front face — blue/indigo gradient
    const frontGrad = ctx.createLinearGradient(bx, by, bx, gy);
    frontGrad.addColorStop(0, 'rgba(99, 102, 241, 0.15)');
    frontGrad.addColorStop(1, 'rgba(139, 92, 246, 0.08)');
    ctx.fillStyle = frontGrad;
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(bx, by, bw, bh);
    // Box girder sections — rainbow hue shift
    const sections = Math.min(floors, 14);
    for (let i = 0; i < sections; i++) {
        const sy = by + (bh / sections) * i;
        const sh = bh / sections;
        const hue = (i / sections) * 60 + 240;
        ctx.strokeStyle = `hsla(${hue}, 70%, 60%, 0.25)`;
        ctx.strokeRect(bx + 4, sy + 2, bw - 8, sh - 4);
        ctx.beginPath(); ctx.moveTo(bx + bw / 2, sy + 2); ctx.lineTo(bx + bw / 2, sy + sh - 2); ctx.stroke();
        const glow = Math.sin(t / 400 + i * 0.3) * 0.06 + 0.05;
        ctx.fillStyle = `hsla(${hue}, 70%, 60%, ${glow})`;
        ctx.fillRect(bx + 5, sy + 3, bw / 2 - 6, sh - 6);
        ctx.fillStyle = `hsla(${hue + 30}, 70%, 60%, ${glow * 0.8})`;
        ctx.fillRect(bx + bw / 2 + 1, sy + 3, bw / 2 - 6, sh - 6);
    }
    const fGrad = ctx.createLinearGradient(bx - 10, gy, bx + bw + 20 + depth, gy);
    fGrad.addColorStop(0, 'rgba(139, 92, 246, 0.3)');
    fGrad.addColorStop(1, 'rgba(100, 100, 120, 0.4)');
    ctx.fillStyle = fGrad;
    ctx.fillRect(bx - 10, gy, bw + 20 + depth, 10);
}

function drawModularTruss(ctx, w, h, v, floors, t, dp) {
    const gy = drawGrid(ctx, w, h, '236, 72, 153');
    drawLabel(ctx, w, `MODULAR TRUSS — ${v.material} | Modules: ${dp.density * 3}`, 'rgba(244, 114, 182, 0.7)');
    const bw = w * (dp.widthFactor + 0.25), bh = Math.min(floors * 20, gy - 60) * dp.heightFactor;
    const bx = (w - bw) / 2, by = gy - bh;
    const moduleH = bh / Math.min(floors, 12);
    const moduleW = bw / 3;
    // Rainbow truss modules
    for (let row = 0; row < Math.min(floors, 12); row++) {
        for (let col = 0; col < 3; col++) {
            const mx = bx + col * moduleW, my = by + row * moduleH;
            const pulse = Math.sin(t / 400 + row + col) * 0.15 + 0.4;
            const hue = ((row * 3 + col) * 35) % 360;
            // Module outline
            ctx.strokeStyle = `hsla(${hue}, 75%, 60%, ${pulse})`;
            ctx.lineWidth = 1.2;
            ctx.strokeRect(mx, my, moduleW, moduleH);
            // Diagonal truss — complementary hue
            ctx.strokeStyle = `hsla(${(hue + 120) % 360}, 70%, 55%, ${pulse * 0.7})`;
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(mx + moduleW, my + moduleH); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(mx + moduleW, my); ctx.lineTo(mx, my + moduleH); ctx.stroke();
            // Center node with glow
            const nGlow = ctx.createRadialGradient(mx + moduleW / 2, my + moduleH / 2, 0, mx + moduleW / 2, my + moduleH / 2, 6);
            nGlow.addColorStop(0, `hsla(${hue}, 80%, 65%, ${pulse + 0.3})`);
            nGlow.addColorStop(1, `hsla(${hue}, 80%, 65%, 0)`);
            ctx.fillStyle = nGlow;
            ctx.beginPath(); ctx.arc(mx + moduleW / 2, my + moduleH / 2, 6, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(mx + moduleW / 2, my + moduleH / 2, 2, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${hue}, 90%, 75%, ${pulse + 0.2})`;
            ctx.fill();
        }
    }
    // Outer frame — pink
    ctx.strokeStyle = 'rgba(236, 72, 153, 0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(bx, by, bw, bh);
    const fGrad = ctx.createLinearGradient(bx - 10, gy, bx + bw + 20, gy);
    fGrad.addColorStop(0, 'rgba(236, 72, 153, 0.2)');
    fGrad.addColorStop(0.5, 'rgba(168, 85, 247, 0.3)');
    fGrad.addColorStop(1, 'rgba(236, 72, 153, 0.2)');
    ctx.fillStyle = fGrad;
    ctx.fillRect(bx - 10, gy, bw + 20, 10);
}

function drawShellStructure(ctx, w, h, v, floors, t, dp) {
    const gy = drawGrid(ctx, w, h, '16, 185, 129');
    drawLabel(ctx, w, `SHELL STRUCTURE — ${v.material} | Curvature: ${Math.round(dp.greenIntensity * 100)}%`, 'rgba(52, 211, 153, 0.7)');
    const cx = w / 2;
    const bw = w * 0.35, bh = (gy - 80) * 0.5;
    const bx = (w - bw) / 2, by = gy - bh;
    // Base building — indigo gradient
    const bldgGrad = ctx.createLinearGradient(bx, by, bx + bw, gy);
    bldgGrad.addColorStop(0, 'rgba(99, 102, 241, 0.12)');
    bldgGrad.addColorStop(1, 'rgba(79, 70, 229, 0.06)');
    ctx.fillStyle = bldgGrad;
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = 'rgba(129, 140, 248, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(bx, by, bw, bh);
    // Shell roof — green-to-teal gradient layers
    const shellColors = ['16, 185, 129', '20, 184, 166', '6, 182, 212', '34, 211, 238'];
    for (let r = 0; r < 4; r++) {
        const shellH = 60 + r * 15;
        const shW = bw + 40 + r * 20;
        const pulse = Math.sin(t / 500 + r * 0.8) * 0.2 + 0.45;
        ctx.strokeStyle = `rgba(${shellColors[r]}, ${pulse})`;
        ctx.lineWidth = 2.5 - r * 0.4;
        ctx.beginPath();
        ctx.moveTo(cx - shW / 2, by);
        ctx.quadraticCurveTo(cx, by - shellH, cx + shW / 2, by);
        ctx.stroke();
    }
    // Ribs — warm orange accents
    for (let i = 1; i < 8; i++) {
        const frac = i / 8;
        const x = cx - (bw + 40) / 2 + (bw + 40) * frac;
        const topY = by - 60 * 4 * frac * (1 - frac);
        const pulse = Math.sin(t / 600 + i) * 0.1 + 0.2;
        ctx.strokeStyle = `rgba(249, 115, 22, ${pulse})`;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x, by); ctx.lineTo(x, topY); ctx.stroke();
    }
    // Floor lines — indigo
    for (let i = 1; i < 6; i++) {
        const fy = by + (bh / 6) * i;
        ctx.strokeStyle = 'rgba(129, 140, 248, 0.15)';
        ctx.beginPath(); ctx.moveTo(bx, fy); ctx.lineTo(bx + bw, fy); ctx.stroke();
    }
    const fGrad = ctx.createLinearGradient(bx - 10, gy, bx + bw + 20, gy);
    fGrad.addColorStop(0, 'rgba(16, 185, 129, 0.2)');
    fGrad.addColorStop(1, 'rgba(100, 100, 120, 0.3)');
    ctx.fillStyle = fGrad;
    ctx.fillRect(bx - 10, gy, bw + 20, 10);
}

function drawGenericBuilding(ctx, w, h, v, floors, t, dp) {
    const gy = drawGrid(ctx, w, h, '99, 102, 241');
    drawLabel(ctx, w, v.name.toUpperCase() + ' — ' + v.material, 'rgba(129, 140, 248, 0.7)');
    const bw = w * dp.widthFactor, bh = Math.min(floors * 22, gy - 60) * dp.heightFactor;
    const bx = (w - bw) / 2, by = gy - bh;
    // Gradient fill
    const bGrad = ctx.createLinearGradient(bx, by, bx + bw, gy);
    bGrad.addColorStop(0, 'rgba(99, 102, 241, 0.15)');
    bGrad.addColorStop(0.5, 'rgba(139, 92, 246, 0.1)');
    bGrad.addColorStop(1, 'rgba(59, 130, 246, 0.05)');
    ctx.fillStyle = bGrad;
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = 'rgba(129, 140, 248, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(bx, by, bw, bh);
    for (let i = 1; i < Math.min(floors, 18); i++) {
        const fy = by + (bh / Math.min(floors, 18)) * i;
        const hue = (i * 20 + 200) % 360;
        ctx.strokeStyle = `hsla(${hue}, 60%, 60%, 0.15)`;
        ctx.beginPath(); ctx.moveTo(bx, fy); ctx.lineTo(bx + bw, fy); ctx.stroke();
    }
    // Rainbow scan line
    const scanY = by + ((t / 20) % bh);
    const scanHue = ((t / 10) % 360);
    ctx.strokeStyle = `hsla(${scanHue}, 80%, 60%, 0.4)`;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(bx, scanY); ctx.lineTo(bx + bw, scanY); ctx.stroke();
    const fGrad = ctx.createLinearGradient(bx - 10, gy, bx + bw + 20, gy);
    fGrad.addColorStop(0, 'rgba(99, 102, 241, 0.3)');
    fGrad.addColorStop(1, 'rgba(100, 100, 120, 0.3)');
    ctx.fillStyle = fGrad;
    ctx.fillRect(bx - 10, gy, bw + 20, 10);
}

function drawDimension(ctx, x1, y1, x2, y2, label) {
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.setLineDash([]);
    // Arrows
    ctx.beginPath(); ctx.moveTo(x1, y1 - 4); ctx.lineTo(x1, y1 + 4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x2, y2 - 4); ctx.lineTo(x2, y2 + 4); ctx.stroke();
    ctx.fillStyle = 'rgba(0, 212, 255, 0.4)';
    ctx.font = '9px "JetBrains Mono"';
    ctx.textAlign = 'center';
    ctx.fillText(label, (x1 + x2) / 2, y1 - 6);
}

// ═══════════════════════════════════════════════════════════════
// MODULE 2 — LIVE SENSORS
// ═══════════════════════════════════════════════════════════════
async function loadSensors() {
    try {
        const res = await fetch('/api/sensors');
        const data = await res.json();
        renderSensorTiles(data.readings);
        currentSensorHistory = data.history;
        updateSensorChart();
    } catch (err) {
        console.error('Sensor load failed:', err);
    }
}

function renderSensorTiles(readings) {
    const container = document.getElementById('sensorTiles');
    container.innerHTML = readings.map(s => `
        <div class="sensor-tile ${s.status}">
            <div class="sensor-header">
                <span class="sensor-icon">${s.icon}</span>
                <span class="sensor-badge ${s.status}">${s.status.toUpperCase()}</span>
            </div>
            <div class="sensor-label">${s.label}</div>
            <div class="sensor-value value-flash">
                ${s.value}<span class="sensor-unit">${s.unit}</span>
            </div>
            <div class="sensor-timestamp">Updated: ${new Date(s.timestamp).toLocaleTimeString()}</div>
        </div>
    `).join('');
}

function updateSensorChart() {
    const ctx = document.getElementById('sensorChart');
    if (!ctx) return;

    const historyData = currentSensorHistory[activeSensor] || [];
    const labels = historyData.map(d => d.time);
    const values = historyData.map(d => d.value);

    const colors = {
        soil_pressure: { line: '#00d4ff', bg: 'rgba(0, 212, 255, 0.1)' },
        temperature: { line: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
        structural_load: { line: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
        moisture: { line: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' }
    };

    const color = colors[activeSensor] || colors.soil_pressure;

    if (sensorChart) {
        sensorChart.data.labels = labels;
        sensorChart.data.datasets[0].data = values;
        sensorChart.data.datasets[0].borderColor = color.line;
        sensorChart.data.datasets[0].backgroundColor = color.bg;
        sensorChart.update('none');
        return;
    }

    sensorChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: activeSensor,
                data: values,
                borderColor: color.line,
                backgroundColor: color.bg,
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 5,
                pointHoverBackgroundColor: color.line
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#1a1f2e',
                    titleColor: '#e8ecf4',
                    bodyColor: '#8892a8',
                    borderColor: '#2a3144',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(42, 49, 68, 0.5)', drawBorder: false },
                    ticks: { color: '#5a6478', font: { family: 'JetBrains Mono', size: 10 }, maxTicksLimit: 12 }
                },
                y: {
                    grid: { color: 'rgba(42, 49, 68, 0.5)', drawBorder: false },
                    ticks: { color: '#5a6478', font: { family: 'JetBrains Mono', size: 10 } }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

// Chart tab switching
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('chart-tab')) {
        document.querySelectorAll('.chart-tab').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        activeSensor = e.target.dataset.sensor;
        updateSensorChart();
    }
});

// ═══════════════════════════════════════════════════════════════
// MODULE 3 — RECALIBRATION ENGINE
// ═══════════════════════════════════════════════════════════════
async function loadRecalibration() {
    try {
        const res = await fetch('/api/recalibrations');
        const data = await res.json();
        currentAlert = data.alert;
        renderRecalibrationAlert(data.alert);
        renderAuditLog(data.audit_log);
    } catch (err) {
        console.error('Recalibration load failed:', err);
    }
}

function renderRecalibrationAlert(alert) {
    document.getElementById('alertId').textContent = alert.id;
    document.getElementById('alertTrigger').textContent = alert.trigger;
    document.getElementById('originalDesign').textContent = alert.original_design;
    document.getElementById('aiAdjustment').textContent = alert.ai_adjustment;
    document.getElementById('alertImpact').textContent = alert.impact;
}

function renderAuditLog(log) {
    const tbody = document.getElementById('auditBody');
    if (!log || log.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-row">No audit entries yet</td></tr>';
        return;
    }
    tbody.innerHTML = log.map(entry => `
        <tr>
            <td>${entry.id}</td>
            <td>${entry.timestamp}</td>
            <td>${entry.trigger}</td>
            <td><span class="action-badge ${entry.action}">${entry.action}</span></td>
            <td>${entry.result}</td>
        </tr>
    `).join('');
}

function initRecalibrationActions() {
    document.getElementById('btnAccept').addEventListener('click', async () => {
        if (!currentAlert) return;
        try {
            const res = await fetch('/api/recalibrations/action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: currentAlert.id,
                    trigger: currentAlert.trigger,
                    action: 'accepted',
                    result: 'Design updated per AI recommendation'
                })
            });
            const data = await res.json();
            renderAuditLog(data.audit_log);
            // Load new alert
            loadRecalibration();
        } catch (err) {
            console.error('Accept action failed:', err);
        }
    });

    document.getElementById('btnReject').addEventListener('click', async () => {
        if (!currentAlert) return;
        try {
            const res = await fetch('/api/recalibrations/action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: currentAlert.id,
                    trigger: currentAlert.trigger,
                    action: 'rejected',
                    result: 'Original design retained'
                })
            });
            const data = await res.json();
            renderAuditLog(data.audit_log);
            loadRecalibration();
        } catch (err) {
            console.error('Reject action failed:', err);
        }
    });
}

// ═══════════════════════════════════════════════════════════════
// MODULE 4 — RISK PREDICTOR
// ═══════════════════════════════════════════════════════════════
async function loadRiskData() {
    try {
        const res = await fetch('/api/risks');
        const data = await res.json();
        renderRiskData(data);
    } catch (err) {
        console.error('Risk load failed:', err);
    }
}

function renderRiskData(data) {
    // Progress bars
    const predictedBar = document.getElementById('predictedBar');
    const actualBar = document.getElementById('actualBar');
    document.getElementById('predictedPct').textContent = data.predicted_progress + '%';
    document.getElementById('actualPct').textContent = data.actual_progress + '%';
    document.getElementById('scheduleVariance').textContent = '📉 ' + data.schedule_variance;

    // Animate progress bars
    setTimeout(() => {
        predictedBar.style.width = data.predicted_progress + '%';
        actualBar.style.width = data.actual_progress + '%';
    }, 100);

    // Risk cards
    const riskContainer = document.getElementById('riskCards');
    riskContainer.innerHTML = data.risks.map(r => `
        <div class="risk-card">
            <div class="risk-card-header">
                <div class="risk-type">
                    <span class="risk-type-icon">${r.icon}</span>
                    <span>${r.type}</span>
                </div>
                <span class="severity-badge ${r.severity}">${r.severity}</span>
            </div>
            <div class="risk-probability">
                <span class="risk-prob-label">Probability</span>
                <div class="risk-prob-track">
                    <div class="risk-prob-fill ${r.severity}" style="width: ${r.probability}%"></div>
                </div>
                <span class="risk-prob-value">${r.probability}%</span>
            </div>
            <div class="risk-description">${r.description}</div>
            <div class="risk-mitigation">${r.mitigation}</div>
        </div>
    `).join('');

    // Savings
    const savingsGrid = document.getElementById('savingsGrid');
    const s = data.savings;
    savingsGrid.innerHTML = `
        <div class="savings-item">
            <div class="savings-icon">💰</div>
            <div class="savings-value">${s.cost_saved}</div>
            <div class="savings-label">Cost Saved</div>
        </div>
        <div class="savings-item">
            <div class="savings-icon">⏱</div>
            <div class="savings-value">${s.time_saved}</div>
            <div class="savings-label">Time Saved</div>
        </div>
        <div class="savings-item">
            <div class="savings-icon">🔄</div>
            <div class="savings-value">${s.rework_avoided}</div>
            <div class="savings-label">Rework Avoided</div>
        </div>
        <div class="savings-item">
            <div class="savings-icon">📈</div>
            <div class="savings-value">${s.efficiency_gain}</div>
            <div class="savings-label">Efficiency Gain</div>
        </div>
    `;
}

// ═══════════════════════════════════════════════════════════════
// MODULE 5 — INTEGRATION HUB
// ═══════════════════════════════════════════════════════════════
async function loadIntegrations() {
    try {
        const res = await fetch('/api/integrations');
        const data = await res.json();
        renderIntegrations(data.sources);
    } catch (err) {
        console.error('Integration load failed:', err);
    }
}

function renderIntegrations(sources) {
    const container = document.getElementById('integrationGrid');
    container.innerHTML = sources.map(s => `
        <div class="integration-tile ${s.status}">
            <div class="integration-header">
                <div class="integration-name">
                    <span class="integration-icon">${s.icon}</span>
                    <div>
                        <div class="integration-title">${s.name}</div>
                        <div class="integration-type">${s.type}</div>
                    </div>
                </div>
                <div class="connection-status ${s.status}">
                    <span class="connection-dot"></span>
                    ${s.status}
                </div>
            </div>
            <div class="integration-desc">${s.description}</div>
            <div class="integration-stats">
                <div class="integration-stat">
                    <span class="integration-stat-label">Last Sync</span>
                    <span class="integration-stat-value">${s.last_sync}</span>
                </div>
                <div class="integration-stat">
                    <span class="integration-stat-label">Data Points</span>
                    <span class="integration-stat-value">${s.data_points}</span>
                </div>
                <div class="integration-stat">
                    <span class="integration-stat-label">Latency</span>
                    <span class="integration-stat-value">${s.latency}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// ─── Spinning animation for loading ─────────────────────────
const spinStyle = document.createElement('style');
spinStyle.textContent = `
    @keyframes spin { to { transform: rotate(360deg); } }
    .spin { animation: spin 1s linear infinite; }
`;
document.head.appendChild(spinStyle);
