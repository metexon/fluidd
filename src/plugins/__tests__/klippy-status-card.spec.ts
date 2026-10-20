import { shallowMount } from '@vue/test-utils'
import MetexonStatusCard from '@/components/common/MetexonStatusCard.vue'
import type { PnozStatus } from '@/util/pnoz-status'

const makeWrapper = (
  state: Moonraker.Server.KlippyState,
  message: string,
  pnozStatuses: PnozStatus[] = []
) => shallowMount(MetexonStatusCard, {
  mocks: {
    $t: (key: string) => key,
    $typedGetters: {
      'printer/getKlippyState': state,
      'printer/getKlippyStateRaw': state,
      'printer/getKlippyStateMessage': message,
      'printer/getKlippyConnected': true,
      'printer/getHasWarnings': false,
      'sensors/getPnozStatuses': pnozStatuses,
      'sensors/getPnozMainEnabled': false
    }
  },
  stubs: {
    'system-control': true
  },
  directives: {
    'safe-html': (element, binding) => {
      element.textContent = binding.value
    }
  }
})

describe('MetexonStatusCard', () => {
  it('shows startup as informational progress', () => {
    const wrapper = makeWrapper('startup', 'Connecting to MCU 7 of 19: z_mini_6')

    const card = wrapper.find('collapsablecard-stub')
    expect(card.attributes('title')).toBe('startup')
    expect(card.attributes('icon')).toBe('$sync')
    expect(card.attributes('icon-color')).toBe('info')
    expect(wrapper.find('v-alert-stub').attributes('type')).toBe('info')
    expect(wrapper.find('v-progress-linear-stub').exists()).toBe(true)
    expect(wrapper.text()).toContain('Connecting to MCU 7 of 19: z_mini_6')
  })

  it.each(['error', 'shutdown', 'disconnected'] as Moonraker.Server.KlippyState[])(
    'shows %s as an error without startup progress',
    (state) => {
      const wrapper = makeWrapper(state, 'MCU z_mini_6 failed to connect')

      const card = wrapper.find('collapsablecard-stub')
      expect(card.attributes('icon')).toBe('$error')
      expect(card.attributes('icon-color')).toBe('error')
      expect(wrapper.find('v-alert-stub').attributes('type')).toBe('error')
      expect(wrapper.find('v-progress-linear-stub').exists()).toBe(false)
    }
  )

  it('shows pnoz error statuses as error alerts alongside the klippy alert', () => {
    const wrapper = makeWrapper('error', 'MCU lost communication', [
      { message: 'estop_fault', severity: 'error' },
      { message: 'estop_inner_pressed', severity: 'error' }
    ])

    const card = wrapper.find('collapsablecard-stub')
    expect(card.attributes('title')).toBe('error')
    expect(card.attributes('icon')).toBe('$error')
    expect(card.attributes('icon-color')).toBe('error')

    const alerts = wrapper.findAll('v-alert-stub')
    expect(alerts.length).toBe(3)
    expect(alerts.at(0).attributes('type')).toBe('error')
    expect(alerts.at(1).attributes('type')).toBe('error')
    expect(wrapper.text()).toContain('app.pnoz.status.estop_fault')
    expect(wrapper.text()).toContain('app.pnoz.status.estop_inner_pressed')
  })

  it('shows a pnoz info status as an info alert when klippy is ready', () => {
    const wrapper = makeWrapper('ready', 'Printer is ready', [
      { message: 'mode_justage', severity: 'info' }
    ])

    const card = wrapper.find('collapsablecard-stub')
    expect(card.attributes('title')).toBe('ready')
    expect(card.attributes('icon')).toBe('$alertCircle')
    expect(card.attributes('icon-color')).toBe('info')

    const alerts = wrapper.findAll('v-alert-stub')
    expect(alerts.length).toBe(1)
    expect(alerts.at(0).attributes('type')).toBe('info')
    expect(wrapper.text()).toContain('app.pnoz.status.mode_justage')
  })
})
