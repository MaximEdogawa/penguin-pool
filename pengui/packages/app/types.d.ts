import { config } from '@pengui/config'

export type Conf = typeof config

declare module 'pengui-ui' {
  interface TamaguiCustomConfig extends Conf {}
}
