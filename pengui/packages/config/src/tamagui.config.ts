import { config as defaultConfig } from '@tamagui/config'
import { createTamagui } from 'tamagui'
import { animations } from './animations'
import { bodyFont, headingFont } from './fonts'

export const config = createTamagui({
  ...defaultConfig,
  animations,
  fonts: {
    body: bodyFont,
    heading: headingFont,
  },
  settings: {
    ...defaultConfig.settings,
    onlyAllowShorthands: false,
  },
  tokens: {
    ...defaultConfig.tokens,
    color: {
      ...defaultConfig.tokens.color,
      outlineColor: defaultConfig.tokens.color.gray9,
    },
  },
})
