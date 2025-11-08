'use client'

import { useEffect, useRef, useState } from 'react'

interface IOSWalletModalProps {
  uri: string
  isOpen: boolean
  onClose: () => void
  onContinue?: () => void
}

export function IOSWalletModal({ uri, isOpen, onClose, onContinue }: IOSWalletModalProps) {
  const qrCodeRef = useRef<HTMLDivElement>(null)
  const uriTextareaRef = useRef<HTMLTextAreaElement>(null)
  const [qrCodeLoading, setQrCodeLoading] = useState(false)
  const [qrCodeError, setQrCodeError] = useState(false)
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle')
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    setIsDarkMode(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches)
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    if (isOpen && uri) {
      generateQRCode()
    }
  }, [isOpen, uri])

  const generateQRCode = async () => {
    if (!uri || !qrCodeRef.current) return

    if (!uri.startsWith('wc:')) {
      setQrCodeError(true)
      setQrCodeLoading(false)
      return
    }

    setQrCodeLoading(true)
    setQrCodeError(false)

    try {
      const QRCodeModule = await import('qrcode')
      const QRCode = QRCodeModule.default
      const qrCodeDataUrl = await QRCode.toDataURL(uri, {
        width: 180,
        margin: 2,
        color: {
          dark: isDarkMode ? '#FFFFFF' : '#000000',
          light: isDarkMode ? '#1C1C1E' : '#FFFFFF',
        },
        errorCorrectionLevel: 'M',
      })

      const qrCodeImg = document.createElement('img')
      qrCodeImg.src = qrCodeDataUrl
      qrCodeImg.alt = 'WalletConnect QR Code'
      qrCodeImg.className = 'qr-image'
      qrCodeImg.style.width = '180px'
      qrCodeImg.style.height = '180px'
      qrCodeImg.style.borderRadius = '16px'
      qrCodeImg.style.border = isDarkMode
        ? '1px solid rgba(255, 255, 255, 0.1)'
        : '1px solid rgba(0, 0, 0, 0.1)'
      qrCodeImg.style.boxShadow = isDarkMode
        ? '0 8px 24px rgba(0, 0, 0, 0.3)'
        : '0 8px 24px rgba(0, 0, 0, 0.1)'

      if (qrCodeRef.current) {
        qrCodeRef.current.innerHTML = ''
        qrCodeRef.current.appendChild(qrCodeImg)
      }

      setQrCodeLoading(false)
    } catch {
      setQrCodeLoading(false)
      setQrCodeError(true)
    }
  }

  const copyToClipboard = async () => {
    if (!uri) return

    setCopyStatus('idle')

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(uri)
        setCopyStatus('copied')
        return
      }

      const textarea = document.createElement('textarea')
      textarea.value = uri
      textarea.style.position = 'fixed'
      textarea.style.left = '-999999px'
      textarea.style.top = '-999999px'
      document.body.appendChild(textarea)

      textarea.focus()
      textarea.select()

      const successful = document.execCommand('copy')
      document.body.removeChild(textarea)

      if (successful) {
        setCopyStatus('copied')
      } else {
        throw new Error('execCommand failed')
      }
    } catch {
      setCopyStatus('error')
    }

    setTimeout(() => {
      setCopyStatus('idle')
    }, 3000)
  }

  const selectAll = () => {
    if (uriTextareaRef.current) {
      uriTextareaRef.current.select()
    }
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div
      className={`ios-modal-overlay ${isDarkMode ? 'dark-mode' : ''}`}
      onClick={handleOverlayClick}
    >
      <div
        className={`ios-modal ${isDarkMode ? 'dark-mode' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ios-modal-content">
          {/* QR Code Section */}
          <div className="qr-section">
            <div className="qr-container">
              <div id="ios-qr-code" className="qr-code" ref={qrCodeRef}></div>
              {qrCodeLoading && (
                <div className="qr-loading-overlay">
                  <div className="spinner"></div>
                  <p>Generating QR code...</p>
                </div>
              )}
              {qrCodeError && (
                <div className="qr-error-overlay">
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="error-icon"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                  <p>Failed to generate QR code</p>
                  <button onClick={generateQRCode} className="retry-button">
                    Retry
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* URI Section */}
          <div className="uri-section">
            <div className="uri-header">
              <h4>Connection String</h4>
              <div
                className={`copy-status ${copyStatus === 'copied' ? 'copied' : ''} ${copyStatus === 'error' ? 'error' : ''}`}
              >
                {copyStatus === 'copied' && <span>✓ Copied!</span>}
                {copyStatus === 'error' && <span>✗ Failed</span>}
              </div>
            </div>

            <div className="uri-input-container">
              <textarea
                ref={uriTextareaRef}
                value={uri}
                readOnly
                className="uri-textarea"
                placeholder="Connection string will appear here..."
                onFocus={selectAll}
              />
              <button
                onClick={copyToClipboard}
                className="copy-button"
                disabled={!uri || copyStatus === 'copied'}
              >
                {copyStatus !== 'copied' ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                )}
                {copyStatus === 'copied' ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="ios-modal-footer">
          <div className="footer-buttons">
            <button onClick={onClose} className="cancel-button">
              Cancel
            </button>
            {onContinue && (
              <button onClick={onContinue} className="continue-button">
                Continue
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
