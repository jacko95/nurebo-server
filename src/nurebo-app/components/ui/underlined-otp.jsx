'use client'
import React, { useRef, useState, useEffect } from 'react'

export const UnderlinedOTP = ({ value = '', onValueChange, length = 6 }) => {
  const inputRefs = useRef(Array(length).fill(null))
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const calculateActiveIndex = () => {
      for (let i = 0; i < length; i++) {
        if (!value[i] || value[i].trim() === '') return i
      }
      return length - 1
    }
    setActiveIndex(calculateActiveIndex())
  }, [value, length])

  const handleInputChange = (index, newValue) => {
    if (/^\d?$/.test(newValue)) {
      const newOtp = [...value.padEnd(length, ' ')]
      newOtp[index] = newValue
      onValueChange(newOtp.join('').trimRight())
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      const currentValue = e.target.value
      const cursorPosition = e.target.selectionStart

      if (cursorPosition === 0 && index > 0) {
        const newOtp = [...value]
        newOtp[index - 1] = ''
        onValueChange(newOtp.join(''))
      } else if (cursorPosition === 1) {
        const newOtp = [...value]
        newOtp[index] = ''
        onValueChange(newOtp.join(''))
      }
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const paste = e.clipboardData.getData('text').replace(/\D/g, '')
    const newOtp = paste.split('').slice(0, length)
    onValueChange(newOtp.join(''))
  }

  useEffect(() => {
    if (inputRefs.current[activeIndex]) {
      inputRefs.current[activeIndex].focus()
      inputRefs.current[activeIndex].setSelectionRange(1, 1)
    }
  }, [activeIndex])

  return (
    <div className="flex items-center justify-center gap-4">
      {Array.from({ length }).map((_, index) => (
        <div key={index} className="relative">
          <input
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={value[index] || ''}
            onChange={(e) => handleInputChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            onClick={() => inputRefs.current[activeIndex]?.focus()}
            tabIndex={activeIndex === index ? 0 : -1}
            className="w-10 h-12 text-3xl text-center bg-transparent border-b-2 border-gray-300 focus:border-blue-500 focus:outline-none transition-colors"
          />
        </div>
      ))}
    </div>
  )
}