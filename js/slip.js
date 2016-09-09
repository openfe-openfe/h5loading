
(function(window,document){
_fun = {
	ios: function() { // 作用：判断是否为苹果的IOS设备
		var regular_result = navigator.userAgent.match(/.*OS\s([\d_]+)/),
			os_boolean = !!regular_result;
		if(!this._version_value && os_boolean){
			this._version_value = regular_result[1].replace(/_/g, '.');
		}
		this.ios = function(){return os_boolean;};
		return os_boolean;
	},
	version: function() { // 作用：返回IOS的版本号
		return this._version_value;
	},
	clone: function(object) { // 作用：用于原型继承
		function f() {}
		f.prototype = object;
		return new f;
	}
}
var slipjs = {
	_refreshCommon: function(wide_high, parent_wide_high) { // 作用：当尺寸改变时，需要重新取得相关的值
		var that = this;
		that.wide_high = wide_high || that.core[that.offset] - that.up_range;
		that.parent_wide_high      = parent_wide_high      || that.core.parentNode[that.offset];
		that._getCoreWidthSubtractShellWidth();
	},
	_initCommon: function(core,param) { // 作用：初始化
		var that = this;
		that.core = core;
		that.startFun    = param.startFun;
		that.moveFun     = param.moveFun;
		that.touchEndFun = param.touchEndFun;
		that.endFun      = param.endFun;
		that.direction   = param.direction;
		that.up_range    = param.up_range   || 0;
		that.down_range  = param.down_range  || 0;
		if(that.direction == 'x'){
			that.offset ='offsetWidth';
			that._pos   = that.__posX;
		}else{
			that.offset ='offsetHeight';
			that._pos   = that.__posY;
		}
		that.wide_high       = param.wide_high || that.core[that.offset] - that.up_range;
		that.parent_wide_high   = param.parent_wide_high || that.core.parentNode[that.offset];
		that._getCoreWidthSubtractShellWidth();

		that._bind("touchstart");
		that._bind("touchmove");
		that._bind("touchend");
		that._bind("webkitTransitionEnd");

		that.xy = 0;
		that.y = 0;
		that._pos(-that.up_range);
	},
	_getCoreWidthSubtractShellWidth: function() { // 作用：取得滑动对象和它父级元素的宽度或者高度的差
		var that = this;
		that.width_cut_coreWidth = that.parent_wide_high - that.wide_high;
		that.coreWidth_cut_width = that.wide_high - that.parent_wide_high;
	},
	handleEvent: function(e) { // 作用：简化addEventListener的事件绑定
		switch (e.type) {
			case "touchstart":          this._start(e); break;
			case "touchmove":           this._move(e);  break;
			case "touchend":
			case "touchcancel":         this._end(e);   break;
			case "webkitTransitionEnd": this._transitionEnd(e); break;
		}
	},
	_bind: function(type, boole) { // 作用：事件绑定
		this.core.addEventListener(type, this, !!boole);
	},
	_unBind: function(type, boole) { // 作用：事件移除
		this.core.removeEventListener(type, this, !!boole);
	},
	__posX: function(x) { // 作用：当设置滑动的方向为“X”时用于设置滑动元素的坐标
		this.xy = x;
		this.core.style['webkitTransform'] = 'translate3d('+x+'px, 0px, 0px)';
		//this.core.style['webkitTransform'] = 'translate('+x+'px, 0px) scale(1) translateZ(0px)';
	},
	__posY: function(x) { // 作用：当设置滑动的方向为“Y”时用于设置滑动元素的坐标
		this.xy = x;
		this.core.style['webkitTransform'] = 'translate3d(0px, '+x+'px, 0px)';
		//this.core.style['webkitTransform'] = 'translate(0px, '+x+'px) scale(1) translateZ(0px)';
	},
	_posTime: function(x,time) { // 作用：缓慢移动
		this.core.style.webkitTransitionDuration = ''+time+'ms';
		this._pos(x);
	}
}
var SlipPage = _fun.clone(slipjs);
	SlipPage._init = function(core,param) { // 作用：初始化
		var that           = this;
		that._initCommon(core,param);
		that.num           = param.num;
		that.page          = 0;
		that.change_time   = param.change_time;
		that.lastPageFun   = param.lastPageFun;
		that.firstPageFun  = param.firstPageFun;
		param.change_time  && that._autoChange();
		param.no_follow ? (that._move = that._moveNoMove, that.next_time = 500) : that.next_time = 300;
	};
	SlipPage._start = function(e) { // 触摸开始
		var that = this,
			e = e.touches[0];
		that._abrupt_x     = 0;
		that._abrupt_x_abs = 0;
		that._start_x = that._start_x_clone = e.pageX;
		that._start_y = e.pageY;
		that._movestart = undefined;
		that.change_time && that._stop();
		that.startFun && that.startFun(e);
	};
	SlipPage._move = function(evt) { // 触摸中,跟随移动
		var that = this;
		that._moveShare(evt);
		if(!that._movestart){
			var e = evt.touches[0];
			if(that._start_x < 30){
				return;
			}
			evt.preventDefault();
			that.offset_x = (that.xy > 0 || that.xy < that.width_cut_coreWidth) ? that._dis_x/2 + that.xy : that._dis_x + that.xy;
			that._start_x  = e.pageX;
			if (that._abrupt_x_abs < 6) {
				that._abrupt_x += that._dis_x;
				that._abrupt_x_abs = Math.abs(that._abrupt_x);
				return;
			}
			that._pos(that.offset_x);
			that.moveFun && that.moveFun(e);
		}
	};
	SlipPage._moveNoMove = function(evt) { // 触摸中,不跟随移动，只记录必要的值
		var that = this;
		that._moveShare(evt);
		if(!that._movestart){
			if(that._start_x < 30){
				return;
			}
			evt.preventDefault();
			that.moveFun && that.moveFun(e);
		}
	};
	SlipPage._moveShare = function(evt) { // 不跟随移动和跟随移动的公共操作
		var that = this,
		e = evt.touches[0];
		that._dis_x = e.pageX - that._start_x;
		that._dis_y = e.pageY - that._start_y;
		typeof that._movestart == "undefined" && (that._movestart = !!(that._movestart || Math.abs(that._dis_x) < Math.abs(that._dis_y)));
	};
	SlipPage._end = function(e) { // 触摸结束
		if (!this._movestart) {
			var that = this;
			that._end_x = e.changedTouches[0].pageX;
			that._range = that._end_x - that._start_x_clone;
			if(that._range > 35){
				that.page != 0 ? that.page -= 1 : (that.firstPageFun && that.firstPageFun(e));
			}else if(Math.abs(that._range) > 35){
				that.page != that.num - 1 ? that.page += 1 : (that.lastPageFun && that.lastPageFun(e));
			}
			that.toPage(that.page, that.next_time);
			that.touchEndFun && that.touchEndFun(e);
		}
	};
	SlipPage._transitionEnd = function(e) { // 动画结束
		var that = this;
		e.stopPropagation();
		that.core.style.webkitTransitionDuration = '0';
		that._stop_ing && that.change_time && that._autoChange(), that._stop_ing = false;
		that.endFun && that.endFun();
	};
	SlipPage.toPage = function(num, time) { // 可在外部调用的函数，指定轮换到第几张，只要传入：“轮换到第几张”和“时间”两个参数。
		this._posTime(-this.parent_wide_high * num, time || 0);
		this.page = num;
	};
	SlipPage._stop = function() { // 作用：停止自动轮换
		clearInterval(this._autoChangeSet);
		this._autoChangeSet = false;
		this._stop_ing = true;
	};
    SlipPage.stopChange = function(){
    	var that =  this;

    	if(that._autoChangeSet){
	        clearInterval(that._autoChangeSet);
	        that._autoChangeSet = false;
	        that._stop_ing = false;
    	}
    };
    SlipPage.startChange=function() {
    	var that = this;

    	that._stop_ing = true;
        that._autoChange();
    };
	SlipPage._autoChange = function() { // 作用：自动轮换
		var that = this;

		if(!that._autoChangeSet){
			that._autoChangeSet = setInterval(function() {
	        	that.page != that.num - 1 ? that.page += 1 : that.page = 0;
				that.toPage(that.page, that.next_time);
	        },that.change_time);
		}
	};
	SlipPage.refresh = function(wide_high, parent_wide_high) { // 可在外部调用，作用：当尺寸改变时（如手机横竖屏时），需要重新取得相关的值。这时候就可以调用该函数
		this._refreshCommon(wide_high, parent_wide_high);
	};

	function slip(state,core,param) {// 外部实现
		param || (param = {});
		if(_fun.ios() && (parseInt(_fun.version()) >= 5 && param.direction == 'x')&&param.wit){
			core.parentNode.style.cssText += "overflow:scroll; -webkit-overflow-scrolling:touch;";
		}else{
			switch(state){
				case 'page':
					param.direction = "x";
					if(!this.SlipPage){
						this.SlipPage = true;
						SlipPage._init(core,param);
						return SlipPage;
					}else{
						var page = _fun.clone(SlipPage);
						page._init(core,param);
						return page;
					}
					break;
				default:
					break;
			}
		}
	}

	define(function(require, exports, module) {
		if ( typeof module != 'undefined' && module.exports ) {
			module.exports = slip;
		} else {
			window.slip = slip;
		}
	});
})(window, document);
