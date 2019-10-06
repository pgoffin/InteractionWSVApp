
interface MenuItemType {
  element: string;
  elementType: string;
  elementInteraction: string;
  iconUrl: string;
}

module.exports = {

menuItems: [{element: '#close',
             elementType: 'close',
             elementInteraction: 'Close',
             iconUrl: './src/data/icons/close.svg'},
            {element: '#grid',
             elementType: 'layout',
             elementInteraction: 'GridLayout',
             iconUrl: './src/data/icons/grid4.svg'},
            {element: '#column',
             elementType: 'layout',
             elementInteraction: 'ColumnLayout',
             iconUrl: './src/data/icons/column3.svg'},
            {element: '#column-pan-aligned',
             elementType: 'layout',
             elementInteraction: 'ColumnPanAlignedLayout',
             iconUrl: './src/data/icons/column-pan-aligned2.svg'},
            {element: '#row',
             elementType: 'layout',
             elementInteraction: 'RowLayout',
             iconUrl: './src/data/icons/row3.svg'},
            {element: '#grid-no-overlap',
             elementType: 'layout',
             elementInteraction: 'GridNoOverlapLayout',
             iconUrl: './src/data/icons/no-overlap3.svg'},
            {element: '#order-by-lastDataValue',
             elementType: 'sorting',
             elementInteraction: 'lastDataValue_sort',
             iconUrl: './src/data/icons/sort-val.svg'},
            {element: '#order-by-entityName',
             elementType: 'sorting',
             elementInteraction: 'entityName_sort',
             iconUrl: './src/data/icons/sort-alpha.svg'},
            {element: '#order-by-docPosition',
             elementType: 'sorting',
             elementInteraction: 'docPosition_sort',
             iconUrl: './src/data/icons/sort-doc.svg'},
            {element: '#selector',
             elementType: 'selection',
             elementInteraction: 'select_interaction',
             iconUrl: './src/data/icons/selector.svg'},
            {element: '#selector',
             elementType: 'selection hide',
             elementInteraction: 'unselect_interaction',
             iconUrl: './src/data/icons/selector-ok.svg'}]

}
