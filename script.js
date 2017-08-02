var run = function() {

    var win = (typeof(unsafeWindow) != 'undefined' ? unsafeWindow : top.window);
	    $ = win.$;
  
    if (win.self != win.top) {
        return;
    }

// ============================================================================
    function parsePrice(str) {
        // if (typeof(str) == "string") {
        //   var reg = str.match(/\d+\.\d+/g);
        // }
        // return reg ? parseFloat(reg[reg.length - 1]) : 0;
        if (typeof(str) == "string") {
          return parseFloat(str.replace(/[^\d.,]/g, ""));
        }

        return 0;
    }

    function parseQuality(str) {
        return parseFloat(str) || 0;
    }

    function parseCount(str) {
        // debugger;
        if (typeof(str) == "string") {
          str = str.replace(/\s+/g, '');
        }
        return parseInt(str) || 0;
    }
    
    function countToString(count) {
      return count.toString().replace(/(\d)(?=(\d\d\d)+([^\d]|$))/g, '$1 ')
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
            var mixSum = 0;
            for (var i = 0; i < shipments.length; i++) {
                mixCount += shipments[i].count;
                mixSpecCount += shipments[i].specCount();
                mixSum += shipments[i].cost();
            }

            var mixShipment = new Shipment();
            mixShipment.price = mixSum / mixCount;
            mixShipment.quality = mixSpecCount / mixCount;
            mixShipment.count = mixCount;
            return mixShipment;
        }
        
        mix(shipments) {
            var mixShipments = shipments.concat(this);
            return Shipment.mix(mixShipments);
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
        constructor(name, view) {
            this.name = name;
            this.orders = [];
            this.storeShipment = null;

            this.view = view;
            viewPropCre(this.view, 'order-quality',    'Качество (заказ)');
            viewPropCre(this.view, 'order-count',      'Количество (заказ)');
            viewPropCre(this.view, 'order-price',      'Себестоимость (заказ)');
            viewPropCre(this.view, 'forecast-quality', 'Качество (прогноз)');
            viewPropCre(this.view, 'forecast-count',   'Количество (прогноз)');
            viewPropCre(this.view, 'forecast-price',   'Себестоимость (прогноз)');            
        }

        viewUpdate() {
            
            var ordersShipment = Shipment.mix(this.orders);
            var td = $('td.order-quality', this.view)[0];
            $('td.order-quality', this.view)[0].textContent = ordersShipment.quality.toFixed(2);;
            $('td.order-count',   this.view)[0].textContent = countToString(ordersShipment.count);
            $('td.order-price',   this.view)[0].textContent = '$' + ordersShipment.price.toFixed(2);
            var forecastStoreShipment = this.storeShipment.mix(this.orders);
            $('td.forecast-quality', this.view)[0].textContent = forecastStoreShipment.quality.toFixed(2);
            $('td.forecast-count',   this.view)[0].textContent = countToString(forecastStoreShipment.count);
            $('td.forecast-price',   this.view)[0].textContent = '$' + forecastStoreShipment.price.toFixed(2);
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

    // function viewPropCre(table, cls , name, val) {
    function viewPropCre(table, cls , name) {
        
        var row = table.insertRow();
        var cellName = row.insertCell(0);
        cellName.style = 'color:orange';
        var cellVal = row.insertCell(1);
        cellVal.className = cls;
        cellVal.align = 'right';
        cellVal.style = 'color:orange';
        cellName.textContent = name;
        // cellVal.textContent = 0;
        
        return row
    }

    function findElem(root, selector, part) {
        var arr = $(selector, root);
        for (var i = 0; i < arr.length; i++) {
            if (arr[i].textContent.search(part) + 1) {
                return arr[i + 1];
            }

        }

    }
    
    function parceShipment(row, shipment) {
        // debugger;
        var inp = $('input[id^=qc]', row)[0];
        if (inp) {
          var orderCount = parseCount(inp.value);
        }
        var freeCount = parseCount($('tr[id^=at_storage] :last-child', row).text());
        var count = orderCount < freeCount ? orderCount : freeCount;

        // if (count) {
            if (null == shipment) {
              shipment = new Shipment();
            }
            shipment.count = count;
            shipment.price = parsePrice($('td[id^=price_rules] + td', row).text());
            shipment.quality = parseQuality($('td[id^=quality_rules] + td', row).text());
        // }
        
        return shipment;
    }

//    var products = {};
    var store = new Store();
  
    $('tr.even, tr.odd').each ( function() {
        var row = this;

        var name = $('div.product_box_wo_truck', row)[0].parentElement.title;

		debugger;
        var product = store.getProductByName(name);
        if (null == product) {
            var table = $('table', row);
            product = new Product(name, table[1]);
            product.storeShipment = new Shipment();
            product.storeShipment.price = parsePrice(table[1].rows[2].cells[1].textContent);
            product.storeShipment.quality = parseQuality(table[1].rows[1].cells[1].textContent);
            product.storeShipment.count = parseCount(table[1].rows[0].cells[1].textContent);
            var spentCount = parseInt(parseCount(table[0].rows[0].cells[1].textContent));     // Будет израсходовано на этой недели
            product.storeShipment.count -= spentCount;
            if (product.storeShipment.count < 0) {
                product.storeShipment.count = 0; 
            }
            store.products.push(product);
        }

        //~ debugger;

        /* var orderCount = parseCount($('input[id^=qc]', row)[0].value);
        var freeCount = parseCount($('tr[id^=at_storage] :last-child', row).text());
        var count = orderCount < freeCount ? orderCount : freeCount;

        if (count) {
            var shipment = new Shipment();
            shipment.count = count;
            shipment.price = parsePrice($('td[id^=price_rules] + td', row).text());
            shipment.quality = parseQuality($('td[id^=quality_rules] + td', row).text());
            product.orders.push(shipment);
        } //  */
        var shipment = parceShipment(row, null);
        product.orders.push(shipment);
        
        
        var inp = $('input.quickchange', row)[0]
        if (inp) {
            inp.oninput = function() {
                // debugger;
                parceShipment(row, shipment);
                product.viewUpdate();
            }
        }

    });
  
    //~ debugger;
    for (var i = 0; i < store.products.length; i++) {
        store.products[i].viewUpdate();
        // var ordersShipment = Shipment.mix(store.products[i].orders);
        // viewProp(store.products[i].view, 'Качество (заказ)', ordersShipment.quality.toFixed(2));
        // viewProp(store.products[i].view, 'Количество (заказ)', countToString(ordersShipment.count));
        // viewProp(store.products[i].view, 'Себестоимость (заказ)', '$' + ordersShipment.price.toFixed(2));
        
        // var forecastStoreShipment = store.products[i].storeShipment.mix(store.products[i].orders);
        // viewProp(store.products[i].view, 'Качество (прогноз)', forecastStoreShipment.quality.toFixed(2));
        // viewProp(store.products[i].view, 'Количество (прогноз)', countToString(forecastStoreShipment.count.));
        // viewProp(store.products[i].view, 'Себестоимость (прогноз)', '$' + forecastStoreShipment.price.toFixed(2));
    }

    console.dir(store);
  
// ============================================================================

};

var script = document.createElement("script");
script.textContent = '(' + run.toString() + ')();';
document.documentElement.appendChild(script);
