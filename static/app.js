document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
        document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
        document.querySelectorAll(".form-panel").forEach((p) => p.classList.remove("active"));
        tab.classList.add("active");
        document.getElementById("panel-" + tab.dataset.domain).classList.add("active");
        document.getElementById("results").classList.add("hidden");
    });
});

const labels = { healthcare: "Analyze Health Risk", academics: "Predict Performance", daily_life: "Get Prediction" };

function escapeHtml(value) {
    return String(value).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
        .replaceAll('"',"&quot;").replaceAll("'","&#039;");
}

function showError(msg) {
    const el = document.getElementById("results");
    el.innerHTML = "";
    const card = document.createElement("div");
    card.className = "result-card";
    const p = document.createElement("p");
    p.style.color = "var(--red)";
    p.textContent = msg;
    card.appendChild(p);
    el.appendChild(card);
    el.classList.remove("hidden");
}

async function predict(domain, button) {
    button.classList.add("loading");
    button.disabled = true;
    button.textContent = "Analyzing...";

    const inputs = domain === "healthcare"
        ? { symptoms: document.getElementById("h-symptoms").value, age: document.getElementById("h-age").value, lifestyle: document.getElementById("h-lifestyle").value }
        : domain === "academics"
        ? { current_grade: document.getElementById("a-grade").value, study_hours: document.getElementById("a-study").value, attendance: document.getElementById("a-attendance").value, difficulty: document.getElementById("a-difficulty").value, extracurriculars: document.getElementById("a-extra").value }
        : { decision: document.getElementById("d-decision").value, energy_level: document.getElementById("d-energy").value, time_available: document.getElementById("d-time").value, priority: document.getElementById("d-priority").value, mood: document.getElementById("d-mood").value };

    try {
        const resp = await fetch("/predict", {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({ domain, inputs })
        });
        const data = await resp.json().catch(() => ({ error: "Invalid server response." }));
        if (!resp.ok || data.error) showError(data.error || "Request failed.");
        else renderResults(data, domain);
    } catch (_err) {
        showError("Unable to reach the server. Please try again.");
    } finally {
        button.classList.remove("loading");
        button.disabled = false;
        button.textContent = labels[domain];
    }
}

function renderResults(data, domain) {
    const el = document.getElementById("results");
    const html = domain === "healthcare" ? renderHealthcare(data) : domain === "academics" ? renderAcademics(data) : renderDailyLife(data);
    el.innerHTML = html;
    el.classList.remove("hidden");
    el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderHealthcare(data) {
    const cards = (data.predictions || []).map((p) => {
        const pct = Math.round(Number(p.probability) * 100);
        const sevClass = ["low","moderate","high"].includes(p.severity) ? p.severity : "low";
        const symptoms = (p.matched_symptoms || []).map((s) => '<span class="symptom-tag">' + escapeHtml(s) + "</span>").join("");
        return '<div class="prediction-item"><div style="display:flex;justify-content:space-between;align-items:center"><span class="prediction-name">' + escapeHtml(p.condition) + '</span><span class="severity-badge severity-' + sevClass + '">' + escapeHtml(sevClass) + '</span></div><div class="prob-bar-wrap"><div class="prob-bar"><div class="prob-fill ' + sevClass + '" style="width:' + Math.max(0,Math.min(100,pct)) + '%"></div></div><div class="prob-label"><span>Probability</span><span>' + pct + '%</span></div></div>' + (symptoms ? '<div class="matched-symptoms">' + symptoms + "</div>" : "") + "</div>";
    }).join("");
    const recs = (data.recommendations || []).map((r) => '<div class="rec-item"><span class="rec-bullet">&#10003;</span><span>' + escapeHtml(r) + "</span></div>").join("");
    return '<div class="result-card"><div class="result-header"><span class="result-title">Risk Analysis</span><span class="domain-badge">' + escapeHtml(data.domain) + "</span></div>" + cards + '<div class="recs-section"><h3>Recommendations</h3>' + recs + "</div>" + (data.disclaimer ? '<div class="disclaimer">' + escapeHtml(data.disclaimer) + "</div>" : "") + "</div>";
}

function renderAcademics(data) {
    const p = data.predictions?.[0];
    if (!p) return '<div class="result-card"><p>No prediction available.</p></div>';
    const grade = Number(p.predicted_grade);
    const color = grade >= 75 ? "var(--green)" : grade >= 60 ? "var(--orange)" : "var(--red)";
    const trend = p.grade_trend === "improving" ? "&#9650; Improving" : "&#9660; Declining";
    const trendColor = p.grade_trend === "improving" ? "var(--green)" : "var(--red)";
    const analysisHtml = Object.entries(data.analysis || {}).map(([key,val]) => '<div class="analysis-item"><div class="analysis-value">' + escapeHtml(val) + '</div><div class="analysis-label">' + escapeHtml(key.replace(/_/g," ")) + "</div></div>").join("");
    const recs = (data.recommendations || []).map((r) => '<div class="rec-item"><span class="rec-bullet">&#10003;</span><span>' + escapeHtml(r) + "</span></div>").join("");
    return '<div class="result-card"><div class="result-header"><span class="result-title">Performance Prediction</span><span class="domain-badge">' + escapeHtml(data.domain) + "</span></div><div class="verdict-box"><div class="verdict-score" style="color:' + color + '">' + grade + '%</div><div class="verdict-text">' + escapeHtml(p.outcome) + '</div><div style="margin-top:8px;font-size:14px;color:' + trendColor + '">' + trend + '</div><div style="margin-top:4px;font-size:13px;color:var(--text-dim)">Pass Likelihood: ' + Math.round(Number(p.pass_likelihood)*100) + '%</div></div><div class="analysis-grid">' + analysisHtml + '</div><div class="recs-section"><h3>Recommendations</h3>' + recs + "</div></div>";
}

function renderDailyLife(data) {
    const p = data.predictions?.[0];
    if (!p) return '<div class="result-card"><p>No prediction available.</p></div>';
    const pct = Math.round(Number(p.success_likelihood) * 100);
    const color = pct >= 75 ? "var(--green)" : pct >= 50 ? "var(--orange)" : "var(--red)";
    const cats = (p.categories || []).map((c) => '<span class="symptom-tag">' + escapeHtml(c) + "</span>").join("");
    const factorsHtml = Object.entries(data.factors || {}).map(([key,val]) => '<div class="analysis-item"><div class="analysis-value">' + escapeHtml(val) + '</div><div class="analysis-label">' + escapeHtml(key.replace(/_/g," ")) + "</div></div>").join("");
    const tips = (data.tips || []).map((t) => '<div class="rec-item"><span class="rec-bullet">&#9679;</span><span>' + escapeHtml(t) + "</span></div>").join("");
    return '<div class="result-card"><div class="result-header"><span class="result-title">Decision Analysis</span><span class="domain-badge">' + escapeHtml(data.domain) + "</span></div><div class="verdict-box"><div class="verdict-score" style="color:' + color + '">' + pct + '%</div><div class="verdict-text">' + escapeHtml(p.verdict) + '</div><div style="margin-top:8px">' + cats + '</div><div style="margin-top:8px;font-size:13px;color:var(--text-dim)">Best time: ' + escapeHtml(p.optimal_time) + "</div></div><div class="analysis-grid">' + factorsHtml + '</div><div class="recs-section"><h3>Smart Tips</h3>' + tips + "</div></div>";
}

document.querySelectorAll(".predict-btn").forEach((button) => {
    button.addEventListener("click", () => predict(button.dataset.domain, button));
});
