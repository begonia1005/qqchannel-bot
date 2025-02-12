import { nextTick, reactive, ref, toRaw } from 'vue'
import type {
  IStageBackground,
  IBaseStageItem,
  ICircleToken,
  IRectToken,
  IPolygonToken,
  IWedgeToken, IStarToken, IArrowToken, ITextLabel, ICharacterItem, IGridConfig
} from './map-types'
import { ICustomToken, ITextEditConfig, IToken, ITokenEditConfig } from './map-types'
import { nanoid } from 'nanoid/non-secure'
import { cloneDeep } from 'lodash'

export interface IStageData {
  x: number
  y: number
  background: IStageBackground | null
  items: IBaseStageItem[]
  grid: IGridConfig
}

export const getDefaultStageData: () => IStageData = () => ({
  x: 0,
  y: 0,
  background: null,
  items: [],
  grid: {
    show: false,
    gap: 40,
    stroke: '#f5f5f5',
    xOffset: 0,
    yOffset: 0
  }
})

// initial value, 相当于构造函数
export function useStage(data: IStageData = getDefaultStageData()) {
  const x = ref(data.x)
  const y = ref(data.y)
  const background = ref<IStageBackground | null>(data.background)
  const items = reactive<IBaseStageItem[]>(data.items)
  const selectNodeIds = ref<string[]>([]) // transformer 选中的 node id
  const grid = reactive<IGridConfig>(data.grid)

  // 设置场景背景
  const setBackground = (src: string | null, scale = 0.5) => {
    if (!src) {
      background.value = null
    } else {
      background.value = {
        name: 'map',
        x: 0 - x.value,
        y: 0 - y.value,
        scaleX: scale,
        scaleY: scale,
        rotation: 0,
        'data-src': src
      }
    }
  }

  // 设置背景缩放
  const setBackgroundScale = (scale: number) => {
    if (background.value) {
      background.value.scaleX = scale
      background.value.scaleY = scale
    }
  }

  // 添加 token
  const addToken = (type: string, config: ITokenEditConfig) => {
    const token = createToken(type, x.value, y.value, config)
    items.push(token)
    nextTick(() => {
      selectNodeIds.value = [token.id!]
    })
  }

  // 添加自定义图片 token
  const addCustomToken = (src: string) => {
    const token: ICustomToken = {
      id: nanoid(),
      x: window.innerWidth / 2 - x.value,
      y: window.innerHeight / 2 - y.value,
      scaleX: 0.5,
      scaleY: 0.5,
      rotation: 0,
      'data-src': src,
      name: 'custom-token'
    }
    items.push(token)
    nextTick(() => {
      selectNodeIds.value = [token.id!]
    })
  }

  // 添加文字标签
  const addTextLabel = (config: ITextEditConfig) => {
    const token: ITextLabel = {
      id: nanoid(),
      x: window.innerWidth / 2 - x.value,
      y: window.innerHeight / 2 - y.value,
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
      name: 'text',
      fill: config.fill,
      stroke: config.stroke,
      text: config.text,
      fontFamily: 'Calibri',
      fontSize: 18,
      padding: 5
    }
    items.push(token)
    nextTick(() => {
      selectNodeIds.value = [token.id!]
    })
  }

  // 获取场景中的玩家或 npc
  const findCharacter = (type: 'actor' | 'npc', userId: string) => {
    return items.find(item =>
      item.name === 'character' &&
      (item as ICharacterItem)['data-chara-type'] === type &&
      (item as ICharacterItem)['data-chara-id'] === userId
    )
  }

  // 添加玩家或 npc 标志。如已经存在，则选中它
  const addCharacter = (type: 'actor' | 'npc', userId: string) => {
    // 判断是否已经存在了
    const exist = findCharacter(type, userId)
    if (exist) {
      selectNodeIds.value = [exist.id!]
    } else {
      const token: ICharacterItem = {
        id: nanoid(),
        x: window.innerWidth / 2 - x.value,
        y: window.innerHeight / 2 - y.value,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        name: 'character',
        'data-chara-type': type,
        'data-chara-id': userId
      }
      items.push(token)
      nextTick(() => {
        selectNodeIds.value = [token.id!]
      })
    }
  }

  // 删除玩家或 npc
  const removeCharacter = (type: 'actor' | 'npc', userId: string) => {
    const exist = findCharacter(type, userId)
    if (exist?.id) {
      destroyNode(exist.id)
    }
  }

  // 复制 token
  const duplicateToken = (id: string) => {
    const old = items.find(item => item.id === id)
    if (!old) return
    const newItem = cloneDeep(old)
    newItem.id = nanoid()
    newItem.x = old.x + 20
    newItem.y = old.y + 20
    items.push(newItem)
    // 选中新 item
    nextTick(() => {
      selectNodeIds.value = [newItem.id!]
    })
  }

  // 移到顶层
  const bringToFront = (id: string) => {
    const targetIndex = items.findIndex(item => item.id === id)
    if (targetIndex < 0) return
    const deleted = items.splice(targetIndex, 1)
    items.push(...deleted)
  }

  // 移到底层
  const bringToBottom = (id: string) => {
    const targetIndex = items.findIndex(item => item.id === id)
    if (targetIndex < 0) return
    const deleted = items.splice(targetIndex, 1)
    items.unshift(...deleted)
  }

  // 删除元素
  const destroyNode = (id: string) => {
    const targetIndex = items.findIndex(item => item.id === id)
    if (targetIndex < 0) return
    items.splice(targetIndex, 1)
    // 如果 transform 处于选中态也要一并移除
    selectNodeIds.value = []
  }

  const toJson: () => IStageData = () => ({
    x: x.value,
    y: y.value,
    background: toRaw(background.value),
    items: toRaw(items),
    grid: toRaw(grid)
  })

  // 统一套一层 reactive 以获得正确的类型推断
  // 不然在外面被 reactive 包裹后发生 ref 解包，导致 ReturnType<typeof useStage> 推断出的类型和实际不一致
  return reactive({
    x,
    y,
    background,
    setBackground,
    setBackgroundScale,
    selectNodeIds,
    items,
    grid,
    addToken,
    addCustomToken,
    addTextLabel,
    addCharacter,
    removeCharacter,
    duplicateToken,
    bringToFront,
    bringToBottom,
    destroyNode,
    toJson
  })
}

function createToken(type: string, stageX: number, stageY: number, config: ITokenEditConfig) {
  const commonConfig: IToken = {
    id: nanoid(),
    x: window.innerWidth / 2 - stageX, // 由于 stage 可拖动，确保起始点相对于屏幕位置不变，而不是相对 stage
    y: window.innerHeight / 2 - stageY, // 否则会出现 stage 拖动导致添加的图形不在可视范围内的情况
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
    fill: config.fill,
    stroke: config.stroke,
    strokeWidth: 3,
    name: type,
  }
  switch (type) {
  case 'circle':
    return {
      ...commonConfig,
      radius: 30,
    } as ICircleToken
  case 'rect':
    return {
      ...commonConfig,
      width: 60,
      height: 60
    } as IRectToken
  case 'polygon':
    return {
      ...commonConfig,
      sides: config.polygonSides,
      radius: 30,
    } as IPolygonToken
  case 'wedge':
    return {
      ...commonConfig,
      radius: 60,
      angle: config.wedgeAngle,
    } as IWedgeToken
  case 'star':
    return {
      ...commonConfig,
      numPoints: config.starPoints,
      innerRadius: 15,
      outerRadius: 30,
    } as IStarToken
  case 'arrow':
    return {
      ...commonConfig,
      points: [0, 0, 50, 50],
      pointerLength: 10,
      pointerWidth: 10,
    } as IArrowToken
  default:
    throw new Error('unknown token type: ' + type)
  }
}
