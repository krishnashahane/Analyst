// Tab switching
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.form-panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById('panel-' + tab.dataset.domain).classList.add('active');
        document.getElementById('results').classList.add('hidden');
    });
});

// Predict
async function predict(domain) {
    const btn = event.target;
    btn.classList.add('loading');
    btn.textContent = 'Analyzing...';

    let inputs = {};
    if (domain === 'healthcare') {
        inputs = {
            symptoms: document.getElementById('h-symptoms').value,
            age: document.getElementById('h-age').value,
            lifestyle: document.getElementById('h-lifestyle').value,
        };
    } else if (domain === 'academics') {
        inputs = {
            current_grade: document.getElementById('a-grade').value,
            study_hours: document.getElementById('a-study').value,
            attendance: document.getElementById('a-attendance').value,
            difficulty: document.getElementById('a-difficulty').value,
            extracurriculars: document.getElementById('a-extra').value,
        };
    } else if (domain === 'daily_life') {
        inputs = {
            decision: document.getElementById('d-decision').value,
            energy_level: document.getElementById('d-energy').value,
            time_available: document.getElementById('d-time').value,
            priority: document.getElementById('d-priority').value,
            mood: document.getElementById('d-mood').value,
        };
    }

    try {
        const resp = await fetch('/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ domain, inputs }),
        });
        const data = await resp.json();

        if (data.error) {
            showError(data.error);
        } else {
            renderResults(data, domain);
        }
    } catch (err) {
        showError('Something went wrong. Please try again.');
    } finally {
        btn.classList.remove('loading');
        const labels = {
            healthcare: 'Analyze Health Risk',
            academics: 'Predict Performance',
            daily_life: 'Get Prediction',
        };
        btn.textContent = labels[domain];
    }
}

function showError(msg) {
    const el = document.getElementById('results');
    el.innerHTML = `<div class="result-card"><p style="color:var(--red)">${msg}</p></div>`;
    el.classList.remove('hidden');
}

function renderResults(data, domain) {
    const el = document.getElementById('results');
    let html = '';

    if (domain === 'healthcare') {
        html = renderHealthcare(data);
    } else if (domain === 'academics') {
        html = renderAcademics(data);
    } else if (domain === 'daily_life') {
        html = renderDailyLife(data);
    }

    el.innerHTML = html;
    el.classList.remove('hidden');
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderHealthcare(data) {
    let cards = '';
    data.predictions.forEach(p => {
        const pct = Math.round(p.probability * 100);
        const sevClass = p.severity || 'low';
        const symptoms = (p.matched_symptoms || []).map(s =>
            `<span class="symptom-tag">${s}</span>`
        ).join('');

        cards += `
        <div class="prediction-item">
            <div style="display:flex;justify-content:space-between;align-items:center">
                <span class="prediction-name">${p.condition}</span>
                <span class="severity-badge severity-${sevClass}">${sevClass}</span>
            </div>
            <div class="prob-bar-wrap">
                <div class="prob-bar"><div class="prob-fill ${sevClass}" style="width:${pct}%"></div></div>
                <div class="prob-label"><span>Probability</span><span>${pct}%</span></div>
            </div>
            ${symptoms ? `<div class="matched-symptoms">${symptoms}</div>` : ''}
        </div>`;
    });

    const recs = (data.recommendations || []).map(r =>
        `<div class="rec-item"><span class="rec-bullet">&#10003;</span><span>${r}</span></div>`
    ).join('');

    return `
    <div class="result-card">
        <div class="result-header">
            <span class="result-title">Diagnosis Analysis</span>
            <span class="domain-badge">${data.domain}</span>
        </div>
        ${cards}
        <div class="recs-section">
            <h3>Recommendations</h3>
            ${recs}
        </div>
        ${data.disclaimer ? `<div class="disclaimer">${data.disclaimer}</div>` : ''}
    </div>`;
}

function renderAcademics(data) {
    const p = data.predictions[0];
    const grade = p.predicted_grade;
    const color = grade >= 75 ? 'var(--green)' : grade >= 60 ? 'var(--orange)' : 'var(--red)';
    const trend = p.grade_trend === 'improving' ? '&#9650; Improving' : '&#9660; Declining';
    const trendColor = p.grade_trend === 'improving' ? 'var(--green)' : 'var(--red)';

    const analysis = data.analysis || {};
    const analysisHtml = Object.entries(analysis).map(([key, val]) => `
        <div class="analysis-item">
            <div class="analysis-value">${val}</div>
            <div class="analysis-label">${key.replace(/_/g, ' ')}</div>
        </div>
    `).join('');

    const recs = (data.recommendations || []).map(r =>
        `<div class="rec-item"><span class="rec-bullet">&#10003;</span><span>${r}</span></div>`
    ).join('');

    return `
    <div class="result-card">
        <div class="result-header">
            <span class="result-title">Performance Prediction</span>
            <span class="domain-badge">${data.domain}</span>
        </div>
        <div class="verdict-box">
            <div class="verdict-score" style="color:${color}">${grade}%</div>
            <div class="verdict-text">${p.outcome}</div>
            <div style="margin-top:8px;font-size:14px;color:${trendColor}">${trend}</div>
            <div style="margin-top:4px;font-size:13px;color:var(--text-dim)">Pass Likelihood: ${Math.round(p.pass_likelihood * 100)}%</div>
        </div>
        <div class="analysis-grid">${analysisHtml}</div>
        <div class="recs-section">
            <h3>Recommendations</h3>
            ${recs}
        </div>
    </div>`;
}

function renderDailyLife(data) {
    const p = data.predictions[0];
    const pct = Math.round(p.success_likelihood * 100);
    const color = pct >= 75 ? 'var(--green)' : pct >= 50 ? 'var(--orange)' : 'var(--red)';

    const cats = (p.categories || []).map(c =>
        `<span class="symptom-tag">${c}</span>`
    ).join('');

    const factors = data.factors || {};
    const factorsHtml = Object.entries(factors).map(([key, val]) => `
        <div class="analysis-item">
            <div class="analysis-value">${val}</div>
            <div class="analysis-label">${key.replace(/_/g, ' ')}</div>
        </div>
    `).join('');

    const tips = (data.tips || []).map(t =>
        `<div class="rec-item"><span class="rec-bullet">&#9679;</span><span>${t}</span></div>`
    ).join('');

    return `
    <div class="result-card">
        <div class="result-header">
            <span class="result-title">Decision Analysis</span>
            <span class="domain-badge">${data.domain}</span>
        </div>
        <div class="verdict-box">
            <div class="verdict-score" style="color:${color}">${pct}%</div>
            <div class="verdict-text">${p.verdict}</div>
            <div style="margin-top:8px">${cats}</div>
            <div style="margin-top:8px;font-size:13px;color:var(--text-dim)">Best time: ${p.optimal_time}</div>
        </div>
        <div class="analysis-grid">${factorsHtml}</div>
        <div class="recs-section">
            <h3>Smart Tips</h3>
            ${tips}
        </div>
    </div>`;
}
