/*
 * @Descripttion: 
 * @version: 
 * @Author: JohnnyZou
 * @Date: 2019-12-18 14:27:13
 * @LastEditors  : JohnnyZou
 * @LastEditTime : 2019-12-26 17:03:39
 */
import BaseMap from "./BaseMap"
import * as d3 from "d3-geo";
import { union } from "@turf/turf";
import * as THREE from "three";
import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer";
import d3threeD from "./d3ThreeD";
import { GUI } from "three/examples/jsm/libs/dat.gui.module";
export default class CreateMapFromGeoJson extends BaseMap {
	constructor(set){
        super(set);
        this.initMapProperty();
        this.d3threeD = {};
        d3threeD(this.d3threeD);
	}
	// 初始化属性
	initMapProperty() {
		this.vector3Json = []; // 经过解析转换后的geojson数据
		this.extrudeHeight = 1; // 多边形的挤压高度
		this.areaGroup = new THREE.Group(); // 多边形区域组
		this.mapData = null; // geojson源数据
        this.mapCenter = null; // geojson表示的形状的中心位置
        this.isEdit = false; // 是否处于编辑状态
        this.GUIPanel = null; // 编辑的ui界面
    }
    
    // 绘制区域地图
    drawAreaMap(mapData) {
        this.mapData = mapData;
        console.log(this.mapData, "cccc");
        // 计算整个区域中心
        this.mapCenter = d3.geoCentroid(mapData)
        const shapesArr = this.drawGeoSVG(mapData);
        this.drawExtrudeGeometryMesh(shapesArr);
	}
    /**
     * @name: drawGeoSVG
     * @description: 通过d3-geo的geoMercator 设置转换投影为墨卡托投影转换，
     * 然后通过geoPath方法通过传入设置好的墨卡托投影生成一个svg的路径生成器，
     * 最后遍历geojson，给每个feature生成对应的平面svg路径字符串，然后传递
     * 给d3-threeD工具库，生成每个形状(THREE.Shape)
     * @param {geojson} Object
     * @return: 
     */    
    drawGeoSVG(geojson) {
        const mercator = d3.geoMercator()
            .center(this.mapCenter)
            .translate([0, 0])
            // .fitSize([200, 200], geojson)
        
        const projection = d3.geoPath(mercator);
        const shapesArr = []
        geojson.features.forEach(feature => {
            const path = projection(feature); // svg路径字符串
            console.log(path, "svg path");
            if(path){
                /** 
                 * 这里必要检测 path 是否为null，因为之前使用了自定义缩放，
                 * 在给定的 fitExtent 距离外的 feature 会生成 null
                */
                try {
                    const shapePath = this.d3threeD.transformSVGPath(path);
                    const shapes = shapePath.toShapes(true, false);
                    console.log(shapes);
                    shapesArr.push({
                        shapeDescData: {
                            ...feature.properties,
                            d3Centroid: [...projection.centroid(feature), 0]
                        },
                        shapes
                    })
                } catch(e) {
                    console.error(e.message, "svg路径转three的shape出错");
                }
            }
        })

        return shapesArr;
    }
    /**
     * @name: drawExtrudeGeometry
     * @description: 绘制带高度的几何图形，并组合轮廓线和几何图形
     * @param {shapesArr} 
     * @return: 
     */
    drawExtrudeGeometryMesh(shapesArr) {
        // 遍历每个feature生成的shapes对象
        shapesArr.forEach((item, i) => {
            // 每个shapes里面可能是多个多边形
            item.shapes.forEach(shape => {
                // 绘制带挤压高度的区域mesh
                const areaMesh = this.getAeraMesh(shape, item.shapeDescData);
                // 获取形状所有的点画出轮廓线
                const pointsArr = shape.getPoints();
                const areaLineMesh = this.getAreaLineMesh(pointsArr);
                const areaLineMesh2 = areaLineMesh.clone()
                areaLineMesh2.position.z = this.extrudeHeight;
                areaMesh.add(areaLineMesh);
                areaMesh.add(areaLineMesh2);
                this.areaGroup.add(areaMesh);
            })
        })
        this.scene.add(this.areaGroup);
        this.addEvent(this.areaGroup.children)
    }
	
	/**
     * @name: transformPosition
     * @description: 把经纬度坐标转为三维向量vec3
     * @param {Array} lonLat [lon, lat]
     * @return: [x, y, z]
     */
    transformPosition(lonLat) {
        if (!lonLat) {
            return null;
        }
        const projection = d3.geoMercator()
            .center([this.mapCenter[0], this.mapCenter[1]])
            .scale((this.set.scale || 1.8) * 1000)
            .translate([0, 0]);
        const point = projection(lonLat) || null;
        if (!point) {
            return null;
        }
        return [...point, 0];
	}
	
	// 绘制带高度的区域mesh
    getAeraMesh(shape, property = {}) {
        const extrudeOpts = {
            bevelThickness: 0,
            bevelSize: 0,
            curveSegments: 24,
            steps: 10,
            bevelEnabled: false,
            depth: this.extrudeHeight
        };
        const geometry = new THREE.ExtrudeBufferGeometry(shape, extrudeOpts);
        const material = new THREE.MeshBasicMaterial({
            color: "#3899ee",
            depthTest: true
            // transparent: true,
            // opacity: 0.7,
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.userData = {
            originColor: "#3899ee",
            originHeight: this.extrudeHeight,
			...mesh.userData,
            ...property,
        };
        mesh.rotateX(Math.PI); // 绕x轴翻转 180度；
        // 修改中心点 旋转后的位置
        const [x, y , z] = mesh.userData.d3Centroid;
        const cp = new THREE.Vector3(x, y, z);
        setTimeout(() => {
            const tCp = cp.applyMatrix4(mesh.matrixWorld);
            mesh.userData.d3Centroid = tCp.toArray();
            mesh.originPosition = tCp;
            console.log(mesh.userData.d3Centroid);
             // 添加区域label
            const areaLabel = this.drawText(  
                property.d3Centroid,
                mesh.userData.name || mesh.userData.id || ``
            );
            mesh.add(areaLabel);
        }, 0)
        mesh.receiveShadow = true;
        mesh.castShadow = true;
        console.log(mesh);
        return mesh;
    }

    // 绘制轮廓线条 points: any[]
    getAreaLineMesh(points) {
        console.log(points)
        const material = new THREE.MeshBasicMaterial({
            color: "#fff",
            transparent: true,
            opacity: 0.8,
        });
        const geometry = new THREE.BufferGeometry().setFromPoints(points.map(point => {
            return new THREE.Vector3(point.x, point.y, 0);
        }));
        const line = new THREE.Line(geometry, material);
        return line;
    }
    // 开启编辑，创建GUI
    initGUIPanel(mesh) {
        const [cX, cY, cZ] = mesh.userData.d3Centroid;
        const [oX, oY, oZ] = mesh.originPosition.toArray();
        const color = mesh.userData.originColor;
        const height = mesh.userData.originHeight;
        const setting = {
            color: color,
            areaHeight: height,
            offsetX: cX,
            offsetY: cY,
            offsetZ: cZ,
            addAttributes: () => {
                this.set.addAttributes && this.set.addAttributes(mesh);
            }
        }
        // 创建编辑的UI界面
        this.GUIPanel = new GUI({
            width: 250,
            autoPlace: false
        });
        this.GUIPanel.domElement.style.position = "absolute";
        this.GUIPanel.domElement.style.right = "0";
        this.GUIPanel.domElement.style.top = "0";
        this.GUIPanel.domElement.style.zIndex = "1001";
        // 创建遮罩层
        const maskDiv = document.createElement("div");
        maskDiv.style.position = "absolute";
        maskDiv.style.left = "0";
        maskDiv.style.bottom = "0";
        maskDiv.style.right = "0";
        maskDiv.style.top = "0";
        maskDiv.style.zIndex = "1000";
        maskDiv.style.background = "rgba(0, 0 , 0, 0.5)";
        this.GUIPanel.maskDiv = maskDiv
        maskDiv.addEventListener("click", () => {
            // 退出编辑
            this.isEdit = false;
            if (this.GUIPanel) {
                this.set.root.removeChild(this.GUIPanel.domElement);
                this.set.root.removeChild(this.GUIPanel.maskDiv);
                this.GUIPanel = null;
            }

        }, false);

        this.set.root.appendChild(this.GUIPanel.domElement);
        this.set.root.appendChild(this.GUIPanel.maskDiv);

        this.GUIPanel.add(setting, "addAttributes");
        const folder1 = this.GUIPanel.addFolder("区块样式");
        folder1.addColor(setting, "color").listen().onChange(color => {
            mesh.material.color = new THREE.Color(color);
            mesh.userData.originColor = color;
        });
        folder1.add(setting, "areaHeight", 1, 5, 0.01).listen().onChange(areaHeight => {
            mesh.scale.set(1, 1, areaHeight); // 拉伸Z轴实现立体效果
            mesh.position.z = (areaHeight - this.extrudeHeight);
            mesh.userData.originHeight = areaHeight;
        });

        const folder2 = this.GUIPanel.addFolder("区块中点偏移");
        folder2.add(setting, "offsetX", Math.floor(oX -5), Math.floor(oX + 5), 0.001).listen().onChange(offsetX => {
            mesh.children.forEach(child => {
                if(child instanceof CSS2DObject){
                    child.position.x = offsetX;
                    mesh.userData.d3Centroid[0] = offsetX;
                }
            })
        })
        folder2.add(setting, "offsetY",  Math.floor(oY -5), Math.floor(oY + 5), 0.001).listen().onChange(offsetY => {
            mesh.children.forEach(child => {
                if(child instanceof CSS2DObject){
                    child.position.y = -offsetY;
                    mesh.userData.d3Centroid[1] = offsetY;
                }
            })
            
        });
        folder2.add(setting, "offsetZ",  Math.floor(oZ -5), Math.floor(oZ + 5), 0.001).listen().onChange(offsetZ => {
            mesh.children.forEach(child => {
                if(child instanceof CSS2DObject){
                    child.position.z = -offsetZ;
                    mesh.userData.d3Centroid[2] = offsetZ;
                }
            })
        });
        
        folder1.open()
        folder2.open()
    }
    // 开启编辑模式
    editEvent(editMesh) {
        if (this.isEdit) {
            return;
        }
        this.isEdit = true
        this.initGUIPanel(editMesh)
    }
    
    // 多个多边形的并集
    computedPolygonUnion(geojson) {
        if (geojson instanceof Array) {
            return union(...geojson);
        }
        return union(...geojson.features);
    }
    // 导出并集geojson
	exportPolygonUnion() {
		const unionData = this.computedPolygonUnion(this.mapData);
		const buffer = new Buffer(JSON.stringify(unionData));
		this.saveArrayBuffer(buffer, "polygon.json");
	}
	// 释放场景中所有的内存并移除
	removeAllMesh() {
		this.areaGroup.traverse(obj => {
			if(obj.geometry){
				obj.geometry.dispose();
			}
			if (obj.material) {
				obj.material.dispose();
			}
		})
		this.scene.remove(this.areaGroup);
	}
	// 销毁释放内存
	destory() {
		this.removeAllMesh();
		this.initMapProperty();
		this.labelRenderer.domElement.innerHTML = "";
	}
}