import { BBox } from "../../../global";
import { wsvInteractionConstants } from '../constants';

const menuItems = require('./menuItems');

import Text from '../components/text';
import Entity from '../components/entity';


interface ContextualMenuBBox {
  offset: number,
  width: number,
  height: number,
  left: number,
  top: number,
  bottom: number
}



class ContextualMenu {

  _contextualMenuBBox: ContextualMenuBBox;
  // Internal variables for delayed menu hiding
  _menuHideTimer: number;
  _menuHideDelay: number = 2000;
  _menuItems: Array<MenuItemType> = menuItems.menuItems;
  _visibleMenuItems: string[] = [wsvInteractionConstants.menuElement.gridElement,
                                 wsvInteractionConstants.menuElement.closeElement,
                                 wsvInteractionConstants.menuElement.columnElement,
                                 wsvInteractionConstants.menuElement.columnPanAlignedElement,
                                 wsvInteractionConstants.menuElement.gridNoOverlapElement,
                                 wsvInteractionConstants.menuElement.rowElement,
                                 wsvInteractionConstants.menuElement.orderByLastDataValueElement,
                                 wsvInteractionConstants.menuElement.orderByEntityNameElement,
                                 wsvInteractionConstants.menuElement.orderByDocPositionElement,
                                 wsvInteractionConstants.menuElement.selector];
  _selectedLayoutMenuItem: HTMLElement | null;
  _selectedSortingMenuItem: HTMLElement | null;

  _contextualMenu: HTMLElement;
  _contextualMenuElements: Array<HTMLElement>;

  _refToText: Text;
  _isContextMenuSetUp: Boolean;



  constructor(referenceToText: Text) {

    this._refToText = referenceToText;
    this._isContextMenuSetUp = false;

    this._contextualMenuBBox = {offset: -5,
                                width: 0,
                                height: 0,
                                left: 0,
                                top: 0,
                                bottom: 0}

    this._contextualMenuElements = [];

    this._contextualMenu = document.createElement('div');
    this.createMenu();
  }


  // getter/setter
  set contextualMenu(value: HTMLElement) {
      this._contextualMenu = value;
  }
  get contextualMenu(): HTMLElement {
      return this._contextualMenu;
  }

  set refToText(value: Text) {
      this._refToText = value;
  }
  get refToText(): Text {
      return this._refToText;
  }


  createMenu() {
    this.contextualMenu.setAttribute('id', 'contextualMenu');
    this.contextualMenu.classList.add('hide');

    this._menuItems.forEach((anElement: MenuItemType) => {
      if (this._visibleMenuItems.includes(anElement.element)) {
        this.createMenuElement(this._contextualMenu, anElement);
      }
    });

    // append to the end of the body
    document.body.appendChild(this._contextualMenu);
  }


  createMenuElement(aMenuDiv: HTMLElement, anElement: MenuItemType) {

    const styleAttr = 'width:width;height:height;'

    const elementLayoutDiv = document.createElement("div");
    elementLayoutDiv.setAttribute('class', 'box ' + anElement.elementType);
    elementLayoutDiv.setAttribute('id', anElement.elementInteraction);
    aMenuDiv.appendChild(elementLayoutDiv);

    const elementImg = document.createElement("img");
    elementImg.setAttribute('class', 'icon');
    elementImg.setAttribute('src', anElement.iconUrl);
    elementImg.setAttribute('alt', anElement.elementInteraction);
    elementImg.setAttribute('title', anElement.elementInteraction);
    elementImg.setAttribute('type', anElement.elementType);
    elementImg.setAttribute('style', styleAttr);
    elementLayoutDiv.appendChild(elementImg);

    this._contextualMenuElements.push(elementLayoutDiv);

    this.setInitialMenuState();


    elementLayoutDiv.addEventListener('click', event => {
      const initialSorting = 'DocumentPositionSort';

      const element = event.currentTarget as HTMLElement

      if (anElement.elementType === 'close') {

        ContextualMenu.makeNotSelectable(element)
        this.refToText._layoutCreator.giveUpLayout(() => this.cleanupContextualMenu());


      } else if (anElement.elementType === 'layout') {

        this.hideSetOfMenuItems('selection')
        ContextualMenu.makeNotSelectable(element)

        if (this.refToText._isLayoutVisible) {
          // get previously applied sorting and apply that sorting to new layout

          ContextualMenu.makeSelectable(this._selectedLayoutMenuItem)

          this.refToText.layoutCreator._theLayout.cleanUpAfterLayout();
          this.refToText.layoutCreator.changeLayout(anElement.elementInteraction, this._selectedSortingMenuItem.id, anElement.elementType)

        } else {

          // add the class 'useInLayout' if no wsv has been selected (selected wsvs are the gathered ones)
          const entitiesUseInLayout = document.querySelectorAll('.entity.useInLayout');
          if (entitiesUseInLayout.length === 0) {
            document.querySelectorAll('.entity:not(.currentEntity):not(.nodataForWSV)').forEach(useEntityInLayout => {
              useEntityInLayout.classList.add('useInLayout');
            });
          }

          for (const aMenuItem of this._contextualMenuElements) {
            if (aMenuItem.id !== initialSorting && aMenuItem.classList.contains('sorting')) {
              ContextualMenu.makeSelectable(aMenuItem);
            } else if (aMenuItem.id === initialSorting) {
              this._selectedSortingMenuItem = aMenuItem;
            }
          }

          this.refToText.layoutCreator.changeLayout(anElement.elementInteraction, initialSorting, anElement.elementType)
        }

        this._selectedLayoutMenuItem = element;

      } else if (anElement.elementType === 'sorting') {
        ContextualMenu.makeNotSelectable(element)
        ContextualMenu.makeSelectable(this._selectedSortingMenuItem)

        this.refToText.layoutCreator.changeLayout(this.refToText._layoutCreator._layoutClass, anElement.elementInteraction, anElement.elementType)

        this._selectedSortingMenuItem = element
      } else if (anElement.elementType === 'selection') {

        const selectWSVMenuItem = document.querySelector('#contextualMenu #SelectWSV')
        const unSelectWSVMenuItem = document.querySelector('#contextualMenu #UnselectWSV')
        if (anElement.elementInteraction === 'SelectWSV') {
          selectWSVMenuItem!.classList.add('hide');
          unSelectWSVMenuItem!.classList.remove('hide');

          this._refToText._currentEntity!._entityElement.classList.add('useInLayout');
        } else {
          unSelectWSVMenuItem!.classList.add('hide');
          selectWSVMenuItem!.classList.remove('hide');

          this._refToText._currentEntity!._entityElement.classList.remove('useInLayout');
        }
      }
    });
  }


  // Perform initial setup on the context menu (attaching listeners, etc.), done once only!
  setupContextMenu(entityMenuCalledOn: Entity) {

    this.contextualMenu.addEventListener('mouseenter', () => {
      // console.log('adding mouseenter event handler')
      this.stopMenuHideTimer();
    });

    this.contextualMenu.addEventListener('mouseleave', () => {
      // console.log('adding mouseleave event handler')
      this.startMenuHideTimer(entityMenuCalledOn);
    });

    this._isContextMenuSetUp = true;
  }


  showContextMenu(entityMenuIsCalledOn: Entity) {

    console.log('running showContextMenu');

    if (!this._isContextMenuSetUp) this.setupContextMenu(entityMenuIsCalledOn);

    this.stopMenuHideTimer()

    this.contextualMenu.classList.remove('hide')
    this.contextualMenu.classList.add('wrapper')

    this.getContextualMenuBBox(entityMenuIsCalledOn);
    this.positionMenu(entityMenuIsCalledOn);

    if (entityMenuIsCalledOn._entityElement.classList.contains('useInLayout')) {
      ContextualMenu.hideMenuItem(document.querySelector('#contextualMenu #SelectWSV'))
      ContextualMenu.unHideMenuItem(document.querySelector('#contextualMenu #UnselectWSV'))
    } else {
      ContextualMenu.hideMenuItem(document.querySelector('#contextualMenu #UnSelectWSV'))
      ContextualMenu.unHideMenuItem(document.querySelector('#contextualMenu #SelectWSV'))
    }
  }


  // Starts the menu hide timer
  startMenuHideTimer(refToEntity: Entity) {
    // console.log('START menu hide timer');

    if (this._menuHideTimer) clearTimeout(this._menuHideTimer);

    this._menuHideTimer = window.setTimeout(() => {
                                      if (!this.contextualMenu.classList.contains('hide')) {
                                        console.log('hide startMenuHideTimer')
                                        this.hideContextualMenu(refToEntity)
                                      } else {
                                        clearTimeout(this._menuHideTimer)
                                      }
                                    }, this._menuHideDelay);
  }


  // Stops the menu hide timer
  stopMenuHideTimer() {
    // console.log('STOP menu hide timer')

    if (this._menuHideTimer) clearTimeout(this._menuHideTimer);
  }


  // Hides the menu immediately
  hideContextualMenu(refToEntity: Entity) {
    // Don't hide if a layout is being displayed
    if(!this.refToText.isLayoutVisible) {
    // if (refToEntity != this.refToText.currentEntity) {

      this.contextualMenu.classList.remove('wrapper');
      this.contextualMenu.classList.add('hide')

      console.log('set currentEntity to null')
      refToEntity.unSetAsCurrentEntity();
    }
  }


  // compute the contextualMenu position
  getContextualMenuBBox(entityMenuIsCalledOn: Entity) {

    this._contextualMenuBBox.width = this.contextualMenu.getBoundingClientRect().width;
    this._contextualMenuBBox.height = this.contextualMenu.getBoundingClientRect().height;
    this._contextualMenuBBox.left = entityMenuIsCalledOn._entityBbox.left - this._contextualMenuBBox.width - this._contextualMenuBBox.offset;
  }


  positionMenu(entityMenuIsCalledOn: Entity) {

    if (this._contextualMenuBBox.left < ContextualMenu.getViewportInfo().left) {
      this._contextualMenuBBox.left = entityMenuIsCalledOn._entityBbox.right + this._contextualMenuBBox.offset;
      this.contextualMenu.classList.remove('leftPos');
      this.contextualMenu.classList.add('rightPos');
    }

    this._contextualMenuBBox.top = entityMenuIsCalledOn._entityBbox.top - 18;
    this._contextualMenuBBox.bottom = entityMenuIsCalledOn._entityBbox.bottom + this._contextualMenuBBox.height + 5;

    if (this._contextualMenuBBox.bottom > (window.innerHeight + document.body.scrollTop)) {
      this._contextualMenuBBox.top = entityMenuIsCalledOn._entityBbox.top - 5 - this._contextualMenuBBox.height;
      this.contextualMenu.classList.add('topPos')
    }

    // set the position of the contextualMenu
    this.contextualMenu.style.left = this._contextualMenuBBox.left + 'px';
    this.contextualMenu.style.top = this._contextualMenuBBox.top + 'px';
  }


  static makeNotSelectable(menuItem: HTMLElement) {
    menuItem.classList.remove('selectable');
    menuItem.classList.add('notSelectable');
  }


  static makeSelectable(menuItem: HTMLElement) {
    menuItem.classList.remove('notSelectable');
    menuItem.classList.add('selectable');
  }

  hideSetOfMenuItems(menuItemType: string) {
    this._contextualMenuElements.forEach((aMenuElement: HTMLElement) => {
      if (aMenuElement.classList.contains(menuItemType)) {
        ContextualMenu.hideMenuItem(aMenuElement);
      }
    });
  }

  static hideMenuItem(menuItem: HTMLElement) {
  if (!menuItem.classList.contains('hide')) menuItem.classList.add('hide')
  }

  static unHideMenuItem(menuItem: HTMLElement) {
    if (menuItem.classList.contains('hide')) menuItem.classList.remove('hide');

  }


  // set selectable or hide property of a menu item
  setInitialMenuState() {
    // go through all menu items and reset their class to selectable but not the sorting menu items
    this._contextualMenuElements.forEach((aMenuElement: HTMLElement) => {
      if (aMenuElement.classList.contains('sorting')) {
        ContextualMenu.makeNotSelectable(aMenuElement);
      } else if (aMenuElement.classList.contains('selection') && aMenuElement.id === 'UnselectWSV') {
        aMenuElement.classList.add('hide');
      } else {
        ContextualMenu.unHideMenuItem(aMenuElement);
        ContextualMenu.makeSelectable(aMenuElement);
      }
    });
  }


  cleanupContextualMenu() {
    console.log('cleanup the menu');
    this.setInitialMenuState();

    this._selectedLayoutMenuItem = null;
    this._selectedSortingMenuItem = null;
  }


  private static getViewportInfo(): BBox {
    return document.body.getBoundingClientRect();
  }

}

export default ContextualMenu
