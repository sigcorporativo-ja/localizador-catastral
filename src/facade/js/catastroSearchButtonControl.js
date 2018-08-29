goog.provide('P.control.catastroSearchButtonControl');

goog.require('goog.dom.classlist');
goog.require('goog.events');
goog.require('goog.style');
/**
 * @classdesc
 * Main constructor of the class. Creates a catastroSearchButtonControl
 * control
 *
 * @constructor
 * @extends {M.Control}
 * @api stable
 */
M.control.catastroSearchButtonControl = (function (parameters) {
	// 1. checks if the implementation can create catastroSearchButtonControl
	if (M.utils.isUndefined(M.impl.control.catastroSearchButtonControl)) {
		M.exception('La implementación usada no puede crear controles catastroSearchButtonControl');
	}

	if (parameters) {
		this.options = (parameters.options || {});
		this.config_ = (parameters.config || {});
	} else {
		M.exception('CatastroSearchButtonControl: configuración no válida');
	}

	if (M.utils.isUndefined(this.options.name) || M.utils.isNullOrEmpty(this.options.name)) {
		this.options.name = M.control.catastroSearchButtonControl.NAME;
	}

	// 2. implementation of this control
	var impl = new M.impl.control.catastroSearchButtonControl();

	this.facadeMap_ = null;

	/**
		 * Input element for RC
		 * @private
		 * @type {HTMLElement}
		 */
	this.inputRC_ = null;

	/**
	 * Select element for Provincias
	 * @private
	 * @type {HTMLElement}
	 */
	this.selectProvincias = null;

	/**
	 * Select element for Municipios
	 * @private
	 * @type {HTMLElement}
	 */
	this.selectMunicipios = null;

	/**
	 * Input element for Poligono
	 * @private
	 * @type {HTMLElement}
	 */
	this.inputPoligono = null;

	/**
	 * Input element for Parcela
	 * @private
	 * @type {HTMLElement}
	 */
	this.inputParcela = null;

	/**
	 * Url for "consulta de municipios para una provincia"
	 * @private
	 * @type {String}
	 */
	this.ConsultaMunicipioCodigos_ = this.config_.CMC_url;

	/**
	 * Url for "consulta de datos no protegidos para un inmueble por su referencia catastral"
	 * @private
	 * @type {String}
	 */
	this.DNPRC_url_ = this.config_.DNPRC_url;

	/**
	 * Url for "consulta de coordenadas por Provincia, Municipio y Referencia Catastral"
	 * @private
	 * @type {String}
	 */
	this.CPMRC_url_ = this.config_.CPMRC_url;

	/**
	 * Url for "consulta de datos no protegidos para un inmueble por su polígono parcela"
	 * @private
	 * @type {String}
	 */
	this.DNPPP_url_ = this.config_.DNPPP_url;

	/**
	 * Url for "consulta de Referencia Catastral por Coordenadas"
	 * @private
	 * @type {String}
	 */
	this.RCCOOR_url_ = this.config_.RCCOOR_url;

	/**
	 * Container of the results
	 * @private
	 * @type {HTMLElement}
	 */
	this.resultsRCContainer_ = null;

	/**
	 * Container of the results
	 * @private
	 * @type {HTMLElement}
	 */
	this.resultsParamsContainer_ = null;

	/**
	 * Container of the results to scroll
	 * @private
	 * @type {HTMLElement}
	 */
	this.resultsScrollContainer_ = null;

	/**
	 * Searching result
	 * @private
	 * @type {HTMLElement}
	 */
	this.searchingRCResult_ = null;

	/**
	 * Searching result
	 * @private
	 * @type {HTMLElement}
	 */
	this.searchingParamsResult_ = null;

	/**
	 * Timestamp of the search to abort old requests
	 * @private
	 * @type {Nunber}
	 */
	this.searchTime_ = 0;

	/**
	 * Results of the search
	 * @private
	 * @type {Array<Object>}
	 */
	this.rcResults_ = [];

	/**
	 * Results of the search
	 * @private
	 * @type {Array<Object>}
	 */
	this.paramsResults_ = [];

	/**
	 * Flag that indicates the scroll is up
	 * @private
	 * @type {Boolean}
	 */
	this.scrollIsUp_ = true;

	/**
	 * Draggable panel to show results
	 * @private
	 * @type {Object}
	 */
	this.draggablePanel = null;

	/**
	 * Indicates if the panel is minimized
	 * @private
	 * @type {Boolean}
	 */
	this.panelMinimized = false;

	this.layer_ = new M.layer.GeoJSON({
		name: 'Localizador Catastral',
		crs: "25830"
	});

	/**
	 * Main control's html element 
	 * @private
	 * @type {HTMLElement}
	 */
	this.element_ = null;

	// 3. calls super constructor (scope, implementation, controlName)
	goog.base(this, impl, M.control.catastroSearchButtonControl.NAME);
});
goog.inherits(M.control.catastroSearchButtonControl, M.Control);

/**
 * This function creates the view
 *
 * @public
 * @function
 * @param {M.Map} map to add the control
 * @api stable
 */
M.control.catastroSearchButtonControl.prototype.createView = function (map) {

	var this_ = this;
	this.facadeMap_ = map;
	// La capa de resultados, no visible en el TOC
	this.facadeMap_.addLayers(this.layer_);
	this.layer_.displayInLayerSwitcher = false;
	return new Promise(function (success, fail) {
		M.template.compile(M.control.catastroSearchButtonControl.TEMPLATE, {
		}).then(function (html) {
			this_.setStyle(html, this_.options);
			this_.element_ = html;
			this_.createCatastroPanel();
			this_.addEvents(this_.element_);
			this_.togglePanel();
			success(html);
		});
	});
};

/**
 * This function adds events listeners to html elements
 *
 * @public
 * @function
 * @param {HTMLElement} element - 
 * @api stable
 */
M.control.catastroSearchButtonControl.prototype.addEvents = function (html) {
	var this_ = this;
	this.element_ = html;
			
	// results container
	this_.resultsRCContainer_ = this_.element_.querySelector('div#m-searchRC-results');
	this_.searchingRCResult_ = this_.element_.querySelector('div#m-searchRC-results > div#m-searching-result-searchRC');
	this_.resultsParamsContainer_ = this_.element_.querySelector('div#m-searchParams-results');
	this_.searchingParamsResult_ = this_.element_.querySelector('div#m-searchParams-results > div#m-searching-result-searchParams');
};

/**
 * This function compiles the template and makes a panel
 *
 * @public
 * @function
 * @api stable
 */
M.control.catastroSearchButtonControl.prototype.createCatastroPanel = function () {
	var searchRCContainer = this.element_.querySelector('div#m-searchRC-container');
	var searchParamsContainer = this.element_.querySelector('div#m-searchParams-container');
	var searchRCResults = this.element_.querySelector('div#m-searchRC-results');
	var searchParamsResults = this.element_.querySelector('div#m-searchParams-results');
	var searchRCTab = this.element_.querySelector("ul#m-tabs-catastrosearch > li:nth-child(1) > a");
	var searchParamsTab = this.element_.querySelector("ul#m-tabs-catastrosearch > li:nth-child(2) > a");
	goog.events.listen(searchRCTab, goog.events.EventType.CLICK, function () {
		if (!goog.dom.classlist.contains(searchRCTab, 'activated')) {
			goog.dom.classlist.add(searchRCTab, 'activated');
			goog.dom.classlist.remove(searchParamsTab, 'activated');
			goog.dom.classlist.add(searchRCContainer, 'show');
			goog.dom.classlist.add(searchRCResults, 'show');
			goog.dom.classlist.remove(searchParamsResults, 'show');
			goog.dom.classlist.remove(searchParamsContainer, 'show');
		}
	}, false, this);
	goog.events.listen(searchParamsTab, goog.events.EventType.CLICK, function () {
		if (!goog.dom.classlist.contains(searchParamsTab, 'activated')) {
			goog.dom.classlist.add(searchParamsTab, 'activated');
			goog.dom.classlist.remove(searchRCTab, 'activated');
			goog.dom.classlist.remove(searchRCContainer, 'show');
			goog.dom.classlist.remove(searchRCResults, 'show');
			goog.dom.classlist.add(searchParamsResults, 'show');
			goog.dom.classlist.add(searchParamsContainer, 'show');
		}
	}, false, this);

	this.inputRC_ = this.element_.getElementsByTagName('input')["m-searchRC-input"];
	goog.events.listen(this.inputRC_, goog.events.EventType.KEYUP, this.onRCSearch, false, this);

	var catstroSearch = this.element_.getElementsByTagName('button')['m-catastrosearch-button'];
	goog.events.listen(catstroSearch, goog.events.EventType.CLICK, this.activeSearch, false, this);

	var castastroInfo = this.element_.getElementsByTagName('button')['m-catastrogetinfo-button'];
	goog.events.listen(castastroInfo, goog.events.EventType.CLICK, this.activeInfo, false, this);

	var buttonClear = this.element_.getElementsByTagName('button')['m-catastroclear-button'];
	goog.events.listen(buttonClear, goog.events.EventType.CLICK, this.clearResults, false, this);

	this.selectProvincias = this.element_.getElementsByTagName('select')['m-searchParamsProvincia-select'];
	goog.events.listen(this.selectProvincias, goog.events.EventType.CHANGE, this.onProvinciaSelect, false, this);

	this.selectMunicipios = this.element_.getElementsByTagName('select')['m-searchParamsMunicipio-select'];
	this.inputPoligono = this.element_.getElementsByTagName('input')['m-searchParamsPoligono-input'];
	this.inputParcela = this.element_.getElementsByTagName('input')['m-searchParamsParcela-input'];

	var buttonRCSearch = this.element_.getElementsByTagName('button')['m-searchRC-button'];
	goog.events.listen(buttonRCSearch, goog.events.EventType.CLICK, this.onRCSearch, false, this);

	var buttonParamsSearch = this.element_.getElementsByTagName('button')['m-searchParams-button'];
	goog.events.listen(buttonParamsSearch, goog.events.EventType.CLICK, this.onParamsSearch, false, this);

	var buttonClearRC = this.element_.getElementsByTagName('button')['m-clearRC-button'];
	goog.events.listen(buttonClearRC, goog.events.EventType.CLICK, this.clearResults, false, this);

	var buttonClearParams = this.element_.getElementsByTagName('button')['m-clearParams-button'];
	goog.events.listen(buttonClearParams, goog.events.EventType.CLICK, this.clearResults, false, this);
};

/**
 * This function set user defined style options to button
 *
 * @public
 * @function
 * @api stable
 */
M.control.catastroSearchButtonControl.prototype.setStyle = function (html, options) {
	if (!M.utils.isUndefined(options.tooltip) && !M.utils.isNullOrEmpty(options.tooltip)) {
		html.querySelector("button").setAttribute("title", options.tooltip);
	}
	if (!M.utils.isUndefined(options.icon) && !M.utils.isNullOrEmpty(options.icon)) {
		html.querySelector("button").setAttribute("class", options.icon);
	}
	if (!M.utils.isUndefined(options.order) && !M.utils.isNullOrEmpty(options.order)) {
		html.querySelector("button").parentNode.style.order = options.order;
	}
};

/**
 * Set search control active
 *
 * @public
 * @function
 * @api stable
 */
M.control.catastroSearchButtonControl.prototype.activeSearch = function () {
	// desactivamos el catastrogetinfo
	this.deactivate();
	this.togglePanel();
};

/**
 * Set catastro info button active
 *
 * @public
 * @function
 * @api stable
 */
M.control.catastroSearchButtonControl.prototype.activeInfo = function () {
	if(this.panelMinimized === false){
		this.togglePanel();
	}
	this.activate();
};

/**
 * This function adds clear and close events listener to element
 *
 * @public
 * @function
 * @param {HTMLElement} element
 * @api stable
 * @export
 */
M.control.catastroSearchButtonControl.prototype.addClearEvents = function (element) {
	this.on(M.evt.COMPLETED, function () {
		goog.dom.classlist.add(element,
			"shown");
	}, this);

	var buttonClearRC = element.getElementsByTagName('button')['m-clearRC-button'];
	goog.events.listen(buttonClearRC, goog.events.EventType.CLICK, this.clearResults, false, this);

	var buttonClearParams = element.getElementsByTagName('button')['m-clearParams-button'];
	goog.events.listen(buttonClearParams, goog.events.EventType.CLICK, this.clearResults, false, this);

	var buttonClose = element.getElementsByTagName('a')['dialog-close-catastro'];
	goog.events.listen(buttonClose, goog.events.EventType.CLICK, this.clearResults, false, this);
};

/**
 * This function clears result from panel
 *
 * @public
 * @function
 * @api stable
 */
M.control.catastroSearchButtonControl.prototype.clearResults = function () {
	this.clearClick_();
};

/**
 * This function checks if an object is equals
 * to this control
 *
 * @public
 * @function
 * @param {*} obj - Object to compare
 * @returns {boolean} equals - Returns if they are equal or not
 * @api stable
 */
M.control.catastroSearchButtonControl.prototype.equals = function (obj) {
	var equals = false;
	if (obj instanceof M.control.catastroSearchButtonControl) {
		equals = (this.name === obj.name);
	}
	return equals;
};


/**
 * Name to identify this control
 * @const
 * @type {string}
 * @public
 * @api stable
 */
M.control.catastroSearchButtonControl.NAME = 'catastroSearchButton';


/**
 * This function controls catastro info button activation
 *
 * @public
 * @function
 * @api stable
 */
M.control.catastroSearchButtonControl.prototype.activate = function () {

	if (this.activated) {
		this.deactivate();
	} else {
		var someCtlActive = false;
		var controls = this.facadeMap_.getControls();
		controls.some(function (control) {
			if (control.activated === true && !(control instanceof M.control.catastroSearchButtonControl)) {
				M.dialog.info('Desactive el control ' + control.name + ' antes de activar éste');
				someCtlActive = true;
				return someCtlActive;
			}
		});

		if (someCtlActive === false) {
			this.facadeMap_.on(M.evt.CLICK, this.buildUrl_, this);
			this.activated = true;
			goog.dom.classlist.add(this.element_.getElementsByTagName('button')['m-catastrogetinfo-button'], 'activated');
		}
		else {
			this.activated = false;
		}
	}
};

/**
 * This function builds the query URL and show results
 *
 * @private
 * @function
 * @param {ol.MapBrowserPointerEvent} evt - Browser point event
 */
M.control.catastroSearchButtonControl.prototype.buildUrl_ = function (evt) {

	var this_ = this;
	var options = {
		jsonp: true
	};

	var srs = this.facadeMap_.getProjection().code;

	M.remote.get(this.RCCOOR_url_,
		{ 'SRS': srs, 'Coordenada_X': evt.coord[0], 'Coordenada_Y': evt.coord[1] }).then(function (res) {
			this_.showInfoFromURL_(res, evt.coord);
		}, options);
};

/**
 * This function displays information in a popup
 *
 * @private
 * @function
 * @param {XML} response - response from the petition
 * @param {array} coordinate - Coordinate position onClick
 */
M.control.catastroSearchButtonControl.prototype.showInfoFromURL_ = function (response, coordinates) {
	var this_ = this;

	// TODO: Si existe una capa KML en el punto donde se ha pinchado, no se respetara su popup, ya
	// que las coordenadas del mismo seran las del kml, y es muy probable que no coincidan con las del
	// click, ya que para kmls se trabaja con un margen amplio de pixeles

	if ((response.code === 200) && (response.error === false)) {
		var infos = [];
		var info = response.text;
		var formatedInfo = this_.formatInfo_(info);
		infos.push(formatedInfo);

		var tab = {
			'icon': 'g-cartografia-pin',
			'title': M.control.catastroSearchButtonControl.POPUP_TITLE,
			'content': infos.join('')
		};


		var popup = this_.facadeMap_.getPopup();
		if (M.utils.isNullOrEmpty(popup)) {
			popup = new M.Popup();
			popup.addTab(tab);
			this_.facadeMap_.addPopup(popup, coordinates);
		} else {

			// Si el popup que existe esta en la misma coordenada
			// Si es un popup en la misma coordenada
			if (popup.getCoordinate()[0] == coordinates[0] && popup.getCoordinate()[1] == coordinates[1]) {
				// Vemos si tiene pestañas de otros controles
				var hasExternalContent = false;
				popup.getTabs().forEach(function (tab) {
					if (tab['title'] !== M.control.catastroSearchButtonControl.POPUP_TITLE) {
						hasExternalContent = true;
					} else {
						popup.removeTab(tab);
					}
				});
				if (hasExternalContent) {
					popup.addTab(tab);
				} else {
					// Es del mismo catastro, podemos borrarlo
					popup = new M.Popup();
					popup.addTab(tab);
					this_.facadeMap_.addPopup(popup, coordinates);
				}
			} else {
				popup = new M.Popup();
				popup.addTab(tab);
				this_.facadeMap_.addPopup(popup, coordinates);
			}
		}
	}
	else {
		this_.facadeMap_.removePopup();
		M.dialog.error('MAPEA: No es posible establecer la conexión con el servidor de Catastro');
	}
};

/**
 * This function formats the response
 *
 * @param {string} info - Information to formatting
 * @returns {string} information - Formatted information
 * @private
 * @function
 */
M.control.catastroSearchButtonControl.prototype.formatInfo_ = function (info) {
	var parser = new DOMParser();
	var xmlDoc = parser.parseFromString(info, "text/xml");
	var ldtNode;
	var valuePopup;

	var rootElement = xmlDoc.getElementsByTagName("consulta_coordenadas")[0];
	var controlNode = rootElement.getElementsByTagName("control")[0];
	var errorCtlNode = controlNode.getElementsByTagName("cuerr")[0].childNodes[0].nodeValue;
	if (errorCtlNode == "1") {
		var errorNode = rootElement.getElementsByTagName("lerr")[0];
		var errorDesc = errorNode.getElementsByTagName("err")[0];
		var errorDescTxt = errorDesc.getElementsByTagName("des")[0].childNodes[0].nodeValue;
		valuePopup = errorDescTxt;
	}
	else {
		var coordenadasNode = rootElement.getElementsByTagName("coordenadas")[0];
		var coordNode = coordenadasNode.getElementsByTagName("coord")[0];
		var pcNode = coordNode.getElementsByTagName("pc")[0];
		var pc1Node = pcNode.getElementsByTagName("pc1")[0].childNodes[0].nodeValue;
		var pc2Node = coordNode.getElementsByTagName("pc2")[0].childNodes[0].nodeValue;

		// Obtenemos codigos de provincia y municipio
		var codProv = pc1Node.substring(0,2);
		var codMun = pc1Node.substring(2,5);

		ldtNode = coordNode.getElementsByTagName("ldt")[0].childNodes[0].nodeValue;
		valuePopup = pc1Node + pc2Node;
	}

	//TODO Sacar a variable la url
	var link = 'https://www1.sedecatastro.gob.es/CYCBienInmueble/OVCConCiud.aspx?del=' + codProv + '&mun=' + codMun + '&UrbRus=&RefC=' + valuePopup + '&Apenom=&esBice=&RCBice1=&RCBice2=&DenoBice=';

	var formatedInfo = M.utils.beautifyAttribute("Información Catastral");
	formatedInfo += "<div class=\"divinfo\">";
	formatedInfo += "<table class=\"mapea-table\"><tbody><tr><td class=\"header\" colspan=\"4\"></td></tr>";
	formatedInfo += '<tr><td class="key"><b>';
	formatedInfo += M.utils.beautifyAttribute("Referencia catastral");
	formatedInfo += '</b></td><td class="value"></b>';
	formatedInfo += "<a href='" + link + "' target='_blank'>" + valuePopup + "</a>";
	formatedInfo += "</td></tr>";
	formatedInfo += '<tr><td class="key"><b>';
	formatedInfo += M.utils.beautifyAttribute("Descripción");
	formatedInfo += '</b></td><td class="value">';
	formatedInfo += ldtNode;
	formatedInfo += "</td></tr>";
	formatedInfo += "</tbody></table></div>";

	return formatedInfo;
};

/**
 * Deactivate catastrogetinfo button control
 *
 * @public
 * @function
 * @api stable
 */
M.control.catastroSearchButtonControl.prototype.deactivate = function () {
	this.facadeMap_.removePopup();
	this.facadeMap_.un(M.evt.CLICK, this.buildUrl_, this);
	this.activated = false;
	goog.dom.classlist.remove(this.element_.getElementsByTagName('button')['m-catastrogetinfo-button'], 'activated');
};

/**
 * Toggle panel
 *
 * @public
 * @function
 * @api stable
 */
M.control.catastroSearchButtonControl.prototype.togglePanel = function () {
	var panelContent = this.element_.querySelector('.m-tabs-catastrosearch-container');
	if (this.panelMinimized === false) {
		this.panelMinimized = true;
		panelContent.style.display = "none";
		goog.dom.classlist.remove(this.element_.getElementsByTagName('button')['m-catastrosearch-button'], 'activated');
	} else {
		this.panelMinimized = false;
		panelContent.style.display = "inline";
		goog.dom.classlist.add(this.element_.getElementsByTagName('button')['m-catastrosearch-button'], 'activated');
	}
};

/**
 * Handler for search with RC button
 *
 * @public
 * @function
 * @api stable
 */
M.control.catastroSearchButtonControl.prototype.onRCSearch = function (evt) {
	evt.preventDefault();

	if ((evt.type !== goog.events.EventType.KEYUP) || (evt.keyCode === 13)) {
		var inputRC = this.inputRC_.value;
		if (M.utils.isNullOrEmpty(inputRC)) {
			M.dialog.info('Debe introducir una referencia catastral');
		}
		else {
			inputRC = inputRC.substr(0, 14);

			var searchUrl = M.utils.addParameters(this.CPMRC_url_, {
				'Provincia': '',
				'Municipio': '',
				'SRS': this.facadeMap_.getProjection().code,
				'RC': inputRC
			});
			this.search_(searchUrl, this.resultsRCContainer_, this.searchingRCResult_, this.showResults_);
		}
	}
};

/**
 * Handler for search with params button
 *
 * @public
 * @function
 * @api stable
 */
M.control.catastroSearchButtonControl.prototype.onParamsSearch = function (evt) {
	evt.preventDefault();

	if ((evt.type !== goog.events.EventType.KEYUP) || (evt.keyCode === 13)) {
		if (M.utils.isNullOrEmpty(this.selectProvincias.value) || this.selectProvincias.value === "0") {
			M.dialog.info('Debe seleccionar una provincia');
			return;
		}
		if (M.utils.isNullOrEmpty(this.selectMunicipios.value) || this.selectMunicipios.value === "0") {
			M.dialog.info('Debe seleccionar un municpio');
			return;
		}
		if (M.utils.isNullOrEmpty(this.inputPoligono.value)) {
			M.dialog.info('Debe introducir un polígono');
			return;
		}
		if (M.utils.isNullOrEmpty(this.inputParcela.value)) {
			M.dialog.info('Debe introducir una parcela');
			return;
		}

		var searchUrl = M.utils.addParameters(this.DNPPP_url_, {
			'CodigoProvincia': this.selectProvincias.value,
			'CodigoMunicipio': this.selectMunicipios.value,
			'CodigoMunicipioINE': '',
			'Poligono': this.inputPoligono.value,
			'Parcela': this.inputParcela.value
		});
		this.search_(searchUrl, this.resultsParamsContainer_, this.searchingParamsResult_, this.showResults_);
	}
};

/**
 * Do the GET petition to search
 *
 * @private
 * @function
 */
M.control.catastroSearchButtonControl.prototype.search_ = function (searchUrl, container, searchingResult, processor) {
	goog.dom.appendChild(container, searchingResult);
	goog.dom.classlist.add(this.element_, M.control.catastroSearchButtonControl.SEARCHING_CLASS);

	var this_ = this;
	M.remote.get(searchUrl).then(function (response) {
		var success = this_.acceptOVCSW(response);
		if (success) {
			processor.call(this_, response.xml, container);
		}
		goog.dom.classlist.remove(this_.element_, M.control.catastroSearchButtonControl.SEARCHING_CLASS);
	});
};

/**
 * Checks if response is valid
 *
 * @private
 * @function
 */
M.control.catastroSearchButtonControl.prototype.acceptOVCSW = function (response) {
	var this_ = this;
	var success = true;
	try {
		if ((response.code === 200) && (response.error === false)) {
			var results = response.xml;
			var rootElement = results.childNodes[0];
			var controlNode = rootElement.getElementsByTagName("control")[0];
			var errorCtlNode = controlNode.getElementsByTagName("cuerr")[0];
			var cuerr = "0";
			if (errorCtlNode !== undefined) {
				cuerr = errorCtlNode.childNodes[0].nodeValue;
			}
			if (cuerr == "1") {
				var errorNode = rootElement.getElementsByTagName("lerr")[0];
				var errorDesc = errorNode.getElementsByTagName("err")[0];
				var errorDescTxt = errorDesc.getElementsByTagName("des")[0].childNodes[0].nodeValue;
				goog.dom.classlist.remove(this_.element_, M.control.catastroSearchButtonControl.SEARCHING_CLASS);
				success = false;
				M.dialog.info(errorDescTxt);
			}
		}
		else {
			success = false;
			M.dialog.error('MAPEA: No es posible establecer la conexión con el servidor de Catastro');
		}
	}
	catch (err) {
		success = false;
		M.exception('La respuesta no es un JSON válido: ' + err);
	}
	return success;
};

/**
 * Parses CPMRC results
 *
 * @private
 * @function
 */
M.control.catastroSearchButtonControl.prototype.parseCPMRCResults = function (xmlResults) {
	var rootElement = xmlResults.getElementsByTagName("consulta_coordenadas")[0];
	var coordenadasNode = rootElement.getElementsByTagName("coordenadas")[0];
	var coordNode = coordenadasNode.getElementsByTagName("coord")[0];

	var pcNode = coordNode.getElementsByTagName("pc")[0];
	var pc1Node = pcNode.getElementsByTagName("pc1")[0].childNodes[0].nodeValue;
	var pc2Node = pcNode.getElementsByTagName("pc2")[0].childNodes[0].nodeValue;

	var geoNode = coordNode.getElementsByTagName("geo")[0];
	var xcenNode = geoNode.getElementsByTagName("xcen")[0].childNodes[0].nodeValue;
	var ycenNode = geoNode.getElementsByTagName("ycen")[0].childNodes[0].nodeValue;
	var srsNode = geoNode.getElementsByTagName("srs")[0].childNodes[0].nodeValue;

	var ldtNode = coordNode.getElementsByTagName("ldt")[0].childNodes[0].nodeValue;

	return {
		'attributes': [
			{ 'key': 'Referencia Catastral', 'value': pc1Node + pc2Node },
			{ 'key': 'Descripción', 'value': ldtNode }
		],
		'rcId': 'rc_' + pc1Node + pc2Node,
		'coords': [
			{ 'xcen': xcenNode, 'ycen': ycenNode, 'srs': srsNode }
		]
	};
};


/**
 * This function parses results and compiles template
 * with vars to show results
 *
 * @private
 * @function
 */
M.control.catastroSearchButtonControl.prototype.showResults_ = function (results, container) {
	// eliminamos los posibles features existentes de busquedas anteriores
	this.getLayer().clear();

	var this_ = this;
	var resultsTemplateVars = {};
	if (container === this.resultsRCContainer_) {
		resultsTemplateVars = this.parseRCResultsForTemplate_(results, false);
	}
	else if (container === this.resultsParamsContainer_) {
		resultsTemplateVars = this.parseParamsResultsForTemplate_(results, false);
	}

	Promise.resolve(resultsTemplateVars).then(function (template) {
		this_.drawResults(template);
		M.template.compile(M.control.catastroSearchButtonControl.RESULTS_TEMPLATE, {
			'vars': template
		}).then(function (html) {
			goog.dom.classlist.remove(container, M.control.catastroSearchButtonControl.HIDDEN_RESULTS_CLASS);
			// results
			var resultsHtmlElements = container.querySelectorAll(".result");
			var resultHtml;
			for (let i = 0, ilen = resultsHtmlElements.length; i < ilen; i++) {
				resultHtml = resultsHtmlElements.item(i);
				goog.events.unlisten(resultHtml, goog.events.EventType.CLICK, this_.resultClick_, false, this_);
			}

			this_.zoomToResults();

			// results button
			var btnResults = container.querySelector('div.page > div.g-cartografia-flecha-arriba');
			if (!M.utils.isNullOrEmpty(btnResults)) {
				goog.events.unlisten(btnResults, goog.events.EventType.CLICK, this_.resultsClick_, false, this_);
			}

			// gets the new results scroll
			container.innerHTML = html.innerHTML;
			this_.resultsScrollContainer_ = container.querySelector("div#m-catastro-results-scroll");
			this_.resultsScrollContainer_.scrollIntoView(false);
			// adds new events
			resultsHtmlElements = container.getElementsByClassName("result");
			for (let i = 0, ilen = resultsHtmlElements.length; i < ilen; i++) {
				resultHtml = resultsHtmlElements.item(i);
				goog.events.listen(resultHtml, goog.events.EventType.CLICK, this_.resultClick_, false, this_);
			}
			this_.fire(M.evt.COMPLETED);
		});
	});
};

/**
 * This function parses results from RC search for template
 *
 * @private
 * @function
 */
M.control.catastroSearchButtonControl.prototype.parseRCResultsForTemplate_ = function (results, append) {
	var docs = this.parseCPMRCResults(results);
	if (append === true) {
		this.rcResults_.unshift(docs);
	}
	else {
		this.rcResults_ = [docs];
	}

	return {
		'docs': this.rcResults_,
		'total': this.rcResults_.length,
		'partial': false,
		'notResutls': false,
		'query': this.inputRC_.value
	};
};

/**
 * This function parses results from params search for template
 *
 * @private
 * @function
 */
M.control.catastroSearchButtonControl.prototype.parseParamsResultsForTemplate_ = function (results, append) {
	var this_ = this;
	var rootElement = results.getElementsByTagName("consulta_dnp")[0];
	var descripcion = "N/A";
	var rcNode;
	var cnValue = "UR";
	var lrcdnpNode = rootElement.getElementsByTagName("lrcdnp");

	if (lrcdnpNode.length > 0) {
		var rcdnpNode = lrcdnpNode[0].getElementsByTagName("rcdnp")[0];
		rcNode = rcdnpNode.getElementsByTagName("rc")[0];
		var dtNode = rcdnpNode.getElementsByTagName("dt")[0];
		var npNode = dtNode.getElementsByTagName("np")[0].childNodes[0].nodeValue;
		var nmNode = dtNode.getElementsByTagName("nm")[0].childNodes[0].nodeValue;
		var locsNode = dtNode.getElementsByTagName("locs")[0];
		var lorsNode = locsNode.getElementsByTagName("lors")[0];
		var lorusNode = lorsNode.getElementsByTagName("lorus")[0];
		var npaNode = lorusNode.getElementsByTagName("npa")[0].childNodes[0].nodeValue;
		var cpajNode = lorusNode.getElementsByTagName("cpaj")[0].childNodes[0].nodeValue;
		descripcion = npaNode + " " + cpajNode + ". " + nmNode + " (" + npNode + ")";
	}
	else {
		var bicoNode = rootElement.getElementsByTagName("bico")[0];
		var biNode = bicoNode.getElementsByTagName("bi")[0];
		var idbiNode = biNode.getElementsByTagName("idbi")[0];
		cnValue = idbiNode.getElementsByTagName("cn")[0].childNodes[0].nodeValue;
		rcNode = idbiNode.getElementsByTagName("rc")[0];
		descripcion = biNode.getElementsByTagName("ldt")[0].childNodes[0].nodeValue;
	}

	var pc1Value = rcNode.getElementsByTagName("pc1")[0].childNodes[0].nodeValue;
	var pc2Value = rcNode.getElementsByTagName("pc2")[0].childNodes[0].nodeValue;
	var paramsId = this.selectProvincias.value + this.selectMunicipios.value + this.inputPoligono.value + this.inputParcela.value;
	var searchUrl = M.utils.addParameters(this.CPMRC_url_, {
		'Provincia': '',
		'Municipio': '',
		'SRS': this.facadeMap_.getProjection().code,
		'RC': pc1Value + pc2Value
	});

	return M.remote.get(searchUrl).then(function (response) {
		var success = this_.acceptOVCSW(response);
		if (success) {
			var docsRC = this_.parseCPMRCResults(response.xml);
			var xcen = docsRC.coords[0].xcen;
			var ycen = docsRC.coords[0].ycen;
			var srs = docsRC.coords[0].srs;
			var docs = {
				'attributes': [
					{ 'key': 'Referencia Catastral', 'value': pc1Value + pc2Value },
					{ 'key': 'Descripción', 'value': descripcion },
					{ 'key': 'Tipo', 'value': cnValue }
				],
				'paramsId': paramsId,
				'rcId': 'rc_' + pc1Value + pc2Value,
				'coords': [
					{ 'xcen': xcen, 'ycen': ycen, 'srs': srs }
				]
			};

			if (append === true) {
				this_.paramsResults_.unshift(docs);
			}
			else {
				this_.paramsResults_ = [docs];
			}

			return {
				'docs': this_.paramsResults_,
				'total': this_.paramsResults_.length,
				'partial': false,
				'notResutls': false,
				'query': pc1Value + pc2Value
			};
		}
	});
};

/**
 * Handler for click on result button
 *
 * @private
 * @function
 */
M.control.catastroSearchButtonControl.prototype.resultClick_ = function (evt) {
	evt.preventDefault();
	// hidden results on click for mobile devices
	if (M.window.WIDTH <= M.config.MOBILE_WIDTH) {
		// TODO?
		//evt.target = this.facadeMap_.getContainer().querySelector('div.page > div.g-cartografia-flecha-arriba');
		//this.resultsClick_(evt);
	}
	this.facadeMap_.removePopup();
	var rcId = evt.currentTarget.id;
	this.resultClick(rcId);
};

/**
 * Handler for click on clear button
 *
 * @private
 * @function
 */
M.control.catastroSearchButtonControl.prototype.clearClick_ = function () {
	goog.dom.classlist.remove(this.element_, "shown");
	if (!M.utils.isNullOrEmpty(this.inputRC_)) {
		this.inputRC_.value = '';
	}
	if (!M.utils.isNullOrEmpty(this.selectProvincias)) {
		this.selectProvincias.value = '0';
	}
	if (!M.utils.isNullOrEmpty(this.selectMunicipios)) {
		this.selectMunicipios.value = '0';
	}
	if (!M.utils.isNullOrEmpty(this.inputPoligono)) {
		this.inputPoligono.value = '';
	}
	if (!M.utils.isNullOrEmpty(this.inputParcela)) {
		this.inputParcela.value = '';
	}
	if (!M.utils.isNullOrEmpty(this.resultsRCContainer_)) {
		this.resultsRCContainer_.innerHTML = '';
	}
	if (!M.utils.isNullOrEmpty(this.resultsParamsContainer_)) {
		this.resultsParamsContainer_.innerHTML = '';
	}
	if (!M.utils.isNullOrEmpty(this.resultsScrollContainer_)) {
		this.resultsScrollContainer_.innerHTML = '';
		this.resultsScrollContainer_ = null;
	}
	if (!M.utils.isNullOrEmpty(this.rcResults_)) {
		this.rcResults_.length = 0;
	} else {
		this.rcResults_ = [];
	}
	if (!M.utils.isNullOrEmpty(this.paramsResults_)) {
		this.paramsResults_.length = 0;
	} else {
		this.paramsResults_ = [];
	}
	goog.dom.classlist.remove(this.resultsRCContainer_, M.control.catastroSearchButtonControl.HIDDEN_RESULTS_CLASS);
	goog.dom.classlist.remove(this.resultsParamsContainer_, M.control.catastroSearchButtonControl.HIDDEN_RESULTS_CLASS);
	this.clear();
};

/**
 * Handler for click on results button
 *
 * @private
 * @function
 */
M.control.catastroSearchButtonControl.prototype.resultsClick_ = function (evt) {
	goog.dom.classlist.add(this.facadeMap_._areasContainer.getElementsByClassName("m-top m-right")[0], "top-extra-search");
	goog.dom.classlist.toggle(evt.target, 'g-cartografia-flecha-arriba');
	goog.dom.classlist.toggle(evt.target, 'g-cartografia-flecha-abajo');
	goog.dom.classlist.toggle(this.resultsRCContainer_, M.control.catastroSearchButtonControl.HIDDEN_RESULTS_CLASS);
	goog.dom.classlist.toggle(this.resultsParamsContainer_, M.control.catastroSearchButtonControl.HIDDEN_RESULTS_CLASS);
};

/**
 * Handler for selecting an option on Provincia select
 *
 * @public
 * @function
 * @api stable
 */
M.control.catastroSearchButtonControl.prototype.onProvinciaSelect = function (e) {
	var this_ = this;
	var elt = e.target;
	var cod_prov = elt.value;
	if (cod_prov !== "0") {
		M.remote.get(this.ConsultaMunicipioCodigos_,
			{ 'CodigoProvincia': cod_prov, 'CodigoMunicipio': "", 'CodigoMunicipioIne': "" }).then(function (res) {
				this_.loadMunicipiosSelect(res);
			});
	}
	else {
		this.clearMunicipiosSelect();
	}
};

/**
 * Clears options set to Municipios select
 *
 * @public
 * @function
 * @api stable
 */
M.control.catastroSearchButtonControl.prototype.clearMunicipiosSelect = function () {
	var select = this.element_.getElementsByTagName('select')['m-searchParamsMunicipio-select'];
	while (select.firstChild) {
		select.removeChild(select.firstChild);
	}
	var option = goog.dom.createElement("option");
	option.value = "0";
	option.innerHTML = "Seleccione un municipio";
	select.appendChild(option);
};

/**
 * Loads and renders options set to Municipios select
 *
 * @public
 * @function
 * @api stable
 */
M.control.catastroSearchButtonControl.prototype.loadMunicipiosSelect = function (response) {
	if ((response.code === 200) && (response.error === false)) {
		var rootElement = response.xml.getElementsByTagName("consulta_municipiero")[0];
		var rootMunicipios = rootElement.getElementsByTagName("municipiero")[0];
		var muniNodes = rootMunicipios.getElementsByTagName("muni");
		var select = this.element_.getElementsByTagName('select')['m-searchParamsMunicipio-select'];
		this.clearMunicipiosSelect();
		for (let i = 0; i < muniNodes.length; i++) {
			var option = goog.dom.createElement("option");
			var locat = muniNodes[i].getElementsByTagName("locat")[0];
			option.value = locat.getElementsByTagName("cmc")[0].childNodes[0].nodeValue;
			option.innerHTML = muniNodes[i].getElementsByTagName("nm")[0].childNodes[0].nodeValue;
			select.appendChild(option);
		}
	}
	else {
		M.dialog.error('MAPEA: No es posible establecer la conexión con el servidor de Catastro');
	}
};

/**
 * This function checks if an object is equals
 * to this control
 *
 * @public
 * @function
 * @param {*} obj - Object to compare
 * @returns {boolean} equals - Returns if they are equal or not
 * @api stable
 */
M.control.catastroSearchButtonControl.prototype.equals = function (obj) {
	var equals = false;
	if (obj instanceof M.control.catastroSearchButtonControl) {
		equals = (this.name === obj.name);
	}
	return equals;
};

/**
 * This function destroys this plugin
 *
 * @public
 * @function
 * @api stable
 */
M.control.catastroSearchButtonControl.prototype.destroy = function () {
	this.destroy();
};

/**
 * Name of searching css class
 * @const
 * @type {string}
 * @public
 * @api stable
 */
M.control.catastroSearchButtonControl.SEARCHING_CLASS = 'm-searching';

/**
 * Name of hidden css class
 * @const
 * @type {string}
 * @public
 * @api stable
 */
M.control.catastroSearchButtonControl.HIDDEN_RESULTS_CLASS = 'hidden';

/**
 * Title for the popup
 * @const
 * @type {string}
 * @public
 * @api stable
 */
M.control.catastroSearchButtonControl.POPUP_TITLE = 'Información catastral';

/**
 * Template for this controls - results
 * @const
 * @type {string}
 * @public
 * @api stable
 */
M.control.catastroSearchButtonControl.RESULTS_TEMPLATE = 'catastroresults.html';
//M.control.catastroSearchButtonControl.RESULTS_TEMPLATE = '../src/catastro/templates/catastroresults.html';

/**
 * Template for this controls
 * @const
 * @type {string}
 * @public
 * @api stable
 */
M.control.catastroSearchButtonControl.TEMPLATE = 'catastro.html';
//M.control.catastroSearchButtonControl.TEMPLATE = '../src/catastro/templates/catastro.html';


/**
 * This function draws the results into the specified map
 *
 * @public
 * @function
 * @param {Array<Object>} results to draw
 * @api stable
 */
M.control.catastroSearchButtonControl.prototype.drawResults = function (results) {
	var docs = [];

	if (M.utils.isNullOrEmpty(docs)) {
		docs = results.docs;
	}

	var features = docs.map(function (doc) {

		var xcenNode = doc.coords[0].xcen;
		var ycenNode = doc.coords[0].ycen;

		var attributes = {};
		doc.attributes.forEach(function (element) {
			attributes[element.key] = element.value;
		});
		var feature = new M.Feature(doc.rcId, {
			"type": "Feature",
			"geometry": {
				"type": "Point",
				"coordinates": [xcenNode, ycenNode]
			},
			"properties": attributes
		});

		return feature;
	}, this);
	//TODO: Aplicar estilo a capa Catastro? se puede cambiar desde fuera
	this.layer_.addFeatures(features);
};

/**
 * This function zooms the view to the results on layer
 *
 * @public
 * @function
 * @param {M.Map} map to add the control
 * @api stable
 */
M.control.catastroSearchButtonControl.prototype.zoomToResults = function () {

	var bbox = this.layer_.getFeaturesExtent();

	this.facadeMap_.removePopup();
	this.facadeMap_.setBbox(bbox);
};

/**
 * This function returns the layer used
 *
 * @public
 * @function
 * @returns {ol.layer.Vector}
 * @api stable
 */
M.control.catastroSearchButtonControl.prototype.getLayer = function () {
	return this.layer_;
};

/**
 * TODO
 *
 * @public
 * @function
 * @param {M.Map} map to add the control
 * @api stable
 */
M.control.catastroSearchButtonControl.prototype.resultClick = function (rcid) {

	var feature = this.layer_.getFeatureById(rcid);
	this.selectedFeatures_ = [feature];

	var featureGeom = feature.getGeometry();
	var coord = featureGeom.coordinates;

	this.unselectResults();
	this.selectFeatures([feature], coord, true);

	this.facadeMap_.setCenter(coord);
	this.facadeMap_.setZoom(15);
};

/**
 * This function clears the layer
 *
 * @public
 * @function
 * @param {M.Map} map to add the control
 * @api stable
 */
M.control.catastroSearchButtonControl.prototype.clear = function () {
	this.facadeMap_.removePopup();
	this.layer_.clear();
};

/**
 * This function checks if an object is equals
 * to this layer
 * @public
 * @function
 * @param {ol.Feature} feature
 * @api stable
 */
M.control.catastroSearchButtonControl.prototype.selectFeatures = function (features, coord, noPanMapIfOutOfView) {
	// unselects previous features
	this.unselectResults();

	// sets the style
	this.selectedFeatures_ = features;

	var featureForTemplate = this.parseFeaturesForTemplate_(features);
	var this_ = this;
	M.template.compile(M.control.catastroSearchButtonControl.POPUP_RESULT, {
		'jsonp': false,
		'vars': featureForTemplate,
		'parseToHtml': false
	}).then(function (htmlAsText) {
		var featureTabOpts = {
			'icon': 'g-cartografia-pin',
			'title': M.control.catastroSearchButtonControl.POPUP_TITLE,
			'content': htmlAsText
		};
		var popup = this_.facadeMap_.getPopup();
		if (M.utils.isNullOrEmpty(popup)) {
			popup = new M.Popup({
				'panMapIfOutOfView': !noPanMapIfOutOfView,
				'ani': null
			});
			popup.addTab(featureTabOpts);
			this_.facadeMap_.addPopup(popup, coord);
		} else {
			popup.addTab(featureTabOpts);
		}
		// removes events on destroy
		popup.on(M.evt.DESTROY, function () {
			this_.unselectResults(true);
		}, this_);
	});
};

/**
	 * This function checks if an object is equals
	 * to this control
	 *
	 * @private
	 * @function
	 */
M.control.catastroSearchButtonControl.prototype.parseFeaturesForTemplate_ = function (features) {
	var featuresTemplate = {
		'features': []
	};

	features.forEach(function (feature) {
		var attributes = [];
		var properties = feature.getAttributes();
		for (var key in properties) {
			attributes.push({ "key": key, "value": properties[key] });
		}
		var featureTemplate = {
			'attributes': attributes
		};
		featuresTemplate.features.push(featureTemplate);
	});
	return featuresTemplate;
};


/**
 * TODO
 *
 * @public
 * @function
 * @param {boolean} keepPopup to draw
 * @api stable
 */
M.control.catastroSearchButtonControl.prototype.unselectResults = function (keepPopup) {
	if (this.selectedFeatures_.length > 0) {
		this.selectedFeatures_.length = 0;
		// removes the popup just when event destroy was not fired
		if (!keepPopup) {
			this.facadeMap_.removePopup();
		}
	}
};

/**
 * This function destroys this control, clearing the HTML
 * and unregistering all events
 *
 * @public
 * @function
 * @api stable
 */
M.control.catastroSearchButtonControl.prototype.destroy = function () {
	this.clear();
	goog.dom.classlist.remove(this.facadeMap_._areasContainer.getElementsByClassName("m-top m-right")[0],
		"top-extra");
	this.facadeMap_.getMapImpl().removeControl(this);
	this.facadeMap_ = null;
	this.layer_ = null;
};

/**
 * Template for this controls - popup results
 * @const
 * @type {string}
 * @public
 * @api stable
 */
M.control.catastroSearchButtonControl.POPUP_RESULT = "catastrofeaturepopup.html";
//M.control.catastroSearchButtonControl.POPUP_RESULT = "../src/catastro/templates/catastrofeaturepopup.html";