# Creating an API for Google Sheets Using Google Apps Scripts 

## Table of Contents


## Motivation



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

### Writing Data

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

Now, save the project, and you are ready to deploy the script. 

(Note: One thing I noticed here is that if you are using Chrome and your browser is signed in to a different account than you are using to create the script (accout 1 is signed into chrome but you signed into google drive with account 2), the deployment will just load infinitely.)

![script-deploy](/images/script-deploy.png)

First, click `Deploy`, then `New Deployment`.

![script-deploy-type](/images/script-deploy-type.png)

Next, click on the settings gear at the top left and Select `Web app`.

![script-deploy-config](/images/script-deploy-config.png)

From here, add a description to your script deploymend if you would like, and change "Who has access" to Anyone. 

Depending on your situation, you may be able to get away with keeping permissions strict, but if something like an embedded microcontroller or a Raspberry PI will be accessing the script, there isn't a way (at least that I am aware of) to authenticate the request with a Google account.

After clicking Deploy, you will be prompted to authorize the newly created web app to run the script by logging into your google account again. Once this is done, you will be given a Deployment ID and a Web App URL. You should copy these somewhere safe, but _keep them secret_, as anyone with the ID can execute the code (if you set permissions to Anyone).

Now that you have deployed the script, all you have to do is send a GET request to the Web App URL, which you can test by entering something like `WEB_APP_URL?id=1&value=9` into your browser.

If everything worked, you will be redirected to a page saying `The script completed but did not return anything`. Now go back to your spreadsheet and you should see the new row of data.

### Reading Data




## Further Reading