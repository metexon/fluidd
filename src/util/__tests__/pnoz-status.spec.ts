import { evaluatePnozStatuses } from '../pnoz-status'

const baseSignals: Moonraker.Sensor.Values = {
  connected: 1,
  stale: 0,
  test_mode: 0,
  door_closed: 1,
  door_locked: 0,
  estop_inner_ok: 1,
  estop_outer_ok: 1,
  fault: 0,
  fault_contactor: 0,
  fault_estop: 0,
  fault_lock_release: 0,
  fault_selector: 0,
  hardware_fault: 0,
  main_enabled: 0,
  mode_entnahme: 0,
  mode_justage: 0,
  mode_normal: 1,
  warning_hot: 0
}

const evaluate = (
  overrides: Partial<Moonraker.Sensor.Values> = {},
  klippyReady = false
) => evaluatePnozStatuses({ ...baseSignals, ...overrides }, klippyReady)

describe('evaluatePnozStatuses', () => {
  it('returns empty when no sensor values exist', () => {
    expect(evaluatePnozStatuses(undefined, true)).toEqual([])
  })

  it.each([{ connected: 0 }, { stale: 1 }])('reports only unreachable for %j', (overrides) => {
    expect(evaluate(overrides, true)).toEqual([{ message: 'unreachable', severity: 'error' }])
  })

  it('reports unreachable alone even when faults are set', () => {
    expect(evaluate({ connected: 0, fault_estop: 1, estop_inner_ok: 0 }))
      .toEqual([{ message: 'unreachable', severity: 'error' }])
  })

  it('reports justage mode when klippy is ready', () => {
    expect(evaluate({ mode_justage: 1, mode_normal: 0 }, true))
      .toEqual([{ message: 'mode_justage', severity: 'info' }])
  })

  it('reports justage mode when main is enabled despite klippy error', () => {
    expect(evaluate({ mode_justage: 1, mode_normal: 0, main_enabled: 1 }))
      .toEqual([{ message: 'mode_justage', severity: 'info' }])
  })

  it('stays quiet when klippy is ready in normal mode', () => {
    expect(evaluate({}, true)).toEqual([])
  })

  it.each([
    [{ fault_contactor: 1 }, 'contactor_fault', 'error'],
    [{ fault_estop: 1 }, 'estop_fault', 'error'],
    [{ fault_lock_release: 1 }, 'lock_fault', 'error'],
    [{ fault_selector: 1 }, 'mode_selector_fault', 'error'],
    [{ hardware_fault: 1 }, 'hardware_fault', 'error'],
    [{ estop_inner_ok: 0 }, 'estop_inner_pressed', 'error'],
    [{ estop_outer_ok: 0 }, 'estop_outer_pressed', 'error'],
    [{ door_closed: 0 }, 'door_not_closed', 'error'],
    [{ mode_entnahme: 1, mode_normal: 0 }, 'mode_entnahme', 'info']
  ] as const)('reports %j as %s/%s', (overrides, message, severity) => {
    expect(evaluate(overrides)).toEqual([{ message, severity }])
  })

  it('collects multiple matching conditions in order', () => {
    expect(evaluate({ fault_estop: 1, hardware_fault: 1, estop_inner_ok: 0 })).toEqual([
      { message: 'estop_fault', severity: 'error' },
      { message: 'hardware_fault', severity: 'error' },
      { message: 'estop_inner_pressed', severity: 'error' }
    ])
  })

  it('collects fault, estop and door signals together', () => {
    expect(evaluate({ fault_contactor: 1, estop_outer_ok: 0, door_closed: 0 })).toEqual([
      { message: 'contactor_fault', severity: 'error' },
      { message: 'estop_outer_pressed', severity: 'error' },
      { message: 'door_not_closed', severity: 'error' }
    ])
  })

  it('ignores a closed-door check when not in normal mode', () => {
    expect(evaluate({ door_closed: 0, mode_normal: 0, mode_entnahme: 1 }))
      .toEqual([{ message: 'mode_entnahme', severity: 'info' }])
  })

  it('returns empty when klippy has an error but no condition matches', () => {
    expect(evaluate()).toEqual([])
  })
})
