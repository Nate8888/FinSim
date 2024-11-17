
import { useState } from 'react'

export function Tooltip({ content, children }) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
      >
        {children}
      </div>
      {visible && (
        <div className="absolute bottom-full mb-2 w-max px-2 py-1 text-sm text-white bg-black rounded">
          {content}
        </div>
      )}
    </div>
  )
}