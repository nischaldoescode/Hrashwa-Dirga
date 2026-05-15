/**
 * country flag component using flag-icons library
 * provides reliable flag rendering across all browsers and systems
 */

import { COUNTRIES } from '@/lib/constants'

interface CountryFlagProps {
  countryCode: string | null
  size?: 'sm' | 'md' | 'lg'
  showCode?: boolean
  className?: string
}

/**
 * renders country flag with optional country code
 * falls back to globe icon for null/invalid codes
 */
export const CountryFlag = ({ 
  countryCode, 
  size = 'md', 
  showCode = false,
  className = '' 
}: CountryFlagProps) => {
  // size mappings for flag icons
  const sizeClasses = {
    sm: 'w-4 h-3',
    md: 'w-5 h-4',
    lg: 'w-6 h-5'
  }

  // text size for country code
  const textSizes = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm'
  }

  // handle null or invalid country code
  if (!countryCode) {
    return (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <div className={`${sizeClasses[size]} flex items-center justify-center bg-muted rounded`}>
          <span className="text-[10px]">🌍</span>
        </div>
        {showCode && (
          <span className={`${textSizes[size]} font-mono text-muted-foreground uppercase`}>
            n/a
          </span>
        )}
      </div>
    )
  }

  const lowerCode = countryCode.toLowerCase()
  const country = COUNTRIES.find(c => c.code === countryCode)

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {/* flag icon using flag-icons library */}
      <span 
        className={`fi fi-${lowerCode} ${sizeClasses[size]} rounded shadow-sm`}
        title={country?.name || countryCode}
      />
      
      {/* optional country code text */}
      {showCode && (
        <span className={`${textSizes[size]} font-mono text-muted-foreground uppercase`}>
          {lowerCode}
        </span>
      )}
    </div>
  )
}