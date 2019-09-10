const constants = require('../constants');
const menuItems = require('./menuItems');

import Measurements from '../measurements'

class ContextualMenu {

  private _isContextMenuSetUp: Boolean = false;

  private _text: Text;

  private _tooltipOffset: number = -5;
  private _theEntityBBox;
  private _widthTooltip: number;
  private _heightTooltip: number;
  private _tooltip_left: number;
  private _tooltip_top: number;
  private _tooltip_bottom: number;

  // Internal variables for delayed menu hiding
  private _menuHideTimer = null;
  private _menuHideDelay: number = 2000;

  private _menuItems = menuItems.menuItems;

  private _visibleMenuItems: string[] = [constants.menuElement.gridElement,
                                        constants.menuElement.closeElement,
                                        constants.menuElement.orderByLastDataValueElement,
                                        constants.menuElement.orderByEntityNameElement,
                                        constants.menuElement.orderByDocPositionElement];

  // selected menu item
  private _selectedMenuItem = null;

// ['#grid', '#close', '#order-by-lastDataValue', '#order-by-entityName', '#order-by-docPosition','#selector', '#selector-ok', '#row', '#column', '#grid-no-overlap'];


  initializeContextualMenu(theText: Text) {

    this._text = theText;

    const styleAttr = 'width:width;height:height;'

    const menuDiv = document.createElement("div");
    menuDiv.setAttribute('class', 'mouse tooltip');

    this._menuItems.forEach((anElement) => {
      if (this._visibleMenuItems.includes(anElement.element)) {
        this.createMenuElement(menuDiv, anElement.element, anElement.elementType, anElement.elementInteraction, anElement.iconUrl);
      }
    });

    // append to the body, end of what is there
    document.body.appendChild(menuDiv);
  }


  createMenuElement(aMenuDiv, anElement, elementType, elementInteraction, iconUrl) {

    const styleAttr = 'width:width;height:height;'

    if (this._visibleMenuItems.includes(anElement)) {
      var elementLayoutDiv = document.createElement("div");
      elementLayoutDiv.setAttribute('class', 'box ' + elementType);
      elementLayoutDiv.setAttribute('id', elementInteraction);
      aMenuDiv.appendChild(elementLayoutDiv);

      var elementImg = document.createElement("img");
      elementImg.setAttribute('class', 'icon');
      elementImg.setAttribute('src', iconUrl);
      elementImg.setAttribute('alt', elementInteraction);
      elementImg.setAttribute('title', elementInteraction);
      elementImg.setAttribute('style', styleAttr);
      elementLayoutDiv.appendChild(elementImg);

      elementLayoutDiv.addEventListener('click', () => {
        // unseclect current selected menu item
        this.unSelectMenuItem();

        // add class to selected menu item
        this._selectedMenuItem = anElement;
        $(this._selectedMenuItem).addClass('currentSeletedLayout');

        let interactionFN = this[elementInteraction];

        // is object a function?
        if (typeof interactionFN === "function") interactionFN();

      });


      // $(anElement).click(function() {
      //
      //   this.unSelectMenuItem();
      //
      //   // add class to selected menu item
      //   this.__selectedMenuItem = anElement;
      //   $(this.__selectedMenuItem).addClass('currentSeletedLayout');
      //
      //   let interactionFN = window[elementInteraction];
      //
      //   // is object a function?
      //   if (typeof interactionFN === "function") this.interactionFN();
      //
      // })
    }
  }

  /**

  **/
  set contextMenuSetUpFlag(newState: Boolean) {
    this._isContextMenuSetUp = newState;
  }

  get contextMenuSetUpFlag(): Boolean {
    return this._isContextMenuSetUp;
  }


  // Perform initial setup on the context menu (attaching listeners, etc.), done once only!
  setupContextMenu() {
    let classThis = this;
    $('.tooltip').mouseenter(function() {
      console.log('adding mouseenter event handler')
      classThis.stopMenuHideTimer();
    });

    $('.tooltip').mouseleave(function() {
      console.log('adding mouseleave event handler')
      classThis.startMenuHideTimer();
    });

    this._isContextMenuSetUp = true;
  }


  showContextMenu(elementMenuIsCalledOn: HTMLElement) {

    console.log('running showContextMenu');

    if (!this._isContextMenuSetUp) this.setupContextMenu();

    this.stopMenuHideTimer()

    $('.tooltip').removeClass('hide').addClass('wrapper');

    this.computePositionMenu(elementMenuIsCalledOn);
    this.positionMenu();
  }


  // Starts the menu hide timer
  startMenuHideTimer() {
    console.log('START menu hide timer');

    if (this._menuHideTimer) clearTimeout(this._menuHideTimer);

    this._menuHideTimer = setTimeout(() => this.hideContextualMenu(), this._menuHideDelay);
  }


  // Stops the menu hide timer
  stopMenuHideTimer() {
    console.log('STOP menu hide timer')

    if (this._menuHideTimer) clearTimeout(this._menuHideTimer);
  }


  // Hides the menu immediately
  hideContextualMenu() {
    // // Don't hide if a layout is being displayed
    // var isLayoutVisible = ($('.clonedWSV').length === 0) ? false : true;
    if(!this._text.isLayoutVisible) {
      $('.tooltip').removeClass('wrapper')
      $('.tooltip').addClass('hide');

      this.resetLayoutIcon();

      // tmpCurrentEntity = null;
      console.log('set tmpCurrentEntity to null')
    }
  }


  computePositionMenu(elementMenuIsCalledOn: HTMLElement) {
    // compute the tooltip position
    this._theEntityBBox = Measurements.get_BBox_entity(elementMenuIsCalledOn, $(elementMenuIsCalledOn).parent());
    this._widthTooltip = $('.tooltip')[0].getBoundingClientRect().width;
    this._heightTooltip = $('.tooltip')[0].getBoundingClientRect().height;
    this._tooltip_left = this._theEntityBBox.left - this._widthTooltip - this._tooltipOffset;
  }


  positionMenu() {

    if (this._tooltip_left < Measurements.getViewportMeasurements().viewportLeft) {
      this._tooltip_left = this._theEntityBBox.right + this._tooltipOffset;
      $('.tooltip').removeClass('leftPos');
      $('.tooltip').addClass('rightPos');
    }

    this._tooltip_top = this._theEntityBBox.top - 18;
    this._tooltip_bottom = this._theEntityBBox.bottom + this._heightTooltip + 5;

    if (this._tooltip_bottom > (window.innerHeight  + $(window).scrollTop())) {
      this._tooltip_top = this._theEntityBBox.top - 5 - this._heightTooltip;
      $('.tooltip').addClass('topPos');
    }

    // set the position of the tooltip
    $('.tooltip').css('left', this._tooltip_left);
    $('.tooltip').css('top', this._tooltip_top);
  }


  resetLayoutIcon() {
    $('.layout').removeClass('hide');
  }


  unSelectMenuItem() {
    $('_selectedMenuItem').removeClass('currentSeletedLayout');
  }


  // function called when pushing a menu item
  close() {
    console.log('menu item close pushed')

  }

  grid_layout() {
    console.log('menu item grid_layout pushed')
  }

  column_layout() {
    console.log('menu item column_layout pushed')
  }

  columnPanAligned_layout() {
    console.log('menu item columnPanAligned_layout pushed')
  }

  row_layout() {
    console.log('menu item row_layout pushed')
  }

  gridNoOverlap_layout() {
    console.log('menu item gridNoOverlap_layout pushed')
  }

  lastDataValue_sort() {
    console.log('menu item lastDataValue_sort pushed')

    lastValueSort()
		updateLayout('lastValue');
  }

  entityName_sort() {
    console.log('menu item entityName_sort pushed')
  }

  docPosition_sort() {
    console.log('menu item docPosition_sort pushed')
  }

  select_interaction() {
    console.log('menu item select_interaction pushed')
  }

  unselect_interaction() {
    console.log('menu item unselect_interaction pushed')
  }



}

export let contextualMenu = new ContextualMenu()
