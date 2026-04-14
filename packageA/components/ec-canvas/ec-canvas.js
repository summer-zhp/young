var WxCanvas = require('./wx-canvas');
var echarts = require('./echarts');

Component({
  properties: {
    canvasId: {
      type: String,
      value: 'ec-canvas'
    },
    ec: {
      type: Object
    }
  },

  ready: function () {
    echarts.registerPreprocessor(function (option) {
      if (option && option.series) {
        if (option.series.length > 0) {
          option.series.forEach(function (s) { s.progressive = 0; });
        } else if (typeof option.series === 'object') {
          option.series.progressive = 0;
        }
      }
    });

    if (!this.data.ec) return;
    if (!this.data.ec.lazyLoad) {
      this.init();
    }
  },

  methods: {
    init: function (callback) {
      var that = this;
      var query = wx.createSelectorQuery().in(this);
      query.select('.ec-canvas').fields({ node: true, size: true }).exec(function (res) {
        if (!res || !res[0] || !res[0].node) {
          console.error('ec-canvas: 未找到 canvas 节点');
          return;
        }

        var canvasNode = res[0].node;
        var canvasDpr = wx.getSystemInfoSync().pixelRatio;
        var canvasWidth = res[0].width;
        var canvasHeight = res[0].height;

        var ctx = canvasNode.getContext('2d');
        var canvas = new WxCanvas(ctx, that.data.canvasId, true, canvasNode);

        if (echarts.setPlatformAPI) {
          echarts.setPlatformAPI({
            createCanvas: function () { return canvas; },
            loadImage: function (src, onload, onerror) {
              if (canvasNode.createImage) {
                var img = canvasNode.createImage();
                img.onload = onload;
                img.onerror = onerror;
                img.src = src;
                return img;
              }
              console.error('ec-canvas: createImage 不可用');
            }
          });
        } else {
          echarts.setCanvasCreator(function () { return canvas; });
        }

        if (typeof callback === 'function') {
          that.chart = callback(canvas, canvasWidth, canvasHeight, canvasDpr);
        } else if (that.data.ec && typeof that.data.ec.onInit === 'function') {
          that.chart = that.data.ec.onInit(canvas, canvasWidth, canvasHeight, canvasDpr);
        } else {
          that.triggerEvent('init', {
            canvas: canvas, width: canvasWidth, height: canvasHeight, dpr: canvasDpr
          });
        }
      });
    },

    touchStart: function (e) {
      if (this.chart && e.touches.length > 0) {
        var touch = e.touches[0];
        var handler = this.chart.getZr().handler;
        handler.dispatch('mousedown', {
          zrX: touch.x, zrY: touch.y,
          preventDefault: function () {}, stopImmediatePropagation: function () {}, stopPropagation: function () {}
        });
        handler.dispatch('mousemove', {
          zrX: touch.x, zrY: touch.y,
          preventDefault: function () {}, stopImmediatePropagation: function () {}, stopPropagation: function () {}
        });
        handler.processGesture(wrapTouch(e), 'start');
      }
    },

    touchMove: function (e) {
      if (this.chart && e.touches.length > 0) {
        var touch = e.touches[0];
        var handler = this.chart.getZr().handler;
        handler.dispatch('mousemove', {
          zrX: touch.x, zrY: touch.y,
          preventDefault: function () {}, stopImmediatePropagation: function () {}, stopPropagation: function () {}
        });
        handler.processGesture(wrapTouch(e), 'change');
      }
    },

    touchEnd: function (e) {
      if (this.chart) {
        var touch = e.changedTouches ? e.changedTouches[0] : {};
        var handler = this.chart.getZr().handler;
        handler.dispatch('mouseup', {
          zrX: touch.x, zrY: touch.y,
          preventDefault: function () {}, stopImmediatePropagation: function () {}, stopPropagation: function () {}
        });
        handler.dispatch('click', {
          zrX: touch.x, zrY: touch.y,
          preventDefault: function () {}, stopImmediatePropagation: function () {}, stopPropagation: function () {}
        });
        handler.processGesture(wrapTouch(e), 'end');
      }
    }
  }
});

function wrapTouch(event) {
  for (var i = 0; i < event.touches.length; ++i) {
    event.touches[i].offsetX = event.touches[i].x;
    event.touches[i].offsetY = event.touches[i].y;
  }
  return event;
}
