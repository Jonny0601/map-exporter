<!--
 * @Descripttion: 
 * @version: 
 * @Author: JohnnyZou
 * @Date: 2019-12-18 10:25:59
 * @LastEditors: JohnnyZou
 * @LastEditTime: 2020-07-06 11:46:02
 -->
<template>
	<div class="container">
		<el-upload class="upload-demo"
			drag
			ref="upload"
			action=""
			:auto-upload="false"
			:accept="accept"
			:on-preview="handlePreview"
			:on-remove="handleRemove"
			:before-remove="beforeRemove"
			:on-change="handleChange"
		>
			<i class="el-icon-upload"></i>
			<div class="el-upload__text">将geojson或模型文件拖到此处，或<em>点击上传</em></div>
			<div class="el-upload__tip" slot="tip">只能上传.json、.geojson、.gltf、.glb、.svg文件</div>
		</el-upload>
  </div>
</template>

<script>
export default {
	name: "UPLOADERGEO",
	data () {
		return {
			accept: ".json,.geojson,.gltf,.glb,.svg"
		}
	},
	methods: {
		handleRemove(file, fileList) {
			return this.fileReaderHandle(file).then(fileObj => {
				this.$emit("removeFile");
			}).catch(error => {
				console.log(error.message);
			})
			
		},
		handlePreview(file) {
			return this.fileReaderHandle(file).then(fileObj => {
				this.$emit("filePreview", fileObj)
			}).catch(error => {
				this.$notify.error({
					title: '错误',
					message: error.message
				});
			})
		},
		beforeRemove(file, fileList) {
			return this.$confirm(`确定移除 ${ file.name }？`);
		},
		// 文件添加时
		handleChange (file, fileList) {
			console.log(file, fileList);
			return this.fileReaderHandle(file).then(fileObj => {
				this.$emit("addFile", fileObj, fileList);
			}).catch(error => {
				this.$notify.error({
					title: '错误',
					message: error.message
				});
			})
		},

		fileReaderHandle(file) {
			const reader = new FileReader(); // 新建一个FileReader
			return new Promise((resolve, reject) => {
				const extArr = file.name.match(/\.(glb|gltf|svg|json|geojson|geoJson)$/g);
				console.log(extArr);
				let type = "json"
				const ext = extArr ? extArr[0] : null;
				if (!ext) {
					return reject(new Error("未知文件"))
				}
				if (ext === ".json" || ext === ".geojson" || ext === ".geoJson") {  // geojson
					reader.readAsText(file.raw, "UTF-8");
				} else if (ext === "gltf"){
					type = "model"
					reader.readAsText(file.raw, "UTF-8");
				} else if (ext === ".glb") {
					type = "model"
					reader.readAsArrayBuffer(file.raw)
				} else if (ext === ".svg") {
					type = "svg"
					reader.readAsText(file.raw, "UTF-8");
				}
				reader.onload = (evt) => { //读取完文件之后会回来这里
					try{
						const result = {
							content: evt.target.result,
							type,
							name: file.name
						}
						if (ext !== ".glb" && ext !== ".svg") {
							result.content = JSON.parse(result.content);
						}
						resolve(result);
					}catch(e){
						reject(e);
					}
				}
			});
		}

	}
}
</script>

<style lang="less" scoped>
.upload-demo /deep/ .el-upload-list__item-name{
	cursor: pointer;
}
</style>