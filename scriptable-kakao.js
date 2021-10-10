/* 
Shortcuts Parameters
 */
const arguments = args.shortcutParameter;
console.log("Args: ".concat(arguments));

const userEmail = arguments["email"];
const userPw = arguments["pw"];

/* 
Requests
 */
const loginPageUrl = "https://accounts.kakao.com/login?continue=https%3A%2F%2Faccounts.kakao.com%2Fweblogin%2Faccount%2Finfo";

let requestLoginPage = new Request(loginPageUrl);

requestLoginPage.method = "GET";
requestLoginPage.headers = {    
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",      
    "Referer": "https://accounts.kakao.com/"
};


const tiaraUrl = "https://stat.tiara.kakao.com/track";

let requestTiara = new Request(tiaraUrl);

requestTiara.method = "GET";
requestTiara.headers = {
    "Referer": "https://accounts.kakao.com/"    
};


const authUrl = "https://accounts.kakao.com/weblogin/authenticate.json";

let requestAuth = new Request(authUrl);

requestAuth.method = "POST";
requestAuth.headers = {    
    "Accept-Encoding": "gzip, deflate, br",
    "Accept-Language": "ko,en;q=0.9,en-US;q=0.8",
    "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
    "Referer": "https://accounts.kakao.com/login?continue=https%3A%2F%2Faccounts.kakao.com%2Fweblogin%2Faccount%2Finfo"
};


const ssoUrl = "https://accounts.kakao.com/weblogin/sso_initialize?continue=https%3A%2F%2Fmap.kakao.com";

let requestSSO = new Request(ssoUrl);

requestSSO.method = "GET";


const tokenLoginUrl = "https://logins.daum.net/accounts/kakaossotokenlogin.do?redirect=false&ssotoken=";

let requestTokenLogin = new Request(tokenLoginUrl);

requestTokenLogin.method = "GET";
requestTokenLogin.headers = {
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Accept-Language": "ko,en;q=0.9,en-US;q=0.8",
    "Referer": "https://accounts.kakao.com/"
};


const qrCodeUrl = "https://vaccine-qr.kakao.com/api/v1/qr";

let requestQRCode = new Request(qrCodeUrl);

requestQRCode.method = "POST";
requestQRCode.headers = {
    "Content-Type": "application/json;charset=utf-8"
};
requestQRCode.body = "{\"epURL\":null}";


/* 
reCAPTCHA
 */
let recaptchaWebview = new WebView();


/* 
LoginPage
 */
console.log("###LoginPageResp###");

let responseLoginPage = await requestLoginPage.loadString();
let cookies = requestLoginPage.response["cookies"];

if (requestLoginPage.response["statusCode"] != 200) {
    console.error(requestLoginPage.response["statusCode"]);
    throw new Error(requestLoginPage.response["statusCode"]);
}


/* 
Parse Token, Key
 */
const regexToken = /(?:<meta name="csrf-token" content=")(.*)(?:" \/>)/;
const regexAuth = /(?:<input type="hidden" name="p" value=")(.*)(?:"\/>)/;

const token = responseLoginPage.match(regexToken)[0].replace(regexToken, "$1")
console.log("Token: ".concat(token));

const authKey = responseLoginPage.match(regexAuth)[0].replace(regexAuth, "$1");
console.log("AuthKey: ".concat(authKey));


/* 
Tiara
 */
console.log("###TiaraResp###");
requestTiara.headers.Cookie = cookies;

let responseTiara = await requestTiara.load();
cookies = cookies.concat(requestTiara.response["cookies"]);

if (requestTiara.response["statusCode"] != 200) {
    console.error(requestTiara.response["statusCode"]);
    throw new Error(requestTiara.response["statusCode"]);
}


/* 
Encrypt
 */
const encryptedEmail = CryptoJS.AES.encrypt(userEmail, authKey);
console.log("EncryptedEmail: ".concat(encryptedEmail));

const encryptedPw = CryptoJS.AES.encrypt(userPw, authKey);
console.log("EncryptedPW: ".concat(encryptedPw));


/* 
Auth
 */
console.log("###AuthResp###");
requestAuth.headers.Cookie = cookies;

requestAuth.body = 
    'os=' + encodeURIComponent("web") + 
    '&webview_v=' + encodeURIComponent(2) + 
    '&continue=' + encodeURIComponent("https://accounts.kakao.com/weblogin/account/info") + 
    '&email=' + encodeURIComponent(encryptedEmail) + 
    '&password=' + encodeURIComponent(encryptedPw) + 
    '&third=' + encodeURIComponent(false) + 
    '&k=' + encodeURIComponent(true) + 
    '&authenticity_token=' + encodeURIComponent(token);

let responseAuth = await requestAuth.loadJSON();
cookies = cookies.concat(requestAuth.response["cookies"]);

if (responseAuth["status"] == -481) {
    console.log("Error -481");
    recaptchaWebview.present(true);
    await recaptchaWebview.loadURL(loginPageUrl);
    const recaptchaToken = await recaptchaWebview.evaluateJavaScript("document.getElementById(\"recaptcha-token\").innerText;");
    console.log(recaptchaToken);
} else if (responseAuth["status"] != 0) {
    console.error(responseAuth);
    throw new Error(responseAuth["message"]);
}


/* 
SSO
 */
console.log("###SSOResp###");
requestSSO.headers.Cookie = cookies;

let responseSSO = await requestSSO.loadJSON();
cookies = cookies.concat(requestSSO.response["cookies"]);

if (responseSSO["status"] != 0) {
    console.error(responseSSO);
    throw new Error(responseSSO["message"]);
}


/* 
TokenLogin
 */
console.log("###TokenLogin###");
requestTokenLogin.headers.Cookie = cookies;
requestTokenLogin.url = requestTokenLogin.url.concat(responseSSO["tokens"][0]["token"]);

let responseTokenLogin = await requestTokenLogin.load();
cookies = cookies.concat(requestTokenLogin.response["cookies"]);

if (requestTokenLogin.response["statusCode"] != 200) {
    console.error(requestTokenLogin.response["statusCode"]);
    throw new Error(requestTokenLogin.response["statusCode"]);
}


/* 
QRCode
 */
console.log("###QRCode###");
requestQRCode.headers.Cookie = cookies;

let responseQRCode = await requestQRCode.loadJSON();

Script.setShortcutOutput(responseQRCode);
Script.complete();
