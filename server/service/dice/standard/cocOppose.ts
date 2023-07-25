import { StandardDiceRoll } from './index'
import { CocDiceRoll } from './coc'

// 对抗检定
// this.context.opposedRoll 代表要和本次对抗的 roll
export class CocOpposedDiceRoll extends CocDiceRoll {

  override parseDescriptions(expression: string) {
    super.parseDescriptions(expression)
    // 回复消息进行对抗检定时，如果没有指定技能名描述，就认为是取相同的技能进行对抗
    if (this.skillsForTest.length === 0) {
      this.skillsForTest.push(this.context.opposedRoll!.skillsForTest[0])
    }
  }

  override get output() {
    const opposedResult = this.opposedRoll(this.context.opposedRoll!)
    if (opposedResult) {
      return super.output + '\n' + opposedResult
    } else {
      return super.output
    }
  }

  override applyToCard() {
    // 对抗检定不标记成长
    return []
  }

  // 判断对抗检定结果
  private opposedRoll(other: StandardDiceRoll) {
    if (!(other instanceof CocDiceRoll)) return ''
    if (!this.eligibleForOpposedRoll || !other.eligibleForOpposedRoll) return ''
    // 1. 判断各自成功等级 大失败-2 失败-1 成功1 困难成功2 极难成功3 大成功4
    // const refineSuccessLevels = this.context.config.specialDice.opposeDice.refineSuccessLevels
    // refineSuccessLevels 配置传入。不能在内部读取 config，因为可能读到到老的 context 中的 config
    const selfResult = this.getSuccessLevelForOpposedRoll()
    const otherResult = other.getSuccessLevelForOpposedRoll()
    // 2. 比较
    const selfSuccess = (() => {
      if (!selfResult.success) {
        return 'fail' // 本身就失败
      } else { // 本身成功，和对方判断
        if (selfResult.level === otherResult.level) { // 等级一样
          if (selfResult.baseValue === otherResult.baseValue) return 'draw' // 数值也一样，平局
          return selfResult.baseValue > otherResult.baseValue ? 'success' : 'fail' // 数值越大越好
        } else { // 等级不一样，谁高谁赢
          return selfResult.level > otherResult.level ? 'success' : 'fail'
        }
      }
    })()
    const otherSuccess = (() => {
      if (selfSuccess === 'fail') { // 我方失败，对方可能成功可能失败
        return !otherResult.success ? 'fail' : 'success'
      } else { // 我方平局或成功，对方就是相反结果
        return selfSuccess === 'draw' ? 'draw' : 'fail'
      }
    })()
    // 3. 组装
    const icon = { success: '🟩', fail: '🟥', draw: '🟨' }
    return [icon[selfSuccess], selfResult.username, `${selfResult.skill}(${selfResult.baseValue})`,
      selfResult.level, '↔️', otherResult.username,
      `${otherResult.skill}(${otherResult.baseValue})`, otherResult.level,
      icon[otherSuccess]].join(' ')
  }
}
