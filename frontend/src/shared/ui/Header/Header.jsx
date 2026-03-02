import './Header.css'

export default function Header() {
    return (
        <header className="header glass-panel">
            <div className="header-left">
                <div className="header-icon-wrap">
                    <span className="icon">medical_services</span>
                </div>
                <div className="header-title-group">
                    <h1 className="header-title">
                        Pneumonia Detector
                        <span className="version-tag">AI</span>
                    </h1>
                    <div className="header-accent-line" />
                </div>
            </div>
            <div className="header-right">
                <div className="header-status">
                    <span className="header-status-label">System Status</span>
                    <span className="header-status-value">
                        <span className="status-dot" />
                        Online
                    </span>
                </div>
            </div>
        </header>
    )
}
