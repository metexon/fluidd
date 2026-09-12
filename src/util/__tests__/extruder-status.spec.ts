import { allExtrudersOffPlan, bodyState, findActiveGroup, groupCommand, groupMatchesActive, groupSelectionCommand, motorState, pwmText, temperatureCommand, temperatureState, temperatureText } from '../extruder-status'

const groups: Klipper.ExtruderStatusGroup[] = [
  {
    id: 'builtin_all',
    label: 'All',
    selector: { EXTRUDERS: '0,1,2,3' },
    heads: [0, 1, 2, 3],
    ratios: [1, 1, 1, 1],
    temperature_mode: 'mtx'
  },
  {
    id: 'builtin_only:2',
    label: 'only extruder2',
    selector: { EXTRUDERS: '2' },
    heads: [2],
    ratios: [1],
    temperature_mode: 'mtx'
  },
  {
    id: 'builtin_only:3',
    label: 'only extruder3',
    selector: { EXTRUDERS: '3' },
    heads: [3],
    ratios: [1],
    temperature_mode: 'mtx'
  }
]

describe('extruder status presentation', () => {
  it.each([
    [190, 200, 'heating'],
    [200, 200, 'at-temperature'],
    [206, 200, 'too-hot'],
    [51, 0, 'cooling'],
    [40, 0, null]
  ] as const)('classifies %i°C against %i°C as %s', (current, target, expected) => {
    expect(temperatureState(current, target)).toBe(expected)
  })

  it('formats unavailable channels as an em dash', () => {
    expect(temperatureText(null)).toBe('—')
    expect(pwmText(undefined)).toBe('—')
  })

  it('uses the body and motor safety thresholds', () => {
    expect(bodyState(60)).toBeNull()
    expect(bodyState(60.1)).toBe('too-hot')
    expect(motorState(90)).toBeNull()
    expect(motorState(90.1)).toBe('too-hot')
  })

  it('preserves the supplied selector and builds temperature commands', () => {
    expect(groupCommand({ id: 'all', selector: { EXTRUDERS: '0,1,2' }, heads: [0, 1, 2], ratios: [1, 1, 1], temperature_mode: 'ordinary' })).toBe('SET_EXTRUSION_GROUP EXTRUDERS=0,1,2')
    expect(groupCommand({ id: 'left', selector: { GROUP: 'left' }, heads: [0, 1], ratios: [1, 1], temperature_mode: 'ordinary' })).toBe('SET_EXTRUSION_GROUP GROUP=left')
    expect(temperatureCommand(210, 'ordinary', 190)).toBe('SET_EXTRUSION_TEMPERATURE TARGET=210')
    expect(temperatureCommand(210, 'mtx', 190)).toBe('SET_EXTRUSION_TEMPERATURE TARGET=210 TARGET_T2=190')
  })

  it('resolves a backend custom id to the matching built-in group', () => {
    const activeGroup = { id: 'custom', heads: [3], ratios: [1], temperature_mode: 'mtx' as const }

    expect(findActiveGroup(groups, activeGroup)?.id).toBe('builtin_only:3')
    expect(groupMatchesActive(groups[2], activeGroup)).toBe(true)
  })

  it('prefers an exact id and rejects a different custom selection', () => {
    const duplicateSelection = {
      id: 'named_single_3',
      label: 'named extruder3',
      selector: { GROUP: 'named_single_3' },
      heads: [3],
      ratios: [1],
      temperature_mode: 'mtx' as const
    }

    expect(findActiveGroup([...groups, duplicateSelection], {
      id: 'named_single_3',
      heads: [3],
      ratios: [1],
      temperature_mode: 'mtx'
    })?.id).toBe('named_single_3')

    expect(findActiveGroup(groups, {
      id: 'custom',
      heads: [1],
      ratios: [0.5],
      temperature_mode: 'mtx'
    })).toBeUndefined()
  })

  it('treats head order and ratios as part of group identity', () => {
    const activeGroup = { id: 'custom', heads: [3, 2], ratios: [1, 1], temperature_mode: 'mtx' as const }
    expect(findActiveGroup(groups, activeGroup)).toBeUndefined()
  })

  it('tracks consecutive custom notifications by their heads, not their unchanged id', () => {
    const selections = [
      { id: 'custom', heads: [3], ratios: [1], temperature_mode: 'mtx' as const },
      { id: 'custom', heads: [2], ratios: [1], temperature_mode: 'mtx' as const }
    ].map(activeGroup => findActiveGroup(groups, activeGroup)?.id)

    expect(selections).toEqual(['builtin_only:3', 'builtin_only:2'])
  })

  it('does not re-select a semantically active group before applying a preset', () => {
    const activeGroup = { id: 'custom', heads: [3], ratios: [1], temperature_mode: 'mtx' as const }

    expect(groupSelectionCommand(groups[2], activeGroup)).toBeNull()
    expect(groupSelectionCommand(groups[1], activeGroup)).toBe('SET_EXTRUSION_GROUP EXTRUDERS=2')
  })

  it('restores a custom-id single-head group after turning every extruder off', () => {
    const status: Klipper.ExtruderStatusState = {
      extruders: [0, 1, 2, 3].map(head => ({
        head,
        name: head === 0 ? 'extruder' : `extruder${head}`,
        active: head === 3,
        t1: { temperature: 25, target: 0, power: 0 }
      })),
      groups,
      active_group: { id: 'custom', heads: [3], ratios: [1], temperature_mode: 'mtx' }
    }

    expect(allExtrudersOffPlan(status)).toEqual({
      selectAll: 'SET_EXTRUSION_GROUP EXTRUDERS=0,1,2,3',
      turnOff: 'SET_EXTRUSION_TEMPERATURE TARGET=0 TARGET_T2=0',
      restore: 'SET_EXTRUSION_GROUP EXTRUDERS=3'
    })
  })
})
