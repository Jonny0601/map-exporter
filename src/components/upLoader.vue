<!--
 * @Descripttion: 
 * @version: 
 * @Author: JohnnyZou
 * @Date: 2019-12-18 10:25:59
 * @LastEditors  : JohnnyZou
 * @LastEditTime : 2019-12-18 10:30:32
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
			<div class="el-upload__text">将geojson文件拖到此处，或<em>点击上传</em></div>
			<div class="el-upload__tip" slot="tip">只能上传.json、.geojson文件</div>
		</el-upload>
  </div>
</template>

<script>
export default {
	name: "UPLOADERGEO",
	data () {
		return {
			accept: ".json,.geojson"
		}
	},
	methods: {
		handleRemove(file, fileList) {
			return this.fileReaderHandle(file.raw).then(fileJson => {
				this.$emit("removeFile", fileJson, file, fileList);
			}).catch(error => {
				console.log(error.message);
			})
			
		},
		handlePreview(file) {
			return this.fileReaderHandle(file.raw).then(fileJson => {
				this.$emit("filePreview", fileJson)
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
			return this.fileReaderHandle(file.raw).then(fileJson => {
				this.$emit("addFile", fileJson, fileList);
			}).catch(error => {
				this.$notify.error({
					title: '错误',
					message: error.message
				});
			})
		},

		fileReaderHandle(fileRaw) {
			return new Promise((resolve, reject) => {
				const reader = new FileReader(); // 新建一个FileReader
				reader.readAsText(fileRaw, "UTF-8"); // 读取文件 
				reader.onload = (evt) => { //读取完文件之后会回来这里
					const fileString = evt.target.result; // 读取文件内容
					console.log(fileString);
					try{
						resolve(JSON.parse(fileString));
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