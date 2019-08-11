const express = require('express')
const app = express()
const port = 8081
var bodyParser = require('body-parser')
var request = require('request');

app.use(bodyParser.urlencoded({extended: true}));
// app.use('/static', express.static(path.join(__dirname, 'public')))
app.get('/',function(req,res){
    res.sendFile(__dirname +'/index.html');
})


function parseSeller(item){
   var seller={
		"feedbackScore":"",
		"popularity":"",
		"feedbackRating":"white",
		"score":false,
		"topRated":"",
		"storeName":"",
		"buyProduct":""
	}
	if(item.hasOwnProperty("Seller")){
		if(item.Seller.hasOwnProperty("FeedbackScore")){
			seller.feedbackScore=item.Seller.FeedbackScore;
		}
		if(item.Seller.hasOwnProperty("PositiveFeedbackPercent")){
			seller.popularity=item.Seller.PositiveFeedbackPercent;
		}
		if(item.Seller.hasOwnProperty("FeedbackRatingStar")){
			seller.feedbackRating=item.Seller.FeedbackRatingStar;
		}
		if(item.Seller.hasOwnProperty("FeedbackScore")){
			if(item.Seller.FeedbackScore>=5000){
				seller.score=true;
				seller.feedbackRating.replace("Shooting","");
			}	
		}
		if(item.Seller.hasOwnProperty("TopRatedSeller")){
			seller.topRated=item.Seller.TopRatedSeller;
		}
	}

	if(item.hasOwnProperty("Storefront")){
		if(item.Storefront.hasOwnProperty("StoreName")){
			seller.storeName=item.Storefront.StoreName;
		}
		if(item.Storefront.hasOwnProperty("StoreURL")){
			seller.buyProduct=item.Storefront.StoreURL;
		}
	}	
  return seller;
}

function parseDetail(item){
	var detail={
		"images":[],
	  "title":"N/A",
		"subtitle":"N/A",
		"price":"N/A",
		"location":"N/A",
		"returnPolicy":"N/A",
		"itemSpec":[]
	};

  var prop=["PictureURL","Title","Subtitle","CurrentPrice","Location","Seller","ReturnPolicy"];
  //top part of table

  if(item.hasOwnProperty("PictureURL")){
     detail.images=item.PictureURL.slice();
	}
	
	if(item.hasOwnProperty("Title")){
		detail.title=item.Title;
	}

	if(item.hasOwnProperty("Subtitle")){
		detail.subtitle=item.Subtitle;
	}

	if(item.hasOwnProperty("CurrentPrice")){
		detail.price=item.CurrentPrice.Value;
	}

	if(item.hasOwnProperty("Location")){
		detail.location=item.Location;
	}

	if(item.hasOwnProperty("ReturnPolicy")){
		detail.returnPolicy=item.ReturnPolicy.ReturnsAccepted+" within "+item.ReturnPolicy.ReturnsWithin;
	}

  if(item.hasOwnProperty("ItemSpecifics")){
    detail.itemSpec=item.ItemSpecifics.NameValueList.slice();
	}
	
	
	return detail;
}

function parseFB(item){
	var info={
		 productName:'N/A',
		 price:'',
		 link:''
	}

	if(item.hasOwnProperty("Title")){
		info.productName=item.Title;
	}

	if(item.hasOwnProperty("CurrentPrice")){
		info.price=item.CurrentPrice.Value;
	}

  if(item.hasOwnProperty("ViewItemURLForNaturalSearch")){
		 info.link=item.ViewItemURLForNaturalSearch;
  }
	return info;
}
// function parsePhotos(){
// 	var photos=[];
// 	var url='https://www.googleapis.com/customsearch/v1?q=iphone&cx=009335609940150755294:xrwyodipdjc&imgSize=huge&imgType=news&num=8&searchType=image&key=AIzaSyCLmOAXRgJol-6WX3h4RNSnZ782r9gw2lQ';

// 	request(url, function (error, response, body) {
// 		if (!error && response.statusCode == 200) {
// 			var items=JSON.parse(body).items;
// 			for(var i=0;i<8;i++){
// 					photos[i]=items[i].link;
// 					console.log(i+" photo "+items[i].link);
// 			}
// 			return photos;
// 		}
// 	})
// }
function parseSimilar(similarItems){
	var res=[];
	if (typeof similarItems!== 'undefined' && similarItems.length>0){
		for(var i=0;i<similarItems.length;i++){
      res[i]={
				"productName":"N/A",
				"url":"#",
				"price":0.0,
				"shippingCost":0,
				"dayLeft":0
			}
			res[i].productName=similarItems[i].title;
			res[i].url=similarItems[i].imageURL;
			res[i].price=parseFloat(similarItems[i].buyItNowPrice.__value__);
			res[i].shippingCost=similarItems[i].shippingCost.__value__;
			res[i].dayLeft=parseInt(similarItems[i].timeLeft.substring(
				similarItems[i].timeLeft.indexOf("P") + 1, 
				similarItems[i].timeLeft.indexOf("D")
		  ),10);
	  }
	}
	return res;
}



app.get("/item/:id",function(req,res){
	console.log(req.params.id); 
	var itemUrl='http://open.api.ebay.com/shopping?callname=GetSingleItem&responseencoding=JSON&appid=Shengtao-php-PRD-5e46bc082-2b5599a0&siteid=0&version=967&ItemID='+req.params.id+'&IncludeSelector=Description,Details,ItemSpecifics';

	var similarUrl='http://svcs.ebay.com/MerchandisingService?OPERATION-NAME=getSimilarItems&SERVICE-NAME=MerchandisingService&SERVICE-VERSION=1.1.0&CONSUMER-ID=Shengtao-php-PRD-5e46bc082-2b5599a0&RESPONSE-DATA-FORMAT=JSON&REST-PAYLOAD&itemId='+req.params.id+'&maxResults=20';
	
	

	var detailRes;
	var sellerRes;
	var similarRes;
	var fbInfo;
	request(itemUrl, function (error, response, body) {
	  if (!error && response.statusCode == 200) {
			var itemDetail=JSON.parse(body).Item;
			detailRes=parseDetail(itemDetail);
			sellerRes=parseSeller(itemDetail);
      fbInfo=parseFB(itemDetail);
			request(similarUrl, function (error, response, body) {
				if (!error && response.statusCode == 200) {
					var similarItems=JSON.parse(body).getSimilarItemsResponse.itemRecommendations.item;
					similarRes=parseSimilar(similarItems);
					// console.log("detail result "+detailRes);
					// console.log("seller result "+sellerRes);
					// console.log("similar result "+similarRes);

					var photos=[
					'http://via.placeholder.com/300',
					'http://via.placeholder.com/300',
					'http://via.placeholder.com/300',
					'http://via.placeholder.com/300',
					'http://via.placeholder.com/300',
					'http://via.placeholder.com/300',
					'http://via.placeholder.com/300',
					'http://via.placeholder.com/300'];
					var googleUrl='https://www.googleapis.com/customsearch/v1?q='+detailRes.title+'&cx=009335609940150755294:xrwyodipdjc&imgSize=huge&imgType=news&num=8&searchType=image&key=AIzaSyCLmOAXRgJol-6WX3h4RNSnZ782r9gw2lQ';

					request(googleUrl, function (error, response, body) {
						if (!error && response.statusCode == 200) {
							var items=JSON.parse(body).items;
							if(items!==undefined){
								for(var i=0;i<items.length;i++){
									photos[i]=items[i].link;
									// console.log(i+" photo "+items[i].link);
							  }
							}
							res.send({product:detailRes,photos:photos,seller:sellerRes,similar:similarRes,fbInfo:fbInfo});
						}else{
							res.send({product:detailRes,photos:photos,seller:sellerRes,similar:similarRes,fbInfo:fbInfo});
						}
					})
						
				}
			})
			
	  }
	})

});

// advanced search
function parseResult(items){
	var result=[];

  // var headername=['index','image','title','price','shipping','zip','seller','wishlist'];

  for (var i = 0; i < items.length; i++) {
		var item={
			"index":i+1,
			"image":"N/A",
			"title":"N/A",
			"id":0,
			"price":"N/A",
			"shipping":"N/A",
			"zip":"N/A",
			"seller":"N/A",
			"wishlist":false,
			"shippingInfo":{}
		};

		//update image
		if(items[i].hasOwnProperty("galleryURL")){
       item.image=items[i].galleryURL[0];
		}
		
		//update title
		item.title=items[i].title[0];
        item.id=items[i].itemId[0];
		//update price
		if(items[i].hasOwnProperty("sellingStatus")){
			item.price=items[i].sellingStatus[0].currentPrice[0].__value__;
		}

		//update shipping
		if(items[i].hasOwnProperty("shippingInfo")){
			item.shippingInfo=Object.assign({},items[i].shippingInfo[0]);
			if(items[i].shippingInfo[0].hasOwnProperty("shippingServiceCost")){
				if(items[i].shippingInfo[0].shippingServiceCost[0].__value__=="0.0"){
					item.shipping="Free Shipping"; 
				}else{
					item.shipping=items[i].shippingInfo[0].shippingServiceCost[0].__value__; 
				}
      }
		}
		if(items[i].hasOwnProperty("returnsAccepted")){
			item.shippingInfo["returnsAccepted"]=items[i].returnsAccepted;
		}
	
		//update zip
		if(items[i].hasOwnProperty("postalCode")){
			item.zip=items[i].postalCode[0];
		}
		//update seller
		if(items[i].hasOwnProperty("sellerInfo")){
			item.seller=items[i].sellerInfo[0].sellerUserName[0];
		}

		result.push(item);
	}
   return result;
}
app.get('/productSearch', function(req,res){
	// res.sendFile(__dirname +'/index.html');
	console.log(req.query);
	
	var urlstr='http://svcs.ebay.com/services/search/FindingService/v1?OPERATION-NAME=findItemsAdvanced&SERVICE-VERSION=1.0.0&SECURITY-APPNAME=Shengtao-php-PRD-5e46bc082-2b5599a0&RESPONSE-DATA-FORMAT=JSON&REST-PAYLOAD&paginationInput.entriesPerPage=50&keywords=';
      urlstr+=req.query.keyword;
      
      if(req.query.category!='0'){
        urlstr+="&categoryId="+req.query.category;
			}
			
      urlstr+="&buyerPostalCode="+req.query.zipcode+"&itemFilter(0).name=MaxDistance&itemFilter(0).value="+req.query.maxDistance;

      var index=1;

      //shipping filter
      if(req.query.pickup!='false' || req.query.free!='false'){
        urlstr+="&itemFilter("+index+").name=FreeShippingOnly&itemFilter("+index+").value="+req.query.free;
        index++;
        urlstr+='&itemFilter('+index+').name=LocalPickupOnly&itemFilter('+index+').value='+req.query.pickup;
        index++;
      }

      //condition filter
      if(req.query.New!='false' || req.query.used!='false' || req.query.unspec!='false'){
        urlstr+='&itemFilter('+index+').name=Condition';
        var conditionIndex=0;
        if(req.query.New!='false'){
          urlstr+='&itemFilter('+index+').value('+conditionIndex+')=New';
          conditionIndex++;
        }
        if(req.query.used!='false'){
          urlstr+='&itemFilter('+index+').value('+conditionIndex+')=Used';
          conditionIndex++;
        }
        if(req.query.unspec!='false'){
          urlstr+='&itemFilter('+index+').value('+conditionIndex+')=Unspecified';
          conditionIndex++;
        }
        index++;
      }

      urlstr+='&itemFilter('+index+').name=HideDuplicateItems&itemFilter('+index+').value=true&outputSelector(0)=SellerInfo&outputSelector(1)=StoreInfo';

			console.log(urlstr);
			
	request(urlstr, function (error, response, body) {
	  if (!error && response.statusCode == 200) {
			var content=JSON.parse(body);
			
			if(!content.findItemsAdvancedResponse[0].hasOwnProperty("searchResult")){
				res.send(content.findItemsAdvancedResponse[0].errorMessage[0].error[0].message[0]);  //serach error
				return;
			}
			var result=content.findItemsAdvancedResponse[0].searchResult[0];
			if(!result.hasOwnProperty("item")){
				res.send("No Records");    //no record
				return;
			}
			// console.log(result.item);
			var parseRes=parseResult(result.item);
			// console.log(parseRes);
			res.send(parseRes);
	  }
	})
})

//zipcode autocomplete
app.get('/auto/:zip', function(req,res){
	console.log(req.params.zip); 

	var url='http://api.geonames.org/postalCodeSearchJSON?postalcode_startsWith='+req.params.zip+'&username=shengtaohou&country=US&maxRows=5';
	request(url, function (error, response, body) {
		var result=[];
		if (!error && response.statusCode == 200) {
			var content=JSON.parse(body).postalCodes;
       content.forEach(function(element){
				result.push(element.postalCode);
			});
			res.send(result);
		}
	})
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))