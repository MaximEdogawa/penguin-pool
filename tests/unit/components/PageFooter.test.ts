import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import PageFooter from '@/components/PageFooter.vue'

describe('PageFooter', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let wrapper: any

  beforeEach(() => {
    wrapper = mount(PageFooter)
  })

  it('renders footer content', () => {
    expect(wrapper.find('.content-footer').exists()).toBe(true)
  })

  it('displays copyright information', () => {
    const currentYear = new Date().getFullYear()
    expect(wrapper.text()).toContain('Penguin Pool')
    expect(wrapper.text()).toContain(currentYear.toString())
  })

  it('displays app version', () => {
    expect(wrapper.text()).toContain('v1.0.0')
  })

  it('has footer content structure', () => {
    expect(wrapper.find('.footer-content').exists()).toBe(true)
    expect(wrapper.find('.footer-left').exists()).toBe(true)
    expect(wrapper.find('.footer-right').exists()).toBe(true)
  })
})

