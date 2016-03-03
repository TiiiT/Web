/*
假设：
1、该打印模块不需要处理条形码和上面信息之间的关联关系；
2、收银机传递过来的数据格式为：
	"条形码"：{"名称":"xxx","数量单位":"xxx","单价":"xxx","类别":"xxx","条形码":"xxx"}
3、现在有商品：香蕉，苹果，锅，瓢，铅笔，毛笔,在初始化的时候都是不带优惠活动的.
4、优惠活动种类不会很多；
5、点击打印小票之前，必须先确认是否设置或者更新了活动；
6、在IE 10+及Chrome 版本 48.0 测试OK！
*/

/*
初始化
*/
var goodsMsg;
var activities;
var oldTotalCoat = 0;
function init(){
	debugger;
	//初始化活动列表；
	if(!activities){
		activities = new Array();
	}
	//向列表添加活动信息
	var spans = document.getElementsByName("activity");
	for(var i=0;i<spans.length;i++){
		var inputs = spans[i].parentNode.getElementsByClassName("item");
		var obj = new activity(spans[i].id);
		for(var j=0;j<inputs.length;j++){
			if(inputs[j].checked)
			obj.addItems(inputs[j].value);
		}
		activities.push(obj);
	}
	alert("共有"+activities.length+"个活动");
	//模拟生成收银机传递过来的数据；
	goodsMsg=[
			   {"名称":"香蕉","单位":"斤","单价":"3.00","类别":"","条形码":"ITEM000001-2.6"},
			   {"名称":"苹果","单位":"斤","单价":"2.00","类别":"","条形码":"ITEM000002-3"},
			   {"名称":"锅","单位":"个","单价":"1.00","类别":"","条形码":"ITEM000003-16"},
			   {"名称":"瓢","单位":"个","单价":"5.00","类别":"","条形码":"ITEM000004-1.4"},
			   {"名称":"毛笔","单位":"支","单价":"10.00","类别":"","条形码":"ITEM000005-2"},
			   {"名称":"铅笔","单位":"支","单价":"2.00","类别":"","条形码":"ITEM000006"}
			 ];
}

/*
优惠活动对象
*/
function activity(type){
	this.type = type;
	this.items = "";
	this.addItems = function(name){
			this.items += name+"-";
		}
}

/*
设置优惠活动：
*/
function setActivity(elem){
	debugger;
	var inputs = elem.parentNode.getElementsByClassName("item");
	if(activities && activities.length>0){
		for(var i=0;i<activities.length;i++){
			if(activities[i].type == elem.parentNode.getElementsByTagName("span")[0].id){
				activities[i].items = "";
				for(var j=0;j<inputs.length;j++){
					if(inputs[j].checked)
					activities[i].addItems(inputs[j].value);
				}
				alert("更新完毕！"+"\n"+"目前的活动有："+activities[i].items);
				break;
			}
		}
		/*
		var str="";
		for(var i=0;i<activities.length;i++){
			str += activities[i].items+"=====";
		}
		alert(str);
		*/
	}else{
		if(confirm("网页已经过期，是否刷新页面？")){
			location.reload();
		}
	}
}

/*
打印小票：
*/
function print(){
	debugger;
	var head_Msg = "***<没钱赚商店>购物清单***\n";
	var body_Msg = "";
	//不要介意中文 +_+
	try{
		//alert(goodsMsg.length);
		var amount;
		var cost;
		var totalCost = 0;
		var buyTwoMsg = "";
		for(var i=0;i<goodsMsg.length;i++){
			amount = getAmount(goodsMsg[i]);
			cost = getCost(goodsMsg[i],amount);
			totalCost += parseFloat(cost);
			body_Msg = body_Msg+"名称:"+goodsMsg[i].名称+"，数量:"+amount+goodsMsg[i].单位+"，单价:"+parseFloat(goodsMsg[i].单价).toFixed(2)+"(元)，小计:"+cost+"元"+
			(activities[1].items.indexOf(goodsMsg[i].名称)>=0 && activities[0].items.indexOf(goodsMsg[i].名称)<0?"，节省"+(((parseFloat(goodsMsg[i].单价)*amount)-cost).toFixed(2))+"(元)\n":"\n");
			var temp = getMsg(goodsMsg[i],amount);
			if(temp && temp !=""){
				buyTwoMsg += temp+"\n";
			}
		}
		body_Msg += "--------------------------\n";
		if(buyTwoMsg != ""){
			body_Msg += buyTwoMsg+"--------------------------\n共计："+parseFloat(totalCost).toFixed(2)+"元\n";
		}else{
			body_Msg += "共计："+totalCost+"元\n";
		}
		if(parseFloat(oldTotalCoat) != totalCost){
			body_Msg += "节省："+(parseFloat(oldTotalCoat)-totalCost).toFixed(2)+"(元)\n";
		}
		body_Msg += "**************************\n";
		head_Msg += body_Msg;
		oldTotalCoat=0;
		//alert(body_Msg);
		//alert(buyTwoMsg);
		document.getElementById("show").innerText=head_Msg;
	}catch(e){
		
	}
}

/*
返回商品数量：
*/
function getAmount(obj){
	var code = obj.条形码;
	var temp = code.split("-");
	var amount = (1.0).toFixed(1);
	if(temp.length>1){
		amount = parseFloat(temp[1]).toFixed(1);
	}
	return amount;
}

/*
返回商品的价格：
*/
function getCost(obj,amount){
	//var cost = (parseFloat(obj.单价) * amount).toFixed(2);
	var cost;
	for(var i=0;i<activities.length;i++){
		//不写配置文件了,暂时写死……
		if(activities[i].type == "Buytwo" && activities[i].items.indexOf(obj.名称)>=0){
			//如果顾客的购买数量超过了2斤，自愿放弃享受买二赠一的优惠，则默认放弃任何优惠活动，即使该商品还有95折的优惠
			if(parseFloat(amount).toFixed(2)<3.0){
				break;
			}
			cost = ((parseFloat(obj.单价) * amount).toFixed(2)-(amount<3.0?amount:Math.floor(amount/3))*parseFloat(obj.单价).toFixed(2)).toFixed(2);
			break;
		}else if(activities[i].type == "Discount" && activities[i].items.indexOf(obj.名称)>=0){
			cost = ((parseFloat(obj.单价) * amount).toFixed(2)*0.95).toFixed(2);
			break;
		}
	}
	if(!cost){
		cost = (parseFloat(obj.单价) * amount).toFixed(2);
	}
	oldTotalCoat = (parseFloat(oldTotalCoat)+(parseFloat(obj.单价) * amount)).toFixed(2);
	return cost;
}

/*
返回买二赠一商品的信息
*/
function getMsg(obj,amount){
	var msg = "";
	if(activities[0].items.indexOf(obj.名称)>=0){
		msg += "名称:"+obj.名称+"，数量:"+amount+obj.单位;
	}
	return msg;
}