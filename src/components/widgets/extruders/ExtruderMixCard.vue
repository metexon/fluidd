<template>
  <collapsable-card
    :title="$t('app.general.title.extruder_mix')"
    icon="$tune"
    draggable
    layout-path="dashboard.extruder-mix-card"
  >
    <extruder-mix />
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import ExtruderMix from '@/components/widgets/extruders/ExtruderMix.vue'

@Component({
  components: {
    ExtruderMix
  }
})
export default class ExtruderMixCard extends Vue {
}
</script>
