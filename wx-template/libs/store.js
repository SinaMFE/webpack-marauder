import Vue from 'vue'
import Vuex from 'vuex'

const state = {
  data: [{text: 'text'}, {text: 'text2'}],
  data1: {
    name: 'peter'
  },
  data2: 1000
}

const actions = {
    changeText({ commit, state }, text) {
      commit('change', text);
    }
}

const mutations =  {
  change(state, text) {
    state.data1.name += text;
  },
  addList(state, text){
    state.data.push({
      text: text
    });
  }
}

Vue.use(Vuex)

export default new Vuex.Store({
  state,
  actions,
  mutations,
  getters: {
    data: state => {
      return state.data
    },
    data1: state => {
      return state.data1
    },
    data2: state => {
      return state.data2
    }
  }
})
