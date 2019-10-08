document.addEventListener("click", function() {
	var documentElement = document.documentElement;
	if (documentElement.requestFullscreen) {
		documentElement.requestFullscreen()
	} else {
		if (documentElement.mozRequestFullScreen) {
			documentElement.mozRequestFullScreen()
		} else {
			if (documentElement.webkitRequestFullScreen) {
				documentElement.webkitRequestFullScreen()
			}
		}
	}
});
var config = {
	percent: 0,
	lat: 0,
	lng: 0,
	segX: 14,
	segY: 12,
	zoom: 0,
	isHaloVisible: true,
	autoSpin: true,
	diffuse: "./img/timg.jpg",
	halo: "./img/halo.png",
},
	stats, imgs, preloader, preloadPercent, globeDoms, vertices, globe, globeContainer, globeHalo, pixelExpandOffset = 1.5,
	rX = 0,
	rY = 0,
	rZ = 0,
	sinRX, sinRY, sinRZ, cosRX, cosRY, cosRZ, dragX, dragY, dragLat, dragLng, isMouseDown = false,
	isTweening = false,
	tick = 1,
	transformStyleName = PerspectiveTransform.transformStyleName;

function regenerateGlobe() {
	var dom, domStyle;
	var x, y;
	globeDoms = [];
	while (dom = globeContainer.firstChild) {
		globeContainer.removeChild(dom)
	}
	var segX = config.segX;
	var segY = config.segY;
	var diffuseImgBackgroundStyle = "url(" + config.diffuse + ")";
	var segWidth = 1600 / segX | 0;
	var segHeight = 800 / segY | 0;
	vertices = [];
	var verticesRow;
	var radius = (360) / 2;
	var phiStart = 0;
	var phiLength = Math.PI * 2;
	var thetaStart = 0;
	var thetaLength = Math.PI;
	for (y = 0; y <= segY; y++) {
		verticesRow = [];
		for (x = 0; x <= segX; x++) {
			var u = x / segX;
			var v = 0.05 + y / segY * (1 - 0.1);
			var vertex = {
				x: -radius * Math.cos(phiStart + u * phiLength) * Math.sin(thetaStart + v * thetaLength),
				y: -radius * Math.cos(thetaStart + v * thetaLength),
				z: radius * Math.sin(phiStart + u * phiLength) * Math.sin(thetaStart + v * thetaLength),
				phi: phiStart + u * phiLength,
				theta: thetaStart + v * thetaLength
			};
			verticesRow.push(vertex)
		}
		vertices.push(verticesRow)
	}
	for (y = 0; y < segY; ++y) {
		for (x = 0; x < segX; ++x) {
			dom = document.createElement("div");
			domStyle = dom.style;
			domStyle.position = "absolute";
			domStyle.width = segWidth + "px";
			domStyle.height = segHeight + "px";
			domStyle.overflow = "hidden";
			domStyle[PerspectiveTransform.transformOriginStyleName] = "0 0";
			domStyle.backgroundImage = diffuseImgBackgroundStyle;
			dom.perspectiveTransform = new PerspectiveTransform(dom, segWidth, segHeight);
			dom.topLeft = vertices[y][x];
			dom.topRight = vertices[y][x + 1];
			dom.bottomLeft = vertices[y + 1][x];
			dom.bottomRight = vertices[y + 1][x + 1];
			domStyle.backgroundPosition = (-segWidth * x) + "px " + (-segHeight * y) + "px";
			globeContainer.appendChild(dom);
			globeDoms.push(dom)
		}
	}
}
function clamp(x, min, max) {
	return x < min ? min : x > max ? max : x
}
function clampLng(lng) {
	return ((lng + 180) % 360) - 180
}
function render() {
	if (config.autoSpin && !isMouseDown && !isTweening) {
		config.lng = clampLng(config.lng - 0.2)
	}
	rX = config.lat / 180 * Math.PI;
	rY = (clampLng(config.lng) - 270) / 180 * Math.PI;
	globeHalo.style.display = config.isHaloVisible ? "block" : "none";
	var ratio = Math.pow(config.zoom, 1.5);
	pixelExpandOffset = 1.5 + (ratio) * -1.25;
	ratio = 1 + ratio * 3;
	globe.style[transformStyleName] = "scale3d(" + ratio + "," + ratio + ",1)";
	ratio = 1 + Math.pow(config.zoom, 3) * 0.3;
	transformGlobe()
}
function loop() {
	requestAnimationFrame(loop);
	render()
}
function rotate(vertex, x, y, z) {
	x0 = x * cosRY - z * sinRY;
	z0 = z * cosRY + x * sinRY;
	y0 = y * cosRX - z0 * sinRX;
	z0 = z0 * cosRX + y * sinRX;
	var offset = 1 + (z0 / 4000);
	x1 = x0 * cosRZ - y0 * sinRZ;
	y0 = y0 * cosRZ + x0 * sinRZ;
	vertex.px = x1 * offset;
	vertex.py = y0 * offset
}
function expand(v1, v2) {
	var x = v2.px - v1.px,
		y = v2.py - v1.py,
		det = x * x + y * y,
		idet;
	if (det === 0) {
		v1.tx = v1.px;
		v1.ty = v1.py;
		v2.tx = v2.px;
		v2.ty = v2.py;
		return
	}
	idet = pixelExpandOffset / Math.sqrt(det);
	x *= idet;
	y *= idet;
	v2.tx = v2.px + x;
	v2.ty = v2.py + y;
	v1.tx = v1.px - x;
	v1.ty = v1.py - y
}
function transformGlobe() {
	var dom, perspectiveTransform;
	var x, y, v1, v2, v3, v4, vertex, verticesRow, i, len;
	if (tick ^= 1) {
		sinRY = Math.sin(rY);
		sinRX = Math.sin(-rX);
		sinRZ = Math.sin(rZ);
		cosRY = Math.cos(rY);
		cosRX = Math.cos(-rX);
		cosRZ = Math.cos(rZ);
		var segX = config.segX;
		var segY = config.segY;
		for (y = 0; y <= segY; y++) {
			verticesRow = vertices[y];
			for (x = 0; x <= segX; x++) {
				rotate(vertex = verticesRow[x], vertex.x, vertex.y, vertex.z)
			}
		}
		for (y = 0; y < segY; y++) {
			for (x = 0; x < segX; x++) {
				dom = globeDoms[x + segX * y];
				v1 = dom.topLeft;
				v2 = dom.topRight;
				v3 = dom.bottomLeft;
				v4 = dom.bottomRight;
				expand(v1, v2);
				expand(v2, v3);
				expand(v3, v4);
				expand(v4, v1);
				perspectiveTransform = dom.perspectiveTransform;
				perspectiveTransform.topLeft.x = v1.tx;
				perspectiveTransform.topLeft.y = v1.ty;
				perspectiveTransform.topRight.x = v2.tx;
				perspectiveTransform.topRight.y = v2.ty;
				perspectiveTransform.bottomLeft.x = v3.tx;
				perspectiveTransform.bottomLeft.y = v3.ty;
				perspectiveTransform.bottomRight.x = v4.tx;
				perspectiveTransform.bottomRight.y = v4.ty;
				perspectiveTransform.hasError = perspectiveTransform.checkError();
				if (!(perspectiveTransform.hasError = perspectiveTransform.checkError())) {
					perspectiveTransform.calc()
				}
			}
		}
	} else {
		for (i = 0, len = globeDoms.length; i < len; i++) {
			perspectiveTransform = globeDoms[i].perspectiveTransform;
			if (!perspectiveTransform.hasError) {
				perspectiveTransform.update()
			} else {
				perspectiveTransform.style[transformStyleName] = "translate3d(-8192px, 0, 0)"
			}
		}
	}
}
function init(ref) {
	globe = document.querySelector(".planet-globe");
	globeContainer = document.querySelector(".planet-globe-doms-container");
	globeHalo = document.querySelector(".planet-globe-halo");
	globeHalo.style.backgroundImage = "url(" + config.halo + ")";
	regenerateGlobe();
	loop()
}
init();