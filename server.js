var express = require('express');
const port = process.env.PORT || 3000;
const { body,validationResult } = require('express-validator');
const { sanitizeBody } = require('express-validator');
var path=require('path');

var app = express();

const puppeteer = require('puppeteer');

const validUrl = require('valid-url');
var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies




app.post('/', function(req, res) {
    
        body('token', 'token must not be empty.').isLength({ min: 1 }).trim();
        body('ref', 'ref must not be empty.').isLength({ min: 1 }).trim();
        body('montant', 'montant must not be empty.').isLength({ min: 1 }).trim();
        body('tel_marchand', 'tel_marchand must not be empty.').isLength({ min: 1 }).trim();
        body('tel_client', 'tel_client must not be empty.').isLength({ min: 1 }).trim();
        body('redirect', 'redirect must not be empty').isLength({ min: 1 }).trim();
    
        // Sanitize fields.
        sanitizeBody('*').trim().escape();
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/error messages.
            res.redirect();
            // console.log(req.body);
            return;
        }
        
        // '<!DOCTYPE html>'+
        // +'<html lang="en">'+
        // +'<head>'+
        //     +'<meta charset="UTF-8">'+
        //     +'<meta name="viewport" content="width=device-width, initial-scale=1.0">'+
        //     +'<meta http-equiv="X-UA-Compatible" content="ie=edge">'+
        // +'</head>'+
        // +'<body>'+
        var html = "<form id='form' method='POST' action='https://mypvit.com/airtelmoneypvit.kk'> <input type='text' id='ref' name='ref' value='";
                    html += req.body.ref;
                    html += "'> <input type='text' id='_token' name='_token' value='";
                    html += req.body.token;
                    html += "'  > <input type='text' id='token' name='token' value='";
                    html += req.body.token;
                    html += "' /> <input type='text' id='tel_marchand' name='tel_marchand' value='";
                    html += req.body.tel_marchand;
                    html += "'> <input type='text' id='montant' name='montant' value='";
                    html += req.body.montant;
                    html += "'> <input type='text' id='redirect' name='redirect' value='";
                    html += req.body.redirect;
                    html +="'> <input value='Go' id='go'  type='submit'/> </form>";

        console.log('PVIT process ');

            var num_transac = "unkwon";

            var sms_echec = "server_error";
            var statut = "server_error";

            (async() => {

            try{
                    // Create browser instance, and give it a first tab
                    const browser = await puppeteer.launch({
                    args: ['--no-sandbox', '--disable-setuid-sandbox'],
                   // ignoreHTTPSErrors: true
                    });

                    const page = await browser.newPage();
                    await page.setViewport({ width: 1280, height: 1800 });
                    await page.setContent(html);
                    // await page.setContent(html, {
                    //     waitUntil: ["load","networkidle0"]
                    // });
                    //console.log(p);
                    page.waitForSelector("#go");
                    setTimeout(async () => {
                         console.log(await page.content());
                    }, 3000);

                    //await page.setExtraHTTPHeaders({'cache-control': 'no-cache', 'Connection': 'keep-alive','Host': '127.0.0.1:8080',
                    //'Accept-Encoding': 'gzip, deflate', 'Cache-Control': 'no-cache', 'Content-Type': 'application/x-www-form-urlencoded'});
                    // Allows you to intercept a request; must appear before
                    await page.setRequestInterception(true);

                    page.on('request', interceptedRequest => {

                        // Here, is where you change the request method and
                        // add your post data
                        if(interceptedRequest.method == 'POST'){
                            console.log(interceptedRequest);
                            console.log("--------------------- *********** -----------------");
                            console.log("--------------------- *********** -----------------");
                            console.log("--------------------- *********** -----------------");
                            console.log("--------------------- *********** -----------------");
                        }
                        interceptedRequest.continue();
                    });

                    page.setContent(html);
                    console.log("--------------------- on wait response");
                    
                    await page.click('[type="submit"]');
                    console.log("-----------------------------");
                    await page.waitForResponse(response => response.status() === 200);
                    console.log("Begin");
                    page.on('dialog', async dialog => {
                        console.log("******************************");
                        console.log(dialog.message());
                        await dialog.dismiss();
                    });

                    await page.waitForSelector('#leModal',{ visible: true });
                    await page.waitForSelector('#btnConnexion', { visible: true });
                    await page.evaluate(() => {
                        document.querySelector('#btnConnexion').click();
                    });
                    console.log("--------------------- click first");

                    // Type into search box.
                    await page.type('#tel', req.body.tel_client);
                    console.log("--------------------- tel_client");

                    await page.waitForSelector('#accord_client');
                    console.log("--------------------- accord_client");
                    var s  = await page.evaluate(() => {
                        document.querySelector("#accord_client").parentElement.click();
                        return document.querySelector('#btnPayer').enable;
                    });
                    console.log(s);

                    console.log("--------------------- btnPayer");

                    await page.waitFor(1000); 
                    
                    await page.waitForSelector('#btnPayer');
                     
                    console.log("--------------------- btnPayer");
                    
                    try{
                        await page.evaluate(`(async() => {
                            payer();
                         })()`);
                    }catch(e){
                        try{
                            console.log("Fail1");
                            await page.evaluate(`(async() => {
                                payer();
                             })()`);
                        }catch(e){
                            console.log("Fail2");
                            await page.evaluate(() => {
                                return document.querySelector('#btnPayer').click();
                            });
                         console.log("Fail3");
                        }
                    }
                    console.log(s);
                    await page.waitForSelector('#panel_principal', { hidden: true, timeout: 45000 });
                    console.log("--------------------- panel_principal");
                   
                    num_transac = await page.$eval('#num_transaction', el => el.value);
                    sms_echec = await page.$eval('#sms_echec', el => el.innerHTML);
                    
                    try {
                        await page.waitForSelector("#panel_sucess", { visible: true , timeout: 500 })
                        statut = "success";
                    } catch (error) {}

                    if(statut === "server_error"){
                        try {
                            await page.waitForSelector("#panel_avertissement", { visible: true , timeout: 500 })
                            console.log("Credit insuffisant.");
                            statut = "warning";
                        } catch (error) {
                            statut = "error";
                            console.log("Echec de la transaction.");
                        }
                    }
                            // panel_erreur
                    console.log("End");
                    console.log("--------------------- End");
                    await browser.close();
                }catch(e){
                    console.log(e);
                }
                console.log("End+");
               
                switch(statut){
                    case "success":
                            res.status(200).json( {statut: 200, ref: req.body.ref, num_transaction: num_transac, log : "success trasaction"});
                    break;
                    case "warning":
                            res.status(200).json( {statut: 400, ref: req.body.ref, num_transaction: num_transac, log: sms_echec});
                    break;
                    case "error":
                            res.status(200).json( {statut: 500, ref: req.body.ref, num_transaction: num_transac, log: sms_echec});
                    break;
                    default:
                            res.status(200).json( {statut: 0, ref: req.body.ref, num_transaction: num_transac, log: sms_echec});
                }
                return;
            })();
       

});

app.listen(port, function() {
    console.log('App listening on port ' + port)
})
