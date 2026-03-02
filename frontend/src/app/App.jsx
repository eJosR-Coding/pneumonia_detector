import { useState, useCallback } from 'react'

import Header from '../shared/ui/Header/Header'
import Spinner from '../shared/ui/Spinner/Spinner'
import ErrorBox from '../shared/ui/ErrorBox/ErrorBox'
import Disclaimer from '../shared/ui/Disclaimer/Disclaimer'

import UploadZone from '../features/diagnosis/ui/UploadZone/UploadZone'
import DiagnosisResult from '../features/diagnosis/ui/DiagnosisResult/DiagnosisResult'
import GradCamViewer from '../features/diagnosis/ui/GradCamViewer/GradCamViewer'

import { analyzeDiagnosis } from '../features/diagnosis/api/diagnosisApi'

export default function App() {
    const [file, setFile] = useState(null)
    const [previewUrl, setPreviewUrl] = useState(null)
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState(null)
    const [error, setError] = useState(null)

    const handleFileSelected = useCallback((f) => {
        setFile(f)
        setResult(null)
        setError(null)
        if (f) {
            setPreviewUrl(URL.createObjectURL(f))
        } else {
            setPreviewUrl(null)
        }
    }, [])

    const handleAnalyze = useCallback(async () => {
        if (!file) return
        setLoading(true)
        setError(null)
        setResult(null)

        try {
            const data = await analyzeDiagnosis(file)
            setResult(data)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [file])

    const handleReset = useCallback(() => {
        setFile(null)
        setPreviewUrl(null)
        setResult(null)
        setError(null)
    }, [])

    return (
        <div className="app-layout bg-tech">
            <Header />

            <main className="app-main">
                <UploadZone
                    onFileSelected={handleFileSelected}
                    selectedFile={file}
                    onAnalyze={handleAnalyze}
                    loading={loading}
                />

                <section className="results-panel">
                    {/* ── Title ──────────────────────────────── */}
                    <div className="results-header">
                        <h2>
                            <span className="icon" style={{ color: 'var(--secondary)' }}>hub</span>
                            Diagnostic Output
                        </h2>
                        {result && (
                            <button className="reset-btn" onClick={handleReset} type="button">
                                <span className="icon" style={{ fontSize: 16 }}>refresh</span>
                                New Analysis
                            </button>
                        )}
                    </div>

                    {/* ── States ─────────────────────────────── */}
                    {!loading && !result && !error && (
                        <div className="empty-state">
                            <span className="icon" style={{ fontSize: 64, color: 'var(--text-dim)' }}>
                                radiology
                            </span>
                            <p>Upload a chest X-ray and run the analysis to see results here.</p>
                        </div>
                    )}

                    {loading && <Spinner label="Neural network processing" />}

                    <ErrorBox message={error} />

                    {result && (
                        <div className="results-content animate-fade-in">
                            <DiagnosisResult data={result} />

                            <GradCamViewer
                                originalSrc={previewUrl}
                                heatmapBase64={result.heatmap}
                            />

                            <Disclaimer />
                        </div>
                    )}
                </section>
            </main>
        </div>
    )
}
