/*
 * @Descripttion: 
 * @version: 
 * @Author: JohnnyZou
 * @Date: 2020-02-18 17:49:01
 * @LastEditors: JohnnyZou
 * @LastEditTime: 2020-07-06 16:42:11
 */
export default [
    {
        title: "导入文件",
        desc: `目前支持的文件类型为：geojson、svg和glb或者gltf文件。行政区geojson文件获取地址<a target="_blank" href="https://hxkj.vip/demo/echartsMap/">https://hxkj.vip/demo/echartsMap/</a>，
        或者通过<a target="_blank" href="https://labs.mapbox.com/svg-to-geojson/">https://labs.mapbox.com/svg-to-geojson/</a>网站用svg制作一份geojson。如果要导入模型，则该模型一定是之前通过此
        工具导出的模型，否则无法生成行政区块，导入模型一般是在原来的模型基础上做修改。`,
        imgList:[{
            imgDesc: `将准备好源文件文件拖入此区域，或者点击上传`,
            url: require("../assets/image/guide/1.jpg"), 
        },{
            imgDesc: `此时场景出现地图样子，通过场景右上方的配置框可以配置地图名称和整体样式`,
            url: require("../assets/image/guide/2.jpg"),
        }],
    },
    {
        title: "调整单个区块",
        desc: `鼠标滑过当前区块时，会被高亮选中，此时按下键盘 Q 键，进入单个区块编辑模式`,
        imgList:[{
            imgDesc: `单区块编辑模式下，你可以设置区块的颜色，和区块中心点的位置`,
            url: require("../assets/image/guide/3.jpg"),
            tip: "区块的中点位置在行政区域地图组件里面就是显示区块名字的位置，有些凹形区块终点位置并不在区块内，请一定根据显示要求调整"
        },{
            imgDesc: `单个配置——编辑属性。点击 编辑属性 会弹出一个显示该区块所有属性弹窗，弹窗底部可以新增或者修改属性，输入一个没有的属性即为新增，如果已存在则会覆盖现有的`,
            url: require("../assets/image/guide/4.jpg"),
            tip: `注意，请及时修改name属性和tid属性，name属性如果初始化时就存在，并且也是你需要的，则不用修改，tid属性是改区块的唯一标识，初始化时系统会自动为每个区
            块分配一个，请务必修改。`
        },{
            imgDesc: `单个配置——添加位置点。点击 添加位置点，此时鼠标会变成“+”形，随后在当前选中的区域随机选择一点后单击弹出创建点的弹窗，选择该点的需要显示的内容，点的名称
            系统会自动生成，选择好后点击 立即创建 按钮，此时会出现一个带颜色的圆点和名称标记。例如每个区块都有一根光柱，那么就要为每个区块都创建一个光柱点。如果不创建，在
            行政区域地图组件中默认会显示在区块的中心位置。`,
            url: require("../assets/image/guide/5.jpg"),
        },{
           imgDesc: `点击之前创建的这个点，会弹出该点的信息弹窗，然后可以对该点进行删除操作`,
           url: require("../assets/image/guide/6.jpg"),
        }],
    },
    {
        title: "导出场景地图模型",
        desc: `当你完成对地图的所有编辑操作后，你可以根据显示要求用鼠标调整相机的姿态，让地图看起来是一个你想要的显示样子，最后点击右侧 导出场景 按钮，就会生成一个.glb的地图
        模型文件。`
    }
]
