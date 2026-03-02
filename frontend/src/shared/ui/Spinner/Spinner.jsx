import './Spinner.css'

export default function Spinner({ label = 'Processing' }) {
    return (
        <div className="spinner-container">
            <div className="spinner-ring" />
            <span className="spinner-label">{label}...</span>
        </div>
    )
}
