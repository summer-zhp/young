// packageA/pages/werun/werun.js - 微信运动步数可视化
var echarts = require('../../components/ec-canvas/echarts');
var { cloud } = require('../../../utils/cloud');

Page({
  data: {
    isAuthorized: false,
    authDenied: false,
    isLoading: false,
    stepInfoList: [],
    errorMsg: '',
    totalSteps: '0',
    avgSteps: '0',
    maxSteps: '0',
    chartType: 'bar',
    ec: {
      lazyLoad: true
    }
  },

  chart: null,
  chartData: [],

  onLoad: function () {
    if (!getApp().isLogged()) {
      wx.showModal({
        title: '提示',
        content: '请先登录后查看运动足迹',
        confirmText: '去登录',
        confirmColor: '#8EC5B9',
        success: function (res) {
          if (res.confirm) {
            wx.switchTab({ url: '/pages/profile/profile' })
          } else {
            wx.navigateBack()
          }
        }
      })
      return
    }
    this.checkAuth();
  },

  // ===== 授权 =====

  checkAuth: function () {
    var that = this;
    wx.getSetting({
      success: function (res) {
        if (res.authSetting['scope.werun']) {
          that.setData({ isAuthorized: true });
          that.loadWeRunData();
        } else {
          that.requestAuth();
        }
      }
    });
  },

  requestAuth: function () {
    var that = this;
    wx.authorize({
      scope: 'scope.werun',
      success: function () {
        that.setData({ isAuthorized: true, authDenied: false });
        that.loadWeRunData();
      },
      fail: function () {
        that.setData({ authDenied: true });
        wx.showToast({ title: '需要授权才能查看运动数据', icon: 'none' });
      }
    });
  },

  onSettingCallback: function (res) {
    if (res.detail.authSetting['scope.werun']) {
      this.setData({ isAuthorized: true, authDenied: false });
      this.loadWeRunData();
    }
  },

  // ===== 数据 =====

  loadWeRunData: function () {
    var that = this;
    this.setData({ isLoading: true, errorMsg: '' });
    wx.login({
      success: function (loginRes) {
        wx.getWeRunData({
          success: function (werunRes) {
            cloud.callFunction('getWeRunData', {
              encryptedData: werunRes.encryptedData,
              iv: werunRes.iv,
              code: loginRes.code
            }).then(function (result) {
              if (!result.success) throw new Error(result.message || '数据解析失败');
              that.processStepData(result.stepInfoList || []);
            }).catch(function (err) { that.handleDataError(err); });
          },
          fail: function (err) { that.handleDataError(err); }
        });
      },
      fail: function (err) { that.handleDataError(err); }
    });
  },

  handleDataError: function (err) {
    console.error('获取微信运动数据失败:', err);
    var msg = '获取运动数据失败，请确保已开启微信运动';
    if (err.errMsg && err.errMsg.indexOf('auth deny') > -1) msg = '请授权后查看运动数据';
    else if (err.errMsg && err.errMsg.indexOf('not support') > -1) msg = '当前设备不支持微信运动';
    else if (err.message) msg = err.message;
    this.setData({ isLoading: false, errorMsg: msg });
  },

  processStepData: function (rawList) {
    if (!rawList.length) { this.setData({ isLoading: false }); return; }

    rawList.sort(function (a, b) { return a.timestamp - b.timestamp; });
    var maxStep = Math.max.apply(null, rawList.map(function (d) { return d.step; }));
    maxStep = Math.max(maxStep, 1);
    var totalStep = rawList.reduce(function (s, d) { return s + d.step; }, 0);
    var avgStep = Math.round(totalStep / rawList.length);
    var weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

    var stepInfoList = rawList.map(function (item) {
      var date = new Date(item.timestamp * 1000);
      var month = date.getMonth() + 1;
      var day = date.getDate();
      return {
        timestamp: item.timestamp,
        step: item.step,
        dateStr: month + '/' + day,
        weekStr: weekDays[date.getDay()],
        fullDate: date.getFullYear() + '-' + String(month).padStart(2, '0') + '-' + String(day).padStart(2, '0'),
        stepStr: item.step.toLocaleString(),
        barPercent: Math.round((item.step / maxStep) * 100)
      };
    });

    this.chartData = stepInfoList;

    this.setData({
      isLoading: false,
      stepInfoList: stepInfoList,
      totalSteps: totalStep.toLocaleString(),
      avgSteps: avgStep.toLocaleString(),
      maxSteps: maxStep.toLocaleString()
    });

    this.initChart();
  },

  // ===== ECharts =====

  initChart: function () {
    var ecComponent = this.selectComponent('#werunChart');
    if (!ecComponent) return;

    var that = this;
    ecComponent.init(function (canvas, width, height, dpr) {
      var chart = echarts.init(canvas, null, {
        width: width,
        height: height,
        devicePixelRatio: dpr
      });
      canvas.setChart(chart);
      chart.setOption(that.getChartOption());
      that.chart = chart;
      return chart;
    });
  },

  getChartOption: function () {
    return this.data.chartType === 'bar'
      ? this.getBarOption()
      : this.getLineOption();
  },

  getBarOption: function () {
    var data = this.chartData;
    var dates = data.map(function (d) { return d.dateStr; });
    var steps = data.map(function (d) { return d.step; });
    var that = this;

    return {
      tooltip: {
        trigger: 'axis',
        confine: true,
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: '#eee',
        borderWidth: 1,
        textStyle: { color: '#333', fontSize: 12 },
        formatter: function (params) {
          var p = params[0];
          var item = data[p.dataIndex];
          return item.fullDate + ' ' + item.weekStr + '\n' + p.marker + ' ' + p.value.toLocaleString() + ' 步';
        }
      },
      grid: { left: 8, right: 8, bottom: 28, top: 16, containLabel: true },
      xAxis: {
        type: 'category',
        data: dates,
        axisLabel: { fontSize: 9, color: '#999' },
        axisLine: { lineStyle: { color: '#e8e8e8' } },
        axisTick: { show: false }
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#f5f5f5' } },
        axisLabel: {
          fontSize: 9, color: '#999',
          formatter: function (v) {
            if (v >= 10000) return (v / 10000).toFixed(1) + 'w';
            if (v >= 1000) return (v / 1000).toFixed(0) + 'k';
            return v;
          }
        }
      },
      dataZoom: [{
        type: 'inside',
        startValue: Math.max(0, data.length - 10),
        endValue: data.length - 1
      }],
      series: [{
        type: 'bar',
        data: steps,
        barMaxWidth: 20,
        itemStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#8EC5B9' },
              { offset: 1, color: 'rgba(142,197,185,0.3)' }
            ]
          },
          borderRadius: [3, 3, 0, 0]
        }
      }]
    };
  },

  getLineOption: function () {
    var data = this.chartData;
    var dates = data.map(function (d) { return d.dateStr; });
    var steps = data.map(function (d) { return d.step; });

    return {
      tooltip: {
        trigger: 'axis',
        confine: true,
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: '#eee',
        borderWidth: 1,
        textStyle: { color: '#333', fontSize: 12 },
        formatter: function (params) {
          var p = params[0];
          var item = data[p.dataIndex];
          return item.fullDate + ' ' + item.weekStr + '\n' + p.marker + ' ' + p.value.toLocaleString() + ' 步';
        }
      },
      grid: { left: 8, right: 8, bottom: 28, top: 16, containLabel: true },
      xAxis: {
        type: 'category',
        data: dates,
        boundaryGap: false,
        axisLabel: { fontSize: 9, color: '#999' },
        axisLine: { lineStyle: { color: '#e8e8e8' } },
        axisTick: { show: false }
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#f5f5f5' } },
        axisLabel: {
          fontSize: 9, color: '#999',
          formatter: function (v) {
            if (v >= 10000) return (v / 10000).toFixed(1) + 'w';
            if (v >= 1000) return (v / 1000).toFixed(0) + 'k';
            return v;
          }
        }
      },
      dataZoom: [{
        type: 'inside',
        startValue: Math.max(0, data.length - 10),
        endValue: data.length - 1
      }],
      series: [{
        type: 'line',
        data: steps,
        smooth: true,
        symbol: 'circle',
        symbolSize: 5,
        lineStyle: { color: '#8EC5B9', width: 2 },
        itemStyle: { color: '#8EC5B9', borderColor: '#fff', borderWidth: 1.5 },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(142,197,185,0.3)' },
              { offset: 1, color: 'rgba(142,197,185,0.02)' }
            ]
          }
        }
      }]
    };
  },

  // ===== 交互 =====

  switchChart: function (e) {
    var type = e.currentTarget.dataset.type;
    if (type === this.data.chartType) return;
    this.setData({ chartType: type });
    if (this.chart) {
      this.chart.setOption(this.getChartOption(), true);
    }
  }
});
