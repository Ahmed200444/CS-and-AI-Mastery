const {COOKIE,cookie,json}=require('./_shared');
exports.handler=async(event)=> event.httpMethod==='POST'?json(200,{ok:true},[cookie(COOKIE,'',0)]):json(405,{error:'Method not allowed.'});
