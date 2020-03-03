const { body,validationResult } = require('express-validator');
const { sanitizeBody } = require('express-validator');
const { pvit } = require('../modules/pupperter_pvit');
const puppeteer = require('puppeteer');
// Handle payment create on POST.
exports.payment_create_post = [

    // Validate fields.
    // body('example').isLength({ min: 1 }).trim().withMessage('example empty.')
    // .isAlpha().withMessage('example must be alphabet letter'),

    body('token', 'token must not be empty.').isLength({ min: 1 }).trim(),
    body('ref', 'ref must not be empty.').isLength({ min: 1 }).trim(),
    body('montant', 'montant must not be empty.').isLength({ min: 1 }).trim(),
    body('tel_marchand', 'tel_marchand must not be empty.').isLength({ min: 1 }).trim(),
    body('tel_client', 'tel_client must not be empty.').isLength({ min: 1 }).trim(),
    body('redirect', 'redirect must not be empty').isLength({ min: 1 }).trim(),

    // Sanitize fields.
    sanitizeBody('*').trim().escape(),
    // Process request after validation and sanitization.
    (req, res, next) => {


        var mydata =
        'token='+req.body.token+'&'+
        'ref='+req.body.ref+'&'+
        'montant='+req.body.montant+'&'+
        'tel_marchand='+req.body.tel_marchand+'&'+
        'tel_client='+req.body.tel_client+'&'+
        'redirect='+req.body.redirect;

        var postdata = {
            'token': req.body.token,
            'ref': req.body.ref,
            'montant': req.body.montant,
            'tel_marchand': req.body.tel_marchand,
            'tel_client': req.body.tel_client,
            'redirect': req.body.redirect
        };
        // Extract the validation errors from a request.
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/error messages.
            res.redirect();
            // console.log(req.body);
            // console.log("Post Data : "+postData);
            return;
        }
        else {
            //console.log(req.body);
            // Data from form is valid. process payment to pvit.
            console.log("Hello let'us beginning serious way");
            // Create a payment object with escaped and trimmed data.




            console.log('PVIT process ');

            var num_transac = "unkwon";
            var statut = "error";

            (async() => {

            try{
                    // Create browser instance, and give it a first tab
                    const browser = await puppeteer.launch({
                    args: ['--no-sandbox', '--disable-setuid-sandbox'],
                    ignoreHTTPSErrors: true
                    });

                    const page = await browser.newPage();

                    // Allows you to intercept a request; must appear before
                    // your first page.goto()
                    // await page.setRequestInterceptionEnabled(true);
                    await page.setRequestInterception(true);
                    const resp = await page.goto('https://Mypvit.com/airtel-money-secure-payement.kk', { timeout: 60000} );
                    console.log(resp);
                    // Request intercept handler... will be triggered with
                    // each page.goto() statement
                    page.on('request', interceptedRequest => {

                        // Here, is where you change the request method and
                        // add your post data
                        var data = {
                            'method': 'POST',
                            'postData': postdata,
                        };

                        // Request modified... finish sending!

                        interceptedRequest.continue(data);
                    });

                    // Navigate, trigger the intercept, and resolve the response
                    const resp2 = await page.goto('https://Mypvit.com/airtel-money-secure-payement.kk', { timeout: 60000} );
                    console.log("--------------------- on wait response");
                    console.log("--------------------- on wait response");
                    console.log("--------------------- on wait response");
                    console.log(resp2);

                    console.log("Begin");
                    await page.waitForSelector('#leModal',{ visible: true });
                    const button = await page.waitForSelector('#btnConnexion', { visible: true });
                    await button.click();
                    console.log("--------------------- click first");
                    await page.waitForFunction('#leModal', { display: none });

                    // Type into search box.
                    await page.type('#tel', tel_client);

                    const checkbox = await page.waitForSelector('#accord_client');
                    await checkbox.click();

                    const button1 = await page.waitForSelector('#btnConnexion', { visible: true });
                    await button1.click();

                    await page.waitForSelector('#panel_principal', { hidden: true });

                    const element = await page.$('#num_transaction');
                    num_transac = await (await element.getProperty('innerHTML')).jsonValue();
                    console.log(element);
                    //num_transaction = page.$('#num_transaction');
                    statut = "error";

                    try {
                    await page.waitForSelector("#panel_sucess", { visible: true , timeout: 500 })
                    statut = "success";
                    } catch (error) {console.log("Transaction effectué.");}

                    if(statut === "error"){
                    try {
                        await page.waitForSelector("#panel_avertissement", { visible: true , timeout: 500 })
                        statut = "warning";
                    } catch (error) { console.log("Credit insuffisant."); }
                    }else{
                    console.log("Echec de la transaction.");        // panel_erreur
                    }
                    console.log("End");
                    console.log("--------------------- End");
                }catch(e){
                    console.log(e);
                }
                console.log("End+");
                await browser.close();
                switch(statut){
                    case "success":
                            res.status(200).json( {statut: 200, ref: postData.ref, num_transaction: num_transac});
                    break;
                    case "warning":
                            res.status(200).json( {statut: 400, ref: postData.ref, num_transaction: num_transac});
                    break;
                    default:
                            res.status(200).json( {statut: 500, ref: postData.ref, num_transaction: num_transac});
                }
                //const data = pvit.pvit_action(postData, req.body.tel_client, req.body.ref);
                //res.status(200).json(data);
                return;
            })();
           // console.log(postData.ref);
        }
    }
];
