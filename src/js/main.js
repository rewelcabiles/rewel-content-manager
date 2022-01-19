const connect_button = document.getElementById("accept");

const { ipcRenderer } = require('electron')

function transition_to_main (){
  document.getElementById("connectToDBPopUp").classList.add(["slide_out_down"])
  setTimeout(function(){
    //document.getElementById("connectToDBPopUp").style.display = 'none';
    dburi_vm.visible = false
    sidebar_vm.visible = true;
    //document.getElementById("sidebar-1").toggleAttribute('hidden')
    document.getElementById("sidebar-1").classList.add(["slide_in_from_left"]);
    document.getElementById("titlebar").toggleAttribute('hidden')
    document.getElementById("titlebar").classList.add(["slide_in_from_left"]);
    ipcRenderer.send('main', 'get_object');
  }, 2000); 
}




const DBUri = {
  data () {
    return {
      visible: true,
      uri: ""
    }
  },
  methods: {
    connectClicked(){
      document.getElementById("button_loading").toggleAttribute('hidden');
      connect_button.toggleAttribute('disabled')
      document.getElementById("button_text").textContent = "Connecting";

      if (ipcRenderer.sendSync('db_uri', document.getElementById("db_uri_input").value) == false) {
          document.getElementById("button_loading").toggleAttribute('hidden');
          connect_button.toggleAttribute('disabled')
          document.getElementById("button_text").textContent = "Connect";
          document.getElementById("error").toggleAttribute('hidden');
      } else{ 
        transition_to_main()
      }
    }
  }
}

dburi_vm = Vue.createApp(DBUri).mount("#connectToDBPopUp")

const Sidebar = {
  data () {
    return {
      documents: [],
      collections: [],
      selected_document: null,
      selected_collection: null,
      visible: false
    }
  },
  methods: {
    requestDocuments(collection) {
      this.selected_collection = collection
      ipcRenderer.send("request_documents", collection)
    },
    editDocument(document){
      this.selected_document= document
    },
    newDocument() {
      var newDoc = {...this.documents[0]} // Use first document as template
      console.log(this.documents[0]);
      console.log(newDoc);
      for(key in Object.keys(newDoc)){
        newDoc[key] = "";
      }
      console.log(newDoc);
      documentpanel_vm.documentData = newDoc;
      documentpanel_vm.visible = true;
    }
  }
}

sidebar_vm = Vue.createApp(Sidebar).mount('#sidebar-1')
sidebar_vm.selected_document = "B"

const DocumentPanel =  {
  data() {
    return {
      documentData: {},
      visible: false
    }
  },
  methods: {
    saveDocument() {

    },
    deleteDocument() {

    }
  }
}

documentpanel_vm = Vue.createApp(DocumentPanel).mount('#document_panel')


ipcRenderer.on('data_sync', (event, data) => {
  if (data["type"] == "collections"){ 
    sidebar_vm.collections = data["data"]
  }if (data["type"] == "documents"){
    sidebar_vm.documents = data["data"]
  }
})
