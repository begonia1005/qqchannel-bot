<template>
  <div class="collapse" :class="{ 'collapse-open': helpDocOpen, 'collapse-close': !helpDocOpen }">
    <div class="collapse-title cursor-pointer flex items-center gap-2" @click="helpDocOpen = !helpDocOpen">
      <component :is="helpDocOpen ? ChevronDownIcon : ChevronRightIcon" class="w-4 h-4" />
      <span>{{ title }}</span>
    </div>
    <div class="collapse-content">
      <div class="pl-6">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'

const props = defineProps<{ title: string }>()
const helpDocOpen = ref(false)
</script>
