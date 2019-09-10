



class Measurements {

  /**
  * Gets the bbox of the entity
  * @param  {DOM Element or jQuery object} anEntity - either the DOM element or the jQuery object
  * @return {DOMRect} - the bounding box (minimum: top, left, width, height) with respect to the document and not the viewport
  */
  static get_BBox_entity(anEntity, aWSV) {

    let theBbox = { left: 0,
                    top: 0,
                    right: 0,
                    bottom: 0,
                    width: 0,
                    height: 0};

    let theEntity = null;
    if (aWSV instanceof jQuery) {
      theEntity = aWSV.children('.entity')[0];
    } else {
      theEntity = $(aWSV).children('.entity')[0];
    }


    // adapt top and bottom to give values according to the document
    let bbox = anEntity.getBoundingClientRect();

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
    // if (typeof window['layoutInfo'] !== 'undefined') {
      layoutInfo.viewportLeft = viewportDimensionsLeftRight.left;
      layoutInfo.viewportRight = viewportDimensionsLeftRight.right;
      layoutInfo.viewportTop = viewportDimensionsTopBottom.top;
      layoutInfo.viewportBottom = viewportDimensionsTopBottom.bottom;
    // } else {
    //   console.log('PROBLEM: first create the layoutInfo object.')
    // }

    return layoutInfo;
  }



}


export default Measurements;
