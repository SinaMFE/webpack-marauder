import Vue from 'vue'
import Vuex from 'vuex'

const state = {
  data: 1000
}

const actions = {
    changeText({ commit, state }, text) {
      commit('change', text);
    }
}

const mutations =  {
  change(state, text) {
    state.data += text;
  }
}

Vue.use(Vuex)

export default new Vuex.Store({
  state,
  actions,
  mutations
})
