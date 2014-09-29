// Coverflow
(function() {
	// UTILITIES
	var dummyStyles = document.createElement('div').style,
		cssfix = (function() {
			var prefixes = 'Webkit Moz O ms'.split(' '),
				cache = {},
				capitalize = function(str) {
					return str.charAt(0).toUpperCase() + str.slice(1);
				},
				toCamel = function(str) {
					var arryStr = str.split('-'),
						camelStr = arryStr[0];
					for (var i = 1; i < arryStr.length; i++) {
						camelStr += capitalize(arryStr[i]);
					}
					return camelStr;
				};
			return function(property) {
				if (typeof cache[property] === 'undefined') {
					var camelProperty = toCamel(property),
						capitalizedProperty = capitalize(camelProperty),
						prefixedProperties = (property + ' ' + camelProperty + ' ' + prefixes.join(capitalizedProperty + ' ') + capitalizedProperty).split(' ');

					cache[property] = null;
					for (var i in prefixedProperties) {
						if (dummyStyles[prefixedProperties[i]] !== undefined) {
							cache[property] = prefixedProperties[i];
							break;
						}
					}
				}
				return cache[property];
			}
		})(),
		css = function(element, properties) {
			// Set
			var pk;
			for (k in properties) {
				pk = cssfix(k);
				if (pk !== null) {
					element.style[pk] = properties[k];
				}
			}
		},
		extendObject = function(destination, source) {
			var source = source || {};
			for (var property in source) {
				if (source[property] && source[property].constructor && source[property].constructor === Object) {
					destination[property] = destination[property] || {};
					arguments.callee(destination[property], source[property]);
				} else {
					destination[property] = source[property];
				}
			}
			return destination;
		},
		getElems = function(selection, context) {
			var NodeListToArray = function(nl) {
				return [].slice.call(nl);
			};
			var ctx = context || document;
			return NodeListToArray(ctx.querySelectorAll(selection));
		},
		forEach = function(arr, handler) {
			var l = arr.length;
			for (var i = 0; i < l; i++) {
				handler(arr[i], i);
			}
		},
		width = function(elem) {
			return elem.offsetWidth;
		},
		height = function(elem) {
			return elem.offsetHeight;
		},
		/*
		 * Event handler
		 * @type {function} @return {null}
		 */
		on = function(element, eventType, handler) {
			element.addEventListener(eventType, handler, false);
		},

		/*
		 * Event Key handler
		 * @type {function} @return {null}
		 */
		onKeyPress = function(element, keycode, handler) {
			on(element, 'keydown', function(e) {
				var unicode = e.keyCode ? e.keyCode : e.charCode;
				if (keyUp && unicode === keycode) {
					keyUp = false;
					handler(e);
				}
			});
		},
		keyUp = true;

	on(window, 'keyup', function() {
		keyUp = true;
	});


	// COVERFLOW
	var CF = function(options) {
		return this.init(options);
	};

	CF.prototype = {
		supported: (cssfix('perspective') !== null),
		init: function(options) {
			this.config = extendObject({
				id: null,
				perspective: 900,
				margin: 60,
				distance: 80,
				offsetX: 0,
				offsetY: 110,
				duration: 500,
				classSlide: 'slide',
				initial: 0
			}, options);
			if (this.config.id !== null && this.supported) {
				var self = this;

				// Container
				this.eContainer = getElems('#' + this.config.id)[0];

				var sty = window.getComputedStyle(this.eContainer),
					pos = sty.getPropertyValue('position'),
					newPosition = (pos === 'static') ? 'relative' : pos;
				css(this.eContainer, {
					'position': newPosition,
					'overflow': 'hidden'
				});

				// Slider
				this.eSlider = document.createElement('div');
				this.eContainer.appendChild(this.eSlider);
				css(this.eSlider, {
					'position': 'absolute',
					'left': '50%',
					'top': '50%',
					'width': 0,
					'height': 0,
					'margin-left': this.config.offsetX + 'px',
					'margin-top': this.config.offsetY + 'px',
					'perspective': this.config.perspective + 'px'
				});

				// Slides
				this.eSlidesList= [];
				var eSlist = getElems('.' + this.config.classSlide, this.eContainer);
				forEach(eSlist, function(el) {

					var eSlideWrap = document.createElement('div');

					self.eSlider.appendChild(eSlideWrap);					
					css(eSlideWrap, {
						'position': 'absolute',
						'left': '0',
						'top': '0',
						'transition': 'all ' + self.config.duration + 'ms ease'
					});
					css(el, {
						'position': 'relative'
					});

					var elReflex = el.cloneNode(true);

					eSlideWrap.appendChild(el);
					eSlideWrap.appendChild(elReflex);

					
					css(elReflex, {
						'transform':'scale(1,-1)'
					});

					var elReflexBlur = document.createElement('div');

					css(elReflexBlur, {
						'position':'absolute',
						'top':'0',
						'bottom':'0',
						'left':'0',
						'right':'0',
						'background-color':'#FFF',
						'opacity' : '.7'
					});
					elReflex.appendChild(elReflexBlur);

					self.eSlidesList.push(eSlideWrap);

				});
				this.current = null;
				this.animating = false;
				this.changeSlide(this.config.initial).setEvents(this);

			}
			return this;
		},
		changeSlide: function(num) {
			if (!this.animating && this.current !== num && num >= 0 && num < this.eSlidesList.length) {
				this.current = num;
				return this.render();
			}
		},
		render: function() {
			var self = this,
				w = width(this.eSlidesList[this.current]),
				posX = -1 * (this.current - 1) * this.config.distance - (w / 2 + this.config.margin),
				zIndex = 1000;
			forEach(this.eSlidesList, function(el, i) {
				var ang = (i === self.current) ? '0' : ((i < self.current) ? '90' : '-90'),
					transf = 'translate(-50%,-40%) rotateY(' + ang + 'deg)';

				transf += (i < self.current) ? ' translate3d(' + (.8*w / 2) + 'px,0,0)' : '';
				transf += (i > self.current) ? ' translate3d(' + (-.8*w / 2) + 'px,0,0)' : '';

				posX = (i === self.current) ? 0 : posX;
				zIndex += (i > self.current) ? -1 : 1;
				css(el, {
					'transform': transf,
					'left': posX + 'px',
					'z-index': zIndex
				});
				posX += (i === self.current) ? (w / 2 + self.config.margin) : self.config.distance;

			});
			return this;
		},
		prev: function() {
			return this.changeSlide(this.current - 1);
		},
		next: function() {
			return this.changeSlide(this.current + 1);
		},
		setEvents: function(self) {
			onKeyPress(window, 37, function() {
				self.prev();
			});
			onKeyPress(window, 39, function() {
				self.next();
			});
			return this;
		}
	};

	var Coverflow = function(options) {
		return new CF(options);
	}

	window.Coverflow = Coverflow;

})();