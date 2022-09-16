import type { IBotInfoResp } from '../../interface/common'
import { defineStore } from 'pinia'

type LoginState = 'NOT_LOGIN' | 'LOADING' | 'LOGIN'

export const useBotStore = defineStore('bot', {
  state: () => ({
    appid: localStorage.getItem('appid') || '',
    token: localStorage.getItem('token') || '',
    loginState: 'NOT_LOGIN' as LoginState,
    info: null as IBotInfoResp | null
  })
})
