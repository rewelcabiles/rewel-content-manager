const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

if (require('electron-squirrel-startup')) {
  app.quit();
}
var test = "yeet";
const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  mainWindow.loadFile(path.join(__dirname, 'html/index.html'));
  mainWindow.maximize();
};

app.on('ready', createWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.



const { MongoClient } = require('mongodb');
var ObjectId = require('mongodb').ObjectId;

var client;

ipcMain.on('db_uri', (event, uri) => {
  try {
    //client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, connectTimeoutMS: 5000});
    MongoClient.connect(uri, {
      useNewUrlParser: true, 
      useUnifiedTopology: true, 
      connectTimeoutMS: 5000},
      function (err, c) {
        if (err) {
          event.reply('db_uri', {
            status: 'err',
            message: err
          })
        }else {
          client = c;
          event.reply('db_uri', {status: 'ok'})
        }
      })
  } catch (error) {
    event.returnValue = false;
    return
  }  
})

ipcMain.on('main', (event, message) => {
  if (message == "get_object"){
    client.connect().then( client =>
      client.db().listCollections().toArray().then( function (cols) {
        var data = []
        for (c of cols){
          data.push(c.name)
        }
        event.reply('data_sync', {"type":"collections", "data":data})
      }).finally( () => client.close())
    );
  }
})

ipcMain.on("request_documents", (event, message) => {
  client.connect().then( client => 
    client.db().collection(message).find({}).toArray().then( function(docs) {
      var data = []
      for (d of docs){
        d._id = d._id.toString();
        data.push(d)
      }
      event.reply('data_sync', {"type":"documents", "data":data})
    }).finally(() => client.close())
  );
})

ipcMain.on("modify", (event, message) => {
  if (message.type == "edit") {
    query = {_id: ObjectId(message.data._id)}
    delete message.data._id
    change = {$set:message.data}

    client.connect().then( client => 
      client.db().collection(message.collection).updateOne(query, change, {upsert: false}).then( function(err, res){
        if (err) {
          event.reply('modify', { status: 'err', message: err })
        }else {
          event.reply('modify', { status: 'ok'})
        }
      }).finally(() => client.close())
    );
  } else if (message.type == "new") {
    client.connect().then( client => 
      client.db().collection(message.collection).insertOne(message.data).then( function(err, res){
        if (err) {
          event.reply('modify', { status: 'err', message: err })
        }else {
          event.reply('modify', { status: 'ok'})
        }
      }).finally(() => client.close())
    );
  }
})