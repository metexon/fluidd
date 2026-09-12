export type TemperatureState = 'heating' | 'at-temperature' | 'too-hot' | 'cooling' | null

export const temperatureState = (current: number | null | undefined, target: number | null | undefined): TemperatureState => {
  if (current == null || target == null) return null
  if (target > 0 && current < target - 5) return 'heating'
  if (target > 0 && Math.abs(current - target) <= 5) return 'at-temperature'
  if (target > 0 && current > target + 5) return 'too-hot'
  if (target === 0 && current > 50) return 'cooling'
  return null
}

export const temperatureText = (value: number | null | undefined) => value == null ? '—' : `${value.toFixed(1)} °C`
export const pwmText = (value: number | null | undefined) => value == null ? '—' : `${(value * 100).toFixed()} %`
export const bodyState = (value: number | null | undefined) => value != null && value > 60 ? 'too-hot' : null
export const motorState = (value: number | null | undefined) => value != null && value > 90 ? 'too-hot' : null

const numbersEqual = (left: number[], right: number[]) => (
  left.length === right.length && left.every((value, index) => value === right[index])
)

export const groupMatchesActive = (
  group: Klipper.ExtruderStatusGroup,
  activeGroup: Klipper.ExtruderStatusState['active_group']
) => (
  group.id === activeGroup.id || (
    numbersEqual(group.heads, activeGroup.heads) &&
    numbersEqual(group.ratios, activeGroup.ratios)
  )
)

export const findActiveGroup = (
  groups: Klipper.ExtruderStatusGroup[],
  activeGroup: Klipper.ExtruderStatusState['active_group']
) => (
  groups.find(group => group.id === activeGroup.id) ??
  groups.find(group => groupMatchesActive(group, activeGroup))
)

export const groupCommand = (group: Klipper.ExtruderStatusGroup) => {
  const params = Object.entries(group.selector).map(([key, value]) => `${key}=${value}`).join(' ')
  return `SET_EXTRUSION_GROUP ${params}`
}

export const temperatureCommand = (t1: number, mode: 'ordinary' | 'mtx', t2?: number) => {
  const params = [`TARGET=${t1}`]
  if (mode === 'mtx' && t2 != null) params.push(`TARGET_T2=${t2}`)
  return `SET_EXTRUSION_TEMPERATURE ${params.join(' ')}`
}

export const groupSelectionCommand = (
  group: Klipper.ExtruderStatusGroup,
  activeGroup: Klipper.ExtruderStatusState['active_group']
) => groupMatchesActive(group, activeGroup) ? null : groupCommand(group)

export interface AllExtrudersOffPlan {
  selectAll: string;
  turnOff: string;
  restore: string | null;
}

export const allExtrudersOffPlan = (
  status: Klipper.ExtruderStatusState
): AllExtrudersOffPlan | null => {
  const allHeads = status.extruders.map(head => head.head).join(',')
  const allGroup = status.groups.find(group => (
    group.id === 'builtin_all' || group.selector.EXTRUDERS === allHeads
  ))

  if (!allGroup) return null

  const activeGroup = findActiveGroup(status.groups, status.active_group)
  const allMode = allGroup.temperature_mode === 'ordinary' ? 'ordinary' : 'mtx'

  return {
    selectAll: groupCommand(allGroup),
    turnOff: temperatureCommand(0, allMode, 0),
    restore: activeGroup && activeGroup.id !== allGroup.id
      ? groupCommand(activeGroup)
      : null
  }
}
