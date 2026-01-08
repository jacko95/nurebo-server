'use client'
import {useState, useEffect, useRef} from 'react'
import Image from 'next/image'

const Lightbox = ({ isOpen, onClose, images, initialIndex = 0, showNavigation }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(initialIndex)
  const [isMounted, setIsMounted] = useState(false)
  const contentRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      setCurrentImageIndex(initialIndex)
    }
  }, [isOpen, initialIndex])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showNavigation) {
        if (e.key === 'ArrowLeft') handlePrev()
        if (e.key === 'ArrowRight') handleNext()
      }
      if (e.key === 'Escape') onClose()
    }

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
      setIsMounted(true)
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
      setIsMounted(false)
    }
  }, [isOpen, currentImageIndex, showNavigation])

  const handlePrev = () => {
    setCurrentImageIndex(prev => (prev > 0 ? prev - 1 : images.length - 1))
  }

  const handleNext = () => {
    setCurrentImageIndex(prev => (prev < images.length - 1 ? prev + 1 : 0))
  }

  const handleBackgroundClick = (e) => {
    if (contentRef.current && !contentRef.current.contains(e.target)) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={handleBackgroundClick}
    >
      {/* Sfondo semi-trasparente */}
      <div className={`absolute inset-0 bg-black transition-opacity duration-300 ${
        isMounted ? 'bg-opacity-90' : 'bg-opacity-0'
      }`} />

      <div
        ref={contentRef}
        className="relative max-w-[90vw] max-h-[90vh] w-full h-full transform transition-transform duration-300"
        style={{ transform: isMounted ? 'scale(1)' : 'scale(0.95)' }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white text-4xl z-50 hover:text-gray-300"
        >
          &times;
        </button>

        {showNavigation && images.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-4xl z-50 hover:text-gray-300 p-4"
            >
              &#10094;
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-4xl z-50 hover:text-gray-300 p-4"
            >
              &#10095;
            </button>
          </>
        )}

        <div className="relative w-full h-full">
          <Image
            key={currentImageIndex} // Forza ricaricamento immagine
            src={images[currentImageIndex]}
            alt="Lightbox image"
            fill
            className="object-contain"
            quality={100}
            priority
          />
        </div>

        {showNavigation && images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white bg-black/50 px-4 py-2 rounded-full text-sm">
            {currentImageIndex + 1} / {images.length}
          </div>
        )}
      </div>
    </div>
  )
}

export default Lightbox