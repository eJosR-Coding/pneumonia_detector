import './GradCamViewer.css'

export default function GradCamViewer({ originalSrc, heatmapBase64 }) {
    if (!heatmapBase64) return null

    return (
        <section className="gradcam-section animate-fade-in">
            <h3>
                <span className="icon">visibility</span>
                Grad-CAM Visualization
            </h3>

            <div className="gradcam-grid">
                {/* ── Original ─────────────────────────── */}
                <div className="gradcam-frame original glass-panel">
                    <div className="gradcam-frame-bar">
                        <span className="frame-dot" />
                        <span className="gradcam-frame-label">Input Source</span>
                    </div>
                    <div className="gradcam-img-wrap">
                        <div className="corner tl" />
                        <div className="corner tr" />
                        <div className="corner bl" />
                        <div className="corner br" />
                        <img src={originalSrc} alt="Original chest X-ray" />
                    </div>
                </div>

                {/* ── Heatmap ──────────────────────────── */}
                <div className="gradcam-frame heatmap glass-panel">
                    <div className="gradcam-frame-bar">
                        <span className="frame-dot" />
                        <span className="gradcam-frame-label">Grad-CAM Overlay</span>
                        <span className="gradcam-frame-status">ACTIVE</span>
                    </div>
                    <div className="gradcam-img-wrap">
                        <div className="scan-line" />
                        <img
                            src={`data:image/png;base64,${heatmapBase64}`}
                            alt="Grad-CAM heatmap overlay"
                        />
                    </div>
                    <div className="gradcam-scale">
                        <span className="gradcam-scale-label low">Low</span>
                        <div className="gradcam-scale-bar" />
                        <span className="gradcam-scale-label high">High</span>
                    </div>
                </div>
            </div>
        </section>
    )
}
