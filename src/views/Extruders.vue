<template>
  <collapsable-card
    :title="$t('app.general.title.extruders')"
    icon="$fire"
    :lazy="false"
    draggable
    layout-path="dashboard.extruders-card"
  >
    <template #menu>
      <app-btn
        icon
        @click="presetDialogOpen = true"
      >
        <v-icon dense>
          $cog
        </v-icon>
      </app-btn>
    </template>

    <div class="extruder-controls pa-4">
      <v-row
        align="center"
        class="extruder-actions"
      >
        <v-col
          cols="12"
          md="3"
        >
          <v-select
            v-model="selectedGroupId"
            :items="groupItems"
            label="Extrusion Group"
            item-text="text"
            item-value="value"
            outlined
            dense
            hide-details
            :disabled="busy"
            @change="selectGroup"
          />
        </v-col>
        <template v-if="temperatureControlsEnabled">
          <v-col
            cols="6"
            md="2"
          >
            <app-text-field
              v-model.number="t1"
              label="T1 target"
              type="number"
              suffix="°C"
              outlined
              dense
              hide-details
              :disabled="busy"
            />
          </v-col>
          <v-col
            v-if="temperatureMode === 'mtx'"
            cols="6"
            md="2"
          >
            <app-text-field
              v-model.number="t2"
              label="T2 target"
              type="number"
              suffix="°C"
              outlined
              dense
              hide-details
              :disabled="busy"
            />
          </v-col>
          <v-col cols="auto">
            <app-btn
              :loading="busy"
              :disabled="!validTargets"
              @click="setTemperature"
            >
              Set
            </app-btn>
          </v-col>
          <v-col cols="auto">
            <v-tooltip bottom>
              <template #activator="{ attrs, on }">
                <app-btn
                  icon
                  :disabled="busy"
                  v-bind="attrs"
                  v-on="on"
                  @click="turnOffExtruders"
                >
                  <v-icon>$snowflake</v-icon>
                </app-btn>
              </template>
              <span>All Extruders Off</span>
            </v-tooltip>
          </v-col>
          <v-col cols="auto">
            <v-menu
              bottom
              left
              offset-y
              transition="slide-y-transition"
              min-width="180"
            >
              <template #activator="{ attrs, on, value }">
                <app-btn
                  :disabled="busy"
                  v-bind="attrs"
                  small
                  class="my-1"
                  v-on="on"
                >
                  <v-icon
                    small
                    class="me-1"
                  >
                    $fire
                  </v-icon>
                  PRESETS
                  <v-icon
                    small
                    class="ms-1"
                    :class="{ 'rotate-180': value }"
                  >
                    $chevronDown
                  </v-icon>
                </app-btn>
              </template>
              <v-list dense>
                <v-list-item @click="turnOffExtruders">
                  <v-list-item-icon>
                    <v-icon color="info">
                      $snowflake
                    </v-icon>
                  </v-list-item-icon>
                  <v-list-item-content><v-list-item-title>All Extruders Off</v-list-item-title></v-list-item-content>
                </v-list-item>
                <v-list-item
                  v-for="preset in presets"
                  :key="preset.id"
                  @click="applyPreset(preset)"
                >
                  <v-list-item-icon>
                    <v-icon color="error">
                      $fire
                    </v-icon>
                  </v-list-item-icon>
                  <v-list-item-content><v-list-item-title>{{ preset.name }}</v-list-item-title></v-list-item-content>
                </v-list-item>
              </v-list>
            </v-menu>
          </v-col>
        </template>
        <v-col
          v-else
          cols="12"
          md="6"
          class="text--secondary"
        >
          Mixed groups require separate temperature commands.
        </v-col>
      </v-row>
    </div>

    <v-simple-table class="extruders-table">
      <thead>
        <tr>
          <th style="height: 20px; padding: 0 !important; line-height: 20px;" />
          <th
            colspan="3"
            class="t-group text-center"
            style="height: 20px; padding: 0 8px !important; line-height: 20px;"
          >
            T1
          </th>
          <th
            class="t-group-gap"
            style="height: 20px; padding: 0 !important; line-height: 20px;"
          />
          <th
            colspan="3"
            class="t-group text-center"
            style="height: 20px; padding: 0 8px !important; line-height: 20px;"
          >
            T2
          </th>
          <th
            colspan="2"
            style="height: 20px; padding: 0 !important; line-height: 20px;"
          />
        </tr>
        <tr>
          <th>Extruder</th>
          <th>Power</th><th>Actual</th><th>Target</th>
          <th class="t-group-gap" />
          <th>Power</th><th>Actual</th><th>Target</th>
          <th>T Body</th><th>T Motor</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="head in status.extruders"
          :key="head.name"
          :class="{ inactive: !head.active }"
        >
          <td>
            {{ head.name }}
            <small
              v-if="head.mtx_tool != null"
              class="d-block text--secondary"
            >{{ head.mtx_tool.logical_id }}</small>
          </td>
          <td>{{ pwmText(head.t1.power) }}</td>
          <td :class="temperatureClass(head.t1.temperature, head.t1.target)">
            {{ temperatureText(head.t1.temperature) }}
          </td>
          <td>{{ temperatureText(head.t1.target) }}</td>
          <td class="t-group-gap" />
          <td>{{ pwmText(head.t2?.power) }}</td>
          <td :class="temperatureClass(head.t2?.temperature, head.t2?.target)">
            {{ temperatureText(head.t2?.temperature) }}
          </td>
          <td>{{ temperatureText(head.t2?.target) }}</td>
          <td :class="temperatureClass(head.body?.temperature, 1, 60)">
            {{ temperatureText(head.body?.temperature) }}
          </td>
          <td :class="temperatureClass(head.motor?.temperature, 1, 90)">
            {{ temperatureText(head.motor?.temperature) }}
          </td>
        </tr>
      </tbody>
    </v-simple-table>

    <app-dialog
      v-model="presetDialogOpen"
      title="Extruder presets"
      max-width="520"
      no-actions
    >
      <v-card-text>
        <v-list dense>
          <v-list-item
            v-for="preset in presets"
            :key="preset.id"
            @click="editPreset(preset)"
          >
            <v-list-item-content>
              <v-list-item-title>{{ preset.name }}</v-list-item-title>
              <v-list-item-subtitle>T1 {{ preset.t1 }}°C<span v-if="preset.t2 != null"> · T2 {{ preset.t2 }}°C</span></v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </v-list>

        <app-btn
          small
          @click="newPreset"
        >
          Add preset
        </app-btn>

        <template v-if="presetDraft">
          <v-divider class="my-4" />
          <app-text-field
            v-model="presetDraft.name"
            label="Name"
            outlined
            dense
          />
          <v-row>
            <v-col cols="6">
              <app-text-field
                v-model.number="presetDraft.t1"
                label="T1"
                type="number"
                suffix="°C"
                outlined
                dense
              />
            </v-col>
            <v-col cols="6">
              <app-text-field
                v-model.number="presetDraft.t2"
                label="T2"
                type="number"
                suffix="°C"
                outlined
                dense
              />
            </v-col>
          </v-row>
          <div class="d-flex justify-end">
            <app-btn
              v-if="presetDraft.id"
              text
              @click="removePreset"
            >
              Delete
            </app-btn>
            <app-btn
              :disabled="!validPreset"
              @click="savePreset"
            >
              Save
            </app-btn>
          </div>
        </template>
      </v-card-text>
    </app-dialog>
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import { v4 as uuidv4 } from 'uuid'
import StateMixin from '@/mixins/state'
import { SocketActions } from '@/api/socketActions'
import { allExtrudersOffPlan, findActiveGroup, groupCommand, groupSelectionCommand, pwmText, temperatureCommand, temperatureState, temperatureText } from '@/util/extruder-status'
import type { ExtruderTemperaturePreset } from '@/store/config/types'

@Component
export default class Extruders extends Mixins(StateMixin) {
  selectedGroupId = ''
  presetDialogOpen = false
  presetDraft: ExtruderTemperaturePreset | null = null
  t1 = 0
  t2 = 0
  busy = false

  get status (): Klipper.ExtruderStatusState {
    return this.$typedState.printer.printer.extruder_status ?? { extruders: [], groups: [], active_group: { id: '', heads: [], ratios: [] } }
  }

  get selectedGroup () {
    return this.status.groups.find(group => group.id === this.selectedGroupId)
  }

  get temperatureMode (): 'ordinary' | 'mtx' | 'mixed' {
    return this.selectedGroup?.temperature_mode ?? this.status.active_group.temperature_mode ?? 'ordinary'
  }

  get temperatureControlsEnabled () { return this.temperatureMode !== 'mixed' }
  get validTargets () { return Number.isFinite(this.t1) && (this.temperatureMode !== 'mtx' || Number.isFinite(this.t2)) }
  get groupItems () { return this.status.groups.map(group => ({ value: group.id, text: group.label ?? group.id })) }
  get presets (): ExtruderTemperaturePreset[] { return this.$typedState.config.uiSettings.dashboard.extruderPresets }
  get validPreset () { return this.presetDraft != null && this.presetDraft.name !== '' && Number.isFinite(this.presetDraft.t1) && Number.isFinite(this.presetDraft.t2) }
  get activeGroupSelectionId () { return findActiveGroup(this.status.groups, this.status.active_group)?.id ?? '' }

  @Watch('activeGroupSelectionId', { immediate: true })
  onActiveGroupChange (groupId: string) {
    this.selectedGroupId = groupId
  }

  temperatureText = temperatureText
  pwmText = pwmText

  temperatureClass (current?: number | null, target?: number | null, limit?: number) {
    const state = limit != null
      ? (current != null && current > limit ? 'too-hot' : null)
      : temperatureState(current, target)
    if (state === 'heating' || state === 'too-hot') return 'red lighten-1 white--text'
    if (state === 'at-temperature') return 'orange lighten-2 black--text'
    if (state === 'cooling') return 'yellow lighten-2 black--text'
    return undefined
  }

  async runCommand (command: string) {
    this.busy = true
    try {
      await SocketActions.printerGcodeScript(command)
      this.addConsoleEntry(command)
    } finally {
      this.busy = false
    }
  }

  async selectGroup () {
    const group = this.selectedGroup
    if (group) await this.runCommand(groupCommand(group))
  }

  async setTemperature () {
    if (this.validTargets && this.temperatureControlsEnabled) {
      const mode = this.temperatureMode
      if (mode === 'ordinary' || mode === 'mtx') {
        await this.runCommand(temperatureCommand(this.t1, mode, this.t2))
      }
    }
  }

  async applyPreset (preset: ExtruderTemperaturePreset) {
    const group = this.selectedGroup
    if (group) {
      const selectGroup = groupSelectionCommand(group, this.status.active_group)
      if (selectGroup) await this.runCommand(selectGroup)
    }

    this.t1 = preset.t1
    this.t2 = preset.t2 ?? 0
    await this.setTemperature()
  }

  newPreset () {
    this.presetDraft = { id: '', name: '', t1: this.t1, t2: this.t2 }
  }

  editPreset (preset: ExtruderTemperaturePreset) {
    this.presetDraft = { ...preset }
  }

  savePreset () {
    const preset = this.presetDraft
    if (!preset || !this.validPreset) return
    const savedPreset = { ...preset, id: preset.id || uuidv4() }
    const index = this.presets.findIndex(item => item.id === savedPreset.id)
    const presets = index < 0
      ? [...this.presets, savedPreset]
      : this.presets.map(item => item.id === savedPreset.id ? savedPreset : item)
    this.$typedDispatch('config/saveByPath', { path: 'uiSettings.dashboard.extruderPresets', value: presets, server: true })
    this.presetDraft = null
  }

  removePreset () {
    if (!this.presetDraft?.id) return
    const presets = this.presets.filter(preset => preset.id !== this.presetDraft?.id)
    this.$typedDispatch('config/saveByPath', { path: 'uiSettings.dashboard.extruderPresets', value: presets, server: true })
    this.presetDraft = null
  }

  async turnOffExtruders () {
    const plan = allExtrudersOffPlan(this.status)
    if (!plan) return

    this.busy = true
    try {
      await SocketActions.printerGcodeScript(plan.selectAll)
      this.addConsoleEntry(plan.selectAll)

      await SocketActions.printerGcodeScript(plan.turnOff)
      this.addConsoleEntry(plan.turnOff)
    } finally {
      if (plan.restore) {
        try {
          await SocketActions.printerGcodeScript(plan.restore)
          this.addConsoleEntry(plan.restore)
        } finally {
          this.busy = false
        }
      } else {
        this.busy = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.extruders-table {
  overflow-x: auto;

  th, td { white-space: nowrap; }
  :deep(thead tr:nth-child(2) th) {
    height: 28px !important;
    padding-top: 4px !important;
    padding-bottom: 4px !important;
  }
  .inactive { opacity: 0.48; }
  .t-group-gap {
    width: 12px;
    min-width: 12px;
    padding: 0 !important;
    background: transparent !important;
  }
  .t-group {
    border-style: solid;
    border-width: 2px 2px 0 !important;
    background: transparent !important;
  }
  &.theme--light .t-group {
    border-color: rgba(0, 0, 0, 0.12) !important;
  }
  &.theme--dark .t-group {
    border-color: rgba(255, 255, 255, 0.12) !important;
  }
}

@media (min-width: 960px) {
  .extruder-actions {
    flex-wrap: nowrap;
  }
}
</style>
