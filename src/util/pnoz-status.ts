export type PnozSeverity = 'error' | 'info'

export interface PnozStatus {
  message: string;
  severity: PnozSeverity;
}

const flag = (values: Moonraker.Sensor.Values, name: string) => Boolean(values[name])
const error = (message: string): PnozStatus => ({ message, severity: 'error' })
const info = (message: string): PnozStatus => ({ message, severity: 'info' })

export const evaluatePnozStatuses = (
  values: Moonraker.Sensor.Values | undefined,
  klippyReady: boolean
): PnozStatus[] => {
  if (!values) return []

  if (!flag(values, 'connected') || flag(values, 'stale')) {
    return [error('unreachable')]
  }

  if (klippyReady || flag(values, 'main_enabled')) {
    return flag(values, 'mode_justage')
      ? [info('mode_justage')]
      : []
  }

  const statuses: PnozStatus[] = []

  if (flag(values, 'fault_contactor')) statuses.push(error('contactor_fault'))
  if (flag(values, 'fault_estop')) statuses.push(error('estop_fault'))
  if (flag(values, 'fault_lock_release')) statuses.push(error('lock_fault'))
  if (flag(values, 'fault_selector')) statuses.push(error('mode_selector_fault'))
  if (flag(values, 'hardware_fault')) statuses.push(error('hardware_fault'))
  if (!flag(values, 'estop_inner_ok')) statuses.push(error('estop_inner_pressed'))
  if (!flag(values, 'estop_outer_ok')) statuses.push(error('estop_outer_pressed'))

  if (flag(values, 'mode_normal') && !flag(values, 'door_closed')) {
    statuses.push(error('door_not_closed'))
  }

  if (flag(values, 'mode_entnahme')) statuses.push(info('mode_entnahme'))

  return statuses
}
