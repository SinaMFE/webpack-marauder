<template>
  <div>
    <span>{{dataFromChild}}</span>
    <toast :message="'成功'" v-on:dataToParent="eventFromChild">
      <template slot="testSlot">
        <div>slot插槽内容</div>
      </template>
    </toast>
    <div>
      <h2>{{title}}</h2>
      <ul class="list">
        <li v-for="(item, key) in data" :key="key">{{item.text}}</li>
      </ul>
      <p v-if="showName">{{data1.name}}</p>
      <span v-else>v-if成功</span>
      <span v-show="!showName">v-show成功</span>
      <span>{{count}}</span>
      <button @click="update('更新数据成功')">测试数据更新</button>
      <button v-on:click="testIfshow">测试v-if/v-show</button>
    </div>
    <br>
    <span v-bind:class="{ active: isActive }" :style="[inlineStyle]">动态class、style</span>
    <br>
    <span v-show="isWatch" v-bind:style="{fontSize: '16px'}">顺带测试watch，成功</span>
    <button @click="isActive = ! isActive">测试动态class、style，watch</button>
    <div>
      <p>测试表单</p>
      <input placeholder="测试v-modal" v-model="inputVal">
      <label>{{inputVal}}</label>
      <br>
      <input type="checkbox" id="checkbox" v-model="checked">
      <label for="checkbox">{{ checked }}</label>
      <br>
      <select v-model="selected">
                <option disabled value="">请选择</option>
                <option>A</option>
                <option>B</option>
                <option>C</option>
            </select>
      <span>Selected: {{ selected }}</span>
    </div>
    <p>未测试特性</p>
    <ul>
      <li>组件prop验证</li>
      <li>事件修饰符</li>
      <li>作用域插槽</li>
      <li>动态组件</li>
      <li>ref</li>
      <li>v-once</li>
      <li>高阶组件</li>
      <li>过渡动画</li>
      <li>混入</li>
      <li>自定义指令</li>
      <li>过滤器</li>
    </ul>
  </div>
</template>
<script>
  import { mapGetters } from 'vuex'
  import toast from '../../component/toast.vue';
  export default {
    data() {
      return {
        title: 'name list',
        inputVal: '',
        showName: true,
        isActive: false,
        isWatch: false,
        checked: false,
        selected: '',
        dataFromChild: '',
        inlineStyle:
          {
            color: 'red',
            fontSize: '20px'
          }
      }
    },
    components: {
        toast
    },
    computed: {
        ...mapGetters({
            data: 'data',
            data1: 'data1',
            count: 'data2'
          })
    },
    watch: {
        isActive: function(newVal, oldVal) {
          this.isWatch = newVal;
        }
      },
    methods: {
        update(text) {
          this.$store.dispatch('changeText', text);
          this.$store.commit('addList', text);
        },
        testIfshow() {
          this.showName = !this.showName
        },
        eventFromChild(msg) {
          this.dataFromChild = msg;
        }
      }
  }
</script>
<style>
  * {
    font-size: 16px;
  }
  
  p,
  h2 {
    margin: 0;
    font-size: 30px;
  }
  
  button {
    margin: 0.5rem 0 0.5rem 0;
    display: block;
  }
  
  h2 {
    font-size: 0.8rem;
  }
  
  .list {
    font-size: 0.3rem;
  }
  
  div span {
    font-size: 0.3rem;
  }
  
  div> input {
    margin: 0.3rem;
    margin-left: 0;
  }
  
  .active {
    font-weight: bold;
  }
</style>
