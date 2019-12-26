<!--
 * @Descripttion: 
 * @version: 
 * @Author: JohnnyZou
 * @Date: 2019-12-18 10:13:30
 * @LastEditors  : JohnnyZou
 * @LastEditTime : 2019-12-18 10:22:15
 -->
<template>
  <div id="app">
    <index />
  </div>
</template>

<script>
import index from "./view/index";
export default {
  name: 'app',
  components: {
    index
  }
}
</script>

<style>
body {
  overflow: hidden;
}
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
</style>
