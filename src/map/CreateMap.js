/*
 * @Descripttion: 
 * @version: 
 * @Author: JohnnyZou
 * @Date: 2019-12-18 14:27:13
 * @LastEditors: JohnnyZou
 * @LastEditTime: 2020-07-07 11:40:23
 */
import BaseMap from "./BaseMap"
import * as d3 from "d3-geo";
import { union, centroid, polygon } from "@turf/turf";
import * as THREE from "three";
import d3threeD from "./d3ThreeD";
import { GUI } from "three/examples/jsm/libs/dat.gui.module";
import { Line2 } from "three/examples/jsm/lines/Line2";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry";
export default class CreateMap extends BaseMap {
	constructor(set){
        super(set);
        this.initMapProperty();
        this.d3threeD = {};
        d3threeD(this.d3threeD);
        if (!this.GUIPanel) {
            this.GUIPanel = new GUI({
                width: 250,
                autoPlace: false
            });
            this.GUIPanel.domElement.style.position = "absolute";
            this.GUIPanel.domElement.style.right = "0";
            this.GUIPanel.domElement.style.top = "0";
            this.GUIPanel.domElement.style.zIndex = "1001";
            this.set.root.appendChild(this.GUIPanel.domElement);
        }
        window.regionMap = this;
	}
	// 初始化属性
	initMapProperty() {
		this.vector3Json = []; // 经过解析转换后的geojson数据
        this.baseExtrudeHeight = 0.5; // 初始多边形的挤压高度
        this.sceneName = "scene"; // 场景名称
        this.baseColor = "#328496"; // 初始多边形颜色
        this.baseLineColor = "#00b4cd";
        this.baseLineWidth = 3;
		this.areaGroup = new THREE.Group(); // 多边形区域组
        this.areaLineGroup = new THREE.Group(); // 多边形区域组
        this.areaLabelGroup = new THREE.Group(); // 文字标记组
        this.areaGroup.userData.baseExtrudeHeight = this.baseExtrudeHeight;
        this.areaGroup.userData.baseLineColor = this.baseLineColor;
        this.areaGroup.userData.baseLineWidth = this.baseLineWidth;
        this.areaGroup.userData.baseColor = this.baseColor;
		this.mapData = null; // geojson源数据
        this.mapCenter = null; // geojson表示的形状的中心位置
        this.isEdit = false; // 是否处于编辑状态
        this.isEditPoint = false; // 是否处于编辑点的状态
        this.maskDiv = null; // 编辑属性是遮罩
    }
    // 删除gui
    destoryGUI() {
        if (this.GUIPanel) {
            this.GUIPanel.destroy();
            if (this.maskDiv) {
                this.set.root.removeChild(this.maskDiv);
                this.maskDiv = null;
            }
        }
    }
    initBaseGUI(currentMesh) {
        this.destoryGUI();
        // 如果不是单体编辑状态，即显示通用配置UI
        if (!this.isEdit) {
            const settings = {
                sceneName: this.sceneName,
                baseExtrudeHeight: this.areaGroup.userData.baseExtrudeHeight,
                baseLineWidth: this.baseLineWidth,
                baseColor: this.baseColor,
                baseLineColor: this.baseLineColor
            }
            const commonFolder = this.GUIPanel.addFolder("统一配置")
            commonFolder.open();
            commonFolder.add(settings, "sceneName").name("场景名称").onChange(sceneName => {
                this.sceneName = sceneName;
            });
            commonFolder.add(settings, "baseExtrudeHeight", 0.1, 100, 0.1).name("区块高度").onChange(baseExtrudeHeight => {
                baseExtrudeHeight = Number(baseExtrudeHeight);
                this.areaGroup.children.forEach((obj) => {
                    obj.scale.set(1, 1, baseExtrudeHeight / this.baseExtrudeHeight); // 拉伸Z轴实现立体效果
                    obj.userData.markCenter[2] = baseExtrudeHeight
                    obj.userData.staticCenter[2] = baseExtrudeHeight
                })
                this.areaLineGroup.children.forEach(obj => {
                    if (obj.type === "Line2") {
                        obj.position.z = baseExtrudeHeight - this.baseExtrudeHeight
                    }
                })
                this.areaLabelGroup.children.forEach(obj => {
                    obj.position.z = baseExtrudeHeight;
                })
            }).onFinishChange(baseExtrudeHeight => {
                this.areaGroup.userData.baseExtrudeHeight = Number(baseExtrudeHeight);
                console.log(this.areaGroup)
            })
            commonFolder.addColor(settings, "baseColor").name("区块颜色").onChange(baseColor => {
                this.areaGroup.children.forEach((obj) => {
                    obj.material.color = new THREE.Color(baseColor);
                    obj.userData.preColor = baseColor;
                })
            }).onFinishChange(baseColor => {
                this.areaGroup.userData.baseColor = baseColor;
            })
    
            commonFolder.add(settings, "baseLineWidth", 1, 100, 1).name("边线宽度").onChange(baseLineWidth => {
                this.areaLineGroup.children.forEach((obj) => {
                    if (obj.type === "Line2") {
                        obj.material.linewidth = Number(baseLineWidth);
                    }
                })
            }).onFinishChange(baseLineWidth => {
                this.areaGroup.userData.baseLineWidth = Number(baseLineWidth);
            })
            commonFolder.addColor(settings, "baseLineColor").name("边线颜色").onChange(baseLineColor => {
                this.areaLineGroup.children.forEach((obj) => {
                    if (obj.type === "Line2") {
                        obj.material.color = new THREE.Color(baseLineColor);
                    }
                })
            }).onFinishChange(baseLineColor => {
                this.areaGroup.userData.baseLineColor = baseLineColor;
            })
        }else if (currentMesh) { // 存在转中的单体，开启单体编辑模式
            // 创建遮罩层
            if (!this.maskDiv) {
                const maskDiv = document.createElement("div");
                maskDiv.style.position = "absolute";
                maskDiv.style.left = "0";
                maskDiv.style.bottom = "0";
                maskDiv.style.right = "0";
                maskDiv.style.top = "0";
                maskDiv.style.zIndex = "1000";
                maskDiv.style.background = "rgba(0, 0 , 0, 0.3)";
                this.maskDiv = maskDiv;
                // 添加一个关闭单体编辑模式的点击事件 
                this.maskDiv.addEventListener("click", (event) => {
                    // 如果当前为单体编辑中的点编辑状态
                    if (this.isEditPoint) {
                        const vector = new THREE.Vector3();//三维坐标对象
                        const mainCanvas = this.renderer.domElement;
                        const {left, top} = mainCanvas.getBoundingClientRect();
                        vector.x = ((event.clientX - left) / mainCanvas.offsetWidth) * 2 - 1;
                        vector.y = -((event.clientY - top) / mainCanvas.offsetHeight) * 2 + 1;
                        vector.z = this.type === "model" ? -this.baseExtrudeHeight : this.baseExtrudeHeight;
                        vector.unproject( this.camera );
                        const raycaster = new THREE.Raycaster(this.camera.position, vector.sub(this.camera.position).normalize());
                        const intersects = raycaster.intersectObjects([currentMesh]);
                        console.log(currentMesh)
                        console.log(intersects)
                        const selected = intersects[0]; //取第一个物体
                        this.set.addAttributePointHandle(selected, currentMesh);
                    } else {
                        // 退出编辑
                        this.isEdit = false;
                        this.isEditPoint = false;
                        this.initBaseGUI()
                    }
                }, false);
            }
            this.set.root.appendChild(this.maskDiv);
            const [cX, cY, cZ] = currentMesh.userData.markCenter;
            const preColor = currentMesh.userData.preColor;
            const settings = {
                color: preColor,
                offsetX: cX,
                offsetY: cY,
                offsetZ: cZ,
                addAttributesHandle: () => {
                    if (this.isEditPoint) {
                        return;
                    }
                    this.set.addAttributesHandle && this.set.addAttributesHandle(currentMesh);
                },
                addPoint: () => {
                    this.set.root.style.cursor = "crosshair";
                    this.isEditPoint = true; // 开启点编辑模式
                },
            }
            const preFolder = this.GUIPanel.addFolder("单个配置");
            preFolder.open();
            preFolder.addColor(settings, "color").name("颜色").onChange(color => {
                currentMesh.material.color = new THREE.Color(color)
                currentMesh.userData.preColor = color;
            })
            preFolder.add(settings, "offsetX", cX - 10, cX + 10, 0.01).name("x轴偏移").onChange(offsetX => {
                this.areaLabelGroup.children.forEach(obj => {
                    if (currentMesh.uuid === obj.userData.uuid) {
                        obj.position.x = offsetX;
                        currentMesh.userData.markCenter[0] = offsetX;
                    }
                })
            })
            preFolder.add(settings, "offsetY", cY - 10, cY + 10, 0.01).name("y轴偏移").onChange(offsetY => {
                this.areaLabelGroup.children.forEach(obj => {
                    if (currentMesh.uuid === obj.userData.uuid) {
                        obj.position.y = offsetY;
                        currentMesh.userData.markCenter[1] = offsetY;
                    }
                })
            })
            preFolder.add(settings, "offsetZ", cZ - 10, cZ + 10, 0.01).name("z轴偏移").onChange(offsetZ => {
                this.areaLabelGroup.children.forEach(obj => {
                    if (currentMesh.uuid === obj.userData.uuid) {
                        obj.position.z = offsetZ;
                        currentMesh.userData.markCenter[2] = offsetZ;
                        currentMesh.userData.staticCenter[2] = offsetZ;
                    }
                })
            })
            preFolder.add(settings, "addAttributesHandle").name("编辑属性(点我)");
            preFolder.add(settings, "addPoint").name("添加位置点(点我)");
        }
    }
    // 由于d3-geo转换后的y轴是相对于屏幕是反的，因此需要对转换后的点做一下y轴取反处理
    transformYAxis(pointsArr) {
        return pointsArr.map(p => {
            return new THREE.Vector2(p.x, -p.y);
        })
    }

    // 更新区域的name text
    updateAreaText(currentMesh) {
        this.areaLabelGroup.children.forEach(obj => {
            if (currentMesh.uuid === obj.userData.uuid) {
                currentMesh.name = currentMesh.userData.name;
                obj.element.innerHTML = currentMesh.userData.name;
            }
        })
    }
    // 取消添加点
    cancelAddPoint() {
        this.isEditPoint = false;
        this.set.root.style.cursor = "auto";
    }
    // 更新区域的图层点位置
    updateAreaPoints(currentMesh, pointObj) {
        const { point, pointName, pointType } = pointObj
        let bgColor = "#000";
        if (pointType === "lightBeam") { // 光柱黄色点
            bgColor = "yellow";
        } else if (pointType === "columnBar"){ // 柱图蓝色点
            bgColor = "blue";
        } else if (pointType === "flyLine") { // 飞线粉色点
            bgColor = "pink"
        } else { // 区块位置点 绿色
            bgColor = "green"; 
        }
        const divEl = document.createElement("div");
        divEl.style.cursor = "pointer";
        divEl.innerHTML = `
            <div style="display: flex;flex-direction: column;align-items: center;">
                <div>${pointName}</div>
                <div style="background:${bgColor}; width:10px; height:10px; border-radius:50%;"></div>
            </div>
        `;
        const areaLabel = this.drawText(
            [...point, this.baseExtrudeHeight],
            divEl
        );
        divEl.addEventListener("click", e => {
            this.set.showPointInfoHandle(areaLabel);
        }, false)
        areaLabel.pointType = pointType;
        areaLabel.pointName = pointObj.propertyName;
        currentMesh.add(areaLabel);
    }
    // 绘制区域地图
    drawAreaMap(mapData, type) {
        this.type = type;
        if (type === "json") {
            const polygonUnion = this.computedPolygonUnion(mapData)
            // 计算整个区域中心
            try{
                this.mapCenter = centroid(polygonUnion).geometry.coordinates;
            }catch(e){
                this.mapCenter = d3.geoCentroid(mapData)
            }
            this.mapData = mapData;
            console.log(this.mapData, "geojson");
            console.log(this.mapCenter, "polygonUnion center");
            const shapesArr = this.drawGeoSVG(mapData);
            this.drawExtrudeGeometryMesh(shapesArr);
            if(polygonUnion){
                const shapesArr = this.drawGeoSVG(polygonUnion);
                const {mesh, shape} = this.drawPolygonUnion(shapesArr[0].shapes);
                this.areaGroup.userData.polygonUnionShape = shape;
                this.scene.add(mesh);
            }
        } else if (type === "model") {
            //...
            this.sceneName = mapData.fileName.split(".")[0];
            const scene = mapData.scene;
            const [areaGroup, camera] = scene.children;
            this.baseExtrudeHeight = areaGroup.userData.baseExtrudeHeight; // 初始多边形的挤压高度
            this.baseColor = areaGroup.userData.baseColor; // 初始多边形颜色
            this.baseLineColor = areaGroup.userData.baseLineColor;
            this.baseLineWidth = areaGroup.userData.baseLineWidth;
            this.camera.copy(camera);
            this.areaGroup.userData = areaGroup.userData;
            areaGroup.children.forEach(mesh => {
                const {shape: shapeJSON} = mesh.geometry.userData;
                const shape = new THREE.Shape().fromJSON(shapeJSON);
                const points = shape.getPoints();
                const newMesh = this.getAeraMesh(shape, mesh.userData, "model")
                this.areaLineGroup.add(this.getAreaLineMesh((points)))
                const {columnBar, flyLine, lightBeam, pointLayer} = mesh.userData; 
                const pointTypeMap = [
                    {pointType: "columnBar", val: columnBar},
                    {pointType: "flyLine", val: flyLine},
                    {pointType: "lightBeam", val: lightBeam},
                    {pointType: "pointLayer", val: pointLayer}
                ]
                for (const layerPoint of pointTypeMap) {
                    for (const [key, val] of Object.entries(layerPoint.val)) {
                        this.updateAreaPoints(newMesh, {
                            pointType: layerPoint.pointType,
                            pointName: val.name,
                            propertyName: key,
                            point: val.value,
                        })
                    }
                }
                this.areaGroup.add(newMesh);
            })

        }else if (type === "svg") {
            let shapesArr = []
            const center = new THREE.Vector3();
            for (const shapePath of mapData.paths) {
                shapesArr = shapesArr.concat(shapePath.toShapes(true))
            }
            const shapeGeometry = new THREE.ShapeGeometry(shapesArr); 
            shapeGeometry.computeBoundingBox();
            center.copy(shapeGeometry.boundingBox.center());

            const plgArr = [];
            shapesArr = shapesArr.map((shape, i) => {
                const points = shape.getPoints();
                for (const point of points) {
                    point.sub(center);
                    point.multiplyScalar(0.05);
                }
                const tShape = new THREE.Shape().setFromPoints(points);
                const tPoints = points.map(p => {
                    const [x, y] = p.toArray();
                    return [x, -y];
                });
                if (tPoints[0] !== tPoints[tPoints.length - 1]) {
                    tPoints[tPoints.length] = tPoints[0];
                }
                plgArr.push(polygon([tPoints]))
                return {
                    shapes: [tShape],
                    shapeDescData: {
                        tid: `tid${i + 1}`,
                    },
                }
            })
            this.drawExtrudeGeometryMesh(shapesArr)

            // 生成区块并集区域
            const unionPlg = union(...plgArr);
            console.log(unionPlg);
            let coordinatesArr = []
            for (let coordinates of unionPlg.geometry.coordinates) {
                coordinates = coordinates.map(p => new THREE.Vector3().fromArray([...p, 0]));
                coordinatesArr = coordinatesArr.concat(coordinates)
            }
            console.log(coordinatesArr);
            const unionShape = new THREE.Shape().setFromPoints(coordinatesArr);
            this.areaGroup.userData.polygonUnionShape = unionShape;
        }
        console.log(this.areaGroup);
        this.scene.add(this.areaGroup);
        this.scene.add(this.areaLineGroup);
        this.scene.add(this.areaLabelGroup);
        this.addEvent(this.areaGroup.children);
        this.getDistanceFromCamera(this.areaGroup, (far) => {
            this.areaGroup.userData.cameraFar = far;
        });
        this.initBaseGUI();
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
            .scale(1500)
            .translate([0, 0])
            // .fitSize([200, 200], geojson)
        const path = d3.geoPath(mercator);
        const shapesArr = []
        const parsePath = (feature, i) => {
            const pathStr = path(feature); // svg路径字符串
            if(pathStr){
                /** 
                 * 这里必要检测 path 是否为null，因为之前使用了自定义缩放，
                 * 在给定的 fitExtent 距离外的 feature 会生成 null
                */
                try {
                    const shapePath = this.d3threeD.transformSVGPath(pathStr);
                    const shapes = shapePath.toShapes(true, false);
                    shapesArr.push({
                        shapeDescData: {
                            ...feature.properties,
                            // d3Centroid: [...path.centroid(feature), 0]
                            tid: `tid${i + 1}`,
                        },
                        shapes
                    })
                } catch(e) {
                    console.error(e.message, "svg路径转three的shape出错");
                }
            }
        }
        if (geojson.type === "Feature") {
            parsePath(geojson);
        }else{
            geojson.features.forEach(parsePath)
        }

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
                const pointsArr = shape.getPoints();  // Vec2[]
                const areaLineMesh = this.getAreaLineMesh(this.transformYAxis(pointsArr));
                this.areaLineGroup.add(areaLineMesh);
                this.areaGroup.add(areaMesh);
            })
        })
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
    getAeraMesh(shape, property = {}, type) {
        const extrudeOpts = {
            bevelThickness: 0,
            bevelSize: 0,
            curveSegments: 24,
            steps: 10,
            bevelEnabled: false,
            depth: this.baseExtrudeHeight
        };
        let newShape =  new THREE.Shape().setFromPoints(this.transformYAxis(shape.getPoints()))
        if (type === "model") {
            newShape = shape;
        }
        const geometry = new THREE.ExtrudeBufferGeometry(newShape, extrudeOpts);
        geometry.userData.shape = newShape;
        const material = new THREE.MeshBasicMaterial({
            color: this.baseColor,
            depthTest: true
            // transparent: true,
            // opacity: 0.7,
        });
        geometry.computeBoundingBox();
        geometry.computeBoundingSphere();
        const center = geometry.boundingSphere.center;
        const mesh = new THREE.Mesh(geometry, material);
        mesh.userData = {
            preColor: this.baseColor,
            markCenter: [center.x, center.y, this.baseExtrudeHeight],
            staticCenter: [center.x, center.y, this.baseExtrudeHeight],
            lightBeam: {},
            flyLine: {},
            columnBar: {},
            pointLayer: {},
            name: `mark`,
            ...property,
        };
        const areaLabel = this.drawLabel(mesh);
        this.areaLabelGroup.add(areaLabel);
        // const helper = new THREE.Box3Helper(mesh.geometry.boundingBox, 0xffff00);
        // console.log(helper)
        // this.scene.add( helper );
        mesh.name = mesh.userData.name;
        return mesh;
    }
    drawLabel(mesh) {
        const [x, y, z] = mesh.userData.markCenter; 
        const html = `
            <div style="display: flex;align-items: center;">
                <p style="width: 12px;height: 12px; background: #fff;border-radius: 50%"></p>
                <p style="margin-left: 5px;">${mesh.userData.name || mesh.userData.id || ""}</p>
            </div>
        `
        const areaLabel = this.drawText(  
            [x, y, z],
            html
        );
        areaLabel.userData.uuid = mesh.uuid;
        return areaLabel;
    }
    // 绘制轮廓线条 points: vec2[]
    getAreaLineMesh(points) {
        const color = new THREE.Color();
        const positions = [];
        const colors = [];
        points.forEach((p, i) => {
            positions.push(p.x, p.y, this.areaGroup.userData.baseExtrudeHeight);
            color.setHSL(i / points.length, 1.0, 0.5);
            colors.push(color.r, color.g, color.b);
        })
        const geometry = new LineGeometry();
        geometry.setPositions(positions);
        geometry.setColors(colors);
        const matLine = new LineMaterial({
            color: this.areaGroup.userData.baseLineColor,
            linewidth: this.areaGroup.userData.baseLineWidth, // in pixels
            // vertexColors: THREE.VertexColors,
            //resolution:  // to be set by renderer, eventually
            dashed: false
        });
        matLine.resolution.set(this.set.renderWidth, this.set.renderHeight);
        const line = new Line2( geometry, matLine);
        line.renderOrder = 399;
        line.onBeforeRender = (renderer) => {
            renderer.clearDepth();
        };
        return line;
    }
    // 开启编辑模式
    editEvent(editMesh) {
        if (this.isEdit) {
            return;
        }
        this.isEdit = true
        this.initBaseGUI(editMesh)
    }
    // 绘制并集多边形（总轮廓）
    drawPolygonUnion(shapes) {
        const pointsArr = this.transformYAxis(shapes[0].getPoints())
        const shape = new THREE.Shape().setFromPoints(pointsArr);
        const ShapeGeometry = new THREE.ShapeGeometry(shape);
        const material = new THREE.MeshBasicMaterial({
            color: "#fff",
            transparent: true,
            opacity: 0,
            side: THREE.DoubleSide,
        });
        let mesh = new THREE.Mesh(ShapeGeometry, material);
        return {mesh, shape};
    }
    // 多个多边形的并集
    computedPolygonUnion(geojson) {
        try {
            if (geojson instanceof Array) {
                return union(...geojson);
            }
            return union(...geojson.features);
            
        } catch (error) {
            return null;
        }
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
		this.areaLineGroup.traverse(obj => {
			if(obj.geometry){
				obj.geometry.dispose();
			}
			if (obj.material) {
				obj.material.dispose();
			}
        })
        this.scene.remove(this.areaLabelGroup);
        this.scene.remove(this.areaLineGroup);
        this.scene.remove(this.areaGroup);
	}
	// 销毁释放内存
	destory() {
		this.removeAllMesh();
		this.initMapProperty();
		this.labelRenderer.domElement.innerHTML = "";
    }
}