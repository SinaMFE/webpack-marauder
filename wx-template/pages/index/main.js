// 每个页面目录下都需要包含main.js、index.vue文件

import Vue from "vue";
import App from "./index";

const app = new Vue(App);
app.$mount();
