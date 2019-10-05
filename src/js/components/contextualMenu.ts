const constants = require('../constants');
const menuItems = require('./menuItems');

// import Measurements from '../measurements';
import Layout from './layout';
import LayoutType from './layoutType';
import Text from '../components/text';
import Entity from '../components/entity';


interface tooltipBBox {
  offset: number,
  width: number,
  height: number,
  left: number,
  top: number,
  bottom: number
}

class ContextualMenu {

  _isContextMenuSetUp: Boolean = false;

  _tooltipBBox: tooltipBBox;

  // Internal variables for delayed menu hiding
  _menuHideTimer: number;
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

  _tooltipElements: Array<HTMLElement>;

// ['#grid', '#close', '#order-by-lastDataValue', '#order-by-entityName', '#order-by-docPosition','#selector', '#selector-ok', '#row', '#column', '#grid-no-overlap'];



  constructor(referenceToText: Text) {

    this._refToText = referenceToText;
    this._refToLayout = referenceToText._theLayout;

    this._tooltipBBox = {offset: -5,
                         width: 0,
                         height: 0,
                         left: 0,
                         top: 0,
                         bottom: 0}

    this._tooltipElements = [];

    const menuDiv = document.createElement("div");
    menuDiv.setAttribute('id', 'tooltip');

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
        const element = event.currentTarget as HTMLElement
        element.classList.add('currentSeletedLayout');

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

  // /**
  //
  // **/
  // set contextMenuSetUpFlag(newState: Boolean) {
  //   this._isContextMenuSetUp = newState;
  // }
  //
  // get contextMenuSetUpFlag(): Boolean {
  //   return this._isContextMenuSetUp;
  // }


  // Perform initial setup on the context menu (attaching listeners, etc.), done once only!
  setupContextMenu(entityMenuCalledOn: Entity) {

    document.getElementById('tooltip').addEventListener('mouseenter', () => {
      console.log('adding mouseenter event handler')
      this.stopMenuHideTimer();
    });

    document.getElementById('tooltip').addEventListener('mouseleave', () => {
      console.log('adding mouseleave event handler')
      this.startMenuHideTimer(entityMenuCalledOn);
    });

    this._isContextMenuSetUp = true;
  }


  showContextMenu(entityMenuIsCalledOn: Entity) {

    console.log('running showContextMenu');

    if (!this._isContextMenuSetUp) this.setupContextMenu(entityMenuIsCalledOn);

    this.stopMenuHideTimer()

    document.getElementById('tooltip').classList.remove('hide')
    document.getElementById('tooltip').classList.add('wrapper')

    this.computePositionMenu(entityMenuIsCalledOn);
    this.positionMenu(this._refToLayout, entityMenuIsCalledOn);
  }


  // Starts the menu hide timer
  startMenuHideTimer(refToEntity: Entity) {
    console.log('START menu hide timer');

    if (this._menuHideTimer) clearTimeout(this._menuHideTimer);

    this._menuHideTimer = window.setTimeout(() => {
                                      if (!document.getElementById('tooltip').classList.contains('hide')) {
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

      document.getElementById('tooltip').classList.remove('wrapper');
      document.getElementById('tooltip').classList.add('hide')

      this.resetLayoutIcon();

      console.log('set currentEntity to null')
      refToEntity.unSetAsCurrentEntity();
    }
  }

  // compute the tooltip position
  computePositionMenu(entityMenuIsCalledOn: Entity) {

    this._tooltipBBox.width = document.getElementById('tooltip').getBoundingClientRect().width;
    this._tooltipBBox.height = document.getElementById('tooltip').getBoundingClientRect().height;
    this._tooltipBBox.left = entityMenuIsCalledOn._entityBbox.left - this._tooltipBBox.width - this._tooltipBBox.offset;
  }


  positionMenu(aRefToLayout: Layout, entityMenuIsCalledOn: Entity) {

    if (this._tooltipBBox.left < LayoutType.getViewportMeasurements(aRefToLayout).viewportLeft) {
      this._tooltipBBox.left = entityMenuIsCalledOn._entityBbox.right + this._tooltipBBox.offset;
      document.getElementById('tooltip').classList.remove('leftPos');
      document.getElementById('tooltip').classList.add('rightPos');
    }

    this._tooltipBBox.top = entityMenuIsCalledOn._entityBbox.top - 18;
    this._tooltipBBox.bottom = entityMenuIsCalledOn._entityBbox.bottom + this._tooltipBBox.height + 5;

    if (this._tooltipBBox.bottom > (window.innerHeight  + $(window).scrollTop())) {
      this._tooltipBBox.top = entityMenuIsCalledOn._entityBbox.top - 5 - this._tooltipBBox.height;
      document.getElementById('tooltip').classList.add('topPos')
    }

    // set the position of the tooltip
    document.getElementById('tooltip').style.left = this._tooltipBBox.left + 'px';
    document.getElementById('tooltip').style.top = this._tooltipBBox.top + 'px';
  }


  resetLayoutIcon() {
    $('.layout').removeClass('hide');
  }


  unSelectMenuItem() {
    $('_selectedMenuItem').removeClass('currentSeletedLayout');
  }


  unSelectIcon() {
    this._tooltipElements.forEach((aMenuElement: HTMLElement) => {
      aMenuElement.classList.remove('currentSeletedLayout');
    });
  }



}

// export let contextualMenu = new ContextualMenu();
export default ContextualMenu
