<template>
  <div class="divider-y">
    <div class="collapse-title text-md font-medium flex items-center gap-2">
      <input type="radio" class="radio" :checked="!currentId" @click="configStore.currentRollDeciderId = ''" />
      <span>无检定规则</span>
    </div>
    <template v-for="fullId in rollDeciderIds" :key="fullId">
      <roll-decider-editor
        :id="fullId"
        :default-open="fullId === currentId"
        class="border-base-content/10"
        @edit="editConfig"
        @delete="deleteConfig"
      />
    </template>
  </div>
  <div class="p-2 border-t border-base-content/10 flex items-center gap-2">
    <button class="btn btn-sm btn-ghost gap-1" @click="newEmbedConfig"><PlusIcon class="w-4 h-4" />新增检定规则</button>
<!--    <button class="btn btn-sm btn-ghost gap-1" @click="pluginEditVisible = true"><SquaresPlusIcon class="w-4 h-4" />从插件新增</button>-->
  </div>
  <config-name-edit
      v-model:mode="editForm.mode"
      module="检定规则"
      :default-name="editForm.name"
      :default-desc="editForm.desc"
      @submit="submitEditForm"
  />
<!--  <plugin-edit-->
<!--      v-model:visible="pluginEditVisible"-->
<!--      :list="pluginList"-->
<!--      :default-select="rollDeciderIds"-->
<!--      @submit="onEditPlugins"-->
<!--  />-->
</template>
<script setup lang="ts">
import { useConfigStore } from '../../../store/config'
import { computed, reactive, ref } from 'vue'
import { PlusIcon } from '@heroicons/vue/24/outline'
import RollDeciderEditor from './RollDeciderEditor.vue'
import ConfigNameEdit from '../ConfigNameEdit.vue'
import { usePluginStore } from '../../../store/plugin'

const configStore = useConfigStore()
const currentId = computed(() => configStore.config!.rollDeciderId)
const rollDeciderIds = computed(() => configStore.config!.rollDeciderIds)

// 删除单条
const deleteConfig = (id: string) => {
  configStore.deleteRollDeciderConfig(id)
}

// 新增、编辑弹窗
interface IEditForm { mode: 'add' | 'edit' | null, id?: string, name: string, desc: string }
const editForm = reactive<IEditForm>({ mode: null, name: '', desc: '' })

const submitEditForm = ({ name, desc }: { name: string, desc: string }) => {
  if (!editForm.id) {
    // 新增场景
    configStore.newEmbedRollDeciderConfig(name, desc)
  } else {
    // 编辑场景
    configStore.editRollDeciderConfig(editForm.id, name, desc)
  }
}

// 新增配置
const newEmbedConfig = () => {
  editForm.mode = 'add'
  editForm.id = undefined
  editForm.name = ''
  editForm.desc = ''
}

// 编辑配置
const editConfig = ({ id, name, desc }: { id: string, name: string, desc: string }) => {
  editForm.mode = 'edit'
  editForm.id = id
  editForm.name = name
  editForm.desc = desc
}

// 插件配置
const pluginEditVisible = ref(false)
const pluginStore = usePluginStore()
const pluginList = computed(() => Object.values(pluginStore.rollDeciderMap))

const onEditPlugins = (newPluginIds: string[]) => {
  pluginList.value.forEach(plugin => {
    const pluginFullId = plugin.id
    // 这个插件是否原本已经被选中
    const pluginIndex = configStore.config!.rollDeciderIds.findIndex(id => id === pluginFullId)
    if (newPluginIds.includes(pluginFullId)) {
      if (pluginIndex < 0) {
        // 原来不存在，新增
        configStore.config!.rollDeciderIds.push(pluginFullId)
      }
    } else {
      if (pluginIndex >= 0) {
        // 原来存在，删除
        configStore.config!.rollDeciderIds.splice(pluginIndex, 1)
        if (configStore.config!.rollDeciderId === pluginFullId) {
          configStore.config!.rollDeciderId = ''
        }
      }
    }
  })
}
</script>
