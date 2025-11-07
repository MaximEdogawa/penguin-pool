import Image from 'next/image'

interface PenguinLogoProps {
  size?: number
  className?: string
}

export default function PenguinLogo({ size = 48, className = '' }: PenguinLogoProps) {
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
