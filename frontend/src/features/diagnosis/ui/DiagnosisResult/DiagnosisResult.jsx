import './DiagnosisResult.css'

export default function DiagnosisResult({ data }) {
    if (!data) return null

    const isPneumonia = data.diagnosis === 'PNEUMONIA'
    const pct = (data.probability * 100).toFixed(1)
    const confPct = (data.confidence * 100).toFixed(1)

    return (
        <div className="result-cards-grid animate-fade-in">
            {/* ── Primary Diagnosis ──────────────────── */}
            <div className={`diagnosis-card glow-border ${isPneumonia ? 'glow-border-danger' : ''} diagnosis-primary`}>
                <div className="diagnosis-card-inner">
                    <div className="bg-icon">
                        <span className="icon">{isPneumonia ? 'coronavirus' : 'verified'}</span>
                    </div>
                    <p className="diagnosis-card-label">Primary Diagnosis</p>
                    <p className={`diagnosis-label ${isPneumonia ? 'pneumonia' : 'normal'}`}>
                        {isPneumonia ? 'DETECTED' : 'CLEAR'}
                        <span className="icon">{isPneumonia ? 'warning' : 'check_circle'}</span>
                    </p>
                    <p className="diagnosis-sublabel">
                        {isPneumonia ? 'Pneumonia' : 'Normal'} · Threshold {data.threshold}
                    </p>
                    <div className="diagnosis-card-footer">
                        <span>Model: DenseNet-121</span>
                    </div>
                </div>
            </div>

            {/* ── Confidence Level ───────────────────── */}
            <div className="diagnosis-card glow-border">
                <div className="diagnosis-card-inner">
                    <p className="diagnosis-card-label">Confidence Level</p>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <span className="confidence-value">
                            {confPct}<span className="unit">%</span>
                        </span>
                        <span className={`confidence-tag ${data.confidence_warning ? 'low' : 'high'}`}>
                            {data.confidence_warning ? 'Low Certainty' : 'High Certainty'}
                        </span>
                    </div>
                    <div className="confidence-bar">
                        <div
                            className={`confidence-bar-fill ${isPneumonia ? 'pneumonia' : 'normal'}`}
                            style={{ width: `${confPct}%` }}
                        />
                    </div>
                    <p className="confidence-bar-label">
                        Pneumonia probability: {pct}%
                    </p>
                    {data.confidence_warning && (
                        <div className="confidence-warning">
                            <span className="icon">info</span>
                            Low confidence — consult a specialist
                        </div>
                    )}
                </div>
            </div>

            {/* ── Model Metrics ──────────────────────── */}
            <div className="diagnosis-card glow-border">
                <div className="diagnosis-card-inner">
                    <p className="diagnosis-card-label">Model Performance</p>
                    <div className="metrics-list">
                        <MetricRow label="AUC-ROC" value={data.model_metrics.auc_roc.toFixed(4)} />
                        <MetricRow label="Sensitivity" value={`${(data.model_metrics.sensitivity * 100).toFixed(1)}%`} />
                        <MetricRow label="Specificity" value={`${(data.model_metrics.specificity * 100).toFixed(1)}%`} />
                        <MetricRow label="Threshold" value={data.threshold} />
                    </div>
                </div>
            </div>
        </div>
    )
}

function MetricRow({ label, value }) {
    return (
        <div className="metric-row">
            <span className="metric-row-label">{label}</span>
            <span className="metric-row-value">{value}</span>
        </div>
    )
}
