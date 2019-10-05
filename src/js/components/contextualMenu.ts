const constants = require('../constants');
const menuItems = require('./menuItems');

import Measurements from '../measurements';
import Layout from './layout';
import Text from '../components/text';
import Entity from '../components/entity';


class ContextualMenu {

  _isContextMenuSetUp: Boolean = false;

  _tooltipOffset: number = -5;
  _theEntityBBox;
  _widthTooltip: number;
  _heightTooltip: number;
  _tooltip_left: number;
  _tooltip_top: number;
  _tooltip_bottom: number;

  // Internal variables for delayed menu hiding
  _menuHideTimer = null;
  _menuHideDelay: number = 2000;

  _menuItems: Array<menuItemType> = menuItems.menuItems;

  _visibleMenuItems: string[] = [constants.menuElement.gridElement,
                                 constants.menuElement.closeElement,
                                 constants.menuElement.orderByLastDataValueElement,
                                 constants.menuElement.orderByEntityNameElement,
                                 constants.menuElement.orderByDocPositionElement];

  // selected menu item
  _selectedMenuItem: string;

  _refToText: Text;

  _refToLayout: Layout;

  _tooltipElements;

// ['#grid', '#close', '#order-by-lastDataValue', '#order-by-entityName', '#order-by-docPosition','#selector', '#selector-ok', '#row', '#column', '#grid-no-overlap'];



  constructor(referenceToText: Text) {

    this._refToText = referenceToText;
    this._refToLayout = referenceToText._theLayout;

    this._tooltipElements = [];

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

      elementLayoutDiv.addEventListener('click', event => {
        // unselect current selected menu item
        this.unSelectMenuItem();

        // add the class 'selected' if no wsv has been selected (selected wsvs are the gathered ones)
        if (!($('.entity.selected').length > 1)) {
          $('.entity').addClass('selected');
        }

        // add class to selected menu item
        this._selectedMenuItem = anElement.element;
        event.currentTarget.classList.add('currentSeletedLayout');
        // $(this._selectedMenuItem).addClass('currentSeletedLayout');

        if (anElement.elementType === 'close') {
          this._refToText._theLayout.giveUpLayout();
        } else if (anElement.elementType === 'layout') {

          const entityBBox = this._refToText._currentEntity._entityBbox;
          const entityBboxCentroid = {x: entityBBox.top + (entityBBox.height/2), y: entityBBox.left + (entityBBox.width/2)};

          this._refToText._theLayout.changeLayout(anElement.elementInteraction, entityBboxCentroid);
        }
      });

      this._tooltipElements.push(elementLayoutDiv);

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
  setupContextMenu(entityMenuCalledOn: Entity) {
    // let classThis = this;
    $('.tooltip').mouseenter(() => {
      console.log('adding mouseenter event handler')
      this.stopMenuHideTimer();
    });

    $('.tooltip').mouseleave(() => {
      // if (!$('.tooltip').hasClass('hide')) {
        console.log('adding mouseleave event handler')
        this.startMenuHideTimer(entityMenuCalledOn);
      // }
    });

    this._isContextMenuSetUp = true;
  }


  showContextMenu(entityMenuIsCalledOn: Entity) {

    console.log('running showContextMenu');

    if (!this._isContextMenuSetUp) this.setupContextMenu(entityMenuIsCalledOn);

    this.stopMenuHideTimer()

    $('.tooltip').removeClass('hide').addClass('wrapper');

    this.computePositionMenu(entityMenuIsCalledOn);
    this.positionMenu(this._refToLayout);
  }


  // Starts the menu hide timer
  startMenuHideTimer(refToEntity: Entity) {
    console.log('START menu hide timer');

    if (this._menuHideTimer) clearTimeout(this._menuHideTimer);

    this._menuHideTimer = setTimeout(() => {
                                      if (!$('.tooltip').hasClass('hide')) {
                                        console.log('hide startMenuHideTimer')
                                        this.hideContextualMenu(refToEntity)
                                      } else {
                                        clearTimeout(this._menuHideTimer)
                                      }
                                    }, this._menuHideDelay);
  }


  // Stops the menu hide timer
  stopMenuHideTimer() {
    console.log('STOP menu hide timer')

    if (this._menuHideTimer) clearTimeout(this._menuHideTimer);
  }


  // Hides the menu immediately
  hideContextualMenu(refToEntity: Entity) {
    // Don't hide if a layout is being displayed
    if(!this._refToText.isLayoutVisible) {
      $('.tooltip').removeClass('wrapper')
      $('.tooltip').addClass('hide');

      this.resetLayoutIcon();

      console.log('set currentEntity to null')
      // this._refToText.currentEntity = null;
      refToEntity.unSetAsCurrentEntity();
    }
  }


  computePositionMenu(entityMenuIsCalledOn: Entity) {
    // compute the tooltip position
    this._theEntityBBox = Measurements.get_BBox_entity($(entityMenuIsCalledOn.entityElement).parent());;
    this._widthTooltip = $('.tooltip')[0].getBoundingClientRect().width;
    this._heightTooltip = $('.tooltip')[0].getBoundingClientRect().height;
    this._tooltip_left = this._theEntityBBox.left - this._widthTooltip - this._tooltipOffset;
  }


  positionMenu(aRefToLayout) {

    if (this._tooltip_left < Measurements.getViewportMeasurements(aRefToLayout).viewportLeft) {
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

      this._refToText._theLayout.changeLayout(constants.menuElement.gridElement);

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


  unSelectIcon() {
    this._tooltipElements.forEach((aMenuElement: HTMLElement) => {
      aMenuElement.classList.remove('currentSeletedLayout');
    });
  }



}

// export let contextualMenu = new ContextualMenu();
export default ContextualMenu
