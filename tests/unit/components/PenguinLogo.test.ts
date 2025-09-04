import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import PenguinLogo from '@/components/PenguinLogo.vue'

describe('PenguinLogo', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let wrapper: any

  beforeEach(() => {
    wrapper = mount(PenguinLogo)
  })

  it('renders the logo image', () => {
    const logoImage = wrapper.find('img')
    expect(logoImage.exists()).toBe(true)
    expect(logoImage.attributes('src')).toContain('penguin-pool.svg')
    expect(logoImage.attributes('alt')).toBe('Penguin Pool Logo')
  })

  it('applies custom CSS classes when provided', () => {
    const customWrapper = mount(PenguinLogo, {
      props: {
        class: 'custom-logo-class',
      },
    })

    const logoContainer = customWrapper.find('.custom-logo-class')
    expect(logoContainer.exists()).toBe(true)
  })
})
