import type { ICardData } from './types'
import { BaseCard } from './types'

export interface IGeneralCardData extends ICardData {
  type: 'general'
  ext: string
  skills: Record<string, number>
  abilities: Record<string, string>
}

export class GeneralCard extends BaseCard<IGeneralCardData> {
  get HP() {
    return this.getEntry('HP')?.value
  }

  get MAXHP() {
    return this.getEntry('MAXHP')?.value
  }

  getAbility(input: string) {
    const key = input.toUpperCase()
    const value = this.data.abilities[key]
    if (typeof value !== 'undefined') {
      return { input, key, value }
    } else {
      return undefined
    }
  }

  setAbility(name: string, value: string) {
    const key = name.toUpperCase()
    if (this.data.abilities[key] !== value) {
      this.data.abilities[key] = value
      this.data.lastModified = Date.now()
      return true
    }
    return false
  }

  removeAbility(name: string) {
    const key = name.toUpperCase()
    if (typeof this.data.abilities[key] !== 'undefined') {
      delete this.data.abilities[key]
      this.data.lastModified = Date.now()
      return true
    } else {
      return false
    }
  }

  getEntry(input: string) {
    const key = input.toUpperCase()
    const value = this.data.skills[key]
    if (typeof value !== 'undefined') {
      return { input, key, value, isTemp: false }
    } else {
      return undefined
    }
  }

  setEntry(name: string, value: number) {
    const key = name.toUpperCase()
    if (this.data.skills[key] !== value) {
      this.data.skills[key] = value
      this.data.lastModified = Date.now()
      return true
    }
    return false
  }

  removeEntry(name: string) {
    const key = name.toUpperCase()
    if (typeof this.data.skills[key] !== 'undefined') {
      delete this.data.skills[key]
      this.data.lastModified = Date.now()
      return true
    } else {
      return false
    }
  }

  getSummary() {
    const skills = Object.entries(this.data.skills).map(([k ,v]) => `${k}：${v}`).join(' ')
    const abilities = Object.entries(this.data.abilities).map(([k ,v]) => `${k}：${v}`).join('\n')
    return '角色：' + this.name + '\n' + skills + '\n' + abilities
  }
}