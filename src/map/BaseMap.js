/*
 * @Descripttion: 
 * @version: 
 * @Author: JohnnyZou
 * @Date: 2019-12-18 13:54:24
 * @LastEditors  : JohnnyZou
 * @LastEditTime : 2020-02-19 10:04:16
 */
import * as THREE from "three";
import Stats from "three/examples/jsm/libs/stats.module.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { CSS2DObject, CSS2DRenderer } from "three/examples/jsm/renderers/CSS2DRenderer";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter";
window.THREE = THREE;
export default class BaseMap {
	constructor(set){
		this.set = set;
		this.init();
	}
	init() {
		this.sceneUpdateArr = [];
		this.mousePosition = new THREE.Vector2(); // 二维坐标 THREE.Vector2类型
		this.eventAreaObjects = null; // 与射线相交的物体集合
		this.raycaster = new THREE.Raycaster(); // 光线投射实例
		this.raycaster2 = new THREE.Raycaster(); // 光线投射实例
		this.INTERSECTED = null; // 当前鼠标经过光线投射拾取到的区域mesh
		this.link = this.createLink();
		this.gltfLoader = new GLTFLoader();
		this.scene = new THREE.Scene();
		this.renderer = new THREE.WebGLRenderer({
				antialias: true, // 开启抗锯齿
				alpha: true,
		});
		this.renderer.setClearColor("#232937", 1); // 设置背景颜色
		this.renderer.setPixelRatio(window.devicePixelRatio);
		this.renderer.setSize(this.set.renderWidth, this.set.renderHeight);
		this.set.root.appendChild(this.renderer.domElement);
		
		this.labelRenderer = new CSS2DRenderer();
		this.labelRenderer.setSize(this.set.renderWidth, this.set.renderHeight);
		this.labelRenderer.domElement.style.position = "absolute";
		this.labelRenderer.domElement.style.top = "0";
		this.labelRenderer.domElement.style.color = "#fff";
		this.set.root.appendChild(this.labelRenderer.domElement);

		// 创建材质加载器
		this.textureLoader = new THREE.TextureLoader();

		// 设置相机
		this.camera = this.setCamera({x: 0, y: -50 , z: 100 });
		this.scene.add(this.camera);

		// 设置坐标轴helper
		this.axesHelper = this.setHelper(100);
		this.scene.add(this.axesHelper);

		// 设置环境光
		this.ambientLight = this.setLight("#fff");
		this.scene.add(this.ambientLight);

		// 控制器
		this.orbitControls = this.setControl(this.camera, this.labelRenderer.domElement);
		this.sceneUpdateArr.push(this.orbitControls); // 推入实时更新队列

		if (this.set.isStatsWatch) {
			this.statsInstance = this.statsWatch();
			this.sceneUpdateArr.push(this.statsInstance);
		}
		// 设置动画
		this.animate();
		// 设置编辑事件
		window.addEventListener( "keyup", this.keyUpHandle.bind(this), false );
	}
	keyUpHandle(evt) {
		if (this.INTERSECTED && evt.keyCode === 81) {
			// this.set.edit && this.set.edit(this.INTERSECTED);
			console.log(this.INTERSECTED.userData.name)
			this.editEvent && this.editEvent(this.INTERSECTED);
		}
	}
    // 添加事件
    addEvent(eventAreaObjects) {
		this.eventAreaObjects = eventAreaObjects;
		this.labelRenderer.domElement.addEventListener( "mousemove", this.mouseMoveHandle, false);
    }
	// 鼠标移动事件
	mouseMoveHandle = (event) => {
		// 将鼠标位置归一化为设备坐标。x 和 y 方向的取值范围是 (-1 to +1)
		const mainCanvas = this.renderer.domElement;
		const {left, top} = mainCanvas.getBoundingClientRect();
		this.mousePosition.x = ((event.clientX - left) / mainCanvas.offsetWidth) * 2 - 1;
		this.mousePosition.y = -((event.clientY - top) / mainCanvas.offsetHeight) * 2 + 1;

		this.raycaster.setFromCamera(this.mousePosition, this.camera);
		// 计算物体和射线的焦点
		const intersects = this.raycaster.intersectObjects(this.eventAreaObjects);
		if (intersects.length > 0) {
			if (this.INTERSECTED !== intersects[0].object) {
				if (this.INTERSECTED) {
					this.INTERSECTED.material.color.set(this.INTERSECTED.userData.preColor);
				}
				this.INTERSECTED = intersects[0].object;
				this.INTERSECTED.material.color.setHex( 0xff0000 );
			}
		} else {
			if (this.INTERSECTED) {
				this.INTERSECTED.material.color.set(this.INTERSECTED.userData.preColor);
			}
			this.INTERSECTED = null;
		}
	}
	// 实时获取相和网格模型的距离
	getDistanceFromCamera(areaGroup, cb) {
		const vec2 = new THREE.Vector2(0, 0);
		const box3 = new THREE.Box3().expandByObject(areaGroup);
		// const helper = new THREE.Box3Helper( box3, 0xffff00 );
		// this.scene.add( helper );
		this.raycaster2._customId = "raycaster2";
		this.raycaster2.update = () => {
			// console.log(this.sceneUpdateArr);
			this.raycaster.setFromCamera(vec2, this.camera);
			// 计算物体和射线的焦点
			const intersects = this.raycaster.intersectObjects(areaGroup.children);
			if (intersects[0]) {
				this.camera.far = intersects[0].distance + Math.max(box3.max.x - box3.min.x, box3.max.y - box3.min.y) + 100;
				this.camera.updateProjectionMatrix();
				// console.log(this.camera.far);
				cb && cb(intersects[0].distance);
			}
		};
		const raycaster2 = this.sceneUpdateArr.find(obj => (obj._customId && obj._customId === "raycaster2"));
		if (!raycaster2) {
			this.sceneUpdateArr.push(this.raycaster2);
		}
	}
	createLink (){
		const a = document.createElement("a"); // 用于导出gltf的a标签
		a.style.display = "none";
		document.body.appendChild(a); // Firefox workaround, see #6594
		return a;
	}
	setCamera(cameraPosition) {
		const camera = new THREE.PerspectiveCamera(30, this.set.renderWidth / this.set.renderHeight, 0.1, 20000);
		camera.up.x = 0;
		camera.up.y = 0;
		camera.up.z = 1;
		const { x, y, z } = cameraPosition;
		camera.position.set(x, y , z);
		camera.lookAt(0, 0, 0);
		return camera;
	}
	// 设置辅助坐标轴
	setHelper(length) {
		const axesHelper = new THREE.AxesHelper(length);
		return axesHelper;
	}
	// 设置环境光
	setLight(color) {
		const light = new THREE.AmbientLight(color); // soft white light
		return light;
	}
	// 设置控制器
	setControl(camera, domElement) {
		const controls = new OrbitControls(camera, domElement);
		controls.update();
		return controls;
	}

	// 性能监测
	statsWatch() {
		const statsInstance =  new Stats();
		this.set.root.appendChild(statsInstance.dom);
		return statsInstance;
	}
	// 帧循环
	animate() {
		requestAnimationFrame(this.animate.bind(this));
		this.renderer.render(this.scene, this.camera);
		this.labelRenderer.render(this.scene, this.camera);
		this.sceneUpdateArr.forEach((scenePart) => {
			scenePart.update();
		});
	}
	// 绘制label文字
	drawText(position, html) {
		const areaDiv = document.createElement("div");
		areaDiv.style.fontSize = "12px";
		areaDiv.className = "label";
		if (typeof html === "string") {
			areaDiv.innerHTML = html;
		} else if (html instanceof HTMLElement) {
			areaDiv.appendChild(html);
		}
		const areaLabel = new CSS2DObject(areaDiv);
		const [x, y, z] = position;
		areaLabel.position.set(x, y, z);
		return areaLabel;
	}
	// 导出场景为gltf
	exportGLTF(input) {
		const gltfExporter = new GLTFExporter();
		const options = {
			trs: false,
			onlyVisible: true,
			truncateDrawRange: true,
			binary: true,
			forceIndices: false,
			forcePowerOfTwoTextures: false,
			maxTextureSize: 4096,
		};
		gltfExporter.parse(input, ( result ) => {
			if ( result instanceof ArrayBuffer ) {
					this.saveArrayBuffer(result, `${this.sceneName}.glb`);
			} else {
					const output = JSON.stringify( result, null, 2 );
					this.saveString(output, `${this.sceneName}.gltf`);
			}
		}, options );
	}
	saveArrayBuffer(buffer, filename) {
		this.save( new Blob( [ buffer ], { type: "application/octet-stream" } ), filename );
	}
	saveString( text, filename ) {
		this.save( new Blob( [ text ], { type: "text/plain" } ), filename );
	}
	save(blob, filename) {
		this.link.href = URL.createObjectURL( blob );
		this.link.download = filename;
		this.link.click();
		// URL.revokeObjectURL( url ); breaks Firefox...
	}
	// 导入gltf场景
	importGLTF(url) {
		return new Promise((resolve, reject) => {
			this.gltfLoader.load(
				url,
				(gltf) => {
					this.scene.add(gltf.scene);
					resolve(gltf);
				},
				(xhr) => {
					if (xhr) {
						const byteLength = xhr.total;
						const output = byteLength ? `${xhr.loaded / byteLength * 100} + % loaded` : `${xhr.loaded} byte loaded`;
						console.log(output);
					}
				},
				(error) => {
					reject(error);
				}
			);
		});
	}
}