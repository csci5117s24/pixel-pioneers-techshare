# Creating an API for Google Sheets Using Google Apps Scripts 

## Table of Contents

- [Creating an API for Google Sheets Using Google Apps Scripts](#creating-an-api-for-google-sheets-using-google-apps-scripts)
  - [Table of Contents](#table-of-contents)
  - [Why Google Sheets/App Scripts?](#why-google-sheetsapp-scripts)
  - [Create a spreadsheet](#create-a-spreadsheet)
  - [Create a script](#create-a-script)
  - [Writing Data](#writing-data)
  - [Reading Data](#reading-data)
  - [Deleting Data](#deleting-data)
  - [Updating Data](#updating-data)
  - [Deploying Your Script](#deploying-your-script)
  - [Common Issues](#common-issues)
  - [Further Reading](#further-reading)


## Why Google Sheets/App Scripts?

SQL and noSQL databases are pretty great at what they do, and are generally the best (and prefered) way to do data storage. Google Sheets on the other hand is frowned upon by many people for any sort of data storage, no matter the scale. Why then does this document discuss how to make an API for Sheets? Well, there are actually a few cases where it would be more acceptable to use Sheets over a full scale database. Some such cases are if you are in a proof-of-concept stage of development where you need to bash something together quickly and focus your efforts elsewhere, or if you already have an existing spreadsheet set up that with functionality that might be too complex to be worth migrating to a true database. All it takes is a relatively simple Google Apps Script to connect to a Google Sheet and serve as an API, and data can be read, written or modified through a single HTML GET request.

For project 2, our group is making a plant tracker app that allows a user to connect to a sensor and track things like moisture and temperature. The sensors themselves run off of low power microcontrollers which have a minimal amount of on-board memory, so the overhead from including C libraries to interface with something like a mongodb database can be fairly expensive. The libraries for simply sending and receiving html requests however requires much less overhead. Storing the data in Google Sheets is also acceptable for this use case bacause we don't need to have any of the more complex functionality that would come with a fully functional database.

If you or your team decide that using Google Sheets is the way you want to proceed for your project, or if you are simply interested in playing around with it for yourself, Great! The rest of this document provides a tutorial for setting up some of the basic operations you might need for a general use case.

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

```javascript
// Replace these strings with your sheet id and name
var SHEET_ID = "YOUR SHEET ID"
var SHEET_NAME = "YOUR SHEET NAME"
```

## Writing Data

Apps Scripts can have a variety of custom triggers from other integrated Google apps, such as on the submission of a Google Form, but the best and simplest way to trigger script execution from a third party app is to make an HTTP request.

```javascript
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

If at any point before the end of this tutorial you want to test the code you have so far, see [Deploying Your Script](#deploying-your-script) for instructions on how to deploy and test the script.

If you deployed, you can test this specific function by entering `WEB_APP_URL?id=1&value=9`. If everything worked, you will be redirected to a page saying `The script completed but did not return anything`. Now go back to your spreadsheet and you should see the new row of data.

![sheet-new-data](/images/sheet-new-data.png)

Now there is a new row with the sensor id and value you specified in the URL, and the average for that sensor should have updated as well.

## Reading Data

Right now we have two options: putting both the read and write functionality all in the same script, or creating seperate scripts for each required behavior. Each option has its pros and cons, and you will have to decide what makes the most sense for your use case. Having it all in one script is more contained, but you will need to set a query parameter to distinguish which behavior you want it to perform, along with many if statements to separate each behavior. On the other hand, seperate scripts can be cleaner on a per script basis, but you will have to keep track of each deployment ID individually (more on that later) you will have to manage more than just the one script. For the purposes of this example, we will use the first option.

First, since we want to keep the write function intact, put it inside an if statement like this:

```javascript
var command = request.parameter.command;
    if (command === "write-data") {
    sheet.appendRow([request.parameter.id, request.parameter.value]);
}
```

You can still run the write command, but now the URL will look like `WEB_APP_URL?command=write-data&id=1&value=9`.

Now we can add the ability to get the two average sensor values through the API script. Reading data from the spreadsheet requires a few more lines of code, but it is still pretty simple.

```javascript
else if (command === "read-averages") {
    var averages = sheet.getRange("D2:E2").getValues();
    var json = JSON.stringify([{"sensor-id": 1, "value": averages[0][0]}, {"sensor-id": 2, "value": averages[0][1]}]);
    return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}
```

This chunk of code reads the values of the cells containing the averages, converts them into a json string, and then uses the built in ContentService object to create an HTML response. Now, enter `WEB_APP_URL?command=read-averages` into your browser and you should see something like the following.

![read-averages-json](/images/read-averages-json.png)

Next, we can add another behaivior to get all the sensor data.

```javascript
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

## Updating Data

The next CRUD operation to go over is Update. Add the following function to your Code.gs file.

```javascript
function doUpdate(request) {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName(SHEET_NAME);
    var lastRow = sheet.getLastRow(); // get the last row
    var dataRange = sheet.getRange(2, 1, lastRow, 2); // Assumes ID is in column A and value in column B. Starts at 2nd row, 1st column, extends down to last row, and spans 2 columns.
    var data = dataRange.getValues(); // getting the data and adding to a 2d array

    for (var i = 0; i < data.length; i++) { // iterating through the array
        if (data[i][0] == request.parameter.id) { // Checking if the ID matches
            sheet.getRange(i + 2, 2).setValue(request.parameter.value); // setting the new value for the matching id
            break;
        }
    }
}
```

Now add another `else if` block to your `doGet()` function and call doUpdate from there.

```javascript
else if (command === "update-data") {
    return doUpdate(request);
}
```

Since the code for update is a bit longer in this case, we have opted to move it into its own seperate function and call that from `doGet()`.

You can use the code above to update the value in the row that corresponds with the id that you passed in. You can test this code for yourself by entering `WEB_APP_URL?command=update-data&id=1&value=10`. In this case, you are updating the row with id 1 and changing the previous value in column 2 with the new value that is now 10.

![sheet-update](/images/sheet-update.png)

## Deleting Data

The final CRUD operation to go over is Delete. Add the following function to your Code.gs file.

```javascript
function doDelete(request) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);
  var lastRow = sheet.getLastRow(); // gets the last row
  var dataRange = sheet.getRange(2, 1, lastRow, 1); // get range parameters say that the range starts at 2nd row, column 1, extends down to last row, and spans 1 column.
  var data = dataRange.getValues(); // values are added to a 2d array

  for (var i = 0; i < data.length; i++) { // iterating through the array
    if (data[i][0] == request.parameter.id) { // finding the row to delete based on the matching id
      sheet.deleteRow(i + 2); // index adjustment due to first row being headers and array starting from 0.
      break;
    }
  }
}
```

Again, add another `else if` block to your `doGet()` function and call doDelete from there.

```javascript
else if (command === "delete-data") {
    return doDelete(request);
}
```

This code works just like the update function, except it  deletes the corresponsing id and data cells, shifting up every cell beneath the deleted ones.

You should now be able to test the delete feature by entering `WEB_APP_URL?command=delete-data&id=2`. In this case, you are deleting the first row in the Google Sheet that has an id of 2.

![sheet-delete](/images/sheet-delete.png)

With Create, Retrieve, Update, and Delete functionality complete, you now essentially have a customizable lightweight database that can be used for free and with minimal set up.

## Deploying Your Script

Once you are done testing your script(s) and are ready to finalize them, you can create a versioned deployment. This deployment will not change as you update your script, so any users can continue to use a functioning version while you make updates to the code (the same reason you would want seperate production and development branches in GitHub).

(Note: One thing I noticed here is that if you are using Chrome and your browser is signed in to a different account than you are using to create the script, the deployment will just load infinitely. See [Common Issues](#common-issues).)

![script-deploy](/images/script-deploy.png)

First, click `Deploy`, then `New Deployment`.

![script-deploy-type](/images/script-deploy-type.png)

Next, click on the settings gear at the top left and Select `Web app`.

![script-deploy-config](/images/script-deploy-config.png)

From here, add a description to your script deploymend if you would like, and change "Who has access" to Anyone. 

Depending on your situation, you may be able to get away with keeping permissions strict, but if something like an embedded microcontroller or a Raspberry PI will be accessing the script, there isn't a way (at least that I am aware of) to authenticate the request with a Google account.

After clicking Deploy, you will be prompted to authorize the newly created web app to run the script by logging into your google account again. Once this is done, you will be given a Deployment ID and a Web App URL. You should copy these somewhere safe, but _keep them secret_, as anyone with the ID can execute the code (if you set permissions to Anyone).

Now, you can use the Web App URL from your deployment just like you did in testing, but now other devices can execute the scripts as well.

This URL can also be viewed without having to create a new deployment by clicking `Deploy > Test deployments`

![script-deploy-test](/images/script-deploy-test.png)

## Common Issues

When trying to execute the script for the first time, if it does not work, check that the SHEET_NAME is correct. It should be set to the name of the sheet, which is found on the bottom left of the screen, NOT the name of the sheets document that is found on the top left.

When attempting to deploy your script, you may encounter an issue where the page will get hung up on loading the deloyment data. One possible cause for this is being logged in to different accounts in your chrome browser and in google drive itself. To fix this, sign in to the same google account in both places.

## Further Reading

[Google Apps Script quickstart guide](https://developers.google.com/sheets/api/quickstart/apps-script)

[Build An API in Google Sheets and Google Apps Script](https://hooshmand.net/api-google-sheets-google-apps-script/)

[Make an API With Google Sheets and Google Apps Script (Youtube)](https://www.youtube.com/watch?v=3OakodfKjrU)
