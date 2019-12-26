<!--
 * @Descripttion: 
 * @version: 
 * @Author: JohnnyZou
 * @Date: 2019-12-18 13:32:57
 * @LastEditors  : JohnnyZou
 * @LastEditTime : 2019-12-26 15:07:13
 -->
<template>
	<div class="main">
		<el-row>
			<el-col :span="18">
				<three-map ref="threeMap"/>
			</el-col>
			<el-col :span="6">
				<el-container direction="vertical" class="upLoader_container">
					<up-loader @addFile="addFileHandle" @removeFile="removeFileHandle" @filePreview="filePreviewHandle"/>
				</el-container>
				<el-container direction="vertical" class="exprot_container">
					<el-button type="primary" class="primaryBtn" @click="exportScene">导出场景</el-button>
					<el-button type="primary" class="primaryBtn" @click="exportAreaUnion">导出区域并集json</el-button>
				</el-container>
			</el-col>
		</el-row>
	</div>
</template>

<script>
import ThreeMap from "../components/threeMap";
import UpLoader from "../components/upLoader";
import * as THREE from "three";
export default {
	data () {
		return {

		}
	},
	components: {
		ThreeMap,
		UpLoader
	},
	methods: {
		// 文件添加触发
		addFileHandle(fileJson, fileList) {
			this.removeFileHandle(fileJson, fileList);
			if(fileJson.type === "Feature") {
				fileJson = {
					type: "FeatureCollection",
					features: [fileJson]
				}
			}
			let canRender = true;
			fileJson.features.forEach(feature => {
				if(feature.geometry.type !== "MultiPolygon" && feature.geometry.type !== "Polygon"){
					canRender = false
				}
			});
			if (!canRender) {
				return this.$notify.error({
					title: '错误',
					message: "当前只支持MultiPolygon和Polygon类型的geojson编辑，点线暂未支持"
				});
			}
			if (this.$refs.threeMap.threeMapInstance) {
				this.$refs.threeMap.threeMapInstance.drawAreaMap(fileJson);
			}
		},
		// 文件移除触发
		removeFileHandle(fileJson, fileList) {
			if (this.$refs.threeMap.threeMapInstance) {
				const threeMapInstance = this.$refs.threeMap.threeMapInstance;
				threeMapInstance.destory();
			}
		},
		// 文件预览触发
		filePreviewHandle(fileJson) {
			this.removeFileHandle();
			this.addFileHandle(fileJson)
		},
		// 导出场景
		exportScene() {
			if (this.$refs.threeMap.threeMapInstance) {
				const threeMapInstance = this.$refs.threeMap.threeMapInstance;
				console.log(threeMapInstance.scene);
				console.log(threeMapInstance.camera);
				// 整正区域中心点经过旋转后的位置
				// const areaGroup = threeMapInstance.areaGroup.clone();
				// debugger
				// areaGroup.children.forEach((obj) => {
				// 	if (obj.type === "Mesh") {
				// 		const [x, y, z] = obj.userData.d3Centroid;
				// 		const p = new THREE.Vector3(x, y, z);
				// 		obj.userData.d3Centroid = p.applyMatrix4(areaGroup.matrixWorld).toArray();
				// 	}
				// });
				// console.log(threeMapInstance.areaGroup);
				// return 
				threeMapInstance.exportGLTF([threeMapInstance.areaGroup, threeMapInstance.camera]);
			}
		},
		// 导出区域并集geojson
		exportAreaUnion() {
			if (this.$refs.threeMap.threeMapInstance) {
				const threeMapInstance = this.$refs.threeMap.threeMapInstance;
				if (!threeMapInstance.mapData) {
					return this.$notify.error({
						title: '错误',
						message: "没有任何数据信息"
					});
				}
				threeMapInstance.exportPolygonUnion();
			}
		}
	},
	mounted() {

	}
}
</script>

<style lang="less" scoped>
.main{
	width: 100%;
	overflow: hidden;
	.el-container{
		text-align: center;
		&.upLoader_container{
			padding-top: 10%;
		}
		&.exprot_container{
			margin-top: 20%;
			align-items: center;
			.primaryBtn{
				width: 70%;
				margin: 0;
				margin-bottom: 10%;
			}
		}
	}
}
</style>