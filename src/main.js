/*
 * @Descripttion: 
 * @version: 
 * @Author: JohnnyZou
 * @Date: 2019-12-18 10:13:30
 * @LastEditors  : JohnnyZou
 * @LastEditTime : 2020-02-18 17:38:13
 */
import Vue from 'vue'
import App from './App.vue'
import "normalize.css";
import {
  Loading,
  MessageBox,
  Notification,
  Message,
  Row,
  Col,
  Upload,
  Container,
  Button,
  Dialog,
  Input,
  Form,
  FormItem,
  Checkbox,
  CheckboxGroup,
  RadioGroup,
  RadioButton,
  Drawer,
} from 'element-ui';

Vue.use(Loading.directive);

[
  Row,
  Col,
  Upload,
  Container,
  Button,
  Dialog,
  Input,
  Form,
  FormItem,
  Checkbox,
  CheckboxGroup,
  RadioGroup,
  RadioButton,
  Drawer,
].forEach(c => {
  Vue.use(c, {name: c.name})
})

Vue.prototype.$loading = Loading.service;
Vue.prototype.$msgbox = MessageBox;
Vue.prototype.$alert = MessageBox.alert;
Vue.prototype.$confirm = MessageBox.confirm;
Vue.prototype.$prompt = MessageBox.prompt;
Vue.prototype.$notify = Notification;
Vue.prototype.$message = Message;
Vue.config.productionTip = false
console.log(process.env.NODE_ENV === "development");
new Vue({
  render: h => h(App),
}).$mount('#app')
