import './Disclaimer.css'

export default function Disclaimer() {
    return (
        <div className="disclaimer">
            <span className="icon">warning</span>
            <p>
                <strong>Not for clinical use.</strong> This is a research/learning
                project. Grad-CAM shows where the model <em>looked</em>, not necessarily
                where disease is. Probabilities are not formally calibrated. Always
                consult a qualified radiologist.
            </p>
        </div>
    )
}
