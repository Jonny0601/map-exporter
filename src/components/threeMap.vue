<!--
 * @Descripttion: 
 * @version: 
 * @Author: JohnnyZou
 * @Date: 2019-12-18 13:14:41
 * @LastEditors: JohnnyZou
 * @LastEditTime: 2020-07-04 18:36:23
 -->
<template>
	<div class="wrapper">
		<!-- threejs 画布 -->
		<div class="mapContainer" ref="mapContainer"></div>
		<div class="dialog">
			<!-- 属性编辑弹窗 -->
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
			<!-- 属性编辑————添加点的弹窗 -->
			<el-dialog
				title="点信息"
				:visible.sync="centerDialogPointVisible"
				width="80%"
				center
				@close="closePointDialog"
			>
				<el-form ref="form" :model="form" label-width="80px">
					<el-form-item label="点类型">
						<el-radio-group v-model="form.pointType">
							<el-radio-button label="lightBeam">光柱位置点</el-radio-button>
							<el-radio-button label="flyLine">飞线位置点</el-radio-button>
							<el-radio-button label="columnBar">柱图位置点</el-radio-button>
							<el-radio-button label="pointLayer">区块位置点</el-radio-button>
						</el-radio-group>
					</el-form-item>
					<el-form-item label="点名称">
						<el-input v-model="pointName" disabled></el-input>
					</el-form-item>
					<el-form-item label="描述">
						<el-input type="textarea" v-model="form.desc" placeholder="点位描述（选填）"></el-input>
					</el-form-item>
					<el-form-item>
						<el-button type="primary" @click="addPoint">立即创建</el-button>
						<el-button @click="closePointDialog">取消</el-button>
					</el-form-item>
				</el-form>
			</el-dialog>
			<!-- 属性编辑————删除点的弹窗 -->
			<el-dialog
				title="点信息"
				:visible.sync="showPointInfoDialog"
				width="60%"
				center
				@close="closePointDialog"
			>
				<el-form ref="form" :model="form" label-width="100px">
					<el-form-item label="区块id：">
						<el-input v-model="showPointData.id" disabled></el-input>
					</el-form-item>
					<el-form-item label="当前区块名：">
						<el-input v-model="showPointData.areaName" disabled></el-input>
					</el-form-item>
					<el-form-item label="点名称：">
						<el-input v-model="showPointData.pointName" disabled></el-input>
					</el-form-item>
					<el-form-item label="点位置：">
						<el-input v-model="showPointData.data" disabled></el-input>
					</el-form-item>
					<el-form-item>
						<el-button type="primary" @click="delPoint">删除</el-button>
						<el-button @click="cancelDelPoint">取消</el-button>
					</el-form-item>
				</el-form>
			</el-dialog>
		</div>
	</div>
</template>
<script>
import * as threeMap from "../map"
export default {
	data () {
		return {
			threeMapInstance: null, // map实例
			centerDialogVisible: false, // 控制属性编辑弹窗
			currentEditAreaMesh: null, // 当前编辑的区域mesh
			propertyValue:"",  // 当前编辑的属性值
			centerDialogPointVisible: false, // 控制添加点的编辑弹窗
			selectedObj: null, // 当前射线相交的对象
			form: {
				pointType: "lightBeam",
				desc: ""
			},
			showPointInfoDialog: false, // 控制显示点信息的弹窗
			showPointData: {}, // 当前展示的点信息
			pointAreaLabel: null, // 当前点击的点的CSS2DObject对象
		}
	},
	computed: {
		pointName () {
			const map = {
				lightBeam: "光柱点",
				flyLine: "飞线点",
				columnBar: "柱图点",
				pointLayer: "区块位置点",
			}
			const name = map[this.form.pointType];
			if (this.currentEditAreaMesh) {
				const pointCSS2DObject = this.currentEditAreaMesh.children.filter(obj => {
					return obj.pointType === this.form.pointType;
				})
				return `${name}${pointCSS2DObject.length + 1}`;
			}
			return  `${name}1`;
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
			const threeMapInstance = new threeMap.CreateMap({
				renderWidth: this.$refs.mapContainer.offsetWidth,
				renderHeight: window.innerHeight,
				isStatsWatch: true,
				root: this.$refs.mapContainer,
				// 添加属性
				addAttributesHandle: mesh => {
					if(this.centerDialogVisible){
						return
					}
					console.log("开始编辑");
					this.centerDialogVisible = true;
					this.currentEditAreaMesh = mesh;
				},
				// 添加自定义点
				addAttributePointHandle: (selected, currentMesh) => {
					if (!selected) {
						return this.$notify.error({
							title: '系统提示',
							message: '该点不在当前区域内，请重新选择！'
						});
					}
					this.centerDialogPointVisible = true;
					this.currentEditAreaMesh = currentMesh;
					this.selectedObj = selected;
					console.log("x坐标:" + selected.point.x);
					console.log("y坐标:" + selected.point.y);
					console.log("z坐标:" + selected.point.z);
				},
				// 显示点信息
				showPointInfoHandle: areaLabel => {
					console.log(areaLabel);
					this.pointAreaLabel = areaLabel;
					this.showPointInfoDialog = true;
					const mesh = areaLabel.parent;
					this.showPointData.id = mesh.userData.tid;
					this.showPointData.areaName = mesh.userData.name;
					console.log(mesh.userData);
					const pointTypeInfoObj = mesh.userData[areaLabel.pointType][areaLabel.pointName];

					this.showPointData.pointName = pointTypeInfoObj.name;
					this.showPointData.data = `x: ${pointTypeInfoObj.value[0]}, y: ${pointTypeInfoObj.value[1]}`;
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
		},
		// 点的表单提交
		addPoint() {
			console.log(this.form);
			console.log(this.selectedObj, "currentMesh");
			if(!this.form.pointType.length){
				return this.$notify.error({
					title: '错误提示',
					message: `请至少选择一种点位类型`
				});
			}
			const x = Number(this.selectedObj.point.x);
			const y = Number(this.selectedObj.point.y);
			// 给对应mesh的userData添加对应类行的点
			const pointObj = this.currentEditAreaMesh.userData[this.form.pointType]
			const pointCSS2DObject = this.currentEditAreaMesh.children.filter(obj => {
				return obj.pointType === this.form.pointType;
			})
			const propertyName = `point${pointCSS2DObject.length + 1}`;
			pointObj[propertyName] = {
				name: this.pointName,
				value: [x, y]
			};
			if (this.threeMapInstance) {
				this.threeMapInstance.updateAreaPoints(this.currentEditAreaMesh, {
					...this.form,
					pointName: this.pointName,
					propertyName,
					point: [x, y],
				});
			}
			this.closePointDialog();
		},
		// 关闭点信息弹窗
		closePointDialog() {
			this.centerDialogPointVisible = false;
			this.threeMapInstance.cancelAddPoint();
		},
		// 删除点
		delPoint() {
			if (this.pointAreaLabel) {
				const map = {
					lightBeam: "光柱点",
					flyLine: "飞线点",
					columnBar: "柱图点",
					pointLayer: "区块位置点",
				}
				const mesh = this.pointAreaLabel.parent;
				const pointObj = mesh.userData[this.pointAreaLabel.pointType];
				delete pointObj[this.pointAreaLabel.pointName]; // 删除对应的userData里面对应该点数据
				const pointTypeObj = {}
				// 重新为该类行点的数据设置属性
				Object.values(pointObj).forEach((point, i) => {
					point.name = `${map[this.pointAreaLabel.pointType]}${i + 1}`
					pointTypeObj[`point${i + 1}`] = point;
				})
				mesh.userData[this.pointAreaLabel.pointType] = pointTypeObj;

				// 删除对应区域的该类型的所有点的CSS2DObject对像，然后重绘制
				// mesh.remove(this.pointAreaLabel)
				const CSS2DObjectArr = []
				mesh.traverse(obj => {
					if (obj.pointType && obj.pointName && obj.pointType == this.pointAreaLabel.pointType) {
						CSS2DObjectArr.push(obj);
					}
				})
				console.log(CSS2DObjectArr)
				CSS2DObjectArr.forEach(obj => {
					mesh.remove(obj);
				})
				
				// 重新绘制
				Object.entries(mesh.userData[this.pointAreaLabel.pointType]).forEach(data => {
					if (this.threeMapInstance) {
						this.threeMapInstance.updateAreaPoints(mesh, {
							pointType: this.pointAreaLabel.pointType,
							pointName: data[1].name,
							propertyName: data[0],
							point: data[1].value,
						});
					}
				})
				console.log(mesh);
				this.showPointInfoDialog = false;

			}
		},
		// 取消删除点
		cancelDelPoint() {
			this.showPointInfoDialog = false;
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