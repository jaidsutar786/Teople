import { useState, useEffect } from 'react'
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import './ErrorCard.css'

const ErrorCard = ({ 
  type = 'error', // 'error' or 'success'
  title = 'ERROR',
  message = 'Something went wrong',
  description = 'Please try again to complete the request',
  buttonText = 'Continue',
  onButtonClick = () => {},
  visible = true,
  onClose = () => {},
  autoClose = false,
  autoCloseDelay = 3000
}) => {
  const [isVisible, setIsVisible] = useState(visible)

  useEffect(() => {
    setIsVisible(visible)
    
    if (visible && autoClose) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        onClose()
      }, autoCloseDelay)
      
      return () => clearTimeout(timer)
    }
  }, [visible, autoClose, autoCloseDelay, onClose])

  if (!isVisible) return null

  const isSuccess = type === 'success'
  const iconColor = isSuccess ? '#22c55e' : '#ef4444'
  const buttonColor = isSuccess ? '#22c55e' : '#ef4444'
  const borderColor = isSuccess ? '#dcfce7' : '#fee2e2'

  const handleClose = () => {
    setIsVisible(false)
    onClose()
  }

  const handleButtonClick = () => {
    onButtonClick()
    handleClose()
  }

  return (
    <div className="error-card-overlay">
      <div className="error-card-wrapper">
        <div 
          className="error-card"
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '32px 28px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
            maxWidth: '420px',
            width: '100%',
            border: `1px solid ${borderColor}`,
            position: 'relative',
            textAlign: 'center'
          }}
        >
          {/* Icon */}
          <div className="error-card-icon-wrapper">
            {isSuccess ? (
              <CheckCircleOutlined 
                className="error-card-icon success-icon"
                style={{ 
                  fontSize: '56px',
                  color: iconColor,
                  transition: 'all 0.3s ease-in-out'
                }}
              />
            ) : (
              <div style={{
                fontSize: '56px',
                lineHeight: '1',
                color: iconColor,
                transition: 'all 0.3s ease-in-out'
              }}>
                ☹
              </div>
            )}
          </div>

          {/* Content */}
          <div style={{ width: '100%' }}>
            {/* Title */}
            <h2 
              style={{
                fontSize: '16px',
                fontWeight: '700',
                color: iconColor,
                margin: '0 0 8px 0',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
            >
              {title}
            </h2>

            {/* Message */}
            <p 
              style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#1f2937',
                margin: '0 0 6px 0'
              }}
            >
              {message}
            </p>

            {/* Description */}
            {description && (
              <p 
                style={{
                  fontSize: '13px',
                  color: '#6b7280',
                  margin: '0',
                  lineHeight: '1.5',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}
              >
                {description}
              </p>
            )}
          </div>

          {/* Button */}
          <button
            onClick={handleButtonClick}
            style={{
              width: '100%',
              maxWidth: '280px',
              height: '40px',
              backgroundColor: buttonColor,
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: `0 4px 12px ${buttonColor}40`,
              marginTop: '8px',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = isSuccess ? '#16a34a' : '#dc2626'
              e.target.style.boxShadow = `0 6px 20px ${buttonColor}60`
              e.target.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = buttonColor
              e.target.style.boxShadow = `0 4px 12px ${buttonColor}40`
              e.target.style.transform = 'translateY(0)'
            }}
          >
            {buttonText}
          </button>

          {/* Close button */}
          <button
            onClick={handleClose}
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#d1d5db',
              transition: 'color 0.2s ease',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px'
            }}
            onMouseEnter={(e) => e.target.style.color = '#9ca3af'}
            onMouseLeave={(e) => e.target.style.color = '#d1d5db'}
          >
            ×
          </button>
        </div>
      </div>
    </div>
  )
}

export default ErrorCard
