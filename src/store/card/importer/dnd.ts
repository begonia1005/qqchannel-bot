import { DndCard, IDndCardData } from '../../../../interface/card/dnd'
import { VERSION_CODE } from '../../../../interface/version'
import XLSX from 'xlsx'

export function getDndCardProto(name?: string): IDndCardData {
  return {
    type: 'dnd',
    version: VERSION_CODE,
    name: name || '未命名',
    lastModified: Date.now(),
    info: {
      job: '',
      gender: '',
      age: 24,
      race: '',
      camp: ''
    },
    basic: {
      EXP: 0,
      LV: 1,
      '熟练': 2,
      HP: 10,
      MAXHP: 10,
      AC: 10
    },
    props: {
      '力量': 0,
      '敏捷': 0,
      '体质': 0,
      '智力': 0,
      '感知': 0,
      '魅力': 0,
    },
    skills: {
      '运动': 0,
      '体操': 0,
      '巧手': 0,
      '隐匿': 0,
      '奥秘': 0,
      '历史': 0,
      '调查': 0,
      '自然': 0,
      '宗教': 0,
      '驯兽': 0,
      '洞悉': 0,
      '医疗': 0,
      '察觉': 0,
      '生存': 0,
      '欺瞒': 0,
      '威吓': 0,
      '表演': 0,
      '说服': 0,
    },
    items: {
      CP: 0,
      SP: 0,
      GP: 0,
      EP: 0,
      PP: 0,
    },
    equips: [],
    spells: [],
    ext: '',
    meta: {
      spellSlots: {
        1: { value: 0, max: 0 },
        2: { value: 0, max: 0 },
        3: { value: 0, max: 0 },
        4: { value: 0, max: 0 },
        5: { value: 0, max: 0 },
        6: { value: 0, max: 0 },
        7: { value: 0, max: 0 },
        8: { value: 0, max: 0 },
        9: { value: 0, max: 0 },
      },
      deathSaving: { success: 0, failure: 0 },
      propsSaving: {
        '力量': false,
        '敏捷': false,
        '体质': false,
        '智力': false,
        '感知': false,
        '魅力': false,
      }
    }
  }
}

export function parseDndXlsx(workbook: XLSX.WorkBook) {
  const user = getDndCardProto()
  const setter = new DndCard(user)
  const sheet = workbook.Sheets['主要']
  user.name = sheet['D3']?.v || '未命名'
  user.info.job = [sheet['R4']?.v, sheet['V4']?.v].filter(item => !!item).join(' ')
  user.info.gender = sheet['L6']?.v || ''
  user.info.age = sheet['L7']?.v || 24
  user.info.race = [sheet['D6']?.v, sheet['D7']?.v].filter(item => !!item).join(' ')
  user.info.camp = sheet['L9']?.v || ''
  user.basic.EXP = sheet['R3']?.v || 0
  user.basic.LV = sheet['Y4']?.v || 1
  user.basic.熟练 = sheet['U9']?.v || 2
  user.basic.HP = sheet['M23']?.v || 10
  user.basic.MAXHP = sheet['Q23']?.v || 10
  user.basic.AC = sheet['D26']?.v || 10
  // props: C列 name ,F14-F19 value，R列调整值 T列豁免值
  for (let i = 14; i <= 19; i++) {
    const name = sheet['C' + i]?.v
    const value = sheet['F' + i]?.v
    if (typeof name === 'string' && typeof value === 'number') {
      setter.setEntry(name, value)
    }
    // 判断豁免值
    const modifiedValue = sheet['R' + i]?.v
    const savingValue = sheet['T' + i]?.v
    if (name in user.meta.propsSaving && typeof modifiedValue === 'number' && typeof savingValue === 'number') {
      user.meta.propsSaving[name as keyof typeof user.meta.propsSaving] = savingValue - modifiedValue !== 0
    }
  }
  // skills： 39-60 C列 name，F value，跳过 40 44 50 56
  for (let i = 39; i <= 60; i++) {
    if ([40, 44, 50, 56].includes(i)) continue
    const name = sheet['C' + i]?.v
    const value = sheet['F' + i]?.v
    if (typeof name === 'string' && typeof value === 'number') {
      setter.setEntry(name, value)
    }
  }
  // 金币
  user.items.CP = sheet['Q62']?.v || 0
  user.items.SP = sheet['W62']?.v || 0
  user.items.EP = sheet['AC62']?.v || 0
  user.items.GP = sheet['AI62']?.v || 0
  user.items.PP = sheet['AO62']?.v || 0
  // equips
  const armorName = sheet['L39']?.v // 护甲
  if (armorName) {
    user.equips.push({
      name: armorName,
      expression: String(sheet['AB39']?.v || ''),
      ext: ''
    })
  }
  // 武器 41-45 L:name， AH 伤害 AC 命中
  for (let i = 41; i <= 45; i++) {
    const name = sheet['L' + i]?.v
    if (typeof name === 'string' && name) {
      user.equips.push({
        name: name + '命中',
        expression: String(sheet['AC' + i]?.v || '').toLowerCase(),
        ext: ''
      })
      user.equips.push({
        name,
        expression: String(sheet['AH' + i]?.v || '').toLowerCase(),
        ext: ''
      })
    }
  }
  // 法术 66-80 C J Q 三列
  for (const col of [['B', 'C'], ['I', 'J'], ['P', 'Q']]) {
    const [lvCol, nameCol] = col
    for (let i = 66; i <= 80; i++) {
      const name = sheet[nameCol + i]?.v
      if (typeof name === 'string' && name) {
        user.spells.push({
          name,
          expression: String(sheet[lvCol + i]?.v || ''),
          ext: ''
        })
      }
    }
  }
  // 法术位 52-60 AO AR
  for (let i = 52; i <= 60; i++) {
    const index = i - 51
    const value = sheet['AO' + i]?.v || 0
    const max = sheet['AR' + i]?.v || 0
    user.meta.spellSlots[index] = { value, max }
  }
  // 死亡豁免 28 成功：M N O, 失败：R S T
  user.meta.deathSaving.success = ['M28', 'N28', 'O28'].map(i => sheet[i]?.v).filter(i => !!i).length
  user.meta.deathSaving.failure = ['R28', 'S28', 'T28'].map(i => sheet[i]?.v).filter(i => !!i).length

  return setter
}
