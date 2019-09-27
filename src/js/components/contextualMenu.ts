const constants = require('../constants');
const menuItems = require('./menuItems');

import Measurements from '../measurements';
// import Layout from './layout';
import Text from '../components/text';


class ContextualMenu {

  private _isContextMenuSetUp: Boolean = false;

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

  private _menuItems: Array<menuItemType> = menuItems.menuItems;

  private _visibleMenuItems: string[] = [constants.menuElement.gridElement,
                                        constants.menuElement.closeElement,
                                        constants.menuElement.orderByLastDataValueElement,
                                        constants.menuElement.orderByEntityNameElement,
                                        constants.menuElement.orderByDocPositionElement];

  // selected menu item
  private _selectedMenuItem: string;

  _refToText: Text;

  // _refToLayout: Layout;

  // [key: string]: () => void;

// ['#grid', '#close', '#order-by-lastDataValue', '#order-by-entityName', '#order-by-docPosition','#selector', '#selector-ok', '#row', '#column', '#grid-no-overlap'];



  constructor(referenceToText: Text) {

    this._refToText = referenceToText;

    const menuDiv = document.createElement("div");
    menuDiv.setAttribute('class', 'mouse tooltip');

    this._menuItems.forEach((anElement: menuItemType) => {
      if (this._visibleMenuItems.includes(anElement.element)) {
        this.createMenuElement(menuDiv, anElement);
      }
    });

    // append to the body, end of what is there
    document.body.appendChild(menuDiv);
  }


  createMenuElement(aMenuDiv: HTMLElement, anElement: menuItemType) {

    const styleAttr = 'width:width;height:height;'

    if (this._visibleMenuItems.includes(anElement.element)) {
      var elementLayoutDiv = document.createElement("div");
      elementLayoutDiv.setAttribute('class', 'box ' + anElement.elementType);
      elementLayoutDiv.setAttribute('id', anElement.elementInteraction);
      aMenuDiv.appendChild(elementLayoutDiv);

      var elementImg = document.createElement("img");
      elementImg.setAttribute('class', 'icon');
      elementImg.setAttribute('src', anElement.iconUrl);
      elementImg.setAttribute('alt', anElement.elementInteraction);
      elementImg.setAttribute('title', anElement.elementInteraction);
      elementImg.setAttribute('style', styleAttr);
      elementLayoutDiv.appendChild(elementImg);

      elementLayoutDiv.addEventListener('click', () => {
        // unselect current selected menu item
        this.unSelectMenuItem();

        // add the class 'selected' if no wsv has been selected (selected wsvs are the gathered ones)
				if (!($('.entity.selected').length > 1)) {
					$('.entity').addClass('selected');
				}

        // add class to selected menu item
        this._selectedMenuItem = anElement.element;
        $(this._selectedMenuItem).addClass('currentSeletedLayout');

        let interactionFN = this[anElement.elementInteraction];

        // is object a function?
        if (typeof interactionFN === "function") interactionFN();

      });



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
    // Don't hide if a layout is being displayed
    if(!this._refToText._theLayout.isLayoutVisible) {
      $('.tooltip').removeClass('wrapper')
      $('.tooltip').addClass('hide');

      this.resetLayoutIcon();

      console.log('set currentEntity to null')
      this._refToText.currentEntity = null;
    }
  }


  computePositionMenu(elementMenuIsCalledOn: HTMLElement) {
    // compute the tooltip position
    this._theEntityBBox = Measurements.get_BBox_entity($(elementMenuIsCalledOn).parent());;
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

    if (this._refToText._theLayout.currentLayout != constants.menuElement.gridElement) {
      console.log('set layout to "' + constants.menuElement.gridElement + '"')

      this._refToText._theLayout.changeLayout(constants.menuElement.gridElement, '');

// is this needed
      this._refToText._theLayout.currentLayout = constants.gridElement;
    }



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

// export let contextualMenu = new ContextualMenu();
export default ContextualMenu
