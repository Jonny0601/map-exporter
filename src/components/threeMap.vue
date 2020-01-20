<!--
 * @Descripttion: 
 * @version: 
 * @Author: JohnnyZou
 * @Date: 2019-12-18 13:14:41
 * @LastEditors  : JohnnyZou
 * @LastEditTime : 2020-01-10 18:07:00
 -->
<template>
	<div class="mapContainer" ref="mapContainer">
		<el-dialog
			title="编辑区域属性"
			:visible.sync="centerDialogVisible"
			width="80%"
			center
			@close="closeDialog"
		>
			<div class="propertyBox" v-if="currentEditAreaMesh">
				<div>已有属性：</div>
				<p v-for="(value, key) in currentEditAreaMesh.userData" :key="key">{{ key }}: {{ value }}</p>
			</div>
			<div class="propertyBox" v-else>当前区域暂属性信息</div>
			<el-input
				type="textarea"
				v-model="propertyValue"
				:rows="4"
				placeholder="请输入属性的key和value，例：id='suzhou'，多个属性请用“;”号隔开"
				:autosize="true"
				:clearable="true"
				:autofocus="true"
			></el-input>
			<span slot="footer" class="dialog-footer">
				<el-button type="primary" @click="saveInputProperty">添加属性</el-button>
			</span>
		</el-dialog>
	</div>
</template>
<script>
import * as threeMap from "../map"
export default {
	data () {
		return {
			threeMapInstance: null,
			centerDialogVisible: false,
			currentEditAreaMesh: null,
			propertyValue:""
		}
	},
	props: {
		
	},
	methods: {
		// 浏览器缩放事件
		onWindowResize() {
			this.threeMapInstance.camera.aspect = this.$refs.mapContainer.offsetWidth / window.innerHeight;
			this.threeMapInstance.camera.updateProjectionMatrix();
			this.threeMapInstance.renderer.setSize(this.$refs.mapContainer.offsetWidth, window.innerHeight);
			this.threeMapInstance.labelRenderer.setSize(this.$refs.mapContainer.offsetWidth, window.innerHeight);
		},
		createThreeMap() {
			const threeMapInstance = new threeMap.CreateMapFromGeoJson({
				renderWidth: this.$refs.mapContainer.offsetWidth,
				renderHeight: window.innerHeight,
				isStatsWatch: true,
				root: this.$refs.mapContainer,
				addAttributesHandle: mesh => {
					if(this.centerDialogVisible){
						return
					}
					console.log("开始编辑");
					this.centerDialogVisible = true;
					this.currentEditAreaMesh = mesh;
				}
			});
			this.threeMapInstance = threeMapInstance;
			window.addEventListener("resize", this.onWindowResize.bind(this), false);
		},
		// 保存输入属性
		saveInputProperty() {
			if(this.propertyValue){
				const inputProperty = this.parsePropertyStr(this.propertyValue);
				if (inputProperty === null) {
					return;
				}
				this.currentEditAreaMesh.userData = {
					...this.currentEditAreaMesh.userData,
					...inputProperty
				}
			}
			this.centerDialogVisible = false;
			this.threeMapInstance.updateAreaText(this.currentEditAreaMesh);
			this.clearInput();
		},
		// 解析属性字符串
		parsePropertyStr(str) {
			const property = {};
			const arr = str.split(";");
			let errorValue = null;
			for (let item of arr) {
				const itemArr = item.split("=");
				itemArr[1] = isNaN(Number(itemArr[1])) ? itemArr[1] : Number(itemArr[1]);
				try {
					property[itemArr[0]] = JSON.parse(itemArr[1])
				} catch(e){
					errorValue = itemArr[1];
					break;
				}
			}
			if (errorValue) {
				this.$notify.error({
					title: '解析错误',
					message: `值${errorValue}为非法格式`
				});
				return null;
			}
			return property;
		},
		// 清除上一次输入
		clearInput() {
			this.propertyValue = "";
			this.currentEditAreaMesh = null;
		},
		// 关闭对话框
		closeDialog() {
			this.clearInput();
		}
	},
	mounted() {
		this.createThreeMap();
	}
}
</script>
<style lang="less" scoped>
.mapContainer{
	overflow: hidden;
	width: 100%;
	position: relative;
	.propertyBox{
		// display: flex;
		margin-bottom: 20px;
		overflow: hidden;
		>p {
			margin: 0;
			margin-right: 1%;
			font-weight: bold;
			float: left;
		}
	}
}
</style>