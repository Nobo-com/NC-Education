// ==========================================
// PRO Google Apps Script Code for OTP
// ==========================================
function doGet(e) { return handleRequest(e); }
function doPost(e) { return handleRequest(e); }
function handleRequest(e) {
  var headers = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };
  try {
    var email = e.parameter.email;
    var otp = e.parameter.otp;
    var subject = e.parameter.subject || "Nobo Class - ভেরিফিকেশন কোড";
    if (!email || !otp) return createJsonResponse({ status: "error", message: "Email or OTP is missing!" }, headers);
    var htmlBody = `OTP: ${otp}`;
    MailApp.sendEmail({ to: email, subject: subject, htmlBody: htmlBody });
    return createJsonResponse({ status: "success", message: "OTP sent successfully" }, headers);
  } catch (error) { return createJsonResponse({ status: "error", message: error.toString() }, headers); }
}
function createJsonResponse(responseObject, headers) {
  var output = ContentService.createTextOutput(JSON.stringify(responseObject));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
