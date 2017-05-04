var run = function() {

    var win = (typeof(unsafeWindow) != 'undefined' ? unsafeWindow : top.window);
	    $ = win.$;
  
    if (win.self != win.top) {
        return;
    }

// ============================================================================
    function parsePrice(str) {
        var reg = str.match(/\d+\.\d+/g);
        return (reg == null) ? 0 : parseFloat(reg[reg.length - 1]);
    }

    function parseQuality(str) {
        return parseFloat(str) || 0;
    }

    function parseCount(str) {
        // debugger;
        str = str.replace(/\s+/g, '');
        return parseInt(str) || 0;
    }
    
    class Shipment {
        constructor () {
            this.price = null;
            this.quality = null;
            this.count = null;
        }

        static mix(shipments) {
            var mixCount = 0;
            var mixSpecCount = 0;
            var mixCost = 0;
            for (var i = 0; i < shipments.length; i++) {
                mixCount += shipments[i].count;
                mixSpecCount += shipments[i].specCount();
                mixCost += shipments[i].cost();
            }

            var mixShipment = new Shipment();
            mixShipment.price = mixCost / mixCount;
            mixShipment.quality = mixSpecCount / mixCount;
            mixShipment.count = mixCount;
            return mixShipment;
        }
        
        mix(shipments) {
            shipments.push(this);
            return Shipment.mix(shipments);
        }

        cost() {
            return this.count * this.price;
        }

        // Условное количество товара качеством 1 равнозначное данной партии
        specCount() {
            return this.count * this.quality;
        }
    }

    class Product {
        constructor(name) {
            this.name = name;
            this.orders = [];
            this.storeShipment = null;

            this.view = null;
        }


    }

    class Store {
        constructor() {
            this.products = [];
        }

        getProductByName(name) {
            for (var i = 0; i < this.products.length; i++) {
                if (this.products[i].name == name) {
                    return this.products[i];
                }
            }

            return null;
        }

//        findCreProductByName(name) {
////            debugger;
//            var product = this.getProductByName(name);
//
//            if (null == product) {
//                product = new Product(name);
//                this.products.push(product);
//            }
//
//            return product;
//        }

//        addShipmentByProductName (name) {
//
//        }
    }

    function viewProp(table, name, val) {
        var row = table.insertRow();
        var cellName = row.insertCell(0);
        var cellVal = row.insertCell(1);
        cellName.style = 'color:orange';
        cellVal.align = 'right';
        cellVal.style = 'color:orange';

        cellName.textContent = name;
        cellVal.textContent = val;
    }

    function findElem(root, selector, part) {
        var arr = $(selector, root);
        for (var i = 0; i < arr.length; i++) {
            if (arr[i].textContent.search(part) + 1) {
                return arr[i + 1];
            }

        }

    }

//    var products = {};
    var store = new Store();
  
    $('tr.even, tr.odd').each ( function() {

        var name = $('div.product_box_wo_truck', this)[0].parentElement.title;

        var product = store.getProductByName(name);
        if (null == product) {
            product = new Product(name);
            var table = $('table', this);
            product.view = table[1];
            product.storeShipment = new Shipment();
            product.storeShipment.price = parsePrice(table[1].rows[2].cells[1].textContent);
            product.storeShipment.quality = parseQuality(table[1].rows[1].cells[1].textContent);
            product.storeShipment.count = parseCount(table[1].rows[0].cells[1].textContent);
            var spentCount = parseInt(parseCount(table[0].rows[0].cells[1].textContent));     // Будет израсходовано на этой недели
            product.storeShipment.count -= spentCount;
            store.products.push(product);
        }

        // debugger;
        var shipment = new Shipment();
        shipment.price = parsePrice($('td[id^=price_rules] + td', this).text());
        shipment.quality = parseQuality($('td[id^=quality_rules] + td', this).text());
        var count = parseCount($('input[id^=qc]', this)[0].value);
        var freeCount = parseCount($('tr[id^=at_storage] :last-child', this).text());
        shipment.count = count < freeCount ? count : freeCount;
        product.orders.push(shipment);

    });
  
    for (var i = 0; i < store.products.length; i++) {
        // debugger;
        var mixShipment = store.products[i].storeShipment.mix(store.products[i].orders);
        viewProp(store.products[i].view, 'Качество (прогноз)', mixShipment.quality.toFixed(2));
        viewProp(store.products[i].view, 'Количество (прогноз)', mixShipment.count.toString().replace(/(\d)(?=(\d\d\d)+([^\d]|$))/g, '$1 '));
        viewProp(store.products[i].view, 'Себестоимость (прогноз)', '$' + mixShipment.price.toFixed(2));
    }

    console.dir(store);
  
// ============================================================================

};

var script = document.createElement("script");
script.textContent = '(' + run.toString() + ')();';
document.documentElement.appendChild(script);
