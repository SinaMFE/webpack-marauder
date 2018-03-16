<template>
    <div>
        {{text + message}}
        <slot name="testSlot"></slot>
        <button @click="dataToParent">测试父子组件数据传递</button>
    </div>
</template>
<script>
  export default {
    props: ['message'],
    computed: {
      text: function () {
        return '测试组件引入'
      }
    },
    methods: {
      dataToParent(){
        this.$emit('dataToParent', '子组件传来数据：12306')
      }
    }
  }
</script>
<style scoped>
    div{
        color: red;
    }
</style>