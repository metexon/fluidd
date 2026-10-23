<template>
  <v-card-text>
    <v-row>
      <v-col
        v-for="row in mixRows"
        :key="row.head"
        cols="12"
        sm="6"
        md="12"
        lg="6"
      >
        <app-named-slider
          :label="row.label"
          suffix="%"
          :value="row.percent"
          :reset-value="100"
          :min="50"
          :max="125"
          :step="1"
          overridable
          :disabled="!klippyReady || !row.active"
          :locked="isMobileUserAgent"
          :loading="hasWait($waits.onSetExtrusionMix)"
          @submit="setRatio(row.head, $event)"
        />
      </v-col>
    </v-row>
  </v-card-text>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import BrowserMixin from '@/mixins/browser'
import { extrusionMixCommand, extrusionMixRows } from '@/util/extruder-status'

@Component({})
export default class ExtruderMix extends Mixins(StateMixin, BrowserMixin) {
  get status (): Klipper.ExtruderStatusState | undefined {
    return this.$typedState.printer.printer.extruder_status
  }

  get mixRows () {
    const status = this.status
    if (!status?.extruders?.length) return []

    return extrusionMixRows(status)
      .map(row => ({
        ...row,
        label: row.tool != null ? `${row.name} (${row.tool})` : row.name,
        percent: Math.round(row.ratio * 100)
      }))
  }

  setRatio (head: number, value: number) {
    const command = extrusionMixCommand(this.status?.active_group, head, value / 100)

    if (command) {
      this.sendGcode(command, this.$waits.onSetExtrusionMix)
    }
  }
}
</script>
