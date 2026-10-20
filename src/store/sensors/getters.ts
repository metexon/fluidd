import type { GetterTree } from 'vuex'
import type { MoonrakerSensorsState } from './types'
import type { RootState } from '../types'
import { evaluatePnozStatuses, type PnozStatus } from '@/util/pnoz-status'

export const getters = {
  getSensors: (state) => {
    return Object.values(state.sensors)
  },

  getPnozMainEnabled: (state): boolean => {
    return Boolean(state.sensors['pnoz']?.values?.main_enabled)
  },

  getPnozStatuses: (state, getters, rootState, rootGetters): PnozStatus[] => {
    const sensor = state.sensors['pnoz']

    if (!sensor) return []

    const klippyReady: boolean = rootGetters['printer/getKlippyReady']

    return evaluatePnozStatuses(sensor.values, klippyReady)
  }
} satisfies GetterTree<MoonrakerSensorsState, RootState>
