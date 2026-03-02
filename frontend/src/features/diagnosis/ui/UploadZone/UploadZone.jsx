import { useRef, useState, useCallback } from 'react'
import { ACCEPTED_TYPES } from '../../const'
import './UploadZone.css'

export default function UploadZone({ onFileSelected, selectedFile, onAnalyze, loading }) {
    const inputRef = useRef(null)
    const [dragOver, setDragOver] = useState(false)
    const [previewUrl, setPreviewUrl] = useState(null)

    const handleFile = useCallback((file) => {
        if (!file) return
        if (!ACCEPTED_TYPES.includes(file.type)) return
        setPreviewUrl(URL.createObjectURL(file))
        onFileSelected(file)
    }, [onFileSelected])

    const handleDrop = useCallback((e) => {
        e.preventDefault()
        setDragOver(false)
        const file = e.dataTransfer.files[0]
        if (file) handleFile(file)
    }, [handleFile])

    const handleChange = useCallback((e) => {
        if (e.target.files[0]) handleFile(e.target.files[0])
    }, [handleFile])

    const handleReset = useCallback(() => {
        setPreviewUrl(null)
        onFileSelected(null)
        if (inputRef.current) inputRef.current.value = ''
    }, [onFileSelected])

    return (
        <aside className="upload-panel">
            <div className="upload-panel-heading">
                <h2>New Analysis</h2>
                <p>DenseNet-121 · Grad-CAM</p>
            </div>

            {!previewUrl ? (
                <div
                    className={`drop-zone ${dragOver ? 'drag-over' : ''}`}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                >
                    <div className="drop-zone-sweep" />
                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/jpeg,image/png"
                        onChange={handleChange}
                    />
                    <div className="drop-zone-icon">
                        <div className="ping" />
                        <span className="icon">cloud_upload</span>
                    </div>
                    <h3>Initialize Upload</h3>
                    <p>Supported: JPEG · PNG</p>
                    <span className="drop-zone-tag top-left">UL-ZONE</span>
                    <span className="drop-zone-tag bottom-right">READY</span>
                </div>
            ) : (
                <div className="preview-area">
                    <div className="preview-img-wrap">
                        <img src={previewUrl} alt="Selected X-ray preview" />
                        <div className="corner tl" />
                        <div className="corner tr" />
                        <div className="corner bl" />
                        <div className="corner br" />
                    </div>
                    <p className="preview-filename">{selectedFile?.name}</p>
                    <button className="preview-change-btn" onClick={handleReset} type="button">
                        ↩ Change file
                    </button>
                </div>
            )}

            <button
                className="analyze-btn"
                onClick={onAnalyze}
                disabled={!selectedFile || loading}
                type="button"
            >
                <span className="sweep" />
                <span className="icon" style={{ fontSize: 22 }}>analytics</span>
                {loading ? 'Analyzing...' : 'Execute Diagnosis'}
            </button>
        </aside>
    )
}
