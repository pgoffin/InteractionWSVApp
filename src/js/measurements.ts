



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


  /**
  * Calculates the possible number of columns/rows above and below the current entity.
  * @param  {[type]} aCurrentEntity               [description]
  * @param  {[type]} aPositionType                [description]
  * @param  {[type]} boundToWhat                  [description]
  * @param  {[type]} arrayOfWSVMeasurementObjects [description]
  * @param  {[type]} aCellWidth                   [description]
  * @param  {[type]} aCellHeight                  [description]
  * @param  {[type]} spaceBetweenGridCells        [description]
  * @return {object}      - custom object including the number of columns to the left and right, and above and below
  */
  static spaceAvailability_numberColAndRows(aCurrentEntity, aPositionType, layoutType, boundToWhat, arrayOfWSVMeasurementObjects, aCellWidth, aCellHeight, spaceBetweenGridCells) {

    //TODO layoutTpe variable not yet used, do I need to use it

    let numberColAndRows = {leftNumbColumn: 0,
                            rightNumbColumn: 0,
                            currentEntityColumn: 1,
                            aboveNumbRow: 0,
                            belowNumbRow: 0};

    let widthAvailableForInteraction = window.innerWidth;
    let heightAvailableForInteraction = window.innerHeight;

    let currentEntity_rightPosition = this.get_BBox_entity(aCurrentEntity).right
    let currentWSV_BboxDimensions = this.get_BBox_wsv(aCurrentEntity, aPositionType)
    let currentWSV_topPosition = currentWSV_BboxDimensions.top;
    let currentWSV_bottomPosition = currentWSV_BboxDimensions.bottom;
    let currentWSV_rightPosition = currentWSV_BboxDimensions.right;
    let max_entityWidth = this.get_entityMaxWidth(arrayOfWSVMeasurementObjects);
    let max_sparklineWidth = this.get_SparklineMaxWidth(arrayOfWSVMeasurementObjects);

    // these is the bbox of the text, a wsv should not go over it
    let bodyBbox = this.getBodyBBox();
    let leftBuffer = bodyBbox.left;
    let rightBuffer = widthAvailableForInteraction - bodyBbox.right;
    let topBuffer = bodyBbox.top;
    let bottomBuffer = bodyBbox.bottom;


    let availableSpace_left = 0;
    let availableSpaceForCurrentEntityColumn_left = 0;
    let numbColumnsPossible_left = 0;
    let availableSpace_right = 0;
    let numbColumnsPossible_right = 0;
    let availableSpace_above = 0;
    let numRowsPossible_above = 0;
    let availableSpace_below = 0;
    let numRowsPossible_below = 0;

    // set it to one because usually there is enough space
    let currentEntityColumn_usable = 1;

    if (layoutType === 'grid') {
      if (boundToWhat === 'middleBound') {

        // is there enough space available in the column where the current entity is
        availableSpaceForCurrentEntityColumn_left = currentEntity_rightPosition - max_entityWidth - leftBuffer;
        if (availableSpaceForCurrentEntityColumn_left < 0) {
          currentEntityColumn_usable = 0;
        }

        numberColAndRows.currentEntityColumn = currentEntityColumn_usable;
        console.log('IS IT OK: ' + numberColAndRows.currentEntityColumn);

        // how many columns available to the left
        availableSpace_left = currentEntity_rightPosition - max_entityWidth - spaceBetweenGridCells - leftBuffer;
        if (availableSpace_left < 0) {
          availableSpace_left = 0;
        }

        numbColumnsPossible_left = Math.floor(availableSpace_left / (aCellWidth + (2 * spaceBetweenGridCells)));
        numberColAndRows.leftNumbColumn = numbColumnsPossible_left;

        // how many columns available to the right
        availableSpace_right = widthAvailableForInteraction - (currentEntity_rightPosition + max_sparklineWidth + spaceBetweenGridCells) - rightBuffer;

        numbColumnsPossible_right = Math.floor(availableSpace_right / (aCellWidth + (2 * spaceBetweenGridCells)));
        numberColAndRows.rightNumbColumn = numbColumnsPossible_right;

        // how many rows available above current entity
        // top position relative to viewport
        availableSpace_above = Math.max(0, (currentWSV_topPosition - $(window).scrollTop() - spaceBetweenGridCells));

        numRowsPossible_above = Math.floor(availableSpace_above / (aCellHeight + (2 * spaceBetweenGridCells)));
        numberColAndRows.aboveNumbRow = numRowsPossible_above;

        // how many rows available below current entity
        // bottom position relative to viewport
        availableSpace_below = Math.max(0, (heightAvailableForInteraction - (currentWSV_bottomPosition - $(window).scrollTop()) - spaceBetweenGridCells));

        numRowsPossible_below = Math.floor(availableSpace_below / (aCellHeight + (2 * spaceBetweenGridCells)));
        numberColAndRows.belowNumbRow = numRowsPossible_below;

      } else if (boundToWhat === 'rightBound') {
        //TODO
      }

    } else if (layoutType === 'column') {
      if (boundToWhat === 'middleBound') {
        // how many columns available to the left
        availableSpace_left = currentEntity_rightPosition - max_entityWidth - spaceBetweenGridCells;
        if (availableSpace_left < 0) {
          availableSpace_left = 0;
        }

        // numbColumnsPossible_left = Math.floor(availableSpace_left / (aCellWidth + (2 * spaceBetweenGridCells)));
        // numberColAndRows.leftNumbColumn = numbColumnsPossible_left;
        numberColAndRows.leftNumbColumn = 0;

        // how many columns available to the right
        availableSpace_right = widthAvailableForInteraction - (currentEntity_rightPosition + max_sparklineWidth + spaceBetweenGridCells);

        // numbColumnsPossible_right = Math.floor(availableSpace_right / (aCellWidth + (2 * spaceBetweenGridCells)));
        // numberColAndRows.rightNumbColumn = numbColumnsPossible_right;
        numberColAndRows.rightNumbColumn = 0;

        // how many rows available above current entity
        availableSpace_above = Math.max(0, (currentWSV_topPosition - $(window).scrollTop() - spaceBetweenGridCells));

        numRowsPossible_above = Math.floor(availableSpace_above / (aCellHeight + (2 * spaceBetweenGridCells)));
        numberColAndRows.aboveNumbRow = numRowsPossible_above;

        // how many rows available below current entity
        availableSpace_below = Math.max(0, (heightAvailableForInteraction - (currentWSV_bottomPosition - $(window).scrollTop()) - spaceBetweenGridCells));

        numRowsPossible_below = Math.floor(availableSpace_below / (aCellHeight + (2 * spaceBetweenGridCells)));
        numberColAndRows.belowNumbRow = numRowsPossible_below;

      } else if (boundToWhat === 'rightBound') {
        //TODO
      }

    } else if (layoutType === 'column_panAligned') {
      if (boundToWhat === 'middleBound') {
        // how many columns available to the left
        availableSpace_left = currentEntity_rightPosition - max_entityWidth - spaceBetweenGridCells;
        if (availableSpace_left < 0) {
          availableSpace_left = 0;
        }

        //numbColumnsPossible_left = Math.floor(availableSpace_left / (aCellWidth + (2 * spaceBetweenGridCells)));
        // numberColAndRows.leftNumbColumn = numbColumnsPossible_left;
        numberColAndRows.leftNumbColumn = 1;

        // how many columns available to the right
        availableSpace_right = widthAvailableForInteraction - (currentEntity_rightPosition + max_sparklineWidth + spaceBetweenGridCells);

        // numbColumnsPossible_right = Math.floor(availableSpace_right / (aCellWidth + (2 * spaceBetweenGridCells)));
        // numberColAndRows.rightNumbColumn = numbColumnsPossible_right;
        numberColAndRows.rightNumbColumn = 1;

        // how many rows available above current entity
        availableSpace_above = Math.max(0, (currentWSV_topPosition - $(window).scrollTop() - spaceBetweenGridCells));

        numRowsPossible_above = Math.floor(availableSpace_above / (aCellHeight + (2 * spaceBetweenGridCells)));
        numberColAndRows.aboveNumbRow = numRowsPossible_above;

        // how many rows available below current entity
        availableSpace_below = Math.max(0, (heightAvailableForInteraction - (currentWSV_bottomPosition - $(window).scrollTop()) - spaceBetweenGridCells));

        numRowsPossible_below = Math.floor(availableSpace_below / (aCellHeight + (2 * spaceBetweenGridCells)));
        numberColAndRows.belowNumbRow = numRowsPossible_below;

      } else if (boundToWhat === 'rightBound') {
        //TODO
      }

    } else if (layoutType === 'row') {
      if (boundToWhat === 'middleBound') {
        // how many columns available to the left
        availableSpace_left = currentEntity_rightPosition - max_entityWidth - spaceBetweenGridCells - leftBuffer;
        if (availableSpace_left < 0) {
          availableSpace_left = 0;
        }

        numbColumnsPossible_left = Math.floor(availableSpace_left / (aCellWidth + (2 * spaceBetweenGridCells)));
        numberColAndRows.leftNumbColumn = numbColumnsPossible_left;

        // how many columns available to the right
        availableSpace_right = widthAvailableForInteraction - (currentEntity_rightPosition + max_sparklineWidth + spaceBetweenGridCells) - rightBuffer;

        numbColumnsPossible_right = Math.floor(availableSpace_right / (aCellWidth + (2 * spaceBetweenGridCells)));
        numberColAndRows.rightNumbColumn = numbColumnsPossible_right;

        // how many rows available above current entity
        availableSpace_above = Math.max(0, (currentWSV_topPosition - $(window).scrollTop() - spaceBetweenGridCells));
        numRowsPossible_above = Math.floor(availableSpace_above / (aCellHeight + (2 * spaceBetweenGridCells)));

        availableSpace_below = Math.max(0, (heightAvailableForInteraction - (currentWSV_bottomPosition - $(window).scrollTop()) - spaceBetweenGridCells));
        numRowsPossible_below = Math.floor(availableSpace_below / (aCellHeight + (2 * spaceBetweenGridCells)));

        if (numRowsPossible_above > 0) {
          numberColAndRows.aboveNumbRow = 1;
          numberColAndRows.belowNumbRow = 0;
        } else if (numRowsPossible_below > 0) {
          numberColAndRows.aboveNumbRow = 0;
          numberColAndRows.belowNumbRow = 1;
        }


        // how many rows available below current entity

        // numberColAndRows.belowNumbRow = numRowsPossible_below;

      } else if (boundToWhat === 'rightBound') {
        //TODO
      }

    } else if (layoutType === 'grid-no-overlap') {
      if (boundToWhat === 'middleBound') {
        // how many columns available to the left
        availableSpace_left = currentEntity_rightPosition - max_entityWidth - spaceBetweenGridCells;
        if (availableSpace_left < 0) {
          availableSpace_left = 0;
        }

        numbColumnsPossible_left = Math.floor(availableSpace_left / (aCellWidth + (2 * spaceBetweenGridCells)));
        numberColAndRows.leftNumbColumn = numbColumnsPossible_left;

        // how many columns available to the right
        availableSpace_right = widthAvailableForInteraction - (currentEntity_rightPosition + max_sparklineWidth + spaceBetweenGridCells);

        numbColumnsPossible_right = Math.floor(availableSpace_right / (aCellWidth + (2 * spaceBetweenGridCells)));
        numberColAndRows.rightNumbColumn = numbColumnsPossible_right;

        // how many rows available above current entity
        availableSpace_above = Math.max(0, (currentWSV_topPosition - $(window).scrollTop() - spaceBetweenGridCells));

        numRowsPossible_above = Math.floor(availableSpace_above / (aCellHeight + (2 * spaceBetweenGridCells)));
        numberColAndRows.aboveNumbRow = numRowsPossible_above;

        // how many rows available below current entity
        availableSpace_below = Math.max(0, (heightAvailableForInteraction - (currentWSV_bottomPosition - $(window).scrollTop()) - spaceBetweenGridCells));

        numRowsPossible_below = Math.floor(availableSpace_below / (aCellHeight + (2 * spaceBetweenGridCells)));
        numberColAndRows.belowNumbRow = numRowsPossible_below;

      } else if (boundToWhat === 'rightBound') {
        //TODO
      }

    }

    return numberColAndRows;
  }


  /**
  * Gets the maximal width of the entities present in the document.
  * @return {[type]} [description]
  */
  static get_entityMaxWidth(arrayOfWSVMeasurementObjects) {
    var entityMaxWidth = Math.max.apply(null, arrayOfWSVMeasurementObjects.map(function() {
      return this.entityBbox.width;
    }));

    return entityMaxWidth;
  }


  /**
  * Gets the maximum sparkline among a collection of sparklines
  * @param  {Array[objects]} arrayOfWSVMeasurementObjects [description]
  * @return {float}                              [description]
  */
  static get_SparklineMaxWidth(arrayOfWSVMeasurementObjects) {
    var sparklineMaxWidth = Math.max.apply(null, arrayOfWSVMeasurementObjects.map(function() {
      return this.sparklineBbox.width;
    }));

    return sparklineMaxWidth;
  }
}


export default Measurements;
