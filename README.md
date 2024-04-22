# Creating an API for Google Sheets Using Google Apps Scripts 

## Table of Contents
- [Why Google Sheets/App Scripts?](#why-google-sheetsapp-scripts)
- [Create a spreadsheet](#create-a-spreadsheet)
- [Create a script](#create-a-script)
- [Writing Data](#writing-data)
- [Reading Data](#reading-data)
- [Deploying Your Script](#deploying-your-script)
- [Further Reading](#further-reading)

## Why Google Sheets/App Scripts?

While all the common databases are great at what they do, sometimes they might not be the best option. What if you are working on a small, simple project, don't want to bother setting up hosting for it, or need it to be accessible to people who don't know much about database design? Using Google Sheets can be a great alternative since it can be as simple or complex as you need it to be, and generally more people are familiar with Sheets/Excel than they are with something like a SQL database. All it takes is a relatively simple Google Apps Script to connect to it and serve as an API, and data can be read, written or modified through a single HTML GET request.

## Create a spreadsheet

The first thing to do is to set up a basic spreadsheet.

If you are following along with this example, you can either copy the data and functions as you go, or import the [spreadsheet](ExampleSpreadsheet.xlsx) found in this repository.

![spreadsheet](/images/example-sheet.png)

The spreadsheet itself is quite simple. There are two columns of data on the left: one containing a sensor ID and the other containing the corresponding sensor reading.

The values to the right of these columns are simply the overall averages of each sensor's data, calculated using the following functions.

```
Sensor 1 Avg:
=AVERAGE(FILTER(B2:B, A2:A = 1))
Sensor 2 Avg:
=AVERAGE(FILTER(B2:B, A2:A = 2))
```

![average-function](/images/sheets-average-function.png)



## Create a script

The next step is to create a script that can access the spreadsheet you just created. Conveniently, this can be done right from Google Drive. Just click the `+ New` button on the top left and you will see `Google Apps Script` under `More` at the bottom.

Once created, the Apps Script project will bring up a file in the code editor called `Code.gs`. This .gs file works just like javascript, just with some extra functions thrown in by Google to help with accessing many of their apps.

The two things you will need at the begining of every script are the id of your Google Sheet and the name of the sheet itself. The id can be found in the address bar of you web browser, and the sheet name is found in the bottom left corner of the page (the default is 'Sheet1').

![sheet-id](/images/sheet-id.png)

![sheet-name](/images/sheet-name.png)

Start by deleting the empty function that generates in the file, and replace it with the following few lines of code, replacing the two strings with the id and name of your own google sheet.

```
// Replace these strings with your sheet id and name
var SHEET_ID = "YOUR SHEET ID"
var SHEET_NAME = "YOUR SHEET NAME"
```

## Writing Data

Apps Scripts can have a variety of custom triggers from other integrated Google apps, such as on the submission of a Google Form, but the best and simplest way to trigger script execution from a third party app is to make an HTTP request.

```
// Called when a GET request is received
function doGet(request) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);
  sheet.appendRow([request.parameter.id, request.parameter.value])
}
```

Copy and paste the above function into `Code.gs`.

The function `doGet(request)` serves as the handler for whenever the script detects that a GET request was reveived. Similar functions also exist for other types of HTTP requests (POST, PUT, ...).

The `sheet.appendRow()` line simply adds another row to the spreadsheet containing the id and value passed in through query parameters from the GET request.

Now, save the project, and you are ready to test the script.

![script-deploy-test](/images/script-deploy-test.png)

Click on `Deploy > Test deployments` and copy the Web App URL.
You can execute the script by sending a GET request to the Web App URL, which you can do by entering something like `WEB_APP_URL?id=1&value=9` into your browser.

If everything worked, you will be redirected to a page saying `The script completed but did not return anything`. Now go back to your spreadsheet and you should see the new row of data.

![sheet-new-data](/images/sheet-new-data.png)

Now there is a new row with the sensor id and value you specified in the URL, and the average for that sensor should have updated as well.

## Reading Data

Right now we have two options: putting both the read and write functionality all in the same script, or creating seperate scripts for each required behavior. Each option has its pros and cons, and you will have to decide what makes the most sense for your use case. Having it all in one script is more contained, but you will need to set a query parameter to distinguish which behavior you want it to perform, along with many if statements to separate each behavior. On the other hand, seperate scripts can be cleaner on a per script basis, but you will have to keep track of each deployment ID individually (more on that later) you will have to manage more than just the one script. For the purposes of this example, we will use the first option.

First, since we want to keep the write function intact, put it inside an if statement like this:

```
var command = request.parameter.command;
    if (command === "write-data") {
    sheet.appendRow([request.parameter.id, request.parameter.value]);
}
```

You can still run the write command, but now the URL will look like `WEB_APP_URL?command=write-data&id=1&value=9`.

Now we can add the ability to get the two average sensor values through the API script. Reading data from the spreadsheet requires a few more lines of code, but it is still pretty simple.

```
else if (command === "read-averages") {
    var averages = sheet.getRange("D2:E2").getValues();
    var json = JSON.stringify([{"sensor-id": 1, "value": averages[0][0]}, {"sensor-id": 2, "value": averages[0][1]}]);
    return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}
```

This chunk of code reads the values of the cells containing the averages, converts them into a json string, and then uses the built in ContentService object to create an HTML response. Now, enter `WEB_APP_URL?command=read-averages` into your browser and you should see something like the following.

![read-averages-json](/images/read-averages-json.png)

Next, we can add another behaivior to get all the sensor data.

```
else if (command === "read-all-data") {
    lastrow = sheet.getLastRow();
    var ids = sheet.getRange("A2:A"+lastrow).getValues();
    var values = sheet.getRange("B2:B"+lastrow).getValues();
    var json = [];
    for (var i in ids) {
      json.push({"sensor-id": ids[i][0], "value": values[i][0]});
    }
    return ContentService.createTextOutput(JSON.stringify(json)).setMimeType(ContentService.MimeType.JSON);
}
```

This creates a list of objects containing the sensor readings and the id of the sensor that sent them. Entering `WEB_APP_URL?command=read-all-data` into the browser will show something similar to the below json object.

![read-all-data-json](/images/read-all-data-json.png)

## Deploying Your Script

Once you are done testing your script(s) and are ready to finalize them, you can create a versioned deployment. This deployment will not change as you update your script, so any users can continue to use a functioning version while you make updates to the code (the same reason you would want seperate production and development branches in GitHub).

(Note: One thing I noticed here is that if you are using Chrome and your browser is signed in to a different account than you are using to create the script (accout 1 is signed into chrome but you signed into google drive with account 2), the deployment will just load infinitely.)

![script-deploy](/images/script-deploy.png)

First, click `Deploy`, then `New Deployment`.

![script-deploy-type](/images/script-deploy-type.png)

Next, click on the settings gear at the top left and Select `Web app`.

![script-deploy-config](/images/script-deploy-config.png)

From here, add a description to your script deploymend if you would like, and change "Who has access" to Anyone. 

Depending on your situation, you may be able to get away with keeping permissions strict, but if something like an embedded microcontroller or a Raspberry PI will be accessing the script, there isn't a way (at least that I am aware of) to authenticate the request with a Google account.

After clicking Deploy, you will be prompted to authorize the newly created web app to run the script by logging into your google account again. Once this is done, you will be given a Deployment ID and a Web App URL. You should copy these somewhere safe, but _keep them secret_, as anyone with the ID can execute the code (if you set permissions to Anyone).

Now, you can use the Web App URL from your deployment just like you did in testing, but now other devices can execute the scripts as well.

## Further Reading

[Google Apps Script quickstart guide](https://developers.google.com/sheets/api/quickstart/apps-script)

[Build An API in Google Sheets and Google Apps Script](https://hooshmand.net/api-google-sheets-google-apps-script/)

[Make an API With Google Sheets and Google Apps Script (Youtube)](https://www.youtube.com/watch?v=3OakodfKjrU)