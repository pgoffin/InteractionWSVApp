



class Measurements {

  /**
  * Gets the bbox of the entity
  * @param  {DOM Element or jQuery object} anEntity - either the DOM element or the jQuery object
  * @return {DOMRect} - the bounding box (minimum: top, left, width, height) with respect to the document and not the viewport
  */
  static get_BBox_entity(aWSV) {

    let theBbox = { left: 0,
                    top: 0,
                    right: 0,
                    bottom: 0,
                    width: 0,
                    height: 0};

    let theEntity;
    if (aWSV instanceof jQuery) {
      theEntity = aWSV.children('.entity')[0];
    } else {
      theEntity = $(aWSV).children('.entity')[0];
    }


    // adapt top and bottom to give values according to the document
    let bbox = theEntity.getBoundingClientRect();

    let scrollingOffset = $(window).scrollTop();

    theBbox.left = bbox.left;
    theBbox.top = bbox.top + scrollingOffset;
    theBbox.right = bbox.right;
    theBbox.bottom = bbox.bottom + scrollingOffset;
    theBbox.width = bbox.width;
    theBbox.height = bbox.height;

    return theBbox;
  }


  static get_BBox_wsv(aWSV, thePositionType) {

    let theBbox = { left: 0,		// x_topLeftCorner
                    top: 0,			// y_topLeftCorner
                    right: 0,		// x_bottomRightCorner
                    bottom: 0,		// y_bottomRightCorner
                    width: 0,
                    height: 0};

    let theWSV;
    if (aWSV instanceof jQuery) {
      theWSV = aWSV[0];
    } else {
      theWSV = $(aWSV)[0];
    }

    // adapt top and bottom to give values according to the document
    let bboxWSV = theWSV.getBoundingClientRect();

    let scrollingOffset = $(window).scrollTop();

    let bboxEntity = this.get_BBox_entity(theWSV);
    let bboxSparkline = this.get_BBox_sparkline(theWSV);

    if (thePositionType === 'right') {
      theBbox.left = bboxEntity.left;
      theBbox.top = bboxWSV.top + scrollingOffset;
      theBbox.right = bboxSparkline.right;
      theBbox.bottom = bboxWSV.bottom + scrollingOffset;
      theBbox.width = bboxSparkline.right - bboxEntity.left;
      theBbox.height = bboxWSV.height;

    } else {
      console.log('position type not implemented');
    }

    return theBbox;
  }


  /**
  * Gets the bbox of the sparkline
  * @param  {DOM element or jQuery object} anEntity - either the DOM element or the jQuery object
  * @return {DOMRect} - the bounding box (minimum: top, left, width, height)
  */
  static get_BBox_sparkline(aWSV): DOMRect {

    let theBbox = { left: 0,
                    top: 0,
                    right: 0,
                    bottom: 0,
                    width: 0,
                    height: 0};

    let theSparkline;
    if (aWSV instanceof jQuery) {
      theSparkline = aWSV.children('.sparkline')[0];
    } else {
      theSparkline = $(aWSV).children('.sparkline')[0];
    }

    // adapt top and bottom to give values according to the document
    let bbox = theSparkline.getBoundingClientRect();

    let scrollingOffset = $(window).scrollTop();

    theBbox.left = bbox.left;
    theBbox.top = bbox.top + scrollingOffset;
    theBbox.right = bbox.right;
    theBbox.bottom = bbox.bottom + scrollingOffset;
    theBbox.width = bbox.width;
    theBbox.height = bbox.height;

    return theBbox;
  }


  static getBodyBBox() {
    return $('body')[0].getBoundingClientRect();
  }


  static getViewportMeasurements() {
    // get the left, right, top and bottom borders of the text div for optimal visualization of wsvs, same for every layout
    let bodyBbox = this.getBodyBBox();
    let viewportDimensionsLeftRight = {left: bodyBbox.left, right: bodyBbox.right};
    let viewportDimensionsTopBottom = {top: bodyBbox.top, bottom: bodyBbox.bottom};

    let layoutInfo = {};
    if (typeof window['layoutInfo'] !== 'undefined') {
      layoutInfo.viewportLeft = viewportDimensionsLeftRight.left;
      layoutInfo.viewportRight = viewportDimensionsLeftRight.right;
      layoutInfo.viewportTop = viewportDimensionsTopBottom.top;
      layoutInfo.viewportBottom = viewportDimensionsTopBottom.bottom;
    } else {
      console.log('PROBLEM: first create the layoutInfo object.')
    }

    return layoutInfo;
  }


  /**
  * Get all the bboxes + ref to entity + centroid, use the entity as the starting point;
  * the centroid is the center of the entity
  * @param  {string} thePositionType - the position type
  * @return {object}                 - custom object with the entity, bboxes of wsv, entity, sparkline and centroid of entity
  */
  static get_allWSV_measurements(thePositionType) {

    let selector = '';
    if ($('span.entity.showInLayout').length !== 0) {
      selector = 'span.entity.showInLayout';
    } else {
      selector = 'span.entity';
    }

    let classThis = this;
    let wsv_measurements = $(selector).parents('.sparklificated').map(function() {

      let theWSVBbox = classThis.get_BBox_wsv(this, thePositionType);
      let theEntityBbox = classThis.get_BBox_entity(this);
      let theSparklineBbox = classThis.get_BBox_sparkline(this);

      let centroidEntity = {x: 0, y: 0};
      centroidEntity.x = theEntityBbox.left + (theEntityBbox.width/2.0);
      centroidEntity.y = theEntityBbox.top + (theEntityBbox.height/2.0);

      return {anEntity: $(this).children('.entity'), wsvBbox: theWSVBbox, entityBbox: theEntityBbox, sparklineBbox: theSparklineBbox, centroid: centroidEntity}
    });

    return wsv_measurements;
  }


  /**
  * A cell is where the wsv (sparkline + entity) is embedded.
  * The cell might have some padding, but the margin is not added (hidden) here
  * @return {object} - custom object with the height and width of the cell
  */
  static get_cellDimensions(arrayOfWSVMeasurementObjects) {

    // initialize the return object
    var cellDimensions = { height: 0,
                           width: 0}

    // get the max wsv height
    var cellMax_height = Math.max.apply(null, arrayOfWSVMeasurementObjects.map(function() {
      return this.wsvBbox.height;
    }));
    cellDimensions.height = cellMax_height;

    // get the max wsv width
    var cellMax_width = Math.max.apply(null, arrayOfWSVMeasurementObjects.map(function() {
      return this.wsvBbox.width;
    }));
    cellDimensions.width = cellMax_width;

    return cellDimensions;
  }


}


export default Measurements;
