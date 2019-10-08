window.onload = function () {
    'use strict';

    const config = {
        color: '#750be8',   //光照颜色
        levels: 1,
        intensity: 3,       //光照强度
        threshold: 0.01     //光照精度
    };

    const canvas = document.createElement('canvas');
    canvas.width = 682;
    canvas.height = 341;
    const context = canvas.getContext("2d");

    context.lineWidth = 0.4;
    context.strokeStyle = config.color;
    context.fillStyle = config.color;
    context.shadowColor = config.color;

    createEarthBack('./img/earth-bg.png').then(function (image) {
        let m = image.height,
            n = image.width,
            values = new Array(n * m),
            contours = d3.contours().size([n, m]).smooth(true),
            projection = d3.geoIdentity().scale(canvas.width / n),
            path = d3.geoPath(projection, context);

        for (let j = 0, k = 0; j < m; ++j) {
            for (let i = 0; i < n; ++i, ++k) {
                values[k] = image.data[(k << 2)] / 255;
            }
        };

        const opt = {
            image: canvas
        };

        //重绘背光
        function redraw(mu) {
            mu.forEach(function (d, idx) {
                context.beginPath();
                path(d);
                context.globalAlpha = 1;
                context.stroke();
                if (idx > config.levels / 5 * 3) {
                    context.globalAlpha = 0.01;
                    context.fill();
                }
            });
            opt.onupdate();
        };

        //背光
        function backLight(threshold, levels) {
            context.clearRect(0, 0, canvas.width, canvas.height);
            var thresholds = [];
            for (var i = 0; i < levels; i++) {
                thresholds.push((threshold + 1 / levels * i) % 1);
            };
            redraw(contours.thresholds(thresholds)(values));
        };

        //背光变换
        d3.timer(function (t) {
            var threshold = (t % 10000) / 10000;
            backLight(threshold, 1);
        });

        initEarth(opt);

        backLight(config.threshold, config.levels);

    });

    //地球背景
    function createEarthBack(url) {
        return new Promise(function (resolve) {
            var image = new Image();
            image.src = url;
            image.onload = function () {
                var canvas = document.createElement("canvas");
                canvas.width = image.width / 8;
                canvas.height = image.height / 8;
                var context = canvas.getContext("2d");
                context.drawImage(image, 0, 0, canvas.width, canvas.height);
                resolve(context.getImageData(0, 0, canvas.width, canvas.height));
            };
        });
    };

    function initEarth(opts) {
        const img = new echarts.graphic.Image({
            style: {
                image: opts.image,
                x: -1,
                y: -1,
                width: opts.image.width + 2,
                height: opts.image.height + 2
            }
        });

        const contourChart = echarts.init(document.createElement('canvas'), null, {
            width: 682,
            height: 341
        });

        contourChart.getZr().add(img);

        opts.onupdate = function () {
            img.dirty();
        };

        const option = {
            tooltip: {
                show: false                          //hover时显示信息
            },
            globe: {
                globeRadius: 80, // 地球的半径
                globeOuterRadius: 150, //地球的外半径
                environment: 'none',            //背景
                heightTexture: './img/earth-bar.jpg',
                baseTexture: './img/earth-bg.png',
                shading: 'lambert',
                displacementScale: 0,           //纹理深度 默认为 0
                light: {                        //光照阴影
                    main: {
                        color: 'blue',           //光照颜色
                        intensity: 12,            //光照强度
                        shadowQuality: 'ultra',     //阴影亮度
                        shadow: true,               //是否显示阴影
                        alpha: 40,
                        beta: -30
                    },
                    ambient: {
                        intensity: 4.6
                    }
                },
                viewControl: {                  //鼠标的旋转，缩放等视角控制。
                    alpha: 30,
                    beta: 160,
                    // targetCoord: [116.46, 39.92],   //起始坐标
                    autoRotate: true,           //自动旋转
                    autoRotateAfterStill: 10,
                    distance: 240,
                    autoRotateSpeed: 4,     //旋转速度 单位为角度 / 秒，默认为10 ，也就是36秒转一圈。
                    zoomSensitivity: 0,     //缩放操作的灵敏度，值越大越灵敏。默认为`` 0为不缩放
                    rotateSensitivity: 0,   //旋转操作的灵敏度，值越大越灵敏。支持使用数组分别设置横向和纵向的旋转灵敏度。
                    panSensitivity: 0       //平移操作的灵敏度，值越大越灵敏。支持使用数组分别设置横向和纵向的平移灵敏度 默认为`` 设置为0后无法平移
                },
                postEffect: {               //为画面添加高光，景深，环境光遮蔽（SSAO），调色等效果
                    enable: true,           //是否开启
                    SSAO: {                 //环境光遮蔽
                        radius: 1,          //环境光遮蔽的采样半径。半径越大效果越自然
                        intensity: 1,       //环境光遮蔽的强度
                        enable: true
                    }
                },

                layers: [{
                    type: 'blend',
                    blendTo: 'emission',
                    texture: contourChart,
                    intensity: config.intensity
                }]
            },

            //路线轨迹
            // visualMap: [{
            //   show: false,
            //   type: 'continuous',
            //   seriesIndex: 0,
            //   text: ['scatter3D'],
            //   textStyle: {
            //     color: '#fff'
            //   },
            //   calculable: true,
            //   max: 3000,
            //   inRange: {
            //     color: ['#87aa66', '#eba438', '#d94d4c'] //路线轨迹色
            //   }
            // }],

            series: [{
                name: 'lines3D',
                type: 'lines3D',
                coordinateSystem: 'globe',
                //轨迹走动
                effect: {
                    show: true,
                    period: 2,
                    trailWidth: 3,
                    trailLength: 0.5,
                    trailOpacity: 1,
                    trailColor: '#0087f4' //路线色
                },
                blendMode: 'lighter',
                lineStyle: {
                    width: 1,
                    color: '#0087f4',
                    opacity: 0.2
                },
                data: [],
                silent: false
            }, {
                //地址
                name: '地点标题',   //地址标题
                type: 'effectScatter',
                coordinateSystem: 'bmap',
                type: 'scatter3D',
                blendMode: 'lighter',
                coordinateSystem: 'globe',
                showEffectOn: 'render',
                zlevel: 2,
                effectType: "ripple",
                symbolSize: 15,
                rippleEffect: {
                    period: 4,
                    scale: 4,
                    brushType: 'fill'
                },
                showEffectOn: 'hover',
                hoverAnimation: false,
                label: {
                    normal: {
                        show: false,
                        position: 'right',
                        formatter: '{b}',
                        formatter: function (params) {
                            if (params.dataIndex == 1) {
                                return '上海'
                            } else if (params.dataIndex == 2) {
                                return '沈阳'
                            } else if (params.dataIndex == 3) {
                                return '太原'
                            } else if (params.dataIndex == 4) {
                                return '日本'
                            } else if (params.dataIndex == 5) {
                                return '雅加达'
                            } else if (params.dataIndex == 0) {
                                return '徐州'
                            } else if (params.dataIndex == 6) {
                                return '昆明'
                            }
                        },
                        textStyle: {
                            show: false,
                            fontSize: 16,                   //地址文字大小
                            color: '#f5d909',               //地址文字颜色
                            fontWeight: 'bold',             //地址文字粗细
                            backgroundColor: 'transparent'  //地址文字背景
                        }
                    }
                },
                itemStyle: {
                    normal: {
                        color: 'rgb(29,183,255)'
                    }
                },

                // 以地址显示
                // data: [{
                //     'name': 'A',
                //     'value': [105.18, 37.51, 1500]
                // }, {
                //     'name': 'B',
                //     'value': [118.393252, 31.15576, 1500]
                // }, {
                //     'name': 'C',
                //     'value': [117.989662, 31.293115, 1500]
                // }]

                // 以地址+路线轨迹显示
                data: [
                    [117.11, 34.15],
                    [118.58, 32.01],
                    [123.38, 41.8],
                    [112.01, 38.01],
                    [139.46, 35.42],
                    [116.58, 6.10],
                    [102.90, 25.31]
                ]
            }]
        };

        // 随机数据
        option.series[0].data = [
            {
                coords: [
                    [117.11, 34.15],
                    [118.58, 32.01]
                ],
                value: (Math.random() * 3000).toFixed(2)
            },
            {
                coords: [
                    [123.38, 41.8],
                    [118.58, 32.01]
                ],
                value: (Math.random() * 3000).toFixed(2)
            },
            {
                coords: [
                    [112.01, 38.01],
                    [118.58, 32.01]
                ],
                value: (Math.random() * 3000).toFixed(2)
            },
            {
                coords: [
                    [139.46, 35.42],
                    [118.58, 32.01]
                ],
                value: (Math.random() * 3000).toFixed(2)
            },
            {
                coords: [
                    [116.58, 6.10],
                    [118.58, 32.01]
                ],
                value: (Math.random() * 3000).toFixed(2)
            },
            {
                coords: [
                    [102.90, 25.31],
                    [118.58, 32.01]
                ],
                value: (Math.random() * 3000).toFixed(2)
            }
        ];

        function rodamData() {
            let longitude = Math.random() * 62 + 73;
            let longitude2 = Math.random() * 360 - 180;

            let latitude = Math.random() * 50 + 3.52;
            let latitude2 = Math.random() * 180 - 90;
            return {
                coords: [[longitude2, latitude2], [longitude, latitude]],
                value: (Math.random() * 3000).toFixed(2)
            };
        };

        for (let i = 0; i < 10; i++) {
            option.series[0].data = option.series[0].data.concat(rodamData());
        };

        echarts.init(document.querySelector("#earth-box")).setOption(option);
    };
};