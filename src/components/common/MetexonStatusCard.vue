<template>
  <collapsable-card
    :title="klippyState"
    :icon="klippyStarting ? '$sync' : '$error'"
    :icon-color="klippyStarting ? 'info' : 'error'"
  >
    <v-card-text>
      <v-row>
        <v-col
          v-if="klippyConnected"
          cols="12"
          sm="auto"
        >
          <v-tooltip bottom>
            <template #activator="{ on, attrs }">
              <app-btn
                v-bind="attrs"
                block
                color="primary"
                :disabled="printerPrinting"
                v-on="on"
                @click="firmwareRestartKlippy"
              >
                {{ $t('app.general.btn.reconnect') }}
              </app-btn>
            </template>
            <span>{{ $t('app.general.tooltip.reload_restart_klipper') }}</span>
          </v-tooltip>
        </v-col>
        <v-col
          cols="12"
          sm=""
        >
          <v-row>
            <v-col
              v-if="printerPoweredOff"
              cols="12"
            >
              <v-alert
                text
                dense
                type="error"
                class="ma-0"
              >
                <span v-safe-html="$t('app.general.error.printer_powered_off')" />
              </v-alert>
            </v-col>
            <v-col
              v-else-if="klippyStateMessage !== 'Printer is ready'"
              cols="12"
            >
              <v-alert
                text
                dense
                :type="klippyStarting ? 'info' : 'error'"
                class="ma-0"
              >
                <span v-safe-html="klippyStateMessage" />
                <v-progress-linear
                  v-if="klippyStarting"
                  class="mt-3"
                  color="info"
                  indeterminate
                  rounded
                  height="4"
                />
              </v-alert>
            </v-col>
            <v-col
              v-if="hasWarnings"
              cols="12"
            >
              <app-warnings />
            </v-col>
          </v-row>
        </v-col>
      </v-row>
    </v-card-text>
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import ServicesMixin from '@/mixins/services'

@Component({})
export default class MetexonStatusCard extends Mixins(StateMixin, ServicesMixin) {
}
</script>
