/*
 * @Descripttion: 
 * @version: 
 * @Author: JohnnyZou
 * @Date: 2020-02-18 17:49:01
 * @LastEditors  : JohnnyZou
 * @LastEditTime : 2020-02-18 18:44:28
 */
export default [
    {
        title: "导入geojson文件",
        desc: `首先准备好一份geojson地理信息文件，geojson获取地址 https://hxkj.vip/demo/echartsMap/，
        或者通过https://labs.mapbox.com/svg-to-geojson/网站用svg制作一份geojson`,
        imgList:[{
            imgDesc: `将准备好geojson文件拖入此区域，或者点击上传`,
            url: require("../assets/image/guide/1.jpg"), 
        },{
            imgDesc: `此时场景出现地图样子，通过场景右上方的配置框可以配置地图的整体样式`,
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
            imgDesc: `单个配置框中的 编辑属性，会弹出一个显示该区块所有属性弹窗，弹窗底部可以新增或者修改属性，输入一个没有的属性即为新增，如果已存在则会覆盖现有的`,
            url: require("../assets/image/guide/4.jpg"),
            tip: `注意，请及时修改name属性和tid属性，name属性如果初始化时就存在，并且也是你需要的，则不用修改，tid属性是改区块的唯一标识，初始化时系统会自动为每个区
            块分配一个，请务必修改。`
        }],
    }
]
