/*
 * @Descripttion:
 * @version:
 * @Author: JohnnyZou
 * @Date: 2020-01-20 15:16:53
 * @LastEditors: JohnnyZou
 * @LastEditTime: 2020-01-20 15:17:58
 */
import App from './App.vue'
export default App;
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
} from 'element-ui';

if (typeof window !== 'undefined' && window.Vue) {
    Vue.use(Loading.directive);
    
    [Row, Col, Upload, Container, Button, Dialog, Input].forEach(c => {
      Vue.use(c, {name: c.name})
    })
    
    Vue.prototype.$loading = Loading.service;
    Vue.prototype.$msgbox = MessageBox;
    Vue.prototype.$alert = MessageBox.alert;
    Vue.prototype.$confirm = MessageBox.confirm;
    Vue.prototype.$prompt = MessageBox.prompt;
    Vue.prototype.$notify = Notification;
    Vue.prototype.$message = Message;
}