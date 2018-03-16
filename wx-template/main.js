import Vue from 'vue'
import App from './app.vue'

import store from './libs/store';

// 必须以这种形式挂载vuex
Vue.prototype.$store = store;

const app = new Vue(App);
app.$mount();

// 小程序配置
export default {
	config:{
		pages:['^pages/index/index','pages/test/test'],
		window:{
			backgroundTextStyle:'light',
			navigationBarBackgroundColor:'#fff',
			navigationBarTitleText:'xiaochengxu',
			navigationBarTextStyle:'black'
		}
	}
}
