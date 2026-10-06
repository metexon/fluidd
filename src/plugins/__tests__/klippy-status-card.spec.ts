import { shallowMount } from '@vue/test-utils'
import MetexonStatusCard from '@/components/common/MetexonStatusCard.vue'

const makeWrapper = (state: Moonraker.Server.KlippyState, message: string) => shallowMount(MetexonStatusCard, {
  mocks: {
    $t: (key: string) => key,
    $typedGetters: {
      'printer/getKlippyState': state,
      'printer/getKlippyStateRaw': state,
      'printer/getKlippyStateMessage': message,
      'printer/getKlippyConnected': true,
      'printer/getHasWarnings': false
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
})
