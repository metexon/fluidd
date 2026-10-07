import { Globals, Waits } from '@/globals'
import { ColorSet } from '@/plugins/colorSet'
import { Filters, Rules } from '@/plugins/filters'
import { WebSocketClient } from '@/plugins/socketClient'
import type { RootActions, RootGetters, RootMutations, RootState } from '@/store/types'
import type { VuetifyConfirmObject } from 'vuetify-confirm'

declare module 'vue/types/vue' {
  interface Vue {
    $colorset: ColorSet;
    $confirm: (message: string, options?: VuetifyConfirmObject) => Promise<boolean | undefined>;
    $filters: typeof Filters;
    $globals: typeof Globals;
    $rules: typeof Rules;
    $socket: WebSocketClient;
    $typedCommit: RootMutations;
    $typedDispatch: RootActions;
    $typedGetters: RootGetters;
    $typedState: RootState;
    $waits: typeof Waits;
  }

  interface VueConstructor {
    $colorset: ColorSet;
    $confirm: (message: string, options?: VuetifyConfirmObject) => Promise<boolean | undefined>;
    $filters: typeof Filters;
    $globals: typeof Globals;
    $rules: typeof Rules;
    $socket: WebSocketClient;
    $typedCommit: RootMutations;
    $typedDispatch: RootActions;
    $typedGetters: RootGetters;
    $typedState: RootState;
    $waits: typeof Waits;
  }
}
