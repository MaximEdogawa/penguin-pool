import Image from 'next/image'

interface PenguinLogoProps {
  size?: number
  className?: string
  fill?: boolean
  priority?: boolean
}

export default function PenguinLogo({
  size = 48,
  className = '',
  fill = false,
  priority = false,
}: PenguinLogoProps) {
  if (fill) {
    return (
      <Image
        src="/penguin-pool.svg"
        fill
        priority={priority}
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
      priority={priority}
      alt="Penguin Pool Logo"
      className={className}
    />
  )
}
