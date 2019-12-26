let camera;
let scene;
let renderer;
let raycaster;
let selectedObject;
let label;

let minExtrude = 30,
    maxExtrude = 80;

let fitExtent = 200;
let group = new THREE.Group();

const highLightColor = new THREE.Color(0xf0c9cf);
let _d3threeD = {};
d3threeD(_d3threeD);
transformSVGPath = _d3threeD.transformSVGPath;

function getPosMat(x, y, z) {
    let posMat = new THREE.Matrix4();
    posMat.set(1, 0, 0, x, 0, -1, 0, y, 0, 0, -1, z, 0, 0, 0, 1);
    return posMat;
}

function getPoint2ScreenCoord(target) {
    let mat = new THREE.Matrix4();
    let wHeight = window.innerHeight;
    let wWidth = window.innerWidth;
    mat.set(wWidth / 2, 0, 0, wWidth / 2, 0, -wHeight / 2, 0, wHeight / 2, 0, 0, 1, 0, 0, 0, 0, 1);

    let centroid = target.userData.centroid;
    let pos = target.localToWorld(new THREE.Vector3(centroid[0], centroid[1], 0));
    let { x, y } = pos.project(camera).applyMatrix4(mat);

    label.style.left = x + 'px';
    label.style.top = y + 'px';
    label.style.opacity = 1;
    label.textContent = selectedObject.userData.name;
}

function drawGeoSVG(geojson) {
    let mercator = d3
        .geoMercator()
        .rotate([-150, 0, 0])
        .fitSize([fitExtent, fitExtent], geojson)
        .precision(0.6);

    let projection = d3.geoPath(mercator);

    let shapes = [];
    geojson.features.forEach(feature => {
        let path = projection(feature);

        if (path) {
            try {
                let _path = transformSVGPath(path);
                let _shapes = _path.toShapes(true, false);
                shapes.push({
                    data: Object.assign(feature.properties, {
                        centroid: projection.centroid(feature)
                    }),
                    _shapes
                });
            } catch (e) {
                console.log(e);
            }
        }
    });
    return shapes;
}

function drawProvince(shapes, outlines) {
    let extrudeOpts = {
        bevelThickness: 0,
        bevelSize: 0,
        curveSegments: 24,
        steps: 10
    };

    let posMat = getPosMat(-fitExtent / 2, fitExtent / 2, 0);

    shapes.forEach((item, i) => {
        let geometry = new THREE.Geometry();
        item._shapes.forEach(shape => {
            let extrude = new THREE.ExtrudeGeometry(
                shape,
                Object.assign(
                    {
                        depth: 1
                    },
                    extrudeOpts
                )
            );
            geometry.merge(extrude);
        });

        let mesh = new THREE.Mesh(geometry, new THREE.MeshNormalMaterial({}));
        mesh.add(outlines[i]);

        let scaleZ = minExtrude;
        mesh.scale.set(1, 1, scaleZ);
        mesh.position.z = -scaleZ;
        outlines[i].position.z = -1 / scaleZ;
        mesh.userData = item.data;

        group.add(mesh);
    });

    group.applyMatrix(posMat);
    scene.add(group);
}

function drawOutlines(shapes) {
    let outlines = [];
    shapes.forEach(item => {
        let lines = new THREE.Group();
        lines.userData.name = 'Administrative Lines';
        item._shapes.forEach(shape => {
            let pts = shape.getPoints();
            let line = new THREE.Line(
                new THREE.Geometry(),
                new THREE.LineBasicMaterial({
                    color: highLightColor,
                    opacity: 0.5
                })
            );
            pts.forEach(pt => {
                line.geometry.vertices.push(new THREE.Vector3(pt.x, pt.y, 0));
                line.geometry.colors.push(highLightColor);
            });
            lines.add(line);
        });
        outlines.push(lines);
    });

    return outlines;
}

function drawGeoMap() {
    let shapes = drawGeoSVG(geojson);
    let outlines = drawOutlines(shapes);
    drawProvince(shapes, outlines);
}

function init() {
    let stats = initStats();

    scene = new THREE.Scene();
    scene.background = highLightColor;
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);

    renderer = new THREE.WebGLRenderer({
    antialias : true
  });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMapEnabled = true;

    // let axesHelper = new THREE.AxesHelper(150);
    // scene.add(axesHelper);

    camera.position.x = 50;
    camera.position.y = -50;
    camera.position.z = 300;
    camera.lookAt(scene.position);

    let ambientLight = new THREE.AmbientLight(highLightColor);
    scene.add(ambientLight);

    let spotLight = new THREE.SpotLight(0xffffff);
    spotLight.position.set(0, 0, 500);
    spotLight.castShadow = true;
    scene.add(spotLight);

    label = document.getElementById('map-label');
    let mapDom = document.getElementById('map-wrapper');
    mapDom.appendChild(renderer.domElement);

    mapDom.addEventListener('mousemove', handleRayCastClick);
    mapDom.addEventListener('click', clearSelectedEffect);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.screenSpacePanning = false;
    controls.minDistance = 10;
    controls.maxDistance = 1000;

    raycaster = new THREE.Raycaster();

    drawGeoMap();

    render();

    function render() {
        stats.update();
        requestAnimationFrame(render);
        renderer.render(scene, camera);
    }

    function initStats() {
        let stats = new Stats();

        stats.setMode(0); // 0: fps, 1: ms
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.right = '0px';
        stats.domElement.style.top = '0px';

        document.getElementById('stats-output').appendChild(stats.domElement);

        return stats;
    }
}

function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
function getIntersects(x, y) {
    let mouseVector = new THREE.Vector3();
    x = (x / window.innerWidth) * 2 - 1;
    y = -(y / window.innerHeight) * 2 + 1;
    mouseVector.set(x, y, 0.5);
    raycaster.setFromCamera(mouseVector, camera);
    return raycaster.intersectObject(group, true);
}

function handleRayCastClick(event) {
    event.preventDefault();

    var intersects = getIntersects(event.clientX, event.clientY);
    if (intersects.length > 0) {
        var res = intersects.filter(function(res) {
            return res && res.object;
        })[0];
        if (res && res.object && res.object.type != 'Line') {
            if (selectedObject && selectedObject.type != 'Line') {
                clearSelectedEffect(res.object);
            }
            try {
                selectedObject = res.object;
                getPoint2ScreenCoord(selectedObject);

                selectedObject.material = new THREE.MeshPhongMaterial({
                    color: highLightColor
                });

                changeGroupHeight(selectedObject, Math.random() * (maxExtrude - minExtrude) + minExtrude);
            } catch (e) {
                console.log(res);
            }
        }
    }
}

window.onload = init;
window.addEventListener('resize', onResize, false);

function clearSelectedEffect(target) {
    if (selectedObject && (!target || target != selectedObject)) {
        label.style.opacity = 0;
        selectedObject.material = new THREE.MeshNormalMaterial();
        changeGroupHeight(selectedObject, minExtrude);
        selectedObject = null;
    }
}
function changeGroupHeight(mesh, height) {
    let scaleZ = {
        z: mesh.scale.z
    };
    let isComplete = false;

    let tween = new TWEEN.Tween(scaleZ)
        .to(
            {
                z: height
            },
            800
        )
        .easing(TWEEN.Easing.Quartic.Out)
        .onUpdate(() => {
            mesh.scale.set(1, 1, scaleZ.z);
            mesh.position.z = -scaleZ.z;
            //update line position
            mesh.children[0].position.z = -1 / scaleZ.z;
        })
        .onComplete(() => {
            isComplete = true;
        });
    let update = () => {
        TWEEN.update();
        !isComplete && requestAnimationFrame(update);
    };
    tween.start();
    update();
}