goog.provide('P.impl.control.catastroSearchButtonControl');


/**
 * @classdesc
 * Main constructor of the class. Creates a catastroSearchButtonControl
 * control
 *
 * @constructor
 * @extends {M.impl.Control}
 * @api stable
 */
M.impl.control.catastroSearchButtonControl = function() {

	/**
	 * Facade of the map
	 * @private
	 * @type {M.Map}
	 */
	this.facadeMap = null;
	
	/**
	 * Facade of the map
	 * @private
	 * @type {M.Map}
	 */
	//this.olMap = null;
	
	/**
	 * Facade of the map
	 * @private
	 * @type {M.Map}
	 */
	this.element_ = null;

	goog.base(this);
};

goog.inherits(M.impl.control.catastroSearchButtonControl, M.impl.Control);

/**
 * This function adds the control to the specified map
 *
 * @public
 * @function
 * @param {M.Map} map to add the plugin
 * @param {HTMLElement} html of the plugin
 * @api stable
 */
M.impl.control.catastroSearchButtonControl.prototype.addTo = function(map, html) {
	goog.base(this, 'addTo', map, html);
};

// Ocurre al activar en el botón
/*M.impl.control.catastroSearchButtonControl.prototype.activate = function() {
	//M.dialog.info('Hello World!');
 };*/
 
 // Ocurre al desactivar
 /*M.impl.control.catastroSearchButtonControl.prototype.deactivate = function() {
	//M.dialog.info('Bye World!');
 };*/
