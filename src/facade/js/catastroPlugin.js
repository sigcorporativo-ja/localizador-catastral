goog.provide('P.plugin.Catastro');

goog.require('P.control.catastroSearchButtonControl');


(function() {
	/**
	 * @classdesc
	 * Main facade plugin object. This class creates a plugin
	 * object which has an implementation Object
	 *
	 * @constructor
	 * @extends {M.Plugin}
	 * @api stable
	 */
	M.plugin.Catastro= (function(userParameters) {
		if (M.utils.isNullOrEmpty(userParameters)) {
			M.exception('No ha especificado ningún parámetro');
		}
		
		/**
		 * Config specified during instantiation
		 * @private
		 * @type {Object}
		 */
		//JGL: me quedo con todo, no solo el userParameters.config
		this.config_ = (userParameters || {});
		/**
		 * Facade of the map
		 * @private
		 * @type {M.Map}
		 */
		this.map_ = null;

		/**
		 * Array of controls
		 * @private
		 * @type {Array}
		 */
		this.controls_ = [];

		/**
		 * Optional WMS Catastro Layer
		 * @private
		 * @type {M.Layer.WMS}
		 */
		this.catastroLayer_ = null;

		goog.base(this);
	});
	goog.inherits(M.plugin.Catastro, M.Plugin);

	/**
	 * This function adds this plugin into a new panel
	 *
	 * @public
	 * @function
	 * @param {M.Map} map the map to add the plugin
	 * @api stable
	 */
	M.plugin.Catastro.prototype.addTo = function(map) {
		this.map_ = map;
		this.controls_.push(new M.control.catastroSearchButtonControl(this.config_));
		
	      goog.dom.classlist.add(map._areasContainer.getElementsByClassName("m-top m-right")[0],
	         "top-extra");
		this.panel_ = new M.ui.Panel('Catastro', {
			'collapsible': true,
			'className': 'm-catastro',
			'collapsedButtonClass': 'g-catastropanel-button-closed',
			'position': M.ui.position.TL,
			'tooltip': 'Búsqueda catastral'
		});
		this.panel_.on(M.evt.ADDED_TO_MAP, function (html) {
			M.utils.enableTouchScroll(html);
		});
		this.panel_.addControls(this.controls_);
		this.map_.addPanels(this.panel_);
		
		// Capa WMS opcional de Catastro
		if(this.config_.config.catastroWMS){
			this.catastroLayer_ = new M.layer.WMS({
				url: this.config_.config.catastroWMS.wms_url,
				name: this.config_.config.catastroWMS.name,
				legend: 'Catastro',
				transparent: true,
				tiled: false
			  });
			this.map_.addWMS(this.catastroLayer_);
		}

		var this_ = this;
	    this.controls_[0].on(M.evt.ADDED_TO_MAP, function () {
	      this_.fire(M.evt.ADDED_TO_MAP);
		});
	};

	/**
	 * This function destroys this plugin
	 *
	 * @public
	 * @function
	 * @api stable
	 */
	M.plugin.Catastro.prototype.destroy = function() {
		this.map_.removeControls(this.controls_);
		this.map_ = null;
		this.controls_ = null;                                                          
	};

	/**
	 * This function returns the controls instanced in this plugin
	 *
	 * @public
	 * @function
	 * @api stable
	 */
	M.plugin.Catastro.prototype.getControls = function() {
		return this.controls_;
	};

	M.plugin.Catastro.prototype.getResultsLayer = function() {
		return this.controls_[0].getLayer();
	};

	/**
	 * This function returns the controls instanced in this plugin
	 *
	 * @public
	 * @function
	 * @api stable
	 */
	M.plugin.Catastro.prototype.getWMSCatastroLayer = function() {
		return(this.catastroLayer_);
	};

})();