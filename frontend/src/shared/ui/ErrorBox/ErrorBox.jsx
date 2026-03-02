import './ErrorBox.css'

export default function ErrorBox({ message }) {
    if (!message) return null
    return (
        <div className="error-box" role="alert">
            <span className="icon">error</span>
            <span className="error-box-message">{message}</span>
        </div>
    )
}
