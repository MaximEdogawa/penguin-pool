import Image from 'next/image'

interface PenguinLogoProps {
  size?: number
  className?: string
  fill?: boolean
}

export default function PenguinLogo({ size = 48, className = '', fill = false }: PenguinLogoProps) {
  if (fill) {
    return (
      <Image
        src="/penguin-pool.svg"
        fill
        alt="Penguin Pool Logo"
        className={`${className} object-contain`}
      />
    )
  }

  return (
    <Image
      src="/penguin-pool.svg"
      width={size}
      height={size}
      alt="Penguin Pool Logo"
      className={className}
    />
  )
}
